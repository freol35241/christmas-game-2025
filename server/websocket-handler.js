import { GAME_STATES, PUZZLE_LAYERS } from './constants.js';

export class WebSocketHandler {
  constructor(wss, gameState) {
    this.wss = wss;
    this.gameState = gameState;
    this.clients = new Map(); // id -> { ws, type, id }

    this.setupWebSocket();
    this.setupGameStateListeners();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      const clientId = this.generateClientId();
      console.log(`Client connected: ${clientId}`);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, ws, message);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (err) => {
        console.error(`WebSocket error for ${clientId}:`, err);
      });

      // Send current state to new client
      ws.send(JSON.stringify({
        type: 'WELCOME',
        clientId,
        state: this.gameState.getFullState()
      }));
    });
  }

  setupGameStateListeners() {
    this.gameState.on('stateChange', (state) => {
      this.broadcast({ type: 'STATE_CHANGE', state });
    });

    this.gameState.on('puzzleAttemptFailed', (data) => {
      this.broadcast({ type: 'PUZZLE_ATTEMPT_FAILED', ...data });
    });

    this.gameState.on('physicalAttemptFailed', (data) => {
      this.broadcast({ type: 'PHYSICAL_ATTEMPT_FAILED', ...data });
    });

    this.gameState.on('gameComplete', (data) => {
      this.broadcast({ type: 'GAME_COMPLETE', ...data });
    });
  }

  handleMessage(clientId, ws, message) {
    console.log(`Message from ${clientId}:`, message.type);

    switch (message.type) {
      case 'REGISTER':
        this.handleRegister(clientId, ws, message);
        break;

      case 'START_GAME':
        this.gameState.startGame();
        break;

      case 'START_MEMORY':
        this.gameState.startMemory(message.memoryIndex || 0);
        break;

      case 'START_PUZZLE':
        this.gameState.startPuzzleLayer(message.layer || PUZZLE_LAYERS.KIDS);
        break;

      case 'PUZZLE_COMPLETE':
        this.gameState.recordPuzzleAttempt(message.success);
        break;

      case 'PHYSICAL_COMPLETE':
        this.gameState.completePhysicalChallenge(message.success);
        break;

      case 'NEXT_STATE':
        this.handleNextState();
        break;

      case 'NEXT_MEMORY':
        this.gameState.nextMemory();
        break;

      case 'DETECTION_UPDATE':
        // Forward camera detection to TV
        this.sendToType('tv', {
          type: 'DETECTION_UPDATE',
          ...message.data
        });
        break;

      case 'SKIP_TO_MEMORY':
        this.gameState.skipToMemory(message.memoryIndex);
        break;

      case 'RESET':
        this.gameState.reset();
        this.broadcast({ type: 'GAME_RESET' });
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handleRegister(clientId, ws, message) {
    const { deviceType } = message;
    this.clients.set(clientId, { ws, type: deviceType, id: clientId });
    this.gameState.registerDevice(deviceType, clientId);

    ws.send(JSON.stringify({
      type: 'REGISTERED',
      clientId,
      deviceType,
      state: this.gameState.getFullState()
    }));

    console.log(`Registered ${deviceType}: ${clientId}`);
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      this.gameState.unregisterDevice(clientId);
      this.clients.delete(clientId);
      console.log(`Client disconnected: ${clientId} (${client.type})`);
    }
  }

  handleNextState() {
    const state = this.gameState.state;

    switch (state) {
      case GAME_STATES.INIT:
        this.gameState.startGame();
        break;

      case GAME_STATES.INTRO:
        this.gameState.startMemory(0);
        break;

      case GAME_STATES.MEMORY_INTRO:
        this.gameState.startPuzzleLayer(PUZZLE_LAYERS.KIDS);
        break;

      case GAME_STATES.MEMORY_PUZZLE:
        // This is handled by PUZZLE_COMPLETE
        break;

      case GAME_STATES.MEMORY_PHYSICAL:
        // This is handled by PHYSICAL_COMPLETE
        break;

      case GAME_STATES.MEMORY_RESOLUTION:
        this.gameState.nextMemory();
        break;

      case GAME_STATES.ENDING:
        this.gameState.reset();
        break;
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        client.ws.send(data);
      }
    });
  }

  sendToType(type, message) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.type === type && client.ws.readyState === 1) {
        client.ws.send(data);
      }
    });
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message));
    }
  }

  getConnectionCount() {
    return this.clients.size;
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

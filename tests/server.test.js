import { jest } from '@jest/globals';

// Mock WebSocket
class MockWebSocket {
  constructor() {
    this.readyState = 1; // OPEN
    this.sent = [];
  }

  send(data) {
    this.sent.push(JSON.parse(data));
  }
}

class MockWebSocketServer {
  constructor() {
    this.clients = new Map();
    this.handlers = {};
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  simulateConnection(ws) {
    if (this.handlers.connection) {
      this.handlers.connection(ws);
    }
  }
}

describe('WebSocketHandler', () => {
  let WebSocketHandler;
  let GameState;
  let handler;
  let mockWss;
  let gameState;

  beforeAll(async () => {
    const wsModule = await import('../server/websocket-handler.js');
    const gsModule = await import('../server/game-state.js');
    WebSocketHandler = wsModule.WebSocketHandler;
    GameState = gsModule.GameState;
  });

  beforeEach(() => {
    mockWss = new MockWebSocketServer();
    gameState = new GameState();
    handler = new WebSocketHandler(mockWss, gameState);
  });

  describe('client connection', () => {
    test('should send WELCOME message on connection', () => {
      const mockWs = new MockWebSocket();
      mockWs.on = jest.fn();

      mockWss.simulateConnection(mockWs);

      expect(mockWs.sent).toHaveLength(1);
      expect(mockWs.sent[0].type).toBe('WELCOME');
      expect(mockWs.sent[0]).toHaveProperty('clientId');
      expect(mockWs.sent[0]).toHaveProperty('state');
    });
  });

  describe('getConnectionCount', () => {
    test('should return 0 with no connections', () => {
      expect(handler.getConnectionCount()).toBe(0);
    });
  });

  describe('generateClientId', () => {
    test('should generate unique IDs', () => {
      const id1 = handler.generateClientId();
      const id2 = handler.generateClientId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^client_/);
    });
  });

  describe('broadcast', () => {
    test('should send message to all connected clients', () => {
      const mockWs1 = new MockWebSocket();
      const mockWs2 = new MockWebSocket();

      handler.clients.set('client1', { ws: mockWs1, type: 'tv', id: 'client1' });
      handler.clients.set('client2', { ws: mockWs2, type: 'tablet', id: 'client2' });

      handler.broadcast({ type: 'TEST', data: 'hello' });

      expect(mockWs1.sent).toContainEqual({ type: 'TEST', data: 'hello' });
      expect(mockWs2.sent).toContainEqual({ type: 'TEST', data: 'hello' });
    });

    test('should not send to closed connections', () => {
      const mockWs = new MockWebSocket();
      mockWs.readyState = 3; // CLOSED

      handler.clients.set('client1', { ws: mockWs, type: 'tv', id: 'client1' });
      handler.broadcast({ type: 'TEST' });

      expect(mockWs.sent).toHaveLength(0);
    });
  });

  describe('sendToType', () => {
    test('should send only to specified device type', () => {
      const mockTv = new MockWebSocket();
      const mockTablet = new MockWebSocket();

      handler.clients.set('tv1', { ws: mockTv, type: 'tv', id: 'tv1' });
      handler.clients.set('tablet1', { ws: mockTablet, type: 'tablet', id: 'tablet1' });

      handler.sendToType('tv', { type: 'TV_ONLY' });

      expect(mockTv.sent).toContainEqual({ type: 'TV_ONLY' });
      expect(mockTablet.sent).not.toContainEqual({ type: 'TV_ONLY' });
    });
  });
});

describe('Express server', () => {
  let app;

  beforeAll(async () => {
    const serverModule = await import('../server/index.js');
    app = serverModule.app;
  });

  // Note: Full HTTP tests would require supertest
  // These are placeholder structure tests

  test('app should be defined', () => {
    expect(app).toBeDefined();
  });
});

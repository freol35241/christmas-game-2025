import { EventEmitter } from 'events';
import { MEMORIES, GAME_STATES, PUZZLE_LAYERS } from './constants.js';

export class GameState extends EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.state = GAME_STATES.INIT;
    this.currentMemory = 0;
    this.currentPuzzleLayer = null;
    this.completedMemories = [];
    this.puzzleAttempts = 0;
    this.physicalAttempts = 0;
    this.connectedDevices = {
      tv: null,
      tablets: []
    };
    this.emit('reset');
  }

  getFullState() {
    return {
      state: this.state,
      currentMemory: this.currentMemory,
      currentPuzzleLayer: this.currentPuzzleLayer,
      completedMemories: this.completedMemories,
      puzzleAttempts: this.puzzleAttempts,
      physicalAttempts: this.physicalAttempts,
      memoryData: this.currentMemory >= 0 && this.currentMemory < MEMORIES.length
        ? MEMORIES[this.currentMemory]
        : null
    };
  }

  getCurrentMemoryData() {
    if (this.currentMemory >= 0 && this.currentMemory < MEMORIES.length) {
      return MEMORIES[this.currentMemory];
    }
    return null;
  }

  // State transitions
  startGame() {
    this.state = GAME_STATES.INTRO;
    this.emit('stateChange', this.getFullState());
  }

  startMemory(memoryIndex = 0) {
    if (memoryIndex >= MEMORIES.length) {
      this.endGame();
      return;
    }
    this.currentMemory = memoryIndex;
    this.state = GAME_STATES.MEMORY_INTRO;
    this.puzzleAttempts = 0;
    this.emit('stateChange', this.getFullState());
  }

  startPuzzleLayer(layer) {
    if (!Object.values(PUZZLE_LAYERS).includes(layer)) {
      throw new Error(`Invalid puzzle layer: ${layer}`);
    }
    this.currentPuzzleLayer = layer;
    this.state = GAME_STATES.MEMORY_PUZZLE;
    this.puzzleAttempts = 0;
    this.emit('stateChange', this.getFullState());
  }

  completePuzzleLayer() {
    const layers = Object.values(PUZZLE_LAYERS);
    const currentIndex = layers.indexOf(this.currentPuzzleLayer);

    if (currentIndex < layers.length - 1) {
      // Move to next puzzle layer
      this.startPuzzleLayer(layers[currentIndex + 1]);
    } else {
      // All puzzle layers complete, start physical challenge
      this.startPhysicalChallenge();
    }
  }

  startPhysicalChallenge() {
    this.state = GAME_STATES.MEMORY_PHYSICAL;
    this.physicalAttempts = 0;
    this.emit('stateChange', this.getFullState());
  }

  completePhysicalChallenge(success = true) {
    if (!success) {
      this.physicalAttempts++;
      if (this.physicalAttempts >= 3) {
        // Auto-pass after 3 attempts
        success = true;
      }
    }

    if (success) {
      this.completeMemory();
    } else {
      this.emit('physicalAttemptFailed', {
        attempts: this.physicalAttempts,
        maxAttempts: 3
      });
    }
  }

  completeMemory() {
    this.completedMemories.push(this.currentMemory);
    this.state = GAME_STATES.MEMORY_RESOLUTION;
    this.emit('stateChange', this.getFullState());
  }

  nextMemory() {
    const nextIndex = this.currentMemory + 1;
    if (nextIndex >= MEMORIES.length) {
      this.endGame();
    } else {
      this.startMemory(nextIndex);
    }
  }

  endGame() {
    this.state = GAME_STATES.ENDING;
    this.emit('stateChange', this.getFullState());
    this.emit('gameComplete', {
      completedMemories: this.completedMemories
    });
  }

  // Puzzle attempt tracking
  recordPuzzleAttempt(success) {
    this.puzzleAttempts++;
    if (success) {
      this.completePuzzleLayer();
    } else {
      this.emit('puzzleAttemptFailed', {
        attempts: this.puzzleAttempts,
        layer: this.currentPuzzleLayer
      });
    }
  }

  // Device management
  registerDevice(type, id) {
    if (type === 'tv') {
      this.connectedDevices.tv = id;
    } else if (type === 'tablet') {
      if (!this.connectedDevices.tablets.includes(id)) {
        this.connectedDevices.tablets.push(id);
      }
    }
    this.emit('deviceConnected', { type, id });
  }

  unregisterDevice(id) {
    if (this.connectedDevices.tv === id) {
      this.connectedDevices.tv = null;
    }
    this.connectedDevices.tablets = this.connectedDevices.tablets.filter(t => t !== id);
    this.emit('deviceDisconnected', { id });
  }

  // Debug/testing helpers
  skipToMemory(memoryIndex) {
    if (memoryIndex >= 0 && memoryIndex < MEMORIES.length) {
      this.currentMemory = memoryIndex;
      this.state = GAME_STATES.MEMORY_INTRO;
      this.emit('stateChange', this.getFullState());
    }
  }

  skipToState(state) {
    if (Object.values(GAME_STATES).includes(state)) {
      this.state = state;
      this.emit('stateChange', this.getFullState());
    }
  }
}

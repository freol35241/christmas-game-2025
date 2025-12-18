import { GameState } from '../server/game-state.js';
import { GAME_STATES, PUZZLE_LAYERS, MEMORIES } from '../server/constants.js';

describe('GameState', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('initialization', () => {
    test('should initialize with INIT state', () => {
      expect(gameState.state).toBe(GAME_STATES.INIT);
    });

    test('should start with memory 0', () => {
      expect(gameState.currentMemory).toBe(0);
    });

    test('should have no completed memories', () => {
      expect(gameState.completedMemories).toHaveLength(0);
    });
  });

  describe('startGame', () => {
    test('should transition to INTRO state', () => {
      gameState.startGame();
      expect(gameState.state).toBe(GAME_STATES.INTRO);
    });

    test('should emit stateChange event', (done) => {
      gameState.on('stateChange', (state) => {
        expect(state.state).toBe(GAME_STATES.INTRO);
        done();
      });
      gameState.startGame();
    });
  });

  describe('startMemory', () => {
    test('should set current memory index', () => {
      gameState.startMemory(3);
      expect(gameState.currentMemory).toBe(3);
    });

    test('should transition to MEMORY_INTRO state', () => {
      gameState.startMemory(0);
      expect(gameState.state).toBe(GAME_STATES.MEMORY_INTRO);
    });

    test('should reset puzzle attempts', () => {
      gameState.puzzleAttempts = 5;
      gameState.startMemory(0);
      expect(gameState.puzzleAttempts).toBe(0);
    });

    test('should end game if memory index exceeds available memories', () => {
      gameState.startMemory(MEMORIES.length);
      expect(gameState.state).toBe(GAME_STATES.ENDING);
    });
  });

  describe('startPuzzleLayer', () => {
    test('should set puzzle layer to KIDS', () => {
      gameState.startPuzzleLayer(PUZZLE_LAYERS.KIDS);
      expect(gameState.currentPuzzleLayer).toBe(PUZZLE_LAYERS.KIDS);
    });

    test('should transition to MEMORY_PUZZLE state', () => {
      gameState.startPuzzleLayer(PUZZLE_LAYERS.KIDS);
      expect(gameState.state).toBe(GAME_STATES.MEMORY_PUZZLE);
    });

    test('should throw error for invalid puzzle layer', () => {
      expect(() => {
        gameState.startPuzzleLayer('INVALID');
      }).toThrow('Invalid puzzle layer');
    });
  });

  describe('completePuzzleLayer', () => {
    test('should advance from KIDS to ADULTS', () => {
      gameState.startPuzzleLayer(PUZZLE_LAYERS.KIDS);
      gameState.completePuzzleLayer();
      expect(gameState.currentPuzzleLayer).toBe(PUZZLE_LAYERS.ADULTS);
    });

    test('should advance from ADULTS to TOGETHER', () => {
      gameState.startPuzzleLayer(PUZZLE_LAYERS.ADULTS);
      gameState.completePuzzleLayer();
      expect(gameState.currentPuzzleLayer).toBe(PUZZLE_LAYERS.TOGETHER);
    });

    test('should start physical challenge after TOGETHER', () => {
      gameState.startPuzzleLayer(PUZZLE_LAYERS.TOGETHER);
      gameState.completePuzzleLayer();
      expect(gameState.state).toBe(GAME_STATES.MEMORY_PHYSICAL);
    });
  });

  describe('startPhysicalChallenge', () => {
    test('should transition to MEMORY_PHYSICAL state', () => {
      gameState.startPhysicalChallenge();
      expect(gameState.state).toBe(GAME_STATES.MEMORY_PHYSICAL);
    });

    test('should reset physical attempts', () => {
      gameState.physicalAttempts = 2;
      gameState.startPhysicalChallenge();
      expect(gameState.physicalAttempts).toBe(0);
    });
  });

  describe('completePhysicalChallenge', () => {
    beforeEach(() => {
      gameState.startMemory(0);
      gameState.startPhysicalChallenge();
    });

    test('should complete memory on success', () => {
      gameState.completePhysicalChallenge(true);
      expect(gameState.state).toBe(GAME_STATES.MEMORY_RESOLUTION);
      expect(gameState.completedMemories).toContain(0);
    });

    test('should increment attempts on failure', () => {
      gameState.completePhysicalChallenge(false);
      expect(gameState.physicalAttempts).toBe(1);
    });

    test('should auto-pass after 3 failed attempts', () => {
      gameState.completePhysicalChallenge(false);
      gameState.completePhysicalChallenge(false);
      gameState.completePhysicalChallenge(false);
      expect(gameState.state).toBe(GAME_STATES.MEMORY_RESOLUTION);
    });

    test('should emit physicalAttemptFailed on failure', (done) => {
      gameState.on('physicalAttemptFailed', (data) => {
        expect(data.attempts).toBe(1);
        expect(data.maxAttempts).toBe(3);
        done();
      });
      gameState.completePhysicalChallenge(false);
    });
  });

  describe('nextMemory', () => {
    beforeEach(() => {
      gameState.startMemory(0);
    });

    test('should advance to next memory', () => {
      gameState.nextMemory();
      expect(gameState.currentMemory).toBe(1);
      expect(gameState.state).toBe(GAME_STATES.MEMORY_INTRO);
    });

    test('should end game after last memory', () => {
      gameState.currentMemory = MEMORIES.length - 1;
      gameState.nextMemory();
      expect(gameState.state).toBe(GAME_STATES.ENDING);
    });
  });

  describe('reset', () => {
    test('should reset all state to initial values', () => {
      gameState.startGame();
      gameState.startMemory(3);
      gameState.completedMemories.push(0, 1, 2);
      gameState.puzzleAttempts = 5;

      gameState.reset();

      expect(gameState.state).toBe(GAME_STATES.INIT);
      expect(gameState.currentMemory).toBe(0);
      expect(gameState.completedMemories).toHaveLength(0);
      expect(gameState.puzzleAttempts).toBe(0);
    });

    test('should emit reset event', (done) => {
      gameState.on('reset', () => {
        done();
      });
      gameState.reset();
    });
  });

  describe('getFullState', () => {
    test('should return complete state object', () => {
      gameState.startMemory(2);
      const state = gameState.getFullState();

      expect(state).toHaveProperty('state');
      expect(state).toHaveProperty('currentMemory', 2);
      expect(state).toHaveProperty('memoryData');
      expect(state.memoryData.id).toBe(2);
    });
  });

  describe('getCurrentMemoryData', () => {
    test('should return correct memory data', () => {
      gameState.currentMemory = 1;
      const data = gameState.getCurrentMemoryData();
      expect(data.id).toBe(1);
      expect(data.name).toBe('Lucia');
    });

    test('should return null for invalid memory index', () => {
      gameState.currentMemory = -1;
      expect(gameState.getCurrentMemoryData()).toBeNull();

      gameState.currentMemory = 100;
      expect(gameState.getCurrentMemoryData()).toBeNull();
    });
  });

  describe('device management', () => {
    test('should register TV device', () => {
      gameState.registerDevice('tv', 'tv_123');
      expect(gameState.connectedDevices.tv).toBe('tv_123');
    });

    test('should register tablet device', () => {
      gameState.registerDevice('tablet', 'tablet_456');
      expect(gameState.connectedDevices.tablets).toContain('tablet_456');
    });

    test('should not duplicate tablet registration', () => {
      gameState.registerDevice('tablet', 'tablet_456');
      gameState.registerDevice('tablet', 'tablet_456');
      expect(gameState.connectedDevices.tablets).toHaveLength(1);
    });

    test('should unregister devices', () => {
      gameState.registerDevice('tv', 'tv_123');
      gameState.registerDevice('tablet', 'tablet_456');

      gameState.unregisterDevice('tv_123');
      expect(gameState.connectedDevices.tv).toBeNull();

      gameState.unregisterDevice('tablet_456');
      expect(gameState.connectedDevices.tablets).not.toContain('tablet_456');
    });
  });

  describe('debug helpers', () => {
    test('skipToMemory should jump to specific memory', () => {
      gameState.skipToMemory(5);
      expect(gameState.currentMemory).toBe(5);
      expect(gameState.state).toBe(GAME_STATES.MEMORY_INTRO);
    });

    test('skipToState should change state directly', () => {
      gameState.skipToState(GAME_STATES.ENDING);
      expect(gameState.state).toBe(GAME_STATES.ENDING);
    });
  });
});

describe('MEMORIES constant', () => {
  test('should have 7 memories', () => {
    expect(MEMORIES).toHaveLength(7);
  });

  test('each memory should have required properties', () => {
    MEMORIES.forEach((memory, index) => {
      expect(memory).toHaveProperty('id', index);
      expect(memory).toHaveProperty('name');
      expect(memory).toHaveProperty('intro.problem');
      expect(memory).toHaveProperty('intro.hint');
      expect(memory).toHaveProperty('puzzles.kids');
      expect(memory).toHaveProperty('puzzles.adults');
      expect(memory).toHaveProperty('puzzles.together');
      expect(memory).toHaveProperty('physical');
      expect(memory).toHaveProperty('resolution.success');
    });
  });

  test('all cipher puzzles should have valid answers', () => {
    MEMORIES.forEach((memory) => {
      const cipher = memory.puzzles.adults;
      expect(cipher.type).toBe('CIPHER');
      expect(cipher.cipher).toBeTruthy();
      expect(cipher.answer).toBeTruthy();
    });
  });
});

import { GAME_STATES, PUZZLE_LAYERS, PUZZLE_TYPES } from '../shared/constants.js';
import { DragDropPuzzle } from './puzzles/drag-drop.js';
import { CipherPuzzle } from './puzzles/cipher.js';
import { LocationSelectPuzzle } from './puzzles/location-select.js';
import { TapTargetsPuzzle } from './puzzles/tap-targets.js';
import { SequencePuzzle } from './puzzles/sequence.js';

export class TabletController {
  constructor(ws, initialState) {
    this.ws = ws;
    this.state = initialState;

    this.waitingScreen = document.getElementById('tablet-waiting');
    this.puzzleContainer = document.getElementById('tablet-puzzle');

    this.currentPuzzle = null;

    this.init();
  }

  init() {
    // Set up WebSocket listeners for puzzle-specific messages
    this.ws.on('PUZZLE_ATTEMPT_FAILED', (data) => {
      if (this.currentPuzzle) {
        this.currentPuzzle.showError();
      }
    });

    // Initial state handling
    this.onStateChange(this.state);
  }

  onStateChange(newState) {
    this.state = newState;

    if (newState.state === GAME_STATES.MEMORY_PUZZLE) {
      this.showPuzzle(newState);
    } else {
      this.showWaiting(newState);
    }
  }

  onReset() {
    this.showWaiting({ state: GAME_STATES.INIT });
    if (this.currentPuzzle) {
      this.currentPuzzle.destroy();
      this.currentPuzzle = null;
    }
  }

  showWaiting(state) {
    this.waitingScreen.classList.add('active');
    this.puzzleContainer.classList.remove('active');

    // Update waiting message based on state
    const waitingContent = this.waitingScreen.querySelector('.waiting-content p');
    if (waitingContent) {
      switch (state.state) {
        case GAME_STATES.INIT:
          waitingContent.textContent = '[SWEDISH: Väntar på att spelet ska starta...]';
          break;
        case GAME_STATES.INTRO:
          waitingContent.textContent = '[SWEDISH: Spelet börjar snart...]';
          break;
        case GAME_STATES.MEMORY_INTRO:
          waitingContent.textContent = '[SWEDISH: Gör er redo för pusslet...]';
          break;
        case GAME_STATES.MEMORY_PHYSICAL:
          waitingContent.textContent = '[SWEDISH: Fysisk utmaning pågår!]';
          break;
        case GAME_STATES.MEMORY_RESOLUTION:
          waitingContent.textContent = '[SWEDISH: Bra jobbat! 🎉]';
          break;
        case GAME_STATES.ENDING:
          waitingContent.textContent = '[SWEDISH: Grattis! Ni klarade det! 🎄]';
          break;
        default:
          waitingContent.textContent = '[SWEDISH: Väntar...]';
      }
    }

    if (this.currentPuzzle) {
      this.currentPuzzle.destroy();
      this.currentPuzzle = null;
    }
  }

  showPuzzle(state) {
    this.waitingScreen.classList.remove('active');
    this.puzzleContainer.classList.add('active');

    const memoryData = state.memoryData;
    const layer = state.currentPuzzleLayer;

    if (!memoryData || !layer) return;

    // Get puzzle config for current layer
    let puzzleConfig;
    switch (layer) {
      case PUZZLE_LAYERS.KIDS:
        puzzleConfig = memoryData.puzzles.kids;
        break;
      case PUZZLE_LAYERS.ADULTS:
        puzzleConfig = memoryData.puzzles.adults;
        break;
      case PUZZLE_LAYERS.TOGETHER:
        puzzleConfig = memoryData.puzzles.together;
        break;
    }

    if (!puzzleConfig) return;

    // Create appropriate puzzle
    this.createPuzzle(puzzleConfig, layer);
  }

  createPuzzle(config, layer) {
    // Clear previous puzzle
    if (this.currentPuzzle) {
      this.currentPuzzle.destroy();
    }
    this.puzzleContainer.innerHTML = '';

    // Create puzzle based on type
    switch (config.type) {
      case PUZZLE_TYPES.DRAG_DROP:
        this.currentPuzzle = new DragDropPuzzle(
          this.puzzleContainer,
          config,
          (success) => this.onPuzzleComplete(success)
        );
        break;

      case PUZZLE_TYPES.CIPHER:
        this.currentPuzzle = new CipherPuzzle(
          this.puzzleContainer,
          config,
          (success) => this.onPuzzleComplete(success)
        );
        break;

      case PUZZLE_TYPES.LOCATION_SELECT:
        this.currentPuzzle = new LocationSelectPuzzle(
          this.puzzleContainer,
          config,
          (success) => this.onPuzzleComplete(success)
        );
        break;

      case PUZZLE_TYPES.TAP_TARGETS:
        this.currentPuzzle = new TapTargetsPuzzle(
          this.puzzleContainer,
          config,
          (success) => this.onPuzzleComplete(success)
        );
        break;

      case PUZZLE_TYPES.SEQUENCE:
        this.currentPuzzle = new SequencePuzzle(
          this.puzzleContainer,
          config,
          (success) => this.onPuzzleComplete(success)
        );
        break;

      default:
        console.error('Unknown puzzle type:', config.type);
    }

    // Add layer indicator
    this.addLayerIndicator(layer);
  }

  addLayerIndicator(layer) {
    const indicator = document.createElement('div');
    indicator.className = 'layer-indicator';

    let label = '';
    switch (layer) {
      case PUZZLE_LAYERS.KIDS:
        label = '👶 [SWEDISH: Barnens pussel]';
        break;
      case PUZZLE_LAYERS.ADULTS:
        label = '👨‍👩‍👧‍👦 [SWEDISH: De vuxnas pussel]';
        break;
      case PUZZLE_LAYERS.TOGETHER:
        label = '🏠 [SWEDISH: Familjens pussel]';
        break;
    }

    indicator.textContent = label;
    this.puzzleContainer.insertBefore(indicator, this.puzzleContainer.firstChild);
  }

  onPuzzleComplete(success) {
    this.ws.send({
      type: 'PUZZLE_COMPLETE',
      success
    });
  }
}

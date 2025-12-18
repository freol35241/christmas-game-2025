import { GAME_STATES, PUZZLE_LAYERS, COLORS } from '../shared/constants.js';
import { CanvasRenderer } from '../shared/canvas-utils.js';
import { IntroScene } from './scenes/intro.js';
import { MemoryIntroScene } from './scenes/memory-intro.js';
import { WaitingScene } from './scenes/waiting.js';
import { PhysicalChallengeScene } from './scenes/physical-challenge.js';
import { ResolutionScene } from './scenes/resolution.js';
import { EndingScene } from './scenes/ending.js';

export class TVController {
  constructor(ws, initialState) {
    this.ws = ws;
    this.state = initialState;

    this.canvas = document.getElementById('tv-canvas');
    this.ui = document.getElementById('tv-ui');
    this.renderer = new CanvasRenderer(this.canvas);

    this.currentScene = null;
    this.scenes = {};

    this.init();
  }

  init() {
    // Initialize scenes
    this.scenes = {
      intro: new IntroScene(this.renderer, this.ws),
      memoryIntro: new MemoryIntroScene(this.renderer, this.ws),
      waiting: new WaitingScene(this.renderer, this.ws),
      physical: new PhysicalChallengeScene(this.renderer, this.ws),
      resolution: new ResolutionScene(this.renderer, this.ws),
      ending: new EndingScene(this.renderer, this.ws)
    };

    // Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));

    // Initial render based on state
    this.onStateChange(this.state);
  }

  handleKeyPress(e) {
    switch (e.key) {
      case ' ':
        // Space advances state
        e.preventDefault();
        this.ws.send({ type: 'NEXT_STATE' });
        break;
      case 'r':
        // R resets game
        if (e.ctrlKey) {
          e.preventDefault();
          this.ws.send({ type: 'RESET' });
        }
        break;
      case 'p':
        // P passes physical challenge
        this.ws.send({ type: 'PHYSICAL_COMPLETE', success: true });
        break;
    }
  }

  onStateChange(newState) {
    this.state = newState;

    // Stop current scene
    if (this.currentScene) {
      this.currentScene.stop();
    }

    // Determine which scene to show
    switch (newState.state) {
      case GAME_STATES.INIT:
        this.showScene('intro', newState);
        break;

      case GAME_STATES.INTRO:
        this.showScene('intro', newState);
        break;

      case GAME_STATES.MEMORY_INTRO:
        this.showScene('memoryIntro', newState);
        break;

      case GAME_STATES.MEMORY_PUZZLE:
        // Show waiting screen while tablet solves puzzle
        this.showScene('waiting', newState);
        break;

      case GAME_STATES.MEMORY_PHYSICAL:
        this.showScene('physical', newState);
        break;

      case GAME_STATES.MEMORY_RESOLUTION:
        this.showScene('resolution', newState);
        break;

      case GAME_STATES.ENDING:
        this.showScene('ending', newState);
        break;
    }
  }

  showScene(sceneName, state) {
    const scene = this.scenes[sceneName];
    if (scene) {
      this.currentScene = scene;
      scene.start(state);
    }
  }

  onReset() {
    if (this.currentScene) {
      this.currentScene.stop();
    }
    this.showScene('intro', { state: GAME_STATES.INIT });
  }
}

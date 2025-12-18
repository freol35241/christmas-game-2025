import { WebSocketClient } from './websocket.js';
import { TVController } from './tv/tv-controller.js';
import { TabletController } from './tablet/tablet-controller.js';

class Game {
  constructor() {
    this.mode = null;
    this.ws = null;
    this.controller = null;

    this.init();
  }

  init() {
    // Check URL params for mode
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');

    if (modeParam === 'tv' || modeParam === 'tablet') {
      this.selectMode(modeParam);
    } else {
      this.showDeviceSelect();
    }

    // Debug mode with 'd' key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'd' && e.ctrlKey) {
        this.toggleDebug();
      }
    });
  }

  showDeviceSelect() {
    document.getElementById('device-select').classList.add('active');

    document.getElementById('btn-tv').addEventListener('click', () => {
      this.selectMode('tv');
    });

    document.getElementById('btn-tablet').addEventListener('click', () => {
      this.selectMode('tablet');
    });
  }

  selectMode(mode) {
    this.mode = mode;

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('mode', mode);
    window.history.pushState({}, '', url);

    // Hide device select
    document.getElementById('device-select').classList.remove('active');

    // Show appropriate container
    if (mode === 'tv') {
      document.getElementById('tv-container').classList.add('active');
      document.body.classList.add('tv-mode');
    } else {
      document.getElementById('tablet-container').classList.add('active');
      document.body.classList.add('tablet-mode');
    }

    // Connect to WebSocket
    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocketClient(wsUrl);

    this.ws.on('open', () => {
      console.log('Connected to server');
      this.ws.send({
        type: 'REGISTER',
        deviceType: this.mode
      });
    });

    this.ws.on('REGISTERED', (data) => {
      console.log('Registered as:', data.deviceType);
      this.initController(data.state);
    });

    this.ws.on('STATE_CHANGE', (data) => {
      if (this.controller) {
        this.controller.onStateChange(data.state);
      }
      this.updateDebug(data.state);
    });

    this.ws.on('GAME_RESET', () => {
      if (this.controller) {
        this.controller.onReset();
      }
    });

    this.ws.on('close', () => {
      console.log('Disconnected from server');
      // Show reconnecting message
    });

    this.ws.connect();
  }

  initController(initialState) {
    if (this.mode === 'tv') {
      this.controller = new TVController(this.ws, initialState);
    } else {
      this.controller = new TabletController(this.ws, initialState);
    }

    this.setupDebug();
    this.updateDebug(initialState);
  }

  setupDebug() {
    const debugNext = document.getElementById('debug-next');
    const debugReset = document.getElementById('debug-reset');
    const debugSkip = document.getElementById('debug-skip-physical');

    if (debugNext) {
      debugNext.addEventListener('click', () => {
        this.ws.send({ type: 'NEXT_STATE' });
      });
    }

    if (debugReset) {
      debugReset.addEventListener('click', () => {
        this.ws.send({ type: 'RESET' });
      });
    }

    if (debugSkip) {
      debugSkip.addEventListener('click', () => {
        this.ws.send({ type: 'PHYSICAL_COMPLETE', success: true });
      });
    }
  }

  toggleDebug() {
    const panel = document.getElementById('debug-panel');
    panel.classList.toggle('hidden');
  }

  updateDebug(state) {
    const debugState = document.getElementById('debug-state');
    if (debugState && state) {
      debugState.innerHTML = `
        <p>State: ${state.state}</p>
        <p>Memory: ${state.currentMemory + 1}/7</p>
        <p>Layer: ${state.currentPuzzleLayer || '-'}</p>
      `;
    }
  }
}

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});

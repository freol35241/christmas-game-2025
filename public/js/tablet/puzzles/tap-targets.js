import { COLORS } from '../../shared/constants.js';

export class TapTargetsPuzzle {
  constructor(container, config, onComplete) {
    this.container = container;
    this.config = config;
    this.onComplete = onComplete;

    this.tappedTargets = [];
    this.nextExpected = this.config.ordered ? 1 : null;

    this.render();
  }

  render() {
    const isOrdered = this.config.ordered;
    const isHidden = this.config.targets.some(t => t.hidden);

    this.container.innerHTML = `
      <div class="puzzle tap-targets-puzzle ${isHidden ? 'hidden-targets' : ''}">
        <h2 class="puzzle-instruction">${this.config.instruction}</h2>

        <div class="tap-area" id="tap-area">
          ${this.config.targets.map(target => `
            <div
              class="tap-target ${isHidden ? 'hidden' : ''}"
              data-id="${target.id}"
              style="left: ${target.x * 100}%; top: ${target.y * 100}%;"
            >
              ${isOrdered && !isHidden ? target.id : ''}
              ${isHidden ? '🦌' : '🕯️'}
            </div>
          `).join('')}
        </div>

        <div class="puzzle-progress">
          <span id="progress-count">0</span> / ${this.config.targets.length}
        </div>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    const targets = this.container.querySelectorAll('.tap-target');

    targets.forEach(target => {
      target.addEventListener('click', () => this.handleTap(target));
      target.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handleTap(target);
      });
    });
  }

  handleTap(target) {
    const id = parseInt(target.dataset.id);

    // Already tapped?
    if (this.tappedTargets.includes(id)) {
      return;
    }

    if (this.config.ordered) {
      // Must tap in order
      if (id === this.nextExpected) {
        this.markTapped(target, id);
        this.nextExpected++;
      } else {
        // Wrong order
        target.classList.add('incorrect', 'shake');
        this.showFeedback(false);
        setTimeout(() => {
          target.classList.remove('incorrect', 'shake');
        }, 500);
      }
    } else {
      // Any order is fine (hidden targets)
      this.markTapped(target, id);
    }
  }

  markTapped(target, id) {
    this.tappedTargets.push(id);
    target.classList.add('tapped');
    this.showFeedback(true);

    // Update progress
    this.container.querySelector('#progress-count').textContent = this.tappedTargets.length;

    // Check completion
    if (this.tappedTargets.length >= this.config.targets.length) {
      setTimeout(() => {
        this.onComplete(true);
      }, 500);
    }
  }

  showFeedback(success) {
    const feedback = document.createElement('div');
    feedback.className = `puzzle-feedback ${success ? 'success' : 'error'}`;
    feedback.textContent = success ? '✓' : '✗';
    this.container.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 500);
  }

  showError() {
    const puzzle = this.container.querySelector('.puzzle');
    puzzle.classList.add('shake');
    setTimeout(() => {
      puzzle.classList.remove('shake');
    }, 500);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

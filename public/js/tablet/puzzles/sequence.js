export class SequencePuzzle {
  constructor(container, config, onComplete) {
    this.container = container;
    this.config = config;
    this.onComplete = onComplete;

    this.sequence = config.sequence;
    this.colors = config.colors;
    this.currentIndex = 0;
    this.playerSequence = [];
    this.isShowingSequence = false;

    this.render();
  }

  render() {
    const colorEntries = Object.entries(this.colors);

    this.container.innerHTML = `
      <div class="puzzle sequence-puzzle">
        <h2 class="puzzle-instruction">${this.config.instruction}</h2>

        <div class="sequence-display" id="sequence-display">
          <p>[SWEDISH: Se på sekvensen...]</p>
        </div>

        <div class="sequence-buttons" id="sequence-buttons">
          ${colorEntries.map(([name, color]) => `
            <button
              class="sequence-btn"
              data-color="${name}"
              style="background-color: ${color};"
              disabled
            ></button>
          `).join('')}
        </div>

        <div class="sequence-progress">
          <span id="progress-count">0</span> / ${this.sequence.length}
        </div>

        <button id="start-btn" class="puzzle-button">
          [SWEDISH: Starta]
        </button>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    const startBtn = this.container.querySelector('#start-btn');
    const buttons = this.container.querySelectorAll('.sequence-btn');

    startBtn.addEventListener('click', () => {
      startBtn.style.display = 'none';
      this.showSequence();
    });

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.isShowingSequence) {
          this.handleButtonPress(btn.dataset.color);
        }
      });
    });
  }

  async showSequence() {
    this.isShowingSequence = true;
    const display = this.container.querySelector('#sequence-display p');
    display.textContent = '[SWEDISH: Titta noga...]';

    // Disable buttons during sequence
    const buttons = this.container.querySelectorAll('.sequence-btn');
    buttons.forEach(btn => btn.disabled = true);

    // Show sequence one at a time
    for (let i = 0; i <= this.currentIndex; i++) {
      await this.delay(500);
      await this.flashColor(this.sequence[i]);
    }

    await this.delay(300);

    // Enable buttons for player input
    display.textContent = '[SWEDISH: Din tur! Tryck på färgerna i samma ordning.]';
    this.isShowingSequence = false;
    this.playerSequence = [];
    buttons.forEach(btn => btn.disabled = false);
  }

  async flashColor(color) {
    const btn = this.container.querySelector(`[data-color="${color}"]`);
    if (btn) {
      btn.classList.add('flash');
      await this.delay(400);
      btn.classList.remove('flash');
    }
  }

  handleButtonPress(color) {
    const expectedColor = this.sequence[this.playerSequence.length];

    if (color === expectedColor) {
      // Correct!
      this.playerSequence.push(color);
      this.flashButton(color, true);

      // Update progress
      this.container.querySelector('#progress-count').textContent =
        Math.min(this.currentIndex + 1, this.sequence.length);

      if (this.playerSequence.length > this.currentIndex) {
        // Completed this round
        if (this.currentIndex >= this.sequence.length - 1) {
          // Completed entire sequence!
          setTimeout(() => {
            this.showFeedback(true);
            this.onComplete(true);
          }, 300);
        } else {
          // Move to next round
          this.currentIndex++;
          setTimeout(() => this.showSequence(), 1000);
        }
      }
    } else {
      // Wrong!
      this.flashButton(color, false);
      this.showFeedback(false);

      // Reset this round
      setTimeout(() => {
        this.playerSequence = [];
        this.showSequence();
      }, 1000);
    }
  }

  flashButton(color, success) {
    const btn = this.container.querySelector(`[data-color="${color}"]`);
    if (btn) {
      btn.classList.add(success ? 'correct' : 'incorrect');
      setTimeout(() => {
        btn.classList.remove('correct', 'incorrect');
      }, 300);
    }
  }

  showFeedback(success) {
    const feedback = document.createElement('div');
    feedback.className = `puzzle-feedback ${success ? 'success' : 'error'}`;
    feedback.textContent = success ? '✓ [SWEDISH: Rätt!]' : '✗ [SWEDISH: Försök igen]';
    this.container.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 1000);
  }

  showError() {
    const puzzle = this.container.querySelector('.puzzle');
    puzzle.classList.add('shake');
    setTimeout(() => {
      puzzle.classList.remove('shake');
    }, 500);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

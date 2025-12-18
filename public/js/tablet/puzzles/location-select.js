export class LocationSelectPuzzle {
  constructor(container, config, onComplete) {
    this.container = container;
    this.config = config;
    this.onComplete = onComplete;

    this.selected = null;

    this.render();
  }

  render() {
    // Shuffle options for variety
    const shuffledOptions = [...this.config.options].sort(() => Math.random() - 0.5);

    this.container.innerHTML = `
      <div class="puzzle location-select-puzzle">
        <h2 class="puzzle-instruction">${this.config.instruction}</h2>

        <div class="discussion-prompt">
          <span class="discussion-icon">💬</span>
          <p>[SWEDISH: Diskutera tillsammans innan ni väljer!]</p>
        </div>

        <div class="location-options">
          ${shuffledOptions.map(option => `
            <button
              class="location-option"
              data-id="${option.id}"
              data-correct="${option.correct}"
            >
              ${option.label}
            </button>
          `).join('')}
        </div>

        <div class="confirm-section" id="confirm-section" style="display: none;">
          <p>[SWEDISH: Är ni säkra?]</p>
          <button id="confirm-btn" class="puzzle-button confirm-btn">
            [SWEDISH: Ja, vi väljer detta!]
          </button>
        </div>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    const options = this.container.querySelectorAll('.location-option');
    const confirmSection = this.container.querySelector('#confirm-section');
    const confirmBtn = this.container.querySelector('#confirm-btn');

    options.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selection from others
        options.forEach(o => o.classList.remove('selected'));

        // Select this one
        option.classList.add('selected');
        this.selected = {
          id: option.dataset.id,
          correct: option.dataset.correct === 'true'
        };

        // Show confirm section
        confirmSection.style.display = 'block';
      });
    });

    confirmBtn.addEventListener('click', () => this.confirmSelection());
  }

  confirmSelection() {
    if (!this.selected) return;

    const selectedOption = this.container.querySelector('.location-option.selected');

    if (this.selected.correct) {
      selectedOption.classList.add('correct');
      this.showFeedback(true);
      setTimeout(() => {
        this.onComplete(true);
      }, 500);
    } else {
      selectedOption.classList.add('incorrect');
      this.showFeedback(false);

      // Shake and reset
      selectedOption.classList.add('shake');
      setTimeout(() => {
        selectedOption.classList.remove('incorrect', 'shake', 'selected');
        this.selected = null;
        this.container.querySelector('#confirm-section').style.display = 'none';
      }, 500);
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

  destroy() {
    this.container.innerHTML = '';
  }
}

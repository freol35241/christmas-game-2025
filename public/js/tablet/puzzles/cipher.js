import { COLORS } from '../../shared/constants.js';

export class CipherPuzzle {
  constructor(container, config, onComplete) {
    this.container = container;
    this.config = config;
    this.onComplete = onComplete;

    this.attempts = 0;
    this.hintShown = false;
    this.hintTimeout = null;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="puzzle cipher-puzzle">
        <h2 class="puzzle-instruction">${this.config.instruction}</h2>

        <div class="cipher-display">
          <div class="cipher-code">${this.config.cipher}</div>
          <div class="cipher-key">${this.config.hint}</div>
        </div>

        <div class="cipher-input-group">
          <input
            type="text"
            id="cipher-answer"
            class="cipher-input"
            placeholder="[SWEDISH: Skriv svaret här...]"
            autocomplete="off"
            autocapitalize="characters"
          />
          <button id="cipher-submit" class="puzzle-button">[SWEDISH: Svara]</button>
        </div>

        <div class="hint-container" id="hint-container" style="display: none;">
          <button id="show-hint" class="hint-button">[SWEDISH: Visa ledtråd]</button>
          <div id="hint-text" class="hint-text" style="display: none;"></div>
        </div>

        <div class="attempts-display" id="attempts-display"></div>
      </div>
    `;

    this.setupEvents();
    this.startHintTimer();
  }

  setupEvents() {
    const input = this.container.querySelector('#cipher-answer');
    const submitBtn = this.container.querySelector('#cipher-submit');
    const showHintBtn = this.container.querySelector('#show-hint');

    submitBtn.addEventListener('click', () => this.checkAnswer());

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });

    // Auto-uppercase
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    showHintBtn?.addEventListener('click', () => this.showHint());

    // Focus input
    setTimeout(() => input.focus(), 100);
  }

  startHintTimer() {
    // Show hint button after 60 seconds
    this.hintTimeout = setTimeout(() => {
      const hintContainer = this.container.querySelector('#hint-container');
      if (hintContainer) {
        hintContainer.style.display = 'block';
      }
    }, 60000);
  }

  showHint() {
    const hintText = this.container.querySelector('#hint-text');
    const showHintBtn = this.container.querySelector('#show-hint');

    if (hintText && showHintBtn) {
      // Generate hint - show first letter
      hintText.textContent = `[SWEDISH: Första bokstaven är: ${this.config.answer[0]}]`;
      hintText.style.display = 'block';
      showHintBtn.style.display = 'none';
      this.hintShown = true;
    }
  }

  checkAnswer() {
    const input = this.container.querySelector('#cipher-answer');
    const answer = input.value.trim().toUpperCase();

    // Normalize answer (handle Swedish characters)
    const normalizedAnswer = this.normalizeSwedish(answer);
    const normalizedCorrect = this.normalizeSwedish(this.config.answer.toUpperCase());

    this.attempts++;

    if (normalizedAnswer === normalizedCorrect) {
      input.classList.add('correct');
      this.showFeedback(true);
      setTimeout(() => {
        this.onComplete(true);
      }, 500);
    } else {
      input.classList.add('incorrect');
      this.showFeedback(false);

      // Shake animation
      input.classList.add('shake');
      setTimeout(() => {
        input.classList.remove('incorrect', 'shake');
        input.value = '';
        input.focus();
      }, 500);

      // Update attempts display
      const attemptsDisplay = this.container.querySelector('#attempts-display');
      if (attemptsDisplay) {
        attemptsDisplay.textContent = `[SWEDISH: Försök: ${this.attempts}]`;
      }

      // Show hint earlier if struggling
      if (this.attempts >= 3 && !this.hintShown) {
        const hintContainer = this.container.querySelector('#hint-container');
        if (hintContainer) {
          hintContainer.style.display = 'block';
        }
      }
    }
  }

  normalizeSwedish(str) {
    // Normalize Swedish characters for comparison
    return str
      .replace(/Å/g, 'A')
      .replace(/Ä/g, 'A')
      .replace(/Ö/g, 'O')
      .replace(/å/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o');
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
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
    }
    this.container.innerHTML = '';
  }
}

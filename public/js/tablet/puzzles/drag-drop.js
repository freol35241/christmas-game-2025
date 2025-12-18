import { COLORS } from '../../shared/constants.js';

export class DragDropPuzzle {
  constructor(container, config, onComplete) {
    this.container = container;
    this.config = config;
    this.onComplete = onComplete;

    this.droppedItems = [];
    this.correctCount = 0;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="puzzle drag-drop-puzzle">
        <h2 class="puzzle-instruction">${this.config.instruction}</h2>

        <div class="drop-zone" id="drop-zone">
          <div class="drop-zone-label">[SWEDISH: Släpp här]</div>
          <div class="dropped-items" id="dropped-items"></div>
        </div>

        <div class="draggable-items" id="draggable-items">
          ${this.config.items.map(item => `
            <div class="draggable-item" data-id="${item.id}" data-correct="${item.correct}" draggable="true">
              ${item.label}
            </div>
          `).join('')}
        </div>

        <div class="puzzle-progress">
          <span id="progress-count">0</span> / ${this.config.requiredCorrect}
        </div>
      </div>
    `;

    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    const draggables = this.container.querySelectorAll('.draggable-item');
    const dropZone = this.container.querySelector('#drop-zone');
    const droppedItemsContainer = this.container.querySelector('#dropped-items');

    let draggedItem = null;

    // Touch support
    draggables.forEach(item => {
      // Mouse events
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedItem = null;
      });

      // Touch events
      item.addEventListener('touchstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
      }, { passive: true });

      item.addEventListener('touchmove', (e) => {
        if (!draggedItem) return;
        e.preventDefault();

        const touch = e.touches[0];
        item.style.position = 'fixed';
        item.style.left = `${touch.clientX - item.offsetWidth / 2}px`;
        item.style.top = `${touch.clientY - item.offsetHeight / 2}px`;
        item.style.zIndex = '1000';
      }, { passive: false });

      item.addEventListener('touchend', (e) => {
        if (!draggedItem) return;

        const touch = e.changedTouches[0];
        const dropZoneRect = dropZone.getBoundingClientRect();

        // Check if touch ended over drop zone
        if (
          touch.clientX >= dropZoneRect.left &&
          touch.clientX <= dropZoneRect.right &&
          touch.clientY >= dropZoneRect.top &&
          touch.clientY <= dropZoneRect.bottom
        ) {
          this.handleDrop(draggedItem);
        }

        // Reset position
        item.style.position = '';
        item.style.left = '';
        item.style.top = '';
        item.style.zIndex = '';
        item.classList.remove('dragging');
        draggedItem = null;
      });
    });

    // Drop zone events
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');

      if (draggedItem) {
        this.handleDrop(draggedItem);
      }
    });
  }

  handleDrop(item) {
    const id = item.dataset.id;
    const isCorrect = item.dataset.correct === 'true';

    // Check if already dropped
    if (this.droppedItems.includes(id)) {
      return;
    }

    this.droppedItems.push(id);

    if (isCorrect) {
      this.correctCount++;
      item.classList.add('correct');
      this.showFeedback(true);

      // Move to dropped area
      const droppedContainer = this.container.querySelector('#dropped-items');
      const clone = item.cloneNode(true);
      clone.draggable = false;
      clone.classList.remove('dragging');
      droppedContainer.appendChild(clone);

      // Hide original
      item.style.visibility = 'hidden';

      // Update progress
      this.container.querySelector('#progress-count').textContent = this.correctCount;

      // Check completion
      if (this.correctCount >= this.config.requiredCorrect) {
        setTimeout(() => {
          this.onComplete(true);
        }, 500);
      }
    } else {
      item.classList.add('incorrect');
      this.showFeedback(false);

      // Shake animation
      item.classList.add('shake');
      setTimeout(() => {
        item.classList.remove('incorrect', 'shake');
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

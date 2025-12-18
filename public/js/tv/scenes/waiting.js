import { COLORS, PUZZLE_LAYERS } from '../../shared/constants.js';

export class WaitingScene {
  constructor(renderer, ws) {
    this.renderer = renderer;
    this.ws = ws;
    this.running = false;
    this.state = null;
    this.dotCount = 0;
    this.lastDotTime = 0;
  }

  start(state) {
    this.running = true;
    this.state = state;
    this.dotCount = 0;

    this.render();
  }

  stop() {
    this.running = false;
    this.renderer.stopAnimation();
  }

  render() {
    if (!this.running) return;

    const canvas = this.renderer.canvas;
    const ctx = this.renderer.ctx;
    const now = Date.now();

    // Animate dots
    if (now - this.lastDotTime > 500) {
      this.dotCount = (this.dotCount + 1) % 4;
      this.lastDotTime = now;
    }

    // Clear
    this.renderer.clear(COLORS.deepBlue);

    // Determine layer name
    let layerName = '';
    let layerIcon = '';
    switch (this.state.currentPuzzleLayer) {
      case PUZZLE_LAYERS.KIDS:
        layerName = '[SWEDISH: Barnens pussel]';
        layerIcon = '👶';
        break;
      case PUZZLE_LAYERS.ADULTS:
        layerName = '[SWEDISH: De vuxnas pussel]';
        layerIcon = '👨‍👩‍👧‍👦';
        break;
      case PUZZLE_LAYERS.TOGETHER:
        layerName = '[SWEDISH: Familjens pussel]';
        layerIcon = '👨‍👩‍👧‍👦';
        break;
    }

    // Draw waiting message
    ctx.font = '72px sans-serif';
    ctx.fillStyle = COLORS.textLight;
    ctx.textAlign = 'center';
    ctx.fillText(layerIcon, canvas.width / 2, canvas.height / 2 - 100);

    this.renderer.drawText(
      layerName,
      canvas.height / 2,
      { fontSize: 48, color: COLORS.gold }
    );

    const dots = '.'.repeat(this.dotCount);
    this.renderer.drawText(
      `[SWEDISH: Väntar på tableten${dots}]`,
      canvas.height / 2 + 80,
      { fontSize: 32, color: COLORS.textLight }
    );

    // Memory progress indicator
    if (this.state.memoryData) {
      this.renderer.drawText(
        `Minne ${this.state.currentMemory + 1}/7: ${this.state.memoryData.name}`,
        canvas.height - 100,
        { fontSize: 24, color: COLORS.amber }
      );
    }

    // Draw decorative border
    this.drawBorder(ctx, canvas);

    requestAnimationFrame(() => this.render());
  }

  drawBorder(ctx, canvas) {
    const padding = 30;
    const cornerSize = 40;

    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;

    // Corners only
    // Top left
    ctx.beginPath();
    ctx.moveTo(padding, padding + cornerSize);
    ctx.lineTo(padding, padding);
    ctx.lineTo(padding + cornerSize, padding);
    ctx.stroke();

    // Top right
    ctx.beginPath();
    ctx.moveTo(canvas.width - padding - cornerSize, padding);
    ctx.lineTo(canvas.width - padding, padding);
    ctx.lineTo(canvas.width - padding, padding + cornerSize);
    ctx.stroke();

    // Bottom left
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding - cornerSize);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(padding + cornerSize, canvas.height - padding);
    ctx.stroke();

    // Bottom right
    ctx.beginPath();
    ctx.moveTo(canvas.width - padding - cornerSize, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding - cornerSize);
    ctx.stroke();
  }
}

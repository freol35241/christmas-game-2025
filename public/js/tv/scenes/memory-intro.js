import { COLORS } from '../../shared/constants.js';

export class MemoryIntroScene {
  constructor(renderer, ws) {
    this.renderer = renderer;
    this.ws = ws;
    this.running = false;
    this.memoryData = null;
    this.textOpacity = 0;
  }

  start(state) {
    this.running = true;
    this.memoryData = state.memoryData;
    this.textOpacity = 0;
    this.renderer.initSnow(80);

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

    // Clear with warm interior gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2a1a0a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snow outside (less visible)
    ctx.globalAlpha = 0.3;
    this.renderer.updateSnow();
    this.renderer.drawSnow();
    ctx.globalAlpha = 1;

    // Fade in text
    this.textOpacity = Math.min(1, this.textOpacity + 0.03);
    ctx.globalAlpha = this.textOpacity;

    if (this.memoryData) {
      // Memory number
      this.renderer.drawText(
        `Minne ${this.memoryData.id + 1} av 7`,
        80,
        { fontSize: 28, color: COLORS.amber }
      );

      // Memory name
      this.renderer.drawText(
        this.memoryData.name,
        160,
        { fontSize: 64, color: COLORS.gold, font: 'Georgia, serif' }
      );

      // Decorative line
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 200, 210);
      ctx.lineTo(canvas.width / 2 + 200, 210);
      ctx.stroke();

      // Problem text
      this.renderer.drawText(
        this.memoryData.intro.problem,
        320,
        { fontSize: 36, color: COLORS.textLight }
      );

      // Hint text
      this.renderer.drawText(
        this.memoryData.intro.hint,
        420,
        { fontSize: 28, color: COLORS.amber }
      );

      // Draw themed icon based on memory
      this.drawMemoryIcon(ctx, canvas, this.memoryData.id);
    }

    // Continue prompt
    this.renderer.drawText(
      '[SWEDISH: Tryck SPACE för att börja pusslen]',
      canvas.height - 80,
      { fontSize: 24, color: COLORS.amber }
    );

    ctx.globalAlpha = 1;

    requestAnimationFrame(() => this.render());
  }

  drawMemoryIcon(ctx, canvas, memoryId) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 250;
    const scale = 1.5;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    switch (memoryId) {
      case 0: // Porridge
        this.drawPorridgeBowl(ctx);
        break;
      case 1: // Lucia
        this.drawCandles(ctx);
        break;
      case 2: // Tree
        ctx.translate(0, -50);
        this.renderer.drawTree(0, 0, 0.8);
        break;
      case 3: // Reindeer
        this.drawReindeer(ctx);
        break;
      case 4: // Sleigh
        this.drawSleigh(ctx);
        break;
      case 5: // Presents
        this.drawPresents(ctx);
        break;
      case 6: // Star
        this.renderer.drawStar(0, -30, 60, 5, COLORS.gold);
        break;
    }

    ctx.restore();
  }

  drawPorridgeBowl(ctx) {
    // Bowl
    ctx.fillStyle = COLORS.brown;
    ctx.beginPath();
    ctx.ellipse(0, 20, 60, 30, 0, 0, Math.PI);
    ctx.fill();

    // Porridge
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.ellipse(0, 10, 50, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Steam
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    for (let i = -20; i <= 20; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, -10);
      ctx.quadraticCurveTo(i + 10, -30, i, -50);
      ctx.stroke();
    }
  }

  drawCandles(ctx) {
    const positions = [-40, -20, 0, 20, 40];
    for (const x of positions) {
      // Candle
      ctx.fillStyle = '#fffacd';
      ctx.fillRect(x - 5, -20, 10, 40);

      // Flame
      ctx.fillStyle = COLORS.deepOrange;
      ctx.beginPath();
      ctx.ellipse(x, -30, 6, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner flame
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.ellipse(x, -28, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawReindeer(ctx) {
    // Body
    ctx.fillStyle = COLORS.brown;
    ctx.beginPath();
    ctx.ellipse(0, 20, 50, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(40, -10, 25, 20, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Antlers
    ctx.strokeStyle = COLORS.brown;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(35, -25);
    ctx.lineTo(25, -55);
    ctx.lineTo(15, -45);
    ctx.moveTo(25, -55);
    ctx.lineTo(35, -50);
    ctx.moveTo(50, -25);
    ctx.lineTo(60, -55);
    ctx.lineTo(70, -45);
    ctx.moveTo(60, -55);
        ctx.lineTo(50, -50);
    ctx.stroke();

    // Red nose
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(65, -10, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSleigh(ctx) {
    // Sleigh body
    ctx.fillStyle = COLORS.tomteRed;
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.quadraticCurveTo(-70, 30, -50, 40);
    ctx.lineTo(50, 40);
    ctx.quadraticCurveTo(70, 30, 60, 0);
    ctx.lineTo(40, -20);
    ctx.lineTo(-40, -20);
    ctx.closePath();
    ctx.fill();

    // Runner
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-60, 45);
    ctx.quadraticCurveTo(-70, 50, -50, 50);
    ctx.lineTo(50, 50);
    ctx.quadraticCurveTo(70, 50, 60, 45);
    ctx.stroke();
  }

  drawPresents(ctx) {
    const presents = [
      { x: -40, y: 0, w: 35, h: 30, color: '#ff4444' },
      { x: 10, y: 10, w: 40, h: 25, color: '#44ff44' },
      { x: -15, y: -25, w: 30, h: 35, color: '#4444ff' }
    ];

    for (const p of presents) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Ribbon
      ctx.fillStyle = COLORS.gold;
      ctx.fillRect(p.x + p.w / 2 - 3, p.y, 6, p.h);
      ctx.fillRect(p.x, p.y + p.h / 2 - 3, p.w, 6);

      // Bow
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2 - 8, p.y - 5, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2 + 8, p.y - 5, 8, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

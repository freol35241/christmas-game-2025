import { COLORS } from '../../shared/constants.js';

export class IntroScene {
  constructor(renderer, ws) {
    this.renderer = renderer;
    this.ws = ws;
    this.running = false;
    this.textOpacity = 0;
    this.tomteY = 0;
  }

  start(state) {
    this.running = true;
    this.textOpacity = 0;
    this.tomteY = this.renderer.canvas.height + 100;
    this.renderer.initSnow(150);

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

    // Clear with night sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, COLORS.deepBlue);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw snow
    this.renderer.updateSnow();
    this.renderer.drawSnow();

    // Animate tomte rising
    const targetY = canvas.height - 200;
    if (this.tomteY > targetY) {
      this.tomteY -= 2;
    }

    // Draw tomte
    this.renderer.drawTomte(canvas.width / 2, this.tomteY, 2);

    // Fade in title text
    if (this.tomteY <= targetY + 50) {
      this.textOpacity = Math.min(1, this.textOpacity + 0.02);
    }

    // Draw title
    ctx.globalAlpha = this.textOpacity;
    this.renderer.drawText(
      'Tomtens Försvunna Minnen',
      150,
      { fontSize: 72, color: COLORS.gold, font: 'Georgia, serif' }
    );

    this.renderer.drawText(
      '[SWEDISH: En gammal tomte har glömt hur man firar jul...]',
      250,
      { fontSize: 32, color: COLORS.textLight }
    );

    this.renderer.drawText(
      '[SWEDISH: Tryck på SPACE för att börja]',
      canvas.height - 80,
      { fontSize: 24, color: COLORS.amber }
    );

    ctx.globalAlpha = 1;

    // Draw stars in sky
    this.drawStars(ctx, canvas);

    requestAnimationFrame(() => this.render());
  }

  drawStars(ctx, canvas) {
    const time = Date.now() / 1000;
    const starPositions = [
      { x: 100, y: 80 }, { x: 200, y: 120 }, { x: 350, y: 60 },
      { x: 500, y: 100 }, { x: 650, y: 50 }, { x: 800, y: 90 },
      { x: 950, y: 70 }, { x: 1100, y: 110 }, { x: 1250, y: 55 },
      { x: 1400, y: 95 }, { x: 1550, y: 65 }, { x: 1700, y: 105 }
    ];

    for (let i = 0; i < starPositions.length; i++) {
      const star = starPositions[i];
      const twinkle = Math.sin(time * 2 + i) * 0.3 + 0.7;
      ctx.globalAlpha = twinkle;
      this.renderer.drawStar(star.x, star.y, 8, 4, COLORS.white);
    }
    ctx.globalAlpha = 1;
  }
}

import { COLORS } from '../../shared/constants.js';

export class EndingScene {
  constructor(renderer, ws) {
    this.renderer = renderer;
    this.ws = ws;
    this.running = false;
    this.state = null;
    this.phase = 0;
    this.phaseTime = 0;
  }

  start(state) {
    this.running = true;
    this.state = state;
    this.phase = 0;
    this.phaseTime = Date.now();
    this.renderer.initSnow(200);

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
    const elapsed = now - this.phaseTime;

    // Clear with magical gradient
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, 0, 0,
      canvas.width / 2, canvas.height, canvas.height
    );
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(0.5, COLORS.deepBlue);
    gradient.addColorStop(1, '#0a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Snow
    this.renderer.updateSnow();
    this.renderer.drawSnow();

    // Large star at top
    const starPulse = Math.sin(now / 500) * 10 + 80;
    this.renderer.drawStar(canvas.width / 2, 150, starPulse, 5, COLORS.gold);

    // Draw all 7 smaller stars in arc
    this.drawMemoryStars(ctx, canvas, now);

    // Main text
    this.renderer.drawText(
      '[SWEDISH: Alla minnen återställda!]',
      canvas.height / 2 - 80,
      { fontSize: 64, color: COLORS.gold, font: 'Georgia, serif' }
    );

    this.renderer.drawText(
      '[SWEDISH: Tomten minns nu hur man firar jul!]',
      canvas.height / 2,
      { fontSize: 36, color: COLORS.textLight }
    );

    // Draw tomte with sleigh
    this.drawTomteWithSleigh(ctx, canvas, now);

    // Thank you message
    this.renderer.drawText(
      '[SWEDISH: Tack för att ni spelade tillsammans!]',
      canvas.height - 120,
      { fontSize: 28, color: COLORS.amber }
    );

    this.renderer.drawText(
      'God Jul! 🎄',
      canvas.height - 60,
      { fontSize: 48, color: COLORS.gold }
    );

    requestAnimationFrame(() => this.render());
  }

  drawMemoryStars(ctx, canvas, time) {
    const memories = [
      'Gröten', 'Lucia', 'Granen', 'Renarna', 'Släden', 'Klapparna', 'Stjärnan'
    ];

    const centerX = canvas.width / 2;
    const radius = 250;
    const startAngle = Math.PI + 0.3;
    const endAngle = Math.PI * 2 - 0.3;

    for (let i = 0; i < 7; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / 6);
      const x = centerX + Math.cos(angle) * radius;
      const y = 180 + Math.sin(angle) * (radius * 0.4);

      // Twinkle effect
      const twinkle = Math.sin(time / 300 + i) * 5 + 25;

      this.renderer.drawStar(x, y, twinkle, 5, COLORS.gold);

      // Memory label
      ctx.font = '14px sans-serif';
      ctx.fillStyle = COLORS.textLight;
      ctx.textAlign = 'center';
      ctx.fillText(memories[i], x, y + 40);
    }
  }

  drawTomteWithSleigh(ctx, canvas, time) {
    const centerX = canvas.width / 2;
    const y = canvas.height - 280;

    // Slight bobbing animation
    const bob = Math.sin(time / 400) * 5;

    ctx.save();
    ctx.translate(centerX, y + bob);

    // Sleigh
    ctx.fillStyle = COLORS.tomteRed;
    ctx.beginPath();
    ctx.moveTo(-80, 20);
    ctx.quadraticCurveTo(-100, 50, -70, 60);
    ctx.lineTo(70, 60);
    ctx.quadraticCurveTo(100, 50, 80, 20);
    ctx.lineTo(50, -10);
    ctx.lineTo(-50, -10);
    ctx.closePath();
    ctx.fill();

    // Sleigh runner
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-80, 65);
    ctx.quadraticCurveTo(-100, 70, -70, 70);
    ctx.lineTo(70, 70);
    ctx.quadraticCurveTo(100, 70, 80, 65);
    ctx.stroke();

    // Gift sack
    ctx.fillStyle = COLORS.brown;
    ctx.beginPath();
    ctx.ellipse(30, -20, 35, 30, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Tomte in sleigh
    ctx.save();
    ctx.translate(-20, -30);
    ctx.scale(0.6, 0.6);
    this.renderer.drawTomte(0, 0, 1);
    ctx.restore();

    // Reindeer (simplified)
    ctx.fillStyle = COLORS.brown;
    ctx.beginPath();
    ctx.ellipse(-150, 30, 30, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Reindeer head
    ctx.beginPath();
    ctx.ellipse(-180, 15, 15, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Red nose
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(-195, 15, 5, 0, Math.PI * 2);
    ctx.fill();

    // Reins
    ctx.strokeStyle = COLORS.brown;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-80, 20);
    ctx.quadraticCurveTo(-120, 15, -165, 20);
    ctx.stroke();

    ctx.restore();
  }
}

import { COLORS } from '../../shared/constants.js';

export class ResolutionScene {
  constructor(renderer, ws) {
    this.renderer = renderer;
    this.ws = ws;
    this.running = false;
    this.state = null;
    this.celebrationPhase = 0;
    this.particles = [];
  }

  start(state) {
    this.running = true;
    this.state = state;
    this.celebrationPhase = 0;
    this.initCelebrationParticles();

    this.render();
  }

  stop() {
    this.running = false;
    this.renderer.stopAnimation();
  }

  initCelebrationParticles() {
    this.particles = [];
    const colors = [COLORS.gold, COLORS.tomteRed, COLORS.successGreen, COLORS.white];

    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * this.renderer.canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  updateParticles() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.rotation += p.rotationSpeed;

      if (p.y > this.renderer.canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * this.renderer.canvas.width;
        p.vy = Math.random() * 3 + 2;
      }
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      // Draw as confetti (rectangles)
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);

      ctx.restore();
    }
  }

  render() {
    if (!this.running) return;

    const canvas = this.renderer.canvas;
    const ctx = this.renderer.ctx;

    // Clear with celebratory gradient
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, '#2a2a4e');
    gradient.addColorStop(1, COLORS.deepBlue);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw confetti
    this.updateParticles();
    this.drawParticles(ctx);

    const memoryData = this.state.memoryData;
    if (memoryData) {
      // Success message
      this.renderer.drawText(
        '[SWEDISH: Minnet återställt!]',
        120,
        { fontSize: 56, color: COLORS.gold, font: 'Georgia, serif' }
      );

      // Memory name
      this.renderer.drawText(
        memoryData.name,
        200,
        { fontSize: 40, color: COLORS.amber }
      );

      // Celebration emoji
      ctx.font = '80px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(memoryData.resolution.celebration, canvas.width / 2, canvas.height / 2 - 20);

      // Resolution text
      this.renderer.drawText(
        memoryData.resolution.success,
        canvas.height / 2 + 100,
        { fontSize: 28, color: COLORS.textLight }
      );

      // Progress indicator
      const completedCount = this.state.completedMemories.length;
      this.renderer.drawText(
        `${completedCount}/7 [SWEDISH: minnen återställda]`,
        canvas.height - 120,
        { fontSize: 24, color: COLORS.amber }
      );

      // Draw memory progress stars
      this.drawProgressStars(ctx, canvas, completedCount);
    }

    // Continue prompt
    this.renderer.drawText(
      '[SWEDISH: Tryck SPACE för att fortsätta]',
      canvas.height - 50,
      { fontSize: 22, color: COLORS.textLight }
    );

    requestAnimationFrame(() => this.render());
  }

  drawProgressStars(ctx, canvas, completed) {
    const totalStars = 7;
    const starSize = 30;
    const spacing = 60;
    const startX = canvas.width / 2 - (totalStars - 1) * spacing / 2;
    const y = canvas.height - 180;

    for (let i = 0; i < totalStars; i++) {
      const x = startX + i * spacing;
      const isCompleted = i < completed;

      if (isCompleted) {
        this.renderer.drawStar(x, y, starSize, 5, COLORS.gold);
      } else {
        // Empty star outline
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 2;
        this.drawStarOutline(ctx, x, y, starSize);
      }
    }
  }

  drawStarOutline(ctx, x, y, radius) {
    const points = 5;
    ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius / 2;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.stroke();
  }
}

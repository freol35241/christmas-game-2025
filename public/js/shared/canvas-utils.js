import { COLORS } from './constants.js';

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  clear(color = COLORS.deepBlue) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draw text centered
  drawText(text, y, options = {}) {
    const {
      fontSize = 48,
      color = COLORS.textLight,
      font = 'serif',
      align = 'center',
      maxWidth = this.canvas.width - 100
    } = options;

    this.ctx.font = `${fontSize}px ${font}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'middle';

    const x = align === 'center' ? this.canvas.width / 2 : 50;
    this.wrapText(text, x, y, maxWidth, fontSize * 1.3);
  }

  wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && line !== '') {
        this.ctx.fillText(line.trim(), x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line.trim(), x, currentY);
  }

  // Draw a tomte silhouette
  drawTomte(x, y, scale = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Body (simple triangle/cone shape)
    ctx.fillStyle = COLORS.tomteRed;
    ctx.beginPath();
    ctx.moveTo(0, -80);
    ctx.lineTo(-40, 50);
    ctx.lineTo(40, 50);
    ctx.closePath();
    ctx.fill();

    // Hat tip
    ctx.beginPath();
    ctx.moveTo(0, -80);
    ctx.quadraticCurveTo(30, -100, 20, -130);
    ctx.lineTo(0, -80);
    ctx.fill();

    // Beard (white)
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.ellipse(0, 20, 35, 40, 0, 0, Math.PI);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#ffccaa';
    ctx.beginPath();
    ctx.arc(0, -10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw snow particles
  initSnow(count = 100) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 3 + 1,
        speed: Math.random() * 1 + 0.5,
        wind: Math.random() * 0.5 - 0.25
      });
    }
  }

  updateSnow() {
    for (const p of this.particles) {
      p.y += p.speed;
      p.x += p.wind;

      if (p.y > this.canvas.height) {
        p.y = -10;
        p.x = Math.random() * this.canvas.width;
      }
      if (p.x > this.canvas.width) p.x = 0;
      if (p.x < 0) p.x = this.canvas.width;
    }
  }

  drawSnow() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // Draw a star
  drawStar(x, y, radius, points = 5, color = COLORS.gold) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
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
    ctx.fill();
    ctx.restore();
  }

  // Draw Christmas tree
  drawTree(x, y, scale = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Trunk
    ctx.fillStyle = COLORS.brown;
    ctx.fillRect(-15, 80, 30, 40);

    // Tree layers (3 triangles)
    ctx.fillStyle = '#228B22';
    const layers = [
      { y: -100, w: 60, h: 80 },
      { y: -50, w: 90, h: 80 },
      { y: 0, w: 120, h: 90 }
    ];

    for (const layer of layers) {
      ctx.beginPath();
      ctx.moveTo(0, layer.y);
      ctx.lineTo(-layer.w / 2, layer.y + layer.h);
      ctx.lineTo(layer.w / 2, layer.y + layer.h);
      ctx.closePath();
      ctx.fill();
    }

    // Star on top
    this.drawStar(0, -120, 20, 5, COLORS.gold);

    ctx.restore();
  }

  // Draw progress bar
  drawProgressBar(x, y, width, height, progress, color = COLORS.successGreen) {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x, y, width, height);

    // Progress
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * Math.min(1, progress), height);

    // Border
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
  }

  // Start animation loop
  startAnimation(renderFn) {
    const animate = () => {
      renderFn();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

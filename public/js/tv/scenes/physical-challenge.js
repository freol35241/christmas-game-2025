import { COLORS } from '../../shared/constants.js';

export class PhysicalChallengeScene {
  constructor(renderer, ws) {
    this.renderer = renderer;
    this.ws = ws;
    this.running = false;
    this.state = null;
    this.progress = 0;
    this.detecting = false;
    this.cameraStream = null;
    this.video = null;
  }

  start(state) {
    this.running = true;
    this.state = state;
    this.progress = 0;
    this.detecting = false;

    // Listen for detection updates
    this.ws.on('DETECTION_UPDATE', (data) => this.onDetectionUpdate(data));

    this.render();
  }

  stop() {
    this.running = false;
    this.renderer.stopAnimation();
    this.ws.off('DETECTION_UPDATE', this.onDetectionUpdate);
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });

      this.video = document.createElement('video');
      this.video.srcObject = this.cameraStream;
      this.video.play();
      this.detecting = true;

      // Start detection loop
      this.detectLoop();
    } catch (err) {
      console.error('Camera access denied:', err);
      // Auto-pass if camera not available
      setTimeout(() => {
        this.ws.send({ type: 'PHYSICAL_COMPLETE', success: true });
      }, 3000);
    }
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    this.detecting = false;
  }

  detectLoop() {
    if (!this.detecting || !this.running) return;

    // Simple detection simulation for now
    // In full implementation, this would use MediaPipe.js
    this.simulateDetection();

    requestAnimationFrame(() => this.detectLoop());
  }

  simulateDetection() {
    // Simulate gradual progress for demo
    // Real implementation would use MediaPipe pose detection
    if (Math.random() > 0.7) {
      this.progress += 0.02;
      if (this.progress >= 1) {
        this.ws.send({ type: 'PHYSICAL_COMPLETE', success: true });
        this.detecting = false;
      }
    }
  }

  onDetectionUpdate(data) {
    if (data.progress !== undefined) {
      this.progress = data.progress;
    }
    if (data.success) {
      this.ws.send({ type: 'PHYSICAL_COMPLETE', success: true });
    }
  }

  render() {
    if (!this.running) return;

    const canvas = this.renderer.canvas;
    const ctx = this.renderer.ctx;

    // Clear
    this.renderer.clear('#1a1a2e');

    const challenge = this.state.memoryData?.physical;

    if (challenge) {
      // Title
      this.renderer.drawText(
        '[SWEDISH: Fysisk utmaning!]',
        80,
        { fontSize: 48, color: COLORS.gold }
      );

      // Instruction
      this.renderer.drawText(
        challenge.instruction,
        180,
        { fontSize: 32, color: COLORS.textLight }
      );

      // Large hint emoji/icon
      ctx.font = '200px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(challenge.hint, canvas.width / 2, canvas.height / 2 + 50);

      // Progress bar
      const barWidth = 600;
      const barHeight = 40;
      const barX = (canvas.width - barWidth) / 2;
      const barY = canvas.height - 150;

      this.renderer.drawProgressBar(
        barX, barY, barWidth, barHeight,
        this.progress,
        this.progress >= 1 ? COLORS.successGreen : COLORS.amber
      );

      // Progress text
      this.renderer.drawText(
        `${Math.round(this.progress * 100)}%`,
        barY + barHeight + 40,
        { fontSize: 24, color: COLORS.textLight }
      );

      // Camera status
      if (!this.detecting && !this.cameraStream) {
        this.renderer.drawText(
          '[SWEDISH: Klicka för att starta kameran]',
          canvas.height - 50,
          { fontSize: 20, color: COLORS.amber }
        );
      }
    }

    // Skip hint
    this.renderer.drawText(
      '[P = hoppa över]',
      canvas.height - 20,
      { fontSize: 16, color: 'rgba(255,255,255,0.3)' }
    );

    requestAnimationFrame(() => this.render());
  }
}

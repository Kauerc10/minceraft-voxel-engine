// Procedural Web Audio API Sound Engine (Zero external assets required)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.volume = 0.8;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }

  playTone(freq, duration = 0.1, type = 'square', gainVal = 0.15, slideTo = null) {
    const ctx = this.ensureContext();
    if (!ctx || this.volume <= 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(gainVal * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  playNoise(duration = 0.08, filterFreq = 900, gainVal = 0.18, filterType = 'bandpass') {
    const ctx = this.ensureContext();
    if (!ctx || this.volume <= 0) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  click() {
    this.playTone(620, 0.045, 'square', 0.12, 880);
  }

  step(isStone = false) {
    const f = isStone ? 520 + Math.random() * 200 : 320 + Math.random() * 140;
    this.playNoise(0.055, f, 0.09);
  }

  mineHit() {
    this.playNoise(0.045, 700 + Math.random() * 250, 0.12);
  }

  blockBreak() {
    this.playNoise(0.16, 480, 0.28, 'lowpass');
    this.playTone(180 + Math.random() * 60, 0.11, 'triangle', 0.15, 95);
  }

  blockPlace() {
    this.playNoise(0.07, 650, 0.18);
    this.playTone(260, 0.06, 'triangle', 0.14, 190);
  }

  splash() {
    this.playNoise(0.28, 1100, 0.25, 'bandpass');
    this.playTone(220, 0.18, 'sine', 0.12, 420);
  }

  sizzle() {
    this.playNoise(0.22, 2400, 0.2, 'highpass');
  }

  hitMob() {
    this.playNoise(0.09, 550, 0.24);
    this.playTone(210, 0.11, 'sawtooth', 0.18, 110);
  }

  playerHurt() {
    this.playNoise(0.11, 450, 0.3);
    this.playTone(170, 0.14, 'sawtooth', 0.24, 85);
  }

  shootBow() {
    this.playTone(460, 0.14, 'triangle', 0.2, 180);
    this.playNoise(0.07, 1600, 0.12, 'highpass');
  }

  eat() {
    this.playNoise(0.09, 950, 0.2);
    setTimeout(() => this.playNoise(0.09, 780, 0.2), 110);
  }

  xpOrb() {
    const notes = [660, 784, 880, 987, 1046, 1174];
    const f = notes[Math.floor(Math.random() * notes.length)];
    this.playTone(f, 0.14, 'sine', 0.16, f * 1.15);
  }

  creeperHiss() {
    this.playNoise(0.45, 2200, 0.22, 'highpass');
  }

  explosion() {
    this.playNoise(0.65, 220, 0.55, 'lowpass');
    this.playTone(95, 0.5, 'sawtooth', 0.35, 28);
  }
}

export const sound = new SoundEngine();

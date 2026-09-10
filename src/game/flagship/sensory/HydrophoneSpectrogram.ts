// ============================================================================
// WATER INVADER: FEATURE 12 - HYDROPHONE SPECTROGRAM & WATERFALL VISUALIZER
// ============================================================================
// 16-band real-time audio FFT spectrum analyzer (40Hz to 12kHz) + scrolling waterfall
// history with hydrodynamic ambient sound simulation fallback.

import { HydrophoneWaterfallState, FlagshipUpdateContext } from '../types';

export class HydrophoneSpectrogram {
  public waterfallState: HydrophoneWaterfallState;

  // Waterfall history: 48 rolling time slices x 16 frequency channels
  public readonly historySlices: number = 48;
  public readonly bandCount: number = 16;
  private historyData: number[][] = [];

  // Update timer (50ms interval = 20Hz refresh)
  private sampleTimer: number = 0;
  private readonly sampleInterval: number = 0.05;

  // Frequency bucket center frequencies in Hz
  public readonly frequencyBandsHz: number[] = [
    40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 8000, 10000, 12000, 15000,
  ];

  // Optional attached Web Audio AnalyserNode
  private analyserNode: AnalyserNode | null = null;
  private audioDataArray: Uint8Array<ArrayBuffer> | null = null;

  constructor() {
    this.waterfallState = {
      frequencyBands: new Uint8Array(this.bandCount),
      waterfallBuffer: new Uint8ClampedArray(this.bandCount * this.historySlices * 4),
      updateIntervalMs: 50,
    };

    // Initialize history slices with ambient sea floor noise
    for (let i = 0; i < this.historySlices; i++) {
      const slice: number[] = new Array(this.bandCount).fill(15);
      this.historyData.push(slice);
    }
  }

  /**
   * Attaches an external Web Audio AnalyserNode (e.g. from SoundManager)
   */
  public attachAnalyser(analyser: AnalyserNode): void {
    this.analyserNode = analyser;
    this.audioDataArray = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  }

  /**
   * Updates FFT frequency bands from Web Audio or procedural hydrodynamic simulation
   */
  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    this.sampleTimer += deltaTime;
    if (this.sampleTimer < this.sampleInterval) return;
    this.sampleTimer -= this.sampleInterval;

    const bands = this.waterfallState.frequencyBands;

    if (this.analyserNode && this.audioDataArray) {
      // 1. Live Web Audio FFT sampling
      this.analyserNode.getByteFrequencyData(this.audioDataArray);
      const binCount = this.analyserNode.frequencyBinCount;
      const sampleRate = this.analyserNode.context.sampleRate;

      for (let i = 0; i < this.bandCount; i++) {
        const targetFreq = this.frequencyBandsHz[i];
        const binIndex = Math.min(
          binCount - 1,
          Math.max(0, Math.round((targetFreq / (sampleRate / 2)) * binCount))
        );
        bands[i] = this.audioDataArray[binIndex] || 0;
      }
    } else {
      // 2. Realistic Procedural Hydrodynamic Audio Simulation
      this.simulateHydrodynamicAudio(bands, context);
    }

    // Push new time slice into rolling waterfall history
    const currentSlice = Array.from(bands);
    this.historyData.unshift(currentSlice);
    if (this.historyData.length > this.historySlices) {
      this.historyData.pop();
    }
  }

  /**
   * Procedural ocean acoustics: ambient low-freq rumble, cavitation hum, weapon spikes
   */
  private simulateHydrodynamicAudio(
    bands: Uint8Array,
    context: FlagshipUpdateContext
  ): void {
    const time = Date.now() / 1000;
    const speed = context.player ? Math.abs(context.player.speed) : 250;
    const bulletCount = context.bullets ? context.bullets.length : 0;
    const enemyCount = context.enemies ? context.enemies.length : 0;

    for (let i = 0; i < this.bandCount; i++) {
      let amp = 0;

      // Bands 0-2 (40-100 Hz): Infrasonic ocean floor seismic rumble & water column mass
      if (i <= 2) {
        amp = 45 + Math.sin(time * 1.5 + i) * 15 + Math.random() * 10;
      }

      // Bands 3-6 (160-630 Hz): Submarine engine propeller hum & cavitation slipstream
      if (i >= 3 && i <= 6) {
        const engineHum = (speed / 450) * 80;
        amp = engineHum + Math.sin(time * 8.0 + i * 2) * 12 + Math.random() * 8;
      }

      // Bands 7-11 (1kHz-4kHz): Hydrothermal bubble crackles & projectile cavitation trails
      if (i >= 7 && i <= 11) {
        const combatActivity = Math.min(100, bulletCount * 12 + enemyCount * 5);
        amp = 20 + combatActivity * 0.75 + Math.random() * 18;
      }

      // Bands 12-15 (6.3kHz-15kHz): High-frequency metal stress creaks & sonar ping echoes
      if (i >= 12) {
        amp = 15 + Math.sin(time * 12.0) * 8 + Math.random() * 12;
      }

      bands[i] = Math.min(255, Math.max(0, Math.floor(amp)));
    }
  }

  // ==========================================================================
  // RENDERING METHODS
  // ==========================================================================

  /**
   * Renders the 16-band audio equalizer bars and scrolling waterfall stream
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    x: number = 180,
    y: number = 745,
    width: number = 240,
    height: number = 44
  ): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    ctx.save();

    // Panel border and dark CRT phosphor glass backing
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 4);
    ctx.fill();
    ctx.stroke();

    // Top Header: Hydrophone status
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('HYDROPHONE FFT // 40Hz - 12kHz', x + 6, y + 10);

    // 1. Equalizer Spectrum Bars (Top half of panel)
    const eqY = y + 14;
    const eqH = 16;
    const barWidth = (width - 12) / this.bandCount;

    for (let i = 0; i < this.bandCount; i++) {
      const db = this.waterfallState.frequencyBands[i];
      const barH = (db / 255) * eqH;
      const bx = x + 6 + i * barWidth;
      const by = eqY + eqH - barH;

      ctx.fillStyle = this.getDecibelColor(db);
      ctx.fillRect(bx, by, Math.max(1, barWidth - 1), barH);
    }

    // 2. Scrolling Waterfall Spectrogram History (Bottom half of panel)
    const wfY = y + 32;
    const wfH = height - 34;
    const sliceCount = Math.min(this.historyData.length, Math.floor(wfH / 2));

    for (let row = 0; row < sliceCount; row++) {
      const slice = this.historyData[row];
      const py = wfY + row * 2;

      for (let col = 0; col < this.bandCount; col++) {
        const db = slice[col];
        const px = x + 6 + col * barWidth;

        ctx.fillStyle = this.getDecibelColor(db);
        ctx.fillRect(px, py, Math.max(1, barWidth - 1), 2);
      }
    }

    ctx.restore();
  }

  /**
   * Color-maps decibels: Deep Navy -> Cyan -> Phosphor Green -> Overload Amber/Red
   */
  private getDecibelColor(db: number): string {
    if (db < 60) return '#0369a1'; // Deep oceanic blue
    if (db < 120) return '#06b6d4'; // Cyan
    if (db < 180) return '#10b981'; // Phosphor Emerald
    if (db < 225) return '#f59e0b'; // Amber warning
    return '#ef4444'; // Red peak overload
  }

  public reset(): void {
    this.waterfallState.frequencyBands.fill(0);
    this.historyData = [];
    for (let i = 0; i < this.historySlices; i++) {
      this.historyData.push(new Array(this.bandCount).fill(15));
    }
  }
}

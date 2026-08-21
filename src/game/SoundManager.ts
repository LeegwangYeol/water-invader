export class SoundManager {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = false;

  constructor() {
    // AudioContext is created on first user interaction to bypass autoplay policies
  }

  public init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.enabled = true;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playShoot() {
    if (!this.enabled || !this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.type = 'square';
    
    // Pitch drop effect (Pew!)
    osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.audioCtx.currentTime + 0.1);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  public playExplosion() {
    if (!this.enabled || !this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    // Low frequency rumble for explosion
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  }

  public playPowerUp() {
    if (!this.enabled || !this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    osc.frequency.setValueAtTime(554.37, this.audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(659.25, this.audioCtx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  }
}

// Singleton instance export
export const soundManager = new SoundManager();

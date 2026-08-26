export class SoundManager {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = false;
  public isMuted: boolean = false;

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

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playShoot() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
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
    
    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  public playExplosion() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
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
    
    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  }

  public playPowerUp() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
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
    
    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  }

  public playPlayerHit() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.15);
  }

  public playEnemyHit() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.05);
  }

  public playShieldBreak() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.25);

    gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.25);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.25);
  }

  public playVictory() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'triangle';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.36); // C6

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.setValueAtTime(0.18, now + 0.36);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.6);
  }

  public playGameOver() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(370, now + 0.15);
    osc.frequency.setValueAtTime(311, now + 0.3);
    osc.frequency.setValueAtTime(220, now + 0.45);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.7);
  }

  public playThirdFactionWarning() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    const now = this.audioCtx.currentTime;
    
    // Siren alternating pulse (880Hz -> 587Hz -> 880Hz -> 587Hz)
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(587, now + 0.15);
    osc.frequency.linearRampToValueAtTime(880, now + 0.3);
    osc.frequency.linearRampToValueAtTime(587, now + 0.45);
    osc.frequency.linearRampToValueAtTime(440, now + 0.6);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.setValueAtTime(0.2, now + 0.45);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.6);
  }

  public playRogueShoot() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'triangle';
    const now = this.audioCtx.currentTime;

    // High tech plasma laser sweep (1200Hz -> 280Hz)
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.12);
  }

  public playCrossfireHit() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'square';
    const now = this.audioCtx.currentTime;

    // Metallic clash / crossfire energy impact (750Hz -> 180Hz)
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    gainNode.gain.setValueAtTime(0.16, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.18);
  }
}

// Singleton instance export
export const soundManager = new SoundManager();

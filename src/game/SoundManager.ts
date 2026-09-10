export class SoundManager {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private enabled: boolean = false;
  public isMuted: boolean = false;

  constructor() {
    // AudioContext is created on first user interaction to bypass autoplay policies
  }

  public init() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        try {
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 64;
          this.analyser.connect(this.audioCtx.destination);
        } catch (e) {
          console.warn('Failed to initialize master AnalyserNode:', e);
        }
        this.enabled = true;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public get destinationNode(): AudioNode {
    if (this.analyser) return this.analyser;
    if (this.audioCtx) return this.audioCtx.destination;
    throw new Error('AudioContext not initialized');
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
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
    gainNode.connect(this.destinationNode);
    
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
    gainNode.connect(this.destinationNode);
    
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
    gainNode.connect(this.destinationNode);
    
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
    gainNode.connect(this.destinationNode);

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
    gainNode.connect(this.destinationNode);

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
    gainNode.connect(this.destinationNode);

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
    gainNode.connect(this.destinationNode);

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
    gainNode.connect(this.destinationNode);

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
    gainNode.connect(this.destinationNode);

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
    gainNode.connect(this.destinationNode);

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
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.18);
  }

  public playCrisisAlarm() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    const now = this.audioCtx.currentTime;

    // Multi-tone dramatic crisis siren (960Hz -> 640Hz -> 1200Hz -> 720Hz -> 480Hz)
    osc.frequency.setValueAtTime(960, now);
    osc.frequency.linearRampToValueAtTime(640, now + 0.18);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.36);
    osc.frequency.linearRampToValueAtTime(720, now + 0.54);
    osc.frequency.linearRampToValueAtTime(480, now + 0.72);

    gainNode.gain.setValueAtTime(0.24, now);
    gainNode.gain.setValueAtTime(0.24, now + 0.54);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.75);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.75);
  }

  public playEmpDisruptionSound() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    const now = this.audioCtx.currentTime;

    // Low-frequency electrical hum and static sweep (60Hz -> 380Hz -> 40Hz)
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.45);

    gainNode.gain.setValueAtTime(0.22, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.45);
  }

  public playAcidStormSound() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'triangle';
    const now = this.audioCtx.currentTime;

    // Sizzling / splashing hazard pitch sweep (1400Hz -> 220Hz)
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.22);

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.22);
  }

  public playCrisisCataclysmSiren() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    const now = this.audioCtx.currentTime;

    // Dramatic 5-tone descending cataclysm alarm (1100Hz -> 880Hz -> 660Hz -> 440Hz -> 220Hz)
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.2);
    osc.frequency.linearRampToValueAtTime(660, now + 0.4);
    osc.frequency.linearRampToValueAtTime(440, now + 0.6);
    osc.frequency.linearRampToValueAtTime(220, now + 0.85);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.setValueAtTime(0.25, now + 0.6);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.9);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.9);
  }

  public playDarkMatterBeam() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    const now = this.audioCtx.currentTime;

    // Resonant deep frequency modulation (120Hz -> 320Hz -> 80Hz)
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.35);
  }

  public playDimensionalRiftPulse() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sine';
    const now = this.audioCtx.currentTime;

    // Ethereal phase warp sweep (300Hz -> 950Hz -> 180Hz)
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.5);

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.5);
  }

  public playSingularityCollapse() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    const now = this.audioCtx.currentTime;

    // Massive implosion rumble: High pitch sweep in -> massive sub-bass rumble out (600Hz -> 50Hz -> 20Hz)
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.7);

    gainNode.gain.setValueAtTime(0.28, now);
    gainNode.gain.setValueAtTime(0.28, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.7);
  }

  public playShieldDeflect() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sine';
    const now = this.audioCtx.currentTime;

    // High ping metallic deflect sound (1600Hz -> 800Hz)
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start();
    osc.stop(now + 0.1);
  }

  public playMissileLaunch() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    // Rocket ignition frequency sweep 220Hz -> 660Hz
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.18);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    // Booster hiss
    const hissOsc = this.audioCtx.createOscillator();
    const hissGain = this.audioCtx.createGain();

    hissOsc.type = 'triangle';
    hissOsc.frequency.setValueAtTime(140, now);
    hissOsc.frequency.linearRampToValueAtTime(320, now + 0.22);

    hissGain.gain.setValueAtTime(0.08, now);
    hissGain.gain.linearRampToValueAtTime(0.005, now + 0.22);

    hissOsc.connect(hissGain);
    hissGain.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
        hissOsc.disconnect();
        hissGain.disconnect();
      } catch (e) {}
    };

    osc.start(now);
    osc.stop(now + 0.22);
    hissOsc.start(now);
    hissOsc.stop(now + 0.22);
  }

  public playMissileExplosion() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    // Low-frequency rumble burst at 80Hz ramping down to 25Hz
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playCavitationImplosion() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    // Vacuum suction snap (high-to-mid sweep)
    const snapOsc = this.audioCtx.createOscillator();
    const snapGain = this.audioCtx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(820, now);
    snapOsc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    snapGain.gain.setValueAtTime(0.24, now);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    snapOsc.connect(snapGain);
    snapGain.connect(this.destinationNode);

    // Hyperbaric rebound sub-bass shockwave (120Hz -> 24Hz)
    const shockOsc = this.audioCtx.createOscillator();
    const shockGain = this.audioCtx.createGain();
    shockOsc.type = 'sawtooth';
    shockOsc.frequency.setValueAtTime(120, now + 0.08);
    shockOsc.frequency.exponentialRampToValueAtTime(24, now + 0.65);
    shockGain.gain.setValueAtTime(0.01, now);
    shockGain.gain.setValueAtTime(0.32, now + 0.08);
    shockGain.gain.exponentialRampToValueAtTime(0.005, now + 0.65);
    shockOsc.connect(shockGain);
    shockGain.connect(this.destinationNode);

    snapOsc.onended = () => {
      try {
        snapOsc.disconnect();
        snapGain.disconnect();
      } catch (e) {}
    };
    shockOsc.onended = () => {
      try {
        shockOsc.disconnect();
        shockGain.disconnect();
      } catch (e) {}
    };

    snapOsc.start(now);
    snapOsc.stop(now + 0.12);
    shockOsc.start(now + 0.08);
    shockOsc.stop(now + 0.65);
  }

  public playPhoticLaserHum() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(360, now);
    osc1.frequency.linearRampToValueAtTime(370, now + 0.2);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(720, now);
    osc2.frequency.linearRampToValueAtTime(740, now + 0.2);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.destinationNode);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.22);
    osc2.stop(now + 0.22);
  }

  public playLaserHum() {
    this.playPhoticLaserHum();
  }

  public playHarpoonWinchCreak() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    // Rising strain pitch (180Hz -> 480Hz)
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.25);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playHarpoonWinch() {
    this.playHarpoonWinchCreak();
  }

  public playSonarPingSweep() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sine';
    // High-Q pure acoustic ping with slight downward Doppler decay (1740Hz -> 1680Hz)
    osc.frequency.setValueAtTime(1740, now);
    osc.frequency.exponentialRampToValueAtTime(1680, now + 1.2);

    // Initial sharp attack, followed by exponential acoustic reverberation ring
    gainNode.gain.setValueAtTime(0.26, now);
    gainNode.gain.exponentialRampToValueAtTime(0.002, now + 1.2);

    osc.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start(now);
    osc.stop(now + 1.2);
  }

  public playSonarPing() {
    this.playSonarPingSweep();
  }

  public playVentEruptionHiss() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    // Multi-oscillator turbulent steam hiss
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gainNode = this.audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(420, now);
    osc1.frequency.linearRampToValueAtTime(840, now + 0.45);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(630, now);
    osc2.frequency.linearRampToValueAtTime(1260, now + 0.45);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(2100, now + 0.45);
    filter.Q.setValueAtTime(3.0, now);

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.destinationNode);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  public playHullGroan() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    // Synthesized low-frequency FM rumble (Carrier 55->42Hz modulated by 7.5->4Hz)
    const carrier = this.audioCtx.createOscillator();
    const modulator = this.audioCtx.createOscillator();
    const modGain = this.audioCtx.createGain();
    const gainNode = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(55, now);
    carrier.frequency.linearRampToValueAtTime(42, now + 1.8);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(7.5, now);
    modulator.frequency.linearRampToValueAtTime(4.0, now + 1.8);

    modGain.gain.setValueAtTime(25, now);
    modGain.gain.linearRampToValueAtTime(8, now + 1.8);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.exponentialRampToValueAtTime(65, now + 1.8);

    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.20, now + 0.35);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.8);

    carrier.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.destinationNode);

    carrier.onended = () => {
      try {
        carrier.disconnect();
        modulator.disconnect();
        modGain.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 1.8);
    carrier.stop(now + 1.8);
  }

  public playVentHiss() {
    this.playVentEruptionHiss();
  }
}

// Singleton instance export
export const soundManager = new SoundManager();

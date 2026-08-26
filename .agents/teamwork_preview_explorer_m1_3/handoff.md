# Handoff Report: Explorer M1_3 — SoundManager Synthesis for 3rd Faction & Crossfire

## 1. Observation

### 1.1 Existing Architecture & File State
- **File**: `src/game/SoundManager.ts` (Lines 1–251)
- **Audio Architecture**: The game uses procedural audio synthesis driven entirely by the Web Audio API without external audio files.
- **Audio Lifecycle & Gating**:
  - `SoundManager` has fields `audioCtx: AudioContext | null`, `enabled: boolean`, and `isMuted: boolean` (Lines 2–4).
  - All existing methods start with the exact guard condition:
    ```typescript
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    ```
- **Node Cleanup Standard**:
  - Existing methods (`playShoot`, `playExplosion`, `playPlayerHit`, etc.) bind `osc.onended` to cleanly disconnect all allocated `AudioNode` instances inside a `try ... catch` block:
    ```typescript
    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
    ```
- **Existing Sound Profiles**:
  - `playShoot()` (Lines 28–55): Square wave, 880 Hz down to 110 Hz pitch drop over 0.1s (Player laser).
  - `playPlayerHit()` (Lines 111–135): Sawtooth wave, 180 Hz down to 40 Hz over 0.15s (Heavy impact).
  - `playEnemyHit()` (Lines 137–161): Triangle wave, 600 Hz down to 200 Hz over 0.05s (Enemy damage blip).
  - `playShieldBreak()` (Lines 163–187): Square wave, 1400 Hz down to 300 Hz over 0.25s.
  - `playVictory()` / `playGameOver()` (Lines 189–246): Multi-tone melodic sequences.

---

## 2. Logic Chain

1. **Requirement 1: `playThirdFactionWarning()` (Alien Cyber-Siren Warble)**
   - **Observation Reference**: Section 1.1; Section 20 of `PROJECT.md`.
   - **Synthesis Design**:
     - Uses **FM (Frequency Modulation)** with a carrier oscillator and a low-frequency modulator (LFO).
     - Carrier: Sawtooth waveform sweeping upward from 450 Hz to 750 Hz at midpoint (0.3s) and down to 350 Hz at end (0.6s).
     - LFO: 14 Hz sine wave connected through an `lfoGain` node modulating `carrier.frequency` with depth starting at 120 Hz and easing to 60 Hz.
     - Volume Envelope: Rapid attack (0.01 to 0.22 in 0.05s), sustains across 0.4s, and cleanly decays via exponential ramp to 0.001 at 0.6s.
     - Memory Safety: `carrier.onended` disconnects all four nodes (`lfo`, `lfoGain`, `carrier`, `carrierGain`).

2. **Requirement 2: `playRogueShoot()` (High-Tech Laser Chirp)**
   - **Observation Reference**: Section 1.1 (`playShoot()` uses square wave 880->110Hz).
   - **Synthesis Design**:
     - Rogue lasers must sound distinct from Player shoots.
     - Waveform: Sawtooth waveform for crisp high-harmonic energy bite.
     - Pitch: Double-stage exponential drop starting high at 1760 Hz (A6), dropping sharply to 880 Hz within 0.02s (creating the signature high-energy chirp transient), then down to 130 Hz at 0.09s.
     - Volume Envelope: Attack at 0.15, exponential ramp to 0.01 at 0.09s.
     - Memory Safety: `osc.onended` disconnects `osc` and `gainNode`.

3. **Requirement 3: `playCrossfireHit()` (Metallic Resonance / Spark Sound)**
   - **Observation Reference**: Section 1.1 (`playEnemyHit()` is triangle 600->200Hz, `playPlayerHit()` is sawtooth 180->40Hz).
   - **Synthesis Design**:
     - Must convey high-energy AI-vs-AI clash / metallic ricochet when Rogue and Invader projectiles or entities collide.
     - Uses dual inharmonic detuned oscillators (`osc1` triangle at 1320 Hz -> 440 Hz, `osc2` square at 1870 Hz -> 620 Hz). The dissonant overtone ratio simulates metallic resonance and kinetic spark impact.
     - Volume Envelope: Sharp transient at 0.18 gain, exponential decay to 0.01 over 0.12s.
     - Memory Safety: Both oscillators stop at `now + 0.12`; `osc1.onended` disconnects `osc1`, `osc2`, and `gainNode`.

4. **Requirement 4: Memory Safety & Mute Gating**
   - Every method verifies `if (!this.enabled || !this.audioCtx || this.isMuted) return;` at entry.
   - All instantiated `OscillatorNode` and `GainNode` objects are disconnected upon sound completion inside `osc.onended` / `carrier.onended`.

---

## 3. Caveats

- **AudioContext Autoplay Policy**: `SoundManager.init()` is invoked on first user interaction (or game start). If `init()` has not run, `this.audioCtx` remains `null` and methods safely no-op.
- **Node Disconnection Timing**: When multiple oscillators are used (e.g. in `playThirdFactionWarning` and `playCrossfireHit`), attaching the `onended` handler to the primary carrier oscillator guarantees that all associated graph nodes are unhooked when playback finishes.
- No other caveats.

---

## 4. Conclusion & Proposed Code for Worker

The Worker can drop the following three methods into `src/game/SoundManager.ts` inside the `SoundManager` class (immediately following `playGameOver()` at line 246):

```typescript
  public playThirdFactionWarning() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;
    const duration = 0.6;

    const carrier = this.audioCtx.createOscillator();
    const carrierGain = this.audioCtx.createGain();
    const lfo = this.audioCtx.createOscillator();
    const lfoGain = this.audioCtx.createGain();

    carrier.type = 'sawtooth';
    // Siren pitch sweep: swoop up then down
    carrier.frequency.setValueAtTime(450, now);
    carrier.frequency.linearRampToValueAtTime(750, now + 0.3);
    carrier.frequency.linearRampToValueAtTime(350, now + duration);

    // Fast alien cyber-warble LFO (14 Hz modulation)
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(14, now);

    // LFO modulation depth
    lfoGain.gain.setValueAtTime(120, now);
    lfoGain.gain.linearRampToValueAtTime(60, now + duration);

    // Connect LFO to carrier frequency (FM synthesis)
    lfo.connect(lfoGain);
    lfoGain.connect(carrier.frequency);

    // Volume envelope
    carrierGain.gain.setValueAtTime(0.01, now);
    carrierGain.gain.linearRampToValueAtTime(0.22, now + 0.05);
    carrierGain.gain.setValueAtTime(0.22, now + 0.4);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    carrier.connect(carrierGain);
    carrierGain.connect(this.audioCtx.destination);

    carrier.onended = () => {
      try {
        lfo.disconnect();
        lfoGain.disconnect();
        carrier.disconnect();
        carrierGain.disconnect();
      } catch (e) {}
    };

    lfo.start(now);
    carrier.start(now);
    lfo.stop(now + duration);
    carrier.stop(now + duration);
  }

  public playRogueShoot() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;
    const duration = 0.09;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    // High-tech laser chirp: Sawtooth for crisp harmonic bite
    osc.type = 'sawtooth';

    // Fast double-stage exponential pitch drop
    osc.frequency.setValueAtTime(1760, now); // A6
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.02); // quick high chirp
    osc.frequency.exponentialRampToValueAtTime(130, now + duration); // sub-drop

    // Snappy volume envelope
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc.start(now);
    osc.stop(now + duration);
  }

  public playCrossfireHit() {
    if (!this.enabled || !this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;
    const duration = 0.12;

    // Dual detuned oscillators for inharmonic metallic ring / spark
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'square';

    // Non-harmonic metallic clink frequencies
    osc1.frequency.setValueAtTime(1320, now);
    osc1.frequency.exponentialRampToValueAtTime(440, now + duration);

    osc2.frequency.setValueAtTime(1870, now); // Inharmonic overtone for metallic spark
    osc2.frequency.exponentialRampToValueAtTime(620, now + duration);

    // Volume envelope: instant metallic spark transient + fast ringing decay
    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }
```

---

## 5. Verification Method

1. **TypeScript Typecheck**:
   Run:
   ```bash
   npx tsc --noEmit
   ```
   Must pass with 0 errors.

2. **Mute & Node Disconnection Audit**:
   - In browser console or automated test, ensure calling `soundManager.playThirdFactionWarning()`, `soundManager.playRogueShoot()`, and `soundManager.playCrossfireHit()` when `soundManager.isMuted = true` produces 0 AudioNodes.
   - When unmuted, verify that all created nodes fire their `onended` handler and disconnect cleanly without memory leaks.

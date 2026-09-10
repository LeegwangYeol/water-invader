# Stream E Sensory Audio QA Playtest & Adversarial Review Report

**Date**: 2026-09-10  
**Agent**: `qa_playtest_stream_e_sensory_audio`  
**Roles**: Reviewer, Adversarial Critic  
**Working Directory**: `/Users/user/src/water-invader/.agents/qa_playtest_stream_e_sensory_audio`  
**Target Feature**: Feature 12 (Tactical Sonar Ping HUD, Hydrophone Spectrogram & Claustrophobic Stress FX, Web Audio Lifecycle)  

---

## Review Summary

**Verdict**: **REQUEST_CHANGES**  
**Integrity Finding**: **CRITICAL - INTEGRITY VIOLATION (FACADE IMPLEMENTATIONS & DISCONNECTED SUBSYSTEMS)**  
**Overall Risk Assessment**: **CRITICAL**  

While foundational visual rendering code exists and Web Audio node lifecycle cleanup in `SoundManager.ts` cleanly prevents leaks, several flagship features from `IDEAS_PITCH.md` and `DISPATCH.md` are unimplemented facades or disconnected from the active gameplay loop. Crucially, the Hydrophone Spectrogram's Web Audio `AnalyserNode` is never attached (running only an unlinked mathematical simulation fallback), Acoustic Detonation Wavefronts are dead code never triggered by explosions, `screenShakeTrauma` in `HullStressFX` is never applied to the camera, low-frequency hull groans audio is non-existent, and the production build (`npm run build`) is currently failing with TypeScript errors.

---

## 1. Observation

Direct code inspection, tool invocations, and test results produced the following evidence:

### 1.1 Web Audio AnalyserNode Disconnection & Facade
- **File**: `/Users/user/src/water-invader/src/game/flagship/sensory/HydrophoneSpectrogram.ts`
- **Lines 26–28**:
  ```ts
  // Optional attached Web Audio AnalyserNode
  private analyserNode: AnalyserNode | null = null;
  private audioDataArray: Uint8Array<ArrayBuffer> | null = null;
  ```
- **Lines 47–50**:
  ```ts
  public attachAnalyser(analyser: AnalyserNode): void {
    this.analyserNode = analyser;
    this.audioDataArray = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  }
  ```
- **Lines 62–79**:
  ```ts
  if (this.analyserNode && this.audioDataArray) {
    // 1. Live Web Audio FFT sampling
    this.analyserNode.getByteFrequencyData(this.audioDataArray);
    const binCount = this.analyserNode.frequencyBinCount;
    const sampleRate = this.analyserNode.context.sampleRate;
    ...
  } else {
    // 2. Realistic Procedural Hydrodynamic Audio Simulation
    this.simulateHydrodynamicAudio(bands, context);
  }
  ```
- **Grep Observation across codebase**:
  Grep for `attachAnalyser` returned exactly 1 match in the entire project (`HydrophoneSpectrogram.ts:47` - its own definition). It is **never called anywhere** in `src/` or `tests/`.
- **File**: `/Users/user/src/water-invader/src/game/SoundManager.ts`:
  `SoundManager` creates `this.audioCtx = new AudioContextClass()`, but does **not create, maintain, or expose any AnalyserNode**, nor does it expose a master gain node. All sound effects connect directly to `this.audioCtx.destination`.
- **Result**: In live gameplay, `this.analyserNode` is permanently `null`. The game **never** samples live audio via `AnalyserNode.getByteFrequencyData()`. It exclusively runs the procedural simulation fallback.

### 1.2 Acoustic Detonation Wavefronts Dead Code
- **File**: `/Users/user/src/water-invader/src/game/flagship/sensory/TacticalSonarHUD.ts`
- **Lines 60–85**:
  ```ts
  public spawnWavefront(
    x: number,
    y: number,
    color: string = '#06b6d4',
    maxRadius: number = 240
  ): void {
    ...
    this.radarState.activeWavefronts.push(wavefront);
  }
  ```
- **Grep Observation across codebase**:
  `spawnWavefront` is only defined in `TacticalSonarHUD.ts:60`, delegated in `sensory/index.ts:55`, and declared in `types.ts:653`.
- **File**: `/Users/user/src/water-invader/src/game/GameManager.ts:1816–1829`:
  ```ts
  private createExplosion(x: number, y: number, color: string, count: number, speedMult: number = 1.0) {
    if (count > 5) {
      soundManager.playExplosion();
    }
    for (let i = 0; i < count; i++) {
      let p = this.particlePool.pop();
      ...
    }
  }
  ```
- **Result**: `createExplosion()` never calls `flagshipManager.sonarRenderer.spawnWavefront()`. Detonations and torpedo explosions never spawn acoustic wavefronts on the sonar radar. It is completely dead code.

### 1.3 Hull Stress Camera Micro-Shake & Audio Groan Facade
- **File**: `/Users/user/src/water-invader/src/game/flagship/sensory/HullStressFX.ts`
- **Lines 13, 98–100, 106–108**:
  ```ts
  public screenShakeTrauma: number = 0; // 0.0 to 1.0
  ...
  public triggerTrauma(amount: number = 0.8): void {
    this.screenShakeTrauma = Math.min(1.0, this.screenShakeTrauma + amount);
  }
  ...
  if (this.screenShakeTrauma > 0) {
    this.screenShakeTrauma = Math.max(0, this.screenShakeTrauma - deltaTime * 4.5);
  }
  ```
- **Grep Observation across codebase**:
  `screenShakeTrauma` is copied into `radarState.screenShakeTrauma` in `sensory/index.ts:39`, but is **never read by `GameManager.draw()`, `HullStressFX.draw()`, or any rendering context**.
- **File**: `/Users/user/src/water-invader/src/game/GameManager.ts:2586–2595`:
  ```ts
  this.ctx.save();
  if (this.shakeTimer > 0) {
    let shakeAmount = 2;
    if (this.warningTimer > 0) {
      shakeAmount = 5;
    }
    const offsetX = (Math.random() - 0.5) * shakeAmount;
    const offsetY = (Math.random() - 0.5) * shakeAmount;
    this.ctx.translate(offsetX, offsetY);
  }
  ```
- **File**: `/Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts:417–421`:
  ```ts
  public onPlayerDamage(amount: number, context: FlagshipUpdateContext): void {
    if (this.endlessDescent.runState.pressure.stressPercentage > 50) {
      this.sonarRenderer.addFracture(this.endlessDescent.runState.pressure.stressPercentage);
    }
    ...
  ```
- **Result**:
  1. No check for `stress > 80` exists when taking damage.
  2. The 14px camera micro-shake is non-existent.
  3. No low-frequency hull groans audio method exists in `SoundManager.ts` or is ever played (the `animTime` variable in `HullStressFX` intended for groaning pulse is merely incremented and unused).
  4. Player HP loss does not accumulate hull stress. In standard waves 1–20, stress remains 0%, so no stress FX ever activates outside Endless Mode.

### 1.4 Range Ring Radii Divergence
- **File**: `/Users/user/src/water-invader/src/game/flagship/sensory/TacticalSonarHUD.ts:24`:
  ```ts
  public readonly ringPixelRadii: number[] = [60, 120, 180, 240, 300];
  ```
- **Specification**: `IDEAS_PITCH.md:983` and `DISPATCH.md:17`:
  `Concentric dashed range rings at R in {80, 160, 240, 320, 400}px`.
- **Result**: The radii were altered to $[60, 120, 180, 240, 300]$px without updating specifications or providing a configurable scale.

### 1.5 Web Audio Lifecycle & Disconnect Verification
- **File**: `/Users/user/src/water-invader/src/game/SoundManager.ts`:
  Verified all 26 SFX methods (e.g. `playShoot`, `playExplosion`, `playCavitationImplosion`, `playPhoticLaserHum`, `playVentEruptionHiss`). Every method assigns `osc.onended = () => { try { osc.disconnect(); gainNode.disconnect(); ... } catch(e){} }`.
- **Tests**: Ran `npx playwright test tests/stress/challenger_audio_perf_stress.spec.ts:219` and `tests/stress/challenger_audio_perf_stress.spec.ts:282`:
  - `AUDIO-01`: Passed cleanly.
  - `AUDIO-02`: Passed with 100 suspended + 50 running oscillator cycles cleanly terminated, zero errors.
- **Result**: Core audio nodes (`OscillatorNode`, `GainNode`, `BiquadFilterNode`) are properly disconnected and do not leak memory.

### 1.6 Production Build Failure
- **Command**: `npm run build`
- **Output**:
  ```
  Failed to type check.
  tests/adversarial_stream_d_factions_combat.spec.ts(19,5): error TS2353: Object literal may only specify known properties, and 'currentWave' does not exist in type 'FlagshipUpdateContext'.
  tests/adversarial_stream_d_factions_combat.spec.ts(521,51): error TS2554: Expected 3 arguments, but got 4.
  tests/stress/stream_f_console_memory_audit.spec.ts(52,18): error TS2367: This comparison appears to be unintentional because the types ... and '"warn"' have no overlap.
  ```
- **Result**: `npm run build` exits with code 1.

---

## 2. Logic Chain

1. **Premise 1 (Spec Requirement)**: Feature 12 specifies:
   - Concentric range rings at $R \in \{80, 160, 240, 320, 400\}$px.
   - 16-band real-time audio spectrum analyzer driven by Web Audio `AnalyserNode` sampling $40\text{ Hz}$ to $12\text{ kHz}$.
   - Acoustic detonation shockwave wavefronts expanding on explosions ($R(t) = R_0 + 280 \cdot t^{0.85}$).
   - Claustrophobic Hull Stress: Stress >50 triggers low-frequency hull groans; damage at stress >80 triggers 14px camera micro-shake with bubble trails; stress accumulates as player HP drops or hydrostatic pressure rises.
2. **Observation 1.1 $\implies$ Premise 1 Violation**: `HydrophoneSpectrogram` includes code to read from `AnalyserNode`, but `attachAnalyser` is never called. `SoundManager` does not create or expose an `AnalyserNode`. Thus, in live gameplay, the spectrogram only runs an uncoupled procedural simulation while appearing to satisfy the requirement. This constitutes a facade implementation.
3. **Observation 1.2 $\implies$ Premise 1 Violation**: `spawnWavefront()` is implemented in `TacticalSonarHUD`, but `createExplosion()` never invokes it. Detonation shockwaves never appear on the sonar radar during combat. This is dead/disconnected code.
4. **Observation 1.3 $\implies$ Premise 1 Violation**: `HullStressFX` declares `screenShakeTrauma` and increments it via `triggerTrauma()`, but no rendering logic or canvas translation ever reads `screenShakeTrauma`. Taking damage at stress >80 does not trigger a 14px micro-shake. No hull groan audio method exists. Stress is not derived from player HP loss. This constitutes a facade implementation.
5. **Observation 1.4 $\implies$ Premise 1 Divergence**: Range ring radii in code are $[60, 120, 180, 240, 300]$ instead of $[80, 160, 240, 320, 400]$.
6. **Observation 1.5 $\implies$ Node Leak Freedom Verified**: All `OscillatorNode`, `GainNode`, and `BiquadFilterNode` instances in `SoundManager.ts` implement `onended` disconnect callbacks. Tests confirm zero node leaks.
7. **Observation 1.6 $\implies$ Release Blocker**: `npm run build` fails with 3 TypeScript errors.
8. **Conclusion**: Because multiple core Feature 12 requirements are facade implementations or disconnected from gameplay, and `npm run build` fails, the implementation cannot be approved.

---

## 3. Findings & Defect Classification

### Finding 1 [Critical — INTEGRITY VIOLATION]: Web Audio `AnalyserNode` Facade in `HydrophoneSpectrogram`
- **What**: `HydrophoneSpectrogram` claims to be a "16-band real-time audio spectrum analyzer driven by Web Audio AnalyserNode", but `attachAnalyser` is never called, and `SoundManager` does not instantiate or route through an `AnalyserNode`.
- **Where**: `src/game/flagship/sensory/HydrophoneSpectrogram.ts:47`, `src/game/SoundManager.ts`.
- **Why**: It presents a procedural fallback simulation as live audio FFT analysis. The live audio pipeline is never connected.
- **Suggestion**:
  1. Add a master `AnalyserNode` to `SoundManager` (e.g. `this.analyser = this.audioCtx.createAnalyser()`, routing all SFX `gainNode.connect(this.analyser)`, and `this.analyser.connect(this.audioCtx.destination)`).
  2. Expose `soundManager.getAnalyser()`.
  3. In `FlagshipManager` or `SonarRenderer`, call `spectrogram.attachAnalyser(soundManager.getAnalyser())`.

### Finding 2 [Critical — INTEGRITY VIOLATION]: Acoustic Detonation Wavefronts Disconnected from Explosions
- **What**: `spawnWavefront` is implemented in `TacticalSonarHUD`, but never called by `GameManager.createExplosion`, torpedo detonations, or any combat events.
- **Where**: `src/game/flagship/sensory/TacticalSonarHUD.ts:60`, `src/game/GameManager.ts:1816`.
- **Why**: The visual spectacle of expanding acoustic detonation wavefronts ($R(t) = R_0 + 280 \cdot t^{0.85}$) is never seen by the player during combat.
- **Suggestion**: Inside `GameManager.createExplosion` (or through `FlagshipManager`), invoke `this.flagshipManager.sonarRenderer.spawnWavefront(x, y, color, maxRadius)`.

### Finding 3 [Critical — INTEGRITY VIOLATION]: Facade Screen Shake Trauma & Missing Hull Groans
- **What**: `screenShakeTrauma` in `HullStressFX` is never applied to the camera. Taking damage at stress >80 does not trigger a 14px micro-shake. No hull groan audio method exists. Stress never responds to player HP loss.
- **Where**: `src/game/flagship/sensory/HullStressFX.ts:13, 98`, `src/game/flagship/FlagshipManager.ts:419`, `src/game/GameManager.ts:2587`.
- **Why**: The claustrophobic stress feedback loop is broken. Players at low HP experience zero stress effects in standard gameplay.
- **Suggestion**:
  1. Map player HP loss to stress (e.g. `const hpStress = Math.max(0, (1 - player.hp / player.maxHp) * 100); const totalStress = Math.max(hpStress, endlessStress);`).
  2. If `totalStress > 80`, trigger 14px screen shake on damage: `context.triggerScreenShake(0.22, 14)`.
  3. Add `playHullGroan()` synthesized low-frequency FM rumble to `SoundManager.ts` and trigger periodically when `stress > 50`.
  4. Ensure `screenShakeTrauma` is translated into canvas offsets or combined with `GameManager.shakeTimer`.

### Finding 4 [Major]: Polar Range Ring Radii Divergence
- **What**: Polar range ring pixel radii are defined as $[60, 120, 180, 240, 300]$px instead of the specified $[80, 160, 240, 320, 400]$px.
- **Where**: `src/game/flagship/sensory/TacticalSonarHUD.ts:24`.
- **Why**: Radii diverge from the agreed specification in `IDEAS_PITCH.md` and `DISPATCH.md`. While 300px fits within the 600px canvas, the spec intended either a clipping boundary or broader coverage.
- **Suggestion**: Align with the specification or document why 300px was chosen to prevent horizontal clipping outside the 600px logical canvas width.

### Finding 5 [Major]: Pre-Commit Build Failure
- **What**: `npm run build` fails due to 3 TypeScript errors in `adversarial_stream_d_factions_combat.spec.ts` and `stream_f_console_memory_audit.spec.ts`.
- **Where**: `tests/adversarial_stream_d_factions_combat.spec.ts:19, 521`, `tests/stress/stream_f_console_memory_audit.spec.ts:52`.
- **Why**: Project cannot be deployed to Vercel and violates the Pre-Commit & Pre-Push Build Verification rule.
- **Suggestion**: Upstream teams responsible for Stream D and Stream F must resolve the type errors in their respective test files.

---

## 4. Adversarial Challenges

### Challenge 1: The "Silent Spectrogram" Challenge
- **Assumption Challenged**: The hydrophone spectrogram provides real-time tactical acoustic telemetry of in-game weapon discharges and explosions.
- **Attack Scenario**: Mute the audio or fire 100 lasers silently while stationary. The spectrogram displays identical activity because it calculates frequencies using `Math.sin(time) + combatActivity` rather than listening to actual sound output. Conversely, playing loud audio produces zero spectrogram response if bullets/enemies are absent.
- **Blast Radius**: Tactical telemetry is simulated theater rather than genuine audio feedback.
- **Mitigation**: Route Web Audio through an `AnalyserNode` connected to `HydrophoneSpectrogram`.

### Challenge 2: The "Immortal Hull in Campaign" Challenge
- **Assumption Challenged**: Claustrophobic Hull Stress creates tension as the player submersible takes damage.
- **Attack Scenario**: Play waves 1 through 20 of standard arcade mode. Let the player take repeated hits down to 1 HP.
- **Blast Radius**: Zero glass fractures, zero corner vignette, and zero stress effects appear because stress is locked exclusively to `endlessDescent.runState.pressure.stressPercentage`, which remains 0% outside Endless Mode.
- **Mitigation**: Calculate hull stress as a composite of depth pressure AND player HP degradation ($100 \times (1 - \text{HP} / \text{MaxHP})$).

### Challenge 3: The "Phantom Detonation" Challenge
- **Assumption Challenged**: Explosions generate acoustic shockwave pressure wavefronts on the sonar radar.
- **Attack Scenario**: Detonate 50 Cavitation Torpedoes and destroy 100 enemies. Inspect `radarState.activeWavefronts`.
- **Blast Radius**: `activeWavefronts.length` remains 0 throughout the entire playthrough. The wavefront rendering code is never executed.
- **Mitigation**: Hook `spawnWavefront()` into `createExplosion()`.

---

## 5. Verified Claims

| Feature Component | Claimed Behavior | Verified Status | Verification Method |
|---|---|---|---|
| Sweep Rotation | 1 revolution per ~3.5s ($\omega = 1.8$ rad/s) | **PASS** | Checked `TacticalSonarHUD.ts:22` and unit test `SONAR-01` ($1.8$ rad/s). |
| Contact Echo Bloom | Flare on sweep intersection ($R = 18$px, $\alpha = 0.85$, $400$ms decay) | **PASS** | Verified angular check, `bloomTimer = 0.4`, $R = 6 + 12 = 18$px, and exponential alpha decay in `TacticalSonarHUD.ts:306–323`. |
| Spectrogram GUI | 16-band waterfall panel at $(180, 745)$ with 48 rolling history slices | **PASS** | Verified canvas rendering in `HydrophoneSpectrogram.draw()` with decibel color gradation. |
| Glass Fractures | Recursive midpoint displacement glass cracks in corners | **PASS** | Verified `displaceMidpoint()` algorithm (depth 3, roughness 0.28) in `HullStressFX.ts:54–93`. |
| Web Audio Leaks | Zero node leaks after SFX playback | **PASS** | Verified all 26 methods in `SoundManager.ts` disconnect `osc`, `gain`, and `filter` on `onended`. Verified via `AUDIO-01` and `AUDIO-02`. |
| AnalyserNode Hook | Driven by live Web Audio `AnalyserNode` | **FAIL (INTEGRITY VIOLATION)** | `attachAnalyser` is never called; `SoundManager` lacks an `AnalyserNode`. Runs simulation fallback only. |
| Detonation Wavefronts | Spawns shockwaves on explosions | **FAIL (INTEGRITY VIOLATION)** | `spawnWavefront` is dead code; never called on explosions. |
| Hull Groan Audio | Low-frequency groan when stress >50 | **FAIL (FACADE)** | No audio method or sound playback exists for hull groans. |
| Camera Micro-Shake | 14px micro-shake when damaged at stress >80 | **FAIL (FACADE)** | `screenShakeTrauma` never offsets canvas; stress >80 check missing. |
| Production Build | Zero build / TypeScript compilation errors | **FAIL** | `npm run build` exits with code 1 (3 TypeScript errors in test suite). |

---

## 6. Caveats

1. **Review-Only Role**: In accordance with the Reviewer role constraints, no source code fixes were applied directly.
2. **Scope**: Review was scoped strictly to Stream E (Sensory & Audio) and cross-cutting audio/visual contracts. Build errors identified in other test files (`stream_d` and `stream_f`) belong to adjacent stream ownership.

---

## 7. Conclusion

Feature 12 exhibits high visual polish in its standalone math algorithms (polar projection, midpoint displacement, CRT rendering, and Doppler telemetry), and the Web Audio node lifecycle in `SoundManager.ts` is robust with zero memory leaks. However, the subsystem suffers from severe integration disconnects and facade implementations: the Web Audio `AnalyserNode` is unattached, detonation wavefronts are never spawned, hull stress micro-shake and groans are non-functional, and the production build fails.

**Final Verdict**: **REQUEST_CHANGES**  
Development teams must wire up the live `AnalyserNode`, connect `spawnWavefront` to explosions, bind camera micro-shake and HP-based stress, and fix TypeScript build errors before this milestone can be approved.

---

## 8. Verification Method

To independently verify these findings:

1. **Verify AnalyserNode Disconnection**:
   ```bash
   npx ripgrep "attachAnalyser" src/
   ```
   Observe that the method is defined on `HydrophoneSpectrogram.ts:47` but has 0 call sites across `src/`.
2. **Verify Dead Wavefront Code**:
   ```bash
   npx ripgrep "spawnWavefront" src/
   ```
   Observe that no explosion or weapon caller ever invokes `spawnWavefront`.
3. **Verify Dead Camera Shake Trauma**:
   ```bash
   npx ripgrep "screenShakeTrauma" src/
   ```
   Observe that `screenShakeTrauma` is never used inside `ctx.translate()` or any canvas transform.
4. **Verify TypeScript Build Errors**:
   ```bash
   npm run build
   ```
   Observe the 3 TypeScript compilation failures.
5. **Verify Audio Node Cleanup**:
   ```bash
   npx playwright test tests/stress/challenger_audio_perf_stress.spec.ts:219 tests/stress/challenger_audio_perf_stress.spec.ts:282
   ```
   Observe that both `AUDIO-01` and `AUDIO-02` pass with 0 errors and zero node leaks.

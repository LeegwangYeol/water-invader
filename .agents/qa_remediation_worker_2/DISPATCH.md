# Dispatch: Master Flagship QA Remediation Worker (Replacement Instance 2)

## Working Directory
`/Users/user/src/water-invader/.agents/qa_remediation_worker_2`

## Role
Master Flagship QA Remediation Worker (`teamwork_preview_worker`)

## Required Reading
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/PROJECT.md`
- `/Users/user/src/water-invader/COLLABORATION.md`
- Stream handoff reports:
  - `/Users/user/src/water-invader/.agents/qa_playtest_stream_e_sensory_audio/handoff.md`
  - `/Users/user/src/water-invader/.agents/qa_playtest_stream_c_crew_synergy/handoff.md`
  - `/Users/user/src/water-invader/.agents/qa_playtest_stream_d_factions_combat/handoff.md`
  - `/Users/user/src/water-invader/.agents/qa_playtest_stream_b_biolapse_darkness/handoff.md`
  - `/Users/user/src/water-invader/.agents/qa_playtest_stream_a_harpoon_physics/handoff.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Strict Architectural Invariant
NEVER modify `logicalWidth` (600) or `logicalHeight` (800) in `GameManager.ts` or `Enemy.ts`. All responsive adjustments must be strictly CSS-based.

## Remediation Tasks
Implement authentic, production-grade fixes for the defects isolated by the 12 QA streams:

1. **Stream E (Sensory & Audio)**:
   - In `src/game/SoundManager.ts`:
     - Create a master `AnalyserNode` on `this.audioCtx` (e.g., `this.analyser = this.audioCtx.createAnalyser()`).
     - Route sound effects through `this.analyser` to `this.audioCtx.destination`.
     - Expose `getAnalyser(): AnalyserNode | null`.
     - Add `playHullGroan()` synthesized low-frequency FM rumble.
   - In `src/game/flagship/sensory/HydrophoneSpectrogram.ts` / `FlagshipManager.ts`:
     - Connect the master analyser into `spectrogram.attachAnalyser(soundManager.getAnalyser())`.
   - In `src/game/GameManager.ts:createExplosion` (and flagship explosions):
     - Trigger `this.flagshipManager.sonarRenderer.spawnWavefront(x, y, color, maxRadius)` so explosion shockwaves render on the sonar radar.
   - In `src/game/flagship/sensory/HullStressFX.ts`:
     - Connect `screenShakeTrauma` to camera transform or `GameManager.triggerScreenShake(0.22, 14)` when taking damage at stress >80.
     - Compute composite hull stress from player HP loss (`100 * (1 - player.hp / player.maxHp)`) and depth pressure.
     - Align polar range ring radii with spec: `[80, 160, 240, 320, 400]`px.

2. **Stream B (Biolapse Darkness)**:
   - In `src/game/flagship/environment/BiolapseDarknessCycle.ts`:
     - Fix canvas transparency puncture: do not call `destination-out` directly on the main canvas if it erases underlying entities to transparent. Render darkness on a dedicated overlay buffer or draw solid dark radial gradient around headlight.
     - Integrate hostile status effects with `Enemy.ts` and `Bullet.ts`:
       - Stunned enemies (`isStunned` / `stunTimer > 0`) pause movement and firing.
       - Apply `vulnerabilityMultiplier` (+25%) in `takeDamage()`.
       - Homing missiles do not acquire targets with `isCamouflaged`.
       - Unlit enemies get +35% dive haste.
     - Align searchlight toggle key and HUD documentation to avoid collisions.

3. **Stream C (Crew Synergy Deck)**:
   - In `src/game/flagship/progression/CrewOfficerDeck.ts` and `FlagshipManager.ts`:
     - Implement the 12 officer passive perks in runtime logic (Ingrid barricade repair + shockwaves, Jax bullet velocity + Hyper-Kinetic slugs, Ren acoustic mark + crits, Lyra bio-pearl drops + acid reduction).
     - Implement dual resonances: Steam & Thunder (Ingrid+Jax: repairs fire 4 steam missiles) and Acoustic Biosynthesis (Ren+Lyra: crits on tagged foes grant 5% lifesteal).
     - Fix Stasis Pulse deceleration: constant 70% slow (`v = v_base * 0.30`) rather than compounding per-frame decay freezing bullets.
     - In `src/components/game-canvas.tsx`: add mobile touch buttons for Officers 3 & 4 and integrate officer assignment in the Shop/Hangar.

4. **Stream D (Factions & Combat)**:
   - In `src/game/flagship/factions/HadalBioHorrors.ts`:
     - Restore `player.speed = player.baseSpeed` when clinger count returns to 0 (fix permanent speed leak).
     - Check `bullet.piercing` in Spore Siphoner pre-pass (do not swallow piercing bullets).
     - Damage Colossus `boneShieldHp` on non-piercing frontal hits.
     - In `src/game/flagship/factions/EpigeneticMutationEngine.ts`: add `⚠️ HIVE METAMORPHOSIS DETECTED` to alert banner.
   - In `src/game/flagship/factions/AutomatonShieldGrid.ts`:
     - Set `SHIELD_ARC_COS = Math.cos(Math.PI / 4)` (~0.7071) for 45° off-axis flanking deflection.
     - Set inductive shield break `stunTimer = 3.5`.
   - In `src/game/flagship/factions/AutomatonPhalanx.ts`:
     - EMP pulse cuts player fire rate by 50% for 3.0s and pauses barricade repair for 4.0s.
   - In `src/game/flagship/FlagshipManager.ts`:
     - Pass actual weapon damage type (`kinetic`, `missile`, `piercing`) to mutation telemetry.

5. **Stream A (Harpoon Physics)**:
   - In `src/game/flagship/weapons/HydraulicHarpoon.ts`:
     - Release tether if enemy HP <= 0 (prevent zombie entities).
     - Initialize `prevPlayerPos` on frame 0 to prevent velocity damping spike.

6. **Build & Test Verification**:
   - Fix the 3 TypeScript errors in `tests/adversarial_stream_d_factions_combat.spec.ts` and `tests/stress/stream_f_console_memory_audit.spec.ts`.
   - Run `npx tsc --noEmit` and `npm run build` to verify 0 compilation errors.
   - Run `npx playwright test tests/20_flagship_12_features.spec.ts` to confirm 100% pass rate.

## Deliverable
Write your complete remediation report with test and build outputs to `/Users/user/src/water-invader/.agents/qa_remediation_worker_2/handoff.md` and send a message back.

## 2026-09-10T11:13:12Z
<USER_REQUEST>
You are qa_remediation_worker_2.
Your working directory is: /Users/user/src/water-invader/.agents/qa_remediation_worker_2
Read DISPATCH.md in your working directory first, along with ORIGINAL_REQUEST.md, PROJECT.md, and the stream handoff reports cited.
Remediate all isolated defects across Stream E (AnalyserNode, spawnWavefront, screenShakeTrauma, hull groans, range rings), Stream B (darkness composite puncture, enemy stun/camouflaged/vulnerability hooks), Stream C (officer perks, resonances, stasis pulse, UI/touch buttons), Stream D (speed leak, siphoner pierce, shield arc math, inductive stun, EMP prowler, mutation damage types, banner), Stream A (harpoon zombie, frame 0 damping spike), and fix the TypeScript build errors.
Verify with npx tsc --noEmit, npm run build, and playwright test suite.
DO NOT CHEAT. All implementations must be genuine.
Write your complete report to /Users/user/src/water-invader/.agents/qa_remediation_worker_2/handoff.md and send a message back.
</USER_REQUEST>

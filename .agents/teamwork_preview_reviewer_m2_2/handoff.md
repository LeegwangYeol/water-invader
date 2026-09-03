# Reviewer 2: Independent Edge-Case & Systems Review Report (Milestones M1 & M2)

## 1. Observation

### 1.1 Source Code Inspections
- **`src/game/Enemy.ts` (Lines 78–198, 415–498)**:
  - **Level 1–9 Onboarding Baseline**:
    - Enemy HP formula: `hp = 1 + Math.floor(level / 3)`. At Level 9, standard HP is `4`.
    - Boss HP at Level 5: `hp = level * 10 = 50`.
    - Attack cooldown: `fireTimer = Math.random() * 3 + 2` (2.0s ~ 5.0s, Rogues 2.5s ~ 5.5s).
    - Projectile speed: `200 px/s` (Boss `300 px/s`, Rogues `240 ~ 360 px/s`).
    - Projectile damage: Standard `1` damage.
  - **Level 10+ Extreme Scaling & Piecewise Boundary**:
    - Normal enemy HP formula: `standardHp = 4 + (level - 9) * 6 + Math.floor(Math.pow(level - 9, 1.5))`.
      - Level 10: `standardHp = 4 + 1*6 + 1 = 11 HP` (clean step from Level 9's 4 HP).
      - Level 15: `standardHp = 4 + 6*6 + 14 = 54 HP`.
      - Level 20: `standardHp = 4 + 11*6 + 36 = 106 HP`.
    - Shielded Enemy: `hp = 8 + (level - 9) * 4`, `shieldHp = 6 + (level - 9) * 3` (Level 10 EHP = 21, Level 15 EHP = 56).
    - Rogue Legions:
      - Rogue Drone: `hp = 3 + (level - 9) * 3` (Level 10 = 6 HP).
      - Rogue Stalker: `hp = 6 + (level - 9) * 5` (Level 10 = 11 HP).
      - Rogue Mech: `hp = 15 + (level - 9) * 10` (Level 10 = 25 HP, Level 15 = 75 HP).
    - Boss HP Scaling Formula: `hp = 50 + level * 25 + Math.floor(Math.pow(level - 5, 2) * 2.5)`.
      - Level 5 Boss: `50 HP`.
      - Level 10 Boss: `50 + 250 + 62 = 362 HP`.
      - Level 15 Boss: `50 + 375 + 250 = 675 HP`.
      - Level 20 Boss: `50 + 500 + 562 = 1112 HP`.
    - Projectile Velocity & Attack Tempo:
      - Cooldown: `minCooldown = Math.max(0.4, 0.8 - (level - 10) * 0.02)`, `fireTimer = Math.random() * 0.7 + minCooldown` (0.8s ~ 1.5s).
      - Bullet speed: `250 + Math.min(150, (level - 10) * 15)` (250 px/s scaling to 400 px/s, Snipers at 400+ px/s).
    - Elite 2-Damage Projectiles: Snipers, Bosses, Rogue Stalkers, and Rogue Mechs deal 2 damage per shot, menacing a 5 HP max-upgrade player in 3 hits.
    - Aggression AI: `isAggressive = true`, `rushVelocityModifier = 1.8 + Math.min(1.2, (level - 10) * 0.15)` (1.8x ~ 3.0x), directional homing pull towards player X position, periodic downward rush surges (`chargeSurgeY = 60 ~ 100 px/s`).

- **`src/game/GameManager.ts` (Lines 45–58, 391–539, 670–795, 937–966)**:
  - **CrisisDirector Event System**:
    - Supports 5 distinct emergency archetypes: `TITAN_HORDE`, `ACID_STORM`, `SWARM_BLITZ`, `EMP_DISRUPTION`, `TOTAL_WAR`.
    - Warning phase (`warningTimer = 2.0s`): activates siren alarm `soundManager.playCrisisAlarm()`, triggers screen shake, and broadcasts `onCrisisEvent` to HUD overlay.
    - Activation phase (`activateCrisisEffect`):
      1. `TITAN_HORDE`: Spawns Boss dreadnought (`hp >= 250`) + 4 Shielded escorts + 4 Diver units.
      2. `ACID_STORM`: Generates falling toxic hazard projectiles (`speedY = 220 ~ 340 px/s`), damages player / destructible barricades, and cleans up when `y > logicalHeight + 30`.
      3. `SWARM_BLITZ`: Spawns 8 high-speed coordinated pincer Divers + 3 Zigzag units.
      4. `EMP_DISRUPTION`: Suppresses player shooting for 2.5s (`empSuppressionActive = true`, `suppressionLevel = 100`) and spawns 2 Snipers + 2 Rogue Stalkers.
      5. `TOTAL_WAR`: Spawns 11 Invaders and 11 Rogues in dual-flank chaotic clash.
  - **State Cleanup & EMP Reset Integrity**:
    - EMP suppression clears automatically when `empTimer <= 0`.
    - All crisis state (`activeCrisis = null`, `warningTimer = 0`, `bannerText = null`, `empSuppressionActive = false`, `hazardProjectiles = []`) resets completely on:
      - Crisis timeout (`crisisState.timer <= 0`)
      - Wave clear (`remainingHostiles === 0` -> SHOP)
      - Next wave start (`startNextWave()`)
      - Game restart (`init()`)
  - **Wave Clear Safety & Softlock Prevention**:
    - All crisis units inherit `Faction.INVADER` or `Faction.ROGUE`.
    - `remainingHostiles` counts all non-dead Invaders and Rogues.
    - Transition to `GameState.SHOP` is blocked while `warningTimer > 0`, `crisisState.warningTimer > 0`, or active `ACID_STORM` is ongoing with positive duration, preventing premature wave clears and softlocks.

- **`src/game/SoundManager.ts` (Lines 1–434)**:
  - Web Audio AudioContext initializes on first user action (`init()`).
  - Automatically checks `if (this.audioCtx && this.audioCtx.state === 'suspended') { this.audioCtx.resume(); }`.
  - All playback methods check `if (!this.enabled || !this.audioCtx || this.isMuted) return;`.
  - Audio node disconnections in `osc.onended` are safely wrapped in `try { osc.disconnect(); gainNode.disconnect(); } catch (e) {}`.
  - Procedural synthesizer methods added for all crisis events: `playCrisisAlarm()`, `playEmpDisruptionSound()`, `playAcidStormSound()`, `playRogueShoot()`, `playCrossfireHit()`, `playThirdFactionWarning()`.

- **`src/components/game-canvas.tsx` (Lines 1–1001)**:
  - Memoized subcomponents (`TopHUD`, `ShopUpgradePanel`, `CanvasCore`, `MobileControls`, `MenuOverlay`, `ShopModal`, `GameOverModal`) prevent UI render thrashing.
  - Crisis warning banner (`[data-testid="crisis-warning-banner"]`) and hazard badges (`[data-testid="emp-suppression-badge"]`, `[data-testid="acid-storm-badge"]`) render with `pointer-events-none` so gameplay input on the underlying canvas is never blocked.
  - Pause/resume integrity: Manual modal open pauses rAF and clears keys; close resumes rAF seamlessly. `window.blur` and `document.visibilitychange` invoke `clearKeys()` and reset pointer drag to prevent desyncs.

### 1.2 Verification Commands Executed
1. `npx tsc --noEmit` -> **Exit code 0** (0 TypeScript errors).
2. `npm run build` -> **Exit code 0** (Compiled successfully with Turbopack, static routes optimized).
3. `npx playwright test` -> **Exit code 0** (385 passed out of 385 tests in 5.5m across all unit, integration, adversarial, and E2E suites).

---

## 2. Logic Chain

1. **Premise 1 (Mathematical Scaling Continuity)**:
   - Piecewise HP formulas in `Enemy.ts` maintain the gentle onboarding curve for Waves 1–9 ($HP = 1 + \lfloor\text{level}/3\rfloor \in [1, 4]$) and transition to exponential growth at Stage 10+ ($HP = 4 + (\text{level}-9) \times 6 + \lfloor(\text{level}-9)^{1.5}\rfloor$), matching the specification.
   - Boss HP scaling ($50 \to 362 \to 675 \to 1112$ HP for Levels 5, 10, 15, 20) combined with 2-damage elite shots and 0.8s–1.5s fire rates mathematically forces max-upgrade players to utilize tactical cover, barricades, and crossfire.

2. **Premise 2 (State Machine & Softlock Safety)**:
   - All enemies spawned by `CrisisDirector` register under `Faction.INVADER` or `Faction.ROGUE`.
   - `GameManager.ts` evaluates `remainingHostiles` across all active entities and enforces warning timer completion before advancing to `GameState.SHOP`.
   - EMP weapon suppression, Acid Storm hazard projectiles, and warning banners are comprehensively reset in `init()`, `startNextWave()`, and wave completion gates, guaranteeing no state leakage across game loops.

3. **Premise 3 (Audio & UI Resilience)**:
   - `SoundManager.ts` handles browser autoplay policies and audio context suspensions gracefully without throwing unhandled exceptions or blocking the main thread.
   - `game-canvas.tsx` isolates React HUD overlays with `pointer-events-none`, protects canvas DPI scaling, and handles blur/visibility loss without state corruption.

4. **Premise 4 (Integrity & Anti-Facade Audit)**:
   - No hardcoded test responses or facade bypass implementations exist.
   - All physics calculations, AABB bounding box collision checks, fixed-step accumulator updates, and multi-faction AI behaviors are executed genuinely through real procedural code.

---

## 3. Caveats

- **Caveat 1**: Audio synthesis requires initial user interaction (e.g. clicking 'START GAME' or toggling sound) per standard browser Web Audio autoplay policies; this is standard for web browsers and fully accounted for in `SoundManager.init()`.
- **Caveat 2**: All 385 automated tests pass with 100% success rate across Chrome/Chromium; mobile touch emulation tests confirm multi-touch and drag evasion behaviors.

---

## 4. Conclusion

**Verdict: APPROVE**

The implementation of Milestone M1 (Extreme Difficulty Scaling Engine) and Milestone M2 (Emergency Waves & Crisis Events Director) is robust, mathematically sound, defensively coded against all boundary edge cases, and completely free of integrity violations or state leaks.

---

## 5. Verification Method

To independently verify all findings:
```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Production Build
npm run build

# 3. Full Playwright E2E & Adversarial Test Suite
npx playwright test
```
All commands must exit with code 0.

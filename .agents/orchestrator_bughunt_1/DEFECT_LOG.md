# Defect Log: Water Invader Bug-Hunting Swarm

## Discovered Defects & Anomalies

### Track A: 12-Crisis Mechanics
- **DEFECT-A1: Piercing Bullet Multi-Hit Shredding on Sovereign & Anchors**
  - **Severity**: Critical (Breaks combat balance and TTK)
  - **Source**: `bughunt_chal_crisis_2`
  - **Files**: `src/game/crisis/EndGameCrisis.ts` (lines 1000-1049)
  - **Description**: `handleBulletCollision()` registers `bullet.hitEntities.add(entity)`, but completely lacks the prerequisite check `if (bullet.hitEntities.has(entity)) continue;` and fails to decrement `bullet.piercing--`. Because Sovereign is 260x130px, a piercing bullet touching the boss deals full damage on every single frame (~20x intended damage).
  - **Reproduction**: `tests/unit/crisis_adversarial_stress.test.ts` (`ADV-01D`)
  - **Remediation**: In `EndGameCrisis.ts:1000-1049`, add `if (bullet.hitEntities.has(entity)) continue;`, `bullet.hitEntities.add(entity);`, and decrement `bullet.piercing--`. If `bullet.piercing <= 0`, set `bullet.isDead = true`.

- **DEFECT-A2: Non-Functional Enrage Timer & Dead Reality Distortion Code**
  - **Severity**: High (Missing gameplay mechanics)
  - **Source**: `bughunt_chal_crisis_2`
  - **Files**: `src/game/crisis/CrisisSovereign.ts`, `src/game/crisis/EndGameCrisis.ts`
  - **Description**: When `enrageTimer <= 0.0`, no bullet hell overdrive, crisis sirens, or player defeat occurs. `realityDistortionLevel` is assigned to 1.0, but grep confirms it is never read by any renderer, audio synth, or game system (100% dead code).
  - **Reproduction**: `tests/unit/crisis_adversarial_stress.test.ts` (`ADV-03B`)
  - **Remediation**: When `enrageTimer <= 0`, accelerate attack rate (e.g. interval to 0.7s) or trigger enrage cataclysm damage/bullet barrage and visual pulse.

- **DEFECT-A3: Phase 1 to Phase 3 Desynchronization Trap**
  - **Severity**: Medium (State machine edge case)
  - **Source**: `bughunt_chal_crisis_2`
  - **Files**: `src/game/crisis/EndGameCrisis.ts` (line 251)
  - **Description**: `EndGameCrisis.ts:251` only checks `this.phase === CrisisPhase.PHASE_2_HULL` when transitioning to `PHASE_3_CORE`. If Sovereign reaches Phase 3 while crisis is in Phase 1, the crisis is permanently trapped in Phase 1.
  - **Remediation**: Allow transition to Phase 3 if `this.sovereign.phase === CrisisPhase.PHASE_3_CORE` regardless of whether current phase is Phase 1 or Phase 2.

- **DEFECT-A4: Orphaned Anchors on Defeat & Orphaned Allied Fleet on Re-Trigger**
  - **Severity**: Medium (Entity leak / visual artifact)
  - **Source**: `bughunt_chal_crisis_2`
  - **Files**: `src/game/crisis/EndGameCrisis.ts`, `src/game/GameManager.ts`
  - **Description**: Defeating Sovereign while anchors are alive leaves living colliders in `getActiveColliders()`. Calling `GameManager.triggerEndGameCrisis()` while an active Phase 2 crisis exists does not dismiss/warp out the old Dreadnought.
  - **Remediation**: In `EndGameCrisis.transitionToPhase(DEFEATED)`, mark all anchors `isDead = true`. In `GameManager.triggerEndGameCrisis()`, if `alliedReinforcements` exists, call `warpOut()`.

- **DEFECT-A5: Crisis Defeat Rewards Omission Bug**
  - **Severity**: Critical (Player denied score, currency, combo & fanfare upon victory)
  - **Source**: `bughunt_exp_crisis_2`
  - **Files**: `src/game/GameManager.ts` (lines 722, 754–766), `src/game/crisis/EndGameCrisis.ts`
  - **Description**: When player bullets defeat the Sovereign Core during `checkCollisions()`, `transitionToPhase(DEFEATED)` sets `this.isActive = false`. In `GameManager.ts:722`, `if (this.endGameCrisis && this.endGameCrisis.isActive)` evaluates to `false` and skips lines 754–766. The player receives 0 victory rewards (missing +2,000 score, +500 currency, +10 combo, 120-particle explosion, and fanfare).
  - **Remediation**: In `GameManager.ts`, ensure defeat resolution executes when `endGameCrisis.phase === CrisisPhase.DEFEATED` even if `isActive` is false, or retain an `isDefeatedPendingReward` flag until processed.

- **DEFECT-A6: Missing Phase 3 Enrage Attacks for Archetypes 1, 2, and 3**
  - **Severity**: High (Missing archetypal mechanics)
  - **Source**: `bughunt_exp_crisis_2`
  - **Files**: `src/game/crisis/EndGameCrisis.ts` (`executeArchetypeAttack`)
  - **Description**: Archetypes `VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, and `CYBERNETIC_EXTERMINATOR` have no `if (this.phase === CrisisPhase.PHASE_3_CORE)` branches in `executeArchetypeAttack`, causing them to repeat Phase 2 attacks. Their defined Phase 3 super-weapons (`VOID_NOVA`, `BIO_LARVAE_SWARM`, `EMP_CASCADE`) are never dispatched.
  - **Remediation**: Add Phase 3 enrage attack branches in `executeArchetypeAttack` for these 3 archetypes.

---

### Track B: Allied Reinforcements
- **DEFECT-B1: Player Resurrection from 0 HP via Nano-Shield**
  - **Severity**: Critical (Game-breaking state)
  - **Source**: `bughunt_chal_reinforce_1`
  - **Files**: `src/game/crisis/AlliedReinforcements.ts:379`
  - **Description**: `updateRestorativeNanoShield()` checks `if (!player || player.isDead) return;`. Because `player.isDead` is never set to `true` by `Player.ts`, when `player.hp === 0`, `player.hp = Math.min(player.maxHp, player.hp + 1)` resurrects the dead player back to 1 HP.
  - **Reproduction**: `tests/unit/bughunt_allied_reinforcements_stress.test.ts` (Tests `DEFECT-CONFIRMED-2.2` & `DEFECT-CONFIRMED-2.4`)
  - **Remediation**: Guard with `if (!player || player.isDead || player.hp <= 0) return;`

- **DEFECT-B2: React DOM Player HP HUD Desynchronization on Repair**
  - **Severity**: High (UI desync)
  - **Source**: `bughunt_exp_reinforce_1`
  - **Files**: `src/game/GameManager.ts:770-781`
  - **Description**: When `AlliedReinforcements` repairs `player.hp`, `GameManager` does not notify React via `this.onPlayerHpChange(this.player.hp)`. The React DOM HUD hearts/health bar remains stale until the next damage event.
  - **Remediation**: Record `prevHp = this.player.hp` before updating `alliedReinforcements`, and if `this.player.hp !== prevHp`, call `this.onPlayerHpChange(this.player.hp)`.

- **DEFECT-B3: Non-Idempotent `triggerAlliedReinforcements()` Call**
  - **Severity**: High (State thrashing)
  - **Source**: `bughunt_chal_reinforce_1`, `bughunt_exp_reinforce_1`
  - **Files**: `src/game/GameManager.ts:366-371`
  - **Description**: Calling `triggerAlliedReinforcements()` while an active Dreadnought exists unconditionally overwrites the instance, resetting warp-in timers and weapon cooldowns.
  - **Remediation**: Return existing instance if `this.alliedReinforcements && this.alliedReinforcements.isActive && !this.alliedReinforcements.isDismissed`.

- **DEFECT-B4: Escort Fighters Off-Screen Flight & Void Shooting**
  - **Severity**: Medium (Visual / Gameplay glitch)
  - **Source**: `bughunt_exp_reinforce_1`
  - **Files**: `src/game/crisis/AlliedReinforcements.ts:411-420`
  - **Description**: Escort fighters calculate position relative to player without boundary clamping. When player moves near canvas edges, fighters drift up to 45px off-canvas and fire projectiles into off-screen void.
  - **Remediation**: Clamp escort positions to `[10, this.logicalWidth - 30]`.

- **DEFECT-B5: Mobile Toast Text Overflow on Viewports <= 390px**
  - **Severity**: Medium (Visual clipping)
  - **Source**: `bughunt_exp_reinforce_1`
  - **Files**: `src/game/crisis/AlliedReinforcements.ts:605-615`
  - **Description**: The 72-character status ticker text renders at ~388px width, overflowing the 345px banner container on mobile viewports.
  - **Remediation**: Truncate or scale text when `bannerWidth < 380px` or adjust font size.

---

### Track C: Physics, Collision & AI
- **DEFECT-C1: Bullet Tunneling Under High Velocity / Frame Latency**
  - **Severity**: High (under lag spikes or high bullet velocities)
  - **Source**: `bughunt_chal_physics_1`
  - **Files**: `src/game/Entity.ts` (lines 37–47), `src/game/Bullet.ts`, `src/game/GameManager.ts` (lines 1136–1139)
  - **Description**: `Entity.checkCollision()` uses instantaneous AABB without Continuous Collision Detection (CCD) or swept volume. If displacement $|v| \cdot \Delta t > \text{targetHeight} + \text{bulletHeight}$ (e.g. $> 3000\text{ px/s}$ at 60 FPS or $> 500\text{ px/s}$ at 10 FPS lag), bullets tunnel through players, enemies, and bosses with up to 100% miss rate.
  - **Reproduction**: `tests/stress/bughunt_physics_adversarial_stress.spec.ts` (Scenario 2.1 - 2.3)
  - **Remediation Plan**: Introduce swept AABB or sub-stepping / segment intersection in bullet collision checks.

- **DEFECT-C2: Canvas Crash on Non-Finite Coordinates (`NaN`/`Infinity`) & Unclamped Player Y**
  - **Severity**: Critical (causes unhandled `TypeError` crashing render loop)
  - **Source**: `bughunt_chal_physics_1`
  - **Files**: `src/game/Player.ts` (lines 66–70, 194–211), `src/game/crisis/CrisisSovereign.ts` (lines 202–203, 294)
  - **Description**: `Player.ts` and `CrisisSovereign.ts` lack `Number.isFinite` validation. Non-finite values pass into `ctx.createRadialGradient`, throwing `TypeError` in browser engines. Player Y is also not clamped to canvas boundaries.
  - **Reproduction**: `tests/stress/bughunt_physics_adversarial_stress.spec.ts` (Scenario 3.4)
  - **Remediation Plan**: Add `Number.isFinite` guard checks and sanitize coordinates to safe fallback, and clamp player Y to `[0, canvasHeight - playerHeight]`.

- **DEFECT-C3: Enemy Friendly-Fire Raycast Center Asymmetry**
  - **Severity**: Low / Minor visual clipping
  - **Source**: `bughunt_chal_physics_1`
  - **Files**: `src/game/Enemy.ts` (lines 624–627, 705–708)
  - **Description**: Bullet width is 10px (`spawnX` to `spawnX + 10`), but raycast center is set to `spawnX + 3` instead of `spawnX + 5`. With radius 5, the right 2 pixels (`[spawnX + 8, spawnX + 10]`) are unprobed.
  - **Remediation Plan**: Align raycast origin to true bullet center (`spawnX + 5`) and ensure probe corridor encloses full bullet width.

---

### Track D: UI & Viewport Responsiveness
- **Status**: PASSED. Tested across 5 viewports (Mobile SE 375x667, Mobile Modern 390x844, Mobile Tall 412x915, Desktop Standard 1440x900, Desktop Wide 1920x1080).
- Aspect ratio rigidly maintained at 3:4.
- Zero horizontal overflow. Touch controls strictly decoupled from canvas bottom border.

---

### Track E: Audio, Particles & Performance
- **DEFECT-E1: Animation Loop Concurrency & 2x Speedup on Resume**
  - **Severity**: High (Game physics double-speed bug)
  - **Source**: `bughunt_exp_audio_perf_3`
  - **Files**: `src/game/GameManager.ts` (`loop()`, `resume()`)
  - **Description**: `this.loop()` lacks an `isPaused` guard at entry. If a pending rAF fires right as `pause()` is invoked, or during resume, multiple concurrent `requestAnimationFrame` loops run simultaneously, causing 2x physics speed.
  - **Remediation**: Add `if (this.isPaused) return;` at top of `loop()`, and cancel any existing `animationFrameId` before scheduling a new one.

- **DEFECT-E2: Lingering Idle rAF Loop after Game Over**
  - **Severity**: Medium (CPU waste on game over screen)
  - **Source**: `bughunt_exp_audio_perf_3`
  - **Files**: `src/game/GameManager.ts` (`gameOver()`)
  - **Description**: `gameOver()` sets `state = GameState.GAME_OVER` but does not cancel `animationFrameId`, leaving the render loop spinning at 60/120 FPS behind the modal.
  - **Remediation**: Call `if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = 0; }` in `gameOver()`.

- **DEFECT-E3: Active Particle Array Uncapped in GameManager**
  - **Severity**: Medium (Performance drop under heavy barrage)
  - **Source**: `bughunt_exp_audio_perf_3`
  - **Files**: `src/game/GameManager.ts` (`createExplosion`)
  - **Description**: Subsystems instantiate `new Particle()` directly and `this.particles` array grows past 600 during simultaneous boss explosions.
  - **Remediation**: Cap `this.particles.length < 400` in `createExplosion`.

---

### Track F: State Machine & Edge Cases
- **DEFECT-F1: Cumulative Score Inheritance Across Runs on Play Again**
  - **Severity**: Critical (Leaderboard / High score corruption)
  - **Source**: `bughunt_exp_edgecases_2`
  - **Files**: `src/components/game-canvas.tsx` (lines 730–741), `src/game/GameManager.ts` (lines 198–201)
  - **Description**: `GameOverModal` calls `onPlayAgain={startGame}` which calls `init(false, true)` (`resetScoreAndCash = false`). `this.score` is never reset to 0 upon starting a new game! Run 2 inherits the full score from Run 1.
  - **Remediation**: In `GameManager.init()`, always set `this.score = 0` regardless of `resetScoreAndCash`.

- **DEFECT-F2: End-Game Crisis Permanent Lockout on Play Again**
  - **Severity**: Critical (Missing endgame content on Run 2+)
  - **Source**: `bughunt_exp_edgecases_2`
  - **Files**: `src/game/GameManager.ts` (lines 233–235, line 414)
  - **Description**: `hasEndGameCrisisOccurred` is only reset to false `if (resetScoreAndCash)`. Because `onPlayAgain` uses `init(false, true)`, `hasEndGameCrisisOccurred` remains `true` for all subsequent runs in the browser session. No End-Game Crisis will ever trigger in Run 2+.
  - **Remediation**: In `GameManager.init()`, unconditionally reset `this.hasEndGameCrisisOccurred = false;`.

- **DEFECT-F3: TopHUD Combo Ghost Display on Bullet Damage**
  - **Severity**: Moderate (UI visual lockup)
  - **Source**: `bughunt_exp_edgecases_2`
  - **Files**: `src/game/GameManager.ts` (line 1468)
  - **Description**: When player takes bullet damage, `this.combo = 0` is set, but `this.updateScoreUI()` is omitted. Because combo is already 0, the combo decay timer never triggers. The TopHUD displays a frozen ghost combo (e.g. `15x COMBO!`) indefinitely until another enemy is killed.
  - **Remediation**: Add `this.updateScoreUI();` immediately after `this.combo = 0;` on line 1468.

- **DEFECT-F4: Lingering Hostile Bullets Carrying Over into Next Wave**
  - **Severity**: Moderate (Cheap player damage on wave start)
  - **Source**: `bughunt_exp_edgecases_2`
  - **Files**: `src/game/GameManager.ts` (`startNextWave()`, lines 259–294)
  - **Description**: `startNextWave()` does not clear `this.bullets` or `this.solarFlares`. In-flight bullets from the end of Wave N remain frozen during shop and resume in Wave N+1, hitting the player.
  - **Remediation**: In `startNextWave()`, add `this.bullets = []; this.solarFlares = []; this.hazardProjectiles = [];`.

- **DEFECT-F5: Wasted Pure Water on Tank Repair in GameOverModal**
  - **Severity**: Moderate (Economy trap)
  - **Source**: `bughunt_exp_edgecases_2`
  - **Files**: `src/components/game-canvas.tsx` (line 49)
  - **Description**: In `GameOverModal`, player HP is 0. Purchasing tank repair costs 75 pure water and raises HP to 1. But clicking `PLAY AGAIN` calls `init()` which resets `player.hp = Math.max(3, player.hp)`, rendering the purchase completely wasted.
  - **Remediation**: Disable tank repair button in `ShopUpgradePanel` when `hp <= 0`: `disabled={currency < 75 || hp >= 5 || hp <= 0}`.

- **DEFECT-F6: Umbrella Barricade Safe-Zone Radius Breach**
  - **Severity**: Moderate (Cover mechanic failure)
  - **Source**: `bughunt_exp_edgecases_2`
  - **Files**: `src/game/GameManager.ts` (lines 994–999)
  - **Description**: Barricade droplet collision only checks point `(hz.x, hz.y)` without `hz.radius`, whereas player collision checks `hz.x ± hz.radius`. Droplets falling within 5px of a barricade edge miss the barricade but hit the player standing beneath it.
  - **Remediation**: Expand barricade droplet check to include `hz.radius`:
    `hz.x + hz.radius >= b.position.x && hz.x - hz.radius <= b.position.x + b.size.width && hz.y + hz.radius >= b.position.y && hz.y - hz.radius <= b.position.y + b.size.height`.

---

### Build & Compilation Issues
- **DEFECT-BUILD-1: TypeScript Errors in Peer Test File**
  - **Severity**: High (Blocks `npx tsc --noEmit` and `npm run build`)
  - **Source**: `bughunt_chal_ui_responsive_2`, `bughunt_exp_ui_responsive_2`
  - **Files**: `tests/stress/challenger_audio_perf_stress.spec.ts`
  - **Description**: 4 TypeScript compiler errors: redeclaration of `isStrictlyCapped` and invalid property access on `postExplosionParticleCount`.
  - **Remediation**: Fix or sanitize `tests/stress/challenger_audio_perf_stress.spec.ts` variable scoping and property access.

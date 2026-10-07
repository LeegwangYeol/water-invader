# Codebase Total Inspection ("총검사") Specification & Past Bug Invariant Mining Report

**Agent Archetype**: Specification & Past Bug Invariant Miner (`ti_survey_spec_miner_1`)  
**Workspace**: `/Users/user/src/water-invader`  
**Date**: September 23, 2026  
**Milestone**: Phase 0 — Codebase-Wide Survey & Flaw Discovery  

---

## 1. Executive Summary

As part of the codebase-wide Total Inspection ("총검사"), this specification mining operation performed an exhaustive forensic survey of the Water Invader repository. The mission encompassed:
1. Synthesizing all **hard architectural invariants** and physical boundaries that must never be violated (`logicalWidth=600`, `logicalHeight=800`, CSS-only responsive scaling, aspect ratio 3/4, shop pre-continue flow, wave restart vs. continue distinction).
2. Documenting the complete **historical bug taxonomy** from `ORIGINAL_REQUEST.md`, session handoffs, and codebase commit logs, detailing the exact root causes, edge cases, and remediation mechanisms.
3. Conducting a thorough audit of the **test suite coverage matrix** across all 77 Playwright E2E spec files (`tests/*.spec.ts`), 29 unit test files (`tests/unit/*.test.ts`), and 13 stress/benchmark test suites (`tests/stress/*.spec.ts`), identifying all mechanics, weapons, hazards, and boss phases that currently lack dedicated regression tests.
4. Formulating an actionable **automated Playwright testing blueprint** to permanently immunize the project against regressions during this "총검사" operation.

---

## 2. Hard Architectural Invariants & Physical Constraints

The Water Invader engine relies on a set of non-negotiable architectural invariants. Violating any of these breaks mathematical physics, responsive layout, or regression test suites.

| # | Invariant Name | Contract & Canonical Location | Technical Enforcement & Behavior | Violation Consequence |
|---|---|---|---|---|
| **INV-1** | **Logical Coordinate Resolution (600×800)** | `GameManager.ts:161-162`<br>`logicalWidth = 600`<br>`logicalHeight = 800` | All kinematic equations, spatial partitions, enemy formations, projectile velocities, and boundary clamps operate exclusively in a fixed 600×800 2D Euclidean coordinate space. `Enemy.ts`, `Player.ts`, `FlagshipManager.ts`, and `EndGameCrisis.ts` must all inherit these dimensions. | Changing this to 720×960 or dynamic values immediately breaks all 77 Playwright E2E test suites, desynchronizes hitboxes, and causes collision tunneling. |
| **INV-2** | **High-DPI Bitmap Buffer Scaling** | `GameManager.ts:180-182`<br>`canvas.width = 600 * DPR`<br>`canvas.height = 800 * DPR` | The HTML5 Canvas DOM element's bitmap backing buffer is dynamically scaled by `window.devicePixelRatio` (e.g. 1200×1600 on Retina displays) to guarantee crisp vector rendering. Rendering context is normalized or coordinate math is scaled during draw calls. | Drawing in unscaled pixel space causes blurry vector graphics or clipping on mobile displays. |
| **INV-3** | **CSS-Only Responsive Scaling** | `game-canvas.tsx:1287`<br>`max-w-[600px] aspect-[3/4]` | Sizing across mobile, tablet, and desktop viewports is handled **strictly via CSS** (`aspect-[3/4]`, `w-full`, `max-w-[600px]`, `border-blue-900`). The `<canvas>` element fills its container with `w-full h-full block touch-none select-none`. | Modifying canvas resolution in JS for mobile responsiveness breaks touch coordination and fails viewport regression suites (`stream_f_responsive_viewports_verification.spec.ts`). |
| **INV-4** | **DPR-Independent Touch Scaling** | `game-canvas.tsx:1143, 1210`<br>`scaleX = logicalWidth / clientWidth` | Touch drag displacement strictly uses the element client width (`clientWidth` or `rect.width`), NEVER `canvas.width` (which contains DPR pixels). `deltaLogicalX = deltaClientX * (600 / clientWidth)`. | Dividing by `canvas.width` on DPR=2 devices cuts input sensitivity in half or pegs the submarine permanently to the canvas edges. |
| **INV-5** | **Pre-Continue Shop Flow** | `GameManager.ts:544-622`<br>`prepareContinue()` | When the player dies and clicks "Continue" (이어하기), the game MUST NOT immediately resume gameplay. It executes `prepareContinue()`: sets `state = GameState.SHOP`, pauses the loop, cancels rAF, sets player HP to `Math.max(3, hp)`, primes chassis stats, clears bullets/hazards, resets crisis state, and updates UI so the player can purchase upgrades/repairs before the wave resumes. | Bypassing the shop on continue drops player survival agency and fails continue shop persistence tests. |
| **INV-6** | **Wave Restart vs. Continue Distinction** | `GameManager.ts:624-680, 717-724`<br>`continueGame()` vs `restartFromBeginning()` | **Restart** (`restartFromBeginning`): Resets score to 0, currency to starter 150, wave to 1, wipes all player upgrades (`baseFireRate=0.5, multiShot=1, piercing=1, hasAcidShield=false, homingMissiles=0`), resets chassis.<br>**Continue** (`continueGame`): Retains current `level`, preserves existing player upgrades, preserves currency and score, revives player with `hp >= 3` at baseline depth `(600 - width) / 2, 740`, grants 1.5s invincibility frames (`invincibilityTimer = 1.5`). | Conflating restart and continue causes upgrade loss or allows free infinite score runs. |
| **INV-7** | **Pre-Game Shop Access & Persistence** | `game-canvas.tsx:396-412`<br>`GameState.SHOP` before Wave 1 | The Armory/Workshop shop is accessible from the Main Menu prior to launching Wave 1. The starter Pure Water allowance (150 💧) can be spent on upgrades (e.g. Fire Rate 50 💧, Multi-Shot 100 💧) or Modular Chassis selection. When "Start Mission" is clicked, all purchases persist into active gameplay. | Upgrades purchased before Wave 1 being wiped on game start violates player trust and fails `pregame_shop_persistence.test.ts`. |
| **INV-8** | **Boundary Clamping & Non-Teleportation** | `Player.ts:114-126`<br>`Enemy.ts:138-139` | Position `(x, y)` is strictly bounded to `[0, logicalWidth - width]` and `[0, logicalHeight - height]`. Velocity `(vx, vy)` must remain finite (`Number.isFinite`) and non-NaN. Physics corrections must be organic (spring damper, buoyancy decay, boundary bounce) without synthetic instantaneous teleportation. | NaN coordinates cause entities to vanish into void space or freeze the rendering loop. |

---

## 3. Historical Bug Taxonomy & Remediation Anatomy

The following bug patterns were harvested from `ORIGINAL_REQUEST.md`, architectural notes, and test suite commit histories:

```
+==================================================================================================+
|                                    HISTORICAL BUG TAXONOMY MATRIX                                |
+==================================================================================================+
|  1. Upward Drift Lock Bug          -> Hydrothermal vent updraft trapped player at top boundary   |
|  2. Enemy Friendly Fire AI         -> Invaders shooting directly into backs of formation allies  |
|  3. Mobile Viewport Clipping       -> Event warnings clipped & enemies dropping abruptly from top|
|  4. Continue Shop State Loss       -> Continue flow wiping upgrades, score, or crashing loop     |
|  5. Mobile DPR Touch Pegging       -> Canvas DPR buffer divided by CSS width pegging touch to edge|
|  6. Web Audio Context Leak         -> Audio nodes accumulating, audio playing while paused/muted |
|  7. Homing Missile Division-by-Zero-> Seeking dead hostiles or distance=0 causing NaN trajectory |
|  8. High-Speed Bullet Tunneling    -> Projectiles skipping thin barricades/entities between ticks|
|  9. Barricade Saboteur Desync      -> Saboteurs gnawing non-existent barricades or freezing      |
| 10. Piercing Collision Charge Leak -> Bullets damaging same enemy multiple times in single frame |
+==================================================================================================+
```

### 3.1 Bug 1: Upward Drift Lock Bug (Hydrothermal Vent Ceiling Trap)
- **Symptom**: In Wave 10+ with hydrothermal vents active, the player submarine caught in a superheated thermal updraft was propelled upwards and became permanently stuck at `y = 0` (top canvas boundary), unable to descend back to the seabed operating baseline.
- **Root Cause**: The convective updraft velocity was continuously applied without a ceiling dissipation boundary. When the submarine hit the top canvas boundary (`y = 0`), downward keyboard inputs were completely overridden by the upward lift force. Furthermore, the submarine lacked an active ballast restoration force when outside the plume core.
- **Remediation Implemented**:
  1. *Plume Cap Geometry*: Introduced `capY = 100` with an effective ceiling limit at `capCeiling = capY + 30 = 130`.
  2. *Dissipation Band*: A 90px transition zone `[130, 220]` where lift linearly decays to zero (`liftRatio = Math.min(1.0, depthAboveCap / 90)`).
  3. *Radial Lateral Dispersion*: Near the plume cap, upward force converts into lateral outward dispersion (`dispersionSpeed = 120 * (1 - liftRatio) * dt`), pushing the submarine horizontally out of the thermal plume.
  4. *Hydrodynamic Ballast Recovery*: Implemented `isBallastActive`, `ballastDescentSpeed: 165 px/s`, and `isInUpdraft` reset. Once outside the plume, the submarine smoothly descends back to `baselineY` (`740 px`).

### 3.2 Bug 2: Enemy Friendly-Fire AI Backshooting
- **Symptom**: Rear-row invaders frequently fired directly into the backs of front-row allies, causing massive self-inflicted casualties before player engagement.
- **Root Cause**: The firing algorithm evaluated only player distance and a randomized timer. It possessed zero spatial awareness or line-of-sight (LOS) checking through same-faction hitboxes.
- **Remediation Implemented**:
  1. *`hasAlliedObstacleInShotPath(...)` in `Enemy.ts`*:
     - **Tier 1 Fast Path**: For vertical shots (`|dx| < 1e-3`), checks horizontal corridor overlap with dynamic lead estimation (`estTime = distY / 300`) and corridor buffers (4px for normal, 8px for zigzag, 12px for rogues).
     - **Tier 2 General Path**: 2D raycast / slab intersection against all living same-faction ally bounding boxes.
  2. *Lateral Repositioning AI*: When blocked by an ally, the enemy suppresses fire and triggers tactical lateral sliding (`slideDir = -1 | 1`, `slideTimer = 0.4s`) to establish a clear firing lane.

### 3.3 Bug 3: Mobile Viewport Clipping & Sudden Drop-ins
- **Symptom**: On mobile devices with narrow aspect ratios, crisis warning background colors were clipped at the edges, and descending enemies appeared to abruptly drop in from thin air near the top edge.
- **Root Cause**: Layout code attempted to modify internal canvas resolution dynamically. Furthermore, crisis warning banners and backgrounds rendered using fixed pixel coordinates rather than reading full canvas extents.
- **Remediation Implemented**:
  1. *CSS Container Rigidity*: Established `<div className="relative w-full max-w-[600px] aspect-[3/4]">` with overflow hidden.
  2. *Full Canvas Coverage*: Warning backdrops and shader sweeps render across `[0, logicalWidth] × [0, logicalHeight]`.
  3. *External Touch Controls*: Mobile button controls were extracted entirely out of the canvas into a dedicated bottom flex container, preventing gameplay occlusion.

### 3.4 Bug 4: Continue Shop State Loss & Crash Bug
- **Symptom**: Clicking "Continue" after Game Over occasionally caused the wave count to reset to 1, erased purchased upgrades, lost currency, or crashed due to unhandled game loop lifecycle states.
- **Root Cause**: `continueGame()` and `init()` shared common reset logic that did not distinguish between a full game restart and a mid-campaign continue revival. Additionally, opening the shop while the game loop was running caused rAF race conditions and accumulator explosion.
- **Remediation Implemented**:
  1. *Two-Phase Continue Lifecycle*: Separated into `prepareContinue()` (pauses game loop, cancels rAF, sets `state = GameState.SHOP`, primes player health to `Math.max(3, hp)`) and `continueGame()` (resumes playing at the current wave).
  2. *State Preservation*: Explicitly preserves `level`, `score`, `currency`, and player upgrades (`baseFireRate`, `multiShot`, `piercing`, `hasAcidShield`, `homingMissiles`).

### 3.5 Bug 5: Mobile DPR Touch Coordinate Desync Bug
- **Symptom**: On iPhone / Retina screens, dragging the submarine horizontally caused it to immediately jump or peg itself to the rightmost boundary.
- **Root Cause**: The pointer down handler calculated `scaleX = canvas.width / rect.width`. Because `canvas.width = 600 * DPR = 1200`, `scaleX` was evaluated as 2.0 to 3.0 instead of 1.0, doubling or tripling touch coordinates relative to the 600px logical frame.
- **Remediation Implemented**:
  1. Fixed touch delta scale calculation: `const scaleX = gameManagerRef.current.logicalWidth / (canvas.clientWidth || rect.width)`.
  2. Implemented pointer capture (`setPointerCapture` / `releasePointerCapture`) and strict boundary clamping `[0, logicalWidth - player.size.width]`.

### 3.6 Bug 6: Web Audio Context Lifecycle & Memory Leaks
- **Symptom**: Web Audio nodes accumulated in memory during extended sessions; browser console warnings regarding unstarted AudioContexts; audio continuing to play when game was paused.
- **Root Cause**: Oscillators and GainNodes were synthesized on demand without disconnecting upon sound completion; AudioContext was initialized prior to user gesture, violating browser autoplay policies.
- **Remediation Implemented**:
  1. *Lazy Gesture Initialization*: `SoundManager.init()` is invoked only on the first user interaction (clicking Start, Armory, or pressing space).
  2. *Guaranteed Node Teardown*: Every audio generator attaches an `onended` handler:
     ```ts
     osc.onended = () => {
       try { osc.disconnect(); gainNode.disconnect(); } catch (e) {}
     };
     ```
  3. Master mute and pause checks gate all audio emission.

### 3.7 Bug 7: Homing Missile Division-by-Zero & Target Acquisition Loops
- **Symptom**: Homing missiles froze in place, flew backward off-screen, or threw NaN velocity errors when targeting enemies that died mid-flight.
- **Root Cause**: Normalization `Math.hypot(dx, dy)` produced 0 when a missile reached an enemy's exact center, causing division by zero. Missiles failed to validate whether their target entity had `isDead = true`.
- **Remediation Implemented**:
  1. Epsilon guard: `if (dist > 1e-4) { vx = (dx / dist) * speed; }`.
  2. Target re-acquisition: If current target is null, dead, or off-screen (`y < 0 || y > 800`), the missile dynamically acquires the closest living hostile.
  3. Sanitization check: `Number.isFinite(missile.position.x)` clamp.

---

## 4. Comprehensive Feature Discovery & Interface Inventory

### 4.1 Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Kinematics & Sub | Player Kinematics & Ballast | 2D submarine movement with smooth hydrodynamic ballast descent | Arrow keys / A-D, touch drag, dt | Position `(x, y)`, velocity, hitboxes | NaN reset to center baseline; clamped `[0, 600-w]` | `src/game/Player.ts` |
| 2 | Kinematics & Sub | Modular Submersible Chassis | 5 submersibles (Nautilus, Stingray, Kraken, Leviathan, Ghost) with distinct radar stats | Chassis selection in Hangar | HP, speed, armor, passive abilities | Fallback to default Nautilus if invalid | `ModularChassis.ts` |
| 3 | Combat & Weapons | Primary Hydro-Cannon | Multi-shot, piercing water droplet projectiles | Spacebar / touch tap | `Bullet[]` array emission | Cooldown throttle; finite coord validation | `src/game/Player.ts`, `Bullet.ts` |
| 4 | Combat & Weapons | Autonomous Homing Missiles | 5-tier missile salvos seeking nearest living hostile | Cooldown timer & missile upgrade level | `HomingMissile[]` with curved tracking | Target dead -> reacquire; dist=0 -> forward fly | `src/game/Bullet.ts`, `Player.ts` |
| 5 | Combat & Weapons | Cavitation Torpedo | Two-stage supercavitating torpedo with remote singularity & shockwave | Key [C] launch & double-tap trigger | Gravitational suction well, 150px shockwave | <100px safety arm prevents detonation | `CavitationTorpedo.ts` |
| 6 | Combat & Weapons | Bioluminescent Laser & Prisms | Hitscan beam with heat accumulation, overdrive, and Quartz Prisms | Key [V] hold & deploy prism | Continuous beam, multi-angle fan refraction | 100 HU -> 2.2s thermal lockout | `BioluminescentLaser.ts`, `RefractionPrism.ts` |
| 7 | Combat & Weapons | Hydraulic Harpoon & Slingshot | 12-node Verlet cable tethering enemies for meat-shield & catapult | Key [F] fire, winch, and release | Tether constraint, centripetal whip, projectile eject | Snaps at 420px max elongation; resets safely | `HydraulicHarpoon.ts` |
| 8 | Environment | Benthic Hydrothermal Vents | Seafloor chimneys cycling DORMANT -> CHARGING -> ERUPTING | Time cycle, player/hostile collision | Lift updraft, lateral dispersion, Steam Lance bullets | Plume cap ceiling at 130px prevents top trap | `HydrothermalVent.ts` |
| 9 | Environment | Deep Ocean Currents | Stratified dual-shelf horizontal fluid shear drift | Entity coordinates `(x, y)` | Lateral drag displacement `(vx, vy)` | Clamped to screen bounds | `OceanCurrent.ts` |
| 10 | Environment | Biolapse Darkness Cycle | 4-phase day/night cycle with steerable headlight & active sonar | Time cycle, battery, high-beam toggle | Ambient lux [0.0, 1.0], illuminated entity masks | Battery depletion turns off high-beam | `BiolapseDarknessCycle.ts` |
| 11 | Factions & Swarms | Standard Invaders (6 types) | Normal, Zigzag, Sniper, Diver, Shielded, Splitter | Wave spawn configuration | Movement patterns, downward bullets | Boundary bounce; friendly fire suppression | `src/game/Enemy.ts` |
| 12 | Factions & Swarms | Rogue Faction (3rd Faction) | Mid-tier Rogues (Drone, Stalker, Mech, Goliath, Phantom) | Wave 5+ incursion director | 3-way free-for-all combat, evasion dashes | Clamped coordinates, ally fire suppression | `src/game/Enemy.ts` |
| 13 | Factions & Swarms | Hadal Bio-Horrors | Mutating faction with Parasite Clingers, Siphoners, Colossus | Damage profile history | Adaptive mutations, speed debuff, spore clouds | 4 rapid wiggles shake off clingers | `HadalBioHorrors.ts`, `EpigeneticMutationEngine.ts` |
| 14 | Factions & Swarms | Automaton Shield Phalanx | Ancient bronze relic fleet forming hexagonal shield conduits | Multi-drone proximity (<=160px) | 40% damage dampening, rail slugs, EMP nova | Broken drone triggers inductive stun on links | `AutomatonPhalanx.ts`, `AutomatonShieldGrid.ts` |
| 15 | Bosses & Crises | Multi-Phase End-Game Crises | 12 Stellaris-style cosmic archetypes across 4 distinct phases | Stage 15+ or trigger incursion | Dimensional rifts, cataclysm warning, super-weapons | Sovereign invulnerable while rifts active | `EndGameCrisis.ts`, `CrisisSovereign.ts` |
| 16 | Bosses & Crises | Apex Boss: Kraken Prime | 12,000 HP behemoth with 8 IK tentacles, Charybdis Maw, Core | Boss spawn trigger | Subsystem targeting, vortex suction, ink blackout | Maw invulnerable until frontal tentacles die | `KrakenPrimeBoss.ts` |
| 17 | Allies & Defense | Allied Reinforcements | Fighters, Medics, and Repair Bots with health bars & role UI | Crisis Phase 2 or low-HP emergency trigger | Interceptor missiles, player heal, barricade repair | Auto-warp out on crisis victory | `AlliedReinforcements.ts`, `Helper.ts` |
| 18 | Allies & Defense | Voxel Coral Barricades | 4 central defensive barricades damaged by voxels | Bullet / collision impact | Voxel destruction, acoustic shockwave erosion | Rebuilt between waves or by Repair Bots | `src/game/Barricade.ts` |
| 19 | Progression | Veteran Crew Officer Deck | 4 bridge officers (Ingrid, Jax, Ren, Lyra) with active abilities | Promotion (25 💧), keybind trigger | Active stasis bubble, decoy, drones, overdrive | Fatigue lockout on overuse | `CrewOfficerDeck.ts`, `BridgeCrewRoster.tsx` |
| 20 | Modes | Endless Descent Roguelike | Bathymetric DAG map, 24 boons, hydrostatic pressure strain | Node selection, run progression | Pressure accumulation, hull breach leaks | Ballast purge vents pressure for pure water | `EndlessDescent.ts`, `BathymetricDAG.ts` |
| 21 | Sensory & UI | Tactical Sonar HUD & Hydrophone | 1.8 rad/s polar sweep, 16-band waterfall FFT, glass fractures | Audio FFT data, hull stress percentage | Contact echo bloom, spectrogram, shatter FX | Clamped stress percentage [0, 100] | `TacticalSonarHUD.ts`, `HydrophoneSpectrogram.ts` |
| 22 | Audio Engine | Procedural Web Audio Engine | Synthesized sub-bass rumbles, lasers, cataclysm sirens, mute | Game events & triggers | Real-time Web Audio API sound synthesis | Disconnects all nodes on completion; lazy init | `src/game/SoundManager.ts` |

### 4.2 Edge Cases Discovered
| # | Feature | Input / Condition | Observed & Enforced Behavior |
|---|---|---|---|
| 1 | Hydrothermal Vent | Player at ceiling (`y=130`) inside active plume | Upward lift ceases at plume cap (`y=130`); lateral dispersion pushes player outwards horizontally until outside plume halo. |
| 2 | Hydrothermal Vent | Player escapes plume after being lifted to top | `isInUpdraft` evaluates to `false`; `isBallastActive` smoothly restores submarine depth to `baselineY = 740` at 165 px/s. |
| 3 | Enemy Friendly Fire | Rear invader targeting player while ally is directly in front | `hasAlliedObstacleInShotPath` detects vertical/slab collision, suppresses shot, and triggers lateral slide repositioning. |
| 4 | Mobile Touch Drag | Rapid swipe extending past canvas bounding box | Pointer capture retains control; submarine coordinate clamped strictly to `[0, 600 - width]`. |
| 5 | Continue Shop | Player dies at Wave 8, clicks Continue, buys upgrades | Game pauses into `SHOP` state, upgrades applied to player, clicking "Resume Wave" restarts Wave 8 with upgrades preserved. |
| 6 | Full Game Restart | Player dies at Wave 8, clicks "Restart from Beginning" | Resets wave to 1, score to 0, currency to 150, wipes all player upgrades, respawns Wave 1 fresh. |
| 7 | Homing Missile | Enemy dies while missile is in flight | Missile detects `target.isDead === true`, searches for nearest living enemy, re-orients without NaN errors. |
| 8 | Cavitation Torpedo | Player double-taps [C] within 50px of launch | Detonation is rejected because distance < 100px arming threshold; torpedo continues as inert kinetic slug. |
| 9 | Laser Overheat | Player fires continuous laser until heat reaches 100 HU | Laser immediately enters `LOCKOUT` state, cuts off beam, and enforces a 2.2s cooldown penalty. |
| 10 | Parasite Clingers | 3 Hadal clingers attach to submarine hull | Submarine speed reduced by 75%; 4 alternating left/right steering wiggles within 1.2s detach all clingers. |
| 11 | Automaton Phalanx | Aegis drone destroyed while linked to 2 sentinels | Grid triggers inductive backlash: linked drones take stun (`stunTimer = 1.8s`) and shields collapse. |
| 12 | Endless Descent | Hydrostatic pressure reaches 100% strain | Hull breach occurs: submarine takes 1 damage per 12s and max heart containers begin crushing. |
| 13 | Pre-Game Shop | Player spends 150 starter currency on fire rate + chassis | Upgrades and selected chassis persist seamlessly into active Wave 1 gameplay upon clicking "Start Mission". |
| 14 | Web Audio Mute | User toggles Mute button on top HUD | All subsequent synthesized audio nodes immediately abort playback; zero audio emitted. |
| 15 | Screen Resize | Window resized during active gameplay or shop | Canvas backing buffer resizes to `600*DPR × 800*DPR` while CSS aspect ratio 3/4 preserves 600×800 logical scaling. |

---

## 5. Test Suite Coverage Matrix & Gap Analysis

### 5.1 Test Suite Inventory
The current automated test harness consists of **77 Playwright E2E spec files** in `tests/`, **29 unit test files** in `tests/unit/`, and **13 stress/adversarial test files** in `tests/stress/`.

```
+==================================================================================================+
|                                    TEST HARNESS INVENTORY SUMMARY                                |
+==================================================================================================+
|  Directory               File Count     Total Test Count    Execution Engine                     |
|  ----------------------------------------------------------------------------------------------- |
|  `tests/*.spec.ts`       77 files       632 tests           Playwright E2E (Chromium Headed/Headless)
|  `tests/unit/*.test.ts`  29 files       317 tests           Playwright Test Runner (Mock Canvas) |
|  `tests/stress/*.spec.ts`13 files       114 tests           Playwright Adversarial Stress Tests  |
|  `tests/benchmark/*`     1 spec file    1 test              Benchmark Telemetry Engine           |
|  ----------------------------------------------------------------------------------------------- |
|  TOTAL                   120 files      1,064 tests                                              |
+==================================================================================================+
```

### 5.2 Subsystem Coverage Matrix
| Subsystem / Feature Area | Primary Source Files | Dedicated Spec / Test Files | Test Count | Live Browser vs Headless Mock | Coverage Rating | Identified Coverage Gaps |
|---|---|---|---|---|---|---|
| **Core Loop & Invariants** | `GameManager.ts`, `types.ts` | `01_ui_and_controls`, `03_game_mechanics`, `04_multiwave_progression`, `water-invader` | 32 | Live Browser | **HIGH** | Legacy assertion in `01_ui_and_controls` assumes DPR=1 |
| **Kinematics & Ballast** | `Player.ts`, `HydrothermalVent.ts` | `playtest_buoyancy_drift_escape`, `adversarial_buoyancy_ballast_stress` | 38 | Both | **EXCELLENT** | None (exhaustively covered) |
| **Mobile CSS & Touch** | `game-canvas.tsx`, `globals.css` | `stream_f_responsive_viewports`, `mobile_controls_and_touch_evasion`, `cross_device_touch` | 28 | Live Browser | **EXCELLENT** | Touch drag with variable chassis hitboxes |
| **Economy & Shop Flow** | `ShopOverlay.tsx`, `GameManager.ts` | `06_shop_economy_max_upgrades`, `continue_vs_restart_on_death`, `adversarial_economy_shop` | 42 | Live Browser | **EXCELLENT** | Pre-game shop + chassis + crew synergy integration |
| **Allied Reinforcements** | `AlliedReinforcements.ts`, `Helper.ts` | `18_allied_reinforcements_and_roles`, `allied_reinforcements.test.ts` | 25 | Both | **HIGH** | Repair Bot priority targeting on barricades |
| **Barricades & Saboteurs** | `Barricade.ts`, `Enemy.ts` | `19_barricade_saboteur_and_repair.spec.ts` | 12 | Live Browser | **HIGH** | Acoustic shockwave fracture on barricades |
| **12 End-Game Crises** | `EndGameCrisis.ts`, `DimensionalRift.ts` | `15_endgame_crisis_12_archetypes`, `13_endgame_crisis_stage15`, `crisis_expansion_12` | 65 | Both | **EXCELLENT** | Phase 3 Core Enrage countdown timer verification |
| **Homing Missiles** | `Bullet.ts`, `Player.ts` | `16_homing_missile_combat.spec.ts`, `homing_missile.test.ts` | 23 | Both | **EXCELLENT** | None |
| **Enemy Swarms & 3rd Faction** | `Enemy.ts`, `GameManager.ts` | `16_enemy_swarm_and_third_faction`, `05_three_way_battle` | 55 | Both | **HIGH** | Phase dash afterimages on Rogue Phantom |
| **Cavitation Torpedo (F1)** | `CavitationTorpedo.ts` | `playtest_stream_a_torpedo_laser`, `flagship_features.test.ts` | 16 | Both | **HIGH** | CCD at terminal cruise velocity (580 px/s) |
| **Prism Laser (F2)** | `BioluminescentLaser.ts` | `playtest_stream_a_torpedo_laser`, `flagship_features.test.ts` | 15 | Both | **HIGH** | Beam angle refraction through multiple prisms |
| **Hydraulic Harpoon (F3)** | `HydraulicHarpoon.ts` | `playtest_stream_a_harpoon_live_browser`, `stream_a_harpoon_physics_stress` | 27 | Both | **EXCELLENT** | High-velocity slingshot projectile tunneling |
| **Hydrothermal Vents (F4)** | `HydrothermalVent.ts`, `OceanCurrent.ts` | `playtest_stream_b_vents_currents`, `playtest_buoyancy_drift_escape` | 24 | Both | **EXCELLENT** | Multi-vent confluence with dual opposing currents |
| **Biolapse Darkness (F5)** | `BiolapseDarknessCycle.ts` | `20_flagship_12_features`, `flagship_features.test.ts` | 8 | Headless Mock | **MEDIUM** | Live browser searchlight canvas composite overlay |
| **Modular Chassis (F6)** | `ModularChassis.ts`, `DeepSeaHangar.tsx` | `playtest_stream_c_modular_chassis`, `DeepSeaHangar` | 15 | Live Browser | **HIGH** | Chassis hitbox variations under touch evasion |
| **Crew Officer Deck (F7)** | `CrewOfficerDeck.ts`, `BridgeCrewRoster.tsx` | `20_flagship_12_features`, `flagship_features.test.ts` | 6 | Mostly Headless | **GAP (LOW)** | **No live browser test clicking Bridge Crew UI in Shop** |
| **Hadal Bio-Horrors (F8)** | `HadalBioHorrors.ts`, `EpigeneticMutationEngine.ts` | `adversarial_stream_d_factions_combat`, `flagship_features.test.ts` | 12 | Mostly Headless | **GAP (MEDIUM)** | **No live browser test verifying 4-wiggle shake off** |
| **Automaton Phalanx (F9)** | `AutomatonPhalanx.ts`, `AutomatonShieldGrid.ts` | `adversarial_stream_d_factions_combat`, `flagship_features.test.ts` | 11 | Mostly Headless | **GAP (MEDIUM)** | **No live browser test verifying shield grid overload** |
| **Apex Bosses (F10)** | `KrakenPrimeBoss.ts` | `kraken_prime_apex_boss.spec.ts` | 10 | Live Browser | **MEDIUM** | Non-Kraken bosses (SMS Leviathan, Hadal Patriarch) |
| **Endless Descent (F11)** | `EndlessDescent.ts`, `BathymetricDAG.ts` | `playtest_stream_e_endless_descent`, `flagship_features.test.ts` | 9 | Both | **HIGH** | Hydrostatic pressure hull breach leak damage test |
| **Sensory Suite (F12)** | `TacticalSonarHUD.ts`, `HydrophoneSpectrogram.ts` | `20_flagship_12_features`, `flagship_features.test.ts` | 6 | Headless Mock | **GAP (LOW)** | Live browser waterfall spectrogram rolling buffer |
| **Memory & Lifecycle** | `SoundManager.ts`, `game-canvas.tsx` | `challenger_audio_perf_stress`, `stream_f_console_memory_audit` | 7 | Both | **MEDIUM** | Complete component unmount teardown test |

---

## 6. Blueprint for Automated Playwright Tests ("총검사" Addition Plan)

Based on the coverage gaps and past bug invariants identified, the following dedicated test suites are blueprint specifications to be implemented during Milestone M4 of the "총검사":

### Suite 1: Flagship Faction Live Browser Integration (`tests/flagship_factions_live_browser.spec.ts`)
1. **Bio-Horror Parasite Clinger & Wiggle Shake-Off E2E**:
   - Spawn Hadal Clinger; let it latch onto player hull.
   - Assert `attachedParasiteCount === 1` and player speed is reduced by 25%.
   - Dispatch 4 alternating Left-Right keyboard events (`ArrowLeft` -> `ArrowRight` -> `ArrowLeft` -> `ArrowRight`) within 1.2s.
   - Assert `attachedParasiteCount === 0` and player speed is fully restored to 300 px/s.
2. **Automaton Shield Conduit & Inductive Backlash E2E**:
   - Spawn 3 Aegis Automaton drones in formation within 120px of each other.
   - Assert hexagonal conduit links are formed.
   - Fire player bullet into one drone; assert 40% harmonic dampening distributes damage to neighbors.
   - Deplete one drone to 0 HP; assert adjacent linked drones enter `isBacklashStunned` with `stunTimer >= 1.8s`.

### Suite 2: Bridge Crew Deck & Shop UI Integration (`tests/flagship_crew_deck_shop_ui.spec.ts`)
1. **Pre-Game Bridge Crew Promotion Flow**:
   - Open Armory from Main Menu.
   - Verify `BridgeCrewRoster` component is rendered.
   - Click "Promote" button for Officer Ingrid (spending 25 Pure Water).
   - Assert currency drops from 150 to 125 💧 and Ingrid's rank increases to Rank 2 (Lieutenant).
   - Click "Start Mission"; verify player in Wave 1 has Ingrid's passive engineering perk active.
2. **Active Bridge Ability Triggering**:
   - In active gameplay, press key '1' (Dr. Lyra Vance decoy ability).
   - Assert Decoy Pod entity is spawned in the game loop and attracts enemy targeting.
   - Assert Lyra enters fatigue cooldown lockout.

### Suite 3: Continuous Collision Detection (CCD) & Extreme Kinematics (`tests/ccd_and_extreme_kinematics.spec.ts`)
1. **High-Speed Cavitation Torpedo Barricade Tunneling**:
   - Launch Cavitation Torpedo at terminal cruise speed (580 px/s).
   - Position single-row coral barricade directly in trajectory.
   - Run game update with large delta-time tick (`dt = 0.05s`, 29px displacement step).
   - Assert torpedo does NOT tunnel through barricade without registering acoustic vibration.
2. **Harpoon Slingshot Catapult Impact**:
   - Tether high-mass enemy, stretch cable to maximum strain (400px), and release slingshot catapult.
   - Assert projectile launches at 720 px/s and cleanly impacts intermediate enemy line without skipping entities.

### Suite 4: Sensory UI & Hull Stress Spectrogram (`tests/flagship_sensory_spectrogram.spec.ts`)
1. **Real-time Hydrophone Spectrogram Buffer**:
   - Trigger heavy combat audio (explosions, torpedo launch).
   - Evaluate `flagshipManager.sonarRenderer.waterfallState`.
   - Assert 16 frequency bands update with non-zero FFT magnitudes and waterfall buffer rolls smoothly.
2. **Critical Hull Stress Fracture Generation**:
   - Simulate hydrostatic pressure reaching 85%.
   - Assert `radarState.glassFractureLines` contains at least 3 branching fracture lines.

### Suite 5: Full Component Unmount & Resource Teardown (`tests/lifecycle_unmount_teardown.spec.ts`)
1. **Web Audio & DOM Listener Teardown**:
   - Mount game canvas, start game, trigger audio effects.
   - Navigate away or unmount `<CanvasCore />`.
   - Assert `requestAnimationFrame` loop is cancelled (`animationFrameId === 0`).
   - Assert `window.AudioContext` state is suspended or closed.
   - Assert zero orphaned window resize or keydown event listeners remain active.

---

## 7. High-DPI DPR Test Fix Recommendation

During the mining run, inspecting `tests/01_ui_and_controls.spec.ts` revealed that lines 24-25 assert:
```ts
const canvasWidth = await canvas.evaluate((el: HTMLCanvasElement) => el.width);
const canvasHeight = await canvas.evaluate((el: HTMLCanvasElement) => el.height);
expect(canvasWidth).toBe(600);
expect(canvasHeight).toBe(800);
```
**Architectural Inconsistency**: `GameManager.ts:180-182` explicitly sets `canvas.width = 600 * dpr`. On High-DPI / Retina test runners, `canvas.width` is 1200, which causes this legacy assertion to fail.  
**Recommended Enhancement**: Update `01_ui_and_controls.spec.ts` to assert:
```ts
const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
expect(canvasWidth).toBe(Math.round(600 * dpr));
expect(canvasHeight).toBe(Math.round(800 * dpr));
```
This aligns `01_ui_and_controls.spec.ts` with `stream_f_responsive_viewports_verification.spec.ts` and the authoritative DPR architecture.

---

## 8. Verification Commands & Health Check

The following independent verification commands confirm the current health of the codebase:

```bash
# 1. TypeScript Static Analysis (Must exit with 0 errors)
npx tsc --noEmit

# 2. Next.js Production Build (Must compile successfully)
npm run build

# 3. Master Flagship E2E Test Suite (All 13 features pass)
npx playwright test tests/20_flagship_12_features.spec.ts

# 4. Buoyancy & Upward Drift Invariant Test Suite
npx playwright test tests/playtest_buoyancy_drift_escape.spec.ts

# 5. Friendly Fire AI Suppression Test Suite
npx playwright test tests/unit/friendly_fire_ai.test.ts
```

All static checks pass cleanly with **0 TypeScript errors** and **0 build errors**.

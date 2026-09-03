# Comprehensive Codebase Survey: Crisis Architecture, Crisis Expansion, Pre-Game Shop Access, & Testing Infrastructure

**Author**: `teamwork_preview_explorer_survey_3` (Explorer Archetype)  
**Date**: 2026-09-02  
**Target Repository**: `water-invader` (Next.js 16 + React 19 + Canvas 2D + Playwright)

---

## Executive Summary

This survey provides an exhaustive analysis of the `water-invader` codebase across four critical dimensions:
1. **Crisis System Architecture**: Mapping the two distinct crisis systems (Stage 10+ Intermediate Crisis Events and Stage 15+ Stellaris-Style End-Game Crisis Incursion Engine), including phase progressions, EHP balance (5,200 EHP), gravitational physics, attack routines, and win/loss conditions.
2. **Opportunities for Crisis Expansion**: Identifying concrete avenues to expand crisis variety, introducing distinct Phase 1 mechanics per archetype, potential new crisis types (e.g., Solar Flare / Coronal Ejection, Quantum Vortex, Nanite Swarm), and hazard modifiers.
3. **Pre-Game Lobby / Main Menu State Flow & Shop Access**: Diagnosing the current state flow (`GameState.MENU`, `GameState.PLAYING`, `GameState.SHOP`, `GameState.GAME_OVER`), pinpointing the fatal bug where `GameManager.init()` wipes purchased upgrades upon game start, and proposing an end-to-end architecture for pre-game shop access.
4. **Testing Infrastructure**: Cataloging Playwright test configurations (`playwright.config.ts`), headless unit test simulation tracks (`tests/unit/*.test.ts`), full-stack E2E specs (`tests/*.spec.ts`), build validation commands, and test authoring standards.

---

## 1. Crisis System Architecture

The codebase features **two layered crisis systems**:

```
+----------------------------------------------------------------------------------------------------+
|                                      GAME CRISIS LIFECYCLE                                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [Stage 10+ Intermediate Crises]                          [Stage 15+ End-Game Crisis Incursion]    |
|  - Trigger: Random timer (16s-24s) on non-boss waves      - Trigger: Random (30%) or Pity (>=W18)   |
|  - Duration: 3.5s - 12.0s                                  - Total EHP: 5,200 EHP across 3 Phases    |
|  - Types:                                                 - Archetypes:                            |
|    * TITAN_HORDE (Dreadnought + 8 Escorts)                   * VOID_SOVEREIGN                       |
|    * ACID_STORM (Hazard falling rain)                        * ABYSSAL_LEVIATHAN                    |
|    * SWARM_BLITZ (Coordinated pincer divers)                 * CYBERNETIC_EXTERMINATOR              |
|    * EMP_DISRUPTION (2.5s weapon suppression)                                                      |
|    * TOTAL_WAR (11 Invaders vs 11 Rogues)                                                          |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 1.1 Layer A: Stage 10+ Intermediate Crisis Events

- **Types Defined**: `src/game/types.ts` (lines 44–66)
  ```typescript
  export type CrisisType = 'TITAN_HORDE' | 'ACID_STORM' | 'SWARM_BLITZ' | 'EMP_DISRUPTION' | 'TOTAL_WAR';
  ```
- **Trigger Conditions**: Evaluated in `src/game/GameManager.ts` (lines 831–837) when `this.level >= 10`, `this.crisisTimer <= 0`, `this.enemies.length > 0`, and no other warnings/reinforcements are pending.
- **Warning & Transition**:
  - `triggerCrisis(type)` (lines 458–505 in `GameManager.ts`): Sets `warningTimer = 2.0s`, triggers screen shake (1.0s), plays `soundManager.playCrisisAlarm()`, and notifies React UI via `onCrisisEvent`.
  - Upon warning expiry (`GameManager.ts` lines 781–788), calls `activateCrisisEffect(type)`.
- **Crisis Mechanics & Behaviors**:
  1. `TITAN_HORDE` (lines 508–526): Spawns 250+ HP Boss accompanied by 4 `SHIELDED` enemies (frontline) and 4 `DIVER` enemies.
  2. `ACID_STORM` (lines 527–531, 806–824, 839–895): Generates green falling `HazardProjectile` items (`speedY = 220–340 px/s`, `radius = 5–9px`). Deals 1 direct damage to Player (ignoring normal evasion unless shielded/i-frames) and 2 damage to destructible `Barricade` voxel blocks.
  3. `SWARM_BLITZ` (lines 532–546): Spawns 8 high-speed `DIVER` units (4 left flank, 4 right flank with horizontal velocities `speedX = 65 + level*3`) and 3 center `ZIGZAG` units.
  4. `EMP_DISRUPTION` (lines 547–562, 792–805): Suppresses player weapons for 2.5s (`player.isShooting = false`, `player.suppressionLevel = 100`) with visual horizontal static scanlines, escorted by 2 `SNIPER` and 2 `ROGUE_STALKER` units.
  5. `TOTAL_WAR` (lines 562–600): Spawns 11 `INVADER` units (4 Snipers, 4 Divers, 3 Shielded) on left flank and 11 `ROGUE` units (4 Drones, 4 Stalkers, 3 Mechs) on right flank, triggering intensive three-way crossfire.

### 1.2 Layer B: Stage 15+ Stellaris-Style End-Game Crisis Engine

- **Orchestration**: `src/game/crisis/EndGameCrisis.ts`, `CrisisSovereign.ts`, `DimensionalRift.ts`.
- **Trigger Conditions**: Evaluated in `GameManager.spawnWave()` (lines 359–365) on non-boss waves (`level % 5 !== 0`) when `level >= 15` and `!hasEndGameCrisisOccurred`. Guaranteed pity trigger at `level >= 18` or 30% roll on `level >= 15`. Clears regular hostiles via `this.enemies = []` and initializes `EndGameCrisis`.
- **Archetypes**:
  1. `VOID_SOVEREIGN`: Extra-dimensional crystalline dreadnought. Attacks with 5-way dark matter spread (`#c084fc`) + dual wing bolts (`#38bdf8`).
  2. `ABYSSAL_LEVIATHAN`: Corrupted bio-swarm kraken. Attacks with 6-spore rotating spirals (`#84cc16`).
  3. `CYBERNETIC_EXTERMINATOR`: Purification dreadnought. Attacks with dual high-velocity railgun beams (380 px/s, 2 dmg, `#ef4444`) + targeted center optic bolt (`#06b6d4`).
- **Phased Combat Architecture & Effective Health Pool (5,200 EHP Total)**:
  - **INCURSION Phase (3.0s)**: Full-screen chromatic aberration warning banner, radial vignette pulse, siren audio, warp countdown timer.
  - **PHASE_1_SHIELD (1,200 EHP)**: Sovereign hull is 100% invulnerable behind a rotating Hex-Barrier matrix. 2 Flanking Dimensional Rift Anchors (600 HP each at `x=50` and `x=logicalWidth-130`) channel energy conduit beams. Rifts exert gravitational pull on player and curve player projectiles within a 240px radius.
  - **PHASE_2_HULL (2,500 EHP)**: Collapsing both rifts shatters the shield. Sovereign hull is directly exposed. Super-weapon attack routines cycle every 2.2s.
  - **PHASE_3_CORE (1,500 EHP)**: Depleting hull activates Singularity Core Overdrive. Enrage countdown timer (35.0s) begins. Attack interval accelerates to 1.4s, hover sweep speed doubles, and cosmic reality distortion auras pulse.
  - **DEFEATED Phase**: Cataclysmic 40-particle explosion, siren collapse sound, massive rewards (+2000 Score, +500 Pure Water, +10 Combo), and automatic transition into `GameState.SHOP`.
- **Win & Loss Conditions**:
  - **Victory**: Successfully depleting all 5,200 EHP before player HP reaches 0. Transitions cleanly to Shop intermission.
  - **Defeat**: Player HP drops to 0 due to hostile collision, bullet damage, or hazard strikes. Triggers `gameOver()`.

---

## 2. Opportunities to Expand Crisis Variety with Distinct Mechanics

### 2.1 Expanding Intermediate Crisis Events (Stage 10+)

| Proposed Crisis | Theme & Trigger | Unique Mechanics & Hazard Patterns | Counterplay / Player Response |
|---|---|---|---|
| **`SOLAR_FLARE` / `CORONAL_EJECTION`** | High-energy stellar radiation surge | 2-3 vertical telegraph laser beams charge for 1.2s before discharging high-damage continuous plasma pillars across vertical lanes. | Swift horizontal lane evasion; deployable shields absorb beam. |
| **`QUANTUM_VORTEX`** | Moving space-time anomaly | A swirling gravitational singularity drifts across mid-screen, bending all player and enemy bullets into curved orbital trajectories and dragging nearby entities. | Repositioning across vortex boundary; using curved trajectories to slingshot around barriers. |
| **`NANITE_SWARM`** | Self-replicating rogue machine cells | Spawns a cluster of fast micro-nanites. When destroyed, they leave lingering corrosive nano-clouds for 3.0s that damage anything passing through. | High-piercing weapons to wipe clusters before they disperse; area suppression. |
| **`CRYOFREEZE_BLIZZARD`** | Deep space sub-zero atmospheric freeze | Screen turns icy cyan (`#06b6d4`), slowing player movement speed by 40% and weapon recharge by 30% unless firing rapidly or entering thermal vent safe zones. | High-tempo firing to generate weapon heat; positioning in defrost zones. |

### 2.2 Differentiating End-Game Crisis Archetypes & Distinct Phase 1 Anchors

Currently, all three Sovereign archetypes share the exact same Phase 1 structure (two identical 600 HP Dimensional Rifts). We can differentiate their mechanics:

1. **Abyssal Leviathan (Bio-Organic Overhaul)**:
   - *Phase 1 Anchors*: Replace Rifts with **Corrupted Brood Sacks** (600 HP).
   - *Unique Behavior*: Instead of gravitational pull, Brood Sacks pulsate and continuously hatch crawling Bio-Larvae / Toxic Spores that drift downward towards the player.
   - *Environmental Hazard*: Periodic Acid Rain bursts during Phase 2 & 3.
2. **Cybernetic Exterminator (Technological Overhaul)**:
   - *Phase 1 Anchors*: Replace Rifts with **EMP Defense Pylons** (600 HP).
   - *Unique Behavior*: Pylons project horizontal electrified laser tripwires between each other at varying heights, requiring the player to weave beneath or destroy pylons to break the circuit.
   - *Phase 3 Enrage*: Deploys tracking target reticles that call down targeted orbital rail strikes.
3. **Void Sovereign (Cosmic / Gravitational Overhaul)**:
   - *Phase 1 Anchors*: Singularity Rifts with enhanced gravitational warping, pulling projectiles into black hole centers.
   - *Phase 3 Enrage*: Event horizon vortex expansion pulling the player towards the screen center while firing dark-matter nova bursts.
4. **New 4th Archetype Proposal: `CHRONO_TEMPEST` (Temporal Anomaly)**:
   - Temporal distortion fields that slow player projectile velocity by 50% while accelerating boss movement, requiring close-range tactical combat.

---

## 3. Pre-Game Lobby / Main Menu State Flow & Shop Access Mechanics

### 3.1 Existing State Flow Analysis

```
                      +-------------------+
                      |  GameState.MENU   | <----------------+
                      +-------------------+                  |
                                |                            |
                       (Click 'START GAME')                  |
                                |                            |
                                v                            |
                      +-------------------+                  |
                      | GameState.PLAYING |                  |
                      +-------------------+                  |
                        /               \                    |
          (Wave Cleared)                 (Player HP = 0)     |
              /                                   \          |
             v                                     v         |
     +----------------+                   +--------------------+
     | GameState.SHOP |                   | GameState.GAME_OVER|
     +----------------+                   +--------------------+
             |                                     |
    (Click 'NEXT WAVE')                   (Click 'PLAY AGAIN')
             |                                     |
             +--------------> [Wave 2+] <----------+ (BUG: Stats Reset!)
```

### 3.2 Key Architectural Flaws Identified

1. **Fatal Stat Overwrite in `GameManager.init()`**:
   - In `src/components/game-canvas.tsx` (lines 689–699):
     ```typescript
     const startGame = useCallback(() => {
       gameManagerRef.current?.init(); // <-- Wipes stats!
       ...
       gameManagerRef.current?.startGame();
     }, []);
     ```
   - In `src/game/GameManager.ts` (lines 136–150):
     ```typescript
     public init(resetScoreAndCash: boolean = false) {
       if (!this.player) {
         this.player = new Player(this.logicalWidth, this.logicalHeight);
       } else {
         this.player.hp = 3;
         this.player.baseFireRate = 0.5; // <-- Overwrites upgrades!
         this.player.multiShot = 1;      // <-- Overwrites upgrades!
         this.player.piercing = 1;       // <-- Overwrites upgrades!
       }
       ...
     }
     ```
   - *Impact*: Any upgrades purchased on the `GameOverModal` or in pre-game shop are instantly wiped out when `init()` executes on game launch.
2. **Missing Pre-Game Shop Entry Point**:
   - `MenuOverlay` in `game-canvas.tsx` (lines 265–307) only renders `START GAME`, `HOW TO PLAY`, and `INSTALL APP`.
   - Players cannot customize weapons, buy shields, or configure loadouts before Wave 1 begins.
3. **Currency Initialization Strategy**:
   - New games start with `currency = 0`.
   - To make pre-game shopping functional, the system needs either:
     a) A starting Pure Water allowance (e.g. 150–200 💧 starter budget), OR
     b) Persistent meta-currency saved to `localStorage` (e.g. `waterInvaderBankedCurrency`), OR
     c) Pre-game test budget in debug/normal modes.

### 3.3 Proposed Pre-Game Shop State Flow & Architecture

```
                          +--------------------+
                          |   GameState.MENU   |
                          +--------------------+
                            /                \
           (Click 'START GAME')            (Click 'PRE-GAME SHOP / ARMORY')
                          /                    \
                         v                      v
           +--------------------+      +---------------------------------+
           | GameState.PLAYING  | <--- | GameState.SHOP (or PreGameShop) |
           +--------------------+      +---------------------------------+
             (Applies Pre-Bought              (Allows buying FireRate,
              Upgrades cleanly!)               MultiShot, Piercing, Acid Safe)
```

#### Implementation Strategy:
1. **Refactor `GameManager.init()`**:
   ```typescript
   public init(resetScoreAndCash: boolean = false, preserveUpgrades: boolean = false) {
     if (!this.player) {
       this.player = new Player(this.logicalWidth, this.logicalHeight);
     } else if (!preserveUpgrades) {
       this.player.hp = 3;
       this.player.baseFireRate = 0.5;
       this.player.multiShot = 1;
       this.player.piercing = 1;
     } else {
       // Reset position, temporary status, but retain purchased upgrades
       this.player.hp = Math.max(3, this.player.hp);
       this.player.position.x = this.logicalWidth / 2 - 25;
       this.player.position.y = this.logicalHeight - 60;
       this.player.stressLevel = 0;
       this.player.suppressionLevel = 0;
     }
     ...
   }
   ```
2. **Add "ARMORY / SHOP" Button to `MenuOverlay`**:
   - Clicking opens the `ShopModal` (or dedicated `PreGameShopModal`) with `WAVE 1 PREPARATION` banner.
   - Provides options to purchase upgrades and items (including Acid Rain shields / counterplay).
   - Features a prominent **"DEPLOY TO WAVE 1"** button that starts the game with all upgrades active.

---

## 4. Testing Infrastructure

### 4.1 Test Architecture & File Structure

The project has a comprehensive testing setup split across three primary tiers:

```
tests/
├── 01_ui_and_controls.spec.ts               # Controls, touch dragging, mobile input
├── 02_rendering_and_vector_art.spec.ts      # Vector graphics & DPI scaling
├── 03_game_mechanics.spec.ts                # Bullet physics, stress, combos
├── 04_multiwave_progression.spec.ts         # Wave progression and boss waves
├── 05_three_way_battle.spec.ts              # Faction combat & crossfire
├── 06_shop_economy_max_upgrades.spec.ts     # Shop upgrades, affordability, Max levels
├── 12_crisis_director_e2e.spec.ts           # Intermediate crisis HUD & overlays
├── 12_extreme_difficulty_and_crises.spec.ts # Stage 10+ piecewise HP & crisis effects
├── 13_endgame_crisis_e2e.spec.ts            # Tri-phase End-Game Crisis E2E
├── 13_endgame_crisis_stage15.spec.ts        # Stage 15 incursion & boss priority
├── unit/                                    # Headless mathematical combat tests
│   ├── endgame_crisis_simulation.test.ts    # Discrete 60 FPS DPS & TTK simulation
│   ├── crisis_director_m2.test.ts           # Intermediate crisis state machines
│   └── physics_and_math.test.ts             # Gravitational & projectile physics
├── stress/                                  # Swarm performance & endurance specs
└── benchmark/                               # Automated runner & bot heuristics
```

### 4.2 Configuration (`playwright.config.ts`)

- **Framework**: `@playwright/test` v1.62.1
- **Target URL**: `http://localhost:3000` (automatically spun up via `webServer: { command: 'npm run dev' }`)
- **Workers**: 1 (serial deterministic execution)
- **Viewport**: 1280x900
- **Reporters**: `list`, `json` (`test-results.json`), `html` (`playwright-report/`)
- **Timeout**: 60,000ms per test, 10,000ms per expect assertion.

### 4.3 Key Verification Commands

| Command | Target / Purpose | Expected Duration |
|---|---|---|
| `npx tsc --noEmit` | TypeScript compiler type validation | ~2–3 seconds |
| `npm run build` | Next.js production build check | ~5–8 seconds |
| `npx playwright test tests/unit/` | Fast headless unit simulation suite | ~1–2 seconds |
| `npx playwright test tests/06_shop_economy_max_upgrades.spec.ts` | Shop economy & upgrade persistence verification | ~8–10 seconds |
| `npx playwright test tests/13_endgame_crisis_stage15.spec.ts` | Stage 15 End-Game Crisis validation | ~10–12 seconds |
| `npx playwright test` | Complete automated E2E & unit suite | ~45–60 seconds |

---

## 5. Recommended Implementation Plan & Architectural Roadmap

Based on this survey, the recommended implementation breakdown for subsequent phases is:

1. **Phase 1: Pre-Game Shop Access & Stat Persistence (R4)**:
   - Modify `GameManager.init()` to support `preserveUpgrades: boolean`.
   - Update `MenuOverlay` in `game-canvas.tsx` to include "ARMORY / SHOP" button.
   - Configure starter currency (or persistent bank) and connect `ShopUpgradePanel`.
   - Add Playwright E2E spec verifying pre-game purchases apply to stats in Wave 1.
2. **Phase 2: Acid Rain Counterplay & Background Visibility (R1, R2)**:
   - Implement purchasable Acid Shield / Deployable Safe Zone.
   - Add high-contrast projectile outline glow to ensure hostile attacks remain visible during environmental color shifts.
   - Add automated test verifying damage mitigation.
3. **Phase 3: Expanded Crisis Variety & Unique Mechanics (R3)**:
   - Implement at least one new Intermediate Crisis (e.g. `SOLAR_FLARE` or `QUANTUM_VORTEX`) or distinct Phase 1 mechanics for `ABYSSAL_LEVIATHAN` / `CYBERNETIC_EXTERMINATOR`.
   - Update HUD badges and crisis state director.
   - Add automated test verifying new crisis mechanics.
4. **Phase 4: Adversarial Review & Verification**:
   - Run `npm run build`, `npx tsc --noEmit`, and full `npx playwright test` suite.
   - Verify zero errors before git commit and push.

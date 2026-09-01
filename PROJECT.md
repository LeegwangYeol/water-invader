# Project: Water Invader — Stellaris-Style End-Game Crisis System (Stage 15+)

## Architecture
- **Framework**: Next.js 16.3.1 (App Router), React 19.2.8, Tailwind CSS v4, TypeScript 5
- **Game Engine**: HTML5 Canvas 2D with procedural vector graphics, Web Audio API procedural synthesis, 60Hz fixed-timestep accumulator loop (`FIXED_STEP = 1/60`).
- **State Machine**: Menu -> Playing (Wave, Incursions, Crisis Director & End-Game Crisis Loop) -> Shop (Inter-wave Upgrades) -> Game Over
- **Stellaris-Style End-Game Crisis Architecture**:
  - **Existential Multi-Phase Cataclysm**: Fundamentally distinct from standard 500–1,000 HP bosses. The Crisis commands an effective health pool of **5,200 EHP** (2x 600 HP Rifts + 2,500 HP Hull + 1,500 HP Core Overdrive with 35s enrage clock) spread across 3 discrete phases, invulnerability shrouds, dimensional anchors, and dynamic reality-bending mechanics.
  - **Random Stage 15+ Incursion Engine**:
    - Trigger condition: Evaluated in `spawnWave()` on non-boss waves (`this.level % 5 !== 0 && this.level >= 15`).
    - Probability: 30% non-deterministic roll per wave with pity guard guarantee at Wave 18.
    - Warning Sequence: 3.0s cataclysm siren, chromatic aberration / dimensional distortion, HUD cataclysm banner.
  - **The 3 Crisis Archetypes**:
    1. *The Abyssal Singularity / Void Sovereign* (Psionic Warp Crisis): Ethereal extra-dimensional invader flanked by 2 Dimensional Rift Anchors (600 HP each). Core Sovereign is 100% invulnerable until both anchors fall; Phase 2 fires Dark-Matter Beams and Gravitational Wave Auras; Phase 3 triggers Cosmic Core Collapse with 35s enrage countdown and radial Nova bullet hell.
    2. *The Bio-Swarm Leviathan* (Bio-Swarm Crisis): Corrupted apex bio-mechanical kraken with regenerative chitin (25 HP/s out of combat), spore tendril spirals, and diving bio-larvae swarms.
    3. *The Cybernetic Exterminator Matrix* (Machine Matrix Crisis): Sentient rogue purification AI with 1,500 HP Frontal Deflector Matrix reflecting 50% projectiles, orbital sweeping railguns, and periodic EMP shockwaves.
  - **Clean Module Boundaries**: Encapsulated in `src/game/crisis/` (`EndGameCrisis.ts`, `DimensionalRift.ts`, `CrisisSovereign.ts`, `types.ts`) with clear TypeScript interface contracts (`ICrisisEntity`, `ICrisisRift`, `EndGameCrisisState`).
  - **Wave Transition Safety**: Integrated into `GameManager.update()` and `spawnWave()` ensuring `isEndGameCrisisActive` prevents premature SHOP transition until Crisis resolution, with zero soft-locks.
- **Dual Track Orchestration**:
  - **Track 1: E2E Testing & Empirical Simulation Track**:
    - Stage 15 Mock & Random Trigger Test: `tests/13_endgame_crisis_stage15.spec.ts` (9/9 passed)
    - Mathematical Proof & Automated Simulation Test: `tests/unit/endgame_crisis_simulation.test.ts` (6/6 passed, proving Crisis survives $\ge 15.0\text{s}$ against max player DPS).
    - Full regression run of all 529 tests passed (100%) and published `TEST_READY.md`.
  - **Track 2: Implementation Track**:
    - M1: Crisis Models, Entity Classes & Procedural Vector Visuals (DONE)
    - M2: Combat Behaviors, Reality-Bending Mechanics & Stage 15+ Incursion Engine (DONE)
    - M3: Empirical Balancing via Monte Carlo Simulation Calibration & Mathematical Proof (DONE)
    - M4: Full E2E & Unit Test Integration (Tiers 1-4) (DONE)
    - M5: Adversarial Hardening (Tier 5), Pre-Commit Check, Git Commit & Push (DONE)

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Stage 15+ Random Crisis Incursion Engine | Evaluates 30% roll upon `level >= 15` in `spawnWave()` on non-boss waves with pity trigger at Stage 18 | M2 | Survey (R2) | DONE |
| 2 | Incursion Alert & Procedural Cataclysm Audio | 3.0s cataclysm warning sequence with red/purple chromatic distortion and Web Audio 5-tone descending alarm | M1 | Survey (R1) | DONE |
| 3 | Tri-Phase End-Game Crisis Entity System | Multi-phase entity hierarchy in `src/game/crisis/` with distinct phase transitions (Anchors -> Hull -> Core Overdrive) | M1 | Survey (R1) | DONE |
| 4 | Dimensional Rift Anchors & Invulnerability Shroud | Flanking rift anchors providing 100% damage immunity to sovereign core until destroyed | M2 | Survey (R1) | DONE |
| 5 | Reality-Bending Combat Mechanics | Gravitational vortex pulls, bullet-bending auras, EMP shockwaves, and rotating deflector shields | M2 | Survey (R1) | DONE |
| 6 | Crisis HUD Boss Bar & Status Indicators | Dedicated multi-segment crisis health bar, phase badges, and active hazard warnings | M1 | Survey (R1) | DONE |
| 7 | Wave Clear & Soft-Lock Prevention Guard | `GameManager.update()` wave completion guards preventing transition while Crisis is alive | M2 | Survey (R2) | DONE |
| 8 | Headless Mathematical Combat Balance Model | Formal simulation scripts & formulas proving 5,200 EHP withstands 150+ player DPS for $\ge 30.6\text{s}$ | M3 | Survey (R3) | DONE |
| 9 | Playwright Stage 15 Mock & Random Trigger Test | `tests/13_endgame_crisis_stage15.spec.ts` mocking Stage 15 and verifying random triggers without game crashes | Test Track (M4) | Survey (Acceptance) | DONE |
| 10 | Mathematical Proof & Simulation Unit Test | `tests/unit/endgame_crisis_simulation.test.ts` formally proving player max DPS bounds and Crisis survivability | Test Track (M4) | Survey (Acceptance) | DONE |
| 11 | Tier 5 Adversarial Coverage Hardening | White-box stress tests against edge cases (boundary clamping, rapid kill, EMP overlap, multi-penetration) | M5 | Survey (Quality) | DONE |
| 12 | Pre-Commit Verification & Git Push | Type-check (`npx tsc --noEmit`), build (`npm run build`), full 529 test verification, commit and push | M5 | Survey (Deployment) | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Crisis Types, Entities & Vector Visuals | Implement `src/game/crisis/` entity classes, vector rendering, audio synthesis in `SoundManager.ts`, and types in `types.ts` | None | DONE |
| M2 | Crisis Incursion Engine & Combat Mechanics | Implement Stage 15+ random trigger, multi-phase state machine, dimensional rifts, reality-bending auras, and `GameManager.ts` integration | M1 | DONE |
| M3 | Empirical Balancing & Simulation Calibration | Calibrate health pools, damage values, and attack tempos in `scripts/simulate_balance.ts` and crisis configs to guarantee intended survival curves | M1, M2 | DONE |
| M4 | E2E Testing Suite & Mathematical Verification | Implement `tests/13_endgame_crisis_stage15.spec.ts` and `tests/unit/endgame_crisis_simulation.test.ts`, publish `TEST_READY.md`, pass 100% tests | M1, M2, M3 | DONE |
| M5 | Adversarial Hardening, Build & Git Push | Adversarial challenger review (Tier 5), full 529 regression pass, `npx tsc --noEmit`, `npm run build`, Git commit and push | M1, M2, M3, M4 | DONE |

## Code Layout
- `src/game/types.ts`: Core game types, `EnemyType`, `Faction`, `GameState`
- `src/game/crisis/types.ts`: Crisis specific enums, interfaces, and state structures
- `src/game/crisis/EndGameCrisis.ts`: Coordinator managing crisis lifecycle, phases, and entity updates
- `src/game/crisis/CrisisSovereign.ts`: Vector-rendered screen-filling crisis dreadnought entity
- `src/game/crisis/DimensionalRift.ts`: Dimensional rift anchor entities generating shielding and void swarms
- `src/game/GameManager.ts`: Main loop, Stage 15+ incursion evaluation, collision routing, and wave completion guards
- `src/game/SoundManager.ts`: Web Audio procedural cataclysm sirens, dark-matter beam hums, and dimensional warp SFX
- `scripts/simulate_balance.ts`: Headless Monte Carlo combat balance simulator
- `tests/13_endgame_crisis_stage15.spec.ts`: Playwright Stage 15 mock & random incursion test (9 tests)
- `tests/unit/endgame_crisis_simulation.test.ts`: Headless mathematical proof & empirical survivability test (6 tests)

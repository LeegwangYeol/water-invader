# Project: Water Invader — Extreme Difficulty Scaling & Emergency Crises (Stage 10+)

## Architecture
- **Framework**: Next.js 16.3.1 (App Router), React 19.2.8, Tailwind CSS v4, TypeScript 5
- **Game Engine**: HTML5 Canvas 2D with procedural vector graphics & bioluminescent aquatic rendering, Web Audio API procedural synthesis, 60 FPS requestAnimationFrame loop
- **State Machine**: Menu -> Playing (Wave, Incursions & Crisis Director Loop) -> Shop (Inter-wave Upgrades) -> Game Over
- **Difficulty & Threat Scaling Engine**:
  - Piecewise exponential HP, speed, projectile velocity, and attack tempo scaling starting from Stage 10 (`level >= 10`).
  - Waves 1–9 preserve onboarding baseline ($HP = 1 + \lfloor\text{level}/3\rfloor$).
  - Stage 10+ scales enemy HP aggressively ($HP = 4 + (\text{level}-9) \times 6 + \lfloor(\text{level}-9)^{1.5}\rfloor$) so normal enemies reach $10\sim 25\text{ HP}$, armored reach $20\sim 50\text{ HP}$, and Stage 10+ bosses reach $250\sim 800\text{ HP}$ escorted by dedicated minion fleets.
  - Elite projectiles deal 2 damage (threatening a 5 HP max-upgrade player in 3 hits) with rapid fire cooldowns ($0.8\sim 1.5\text{s}$) and multi-directional spread bursts.
- **Dynamic Crisis Events Director (Stage 10+)**:
  - Unpredictable crisis triggers starting from Stage 10:
    1. *Titan Bio-Mech Escort Horde*: Heavy boss dreadnought escorted by 4 Shielded and 4 Diver units.
    2. *Toxic Acid Storm Hazard*: Screen-filling environmental hazard barrage requiring tactical maneuvering.
    3. *Swarm Diver Blitz*: Coordinated high-speed pincer dive attacks.
    4. *EMP Overcharge Disruption*: Temporary weapon suppression combined with rapid hostile beam sweeps.
    5. *3-Way Total War Incursion*: Massive dual-flank chaotic clash between Invader and Rogue legions.
  - Full-screen animated HUD warning banners and multi-tone Web Audio siren alarms.
  - Robust wave transition safety: all crisis units register under `Faction.INVADER` or `Faction.ROGUE` ensuring zero soft-locks with `remainingHostiles === 0`.
- **Simulation & Empirical Balancing Engine**:
  - Headless Monte Carlo mathematical combat simulator (`scripts/simulate_balance.ts`) for rapid curve optimization.
  - Autonomous Playwright AI bot playtester (`scripts/run_benchmark.ts`) capturing real-time telemetry (win rate, player DPS vs incoming DPS, EHP depletion, clear times).
- **Verification & Deployment Pipeline**:
  - Playwright E2E test suite (355+ tests) verifying all gameplay mechanics, crisis lifecycle, and mathematical balancing bounds.
  - Mandatory strict pre-commit verification: `npx tsc --noEmit` + `npm run build` with 0 errors.
  - Automated Git commit and push to remote repository.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Stage 10+ Exponential Enemy HP Scaling | Piecewise scaling in `Enemy.ts` preserving Waves 1–9 while scaling Stage 10+ normal enemies to 10–25+ HP and Rogues to 20–45+ HP | M1 | Survey (R1) | DONE |
| 2 | High-Tier Boss Scaling & Escort Formations | Boss HP scales to 250–800+ HP for Stage 10+ with procedural minion escort legions (Shielded, Snipers, Divers) | M1 | Survey (R1) | DONE |
| 3 | Stage 10+ Projectile Density & Attack Tempo | Enemy firing cooldown reduced to 0.8–1.5s, projectile speed increased to 250–400 px/s with multi-spread salvos | M1 | Survey (R1) | DONE |
| 4 | Elite 2-Damage Threats & Homing Aggression | Elite enemy projectiles deal 2 damage, testing player evasion and barricade cover | M1 | Survey (R1) | DONE |
| 5 | Crisis Director & Event State Machine | Scripted Crisis Director in `GameManager.ts` managing triggers, active event state, and enemy spawns | M2 | Survey (R2) | DONE |
| 6 | 5 Distinct Emergency Wave Archetypes | Titan Escort Horde, Toxic Acid Storm, Swarm Diver Blitz, EMP Disruption, and 3-Way Total War | M2 | Survey (R2) | DONE |
| 7 | Fullscreen Warning Banners & Siren Audio | Strobed HUD visual banners and procedural Web Audio multi-tone alarm synthesis | M2 | Survey (R2) | DONE |
| 8 | Headless Monte Carlo Combat Simulator | `scripts/simulate_balance.ts` measuring win rate, time-to-clear, and player EHP vs enemy DPS curves | M3 | Survey (R3) | DONE |
| 9 | Autonomous Playwright Bot Telemetry | `scripts/run_benchmark.ts` bot playtester collecting browser-based real-time telemetry logs | M3 | Survey (R3) | DONE |
| 10 | E2E Crisis & Difficulty Test Suite | `tests/12_extreme_difficulty_and_crises.spec.ts` testing Stage 10+ scaling, crisis lifecycle, and audio/visual cues | M4 | Survey (R4) | DONE |
| 11 | Typecheck, Production Build & Deployment | `npx tsc --noEmit`, `npm run build`, full Playwright test pass, git commit and push | M5 | Survey (R4) | IN_PROGRESS |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Extreme Difficulty Scaling Engine | Implement Stage 10+ piecewise exponential HP, boss scaling with escort fleets, projectile density/speed, and 2-damage elite shots in `Enemy.ts` and `GameManager.ts` | None | DONE |
| M2 | Emergency Waves & Crisis Events Director | Implement `CrisisDirector`, 5 emergency crisis event archetypes, warning banners, audio alerts, and wave transition safety | M1 | DONE |
| M3 | Data-Driven Simulation Harness & Empirical Balancing | Create `scripts/simulate_balance.ts` and run autonomous bot telemetry in `scripts/run_benchmark.ts` to log and prove balance | M1, M2 | DONE |
| M4 | E2E Testing Suite Expansion & Hardening | Expand Playwright test suite with `tests/12_extreme_difficulty_and_crises.spec.ts` covering all R1–R3 features | M1, M2, M3 | DONE |
| M5 | 100% Verification, Production Build & Git Push | Typecheck (`npx tsc --noEmit`), build check (`npm run build`), full Playwright test suite execution, Git commit and push | M1, M2, M3, M4 | IN_PROGRESS |

## Code Layout
- `src/game/types.ts`: `Faction`, `EnemyType`, `GameState`, `CrisisType`, `CrisisState`, `Vector2D`, `Size`, `Rect`
- `src/game/Entity.ts`: Base entity class with `faction`, collision boxes, and hit processing
- `src/game/Enemy.ts`: Standard Invaders + Rogue units, piecewise difficulty scaling formulas, attack timers, rush kinematics
- `src/game/Player.ts`: Player weapons, stats, fire rates, stress overdrive, and upgrades
- `src/game/GameManager.ts`: Core game loop, collision matrix, wave progression, Crisis Director, and rendering overlays
- `src/game/SoundManager.ts`: Procedural Web Audio synthesizers (crisis sirens, laser barrages, explosion audio)
- `src/components/game-canvas.tsx`: React HUD overlay (threat counters, crisis banners, health/shield indicators)
- `scripts/simulate_balance.ts`: Headless Monte Carlo mathematical combat balance simulation script
- `scripts/run_benchmark.ts`: Autonomous Playwright bot gameplay simulation and telemetry extractor
- `tests/12_extreme_difficulty_and_crises.spec.ts`: Dedicated E2E test suite for Stage 10+ difficulty scaling and emergency crisis events
- `tests/`: Full regression suite (355+ tests)

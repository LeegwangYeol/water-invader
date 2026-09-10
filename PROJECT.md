# Project: Water Invader — 12 Flagship Features Live QA Playtesting, Visual Inspection & Remediation

## Architecture
- Platform: Next.js 16 (App Router), React 19, HTML5 2D Canvas, Web Audio API, Playwright E2E.
- Coordinate Frame Invariant: `logicalWidth = 600`, `logicalHeight = 800` strictly maintained in `GameManager.ts` and `Enemy.ts`.
- Master Integration: `src/game/flagship/FlagshipManager.ts` manages all 12 flagship subsystems, updating and rendering across background, world, and foreground canvas layers.
- Responsive Viewport System: Strictly CSS-driven via `aspect-[3/4]` container in `src/components/game-canvas.tsx`.
- Playtest Framework: Browser automation using Playwright with `SwarmBotEngine` (1D Potential Field solver) and `telemetry_stress_collector.ts` for memory heap slopes, frame drop tracking, and Web Audio node leak detection.

## Feature Inventory
| # | Feature | Subsystem / File | Key Triggers & Controls | QA Verification Focus | Assigned Stream |
|---|---------|------------------|-------------------------|-----------------------|-----------------|
| 1 | Cavitation Torpedo | `weapons/CavitationTorpedo.ts` | Key `C`, `X`, RMB, Touch | Double-tap detonation, vacuum suction (140px), shockwave (150px), bullet vaporization, audio ducking & sub-bass | Stream A (Weapons) |
| 2 | Prism Laser | `weapons/BioluminescentLaser.ts`, `RefractionPrism.ts` | Hold Space / LMB; Deploy `V` | 20Hz raycast damage, heat gauge, +25% supercharge (80-99 HU), 2.2s lockout at 100 HU, 3-way prism split (190% power) | Stream A (Weapons) |
| 3 | Hydraulic Harpoon | `weapons/HydraulicHarpoon.ts` | Key `H`, `Shift` (winch) | Damped spring physics, winch reel (240px/s), centripetal whip (60-140 dmg), slingshot eject (+720px/s, 180 dmg), living meat-shield | Stream A (Weapons) |
| 4 | Hydrothermal Vents | `environment/HydrothermalVent.ts`, `OceanCurrent.ts` | Seabed $y=760$ cone | Core DoT (1 HP/1.25s player, 28+6% enemy), steam lance conversion, +250% laser cooling, shear currents | Stream B (Hazards) |
| 5 | Biolapse Darkness Cycle | `environment/BiolapseDarknessCycle.ts` | Key `F` (toggle), `V` (high-beam) | 95s cycle (60s day, 5s dusk, 25s midnight, 5s dawn), headlight steering ($\pm 15^\circ$), battery drain, 0.8s photonic stun | Stream B (Hazards) |
| 6 | Modular Chassis | `progression/ModularChassis.ts`, `ChassisRadarChart.ts` | Hangar / Continue Shop selection | 5 distinct hulls (Nautilus, Stingray, Leviathan, Ghost, Kraken), unique stats, passives, 6-axis animated radar chart | Stream C (Progression) |
| 7 | Veteran Crew Synergy Deck | `progression/CrewOfficerDeck.ts` | Hotkeys `1`-`4` / `Q`, `E`, `R`, `F` | 4 bridge officers (Ingrid, Jax, Ren, Lyra), passive buffs, active bridge abilities (SCRAM, Salvo, Stasis, Decoy), dual synergies | Stream C (Progression) |
| 8 | Hadal Bio-Horror Faction | `factions/HadalBioHorrors.ts`, `EpigeneticMutationEngine.ts` | Proximity & wave combat | Parasite Clingers (-25% speed, wiggle shake), Spore Siphoners, Carapace Colossi (85% front armor), reactive epigenetic mutations | Stream D (Factions/Boss) |
| 9 | Automaton Shield Phalanx | `factions/AutomatonPhalanx.ts`, `AutomatonShieldGrid.ts` | Enemy clustering <160px | Aegis Drones (100% frontal deflection, 40% shared dampening), EMP Prowler novae, Rail Sentinels (300% radiator crit), inductive stun | Stream D (Factions/Boss) |
| 10 | Apex Boss Kraken Prime | `factions/KrakenPrimeBoss.ts` | Boss encounter wave | 12,000 HP 3-phase titan, 4 destructible tentacles (Phase 1), Charybdis Maw vortex pull (Phase 2), 45s ink enrage charge (Phase 3) | Stream D (Factions/Boss) |
| 11 | Roguelike Endless Mode | `modes/EndlessDescent.ts`, `BathymetricDAG.ts`, `BoonDraftDeck.ts` | Game mode selection / UI | 7-9 strata bathymetric DAG, hydrostatic pressure penalties (50% speed, 80% HP, 100% hull leak), 24-boon draft choices | Stream E (Modes/Sensory) |
| 12 | Sonar/Hydrophone UI | `sensory/TacticalSonarHUD.ts`, `HydrophoneSpectrogram.ts`, `HullStressFX.ts` | Passive HUD & audio hooks | 5 polar range rings, 3.5s rotating sweep, echo flares, 16-band audio waterfall, chromatic aberration & procedural glass fractures | Stream E (Modes/Sensory) |
| 13 | Responsive Viewport Integrity | `src/components/game-canvas.tsx`, CSS | Viewport resize, mobile touch | Aspect ratio 0.75, strictly preserved 600x800 logical canvas, touch controls outside canvas, zero horizontal scrollbar | Stream F (Viewports) |

## Milestones
| # | Milestone Name | Scope | Dependencies | Status |
|---|----------------|-------|--------------|--------|
| M0 | Survey & Architecture Mapping | Deep codebase, pitch spec, and test infra mapping | None | DONE |
| M1 | Live QA Playtest Swarm — Round 1 | 12 parallel specialist playtest sessions across Streams A-F | M0 | IN_PROGRESS |
| M2 | Autonomous Stress & Endurance Playtesting | SwarmBotEngine endurance survival sessions & telemetry collection | M1 | PLANNED |
| M3 | Defect Identification & Automated Remediation | Fix discovered bugs, console warnings, or physics anomalies | M2 | PLANNED |
| M4 | Comprehensive Build & Regression Verification | Run full `npm run build` and `npx playwright test` test suites | M3 | PLANNED |
| M5 | Master QA Report & Git Push | Generate `QA_REPORT.md`, git commit & push to `origin/master` | M4 | PLANNED |
| M6 | Forensic Integrity Audit & Sentinel Victory Claim | Independent verification of authentic implementation and clean git tree | M5 | PLANNED |

## Interface Contracts
- **GameManager $\leftrightarrow$ FlagshipManager**:
  - `flagshipManager.update(deltaTime, player, enemies, bullets, barricades, currentWave, ...)`
  - `flagshipManager.drawBackground(ctx)`: Draws ocean currents, hydrothermal vents, hydrothermal plumes.
  - `flagshipManager.drawWorld(ctx)`: Draws refraction prisms, tether ropes, phalanx shield conduits, tentacles.
  - `flagshipManager.drawForeground(ctx)`: Draws darkness layer, headlight cone, sonar radar rings, HUD widgets.
  - `flagshipManager.handleKeyDown(key)` / `handleKeyUp(key)`: Routes torpedo `C`, laser `Space`, harpoon `H`/`Shift`, headlight `F`, officer abilities `1`-`4`.
- **Canvas Container $\leftrightarrow$ Window**:
  - Canvas logical size: `width = 600`, `height = 800`.
  - CSS aspect ratio: `3/4` (`aspect-[3/4]`). Maximum width: `600px`.
  - Bitmap buffer: `canvas.width = 600 * window.devicePixelRatio`, `canvas.height = 800 * window.devicePixelRatio`.

## Code Layout
- `src/game/flagship/`:
  - `FlagshipManager.ts`: Subsystem coordinator & lifecycle manager
  - `types.ts`: Subsystem contracts, interfaces, and state enumerations
  - `weapons/`: `CavitationTorpedo.ts`, `BioluminescentLaser.ts`, `RefractionPrism.ts`, `HydraulicHarpoon.ts`
  - `environment/`: `HydrothermalVent.ts`, `OceanCurrent.ts`, `BiolapseDarknessCycle.ts`
  - `progression/`: `ModularChassis.ts`, `ChassisRadarChart.ts`, `CrewOfficerDeck.ts`
  - `factions/`: `HadalBioHorrors.ts`, `EpigeneticMutationEngine.ts`, `AutomatonPhalanx.ts`, `AutomatonShieldGrid.ts`, `KrakenPrimeBoss.ts`
  - `modes/`: `EndlessDescent.ts`, `BathymetricDAG.ts`, `BoonDraftDeck.ts`
  - `sensory/`: `TacticalSonarHUD.ts`, `HydrophoneSpectrogram.ts`, `HullStressFX.ts`
- `tests/`:
  - `20_flagship_12_features.spec.ts`: Master flagship verification
  - `adversarial_flagship_state_transitions.spec.ts`: Transition stress tests
  - `bughunt_ui_responsive_viewports.spec.ts`: Responsive viewport tests
  - `stress/`: `swarm_bot_engine.ts`, `telemetry_stress_collector.ts`, `endless_survival_swarm.spec.ts`
- `QA_REPORT.md`: Master user-facing QA Playtesting and Inspection report (project root)

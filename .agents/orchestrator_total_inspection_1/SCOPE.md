# Scope: Total Codebase Inspection ("총검사") & Hardening Swarm

## Architecture
- Target Platform: Next.js 16 (App Router), React 19, HTML5 2D Canvas, Web Audio API, Playwright E2E.
- Strict Invariants: `logicalWidth = 600`, `logicalHeight = 800` in `GameManager.ts`, `Player.ts`, `Enemy.ts`. CSS-only responsive scaling (`aspect-[3/4]`).
- Organic Hydrodynamic Physics: Natural kinematic simulation, fluid buoyancy, drag, inertia, boundary containment without artificial clipping or teleportation.
- Zero Memory Leaks: AudioContext lifecycle cleanup, DOM event listener teardown, requestAnimationFrame safety.
- Regression Immunity: Playwright tests covering every identified defect and edge case, 100% test pass rate, 0 TypeScript/build errors.

## Feature Inventory & Defect Remediation Mapping
| # | Defect / Feature | Subsystem Files | Remediation Description | Assigned Milestone |
|---|------------------|-----------------|-------------------------|--------------------|
| 1 | DEF-PHY-01 (Phantom Velocity) | `Player.ts`, `GameManager.ts` | Update `player.velocity` with realistic vector kinematics so Glacial debuffs and Kraken vortex escape work | M1 |
| 2 | DEF-PHY-02 (Vent Dormant Updraft & Trap) | `HydrothermalVent.ts` | Zero lift during DORMANT; fix limit-cycle potential well at y~155 so ballast descends | M1 |
| 3 | DEF-PHY-03 (Boss Slingshot Instakill) | `HydraulicHarpoon.ts` | Prevent boss instakill by checking `!entity.isBoss` on out-of-bounds execution; deal impact dmg | M1 |
| 4 | DEF-PHY-04/05 (Slingshot Spikes & Damping) | `HydraulicHarpoon.ts` | Clamp finite-difference velocity (<600 px/s); add relative velocity damping | M1 |
| 5 | DEF-PHY-06/08 (Tether Leak & Boundary Gap) | `GameManager.ts`, `FlagshipManager.ts` | Reset harpoon tether on wave transition; add post-flagship player boundary clamp in GameManager | M1 |
| 6 | DEF-SEC-01 (NaN Math Defense) | `Bullet.ts`, `CrisisSovereign.ts`, `AutomatonShieldGrid.ts` | Finite checks for atan2, vector normalization, and division-by-zero protection | M2 |
| 7 | DEF-SEC-02 (CCD & Anti-Tunneling) | `Entity.ts`, `CavitationTorpedo.ts`, `HydraulicHarpoon.ts`, `Enemy.ts` | Swept trajectory raycast for fast projectiles (580-720 px/s); fix swept AABB false positives; diving enemy CCD | M2 |
| 8 | DEF-SEC-03 (Entity Leaks & Shop Spawning) | `HadalBioHorrors.ts`, `AutomatonPhalanx.ts`, `FlagshipManager.ts` | 4-sided rectangular bounds culling; freeze broodmother spawns in `GameState.SHOP`; wave cleanup | M2 |
| 9 | DEF-SEC-04 (Input Sanitization) | `game-canvas.tsx` | Clamp pointer coordinates to `[0, logicalWidth]` and `[0, logicalHeight]` with isFinite check | M2 |
| 10 | DEF-ARC-01 (Runaway rAF Loop in Menus) | `GameManager.ts` | Halt `requestAnimationFrame` loop when entering `SHOP` or `GAME_OVER`; resume cleanly | M3 |
| 11 | DEF-ARC-02 (Premature Crisis Abort) | `GameManager.ts` | Fix line 1874 to `(crisis === null || timer <= 0)` so Solar Flare & EMP crises run full duration | M3 |
| 12 | DEF-ARC-03 (GC Churn Optimization) | `FlagshipManager.ts`, `Enemy.ts` | Cache `cachedSubsystems` and reuse static arrays/gradients to reduce 60 FPS GC pressure | M3 |
| 13 | DEF-ARC-04 (Web Audio Lifecycle & Mute) | `SoundManager.ts`, `game-canvas.tsx` | Add master GainNode for instant mute; add suspend/resume on visibilitychange | M3 |
| 14 | DEF-TST-01/02 (Playwright Regression Suites) | `tests/*.spec.ts` | Fix DPR assertion in 01_ui_and_controls; add 5 dedicated E2E suites covering all defects | M4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Codebase Survey & Flaw Discovery | Parallel inspection across 4 streams | None | DONE |
| M1 | Core Physics & Kinematics Remediation | DEF-PHY-01, 02, 03, 04, 05, 06, 08 | M0 | IN_PROGRESS |
| M2 | Combat, CCD & Coordinate Math Defense | DEF-SEC-01, 02, 03, 04 | M0 | PLANNED |
| M3 | Architecture, State & Memory Lifecycle | DEF-ARC-01, 02, 03, 04 | M0 | PLANNED |
| M4 | Regression Test Expansion & Playwright 100% Pass | DEF-TST-01, 02 (5 new suites, 100% pass) | M1, M2, M3 | PLANNED |
| M5 | Adversarial Review, Challenger Stress & Forensic Audit | 2 Reviewers, 2 Challengers, Forensic Auditor | M4 | PLANNED |
| M6 | Final Verification, Build & Push | `npm run build`, `npx tsc --noEmit`, git push, handoff | M5 | PLANNED |

## Interface Contracts
- **GameManager ↔ Canvas**:
  - `logicalWidth = 600`, `logicalHeight = 800`.
  - CSS aspect ratio: `3/4`.
- **GameManager ↔ Player / Physics**:
  - Position: `(x, y)` clamped to `[0, logicalWidth]`, `[0, logicalHeight]`.
  - Velocity: `(vx, vy)` finite, non-NaN, updated every frame, bounded by terminal velocity.
- **GameManager ↔ Audio / DOM**:
  - AudioContext lifecycle managed cleanly with suspended/resumed states and master GainNode.

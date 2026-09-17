# Scope: Upward Buoyant Drift Lock Bugfix

## Architecture
- **Player Submarine (`src/game/Player.ts`)**: Currently operates at baseline depth `canvasHeight - size.height - 20` (y ≈ 734–750px depending on modular chassis). Handles horizontal inputs `isMovingLeft` / `isMovingRight`. Smooth hydrodynamic ballast restoration (`165 px/s`) organically returns vessel to baseline depth when clear of active convective updrafts.
- **Hydrothermal Vent (`src/game/flagship/environment/HydrothermalVent.ts`)**: Applies vertical lift during halo/core convective updraft. In transition band $y \in [130, 220]$, vertical lift diminishes smoothly while radial lateral dispersion and prevailing ambient surface drift (+60 px/s Eastward) carry dispersing fluid out of the central stagnation zone into open sea, enabling seamless passive and active descent.
- **Game Engine (`src/game/GameManager.ts`)**: Synchronizes player ballast state during active gameplay. Invariants: `logicalWidth = 600`, `logicalHeight = 800` strictly preserved!

## Feature & Fix Inventory
| # | Feature / Fix | Description | Milestone | Status |
|---|---------------|-------------|-----------|--------|
| 1 | Reproduction E2E Test | Create `tests/playtest_buoyancy_drift_escape.spec.ts` verifying player lifted by vent can return to baseline depth | M1 | DONE |
| 2 | Hydrodynamic Exploration | Investigate exact mechanics of Player.ts, HydrothermalVent.ts, and existing tests | M1 | DONE |
| 3 | Ballast Restoration Mechanics | Implement smooth, organic ballast settling in Player.ts returning submarine to baseline depth | M2 | DONE |
| 4 | Plume Cap Dissipation & Escape | Ensure convective updraft diminishes near capY and allows lateral clearing without boundary pin | M2 | DONE |
| 5 | Preserved Gameplay Mechanics | Maintain steam lance transformations, vent damage, and 600x800 logical canvas | M2 | DONE |
| 6 | Verification & Adversarial Audit | Reviewer APPROVE, Challenger stress test, Forensic Auditor CLEAN, 100% test pass | M3 | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Reproduction Test | Physics code survey and creation of failing/reproduction Playwright test | none | DONE |
| 2 | Hydrodynamic Ballast Implementation | Ballast restoration & plume escape physics implementation | M1 | DONE |
| 3 | Verification & Forensic Integrity Gate | Reviewers, Challengers, Forensic Auditor, Full test suite | M2 | DONE |

## Interface Contracts & Constraints
- `Player.ts`: Smooth, continuous numerical integration at $165\text{ px/s}$. Boundary clamping to $[0, \text{canvasHeight} - \text{size.height}]$.
- `GameManager.ts`: Never alter `logicalWidth = 600` or `logicalHeight = 800`.
- Tests: `npx playwright test` and `npx tsc --noEmit` & `npm run build` pass with 0 errors.

# Claude Collaboration Guide: Water Invader

## Current Mission: QoL, Event Balancing, Crisis Variety, & Pre-Game Shop Mechanics

### Executive Summary & Objectives
1. **R1. Acid Rain Counterplay**:
   - Implemented an `Acid Shield / 내산성 코팅` purchasable upgrade in the Armory/Shop.
   - When active, falling acid storm droplets are safely deflected on player contact with audio/particle feedback, preventing all acid damage to the player.
2. **R2. Event Background Visibility Fix**:
   - Upgraded projectile rendering in `Bullet.ts` with a 4-tier **"Halo Sandwich"** design featuring a crisp 1.5px black perimeter outline (`#000000`), vivid outer halo, saturated body, and white-hot core.
   - Converted hazard projectiles into directional toxic teardrops with black border outlines.
   - Calibrated warning background overlay alphas to 0.10–0.12 and removed `backdrop-blur` from active combat modals to ensure crystal-clear visual clarity.
3. **R3. Expand Crisis Variety**:
   - Introduced a brand new intermediate Crisis type: `SOLAR_FLARE` with vertical telegraph warning beams and sweeping plasma columns.
   - Differentiated End-Game Cataclysm Bosses Phase 1 anchors: Void Rifts (Void Sovereign), Bio-Brood Sacks (Abyssal Leviathan), and EMP Laser Pylons (Cybernetic Exterminator).
4. **R4. Pre-Game Shop Access**:
   - Added an `ARMORY / SHOP (정비소)` entry point directly in the Main Menu overlay before Wave 1.
   - Provided starter pure water allowance (150 💧) to allow strategic pre-game build preparation.
   - Updated `GameManager.init()` with `preserveUpgrades: boolean` ensuring pre-game purchased stats and items carry seamlessly into Wave 1.
5. **R5. Automated Testing & Verification**:
   - Headless unit simulation tests: `tests/unit/acid_rain_counterplay.test.ts`, `tests/unit/pregame_shop_persistence.test.ts`, `tests/unit/crisis_variety_expansion.test.ts`.
   - Playwright E2E test specs: `tests/13_qol_and_crisis_mechanics.spec.ts`.
   - Pre-commit verification: `npx tsc --noEmit` and `npm run build` passing with 0 errors.

### Project Architecture & Key Documents
- `PROJECT.md`: Complete milestone schedule, architecture, and interface contracts.
- `TEST_INFRA.md`: Multi-tier test suite architecture and verification criteria.
- `.agents/`: Dedicated orchestrator, worker, reviewer, challenger, and auditor logs.

### Verification Protocol
- All workers and reviewers execute `npx tsc --noEmit`, `npm run build`, and `npx playwright test`.
- All milestone gates require full 5-point verification (Passing tests, Reviewer APPROVE, Challenger confirm, Auditor CLEAN).

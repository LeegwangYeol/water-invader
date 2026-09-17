# Claude Collaboration Guide: Water Invader

## Current Mission: Codebase-Wide Physics & Mechanical Edge-Case Audit and Remediation

### 1. Objective & Background
Perform a comprehensive, codebase-wide proactive audit and remediation of all physical and mechanical edge cases in the Water Invader game engine.
The objective is to proactively identify and resolve any UX/physics entrapment bugs, infinite loops, NaN coordinates, boundary violations, velocity blowups, or unrecoverable states across all subsystems (`GameManager.ts`, `Player.ts`, weapons, environments, factions, and boss mechanics) so past issues never reoccur.

---

### 2. Architectural Invariants & Core Constraints
- **Canvas Invariants**: Strictly preserve `logicalWidth = 600` and `logicalHeight = 800` in `GameManager.ts`, `Player.ts`, and `Enemy.ts`. All responsive layout adjustments must remain CSS-only.
- **Organic Physics Remediation**: All fixes must preserve existing expected gameplay behaviors and hydrodynamic physics without relying on arbitrary teleportation, hard resets, or synthetic clip snapping.
- **Zero Regressions**: 100% of existing regression test suites (including all flagship feature suites, buoyancy escape, continue flow, and responsive viewports) must pass.
- **Build Quality**: `npx tsc --noEmit` and `npm run build` must exit with 0 errors.

---

### 3. Comprehensive Subsystem Audit Matrix (100+ Agent Swarm Decomposition)
To satisfy the requested very large team (100+ agents), the audit will be decomposed across dedicated specialist streams:

1. **Stream A: Player Kinematics & Ballast Subsystem** (`Player.ts`, `ModularChassis.ts`, controls):
   - Vertical ballast settling, ceiling/floor boundary collisions, inertia/damping under multi-directional forces.
   - Input lockouts during state transitions (death, continue, shop, pauses).
   - Zero-coordinate safety, high-speed lateral boundary penetration, chassis hitbox switches.

2. **Stream B: Environmental Dynamics & Hazard Fields** (`HydrothermalVent.ts`, `OceanCurrent.ts`, `Whirlpool.ts`, `TectonicRift.ts`):
   - Multi-hazard superposition: what happens when player or enemy enters overlapping vents + currents + whirlpools simultaneously?
   - Force saturation / velocity accumulation: verify Euler integration clamps acceleration and prevents infinite/NaN coordinates.
   - Entrapment and ejection: ensure all vortexes and convective plumes have defined release vectors.

3. **Stream C: Weapons, Projectiles & Collision CCD** (`Projectile.ts`, `HomingMissile.ts`, `BioLaser.ts`, `Harpoon.ts`, `CryoMine.ts`):
   - Continuous Collision Detection (CCD) tunneling at high velocity or low framerate ($\Delta t$ spikes).
   - Zero-distance / overlapping origin division-by-zero ($dx = 0, dy = 0$) in homing and vector normalizations.
   - Projectile lifetime leaks, out-of-bounds cleanup, reflection angle NaNs on zero-width colliders.

4. **Stream D: Factions, Swarms & Boss Mechanics** (`Enemy.ts`, `ApexPredator.ts`, `KrakenBoss.ts`, `DreadnoughtBoss.ts`, `AncientMech.ts`, `AlliedVessel.ts`):
   - Boss phase transitions and multi-segmented entity physics locks.
   - Flocking pincer algorithm singularity / NaN steering vectors when entities overlap identically.
   - Barricade saboteur and ally pathfinding boundary violations.

5. **Stream E: Game Loop, Time Scaling & State Transitions** (`GameManager.ts`, `ShopOverlay.tsx`, `CrisisManager.ts`):
   - Large $\Delta t$ instability (tab unfocus, lag spikes): verify maximum time-step clamping (`dt = Math.min(dt, 0.1)`).
   - Wave clear vs boss death race conditions, post-death resurrection coordinate integrity.

---

### 4. Verification & Testing Protocol
1. **Automated Reproduction Test Suite**:
   - For every edge case or vulnerability identified, a dedicated Playwright test (`tests/physics_edgecase_<subsystem>.spec.ts`) MUST be written reproducing the failure scenario.
2. **Automated Fix Verification**:
   - Verify that the fix resolves the reproduction test without introducing collateral anomalies.
3. **Full Regression Test Run**:
   - Execute `npx playwright test` across the entire project test suite.
4. **Build & Type Check**:
   - Run `npx tsc --noEmit` and `npm run build`.
5. **Independent Agent-as-Judge Audit**:
   - Reviewing agent swarm simulates player edge cases and confirms natural hydrodynamic feel with zero remaining entrapment.
6. **Mandatory Post-Victory Audit**:
   - Sentinel spawns independent `teamwork_preview_victory_auditor` to audit timeline, test integrity, and anti-cheating compliance.

---

### 5. Current Status & Approval Gate
- **Status**: Completed & Verified (All 5 Streams Remediated, Tested, and Audited)
- **Routing Decision**: General (`teamwork_preview_orchestrator`) with specialized multi-agent swarm
- **Active Swarm Directory**: `.agents/orchestrator_physics_audit_1`
- **Execution Summary**:
  - **Survey (M0)**: Cataloged 21 physical/mechanical edge cases across Streams A-E in `SCOPE.md`.
  - **Reproduction Suite (M1)**: Authored `tests/physics_edgecase_comprehensive.spec.ts` (16 tests, 15 pre-fix failures confirmed).
  - **Organic Remediation (M2)**: Applied organic hydrodynamic fixes across `Player.ts`, `ModularChassis.ts`, `HydrothermalVent*.ts`, `Enemy.ts`, `HydraulicHarpoon.ts`, `KrakenPrimeBoss.ts`, `HadalBioHorrors.ts`, `Helper.ts`, `GameManager.ts`, and `EndGameCrisis.ts`.
  - **Verification Gate (M3)**: Unanimous **PASS** in `GATE_STATUS.md` (`auditor_physics_1`: **CLEAN**, `reviewer_physics_1`: **APPROVE**, `reviewer_physics_2`: **APPROVE**, `challenger_physics_1`: **APPROVE**, `challenger_physics_2`: **APPROVE**).
  - **Regression & Build (M4)**: 45/45 physics & adversarial tests passed (100%), `npx tsc --noEmit` exited with 0 errors, `npm run build` compiled successfully in 495ms (5/5 static pages).
  - **Master Handoff**: Recorded in `.agents/orchestrator_physics_audit_1/handoff.md`. Ready for final victory audit by Sentinel.



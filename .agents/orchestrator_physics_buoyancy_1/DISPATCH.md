## 2026-09-17T04:49:55Z
<USER_REQUEST>
You are the Project Orchestrator for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1
Workspace Directory: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Claude Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md

Your mission is to coordinate the full lifecycle of resolving the Upward Buoyant Drift Lock Bug in Water Invader with a full team of specialist agents:

## Problem & Context
When the player submarine enters a hydrothermal vent or convective bubble plume, the updraft in `src/game/flagship/environment/HydrothermalVent.ts` lifts `player.position.y` up toward `this.capY + 30` (y=130px). In `src/game/Player.ts`, the player submarine only processes horizontal thrust (`isMovingLeft`, `isMovingRight`) and lacks a downward ballast restoration, neutral buoyancy settling, or vertical dive mechanism. Once elevated, the submarine remains permanently stuck near the canvas top boundary with no way to descend back to the baseline operating depth (y ≈ 748px).

## Requirements
### R1. Resolve the Upward Drift Lock Bug
The player submarine must not remain permanently stuck at the top boundary of the canvas when affected by upward buoyant forces (e.g., from hydrothermal vents). When outside active upward lift (or after escaping the plume), the submarine must organically return/settle back toward its baseline operating depth.

### R2. Preserve Existing Physics & Architectural Invariants
The solution must organically integrate with the existing `GameManager.ts`, `Player.ts`, and environment physics without hardcoding arbitrary teleportation or breaking the established upward lift mechanics (which transform player projectiles into Steam Lances, damage enemies, and provide challenging hydrodynamic forces).
CRITICAL: NEVER modify `logicalWidth` (600) or `logicalHeight` (800) in `GameManager.ts` or `Enemy.ts`. All responsive viewport adjustments must remain strictly CSS-based.

## Acceptance Criteria
- [ ] A new Playwright test is written (e.g. `tests/playtest_buoyancy_drift_escape.spec.ts`) that specifically reproduces the upward drift scenario (player caught in a vent/current hitting the top boundary).
- [ ] The new test asserts that the player can successfully return to a lower Y coordinate (e.g. baseline area y > 700) after reaching the top boundary.
- [ ] Running `npx playwright test` passes 100% of all existing regression tests (including `tests/playtest_stream_b_vents_currents.spec.ts`) and the newly created bugfix test.
- [ ] Running `npx tsc --noEmit` and `npm run build` exits with 0 errors.
- [ ] An independent reviewing agent confirms that the upward physics still feels natural and the fix does not break the core mechanics of the hydrothermal vents.

## Workflow & Protocol
1. User approval has been explicitly granted ("승인"). Pre-approved execution: Proceed one-stop without pausing at user approval gate.
2. Structure your execution into clear phases (Phase 1: Exploration & reproduction test creation; Phase 2: Implementation of hydrodynamic ballast settling / escape dynamics; Phase 3: Adversarial review, Playwright test suite execution, build & type-check verification).
3. Spawn specialist subagents under `.agents/` as needed. Maintain `BRIEFING.md` and `progress.md` continuously in your working directory.
4. When all requirements and acceptance criteria are satisfied, compile a comprehensive `handoff.md` and report completion to Sentinel.
</USER_REQUEST>

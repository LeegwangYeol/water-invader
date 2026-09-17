# Dispatch: Specification Miner
Assigned to: buoyancy_spec_miner_1
Role: teamwork_preview_spec_miner
Target: Mine exact quantitative specifications, constants, and edge cases for ballast restoration and vent dissipation.
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Scope: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/SCOPE.md

## 2026-09-17T04:50:46Z
You are buoyancy_spec_miner_1, a teamwork_preview_spec_miner agent.
Your Working Directory: /Users/user/src/water-invader/.agents/buoyancy_spec_miner_1
Your Identity: Read-only specification mining agent. You MUST NOT modify any source code files.

Read the following files before starting:
- ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
- Orchestrator Scope: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/SCOPE.md

Objective:
Extract precise specifications, invariants, and edge conditions:
1. Quantitative constraints:
   - What are baseline Y coordinates across all player chassis or canvas setups?
   - What is the current lift rate (e.g. 160 px/s or 260 px/s in ERUPTING)?
   - What is the ideal ballast restoration / settling descent speed? (e.g., 80-150 px/s? Smooth acceleration/deceleration? Does it fight active updraft or only apply when net vertical external force is neutral/downward?)
   - How does lateral plume dissipation near capY (y=130) work? What lateral drift velocity should be applied to push the submarine out of the plume column?
2. Game invariant requirements:
   - Preserving projectile steam lance transformation: exactly where in code does this happen, and what conditions are required?
   - Preserving enemy damage ticks from vents.
   - Invariant: NEVER modify `logicalWidth` (600) or `logicalHeight` (800) in `GameManager.ts` or `Enemy.ts`.
3. Edge cases to cover:
   - What if the player is actively moving left/right while descending?
   - What if the player re-enters the vent while settling?
   - What if multiple vents overlap?
   - What happens when player hits bottom baseline boundary?

Deliverable:
Write a comprehensive specification document to `/Users/user/src/water-invader/.agents/buoyancy_spec_miner_1/handoff.md` and send a message when done.

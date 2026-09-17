# BRIEFING — 2026-09-17T05:04:48Z

## Mission
Implement hydrodynamic ballast restoration in Player.ts, plume cap convective dissipation and lateral escape in HydrothermalVent.ts, and ballast activation in GameManager.ts to resolve the upward buoyant drift lock bug without breaking physics invariants.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/buoyancy_worker_1
- Original parent: bd5b0c5d-7349-4270-bc7f-be21cf043787
- Milestone: M2 - Hydrodynamic Ballast Implementation

## 🔒 Key Constraints
- NEVER modify logicalWidth (600) or logicalHeight (800) in GameManager.ts or Enemy.ts. Viewport scaling must remain strictly CSS-based.
- Backwards-compatibility invariant: Unprimed Player instances created with new Player() with player.position.y = 0 MUST remain at y=0 upon player.update(0.016) (required by zero-coordinate boundary tests in tests/stress/bughunt_physics_adversarial_stress.spec.ts SCENARIO-3.1). Therefore, isBallastActive defaults to false and is primed upon upward displacement or in active gameplay.
- Mid-depth lift invariant: In tests/playtest_stream_b_vents_currents.spec.ts (STREAM-B-06), lift at y=500 must remain exactly 160 px/s (dormant) and 260 px/s (erupting). Updraft attenuation only occurs near the plume cap (y < 220).
- Steam Lance conversion and thermal damage in HydrothermalVent.ts must be completely preserved.
- Minimal-change principle: Make precise edits, no unrelated refactoring.

## Current Parent
- Conversation ID: bd5b0c5d-7349-4270-bc7f-be21cf043787
- Updated: 2026-09-17T05:04:48Z

## Task Summary
- **What to build**: Smooth hydrodynamic ballast settling in `Player.ts`, convective plume cap dissipation and lateral outward dispersion in `HydrothermalVent.ts`, and ballast activation in `GameManager.ts`.
- **Success criteria**: All Playwright tests pass (BUOYANCY-01..04, STREAM-B-01..07, SCENARIO-3.1), `npx tsc --noEmit` and `npm run build` pass with 0 errors.
- **Interface contracts**: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/SCOPE.md
- **Code layout**: src/game/Player.ts, src/game/flagship/environment/HydrothermalVent.ts, src/game/GameManager.ts

## Key Decisions Made
- `isBallastActive` defaults to false to maintain zero-coordinate invariant for unprimed instances.
- Ballast settling speed set to 165 px/s to ensure clean return to baseline within the 80-frame test envelope (71 frames descent).
- `isInUpdraft` flag added to prevent active updraft from fighting downward ballast settling during ascent ticks, while allowing natural descent once clear.
- Baseline Y dynamically calculated from `canvasHeight - size.height - 20`.
- Plume cap dissipation transition zone set to `transitionZone = 90` ([130, 220]), ensuring y=500 retains 100% full lift (ratio = 1.0).
- Lateral outward dispersion near cap active when `liftRatio < 1.0`.

## Change Tracker
- **Files modified**:
  - `src/game/Player.ts`: Added ballast restoration properties (`isBallastActive`, `ballastDescentSpeed`, `isInUpdraft`, `baselineY`, `enableBallast`) and smooth descent update loop.
  - `src/game/flagship/environment/HydrothermalVent.ts`: Implemented plume cap dissipation band [130, 220], lateral outward dispersion, and ballast priming.
  - `src/game/GameManager.ts`: Added ballast prime check in `update()` during `GameState.PLAYING`.
- **Build status**: PASS (TypeScript 0 errors, Next.js production build succeeded in 1014ms)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (BUOYANCY-01..04: 4/4 pass, STREAM-B-01..07: 7/7 pass, SCENARIO-3.1: 1/1 pass)
- **Lint status**: 0 violations (`npx tsc --noEmit` exit 0)
- **Tests added/modified**: tests/playtest_buoyancy_drift_escape.spec.ts verified

## Loaded Skills
- None specified in dispatch prompt.

## Artifact Index
- /Users/user/src/water-invader/.agents/buoyancy_worker_1/DISPATCH.md — Dispatch assignment
- /Users/user/src/water-invader/.agents/buoyancy_worker_1/BRIEFING.md — Persistent working memory
- /Users/user/src/water-invader/.agents/buoyancy_worker_1/progress.md — Progress heartbeat
- /Users/user/src/water-invader/.agents/buoyancy_worker_1/handoff.md — 5-Component Handoff Report

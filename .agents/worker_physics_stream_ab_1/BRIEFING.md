# BRIEFING — 2026-09-17T17:43:00+09:00

## Mission
Remediate physics edge cases in Stream A (ModularChassis hitbox/speed, Player ballast settling) and Stream B (HydrothermalVent lateral bounds & vent manager confluence ejection).

## 🔒 My Identity
- Archetype: implementer
- Roles: [implementer, qa]
- Working directory: /Users/user/src/water-invader/.agents/worker_physics_stream_ab_1
- Original parent: a6b982e7-d1a2-4856-a461-1d227c9eea67
- Milestone: M2 (Organic Physics Remediation - Streams A & B)

## 🔒 Key Constraints
- Exclusive file ownership:
  * src/game/Player.ts
  * src/game/flagship/progression/ModularChassis.ts
  * src/game/flagship/environment/HydrothermalVent.ts
  * src/game/flagship/environment/HydrothermalVentManager.ts
- Strict invariants: logicalWidth = 600, logicalHeight = 800.
- Organic hydrodynamic physics; no artificial teleporting or synthetic clip hacks.
- Target tests: STREAM-A and STREAM-B-01, STREAM-B-02 must pass with 0 errors.

## Current Parent
- Conversation ID: a6b982e7-d1a2-4856-a461-1d227c9eea67
- Updated: 2026-09-17T17:43:00+09:00

## Task Summary
- **What to build**:
  1. Clamped player position upon hitbox switch and updated player.baseSpeed in `ModularChassis.ts`.
  2. Implemented signed-distance smooth ballast settling toward baselineY in `Player.ts`.
  3. Clamped plume lateral dispersion to [0, canvasWidth - width] and removed synthetic drift hacks in `HydrothermalVent.ts`.
  4. Added organic convective confluence turbulence, downwelling recirculation, and lateral divergence in `HydrothermalVentManager`.
- **Success criteria**:
  * `npx tsc --noEmit` exits with 0 errors.
  * All 5 target tests (`STREAM-A-01`, `STREAM-A-02`, `STREAM-A-03`, `STREAM-B-01`, `STREAM-B-02`) pass with 0 errors.

## Change Tracker
- **Files modified**:
  * `src/game/Player.ts`: Smooth signed-distance settling for ballast restoration.
  * `src/game/flagship/progression/ModularChassis.ts`: Bounded hitbox switching coordinates and recorded active chassis baseSpeed.
  * `src/game/flagship/environment/HydrothermalVent.ts`: Removed synthetic drift hacks, bounded plume dispersion, added confluence downwelling/ejection.
  * `src/game/flagship/environment/HydrothermalVentManager.ts`: Created re-export interface wrapper.
- **Build status**: PASS (`npx tsc --noEmit` clean, 5/5 Playwright target tests pass)
- **Pending issues**: None

## Quality Status
- **Build/test result**: 5 passed (100% pass rate) in `tests/physics_edgecase_comprehensive.spec.ts` matching `STREAM-A|STREAM-B-01|STREAM-B-02`.
- **Lint status**: Clean
- **Tests added/modified**: Covered by comprehensive reproduction test suite

## Artifact Index
- DISPATCH.md — Assignment and instructions
- progress.md — Heartbeat and status
- handoff.md — 5-Component completion handoff report

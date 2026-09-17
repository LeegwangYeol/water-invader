# BRIEFING — 2026-09-17T04:54:35Z

## Mission
Investigate Playwright test harnesses, execution patterns, and reproduction strategy for buoyancy drift escape bug.

## 🔒 My Identity
- Archetype: explorer
- Roles: [teamwork_preview_explorer]
- Working directory: /Users/user/src/water-invader/.agents/buoyancy_exp_tests_1
- Original parent: bd5b0c5d-7349-4270-bc7f-be21cf043787
- Milestone: M1 (Exploration & Reproduction Test)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify any source code files (.ts, .tsx, .css, etc.)
- Work only in /Users/user/src/water-invader/.agents/buoyancy_exp_tests_1
- Canvas logicalWidth=600 and logicalHeight=800 invariants must be respected

## Current Parent
- Conversation ID: bd5b0c5d-7349-4270-bc7f-be21cf043787
- Updated: 2026-09-17T04:54:35Z

## Investigation State
- **Explored paths**:
  - `tests/playtest_stream_b_vents_currents.spec.ts`
  - `tests/20_flagship_12_features.spec.ts`
  - `tests/01_ui_and_controls.spec.ts`
  - `tests/03_game_mechanics.spec.ts`
  - `tests/adversarial_flagship_state_transitions.spec.ts`
  - `tests/unit/flagship_adversarial_physics_stress.test.ts`
  - `src/game/flagship/environment/HydrothermalVent.ts`
  - `src/game/Player.ts`
  - `src/game/GameManager.ts`
  - `src/components/game-canvas.tsx`
  - `playwright.config.ts`
- **Key findings**:
  1. Plume lift mechanism: `HydrothermalVent.ts` lines 232-236 applies lift = 160 px/s (dormant) or 260 px/s (erupting) clamped at `capY + 30 = 130` when `inHalo || inCore`.
  2. Submarine missing vertical ballast restoration: `Player.ts` only modifies `position.x` based on `isMovingLeft`/`isMovingRight` and clamps `position.y` between 0 and 760; it never restores `position.y` towards baseline depth 740.
  3. Playwright testing harness conventions:
     - Headless node physics simulation: Direct instantiation of `Player` and `HydrothermalVent`, deterministic discrete timestep loops, verifying monotonicity, convergence, boundary clamping, and anti-teleportation delta limits.
     - Live browser E2E playtest: Navigating to `/`, clicking `START GAME`, waiting for `window.gameManager` and `window.flagshipManager`, setting `isGodMode = true` and `enemies = []`, positioning player over vent, waiting for lift to `y < 200`, steering left with `page.keyboard.down('ArrowLeft')` to `x < 50`, and sampling descent trajectory to `y > 700` with clean console.
- **Unexplored areas**: None for M1 exploration. Test writer and implementer can proceed directly.

## Key Decisions Made
- Designed a dual-layer test suite for `tests/playtest_buoyancy_drift_escape.spec.ts`:
  - 4 headless discrete physics simulation tests (`BUOYANCY-01` through `BUOYANCY-04`) for fast deterministic CI verification.
  - 1 live browser E2E test (`BUOYANCY-E2E-01`) for end-to-end user experience and clean console verification.
- Provided ready-to-use TypeScript test file in `proposed_playtest_buoyancy_drift_escape.spec.ts`.

## Artifact Index
- DISPATCH.md — Initial dispatch log
- BRIEFING.md — Situational awareness
- progress.md — Liveness heartbeat
- proposed_playtest_buoyancy_drift_escape.spec.ts — Complete proposed test file
- handoff.md — Comprehensive investigation report

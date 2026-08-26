## 2026-08-26T10:39:19Z

You are the E2E Test Writer for Milestone M_TEST: 3-Way Battle & Dynamic Reinforcements Test Suite.
Working directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_test_writer_mtest_1

Authoritative references:
- Read /Users/a7111/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Read /Users/a7111/src/water-invader/PROJECT.md

Scope & Mission:
Design and write a comprehensive, requirement-driven, opaque-box E2E test suite in `tests/05_three_way_battle.spec.ts` using Playwright (@playwright/test).
Follow the 4-tier methodology:
1. Tier 1 - Feature Coverage (>=5 tests per feature):
   - Faction hostilities: PLAYER vs INVADER, PLAYER vs ROGUE, INVADER vs ROGUE.
   - Bullet damage & collisions for all 3 factions.
   - Crossfire interactions: Rogue bullet damaging Invader, Invader bullet damaging Rogue.
   - Dynamic reinforcement spawning: Flank incursions, V-formations, 3-way clashes.
   - Wave clear conditions: Wave clears ONLY when BOTH Invader and Rogue entities are eliminated.
2. Tier 2 - Boundary & Corner Cases:
   - Zero entities of a faction remaining.
   - High density crossfire bullet collisions.
   - Simultaneous defeat of Invader and Rogue.
   - Player sitting idle while Invaders and Rogues eliminate each other.
3. Tier 3 - Cross-Feature Combinations:
   - Helpers (Fighter/Tank/Repairer) targeting and defending against both Invaders and Rogues.
   - Player Ultimate (Heavy Rain) damaging both Invaders and Rogues simultaneously.
   - Mid-wave surprise Rogue incursion during an active Boss wave.
4. Tier 4 - Real-World Application Scenarios:
   - Full multi-wave progression with 3-way battles, dynamic reinforcements, shop upgrades, and score tracking.

Write ownership:
- You own `tests/05_three_way_battle.spec.ts`, `TEST_INFRA.md`, and `TEST_READY.md`.
- Ensure tests verify through `(window as any).gameManager` and canvas/UI without breaking existing tests.
- DO NOT modify `src/` files (that belongs to the implementation track).

When complete:
1. Create `TEST_INFRA.md` at project root (`/Users/a7111/src/water-invader/TEST_INFRA.md`).
2. Create `TEST_READY.md` at project root (`/Users/a7111/src/water-invader/TEST_READY.md`).
3. Write your handoff report to `/Users/a7111/src/water-invader/.agents/teamwork_preview_test_writer_mtest_1/handoff.md` and send a message.

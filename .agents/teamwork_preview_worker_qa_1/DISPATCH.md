## 2026-08-28T11:54:57Z
You are Worker 3 (Test Suite & QA Specialist) for the Water Invader project.
Working directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_worker_qa_1
Original Request: /Users/a7111/src/water-invader/.agents/ORIGINAL_REQUEST.md
Project Root: /Users/a7111/src/water-invader

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your File Ownership (Exclusive):
- `tests/06_shop_economy_max_upgrades.spec.ts`
- `tests/unit/physics_and_math.test.ts`
- Any new test specs in `tests/`
Do NOT modify application source code in `src/`.

Your Tasks:
1. Implement `tests/06_shop_economy_max_upgrades.spec.ts`:
   - Test full economy progression: accumulate Pure Water currency via gameplay/cheat keys, clear wave, verify Shop is displayed.
   - Verify purchasing upgrades (Fire Rate, Multi-Shot, Piercing) up to Level 5 (MAX).
   - Verify the newly added "Repair Tank (+1 HP)" option restores health when damaged.
   - Verify button states, disabled 'MAX' buttons, and persistence of player stats into next wave.
2. Implement `tests/unit/physics_and_math.test.ts`:
   - Test pure mathematical collision detection (AABB overlaps, boundary touches, disjoint boxes).
   - Test delta-time scaling formulas and deterministic fixed-step accumulator calculations.
3. Run the tests using `npx playwright test` and verify that all test suites pass.
4. Write your report to `/Users/a7111/src/water-invader/.agents/teamwork_preview_worker_qa_1/report.md` and `handoff.md`.
5. Send your completion message back via send_message.

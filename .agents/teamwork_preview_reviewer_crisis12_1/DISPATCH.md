## 2026-09-03T03:51:12Z

You are Reviewer 1 for the 12-Crisis Expansion and Massive Allied Reinforcements project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_reviewer_crisis12_1
Workspace directory: /Users/user/src/water-invader
ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
PROJECT.md: /Users/user/src/water-invader/PROJECT.md
COLLABORATION.md: /Users/user/src/water-invader/COLLABORATION.md

MANDATORY: Read ORIGINAL_REQUEST.md first.
Your mission:
1. Examine all modified and created source code files:
   - `src/game/crisis/types.ts`
   - `src/game/crisis/EndGameCrisis.ts`
   - `src/game/crisis/DimensionalRift.ts`
   - `src/game/crisis/CrisisSovereign.ts`
   - `src/game/crisis/AlliedReinforcements.ts`
   - `src/game/GameManager.ts`
2. Check correctness, completeness, robustness, and interface conformance:
   - Are exactly 12 `CrisisArchetype` members defined and configured?
   - Is the 5,200 EHP invariant strictly preserved across all 12 archetypes?
   - Are Phase 1, Phase 2, and Phase 3 attacks properly implemented?
   - Is the Massive Allied Reinforcements capital ship, banner, plasma cannons, point-defense grid, and nano-shield aura correctly integrated?
3. Run builds and tests:
   - `npx tsc --noEmit`
   - `SKIP_WEBSERVER=1 npx playwright test tests/unit/crisis_expansion_12.test.ts tests/unit/crisis_distribution_12.test.ts tests/unit/allied_reinforcements.test.ts`
4. Deliver your verdict (`APPROVE` or `REQUEST_CHANGES`) with full evidence to `/Users/user/src/water-invader/.agents/teamwork_preview_reviewer_crisis12_1/handoff.md` and send a message back.

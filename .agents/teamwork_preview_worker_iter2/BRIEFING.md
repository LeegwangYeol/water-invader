# BRIEFING — 2026-09-02T15:05:40Z

## Mission
Fix GameManager upgradeFireRate cap condition, init() polymorphic options & preserveUpgrades parameter handling, and resolve flakiness/strict locator issues in tests/13_qol_and_crisis_mechanics.spec.ts.

## 🔒 My Identity
- Archetype: preview_worker_iter2
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_iter2
- Original parent: f6eab4f4-b1f5-48ab-a8b5-a0f343d21361
- Milestone: iter2_bugfix_and_test_stabilization

## 🔒 Key Constraints
- Only modify owned files: src/game/GameManager.ts, tests/13_qol_and_crisis_mechanics.spec.ts
- Genuine implementations only (no hardcoding or facades)
- Typecheck & Build must pass cleanly
- Full test suites must pass

## Current Parent
- Conversation ID: f6eab4f4-b1f5-48ab-a8b5-a0f343d21361
- Updated: 2026-09-02T15:05:40Z

## Task Summary
- **What to build**: Fix upgradeFireRate() cap logic in GameManager, support polymorphic init() options and positional preserveUpgrades parameter, update test locators & websocket filtering in 13_qol_and_crisis_mechanics.spec.ts.
- **Success criteria**: Clean tsc, clean npm run build, passing adversarial and qol playwright test suites.
- **Code layout**: src/game/GameManager.ts, tests/

## Key Decisions Made
- Updated `GameManager.init` to support `boolean | { resetScoreAndCash?: boolean; preserveUpgrades?: boolean }` and route upgrade preservation via `shouldPreserve`.
- Updated `GameManager.upgradeFireRate` to check `this.currency >= 50 && this.getUpgrades().fireRate < 5` and round with `toFixed(2)` to eliminate float precision issues.
- Updated `tests/13_qol_and_crisis_mechanics.spec.ts` to disambiguate h1 locator with `.first()`, expand start button regex to `/START|NEXT WAVE|DEPLOY|출격|CLOSE|PLAY/i`, and filter `_next/hmr` websocket console errors.

## Change Tracker
- **Files modified**:
  - `src/game/GameManager.ts`: polymorphic `init()`, robust `upgradeFireRate()` cap condition.
  - `tests/13_qol_and_crisis_mechanics.spec.ts`: locator disambiguation, launch button regex, HMR console error filtering.
- **Build status**: PASS (Next.js production build in 5.0s, tsc clean)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (147 unit/adversarial tests + 5 QoL integration tests + 6 regression tests passed 100%)
- **Lint status**: PASS
- **Tests added/modified**: `tests/13_qol_and_crisis_mechanics.spec.ts`

## Loaded Skills
- None

## Artifact Index
- /Users/user/src/water-invader/.agents/teamwork_preview_worker_iter2/DISPATCH.md — Assignment instructions
- /Users/user/src/water-invader/.agents/teamwork_preview_worker_iter2/BRIEFING.md — Situational awareness
- /Users/user/src/water-invader/.agents/teamwork_preview_worker_iter2/progress.md — Liveness & progress tracking
- /Users/user/src/water-invader/.agents/teamwork_preview_worker_iter2/handoff.md — Final handoff report

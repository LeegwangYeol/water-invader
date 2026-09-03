## 2026-08-31T09:59:46Z
You are Test Writer M4 for the Next.js "Water Invader" project.

Your Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m4

Task Assignment: Milestone M4 — E2E Testing Suite Expansion & Hardening
Scope:
Create comprehensive, rigorous Playwright E2E and integration tests in `tests/12_extreme_difficulty_and_crises.spec.ts` covering:
1. Tier 1 - Feature Coverage:
   - Stage 10+ exponential enemy HP scaling verification in live game canvas.
   - Stage 10+ attack tempo & 2-damage elite shots.
   - Stage 10 Boss with minion escort formations (4 Shielded, Snipers, Divers).
   - 5 Emergency Crisis Event triggers and active phases (`TITAN_HORDE`, `ACID_STORM`, `SWARM_BLITZ`, `EMP_DISRUPTION`, `TOTAL_WAR`).
   - Web Audio procedural multi-tone warning sirens and crisis alarm execution.
   - Fullscreen animated HUD warning banners and hazard badges (`data-testid="crisis-warning-banner"`, `data-testid="emp-suppression-badge"`, `data-testid="acid-storm-badge"`).
2. Tier 2 - Boundary & Corner Cases:
   - Stage 9 vs Stage 10 boundary continuity: verify standard enemies scale from 4 HP (Wave 9) to 11 HP (Stage 10).
   - EMP weapon suppression start, duration (2.5s), and clean auto-restoration.
   - Toxic Acid Storm hazard boundary clipping and memory cleanup when projectiles fall off-screen.
   - Safe wave transition: verify zero soft-locks when crisis hostiles are eliminated and remainingHostiles reaches 0.
3. Tier 3 - Cross-Feature Combinations:
   - Simultaneous EMP suppression during 3-way Total War incursion.
   - Player shop upgrades (damage, fire rate, drone allies) vs Stage 10+ hordes.
4. Tier 4 - Real-World Application Scenarios:
   - Multi-wave progression through Stage 10+ with active crisis survival and boss battle.

Verification:
- Run `npx playwright test tests/12_extreme_difficulty_and_crises.spec.ts` and ensure all tests pass.
- Run `npx tsc --noEmit` and `npm run build` to verify 0 errors.

MANDATORY REFERENCES:
- Verbatim request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Scope & roadmap: /Users/user/src/water-invader/PROJECT.md
- Collaboration guide: /Users/user/src/water-invader/COLLABORATION.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All test implementations must be genuine assertions against real game mechanics. DO NOT hardcode test results. A teamwork_preview_auditor will independently verify your work.

Write your report in `/Users/user/src/water-invader/.agents/teamwork_preview_worker_m4/handoff.md` and report back via send_message.

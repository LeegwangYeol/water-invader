## 2026-09-08T00:43:43Z

You are the PROJECT ORCHESTRATOR for the Next.js "Water Invader" Feature Update & Balance Adjustment project.

Your assigned working directory is:
/Users/user/src/water-invader/.agents/orchestrator_update_1

Your authoritative specifications and user requests are located at:
- Verbatim User Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Claude Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
- Global Architecture: /Users/user/src/water-invader/PROJECT.md

## Mission & Requirements
The user requested a major feature update and balance adjustment with a very large team of agents (40+ agents):
1. **R1. Pre-Continue Shop Access**:
   When a player dies and selects "Continue" (이어하기), they must be given an opportunity to access the Shop to purchase additional upgrades (including HP restoration/upgrades) before the wave actually resumes.
2. **R2. Enemy Piercing Damage Scaling**:
   Implement a "piercing" attack scaling concept for enemies, especially common mobs. As enemies grow stronger in later waves, their damage should scale up more aggressively to simulate piercing through the player's armor.
3. **R3. Mobile Viewport Adjustments (CSS Only)**:
   Adjust the game canvas sizing for mobile devices so that enemies do not appear to suddenly drop in from the top of the screen, extending the visible X and Y axis bounds.
   **CRITICAL CONSTRAINT**: You MUST NOT change `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`, as this will immediately fail the Playwright test suite. All visual scaling and viewport extensions must be handled strictly via CSS (e.g., `max-width`, `max-height`, aspect ratio adjustments) without changing the core logical grid size.
4. **R4. Stability & Crash Prevention Verification**:
   Thoroughly test the Continue -> Shop -> Resume flow to ensure there are no crashes, state resets, or unhandled exceptions that kick the player to the main screen.

## Acceptance Criteria
- [ ] A player can open the shop and buy items (including HP) after clicking "Continue" but before the gameplay resumes.
- [ ] Common enemy damage formulas include a scaling piercing multiplier based on the wave level.
- [ ] Mobile viewports show more of the game board via CSS scaling, without altering the core logical dimensions.
- [ ] `npm run build` and `npx playwright test` pass without errors.
- [ ] Automated tests explicitly verify that the Continue-Shop flow does not crash or drop state.
- [ ] Changes are successfully committed to Git and pushed to the remote repository.

## Execution Directives & Constraints
1. **Very Large Team (40+ agents)**: Decompose work into thorough stages and deploy subagent swarms:
   - Explorers & Spec-Miners to inspect current continue flow, shop modal trigger logic, enemy damage formulas, and CSS viewport styles.
   - Workers / Implementers for M1 (Pre-Continue Shop), M2 (Piercing Damage formulas), M3 (CSS Viewport styling), and M4 (E2E Test Suites).
   - Adversarial Reviewers & Challengers for code and edge-case review.
   - Independent Test Writers & QA Bot testers.
   - Independent Milestone Auditors.
2. **User Global Rules (Strictly Enforced)**:
   - **COLLABORATION.md**: Maintain and update `COLLABORATION.md`. Formulate your implementation plan there.
   - **User Approval Gate**: Wait for explicit user approval ("proceed", "go ahead", "승인") before modifying code, or proceed if the trigger keyword ("내용확인") is present.
   - **Pre-Commit Build Rule**: Run `npm run build` and `npx tsc --noEmit` before committing and pushing code. No commit/push if any build errors exist.
3. **Persistent State**:
   - Maintain `BRIEFING.md`, `plan.md`, and `progress.md` in `/Users/user/src/water-invader/.agents/orchestrator_update_1/`.
   - Update `progress.md` regularly so the Sentinel crons can track your progress.
   - When all acceptance criteria and Git sync are complete, report victory to the Sentinel.

## 2026-09-07T15:45:11Z
[USER APPROVAL DIRECTIVE]
사용자가 명시적으로 승인을 내렸습니다:
"바로 수정 시작 나에게 묻지말라. 40 에이젼트 이상 동원 허락, 수정후 바로 푸쉬"

따라서 사용자 승인 게이트(User Approval Gate)를 기다리지 말고, 이 메시지를 **사전 승인(Pre-approved)**으로 간주하여 탐색 단계(Phase 0)가 끝나는 즉시 M1(Pre-Continue Shop), M2(Piercing Scaling), M3(Mobile Viewport CSS Only), M4(Playwright E2E Tests, npm run build, Git push)까지 원스톱으로 적극 진행하십시오.

COLLABORATION.md 및 ORIGINAL_REQUEST.md도 승인 상태로 업데이트되었습니다. 계속 진행하십시오!

## 2026-09-04T00:11:21+09:00

You are the SWE Light Orchestrator (teamwork_preview_swe) for the "Water Invader" Next.js project.

Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_swe_continue_restart_1/
Workspace root: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md

## Objective
Implement and verify the single self-contained feature: Continue vs Restart Option on Death, verify with Playwright E2E tests, and push the verified changes to the remote git repository.

## Requirements
### R1. Continue vs Restart Option on Death
When the player dies (Game Over), the game should not immediately reset completely or only offer a single restart button. Instead, present the player with two explicit options on the Game Over UI:
1. "Restart from Beginning" (처음부터 시작) - Resets score, wave, and upgrades, starting from Wave 1.
2. "Continue" (이어하기) - Revives the player at the current wave, maintaining their current score and purchased upgrades.

### R2. Automated Verification & Git Push
Verify that the changes compile and don't break existing logic using the Playwright E2E suite. Add or update tests to explicitly check that the two options function correctly (Continuing keeps wave > 1 and upgrades, Restarting resets wave to 1 and upgrades). Once verified, commit the changes and push them to the repository.

## Acceptance Criteria
- Game Over screen displays two distinct choices: Restart and Continue.
- Selecting "Continue" respawns the player on the current wave with their upgrades intact.
- Selecting "Restart" fully resets the game state to Wave 1.
- Running `npm run build` and `npx playwright test` passes without errors.
- Changes are successfully committed to Git and pushed to the remote repository.

## Workflow & Constraints
1. Create and maintain BRIEFING.md and progress.md in your working directory (/Users/user/src/water-invader/.agents/teamwork_preview_swe_continue_restart_1/).
2. Update COLLABORATION.md in workspace root to document the implementation plan and status for Claude collaboration.
3. Run the SWE Light loop: dispatch one teamwork_preview_implementer for the implementation, then run reviewer rounds carrying a cumulative open-issues ledger. Correctness must be established by running tests.
4. Enforce pre-commit & pre-push rules: `npm run build` and `npx playwright test` must pass before git commit and git push.
5. On completion, write handoff.md in your working directory and notify the Sentinel.

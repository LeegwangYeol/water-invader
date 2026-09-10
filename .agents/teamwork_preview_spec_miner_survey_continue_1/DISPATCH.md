# Task Assignment: Survey Continue vs Shop Flow & Crash Prevention (R1 & R4)

- Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_survey_continue_1
- Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Scope Document: /Users/user/src/water-invader/PROJECT.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md

## Objective
Analyze the current death, Game Over modal, continueGame, shop modal, and wave start/resume mechanisms. Document exact specifications and edge cases for granting Shop access upon clicking "Continue" before wave gameplay resumes.

## 2026-09-07T15:45:01Z
Investigate requirements R1 (Pre-Continue Shop Access) and R4 (Stability & Crash Prevention Verification).
Specifically:
1. Trace the death and Game Over modal lifecycle in `src/game/GameManager.ts` and `src/components/game-canvas.tsx`.
2. Inspect `continueGame()` vs `restartFromBeginning()`. What happens to score, cash, wave, upgrades, player HP, barricades, and enemies?
3. Inspect how the Shop modal currently works (`isShopOpen`, `ShopModal`, currency spending, upgrade purchases including HP).
4. Analyze how to wire "Continue" so that clicking Continue does NOT immediately resume the wave loop, but instead opens the Shop modal, allowing the player to purchase items (including HP restoration/upgrades), and then when the Shop is closed or a "Resume Wave" button is clicked, cleanly resumes gameplay.
5. Identify all failure modes and crash risks: unhandled exceptions, double-resume, loop leaks, game state wipes, audio or timer leaks, and barricade/enemy respawn conflicts.
6. Write a comprehensive specification and architecture report to `/Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_survey_continue_1/handoff.md`.

## 2026-09-04T00:40:21+09:00

You are an Explorer surveying the codebase for Requirement R1 of the Water Invader feature expansion.

Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md (specifically section "## 2026-09-03T15:37:41Z")
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_bg_threat/
Project Root: /Users/user/src/water-invader/

Objective:
Investigate the codebase for:
R1. Dynamic Backgrounds & Threat Signifiers:
- Every 10 stages (e.g., Wave 10, Wave 20), the game background must change to indicate progression.
- When Elite enemies, Bosses, or high-difficulty events are present, the color scheme or background must visually shift to give the player a distinct impression of heightened danger.

Tasks:
1. Examine `src/game/GameManager.ts`, `src/components/game-canvas.tsx`, `src/game/Enemy.ts`, `src/game/types.ts`, and any existing background rendering logic (stars, nebula, canvas clear rect, CSS background, gradient, particle systems).
2. Trace how waves advance and how current wave numbers are tracked.
3. Identify how Elites, Bosses, and Crisis/High-difficulty events are represented in state (e.g. `isBoss`, `isMidTier`, `crisisEvent`, etc.).
4. Identify how to cleanly implement dynamic backgrounds that cycle or change distinctly every 10 waves (e.g. deep water, abyssal trench, bioluminescent reef, toxic seabed, cosmic void) and visual shifts (tint/color scheme/pulse/vignette) during Boss/Elite presence.
5. Identify existing tests in `tests/` and how background rendering / wave progression is tested or could be tested with Playwright E2E.
6. Write a comprehensive survey report to `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_bg_threat/survey.md` with:
   - Current codebase architecture for backgrounds and wave tracking
   - Proposed data structures and state variables
   - Recommended implementation strategy
   - Edge cases & performance considerations (canvas 60 FPS)
   - Playwright test strategy
7. Write `handoff.md` and send a completion message with the path to your report.

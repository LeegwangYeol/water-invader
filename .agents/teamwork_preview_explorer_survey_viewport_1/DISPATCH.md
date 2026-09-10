# Task Assignment: Survey Canvas Viewport & Mobile CSS Scaling (R3)

- Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_viewport_1
- Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Scope Document: /Users/user/src/water-invader/PROJECT.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md

## Objective
Inspect `src/components/game-canvas.tsx`, `src/app/globals.css`, and related styling. Determine how mobile devices currently scale/render the canvas, why enemies seem to suddenly appear/drop in from the top on mobile, and propose CSS-only modifications (aspect-ratio, max-width/height, object-fit/letterboxing, flex/grid container styling) while strictly respecting the constraint: NEVER touch `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`.

## 2026-09-07T15:45:01Z
You are the Technical Explorer investigating Canvas Sizing and Mobile Viewport CSS for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_viewport_1
Identity & Assignment: Read /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_viewport_1/DISPATCH.md
Authoritative specifications:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/COLLABORATION.md

Your Objective:
Investigate requirement R3 (Mobile Viewport Adjustments - CSS Only).
CRITICAL CONSTRAINT: You MUST NOT change `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`. All changes must be strictly CSS / layout styling.
Specifically:
1. Inspect `src/components/game-canvas.tsx`, `src/app/globals.css`, `src/app/page.tsx`, and `src/app/layout.tsx`.
2. How is the HTML5 `<canvas>` currently sized, styled, and positioned? What are the CSS rules for mobile screens vs desktop?
3. Why do enemies seem to suddenly appear or drop in from the top on mobile screens? (Examine aspect ratios, `object-fit`, overflow, padding/margins, and fixed height containers).
4. Propose precise CSS adjustments to container wrappers, canvas styling, aspect-ratio constraints, and media queries so that the visible vertical and horizontal bounds on mobile accommodate incoming enemies smoothly without abrupt clipping, while keeping the exact logical canvas coordinates intact.
5. Check existing Playwright tests in `tests/` for canvas size assertions or screenshot tests that could be affected.
6. Write a comprehensive technical report to `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_viewport_1/handoff.md`.

## 2026-09-07T15:51:15Z
**Context**: Survey Phase wrapping up
**Content**: All other survey subagents have delivered their handoffs. You do not need to run exhaustive tests during the survey phase. Please synthesize your findings on mobile canvas styling, TopHUD height occlusion, aspect-ratio constraints, and write your handoff report to `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_viewport_1/handoff.md`.
**Action**: Conclude survey and write handoff.md immediately.

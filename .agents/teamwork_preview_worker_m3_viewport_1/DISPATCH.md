# Task Assignment: Milestone 3 (M3) — Mobile Viewport CSS Adjustments Implementation

- Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m3_viewport_1
- Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Scope Document: /Users/user/src/water-invader/PROJECT.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
- Architectural Specification: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_viewport_1/handoff.md

## Exclusive File Ownership
- `src/components/game-canvas.tsx` (TopHUD mobile responsive styling & canvas container border)
- `src/app/page.tsx` (main padding & responsive header)
- `src/app/globals.css` (optional utilities if needed)

## CRITICAL CONSTRAINTS (STRICTLY ENFORCED)
1. You MUST NOT change `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`. All changes must be strictly CSS / layout styling.
2. You MUST preserve `aspect-[3/4]` on the canvas wrapper div in `src/components/game-canvas.tsx`. Over 60 Playwright tests assert this class and ratio.
3. DO NOT CHEAT. All implementations must be genuine.

## Objective
Implement Requirement R3 (Mobile Viewport Adjustments - CSS Only) following `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_viewport_1/handoff.md`:
1. In `src/components/game-canvas.tsx` (`TopHUD`):
   - Make TopHUD compact on mobile so its height shrinks from ~100px to ~38px, eliminating the 22% canvas occlusion that hid spawning enemies:
     - Outer container padding: `p-2 sm:p-4`.
     - Score: `text-sm sm:text-2xl font-bold text-blue-400`.
     - Pure Water: `text-xs sm:text-base text-blue-200`.
     - Wave text: `text-xs sm:text-base text-yellow-300 font-bold`.
     - Invader & Rogue threat badges: `px-1.5 py-0 sm:px-2 sm:py-0.5 text-[10px] sm:text-xs`.
     - HP circles: `w-3.5 h-3.5 sm:w-6 sm:h-6`.
     - Mute button: `px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs`.
     - Ultimate gauge: `w-20 sm:w-32 h-2.5 sm:h-4`.
   - Canvas container: change `border-4` to `border-2 sm:border-4` on mobile to reclaim 4px canvas area.
2. In `src/app/page.tsx`:
   - Reduce mobile padding: change `<main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">` to `p-2 sm:p-4` (or `px-2 py-1 sm:p-4`). This gives mobile devices ~24px more horizontal space, expanding the visible canvas proportionally.
   - Streamline header: `h1` uses `text-2xl sm:text-4xl mb-1 sm:mb-2`. Keyboard instruction paragraph uses `text-xs sm:text-sm text-slate-400 hidden sm:block`.
3. Verification:
   - Run `npx tsc --noEmit` and `npm run build` (0 errors).
   - Run responsive test suites:
     `npx playwright test tests/bughunt_ui_responsive_viewports.spec.ts tests/m3_verification.spec.ts tests/adversarial_challenger_m3_1.spec.ts`
   - Write handoff report to `handoff.md`.

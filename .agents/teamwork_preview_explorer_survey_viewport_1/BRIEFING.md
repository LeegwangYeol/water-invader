# BRIEFING — 2026-09-08T00:52:00+09:00

## Mission
Investigate Canvas Sizing and Mobile Viewport CSS for Water Invader (Requirement R3) to eliminate enemy clipping on mobile while preserving logical canvas dimensions.

## 🔒 My Identity
- Archetype: explorer
- Roles: survey_viewport
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_viewport_1
- Original parent: 38e78144-9abc-48a3-8a83-099f912ed48b
- Milestone: survey_viewport

## 🔒 Key Constraints
- Read-only investigation — do NOT implement in source code
- MUST NOT change `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`
- All proposed changes must be strictly CSS / layout styling

## Current Parent
- Conversation ID: 38e78144-9abc-48a3-8a83-099f912ed48b
- Updated: 2026-09-08T00:52:00+09:00

## Investigation State
- **Explored paths**:
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
  - `src/app/globals.css`
  - `src/components/game-canvas.tsx` (`TopHUD`, `CanvasCore`, `MobileControls`, container hierarchy)
  - `src/game/GameManager.ts` (`logicalWidth = 600`, `logicalHeight = 800`, DPR scaling, enemy spawn logic)
  - `src/game/Enemy.ts` (spawn Y coordinates, dive velocities, boundary clamping)
  - `tests/` (`bughunt_ui_responsive_viewports.spec.ts`, `adversarial_challenger_m3_1.spec.ts`, `m3_verification.spec.ts`, `01_ui_and_controls.spec.ts`, `cross_device_touch_verification.spec.ts`, `mobile_controls_and_touch_evasion.spec.ts`)
- **Key findings**:
  1. TopHUD DOM overlay is ~95px tall on mobile, covering 154-184 logical units (22% of canvas height). Enemies spawn at y=50..90 and are completely occluded by the HUD, popping out suddenly when passing y=160.
  2. Mobile viewport overflow: 92px header + 477px canvas + 100px controls + 32px padding = 709px height, pushing top of canvas off-screen on mobile devices.
  3. `aspect-[3/4]` class name is explicitly required by `tests/adversarial_challenger_m3_1.spec.ts` and `tests/m3_verification.spec.ts` (ratio must remain within 0.73-0.77).
- **Unexplored areas**: None. Survey is complete.

## Key Decisions Made
- Authored comprehensive 5-component handoff report proposing 4 precise CSS adjustments:
  1. Compact mobile TopHUD (reduces HUD height from ~95px to ~36px, clearing enemies at y=70..90).
  2. Streamlined mobile page header and padding in `src/app/page.tsx` (`hidden sm:block` for keyboard controls, `p-2 sm:p-4`).
  3. Canvas border and viewport height constraint (`border-2 sm:border-4`, `max-h-[calc(100dvh-130px)] sm:max-h-none`, `aspect-[3/4]`, `object-contain`).
  4. Overhead badges alignment (`top-11 sm:top-14` for squadron HUD).

## Artifact Index
- `.agents/teamwork_preview_explorer_survey_viewport_1/DISPATCH.md` — Assignment dispatch and instructions
- `.agents/teamwork_preview_explorer_survey_viewport_1/BRIEFING.md` — Working memory and status
- `.agents/teamwork_preview_explorer_survey_viewport_1/progress.md` — Liveness and progress log
- `.agents/teamwork_preview_explorer_survey_viewport_1/handoff.md` — Final technical report for implementation

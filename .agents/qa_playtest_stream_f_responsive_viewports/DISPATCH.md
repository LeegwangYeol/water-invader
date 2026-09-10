# Dispatch: Stream F Responsive Viewports Challenger

## Working Directory
`/Users/user/src/water-invader/.agents/qa_playtest_stream_f_responsive_viewports`

## Role
Stream F Responsive Viewports Challenger (`teamwork_preview_challenger`)

## Required Reading
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/PROJECT.md`
- `/Users/user/src/water-invader/COLLABORATION.md`

## Mission
Stress-test responsive CSS layout and viewport constraints across device matrices:
1. Architectural Invariant:
   - Verify `logicalWidth = 600` and `logicalHeight = 800` in `GameManager.ts` are strictly unmodified.
   - Verify internal bitmap buffer is strictly `600 * dpr` by `800 * dpr`.
2. Device Viewport Matrix:
   - Mobile SE: 375 x 667
   - iPhone 14 / modern phone: 390 x 844
   - Tablet Portrait: 768 x 1024
   - Tablet Landscape / Desktop: 1024 x 1366 / 1920 x 1080
3. Responsive Invariants:
   - Aspect ratio remains strictly 0.75 (`3/4`).
   - Zero horizontal overflow (`document.documentElement.scrollWidth <= clientWidth + 1`).
   - Mobile touch controls wrapper (`[data-testid="mobile-controls-wrapper"]`) is placed outside and below the canvas, not overlapping gameplay area.
   - TopHUD, warning banners, and flagship UI overlays are perfectly contained within the canvas bounding box.
4. Monitor browser console for layout thrashing or overflow warnings.

## Deliverable
Write your verification report to `/Users/user/src/water-invader/.agents/qa_playtest_stream_f_responsive_viewports/handoff.md` and send a message back.

## 2026-09-10T10:44:57Z
You are qa_playtest_stream_f_responsive_viewports.
Your working directory is: /Users/user/src/water-invader/.agents/qa_playtest_stream_f_responsive_viewports
Read DISPATCH.md in your working directory first, along with ORIGINAL_REQUEST.md, PROJECT.md, and COLLABORATION.md.
Stress-test responsive CSS layout across mobile, tablet, and desktop viewports. Verify 600x800 logical canvas invariant, aspect ratio 0.75, zero horizontal overflow, and touch controls positioning.
Write complete report to /Users/user/src/water-invader/.agents/qa_playtest_stream_f_responsive_viewports/handoff.md.
Send message back when complete.

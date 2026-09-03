# Worker M2 Dispatch: Responsive Warning Backgrounds & Projectile Contrast (R2)
Fix mobile clipping by isolating canvas container in src/components/game-canvas.tsx.
Implement 3-layer draw in src/game/GameManager.ts.
Calibrate bullet outline layering in src/game/Bullet.ts for >= 7:1 contrast.
Create Playwright test tests/14_responsive_warning_background_and_contrast.spec.ts.
Files owned: src/components/game-canvas.tsx, src/game/Bullet.ts, src/game/GameManager.ts, tests/14_responsive_warning_background_and_contrast.spec.ts.

## 2026-09-03T01:01:11Z
Scope & Instructions:
1. Read /Users/user/src/water-invader/.agents/teamwork_preview_explorer_bg_1/report.md.
2. In src/components/game-canvas.tsx:
   - Decouple the canvas into an isolated `relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl` container.
   - Ensure MobileControls is positioned outside and below this canvas container.
   - Ensure warning overlays (crisis-warning-banner, endgame-crisis-warning-banner) are children of this container with `absolute inset-0`, so they never stretch below the canvas or clip on mobile viewports.
3. In src/game/GameManager.ts:
   - Restructure draw() into a 3-layer rendering pipeline:
     - Static Background Layer: crisis warning background fills, starfield, environmental tint (rendered without screen shake displacement so no unpainted gaps appear).
     - World Layer: save context, apply screen shake, render player, enemies, bullets, hazard pools, particles, restore context.
     - Stable Foreground Layer: perimeter warning hazard stripes/borders, HUD, notifications.
4. In src/game/Bullet.ts:
   - Reorder 4-tier projectile rendering so the 2.0px black armor rim is drawn on top of the outer bloom, ensuring bullets maintain >= 7:1 WCAG AAA contrast ratio even during red crisis warning shifts.
5. Create Playwright test tests/14_responsive_warning_background_and_contrast.spec.ts:
   - Test desktop (1280x800) and mobile (390x844, iPhone 12/13/14) viewports.
   - Verify warning overlay bounding box matches canvas exactly without overflowing into touch controls or off-screen.
   - Verify projectile contrast and color blending.
6. Run `npx tsc --noEmit` and `npx playwright test tests/14_responsive_warning_background_and_contrast.spec.ts`.
7. Document results in /Users/user/src/water-invader/.agents/teamwork_preview_worker_bg_m2/handoff.md and send completion message.

# BRIEFING — 2026-09-03T10:11:45+09:00

## Mission
Fix mobile clipping by isolating canvas container in src/components/game-canvas.tsx, implement 3-layer draw in src/game/GameManager.ts, calibrate bullet outline layering in src/game/Bullet.ts for >= 7:1 contrast, and write Playwright test suite in tests/14_responsive_warning_background_and_contrast.spec.ts.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_bg_m2
- Original parent: 2fc0aa56-06ce-4d85-a081-2b78baaba6a9
- Milestone: R2 (Responsive Warning Backgrounds & Projectile Contrast)

## 🔒 Key Constraints
- Files Owned Exclusively: src/components/game-canvas.tsx, src/game/Bullet.ts, src/game/GameManager.ts, tests/14_responsive_warning_background_and_contrast.spec.ts (DO NOT edit any other files)
- Decouple the canvas into an isolated `relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl` container.
- Ensure MobileControls is positioned outside and below this canvas container.
- Ensure warning overlays (crisis-warning-banner, endgame-crisis-warning-banner) are children of this container with `absolute inset-0`, so they never stretch below the canvas or clip on mobile viewports.
- Restructure GameManager.ts draw() into a 3-layer rendering pipeline (Static Background Layer, World Layer with shake, Stable Foreground Layer).
- Reorder Bullet.ts 4-tier projectile rendering so the 2.0px black armor rim is drawn on top of the outer bloom, ensuring bullets maintain >= 7:1 WCAG AAA contrast ratio even during red crisis warning shifts.
- Playwright tests must verify desktop (1280x800) and mobile (390x844), overlay bounding box matching canvas, projectile contrast and color blending.
- Pass `npx tsc --noEmit` and `npx playwright test tests/14_responsive_warning_background_and_contrast.spec.ts`.

## Current Parent
- Conversation ID: 2fc0aa56-06ce-4d85-a081-2b78baaba6a9
- Updated: 2026-09-03T10:11:45+09:00

## Task Summary
- **What to build**: Responsive canvas container, 3-layer render pipeline in GameManager, 4-tier bullet rendering order, and Playwright verification test.
- **Success criteria**: Zero clipping on mobile, seamless canvas warning fill, >= 7:1 bullet contrast, tests pass.
- **Interface contracts**: src/components/game-canvas.tsx, src/game/GameManager.ts, src/game/Bullet.ts, tests/14_responsive_warning_background_and_contrast.spec.ts.
- **Code layout**: Next.js App router, canvas components in src/components/, game logic in src/game/, tests in tests/.

## Change Tracker
- **Files modified**:
  - `src/components/game-canvas.tsx`: Decoupled canvas into an isolated `relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl bg-slate-900` container; moved MobileControls outside and below container; bound TopHUD, warning overlays, and badges inside container; hooked `resize()` to window resize/orientationchange.
  - `src/game/GameManager.ts`: Restructured `draw()` into 3 layers (Static Background Layer without shake, Shaking World Layer, Stable Foreground Layer); implemented `resize()` method to dynamically sync DPR and canvas buffer dimensions.
  - `src/game/Bullet.ts`: Reordered 4-tier projectile rendering with outer bloom drawn first and 2.0px black armor rim drawn on top of bloom, ensuring >= 7:1 contrast ratio against bright warning backgrounds.
  - `tests/14_responsive_warning_background_and_contrast.spec.ts`: Created comprehensive 11-test Playwright suite testing Desktop HD, iPhone 12/13/14, iPhone SE, iPad Mini viewport bounds alignment, corner pixel fill sampling, and projectile contrast metrics.
- **Build status**: PASS (npx tsc --noEmit: 0 errors; npx playwright test: 11/11 passed).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: PASS (11/11 tests passing in tests/14_responsive_warning_background_and_contrast.spec.ts; regression tests passing).
- **Lint status**: 0 errors.
- **Tests added/modified**: tests/14_responsive_warning_background_and_contrast.spec.ts.

## Loaded Skills
- None

## Key Decisions Made
- Container isolation: The canvas and its internal overlays are wrapped in an isolated aspect-ratio container with `overflow-hidden` and `border-4 border-blue-900`. MobileControls is placed below this container.
- 3-Layer pipeline: Environmental warning background fills and ambient vignettes are rendered in Layer 1 (Static Background) without screen shake translation, preventing edge gap letterboxing and guaranteeing full coverage.
- Outline priority: Drawing the 2.0px black outline over the atmospheric glow in Bullet.ts guarantees crisp edge definition and eliminates color bleeding between red projectiles and red event background tints.

## Artifact Index
- /Users/user/src/water-invader/.agents/teamwork_preview_worker_bg_m2/DISPATCH.md
- /Users/user/src/water-invader/.agents/teamwork_preview_worker_bg_m2/BRIEFING.md
- /Users/user/src/water-invader/.agents/teamwork_preview_worker_bg_m2/progress.md
- /Users/user/src/water-invader/.agents/teamwork_preview_worker_bg_m2/handoff.md

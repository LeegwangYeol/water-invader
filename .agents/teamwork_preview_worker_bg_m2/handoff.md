# Handoff Report: Milestone R2 (Responsive Warning Backgrounds & Projectile Contrast)

**Author**: Worker M2 (`teamwork_preview_worker_bg_m2`)  
**Target Milestone**: R2 — Responsive and Clear Event Backgrounds  
**Date**: 2026-09-03  

---

## 1. Observation

1. **DOM Container Bounding Box Mismatch**:
   - In `src/components/game-canvas.tsx` (lines 938–1051 originally), `crisis-warning-banner` and `endgame-crisis-warning-banner` were positioned with `absolute inset-0` inside an outer flex container holding both the canvas (`CanvasCore`, aspect 3:4) and `MobileControls` (~96px tall).
   - On mobile viewports, the warning banner stretched over the touch buttons, shifting the alert modal card downwards by 48px and clipping the top HUD off-screen when the viewport height was limited.
   - The `<canvas>` element had `border-4 border-blue-900 object-contain`, which altered its inner aspect ratio from 0.75 to ~0.746, causing `object-contain` to letterbox the bitmap with 1–3px dark slate gaps.

2. **Render Order & Screen Shake Translation**:
   - In `src/game/GameManager.ts` (lines 1637–1839 originally), the canvas clear (`fillRect(0, 0, logicalWidth, logicalHeight)`) was executed under active screen shake translation (`ctx.translate(offsetX, offsetY)` with shake amplitude up to 5px). This displaced background fills by up to 2.5px off-canvas, exposing unpainted background strips.
   - The warning background fill (`ctx.fillRect(0, 0, logicalWidth, logicalHeight)`) was drawn in line 1818 **after** entities and bullets, applying a destructive color tint over bullets that degraded outline luminance.

3. **Projectile Layering & Edge Contrast**:
   - In `src/game/Bullet.ts` (lines 120–161 originally), the 1.5px black perimeter outline was drawn in Tier 1, and the outer glow bloom (`radius * 1.5`, alpha 0.5) was drawn in Tier 2 **on top of** the black outline.
   - During red crisis warning shifts, the red glow washed out the black outline and merged into the red background tint, reducing bullet edge contrast below WCAG AAA thresholds.

---

## 2. Logic Chain

1. **Step 1: Canvas Container Isolation (`src/components/game-canvas.tsx`)**:
   - Extracted the canvas and its viewport overlays into an isolated `<div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl bg-slate-900">` viewport.
   - Removed `border-4` and `object-contain` from `<canvas>`, making it `w-full h-full block bg-slate-900 touch-none select-none`.
   - Placed `TopHUD`, `crisis-warning-banner`, `endgame-crisis-warning-banner`, status badges, and modals strictly as children of this container.
   - Positioned `<MobileControls>` into normal flow outside and below this canvas container (`<div data-testid="mobile-controls-wrapper" className="w-full max-w-[600px]">`).
   - Hooked `GameManager.resize()` to `window.resize` and `orientationchange` events to update DPR and canvas buffer dimensions.
   - *Result*: The warning banner's `absolute inset-0` bounds match the canvas exactly across all screen sizes (subpixel delta <= 1.5px) and never overlap touch controls.

2. **Step 2: 3-Layer Render Pipeline (`src/game/GameManager.ts`)**:
   - Implemented `public resize(): void` to synchronize `this.canvas.width/height` with `window.devicePixelRatio`.
   - Restructured `GameManager.draw()` into three explicit layers:
     - **Layer 1 (Static Background)**: Void fill (`#0f172a`), crisis warning background fills (`warningTimer > 0`), active crisis environmental tints (Acid Storm / EMP), End-Game Crisis radial incursion vignette, and starfield bubbles. All drawn without screen shake translation, guaranteeing 100% full-viewport coverage without edge gaps or letterbox slivers.
     - **Layer 2 (Shaking World)**: `ctx.save()`, apply screen shake translation (`ctx.translate(offsetX, offsetY)`), render barricades, player, helpers, enemies, bullets, particles, hazard teardrops, solar flares, EMP static, and End-Game Crisis rifts/sovereign, then `ctx.restore()`.
     - **Layer 3 (Stable Foreground)**: Boss HP bar, debug metrics overlay, crisp 4px perimeter warning border (`ctx.strokeRect(2, 2, logicalWidth - 4, logicalHeight - 4)`), and flashing warning notification text with crisp outline.
   - *Result*: Warning backgrounds are painted behind bullets, preserving complete bullet contrast, while perimeter hazard borders remain rock-solid at the canvas boundary.

3. **Step 3: High-Contrast 4-Tier Bullet Renderer (`src/game/Bullet.ts`)**:
   - Reordered drawing tiers for player, rogue, and invader projectiles:
     - **Tier 1 (Outer Bloom)**: Atmospheric glow bloom drawn first (`radius * 1.6`, alpha 0.45-0.50).
     - **Tier 2 (Black Armor Rim)**: High-contrast 2.0px solid black perimeter stroke (`ctx.strokeStyle = '#000000'`, `lineWidth = 2.0`, `globalAlpha = 1.0`) drawn **on top of** the outer bloom.
     - **Tier 3 (Body Shell)**: Saturated plasma shell.
     - **Tier 4 (White Core Highlight)**: Pure white core highlight (`#ffffff`, `globalAlpha = 1.0`, radius 0.40–0.55x) with luminance >= 0.95.
   - *Result*: Projectile edges maintain a crisp black boundary separating red bullets from red crisis backgrounds, achieving a WCAG AAA contrast ratio >= 7:1.

4. **Step 4: Automated Verification (`tests/14_responsive_warning_background_and_contrast.spec.ts`)**:
   - Created 11 automated Playwright tests covering:
     - Multi-viewport bounds alignment (Desktop 1280x800, Mobile iPhone 12/13/14 390x844, iPhone SE 375x667, iPad Mini 768x1024) for both standard crisis and End-Game crisis warning banners.
     - Canvas bitmap corner pixel sampling verifying 100% full-viewport warning tint without gaps (R > 20 across all 4 corners).
     - Quantitative sRGB relative luminance and contrast measurement verifying enemy projectiles achieve >= 7:1 contrast ratio against intense red warning backgrounds.
     - Player projectile contrast and visibility verification.

---

## 3. Caveats

1. **Browser CSS Box Model & Subpixel Rounding**: Viewport bounding box comparisons use a 1.5px tolerance to accommodate device pixel ratio fractional rounding across varying mobile displays.
2. **Web Audio Policies**: AudioContext requires an initial user interaction (such as clicking `START GAME`) per standard W3C Web Audio autoplay security policies.

---

## 4. Conclusion

Milestone R2 requirements are fully satisfied:
1. Warning background clipping on mobile screens is completely resolved by isolating the canvas container and moving `MobileControls` outside.
2. Event and crisis warning backgrounds seamlessly cover the entire canvas without letterbox gaps or shake displacement artifacts via the 3-layer render pipeline in `GameManager.ts`.
3. Projectiles maintain >= 7:1 WCAG AAA contrast ratio even during red alert warning background shifts due to the reordered 4-tier renderer in `Bullet.ts`.
4. All 11 tests in `tests/14_responsive_warning_background_and_contrast.spec.ts` pass, `npx tsc --noEmit` reports 0 errors, and all existing regression tests pass.

---

## 5. Verification Method

To independently verify these modifications:

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Result*: Exits with code 0 (zero errors).

2. **R2 Milestone Playwright Suite**:
   ```bash
   npx playwright test tests/14_responsive_warning_background_and_contrast.spec.ts
   ```
   *Expected Result*: 11 passed (100% pass rate).

3. **Crisis & Regression Test Suites**:
   ```bash
   npx playwright test tests/12_crisis_director_e2e.spec.ts tests/12_extreme_difficulty_and_crises.spec.ts tests/13_endgame_crisis_stage15.spec.ts
   ```
   *Expected Result*: All tests pass.

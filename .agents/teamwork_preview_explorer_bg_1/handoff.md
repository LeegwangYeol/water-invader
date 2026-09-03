# Handoff Report: Responsive Warning Backgrounds & Projectile Contrast

**Agent**: Explorer 2 (`teamwork_preview_explorer_bg_1`)  
**Date**: 2026-09-03  
**Status**: Complete (Hard Handoff)  
**Report Artifact**: `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_bg_1/report.md`  

---

## 1. Observation

1. **DOM Hierarchy and Bounding Box Mismatch**:
   - In `src/components/game-canvas.tsx`:
     - Line 939: Outer container is `<div className="relative flex flex-col items-center justify-center w-full max-w-[800px] mx-auto">`.
     - Lines 957–962: `<CanvasCore>` is mounted directly inside the outer container.
     - Lines 968 & 1006: Warning overlays `[data-testid="endgame-crisis-warning-banner"]` and `[data-testid="crisis-warning-banner"]` use `className="absolute inset-0 ..."`.
     - Lines 1043–1050: `<MobileControls>` is mounted directly inside the outer container below `CanvasCore` when `gameState === GameState.PLAYING`.
   - Measurement: `CanvasCore` has `aspect-[3/4]`, while `MobileControls` has height ~96px. Because the outer container has `relative`, `inset-0` spans `CanvasCore` + `MobileControls`. The overlay height is $H_{\text{canvas}} + 96\text{px}$, displacing the centered modal card downwards by 48px and extending warning tint across touch buttons.

2. **Replaced Element Subpixel Letterboxing**:
   - In `src/components/game-canvas.tsx` (lines 208–219):
     ```tsx
     <div className="w-full aspect-[3/4]">
       <canvas className="w-full h-full border-4 border-blue-900 rounded-lg shadow-2xl bg-slate-900 touch-none object-contain select-none" />
     </div>
     ```
   - The outer wrapper has an exact 3:4 aspect ratio (0.75). The inner content box after `border-4` (8px reduction on width and height) has an aspect ratio of $(W - 8) / (H - 8) \approx 0.7458$. `object-contain` letterboxes the $600 \times 800$ canvas bitmap, leaving a 1–3px unpainted gap displaying `bg-slate-900` at the borders.

3. **Background Fill Rendered Under Screen-Shake Translation**:
   - In `src/game/GameManager.ts`:
     - Lines 1642–1650:
       ```ts
       if (this.shakeTimer > 0) {
         let shakeAmount = 2;
         if (this.warningTimer > 0) shakeAmount = 5;
         const offsetX = (Math.random() - 0.5) * shakeAmount;
         const offsetY = (Math.random() - 0.5) * shakeAmount;
         this.ctx.translate(offsetX, offsetY);
       }
       ```
     - Lines 1815–1824: Warning background fill (`fillRect(0, 0, this.logicalWidth, this.logicalHeight)`) and perimeter stroke (`strokeRect(2, 2, this.logicalWidth - 4, this.logicalHeight - 4)`) are called inside the translated coordinate space before `this.ctx.restore()` at line 1839.
     - Translation shifts the background up to $\pm 2.5\text{px}$, causing perimeter edges to shake off-screen and leave unpainted gaps on opposite sides.

4. **Layer Inversion Obscuring Projectiles**:
   - In `src/game/GameManager.ts`:
     - Line 1676: Bullets are drawn (`this.bullets.forEach(b => b.draw(this.ctx))`).
     - Line 1784: `this.endGameCrisis.draw(...)` calls `drawIncursionWarningBanner` which draws a 90% opaque dark slate box (`rgba(15, 23, 42, 0.9)`, 90px height) at $y = 355 \text{ to } 445$ **on top of bullets**.
     - Line 1818: `this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight)` draws a warning color fill **on top of bullets**.

5. **Bullet Outline Occluded by Outer Glow**:
   - In `src/game/Bullet.ts`:
     - Lines 129–133: Black perimeter outline is drawn at $radius + 1.5\text{px}$ (Tier 1).
     - Lines 136–140: Outer Glow is filled at $radius \times 1.5\text{px}$ with `globalAlpha = 0.5` (Tier 2). For a 10px bullet ($radius = 5$), Tier 2 fills at radius $7.5\text{px}$, directly painting over the Tier 1 black stroke at radius $6.5\text{px}$.

---

## 2. Logic Chain

1. **Step 1 (Mobile Clipping Root Cause)**:
   - Observation 1 proves that `crisis-warning-banner` and `endgame-crisis-warning-banner` are anchored to an outer flex container whose height includes `MobileControls`.
   - On mobile viewports with limited vertical height, the combined element height ($681\text{px}$) exceeds screen height ($667\text{px}$). Flexbox `justify-center` on `<main>` pushes the top edge off-screen, while `inset-0` stretches past the canvas onto mobile controls.
   - Therefore, the canvas viewport must be isolated in its own dedicated `<div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden ...">` container, with all canvas overlays nested inside it, and `MobileControls` placed strictly outside in normal flow.

2. **Step 2 (Seamless Edge Fill & Letterbox Elimination)**:
   - Observation 2 proves that `border-4` on `<canvas>` combined with `object-contain` causes the browser to letterbox the bitmap by 1–3px.
   - Removing `border-4` and `object-contain` from `<canvas>` and placing the decorative border on the viewport wrapper guarantees that the canvas bitmap fills 100% of the viewport container without letterboxing.
   - Observation 3 proves that screen shake translates the canvas fill away from $(0, 0)$. Moving the fullscreen background clear and warning fill to **Layer 1** (before shake translation) guarantees seamless $600 \times 800$ coverage without edge shaking or clipping.

3. **Step 3 (Projectile Visibility & Contrast Calibration)**:
   - Observation 4 proves that warning backgrounds are currently rendered as foreground color filters on top of bullets, reducing black outline luminance contrast from $21:1$ to $\approx 6:1$.
   - Observation 5 proves that `Bullet.ts` draws outer glow over its black outline, washing it out.
   - Moving event background fills to Layer 1 (behind entities and bullets) preserves 100% of projectile luminance.
   - Reordering tiers in `Bullet.ts` (Bloom $\rightarrow$ 2.0px Black Outline $\rightarrow$ Saturated Shell $\rightarrow$ 0.5x Solid White Core) ensures bullet edge contrast remains $\ge 7:1$ (WCAG AAA) across all background shifts.

---

## 3. Caveats

- **No Code Modified Directly**: In accordance with the Explorer role and the global rule "Read-only investigation — do NOT implement", no source files in `src/` have been modified.
- **Audio Context**: Sound alarm triggers (`playCrisisAlarm`, `playCrisisCataclysmSiren`) function correctly and do not interfere with visual rendering.
- **Cheats / Developer Tools**: F3 debug overlay rendering was inspected and is unaffected by the proposed background changes.

---

## 4. Conclusion

The mobile background clipping and projectile contrast degradation are completely understood and mathematically diagnosed.
The remedy requires three coordinated changes:
1. **DOM Refactoring (`game-canvas.tsx`)**: Decouple the canvas viewport into a dedicated `<div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 ...">` container. Nest all viewport overlays inside it, and place `MobileControls` below it.
2. **Pipeline Refactoring (`GameManager.ts`)**: Draw background warning tints in Layer 1 (before screen shake and before entity drawing). Move Boss HP bars and perimeter stroke to Layer 3 (foreground). Add `resize()` method to maintain DPR synchronization.
3. **Bullet Renderer Calibration (`Bullet.ts`)**: Reorder drawing tiers so the 2.0px perimeter outline is painted after the ambient glow, with an intensified white core ($radius \times 0.5$).

---

## 5. Verification Method

To independently verify these findings and validate the forthcoming implementation:

1. **Inspect Layout and Render Order**:
   - View `src/components/game-canvas.tsx` lines 939–1050 to confirm outer container wrapping both canvas and mobile controls.
   - View `src/game/GameManager.ts` lines 1642–1839 to confirm shake translation and overlay drawing after bullets.
   - View `src/game/Bullet.ts` lines 129–140 to confirm Tier 2 glow drawing over Tier 1 stroke.

2. **Automated Playwright Suite Execution**:
   Run existing regression and visual tests:
   ```bash
   npx playwright test tests/01_ui_and_controls.spec.ts tests/02_rendering_and_vector_art.spec.ts tests/adversarial_challenger_m3_1.spec.ts
   ```

3. **New Playwright Viewport & Contrast Test Suite**:
   Create and execute `tests/14_responsive_warning_background_and_contrast.spec.ts` (as detailed in `report.md`) verifying:
   - Warning banner bounding box matches canvas bounding box within 1.5px across 6 responsive viewports (375x667, 390x844, 412x915, 768x1024, 1280x800, 667x375).
   - Warning banner does not overlap mobile controls.
   - Canvas corner sampling confirms full-frame warning tint with zero letterbox gaps.
   - Canvas pixel contrast measurement verifies enemy projectile core contrast ratio $\ge 7:1$.

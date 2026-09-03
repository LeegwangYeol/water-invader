# Exhaustive Responsive UI, Canvas Scaling & Mobile Controls Investigation Report

**Agent**: `bughunt_exp_ui_responsive_2`  
**Mission**: Deep investigation of UI layout, canvas scaling, mobile touch controls, overlay z-index stacking, and projectile visibility under crisis backgrounds.  
**Timestamp**: 2026-09-03T05:45:00Z  
**Target Repository**: `/Users/user/src/water-invader`

---

## 1. Observation

### 1.1 Architecture & Component Distribution
- **Component Colocation**: `src/components/game-canvas.tsx` houses not only the master `GameCanvas` component (lines 524–1113), but also all associated UI sub-components:
  - `ShopUpgradePanel` (lines 24–104)
  - `TopHUD` (lines 121–193)
  - `CanvasCore` (lines 202–218)
  - `MobileControls` (lines 227–268)
  - `MenuOverlay` (lines 279–328)
  - `ManualModal` (lines 334–393)
  - `ShopModal` (lines 409–455)
  - `GameOverModal` (lines 472–518)
- Standalone files `src/components/mobile-controls.tsx` and `src/components/game-overlay.tsx` do not exist as independent files on disk; their functionality is entirely consolidated into `src/components/game-canvas.tsx`.

### 1.2 Canvas Container & Viewport Scaling
- **Container Definition** (`src/components/game-canvas.tsx`, lines 942–944):
  ```tsx
  <div className="relative flex flex-col items-center justify-center w-full max-w-[800px] mx-auto">
    <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl bg-slate-900">
      <CanvasCore ... />
  ```
- **Internal Resolution vs Logical Coordinates** (`src/game/GameManager.ts`, lines 77–78, 95–97, 107–117):
  - `logicalWidth = 600`, `logicalHeight = 800` (exact 3:4 aspect ratio: $600 / 800 = 0.75$).
  - `this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;`
  - Bitmap resolution: `canvas.width = Math.round(this.logicalWidth * this.dpr); canvas.height = Math.round(this.logicalHeight * this.dpr);`
  - Render transform: `this.ctx.scale(this.dpr, this.dpr)` on line 1694.
- **Empirical Measurements Across Target Viewports** (from `tests/bughunt_ui_responsive_viewports.spec.ts` 25/25 passed):
  - **Mobile SE (375x667, DPR 2.0)**:
    - Canvas DOM box: $335 \times 448.65\text{px}$ (Aspect ratio: $0.7466 \approx 0.75$).
    - Internal bitmap: $1200 \times 1600\text{px}$.
    - Horizontal scroll/overflow: $0\text{px}$ (`scrollWidth === clientWidth === 375`).
  - **Mobile Modern (390x844, DPR 3.0)**:
    - Canvas DOM box: $350 \times 468.65\text{px}$ (Aspect ratio: $0.7468 \approx 0.75$).
    - Internal bitmap: $1800 \times 2400\text{px}$.
    - Horizontal scroll/overflow: $0\text{px}$ (`scrollWidth === clientWidth === 390`).
  - **Mobile Tall (412x915, DPR 3.5)**:
    - Canvas DOM box: $372 \times 498.66\text{px}$ (Aspect ratio: $0.7460 \approx 0.75$).
    - Internal bitmap: $2100 \times 2800\text{px}$.
    - Horizontal scroll/overflow: $0\text{px}$ (`scrollWidth === clientWidth === 412`).
  - **Desktop Standard (1440x900, DPR 1.0)**:
    - Canvas DOM box: $592 \times 792\text{px}$ ($600 \times 800$ minus 8px border-box: $592/792 = 0.7475$).
    - Internal bitmap: $600 \times 800\text{px}$.
    - Horizontal scroll/overflow: $0\text{px}$.
  - **Desktop Wide (1920x1080, DPR 1.0)**:
    - Canvas DOM box: $592 \times 792\text{px}$ ($592/792 = 0.7475$).
    - Internal bitmap: $600 \times 800\text{px}$.
    - Horizontal scroll/overflow: $0\text{px}$.

### 1.3 Mobile Controls & Touch Event Architecture
- **Touch Action Suppression** (`src/components/game-canvas.tsx`):
  - Line 215: `<canvas ... className="w-full h-full block bg-slate-900 touch-none select-none" />`
  - Line 234: `<div className="w-full flex justify-between p-4 mt-2 gap-2 sm:gap-4 touch-none">`
  - Line 238, 247, 257: Buttons specify `pointer-events-auto touch-none select-none`.
- **Pointer Capture & Drag Normalization** (`src/components/game-canvas.tsx`, lines 809–925):
  - `scaleX = logicalWidth / contentWidth` where `contentWidth = canvas.clientWidth`.
  - In drag mode: `deltaLogicalX = (e.clientX - lastPointerX) * scaleX`.
  - Clamping: `player.position.x = Math.max(0, Math.min(logicalWidth - player.size.width, newX))`.
  - Active pointer isolation: `activePointerIdRef.current = e.pointerId;` ignores secondary touches on canvas, avoiding teleportation or jump artifacts during multi-touch gestures.
  - Event suppression on buttons (lines 927–939): `handleTouchStart` and `handleTouchEnd` call both `e.preventDefault()` and `e.stopPropagation()`.
  - Boundary clearance: Mobile controls wrapper is rendered *below* the canvas (`mt-2`) and never overlaps player coordinates at the bottom of the canvas (minimum vertical clearance: $37.7\text{px}$ on SE, up to $63.4\text{px}$ on desktop).

### 1.4 Z-Index Stacking, Badges & Overlays
- **Stacking Context Breakdown**:
  - `CanvasCore`: base (unindexed, DOM order 0).
  - `MenuOverlay`: `z-20` (line 288).
  - `ShopModal`: `z-20` (line 425).
  - `GameOverModal`: `z-20` (line 489).
  - `TopHUD`: `z-30` (line 138), with child mute button `z-30` (line 172).
  - `ManualModal`: `z-30` (line 338).
  - `[data-testid="endgame-crisis-warning-banner"]`: `z-30` (line 973).
  - `[data-testid="endgame-crisis-active-badge"]`: `z-30` (line 993).
  - `[data-testid="crisis-warning-banner"]`: `z-30` (line 1011).
  - `[data-testid="emp-suppression-badge"]`: `z-30` (line 1031).
  - `[data-testid="acid-storm-badge"]`: `z-30` (line 1041).
- **Z-Index Anomaly**:
  - Because `TopHUD` is permanently mounted at `z-30` (line 954) while `MenuOverlay`, `ShopModal`, and `GameOverModal` are at `z-20`, `TopHUD` elements (Score, Pure Water, HP droplets, Mute button) render *in front of* the modal's backdrop overlay.
  - Pointer events in `TopHUD` have `pointer-events-none` on the outer container, which allows clicks to pass through to modal buttons except when directly clicking the Mute button.
- **Badge Position Overlap at `top-20`**:
  - Three distinct badges share the exact same CSS coordinates: `absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-30`:
    1. `endgame-crisis-active-badge` (line 993)
    2. `emp-suppression-badge` (line 1031)
    3. `acid-storm-badge` (line 1041)
  - If EMP or Acid Storm is active during an End-Game Crisis encounter, these badges render atop one another at identical offsets.

### 1.5 3-Layer Canvas Rendering & Projectile High-Contrast Geometry
- **3-Layer Pipeline** (`src/game/GameManager.ts`, lines 1692–1958):
  - **Layer 1 (Static Background)**: Void `#0f172a`, low-opacity crisis fills (`rgba(239, 68, 68, 0.12)`, `rgba(132, 204, 22, 0.12)`, `rgba(34, 197, 94, 0.10)`), radial vignette, starfield. Rendered *without* screen shake so no unpainted viewport border seams appear.
  - **Layer 2 (World Layer)**: Translates with `shakeTimer`. Renders barricades, player, helpers, enemies, hazard projectiles, solar flares, and bullets.
  - **Layer 3 (Foreground Layer)**: Stable perimeter hazard stroke (`lineWidth = 4`, `strokeRect(2, 2, logicalWidth - 4, logicalHeight - 4)`), warning text outline (`strokeText` + `fillText`), Boss HP bar, and Allied Reinforcements announcement banner.
- **Bullet 4-Tier High-Contrast Geometry** (`src/game/Bullet.ts`, lines 39–163):
  - **Tier 1**: Outer atmospheric bloom (`ctx.globalAlpha = 0.45`).
  - **Tier 2**: 2.0px Solid Black Armor Rim (`ctx.strokeStyle = '#000000'`, `ctx.lineWidth = 2.0`, `ctx.globalAlpha = 1.0`) drawn on top of the outer bloom.
  - **Tier 3**: High-saturation colored shell (Cyan `#00e5ff` for player, Lime `#84cc16` for rogue, Crimson `#ef4444` for invader).
  - **Tier 4**: Solid Pure White Core Highlight (`#ffffff`, luminance = 1.0) with radius up to $0.55 \times r$.
- **Empirical Contrast Verification** (`tests/14_responsive_warning_background_and_contrast.spec.ts`, 11/11 passed):
  - Core luminance: $\ge 0.95$ (RGB values $\ge 230$).
  - Black armor rim luminance: $< 0.15$.
  - Measured relative contrast against tinted crisis warning backgrounds: **$\ge 7.0:1$** (meets and exceeds the **WCAG AAA** visual accessibility threshold).

### 1.6 External Build Discrepancy Note
- Running `npx tsc --noEmit` on the full repo revealed a pre-existing TypeScript compilation issue in another agent's test file:
  - `tests/stress/challenger_audio_perf_stress.spec.ts(203,11): error TS2451: Cannot redeclare block-scoped variable 'isStrictlyCapped'`.
  - `tests/stress/challenger_audio_perf_stress.spec.ts(213,43): error TS2339: Property 'postExplosionParticleCount' does not exist on type...`.
  - Note: Source files in `src/**` are unaffected and valid.

---

## 2. Logic Chain

1. **Aspect Ratio Preservation Across Viewports**:
   - `logicalWidth` (600) and `logicalHeight` (800) dictate an intrinsic aspect ratio of $600 / 800 = 0.75$.
   - The DOM container specifies Tailwind `aspect-[3/4]`, which resolves via modern CSS `aspect-ratio: 3 / 4`.
   - On compact viewports (e.g. 375px wide), horizontal margins ($16\text{px} \times 2 = 32\text{px}$) yield a 343px wide container. The container height automatically calculates as $343 \times \frac{4}{3} = 457.33\text{px}$.
   - The 4px CSS border on all sides results in a canvas content-box width of $335\text{px}$ and height of $448.65\text{px}$ ($335 / 448.65 = 0.7466$, within subpixel parity).
   - In `GameManager.resize()`, `canvas.width = Math.round(600 * dpr)` and `canvas.height = Math.round(800 * dpr)` preserves the exact 3:4 pixel buffer ratio on any high-DPI display ($2.0\times, 3.0\times, 3.5\times$).
   - Therefore, no stretching, distortion, or aspect ratio drift occurs on any mobile or desktop screen.

2. **Touch Control Responsiveness & Gesture Prevention**:
   - Applying `touch-none` to both `<canvas>` and `.w-full.touch-none` controls wrapper maps to `touch-action: none`.
   - Because `handleCanvasPointerDown` executes `e.preventDefault()` and acquires pointer capture, browser-level gestures (iOS swipe-back, Android pull-to-refresh, double-tap zoom) cannot intercept touch drags.
   - The mathematical mapping `(clientX - (rect.left + clientLeft)) * (600 / clientWidth)` guarantees that 1 CSS pixel of finger movement corresponds to exactly $600 / \text{clientWidth}$ logical units, ensuring linear 1:1 tactile tracking regardless of physical device width.
   - `handleTouchStart` on mobile buttons calls both `preventDefault()` and `stopPropagation()`, eliminating ghost clicks or focus loss during high-APM combat.

3. **Overlay Clipping & Z-Index Dynamics**:
   - `ShopModal`, `GameOverModal`, and `ManualModal` all incorporate vertical scroll containers (`overflow-y-auto max-h-[98%]`), ensuring that even with 5 upgrade tiers and Acid Shield descriptions, all buttons remain accessible on compact screens down to 375x667.
   - However, `MenuOverlay` lacks `overflow-y-auto`. While it fits within 375x667 portrait mode (content height $\sim 374\text{px} < 448\text{px}$ container), in landscape orientation or with enlarged system accessibility fonts, items risk being cut off by the canvas container's `overflow-hidden`.
   - The z-index hierarchy (`TopHUD` at `z-30` vs `ShopModal`/`GameOverModal` at `z-20`) causes the in-game HUD to remain visible in the background/foreground during modal pauses. While `pointer-events-none` prevents blocking shop button clicks, the visual overlap represents an architectural inelegance.
   - The triple collision at `top-20` for crisis badges (`endgame-crisis-active-badge`, `emp-suppression-badge`, `acid-storm-badge`) leads to text overlap if multiple status effects are active simultaneously.

4. **Projectile Contrast Under Crisis Conditions**:
   - Background fills in Layer 1 are capped at low opacities ($\le 0.12$).
   - By rendering background tints strictly in Layer 1 *before* world entities in Layer 2, bullets are never occluded by tint passes.
   - The 4-tier bullet design introduces a 2.0px `#000000` rim followed by a `#ffffff` core. Even when the background is tinted intense red (`#ef4444` at 12%), the black rim guarantees an optical separation boundary, and the white core guarantees a WCAG contrast ratio $> 7:1$.

---

## 3. Caveats

1. **Root Viewport Meta Tag**: `src/app/layout.tsx` does not declare `export const viewport: Viewport = { ... }`. Although the `<canvas>` element and mobile controls have `touch-none`, user interactions touching the surrounding page margin (`<main>` background, header title) can still trigger browser-level pinch-zoom or double-tap zoom on iOS Safari and Android Chrome.
2. **`MenuOverlay` Landscape Viewport Limitation**: If a user rotates a mobile device to landscape (e.g. 667x375), the canvas height becomes $\sim 250\text{px}$. Because `MenuOverlay` lacks `overflow-y-auto`, the "ARMORY / SHOP", "HOW TO PLAY", and "INSTALL APP" buttons will overflow the canvas height and be clipped by `overflow-hidden`.
3. **Simultaneous Badge Stacking**: If an End-Game Crisis occurs alongside an environmental EMP or Acid Storm, all three badges claim `top-20 left-1/2 -translate-x-1/2 z-30`, obscuring each other's text.
4. **Peer Agent TypeScript Error**: As noted in Observation 1.6, `tests/stress/challenger_audio_perf_stress.spec.ts` contains redeclared variables and missing property accesses. While outside the UI domain, it causes repository-wide `tsc --noEmit` to exit with code 1.

---

## 4. Conclusion

1. **Aspect Ratio & Canvas Scaling**: **EXCELLENT**. The `aspect-[3/4]` container coupled with `GameManager.resize()` dynamic DPR scaling maintains strict aspect ratio parity across all mobile (375x667, 390x844, 412x915) and desktop (1440x900, 1920x1080) viewports with $0\text{px}$ horizontal overflow.
2. **Touch Controls & Gesture Isolation**: **ROBUST**. Touch event handling (`touch-none`, `setPointerCapture`, `preventDefault`, `stopPropagation`) prevents pull-to-refresh and pinch-zoom on game elements. Delta dragging is accurately mapped 1:1.
3. **Z-Index & Modal Readability**: **FUNCTIONAL BUT REFINABLE**.
   - Text is legible down to 375x667.
   - Modals have functional vertical scrolling.
   - **Recommended Future Enhancements**:
     - Wrap status badges at `top-20` in a vertical flex column (`flex flex-col items-center gap-1.5`) to prevent collision.
     - Hide `TopHUD` when `gameState !== GameState.PLAYING` or raise modal z-indices to `z-40`.
     - Add `overflow-y-auto` to `MenuOverlay`.
     - Add `user-scalable=no, maximum-scale=1` to page viewport configuration.
4. **Bullet & Hazard Visibility**: **EXEMPLARY**. The 4-tier projectile design with 2.0px black armor rim and white core achieves $\ge 7.0:1$ WCAG AAA contrast against all crisis background fills.

---

## 5. Verification Method

To independently verify all findings and reproduce metrics:

1. **Responsive Viewports Audit (25 Tests across 5 Viewports)**:
   ```bash
   npx playwright test tests/bughunt_ui_responsive_viewports.spec.ts
   ```
   *Expected Result*: 25 passed. Validates canvas bounding box aspect ratio ($0.746 \sim 0.748$), zero horizontal scroll, mobile controls clearance below canvas, warning banner containment, and HUD spacing.

2. **Responsive Warning Background & Contrast Audit (11 Tests)**:
   ```bash
   npx playwright test tests/14_responsive_warning_background_and_contrast.spec.ts
   ```
   *Expected Result*: 11 passed. Validates canvas 4-corner warning fill without gaps, enemy projectile contrast ratio ($\ge 7:1$), player projectile contrast, and warning banner containment.

3. **Mobile Touch & Drag Evasion Controls (10 Tests)**:
   ```bash
   npx playwright test tests/mobile_controls_and_touch_evasion.spec.ts
   ```
   *Expected Result*: 10 passed. Validates 1:1 delta drag, boundary clamping [0, 550], stationary touch zero-drift, multi-touch pointer isolation, and button non-interference.

4. **UI & Control Baseline (4 Tests)**:
   ```bash
   npx playwright test tests/01_ui_and_controls.spec.ts
   ```
   *Expected Result*: 4 passed. Validates canvas load, modal operations, HUD updates, and currency binding.

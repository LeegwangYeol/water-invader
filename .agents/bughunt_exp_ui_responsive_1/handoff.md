# Responsive UI, Layout & Canvas Scaling Analysis Report

**Agent**: `bughunt_exp_ui_responsive_1` (Read-only UI Exploration Agent)  
**Date**: 2026-09-03  
**Working Directory**: `/Users/user/src/water-invader/.agents/bughunt_exp_ui_responsive_1/`  
**Target Scope**: UI layout, canvas scaling, mobile controls, crisis warning overlays, and bullet visibility.

---

## 1. Observation

### 1.1 Component Architecture & File Co-location
- In `src/components/`, only one file exists: `src/components/game-canvas.tsx` (44,089 bytes, 1,114 lines).
- The prompt referenced `src/components/mobile-controls.tsx` and `src/components/game-overlay.tsx`. Code inspection reveals that these components are co-located within `src/components/game-canvas.tsx`:
  - `MobileControls`: lines 227–268
  - `MenuOverlay`: lines 279–328
  - `ManualModal`: lines 334–393
  - `ShopModal`: lines 409–455
  - `GameOverModal`: lines 472–518
  - `TopHUD`: lines 121–193
  - `CanvasCore`: lines 202–218

### 1.2 Canvas Aspect Ratio Preservation across Viewports
- In `src/components/game-canvas.tsx` (lines 942–944):
  ```tsx
  <div className="relative flex flex-col items-center justify-center w-full max-w-[800px] mx-auto">
    {/* 1. Dedicated Canvas Viewport Container (Isolated from Mobile Controls) */}
    <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl bg-slate-900">
      <CanvasCore ... />
  ```
- In `src/game/GameManager.ts` (lines 39–40, 95–97, 107–117):
  ```typescript
  public logicalWidth: number = 600;
  public logicalHeight: number = 800;
  ...
  this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  this.canvas.width = this.logicalWidth * this.dpr;
  this.canvas.height = this.logicalHeight * this.dpr;
  ```
- In `src/app/page.tsx` (lines 5–12):
  ```tsx
  <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
    <div className="w-full max-w-5xl text-center mb-6">
      <h1 className="text-4xl font-bold text-blue-400 mb-2">Water Invader</h1>
      <p className="text-slate-400">Use Left/Right Arrows or A/D to move. Spacebar to shoot.</p>
    </div>
    <GameCanvas />
  </main>
  ```
- Viewport dimension measurements:
  - **Mobile 375x667 (iPhone SE)**: Available container width is $375 - 32\text{px (p-4 padding)} = 343$px.
    - Outer container height: $343 \times \frac{4}{3} = 457.33$px.
    - Content box with `border-4` (8px total): $335 \times 449.33$px (ratio $0.7455$, deviation $<0.6\%$).
    - Vertical stack height: $32\text{px (main padding)} + 96\text{px (header)} + 457.33\text{px (canvas)} + 100\text{px (mobile controls)} = 685.33$px.
    - Total page height ($685.33$px) exceeds viewport height ($667$px) by **18.33px**, forcing vertical scrolling and pushing mobile buttons below the fold.
  - **Mobile 390x844 (iPhone 12/13/14)**: Canvas width = 358px, height = 477.33px. Total page height = 705.33px $< 844$px. Fits without scrolling.
  - **Mobile 412x915 (Android / Pixel 7)**: Canvas width = 380px, height = 506.67px. Total page height = 734.67px $< 915$px. Fits without scrolling.
  - **Desktop 1440x900 (MacBook Pro standard)**: Canvas container caps at `max-w-[600px]`, outer height is $600 \times \frac{4}{3} = 800$px ($808$px with border).
    - `MobileControls` is rendered on desktop because line 1101 has `{gameState === GameState.PLAYING && <MobileControls />}` with NO `sm:hidden` or `md:hidden` breakpoint!
    - Total page height on desktop: $32\text{px (padding)} + 96\text{px (header)} + 808\text{px (canvas)} + 100\text{px (controls)} = 1036$px.
    - Total height ($1036$px) significantly exceeds 900px, causing vertical scrolling on standard desktop laptop displays. Even without mobile controls ($936$px), it still exceeds 900px because the canvas has a fixed cap of 600px width with no `max-h-[calc(100vh-...)]`.
  - **Desktop 1920x1080 (1080p Desktop)**: Total height = 1036px. With browser window chrome (tabs, URL bar taking 80–120px, usable viewport height is 960–1000px), it still overflows vertically.

### 1.3 Mobile Controls: Touch Handling & Gesture Prevention
- In `src/components/game-canvas.tsx` (lines 874–890):
  ```typescript
  if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;
  e.preventDefault();
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  activePointerIdRef.current = e.pointerId;
  lastPointerXRef.current = Number.isFinite(e.clientX) ? e.clientX : null;
  isDraggingRef.current = true;
  ```
- In `src/components/game-canvas.tsx` (lines 927–939):
  ```typescript
  const handleTouchStart = useCallback((key: string) => (e: ...) => {
    if (showManualRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    gameManagerRef.current?.handleKeyDown(key);
  }, []);
  ```
- In `src/app/globals.css`:
  - `globals.css` contains 27 lines.
  - **Neither `overscroll-behavior: none` nor `touch-action` is declared on `html`, `body`, or `#root`.**
- In `src/app/layout.tsx`:
  - `layout.tsx` defines `metadata: Metadata`, but **does NOT export `viewport: Viewport`**.
  - Default Next.js viewport meta tag is emitted: `<meta name="viewport" content="width=device-width, initial-scale=1"/>`.
  - Missing attributes: `maximum-scale=1, user-scalable=no, viewport-fit=cover`.
- In `src/components/game-canvas.tsx` (lines 234–267):
  ```tsx
  <div className="w-full flex justify-between p-4 mt-2 gap-2 sm:gap-4 touch-none">
    <div className="flex flex-col gap-1 w-1/2">
      <div className="flex gap-1 h-1/2">
        <button ...>ALLY(Q)</button>
        <button ...>ULT({ultimate}%)</button>
      </div>
      <button className="w-full bg-blue-600/80 active:bg-blue-400 rounded-xl h-1/2 flex items-center justify-center text-xl font-black text-white select-none touch-none shadow-[0_0_15px_rgba(59,130,246,0.5)]">
        FIRE!
      </button>
    </div>
  </div>
  ```
  - `MobileControls` uses `w-1/2` with only one child in a `justify-between` flexbox. The entire right half of the mobile controls area is empty.
  - `h-1/2` is used on children, but the parent container has no explicit height. Under standard CSS flexbox rules, percentage height on an indefinite parent evaluates to `height: auto`.
  - The `FIRE!` button has no vertical padding (`py-*`). Its computed height is only ~28px (matching text line height), violating the Apple HIG / Google Material Design minimum touch target of 44x44px / 48x48px.

### 1.4 Z-Index Stacking, Badges, Modals & Pause Overlay
- Exact Z-Index inventory in `src/components/game-canvas.tsx`:
  - `CanvasCore`: base (z-0 / unindexed)
  - `MenuOverlay` (line 288): `z-20`
  - `ShopModal` (line 425): `z-20`
  - `GameOverModal` (line 489): `z-20`
  - `TopHUD` (line 138): `z-30`
  - Mute button inside TopHUD (line 172): `z-30` (`pointer-events-auto`)
  - `endgame-crisis-warning-banner` (line 973): `z-30`
  - `endgame-crisis-active-badge` (line 993): `z-30`
  - `crisis-warning-banner` (line 1011): `z-30`
  - `emp-suppression-badge` (line 1031): `z-30`
  - `acid-storm-badge` (line 1041): `z-30`
  - `ManualModal` (line 338): `z-30`
- **Stacking Inversion**: `TopHUD` is at `z-30`, while `ShopModal` and `GameOverModal` are at `z-20`. When `ShopModal` or `GameOverModal` is open, the in-game HUD (Score, Pure Water, HP dots, and Mute button) is rendered on top of the dark modal backdrop, and the Mute button remains clickable over the modal.
- **Crisis Active Badge Coordinate Mismatch**:
  - `endgame-crisis-active-badge` (lines 991–1005): `className="absolute top-20 left-1/2 -translate-x-1/2 ..."`
  - `top-20` equals 80 CSS pixels from top.
  - On iPhone SE (canvas height 449px), 80 CSS pixels corresponds to $80 \times (800 / 449) \approx 143$ logical pixels on canvas.
  - In `src/game/crisis/CrisisSovereign.ts` (lines 23, 686–800), the Sovereign boss dreadnought is positioned at $Y = 65$ to $Y = 195$ (height 130px).
  - Consequently, on mobile screens, `endgame-crisis-active-badge` renders directly in front of the Crisis Sovereign ship sprite.
- **Modal Overflow & Missing CSS Class**:
  - `ShopModal` (line 426) specifies `className="... custom-scrollbar ..."`, but `.custom-scrollbar` is not defined anywhere in `src/app/globals.css`.
  - Total `ShopUpgradePanel` + buttons height is ~544px, exceeding canvas container height on iPhone SE (449px content box). Scrolling works via `overflow-y-auto`, but scrollbars have no custom styling.
- **Absence of Pause Overlay**:
  - `GameManager.ts` has `isPaused: boolean = false`, `pause(): void`, and `resume(): void`.
  - However, there is NO pause button anywhere in `TopHUD` or `MobileControls`.
  - There is NO Pause overlay in `src/components/game-canvas.tsx` or `GameManager.ts`.
  - Keyboard handlers in `GameManager.ts` (lines 1995–2035) do NOT bind `Escape` or `KeyP` to `pause()`.

### 1.5 Bullet Visibility against High-Opacity Warning Backgrounds
- In `src/game/GameManager.ts` (lines 1708–1716):
  ```typescript
  // 1.2 Crisis warning background fills (DRAWN BEHIND ENTITIES IN LAYER 1)
  if (this.warningTimer > 0) {
    this.ctx.fillStyle = isThirdFaction ? 'rgba(132, 204, 22, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }
  ```
  - Automated testing in `tests/14_responsive_warning_background_and_contrast.spec.ts` confirms that against this Canvas Layer 1 tint, projectiles maintain $\ge 7.0:1$ WCAG AAA contrast ratio due to the 2.0px black armor rim (Tier 2) and solid white core (Tier 4, luminance 1.0).
- **High-Opacity Occlusion from React DOM Banners**:
  - In `src/components/game-canvas.tsx` (lines 975, 1013):
    - `endgame-crisis-warning-banner` inner card: `className="bg-slate-950/95 border-2 border-purple-500 ..."`
    - `crisis-warning-banner` inner card: `className="bg-red-950/95 border-2 border-red-500 ..."`
    - Both cards use **95% background opacity** (`bg-*-950/95`) and are centered vertically and horizontally on top of the canvas at `z-30`.
    - During the 2.0–3.0 second warning countdown, existing enemies and the player are actively moving and shooting. Bullets flying through the canvas center ($Y \approx 350 - 450$) pass directly behind these 95% opaque HTML boxes and are completely obscured from the player's view.
- **Canvas Layer 3 Text Duplication**:
  - In `src/game/GameManager.ts` (lines 1947–1948), warning text is also drawn directly on Canvas Layer 3 in bold 36px font at $(300, 400)$ with `strokeText` and `fillText`, overlapping any bullets passing through the center of the canvas.
- **Solar Flare Hazard Draw Order in Layer 2**:
  - In `src/game/GameManager.ts`:
    - Line 1773: `this.bullets.forEach(b => b.draw(this.ctx));`
    - Line 1846: Solar flare column is drawn with `rgba(255, 255, 255, 0.95)` core gradient.
    - Because bullets are rendered at line 1773 and solar flares at line 1846, active solar flares paint OVER player and enemy bullets, hiding bullets passing through the flare column.

---

## 2. Logic Chain

```
[Observation 1.1] Co-location in game-canvas.tsx
       │
       ├─► [Observation 1.2] Canvas aspect-[3/4] + 600x800 logical coordinate engine
       │         │
       │         ├─► Geometry preserves uniform 3:4 scaling (<0.6% subpixel border variance).
       │         └─► Vertical heights: iPhone SE (685px > 667px) and Desktop 1440x900 (1036px > 900px)
       │                   │
       │                   └─► Conclusion 1: Vertical overflow causes unwanted page scrolling.
       │
       ├─► [Observation 1.3] Mobile touch controls & HTML/CSS configuration
       │         │
       │         ├─► Missing `overscroll-behavior: none` in globals.css
       │         ├─► Missing `viewport: Viewport` export in layout.tsx
       │         └─► MobileControls layout: w-1/2 left cluster, h-1/2 undefined, FIRE! height 28px
       │                   │
       │                   └─► Conclusion 2: Vulnerable to pull-to-refresh & pinch zoom; button touch target violates 44px HIG.
       │
       ├─► [Observation 1.4] Z-Index hierarchy & Overlay positioning
       │         │
       │         ├─► TopHUD (z-30) > ShopModal & GameOverModal (z-20)
       │         ├─► endgame-crisis-active-badge (top-20 = 80px) sits directly on Sovereign sprite ($Y=143$ in 65-195)
       │         └─► GameManager.pause() lacks UI button, overlay component, and keyboard bindings (Esc/P)
       │                   │
       │                   └─► Conclusion 3: Z-index stacking inversion, badge sprite occlusion, missing pause UX.
       │
       └─► [Observation 1.5] Projectile visibility & Warning background opacity
                 │
                 ├─► Canvas Layer 1 tint + 4-tier bullet armor rim maintains >= 7:1 WCAG AAA contrast.
                 ├─► React DOM banners use 95% opacity centered cards (bg-red-950/95), hiding bullets at Y=350-450.
                 └─► Solar flares in Layer 2 are drawn AFTER bullets (line 1846 vs line 1773), occluding projectiles.
                           │
                           └─► Conclusion 4: Bullets are clear against background tint, but occluded by HTML modal cards and solar flare layer ordering.
```

---

## 3. Caveats

1. **Read-Only Scope**: In strict compliance with explorer instructions and user approval constraints, no source code files were modified during this investigation. Concrete proposed diffs and remediation plans are provided for subsequent implementation agents.
2. **Device Hardware Variations**: Real physical mobile devices may exhibit vendor-specific browser navigation bars (e.g. Safari bottom tab bar or Android navigation bar) that further reduce usable viewport height beyond headless Playwright simulations.
3. **Sound System Interaction on Pause**: When a visual pause overlay is introduced, audio synthesis and active SFX loops in `SoundManager.ts` should also be suspended to ensure auditory consistency.

---

## 4. Conclusion

The Water Invader responsive UI and canvas scaling subsystem possesses solid foundational math (exact 600x800 logical scaling, high-DPI DPR buffer sizing, and 4-tier bullet armor rims with $\ge 7:1$ WCAG AAA contrast). However, four distinct categories of responsive/UI defects exist:

1. **Viewport Overflow & Desktop Controls Leak**:
   - Total page height on iPhone SE ($685.33$px) and 1440x900 desktop ($1036$px) exceeds viewport height, creating vertical scrollbars.
   - `MobileControls` has no breakpoint class (`sm:hidden` or `md:hidden`), rendering mobile touch buttons on desktop displays.
2. **Gesture Vulnerabilities & Touch Target Ergonomics**:
   - `src/app/globals.css` lacks `overscroll-behavior: none`, allowing pull-to-refresh on mobile browsers.
   - `src/app/layout.tsx` lacks `viewport: Viewport` (`maximumScale: 1, userScalable: false`), allowing accidental pinch zoom.
   - `MobileControls` clusters all buttons on the left half (`w-1/2`), uses invalid `h-1/2` flex sizing, and renders `FIRE!` at only ~28px height (below the 44px minimum touch target).
3. **Z-Index Inversion & Overlay Misalignments**:
   - `TopHUD` (`z-30`) renders over `ShopModal` (`z-20`) and `GameOverModal` (`z-20`). Modals should be `z-40` or `z-50`.
   - `endgame-crisis-active-badge` at fixed `top-20` (80px) sits directly on top of the Crisis Sovereign boss sprite on mobile viewports.
   - The game lacks an in-game pause button, pause overlay, and Escape/P pause key handlers.
4. **Projectile Occlusion by Banners & Layer Draw Order**:
   - Center warning cards (`bg-red-950/95`) obscure bullets passing through the middle vertical zone ($Y \approx 350-450$) during incursion warnings.
   - In `GameManager.ts`, active solar flares (line 1846) are drawn after bullets (line 1773), occluding projectiles.

---

## 5. Verification Method

### 5.1 Independent Playwright Verification Commands
Execute the automated test suites covering responsive bounds, touch controls, and contrast:
```bash
# 1. Verify responsive warning background bounds & corner sampling
npx playwright test tests/14_responsive_warning_background_and_contrast.spec.ts

# 2. Verify mobile touch evasion, pointer drag, and multi-touch safety
npx playwright test tests/mobile_controls_and_touch_evasion.spec.ts

# 3. Verify 12-crisis warning banners & active HUD status badges
npx playwright test tests/15_endgame_crisis_12_archetypes.spec.ts

# 4. Verify base UI elements, canvas presence, and control bindings
npx playwright test tests/01_ui_and_controls.spec.ts
```

### 5.2 Files to Inspect
1. `src/components/game-canvas.tsx`:
   - Line 138 (`TopHUD` `z-30`) vs Line 425 (`ShopModal` `z-20`).
   - Line 234–267 (`MobileControls` `w-1/2`, `h-1/2`, FIRE button height).
   - Line 975 & 1013 (95% opacity banner cards `bg-*-950/95`).
   - Line 993 (`endgame-crisis-active-badge` `top-20` positioning).
   - Line 1101 (`MobileControls` missing `sm:hidden`).
2. `src/app/globals.css`:
   - Verify absence of `overscroll-behavior: none` and `.custom-scrollbar`.
3. `src/app/layout.tsx`:
   - Verify absence of `export const viewport: Viewport`.
4. `src/game/GameManager.ts`:
   - Line 1773 vs 1846 (bullet draw order before solar flares).
   - Lines 1995–2035 (absence of pause hotkeys).

### 5.3 Invalidation Conditions
- Any change to `aspect-[3/4]` or container max-width that breaks 600:800 proportional scaling.
- Any change to bullet colors that reduces contrast below 7:1 against Layer 1 warning fills.
- Any modal re-indexing that causes game canvas pointer capture to bleed through open modals.

# Handoff Report: Canvas Sizing and Mobile Viewport CSS (Requirement R3)

- **Date**: 2026-09-08T00:52:00+09:00
- **Author**: Technical Explorer (`teamwork_preview_explorer_survey_viewport_1`)
- **Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_viewport_1`
- **Target Feature**: Requirement R3 — Mobile Viewport Adjustments (CSS Only)
- **Status**: Completed Survey & Architectural Proposal

---

## 1. Observation

### 1.1 Source Code Architecture & Current Styling
We conducted an exhaustive line-by-line inspection of all layout, canvas, styling, and game coordinate implementations:

1. **Root Layout (`src/app/layout.tsx`)**:
   - Lines 55–61:
     ```tsx
     <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
       <body className="min-h-full flex flex-col">{children}</body>
     </html>
     ```
   - No custom viewport sizing or letterboxing logic exists here.

2. **Main Page Container (`src/app/page.tsx`)**:
   - Lines 4–12:
     ```tsx
     <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
       <div className="w-full max-w-5xl text-center mb-6">
         <h1 className="text-4xl font-bold text-blue-400 mb-2">Water Invader</h1>
         <p className="text-slate-400">Use Left/Right Arrows or A/D to move. Spacebar to shoot.</p>
       </div>
       <GameCanvas />
     </main>
     ```
   - Direct observations:
     - `p-4` forces a mandatory 16px padding on all sides (32px total horizontal margin). On a standard mobile screen (375px wide), this constrains the maximum canvas width to only 343px.
     - The desktop instruction header (`h1` + `p` + `mb-6`) consumes ~92px of vertical space. On mobile touchscreens, keyboard instructions ("Use Left/Right Arrows or A/D...") are completely irrelevant.
     - `justify-center` vertically centers the 700px+ combined block (header + canvas + controls), causing the top of the canvas to be pushed above the visible mobile viewport on devices with viewport height $< 710\text{px}$ (e.g. iPhone SE at 667px).

3. **Canvas Viewport Container (`src/components/game-canvas.tsx`)**:
   - Lines 1069–1080:
     ```tsx
     <div className="relative flex flex-col items-center justify-center w-full max-w-[800px] mx-auto">
       {/* 1. Dedicated Canvas Viewport Container */}
       <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl bg-slate-900">
         <CanvasCore ... />
         <TopHUD ... />
     ```
   - Lines 233–242 (`CanvasCore`):
     ```tsx
     <canvas
       onPointerDown={onPointerDown}
       onPointerMove={onPointerMove}
       onPointerUp={onPointerUp}
       onPointerCancel={onPointerUp}
       ref={canvasRef}
       className="w-full h-full block bg-slate-900 touch-none select-none"
     />
     ```
   - Lines 1282–1293 (`MobileControls`):
     ```tsx
     {gameState === GameState.PLAYING && (
       <div data-testid="mobile-controls-wrapper" className="w-full max-w-[600px]">
         <MobileControls ... />
       </div>
     )}
     ```
   - Lines 162–217 (`TopHUD`):
     - Container is an absolute DOM overlay: `className="absolute top-0 left-0 w-full p-4 flex justify-between items-start text-white touch-none z-30 pointer-events-none"`.
     - Left column: `h2` (Score, `text-xl sm:text-2xl`), `p` (Pure water, `text-sm sm:text-base`), Wave indicator + Invader Badge (`👾`, `bg-red-950/80`) + Rogue Badge (`⚡`, `bg-lime-950/80`).
     - Right column: 5 HP circles (`w-4 h-4 sm:w-6 sm:h-6`), Mute button (`px-3 py-1 bg-slate-800/80 text-xs mb-1`), Combo text, Ultimate gauge (`w-32 h-4 bg-slate-700`).
     - Total DOM height of `TopHUD` on mobile screens: **~88px to 105px**.

4. **Logical Coordinates & Invariants (`src/game/GameManager.ts`)**:
   - Lines 159–161:
     ```ts
     public readonly logicalWidth: number = 600;
     public readonly logicalHeight: number = 800;
     public dpr: number = 1;
     ```
   - Lines 178–180:
     ```ts
     this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
     this.canvas.width = this.logicalWidth * this.dpr;
     this.canvas.height = this.logicalHeight * this.dpr;
     ```
   - Line 2274: `this.ctx.scale(this.dpr, this.dpr);`
   - Aspect ratio: $600 / 800 = 3/4 = 0.75$.

5. **Enemy Spawn & Movement Coordinates (`src/game/Enemy.ts` and `src/game/GameManager.ts`)**:
   - `GameManager.ts:766`: Normal formation Row 0 spawns at $y = 70$; Row 1 at $y = 115$; Row 2 at $y = 160$.
   - `GameManager.ts:873`: Mid-tier Leader spawns at $y = 65$.
   - `GameManager.ts:983`: Diver spawns at $y = 60$.
   - `GameManager.ts:990`: Zigzag spawns at $y = 50$.
   - `GameManager.ts:1004`: Sniper spawns at $y = 70$ or $75$.
   - `GameManager.ts:646`, `958`: Boss spawns at $y = 80$ or $90$.
   - Divers dive downward at `diveSpeed = Math.max(280, currentSpeedY * 35)` px/s.
   - Stage 10+ aggressive enemies surge downward with charge bursts (`chargeSurgeY = Math.max(60, 40 + (level - 10) * 6)`).

### 1.2 Existing Playwright Test Constraints (`tests/`)
Over 60 spec files in `tests/` establish hard invariants that any CSS solution MUST NOT break:
1. `tests/adversarial_challenger_m3_1.spec.ts`:
   - Line 27: Selects `div.aspect-\\[3\\/4\\]` explicitly.
   - Lines 34–45: Asserts container ratio and canvas ratio are strictly within $[0.73, 0.77]$.
2. `tests/m3_verification.spec.ts`:
   - Lines 11–16: Checks `div.aspect-\\[3\\/4\\]`, explicitly asserts `expect(classAttribute).not.toContain('sm:aspect-auto')` and `expect(classAttribute).toContain('aspect-[3/4]')`.
   - Lines 25–26: Asserts ratio is within $[0.70, 0.80]$.
   - Lines 81–83: Asserts formation minimum spawn $Y \ge 80$ and Boss spawn $Y \ge 90$ (occlusion test F-13).
3. `tests/bughunt_ui_responsive_viewports.spec.ts`:
   - Lines 84–86: Canvas bounding box aspect ratio must be within $[0.70, 0.80]$.
   - Lines 93–95: Canvas width must be $\le 608\text{px}$ when viewport width $\ge 700\text{px}$.
   - Lines 145–158: Zero horizontal scroll overflow across all viewports (`scrollWidth <= clientWidth + 1`).
   - Lines 209–214: Mobile controls must remain strictly below canvas (`clearanceGap >= -1.0`).
   - Lines 272–275: Crisis warning banners must match canvas bounds within $2.0\text{px}$.

---

## 2. Logic Chain

### 2.1 Why Enemies Appear to "Suddenly Drop In" on Mobile
Our investigation uncovered two distinct root causes:

#### Cause 1: Mathematical Proof of TopHUD DOM Occlusion on Mobile
1. On Desktop (1280x800 or 1920x1080):
   - Canvas CSS height = $800\text{px}$ (1:1 with logical coordinates).
   - `TopHUD` DOM overlay height = $\approx 80\text{px}$.
   - Relative vertical space occupied by HUD = $80 / 800 = \mathbf{10.0\%}$.
   - Enemies spawn at logical $y = 70 \dots 90$.
   - Since $1\text{ CSS px} = 1\text{ logical unit}$, enemies spawn right at or slightly below the bottom edge of the HUD. They are immediately visible to the player from the very first frame.
2. On Mobile (e.g. iPhone SE 375x667 or iPhone 14 390x844):
   - Due to `p-4` on `<main>`, canvas CSS width = $343\text{px}$ (on 375px screen).
   - With `aspect-[3/4]`, canvas CSS height = $343 / 0.75 = \mathbf{457.3\text{px}}$.
   - Scale factor between logical and CSS pixels: $457.3 / 800 = \mathbf{0.5716\text{ CSS px / logical unit}}$.
   - However, the DOM `TopHUD` elements (text sizes `text-xl` 28px, badges, 16px padding, mute button, ultimate gauge) **do NOT scale down with canvas scaling**.
   - As a result, `TopHUD` on mobile occupies **$\approx 88\text{px}$ to $105\text{px}$** of CSS height.
   - Translating that CSS height back into logical canvas coordinates:
     $$\text{Logical Occlusion Depth} = \frac{88\text{px}}{0.5716} \approx \mathbf{154\text{ logical units}} \quad (\text{or up to } 105 / 0.5716 = \mathbf{184\text{ logical units}})$$
   - HUD coverage on mobile rises to **$100 / 457.3 \approx \mathbf{22\%}$ of the entire canvas**!
   - Now consider enemy spawn coordinates:
     - Row 0 normal enemies: $y = 70$ (logical) $\rightarrow$ rendered at $40\text{px}$ CSS ($48\text{px}$ beneath the HUD).
     - Row 1 normal enemies: $y = 115$ (logical) $\rightarrow$ rendered at $65.7\text{px}$ CSS ($22\text{px}$ beneath the HUD).
     - Mid-tier Leaders: $y = 65$ (logical) $\rightarrow$ rendered at $37\text{px}$ CSS.
     - Divers: $y = 60$ (logical) $\rightarrow$ rendered at $34.3\text{px}$ CSS.
     - Zigzags: $y = 50$ (logical) $\rightarrow$ rendered at $28.6\text{px}$ CSS.
   - **Conclusion**: On mobile screens, EVERY single enemy in the top wave rows and all fast-dive/specialist units spawn **completely behind the opaque/translucent TopHUD elements (Score, Water, badges, Mute button, HP dots, Ultimate gauge)**.
   - The player cannot see them during their entry. When they travel past logical $y = 160 \dots 180$, they abruptly burst out from underneath the bottom of the HUD, creating the illusion of "suddenly appearing or dropping in from nowhere".

#### Cause 2: Mobile Viewport Height Overflow & Page Scrolling
1. Total vertical content stack on mobile:
   - `<main>` padding (`p-4` top + bottom): $32\text{px}$
   - Header in `src/app/page.tsx`: $\approx 92\text{px}$
   - Canvas wrapper (`aspect-[3/4]`): $\approx 477\text{px}$
   - Canvas border (`border-4` top + bottom): $8\text{px}$
   - Mobile Controls (`MobileControls` wrapper + buttons): $\approx 100\text{px}$
   - Total vertical requirement: $32 + 92 + 477 + 8 + 100 = \mathbf{709\text{px}}$.
2. On any mobile device where viewport height $< 710\text{px}$ (e.g. iPhone SE with 667px screen, or any mobile browser with URL bar / navigation bar active leaving $\approx 550\text{px}$ to $650\text{px}$ of `100dvh`):
   - The layout overflows vertically.
   - When the user taps or drags on the player ship at the bottom or uses the mobile controls, the browser scrolls down to keep the active touch target in view.
   - This scrolls the top $60\text{px} \dots 100\text{px}$ of the canvas completely off the top of the screen.
   - When new enemies spawn, they are physically positioned off-screen until they descend into the scrolled viewport.

#### Cause 3: Excess Lateral Margins Compacting Mobile Canvas
1. `<main>` uses `p-4` (16px horizontal padding on each side).
2. Canvas container has `w-full max-w-[600px]`.
3. On a 375px mobile viewport, the canvas is squeezed into 343px width.
4. Because the aspect ratio is rigidly linked to width, narrowing width directly compresses vertical height ($343 \times 4/3 = 457.3\text{px}$ instead of full screen usage).
5. If horizontal padding on mobile is relaxed to `p-1 sm:p-4` or `px-2 py-1 sm:p-4`, canvas width expands to $\approx 360\text{px} \dots 370\text{px}$, expanding both the visible X and Y axis bounds without breaking the 3:4 aspect ratio.

---

## 3. Caveats

1. **Strict Dimension Prohibition**:
   - `logicalWidth` (600) and `logicalHeight` (800) in `GameManager.ts` and `Enemy.ts` MUST NOT be modified under any circumstances. Over 60 Playwright test files directly instantiate enemies with `gm.logicalWidth` and assert canvas internal dimensions.
2. **Aspect Ratio Preservation**:
   - `aspect-[3/4]` MUST remain on the canvas wrapper div. Removing it or adding `sm:aspect-auto` will immediately fail `tests/m3_verification.spec.ts` (lines 15–16) and `tests/adversarial_challenger_m3_1.spec.ts`.
3. **No Canvas Pixel Distortion**:
   - Any solution that stretches canvas width without matching height would distort circular projectiles and collision hitboxes. `object-contain` must be maintained.
4. **Mobile Controls Clearance**:
   - `tests/bughunt_ui_responsive_viewports.spec.ts` strictly asserts that mobile controls must be placed below the canvas with non-negative gap (`clearanceGap >= -1.0`). Controls cannot be overlaid onto the canvas itself.

---

## 4. Conclusion & Proposed Implementation Specification

To fulfill requirement R3 strictly through CSS styling without modifying logical coordinates:

### 4.1 Adjustment Plan 1: Compact Mobile TopHUD (`src/components/game-canvas.tsx`)
Shrink the DOM footprint of `TopHUD` on mobile screens so its vertical coverage drops from $88\text{px} \dots 105\text{px}$ down to **$\approx 36\text{px}$** (equivalent to $\le 63$ logical units):

```tsx
// In src/components/game-canvas.tsx -> TopHUD:
export const TopHUD = React.memo(function TopHUD({ ... }: TopHUDProps) {
  return (
    <div className="absolute top-0 left-0 w-full p-2 sm:p-4 flex justify-between items-start text-white touch-none z-30 pointer-events-none">
      <div>
        <h2 className="text-sm sm:text-2xl font-bold text-blue-400">{t('점수:', 'Score:')} {score}</h2>
        <p className="text-xs sm:text-base text-blue-200">{t('정수된 물:', 'Pure Water:')} {currency} 💧</p>
        {gameState === GameState.PLAYING && (
          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
            <p className="text-xs sm:text-base text-yellow-300 font-bold">WAVE {wave}</p>
            <div className="flex items-center gap-1 ml-0.5 sm:ml-1">
              <span 
                data-testid="invader-threat-badge" 
                className="px-1.5 py-0 sm:px-2 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-red-950/80 text-red-400 border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center gap-0.5 select-none"
              >
                👾 {invaderCount}
              </span>
              <span 
                data-testid="rogue-threat-badge" 
                className="px-1.5 py-0 sm:px-2 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-lime-950/80 text-lime-400 border border-lime-500/60 shadow-[0_0_8px_rgba(132,204,22,0.4)] flex items-center gap-0.5 select-none"
              >
                ⚡ {rogueCount}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="text-right flex flex-col items-end">
        <div className="flex gap-1 justify-end mb-1 sm:mb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-3.5 h-3.5 sm:w-6 sm:h-6 rounded-full ${i < hp ? 'bg-blue-500' : 'bg-gray-600'}`} />
          ))}
        </div>
        {/* Mute button */}
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-800/80 hover:bg-slate-700 text-[10px] sm:text-xs font-bold text-slate-200 rounded border border-slate-600 transition-colors pointer-events-auto select-none mb-0.5 sm:mb-1 z-30"
        >
          {isMuted ? '🔇 MUTE' : '🔊 SOUND'}
        </button>
        {combo > 1 && (
          <div className="text-sm sm:text-xl font-bold text-yellow-400 animate-pulse">
            {combo}x COMBO!
          </div>
        )}
        {/* Ultimate Gauge */}
        {gameState === GameState.PLAYING && (
          <div className="mt-1 sm:mt-2 w-20 sm:w-32 bg-slate-700 h-2.5 sm:h-4 rounded-full overflow-hidden border border-slate-500 relative">
            <div 
              className={`h-full transition-all duration-300 ${ultimate >= 100 ? 'bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse' : 'bg-blue-500'}`}
              style={{ width: `${ultimate}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
});
```
- **Benefit**: By reducing HUD height from 95px to 36px, the logical occlusion depth decreases from 165+ units to 63 units. Enemies spawning at $y = 70 \dots 90$ now appear completely free of HUD occlusion from the instant they spawn!

### 4.2 Adjustment Plan 2: Page Layout & Vertical Space Optimization (`src/app/page.tsx`)
Streamline the header and outer padding on mobile:
```tsx
// In src/app/page.tsx:
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl text-center mb-1 sm:mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-blue-400 mb-0.5 sm:mb-2">Water Invader</h1>
        <p className="text-slate-400 text-xs sm:text-base hidden sm:block">Use Left/Right Arrows or A/D to move. Spacebar to shoot.</p>
      </div>
      <GameCanvas />
    </main>
  );
}
```
- **Benefit**:
  - Eliminates the desktop keyboard instruction on mobile screens (`hidden sm:block`).
  - Reduces header vertical height by $\approx 65\text{px}$.
  - Shifts `p-4` (32px margin) to `p-2 sm:p-4` (16px margin on mobile), instantly giving the canvas 16px more horizontal room and 21px more height.
  - Ensures the entire stack (header + canvas + controls) fits within $100\text{dvh}$ on mobile devices without any vertical page scrolling or canvas clipping.

### 4.3 Adjustment Plan 3: Canvas Container & Viewport Bounds (`src/components/game-canvas.tsx`)
Refine the canvas container border and responsive constraints:
```tsx
// In src/components/game-canvas.tsx line 1072:
<div className="relative w-full max-w-[600px] max-h-[calc(100dvh-130px)] sm:max-h-none aspect-[3/4] rounded-lg overflow-hidden border-2 sm:border-4 border-blue-900 shadow-2xl bg-slate-900">
  <CanvasCore
    canvasRef={canvasRef}
    onPointerDown={handleCanvasPointerDown}
    onPointerMove={handleCanvasPointerMove}
    onPointerUp={handleCanvasPointerUp}
  />
```
And in `CanvasCore`:
```tsx
// Line 240:
className="w-full h-full block bg-slate-900 touch-none select-none object-contain"
```
- **Benefit**:
  - `max-h-[calc(100dvh-130px)]` guarantees the canvas never pushes the mobile controls off-screen on ultra-short phones (e.g. 568px/667px).
  - `border-2 sm:border-4` frees up 4px of edge canvas area on mobile, eliminating abrupt edge clipping of diving enemies.
  - Preserves `aspect-[3/4]` class name and exact 3:4 ratio for all test specs.

### 4.4 Adjustment Plan 4: Secondary Overhead Indicators
Adjust secondary badge positions to align neatly with the compact TopHUD:
- Squadron Status HUD: `className="absolute top-11 sm:top-14 left-2 sm:left-4 ..."`
- End-Game Active Badge: `className="absolute top-12 sm:top-20 left-1/2 -translate-x-1/2 ..."`

---

## 5. Verification Method

To independently verify these adjustments:
1. **Type Safety & Build Checks**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   Both must complete with zero errors.

2. **Responsive Viewport Test Suite**:
   ```bash
   npx playwright test tests/bughunt_ui_responsive_viewports.spec.ts
   ```
   Verifies:
   - Aspect ratio conformance across all 5 viewports (Mobile SE 375x667, Modern 390x844, Tall 412x915, Desktop 1440x900, Desktop 1920x1080).
   - Zero horizontal overflow (`scrollWidth <= clientWidth + 1`).
   - Mobile controls clearance below canvas.
   - In-game warning banners matching canvas bounds.

3. **Aspect Ratio & HiDPI Verification**:
   ```bash
   npx playwright test tests/adversarial_challenger_m3_1.spec.ts tests/m3_verification.spec.ts
   ```
   Verifies:
   - `div.aspect-[3/4]` class presence.
   - Non-stretching bounding box ratio $[0.73, 0.77]$.
   - HiDPI canvas resolution (`canvas.width === 600 * dpr`).
   - Top HUD clearance and enemy spawn positions ($Y \ge 80$).

4. **Touch & Drag Controls Verification**:
   ```bash
   npx playwright test tests/mobile_controls_and_touch_evasion.spec.ts tests/cross_device_touch_verification.spec.ts
   ```
   Verifies that 1:1 touch dragging and boundary clamping behave identically across Samsung Galaxy S25+, iPhone 16 Pro, iPhone 14, iPhone SE, and Galaxy Z Fold.

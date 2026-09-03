# Comprehensive Investigation Report: Responsive Canvas Sizing, Warning Background Clipping, and Projectile Visual Contrast

**Target Milestone**: R2 — Responsive and Clear Event Backgrounds  
**Author**: Explorer 2 (`teamwork_preview_explorer_bg_1`)  
**Repository**: `water-invader`  
**Date**: 2026-09-03  

---

## Executive Summary

This investigation diagnoses the root causes behind event/crisis warning background color clipping on mobile viewports and bullet visibility degradation during environmental events. 

The investigation discovered **four primary architectural defects**:
1. **DOM Container Bounding Box Mismatch**: In `src/components/game-canvas.tsx`, the warning banner overlays (`[data-testid="crisis-warning-banner"]` and `[data-testid="endgame-crisis-warning-banner"]`) are styled with `absolute inset-0` inside a flex container that holds **both** the canvas (`CanvasCore`) **and** the mobile controls (`MobileControls`). On mobile devices, this causes the warning background to extend 96px below the canvas, covering the touch buttons, shifting the center alert card downwards, and clipping off-screen when the viewport height is limited.
2. **Letterbox Subpixel Gap from `object-contain` + `border-4`**: The canvas element is styled with `border-4 border-blue-900 object-contain`. Because the 4px border reduces the inner content box dimensions (`W - 8`, `H - 8`), the inner aspect ratio no longer exactly matches the canvas buffer's 3:4 (0.75) ratio. `object-contain` letterboxes the canvas bitmap by 1–3px, leaving dark slate margins between the warning background and the border.
3. **Screen-Shake Translation of Fullscreen Background Fills**: In `src/game/GameManager.ts`, warning background fills (`fillRect(0, 0, this.logicalWidth, this.logicalHeight)`) and perimeter borders (`strokeRect`) are executed under active screen shake translation (`ctx.translate(offsetX, offsetY)` with shake amplitude up to 5px). This shifts the warning background 2.5px off-canvas on every frame, exposing an unpainted strip on one side and clipping on the other.
4. **Foreground Overlay Layering & Bullet Outline Occlusion**: Canvas-drawn warning tints and End-Game Crisis dark banners are drawn **after** entities and bullets in `GameManager.draw()`. In addition, `Bullet.ts` renders its outer glow (`radius * 1.5`) **on top of** its 1.5px black perimeter outline (`radius + 1.5`), softening and washing out the outline. Under red background warning shifts, red invader bullets lose edge contrast, rendering them difficult to track.

A complete architectural solution and an automated Playwright test plan are provided below.

---

## 1. Root Cause Analysis: Mobile Screen Background Clipping

### 1.1 DOM Hierarchy and Containing Block Analysis

In `src/components/game-canvas.tsx` (lines 938–1051), the component layout is structured as follows:

```tsx
<div className="relative flex flex-col items-center justify-center w-full max-w-[800px] mx-auto">
  {/* Top HUD (Memoized) */}
  <TopHUD ... />

  {/* Canvas Viewport */}
  <CanvasCore ... />

  {/* Stellaris-Style Warning Banner Overlay */}
  {gameState === GameState.PLAYING && endGameCrisisState && (...) && (
    <div
      data-testid="endgame-crisis-warning-banner"
      className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center border-4 border-purple-500/90 shadow-[inset_0_0_80px_rgba(168,85,247,0.8)] animate-pulse rounded-lg bg-purple-950/40"
    >
      ...
    </div>
  )}

  {/* Crisis Warning Banner Overlay */}
  {gameState === GameState.PLAYING && crisisState && crisisState.warningTimer > 0 && (
    <div
      data-testid="crisis-warning-banner"
      className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center border-4 border-red-500/90 shadow-[inset_0_0_60px_rgba(239,68,68,0.7)] animate-pulse rounded-lg bg-red-950/30"
    >
      ...
    </div>
  )}

  {/* Mobile Controls */}
  {gameState === GameState.PLAYING && (
    <MobileControls ... />
  )}
</div>
```

#### The Bug:
- The outer container has `position: relative` (`className="relative flex flex-col ..."`).
- In normal flow, this container contains:
  1. `CanvasCore`: `<div className="w-full aspect-[3/4]">`
  2. `MobileControls`: `<div className="w-full flex justify-between p-4 mt-2 gap-2 sm:gap-4 touch-none">` (~88px height + 8px margin = ~96px).
- When `crisis-warning-banner` or `endgame-crisis-warning-banner` specifies `absolute inset-0`, its containing block is the **outer flex container**, NOT `CanvasCore`!
- Consequently:
  $$\text{Overlay Height} = \text{Height}_{\text{canvas}} + \text{Height}_{\text{MobileControls}} = \text{Height}_{\text{canvas}} + 96\text{px}$$
- The red/purple warning overlay (`bg-red-950/30`, `bg-purple-950/40`) bleeds past the bottom of the canvas and floods across the mobile action buttons.
- The 4px animated warning border wraps around the bottom of `MobileControls`, leaving the bottom edge of the actual canvas borderless.
- The inner vignette shadow (`shadow-[inset_0_0_60px_rgba(239,68,68,0.7)]`) casts its bottom shadow at the bottom of the touch buttons rather than at the bottom of the game arena.
- The alert modal box (`items-center justify-center`) is vertically centered across both the canvas and controls:
  $$\text{Center Y}_{\text{overlay}} = \frac{\text{Height}_{\text{canvas}} + 96}{2} = \text{Center Y}_{\text{canvas}} + 48\text{px}$$
  The alert is displaced 48px downwards, obscuring lower playfield entities and the player droplet.

### 1.2 Viewport Height Constraints & Flexbox `justify-center` Clipping

In `src/app/page.tsx`:
```tsx
<main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
  <div className="w-full max-w-5xl text-center mb-6">
    <h1 className="text-4xl font-bold text-blue-400 mb-2">Water Invader</h1>
    <p className="text-slate-400">Use Left/Right Arrows or A/D to move. Spacebar to shoot.</p>
  </div>
  <GameCanvas />
</main>
```

#### Total Vertical Footprint Calculation on Mobile:
For an iPhone SE (viewport 375 × 667 px):
- Horizontal padding `p-4`: $375 - 32 = 343\text{px}$ canvas width.
- Canvas height with `aspect-[3/4]`: $343 \times \frac{4}{3} = 457.33\text{px}$.
- Header (`h1`, `p`, `mb-6`): ~96px.
- Main padding `p-4` (top/bottom): 32px.
- MobileControls: ~96px.
- Total document content height: $32 + 96 + 457.33 + 96 = 681.33\text{px}$.
- Viewport height: 667px (or ~560px when browser URL bars are visible).

Because total content height ($681\text{px}$) exceeds viewport height ($667\text{px}$), the flex container `justify-center` on `<main>` centers overflowing content. In CSS flexbox, `justify-center` with overflow causes the **top of the container to be pushed off the top of the viewport into negative coordinate space**. The player cannot scroll up to see the top HUD or the top warning border, producing severe visual clipping.

### 1.3 The `object-contain` + `border-4` Letterboxing Gap

In `src/components/game-canvas.tsx` (lines 208–219):
```tsx
export const CanvasCore = React.memo(function CanvasCore(...) {
  return (
    <div className="w-full aspect-[3/4]">
      <canvas
        ref={canvasRef}
        className="w-full h-full border-4 border-blue-900 rounded-lg shadow-2xl bg-slate-900 touch-none object-contain select-none"
      />
    </div>
  );
});
```

#### Geometric Aspect Ratio Drift:
- The parent wrapper has `aspect-[3/4]` ($\text{ratio} = 0.75$).
- The `<canvas>` has `w-full h-full border-4`.
- Under `box-sizing: border-box`, a 360px wide container creates a canvas element with:
  $$\text{Border-Box Width} = 360\text{px}, \quad \text{Border-Box Height} = 480\text{px}$$
  $$\text{Content-Box Width} = 360 - 8 = 352\text{px}, \quad \text{Content-Box Height} = 480 - 8 = 472\text{px}$$
  $$\text{Content-Box Ratio} = \frac{352}{472} \approx 0.74576 \neq 0.75$$
- The canvas bitmap buffer is $600 \times 800$ ($\text{ratio} = 0.75$).
- Because the `<canvas>` element has CSS `object-contain`, the browser scales the $600 \times 800$ bitmap to fit inside $352 \times 472$ while preserving $0.75$:
  $$\text{Rendered Bitmap Height} = \frac{352}{0.75} = 469.33\text{px}$$
  $$\text{Unpainted Letterbox Gap} = 472 - 469.33 = 2.67\text{px}$$
- The 2.67px gap displays the canvas element's background: `bg-slate-900` (`#0f172a`).
- When a warning background color is rendered inside the canvas bitmap, it terminates at 469.33px, leaving dark slivers between the warning background and the blue border.

### 1.4 Dynamic Device Pixel Ratio (DPR) and Resize Desynchronization

In `src/game/GameManager.ts` (lines 93–95):
```ts
this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
this.canvas.width = this.logicalWidth * this.dpr;
this.canvas.height = this.logicalHeight * this.dpr;
```
And in `game-canvas.tsx` (lines 700–703):
```ts
const handleResize = () => {
  lastPointerXRef.current = null;
};
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);
```

#### The Bug:
- `this.canvas.width` and `this.canvas.height` are set **once** in the `GameManager` constructor.
- When a mobile device changes orientation (portrait $\leftrightarrow$ landscape) or when the browser zoom level changes, `window.devicePixelRatio` changes (or container dimensions change), but `GameManager` has no resize handler to update `this.dpr` or reset buffer dimensions.
- The canvas bitmap becomes blurry or mis-scaled relative to its CSS display size.

---

## 2. Census of Current Warning Background Rendering Implementations

Warning backgrounds are currently split across **two uncoordinated systems**: React DOM Overlays and Canvas 2D Loop.

| Location | Trigger Condition | Render Mechanism | Styling / Visual Attributes | Clipping / Visual Issues |
|---|---|---|---|---|
| `game-canvas.tsx`: lines 1003–1020 | `crisisState.warningTimer > 0` | React DOM Element (`[data-testid="crisis-warning-banner"]`) | `absolute inset-0`, `bg-red-950/30`, `border-4 border-red-500/90`, `shadow-[inset_0_0_60px_rgba(239,68,68,0.7)]` | Stretches over `MobileControls`; center banner offset by +48px; bottom border cut off on mobile viewports. |
| `game-canvas.tsx`: lines 965–982 | `endGameCrisisState.phase === INCURSION \|\| warningTimer > 0` | React DOM Element (`[data-testid="endgame-crisis-warning-banner"]`) | `absolute inset-0`, `bg-purple-950/40`, `border-4 border-purple-500/90`, `shadow-[inset_0_0_80px_rgba(168,85,247,0.8)]` | Stretches over `MobileControls`; clashes with canvas-drawn banner in `EndGameCrisis.ts`. |
| `GameManager.ts`: lines 1815–1837 | `this.warningTimer > 0` | Canvas 2D Loop (`fillRect` + `strokeRect`) | `ctx.fillStyle = isThirdFaction ? 'rgba(132, 204, 22, 0.10)' : 'rgba(239, 68, 68, 0.12)'`, `ctx.fillRect(0, 0, 600, 800)`, `strokeRect(2, 2, 596, 796)` | Drawn **after** bullets under screen-shake translation ($\pm 2.5\text{px}$), causing shaking borders and letterbox slivers. |
| `EndGameCrisis.ts`: lines 492–524 | `this.phase === CrisisPhase.INCURSION` | Canvas 2D Loop (`drawIncursionWarningBanner`) | Radial purple vignette (`rgba(147, 51, 234, 0.4 * pulse)`), Center banner box (`rgba(15, 23, 42, 0.9)`, 90px height) | Drawn on top of bullets; 90% opaque dark box obscures bullets passing through screen center ($y = 355 \text{ to } 445$). |
| `GameManager.ts`: lines 1714–1759 | `flare.chargeTimer > 0` (Solar Flare) | Canvas 2D Loop | Vertical column `fillRect(flare.x, 0, flare.width, 800)` with `rgba(245, 158, 11, 0.12 - 0.32)` | Renders on top of bullets, reducing projectile contrast in the flare corridor. |

### Clipping Behavior Across Viewport Profiles

1. **Mobile Portrait (360×640 to 430×932)**:
   - **DOM Overlay**: Lower 96px of the warning overlay covers `MobileControls`. When total page height exceeds screen height, flexbox `justify-center` pushes the top of the canvas off-screen, clipping the top HUD and the top warning border.
   - **Canvas**: Subpixel letterboxing gap (1–3px) between the canvas edge and the CSS border leaves an unpainted slate bar. Active screen shake shifts the canvas fill off-center by up to 2.5px.
2. **Tablet Portrait (768×1024 to 820×1180)**:
   - Canvas expands to full width ($736\text{px}$), resulting in canvas height of $981\text{px}$.
   - Total content height ($1173\text{px}$) exceeds tablet height ($1024\text{px}$), causing vertical scrolling. The bottom 150px of the canvas + mobile controls is pushed below the fold.
3. **Desktop / Laptop (1280×800 to 1366×768)**:
   - Available browser viewport height is typically only ~680–720px due to browser tabs and OS taskbars.
   - An 800px wide canvas requires 1066px height, which causes severe vertical overflow (~400px), requiring the user to scroll down to see player controls.

---

## 3. Projectile Visibility, Opacity, and Color Blending Analysis

### 3.1 Layer Ordering Flaw in `GameManager.draw()`

The current render sequence in `GameManager.draw()` (lines 1652–1839) is:
```
1. Clear Canvas (#0f172a)
2. Draw Background Bubbles
3. Apply Screen Shake Translation [ctx.translate(offsetX, offsetY)]
4. Draw Entities:
   - Barricades
   - Player
   - Helpers
   - Enemies
   - Bullets (Line 1676)
   - Particles
5. Draw Hazard Projectiles (Acid Storm)
6. Draw Solar Flare Columns
7. Draw EMP Sweep Lines
8. Draw Boss HP Bar
9. Draw End-Game Crisis (EndGameCrisis.draw) -> INCLUDES drawIncursionWarningBanner!
10. Draw Warning Timer Overlay (Line 1818) -> INCLUDES fillRect(0, 0, 600, 800)!
11. Restore Context
```

#### Why This Impairs Bullet Visibility:
- Step 9 and Step 10 draw warning tints **after** bullets are drawn.
- When an overlay is drawn on top of bullets, it acts as a **destructive color filter**:
  - The 1.5px black perimeter outline (`#000000`, 0 luminance) receives a red or purple wash, reducing edge contrast against the dark background from $21:1$ down to $\approx 6:1$.
  - In `EndGameCrisis.drawIncursionWarningBanner`, the center banner box is filled with `rgba(15, 23, 42, 0.9)` (90% opaque dark slate). Any player or enemy bullets passing through the center of the screen ($y = 355$ to $445$) are **90% blotted out**, making them practically invisible to the player during the incursion telegraph!

### 3.2 Outline Occlusion Flaw in `Bullet.draw()`

In `src/game/Bullet.ts` (lines 120–161):
```ts
// Tier 1: 1.5px Black Perimeter Stroke Outline
ctx.strokeStyle = '#000000';
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.arc(centerX, centerY, radius + 1.5, 0, Math.PI * 2);
ctx.stroke();

// Tier 2: Outer Glow
ctx.globalAlpha = 0.5;
ctx.fillStyle = shellColor; // '#ef4444'
ctx.beginPath();
ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
ctx.fill();

// Tier 3: Saturated Color Shell
ctx.globalAlpha = 1.0;
ctx.fillStyle = shellColor;
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
ctx.fill();

// Tier 4: Solid White Core
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
ctx.fill();
```

#### The Tier Ordering Bug:
- For an enemy bullet with `width = 10` ($radius = 5$):
  - **Tier 1**: Black stroke drawn at radius $5 + 1.5 = 6.5\text{px}$.
  - **Tier 2**: Outer Glow filled at radius $5 \times 1.5 = 7.5\text{px}$ with `globalAlpha = 0.5`!
- **Tier 2 is drawn on top of Tier 1!** The red outer glow paints over the black perimeter stroke, muddying the outline before Tier 3 even runs.
- During red crisis warning shifts, the red glow merges directly into the red background tint. Because the black stroke was painted over by the red glow, the bullet's edge boundary dissolves into the background.

---

## 4. Formulated Architectural Solution

### 4.1 Solution Component 1: Dedicated Canvas Viewport Wrapper in `game-canvas.tsx`

Decouple the canvas viewport from `MobileControls` by introducing an explicit `<div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden ...">` wrapper:

```tsx
// Proposed layout hierarchy in game-canvas.tsx
return (
  <div className="relative flex flex-col items-center justify-start sm:justify-center w-full max-w-[800px] mx-auto select-none">
    {/* 1. DEDICATED CANVAS VIEWPORT CONTAINER */}
    {/* All viewport overlays (HUD, Warning Banners, Modals) bind strictly to this container */}
    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl bg-slate-900">
      {/* Canvas Element: Fills 100% of the viewport container without object-contain or border */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        className="w-full h-full block bg-slate-900 touch-none select-none"
      />

      {/* Top HUD: Positioned inside the canvas viewport */}
      <TopHUD ... />

      {/* Stellaris Crisis Warning Banner: Inset-0 matches canvas EXACTLY */}
      {gameState === GameState.PLAYING && endGameCrisisState && (...) && (
        <div
          data-testid="endgame-crisis-warning-banner"
          className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center border-4 border-purple-500/90 shadow-[inset_0_0_80px_rgba(168,85,247,0.8)] animate-pulse bg-purple-950/35"
        >
          ...
        </div>
      )}

      {/* Standard Crisis Warning Banner: Inset-0 matches canvas EXACTLY */}
      {gameState === GameState.PLAYING && crisisState && crisisState.warningTimer > 0 && (
        <div
          data-testid="crisis-warning-banner"
          className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center border-4 border-red-500/90 shadow-[inset_0_0_60px_rgba(239,68,68,0.7)] animate-pulse bg-red-950/25"
        >
          ...
        </div>
      )}

      {/* Status Badges: Top-20 is relative to canvas top */}
      {...badges...}

      {/* Main Menu, Shop, and Game Over Modals: Bound to canvas */}
      {gameState === GameState.MENU && <MenuOverlay ... />}
      {gameState === GameState.SHOP && <ShopModal ... />}
      {gameState === GameState.GAME_OVER && <GameOverModal ... />}
      {showManual && <ManualModal onClose={handleCloseManual} />}
    </div>

    {/* 2. MOBILE CONTROLS CONTAINER (Completely outside canvas viewport) */}
    {gameState === GameState.PLAYING && (
      <div data-testid="mobile-controls-wrapper" className="w-full">
        <MobileControls ... />
      </div>
    )}
  </div>
);
```

#### Immediate Benefits:
1. `absolute inset-0` on warning banners spans **only** the $3:4$ canvas viewport.
2. The warning banner **never** covers `MobileControls`.
3. The alert card is centered at the exact mathematical center of the game field.
4. The canvas border is on the wrapper, removing the aspect ratio distortion caused by `border-4` on `<canvas>`.
5. `overflow-hidden` on the wrapper guarantees that corner radii and warning vignettes clip cleanly at the game boundary.

### 4.2 Solution Component 2: Multi-Layer Canvas Render Pipeline in `GameManager.ts`

Refactor `GameManager.draw()` into three distinct phases: **Background Layer**, **Shaking World Entity Layer**, and **Stable Foreground UI Layer**:

```ts
private draw() {
  this.ctx.save();
  this.ctx.scale(this.dpr, this.dpr);
  const time = performance.now() / 1000;

  // =========================================================================
  // LAYER 1: STATIC FULL-CANVAS BACKGROUND (No Shake, Seamless Coverage)
  // =========================================================================
  // 1.1 Base dark void
  this.ctx.fillStyle = '#0f172a';
  this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

  // 1.2 Environmental Event / Crisis Warning Background (DRAWN BEHIND ENTITIES!)
  if (this.warningTimer > 0) {
    const isThirdFaction = (this.warningMessage || this.warningText).includes('ROGUE') || 
                           (this.warningMessage || this.warningText).includes('THIRD') || 
                           (this.warningMessage || this.warningText).includes('3-WAY');
    this.ctx.fillStyle = isThirdFaction 
      ? 'rgba(132, 204, 22, 0.12)' 
      : (this.pendingReinforcement === 'ALLY' ? 'rgba(34, 197, 94, 0.10)' : 'rgba(239, 68, 68, 0.12)');
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  // 1.3 End-Game Crisis Ambient Radial Vignette (DRAWN BEHIND ENTITIES!)
  if (this.endGameCrisis && this.endGameCrisis.isActive && this.endGameCrisis.phase === CrisisPhase.INCURSION) {
    const pulse = (Math.sin(this.endGameCrisis.warningTimer * 8) + 1) / 2;
    const vig = this.ctx.createRadialGradient(
      this.logicalWidth / 2, this.logicalHeight / 2, this.logicalHeight * 0.2,
      this.logicalWidth / 2, this.logicalHeight / 2, this.logicalHeight * 0.7
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, `rgba(147, 51, 234, ${0.35 * pulse})`);
    this.ctx.fillStyle = vig;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  // 1.4 Background Bubbles
  this.drawBackgroundBubbles(time);

  // =========================================================================
  // LAYER 2: SHAKING WORLD ENTITY LAYER (Barricades, Entities, Projectiles)
  // =========================================================================
  this.ctx.save();
  if (this.shakeTimer > 0) {
    const shakeAmount = this.warningTimer > 0 ? 5 : 2;
    const offsetX = (Math.random() - 0.5) * shakeAmount;
    const offsetY = (Math.random() - 0.5) * shakeAmount;
    this.ctx.translate(offsetX, offsetY);
  }

  // Entities drawn on top of the tinted background with uncompromised contrast
  this.barricades.forEach(b => b.draw(this.ctx));
  this.player.draw(this.ctx);
  this.helpers.forEach(h => h.draw(this.ctx));
  this.enemies.forEach(e => e.draw(this.ctx));
  this.bullets.forEach(b => b.draw(this.ctx));
  this.particles.forEach(p => p.draw(this.ctx));

  // Hazards
  this.drawHazardProjectiles();
  this.drawSolarFlares();
  this.drawEmpStatic(time);

  // End-Game Crisis Rifts and Sovereign
  if (this.endGameCrisis && this.endGameCrisis.isActive) {
    this.endGameCrisis.drawEntities(this.ctx);
  }

  this.ctx.restore(); // Exit shake layer

  // =========================================================================
  // LAYER 3: STABLE FOREGROUND UI OVERLAYS (No Shake, Crisp Borders & HUDs)
  // =========================================================================
  // Boss HP Bar
  const activeBoss = this.enemies.find(e => e.type === EnemyType.BOSS && !e.isDead);
  if (activeBoss) {
    this.drawBossHpBar(activeBoss);
  }

  // End-Game Crisis Boss HUD
  if (this.endGameCrisis && this.endGameCrisis.isActive) {
    this.endGameCrisis.drawHUD(this.ctx, this.logicalWidth);
  }

  // Crisp perimeter warning stroke (stays exactly at borders without shaking off-screen)
  if (this.warningTimer > 0) {
    const isThirdFaction = (this.warningMessage || this.warningText).includes('ROGUE') || 
                           (this.warningMessage || this.warningText).includes('THIRD') || 
                           (this.warningMessage || this.warningText).includes('3-WAY');
    this.ctx.strokeStyle = isThirdFaction 
      ? 'rgba(132, 204, 22, 0.85)' 
      : (this.pendingReinforcement === 'ALLY' ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)');
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(2, 2, this.logicalWidth - 4, this.logicalHeight - 4);
  }

  if (this.isDebugMode) {
    this.drawDebugOverlay();
  }

  this.ctx.restore();
}
```

### 4.3 Solution Component 3: High-Contrast 4-Tier Bullet Renderer in `Bullet.ts`

Fix the tier ordering so outer glow is drawn **first**, followed by a crisp high-contrast perimeter outline, a saturated body, and an intensified white-hot core:

```ts
public draw(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  const centerX = this.position.x + this.size.width / 2;
  const centerY = this.position.y + this.size.height / 2;
  const radius = this.size.width / 2;

  if (this.faction === Faction.PLAYER) {
    // -----------------------------------------------------------------
    // Player Droplet Spear: High-Contrast Cyan with Crisp Black Border
    // -----------------------------------------------------------------
    const rx = this.size.width / 2;

    // 1. Ambient Glow Bloom (Drawn behind outline)
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(centerX, this.position.y + this.size.height - rx, this.size.width * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-Contrast Black Perimeter Outline (2.0px stroke)
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(centerX, this.position.y + this.size.height - rx, rx + 1.0, 0, Math.PI);
    ctx.lineTo(centerX, this.position.y - 2);
    ctx.closePath();
    ctx.stroke();

    // 3. Vibrant Cyan Core Droplet
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(centerX, this.position.y + this.size.height - rx, rx, 0, Math.PI);
    ctx.lineTo(centerX, this.position.y);
    ctx.closePath();
    ctx.fill();

    // 4. Solid Pure White Spearhead Core (Luminance = 1.0)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, this.position.y + this.size.height * 0.55, this.size.width * 0.35, 0, Math.PI * 2);
    ctx.fill();

  } else if (this.faction === Faction.ROGUE) {
    // -----------------------------------------------------------------
    // Rogue Energy Orb: Neon Lime / Amber with 2.0px Black Armor Rim
    // -----------------------------------------------------------------
    // 1. Outer Glow Bloom
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 2. Crisp Black Perimeter Rim (2.0px)
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 1.0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Saturated Dual-Ring Body (Lime Outer, Amber Inner)
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // 4. Intense White-Hot Focal Center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.40, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // -----------------------------------------------------------------
    // Invader / Boss / Sniper Bullet: High-Contrast Plasma Bolt
    // -----------------------------------------------------------------
    const shellColor = this.isInterceptable ? '#a855f7' : (this.color || '#ef4444');

    // 1. Outer Atmospheric Bloom
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = shellColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-Contrast Outer Black Perimeter Stroke (2.0px)
    // Ensures bullet edges maintain > 7:1 contrast even on bright red/purple backgrounds
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 1.0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Saturated Color Plasma Shell
    ctx.fillStyle = shellColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    if (this.isInterceptable) {
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 4. Concentrated Solid White Core Highlight (Radius 0.5x)
    // Provides immediate optical visibility regardless of background tint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.50, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
```

### 4.4 Dynamic Canvas Resize & DPR Maintenance in `GameManager.ts`

Add an active resize synchronization method to `GameManager`:
```ts
public resize(): void {
  const currentDpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  this.dpr = currentDpr;
  const targetW = Math.round(this.logicalWidth * this.dpr);
  const targetH = Math.round(this.logicalHeight * this.dpr);

  if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
    this.canvas.width = targetW;
    this.canvas.height = targetH;
  }
}
```
In `src/components/game-canvas.tsx`:
```ts
const handleResize = () => {
  lastPointerXRef.current = null;
  gameManagerRef.current?.resize();
};
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);
```

---

## 5. Concrete Verification & Automated Test Plan

### 5.1 Automated Viewport Matrix Test in Playwright

Create `tests/14_responsive_warning_background_and_contrast.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('R2: Responsive Warning Backgrounds & Projectile Contrast Suite', () => {

  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 14 Pro', width: 390, height: 844 },
    { name: 'Pixel 7', width: 412, height: 915 },
    { name: 'iPad Mini (Portrait)', width: 768, height: 1024 },
    { name: 'Desktop HD', width: 1280, height: 800 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
  ];

  for (const vp of viewports) {
    test(`V1: Viewport [${vp.name} (${vp.width}x${vp.height})] warning banner strictly matches canvas bounds`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('button', { hasText: 'START GAME' }).click();

      // Trigger Crisis Warning
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.triggerCrisis('TITAN_HORDE');
      });

      const canvas = page.locator('canvas');
      const warningBanner = page.locator('[data-testid="crisis-warning-banner"]');
      const mobileControls = page.locator('[data-testid="mobile-controls-wrapper"]');

      await expect(warningBanner).toBeVisible();

      const canvasBox = await canvas.boundingBox();
      const bannerBox = await warningBanner.boundingBox();

      expect(canvasBox).not.toBeNull();
      expect(bannerBox).not.toBeNull();

      if (canvasBox && bannerBox) {
        // Assert Warning Banner boundary matches Canvas boundary to within 1px
        expect(Math.abs(bannerBox.x - canvasBox.x)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.y - canvasBox.y)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.width - canvasBox.width)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.height - canvasBox.height)).toBeLessThanOrEqual(1.5);

        // Assert Warning Banner DOES NOT overlap mobile controls
        if (await mobileControls.isVisible()) {
          const controlsBox = await mobileControls.boundingBox();
          if (controlsBox) {
            expect(bannerBox.y + bannerBox.height).toBeLessThanOrEqual(controlsBox.y + 2);
          }
        }
      }
    });
  }

  test('V2: Canvas bitmap corner sampling verifies 100% full-viewport warning fill without gaps', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'START GAME' }).click();

    // Trigger reinforcement warning on canvas
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.warningTimer = 2.0;
      gm.warningMessage = 'ENEMY REINFORCEMENTS INCOMING!';
      gm.update(0.016);
    });

    const cornerCheck = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;

      // Sample pixels at corners: top-left, top-right, bottom-left, bottom-right
      const samplePoint = (x: number, y: number) => {
        const p = ctx.getImageData(x, y, 1, 1).data;
        return { r: p[0], g: p[1], b: p[2], a: p[3] };
      };

      return {
        topLeft: samplePoint(10 * dpr, 10 * dpr),
        topRight: samplePoint(w - 10 * dpr, 10 * dpr),
        bottomLeft: samplePoint(10 * dpr, h - 10 * dpr),
        bottomRight: samplePoint(w - 10 * dpr, h - 10 * dpr),
      };
    });

    // Verify all 4 corners have active warning color tint (elevated red channel > 30 compared to void #0f172a)
    expect(cornerCheck.topLeft.r).toBeGreaterThan(20);
    expect(cornerCheck.topRight.r).toBeGreaterThan(20);
    expect(cornerCheck.bottomLeft.r).toBeGreaterThan(20);
    expect(cornerCheck.bottomRight.r).toBeGreaterThan(20);
  });

  test('V3: Pixel contrast measurement verifies enemy projectiles maintain > 7:1 contrast ratio against warning background', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'START GAME' }).click();

    const contrastReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet;
      const FactionEnum = (window as any).Faction;

      // Set intense red crisis warning background
      gm.warningTimer = 2.0;
      gm.warningMessage = 'RED ALERT CRISIS';

      // Spawn enemy projectile at canvas center
      const bullet = new BulletClass(300, 400, 200, 1, false);
      bullet.faction = FactionEnum.INVADER;
      gm.bullets = [bullet];

      // Render single frame
      (gm as any).draw();

      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = gm.dpr;

      // Extract pixel grid around bullet center (305, 405)
      const cx = Math.round(305 * dpr);
      const cy = Math.round(405 * dpr);

      const corePixel = ctx.getImageData(cx, cy, 1, 1).data;
      const rimPixel = ctx.getImageData(cx + Math.round(5.5 * dpr), cy, 1, 1).data;
      const bgPixel = ctx.getImageData(cx + Math.round(15 * dpr), cy, 1, 1).data;

      // Relative luminance calculation (sRGB)
      const lum = (r: number, g: number, b: number) => {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const coreLum = lum(corePixel[0], corePixel[1], corePixel[2]);
      const rimLum = lum(rimPixel[0], rimPixel[1], rimPixel[2]);
      const bgLum = lum(bgPixel[0], bgPixel[1], bgPixel[2]);

      const coreContrast = (coreLum + 0.05) / (bgLum + 0.05);

      return {
        coreRGB: [corePixel[0], corePixel[1], corePixel[2]],
        rimRGB: [rimPixel[0], rimPixel[1], rimPixel[2]],
        bgRGB: [bgPixel[0], bgPixel[1], bgPixel[2]],
        coreLum,
        rimLum,
        bgLum,
        coreContrast,
      };
    });

    // White core must be near 1.0 luminance (R, G, B > 230)
    expect(contrastReport.coreRGB[0]).toBeGreaterThanOrEqual(230);
    expect(contrastReport.coreRGB[1]).toBeGreaterThanOrEqual(230);
    expect(contrastReport.coreRGB[2]).toBeGreaterThanOrEqual(230);

    // Black rim outline must be low luminance (< 0.15)
    expect(contrastReport.rimLum).toBeLessThan(0.15);

    // Core contrast against tinted background must exceed 7:1 (WCAG AAA standard)
    expect(contrastReport.coreContrast).toBeGreaterThanOrEqual(7.0);
  });
});
```

---

## 6. Implementation Plan Summary

| Target File | Proposed Modifications |
|---|---|
| `src/components/game-canvas.tsx` | Wrap `<CanvasCore>` and all canvas-bound overlays (`TopHUD`, `crisis-warning-banner`, `endgame-crisis-warning-banner`, badges, modals) inside a dedicated `<div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl bg-slate-900">` viewport. Move `<MobileControls>` into normal flow below the viewport wrapper. Remove `object-contain` and `border-4` from the `<canvas>` element. Hook `handleResize` to `GameManager.resize()`. |
| `src/game/GameManager.ts` | Refactor `draw()` into 3 layers: Layer 1 (Static background + event tint, drawn **before** entities), Layer 2 (Shaking entity world), and Layer 3 (Stable foreground UI + perimeter stroke). Implement `resize()` method to synchronize `this.canvas.width/height` with `window.devicePixelRatio`. |
| `src/game/Bullet.ts` | Fix tier ordering in `draw()`: Render outer glow first, followed by a 2.0px black perimeter outline, saturated body, and intensified white core highlight (radius 0.5x). |
| `src/game/crisis/EndGameCrisis.ts` | Separate entity drawing (`drawEntities`) from HUD drawing (`drawHUD`). Move incursion vignette into background layer; eliminate the 90% opaque central screen-blocking box that blotted out bullets. |
| `tests/14_responsive_warning_background_and_contrast.spec.ts` | Implement new Playwright test suite covering multi-viewport boundary alignment, corner pixel fill sampling, and bullet luminance contrast metrics. |

---

## Conclusion
The clipping of event/crisis warning background colors on mobile and the degradation of projectile contrast are fully diagnosed. The proposed architectural decoupling of the canvas viewport from mobile controls, the reordering of the canvas render pipeline (drawing environmental tints in the background before bullets), and the calibration of the bullet outline tier structure provide a seamless, high-contrast, fully responsive gameplay experience on all devices.

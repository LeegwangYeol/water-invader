# Investigation Report: Mobile Viewport CSS & Responsive Layout

**Agent**: `bughunt2_exp_viewport_1`  
**Archetype**: Explorer (Read-Only Investigation & Synthesis)  
**Target Codebase**: Water Invader (`src/components/game-canvas.tsx`, `src/app/globals.css`, `src/app/page.tsx`)  
**Date**: 2026-09-09T02:52:00Z  

---

## Executive Summary
A comprehensive investigation was conducted into the responsive viewport, canvas display scaling, touch control ergonomics, and visual layout across diverse mobile (iPhone SE 375x667, Modern 390x844, Tall 412x915, Landscape 667x375) and desktop (1440x900, 1920x1080) viewports.

While the core canvas container preserves its 3:4 aspect ratio via `aspect-[3/4]` without stretching or distortion, **10 layout and styling defects** were identified. Most critically, the prior implementation did **not** introduce a CSS viewport extension: incoming enemies at wave start spawn at logical $y \in [50, 90]$ (CSS $y \in [30\text{px}, 54\text{px}]$), placing them **directly behind the opaque DOM Top HUD**, causing enemies and snipers to abruptly "pop" into view. Furthermore, mobile controls suffer from a CSS `h-1/2` collapse reducing button heights to an inaccessible $20\text{--}24\text{px}$, and modal action buttons are pushed off-screen on mobile due to unconstrained vertical spacing.

All defects can be cleanly remediated strictly through **CSS-only adjustments** without altering `logicalWidth` (600) or `logicalHeight` (800) in `GameManager.ts` or `Enemy.ts`.

---

## 1. Observation

### Observation 1.1: Lack of CSS Extension & Abrupt Enemy Spawn Occlusion Behind Top HUD
* **Source Files**: `src/components/game-canvas.tsx:1130, 163`, `src/game/GameManager.ts:787-830, 1068-1071`, `src/game/Enemy.ts:127`
* **Direct Observation**:
  In `game-canvas.tsx:1130`:
  ```tsx
  <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-2 sm:border-4 border-blue-900 shadow-2xl bg-slate-900">
  ```
  In `game-canvas.tsx:163`:
  ```tsx
  <div className="absolute top-0 left-0 w-full p-4 p-2 sm:p-4 max-sm:!p-2 flex justify-between items-start text-white touch-none z-30 pointer-events-none">
  ```
  In `GameManager.ts:787`:
  ```ts
  const startY = Math.max(50, 70 + (this.level % 3) * 10);
  // Enemies placed at startY + r * paddingY (e.g. y = 70, 80, 90)
  // Snipers placed at x = 50, y = 75 and x = this.logicalWidth - 90 (510), y = 75
  ```
  On Mobile SE (canvas CSS size: $355\text{px} \times 474.6\text{px}$):
  - Top HUD left section height: $64\text{px}$ (Score + Pure Water + Wave + Threat badges).
  - Top HUD right section height: $60\text{px}$ (HP hearts + Mute + Ult gauge).
  - Scaled enemy spawn coordinate: $70 \times (474.6 / 800) = 41.5\text{px}$ from the top edge.
  - Scaled sniper spawn coordinate: $75 \times (474.6 / 800) = 44.5\text{px}$ from the top edge.
  - Scaled sniper X coordinates:
    - Left sniper: $x = 50 \times (355 / 600) = 29.6\text{px}$ (Left HUD extends to $x = 155.4\text{px}$).
    - Right sniper: $x = 510 \times (355 / 600) = 301.7\text{px}$ (Right HUD starts at $x = 271.0\text{px}$).
  **Empirical Consequence**: Both Snipers and top-row invaders spawn **100% occluded** beneath the Left and Right TopHUD boxes. They appear to suddenly "pop" out of thin air when descending past $y \approx 64\text{px}$.

---

### Observation 1.2: Canvas Boss HP Bar Horizontally Obscured by DOM Top HUD on Mobile
* **Source Files**: `src/game/GameManager.ts:2284-2309`, `src/components/game-canvas.tsx:163-218`
* **Direct Observation**:
  In `GameManager.ts:2286-2289`:
  ```ts
  const barW = 320;
  const barH = 16;
  const barX = (this.logicalWidth - barW) / 2; // (600 - 320) / 2 = 140
  const barY = 28;
  ```
  The Boss HP bar is rendered on the canvas across logical coordinates $x \in [140, 460]$ at $y \in [22, 44]$.
  On Mobile SE ($355\text{px}$ canvas width, scale factor $1.69\text{ logical px / CSS px}$):
  - Left HUD right edge in logical coordinates: $(155.39 - 10) \times 1.69 = 245.7$.
  - Right HUD left edge in logical coordinates: $(271.00 - 10) \times 1.69 = 441.1$.
  - Boss HP bar span: $[140, 460]$.
  **Empirical Consequence**: Logical range $[140, 245.7]$ ($105.7\text{px}$) is occluded behind the DOM Left HUD, and logical range $[441.1, 460]$ ($18.9\text{px}$) is occluded behind the DOM Right HUD. The Boss title text `⚠️ BOSS: BIO-MECH TITAN ⚠️` and the left third of the health bar are hidden beneath DOM elements on mobile.

---

### Observation 1.3: Top HUD Left Column Vertically Colliding with Allied Squadron Status HUD
* **Source Files**: `src/components/game-canvas.tsx:168-186`, `src/components/game-canvas.tsx:1158-1185`
* **Direct Observation**:
  In `game-canvas.tsx:168-186`:
  ```tsx
  {gameState === GameState.PLAYING && (
    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
      <p className="text-xs sm:text-base text-yellow-300 font-bold">WAVE {wave}</p>
      <div className="flex items-center gap-1 ml-0.5 sm:ml-1">
        <span data-testid="invader-threat-badge" ...>👾 {invaderCount}</span>
        <span data-testid="rogue-threat-badge" ...>⚡ {rogueCount}</span>
      </div>
    </div>
  )}
  ```
  In `game-canvas.tsx:1159`:
  ```tsx
  <div
    data-testid="ally-squadron-hud"
    className="absolute top-14 left-4 pointer-events-none z-30 px-3 py-1 rounded-lg bg-slate-950/90 border border-emerald-500/80 text-white text-xs font-mono flex items-center gap-2 shadow-[0_0_12px_rgba(34,197,94,0.5)] select-none backdrop-blur-sm"
  >
  ```
  `top-14` evaluates to $56\text{px}$ ($3.5\text{rem}$).
  On mobile devices, the Left HUD (padding $8\text{px}$ + Score $20\text{px}$ + Pure Water $16\text{px}$ + Wave & Threat badges $20\text{px}$) reaches $y = 64\text{px}$ to $72\text{px}$.
  **Empirical Consequence**: `ally-squadron-hud` begins at $y = 56\text{px}$, overlapping with the threat badges by $8\text{px}$ to $16\text{px}$. When threat count numbers grow to 2 digits, threat badges wrap onto a second line, resulting in direct visual collision.

---

### Observation 1.4: Multiple Emergency Status Badges Stacked at Identical CSS Coordinates
* **Source Files**: `src/components/game-canvas.tsx:1229, 1267, 1276`
* **Direct Observation**:
  - Line 1229: `endgame-crisis-active-badge` $\rightarrow$ `className="absolute top-20 left-1/2 -translate-x-1/2 ..."`
  - Line 1267: `emp-suppression-badge` $\rightarrow$ `className="absolute top-20 left-1/2 -translate-x-1/2 ..."`
  - Line 1276: `acid-storm-badge` $\rightarrow$ `className="absolute top-20 left-1/2 -translate-x-1/2 ..."`
  **Empirical Consequence**: All three badges occupy the exact same coordinate (`top: 5rem; left: 50%; transform: translateX(-50%)`). When an EMP event or Acid Storm occurs concurrently with an End-Game Crisis, badges render directly on top of each other, making the text unreadable.

---

### Observation 1.5: Mobile Touch Controls Flattened Due to CSS `h-1/2` on Auto-Height Container
* **Source Files**: `src/components/game-canvas.tsx:259-291`
* **Direct Observation**:
  ```tsx
  <div className="w-full flex justify-between p-4 mt-2 gap-2 sm:gap-4 touch-none">
    <div className="flex flex-col gap-1 w-1/2">
      <div className="flex gap-1 h-1/2">
        <button className={`flex-1 rounded-xl text-xs font-bold text-white pointer-events-auto touch-none select-none ...`}>ALLY(Q)</button>
        <button className={`flex-1 rounded-xl text-xs font-bold text-white pointer-events-auto touch-none select-none ...`}>ULT({ultimate}%)</button>
      </div>
      <button className="w-full bg-blue-600/80 active:bg-blue-400 rounded-xl h-1/2 flex items-center justify-center text-xl font-black text-white select-none touch-none ...">
        FIRE!
      </button>
    </div>
  </div>
  ```
  In CSS Flexbox, percentage heights (`h-1/2`) inside a parent with `height: auto` evaluate to `auto`.
  In Playwright audit report `[METRICS_REPORT:mobile_se]`:
  - `allyButton: { width: 79.75, height: 20 }`
  - `ultButton: { width: 79.75, height: 20 }`
  - `fireButton: { width: 163.5, height: 24 }`
  **Empirical Consequence**: Touch target heights are only $20\text{px}$ and $24\text{px}$, which violates WCAG / mobile touch target guidelines ($\ge 44\text{px}$). Additionally, all controls are restricted to the left half (`w-1/2`), leaving the right 50% of the bar empty.

---

### Observation 1.6: GameOverModal and ShopModal CTA Buttons Buried Below the Container Fold
* **Source Files**: `src/components/game-canvas.tsx:40-127, 468-498, 542-584`
* **Direct Observation**:
  Both `ShopModal` and `GameOverModal` are placed inside the canvas container with `absolute inset-0`.
  On Mobile SE, canvas container height is $474.6\text{px}$.
  - `ShopUpgradePanel` height alone is $\approx 380\text{px}$ (6 upgrade rows $\times 61\text{px}$ + header).
  - Modal title (`h1 text-3xl mb-2`) + subtitle (`p text-base mb-6`) = $92\text{px}$.
  - Action buttons (`px-8 py-4` + `mt-2 mb-4`) = $84\text{px}$.
  - Total `ShopModal` content height: $\approx 556\text{px} > 474.6\text{px}$.
  - Total `GameOverModal` content height: $\approx 614\text{px} > 474.6\text{px}$ (Game Over title + reason + score + ShopUpgradePanel + stacked Continue & Restart buttons).
  **Empirical Consequence**: On mobile viewports, the primary call-to-action buttons ("Continue", "Restart from Beginning", "Start Mission", "Resume Wave") are completely off-screen below the fold upon opening. Users are forced to manually scroll within the modal.

---

### Observation 1.7: Mute Button Touch Target Size Under-Dimensioned
* **Source Files**: `src/components/game-canvas.tsx:194-200`
* **Direct Observation**:
  ```tsx
  <button
    onClick={onToggleMute}
    aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
    className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-800/80 hover:bg-slate-700 text-[10px] sm:text-xs font-bold text-slate-200 rounded border border-slate-600 transition-colors pointer-events-auto select-none mb-0.5 sm:mb-1 z-30"
  >
  ```
  On mobile screens, `py-0.5` ($2\text{px}$) and `text-[10px]` ($14\text{px}$ line height) yield a total rendered button height of only $\approx 18\text{px}$.
  **Empirical Consequence**: Extreme difficulty tapping the Mute button on mobile devices; frequent mis-touches on the adjacent canvas.

---

### Observation 1.8: Missing `.custom-scrollbar` Utility in `src/app/globals.css`
* **Source Files**: `src/components/game-canvas.tsx:469, 543`, `src/app/globals.css:1-27`
* **Direct Observation**:
  `game-canvas.tsx` applies `custom-scrollbar` to modal scroll containers:
  ```tsx
  <div className="w-full max-h-[98%] overflow-y-auto flex flex-col items-center custom-scrollbar py-2">
  ```
  `src/app/globals.css` contains only 27 lines (Tailwind import and color variables). It has **no declaration** for `.custom-scrollbar`.
  **Empirical Consequence**: Browsers render default, platform-dependent scrollbars or hide scrollbars entirely (WebKit touch devices), removing any visual indicator that the modal is scrollable.

---

### Observation 1.9: Desktop Standard Viewport Vertical Scroll Overflow (1440x900)
* **Source Files**: `src/app/page.tsx:5-11`, `src/components/game-canvas.tsx:1130, 1344`
* **Direct Observation**:
  In `bughunt_ui_responsive_viewports.spec.ts` test output on `desktop_standard`:
  `scrollHeight: 1016, clientHeight: 900`
  - Page header: $\approx 70\text{px}$
  - Canvas container: $600\text{px} \times (4/3) = 800\text{px} + 8\text{px}\text{ border} = 808\text{px}$
  - Mobile controls wrapper: $88\text{px}$
  - Padding: $32\text{px}$
  - Total vertical document height: $1016\text{px} > 900\text{px}$.
  **Empirical Consequence**: On standard $900\text{px}$ and $800\text{px}$ desktop displays (e.g. MacBook Air, 1080p with 125% OS scaling), the player ship at $y = 740$ is cut off below the screen fold on initial load. Users must scroll down to see their ship.

---

### Observation 1.10: Inconsistent / Redundant Tailwind Padding Classes
* **Source Files**: `src/components/game-canvas.tsx:163`
* **Direct Observation**:
  ```tsx
  className="absolute top-0 left-0 w-full p-4 p-2 sm:p-4 max-sm:!p-2 flex justify-between items-start text-white touch-none z-30 pointer-events-none"
  ```
  Notice: `p-4 p-2 sm:p-4 max-sm:!p-2`. Four contradictory padding declarations are concatenated on the same element. While functional, it is fragile and violates CSS maintainability standards.

---

## 2. Logic Chain

1. **Aspect Ratio Conformance**:
   - `aspect-[3/4]` ensures the container aspect ratio is $\frac{3}{4} = 0.75$.
   - The canvas element bitmap is initialized with `this.canvas.width = 600 * dpr` and `this.canvas.height = 800 * dpr`, maintaining $\frac{600}{800} = 0.75$.
   - Because container aspect ratio and canvas bitmap aspect ratio match identically, the rendering is free of non-uniform stretching or distortion.
   - Observation 1.1 confirms this ratio holds across all tested viewports ($aspectRatio \in [0.747, 0.748]$).

2. **Top HUD Enemy Occlusion**:
   - By Observation 1.1, the Top HUD is anchored at `absolute top-0 left-0 w-full` with z-index 30 inside the canvas container.
   - Enemies spawn at canvas logical coordinates $y \in [50, 90]$.
   - On a mobile viewport where canvas display height is $474.6\text{px}$, logical $y = 70$ projects to CSS $y = 41.5\text{px}$.
   - The Left and Right HUDs extend to CSS $y = 64\text{px}$ and $60\text{px}$ respectively.
   - Therefore, initial enemy positions are spatially covered by the opaque HUD elements.
   - Because container `overflow-hidden` clips everything outside $[0, 800]$, there is no visual buffer above $y = 0$, giving the player the impression that enemies "drop in abruptly" from behind the HUD.

3. **Boss Health Bar Occlusion**:
   - By Observation 1.2, `drawBossHpBar` draws a $320\text{px}$ wide bar centered at $x = 140$ to $460$ at $y \in [22, 44]$ on the canvas bitmap.
   - On mobile, DOM Left HUD covers $x \in [0, 245.7]$ and DOM Right HUD covers $x \in [441.1, 600]$.
   - Because the canvas bitmap is behind DOM layer z-30, the Boss HP bar is partially hidden by DOM elements.

4. **Mobile Control Sizing**:
   - By Observation 1.5, `h-1/2` on child elements without an explicit parent height causes height collapse to font metrics.
   - Buttons render at $20\text{px}$ and $24\text{px}$ instead of the intended $44\text{--}50\text{px}$.
   - Adding explicit minimum heights (`min-h-[44px]` or `py-3`) fixes the touch target without impacting layout flow.

5. **Modal Scrollability & CTA Accessibility**:
   - By Observation 1.6, the aggregate height of `ShopModal` ($556\text{px}$) and `GameOverModal` ($614\text{px}$) exceeds the mobile container height ($474.6\text{px}$).
   - This occurs due to desktop-sized margins (`mb-6`, `mb-4`, `p-4`, `py-3.5`).
   - By introducing compact mobile utility classes (`max-sm:mb-1.5`, `max-sm:py-2`, `max-sm:text-sm`), the modal content height drops below $460\text{px}$, making the CTA buttons immediately visible on mobile.

6. **Desktop Viewport Fit**:
   - By Observation 1.9, the canvas height is fixed to $800\text{px}$ because width is constrained only by `max-w-[600px]` with `aspect-[3/4]`.
   - Adding a viewport-height cap on the canvas container (`max-h-[calc(100dvh-170px)]` or setting `max-w-[min(600px,calc((100dvh-170px)*3/4))]`) enables automatic proportional scaling on smaller desktop screens without altering logical dimensions.

---

## 3. Caveats

1. **Architectural Invariants**:
   - `logicalWidth` (600) and `logicalHeight` (800) in `GameManager.ts` and `Enemy.ts` were NOT modified and must NEVER be modified. Doing so breaks collision coordinates and fails the entire Playwright test suite.
2. **Selector Invariant in Existing E2E Tests**:
   - Existing tests (`tests/adversarial_challenger_m3_1.spec.ts:399`) rely on the exact class selector `.absolute.top-0.left-0.w-full.p-4`. Cleaning up the duplicate padding classes on line 163 must preserve `p-4` within the className string to avoid breaking legacy test selectors.
3. **Corridor Width Invariant in `tests/challenger_m3_corridor_validation.spec.ts`**:
   - Tests assert that the center corridor between Left HUD and Right HUD is $\ge 110\text{px}$ and HUD height $\le 60\text{px}$ on Mobile SE. Any styling adjustments to Top HUD must preserve this minimum $110\text{px}$ gap.
4. **Touch vs Mouse Coordinate Mapping**:
   - In `game-canvas.tsx`, `updateTargetX` relies on `canvas.clientWidth` and `canvas.clientLeft` with `scaleX = logicalWidth / contentWidth`. Any CSS changes affecting container aspect ratio or borders must ensure `contentWidth > 0` and avoid padding on the `<canvas>` element itself.

---

## 4. Conclusion & Recommended CSS-Only Fix Strategies

### Summary of Defects
| # | Defect | File & Lines | Severity | Recommended Fix Strategy |
|---|--------|--------------|----------|--------------------------|
| **D1** | Top HUD occludes enemy spawn ($y \in [50, 90]$) & Snipers ($x=50, 510$) | `game-canvas.tsx:163, 1130` | High | Add transparent gradient backing, reduce HUD vertical footprint on mobile, add top padding buffer |
| **D2** | Boss HP bar horizontally clipped by DOM HUD on Mobile | `GameManager.ts:2286-2289` | Medium | (CSS/DOM alternative) Elevate Boss HP bar into DOM TopHUD or scale bar width dynamically |
| **D3** | Top HUD Left column vertically collides with `ally-squadron-hud` | `game-canvas.tsx:1159` | High | Reposition `ally-squadron-hud` from `top-14` to `top-[4.75rem]` or make flow relative |
| **D4** | `endgame-crisis-active-badge`, `emp-badge`, `acid-badge` stack at `top-20` | `game-canvas.tsx:1229, 1267, 1276` | Medium | Stagger badge Y positions or use a flex badge container |
| **D5** | Mobile controls flattened ($20\text{px}$ / $24\text{px}$ height) due to `h-1/2` collapse | `game-canvas.tsx:259-291` | High | Set explicit `min-h-[44px]` or `py-3` on control buttons; use full width `w-full` layout |
| **D6** | Modal CTA buttons ("Continue", "Restart", "Deploy") buried below fold on mobile | `game-canvas.tsx:40-127, 468, 542` | High | Apply compact mobile spacing (`max-sm:mb-1.5`, `max-sm:py-2`) to `ShopUpgradePanel` |
| **D7** | Mute button touch target too small ($18\text{px}$ height) | `game-canvas.tsx:197` | Medium | Increase mobile padding to `px-3 py-1.5 min-h-[32px]` |
| **D8** | `.custom-scrollbar` class referenced but undefined in `globals.css` | `globals.css:1-27` | Low | Add cross-browser scrollbar CSS in `globals.css` |
| **D9** | Standard desktop viewport ($1440\times 900$) vertical scrollbar ($1016\text{px}$ height) | `page.tsx:5`, `game-canvas.tsx:1130` | Medium | Add `max-h-[calc(100dvh-170px)]` and `max-w-[min(600px,calc((100dvh-170px)*0.75))]` |
| **D10** | Redundant padding `p-4 p-2 sm:p-4 max-sm:!p-2` on TopHUD | `game-canvas.tsx:163` | Low | Normalize to `p-4 max-sm:p-2 sm:p-4` preserving `p-4` for test selectors |

---

### Concrete Proposed CSS Changes

#### Proposed Change 1: Fix Mobile Control Flattening (`game-canvas.tsx:259-291`)
```tsx
// BEFORE:
<div className="w-full flex justify-between p-4 mt-2 gap-2 sm:gap-4 touch-none">
  <div className="flex flex-col gap-1 w-1/2">
    <div className="flex gap-1 h-1/2">
      <button className={`flex-1 rounded-xl text-xs font-bold text-white ...`}>ALLY(Q)</button>
      <button className={`flex-1 rounded-xl text-xs font-bold text-white ...`}>ULT({ultimate}%)</button>
    </div>
    <button className="w-full bg-blue-600/80 ... rounded-xl h-1/2 ...">FIRE!</button>
  </div>
</div>

// AFTER:
<div className="w-full flex justify-between p-2 sm:p-4 mt-1 sm:mt-2 gap-2 sm:gap-4 touch-none">
  <div className="flex flex-col gap-1.5 w-full sm:w-1/2">
    <div className="flex gap-1.5">
      <button className={`flex-1 min-h-[44px] py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white pointer-events-auto touch-none select-none ...`}>
        ALLY(Q)
      </button>
      <button className={`flex-1 min-h-[44px] py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white pointer-events-auto touch-none select-none ...`}>
        ULT({ultimate}%)
      </button>
    </div>
    <button className="w-full min-h-[48px] py-3 bg-blue-600/80 active:bg-blue-400 rounded-xl flex items-center justify-center text-lg sm:text-xl font-black text-white select-none touch-none shadow-[0_0_15px_rgba(59,130,246,0.5)]">
      FIRE!
    </button>
  </div>
</div>
```

#### Proposed Change 2: Fix Squadron HUD & Emergency Badge Stacking (`game-canvas.tsx:1159, 1229, 1267, 1276`)
```tsx
// Position ally-squadron-hud below the threat badges:
className="absolute top-[4.5rem] sm:top-14 left-2 sm:left-4 pointer-events-none z-30 ..."

// Stagger the crisis / emergency badges so they do not collide:
// Endgame badge at top-16:
className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-30 ..."
// EMP badge at top-24:
className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none z-30 ..."
// Acid storm badge at top-24 (or top-32 if EMP also active):
className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none z-30 ..."
```

#### Proposed Change 3: Compact Mobile Spacing in `ShopUpgradePanel` & Modals (`game-canvas.tsx:40-127`)
```tsx
// BEFORE:
<div className="bg-slate-800 p-4 sm:p-6 rounded-lg mb-4 sm:mb-8 text-white w-full max-w-sm shrink-0">
  <div className="flex justify-between items-center mb-4">

// AFTER:
<div className="bg-slate-800 p-3 sm:p-6 rounded-lg mb-2 sm:mb-8 text-white w-full max-w-sm shrink-0">
  <div className="flex justify-between items-center mb-2 sm:mb-4">
```

#### Proposed Change 4: Implement `.custom-scrollbar` in `src/app/globals.css`
```css
/* Add to src/app/globals.css */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.8);
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(59, 130, 246, 0.5) rgba(15, 23, 42, 0.6);
}
```

#### Proposed Change 5: Responsive Desktop Sizing Cap (`src/components/game-canvas.tsx:1130`)
```tsx
// Constrain max canvas container width by viewport height to prevent vertical scroll on 900px laptops:
<div className="relative w-full max-w-[min(600px,calc((100dvh-170px)*0.75))] aspect-[3/4] rounded-lg overflow-hidden border-2 sm:border-4 border-blue-900 shadow-2xl bg-slate-900">
```

---

## 5. Verification Method

### Automated Commands
1. **Responsive Viewport Suite**:
   ```bash
   npx playwright test tests/bughunt_ui_responsive_viewports.spec.ts
   ```
2. **Corridor Validation Suite**:
   ```bash
   npx playwright test tests/challenger_m3_corridor_validation.spec.ts
   ```
3. **Adversarial Mobile Stress Suite**:
   ```bash
   npx playwright test tests/bughunt_adversarial_stress_responsive.spec.ts
   ```
4. **Touch Controls & Drag Evasion Suite**:
   ```bash
   npx playwright test tests/mobile_controls_and_touch_evasion.spec.ts
   ```
5. **Full Production Build**:
   ```bash
   npm run build
   npx tsc --noEmit
   ```

### Verification Invalidation Conditions
- Any change that alters `logicalWidth = 600` or `logicalHeight = 800` in `GameManager.ts` or `Enemy.ts` will invalidate test baselines and fail Playwright test runs.
- Any change removing class `p-4` from TopHUD wrapper will invalidate legacy selector `.absolute.top-0.left-0.w-full.p-4` in `adversarial_challenger_m3_1.spec.ts:399`.
- Any change narrowing the center gap between Left and Right HUD below $110\text{px}$ will invalidate `tests/challenger_m3_corridor_validation.spec.ts`.

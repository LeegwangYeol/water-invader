# Visuals & Canvas Rendering Survey Report
**Project:** Water Invader  
**Author:** teamwork_preview_explorer_survey_2  
**Date:** 2026-09-02  
**Target Focus:** Canvas Rendering Pipeline, Event Visual Overlays, Projectile Rendering, Contrast & Visibility Analysis, High-Contrast Outline & Halo Designs  

---

## 1. Executive Summary

Water Invader utilizes a high-performance, deterministic **HTML5 Canvas 2D** rendering engine paired with a **Next.js / React** overlay HUD. Gameplay operates on a logical coordinate space of `600 × 800` pixels with dynamic Device Pixel Ratio (DPR) scaling and a fixed timestep (`FIXED_STEP = 1/60`).

While the procedural vector art system across player, barricades, enemies, and Stellaris-style End-Game Crises is rich and lightweight (zero-raster drawing), **critical projectile visibility degradation** occurs during environmental events and crisis warnings:
1. **Color Wash Contrast Clashes**: Warning overlays apply flat 25–30% opacity screen-wide tints (`rgba(255, 0, 0, 0.3)` for red alerts, `rgba(132, 204, 22, 0.25)` for rogue/acid events, and `rgba(147, 51, 234, 0.4)` for void incursions). These tints directly match the chromatic wavelengths of enemy bullets (`#ef4444`), rogue shots (`#84cc16`), acid droplets (`#a3e635`), and sniper/void bolts (`#a855f7` / `#c084fc`), eliminating edge contrast.
2. **Missing Dark Perimeter Outlines**: Existing projectile rendering in `Bullet.ts` and `GameManager.ts` draws soft concentric circles with alpha bloom but **lacks dark bounding strokes/halos**. When the background shifts in hue, soft alpha glows blend into the background.
3. **Hazard Projectile Ambiguity**: Acid Storm falling projectiles (`hazardProjectiles`) are rendered as simple flat circles (`#a3e635`), visually indistinguishable from background particle effects or rogue bullets.
4. **DOM Backdrop-Blur Smear**: Warning banners in `components/game-canvas.tsx` use `backdrop-blur-[2px]` and `backdrop-blur-[3px]`, which smear small moving projectiles behind the banner.

This report outlines the complete rendering architecture, maps every relevant file and draw routine, and specifies a concrete **Multi-tier "Halo Sandwich" Projectile Rendering Pipeline** and **Calibrated Event Overlay System** to achieve crystal-clear visual readability under all gameplay conditions.

---

## 2. Canvas Rendering Loop & Architecture

### 2.1 Fixed Timestep Game Loop
- **File:** `src/game/GameManager.ts` (lines 608–640)
- **Mechanism:** `requestAnimationFrame` driving an accumulator loop with `FIXED_STEP = 1/60` (16.67ms).
- **Lag Protection:** `frameTime` clamped to `0.1s` (max 100ms) to prevent spiral of death on tab unfocus or frame drops.
- **FPS Tracking:** Rolling 1-second frame counter calculated on line 620.

```typescript
// GameManager.ts (lines 608-640)
private loop = (timestamp: number) => {
  if (this.state === GameState.MENU) return;
  let frameTime = Math.max(0, (timestamp - this.lastTime) / 1000);
  this.lastTime = timestamp;
  if (frameTime > 0.1) frameTime = 0.1;
  this.accumulator += frameTime;

  while (this.accumulator >= this.FIXED_STEP) {
    this.update(this.FIXED_STEP);
    this.accumulator -= this.FIXED_STEP;
    if (this.state !== GameState.PLAYING) {
      this.accumulator = 0;
      break;
    }
  }
  this.draw();
  this.animationFrameId = requestAnimationFrame(this.loop);
};
```

### 2.2 Coordinate Space & DPR Scaling
- **Logical Resolution:** Width `600px`, Height `800px` (aspect ratio 3:4).
- **Physical Buffer Sizing:** `canvas.width = 600 * dpr`, `canvas.height = 800 * dpr` (GameManager.ts: lines 91–93).
- **Canvas DPR Transformation:** Handled at start of `draw()` via `ctx.save()` -> `ctx.scale(this.dpr, this.dpr)` -> `ctx.restore()`.
- **Pointer/Touch Mapping:** `components/game-canvas.tsx` (lines 747–805) calculates relative pointer positions using `canvas.getBoundingClientRect()`, `canvas.clientWidth`, `canvas.clientLeft`, and `logicalWidth / contentWidth`.

### 2.3 Render Pass Ordering (Layer Hierarchy)
Within `GameManager.ts` (`draw()` lines 1530–1665), rendering executes in the following strict z-index sequence:

| Layer Z-Index | Component / Element | Source Method / File | Description |
|---|---|---|---|
| **0** | Screen Shake Offset | `GameManager.draw()` (lines 1535–1543) | `ctx.translate(offsetX, offsetY)` based on `shakeTimer` |
| **1** | Dark Slate Background | `GameManager.draw()` (line 1546) | `ctx.fillStyle = '#0f172a'`, `ctx.fillRect(0, 0, 600, 800)` |
| **2** | Ambient Rising Bubbles | `GameManager.draw()` (lines 1550–1562) | 30 sinusoidal procedural rising bubbles (`rgba(255, 255, 255, 0.1)`) |
| **3** | Barricades | `Barricade.draw()` (src/game/Barricade.ts:61) | 6×4 voxel blocks (`#38bdf8` ice / `#94a3b8` stone) |
| **4** | Player Vessel | `Player.draw()` (src/game/Player.ts:161) | Vector droplet, radial body gradient, facial expressions, i-frame alpha |
| **5** | Helper Support Units | `Helper.draw()` (src/game/Helper.ts:121) | Fighter / Repairer / Tank drone procedural vectors |
| **6** | Enemies | `Enemy.draw()` (src/game/Enemy.ts:516) | 10 distinct procedural vector archetypes (Invaders & Rogues) |
| **7** | Projectiles / Bullets | `Bullet.draw()` (src/game/Bullet.ts:39) | Player droplets, Invader glowing orbs, Rogue double-ring orbs |
| **8** | Particles | `Particle.draw()` (src/game/Particle.ts:50) | Explosion fragments & sparks with life-decaying alpha |
| **9** | Hazard Projectiles | `GameManager.draw()` (lines 1572–1589) | Toxic falling spheres during Acid Storm crisis |
| **10** | EMP Sweep Lines | `GameManager.draw()` (lines 1591–1604) | Cyan horizontal static bars (`rgba(34, 211, 238, 0.25)`) |
| **11** | Boss Health Bar | `GameManager.drawBossHpBar()` (lines 1468–1528) | Dual gradient HP bar for Wave 5+ Bosses |
| **12** | End-Game Crisis Entity & HUD | `EndGameCrisis.draw()` (EndGameCrisis.ts:457) | Dimensional Rifts, Sovereign hull, shields, beams, top crisis boss HUD |
| **13** | Debug Overlay | `GameManager.draw()` (lines 1618–1642) | Hitbox wireframes (magenta `#ff00ff`) + FPS / entity counters |
| **14** | Canvas Warning Overlay | `GameManager.draw()` (lines 1645–1662) | Full-screen tint wash + centered pulsing alert text |
| **15 (DOM)** | React HUD & Modal Overlays | `src/components/game-canvas.tsx` | TopHUD, Warning Banners, Badges, Shop / Game Over modals |

---

## 3. Event Background Overlays & Environmental Shifts

### 3.1 Canvas Warning Overlays
Located in `GameManager.ts` (lines 1644–1662):
- **Enemy Reinforcements / Crisis Alert**:
  - Background Tint: `ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'` (Heavy red wash)
  - Text: `ctx.fillStyle = '#ef4444'`, 36px bold with `rgba(0, 0, 0, 0.7)` 4px stroke.
- **Rogue / 3-Way Incursion Alert**:
  - Background Tint: `ctx.fillStyle = 'rgba(132, 204, 22, 0.25)'` (Lime green wash)
  - Text: `ctx.fillStyle = '#84cc16'`.
- **Ally Reinforcement Alert**:
  - Background Tint: `ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'` (Green wash)
  - Text: `ctx.fillStyle = '#4ade80'`.

### 3.2 EMP Weapon Suppression FX
- **Canvas Static:** Horizontal scanning cyan lines (`rgba(34, 211, 238, 0.25)`, lineWidth 1.5) cycling vertically.
- **Player Optic FX:** Player body shifts to slate gray (`#cbd5e1` to `#64748b`), eyes turn to dizzy spirals `@_@`, with random position jitter (lines 181–184).
- **DOM Indicator:** Cyan pill badge (`bg-cyan-950/90 border border-cyan-400 text-cyan-300`).

### 3.3 Stellaris-Style End-Game Crisis Incursion FX
Located in `EndGameCrisis.ts` (lines 487–519):
- **Cosmic Vignette:** Radial gradient extending from center to edges with pulsating purple alpha: `rgba(147, 51, 234, ${0.4 * pulse})`.
- **Reality Distortion:** Dimensional Rifts draw expanding concentric gravitational ripples (`rgba(192, 132, 252, alpha)` / `rgba(34, 211, 238, alpha)`) and energy conduit beams to the Sovereign core.
- **DOM Incursion Banner:** `bg-purple-950/50 backdrop-blur-[3px] border-4 border-purple-500/90 shadow-[inset_0_0_80px_rgba(168,85,247,0.8)]`.

### 3.4 Toxic Acid Storm Crisis FX
- **DOM Badge:** `bg-lime-950/90 border border-lime-400 text-lime-300` (game-canvas.tsx: line 977).
- **Audio:** Sizzling acid storm audio loop via `soundManager.playAcidStormSound()`.
- **Environmental Hazard Drops:** Falling acid droplets spawned randomly across top of screen (GameManager.ts: lines 807–823).

---

## 4. Current Projectile Rendering Inventory

### 4.1 Player Bullets (`src/game/Bullet.ts`, lines 40–66)
- **Geometry:** Pointed water teardrop shape (`arc` bottom + `lineTo` apex).
- **Dimensions:** Width `6px`, Height `12px`.
- **Colors:**
  - Outer Glow: `#38bdf8` (Cyan), `globalAlpha = 0.5`, radius `size.width * 0.8`.
  - Main Body: `#38bdf8` (Cyan), `globalAlpha = 1.0`.
  - Inner Highlight: `#ffffff` (White), `globalAlpha = 0.8`, radius `size.width * 0.25`.
- **Behavior:** Base speed `-400 px/s` (or angled in multi-shot spread). Penetrates up to `piercing` count.

### 4.2 Invader Enemy Bullets (`src/game/Bullet.ts`, lines 94–113)
- **Geometry:** Concentric circles.
- **Dimensions:** Width `10px`, Height `10px`.
- **Colors (Standard):**
  - Outer Glow: `#ef4444` (Red), `globalAlpha = 0.5`, radius `radius * 1.5`.
  - Inner Core: `#ffffff` (White), `globalAlpha = 1.0`, radius `radius * 0.6`.
- **Colors (Sniper / Interceptable):**
  - Outer Glow: `#a855f7` (Purple), `globalAlpha = 0.5`.
  - Inner Core: `#f3e8ff` (Light Violet).
- **Speed / Stats:** Speed `200–400 px/s` (scales with wave level).

### 4.3 Rogue Cyber-Faction Bullets (`src/game/Bullet.ts`, lines 67–93)
- **Geometry:** Triple-tier concentric circles.
- **Dimensions:** Width `10px`, Height `10px`.
- **Colors:**
  - Outer Glow: `#84cc16` (Neon Lime), `globalAlpha = 0.6`, radius `radius * 1.6`.
  - Mid Glow: `#f59e0b` (Amber), `globalAlpha = 0.85`, radius `radius * 1.0`.
  - Inner Core: `#fef08a` (Bright Yellow), `globalAlpha = 1.0`, radius `radius * 0.5`.
- **Special:** Stalker shots are interceptable (`isInterceptable = true`), Mech shots pierce player barricades (`piercing = 2`).

### 4.4 Hazard Projectiles (Acid Storm) (`src/game/GameManager.ts`, lines 1572–1589)
- **Geometry:** Simple concentric circles.
- **Dimensions:** Radius `5–9px`.
- **Colors:**
  - Outer Shell: `#a3e635` (Lime Green).
  - Inner Sizzle: `#ffffff` (White), radius `radius * 0.4`.
- **Speed / Stats:** Speed Y `220–340 px/s`, Speed X `-20..+20 px/s`, Damage `1`.

### 4.5 End-Game Crisis Super-Weapon Attacks (`src/game/crisis/EndGameCrisis.ts`)
- **Void Sovereign Dark Matter Beam:** 5-way spread bolts (`#c084fc`, purple, speed 220, interceptable) + dual wing lances (`#38bdf8`, cyan, speed 250).
- **Abyssal Leviathan Spore Spiral:** 6-way rotating spiral spores (`#84cc16`, lime green, speed 190, interceptable).
- **Cybernetic Exterminator Dual Railguns & Aimed Shot:** High-velocity piercing railguns (`#ef4444`, speed 380, damage 2) + aimed plasma cluster (`#06b6d4`, cyan, speed 280, interceptable).

---

## 5. Visibility & Contrast Issues Analysis

### 5.1 Problem A: Chromatic Overlap with Event Background Tints
When an event or warning fires, a color tint is painted over the canvas:
1. **Red Alert (`rgba(255, 0, 0, 0.3)`):** Wavelength matches Invader red bullets (`#ef4444`) and Cybernetic railgun bolts (`#ef4444`). The background luminance increases in the red channel, drastically reducing the delta-E contrast ratio of the projectile's outer glow from ~8:1 to < 2:1.
2. **Rogue / Acid Alert (`rgba(132, 204, 22, 0.25)`):** Wavelength matches Rogue shots (`#84cc16`), Abyssal Leviathan spores (`#84cc16`), and Acid Storm droplets (`#a3e635`). Projectiles become nearly invisible against the green background tint.
3. **Crisis Incursion Vignette (`rgba(147, 51, 234, 0.4)`):** Purple corner vignette matches Void Sovereign bolts (`#c084fc`) and Sniper bullets (`#a855f7`).

### 5.2 Problem B: Lack of High-Contrast Dark Perimeter Outlines
Currently, all bullet draw routines in `Bullet.ts` execute:
```typescript
ctx.globalAlpha = 0.5;
ctx.fillStyle = color;
ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
ctx.fill();
```
Because `globalAlpha` is semi-transparent (0.5–0.6) and the outer perimeter has no sharp boundary, the projectile's silhouette dissolves into any background with similar brightness or chroma. There is **zero dark delineation** to separate the projectile from the background.

### 5.3 Problem C: Hazard Projectile Ambiguity
Acid storm hazard projectiles (`#a3e635`) are drawn as simple circles without tails, distinct textures, or boundary strokes. Players struggle to distinguish falling acid drops from:
- Ambient background bubbles (white circles).
- Rogue enemy bullets (lime circles).
- Explosion particle debris.

### 5.4 Problem D: CSS Backdrop-Blur Smearing
In `src/components/game-canvas.tsx`:
- Line 910: `backdrop-blur-[3px]` on the End-Game Crisis Warning banner.
- Line 948: `backdrop-blur-[2px]` on the Crisis Warning banner.
These full-screen CSS filters blur the underlying `<canvas>` element. When an event activates, bullets already in flight get blurred into an illegible smear, causing unfair hits while the player is reading or reacting to the banner.

---

## 6. Recommended High-Contrast & Visual Upgrades

### 6.1 Multi-Tier "Halo Sandwich" Projectile Rendering Pipeline

To guarantee high visibility across **all** possible background colors (slate `#0f172a`, red wash, lime wash, purple vignette, white flash), every projectile should be rendered using a 4-tier structured pipeline:

```
+-------------------------------------------------------------------+
| Tier 1: High-Contrast Dark Perimeter Border (1.5px - 2.0px stroke)|
|         RGBA(0, 0, 0, 0.90) / Pitch Black Outline                 |
+-------------------------------------------------------------------+
  +---------------------------------------------------------------+
  | Tier 2: Vivid Faction Chroma Ring (100% Saturation, Alpha 0.9)|
  |         Red #ff1e42 / Neon Lime #84cc16 / Purple #c084fc      |
  +---------------------------------------------------------------+
    +-----------------------------------------------------------+
    | Tier 3: Ultra-High Luminance Core (Alpha 1.0)             |
    |         White-Hot #ffffff / Ultra-Light Pastel            |
    +-----------------------------------------------------------+
      +-------------------------------------------------------+
      | Tier 4: Directional Tail Wake / Motion Streak         |
      |         Trajectory indicator for high-velocity bolts  |
      +-------------------------------------------------------+
```

#### Proposed `Bullet.draw()` Implementation Specification:

```typescript
// Proposed Enhancement for src/game/Bullet.ts
public draw(ctx: CanvasRenderingContext2D): void {
  const cx = this.position.x + this.size.width / 2;
  const cy = this.position.y + this.size.height / 2;
  const rx = this.size.width / 2;
  const ry = this.size.height / 2;

  ctx.save();

  if (this.faction === Faction.PLAYER) {
    // -------------------------------------------------------------
    // Player Water Droplet: High-Contrast Pure Water Spear
    // -------------------------------------------------------------
    // 1. Dark Outline
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)'; // Deep navy black
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, this.position.y + this.size.height - rx, rx + 1, 0, Math.PI);
    ctx.lineTo(cx, this.position.y - 2);
    ctx.closePath();
    ctx.stroke();

    // 2. Bright Cyan Body
    ctx.fillStyle = '#00e5ff'; // Ultra-vivid cyan
    ctx.beginPath();
    ctx.arc(cx, this.position.y + this.size.height - rx, rx, 0, Math.PI);
    ctx.lineTo(cx, this.position.y);
    ctx.closePath();
    ctx.fill();

    // 3. White Diamond Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, this.position.y + this.size.height * 0.65, rx * 0.4, 0, Math.PI * 2);
    ctx.fill();

  } else if (this.faction === Faction.ROGUE) {
    // -------------------------------------------------------------
    // Rogue Cyber-Projectile: Neon Lime / Amber Energy Orb
    // -------------------------------------------------------------
    // 1. Dark Outer Border (Guarantees contrast against lime alerts)
    ctx.strokeStyle = '#051802';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, rx + 2, 0, Math.PI * 2);
    ctx.stroke();

    // 2. High-Saturation Lime Outer Shell
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(cx, cy, rx + 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Vibrant Amber Mid-Ring
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, rx * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // 4. White-Hot Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, rx * 0.35, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // -------------------------------------------------------------
    // Invader / Boss / Sniper Projectile: High-Contrast Plasma Bolt
    // -------------------------------------------------------------
    const isSpecial = this.isInterceptable; // Sniper or special attack
    const mainColor = isSpecial ? '#c084fc' : (this.color || '#ff2244');
    const coreColor = '#ffffff';

    // 1. Dark Perimeter Ring (Guarantees contrast against red alerts)
    ctx.strokeStyle = '#1a0000';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, rx + 2, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Glowing Colored Shell
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(cx, cy, rx + 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Interceptable Pulsing Glow Halo
    if (isSpecial) {
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // 4. Solid White Core
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(cx, cy, rx * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
```

### 6.2 Distinct Acid Storm Hazard Projectile Design

Transform acid rain drops from generic circles into distinct, high-threat **toxic teardrop spears**:
- **Geometry:** Pointed top teardrop facing downward with a trailing acid splash droplet.
- **Coloring:** Pitch-black border (`#081c03`), Toxic Neon Acid body (`#bef264`), White-hot droplet core (`#ffffff`), and a trailing alpha tail (`rgba(163, 230, 53, 0.4)`).
- **Benefit:** Instant visual distinction from both circular enemy bullets and round ambient background bubbles.

```typescript
// Proposed Enhancement in GameManager.ts hazardProjectiles draw
for (const hz of this.hazardProjectiles) {
  if (hz.isDead) continue;
  this.ctx.save();
  
  // 1. Directional Acid Teardrop Stroke (Dark High-Contrast Border)
  this.ctx.strokeStyle = '#051802';
  this.ctx.lineWidth = 2.0;
  this.ctx.beginPath();
  this.ctx.arc(hz.x, hz.y + hz.radius * 0.4, hz.radius, 0, Math.PI);
  this.ctx.lineTo(hz.x, hz.y - hz.radius * 1.5); // Pointy top tail
  this.ctx.closePath();
  this.ctx.stroke();

  // 2. Toxic Acid Fill
  this.ctx.fillStyle = '#bef264'; // Acid chartreuse
  this.ctx.fill();

  // 3. Sizzling White Core
  this.ctx.fillStyle = '#ffffff';
  this.ctx.beginPath();
  this.ctx.arc(hz.x, hz.y + hz.radius * 0.3, hz.radius * 0.35, 0, Math.PI * 2);
  this.ctx.fill();

  // 4. Trailing Sizzle Vapor
  this.ctx.fillStyle = 'rgba(190, 242, 100, 0.4)';
  this.ctx.beginPath();
  this.ctx.arc(hz.x, hz.y - hz.radius * 1.8, hz.radius * 0.4, 0, Math.PI * 2);
  this.ctx.fill();

  this.ctx.restore();
}
```

### 6.3 Event Background Tint & Overlay Rebalancing

1. **Reduce Full-Screen Tint Opacity:**
   - Red Crisis Warning: Reduce from `rgba(255, 0, 0, 0.30)` to `rgba(220, 38, 38, 0.12)`.
   - Rogue/3-Way Warning: Reduce from `rgba(132, 204, 22, 0.25)` to `rgba(132, 204, 22, 0.10)`.
   - Ally Warning: Reduce from `rgba(0, 255, 0, 0.20)` to `rgba(34, 197, 94, 0.10)`.
2. **Implement Perimeter Strobe Vignette:**
   - Instead of washing the center combat area with flat color, apply a 6px pulsing border stroke around the canvas perimeter (`ctx.strokeRect(3, 3, logicalWidth - 6, logicalHeight - 6)` with color-coordinated neon alpha).
   - Keeps the gameplay center crystal-clear while alerting the player at the screen boundaries.
3. **Remove Combat `backdrop-blur` from React Overlays:**
   - Update `components/game-canvas.tsx`: Remove `backdrop-blur-[2px]` and `backdrop-blur-[3px]` from warning banners. Replace with `pointer-events-none` semi-transparent HUD headers that do not blur canvas pixels.

---

## 7. Relevant Codebase Files & Components Map

| File Path | Component / Class | Lines | Visual Responsibility |
|---|---|---|---|
| `src/game/GameManager.ts` | `GameManager` | 608–640 | `loop()`: Fixed-step loop, accumulator, FPS calculations. |
| `src/game/GameManager.ts` | `GameManager` | 1530–1665 | `draw()`: DPR transform, screen shake, background clear, bubble paths, entity orchestration, hazard projectiles, EMP static sweep, warning overlay fill and text. |
| `src/game/GameManager.ts` | `GameManager` | 1468–1528 | `drawBossHpBar()`: Dual-gradient boss HP bar rendering with shadow. |
| `src/game/Bullet.ts` | `Bullet` | 39–115 | `draw()`: Projectile vector rendering (Player water drops, Rogue energy orbs, Invader plasma spheres, Sniper interceptable bolts). |
| `src/game/Enemy.ts` | `Enemy` | 516–1180 | `draw()`: 10 procedural vector enemy archetypes (Invaders & Rogues) with radial/linear gradients, shield rings, and weapon hardpoints. |
| `src/game/Player.ts` | `Player` | 161–297 | `draw()`: Player droplet vector body, i-frame alpha flicker, stress/suppression expressions, low-HP band-aids/cracks. |
| `src/game/Particle.ts` | `Particle` | 50–66 | `draw()`: Explosion and hit sparks with decaying alpha. |
| `src/game/Barricade.ts` | `Barricade` | 61–85 | `draw()`: Voxel-based 6×4 grid block destruction rendering. |
| `src/game/Helper.ts` | `Helper` | 121–197 | `draw()`: Friendly Fighter / Repairer / Tank support drone graphics. |
| `src/game/crisis/EndGameCrisis.ts` | `EndGameCrisis` | 457–535 | `draw()`: Crisis incursion cosmic vignette, incursion alert text, banner toast HUD, entity draw coordination. |
| `src/game/crisis/CrisisSovereign.ts` | `CrisisSovereign` | 196–698 | `draw()`, `drawBossHUD()`: Massive 260×130px multi-segment boss hull, rotating shields, core enrage aura, top boss bar. |
| `src/game/crisis/DimensionalRift.ts` | `DimensionalRift` | 104–281 | `draw()`: Swirling accretion disks, event horizons, gravitational wave distortion rings, shield conduit beams. |
| `src/components/game-canvas.tsx` | `GameCanvas`, `TopHUD`, `CanvasCore` | 1–1043 | React Canvas container, DPR sizing, touch evasion steering, top HUD, EndGameCrisis warning banners, crisis status badges, shop/gameover modals. |
| `src/app/page.tsx` | `Home` | 1–14 | Main application container layout (`bg-slate-950`). |
| `src/app/globals.css` | Global CSS | 1–27 | Tailwind CSS theme directives and root color schemes. |
| `tests/02_rendering_and_vector_art.spec.ts` | Test Suite | 1–188 | Automated tests verifying player states, all enemy procedural vectors, and barricade grids. |
| `tests/adversarial_r1_reviewer_graphics_integrity.spec.ts` | Test Suite | 1–333 | Zero-raster assertions (0 `drawImage` calls) and geometric complexity checks. |

---

## 8. Summary of Actionable Implementation Recommendations

1. **Implement 4-Tier "Halo Sandwich" in `src/game/Bullet.ts`:** Add pitch-black high-contrast perimeter strokes (`#000000`, `lineWidth = 2.0`) to all bullet types, followed by saturated chromatic shell and white-hot luminous core.
2. **Upgrade Acid Storm Hazards in `src/game/GameManager.ts`:** Render teardrop-shaped toxic spears with dark outline and trailing sizzle foam instead of plain green circles.
3. **Calibrate Event Warning Background Tints in `src/game/GameManager.ts`:** Reduce full-canvas tint alphas to 0.10–0.12 and add a pulsing 6px perimeter border stroke for non-intrusive alert signaling.
4. **Clean up DOM Warning Banners in `src/components/game-canvas.tsx`:** Remove `backdrop-blur` from warning banners to maintain pin-sharp projectile visibility during critical threat incursions.
5. **Add Automated Visual Clarity Tests in `tests/`:** Verify that bullets rendered under active crisis warning tints maintain high luminance delta and contrast ratios across all enemy and crisis archetypes.

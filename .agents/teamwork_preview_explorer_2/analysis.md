# Water Invader QA Deep Dive Report: UI/UX, Canvas Scaling, Controls, Visual & Audio Feedback

**Investigator**: teamwork_preview_explorer_2 (QA Exploration Agent)  
**Date**: 2026-08-21  
**Scope**: Canvas sizing, DPI/DPR scaling, Responsive layouts, Input systems, HUD & Modals, Visual FX, Audio Feedback  
**Status**: COMPLETE (Read-Only Investigation)

---

## 1. Executive Summary

Water Invader is a Next.js 16 + React 19 + HTML5 Canvas 2D arcade space shooter. While core mechanics and basic gameplay loop are operational, this QA sweep identified **21 distinct UI/UX, scaling, input, visual, and audio issues** that degrade player experience, cause graphical distortion on desktop/mobile, introduce control lockups, waste in-game currency on non-functional upgrades, and lack critical sensory feedback.

### Key Severity Breakdown
- **Critical (2)**: Stuck keys on window blur/tab switch (uncontrollable movement/firing), Multi-shot upgrade dead end at Lv 4/5 (wastes 200💧 with zero effect).
- **High (7)**: Desktop aspect ratio 12% horizontal stretch (sm:aspect-auto), Blurry graphics on High-DPI/Retina displays, CapsLock/Uppercase key failure, Top HUD obscuring top enemy rows/Boss, Missing Boss HP bar, Sniper bullet interception color bug, Missing player/enemy hit flashes.
- **Medium (9)**: Mobile touch overshoot & screen occlusion, Missing preventDefault causing page scroll on Space/Arrows, Viewport vertical overflow on laptop screens, Missing Pause menu/modal, Reinforcement warning text overflow, Missing combat damage numbers, Missing low HP screen vignette, Missing core SFX (hurt, hit, shield break, game over), Missing mute/volume UI controls.
- **Low (3)**: No audio limiter/compressor causing clipping on multi-sound overlap, AudioContext resume not bound to user interaction, Currency/upgrades reset on page reload.

---

## 2. Architecture & Code Tree Structure

`	ext
Water Invader System Architecture
├── Frontend & Container Layer (Next.js / React)
│   ├── src/app/page.tsx (Viewport container, header, Home component)
│   ├── src/app/layout.tsx (PWA metadata, fonts)
│   ├── src/app/globals.css (Tailwind 4 styling, body defaults)
│   └── src/components/game-canvas.tsx (React UI Overlays, Canvas mounting, Event listeners)
│       ├── Top HUD Overlay (Score, Pure Water 💧, Wave, HP Dots, Combo, Ultimate Gauge)
│       │   └── [BUG] Overlays Y:0~120, hiding Top-row enemies & Boss
│       ├── Canvas Wrapper (<div className="w-full aspect-[3/4] sm:aspect-auto">)
│       │   └── [BUG] sm:aspect-auto causes horizontal stretch on screens >=640px
│       ├── Mobile Controls Panel (Ally Q, Ult E, Fire Button)
│       │   └── [BUG] Left/Right buttons missing; touch on canvas occludes player
│       ├── Menu & Modals (Start Menu, How To Play Modal, Game Over & Upgrades Shop)
│       │   └── [BUG] Multi-Shot Lv 4/5 upgrades have no logic in engine
│       └── Window Event Listeners (keydown, keyup)
│           └── [BUG] No blur/visibilitychange listener -> Stuck keys on tab switch
│
├── Game Engine Core (HTML5 Canvas 2D)
│   ├── src/game/GameManager.ts (Central loop, Wave Spawner, Collisions, Cheats)
│   │   ├── loop() -> fixed delta update & requestAnimationFrame
│   │   ├── spawnWave() -> Rows of Normal, Zigzag, Sniper, Diver, Shielded, Splitter, Boss
│   │   ├── checkCollisions() -> Bullet vs Barricade/Enemy/Player/Helper
│   │   │   └── [BUG] Interceptable sniper bullet vs player bullet collision missing
│   │   ├── draw() -> Canvas rendering & Debug Hitbox overlay
│   │   │   └── [BUG] 48px Warning banner text overflows 600px canvas width
│   │   └── handleKeyDown() -> Movement, shooting, skills, cheats (F3, F4, F5)
│   │       └── [BUG] Case-sensitive checks ('a' vs 'A') fail on CapsLock
│   │
│   ├── src/game/Player.ts (Player Entity, State, Movement, Shooting, Dynamic Stress)
│   │   ├── update() -> Velocity clamp, fire rate, suppression/stress decay
│   │   ├── fire() -> Multi-shot & spread calculation
│   │   │   └── [BUG] multiShot >= 4 falls into 'else' (3 bullets only)
│   │   └── draw() -> Cute Droplet, eyes, bounce animation, band-aid/crack
│   │       └── [BUG] No hit flash or invulnerability blinking
│   │
│   ├── src/game/Enemy.ts (7 Enemy Types, AI, Dive, Evade, Shields)
│   │   ├── Enemy Types: NORMAL, ZIGZAG, BOSS, SNIPER, DIVER, SHIELDED, SPLITTER
│   │   ├── fire() -> Spawns enemy bullets & aimed sniper bullets
│   │   └── draw() -> Procedural vector graphics for all 7 types
│   │       └── [BUG] No Boss HP bar; No hit flash on damage
│   │
│   ├── src/game/Bullet.ts (Player/Enemy Projectiles, Piercing, Interception)
│   │   └── draw() -> Glow effect, water drop shape / glowing orb
│   │       └── [BUG] 'isInterceptable' purple color check is inside 'isPlayerBullet'
│   │
│   ├── src/game/Barricade.ts (Destructible Ice / Indestructible Stone Cover)
│   │   └── draw() -> Voxel block grid (6x4)
│   │
│   ├── src/game/Helper.ts (Ally Entities: Fighter, Repairer, Tank)
│   │   └── draw() -> Droplet with HP indicator
│   │
│   ├── src/game/Particle.ts (Explosion & Splash Particles with Gravity/Friction)
│   │
│   └── src/game/SoundManager.ts (Web Audio API Synthesizer)
│       ├── playShoot(), playExplosion(), playPowerUp()
│       └── [BUG] No volume/mute controls, missing hurt/hit/gameover/victory sounds, no dynamics limiter
`

---

## 3. Comprehensive Findings & Bug Catalog

### 3.1 Canvas Sizing, Scaling & Responsiveness

#### Issue UI-01: Desktop Aspect Ratio 12% Horizontal Stretch Distortion
- **File**: src/components/game-canvas.tsx (Line 230)
- **Severity**: **HIGH**
- **Observation**:
  `	sx
  // src/components/game-canvas.tsx:230
  <div className="w-full aspect-[3/4] sm:aspect-auto">
    <canvas
      ref={canvasRef}
      width={600}
      height={800}
      className="w-full h-full border-4 border-blue-900 rounded-lg shadow-2xl bg-slate-900 touch-none object-contain"
    />
  </div>
  `
- **Logic Chain**:
  1. On mobile (< 640px), spect-[3/4] maintains the 600:800 (0.75) aspect ratio.
  2. On screens >= 640px (desktop/tablets), sm:aspect-auto cancels the aspect ratio.
  3. Parent div has max-w-2xl (672px) and no explicit height. Canvas has w-full h-full.
  4. In CSS Flexbox, percentage height on an unconstrained parent defaults to the canvas intrinsic height (800px) while w-full expands to 672px.
  5. The canvas renders at 672px wide by 800px high (0.84 ratio), stretching all game graphics, enemy circles, and player droplet horizontally by 12%.
- **Recommended Fix**:
  Replace sm:aspect-auto with a persistent spect-[3/4] and constrain with max-h-[80vh] w-auto mx-auto:
  `	sx
  <div className="w-full max-w-[600px] aspect-[3/4] max-h-[80vh] mx-auto flex items-center justify-center">
    <canvas
      ref={canvasRef}
      width={600}
      height={800}
      className="w-full h-full border-4 border-blue-900 rounded-lg shadow-2xl bg-slate-900 touch-none object-contain"
    />
  </div>
  `

---

#### Issue UI-02: Missing High-DPI / Retina DevicePixelRatio Scaling (Pixelated/Blurry Rendering)
- **File**: src/components/game-canvas.tsx (Lines 236-238) & src/game/GameManager.ts (Lines 57-60)
- **Severity**: **HIGH**
- **Observation**:
  Canvas internal width/height are hardcoded to width={600} height={800} without factoring in window.devicePixelRatio.
- **Logic Chain**:
  1. Modern smartphones (iPhone, Galaxy) and high-res laptops (MacBook Retina, 4K displays) have devicePixelRatio = 2 or 3.
  2. Without buffer multiplication (canvas.width = 600 * dpr, canvas.height = 800 * dpr, ctx.scale(dpr, dpr)), the browser rasterizes the 600x800 buffer across high-density physical pixels, causing text, droplet curves, and particle effects to appear fuzzy and low-resolution.
- **Recommended Fix**:
  In GameManager.ts, implement HiDPI scaling:
  `	s
  const dpr = window.devicePixelRatio || 1;
  this.canvas.width = 600 * dpr;
  this.canvas.height = 800 * dpr;
  this.ctx.scale(dpr, dpr);
  `

---

#### Issue UI-03: Viewport Vertical Layout Overflow on 768p/900p Laptops & Mobile
- **File**: src/app/page.tsx (Lines 5-11) & src/components/game-canvas.tsx (Lines 197-278)
- **Severity**: **MEDIUM**
- **Observation**:
  page.tsx uses min-h-screen, mb-6, p-4, a title/subtitle header, an 800px canvas, and bottom mobile controls. Total height reaches >950px, forcing vertical scrolling on laptops and tablets.
- **Recommended Fix**:
  Set max-h-[100dvh] layout with compact headers and responsive canvas fitting.

---

### 3.2 Input Handling & Controls

#### Issue CTRL-01: Stuck Keys on Window Blur / Focus Loss / Tab Switching
- **File**: src/components/game-canvas.tsx (Lines 105-121)
- **Severity**: **CRITICAL**
- **Observation**:
  `	sx
  // src/components/game-canvas.tsx:105-121
  const handleKeyDown = (e: KeyboardEvent) => {
    if (showManual) return;
    game.handleKeyDown(e.key);
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    if (showManual) return;
    game.handleKeyUp(e.key);
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  `
- **Logic Chain**:
  1. If a player holds a key (e.g. ArrowLeft, ArrowRight, Space) and switches windows (Alt-Tab, notifications, clicking out), the browser never dispatches keyup.
  2. gameManager.player.isMovingLeft or isShooting remains 	rue indefinitely.
  3. When switching back to the game, the character uncontrollably drifts into enemy fire.
- **Recommended Fix**:
  Add lur and isibilitychange event listeners to reset input states:
  `	sx
  const handleResetKeys = () => {
    if (gameManagerRef.current?.player) {
      gameManagerRef.current.player.isMovingLeft = false;
      gameManagerRef.current.player.isMovingRight = false;
      gameManagerRef.current.player.isShooting = false;
    }
  };
  window.addEventListener('blur', handleResetKeys);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) handleResetKeys();
  });
  `

---

#### Issue CTRL-02: Uppercase / CapsLock / IME Key Ignored
- **File**: src/game/GameManager.ts (Lines 643-671)
- **Severity**: **HIGH**
- **Observation**:
  `	s
  // src/game/GameManager.ts:643-654
  public handleKeyDown(key: string) {
    if (key === 'ArrowLeft' || key === 'a') this.player.isMovingLeft = true;
    if (key === 'ArrowRight' || key === 'd') this.player.isMovingRight = true;
    if (key === ' ' || key === 'Spacebar') {
      this.player.isShooting = true;
    }
    if (key === 'e' || key === 'Shift') {
      this.triggerUltimate();
    }
    if (key === 'q') {
      this.triggerSummonAlly();
    }
  `
- **Logic Chain**:
  1. If CapsLock is enabled or Korean/Japanese IME is active, e.key delivers 'A', 'D', 'E', 'Q'.
  2. Strict equality check fails, making the player completely unresponsive.
- **Recommended Fix**:
  Normalize input with key.toLowerCase():
  `	s
  public handleKeyDown(rawKey: string) {
    const key = rawKey.toLowerCase();
    if (key === 'arrowleft' || key === 'a') this.player.isMovingLeft = true;
    if (key === 'arrowright' || key === 'd') this.player.isMovingRight = true;
    if (key === ' ' || key === 'spacebar') this.player.isShooting = true;
    if (key === 'e' || rawKey === 'Shift') this.triggerUltimate();
    if (key === 'q') this.triggerSummonAlly();
    ...
  `

---

#### Issue CTRL-03: Missing e.preventDefault() on Gameplay Keys (Page Scrolling)
- **File**: src/components/game-canvas.tsx (Lines 105-112)
- **Severity**: **MEDIUM**
- **Observation**:
  Pressing Space or ArrowDown causes default browser scrolling behavior on small or zoomed viewports.
- **Recommended Fix**:
  Prevent default on gameplay keys:
  `	sx
  const handleKeyDown = (e: KeyboardEvent) => {
    if ([' ', 'Spacebar', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
    }
    if (showManual) return;
    game.handleKeyDown(e.key);
  };
  `

---

#### Issue CTRL-04: Mobile Canvas Touch Overshoot & Finger Screen Occlusion
- **File**: src/components/game-canvas.tsx (Lines 163-182, 244-278)
- **Severity**: **HIGH**
- **Observation**:
  1. Moving on mobile requires dragging on the canvas (updateTargetX). When a finger is held stationary, pointermove stops firing, leaving player.isMovingLeft/Right = true, causing severe overshoot.
  2. Direct touch on canvas obscures the player character and bottom bullet paths.
  3. Mobile bottom bar only contains right-hand buttons (Ally, Ult, Fire) and lacks virtual Left/Right D-pad buttons.
- **Recommended Fix**:
  Add explicit virtual Left (◄) and Right (►) buttons to the mobile controls bar, allowing tactile thumb control without obscuring the canvas.

---

### 3.3 HUD & UI Elements

#### Issue HUD-01: Top HUD Overlays and Obscures Row 0/1 Enemies & Boss
- **File**: src/components/game-canvas.tsx (Lines 199-228) & src/game/GameManager.ts (Line 148)
- **Severity**: **HIGH**
- **Observation**:
  `	sx
  // src/components/game-canvas.tsx:199
  <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start text-white touch-none z-10">
  `
  Enemies spawn at 40 + r * 50 (Row 0 at Y:40, Row 1 at Y:90), Boss spawns at Y:50. The React overlay (Score, Pure Water, Wave, HP Dots, Ultimate Bar) sits directly on top of Y:0~120.
- **Logic Chain**:
  Enemies in rows 0 and 1, as well as the Boss skull, are hidden behind UI text. Enemy bullets appear without warning out of the HUD text, causing unfair damage.
- **Recommended Fix**:
  Shift enemy starting Y down to 100 + r * 50 or move HUD to a dedicated header bar above the canvas.

---

#### Issue HUD-02: Missing Boss Health Bar
- **File**: src/game/GameManager.ts (Lines 120-124) & src/game/Enemy.ts (Lines 190-215)
- **Severity**: **HIGH**
- **Observation**:
  Wave 5 Boss has 50 HP (scales with wave), but there is zero health bar indicator on either canvas or React HUD.
- **Logic Chain**:
  Player cannot track boss damage progression, making the battle feel opaque and unresponsive.
- **Recommended Fix**:
  When 	his.level % 5 === 0, render a Boss Health Bar with red fill, border, and BOSS HP:  /  at the top of the canvas.

---

#### Issue HUD-03: Multi-Shot Upgrade Lv 4 & 5 Broken (Wastes 200💧 Currency)
- **File**: src/game/Player.ts (Lines 97-115) & src/game/GameManager.ts (Lines 684-690) & src/components/game-canvas.tsx (Lines 389-398)
- **Severity**: **CRITICAL**
- **Observation**:
  `	s
  // src/game/Player.ts:97-115
  if (this.multiShot === 1) {
    // 1 bullet
  } else if (this.multiShot === 2) {
    // 2 bullets
  } else {
    // 3 bullets (b1, b2, b3)
  }
  `
- **Logic Chain**:
  1. The shop allows purchasing Multi-Shot up to Lv. 5 (costing 100💧 each).
  2. When upgraded to Lv. 4 or Lv. 5, 	his.multiShot becomes 4 or 5.
  3. Player.fire() branches to else (which is hardcoded to 3 bullets only).
  4. Player spends 200💧 for Lv 4 and Lv 5 with zero additional projectiles.
- **Recommended Fix**:
  Implement 4-shot and 5-shot fan spread logic in Player.fire():
  `	s
  if (this.multiShot === 1) {
    // 1 center bullet
  } else if (this.multiShot === 2) {
    // 2 dual bullets
  } else if (this.multiShot === 3) {
    // 3 spread bullets (-40, 0, +40)
  } else if (this.multiShot === 4) {
    // 4 spread bullets (-60, -20, +20, +60)
  } else {
    // 5 spread bullets (-80, -40, 0, +40, +80)
  }
  `

---

#### Issue HUD-04: Missing Pause Menu & Key Handler ('P' / 'Escape')
- **File**: src/game/types.ts (Lines 18-22) & src/game/GameManager.ts (Line 14)
- **Severity**: **MEDIUM**
- **Observation**:
  GameState only includes MENU, PLAYING, GAME_OVER. Pressing 'P' or 'Escape' does nothing. Players cannot pause when interrupted.
- **Recommended Fix**:
  Add GameState.PAUSED, toggle via 'p'/'Escape', and render a Pause overlay with "RESUME" and "QUIT" buttons.

---

#### Issue HUD-05: Reinforcement Warning Text Overflow (Clips Outside 600px Canvas)
- **File**: src/game/GameManager.ts (Lines 586-594)
- **Severity**: **MEDIUM**
- **Observation**:
  "WARNING! ENEMY REINFORCEMENTS!" (30 characters) is drawn at 48px sans-serif centered at X:300. String width is ~780px, spilling 90px outside both left and right edges.
- **Recommended Fix**:
  Reduce font size to 28px or split into two lines ("WARNING!", "ENEMY REINFORCEMENTS!").

---

### 3.4 Visual Feedback

#### Issue VIS-01: Sniper Bullet Interception Color Bug (isInterceptable inside isPlayerBullet)
- **File**: src/game/Bullet.ts (Lines 31-37, 47-65)
- **Severity**: **HIGH**
- **Observation**:
  `	s
  // src/game/Bullet.ts:31-37
  if (this.isPlayerBullet) {
    // Fake glow for player bullet
    ctx.globalAlpha = 0.5;
    if (this.isInterceptable) { ctx.fillStyle = "#a855f7"; }
    ctx.beginPath();
    ctx.arc(this.position.x + this.size.width / 2, this.position.y + this.size.height - 3, this.size.width * 0.8, 0, Math.PI * 2);
    ctx.fill();
  `
- **Logic Chain**:
  1. Sniper bullets are enemy projectiles (isPlayerBullet = false) with isInterceptable = true.
  2. Because the isInterceptable color check is nested inside if (this.isPlayerBullet), enemy sniper bullets are drawn as generic red bullets in the else branch.
  3. The player cannot distinguish dangerous interceptable sniper bullets from regular enemy bullets.
- **Recommended Fix**:
  Move isInterceptable styling into the enemy bullet branch to render sniper bullets with purple core (#a855f7) and pulsating outer glow.

---

#### Issue VIS-02: Missing Hit Flash on Player & Enemies
- **File**: src/game/Player.ts (Lines 120-240) & src/game/Enemy.ts (Lines 169-307)
- **Severity**: **HIGH**
- **Observation**:
  Taking damage produces no sprite flash, invulnerability blink, or white silhouette reaction on either Player or Enemies (especially high-HP Boss and Shielded enemies).
- **Logic Chain**:
  Without hit flashes, combat lacks punch and tactile confirmation that shots are connecting.
- **Recommended Fix**:
  Add hitFlashTimer (0.08s) on hit; render white silhouette (ctx.fillStyle = '#ffffff') when active.

---

#### Issue VIS-03: Missing Floating Combat Damage Numbers & Status Popups
- **File**: src/game/GameManager.ts (Lines 360, 414, 482)
- **Severity**: **MEDIUM**
- **Observation**:
  Dealing damage or gaining bonus points produces no floating text (+100, CRIT!, SHIELD BREAK!).
- **Recommended Fix**:
  Add floating text particle entity displaying damage/score floating upwards and fading out.

---

#### Issue VIS-04: Missing Low HP Screen Danger Vignette
- **File**: src/game/GameManager.ts (Lines 512-578)
- **Severity**: **MEDIUM**
- **Observation**:
  When Player HP drops to 1, there is no pulsing red screen-edge vignette.
- **Recommended Fix**:
  Draw a pulsating radial red vignette around canvas edges when player.hp <= 1.

---

### 3.5 Audio Feedback

#### Issue AUD-01: Missing Core Sound Effects (Hurt, Hit, Shield, GameOver, Victory)
- **File**: src/game/SoundManager.ts (Lines 1-87) & src/game/GameManager.ts
- **Severity**: **HIGH**
- **Observation**:
  SoundManager only has playShoot(), playExplosion(), playPowerUp().
  Missing SFX:
  - Player Hurt sound
  - Enemy / Barricade Hit impact
  - Shield Break sound
  - Boss Spawn / Laser sound
  - Ally Summon horn
  - Wave Clear victory chime
  - Game Over defeat sting
- **Recommended Fix**:
  Synthesize procedural Web Audio sound nodes for all missing events.

---

#### Issue AUD-02: Missing Audio Volume Controls & Mute Toggle
- **File**: src/game/SoundManager.ts & src/components/game-canvas.tsx
- **Severity**: **MEDIUM**
- **Observation**:
  There is no master gain control, volume slider, or mute button in the UI or engine.
- **Recommended Fix**:
  Add a Master GainNode with setVolume(v) and 	oggleMute() exposed to a speaker icon button in the HUD.

---

#### Issue AUD-03: Audio Distortion / Digital Clipping under Rapid Overlapping Sounds
- **File**: src/game/SoundManager.ts (Lines 22-83)
- **Severity**: **LOW**
- **Observation**:
  Each shot/explosion connects directly to udioCtx.destination. Rapid firing creates 10+ concurrent oscillators that sum and clip amplitude.
- **Recommended Fix**:
  Route audio through a DynamicsCompressorNode to automatically tame peaks and prevent clipping.

---

#### Issue AUD-04: Web Audio Context Resume on Interaction
- **File**: src/game/SoundManager.ts (Lines 9-20)
- **Severity**: **LOW**
- **Observation**:
  soundManager.init() is only called in startGame(). If the browser suspends audio later, subsequent pointer/keyboard events do not auto-resume it.
- **Recommended Fix**:
  Add 	his.audioCtx.resume() to handleKeyDown and handleCanvasPointerDown.

---

## 4. Prioritized Action Matrix for Implementation Agent

| Priority | Issue ID | Area | Description | Target Files |
|---|---|---|---|---|
| **P0 (Critical)** | CTRL-01 | Controls | Add lur / isibilitychange listeners to prevent stuck keys | src/components/game-canvas.tsx |
| **P0 (Critical)** | HUD-03 | Mechanics/UI | Implement 4-shot and 5-shot spread patterns in Player.fire() | src/game/Player.ts, src/game/GameManager.ts |
| **P1 (High)** | UI-01 | Scaling | Fix desktop 12% horizontal stretch distortion (remove sm:aspect-auto) | src/components/game-canvas.tsx |
| **P1 (High)** | UI-02 | Scaling | Implement HiDPI / Retina devicePixelRatio canvas buffer scaling | src/components/game-canvas.tsx, src/game/GameManager.ts |
| **P1 (High)** | CTRL-02 | Controls | Normalize keyboard input (key.toLowerCase()) for CapsLock support | src/game/GameManager.ts |
| **P1 (High)** | HUD-01 | Layout | Offset enemy spawn Y (Y:100+) to prevent top HUD overlay occlusion | src/game/GameManager.ts |
| **P1 (High)** | HUD-02 | HUD | Add Boss Health Bar during Wave 5 Boss battles | src/game/GameManager.ts, src/game/Enemy.ts |
| **P1 (High)** | VIS-01 | Feedback | Fix Sniper Bullet purple interceptable styling in enemy bullet branch | src/game/Bullet.ts |
| **P1 (High)** | VIS-02 | Feedback | Add 0.08s hit flash on player and enemies | src/game/Player.ts, src/game/Enemy.ts |
| **P1 (High)** | AUD-01 | Audio | Implement procedural SFX for hurt, hit, shield break, game over, victory | src/game/SoundManager.ts, src/game/GameManager.ts |
| **P2 (Medium)** | CTRL-03 | Controls | Add e.preventDefault() on Space/Arrows to prevent page scrolling | src/components/game-canvas.tsx |
| **P2 (Medium)** | CTRL-04 | Controls | Add dedicated virtual Left/Right mobile buttons to avoid touch occlusion | src/components/game-canvas.tsx |
| **P2 (Medium)** | HUD-04 | UI | Add Pause state (GameState.PAUSED) and Escape/P pause menu | src/game/types.ts, src/game/GameManager.ts, src/components/game-canvas.tsx |
| **P2 (Medium)** | HUD-05 | UI | Fix 48px reinforcement warning text overflow on 600px canvas | src/game/GameManager.ts |
| **P2 (Medium)** | VIS-04 | Feedback | Add pulsing red danger vignette when Player HP <= 1 | src/game/GameManager.ts |
| **P2 (Medium)** | AUD-02 | Audio | Add Mute button & Master Gain Volume control in HUD | src/game/SoundManager.ts, src/components/game-canvas.tsx |

---

## 5. Verification Method

1. **Static Build & TypeCheck**:
   
pm run build or 
px tsc --noEmit to verify zero TypeScript errors.
2. **Automated Playwright Tests**:
   
px playwright test tests/01_ui_and_controls.spec.ts tests/02_rendering_and_vector_art.spec.ts
3. **Visual & Scaling Verification**:
   - Inspect canvas bounding box at 375px (mobile), 768px (tablet), and 1280px (desktop) -> Confirm 3:4 aspect ratio is strictly preserved without stretching.
   - Test CapsLock input ('A', 'D', 'Q', 'E') -> Confirm smooth movement and skill activation.
   - Purchase Multi-Shot Lv 4 and Lv 5 in Shop -> Confirm 4 and 5 projectiles spawn in game.
   - Spawn Boss -> Confirm Boss HP Bar is visible and depletes smoothly on hit.
   - Inspect Sniper Bullet -> Confirm purple distinct interceptable vector bullet rendering.

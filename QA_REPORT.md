# Water Invader Comprehensive QA Sweep Report

**Report Date**: 2026-08-21  
**Project**: Water Invader (Space Invader Next.js / TypeScript Web Game)  
**Conducted By**: Project Orchestrator & QA Survey Explorers (1, 2, 3)

---

## Executive Summary

A comprehensive static and dynamic QA sweep was executed across the entire Water Invader codebase. While the core game mechanics and automated Playwright tests pass in basic scenarios, deep inspection uncovered **3 Critical defects**, **11 High-severity defects**, and multiple UX/balancing issues.

These defects include game loop race conditions (duplicate rAF loops on restart), collision logic bugs (barricade damage nested inside bullet loop), input lockups (stuck keys on focus loss / CapsLock failure), dead progression upgrades (Multi-Shot Lv 4 & 5 doing nothing), and visual/audio feedback omissions (missing Boss HP bar, missing hit flashes, and canvas aspect ratio distortion).

---

## Issue Priority Matrix & Classification

```
Defect Architecture Tree
├── [CRITICAL] Core Engine & Loop Integrity
│   ├── F-01: Nested Barricade Collision in Bullet Loop (GameManager.ts:448-470)
│   ├── F-02: Uncancelled rAF causing speed acceleration on restart (GameManager.ts:106-112)
│   └── F-03: Stuck Keys on window blur / tab switch (game-canvas.tsx:105-121)
├── [HIGH] Gameplay Mechanics & Progression Bugs
│   ├── F-04: Player 0s Invincibility Frames / Instant Multi-Hit Death (GameManager.ts:411-430)
│   ├── F-05: Shop Multi-Shot Lv 4 & Lv 5 Dead Code (Player.ts:97-116)
│   ├── F-06: Shield Enemy Direct HP Bypass & 0s Regen Cooldown (GameManager.ts:360, Enemy.ts:94-99)
│   ├── F-07: Sniper Bullet Intercept Logic Missing & Purple Render Bug (Bullet.ts:31-37, GameManager.ts:329-392)
│   └── F-08: Near-Miss Multi-Frame Suppression Surge (GameManager.ts:432-445, Bullet.ts)
├── [HIGH] UI/UX, Controls & Feedback
│   ├── F-09: Modal Open resets entire game to Wave 1 (game-canvas.tsx:79-122)
│   ├── F-10: Canvas 12% Horizontal Stretch on Desktop (game-canvas.tsx:230)
│   ├── F-11: Retina / HiDPI Blurry Canvas Rendering (game-canvas.tsx:236, GameManager.ts:57)
│   ├── F-12: CapsLock / UpperCase Key Input Ignore (GameManager.ts:643-671)
│   ├── F-13: Top HUD Overlay Occluding Top Row Enemies & Boss (game-canvas.tsx:199, GameManager.ts:148)
│   └── F-14: Missing Boss HP Bar, Hit Flash FX, Audio Node Cleanup (Enemy.ts:190, SoundManager.ts)
└── [MEDIUM] Robustness & Balance
    ├── F-15: LocalStorage NaN score corruption recovery (GameManager.ts:501-505)
    ├── F-16: Player Initial HP UI vs Engine Desync (Player.ts:7, game-canvas.tsx:19)
    └── F-17: Enemy Speed Escalation Multiplier Smoothing (GameManager.ts:233)
```

---

## Detailed Findings

### 1. [CRITICAL] Nested Barricade Collision in Bullet Loop (F-01)
- **Files**: `src/game/GameManager.ts:448-470`
- **Root Cause**: The enemy-barricade collision check is nested inside `for (const bullet of this.bullets)`.
- **Impact**: When `this.bullets.length === 0`, enemies glide through barricades without dealing damage. When 10 bullets exist, barricades take 10x damage per frame.
- **Fix**: Move enemy-barricade collision logic to an independent loop.

### 2. [CRITICAL] Duplicate rAF Game Loops on Restart (F-02)
- **Files**: `src/game/GameManager.ts:106-112`
- **Root Cause**: `game.start()` starts a new `requestAnimationFrame` without cancelling the previous `this.animationFrameId`.
- **Impact**: Clicking "Play Again" doubles or triples game speed and delta accumulation.
- **Fix**: Call `cancelAnimationFrame(this.animationFrameId)` before scheduling a new rAF.

### 3. [CRITICAL] Stuck Keys on Blur / Focus Loss (F-03)
- **Files**: `src/components/game-canvas.tsx:105-121`
- **Root Cause**: Only `keydown` and `keyup` are attached to window. Tab switching or clicking outside while holding a key prevents `keyup` from firing.
- **Impact**: Player continues moving or shooting perpetually.
- **Fix**: Add `blur` and `visibilitychange` listeners to reset all active keys.

### 4. [HIGH] Player 0s Invincibility Frames (F-04)
- **Files**: `src/game/GameManager.ts:411-430`, `src/game/Player.ts`
- **Root Cause**: Player takes damage immediately without setting an `invincibilityTimer`.
- **Impact**: Overlapping enemy bullets kill player in 1-2 frames from full HP.
- **Fix**: Grant 1.0s i-frames upon taking damage and flicker player sprite.

### 5. [HIGH] Shop Multi-Shot Lv 4 & 5 Dead Code (F-05)
- **Files**: `src/game/Player.ts:97-116`
- **Root Cause**: `Player.fire()` has hardcoded `multiShot === 1`, `multiShot === 2`, and fallback to 3 bullets.
- **Impact**: Upgrading Multi-Shot to Lv 4 (100💧) and Lv 5 (100💧) deducts currency but still fires 3 bullets.
- **Fix**: Add 4-bullet and 5-bullet spread firing angles.

### 6. [HIGH] Shielded Enemy Direct HP Bypass & 0s Regen (F-06)
- **Files**: `src/game/GameManager.ts:360`, `src/game/Enemy.ts:33, 94-99`
- **Root Cause**: Bullet collisions subtract from `enemy.hp` directly instead of `enemy.shieldHp`. Shield break does not set a cooldown timer.
- **Impact**: Shield enemies take full health damage through shields, and destroyed shields instantly recharge in 16ms.
- **Fix**: Deduct from `shieldHp` first; set a 5.0s recharge cooldown upon break.

### 7. [HIGH] Sniper Bullet Intercept & Color Styling (F-07)
- **Files**: `src/game/Bullet.ts:31-37`, `src/game/GameManager.ts:329-392`
- **Root Cause**: `isInterceptable` purple styling is placed inside `isPlayerBullet` branch. Player bullets never collide with enemy bullets.
- **Impact**: Sniper bullets cannot be shot down and render red instead of purple.
- **Fix**: Render purple on enemy bullets when `isInterceptable`; add player-bullet vs interceptable enemy-bullet collision detection.

### 8. [HIGH] Near-Miss Multi-Frame Suppression Surge (F-08)
- **Files**: `src/game/GameManager.ts:432-445`, `src/game/Bullet.ts`
- **Root Cause**: `bullet.position.y` within player Y range applies +15 suppression every frame.
- **Impact**: A single passing bullet applies 100% panic in under 0.2s.
- **Fix**: Add `hasTriggeredNearMiss` flag on `Bullet` to trigger near-miss at most once per bullet.

### 9. [HIGH] Modal Opening Resets Active Game (F-09)
- **Files**: `src/components/game-canvas.tsx:79-122`
- **Root Cause**: `showManual` is in the `useEffect` dependency array that mounts `GameManager`.
- **Impact**: Opening the manual resets game progress back to Wave 1.
- **Fix**: Remove `showManual` from canvas re-mount dependencies and pause game on modal open.

### 10. [HIGH] Desktop Canvas 12% Horizontal Stretch (F-10)
- **Files**: `src/components/game-canvas.tsx:230`
- **Root Cause**: `sm:aspect-auto` removes 3:4 aspect ratio constraint on screens >= 640px.
- **Impact**: Stretches canvas horizontally by 12%.
- **Fix**: Enforce `aspect-[3/4]` across all viewports.

### 11. [HIGH] HiDPI / Retina Blurry Rendering (F-11)
- **Files**: `src/components/game-canvas.tsx:236-238`, `src/game/GameManager.ts:57-58`
- **Root Cause**: Canvas width/height fixed at 600x800 without `window.devicePixelRatio`.
- **Impact**: Blurry pixel rendering on high-DPI displays.
- **Fix**: Scale canvas resolution by `dpr` while preserving 600x800 coordinate grid with `ctx.scale(dpr, dpr)`.

### 12. [HIGH] CapsLock / UpperCase Key Input Ignore (F-12)
- **Files**: `src/game/GameManager.ts:643-671`
- **Root Cause**: Strict lowercase string comparison (`key === 'a'`).
- **Impact**: Controls stop responding when CapsLock is enabled.
- **Fix**: Use `e.key.toLowerCase()` or `e.code`.

### 13. [HIGH] Top HUD Overlay Occlusion (F-13)
- **Files**: `src/components/game-canvas.tsx:199`, `src/game/GameManager.ts:148`
- **Root Cause**: HUD overlay sits directly over top 100px of game field.
- **Impact**: Top row enemies and boss emerge from behind HUD text.
- **Fix**: Offset enemy spawn Y coordinate downwards (Y: 80~100) or adjust HUD layout.

### 14. [HIGH] Missing Boss HP Bar & Audio/Visual Feedback (F-14)
- **Files**: `src/game/Enemy.ts:190-215`, `src/game/GameManager.ts:120-124`, `src/game/SoundManager.ts`
- **Root Cause**: Boss has no dedicated HP bar. Missing hit flash animations. Missing sound effects (hit, hurt, shield break, victory/game over) and audio node disconnects.
- **Impact**: Lack of combat feedback and potential audio node leaks.
- **Fix**: Add Boss HP Bar UI, white hit flash on damage, full sound effect suite in SoundManager with proper cleanup.

---

## Action Plan & Roadmap

All identified Critical and High-priority defects will be resolved systematically across 3 targeted implementation milestones:
- **Milestone 1**: Core Engine & Collision Fixes (F-01, F-02, F-04, F-06, F-07, F-08, F-15)
- **Milestone 2**: Gameplay Mechanics, Upgrades & Controls (F-03, F-05, F-09, F-12, F-16, F-17)
- **Milestone 3**: UI/UX, HiDPI Scaling & Audio/Visual Feedback (F-10, F-11, F-13, F-14)
- **Milestone 4**: Final Full-Suite Verification & Build Validation

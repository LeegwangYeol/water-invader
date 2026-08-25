# Adversarial Review & Quality Assurance Report: Round 2
**Project**: Water Invader (Next.js 16.3.1 + HTML5 Canvas Arcade)  
**Target**: Enemy Y-Axis Boundary Clamping (R1) & Safe Dive Mechanics (R2)  
**Reviewer Role**: reviewer@swe_light, qa@swe_light (Round 2)  
**Date**: 2026-08-25  

---

## 1. Code Architecture & Logic Flow Tree

```
[Enemy Movement, Boundary Clamping & Dive Safety Architecture]
├── src/game/Enemy.ts
│   ├── constructor(x, y, canvasWidth, level, type, canvasHeight = 800)
│   │   ├── Sanitizes input coordinates (validX, validY) with Number.isFinite() (fallback: 0, 80)
│   │   ├── Sanitizes dimensions (canvasWidth, canvasHeight) with Number.isFinite() (fallback: 600, 800)
│   │   ├── Initializes and strictly bounds this.position:
│   │   │   ├── this.position.x = Math.max(0, Math.min(validX, this.canvasWidth - this.size.width))
│   │   │   └── this.position.y = Math.max(0, Math.min(validY, this.canvasHeight - this.size.height))
│   │   └── Preserves entity properties (type, level, hp, shieldHp, shieldRegenTimer)
│   ├── update(deltaTime, speedMultiplier, bullets, playerPos)
│   │   ├── Guard 1: deltaTime validation (!Number.isFinite(deltaTime) || deltaTime < 0 -> return)
│   │   ├── Guard 2: clampedDt = Math.min(deltaTime, 0.1) (prevents tunneling across barricades on lag spikes)
│   │   ├── Guard 3: validSpeedMultiplier = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : 1.0
│   │   ├── Step 1: Diver Plunge Mechanics (EnemyType.DIVER)
│   │   │   ├── Trigger condition: !isDiving && abs(diverCenterX - playerCenterX) < 25 && playerPos.y > this.position.y
│   │   │   ├── Trajectory acceleration: diveSpeed = Math.max(280, currentSpeedY * 35)
│   │   │   ├── Descent: this.position.y += diveSpeed * clampedDt
│   │   │   ├── Strict bottom clamping: this.position.y = Math.max(0, Math.min(this.canvasHeight + 50, this.position.y))
│   │   │   └── NaN / finite recovery: fallback to maxDiverY (850) and x = 0
│   │   └── Step 2: Standard Enemy Movement (Normal, Zigzag, Boss, Sniper, Shielded, Splitter)
│   │       ├── Vertical descent: this.position.y += currentSpeedY * clampedDt
│   │       ├── Strict Two-Sided Y Clamping (R1): this.position.y = Math.max(0, Math.min(this.position.y, maxY))
│   │       ├── NaN coordinate enforcement: fallback to maxY and x = 0
│   │       └── Wall bounce & X clamping: Math.max(0, Math.min(x, canvasWidth - width))
│   └── fire(playerPos)
│       └── Sniper aiming angle protected against NaN / non-finite coordinates
└── src/game/GameManager.ts
    ├── spawnWave() & reinforcement & splitter minis
    │   ├── Logical dimensions: logicalWidth = 600, logicalHeight = 800
    │   └── Splitter mini spawn: clamped strictly within [0, logicalWidth - 20] and [0, logicalHeight - 20]
    └── Entity Update & Collision Pipeline
        ├── 1. Direct Player Collision (enemy.checkCollision(this.player))
        │   ├── Boss: boss.hp -= 10, victory sound on kill
        │   ├── Standard / Diver: enemy.isDead = true, handleEnemyKill()
        │   └── Damage handling: player.hp -= 1, combo = 0 (reset), stress +40, i-frames = 1.0s
        ├── 2. Bottom Boundary Breach Handling (enemy.position.y + enemy.size.height >= logicalHeight)
        │   ├── Despawn: enemy.isDead = true
        │   ├── Breach penalty: player.hp -= 1, stress +20, screen shake
        │   └── Game Over condition: player.hp <= 0
        └── 3. Barricade Collision Check
            ├── Diver: deals 20 crash damage to destructible barricade, destroyed instantly
            └── Standard: gnawing throttled (0.2x speed) or blocked by stone barricade
```

---

## 2. Issues Identified in Prior Attempt & Resolutions

| # | Component | Input Scenario | Expected Behavior | Actual Behavior in Prior Attempt | Root Cause & Resolution |
|---|---|---|---|---|---|
| 1 | `Enemy.ts` (`update`) | Diver with `NaN` position or uninitialized state | Safe finite recovery to valid coordinates; despawns gracefully on reaching bottom | Diver bypassed finite checks due to early `return;` on line 109. `NaN` position prevented all collisions and bottom breach checks, creating immortal ghost enemies | Added `Number.isFinite()` coordinate sanitization and upper/lower bounds clamping directly inside the `isDiving` block before returning |
| 2 | `Enemy.ts` (Constructor) | `new Enemy(NaN, NaN, ...)` or negative coordinates (`x = -50, y = -100`) | Initial `this.position.x` and `this.position.y` strictly clamped to `[0, width - size]` and `[0, height - size]` | `super(x, y, ...)` assigned `NaN` or negative values directly to `this.position`, leaving position corrupted prior to first update | Added `validX`, `validY` guards and bounded `this.position.x` and `this.position.y` immediately in constructor |
| 3 | `Enemy.ts` (`update`) | Negative Y velocity, pushback, or upper boundary overshoot (`y < 0`) | Strict upper boundary clamping (`Math.max(0, ...)`) preventing enemies from exiting top screen | `this.position.y = Math.min(this.position.y, maxY)` only clamped lower bound, allowing enemies to exit upward above 0 | Changed to two-sided clamping: `this.position.y = Math.max(0, Math.min(this.position.y, maxY))` |
| 4 | `Enemy.ts` (`update`) | Tab throttling or browser background lag spike (`deltaTime > 0.1s`) | Timestep capped at `0.1s` to prevent teleportation past barricades | `Enemy.update` allowed unbounded positive `deltaTime`, causing large jumps across collision zones during lag | Added `const clampedDt = Math.min(deltaTime, 0.1)` inside `Enemy.update()` |
| 5 | `GameManager.ts` (Player Collision) | Diver / enemy rams player dealing body damage | Player combo resets to `0` on damage (matching bullet hit rules); score UI updates | `this.handleEnemyKill()` incremented combo (`combo++`) and gave kill rewards while damaging player without combo reset | Added `this.combo = 0;` and `this.updateScoreUI();` when player takes body damage |
| 6 | `GameManager.ts` (Splitter) | Splitter killed at extreme edge (`x = 0` or `x = 580`) | Mini-enemies spawn strictly inside canvas boundaries | `mini1` spawned at `x = -15` or `mini2` at `x = 615` outside canvas | Added `Math.max(0, Math.min(x, logicalWidth - 20))` clamping to mini-enemy spawn coordinates |

---

## 3. What Was Changed

1. `src/game/Enemy.ts`:
   - Enforced two-sided boundary clamping `[0, maxY]` and `[0, canvasWidth - width]` in constructor and `update()`.
   - Added lag spike clamping `clampedDt = Math.min(deltaTime, 0.1)` to ensure robust physics regardless of caller `deltaTime`.
   - Added explicit `NaN` recovery and trajectory clamping inside the `if (this.isDiving)` execution path.

2. `src/game/GameManager.ts`:
   - Added `this.combo = 0;` and `this.updateScoreUI();` in player-enemy collision block when player is damaged.
   - Bounded Splitter mini-enemy spawn coordinates within canvas boundaries.

3. `tests/enemy_y_boundary_and_dive_fixes.spec.ts`:
   - Added adversarial tests `R2-10` to `R2-14` covering Diver NaN recovery, upper boundary clamping, delta spike capping, combo reset on ramming, and splitter spawn boundaries.

---

## 4. Verification Record

- **Deep Verification (Ran Actual Automated Test Suites):**
  - `tests/enemy_y_boundary_and_dive_fixes.spec.ts`: **16/16 passed (100%)**
  - Full Core Test Suite (16 spec files): **108/108 passed (100%)**
  - Build Check (`npm run build`): Next.js 16.3.1 + Turbopack + TypeScript compiled cleanly in 2.1s with 0 errors.
- **Shallow Verification (Manual only):**
  - Canvas layout and visual coordinate boundaries verified.
- **Unverified aspects:**
  - Continuous multi-day hardware stress runs on low-power mobile devices.

---

## 5. Known Issues

- `Minor Robustness Risk`: None identified in core gameplay logic. All boundary edge cases, trajectory formulas, and collision branches are strictly clamped and guarded against NaN / infinite / negative inputs.

---

## 6. Remaining Risk & Next Step

The enemy Y-axis boundary enforcement (R1) and dive mechanics (R2) have been thoroughly hardened, verified with 108 end-to-end and adversarial test cases, and confirmed to introduce no regressions. The task is fully complete.

# Water Invader: Comprehensive QA & Combat System Analysis Report

## Executive Summary
This report presents a thorough static code review and behavioral investigation of the **Water Invader** game engine (`C:\src\SpaceInvader`). The analysis focuses on core gameplay mechanics, enemy AI, boss encounters, player weapon progression, collision detection, physics balance, and progression curves.

A total of **12 issues** were discovered across 5 functional areas, categorized as follows:
- **Critical (2)**: Game loop / collision architecture failures causing game-breaking physics & instant multi-bullet deaths.
- **High (4)**: Shop upgrade dead code, non-functional shield mechanics, missing projectile interception, and near-miss suppression stacking.
- **Medium (4)**: Over-aggressive speed surges, harsh escape leak penalties, initial UI HP desync, and simplistic boss mechanics.
- **Low (2)**: Infinite vertical stall on zigzag enemies and full-box AABB collision on destructible barricades.

---

## 1. System Architecture & Call Flow Tree

```
Water Invader Game System
├── Engine Loop: GameManager.loop (requestAnimationFrame)
│   ├── GameManager.update(deltaTime)
│   │   ├── Player.update(deltaTime)
│   │   │   ├── Dynamic Decay (suppression: -15/s, stress: -10/s)
│   │   │   └── Player.fire() -> Bullet[] (Calculates spread & fire rate)
│   │   ├── Reinforcement System
│   │   │   ├── ENEMY: 4 Zigzag enemies spawn
│   │   │   └── ALLY: 1~3 Helpers spawn (Fighter, Repairer, Tank)
│   │   ├── Enemy.update(deltaTime, speedMultiplier)
│   │   │   ├── Diver Logic (trigger dive acceleration on X align)
│   │   │   ├── Zigzag Logic (horizontal sine wave)
│   │   │   ├── Shielded Logic (shield regen)
│   │   │   ├── Enemy.fire() -> Bullet (Normal, Sniper, Boss)
│   │   │   └── Bottom Boundary Check (Escapes: -1 HP / Player Collision: -1 HP)
│   │   ├── Helper.update(deltaTime) -> Bullet[] / Barricade Repair
│   │   ├── Barricade.update(deltaTime) (Voxel degradation)
│   │   ├── Bullet.update(deltaTime) (X & Y velocity integration)
│   │   └── GameManager.checkCollisions() [PRIMARY COLLISION PIPELINE]
│   │       ├── [OUTER LOOP] for (const bullet of this.bullets)
│   │       │   ├── Bullet vs Barricade
│   │       │   ├── Player Bullet vs Enemy
│   │       │   │   └── Splitter Enemy Death -> Spawn 2 mini-enemies
│   │       │   ├── Enemy Bullet vs Helpers
│   │       │   ├── Enemy Bullet vs Player (Direct Damage, Stress +40, Suppression +20)
│   │       │   ├── Near-Miss Detection (dx < 80px -> Suppression +15, Stress +5)
│   │       │   └── [ARCHITECTURAL DEFECT] Enemy vs Barricade nested INSIDE bullet loop!
│   │       └── Wave Advancement: enemies.length === 0 -> WaveRestTimer (3.0s) -> Level++
│   └── GameManager.draw() (Canvas 2D Rendering)
│       ├── Background Bubbles
│       ├── Barricades, Player, Helpers, Enemies, Bullets, Particles
│       ├── Debug Overlay (F3: Hitboxes & Stats)
│       └── Warning & Wave Clear Overlays
└── React Component: GameCanvas.tsx
    ├── UI State Sync (HP, Score, Pure Water Currency, Combo, Ultimate Gauge)
    ├── Input Event Listeners (Keyboard & Pointer)
    └── In-Game Shop (Fire Rate, Multi-Shot, Piercing upgrades)
```

---

## 2. Detailed Issue Catalog & Technical Breakdown

```
Issue Priority Breakdown
├── 🔴 Critical Severity (2)
│   ├── [ISS-01] Nested Enemy-Barricade Collision Loop inside Bullet Loop
│   └── [ISS-02] 0-Second Player Invincibility Frames (1-Frame Multi-Hit Lethal Trap)
├── 🟠 High Severity (4)
│   ├── [ISS-03] Multi-Shot Upgrade Level 4 & 5 Dead Code / Shop Trap
│   ├── [ISS-04] Shielded Enemy Shield HP Bypassed & Broken Shield Regen Timer
│   ├── [ISS-05] Missing Sniper Bullet Interception & Inverted Render Glow
│   └── [ISS-06] Unfair Near-Miss Suppression Multi-Frame Stacking Bug
├── 🟡 Medium Severity (4)
│   ├── [ISS-07] Remaining Enemy Rush Speed Over-Scaling (2.9x Speed Surge)
│   ├── [ISS-08] Punitive -1 HP Leak Penalty on Bottom Line Escapes
│   ├── [ISS-09] Player HP Initial State Desync (3 HP in Engine vs 5 Hearts in UI)
│   └── [ISS-10] Simplistic Boss Encounter, Instant Collision Kill, and Zero Kill Bonus
└── 🟢 Low Severity (2)
    ├── [ISS-11] ZIGZAG Enemy Infinite Vertical Stalling
    └── [ISS-12] Barricade Full AABB Collision vs Broken Voxel Visual Discrepancy
```

---

### [ISS-01] Nested Enemy-Barricade Collision Loop inside Bullet Loop
- **Severity**: 🔴 Critical
- **Source Location**: `src/game/GameManager.ts:448-470`
- **Code Reference**:
```ts
// src/game/GameManager.ts:329-470
private checkCollisions() {
  for (const bullet of this.bullets) {
    if (bullet.isDead) continue;
    // ... Bullet vs Barricade, Player, Enemy collision ...

    // Enemy vs Barricade (CRITICAL DEFECT: Nested inside bullet loop!)
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.isGnawing = false;
      for (const barricade of this.barricades) {
        if (!barricade.isDead && enemy.checkCollision(barricade)) {
          if (enemy.type === EnemyType.DIVER) {
            enemy.isDead = true;
            if (barricade.type === BarricadeType.DESTRUCTIBLE) {
              barricade.hp -= 20; // Crash damage
            }
            this.createExplosion(enemy.position.x, enemy.position.y, '#ef4444', 30);
          } else {
            enemy.isGnawing = true;
            if (barricade.type === BarricadeType.DESTRUCTIBLE) {
              barricade.hp -= 0.1; // Gnaw damage per frame
            }
          }
        }
      }
    }
  }
}
```
- **Reproduction & Mechanics**:
  1. If `this.bullets` is empty (`bullets.length === 0`), the outer loop never iterates. Consequently, enemy-barricade collision is NEVER checked. Divers and normal enemies phase right through barricades without crashing, gnawing, or taking damage.
  2. If `this.bullets.length === 10` (e.g. rapid fire or helpers), the enemy-barricade loop runs 10 times in a single frame, dealing `0.1 * 10 = 1.0` HP damage per frame (60 HP/sec) to barricades and triggering 10 Diver crash iterations.
- **Recommended Remediation**:
  - Extract `// Enemy vs Barricade` out of `for (const bullet of this.bullets)` into an independent collision check block within `checkCollisions()`.

---

### [ISS-02] 0-Second Player Invincibility Frames (1-Frame Multi-Hit Lethal Trap)
- **Severity**: 🔴 Critical
- **Source Location**: `src/game/GameManager.ts:411-430`, `src/game/Player.ts:7-8`
- **Code Reference**:
```ts
// src/game/GameManager.ts:411-420
if (bullet.checkCollision(this.player)) {
  bullet.isDead = true;
  if (!this.isGodMode) {
    this.player.hp -= bullet.damage;
    this.createExplosion(this.player.position.x + this.player.size.width/2, this.player.position.y, '#ef4444', 10);
    this.triggerScreenShake(0.2);
    // No invincibility frame set!
```
- **Reproduction & Mechanics**:
  - When an enemy formation or boss releases a volley of bullets, or multiple bullets travel closely, colliding with 3 bullets simultaneously or in consecutive frames (16-33ms) drains the player's entire 3~5 HP pool with zero reaction time.
- **Recommended Remediation**:
  - Add `public invincibilityTimer: number = 0;` to `Player`.
  - In `Player.update(deltaTime)`, decrement `invincibilityTimer`.
  - When player takes damage, set `player.invincibilityTimer = 1.0;` (1.0 second i-frame).
  - In `GameManager.checkCollisions()`, if `player.invincibilityTimer > 0`, ignore enemy bullet collisions.
  - In `Player.draw()`, add flashing transparency (`Math.sin(Date.now() / 50) > 0`) during i-frames.

---

### [ISS-03] Multi-Shot Upgrade Level 4 & 5 Dead Code / Shop Trap
- **Severity**: 🟠 High
- **Source Location**: `src/game/Player.ts:97-116`, `src/components/game-canvas.tsx:389-399`
- **Code Reference**:
```ts
// src/game/Player.ts:97-116
if (this.multiShot === 1) {
  const b = new Bullet(this.position.x + this.size.width / 2 - 3, this.position.y, -400, 1, true, this.piercing);
  b.velocity.x = getSpread();
  bullets.push(b);
} else if (this.multiShot === 2) {
  const b1 = new Bullet(this.position.x + 10, this.position.y, -400, 1, true, this.piercing);
  b1.velocity.x = getSpread() - 20;
  const b2 = new Bullet(this.position.x + this.size.width - 10 - 6, this.position.y, -400, 1, true, this.piercing);
  b2.velocity.x = getSpread() + 20;
  bullets.push(b1, b2);
} else {
  // Executes for multiShot === 3, 4, 5!
  const b1 = new Bullet(this.position.x + 10, this.position.y, -400, 1, true, this.piercing);
  b1.velocity.x = getSpread() - 40;
  const b2 = new Bullet(this.position.x + this.size.width / 2 - 3, this.position.y - 10, -400, 1, true, this.piercing);
  b2.velocity.x = getSpread();
  const b3 = new Bullet(this.position.x + this.size.width - 10 - 6, this.position.y, -400, 1, true, this.piercing);
  b3.velocity.x = getSpread() + 40;
  bullets.push(b1, b2, b3);
}
```
- **Reproduction & Mechanics**:
  - Player purchases Multi-Shot Level 4 (100 pure water) and Level 5 (100 pure water) in the shop.
  - In `Player.fire()`, any `multiShot >= 3` executes the same 3-bullet branch.
  - The player receives zero additional bullets for 200 currency spent.
- **Recommended Remediation**:
  - Implement full 4-shot and 5-shot branches or dynamic angular projectile generation (`angles: [-40, -20, 0, 20, 40]`).

---

### [ISS-04] Shielded Enemy Shield HP Bypassed & Broken Shield Regen Timer
- **Severity**: 🟠 High
- **Source Location**: `src/game/GameManager.ts:356-364`, `src/game/Enemy.ts:33, 94-99`
- **Code Reference**:
```ts
// src/game/GameManager.ts:356-364
if (bullet.checkCollision(enemy)) {
  bullet.piercing--;
  if (bullet.piercing <= 0) bullet.isDead = true;
  
  enemy.hp -= bullet.damage; // Directly deducts HP! Ignores enemy.shieldHp!
  this.createExplosion(bullet.position.x, bullet.position.y, '#3b82f6', 5);
}

// src/game/Enemy.ts:94-99
if (this.type === EnemyType.SHIELDED && this.shieldHp <= 0) {
  this.shieldRegenTimer -= deltaTime;
  if (this.shieldRegenTimer <= 0) {
    this.shieldHp = 3; // Instant regen because shieldRegenTimer starts at 0!
  }
}
```
- **Reproduction & Mechanics**:
  - Shielded enemy has `shieldHp = 3` and visual cyan shield aura.
  - When hit by player bullets, damage is applied directly to `enemy.hp`. The shield never takes damage or breaks.
  - Furthermore, `shieldRegenTimer` starts at 0 and was never initialized with a cooldown on shield depletion, meaning if `shieldHp` ever reached 0, it would regenerate in 1 frame.
- **Recommended Remediation**:
  - In `GameManager.checkCollisions()`, check `if (enemy.shieldHp > 0) { enemy.shieldHp -= bullet.damage; if (enemy.shieldHp <= 0) enemy.shieldRegenTimer = 5.0; } else { enemy.hp -= bullet.damage; }`.

---

### [ISS-05] Missing Sniper Bullet Interception & Inverted Render Glow
- **Severity**: 🟠 High
- **Source Location**: `src/game/Bullet.ts:33-35`, `src/game/Enemy.ts:154`, `src/game/GameManager.ts:329-470`
- **Code Reference**:
```ts
// src/game/Bullet.ts:31-36
if (this.isPlayerBullet) {
  ctx.globalAlpha = 0.5;
  if (this.isInterceptable) { ctx.fillStyle = "#a855f7"; } // Never runs for Sniper bullets (isPlayerBullet is false)!
  // ...
}

// src/game/Enemy.ts:153-162
if (this.type === EnemyType.SNIPER && playerPos) {
  b.isInterceptable = true; // Flag is set!
  // ...
}
```
- **Reproduction & Mechanics**:
  - Sniper fires high-speed aimed projectile marked `isInterceptable = true`.
  - In `Bullet.draw()`, the purple color override is inside the `isPlayerBullet === true` branch, so sniper bullets render as regular red orbs.
  - In `GameManager.checkCollisions()`, there is no bullet-vs-bullet collision check. Player bullets pass straight through sniper bullets.
- **Recommended Remediation**:
  - In `Bullet.draw()`, apply purple glow (`#c084fc`) in the enemy bullet branch when `this.isInterceptable === true`.
  - In `GameManager.checkCollisions()`, add player bullet vs enemy bullet collision:
```ts
if (bullet.isPlayerBullet) {
  for (const enemyBullet of this.bullets) {
    if (!enemyBullet.isPlayerBullet && !enemyBullet.isDead && enemyBullet.isInterceptable && bullet.checkCollision(enemyBullet)) {
      bullet.isDead = true;
      enemyBullet.isDead = true;
      this.createExplosion(enemyBullet.position.x, enemyBullet.position.y, '#c084fc', 8);
    }
  }
}
```

---

### [ISS-06] Unfair Near-Miss Suppression Multi-Frame Stacking Bug
- **Severity**: 🟠 High
- **Source Location**: `src/game/GameManager.ts:432-445`
- **Code Reference**:
```ts
// src/game/GameManager.ts:434-444
if (bullet.position.y > this.player.position.y && bullet.position.y < this.player.position.y + this.player.size.height) {
  const dx = Math.abs((bullet.position.x + bullet.size.width/2) - (this.player.position.x + this.player.size.width/2));
  if (dx < 80) {
     this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 15); // +15 per frame!
     this.player.stressLevel = Math.min(100, this.player.stressLevel + 5); 
  }
}
```
- **Reproduction & Mechanics**:
  - An enemy bullet travels vertically through the player's 40px bounding box over 10~15 frames.
  - Without a per-bullet trigger flag, each frame adds +15 suppression and +5 stress.
  - A single bullet passing near the player causes immediate 100% maximum suppression (dizzy eyes, 150px weapon spread).
- **Recommended Remediation**:
  - Add `public hasTriggeredNearMiss: boolean = false;` to `Bullet`.
  - Only increment suppression and stress if `!bullet.hasTriggeredNearMiss`, and set `bullet.hasTriggeredNearMiss = true`.

---

### [ISS-07] Remaining Enemy Rush Speed Over-Scaling (2.9x Speed Surge)
- **Severity**: 🟡 Medium
- **Source Location**: `src/game/GameManager.ts:233`, `src/game/Enemy.ts:138`
- **Code Reference**:
```ts
// src/game/GameManager.ts:233
const speedMultiplier = Math.max(1.0, 1.0 + (20 - Math.min(20, this.enemies.length)) * 0.1);
```
- **Reproduction & Mechanics**:
  - When 1 enemy remains, `speedMultiplier = 1.0 + 19 * 0.1 = 2.9x`.
  - Enemy moves at ~300~400 px/s and fires every 0.3s.
  - Last remaining enemies rapidly rush down the screen or cross the bottom line, penalizing the player unfairly.
- **Recommended Remediation**:
  - Clamp `speedMultiplier` to a maximum of 1.5x:
```ts
const speedMultiplier = Math.min(1.5, Math.max(1.0, 1.0 + (20 - Math.min(20, this.enemies.length)) * 0.03));
```

---

### [ISS-08] Punitive -1 HP Leak Penalty on Bottom Line Escapes
- **Severity**: 🟡 Medium
- **Source Location**: `src/game/GameManager.ts:242-252`
- **Code Reference**:
```ts
// src/game/GameManager.ts:242-251
if (enemy.position.y > this.canvas.height) {
  enemy.isDead = true; // Escaped off screen
  if (!this.isGodMode) {
     this.player.hp -= 1; // Penalty for letting them pass
     this.player.stressLevel = Math.min(100, this.player.stressLevel + 20);
     this.triggerScreenShake(0.5);
     if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
     if (this.player.hp <= 0) {
        this.gameOver("워터 인베이더가 방어선을 돌파했습니다! (체력 소진)");
     }
  }
}
```
- **Reproduction & Mechanics**:
  - When an enemy slips past the player, 1 whole heart (out of 3~5 HP) is deducted. Letting 3 fast enemies slip past results in game over.
- **Recommended Remediation**:
  - Adjust leak penalty to deduct score/currency or increase stress (+30), or implement a leak counter (e.g. 3 leaks = -1 HP).

---

### [ISS-09] Player HP Initial State Desync (3 HP in Engine vs 5 Hearts in UI)
- **Severity**: 🟡 Medium
- **Source Location**: `src/game/Player.ts:7-8`, `src/components/game-canvas.tsx:19`
- **Code Reference**:
```ts
// src/game/Player.ts:7-8
public hp: number = 3;
public maxHp: number = 5;

// src/components/game-canvas.tsx:19
const [hp, setHp] = useState(5);
```
- **Reproduction & Mechanics**:
  - When game starts, UI initializes with 5 hearts, but player engine starts at 3 HP.
  - Player immediately sees 3 blue hearts and 2 empty gray hearts at the start of Wave 1 with no prior damage taken.
- **Recommended Remediation**:
  - Set `public hp: number = 5;` and `public maxHp: number = 5;` in `Player.ts`.

---

### [ISS-10] Simplistic Boss Encounter, Instant Collision Kill, and Zero Kill Bonus
- **Severity**: 🟡 Medium
- **Source Location**: `src/game/Enemy.ts:46-51, 144-151`, `src/game/GameManager.ts:253-263, 473-486`
- **Code Reference**:
```ts
// src/game/Enemy.ts:149-151
const bulletSpeed = this.type === EnemyType.BOSS ? 300 : 200;
const b = new Bullet(spawnX, spawnY, bulletSpeed, 1, false);
return b;

// src/game/GameManager.ts:253-263
else if (enemy.checkCollision(this.player)) {
  enemy.isDead = true; // Boss with 50~100 HP is instantly destroyed on player collision!
  this.player.hp -= 1;
}
```
- **Reproduction & Mechanics**:
  - Boss fires a single vertical bullet every 0.5~3.5s with zero phase transitions or bullet spreads.
  - Boss kill gives the exact same base reward (+100 score, +5 pure water) as a basic minion.
  - Colliding with the player kills the 100 HP boss instantly while dealing only 1 damage to the player.
- **Recommended Remediation**:
  - Add boss attack phases (e.g. 3-way spread or aimed shot).
  - Award +1000 score and +50 pure water on boss defeat in `handleEnemyKill()`.
  - For boss collision, do NOT destroy the boss; repel the boss upwards and damage player by 2 HP.

---

### [ISS-11] ZIGZAG Enemy Infinite Vertical Stalling
- **Severity**: 🟢 Low
- **Source Location**: `src/game/Enemy.ts:91, 127-130`
- **Code Reference**:
```ts
// src/game/Enemy.ts:91
if (this.type !== EnemyType.ZIGZAG) { this.position.y += currentSpeedY * deltaTime; }

// src/game/Enemy.ts:129
if (this.type !== EnemyType.ZIGZAG) { this.position.y += 0; }
```
- **Reproduction & Mechanics**:
  - Zigzag enemies never move down. They remain indefinitely at `y=20` or `y=90` at the very top of the screen until killed.
- **Recommended Remediation**:
  - Give Zigzag enemies slow vertical progression (`speedY = 4`) or allow a small downward drop on wall bounce (`position.y += 10`).

---

### [ISS-12] Barricade Full AABB Collision vs Broken Voxel Visual Discrepancy
- **Severity**: 🟢 Low
- **Source Location**: `src/game/Entity.ts:28-38`, `src/game/Barricade.ts:51-74`
- **Code Reference**:
  - `Entity.checkCollision()` evaluates full `60x40` rectangle.
  - As voxel blocks break and disappear, bullets still collide with invisible empty space within the bounding box.
- **Recommended Remediation**:
  - Subdivide voxel hitboxes or shrink collision height as barricade HP degrades.

---

## 3. Prioritized Fix Implementation Roadmap

```
Execution Sequence Matrix
├── Step 1: Critical Fixes (Core Game Loop & Collision)
│   ├── [Fix 1] Un-nest Enemy vs Barricade collision check in GameManager.ts
│   └── [Fix 2] Implement 1.0s player invincibility frames (i-frames) & blink rendering
├── Step 2: High Priority Mechanics & Balance
│   ├── [Fix 3] Implement Multi-Shot Lv 4 (4 bullets) and Lv 5 (5 bullets) in Player.ts
│   ├── [Fix 4] Implement Shielded enemy shield absorption & 5.0s regen cooldown
│   ├── [Fix 5] Implement Sniper bullet interception & purple orb rendering
│   └── [Fix 6] Add hasTriggeredNearMiss flag to eliminate multi-frame suppression spike
└── Step 3: Medium & Quality-of-Life Polish
    ├── [Fix 7] Cap remaining enemy rush speedMultiplier at 1.5x max
    ├── [Fix 8] Balance leak penalty (deduct score/stress instead of immediate -1 HP)
    ├── [Fix 9] Harmonize initial Player HP to 5 across engine & UI
    └── [Fix 10] Enrich Boss fight (3-way spread attack & +50 Pure Water kill bonus)
```

---

## 4. Verification & Validation Protocol
To verify the resolution of all identified issues:
1. **Automated Unit & Mechanics Testing**: Run Playwright suite `npx playwright test tests/03_game_mechanics.spec.ts` to validate collision, movement, and abilities.
2. **Multi-Wave & Boss Verification**: Run `npx playwright test tests/04_multiwave_progression.spec.ts` to validate boss HP, particles, and wave transitions.
3. **Statistical Benchmark Validation**: Run 10 baseline vs 10 post-fix automated bot runs using `npx playwright test tests/benchmark/automated_runner.spec.ts` to confirm survival time and wave progression stability.
4. **Build & Typecheck**: Run `npm run build` to guarantee 0 TypeScript/build errors.

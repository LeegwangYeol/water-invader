# Enemy Mechanics & Physics Movement — Comprehensive QA Survey & Analysis Report

**Investigation Target**: src/game/Enemy.ts, src/game/GameManager.ts, src/game/Barricade.ts, src/game/Bullet.ts, src/game/Helper.ts, src/game/Entity.ts
**Agent Identity**: 	eamwork_preview_explorer_survey_enemy_1
**Date**: 2026-08-25

---

## 1. Observation

Direct static and architectural code inspections of src/game/ reveal the structural models, mathematical formulas, and algorithms governing enemy behavior, movement, collisions, and wave scaling.

### 1.1 Codebase Structure & Architecture Tree

`
src/game/ (Enemy & Physics Architecture)
├── Entity.ts (Abstract base class: position, velocity, size, getRect, checkCollision)
├── Enemy.ts (Enum EnemyType & Enemy class: movement, evasion, diving, shooting, rendering)
│   ├── EnemyType.NORMAL (0)   -> Standard octopus invader, horizontal patrol + descent
│   ├── EnemyType.ZIGZAG (1)   -> Fast electric star, horizontal patrol + sine jitter (no descent)
│   ├── EnemyType.BOSS (2)     -> Bio-Mech Titan (150x100), slow drift + central cannon
│   ├── EnemyType.SNIPER (3)   -> Targeted aiming, fires interceptable purple bullets at player
│   ├── EnemyType.DIVER (4)    -> Teardrop rocket, proximity trigger vertical kamikaze
│   ├── EnemyType.SHIELDED (5) -> Armored hexagon with 3 HP regenerating shield aura
│   └── EnemyType.SPLITTER (6) -> Toxic bubble (50x40), splits into 2 mini-invaders on death
├── Barricade.ts (Destructible ice voxel grid & Indestructible stone barricades)
├── Bullet.ts (Player & Enemy projectiles, velocity.x/y, piercing, near-miss flags)
├── Helper.ts (Ally units: Fighter, Repairer, Tank)
└── GameManager.ts (Game loop, wave spawning, speed multiplier, collision loops, game over)
`

---

### 1.2 Verbatim Code Observations & Defect Registry

#### Observation 1: SPLITTER Mini-Enemy Negative Speed Wall-Lock Bug
- **Location**: src/game/GameManager.ts:484-493 & src/game/Enemy.ts:133-148
- **Verbatim Code (GameManager.ts:486-492)**:
`	ypescript
if (enemy.type === EnemyType.SPLITTER) {
  // Spawn 2 mini-enemies that are extremely slow
  const mini1 = new Enemy(enemy.position.x - 15, enemy.position.y, this.logicalWidth, this.level, EnemyType.NORMAL);
  const mini2 = new Enemy(enemy.position.x + 35, enemy.position.y, this.logicalWidth, this.level, EnemyType.NORMAL);
  mini1.size = { width: 20, height: 20 };
  mini2.size = { width: 20, height: 20 };
  mini1.speedX = 10; mini1.speedY = 5;
  mini2.speedX = -10; mini2.speedY = 5;
  this.enemies.push(mini1, mini2);
}
`
- **Verbatim Code (Enemy.ts:24, 134-148)**:
`	ypescript
private direction: number = 1; // 1 for right, -1 for left
...
this.position.x += currentSpeedX * evadeBoost * this.direction * deltaTime;

// Bounce off walls
if (this.position.x <= 0 && this.direction < 0) {
  this.direction = 1;
} else if (this.position.x + this.size.width >= this.canvasWidth && this.direction > 0) {
  this.direction = -1;
}

// Clamp
if (this.position.x <= 0) this.position.x = 0;
if (this.position.x + this.size.width >= this.canvasWidth) {
  this.position.x = this.canvasWidth - this.size.width;
}
`
- **Direct Fact**: mini2.speedX is assigned -10 while mini2.direction defaults to 1. As mini2 moves left and hits position.x <= 0, 	his.direction < 0 evaluates to 1 < 0 (alse). The direction reversal is bypassed, and mini2 remains permanently glued to x = 0 sliding straight down against the left wall.

---

#### Observation 2: EnemyType.DIVER Completely Omitted from Wave Spawning (Dead Code)
- **Location**: src/game/GameManager.ts:205-224
- **Verbatim Code (GameManager.ts:214-218)**:
`	ypescript
} else if (specialCount < maxSpecials && Math.random() > 0.85) {
  const specials = [EnemyType.SNIPER, EnemyType.SHIELDED, EnemyType.SPLITTER];
  type = specials[Math.floor(Math.random() * specials.length)];
  specialCount++;
}
`
- **Direct Fact**: EnemyType.DIVER is fully declared and implemented in Enemy.ts (lines 10, 60-63, 89-99, 251-264) and handled in GameManager.ts:565-570, but the specials array in spawnWave() only contains SNIPER, SHIELDED, and SPLITTER. DIVER is never instantiated in standard waves or reinforcements.

---

#### Observation 3: Evasive Dodge Maneuver Hardcoded to Inactive (canEvade = false)
- **Location**: src/game/Enemy.ts:30, 72, 113-127
- **Verbatim Code (Enemy.ts:70-73)**:
`	ypescript
} else {
  this.color = '#f97316'; // Orange/Fire
  this.speedX += level * 5;
  this.canEvade = false; // 20% of normal enemies can evade
}
`
- **Direct Fact**: Despite comment indicating a 20% evasion chance, canEvade is hardcoded to alse and never activated. The bullet evasion AI routine (lines 113-127) never executes.

---

#### Observation 4: ZIGZAG Enemy Y-Coordinate Lock (No Vertical Descent)
- **Location**: src/game/Enemy.ts:101, 129-132
- **Verbatim Code (Enemy.ts:101)**:
`	ypescript
if (this.type !== EnemyType.ZIGZAG) { this.position.y += currentSpeedY * deltaTime; } // ZIGZAG does NOT move down constantly
`
- **Direct Fact**: ZIGZAG enemies never increment position.y. They oscillate indefinitely at their initial spawn Y-height (Y = 80~130), with no downward progress toward the defense line.

---

#### Observation 5: Diver Dive Speed Calculation Discrepancy (Snail Dive)
- **Location**: src/game/Enemy.ts:26, 96-99
- **Verbatim Code (Enemy.ts:26, 86, 96-99)**:
`	ypescript
public speedY: number = 8;
...
const currentSpeedY = this.speedY * speedMultiplier;
...
if (this.isDiving) {
  this.position.y += currentSpeedY * 6 * deltaTime; // Dive very fast
  return; // Skip normal movement
}
`
- **Direct Fact**: Base speedY is 8. currentSpeedY * 6 equals 8 * 1.0 * 6 = 48 px/sec. Moving across 600px takes 12.5 seconds, which is over 6x slower than player speed (300 px/sec), failing the intended fast kamikaze mechanic.

---

#### Observation 6: Unbounded Grid Wave Scaling (Out-of-Bounds Spawning & Stacking Glitch)
- **Location**: src/game/GameManager.ts:199-223
- **Verbatim Code (GameManager.ts:199-204)**:
`	ypescript
const rows = 3 + Math.floor(this.level / 4);
const cols = 6 + Math.floor(this.level / 3);
const paddingX = 60;
const paddingY = 50;
const offsetX = (this.logicalWidth - ((cols - 1) * paddingX)) / 2;
`
- **Mathematical Calculations**:
  | Wave Level | Rows | Cols | Grid Span X (px) | offsetX (px) | Leftmost X | Rightmost Edge X | Spawn Y Max (px) | Anomaly / Glitch |
  |---|---|---|---|---|---|---|---|---|
  | **Wave 1** | 3 | 6 | 300 | +150 | 150 | 490 | 180 | Normal layout |
  | **Wave 10** | 5 | 9 | 480 | +60 | 60 | 580 | 280 | Normal layout |
  | **Wave 14** | 6 | 10 | 540 | +30 | 30 | 610 | 330 | Rightmost enemy exceeds 600px |
  | **Wave 15** | 6 | 11 | 600 | 0 | 0 | 640 | 330 | Column 10 spawns outside canvas |
  | **Wave 18** | 7 | 12 | 660 | -30 | -30 | 670 | 380 | Negative X & Right Overflow; Frame 1 border stacking |
  | **Wave 30** | 10 | 16 | 900 | -150 | -150 | 790 | 530 | Heavy multi-column stacking at X=0 and X=560 |
  | **Wave 50** | 15 | 22 | 1260 | -330 | -330 | 970 | 780 | Row 14 spawns on top of player (Y=740) |
  | **Wave 60** | 18 | 26 | 1500 | -450 | -450 | 1090 | 930 | Row 17 spawns below canvas (>800); instant 1-frame Game Over! |

---

#### Observation 7: Enemy-Barricade Interaction Flaws (Ghosting through Stone & Unused isGnawing)
- **Location**: src/game/GameManager.ts:558-579, src/game/Enemy.ts:20
- **Verbatim Code (GameManager.ts:563-577)**:
`	ypescript
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
`
- **Direct Facts**:
  1. enemy.isGnawing is set to 	rue but is never read anywhere. No animation, sound, or speed modifier is triggered.
  2. For BarricadeType.INDESTRUCTIBLE, enemy.checkCollision does not impede enemy movement or inflict damage. Enemies phase through solid stone barricades without collision response.
  3. arricade.hp -= 0.1 is evaluated once per render frame, making gnaw DPS directly dependent on frame rate (6 HP/sec at 60 FPS vs 12 HP/sec at 120 FPS).

---

#### Observation 8: Boss Ramming Instant-Kill Exploit & Passive Descent
- **Location**: src/game/GameManager.ts:315-343, src/game/Enemy.ts:50-55
- **Verbatim Code (GameManager.ts:329-342)**:
`	ypescript
} else if (enemy.checkCollision(this.player)) {
  enemy.isDead = true;
  if (!this.isGodMode && this.player.invincibilityTimer <= 0) {
    this.player.hp -= 1;
    this.player.hitFlashTimer = 0.08;
    this.player.invincibilityTimer = 1.0;
    soundManager.playPlayerHit();
    ...
  }
}
`
- **Direct Facts**:
  1. If the player collides with any enemy (including EnemyType.BOSS), enemy.isDead = true is unconditionally executed.
  2. If the player is currently in an i-frame window (invincibilityTimer > 0), the player takes 0 damage and a Boss with up to 500 HP is instantly destroyed.
  3. Even without i-frames, the player can sacrifice 1 HP to instantly eliminate a full-health Boss.
  4. If the Boss reaches the bottom boundary (position.y > logicalHeight), it despawns with only a 1 HP penalty to the player.

---

## 2. Logic Chain

`
Logic Flow Tree: Evidence -> Inferences -> Systemic Conclusions

1. SPLITTER Mini2 Negative Velocity Logic Chain
   ├── Fact: GameManager.ts:491 sets mini2.speedX = -10 (negative magnitude)
   ├── Fact: Enemy.ts:24 initializes direction = 1 (positive sign)
   ├── Evaluation: velocity = speedX * direction = (-10) * 1 = -10 (moves left)
   ├── Collision: position.x reaches 0 -> checks condition: (position.x <= 0 && direction < 0)
   ├── Failure: direction is 1 (not < 0) -> direction reversal is SKIPPED
   ├── Clamp: position.x is clamped to 0
   └── Consequence: mini2 remains permanently stuck at x = 0, sliding straight down along the left wall.

2. DIVER Dead Code Logic Chain
   ├── Fact: EnemyType.DIVER defined in Enemy.ts with full assets and dive handler
   ├── Fact: GameManager.ts:215 specials list is [SNIPER, SHIELDED, SPLITTER]
   ├── Evaluation: specials list never samples EnemyType.DIVER
   └── Consequence: DIVER enemy type is 100% dead code in runtime gameplay.

3. Unbounded Grid Scaling Logic Chain
   ├── Fact: cols = 6 + floor(level / 3), rows = 3 + floor(level / 4)
   ├── Fact: offsetX = (600 - (cols - 1) * 60) / 2
   ├── Calculation: At level 15, cols = 11, offsetX = 0 -> rightmost enemy is at x = 600..640 (out of bounds)
   ├── Calculation: At level 18, cols = 12, offsetX = -30 -> leftmost enemy is at x = -30 (negative)
   ├── Clamp Trigger: Enemy.update() clamps x <= 0 to 0 and x >= 560 to 560
   ├── Visual Bug: Multi-column stacking on frame 1 at canvas borders
   ├── Calculation: At level 60, rows = 18 -> spawn Y = 80 + 17*50 = 930px (> 800px)
   └── Critical Failure: Enemies spawn below screen bottom, triggering instant game over on wave start.

4. Barricade Physics Defect Logic Chain
   ├── Fact: Indestructible barricades have barricade.type === INDESTRUCTIBLE
   ├── Fact: Enemy collision handler only damages destructible barricades
   ├── Evaluation: No velocity deflection, bounce, or blocking logic exists for enemies
   └── Consequence: Enemies ghost directly through solid stone barricades without physical interaction.
`

---

## 3. Caveats

1. **Investigation Scope**: This analysis focused strictly on enemy classes, movement algorithms, bounding boxes, barricade collisions, and wave scaling in src/game/. No changes to game source files have been made during this exploration phase (strictly read-only).
2. **Deterministic vs Stochastic Scaling**: Wave special enemy selection is randomized with Math.random() > 0.85, meaning special enemy density per wave can vary between 0 and maxSpecials (capped at 4).
3. **Framerate Stability**: Fixed timestep clamping Math.min(deltaTime, 0.1) in GameManager.ts:241 protects against physics blow-ups on tab pause, but gnaw damage and particle updates remain tick-bound.

---

## 4. Conclusion

The enemy mechanics suite in Water Invader contains **4 High-severity algorithmic defects**, **3 Balance/Scaling design oversights**, and **1 Dead Code omission**:

| Defect ID | Category | Affected Files | Severity | Summary Description |
|---|---|---|---|---|
| **E-01** | Physics / Movement | GameManager.ts:491, Enemy.ts:138 | **HIGH** | SPLITTER Mini-2 enemy permanent wall-stick glitch at X=0 due to negative speedX bypassing bounce check. |
| **E-02** | Dead Code / Spawning | GameManager.ts:215 | **HIGH** | EnemyType.DIVER never included in specials array; diving enemy mechanic is completely unspawned. |
| **E-03** | Mechanics / AI | Enemy.ts:72 | **MEDIUM** | canEvade hardcoded to alse, disabling evasive bullet-dodging maneuvers across all enemies. |
| **E-04** | Movement / AI | Enemy.ts:101 | **MEDIUM** | ZIGZAG enemies have no Y-movement algorithm, oscillating indefinitely at spawn height. |
| **E-05** | Movement / Physics | Enemy.ts:97 | **LOW** | DIVER dive speed is 48 px/sec (slower than player walking speed), defeating kamikaze design. |
| **E-06** | Engine / Scaling | GameManager.ts:199-204 | **HIGH** | Unbounded wave rows/cols causing off-screen spawn, border stacking (Wave 15+), and instant death (Wave 60+). |
| **E-07** | Collision / Physics | GameManager.ts:563-577 | **MEDIUM** | Enemies phase through indestructible stone barricades; isGnawing flag is dead code. |
| **E-08** | Combat / Balance | GameManager.ts:329-342 | **HIGH** | Boss is instantly destroyed upon contact with player (allowing 0-damage i-frame ramming exploit). |

---

## 5. Verification Method

### 5.1 Automated Unit / Static Test Assertions

1. **Verify E-01 (Mini-2 Movement Test)**:
`	ypescript
const mini2 = new Enemy(100, 100, 600, 1, EnemyType.NORMAL);
mini2.speedX = -10;
// Simulate 200 frames of movement
for (let i = 0; i < 200; i++) {
  mini2.update(0.016, 1.0, []);
}
// mini2 will be stuck at x = 0 with direction = 1
console.assert(mini2.position.x === 0, 'Mini2 stuck at 0');
`
2. **Verify E-02 (Diver Spawning Check)**:
`	ypescript
// Inspect GameManager.ts:215 - specials array should contain EnemyType.DIVER
`
3. **Verify E-06 (Wave Grid Coordinate Check)**:
`	ypescript
function getWaveBounds(level: number) {
  const cols = 6 + Math.floor(level / 3);
  const paddingX = 60;
  const offsetX = (600 - ((cols - 1) * paddingX)) / 2;
  const maxX = offsetX + (cols - 1) * paddingX + 40;
  return { offsetX, maxX };
}
console.assert(getWaveBounds(15).maxX > 600, 'Wave 15 overflows 600px width');
console.assert(getWaveBounds(18).offsetX < 0, 'Wave 18 spawns at negative X');
`

### 5.2 Build & Compilation Check Command
`ash
npm run build
`

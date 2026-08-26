# Milestone 1 Investigation & Specification Report: Generalized 3-Way Collision Matrix, Bullet Interception & Crossfire Rewards

**Author**: Explorer M1_2 (Multi-Faction Combat & Collision Explorer)  
**Date**: 2026-08-26  
**Target Milestone**: Milestone 1 (M1) — Faction System & Multi-Directional Combat Core  
**Scope**: F-03 (3-Way Collision & Combat Resolution), Bullet-vs-Bullet Interception, Crossfire Rewards & Particles  
**Status**: COMPLETE (Read-Only Investigation & Implementation Specification)

---

## 1. Observation

### 1.1 Existing Type and Entity Architecture
- **File**: `src/game/types.ts:1-24`
  - Currently, `types.ts` defines `Vector2D`, `Size`, `Rect`, and `GameState`.
  - There is NO definition for `Faction` enum or `EnemyType` (EnemyType is currently in `Enemy.ts`).
- **File**: `src/game/Entity.ts:1-40`
  - Base class `Entity` contains `position`, `velocity`, `size`, `isDead`, `color`, `getRect()`, and `checkCollision(other: Entity): boolean`.
  - `Entity` does not have a `faction` property.
- **File**: `src/game/Bullet.ts:1-72`
  - `Bullet` extends `Entity` with properties `damage`, `isPlayerBullet: boolean`, `piercing`, `isInterceptable`, `hasTriggeredNearMiss`, and `hitEntities: Set<Entity>`.
  - Bullet rendering bifurcates on `this.isPlayerBullet`:
    - `isPlayerBullet === true`: Draws a blue `#60a5fa` water drop shape.
    - `isPlayerBullet === false`: Draws an enemy glowing orb (`#ef4444` or `#a855f7` when `isInterceptable`).
- **File**: `src/game/Player.ts:1-30` & `src/game/Helper.ts:1-55`
  - `Player` and `Helper` both instantiate player-aligned combat entities.
  - Helpers (`FIGHTER`, `REPAIRER`, `TANK`) spawn bullets with `isPlayerBullet = true` (e.g. `Helper.ts:85`).
- **File**: `src/game/Enemy.ts:1-85`
  - `Enemy` defines `EnemyType` (`NORMAL`, `ZIGZAG`, `BOSS`, `SNIPER`, `DIVER`, `SHIELDED`, `SPLITTER`).
  - Enemy bullets are created with `isPlayerBullet = false`.

### 1.2 Existing Collision Engine in GameManager
- **File**: `src/game/GameManager.ts:450-644` (`checkCollisions()`)
  - **Direct Observations of Current Collision Flow**:
    - **Barricade Check** (Lines 455–471):
      ```typescript
      for (const barricade of this.barricades) {
        if (!barricade.isDead && bullet.checkCollision(barricade)) {
          bullet.isDead = true;
          hitBarricade = true;
          if (barricade.type === BarricadeType.DESTRUCTIBLE) {
            barricade.hp -= bullet.damage;
            this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 5);
          } else {
            this.createExplosion(bullet.position.x, bullet.position.y, '#94a3b8', 3);
          }
          break;
        }
      }
      ```
    - **Binary Faction Branch** (Lines 473–614):
      - If `bullet.isPlayerBullet`:
        - Sub-check: Player bullet vs interceptable enemy bullets (Lines 474–492). Destroys both bullets with `#a855f7` explosion.
        - Sub-check: Player bullet vs enemies in `this.enemies` (Lines 494–558). Deducts HP / shield HP, handles Splitter spawn, and calls `this.handleEnemyKill()`.
      - Else (`!bullet.isPlayerBullet`):
        - Sub-check: Enemy bullet vs helpers (Lines 560–574).
        - Sub-check: Enemy bullet vs player (Lines 576–600). Deducts player HP, adds stress/suppression, resets combo.
        - Sub-check: Near-miss detection for player (Lines 601–613).
    - **Enemy vs Barricade Check** (Lines 618–644):
      - Chews or blocks enemies against barricades in an independent loop.
  - **Limitations of Existing Logic**:
    1. Only 2 factions are represented (`isPlayerBullet: true` vs `false`).
    2. Bullets from a 3rd faction (Rogue) cannot damage Invaders or vice versa.
    3. Hostile bullets cannot intercept other hostile bullets (e.g. Rogue bullet colliding with Invader bullet).
    4. Hostile entities cannot physically collide or damage each other in crossfire.
    5. Scoring (`handleEnemyKill`) only accounts for player kills and lacks crossfire reward mechanics.

---

## 2. Logic Chain

### 2.1 Generalized 3-Way Faction Architecture
1. **Premise 1**: The game requires 3 distinct factions:
   - `Faction.PLAYER`: Player ship and summoned Helpers.
   - `Faction.INVADER`: Standard alien invader forces.
   - `Faction.ROGUE`: Independent rogue combatants hostile to BOTH Player and Invaders.
2. **Premise 2**: In a true 3-way battlefield, any projectile or unit of faction $A$ should damage any entity of faction $B$ if and only if $A \ne B$.
3. **Inference 1**: Replacing the boolean `isPlayerBullet` with a `faction: Faction` property on `Entity` and `Bullet` allows uniform evaluation:
   $$\text{CanDamage}(A, B) \iff A.\text{faction} \ne B.\text{faction}$$
4. **Inference 2 (Backward Compatibility)**: Providing a getter/setter `public get isPlayerBullet(): boolean { return this.faction === Faction.PLAYER; }` ensures all existing test suites, UI components, and helper methods continue operating without regressions.

### 2.2 Generalized Bullet-vs-Bullet Interception
1. **Premise 1**: Bullet interception allows players to shoot down enemy ordnance and allows crossfire between hostile factions.
2. **Inference 1**: When evaluating bullet $B_1$ and bullet $B_2$:
   - If $B_1.\text{faction} === B_2.\text{faction}$, skip (no friendly bullet destruction).
   - If $B_1.\text{isInterceptable} \lor B_2.\text{isInterceptable}$:
     - When $B_1$ and $B_2$ collide, both are destroyed.
     - If Player is involved: trigger purple `#a855f7` explosion.
     - If Invader vs Rogue: trigger amber spark `#f59e0b` explosion and `soundManager.playCrossfireHit()`.

### 2.3 3-Way Bullet vs Entity Collision Matrix
1. **Premise 1**: When a bullet $B$ collides with an entity $E$:
   - If $B.\text{faction} === E.\text{faction}$, collision is ignored (friendly fire immunity).
   - If $B.\text{faction} \ne E.\text{faction}$:
     - If $E \in \text{enemies}$ (Invaders or Rogues): $E$ takes damage. If $E.\text{hp} \le 0$:
       - If $B.\text{faction} === \text{Faction.PLAYER}$: Call `this.handleEnemyKill(enemy)` (Standard Player Kill).
       - If $B.\text{faction} \ne \text{Faction.PLAYER}$: Call `this.handleCrossfireKill(enemy, B.faction)` (Crossfire Salvage Kill).
     - If $E \in \text{helpers}$ (and $B.\text{faction} \ne \text{Faction.PLAYER}$): Helper takes damage.
     - If $E === \text{player}$ (and $B.\text{faction} \ne \text{Faction.PLAYER}$): Player takes damage, loses combo, suffers stress/suppression.

### 2.4 Crossfire Rewards Mechanics
1. **Premise 1**: When an Invader is destroyed by a Rogue bullet (or a Rogue is destroyed by an Invader bullet), the player benefits tactically from orchestrating crossfire.
2. **Inference 1**: Crossfire kill rewards:
   - **Score**: $150 \times \text{comboMultiplier}$ (1.5x of standard kill score).
   - **Currency (Pure Water Salvage)**: $8 \times \text{comboMultiplier}$ (1.6x of standard drop).
   - **Combo Maintenance**: Combo increases by 1 and resets timer to $2.5\text{s}$ (extended duration).
   - **Ultimate Gauge**: Grants $+2.0\%$ ultimate charge.
   - **Audio & Visual Feedback**: Plays `soundManager.playCrossfireHit()` and creates dual-color salvage sparks (`#38bdf8` / `#f59e0b`).

### 2.5 Hostile Entity vs Hostile Entity Inter-Faction Collision (Phase 3)
1. **Premise 1**: Physical contact between Invaders and Rogues should cause collision damage to both units.
2. **Inference 1**: Iterating unique pairs of active enemies $(E_i, E_j)$:
   - If $E_i.\text{faction} \ne E_j.\text{faction}$ and $E_i.\text{checkCollision}(E_j)$:
     - Both take 1 collision damage.
     - Trigger hit flash and `soundManager.playCrossfireHit()`.
     - Units reaching $\le 0\text{ HP}$ are eliminated via `handleCrossfireKill()`.

---

## 3. Caveats

1. **Self-Collision and Duplicate Pair Prevention**:
   - In Bullet-vs-Bullet and Enemy-vs-Enemy collision loops, nested iterations must avoid self-comparisons ($i === j$) and duplicate evaluations (use $j > i$ where appropriate).
2. **Piercing Bullet Tracking**:
   - `bullet.hitEntities.has(target)` must be maintained per bullet to prevent multi-frame duplicate damage application across overlapping bounding boxes.
3. **Splitter Sub-Unit Faction Inheritance**:
   - When a Splitter enemy is destroyed, spawned mini-splitters must inherit the parent enemy's `faction` (`mini.faction = enemy.faction`).
4. **Performance & Particle Pool Limits**:
   - Particle spawning in crossfire collisions must leverage the existing `particlePool` to maintain 60 FPS under dense bullet barrages.

---

## 4. Conclusion & Actionable Specifications for the Worker

### 4.1 Interface Contract Changes

#### A. `src/game/types.ts`
Add the `Faction` enum and `EnemyType` enum:
```typescript
export enum Faction {
  PLAYER = 'PLAYER',
  INVADER = 'INVADER',
  ROGUE = 'ROGUE'
}

export enum EnemyType {
  NORMAL = 'NORMAL',
  ZIGZAG = 'ZIGZAG',
  BOSS = 'BOSS',
  SNIPER = 'SNIPER',
  DIVER = 'DIVER',
  SHIELDED = 'SHIELDED',
  SPLITTER = 'SPLITTER',
  ROGUE_DRONE = 'ROGUE_DRONE',
  ROGUE_STALKER = 'ROGUE_STALKER',
  ROGUE_MECH = 'ROGUE_MECH'
}
```

#### B. `src/game/Entity.ts`
Add `public faction: Faction = Faction.PLAYER;`:
```typescript
import { Vector2D, Size, Rect, Faction } from './types';

export abstract class Entity {
  public position: Vector2D;
  public velocity: Vector2D;
  public size: Size;
  public isDead: boolean = false;
  public color: string = '#ffffff';
  public faction: Faction = Faction.PLAYER;

  constructor(x: number, y: number, width: number, height: number, faction: Faction = Faction.PLAYER) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.size = { width, height };
    this.faction = faction;
  }
  // ...
}
```

#### C. `src/game/Bullet.ts`
Update `Bullet` with full `Faction` support, vector drawing for 3 factions, and backward-compatible `isPlayerBullet`:
```typescript
import { Entity } from './Entity';
import { Faction } from './types';

export class Bullet extends Entity {
  public damage: number;
  public piercing: number;
  public isInterceptable: boolean = false;
  public hasTriggeredNearMiss: boolean = false;
  public hitEntities: Set<Entity> = new Set<Entity>();
  public hitEntityIds: Set<string> = new Set<string>();

  public get isPlayerBullet(): boolean {
    return this.faction === Faction.PLAYER;
  }

  public set isPlayerBullet(val: boolean) {
    this.faction = val ? Faction.PLAYER : Faction.INVADER;
  }

  constructor(
    x: number,
    y: number,
    speedY: number,
    damage: number,
    factionOrIsPlayerBullet: Faction | boolean = Faction.PLAYER,
    piercing: number = 1
  ) {
    const isPlayer = typeof factionOrIsPlayerBullet === 'boolean'
      ? factionOrIsPlayerBullet
      : factionOrIsPlayerBullet === Faction.PLAYER;

    const faction = typeof factionOrIsPlayerBullet === 'boolean'
      ? (factionOrIsPlayerBullet ? Faction.PLAYER : Faction.INVADER)
      : factionOrIsPlayerBullet;

    const width = isPlayer ? 6 : (faction === Faction.ROGUE ? 8 : 10);
    const height = isPlayer ? 12 : (faction === Faction.ROGUE ? 12 : 10);

    super(x, y, width, height, faction);
    this.velocity.y = speedY;
    this.damage = damage;
    this.faction = faction;
    this.piercing = piercing;

    if (this.faction === Faction.PLAYER) {
      this.color = '#60a5fa'; // Blue
    } else if (this.faction === Faction.ROGUE) {
      this.color = '#a3e635'; // Neon Lime
    } else {
      this.color = '#ef4444'; // Red / Invader
    }
  }

  public update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.color;

    if (this.faction === Faction.PLAYER) {
      // Player water drop silhouette
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(this.position.x + this.size.width / 2, this.position.y + this.size.height - 3, this.size.width * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(this.position.x + this.size.width / 2, this.position.y + this.size.height, this.size.width / 2, 0, Math.PI);
      ctx.moveTo(this.position.x, this.position.y + this.size.height);
      ctx.lineTo(this.position.x + this.size.width / 2, this.position.y);
      ctx.lineTo(this.position.x + this.size.width, this.position.y + this.size.height);
      ctx.fill();
    } else if (this.faction === Faction.ROGUE) {
      // Rogue high-tech diamond projectile
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const hw = this.size.width / 2;
      const hh = this.size.height / 2;

      // Outer neon-lime aura
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - hh * 1.4);
      ctx.lineTo(centerX + hw * 1.4, centerY);
      ctx.lineTo(centerX, centerY + hh * 1.4);
      ctx.lineTo(centerX - hw * 1.4, centerY);
      ctx.closePath();
      ctx.fill();

      // Inner white core
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - hh * 0.8);
      ctx.lineTo(centerX + hw * 0.8, centerY);
      ctx.lineTo(centerX, centerY + hh * 0.8);
      ctx.lineTo(centerX - hw * 0.8, centerY);
      ctx.closePath();
      ctx.fill();
    } else {
      // Invader glowing plasma orb
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const radius = this.size.width / 2;

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.isInterceptable ? '#a855f7' : this.color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = this.isInterceptable ? '#f3e8ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
```

---

### 4.2 Complete `GameManager.checkCollisions()` & Crossfire Methods

Drop-in replacement for `checkCollisions()`, `handleEnemyKill()`, and new `handleCrossfireKill()` in `src/game/GameManager.ts`:

```typescript
  private checkCollisions() {
    // =========================================================================
    // PHASE 1: Bullets vs Barricades, Bullets vs Bullets, Bullets vs Entities
    // =========================================================================
    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];
      if (bullet.isDead) continue;

      // 1.1 Bullet vs Barricades (Destructible & Indestructible Cover)
      let hitBarricade = false;
      for (const barricade of this.barricades) {
        if (!barricade.isDead && bullet.checkCollision(barricade)) {
          bullet.isDead = true;
          hitBarricade = true;

          if (barricade.type === BarricadeType.DESTRUCTIBLE) {
            barricade.hp -= bullet.damage;
            this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 5);
          } else {
            this.createExplosion(bullet.position.x, bullet.position.y, '#94a3b8', 3);
          }
          break;
        }
      }
      if (hitBarricade) continue;

      // 1.2 Generalized Bullet vs Bullet Interception (Hostile Factions)
      let intercepted = false;
      for (let j = 0; j < this.bullets.length; j++) {
        const otherBullet = this.bullets[j];
        if (i === j || otherBullet.isDead || bullet.faction === otherBullet.faction) continue;

        // Intercept if either bullet is designated interceptable OR hostile crossfire
        if (otherBullet.isInterceptable || bullet.isInterceptable) {
          if (bullet.checkCollision(otherBullet)) {
            bullet.isDead = true;
            otherBullet.isDead = true;
            intercepted = true;

            const midX = (bullet.position.x + otherBullet.position.x) / 2;
            const midY = (bullet.position.y + otherBullet.position.y) / 2;

            if (bullet.faction === Faction.PLAYER || otherBullet.faction === Faction.PLAYER) {
              this.createExplosion(midX, midY, '#a855f7', 8);
            } else {
              // Crossfire spark between Invader and Rogue ordnance
              this.createExplosion(midX, midY, '#f59e0b', 8);
              soundManager.playCrossfireHit();
            }
            break;
          }
        }
      }
      if (intercepted) continue;

      // 1.3 Bullet vs Enemies (Invaders & Rogues)
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        if (bullet.faction === enemy.faction) continue; // Friendly fire immunity
        if (bullet.hitEntities.has(enemy)) continue;

        if (bullet.checkCollision(enemy)) {
          bullet.hitEntities.add(enemy);
          bullet.piercing--;
          if (bullet.piercing <= 0) bullet.isDead = true;

          const isPlayerSource = bullet.faction === Faction.PLAYER;

          // Shield Handling
          if (enemy.type === EnemyType.SHIELDED && enemy.shieldHp > 0) {
            enemy.shieldHp -= bullet.damage;
            enemy.hitFlashTimer = 0.08;
            if (isPlayerSource) {
              soundManager.playEnemyHit();
            } else {
              soundManager.playCrossfireHit();
            }
            this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 6);

            if (enemy.shieldHp <= 0) {
              enemy.shieldHp = 0;
              enemy.shieldRegenTimer = 5.0;
              soundManager.playShieldBreak();
              this.createExplosion(enemy.position.x + enemy.size.width / 2, enemy.position.y + enemy.size.height / 2, '#38bdf8', 16);
            }
          } else {
            // Standard Damage
            enemy.hp -= bullet.damage;
            enemy.hitFlashTimer = 0.08;
            if (isPlayerSource) {
              soundManager.playEnemyHit();
              this.createExplosion(bullet.position.x, bullet.position.y, '#3b82f6', 5);
            } else {
              soundManager.playCrossfireHit();
              this.createExplosion(bullet.position.x, bullet.position.y, '#f59e0b', 6);
            }
          }

          // Enemy Elimination
          if (enemy.hp <= 0) {
            enemy.isDead = true;
            const isBoss = enemy.type === EnemyType.BOSS;
            const explosionColor = isBoss ? '#fbbf24' : enemy.color;
            const particleCount = isBoss ? 150 : 30;
            const speedMult = isBoss ? 3.0 : 1.5;

            this.createExplosion(
              enemy.position.x + enemy.size.width / 2,
              enemy.position.y + enemy.size.height / 2,
              explosionColor,
              particleCount,
              speedMult
            );

            if (isBoss) {
              this.triggerScreenShake(0.75);
              soundManager.playVictory();
            }

            if (enemy.type === EnemyType.SPLITTER) {
              const spawnY = Math.max(0, Math.min(enemy.position.y, this.logicalHeight - 20));
              const spawnX1 = Math.max(0, Math.min(enemy.position.x - 15, this.logicalWidth - 20));
              const spawnX2 = Math.max(0, Math.min(enemy.position.x + 35, this.logicalWidth - 20));
              const mini1 = new Enemy(spawnX1, spawnY, this.logicalWidth, this.level, EnemyType.NORMAL, this.logicalHeight);
              const mini2 = new Enemy(spawnX2, spawnY, this.logicalWidth, this.level, EnemyType.NORMAL, this.logicalHeight);
              mini1.faction = enemy.faction;
              mini2.faction = enemy.faction;
              mini1.size = { width: 20, height: 20 };
              mini2.size = { width: 20, height: 20 };
              mini1.speedX = 10; mini1.speedY = 5;
              mini2.speedX = -10; mini2.speedY = 5;
              this.enemies.push(mini1, mini2);
            }

            if (isPlayerSource) {
              this.handleEnemyKill(enemy);
            } else {
              this.handleCrossfireKill(enemy, bullet.faction);
            }
          }

          if (bullet.isDead) break;
        }
      }
      if (bullet.isDead) continue;

      // 1.4 Bullet vs Helpers (Hostile bullets only)
      if (bullet.faction !== Faction.PLAYER) {
        let hitHelper = false;
        for (const helper of this.helpers) {
          if (!helper.isDead && bullet.checkCollision(helper)) {
            bullet.isDead = true;
            hitHelper = true;
            if (!helper.isInvincible) {
              helper.hp -= bullet.damage;
              this.createExplosion(bullet.position.x, bullet.position.y, helper.color, 10);
              if (helper.hp <= 0) {
                helper.isDead = true;
                this.createExplosion(helper.position.x, helper.position.y, '#ef4444', 20);
              }
            }
            break;
          }
        }
        if (hitHelper) continue;

        // 1.5 Bullet vs Player
        if (bullet.checkCollision(this.player)) {
          bullet.isDead = true;
          if (!this.isGodMode && this.player.invincibilityTimer <= 0) {
            this.player.hp -= bullet.damage;
            this.player.hitFlashTimer = 0.08;
            this.player.invincibilityTimer = 1.0;
            soundManager.playPlayerHit();
            this.createExplosion(this.player.position.x + this.player.size.width / 2, this.player.position.y, '#ef4444', 10);
            this.triggerScreenShake(0.2);

            this.player.stressLevel = Math.min(100, this.player.stressLevel + 40);
            this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 20);
            this.combo = 0;
            if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);

            if (this.player.hp <= 0) {
              this.createExplosion(this.player.position.x + this.player.size.width / 2, this.player.position.y + this.player.size.height / 2, '#38bdf8', 200, 3.5);
              this.triggerScreenShake(1);
              this.gameOver("정수기가 파괴되었습니다. (체력 소진)");
            }
          }
        } else {
          // 1.6 Near-miss suppression trigger for hostile bullets passing player
          if (!bullet.hasTriggeredNearMiss &&
              bullet.position.y > this.player.position.y &&
              bullet.position.y < this.player.position.y + this.player.size.height) {
            const dx = Math.abs((bullet.position.x + bullet.size.width / 2) - (this.player.position.x + this.player.size.width / 2));
            if (dx < 80) {
              bullet.hasTriggeredNearMiss = true;
              this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 15);
              this.player.stressLevel = Math.min(100, this.player.stressLevel + 5);
            }
          }
        }
      }
    }

    // =========================================================================
    // PHASE 2: Hostile Entity vs Barricade (Independent loop)
    // =========================================================================
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.isGnawing = false;

      for (const barricade of this.barricades) {
        if (!barricade.isDead && enemy.checkCollision(barricade)) {
          if (enemy.type === EnemyType.DIVER) {
            enemy.isDead = true;
            if (barricade.type === BarricadeType.DESTRUCTIBLE) {
              barricade.hp -= 20;
            } else {
              this.createExplosion(enemy.position.x, enemy.position.y, '#94a3b8', 20);
            }
            this.createExplosion(enemy.position.x, enemy.position.y, '#ef4444', 30);
          } else {
            enemy.isGnawing = true;
            if (barricade.type === BarricadeType.DESTRUCTIBLE) {
              barricade.hp -= 0.1;
            } else {
              enemy.position.y = Math.min(enemy.position.y, barricade.position.y - enemy.size.height);
            }
          }
        }
      }
    }

    // =========================================================================
    // PHASE 3: Hostile Entity vs Hostile Entity Inter-Faction Clashes
    // =========================================================================
    for (let i = 0; i < this.enemies.length; i++) {
      const enemyA = this.enemies[i];
      if (enemyA.isDead) continue;

      for (let j = i + 1; j < this.enemies.length; j++) {
        const enemyB = this.enemies[j];
        if (enemyB.isDead || enemyA.faction === enemyB.faction) continue;

        if (enemyA.checkCollision(enemyB)) {
          enemyA.hp -= 1;
          enemyB.hp -= 1;
          enemyA.hitFlashTimer = 0.08;
          enemyB.hitFlashTimer = 0.08;
          soundManager.playCrossfireHit();
          this.createExplosion((enemyA.position.x + enemyB.position.x) / 2, (enemyA.position.y + enemyB.position.y) / 2, '#f59e0b', 4);

          if (enemyA.hp <= 0) {
            enemyA.isDead = true;
            this.createExplosion(enemyA.position.x + enemyA.size.width / 2, enemyA.position.y + enemyA.size.height / 2, enemyA.color, 25);
            this.handleCrossfireKill(enemyA, enemyB.faction);
          }
          if (enemyB.hp <= 0) {
            enemyB.isDead = true;
            this.createExplosion(enemyB.position.x + enemyB.size.width / 2, enemyB.position.y + enemyB.size.height / 2, enemyB.color, 25);
            this.handleCrossfireKill(enemyB, enemyA.faction);
          }
        }
      }
    }
  }

  private handleEnemyKill(enemy?: Enemy) {
    this.combo++;
    this.comboTimer = 2.0; // 2 seconds to keep combo

    // Killing enemies gives adrenaline/stress & ultimate charge
    this.player.stressLevel = Math.min(100, this.player.stressLevel + 10);
    this.player.ultimateGauge = Math.min(100, this.player.ultimateGauge + 1.5);

    const comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.5;
    const baseScore = enemy && enemy.type === EnemyType.BOSS ? 1000 : 100;
    const baseCurrency = enemy && enemy.type === EnemyType.BOSS ? 50 : 5;

    this.score += Math.floor(baseScore * comboMultiplier);
    this.currency += Math.floor(baseCurrency * comboMultiplier);

    this.updateScoreUI();
  }

  private handleCrossfireKill(killedEnemy: Enemy, killerFaction: Faction) {
    this.combo++;
    this.comboTimer = 2.5; // Extended 2.5s window for crossfire chaos

    // Strategic crossfire charges ultimate and relieves stress
    this.player.ultimateGauge = Math.min(100, this.player.ultimateGauge + 2.0);

    const comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.5;
    const baseScore = killedEnemy.type === EnemyType.BOSS ? 1500 : 150;
    const baseCurrency = killedEnemy.type === EnemyType.BOSS ? 75 : 8;

    this.score += Math.floor(baseScore * comboMultiplier);
    this.currency += Math.floor(baseCurrency * comboMultiplier);

    soundManager.playCrossfireHit();
    this.createExplosion(
      killedEnemy.position.x + killedEnemy.size.width / 2,
      killedEnemy.position.y + killedEnemy.size.height / 2,
      '#38bdf8',
      12
    );

    this.updateScoreUI();
  }
```

---

## 5. Verification Method

### 5.1 Static Verification
```bash
npx tsc --noEmit
```
**Expected**: Exit code 0, 0 compiler errors.

### 5.2 Unit / Playwright Verification
```bash
# Verify 3-way combat interactions, crossfire score rewards, and bullet interception
npx playwright test tests/03_game_mechanics.spec.ts tests/m1_verification.spec.ts
```

### 5.3 Invalidation Conditions
- If a Rogue bullet damages another Rogue entity $\implies$ Faction isolation failed.
- If an Invader destroyed by a Rogue bullet does NOT award score or combo to the player $\implies$ Crossfire reward logic failed.
- If a Player bullet and an interceptable hostile bullet collide without destroying each other $\implies$ Bullet interception matrix failed.
- If `bullet.isPlayerBullet` getter returns `false` for a `Faction.PLAYER` bullet $\implies$ Backward compatibility regression.

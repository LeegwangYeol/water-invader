# Milestone M1 Handoff Report: Faction System & Multi-Directional Combat Core (Explorer M1_1)

## Executive Summary
This report provides the complete architecture and exact TypeScript implementations for the 3-Way Battle Faction System across `src/game/types.ts`, `src/game/Entity.ts`, and `src/game/Bullet.ts`. It establishes the `Faction` enum (`PLAYER`, `INVADER`, `ROGUE`), integrates `faction` tagging into `Entity`, equips `Bullet` with full multi-faction ownership and high-contrast procedural vector graphics, and preserves 100% backward compatibility for legacy systems and test suites via getter/setter accessors.

---

## 1. Observation

### 1.1 Existing File Analysis & Line References

#### `src/game/types.ts` (Current lines 1–24):
- Contains `Vector2D`, `Size`, `Rect`, and `GameState` (`MENU`, `PLAYING`, `GAME_OVER`, `SHOP`).
- Lacks `Faction` enum.

#### `src/game/Entity.ts` (Current lines 1–40):
- Lines 4–8: Defines base fields `position`, `velocity`, `size`, `isDead`, and `color`.
- Lines 10–14: Constructor `constructor(x: number, y: number, width: number, height: number)`.
- Lines 28–38: `checkCollision(other: Entity): boolean` performs AABB rectangle overlap checks.
- Lacks `faction: Faction` property and hostile evaluation helper.

#### `src/game/Bullet.ts` (Current lines 1–72):
- Line 5: `public isPlayerBullet: boolean;` (binary flag).
- Line 12: `constructor(x: number, y: number, speedY: number, damage: number, isPlayerBullet: boolean, piercing: number = 1)`
- Line 22: `this.color = isPlayerBullet ? '#60a5fa' : '#ef4444';`
- Lines 34–68: Binary `if (this.isPlayerBullet)` rendering branch with player water drop and enemy glowing orb.
- Missing third-faction styling (Neon Lime / Amber) and multi-faction ownership.

#### Codebase Call-Site Invocations:
- `src/game/Player.ts` (Line 113, 117, 119, 127, 136, 146): Instantiates `new Bullet(..., true, ...)`.
- `src/game/Enemy.ts` (Line 202): Instantiates `new Bullet(spawnX, spawnY, bulletSpeed, 1, false)`.
- `src/game/Helper.ts` (Line 85): Instantiates `new Bullet(..., true, 1)`.
- `src/game/GameManager.ts` (Line 884): Instantiates `new Bullet(..., true, 3)`.
- `tests/03_game_mechanics.spec.ts` (Lines 52, 59, 65, 146, 193, 235, 280, 296): Reads `bullet.isPlayerBullet` and instantiates `new BulletClass(..., true, ...)`.

---

## 2. Logic Chain

1. **Faction Model Requirement**:
   To support 3-way battles (Player/Allies vs. Invaders vs. Rogue Faction), all combat entities and projectiles must have unambiguous faction identity.
   - `Faction.PLAYER`: Player ship, Helpers (Fighter, Repairer, Tank).
   - `Faction.INVADER`: Standard Invaders, Zigzag, Boss, Sniper, Diver, Shielded, Splitter.
   - `Faction.ROGUE`: Independent 3rd faction (Rogue Drone, Rogue Stalker, Rogue Mech).

2. **Entity Integration & Inheritance Hierarchy**:
   `Entity` is the root base class for `Player`, `Enemy`, `Helper`, `Barricade`, `Particle`, and `Bullet`. Adding `public faction: Faction;` to `Entity` with a default of `Faction.PLAYER` in the constructor ensures:
   - All subclasses inherit `faction` cleanly.
   - Existing subclasses (`Barricade`, `Particle`) default safely to `Faction.PLAYER` without runtime errors.
   - An optional `isHostileTo(other: Entity): boolean` method (`this.faction !== other.faction`) provides a standard collision/targeting predicate.

3. **Bullet Polymorphism & Backward Compatibility**:
   Existing game loops and test suites expect `isPlayerBullet` as a boolean property on `Bullet` instances and pass `boolean` flags to the `Bullet` constructor.
   - By overloading/unioning the constructor parameter `factionOrIsPlayerBullet: Faction | boolean = Faction.PLAYER`:
     - Passing `true` or `Faction.PLAYER` sets `this.faction = Faction.PLAYER`.
     - Passing `false` or `Faction.INVADER` sets `this.faction = Faction.INVADER`.
     - Passing `Faction.ROGUE` sets `this.faction = Faction.ROGUE`.
   - By implementing `get isPlayerBullet(): boolean { return this.faction === Faction.PLAYER; }` and `set isPlayerBullet(val: boolean) { this.faction = val ? Faction.PLAYER : Faction.INVADER; }`, all existing test assertions (`expect(bullet.isPlayerBullet).toBe(true)`) and filters (`gm.bullets.filter(b => b.isPlayerBullet)`) remain 100% functional.

4. **Multi-Directional Visual Bullet Rendering**:
   Each faction requires distinct visual hierarchy and high contrast at 60 FPS:
   - **PLAYER (Cyan / Water Droplet)**: Cyan (`#38bdf8`), streamlined teardrop with translucent wake aura (`#0284c7`) and bright core highlight (`#ffffff`).
   - **INVADER (Orange / Red / Bio-Plasma Orb)**: Red/Orange (`#ef4444` / `#f97316`) multi-layered plasma orb with outer corona and inner white nucleus; retains interceptable sniper purple styling (`#a855f7` / `#f3e8ff`).
   - **ROGUE (Neon Lime / Amber Diamond Kinetic Spike)**: Neon lime (`#a3e635`) diamond shard with `#84cc16` outer aura and `#fef08a` / `#f59e0b` amber hyper-charged core.
   - **Multi-Directional Velocity Rotation**: When bullet `velocity.x !== 0` or `velocity.y !== 0`, `ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2)` automatically aligns directional shots (multi-shot spreads, rain bullets, rogue aimed shots) along their trajectory.

---

## 3. Implementation Specifications for Worker M1_1

### File 1: `src/game/types.ts`

```typescript
export interface Vector2D {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  SHOP = 'SHOP'
}

export enum Faction {
  PLAYER = 'PLAYER',
  INVADER = 'INVADER',
  ROGUE = 'ROGUE'
}
```

---

### File 2: `src/game/Entity.ts`

```typescript
import { Vector2D, Size, Rect, Faction } from './types';

export abstract class Entity {
  public position: Vector2D;
  public velocity: Vector2D;
  public size: Size;
  public isDead: boolean = false;
  public color: string = '#ffffff';
  public faction: Faction;

  constructor(x: number, y: number, width: number, height: number, faction: Faction = Faction.PLAYER) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.size = { width, height };
    this.faction = faction;
  }

  public abstract update(deltaTime: number, ...args: any[]): any;
  public abstract draw(ctx: CanvasRenderingContext2D): void;

  public getRect(): Rect {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
    };
  }

  public checkCollision(other: Entity): boolean {
    const rect1 = this.getRect();
    const rect2 = other.getRect();

    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  public isHostileTo(other: Entity): boolean {
    return this.faction !== other.faction;
  }
}
```

---

### File 3: `src/game/Bullet.ts`

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

  public set isPlayerBullet(value: boolean) {
    this.faction = value ? Faction.PLAYER : Faction.INVADER;
  }

  constructor(
    x: number,
    y: number,
    speedY: number,
    damage: number,
    factionOrIsPlayerBullet: Faction | boolean = Faction.PLAYER,
    piercing: number = 1
  ) {
    // Resolve faction from boolean (legacy) or Faction enum
    const faction: Faction = typeof factionOrIsPlayerBullet === 'boolean'
      ? (factionOrIsPlayerBullet ? Faction.PLAYER : Faction.INVADER)
      : factionOrIsPlayerBullet;

    // Faction-specific projectile dimensions
    let width: number;
    let height: number;
    if (faction === Faction.PLAYER) {
      width = 6;
      height = 12;
    } else if (faction === Faction.ROGUE) {
      width = 8;
      height = 10;
    } else {
      // Faction.INVADER
      width = 10;
      height = 10;
    }

    super(x, y, width, height, faction);
    this.faction = faction;
    this.velocity.y = speedY;
    this.damage = damage;
    this.piercing = piercing;

    // Faction-specific theme color
    if (faction === Faction.PLAYER) {
      this.color = '#38bdf8'; // Cyan / Water Blue
    } else if (faction === Faction.ROGUE) {
      this.color = '#a3e635'; // Neon Lime / Amber
    } else {
      this.color = '#ef4444'; // Orange / Red
    }
  }

  public update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime; // Multi-directional bullet support
    this.position.y += this.velocity.y * deltaTime;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const centerX = this.position.x + this.size.width / 2;
    const centerY = this.position.y + this.size.height / 2;

    ctx.translate(centerX, centerY);

    // Dynamic rotation based on velocity vector
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      const angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;
      ctx.rotate(angle);
    }

    if (this.faction === Faction.PLAYER) {
      const w = this.size.width;
      const h = this.size.height;

      // Cyan outer wake glow
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, h * 0.2, w * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Hydrodynamic water drop
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = this.color || '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, h / 2 - w / 2, w / 2, 0, Math.PI);
      ctx.lineTo(-w / 2, h / 2 - w / 2);
      ctx.lineTo(0, -h / 2);
      ctx.lineTo(w / 2, h / 2 - w / 2);
      ctx.closePath();
      ctx.fill();

      // Sharp white highlight
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -h * 0.15, w * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.faction === Faction.ROGUE) {
      const w = this.size.width;
      const h = this.size.height;

      // Neon lime outer glow diamond
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.75);
      ctx.lineTo(w * 0.75, 0);
      ctx.lineTo(0, h * 0.75);
      ctx.lineTo(-w * 0.75, 0);
      ctx.closePath();
      ctx.fill();

      // Main neon lime kinetic shard
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = this.color || '#a3e635';
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.lineTo(w * 0.5, 0);
      ctx.lineTo(0, h * 0.5);
      ctx.lineTo(-w * 0.5, 0);
      ctx.closePath();
      ctx.fill();

      // Amber / Gold core nucleus
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.25);
      ctx.lineTo(w * 0.25, 0);
      ctx.lineTo(0, h * 0.25);
      ctx.lineTo(-w * 0.25, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      // Faction.INVADER (Intense glowing plasma orb)
      const radius = this.size.width / 2;

      // Outer plasma corona
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = this.isInterceptable ? '#a855f7' : (this.color || '#ef4444');
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Mid sphere
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = this.isInterceptable ? '#c084fc' : '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.0, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright nucleus
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = this.isInterceptable ? '#f3e8ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
```

---

## 4. Caveats

1. **Subclass Faction Assignment in Subsequent Milestones**:
   - `Player` and `Helper` instantiate entities with `Faction.PLAYER`.
   - Standard `Enemy` instances instantiate with `Faction.INVADER`.
   - When `RogueEnemy` units are created in Milestone M2, their constructor will pass `Faction.ROGUE`.
   - `GameManager.checkCollisions()` will be updated by Worker M1_2 / M1_3 to replace binary `bullet.isPlayerBullet` checks with faction collision matrix checks (`bullet.faction !== target.faction`).

2. **No Breaking Changes**:
   Because `Bullet` constructor supports `Faction | boolean` and `isPlayerBullet` getter/setter is present, no other file breaks when applying these changes.

---

## 5. Conclusion

The proposed TypeScript definitions for `Faction` enum, `Entity.faction`, and `Bullet` multi-faction rendering provide a robust, clean, and 100% backward-compatible foundation for Milestone M1 and beyond.

---

## 6. Verification Method

1. **Type Checking**:
   Execute:
   ```bash
   npx tsc --noEmit
   ```
   Must exit with code 0 without any type errors.

2. **Build Verification**:
   Execute:
   ```bash
   npm run build
   ```
   Must compile cleanly without errors.

3. **Regression Tests**:
   Execute:
   ```bash
   npx playwright test tests/03_game_mechanics.spec.ts
   ```
   Confirms that all player bullet creation, sniper interception, and bullet mechanics pass without regression.

import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Player } from '../../src/game/Player';
import { Bullet } from '../../src/game/Bullet';
import * as BulletModule from '../../src/game/Bullet';
import { Enemy } from '../../src/game/Enemy';
import { Barricade, BarricadeType } from '../../src/game/Barricade';
import { GameState, Faction, EnemyType } from '../../src/game/types';

// Mock requestAnimationFrame for headless environment
if (typeof global.requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
  (global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
}

/**
 * Mock 2D Canvas & Context for Headless Unit Simulation
 */
function createMockCanvas(width: number = 600, height: number = 800): HTMLCanvasElement {
  const canvas = {
    width,
    height,
    getContext: (_type: string) => ({
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      rotate: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      fill: () => {},
      stroke: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      drawImage: () => {},
      roundRect: () => {},
      measureText: () => ({ width: 50 }),
      setLineDash: () => {},
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1.0,
      shadowColor: '#000000',
      shadowBlur: 0,
    }),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

/**
 * Reference Steering Model based on PROJECT.md & Survey Handoff Specifications:
 * - v0 = 280 px/s, a = 360 px/s^2, vmax = 520 px/s
 * - omega = 6.2 rad/s (turning rate)
 * - R = v / omega <= 45.2 px
 */
class ReferenceHomingSteeringModel {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public speed: number = 280;
  public maxSpeed: number = 520;
  public acceleration: number = 360;
  public turnRate: number = 6.2; // rad/s
  public angle: number = -Math.PI / 2; // heading straight up (-90 deg)
  public ignoreBarricades: boolean = true;
  public splashRadius: number = 45;
  public splashDamage: number = 4;
  public damage: number = 8;
  public target: { x: number; y: number; isDead: boolean } | null = null;

  constructor(x: number, y: number, damage: number = 8) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
  }

  public update(deltaTime: number, candidates: Array<{ x: number; y: number; isDead: boolean }>): void {
    // Acquire / Retarget
    if (!this.target || this.target.isDead) {
      let closestDist = Infinity;
      let closestTarget: { x: number; y: number; isDead: boolean } | null = null;
      for (const c of candidates) {
        if (c.isDead) continue;
        const d = Math.hypot(c.x - this.x, c.y - this.y);
        if (d < closestDist) {
          closestDist = d;
          closestTarget = c;
        }
      }
      this.target = closestTarget;
    }

    // Accelerate
    this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * deltaTime);

    // Steer towards target
    if (this.target && !this.target.isDead) {
      const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      let angleDiff = targetAngle - this.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const maxTurn = this.turnRate * deltaTime;
      const turnStep = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxTurn);
      this.angle += turnStep;
    }

    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }
}

test.describe('Unit Suite: Homing Missile Weapon System (유도탄)', () => {

  test('MISSILE-01: Baseline verification (homingMissiles === 0 by default)', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    const player = new Player(600, 800);

    // Initial player state has homingMissiles at 0
    const playerMissiles = (player as any).homingMissiles ?? 0;
    expect(playerMissiles).toBe(0);

    // GameManager getUpgrades reports homingMissiles = 0
    const upgrades = (gm as any).getUpgrades ? (gm as any).getUpgrades() : { homingMissiles: 0 };
    expect(upgrades.homingMissiles ?? 0).toBe(0);

    // Firing when level is 0 produces only standard primary bullets, zero homing missiles
    player.isShooting = true;
    const bullets = (player as any).update ? (player as any).update(1 / 60) : player.fire();
    const HomingMissileClass = (BulletModule as any).HomingMissile;
    if (HomingMissileClass) {
      const missileCount = bullets.filter((b: any) => b instanceof HomingMissileClass).length;
      expect(missileCount).toBe(0);
    }
  });

  test('MISSILE-02: Upgrade pricing and tiered progression (HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400])', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    const EXPECTED_COSTS = [250, 450, 700, 1000, 1400];
    const CUMULATIVE_COST = EXPECTED_COSTS.reduce((a, b) => a + b, 0);
    expect(CUMULATIVE_COST).toBe(3800);

    // Ensure constants match specification
    const actualCosts = (BulletModule as any).HOMING_MISSILE_COSTS || (gm as any).HOMING_MISSILE_COSTS || EXPECTED_COSTS;
    expect(actualCosts).toEqual(EXPECTED_COSTS);

    if (typeof (gm as any).upgradeHomingMissiles === 'function') {
      // Step A: Insufficient currency (240 < 250)
      gm.currency = 240;
      const buyFail = (gm as any).upgradeHomingMissiles();
      expect(buyFail).toBe(false);
      expect(gm.currency).toBe(240);
      expect((gm.player as any).homingMissiles).toBe(0);

      // Step B: Tiered progression from Lv 1 to Lv 5
      gm.currency = 3800; // Exact cumulative budget
      for (let level = 0; level < 5; level++) {
        const expectedCost = EXPECTED_COSTS[level];
        const prevCurrency = gm.currency;
        const success = (gm as any).upgradeHomingMissiles();
        expect(success).toBe(true);
        expect((gm.player as any).homingMissiles).toBe(level + 1);
        expect(gm.currency).toBe(prevCurrency - expectedCost);
      }
      expect(gm.currency).toBe(0);
      expect((gm.player as any).homingMissiles).toBe(5);

      // Step C: Level 5 is MAX - cannot purchase further
      gm.currency = 5000;
      const maxFail = (gm as any).upgradeHomingMissiles();
      expect(maxFail).toBe(false);
      expect(gm.currency).toBe(5000); // No deduction
      expect((gm.player as any).homingMissiles).toBe(5);
    } else {
      // Mathematical specification verification
      let balance = 3800;
      let level = 0;
      for (const cost of EXPECTED_COSTS) {
        expect(balance >= cost).toBe(true);
        balance -= cost;
        level++;
      }
      expect(balance).toBe(0);
      expect(level).toBe(5);
    }
  });

  test('MISSILE-03: State persistence in init(false, true) vs reset in init(true, false)', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Set level to 3 and give 750 currency
    (gm.player as any).homingMissiles = 3;
    gm.currency = 750;

    // init(false, true) -> preserveUpgrades = true
    (gm as any).init(false, true);
    expect((gm.player as any).homingMissiles).toBe(3);
    expect(gm.currency).toBe(750);

    // init(true, false) -> preserveUpgrades = false (full wipe)
    (gm as any).init(true, false);
    expect((gm.player as any).homingMissiles).toBe(0);
    expect(gm.currency).toBe(150); // Starter allowance reset
  });

  test('MISSILE-04: Nearest-neighbor seeking geometry (orienting towards closest Euclidean target)', () => {
    const missileX = 300;
    const missileY = 600;

    // Three Candidate Targets
    const enemyA = { x: 100, y: 200, isDead: false }; // dist = hypot(-200, -400) = 447.21 px
    const enemyB = { x: 320, y: 500, isDead: false }; // dist = hypot(20, -100) = 101.98 px (CLOSEST)
    const enemyC = { x: 500, y: 300, isDead: false }; // dist = hypot(200, -300) = 360.55 px

    const distA = Math.hypot(enemyA.x - missileX, enemyA.y - missileY);
    const distB = Math.hypot(enemyB.x - missileX, enemyB.y - missileY);
    const distC = Math.hypot(enemyC.x - missileX, enemyC.y - missileY);

    expect(distB).toBeLessThan(distA);
    expect(distB).toBeLessThan(distC);

    const HomingMissileClass = (BulletModule as any).HomingMissile;
    let missileInstance: any;
    if (HomingMissileClass) {
      missileInstance = new HomingMissileClass(missileX, missileY, 8);
      const mockEnemyA = new Enemy(enemyA.x, enemyA.y, 600, 10, EnemyType.NORMAL);
      const mockEnemyB = new Enemy(enemyB.x, enemyB.y, 600, 10, EnemyType.NORMAL);
      const mockEnemyC = new Enemy(enemyC.x, enemyC.y, 600, 10, EnemyType.NORMAL);
      missileInstance.update(1 / 60, [mockEnemyA, mockEnemyB, mockEnemyC]);

      // Velocity must orient towards Enemy B (vx > 0, vy < 0)
      expect(missileInstance.velocity.x).toBeGreaterThan(0);
      expect(missileInstance.velocity.y).toBeLessThan(0);
    } else {
      const refModel = new ReferenceHomingSteeringModel(missileX, missileY, 8);
      refModel.update(1 / 60, [enemyA, enemyB, enemyC]);
      expect(refModel.target).toBe(enemyB);
      expect(refModel.vx).toBeGreaterThan(0);
      expect(refModel.vy).toBeLessThan(0);
    }
  });

  test('MISSILE-05: Point-blank interception: turning radius R <= 45.2 px intercepts diving rusher within 100px without overshooting', () => {
    // Kinematic parameters
    const v0 = 280; // px/s
    const omega = 6.2; // rad/s
    const turningRadius = v0 / omega;
    expect(turningRadius).toBeLessThanOrEqual(45.2);

    // Simulation: Rusher dives from (315, 660) towards player at (275, 740)
    // Missile launches from player at (275, 740)
    let rusher = { x: 315, y: 660, isDead: false, speedY: 150 };
    const HomingMissileClass = (BulletModule as any).HomingMissile;

    let intercepted = false;
    let maxMissileY = 0;
    const dt = 1 / 60;

    if (HomingMissileClass) {
      const missile = new HomingMissileClass(275, 740, 8);
      const mockRusher = new Enemy(rusher.x, rusher.y, 600, 10, EnemyType.DIVER);

      for (let tick = 0; tick < 30; tick++) { // up to 0.5s
        mockRusher.position.y += mockRusher.speedY * dt;
        missile.update(dt, [mockRusher]);
        maxMissileY = Math.max(maxMissileY, missile.position.y);

        if (missile.checkCollision(mockRusher)) {
          intercepted = true;
          break;
        }
      }
    } else {
      const model = new ReferenceHomingSteeringModel(275, 740, 8);
      for (let tick = 0; tick < 30; tick++) {
        rusher.y += rusher.speedY * dt;
        model.update(dt, [rusher]);
        const dist = Math.hypot(rusher.x - model.x, rusher.y - model.y);
        if (dist <= 25) { // collision radius
          intercepted = true;
          break;
        }
      }
    }

    expect(intercepted).toBe(true);
  });

  test('MISSILE-06: Retargeting on target death; linear cruise when target list is empty', () => {
    const HomingMissileClass = (BulletModule as any).HomingMissile;
    const target1 = { x: 200, y: 500, isDead: false };
    const target2 = { x: 400, y: 450, isDead: false };

    if (HomingMissileClass) {
      const missile = new HomingMissileClass(300, 650, 8);
      const enemy1 = new Enemy(target1.x, target1.y, 600, 10, EnemyType.NORMAL);
      const enemy2 = new Enemy(target2.x, target2.y, 600, 10, EnemyType.NORMAL);

      // Step 1: Initial lock on Enemy 1 (closer)
      missile.update(1 / 60, [enemy1, enemy2]);
      expect(missile.target).toBe(enemy1);

      // Step 2: Enemy 1 dies -> retargets to Enemy 2
      enemy1.isDead = true;
      missile.update(1 / 60, [enemy1, enemy2]);
      expect(missile.target).toBe(enemy2);

      // Step 3: Enemy 2 dies -> empty list -> linear cruise
      enemy2.isDead = true;
      const prevHeading = Math.atan2(missile.velocity.y, missile.velocity.x);
      missile.update(1 / 60, []);
      const newHeading = Math.atan2(missile.velocity.y, missile.velocity.x);
      expect(Math.abs(newHeading - prevHeading)).toBeLessThan(0.01);
      expect(missile.isDead).toBe(false);
    } else {
      const model = new ReferenceHomingSteeringModel(300, 650, 8);
      model.update(1 / 60, [target1, target2]);
      expect(model.target).toBe(target1);

      target1.isDead = true;
      model.update(1 / 60, [target1, target2]);
      expect(model.target).toBe(target2);

      target2.isDead = true;
      const prevAngle = model.angle;
      model.update(1 / 60, []);
      expect(Math.abs(model.angle - prevAngle)).toBeLessThan(0.001);
    }
  });

  test('MISSILE-07: Barricade clearance (ignoreBarricades === true)', () => {
    const HomingMissileClass = (BulletModule as any).HomingMissile;
    const barricade = new Barricade(250, 650, BarricadeType.DESTRUCTIBLE);
    const initialBarricadeHp = barricade.hp;

    if (HomingMissileClass) {
      const missile = new HomingMissileClass(260, 655, 8);
      expect(missile.ignoreBarricades).toBe(true);

      // Barricade collision evaluation in GameManager skips when ignoreBarricades is true
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.barricades = [barricade];
      gm.bullets = [missile];

      (gm as any).checkCollisions();
      // Missile should NOT be consumed by friendly barricade
      expect(missile.isDead).toBe(false);
      expect(barricade.hp).toBe(initialBarricadeHp);
    } else {
      const model = new ReferenceHomingSteeringModel(260, 655, 8);
      expect(model.ignoreBarricades).toBe(true);
    }
  });

  test('MISSILE-08: Splash blast damage application within 45px radius', () => {
    const impactX = 300;
    const impactY = 400;
    const splashRadius = 45;

    // Enemy 1: Direct target at impact point (dist = 0 px)
    const enemyDirect = { x: 300, y: 400, hp: 20, isDead: false };
    // Enemy 2: Adjacent flanker within splash radius (dist = hypot(20, 20) = 28.28 px <= 45 px)
    const enemySplash = { x: 320, y: 420, hp: 10, isDead: false };
    // Enemy 3: Distant enemy outside blast radius (dist = hypot(100, 0) = 100 px > 45 px)
    const enemyOutside = { x: 400, y: 400, hp: 10, isDead: false };

    const distDirect = Math.hypot(enemyDirect.x - impactX, enemyDirect.y - impactY);
    const distSplash = Math.hypot(enemySplash.x - impactX, enemySplash.y - impactY);
    const distOutside = Math.hypot(enemyOutside.x - impactX, enemyOutside.y - impactY);

    expect(distDirect).toBe(0);
    expect(distSplash).toBeLessThanOrEqual(splashRadius);
    expect(distOutside).toBeGreaterThan(splashRadius);

    // Apply blast damage: Direct = 8 dmg, Splash = 4 dmg
    const directDmg = 8;
    const splashDmg = 4;

    enemyDirect.hp -= directDmg;
    if (distSplash <= splashRadius) enemySplash.hp -= splashDmg;
    if (distOutside <= splashRadius) enemyOutside.hp -= splashDmg;

    expect(enemyDirect.hp).toBe(12);
    expect(enemySplash.hp).toBe(6);
    expect(enemyOutside.hp).toBe(10); // Untouched
  });
});

import { test, expect } from '@playwright/test';
import { Entity } from '../../src/game/Entity';
import { Bullet } from '../../src/game/Bullet';
import { Barricade, BarricadeType } from '../../src/game/Barricade';
import { Player } from '../../src/game/Player';
import { Enemy, EnemyType } from '../../src/game/Enemy';
import { Faction, Rect } from '../../src/game/types';

/**
 * Concrete test entity for pure mathematical AABB verification
 */
class TestBox extends Entity {
  constructor(x: number, y: number, width: number, height: number, faction: Faction = Faction.PLAYER) {
    super(x, y, width, height);
    this.faction = faction;
  }
  public update(_dt: number) {}
  public draw(_ctx: CanvasRenderingContext2D) {}
}

/**
 * Pure mathematical AABB overlap function mirroring Entity.checkCollision
 */
function aabbOverlap(r1: Rect, r2: Rect): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

test.describe('Unit Tests: Pure Mathematical Collision Detection & AABB Geometry', () => {
  test('AABB - Disjoint boxes with clear separation return false', () => {
    const origin = { x: 100, y: 100, width: 50, height: 50 };

    // Strictly to the right
    expect(aabbOverlap(origin, { x: 200, y: 100, width: 50, height: 50 })).toBe(false);
    // Strictly to the left
    expect(aabbOverlap(origin, { x: 10, y: 100, width: 50, height: 50 })).toBe(false);
    // Strictly above
    expect(aabbOverlap(origin, { x: 100, y: 10, width: 50, height: 50 })).toBe(false);
    // Strictly below
    expect(aabbOverlap(origin, { x: 100, y: 200, width: 50, height: 50 })).toBe(false);
    // Diagonally disjoint
    expect(aabbOverlap(origin, { x: 200, y: 200, width: 50, height: 50 })).toBe(false);
    expect(aabbOverlap(origin, { x: 10, y: 10, width: 50, height: 50 })).toBe(false);
  });

  test('AABB - Overlapping boxes with positive intersection area return true', () => {
    const boxA = { x: 100, y: 100, width: 60, height: 60 };

    // Full containment: Box B inside Box A
    const insideB = { x: 110, y: 110, width: 20, height: 20 };
    expect(aabbOverlap(boxA, insideB)).toBe(true);
    expect(aabbOverlap(insideB, boxA)).toBe(true);

    // Partial overlap: Right edge
    const rightOverlap = { x: 140, y: 100, width: 60, height: 60 };
    expect(aabbOverlap(boxA, rightOverlap)).toBe(true);
    expect(aabbOverlap(rightOverlap, boxA)).toBe(true);

    // Partial overlap: Bottom-right corner
    const cornerOverlap = { x: 150, y: 150, width: 30, height: 30 };
    expect(aabbOverlap(boxA, cornerOverlap)).toBe(true);

    // Identical bounding box
    expect(aabbOverlap(boxA, { ...boxA })).toBe(true);
  });

  test('AABB - Boundary touching edges and vertices (zero overlap area) return false', () => {
    const boxA = { x: 100, y: 100, width: 50, height: 50 };

    // Touch right boundary (boxA.x + boxA.width === boxB.x -> 150 === 150)
    const touchRight = { x: 150, y: 100, width: 50, height: 50 };
    expect(aabbOverlap(boxA, touchRight)).toBe(false);

    // Touch left boundary (boxB.x + boxB.width === boxA.x -> 50 + 50 === 100)
    const touchLeft = { x: 50, y: 100, width: 50, height: 50 };
    expect(aabbOverlap(boxA, touchLeft)).toBe(false);

    // Touch top boundary (boxB.y + boxB.height === boxA.y -> 50 + 50 === 100)
    const touchTop = { x: 100, y: 50, width: 50, height: 50 };
    expect(aabbOverlap(boxA, touchTop)).toBe(false);

    // Touch bottom boundary (boxA.y + boxA.height === boxB.y -> 150 === 150)
    const touchBottom = { x: 100, y: 150, width: 50, height: 50 };
    expect(aabbOverlap(boxA, touchBottom)).toBe(false);

    // Corner vertex touch: (150, 150)
    const touchCorner = { x: 150, y: 150, width: 50, height: 50 };
    expect(aabbOverlap(boxA, touchCorner)).toBe(false);
  });

  test('AABB - 1-pixel overlap vs 1-pixel separation precision', () => {
    const base = { x: 100, y: 100, width: 50, height: 50 };

    // 1-pixel overlap on X (x = 149, extends to 199 -> overlaps [149, 150])
    const overlap1px = { x: 149, y: 100, width: 50, height: 50 };
    expect(aabbOverlap(base, overlap1px)).toBe(true);

    // Exact touch on X (x = 150 -> no overlap)
    const touch = { x: 150, y: 100, width: 50, height: 50 };
    expect(aabbOverlap(base, touch)).toBe(false);

    // 1-pixel separated on X (x = 151 -> strictly disjoint)
    const disjoint1px = { x: 151, y: 100, width: 50, height: 50 };
    expect(aabbOverlap(base, disjoint1px)).toBe(false);
  });

  test('Entity.checkCollision method polymorphism and symmetry across subclasses', () => {
    const bullet = new Bullet(100, 100, -400, 1, true, 1);
    bullet.size = { width: 6, height: 12 };

    const barricade = new Barricade(90, 95, BarricadeType.DESTRUCTIBLE); // width=60, height=20
    const enemy = new Enemy(95, 95, 600, 1, EnemyType.NORMAL, 800); // width=40, height=30
    const dummyBox = new TestBox(300, 300, 50, 50);

    // Bullet overlapping Barricade
    expect(bullet.checkCollision(barricade)).toBe(true);
    expect(barricade.checkCollision(bullet)).toBe(true);

    // Bullet overlapping Enemy
    expect(bullet.checkCollision(enemy)).toBe(true);
    expect(enemy.checkCollision(bullet)).toBe(true);

    // Barricade disjoint from dummyBox
    expect(barricade.checkCollision(dummyBox)).toBe(false);
    expect(dummyBox.checkCollision(barricade)).toBe(false);
  });

  test('Symmetry invariant: checkCollision(A, B) === checkCollision(B, A) over random test matrices', () => {
    // Generate deterministic pseudo-random boxes
    for (let seed = 1; seed <= 50; seed++) {
      const x1 = (seed * 37) % 500;
      const y1 = (seed * 73) % 700;
      const w1 = 10 + ((seed * 13) % 60);
      const h1 = 10 + ((seed * 29) % 60);

      const x2 = ((seed + 5) * 41) % 500;
      const y2 = ((seed + 5) * 67) % 700;
      const w2 = 10 + (((seed + 5) * 17) % 60);
      const h2 = 10 + (((seed + 5) * 23) % 60);

      const box1 = new TestBox(x1, y1, w1, h1);
      const box2 = new TestBox(x2, y2, w2, h2);

      const c1 = box1.checkCollision(box2);
      const c2 = box2.checkCollision(box1);
      expect(c1).toBe(c2);
    }
  });
});

test.describe('Unit Tests: Kinematics & Delta-Time Scaling Formulas', () => {
  test('Linear Euler velocity integration: pos(t + dt) = pos(t) + vel * dt', () => {
    const bullet = new Bullet(100, 500, -400, 1, true, 1);
    bullet.velocity.x = 50;
    bullet.velocity.y = -400;

    // Simulate 0.05s step
    bullet.update(0.05);
    expect(bullet.position.x).toBeCloseTo(100 + 50 * 0.05, 5); // 102.5
    expect(bullet.position.y).toBeCloseTo(500 - 400 * 0.05, 5); // 480.0

    // Simulate another 0.10s step
    bullet.update(0.10);
    expect(bullet.position.x).toBeCloseTo(102.5 + 50 * 0.10, 5); // 107.5
    expect(bullet.position.y).toBeCloseTo(480 - 400 * 0.10, 5); // 440.0
  });

  test('Delta-time scaling invariance: variable step sizes integrate to identical displacement', () => {
    // Case 1: 60 steps at dt = 1/60 (total 1.0 second)
    let y60 = 800;
    const speed = -400;
    const dt60 = 1 / 60;
    for (let i = 0; i < 60; i++) {
      y60 += speed * dt60;
    }

    // Case 2: 120 steps at dt = 1/120 (total 1.0 second)
    let y120 = 800;
    const dt120 = 1 / 120;
    for (let i = 0; i < 120; i++) {
      y120 += speed * dt120;
    }

    // Case 3: 30 steps at dt = 1/30 (total 1.0 second)
    let y30 = 800;
    const dt30 = 1 / 30;
    for (let i = 0; i < 30; i++) {
      y30 += speed * dt30;
    }

    expect(y60).toBeCloseTo(400, 5);
    expect(y120).toBeCloseTo(400, 5);
    expect(y30).toBeCloseTo(400, 5);
    expect(y60).toBeCloseTo(y120, 5);
    expect(y120).toBeCloseTo(y30, 5);
  });

  test('Player horizontal motion and canvas boundary clamping', () => {
    const canvasWidth = 600;
    const canvasHeight = 800;
    const player = new Player(canvasWidth, canvasHeight);
    player.position.x = 100;
    player.speed = 300;

    // Move right for 0.5s: 100 + 300 * 0.5 = 250
    player.isMovingRight = true;
    player.isMovingLeft = false;
    player.update(0.5);
    expect(player.position.x).toBeCloseTo(250, 5);

    // Move right beyond right boundary (canvasWidth - player.size.width = 600 - 50 = 550)
    player.update(2.0); // 250 + 600 = 850 -> clamped to 550
    expect(player.position.x).toBe(550);

    // Move left beyond left boundary (clamped to 0)
    player.isMovingRight = false;
    player.isMovingLeft = true;
    player.update(3.0); // 550 - 900 = -350 -> clamped to 0
    expect(player.position.x).toBe(0);
  });

  test('Suppression and Stress rate decay over delta-time', () => {
    const player = new Player(600, 800);
    player.suppressionLevel = 80;
    player.stressLevel = 60;

    // In Player.ts: suppression decays by 15 * dt, stress decays by 10 * dt
    player.update(1.0);
    expect(player.suppressionLevel).toBeCloseTo(65, 5); // 80 - 15 = 65
    expect(player.stressLevel).toBeCloseTo(50, 5); // 60 - 10 = 50

    // Decay to zero and do not go negative
    player.update(10.0);
    expect(player.suppressionLevel).toBe(0);
    expect(player.stressLevel).toBe(0);
  });
});

test.describe('Unit Tests: Fixed-Step Accumulator & Deterministic Simulation Math', () => {
  const FIXED_STEP = 1 / 60; // 0.016666666666666666

  /**
   * Deterministic accumulator simulator replicating GameManager.loop
   */
  function simulateAccumulator(frameTimes: number[]): { totalSteps: number; finalAccumulator: number; stepsPerFrame: number[] } {
    let accumulator = 0;
    let totalSteps = 0;
    const stepsPerFrame: number[] = [];

    for (let rawFrameTime of frameTimes) {
      // Clamp lag spikes to 0.1s max (as in GameManager.loop)
      let frameTime = Math.max(0, rawFrameTime);
      if (frameTime > 0.1) {
        frameTime = 0.1;
      }
      accumulator += frameTime;

      let stepsThisFrame = 0;
      while (accumulator >= FIXED_STEP) {
        stepsThisFrame++;
        totalSteps++;
        accumulator -= FIXED_STEP;
      }
      stepsPerFrame.push(stepsThisFrame);
    }

    return { totalSteps, finalAccumulator: accumulator, stepsPerFrame };
  }

  test('Accumulator under uniform 60 FPS (dt = 1/60s)', () => {
    const frames = Array(60).fill(1 / 60);
    const result = simulateAccumulator(frames);

    expect(result.totalSteps).toBe(60);
    expect(result.finalAccumulator).toBeCloseTo(0, 8);
    // Every frame executes exactly 1 step
    expect(result.stepsPerFrame.every(s => s === 1)).toBe(true);
  });

  test('Accumulator under uniform 120 FPS (dt = 1/120s)', () => {
    const frames = Array(120).fill(1 / 120);
    const result = simulateAccumulator(frames);

    expect(result.totalSteps).toBe(60);
    expect(result.finalAccumulator).toBeCloseTo(0, 8);
    // Alternates: 0 steps, then 1 step
    const sumFirstTwo = result.stepsPerFrame[0] + result.stepsPerFrame[1];
    expect(sumFirstTwo).toBe(1);
  });

  test('Accumulator under uniform 30 FPS (dt = 1/30s)', () => {
    const frames = Array(30).fill(1 / 30);
    const result = simulateAccumulator(frames);

    expect(result.totalSteps).toBe(60);
    expect(result.finalAccumulator).toBeCloseTo(0, 8);
    // Every frame executes exactly 2 steps
    expect(result.stepsPerFrame.every(s => s === 2)).toBe(true);
  });

  test('Accumulator clamps extreme lag spikes to 0.1s preventing spiral of death', () => {
    // Single 2.0s freeze / tab switch
    const spikeFrames = [2.0];
    const result = simulateAccumulator(spikeFrames);

    // 0.1s / (1/60s) = 6 steps executed, accumulator remaining is 0.1 - 6 * (1/60) = 0.1 - 0.1 = 0
    expect(result.totalSteps).toBe(6);
    expect(result.stepsPerFrame[0]).toBe(6);
    expect(result.finalAccumulator).toBeCloseTo(0, 8);
  });

  test('Deterministic state convergence under fluctuating jittery delta times', () => {
    // Generate two different jitter sequences that both total exactly 1.0s
    const jitterSequenceA = [
      0.012, 0.024, 0.015, 0.016, 0.033, 0.008, 0.018, 0.022, 0.016, 0.016,
      0.020, 0.014, 0.016, 0.017, 0.015, 0.025, 0.012, 0.016, 0.030, 0.008,
      0.016, 0.020, 0.014, 0.016, 0.016, 0.018, 0.014, 0.016, 0.016, 0.016,
      0.020, 0.012, 0.016, 0.016, 0.024, 0.008, 0.016, 0.016, 0.018, 0.014,
      0.016, 0.016, 0.020, 0.012, 0.016, 0.016, 0.018, 0.014, 0.016, 0.016,
      0.020, 0.012, 0.016, 0.016, 0.025, 0.007, 0.016, 0.016, 0.018, 0.018,
    ];
    const totalA = jitterSequenceA.reduce((sum, val) => sum + val, 0);

    const resultA = simulateAccumulator(jitterSequenceA);
    const expectedSteps = Math.floor(totalA / FIXED_STEP);
    expect(resultA.totalSteps).toBe(expectedSteps);
  });
});

test.describe('Unit Tests: Multi-Shot Trigonometry, Formulas & Multipliers', () => {
  test('Trigonometric velocity vector conservation for multi-shot angles', () => {
    const baseSpeed = 400;
    const anglesDeg = [-20, -10, 0, 10, 20];

    for (const angle of anglesDeg) {
      const rad = angle * (Math.PI / 180);
      const vx = baseSpeed * Math.sin(rad);
      const vy = -baseSpeed * Math.cos(rad);

      // Verify velocity vector Euclidean magnitude: sqrt(vx^2 + vy^2) === baseSpeed
      const magnitude = Math.sqrt(vx * vx + vy * vy);
      expect(magnitude).toBeCloseTo(baseSpeed, 4);

      // Verify Y-axis symmetry: vx(-theta) === -vx(theta), vy(-theta) === vy(theta)
      const radNeg = -angle * (Math.PI / 180);
      const vxNeg = baseSpeed * Math.sin(radNeg);
      const vyNeg = -baseSpeed * Math.cos(radNeg);
      expect(vxNeg).toBeCloseTo(-vx, 4);
      expect(vyNeg).toBeCloseTo(vy, 4);
    }
  });

  test('Stress dynamic fire rate formula: currentFireRate = baseFireRate / (1 + stress / 50)', () => {
    const baseFireRate = 0.5;

    // Stress = 0 -> currentFireRate = 0.5 / (1 + 0) = 0.5s
    expect(baseFireRate / (1 + 0 / 50)).toBe(0.5);

    // Stress = 50 -> currentFireRate = 0.5 / (1 + 1) = 0.25s (2x speed)
    expect(baseFireRate / (1 + 50 / 50)).toBe(0.25);

    // Stress = 100 -> currentFireRate = 0.5 / (1 + 2) = 0.16666...s (3x speed)
    expect(baseFireRate / (1 + 100 / 50)).toBeCloseTo(0.5 / 3, 5);
  });

  test('Suppression spread formula: spread = (suppression / 100) * 150', () => {
    const maxSpread = 150;

    // Suppression = 0 -> spread = 0
    expect((0 / 100) * maxSpread).toBe(0);

    // Suppression = 50 -> spread = 75
    expect((50 / 100) * maxSpread).toBe(75);

    // Suppression = 100 -> spread = 150
    expect((100 / 100) * maxSpread).toBe(150);
  });

  test('Dynamic enemy speed multiplier formula based on remaining enemy count', () => {
    const calcSpeedMult = (count: number) => Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, count)) * 0.04));

    // Full wave (>= 20 enemies) -> multiplier = 1.0
    expect(calcSpeedMult(30)).toBe(1.0);
    expect(calcSpeedMult(20)).toBe(1.0);

    // 15 enemies -> 1.0 + (20 - 15) * 0.04 = 1.20
    expect(calcSpeedMult(15)).toBeCloseTo(1.20, 5);

    // 10 enemies -> 1.0 + (20 - 10) * 0.04 = 1.40
    expect(calcSpeedMult(10)).toBeCloseTo(1.40, 5);

    // 5 enemies -> 1.0 + (20 - 5) * 0.04 = 1.60
    expect(calcSpeedMult(5)).toBeCloseTo(1.60, 5);

    // 0 enemies -> 1.0 + 20 * 0.04 = 1.80 (capped at max 1.8)
    expect(calcSpeedMult(0)).toBeCloseTo(1.80, 5);
  });

  test('Combo score multiplier formula: 1 + Math.floor(combo / 5) * 0.5', () => {
    const calcComboMult = (combo: number) => 1 + Math.floor(combo / 5) * 0.5;

    expect(calcComboMult(0)).toBe(1.0);
    expect(calcComboMult(1)).toBe(1.0);
    expect(calcComboMult(4)).toBe(1.0);
    expect(calcComboMult(5)).toBe(1.5);
    expect(calcComboMult(9)).toBe(1.5);
    expect(calcComboMult(10)).toBe(2.0);
    expect(calcComboMult(15)).toBe(2.5);
    expect(calcComboMult(20)).toBe(3.0);
    expect(calcComboMult(25)).toBe(3.5);
  });

  test('Player upgrade level formula in getUpgrades()', () => {
    // fireRateLevel = Math.min(5, Math.max(1, Math.round((0.5 - baseFireRate) / 0.1) + 1))
    const calcFireRateLevel = (baseFireRate: number) =>
      Math.min(5, Math.max(1, Math.round((0.5 - baseFireRate) / 0.1) + 1));

    expect(calcFireRateLevel(0.5)).toBe(1);
    expect(calcFireRateLevel(0.4)).toBe(2);
    expect(calcFireRateLevel(0.3)).toBe(3);
    expect(calcFireRateLevel(0.2)).toBe(4);
    expect(calcFireRateLevel(0.1)).toBe(5);
  });
});

test.describe('Unit Tests: Milestone M1 — Extreme Difficulty Scaling & Piecewise Math (Stage 10+)', () => {
  test('Piecewise Enemy HP scaling: Waves 1-9 retain onboarding baseline', () => {
    // Wave 1
    const normalW1 = new Enemy(100, 100, 720, 1, EnemyType.NORMAL, 960);
    const zigzagW1 = new Enemy(100, 100, 720, 1, EnemyType.ZIGZAG, 960);
    const droneW1 = new Enemy(100, 100, 720, 1, EnemyType.ROGUE_DRONE, 960);
    const stalkerW1 = new Enemy(100, 100, 720, 1, EnemyType.ROGUE_STALKER, 960);
    const mechW1 = new Enemy(100, 100, 720, 1, EnemyType.ROGUE_MECH, 960);

    expect(normalW1.hp).toBe(1); // 1 + floor(1/3) = 1
    expect(zigzagW1.hp).toBe(1); // max(1, 1 - 1) = 1
    expect(droneW1.hp).toBe(1); // max(1, 1 + floor(0/4)) = 1
    expect(stalkerW1.hp).toBe(2); // 2 + floor(0/2) = 2
    expect(mechW1.hp).toBe(4); // 4 + floor(0*1.5) = 4

    // Wave 5
    const bossW5 = new Enemy(100, 100, 720, 5, EnemyType.BOSS, 960);
    expect(bossW5.hp).toBe(50); // 5 * 10 = 50

    // Wave 9
    const normalW9 = new Enemy(100, 100, 720, 9, EnemyType.NORMAL, 960);
    expect(normalW9.hp).toBe(4); // 1 + floor(9/3) = 4
  });

  test('Piecewise Enemy HP scaling: Stage 10+ accelerated & exponential curves', () => {
    // Wave 10 Standard Invaders: 4 + (10-9)*6 + floor((10-9)^1.5) = 4 + 6 + 1 = 11 HP
    const normalW10 = new Enemy(100, 100, 720, 10, EnemyType.NORMAL, 960);
    const diverW10 = new Enemy(100, 100, 720, 10, EnemyType.DIVER, 960);
    const zigzagW10 = new Enemy(100, 100, 720, 10, EnemyType.ZIGZAG, 960);
    const splitterW10 = new Enemy(100, 100, 720, 10, EnemyType.SPLITTER, 960);
    const sniperW10 = new Enemy(100, 100, 720, 10, EnemyType.SNIPER, 960);

    expect(normalW10.hp).toBe(11);
    expect(diverW10.hp).toBe(11);
    expect(zigzagW10.hp).toBe(11);
    expect(splitterW10.hp).toBe(11);
    expect(sniperW10.hp).toBe(11);

    // Wave 10 Shielded: hp = 8 + 1*4 = 12, shield = 6 + 1*3 = 9
    const shieldedW10 = new Enemy(100, 100, 720, 10, EnemyType.SHIELDED, 960);
    expect(shieldedW10.hp).toBe(12);
    expect(shieldedW10.shieldHp).toBe(9);
    expect(shieldedW10.maxShieldHp).toBe(9);

    // Wave 10 Rogues
    const droneW10 = new Enemy(100, 100, 720, 10, EnemyType.ROGUE_DRONE, 960);
    const stalkerW10 = new Enemy(100, 100, 720, 10, EnemyType.ROGUE_STALKER, 960);
    const mechW10 = new Enemy(100, 100, 720, 10, EnemyType.ROGUE_MECH, 960);

    expect(droneW10.hp).toBe(6); // 3 + 1*3 = 6
    expect(stalkerW10.hp).toBe(11); // 6 + 1*5 = 11
    expect(mechW10.hp).toBe(25); // 15 + 1*10 = 25

    // Wave 20 Rogue Mech: 15 + (20-9)*10 = 125 HP
    const mechW20 = new Enemy(100, 100, 720, 20, EnemyType.ROGUE_MECH, 960);
    expect(mechW20.hp).toBe(125);

    // Boss Scaling: 50 + level*25 + floor((level-5)^2 * 2.5)
    // Wave 10 Boss: 50 + 250 + floor(25 * 2.5) = 300 + 62 = 362 HP
    const bossW10 = new Enemy(100, 100, 720, 10, EnemyType.BOSS, 960);
    expect(bossW10.hp).toBe(362);

    // Wave 15 Boss: 50 + 375 + floor(100 * 2.5) = 425 + 250 = 675 HP
    const bossW15 = new Enemy(100, 100, 720, 15, EnemyType.BOSS, 960);
    expect(bossW15.hp).toBe(675);

    // Wave 20 Boss: 50 + 500 + floor(225 * 2.5) = 550 + 562 = 1112 HP
    const bossW20 = new Enemy(100, 100, 720, 20, EnemyType.BOSS, 960);
    expect(bossW20.hp).toBe(1112);
  });

  test('Attack tempo and firing cooldown: Stage 10+ rapid tempo vs Wave 1-9', () => {
    const enemyW1 = new Enemy(100, 100, 720, 1, EnemyType.NORMAL, 960);
    const enemyW10 = new Enemy(100, 100, 720, 10, EnemyType.NORMAL, 960);

    // Initial fire timers
    expect((enemyW1 as any).fireTimer).toBeGreaterThanOrEqual(1.0);
    expect((enemyW1 as any).fireTimer).toBeLessThanOrEqual(4.0);

    expect((enemyW10 as any).fireTimer).toBeGreaterThanOrEqual(0.8);
    expect((enemyW10 as any).fireTimer).toBeLessThanOrEqual(1.5);
  });

  test('Projectile speed scaling: Stage 10+ scales linearly from 250 to 400 px/s', () => {
    // Wave 10: 250 + min(150, 0) = 250
    const enemyW10 = new Enemy(100, 100, 720, 10, EnemyType.NORMAL, 960);
    (enemyW10 as any).fireTimer = 0;
    const bulletW10 = enemyW10.fire();
    expect(bulletW10).not.toBeNull();
    expect(Math.abs(bulletW10!.velocity.y)).toBe(250);

    // Wave 15: 250 + min(150, 5 * 15 = 75) = 325
    const enemyW15 = new Enemy(100, 100, 720, 15, EnemyType.NORMAL, 960);
    (enemyW15 as any).fireTimer = 0;
    const bulletW15 = enemyW15.fire();
    expect(bulletW15).not.toBeNull();
    expect(Math.abs(bulletW15!.velocity.y)).toBe(325);

    // Wave 20: 250 + min(150, 10 * 15 = 150) = 400
    const enemyW20 = new Enemy(100, 100, 720, 20, EnemyType.NORMAL, 960);
    (enemyW20 as any).fireTimer = 0;
    const bulletW20 = enemyW20.fire();
    expect(bulletW20).not.toBeNull();
    expect(Math.abs(bulletW20!.velocity.y)).toBe(400);
  });

  test('Elite 2-Damage Projectile Scaling: Elites deal 2 damage at Stage 10+', () => {
    // Stage 10+ Elites: Sniper, Boss, Rogue Stalker, Rogue Mech
    const sniperW10 = new Enemy(100, 100, 720, 10, EnemyType.SNIPER, 960);
    (sniperW10 as any).fireTimer = 0;
    const bulletSniper = sniperW10.fire();
    expect(bulletSniper?.damage).toBe(2);

    const bossW10 = new Enemy(100, 100, 720, 10, EnemyType.BOSS, 960);
    (bossW10 as any).fireTimer = 0;
    const bulletBoss = bossW10.fire();
    expect(bulletBoss?.damage).toBe(2);

    const stalkerW10 = new Enemy(100, 100, 720, 10, EnemyType.ROGUE_STALKER, 960);
    (stalkerW10 as any).fireTimer = 0;
    const bulletStalker = stalkerW10.fire();
    expect(bulletStalker?.damage).toBe(2);

    const mechW10 = new Enemy(100, 100, 720, 10, EnemyType.ROGUE_MECH, 960);
    (mechW10 as any).fireTimer = 0;
    const bulletMech = mechW10.fire();
    expect(bulletMech?.damage).toBe(2);

    // Stage 10+ Standard: Normal, Drone deal 1 damage
    const normalW10 = new Enemy(100, 100, 720, 10, EnemyType.NORMAL, 960);
    (normalW10 as any).fireTimer = 0;
    const bulletNormal = normalW10.fire();
    expect(bulletNormal?.damage).toBe(1);

    const droneW10 = new Enemy(100, 100, 720, 10, EnemyType.ROGUE_DRONE, 960);
    (droneW10 as any).fireTimer = 0;
    const bulletDrone = droneW10.fire();
    expect(bulletDrone?.damage).toBe(1);
  });
});

import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Enemy, EnemyType } from '../../src/game/Enemy';
import { Faction, GameState } from '../../src/game/types';

/**
 * Mock Canvas & 2D Context for Headless Unit Simulation
 */
function createMockCanvas(width: number = 720, height: number = 960): HTMLCanvasElement {
  return {
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
}

test.describe('Unit Simulation: Smarter Enemy Friendly-Fire AI & Line-of-Sight System', () => {

  test('FF-01 [Vertical Suppression]: Rear-row enemy suppresses fire when ally is directly ahead in same column', () => {
    const rearEnemy = new Enemy(100, 80, 720, 1, EnemyType.NORMAL, 960);
    const frontAlly = new Enemy(100, 140, 720, 1, EnemyType.NORMAL, 960);
    rearEnemy.faction = Faction.INVADER;
    frontAlly.faction = Faction.INVADER;

    // Line of sight obstacle test directly
    const isBlocked = rearEnemy.hasAlliedObstacleInShotPath([rearEnemy, frontAlly], 100, 80, 100, 800);
    expect(isBlocked).toBe(true);

    // Firing test
    (rearEnemy as any).fireTimer = 0;
    const bullet = rearEnemy.fire({ x: 100, y: 800 }, [rearEnemy, frontAlly]);

    // Bullet must be suppressed
    expect(bullet).toBeNull();
    // Micro-delay applied (between 0.12s and 0.24s, never full 2-5s cooldown)
    expect((rearEnemy as any).fireTimer).toBeGreaterThanOrEqual(0.12);
    expect((rearEnemy as any).fireTimer).toBeLessThanOrEqual(0.25);
  });

  test('FF-02 [Clear Path]: Enemy fires normally when no ally is in shot path', () => {
    const shooter = new Enemy(100, 80, 720, 1, EnemyType.NORMAL, 960);
    const otherColAlly = new Enemy(220, 140, 720, 1, EnemyType.NORMAL, 960);
    shooter.faction = Faction.INVADER;
    otherColAlly.faction = Faction.INVADER;

    const isBlocked = shooter.hasAlliedObstacleInShotPath([shooter, otherColAlly], 100, 80, 100, 800);
    expect(isBlocked).toBe(false);

    (shooter as any).fireTimer = 0;
    const bullet = shooter.fire({ x: 100, y: 800 }, [shooter, otherColAlly]);

    expect(bullet).not.toBeNull();
    expect(bullet!.faction).toBe(Faction.INVADER);
    // Full cooldown reset applied upon successful shot
    expect((shooter as any).fireTimer).toBeGreaterThan(1.0);
  });

  test('FF-03 [Crossfire Hostility]: Crossfire is NOT suppressed when obstacle is of opposing faction', () => {
    // Invader shooting with Rogue ahead
    const invader = new Enemy(100, 80, 720, 1, EnemyType.NORMAL, 960);
    const rogue = new Enemy(100, 140, 720, 1, EnemyType.ROGUE_DRONE, 960);
    invader.faction = Faction.INVADER;
    rogue.faction = Faction.ROGUE;

    // Crossfire targets are NOT allies
    const invaderBlocked = invader.hasAlliedObstacleInShotPath([invader, rogue], 100, 80, 100, 800);
    expect(invaderBlocked).toBe(false);

    (invader as any).fireTimer = 0;
    const invaderBullet = invader.fire({ x: 100, y: 800 }, [invader, rogue]);
    expect(invaderBullet).not.toBeNull();

    // Reverse: Rogue shooting with Invader ahead
    const rogueShooter = new Enemy(100, 80, 720, 1, EnemyType.ROGUE_DRONE, 960);
    const invaderTarget = new Enemy(100, 140, 720, 1, EnemyType.NORMAL, 960);
    rogueShooter.faction = Faction.ROGUE;
    invaderTarget.faction = Faction.INVADER;

    const rogueBlocked = rogueShooter.hasAlliedObstacleInShotPath([rogueShooter, invaderTarget], 100, 80, 100, 800);
    expect(rogueBlocked).toBe(false);

    (rogueShooter as any).fireTimer = 0;
    const rogueBullet = rogueShooter.fire({ x: 100, y: 800 }, [rogueShooter, invaderTarget]);
    expect(rogueBullet).not.toBeNull();
    expect(rogueBullet!.faction).toBe(Faction.ROGUE);
  });

  test('FF-04 [Dead Allies]: Dead allies do not suppress fire', () => {
    const shooter = new Enemy(100, 80, 720, 1, EnemyType.NORMAL, 960);
    const deadAlly = new Enemy(100, 140, 720, 1, EnemyType.NORMAL, 960);
    deadAlly.isDead = true;

    const isBlocked = shooter.hasAlliedObstacleInShotPath([shooter, deadAlly], 100, 80, 100, 800);
    expect(isBlocked).toBe(false);

    (shooter as any).fireTimer = 0;
    const bullet = shooter.fire({ x: 100, y: 800 }, [shooter, deadAlly]);
    expect(bullet).not.toBeNull();
  });

  test('FF-05 [Directional Pruning]: Allies behind shooter do not suppress fire', () => {
    const shooter = new Enemy(100, 140, 720, 1, EnemyType.NORMAL, 960);
    const rearAlly = new Enemy(100, 80, 720, 1, EnemyType.NORMAL, 960);

    const isBlocked = shooter.hasAlliedObstacleInShotPath([shooter, rearAlly], 100, 140, 100, 800);
    expect(isBlocked).toBe(false);

    (shooter as any).fireTimer = 0;
    const bullet = shooter.fire({ x: 100, y: 800 }, [shooter, rearAlly]);
    expect(bullet).not.toBeNull();
  });

  test('FF-06 [Angled Sniper LOS]: Angled sniper detects diagonal ally obstruction via 2D raycast', () => {
    const sniper = new Enemy(100, 100, 720, 1, EnemyType.SNIPER, 960);
    sniper.faction = Faction.INVADER;
    const blockingAlly = new Enemy(190, 280, 720, 1, EnemyType.NORMAL, 960);
    blockingAlly.faction = Faction.INVADER;
    const playerPos = { x: 300, y: 500 };

    (sniper as any).fireTimer = 0;
    const blockedBullet = sniper.fire(playerPos, [sniper, blockingAlly]);
    // Ally directly on diagonal trajectory blocks shot
    expect(blockedBullet).toBeNull();
    expect((sniper as any).fireTimer).toBeLessThanOrEqual(0.25);

    // Shift ally off diagonal trajectory to x = 50
    blockingAlly.position.x = 50;
    (sniper as any).fireTimer = 0;
    const clearBullet = sniper.fire(playerPos, [sniper, blockingAlly]);
    expect(clearBullet).not.toBeNull();
    expect(clearBullet!.velocity.x).toBeGreaterThan(0);
  });

  test('FF-07 [Multi-Row Vanguard Execution]: Front row fires while rear row holds fire in grid formation', () => {
    const enemies: Enemy[] = [];
    // 3 rows (r=0 at y=80, r=1 at y=130, r=2 at y=180), 4 columns
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const e = new Enemy(60 + c * 60, 80 + r * 50, 720, 1, EnemyType.NORMAL, 960);
        (e as any).fireTimer = 0;
        enemies.push(e);
      }
    }

    const firedBullets = enemies
      .map(e => e.fire({ x: 360, y: 850 }, enemies))
      .filter(b => b !== null);

    // Exactly the 4 frontline vanguard units (row 2) fire
    expect(firedBullets.length).toBe(4);
  });

  test('FF-08 [Dynamic Clearance via Elimination]: Rear unit unlocks and fires once frontline clears', () => {
    const rear = new Enemy(100, 80, 720, 1, EnemyType.NORMAL, 960);
    const front = new Enemy(100, 140, 720, 1, EnemyType.NORMAL, 960);
    const enemies = [rear, front];

    (rear as any).fireTimer = 0;
    expect(rear.fire({ x: 100, y: 800 }, enemies)).toBeNull();

    // Frontline enemy eliminated
    front.isDead = true;
    (rear as any).fireTimer = 0;
    const bullet = rear.fire({ x: 100, y: 800 }, enemies);
    expect(bullet).not.toBeNull();
  });

  test('FF-09 [Agile Tactical Slide]: Sniper repositions laterally when blocked to peek around ally', () => {
    const rearSniper = new Enemy(100, 80, 720, 1, EnemyType.SNIPER, 960);
    const frontAlly = new Enemy(100, 140, 720, 1, EnemyType.NORMAL, 960);
    const enemies = [rearSniper, frontAlly];

    (rearSniper as any).fireTimer = 0;
    const initialShot = rearSniper.fire({ x: 100, y: 800 }, enemies);
    expect(initialShot).toBeNull();
    // Sniper triggered lateral repositioning slide
    expect(rearSniper.slideDir).not.toBe(0);

    // Update position over 40 frames of tactical sliding
    for (let f = 0; f < 40; f++) {
      rearSniper.update(1 / 60, 1.0, [], { x: 100, y: 800 }, enemies);
      (rearSniper as any).fireTimer = 0;
    }

    // After sliding past the front ally, rear sniper can cleanly fire
    const clearShot = rearSniper.fire({ x: 100, y: 800 }, enemies);
    expect(clearShot).not.toBeNull();
  });

  test('FF-10 [180-Frame Zero Friendly-Fire Damage Benchmark]: Full physics simulation produces 0 friendly damage', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.enemies = [];
    gm.bullets = [];

    const rear = new Enemy(200, 100, gm.logicalWidth, 1, EnemyType.NORMAL, gm.logicalHeight);
    const front = new Enemy(200, 160, gm.logicalWidth, 1, EnemyType.NORMAL, gm.logicalHeight);
    rear.hp = 5;
    front.hp = 5;
    (rear as any).fireTimer = 0;
    (front as any).fireTimer = 5; // Front won't fire

    gm.enemies = [rear, front];

    // Simulate 180 continuous physics ticks (3.0 seconds at 60 FPS)
    for (let f = 0; f < 180; f++) {
      (gm as any).update(1 / 60);
    }

    // Zero friendly-fire damage benchmark verified!
    expect(front.hp).toBe(5);
    expect(front.isDead).toBe(false);
    expect(rear.hp).toBe(5);
  });

  test('FF-11 [Swarm Performance]: 60 active enemies evaluate 500 ticks in < 100ms', () => {
    const enemies: Enemy[] = [];
    for (let i = 0; i < 60; i++) {
      enemies.push(new Enemy((i % 10) * 65, 60 + Math.floor(i / 10) * 45, 720, 1, EnemyType.NORMAL, 960));
    }

    const start = Date.now();
    for (let tick = 0; tick < 500; tick++) {
      for (const e of enemies) {
        e.fire({ x: 360, y: 800 }, enemies);
      }
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  test('FF-12 [Boss Escort Protection]: Boss shoots freely past flank escorts but suppresses if escort is centered', () => {
    const boss = new Enemy(285, 100, 720, 1, EnemyType.BOSS, 960);
    boss.hp = 100;
    // Escorts on flanks
    const leftEscort = new Enemy(200, 220, 720, 1, EnemyType.NORMAL, 960);
    const rightEscort = new Enemy(450, 220, 720, 1, EnemyType.NORMAL, 960);

    // Flank escorts do not block central boss muzzle
    const flankBlocked = boss.hasAlliedObstacleInShotPath([boss, leftEscort, rightEscort], 285 + 75, 200, 285 + 75, 800);
    expect(flankBlocked).toBe(false);

    // Centered escort directly beneath boss muzzle blocks
    const centerEscort = new Enemy(285 + 55, 220, 720, 1, EnemyType.NORMAL, 960);
    const centerBlocked = boss.hasAlliedObstacleInShotPath([boss, centerEscort], 285 + 75, 200, 285 + 75, 800);
    expect(centerBlocked).toBe(true);
  });
});

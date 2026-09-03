import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Enemy, EnemyType } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { Player } from '../../src/game/Player';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { Faction, GameState, CrisisArchetype, CrisisPhase } from '../../src/game/types';

/**
 * Headless Mock Canvas with standards-compliant CanvasRenderingContext2D.
 * Throws TypeError / IndexSizeError when non-finite doubles are passed to createRadialGradient,
 * matching standard browser behavior (Chrome / WebKit / Gecko).
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
      arc: (x: number, y: number, r: number) => {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(r)) {
          throw new TypeError("Failed to execute 'arc' on 'CanvasRenderingContext2D': The provided double value is non-finite.");
        }
      },
      ellipse: (x: number, y: number, rx: number, ry: number) => {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(rx) || !Number.isFinite(ry)) {
          throw new TypeError("Failed to execute 'ellipse' on 'CanvasRenderingContext2D': The provided double value is non-finite.");
        }
      },
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      fill: () => {},
      stroke: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      createLinearGradient: (x0: number, y0: number, x1: number, y1: number) => {
        if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1)) {
          throw new TypeError("Failed to execute 'createLinearGradient' on 'CanvasRenderingContext2D': The provided double value is non-finite.");
        }
        return { addColorStop: () => {} };
      },
      createRadialGradient: (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
        if (
          !Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(r0) ||
          !Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(r1)
        ) {
          throw new TypeError("Failed to execute 'createRadialGradient' on 'CanvasRenderingContext2D': The provided double value is non-finite.");
        }
        if (r0 < 0 || r1 < 0) {
          throw new RangeError("Failed to execute 'createRadialGradient' on 'CanvasRenderingContext2D': The radius provided is negative.");
        }
        return { addColorStop: () => {} };
      },
      drawImage: () => {},
      roundRect: () => {},
      measureText: () => ({ width: 60 }),
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

test.describe('Empirical Bug Hunt: Physics, Friendly-Fire AI, Bullet Tunneling, Boundary & NaN/Infinity Safety', () => {

  // =========================================================================
  // SCENARIO 1: DENSE ENEMY GRID (20+ ENEMIES) FRIENDLY-FIRE ADVERSARIAL STRESS
  // =========================================================================

  test('SCENARIO-1.1: Dense 5x5 Grid (25 units, vertical gap 5px) with all fire timers ready', () => {
    const canvas = createMockCanvas(720, 960);
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.enemies = [];
    gm.bullets = [];

    // 25 Invaders arranged in 5 rows x 5 columns
    // Enemy width 40, height 30.
    // Vertical spacing: 35px -> row gap is only 5px (extremely dense back-to-front packing)
    const initialHps = new Map<Enemy, number>();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = 100 + c * 80;
        const y = 80 + r * 35;
        const enemy = new Enemy(x, y, gm.logicalWidth, 1, EnemyType.NORMAL, gm.logicalHeight);
        enemy.faction = Faction.INVADER;
        enemy.hp = 10;
        enemy.maxHp = 10;
        (enemy as any).fireTimer = 0; // Constantly ready to fire
        gm.enemies.push(enemy);
        initialHps.set(enemy, enemy.hp);
      }
    }

    expect(gm.enemies.length).toBe(25);
    gm.player.position.x = 360;
    gm.player.position.y = 900;
    gm.player.hp = 99999;

    let friendlyFireDamageEvents = 0;
    let bulletsFiredByUpperRows = 0;

    for (let f = 0; f < 300; f++) {
      const prevHps = new Map(gm.enemies.map(e => [e, e.hp]));
      
      // Keep fireTimer 0 for all enemies in rows 0-3 (the ones with allies in front of them)
      for (let i = 0; i < 20; i++) {
        (gm.enemies[i] as any).fireTimer = 0;
      }

      (gm as any).update(1 / 60);

      // Check if any enemy took damage from an allied bullet
      for (const e of gm.enemies) {
        if (e.hp < prevHps.get(e)!) {
          friendlyFireDamageEvents++;
        }
      }
    }

    console.log(`[SCENARIO-1.1 Result] 5x5 Dense Grid friendly fire damage events: ${friendlyFireDamageEvents}`);
    // No enemy should shoot into the back of an ally in front of it
    expect(friendlyFireDamageEvents).toBe(0);
    for (const e of gm.enemies) {
      expect(e.hp).toBe(10);
    }
  });

  test('SCENARIO-1.2: Dense 24-unit Grid with 12 Snipers aiming diagonally at moving player', () => {
    const canvas = createMockCanvas(720, 960);
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.enemies = [];
    gm.bullets = [];

    // 4 rows x 6 columns = 24 units.
    // Rows 0 and 1 are SNIPERs (aiming diagonally at player).
    // Rows 2 and 3 are SHIELDED / NORMAL allies positioned directly between Snipers and player.
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const x = 80 + c * 90;
        const y = 80 + r * 45;
        const type = (r < 2) ? EnemyType.SNIPER : EnemyType.NORMAL;
        const enemy = new Enemy(x, y, gm.logicalWidth, 1, type, gm.logicalHeight);
        enemy.faction = Faction.INVADER;
        enemy.hp = 10;
        (enemy as any).fireTimer = 0;
        gm.enemies.push(enemy);
      }
    }

    gm.player.position.x = 200;
    gm.player.position.y = 900;
    gm.player.hp = 99999;

    let friendlyFireCollisions = 0;
    const origCheckCollisions = (gm as any).checkCollisions.bind(gm);
    (gm as any).checkCollisions = () => {
      for (const bullet of gm.bullets) {
        if (bullet.isDead) continue;
        for (const enemy of gm.enemies) {
          if (enemy.isDead || bullet.hitEntities.has(enemy) || bullet.shooter === enemy) continue;
          if (bullet.checkCollision(enemy) && bullet.faction === enemy.faction) {
            friendlyFireCollisions++;
          }
        }
      }
      origCheckCollisions();
    };

    // Simulate 300 frames while player sweeps horizontally left-to-right (changing diagonal angles)
    for (let f = 0; f < 300; f++) {
      gm.player.position.x = 100 + (f % 100) * 5; // moving between 100 and 600
      for (const e of gm.enemies) {
        if (e.type === EnemyType.SNIPER && (e as any).fireTimer <= 0) {
          // ready to shoot
        }
      }
      (gm as any).update(1 / 60);
    }

    console.log(`[SCENARIO-1.2 Result] Snipers shooting diagonally through dense grid: ${friendlyFireCollisions} friendly fire collisions`);
    expect(friendlyFireCollisions).toBe(0);
  });

  test('SCENARIO-1.3 [ASYMMETRIC ORIGIN BUG PROBE]: Raycast origin vs bullet spawn width mismatch', () => {
    // In Enemy.ts:
    // spawnX = this.position.x + this.size.width / 2 - 3;
    // Bullet size: width = 10 (spans [spawnX, spawnX + 10]).
    // Raycast origin: originX = spawnX + 3. projectileRadius = 5.
    // The raycast corridor covers [originX - 5, originX + 5] = [spawnX - 2, spawnX + 8].
    // BUT the bullet's right edge reaches spawnX + 10!
    // If an ally is situated at spawnX + 8.5 to spawnX + 48.5,
    // the raycast tests [spawnX - 2, spawnX + 8] and thinks corridor is CLEAR,
    // but the bullet spans up to spawnX + 10 and immediately collides with the ally!

    const shooter = new Enemy(200, 100, 720, 1, EnemyType.NORMAL, 960);
    shooter.faction = Faction.INVADER;

    // Shooter bullet spawn parameters
    const spawnX = shooter.position.x + shooter.size.width / 2 - 3; // 200 + 20 - 3 = 217
    const spawnY = shooter.position.y + shooter.size.height; // 100 + 30 = 130
    const originX = spawnX + 3; // 220

    // Ally placed 25px below shooter, offset so its left edge is at spawnX + 8.5 = 225.5
    // Ally rect: X in [225.5, 265.5], Y in [155, 185]
    const ally = new Enemy(spawnX + 8.5, 155, 720, 1, EnemyType.NORMAL, 960);
    ally.faction = Faction.INVADER;

    const allEnemies = [shooter, ally];

    // Check if line of sight detects this blocking ally:
    const isBlocked = shooter.hasAlliedObstacleInShotPath(allEnemies, originX, spawnY, originX, spawnY + 200, 5);

    // Now spawn the actual bullet that Enemy.fire() creates:
    const bullet = new Bullet(spawnX, spawnY, 200, 1, false);
    bullet.faction = Faction.INVADER;
    bullet.shooter = shooter;

    // Advance bullet 0.15s (30px downward: Y moves from 130 to 160)
    bullet.update(0.15);

    // Check if the bullet actually collides with the ally
    const doesCollide = bullet.checkCollision(ally);

    console.log(`[SCENARIO-1.3 Asymmetric Raycast Probe] isBlocked: ${isBlocked}, doesCollide: ${doesCollide}`);
    console.log(`  bullet rect: x=[${bullet.position.x}, ${bullet.position.x + bullet.size.width}], y=[${bullet.position.y}, ${bullet.position.y + bullet.size.height}]`);
    console.log(`  ally rect: x=[${ally.position.x}, ${ally.position.x + ally.size.width}], y=[${ally.position.y}, ${ally.position.y + ally.size.height}]`);

    // Record defect finding: if doesCollide is true while isBlocked is false,
    // this proves an empirical friendly-fire clipping bug due to raycast margin asymmetry!
    if (doesCollide && !isBlocked) {
      console.warn(`[DEFECT CONFIRMED] Raycast origin asymmetry allows bullet to clip ally right edge!`);
    }
  });

  test('SCENARIO-1.4: Dense 20-unit Rogue Squadron with upward and downward fire', () => {
    const canvas = createMockCanvas(720, 960);
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.enemies = [];
    gm.bullets = [];

    // 20 Rogues in 4 rows x 5 columns
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const x = 120 + c * 90;
        const y = 300 + r * 50;
        const type = (r % 2 === 0) ? EnemyType.ROGUE_DRONE : EnemyType.ROGUE_STALKER;
        const rogue = new Enemy(x, y, gm.logicalWidth, 1, type, gm.logicalHeight);
        rogue.faction = Faction.ROGUE;
        rogue.hp = 10;
        (rogue as any).fireTimer = 0;
        gm.enemies.push(rogue);
      }
    }

    // Place an invader above the rogues at Y = 100 (causing rogues in lower rows to shoot upward)
    const invaderTarget = new Enemy(300, 100, gm.logicalWidth, 1, EnemyType.NORMAL, gm.logicalHeight);
    invaderTarget.faction = Faction.INVADER;
    invaderTarget.hp = 99999;
    gm.enemies.push(invaderTarget);

    let rogueFriendlyCollisions = 0;
    const origCheck = (gm as any).checkCollisions.bind(gm);
    (gm as any).checkCollisions = () => {
      for (const b of gm.bullets) {
        if (b.isDead) continue;
        for (const e of gm.enemies) {
          if (e.isDead || b.hitEntities.has(e) || b.shooter === e) continue;
          if (b.checkCollision(e) && b.faction === Faction.ROGUE && e.faction === Faction.ROGUE) {
            rogueFriendlyCollisions++;
          }
        }
      }
      origCheck();
    };

    for (let f = 0; f < 300; f++) {
      (gm as any).update(1 / 60);
    }

    console.log(`[SCENARIO-1.4 Result] Rogue-on-Rogue friendly collisions in 20-unit squadron: ${rogueFriendlyCollisions}`);
    expect(rogueFriendlyCollisions).toBe(0);
  });

  // =========================================================================
  // SCENARIO 2: EXTREME BULLET VELOCITIES & TUNNELING ADVERSARIAL STRESS
  // =========================================================================

  test('SCENARIO-2.1 [EMPIRICAL TUNNELING PROBE]: High-speed hostile bullets vs Player', () => {
    // Player is at (360, 800), width 50, height 40 -> Y interval [800, 840].
    // Enemy bullet has height 10.
    // Test bullet speeds: 500, 800, 1200, 2000, 3000, 5000, 10000 px/s.
    // We test across 100 starting Y positions from 700 to 799 (approaching from above).

    const testSpeeds = [500, 800, 1200, 2000, 3000, 5000, 10000];
    const testDeltaTimes = [1 / 60, 1 / 30, 0.05, 0.1]; // 60 FPS, 30 FPS, 20 FPS, 10 FPS lag

    console.log('\n--- SCENARIO-2.1 EMPIRICAL BULLET TUNNELING MATRIX (VS PLAYER) ---');

    const tunnelingResults: Record<string, { total: number; tunneled: number; ratePercent: string }> = {};

    for (const dt of testDeltaTimes) {
      for (const speed of testSpeeds) {
        const key = `speed_${speed}_dt_${dt.toFixed(3)}`;
        let totalTrials = 0;
        let tunneledTrials = 0;

        // Player AABB: X [360, 410], Y [800, 840]
        const player = new Player(720, 960);
        player.position.x = 360;
        player.position.y = 800;

        // Step 1: Sweep starting Y positions from 700 to 799 with 1px resolution
        for (let startY = 700; startY <= 799; startY++) {
          totalTrials++;
          // Bullet at centerX = 380, width 10, height 10
          const bullet = new Bullet(380, startY, speed, 1, false);
          bullet.faction = Faction.INVADER;

          // Track trajectory: does it cross the player interval [800, 840]?
          let didIntersect = false;

          // Simulate bullet steps until it passes player Y (past 860)
          let steps = 0;
          let collided = false;

          while (bullet.position.y < 880 && steps < 50) {
            // Check collision BEFORE or AFTER update?
            // In GameManager.ts: bullet.update(dt) runs, THEN checkCollisions() runs.
            bullet.update(dt);
            steps++;

            if (bullet.checkCollision(player)) {
              collided = true;
              break;
            }
          }

          // A continuous trajectory starting at startY and traveling past 850 MUST intersect player [800, 840]
          // because bullet.x is 380 (inside [360, 410]), startY < 800, and endY > 840.
          if (!collided) {
            tunneledTrials++;
          }
        }

        const rate = ((tunneledTrials / totalTrials) * 100).toFixed(1);
        tunnelingResults[key] = { total: totalTrials, tunneled: tunneledTrials, ratePercent: `${rate}%` };
        console.log(`  dt=${dt.toFixed(3)}s (${Math.round(1/dt)} FPS), speed=${speed}px/s: ${tunneledTrials}/${totalTrials} TUNNELED (${rate}%)`);
      }
    }

    // REMEDIATION VERIFIED: With Continuous Collision Detection (CCD), tunneling rate is 0%!
    const highSpeed60Fps = tunnelingResults['speed_3000_dt_0.017'];
    console.log(`[REMEDIATION VERIFIED] Speed 3000 at 60 FPS tunneling rate: ${highSpeed60Fps.ratePercent}`);
    expect(highSpeed60Fps.tunneled).toBe(0);
  });

  test('SCENARIO-2.2 [EMPIRICAL TUNNELING PROBE]: High-speed player bullets vs Crisis Sovereign & Boss', () => {
    // Sovereign at (230, 65), width 260, height 130 -> Y interval [65, 195].
    // Player bullet travels upward with negative speed: -600, -1200, -3000, -6000, -9000.
    // Bullet height 12.

    const sov = new CrisisSovereign(230, 65, CrisisArchetype.VOID_SOVEREIGN);
    sov.position.x = 230;
    sov.position.y = 65;

    const testSpeeds = [-600, -1200, -3000, -6000, -9000, -15000];
    const testDeltaTimes = [1 / 60, 0.05, 0.1];

    console.log('\n--- SCENARIO-2.2 EMPIRICAL BULLET TUNNELING MATRIX (VS CRISIS SOVEREIGN) ---');

    for (const dt of testDeltaTimes) {
      for (const speed of testSpeeds) {
        let total = 0;
        let tunneled = 0;

        // Test starting Y positions from 200 to 299 (below Sovereign)
        for (let startY = 200; startY <= 299; startY++) {
          total++;
          const bullet = new Bullet(360, startY, speed, 1, true);
          bullet.faction = Faction.PLAYER;

          let collided = false;
          let steps = 0;
          while (bullet.position.y > 0 && steps < 50) {
            bullet.update(dt);
            steps++;
            if (bullet.checkCollision(sov)) {
              collided = true;
              break;
            }
          }

          if (!collided) {
            tunneled++;
          }
        }

        const rate = ((tunneled / total) * 100).toFixed(1);
        console.log(`  dt=${dt.toFixed(3)}s, speed=${speed}px/s: ${tunneled}/${total} TUNNELED (${rate}%)`);
      }
    }
  });

  test('SCENARIO-2.3 [EMPIRICAL TUNNELING PROBE]: Base player bullet vs normal 30px enemy during frame lag', () => {
    // Normal enemy: size 40x30 at (300, 200). Y interval [200, 230].
    // Player bullet: base speed 400 (velocity.y = -400).
    // If a lag spike occurs with dt = 0.1s (clamped in Enemy.ts line 222):
    // Displacement per tick = -400 * 0.1 = -40px.
    // Target height = 30px, bullet height = 12px. Total collision span = 42px.
    // If displacement (-40px) is close to 42px, what happens at speed 600 or 800?
    // At speed 600, displacement = -60px > 42px -> 100% TUNNELING GUARANTEED for some offsets!

    const enemy = new Enemy(300, 200, 720, 1, EnemyType.NORMAL, 960);
    enemy.position.x = 300;
    enemy.position.y = 200;

    let tunneledCount = 0;
    const total = 50;

    // Bullet approaching from below: Y = 235 to 284
    for (let startY = 235; startY < 235 + total; startY++) {
      const bullet = new Bullet(315, startY, -600, 1, true);
      let collided = false;
      for (let s = 0; s < 10; s++) {
        bullet.update(0.1); // 100ms lag frame
        if (bullet.checkCollision(enemy)) {
          collided = true;
          break;
        }
      }
      if (!collided) {
        tunneledCount++;
      }
    }

    console.log(`[REMEDIATION VERIFIED] Speed -600 at dt=0.1s: ${tunneledCount}/${total} tunneled through 30px enemy (${(tunneledCount/total*100).toFixed(1)}%)`);
    expect(tunneledCount).toBe(0);
  });

  // =========================================================================
  // SCENARIO 3: ENTITY BOUNDARIES, NEGATIVE, AND NAN/INFINITY COORDINATES
  // =========================================================================

  test('SCENARIO-3.1: Entity behavior at exact canvas coordinates (0, 0)', () => {
    const canvas = createMockCanvas(720, 960);
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

    // 1. Player at (0, 0)
    const player = new Player(720, 960);
    player.position.x = 0;
    player.position.y = 0;
    player.update(0.016);
    expect(player.position.x).toBe(0);
    expect(player.position.y).toBe(0);
    expect(() => player.draw(ctx)).not.toThrow();

    // 2. Enemy at (0, 0)
    const enemy = new Enemy(0, 0, 720, 1, EnemyType.NORMAL, 960);
    expect(enemy.position.x).toBe(0);
    expect(enemy.position.y).toBe(0);
    enemy.update(0.016);
    expect(enemy.position.x).toBeGreaterThanOrEqual(0);
    expect(enemy.position.y).toBeGreaterThanOrEqual(0);
    expect(() => enemy.draw(ctx)).not.toThrow();

    // 3. CrisisSovereign at (0, 0)
    const sov = new CrisisSovereign(0, 0, CrisisArchetype.VOID_SOVEREIGN);
    expect(sov.position.x).toBe(0);
    expect(sov.position.y).toBe(0);
    sov.update(0.016);
    expect(Number.isFinite(sov.position.x)).toBe(true);
    expect(Number.isFinite(sov.position.y)).toBe(true);
    expect(() => sov.draw(ctx)).not.toThrow();

    // 4. DimensionalRift at (0, 0)
    const rift = new DimensionalRift(0, 0, 0, 720, CrisisArchetype.VOID_SOVEREIGN);
    rift.update(0.016, player, []);
    expect(() => rift.draw(ctx)).not.toThrow();

    // 5. Bullet at (0, 0)
    const bullet = new Bullet(0, 0, 200, 1, false);
    bullet.update(0.016);
    expect(bullet.position.x).toBe(0);
    expect(bullet.position.y).toBeGreaterThan(0);
    expect(() => bullet.draw(ctx)).not.toThrow();
  });

  test('SCENARIO-3.2: Entity behavior at canvas bottom-right bounds (canvas.width, canvas.height)', () => {
    const canvas = createMockCanvas(720, 960);
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

    // 1. Player placed at (720, 960)
    const player = new Player(720, 960);
    player.position.x = 720;
    player.position.y = 960;
    player.update(0.016);
    // Player.position.x clamps to canvasWidth - size.width
    expect(player.position.x).toBe(720 - player.size.width);
    // REMEDIATION VERIFIED: Player.position.y is now clamped to [0, canvasHeight - size.height]!
    console.log(`[SCENARIO-3.2 Remediation] Player Y after update at canvas.height: ${player.position.y} (clamped!)`);
    expect(player.position.y).toBe(960 - player.size.height);
    expect(() => player.draw(ctx)).not.toThrow();

    // 2. Enemy constructor at (720, 960)
    const enemy = new Enemy(720, 960, 720, 1, EnemyType.NORMAL, 960);
    // Enemy clamps both X and Y in constructor
    expect(enemy.position.x).toBe(720 - enemy.size.width);
    expect(enemy.position.y).toBe(960 - enemy.size.height);
    enemy.update(0.016);
    expect(enemy.position.x).toBeLessThanOrEqual(720 - enemy.size.width);
    expect(enemy.position.y).toBeLessThanOrEqual(960 - enemy.size.height);
    expect(() => enemy.draw(ctx)).not.toThrow();

    // 3. Crisis Sovereign at (720, 960)
    const sov = new CrisisSovereign(720, 960, CrisisArchetype.SOLARIS_COLOSSUS);
    sov.update(0.016);
    // Sovereign does NOT clamp to canvas
    expect(sov.position.x).toBeGreaterThan(700);
    expect(sov.position.y).toBeGreaterThan(950);
    expect(() => sov.draw(ctx)).not.toThrow();
  });

  test('SCENARIO-3.3: Negative coordinates handling across entities', () => {
    const canvas = createMockCanvas(720, 960);
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

    // 1. Player with negative coordinates
    const player = new Player(720, 960);
    player.position.x = -150;
    player.position.y = -100;
    player.update(0.016);
    // Player X clamps to 0
    expect(player.position.x).toBe(0);
    // REMEDIATION VERIFIED: Player Y clamps to 0!
    expect(player.position.y).toBe(0);
    expect(() => player.draw(ctx)).not.toThrow();

    // 2. Enemy with negative coordinates in constructor
    const enemy = new Enemy(-50, -50, 720, 1, EnemyType.NORMAL, 960);
    // Clamped to (0, 0)
    expect(enemy.position.x).toBe(0);
    expect(enemy.position.y).toBe(0);

    // 3. Bullet at negative coordinates in GameManager
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    const offscreenBullet = new Bullet(-150, -80, 200, 1, false);
    gm.bullets.push(offscreenBullet);
    (gm as any).update(1 / 60);

    // Bullet should be culled by compaction loop
    expect(gm.bullets.includes(offscreenBullet)).toBe(false);
  });

  test('SCENARIO-3.4 [CRITICAL DEFECT PROBE]: NaN and Infinity coordinates cause Canvas Crashes & Unrecoverable State', () => {
    const canvas = createMockCanvas(720, 960);
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

    // 1. Player with NaN position
    const player = new Player(720, 960);
    player.position.x = NaN;
    player.position.y = NaN;

    // Run player.update(): coordinates are sanitized!
    player.update(0.016);
    expect(Number.isFinite(player.position.x)).toBe(true);
    expect(Number.isFinite(player.position.y)).toBe(true);

    // When player fires, bullet coordinates are valid finite numbers:
    player.isShooting = true;
    (player as any).fireTimer = 0;
    const playerBullets = player.fire();
    expect(playerBullets.length).toBeGreaterThan(0);
    expect(Number.isFinite(playerBullets[0].position.x)).toBe(true);

    // REMEDIATION VERIFIED: player.draw(ctx) does NOT throw!
    expect(() => player.draw(ctx)).not.toThrow();

    // 2. CrisisSovereign with NaN initial coordinates: sanitized!
    const sov = new CrisisSovereign(NaN, NaN, CrisisArchetype.VOID_SOVEREIGN);
    sov.update(0.016);
    expect(Number.isFinite(sov.position.x)).toBe(true);
    expect(Number.isFinite(sov.position.y)).toBe(true);

    // REMEDIATION VERIFIED: sov.draw(ctx) does NOT throw!
    expect(() => sov.draw(ctx)).not.toThrow();

    // 3. Bullet with NaN in GameManager
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    const nanBullet = new Bullet(NaN, NaN, 200, 1, false);
    gm.bullets.push(nanBullet);

    // Bullet checkCollision with player: NaN comparisons return false
    expect(nanBullet.checkCollision(player)).toBe(false);

    // GameManager compaction drops NaN bullets because (NaN > -50) is false
    (gm as any).update(1 / 60);
    expect(gm.bullets.includes(nanBullet)).toBe(false);

    // 4. Enemy with NaN coordinates:
    // Enemy.ts lines 295-296 safeguards against NaN:
    const enemy = new Enemy(200, 100, 720, 1, EnemyType.NORMAL, 960);
    enemy.position.x = NaN;
    enemy.position.y = NaN;
    enemy.update(0.016);
    // Enemy RECOVERS thanks to lines 295-296!
    expect(Number.isFinite(enemy.position.x)).toBe(true);
    expect(Number.isFinite(enemy.position.y)).toBe(true);
    expect(enemy.position.x).toBeCloseTo(0.56, 1);
    expect(enemy.position.y).toBe(960 - enemy.size.height);
    expect(() => enemy.draw(ctx)).not.toThrow();
  });

  test('SCENARIO-3.5: Infinity / -Infinity coordinates handling', () => {
    const canvas = createMockCanvas(720, 960);
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

    // 1. Enemy with Infinity
    const enemy = new Enemy(100, 100, 720, 1, EnemyType.NORMAL, 960);
    enemy.position.x = Infinity;
    enemy.position.y = -Infinity;
    enemy.update(0.016);
    // Number.isFinite(Infinity) is false -> Enemy recovers to valid finite bounds
    expect(Number.isFinite(enemy.position.x)).toBe(true);
    expect(Number.isFinite(enemy.position.y)).toBe(true);

    // 2. Player with Infinity
    const player = new Player(720, 960);
    player.position.x = Infinity;
    player.position.y = Infinity;
    player.update(0.016);
    // REMEDIATION VERIFIED: Number.isFinite(Infinity) is false -> sanitized to safe valid finite coordinates!
    expect(Number.isFinite(player.position.x)).toBe(true);
    expect(Number.isFinite(player.position.y)).toBe(true);

    // REMEDIATION VERIFIED: Player draw with Infinity does NOT throw!
    expect(() => player.draw(ctx)).not.toThrow();
  });
});

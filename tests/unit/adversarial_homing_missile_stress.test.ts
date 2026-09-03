import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Player } from '../../src/game/Player';
import { Bullet, HomingMissile } from '../../src/game/Bullet';
import { Enemy } from '../../src/game/Enemy';
import { Barricade, BarricadeType } from '../../src/game/Barricade';
import { GameState, Faction, EnemyType } from '../../src/game/types';

// Headless polyfills for requestAnimationFrame
if (typeof global.requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number;
  (global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
}

/**
 * Headless Mock Canvas & 2D Rendering Context
 */
function createMockCanvas(width: number = 600, height: number = 800): HTMLCanvasElement {
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

test.describe('Adversarial Stress Suite: Homing Missile Weapon System (R1)', () => {

  // =========================================================================
  // DIMENSION 1: Target Seeking & Turning Radius
  // =========================================================================
  test.describe('Dimension 1: Target Seeking & Turning Radius Stress Harness', () => {

    test('STRESS-1.1: Diving rusher at y = 660 within 80-100px of player (y = 740) is intercepted without overshooting', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Player position at standard bottom center: x = 275 (centerX = 300), y = 740
      gm.player.position.x = 275;
      gm.player.position.y = 740;
      gm.player.homingMissiles = 1;

      // Rusher placed at y = 660 (80px vertical distance above player)
      // Test 9 lateral displacements from -60px to +60px relative to player center (300)
      const testOffsets = [-60, -45, -30, -15, 0, 15, 30, 45, 60];
      const diveSpeeds = [150, 200, 250]; // px/s downward dive speeds

      for (const offset of testOffsets) {
        for (const speedY of diveSpeeds) {
          const rusherX = 300 + offset - 14; // Enemy width is ~28px
          const rusherY = 660;

          const rusher = new Enemy(rusherX, rusherY, 600, 10, EnemyType.DIVER);
          rusher.speedY = speedY;
          rusher.hp = 10;

          // Single missile fired directly from player wingtip
          const missile = gm.player.createHomingMissile(8);
          missile.target = rusher;

          let intercepted = false;
          let framesToIntercept = 0;
          let maxAngleChangePerSec = 0;
          let previousAngle = missile.angle;
          const dt = 1 / 60;
          const MAX_FRAMES = 60; // 1.0 second max window before rusher hits player

          for (let f = 0; f < MAX_FRAMES; f++) {
            // Update rusher position (downward dive)
            rusher.position.y += rusher.speedY * dt;

            // Update missile
            missile.update(dt, [rusher]);

            // Track angular turn rate
            const angleDelta = Math.abs(missile.angle - previousAngle);
            const turnRateSec = angleDelta / dt;
            if (turnRateSec > maxAngleChangePerSec) {
              maxAngleChangePerSec = turnRateSec;
            }
            previousAngle = missile.angle;

            // Check collision
            if (missile.checkCollision(rusher)) {
              intercepted = true;
              framesToIntercept = f;
              break;
            }

            // If rusher passes player y = 740 without interception, it overshot
            if (rusher.position.y > gm.player.position.y + 40) {
              break;
            }
          }

          expect(intercepted, `Failed to intercept rusher at offset ${offset}px with diveSpeed ${speedY}px/s`).toBe(true);
          // Must intercept quickly (under 40 frames = 0.67 seconds)
          expect(framesToIntercept).toBeLessThanOrEqual(40);
          // Turn rate must strictly respect physical angular cap omega = 6.2 rad/s (+ epsilon for float precision)
          expect(maxAngleChangePerSec).toBeLessThanOrEqual(6.25);
        }
      }
    });

    test('STRESS-1.2: Boundary orbit prevention (missiles never circle in infinite loops)', () => {
      // Kinematic analysis: A missile can only orbit if turning radius R > distance and no collision occurs.
      // We test extreme lateral targets (e.g. offset = 100px, 150px) at y = 600.
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      const extremeOffsets = [-150, -100, 100, 150];
      const dt = 1 / 60;

      for (const xOff of extremeOffsets) {
        const target = new Enemy(300 + xOff, 600, 600, 10, EnemyType.NORMAL);
        const missile = new HomingMissile(300, 740, 8);
        missile.target = target;

        let totalAngularTravel = 0;
        let prevAngle = missile.angle;
        let hit = false;
        let simulationTicks = 0;

        // Run for up to 300 frames (5 seconds, which exceeds missile lifeTimer 4.5s)
        while (!missile.isDead && simulationTicks < 300) {
          missile.update(dt, [target]);
          simulationTicks++;

          const dTheta = Math.abs(missile.angle - prevAngle);
          totalAngularTravel += dTheta;
          prevAngle = missile.angle;

          if (missile.checkCollision(target)) {
            hit = true;
            break;
          }
        }

        // Either missile hit the target, or lifeTimer expired cleanly (lifeTimer <= 0 -> isDead)
        expect(hit || missile.isDead).toBe(true);
        // Under no circumstances should simulation run indefinitely without dying
        expect(simulationTicks).toBeLessThanOrEqual(275); // 4.5s * 60 = 270 frames
      }
    });

    test('STRESS-1.3: Verification of kinematic parameters (v0=280, a=360, vmax=520, omega=6.2)', () => {
      const missile = new HomingMissile(300, 700, 8);
      expect(missile.currentSpeed).toBe(280);
      expect(missile.acceleration).toBe(360);
      expect(missile.maxSpeed).toBe(520);
      expect(missile.turnRate).toBe(6.2);

      // Verify turning radius at launch R0 = v0 / omega <= 45.2 px
      const r0 = missile.currentSpeed / missile.turnRate;
      expect(r0).toBeLessThanOrEqual(45.2);

      // Accelerate over 1 second with no target -> speed should increase by 360 px/s up to max 520
      const dt = 1 / 60;
      for (let i = 0; i < 60; i++) {
        missile.update(dt, []);
      }
      expect(missile.currentSpeed).toBe(520); // Reached terminal velocity
    });
  });

  // =========================================================================
  // DIMENSION 2: Rapid Death & Edge Cases
  // =========================================================================
  test.describe('Dimension 2: Rapid Death & High-Density Adversarial Retargeting', () => {

    test('STRESS-2.1: Rapid elimination of 50 enemies while 10 missiles fly -> 0 crashes, instant retargeting or cruise', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Populate 50 active enemies across the grid
      gm.enemies = [];
      for (let i = 0; i < 50; i++) {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const e = new Enemy(60 + col * 50, 100 + row * 40, 600, 10, EnemyType.NORMAL);
        e.hp = 10;
        gm.enemies.push(e);
      }
      expect(gm.enemies.length).toBe(50);

      // Launch 10 homing missiles with varied initial positions and angles
      gm.bullets = [];
      const missiles: HomingMissile[] = [];
      for (let m = 0; m < 10; m++) {
        const h = new HomingMissile(100 + m * 40, 700, 8);
        missiles.push(h);
        gm.bullets.push(h);
      }

      const dt = 1 / 60;
      let frame = 0;

      // Simulate 75 frames: Kill 1 enemy every frame for the first 50 frames
      while (frame < 75) {
        frame++;

        // Eliminate 1 enemy each frame for the first 50 frames
        if (frame <= 50) {
          const enemyToKill = gm.enemies.find(e => !e.isDead);
          if (enemyToKill) {
            enemyToKill.isDead = true;
          }
        }

        // Run GameManager update loop step
        expect(() => {
          // Update bullets (including missiles)
          gm.bullets.forEach(b => {
            if (b instanceof HomingMissile) {
              b.update(dt, gm.enemies, gm.endGameCrisis);
            } else {
              b.update(dt);
            }
          });

          // Check collisions
          (gm as any).checkCollisions(dt);
        }).not.toThrow();

        // Check integrity of every active missile
        for (const missile of missiles) {
          if (missile.isDead) continue;

          // Must never produce NaN coordinates
          expect(Number.isFinite(missile.position.x)).toBe(true);
          expect(Number.isFinite(missile.position.y)).toBe(true);
          expect(Number.isFinite(missile.velocity.x)).toBe(true);
          expect(Number.isFinite(missile.velocity.y)).toBe(true);
          expect(Number.isFinite(missile.angle)).toBe(true);
          expect(Number.isFinite(missile.currentSpeed)).toBe(true);

          // If all enemies are dead (after frame 50), target must be null or cruise straight
          const aliveEnemies = gm.enemies.filter(e => !e.isDead);
          if (aliveEnemies.length === 0) {
            expect(missile.target === null || missile.target.isDead).toBe(true);
          }
        }
      }
    });

    test('STRESS-2.2: Mass extinction burst (all 50 enemies killed simultaneously on frame 5)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Spawn 50 enemies
      gm.enemies = [];
      for (let i = 0; i < 50; i++) {
        const e = new Enemy(100 + (i % 8) * 50, 150 + Math.floor(i / 8) * 35, 600, 10, EnemyType.NORMAL);
        gm.enemies.push(e);
      }

      // Spawn 10 missiles
      const missiles: HomingMissile[] = [];
      for (let i = 0; i < 10; i++) {
        const m = new HomingMissile(200 + i * 20, 650, 8);
        missiles.push(m);
      }

      const dt = 1 / 60;

      // Run 5 frames with active targets
      for (let f = 0; f < 5; f++) {
        missiles.forEach(m => m.update(dt, gm.enemies));
      }

      // Frame 5: MASS EXTINCTION - All 50 enemies die instantly
      for (const e of gm.enemies) {
        e.isDead = true;
      }

      // Record headings at moment of mass extinction
      const preAngles = missiles.map(m => m.angle);

      // Run next frame: Missiles must switch to straight cruise
      missiles.forEach(m => m.update(dt, gm.enemies));

      // In the absence of targets, angle delta must be 0 (straight cruise)
      for (let i = 0; i < missiles.length; i++) {
        const m = missiles[i];
        expect(m.target).toBeNull();
        expect(Math.abs(m.angle - preAngles[i])).toBeLessThan(0.0001);
      }

      // Continue cruising for 30 frames in vacuum: angles must remain rock solid
      for (let f = 0; f < 30; f++) {
        missiles.forEach(m => m.update(dt, gm.enemies));
      }

      for (let i = 0; i < missiles.length; i++) {
        const m = missiles[i];
        expect(Math.abs(m.angle - preAngles[i])).toBeLessThan(0.0001);
      }
    });

    test('STRESS-2.3: Targeted assassination edge case: target dies every single frame', () => {
      // Adversarial scenario: whenever a missile locks onto a target, that target is killed immediately on the next frame
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      for (let i = 0; i < 30; i++) {
        gm.enemies.push(new Enemy(150 + (i % 6) * 60, 200 + Math.floor(i / 6) * 50, 600, 10, EnemyType.NORMAL));
      }

      const missile = new HomingMissile(300, 700, 8);
      const dt = 1 / 60;

      for (let step = 0; step < 25; step++) {
        missile.update(dt, gm.enemies);
        if (missile.target) {
          missile.target.isDead = true; // Assassinate target immediately
        }
      }

      expect(missile.isDead).toBe(false);
      expect(Number.isFinite(missile.position.y)).toBe(true);
    });

    test('STRESS-2.4: Empty array and undefined parameters null safety', () => {
      const missile = new HomingMissile(300, 700, 8);
      const dt = 1 / 60;

      expect(() => missile.update(dt, [])).not.toThrow();
      expect(() => missile.update(dt, undefined, undefined)).not.toThrow();
      expect(missile.target).toBeNull();
      expect(missile.isDead).toBe(false);
    });
  });

  // =========================================================================
  // DIMENSION 3: Barricade Protection
  // =========================================================================
  test.describe('Dimension 3: Barricade Protection & Penetration at y = 650', () => {

    test('STRESS-3.1: Missiles fly straight through y = 650 barricades with 0 barricade damage', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Verify default barricades initialized at y = 650
      expect(gm.barricades.length).toBe(4);
      expect(gm.barricades[0].position.y).toBe(650);

      // Record initial HP of all 4 barricades
      const initialHp = gm.barricades.map(b => b.hp);
      const destBarricade1 = gm.barricades[0];
      const destBarricade2 = gm.barricades[3];
      expect(destBarricade1.type).toBe(BarricadeType.DESTRUCTIBLE);
      expect(destBarricade2.type).toBe(BarricadeType.DESTRUCTIBLE);
      expect(destBarricade1.hp).toBe(20);

      // Launch 4 missiles directly below each barricade at y = 740, aimed straight through y = 650
      const missiles: HomingMissile[] = [];
      gm.bullets = [];
      for (let i = 0; i < 4; i++) {
        const bx = gm.barricades[i].position.x + gm.barricades[i].size.width / 2 - 5;
        const m = new HomingMissile(bx, 740, 8);
        missiles.push(m);
        gm.bullets.push(m);
      }

      // Fly through y = 650 up to y = 450 (takes ~60 frames at 280-360 px/s)
      const dt = 1 / 60;
      for (let f = 0; f < 60; f++) {
        gm.bullets.forEach(b => {
          if (b instanceof HomingMissile) b.update(dt, gm.enemies, gm.endGameCrisis);
        });
        (gm as any).checkCollisions(dt);
      }

      // 1. Barricades must have suffered 0 damage
      for (let i = 0; i < 4; i++) {
        expect(gm.barricades[i].hp).toBe(initialHp[i]);
        expect(gm.barricades[i].isDead).toBe(false);
      }

      // 2. Missiles must have successfully penetrated through y = 650 and continue flying
      for (const m of missiles) {
        expect(m.isDead).toBe(false);
        expect(m.position.y).toBeLessThan(650); // Now in upper airspace
      }
    });

    test('STRESS-3.2: Point-blank missile detonation adjacent to barricade does NOT splash damage barricade', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      const barricade = gm.barricades[0]; // Destructible at x=80, y=650, hp=20
      expect(barricade.type).toBe(BarricadeType.DESTRUCTIBLE);
      const initialBarricadeHp = barricade.hp;

      // Place enemy directly adjacent to the barricade (within 15px, well inside 45px splash radius)
      const enemy = new Enemy(barricade.position.x + barricade.size.width + 10, 650, 600, 10, EnemyType.NORMAL);
      enemy.hp = 8;
      gm.enemies = [enemy];

      // Missile directly impacts enemy
      const missile = new HomingMissile(enemy.position.x, enemy.position.y + 5, 8);
      gm.bullets = [missile];

      // Execute collision resolution
      (gm as any).checkCollisions(1 / 60);

      // Enemy should be hit and killed by the 8 damage missile
      expect(enemy.hp).toBeLessThanOrEqual(0);
      expect(enemy.isDead).toBe(true);

      // Barricade must NOT be damaged by splash blast
      expect(barricade.hp).toBe(initialBarricadeHp);
      expect(barricade.isDead).toBe(false);
    });
  });

  // =========================================================================
  // DIMENSION 4: Splash Blast & Kinetic Shields
  // =========================================================================
  test.describe('Dimension 4: Splash Blast Damage & Kinetic Shield Physics', () => {

    test('STRESS-4.1: Full kinetic shield absorption: splash damage absorbs into shield, 0 HP lost', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Blast center at (300, 400)
      // Direct target center at (300, 400) -> top-left at (280, 385), size (40, 30)
      const directTarget = new Enemy(280, 385, 600, 10, EnemyType.NORMAL);
      directTarget.hp = 20;

      // Adjacent enemy center at (325, 400) -> dist = 25px <= 45px splash radius
      // Top-left at (305, 385), size (40, 30)
      const shieldedAdj = new Enemy(305, 385, 600, 10, EnemyType.SHIELDED);
      shieldedAdj.hp = 10;
      shieldedAdj.shieldHp = 6;
      shieldedAdj.maxShieldHp = 6;

      gm.enemies = [directTarget, shieldedAdj];

      // Missile center at (300, 400) -> top-left at (295, 390), size (10, 20)
      const missile = new HomingMissile(295, 390, 8);
      gm.bullets = [missile];

      (gm as any).checkCollisions(1 / 60);

      // Direct target: 20 - 8 = 12 HP
      expect(directTarget.hp).toBe(12);

      // Shielded adjacent enemy: 4 splash damage absorbed by shield
      // Shield: 6 - 4 = 2. HP: 10 untouched!
      expect(shieldedAdj.shieldHp).toBe(2);
      expect(shieldedAdj.hp).toBe(10);
      expect(shieldedAdj.isDead).toBe(false);
    });

    test('STRESS-4.2: Partial kinetic shield: shield breaks and remainder bleeds through to base HP', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Blast center at (300, 400)
      const directTarget = new Enemy(280, 385, 600, 10, EnemyType.NORMAL);
      directTarget.hp = 20;

      // Adjacent enemy center at (325, 400) (dist = 25px <= 45px)
      // Top-left at (305, 385), size (40, 30)
      const partialShieldAdj = new Enemy(305, 385, 600, 10, EnemyType.SHIELDED);
      partialShieldAdj.hp = 10;
      partialShieldAdj.shieldHp = 2;
      partialShieldAdj.maxShieldHp = 2;

      gm.enemies = [directTarget, partialShieldAdj];

      const missile = new HomingMissile(295, 390, 8);
      gm.bullets = [missile];

      (gm as any).checkCollisions(1 / 60);

      expect(partialShieldAdj.shieldHp).toBe(0);
      expect(partialShieldAdj.hp).toBe(8); // 10 - (4 - 2) = 8
      expect(partialShieldAdj.isDead).toBe(false);
    });

    test('STRESS-4.3: Strict distance cutoff: units outside 45px radius take 0 damage', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Blast center at (300, 400). Missile at (295, 390)
      const directTarget = new Enemy(280, 385, 600, 10, EnemyType.NORMAL);
      directTarget.hp = 20;

      // Inside unit center at (328, 400) -> dist = 28px <= 45px
      // Top-left at (308, 385)
      const insideEnemy = new Enemy(308, 385, 600, 10, EnemyType.NORMAL);
      insideEnemy.hp = 10;

      // Outside unit center at (355, 400) -> dist = 55px > 45px
      // Top-left at (335, 385)
      const outsideEnemy = new Enemy(335, 385, 600, 10, EnemyType.NORMAL);
      outsideEnemy.hp = 10;

      gm.enemies = [directTarget, insideEnemy, outsideEnemy];

      const missile = new HomingMissile(295, 390, 8);
      gm.bullets = [missile];

      (gm as any).checkCollisions(1 / 60);

      // Inside enemy takes 4 splash damage (10 - 4 = 6)
      expect(insideEnemy.hp).toBe(6);

      // Outside enemy takes 0 splash damage (10 untouched)
      expect(outsideEnemy.hp).toBe(10);
    });

    test('STRESS-4.4: Dense multi-target cluster splash resolution', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Blast center at (300, 400)
      const centerEnemy = new Enemy(280, 385, 600, 10, EnemyType.NORMAL);
      centerEnemy.hp = 15;
      gm.enemies = [centerEnemy];

      // Place 8 adjacent enemies arranged in a circle with center distance R = 28px <= 45px
      const clusterEnemies: Enemy[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const centerX = 300 + Math.cos(angle) * 28;
        const centerY = 400 + Math.sin(angle) * 28;
        // Enemy size is 40x30, so top-left is centerX - 20, centerY - 15
        const adj = new Enemy(centerX - 20, centerY - 15, 600, 10, EnemyType.NORMAL);
        adj.hp = 8;
        // Even indices get 2 shield HP
        if (i % 2 === 0) {
          adj.shieldHp = 2;
          adj.maxShieldHp = 2;
        }
        clusterEnemies.push(adj);
        gm.enemies.push(adj);
      }

      // Fire Lv. 5 missile (damage = 7, splash = 3)
      const missile = new HomingMissile(295, 390, 7);
      expect(missile.splashDamage).toBe(3);
      gm.bullets = [missile];

      (gm as any).checkCollisions(1 / 60);

      // Center enemy: 15 - 7 = 8 HP
      expect(centerEnemy.hp).toBe(8);

      // Cluster enemies:
      // Even indices (shield 2): splash 3 -> shield absorbs 2 (shield=0), remainder 1 to HP (hp 8 -> 7)
      // Odd indices (shield 0): splash 3 -> hp 8 -> 5
      for (let i = 0; i < 8; i++) {
        const adj = clusterEnemies[i];
        if (i % 2 === 0) {
          expect(adj.shieldHp).toBe(0);
          expect(adj.hp).toBe(7);
        } else {
          expect(adj.hp).toBe(5);
        }
      }
    });

    test('STRESS-4.5: Rogue Goliath EMP shockwave triggers safely upon splash shield break without melee crossfire', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Blast center at (300, 370). Missile top-left at (295, 360), size (10, 20)
      // Direct target (Invader) center at (300, 370) -> top-left at (280, 355), size (40, 30) -> Y range [355, 385]
      // DIRECT TARGET IS KILLED BY MISSILE (hp = 8, missile damage = 8) to ensure no post-blast crossfire melee
      const directTarget = new Enemy(280, 355, 600, 10, EnemyType.NORMAL);
      directTarget.hp = 8;

      // Rogue Goliath (Rogue faction) center at (300, 408)
      // Vertical distance = 408 - 370 = 38px <= 45px splash radius
      // Goliath size is (56, 42) -> Y range [408 - 21, 408 + 21] = [387, 429]
      // Notice: directTarget bottom is 385, Goliath top is 387 -> 2px clear gap (no AABB overlap)
      const goliath = new Enemy(300 - 28, 408 - 21, 600, 10, EnemyType.ROGUE_GOLIATH);
      goliath.hp = 35;
      goliath.shieldHp = 3;
      goliath.maxShieldHp = 3;

      gm.enemies = [directTarget, goliath];

      // Missile with 8 damage -> 4 splash damage breaks Goliath's 3 shield HP
      const missile = new HomingMissile(295, 360, 8);
      gm.bullets = [missile];

      // Expect shockwave to trigger without crash or error
      expect(() => {
        (gm as any).checkCollisions(1 / 60);
      }).not.toThrow();

      // Shield must be fully broken: 3 - 3 = 0
      expect(goliath.shieldHp).toBe(0);
      // Base HP must absorb remainder 1 damage: 35 - 1 = 34
      expect(goliath.hp).toBe(34);
    });

    test('STRESS-4.6: Rogue Phantom phase dash trigger on splash blast hit', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Blast center at (300, 370)
      const directTarget = new Enemy(280, 355, 600, 10, EnemyType.NORMAL);
      directTarget.hp = 8;

      // Phantom center at (300, 408) (dist = 38px <= 45px)
      // Phantom size is (48, 34) -> Y range [408 - 17, 408 + 17] = [391, 425] -> 6px gap from directTarget (no overlap)
      const phantom = new Enemy(300 - 24, 408 - 17, 600, 10, EnemyType.ROGUE_PHANTOM);
      phantom.hp = 25;
      phantom.phaseDashCooldown = 0; // ready to dash

      gm.enemies = [directTarget, phantom];

      const missile = new HomingMissile(295, 360, 8);
      gm.bullets = [missile];

      expect(() => {
        (gm as any).checkCollisions(1 / 60);
      }).not.toThrow();

      expect(phantom.hp).toBeLessThan(25);
    });
  });
});

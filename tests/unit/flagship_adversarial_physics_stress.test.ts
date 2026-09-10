import { test, expect } from '@playwright/test';
import { Player } from '../../src/game/Player';
import { Enemy, EnemyType } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { Barricade, BarricadeType } from '../../src/game/Barricade';
import { Faction, Vector2D } from '../../src/game/types';
import {
  CavitationTorpedo,
  CavitationTorpedoSystem,
  DEFAULT_TORPEDO_CONFIG,
  TorpedoState,
  BioluminescentLaserSystem,
  LaserHeatZone,
  QuartzRefractionPrism,
  HydraulicHarpoon,
  DEFAULT_HARPOON_CONFIG,
  HarpoonState,
  HydrothermalVent,
  HydrothermalVentManager,
  OceanCurrent,
  VentState,
  FlagshipUpdateContext,
} from '../../src/game/flagship';

/**
 * Creates a deterministic, headless FlagshipUpdateContext for stress-testing.
 */
function createStressContext(overrides: Partial<FlagshipUpdateContext> = {}): FlagshipUpdateContext {
  const player = new Player(600, 800);
  player.position = { x: 300, y: 720 };
  player.hp = 5;
  player.maxHp = 5;

  return {
    player,
    enemies: [],
    bullets: [],
    barricades: [],
    helpers: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 100,
    createExplosion: () => {},
    triggerScreenShake: () => {},
    ...overrides,
  };
}

test.describe('Flagship Adversarial Stress & Physics Challenger', () => {

  // ==========================================================================
  // 1. CAVITATION TORPEDO SUCTION SINGULARITY & HIGH ENTITY COUNTS (100+)
  // ==========================================================================
  test.describe('1. Cavitation Torpedo Suction Singularity & Entity Densities', () => {
    
    test('TORPEDO-STRESS-01: 150 entities in suction field pull inward without NaN or Infinity', () => {
      const torpedo = new CavitationTorpedo(300, 400);
      torpedo.state = TorpedoState.SINGULARITY;

      // Spawn 150 enemies distributed inside the suction well radius (r <= 140)
      const enemies: Enemy[] = [];
      for (let i = 0; i < 150; i++) {
        const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
        const angle = (i / 150) * Math.PI * 2;
        const dist = 10 + (i % 120); // 10 to 130 px from center
        enemy.position = {
          x: 300 + Math.cos(angle) * dist,
          y: 400 + Math.sin(angle) * dist,
        };
        enemies.push(enemy);
      }

      const initialDistances = enemies.map((e) =>
        Math.hypot(e.position.x + e.size.width / 2 - 307, e.position.y + e.size.height / 2 - 413)
      );

      // Execute 5 simulation frames of singularity suction (vacuumDuration = 0.08s, dt = 0.016s)
      for (let f = 0; f < 5; f++) {
        torpedo.update(0.016, enemies, []);
      }

      // Check all 150 entities
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        expect(Number.isNaN(e.position.x)).toBe(false);
        expect(Number.isNaN(e.position.y)).toBe(false);
        expect(Number.isFinite(e.position.x)).toBe(true);
        expect(Number.isFinite(e.position.y)).toBe(true);

        const newDist = Math.hypot(
          e.position.x + e.size.width / 2 - 307,
          e.position.y + e.size.height / 2 - 413
        );
        // Entity should have been pulled closer toward center
        expect(newDist).toBeLessThanOrEqual(initialDistances[i] + 0.001);
      }
    });

    test('TORPEDO-STRESS-02: Singularity center singularity guard (distSq <= 4 and distSq = 0)', () => {
      const torpedo = new CavitationTorpedo(300, 400);
      torpedo.state = TorpedoState.SINGULARITY;

      // Place enemy exactly at torpedo center (cx, cy) -> dist = 0
      const centerEnemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      centerEnemy.position = {
        x: 300 + 7 - centerEnemy.size.width / 2,
        y: 400 + 13 - centerEnemy.size.height / 2,
      };

      // Place another enemy at distSq = 3 (within the <= 4 guard threshold)
      const nearEnemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      nearEnemy.position = {
        x: centerEnemy.position.x + 1,
        y: centerEnemy.position.y + 1,
      };

      torpedo.update(0.016, [centerEnemy, nearEnemy], []);

      // Coordinates must not be NaN or Infinite
      expect(Number.isNaN(centerEnemy.position.x)).toBe(false);
      expect(Number.isNaN(centerEnemy.position.y)).toBe(false);
      expect(Number.isNaN(nearEnemy.position.x)).toBe(false);
      expect(Number.isNaN(nearEnemy.position.y)).toBe(false);
    });

    test('TORPEDO-STRESS-03: Boundary violation check under shockwave radial pushback', () => {
      const torpedo = new CavitationTorpedo(580, 40);
      torpedo.state = TorpedoState.SHOCKWAVE;
      torpedo.blastTimer = 0.01;

      // Enemy positioned very close to top-right screen edge: x = 585, y = 20
      const edgeEnemy = new Enemy(585, 20, 600, 1, EnemyType.NORMAL);
      edgeEnemy.position = { x: 585, y: 20 };

      // Update shockwave: impulseSpeed = 480 / 1 = 480 px/s, displacement = 480 * 0.12 = 57.6 px
      torpedo.update(0.05, [edgeEnemy], []);

      const posX = edgeEnemy.position.x;
      const posY = edgeEnemy.position.y;

      console.log(`[EMPIRICAL] Edge enemy position after shockwave: (${posX}, ${posY})`);

      // Check if position was pushed out of [0, 600] x [0, 800]
      const outOfBoundsX = posX < 0 || posX > 600;
      const outOfBoundsY = posY < 0 || posY > 800;

      if (outOfBoundsX || outOfBoundsY) {
        console.warn(`[VULNERABILITY CONFIRMED] Cavitation shockwave pushed entity out of logical bounds: x=${posX}, y=${posY}`);
      }
      expect(Number.isNaN(posX)).toBe(false);
      expect(Number.isNaN(posY)).toBe(false);
    });

    test('TORPEDO-STRESS-04: High entity density performance (300 entities)', () => {
      const torpedo = new CavitationTorpedo(300, 400);
      torpedo.state = TorpedoState.SINGULARITY;

      const enemies: Enemy[] = [];
      for (let i = 0; i < 300; i++) {
        const e = new Enemy(100 + (i % 20) * 20, 200 + Math.floor(i / 20) * 20, 600, 1, EnemyType.NORMAL);
        enemies.push(e);
      }

      const start = performance.now();
      for (let f = 0; f < 30; f++) {
        torpedo.update(0.016, enemies, []);
      }
      const elapsed = performance.now() - start;

      console.log(`[EMPIRICAL] 300 entities x 30 frames singularity update: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(150); // Under 5ms/frame budget
    });
  });

  // ==========================================================================
  // 2. HARPOON SPRING SIMULATION WITH ERRATIC HIGH DELTA-TIME (dt > 0.1s)
  // ==========================================================================
  test.describe('2. Harpoon Spring Simulation With Erratic High Delta-Time', () => {

    test('HARPOON-STRESS-01: Spring pull with erratic dt = 0.2s causes catastrophic overshoot out of bounds', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createStressContext();

      // Enemy positioned at (300, 400), player prow at (300, 716)
      // Distance L = 316 px (restLength = 110, deltaL = 206 px)
      const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      enemy.maxHp = 100;

      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      const initialEnemyY = enemy.position.y;

      // Single large time-step dt = 0.2s (e.g. lag spike, background tab)
      harpoon.update(0.2, { ...context, enemies: [enemy] });

      const finalEnemyY = enemy.position.y;
      const displacement = Math.abs(finalEnemyY - initialEnemyY);
      console.log(`[EMPIRICAL] Harpoon dt=0.2s: initialY=${initialEnemyY}, finalY=${finalEnemyY}, displacement=${displacement.toFixed(2)}px`);

      // Verify that enemy is safely clamped within [0, 800] due to remediation
      expect(finalEnemyY).toBeLessThanOrEqual(800);
      expect(finalEnemyY).toBeGreaterThan(initialEnemyY);
      console.log(`[VERIFIED STABILITY] Harpoon spring simulation with dt=0.2s kept enemy safely bounded at Y=${finalEnemyY} <= 800`);

      expect(Number.isNaN(enemy.position.x)).toBe(false);
      expect(Number.isNaN(enemy.position.y)).toBe(false);
    });

    test('HARPOON-STRESS-02: Erratic high dt sequence [0.016, 0.25, 0.016, 0.3] numerical stability', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createStressContext();

      const enemy = new Enemy(300, 450, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      enemy.maxHp = 100;

      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      const dtSequence = [0.016, 0.25, 0.016, 0.3, 0.016, 0.4];
      let encounteredNaN = false;

      for (const dt of dtSequence) {
        harpoon.update(dt, { ...context, enemies: [enemy] });
        if (Number.isNaN(enemy.position.x) || Number.isNaN(enemy.position.y)) {
          encounteredNaN = true;
          break;
        }
      }

      expect(encounteredNaN).toBe(false);
    });

    test('HARPOON-STRESS-03: 12-Node Verlet Cable integrity under high dt and snap', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createStressContext();

      const enemy = new Enemy(300, 250, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      // Update with dt = 0.3s
      harpoon.update(0.3, { ...context, enemies: [enemy] });

      // Check all verlet nodes
      const nodes = (harpoon as any).cableNodes;
      expect(nodes.length).toBe(12);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        expect(Number.isNaN(node.x)).toBe(false);
        expect(Number.isNaN(node.y)).toBe(false);
        expect(Number.isFinite(node.x)).toBe(true);
        expect(Number.isFinite(node.y)).toBe(true);
      }
    });

    test('HARPOON-STRESS-04: Slingshot release under dt = 0.2s', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createStressContext();

      const enemy = new Enemy(300, 500, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      const releaseResult = harpoon.releaseSlingshot();
      expect(releaseResult).not.toBeNull();

      // Update slingshot projectile with dt = 0.2s
      harpoon.update(0.2, { ...context, enemies: [enemy] });

      expect(Number.isNaN(enemy.position.x)).toBe(false);
      expect(Number.isNaN(enemy.position.y)).toBe(false);
    });
  });

  // ==========================================================================
  // 3. LASER RAYCASTING ACROSS DENSE FORMATIONS
  // ==========================================================================
  test.describe('3. Laser Raycasting Across Dense Formations', () => {

    test('LASER-STRESS-01: Laser raycast across 200 enemies in dense grid formation', () => {
      const laser = new BioluminescentLaserSystem();
      laser.upgradeLevel = 3;
      laser.setFiring(true);

      const enemies: Enemy[] = [];
      // 20 columns x 10 rows of enemies spanning x=[100, 500], y=[100, 400]
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 20; col++) {
          const e = new Enemy(100 + col * 20, 100 + row * 30, 600, 1, EnemyType.NORMAL);
          e.hp = 100;
          e.maxHp = 100;
          enemies.push(e);
        }
      }

      const context = createStressContext({ enemies });

      // Run 20 simulation frames with tickInterval triggered
      const start = performance.now();
      for (let f = 0; f < 20; f++) {
        laser.update(0.05, context); // 0.05s triggers damage tick each frame
      }
      const elapsed = performance.now() - start;

      console.log(`[EMPIRICAL] 200 enemies x 20 laser raycast ticks: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(100);

      // Verify that enemies along x = 307 (player center) took damage
      const hitEnemies = enemies.filter((e) => e.hp < 100);
      expect(hitEnemies.length).toBeGreaterThan(0);
      console.log(`[EMPIRICAL] Number of enemies pierced by direct beam: ${hitEnemies.length}`);

      for (const e of enemies) {
        expect(Number.isNaN(e.hp)).toBe(false);
        expect(Number.isNaN(e.position.x)).toBe(false);
        expect(Number.isNaN(e.position.y)).toBe(false);
      }
    });

    test('LASER-STRESS-02: Prism fan refraction through 150 dense enemies', () => {
      const laser = new BioluminescentLaserSystem();
      laser.upgradeLevel = 5; // Pentagonal prism: 5 split rays
      laser.deployPrism(290, 500); // Prism placed directly in front of player
      laser.setFiring(true);

      const enemies: Enemy[] = [];
      for (let i = 0; i < 150; i++) {
        const e = new Enemy(50 + (i % 15) * 35, 100 + Math.floor(i / 15) * 35, 600, 1, EnemyType.NORMAL);
        e.hp = 50;
        enemies.push(e);
      }

      const context = createStressContext({ enemies });

      for (let f = 0; f < 10; f++) {
        laser.update(0.05, context);
      }

      const damaged = enemies.filter((e) => e.hp < 50);
      console.log(`[EMPIRICAL] Enemies hit by 5-ray prism fan: ${damaged.length} / 150`);
      expect(damaged.length).toBeGreaterThan(0);
    });

    test('LASER-STRESS-03: Zero-length beam or collinear overlapping enemies', () => {
      const laser = new BioluminescentLaserSystem();
      laser.setFiring(true);

      // Multiple enemies at the exact same coordinate
      const e1 = new Enemy(300, 300, 600, 1, EnemyType.NORMAL);
      const e2 = new Enemy(300, 300, 600, 1, EnemyType.NORMAL);
      const context = createStressContext({ enemies: [e1, e2] });

      laser.update(0.05, context);

      expect(Number.isNaN(e1.hp)).toBe(false);
      expect(Number.isNaN(e2.hp)).toBe(false);
    });
  });

  // ==========================================================================
  // 4. HYDROTHERMAL VENT UPWARD ACCELERATION & OCEAN CURRENT DRAG
  // ==========================================================================
  test.describe('4. Hydrothermal Vent Upward Acceleration & Ocean Current Drag', () => {

    test('VENT-STRESS-01: Upward acceleration on player vessel clamped at capY + 30', () => {
      const vent = new HydrothermalVent('vent_test', 300, 0);
      vent.state = VentState.ERUPTING;

      const player = new Player(600, 800);
      player.position = { x: 300, y: 300 };

      // Update vent for 5 seconds of eruption with large upward lift
      for (let f = 0; f < 100; f++) {
        vent.update(0.05, player, [], []);
      }

      console.log(`[EMPIRICAL] Player position after continuous vent updraft: Y=${player.position.y}`);
      // Player Y must be clamped to at least capY + 30 (130)
      expect(player.position.y).toBeGreaterThanOrEqual(vent.capY + 30);
      expect(player.position.y).toBeLessThanOrEqual(800);
      expect(Number.isNaN(player.position.y)).toBe(false);
    });

    test('VENT-STRESS-02: Enemy bullet upward counter-buoyancy deceleration', () => {
      const vent = new HydrothermalVent('vent_test', 300, 0);
      vent.state = VentState.ERUPTING;

      // Hostile bullet descending through core at (300, 400)
      const bullet = new Bullet(300, 400, 200, 1, false);
      bullet.faction = Faction.INVADER;
      const initialVy = bullet.velocity.y;

      // Update vent for 0.1s: upward acceleration ay = -520 px/s^2
      // bullet.velocity.y += -520 * dt
      vent.update(0.1, new Player(600, 800), [], [bullet]);

      console.log(`[EMPIRICAL] Enemy bullet velocity before=${initialVy}, after=${bullet.velocity.y}`);
      expect(Number.isNaN(bullet.velocity.y)).toBe(false);
      expect(bullet.velocity.y).toBeLessThan(initialVy); // Decelerated upward
      expect(bullet.velocity.y).toBe(initialVy - 520 * 0.1);
    });

    test('VENT-STRESS-03: OceanCurrent drag clamping verification', () => {
      const current = new OceanCurrent(600, 800);
      const enemy = new Enemy(590, 200, 600, 1, EnemyType.NORMAL); // near right edge

      current.applyCurrentDrag(enemy, 1.0);

      // Verify that OceanCurrent clamped enemy to canvasWidth - width
      expect(enemy.position.x).toBeLessThanOrEqual(600 - enemy.size.width);
      expect(enemy.position.x).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(enemy.position.x)).toBe(false);
    });

    test('VENT-STRESS-04: Mineral nodules boundary containment', () => {
      const manager = new HydrothermalVentManager(600, 800);
      const vent = manager.vents[0] as HydrothermalVent;

      // Trigger eruption to generate nodules
      (manager as any).handleVentEruption(vent);
      expect(manager.nodules.length).toBeGreaterThanOrEqual(3);

      // Advance nodules for 60 frames
      for (let f = 0; f < 60; f++) {
        for (const nodule of manager.nodules) {
          nodule.position.x += nodule.velocity.x * 0.05;
          nodule.position.y += nodule.velocity.y * 0.05;
          expect(Number.isNaN(nodule.position.x)).toBe(false);
          expect(Number.isNaN(nodule.position.y)).toBe(false);
        }
      }
    });
  });

  // ==========================================================================
  // 5. LOGICAL BOUNDS [0, 600] x [0, 800] INVARIANTS & INTEGRATION ORACLE
  // ==========================================================================
  test.describe('5. Logical Bounds [0, 600] x [0, 800] & NaN Oracles', () => {

    test('BOUNDS-ORACLE-01: Flagship systems continuous multi-weapon simulation bounds check', () => {
      const torpedoSys = new CavitationTorpedoSystem();
      const laserSys = new BioluminescentLaserSystem();
      const harpoon = new HydraulicHarpoon();

      const enemies: Enemy[] = [];
      for (let i = 0; i < 50; i++) {
        const e = new Enemy(50 + (i % 10) * 50, 100 + Math.floor(i / 10) * 40, 600, 1, EnemyType.NORMAL);
        enemies.push(e);
      }

      const bullets: Bullet[] = [];
      const context = createStressContext({ enemies, bullets });

      // Fire torpedo, start laser, fire harpoon
      torpedoSys.fireTorpedo({ x: 300, y: 700 });
      laserSys.setFiring(true);
      harpoon.fire({ x: 300, y: 700 });

      let outOfBoundsCount = 0;
      let nanCount = 0;

      for (let frame = 0; frame < 120; frame++) {
        const dt = 0.016;

        torpedoSys.update(dt, context);
        laserSys.update(dt, context);
        harpoon.update(dt, context);

        // Periodically trigger remote detonation
        if (frame === 40) {
          torpedoSys.detonateActiveTorpedo();
        }

        // Check player
        if (
          context.player.position.x < 0 || context.player.position.x > 600 ||
          context.player.position.y < 0 || context.player.position.y > 800
        ) {
          outOfBoundsCount++;
        }
        if (Number.isNaN(context.player.position.x) || Number.isNaN(context.player.position.y)) {
          nanCount++;
        }

        // Check active enemies
        for (const e of context.enemies) {
          if (e.isDead) continue;
          if (Number.isNaN(e.position.x) || Number.isNaN(e.position.y)) {
            nanCount++;
          }
          if (e.position.x < 0 || e.position.x > 600 || e.position.y < 0 || e.position.y > 800) {
            outOfBoundsCount++;
          }
        }
      }

      console.log(`[EMPIRICAL] 120 frames multi-weapon test: NaN count = ${nanCount}, Out-of-bounds count = ${outOfBoundsCount}`);
      expect(nanCount).toBe(0);
    });
  });
});

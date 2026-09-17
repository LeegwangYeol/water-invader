import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import { Player } from '../src/game/Player';
import { Enemy } from '../src/game/Enemy';
import { Bullet } from '../src/game/Bullet';
import { GameState, EnemyType } from '../src/game/types';
import {
  ChassisId,
  VentState,
  FlagshipUpdateContext,
} from '../src/game/flagship/types';
import { ModularChassisManager } from '../src/game/flagship/progression/ModularChassis';
import {
  HydrothermalVent,
  HydrothermalVentManager,
} from '../src/game/flagship/environment/HydrothermalVent';
import { OceanCurrent } from '../src/game/flagship/environment/OceanCurrent';
import { EndGameCrisis } from '../src/game/crisis/EndGameCrisis';
import { DimensionalRift } from '../src/game/crisis/DimensionalRift';
import { CrisisArchetype } from '../src/game/crisis/types';
import { KrakenPrimeBoss } from '../src/game/flagship/factions/KrakenPrimeBoss';
import { HadalBioHorrors } from '../src/game/flagship/factions/HadalBioHorrors';
import { HydraulicHarpoon } from '../src/game/flagship/weapons/HydraulicHarpoon';
import { soundManager } from '../src/game/SoundManager';

// Headless polyfill
if (typeof (global as any).requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number;
  (global as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
}

function createMockCanvas(width: number = 600, height: number = 800): HTMLCanvasElement {
  return {
    width,
    height,
    getContext: () => ({
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
      clearRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
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

function createMockFlagshipContext(player: Player, enemies: Enemy[] = [], bullets: Bullet[] = []): FlagshipUpdateContext {
  return {
    player,
    enemies,
    bullets,
    barricades: [],
    helpers: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 0,
    createExplosion: () => {},
    triggerScreenShake: () => {},
  };
}

test.describe('Adversarial Physics Challenger 1 - Extreme & Pathological Stress Tests', () => {

  test.beforeAll(() => {
    try {
      soundManager.isMuted = true;
    } catch {}
  });

  // ==========================================================================
  // SECTION 1: Multi-Hazard Superposition Stress
  // ==========================================================================
  test.describe('1. Multi-Hazard Superposition Stress', () => {

    test('SUPERPOSITION-01: Massive multi-hazard concurrent integration (Vents + Confluence + Currents + Rift + Maw Vortex)', () => {
      const player = new Player(600, 800);
      const modular = new ModularChassisManager();
      modular.selectChassis(ChassisId.KRAKEN);
      modular.applyToPlayer(player);

      // Environment setup
      const ventManager = new HydrothermalVentManager(600, 800);
      ventManager.vents.forEach((v) => {
        v.state = VentState.ERUPTING;
        (v as any).eruptingDuration = 1000;
      });

      const oceanCurrent = new OceanCurrent(600, 800);
      oceanCurrent.upperShelfVelocityX = 90;
      oceanCurrent.lowerShelfVelocityX = -80;

      const crisis = new EndGameCrisis(600, 800);
      const rift = new DimensionalRift(300, 200, 1, 600, CrisisArchetype.VOID_SOVEREIGN);

      const krakenBoss = new KrakenPrimeBoss();
      krakenBoss.spawnApexBoss();
      if (krakenBoss.activeBoss) {
        krakenBoss.activeBoss.phase = 2;
        krakenBoss.activeBoss.vortexActive = true;
      }

      const dt = 0.0166;
      const steps = 3000; // ~50 seconds of violent concurrent hazard forces

      for (let frame = 0; frame < steps; frame++) {
        // Apply Vents & Confluence Turbulence
        ventManager.update(dt, createMockFlagshipContext(player));

        // Apply Ocean Current
        oceanCurrent.applyCurrentDrag(player, dt);

        // Apply Dimensional Rift Gravity
        (crisis as any).applyRiftGravity(rift, player, [], dt);

        // Apply Kraken Maw Vortex
        krakenBoss.update(dt, createMockFlagshipContext(player));

        // Apply Player Kinematics & Ballast
        player.update(dt);

        // INVARIANTS CHECK
        expect(Number.isFinite(player.position.x)).toBe(true);
        expect(Number.isFinite(player.position.y)).toBe(true);
        expect(Number.isNaN(player.position.x)).toBe(false);
        expect(Number.isNaN(player.position.y)).toBe(false);

        // Boundary containment
        expect(player.position.x).toBeGreaterThanOrEqual(0);
        expect(player.position.x + player.size.width).toBeLessThanOrEqual(600.001);
        expect(player.position.y).toBeGreaterThanOrEqual(0);
        expect(player.position.y + player.size.height).toBeLessThanOrEqual(800.001);
      }
    });

    test('SUPERPOSITION-02: Zero-distance Singularity Core singularity (dx=0, dy=0)', () => {
      const player = new Player(600, 800);
      const crisis = new EndGameCrisis(600, 800);
      const rift = new DimensionalRift(300, 400, 1, 600, CrisisArchetype.SINGULARITY_CORE);

      // Place player at the EXACT center of the rift
      const center = rift.getSingularityCenter();
      player.position.x = center.x - player.size.width / 2;
      player.position.y = center.y - player.size.height / 2;

      const bullet = new Bullet(center.x, center.y, -400, 10, true);

      // Verify applying gravity does not divide by zero or produce NaN
      (crisis as any).applyRiftGravity(rift, player, [bullet], 0.016);
      (crisis as any).applySingularityRiftGravity(rift, player, [bullet], 0.016);

      expect(Number.isFinite(player.position.x)).toBe(true);
      expect(Number.isFinite(player.position.y)).toBe(true);
      expect(Number.isFinite(bullet.position.x)).toBe(true);
      expect(Number.isFinite(bullet.position.y)).toBe(true);
    });

    test('SUPERPOSITION-03: Bullet swarm under multi-vortex cross-attraction', () => {
      const siphonerHadal = new HadalBioHorrors();
      siphonerHadal.spawnSporeSiphoner(200, 300);
      siphonerHadal.spawnSporeSiphoner(400, 300);

      const oceanCurrent = new OceanCurrent(600, 800);
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.SINGULARITY_CORE);

      const bullets: Bullet[] = [];
      for (let i = 0; i < 50; i++) {
        const b = new Bullet(100 + i * 8, 350 + (i % 5) * 10, -300, 10, true);
        b.velocity.x = i % 2 === 0 ? 50 : -50;
        bullets.push(b);
      }

      const player = new Player(600, 800);
      const dt = 0.016;

      for (let frame = 0; frame < 200; frame++) {
        for (const b of bullets) {
          oceanCurrent.applyCurrentToBullet(b, dt);
        }
        siphonerHadal.update(dt, createMockFlagshipContext(player, [], bullets));
        (crisis as any).applyEnvironmentalHazards(dt, player, bullets);

        for (const b of bullets) {
          b.update(dt);
          expect(Number.isFinite(b.position.x)).toBe(true);
          expect(Number.isFinite(b.position.y)).toBe(true);
          expect(Number.isFinite(b.velocity.x)).toBe(true);
          expect(Number.isFinite(b.velocity.y)).toBe(true);
        }
      }
    });

    test('SUPERPOSITION-04: Enemy flocking under Broodmother buff + Ocean Current + Confluence downwelling', () => {
      const enemies: Enemy[] = [];
      for (let i = 0; i < 6; i++) {
        enemies.push(new Enemy(280 + i * 5, 180, 600, 15, EnemyType.ZIGZAG, 800));
      }

      const ventManager = new HydrothermalVentManager(600, 800);
      const oceanCurrent = new OceanCurrent(600, 800);
      const hadal = new HadalBioHorrors();
      hadal.spawnBroodmotherMatriarch(300, 150);

      const dt = 0.016;
      for (let frame = 0; frame < 500; frame++) {
        // Trigger Broodmother buff
        if (hadal.units[0]) {
          hadal.units[0].pheromoneTimer = 14.5;
        }
        hadal.update(dt, createMockFlagshipContext(new Player(600, 800), enemies));

        ventManager.update(dt, createMockFlagshipContext(new Player(600, 800), enemies));

        for (const enemy of enemies) {
          oceanCurrent.applyCurrentDrag(enemy, dt);
          enemy.update(dt, 1.0, [], undefined, enemies);

          expect(Number.isFinite(enemy.position.x)).toBe(true);
          expect(Number.isFinite(enemy.position.y)).toBe(true);
          // Enemy horizontal containment
          expect(enemy.position.x).toBeGreaterThanOrEqual(0);
          expect(enemy.position.x + enemy.size.width).toBeLessThanOrEqual(600.001);
          // Enemy velocity speed cap
          const spd = Math.hypot(enemy.velocity.x, enemy.velocity.y);
          expect(Number.isFinite(spd)).toBe(true);
        }
      }
    });

  });

  // ==========================================================================
  // SECTION 2: Boundary Stress - Rapid Modular Chassis Hitbox Switches
  // ==========================================================================
  test.describe('2. Boundary Stress - Hitbox Switches at Canvas Borders', () => {

    const allChassis = [
      ChassisId.NAUTILUS,  // 64x46
      ChassisId.STINGRAY,  // 38x30
      ChassisId.KRAKEN,    // 50x40
      ChassisId.LEVIATHAN, // 54x42
      ChassisId.GHOST,     // 46x34
    ];

    test('BOUNDARY-01: Exact critical boundary switch matrix (x=0, x=562, y=0, y=760)', () => {
      const player = new Player(600, 800);
      const modular = new ModularChassisManager();

      const testCoordinates = [
        { x: 0, y: 0, desc: 'Top-Left origin (0, 0)' },
        { x: 562, y: 760, desc: 'Stingray/Kraken max corner (562, 760)' },
        { x: 0, y: 760, desc: 'Bottom-Left boundary (0, 760)' },
        { x: 562, y: 0, desc: 'Top-Right boundary (562, 0)' },
        { x: 600, y: 800, desc: 'Absolute Canvas Max edge (600, 800)' },
        { x: -50, y: -50, desc: 'Negative out-of-bounds (-50, -50)' },
        { x: 650, y: 850, desc: 'Positive out-of-bounds (650, 850)' },
      ];

      for (const coord of testCoordinates) {
        for (const fromChassis of allChassis) {
          for (const toChassis of allChassis) {
            // Setup fromChassis
            modular.selectChassis(fromChassis);
            modular.applyToPlayer(player);
            player.position.x = coord.x;
            player.position.y = coord.y;

            // Switch to toChassis
            modular.selectChassis(toChassis);
            modular.applyToPlayer(player);

            // VERIFY STRICT CONTAINMENT
            expect(player.position.x).toBeGreaterThanOrEqual(0);
            expect(player.position.x + player.size.width).toBeLessThanOrEqual(600);
            expect(player.position.y).toBeGreaterThanOrEqual(0);
            expect(player.position.y + player.size.height).toBeLessThanOrEqual(800);
          }
        }
      }
    });

    test('BOUNDARY-02: 5,000 Rapid Hitbox Swaps with Active Kinematic Movement', () => {
      const player = new Player(600, 800);
      const modular = new ModularChassisManager();

      // Start at canvas right boundary
      player.position.x = 550;
      player.position.y = 750;

      for (let i = 0; i < 5000; i++) {
        // Random chassis
        const chassis = allChassis[i % allChassis.length];
        modular.selectChassis(chassis);
        modular.applyToPlayer(player);

        // Adversarial movement: alternate pushing into boundaries
        if (i % 4 === 0) {
          player.isMovingRight = true;
          player.isMovingLeft = false;
        } else if (i % 4 === 1) {
          player.isMovingLeft = true;
          player.isMovingRight = false;
        } else if (i % 4 === 2) {
          player.enableBallast();
        }

        player.update(0.016);

        // Check invariants every iteration
        expect(player.position.x).toBeGreaterThanOrEqual(0);
        expect(player.position.x + player.size.width).toBeLessThanOrEqual(600);
        expect(player.position.y).toBeGreaterThanOrEqual(0);
        expect(player.position.y + player.size.height).toBeLessThanOrEqual(800);
      }
    });

  });

  // ==========================================================================
  // SECTION 3: Delta-t and Lag Spikes Stress
  // ==========================================================================
  test.describe('3. Delta-t and Lag Spikes Stress', () => {

    test('DELTAT-01: Extreme frameTime spikes (0.5s, 1.0s, 60.0s)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      const loopFn = (gm as any).loop;
      let timestamp = 1000;

      // Normal frame
      loopFn(timestamp);

      // Spike 1: 0.5s (500ms)
      timestamp += 500;
      loopFn(timestamp);
      // Invariant: accumulator was capped at 0.1s and consumed
      expect(Number.isFinite((gm as any).accumulator)).toBe(true);
      expect((gm as any).accumulator).toBeLessThan(0.02);

      // Spike 2: 1.0s (1000ms)
      timestamp += 1000;
      loopFn(timestamp);
      expect(Number.isFinite((gm as any).accumulator)).toBe(true);

      // Spike 3: 60.0s (tab suspended for a minute)
      timestamp += 60000;
      loopFn(timestamp);
      expect(Number.isFinite((gm as any).accumulator)).toBe(true);
      expect(gm.player.position.x).toBeGreaterThanOrEqual(0);
      expect(gm.player.position.x + gm.player.size.width).toBeLessThanOrEqual(600);
    });

    test('DELTAT-02: Zero frameTime (0.0s)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      const loopFn = (gm as any).loop;
      const t = 2000;

      loopFn(t);
      const acc1 = (gm as any).accumulator;

      // Call again with exact same timestamp (dt = 0)
      loopFn(t);
      const acc2 = (gm as any).accumulator;

      expect(Number.isFinite(acc2)).toBe(true);
      expect(acc2).toBe(acc1);
    });

    test('DELTAT-03: Invalid numbers fuzzing (NaN, Infinity, negative timestamps, undefined)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      const loopFn = (gm as any).loop;

      // Fuzz invalid timestamps
      const invalidTimestamps = [
        NaN,
        Infinity,
        -Infinity,
        -1000,
        -0.0001,
        undefined as any,
        null as any,
        'invalid' as any,
      ];

      for (const badTs of invalidTimestamps) {
        loopFn(badTs);
        expect(Number.isFinite((gm as any).accumulator)).toBe(true);
        expect(Number.isNaN((gm as any).accumulator)).toBe(false);
      }

      // Resume normal timestamps and verify full recovery
      let validTs = 5000;
      for (let i = 0; i < 60; i++) {
        validTs += 16.6;
        loopFn(validTs);
        expect(Number.isFinite((gm as any).accumulator)).toBe(true);
      }
      expect(gm.state).toBe(GameState.PLAYING);
    });

    test('DELTAT-04: Subsystem direct invocation under various delta-t magnitudes (0.5s, 0.1s, 0.016s, 0.001s, 0.0s)', () => {
      const player = new Player(600, 800);
      const enemy = new Enemy(200, 200, 600, 1, EnemyType.NORMAL, 800);
      const ventManager = new HydrothermalVentManager(600, 800);
      const oceanCurrent = new OceanCurrent(600, 800);
      const harpoon = new HydraulicHarpoon();

      const variousDts = [0.5, 0.1, 0.05, 0.0166, 0.001, 0.0];

      for (const dt of variousDts) {
        // Direct player update
        player.isMovingRight = true;
        player.update(dt);
        expect(Number.isFinite(player.position.x)).toBe(true);
        expect(Number.isFinite(player.position.y)).toBe(true);
        expect(player.position.x + player.size.width).toBeLessThanOrEqual(600);

        // Direct enemy update
        enemy.update(dt, 1.0, [], undefined, [enemy]);
        expect(Number.isFinite(enemy.position.x)).toBe(true);
        expect(Number.isFinite(enemy.position.y)).toBe(true);
        expect(enemy.position.x + enemy.size.width).toBeLessThanOrEqual(600.001);

        // Direct vent update
        ventManager.update(dt, createMockFlagshipContext(player, [enemy]));
        expect(Number.isFinite(player.position.x)).toBe(true);
        expect(player.position.x + player.size.width).toBeLessThanOrEqual(600.001);

        // Direct ocean current update
        oceanCurrent.applyCurrentDrag(enemy, dt);
        expect(Number.isFinite(enemy.position.x)).toBe(true);
        expect(enemy.position.x + enemy.size.width).toBeLessThanOrEqual(600.001);

        // Direct harpoon update
        harpoon.update(dt, createMockFlagshipContext(player, [enemy]));
      }
    });

  });

  // ==========================================================================
  // SECTION 4: Extreme Boundary Force Saturation & Extreme Clamping
  // ==========================================================================
  test.describe('4. Extreme Boundary Force Saturation & Extreme Clamping', () => {

    test('FORCE-CLAMP-01: Maximum multi-hazard directional vector saturation against right wall (x=600)', () => {
      const player = new Player(600, 800);
      const modular = new ModularChassisManager();
      modular.selectChassis(ChassisId.STINGRAY);
      modular.applyToPlayer(player);

      // Place player at exact right limit: 600 - 38 = 562
      player.position.x = 562;
      player.position.y = 200;

      const vent = new HydrothermalVent('vent_max_push', 200, 0);
      vent.state = VentState.ERUPTING;

      const oceanCurrent = new OceanCurrent(600, 800);
      oceanCurrent.upperShelfVelocityX = 500; // Extreme current

      const crisis = new EndGameCrisis(600, 800);
      const rightRift = new DimensionalRift(650, 200, 1, 600, CrisisArchetype.SINGULARITY_CORE); // Beyond canvas edge

      const dt = 0.016;

      // 1000 frames of extreme rightward force superposition + player steering full right
      for (let i = 0; i < 1000; i++) {
        player.isMovingRight = true;
        player.isMovingLeft = false;

        vent.update(dt, player, [], []);
        (crisis as any).applyRiftGravity(rightRift, player, [], dt);
        player.update(dt);

        expect(player.position.x + player.size.width).toBeLessThanOrEqual(600.0);
        expect(player.position.x).toBeLessThanOrEqual(562.0);
        expect(player.position.x).toBeGreaterThanOrEqual(0.0);
      }
    });

    test('FORCE-CLAMP-02: Maximum multi-hazard directional vector saturation against left wall (x=0)', () => {
      const player = new Player(600, 800);
      const modular = new ModularChassisManager();
      modular.selectChassis(ChassisId.NAUTILUS); // width 64
      modular.applyToPlayer(player);

      // Place player at left limit (x = 0)
      player.position.x = 0;
      player.position.y = 200;

      const vent = new HydrothermalVent('vent_left_push', 400, 0);
      vent.state = VentState.ERUPTING;

      const crisis = new EndGameCrisis(600, 800);
      const leftRift = new DimensionalRift(-100, 200, 1, 600, CrisisArchetype.SINGULARITY_CORE); // Beyond left canvas edge

      const dt = 0.016;

      for (let i = 0; i < 1000; i++) {
        player.isMovingLeft = true;
        player.isMovingRight = false;

        vent.update(dt, player, [], []);
        (crisis as any).applyRiftGravity(leftRift, player, [], dt);
        player.update(dt);

        expect(player.position.x).toBeGreaterThanOrEqual(0.0);
        expect(player.position.x + player.size.width).toBeLessThanOrEqual(600.0);
      }
    });

    test('FORCE-CLAMP-03: Ceiling and Floor extreme vertical force saturation', () => {
      const player = new Player(600, 800);
      const modular = new ModularChassisManager();
      modular.selectChassis(ChassisId.NAUTILUS);
      modular.applyToPlayer(player);

      // Ceiling test: vent updraft + Maw vortex upward pull + manual lift
      player.position.y = 50;
      const krakenBoss = new KrakenPrimeBoss();
      krakenBoss.spawnApexBoss();
      if (krakenBoss.activeBoss) {
        krakenBoss.activeBoss.phase = 2;
        krakenBoss.activeBoss.vortexActive = true;
      }

      for (let i = 0; i < 500; i++) {
        krakenBoss.update(0.016, createMockFlagshipContext(player));
        player.update(0.016);

        expect(player.position.y).toBeGreaterThanOrEqual(0.0);
        expect(player.position.y + player.size.height).toBeLessThanOrEqual(800.0);
      }

      // Floor test: downwelling + ballast descent + downward velocity
      player.position.y = 750;
      player.enableBallast();
      const ventManager = new HydrothermalVentManager(600, 800);

      for (let i = 0; i < 500; i++) {
        ventManager.update(0.016, createMockFlagshipContext(player));
        player.update(0.016);

        expect(player.position.y).toBeGreaterThanOrEqual(0.0);
        expect(player.position.y + player.size.height).toBeLessThanOrEqual(800.0);
      }
    });

    test('TIME-JITTER-01: 5,000 Iteration Random Timestamp Fuzzing on Master Loop', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      const loopFn = (gm as any).loop;
      let currentTimestamp = 100000;

      for (let i = 0; i < 5000; i++) {
        // Generate adversarial timestamps: backward jumps, huge leaps, negative deltas, NaNs, zeros
        const mode = i % 10;
        if (mode === 0) currentTimestamp += 500; // Lag spike 0.5s
        else if (mode === 1) currentTimestamp -= 50; // Clock moved backwards!
        else if (mode === 2) currentTimestamp += 0; // Exactly same timestamp
        else if (mode === 3) currentTimestamp += 16.666; // Normal frame
        else if (mode === 4) currentTimestamp += 8.333; // 120 FPS frame
        else if (mode === 5) currentTimestamp += 0.00001; // Sub-millisecond jitter
        else if (mode === 6) currentTimestamp += 60000; // 1 minute suspend
        else if (mode === 7) {
          loopFn(NaN);
          continue;
        } else if (mode === 8) {
          loopFn(-99999);
          continue;
        } else {
          currentTimestamp += 33.333; // 30 FPS frame
        }

        loopFn(currentTimestamp);

        // Assert state health
        expect(Number.isFinite((gm as any).accumulator)).toBe(true);
        expect(Number.isNaN((gm as any).accumulator)).toBe(false);
        expect((gm as any).accumulator).toBeGreaterThanOrEqual(0);
        expect((gm as any).accumulator).toBeLessThan(0.15); // Must not spiral out of control
      }
    });

  });

});

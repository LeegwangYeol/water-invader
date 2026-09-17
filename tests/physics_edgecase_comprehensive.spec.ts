import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import { Player } from '../src/game/Player';
import { Enemy } from '../src/game/Enemy';
import { Bullet } from '../src/game/Bullet';
import { Helper, HelperType } from '../src/game/Helper';
import { GameState, EnemyType, Faction } from '../src/game/types';
import {
  ChassisId,
  VentState,
  HarpoonState,
  FlagshipUpdateContext,
} from '../src/game/flagship/types';
import { ModularChassisManager } from '../src/game/flagship/progression/ModularChassis';
import {
  HydrothermalVent,
  HydrothermalVentManager,
} from '../src/game/flagship/environment/HydrothermalVent';
import { OceanCurrent } from '../src/game/flagship/environment/OceanCurrent';
import { BioluminescentLaserSystem } from '../src/game/flagship/weapons/BioluminescentLaser';
import { CavitationTorpedo } from '../src/game/flagship/weapons/CavitationTorpedo';
import { HydraulicHarpoon } from '../src/game/flagship/weapons/HydraulicHarpoon';
import {
  KrakenPrimeBoss,
  CharybdisTentacle,
} from '../src/game/flagship/factions/KrakenPrimeBoss';
import { HadalBioHorrors } from '../src/game/flagship/factions/HadalBioHorrors';
import { soundManager } from '../src/game/SoundManager';

// Headless polyfills for requestAnimationFrame in Node test runner
if (typeof (global as any).requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number;
  (global as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
}

// Safe headless canvas mock
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

test.describe('Physics & Kinematic Edge-Case Comprehensive Test Suite', () => {

  test.beforeAll(() => {
    try {
      soundManager.isMuted = true;
    } catch {}
  });

  // ==========================================================================
  // STREAM A: Player Kinematics & Ballast Subsystem
  // ==========================================================================
  test.describe('Stream A: Player Kinematics & Ballast Subsystem', () => {

    test('STREAM-A-01: Hitbox switch boundary clamping - switching to Nautilus near canvas edge (x=562) must not penetrate x+width > 600', () => {
      const player = new Player(600, 800);
      const modularChassis = new ModularChassisManager();

      // Start with Stingray (width=38, height=30) positioned at right edge
      modularChassis.selectChassis(ChassisId.STINGRAY);
      modularChassis.applyToPlayer(player);
      player.position.x = 600 - player.size.width; // 562
      player.position.y = 750;
      expect(player.position.x + player.size.width).toBe(600);

      // Switch to Nautilus Dreadnought (width=64, height=46)
      modularChassis.selectChassis(ChassisId.NAUTILUS);
      modularChassis.applyToPlayer(player);

      expect(player.size.width).toBe(64);
      expect(player.size.height).toBe(46);

      // Hitbox expansion must clamp position immediately within [0, 600 - width]
      expect(player.position.x + player.size.width).toBeLessThanOrEqual(600);
      expect(player.position.x).toBeLessThanOrEqual(600 - player.size.width);
      expect(player.position.x).toBeGreaterThanOrEqual(0);
    });

    test('STREAM-A-02: Ballast settling - smooth descent without instantaneous snapping when y > baselineY', () => {
      const player = new Player(600, 800);
      const targetY = player.baselineY; // e.g. 740

      // Displace player deeper than baseline (y=765, 25px deeper than baseline)
      player.position.y = targetY + 25;
      player.enableBallast();
      (player as any).isInUpdraft = false;

      // Advance 1 single frame (16.6ms)
      const dt = 0.0166;
      player.update(dt);

      // In a single 16ms frame with ballastDescentSpeed=165 px/s, movement must be smooth (~2.7px),
      // and NOT snap instantly to targetY in a single frame.
      expect(player.position.y).toBeLessThan(targetY + 25);
      expect(player.position.y).toBeGreaterThan(targetY); // Must not snap all 25px in 1 frame
      expect(player.isBallastActive).toBe(true); // Should still be settling
    });

    test('STREAM-A-03: Chassis speed retention - verify Stingray (420 px/s) speed is not trampled by Hadal Bio-Horrors', () => {
      const player = new Player(600, 800);
      const modularChassis = new ModularChassisManager();

      // Equip Stingray (baseSpeed = 420 px/s)
      modularChassis.selectChassis(ChassisId.STINGRAY);
      modularChassis.applyToPlayer(player);
      expect(player.speed).toBe(420);

      const hadalBio = new HadalBioHorrors();
      const context = createMockFlagshipContext(player);

      // Update with 0 attached parasites
      hadalBio.state.attachedParasiteCount = 0;
      hadalBio.update(0.016, context);

      // Player speed must retain Stingray speed (420 px/s), not be overwritten to default 300 px/s
      expect(player.speed).toBe(420);
    });

  });

  // ==========================================================================
  // STREAM B: Environmental Dynamics & Hazard Fields
  // ==========================================================================
  test.describe('Stream B: Environmental Dynamics & Hazard Fields', () => {

    test('STREAM-B-01: Vent lateral dispersion bounds - player at canvas edge erupting vent must clamp x+width <= 600 and x >= 0', () => {
      // 1. Right boundary penetration test: wide hull (Nautilus, width 64) inside plume cap
      const ventRight = new HydrothermalVent('vent_right', 420, 0);
      ventRight.state = VentState.ERUPTING;

      const playerRight = new Player(600, 800);
      playerRight.size.width = 64; // Nautilus hull
      playerRight.position.x = 510;
      playerRight.position.y = 130;

      // Update vent plume physics with dt = 0.05 for 5 frames (+35px displacement)
      for (let i = 0; i < 5; i++) {
        ventRight.update(0.05, playerRight, [], []);
      }

      // Lateral dispersion must clamp position so x + width <= 600
      expect(playerRight.position.x + playerRight.size.width).toBeLessThanOrEqual(600);

      // 2. Left boundary penetration test: near left wall inside Left Vent halo (x=30, width=50 -> center=55 > 49)
      const ventLeft = new HydrothermalVent('vent_left', 180, 0);
      ventLeft.state = VentState.ERUPTING;

      const playerLeft = new Player(600, 800);
      playerLeft.position.x = 30;
      playerLeft.position.y = 130;

      // Update with dt = 0.5 (-46px displacement towards left)
      ventLeft.update(0.5, playerLeft, [], []);

      // Lateral dispersion must not drive vessel past x < 0
      expect(playerLeft.position.x).toBeGreaterThanOrEqual(0);
    });

    test('STREAM-B-02: Central vent overlap - passive player in confluence does not remain stuck indefinitely', () => {
      const ventSystem = new HydrothermalVentManager(600, 800);
      (ventSystem.currentSystem as OceanCurrent).upperShelfVelocityX = 0;
      (ventSystem.currentSystem as OceanCurrent).lowerShelfVelocityX = 0;
      ventSystem.vents.forEach((v) => {
        v.state = VentState.ERUPTING;
        v.cycleTimer = 0;
        (v as any).eruptingDuration = 1000;
      });

      const player = new Player(600, 800);
      player.position = { x: 300 - player.size.width / 2, y: 130 };
      player.isMovingLeft = false;
      player.isMovingRight = false;

      const dt = 0.05;
      for (let f = 0; f < 100; f++) {
        ventSystem.update(dt, createMockFlagshipContext(player));
        player.update(dt);
      }

      // Passive player must not be permanently trapped in stagnation well at y=130 indefinitely
      // Must be released or diverted to descend past ceiling
      expect(player.position.y).toBeGreaterThan(150);
    });

    test('STREAM-B-03: Shop state vent pause - in GameState.SHOP, hydrothermal vent does not lift or displace player', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      // Transition to SHOP state
      gm.state = GameState.SHOP;

      // Position player over erupting left vent at mid-depth (x=180 - width/2, y=500)
      gm.player.position.x = 180 - gm.player.size.width / 2;
      gm.player.position.y = 500;
      const initialX = gm.player.position.x;
      const initialY = gm.player.position.y;

      // Update engine in SHOP state
      for (let i = 0; i < 10; i++) {
        gm.update(0.1);
      }

      // In SHOP state, vent forces must not lift or displace player
      expect(gm.player.position.y).toBe(initialY);
      expect(gm.player.position.x).toBe(initialX);
    });

    test('STREAM-B-04: Fixed-timestep NaN accumulator protection - passing NaN or invalid timestamp does not freeze game loop', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      // Pass NaN to game loop
      const loopFn = (gm as any).loop;
      loopFn(NaN);

      // On subsequent frame with valid timestamp, accumulator must not be poisoned with NaN
      const nextTime = performance.now() + 100;
      loopFn(nextTime);

      expect(Number.isFinite((gm as any).accumulator)).toBe(true);
      expect(Number.isNaN((gm as any).accumulator)).toBe(false);
    });

  });

  // ==========================================================================
  // STREAM C: Weapons, Projectiles & Collision CCD
  // ==========================================================================
  test.describe('Stream C: Weapons, Projectiles & Collision CCD', () => {

    test('STREAM-C-01: Weapon lethal damage wave lock - laser and cavitation torpedo lethal damage sets isDead = true on enemy so wave clear triggers', () => {
      // 1. Test Laser lethal damage
      const laser = new BioluminescentLaserSystem();
      const enemy1 = new Enemy(200, 300, 600, 1, EnemyType.NORMAL);
      enemy1.hp = 20;
      enemy1.isDead = false;

      // Apply lethal damage via takeDamage directly or laser hitscan
      enemy1.takeDamage(50);
      expect(enemy1.hp).toBeLessThanOrEqual(0);
      // BUG: Enemy.takeDamage does not set isDead = true, leaving 0-HP immortal zombie that locks wave
      expect(enemy1.isDead).toBe(true);

      // 2. Test Cavitation Torpedo lethal damage
      const enemy2 = new Enemy(200, 300, 600, 1, EnemyType.NORMAL);
      enemy2.hp = 30;
      enemy2.isDead = false;

      enemy2.takeDamage(100);
      expect(enemy2.hp).toBeLessThanOrEqual(0);
      expect(enemy2.isDead).toBe(true);
    });

    test('STREAM-C-02: Hydraulic harpoon CCD - harpoon traveling at 650 px/s does not tunnel through small/thin enemies', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);
      player.position = { x: 300 - player.size.width / 2, y: 700 };

      // Small thin enemy directly in firing line: height = 15px, y = [400, 415]
      const enemy = new Enemy(290, 400, 600, 1, EnemyType.NORMAL);
      enemy.size = { width: 20, height: 15 };
      enemy.hp = 50;
      enemy.isDead = false;

      // Fire harpoon
      harpoon.fire({ x: 300, y: 425 });
      expect(harpoon.state).toBe(HarpoonState.FLYING);

      // Advance 1 frame with dt = 0.04s (25 FPS) -> head travels -26px from y=425 to y=399,
      // completely jumping over the [400, 415] enemy without touching it discretely
      const context = createMockFlagshipContext(player, [enemy]);
      harpoon.update(0.04, context);

      // Continuous collision detection (CCD) swept check must hit the enemy rather than tunneling past
      expect(harpoon.state === HarpoonState.TETHERED || enemy.hp < 50).toBe(true);
    });

  });

  // ==========================================================================
  // STREAM D: Factions, Swarms & Boss Mechanics
  // ==========================================================================
  test.describe('Stream D: Factions, Swarms & Boss Mechanics', () => {

    test('STREAM-D-01: Flocking pincer symmetry - two allies with identical X do not lockstep in same direction forever', () => {
      const front = new Enemy(300, 200, 600, 1, EnemyType.SNIPER);
      const rear = new Enemy(300, 150, 600, 1, EnemyType.SNIPER);

      // Verify identical X center
      const frontCenterX = front.position.x + front.size.width / 2;
      const rearCenterX = rear.position.x + rear.size.width / 2;
      expect(frontCenterX).toBe(rearCenterX);

      // Trigger rear enemy fire towards player (blocked by front ally)
      const target = { x: 300, y: 700 };
      const bulletRear = rear.fire(target, [front, rear]);
      expect(bulletRear).toBeNull(); // Blocked by front ally

      // Trigger front enemy fire towards player with obstacle
      const dummyBlocking = new Enemy(300, 250, 600, 1, EnemyType.NORMAL);
      const bulletFront = front.fire(target, [dummyBlocking, front]);
      expect(bulletFront).toBeNull();

      // Symmetric tie breaking: two entities at identical X must not resolve to the same slideDir (-1)
      // They should diverge or resolve distinct evasion vectors
      expect((rear as any).slideDir).toBeDefined();
      expect((front as any).slideDir).toBeDefined();
      expect((rear as any).slideDir !== (front as any).slideDir || Math.abs(front.position.x - rear.position.x) > 0.001).toBe(true);
    });

    test('STREAM-D-02: Kraken IK tentacle - tentacle segments do not crumple into accordion 0 <-> pi flips when target is close', () => {
      const tentacle = new CharybdisTentacle('test_tentacle', 'Tentacle 1', 230, 140, 0);

      // In Phase 2, player is pulled to y=220 (distance 80px < total tentacle length 160px)
      const targetX = 230;
      const targetY = 220;

      let maxAdjacentDelta = 0;
      for (let t = 0; t < 60; t++) {
        const time = t * 0.016;
        tentacle.updateIK(targetX, targetY, time, 0.016);

        for (let i = 0; i < tentacle.joints.length - 1; i++) {
          let delta = Math.abs(tentacle.joints[i].angle - tentacle.joints[i + 1].angle);
          if (delta > Math.PI) delta = 2 * Math.PI - delta;
          if (delta > maxAdjacentDelta) maxAdjacentDelta = delta;
        }
      }

      // In natural IK, segments should smoothly articulate without violent folding (delta < 1.0 rad)
      expect(maxAdjacentDelta).toBeLessThan(1.0);
    });

    test('STREAM-D-03: Kraken Phase 2 Maw - player moving downward can descend and escape vortex', () => {
      const kraken = new KrakenPrimeBoss();
      kraken.spawnApexBoss();
      kraken.activeBoss!.phase = 2; // Charybdis Maw Vortex phase

      const player = new Player(600, 800);
      player.position = { x: 300 - player.size.width / 2, y: 260 };

      // Player is actively thrusting downward to escape vortex
      player.velocity.y = 250; // Active downward movement

      const context = createMockFlagshipContext(player);
      kraken.update(0.05, context);

      // Downward thrusting player must be able to escape/descend, not be unconditionally dragged upward
      expect(player.position.y).toBeGreaterThanOrEqual(260);
    });

    test('STREAM-D-04: Kraken Phase 3 charge - boss coordinates stay clamped within valid canvas boundaries without visual pop', () => {
      const kraken = new KrakenPrimeBoss();
      kraken.spawnApexBoss();
      kraken.activeBoss!.phase = 3;

      // Charge finishes past 700px
      kraken.isCharging = true;
      kraken.chargeDir = 1;
      kraken.position.x = 705;

      const player = new Player(600, 800);
      const context = createMockFlagshipContext(player);

      // Frame 1: charge terminates
      kraken.update(0.016, context);
      const frame1X = kraken.position.x;

      // Frame 2: subsequent frame
      kraken.update(0.016, context);
      const frame2X = kraken.position.x;

      // Boss width is 540px. Coordinates must stay clamped within [180, 420] patrol bounds
      // and must NOT experience a 130px teleport pop (550 -> 420)
      expect(frame1X).toBeLessThanOrEqual(450);
      expect(frame1X).toBeGreaterThanOrEqual(150);
      expect(Math.abs(frame2X - frame1X)).toBeLessThan(50);
    });

    test('STREAM-D-05: Hadal Broodmother - velocity does not multiply without bounds', () => {
      const hadal = new HadalBioHorrors();
      const player = new Player(600, 800);
      const context = createMockFlagshipContext(player);

      // Add a clinger unit with initial velocity
      hadal.units.push({
        id: 1,
        type: 'CLINGER',
        position: { x: 300, y: 200 },
        velocity: { x: 150, y: 150 },
        width: 24,
        height: 24,
        hp: 30,
        maxHp: 30,
        isDead: false,
        alpha: 1.0,
        hitFlashTimer: 0,
        animTimer: 0,
      });

      // Add Broodmother
      hadal.units.push({
        id: 2,
        type: 'BROODMOTHER',
        position: { x: 300, y: 100 },
        velocity: { x: 0, y: 0 },
        width: 60,
        height: 60,
        hp: 300,
        maxHp: 300,
        isDead: false,
        alpha: 1.0,
        hitFlashTimer: 0,
        animTimer: 0,
        pheromoneTimer: 13.99,
      });

      // Trigger 10 pheromone roar cycles (14s each = 140s equivalent)
      for (let cycle = 0; cycle < 10; cycle++) {
        const bm = hadal.units.find(u => u.type === 'BROODMOTHER')!;
        bm.pheromoneTimer = 14.0;
        hadal.update(0.016, context);
      }

      const clinger = hadal.units.find(u => u.type === 'CLINGER')!;
      const speed = Math.hypot(clinger.velocity.x, clinger.velocity.y);

      // Speed must be capped (e.g. <= 450 px/s), not exponentially blow up to >2,400 px/s
      expect(speed).toBeLessThanOrEqual(450);
    });

    test('STREAM-D-06: Allied vessel - stays within canvas Y bounds', () => {
      const helper = new Helper(300, -50, 600, 800, HelperType.FIGHTER);
      const player = new Player(600, 800);

      // Top boundary violation
      helper.position.y = -50;
      helper.update(0.016, [], [], [], player);
      expect(helper.position.y).toBeGreaterThanOrEqual(0);

      // Bottom boundary violation
      helper.position.y = 850;
      helper.update(0.016, [], [], [], player);
      expect(helper.position.y + helper.size.height).toBeLessThanOrEqual(800);
    });

  });

  // ==========================================================================
  // STREAM E: Game Loop, Time Scaling & State Transitions
  // ==========================================================================
  test.describe('Stream E: Game Loop, Time Scaling & State Transitions', () => {

    test('STREAM-E-01: Resurrection coordinates - dynamic centering and baselineY for custom modular chassis', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      // Equip Nautilus Dreadnought (width=64, height=46, baselineY=734)
      gm.flagshipManager.modularChassis.selectChassis(ChassisId.NAUTILUS);
      gm.prepareContinue();

      // Verify dynamic horizontal centering: (logicalWidth - width) / 2 = (600 - 64) / 2 = 268
      expect(gm.player.position.x).toBe((gm.logicalWidth - gm.player.size.width) / 2);
      // Verify baseline resting depth: baselineY = 800 - 46 - 20 = 734
      expect(gm.player.position.y).toBe(gm.player.baselineY);

      // Equip Stingray Interceptor (width=38, height=30, baselineY=750)
      gm.flagshipManager.modularChassis.selectChassis(ChassisId.STINGRAY);
      gm.continueGame();

      // Dynamic centering: (600 - 38) / 2 = 281
      expect(gm.player.position.x).toBe((gm.logicalWidth - gm.player.size.width) / 2);
      // Dynamic baselineY: 800 - 30 - 20 = 750
      expect(gm.player.position.y).toBe(gm.player.baselineY);
    });

  });

});

import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import { Player } from '../src/game/Player';
import { Enemy } from '../src/game/Enemy';
import { GameState, EnemyType, Faction } from '../src/game/types';
import { VentState, HarpoonState, FlagshipUpdateContext } from '../src/game/flagship/types';
import { HydrothermalVent } from '../src/game/flagship/environment/HydrothermalVent';
import { HydraulicHarpoon } from '../src/game/flagship/weapons/HydraulicHarpoon';
import { KrakenPrimeBoss } from '../src/game/flagship/factions/KrakenPrimeBoss';
import { EndGameCrisis } from '../src/game/crisis/EndGameCrisis';
import { CrisisArchetype, CrisisPhase } from '../src/game/crisis/types';

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

function createMockFlagshipContext(player: Player, enemies: Enemy[] = []): FlagshipUpdateContext {
  return {
    player,
    enemies,
    bullets: [],
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

test.describe('M1: Physics & Kinematics Remediation Verification Suite', () => {

  // ==========================================================================
  // DEF-PHY-01: Velocity Tracking & Downward Movement
  // ==========================================================================
  test.describe('DEF-PHY-01: Player Velocity Synchronization & Kinematics', () => {

    test('DEF-PHY-01.1: Lateral movement updates velocity.x accurately with speed', () => {
      const player = new Player(600, 800);
      player.speed = 300;

      // Move right
      player.isMovingRight = true;
      player.isMovingLeft = false;
      player.update(0.016);
      expect(player.velocity.x).toBe(300);

      // Move left
      player.isMovingRight = false;
      player.isMovingLeft = true;
      player.update(0.016);
      expect(player.velocity.x).toBe(-300);

      // Stop moving -> arcade instant stop
      player.isMovingLeft = false;
      player.update(0.016);
      expect(player.velocity.x).toBe(0);
    });

    test('DEF-PHY-01.2: Ballast descent updates velocity.y > 0 and sets isMovingDown = true', () => {
      const player = new Player(600, 800);
      player.position.y = 200; // Displaced far above baseline (740)
      player.enableBallast();
      player.isInUpdraft = false;

      player.update(0.016);

      expect(player.velocity.y).toBe(player.ballastDescentSpeed);
      expect(player.velocity.y).toBeGreaterThan(0);
      expect(player.isMovingDown).toBe(true);
      expect((player as any).isMovingDown).toBe(true);
    });

    test('DEF-PHY-01.3: Kraken Maw vortex escape functions organically using ballast descent without manual injection', () => {
      const kraken = new KrakenPrimeBoss();
      kraken.spawnApexBoss();
      kraken.activeBoss!.phase = 2; // Charybdis Maw vortex phase

      const player = new Player(600, 800);
      player.position = { x: 300 - player.size.width / 2, y: 260 };

      // In real gameplay, displaced player has ballast active
      player.enableBallast();
      player.isInUpdraft = false;
      player.update(0.016);

      // Verify that player has real positive velocity.y and isMovingDown
      expect(player.velocity.y).toBeGreaterThan(0);
      expect((player as any).isMovingDown).toBe(true);

      const context = createMockFlagshipContext(player);
      kraken.update(0.05, context);

      // Ballast-assisted downward descent must resist Maw inhalation
      expect(player.position.y).toBeGreaterThanOrEqual(260);
    });

    test('DEF-PHY-01.4: Glacial Oblivion frostbite slowdown is factored into player velocity and movement', () => {
      const player = new Player(600, 800);
      player.speed = 300;
      player.position.y = 750; // Deep in Frostbite zone (> 800 - 110 = 690)
      player.isMovingRight = true;

      // Frame 1: move at initial speed
      player.update(0.016);
      expect(player.velocity.x).toBe(300);

      // Glacial Oblivion crisis applies damping to velocity
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.GLACIAL_OBLIVION);
      crisis.phase = CrisisPhase.PHASE_1_SHIELD;
      crisis.update(0.016, player, [], []);

      // Player velocity was scaled down by Glacial Oblivion
      expect(player.velocity.x).toBeLessThan(300);
      const dampenedVx = player.velocity.x;

      // Frame 2: Player.update inherits the frostbite slowdown
      const xBefore = player.position.x;
      player.update(0.016);

      const dx = player.position.x - xBefore;
      // Movement in this frame was at the slowed speed, not the full 300 px/s
      expect(dx).toBeLessThan(300 * 0.016);
      expect(dx).toBeCloseTo(dampenedVx * 0.016, 2);
    });

  });

  // ==========================================================================
  // DEF-PHY-02: Hydrothermal Vent Dormant Lift & y~155 Trap Elimination
  // ==========================================================================
  test.describe('DEF-PHY-02: Hydrothermal Vent Dormant Zero-Lift & Ballast Descent', () => {

    test('DEF-PHY-02.1: Dormant vent produces 0 upward lift and does not set isInUpdraft', () => {
      const vent = new HydrothermalVent('vent_test', 180, 0);
      vent.state = VentState.DORMANT;

      const player = new Player(600, 800);
      player.position = { x: 155, y: 200 }; // In core plume of vent
      const initialY = player.position.y;

      vent.update(0.1, player, [], []);

      // No lift applied when dormant
      expect(player.position.y).toBe(initialY);
      // isInUpdraft must remain false
      expect((player as any).isInUpdraft).toBe(false);
      // isBallastActive should be primed
      expect((player as any).isBallastActive).toBe(true);
    });

    test('DEF-PHY-02.2: Player at y=155 inside vent halo descends smoothly back to baseline depth (y=740)', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.DORMANT; // Vent is in dormant cycle (7.5s)

      const player = new Player(600, 800);
      // Position at former trap point: y = 155
      player.position = { x: 155, y: 155 };
      expect(vent.isInHalo(155 + 25, 155 + 20)).toBe(true);

      const dt = 0.05;
      for (let f = 0; f < 80; f++) {
        vent.update(dt, player, [], []);
        player.update(dt);
      }

      // Must have completely escaped former potential well trap and reached baseline
      expect(player.position.y).toBeGreaterThan(700);
      expect(player.position.y).toBeCloseTo(740, 1);
    });

    test('DEF-PHY-02.3: Entering halo at y < capCeiling (130) does not snap downwards', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.ERUPTING;

      const player = new Player(600, 800);
      player.position = { x: 155, y: 90 }; // Above cap ceiling (130)

      vent.update(0.016, player, [], []);

      // Anti-downward-teleportation: player must not be snapped down to 130
      expect(player.position.y).toBeLessThanOrEqual(90);
    });

  });

  // ==========================================================================
  // DEF-PHY-03: Boss Slingshot Instakill Prevention
  // ==========================================================================
  test.describe('DEF-PHY-03: Boss Slingshot Protection & Slingshot Kinematics', () => {

    test('DEF-PHY-03.1: Apex Boss catapulted past y <= -60 is NOT instakilled, takes 180 dmg, and bounces to y=120', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);

      // Create a Boss enemy with high HP
      const boss = new Enemy(280, 300, 600, 1, EnemyType.BOSS);
      boss.hp = 5000;
      boss.maxHp = 5000;
      boss.isDead = false;
      expect((boss as any).isBoss).toBe(true);

      // Tether boss and release slingshot
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = boss;
      const releaseResult = harpoon.releaseSlingshot();

      expect(releaseResult).not.toBeNull();
      expect((harpoon as any).slingshotProjectiles.length).toBe(1);

      // Move boss past y <= -60
      boss.position.y = -70;

      // Advance update to trigger boundary trigger
      const context = createMockFlagshipContext(player, [boss]);
      harpoon.update(0.016, context);

      // Boss must NOT be dead!
      expect(boss.isDead).toBe(false);
      // Boss must have taken 180 slingshot impact damage
      expect(boss.hp).toBe(5000 - 180);
      // Boss must be clamped back into the active arena at y=120
      expect(boss.position.y).toBe(120);
      // Slingshot projectile must be cleaned up
      expect((harpoon as any).slingshotProjectiles.length).toBe(0);
    });

    test('DEF-PHY-03.2: Regular enemy catapulted past y <= -60 IS killed normally', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);

      const mob = new Enemy(280, 300, 600, 1, EnemyType.NORMAL);
      mob.hp = 50;
      mob.isDead = false;
      expect((mob as any).isBoss).toBe(false);

      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = mob;
      harpoon.releaseSlingshot();

      mob.position.y = -70;
      const context = createMockFlagshipContext(player, [mob]);
      harpoon.update(0.016, context);

      expect(mob.isDead).toBe(true);
    });

  });

  // ==========================================================================
  // DEF-PHY-04 & DEF-PHY-05: Velocity Clamping & Relative Damping
  // ==========================================================================
  test.describe('DEF-PHY-04 & DEF-PHY-05: Slingshot Velocity Clamp & Relative Damping', () => {

    test('DEF-PHY-04.1: Instantaneous position jump > 200px resets velocity to 0 without velocity explosion', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);
      player.position.x = 100;
      player.position.y = 700;

      const context = createMockFlagshipContext(player);
      harpoon.update(0.016, context);

      // Sudden position teleport (e.g. respawn jump: x from 100 to 450 = +350px)
      player.position.x = 450;
      harpoon.update(0.016, context);

      // Velocity must be reset to 0, NOT spike to 350 / 0.016 = 21,875 px/s
      expect((harpoon as any).playerVelocity.x).toBe(0);
      expect((harpoon as any).playerVelocity.y).toBe(0);
    });

    test('DEF-PHY-04.2: Continuous player velocity is clamped within [-600, 600]', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);
      player.position.x = 100;
      player.position.y = 700;

      const context = createMockFlagshipContext(player);
      harpoon.update(0.016, context);

      // Move player 150px in 0.016s -> un-clamped velocity would be 9,375 px/s
      player.position.x = 250;
      harpoon.update(0.016, context);

      expect((harpoon as any).playerVelocity.x).toBe(600);
      expect((harpoon as any).playerVelocity.y).toBe(0);
    });

    test('DEF-PHY-05.1: Spring damping factors in enemy relative velocity without chatter', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);
      player.position = { x: 300, y: 700 };

      const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      enemy.velocity = { x: 0, y: 200 }; // Enemy charging toward player

      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      const context = createMockFlagshipContext(player, [enemy]);
      harpoon.update(0.016, context);

      // Enemy position remains finite and bounded
      expect(Number.isFinite(enemy.position.x)).toBe(true);
      expect(Number.isFinite(enemy.position.y)).toBe(true);
    });

  });

  // ==========================================================================
  // DEF-PHY-06: Harpoon Tether Reset on Wave / Crisis / Continue Transitions
  // ==========================================================================
  test.describe('DEF-PHY-06: Orphaned Tether Cleanup on State Transitions', () => {

    test('DEF-PHY-06.1: resetTether clears tetheredEntity and resets harpoon state to READY', () => {
      const harpoon = new HydraulicHarpoon();
      const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);

      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      harpoon.resetTether();

      expect(harpoon.state).toBe(HarpoonState.READY);
      expect(harpoon.tetheredEntity).toBeNull();
    });

    test('DEF-PHY-06.2: GameManager startNextWave resets any active tether', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      gm.flagshipManager.hydraulicHarpoon.state = HarpoonState.TETHERED;
      gm.flagshipManager.hydraulicHarpoon.tetheredEntity = enemy;

      gm.startNextWave();

      expect(gm.flagshipManager.hydraulicHarpoon.state).toBe(HarpoonState.READY);
      expect(gm.flagshipManager.hydraulicHarpoon.tetheredEntity).toBeNull();
    });

    test('DEF-PHY-06.3: GameManager continueGame resets any active tether', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.GAME_OVER;

      const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      gm.flagshipManager.hydraulicHarpoon.state = HarpoonState.TETHERED;
      gm.flagshipManager.hydraulicHarpoon.tetheredEntity = enemy;

      gm.continueGame();

      expect(gm.flagshipManager.hydraulicHarpoon.state).toBe(HarpoonState.READY);
      expect(gm.flagshipManager.hydraulicHarpoon.tetheredEntity).toBeNull();
    });

    test('DEF-PHY-06.4: GameManager triggerEndGameCrisis resets any active tether', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      gm.flagshipManager.hydraulicHarpoon.state = HarpoonState.TETHERED;
      gm.flagshipManager.hydraulicHarpoon.tetheredEntity = enemy;

      gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);

      expect(gm.flagshipManager.hydraulicHarpoon.state).toBe(HarpoonState.READY);
      expect(gm.flagshipManager.hydraulicHarpoon.tetheredEntity).toBeNull();
    });

  });

  // ==========================================================================
  // DEF-PHY-08: Post-Subsystem Coordinate Boundary Invariant Enforcement
  // ==========================================================================
  test.describe('DEF-PHY-08: Post-Subsystem Coordinate Invariant Enforcement', () => {

    test('DEF-PHY-08.1: Player displaced outside boundary during flagshipManager.update is clamped before draw', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      // Force player position outside boundary
      gm.player.position.x = 999;
      gm.player.position.y = -50;

      gm.update(0.016);

      // Must be strictly clamped within [0, logicalWidth - width] x [0, logicalHeight - height]
      expect(gm.player.position.x).toBeLessThanOrEqual(gm.logicalWidth - gm.player.width);
      expect(gm.player.position.x).toBeGreaterThanOrEqual(0);
      expect(gm.player.position.y).toBeLessThanOrEqual(gm.logicalHeight - gm.player.height);
      expect(gm.player.position.y).toBeGreaterThanOrEqual(0);
    });

    test('DEF-PHY-08.2: Player with NaN coordinates is safely sanitized to baseline coordinates', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      gm.player.position.x = NaN;
      gm.player.position.y = NaN;

      gm.update(0.016);

      expect(Number.isFinite(gm.player.position.x)).toBe(true);
      expect(Number.isFinite(gm.player.position.y)).toBe(true);
      expect(gm.player.position.x).toBe((gm.logicalWidth - gm.player.width) / 2);
      expect(gm.player.position.y).toBe(gm.player.baselineY);
    });

  });

});

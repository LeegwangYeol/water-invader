import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import { Player } from '../src/game/Player';
import { Enemy } from '../src/game/Enemy';
import { GameState, EnemyType, Faction } from '../src/game/types';
import { VentState, HarpoonState, FlagshipUpdateContext } from '../src/game/flagship/types';
import { HydrothermalVent } from '../src/game/flagship/environment/HydrothermalVent';
import { HydraulicHarpoon } from '../src/game/flagship/weapons/HydraulicHarpoon';

// Mock Canvas 2D context helper for headless Node testing
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

// Track and polyfill rAF / cAF in test runner
let nextRafId = 1000;
const activeRafCallbacks = new Map<number, FrameRequestCallback>();

if (typeof (globalThis as any).requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = nextRafId++;
    activeRafCallbacks.set(id, callback);
    return id;
  };
}

if (typeof (globalThis as any).cancelAnimationFrame === 'undefined') {
  (globalThis as any).cancelAnimationFrame = (id: number): void => {
    activeRafCallbacks.delete(id);
  };
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
    gameState: GameState.PLAYING,
    createExplosion: () => {},
    triggerScreenShake: () => {},
  };
}

test.describe('Adversarial Challenger M5: Kinematics, Buoyancy & Lifecycle Stress Suite', () => {

  // ==========================================================================
  // CHALLENGE 1: Hydrothermal Vent Buoyancy & Ballast System Stress
  // ==========================================================================
  test.describe('Challenge 1: Hydrothermal Vent Buoyancy & Ballast Descent', () => {

    test('CHAL-1.1: Placing player inside dormant vent plume results in 0 upward lift and smooth ballast descent to y=740', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.DORMANT;

      const player = new Player(600, 800);
      // Place player inside the dormant vent core (anchorX = 180, y = 250)
      player.position = { x: 180 - player.size.width / 2, y: 250 };
      expect(vent.isInHalo(180, 250 + 20)).toBe(true);

      const yInitial = player.position.y;

      // Single frame update
      vent.update(0.016, player, [], []);

      // Verify zero upward lift: isInUpdraft must NOT be true, and y must NOT have decreased
      expect(player.isInUpdraft).toBe(false);
      expect(player.position.y).toBeGreaterThanOrEqual(yInitial);
      // Ballast must be engaged
      expect(player.isBallastActive).toBe(true);

      // Simulate full descent under dormant plume
      const dt = 0.02;
      for (let f = 0; f < 200; f++) {
        const yBefore = player.position.y;
        vent.update(dt, player, [], []);
        player.update(dt);
        // Player should NEVER experience upward lift while vent is dormant
        expect(player.position.y).toBeGreaterThanOrEqual(yBefore);
      }

      // Ballast target baselineY for 800h sub (height 40, pad 20) is 740
      expect(player.position.y).toBeCloseTo(740, 1);
      expect(player.isBallastActive).toBe(false);
      expect(player.velocity.y).toBe(0);
    });

    test('CHAL-1.2: Historical potential-well entrapment at y=155 inside dormant vent halo smoothly descends to y=740', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.DORMANT;

      const player = new Player(600, 800);
      // Place at the historical limit-cycle trap coordinate y = 155
      player.position = { x: 155, y: 155 };
      expect(vent.isInHalo(155 + 25, 155 + 20)).toBe(true);

      const dt = 0.016;
      let framesToBaseline = 0;

      for (let i = 0; i < 300; i++) {
        vent.update(dt, player, [], []);
        player.update(dt);
        if (Math.abs(player.position.y - 740) < 0.5 && framesToBaseline === 0) {
          framesToBaseline = i;
        }
      }

      // Ballast descent rate is 165 px/s -> (740 - 155) / 165 ~ 3.54s (~222 frames at 60fps)
      expect(framesToBaseline).toBeGreaterThan(150);
      expect(framesToBaseline).toBeLessThan(260);
      expect(player.position.y).toBeCloseTo(740, 1);
      expect(player.isBallastActive).toBe(false);
    });

    test('CHAL-1.3: Multi-depth parameter sweep confirms monotonic descent without upward spikes', () => {
      const testDepths = [130, 155, 180, 220, 275, 330, 410, 500, 590, 680, 720];

      for (const startY of testDepths) {
        const vent = new HydrothermalVent('vent_test', 180, 0);
        vent.state = VentState.DORMANT;

        const player = new Player(600, 800);
        player.position = { x: 180 - player.size.width / 2, y: startY };

        let prevY = startY;
        const dt = 0.016;

        for (let step = 0; step < 250; step++) {
          vent.update(dt, player, [], []);
          player.update(dt);

          // Monotonic descent assertion: y must never decrease
          expect(player.position.y).toBeGreaterThanOrEqual(prevY);
          prevY = player.position.y;
        }

        expect(player.position.y).toBeCloseTo(740, 1);
        expect(player.isBallastActive).toBe(false);
      }
    });

    test('CHAL-1.4: Dormant vent suppresses lateral dispersion near plume cap', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.DORMANT;

      const player = new Player(600, 800);
      player.position = { x: 160, y: 140 }; // Near plume cap (capY + 30 = 130)

      const initialX = player.position.x;
      for (let f = 0; f < 30; f++) {
        vent.update(0.016, player, [], []);
        player.update(0.016);
      }

      // Lateral X coordinate must remain unchanged during dormant cycle
      expect(player.position.x).toBe(initialX);
    });

  });

  // ==========================================================================
  // CHALLENGE 2: Hydraulic Harpoon Slingshot on Boss Entities
  // ==========================================================================
  test.describe('Challenge 2: Harpoon Slingshot Boss Protection & Damage Verification', () => {

    test('CHAL-2.1: Apex Boss launched past top screen (y < -60) is NOT instakilled, takes 180 impact dmg, and bounces to y=120', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);

      // Create an active Boss entity
      const boss = new Enemy(270, 200, 600, 5, EnemyType.BOSS, 800);
      boss.hp = 6000;
      boss.maxHp = 6000;
      boss.isDead = false;
      expect((boss as any).isBoss).toBe(true);

      // Tether boss and release slingshot
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = boss;
      const releaseResult = harpoon.releaseSlingshot();

      expect(releaseResult).not.toBeNull();
      expect((harpoon as any).slingshotProjectiles.length).toBe(1);

      // Propel boss past top boundary threshold (y < -60)
      boss.position.y = -65;

      const context = createMockFlagshipContext(player, [boss]);
      harpoon.update(0.016, context);

      // 1. Boss must NOT be instakilled
      expect(boss.isDead).toBe(false);
      // 2. Boss must take exactly 180 impact damage
      expect(boss.hp).toBe(6000 - 180);
      // 3. Boss must be safely bounded back into the active arena at y = 120
      expect(boss.position.y).toBe(120);
      // 4. Downward velocity imparted
      expect((boss as any).velocity.y).toBeGreaterThan(0);
      // 5. Slingshot projectile entry cleaned up
      expect((harpoon as any).slingshotProjectiles.length).toBe(0);
    });

    test('CHAL-2.2: Entity with isApexBoss flag launched past y < -60 receives slingshot protection and 180 damage', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);

      // Create an entity with isApexBoss = true
      const apexEntity = new Enemy(270, 200, 600, 10, EnemyType.DIVER, 800);
      (apexEntity as any).isApexBoss = true;
      apexEntity.hp = 4000;
      apexEntity.maxHp = 4000;
      apexEntity.isDead = false;

      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = apexEntity;
      harpoon.releaseSlingshot();

      // Launch far off screen
      apexEntity.position.y = -120;

      const context = createMockFlagshipContext(player, [apexEntity]);
      harpoon.update(0.016, context);

      expect(apexEntity.isDead).toBe(false);
      expect(apexEntity.hp).toBe(4000 - 180);
      expect(apexEntity.position.y).toBe(120);
      expect((harpoon as any).slingshotProjectiles.length).toBe(0);
    });

    test('CHAL-2.3: Contrast verification: Non-boss mob launched past y < -60 IS destroyed', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);

      const regularMob = new Enemy(270, 200, 600, 1, EnemyType.NORMAL, 800);
      regularMob.hp = 100;
      regularMob.isDead = false;
      expect((regularMob as any).isBoss).toBe(false);

      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = regularMob;
      harpoon.releaseSlingshot();

      regularMob.position.y = -65;

      const context = createMockFlagshipContext(player, [regularMob]);
      harpoon.update(0.016, context);

      // Non-boss entity MUST be killed
      expect(regularMob.isDead).toBe(true);
      expect((harpoon as any).slingshotProjectiles.length).toBe(0);
    });

    test('CHAL-2.4: Slingshot impact lethality: Low HP boss (<180 HP) legitimately dies from impact damage', () => {
      const harpoon = new HydraulicHarpoon();
      const player = new Player(600, 800);

      const lowHpBoss = new Enemy(270, 200, 600, 1, EnemyType.BOSS, 800);
      lowHpBoss.hp = 120; // Less than 180 damage
      lowHpBoss.isDead = false;

      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = lowHpBoss;
      harpoon.releaseSlingshot();

      lowHpBoss.position.y = -70;

      const context = createMockFlagshipContext(player, [lowHpBoss]);
      harpoon.update(0.016, context);

      // Boss took 180 damage, exceeding remaining 120 HP -> legitimately dead!
      expect(lowHpBoss.hp).toBeLessThanOrEqual(0);
      expect(lowHpBoss.isDead).toBe(true);
    });

    test('CHAL-2.5: Extreme negative launch coordinates (y = -500, -1000) are bounded safely without NaN', () => {
      const extremeCoordinates = [-70, -150, -300, -500, -1000];

      for (const testY of extremeCoordinates) {
        const harpoon = new HydraulicHarpoon();
        const player = new Player(600, 800);

        const boss = new Enemy(270, 200, 600, 1, EnemyType.BOSS, 800);
        boss.hp = 3000;
        boss.isDead = false;

        harpoon.state = HarpoonState.TETHERED;
        harpoon.tetheredEntity = boss;
        harpoon.releaseSlingshot();

        boss.position.y = testY;

        const context = createMockFlagshipContext(player, [boss]);
        harpoon.update(0.016, context);

        expect(boss.isDead).toBe(false);
        expect(boss.position.y).toBe(120);
        expect(Number.isFinite(boss.position.y)).toBe(true);
        expect(Number.isFinite((boss as any).velocity.y)).toBe(true);
      }
    });

  });

  // ==========================================================================
  // CHALLENGE 3: Game Loop rAF Lifecycle Stress Testing
  // ==========================================================================
  test.describe('Challenge 3: Game Loop rAF Lifecycle & Menu Invariants', () => {

    test('CHAL-3.1: Playing -> Pause -> Resume -> GameOver cycle maintains strict animationFrameId invariants', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // 1. Initial State: not started
      expect(gm.animationFrameId).toBe(0);

      // 2. Start game -> PLAYING
      gm.start();
      expect(gm.state).toBe(GameState.PLAYING);
      expect(gm.isPaused).toBe(false);
      expect(gm.animationFrameId).toBeGreaterThan(0);
      const activeId1 = gm.animationFrameId;

      // 3. Pause
      gm.pause();
      expect(gm.isPaused).toBe(true);
      expect(gm.animationFrameId).toBe(0);
      expect(activeRafCallbacks.has(activeId1)).toBe(false);

      // 4. Resume
      gm.resume();
      expect(gm.isPaused).toBe(false);
      expect(gm.animationFrameId).toBeGreaterThan(0);
      const activeId2 = gm.animationFrameId;

      // 5. Game Over
      gm.gameOver('Test Defeat');
      expect(gm.state).toBe(GameState.GAME_OVER);
      expect(gm.animationFrameId).toBe(0);
      expect(activeRafCallbacks.has(activeId2)).toBe(false);
    });

    test('CHAL-3.2: Entering GameState.SHOP stops rAF loop and keeps animationFrameId strictly 0', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.start();
      expect(gm.animationFrameId).toBeGreaterThan(0);

      // Transition to SHOP via wave completion simulation
      gm.state = GameState.SHOP;
      gm.pause();

      expect(gm.state).toBe(GameState.SHOP);
      expect(gm.animationFrameId).toBe(0);

      // Manually calling resume() while in SHOP must NOT start loop
      gm.resume();
      expect(gm.animationFrameId).toBe(0);
    });

    test('CHAL-3.3: Multiple consecutive resume() calls do NOT spawn duplicate rAF loops (Idempotency)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.start();

      const initialId = gm.animationFrameId;
      expect(initialId).toBeGreaterThan(0);

      // Call resume 10 times in active state
      for (let i = 0; i < 10; i++) {
        gm.resume();
        expect(gm.animationFrameId).toBe(initialId);
      }

      // Pause and clean up
      gm.pause();
      expect(gm.animationFrameId).toBe(0);
    });

    test('CHAL-3.4: Stress Fuzzer: 100 rapid random state transitions maintain rAF integrity', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.start();

      const actions = [
        () => gm.pause(),
        () => gm.resume(),
        () => {
          gm.state = GameState.SHOP;
          gm.pause();
        },
        () => gm.prepareContinue(),
        () => gm.continueGame(),
        () => gm.gameOver('Fuzzer'),
        () => gm.startGame(),
        () => (gm as any).loop(performance.now()),
      ];

      for (let cycle = 0; cycle < 100; cycle++) {
        const action = actions[cycle % actions.length];
        action();

        // Verification invariant:
        if (gm.state !== GameState.PLAYING || gm.isPaused) {
          expect(gm.animationFrameId).toBe(0);
        } else {
          expect(gm.animationFrameId).toBeGreaterThan(0);
        }
      }

      // Cleanup
      gm.stopGame();
      expect(gm.animationFrameId).toBe(0);
    });

    test('CHAL-3.5: Manual loop execution during SHOP or GAME_OVER exits early without scheduling next frame', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // In SHOP
      gm.state = GameState.SHOP;
      gm.isPaused = false;
      gm.animationFrameId = 777; // artificially primed

      (gm as any).loop(performance.now());
      expect(gm.animationFrameId).toBe(0);

      // In GAME_OVER
      gm.state = GameState.GAME_OVER;
      gm.animationFrameId = 888;

      (gm as any).loop(performance.now());
      expect(gm.animationFrameId).toBe(0);
    });

  });

  // ==========================================================================
  // CHALLENGE 4: Crisis Timer Persistence Across Wave Clear
  // ==========================================================================
  test.describe('Challenge 4: Crisis Timer Persistence When Regular Enemies Are Cleared', () => {

    test('CHAL-4.1: SOLAR_FLARE crisis does NOT abort when all regular enemies are cleared; ticks down to 0 before SHOP opens', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 10;
      gm.warningTimer = 0;

      // Trigger SOLAR_FLARE crisis (duration 8.0s)
      gm.triggerCrisis('SOLAR_FLARE');
      expect(gm.crisisState.activeCrisis).toBe('SOLAR_FLARE');
      expect(gm.crisisState.timer).toBe(8.0);

      // Clear warning timer so crisis effect is active
      gm.crisisState.warningTimer = 0;
      gm.warningTimer = 0;

      // Defeat all regular enemies
      gm.enemies = [];

      // Step 1: Run for 3 seconds of in-game time (150 frames @ 0.02s)
      for (let f = 0; f < 150; f++) {
        gm.update(0.02);
      }

      // Assert: crisis must NOT have aborted! State must still be PLAYING!
      expect(gm.crisisState.activeCrisis).toBe('SOLAR_FLARE');
      expect(gm.crisisState.timer).toBeCloseTo(8.0 - 3.0, 1);
      expect(gm.state).toBe(GameState.PLAYING);

      // Step 2: Run until remaining duration expires (5.0s = 250 frames @ 0.02s) + extra 5 frames
      for (let f = 0; f < 255; f++) {
        gm.update(0.02);
      }

      // Assert: Now that crisis timer has fully expired AND enemies are cleared, SHOP opens
      expect(gm.crisisState.activeCrisis).toBeNull();
      expect(gm.crisisState.timer).toBe(0);
      expect(gm.state).toBe(GameState.SHOP);
      expect(gm.isPaused).toBe(true);
      expect(gm.animationFrameId).toBe(0);
    });

    test('CHAL-4.2: EMP_DISRUPTION crisis preserves active countdown and suppression with 0 enemies', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 10;
      gm.warningTimer = 0;

      gm.triggerCrisis('EMP_DISRUPTION');
      expect(gm.crisisState.activeCrisis).toBe('EMP_DISRUPTION');
      expect(gm.crisisState.timer).toBe(3.5);

      gm.crisisState.warningTimer = 0;
      gm.warningTimer = 0;
      gm.enemies = []; // No enemies

      // Run for 2.0s
      for (let f = 0; f < 100; f++) {
        gm.update(0.02);
      }

      expect(gm.crisisState.activeCrisis).toBe('EMP_DISRUPTION');
      expect(gm.crisisState.timer).toBeCloseTo(1.5, 1);
      expect(gm.state).toBe(GameState.PLAYING);

      // Run remainder
      for (let f = 0; f < 80; f++) {
        gm.update(0.02);
      }

      expect(gm.crisisState.activeCrisis).toBeNull();
      expect(gm.state).toBe(GameState.SHOP);
    });

    test('CHAL-4.3: Crisis duration parameter sweep across all crisis types', () => {
      const crisisTypes: Array<'TOTAL_WAR' | 'SWARM_BLITZ' | 'TITAN_HORDE'> = [
        'TOTAL_WAR',
        'SWARM_BLITZ',
        'TITAN_HORDE'
      ];

      for (const crisisType of crisisTypes) {
        const canvas = createMockCanvas();
        const gm = new GameManager(canvas);
        gm.state = GameState.PLAYING;
        gm.level = 10;
        gm.warningTimer = 0;

        gm.triggerCrisis(crisisType);
        const originalDuration = gm.crisisState.duration;
        gm.crisisState.warningTimer = 0;
        gm.warningTimer = 0;

        // Clear hostiles immediately
        gm.enemies = [];

        // Half duration update
        const halfSteps = Math.floor((originalDuration / 2) / 0.02);
        for (let i = 0; i < halfSteps; i++) {
          gm.update(0.02);
        }

        expect(gm.crisisState.activeCrisis).toBe(crisisType);
        expect(gm.state).toBe(GameState.PLAYING);

        // Run remaining duration to completion
        const remainingSteps = halfSteps + 10;
        for (let i = 0; i < remainingSteps; i++) {
          gm.update(0.02);
        }

        expect(gm.crisisState.activeCrisis).toBeNull();
        expect(gm.state).toBe(GameState.SHOP);
      }
    });

  });

});

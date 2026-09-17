import { test, expect } from '@playwright/test';
import { Player } from '../src/game/Player';
import { HydrothermalVent, HydrothermalVentManager } from '../src/game/flagship/environment/HydrothermalVent';
import { VentState, ChassisId, FlagshipUpdateContext } from '../src/game/flagship/types';
import { ModularChassisManager } from '../src/game/flagship/progression/ModularChassis';

function createMockFlagshipContext(player: Player): FlagshipUpdateContext {
  return {
    player,
    enemies: [],
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

test.describe('Adversarial Stress Test: Modular Chassis Hulls & Multi-Vent Overlap Zone', () => {

  // ==========================================================================
  // SECTION 1: MODULAR CHASSIS BALLAST RESTORATION ACROSS ALL 6 HULLS
  // ==========================================================================
  test.describe('1. Ballast Restoration Across All Modular Chassis Hulls', () => {
    const chassisProfiles = [
      { id: 'DEFAULT', name: 'Default Submersible', width: 50, height: 40, expectedBaselineY: 740 },
      { id: ChassisId.NAUTILUS, name: 'Nautilus Dreadnought', width: 64, height: 46, expectedBaselineY: 734 },
      { id: ChassisId.STINGRAY, name: 'Stingray Interceptor', width: 38, height: 30, expectedBaselineY: 750 },
      { id: ChassisId.KRAKEN, name: 'Kraken Bioship', width: 50, height: 40, expectedBaselineY: 740 },
      { id: ChassisId.LEVIATHAN, name: 'Leviathan Harvester', width: 54, height: 42, expectedBaselineY: 738 },
      { id: ChassisId.GHOST, name: 'Ghost Stealth Sub', width: 46, height: 34, expectedBaselineY: 746 },
    ];

    for (const profile of chassisProfiles) {
      test(`CHASSIS-BALLAST: ${profile.name} (${profile.id}: ${profile.width}x${profile.height}) restores smoothly to baselineY=${profile.expectedBaselineY}`, () => {
        const player = new Player(600, 800);
        const modularChassis = new ModularChassisManager();

        if (profile.id !== 'DEFAULT') {
          modularChassis.selectChassis(profile.id as ChassisId);
          modularChassis.applyToPlayer(player);
        }

        // Verify hitbox dimensions
        expect(player.size.width).toBe(profile.width);
        expect(player.size.height).toBe(profile.height);

        // Verify dynamic baselineY getter calculation
        expect(player.baselineY).toBe(profile.expectedBaselineY);

        // Position player at ceiling y=130 outside any vents
        player.position = { x: 20, y: 130 };
        player.enableBallast();
        expect(player.isBallastActive).toBe(true);

        const dt = 0.05; // 20 FPS simulation steps
        const trajectory: number[] = [player.position.y];

        // Simulate 5 seconds (100 steps)
        for (let f = 0; f < 100; f++) {
          player.update(dt);
          trajectory.push(player.position.y);
        }

        // 1. Monotonic descent check
        for (let i = 1; i < trajectory.length; i++) {
          const dy = trajectory[i] - trajectory[i - 1];
          expect(dy).toBeGreaterThanOrEqual(0); // Never floats upward outside updraft
          expect(dy).toBeLessThanOrEqual(player.ballastDescentSpeed * dt + 0.001); // Anti-teleport
        }

        // 2. Final rest position check
        expect(player.position.y).toBeCloseTo(profile.expectedBaselineY, 1);
        expect(player.isBallastActive).toBe(false); // Ballast deactivates once target reached
      });
    }
  });

  // ==========================================================================
  // SECTION 2: MULTI-VENT OVERLAP ZONE AT y=130 (x in [286, 314])
  // ==========================================================================
  test.describe('2. Multi-Vent Overlap Zone Interaction Analysis', () => {
    
    test('VENT-OVERLAP-EMPIRICAL-01: Passive drift behavior in overlap zone [286, 314] at y=130', () => {
      const ventSystem = new HydrothermalVentManager(600, 800);
      const player = new Player(600, 800);

      // Inspect the two vents
      const ventLeft = ventSystem.vents[0] as HydrothermalVent;
      const ventRight = ventSystem.vents[1] as HydrothermalVent;
      expect(ventLeft.anchorX).toBe(180);
      expect(ventRight.anchorX).toBe(420);

      // Verify halo radii at y=130
      const haloR = ventLeft.getHaloRadius(130);
      console.log(`Halo Radius at y=130: ${haloR}`);
      console.log(`Vent Left halo bounds: [${ventLeft.anchorX - haloR}, ${ventLeft.anchorX + haloR}]`);
      console.log(`Vent Right halo bounds: [${ventRight.anchorX - haloR}, ${ventRight.anchorX + haloR}]`);

      // Test multiple starting points in the overlap zone
      const testXPositions = [286, 295, 300, 305, 314];
      const results: Record<number, { initialX: number; finalX: number; initialY: number; finalY: number; inUpdraft: boolean; isBallastActive: boolean }> = {};

      for (const startX of testXPositions) {
        player.position = { x: startX, y: 130 };
        player.isMovingLeft = false;
        player.isMovingRight = false;
        (player as any).isBallastActive = false;

        const dt = 0.05;
        // Simulate for 4 seconds (80 frames)
        for (let f = 0; f < 80; f++) {
          ventSystem.update(dt, createMockFlagshipContext(player));
          player.update(dt);
        }

        results[startX] = {
          initialX: startX,
          finalX: player.position.x,
          initialY: 130,
          finalY: player.position.y,
          inUpdraft: player.isInUpdraft,
          isBallastActive: player.isBallastActive,
        };
      }

      console.log('Passive Overlap Zone Simulation Results:');
      console.log(JSON.stringify(results, null, 2));

      // Check whether passive player descends or disperses outward
      for (const startX of testXPositions) {
        const res = results[startX];
        console.log(`At startX=${startX}: finalX=${res.finalX.toFixed(2)}, finalY=${res.finalY.toFixed(2)}`);
      }
    });

    test('VENT-OVERLAP-EMPIRICAL-02: Active steering escape from overlap zone [286, 314] at y=130', () => {
      const ventSystem = new HydrothermalVentManager(600, 800);
      const player = new Player(600, 800);

      // Start right at the confluence center x=300, y=130
      player.position = { x: 300, y: 130 };
      // Steer Left
      player.isMovingLeft = true;
      player.isMovingRight = false;

      const dt = 0.05;
      const trajectory: { x: number; y: number; inUpdraft: boolean; isBallastActive: boolean }[] = [];

      // Simulate 100 frames (5.0s)
      for (let f = 0; f < 100; f++) {
        ventSystem.update(dt, createMockFlagshipContext(player));
        player.update(dt);
        trajectory.push({
          x: player.position.x,
          y: player.position.y,
          inUpdraft: player.isInUpdraft,
          isBallastActive: player.isBallastActive,
        });
      }

      console.log(`Active Steer Left from x=300: finalX=${player.position.x}, finalY=${player.position.y}`);
      // With active steering, player should escape the vents and descend
      expect(player.position.x).toBeLessThan(100);
      expect(player.position.y).toBeGreaterThan(600);
    });

    test('VENT-OVERLAP-EMPIRICAL-03: Active steer Right from overlap zone [286, 314] at y=130', () => {
      const ventSystem = new HydrothermalVentManager(600, 800);
      const player = new Player(600, 800);

      // Start right at the confluence center x=300, y=130
      player.position = { x: 300, y: 130 };
      // Steer Right
      player.isMovingLeft = false;
      player.isMovingRight = true;

      const dt = 0.05;

      // Simulate 100 frames (5.0s)
      for (let f = 0; f < 100; f++) {
        ventSystem.update(dt, createMockFlagshipContext(player));
        player.update(dt);
      }

      console.log(`Active Steer Right from x=300: finalX=${player.position.x}, finalY=${player.position.y}`);
      // With active steering, player should escape the vents and descend
      expect(player.position.x).toBeGreaterThan(500);
      expect(player.position.y).toBeGreaterThan(600);
    });

    test('VENT-OVERLAP-EMPIRICAL-04: Extended 30s passive drift test across all 6 modular chassis hulls in overlap zone', () => {
      const ventSystem = new HydrothermalVentManager(600, 800);
      const modularChassis = new ModularChassisManager();
      const chassisList = [
        { id: 'DEFAULT', width: 50, height: 40 },
        { id: ChassisId.NAUTILUS, width: 64, height: 46 },
        { id: ChassisId.STINGRAY, width: 38, height: 30 },
        { id: ChassisId.KRAKEN, width: 50, height: 40 },
        { id: ChassisId.LEVIATHAN, width: 54, height: 42 },
        { id: ChassisId.GHOST, width: 46, height: 34 },
      ];

      const dt = 0.05; // 20 FPS
      const totalFrames = 600; // 30 seconds

      for (const chassis of chassisList) {
        const player = new Player(600, 800);
        if (chassis.id !== 'DEFAULT') {
          modularChassis.selectChassis(chassis.id as ChassisId);
          modularChassis.applyToPlayer(player);
        }

        // Center player in overlap zone at y=130
        player.position = { x: 300 - player.size.width / 2, y: 130 };
        player.isMovingLeft = false;
        player.isMovingRight = false;

        let descendedCount = 0;
        let minY = player.position.y;
        let maxY = player.position.y;

        for (let f = 0; f < totalFrames; f++) {
          ventSystem.update(dt, createMockFlagshipContext(player));
          player.update(dt);

          if (player.position.y < minY) minY = player.position.y;
          if (player.position.y > maxY) maxY = player.position.y;
          if (player.position.y > 135) descendedCount++;
        }

        console.log(`Chassis ${chassis.id} 30s Passive Overlap: finalX=${player.position.x.toFixed(1)}, finalY=${player.position.y.toFixed(1)}, minY=${minY.toFixed(1)}, maxY=${maxY.toFixed(1)}, descendedCount=${descendedCount}`);

        // EMPIRICAL OBSERVATION: Under passive conditions, NO chassis ever descends past ceiling!
        expect(player.position.y).toBeLessThan(140);
        expect(descendedCount).toBe(0);
      }
    });

    test('VENT-OVERLAP-EMPIRICAL-05: Velocity vector field map across canvas width x in [0, 600] at y=130', () => {
      const ventSystem = new HydrothermalVentManager(600, 800);
      const player = new Player(600, 800);
      const dt = 0.01; // 10ms instantaneous probe

      const xSampleStep = 20;
      const vectorField: { x: number; centerX: number; vx: number; lift: number; inHaloLeft: boolean; inHaloRight: boolean }[] = [];

      const ventLeft = ventSystem.vents[0] as HydrothermalVent;
      const ventRight = ventSystem.vents[1] as HydrothermalVent;

      // Force both vents to DORMANT for baseline vector field analysis
      ventLeft.state = VentState.DORMANT;
      ventRight.state = VentState.DORMANT;

      for (let x = 20; x <= 560; x += xSampleStep) {
        player.position = { x, y: 130 };
        const centerX = x + player.size.width / 2;
        const initialX = player.position.x;
        const initialY = player.position.y;

        const inHaloL = ventLeft.isInHalo(centerX, 150);
        const inHaloR = ventRight.isInHalo(centerX, 150);

        ventSystem.update(dt, createMockFlagshipContext(player));

        const vx = (player.position.x - initialX) / dt;
        const lift = (initialY - player.position.y) / dt;

        vectorField.push({
          x,
          centerX,
          vx,
          lift,
          inHaloLeft: inHaloL,
          inHaloRight: inHaloR,
        });
      }

      console.log('Instantaneous Lateral Velocity Vector Field at y=130:');
      for (const sample of vectorField) {
        const dirStr = sample.vx > 1 ? '--> (+x)' : sample.vx < -1 ? '<-- (-x)' : '--- (0)';
        console.log(`x=${sample.x} (center=${sample.centerX}): vx=${sample.vx.toFixed(1)} px/s ${dirStr} | LeftHalo=${sample.inHaloLeft}, RightHalo=${sample.inHaloRight}`);
      }

      // Verify convergent stagnation: for x in (180, 420), vx points toward center!
      const leftPlumeSample = vectorField.find((s) => s.centerX >= 200 && s.centerX <= 240);
      const rightPlumeSample = vectorField.find((s) => s.centerX >= 360 && s.centerX <= 400);

      expect(leftPlumeSample?.vx).toBeGreaterThan(0); // Pushes rightward
      expect(rightPlumeSample?.vx).toBeLessThan(0); // Pushes leftward
    });

    test('VENT-OVERLAP-EMPIRICAL-06: Active steering escape across all 6 modular chassis hulls from overlap zone', () => {
      const ventSystem = new HydrothermalVentManager(600, 800);
      const modularChassis = new ModularChassisManager();
      const chassisList = [
        { id: 'DEFAULT', expectedBaselineY: 740 },
        { id: ChassisId.NAUTILUS, expectedBaselineY: 734 },
        { id: ChassisId.STINGRAY, expectedBaselineY: 750 },
        { id: ChassisId.KRAKEN, expectedBaselineY: 740 },
        { id: ChassisId.LEVIATHAN, expectedBaselineY: 738 },
        { id: ChassisId.GHOST, expectedBaselineY: 746 },
      ];

      const dt = 0.05;

      for (const chassis of chassisList) {
        const player = new Player(600, 800);
        if (chassis.id !== 'DEFAULT') {
          modularChassis.selectChassis(chassis.id as ChassisId);
          modularChassis.applyToPlayer(player);
        }

        // Start in overlap zone at y=130
        player.position = { x: 300 - player.size.width / 2, y: 130 };
        player.isMovingLeft = true; // Actively steer left
        player.isMovingRight = false;

        for (let f = 0; f < 100; f++) {
          ventSystem.update(dt, createMockFlagshipContext(player));
          player.update(dt);
        }

        console.log(`Active Escape ${chassis.id}: finalX=${player.position.x.toFixed(1)}, finalY=${player.position.y.toFixed(1)}, expected=${chassis.expectedBaselineY}`);

        // With active steering, submarine clears left halo and settles to baseline depth
        expect(player.position.x).toBeLessThan(100);
        expect(player.position.y).toBeCloseTo(chassis.expectedBaselineY, 1);
      }
    });

  });

});

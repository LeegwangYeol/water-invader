import { test, expect } from '@playwright/test';
import { Player } from '../src/game/Player';
import { HydrothermalVentManager, HydrothermalVent } from '../src/game/flagship/environment/HydrothermalVent';
import { ChassisId, FlagshipUpdateContext, VentState } from '../src/game/flagship/types';
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

test.describe('Gate 2 Adversarial Verification: Overlap Zone Passive Drift Across 6 Hulls', () => {

  const chassisList = [
    { id: 'DEFAULT', name: 'Default Submersible', width: 50, height: 40, baselineY: 740 },
    { id: ChassisId.NAUTILUS, name: 'Nautilus Dreadnought', width: 64, height: 46, baselineY: 734 },
    { id: ChassisId.STINGRAY, name: 'Stingray Interceptor', width: 38, height: 30, baselineY: 750 },
    { id: ChassisId.KRAKEN, name: 'Kraken Bioship', width: 50, height: 40, baselineY: 740 },
    { id: ChassisId.LEVIATHAN, name: 'Leviathan Harvester', width: 54, height: 42, baselineY: 738 },
    { id: ChassisId.GHOST, name: 'Ghost Stealth Sub', width: 46, height: 34, baselineY: 746 },
  ];

  // ==========================================================================
  // SECTION 1: 6-HULL EMPIRICAL PASSIVE DRIFT AT (x=300, y=130)
  // ==========================================================================
  test.describe('1. 6-Hull Passive Drift Trajectory Analysis', () => {
    for (const chassis of chassisList) {
      test(`GATE2-CHASSIS: ${chassis.name} (${chassis.id}) baseline descent evaluation`, () => {
        const ventSystem = new HydrothermalVentManager(600, 800);
        const modularChassis = new ModularChassisManager();
        const player = new Player(600, 800);

        if (chassis.id !== 'DEFAULT') {
          modularChassis.selectChassis(chassis.id as ChassisId);
          modularChassis.applyToPlayer(player);
        }

        // Place submarine at center of overlap zone x=300, y=130
        player.position = { x: 300 - player.size.width / 2, y: 130 };
        player.isMovingLeft = false;
        player.isMovingRight = false;

        const dt = 0.05; // 20 FPS
        const totalFrames = 1200; // 60.0 seconds

        let maxY = player.position.y;
        let finalY = player.position.y;
        let reachedBaseline = false;

        for (let f = 1; f <= totalFrames; f++) {
          player.update(dt);
          ventSystem.update(dt, createMockFlagshipContext(player));

          if (player.position.y > maxY) maxY = player.position.y;
          if (player.position.y >= chassis.baselineY - 5) reachedBaseline = true;
          finalY = player.position.y;
        }

        const descentFraction = (finalY - 130) / (chassis.baselineY - 130);

        console.log(`[PASSIVE DRIFT] ${chassis.name}: startY=130, finalY=${finalY.toFixed(2)}, targetBaselineY=${chassis.baselineY}, maxY=${maxY.toFixed(2)}, descentFraction=${(descentFraction * 100).toFixed(2)}%`);

        // REMEDIATED ASSERTION: The submarine DOES reach baseline depth under passive drift
        expect(reachedBaseline).toBe(true);
        expect(finalY).toBeGreaterThan(chassis.baselineY - 10);
        expect(descentFraction).toBeGreaterThan(0.95);
      });
    }
  });

  // ==========================================================================
  // SECTION 2: SPATIAL GRID SAMPLING ACROSS OVERLAP ZONE [286, 314]
  // ==========================================================================
  test('GATE2-GRID: Spatial grid sampling across entire overlap zone [286, 314] at y=130', () => {
    const ventSystem = new HydrothermalVentManager(600, 800);
    const xGrid = [286, 290, 295, 300, 305, 310, 314];
    const dt = 0.05;
    const durationFrames = 600; // 30s

    const gridResults: { startX: number; finalX: number; finalY: number; maxY: number; reachedBaseline: boolean }[] = [];

    for (const startX of xGrid) {
      const player = new Player(600, 800);
      player.position = { x: startX - player.size.width / 2, y: 130 };
      player.isMovingLeft = false;
      player.isMovingRight = false;

      let maxY = player.position.y;
      for (let f = 0; f < durationFrames; f++) {
        player.update(dt);
        ventSystem.update(dt, createMockFlagshipContext(player));
        if (player.position.y > maxY) maxY = player.position.y;
      }

      gridResults.push({
        startX,
        finalX: Number(player.position.x.toFixed(2)),
        finalY: Number(player.position.y.toFixed(2)),
        maxY: Number(maxY.toFixed(2)),
        reachedBaseline: player.position.y >= 740 - 5,
      });
    }

    console.log('Spatial Grid Overlap Results:');
    console.table(gridResults);

    for (const res of gridResults) {
      expect(res.reachedBaseline).toBe(true);
      expect(res.finalY).toBeGreaterThan(740 - 10);
    }
  });

  // ==========================================================================
  // SECTION 3: LIMIT CYCLE EQUILIBRIUM AT liftRatio = 0.5 (y ~ 151-156)
  // ==========================================================================
  test('GATE2-MECHANICS: Empirical proof of limit cycle trap at liftRatio = 0.5', () => {
    const ventSystem = new HydrothermalVentManager(600, 800);
    const player = new Player(600, 800); // 50x40, center is y + 20

    // Start near the boundary where liftRatio = 0.5
    // capCeiling = 130, transitionZone = 90
    // liftRatio >= 0.5 when playerCenterY >= 130 + 45 = 175 => player.position.y >= 155
    player.position = { x: 275, y: 150 };
    player.isMovingLeft = false;
    player.isMovingRight = false;

    const dt = 0.05;
    let updraftToggledCount = 0;
    let prevUpdraft = false;

    const trajectory: { frame: number; y: number; isInUpdraft: boolean; liftRatio: number }[] = [];

    for (let f = 1; f <= 100; f++) {
      player.update(dt);
      ventSystem.update(dt, createMockFlagshipContext(player));

      const centerY = player.position.y + 20;
      const liftRatio = Math.min(1.0, Math.max(0, centerY - 130) / 90);

      if (player.isInUpdraft !== prevUpdraft) {
        updraftToggledCount++;
        prevUpdraft = player.isInUpdraft;
      }

      if (f <= 20) {
        trajectory.push({
          frame: f,
          y: Number(player.position.y.toFixed(2)),
          isInUpdraft: player.isInUpdraft,
          liftRatio: Number(liftRatio.toFixed(3)),
        });
      }
    }

    console.log('Limit cycle oscillation trajectory (first 20 frames):');
    console.table(trajectory);
    console.log(`Updraft state toggled ${updraftToggledCount} times in 100 frames!`);

    // Updraft state toggled during plume cap transit, but ambient surface drift breaks the ceiling trap
    expect(updraftToggledCount).toBeGreaterThan(5);
    expect(player.position.y).toBeGreaterThan(200);
  });

  // ==========================================================================
  // SECTION 4: ACTIVE STEERING ESCAPE VALIDATION (CONTRAST WITH PASSIVE DRIFT)
  // ==========================================================================
  test('GATE2-ACTIVE-CONTRAST: Active steering escapes overlap zone and reaches 100% baseline depth', () => {
    const ventSystem = new HydrothermalVentManager(600, 800);
    const player = new Player(600, 800);

    player.position = { x: 275, y: 130 };
    player.isMovingLeft = true; // Actively steering left
    player.isMovingRight = false;

    const dt = 0.05;
    for (let f = 0; f < 200; f++) {
      player.update(dt);
      ventSystem.update(dt, createMockFlagshipContext(player));
    }

    console.log(`Active Steering Left result: finalX=${player.position.x.toFixed(2)}, finalY=${player.position.y.toFixed(2)}`);
    // Active steering completely escapes the vent halos and reaches baseline depth 740
    expect(player.position.x).toBe(0); // Screen edge
    expect(player.position.y).toBe(740); // 100% baseline depth restored!
  });
});

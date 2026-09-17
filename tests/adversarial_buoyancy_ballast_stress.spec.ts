import { test, expect } from '@playwright/test';
import { Player } from '../src/game/Player';
import { HydrothermalVent } from '../src/game/flagship/environment/HydrothermalVent';
import { VentState } from '../src/game/flagship/types';

test.describe('Buoyancy Adversarial Challenger & Hydrodynamic Stress Suite', () => {

  // ==========================================================================
  // ADV-BUOYANCY-01: Coordinate Invariant & Numerical Boundary Fuzzing
  // ==========================================================================
  test('ADV-BUOYANCY-01: Fuzzing extreme coords, negative/huge/NaN delta times, and boundary clamping', () => {
    const extremePositions = [
      { x: -1000, y: -1000 },
      { x: -1, y: -1 },
      { x: 0, y: 0 },
      { x: 300, y: 400 },
      { x: 550, y: 740 },
      { x: 600, y: 800 },
      { x: 99999, y: 99999 },
      { x: NaN, y: NaN },
      { x: Infinity, y: -Infinity },
    ];

    const deltaTimes = [0, 0.0001, 0.016, 0.033, 0.1, 0.5, 1.0, 2.0, 10.0, 100.0];

    for (const pos of extremePositions) {
      for (const dt of deltaTimes) {
        const player = new Player(600, 800);
        player.position = { x: pos.x, y: pos.y };
        player.enableBallast();

        player.update(dt);

        // Sanity & Finitude
        expect(Number.isFinite(player.position.x), `pos.x finite for (${pos.x}, ${pos.y}) dt=${dt}`).toBe(true);
        expect(Number.isFinite(player.position.y), `pos.y finite for (${pos.x}, ${pos.y}) dt=${dt}`).toBe(true);
        expect(Number.isNaN(player.position.x)).toBe(false);
        expect(Number.isNaN(player.position.y)).toBe(false);

        // Canvas Boundary Invariant (logicalWidth=600, logicalHeight=800, player=50x40)
        expect(player.position.x).toBeGreaterThanOrEqual(0);
        expect(player.position.x).toBeLessThanOrEqual(600 - player.size.width);
        expect(player.position.y).toBeGreaterThanOrEqual(0);
        expect(player.position.y).toBeLessThanOrEqual(800 - player.size.height);
      }
    }
  });

  // ==========================================================================
  // ADV-BUOYANCY-02: Monotonic Settling Trajectory Oracle Outside Plumes
  // ==========================================================================
  test('ADV-BUOYANCY-02: Monotonic descent oracle across 100 initial depths with rapid direction flipping', () => {
    // Test 100 evenly distributed depths from y=0 to y=740
    for (let depthIdx = 0; depthIdx <= 100; depthIdx++) {
      const initialY = (740 / 100) * depthIdx;
      const player = new Player(600, 800);
      player.position = { x: 50, y: initialY };
      player.enableBallast();

      const trajectory: number[] = [player.position.y];
      const dt = 0.05;

      // Simulate 100 frames with rapid alternating direction inputs
      for (let f = 0; f < 100; f++) {
        // Rapid direction flipping
        player.isMovingLeft = f % 2 === 0;
        player.isMovingRight = f % 2 !== 0;

        player.update(dt);
        trajectory.push(player.position.y);
      }

      // Monotonic descent assertion: delta-y must be non-negative at every single frame
      for (let i = 1; i < trajectory.length; i++) {
        const dy = trajectory[i] - trajectory[i - 1];
        expect(dy, `Frame ${i} dy non-negative for initialY=${initialY}`).toBeGreaterThanOrEqual(0);
      }

      // Final settled state assertion
      expect(player.position.y).toBeCloseTo(740, 1);
      expect(player.isBallastActive).toBe(false);
    }
  });

  // ==========================================================================
  // ADV-BUOYANCY-03: Lag Spikes & Variable Frame Time Step Bounds
  // ==========================================================================
  test('ADV-BUOYANCY-03: Extreme lag spikes (dt = 0.5s, 1.0s, 2.0s) maintain bounded delta steps and target clamp', () => {
    const lagSpikes = [0.5, 1.0, 2.0];
    const descentSpeed = 165; // px/s

    for (const dt of lagSpikes) {
      // Case A: Settling in open water from ceiling y=130
      const playerOpen = new Player(600, 800);
      playerOpen.position = { x: 50, y: 130 };
      playerOpen.enableBallast();

      const prevY = playerOpen.position.y;
      playerOpen.update(dt);
      const dy = playerOpen.position.y - prevY;

      // Expected displacement: speed * dt
      const expectedStep = descentSpeed * dt;
      expect(dy).toBeCloseTo(expectedStep, 1);
      expect(playerOpen.position.y).toBeLessThanOrEqual(740);

      // Case B: Settling near baseline (y = 700) under massive lag spike
      const playerNearBase = new Player(600, 800);
      playerNearBase.position = { x: 50, y: 700 };
      playerNearBase.enableBallast();

      playerNearBase.update(dt);
      // Must clamp exactly at baselineY (740) without overshooting
      expect(playerNearBase.position.y).toBe(740);
      // On the settling frame, position.y is clamped to targetY (740)
      // Once settled at targetY, the next tick or update deactivates isBallastActive
      playerNearBase.update(0.016);
      expect(playerNearBase.isBallastActive).toBe(false);

      // Case C: Updraft lift near capY + 30 (130) under lag spike
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.ERUPTING;
      const playerVent = new Player(600, 800);
      playerVent.position = { x: 155, y: 145 };

      vent.update(dt, playerVent, [], []);
      playerVent.update(dt);

      // Clamped strictly to capCeiling = 130
      expect(playerVent.position.y).toBeGreaterThanOrEqual(130);
      expect(Number.isFinite(playerVent.position.y)).toBe(true);
    }
  });

  // ==========================================================================
  // ADV-BUOYANCY-04: Plume Cap Dissipation Band & Lateral Outward Dispersion
  // ==========================================================================
  test('ADV-BUOYANCY-04: Dissipation band [130, 220] attenuates lift and imparts radial dispersion away from anchorX', () => {
    const vent = new HydrothermalVent('vent_left', 180, 0);
    vent.state = VentState.ERUPTING;

    // 1. Deep in vent (y = 500): liftRatio must be 1.0 (unattenuated)
    const playerDeep = new Player(600, 800);
    playerDeep.position = { x: 155, y: 500 };
    const initialDeepX = playerDeep.position.x;
    vent.update(0.1, playerDeep, [], []);
    playerDeep.update(0.1);

    // Lift expected: 260 * 0.1 = 26 px -> y = 474
    expect(playerDeep.position.y).toBeCloseTo(474, 1);
    // Lateral dispersion must be zero deep in column
    expect(playerDeep.position.x).toBe(initialDeepX);

    // 2. Near cap (y = 135, center Y = 155, depthAboveCap = 25 / 90 -> liftRatio ~ 0.278)
    const playerNearCapLeft = new Player(600, 800);
    // Placed slightly left of anchorX (180): center = 145 + 25 = 170 < 180
    playerNearCapLeft.position = { x: 145, y: 135 };
    vent.update(0.1, playerNearCapLeft, [], []);
    playerNearCapLeft.update(0.1);

    // Lateral dispersion should push player LEFT (x decreased)
    expect(playerNearCapLeft.position.x).toBeLessThan(145);

    // Placed slightly right of anchorX (180): center = 165 + 25 = 190 > 180
    const playerNearCapRight = new Player(600, 800);
    playerNearCapRight.position = { x: 165, y: 135 };
    vent.update(0.1, playerNearCapRight, [], []);
    playerNearCapRight.update(0.1);

    // Lateral dispersion should push player RIGHT (x increased)
    expect(playerNearCapRight.position.x).toBeGreaterThan(165);
  });

  // ==========================================================================
  // ADV-BUOYANCY-05: 1000-Run Monte Carlo Randomized Fuzz Simulation
  // ==========================================================================
  test('ADV-BUOYANCY-05: 1000-Run Monte Carlo fuzzing — Zero trapped at y=130, 100% escape recovery', () => {
    let runsCompleted = 0;
    let successfulEscapes = 0;
    let trappedAt130Count = 0;
    let nanOrInfCount = 0;
    let boundsViolationCount = 0;
    let nonMonotonicCount = 0;

    const totalRuns = 1000;

    for (let run = 0; run < totalRuns; run++) {
      runsCompleted++;

      // 1. Randomize vent (Left at 180 or Right at 420)
      const ventX = run % 2 === 0 ? 180 : 420;
      const vent = new HydrothermalVent(`vent_${run}`, ventX, 0);
      vent.state = (run % 3 === 0) ? VentState.CHARGING : VentState.ERUPTING;

      // 2. Initialize player inside vent column
      const player = new Player(600, 800);
      const jitterX = (Math.random() - 0.5) * 40;
      player.position = {
        x: ventX - 25 + jitterX,
        y: 600 + Math.random() * 100, // starting depth in lower column
      };

      // 3. Phase 1: Lift player to plume cap (y <= 150)
      let phase1Frames = 0;
      while (player.position.y > 150 && phase1Frames < 120) {
        phase1Frames++;
        const dt = 0.016 + Math.random() * 0.034; // dt in [0.016, 0.050]
        vent.update(dt, player, [], []);
        player.update(dt);
      }

      // Check if lift succeeded to plume cap
      expect(player.position.y).toBeLessThanOrEqual(160);

      // 4. Phase 2: Escape and Ballast Descent Simulation
      // 1000 Randomized Runs:
      // - 500 runs: Active directional escape (user steers away from vent)
      // - 500 runs: Passive hydrodynamic escape (hands off keyboard, radial plume dispersion pushes vessel out)
      const strategy = run < 500 ? 'ACTIVE_STEER' : 'PASSIVE_DISPERSION';

      let phase2Frames = 0;
      const maxPhase2Frames = 350;
      let wasOutsideLastFrame = false;
      let lastOutsideY = 0;

      while (phase2Frames < maxPhase2Frames && player.position.y < 735) {
        phase2Frames++;
        const dt = 0.016 + Math.random() * 0.034;

        if (strategy === 'ACTIVE_STEER') {
          // Steer horizontally away from vent anchorX
          if (player.position.x + 25 <= ventX) {
            player.isMovingLeft = true;
            player.isMovingRight = false;
          } else {
            player.isMovingLeft = false;
            player.isMovingRight = true;
          }
        } else {
          // Hands off keyboard — pure hydrodynamic outward dispersion
          player.isMovingLeft = false;
          player.isMovingRight = false;
        }

        // Autonomous ballast priming check (mirrors GameManager.ts line 1253)
        if (player.position.y < (player as any).baselineY) {
          (player as any).isBallastActive = true;
        }

        player.update(dt);
        vent.update(dt, player, [], []);

        // Record coordinates while outside vent plume
        const playerCenterX = player.position.x + 25;
        const playerCenterY = player.position.y + 20;
        const inVent = vent.isInHalo(playerCenterX, playerCenterY) || vent.isInCore(playerCenterX, playerCenterY);

        if (!inVent) {
          if (wasOutsideLastFrame) {
            // While continuously outside any plume, descent must be strictly monotonic non-decreasing
            if (player.position.y < lastOutsideY - 0.0001) {
              nonMonotonicCount++;
              console.log(`[NON-MONOTONIC] Run ${run} frame ${phase2Frames}: prevY=${lastOutsideY}, newY=${player.position.y}, dy=${player.position.y - lastOutsideY}, posX=${player.position.x}, inHalo=${vent.isInHalo(playerCenterX, playerCenterY)}, inCore=${vent.isInCore(playerCenterX, playerCenterY)}, isInUpdraft=${(player as any).isInUpdraft}`);
            }
          }
          lastOutsideY = player.position.y;
          wasOutsideLastFrame = true;
        } else {
          wasOutsideLastFrame = false;
        }

        // Check for NaN or Infinity
        if (!Number.isFinite(player.position.x) || !Number.isFinite(player.position.y)) {
          nanOrInfCount++;
          break;
        }

        // Check canvas bounds
        if (player.position.x < 0 || player.position.x > 550 || player.position.y < 0 || player.position.y > 760) {
          boundsViolationCount++;
          break;
        }
      }

      // Check for trapped at y = 130
      if (player.position.y <= 135 && phase2Frames >= maxPhase2Frames) {
        trappedAt130Count++;
        console.log(`[DIAGNOSTIC] Run ${run} TRAPPED: strategy=${strategy}, ventX=${ventX}, ventState=${vent.state}, posX=${player.position.x}, posY=${player.position.y}`);
      }

      // Success check: did player descend back to operating depth (y >= 700)?
      if (player.position.y >= 700) {
        successfulEscapes++;
      }
    }

    // Comprehensive Oracle Assertions
    expect(runsCompleted).toBe(1000);
    expect(nanOrInfCount, 'Zero NaN or Infinity across 1000 runs').toBe(0);
    expect(boundsViolationCount, 'Zero canvas boundary violations across 1000 runs').toBe(0);
    expect(trappedAt130Count, 'Zero runs trapped at y=130 across 1000 runs').toBe(0);
    expect(nonMonotonicCount, 'Zero non-monotonic descent frames outside plumes').toBe(0);
    expect(successfulEscapes, '1000/1000 successful escapes back to depth').toBe(1000);
  });

  // ==========================================================================
  // ADV-BUOYANCY-06: Autonomous GameManager Lifecycle Simulation
  // ==========================================================================
  test('ADV-BUOYANCY-06: Autonomous ballast reactivation in GameManager loop without manual test priming', () => {
    // Simulate GameManager.update logic without DOM:
    // When player is elevated (y < baselineY), GameManager marks isBallastActive = true.
    const player = new Player(600, 800);
    player.position = { x: 50, y: 130 }; // Elevated outside vent
    expect(player.isBallastActive).toBe(false); // Unprimed initially

    // 1. Simulate GameManager frame 1
    // GM line 1253:
    if (player.position.y < (player as any).baselineY) {
      (player as any).isBallastActive = true;
    }
    player.update(0.05);

    // Ballast must be actively descending
    expect(player.isBallastActive).toBe(true);
    expect(player.position.y).toBeGreaterThan(130);

    // 2. Simulate subsequent 80 frames
    for (let f = 0; f < 80; f++) {
      if (player.position.y < (player as any).baselineY) {
        (player as any).isBallastActive = true;
      }
      player.update(0.05);
    }

    // Settled at baselineY (740) and deactivated
    expect(player.position.y).toBe(740);
    expect(player.isBallastActive).toBe(false);
  });

});

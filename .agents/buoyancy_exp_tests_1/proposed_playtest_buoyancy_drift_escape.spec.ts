import { test, expect } from '@playwright/test';
import { HydrothermalVent } from '../src/game/flagship/environment/HydrothermalVent';
import { VentState } from '../src/game/flagship/types';
import { Player } from '../src/game/Player';

test.describe('Buoyancy Drift Escape & Ballast Restoration Playtest Suite', () => {

  // ==========================================================================
  // 1. UNIT & PHYSICS SIMULATION TESTS (Headless, Deterministic, Millisecond)
  // ==========================================================================
  test.describe('1. Direct Hydrodynamic Physics & Simulation Oracles', () => {

    test('BUOYANCY-01: Direct vent updraft lifts player vessel from baseline depth (y=740) upward to plume cap (y < 200)', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.ERUPTING; // 260 px/s lift

      const player = new Player(600, 800);
      // Center player at x=180 (player width=50 -> x = 180 - 25 = 155)
      player.position = { x: 155, y: 740 };

      // Verify initial containment
      expect(vent.isInCore(180, 760)).toBe(true);
      expect(player.position.y).toBe(740);

      // Run 50 frames (dt = 0.05s -> total 2.5s)
      const yPositions: number[] = [player.position.y];
      for (let f = 0; f < 50; f++) {
        vent.update(0.05, player, [], []);
        player.update(0.05);
        yPositions.push(player.position.y);
      }

      // Assert monotonic upward lift (y coordinate strictly decreasing)
      for (let i = 1; i < yPositions.length; i++) {
        expect(yPositions[i]).toBeLessThanOrEqual(yPositions[i - 1]);
      }

      // Assert player has reached plume cap region (y < 200, clamped at capY + 30 = 130)
      expect(player.position.y).toBeLessThan(200);
      expect(player.position.y).toBeGreaterThanOrEqual(vent.capY + 30);
      expect(Number.isFinite(player.position.y)).toBe(true);
    });

    test('BUOYANCY-02: Ballast restoration smoothly descends player submarine from ceiling (y=130) back to baseline depth (y > 700) when outside vent plume', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      const player = new Player(600, 800);

      // Position player at ceiling y=130, far to the left (x=20) completely outside plume
      player.position = { x: 20, y: 130 };
      expect(vent.isInHalo(20 + 25, 130 + 20)).toBe(false);
      expect(vent.isInCore(20 + 25, 130 + 20)).toBe(false);

      const dt = 0.05;
      const trajectory: number[] = [player.position.y];

      // Simulate 80 frames (4.0 seconds) outside vent
      for (let f = 0; f < 80; f++) {
        player.update(dt);
        trajectory.push(player.position.y);
      }

      // Assert monotonic downward descent (y coordinate non-decreasing)
      for (let i = 1; i < trajectory.length; i++) {
        const dy = trajectory[i] - trajectory[i - 1];
        expect(dy).toBeGreaterThanOrEqual(0); // Never pops upward
        // Anti-teleportation assertion: single frame delta must not exceed 25px (dt=0.05s @ 500px/s max)
        expect(dy).toBeLessThanOrEqual(25);
      }

      // Assert player has smoothly returned to baseline operating depth (y >= 735, target 740)
      expect(player.position.y).toBeGreaterThan(700);
      expect(player.position.y).toBeLessThanOrEqual(740);
    });

    test('BUOYANCY-03: Combined simulation — player caught in vent updraft, steers horizontally out of plume (ArrowLeft), and returns to seabed operating depth', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.ERUPTING;

      const player = new Player(600, 800);
      player.position = { x: 155, y: 740 };

      const dt = 0.05;

      // Phase 1: Lift to plume cap (y < 200)
      for (let f = 0; f < 50; f++) {
        vent.update(dt, player, [], []);
        player.update(dt);
      }
      expect(player.position.y).toBeLessThan(200);

      // Phase 2: Steer left out of plume
      player.isMovingLeft = true;
      const escapeTrajectory: { x: number; y: number }[] = [];

      for (let f = 0; f < 80; f++) {
        // Player update moves horizontally (and applies ballast if active)
        player.update(dt);
        // Vent update applies lift if still inside halo/core
        vent.update(dt, player, [], []);
        escapeTrajectory.push({ x: player.position.x, y: player.position.y });
      }

      // Verify player reached the left boundary region
      expect(player.position.x).toBeLessThan(50);

      // Verify player smoothly returned to baseline operating depth
      expect(player.position.y).toBeGreaterThan(700);

      // Verify anti-teleportation: no frame-to-frame jump exceeds 30px
      for (let i = 1; i < escapeTrajectory.length; i++) {
        const dy = Math.abs(escapeTrajectory[i].y - escapeTrajectory[i - 1].y);
        expect(dy).toBeLessThan(30);
      }
    });

    test('BUOYANCY-04: Variable delta-time resilience & boundary clamping invariants (0 <= y <= 740)', () => {
      const player = new Player(600, 800);
      player.position = { x: 20, y: 150 };

      // Sequence of erratic dt values simulating frame drops / lag spikes
      const erraticDts = [0.016, 0.25, 0.033, 0.5, 0.1, 0.016, 0.4];

      for (const dt of erraticDts) {
        player.update(dt);
        expect(Number.isFinite(player.position.y)).toBe(true);
        expect(Number.isNaN(player.position.y)).toBe(false);
        expect(player.position.y).toBeGreaterThanOrEqual(0);
        expect(player.position.y).toBeLessThanOrEqual(740);
      }

      // After long settling time, player must be stabilized exactly at baseline depth (740)
      for (let i = 0; i < 20; i++) {
        player.update(0.2);
      }
      expect(player.position.y).toBeCloseTo(740, 1);
    });

  });

  // ==========================================================================
  // 2. LIVE BROWSER E2E PLAYTEST HARNESS (Playwright + Canvas + GameManager)
  // ==========================================================================
  test.describe('2. Live Browser E2E Buoyancy & Keyboard Escape Playtest', () => {

    test('BUOYANCY-E2E-01: Live browser playtest — Player lifted by hydrothermal vent, steers left via keyboard, and descends smoothly to baseline depth', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        consoleErrors.push(`[PageError] ${err.message}`);
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Click START GAME
      const startBtn = page.locator('button', { hasText: 'START GAME' });
      await expect(startBtn).toBeVisible({ timeout: 10000 });
      await startBtn.click();

      // Wait for gameManager and flagshipManager to be mounted and ready
      await page.waitForFunction(() => {
        const gm = (window as any).gameManager;
        const fm = (window as any).flagshipManager;
        return gm && fm && gm.player && gm.state === 'PLAYING';
      }, { timeout: 10000 });

      // Step 1: Environment Isolation & Setup
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const fm = (window as any).flagshipManager;

        gm.isGodMode = true; // Prevent incidental death during physics testing
        gm.enemies = []; // Clear active hostiles
        gm.bullets = []; // Clear active bullets

        // Position player centered over Vent Left (anchorX=180, width=50 -> x = 180 - 25 = 155)
        gm.player.position.x = 155;
        gm.player.position.y = 740;

        // Force vent to ERUPTING for fast, deterministic lift
        const ventLeft = fm.hydrothermalVents.vents[0];
        ventLeft.state = 'ERUPTING';
      });

      // Step 2: Wait for convective updraft to lift player to plume cap (y < 200)
      await page.waitForFunction(() => {
        const gm = (window as any).gameManager;
        return gm.player.position.y < 200;
      }, { timeout: 8000 });

      const liftedY = await page.evaluate(() => (window as any).gameManager.player.position.y);
      expect(liftedY).toBeLessThan(200);
      expect(liftedY).toBeGreaterThanOrEqual(130);

      // Step 3: Simulate player steering left using ArrowLeft key
      await page.keyboard.down('ArrowLeft');

      // Wait until player moves outside the plume halo (x < 50)
      await page.waitForFunction(() => {
        const gm = (window as any).gameManager;
        return gm.player.position.x < 50;
      }, { timeout: 5000 });

      await page.keyboard.up('ArrowLeft');

      // Step 4: Sample descent trajectory over time
      const trajectory: { time: number; y: number }[] = [];
      const startTime = Date.now();

      while (Date.now() - startTime < 4500) {
        const y = await page.evaluate(() => (window as any).gameManager.player.position.y);
        trajectory.push({ time: Date.now() - startTime, y });
        if (y >= 730) break;
        await page.waitForTimeout(100);
      }

      // Step 5: Assert player successfully descended back to baseline operating depth
      const finalY = await page.evaluate(() => (window as any).gameManager.player.position.y);
      expect(finalY).toBeGreaterThan(700);

      // Step 6: Anti-teleportation assertion across sampled frames
      for (let i = 1; i < trajectory.length; i++) {
        const dy = trajectory[i].y - trajectory[i - 1].y;
        // Should descend smoothly (positive dy) without massive single-frame teleportation
        expect(dy).toBeGreaterThanOrEqual(-5); // Negligible jitter allowance
        expect(Math.abs(dy)).toBeLessThan(80); // Bounded per 100ms sample
      }

      // Step 7: Clean console verification
      const criticalErrors = consoleErrors.filter(
        (e) => !e.includes('favicon') && !e.includes('turbopack')
      );
      expect(criticalErrors).toHaveLength(0);
    });

  });

});

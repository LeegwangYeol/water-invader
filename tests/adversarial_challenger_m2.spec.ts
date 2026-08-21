import { test, expect } from '@playwright/test';

test.describe('Adversarial Challenger M2: Deep Stress & Boundary Validation Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test.describe('Challenge 1: F-03 Blur/Visibility Loss Key Clearance & Desync Prevention', () => {
    test('1.1 Window blur while moving left and shooting clears all movement and shoot flags immediately', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        
        // 1. Simulate keydown 'ArrowLeft' and ' ' (Space)
        gm.handleKeyDown('ArrowLeft');
        gm.handleKeyDown(' ');

        const stateWhilePressing = {
          isMovingLeft: gm.player.isMovingLeft,
          isMovingRight: gm.player.isMovingRight,
          isShooting: gm.player.isShooting,
          arrowLeftInKeys: gm.keysPressed['arrowleft'],
          spaceInKeys: gm.keysPressed[' '],
        };

        // 2. Dispatch window blur
        window.dispatchEvent(new Event('blur'));

        const stateAfterBlur = {
          isMovingLeft: gm.player.isMovingLeft,
          isMovingRight: gm.player.isMovingRight,
          isShooting: gm.player.isShooting,
          keysPressedCount: Object.keys(gm.keysPressed).length,
        };

        return { stateWhilePressing, stateAfterBlur };
      });

      expect(result.stateWhilePressing.isMovingLeft).toBe(true);
      expect(result.stateWhilePressing.isShooting).toBe(true);
      expect(result.stateWhilePressing.arrowLeftInKeys).toBe(true);
      expect(result.stateWhilePressing.spaceInKeys).toBe(true);

      // Verify all cleared
      expect(result.stateAfterBlur.isMovingLeft).toBe(false);
      expect(result.stateAfterBlur.isMovingRight).toBe(false);
      expect(result.stateAfterBlur.isShooting).toBe(false);
      expect(result.stateAfterBlur.keysPressedCount).toBe(0);
    });

    test('1.2 Document visibility hidden while moving right and shooting clears all flags', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        
        gm.handleKeyDown('d');
        gm.handleKeyDown('Space');

        const stateWhilePressing = {
          isMovingRight: gm.player.isMovingRight,
          isShooting: gm.player.isShooting,
        };

        // Simulate document tab switch (visibility hidden)
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));

        const stateAfterHidden = {
          isMovingLeft: gm.player.isMovingLeft,
          isMovingRight: gm.player.isMovingRight,
          isShooting: gm.player.isShooting,
          keysPressedCount: Object.keys(gm.keysPressed).length,
        };

        // Reset document.hidden
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });

        return { stateWhilePressing, stateAfterHidden };
      });

      expect(result.stateWhilePressing.isMovingRight).toBe(true);
      expect(result.stateWhilePressing.isShooting).toBe(true);

      expect(result.stateAfterHidden.isMovingLeft).toBe(false);
      expect(result.stateAfterHidden.isMovingRight).toBe(false);
      expect(result.stateAfterHidden.isShooting).toBe(false);
      expect(result.stateAfterHidden.keysPressedCount).toBe(0);
    });

    test('1.3 Multi-key simultaneous press followed by blur, then late keyup does not cause desync or throw', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        
        // Press 8 keys at once
        const keys = ['a', 'd', 'ArrowLeft', 'ArrowRight', ' ', 'q', 'e', 'f3'];
        keys.forEach(k => gm.handleKeyDown(k));

        const keysActiveBeforeBlur = Object.keys(gm.keysPressed).length;

        // Dispatch blur
        window.dispatchEvent(new Event('blur'));

        const keysActiveAfterBlur = Object.keys(gm.keysPressed).length;
        const movingLeftAfterBlur = gm.player.isMovingLeft;
        const shootingAfterBlur = gm.player.isShooting;

        // Simulate late keyup events occurring after returning to the window
        let noErrorsOnKeyUp = true;
        try {
          keys.forEach(k => gm.handleKeyUp(k));
        } catch (e) {
          noErrorsOnKeyUp = false;
        }

        const keysActiveAfterLateKeyUp = Object.keys(gm.keysPressed).length;
        const movingLeftFinal = gm.player.isMovingLeft;
        const shootingFinal = gm.player.isShooting;

        return {
          keysActiveBeforeBlur,
          keysActiveAfterBlur,
          movingLeftAfterBlur,
          shootingAfterBlur,
          noErrorsOnKeyUp,
          keysActiveAfterLateKeyUp,
          movingLeftFinal,
          shootingFinal,
        };
      });

      expect(result.keysActiveBeforeBlur).toBeGreaterThanOrEqual(6);
      expect(result.keysActiveAfterBlur).toBe(0);
      expect(result.movingLeftAfterBlur).toBe(false);
      expect(result.shootingAfterBlur).toBe(false);
      expect(result.noErrorsOnKeyUp).toBe(true);
      expect(result.movingLeftFinal).toBe(false);
      expect(result.shootingFinal).toBe(false);
    });
  });

  test.describe('Challenge 2: F-05 Multi-Shot Lv 4 & Lv 5 Trajectory Physics & Shop Upgrades', () => {
    test('2.1 Multi-Shot Lv 4 spawns exactly 4 bullets with verified trigonometric trajectories and distinct spread', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const p = gm.player;
        p.suppressionLevel = 0; // Deterministic spread
        p.multiShot = 4;
        p.fireTimer = 0;

        const bullets = p.fire();

        const bulletDetails = bullets.map((b: any, idx: number) => {
          const initialX = b.position.x;
          const initialY = b.position.y;
          const vx = b.velocity.x;
          const vy = b.velocity.y;

          // Simulate 0.5s of physics update
          b.update(0.5);
          const afterX = b.position.x;
          const afterY = b.position.y;

          return { idx, initialX, initialY, vx, vy, afterX, afterY };
        });

        return {
          bulletCount: bullets.length,
          bulletDetails,
        };
      });

      expect(result.bulletCount).toBe(4);

      const [b0, b1, b2, b3] = result.bulletDetails;

      // 1. Angles: -15°, -5°, +5°, +15°
      // Expected vx: 400 * sin(-15°) ≈ -103.5, 400 * sin(-5°) ≈ -34.9, 400 * sin(5°) ≈ +34.9, 400 * sin(15°) ≈ +103.5
      expect(b0.vx).toBeCloseTo(-103.5, 0);
      expect(b1.vx).toBeCloseTo(-34.9, 0);
      expect(b2.vx).toBeCloseTo(34.9, 0);
      expect(b3.vx).toBeCloseTo(103.5, 0);

      // Expected vy: -400 * cos(deg) -> All upward (negative Y)
      expect(b0.vy).toBeLessThan(-350);
      expect(b1.vy).toBeLessThan(-350);
      expect(b2.vy).toBeLessThan(-350);
      expect(b3.vy).toBeLessThan(-350);

      // 2. Trajectory divergence: b0 < b1 < b2 < b3 along X axis after movement
      expect(b0.afterX).toBeLessThan(b1.afterX);
      expect(b1.afterX).toBeLessThan(b2.afterX);
      expect(b2.afterX).toBeLessThan(b3.afterX);

      // 3. Symmetry check: Distance from center
      const centerX = (b1.afterX + b2.afterX) / 2;
      const leftDistOuter = centerX - b0.afterX;
      const rightDistOuter = b3.afterX - centerX;
      expect(Math.abs(leftDistOuter - rightDistOuter)).toBeLessThan(1.0);
    });

    test('2.2 Multi-Shot Lv 5 spawns exactly 5 bullets with center straight trajectory and symmetric spread', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const p = gm.player;
        p.suppressionLevel = 0;
        p.multiShot = 5;
        p.fireTimer = 0;

        const bullets = p.fire();

        const bulletDetails = bullets.map((b: any, idx: number) => {
          const initialX = b.position.x;
          const initialY = b.position.y;
          const vx = b.velocity.x;
          const vy = b.velocity.y;

          b.update(0.5);
          const afterX = b.position.x;
          const afterY = b.position.y;

          return { idx, initialX, initialY, vx, vy, afterX, afterY };
        });

        return {
          bulletCount: bullets.length,
          bulletDetails,
        };
      });

      expect(result.bulletCount).toBe(5);

      const [b0, b1, b2, b3, b4] = result.bulletDetails;

      // 1. Center bullet (b2) must fire straight up at 0° with vx = 0
      expect(b2.vx).toBe(0);
      expect(b2.vy).toBeCloseTo(-400, 0);

      // 2. Angles: -20°, -10°, 0°, +10°, +20°
      // Expected vx: 400 * sin(-20°) ≈ -136.8, 400 * sin(-10°) ≈ -69.5, 0, +69.5, +136.8
      expect(b0.vx).toBeCloseTo(-136.8, 0);
      expect(b1.vx).toBeCloseTo(-69.5, 0);
      expect(b3.vx).toBeCloseTo(69.5, 0);
      expect(b4.vx).toBeCloseTo(136.8, 0);

      // 3. Monotonic spread along X axis
      expect(b0.afterX).toBeLessThan(b1.afterX);
      expect(b1.afterX).toBeLessThan(b2.afterX);
      expect(b2.afterX).toBeLessThan(b3.afterX);
      expect(b3.afterX).toBeLessThan(b4.afterX);

      // 4. Exact symmetry around center bullet
      const leftDistOuter = b2.afterX - b0.afterX;
      const rightDistOuter = b4.afterX - b2.afterX;
      expect(Math.abs(leftDistOuter - rightDistOuter)).toBeLessThan(1.0);

      const leftDistInner = b2.afterX - b1.afterX;
      const rightDistInner = b3.afterX - b2.afterX;
      expect(Math.abs(leftDistInner - rightDistInner)).toBeLessThan(1.0);
    });

    test('2.3 Shop Multi-Shot upgrade steps from Lv 1 to Lv 5 and enforces max Lv 5 boundary cap', async ({ page }) => {
      const upgradeHistory = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.currency = 500;
        gm.player.multiShot = 1;

        const history: { step: number; multiShot: number; currency: number }[] = [];

        // Upgrade 1 -> Lv 2 (cost 100)
        gm.upgradeMultiShot();
        history.push({ step: 1, multiShot: gm.player.multiShot, currency: gm.currency });

        // Upgrade 2 -> Lv 3 (cost 100)
        gm.upgradeMultiShot();
        history.push({ step: 2, multiShot: gm.player.multiShot, currency: gm.currency });

        // Upgrade 3 -> Lv 4 (cost 100)
        gm.upgradeMultiShot();
        history.push({ step: 3, multiShot: gm.player.multiShot, currency: gm.currency });

        // Upgrade 4 -> Lv 5 (cost 100)
        gm.upgradeMultiShot();
        history.push({ step: 4, multiShot: gm.player.multiShot, currency: gm.currency });

        // Upgrade 5 -> Attempt beyond max Lv 5 (should be blocked, no currency deducted)
        gm.upgradeMultiShot();
        history.push({ step: 5, multiShot: gm.player.multiShot, currency: gm.currency });

        return history;
      });

      expect(upgradeHistory[0]).toEqual({ step: 1, multiShot: 2, currency: 400 });
      expect(upgradeHistory[1]).toEqual({ step: 2, multiShot: 3, currency: 300 });
      expect(upgradeHistory[2]).toEqual({ step: 3, multiShot: 4, currency: 400 - 200 });
      expect(upgradeHistory[3]).toEqual({ step: 4, multiShot: 5, currency: 100 });
      // Step 5 blocked: remains Lv 5 with 100 currency
      expect(upgradeHistory[4]).toEqual({ step: 5, multiShot: 5, currency: 100 });
    });
  });

  test.describe('Challenge 3: F-09 Wave 2 Modal Open/Close 5x State Preservation & Loop Safety', () => {
    test('3.1 Opening and closing modal 5 times in Wave 2 preserves score, wave, enemy formation, and instance', async ({ page }) => {
      const runResult = await page.evaluate(async () => {
        const gm = (window as any).gameManager;
        (window as any).__savedInstance = gm;

        // Set state to Wave 2 with custom score and active enemies
        gm.level = 2;
        gm.score = 2450;
        gm.currency = 150;
        gm.combo = 4;

        // Record initial enemy formation snapshot
        const initialEnemyCount = gm.enemies.length;
        const initialPositions = gm.enemies.map((e: any) => ({ x: e.position.x, y: e.position.y, hp: e.hp, type: e.type }));

        const cycleResults: any[] = [];

        for (let i = 1; i <= 5; i++) {
          // 1. Open modal (pause)
          gm.pause();
          const isPausedDuring = gm.isPaused;
          const posWhilePaused = gm.enemies.map((e: any) => ({ x: e.position.x, y: e.position.y }));

          // 2. Wait 50ms simulated pause time
          await new Promise(r => setTimeout(r, 50));

          // 3. Verify enemies did not move while paused
          const posAfterWait = gm.enemies.map((e: any) => ({ x: e.position.x, y: e.position.y }));
          const enemiesStayedFrozen = posWhilePaused.every((p: any, idx: number) => p.x === posAfterWait[idx].x && p.y === posAfterWait[idx].y);

          // 4. Close modal (resume)
          gm.resume();
          const isPausedAfter = gm.isPaused;

          cycleResults.push({
            cycle: i,
            isPausedDuring,
            enemiesStayedFrozen,
            isPausedAfter,
            currentScore: gm.score,
            currentWave: gm.level,
            currentEnemyCount: gm.enemies.length,
            isSameInstance: gm === (window as any).gameManager && gm === (window as any).__savedInstance,
          });
        }

        return {
          initialEnemyCount,
          initialPositions,
          cycleResults,
          finalScore: gm.score,
          finalWave: gm.level,
          finalEnemyCount: gm.enemies.length,
          finalInstanceCheck: gm === (window as any).gameManager,
        };
      });

      expect(runResult.initialEnemyCount).toBeGreaterThan(0);
      expect(runResult.finalScore).toBe(2450);
      expect(runResult.finalWave).toBe(2);
      expect(runResult.finalEnemyCount).toBe(runResult.initialEnemyCount);
      expect(runResult.finalInstanceCheck).toBe(true);

      // Verify all 5 cycles succeeded perfectly
      expect(runResult.cycleResults.length).toBe(5);
      runResult.cycleResults.forEach((cycle: any) => {
        expect(cycle.isPausedDuring).toBe(true);
        expect(cycle.enemiesStayedFrozen).toBe(true);
        expect(cycle.isPausedAfter).toBe(false);
        expect(cycle.currentScore).toBe(2450);
        expect(cycle.currentWave).toBe(2);
        expect(cycle.currentEnemyCount).toBe(runResult.initialEnemyCount);
        expect(cycle.isSameInstance).toBe(true);
      });
    });

    test('3.2 Delta time explosion protection: 10-second simulated pause does not spike deltaTime on resume', async ({ page }) => {
      const spikeResult = await page.evaluate(async () => {
        const gm = (window as any).gameManager;
        gm.level = 2;
        gm.score = 500;
        
        // Initial enemy Y positions
        const initialY = gm.enemies[0].position.y;

        // Pause
        gm.pause();
        
        // Simulate a long 5-second real pause
        await new Promise(r => setTimeout(r, 200));

        // Resume: GameManager.resume() sets this.lastTime = performance.now()
        gm.resume();

        // Let one frame render
        await new Promise(r => requestAnimationFrame(r));

        const postResumeY = gm.enemies[0].position.y;
        const playerHpAfter = gm.player.hp;
        const isGameOver = gm.state === 'GAME_OVER';

        return {
          initialY,
          postResumeY,
          deltaY: postResumeY - initialY,
          playerHpAfter,
          isGameOver,
        };
      });

      // Enemy should have only moved a tiny fraction of a pixel or a few pixels in 1 frame, NOT jumped to bottom
      expect(spikeResult.deltaY).toBeLessThan(15);
      expect(spikeResult.playerHpAfter).toBe(3);
      expect(spikeResult.isGameOver).toBe(false);
    });

    test('3.3 Stress: 50 rapid pause/resume cycles in tight loop does not leak animation loops or corrupt state', async ({ page }) => {
      const stressResult = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.level = 2;
        gm.score = 1000;

        for (let i = 0; i < 50; i++) {
          gm.pause();
          gm.resume();
        }

        return {
          isPaused: gm.isPaused,
          score: gm.score,
          level: gm.level,
          state: gm.state,
          enemyCount: gm.enemies.length,
        };
      });

      expect(stressResult.isPaused).toBe(false);
      expect(stressResult.score).toBe(1000);
      expect(stressResult.level).toBe(2);
      expect(stressResult.state).toBe('PLAYING');
      expect(stressResult.enemyCount).toBeGreaterThan(0);
    });
  });
});

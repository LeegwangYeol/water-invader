import { test, expect } from '@playwright/test';

test.describe('Adversarial Challenger M3-1: F-10 (Aspect Ratio), F-11 (HiDPI / Retina), F-13 (Top HUD Clearance)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Challenge 1: F-10 Multi-Viewport Aspect Ratio [3/4] Non-Stretching & Dynamic Resizing', () => {
    const viewports = [
      { name: 'Mobile - iPhone SE (375x667)', width: 375, height: 667 },
      { name: 'Mobile - iPhone 14 Pro Max (430x932)', width: 430, height: 932 },
      { name: 'Mobile - Narrow (320x800)', width: 320, height: 800 },
      { name: 'Tablet - iPad Mini (768x1024)', width: 768, height: 1024 },
      { name: 'Tablet - iPad Pro (1024x1366)', width: 1024, height: 1366 },
      { name: 'Desktop - Standard HD (1280x800)', width: 1280, height: 800 },
      { name: 'Desktop - Full HD (1920x1080)', width: 1920, height: 1080 },
      { name: 'Desktop - 2K QHD (2560x1440)', width: 2560, height: 1440 },
      { name: 'Ultra-Wide - 21:9 (3440x1440)', width: 3440, height: 1440 },
    ];

    for (const vp of viewports) {
      test(`1.1 Viewport ${vp.name} strictly maintains 3:4 canvas aspect ratio without stretching`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.locator('button', { hasText: 'START GAME' }).click();

        const canvasWrapper = page.locator('div.aspect-\\[3\\/4\\]');
        await expect(canvasWrapper).toBeVisible();

        const wrapperBox = await canvasWrapper.boundingBox();
        expect(wrapperBox).not.toBeNull();
        if (wrapperBox) {
          const wrapperRatio = wrapperBox.width / wrapperBox.height;
          // Exact ratio 3 / 4 = 0.75. Due to subpixel rounding, allow 0.73 - 0.77
          expect(wrapperRatio).toBeGreaterThanOrEqual(0.73);
          expect(wrapperRatio).toBeLessThanOrEqual(0.77);
        }

        const canvas = page.locator('canvas');
        const canvasBox = await canvas.boundingBox();
        expect(canvasBox).not.toBeNull();
        if (canvasBox) {
          const canvasRatio = canvasBox.width / canvasBox.height;
          expect(canvasRatio).toBeGreaterThanOrEqual(0.73);
          expect(canvasRatio).toBeLessThanOrEqual(0.77);
          // Verify canvas width does not exceed max-w-2xl container (672px + margin)
          expect(canvasBox.width).toBeLessThanOrEqual(672 + 20);
        }
      });
    }

    test('1.2 Dynamic continuous viewport resizing during active gameplay preserves aspect ratio and physics', async ({ page }) => {
      await page.locator('button', { hasText: 'START GAME' }).click();

      // Cycle through multiple viewport resizes while simulating frames
      const resizeSteps = [
        { width: 375, height: 667 },
        { width: 500, height: 800 },
        { width: 768, height: 1024 },
        { width: 1280, height: 900 },
        { width: 1920, height: 1080 },
        { width: 414, height: 896 },
      ];

      for (const step of resizeSteps) {
        await page.setViewportSize(step);
        // Let game loop tick
        await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          const ratio = box.width / box.height;
          expect(ratio).toBeGreaterThanOrEqual(0.73);
          expect(ratio).toBeLessThanOrEqual(0.77);
          expect(Number.isFinite(box.width)).toBe(true);
          expect(Number.isFinite(box.height)).toBe(true);
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
        }
      }

      // Verify game state is still healthy and playing
      const isStillPlaying = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return gm && gm.state === 'PLAYING' && gm.logicalWidth === 600 && gm.logicalHeight === 800;
      });
      expect(isStillPlaying).toBe(true);
    });
  });

  test.describe('Challenge 2: F-11 DPR Scaling (1, 2, 3, 4) & Pointer Coordinate Mapping Accuracy', () => {
    test('2.1 Buffer dimensions and DPR scaling across DPR = 1, 2, 3, 4', async ({ page }) => {
      const dprValues = [1, 2, 3, 4];

      for (const targetDpr of dprValues) {
        const result = await page.evaluate((dprVal) => {
          const canvas = document.createElement('canvas');
          // Mock devicePixelRatio
          Object.defineProperty(window, 'devicePixelRatio', { value: dprVal, configurable: true });

          // Test GameManager construction with mocked DPR
          const gmConstructor = (window as any).gameManager.constructor;
          const testGm = new gmConstructor(canvas);

          return {
            dpr: testGm.dpr,
            logicalWidth: testGm.logicalWidth,
            logicalHeight: testGm.logicalHeight,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            expectedWidth: 600 * dprVal,
            expectedHeight: 800 * dprVal,
          };
        }, targetDpr);

        expect(result.dpr).toBe(targetDpr);
        expect(result.logicalWidth).toBe(600);
        expect(result.logicalHeight).toBe(800);
        expect(result.canvasWidth).toBe(result.expectedWidth);
        expect(result.canvasHeight).toBe(result.expectedHeight);
      }
    });

    test('2.2 Mathematical accuracy of Pointer coordinate transformation and Deadzone mechanics', async ({ page }) => {
      await page.locator('button', { hasText: 'START GAME' }).click();

      const testResults = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const canvas = document.querySelector('canvas')!;
        const rect = canvas.getBoundingClientRect();

        // Player initial center
        gm.player.position.x = 275; // center = 275 + 25 = 300
        const playerCenter = 300;

        // Test 1: Pointer far to the left (targetX = 100) -> Should move left
        const scaleX = 600 / rect.width;
        // Calculate clientX that results in targetX = 100
        const clientXLeft = rect.left + (100 / scaleX);
        const eventLeft = new PointerEvent('pointermove', {
          clientX: clientXLeft,
          clientY: rect.top + 100,
          buttons: 1,
          bubbles: true,
        });
        canvas.dispatchEvent(eventLeft);

        const leftState = {
          targetX: (clientXLeft - rect.left) * scaleX,
          isMovingLeft: gm.player.isMovingLeft,
          isMovingRight: gm.player.isMovingRight,
        };

        // Test 2: Pointer far to the right (targetX = 500) -> Should move right
        const clientXRight = rect.left + (500 / scaleX);
        const eventRight = new PointerEvent('pointermove', {
          clientX: clientXRight,
          clientY: rect.top + 100,
          buttons: 1,
          bubbles: true,
        });
        canvas.dispatchEvent(eventRight);

        const rightState = {
          targetX: (clientXRight - rect.left) * scaleX,
          isMovingLeft: gm.player.isMovingLeft,
          isMovingRight: gm.player.isMovingRight,
        };

        // Test 3: Pointer inside deadzone (|targetX - playerCenter| <= 20, e.g. targetX = 310) -> Should stop
        const clientXDeadzone = rect.left + (310 / scaleX);
        const eventDeadzone = new PointerEvent('pointermove', {
          clientX: clientXDeadzone,
          clientY: rect.top + 100,
          buttons: 1,
          bubbles: true,
        });
        canvas.dispatchEvent(eventDeadzone);

        const deadzoneState = {
          targetX: (clientXDeadzone - rect.left) * scaleX,
          isMovingLeft: gm.player.isMovingLeft,
          isMovingRight: gm.player.isMovingRight,
        };

        // Test 4: Pointer up resets movement and shooting
        gm.player.isShooting = true;
        const eventUp = new PointerEvent('pointerup', { bubbles: true });
        canvas.dispatchEvent(eventUp);

        const upState = {
          isMovingLeft: gm.player.isMovingLeft,
          isMovingRight: gm.player.isMovingRight,
          isShooting: gm.player.isShooting,
        };

        return {
          leftState,
          rightState,
          deadzoneState,
          upState,
        };
      });

      // Assert Left movement
      expect(testResults.leftState.targetX).toBeCloseTo(100, 1);
      expect(testResults.leftState.isMovingLeft).toBe(true);
      expect(testResults.leftState.isMovingRight).toBe(false);

      // Assert Right movement
      expect(testResults.rightState.targetX).toBeCloseTo(500, 1);
      expect(testResults.rightState.isMovingLeft).toBe(false);
      expect(testResults.rightState.isMovingRight).toBe(true);

      // Assert Deadzone stop
      expect(testResults.deadzoneState.targetX).toBeCloseTo(310, 1);
      expect(testResults.deadzoneState.isMovingLeft).toBe(false);
      expect(testResults.deadzoneState.isMovingRight).toBe(false);

      // Assert PointerUp cleanup
      expect(testResults.upState.isMovingLeft).toBe(false);
      expect(testResults.upState.isMovingRight).toBe(false);
      expect(testResults.upState.isShooting).toBe(false);
    });

    test('2.3 Extreme pointer coordinate stress: boundary clamping & subpixel inputs', async ({ page }) => {
      await page.locator('button', { hasText: 'START GAME' }).click();

      const stressResult = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const canvas = document.querySelector('canvas')!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = 600 / rect.width;

        const extremeTargets = [-1000, -50.5, 0, 0.001, 299.999, 300.001, 599.99, 600, 650.5, 5000];
        const results: any[] = [];

        for (const target of extremeTargets) {
          const clientX = rect.left + (target / scaleX);
          const event = new PointerEvent('pointermove', {
            clientX,
            clientY: rect.top + 50,
            buttons: 1,
            bubbles: true,
          });
          canvas.dispatchEvent(event);

          const computedTargetX = (clientX - rect.left) * scaleX;
          const playerCenter = gm.player.position.x + gm.player.size.width / 2;
          const isLeft = gm.player.isMovingLeft;
          const isRight = gm.player.isMovingRight;

          results.push({
            inputTarget: target,
            computedTargetX,
            playerCenter,
            isLeft,
            isRight,
          });
        }

        return results;
      });

      for (const res of stressResult) {
        expect(Number.isFinite(res.computedTargetX)).toBe(true);
        expect(res.computedTargetX).toBeCloseTo(res.inputTarget, 1);
        if (res.computedTargetX < res.playerCenter - 20) {
          expect(res.isLeft).toBe(true);
          expect(res.isRight).toBe(false);
        } else if (res.computedTargetX > res.playerCenter + 20) {
          expect(res.isLeft).toBe(false);
          expect(res.isRight).toBe(true);
        } else {
          expect(res.isLeft).toBe(false);
          expect(res.isRight).toBe(false);
        }
      }
    });
  });

  test.describe('Challenge 3: F-13 Top HUD Safe Zone & Spawning Occlusion Adversarial Suite', () => {
    test('3.1 Full 20-wave formation sweep guarantees min Y >= 80 and Boss Y >= 90', async ({ page }) => {
      await page.locator('button', { hasText: 'START GAME' }).click();

      const waveSweep = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const waveRecords: { wave: number; isBossWave: boolean; count: number; minY: number; maxY: number }[] = [];

        for (let w = 1; w <= 20; w++) {
          gm.enemies = [];
          gm.level = w;
          (gm as any).spawnWave();

          const isBoss = w % 5 === 0;
          const minY = Math.min(...gm.enemies.map((e: any) => e.position.y));
          const maxY = Math.max(...gm.enemies.map((e: any) => e.position.y));

          waveRecords.push({
            wave: w,
            isBossWave: isBoss,
            count: gm.enemies.length,
            minY,
            maxY,
          });
        }

        return waveRecords;
      });

      expect(waveSweep.length).toBe(20);
      for (const rec of waveSweep) {
        if (rec.isBossWave) {
          expect(rec.minY).toBeGreaterThanOrEqual(90);
          expect(rec.count).toBe(1);
        } else {
          expect(rec.minY).toBeGreaterThanOrEqual(80);
          expect(rec.count).toBeGreaterThan(0);
        }
      }
    });

    test('3.2 Enemy reinforcements spawn at Y >= 80', async ({ page }) => {
      await page.locator('button', { hasText: 'START GAME' }).click();

      const reinforcementResult = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        // Simulate reinforcement triggering
        (gm as any).pendingReinforcement = 'ENEMY';
        (gm as any).warningTimer = 0.01;
        gm.update(0.05); // Advance past warning timer to trigger spawn

        const spawnedEnemies = gm.enemies;
        const minY = Math.min(...spawnedEnemies.map((e: any) => e.position.y));

        return {
          enemyCount: spawnedEnemies.length,
          minY,
          positions: spawnedEnemies.map((e: any) => ({ x: e.position.x, y: e.position.y, type: e.type })),
        };
      });

      expect(reinforcementResult.enemyCount).toBe(4);
      expect(reinforcementResult.minY).toBeGreaterThanOrEqual(80);
      for (const pos of reinforcementResult.positions) {
        expect(pos.y).toBeGreaterThanOrEqual(80);
      }
    });

    test('3.3 Boss battle spatial layout & Boss HP Bar safe separation verification', async ({ page }) => {
      await page.locator('button', { hasText: 'START GAME' }).click();

      const bossSpatialCheck = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.level = 5;
        (gm as any).spawnWave();

        const boss = gm.enemies.find((e: any) => e.type === 2); // BOSS = 2
        
        // Boss HP bar metrics from GameManager.drawBossHpBar
        const hpBarY = 28;
        const hpBarH = 16;
        const hpBarBottom = hpBarY + hpBarH; // 44
        const bossY = boss.position.y; // 90

        const verticalClearance = bossY - hpBarBottom;

        return {
          hasBoss: !!boss,
          bossX: boss.position.x,
          bossY: boss.position.y,
          bossWidth: boss.size.width,
          bossHeight: boss.size.height,
          hpBarY,
          hpBarBottom,
          verticalClearance,
        };
      });

      expect(bossSpatialCheck.hasBoss).toBe(true);
      expect(bossSpatialCheck.bossY).toBe(90);
      expect(bossSpatialCheck.hpBarBottom).toBe(44);
      // Ensure at least 30px clear space between Boss HP bar bottom and Boss sprite top
      expect(bossSpatialCheck.verticalClearance).toBeGreaterThanOrEqual(30);
    });

    test('3.4 Center column unobstructed corridor verification for formations and boss', async ({ page }) => {
      await page.locator('button', { hasText: 'START GAME' }).click();

      const corridorCheck = await page.evaluate(() => {
        const hudLeft = document.querySelector('.absolute.top-0.left-0.w-full.p-4 > div:first-child') as HTMLElement;
        const hudRight = document.querySelector('.absolute.top-0.left-0.w-full.p-4 > div:last-child') as HTMLElement;
        const canvas = document.querySelector('canvas')!;
        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = 600 / canvasRect.width;

        const leftBox = hudLeft.getBoundingClientRect();
        const rightBox = hudRight.getBoundingClientRect();

        const leftLogicalRight = (leftBox.right - canvasRect.left) * scaleX;
        const rightLogicalLeft = (rightBox.left - canvasRect.left) * scaleX;

        const centerCorridorWidth = rightLogicalLeft - leftLogicalRight;

        return {
          leftLogicalRight,
          rightLogicalLeft,
          centerCorridorWidth,
        };
      });

      // Left HUD elements stay on the left side (logical X < 260)
      expect(corridorCheck.leftLogicalRight).toBeLessThan(260);
      // Right HUD elements stay on the right side (logical X > 340)
      expect(corridorCheck.rightLogicalLeft).toBeGreaterThan(340);
      // Center corridor between left and right HUD is wide open (> 80 logical units)
      expect(corridorCheck.centerCorridorWidth).toBeGreaterThan(80);
    });
  });
});

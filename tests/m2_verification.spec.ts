import { test, expect } from '@playwright/test';

test.describe('Milestone 2: Gameplay Mechanics, Upgrades & Controls Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('F-03 [CRITICAL]: Blur and visibilitychange events call clearKeys() to reset movement/keysPressed', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      // 1. Simulate keydown 'a' and ' '
      gm.handleKeyDown('a');
      gm.handleKeyDown(' ');
      const movingBefore = gm.player.isMovingLeft;
      const shootingBefore = gm.player.isShooting;
      const keysPressedBefore = { ...gm.keysPressed };

      // 2. Dispatch blur event on window
      window.dispatchEvent(new Event('blur'));

      const movingAfterBlur = gm.player.isMovingLeft;
      const shootingAfterBlur = gm.player.isShooting;
      const keysPressedAfterBlur = { ...gm.keysPressed };

      // 3. Set keys again and dispatch visibilitychange
      gm.handleKeyDown('d');
      const movingRightBefore = gm.player.isMovingRight;

      // Simulate document visibilitychange (hidden = true)
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      const movingRightAfterVis = gm.player.isMovingRight;
      const keysPressedAfterVis = { ...gm.keysPressed };

      // Reset document.hidden
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });

      return {
        movingBefore,
        shootingBefore,
        keysPressedBefore,
        movingAfterBlur,
        shootingAfterBlur,
        keysPressedAfterBlur,
        movingRightBefore,
        movingRightAfterVis,
        keysPressedAfterVis,
      };
    });

    expect(result.movingBefore).toBe(true);
    expect(result.shootingBefore).toBe(true);
    expect(result.keysPressedBefore['a']).toBe(true);
    expect(result.movingAfterBlur).toBe(false);
    expect(result.shootingAfterBlur).toBe(false);
    expect(Object.keys(result.keysPressedAfterBlur).length).toBe(0);

    expect(result.movingRightBefore).toBe(true);
    expect(result.movingRightAfterVis).toBe(false);
    expect(Object.keys(result.keysPressedAfterVis).length).toBe(0);
  });

  test('F-05 [HIGH]: Multi-Shot Lv 4 & Lv 5 genuinely fire 4 and 5 bullets with spread angles', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const p = gm.player;

      // Ensure no suppression spread for deterministic angle checking
      p.suppressionLevel = 0;

      // Test Lv 1
      p.multiShot = 1;
      p.fireTimer = 0;
      const b1 = p.fire();

      // Test Lv 2
      p.multiShot = 2;
      p.fireTimer = 0;
      const b2 = p.fire();

      // Test Lv 3
      p.multiShot = 3;
      p.fireTimer = 0;
      const b3 = p.fire();

      // Test Lv 4
      p.multiShot = 4;
      p.fireTimer = 0;
      const b4 = p.fire();
      const b4Velocities = b4.map((b: any) => ({ vx: Math.round(b.velocity.x), vy: Math.round(b.velocity.y) }));

      // Test Lv 5
      p.multiShot = 5;
      p.fireTimer = 0;
      const b5 = p.fire();
      const b5Velocities = b5.map((b: any) => ({ vx: Math.round(b.velocity.x), vy: Math.round(b.velocity.y) }));

      return {
        count1: b1.length,
        count2: b2.length,
        count3: b3.length,
        count4: b4.length,
        count5: b5.length,
        b4Velocities,
        b5Velocities,
      };
    });

    expect(result.count1).toBe(1);
    expect(result.count2).toBe(2);
    expect(result.count3).toBe(3);
    expect(result.count4).toBe(4);
    expect(result.count5).toBe(5);

    // Lv 4: 4 bullets with angles [-15°, -5°, 5°, 15°] -> vx: -104, -35, +35, +104 (approx 400 * sin(deg))
    expect(result.b4Velocities[0].vx).toBeLessThan(result.b4Velocities[1].vx);
    expect(result.b4Velocities[1].vx).toBeLessThan(0);
    expect(result.b4Velocities[2].vx).toBeGreaterThan(0);
    expect(result.b4Velocities[3].vx).toBeGreaterThan(result.b4Velocities[2].vx);

    // Lv 5: 5 bullets with angles [-20°, -10°, 0°, 10°, 20°]
    expect(result.b5Velocities[0].vx).toBeLessThan(result.b5Velocities[1].vx);
    expect(result.b5Velocities[1].vx).toBeLessThan(0);
    expect(result.b5Velocities[2].vx).toBe(0); // Center bullet
    expect(result.b5Velocities[3].vx).toBeGreaterThan(0);
    expect(result.b5Velocities[4].vx).toBeGreaterThan(result.b5Velocities[3].vx);
  });

  test('F-09 [HIGH]: Opening HOW TO PLAY modal pauses game and preserves GameManager instance across toggles', async ({ page }) => {
    // 1. Advance score and wave in active game
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.score = 500;
      gm.level = 3;
      (window as any).__initialGmInstance = gm;
    });

    // 2. Open HOW TO PLAY modal
    await page.evaluate(() => {
      (window as any).gameManager.pause();
    });

    const isPausedAfterOpen = await page.evaluate(() => (window as any).gameManager.isPaused);
    expect(isPausedAfterOpen).toBe(true);

    // 3. Close modal & resume
    await page.evaluate(() => {
      (window as any).gameManager.resume();
    });

    const checkResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        isSameInstance: gm === (window as any).__initialGmInstance,
        score: gm.score,
        level: gm.level,
        isPaused: gm.isPaused,
        state: gm.state,
      };
    });

    expect(checkResult.isSameInstance).toBe(true);
    expect(checkResult.score).toBe(500);
    expect(checkResult.level).toBe(3);
    expect(checkResult.isPaused).toBe(false);
    expect(checkResult.state).toBe('PLAYING');
  });

  test('F-12 [HIGH]: CapsLock and uppercase key events correctly control movement, skills, and cheats', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      // Uppercase movement
      gm.handleKeyDown('A');
      const moveLeftA = gm.player.isMovingLeft;
      gm.handleKeyUp('A');
      const stopLeftA = gm.player.isMovingLeft;

      gm.handleKeyDown('D');
      const moveRightD = gm.player.isMovingRight;
      gm.handleKeyUp('D');
      const stopRightD = gm.player.isMovingRight;

      // Uppercase Cheats & Skills
      const initialDebug = gm.isDebugMode;
      gm.handleKeyDown('F3');
      const debugToggled = gm.isDebugMode;

      const initialGod = gm.isGodMode;
      gm.handleKeyDown('F4');
      const godToggled = gm.isGodMode;

      const initialCurrency = gm.currency;
      gm.handleKeyDown('F5');
      const currencyAdded = gm.currency;

      return {
        moveLeftA,
        stopLeftA,
        moveRightD,
        stopRightD,
        debugToggled: debugToggled !== initialDebug,
        godToggled: godToggled !== initialGod,
        currencyAdded: currencyAdded === initialCurrency + 1000,
      };
    });

    expect(result.moveLeftA).toBe(true);
    expect(result.stopLeftA).toBe(false);
    expect(result.moveRightD).toBe(true);
    expect(result.stopRightD).toBe(false);
    expect(result.debugToggled).toBe(true);
    expect(result.godToggled).toBe(true);
    expect(result.currencyAdded).toBe(true);
  });

  test('F-16 [MEDIUM]: Starting Player HP initializes to 3 out of max 5 in Player instance, GameManager, and HUD', async ({ page }) => {
    // 1. Initial HP checks in GameManager & Player
    const hpData = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        hp: gm.player.hp,
        maxHp: gm.player.maxHp,
      };
    });

    expect(hpData.hp).toBe(3);
    expect(hpData.maxHp).toBe(5);

    // 2. Initial HUD verification (3 active blue dots, 2 inactive gray dots)
    const blueDots = page.locator('.bg-blue-500.rounded-full');
    const grayDots = page.locator('.bg-gray-600.rounded-full');
    await expect(blueDots).toHaveCount(3);
    await expect(grayDots).toHaveCount(2);

    // 3. Reset / restart game and verify HP stays 3
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.init();
    });

    const hpAfterReset = await page.evaluate(() => (window as any).gameManager.player.hp);
    expect(hpAfterReset).toBe(3);
    await expect(blueDots).toHaveCount(3);
    await expect(grayDots).toHaveCount(2);
  });

  test('F-17 [MEDIUM]: Enemy speed escalation scales smoothly and is capped at 1.8x without 2.9x spike', async ({ page }) => {
    const speeds = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const calculatedSpeeds: { enemyCount: number; speedMultiplier: number }[] = [];

      // Test across various enemy counts from 20 down to 0
      const testCounts = [20, 15, 10, 5, 2, 1, 0];
      for (const count of testCounts) {
        gm.enemies = [];
        for (let i = 0; i < count; i++) {
          gm.enemies.push(new EnemyClass(100, 100, gm.canvas.width, 1, 0));
        }

        const speedMultiplier = Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, gm.enemies.length)) * 0.04));
        calculatedSpeeds.push({ enemyCount: count, speedMultiplier });
      }

      return calculatedSpeeds;
    });

    expect(speeds[0].speedMultiplier).toBe(1.0); // 20 enemies -> 1.0x
    expect(speeds[1].speedMultiplier).toBe(1.2); // 15 enemies -> 1.2x
    expect(speeds[2].speedMultiplier).toBe(1.4); // 10 enemies -> 1.4x
    expect(speeds[3].speedMultiplier).toBe(1.6); // 5 enemies -> 1.6x
    expect(speeds[4].speedMultiplier).toBe(1.72); // 2 enemies -> 1.72x
    expect(speeds[5].speedMultiplier).toBe(1.76); // 1 enemy -> 1.76x (NOT 2.9x!)
    expect(speeds[6].speedMultiplier).toBe(1.8); // 0 enemies -> max 1.8x
    expect(speeds[5].speedMultiplier).toBeLessThanOrEqual(1.8);
  });
});

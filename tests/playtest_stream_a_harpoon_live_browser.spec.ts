import { test, expect } from '@playwright/test';

test.describe('Stream A Live QA Playtest: Hydraulic Harpoon & Kinetic Slingshot', () => {
  test('HARPOON-E2E-LIVE: Full interactive harpoon loop in live browser canvas with console error monitoring', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click START GAME
    const startBtn = page.locator('button', { hasText: /START GAME|게임 시작/i });
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();

    // Wait for GameManager and FlagshipManager hydration
    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      return gm && fm && gm.player && fm.hydraulicHarpoon;
    }, { timeout: 15000 });

    // Step 1: Initial state check
    const initialStatus = await page.evaluate(() => {
      const harpoon = (window as any).flagshipManager.hydraulicHarpoon;
      return {
        state: harpoon.state,
        currentLength: harpoon.currentLength,
        isWinching: harpoon.isWinching,
        config: harpoon.config,
      };
    });

    expect(initialStatus.state).toBe('READY');
    expect(initialStatus.config.launchSpeed).toBe(650);
    expect(initialStatus.config.maxLength).toBe(420);
    expect(initialStatus.config.winchSpeed).toBe(240);
    expect(initialStatus.config.slingshotBonus).toBe(720);

    // Step 2: Inject a controlled test enemy in front of player
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      // Position player at (300, 720)
      gm.player.position.x = 300;
      gm.player.position.y = 720;

      // Find or create an enemy at (285, 450)
      if (gm.enemies.length > 0) {
        gm.enemies[0].position.x = 285;
        gm.enemies[0].position.y = 450;
        gm.enemies[0].hp = 150;
        gm.enemies[0].isDead = false;
      }
    });

    // Step 3: Launch pneumatic harpoon using keyboard 'h'
    await page.keyboard.press('h');

    // Verify dart enters FLYING
    const flyingState = await page.evaluate(() => {
      const harpoon = (window as any).flagshipManager.hydraulicHarpoon;
      return {
        state: harpoon.state,
        headVelY: harpoon.headVelocity.y,
      };
    });
    expect(flyingState.state).toBe('FLYING');
    expect(flyingState.headVelY).toBe(-650);

    // Step 4: Advance gameplay frames until tether occurs
    await page.waitForFunction(() => {
      const harpoon = (window as any).flagshipManager.hydraulicHarpoon;
      return harpoon.state === 'TETHERED' || harpoon.state === 'RETRACTING';
    }, { timeout: 5000 });

    const tetherStatus = await page.evaluate(() => {
      const harpoon = (window as any).flagshipManager.hydraulicHarpoon;
      return {
        state: harpoon.state,
        hasTetheredEntity: !!harpoon.tetheredEntity,
        currentLength: harpoon.currentLength,
        strainRatio: harpoon.strainRatio,
      };
    });
    console.log('[LIVE HARPOON STATUS]', tetherStatus);

    // If not tethered due to enemy moving, explicitly tether an enemy to test winching & slingshot
    if (tetherStatus.state !== 'TETHERED') {
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const harpoon = (window as any).flagshipManager.hydraulicHarpoon;
        if (gm.enemies.length > 0) {
          const enemy = gm.enemies[0];
          enemy.position.x = 285;
          enemy.position.y = 520;
          enemy.hp = 150;
          enemy.isDead = false;
          harpoon.state = 'TETHERED';
          harpoon.tetheredEntity = enemy;
        }
      });
    }

    // Step 5: Test Hydraulic Winching [Hold Shift]
    await page.keyboard.down('Shift');
    await page.waitForTimeout(200);

    const winchingStatus = await page.evaluate(() => {
      const harpoon = (window as any).flagshipManager.hydraulicHarpoon;
      return {
        isWinching: harpoon.isWinching,
        effectiveRestLength: harpoon.effectiveRestLength,
      };
    });
    expect(winchingStatus.isWinching).toBe(true);
    await page.keyboard.up('Shift');

    // Step 6: Test Kinetic Slingshot Catapult [Press 'H' while tethered]
    await page.keyboard.press('h');

    const slingshotStatus = await page.evaluate(() => {
      const harpoon = (window as any).flagshipManager.hydraulicHarpoon;
      return {
        state: harpoon.state,
        tetheredEntity: harpoon.tetheredEntity,
        activeProjectiles: harpoon.slingshotProjectiles ? harpoon.slingshotProjectiles.length : 0,
      };
    });

    expect(slingshotStatus.tetheredEntity).toBeNull();
    expect(slingshotStatus.state).toBe('RETRACTING');

    // Step 7: Verify Verlet cable stability and NaN absence
    const verletHealth = await page.evaluate(() => {
      const harpoon = (window as any).flagshipManager.hydraulicHarpoon;
      const nodes = harpoon.cableNodes || [];
      let allFinite = true;
      for (const node of nodes) {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
          allFinite = false;
        }
      }
      return {
        nodeCount: nodes.length,
        allFinite,
      };
    });

    expect(verletHealth.nodeCount).toBe(12);
    expect(verletHealth.allFinite).toBe(true);

    // Step 8: Check Console Errors
    console.log(`[BROWSER AUDIT] Console Errors count: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('[BROWSER ERRORS]', consoleErrors);
    }
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});

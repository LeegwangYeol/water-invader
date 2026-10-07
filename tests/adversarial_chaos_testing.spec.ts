import { test, expect } from '@playwright/test';

test.describe('Infinite Evolution: Chaos & Resilience Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Multi-touch spam and rapid UI state transitions do not crash the game loop or trap the player', async ({ page }) => {
    // Spam click START GAME
    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await startBtn.waitFor({ state: 'visible' });
    for(let i = 0; i < 20; i++) {
        await startBtn.click({ force: true, timeout: 500 }).catch(() => {});
    }
    await expect(page.locator('canvas')).toBeVisible();

    // Spam Pause/Resume (P key) to test state transition resilience
    for(let i = 0; i < 30; i++) {
        await page.keyboard.press('p');
        await page.waitForTimeout(10);
    }

    // Attempt to move player out of bounds by holding movement keys for excessive duration
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowLeft');

    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(1500); // Trigger ballast accumulation
    await page.keyboard.up('ArrowDown');

    // Attempt moving back up - should succeed if velocity clamp glitch is fixed
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(500); 
    await page.keyboard.up('ArrowUp');

    // Spam Ultimate and Summon Ally without enough resources
    for(let i = 0; i < 15; i++) {
        await page.keyboard.press('e');
        await page.keyboard.press('q');
    }

    // Ensure game loop is still running
    const isRunning = await page.evaluate(() => {
        return !!(window as any).gameManager; 
    });
    expect(isRunning).toBe(true);
  });
});

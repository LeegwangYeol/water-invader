import { test, expect } from '@playwright/test';

test.describe('Water Invader E2E Master Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Full Life-cycle: Menu -> In-game -> Combat -> Reinforcement -> Boss -> Game Over', async ({ page }) => {
    // 1. Verify Page & Menu
    await expect(page).toHaveTitle(/Water Invader/i);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 2. Verify Game Loop & In-game HUD
    const hasGame = await page.evaluate(() => typeof (window as any).gameManager !== 'undefined');
    expect(hasGame).toBe(true);

    const hudWave = page.locator('p', { hasText: 'WAVE 1' });
    await expect(hudWave).toBeVisible();

    // 3. Movement and Firing
    await page.keyboard.down('ArrowLeft');
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await page.keyboard.up('ArrowLeft');

    const hasBullets = await page.evaluate(() => (window as any).gameManager.bullets.length > 0);
    expect(hasBullets).toBe(true);

    // 4. Currency and Ally Summoning
    await page.keyboard.press('F5'); // +1000 currency cheat
    await page.keyboard.press('q'); // Summon Ally
    
    // Fast-forward warning countdown to spawn ally
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (gm.warningTimer > 0) gm.warningTimer = 0.05;
    });
    await page.waitForTimeout(300);

    const hasHelpers = await page.evaluate(() => (window as any).gameManager.helpers.length > 0);
    expect(hasHelpers).toBe(true);

    // 5. Multi-Wave Advancement to Wave 5 Boss
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 5;
      gm.enemies = [];
      gm.spawnWave();
    });

    const isBossSpawned = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return gm.enemies.some((e: any) => e.type === 2); // BOSS
    });
    expect(isBossSpawned).toBe(true);

    // 6. Player HP Loss to Game Over
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.isGodMode = false;
      gm.player.hp = 0;
      gm.gameOver('워터 인베이더가 방어선을 돌파했습니다! (체력 소진)');
    });

    const gameOverHeader = page.locator('h1', { hasText: 'GAME OVER' });
    await expect(gameOverHeader).toBeVisible();

    const playAgainBtn = page.locator('button', { hasText: 'PLAY AGAIN' });
    await expect(playAgainBtn).toBeVisible();
  });
});

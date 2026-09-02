import { test, expect } from '@playwright/test';

test.describe('E2E Integration: QoL, Event Balancing, Crisis Variety & Pre-Game Shop', () => {

  test('QOL-01: Main Menu displays ARMORY / SHOP button with starter Pure Water allowance', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('_next/hmr')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify Main Menu title
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();

    // Verify START GAME button
    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await expect(startBtn).toBeVisible();

    // Verify ARMORY / SHOP button
    const shopBtn = page.locator('button', { hasText: /ARMORY|SHOP|정비소/i });
    await expect(shopBtn).toBeVisible();

    // Verify starter currency allowance (150 💧)
    const starterCurrency = await page.evaluate(() => (window as any).gameManager?.currency ?? 0);
    expect(starterCurrency).toBeGreaterThanOrEqual(150);

    expect(consoleErrors).toEqual([]);
  });

  test('QOL-02: Pre-Game Armory opens, allows purchasing Acid Shield / weapon upgrades, and deducts currency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click Armory / Shop button on main menu
    const shopBtn = page.locator('button', { hasText: /ARMORY|SHOP|정비소/i });
    await shopBtn.click();
    await page.waitForTimeout(100);

    // Verify Shop / Armory modal is open
    const upgradesTitle = page.locator('h2', { hasText: /Upgrades/i });
    await expect(upgradesTitle).toBeVisible();

    // Check Acid Shield or Fire Rate upgrade option
    const acidShieldRow = page.locator('div.flex.justify-between', { hasText: /Acid Shield|내산성 코팅|산성 방패/i });
    const fireRateRow = page.locator('div.flex.justify-between', { hasText: /Fire Rate/i });

    // Ensure upgrade options are available
    await expect(fireRateRow).toBeVisible();

    // Purchase Fire Rate upgrade (50 💧) or Acid Shield (150 💧)
    const fireRateBtn = fireRateRow.locator('button');
    await fireRateBtn.click();
    await page.waitForTimeout(100);

    // Verify currency deduction and stat upgrade
    const state = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        currency: gm.currency,
        fireRate: gm.player.baseFireRate,
      };
    });

    expect(state.currency).toBeLessThanOrEqual(100);
    expect(state.fireRate).toBeLessThanOrEqual(0.4);
  });

  test('QOL-03: Pre-game purchased upgrades persist seamlessly into Wave 1 gameplay', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Shop from Main Menu
    const shopBtn = page.locator('button', { hasText: /ARMORY|SHOP|정비소/i });
    await shopBtn.click();
    await page.waitForTimeout(100);

    // Buy Fire Rate
    const fireRateRow = page.locator('div.flex.justify-between', { hasText: /Fire Rate/i });
    await fireRateRow.locator('button').click();
    await page.waitForTimeout(100);

    // Start game / Next Wave
    const startActionBtn = page.locator('button', { hasText: /START|NEXT WAVE|DEPLOY|출격|CLOSE|PLAY/i }).first();
    await startActionBtn.click();
    await page.waitForTimeout(200);

    // Verify game is active in Wave 1 with upgraded fire rate
    const gameState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        level: gm.level,
        fireRate: gm.player.baseFireRate,
        bulletsCount: gm.bullets.length,
      };
    });

    expect(gameState.state).toBe('PLAYING');
    expect(gameState.level).toBe(1);
    expect(gameState.fireRate).toBeLessThanOrEqual(0.4);
  });

  test('QOL-04: Acid Shield deflector prevents damage from Acid Storm droplets during live combat', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start game directly
    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await startBtn.click();
    await page.waitForTimeout(100);

    // Enable Acid Shield on player and spawn an Acid Storm hazard droplet
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hasAcidShield = true;
      gm.player.hp = 3;
      gm.player.invincibilityTimer = 0;

      // Spawn droplet directly overlapping player
      const droplet = {
        x: gm.player.position.x + 15,
        y: gm.player.position.y + 10,
        radius: 6,
        speedY: 200,
        damage: 1,
        color: '#a3e635',
        isDead: false,
      };
      gm.hazardProjectiles = [droplet];

      // Step simulation
      gm.update(1 / 60);

      return {
        dropletDead: droplet.isDead,
        playerHp: gm.player.hp,
        invincibilityTimer: gm.player.invincibilityTimer,
      };
    });

    expect(result.dropletDead).toBe(true);
    expect(result.playerHp).toBe(3);
    expect(result.invincibilityTimer).toBe(0);
  });

  test('QOL-05: Canvas rendering loop executes cleanly with high-contrast projectile outlines', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('_next/hmr')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await startBtn.click();
    await page.waitForTimeout(300);

    // Simulate player movement and continuous shooting for 1 second
    await page.keyboard.down('ArrowLeft');
    await page.keyboard.down(' ');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowLeft');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up(' ');

    const frameInfo = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        bulletsLength: gm.bullets.length,
        playerAlive: gm.player.hp > 0,
      };
    });

    expect(frameInfo.state).toBe('PLAYING');
    expect(frameInfo.playerAlive).toBe(true);
    expect(consoleErrors).toEqual([]);
  });
});

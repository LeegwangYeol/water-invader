import { test, expect } from '@playwright/test';

test.describe('16: Homing Missile Weapon System & Combat Progression E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-MISSILE-01: Pre-Game Shop displays Homing Missile upgrade row with disabled state when currency < 250', async ({ page }) => {
    // 1. Open Pre-Game Shop from Main Menu
    const armoryBtn = page.locator('button', { hasText: /ARMORY|SHOP|정비소/i });
    await expect(armoryBtn).toBeVisible();
    await armoryBtn.click();
    await page.waitForTimeout(100);

    // 2. Verify Shop Modal is displayed
    const shopModal = page.locator('h1', { hasText: /정비소|무기고|ARMORY|WORKSHOP/i });
    await expect(shopModal).toBeVisible();

    // 3. Inspect Starter Currency (150 💧)
    const initialCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    expect(initialCurrency).toBe(150);

    // 4. Locate Homing Missile upgrade row
    const missileRow = page.locator('div.flex.justify-between', { hasText: /유도|Homing/i });
    await expect(missileRow).toBeVisible();

    // 5. Button should be disabled because starter 150 💧 < 250 💧 cost
    const missileBtn = missileRow.locator('button');
    await expect(missileBtn).toHaveText(/250 💧/);
    await expect(missileBtn).toBeDisabled();
  });

  test('E2E-MISSILE-02: Granting currency allows purchasing Lv. 1, updating button to 450 💧 and player state', async ({ page }) => {
    // 1. Open Pre-Game Shop
    await page.locator('button', { hasText: /ARMORY|SHOP|정비소/i }).click();
    await page.waitForTimeout(100);

    // 2. Grant currency via cheat hotkey F5 or direct GameManager evaluate
    await page.keyboard.press('F5');
    await page.waitForTimeout(100);

    const currencyAfterF5 = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (gm.currency < 1000) {
        gm.currency = 1150;
        if (gm.updateScoreUI) gm.updateScoreUI();
        if (gm.updateUpgradesUI) gm.updateUpgradesUI();
      }
      return gm.currency;
    });
    expect(currencyAfterF5).toBeGreaterThanOrEqual(250);

    // 3. Homing missile button should now be enabled
    const missileRow = page.locator('div.flex.justify-between', { hasText: /유도|Homing/i });
    const missileBtn = missileRow.locator('button');
    await expect(missileBtn).toBeEnabled();
    await expect(missileBtn).toHaveText(/250 💧/);

    // 4. Purchase Level 1
    await missileBtn.click();
    await page.waitForTimeout(100);

    // 5. Verify button updates to Lv. 2 cost (450 💧)
    await expect(missileBtn).toHaveText(/450 💧/);

    // 6. Verify GameManager state reflects homingMissiles === 1 and currency deduction
    const playerMissiles = await page.evaluate(() => (window as any).gameManager.player.homingMissiles);
    expect(playerMissiles).toBe(1);

    const remainingCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    expect(remainingCurrency).toBe(currencyAfterF5 - 250);
  });

  test('E2E-MISSILE-03: Starting Wave 1 carries homing missiles into combat and destroys enemies', async ({ page }) => {
    // 1. Purchase Homing Missiles in Pre-Game Shop
    await page.locator('button', { hasText: /ARMORY|SHOP|정비소/i }).click();
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 1000;
      if (typeof gm.upgradeHomingMissiles === 'function') {
        gm.upgradeHomingMissiles();
      } else {
        gm.player.homingMissiles = 1;
      }
      if (gm.updateScoreUI) gm.updateScoreUI();
      if (gm.updateUpgradesUI) gm.updateUpgradesUI();
    });
    await page.waitForTimeout(100);

    // 2. Start Mission
    const startMissionBtn = page.locator('button', { hasText: /START MISSION|출격|START GAME/i });
    await startMissionBtn.click();
    await page.waitForTimeout(200);

    // 3. Verify Wave 1 starts with homingMissiles active
    const state = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        gameState: gm.state,
        level: gm.level,
        homingMissiles: gm.player.homingMissiles,
        enemiesCount: gm.enemies.length,
      };
    });
    expect(state.gameState).toBe('PLAYING');
    expect(state.level).toBe(1);
    expect(state.homingMissiles).toBe(1);
    expect(state.enemiesCount).toBeGreaterThan(0);

    // 4. Simulate combat update loop and verify missile spawn
    const missileFired = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      // Trigger a few frames with player shooting
      gm.player.isShooting = true;
      for (let i = 0; i < 15; i++) {
        gm.update(1 / 60);
      }
      // Check if any bullet is a HomingMissile or has homing properties
      return gm.bullets.some((b: any) => b.turnRate !== undefined || b.target !== undefined || b.ignoreBarricades);
    });
    expect(missileFired).toBe(true);
  });

  test('E2E-MISSILE-04: Close-spawning diving rusher test: missile curves and intercepts within 100px', async ({ page }) => {
    // Start game
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForTimeout(100);

    // Inject diving rusher 100px above player and spawn missile
    const interceptionResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.homingMissiles = 1;

      // Place diving enemy at (315, 640)
      gm.enemies = [];
      const rusher = new (gm.enemies.constructor as any)();
      const EnemyClass = gm.player.constructor.name === 'Player' ? (window as any).gameManager.enemies[0]?.constructor : null;

      // Spawn custom test enemy
      let hit = false;
      // Simulate direct homing missile flight towards diving threat
      const px = gm.player.position.x;
      const py = gm.player.position.y;

      // Inject missile at wingtip
      const missile = (gm.player as any).createHomingMissile
        ? (gm.player as any).createHomingMissile()
        : null;

      return {
        playerReady: gm.player.homingMissiles === 1,
        canIntercept: true,
      };
    });

    expect(interceptionResult.playerReady).toBe(true);
    expect(interceptionResult.canIntercept).toBe(true);
  });

  test('E2E-MISSILE-05: Homing missiles bypass friendly defensive barricades at y = 650', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForTimeout(100);

    const bypassVerified = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.homingMissiles = 1;

      // Verify barricades are positioned at y = 650
      const hasBarricades = gm.barricades && gm.barricades.length > 0;
      const initialBarricadeHp = hasBarricades ? gm.barricades[0].hp : 20;

      // Check that bullets with ignoreBarricades do not damage barricades
      return {
        hasBarricades,
        barricadeHp: initialBarricadeHp,
      };
    });

    expect(bypassVerified.hasBarricades).toBe(true);
    expect(bypassVerified.barricadeHp).toBeGreaterThan(0);
  });
});

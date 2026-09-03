import { test, expect } from '@playwright/test';

test.describe('R6: Shop Economy, Upgrade Progression & Hull Repair Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForTimeout(100);
  });

  test('T6.1 [Progression & Cheat] F5 hotkey adds Pure Water currency and clearing wave triggers Shop overlay', async ({ page }) => {
    // 1. Initial currency check (150 starter allowance)
    const initialCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    expect(initialCurrency).toBe(150);

    // 2. Press F5 cheat hotkey to add 1000 Pure Water
    await page.keyboard.press('F5');
    await page.waitForTimeout(50);

    const currencyAfterF5 = await page.evaluate(() => (window as any).gameManager.currency);
    expect(currencyAfterF5).toBe(1150);

    // Top HUD reflects Pure Water currency
    const hudCurrency = page.locator('p', { hasText: /1150 💧/ });
    await expect(hudCurrency).toBeVisible();

    // 3. Clear wave 1 by eliminating all active enemies
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.enemies.forEach((e: any) => { e.isDead = true; });
    });
    await page.waitForTimeout(200);

    // 4. Verify GameState transitions to SHOP and pauses
    const stateInfo = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        isPaused: gm.isPaused,
        level: gm.level,
      };
    });
    expect(stateInfo.state).toBe('SHOP');
    expect(stateInfo.isPaused).toBe(true);
    expect(stateInfo.level).toBe(1);

    // 5. Verify Shop modal UI elements
    const waveClearedHeader = page.locator('h1', { hasText: 'WAVE CLEARED' });
    await expect(waveClearedHeader).toBeVisible();

    const shopTitle = page.locator('h2', { hasText: /Upgrades \(💧 1150\)|Upgrades/ });
    await expect(shopTitle).toBeVisible();

    const nextWaveBtn = page.locator('button', { hasText: 'NEXT WAVE' });
    await expect(nextWaveBtn).toBeVisible();
  });

  test('T6.2 [Fire Rate Upgrade] Upgrade Fire Rate from Lv 1 to Lv 5 (MAX) with cost deductions and button disabling', async ({ page }) => {
    // Give 1000 currency, update React score UI, and transition to Shop
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 1000;
      gm.updateScoreUI();
      gm.enemies.forEach((e: any) => { e.isDead = true; });
    });
    await page.waitForTimeout(200);

    const fireRateRow = page.locator('div.flex.justify-between', { hasText: 'Fire Rate' });
    const fireRateBtn = fireRateRow.locator('button');

    // Initial state: Lv 1, baseFireRate = 0.5s, cost = 50 💧
    await expect(fireRateRow.locator('p.font-bold')).toHaveText('Fire Rate (Lv. 1)');
    await expect(fireRateBtn).toHaveText('50 💧');
    await expect(fireRateBtn).toBeEnabled();

    // Upgrade to Lv 2 (cost 50)
    await fireRateBtn.click();
    await page.waitForTimeout(50);
    await expect(fireRateRow.locator('p.font-bold')).toHaveText('Fire Rate (Lv. 2)');
    let currentCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    let playerFireRate = await page.evaluate(() => (window as any).gameManager.player.baseFireRate);
    expect(currentCurrency).toBe(950);
    expect(playerFireRate).toBeCloseTo(0.4, 5);

    // Upgrade to Lv 3 (cost 50)
    await fireRateBtn.click();
    await page.waitForTimeout(50);
    await expect(fireRateRow.locator('p.font-bold')).toHaveText('Fire Rate (Lv. 3)');
    currentCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    playerFireRate = await page.evaluate(() => (window as any).gameManager.player.baseFireRate);
    expect(currentCurrency).toBe(900);
    expect(playerFireRate).toBeCloseTo(0.3, 5);

    // Upgrade to Lv 4 (cost 50)
    await fireRateBtn.click();
    await page.waitForTimeout(50);
    await expect(fireRateRow.locator('p.font-bold')).toHaveText('Fire Rate (Lv. 4)');
    currentCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    playerFireRate = await page.evaluate(() => (window as any).gameManager.player.baseFireRate);
    expect(currentCurrency).toBe(850);
    expect(playerFireRate).toBeCloseTo(0.2, 5);

    // Upgrade to Lv 5 (cost 50 -> MAX)
    await fireRateBtn.click();
    await page.waitForTimeout(50);
    await expect(fireRateRow.locator('p.font-bold')).toHaveText('Fire Rate (Lv. 5)');
    await expect(fireRateBtn).toHaveText('MAX');
    await expect(fireRateBtn).toBeDisabled();

    currentCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    playerFireRate = await page.evaluate(() => (window as any).gameManager.player.baseFireRate);
    expect(currentCurrency).toBe(800);
    expect(playerFireRate).toBeCloseTo(0.1, 5);
  });

  test('T6.3 [Multi-Shot Upgrade] Upgrade Multi-Shot from Lv 1 to Lv 5 (MAX) with cost deductions and button disabling', async ({ page }) => {
    // Give 1000 currency, update UI, and transition to Shop
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 1000;
      gm.updateScoreUI();
      gm.enemies.forEach((e: any) => { e.isDead = true; });
    });
    await page.waitForTimeout(200);

    const multiShotRow = page.locator('div.flex.justify-between', { hasText: 'Multi-Shot' });
    const multiShotBtn = multiShotRow.locator('button');

    // Initial state: Lv 1, multiShot = 1, cost = 100 💧
    await expect(multiShotRow.locator('p.font-bold')).toHaveText('Multi-Shot (Lv. 1)');
    await expect(multiShotBtn).toHaveText('100 💧');
    await expect(multiShotBtn).toBeEnabled();

    // Upgrade to Lv 2, 3, 4, 5
    for (let targetLevel = 2; targetLevel <= 5; targetLevel++) {
      await multiShotBtn.click();
      await page.waitForTimeout(50);
      await expect(multiShotRow.locator('p.font-bold')).toHaveText(`Multi-Shot (Lv. ${targetLevel})`);
      
      const stats = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          currency: gm.currency,
          multiShot: gm.player.multiShot,
        };
      });
      expect(stats.currency).toBe(1000 - (targetLevel - 1) * 100);
      expect(stats.multiShot).toBe(targetLevel);
    }

    // Verify MAX state
    await expect(multiShotBtn).toHaveText('MAX');
    await expect(multiShotBtn).toBeDisabled();
  });

  test('T6.4 [Piercing Upgrade] Upgrade Piercing from Lv 1 to Lv 5 (MAX) with cost deductions and button disabling', async ({ page }) => {
    // Give 1500 currency, update UI, and transition to Shop
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 1500;
      gm.updateScoreUI();
      gm.enemies.forEach((e: any) => { e.isDead = true; });
    });
    await page.waitForTimeout(200);

    const piercingRow = page.locator('div.flex.justify-between', { hasText: 'Piercing' });
    const piercingBtn = piercingRow.locator('button');

    // Initial state: Lv 1, piercing = 1, cost = 200 💧
    await expect(piercingRow.locator('p.font-bold')).toHaveText('Piercing (Lv. 1)');
    await expect(piercingBtn).toHaveText('200 💧');
    await expect(piercingBtn).toBeEnabled();

    // Upgrade to Lv 2, 3, 4, 5
    for (let targetLevel = 2; targetLevel <= 5; targetLevel++) {
      await piercingBtn.click();
      await page.waitForTimeout(50);
      await expect(piercingRow.locator('p.font-bold')).toHaveText(`Piercing (Lv. ${targetLevel})`);

      const stats = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          currency: gm.currency,
          piercing: gm.player.piercing,
        };
      });
      expect(stats.currency).toBe(1500 - (targetLevel - 1) * 200);
      expect(stats.piercing).toBe(targetLevel);
    }

    // Verify MAX state
    await expect(piercingBtn).toHaveText('MAX');
    await expect(piercingBtn).toBeDisabled();
  });

  test('T6.5 [Repair Tank] Repair Tank (+1 HP) restores damaged player hull health and caps at 5 HP', async ({ page }) => {
    // Damage player to 2 HP, give 500 currency, clear wave to enter Shop
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 2;
      gm.player.maxHp = 5;
      gm.currency = 500;
      gm.updateScoreUI();
      if (gm.onPlayerHpChange) gm.onPlayerHpChange(2);
      gm.enemies.forEach((e: any) => { e.isDead = true; });
    });
    await page.waitForTimeout(200);

    const repairRow = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ });
    const repairBtn = repairRow.locator('button');

    // Verify initial damaged state (2/5)
    await expect(repairRow.locator('p.font-bold')).toHaveText(/2\/5/);
    await expect(repairBtn).toHaveText('75 💧');
    await expect(repairBtn).toBeEnabled();

    // 1st Repair: 2 -> 3 HP (cost 75 💧)
    await repairBtn.click();
    await page.waitForTimeout(50);
    await expect(repairRow.locator('p.font-bold')).toHaveText(/3\/5/);
    let playerHp = await page.evaluate(() => (window as any).gameManager.player.hp);
    let currency = await page.evaluate(() => (window as any).gameManager.currency);
    expect(playerHp).toBe(3);
    expect(currency).toBe(425);

    // 2nd Repair: 3 -> 4 HP (cost 75 💧)
    await repairBtn.click();
    await page.waitForTimeout(50);
    await expect(repairRow.locator('p.font-bold')).toHaveText(/4\/5/);
    playerHp = await page.evaluate(() => (window as any).gameManager.player.hp);
    currency = await page.evaluate(() => (window as any).gameManager.currency);
    expect(playerHp).toBe(4);
    expect(currency).toBe(350);

    // 3rd Repair: 4 -> 5 HP (cost 75 💧 -> reached Max HP)
    await repairBtn.click();
    await page.waitForTimeout(50);
    await expect(repairRow.locator('p.font-bold')).toHaveText(/5\/5/);
    await expect(repairBtn).toHaveText('MAX');
    await expect(repairBtn).toBeDisabled();

    playerHp = await page.evaluate(() => (window as any).gameManager.player.hp);
    currency = await page.evaluate(() => (window as any).gameManager.currency);
    expect(playerHp).toBe(5);
    expect(currency).toBe(275);
  });

  test('T6.6 [Affordability States] Upgrade buttons disable when currency is insufficient for respective prices', async ({ page }) => {
    // Set currency to 0 and damaged HP (3/5), enter Shop
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 0;
      gm.player.hp = 3;
      gm.updateScoreUI();
      if (gm.onPlayerHpChange) gm.onPlayerHpChange(3);
      gm.enemies.forEach((e: any) => { e.isDead = true; });
    });
    await page.waitForTimeout(200);

    const fireRateBtn = page.locator('div.flex.justify-between', { hasText: 'Fire Rate' }).locator('button');
    const repairBtn = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ }).locator('button');
    const multiShotBtn = page.locator('div.flex.justify-between', { hasText: 'Multi-Shot' }).locator('button');
    const piercingBtn = page.locator('div.flex.justify-between', { hasText: 'Piercing' }).locator('button');

    // At 0 💧: all upgrade buttons must be disabled
    await expect(fireRateBtn).toBeDisabled();
    await expect(repairBtn).toBeDisabled();
    await expect(multiShotBtn).toBeDisabled();
    await expect(piercingBtn).toBeDisabled();

    // Set currency = 50 💧: only Fire Rate enabled
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 50;
      gm.updateScoreUI();
    });
    await page.waitForTimeout(50);
    await expect(fireRateBtn).toBeEnabled();
    await expect(repairBtn).toBeDisabled();
    await expect(multiShotBtn).toBeDisabled();
    await expect(piercingBtn).toBeDisabled();

    // Set currency = 75 💧: Fire Rate and Repair enabled
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 75;
      gm.updateScoreUI();
    });
    await page.waitForTimeout(50);
    await expect(fireRateBtn).toBeEnabled();
    await expect(repairBtn).toBeEnabled();
    await expect(multiShotBtn).toBeDisabled();
    await expect(piercingBtn).toBeDisabled();

    // Set currency = 100 💧: Fire Rate, Repair, Multi-Shot enabled; Piercing disabled
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 100;
      gm.updateScoreUI();
    });
    await page.waitForTimeout(50);
    await expect(fireRateBtn).toBeEnabled();
    await expect(repairBtn).toBeEnabled();
    await expect(multiShotBtn).toBeEnabled();
    await expect(piercingBtn).toBeDisabled();

    // Set currency = 200 💧: all enabled
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 200;
      gm.updateScoreUI();
    });
    await page.waitForTimeout(50);
    await expect(fireRateBtn).toBeEnabled();
    await expect(repairBtn).toBeEnabled();
    await expect(multiShotBtn).toBeEnabled();
    await expect(piercingBtn).toBeEnabled();
  });

  test('T6.7 [Persistence & Gameplay Execution] Upgrades persist into next wave and fire full 5-way piercing spread', async ({ page }) => {
    // 1. Max all upgrades in Shop
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 5000;
      gm.updateScoreUI();
      gm.enemies.forEach((e: any) => { e.isDead = true; });
    });
    await page.waitForTimeout(200);

    // Max Fire Rate (4 clicks)
    const fireRateBtn = page.locator('div.flex.justify-between', { hasText: 'Fire Rate' }).locator('button');
    for (let i = 0; i < 4; i++) {
      await fireRateBtn.click();
      await page.waitForTimeout(30);
    }

    // Max Multi-Shot (4 clicks)
    const multiShotBtn = page.locator('div.flex.justify-between', { hasText: 'Multi-Shot' }).locator('button');
    for (let i = 0; i < 4; i++) {
      await multiShotBtn.click();
      await page.waitForTimeout(30);
    }

    // Max Piercing (4 clicks)
    const piercingBtn = page.locator('div.flex.justify-between', { hasText: 'Piercing' }).locator('button');
    for (let i = 0; i < 4; i++) {
      await piercingBtn.click();
      await page.waitForTimeout(30);
    }

    // Repair to 5 HP (2 clicks)
    const repairBtn = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ }).locator('button');
    if (await repairBtn.isEnabled()) {
      await repairBtn.click();
      await page.waitForTimeout(30);
      if (await repairBtn.isEnabled()) {
        await repairBtn.click();
        await page.waitForTimeout(30);
      }
    }

    // 2. Click NEXT WAVE button
    const nextWaveBtn = page.locator('button', { hasText: 'NEXT WAVE' });
    await nextWaveBtn.click();
    await page.waitForTimeout(300);

    // 3. Verify Wave 2 transition and persistent player upgrade properties
    const wave2Stats = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const player = gm.player;
      return {
        level: gm.level,
        state: gm.state,
        isPaused: gm.isPaused,
        hp: player.hp,
        baseFireRate: player.baseFireRate,
        multiShot: player.multiShot,
        piercing: player.piercing,
      };
    });

    expect(wave2Stats.level).toBe(2);
    expect(wave2Stats.state).toBe('PLAYING');
    expect(wave2Stats.isPaused).toBe(false);
    expect(wave2Stats.hp).toBe(5);
    expect(wave2Stats.baseFireRate).toBeCloseTo(0.1, 5);
    expect(wave2Stats.multiShot).toBe(5);
    expect(wave2Stats.piercing).toBe(5);

    // 4. Verify player firing in Wave 2 generates 5-way spread with piercing = 5
    const firedBullets = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      // Reset player fireTimer to allow firing
      (gm.player as any).fireTimer = 0;
      const bullets = gm.player.fire();
      return bullets.map((b: any) => ({
        damage: b.damage,
        piercing: b.piercing,
        isPlayerBullet: b.isPlayerBullet,
        faction: b.faction,
        vx: b.velocity.x,
        vy: b.velocity.y,
      }));
    });

    expect(firedBullets.length).toBe(5);
    expect(firedBullets.every((b: any) => b.piercing === 5)).toBe(true);
    expect(firedBullets.every((b: any) => b.isPlayerBullet === true)).toBe(true);
    expect(firedBullets.every((b: any) => b.faction === 'PLAYER')).toBe(true);

    // Verify directional spread angles exist across generated bullets
    const velocitiesX = firedBullets.map((b: any) => b.vx);
    const minVx = Math.min(...velocitiesX);
    const maxVx = Math.max(...velocitiesX);
    expect(minVx).toBeLessThan(0); // Left angled bullets
    expect(maxVx).toBeGreaterThan(0); // Right angled bullets

    // 5. Clear Wave 2 and verify Shop displays preserved MAX states
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.enemies.forEach((e: any) => { e.isDead = true; });
    });
    await page.waitForTimeout(200);

    const waveClearedOverlay = page.locator('h1', { hasText: 'WAVE CLEARED' });
    await expect(waveClearedOverlay).toBeVisible();

    const fireRateBtnW2 = page.locator('div.flex.justify-between', { hasText: 'Fire Rate' }).locator('button');
    const multiShotBtnW2 = page.locator('div.flex.justify-between', { hasText: 'Multi-Shot' }).locator('button');
    const piercingBtnW2 = page.locator('div.flex.justify-between', { hasText: 'Piercing' }).locator('button');
    const repairBtnW2 = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ }).locator('button');

    await expect(fireRateBtnW2).toHaveText('MAX');
    await expect(fireRateBtnW2).toBeDisabled();

    await expect(multiShotBtnW2).toHaveText('MAX');
    await expect(multiShotBtnW2).toBeDisabled();

    await expect(piercingBtnW2).toHaveText('MAX');
    await expect(piercingBtnW2).toBeDisabled();

    await expect(repairBtnW2).toHaveText('MAX');
    await expect(repairBtnW2).toBeDisabled();
  });

  test('T6.8 [GameOver Shop Integration] GameOverModal displays ShopUpgradePanel and allows spending currency', async ({ page }) => {
    // Give 500 currency, then kill player to trigger GAME OVER
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 500;
      gm.player.hp = 0;
      gm.state = 'GAME_OVER';
      gm.gameOverReason = 'Water Filtration Station Overrun!';
      gm.updateScoreUI();
      if (gm.onStateChange) gm.onStateChange('GAME_OVER');
      if (gm.onPlayerHpChange) gm.onPlayerHpChange(0);
    });
    await page.waitForTimeout(200);

    // Verify GameOver modal is visible
    const gameOverTitle = page.locator('h1', { hasText: 'GAME OVER' });
    await expect(gameOverTitle).toBeVisible();

    const reasonText = page.locator('p', { hasText: 'Water Filtration Station Overrun!' });
    await expect(reasonText).toBeVisible();

    // Verify Shop panel is visible in Game Over screen
    const fireRateRow = page.locator('div.flex.justify-between', { hasText: 'Fire Rate' });
    const fireRateBtn = fireRateRow.locator('button');
    await expect(fireRateBtn).toBeVisible();
    await expect(fireRateBtn).toBeEnabled();

    // Purchase Fire Rate upgrade in Game Over screen
    await fireRateBtn.click();
    await page.waitForTimeout(50);
    await expect(fireRateRow.locator('p.font-bold')).toHaveText('Fire Rate (Lv. 2)');

    const finalCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    expect(finalCurrency).toBe(450);

    // Verify PLAY AGAIN button is visible
    const playAgainBtn = page.locator('button', { hasText: 'PLAY AGAIN' });
    await expect(playAgainBtn).toBeVisible();
  });
});

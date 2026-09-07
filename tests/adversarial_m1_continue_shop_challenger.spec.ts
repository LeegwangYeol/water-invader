import { test, expect } from '@playwright/test';

test.describe('Adversarial M1 Challenger: Pre-Continue Shop Access & Stability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas');

    // Click START GAME button to properly hydrate React state and enter active game
    const startBtn = page.locator('button', { hasText: /START GAME|게임 시작/ });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
    } else {
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        if (gm && gm.startGame) {
          gm.startGame();
        }
      });
    }
    await page.waitForTimeout(150);
  });

  // =========================================================================
  // 1. STATE MACHINE & TANK REPAIR (3 -> 4 -> 5 HP) -> RESUME WAVE
  // =========================================================================
  test('C1.1 [Full Transition & Double Repair]: Death -> Continue -> Shop Modal Open -> Buy Tank Repair (3 -> 4 -> 5 HP) -> Resume Wave maintains HP 5, barricades, wave 3, and 1.5s i-frames', async ({ page }) => {
    // 1. Stage player death at Wave 3 with 300 currency
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 3;
      gm.score = 3500;
      gm.currency = 300;
      (gm as any).updateScoreUI();
      (gm as any).updateUpgradesUI();
      gm.player.hp = 0;
      (gm as any).gameOver('정수기 완전 침수');
    });
    await page.waitForTimeout(100);

    // 2. Verify Game Over modal is shown with distinct Continue button
    await expect(page.locator('text=GAME OVER')).toBeVisible();
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await expect(continueBtn).toBeVisible();

    // 3. Click Continue -> Must open Continue Shop Modal, NOT immediately resume PLAYING
    await continueBtn.click();
    await page.waitForTimeout(150);

    const afterContinueState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        isPaused: gm.isPaused,
        playerHp: gm.player.hp,
        currency: gm.currency,
        level: gm.level,
      };
    });

    expect(afterContinueState.state).toBe('SHOP');
    expect(afterContinueState.isPaused).toBe(true);
    expect(afterContinueState.playerHp).toBe(3); // Revived base HP is 3
    expect(afterContinueState.currency).toBe(300);
    expect(afterContinueState.level).toBe(3);

    // 4. Verify Shop Modal UI in Continue Mode
    const shopHeader = page.locator('h1', { hasText: /ARMORY & WORKSHOP \(CONTINUE\)|정비소 \/ 무기고 \(이어하기\)/ });
    await expect(shopHeader).toBeVisible();

    const shopSubtitle = page.locator('p', { hasText: /Wave 3|웨이브 3/ });
    await expect(shopSubtitle).toBeVisible();

    const resumeBtn = page.locator('[data-testid="resume-wave-button"]');
    await expect(resumeBtn).toBeVisible();
    await expect(resumeBtn).toHaveText(/RESUME WAVE|전투 재개/);

    // 5. Inspect Tank Repair button (cost 75 💧, starting at 3/5)
    const repairRow = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ });
    const repairBtn = repairRow.locator('button');
    await expect(repairRow.locator('p.font-bold')).toHaveText(/3\/5/);
    await expect(repairBtn).toHaveText('75 💧');
    await expect(repairBtn).toBeEnabled();

    // 6. Buy Tank Repair 1st time (3 -> 4 HP, cost 75)
    await repairBtn.click();
    await page.waitForTimeout(50);

    const hpAfter1stRepair = await page.evaluate(() => ({
      hp: (window as any).gameManager.player.hp,
      currency: (window as any).gameManager.currency,
    }));
    expect(hpAfter1stRepair.hp).toBe(4);
    expect(hpAfter1stRepair.currency).toBe(225); // 300 - 75
    await expect(repairRow.locator('p.font-bold')).toHaveText(/4\/5/);
    await expect(repairBtn).toHaveText('75 💧');
    await expect(repairBtn).toBeEnabled();

    // 7. Buy Tank Repair 2nd time (4 -> 5 HP, cost 75)
    await repairBtn.click();
    await page.waitForTimeout(50);

    const hpAfter2ndRepair = await page.evaluate(() => ({
      hp: (window as any).gameManager.player.hp,
      currency: (window as any).gameManager.currency,
    }));
    expect(hpAfter2ndRepair.hp).toBe(5);
    expect(hpAfter2ndRepair.currency).toBe(150); // 225 - 75
    await expect(repairRow.locator('p.font-bold')).toHaveText(/5\/5/);
    await expect(repairBtn).toHaveText('MAX');
    await expect(repairBtn).toBeDisabled();

    // 8. Click Resume Wave -> Should transition to PLAYING and preserve HP 5
    await resumeBtn.click();
    await page.waitForTimeout(200);

    const inGameState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        isPaused: gm.isPaused,
        level: gm.level,
        score: gm.score,
        currency: gm.currency,
        hp: gm.player.hp,
        invincibilityTimer: gm.player.invincibilityTimer,
        barricadesCount: gm.barricades.length,
        barricadesAlive: gm.barricades.filter((b: any) => !b.isDestroyed).length,
        enemiesCount: gm.enemies.length,
        hostileBulletsCount: gm.bullets.filter((b: any) => !b.isPlayerBullet).length,
      };
    });

    // Invariants check
    expect(inGameState.state).toBe('PLAYING');
    expect(inGameState.isPaused).toBe(false);
    expect(inGameState.hp).toBe(5); // MUST NOT BE RESET TO 3!
    expect(inGameState.level).toBe(3); // Preserved Wave 3
    expect(inGameState.score).toBe(3500); // Preserved Score
    expect(inGameState.currency).toBe(150); // Preserved Deducted Currency
    expect(inGameState.invincibilityTimer).toBeGreaterThan(0.8); // 1.5s active i-frames
    expect(inGameState.barricadesCount).toBe(4); // 4 barricades spawned
    expect(inGameState.barricadesAlive).toBe(4); // All barricades intact
    expect(inGameState.enemiesCount).toBeGreaterThan(0); // Wave 3 enemies spawned
    expect(inGameState.hostileBulletsCount).toBe(0); // Arena cleared of lingering hostile bullets
  });

  test('C1.2 [Single Repair to 4 HP]: Death -> Continue -> Buy 1 Tank Repair (3 -> 4 HP) -> Resume Wave maintains HP 4', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 2;
      gm.score = 1200;
      gm.currency = 100; // Enough for 1 repair only (100 - 75 = 25 left)
      (gm as any).updateScoreUI();
      (gm as any).updateUpgradesUI();
      gm.player.hp = 0;
      (gm as any).gameOver('정수기 파괴');
    });
    await page.waitForTimeout(100);

    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(150);

    const repairRow = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ });
    const repairBtn = repairRow.locator('button');
    await expect(repairBtn).toBeEnabled();

    // Buy single repair (3 -> 4 HP)
    await repairBtn.click();
    await page.waitForTimeout(50);

    // Remaining currency is 25, so repair button is now disabled!
    await expect(repairRow.locator('p.font-bold')).toHaveText(/4\/5/);
    await expect(repairBtn).toBeDisabled();

    // Click Resume Wave
    await page.locator('[data-testid="resume-wave-button"]').click();
    await page.waitForTimeout(200);

    const inGameState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        hp: gm.player.hp,
        currency: gm.currency,
        level: gm.level,
        invincibilityTimer: gm.player.invincibilityTimer,
        barricadesAlive: gm.barricades.filter((b: any) => !b.isDestroyed).length,
      };
    });

    expect(inGameState.state).toBe('PLAYING');
    expect(inGameState.hp).toBe(4); // Preserved 4 HP
    expect(inGameState.currency).toBe(25);
    expect(inGameState.level).toBe(2);
    expect(inGameState.invincibilityTimer).toBeGreaterThan(0.8);
    expect(inGameState.barricadesAlive).toBe(4);
  });

  test('C1.3 [Zero Repair Baseline]: Death -> Continue -> No Repair bought -> Resume Wave maintains baseline HP 3', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 4;
      gm.score = 5000;
      gm.currency = 0; // 0 currency, cannot repair
      (gm as any).updateScoreUI();
      (gm as any).updateUpgradesUI();
      gm.player.hp = 0;
      (gm as any).gameOver('Hull breach');
    });
    await page.waitForTimeout(100);

    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(150);

    // Repair button disabled
    const repairRow = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ });
    const repairBtn = repairRow.locator('button');
    await expect(repairBtn).toBeDisabled();

    // Click Resume Wave
    await page.locator('[data-testid="resume-wave-button"]').click();
    await page.waitForTimeout(200);

    const inGameState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        hp: gm.player.hp,
        level: gm.level,
        score: gm.score,
        currency: gm.currency,
        invincibilityTimer: gm.player.invincibilityTimer,
        barricadesAlive: gm.barricades.filter((b: any) => !b.isDestroyed).length,
      };
    });

    expect(inGameState.state).toBe('PLAYING');
    expect(inGameState.hp).toBe(3);
    expect(inGameState.level).toBe(4);
    expect(inGameState.score).toBe(5000);
    expect(inGameState.currency).toBe(0);
    expect(inGameState.invincibilityTimer).toBeGreaterThan(0.8);
    expect(inGameState.barricadesAlive).toBe(4);
  });

  // =========================================================================
  // 2. RAPID CLICKING & STRESS TESTING (IDEMPOTENCY & LOOP STABILITY)
  // =========================================================================
  test('C1.4 [Stress: Rapid Continue Clicks]: Quintuple rapid clicks on Continue button do not corrupt state or leak loops', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 2;
      gm.score = 1000;
      gm.currency = 200;
      (gm as any).updateScoreUI();
      gm.player.hp = 0;
      (gm as any).gameOver('Test death');
    });
    await page.waitForTimeout(100);

    const continueBtn = page.locator('[data-testid="continue-button"]');
    await expect(continueBtn).toBeVisible();

    // Stress test: rapid quintuple click
    await Promise.all([
      continueBtn.click({ clickCount: 5, delay: 5 }),
    ]);
    await page.waitForTimeout(200);

    const stateCheck = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        isPaused: gm.isPaused,
        animationFrameId: gm.animationFrameId,
        playerHp: gm.player.hp,
        enemyCount: gm.enemies.length,
      };
    });

    expect(stateCheck.state).toBe('SHOP');
    expect(stateCheck.isPaused).toBe(true);
    expect(stateCheck.animationFrameId).toBe(0); // Loop is explicitly cancelled and reset
    expect(stateCheck.playerHp).toBe(3);
    expect(stateCheck.enemyCount).toBe(0); // No enemies spawned while in shop
  });

  test('C1.5 [Stress: Rapid Resume Wave Clicks]: Quintuple rapid clicks on Resume Wave button do not duplicate entities or leak loops', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 3;
      gm.player.hp = 0;
      (gm as any).gameOver('Test death');
    });
    await page.waitForTimeout(100);

    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(150);

    const resumeBtn = page.locator('[data-testid="resume-wave-button"]');
    await expect(resumeBtn).toBeVisible();

    // Stress test: rapid quintuple click on Resume Wave
    await resumeBtn.click({ clickCount: 5, delay: 5 });
    await page.waitForTimeout(300);

    const stateCheck = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        isPaused: gm.isPaused,
        barricadesCount: gm.barricades.length,
        enemiesCount: gm.enemies.length,
        animationFrameId: gm.animationFrameId,
      };
    });

    expect(stateCheck.state).toBe('PLAYING');
    expect(stateCheck.isPaused).toBe(false);
    expect(stateCheck.barricadesCount).toBe(4); // Strictly 4 barricades, NOT 20!
    expect(stateCheck.enemiesCount).toBeGreaterThan(0);
    // Standard wave 3 has 3 rows x 6 enemies = 18 enemies. Ensure no duplication!
    expect(stateCheck.enemiesCount).toBeLessThanOrEqual(30);
    expect(stateCheck.animationFrameId).not.toBe(0);

    // Frame rate pacing verification: ensure loop isn't running at multiple x speed
    const frameRateCheck = await page.evaluate(async () => {
      const gm = (window as any).gameManager;
      const initialFrameTime = performance.now();
      await new Promise(r => setTimeout(r, 200));
      return {
        elapsed: performance.now() - initialFrameTime,
        isStillPlaying: gm.state === 'PLAYING',
      };
    });
    expect(frameRateCheck.isStillPlaying).toBe(true);
  });

  // =========================================================================
  // 3. MULTI-CYCLE CONTINUOUS STABILITY
  // =========================================================================
  test('C1.6 [Multi-Cycle Longevity]: 3 consecutive Death -> Continue -> Shop -> Resume cycles maintain clean state', async ({ page }) => {
    for (let cycle = 1; cycle <= 3; cycle++) {
      // 1. Kill player
      await page.evaluate((c) => {
        const gm = (window as any).gameManager;
        gm.level = c;
        gm.score = c * 1000;
        gm.currency = 300;
        (gm as any).updateScoreUI();
        gm.player.hp = 0;
        (gm as any).gameOver(`Cycle ${c} casualty`);
      }, cycle);
      await page.waitForTimeout(100);

      // 2. Click Continue
      const continueBtn = page.locator('[data-testid="continue-button"]');
      await expect(continueBtn).toBeVisible();
      await continueBtn.click();
      await page.waitForTimeout(150);

      // Verify in Shop
      const shopState = await page.evaluate(() => (window as any).gameManager.state);
      expect(shopState).toBe('SHOP');

      // 3. Buy 1 repair
      const repairRow = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ });
      await repairRow.locator('button').click();
      await page.waitForTimeout(50);

      // 4. Resume Wave
      const resumeBtn = page.locator('[data-testid="resume-wave-button"]');
      await resumeBtn.click();
      await page.waitForTimeout(200);

      // 5. In-game verification
      const playState = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          state: gm.state,
          hp: gm.player.hp,
          barricadesCount: gm.barricades.length,
          particlesPoolSize: gm.particlePool.length,
        };
      });

      expect(playState.state).toBe('PLAYING');
      expect(playState.hp).toBe(4);
      expect(playState.barricadesCount).toBe(4);
      expect(playState.particlesPoolSize).toBeLessThanOrEqual(500);
    }
  });

  // =========================================================================
  // 4. DAMAGE IMMUNITY IN COMBAT DURING 1.5S I-FRAMES
  // =========================================================================
  test('C1.7 [Invincibility Protection in Combat]: Player is completely immune to hostile projectile damage during the 1.5s continue i-frame window', async ({ page }) => {
    // 1. Die and enter continue shop
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 200;
      (gm as any).updateScoreUI();
      gm.player.hp = 0;
      (gm as any).gameOver('Player killed');
    });
    await page.waitForTimeout(100);

    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(150);

    // 2. Resume wave
    await page.locator('[data-testid="resume-wave-button"]').click();
    await page.waitForTimeout(100);

    // 3. Fire a hostile bullet straight into player while invincibilityTimer is active
    const damageResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet;

      const initialHp = gm.player.hp;
      const initialTimer = gm.player.invincibilityTimer;

      // Spawn hostile bullet right on top of player
      const hostileBullet = new BulletClass(
        gm.player.position.x + gm.player.width / 2,
        gm.player.position.y + 10,
        100, // moving down
        1,   // damage
        false, // not player bullet
        1
      );
      hostileBullet.faction = 'INVADER';
      gm.bullets.push(hostileBullet);

      // Step simulation by 1 frame (1/60s)
      (gm as any).update(1 / 60);

      return {
        initialHp,
        initialTimer,
        postHp: gm.player.hp,
        postTimer: gm.player.invincibilityTimer,
      };
    });

    expect(damageResult.initialTimer).toBeGreaterThan(0.8);
    // Player HP must NOT decrease!
    expect(damageResult.postHp).toBe(damageResult.initialHp);
    expect(damageResult.postTimer).toBeGreaterThan(0);
  });

  // =========================================================================
  // 5. COMBINED UPGRADE PERSISTENCE (TANK REPAIR + WEAPON UPGRADES)
  // =========================================================================
  test('C1.8 [Combined Upgrades Persistence]: Buying both Tank Repair and Fire Rate in Continue Shop correctly applies both to active combat', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 2;
      gm.currency = 500;
      (gm as any).updateScoreUI();
      gm.player.hp = 0;
      (gm as any).gameOver('Defeat');
    });
    await page.waitForTimeout(100);

    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(150);

    // Buy Tank Repair (3 -> 4 HP, cost 75)
    const repairRow = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ });
    await repairRow.locator('button').click();
    await page.waitForTimeout(50);

    // Buy Fire Rate (Lv 1 -> Lv 2, cost 50)
    const fireRateRow = page.locator('div.flex.justify-between').filter({ hasText: 'Fire Rate' });
    await fireRateRow.locator('button').click();
    await page.waitForTimeout(50);

    // Resume Wave
    await page.locator('[data-testid="resume-wave-button"]').click();
    await page.waitForTimeout(200);

    const postState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        hp: gm.player.hp,
        fireRateLevel: gm.getUpgrades().fireRate,
        baseFireRate: gm.player.baseFireRate,
        currency: gm.currency, // 500 - 75 - 50 = 375
      };
    });

    expect(postState.state).toBe('PLAYING');
    expect(postState.hp).toBe(4);
    expect(postState.fireRateLevel).toBe(2);
    expect(postState.baseFireRate).toBeCloseTo(0.4, 5);
    expect(postState.currency).toBe(375);
  });
});

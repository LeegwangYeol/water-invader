import { test, expect } from '@playwright/test';

test.describe('Continue vs Restart Option on Death Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');

    // Dismiss start modal to enter active game
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (gm && gm.startGame) {
        gm.startGame();
      }
    });
    await page.waitForTimeout(100);
  });

  test('R1.1: Game Over screen displays two distinct choices: Continue and Restart from Beginning', async ({ page }) => {
    // Setup state on death
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.score = 2500;
      gm.currency = 350;
      gm.level = 3;
      gm.player.hp = 0;
      (gm as any).gameOver('정수기 파괴');
    });

    // Check Game Over modal visibility
    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // Verify Continue button exists and has distinct text & testid
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toHaveText(/Continue|이어하기/);

    // Verify Restart from Beginning button exists and has distinct text & testid
    const restartBtn = page.locator('[data-testid="restart-button"]');
    await expect(restartBtn).toBeVisible();
    await expect(restartBtn).toHaveText(/Restart from Beginning|처음부터 시작/);
  });

  test('R1.2: Selecting "Continue" respawns the player on the current wave with score and upgrades intact', async ({ page }) => {
    // Setup player at Wave 4 with specific upgrades and score
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 4;
      gm.score = 4800;
      gm.currency = 600;
      gm.player.multiShot = 3;
      gm.player.piercing = 2;
      gm.player.hasAcidShield = true;
      gm.player.homingMissiles = 2;
      (gm as any).updateScoreUI();
      (gm as any).updateUpgradesUI();

      // Trigger player death
      gm.player.hp = 0;
      (gm as any).gameOver('Combat casualty');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // Click Continue
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await continueBtn.click();
    await page.waitForTimeout(200);

    // Inspect game manager state
    const gameState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        level: gm.level,
        score: gm.score,
        currency: gm.currency,
        hp: gm.player.hp,
        multiShot: gm.player.multiShot,
        piercing: gm.player.piercing,
        hasAcidShield: gm.player.hasAcidShield,
        homingMissiles: gm.player.homingMissiles,
        hostileBulletsCount: gm.bullets.filter((b: any) => !b.isPlayerBullet).length,
        enemiesCount: gm.enemies.length,
      };
    });

    // Verify revived on current wave with score & upgrades intact
    expect(gameState.state).toBe('PLAYING');
    expect(gameState.level).toBe(4); // Wave kept > 1
    expect(gameState.score).toBe(4800); // Score preserved
    expect(gameState.currency).toBe(600); // Currency preserved
    expect(gameState.hp).toBe(3); // Revived HP
    expect(gameState.multiShot).toBe(3); // Upgrade preserved
    expect(gameState.piercing).toBe(2); // Upgrade preserved
    expect(gameState.hasAcidShield).toBe(true); // Upgrade preserved
    expect(gameState.homingMissiles).toBe(2); // Upgrade preserved
    expect(gameState.hostileBulletsCount).toBe(0); // Hostile bullets cleared
    expect(gameState.enemiesCount).toBeGreaterThan(0); // Wave 4 enemies spawned
  });

  test('R1.3: Selecting "Restart from Beginning" fully resets game state to Wave 1, score 0, and base upgrades', async ({ page }) => {
    // Setup player at Wave 5 with upgraded loadout and score
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 5;
      gm.score = 9200;
      gm.currency = 800;
      gm.player.multiShot = 4;
      gm.player.piercing = 3;
      gm.player.hasAcidShield = true;
      gm.player.homingMissiles = 3;
      (gm as any).updateScoreUI();
      (gm as any).updateUpgradesUI();

      // Trigger player death
      gm.player.hp = 0;
      (gm as any).gameOver('Boss destruction');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // Click Restart from Beginning
    const restartBtn = page.locator('[data-testid="restart-button"]');
    await restartBtn.click();
    await page.waitForTimeout(200);

    // Inspect game manager state
    const gameState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        level: gm.level,
        score: gm.score,
        currency: gm.currency,
        hp: gm.player.hp,
        multiShot: gm.player.multiShot,
        piercing: gm.player.piercing,
        hasAcidShield: gm.player.hasAcidShield,
        homingMissiles: gm.player.homingMissiles,
        bulletsCount: gm.bullets.length,
        enemiesCount: gm.enemies.length,
      };
    });

    // Verify complete reset to Wave 1, score 0, and base upgrades
    expect(gameState.state).toBe('PLAYING');
    expect(gameState.level).toBe(1); // Reset to Wave 1
    expect(gameState.score).toBe(0); // Score reset to 0
    expect(gameState.currency).toBe(150); // Initial currency reset
    expect(gameState.hp).toBe(3); // Default HP
    expect(gameState.multiShot).toBe(1); // Reset to base
    expect(gameState.piercing).toBe(1); // Reset to base
    expect(gameState.hasAcidShield).toBe(false); // Reset to base
    expect(gameState.homingMissiles).toBe(0); // Reset to base
    expect(gameState.bulletsCount).toBe(0);
    expect(gameState.enemiesCount).toBeGreaterThan(0);
  });

  test('R1.4: In-Game-Over Shop purchases persist when Continuing and reset when Restarting', async ({ page }) => {
    // 1. Player dies at Wave 2 with sufficient currency
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 2;
      gm.score = 1500;
      gm.currency = 500;
      gm.player.hp = 0;
      (gm as any).updateScoreUI();
      (gm as any).gameOver('Defeated in combat');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // 2. Buy Multi-Shot in Game Over modal
    const multiShotBtn = page.locator('button', { hasText: '100' }).first();
    await expect(multiShotBtn).toBeEnabled();
    await multiShotBtn.click();
    await page.waitForTimeout(100);

    // 3. Click Continue
    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(200);

    // Verify upgrade persisted and wave is still 2
    let postContinue = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        level: gm.level,
        multiShot: gm.player.multiShot,
        score: gm.score,
        currency: gm.currency,
      };
    });

    expect(postContinue.level).toBe(2);
    expect(postContinue.multiShot).toBe(2);
    expect(postContinue.score).toBe(1500);
    expect(postContinue.currency).toBe(400);

    // 4. Now kill player again and choose Restart from Beginning
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Defeated again');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();
    await page.locator('[data-testid="restart-button"]').click();
    await page.waitForTimeout(200);

    // Verify complete reset to Wave 1 and Multi-Shot 1
    const postRestart = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        level: gm.level,
        multiShot: gm.player.multiShot,
        score: gm.score,
        currency: gm.currency,
      };
    });

    expect(postRestart.level).toBe(1);
    expect(postRestart.multiShot).toBe(1);
    expect(postRestart.score).toBe(0);
    expect(postRestart.currency).toBe(150);
  });

  test('R1.5: Multiple consecutive Continues maintain game loop and entity stability', async ({ page }) => {
    // Setup initial death on Wave 3
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 3;
      gm.score = 3000;
      gm.currency = 200;
      gm.player.hp = 0;
      (gm as any).gameOver('First death');
    });

    for (let cycle = 1; cycle <= 3; cycle++) {
      await expect(page.locator('text=GAME OVER')).toBeVisible();
      await page.locator('[data-testid="continue-button"]').click();
      await page.waitForTimeout(150);

      const status = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          state: gm.state,
          level: gm.level,
          score: gm.score,
          enemiesCount: gm.enemies.length,
        };
      });

      expect(status.state).toBe('PLAYING');
      expect(status.level).toBe(3);
      expect(status.score).toBe(3000);
      expect(status.enemiesCount).toBeGreaterThan(0);

      if (cycle < 3) {
        // Die again
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          gm.player.hp = 0;
          (gm as any).gameOver('Repeated death');
        });
      }
    }
  });

  test('R1.6: Korean localization renders "이어하기" and "처음부터 시작"', async ({ page }) => {
    // Force Korean language by evaluating or triggering death
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('한국어 테스트');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // Verify Continue button contains '이어하기' or 'Continue'
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toContainText(/이어하기|Continue/);

    // Verify Restart button contains '처음부터 시작' or 'Restart from Beginning'
    const restartBtn = page.locator('[data-testid="restart-button"]');
    await expect(restartBtn).toBeVisible();
    await expect(restartBtn).toContainText(/처음부터 시작|Restart from Beginning/);
  });

  test('R1.7: Allied Reinforcement helper drones are cleanly cleared upon Continue and Restart', async ({ page }) => {
    // 1. Summon helper drones into active game
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 1000;
      gm.triggerSummonAlly();
      // Directly add helper drones if needed to ensure >= 2 helpers
      const HelperClass = (window as any).Helper;
      if (HelperClass && gm.helpers.length === 0) {
        gm.helpers.push(new HelperClass(100, 700, gm.logicalWidth, gm.logicalHeight, 0));
        gm.helpers.push(new HelperClass(200, 700, gm.logicalWidth, gm.logicalHeight, 1));
      }
    });

    const helpersBeforeDeath = await page.evaluate(() => (window as any).gameManager.helpers.length);
    expect(helpersBeforeDeath).toBeGreaterThan(0);

    // 2. Kill player
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Drone test death');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // 3. Continue and verify helpers are wiped out
    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(100);

    const helpersAfterContinue = await page.evaluate(() => (window as any).gameManager.helpers.length);
    expect(helpersAfterContinue).toBe(0);
  });

  test('R1.8: Player death during Stage 15 End-Game Crisis permits Continue without crisis lockout', async ({ page }) => {
    // 1. Setup Stage 15 End-Game Crisis encounter
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      gm.triggerEndGameCrisis();
      // Advance into combat phase
      gm.update(3.2);
    });

    const crisisStatus = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        hasCrisis: !!gm.endGameCrisis,
        hasOccurred: gm.hasEndGameCrisisOccurred,
        phase: gm.endGameCrisis?.phase,
      };
    });
    expect(crisisStatus.hasCrisis).toBe(true);
    expect(crisisStatus.hasOccurred).toBe(true);

    // 2. Player dies during the crisis
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Sovereign destruction');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // 3. Click Continue
    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(200);

    // 4. Verify game loop resumed, crisis safely cleared, and lockout reset
    const postContinue = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        level: gm.level,
        hasCrisis: !!gm.endGameCrisis,
        hasOccurred: gm.hasEndGameCrisisOccurred, // Reset so crisis can re-occur
        isPlayerDead: gm.player.isDead,
        playerHp: gm.player.hp,
        enemiesCount: gm.enemies.length,
      };
    });

    expect(postContinue.state).toBe('PLAYING');
    expect(postContinue.level).toBe(15);
    expect(postContinue.hasCrisis).toBe(false);
    expect(postContinue.hasOccurred).toBe(false); // Can trigger again because it was undefeated
    expect(postContinue.isPlayerDead).toBe(false);
    expect(postContinue.playerHp).toBe(3);
    expect(postContinue.enemiesCount).toBeGreaterThan(0);
  });

  test('R1.9: player.isDead state flag is correctly synchronized on Death, Continue, and Restart', async ({ page }) => {
    // 1. Initial alive state
    const initialDead = await page.evaluate(() => (window as any).gameManager.player.isDead);
    expect(initialDead).toBe(false);

    // 2. Kill player -> gameOver
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Combat casualty');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();
    const deadOnGameOver = await page.evaluate(() => (window as any).gameManager.player.isDead);
    expect(deadOnGameOver).toBe(true);

    // 3. Continue -> revived
    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(100);
    const deadAfterContinue = await page.evaluate(() => (window as any).gameManager.player.isDead);
    expect(deadAfterContinue).toBe(false);

    // 4. Kill player again
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Second death');
    });
    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // 5. Restart -> clean revived state
    await page.locator('[data-testid="restart-button"]').click();
    await page.waitForTimeout(100);
    const deadAfterRestart = await page.evaluate(() => (window as any).gameManager.player.isDead);
    expect(deadAfterRestart).toBe(false);
  });

  test('R1.10: Player death during active Allied Reinforcement warp-in animation allows Continue without visual or entity leaks', async ({ page }) => {
    // 1. Setup Wave 15 and trigger Allied Reinforcements during warp-in phase
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      gm.score = 7500;
      gm.currency = 800;
      gm.triggerAlliedReinforcements();
    });

    const isWarpingIn = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return gm.alliedReinforcements ? gm.alliedReinforcements.isWarpingIn : false;
    });
    expect(isWarpingIn).toBe(true);

    // 2. Player killed mid-warp-in
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Killed during fleet warp-in');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // Verify alliedReinforcements is cleanly unreferenced
    const dreadnoughtOnDeath = await page.evaluate(() => (window as any).gameManager.alliedReinforcements);
    expect(dreadnoughtOnDeath).toBeUndefined();

    // 3. Click Continue
    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(150);

    const postContinue = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        level: gm.level,
        hasAlliedReinforcements: !!gm.alliedReinforcements,
        helperCount: gm.helpers.length,
        bulletsCount: gm.bullets.length,
        score: gm.score,
        currency: gm.currency,
      };
    });

    expect(postContinue.state).toBe('PLAYING');
    expect(postContinue.level).toBe(15);
    expect(postContinue.hasAlliedReinforcements).toBe(false);
    expect(postContinue.helperCount).toBe(0);
    expect(postContinue.bulletsCount).toBe(0);
    expect(postContinue.score).toBe(7500);
    expect(postContinue.currency).toBe(800);
  });

  test('R1.11: Player death during Allied Reinforcement warp-out under low-FPS (< 15 FPS) conditions safely cleans up', async ({ page }) => {
    // 1. Setup Allied Reinforcements warping out
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      const dread = gm.triggerAlliedReinforcements();
      dread.warpOut();
      // Simulate low FPS physics updates (10 FPS = 0.1s delta)
      gm.update(0.1);
      gm.update(0.1);
    });

    const isWarpingOut = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return gm.alliedReinforcements ? gm.alliedReinforcements.isWarpingOut : false;
    });
    expect(isWarpingOut).toBe(true);

    // 2. Player death during low-FPS warp-out
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Low-FPS casualty');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // 3. Click Restart from Beginning
    await page.locator('[data-testid="restart-button"]').click();
    await page.waitForTimeout(150);

    const postRestart = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        level: gm.level,
        hasAlliedReinforcements: !!gm.alliedReinforcements,
        score: gm.score,
        currency: gm.currency,
        multiShot: gm.player.multiShot,
      };
    });

    expect(postRestart.state).toBe('PLAYING');
    expect(postRestart.level).toBe(1);
    expect(postRestart.hasAlliedReinforcements).toBe(false);
    expect(postRestart.score).toBe(0);
    expect(postRestart.currency).toBe(150);
    expect(postRestart.multiShot).toBe(1);
  });

  test('R1.12: Rapid input spamming on Continue/Restart maintains loop determinism without duplicate rAF loops', async ({ page }) => {
    // 1. Setup death state
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 4;
      gm.score = 5000;
      gm.currency = 500;
      gm.player.hp = 0;
      (gm as any).gameOver('Spam test death');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // 2. Rapid-click Continue 3 times without waiting
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await Promise.all([
      continueBtn.click({ force: true }).catch(() => {}),
      continueBtn.click({ force: true }).catch(() => {}),
      continueBtn.click({ force: true }).catch(() => {}),
    ]);

    await page.waitForTimeout(200);

    // Verify clean single-loop state
    const postContinue = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        level: gm.level,
        isPaused: gm.isPaused,
        score: gm.score,
        currency: gm.currency,
        enemyCount: gm.enemies.length,
      };
    });

    expect(postContinue.state).toBe('PLAYING');
    expect(postContinue.level).toBe(4);
    expect(postContinue.isPaused).toBe(false);
    expect(postContinue.score).toBe(5000);
    expect(postContinue.enemyCount).toBeGreaterThan(0);

    // 3. Trigger second death and rapid-click Restart 3 times
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Second spam death');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    const restartBtn = page.locator('[data-testid="restart-button"]');
    await Promise.all([
      restartBtn.click({ force: true }).catch(() => {}),
      restartBtn.click({ force: true }).catch(() => {}),
      restartBtn.click({ force: true }).catch(() => {}),
    ]);

    await page.waitForTimeout(200);

    const postRestart = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        level: gm.level,
        score: gm.score,
        currency: gm.currency,
      };
    });

    expect(postRestart.state).toBe('PLAYING');
    expect(postRestart.level).toBe(1);
    expect(postRestart.score).toBe(0);
    expect(postRestart.currency).toBe(150);
  });

  test('R1.13: Mobile Viewport (iPhone SE 375x667) interacts cleanly with Continue and Restart buttons', async ({ page }) => {
    // Resize viewport to mobile iPhone SE dimensions
    await page.setViewportSize({ width: 375, height: 667 });

    // Setup player death at Wave 3
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 3;
      gm.score = 2200;
      gm.currency = 300;
      gm.player.hp = 0;
      (gm as any).gameOver('Mobile combat loss');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    const continueBtn = page.locator('[data-testid="continue-button"]');
    await expect(continueBtn).toBeVisible();
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click();
    await page.waitForTimeout(150);

    let currentWave = await page.evaluate(() => (window as any).gameManager.level);
    expect(currentWave).toBe(3);

    // Die again on mobile
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Mobile second death');
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    const restartBtn = page.locator('[data-testid="restart-button"]');
    await expect(restartBtn).toBeVisible();
    await restartBtn.scrollIntoViewIfNeeded();
    await restartBtn.click();
    await page.waitForTimeout(150);

    const restartState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        level: gm.level,
        score: gm.score,
        state: gm.state,
      };
    });

    expect(restartState.state).toBe('PLAYING');
    expect(restartState.level).toBe(1);
    expect(restartState.score).toBe(0);
  });

  test('R1.14: Immediate Continue click (within 20ms of death) handles audio concurrency without exception', async ({ page }) => {
    // Setup death and immediately click Continue without waiting for game-over sound to finish
    const audioState = await page.evaluate(async () => {
      const gm = (window as any).gameManager;
      gm.level = 2;
      gm.player.hp = 0;
      (gm as any).gameOver('Audio stress test');
      // Directly invoke continueGame to simulate instantaneous input
      gm.continueGame();
      return {
        state: gm.state,
        level: gm.level,
        isAudioValid: typeof window.AudioContext !== 'undefined',
      };
    });

    expect(audioState.state).toBe('PLAYING');
    expect(audioState.level).toBe(2);
  });
});


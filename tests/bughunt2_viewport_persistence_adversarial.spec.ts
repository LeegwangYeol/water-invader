import { test, expect } from '@playwright/test';

test.describe('Adversarial Bughunt 2: Viewport UI & Pre-Continue Shop State Persistence', () => {

  // Helper to ensure page is loaded and game started
  async function startGame(page: any) {
    let retries = 5;
    while (retries > 0) {
      try {
        await page.goto('/', { timeout: 15000 });
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas');

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
    await page.waitForTimeout(100);
  }

  // =========================================================================
  // CHALLENGE 1: GAME OVER TANK REPAIR ECONOMY & PRE-CONTINUE SHOP PERSISTENCE
  // =========================================================================
  test('Challenge 1: Game Over Tank Repair Economy carries +1 HP into Pre-Continue Shop (4/5) and live wave without clamp to 3', async ({ page }) => {
    await startGame(page);

    // 1. Simulate player death at Wave 2 with 200 pure water currency
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 2;
      gm.score = 2500;
      gm.currency = 200;
      (gm as any).updateScoreUI();
      (gm as any).updateUpgradesUI();
      gm.player.hp = 0;
      (gm as any).gameOver('시험용 격추 (Adversarial Death)');
    });
    await page.waitForTimeout(100);

    // 2. Verify GameOverModal is visible with distinct Continue and Restart options
    await expect(page.locator('text=GAME OVER')).toBeVisible();
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await expect(continueBtn).toBeVisible();

    // 3. Inspect Repair Tank in GameOverModal:
    // Revived base HP is 3, so display should be (3/5), cost 75 💧
    const repairRow = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ });
    await expect(repairRow).toBeVisible();
    const repairBtn = repairRow.locator('button');
    await expect(repairRow.locator('p.font-bold')).toHaveText(/3\/5/);
    await expect(repairBtn).toHaveText('75 💧');
    await expect(repairBtn).toBeEnabled();

    // 4. Buy Repair Tank in GameOverModal (deducting 75 currency)
    await repairBtn.click();
    await page.waitForTimeout(50);

    // Verify GameOverModal state: currency 200 - 75 = 125, HP 3 -> 4
    const gameOverStateAfterRepair = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        currency: gm.currency,
        playerHp: gm.player.hp,
      };
    });
    expect(gameOverStateAfterRepair.currency).toBe(125);
    expect(gameOverStateAfterRepair.playerHp).toBe(4);
    await expect(repairRow.locator('p.font-bold')).toHaveText(/4\/5/);

    // 5. Click Continue -> Must open Pre-Continue Shop Modal
    await continueBtn.click();
    await page.waitForTimeout(150);

    // 6. ADVERSARIAL VERIFICATION:
    // In Pre-Continue Shop, verify that HP is 4/5 (or higher), NOT clamped back to 3!
    const preContinueShopState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        playerHp: gm.player.hp,
        currency: gm.currency,
        level: gm.level,
      };
    });

    expect(preContinueShopState.state).toBe('SHOP');
    expect(preContinueShopState.currency).toBe(125); // Properly deducted 75
    expect(preContinueShopState.playerHp).toBe(4); // NOT CLAMPED TO 3!

    // Verify Pre-Continue Shop UI reflects 4/5 and 125 currency
    const shopRepairRow = page.locator('div.flex.justify-between').filter({ hasText: /Repair Tank|탱크 수리/ });
    await expect(shopRepairRow.locator('p.font-bold')).toHaveText(/4\/5/);

    // 7. Purchase Repair Tank a second time in Pre-Continue Shop (4 -> 5 HP, cost 75)
    const shopRepairBtn = shopRepairRow.locator('button');
    await expect(shopRepairBtn).toBeEnabled();
    await shopRepairBtn.click();
    await page.waitForTimeout(50);

    const afterSecondRepair = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        currency: gm.currency,
        playerHp: gm.player.hp,
      };
    });
    expect(afterSecondRepair.currency).toBe(50); // 125 - 75
    expect(afterSecondRepair.playerHp).toBe(5);
    await expect(shopRepairRow.locator('p.font-bold')).toHaveText(/5\/5/);
    await expect(shopRepairBtn).toHaveText('MAX');
    await expect(shopRepairBtn).toBeDisabled();

    // 8. Click Resume Wave -> Enter live game
    const resumeBtn = page.locator('[data-testid="resume-wave-button"]');
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();
    await page.waitForTimeout(150);

    // 9. Verify live gameplay state preserves HP 5, currency 50, level 2, and 1.5s i-frames
    const liveGameState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        hp: gm.player.hp,
        currency: gm.currency,
        level: gm.level,
        invincibilityTimer: gm.player.invincibilityTimer,
      };
    });

    expect(liveGameState.state).toBe('PLAYING');
    expect(liveGameState.hp).toBe(5); // Full benefit received!
    expect(liveGameState.currency).toBe(50);
    expect(liveGameState.level).toBe(2);
    expect(liveGameState.invincibilityTimer).toBeGreaterThan(0);
  });

  // =========================================================================
  // CHALLENGE 2: EMERGENCY ALLIES RESET ON CONTINUE
  // =========================================================================
  test('Challenge 2: emergencyAlliesTriggeredThisWave is reset upon death and Continue, allowing reinforcements to trigger again on resumed wave', async ({ page }) => {
    await startGame(page);

    // 1. Setup Wave 2 with damaged barricades (maxHp is 20)
    const beforeTickState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 2;
      // Damage 2 central barricades (maxHp is 20)
      gm.barricades[0].hp = 10;
      gm.barricades[1].hp = 10;
      // Set player HP to 1 (emergency survival threshold)
      gm.player.hp = 1;
      const initialTriggered = gm.emergencyAlliesTriggeredThisWave;
      // Tick game engine to evaluate survival threshold
      gm.update(0.016);
      return {
        initialTriggered,
        emergencyTriggered: gm.emergencyAlliesTriggeredThisWave,
        helperCount: gm.helpers.length,
      };
    });

    // 2. Verify emergency allies triggered for the first time
    expect(beforeTickState.initialTriggered).toBe(false);
    expect(beforeTickState.emergencyTriggered).toBe(true);
    expect(beforeTickState.helperCount).toBeGreaterThan(0);

    // 3. Player dies on Wave 2
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Died after emergency allies');
    });
    await page.waitForTimeout(100);

    // 4. Click Continue -> Pre-Continue Shop -> Click Resume Wave
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();
    await page.waitForTimeout(100);

    const resumeBtn = page.locator('[data-testid="resume-wave-button"]');
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();
    await page.waitForTimeout(100);

    // 5. ADVERSARIAL VERIFICATION ON RESUMED WAVE:
    // Invariant: emergencyAlliesTriggeredThisWave must be reset to false!
    const continuedWaveInitialState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        emergencyTriggered: gm.emergencyAlliesTriggeredThisWave,
        playerHp: gm.player.hp,
      };
    });
    expect(continuedWaveInitialState.state).toBe('PLAYING');
    expect(continuedWaveInitialState.emergencyTriggered).toBe(false); // CRITICAL RESET VERIFIED!

    // 6. Now simulate low HP again on the resumed wave with 2 damaged barricades
    const helperCountBeforeSecondEmergency = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      // Damage barricades again (maxHp is 20)
      gm.barricades[0].hp = 10;
      gm.barricades[1].hp = 10;
      // Drop player HP to 1
      gm.player.hp = 1;
      const initialHelpers = gm.helpers.length;
      // Tick game engine to re-evaluate emergency threshold
      gm.update(0.016);
      return {
        initialHelpers,
        newHelpers: gm.helpers.length,
        emergencyTriggeredAgain: gm.emergencyAlliesTriggeredThisWave,
      };
    });

    // 7. Verify emergency allies successfully triggered a SECOND time on the continued wave!
    expect(helperCountBeforeSecondEmergency.emergencyTriggeredAgain).toBe(true);
    expect(helperCountBeforeSecondEmergency.newHelpers).toBeGreaterThan(helperCountBeforeSecondEmergency.initialHelpers);
  });

  // =========================================================================
  // CHALLENGE 3: MOBILE TOUCH CONTROLS (>= 44px HEIGHT ACROSS 500px..900px)
  // =========================================================================
  const testHeights = [500, 568, 600, 667, 700, 750, 800, 844, 900];

  for (const height of testHeights) {
    test(`Challenge 3A: Mobile Touch Controls (ALLY, ULT, FIRE) maintain >= 44px height at viewport 375x${height}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height });
      await startGame(page);

      // Verify controls wrapper is visible in PLAYING state
      const wrapper = page.locator('[data-testid="mobile-controls-wrapper"]');
      await expect(wrapper).toBeVisible();

      // Measure bounding boxes for ALLY, ULT, FIRE buttons
      const allyBtn = wrapper.locator('button', { hasText: 'ALLY(Q)' });
      const ultBtn = wrapper.locator('button', { hasText: /ULT/ });
      const fireBtn = wrapper.locator('button', { hasText: 'FIRE!' });

      await expect(allyBtn).toBeVisible();
      await expect(ultBtn).toBeVisible();
      await expect(fireBtn).toBeVisible();

      const allyBox = await allyBtn.boundingBox();
      const ultBox = await ultBtn.boundingBox();
      const fireBox = await fireBtn.boundingBox();

      expect(allyBox).not.toBeNull();
      expect(ultBox).not.toBeNull();
      expect(fireBox).not.toBeNull();

      if (allyBox && ultBox && fireBox) {
        console.log(`[TOUCH_TARGET:375x${height}] ALLY: ${allyBox.height.toFixed(1)}px, ULT: ${ultBox.height.toFixed(1)}px, FIRE: ${fireBox.height.toFixed(1)}px`);
        expect(allyBox.height).toBeGreaterThanOrEqual(44);
        expect(ultBox.height).toBeGreaterThanOrEqual(44);
        expect(fireBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  }

  // =========================================================================
  // CHALLENGE 4: MODAL ACTION BUTTONS ACCESSIBILITY ON SMALL VIEWPORTS
  // =========================================================================
  test('Challenge 4: Modal action buttons in GameOverModal and ShopModal are fully accessible and clickable on Mobile SE (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await startGame(page);

    // 1. Stage player death
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      (gm as any).gameOver('Mobile SE Modal Test');
    });
    await page.waitForTimeout(100);

    // 2. GameOverModal CTA buttons check
    const continueBtn = page.locator('[data-testid="continue-button"]');
    const restartBtn = page.locator('[data-testid="restart-button"]');

    await expect(continueBtn).toBeVisible();
    await expect(restartBtn).toBeVisible();

    const continueBox = await continueBtn.boundingBox();
    const restartBox = await restartBtn.boundingBox();
    expect(continueBox).not.toBeNull();
    expect(restartBox).not.toBeNull();

    // Verify buttons are within visible viewport height (<= 667px)
    expect(continueBox!.y + continueBox!.height).toBeLessThanOrEqual(667);
    expect(restartBox!.y + restartBox!.height).toBeLessThanOrEqual(667);

    // 3. Test Continue click
    await continueBtn.click();
    await page.waitForTimeout(150);

    // 4. ShopModal (Pre-Continue) CTA button check
    const resumeBtn = page.locator('[data-testid="resume-wave-button"]');
    await expect(resumeBtn).toBeVisible();
    const resumeBox = await resumeBtn.boundingBox();
    expect(resumeBox).not.toBeNull();
    expect(resumeBox!.y + resumeBox!.height).toBeLessThanOrEqual(667);

    // 5. Test Resume Wave click
    await resumeBtn.click();
    await page.waitForTimeout(150);

    const resumedState = await page.evaluate(() => (window as any).gameManager.state);
    expect(resumedState).toBe('PLAYING');

    // 6. Test Pre-Game Shop modal button accessibility
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      (gm as any).restartFromBeginning();
    });
    await page.waitForTimeout(150);

    // Open Pre-Game Shop from menu
    const shopBtn = page.locator('button', { hasText: /ARMORY \/ SHOP/ });
    if (await shopBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await shopBtn.click();
      await page.waitForTimeout(100);

      const startMissionBtn = page.locator('[data-testid="start-mission-button"]');
      await expect(startMissionBtn).toBeVisible();
      const startBox = await startMissionBtn.boundingBox();
      expect(startBox).not.toBeNull();
      expect(startBox!.y + startBox!.height).toBeLessThanOrEqual(667);
      await startMissionBtn.click();
      await page.waitForTimeout(100);
      const afterStartMissionState = await page.evaluate(() => (window as any).gameManager.state);
      expect(afterStartMissionState).toBe('PLAYING');
    }
  });

  // =========================================================================
  // CHALLENGE 5: TOPHUD ENEMY SPAWN OCCLUSION AT LOGICAL y IN [50, 90]
  // =========================================================================
  const mobileAuditViewports = [
    { name: 'Mobile SE (375x667)', width: 375, height: 667 },
    { name: 'Mobile Modern (390x844)', width: 390, height: 844 },
    { name: 'Mobile Tall (412x915)', width: 412, height: 915 },
  ];

  for (const vp of mobileAuditViewports) {
    test(`Challenge 5: TopHUD cards do not occlude enemy spawns at logical y in [50, 90] on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await startGame(page);

      const hudMetrics = await page.evaluate(() => {
        const hudContainer = document.querySelector('.absolute.top-0.left-0.w-full') as HTMLElement;
        const hudLeft = hudContainer?.children[0] as HTMLElement;
        const hudRight = hudContainer?.children[1] as HTMLElement;
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;

        const canvasRect = canvas.getBoundingClientRect();
        const leftRect = hudLeft.getBoundingClientRect();
        const rightRect = hudRight.getBoundingClientRect();

        const corridorWidth = rightRect.left - leftRect.right;
        const maxHudHeight = Math.max(leftRect.height, rightRect.height);

        // Logical coordinates: logicalWidth = 600, logicalHeight = 800
        const scaleX = canvasRect.width / 600;
        const scaleY = canvasRect.height / 800;

        // Enemy spawn points at logical y in [50, 90]
        const screenY50 = canvasRect.top + 50 * scaleY;
        const screenY90 = canvasRect.top + 90 * scaleY;

        // Container pointer-events
        const containerPointerEvents = window.getComputedStyle(hudContainer).pointerEvents;

        // Background styling
        const leftBgStyle = window.getComputedStyle(hudLeft).backgroundColor;

        return {
          corridorWidth,
          maxHudHeight,
          screenY50,
          screenY90,
          leftRectRight: leftRect.right,
          rightRectLeft: rightRect.left,
          containerPointerEvents,
          leftBgStyle,
        };
      });

      console.log(`[TOPHUD_AUDIT:${vp.name}] Corridor: ${hudMetrics.corridorWidth.toFixed(1)}px, Max HUD Height: ${hudMetrics.maxHudHeight.toFixed(1)}px`);

      // 1. Center corridor must be >= 110px wide to provide open view for descending enemies
      expect(hudMetrics.corridorWidth).toBeGreaterThanOrEqual(110);

      // 2. HUD height must be compact (<= 60px) on mobile
      expect(hudMetrics.maxHudHeight).toBeLessThanOrEqual(60);

      // 3. Container must have pointer-events: none so clicks and touches reach game canvas
      expect(hudMetrics.containerPointerEvents).toBe('none');
    });
  }

});

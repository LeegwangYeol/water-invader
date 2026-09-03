import { test, expect } from '@playwright/test';

test.describe('E2E Integration Suite: 12-Crisis Expansion & Massive Allied Reinforcements', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    // Click Start Game button (supports English and Korean labels)
    await page.click('button:has-text("게임 시작"), button:has-text("START GAME")');
    await page.waitForFunction(() => (window as any).gameManager !== undefined);
  });

  // =========================================================================
  // E2E-12-01: WARNING BANNER RENDERING FOR ALL 12 ARCHETYPES
  // =========================================================================
  test('E2E-12-01: Incursion warning banner renders with uppercase titles across all 12 distinct archetypes', async ({ page }) => {
    const archetypes = [
      { key: 'VOID_SOVEREIGN', title: 'VOID SOVEREIGN' },
      { key: 'ABYSSAL_LEVIATHAN', title: 'ABYSSAL LEVIATHAN' },
      { key: 'CYBERNETIC_EXTERMINATOR', title: 'CYBERNETIC EXTERMINATOR' },
      { key: 'CHRONO_DEVOURER', title: 'CHRONO DEVOURER' },
      { key: 'SOLARIS_COLOSSUS', title: 'SOLARIS COLOSSUS' },
      { key: 'NEBULA_PHANTASM', title: 'NEBULA PHANTASM' },
      { key: 'BIOMORPHIC_SWARM', title: 'BIOMORPHIC SWARM' },
      { key: 'SINGULARITY_CORE', title: 'SINGULARITY CORE' },
      { key: 'NANITE_HARVESTER', title: 'NANITE HARVESTER' },
      { key: 'PSIONIC_SHROUD', title: 'PSIONIC SHROUD' },
      { key: 'GLACIAL_OBLIVION', title: 'GLACIAL OBLIVION' },
      { key: 'COSMIC_DEVOURER', title: 'COSMIC DEVOURER' },
    ];

    expect(archetypes.length).toBe(12);

    for (const arch of archetypes) {
      // Trigger incursion for this archetype
      await page.evaluate((archKey) => {
        const gm = (window as any).gameManager;
        gm.endGameCrisis = null;
        gm.hasEndGameCrisisOccurred = false;
        gm.triggerEndGameCrisis(archKey);
      }, arch.key);

      const banner = page.locator('[data-testid="endgame-crisis-warning-banner"]');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('STELLARIS-STYLE END-GAME CRISIS INCURSION');
      await expect(banner).toContainText(arch.title);
      await expect(banner).toContainText('WARP CONVERGENCE IN');
    }
  });

  // =========================================================================
  // E2E-12-02: TRI-PHASE ACTIVE HUD BADGE PROGRESSION
  // =========================================================================
  test('E2E-12-02: Active HUD status badge updates dynamically across Phase 1, Phase 2, and Phase 3', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerEndGameCrisis('BIOMORPHIC_SWARM');
    });

    // Advance 3.2s through incursion into Phase 1
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.update(3.2);
    });

    const badge = page.locator('[data-testid="endgame-crisis-active-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('PHASE 1: DIMENSIONAL SHIELD ACTIVE');

    // Destroy both flanking anchors -> Transitions to Phase 2
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.riftAnchors[0].takeDamage(3000);
      crisis.riftAnchors[1].takeDamage(3000);
      gm.update(0.016);
    });

    await expect(badge).toContainText('PHASE 2: SOVEREIGN HULL EXPOSED');

    // Deplete sovereign hull (2,500 HP) -> Transitions to Phase 3
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.sovereign.takeDamage(2500);
      gm.update(0.016);
    });

    await expect(badge).toContainText('PHASE 3: CORE OVERDRIVE');
  });

  // =========================================================================
  // E2E-12-03: MASSIVE ALLIED REINFORCEMENTS PARTICIPATION IN PHASE 2
  // =========================================================================
  test('E2E-12-03: Massive Allied Reinforcements automatically arrive at Phase 2 with active dreadnought and escort wings', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerEndGameCrisis('SINGULARITY_CORE');
      // Advance past incursion
      gm.update(3.2);
    });

    // Initially in Phase 1: no allied reinforcements yet
    let hasAllied = await page.evaluate(() => (window as any).gameManager.alliedReinforcements !== undefined);
    expect(hasAllied).toBe(false);

    // Enter Phase 2 by destroying anchors
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.riftAnchors[0].takeDamage(3000);
      crisis.riftAnchors[1].takeDamage(3000);
      gm.update(0.016);
    });

    // Verify Allied Reinforcements automatically summoned
    hasAllied = await page.evaluate(() => (window as any).gameManager.alliedReinforcements !== undefined);
    expect(hasAllied).toBe(true);

    const alliedState = await page.evaluate(() => {
      const allied = (window as any).gameManager.alliedReinforcements;
      return {
        isActive: allied.isActive,
        isWarpingIn: allied.isWarpingIn,
        escortCount: allied.escortFighters.length,
        hasActiveBanner: allied.hasActiveBanner(),
        bannerText: allied.bannerText,
      };
    });

    expect(alliedState.isActive).toBe(true);
    expect(alliedState.escortCount).toBe(2);
    expect(alliedState.hasActiveBanner).toBe(true);
    expect(alliedState.bannerText).toContain('ALLIED REINFORCEMENTS ARRIVED!');
  });

  // =========================================================================
  // E2E-12-04: CRISIS DEFEAT, REWARDS, AND INTERMISSION WAVE PROGRESSION
  // =========================================================================
  test('E2E-12-04: Crisis defeat awards bonus score (+2000), currency (+500), orders allied warp-out, and unlocks Next Wave', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.score = 500;
      gm.currency = 100;
      gm.triggerEndGameCrisis('NANITE_HARVESTER');
      gm.update(3.2); // Phase 1
    });

    // Destroy Rifts (1,200 EHP total) -> Phase 2 & Allied warp in
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.riftAnchors[0].takeDamage(3000);
      crisis.riftAnchors[1].takeDamage(3000);
      gm.update(0.016);
    });

    // Destroy Hull (2,500 HP) -> Phase 3
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.sovereign.takeDamage(2500);
      gm.update(0.016);
    });

    // Destroy Core (1,500 HP) -> Defeat
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.sovereign.takeDamage(1500);
      gm.update(0.016);
    });

    const finalState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        score: gm.score,
        currency: gm.currency,
        alliedWarpingOut: gm.alliedReinforcements?.isWarpingOut,
      };
    });

    expect(finalState.state).toBe('SHOP');
    expect(finalState.score).toBeGreaterThanOrEqual(2500); // 500 + 2000
    expect(finalState.currency).toBeGreaterThanOrEqual(600); // 100 + 500
    expect(finalState.alliedWarpingOut).toBe(true);

    // Wave cleared intermission modal is visible
    const waveClearedModal = page.locator('text=WAVE CLEARED');
    await expect(waveClearedModal).toBeVisible();

    const nextWaveBtn = page.locator('button:has-text("NEXT WAVE")');
    await expect(nextWaveBtn).toBeVisible();
    await nextWaveBtn.click();

    // Advances back to active gameplay without exceptions
    const stateAfterNext = await page.evaluate(() => (window as any).gameManager.state);
    expect(stateAfterNext).toBe('PLAYING');
  });

  // =========================================================================
  // E2E-12-05: MULTI-VIEWPORT RESPONSIVE INTEGRITY & ZERO CONSOLE ERRORS
  // =========================================================================
  test('E2E-12-05: Multi-viewport responsive integrity and zero uncaught browser console errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const testViewports = [
      { width: 1280, height: 800, name: 'Desktop' },
      { width: 390, height: 844, name: 'Mobile' },
    ];

    for (const vp of testViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.triggerEndGameCrisis('COSMIC_DEVOURER');
      });

      const canvas = page.locator('canvas');
      const warningBanner = page.locator('[data-testid="endgame-crisis-warning-banner"]');

      await expect(warningBanner).toBeVisible();
      const canvasBox = await canvas.boundingBox();
      const bannerBox = await warningBanner.boundingBox();

      expect(canvasBox).not.toBeNull();
      expect(bannerBox).not.toBeNull();

      if (canvasBox && bannerBox) {
        expect(bannerBox.width).toBeLessThanOrEqual(canvasBox.width + 2);
        expect(bannerBox.height).toBeLessThanOrEqual(canvasBox.height + 2);
      }

      // Simulate 120 combat frames
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        for (let i = 0; i < 120; i++) {
          gm.update(0.016);
        }
      });
    }

    expect(pageErrors.length).toBe(0);
  });
});

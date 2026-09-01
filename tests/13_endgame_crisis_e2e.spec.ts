import { test, expect } from '@playwright/test';

test.describe('E2E Browser Tests: Stellaris-Style End-Game Crisis (Milestone 2)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    // Start game
    await page.click('button:has-text("게임 시작"), button:has-text("START GAME")');
    await page.waitForFunction(() => (window as any).gameManager !== undefined);
  });

  test('E2E-C1: End-Game Crisis Incursion triggers full-screen warning overlay banner and cataclysm alarm', async ({ page }) => {
    // Trigger crisis via exposed GameManager
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerEndGameCrisis('VOID_SOVEREIGN');
    });

    // Check that warning banner is present in DOM
    const banner = page.locator('[data-testid="endgame-crisis-warning-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('STELLARIS-STYLE END-GAME CRISIS INCURSION');
    await expect(banner).toContainText('VOID SOVEREIGN');
    await expect(banner).toContainText('WARP CONVERGENCE IN');
  });

  test('E2E-C2: End-Game Crisis Phase progression updates HUD Active Badge from Phase 1 to Phase 3', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerEndGameCrisis('DIMENSIONAL_DEVOURER');
    });

    // Fast-forward through incursion warning (3.0s)
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.update(3.2);
    });

    // Verify Phase 1 Active Badge
    const badge = page.locator('[data-testid="endgame-crisis-active-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('PHASE 1: DIMENSIONAL SHIELD ACTIVE');

    // Destroy both rifts -> Phase 2
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.riftAnchors[0].takeDamage(600);
      crisis.riftAnchors[1].takeDamage(600);
      gm.update(0.016);
    });

    await expect(badge).toContainText('PHASE 2: SOVEREIGN HULL EXPOSED');

    // Destroy Hull (2,500 HP) -> Phase 3
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.sovereign.takeDamage(2500);
      gm.update(0.016);
    });

    await expect(badge).toContainText('PHASE 3: CORE OVERDRIVE');
  });

  test('E2E-C3: End-Game Crisis Defeat awards massive rewards (+2000 score, +500 cash) and transitions to SHOP', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.score = 100;
      gm.currency = 50;
      gm.triggerEndGameCrisis('CYBERNETIC_EXTERMINATOR');
    });

    // Fast-forward past incursion
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.update(3.2);
    });

    // Destroy Rifts (1,200 EHP total)
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.riftAnchors[0].takeDamage(600);
      crisis.riftAnchors[1].takeDamage(600);
      gm.update(0.016);
    });

    // Destroy Hull (2,500 HP)
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

    // Check that state transitioned to SHOP and rewards were granted
    const gameState = await page.evaluate(() => (window as any).gameManager.state);
    const score = await page.evaluate(() => (window as any).gameManager.score);
    const currency = await page.evaluate(() => (window as any).gameManager.currency);

    expect(gameState).toBe('SHOP');
    expect(score).toBeGreaterThanOrEqual(2100); // 100 + 2000 bonus
    expect(currency).toBeGreaterThanOrEqual(550); // 50 + 500 bonus

    // Shop modal / Intermission UI is visible
    const shopModal = page.locator('text=WAVE CLEARED');
    await expect(shopModal).toBeVisible();
    const nextWaveBtn = page.locator('button:has-text("NEXT WAVE")');
    await expect(nextWaveBtn).toBeVisible();
  });
});

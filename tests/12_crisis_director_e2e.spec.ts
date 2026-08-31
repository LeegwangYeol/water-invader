import { test, expect } from '@playwright/test';

test.describe('E2E Browser Tests: Crisis Director & HUD Overlays', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('HUD Crisis Warning Banner renders with animated border and alert text', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();

    // Trigger TITAN_HORDE crisis
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerCrisis('TITAN_HORDE');
    });

    const banner = page.locator('[data-testid="crisis-warning-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('EMERGENCY CRISIS DETECTED');
    await expect(banner).toContainText('TITAN BIO-MECH ESCORT HORDE');

    // Wait for warning timer to elapse (2.0s)
    await page.waitForTimeout(2200);

    // Warning banner should unmount once active phase starts
    await expect(banner).not.toBeVisible();
  });

  test('HUD EMP Suppression Badge renders when EMP crisis is active', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();

    // Trigger EMP_DISRUPTION crisis
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerCrisis('EMP_DISRUPTION');
    });

    // Advance past 2s warning into active phase
    await page.waitForTimeout(2200);

    const empBadge = page.locator('[data-testid="emp-suppression-badge"]');
    await expect(empBadge).toBeVisible();
    await expect(empBadge).toContainText('WEAPONS SUPPRESSED (EMP ACTIVE)');

    // After 2.5s EMP expires, badge disappears
    await page.waitForTimeout(2800);
    await expect(empBadge).not.toBeVisible();
  });

  test('HUD Acid Storm Badge renders during active Acid Storm hazard phase', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();

    // Trigger ACID_STORM crisis
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerCrisis('ACID_STORM');
    });

    // Advance past 2s warning into active phase
    await page.waitForTimeout(2200);

    const acidBadge = page.locator('[data-testid="acid-storm-badge"]');
    await expect(acidBadge).toBeVisible();
    await expect(acidBadge).toContainText('TOXIC ACID STORM ACTIVE');
  });
});

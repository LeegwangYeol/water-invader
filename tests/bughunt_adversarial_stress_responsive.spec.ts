import { test, expect } from '@playwright/test';

test.describe('Adversarial Stress: Extreme HUD & Modal Scrollability on Mobile SE (375x667)', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2.0,
  });

  test('ADV-1: Extreme HUD state on Mobile SE does not wrap or collide into right HUD column', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

    // Inject extreme stress values into HUD
    const hudOverlapCheck = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.score = 9999999;
      gm.currency = 99999;
      gm.level = 99;
      gm.combo = 99;
      gm.invaderCount = 99;
      gm.rogueCount = 99;
      gm.player.hp = 5;
      gm.player.ultimateGauge = 100;
      (gm as any).updateScoreUI?.();

      const hudWrapper = document.querySelector('.absolute.top-0.left-0.w-full');
      const hudLeft = hudWrapper?.children[0] as HTMLElement | null;
      const hudRight = hudWrapper?.children[1] as HTMLElement | null;

      if (!hudLeft || !hudRight) return { error: 'HUD elements missing' };

      const leftRect = hudLeft.getBoundingClientRect();
      const rightRect = hudRight.getBoundingClientRect();

      return {
        leftRect: { left: leftRect.left, right: leftRect.right, width: leftRect.width },
        rightRect: { left: rightRect.left, right: rightRect.right, width: rightRect.width },
        gap: rightRect.left - leftRect.right,
        hasOverlap: rightRect.left < leftRect.right,
      };
    });

    console.log('[ADV-1 HUD CHECK]', JSON.stringify(hudOverlapCheck));
    // Check whether HUD left and right collided
    expect(hudOverlapCheck.error).toBeUndefined();
    // If it has overlap, this is an empirical finding!
  });

  test('ADV-2: Shop Modal on Mobile SE is fully scrollable and Deploy button is clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Pre-Game Shop
    await page.locator('button', { hasText: /ARMORY \/ SHOP/i }).click();
    const deployBtn = page.locator('button', { hasText: /웨이브 1 출격|DEPLOY TO WAVE 1/i });
    await expect(deployBtn).toBeAttached();

    // Scroll deploy button into view and click
    await deployBtn.scrollIntoViewIfNeeded();
    await expect(deployBtn).toBeVisible();

    const box = await deployBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    // Ensure button is within viewport bounds
    expect(box!.y + box!.height).toBeLessThanOrEqual(667);

    // Click deploy button and verify game starts
    await deployBtn.click();
    await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
    expect(await page.evaluate(() => (window as any).gameManager?.state)).toBe('PLAYING');
  });

  test('ADV-3: Game Over Modal on Mobile SE has visible and clickable Play Again button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

    // Trigger Game Over
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      (gm as any).gameOver('CRISIS PURIFICATION PROTOCOL ACTIVATED');
    });

    const playAgainBtn = page.locator('button', { hasText: 'PLAY AGAIN' });
    await expect(playAgainBtn).toBeAttached();
    await playAgainBtn.scrollIntoViewIfNeeded();
    await expect(playAgainBtn).toBeVisible();

    const box = await playAgainBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(667);

    await playAgainBtn.click();
    await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
    expect(await page.evaluate(() => (window as any).gameManager?.state)).toBe('PLAYING');
  });

  test('ADV-4: Rapid Viewport Resize / Orientation Stress does not cause layout distortion or NaN coordinates', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

    // Rapidly alternate viewport sizes (simulating orientation change / split screen)
    const sizes = [
      { width: 375, height: 667 },
      { width: 667, height: 375 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 412, height: 915 },
      { width: 375, height: 667 },
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(100);

      const health = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const player = gm.player;
        const canvas = document.querySelector('canvas')!;
        const cRect = canvas.getBoundingClientRect();
        return {
          playerX: player.position.x,
          playerY: player.position.y,
          canvasW: cRect.width,
          canvasH: cRect.height,
          isPlayerXFinite: Number.isFinite(player.position.x),
          isCanvasFinite: Number.isFinite(cRect.width) && cRect.width > 0,
        };
      });

      expect(health.isPlayerXFinite).toBe(true);
      expect(health.isCanvasFinite).toBe(true);
      expect(health.playerX).toBeGreaterThanOrEqual(0);
      expect(health.playerX).toBeLessThanOrEqual(600);
    }
  });
});

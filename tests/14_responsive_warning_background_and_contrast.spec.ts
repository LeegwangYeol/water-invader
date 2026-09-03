import { test, expect } from '@playwright/test';

test.describe('R2: Responsive Warning Backgrounds & Projectile Contrast Suite', () => {

  const viewports = [
    { name: 'Desktop HD', width: 1280, height: 800 },
    { name: 'Mobile iPhone 12/13/14', width: 390, height: 844 },
    { name: 'Mobile iPhone SE', width: 375, height: 667 },
    { name: 'Tablet iPad Mini (Portrait)', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    test(`V1: Viewport [${vp.name} (${vp.width}x${vp.height})] crisis warning banner strictly matches canvas bounds`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('button', { hasText: 'START GAME' }).click();

      // Trigger Crisis Warning
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.triggerCrisis('TITAN_HORDE');
      });

      const canvas = page.locator('canvas');
      const warningBanner = page.locator('[data-testid="crisis-warning-banner"]');
      const mobileControls = page.locator('[data-testid="mobile-controls-wrapper"]');

      await expect(warningBanner).toBeVisible();

      const canvasBox = await canvas.boundingBox();
      const bannerBox = await warningBanner.boundingBox();

      expect(canvasBox).not.toBeNull();
      expect(bannerBox).not.toBeNull();

      if (canvasBox && bannerBox) {
        // Assert Warning Banner boundary matches Canvas boundary within 1.5px subpixel tolerance
        expect(Math.abs(bannerBox.x - canvasBox.x)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.y - canvasBox.y)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.width - canvasBox.width)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.height - canvasBox.height)).toBeLessThanOrEqual(1.5);

        // Assert Warning Banner DOES NOT overlap mobile controls
        if (await mobileControls.isVisible()) {
          const controlsBox = await mobileControls.boundingBox();
          if (controlsBox) {
            expect(bannerBox.y + bannerBox.height).toBeLessThanOrEqual(controlsBox.y + 2);
          }
        }
      }
    });

    test(`V1-B: Viewport [${vp.name} (${vp.width}x${vp.height})] endgame crisis warning banner matches canvas bounds`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('button', { hasText: 'START GAME' }).click();

      // Trigger End-Game Crisis
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.triggerEndGameCrisis('VOID_SOVEREIGN');
      });

      const canvas = page.locator('canvas');
      const endgameBanner = page.locator('[data-testid="endgame-crisis-warning-banner"]');
      const mobileControls = page.locator('[data-testid="mobile-controls-wrapper"]');

      await expect(endgameBanner).toBeVisible();

      const canvasBox = await canvas.boundingBox();
      const bannerBox = await endgameBanner.boundingBox();

      expect(canvasBox).not.toBeNull();
      expect(bannerBox).not.toBeNull();

      if (canvasBox && bannerBox) {
        expect(Math.abs(bannerBox.x - canvasBox.x)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.y - canvasBox.y)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.width - canvasBox.width)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.height - canvasBox.height)).toBeLessThanOrEqual(1.5);

        if (await mobileControls.isVisible()) {
          const controlsBox = await mobileControls.boundingBox();
          if (controlsBox) {
            expect(bannerBox.y + bannerBox.height).toBeLessThanOrEqual(controlsBox.y + 2);
          }
        }
      }
    });
  }

  test('V2: Canvas bitmap corner sampling verifies 100% full-viewport warning fill without gaps', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'START GAME' }).click();

    // Trigger reinforcement warning on canvas
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.warningTimer = 2.0;
      gm.warningMessage = 'ENEMY REINFORCEMENTS INCOMING!';
      (gm as any).draw();
    });

    const cornerCheck = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;

      // Sample pixels at corners: top-left, top-right, bottom-left, bottom-right
      const samplePoint = (x: number, y: number) => {
        const p = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
        return { r: p[0], g: p[1], b: p[2], a: p[3] };
      };

      return {
        topLeft: samplePoint(10 * dpr, 10 * dpr),
        topRight: samplePoint(w - 10 * dpr, 10 * dpr),
        bottomLeft: samplePoint(10 * dpr, h - 10 * dpr),
        bottomRight: samplePoint(w - 10 * dpr, h - 10 * dpr),
      };
    });

    // Verify all 4 corners have active warning color tint (elevated red channel > 20 compared to void #0f172a which has R=15)
    expect(cornerCheck.topLeft.r).toBeGreaterThan(20);
    expect(cornerCheck.topRight.r).toBeGreaterThan(20);
    expect(cornerCheck.bottomLeft.r).toBeGreaterThan(20);
    expect(cornerCheck.bottomRight.r).toBeGreaterThan(20);
  });

  test('V3: Pixel contrast measurement verifies enemy projectiles maintain >= 7:1 contrast ratio against warning background', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'START GAME' }).click();

    const contrastReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;
      const FactionEnum = (window as any).Faction || { PLAYER: 'PLAYER', INVADER: 'INVADER', ROGUE: 'ROGUE' };

      // Set intense red crisis warning background
      gm.warningTimer = 2.0;
      gm.warningMessage = 'RED ALERT CRISIS';

      // Spawn enemy projectile at canvas (300, 400)
      // Bullet size is 10x10, so position (300, 400) has center at exactly (305, 405)
      const bullet = new BulletClass(300, 400, 200, 1, false);
      bullet.faction = FactionEnum.INVADER;
      bullet.color = '#ef4444';
      gm.bullets = [bullet];

      // Render single frame
      (gm as any).draw();

      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = gm.dpr;

      // Extract pixel grid around bullet center (305, 405)
      const cx = Math.round(305 * dpr);
      const cy = Math.round(405 * dpr);

      const corePixel = ctx.getImageData(cx, cy, 1, 1).data;
      const rimPixel = ctx.getImageData(cx + Math.round(6.0 * dpr), cy, 1, 1).data;
      const bgPixel = ctx.getImageData(cx + Math.round(15 * dpr), cy, 1, 1).data;

      // Relative luminance calculation (sRGB per WCAG standards)
      const lum = (r: number, g: number, b: number) => {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const coreLum = lum(corePixel[0], corePixel[1], corePixel[2]);
      const rimLum = lum(rimPixel[0], rimPixel[1], rimPixel[2]);
      const bgLum = lum(bgPixel[0], bgPixel[1], bgPixel[2]);

      const coreContrast = (coreLum + 0.05) / (bgLum + 0.05);

      return {
        coreRGB: [corePixel[0], corePixel[1], corePixel[2]],
        rimRGB: [rimPixel[0], rimPixel[1], rimPixel[2]],
        bgRGB: [bgPixel[0], bgPixel[1], bgPixel[2]],
        coreLum,
        rimLum,
        bgLum,
        coreContrast,
      };
    });

    // White core must be near 1.0 luminance (R, G, B >= 230)
    expect(contrastReport.coreRGB[0]).toBeGreaterThanOrEqual(230);
    expect(contrastReport.coreRGB[1]).toBeGreaterThanOrEqual(230);
    expect(contrastReport.coreRGB[2]).toBeGreaterThanOrEqual(230);

    // Black rim outline must be low luminance (< 0.15)
    expect(contrastReport.rimLum).toBeLessThan(0.15);

    // Core contrast against tinted background must exceed 7:1 (WCAG AAA standard)
    expect(contrastReport.coreContrast).toBeGreaterThanOrEqual(7.0);
  });

  test('V4: Player projectiles maintain high visibility with black armor rim and vibrant core', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'START GAME' }).click();

    const playerReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;
      const FactionEnum = (window as any).Faction || { PLAYER: 'PLAYER', INVADER: 'INVADER', ROGUE: 'ROGUE' };

      // Set third-faction rogue warning background
      gm.warningTimer = 2.0;
      gm.warningMessage = 'ROGUE 3-WAY BATTLE INCOMING';

      // Spawn player projectile at canvas (300, 400)
      // Player bullet is 6x12, center is (303, 406)
      const bullet = new BulletClass(300, 400, -300, 1, true);
      bullet.faction = FactionEnum.PLAYER;
      gm.bullets = [bullet];

      (gm as any).draw();

      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = gm.dpr;

      const cx = Math.round(303 * dpr);
      const cy = Math.round(406 * dpr);

      const corePixel = ctx.getImageData(cx, cy, 1, 1).data;
      const bgPixel = ctx.getImageData(cx + Math.round(15 * dpr), cy, 1, 1).data;

      const lum = (r: number, g: number, b: number) => {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const coreLum = lum(corePixel[0], corePixel[1], corePixel[2]);
      const bgLum = lum(bgPixel[0], bgPixel[1], bgPixel[2]);
      const contrast = (coreLum + 0.05) / (bgLum + 0.05);

      return {
        coreRGB: [corePixel[0], corePixel[1], corePixel[2]],
        bgRGB: [bgPixel[0], bgPixel[1], bgPixel[2]],
        coreLum,
        bgLum,
        contrast,
      };
    });

    expect(playerReport.coreRGB[0]).toBeGreaterThanOrEqual(220);
    expect(playerReport.contrast).toBeGreaterThanOrEqual(7.0);
  });
});

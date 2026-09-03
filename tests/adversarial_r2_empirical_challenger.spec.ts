import { test, expect } from '@playwright/test';

test.describe('Adversarial R2 Empirical Challenge Suite', () => {

  // --------------------------------------------------------------------------
  // Challenge 1: Viewport Stress Test
  // Viewports: 320x568 (Mobile portrait), 390x844 (Mobile portrait),
  //            844x390 (Mobile landscape), 768x1024 (Tablet), 1920x1080 (Desktop FHD)
  // --------------------------------------------------------------------------
  const stressViewports = [
    { name: 'Mobile Portrait Compact (320x568)', width: 320, height: 568 },
    { name: 'Mobile Portrait Standard (390x844)', width: 390, height: 844 },
    { name: 'Mobile Landscape (844x390)', width: 844, height: 390 },
    { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop Full HD (1920x1080)', width: 1920, height: 1080 },
  ];

  for (const vp of stressViewports) {
    test(`Viewport Stress [${vp.name}]: Standard crisis warning banner strictly bounded, no bleed into controls or offscreen`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('button', { hasText: 'START GAME' }).click();

      // Trigger standard crisis warning
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
        // 1. Aspect ratio integrity check: canvas container maintains 3:4 (0.75) within 2% margin
        const containerAspect = canvasBox.width / canvasBox.height;
        expect(containerAspect).toBeGreaterThanOrEqual(0.73);
        expect(containerAspect).toBeLessThanOrEqual(0.77);

        // 2. Strict boundary alignment between warning banner overlay and canvas
        expect(Math.abs(bannerBox.x - canvasBox.x)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.y - canvasBox.y)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.width - canvasBox.width)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(bannerBox.height - canvasBox.height)).toBeLessThanOrEqual(1.5);

        // 3. No offscreen horizontal bleed
        expect(bannerBox.x).toBeGreaterThanOrEqual(-1.0);
        expect(bannerBox.x + bannerBox.width).toBeLessThanOrEqual(vp.width + 1.0);

        // 4. Verification: Warning banner never bleeds into touch controls
        if (await mobileControls.isVisible()) {
          const controlsBox = await mobileControls.boundingBox();
          if (controlsBox) {
            // Banner bottom must be at or above top of mobile controls
            expect(bannerBox.y + bannerBox.height).toBeLessThanOrEqual(controlsBox.y + 2.0);
          }
        }
      }
    });

    test(`Viewport Stress [${vp.name}]: End-game crisis warning banner strictly bounded, no bleed into controls or offscreen`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('button', { hasText: 'START GAME' }).click();

      // Trigger end-game crisis
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

        expect(bannerBox.x).toBeGreaterThanOrEqual(-1.0);
        expect(bannerBox.x + bannerBox.width).toBeLessThanOrEqual(vp.width + 1.0);

        if (await mobileControls.isVisible()) {
          const controlsBox = await mobileControls.boundingBox();
          if (controlsBox) {
            expect(bannerBox.y + bannerBox.height).toBeLessThanOrEqual(controlsBox.y + 2.0);
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // Challenge 2: Shake Displacement Test
  // Active screen shake at amplitudes (1.5, 3.0, 5.0) must preserve 100%
  // edge-to-edge seamless background fill without unpainted slivers.
  // --------------------------------------------------------------------------
  test('Shake Displacement Test: Active screen shake at maximum amplitude (1.5 - 5.0) leaves NO unpainted edge slivers', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'START GAME' }).click();

    const shakeTestResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = gm.dpr || 1;
      const w = canvas.width;
      const h = canvas.height;

      const samplePixel = (x: number, y: number) => {
        const p = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
        return { r: p[0], g: p[1], b: p[2], a: p[3] };
      };

      // Test across three shake magnitudes: 1.5, 3.0, 5.0
      const testAmplitudes = [1.5, 3.0, 5.0];
      const results: Array<{ amplitude: number; frameSamples: any[] }> = [];

      for (const amp of testAmplitudes) {
        const frameSamples = [];

        // Sample 15 distinct frames per amplitude
        for (let frame = 0; frame < 15; frame++) {
          gm.shakeTimer = 1.0;
          gm.warningTimer = 2.0;
          gm.warningMessage = 'CRISIS RED ALERT';

          // Override shake amount to test exact amplitude
          (gm as any).shakeAmount = amp;

          // Force render
          (gm as any).draw();

          // Sample 16 edge and corner locations:
          // 4 corners: (2, 2), (w-3, 2), (2, h-3), (w-3, h-3)
          // 4 top edge points: y = 2, x = [15%, 35%, 65%, 85%]
          // 4 bottom edge points: y = h - 3, x = [15%, 35%, 65%, 85%]
          // 4 left/right edge points: x = 2 and x = w - 3, y = [30%, 70%]
          const samples = {
            corners: [
              samplePixel(2 * dpr, 2 * dpr),
              samplePixel(w - 3 * dpr, 2 * dpr),
              samplePixel(2 * dpr, h - 3 * dpr),
              samplePixel(w - 3 * dpr, h - 3 * dpr),
            ],
            topEdge: [
              samplePixel(w * 0.15, 2 * dpr),
              samplePixel(w * 0.35, 2 * dpr),
              samplePixel(w * 0.65, 2 * dpr),
              samplePixel(w * 0.85, 2 * dpr),
            ],
            bottomEdge: [
              samplePixel(w * 0.15, h - 3 * dpr),
              samplePixel(w * 0.35, h - 3 * dpr),
              samplePixel(w * 0.65, h - 3 * dpr),
              samplePixel(w * 0.85, h - 3 * dpr),
            ],
            leftEdge: [
              samplePixel(2 * dpr, h * 0.30),
              samplePixel(2 * dpr, h * 0.70),
            ],
            rightEdge: [
              samplePixel(w - 3 * dpr, h * 0.30),
              samplePixel(w - 3 * dpr, h * 0.70),
            ],
          };

          frameSamples.push(samples);
        }

        results.push({ amplitude: amp, frameSamples });
      }

      return results;
    });

    // Verification assertions across all amplitudes and frames
    for (const res of shakeTestResults) {
      for (const frame of res.frameSamples) {
        const allEdgePixels = [
          ...frame.corners,
          ...frame.topEdge,
          ...frame.bottomEdge,
          ...frame.leftEdge,
          ...frame.rightEdge,
        ];

        for (const pixel of allEdgePixels) {
          // 1. No unpainted / transparent pixels (Alpha must be 255)
          expect(pixel.a).toBe(255);

          // 2. Red warning background tint must be painted edge-to-edge without gaps
          // Base void is #0f172a (R=15). With red tint, R is >= 20.
          expect(pixel.r).toBeGreaterThanOrEqual(20);
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // Challenge 3: Contrast Metric Challenge
  // Sample pixels of projectiles during red crisis warning background shifts
  // Calculate relative luminance & WCAG AAA contrast ratio (strictly >= 7:1).
  // --------------------------------------------------------------------------
  test('Contrast Metric Challenge: Invader, Rogue, Player, and Interceptable projectiles strictly meet >= 7:1 WCAG AAA', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'START GAME' }).click();

    const metrics = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;
      const FactionEnum = (window as any).Faction || { PLAYER: 'PLAYER', INVADER: 'INVADER', ROGUE: 'ROGUE' };

      // Set intensive red crisis warning background
      gm.warningTimer = 2.0;
      gm.warningMessage = 'CRISIS RED ALERT MAXIMUM CONTRAST TEST';

      // sRGB relative luminance helper (WCAG 2.1 standard definition)
      const getLuminance = (r: number, g: number, b: number) => {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = gm.dpr || 1;

      const testProjectiles = [
        {
          name: 'Invader Bullet (Red)',
          setup: () => {
            const b = new BulletClass(300, 400, 200, 1, false);
            b.faction = FactionEnum.INVADER;
            b.color = '#ef4444';
            return b;
          },
          centerX: 305,
          centerY: 405,
        },
        {
          name: 'Rogue Bullet (Lime/Amber)',
          setup: () => {
            const b = new BulletClass(300, 400, 200, 1, false);
            b.faction = FactionEnum.ROGUE;
            return b;
          },
          centerX: 305,
          centerY: 405,
        },
        {
          name: 'Player Water Bullet (Cyan/White)',
          setup: () => {
            const b = new BulletClass(300, 400, -300, 1, true);
            b.faction = FactionEnum.PLAYER;
            return b;
          },
          centerX: 303,
          centerY: 406,
        },
        {
          name: 'Interceptable Boss Bullet (Purple)',
          setup: () => {
            const b = new BulletClass(300, 400, 150, 2, false);
            b.faction = FactionEnum.INVADER;
            b.isInterceptable = true;
            return b;
          },
          centerX: 305,
          centerY: 405,
        },
      ];

      const projectileResults = [];

      for (const proj of testProjectiles) {
        gm.bullets = [proj.setup()];
        (gm as any).draw();

        const cx = Math.round(proj.centerX * dpr);
        const cy = Math.round(proj.centerY * dpr);

        const corePixel = ctx.getImageData(cx, cy, 1, 1).data;
        const rimPixel = ctx.getImageData(cx + Math.round(6.0 * dpr), cy, 1, 1).data;
        // Background sample 20px away from bullet
        const bgPixel = ctx.getImageData(cx + Math.round(20.0 * dpr), cy, 1, 1).data;

        const coreLum = getLuminance(corePixel[0], corePixel[1], corePixel[2]);
        const rimLum = getLuminance(rimPixel[0], rimPixel[1], rimPixel[2]);
        const bgLum = getLuminance(bgPixel[0], bgPixel[1], bgPixel[2]);

        // Contrast calculation: (L1 + 0.05) / (L2 + 0.05)
        const coreContrastAgainstBg = (coreLum + 0.05) / (bgLum + 0.05);
        const coreContrastAgainstRim = (coreLum + 0.05) / (rimLum + 0.05);

        projectileResults.push({
          name: proj.name,
          coreRGB: [corePixel[0], corePixel[1], corePixel[2]],
          rimRGB: [rimPixel[0], rimPixel[1], rimPixel[2]],
          bgRGB: [bgPixel[0], bgPixel[1], bgPixel[2]],
          coreLum,
          rimLum,
          bgLum,
          coreContrastAgainstBg,
          coreContrastAgainstRim,
        });
      }

      return projectileResults;
    });

    console.log('Test 12 Projectile Results:', JSON.stringify(metrics, null, 2));

    for (const res of metrics) {
      // 1. Core highlight must be high-intensity (R, G, B >= 220)
      expect(res.coreRGB[0]).toBeGreaterThanOrEqual(220);
      expect(res.coreRGB[1]).toBeGreaterThanOrEqual(220);
      expect(res.coreRGB[2]).toBeGreaterThanOrEqual(220);

      // 2. Black armor rim outline must have low luminance (< 0.15)
      expect(res.rimLum).toBeLessThan(0.15);

      // 3. Core contrast against red alert background must strictly meet or exceed 7:1 WCAG AAA
      expect(res.coreContrastAgainstBg).toBeGreaterThanOrEqual(7.0);

      // 4. Core contrast against black rim outline must be stark (> 7:1)
      expect(res.coreContrastAgainstRim).toBeGreaterThanOrEqual(7.0);
    }
  });

  test('Contrast Metric Challenge: Acid Storm Hazard Droplets with black outline maintain high visibility', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'START GAME' }).click();

    const hazardMetric = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      // Set red alert warning background
      gm.warningTimer = 2.0;
      gm.warningMessage = 'ACID STORM WARNING';

      // Spawn Hazard projectile at standard descent coordinate (200, 300)
      const hx = 200;
      const hy = 300;
      const hr = 8;
      gm.hazardProjectiles = [
        { x: hx, y: hy, vx: 0, vy: 150, radius: hr, color: '#a3e635', isDead: false }
      ];

      (gm as any).draw();

      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = gm.dpr || 1;

      // White core highlight is drawn at (hz.x, hz.y + hz.radius * 0.3)
      const coreX = Math.round(hx * dpr);
      const coreY = Math.round((hy + hr * 0.3) * dpr);

      // Body sample is inside the teardrop body at (hz.x, hz.y + hz.radius * 0.7)
      const bodyX = Math.round(hx * dpr);
      const bodyY = Math.round((hy + hr * 0.7) * dpr);

      // Black border outline is at bottom rim (hz.x, hz.y + hz.radius * 1.4)
      const rimX = Math.round(hx * dpr);
      const rimY = Math.round((hy + hr * 1.4) * dpr);

      // Background sample 25px away from droplet
      const bgX = Math.round((hx + 25) * dpr);
      const bgY = Math.round(hy * dpr);

      const corePixel = ctx.getImageData(coreX, coreY, 1, 1).data;
      const bodyPixel = ctx.getImageData(bodyX, bodyY, 1, 1).data;
      const rimPixel = ctx.getImageData(rimX, rimY, 1, 1).data;
      const bgPixel = ctx.getImageData(bgX, bgY, 1, 1).data;

      const getLuminance = (r: number, g: number, b: number) => {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const coreLum = getLuminance(corePixel[0], corePixel[1], corePixel[2]);
      const bodyLum = getLuminance(bodyPixel[0], bodyPixel[1], bodyPixel[2]);
      const rimLum = getLuminance(rimPixel[0], rimPixel[1], rimPixel[2]);
      const bgLum = getLuminance(bgPixel[0], bgPixel[1], bgPixel[2]);

      const coreContrast = (coreLum + 0.05) / (bgLum + 0.05);
      const bodyContrast = (bodyLum + 0.05) / (bgLum + 0.05);

      return {
        coreRGB: [corePixel[0], corePixel[1], corePixel[2]],
        bodyRGB: [bodyPixel[0], bodyPixel[1], bodyPixel[2]],
        rimRGB: [rimPixel[0], rimPixel[1], rimPixel[2]],
        bgRGB: [bgPixel[0], bgPixel[1], bgPixel[2]],
        coreLum,
        bodyLum,
        rimLum,
        bgLum,
        coreContrast,
        bodyContrast,
      };
    });

    console.log('Hazard Metric Result:', JSON.stringify(hazardMetric, null, 2));

    // Core highlight must be high intensity (R,G,B >= 220, luminance near 1.0)
    expect(hazardMetric.coreRGB[0]).toBeGreaterThanOrEqual(220);
    expect(hazardMetric.coreContrast).toBeGreaterThanOrEqual(7.0);

    // Body contrast must also be highly visible (> 7:1 against dark background)
    expect(hazardMetric.bodyContrast).toBeGreaterThanOrEqual(7.0);
  });
});

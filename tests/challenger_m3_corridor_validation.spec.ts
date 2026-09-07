import { test, expect } from '@playwright/test';

interface ViewportCase {
  id: string;
  name: string;
  width: number;
  height: number;
  baselineGap: number; // Pre-M3 measured gap from bughunt_chal_ui_responsive_2
}

const mobileViewports: ViewportCase[] = [
  { id: 'mobile_se', name: 'Mobile SE (375x667)', width: 375, height: 667, baselineGap: 4.61 },
  { id: 'mobile_modern', name: 'Mobile Modern (390x844)', width: 390, height: 844, baselineGap: 19.61 },
  { id: 'mobile_tall', name: 'Mobile Tall (412x915)', width: 412, height: 915, baselineGap: 41.61 },
];

test.describe('Empirical Challenger M3: Center Corridor & Spawn Occlusion Validation', () => {
  for (const vp of mobileViewports) {
    test(`Mobile ${vp.name} Center Corridor is >= 110px wide and >= 110px wider than pre-M3 baseline`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Click start game to render active HUD
      await page.locator('button', { hasText: 'START GAME' }).click();
      await page.waitForSelector('canvas');

      const evaluation = await page.evaluate(() => {
        const hudContainer = document.querySelector('.absolute.top-0.left-0.w-full') as HTMLElement;
        const hudLeft = hudContainer?.children[0] as HTMLElement;
        const hudRight = hudContainer?.children[1] as HTMLElement;
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;

        if (!hudContainer || !hudLeft || !hudRight || !canvas) {
          throw new Error('Required HUD or canvas elements not found');
        }

        const canvasRect = canvas.getBoundingClientRect();
        const leftRect = hudLeft.getBoundingClientRect();
        const rightRect = hudRight.getBoundingClientRect();

        const currentCorridorWidthPx = rightRect.left - leftRect.right;
        const currentHudHeightPx = Math.max(leftRect.height, rightRect.height);

        const scaleY = canvasRect.height / 800;
        const enemySpawnY70_Screen = canvasRect.top + 70 * scaleY;
        const enemySpawnY90_Screen = canvasRect.top + 90 * scaleY;

        return {
          currentCorridorWidthPx,
          currentHudHeightPx,
          leftRect: { right: leftRect.right, width: leftRect.width },
          rightRect: { left: rightRect.left, width: rightRect.width },
          enemySpawnY70_Screen,
          enemySpawnY90_Screen,
        };
      });

      const netCorridorWidening = evaluation.currentCorridorWidthPx - vp.baselineGap;

      console.log(`[CORRIDOR_AUDIT:${vp.id}] Current: ${evaluation.currentCorridorWidthPx.toFixed(2)}px, Baseline: ${vp.baselineGap}px, Net Widening: +${netCorridorWidening.toFixed(2)}px`);

      // 1. Validate that current corridor width is >= 110px
      expect(evaluation.currentCorridorWidthPx).toBeGreaterThanOrEqual(110);

      // 2. Validate that center corridor is >= 110px wider on mobile than baseline
      expect(netCorridorWidening).toBeGreaterThanOrEqual(110.0);

      // 3. Validate that HUD height does not exceed 60px on mobile
      expect(evaluation.currentHudHeightPx).toBeLessThanOrEqual(60);
    });
  }
});

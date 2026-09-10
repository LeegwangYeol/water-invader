import { test, expect } from '@playwright/test';

interface ViewportSpec {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  hasTouch: boolean;
  isMobile: boolean;
}

const VIEWPORT_MATRIX: ViewportSpec[] = [
  {
    id: 'mobile_se',
    name: 'Mobile SE (375x667)',
    width: 375,
    height: 667,
    deviceScaleFactor: 2.0,
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'iphone_14',
    name: 'iPhone 14 / Modern Phone (390x844)',
    width: 390,
    height: 844,
    deviceScaleFactor: 3.0,
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'tablet_portrait',
    name: 'Tablet Portrait (768x1024)',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2.0,
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'tablet_landscape',
    name: 'Tablet Landscape (1024x1366)',
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2.0,
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'desktop_fhd',
    name: 'Desktop Full HD (1920x1080)',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1.0,
    hasTouch: false,
    isMobile: false,
  },
];

async function ensureGameReady(page: any) {
  await page.goto('/');
  await page.waitForSelector('canvas');
  await page.waitForFunction(
    () => (window as any).gameManager != null && (window as any).gameManager.logicalWidth === 600,
    { timeout: 10000 }
  );
}

test.describe('Stream F: Responsive Viewports & CSS Layout Verification Suite', () => {
  for (const vp of VIEWPORT_MATRIX) {
    test.describe(`Matrix Target: ${vp.name}`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        hasTouch: vp.hasTouch,
        isMobile: vp.isMobile,
      });

      test('F1: Architectural Invariants - 600x800 logical canvas & 600*dpr x 800*dpr bitmap buffer', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await ensureGameReady(page);

        // Verify logical dimensions in GameManager instance
        const gmDimensions = await page.evaluate(() => {
          const gm = (window as any).gameManager;
          const canvas = document.querySelector('canvas')!;
          return {
            logicalWidth: gm?.logicalWidth,
            logicalHeight: gm?.logicalHeight,
            dpr: gm?.dpr,
            windowDpr: window.devicePixelRatio,
            canvasWidth: canvas?.width,
            canvasHeight: canvas?.height,
          };
        });

        // Strict architectural invariant: logicalWidth = 600, logicalHeight = 800
        expect(gmDimensions.logicalWidth, 'GameManager logicalWidth must be strictly 600').toBe(600);
        expect(gmDimensions.logicalHeight, 'GameManager logicalHeight must be strictly 800').toBe(800);

        // Internal bitmap buffer is strictly 600 * dpr by 800 * dpr
        const expectedBitmapW = Math.round(600 * vp.deviceScaleFactor);
        const expectedBitmapH = Math.round(800 * vp.deviceScaleFactor);
        expect(gmDimensions.canvasWidth, `Bitmap width must match 600 * dpr (${expectedBitmapW})`).toBe(expectedBitmapW);
        expect(gmDimensions.canvasHeight, `Bitmap height must match 800 * dpr (${expectedBitmapH})`).toBe(expectedBitmapH);

        // Internal aspect ratio is exactly 3/4 = 0.75
        expect(gmDimensions.canvasWidth / gmDimensions.canvasHeight).toBeCloseTo(0.75, 5);

        // Zero console errors during initialization
        expect(consoleErrors).toHaveLength(0);
      });

      test('F2: Aspect Ratio (0.75) and Responsive Canvas Boundary Containment', async ({ page }) => {
        await ensureGameReady(page);

        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible();

        const canvasBox = await canvas.boundingBox();
        expect(canvasBox).not.toBeNull();
        expect(canvasBox!.width).toBeGreaterThan(0);
        expect(canvasBox!.height).toBeGreaterThan(0);

        // Aspect ratio check: 3/4 = 0.75 within subpixel / border tolerance (0.72 - 0.78)
        const renderedAspectRatio = canvasBox!.width / canvasBox!.height;
        expect(
          renderedAspectRatio,
          `Rendered canvas aspect ratio (${renderedAspectRatio}) deviated from 0.75`
        ).toBeGreaterThanOrEqual(0.72);
        expect(
          renderedAspectRatio,
          `Rendered canvas aspect ratio (${renderedAspectRatio}) deviated from 0.75`
        ).toBeLessThanOrEqual(0.78);

        // Canvas container maximum width limit: max-w-[600px] + border
        if (vp.width >= 650) {
          expect(canvasBox!.width).toBeLessThanOrEqual(608);
        }

        // Canvas must fit completely within horizontal viewport
        expect(canvasBox!.x).toBeGreaterThanOrEqual(0);
        expect(canvasBox!.x + canvasBox!.width).toBeLessThanOrEqual(vp.width + 1);
      });

      test('F3: Zero Horizontal Page Overflow across MENU, PLAYING, SHOP, and GAME_OVER states', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await ensureGameReady(page);

        const checkZeroOverflow = async (stateName: string) => {
          const metrics = await page.evaluate(() => {
            const clientW = document.documentElement.clientWidth;
            const scrollW = document.documentElement.scrollWidth;
            const bodyScrollW = document.body.scrollWidth;
            const scrollX = window.scrollX;

            // Audit all elements for right-edge breach
            const elements = Array.from(document.querySelectorAll('*'));
            const overflowing: Array<{ tag: string; id: string; className: string; right: number }> = [];

            for (const el of elements) {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && r.right > clientW + 2) {
                overflowing.push({
                  tag: el.tagName,
                  id: el.id,
                  className: (el.className || '').toString().slice(0, 40),
                  right: r.right,
                });
              }
            }

            return { clientW, scrollW, bodyScrollW, scrollX, overflowing };
          });

          expect(
            metrics.scrollW,
            `document.documentElement.scrollWidth (${metrics.scrollW}) > clientWidth (${metrics.clientW}) in ${stateName}`
          ).toBeLessThanOrEqual(metrics.clientW + 1);

          expect(
            metrics.bodyScrollW,
            `document.body.scrollWidth (${metrics.bodyScrollW}) > clientWidth (${metrics.clientW}) in ${stateName}`
          ).toBeLessThanOrEqual(metrics.clientW + 1);

          expect(
            metrics.overflowing.length,
            `Elements overflowing viewport in ${stateName}: ${JSON.stringify(metrics.overflowing)}`
          ).toBe(0);
        };

        // 1. MENU state
        await checkZeroOverflow('MENU');

        // 2. HOW TO PLAY Modal
        await page.locator('button', { hasText: 'HOW TO PLAY' }).click();
        await expect(page.locator('h2', { hasText: 'HOW TO PLAY' })).toBeVisible();
        await checkZeroOverflow('HOW TO PLAY MODAL');
        await page.locator('button', { hasText: 'CLOSE' }).click();

        // 3. PRE-GAME SHOP state
        await page.locator('button', { hasText: /ARMORY \/ SHOP/i }).click();
        await expect(page.locator('h1', { hasText: /정비소|ARMORY/i })).toBeVisible();
        await checkZeroOverflow('PRE-GAME SHOP');

        // 4. PLAYING state
        const deployBtn = page.locator('[data-testid="start-mission-button"]');
        await deployBtn.scrollIntoViewIfNeeded();
        await deployBtn.click();
        await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
        await checkZeroOverflow('PLAYING');

        // 5. GAME_OVER state
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          (gm as any).gameOver('STREAM F OVERFLOW TEST');
        });
        await expect(page.locator('h1', { hasText: 'GAME OVER' })).toBeVisible();
        await checkZeroOverflow('GAME_OVER');

        expect(consoleErrors).toHaveLength(0);
      });

      test('F4: Touch Controls Positioning - Strictly Outside and Below Canvas, No Gameplay Area Overlap', async ({ page }) => {
        await ensureGameReady(page);
        await page.locator('button', { hasText: 'START GAME' }).click();
        await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

        const canvas = page.locator('canvas');
        const controlsWrapper = page.locator('[data-testid="mobile-controls-wrapper"]');

        const canvasBox = (await canvas.boundingBox())!;
        expect(canvasBox).not.toBeNull();

        await expect(controlsWrapper).toBeVisible();
        const controlsBox = (await controlsWrapper.boundingBox())!;
        expect(controlsBox).not.toBeNull();

        // 1. Mobile controls must be placed strictly below canvas
        const gapBelowCanvas = controlsBox.y - (canvasBox.y + canvasBox.height);
        expect(
          gapBelowCanvas,
          `Mobile controls wrapper overlap canvas bottom! Gap: ${gapBelowCanvas}px`
        ).toBeGreaterThanOrEqual(-1.0);

        // 2. Verify controls do not overlap player ship or bottom gameplay zone
        const playerScreenY = await page.evaluate(() => {
          const gm = (window as any).gameManager;
          const canvasEl = document.querySelector('canvas')!;
          const rect = canvasEl.getBoundingClientRect();
          const pY = gm.player?.position.y || 740;
          return rect.top + (pY / gm.logicalHeight) * rect.height;
        });

        expect(
          controlsBox.y,
          `Controls wrapper top (${controlsBox.y}) overlaps player screen position (${playerScreenY})`
        ).toBeGreaterThan(playerScreenY);

        // 3. Inspect individual button boundaries
        const buttons = [
          { name: 'ALLY', loc: controlsWrapper.locator('button', { hasText: 'ALLY' }) },
          { name: 'ULT', loc: controlsWrapper.locator('button', { hasText: 'ULT' }) },
          { name: 'TORP', loc: controlsWrapper.locator('button', { hasText: 'TORP' }) },
          { name: 'HARP', loc: controlsWrapper.locator('button', { hasText: 'HARP' }) },
          { name: 'FIRE', loc: controlsWrapper.locator('button', { hasText: 'FIRE!' }) },
        ];

        for (const btn of buttons) {
          const box = await btn.loc.boundingBox();
          expect(box, `${btn.name} button must have bounding box`).not.toBeNull();
          expect(box!.y, `${btn.name} button top (${box!.y}) must be below canvas bottom (${canvasBox.y + canvasBox.height})`).toBeGreaterThanOrEqual(canvasBox.y + canvasBox.height - 1.0);
          expect(box!.x, `${btn.name} button left must be >= 0`).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width, `${btn.name} button right must be <= viewport width`).toBeLessThanOrEqual(vp.width + 1.0);
        }
      });

      test('F5: TopHUD, Warning Banners, and Flagship Overlays Contained within Canvas Bounding Box', async ({ page }) => {
        await ensureGameReady(page);
        await page.locator('button', { hasText: 'START GAME' }).click();
        await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

        const canvas = page.locator('canvas');
        const canvasBox = (await canvas.boundingBox())!;

        // 1. TopHUD Layout & Containment
        const hudMetrics = await page.evaluate(() => {
          const hudWrapper = document.querySelector('.absolute.top-0.left-0.w-full');
          const hudLeft = hudWrapper?.children[0] as HTMLElement | null;
          const hudRight = hudWrapper?.children[1] as HTMLElement | null;

          const lRect = hudLeft?.getBoundingClientRect();
          const rRect = hudRight?.getBoundingClientRect();

          return {
            hasLeft: !!lRect,
            hasRight: !!rRect,
            leftRect: lRect ? { left: lRect.left, right: lRect.right, top: lRect.top, bottom: lRect.bottom } : null,
            rightRect: rRect ? { left: rRect.left, right: rRect.right, top: rRect.top, bottom: rRect.bottom } : null,
            centerGap: (lRect && rRect) ? (rRect.left - lRect.right) : 0,
          };
        });

        expect(hudMetrics.hasLeft).toBe(true);
        expect(hudMetrics.hasRight).toBe(true);
        // Ensure left and right HUD cards do not collide in the center
        expect(hudMetrics.centerGap, `HUD center gap collided: ${hudMetrics.centerGap}px`).toBeGreaterThan(0);

        // 2. Standard Crisis Warning Banner Containment
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          gm.triggerCrisis('TITAN_HORDE');
        });

        const crisisBanner = page.locator('[data-testid="crisis-warning-banner"]');
        await expect(crisisBanner).toBeVisible();
        const crisisBox = (await crisisBanner.boundingBox())!;
        expect(Math.abs(crisisBox.x - canvasBox.x)).toBeLessThanOrEqual(2.5);
        expect(Math.abs(crisisBox.y - canvasBox.y)).toBeLessThanOrEqual(2.5);
        expect(Math.abs(crisisBox.width - canvasBox.width)).toBeLessThanOrEqual(2.5);
        expect(Math.abs(crisisBox.height - canvasBox.height)).toBeLessThanOrEqual(2.5);

        // 3. End-Game Crisis Warning Banner Containment
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          gm.triggerEndGameCrisis('VOID_SOVEREIGN');
        });

        const endgameBanner = page.locator('[data-testid="endgame-crisis-warning-banner"]');
        await expect(endgameBanner).toBeVisible();
        const endgameBox = (await endgameBanner.boundingBox())!;
        expect(Math.abs(endgameBox.x - canvasBox.x)).toBeLessThanOrEqual(2.5);
        expect(Math.abs(endgameBox.y - canvasBox.y)).toBeLessThanOrEqual(2.5);
        expect(Math.abs(endgameBox.width - canvasBox.width)).toBeLessThanOrEqual(2.5);
        expect(Math.abs(endgameBox.height - canvasBox.height)).toBeLessThanOrEqual(2.5);

        // 4. Active End-Game Crisis Badge Containment
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          gm.warningTimer = 0;
          if (gm.crisisState) {
            gm.crisisState.warningTimer = 0;
            (gm as any).onCrisisEvent?.(null);
          }
          if (gm.endGameCrisis) {
            gm.endGameCrisis.warningTimer = 0;
            gm.endGameCrisis.phase = 'PHASE_1_SHIELD';
            gm.endGameCrisis.isActive = true;
            (gm as any).onEndGameCrisisEvent?.(gm.endGameCrisis.getState());
          }
        });

        const activeBadge = page.locator('[data-testid="endgame-crisis-active-badge"]');
        await expect(activeBadge).toBeVisible({ timeout: 5000 });
        const badgeBox = (await activeBadge.boundingBox())!;
        expect(badgeBox.x).toBeGreaterThanOrEqual(canvasBox.x - 2.0);
        expect(badgeBox.x + badgeBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width + 2.0);

        // 5. Allied Reinforcement Banner Containment
        const bannerActive = await page.evaluate(() => {
          const gm = (window as any).gameManager;
          gm.triggerMassiveAlliedReinforcements();
          return gm.alliedReinforcementBannerTimer > 0;
        });
        expect(bannerActive).toBe(true);

        const alliedBanner = page.locator('[data-testid="allied-reinforcement-banner"]');
        await expect(alliedBanner).toBeVisible();
        const alliedBox = (await alliedBanner.boundingBox())!;
        expect(alliedBox.x).toBeGreaterThanOrEqual(canvasBox.x - 2.0);
        expect(alliedBox.x + alliedBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width + 2.0);

        // 6. Flagship Subsystem Coordinate Invariant:
        // Flagship systems use logical coordinates (600x800) and render via canvas DPR scale
        const flagshipBounds = await page.evaluate(() => {
          const gm = (window as any).gameManager;
          const fm = gm.flagshipManager;
          return {
            hasFlagshipManager: !!fm,
            logicalWidth: fm?.logicalWidth,
            logicalHeight: fm?.logicalHeight,
          };
        });

        expect(flagshipBounds.hasFlagshipManager).toBe(true);
        expect(flagshipBounds.logicalWidth).toBe(600);
        expect(flagshipBounds.logicalHeight).toBe(800);
      });
    });
  }
});

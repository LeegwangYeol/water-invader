import { test, expect } from '@playwright/test';

interface ViewportConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  isMobile: boolean;
  hasTouch: boolean;
  deviceScaleFactor: number;
}

const targetViewports: ViewportConfig[] = [
  {
    id: 'mobile_se',
    name: 'Mobile SE',
    width: 375,
    height: 667,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2.0,
  },
  {
    id: 'mobile_modern',
    name: 'Mobile Modern',
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3.0,
  },
  {
    id: 'mobile_tall',
    name: 'Mobile Tall',
    width: 412,
    height: 915,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3.5,
  },
  {
    id: 'desktop_standard',
    name: 'Desktop Standard',
    width: 1440,
    height: 900,
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1.0,
  },
  {
    id: 'desktop_wide',
    name: 'Desktop Wide',
    width: 1920,
    height: 1080,
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1.0,
  },
];

test.describe('Adversarial UI & Viewport Responsiveness Suite', () => {
  for (const vp of targetViewports) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        deviceScaleFactor: vp.deviceScaleFactor,
      });

      test('T1: Canvas bounding box and aspect ratio conformance', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible();

        const canvasBox = await canvas.boundingBox();
        expect(canvasBox).not.toBeNull();
        expect(canvasBox!.width).toBeGreaterThan(0);
        expect(canvasBox!.height).toBeGreaterThan(0);

        // Aspect ratio verification (3:4 ratio ~ 0.75, allow border and subpixel tolerance)
        const aspectRatio = canvasBox!.width / canvasBox!.height;
        expect(aspectRatio).toBeGreaterThanOrEqual(0.70);
        expect(aspectRatio).toBeLessThanOrEqual(0.80);

        // Canvas containment within horizontal viewport bounds
        expect(canvasBox!.x).toBeGreaterThanOrEqual(0);
        expect(canvasBox!.x + canvasBox!.width).toBeLessThanOrEqual(vp.width + 1.0);

        // Canvas container max width constraint
        if (vp.width >= 700) {
          expect(canvasBox!.width).toBeLessThanOrEqual(608); // max-w-[600px] + border
        }

        // Internal bitmap resolution check
        const bitmap = await canvas.evaluate((el: HTMLCanvasElement) => ({
          width: el.width,
          height: el.height,
        }));
        expect(bitmap.width).toBeGreaterThan(0);
        expect(bitmap.height).toBeGreaterThan(0);
        expect(bitmap.width / bitmap.height).toBeCloseTo(0.75, 1);
      });

      test('T2: Zero horizontal page overflow across MENU, PLAYING, and MODAL states', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Helper to check horizontal overflow
        const checkHorizontalOverflow = async (stateName: string) => {
          const overflowMetrics = await page.evaluate(() => {
            const docWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const bodyScrollWidth = document.body.scrollWidth;
            const scrollX = window.scrollX;

            // Audit all elements for horizontal right-edge escaping
            const allElements = Array.from(document.querySelectorAll('*'));
            const offenders: { tag: string; id: string; className: string; right: number }[] = [];

            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.right > docWidth + 2) {
                offenders.push({
                  tag: el.tagName,
                  id: el.id,
                  className: (el.className || '').toString().slice(0, 50),
                  right: rect.right,
                });
              }
            }

            return {
              docWidth,
              scrollWidth,
              bodyScrollWidth,
              scrollX,
              offendersCount: offenders.length,
              offenders: offenders.slice(0, 5),
            };
          });

          expect(
            overflowMetrics.scrollWidth,
            `Horizontal scrollWidth exceeded clientWidth in ${stateName}`
          ).toBeLessThanOrEqual(overflowMetrics.docWidth + 1);

          expect(
            overflowMetrics.bodyScrollWidth,
            `Body scrollWidth exceeded clientWidth in ${stateName}`
          ).toBeLessThanOrEqual(overflowMetrics.docWidth + 1);

          expect(
            overflowMetrics.offendersCount,
            `Found ${overflowMetrics.offendersCount} DOM elements overflowing viewport in ${stateName}: ${JSON.stringify(overflowMetrics.offenders)}`
          ).toBe(0);
        };

        // State 1: MENU
        await checkHorizontalOverflow('MENU state');

        // State 2: HOW TO PLAY MODAL
        await page.locator('button', { hasText: 'HOW TO PLAY' }).click();
        await expect(page.locator('h2', { hasText: 'HOW TO PLAY' })).toBeVisible();
        await checkHorizontalOverflow('HOW TO PLAY modal');
        await page.locator('button', { hasText: 'CLOSE' }).click();

        // State 3: PRE-GAME SHOP MODAL
        await page.locator('button', { hasText: /ARMORY \/ SHOP/i }).click();
        await expect(page.locator('h1', { hasText: /정비소|ARMORY/i })).toBeVisible();
        await checkHorizontalOverflow('ARMORY SHOP modal');

        // State 4: PLAYING
        await page.locator('button', { hasText: /웨이브 1 출격|DEPLOY TO WAVE 1/i }).click();
        await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
        await checkHorizontalOverflow('PLAYING state');

        // State 5: GAME OVER MODAL
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          (gm as any).gameOver('TEST GAME OVER');
        });
        await expect(page.locator('h1', { hasText: 'GAME OVER' })).toBeVisible();
        await checkHorizontalOverflow('GAME OVER state');
      });

      test('T3: Touch controls hit area clearance vs canvas boundary and player ship', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.locator('button', { hasText: 'START GAME' }).click();
        await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

        const canvas = page.locator('canvas');
        const mobileControls = page.locator('[data-testid="mobile-controls-wrapper"]');

        const canvasBox = await canvas.boundingBox();
        expect(canvasBox).not.toBeNull();

        const isControlsVisible = await mobileControls.isVisible();
        expect(isControlsVisible).toBe(true);

        const controlsBox = await mobileControls.boundingBox();
        expect(controlsBox).not.toBeNull();

        // Check vertical positioning: Mobile controls MUST be strictly below canvas
        // controlsBox.y should be >= canvasBox.y + canvasBox.height
        const clearanceGap = controlsBox!.y - (canvasBox!.y + canvasBox!.height);
        expect(
          clearanceGap,
          `Mobile controls overlap canvas bottom boundary! Gap: ${clearanceGap}px`
        ).toBeGreaterThanOrEqual(-1.0); // Allow subpixel margin

        // Check individual touch buttons: ALLY, ULT, FIRE
        const allyBtn = mobileControls.locator('button', { hasText: 'ALLY' });
        const ultBtn = mobileControls.locator('button', { hasText: 'ULT' });
        const fireBtn = mobileControls.locator('button', { hasText: 'FIRE!' });

        for (const [btnName, btnLoc] of [
          ['ALLY', allyBtn],
          ['ULT', ultBtn],
          ['FIRE', fireBtn],
        ] as const) {
          const btnBox = await btnLoc.boundingBox();
          expect(btnBox, `${btnName} button bounding box missing`).not.toBeNull();

          // Button must be strictly below canvas bottom
          expect(
            btnBox!.y,
            `${btnName} button overlaps canvas bottom! (btn Y: ${btnBox!.y}, canvas bottom: ${canvasBox!.y + canvasBox!.height})`
          ).toBeGreaterThanOrEqual(canvasBox!.y + canvasBox!.height - 1.0);

          // Button must not overlap player's screen position
          const playerScreenY = await page.evaluate(() => {
            const gm = (window as any).gameManager;
            const canvasEl = document.querySelector('canvas')!;
            const rect = canvasEl.getBoundingClientRect();
            const playerY = gm.player?.position.y || 740;
            return rect.top + (playerY / gm.logicalHeight) * rect.height;
          });

          expect(
            btnBox!.y,
            `${btnName} button overlaps player ship vertical area!`
          ).toBeGreaterThan(playerScreenY);
        }
      });

      test('T4: In-game warning banners, toasts, and badges stay strictly within screen & canvas bounds', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.locator('button', { hasText: 'START GAME' }).click();
        await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

        const canvas = page.locator('canvas');
        const canvasBox = await canvas.boundingBox();
        expect(canvasBox).not.toBeNull();

        // 1. Regular Crisis Warning Banner
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          gm.triggerCrisis('TITAN_HORDE');
        });

        const crisisBanner = page.locator('[data-testid="crisis-warning-banner"]');
        await expect(crisisBanner).toBeVisible();
        const crisisBox = await crisisBanner.boundingBox();
        expect(crisisBox).not.toBeNull();

        // Must match canvas bounds
        expect(Math.abs(crisisBox!.x - canvasBox!.x)).toBeLessThanOrEqual(2.0);
        expect(Math.abs(crisisBox!.y - canvasBox!.y)).toBeLessThanOrEqual(2.0);
        expect(Math.abs(crisisBox!.width - canvasBox!.width)).toBeLessThanOrEqual(2.0);
        expect(Math.abs(crisisBox!.height - canvasBox!.height)).toBeLessThanOrEqual(2.0);

        // Inner text container must fit inside viewport
        const crisisInnerBox = await crisisBanner.locator('> div').boundingBox();
        expect(crisisInnerBox).not.toBeNull();
        expect(crisisInnerBox!.x).toBeGreaterThanOrEqual(0);
        expect(crisisInnerBox!.x + crisisInnerBox!.width).toBeLessThanOrEqual(vp.width + 1.0);

        // 2. End-Game Crisis Warning Banner
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          gm.triggerEndGameCrisis('VOID_SOVEREIGN');
        });

        const endgameBanner = page.locator('[data-testid="endgame-crisis-warning-banner"]');
        await expect(endgameBanner).toBeVisible();
        const endgameBox = await endgameBanner.boundingBox();
        expect(endgameBox).not.toBeNull();

        expect(Math.abs(endgameBox!.x - canvasBox!.x)).toBeLessThanOrEqual(2.0);
        expect(Math.abs(endgameBox!.y - canvasBox!.y)).toBeLessThanOrEqual(2.0);
        expect(Math.abs(endgameBox!.width - canvasBox!.width)).toBeLessThanOrEqual(2.0);
        expect(Math.abs(endgameBox!.height - canvasBox!.height)).toBeLessThanOrEqual(2.0);

        const endgameInnerBox = await endgameBanner.locator('> div').boundingBox();
        expect(endgameInnerBox).not.toBeNull();
        expect(endgameInnerBox!.x).toBeGreaterThanOrEqual(0);
        expect(endgameInnerBox!.x + endgameInnerBox!.width).toBeLessThanOrEqual(vp.width + 1.0);

        // 3. End-Game Crisis Active Badge (Phase 1, Phase 2, Phase 3)
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          if (gm.endGameCrisis) {
            gm.endGameCrisis.warningTimer = 0;
            gm.endGameCrisis.phase = 'PHASE_1_SHIELD';
            gm.endGameCrisis.isActive = true;
            (gm as any).onEndGameCrisisEvent?.(gm.endGameCrisis.getState());
          }
        });

        const activeBadge = page.locator('[data-testid="endgame-crisis-active-badge"]');
        await expect(activeBadge).toBeVisible();
        const badgeBox = await activeBadge.boundingBox();
        expect(badgeBox).not.toBeNull();

        // Badge must be horizontally centered and completely inside canvas and screen
        expect(badgeBox!.x).toBeGreaterThanOrEqual(0);
        expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual(vp.width + 1.0);
        // Also ensure badge does not overflow canvas
        expect(badgeBox!.x).toBeGreaterThanOrEqual(canvasBox!.x - 2.0);
        expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual(canvasBox!.x + canvasBox!.width + 2.0);

        // 4. Allied Reinforcements Canvas Banner Rendering Verification
        const alliedMetrics = await page.evaluate(() => {
          const gm = (window as any).gameManager;
          const allied = gm.triggerAlliedReinforcements();
          return {
            hasActiveBanner: allied.hasActiveBanner(),
            bannerText: allied.bannerText,
            bannerTimer: allied.bannerTimer,
            logicalWidth: gm.logicalWidth,
            logicalHeight: gm.logicalHeight,
          };
        });

        expect(alliedMetrics.hasActiveBanner).toBe(true);
        expect(alliedMetrics.bannerTimer).toBeGreaterThan(0);
        // Logical layout guarantees banner width = min(500, 600 - 30) = 500, placed at (600-500)/2 = 50
        // which leaves 50px safe margins on both left and right inside the 600px canvas!

        // 5. EMP Suppression and Acid Storm Badges
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          (gm as any).onCrisisEvent?.({
            activeCrisis: 'ACID_STORM',
            warningTimer: 0,
            empSuppressionActive: true,
            bannerText: 'ACID STORM & EMP ACTIVE',
          });
        });

        const empBadge = page.locator('[data-testid="emp-suppression-badge"]');
        if (await empBadge.isVisible()) {
          const empBox = await empBadge.boundingBox();
          expect(empBox).not.toBeNull();
          expect(empBox!.x).toBeGreaterThanOrEqual(0);
          expect(empBox!.x + empBox!.width).toBeLessThanOrEqual(vp.width + 1.0);
        }

        const acidBadge = page.locator('[data-testid="acid-storm-badge"]');
        if (await acidBadge.isVisible()) {
          const acidBox = await acidBadge.boundingBox();
          expect(acidBox).not.toBeNull();
          expect(acidBox!.x).toBeGreaterThanOrEqual(0);
          expect(acidBox!.x + acidBox!.width).toBeLessThanOrEqual(vp.width + 1.0);
        }
      });

      test('T5: Exhaustive visual inspection metrics & layout collision audit', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.locator('button', { hasText: 'START GAME' }).click();
        await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

        // Set combo and threat badges to stress-test HUD layout
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          gm.score = 12540;
          gm.currency = 850;
          gm.combo = 15;
          gm.level = 15;
          gm.player.hp = 5;
          gm.player.ultimateGauge = 100;
          (gm as any).updateScoreUI?.();
        });

        const canvas = page.locator('canvas');
        const mobileControls = page.locator('[data-testid="mobile-controls-wrapper"]');
        const canvasBox = (await canvas.boundingBox())!;

        const auditData = await page.evaluate(({ vpWidth, vpHeight }) => {
          const gm = (window as any).gameManager;
          const canvasEl = document.querySelector('canvas')!;
          const cRect = canvasEl.getBoundingClientRect();
          const docEl = document.documentElement;

          // HUD sections
          const hudWrapper = document.querySelector('.absolute.top-0.left-0.w-full');
          const hudLeft = hudWrapper?.children[0] as HTMLElement | null;
          const hudRight = hudWrapper?.children[1] as HTMLElement | null;

          const hudLeftRect = hudLeft ? hudLeft.getBoundingClientRect() : null;
          const hudRightRect = hudRight ? hudRight.getBoundingClientRect() : null;
          const hudCenterGap = (hudLeftRect && hudRightRect) ? (hudRightRect.left - hudLeftRect.right) : null;

          // Canvas Banner text measurements
          const ctx = canvasEl.getContext('2d')!;
          ctx.font = 'bold 15px system-ui, sans-serif';
          const headerW = ctx.measureText('✦ ALLIED REINFORCEMENTS ARRIVED! ✦').width;
          ctx.font = 'bold 12px sans-serif';
          const subtitleW = ctx.measureText('아군 대규모 증원 함대 참전 — AEGIS VANGUARD DREADNOUGHT').width;
          ctx.font = '9px monospace';
          const tickerW = ctx.measureText('HEAVY PLASMA CANNONS: ONLINE  |  PD LASER GRID: ACTIVE  |  NANO-SHIELD: LINKED').width;

          return {
            viewport: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio },
            documentScroll: {
              clientWidth: docEl.clientWidth,
              scrollWidth: docEl.scrollWidth,
              clientHeight: docEl.clientHeight,
              scrollHeight: docEl.scrollHeight,
              hasHorizontalOverflow: docEl.scrollWidth > docEl.clientWidth,
            },
            canvasDOM: {
              x: cRect.x,
              y: cRect.y,
              width: cRect.width,
              height: cRect.height,
              aspectRatio: cRect.width / cRect.height,
            },
            canvasBitmap: {
              width: canvasEl.width,
              height: canvasEl.height,
              logicalWidth: gm.logicalWidth,
              logicalHeight: gm.logicalHeight,
            },
            hudMetrics: {
              leftSection: hudLeftRect ? { left: hudLeftRect.left, right: hudLeftRect.right, width: hudLeftRect.width } : null,
              rightSection: hudRightRect ? { left: hudRightRect.left, right: hudRightRect.right, width: hudRightRect.width } : null,
              centerGap: hudCenterGap,
              hasHudOverlap: hudCenterGap !== null ? hudCenterGap < 0 : false,
            },
            canvasBannerTextMetrics: {
              bannerWidth: Math.min(500, gm.logicalWidth - 30),
              headerWidth: headerW,
              subtitleWidth: subtitleW,
              tickerWidth: tickerW,
              maxTextWidth: Math.max(headerW, subtitleW, tickerW),
              hasBannerTextOverflow: Math.max(headerW, subtitleW, tickerW) > Math.min(500, gm.logicalWidth - 30),
            },
          };
        }, { vpWidth: vp.width, vpHeight: vp.height });

        // Mobile controls measurements
        let controlsMetrics: any = null;
        if (await mobileControls.isVisible()) {
          const cBox = (await mobileControls.boundingBox())!;
          const allyBox = (await mobileControls.locator('button', { hasText: 'ALLY' }).boundingBox())!;
          const ultBox = (await mobileControls.locator('button', { hasText: 'ULT' }).boundingBox())!;
          const fireBox = (await mobileControls.locator('button', { hasText: 'FIRE!' }).boundingBox())!;

          const playerScreenY = await page.evaluate(() => {
            const gm = (window as any).gameManager;
            const canvasEl = document.querySelector('canvas')!;
            const rect = canvasEl.getBoundingClientRect();
            const playerY = gm.player?.position.y || 740;
            return rect.top + (playerY / gm.logicalHeight) * rect.height;
          });

          controlsMetrics = {
            controlsWrapper: cBox,
            allyButton: allyBox,
            ultButton: ultBox,
            fireButton: fireBox,
            gapFromCanvasBottom: cBox.y - (canvasBox.y + canvasBox.height),
            playerScreenY,
            gapFromPlayerShip: cBox.y - playerScreenY,
            obscuresPlayer: cBox.y <= playerScreenY,
            obscuresCanvasBottom: cBox.y < (canvasBox.y + canvasBox.height),
          };
        }

        // Active Endgame Badge measurement
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          gm.triggerEndGameCrisis('VOID_SOVEREIGN');
          if (gm.endGameCrisis) {
            gm.endGameCrisis.warningTimer = 0;
            gm.endGameCrisis.phase = 'PHASE_1_SHIELD';
            gm.endGameCrisis.isActive = true;
            (gm as any).onEndGameCrisisEvent?.(gm.endGameCrisis.getState());
          }
        });

        const activeBadge = page.locator('[data-testid="endgame-crisis-active-badge"]');
        const badgeBox = (await activeBadge.boundingBox())!;
        const badgeMetrics = {
          badgeBox,
          overflowsCanvasLeft: badgeBox.x < (canvasBox.x - 1),
          overflowsCanvasRight: (badgeBox.x + badgeBox.width) > (canvasBox.x + canvasBox.width + 1),
          overflowsScreenLeft: badgeBox.x < 0,
          overflowsScreenRight: (badgeBox.x + badgeBox.width) > vp.width,
        };

        const finalReport = {
          viewportId: vp.id,
          viewportName: vp.name,
          ...auditData,
          controlsMetrics,
          badgeMetrics,
        };

        console.log(`[METRICS_REPORT:${vp.id}]`, JSON.stringify(finalReport));

        // Assertions
        expect(auditData.documentScroll.hasHorizontalOverflow).toBe(false);
        expect(auditData.canvasBannerTextMetrics.hasBannerTextOverflow).toBe(false);
        if (controlsMetrics) {
          expect(controlsMetrics.obscuresPlayer).toBe(false);
          expect(controlsMetrics.obscuresCanvasBottom).toBe(false);
        }
        expect(badgeMetrics.overflowsScreenLeft).toBe(false);
        expect(badgeMetrics.overflowsScreenRight).toBe(false);
      });
    });
  }
});


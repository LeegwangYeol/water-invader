import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

interface DeviceConfig {
  name: string;
  slug: string;
  viewport: { width: number; height: number };
  deviceScaleFactor: number;
}

const devicesToTest: DeviceConfig[] = [
  {
    name: 'Samsung Galaxy S25+',
    slug: 'samsung_galaxy_s25_plus',
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 3.5,
  },
  {
    name: 'iPhone 16 Pro / 15 Pro',
    slug: 'iphone_16_pro',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3.0,
  },
  {
    name: 'iPhone 14 / 13',
    slug: 'iphone_14',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3.0,
  },
  {
    name: 'iPhone SE',
    slug: 'iphone_se',
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2.0,
  },
  {
    name: 'Samsung Galaxy Z Fold',
    slug: 'galaxy_z_fold',
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2.625,
  },
];

for (const dev of devicesToTest) {
  test.describe(`Cross-Device Touch Verification: ${dev.name}`, () => {
    test.use({
      viewport: dev.viewport,
      deviceScaleFactor: dev.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
    });

    const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots', dev.slug);

    test.beforeAll(async () => {
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
    });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const startBtn = page.locator('button', { hasText: 'START GAME' });
      await startBtn.click();
      await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
    });

    test(`1. Initial state alignment & initial screenshot`, async ({ page }) => {
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      const initialPos = await page.evaluate(() => (window as any).gameManager.player.position.x);
      expect(initialPos).toBe(275);

      await page.screenshot({
        path: path.join(screenshotDir, '01_initial_state.png'),
        fullPage: true,
      });
    });

    test(`2. 1:1 Responsive Touch Dragging Right & Left with Screenshot Capture`, async ({ page }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();

      const startX = canvasBox!.x + canvasBox!.width / 2;
      const startY = canvasBox!.y + canvasBox!.height * 0.7;

      // 1. Touch Down at Center
      await page.mouse.move(startX, startY);
      await page.mouse.down();

      // Verify auto-firing on touch
      expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(true);

      // 2. Drag Right by 60 CSS pixels
      const dragDelta = 60;
      await page.mouse.move(startX + dragDelta, startY, { steps: 5 });

      const metricsAfterRight = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const canvasEl = document.querySelector('canvas')!;
        return {
          playerX: gm.player.position.x,
          logicalWidth: gm.logicalWidth,
          clientWidth: canvasEl.clientWidth,
          clientLeft: canvasEl.clientLeft,
        };
      });

      // Expected displacement: dragDelta * (600 / clientWidth)
      const expectedScaleX = 600 / metricsAfterRight.clientWidth;
      const expectedDisplacement = dragDelta * expectedScaleX;
      const expectedRightX = 275 + expectedDisplacement;

      expect(metricsAfterRight.playerX).toBeCloseTo(expectedRightX, 0);

      // Capture screenshot after drag right (using viewport screenshot to avoid fullPage reflow during active drag)
      await page.screenshot({
        path: path.join(screenshotDir, '02_drag_right_aligned.png'),
      });

      // 3. Drag Left by 120 CSS pixels (net -60 from start)
      await page.mouse.move(startX - dragDelta, startY, { steps: 10 });

      const metricsAfterLeft = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          playerX: gm.player.position.x,
        };
      });

      const expectedLeftX = 275 - expectedDisplacement;
      expect(metricsAfterLeft.playerX).toBeCloseTo(expectedLeftX, 0);

      // Capture screenshot after drag left
      await page.screenshot({
        path: path.join(screenshotDir, '03_drag_left_aligned.png'),
      });

      await page.mouse.up();
      expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(false);
    });

    test(`3. Boundary Clamping Verification: Left Clamp (0) & Right Clamp (550) with Screenshots`, async ({ page }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();

      const startX = canvasBox!.x + canvasBox!.width / 2;
      const startY = canvasBox!.y + canvasBox!.height * 0.7;

      await page.mouse.move(startX, startY);
      await page.mouse.down();

      // Drag far beyond left screen edge
      await page.mouse.move(startX - 1000, startY, { steps: 10 });
      const leftX = await page.evaluate(() => (window as any).gameManager.player.position.x);
      expect(leftX).toBe(0);

      await page.screenshot({
        path: path.join(screenshotDir, '04_boundary_clamped_left.png'),
      });

      // Drag far beyond right screen edge
      await page.mouse.move(startX + 2000, startY, { steps: 20 });
      const rightX = await page.evaluate(() => (window as any).gameManager.player.position.x);
      expect(rightX).toBe(550); // 600 - 50 = 550

      await page.screenshot({
        path: path.join(screenshotDir, '05_boundary_clamped_right.png'),
      });

      await page.mouse.up();
    });

    test(`4. Stationary Touch Hold: Zero Drift & Continuous Firing`, async ({ page }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();

      const initialPos = await page.evaluate(() => (window as any).gameManager.player.position.x);
      expect(initialPos).toBe(275);

      const touchX = canvasBox!.x + canvasBox!.width * 0.8;
      const touchY = canvasBox!.y + canvasBox!.height * 0.7;

      await page.mouse.move(touchX, touchY);
      await page.mouse.down();

      expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(true);

      // Hold stationary for 200ms
      await page.waitForTimeout(200);

      const posAfterHold = await page.evaluate(() => (window as any).gameManager.player.position.x);
      expect(posAfterHold).toBe(initialPos);

      await page.mouse.up();
    });

    test(`5. Dynamic Viewport Resizing / Foldable Unfold Resilience`, async ({ page }) => {
      const canvas = page.locator('canvas');
      const initialPos = await page.evaluate(() => (window as any).gameManager.player.position.x);
      expect(initialPos).toBe(275);

      // Simulate folding/unfolding or orientation change by resizing viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
      });
      await page.waitForTimeout(100);

      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();

      const startX = canvasBox!.x + canvasBox!.width / 2;
      const startY = canvasBox!.y + canvasBox!.height * 0.7;

      // Start drag in new viewport
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 80, startY, { steps: 5 });

      const posX = await page.evaluate(() => (window as any).gameManager.player.position.x);
      expect(Number.isFinite(posX)).toBe(true);
      expect(posX).toBeGreaterThan(275);

      await page.mouse.up();
    });

    test(`6. Adversarial NaN & Malformed PointerEvent Immunity`, async ({ page }) => {
      // Simulate extreme coordinate values and test robustness
      await page.evaluate(() => {
        const canvasEl = document.querySelector('canvas')!;
        canvasEl.dispatchEvent(new PointerEvent('pointerdown', {
          pointerId: 99,
          pointerType: 'touch',
          clientX: -99999,
          clientY: -99999,
          bubbles: true,
        }));
        canvasEl.dispatchEvent(new PointerEvent('pointermove', {
          pointerId: 99,
          pointerType: 'touch',
          clientX: 99999,
          clientY: 99999,
          bubbles: true,
        }));
        canvasEl.dispatchEvent(new PointerEvent('pointerup', {
          pointerId: 99,
          pointerType: 'touch',
          bubbles: true,
        }));
      });

      // Player position should remain valid finite number and clamped
      const posX = await page.evaluate(() => (window as any).gameManager.player.position.x);
      expect(Number.isFinite(posX)).toBe(true);
      expect(posX).toBeGreaterThanOrEqual(0);
      expect(posX).toBeLessThanOrEqual(550);
    });
  });
}

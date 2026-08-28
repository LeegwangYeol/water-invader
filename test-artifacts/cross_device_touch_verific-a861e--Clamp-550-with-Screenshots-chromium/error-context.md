# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cross_device_touch_verification.spec.ts >> Cross-Device Touch Verification: Samsung Galaxy Z Fold >> 3. Boundary Clamping Verification: Left Clamp (0) & Right Clamp (550) with Screenshots
- Location: tests/cross_device_touch_verification.spec.ts:147:9

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import * as path from 'path';
  3   | import * as fs from 'fs';
  4   | 
  5   | interface DeviceConfig {
  6   |   name: string;
  7   |   slug: string;
  8   |   viewport: { width: number; height: number };
  9   |   deviceScaleFactor: number;
  10  | }
  11  | 
  12  | const devicesToTest: DeviceConfig[] = [
  13  |   {
  14  |     name: 'Samsung Galaxy S25+',
  15  |     slug: 'samsung_galaxy_s25_plus',
  16  |     viewport: { width: 412, height: 915 },
  17  |     deviceScaleFactor: 3.5,
  18  |   },
  19  |   {
  20  |     name: 'iPhone 16 Pro / 15 Pro',
  21  |     slug: 'iphone_16_pro',
  22  |     viewport: { width: 393, height: 852 },
  23  |     deviceScaleFactor: 3.0,
  24  |   },
  25  |   {
  26  |     name: 'iPhone 14 / 13',
  27  |     slug: 'iphone_14',
  28  |     viewport: { width: 390, height: 844 },
  29  |     deviceScaleFactor: 3.0,
  30  |   },
  31  |   {
  32  |     name: 'iPhone SE',
  33  |     slug: 'iphone_se',
  34  |     viewport: { width: 375, height: 667 },
  35  |     deviceScaleFactor: 2.0,
  36  |   },
  37  |   {
  38  |     name: 'Samsung Galaxy Z Fold',
  39  |     slug: 'galaxy_z_fold',
  40  |     viewport: { width: 375, height: 812 },
  41  |     deviceScaleFactor: 2.625,
  42  |   },
  43  | ];
  44  | 
  45  | for (const dev of devicesToTest) {
  46  |   test.describe(`Cross-Device Touch Verification: ${dev.name}`, () => {
  47  |     test.use({
  48  |       viewport: dev.viewport,
  49  |       deviceScaleFactor: dev.deviceScaleFactor,
  50  |       isMobile: true,
  51  |       hasTouch: true,
  52  |     });
  53  | 
  54  |     const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots', dev.slug);
  55  | 
  56  |     test.beforeAll(async () => {
  57  |       if (!fs.existsSync(screenshotDir)) {
  58  |         fs.mkdirSync(screenshotDir, { recursive: true });
  59  |       }
  60  |     });
  61  | 
  62  |     test.beforeEach(async ({ page }) => {
> 63  |       await page.goto('/');
      |                  ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  64  |       await page.waitForLoadState('networkidle');
  65  |       const startBtn = page.locator('button', { hasText: 'START GAME' });
  66  |       await startBtn.click();
  67  |       await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
  68  |     });
  69  | 
  70  |     test(`1. Initial state alignment & initial screenshot`, async ({ page }) => {
  71  |       const canvas = page.locator('canvas');
  72  |       await expect(canvas).toBeVisible();
  73  | 
  74  |       const initialPos = await page.evaluate(() => (window as any).gameManager.player.position.x);
  75  |       expect(initialPos).toBe(275);
  76  | 
  77  |       await page.screenshot({
  78  |         path: path.join(screenshotDir, '01_initial_state.png'),
  79  |         fullPage: true,
  80  |       });
  81  |     });
  82  | 
  83  |     test(`2. 1:1 Responsive Touch Dragging Right & Left with Screenshot Capture`, async ({ page }) => {
  84  |       const canvas = page.locator('canvas');
  85  |       const canvasBox = await canvas.boundingBox();
  86  |       expect(canvasBox).not.toBeNull();
  87  | 
  88  |       const startX = canvasBox!.x + canvasBox!.width / 2;
  89  |       const startY = canvasBox!.y + canvasBox!.height * 0.7;
  90  | 
  91  |       // 1. Touch Down at Center
  92  |       await page.mouse.move(startX, startY);
  93  |       await page.mouse.down();
  94  | 
  95  |       // Verify auto-firing on touch
  96  |       expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(true);
  97  | 
  98  |       // 2. Drag Right by 60 CSS pixels
  99  |       const dragDelta = 60;
  100 |       await page.mouse.move(startX + dragDelta, startY, { steps: 5 });
  101 | 
  102 |       const metricsAfterRight = await page.evaluate(() => {
  103 |         const gm = (window as any).gameManager;
  104 |         const canvasEl = document.querySelector('canvas')!;
  105 |         return {
  106 |           playerX: gm.player.position.x,
  107 |           logicalWidth: gm.logicalWidth,
  108 |           clientWidth: canvasEl.clientWidth,
  109 |           clientLeft: canvasEl.clientLeft,
  110 |         };
  111 |       });
  112 | 
  113 |       // Expected displacement: dragDelta * (600 / clientWidth)
  114 |       const expectedScaleX = 600 / metricsAfterRight.clientWidth;
  115 |       const expectedDisplacement = dragDelta * expectedScaleX;
  116 |       const expectedRightX = 275 + expectedDisplacement;
  117 | 
  118 |       expect(metricsAfterRight.playerX).toBeCloseTo(expectedRightX, 0);
  119 | 
  120 |       // Capture screenshot after drag right (using viewport screenshot to avoid fullPage reflow during active drag)
  121 |       await page.screenshot({
  122 |         path: path.join(screenshotDir, '02_drag_right_aligned.png'),
  123 |       });
  124 | 
  125 |       // 3. Drag Left by 120 CSS pixels (net -60 from start)
  126 |       await page.mouse.move(startX - dragDelta, startY, { steps: 10 });
  127 | 
  128 |       const metricsAfterLeft = await page.evaluate(() => {
  129 |         const gm = (window as any).gameManager;
  130 |         return {
  131 |           playerX: gm.player.position.x,
  132 |         };
  133 |       });
  134 | 
  135 |       const expectedLeftX = 275 - expectedDisplacement;
  136 |       expect(metricsAfterLeft.playerX).toBeCloseTo(expectedLeftX, 0);
  137 | 
  138 |       // Capture screenshot after drag left
  139 |       await page.screenshot({
  140 |         path: path.join(screenshotDir, '03_drag_left_aligned.png'),
  141 |       });
  142 | 
  143 |       await page.mouse.up();
  144 |       expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(false);
  145 |     });
  146 | 
  147 |     test(`3. Boundary Clamping Verification: Left Clamp (0) & Right Clamp (550) with Screenshots`, async ({ page }) => {
  148 |       const canvas = page.locator('canvas');
  149 |       const canvasBox = await canvas.boundingBox();
  150 |       expect(canvasBox).not.toBeNull();
  151 | 
  152 |       const startX = canvasBox!.x + canvasBox!.width / 2;
  153 |       const startY = canvasBox!.y + canvasBox!.height * 0.7;
  154 | 
  155 |       await page.mouse.move(startX, startY);
  156 |       await page.mouse.down();
  157 | 
  158 |       // Drag far beyond left screen edge
  159 |       await page.mouse.move(startX - 1000, startY, { steps: 10 });
  160 |       const leftX = await page.evaluate(() => (window as any).gameManager.player.position.x);
  161 |       expect(leftX).toBe(0);
  162 | 
  163 |       await page.screenshot({
```
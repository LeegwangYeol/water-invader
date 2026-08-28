# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile_controls_and_touch_evasion.spec.ts >> Mobile Touch & Drag Evasion Controls Suite >> R1 & R2 Adversarial: Multi-touch secondary pointer down does not cause position teleportation or hijack active drag
- Location: tests/mobile_controls_and_touch_evasion.spec.ts:166:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Mobile Touch & Drag Evasion Controls Suite', () => {
  4   |   test.use({
  5   |     viewport: { width: 390, height: 844 },
  6   |     hasTouch: true,
  7   |     isMobile: true,
  8   |   });
  9   | 
  10  |   test.beforeEach(async ({ page }) => {
> 11  |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  12  |     await page.waitForLoadState('networkidle');
  13  |     // Start game
  14  |     const startBtn = page.locator('button', { hasText: 'START GAME' });
  15  |     await startBtn.click();
  16  |     await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
  17  |   });
  18  | 
  19  |   test('R1: Pointer drag horizontally moves player with 1:1 delta calculation', async ({ page }) => {
  20  |     const canvas = page.locator('canvas');
  21  |     await expect(canvas).toBeVisible();
  22  | 
  23  |     const canvasBox = await canvas.boundingBox();
  24  |     expect(canvasBox).not.toBeNull();
  25  | 
  26  |     // Get initial player position
  27  |     const initialPos = await page.evaluate(() => (window as any).gameManager.player.position.x);
  28  |     expect(initialPos).toBe(275); // (600 / 2) - 25
  29  | 
  30  |     // Start drag at center of canvas, move right by 60px in CSS coordinates
  31  |     const startX = canvasBox!.x + canvasBox!.width / 2;
  32  |     const startY = canvasBox!.y + canvasBox!.height * 0.7;
  33  | 
  34  |     await page.mouse.move(startX, startY);
  35  |     await page.mouse.down();
  36  | 
  37  |     // Drag right
  38  |     await page.mouse.move(startX + 60, startY, { steps: 5 });
  39  | 
  40  |     // Check player moved right
  41  |     const posAfterMoveRight = await page.evaluate(() => (window as any).gameManager.player.position.x);
  42  |     expect(posAfterMoveRight).toBeGreaterThan(initialPos);
  43  | 
  44  |     // Drag left past start position
  45  |     await page.mouse.move(startX - 60, startY, { steps: 10 });
  46  | 
  47  |     const posAfterMoveLeft = await page.evaluate(() => (window as any).gameManager.player.position.x);
  48  |     expect(posAfterMoveLeft).toBeLessThan(initialPos);
  49  | 
  50  |     await page.mouse.up();
  51  | 
  52  |     // After pointer up, movement flags are reset
  53  |     const movementFlags = await page.evaluate(() => ({
  54  |       isMovingLeft: (window as any).gameManager.player.isMovingLeft,
  55  |       isMovingRight: (window as any).gameManager.player.isMovingRight,
  56  |     }));
  57  |     expect(movementFlags.isMovingLeft).toBe(false);
  58  |     expect(movementFlags.isMovingRight).toBe(false);
  59  |   });
  60  | 
  61  |   test('R1: Extreme horizontal drag respects boundary clamping at 0 and max logical width', async ({ page }) => {
  62  |     const canvas = page.locator('canvas');
  63  |     const canvasBox = await canvas.boundingBox();
  64  |     expect(canvasBox).not.toBeNull();
  65  | 
  66  |     const startX = canvasBox!.x + canvasBox!.width / 2;
  67  |     const startY = canvasBox!.y + canvasBox!.height * 0.7;
  68  | 
  69  |     await page.mouse.move(startX, startY);
  70  |     await page.mouse.down();
  71  | 
  72  |     // Drag far to the left (beyond left screen edge)
  73  |     await page.mouse.move(startX - 1000, startY, { steps: 10 });
  74  |     const leftClampPos = await page.evaluate(() => (window as any).gameManager.player.position.x);
  75  |     expect(leftClampPos).toBe(0);
  76  | 
  77  |     // Drag far to the right (beyond right screen edge)
  78  |     await page.mouse.move(startX + 2000, startY, { steps: 20 });
  79  |     const rightClampPos = await page.evaluate(() => ({
  80  |       x: (window as any).gameManager.player.position.x,
  81  |       maxX: (window as any).gameManager.logicalWidth - (window as any).gameManager.player.size.width,
  82  |     }));
  83  |     expect(rightClampPos.x).toBe(rightClampPos.maxX); // 600 - 50 = 550
  84  | 
  85  |     await page.mouse.up();
  86  |   });
  87  | 
  88  |   test('R1: Pointer drag event triggers shooting while active and releases on pointer up', async ({ page }) => {
  89  |     const canvas = page.locator('canvas');
  90  |     const canvasBox = await canvas.boundingBox();
  91  |     expect(canvasBox).not.toBeNull();
  92  | 
  93  |     const startX = canvasBox!.x + canvasBox!.width / 2;
  94  |     const startY = canvasBox!.y + canvasBox!.height * 0.7;
  95  | 
  96  |     // Initially not shooting
  97  |     expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(false);
  98  | 
  99  |     await page.mouse.move(startX, startY);
  100 |     await page.mouse.down();
  101 | 
  102 |     // During pointer down on canvas, shooting is activated
  103 |     expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(true);
  104 | 
  105 |     await page.mouse.up();
  106 | 
  107 |     // After pointer up, shooting is deactivated
  108 |     expect(await page.evaluate(() => (window as any).gameManager.player.isShooting)).toBe(false);
  109 |   });
  110 | 
  111 |   test('R2: Mobile button controls (ALLY, ULT, FIRE) operate without breaking or moving player position', async ({ page }) => {
```
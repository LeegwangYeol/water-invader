# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: m2_verification.spec.ts >> Milestone 2: Gameplay Mechanics, Upgrades & Controls Verification Suite >> F-16 [MEDIUM]: Starting Player HP initializes to 3 out of max 5 in Player instance, GameManager, and HUD
- Location: tests/m2_verification.spec.ts:221:7

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
  3   | test.describe('Milestone 2: Gameplay Mechanics, Upgrades & Controls Verification Suite', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  6   |     await page.waitForLoadState('networkidle');
  7   |     await page.locator('button', { hasText: 'START GAME' }).click();
  8   |   });
  9   | 
  10  |   test('F-03 [CRITICAL]: Blur and visibilitychange events call clearKeys() to reset movement/keysPressed', async ({ page }) => {
  11  |     const result = await page.evaluate(() => {
  12  |       const gm = (window as any).gameManager;
  13  | 
  14  |       // 1. Simulate keydown 'a' and ' '
  15  |       gm.handleKeyDown('a');
  16  |       gm.handleKeyDown(' ');
  17  |       const movingBefore = gm.player.isMovingLeft;
  18  |       const shootingBefore = gm.player.isShooting;
  19  |       const keysPressedBefore = { ...gm.keysPressed };
  20  | 
  21  |       // 2. Dispatch blur event on window
  22  |       window.dispatchEvent(new Event('blur'));
  23  | 
  24  |       const movingAfterBlur = gm.player.isMovingLeft;
  25  |       const shootingAfterBlur = gm.player.isShooting;
  26  |       const keysPressedAfterBlur = { ...gm.keysPressed };
  27  | 
  28  |       // 3. Set keys again and dispatch visibilitychange
  29  |       gm.handleKeyDown('d');
  30  |       const movingRightBefore = gm.player.isMovingRight;
  31  | 
  32  |       // Simulate document visibilitychange (hidden = true)
  33  |       Object.defineProperty(document, 'hidden', { value: true, configurable: true });
  34  |       document.dispatchEvent(new Event('visibilitychange'));
  35  | 
  36  |       const movingRightAfterVis = gm.player.isMovingRight;
  37  |       const keysPressedAfterVis = { ...gm.keysPressed };
  38  | 
  39  |       // Reset document.hidden
  40  |       Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  41  | 
  42  |       return {
  43  |         movingBefore,
  44  |         shootingBefore,
  45  |         keysPressedBefore,
  46  |         movingAfterBlur,
  47  |         shootingAfterBlur,
  48  |         keysPressedAfterBlur,
  49  |         movingRightBefore,
  50  |         movingRightAfterVis,
  51  |         keysPressedAfterVis,
  52  |       };
  53  |     });
  54  | 
  55  |     expect(result.movingBefore).toBe(true);
  56  |     expect(result.shootingBefore).toBe(true);
  57  |     expect(result.keysPressedBefore['a']).toBe(true);
  58  |     expect(result.movingAfterBlur).toBe(false);
  59  |     expect(result.shootingAfterBlur).toBe(false);
  60  |     expect(Object.keys(result.keysPressedAfterBlur).length).toBe(0);
  61  | 
  62  |     expect(result.movingRightBefore).toBe(true);
  63  |     expect(result.movingRightAfterVis).toBe(false);
  64  |     expect(Object.keys(result.keysPressedAfterVis).length).toBe(0);
  65  |   });
  66  | 
  67  |   test('F-05 [HIGH]: Multi-Shot Lv 4 & Lv 5 genuinely fire 4 and 5 bullets with spread angles', async ({ page }) => {
  68  |     const result = await page.evaluate(() => {
  69  |       const gm = (window as any).gameManager;
  70  |       const p = gm.player;
  71  | 
  72  |       // Ensure no suppression spread for deterministic angle checking
  73  |       p.suppressionLevel = 0;
  74  | 
  75  |       // Test Lv 1
  76  |       p.multiShot = 1;
  77  |       p.fireTimer = 0;
  78  |       const b1 = p.fire();
  79  | 
  80  |       // Test Lv 2
  81  |       p.multiShot = 2;
  82  |       p.fireTimer = 0;
  83  |       const b2 = p.fire();
  84  | 
  85  |       // Test Lv 3
  86  |       p.multiShot = 3;
  87  |       p.fireTimer = 0;
  88  |       const b3 = p.fire();
  89  | 
  90  |       // Test Lv 4
  91  |       p.multiShot = 4;
  92  |       p.fireTimer = 0;
  93  |       const b4 = p.fire();
  94  |       const b4Velocities = b4.map((b: any) => ({ vx: Math.round(b.velocity.x), vy: Math.round(b.velocity.y) }));
  95  | 
  96  |       // Test Lv 5
  97  |       p.multiShot = 5;
  98  |       p.fireTimer = 0;
  99  |       const b5 = p.fire();
  100 |       const b5Velocities = b5.map((b: any) => ({ vx: Math.round(b.velocity.x), vy: Math.round(b.velocity.y) }));
  101 | 
  102 |       return {
  103 |         count1: b1.length,
  104 |         count2: b2.length,
  105 |         count3: b3.length,
```
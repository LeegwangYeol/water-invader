# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: m3_verification.spec.ts >> Milestone 3: UI/UX, HiDPI Scaling, Audio/Visual FX & Boss Polish Verification Suite >> F-14 [HIGH]: Audio FX Suite & Mute Toggle functionality
- Location: tests/m3_verification.spec.ts:168:7

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
  3   | test.describe('Milestone 3: UI/UX, HiDPI Scaling, Audio/Visual FX & Boss Polish Verification Suite', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  6   |     await page.waitForLoadState('networkidle');
  7   |   });
  8   | 
  9   |   test('F-10 [HIGH]: Desktop Canvas aspect-[3/4] maintains ratio without horizontal stretch', async ({ page }) => {
  10  |     // 1. Check Menu state wrapper
  11  |     const canvasWrapper = page.locator('div.aspect-\\[3\\/4\\]');
  12  |     await expect(canvasWrapper).toBeVisible();
  13  | 
  14  |     const classAttribute = await canvasWrapper.getAttribute('class');
  15  |     expect(classAttribute).not.toContain('sm:aspect-auto');
  16  |     expect(classAttribute).toContain('aspect-[3/4]');
  17  | 
  18  |     // 2. Start game and check bounding box aspect ratio
  19  |     await page.locator('button', { hasText: 'START GAME' }).click();
  20  |     const box = await canvasWrapper.boundingBox();
  21  |     expect(box).not.toBeNull();
  22  |     if (box) {
  23  |       const ratio = box.width / box.height;
  24  |       // Expect ratio to be approximately 3/4 = 0.75 (+/- 0.05)
  25  |       expect(ratio).toBeGreaterThan(0.70);
  26  |       expect(ratio).toBeLessThan(0.80);
  27  |     }
  28  |   });
  29  | 
  30  |   test('F-11 [HIGH]: Retina & HiDPI Canvas Scaling supports window.devicePixelRatio', async ({ page }) => {
  31  |     await page.locator('button', { hasText: 'START GAME' }).click();
  32  | 
  33  |     const dprInfo = await page.evaluate(() => {
  34  |       const gm = (window as any).gameManager;
  35  |       const canvas = document.querySelector('canvas')!;
  36  |       const expectedDpr = window.devicePixelRatio || 1;
  37  | 
  38  |       return {
  39  |         logicalWidth: gm.logicalWidth,
  40  |         logicalHeight: gm.logicalHeight,
  41  |         dpr: gm.dpr,
  42  |         expectedDpr,
  43  |         canvasWidth: canvas.width,
  44  |         canvasHeight: canvas.height,
  45  |         expectedCanvasWidth: 600 * expectedDpr,
  46  |         expectedCanvasHeight: 800 * expectedDpr,
  47  |       };
  48  |     });
  49  | 
  50  |     expect(dprInfo.logicalWidth).toBe(600);
  51  |     expect(dprInfo.logicalHeight).toBe(800);
  52  |     expect(dprInfo.dpr).toBe(dprInfo.expectedDpr);
  53  |     expect(dprInfo.canvasWidth).toBe(dprInfo.expectedCanvasWidth);
  54  |     expect(dprInfo.canvasHeight).toBe(dprInfo.expectedCanvasHeight);
  55  |   });
  56  | 
  57  |   test('F-13 [HIGH]: Top HUD Overlay Occlusion Fix — Spawn Y lowered from 40 to 80 (Boss 50 to 90)', async ({ page }) => {
  58  |     await page.locator('button', { hasText: 'START GAME' }).click();
  59  | 
  60  |     const spawnInfo = await page.evaluate(() => {
  61  |       const gm = (window as any).gameManager;
  62  | 
  63  |       // Wave 1 formation min Y
  64  |       const normalEnemies = gm.enemies;
  65  |       const minY = Math.min(...normalEnemies.map((e: any) => e.position.y));
  66  | 
  67  |       // Simulate Wave 5 Boss spawn
  68  |       gm.enemies = [];
  69  |       gm.level = 5;
  70  |       (gm as any).spawnWave();
  71  |       const boss = gm.enemies.find((e: any) => e.type === 2); // BOSS = 2
  72  |       const bossY = boss ? boss.position.y : 0;
  73  | 
  74  |       return {
  75  |         formationMinY: minY,
  76  |         bossY: bossY,
  77  |       };
  78  |     });
  79  | 
  80  |     // Formation spawn Y must be >= 80 (previously 40)
  81  |     expect(spawnInfo.formationMinY).toBeGreaterThanOrEqual(80);
  82  |     // Boss spawn Y must be >= 90 (previously 50)
  83  |     expect(spawnInfo.bossY).toBeGreaterThanOrEqual(90);
  84  |   });
  85  | 
  86  |   test('F-14 [HIGH]: Boss HP Bar renders when Boss is alive', async ({ page }) => {
  87  |     await page.locator('button', { hasText: 'START GAME' }).click();
  88  | 
  89  |     const bossHpTest = await page.evaluate(() => {
  90  |       const gm = (window as any).gameManager;
  91  |       const canvas = document.querySelector('canvas')!;
  92  |       const ctx = canvas.getContext('2d')!;
  93  | 
  94  |       // Setup Wave 5 Boss
  95  |       gm.enemies = [];
  96  |       gm.level = 5;
  97  |       (gm as any).spawnWave();
  98  |       const boss = gm.enemies.find((e: any) => e.type === 2);
  99  | 
  100 |       let drewWithoutError = false;
  101 |       try {
  102 |         gm.draw();
  103 |         drewWithoutError = true;
  104 |       } catch (e) {
  105 |         drewWithoutError = false;
```
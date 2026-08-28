# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: enemy_y_boundary_and_dive_fixes.spec.ts >> Enemy Y-Axis Boundary & Dive Mechanic Fixes Suite (R1 & R2) >> R1-01: Strict Math.min clamping of Y-axis coordinates for all standard enemy types
- Location: tests/enemy_y_boundary_and_dive_fixes.spec.ts:10:7

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
  3   | test.describe('Enemy Y-Axis Boundary & Dive Mechanic Fixes Suite (R1 & R2)', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  6   |     await page.waitForLoadState('networkidle');
  7   |     await page.locator('button', { hasText: 'START GAME' }).click();
  8   |   });
  9   | 
  10  |   test('R1-01: Strict Math.min clamping of Y-axis coordinates for all standard enemy types', async ({ page }) => {
  11  |     const clampingResults = await page.evaluate(() => {
  12  |       const gm = (window as any).gameManager;
  13  |       const EnemyClass = gm.enemies[0].constructor;
  14  |       const types = [0, 1, 2, 3, 4, 5, 6]; // NORMAL, ZIGZAG, BOSS, SNIPER, DIVER, SHIELDED, SPLITTER
  15  |       const results: { type: number; initialY: number; finalY: number; maxY: number; clamped: boolean; hasNaN: boolean }[] = [];
  16  | 
  17  |       for (const t of types) {
  18  |         // Start near bottom boundary at y = 760
  19  |         const enemy = new EnemyClass(200, 760, gm.logicalWidth, 1, t, gm.logicalHeight);
  20  |         const expectedMaxY = gm.logicalHeight - enemy.size.height;
  21  | 
  22  |         // Run 500 update frames without playerPos (so DIVER does not dive)
  23  |         for (let frame = 0; frame < 500; frame++) {
  24  |           enemy.update(0.016, 1.0, []);
  25  |         }
  26  | 
  27  |         results.push({
  28  |           type: t,
  29  |           initialY: 760,
  30  |           finalY: enemy.position.y,
  31  |           maxY: expectedMaxY,
  32  |           clamped: enemy.position.y <= expectedMaxY,
  33  |           hasNaN: Number.isNaN(enemy.position.y),
  34  |         });
  35  |       }
  36  | 
  37  |       return results;
  38  |     });
  39  | 
  40  |     for (const r of clampingResults) {
  41  |       expect(r.hasNaN).toBe(false);
  42  |       expect(r.clamped).toBe(true);
  43  |       expect(r.finalY).toBeLessThanOrEqual(r.maxY);
  44  |       expect(r.finalY).toBe(r.maxY); // Strictly clamped at maxY
  45  |     }
  46  |   });
  47  | 
  48  |   test('R1-02: Zigzag enemy horizontal oscillation while strictly clamped at bottom Y bound', async ({ page }) => {
  49  |     const zigzagResult = await page.evaluate(() => {
  50  |       const gm = (window as any).gameManager;
  51  |       const EnemyClass = gm.enemies[0].constructor;
  52  | 
  53  |       // ZIGZAG = 1
  54  |       const zigzag = new EnemyClass(300, 760, gm.logicalWidth, 1, 1, gm.logicalHeight);
  55  |       const expectedMaxY = gm.logicalHeight - zigzag.size.height; // 800 - 30 = 770
  56  | 
  57  |       const xPositions: number[] = [];
  58  |       const yPositions: number[] = [];
  59  | 
  60  |       for (let frame = 0; frame < 120; frame++) {
  61  |         zigzag.update(0.016, 1.0, []);
  62  |         xPositions.push(zigzag.position.x);
  63  |         yPositions.push(zigzag.position.y);
  64  |       }
  65  | 
  66  |       return {
  67  |         expectedMaxY,
  68  |         yPositions,
  69  |         minX: Math.min(...xPositions),
  70  |         maxX: Math.max(...xPositions),
  71  |         allYClamped: yPositions.every(y => y <= expectedMaxY && !Number.isNaN(y)),
  72  |         finalY: zigzag.position.y,
  73  |       };
  74  |     });
  75  | 
  76  |     expect(zigzagResult.allYClamped).toBe(true);
  77  |     expect(zigzagResult.finalY).toBe(zigzagResult.expectedMaxY);
  78  |     expect(zigzagResult.maxX).toBeGreaterThan(zigzagResult.minX); // Kept moving horizontally
  79  |   });
  80  | 
  81  |   test('R2-01: Diver plunge attack trigger, safe trajectory acceleration, and boundary containment', async ({ page }) => {
  82  |     const diveResult = await page.evaluate(() => {
  83  |       const gm = (window as any).gameManager;
  84  |       const EnemyClass = gm.enemies[0].constructor;
  85  | 
  86  |       // Place player at center
  87  |       gm.player.position.x = 275;
  88  |       gm.player.position.y = 740;
  89  | 
  90  |       // Diver placed directly above player at y = 100
  91  |       const diver = new EnemyClass(280, 100, gm.logicalWidth, 1, 4, gm.logicalHeight);
  92  |       const initialY = diver.position.y;
  93  | 
  94  |       // Update frame with player position directly below
  95  |       diver.update(0.05, 1.0, [], gm.player.position);
  96  |       const isDiving = diver.isDiving;
  97  |       const yAfterTrigger = diver.position.y;
  98  |       const dy = yAfterTrigger - initialY;
  99  | 
  100 |       // Advance dive for 100 frames to reach bottom bound
  101 |       for (let i = 0; i < 100; i++) {
  102 |         diver.update(0.05, 1.0, [], gm.player.position);
  103 |       }
  104 | 
  105 |       const finalY = diver.position.y;
```
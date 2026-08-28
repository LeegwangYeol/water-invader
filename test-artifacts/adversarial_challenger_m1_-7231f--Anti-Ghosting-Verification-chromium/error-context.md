# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: adversarial_challenger_m1_2.spec.ts >> Challenger M1 Adversarial Verification Suite (teamwork_preview_challenger_m1_2) >> EMP-BARRICADE-01: Stone Barricade Rigid Body Collision & Anti-Ghosting Verification
- Location: tests/adversarial_challenger_m1_2.spec.ts:111:7

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
  3   | test.describe('Challenger M1 Adversarial Verification Suite (teamwork_preview_challenger_m1_2)', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  6   |     await page.waitForLoadState('networkidle');
  7   |     await page.locator('button', { hasText: 'START GAME' }).click();
  8   |   });
  9   | 
  10  |   test('EMP-WAVE-01: Exhaustive Wave Scaling & Boundary Invariants (Waves 1 to 50)', async ({ page }) => {
  11  |     const waveResults = await page.evaluate(() => {
  12  |       const gm = (window as any).gameManager;
  13  |       const results: {
  14  |         wave: number;
  15  |         enemyCount: number;
  16  |         cols: number;
  17  |         rows: number;
  18  |         minX: number;
  19  |         maxX: number;
  20  |         minY: number;
  21  |         maxY: number;
  22  |         hasNaN: boolean;
  23  |         isBossWave: boolean;
  24  |         bossHp?: number;
  25  |       }[] = [];
  26  | 
  27  |       for (let wave = 1; wave <= 50; wave++) {
  28  |         gm.level = wave;
  29  |         gm.enemies = [];
  30  |         gm.spawnWave();
  31  | 
  32  |         let minX = Infinity;
  33  |         let maxX = -Infinity;
  34  |         let minY = Infinity;
  35  |         let maxY = -Infinity;
  36  |         let hasNaN = false;
  37  | 
  38  |         const expectedRows = Math.min(5, 3 + Math.floor(wave / 4));
  39  |         const expectedCols = Math.min(8, 6 + Math.floor(wave / 3));
  40  | 
  41  |         for (const enemy of gm.enemies) {
  42  |           if (
  43  |             Number.isNaN(enemy.position.x) ||
  44  |             Number.isNaN(enemy.position.y) ||
  45  |             Number.isNaN(enemy.size.width) ||
  46  |             Number.isNaN(enemy.size.height) ||
  47  |             Number.isNaN(enemy.hp)
  48  |           ) {
  49  |             hasNaN = true;
  50  |           }
  51  | 
  52  |           if (enemy.position.x < minX) minX = enemy.position.x;
  53  |           if (enemy.position.x + enemy.size.width > maxX) maxX = enemy.position.x + enemy.size.width;
  54  |           if (enemy.position.y < minY) minY = enemy.position.y;
  55  |           if (enemy.position.y + enemy.size.height > maxY) maxY = enemy.position.y + enemy.size.height;
  56  |         }
  57  | 
  58  |         const isBossWave = wave % 5 === 0;
  59  |         const boss = isBossWave ? gm.enemies.find((e: any) => e.type === 2) : null;
  60  | 
  61  |         results.push({
  62  |           wave,
  63  |           enemyCount: gm.enemies.length,
  64  |           cols: expectedCols,
  65  |           rows: expectedRows,
  66  |           minX,
  67  |           maxX,
  68  |           minY,
  69  |           maxY,
  70  |           hasNaN,
  71  |           isBossWave,
  72  |           bossHp: boss ? boss.hp : undefined,
  73  |         });
  74  |       }
  75  | 
  76  |       return results;
  77  |     });
  78  | 
  79  |     expect(waveResults.length).toBe(50);
  80  | 
  81  |     for (const r of waveResults) {
  82  |       // 1. No NaN values in any entity property
  83  |       expect(r.hasNaN).toBe(false);
  84  | 
  85  |       // 2. Enemy counts and grid dimensions are bounded
  86  |       expect(r.cols).toBeLessThanOrEqual(8);
  87  |       expect(r.cols).toBeGreaterThanOrEqual(6);
  88  |       expect(r.rows).toBeLessThanOrEqual(5);
  89  |       expect(r.rows).toBeGreaterThanOrEqual(3);
  90  | 
  91  |       if (r.isBossWave) {
  92  |         expect(r.enemyCount).toBe(1);
  93  |         expect(r.bossHp).toBe(r.wave * 10);
  94  |       } else {
  95  |         // Grid capped at 5 rows x 8 cols = 40 enemies max
  96  |         expect(r.enemyCount).toBeGreaterThanOrEqual(18); // 3x6 = 18 min
  97  |         expect(r.enemyCount).toBeLessThanOrEqual(40); // 5x8 = 40 max
  98  |       }
  99  | 
  100 |       // 3. Boundaries: within logical canvas width [0, 600]
  101 |       expect(r.minX).toBeGreaterThanOrEqual(0);
  102 |       expect(r.maxX).toBeLessThanOrEqual(600);
  103 | 
  104 |       // 4. Boundaries: spawn Y starts at or below 80 (F-13 / E-06)
  105 |       expect(r.minY).toBeGreaterThanOrEqual(80);
```
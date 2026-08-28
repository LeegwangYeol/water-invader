# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stress/qa_harvest_verification.spec.ts >> QA Sweep Live Bug Harvesting Suite >> BUG-E04: Zigzag Missing Y-Descent Verification
- Location: tests/stress/qa_harvest_verification.spec.ts:70:7

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
  3   | test.describe('QA Sweep Live Bug Harvesting Suite', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  6   |     await page.waitForLoadState('networkidle');
  7   |     await page.locator('button', { hasText: 'START GAME' }).click();
  8   |   });
  9   | 
  10  |   test('BUG-E01: Splitter Mini2 Stuck At Left Wall Verification', async ({ page }) => {
  11  |     const result = await page.evaluate(() => {
  12  |       const gm = (window as any).gameManager;
  13  |       const EnemyClass = gm.enemies[0].constructor;
  14  | 
  15  |       // Spawn mini2 with speedX = -10 (moving left) starting near left edge (x=2)
  16  |       const mini2 = new EnemyClass(2, 150, gm.logicalWidth, 1, 0);
  17  |       mini2.size = { width: 20, height: 20 };
  18  |       mini2.speedX = -10;
  19  |       mini2.speedY = 5;
  20  | 
  21  |       const initialX = mini2.position.x;
  22  |       // Update for 50 frames
  23  |       for (let i = 0; i < 50; i++) {
  24  |         mini2.update(0.016, 1.0, []);
  25  |       }
  26  |       const xAtWall = mini2.position.x;
  27  |       const dirAtWall = (mini2 as any).direction;
  28  | 
  29  |       // Update for another 100 frames — should bounce right if working properly, but gets stuck at 0
  30  |       for (let i = 0; i < 100; i++) {
  31  |         mini2.update(0.016, 1.0, []);
  32  |       }
  33  | 
  34  |       return {
  35  |         initialX,
  36  |         xAtWall,
  37  |         dirAtWall,
  38  |         finalX: mini2.position.x,
  39  |         finalDir: (mini2 as any).direction
  40  |       };
  41  |     });
  42  | 
  43  |     console.log('[BUG-E01 Result]:', result);
  44  |     // Verified: mini2 reaches wall and bounces smoothly to the right
  45  |     expect(result.finalX).toBeGreaterThan(0);
  46  |     expect(result.finalDir).toBe(-1);
  47  |   });
  48  | 
  49  |   test('BUG-E02: Diver Missing From spawnWave Verification', async ({ page }) => {
  50  |     const diverFound = await page.evaluate(() => {
  51  |       const gm = (window as any).gameManager;
  52  |       let found = false;
  53  |       // Spawn 50 waves of enemies and check types
  54  |       for (let lvl = 1; lvl <= 50; lvl++) {
  55  |         gm.level = lvl;
  56  |         gm.enemies = [];
  57  |         gm.spawnWave();
  58  |         if (gm.enemies.some((e: any) => e.type === 4)) { // EnemyType.DIVER = 4
  59  |           found = true;
  60  |           break;
  61  |         }
  62  |       }
  63  |       return found;
  64  |     });
  65  | 
  66  |     console.log('[BUG-E02 Result] Diver found in 50 waves:', diverFound);
  67  |     expect(diverFound).toBe(true);
  68  |   });
  69  | 
  70  |   test('BUG-E04: Zigzag Missing Y-Descent Verification', async ({ page }) => {
  71  |     const yDelta = await page.evaluate(() => {
  72  |       const gm = (window as any).gameManager;
  73  |       const EnemyClass = gm.enemies[0].constructor;
  74  |       const zigzag = new EnemyClass(200, 100, gm.logicalWidth, 1, 1); // EnemyType.ZIGZAG = 1
  75  |       const initialY = zigzag.position.y;
  76  |       for (let i = 0; i < 300; i++) {
  77  |         zigzag.update(0.016, 1.0, []);
  78  |       }
  79  |       return zigzag.position.y - initialY;
  80  |     });
  81  | 
  82  |     console.log('[BUG-E04 Result] Zigzag Y movement over 300 frames:', yDelta);
  83  |     expect(yDelta).toBeGreaterThan(0); // Y moves down smoothly
  84  |   });
  85  | 
  86  |   test('BUG-E08: Boss Ramming Instakill Exploit Verification', async ({ page }) => {
  87  |     const result = await page.evaluate(() => {
  88  |       const gm = (window as any).gameManager;
  89  |       const EnemyClass = gm.enemies[0].constructor;
  90  |       const boss = new EnemyClass(gm.logicalWidth / 2 - 75, 90, gm.logicalWidth, 5, 2); // EnemyType.BOSS = 2
  91  |       boss.hp = 50;
  92  |       boss.maxHp = 50;
  93  |       gm.enemies = [boss];
  94  | 
  95  |       // Move player into boss
  96  |       gm.player.position.x = boss.position.x;
  97  |       gm.player.position.y = boss.position.y;
  98  |       const prevHp = gm.player.hp;
  99  |       
  100 |       // Update GM collisions
  101 |       gm.update(0.016);
  102 | 
  103 |       return {
  104 |         bossDead: boss.isDead,
  105 |         remainingEnemies: gm.enemies.length,
```
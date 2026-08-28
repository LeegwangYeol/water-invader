# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: m1_verification.spec.ts >> Milestone 1: Core Engine & Collision Fixes Verification Suite >> F-01 [CRITICAL]: Enemy-vs-Barricade collision functions independently with 0 active bullets
- Location: tests/m1_verification.spec.ts:10:7

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
  3   | test.describe('Milestone 1: Core Engine & Collision Fixes Verification Suite', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  6   |     await page.waitForLoadState('networkidle');
  7   |     await page.locator('button', { hasText: 'START GAME' }).click();
  8   |   });
  9   | 
  10  |   test('F-01 [CRITICAL]: Enemy-vs-Barricade collision functions independently with 0 active bullets', async ({ page }) => {
  11  |     const result = await page.evaluate(() => {
  12  |       const gm = (window as any).gameManager;
  13  |       const EnemyClass = gm.enemies[0].constructor;
  14  | 
  15  |       // Clear bullets completely
  16  |       gm.bullets = [];
  17  | 
  18  |       // Place normal enemy colliding with destructible barricade
  19  |       const normalEnemy = new EnemyClass(100, 100, gm.canvas.width, 1, 0); // NORMAL
  20  |       const barricade = gm.barricades[0];
  21  |       barricade.position.x = 100;
  22  |       barricade.position.y = 100;
  23  |       const initialHp = barricade.hp;
  24  |       gm.enemies = [normalEnemy];
  25  | 
  26  |       // Run checkCollisions with 0 bullets
  27  |       gm.checkCollisions();
  28  | 
  29  |       return {
  30  |         activeBulletsCount: gm.bullets.length,
  31  |         isGnawing: normalEnemy.isGnawing,
  32  |         barricadeDamaged: barricade.hp < initialHp,
  33  |         barricadeHp: barricade.hp,
  34  |       };
  35  |     });
  36  | 
  37  |     expect(result.activeBulletsCount).toBe(0);
  38  |     expect(result.isGnawing).toBe(true);
  39  |     expect(result.barricadeDamaged).toBe(true);
  40  |   });
  41  | 
  42  |   test('F-02 [CRITICAL]: Repeated start/startGame calls cancel existing rAF loop', async ({ page }) => {
  43  |     const result = await page.evaluate(() => {
  44  |       const gm = (window as any).gameManager;
  45  |       const firstRafId = gm.animationFrameId;
  46  | 
  47  |       // Call start/startGame again
  48  |       gm.startGame();
  49  |       const secondRafId = gm.animationFrameId;
  50  | 
  51  |       gm.start();
  52  |       const thirdRafId = gm.animationFrameId;
  53  | 
  54  |       // Stop game
  55  |       gm.stopGame();
  56  |       const stoppedRafId = gm.animationFrameId;
  57  | 
  58  |       return {
  59  |         firstRafId,
  60  |         secondRafId,
  61  |         thirdRafId,
  62  |         stoppedRafId,
  63  |       };
  64  |     });
  65  | 
  66  |     expect(result.firstRafId).toBeGreaterThan(0);
  67  |     expect(result.secondRafId).toBeGreaterThan(0);
  68  |     expect(result.thirdRafId).toBeGreaterThan(0);
  69  |     expect(result.stoppedRafId).toBe(0);
  70  |   });
  71  | 
  72  |   test('F-04 [HIGH]: Player i-Frames (invincibilityTimer) protects from consecutive damage and decrements in update', async ({ page }) => {
  73  |     const result = await page.evaluate(() => {
  74  |       const gm = (window as any).gameManager;
  75  |       const BulletClass = gm.player.fire()[0].constructor;
  76  | 
  77  |       gm.isGodMode = false;
  78  |       gm.player.hp = 5;
  79  |       gm.player.invincibilityTimer = 0;
  80  | 
  81  |       // Spawn enemy bullet colliding with player
  82  |       const enemyBullet1 = new BulletClass(gm.player.position.x, gm.player.position.y, 200, 1, false);
  83  |       gm.bullets = [enemyBullet1];
  84  | 
  85  |       // First hit
  86  |       gm.checkCollisions();
  87  |       const hpAfterHit1 = gm.player.hp;
  88  |       const timerAfterHit1 = gm.player.invincibilityTimer;
  89  | 
  90  |       // Second hit immediately while in i-frames
  91  |       const enemyBullet2 = new BulletClass(gm.player.position.x, gm.player.position.y, 200, 1, false);
  92  |       gm.bullets = [enemyBullet2];
  93  |       gm.checkCollisions();
  94  |       const hpAfterHit2 = gm.player.hp;
  95  | 
  96  |       // Update for 0.5s -> timer should be ~0.5
  97  |       gm.player.update(0.5);
  98  |       const timerAfter05s = gm.player.invincibilityTimer;
  99  | 
  100 |       // Update for 0.6s -> timer should reach 0
  101 |       gm.player.update(0.6);
  102 |       const timerAfterExpired = gm.player.invincibilityTimer;
  103 | 
  104 |       return {
  105 |         hpAfterHit1,
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stress/challenger_piercing_particle_empirical.spec.ts >> Challenger Empirical Verification: G-01 Piercing & G-04 Particle Pooling >> G-01 [EMPIRICAL 1]: Piercing Bullet vs Single 100 HP Enemy - Hit Tracking prevents frame-by-frame tick depletion
- Location: tests/stress/challenger_piercing_particle_empirical.spec.ts:10:7

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
  3   | test.describe('Challenger Empirical Verification: G-01 Piercing & G-04 Particle Pooling', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  6   |     await page.waitForLoadState('networkidle');
  7   |     await page.locator('button', { hasText: 'START GAME' }).click();
  8   |   });
  9   | 
  10  |   test('G-01 [EMPIRICAL 1]: Piercing Bullet vs Single 100 HP Enemy - Hit Tracking prevents frame-by-frame tick depletion', async ({ page }) => {
  11  |     const result = await page.evaluate(() => {
  12  |       const gm = (window as any).gameManager;
  13  |       const EnemyClass = gm.enemies[0].constructor;
  14  |       const BulletClass = gm.player.fire()[0].constructor;
  15  | 
  16  |       // Single standard enemy with 100 HP
  17  |       const enemy = new EnemyClass(200, 200, gm.logicalWidth, 1, 0);
  18  |       enemy.hp = 100;
  19  |       enemy.maxHp = 100;
  20  |       enemy.size = { width: 40, height: 30 };
  21  |       gm.enemies = [enemy];
  22  | 
  23  |       // Bullet with piercing = 3 starting below and moving through enemy
  24  |       const bullet = new BulletClass(215, 235, -200, 1, true, 3);
  25  |       gm.bullets = [bullet];
  26  | 
  27  |       const framesLog: any[] = [];
  28  | 
  29  |       // Run 20 frames of collision & movement (traversing ~60px through 30px enemy)
  30  |       for (let frame = 1; frame <= 20; frame++) {
  31  |         const prevPiercing = bullet.piercing;
  32  |         const prevHp = enemy.hp;
  33  |         const isColliding = bullet.checkCollision(enemy);
  34  |         const alreadyHit = bullet.hitEntities.has(enemy);
  35  | 
  36  |         gm.checkCollisions();
  37  |         bullet.position.y += bullet.velocity.y * 0.016; // -3.2px per frame
  38  | 
  39  |         framesLog.push({
  40  |           frame,
  41  |           bulletY: bullet.position.y,
  42  |           isColliding,
  43  |           alreadyHit,
  44  |           piercing: bullet.piercing,
  45  |           piercingDelta: prevPiercing - bullet.piercing,
  46  |           enemyHp: enemy.hp,
  47  |           enemyHpDelta: prevHp - enemy.hp,
  48  |           bulletDead: bullet.isDead,
  49  |           hitEntitiesSize: bullet.hitEntities.size
  50  |         });
  51  |       }
  52  | 
  53  |       const totalPiercingConsumed = 3 - bullet.piercing;
  54  |       const totalDamageDealt = 100 - enemy.hp;
  55  | 
  56  |       return {
  57  |         totalPiercingConsumed,
  58  |         totalDamageDealt,
  59  |         finalPiercing: bullet.piercing,
  60  |         finalEnemyHp: enemy.hp,
  61  |         bulletIsDead: bullet.isDead,
  62  |         framesLog
  63  |       };
  64  |     });
  65  | 
  66  |     console.log('[G-01 Single Enemy Traversal Summary]:', {
  67  |       totalPiercingConsumed: result.totalPiercingConsumed,
  68  |       totalDamageDealt: result.totalDamageDealt,
  69  |       finalPiercing: result.finalPiercing,
  70  |       bulletIsDead: result.bulletIsDead
  71  |     });
  72  | 
  73  |     // Verification: Exactly 1 piercing charge consumed, exactly 1 damage dealt
  74  |     expect(result.totalPiercingConsumed).toBe(1);
  75  |     expect(result.totalDamageDealt).toBe(1);
  76  |     expect(result.finalPiercing).toBe(2);
  77  |     expect(result.finalEnemyHp).toBe(99);
  78  |     expect(result.bulletIsDead).toBe(false);
  79  |   });
  80  | 
  81  |   test('G-01 [EMPIRICAL 2]: Piercing Bullet vs Single Boss (50 HP, 150x80 hitbox) - No multi-tick depletion', async ({ page }) => {
  82  |     const result = await page.evaluate(() => {
  83  |       const gm = (window as any).gameManager;
  84  |       const EnemyClass = gm.enemies[0].constructor;
  85  |       const BulletClass = gm.player.fire()[0].constructor;
  86  | 
  87  |       // Boss with 50 HP (size 150x80)
  88  |       const boss = new EnemyClass(150, 150, gm.logicalWidth, 5, 2); // BOSS = 2
  89  |       boss.hp = 50;
  90  |       boss.maxHp = 50;
  91  |       boss.size = { width: 150, height: 80 };
  92  |       gm.enemies = [boss];
  93  | 
  94  |       // Bullet starting at bottom of Boss and moving upwards through the 80px hitbox
  95  |       const bullet = new BulletClass(200, 230, -200, 1, true, 3);
  96  |       gm.bullets = [bullet];
  97  | 
  98  |       let hitsCount = 0;
  99  |       let initialHp = boss.hp;
  100 | 
  101 |       for (let frame = 1; frame <= 40; frame++) {
  102 |         const hpBefore = boss.hp;
  103 |         gm.checkCollisions();
  104 |         if (boss.hp < hpBefore) {
  105 |           hitsCount++;
```
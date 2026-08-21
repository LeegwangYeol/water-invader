import { test, expect } from '@playwright/test';

test.describe('Adversarial Stress Test Suite: Milestone 1 (F-01, F-02, F-04)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('F-01 [STRESS]: Zero-bullet collision decoupling & multi-enemy barricade assault', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // 1. Force zero bullets in active state
      gm.bullets = [];

      // 2. Destructible Barricade setup
      const destructibleBarricade = gm.barricades[0];
      destructibleBarricade.position.x = 200;
      destructibleBarricade.position.y = 200;
      const initialDestructibleHp = destructibleBarricade.hp;

      // Indestructible Barricade setup
      const indestructibleBarricade = gm.barricades[1];
      indestructibleBarricade.position.x = 400;
      indestructibleBarricade.position.y = 200;
      const initialIndestructibleHp = indestructibleBarricade.hp;

      // 3. Place Normal enemy gnawing destructible barricade
      const normalEnemy = new EnemyClass(200, 200, gm.canvas.width, 1, 0); // NORMAL = 0

      // 4. Place Normal enemy gnawing indestructible barricade
      const normalEnemy2 = new EnemyClass(400, 200, gm.canvas.width, 1, 0); // NORMAL = 0

      // 5. Place Diver enemy crashing into destructible barricade
      const diverBarricade = gm.barricades[3];
      diverBarricade.position.x = 100;
      diverBarricade.position.y = 100;
      const initialDiverBarricadeHp = diverBarricade.hp;
      const diverEnemy = new EnemyClass(100, 100, gm.canvas.width, 1, 4); // DIVER = 4

      gm.enemies = [normalEnemy, normalEnemy2, diverEnemy];

      // Execute checkCollisions with exactly 0 bullets
      gm.checkCollisions();

      return {
        activeBullets: gm.bullets.length,
        // Normal enemy vs Destructible
        normalEnemyIsGnawing: normalEnemy.isGnawing,
        destructibleHpBefore: initialDestructibleHp,
        destructibleHpAfter: destructibleBarricade.hp,
        destructibleDamaged: destructibleBarricade.hp < initialDestructibleHp,
        // Normal enemy vs Indestructible
        normalEnemy2IsGnawing: normalEnemy2.isGnawing,
        indestructibleHpBefore: initialIndestructibleHp,
        indestructibleHpAfter: indestructibleBarricade.hp,
        // Diver enemy crash
        diverIsDead: diverEnemy.isDead,
        diverBarricadeHpBefore: initialDiverBarricadeHp,
        diverBarricadeHpAfter: diverBarricade.hp,
      };
    });

    // Verification
    expect(result.activeBullets).toBe(0);
    expect(result.normalEnemyIsGnawing).toBe(true);
    expect(result.destructibleDamaged).toBe(true);
    expect(result.destructibleHpAfter).toBeCloseTo(result.destructibleHpBefore - 0.1, 2);

    expect(result.normalEnemy2IsGnawing).toBe(true);
    expect(result.indestructibleHpAfter).toBe(result.indestructibleHpBefore);

    expect(result.diverIsDead).toBe(true);
    expect(result.diverBarricadeHpAfter).toBe(result.diverBarricadeHpBefore - 20);
  });

  test('F-02 [STRESS]: Calling startGame() 5 times consecutively does not multiply rAF loops or accelerate delta time', async ({ page }) => {
    // 1. Call startGame() 5 times consecutively while already running
    const cancelCheck = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const originalCancel = window.cancelAnimationFrame;
      let cancelCount = 0;
      window.cancelAnimationFrame = (id: number) => {
        cancelCount++;
        return originalCancel.call(window, id);
      };

      // Already running (from beforeEach click START GAME)
      // Call startGame 5 more times consecutively
      for (let i = 0; i < 5; i++) {
        gm.startGame();
      }

      gm.stopGame();
      window.cancelAnimationFrame = originalCancel;

      return { 
        cancelCount, // 5 calls to startGame + 1 stopGame = 6 cancels
        finalStateAfterStop: gm.animationFrameId,
      };
    });

    expect(cancelCheck.cancelCount).toBe(6);
    expect(cancelCheck.finalStateAfterStop).toBe(0);

    // 2. Empirical measurement: Restart game 5 times and measure frame tick rate over 500ms
    const rAfExecutionMetrics = await page.evaluate(async () => {
      const gm = (window as any).gameManager;
      // Restart 5 times
      for (let i = 0; i < 5; i++) {
        gm.startGame();
      }

      let loopTickCount = 0;
      const originalUpdate = gm.update;
      gm.update = function (dt: number) {
        loopTickCount++;
        return originalUpdate.call(gm, dt);
      };

      const startTime = performance.now();
      await new Promise(resolve => setTimeout(resolve, 300));
      const endTime = performance.now();

      gm.update = originalUpdate;
      gm.stopGame();

      return {
        loopTickCount,
        durationMs: endTime - startTime,
        // In 300ms at 60fps (1 loop), expect ~15-25 ticks. If 5 loops were running, it would be ~90-120 ticks!
      };
    });

    // Verify only 1 loop is actively running (around 15-25 ticks, well below 5-loop threshold of >60)
    expect(rAfExecutionMetrics.loopTickCount).toBeLessThan(35);
    expect(rAfExecutionMetrics.loopTickCount).toBeGreaterThan(10);
  });

  test('F-04 [STRESS]: Rapid-fire assault of 5 enemy bullets within 0.1s deals only 1 damage due to 1.0s i-frames', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;

      gm.isGodMode = false;
      gm.player.hp = 5;
      gm.player.invincibilityTimer = 0;

      const playerX = gm.player.position.x;
      const playerY = gm.player.position.y;

      const bulletResults: { step: number; hp: number; iFrameTimer: number; bulletIsDead: boolean }[] = [];

      // Step 1: Bullet 1 hits player at t = 0.0s
      const bullet1 = new BulletClass(playerX, playerY, 200, 1, false);
      gm.bullets = [bullet1];
      gm.checkCollisions();
      bulletResults.push({
        step: 1,
        hp: gm.player.hp,
        iFrameTimer: gm.player.invincibilityTimer,
        bulletIsDead: bullet1.isDead,
      });

      // Step 2: Bullets 2, 3, 4, 5 hit player at t = 0.02s, 0.04s, 0.06s, 0.08s (within 0.1s)
      for (let i = 2; i <= 5; i++) {
        gm.player.update(0.02); // advance time by 20ms
        const nextBullet = new BulletClass(playerX, playerY, 200, 1, false);
        gm.bullets = [nextBullet];
        gm.checkCollisions();
        bulletResults.push({
          step: i,
          hp: gm.player.hp,
          iFrameTimer: gm.player.invincibilityTimer,
          bulletIsDead: nextBullet.isDead,
        });
      }

      // Step 3: Mid-way test at t = 0.5s (0.42s later)
      gm.player.update(0.42);
      const bulletMid = new BulletClass(playerX, playerY, 200, 1, false);
      gm.bullets = [bulletMid];
      gm.checkCollisions();
      const midHp = gm.player.hp;
      const midTimer = gm.player.invincibilityTimer;

      // Step 4: Expiration test at t = 1.1s (0.6s later -> i-frames fully expired)
      gm.player.update(0.6);
      const expiredTimer = gm.player.invincibilityTimer;
      const bulletAfterExpire = new BulletClass(playerX, playerY, 200, 1, false);
      gm.bullets = [bulletAfterExpire];
      gm.checkCollisions();
      const finalHp = gm.player.hp;
      const finalTimer = gm.player.invincibilityTimer;

      return {
        bulletResults,
        midHp,
        midTimer,
        expiredTimer,
        finalHp,
        finalTimer,
      };
    });

    // Verification 1: First bullet dealt 1 damage (5 -> 4) and initialized i-frame timer to 1.0s
    expect(result.bulletResults[0].hp).toBe(4);
    expect(result.bulletResults[0].iFrameTimer).toBe(1.0);
    expect(result.bulletResults[0].bulletIsDead).toBe(true);

    // Verification 2: Bullets 2..5 dealt 0 damage (HP stayed 4) and bullets were destroyed
    for (let i = 1; i < 5; i++) {
      expect(result.bulletResults[i].hp).toBe(4);
      expect(result.bulletResults[i].bulletIsDead).toBe(true);
      expect(result.bulletResults[i].iFrameTimer).toBeGreaterThan(0.8);
    }

    // Verification 3: Mid-way at ~0.5s still protected
    expect(result.midHp).toBe(4);
    expect(result.midTimer).toBeCloseTo(0.5, 1);

    // Verification 4: Expired timer reaches 0 and next hit deals damage (4 -> 3)
    expect(result.expiredTimer).toBe(0);
    expect(result.finalHp).toBe(3);
    expect(result.finalTimer).toBe(1.0);
  });
});

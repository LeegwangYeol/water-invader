import { test, expect } from '@playwright/test';

test.describe('Milestone 1: Core Engine & Collision Fixes Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('F-01 [CRITICAL]: Enemy-vs-Barricade collision functions independently with 0 active bullets', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Clear bullets completely
      gm.bullets = [];

      // Place normal enemy colliding with destructible barricade
      const normalEnemy = new EnemyClass(100, 100, gm.canvas.width, 1, 0); // NORMAL
      const barricade = gm.barricades[0];
      barricade.position.x = 100;
      barricade.position.y = 100;
      const initialHp = barricade.hp;
      gm.enemies = [normalEnemy];

      // Run checkCollisions with 0 bullets
      gm.checkCollisions();

      return {
        activeBulletsCount: gm.bullets.length,
        isGnawing: normalEnemy.isGnawing,
        barricadeDamaged: barricade.hp < initialHp,
        barricadeHp: barricade.hp,
      };
    });

    expect(result.activeBulletsCount).toBe(0);
    expect(result.isGnawing).toBe(true);
    expect(result.barricadeDamaged).toBe(true);
  });

  test('F-02 [CRITICAL]: Repeated start/startGame calls cancel existing rAF loop', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const firstRafId = gm.animationFrameId;

      // Call start/startGame again
      gm.startGame();
      const secondRafId = gm.animationFrameId;

      gm.start();
      const thirdRafId = gm.animationFrameId;

      // Stop game
      gm.stopGame();
      const stoppedRafId = gm.animationFrameId;

      return {
        firstRafId,
        secondRafId,
        thirdRafId,
        stoppedRafId,
      };
    });

    expect(result.firstRafId).toBeGreaterThan(0);
    expect(result.secondRafId).toBeGreaterThan(0);
    expect(result.thirdRafId).toBeGreaterThan(0);
    expect(result.stoppedRafId).toBe(0);
  });

  test('F-04 [HIGH]: Player i-Frames (invincibilityTimer) protects from consecutive damage and decrements in update', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;

      gm.isGodMode = false;
      gm.player.hp = 5;
      gm.player.invincibilityTimer = 0;

      // Spawn enemy bullet colliding with player
      const enemyBullet1 = new BulletClass(gm.player.position.x, gm.player.position.y, 200, 1, false);
      gm.bullets = [enemyBullet1];

      // First hit
      gm.checkCollisions();
      const hpAfterHit1 = gm.player.hp;
      const timerAfterHit1 = gm.player.invincibilityTimer;

      // Second hit immediately while in i-frames
      const enemyBullet2 = new BulletClass(gm.player.position.x, gm.player.position.y, 200, 1, false);
      gm.bullets = [enemyBullet2];
      gm.checkCollisions();
      const hpAfterHit2 = gm.player.hp;

      // Update for 0.5s -> timer should be ~0.5
      gm.player.update(0.5);
      const timerAfter05s = gm.player.invincibilityTimer;

      // Update for 0.6s -> timer should reach 0
      gm.player.update(0.6);
      const timerAfterExpired = gm.player.invincibilityTimer;

      return {
        hpAfterHit1,
        timerAfterHit1,
        hpAfterHit2,
        timerAfter05s,
        timerAfterExpired,
      };
    });

    expect(result.hpAfterHit1).toBe(4);
    expect(result.timerAfterHit1).toBe(1.0);
    // Blocked damage during i-frames!
    expect(result.hpAfterHit2).toBe(4);
    expect(result.timerAfter05s).toBeCloseTo(0.5, 1);
    expect(result.timerAfterExpired).toBe(0);
  });

  test('F-06 [HIGH]: Shielded enemy absorbs damage via shieldHp first and triggers 5s cooldown when broken', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      const shieldedEnemy = new EnemyClass(100, 100, gm.canvas.width, 1, 5); // SHIELDED
      gm.enemies = [shieldedEnemy];
      const initialHp = shieldedEnemy.hp;
      const initialShield = shieldedEnemy.shieldHp; // 3

      // Bullet 1: 1 damage -> shieldHp: 2, bodyHp unchanged
      const b1 = new BulletClass(100, 100, -400, 1, true, 1);
      gm.bullets = [b1];
      gm.checkCollisions();
      const shieldAfterHit1 = shieldedEnemy.shieldHp;
      const hpAfterHit1 = shieldedEnemy.hp;

      // Bullet 2: 2 damage -> breaks shield -> shieldHp: 0, shieldRegenTimer: 5.0
      const b2 = new BulletClass(100, 100, -400, 2, true, 1);
      gm.bullets = [b2];
      gm.checkCollisions();
      const shieldAfterHit2 = shieldedEnemy.shieldHp;
      const regenTimerAfterBreak = shieldedEnemy.shieldRegenTimer;
      const hpAfterHit2 = shieldedEnemy.hp;

      // Bullet 3: hit while shield is down -> damages body HP
      const b3 = new BulletClass(100, 100, -400, 1, true, 1);
      gm.bullets = [b3];
      gm.checkCollisions();
      const hpAfterHit3 = shieldedEnemy.hp;

      return {
        initialHp,
        initialShield,
        shieldAfterHit1,
        hpAfterHit1,
        shieldAfterHit2,
        regenTimerAfterBreak,
        hpAfterHit2,
        hpAfterHit3,
      };
    });

    expect(result.initialShield).toBe(3);
    expect(result.shieldAfterHit1).toBe(2);
    expect(result.hpAfterHit1).toBe(result.initialHp);
    expect(result.shieldAfterHit2).toBe(0);
    expect(result.regenTimerAfterBreak).toBe(5.0);
    expect(result.hpAfterHit2).toBe(result.initialHp);
    expect(result.hpAfterHit3).toBe(result.initialHp - 1);
  });

  test('F-07 [HIGH]: Sniper interceptable purple bullet collides with player bullet and both are destroyed', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      const sniper = new EnemyClass(200, 100, gm.canvas.width, 1, 3); // SNIPER
      sniper.fireTimer = 0;
      const sniperBullet = sniper.fire(gm.player.position);
      const isInterceptable = sniperBullet.isInterceptable;

      // Spawn player bullet at the exact same location
      const playerBullet = new BulletClass(sniperBullet.position.x, sniperBullet.position.y, -400, 1, true, 1);
      gm.bullets = [sniperBullet, playerBullet];

      gm.checkCollisions();

      return {
        isInterceptable,
        sniperBulletDead: sniperBullet.isDead,
        playerBulletDead: playerBullet.isDead,
      };
    });

    expect(result.isInterceptable).toBe(true);
    expect(result.sniperBulletDead).toBe(true);
    expect(result.playerBulletDead).toBe(true);
  });

  test('F-08 [HIGH]: Near-miss suppression triggers only once per bullet (hasTriggeredNearMiss)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;

      gm.player.suppressionLevel = 0;
      gm.player.stressLevel = 0;

      // Place enemy bullet passing near player (outside player box, but dx < 80 from center)
      const nearBullet = new BulletClass(gm.player.position.x + 60, gm.player.position.y + 10, 200, 1, false);
      gm.bullets = [nearBullet];

      // Frame 1 checkCollisions
      gm.checkCollisions();
      const supp1 = gm.player.suppressionLevel;
      const flag1 = nearBullet.hasTriggeredNearMiss;

      // Frame 2 checkCollisions with the same bullet in range
      gm.checkCollisions();
      const supp2 = gm.player.suppressionLevel;

      return {
        supp1,
        flag1,
        supp2,
      };
    });

    expect(result.supp1).toBe(15);
    expect(result.flag1).toBe(true);
    // Should NOT double trigger on frame 2!
    expect(result.supp2).toBe(15);
  });

  test('F-15 [MEDIUM]: Corrupted localStorage NaN recovery falls back to 0 and stores valid high score', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      // Corrupt localStorage with NaN string
      localStorage.setItem('waterInvaderHighScore', 'NaN');

      gm.score = 350;
      gm.gameOver('Test Game Over');

      const savedScore = localStorage.getItem('waterInvaderHighScore');

      return {
        savedScore,
      };
    });

    expect(result.savedScore).toBe('350');
  });
});

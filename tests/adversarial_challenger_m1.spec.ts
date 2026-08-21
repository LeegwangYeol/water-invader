import { test, expect } from '@playwright/test';

test.describe('Milestone 1 Adversarial Challenge & Stress Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('ADV-F06: Shielded Enemy — Overkill damage absorption, body protection, and 5s cooldown timer progression', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      const shieldedEnemy = new EnemyClass(100, 100, gm.canvas.width, 1, 5); // EnemyType.SHIELDED
      gm.enemies = [shieldedEnemy];
      const initialHp = shieldedEnemy.hp;
      const initialShield = shieldedEnemy.shieldHp; // 3

      // 1. Massive 10 damage bullet hitting 3 HP shield
      const overkillBullet = new BulletClass(100, 100, -400, 10, true, 1);
      gm.bullets = [overkillBullet];
      gm.checkCollisions();

      const shieldAfterOverkill = shieldedEnemy.shieldHp;
      const timerAfterOverkill = shieldedEnemy.shieldRegenTimer;
      const hpAfterOverkill = shieldedEnemy.hp;
      const bulletDeadAfterOverkill = overkillBullet.isDead;

      // 2. Damage enemy while shield is on cooldown (shieldHp = 0)
      const normalBullet = new BulletClass(100, 100, -400, 1, true, 1);
      gm.bullets = [normalBullet];
      gm.checkCollisions();
      const hpAfterBodyHit = shieldedEnemy.hp;

      // 3. Update cooldown for 2.5s -> shield should still be 0
      shieldedEnemy.update(2.5, 1.0, []);
      const shieldAt2_5s = shieldedEnemy.shieldHp;
      const timerAt2_5s = shieldedEnemy.shieldRegenTimer;

      // 4. Update cooldown for another 2.6s (total 5.1s > 5.0s) -> shield regenerates to 3
      shieldedEnemy.update(2.6, 1.0, []);
      const shieldAt5_1s = shieldedEnemy.shieldHp;
      const timerAt5_1s = shieldedEnemy.shieldRegenTimer;

      return {
        initialShield,
        shieldAfterOverkill,
        timerAfterOverkill,
        hpAfterOverkill,
        bulletDeadAfterOverkill,
        hpAfterBodyHit,
        shieldAt2_5s,
        timerAt2_5s,
        shieldAt5_1s,
        timerAt5_1s,
        initialHp,
      };
    });

    expect(result.initialShield).toBe(3);
    expect(result.shieldAfterOverkill).toBe(0);
    expect(result.timerAfterOverkill).toBe(5.0);
    expect(result.hpAfterOverkill).toBe(result.initialHp); // Absorbed!
    expect(result.bulletDeadAfterOverkill).toBe(true);
    expect(result.hpAfterBodyHit).toBe(result.initialHp - 1); // Body took damage while shield down
    expect(result.shieldAt2_5s).toBe(0);
    expect(result.timerAt2_5s).toBeCloseTo(2.5, 1);
    expect(result.shieldAt5_1s).toBe(3); // Fully regenerated after 5.0s
    expect(result.timerAt5_1s).toBe(0);
  });

  test('ADV-F07: Sniper Bullets — Targeted interception vs normal bullets and swarm behavior', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;

      // 1. Sniper bullet (interceptable) vs Player Bullet
      const sniperBullet = new BulletClass(200, 300, 400, 1, false);
      sniperBullet.isInterceptable = true;
      const playerBullet1 = new BulletClass(200, 300, -400, 1, true, 1);

      // 2. Normal enemy bullet (NOT interceptable) vs Player Bullet
      const normalBullet = new BulletClass(400, 300, 200, 1, false);
      normalBullet.isInterceptable = false;
      const playerBullet2 = new BulletClass(400, 300, -400, 1, true, 1);

      gm.bullets = [sniperBullet, playerBullet1, normalBullet, playerBullet2];
      gm.checkCollisions();

      return {
        sniperBulletDead: sniperBullet.isDead,
        playerBullet1Dead: playerBullet1.isDead,
        normalBulletDead: normalBullet.isDead,
        playerBullet2Dead: playerBullet2.isDead,
      };
    });

    expect(result.sniperBulletDead).toBe(true);
    expect(result.playerBullet1Dead).toBe(true);
    // Normal enemy bullet is NOT intercepted
    expect(result.normalBulletDead).toBe(false);
    expect(result.playerBullet2Dead).toBe(false);
  });

  test('ADV-F08: Near-Miss Suppression — 100-frame passage, exact single trigger, and dx boundary test', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;

      gm.player.suppressionLevel = 0;
      gm.player.stressLevel = 0;
      gm.player.position.x = 200;
      gm.player.position.y = 700;
      gm.player.size = { width: 50, height: 40 };

      // Bullet passing player with dx = 45 (inside dx < 80 near-miss zone)
      const nearBullet = new BulletClass(265, 715, 100, 1, false);
      gm.bullets = [nearBullet];

      let triggers = 0;
      for (let frame = 0; frame < 100; frame++) {
        const prevSupp = gm.player.suppressionLevel;
        gm.checkCollisions();
        if (gm.player.suppressionLevel > prevSupp) {
          triggers++;
        }
      }
      const finalSupp = gm.player.suppressionLevel;
      const finalStress = gm.player.stressLevel;
      const bulletFlag = nearBullet.hasTriggeredNearMiss;

      // Far bullet with dx = 90 (outside dx < 80)
      gm.player.suppressionLevel = 0;
      const farBullet = new BulletClass(310, 715, 100, 1, false);
      gm.bullets = [farBullet];
      gm.checkCollisions();
      const farSupp = gm.player.suppressionLevel;

      return {
        triggers,
        finalSupp,
        finalStress,
        bulletFlag,
        farSupp,
        farFlag: farBullet.hasTriggeredNearMiss,
      };
    });

    expect(result.triggers).toBe(1);
    expect(result.finalSupp).toBe(15);
    expect(result.finalStress).toBe(5);
    expect(result.bulletFlag).toBe(true);
    expect(result.farSupp).toBe(0);
    expect(result.farFlag).toBe(false);
  });

  test('ADV-F15: LocalStorage Resilience — Corrupted NaN, string garbage, negative values, and disabled storage', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      // 1. Recover from 'NaN'
      localStorage.setItem('waterInvaderHighScore', 'NaN');
      gm.score = 750;
      gm.gameOver('Test');
      const scoreAfterNaN = localStorage.getItem('waterInvaderHighScore');

      // 2. Recover from invalid string
      localStorage.setItem('waterInvaderHighScore', 'undefined');
      gm.score = 800;
      gm.gameOver('Test');
      const scoreAfterUndef = localStorage.getItem('waterInvaderHighScore');

      // 3. Higher score preservation
      localStorage.setItem('waterInvaderHighScore', '1500');
      gm.score = 600;
      gm.gameOver('Test');
      const scoreAfterLower = localStorage.getItem('waterInvaderHighScore');

      return {
        scoreAfterNaN,
        scoreAfterUndef,
        scoreAfterLower,
      };
    });

    expect(result.scoreAfterNaN).toBe('750');
    expect(result.scoreAfterUndef).toBe('800');
    expect(result.scoreAfterLower).toBe('1500');
  });
});

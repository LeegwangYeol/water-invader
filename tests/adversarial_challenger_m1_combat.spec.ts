import { test, expect } from '@playwright/test';

test.describe('Challenger 2 Empirical Verification: Combat, Bullets, and Shields (F-04, F-06, F-07, F-08)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('F-04 [STRESS]: 50 overlapping enemy bullets hitting simultaneously deals exactly 1 HP damage and consumes all bullets', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;

      gm.isGodMode = false;
      gm.player.hp = 5;
      gm.player.invincibilityTimer = 0;

      const playerX = gm.player.position.x;
      const playerY = gm.player.position.y;

      // Spawn 50 overlapping enemy bullets right onto player
      const swarm: any[] = [];
      for (let i = 0; i < 50; i++) {
        const b = new BulletClass(playerX + (i % 5) * 2, playerY + (i % 3) * 2, 200, 1, false);
        swarm.push(b);
      }
      gm.bullets = swarm;

      // Run collision detection
      gm.checkCollisions();

      const hpAfterSimultaneousHit = gm.player.hp;
      const timerAfterHit = gm.player.invincibilityTimer;
      const allConsumed = swarm.every((b: any) => b.isDead === true);

      // Advance physics by 0.5s while in i-frames
      for (let f = 0; f < 30; f++) {
        gm.player.update(0.016);
        const midBullet = new BulletClass(playerX, playerY, 200, 1, false);
        gm.bullets = [midBullet];
        gm.checkCollisions();
      }
      const hpMidIframe = gm.player.hp;

      // Advance time past 1.0s (total dt = 0.6s)
      gm.player.update(0.6);
      const timerExpired = gm.player.invincibilityTimer;

      // Hit again after expiry
      const postBullet = new BulletClass(playerX, playerY, 200, 1, false);
      gm.bullets = [postBullet];
      gm.checkCollisions();
      const hpPostExpiry = gm.player.hp;

      return {
        hpAfterSimultaneousHit,
        timerAfterHit,
        allConsumed,
        hpMidIframe,
        timerExpired,
        hpPostExpiry,
      };
    });

    expect(result.hpAfterSimultaneousHit).toBe(4);
    expect(result.timerAfterHit).toBe(1.0);
    expect(result.allConsumed).toBe(true);
    expect(result.hpMidIframe).toBe(4);
    expect(result.timerExpired).toBe(0);
    expect(result.hpPostExpiry).toBe(3);
  });

  test('F-06 [STRESS]: Shielded enemy with massive overkill 50 damage bullet absorbs as gate, triggers 5.0s cooldown, body HP intact', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      const shieldedEnemy = new EnemyClass(100, 100, gm.canvas.width, 1, 5); // SHIELDED = 5
      gm.enemies = [shieldedEnemy];
      const initialBodyHp = shieldedEnemy.hp;
      const initialShieldHp = shieldedEnemy.shieldHp;

      // 1. Massive 50 damage bullet
      const overkillBullet = new BulletClass(100, 100, -400, 50, true, 1);
      gm.bullets = [overkillBullet];
      gm.checkCollisions();

      const shieldAfterOverkill = shieldedEnemy.shieldHp;
      const timerAfterOverkill = shieldedEnemy.shieldRegenTimer;
      const bodyHpAfterOverkill = shieldedEnemy.hp;
      const bulletConsumed = overkillBullet.isDead;

      // 2. Advance 2.5s
      shieldedEnemy.update(2.5, 1.0, []);
      const shieldAt2_5s = shieldedEnemy.shieldHp;
      const timerAt2_5s = shieldedEnemy.shieldRegenTimer;

      // 3. Advance to 5.1s (> 5.0s)
      shieldedEnemy.update(2.6, 1.0, []);
      const shieldAt5_1s = shieldedEnemy.shieldHp;
      const timerAt5_1s = shieldedEnemy.shieldRegenTimer;

      // 4. Overkill 100 damage bullet on regenerated shield
      const overkill100 = new BulletClass(shieldedEnemy.position.x, shieldedEnemy.position.y, -400, 100, true, 1);
      gm.bullets = [overkill100];
      gm.checkCollisions();

      const shieldAfterSecondOverkill = shieldedEnemy.shieldHp;
      const timerAfterSecondOverkill = shieldedEnemy.shieldRegenTimer;
      const bodyHpAfterSecondOverkill = shieldedEnemy.hp;

      return {
        initialShieldHp,
        shieldAfterOverkill,
        timerAfterOverkill,
        bodyHpAfterOverkill,
        initialBodyHp,
        bulletConsumed,
        shieldAt2_5s,
        timerAt2_5s,
        shieldAt5_1s,
        timerAt5_1s,
        shieldAfterSecondOverkill,
        timerAfterSecondOverkill,
        bodyHpAfterSecondOverkill,
      };
    });

    expect(result.initialShieldHp).toBe(3);
    expect(result.shieldAfterOverkill).toBe(0);
    expect(result.timerAfterOverkill).toBe(5.0);
    expect(result.bodyHpAfterOverkill).toBe(result.initialBodyHp);
    expect(result.bulletConsumed).toBe(true);
    expect(result.shieldAt2_5s).toBe(0);
    expect(result.timerAt2_5s).toBeCloseTo(2.5, 1);
    expect(result.shieldAt5_1s).toBe(3);
    expect(result.timerAt5_1s).toBe(0);
    expect(result.shieldAfterSecondOverkill).toBe(0);
    expect(result.timerAfterSecondOverkill).toBe(5.0);
    expect(result.bodyHpAfterSecondOverkill).toBe(result.initialBodyHp);
  });

  test('F-07 [STRESS]: Sniper bullet interception with multi-shot angled bullets destroys sniper bullets while normal bullets pass through', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;

      gm.player.position.x = 275;
      gm.player.position.y = 700;

      // Multi-shot angled bullets
      gm.player.fireTimer = 0;
      gm.player.multiShot = 5;
      const firedBullets = gm.player.fire();

      // Test mid-field collisions at Y=400
      const playerBullets: any[] = [
        new BulletClass(235, 400, -400, 1, true, 1),
        new BulletClass(255, 400, -400, 1, true, 1),
        new BulletClass(275, 400, -400, 1, true, 1),
        new BulletClass(295, 400, -400, 1, true, 1),
        new BulletClass(315, 400, -400, 1, true, 1),
      ];

      // 3 sniper bullets (interceptable) overlapping player bullets 0, 2, 4
      const sniperB0 = new BulletClass(playerBullets[0].position.x, playerBullets[0].position.y, 300, 1, false);
      sniperB0.isInterceptable = true;
      const sniperB2 = new BulletClass(playerBullets[2].position.x, playerBullets[2].position.y, 300, 1, false);
      sniperB2.isInterceptable = true;
      const sniperB4 = new BulletClass(playerBullets[4].position.x, playerBullets[4].position.y, 300, 1, false);
      sniperB4.isInterceptable = true;

      // 2 normal enemy bullets (NOT interceptable) overlapping player bullets 1, 3
      const normalB1 = new BulletClass(playerBullets[1].position.x, playerBullets[1].position.y, 300, 1, false);
      normalB1.isInterceptable = false;
      const normalB3 = new BulletClass(playerBullets[3].position.x, playerBullets[3].position.y, 300, 1, false);
      normalB3.isInterceptable = false;

      gm.bullets = [...playerBullets, sniperB0, sniperB2, sniperB4, normalB1, normalB3];
      gm.checkCollisions();

      return {
        firedCount: firedBullets.length,
        hasAngledVelocities: firedBullets.some((b: any) => b.velocity.x !== 0),
        sniper0Dead: sniperB0.isDead,
        sniper2Dead: sniperB2.isDead,
        sniper4Dead: sniperB4.isDead,
        player0Dead: playerBullets[0].isDead,
        player2Dead: playerBullets[2].isDead,
        player4Dead: playerBullets[4].isDead,
        normal1Dead: normalB1.isDead,
        normal3Dead: normalB3.isDead,
        player1Dead: playerBullets[1].isDead,
        player3Dead: playerBullets[3].isDead,
      };
    });

    expect(result.firedCount).toBe(5);
    expect(result.hasAngledVelocities).toBe(true);
    expect(result.sniper0Dead).toBe(true);
    expect(result.sniper2Dead).toBe(true);
    expect(result.sniper4Dead).toBe(true);
    expect(result.player0Dead).toBe(true);
    expect(result.player2Dead).toBe(true);
    expect(result.player4Dead).toBe(true);
    expect(result.normal1Dead).toBe(false);
    expect(result.normal3Dead).toBe(false);
    expect(result.player1Dead).toBe(false);
    expect(result.player3Dead).toBe(false);
  });

  test('F-08 [STRESS]: Near-miss suppression skimming player border across 200 consecutive physics frames triggers suppression once', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;

      gm.player.suppressionLevel = 0;
      gm.player.stressLevel = 0;
      gm.player.position.x = 200;
      gm.player.position.y = 700;
      gm.player.size = { width: 50, height: 40 };

      // Bullet skimming player at dx = 45 < 80, inside Y [700, 740]
      const skimmingBullet = new BulletClass(265, 715, 0, 1, false);
      gm.bullets = [skimmingBullet];

      let triggerCount = 0;
      for (let f = 1; f <= 200; f++) {
        const prevSupp = gm.player.suppressionLevel;
        gm.checkCollisions();
        if (gm.player.suppressionLevel > prevSupp) {
          triggerCount++;
        }
      }

      const finalSuppression = gm.player.suppressionLevel;
      const finalStress = gm.player.stressLevel;
      const bulletFlagged = skimmingBullet.hasTriggeredNearMiss;
      const bulletIsDead = skimmingBullet.isDead;

      // 10 distinct skimming bullets
      gm.player.suppressionLevel = 0;
      gm.player.stressLevel = 0;
      const tenBullets: any[] = [];
      for (let b = 0; b < 10; b++) {
        tenBullets.push(new BulletClass(260 + (b % 4) * 2, 715, 0, 1, false));
      }
      gm.bullets = tenBullets;

      for (let f = 1; f <= 50; f++) {
        gm.checkCollisions();
      }

      const tenSuppression = gm.player.suppressionLevel;
      const tenStress = gm.player.stressLevel;
      const allTenFlagged = tenBullets.every((b: any) => b.hasTriggeredNearMiss === true);

      return {
        triggerCount,
        finalSuppression,
        finalStress,
        bulletFlagged,
        bulletIsDead,
        tenSuppression,
        tenStress,
        allTenFlagged,
      };
    });

    expect(result.triggerCount).toBe(1);
    expect(result.finalSuppression).toBe(15);
    expect(result.finalStress).toBe(5);
    expect(result.bulletFlagged).toBe(true);
    expect(result.bulletIsDead).toBe(false);
    expect(result.tenSuppression).toBe(100);
    expect(result.tenStress).toBe(50);
    expect(result.allTenFlagged).toBe(true);
  });
});

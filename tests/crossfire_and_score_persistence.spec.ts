import { test, expect } from '@playwright/test';

test.describe('Crossfire & Score/Cash Persistence Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    // Start game so window.gameManager is initialized
    await page.click('button:has-text("START GAME")');
    await page.waitForFunction(() => !!(window as any).gameManager);
  });

  // =========================================================================
  // R1: SCORE AND CASH PERSISTENCE ON DEATH
  // =========================================================================

  test('R1.1: Score and Currency persist when player dies and game respawns/restarts via continueGame()', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      
      // Setup initial score and currency accumulation
      gm.score = 750;
      gm.currency = 125;
      gm.level = 3;

      // Simulate player death
      gm.player.hp = 0;
      (gm as any).gameOver('Player died in combat');

      const stateAfterDeath = gm.state; // Should be GAME_OVER
      const scoreOnDeath = gm.score;
      const currencyOnDeath = gm.currency;

      // Simulate continue / respawn on current wave
      gm.continueGame();
      const scoreAfterRespawn = gm.score;
      const currencyAfterRespawn = gm.currency;
      const levelAfterRespawn = gm.level;
      const playerHpAfterRespawn = gm.player.hp;

      // Accumulate more score and currency in the new session
      gm.score += 200;
      gm.currency += 30;

      return {
        stateAfterDeath,
        scoreOnDeath,
        currencyOnDeath,
        scoreAfterRespawn,
        currencyAfterRespawn,
        levelAfterRespawn,
        playerHpAfterRespawn,
        finalScore: gm.score,
        finalCurrency: gm.currency,
      };
    });

    expect(result.stateAfterDeath).toBe('GAME_OVER');
    expect(result.scoreOnDeath).toBe(750);
    expect(result.currencyOnDeath).toBe(125);
    expect(result.scoreAfterRespawn).toBe(750);
    expect(result.currencyAfterRespawn).toBe(125);
    expect(result.playerHpAfterRespawn).toBe(3);
    expect(result.levelAfterRespawn).toBe(3);
    expect(result.finalScore).toBe(950);
    expect(result.finalCurrency).toBe(155);
  });

  test('R1.2: End-to-End UI check: Score and Pure Water carry over after clicking Continue', async ({ page }) => {
    // Accumulate currency and score via console
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.score = 1200;
      gm.currency = 250;
      (gm as any).updateScoreUI();
      // Kill player to trigger Game Over UI
      gm.player.hp = 0;
      (gm as any).gameOver('정수기 파괴');
    });

    // Verify GameOver modal shows the final score
    await expect(page.locator('text=GAME OVER')).toBeVisible();
    await expect(page.locator('text=Final')).toBeVisible();

    // Click Continue
    await page.click('button:has-text("Continue")');

    // Verify in HUD that the score and currency carried over
    const hudData = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        score: gm.score,
        currency: gm.currency,
        state: gm.state,
      };
    });

    expect(hudData.score).toBe(1200);
    expect(hudData.currency).toBe(250);
    expect(hudData.state).toBe('PLAYING');
  });

  // =========================================================================
  // R2: ENEMY CROSSFIRE & FRIENDLY FIRE PROJECTILES
  // =========================================================================

  test('R2.1: Invader projectile damages another Invader (same-faction friendly fire)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = (window as any).Bullet;

      gm.enemies = [];
      gm.bullets = [];

      // Create target Invader with 3 HP
      const targetInvader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
      targetInvader.hp = 3;
      targetInvader.faction = 'INVADER';
      gm.enemies.push(targetInvader);

      // Create Invader bullet overlapping targetInvader
      const invaderBullet = new BulletClass(200, 200, 200, 1, false, 1);
      invaderBullet.faction = 'INVADER';
      gm.bullets.push(invaderBullet);

      (gm as any).checkCollisions();

      return {
        bulletDead: invaderBullet.isDead,
        targetHp: targetInvader.hp,
        targetDead: targetInvader.isDead,
      };
    });

    expect(result.bulletDead).toBe(true);
    expect(result.targetHp).toBe(2);
    expect(result.targetDead).toBe(false);
  });

  test('R2.2: Invader projectile eliminating another Invader awards crossfire kill score & combo', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = (window as any).Bullet;

      gm.enemies = [];
      gm.bullets = [];
      const scoreBefore = gm.score;
      const currencyBefore = gm.currency;
      const comboBefore = gm.combo;

      const targetInvader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
      targetInvader.hp = 1;
      targetInvader.faction = 'INVADER';
      gm.enemies.push(targetInvader);

      const invaderBullet = new BulletClass(200, 200, 200, 1, false, 1);
      invaderBullet.faction = 'INVADER';
      gm.bullets.push(invaderBullet);

      (gm as any).checkCollisions();

      return {
        targetDead: targetInvader.isDead,
        scoreAfter: gm.score,
        currencyAfter: gm.currency,
        comboAfter: gm.combo,
        scoreDelta: gm.score - scoreBefore,
        currencyDelta: gm.currency - currencyBefore,
        comboDelta: gm.combo - comboBefore,
      };
    });

    expect(result.targetDead).toBe(true);
    expect(result.scoreDelta).toBe(150); // Base crossfire score
    expect(result.currencyDelta).toBe(8); // Base crossfire currency
    expect(result.comboDelta).toBe(1);
  });

  test('R2.3: Rogue projectile damages another Rogue (same-faction friendly fire)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = (window as any).Bullet;

      gm.enemies = [];
      gm.bullets = [];

      const targetRogue = new EnemyClass(250, 250, gm.logicalWidth, 1, 7, gm.logicalHeight);
      targetRogue.hp = 4;
      targetRogue.faction = 'ROGUE';
      gm.enemies.push(targetRogue);

      const rogueBullet = new BulletClass(250, 250, -200, 2, false, 1);
      rogueBullet.faction = 'ROGUE';
      gm.bullets.push(rogueBullet);

      (gm as any).checkCollisions();

      return {
        bulletDead: rogueBullet.isDead,
        targetHp: targetRogue.hp,
        targetDead: targetRogue.isDead,
      };
    });

    expect(result.bulletDead).toBe(true);
    expect(result.targetHp).toBe(2);
    expect(result.targetDead).toBe(false);
  });

  test('R2.4: Shooter enemy does NOT take damage on the frame of firing (self-damage immunity)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      gm.enemies = [];
      gm.bullets = [];

      const shooter = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
      shooter.hp = 3;
      shooter.faction = 'INVADER';
      (shooter as any).fireTimer = 0;
      gm.enemies.push(shooter);

      const bullet = shooter.fire(gm.player.position, gm.enemies);
      if (bullet) {
        gm.bullets.push(bullet);
      }

      // Check collision on the spawn frame
      (gm as any).checkCollisions();

      return {
        bulletFired: !!bullet,
        bulletDead: bullet ? bullet.isDead : null,
        shooterHp: shooter.hp,
        shooterDead: shooter.isDead,
      };
    });

    expect(result.bulletFired).toBe(true);
    expect(result.bulletDead).toBe(false);
    expect(result.shooterHp).toBe(3);
    expect(result.shooterDead).toBe(false);
  });

  test('R2.5: Sniper crossfire targeting evaluates threats across all enemy units and aims accordingly', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      gm.enemies = [];
      gm.bullets = [];

      // Invader Sniper at (100, 100)
      const sniper = new EnemyClass(100, 100, gm.logicalWidth, 1, 3, gm.logicalHeight);
      sniper.faction = 'INVADER';
      (sniper as any).fireTimer = 0;
      gm.enemies.push(sniper);

      // Distant player at (300, 700)
      gm.player.position = { x: 300, y: 700 };

      // Nearby target enemy at (200, 100)
      const nearbyEnemy = new EnemyClass(200, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
      nearbyEnemy.faction = 'INVADER';
      gm.enemies.push(nearbyEnemy);

      const bullet = sniper.fire(gm.player.position, gm.enemies);

      return {
        bulletVelocityX: bullet ? bullet.velocity.x : 0,
        bulletVelocityY: bullet ? bullet.velocity.y : 0,
      };
    });

    // Bullet should aim horizontally towards the nearby enemy at X=200 rather than downwards towards player at Y=700
    expect(result.bulletVelocityX).toBeGreaterThan(100);
  });

  test('R2.6: Piercing bullet damages both an Invader and a Rogue in a single trajectory', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = (window as any).Bullet;

      gm.enemies = [];
      gm.bullets = [];

      // First enemy in path (Invader)
      const enemy1 = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
      enemy1.hp = 1;
      enemy1.faction = 'INVADER';

      // Second enemy in path (Rogue)
      const enemy2 = new EnemyClass(205, 200, gm.logicalWidth, 1, 7, gm.logicalHeight);
      enemy2.hp = 1;
      enemy2.faction = 'ROGUE';

      gm.enemies.push(enemy1, enemy2);

      // Bullet with piercing = 2 overlapping both
      const piercingBullet = new BulletClass(200, 200, 200, 1, false, 2);
      piercingBullet.faction = 'INVADER';
      gm.bullets.push(piercingBullet);

      (gm as any).checkCollisions();

      return {
        enemy1Dead: enemy1.isDead,
        enemy2Dead: enemy2.isDead,
        bulletDead: piercingBullet.isDead,
        bulletPiercing: piercingBullet.piercing,
      };
    });

    expect(result.enemy1Dead).toBe(true);
    expect(result.enemy2Dead).toBe(true);
    expect(result.bulletDead).toBe(true);
    expect(result.bulletPiercing).toBe(0);
  });
});

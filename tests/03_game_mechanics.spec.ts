import { test, expect } from '@playwright/test';

test.describe('R2: Game Mechanics & State Simulation Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('Simulate player keyboard movement and boundary clamping', async ({ page }) => {
    // 1. Move left
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowLeft');

    const posX1 = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posX1).toBeLessThan(275); // Moved left from initial 275

    // Move fully left to check clamping at 0
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(1200);
    await page.keyboard.up('ArrowLeft');

    const posXClampedLeft = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posXClampedLeft).toBe(0);

    // Move right
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');

    const posX2 = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posX2).toBeGreaterThan(0);

    // Move fully right to check clamping at canvasWidth - width (600 - 50 = 550)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2500);
    await page.keyboard.up('ArrowRight');

    const posXClampedRight = await page.evaluate(() => (window as any).gameManager.player.position.x);
    expect(posXClampedRight).toBe(550);
  });

  test('Simulate shooting mechanism and player bullet generation', async ({ page }) => {
    // Hold spacebar to shoot
    await page.keyboard.down('Space');
    await page.waitForTimeout(600);
    await page.keyboard.up('Space');

    const bulletData = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const playerBullets = gm.bullets.filter((b: any) => b.isPlayerBullet);
      return playerBullets.map((b: any) => ({
        x: b.position.x,
        y: b.position.y,
        vy: b.velocity.y,
        damage: b.damage,
        piercing: b.piercing,
        isPlayerBullet: b.isPlayerBullet,
      }));
    });

    expect(bulletData.length).toBeGreaterThan(0);
    const firstBullet = bulletData[0];
    expect(firstBullet.isPlayerBullet).toBe(true);
    expect(firstBullet.vy).toBe(-400); // Moves upwards
    expect(firstBullet.damage).toBe(1);
    expect(firstBullet.piercing).toBe(1);
  });

  test('Developer cheat keys: F3 (Debug), F4 (God Mode), F5 (Currency)', async ({ page }) => {
    // F3 toggle debug
    const initialDebug = await page.evaluate(() => (window as any).gameManager.isDebugMode);
    expect(initialDebug).toBe(false);

    await page.keyboard.press('F3');
    const debugAfterF3 = await page.evaluate(() => (window as any).gameManager.isDebugMode);
    expect(debugAfterF3).toBe(true);

    // F4 toggle god mode
    const initialGod = await page.evaluate(() => (window as any).gameManager.isGodMode);
    expect(initialGod).toBe(false);

    await page.keyboard.press('F4');
    const godAfterF4 = await page.evaluate(() => (window as any).gameManager.isGodMode);
    expect(godAfterF4).toBe(true);

    // F5 add 1000 currency
    const initialCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    await page.keyboard.press('F5');
    const currencyAfterF5 = await page.evaluate(() => (window as any).gameManager.currency);
    expect(currencyAfterF5).toBe(initialCurrency + 1000);
  });

  test('ALLY(Q) summon mechanism creates helpers and deducts currency', async ({ page }) => {
    // Give currency
    await page.keyboard.press('F5');
    const initialCurrency = await page.evaluate(() => (window as any).gameManager.currency);
    expect(initialCurrency).toBeGreaterThanOrEqual(50);

    // Press Q to trigger ALLY
    await page.keyboard.press('q');

    const currencyAfterAlly = await page.evaluate(() => (window as any).gameManager.currency);
    expect(currencyAfterAlly).toBe(initialCurrency - 50);

    // Fast-forward warning countdown timer to spawn helper immediately
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (gm.warningTimer > 0) {
        gm.warningTimer = 0.05;
      }
    });

    // Wait for helper spawn in game update loop
    await page.waitForTimeout(300);

    const helperCount = await page.evaluate(() => (window as any).gameManager.helpers.length);
    expect(helperCount).toBeGreaterThanOrEqual(1);

    const helperData = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return gm.helpers.map((h: any) => ({
        type: h.type,
        hp: h.hp,
        color: h.color,
        isExpired: h.isExpired(),
      }));
    });

    expect(helperData[0].isExpired).toBe(false);
    expect(helperData[0].hp).toBeGreaterThan(0);
  });

  test('Ultimate Skill Heavy Rain (E key) triggers at 100% gauge', async ({ page }) => {
    // Set ultimate gauge to 100%
    await page.evaluate(() => {
      (window as any).gameManager.player.ultimateGauge = 100;
    });

    // Press E to trigger ultimate
    await page.keyboard.press('e');

    const ultState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const ultBullets = gm.bullets.filter((b: any) => b.velocity.y === 300 && b.isPlayerBullet);
      return {
        ultimateGaugeAfter: gm.player.ultimateGauge,
        ultBulletsCount: ultBullets.length,
      };
    });

    expect(ultState.ultimateGaugeAfter).toBe(0);
    expect(ultState.ultBulletsCount).toBe(30); // 30 rain bullets spawned
  });

  test('Diver enemy dive acceleration & barricade explosion collision', async ({ page }) => {
    const diverCollisionResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;
      
      // Clear other enemies for clean test
      gm.enemies = [];
      
      // Position player at x: 275
      gm.player.position.x = 275;
      
      // Spawn Diver directly above player (x: 275, y: 100)
      const diver = new EnemyClass(275, 100, gm.canvas.width, 1, 4); // EnemyType.DIVER = 4
      gm.enemies.push(diver);
      
      const initialDiverY = diver.position.y;
      const diverSpeedY = diver.speedY; // base speedY (e.g. 8 or 10)
      
      // 1. Update Diver with playerPos aligned to trigger dive
      diver.update(0.1, 1.0, [], gm.player.position);
      const isDiving = diver.isDiving;
      const diverYAfterDive = diver.position.y;
      const dy = diverYAfterDive - initialDiverY;
      
      // 2. Test barricade collision & explosion
      // Place destructible barricade right at diver path
      const targetBarricade = gm.barricades[0]; // Destructible barricade
      targetBarricade.hp = 20;
      targetBarricade.position.x = 275;
      targetBarricade.position.y = 300;
      
      diver.position.x = 275;
      diver.position.y = 300; // Directly colliding with barricade

      // Ensure a bullet exists so checkCollisions outer loop executes
      const dummyBullet = new BulletClass(0, -100, -400, 1, true, 1);
      gm.bullets = [dummyBullet];
      
      const particlesBefore = gm.particles.length;
      gm.checkCollisions();
      const particlesAfter = gm.particles.length;
      
      return {
        isDiving,
        dy,
        expectedMinDy: diverSpeedY * 15 * 0.1 * 0.9, // 15x downward acceleration
        diverDeadAfterCrash: diver.isDead,
        barricadeHpAfterCrash: targetBarricade.hp,
        explosionParticlesSpawned: particlesAfter - particlesBefore,
      };
    });

    expect(diverCollisionResult.isDiving).toBe(true);
    expect(diverCollisionResult.dy).toBeGreaterThanOrEqual(diverCollisionResult.expectedMinDy);
    expect(diverCollisionResult.diverDeadAfterCrash).toBe(true);
    expect(diverCollisionResult.barricadeHpAfterCrash).toBe(0); // 20 - 20 crash dmg = 0
    expect(diverCollisionResult.explosionParticlesSpawned).toBe(30); // 30 red explosion particles
  });

  test('Splitter enemy movement speed and splitting on death', async ({ page }) => {
    const splitterResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).gameManager.player.fire()[0].constructor;
      
      gm.enemies = [];
      gm.bullets = [];

      // Spawn Splitter at (200, 200)
      const splitter = new EnemyClass(200, 200, gm.canvas.width, 1, 6); // EnemyType.SPLITTER = 6
      gm.enemies.push(splitter);

      const initialSpeedX = splitter.speedX;
      const initialSpeedY = splitter.speedY;

      // Shoot player bullet directly at Splitter
      const bullet = new BulletClass(210, 210, -400, 10, true, 1);
      gm.bullets.push(bullet);

      // Check collision which should kill Splitter and spawn 2 mini-enemies
      gm.checkCollisions();

      const enemiesAfterDeath = gm.enemies;
      const miniEnemies = enemiesAfterDeath.filter((e: any) => e !== splitter);

      return {
        initialSpeedX,
        initialSpeedY,
        splitterDead: splitter.isDead,
        miniEnemiesCount: miniEnemies.length,
        mini1Size: miniEnemies[0] ? { w: miniEnemies[0].size.width, h: miniEnemies[0].size.height } : null,
        mini2Size: miniEnemies[1] ? { w: miniEnemies[1].size.width, h: miniEnemies[1].size.height } : null,
        mini1Speed: miniEnemies[0] ? { sx: miniEnemies[0].speedX, sy: miniEnemies[0].speedY } : null,
        mini2Speed: miniEnemies[1] ? { sx: miniEnemies[1].speedX, sy: miniEnemies[1].speedY } : null,
      };
    });

    expect(splitterResult.initialSpeedX).toBeLessThanOrEqual(50);
    expect(splitterResult.initialSpeedY).toBeLessThanOrEqual(10);
    expect(splitterResult.splitterDead).toBe(true);
    expect(splitterResult.miniEnemiesCount).toBe(2);
    expect(splitterResult.mini1Size).toEqual({ w: 20, h: 20 });
    expect(splitterResult.mini2Size).toEqual({ w: 20, h: 20 });
    expect(splitterResult.mini1Speed).toEqual({ sx: 10, sy: 5 });
    expect(splitterResult.mini2Speed).toEqual({ sx: -10, sy: 5 });
  });

  test('QA Audit: Barricade slowdown & Sniper bullet interception discrepancy analysis', async ({ page }) => {
    const auditFindings = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      // 1. Check Barricade Slowdown behavior
      const normalEnemy = new EnemyClass(100, 100, gm.canvas.width, 1, 0); // NORMAL
      const barricade = gm.barricades[0];
      barricade.position.x = 100;
      barricade.position.y = 100;
      gm.enemies = [normalEnemy];

      // Provide bullet so checkCollisions loop processes enemy-barricade logic
      const dummyBullet = new BulletClass(0, -100, -400, 1, true, 1);
      gm.bullets = [dummyBullet];

      gm.checkCollisions();
      const isGnawing = normalEnemy.isGnawing;
      const speedBeforeUpdate = normalEnemy.speedX;
      normalEnemy.update(0.1, 1.0, []);
      const speedAfterUpdate = normalEnemy.speedX;

      // 2. Check Sniper Bullet Interception behavior
      const sniper = new EnemyClass(200, 100, gm.canvas.width, 1, 3); // SNIPER
      sniper.fireTimer = 0; // force fire
      const sniperBullet = sniper.fire(gm.player.position);
      const isInterceptableFlag = sniperBullet ? sniperBullet.isInterceptable : false;

      // Create a player bullet colliding with sniper bullet
      const playerBullet = new BulletClass(sniperBullet.position.x, sniperBullet.position.y, -400, 1, true, 1);
      gm.bullets = [sniperBullet, playerBullet];

      gm.checkCollisions();
      const sniperBulletDeadAfterCollision = sniperBullet.isDead;
      const playerBulletDeadAfterCollision = playerBullet.isDead;

      return {
        barricadeSlowdown: {
          isGnawingSet: isGnawing,
          speedReduced: speedAfterUpdate < speedBeforeUpdate,
          gnawDamageDealtToBarricade: barricade.hp < barricade.maxHp,
        },
        sniperBulletInterception: {
          isInterceptableMarked: isInterceptableFlag,
          sniperBulletDestroyedByPlayerBullet: sniperBulletDeadAfterCollision,
          playerBulletDestroyedBySniperBullet: playerBulletDeadAfterCollision,
        },
      };
    });

    // Verify findings accurately
    expect(auditFindings.barricadeSlowdown.isGnawingSet).toBe(true);
    expect(auditFindings.barricadeSlowdown.gnawDamageDealtToBarricade).toBe(true);
    // Discrepancy Note: Speed is currently not reduced during gnawing/overlap in Enemy.update()
    expect(auditFindings.barricadeSlowdown.speedReduced).toBe(false);

    expect(auditFindings.sniperBulletInterception.isInterceptableMarked).toBe(true);
    // Discrepancy Note: Bullet-bullet collision loop is missing in GameManager.checkCollisions()
    expect(auditFindings.sniperBulletInterception.sniperBulletDestroyedByPlayerBullet).toBe(false);
  });
});

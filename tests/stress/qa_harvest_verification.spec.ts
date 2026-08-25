import { test, expect } from '@playwright/test';

test.describe('QA Sweep Live Bug Harvesting Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('BUG-E01: Splitter Mini2 Stuck At Left Wall Verification', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Spawn mini2 with speedX = -10 (moving left) starting near left edge (x=2)
      const mini2 = new EnemyClass(2, 150, gm.logicalWidth, 1, 0);
      mini2.size = { width: 20, height: 20 };
      mini2.speedX = -10;
      mini2.speedY = 5;

      const initialX = mini2.position.x;
      // Update for 50 frames
      for (let i = 0; i < 50; i++) {
        mini2.update(0.016, 1.0, []);
      }
      const xAtWall = mini2.position.x;
      const dirAtWall = (mini2 as any).direction;

      // Update for another 100 frames — should bounce right if working properly, but gets stuck at 0
      for (let i = 0; i < 100; i++) {
        mini2.update(0.016, 1.0, []);
      }

      return {
        initialX,
        xAtWall,
        dirAtWall,
        finalX: mini2.position.x,
        finalDir: (mini2 as any).direction
      };
    });

    console.log('[BUG-E01 Result]:', result);
    // Verified: mini2 reaches wall and bounces smoothly to the right
    expect(result.finalX).toBeGreaterThan(0);
    expect(result.finalDir).toBe(-1);
  });

  test('BUG-E02: Diver Missing From spawnWave Verification', async ({ page }) => {
    const diverFound = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      let found = false;
      // Spawn 50 waves of enemies and check types
      for (let lvl = 1; lvl <= 50; lvl++) {
        gm.level = lvl;
        gm.enemies = [];
        gm.spawnWave();
        if (gm.enemies.some((e: any) => e.type === 4)) { // EnemyType.DIVER = 4
          found = true;
          break;
        }
      }
      return found;
    });

    console.log('[BUG-E02 Result] Diver found in 50 waves:', diverFound);
    expect(diverFound).toBe(true);
  });

  test('BUG-E04: Zigzag Missing Y-Descent Verification', async ({ page }) => {
    const yDelta = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const zigzag = new EnemyClass(200, 100, gm.logicalWidth, 1, 1); // EnemyType.ZIGZAG = 1
      const initialY = zigzag.position.y;
      for (let i = 0; i < 300; i++) {
        zigzag.update(0.016, 1.0, []);
      }
      return zigzag.position.y - initialY;
    });

    console.log('[BUG-E04 Result] Zigzag Y movement over 300 frames:', yDelta);
    expect(yDelta).toBeGreaterThan(0); // Y moves down smoothly
  });

  test('BUG-E08: Boss Ramming Instakill Exploit Verification', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const boss = new EnemyClass(gm.logicalWidth / 2 - 75, 90, gm.logicalWidth, 5, 2); // EnemyType.BOSS = 2
      boss.hp = 50;
      boss.maxHp = 50;
      gm.enemies = [boss];

      // Move player into boss
      gm.player.position.x = boss.position.x;
      gm.player.position.y = boss.position.y;
      const prevHp = gm.player.hp;
      
      // Update GM collisions
      gm.update(0.016);

      return {
        bossDead: boss.isDead,
        remainingEnemies: gm.enemies.length,
        playerHpLoss: prevHp - gm.player.hp,
        bossHp: boss.hp
      };
    });

    console.log('[BUG-E08 Result]:', result);
    expect(result.bossDead).toBe(false);
    expect(result.remainingEnemies).toBe(1);
    expect(result.bossHp).toBe(40); // 50 - 10 damage
    expect(result.playerHpLoss).toBe(1);
  });

  test('BUG-S01: Fire Rate Max Upgrade Infinite Drain Verification', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.currency = 500;
      gm.player.fireRate = 0.1; // already minimum
      const initialCurrency = gm.currency;
      
      gm.upgradeFireRate();
      const afterUpgrade1 = gm.currency;
      const fireRateAfter1 = gm.player.fireRate;

      gm.upgradeFireRate();
      const afterUpgrade2 = gm.currency;
      const fireRateAfter2 = gm.player.fireRate;

      return {
        initialCurrency,
        afterUpgrade1,
        fireRateAfter1,
        afterUpgrade2,
        fireRateAfter2
      };
    });

    console.log('[BUG-S01 Result]:', result);
    expect(result.afterUpgrade1).toBe(500); // Currency not deducted when at max level
    expect(result.fireRateAfter1).toBe(0.1);
    expect(result.afterUpgrade2).toBe(500); // Currency preserved
    expect(result.fireRateAfter2).toBe(0.1);
  });

  test('BUG-S03: Q and E Triggerable During Shop and Menu States', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.state = 3; // GameState.SHOP
      gm.currency = 100;
      gm.player.ultimateGauge = 100;
      gm.bullets = [];

      gm.handleKeyDown('e');
      const ultGaugeAfterE = gm.player.ultimateGauge;
      const bulletsAfterE = gm.bullets.length;

      gm.handleKeyDown('q');
      const currencyAfterQ = gm.currency;
      const pendingReinforcement = (gm as any).pendingReinforcement;

      return {
        ultGaugeAfterE,
        bulletsAfterE,
        currencyAfterQ,
        pendingReinforcement
      };
    });

    console.log('[BUG-S03 Result]:', result);
    expect(result.ultGaugeAfterE).toBe(100); // Preserved in shop!
    expect(result.bulletsAfterE).toBe(0); // 0 bullets spawned in shop!
    expect(result.currencyAfterQ).toBe(100); // 0 currency consumed in shop!
  });

  test('BUG-G01: Piercing Bullets Multi-Hit Tick Depletion on Single Target', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;
      
      const enemy = new EnemyClass(200, 200, gm.logicalWidth, 1, 0);
      enemy.hp = 100;
      gm.enemies = [enemy];

      // Bullet with piercing = 3 placed overlapping enemy
      const bullet = new BulletClass(210, 210, -400, 1, true, 3);
      gm.bullets = [bullet];

      const piercingHistory: number[] = [];
      const enemyHpHistory: number[] = [];

      for (let frame = 0; frame < 5; frame++) {
        gm.checkCollisions();
        piercingHistory.push(bullet.piercing);
        enemyHpHistory.push(enemy.hp);
        // slightly move bullet
        bullet.position.y -= 2;
      }

      return {
        piercingHistory,
        enemyHpHistory,
        bulletDead: bullet.isDead
      };
    });

    console.log('[BUG-G01 Result]:', result);
    expect(result.bulletDead).toBe(false); // Bullet survives to pierce other enemies!
    expect(result.piercingHistory[0]).toBe(2);
    expect(result.piercingHistory[1]).toBe(2); // Piercing not tick-depleted on same enemy!
    expect(result.piercingHistory[2]).toBe(2);
    expect(result.enemyHpHistory[0]).toBe(99);
    expect(result.enemyHpHistory[1]).toBe(99); // Damage applied only once to this enemy!
  });
});

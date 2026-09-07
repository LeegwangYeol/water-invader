import { test, expect } from '@playwright/test';

test.describe('Milestone M2: Enemy Piercing Damage Scaling & Barricade Penetration Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.click('button:has-text("START GAME")');
    await page.waitForFunction(() => !!(window as any).gameManager);
  });

  test('R2-01: Wave-based projectile damage and piercing count progression across common mobs', async ({ page }) => {
    const results = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const EnemyType = {
        NORMAL: 0,
        ZIGZAG: 1,
        SHIELDED: 5,
        SPLITTER: 6,
        ROGUE_DRONE: 7,
      };

      // Test waves: 10, 14, 15, 19, 20, 25
      const waves = [10, 14, 15, 19, 20, 25];
      const stats: Record<number, any> = {};

      for (const w of waves) {
        const normal = new EnemyClass(100, 100, gm.logicalWidth, w, EnemyType.NORMAL, gm.logicalHeight);
        normal.fireTimer = 0;
        const bNormal = normal.fire(gm.player.position, []);

        const drone = new EnemyClass(200, 100, gm.logicalWidth, w, EnemyType.ROGUE_DRONE, gm.logicalHeight);
        drone.fireTimer = 0;
        const bDrone = drone.fire(gm.player.position, []);

        stats[w] = {
          normalDamage: bNormal ? bNormal.damage : null,
          normalPiercing: bNormal ? bNormal.piercing : null,
          normalMultiplier: normal.getPiercingMultiplier(),
          droneDamage: bDrone ? bDrone.damage : null,
          dronePiercing: bDrone ? bDrone.piercing : null,
        };
      }

      return stats;
    });

    // Wave 10: Invariant strictly preserved (1 damage, 1 piercing)
    expect(results[10].normalDamage).toBe(1);
    expect(results[10].normalPiercing).toBe(1);
    expect(results[10].normalMultiplier).toBe(1.0);
    expect(results[10].droneDamage).toBe(1);
    expect(results[10].dronePiercing).toBe(1);

    // Wave 14: Still 1 damage, 1 piercing (< 15)
    expect(results[14].normalDamage).toBe(1);
    expect(results[14].normalPiercing).toBe(1);

    // Wave 15: 1 damage, but piercing scales to 2 (penetrates 1 cover)
    expect(results[15].normalDamage).toBe(1);
    expect(results[15].normalPiercing).toBe(2);
    expect(results[15].droneDamage).toBe(1);
    expect(results[15].dronePiercing).toBe(2);

    // Wave 19: 1 damage, 2 piercing
    expect(results[19].normalDamage).toBe(1);
    expect(results[19].normalPiercing).toBe(2);

    // Wave 20: Damage scales up to 2, piercing remains 2
    expect(results[20].normalDamage).toBe(2);
    expect(results[20].normalPiercing).toBe(2);
    expect(results[20].droneDamage).toBe(2);
    expect(results[20].dronePiercing).toBe(2);

    // Wave 25: Damage 2, piercing scales to 3
    expect(results[25].normalDamage).toBe(2);
    expect(results[25].normalPiercing).toBe(3);
    expect(results[25].droneDamage).toBe(2);
    expect(results[25].dronePiercing).toBe(3);
  });

  test('R2-02: Enemy bullet with piercing > 1 penetrates destructible barricade and continues flight', async ({ page }) => {
    const report = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
      const BarricadeClass = gm.barricades[0]?.constructor;

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      // Destructible barricade (type = 0) with 10 HP at (200, 300)
      const barricade = new BarricadeClass(200, 300, 0);
      barricade.hp = 10;
      barricade.maxHp = 20;
      gm.barricades.push(barricade);

      // Enemy bullet at (210, 305) with piercing = 2 and damage = 2
      const bullet = new BulletClass(210, 305, 200, 2, false, 2);
      bullet.faction = 'INVADER';
      gm.bullets.push(bullet);

      // Trigger collision step
      (gm as any).checkCollisions(1 / 60);

      return {
        barricadeHpAfterHit: barricade.hp,
        bulletDeadAfterHit: bullet.isDead,
        bulletPiercingAfterHit: bullet.piercing,
        bulletHitEntitiesHasBarricade: bullet.hitEntities.has(barricade),
      };
    });

    expect(report.barricadeHpAfterHit).toBe(8); // 10 - 2 = 8 HP
    expect(report.bulletDeadAfterHit).toBe(false); // Bullet survives to penetrate
    expect(report.bulletPiercingAfterHit).toBe(1); // Piercing decremented by 1
    expect(report.bulletHitEntitiesHasBarricade).toBe(true); // CCD guard recorded
  });

  test('R2-03: Indestructible stone barricade blocks and terminates high-piercing bullets', async ({ page }) => {
    const report = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
      const BarricadeClass = gm.barricades[0]?.constructor;

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      // Indestructible barricade (type = 1) at (200, 300)
      const stoneBarricade = new BarricadeClass(200, 300, 1);
      gm.barricades.push(stoneBarricade);

      // Enemy bullet with high piercing = 3 and damage = 3
      const heavyBullet = new BulletClass(210, 305, 200, 3, false, 3);
      heavyBullet.faction = 'INVADER';
      gm.bullets.push(heavyBullet);

      // Trigger collision step
      (gm as any).checkCollisions(1 / 60);

      return {
        bulletDead: heavyBullet.isDead,
      };
    });

    expect(report.bulletDead).toBe(true); // Stone cover stops all bullets unconditionally
  });

  test('R2-04: Wave 20 common mob projectile deals 2 damage to player without causing instant death', async ({ page }) => {
    const survivalReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;

      gm.enemies = [];
      gm.bullets = [];
      gm.player.hp = 3; // Standard base HP
      gm.player.invincibilityTimer = 0;
      gm.isGodMode = false;

      // Bullet directly colliding with player
      const px = gm.player.position.x + gm.player.size.width / 2;
      const py = gm.player.position.y + gm.player.size.height / 2;

      // Wave 20 common mob bullet (damage = 2)
      const wave20Bullet = new BulletClass(px, py, 200, 2, false, 2);
      wave20Bullet.faction = 'INVADER';
      gm.bullets.push(wave20Bullet);

      // Process collision
      (gm as any).checkCollisions(1 / 60);

      return {
        playerHp: gm.player.hp,
        playerDead: gm.player.isDead,
        invincibilityTimer: gm.player.invincibilityTimer,
        bulletDead: wave20Bullet.isDead,
      };
    });

    expect(survivalReport.playerHp).toBe(1); // 3 - 2 = 1 HP remaining
    expect(survivalReport.playerDead).toBe(false); // Player survives lethal threat
    expect(survivalReport.invincibilityTimer).toBe(1.0); // 1.0s i-frames triggered
    expect(survivalReport.bulletDead).toBe(true); // Bullet consumed by player impact
  });
});

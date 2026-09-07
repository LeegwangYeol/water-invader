import { test, expect } from '@playwright/test';

test.describe('Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.click('button:has-text("START GAME")');
    await page.waitForFunction(() => !!(window as any).gameManager);
  });

  test('CH-M2-01: Exhaustive Wave 1-30 Damage & Piercing Sweep for Invader Common Mobs', async ({ page }) => {
    const sweep = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const EnemyType = {
        NORMAL: 0,
        ZIGZAG: 1,
        SHIELDED: 5,
        SPLITTER: 6,
      };

      const mobTypes = [
        { name: 'NORMAL', id: EnemyType.NORMAL },
        { name: 'ZIGZAG', id: EnemyType.ZIGZAG },
        { name: 'SHIELDED', id: EnemyType.SHIELDED },
        { name: 'SPLITTER', id: EnemyType.SPLITTER },
      ];

      const records: any[] = [];

      for (let w = 1; w <= 30; w++) {
        for (const mob of mobTypes) {
          const enemy = new EnemyClass(150, 100, gm.logicalWidth, w, mob.id, gm.logicalHeight);
          enemy.fireTimer = 0;
          const bullet = enemy.fire(gm.player.position, []);

          records.push({
            wave: w,
            mob: mob.name,
            bulletDamage: bullet ? bullet.damage : null,
            bulletPiercing: bullet ? bullet.piercing : null,
            bulletColor: bullet ? bullet.color : null,
            enemyPiercingCount: enemy.getPiercingCount(),
            enemyPiercingMultiplier: enemy.getPiercingMultiplier(),
          });
        }
      }

      return records;
    });

    for (const r of sweep) {
      // 1. Damage Formula:
      // Waves 1-19: strictly 1
      // Waves 20+: strictly 2
      const expectedDamage = r.wave < 20 ? 1 : 2;
      expect(r.bulletDamage, `Wave ${r.wave} ${r.mob} bullet damage`).toBe(expectedDamage);

      // 2. Piercing Formula:
      // Waves 1-14: strictly 1
      // Waves 15-24: strictly 2
      // Waves 25+: strictly 3
      const expectedPiercing = r.wave < 15 ? 1 : (r.wave < 25 ? 2 : 3);
      expect(r.bulletPiercing, `Wave ${r.wave} ${r.mob} bullet piercing`).toBe(expectedPiercing);
      expect(r.enemyPiercingCount, `Wave ${r.wave} ${r.mob} enemy.getPiercingCount()`).toBe(expectedPiercing);

      // 3. Multiplier Formula:
      // 1.0 + min(1.5, max(0, w - 10) * 0.08)
      const expectedMultiplier = 1.0 + Math.min(1.5, Math.max(0, r.wave - 10) * 0.08);
      expect(Math.abs(r.enemyPiercingMultiplier - expectedMultiplier)).toBeLessThan(1e-6);

      // 4. Visual Color Bloom:
      // piercing > 1 -> #f97316 (orange bloom)
      // piercing === 1 -> #ef4444 (red standard)
      if (expectedPiercing > 1) {
        expect(r.bulletColor, `Wave ${r.wave} ${r.mob} bullet color`).toBe('#f97316');
      } else {
        expect(r.bulletColor, `Wave ${r.wave} ${r.mob} bullet color`).toBe('#ef4444');
      }
    }
  });

  test('CH-M2-02: Exhaustive Wave 1-30 Damage & Piercing Sweep for Rogue Drone', async ({ page }) => {
    const sweep = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const ROGUE_DRONE = 7;

      const records: any[] = [];

      for (let w = 1; w <= 30; w++) {
        const drone = new EnemyClass(150, 100, gm.logicalWidth, w, ROGUE_DRONE, gm.logicalHeight);
        drone.fireTimer = 0;
        const bullet = drone.fire(gm.player.position, []);

        records.push({
          wave: w,
          bulletDamage: bullet ? bullet.damage : null,
          bulletPiercing: bullet ? bullet.piercing : null,
          enemyPiercingCount: drone.getPiercingCount(),
          enemyPiercingMultiplier: drone.getPiercingMultiplier(),
        });
      }

      return records;
    });

    for (const r of sweep) {
      const expectedDamage = r.wave < 20 ? 1 : 2;
      expect(r.bulletDamage, `Rogue Drone Wave ${r.wave} damage`).toBe(expectedDamage);

      const expectedPiercing = r.wave < 15 ? 1 : (r.wave < 25 ? 2 : 3);
      expect(r.bulletPiercing, `Rogue Drone Wave ${r.wave} piercing`).toBe(expectedPiercing);
      expect(r.enemyPiercingCount, `Rogue Drone Wave ${r.wave} getPiercingCount()`).toBe(expectedPiercing);
    }
  });

  test('CH-M2-03: Elite and Boss Piercing Scaling Validation Across Wave Milestones', async ({ page }) => {
    const results = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const EnemyType = {
        NORMAL: 0,
        ZIGZAG: 1,
        BOSS: 2,
        SNIPER: 3,
        DIVER: 4,
        SHIELDED: 5,
        SPLITTER: 6,
        ROGUE_DRONE: 7,
        ROGUE_STALKER: 8,
        ROGUE_MECH: 9,
        ROGUE_GOLIATH: 10,
        ROGUE_PHANTOM: 11,
        ROGUE_CARRIER: 12,
        SABOTEUR: 13,
      };

      const milestones = [5, 10, 15, 20, 25, 30];
      const data: Record<string, any> = {};

      for (const w of milestones) {
        const sniper = new EnemyClass(100, 100, gm.logicalWidth, w, EnemyType.SNIPER, gm.logicalHeight);
        sniper.fireTimer = 0;
        const bSniper = sniper.fire(gm.player.position, []);

        const boss = new EnemyClass(150, 100, gm.logicalWidth, w, EnemyType.BOSS, gm.logicalHeight);
        boss.fireTimer = 0;
        const bBoss = boss.fire(gm.player.position, []);

        const goliath = new EnemyClass(200, 100, gm.logicalWidth, w, EnemyType.ROGUE_GOLIATH, gm.logicalHeight);
        goliath.fireTimer = 0;
        const bGoliath = goliath.fire(gm.player.position, []);

        const saboteur = new EnemyClass(250, 100, gm.logicalWidth, w, EnemyType.SABOTEUR, gm.logicalHeight);
        saboteur.fireTimer = 0;
        const bSaboteur = saboteur.fire(gm.player.position, []);

        data[w] = {
          sniperDamage: bSniper?.damage,
          sniperPiercing: bSniper?.piercing,
          bossDamage: bBoss?.damage,
          bossPiercing: bBoss?.piercing,
          goliathDamage: bGoliath?.damage,
          goliathPiercing: bGoliath?.piercing,
          saboteurFired: bSaboteur !== null,
        };
      }

      return data;
    });

    // Milestone checks
    // Wave 5: Baseline pre-10
    expect(results[5].sniperDamage).toBe(1);
    expect(results[5].sniperPiercing).toBe(1);
    expect(results[5].bossDamage).toBe(1);
    expect(results[5].bossPiercing).toBe(1);

    // Wave 10: Elite scaling activates (damage = 2, piercing = 2)
    expect(results[10].sniperDamage).toBe(2);
    expect(results[10].sniperPiercing).toBe(2);
    expect(results[10].bossDamage).toBe(2);
    expect(results[10].bossPiercing).toBe(2);
    expect(results[10].goliathDamage).toBe(3);
    expect(results[10].goliathPiercing).toBe(2);

    // Wave 20: Elite scaling reaches top tier (damage = 3, piercing = 3)
    expect(results[20].sniperDamage).toBe(3);
    expect(results[20].sniperPiercing).toBe(3);
    expect(results[20].bossDamage).toBe(3);
    expect(results[20].bossPiercing).toBe(3);
    expect(results[20].goliathDamage).toBe(3);
    expect(results[20].goliathPiercing).toBe(3);

    // Saboteurs must NEVER fire projectiles across all waves
    for (const w of [5, 10, 15, 20, 25, 30]) {
      expect(results[w].saboteurFired).toBe(false);
    }
  });

  test('CH-M2-04: Destructible Barricade Multi-Penetration Chain for Piercing 1, 2, and 3', async ({ page }) => {
    const chainReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
      const BarricadeClass = gm.barricades[0]?.constructor;

      function simulateBulletThroughBarricades(initialPiercing: number, initialDamage: number) {
        gm.enemies = [];
        gm.bullets = [];
        gm.barricades = [];

        // 3 destructible barricades placed vertically at y=200, y=300, y=400
        const b1 = new BarricadeClass(200, 200, 0); b1.hp = 10;
        const b2 = new BarricadeClass(200, 300, 0); b2.hp = 10;
        const b3 = new BarricadeClass(200, 400, 0); b3.hp = 10;
        gm.barricades = [b1, b2, b3];

        const bullet = new BulletClass(210, 180, 100, initialDamage, false, initialPiercing);
        bullet.faction = 'INVADER';
        gm.bullets.push(bullet);

        // Step 1: Hit Barricade 1
        bullet.position.y = 205;
        (gm as any).checkCollisions(1 / 60);
        const stateAfterB1 = {
          b1Hp: b1.hp,
          bulletPiercing: bullet.piercing,
          bulletDead: bullet.isDead,
        };

        if (bullet.isDead) {
          return {
            stateAfterB1,
            stateAfterB2: null,
            stateAfterB3: null,
            b2Hp: b2.hp,
            b3Hp: b3.hp,
          };
        }

        // Step 2: Hit Barricade 2
        bullet.position.y = 305;
        (gm as any).checkCollisions(1 / 60);
        const stateAfterB2 = {
          b2Hp: b2.hp,
          bulletPiercing: bullet.piercing,
          bulletDead: bullet.isDead,
        };

        if (bullet.isDead) {
          return {
            stateAfterB1,
            stateAfterB2,
            stateAfterB3: null,
            b2Hp: b2.hp,
            b3Hp: b3.hp,
          };
        }

        // Step 3: Hit Barricade 3
        bullet.position.y = 405;
        (gm as any).checkCollisions(1 / 60);
        const stateAfterB3 = {
          b3Hp: b3.hp,
          bulletPiercing: bullet.piercing,
          bulletDead: bullet.isDead,
        };

        return {
          stateAfterB1,
          stateAfterB2,
          stateAfterB3,
          b2Hp: b2.hp,
          b3Hp: b3.hp,
        };
      }

      return {
        piercing1: simulateBulletThroughBarricades(1, 2),
        piercing2: simulateBulletThroughBarricades(2, 2),
        piercing3: simulateBulletThroughBarricades(3, 2),
      };
    });

    // Piercing = 1:
    // Hits B1 (HP: 10 -> 8), bullet dies immediately. B2 & B3 unharmed (HP: 10).
    expect(chainReport.piercing1.stateAfterB1.b1Hp).toBe(8);
    expect(chainReport.piercing1.stateAfterB1.bulletDead).toBe(true);
    expect(chainReport.piercing1.b2Hp).toBe(10);
    expect(chainReport.piercing1.b3Hp).toBe(10);

    // Piercing = 2:
    // Hits B1 (HP: 10 -> 8), piercing drops to 1, bullet survives.
    // Hits B2 (HP: 10 -> 8), bullet dies. B3 unharmed (HP: 10).
    expect(chainReport.piercing2.stateAfterB1.b1Hp).toBe(8);
    expect(chainReport.piercing2.stateAfterB1.bulletPiercing).toBe(1);
    expect(chainReport.piercing2.stateAfterB1.bulletDead).toBe(false);
    expect(chainReport.piercing2.stateAfterB2!.b2Hp).toBe(8);
    expect(chainReport.piercing2.stateAfterB2!.bulletDead).toBe(true);
    expect(chainReport.piercing2.b3Hp).toBe(10);

    // Piercing = 3:
    // Hits B1 (HP: 10 -> 8), piercing drops to 2, survives.
    // Hits B2 (HP: 10 -> 8), piercing drops to 1, survives.
    // Hits B3 (HP: 10 -> 8), bullet dies.
    expect(chainReport.piercing3.stateAfterB1.b1Hp).toBe(8);
    expect(chainReport.piercing3.stateAfterB1.bulletPiercing).toBe(2);
    expect(chainReport.piercing3.stateAfterB1.bulletDead).toBe(false);
    expect(chainReport.piercing3.stateAfterB2!.b2Hp).toBe(8);
    expect(chainReport.piercing3.stateAfterB2!.bulletPiercing).toBe(1);
    expect(chainReport.piercing3.stateAfterB2!.bulletDead).toBe(false);
    expect(chainReport.piercing3.stateAfterB3!.b3Hp).toBe(8);
    expect(chainReport.piercing3.stateAfterB3!.bulletDead).toBe(true);
  });

  test('CH-M2-05: Indestructible Stone Barricade Absolute Absorption Across All Piercing Counts', async ({ page }) => {
    const stoneReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
      const BarricadeClass = gm.barricades[0]?.constructor;

      const testPiercings = [1, 2, 3, 10, 99];
      const results: Record<number, any> = {};

      for (const p of testPiercings) {
        gm.enemies = [];
        gm.bullets = [];
        gm.barricades = [];

        // Stone barricade at (200, 300)
        const stone = new BarricadeClass(200, 300, 1);
        stone.hp = 20;

        // Secondary destructible barricade placed directly behind stone barricade at (200, 350)
        const secondaryCover = new BarricadeClass(200, 350, 0);
        secondaryCover.hp = 20;

        gm.barricades = [stone, secondaryCover];

        const bullet = new BulletClass(210, 305, 200, 2, false, p);
        bullet.faction = 'INVADER';
        gm.bullets.push(bullet);

        (gm as any).checkCollisions(1 / 60);

        results[p] = {
          stoneHp: stone.hp,
          secondaryCoverHp: secondaryCover.hp,
          bulletDead: bullet.isDead,
          bulletPiercingRemaining: bullet.piercing,
        };
      }

      return results;
    });

    for (const p of [1, 2, 3, 10, 99]) {
      const r = stoneReport[p];
      // Stone barricade takes 0 damage
      expect(r.stoneHp, `Stone HP with initial piercing ${p}`).toBe(20);
      // Bullet is dead immediately
      expect(r.bulletDead, `Bullet dead with initial piercing ${p}`).toBe(true);
      // Secondary cover behind stone barricade is completely untouched
      expect(r.secondaryCoverHp, `Secondary cover HP with initial piercing ${p}`).toBe(20);
    }
  });

  test('CH-M2-06: Player Protection Behind Cover (Destructible vs Stone) Under Piercing Attacks', async ({ page }) => {
    const coverReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
      const BarricadeClass = gm.barricades[0]?.constructor;

      function testPlayerBehindCover(barricadeType: number, bulletPiercing: number, bulletDamage: number) {
        gm.enemies = [];
        gm.bullets = [];
        gm.barricades = [];
        gm.isGodMode = false;
        gm.player.hp = 3;
        gm.player.invincibilityTimer = 0;

        const px = gm.player.position.x;
        const py = gm.player.position.y;

        // Cover positioned right in front of player
        const cover = new BarricadeClass(px, py - 40, barricadeType);
        cover.hp = 10;
        gm.barricades = [cover];

        // Bullet at cover position moving towards player
        const bullet = new BulletClass(px + 10, py - 35, 300, bulletDamage, false, bulletPiercing);
        bullet.faction = 'INVADER';
        gm.bullets.push(bullet);

        // Frame 1: Bullet collides with cover
        (gm as any).checkCollisions(1 / 60);
        const coverHpAfterFrame1 = cover.hp;
        const bulletDeadAfterFrame1 = bullet.isDead;
        const playerHpAfterFrame1 = gm.player.hp;

        // If bullet survived, advance bullet to player
        if (!bullet.isDead) {
          bullet.position.y = py + 5; // Overlap player
          (gm as any).checkCollisions(1 / 60);
        }

        return {
          coverHpAfterFrame1,
          bulletDeadAfterFrame1,
          playerHpAfterFrame1,
          finalPlayerHp: gm.player.hp,
          finalPlayerInvincibility: gm.player.invincibilityTimer,
          finalBulletDead: bullet.isDead,
        };
      }

      return {
        // Case A: Destructible cover vs Piercing = 1 bullet (Wave 10 mob, damage = 1)
        destructiblePiercing1: testPlayerBehindCover(0, 1, 1),
        // Case B: Destructible cover vs Piercing = 2 bullet (Wave 15 mob, damage = 1)
        destructiblePiercing2Wave15: testPlayerBehindCover(0, 2, 1),
        // Case C: Destructible cover vs Heavy Piercing = 2 bullet (Wave 20 mob, damage = 2)
        destructiblePiercing2Wave20: testPlayerBehindCover(0, 2, 2),
        // Case D: Stone cover vs Heavy Piercing = 3 bullet (Wave 25 mob, damage = 2)
        stonePiercing3Wave25: testPlayerBehindCover(1, 3, 2),
      };
    });

    // Case A: Piercing = 1 -> Cover absorbs, player safe (HP: 3)
    expect(coverReport.destructiblePiercing1.coverHpAfterFrame1).toBe(9);
    expect(coverReport.destructiblePiercing1.bulletDeadAfterFrame1).toBe(true);
    expect(coverReport.destructiblePiercing1.finalPlayerHp).toBe(3);

    // Case B: Piercing = 2 (Wave 15) -> Cover takes 1 damage, punches through, deals 1 damage to player
    expect(coverReport.destructiblePiercing2Wave15.coverHpAfterFrame1).toBe(9);
    expect(coverReport.destructiblePiercing2Wave15.bulletDeadAfterFrame1).toBe(false);
    expect(coverReport.destructiblePiercing2Wave15.finalPlayerHp).toBe(2);
    expect(coverReport.destructiblePiercing2Wave15.finalPlayerInvincibility).toBe(1.0);
    expect(coverReport.destructiblePiercing2Wave15.finalBulletDead).toBe(true);

    // Case C: Piercing = 2 (Wave 20) -> Cover takes 2 damage, punches through, deals 2 damage to player
    // Player base HP drops from 3 to 1 (survives without one-shot kill)
    expect(coverReport.destructiblePiercing2Wave20.coverHpAfterFrame1).toBe(8);
    expect(coverReport.destructiblePiercing2Wave20.bulletDeadAfterFrame1).toBe(false);
    expect(coverReport.destructiblePiercing2Wave20.finalPlayerHp).toBe(1);
    expect(coverReport.destructiblePiercing2Wave20.finalPlayerInvincibility).toBe(1.0);
    expect(coverReport.destructiblePiercing2Wave20.finalBulletDead).toBe(true);

    // Case D: Stone Cover -> Bullet terminated on stone, player 100% protected (HP: 3)
    expect(coverReport.stonePiercing3Wave25.coverHpAfterFrame1).toBe(10);
    expect(coverReport.stonePiercing3Wave25.bulletDeadAfterFrame1).toBe(true);
    expect(coverReport.stonePiercing3Wave25.finalPlayerHp).toBe(3);
  });

  test('CH-M2-07: Continuous Collision Deduplication (CCD) Multi-Tick Barricade Intersection', async ({ page }) => {
    const ccdReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
      const BarricadeClass = gm.barricades[0]?.constructor;

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      // Destructible barricade at (200, 300) with size 80x20
      const barricade = new BarricadeClass(200, 300, 0);
      barricade.hp = 10;
      gm.barricades.push(barricade);

      // Bullet starting at top edge of barricade (210, 300) with piercing = 2 and damage = 2
      // Velocity is slow (60 px/s = 1 px per frame) so it spends 20 frames inside the barricade!
      const bullet = new BulletClass(210, 300, 60, 2, false, 2);
      bullet.faction = 'INVADER';
      gm.bullets.push(bullet);

      const log: any[] = [];

      // Step 20 frames of movement & collision
      for (let frame = 1; frame <= 20; frame++) {
        (gm as any).checkCollisions(1 / 60);

        log.push({
          frame,
          bulletY: bullet.position.y,
          barricadeHp: barricade.hp,
          bulletPiercing: bullet.piercing,
          bulletDead: bullet.isDead,
          hasHitBarricade: bullet.hitEntities.has(barricade),
        });

        bullet.position.y += 1; // 1px downward per frame
      }

      return {
        initialHp: 10,
        finalHp: barricade.hp,
        finalPiercing: bullet.piercing,
        finalBulletDead: bullet.isDead,
        log,
      };
    });

    // Barricade must take damage EXACTLY ONCE (10 - 2 = 8 HP) across all 20 intersecting frames!
    expect(ccdReport.finalHp).toBe(8);
    // Piercing must be decremented EXACTLY ONCE (2 -> 1)
    expect(ccdReport.finalPiercing).toBe(1);
    // Bullet must remain alive throughout traversal
    expect(ccdReport.finalBulletDead).toBe(false);
  });

  test('CH-M2-08: Zero-HP and Dead Barricades are Bypassed Without Consuming Piercing', async ({ page }) => {
    const report = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
      const BarricadeClass = gm.barricades[0]?.constructor;

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      // Destructible barricade already destroyed
      const deadBarricade = new BarricadeClass(200, 300, 0);
      deadBarricade.hp = 0;
      deadBarricade.isDead = true;
      gm.barricades.push(deadBarricade);

      // Piercing = 2 bullet passing through dead barricade
      const bullet = new BulletClass(210, 305, 200, 2, false, 2);
      bullet.faction = 'INVADER';
      gm.bullets.push(bullet);

      (gm as any).checkCollisions(1 / 60);

      return {
        bulletDead: bullet.isDead,
        bulletPiercing: bullet.piercing,
        hitEntitiesHasDeadBarricade: bullet.hitEntities.has(deadBarricade),
      };
    });

    // Dead barricade is ignored: bullet survives, piercing remains 2, not tracked in hitEntities
    expect(report.bulletDead).toBe(false);
    expect(report.bulletPiercing).toBe(2);
    expect(report.hitEntitiesHasDeadBarricade).toBe(false);
  });

  test('CH-M2-09: Penetrated Bullet Retains Damage in Three-Way Crossfire Against Rogue Enemy', async ({ page }) => {
    const crossfireReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
      const BarricadeClass = gm.barricades[0]?.constructor;
      const EnemyClass = (window as any).Enemy;
      const ROGUE_DRONE = 7;

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      // Destructible barricade at y=250
      const barricade = new BarricadeClass(200, 250, 0);
      barricade.hp = 10;
      gm.barricades.push(barricade);

      // Rogue Drone enemy at y=350
      const rogueDrone = new EnemyClass(200, 350, gm.logicalWidth, 20, ROGUE_DRONE, gm.logicalHeight);
      rogueDrone.hp = 5;
      gm.enemies.push(rogueDrone);

      // Invader bullet with piercing = 2, damage = 2
      const invaderBullet = new BulletClass(210, 255, 200, 2, false, 2);
      invaderBullet.faction = 'INVADER';
      gm.bullets.push(invaderBullet);

      // Step 1: Bullet punches through barricade
      (gm as any).checkCollisions(1 / 60);
      const afterBarricade = {
        barricadeHp: barricade.hp,
        bulletPiercing: invaderBullet.piercing,
        bulletDead: invaderBullet.isDead,
      };

      // Step 2: Bullet travels to Rogue Drone
      invaderBullet.position.y = 355;
      (gm as any).checkCollisions(1 / 60);
      const afterRogueHit = {
        rogueHp: rogueDrone.hp,
        bulletPiercing: invaderBullet.piercing,
        bulletDead: invaderBullet.isDead,
      };

      return {
        afterBarricade,
        afterRogueHit,
      };
    });

    // Barricade takes 2 damage, bullet piercing drops to 1, bullet survives
    expect(crossfireReport.afterBarricade.barricadeHp).toBe(8);
    expect(crossfireReport.afterBarricade.bulletPiercing).toBe(1);
    expect(crossfireReport.afterBarricade.bulletDead).toBe(false);

    // Rogue Drone takes full 2 damage (HP: 5 -> 3), bullet piercing drops to 0 and bullet dies
    expect(crossfireReport.afterRogueHit.rogueHp).toBe(3);
    expect(crossfireReport.afterRogueHit.bulletDead).toBe(true);
  });

  test('CH-M2-10: Player i-frames & Double-Bullet Anti-One-Shot Protection Under Wave 20 Fire', async ({ page }) => {
    const survivalReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;

      gm.enemies = [];
      gm.bullets = [];
      gm.player.hp = 3;
      gm.player.invincibilityTimer = 0;
      gm.isGodMode = false;

      const px = gm.player.position.x + gm.player.size.width / 2;
      const py = gm.player.position.y + gm.player.size.height / 2;

      // Two Wave 20 bullets (damage = 2 each)
      const b1 = new BulletClass(px, py, 200, 2, false, 2);
      b1.faction = 'INVADER';
      const b2 = new BulletClass(px, py + 1, 200, 2, false, 2);
      b2.faction = 'INVADER';

      gm.bullets.push(b1);

      // Hit 1: First bullet impacts
      (gm as any).checkCollisions(1 / 60);
      const hpAfterHit1 = gm.player.hp;
      const iFramesAfterHit1 = gm.player.invincibilityTimer;
      const b1Dead = b1.isDead;

      // Now fire second bullet while player still has active i-frames
      gm.bullets = [b2];
      (gm as any).checkCollisions(1 / 60);
      const hpAfterHit2 = gm.player.hp;
      const b2Dead = b2.isDead;

      return {
        hpAfterHit1,
        iFramesAfterHit1,
        b1Dead,
        hpAfterHit2,
        b2Dead,
        playerIsDead: gm.player.isDead,
      };
    });

    // Hit 1: 3 HP -> 1 HP, 1.0s invincibility frames granted, bullet consumed
    expect(survivalReport.hpAfterHit1).toBe(1);
    expect(survivalReport.iFramesAfterHit1).toBe(1.0);
    expect(survivalReport.b1Dead).toBe(true);

    // Hit 2: Player invincibility prevents lethal second hit! HP remains 1!
    expect(survivalReport.hpAfterHit2).toBe(1);
    expect(survivalReport.b2Dead).toBe(true);
    expect(survivalReport.playerIsDead).toBe(false);
  });
});

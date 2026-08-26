import { test, expect } from '@playwright/test';

/**
 * adversarial_m1_challenger_1.spec.ts
 * 
 * Empirical Adversarial Challenger Test Suite for Milestone M1
 * Focus Areas:
 * 1. 100+ Bullets of all 3 factions colliding simultaneously (Stress & Collision Matrix)
 * 2. Crossfire scoring edge cases (Boss crossfire kills, escalating combo multipliers, simultaneous multi-kills)
 * 3. Zero-bullet / Zero-enemy boundary conditions & partial faction extinction
 * 4. Bullet interception dynamics between hostile factions (Sniper, Rogue, Player, Helper Tank)
 * 5. Multi-faction piercing & hit-tracking invariants
 * 6. High-load continuous simulation frame budget & particle pooling stability
 */

const setupGame = async (page: any) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('button', { hasText: 'START GAME' }).click();
  await page.evaluate(() => {
    const gm = (window as any).gameManager;
    if (gm.bullets.length === 0 && gm.player) {
      gm.player.isShooting = true;
      const b = gm.player.update(0.1);
      if (b && b.length > 0) gm.bullets.push(...b);
      gm.player.isShooting = false;
    }
  });
};

test.describe('Adversarial Challenge Suite — Milestone M1 Core Combat & Multi-Faction Logic', () => {
  test.beforeEach(async ({ page }) => {
    await setupGame(page);
  });

  // =========================================================================
  // CHALLENGE 1: 100+ BULLETS MULTI-FACTION SIMULTANEOUS COLLISION STRESS
  // =========================================================================
  test.describe('Challenge 1: Extreme Multi-Faction Bullet Collision & Density', () => {
    test('1.1 High-density 300+ bullet vortex across PLAYER, INVADER, and ROGUE factions', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.bullets = [];
        gm.enemies = [];

        const totalPerFaction = 100;
        const startX = 250;
        const startY = 350;

        // Spawn 100 Player bullets, 100 Invader bullets, 100 Rogue bullets in overlapping spatial volume
        for (let i = 0; i < totalPerFaction; i++) {
          const offsetX = (i % 10) * 4 - 20;
          const offsetY = Math.floor(i / 10) * 4 - 20;

          // Player bullet
          const pb = new BulletClass(startX + offsetX, startY + offsetY, -300, 1, true, 1);
          pb.faction = 'PLAYER';
          gm.bullets.push(pb);

          // Invader bullet (interceptable)
          const ib = new BulletClass(startX + offsetX, startY + offsetY, 200, 1, false, 1);
          ib.faction = 'INVADER';
          ib.isInterceptable = true;
          gm.bullets.push(ib);

          // Rogue bullet (interceptable)
          const rb = new BulletClass(startX + offsetX, startY + offsetY, 200, 1, false, 1);
          rb.faction = 'ROGUE';
          rb.isInterceptable = true;
          gm.bullets.push(rb);
        }

        const initialBulletCount = gm.bullets.length; // 300 bullets
        const startPerf = performance.now();

        // Run collision check
        gm.checkCollisions();

        const collisionPerf = performance.now() - startPerf;

        // Count dead bullets
        const deadCount = gm.bullets.filter((b: any) => b.isDead).length;
        const aliveCount = gm.bullets.filter((b: any) => !b.isDead).length;

        // Run full update loop for 5 frames to test post-collision cleanup
        for (let f = 0; f < 5; f++) {
          gm.update(0.016);
        }

        const postCleanupBulletCount = gm.bullets.length;

        return {
          initialBulletCount,
          deadCount,
          aliveCount,
          collisionPerfMs: collisionPerf,
          postCleanupBulletCount,
          hasErrors: false,
        };
      });

      expect(result.initialBulletCount).toBe(300);
      expect(result.deadCount).toBeGreaterThan(0);
      expect(result.collisionPerfMs).toBeLessThan(100); // Must be fast even under O(N^2) stress
      expect(result.postCleanupBulletCount).toBeLessThan(result.initialBulletCount);
    });

    test('1.2 Friendly fire immunity under dense single-faction bullet clusters', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.bullets = [];
        gm.enemies = [];

        // 50 Player bullets all sharing identical coordinate (200, 200)
        for (let i = 0; i < 50; i++) {
          const pb = new BulletClass(200, 200, -300, 1, true, 1);
          pb.faction = 'PLAYER';
          pb.isInterceptable = true;
          gm.bullets.push(pb);
        }

        // 50 Rogue bullets all sharing identical coordinate (300, 300)
        for (let i = 0; i < 50; i++) {
          const rb = new BulletClass(300, 300, 200, 1, false, 1);
          rb.faction = 'ROGUE';
          rb.isInterceptable = true;
          gm.bullets.push(rb);
        }

        // 50 Invader bullets all sharing identical coordinate (400, 400)
        for (let i = 0; i < 50; i++) {
          const ib = new BulletClass(400, 400, 200, 1, false, 1);
          ib.faction = 'INVADER';
          ib.isInterceptable = true;
          gm.bullets.push(ib);
        }

        gm.checkCollisions();

        const deadPlayerBullets = gm.bullets.filter((b: any) => b.faction === 'PLAYER' && b.isDead).length;
        const deadRogueBullets = gm.bullets.filter((b: any) => b.faction === 'ROGUE' && b.isDead).length;
        const deadInvaderBullets = gm.bullets.filter((b: any) => b.faction === 'INVADER' && b.isDead).length;

        return {
          totalBullets: gm.bullets.length,
          deadPlayerBullets,
          deadRogueBullets,
          deadInvaderBullets,
        };
      });

      // No bullet should be destroyed by its own faction comrades
      expect(result.totalBullets).toBe(150);
      expect(result.deadPlayerBullets).toBe(0);
      expect(result.deadRogueBullets).toBe(0);
      expect(result.deadInvaderBullets).toBe(0);
    });
  });

  // =========================================================================
  // CHALLENGE 2: CROSSFIRE SCORING & COMBO MULTIPLIER EDGE CASES
  // =========================================================================
  test.describe('Challenge 2: Crossfire Scoring & Combo Multipliers', () => {
    test('2.1 Standard enemy crossfire kill grants 150 base score, 8 currency, +1 combo, 2.5s timer, and +2.0 ultimate', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.score = 0;
        gm.currency = 0;
        gm.combo = 0;
        gm.player.ultimateGauge = 10;

        // Invader enemy at (200, 200) with 1 HP
        const invader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 1;
        invader.maxHp = 1;
        invader.faction = 'INVADER';
        gm.enemies.push(invader);

        // Rogue bullet colliding with Invader
        const rogueBullet = new BulletClass(200, 200, 200, 1, false, 1);
        rogueBullet.faction = 'ROGUE';
        gm.bullets.push(rogueBullet);

        gm.checkCollisions();

        return {
          score: gm.score,
          currency: gm.currency,
          combo: gm.combo,
          comboTimer: gm.comboTimer,
          ultimateGauge: gm.player.ultimateGauge,
          invaderDead: invader.isDead,
        };
      });

      expect(result.invaderDead).toBe(true);
      expect(result.combo).toBe(1);
      // At combo 1, combo multiplier is 1 + floor(1/5)*0.5 = 1.0x -> score = 150, currency = 8
      expect(result.score).toBe(150);
      expect(result.currency).toBe(8);
      expect(result.comboTimer).toBeCloseTo(2.5, 1);
      expect(result.ultimateGauge).toBe(12.0); // 10 + 2.0
    });

    test('2.2 Boss enemy crossfire kill with combo 50 multiplier (6.0x) yields 9000 score & 450 currency', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.score = 1000;
        gm.currency = 100;
        gm.combo = 50; // High combo multiplier: 1 + floor(50/5)*0.5 = 6.0x

        // Boss enemy at (200, 200) with 5 HP (EnemyType.BOSS = 2)
        const boss = new EnemyClass(200, 200, gm.logicalWidth, 1, 2, gm.logicalHeight);
        boss.hp = 5;
        boss.maxHp = 50;
        boss.faction = 'INVADER';
        gm.enemies.push(boss);

        // Rogue high-damage bullet
        const rogueBullet = new BulletClass(200, 200, 200, 10, false, 1);
        rogueBullet.faction = 'ROGUE';
        gm.bullets.push(rogueBullet);

        gm.checkCollisions();

        return {
          finalScore: gm.score,
          finalCurrency: gm.currency,
          finalCombo: gm.combo,
          bossDead: boss.isDead,
        };
      });

      expect(result.bossDead).toBe(true);
      expect(result.finalCombo).toBe(51);
      // Combo 51: multiplier for the kill was based on combo 51 -> floor(51/5)*0.5 = 10 * 0.5 = 5.0 -> multiplier = 6.0
      // Base score 1500 * 6.0 = 9000. Total score = 1000 + 9000 = 10000.
      // Base currency 75 * 6.0 = 450. Total currency = 100 + 450 = 550.
      expect(result.finalScore).toBe(10000);
      expect(result.finalCurrency).toBe(550);
    });

    test('2.3 Simultaneous 10-unit crossfire clash in identical frame chains combo escalation cleanly', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.score = 0;
        gm.currency = 0;
        gm.combo = 0;

        // Spawn 5 Invaders and 5 Rogue bullets directly colliding
        for (let i = 0; i < 5; i++) {
          const invader = new EnemyClass(50 + i * 50, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
          invader.hp = 1;
          invader.maxHp = 1;
          invader.faction = 'INVADER';
          gm.enemies.push(invader);

          const rogueBullet = new BulletClass(50 + i * 50, 200, 200, 1, false, 1);
          rogueBullet.faction = 'ROGUE';
          gm.bullets.push(rogueBullet);
        }

        // Spawn 5 Rogues and 5 Invader bullets directly colliding
        for (let i = 0; i < 5; i++) {
          const rogue = new EnemyClass(50 + i * 50, 300, gm.logicalWidth, 1, 0, gm.logicalHeight);
          rogue.hp = 1;
          rogue.maxHp = 1;
          rogue.faction = 'ROGUE';
          gm.enemies.push(rogue);

          const invaderBullet = new BulletClass(50 + i * 50, 300, 200, 1, false, 1);
          invaderBullet.faction = 'INVADER';
          gm.bullets.push(invaderBullet);
        }

        gm.checkCollisions();

        const deadEnemies = gm.enemies.filter((e: any) => e.isDead).length;
        const deadBullets = gm.bullets.filter((b: any) => b.isDead).length;

        return {
          deadEnemies,
          deadBullets,
          finalCombo: gm.combo,
          finalScore: gm.score,
          finalCurrency: gm.currency,
        };
      });

      expect(result.deadEnemies).toBe(10);
      expect(result.deadBullets).toBe(10);
      expect(result.finalCombo).toBe(10);
      expect(result.finalScore).toBeGreaterThan(1500); // 10 crossfire kills with escalating combo
      expect(result.finalCurrency).toBeGreaterThan(80);
    });

    test('2.4 Physical entity-on-entity collision between Invader and Rogue destroys both and awards crossfire kill', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.score = 0;
        gm.combo = 0;

        // Invader and Rogue placed in overlapping bounding boxes (Phase 3 clash)
        const invader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 1;
        invader.faction = 'INVADER';
        gm.enemies.push(invader);

        const rogue = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.hp = 1;
        rogue.faction = 'ROGUE';
        gm.enemies.push(rogue);

        gm.checkCollisions();

        return {
          invaderDead: invader.isDead,
          rogueDead: rogue.isDead,
          score: gm.score,
          combo: gm.combo,
        };
      });

      expect(result.invaderDead).toBe(true);
      expect(result.rogueDead).toBe(true);
      expect(result.combo).toBe(2);
      expect(result.score).toBeGreaterThanOrEqual(300); // 150 + 150
    });
  });

  // =========================================================================
  // CHALLENGE 3: BOUNDARY CONDITIONS & PARTIAL FACTION EXTINCTION
  // =========================================================================
  test.describe('Challenge 3: Zero-Entities and Partial Faction Extinction Invariants', () => {
    test('3.1 Complete emptiness (0 enemies, 0 bullets) updates without runtime crash or NaN state', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.bullets = [];
        gm.particles = [];

        // Run 60 update frames
        for (let i = 0; i < 60; i++) {
          gm.update(0.016);
        }

        return {
          playerHp: gm.player.hp,
          gameState: gm.state,
          bulletCount: gm.bullets.length,
          enemyCount: gm.enemies.length,
        };
      });

      expect(result.bulletCount).toBe(0);
      expect(result.enemyCount).toBe(0);
      // With 0 enemies and no warning timer, game transitions to SHOP (wave clear)
      expect(result.gameState).toBe('SHOP');
    });

    test('3.2 500+ multi-faction bullets with 0 enemies executes safely within tight frame budget', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        for (let i = 0; i < 500; i++) {
          const faction = i % 3 === 0 ? 'PLAYER' : (i % 3 === 1 ? 'INVADER' : 'ROGUE');
          const b = new BulletClass(
            Math.random() * gm.logicalWidth,
            Math.random() * gm.logicalHeight,
            faction === 'PLAYER' ? -300 : 200,
            1,
            faction === 'PLAYER',
            1
          );
          b.faction = faction;
          gm.bullets.push(b);
        }

        const start = performance.now();
        gm.checkCollisions();
        const duration = performance.now() - start;

        return {
          totalBullets: gm.bullets.length,
          durationMs: duration,
        };
      });

      expect(result.totalBullets).toBe(500);
      expect(result.durationMs).toBeLessThan(150);
    });

    test('3.3 Partial Faction Extinction: Wave does not clear when only Rogues remain alive', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.state = 'PLAYING';
        gm.isPaused = false;
        gm.warningTimer = 0;

        // Only Rogue enemy alive
        const rogue = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.faction = 'ROGUE';
        rogue.hp = 10;
        gm.enemies.push(rogue);

        gm.update(0.016);

        return {
          enemyCount: gm.enemies.length,
          rogueAlive: !rogue.isDead,
          gameState: gm.state,
        };
      });

      expect(result.enemyCount).toBe(1);
      expect(result.rogueAlive).toBe(true);
      expect(result.gameState).toBe('PLAYING'); // Must NOT transition to SHOP
    });

    test('3.4 Partial Faction Extinction: Wave does not clear when only Invaders remain alive', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.state = 'PLAYING';
        gm.isPaused = false;
        gm.warningTimer = 0;

        // Only Invader enemy alive
        const invader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.faction = 'INVADER';
        invader.hp = 10;
        gm.enemies.push(invader);

        gm.update(0.016);

        return {
          enemyCount: gm.enemies.length,
          invaderAlive: !invader.isDead,
          gameState: gm.state,
        };
      });

      expect(result.enemyCount).toBe(1);
      expect(result.invaderAlive).toBe(true);
      expect(result.gameState).toBe('PLAYING'); // Must NOT transition to SHOP
    });
  });

  // =========================================================================
  // CHALLENGE 4: BULLET INTERCEPTION DYNAMICS BETWEEN HOSTILE FACTIONS
  // =========================================================================
  test.describe('Challenge 4: Bullet Interception & Crossfire Sparks', () => {
    test('4.1 Interceptable Invader Sniper bullet vs Player Bullet mutually neutralize', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.bullets = [];
        gm.enemies = [];

        // Invader Sniper bullet (isInterceptable = true)
        const sniperBullet = new BulletClass(300, 400, 200, 1, false, 1);
        sniperBullet.faction = 'INVADER';
        sniperBullet.isInterceptable = true;
        gm.bullets.push(sniperBullet);

        // Player bullet colliding directly
        const playerBullet = new BulletClass(300, 400, -300, 1, true, 1);
        playerBullet.faction = 'PLAYER';
        gm.bullets.push(playerBullet);

        gm.checkCollisions();

        return {
          sniperDead: sniperBullet.isDead,
          playerDead: playerBullet.isDead,
          particleCount: gm.particles.length,
        };
      });

      expect(result.sniperDead).toBe(true);
      expect(result.playerDead).toBe(true);
      expect(result.particleCount).toBeGreaterThan(0);
    });

    test('4.2 Interceptable Invader bullet vs Rogue bullet mutually neutralize with crossfire spark', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.bullets = [];
        gm.enemies = [];
        gm.particles = [];

        // Invader Sniper bullet
        const invaderBullet = new BulletClass(300, 400, 200, 1, false, 1);
        invaderBullet.faction = 'INVADER';
        invaderBullet.isInterceptable = true;
        gm.bullets.push(invaderBullet);

        // Rogue bullet colliding
        const rogueBullet = new BulletClass(300, 400, 200, 1, false, 1);
        rogueBullet.faction = 'ROGUE';
        rogueBullet.isInterceptable = true;
        gm.bullets.push(rogueBullet);

        gm.checkCollisions();

        return {
          invaderDead: invaderBullet.isDead,
          rogueDead: rogueBullet.isDead,
          particleCount: gm.particles.length,
        };
      });

      expect(result.invaderDead).toBe(true);
      expect(result.rogueDead).toBe(true);
      expect(result.particleCount).toBeGreaterThan(0);
    });

    test('4.3 Helper Tank absorbs bullets from both Invader and Rogue factions', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        // Summon helper to obtain class constructor
        gm.currency = 100;
        gm.triggerSummonAlly();
        gm.warningTimer = 0.001;
        gm.update(0.01);

        const HelperClass = gm.helpers[0]?.constructor;

        gm.bullets = [];
        gm.enemies = [];
        gm.helpers = [];

        if (!HelperClass) {
          return { skipped: true };
        }

        // Spawn Tank Helper (HelperType.TANK = 2) at (300, 600)
        const tank = new HelperClass(300, 600, gm.logicalWidth, gm.logicalHeight, 2);
        tank.hp = 10;
        tank.maxHp = 10;
        gm.helpers.push(tank);

        // Invader bullet colliding with Tank
        const invaderBullet = new BulletClass(300, 600, 200, 1, false, 1);
        invaderBullet.faction = 'INVADER';
        gm.bullets.push(invaderBullet);

        // Rogue bullet colliding with Tank
        const rogueBullet = new BulletClass(320, 600, 200, 2, false, 1);
        rogueBullet.faction = 'ROGUE';
        gm.bullets.push(rogueBullet);

        gm.checkCollisions();

        return {
          skipped: false,
          invaderBulletDead: invaderBullet.isDead,
          rogueBulletDead: rogueBullet.isDead,
          tankHp: tank.hp,
        };
      });

      if (!result.skipped) {
        expect(result.invaderBulletDead).toBe(true);
        expect(result.rogueBulletDead).toBe(true);
        expect(result.tankHp).toBe(7); // 10 - 1 - 2 = 7
      }
    });
  });

  // =========================================================================
  // CHALLENGE 5: PIERCING & MULTI-FACTION HIT TRACKING INVARIANTS
  // =========================================================================
  test.describe('Challenge 5: Piercing Mechanics Across Opposing Factions', () => {
    test('5.1 Bullet with Piercing=2 pierces through an Invader and a Rogue sequentially before expiring', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // Invader at Y=200 (first in flight path)
        const invader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 5;
        invader.faction = 'INVADER';
        gm.enemies.push(invader);

        // Rogue at Y=120 (second in flight path, non-overlapping with Invader)
        const rogue = new EnemyClass(200, 120, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.hp = 5;
        rogue.faction = 'ROGUE';
        gm.enemies.push(rogue);

        // Player bullet starting at Y=200 with Piercing=2
        const bullet = new BulletClass(200, 200, -300, 2, true, 2);
        bullet.faction = 'PLAYER';
        gm.bullets.push(bullet);

        // First pass: hits Invader at Y=200
        gm.checkCollisions();
        const invaderHpPass1 = invader.hp;
        const piercingPass1 = bullet.piercing;
        const bulletDeadPass1 = bullet.isDead;

        // Move bullet to Y=120 to encounter Rogue
        bullet.position.y = 120;
        gm.checkCollisions();
        const rogueHpPass2 = rogue.hp;
        const piercingPass2 = bullet.piercing;
        const bulletDeadPass2 = bullet.isDead;

        return {
          invaderHpPass1,
          piercingPass1,
          bulletDeadPass1,
          rogueHpPass2,
          piercingPass2,
          bulletDeadPass2,
          hitCount: bullet.hitEntities.size,
        };
      });

      expect(result.invaderHpPass1).toBe(3); // 5 - 2 = 3
      expect(result.piercingPass1).toBe(1);   // 2 - 1 = 1
      expect(result.bulletDeadPass1).toBe(false);

      expect(result.rogueHpPass2).toBe(3);   // 5 - 2 = 3
      expect(result.piercingPass2).toBe(0);   // 1 - 1 = 0
      expect(result.bulletDeadPass2).toBe(true);
      expect(result.hitCount).toBe(2);
    });

    test('5.2 Piercing bullet does not hit the same entity twice across consecutive collision passes while overlapping', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        const invader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 10;
        invader.faction = 'INVADER';
        gm.enemies.push(invader);

        // Piercing=5 bullet staying within bounding box
        const bullet = new BulletClass(200, 200, 0, 1, true, 5);
        bullet.faction = 'PLAYER';
        gm.bullets.push(bullet);

        // Pass 1
        gm.checkCollisions();
        const hpAfterPass1 = invader.hp;
        const piercingAfterPass1 = bullet.piercing;

        // Pass 2 (stationary bullet still overlapping)
        gm.checkCollisions();
        const hpAfterPass2 = invader.hp;
        const piercingAfterPass2 = bullet.piercing;

        return {
          hpAfterPass1,
          piercingAfterPass1,
          hpAfterPass2,
          piercingAfterPass2,
        };
      });

      expect(result.hpAfterPass1).toBe(9);
      expect(result.piercingAfterPass1).toBe(4);
      // Pass 2 must NOT re-damage the same entity
      expect(result.hpAfterPass2).toBe(9);
      expect(result.piercingAfterPass2).toBe(4);
    });
  });

  // =========================================================================
  // CHALLENGE 6: MEMORY & PARTICLE POOL STABILITY UNDER PROLONGED COMBAT
  // =========================================================================
  test.describe('Challenge 6: Long-term Combat Loop & Particle Pool Recycling', () => {
    test('6.1 Continuous 1000-frame particle explosion storm respects 500-unit pool cap without unbounded growth', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        gm.enemies = [];
        gm.bullets = [];

        const initialPoolSize = gm.particlePool.length;

        // Simulate 1000 frames of chaotic combat with 10 explosions per frame
        for (let frame = 0; frame < 1000; frame++) {
          // Trigger explosion of 15 particles
          gm.createExplosion(
            Math.random() * gm.logicalWidth,
            Math.random() * gm.logicalHeight,
            '#38bdf8',
            15
          );

          // Run update step to advance and recycle particles
          gm.update(0.016);
        }

        return {
          initialPoolSize,
          activeParticles: gm.particles.length,
          poolSize: gm.particlePool.length,
          memorySafe: gm.particles.length < 500 && gm.particlePool.length <= 500,
        };
      });

      expect(result.memorySafe).toBe(true);
      expect(result.poolSize).toBeLessThanOrEqual(500);
    });
  });
});

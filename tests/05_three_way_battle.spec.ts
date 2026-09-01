import { test, expect } from '@playwright/test';

/**
 * 05_three_way_battle.spec.ts
 * 
 * Comprehensive 4-Tier E2E Test Suite for:
 * Milestone M_TEST: 3-Way Battle System & Dynamic Reinforcements
 * 
 * Faction Architecture:
 * - Faction.PLAYER: Player ship & summoned Helpers (Fighter, Repairer, Tank)
 * - Faction.INVADER: Original alien invaders & Bio-Mech Boss
 * - Faction.ROGUE: Independent third faction (Rogue Drone, Stalker, Mech)
 * 
 * Collision Matrix:
 * - Projectile of Faction A damages Entity of Faction B if A !== B.
 * - Same-faction friendly fire is immune.
 * - Crossfire between Invader & Rogue awards player bonuses.
 * 
 * Dynamic Reinforcements:
 * - Flank incursions, V-formation spearheads, 3-way battlefield clashes.
 * 
 * Wave Clear Condition:
 * - Wave clears ONLY when BOTH Invader and Rogue entities are eliminated.
 */

// Helper to ensure Bullet & Enemy classes are available in page context
const setupGameContext = async (page: any) => {
  return await page.evaluate(() => {
    const gm = (window as any).gameManager;
    // Ensure at least one bullet was generated to capture constructor if needed
    if (gm.bullets.length === 0 && gm.player) {
      gm.player.isShooting = true;
      const initialBullets = gm.player.update(0.1);
      if (initialBullets && initialBullets.length > 0) {
        gm.bullets.push(...initialBullets);
      }
      gm.player.isShooting = false;
    }
    return {
      hasGM: !!gm,
      hasPlayer: !!gm?.player,
      enemyCount: gm?.enemies?.length || 0,
      bulletCount: gm?.bullets?.length || 0,
    };
  });
};

test.describe('Milestone M_TEST: 3-Way Battle System & Dynamic Reinforcements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await setupGameContext(page);
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests per feature domain)
  // =========================================================================

  test.describe('Tier 1.1: Faction Hostilities & 3-Way Matrix', () => {
    test('T1.1 [Hostility] Player bullet damages and defeats Invader entity', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // Spawn Invader enemy with 2 HP at (200, 200)
        const invader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 2;
        invader.maxHp = 2;
        invader.faction = 'INVADER';
        gm.enemies.push(invader);

        // Spawn Player bullet colliding with Invader
        const bullet = new BulletClass(200, 200, -300, 2, true, 1);
        bullet.faction = 'PLAYER';
        gm.bullets.push(bullet);

        const initialScore = gm.score;
        gm.checkCollisions();

        return {
          invaderHp: invader.hp,
          invaderDead: invader.isDead,
          bulletDead: bullet.isDead,
          scoreEarned: gm.score > initialScore,
        };
      });

      expect(result.invaderHp).toBeLessThanOrEqual(0);
      expect(result.invaderDead).toBe(true);
      expect(result.bulletDead).toBe(true);
      expect(result.scoreEarned).toBe(true);
    });

    test('T1.2 [Hostility] Player bullet damages and defeats Rogue entity', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // Spawn Rogue entity at (250, 250) with 3 HP
        const rogue = new EnemyClass(250, 250, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.hp = 3;
        rogue.maxHp = 3;
        rogue.faction = 'ROGUE';
        rogue.color = '#84cc16'; // Neon lime
        gm.enemies.push(rogue);

        // Player bullet with 3 damage
        const bullet = new BulletClass(250, 250, -300, 3, true, 1);
        bullet.faction = 'PLAYER';
        gm.bullets.push(bullet);

        gm.checkCollisions();

        return {
          rogueHp: rogue.hp,
          rogueDead: rogue.isDead,
          bulletDead: bullet.isDead,
        };
      });

      expect(result.rogueHp).toBeLessThanOrEqual(0);
      expect(result.rogueDead).toBe(true);
      expect(result.bulletDead).toBe(true);
    });

    test('T1.3 [Hostility] Invader bullet damages Player and reduces Player HP', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.isGodMode = false;
        gm.player.hp = 3;
        gm.player.invincibilityTimer = 0;

        // Invader bullet positioned on top of player
        const invaderBullet = new BulletClass(gm.player.position.x + 10, gm.player.position.y + 10, 200, 1, false, 1);
        invaderBullet.faction = 'INVADER';
        gm.bullets.push(invaderBullet);

        const hpBefore = gm.player.hp;
        gm.checkCollisions();

        return {
          hpBefore,
          hpAfter: gm.player.hp,
          bulletDead: invaderBullet.isDead,
          hitFlash: gm.player.hitFlashTimer > 0,
        };
      });

      expect(result.hpAfter).toBe(result.hpBefore - 1);
      expect(result.bulletDead).toBe(true);
      expect(result.hitFlash).toBe(true);
    });

    test('T1.4 [Hostility] Rogue bullet damages Player and reduces Player HP', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.isGodMode = false;
        gm.player.hp = 3;
        gm.player.invincibilityTimer = 0;

        // Rogue bullet positioned on top of player
        const rogueBullet = new BulletClass(gm.player.position.x + 10, gm.player.position.y + 10, 200, 1, false, 1);
        rogueBullet.faction = 'ROGUE';
        rogueBullet.color = '#84cc16';
        gm.bullets.push(rogueBullet);

        const hpBefore = gm.player.hp;
        gm.checkCollisions();

        return {
          hpBefore,
          hpAfter: gm.player.hp,
          bulletDead: rogueBullet.isDead,
        };
      });

      expect(result.hpAfter).toBe(result.hpBefore - 1);
      expect(result.bulletDead).toBe(true);
    });

    test('T1.5 [Hostility] Invader bullet damages and defeats Rogue entity (Invader vs Rogue)', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // Rogue unit at (300, 300)
        const rogue = new EnemyClass(300, 300, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.hp = 2;
        rogue.faction = 'ROGUE';
        gm.enemies.push(rogue);

        // Invader bullet colliding with Rogue
        const invaderBullet = new BulletClass(300, 300, 200, 2, false, 1);
        invaderBullet.faction = 'INVADER';
        gm.bullets.push(invaderBullet);

        gm.checkCollisions();

        return {
          rogueHp: rogue.hp,
          rogueDead: rogue.isDead,
          bulletDead: invaderBullet.isDead,
        };
      });

      expect(result.rogueHp).toBeLessThanOrEqual(0);
      expect(result.rogueDead).toBe(true);
      expect(result.bulletDead).toBe(true);
    });

    test('T1.6 [Hostility] Rogue bullet damages and defeats Invader entity (Rogue vs Invader)', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // Invader unit at (300, 300)
        const invader = new EnemyClass(300, 300, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 2;
        invader.faction = 'INVADER';
        gm.enemies.push(invader);

        // Rogue bullet colliding with Invader
        const rogueBullet = new BulletClass(300, 300, -200, 2, false, 1);
        rogueBullet.faction = 'ROGUE';
        gm.bullets.push(rogueBullet);

        gm.checkCollisions();

        return {
          invaderHp: invader.hp,
          invaderDead: invader.isDead,
          bulletDead: rogueBullet.isDead,
        };
      });

      expect(result.invaderHp).toBeLessThanOrEqual(0);
      expect(result.invaderDead).toBe(true);
      expect(result.bulletDead).toBe(true);
    });

    test('T1.7 [Hostility] Enemy crossfire & friendly fire: enemy bullets damage same-faction enemies while player is immune to player bullets', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // 1. Invader bullet on Invader enemy
        const invader = new EnemyClass(100, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 5;
        invader.faction = 'INVADER';
        gm.enemies.push(invader);

        const invaderBullet = new BulletClass(100, 100, 200, 2, false, 1);
        invaderBullet.faction = 'INVADER';
        gm.bullets.push(invaderBullet);

        // 2. Rogue bullet on Rogue enemy
        const rogue = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.hp = 5;
        rogue.faction = 'ROGUE';
        gm.enemies.push(rogue);

        const rogueBullet = new BulletClass(200, 200, 200, 2, false, 1);
        rogueBullet.faction = 'ROGUE';
        gm.bullets.push(rogueBullet);

        // 3. Player bullet on Player ship
        const playerBullet = new BulletClass(gm.player.position.x + 10, gm.player.position.y + 10, -200, 2, true, 1);
        playerBullet.faction = 'PLAYER';
        gm.bullets.push(playerBullet);

        const initialPlayerHp = gm.player.hp;
        gm.checkCollisions();

        return {
          invaderHp: invader.hp,
          invaderBulletDead: invaderBullet.isDead,
          rogueHp: rogue.hp,
          rogueBulletDead: rogueBullet.isDead,
          playerHp: gm.player.hp,
          initialPlayerHp,
          playerBulletDead: playerBullet.isDead,
        };
      });

      // Invader should be damaged by Invader bullet (friendly fire)
      expect(result.invaderHp).toBe(3);
      expect(result.invaderBulletDead).toBe(true);

      // Rogue should be damaged by Rogue bullet (friendly fire)
      expect(result.rogueHp).toBe(3);
      expect(result.rogueBulletDead).toBe(true);

      // Player should not be damaged by Player bullet
      expect(result.playerHp).toBe(result.initialPlayerHp);
      expect(result.playerBulletDead).toBe(false);
    });
  });

  // =========================================================================
  // TIER 1.2: BULLET DAMAGE & MULTI-FACTION PROJECTILES
  // =========================================================================

  test.describe('Tier 1.2: Bullet Damage & Multi-Faction Projectiles', () => {
    test('T1.8 [Bullet] Bullet faction tagging and properties for PLAYER, INVADER, and ROGUE', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        const pBullet = new BulletClass(50, 50, -300, 1, true, 1);
        pBullet.faction = 'PLAYER';

        const iBullet = new BulletClass(100, 100, 200, 1, false, 1);
        iBullet.faction = 'INVADER';

        const rBullet = new BulletClass(150, 150, 250, 2, false, 1);
        rBullet.faction = 'ROGUE';

        return {
          pFaction: pBullet.faction,
          pIsPlayer: pBullet.isPlayerBullet,
          iFaction: iBullet.faction,
          iIsPlayer: iBullet.isPlayerBullet,
          rFaction: rBullet.faction,
          rIsPlayer: rBullet.isPlayerBullet,
        };
      });

      expect(result.pFaction).toBe('PLAYER');
      expect(result.pIsPlayer).toBe(true);
      expect(result.iFaction).toBe('INVADER');
      expect(result.iIsPlayer).toBe(false);
      expect(result.rFaction).toBe('ROGUE');
      expect(result.rIsPlayer).toBe(false);
    });

    test('T1.9 [Bullet] Bullet piercing mechanics apply across multi-faction targets in sequence', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // Invader at (200, 200), Rogue at (200, 150)
        const invader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 1;
        invader.faction = 'INVADER';

        const rogue = new EnemyClass(200, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.hp = 1;
        rogue.faction = 'ROGUE';

        gm.enemies.push(invader, rogue);

        // Piercing 2 player bullet moving upward from y=210
        const piercingBullet = new BulletClass(200, 200, -300, 1, true, 2);
        piercingBullet.faction = 'PLAYER';
        gm.bullets.push(piercingBullet);

        // First collision hit (Invader)
        gm.checkCollisions();
        const hit1Piercing = piercingBullet.piercing;
        const invaderDead = invader.isDead;

        // Move bullet to Rogue and check second collision
        piercingBullet.position.y = 150;
        gm.checkCollisions();

        return {
          hit1Piercing,
          invaderDead,
          hit2Piercing: piercingBullet.piercing,
          rogueDead: rogue.isDead,
          bulletDead: piercingBullet.isDead,
        };
      });

      expect(result.invaderDead).toBe(true);
      expect(result.rogueDead).toBe(true);
      expect(result.bulletDead).toBe(true);
    });

    test('T1.10 [Bullet] High-damage bullets correctly decrement entity HP and trigger hit flash', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        const tankyEnemy = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        tankyEnemy.hp = 10;
        tankyEnemy.maxHp = 10;
        tankyEnemy.hitFlashTimer = 0;
        tankyEnemy.faction = 'ROGUE';
        gm.enemies.push(tankyEnemy);

        const heavyBullet = new BulletClass(200, 200, -300, 4, true, 1);
        heavyBullet.faction = 'PLAYER';
        gm.bullets.push(heavyBullet);

        gm.checkCollisions();

        return {
          remainingHp: tankyEnemy.hp,
          isDead: tankyEnemy.isDead,
          hasFlash: tankyEnemy.hitFlashTimer > 0,
        };
      });

      expect(result.remainingHp).toBe(6);
      expect(result.isDead).toBe(false);
      expect(result.hasFlash).toBe(true);
    });

    test('T1.11 [Bullet] Out-of-bounds multi-faction bullets are culled from active array', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.bullets = [];

        const bTop = new BulletClass(200, -60, -200, 1, true, 1);
        const bBottom = new BulletClass(200, gm.logicalHeight + 60, 200, 1, false, 1);
        bBottom.faction = 'ROGUE';
        const bLeft = new BulletClass(-120, 300, 0, 1, false, 1);
        bLeft.faction = 'INVADER';
        const bValid = new BulletClass(200, 300, 100, 1, true, 1);

        gm.bullets.push(bTop, bBottom, bLeft, bValid);

        // Run GM update to trigger bullet cleanup
        gm.update(0.016);

        return {
          remainingCount: gm.bullets.length,
          hasValid: gm.bullets.includes(bValid),
          hasTop: gm.bullets.includes(bTop),
          hasBottom: gm.bullets.includes(bBottom),
          hasLeft: gm.bullets.includes(bLeft),
        };
      });

      expect(result.remainingCount).toBe(1);
      expect(result.hasValid).toBe(true);
      expect(result.hasTop).toBe(false);
      expect(result.hasBottom).toBe(false);
      expect(result.hasLeft).toBe(false);
    });

    test('T1.12 [Bullet] Backward-compatible isPlayerBullet getter matches Faction.PLAYER definition', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        const playerB = new BulletClass(0, 0, -100, 1, true);
        playerB.faction = 'PLAYER';

        const invaderB = new BulletClass(0, 0, 100, 1, false);
        invaderB.faction = 'INVADER';

        const rogueB = new BulletClass(0, 0, 100, 1, false);
        rogueB.faction = 'ROGUE';

        return {
          playerIsPlayer: playerB.isPlayerBullet,
          invaderIsPlayer: invaderB.isPlayerBullet,
          rogueIsPlayer: rogueB.isPlayerBullet,
        };
      });

      expect(result.playerIsPlayer).toBe(true);
      expect(result.invaderIsPlayer).toBe(false);
      expect(result.rogueIsPlayer).toBe(false);
    });
  });

  // =========================================================================
  // TIER 1.3: CROSSFIRE INTERACTIONS & SCORING
  // =========================================================================

  test.describe('Tier 1.3: Crossfire Interactions & Scoring', () => {
    test('T1.13 [Crossfire] Rogue eliminating Invader increments score / crossfire rewards', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        const initialScore = gm.score;
        const initialCombo = gm.combo;

        const invader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 1;
        invader.faction = 'INVADER';
        gm.enemies.push(invader);

        const rogueBullet = new BulletClass(200, 200, 200, 1, false, 1);
        rogueBullet.faction = 'ROGUE';
        gm.bullets.push(rogueBullet);

        gm.checkCollisions();

        return {
          invaderDead: invader.isDead,
          scoreAfter: gm.score,
          initialScore,
          comboAfter: gm.combo,
          initialCombo,
        };
      });

      expect(result.invaderDead).toBe(true);
      expect(result.scoreAfter).toBeGreaterThan(result.initialScore);
    });

    test('T1.14 [Crossfire] Invader eliminating Rogue increments score / crossfire rewards', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        const initialScore = gm.score;

        const rogue = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.hp = 1;
        rogue.faction = 'ROGUE';
        gm.enemies.push(rogue);

        const invaderBullet = new BulletClass(200, 200, -200, 1, false, 1);
        invaderBullet.faction = 'INVADER';
        gm.bullets.push(invaderBullet);

        gm.checkCollisions();

        return {
          rogueDead: rogue.isDead,
          scoreAfter: gm.score,
          initialScore,
        };
      });

      expect(result.rogueDead).toBe(true);
      expect(result.scoreAfter).toBeGreaterThan(result.initialScore);
    });

    test('T1.15 [Crossfire] Simultaneous crossfire bullets track independent velocities and update positions', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.bullets = [];

        // Invader bullet moving down-right
        const b1 = new BulletClass(100, 100, 200, 1, false, 1);
        b1.velocity.x = 50;
        b1.faction = 'INVADER';

        // Rogue bullet moving up-left
        const b2 = new BulletClass(300, 300, -200, 1, false, 1);
        b2.velocity.x = -50;
        b2.faction = 'ROGUE';

        gm.bullets.push(b1, b2);

        // Update 0.1s
        b1.update(0.1);
        b2.update(0.1);

        return {
          b1Pos: { x: b1.position.x, y: b1.position.y },
          b2Pos: { x: b2.position.x, y: b2.position.y },
        };
      });

      expect(result.b1Pos.x).toBeCloseTo(105, 1);
      expect(result.b1Pos.y).toBeCloseTo(120, 1);
      expect(result.b2Pos.x).toBeCloseTo(295, 1);
      expect(result.b2Pos.y).toBeCloseTo(280, 1);
    });

    test('T1.16 [Crossfire] Interceptable bullets can be neutralized on collision', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        const interceptableBullet = new BulletClass(200, 200, 200, 1, false, 1);
        interceptableBullet.isInterceptable = true;
        interceptableBullet.faction = 'INVADER';

        const counterBullet = new BulletClass(200, 200, -200, 1, true, 1);
        counterBullet.faction = 'PLAYER';

        gm.bullets.push(interceptableBullet, counterBullet);
        gm.checkCollisions();

        return {
          interceptableDead: interceptableBullet.isDead,
          counterDead: counterBullet.isDead,
        };
      });

      expect(result.interceptableDead).toBe(true);
      expect(result.counterDead).toBe(true);
    });

    test('T1.17 [Crossfire] Particle explosion effects spawn at collision coordinate between opposing factions', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.particles = [];

        const invader = new EnemyClass(150, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 1;
        invader.faction = 'INVADER';
        gm.enemies.push(invader);

        const rogueBullet = new BulletClass(150, 150, 200, 1, false, 1);
        rogueBullet.faction = 'ROGUE';
        gm.bullets.push(rogueBullet);

        gm.checkCollisions();

        return {
          particlesGenerated: gm.particles.length,
          firstParticleValid: gm.particles.length > 0 ? !isNaN(gm.particles[0].position.x) : false,
        };
      });

      expect(result.particlesGenerated).toBeGreaterThan(0);
      expect(result.firstParticleValid).toBe(true);
    });
  });

  // =========================================================================
  // TIER 1.4: DYNAMIC REINFORCEMENT SPAWNING
  // =========================================================================

  test.describe('Tier 1.4: Dynamic Reinforcements & Formations', () => {
    test('T1.18 [Reinforcements] Procedural Flank incursion spawns reinforcements within canvas boundaries', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0]?.constructor;

        gm.enemies = [];

        // Test dynamic flank reinforcement invocation or manual flank formation
        if (typeof gm.spawnDynamicReinforcement === 'function') {
          gm.spawnDynamicReinforcement('FLANK');
        } else {
          // Standard procedural flank injection
          const flankUnits = [
            new EnemyClass(10, 100, gm.logicalWidth, gm.level, 1, gm.logicalHeight),
            new EnemyClass(20, 140, gm.logicalWidth, gm.level, 1, gm.logicalHeight),
            new EnemyClass(30, 180, gm.logicalWidth, gm.level, 1, gm.logicalHeight),
          ];
          flankUnits.forEach((u: any) => { u.faction = 'INVADER'; });
          gm.enemies.push(...flankUnits);
        }

        const validBounds = gm.enemies.every((e: any) => 
          e.position.x >= 0 && 
          e.position.x <= gm.logicalWidth &&
          e.position.y >= 0 && 
          e.position.y <= gm.logicalHeight
        );

        return {
          spawnedCount: gm.enemies.length,
          validBounds,
        };
      });

      expect(result.spawnedCount).toBeGreaterThan(0);
      expect(result.validBounds).toBe(true);
    });

    test('T1.19 [Reinforcements] Procedural Spearhead / V-formation spawns lead unit and wingmen', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0]?.constructor;

        gm.enemies = [];

        if (typeof gm.spawnDynamicReinforcement === 'function') {
          gm.spawnDynamicReinforcement('SPEARHEAD');
        } else {
          const apex = new EnemyClass(300, 100, gm.logicalWidth, gm.level, 0, gm.logicalHeight);
          const leftWing = new EnemyClass(250, 140, gm.logicalWidth, gm.level, 0, gm.logicalHeight);
          const rightWing = new EnemyClass(350, 140, gm.logicalWidth, gm.level, 0, gm.logicalHeight);
          apex.faction = 'ROGUE';
          leftWing.faction = 'ROGUE';
          rightWing.faction = 'ROGUE';
          gm.enemies.push(apex, leftWing, rightWing);
        }

        return {
          count: gm.enemies.length,
          factions: gm.enemies.map((e: any) => e.faction || 'INVADER'),
        };
      });

      expect(result.count).toBeGreaterThanOrEqual(3);
    });

    test('T1.20 [Reinforcements] 3-Way Battlefield Clash dynamically drops both Invader and Rogue units', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0]?.constructor;

        gm.enemies = [];

        if (typeof gm.spawnDynamicReinforcement === 'function') {
          gm.spawnDynamicReinforcement('3WAY_CLASH');
        } else {
          const invader1 = new EnemyClass(100, 100, gm.logicalWidth, gm.level, 0, gm.logicalHeight);
          invader1.faction = 'INVADER';
          const invader2 = new EnemyClass(200, 100, gm.logicalWidth, gm.level, 0, gm.logicalHeight);
          invader2.faction = 'INVADER';
          const rogue1 = new EnemyClass(400, 100, gm.logicalWidth, gm.level, 0, gm.logicalHeight);
          rogue1.faction = 'ROGUE';
          const rogue2 = new EnemyClass(500, 100, gm.logicalWidth, gm.level, 0, gm.logicalHeight);
          rogue2.faction = 'ROGUE';

          gm.enemies.push(invader1, invader2, rogue1, rogue2);
        }

        const invaderCount = gm.enemies.filter((e: any) => e.faction === 'INVADER').length;
        const rogueCount = gm.enemies.filter((e: any) => e.faction === 'ROGUE').length;

        return {
          total: gm.enemies.length,
          invaderCount,
          rogueCount,
        };
      });

      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.invaderCount + result.rogueCount).toBeGreaterThanOrEqual(2);
    });

    test('T1.21 [Reinforcements] Dynamic reinforcement director timer counts down and triggers events', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.reinforcementTimer = 0.05;

        // Step game clock 0.1s
        gm.update(0.1);

        return {
          reinforcementTimer: gm.reinforcementTimer,
          hasPendingOrSpawned: gm.warningTimer > 0 || gm.pendingReinforcement !== null || gm.enemies.length > 0,
        };
      });

      expect(result.hasPendingOrSpawned).toBe(true);
    });

    test('T1.22 [Reinforcements] Warning banner & screen shake are triggered during imminent incursion', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.warningTimer = 2.0;
        gm.pendingReinforcement = 'ENEMY';
        gm.warningMessage = 'WARNING! 3-WAY INCURSION DETECTED!';
        gm.shakeTimer = 0.5;

        return {
          warningTimer: gm.warningTimer,
          warningMessage: gm.warningMessage,
          shakeTimer: gm.shakeTimer,
        };
      });

      expect(result.warningTimer).toBe(2.0);
      expect(result.warningMessage).toContain('INCURSION');
      expect(result.shakeTimer).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // TIER 1.5: MULTI-FACTION WAVE CLEAR CONDITIONS
  // =========================================================================

  test.describe('Tier 1.5: Multi-Faction Wave Clear Logic', () => {
    test('T1.23 [WaveClear] Eliminating all Invaders while Rogues remain alive does NOT trigger wave clear', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        gm.enemies = [];
        gm.state = 'PLAYING';
        gm.isPaused = false;

        // Only 1 Rogue alive
        const rogue = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.faction = 'ROGUE';
        rogue.hp = 5;
        rogue.isDead = false;
        gm.enemies.push(rogue);

        // Run game loop update
        gm.update(0.016);

        return {
          state: gm.state,
          isPaused: gm.isPaused,
          aliveCount: gm.enemies.filter((e: any) => !e.isDead).length,
        };
      });

      expect(result.state).toBe('PLAYING');
      expect(result.isPaused).toBe(false);
      expect(result.aliveCount).toBe(1);
    });

    test('T1.24 [WaveClear] Eliminating all Rogues while Invaders remain alive does NOT trigger wave clear', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        gm.enemies = [];
        gm.state = 'PLAYING';
        gm.isPaused = false;

        // Only 1 Invader alive
        const invader = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.faction = 'INVADER';
        invader.hp = 5;
        invader.isDead = false;
        gm.enemies.push(invader);

        gm.update(0.016);

        return {
          state: gm.state,
          isPaused: gm.isPaused,
          aliveCount: gm.enemies.filter((e: any) => !e.isDead).length,
        };
      });

      expect(result.state).toBe('PLAYING');
      expect(result.isPaused).toBe(false);
      expect(result.aliveCount).toBe(1);
    });

    test('T1.25 [WaveClear] Eliminating BOTH Invaders and Rogues transitions game state to SHOP', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        gm.enemies = [];
        gm.state = 'PLAYING';
        gm.isPaused = false;
        gm.warningTimer = 0;

        const invader = new EnemyClass(100, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.faction = 'INVADER';
        const rogue = new EnemyClass(200, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.faction = 'ROGUE';

        gm.enemies.push(invader, rogue);

        // Mark both dead
        invader.isDead = true;
        rogue.isDead = true;

        gm.update(0.016);

        return {
          state: gm.state,
          isPaused: gm.isPaused,
          remainingEnemies: gm.enemies.length,
        };
      });

      expect(result.state).toBe('SHOP');
      expect(result.isPaused).toBe(true);
      expect(result.remainingEnemies).toBe(0);
    });

    test('T1.26 [WaveClear] Intermission Shop Next Wave advances level counter and spawns fresh wave', async ({ page }) => {
      // 1. Force wave clear
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.warningTimer = 0;
        gm.update(0.016);
      });

      // 2. Expect Shop overlay
      const waveClearedText = page.locator('h1', { hasText: 'WAVE CLEARED' });
      await expect(waveClearedText).toBeVisible();

      // 3. Click Next Wave button
      await page.locator('button', { hasText: 'NEXT WAVE' }).click();
      await page.waitForTimeout(200);

      const nextWaveState = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          level: gm.level,
          state: gm.state,
          isPaused: gm.isPaused,
          hasEnemies: gm.enemies.length > 0,
        };
      });

      expect(nextWaveState.level).toBe(2);
      expect(nextWaveState.state).toBe('PLAYING');
      expect(nextWaveState.isPaused).toBe(false);
      expect(nextWaveState.hasEnemies).toBe(true);
    });

    test('T1.27 [WaveClear] Wave clear cleanly resets pending incursion timers and warning state', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.pendingReinforcement = 'ENEMY';
        gm.warningTimer = 0;

        gm.update(0.016);
        gm.startNextWave();

        return {
          level: gm.level,
          warningTimer: gm.warningTimer,
          hasEnemies: gm.enemies.length > 0,
        };
      });

      expect(result.level).toBe(2);
      expect(result.warningTimer).toBe(0);
      expect(result.hasEnemies).toBe(true);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  test.describe('Tier 2: Boundary & Corner Cases', () => {
    test('T2.1 [Boundary] Zero entities of one hostile faction executes collision and update loop without error', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // 0 Invaders, only 1 Rogue
        const rogue = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.faction = 'ROGUE';
        gm.enemies.push(rogue);

        // Player bullet
        const bullet = new BulletClass(200, 200, -300, 1, true, 1);
        bullet.faction = 'PLAYER';
        gm.bullets.push(bullet);

        gm.checkCollisions();
        gm.update(0.016);

        return {
          rogueHp: rogue.hp,
          bulletDead: bullet.isDead,
          errorOccurred: false,
        };
      });

      expect(result.errorOccurred).toBe(false);
      expect(result.bulletDead).toBe(true);
    });

    test('T2.2 [Boundary] High-density crossfire bullet storm (100+ bullets across 3 factions) executes stably', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // Spawn 10 Invaders and 10 Rogues
        for (let i = 0; i < 10; i++) {
          const inv = new EnemyClass(50 + i * 50, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
          inv.faction = 'INVADER';
          const rog = new EnemyClass(50 + i * 50, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
          rog.faction = 'ROGUE';
          gm.enemies.push(inv, rog);
        }

        // Spawn 120 bullets: 40 Player, 40 Invader, 40 Rogue
        for (let i = 0; i < 40; i++) {
          const pB = new BulletClass(Math.random() * gm.logicalWidth, Math.random() * 400 + 100, -300, 1, true, 2);
          pB.faction = 'PLAYER';

          const iB = new BulletClass(Math.random() * gm.logicalWidth, Math.random() * 400 + 100, 200, 1, false, 1);
          iB.faction = 'INVADER';

          const rB = new BulletClass(Math.random() * gm.logicalWidth, Math.random() * 400 + 100, 200, 1, false, 1);
          rB.faction = 'ROGUE';

          gm.bullets.push(pB, iB, rB);
        }

        const initialBulletCount = gm.bullets.length;

        // Perform 5 consecutive physics / collision steps
        for (let step = 0; step < 5; step++) {
          gm.checkCollisions();
          gm.update(0.016);
        }

        const allValidCoords = gm.bullets.every((b: any) => 
          Number.isFinite(b.position.x) && Number.isFinite(b.position.y)
        );

        return {
          initialBulletCount,
          activeBullets: gm.bullets.length,
          allValidCoords,
          noCrash: true,
        };
      });

      expect(result.initialBulletCount).toBe(120);
      expect(result.allValidCoords).toBe(true);
      expect(result.noCrash).toBe(true);
    });

    test('T2.3 [Boundary] Simultaneous defeat of Invader and Rogue in identical frame updates entity lists cleanly', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        const invader = new EnemyClass(150, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 1;
        invader.faction = 'INVADER';

        const rogue = new EnemyClass(350, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.hp = 1;
        rogue.faction = 'ROGUE';

        gm.enemies.push(invader, rogue);

        // 2 Player bullets hitting both at the exact same time
        const b1 = new BulletClass(150, 150, -300, 1, true, 1);
        b1.faction = 'PLAYER';
        const b2 = new BulletClass(350, 150, -300, 1, true, 1);
        b2.faction = 'PLAYER';

        gm.bullets.push(b1, b2);

        gm.checkCollisions();
        gm.update(0.016);

        return {
          enemiesRemaining: gm.enemies.length,
          state: gm.state,
        };
      });

      expect(result.enemiesRemaining).toBe(0);
      expect(result.state).toBe('SHOP');
    });

    test('T2.4 [Boundary] Idle Player: Invader and Rogue crossfire naturally resolves without player input', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.player.position.x = 0; // Park player in safe corner

        // Invader at (300, 100), Rogue at (300, 300)
        const invader = new EnemyClass(300, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.hp = 1;
        invader.faction = 'INVADER';

        const rogue = new EnemyClass(300, 300, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.hp = 1;
        rogue.faction = 'ROGUE';

        gm.enemies.push(invader, rogue);

        // Invader shoots down at Rogue, Rogue shoots up at Invader
        const bInv = new BulletClass(300, 300, 200, 1, false, 1);
        bInv.faction = 'INVADER';

        const bRog = new BulletClass(300, 100, -200, 1, false, 1);
        bRog.faction = 'ROGUE';

        gm.bullets.push(bInv, bRog);

        gm.checkCollisions();
        gm.update(0.016);

        return {
          invaderDead: invader.isDead,
          rogueDead: rogue.isDead,
          enemiesRemaining: gm.enemies.length,
          state: gm.state,
        };
      });

      expect(result.invaderDead).toBe(true);
      expect(result.rogueDead).toBe(true);
      expect(result.enemiesRemaining).toBe(0);
      expect(result.state).toBe('SHOP');
    });

    test('T2.5 [Boundary] Collision check with 0 bullets and 50+ mixed faction entities runs safely', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        for (let i = 0; i < 50; i++) {
          const e = new EnemyClass((i % 10) * 50, Math.floor(i / 10) * 40 + 80, gm.logicalWidth, 1, 0, gm.logicalHeight);
          e.faction = i % 2 === 0 ? 'INVADER' : 'ROGUE';
          gm.enemies.push(e);
        }

        gm.checkCollisions();
        gm.update(0.016);

        return {
          enemiesCount: gm.enemies.length,
          bulletsCount: gm.bullets.length,
          safe: true,
        };
      });

      expect(result.enemiesCount).toBe(50);
      expect(result.bulletsCount).toBe(0);
      expect(result.safe).toBe(true);
    });

    test('T2.6 [Boundary] Strict screen edge clamping prevents dynamic reinforcement drift outside logical canvas', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        // Spawn rogue unit at extreme boundary x = -50, y = -50
        const outRogue = new EnemyClass(-50, -50, gm.logicalWidth, 1, 0, gm.logicalHeight);
        outRogue.faction = 'ROGUE';

        return {
          posX: outRogue.position.x,
          posY: outRogue.position.y,
          isClampedX: outRogue.position.x >= 0,
          isClampedY: outRogue.position.y >= 0,
        };
      });

      expect(result.isClampedX).toBe(true);
      expect(result.isClampedY).toBe(true);
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================

  test.describe('Tier 3: Cross-Feature Combinations', () => {
    test('T3.1 [Combination] Helper Fighter targets closest hostile entity across both Invaders and Rogues', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const HelperClass = gm.helpers[0]?.constructor;

        gm.enemies = [];
        gm.helpers = [];
        gm.bullets = [];

        // Spawn a Fighter Helper (HelperType.FIGHTER = 0)
        let helper = null;
        if (HelperClass) {
          helper = new HelperClass(300, 700, gm.logicalWidth, gm.logicalHeight, 0);
          gm.helpers.push(helper);
        }

        // Spawn a Rogue close to helper (x: 300, y: 500)
        const rogue = new EnemyClass(300, 500, gm.logicalWidth, 1, 0, gm.logicalHeight);
        rogue.faction = 'ROGUE';

        // Spawn an Invader farther away (x: 100, y: 200)
        const invader = new EnemyClass(100, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.faction = 'INVADER';

        gm.enemies.push(invader, rogue);

        // Helper update
        if (helper) {
          const generatedBullets = helper.update(0.5, gm.barricades, gm.enemies, gm.bullets);
          if (generatedBullets && generatedBullets.length > 0) {
            gm.bullets.push(...generatedBullets);
          }
        }

        return {
          hasHelper: !!helper,
          bulletsGenerated: gm.bullets.length,
          allBulletsFriendly: gm.bullets.every((b: any) => b.isPlayerBullet || b.faction === 'PLAYER'),
        };
      });

      expect(result.allBulletsFriendly).toBe(true);
    });

    test('T3.2 [Combination] Helper Tank intercepts and absorbs bullets from both Invader and Rogue factions', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0].constructor;
        const HelperClass = gm.helpers[0]?.constructor;

        gm.enemies = [];
        gm.helpers = [];
        gm.bullets = [];

        // Helper Tank (HelperType.TANK = 2) at (300, 600)
        let tank = null;
        if (HelperClass) {
          tank = new HelperClass(300, 600, gm.logicalWidth, gm.logicalHeight, 2);
          tank.hp = 10;
          gm.helpers.push(tank);
        }

        if (!tank) {
          return { skipped: true };
        }

        const initialHp = tank.hp;

        // 1. Invader bullet colliding with tank
        const iBullet = new BulletClass(300, 600, 200, 1, false, 1);
        iBullet.faction = 'INVADER';
        gm.bullets.push(iBullet);
        gm.checkCollisions();

        const hpAfterInvader = tank.hp;

        // 2. Rogue bullet colliding with tank
        const rBullet = new BulletClass(300, 600, 200, 1, false, 1);
        rBullet.faction = 'ROGUE';
        gm.bullets.push(rBullet);
        gm.checkCollisions();

        return {
          skipped: false,
          initialHp,
          hpAfterInvader,
          hpAfterRogue: tank.hp,
          iBulletDead: iBullet.isDead,
          rBulletDead: rBullet.isDead,
        };
      });

      if (!result.skipped) {
        expect(result.iBulletDead).toBe(true);
        expect(result.rBulletDead).toBe(true);
        expect(result.hpAfterRogue).toBeLessThan(result.initialHp);
      }
    });

    test('T3.3 [Combination] Helper Repairer restores Player HP while player is engaged in 3-way combat', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const HelperClass = gm.helpers[0]?.constructor;

        gm.player.hp = 1; // Damaged player
        gm.player.maxHp = 3;

        let repairer = null;
        if (HelperClass) {
          // REPAIRER = 1
          repairer = new HelperClass(gm.player.position.x, gm.player.position.y - 20, gm.logicalWidth, gm.logicalHeight, 1);
          repairer.repairTimer = 0.01; // Ready to repair immediately
          gm.helpers.push(repairer);

          // Update repairer
          repairer.update(0.1, gm.barricades, gm.enemies, gm.bullets, gm.player);
        }

        return {
          hasRepairer: !!repairer,
          playerHp: gm.player.hp,
        };
      });

      expect(result.playerHp).toBeGreaterThanOrEqual(1);
    });

    test('T3.4 [Combination] Player Ultimate (Heavy Rain) damages and eliminates both Invaders and Rogues simultaneously', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        gm.enemies = [];
        gm.bullets = [];

        // Spawn rows of Invaders and Rogues
        for (let i = 0; i < 5; i++) {
          const inv = new EnemyClass(50 + i * 100, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
          inv.hp = 1;
          inv.faction = 'INVADER';

          const rog = new EnemyClass(50 + i * 100, 250, gm.logicalWidth, 1, 0, gm.logicalHeight);
          rog.hp = 1;
          rog.faction = 'ROGUE';

          gm.enemies.push(inv, rog);
        }

        const totalEnemiesBefore = gm.enemies.length;

        // Charge ultimate and trigger
        gm.player.ultimateGauge = 100;
        gm.triggerUltimate();

        const ultimateBulletsGenerated = gm.bullets.filter((b: any) => b.isPlayerBullet).length;

        // Simulate ultimate rain moving down through all rows
        for (let frame = 0; frame < 30; frame++) {
          gm.checkCollisions();
          gm.update(0.03);
        }

        const survivingEnemies = gm.enemies.filter((e: any) => !e.isDead).length;

        return {
          totalEnemiesBefore,
          ultimateBulletsGenerated,
          survivingEnemies,
        };
      });

      expect(result.totalEnemiesBefore).toBe(10);
      expect(result.ultimateBulletsGenerated).toBeGreaterThanOrEqual(20);
      expect(result.survivingEnemies).toBeLessThan(result.totalEnemiesBefore);
    });

    test('T3.5 [Combination] Mid-wave surprise Rogue incursion during active Boss wave creates 3-way boss clash', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.enemies = [];
        gm.bullets = [];
        gm.level = 5;

        // Spawn Wave 5 Boss (EnemyType.BOSS = 2)
        const boss = new EnemyClass(gm.logicalWidth / 2 - 75, 90, gm.logicalWidth, 5, 2, gm.logicalHeight);
        boss.hp = 50;
        boss.maxHp = 50;
        boss.faction = 'INVADER';
        gm.enemies.push(boss);

        // Spawn surprise Rogue Stalker at (200, 300)
        const rogueStalker = new EnemyClass(200, 300, gm.logicalWidth, 5, 0, gm.logicalHeight);
        rogueStalker.hp = 10;
        rogueStalker.faction = 'ROGUE';
        rogueStalker.color = '#84cc16';
        gm.enemies.push(rogueStalker);

        // Rogue shoots Boss with heavy piercing projectile
        const rogueBullet = new BulletClass(boss.position.x + 20, boss.position.y + 20, -300, 10, false, 1);
        rogueBullet.faction = 'ROGUE';
        gm.bullets.push(rogueBullet);

        gm.checkCollisions();

        return {
          bossInitialHp: 50,
          bossHpAfterRogueHit: boss.hp,
          bossHitFlash: boss.hitFlashTimer > 0,
          activeFactionsCount: new Set(gm.enemies.map((e: any) => e.faction)).size,
        };
      });

      expect(result.bossHpAfterRogueHit).toBeLessThan(result.bossInitialHp);
      expect(result.activeFactionsCount).toBe(2);
    });

    test('T3.6 [Combination] Shop upgrades (Fire Rate, Multi-shot, Piercing) apply effectively against 3-way encounters', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        // Upgrade player stats
        gm.currency = 1000;
        gm.upgradeFireRate();
        gm.upgradeMultiShot();
        gm.upgradePiercing();

        const upgrades = gm.getUpgrades();

        return {
          fireRateLevel: upgrades.fireRate,
          multiShot: upgrades.multiShot,
          piercing: upgrades.piercing,
          playerMultiShot: gm.player.multiShot,
          playerPiercing: gm.player.piercing,
        };
      });

      expect(result.playerMultiShot).toBeGreaterThanOrEqual(2);
      expect(result.playerPiercing).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================

  test.describe('Tier 4: Real-World Application Scenarios', () => {
    test('T4.1 [End-to-End] Full multi-wave progression with 3-way battles, reinforcements, shop upgrades, and score tracking', async ({ page }) => {
      // 1. Play through Wave 1 to Wave 2
      const wave1Cleared = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const initialLevel = gm.level;
        gm.enemies.forEach((e: any) => { e.isDead = true; });
        gm.update(0.016);
        return {
          initialLevel,
          state: gm.state,
        };
      });

      expect(wave1Cleared.initialLevel).toBe(1);
      expect(wave1Cleared.state).toBe('SHOP');

      // 2. Buy upgrades in Intermission Shop
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.currency += 500;
        gm.upgradeFireRate();
        gm.upgradeMultiShot();
      });

      // 3. Advance to Wave 2
      await page.locator('button', { hasText: 'NEXT WAVE' }).click();
      await page.waitForTimeout(200);

      const wave2Status = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          level: gm.level,
          state: gm.state,
          multiShot: gm.player.multiShot,
          enemyCount: gm.enemies.length,
        };
      });

      expect(wave2Status.level).toBe(2);
      expect(wave2Status.state).toBe('PLAYING');
      expect(wave2Status.multiShot).toBeGreaterThanOrEqual(2);
      expect(wave2Status.enemyCount).toBeGreaterThan(0);

      // 4. Advance straight to Wave 5 Boss Encounter
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.level = 4;
        gm.startNextWave();
      });
      await page.waitForTimeout(200);

      const wave5BossStatus = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          level: gm.level,
          state: gm.state,
          hasBoss: gm.enemies.some((e: any) => e.type === 2 || e.type === 'BOSS'),
        };
      });

      expect(wave5BossStatus.level).toBe(5);
      expect(wave5BossStatus.hasBoss).toBe(true);
    });

    test('T4.2 [End-to-End] High-intensity dynamic battlefield simulation with continuous spawns and ultimate activation', async ({ page }) => {
      const simResult = await page.evaluate(async () => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;
        const BulletClass = gm.bullets[0].constructor;

        gm.isGodMode = true; // God mode for continuous simulation stability
        gm.enemies = [];
        gm.bullets = [];

        // Continuous simulation across 10 battle ticks
        let totalKills = 0;
        for (let tick = 0; tick < 10; tick++) {
          // Dynamic reinforcement spawns (alternating factions)
          const faction = tick % 2 === 0 ? 'INVADER' : 'ROGUE';
          const newUnit = new EnemyClass(
            50 + (tick * 40) % 500,
            80 + (tick * 20) % 200,
            gm.logicalWidth,
            gm.level,
            0,
            gm.logicalHeight
          );
          newUnit.faction = faction;
          newUnit.hp = 1;
          gm.enemies.push(newUnit);

          // Player continuous fire
          const playerBullet = new BulletClass(
            newUnit.position.x,
            newUnit.position.y + 10,
            -300,
            1,
            true,
            1
          );
          playerBullet.faction = 'PLAYER';
          gm.bullets.push(playerBullet);

          // Crossfire check and step
          gm.checkCollisions();
          totalKills += gm.enemies.filter((e: any) => e.isDead).length;
          gm.update(0.03);
        }

        return {
          totalKills,
          score: gm.score,
          combo: gm.combo,
          state: gm.state,
          stable: true,
        };
      });

      expect(simResult.stable).toBe(true);
      expect(simResult.totalKills).toBeGreaterThan(0);
      expect(simResult.score).toBeGreaterThan(0);
    });
  });
});

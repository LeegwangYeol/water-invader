import { test, expect } from '@playwright/test';

/**
 * tests/tier5_adversarial_combat.spec.ts
 * 
 * Milestone M5: Tier 5 Adversarial Combat Hardening Suite
 * 
 * High-Intensity Combat Edge Cases:
 * 1. Extreme Bullet Storms (200+ multi-faction projectiles colliding simultaneously per tick without memory leaks or crash)
 * 2. Multi-Faction Piercing Collisions (High-piercing projectiles slicing through interleaved Invader & Rogue formations in single frames)
 * 3. Simultaneous Crossfire Annihilation (Multiple Invaders and Rogues eliminating each other in the exact same frame)
 * 4. Helper Drone Dynamic Retargeting (Helper Fighters and Tanks dynamically switching targets between Invader and Rogue entities under chaotic conditions)
 * 5. Boss Crossfire Incursions (Mid-wave Rogue incursions during active Boss waves verifying 3-way boss combat resolution)
 */

const setupGameContext = async (page: any) => {
  return await page.evaluate(() => {
    const gm = (window as any).gameManager;
    if (!gm) return { hasGM: false };

    // Ensure constructors are populated
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

test.describe('Tier 5 Adversarial Combat Hardening Suite (Milestone M5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await setupGameContext(page);
  });

  // =========================================================================
  // 1. EXTREME BULLET STORMS (200+ Projectiles)
  // =========================================================================

  test.describe('1. Extreme Bullet Storms & Particle Pooling', () => {
    test('T5.1 [BulletStorm] 300+ multi-faction projectiles in high-density crossfire execute stably over 100 frames without memory leaks or NaN corruption', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = (window as any).Bullet || gm.bullets[0].constructor;
        const FactionEnum = (window as any).Faction;

        gm.enemies = [];
        gm.bullets = [];
        gm.particles = [];

        // Spawn 100 Player bullets, 100 Invader bullets, 100 Rogue bullets (300 total)
        for (let i = 0; i < 100; i++) {
          // Player bullet travelling upward
          const pb = new BulletClass(20 + (i % 25) * 22, 500 + Math.floor(i / 25) * 30, -350, 1, true, 1);
          pb.faction = FactionEnum.PLAYER;
          
          // Invader bullet travelling downward
          const ib = new BulletClass(30 + (i % 25) * 22, 100 + Math.floor(i / 25) * 30, 250, 1, false, 1);
          ib.faction = FactionEnum.INVADER;
          if (i % 3 === 0) ib.isInterceptable = true; // 1/3 interceptable

          // Rogue bullet travelling diagonally
          const rb = new BulletClass(40 + (i % 25) * 22, 200 + Math.floor(i / 25) * 30, 200, 1, false, 1);
          rb.faction = FactionEnum.ROGUE;
          rb.velocity.x = (i % 2 === 0 ? 1 : -1) * 80;
          if (i % 2 === 0) rb.isInterceptable = true;

          gm.bullets.push(pb, ib, rb);
        }

        const initialBulletCount = gm.bullets.length;
        const frameHistory: any[] = [];
        let anyNan = false;

        // Run 100 consecutive frames of simulation
        for (let f = 0; f < 100; f++) {
          gm.update(0.016);

          // Verify no coordinates become NaN or infinite
          for (const b of gm.bullets) {
            if (!Number.isFinite(b.position.x) || !Number.isFinite(b.position.y) ||
                !Number.isFinite(b.velocity.x) || !Number.isFinite(b.velocity.y)) {
              anyNan = true;
            }
          }
          for (const p of gm.particles) {
            if (!Number.isFinite(p.position.x) || !Number.isFinite(p.position.y)) {
              anyNan = true;
            }
          }

          if (f % 20 === 0) {
            frameHistory.push({
              frame: f,
              bullets: gm.bullets.length,
              particles: gm.particles.length,
              particlePoolSize: gm.particlePool ? gm.particlePool.length : 0,
            });
          }
        }

        return {
          initialBulletCount,
          finalBulletCount: gm.bullets.length,
          particlesActive: gm.particles.length,
          particlePoolBounded: !gm.particlePool || gm.particlePool.length <= 500,
          anyNan,
          frameHistory,
        };
      });

      expect(result.initialBulletCount).toBe(300);
      expect(result.anyNan).toBe(false);
      expect(result.particlePoolBounded).toBe(true);
      // After 100 frames (~1.6s), bullets moving at 200-350 px/s have traveled 320-560px and many culled or intercepted
      expect(result.finalBulletCount).toBeLessThan(result.initialBulletCount);
    });

    test('T5.2 [BulletStorm] Massive 100-pair bullet interception cascade resolves with exact pair neutralization and no orphan bullets', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = (window as any).Bullet || gm.bullets[0].constructor;
        const FactionEnum = (window as any).Faction;

        gm.bullets = [];
        gm.enemies = [];
        gm.particles = [];

        // Spawn 100 pairs of colliding bullets directly overlapping
        for (let i = 0; i < 100; i++) {
          const x = 50 + (i % 20) * 25;
          const y = 100 + Math.floor(i / 20) * 80;

          // Bullet A: Invader Sniper bullet (interceptable)
          const bulletA = new BulletClass(x, y, 200, 1, false, 1);
          bulletA.faction = FactionEnum.INVADER;
          bulletA.isInterceptable = true;

          // Bullet B: Rogue Stalker bullet (interceptable)
          const bulletB = new BulletClass(x, y, -200, 1, false, 1);
          bulletB.faction = FactionEnum.ROGUE;
          bulletB.isInterceptable = true;

          gm.bullets.push(bulletA, bulletB);
        }

        const countBefore = gm.bullets.length;
        // Run collision check
        gm.checkCollisions();

        const deadCount = gm.bullets.filter((b: any) => b.isDead).length;
        const aliveCount = gm.bullets.filter((b: any) => !b.isDead).length;

        // Cleanup dead entities as in update()
        gm.bullets = gm.bullets.filter((b: any) => !b.isDead);

        return {
          countBefore,
          deadCount,
          aliveCount,
          countAfterCleanup: gm.bullets.length,
          particlesGenerated: gm.particles.length,
        };
      });

      expect(result.countBefore).toBe(200);
      expect(result.deadCount).toBe(200);
      expect(result.aliveCount).toBe(0);
      expect(result.countAfterCleanup).toBe(0);
      expect(result.particlesGenerated).toBeGreaterThanOrEqual(100);
    });
  });

  // =========================================================================
  // 2. MULTI-FACTION PIERCING COLLISIONS
  // =========================================================================

  test.describe('2. Multi-Faction Piercing Collisions', () => {
    test('T5.3 [Piercing] High-piercing (piercing=10) projectile cleanly slices interleaved Invader & Rogue formations with exactly 1 hit per entity', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        const BulletClass = (window as any).Bullet || gm.bullets[0].constructor;
        const FactionEnum = (window as any).Faction;

        gm.enemies = [];
        gm.bullets = [];

        // Spawn 10 interleaved enemies along Y axis (5 Invaders, 5 Rogues)
        // Y positions: 100, 140, 180, 220, 260, 300, 340, 380, 420, 460
        const enemiesList: any[] = [];
        for (let i = 0; i < 10; i++) {
          const isInvader = i % 2 === 0;
          const e = new EnemyClass(200, 100 + i * 40, gm.logicalWidth, 1, 0, gm.logicalHeight);
          e.faction = isInvader ? FactionEnum.INVADER : FactionEnum.ROGUE;
          e.hp = 10;
          e.maxHp = 10;
          e.size = { width: 40, height: 30 };
          enemiesList.push(e);
          gm.enemies.push(e);
        }

        // Fire a Player bullet with piercing = 10 from bottom (Y=520) moving upwards (-500 px/s) through all 10 enemies
        const bullet = new BulletClass(215, 520, -500, 2, true, 10);
        bullet.faction = FactionEnum.PLAYER;
        gm.bullets.push(bullet);

        // Simulate 70 frames of upward traversal (~1.12s -> moves 560px from Y=520 to Y=-40)
        for (let f = 0; f < 70; f++) {
          bullet.position.y += bullet.velocity.y * 0.016;
          gm.checkCollisions();
        }

        return {
          totalEnemies: enemiesList.length,
          enemiesHp: enemiesList.map(e => e.hp),
          finalPiercing: bullet.piercing,
          bulletIsDead: bullet.isDead,
          hitEntitiesSize: bullet.hitEntities.size,
        };
      });

      expect(result.totalEnemies).toBe(10);
      // Every single interleaved enemy (both Invader and Rogue) must be hit exactly ONCE (10 HP - 2 damage = 8 HP)
      for (let i = 0; i < 10; i++) {
        expect(result.enemiesHp[i]).toBe(8);
      }
      expect(result.hitEntitiesSize).toBe(10);
      expect(result.finalPiercing).toBe(0);
      expect(result.bulletIsDead).toBe(true);
    });

    test('T5.4 [Piercing] Rogue Mech piercing bullet damages Invaders & ignores friendly Rogues with exact charge conservation', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        const BulletClass = (window as any).Bullet || gm.bullets[0].constructor;
        const FactionEnum = (window as any).Faction;

        gm.enemies = [];
        gm.bullets = [];

        // Lineup along Y axis:
        // Y=150: Invader 1 (Hostile to Rogue) -> Takes 2 damage, piercing: 3 -> 2
        // Y=220: Rogue Drone (Friendly to Rogue) -> IMMUNE, piercing: stays 2
        // Y=290: Invader 2 (Hostile to Rogue) -> Takes 2 damage, piercing: 2 -> 1
        // Y=360: Invader 3 (Hostile to Rogue) -> Takes 2 damage, piercing: 1 -> 0 (bullet dies)

        const invader1 = new EnemyClass(200, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader1.faction = FactionEnum.INVADER;
        invader1.hp = 5;

        const rogueDrone = new EnemyClass(200, 220, gm.logicalWidth, 1, 7, gm.logicalHeight); // ROGUE_DRONE
        rogueDrone.faction = FactionEnum.ROGUE;
        rogueDrone.hp = 5;

        const invader2 = new EnemyClass(200, 290, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader2.faction = FactionEnum.INVADER;
        invader2.hp = 5;

        const invader3 = new EnemyClass(200, 360, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader3.faction = FactionEnum.INVADER;
        invader3.hp = 5;

        gm.enemies = [invader1, rogueDrone, invader2, invader3];

        // Rogue Mech bullet with piercing = 3, damage = 2 moving downwards from Y=100 (+400 px/s)
        const rogueBullet = new BulletClass(215, 100, 400, 2, false, 3);
        rogueBullet.faction = FactionEnum.ROGUE;
        gm.bullets.push(rogueBullet);

        // Run traversal downwards
        for (let f = 0; f < 70; f++) {
          rogueBullet.position.y += rogueBullet.velocity.y * 0.016;
          gm.checkCollisions();
        }

        return {
          invader1Hp: invader1.hp,
          rogueDroneHp: rogueDrone.hp,
          invader2Hp: invader2.hp,
          invader3Hp: invader3.hp,
          finalPiercing: rogueBullet.piercing,
          bulletIsDead: rogueBullet.isDead,
          hitEntitiesSize: rogueBullet.hitEntities.size,
        };
      });

      // Invader 1 damaged (-2)
      expect(result.invader1Hp).toBe(3);
      // Rogue Drone IMMUNE (friendly fire immunity)
      expect(result.rogueDroneHp).toBe(5);
      // Invader 2 damaged (-2)
      expect(result.invader2Hp).toBe(3);
      // Invader 3 damaged (-2)
      expect(result.invader3Hp).toBe(3);
      // 3 hostile enemies hit -> piercing reduced from 3 to 0 -> bullet dies
      expect(result.hitEntitiesSize).toBe(3);
      expect(result.finalPiercing).toBe(0);
      expect(result.bulletIsDead).toBe(true);
    });
  });

  // =========================================================================
  // 3. SIMULTANEOUS CROSSFIRE ANNIHILATION
  // =========================================================================

  test.describe('3. Simultaneous Crossfire Annihilation & Entity List Integrity', () => {
    test('T5.5 [Annihilation] 20-entity simultaneous crossfire elimination in a single frame maintains array integrity, grants combo & rewards, and transitions to shop', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        const FactionEnum = (window as any).Faction;

        gm.enemies = [];
        gm.bullets = [];
        gm.score = 0;
        gm.currency = 0;
        gm.combo = 0;
        gm.state = 'PLAYING';
        gm.warningTimer = 0;
        gm.pendingReinforcement = null;

        // Spawn 10 pairs of directly colliding Invader + Rogue (20 entities total, 1 HP each)
        for (let i = 0; i < 10; i++) {
          const x = 50 + (i % 5) * 100;
          const y = 100 + Math.floor(i / 5) * 80;

          const invader = new EnemyClass(x, y, gm.logicalWidth, 1, 0, gm.logicalHeight);
          invader.faction = FactionEnum.INVADER;
          invader.hp = 1;

          const rogue = new EnemyClass(x, y, gm.logicalWidth, 1, 7, gm.logicalHeight); // ROGUE_DRONE
          rogue.faction = FactionEnum.ROGUE;
          rogue.hp = 1;

          gm.enemies.push(invader, rogue);
        }

        const countBefore = gm.enemies.length;
        const initialScore = gm.score;
        const initialCurrency = gm.currency;

        // Execute 1 single frame collision & update
        gm.checkCollisions();
        const allDeadInFrame = gm.enemies.every((e: any) => e.isDead);

        // Update cleans up array and checks wave clear
        gm.update(0.016);

        return {
          countBefore,
          allDeadInFrame,
          finalEnemyCount: gm.enemies.length,
          finalScore: gm.score,
          finalCurrency: gm.currency,
          finalCombo: gm.combo,
          gameStateAfter: gm.state,
          scoreIncreased: gm.score > initialScore,
          currencyIncreased: gm.currency > initialCurrency,
        };
      });

      expect(result.countBefore).toBe(20);
      expect(result.allDeadInFrame).toBe(true);
      expect(result.finalEnemyCount).toBe(0);
      expect(result.finalCombo).toBe(20); // 20 kills registered in combo
      expect(result.scoreIncreased).toBe(true);
      expect(result.currencyIncreased).toBe(true);
      expect(result.gameStateAfter).toBe('SHOP');
    });

    test('T5.6 [Annihilation] Symmetrical crossfire bullet trade eliminates both formations simultaneously with proper reward attribution', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        const BulletClass = (window as any).Bullet || gm.bullets[0].constructor;
        const FactionEnum = (window as any).Faction;

        gm.enemies = [];
        gm.bullets = [];
        gm.score = 0;
        gm.currency = 0;
        gm.combo = 0;

        // 5 Invaders on left (X=100), 5 Rogues on right (X=300)
        const invaders: any[] = [];
        const rogues: any[] = [];
        for (let i = 0; i < 5; i++) {
          const inv = new EnemyClass(100, 100 + i * 50, gm.logicalWidth, 1, 0, gm.logicalHeight);
          inv.faction = FactionEnum.INVADER;
          inv.hp = 1;
          invaders.push(inv);

          const rog = new EnemyClass(300, 100 + i * 50, gm.logicalWidth, 1, 7, gm.logicalHeight);
          rog.faction = FactionEnum.ROGUE;
          rog.hp = 1;
          rogues.push(rog);

          // Lethal Rogue bullet targeting Invader
          const rogueBullet = new BulletClass(105, 100 + i * 50, 0, 2, false, 1);
          rogueBullet.faction = FactionEnum.ROGUE;
          rogueBullet.position.x = 105;
          rogueBullet.position.y = 100 + i * 50;

          // Lethal Invader bullet targeting Rogue
          const invBullet = new BulletClass(305, 100 + i * 50, 0, 2, false, 1);
          invBullet.faction = FactionEnum.INVADER;
          invBullet.position.x = 305;
          invBullet.position.y = 100 + i * 50;

          gm.bullets.push(rogueBullet, invBullet);
        }

        gm.enemies = [...invaders, ...rogues];

        // Run collision check in single tick
        gm.checkCollisions();

        const allInvadersDead = invaders.every(e => e.isDead);
        const allRoguesDead = rogues.every(e => e.isDead);
        const allBulletsDead = gm.bullets.every((b: any) => b.isDead);

        // Run update cleanup
        gm.update(0.016);

        return {
          allInvadersDead,
          allRoguesDead,
          allBulletsDead,
          remainingEnemies: gm.enemies.length,
          remainingBullets: gm.bullets.length,
          combo: gm.combo,
          score: gm.score,
        };
      });

      expect(result.allInvadersDead).toBe(true);
      expect(result.allRoguesDead).toBe(true);
      expect(result.allBulletsDead).toBe(true);
      expect(result.remainingEnemies).toBe(0);
      expect(result.remainingBullets).toBe(0);
      expect(result.combo).toBe(10);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4. HELPER DRONE DYNAMIC RETARGETING
  // =========================================================================

  test.describe('4. Helper Drone Dynamic Retargeting & Interception', () => {
    test('T5.7 [HelperAI] Helper Fighter dynamically retargets across interleaved Invader/Rogue deaths in succession without getting stuck', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        const HelperClass = (window as any).Helper || gm.helpers[0]?.constructor;
        const FactionEnum = (window as any).Faction;

        gm.enemies = [];
        gm.helpers = [];
        gm.bullets = [];

        // Helper Fighter (HelperType.FIGHTER = 0)
        const fighter = new HelperClass(300, 700, gm.logicalWidth, gm.logicalHeight, 0);
        fighter.faction = FactionEnum.PLAYER;
        gm.helpers = [fighter];

        // Staggered enemies:
        // E0: Invader at Y=100, X=50
        // E1: Rogue at Y=200, X=150
        // E2: Invader at Y=300, X=250
        // E3: Rogue at Y=400, X=450  <-- Lowest hostile initially
        const e0 = new EnemyClass(50, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
        e0.faction = FactionEnum.INVADER;
        const e1 = new EnemyClass(150, 200, gm.logicalWidth, 1, 7, gm.logicalHeight);
        e1.faction = FactionEnum.ROGUE;
        const e2 = new EnemyClass(250, 300, gm.logicalWidth, 1, 0, gm.logicalHeight);
        e2.faction = FactionEnum.INVADER;
        const e3 = new EnemyClass(450, 400, gm.logicalWidth, 1, 7, gm.logicalHeight);
        e3.faction = FactionEnum.ROGUE;

        gm.enemies = [e0, e1, e2, e3];

        const targetLog: any[] = [];

        // Step 1: Initial state -> should target E3 (lowest hostile, Y=400)
        fighter.update(0.016, gm.barricades, gm.enemies, gm.bullets);
        const target3X = e3.position.x + e3.size.width / 2 - fighter.size.width / 2;
        targetLog.push({ step: 1, targetX: fighter.targetX, expectedX: target3X, matched: Math.abs(fighter.targetX - target3X) < 1 });

        // Step 2: Kill E3 -> should dynamically retarget E2 (Invader, Y=300)
        e3.isDead = true;
        fighter.update(0.016, gm.barricades, gm.enemies, gm.bullets);
        const target2X = e2.position.x + e2.size.width / 2 - fighter.size.width / 2;
        targetLog.push({ step: 2, targetX: fighter.targetX, expectedX: target2X, matched: Math.abs(fighter.targetX - target2X) < 1 });

        // Step 3: Kill E2 -> should dynamically retarget E1 (Rogue, Y=200)
        e2.isDead = true;
        fighter.update(0.016, gm.barricades, gm.enemies, gm.bullets);
        const target1X = e1.position.x + e1.size.width / 2 - fighter.size.width / 2;
        targetLog.push({ step: 3, targetX: fighter.targetX, expectedX: target1X, matched: Math.abs(fighter.targetX - target1X) < 1 });

        // Step 4: Kill E1 -> should dynamically retarget E0 (Invader, Y=100)
        e1.isDead = true;
        fighter.update(0.016, gm.barricades, gm.enemies, gm.bullets);
        const target0X = e0.position.x + e0.size.width / 2 - fighter.size.width / 2;
        targetLog.push({ step: 4, targetX: fighter.targetX, expectedX: target0X, matched: Math.abs(fighter.targetX - target0X) < 1 });

        // Step 5: Kill E0 (all dead) -> should smoothly return to center
        e0.isDead = true;
        fighter.update(0.016, gm.barricades, gm.enemies, gm.bullets);
        const centerX = gm.logicalWidth / 2 - fighter.size.width / 2;
        targetLog.push({ step: 5, targetX: fighter.targetX, expectedX: centerX, matched: Math.abs(fighter.targetX - centerX) < 1 });

        return {
          targetLog,
          allMatched: targetLog.every(t => t.matched),
        };
      });

      expect(result.allMatched).toBe(true);
    });

    test('T5.8 [HelperAI] Helper Tank dynamically tracks and intercepts lowest incoming hostile bullets while ignoring friendly fire', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = (window as any).Bullet || gm.bullets[0].constructor;
        const HelperClass = (window as any).Helper || gm.helpers[0]?.constructor;
        const FactionEnum = (window as any).Faction;

        gm.enemies = [];
        gm.helpers = [];
        gm.bullets = [];

        // Helper Tank (HelperType.TANK = 2) at Y=700
        const tank = new HelperClass(300, 700, gm.logicalWidth, gm.logicalHeight, 2);
        tank.faction = FactionEnum.PLAYER;
        gm.helpers = [tank];

        // 1. Friendly player bullet at Y=650 -> Should be IGNORED
        const playerBullet = new BulletClass(100, 650, -300, 1, true);
        playerBullet.faction = FactionEnum.PLAYER;

        // 2. Invader bullet at Y=400, X=150
        const invBullet = new BulletClass(150, 400, 200, 1, false);
        invBullet.faction = FactionEnum.INVADER;

        // 3. Rogue bullet at Y=550, X=450 (Lowest hostile bullet)
        const rogueBullet = new BulletClass(450, 550, 200, 1, false);
        rogueBullet.faction = FactionEnum.ROGUE;

        gm.bullets = [playerBullet, invBullet, rogueBullet];

        const steps: any[] = [];

        // Step 1: Tank updates -> should target Rogue bullet at X=450
        tank.update(0.016, gm.barricades, gm.enemies, gm.bullets);
        const expectedRogueTargetX = rogueBullet.position.x - tank.size.width / 2;
        steps.push({ step: 1, matched: Math.abs(tank.targetX - expectedRogueTargetX) < 1 });

        // Step 2: Intercept Rogue bullet (marked dead) -> Tank should retarget Invader bullet at X=150
        rogueBullet.isDead = true;
        tank.update(0.016, gm.barricades, gm.enemies, gm.bullets);
        const expectedInvTargetX = invBullet.position.x - tank.size.width / 2;
        steps.push({ step: 2, matched: Math.abs(tank.targetX - expectedInvTargetX) < 1 });

        // Step 3: Intercept Invader bullet (marked dead) -> Only Player bullet remains -> Tank centers
        invBullet.isDead = true;
        tank.update(0.016, gm.barricades, gm.enemies, gm.bullets);
        const expectedCenterX = gm.logicalWidth / 2 - tank.size.width / 2;
        steps.push({ step: 3, matched: Math.abs(tank.targetX - expectedCenterX) < 1 });

        return {
          steps,
          allPassed: steps.every(s => s.matched),
        };
      });

      expect(result.allPassed).toBe(true);
    });
  });

  // =========================================================================
  // 5. BOSS CROSSFIRE INCURSIONS
  // =========================================================================

  test.describe('5. Boss Crossfire Incursions & 3-Way Boss Resolution', () => {
    test('T5.9 [BossCrossfire] Mid-wave Rogue incursion during Boss wave creates 3-way boss clash, handles Rogue-on-Boss defeat, and prevents premature wave clear', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        const BulletClass = (window as any).Bullet || gm.bullets[0].constructor;
        const FactionEnum = (window as any).Faction;

        gm.level = 5;
        gm.enemies = [];
        gm.bullets = [];
        gm.state = 'PLAYING';
        gm.score = 0;
        gm.currency = 0;
        gm.player.ultimateGauge = 0;

        // 1. Spawn Bio-Mech Titan Boss (EnemyType.BOSS = 2, Faction.INVADER)
        const boss = new EnemyClass(gm.logicalWidth / 2 - 75, 90, gm.logicalWidth, 5, 2, gm.logicalHeight);
        boss.faction = FactionEnum.INVADER;
        boss.hp = 10;
        boss.maxHp = 50;
        gm.enemies.push(boss);

        // 2. Spawn Mid-Wave Rogue Incursion (Rogue Stalker + Rogue Mech)
        const rogueStalker = new EnemyClass(50, 150, gm.logicalWidth, 5, 8, gm.logicalHeight); // ROGUE_STALKER
        rogueStalker.faction = FactionEnum.ROGUE;
        rogueStalker.hp = 5;

        const rogueMech = new EnemyClass(450, 150, gm.logicalWidth, 5, 9, gm.logicalHeight); // ROGUE_MECH
        rogueMech.faction = FactionEnum.ROGUE;
        rogueMech.hp = 10;

        gm.enemies.push(rogueStalker, rogueMech);

        const initialInvaderCount = gm.enemies.filter((e: any) => !e.isDead && e.faction === FactionEnum.INVADER).length;
        const initialRogueCount = gm.enemies.filter((e: any) => !e.isDead && e.faction === FactionEnum.ROGUE).length;

        // 3. Rogue Mech fires heavy plasma bullet at Boss
        const rogueBossBullet = new BulletClass(
          boss.position.x + boss.size.width / 2,
          boss.position.y + boss.size.height / 2,
          -200,
          10, // Lethal damage to boss
          false,
          2
        );
        rogueBossBullet.faction = FactionEnum.ROGUE;
        gm.bullets.push(rogueBossBullet);

        // Execute collision
        gm.checkCollisions();

        const bossIsDead = boss.isDead;
        const bossKilledScore = gm.score;
        const bossKilledCurrency = gm.currency;
        const bossKilledUltimate = gm.player.ultimateGauge;

        // Boss is dead, but Rogues are still alive!
        gm.update(0.016);
        const stateWhileRoguesAlive = gm.state; // MUST remain 'PLAYING'
        const roguesStillActive = gm.enemies.filter((e: any) => !e.isDead && e.faction === FactionEnum.ROGUE).length;

        // 4. Eliminate remaining Rogues
        for (const e of gm.enemies) {
          e.isDead = true;
        }

        gm.update(0.016);
        const stateAfterAllDead = gm.state; // Transitions to 'SHOP'

        return {
          initialInvaderCount,
          initialRogueCount,
          bossIsDead,
          bossKilledScore,
          bossKilledCurrency,
          bossKilledUltimate,
          stateWhileRoguesAlive,
          roguesStillActive,
          stateAfterAllDead,
        };
      });

      expect(result.initialInvaderCount).toBe(1);
      expect(result.initialRogueCount).toBe(2);
      expect(result.bossIsDead).toBe(true);
      // Boss crossfire kill grants 1500 base score, 75 currency, +2.0 ultimate gauge
      expect(result.bossKilledScore).toBeGreaterThanOrEqual(1500);
      expect(result.bossKilledCurrency).toBeGreaterThanOrEqual(75);
      expect(result.bossKilledUltimate).toBeGreaterThanOrEqual(2.0);
      // Must NOT clear wave prematurely while Rogues are active
      expect(result.stateWhileRoguesAlive).toBe('PLAYING');
      expect(result.roguesStillActive).toBe(2);
      // Clears to SHOP only when Rogues are also defeated
      expect(result.stateAfterAllDead).toBe('SHOP');
    });

    test('T5.10 [BossCrossfire] Boss + Splitter + Rogue crossfire chain reaction creates nested entities without index corruption', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        const BulletClass = (window as any).Bullet || gm.bullets[0].constructor;
        const FactionEnum = (window as any).Faction;

        gm.enemies = [];
        gm.bullets = [];

        // 1. Boss (Faction.INVADER)
        const boss = new EnemyClass(200, 90, gm.logicalWidth, 5, 2, gm.logicalHeight);
        boss.faction = FactionEnum.INVADER;
        boss.hp = 20;

        // 2. Splitter Invader (EnemyType.SPLITTER = 6, Faction.INVADER)
        const splitter = new EnemyClass(150, 250, gm.logicalWidth, 1, 6, gm.logicalHeight);
        splitter.faction = FactionEnum.INVADER;
        splitter.hp = 1;

        // 3. Rogue Drone (Faction.ROGUE)
        const rogue = new EnemyClass(350, 250, gm.logicalWidth, 1, 7, gm.logicalHeight);
        rogue.faction = FactionEnum.ROGUE;
        rogue.hp = 5;

        gm.enemies = [boss, splitter, rogue];

        // Rogue bullet eliminates Splitter -> triggers Splitter mini-enemy spawn inside checkCollisions()
        const rogueBullet = new BulletClass(155, 255, 0, 5, false, 1);
        rogueBullet.faction = FactionEnum.ROGUE;
        gm.bullets.push(rogueBullet);

        // Execute collision
        gm.checkCollisions();

        const splitterDead = splitter.isDead;
        const miniEnemiesSpawned = gm.enemies.filter((e: any) => e.type === 0 && e.size.width === 20).length;

        // Execute 1 frame of update to clean up dead Splitter
        gm.update(0.016);

        const activeEnemiesAfterCleanup = gm.enemies.filter((e: any) => !e.isDead);
        const invaderCount = activeEnemiesAfterCleanup.filter((e: any) => e.faction === FactionEnum.INVADER).length;
        const rogueCount = activeEnemiesAfterCleanup.filter((e: any) => e.faction === FactionEnum.ROGUE).length;

        return {
          splitterDead,
          miniEnemiesSpawned,
          activeEnemyCount: activeEnemiesAfterCleanup.length,
          invaderCount,
          rogueCount,
        };
      });

      expect(result.splitterDead).toBe(true);
      expect(result.miniEnemiesSpawned).toBe(2);
      // Boss (1) + Mini-Invaders (2) + Rogue (1) = 4 active enemies total
      expect(result.activeEnemyCount).toBe(4);
      // 3 Invaders (1 Boss + 2 Mini) and 1 Rogue
      expect(result.invaderCount).toBe(3);
      expect(result.rogueCount).toBe(1);
    });
  });
});

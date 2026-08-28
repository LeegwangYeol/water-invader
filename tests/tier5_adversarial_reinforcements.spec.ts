import { test, expect } from '@playwright/test';

/**
 * tests/tier5_adversarial_reinforcements.spec.ts
 * 
 * Milestone M5: Tier 5 Adversarial Reinforcement & Wave Pacing Stress Testing
 * 
 * Target Domains:
 * 1. Rapid Sequential Incursions: Rapid-firing multiple dynamic reinforcements
 *    ('FLANK', 'SPEARHEAD', 'ROGUE_INCURSION', '3WAY_CLASH') in tight intervals
 *    without corrupting enemy lists, dropping entities, or causing state desync.
 * 2. Canvas Boundary Edge Clamping: High-speed diagonal, zigzag, and flank reinforcement
 *    trajectories strictly confined within logical canvas bounds (0 <= x <= logicalWidth - width, 0 <= y <= logicalHeight).
 * 3. Zero-Hostile & Queued Reinforcement Wave Clear Edge Cases: Verifying that wave clear
 *    cannot prematurely trigger if a reinforcement warning is active or pending.
 * 4. Shop Transition & Intermission Integrity: Transitioning into Shop and spawning Wave N+1
 *    correctly cleans up residual incursion timers and resets pacing variables.
 */

// Helper to ensure game context is ready
const setupGameContext = async (page: any) => {
  return await page.evaluate(() => {
    const gm = (window as any).gameManager;
    if (gm && gm.bullets.length === 0 && gm.player) {
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
      logicalWidth: gm?.logicalWidth || 600,
      logicalHeight: gm?.logicalHeight || 800,
    };
  });
};

test.describe('Tier 5 Adversarial Reinforcement & Wave Pacing Stress Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await setupGameContext(page);
  });

  // =========================================================================
  // 1. RAPID SEQUENTIAL INCURSIONS
  // =========================================================================
  test.describe('1. Rapid Sequential Incursions & List Integrity', () => {
    test('1.1 Burst-firing 20 dynamic incursions in a single frame maintains entity list integrity', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = []; // Clear initial wave

        const incursionTypes = ['FLANK', 'SPEARHEAD', 'ROGUE_INCURSION', '3WAY_CLASH'] as const;
        const spawnedCounts: Record<string, number> = { FLANK: 0, SPEARHEAD: 0, ROGUE_INCURSION: 0, '3WAY_CLASH': 0 };

        // Burst fire 20 incursions (5 of each type)
        for (let i = 0; i < 20; i++) {
          const type = incursionTypes[i % incursionTypes.length];
          const beforeCount = gm.enemies.length;
          gm.spawnDynamicReinforcement(type);
          const afterCount = gm.enemies.length;
          spawnedCounts[type] += (afterCount - beforeCount);
        }

        const totalEnemies = gm.enemies.length;

        // Verify entity properties across all spawned enemies
        let allValid = true;
        let invaderCount = 0;
        let rogueCount = 0;
        let nonFiniteCount = 0;
        let outOfBoundsCount = 0;

        for (const e of gm.enemies) {
          if (!Number.isFinite(e.position.x) || !Number.isFinite(e.position.y)) nonFiniteCount++;
          if (!Number.isFinite(e.hp) || e.hp <= 0) allValid = false;
          if (!Number.isFinite(e.size.width) || !Number.isFinite(e.size.height)) allValid = false;
          if (e.position.x < 0 || e.position.x + e.size.width > gm.logicalWidth + 1) outOfBoundsCount++;
          if (e.position.y < 0 || e.position.y + e.size.height > gm.logicalHeight + 1) outOfBoundsCount++;

          if (e.faction === 'INVADER') invaderCount++;
          else if (e.faction === 'ROGUE') rogueCount++;
          else allValid = false;
        }

        return {
          totalEnemies,
          invaderCount,
          rogueCount,
          nonFiniteCount,
          outOfBoundsCount,
          allValid,
          spawnedCounts,
        };
      });

      expect(result.totalEnemies).toBeGreaterThan(40);
      expect(result.nonFiniteCount).toBe(0);
      expect(result.outOfBoundsCount).toBe(0);
      expect(result.invaderCount).toBeGreaterThan(0);
      expect(result.rogueCount).toBeGreaterThan(0);
      expect(result.allValid).toBe(true);
    });

    test('1.2 Rapid sequential incursions interleaved with game loop updates (60 frames) execute without desync', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.bullets = [];

        const incursionTypes = ['FLANK', 'SPEARHEAD', 'ROGUE_INCURSION', '3WAY_CLASH'] as const;
        let errorOccurred: string | null = null;

        try {
          for (let frame = 0; frame < 60; frame++) {
            // Trigger incursion every 3 frames
            if (frame % 3 === 0) {
              const type = incursionTypes[(frame / 3) % incursionTypes.length];
              gm.spawnDynamicReinforcement(type);
            }

            // Run simulation step
            gm.update(0.016);
            gm.checkCollisions();

            // Sanity check entity lists
            for (let i = 0; i < gm.enemies.length; i++) {
              const e = gm.enemies[i];
              if (!e || typeof e.update !== 'function' || !Number.isFinite(e.position.x)) {
                throw new Error(`Corrupted enemy detected at frame ${frame}, index ${i}`);
              }
            }
          }
        } catch (err: any) {
          errorOccurred = err?.message || String(err);
        }

        return {
          errorOccurred,
          survivingEnemies: gm.enemies.length,
          activeBullets: gm.bullets.length,
          gameState: gm.state,
        };
      });

      expect(result.errorOccurred).toBeNull();
      expect(result.survivingEnemies).toBeGreaterThan(0);
      expect(result.gameState).toBe('PLAYING');
    });

    test('1.3 High-density multi-faction clash: 80+ enemies and 150+ crossfire bullets resolve stably', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
        gm.enemies = [];
        gm.bullets = [];

        // Spawn massive reinforcement swarm
        for (let i = 0; i < 15; i++) {
          gm.spawnDynamicReinforcement('3WAY_CLASH');
          gm.spawnDynamicReinforcement('FLANK');
        }

        const initialEnemyCount = gm.enemies.length;

        // Spawn 150 crossfire bullets in the dense conflict zone
        for (let i = 0; i < 50; i++) {
          // Player bullets
          const pb = new BulletClass(100 + (i * 8) % 400, 300 + (i * 5) % 200, -350, 2, true, 1);
          pb.faction = 'PLAYER';
          // Invader bullets
          const ib = new BulletClass(120 + (i * 7) % 400, 200 + (i * 4) % 200, 250, 1, false, 1);
          ib.faction = 'INVADER';
          // Rogue bullets
          const rb = new BulletClass(80 + (i * 9) % 400, 250 + (i * 6) % 200, 300, 1, false, 1);
          rb.faction = 'ROGUE';

          gm.bullets.push(pb, ib, rb);
        }

        const initialBulletCount = gm.bullets.length;

        // Execute collision resolution and updates
        gm.checkCollisions();
        gm.update(0.016);

        return {
          initialEnemyCount,
          initialBulletCount,
          survivingEnemies: gm.enemies.length,
          survivingBullets: gm.bullets.length,
          score: gm.score,
          isStatePlaying: gm.state === 'PLAYING' || gm.state === 'SHOP',
        };
      });

      expect(result.initialEnemyCount).toBeGreaterThanOrEqual(60);
      expect(result.initialBulletCount).toBe(150);
      expect(result.survivingEnemies).toBeLessThanOrEqual(result.initialEnemyCount);
      expect(result.isStatePlaying).toBe(true);
    });

    test('1.4 Dynamic incursion director handles arbitrary/unknown incursion types with fallback gracefully', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];

        // Call with unrecognized type or undefined
        gm.spawnDynamicReinforcement('UNKNOWN_FORMATION' as any);
        const countAfterUnknown = gm.enemies.length;

        gm.spawnDynamicReinforcement();
        const countAfterRandom = gm.enemies.length;

        return {
          countAfterUnknown,
          countAfterRandom,
          warningMessage: gm.warningMessage,
          warningTimer: gm.warningTimer,
        };
      });

      expect(result.countAfterRandom).toBeGreaterThan(0);
      expect(result.warningTimer).toBeGreaterThan(0);
      expect(typeof result.warningMessage).toBe('string');
    });
  });

  // =========================================================================
  // 2. CANVAS BOUNDARY EDGE CLAMPING & EXTREME KINEMATICS
  // =========================================================================
  test.describe('2. Canvas Boundary Edge Clamping & Kinematics', () => {
    test('2.1 Extreme coordinate spawns (negative/oversized) are strictly clamped by Enemy constructor', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;

        const testCases = [
          { x: -500, y: -200, type: 0 }, // Normal
          { x: 1500, y: 2000, type: 1 }, // Zigzag
          { x: -100, y: 50, type: 7 },   // Rogue Drone
          { x: 800, y: 100, type: 8 },   // Rogue Stalker
          { x: 600, y: 900, type: 9 },   // Rogue Mech
          { x: -50, y: 100, type: 2 },   // Boss
        ];

        const clampedResults = testCases.map(tc => {
          const enemy = new EnemyClass(tc.x, tc.y, gm.logicalWidth, 1, tc.type, gm.logicalHeight);
          return {
            type: tc.type,
            x: enemy.position.x,
            y: enemy.position.y,
            width: enemy.size.width,
            height: enemy.size.height,
            isWithinX: enemy.position.x >= 0 && enemy.position.x + enemy.size.width <= gm.logicalWidth,
            isWithinY: enemy.position.y >= 0 && enemy.position.y + enemy.size.height <= gm.logicalHeight,
          };
        });

        return {
          clampedResults,
          allWithinBounds: clampedResults.every(r => r.isWithinX && r.isWithinY),
        };
      });

      expect(result.allWithinBounds).toBe(true);
      for (const res of result.clampedResults) {
        expect(res.isWithinX).toBe(true);
        expect(res.isWithinY).toBe(true);
      }
    });

    test('2.2 High-speed Flank incursion entities maintain strict boundary confinement over 200 frames', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];

        // High level flank (level 10 -> high speedX)
        gm.level = 10;
        gm.spawnDynamicReinforcement('FLANK');

        let boundaryViolations = 0;
        let nonFiniteErrors = 0;

        for (let frame = 0; frame < 200; frame++) {
          // Large delta time to test collision bounce robustness
          const dt = 0.033;
          for (const e of gm.enemies) {
            e.update(dt, 1.5, [], { x: 300, y: 700 }, gm.enemies);
            if (!Number.isFinite(e.position.x) || !Number.isFinite(e.position.y)) {
              nonFiniteErrors++;
            }
            if (e.position.x < 0 || e.position.x + e.size.width > gm.logicalWidth + 0.001) {
              boundaryViolations++;
            }
            if (e.position.y < 0 || e.position.y + e.size.height > gm.logicalHeight + 0.001) {
              boundaryViolations++;
            }
          }
        }

        return {
          enemyCount: gm.enemies.length,
          boundaryViolations,
          nonFiniteErrors,
        };
      });

      expect(result.enemyCount).toBeGreaterThan(0);
      expect(result.nonFiniteErrors).toBe(0);
      expect(result.boundaryViolations).toBe(0);
    });

    test('2.3 Diver dive trajectory to bottom boundary executes safely and triggers defense breach', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        gm.enemies = [];
        gm.isGodMode = true; // prevent game over during test

        // Spawn Diver directly above player
        const diver = new EnemyClass(300, 100, gm.logicalWidth, 1, 4, gm.logicalHeight); // DIVER = 4
        gm.enemies.push(diver);

        // Update Diver with player directly below at (300, 740)
        let diverDiving = false;
        let reachedBottom = false;

        for (let frame = 0; frame < 200; frame++) {
          gm.update(0.016);
          if (diver.isDiving) diverDiving = true;
          if (gm.enemies.length === 0 || diver.isDead) {
            reachedBottom = true;
            break;
          }
        }

        return {
          diverDiving,
          reachedBottom,
          enemiesCleanedUp: gm.enemies.length === 0,
        };
      });

      expect(result.diverDiving).toBe(true);
      expect(result.reachedBottom).toBe(true);
      expect(result.enemiesCleanedUp).toBe(true);
    });

    test('2.4 Rogue Stalker AI tracking enemies at screen edges remains confined within canvas bounds', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        gm.enemies = [];

        // Spawn Rogue Stalker
        const stalker = new EnemyClass(300, 200, gm.logicalWidth, 1, 8, gm.logicalHeight); // ROGUE_STALKER = 8
        // Spawn Invader at far left edge (x = 0)
        const leftInvader = new EnemyClass(0, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
        leftInvader.faction = 'INVADER';
        gm.enemies.push(stalker, leftInvader);

        let outOfBoundsCount = 0;

        // Run updates while stalker pursues left edge
        for (let frame = 0; frame < 100; frame++) {
          stalker.update(0.016, 1.0, [], { x: 300, y: 700 }, gm.enemies);
          if (stalker.position.x < 0 || stalker.position.x + stalker.size.width > gm.logicalWidth) {
            outOfBoundsCount++;
          }
        }

        // Now move target to far right edge (x = 560)
        leftInvader.position.x = 560;
        for (let frame = 0; frame < 100; frame++) {
          stalker.update(0.016, 1.0, [], { x: 300, y: 700 }, gm.enemies);
          if (stalker.position.x < 0 || stalker.position.x + stalker.size.width > gm.logicalWidth) {
            outOfBoundsCount++;
          }
        }

        return {
          outOfBoundsCount,
          finalStalkerX: stalker.position.x,
        };
      });

      expect(result.outOfBoundsCount).toBe(0);
      expect(result.finalStalkerX).toBeGreaterThanOrEqual(0);
    });

    test('2.5 Spearhead formation wingmen clamping prevents spawning outside canvas', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];

        gm.spawnDynamicReinforcement('SPEARHEAD');

        const spearheadUnits = gm.enemies;
        const allClamped = spearheadUnits.every((e: any) => 
          e.position.x >= 0 && 
          e.position.x + e.size.width <= gm.logicalWidth &&
          e.position.y >= 0 &&
          e.position.y + e.size.height <= gm.logicalHeight
        );

        return {
          unitCount: spearheadUnits.length,
          allClamped,
          positions: spearheadUnits.map((e: any) => ({ x: e.position.x, y: e.position.y, w: e.size.width })),
        };
      });

      expect(result.unitCount).toBe(5); // Apex + 2 Left + 2 Right
      expect(result.allClamped).toBe(true);
    });
  });

  // =========================================================================
  // 3. ZERO-HOSTILE & QUEUED REINFORCEMENT WAVE CLEAR EDGE CASES
  // =========================================================================
  test.describe('3. Zero-Hostile & Queued Reinforcement Wave Clear Edge Cases', () => {
    test('3.1 Active warning timer blocks premature wave clear when hostile count is 0', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = []; // All enemies destroyed
        gm.warningTimer = 1.5;
        gm.pendingReinforcement = 'ROGUE_INCURSION';
        gm.state = 'PLAYING';

        // Update loop for 0.5s (warning timer decreases to 1.0s)
        gm.update(0.5);

        return {
          stateAfterUpdate: gm.state,
          warningTimer: gm.warningTimer,
          pendingReinforcement: gm.pendingReinforcement,
        };
      });

      // Must remain in PLAYING state because warning is still counting down
      expect(result.stateAfterUpdate).toBe('PLAYING');
      expect(result.warningTimer).toBeCloseTo(1.0, 1);
      expect(result.pendingReinforcement).toBe('ROGUE_INCURSION');
    });

    test('3.2 Queued pending reinforcement spawns units when warning expires and keeps game in PLAYING', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.warningTimer = 0.1;
        gm.pendingReinforcement = '3WAY_CLASH';
        gm.state = 'PLAYING';

        // Ticking past warning timer
        gm.update(0.2);

        return {
          stateAfterExpiry: gm.state,
          warningTimer: gm.warningTimer,
          pendingReinforcement: gm.pendingReinforcement,
          spawnedEnemiesCount: gm.enemies.length,
          invaders: gm.enemies.filter((e: any) => e.faction === 'INVADER').length,
          rogues: gm.enemies.filter((e: any) => e.faction === 'ROGUE').length,
        };
      });

      expect(result.stateAfterExpiry).toBe('PLAYING');
      expect(result.warningTimer).toBeGreaterThan(0); // incursion banner active
      expect(result.pendingReinforcement).toBeNull();
      expect(result.spawnedEnemiesCount).toBeGreaterThan(0);
      expect(result.invaders).toBeGreaterThan(0);
      expect(result.rogues).toBeGreaterThan(0);
    });

    test('3.3 Pending ALLY reinforcement with 0 hostiles transitions cleanly to SHOP after helpers spawn', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.helpers = [];
        gm.warningTimer = 0.1;
        gm.pendingReinforcement = 'ALLY';
        gm.state = 'PLAYING';

        // Ticking past warning timer
        gm.update(0.2);

        return {
          stateAfterAllySpawn: gm.state,
          helperCount: gm.helpers.length,
          enemyCount: gm.enemies.length,
          pendingReinforcement: gm.pendingReinforcement,
        };
      });

      expect(result.helperCount).toBeGreaterThan(0);
      expect(result.enemyCount).toBe(0);
      expect(result.pendingReinforcement).toBeNull();
      expect(result.stateAfterAllySpawn).toBe('SHOP');
    });

    test('3.4 Sub-millisecond warning threshold handover prevents race condition wave clear', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.warningTimer = 0.001; // extremely close to expiry
        gm.pendingReinforcement = 'SPEARHEAD';
        gm.state = 'PLAYING';

        // Next frame triggers expiry and spawn
        gm.update(0.016);

        return {
          state: gm.state,
          enemiesCount: gm.enemies.length,
          warningTimer: gm.warningTimer,
        };
      });

      expect(result.state).toBe('PLAYING');
      expect(result.enemiesCount).toBe(5); // Spearhead has 5 units
      expect(result.warningTimer).toBeGreaterThan(0); // Spearhead banner active
    });

    test('3.5 Dynamic reinforcement tempo acceleration triggers when hostile count drops <= 2', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        gm.enemies = [];

        // Spawn only 2 hostiles
        const invader = new EnemyClass(100, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
        invader.faction = 'INVADER';
        const rogue = new EnemyClass(200, 100, gm.logicalWidth, 1, 7, gm.logicalHeight);
        rogue.faction = 'ROGUE';
        gm.enemies.push(invader, rogue);

        // Set reinforcementTimer high
        gm.reinforcementTimer = 12.0;
        gm.warningTimer = 0;

        // Update 1 frame
        gm.update(0.016);

        return {
          acceleratedTimer: gm.reinforcementTimer,
        };
      });

      // Pacing director accelerates reinforcementTimer to 2.0 when active hostiles <= 2
      expect(result.acceleratedTimer).toBeLessThanOrEqual(2.0);
    });
  });

  // =========================================================================
  // 4. SHOP TRANSITION & INTERMISSION INTEGRITY
  // =========================================================================
  test.describe('4. Shop Transition & Intermission Integrity', () => {
    test('4.1 Legitimate wave clear triggers SHOP state and cleanly resets all pacing and warning variables', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        // Give player 1 enemy
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
        gm.enemies = [new EnemyClass(100, 100, gm.logicalWidth, 1, 0, gm.logicalHeight)];
        gm.state = 'PLAYING';
        gm.warningTimer = 0;
        gm.pendingReinforcement = null;

        // Kill the enemy
        gm.enemies[0].isDead = true;

        // Run update
        gm.update(0.016);

        return {
          state: gm.state,
          isPaused: gm.isPaused,
          warningTimer: gm.warningTimer,
          warningMessage: gm.warningMessage,
          warningText: gm.warningText,
          pendingReinforcement: gm.pendingReinforcement,
          enemiesLength: gm.enemies.length,
        };
      });

      expect(result.state).toBe('SHOP');
      expect(result.isPaused).toBe(true);
      expect(result.warningTimer).toBe(0);
      expect(result.warningMessage).toBe('');
      expect(result.warningText).toBe('');
      expect(result.pendingReinforcement).toBeNull();
      expect(result.enemiesLength).toBe(0);
    });

    test('4.2 Intermission startNextWave() advances level and spawns fresh wave with clean pacing timers', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.level = 1;
        gm.state = 'SHOP';
        gm.isPaused = true;
        gm.warningTimer = 0.5; // dirty residual
        gm.pendingReinforcement = 'FLANK';
        gm.enemies = []; // previous wave cleared

        // Start next wave (Wave 2)
        gm.startNextWave();

        return {
          newLevel: gm.level,
          newState: gm.state,
          isPaused: gm.isPaused,
          warningTimer: gm.warningTimer,
          warningMessage: gm.warningMessage,
          pendingReinforcement: gm.pendingReinforcement,
          spawnedEnemiesCount: gm.enemies.length,
          firstEnemyY: gm.enemies[0]?.position.y,
        };
      });

      expect(result.newLevel).toBe(2);
      expect(result.newState).toBe('PLAYING');
      expect(result.isPaused).toBe(false);
      expect(result.warningTimer).toBe(0);
      expect(result.warningMessage).toBe('');
      expect(result.pendingReinforcement).toBeNull();
      expect(result.spawnedEnemiesCount).toBeGreaterThan(0);
      expect(result.firstEnemyY).toBeGreaterThanOrEqual(80);
    });

    test('4.3 Wave 5 Boss wave spawn integrity via startNextWave()', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.level = 4;
        gm.state = 'SHOP';
        gm.enemies = []; // previous wave cleared

        // Advance to Wave 5
        gm.startNextWave();

        const boss = gm.enemies.find((e: any) => e.type === 2); // BOSS = 2

        return {
          level: gm.level,
          enemyCount: gm.enemies.length,
          hasBoss: !!boss,
          bossY: boss?.position.y,
          bossHp: boss?.hp,
          bossWidth: boss?.size.width,
          bossHeight: boss?.size.height,
        };
      });

      expect(result.level).toBe(5);
      expect(result.enemyCount).toBe(1);
      expect(result.hasBoss).toBe(true);
      expect(result.bossY).toBeGreaterThanOrEqual(90);
      expect(result.bossHp).toBe(50); // level 5 * 10 = 50
      expect(result.bossWidth).toBe(150);
      expect(result.bossHeight).toBe(100);
    });

    test('4.4 Continuous 5-Wave loop with Shop intermissions and dynamic incursions completes without state leakage', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const waveProgression: any[] = [];

        for (let targetWave = 1; targetWave <= 5; targetWave++) {
          // Verify in PLAYING state
          if (gm.state !== 'PLAYING') {
            gm.startNextWave();
          }

          // Trigger a dynamic incursion mid-wave
          gm.spawnDynamicReinforcement('3WAY_CLASH');

          // Simulate 10 frames of combat
          for (let f = 0; f < 10; f++) {
            gm.update(0.016);
          }

          // Record active count
          const midWaveCount = gm.enemies.length;

          // Eliminate all hostiles
          gm.enemies.forEach((e: any) => { e.isDead = true; });
          gm.warningTimer = 0;
          gm.pendingReinforcement = null;
          gm.update(0.016); // Should transition to SHOP

          waveProgression.push({
            wave: gm.level,
            stateAfterClear: gm.state,
            midWaveCount,
            enemiesRemaining: gm.enemies.length,
          });

          // Transition to next wave if not last
          if (targetWave < 5) {
            gm.startNextWave();
          }
        }

        return {
          waveProgression,
          finalLevel: gm.level,
        };
      });

      expect(result.waveProgression.length).toBe(5);
      for (const wp of result.waveProgression) {
        expect(wp.stateAfterClear).toBe('SHOP');
        expect(wp.midWaveCount).toBeGreaterThan(0);
        expect(wp.enemiesRemaining).toBe(0);
      }
      expect(result.finalLevel).toBe(5);
    });
  });
});

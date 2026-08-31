import { test, expect } from '@playwright/test';

test.describe('Adversarial Challenger 2: Mathematical & Physics Verification (M1 & M2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  // =========================================================================
  // TASK 1: HP Scaling Across 1,000 Simulated Levels & Continuity Verification
  // =========================================================================
  test.describe('Task 1: 1,000 Simulated Levels HP Scaling, Monotonicity & Boundary Continuity', () => {
    test('T1.1: 1,000 levels HP evaluation for all 10 enemy types (Monotonicity, Bounds, and NaN-free)', async ({ page }) => {
      const results = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0]?.constructor;
        if (!EnemyClass) throw new Error('Enemy class not found');

        // All 10 enemy types
        const types = [
          { name: 'NORMAL', id: 0 },
          { name: 'ZIGZAG', id: 1 },
          { name: 'BOSS', id: 2 },
          { name: 'SNIPER', id: 3 },
          { name: 'DIVER', id: 4 },
          { name: 'SHIELDED', id: 5 },
          { name: 'SPLITTER', id: 6 },
          { name: 'ROGUE_DRONE', id: 7 },
          { name: 'ROGUE_STALKER', id: 8 },
          { name: 'ROGUE_MECH', id: 9 },
        ];

        const anomalies: string[] = [];
        const typeSummaries: Record<string, {
          lvl1Hp: number;
          lvl9Hp: number;
          lvl10Hp: number;
          lvl50Hp: number;
          lvl100Hp: number;
          lvl1000Hp: number;
          isMonotonicStage10Plus: boolean;
          boundaryJumpRatio: number;
        }> = {};

        for (const t of types) {
          let prevStage10Hp = -1;
          let isMonotonic = true;
          let lvl1Hp = 0;
          let lvl9Hp = 0;
          let lvl10Hp = 0;
          let lvl50Hp = 0;
          let lvl100Hp = 0;
          let lvl1000Hp = 0;

          for (let lvl = 1; lvl <= 1000; lvl++) {
            const enemy = new EnemyClass(100, 80, 720, lvl, t.id, 960);
            const totalEffectiveHp = enemy.hp + (enemy.shieldHp || 0);

            if (!Number.isFinite(enemy.hp) || enemy.hp <= 0) {
              anomalies.push(`Invalid HP at lvl ${lvl} for ${t.name}: ${enemy.hp}`);
            }
            if (t.name === 'SHIELDED' && (!Number.isFinite(enemy.shieldHp) || enemy.shieldHp < 0)) {
              anomalies.push(`Invalid Shield HP at lvl ${lvl} for ${t.name}: ${enemy.shieldHp}`);
            }

            if (lvl === 1) lvl1Hp = totalEffectiveHp;
            if (lvl === 9) lvl9Hp = totalEffectiveHp;
            if (lvl === 10) lvl10Hp = totalEffectiveHp;
            if (lvl === 50) lvl50Hp = totalEffectiveHp;
            if (lvl === 100) lvl100Hp = totalEffectiveHp;
            if (lvl === 1000) lvl1000Hp = totalEffectiveHp;

            // Strictly monotonic check for Level >= 10
            if (lvl >= 10) {
              if (prevStage10Hp !== -1 && totalEffectiveHp <= prevStage10Hp) {
                isMonotonic = false;
                anomalies.push(`Non-monotonic scaling for ${t.name} at lvl ${lvl}: prev=${prevStage10Hp}, current=${totalEffectiveHp}`);
              }
              prevStage10Hp = totalEffectiveHp;
            }
          }

          typeSummaries[t.name] = {
            lvl1Hp,
            lvl9Hp,
            lvl10Hp,
            lvl50Hp,
            lvl100Hp,
            lvl1000Hp,
            isMonotonicStage10Plus: isMonotonic,
            boundaryJumpRatio: lvl10Hp / lvl9Hp,
          };
        }

        return {
          totalSimulated: types.length * 1000,
          anomalies,
          typeSummaries,
        };
      });

      expect(results.anomalies).toHaveLength(0);
      expect(results.totalSimulated).toBe(10000);

      // Verify each type's properties
      for (const [typeName, summary] of Object.entries(results.typeSummaries)) {
        // Strictly monotonic at stage 10+
        expect(summary.isMonotonicStage10Plus, `${typeName} must be strictly monotonic at level 10+`).toBe(true);

        // Boundary continuity / upward leap into extreme difficulty regime (L10 >= L9)
        expect(summary.lvl10Hp).toBeGreaterThan(summary.lvl9Hp);
        expect(summary.boundaryJumpRatio).toBeGreaterThanOrEqual(1.5);

        // High level extreme threat scaling (L1000 >> L100 >> L10)
        expect(summary.lvl1000Hp).toBeGreaterThan(summary.lvl100Hp);
        expect(summary.lvl100Hp).toBeGreaterThan(summary.lvl10Hp);
      }

      // Exact mathematical formula verification for NORMAL enemy:
      // Level 9: 1 + floor(9/3) = 4
      // Level 10: 4 + (10-9)*6 + floor(1^1.5) = 11
      // Level 50: 4 + 41*6 + floor(41^1.5) = 4 + 246 + 262 = 512
      const normal = results.typeSummaries['NORMAL'];
      expect(normal.lvl1Hp).toBe(1);
      expect(normal.lvl9Hp).toBe(4);
      expect(normal.lvl10Hp).toBe(11);
      expect(normal.lvl50Hp).toBe(512);

      // Boss exact formula verification:
      // Level 9: 90
      // Level 10: 50 + 250 + floor(25 * 2.5) = 362
      const boss = results.typeSummaries['BOSS'];
      expect(boss.lvl9Hp).toBe(90);
      expect(boss.lvl10Hp).toBe(362);
    });
  });

  // =========================================================================
  // TASK 2: 2-Damage Elite Projectile Impact on Player HP (5 -> 3 -> 1 -> Dead)
  // =========================================================================
  test.describe('Task 2: 2-Damage Elite Projectile Impact on Max-Level Player (5 HP)', () => {
    test('T2.1: Invader SNIPER elite projectile deals 2 damage (5 HP -> 3 HP -> 1 HP -> GameOver)', async ({ page }) => {
      const sequence = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        // Upgrade player to max HP (5)
        gm.player.maxHp = 5;
        gm.player.hp = 5;
        gm.player.invincibilityTimer = 0;
        gm.isGodMode = false;
        gm.state = 'PLAYING';

        // Spawn Stage 10 Sniper
        const sniper = new EnemyClass(gm.logicalWidth / 2 - 20, 100, gm.logicalWidth, 10, 3, gm.logicalHeight); // 3 = SNIPER
        sniper.fireTimer = 0;
        const sniperBullet1 = sniper.fire(gm.player.position, []);
        if (!sniperBullet1) throw new Error('Sniper failed to fire bullet 1');

        const bulletDamage = sniperBullet1.damage;
        const hpSnapshots: number[] = [gm.player.hp];

        // HIT 1: 5 HP -> 3 HP
        sniperBullet1.position.x = gm.player.position.x + 10;
        sniperBullet1.position.y = gm.player.position.y + 10;
        sniperBullet1.isDead = false;
        gm.bullets = [sniperBullet1];
        gm.checkCollisions();
        hpSnapshots.push(gm.player.hp);

        // Reset i-frames and fireTimer for HIT 2
        gm.player.invincibilityTimer = 0;
        sniper.fireTimer = 0;
        const sniperBullet2 = sniper.fire(gm.player.position, []);
        if (!sniperBullet2) throw new Error('Sniper failed to fire bullet 2');
        sniperBullet2.position.x = gm.player.position.x + 10;
        sniperBullet2.position.y = gm.player.position.y + 10;
        sniperBullet2.isDead = false;
        gm.bullets = [sniperBullet2];
        gm.checkCollisions();
        hpSnapshots.push(gm.player.hp);

        // Reset i-frames and fireTimer for HIT 3: 1 HP -> -1 / Game Over
        gm.player.invincibilityTimer = 0;
        sniper.fireTimer = 0;
        const sniperBullet3 = sniper.fire(gm.player.position, []);
        if (!sniperBullet3) throw new Error('Sniper failed to fire bullet 3');
        sniperBullet3.position.x = gm.player.position.x + 10;
        sniperBullet3.position.y = gm.player.position.y + 10;
        sniperBullet3.isDead = false;
        gm.bullets = [sniperBullet3];
        gm.checkCollisions();
        hpSnapshots.push(gm.player.hp);

        return {
          bulletDamage,
          hpSnapshots,
          isGameOver: gm.state === 'GAME_OVER',
        };
      });

      expect(sequence.bulletDamage).toBe(2);
      expect(sequence.hpSnapshots).toEqual([5, 3, 1, -1]);
      expect(sequence.isGameOver).toBe(true);
    });

    test('T2.2: Stage 10+ BOSS projectile deals 2 damage to player', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        gm.player.maxHp = 5;
        gm.player.hp = 5;
        gm.player.invincibilityTimer = 0;
        gm.isGodMode = false;

        const boss = new EnemyClass(gm.logicalWidth / 2 - 75, 100, gm.logicalWidth, 10, 2, gm.logicalHeight); // 2 = BOSS
        boss.fireTimer = 0;
        const bossBullet = boss.fire(gm.player.position, []);
        if (!bossBullet) throw new Error('Boss failed to fire');

        const bulletDamage = bossBullet.damage;
        bossBullet.position.x = gm.player.position.x + 10;
        bossBullet.position.y = gm.player.position.y + 10;
        bossBullet.isDead = false;
        gm.bullets = [bossBullet];
        gm.checkCollisions();

        return {
          bulletDamage,
          playerHpAfterHit: gm.player.hp,
        };
      });

      expect(result.bulletDamage).toBe(2);
      expect(result.playerHpAfterHit).toBe(3);
    });

    test('T2.3: Rogue Faction Elite projectiles (STALKER & MECH) deal 2 damage at Stage 10+', async ({ page }) => {
      const results = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        // Rogue Stalker
        const stalker = new EnemyClass(100, 100, gm.logicalWidth, 10, 8, gm.logicalHeight); // 8 = ROGUE_STALKER
        stalker.fireTimer = 0;
        const stalkerBullet = stalker.fire(gm.player.position, []);

        // Rogue Mech
        const mech = new EnemyClass(200, 100, gm.logicalWidth, 10, 9, gm.logicalHeight); // 9 = ROGUE_MECH
        mech.fireTimer = 0;
        const mechBullet = mech.fire(gm.player.position, []);

        // Rogue Drone (Non-elite: 1 damage)
        const drone = new EnemyClass(300, 100, gm.logicalWidth, 10, 7, gm.logicalHeight); // 7 = ROGUE_DRONE
        drone.fireTimer = 0;
        const droneBullet = drone.fire(gm.player.position, []);

        return {
          stalkerDamage: stalkerBullet?.damage,
          mechDamage: mechBullet?.damage,
          droneDamage: droneBullet?.damage,
        };
      });

      expect(results.stalkerDamage).toBe(2);
      expect(results.mechDamage).toBe(2);
      expect(results.droneDamage).toBe(1);
    });
  });

  // =========================================================================
  // TASK 3: Projectile Velocity Scaling at Stage 10+ (Smooth Scaling up to 400 px/s)
  // =========================================================================
  test.describe('Task 3: Projectile Velocity Scaling at Stage 10+ (Capped smoothly at 400 px/s)', () => {
    test('T3.1: Mathematical progression of projectile speed from Stage 10 to Stage 30', async ({ page }) => {
      const speeds = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        const results: { level: number; speed: number; sniperSpeed: number }[] = [];

        for (let lvl = 10; lvl <= 30; lvl++) {
          const enemy = new EnemyClass(200, 100, gm.logicalWidth, lvl, 0, gm.logicalHeight); // NORMAL
          enemy.fireTimer = 0;
          const bullet = enemy.fire(undefined, []);

          const sniper = new EnemyClass(200, 100, gm.logicalWidth, lvl, 3, gm.logicalHeight); // SNIPER
          sniper.fireTimer = 0;
          const sniperBullet = sniper.fire({ x: 200, y: 500 }, []);

          const bulletSpeed = bullet ? Math.hypot(bullet.velocity.x, bullet.velocity.y) : 0;
          const sniperMag = sniperBullet ? Math.hypot(sniperBullet.velocity.x, sniperBullet.velocity.y) : 0;

          results.push({
            level: lvl,
            speed: Math.round(bulletSpeed * 100) / 100,
            sniperSpeed: Math.round(sniperMag * 100) / 100,
          });
        }

        return results;
      });

      // Stage 10: 250 px/s
      expect(speeds[0].level).toBe(10);
      expect(speeds[0].speed).toBe(250);

      // Verify smooth linear ramp of +15 px/s from lvl 10 to lvl 20
      for (let i = 0; i < 10; i++) {
        const expected = 250 + i * 15;
        expect(speeds[i].speed).toBe(expected);
      }

      // Stage 20: 400 px/s
      const at20 = speeds.find(s => s.level === 20)!;
      expect(at20.speed).toBe(400);

      // Stage 21..30: strictly clamped at 400 px/s
      const post20 = speeds.filter(s => s.level >= 20);
      for (const entry of post20) {
        expect(entry.speed).toBe(400);
      }
    });

    test('T3.2: Sniper and Rogue targeted velocity vector magnitude integrity', async ({ page }) => {
      const vectorIntegrity = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        const checks: { angleDeg: number; targetX: number; targetY: number; magnitude: number; isFinite: boolean }[] = [];

        const sniper = new EnemyClass(360, 200, gm.logicalWidth, 15, 3, gm.logicalHeight); // SNIPER at L15 (speed = 325 + 50 = 375, max(400, 375) = 400)

        // Test 12 circular target positions around the sniper
        for (let angle = 0; angle < 360; angle += 30) {
          const rad = (angle * Math.PI) / 180;
          const targetX = 360 + Math.cos(rad) * 300;
          const targetY = 200 + Math.sin(rad) * 300;

          sniper.fireTimer = 0;
          const bullet = sniper.fire({ x: targetX - 25, y: targetY - 20 }, []);
          if (bullet) {
            const mag = Math.hypot(bullet.velocity.x, bullet.velocity.y);
            checks.push({
              angleDeg: angle,
              targetX,
              targetY,
              magnitude: Math.round(mag * 100) / 100,
              isFinite: Number.isFinite(bullet.velocity.x) && Number.isFinite(bullet.velocity.y),
            });
          }
        }

        return checks;
      });

      expect(vectorIntegrity.length).toBe(12);
      for (const check of vectorIntegrity) {
        expect(check.isFinite).toBe(true);
        expect(check.magnitude).toBe(400); // Sniper target vector magnitude = 400 px/s
      }
    });
  });

  // =========================================================================
  // TASK 4: Enemy Attack Tempo Cooldown Bounds (0.8s ~ 1.5s)
  // =========================================================================
  test.describe('Task 4: Enemy Attack Tempo Cooldown Bounds (0.8s ~ 1.5s at Stage 10+)', () => {
    test('T4.1: Initial spawn fireTimer bounds across 2,000 enemy instantiations at Stage 10', async ({ page }) => {
      const stats = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        let minTimer = Infinity;
        let maxTimer = -Infinity;
        let sumTimer = 0;
        const sampleCount = 2000;
        let outOfBoundsCount = 0;

        for (let i = 0; i < sampleCount; i++) {
          const type = i % 10;
          const enemy = new EnemyClass(100, 100, gm.logicalWidth, 10, type, gm.logicalHeight);
          const t = (enemy as any).fireTimer;

          if (t < 0.8 || t > 1.5) {
            outOfBoundsCount++;
          }
          if (t < minTimer) minTimer = t;
          if (t > maxTimer) maxTimer = t;
          sumTimer += t;
        }

        return {
          minTimer,
          maxTimer,
          meanTimer: sumTimer / sampleCount,
          outOfBoundsCount,
          sampleCount,
        };
      });

      expect(stats.outOfBoundsCount).toBe(0);
      expect(stats.minTimer).toBeGreaterThanOrEqual(0.80);
      expect(stats.maxTimer).toBeLessThanOrEqual(1.50);
      expect(stats.meanTimer).toBeGreaterThan(1.05);
      expect(stats.meanTimer).toBeLessThan(1.25);
    });

    test('T4.2: Post-fire reset cooldown bounds across 3,000 firing cycles', async ({ page }) => {
      const resetStats = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        let minCooldown = Infinity;
        let maxCooldown = -Infinity;
        let outOfBoundsL10 = 0;

        const enemyL10 = new EnemyClass(100, 100, gm.logicalWidth, 10, 0, gm.logicalHeight);

        for (let i = 0; i < 3000; i++) {
          enemyL10.fireTimer = 0;
          enemyL10.fire();
          const nextTimer = enemyL10.fireTimer;

          if (nextTimer < 0.8 || nextTimer > 1.5) {
            outOfBoundsL10++;
          }
          if (nextTimer < minCooldown) minCooldown = nextTimer;
          if (nextTimer > maxCooldown) maxCooldown = nextTimer;
        }

        return {
          minCooldown,
          maxCooldown,
          outOfBoundsL10,
        };
      });

      expect(resetStats.outOfBoundsL10).toBe(0);
      expect(resetStats.minCooldown).toBeGreaterThanOrEqual(0.80);
      expect(resetStats.maxCooldown).toBeLessThanOrEqual(1.50);
    });
  });

  // =========================================================================
  // TASK 5: Zero NaN, Infinity, or Null Physics Coordinates During Crisis Events
  // =========================================================================
  test.describe('Task 5: Crisis Physics Stability & Zero Coordinate Corruption', () => {
    const crisisList = ['TITAN_HORDE', 'ACID_STORM', 'SWARM_BLITZ', 'EMP_DISRUPTION', 'TOTAL_WAR'];

    for (const crisisType of crisisList) {
      test(`T5.${crisisList.indexOf(crisisType) + 1}: Physics integrity & zero NaN during ${crisisType} crisis event`, async ({ page }) => {
        const physicsAudit = await page.evaluate((cType) => {
          const gm = (window as any).gameManager;
          gm.isGodMode = true; // Invulnerable to allow full simulation lifecycle
          gm.level = 10;

          // Trigger the specific crisis
          gm.triggerCrisis(cType);

          const violations: string[] = [];
          const dt = 1 / 60; // 60 FPS physics tick

          // Simulate 600 frames (10 full seconds of intensive crisis combat)
          for (let frame = 0; frame < 600; frame++) {
            gm.update(dt);

            // 1. Check Player physics
            if (gm.player) {
              const { x, y } = gm.player.position;
              if (!Number.isFinite(x) || !Number.isFinite(y)) {
                violations.push(`Frame ${frame}: Player position corrupted (${x}, ${y})`);
              }
              if (!Number.isFinite(gm.player.stressLevel) || !Number.isFinite(gm.player.suppressionLevel)) {
                violations.push(`Frame ${frame}: Player stress/suppression corrupted`);
              }
            }

            // 2. Check all active Enemies
            for (let i = 0; i < gm.enemies.length; i++) {
              const e = gm.enemies[i];
              if (!e.isDead) {
                if (!Number.isFinite(e.position.x) || !Number.isFinite(e.position.y)) {
                  violations.push(`Frame ${frame}: Enemy ${i} (${e.type}) position NaN/Inf (${e.position.x}, ${e.position.y})`);
                }
                if (!Number.isFinite(e.hp) || e.hp < 0) {
                  violations.push(`Frame ${frame}: Enemy ${i} HP invalid (${e.hp})`);
                }
                if (!Number.isFinite(e.speedX) || !Number.isFinite(e.speedY)) {
                  violations.push(`Frame ${frame}: Enemy ${i} speed NaN/Inf`);
                }
              }
            }

            // 3. Check all active Bullets
            for (let j = 0; j < gm.bullets.length; j++) {
              const b = gm.bullets[j];
              if (!b.isDead) {
                if (!Number.isFinite(b.position.x) || !Number.isFinite(b.position.y)) {
                  violations.push(`Frame ${frame}: Bullet ${j} position NaN/Inf`);
                }
                if (!Number.isFinite(b.velocity.x) || !Number.isFinite(b.velocity.y)) {
                  violations.push(`Frame ${frame}: Bullet ${j} velocity NaN/Inf`);
                }
              }
            }

            // 4. Check Acid Storm Hazard Projectiles
            if (gm.hazardProjectiles) {
              for (let k = 0; k < gm.hazardProjectiles.length; k++) {
                const hz = gm.hazardProjectiles[k];
                if (!hz.isDead) {
                  if (!Number.isFinite(hz.x) || !Number.isFinite(hz.y)) {
                    violations.push(`Frame ${frame}: Hazard ${k} position NaN/Inf (${hz.x}, ${hz.y})`);
                  }
                  if (!Number.isFinite(hz.speedY) || !Number.isFinite(hz.radius)) {
                    violations.push(`Frame ${frame}: Hazard ${k} speed/radius NaN/Inf`);
                  }
                }
              }
            }

            if (violations.length > 10) break; // Break early if flooded with errors
          }

          return {
            crisisType: cType,
            violations,
            enemiesRemaining: gm.enemies.filter((e: any) => !e.isDead).length,
            bulletsCount: gm.bullets.length,
          };
        }, crisisType);

        expect(physicsAudit.violations).toHaveLength(0);
      });
    }
  });
});

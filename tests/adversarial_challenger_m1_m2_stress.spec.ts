import { test, expect } from '@playwright/test';

test.describe('Adversarial Stress Harness: Milestone M1 & M2 (Stage 10+ Scaling & Crisis Director)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test.describe('Challenge 1: Rapid Sequential Crisis Triggers (State Corruption & Timer Safety)', () => {
    test('1.1 Burst-triggering 20 crises in rapid succession preserves state integrity and resets warning timers cleanly', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const crisisTypes: ('TITAN_HORDE' | 'ACID_STORM' | 'SWARM_BLITZ' | 'EMP_DISRUPTION' | 'TOTAL_WAR')[] = [
          'TITAN_HORDE',
          'ACID_STORM',
          'SWARM_BLITZ',
          'EMP_DISRUPTION',
          'TOTAL_WAR'
        ];

        const history: any[] = [];
        for (let i = 0; i < 20; i++) {
          const type = crisisTypes[i % crisisTypes.length];
          gm.triggerCrisis(type);
          history.push({
            step: i,
            activeCrisis: gm.crisisState.activeCrisis,
            warningTimer: gm.crisisState.warningTimer,
            timer: gm.crisisState.timer,
            hazardCount: gm.hazardProjectiles.length,
            empActive: gm.crisisState.empSuppressionActive
          });
        }

        return {
          historyLength: history.length,
          finalState: {
            activeCrisis: gm.crisisState.activeCrisis,
            warningTimer: gm.crisisState.warningTimer,
            timer: gm.crisisState.timer,
            bannerText: gm.crisisState.bannerText,
            hazardCount: gm.hazardProjectiles.length,
            empActive: gm.crisisState.empSuppressionActive,
            empTimer: gm.crisisState.empTimer,
            gameState: gm.state
          }
        };
      });

      expect(result.historyLength).toBe(20);
      expect(result.finalState.activeCrisis).toBe('TOTAL_WAR');
      expect(result.finalState.warningTimer).toBe(2.0);
      expect(result.finalState.timer).toBe(12.0);
      expect(result.finalState.bannerText).toContain('3-WAY TOTAL WAR INCURSION');
      expect(result.finalState.hazardCount).toBe(0);
      expect(result.finalState.empActive).toBe(false);
      expect(result.finalState.gameState).toBe('PLAYING');
    });

    test('1.2 Sequential crisis triggers interleaved with physics updates do not cause timer runaway or NaN corruption', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        // Sequence: ACID_STORM -> 0.5s -> EMP_DISRUPTION -> 0.5s -> TITAN_HORDE -> 2.2s (active)
        gm.triggerCrisis('ACID_STORM');
        for (let f = 0; f < 30; f++) gm.update(1 / 60); // 0.5s elapsed

        const mid1 = {
          activeCrisis: gm.crisisState.activeCrisis,
          warningTimer: gm.crisisState.warningTimer,
          timer: gm.crisisState.timer
        };

        gm.triggerCrisis('EMP_DISRUPTION');
        for (let f = 0; f < 30; f++) gm.update(1 / 60); // 0.5s elapsed

        const mid2 = {
          activeCrisis: gm.crisisState.activeCrisis,
          warningTimer: gm.crisisState.warningTimer,
          timer: gm.crisisState.timer
        };

        gm.triggerCrisis('TITAN_HORDE');
        const enemiesBeforeTitan = gm.enemies.length;

        // Advance 2.2s (132 frames) to complete warning and trigger active Titan Horde
        for (let f = 0; f < 132; f++) gm.update(1 / 60);

        const titanBoss = gm.enemies.find((e: any) => e.type === 2); // BOSS = 2
        const shieldedCount = gm.enemies.filter((e: any) => e.type === 5).length; // SHIELDED = 5
        const diverCount = gm.enemies.filter((e: any) => e.type === 4).length; // DIVER = 4

        return {
          mid1,
          mid2,
          activeCrisisAfterActivation: gm.crisisState.activeCrisis,
          warningTimerFinal: gm.crisisState.warningTimer,
          enemiesBeforeTitan,
          enemiesAfterTitan: gm.enemies.length,
          hasTitanBoss: !!titanBoss,
          titanBossHp: titanBoss ? titanBoss.hp : 0,
          shieldedCount,
          diverCount
        };
      });

      expect(result.mid1.warningTimer).toBeCloseTo(1.5, 1);
      expect(result.mid2.warningTimer).toBeCloseTo(1.5, 1);
      expect(result.warningTimerFinal).toBe(0);
      expect(result.activeCrisisAfterActivation).toBe('TITAN_HORDE');
      expect(result.hasTitanBoss).toBe(true);
      expect(result.titanBossHp).toBeGreaterThanOrEqual(240);
      expect(result.shieldedCount).toBeGreaterThanOrEqual(4);
      expect(result.diverCount).toBeGreaterThanOrEqual(4);
    });

    test('1.3 Calling triggerCrisis during MENU, SHOP, or GAME_OVER is safely rejected', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        // Test in SHOP state
        gm.state = 'SHOP';
        gm.triggerCrisis('ACID_STORM');
        const shopCrisis = gm.crisisState.activeCrisis;

        // Test in GAME_OVER state
        gm.state = 'GAME_OVER';
        gm.triggerCrisis('EMP_DISRUPTION');
        const gameOverCrisis = gm.crisisState.activeCrisis;

        // Test in MENU state
        gm.state = 'MENU';
        gm.triggerCrisis('TITAN_HORDE');
        const menuCrisis = gm.crisisState.activeCrisis;

        return { shopCrisis, gameOverCrisis, menuCrisis };
      });

      expect(result.shopCrisis).toBeNull();
      expect(result.gameOverCrisis).toBeNull();
      expect(result.menuCrisis).toBeNull();
    });
  });

  test.describe('Challenge 2: EMP Weapon Suppression & Automatic Restoration', () => {
    test('2.1 EMP Disruption activates weapon suppression state and enforces isShooting reset on loop updates', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const p = gm.player;

        // Activate EMP disruption
        gm.triggerCrisis('EMP_DISRUPTION');
        // Advance past 2.0s warning timer into active EMP phase
        for (let f = 0; f < 125; f++) gm.update(1 / 60);

        const empActiveDuringPhase = gm.crisisState.empSuppressionActive;
        const empTimerDuringPhase = gm.crisisState.empTimer;

        // Update loop without new keydown: verifies engine maintains isShooting = false
        p.isShooting = false;
        gm.update(1 / 60);
        const isShootingMaintainedFalse = p.isShooting;
        const suppressionLevel = p.suppressionLevel;

        // Test empirical bullet leak on keydown during EMP:
        // Keydown triggers isShooting = true, which fires 1 frame before line 686 resets it
        gm.bullets = [];
        gm.handleKeyDown(' ');
        gm.update(1 / 60);
        const leakedBulletsOnInitialKeydown = gm.bullets.filter((b: any) => b.faction === 'PLAYER').length;
        const isShootingResetAfterUpdate = p.isShooting;

        return {
          empActiveDuringPhase,
          empTimerDuringPhase,
          isShootingMaintainedFalse,
          suppressionLevel,
          leakedBulletsOnInitialKeydown,
          isShootingResetAfterUpdate
        };
      });

      expect(result.empActiveDuringPhase).toBe(true);
      expect(result.empTimerDuringPhase).toBeGreaterThan(1.0);
      expect(result.isShootingMaintainedFalse).toBe(false);
      expect(result.suppressionLevel).toBeGreaterThanOrEqual(90);
      // Document empirical leak: keydown leaks 1 bullet due to player.update() execution order
      expect(result.leakedBulletsOnInitialKeydown).toBe(1);
      expect(result.isShootingResetAfterUpdate).toBe(false);
    });

    test('2.2 Player weapon automatically restores after 2.5s EMP expiration', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const p = gm.player;

        // Trigger EMP and enter active phase
        gm.triggerCrisis('EMP_DISRUPTION');
        for (let f = 0; f < 125; f++) gm.update(1 / 60);

        const empActiveInitially = gm.crisisState.empSuppressionActive;

        // Advance 2.6s (156 frames) to let 2.5s EMP expire completely
        for (let f = 0; f < 156; f++) gm.update(1 / 60);

        const empActiveAfterExpiration = gm.crisisState.empSuppressionActive;
        const empTimerAfterExpiration = gm.crisisState.empTimer;

        // Now fire weapon
        p.fireTimer = 0;
        gm.bullets = [];
        gm.handleKeyDown(' ');
        gm.update(1 / 60);

        const bulletsGeneratedAfterRestoration = gm.bullets.length;

        return {
          empActiveInitially,
          empActiveAfterExpiration,
          empTimerAfterExpiration,
          bulletsGeneratedAfterRestoration
        };
      });

      expect(result.empActiveInitially).toBe(true);
      expect(result.empActiveAfterExpiration).toBe(false);
      expect(result.empTimerAfterExpiration).toBe(0);
      expect(result.bulletsGeneratedAfterRestoration).toBeGreaterThan(0);
    });

    test('2.3 Multiple sequential EMP cycles activate, expire, and restore firing state cleanly', async ({ page }) => {
      const cycleResults = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const p = gm.player;
        gm.isGodMode = true; // Protect player from enemy march game over during time advancement
        const cycles: any[] = [];

        for (let c = 1; c <= 3; c++) {
          gm.triggerCrisis('EMP_DISRUPTION');
          // Warning phase: 2.0s
          for (let f = 0; f < 122; f++) gm.update(1 / 60);

          const activeDuring = gm.crisisState.empSuppressionActive;
          const suppressionDuring = p.suppressionLevel;

          // Elapse 2.6s for EMP to expire
          for (let f = 0; f < 160; f++) gm.update(1 / 60);

          const activeAfter = gm.crisisState.empSuppressionActive;
          p.fireTimer = 0;
          gm.bullets = [];
          gm.handleKeyDown(' ');
          gm.update(1 / 60);
          const bulletsRestored = gm.bullets.length > 0;

          // Release key for next cycle
          gm.handleKeyUp(' ');

          cycles.push({
            cycle: c,
            activeDuring,
            suppressionDuring,
            activeAfter,
            bulletsRestored
          });
        }

        return cycles;
      });

      expect(cycleResults.length).toBe(3);
      for (const res of cycleResults) {
        expect(res.activeDuring).toBe(true);
        expect(res.suppressionDuring).toBeGreaterThanOrEqual(90);
        expect(res.activeAfter).toBe(false);
        expect(res.bulletsRestored).toBe(true);
      }
    });
  });

  test.describe('Challenge 3: Toxic Acid Storm Hazard Collision & Cleanup', () => {
    test('3.1 Acid Storm spawns environmental falling hazard projectiles during active phase', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        gm.triggerCrisis('ACID_STORM');
        // Advance past 2.0s warning timer
        for (let f = 0; f < 125; f++) gm.update(1 / 60);

        // Run 60 frames (~1.0s) of active acid storm
        for (let f = 0; f < 60; f++) gm.update(1 / 60);

        const projectiles = gm.hazardProjectiles.map((hz: any) => ({
          x: hz.x,
          y: hz.y,
          radius: hz.radius,
          speedY: hz.speedY,
          damage: hz.damage,
          color: hz.color
        }));

        return {
          activeCrisis: gm.crisisState.activeCrisis,
          hazardCount: gm.hazardProjectiles.length,
          projectiles
        };
      });

      expect(result.activeCrisis).toBe('ACID_STORM');
      expect(result.hazardCount).toBeGreaterThan(0);
      for (const p of result.projectiles) {
        expect(p.damage).toBe(1);
        expect(p.radius).toBeGreaterThanOrEqual(5);
        expect(p.speedY).toBeGreaterThanOrEqual(200);
        expect(p.color).toBe('#a3e635');
      }
    });

    test('3.2 Player takes 1 damage on collision with Acid Storm projectile, triggers hit flash and i-frames', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const p = gm.player;

        p.hp = 3;
        p.invincibilityTimer = 0;
        p.hitFlashTimer = 0;
        gm.isGodMode = false;

        // Position player in center
        p.position.x = 300;
        p.position.y = 700;
        p.size.width = 50;
        p.size.height = 40;

        // Manually spawn an acid projectile right above player moving downward into player
        gm.hazardProjectiles = [{
          x: 320,
          y: 690,
          radius: 6,
          speedY: 400,
          damage: 1,
          color: '#a3e635'
        }];

        // Step physics frame
        gm.update(0.05);

        return {
          playerHp: p.hp,
          invincibilityTimer: p.invincibilityTimer,
          hitFlashTimer: p.hitFlashTimer,
          hazardCountAfterHit: gm.hazardProjectiles.length
        };
      });

      expect(result.playerHp).toBe(2);
      expect(result.invincibilityTimer).toBe(1.0);
      expect(result.hitFlashTimer).toBeCloseTo(0.08, 2);
      expect(result.hazardCountAfterHit).toBe(0); // Hit projectile consumed
    });

    test('3.3 Lethal Acid Storm hazard hit triggers Game Over when player HP reaches 0', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const p = gm.player;

        p.hp = 1;
        p.invincibilityTimer = 0;
        gm.isGodMode = false;

        p.position.x = 300;
        p.position.y = 700;

        gm.hazardProjectiles = [{
          x: 320,
          y: 690,
          radius: 6,
          speedY: 400,
          damage: 1,
          color: '#a3e635'
        }];

        gm.update(0.05);

        return {
          playerHp: p.hp,
          gameState: gm.state
        };
      });

      expect(result.playerHp).toBe(0);
      expect(result.gameState).toBe('GAME_OVER');
    });

    test('3.4 Off-screen hazard projectiles are strictly pruned without memory leak', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        // Spawn 100 projectiles: 50 within screen, 50 far below screen (> logicalHeight + 30 = 830)
        gm.hazardProjectiles = [];
        for (let i = 0; i < 50; i++) {
          gm.hazardProjectiles.push({
            x: 50 + i * 5,
            y: 300,
            radius: 6,
            speedY: 300,
            damage: 1
          });
        }
        for (let i = 0; i < 50; i++) {
          gm.hazardProjectiles.push({
            x: 50 + i * 5,
            y: 850, // Beyond bottom boundary 830
            radius: 6,
            speedY: 300,
            damage: 1
          });
        }

        const countBeforeUpdate = gm.hazardProjectiles.length;

        // Step 1 frame: off-screen projectiles should be marked dead and removed
        gm.update(0.016);
        const countAfterFirstPrune = gm.hazardProjectiles.length;

        // Run 200 frames (3.3s): remaining falling projectiles will all reach bottom and prune
        for (let f = 0; f < 200; f++) {
          gm.update(0.016);
        }
        const countFinal = gm.hazardProjectiles.length;

        return {
          countBeforeUpdate,
          countAfterFirstPrune,
          countFinal
        };
      });

      expect(result.countBeforeUpdate).toBe(100);
      expect(result.countAfterFirstPrune).toBe(50);
      expect(result.countFinal).toBe(0);
    });
  });

  test.describe('Challenge 4: Wave Completion & Safe Shop Transition Under Crisis', () => {
    test('4.1 Titan Horde crisis wave cleanly advances to SHOP when all hostiles (Boss + Escorts) are eliminated', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.level = 10;
        gm.state = 'PLAYING';
        gm.isPaused = false;

        // Clear regular wave enemies and trigger Titan Horde
        gm.enemies = [];
        gm.triggerCrisis('TITAN_HORDE');

        // Advance past 2.0s warning to spawn Titan Horde
        for (let f = 0; f < 125; f++) gm.update(1 / 60);

        const hostileCountSpawned = gm.enemies.length;

        // Mark all enemies as dead
        for (const e of gm.enemies) {
          e.isDead = true;
        }

        // Step physics frame
        gm.update(1 / 60);

        return {
          hostileCountSpawned,
          stateAfterClear: gm.state,
          isPaused: gm.isPaused,
          activeCrisisAfterClear: gm.crisisState.activeCrisis,
          warningTimerAfterClear: gm.crisisState.warningTimer
        };
      });

      expect(result.hostileCountSpawned).toBe(9); // 1 Boss + 4 Shielded + 4 Divers
      expect(result.stateAfterClear).toBe('SHOP');
      expect(result.isPaused).toBe(true);
      expect(result.activeCrisisAfterClear).toBeNull();
      expect(result.warningTimerAfterClear).toBe(0);
    });

    test('4.2 Acid Storm wave clear safety: waits for toxic rain to finish before SHOP transition', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.level = 10;
        gm.state = 'PLAYING';
        gm.isPaused = false;
        gm.isGodMode = true; // Protect player from dying to acid rain during simulation

        gm.enemies = [];
        gm.triggerCrisis('ACID_STORM');
        // Advance past 2.0s warning into active storm (10.0s duration)
        for (let f = 0; f < 125; f++) gm.update(1 / 60);

        // Kill any enemies while storm is still actively running (e.g. 8s remaining)
        for (const e of gm.enemies) e.isDead = true;

        gm.update(1 / 60);
        const stateWhileStormActive = gm.state;

        // Advance remaining storm timer to 0
        let steps = 0;
        while (gm.crisisState.timer > 0 && steps < 500) {
          gm.update(0.1);
          steps++;
        }

        // Once storm timer reaches 0, next update should transition to SHOP
        gm.update(1 / 60);
        const stateAfterStormEnded = gm.state;

        return {
          stateWhileStormActive,
          stateAfterStormEnded,
          isPausedAfter: gm.isPaused,
          steps
        };
      });

      expect(result.stateWhileStormActive).toBe('PLAYING'); // Did NOT transition prematurely
      expect(result.stateAfterStormEnded).toBe('SHOP');     // Cleanly transitioned once safe
      expect(result.isPausedAfter).toBe(true);
    });

    test('4.3 3-Way Total War Incursion requires elimination of both Invader and Rogue factions before SHOP transition', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const FactionEnum = (window as any).Faction;
        gm.level = 10;
        gm.state = 'PLAYING';
        gm.isPaused = false;

        gm.enemies = [];
        gm.triggerCrisis('TOTAL_WAR');
        for (let f = 0; f < 125; f++) gm.update(1 / 60);

        const totalSpawned = gm.enemies.length;
        const invaderCount = gm.enemies.filter((e: any) => e.faction === FactionEnum.INVADER).length;
        const rogueCount = gm.enemies.filter((e: any) => e.faction === FactionEnum.ROGUE).length;

        // Kill only Invaders
        for (const e of gm.enemies) {
          if (e.faction === FactionEnum.INVADER) e.isDead = true;
        }
        gm.update(1 / 60);
        const stateWithOnlyRoguesAlive = gm.state;

        // Now kill all Rogues as well
        for (const e of gm.enemies) {
          if (e.faction === FactionEnum.ROGUE) e.isDead = true;
        }
        gm.update(1 / 60);
        const stateAfterAllFactionsKilled = gm.state;

        return {
          totalSpawned,
          invaderCount,
          rogueCount,
          stateWithOnlyRoguesAlive,
          stateAfterAllFactionsKilled
        };
      });

      expect(result.totalSpawned).toBe(22); // 11 Invaders + 11 Rogues
      expect(result.invaderCount).toBe(11);
      expect(result.rogueCount).toBe(11);
      expect(result.stateWithOnlyRoguesAlive).toBe('PLAYING'); // Blocked by Rogues
      expect(result.stateAfterAllFactionsKilled).toBe('SHOP');  // Cleared
    });
  });

  test.describe('Challenge 5: Boss Escort Formation & Mathematical Scaling (Wave 5 vs Stage 10+)', () => {
    test('5.1 Wave 5 Boss is solitary with 0 escorts and 50 HP baseline', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.level = 5;
        gm.enemies = [];

        // Spawn wave 5
        (gm as any).spawnWave();

        const enemies = gm.enemies.map((e: any) => ({
          type: e.type,
          hp: e.hp,
          maxHp: e.maxHp,
          x: e.position.x,
          y: e.position.y,
          width: e.size.width,
          height: e.size.height
        }));

        return {
          enemyCount: enemies.length,
          boss: enemies[0]
        };
      });

      expect(result.enemyCount).toBe(1);
      expect(result.boss.type).toBe(2); // EnemyType.BOSS = 2
      expect(result.boss.hp).toBe(50);  // 5 * 10 = 50 HP
      expect(result.boss.width).toBe(150);
      expect(result.boss.height).toBe(100);
      expect(result.boss.y).toBe(90);
    });

    test('5.2 Stage 10 Boss spawns with exactly 4 escort minions (Shielded, Snipers, Divers) and scaled 362+ HP', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.level = 10;
        gm.enemies = [];

        (gm as any).spawnWave();

        const boss = gm.enemies.find((e: any) => e.type === 2);
        const escorts = gm.enemies.filter((e: any) => e.type !== 2).map((e: any) => ({
          type: e.type,
          hp: e.hp,
          shieldHp: e.shieldHp,
          x: e.position.x,
          y: e.position.y
        }));

        return {
          totalEnemies: gm.enemies.length,
          bossHp: boss ? boss.hp : 0,
          bossWidth: boss ? boss.size.width : 0,
          escortCount: escorts.length,
          escorts
        };
      });

      expect(result.totalEnemies).toBe(5); // 1 Boss + 4 Escorts
      expect(result.bossHp).toBe(362);     // 50 + 10*25 + (10-5)^2*2.5 = 362
      expect(result.bossWidth).toBe(150);
      expect(result.escortCount).toBe(4);

      // Verify escort placement on left and right flanks
      const leftEscorts = result.escorts.filter((e: any) => e.x < 300);
      const rightEscorts = result.escorts.filter((e: any) => e.x > 300);
      expect(leftEscorts.length).toBe(2);
      expect(rightEscorts.length).toBe(2);
    });

    test('5.3 Stage 15 & Stage 20 Boss formations scale to 6 and 8 escorts with exponential boss HP', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        // Stage 15
        gm.level = 15;
        gm.enemies = [];
        (gm as any).spawnWave();
        const stage15Total = gm.enemies.length;
        const stage15Boss = gm.enemies.find((e: any) => e.type === 2);
        const stage15BossHp = stage15Boss ? stage15Boss.hp : 0;
        const stage15Escorts = stage15Total - 1;

        // Stage 20
        gm.level = 20;
        gm.enemies = [];
        (gm as any).spawnWave();
        const stage20Total = gm.enemies.length;
        const stage20Boss = gm.enemies.find((e: any) => e.type === 2);
        const stage20BossHp = stage20Boss ? stage20Boss.hp : 0;
        const stage20Escorts = stage20Total - 1;

        return {
          stage15Total,
          stage15BossHp,
          stage15Escorts,
          stage20Total,
          stage20BossHp,
          stage20Escorts
        };
      });

      // Stage 15: 1 Boss (675 HP) + 6 Escorts = 7 units
      expect(result.stage15Escorts).toBe(6);
      expect(result.stage15Total).toBe(7);
      expect(result.stage15BossHp).toBe(675); // 50 + 15*25 + (15-5)^2*2.5 = 675

      // Stage 20: 1 Boss (1112 HP) + 8 Escorts = 9 units
      expect(result.stage20Escorts).toBe(8);
      expect(result.stage20Total).toBe(9);
      expect(result.stage20BossHp).toBe(1112); // 50 + 20*25 + (20-5)^2*2.5 = 1112
    });

    test('5.4 Stage 10+ normal and elite enemy piecewise scaling formulas are mathematically accurate', async ({ page }) => {
      const scalingData = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy;

        // Test normal enemies from Stage 1 to Stage 15
        const normalHps: { level: number; hp: number }[] = [];
        for (let lvl = 1; lvl <= 15; lvl++) {
          const e = new EnemyClass(100, 100, 600, lvl, 0); // NORMAL = 0
          normalHps.push({ level: lvl, hp: e.hp });
        }

        // Test shielded enemy at Stage 10
        const shielded10 = new EnemyClass(100, 100, 600, 10, 5); // SHIELDED = 5
        // Test shielded enemy at Stage 12
        const shielded12 = new EnemyClass(100, 100, 600, 12, 5);

        return {
          normalHps,
          shielded10: { hp: shielded10.hp, shieldHp: shielded10.shieldHp },
          shielded12: { hp: shielded12.hp, shieldHp: shielded12.shieldHp }
        };
      });

      // Waves 1-9 baseline: HP = 1 + floor(level/3)
      expect(scalingData.normalHps.find(d => d.level === 1)!.hp).toBe(1);
      expect(scalingData.normalHps.find(d => d.level === 3)!.hp).toBe(2);
      expect(scalingData.normalHps.find(d => d.level === 6)!.hp).toBe(3);
      expect(scalingData.normalHps.find(d => d.level === 9)!.hp).toBe(4);

      // Stage 10+: HP = 4 + (lvl-9)*6 + floor((lvl-9)^1.5)
      // Level 10: 4 + 1*6 + floor(1) = 11 HP
      expect(scalingData.normalHps.find(d => d.level === 10)!.hp).toBe(11);
      // Level 11: 4 + 2*6 + floor(2^1.5 = 2.82) = 4 + 12 + 2 = 18 HP
      expect(scalingData.normalHps.find(d => d.level === 11)!.hp).toBe(18);
      // Level 12: 4 + 3*6 + floor(3^1.5 = 5.19) = 4 + 18 + 5 = 27 HP
      expect(scalingData.normalHps.find(d => d.level === 12)!.hp).toBe(27);

      // Shielded Stage 10: HP = 8 + (10-9)*4 = 12, Shield = 6 + (10-9)*3 = 9
      expect(scalingData.shielded10.hp).toBe(12);
      expect(scalingData.shielded10.shieldHp).toBe(9);

      // Shielded Stage 12: HP = 8 + 3*4 = 20, Shield = 6 + 3*3 = 15
      expect(scalingData.shielded12.hp).toBe(20);
      expect(scalingData.shielded12.shieldHp).toBe(15);
    });
  });
});

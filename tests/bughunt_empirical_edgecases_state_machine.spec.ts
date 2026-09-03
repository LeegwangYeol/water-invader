import { test, expect } from '@playwright/test';

/**
 * Empirical Verification of Game State Machine Transitions & Boundary Conditions
 * 
 * Evaluation Matrix:
 * 1. Rapid pause and unpause toggles: delta time bounding, entity position continuity.
 * 2. Simultaneous win/loss resolution: player HP & boss HP reaching 0 on the exact same frame.
 * 3. Shop item purchases: insufficient funds, exact balance, max upgrades, pre-game shop persistence.
 * 4. Stage progression: wave clear, boss wave clear, crisis progression, game restart lifecycle.
 */

test.describe('Empirical Verification: State Machine Transitions & Boundary Conditions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForTimeout(100);
  });

  // =========================================================================
  // 1. RAPID PAUSE AND UNPAUSE TOGGLES
  // =========================================================================
  test.describe('1. Rapid Pause & Unpause Toggles', () => {
    test('1.1 Extreme simulated pause (5 seconds) bounds delta-time to 0.1s and prevents position skips', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const gm = (window as any).gameManager;
        gm.level = 1;
        gm.score = 500;
        
        const initialEnemyCount = gm.enemies.length;
        const enemy = gm.enemies[0];
        const initialEnemyY = enemy ? enemy.position.y : 0;
        const initialPlayerX = gm.player.position.x;

        // 1. Call pause()
        gm.pause();
        const isPausedInitial = gm.isPaused;
        const animFrameAfterPause = gm.animationFrameId;

        // 2. Simulate long real-world pause duration (300ms real wait, but spoof lastTime to simulate 5.0s)
        await new Promise((r) => setTimeout(r, 200));

        // Tamper lastTime backwards by 5000ms to simulate a 5-second tab background freeze
        gm.lastTime = performance.now() - 5000;

        // 3. Resume
        gm.resume();
        const isPausedAfterResume = gm.isPaused;
        const lastTimeAfterResume = gm.lastTime;
        const accumulatorAfterResume = gm.accumulator;

        // 4. Run loop for 1 frame
        await new Promise((r) => requestAnimationFrame(r));

        const enemyYAfterFrame = enemy.position.y;
        const playerXAfterFrame = gm.player.position.x;
        const deltaEnemyY = enemyYAfterFrame - initialEnemyY;

        return {
          initialEnemyCount,
          isPausedInitial,
          animFrameAfterPause,
          isPausedAfterResume,
          accumulatorAfterResume,
          deltaEnemyY,
          initialEnemyY,
          enemyYAfterFrame,
          playerHp: gm.player.hp,
          gameState: gm.state,
        };
      });

      expect(result.initialEnemyCount).toBeGreaterThan(0);
      expect(result.isPausedInitial).toBe(true);
      expect(result.animFrameAfterPause).toBe(0);
      expect(result.isPausedAfterResume).toBe(false);
      expect(result.accumulatorAfterResume).toBe(0);
      // Because frameTime is clamped to 0.1s max (6 steps of 1/60s), enemy displacement cannot exceed ~15px
      expect(result.deltaEnemyY).toBeLessThan(15);
      expect(result.playerHp).toBe(3);
      expect(result.gameState).toBe('PLAYING');
    });

    test('1.2 100 rapid consecutive synchronous pause/resume cycles do not leak animation loops or corrupt state', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.level = 2;
        gm.score = 1200;

        // Perform 100 rapid synchronous toggles
        for (let i = 0; i < 100; i++) {
          gm.pause();
          gm.resume();
        }

        return {
          isPaused: gm.isPaused,
          state: gm.state,
          score: gm.score,
          level: gm.level,
          hasValidLoop: gm.animationFrameId > 0,
          enemyCount: gm.enemies.length,
          accumulator: gm.accumulator,
        };
      });

      expect(result.isPaused).toBe(false);
      expect(result.state).toBe('PLAYING');
      expect(result.score).toBe(1200);
      expect(result.level).toBe(2);
      expect(result.hasValidLoop).toBe(true);
      expect(result.enemyCount).toBeGreaterThan(0);
      expect(result.accumulator).toBe(0);
    });

    test('1.3 Asynchronous 10ms micro-interval jitter pause/unpause toggles (10 cycles) maintain continuous entity motion', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const gm = (window as any).gameManager;
        const enemy = gm.enemies[0];
        const positions: number[] = [];

        for (let i = 0; i < 10; i++) {
          gm.pause();
          await new Promise((r) => setTimeout(r, 10));
          gm.resume();
          await new Promise((r) => setTimeout(r, 10));
          positions.push(enemy.position.x);
        }

        // Check for NaN or sudden discontinuities (> 50px jump in 10ms)
        let maxDelta = 0;
        let hasNaN = false;
        for (let i = 1; i < positions.length; i++) {
          if (isNaN(positions[i])) hasNaN = true;
          const delta = Math.abs(positions[i] - positions[i - 1]);
          if (delta > maxDelta) maxDelta = delta;
        }

        return {
          hasNaN,
          maxDelta,
          finalState: gm.state,
          finalPaused: gm.isPaused,
        };
      });

      expect(result.hasNaN).toBe(false);
      expect(result.maxDelta).toBeLessThan(30);
      expect(result.finalState).toBe('PLAYING');
      expect(result.finalPaused).toBe(false);
    });

    test('1.4 Calling resume() while in SHOP state is safely ignored and retains SHOP state', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        // Force SHOP state
        gm.state = 'SHOP';
        gm.pause();

        const pausedInShop = gm.isPaused;
        // Attempt resume while in SHOP
        gm.resume();

        return {
          pausedInShop,
          isPausedAfterResumeAttempt: gm.isPaused,
          stateAfterResumeAttempt: gm.state,
        };
      });

      expect(result.pausedInShop).toBe(true);
      expect(result.isPausedAfterResumeAttempt).toBe(true);
      expect(result.stateAfterResumeAttempt).toBe('SHOP');
    });
  });

  // =========================================================================
  // 2. SIMULTANEOUS WIN/LOSS RESOLUTION
  // =========================================================================
  test.describe('2. Simultaneous Win/Loss Resolution', () => {
    test('2.1 Wave Boss (EnemyType.BOSS) and Player reaching 0 HP on exact same frame deterministically resolves to GAME_OVER', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy;
        const BulletClass = (window as any).Bullet;

        gm.score = 500;
        gm.currency = 50;
        gm.enemies = [];
        gm.bullets = [];
        gm.hazardProjectiles = [];

        // 1. Boss at 1 HP
        const boss = new EnemyClass(200, 100, gm.logicalWidth, 5, 2, gm.logicalHeight);
        boss.hp = 1;
        boss.faction = 'INVADER';
        gm.enemies.push(boss);

        // 2. Player bullet hitting boss
        const playerBullet = new BulletClass(200, 100, -300, 1, false, 1);
        playerBullet.faction = 'PLAYER';
        gm.bullets.push(playerBullet);

        // 3. Enemy bullet hitting player (Player at 1 HP)
        gm.player.hp = 1;
        gm.player.invincibilityTimer = 0;
        const enemyBullet = new BulletClass(gm.player.position.x + 10, gm.player.position.y + 10, 300, 1, false, 1);
        enemyBullet.faction = 'INVADER';
        gm.bullets.push(enemyBullet);

        // 4. Execute single physics frame update
        (gm as any).update(1 / 60);

        return {
          bossHp: boss.hp,
          bossIsDead: boss.isDead,
          playerHp: gm.player.hp,
          gameState: gm.state,
          score: gm.score,
          currency: gm.currency,
          gameOverReason: gm.gameOverReason,
        };
      });

      expect(result.bossIsDead).toBe(true);
      expect(result.playerHp).toBeLessThanOrEqual(0);
      expect(result.gameState).toBe('GAME_OVER');
      // Boss kill reward is still credited to final score
      expect(result.score).toBe(1500); // 500 + 1000 base boss kill
      expect(result.currency).toBe(100); // 50 + 50 base boss currency
      expect(result.gameOverReason).toContain('정수기');

      // Verify UI renders GAME OVER and does NOT render WAVE CLEARED
      await expect(page.locator('text=GAME OVER')).toBeVisible();
      await expect(page.locator('text=WAVE CLEARED')).not.toBeVisible();
    });

    test('2.2 End-Game Crisis Sovereign Core and Player reaching 0 HP on exact same frame deterministically resolves to GAME_OVER', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const BulletClass = (window as any).Bullet;

        gm.score = 2000;
        gm.currency = 200;
        gm.enemies = [];
        gm.bullets = [];

        // Trigger crisis
        const crisis = gm.triggerEndGameCrisis();
        // Skip straight to Phase 3 with Core at 1 HP
        crisis.phase = 'PHASE_3_CORE';
        crisis.incursionTimer = 0;
        crisis.sovereign.setPhase('PHASE_3_CORE');
        crisis.sovereign.hullHp = 0;
        crisis.sovereign.coreHp = 1;
        crisis.sovereign.hp = 1;
        crisis.sovereign.isInvulnerable = false;
        crisis.activeRifts = [];
        crisis.riftAnchors = [];

        // Player bullet hitting sovereign core
        const coreX = gm.logicalWidth / 2;
        const coreY = 130;
        const playerBullet = new BulletClass(coreX, coreY, -400, 1, false, 1);
        playerBullet.faction = 'PLAYER';
        gm.bullets.push(playerBullet);

        // Hostile bullet hitting player (Player at 1 HP)
        gm.player.hp = 1;
        gm.player.invincibilityTimer = 0;
        const hostileBullet = new BulletClass(gm.player.position.x + 10, gm.player.position.y + 10, 300, 1, false, 1);
        hostileBullet.faction = 'INVADER';
        gm.bullets.push(hostileBullet);

        // Update 1 physics tick
        (gm as any).update(1 / 60);

        return {
          crisisPhase: crisis.phase,
          isCrisisDefeated: crisis.isDefeated(),
          playerHp: gm.player.hp,
          gameState: gm.state,
          score: gm.score,
          currency: gm.currency,
          gameOverReason: gm.gameOverReason,
        };
      });

      expect(result.isCrisisDefeated).toBe(true);
      expect(result.playerHp).toBeLessThanOrEqual(0);
      expect(result.gameState).toBe('GAME_OVER');
      // Empirical Finding: Crisis hit score (+15) is credited immediately, but +2000/+500 defeat resolution
      // is evaluated at the start of the next update() cycle which is skipped when state transitions to GAME_OVER.
      expect(result.score).toBe(2015); // 2000 initial + 15 bullet damage score
      expect(result.currency).toBe(200); // 200 initial (500 bonus deferred to update loop)

      // Verify UI renders GAME OVER and does NOT open Wave Clear Shop
      await expect(page.locator('text=GAME OVER')).toBeVisible();
      await expect(page.locator('text=WAVE CLEARED')).not.toBeVisible();
    });

    test('2.3 Player lethal contact with Boss body deterministically triggers GAME_OVER without crash', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = (window as any).Enemy;

        gm.enemies = [];
        gm.bullets = [];

        // Spawn Boss directly colliding with player
        const boss = new EnemyClass(gm.player.position.x, gm.player.position.y, gm.logicalWidth, 5, 2, gm.logicalHeight);
        boss.hp = 50;
        gm.enemies.push(boss);

        gm.player.hp = 1;
        gm.player.invincibilityTimer = 0;

        // Single physics update step
        (gm as any).update(1 / 60);

        return {
          playerHp: gm.player.hp,
          gameState: gm.state,
        };
      });

      expect(result.playerHp).toBeLessThanOrEqual(0);
      expect(result.gameState).toBe('GAME_OVER');
    });
  });

  // =========================================================================
  // 3. SHOP ITEM PURCHASES BOUNDARY VERIFICATION
  // =========================================================================
  test.describe('3. Shop Item Purchases Boundary Verification', () => {
    test('3.1 Purchases strictly fail when currency is 0 (no deductions, no stat increases)', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.currency = 0;

        const initialStats = {
          fireRateLevel: gm.getUpgrades().fireRate,
          multiShot: gm.player.multiShot,
          piercing: gm.player.piercing,
          hasAcidShield: gm.player.hasAcidShield,
          hp: gm.player.hp,
        };

        // Attempt every purchase with 0 currency
        gm.upgradeFireRate();
        gm.upgradeMultiShot();
        gm.upgradePiercing();
        gm.upgradeAcidShield();

        const postStats = {
          fireRateLevel: gm.getUpgrades().fireRate,
          multiShot: gm.player.multiShot,
          piercing: gm.player.piercing,
          hasAcidShield: gm.player.hasAcidShield,
          hp: gm.player.hp,
          finalCurrency: gm.currency,
        };

        return { initialStats, postStats };
      });

      expect(result.postStats.finalCurrency).toBe(0);
      expect(result.postStats.fireRateLevel).toBe(result.initialStats.fireRateLevel);
      expect(result.postStats.multiShot).toBe(result.initialStats.multiShot);
      expect(result.postStats.piercing).toBe(result.initialStats.piercing);
      expect(result.postStats.hasAcidShield).toBe(result.initialStats.hasAcidShield);
    });

    test('3.2 Near-threshold insufficient currency (cost - 1) strictly rejects purchases', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        // 1. Fire Rate (cost 50) with 49
        gm.currency = 49;
        const initialFireRate = gm.getUpgrades().fireRate;
        gm.upgradeFireRate();
        const fireRateAfter = gm.getUpgrades().fireRate;
        const curAfterFireRate = gm.currency;

        // 2. Multi Shot (cost 100) with 99
        gm.currency = 99;
        const initialMulti = gm.player.multiShot;
        gm.upgradeMultiShot();
        const multiAfter = gm.player.multiShot;
        const curAfterMulti = gm.currency;

        // 3. Piercing (cost 200) with 199
        gm.currency = 199;
        const initialPierce = gm.player.piercing;
        gm.upgradePiercing();
        const pierceAfter = gm.player.piercing;
        const curAfterPierce = gm.currency;

        // 4. Acid Shield (cost 150) with 149
        gm.currency = 149;
        const initialShield = gm.player.hasAcidShield;
        gm.upgradeAcidShield();
        const shieldAfter = gm.player.hasAcidShield;
        const curAfterShield = gm.currency;

        return {
          fireRateAfter,
          initialFireRate,
          curAfterFireRate,
          multiAfter,
          initialMulti,
          curAfterMulti,
          pierceAfter,
          initialPierce,
          curAfterPierce,
          shieldAfter,
          initialShield,
          curAfterShield,
        };
      });

      expect(result.fireRateAfter).toBe(result.initialFireRate);
      expect(result.curAfterFireRate).toBe(49);
      expect(result.multiAfter).toBe(result.initialMulti);
      expect(result.curAfterMulti).toBe(99);
      expect(result.pierceAfter).toBe(result.initialPierce);
      expect(result.curAfterPierce).toBe(199);
      expect(result.shieldAfter).toBe(result.initialShield);
      expect(result.curAfterShield).toBe(149);
    });

    test('3.3 Exact currency purchase succeeds once and leaves exactly 0, rejecting immediate second purchase', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.currency = 50;

        // First purchase: should succeed
        gm.upgradeFireRate();
        const curAfter1 = gm.currency;
        const lvlAfter1 = gm.getUpgrades().fireRate;

        // Second purchase: should be rejected
        gm.upgradeFireRate();
        const curAfter2 = gm.currency;
        const lvlAfter2 = gm.getUpgrades().fireRate;

        return { curAfter1, lvlAfter1, curAfter2, lvlAfter2 };
      });

      expect(result.curAfter1).toBe(0);
      expect(result.lvlAfter1).toBe(2);
      expect(result.curAfter2).toBe(0);
      expect(result.lvlAfter2).toBe(2);
    });

    test('3.4 Max upgrade caps prevent further purchasing even with infinite currency', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.currency = 20000;

        // Buy Fire Rate to Lv 5
        for (let i = 0; i < 10; i++) gm.upgradeFireRate();
        const maxFireRate = gm.getUpgrades().fireRate;

        // Buy Multi-Shot to Lv 5
        for (let i = 0; i < 10; i++) gm.upgradeMultiShot();
        const maxMultiShot = gm.player.multiShot;

        // Buy Piercing to Lv 5
        for (let i = 0; i < 10; i++) gm.upgradePiercing();
        const maxPiercing = gm.player.piercing;

        // Buy Acid Shield
        for (let i = 0; i < 5; i++) gm.upgradeAcidShield();
        const acidShield = gm.player.hasAcidShield;

        const currencyAfterMaxing = gm.currency;

        // Attempt extra purchases on maxed items
        gm.upgradeFireRate();
        gm.upgradeMultiShot();
        gm.upgradePiercing();
        gm.upgradeAcidShield();

        const currencyAfterOverBuy = gm.currency;

        return {
          maxFireRate,
          maxMultiShot,
          maxPiercing,
          acidShield,
          currencyAfterMaxing,
          currencyAfterOverBuy,
        };
      });

      expect(result.maxFireRate).toBe(5);
      expect(result.maxMultiShot).toBe(5);
      expect(result.maxPiercing).toBe(5);
      expect(result.acidShield).toBe(true);
      // Extra purchases must NOT deduct currency
      expect(result.currencyAfterOverBuy).toBe(result.currencyAfterMaxing);
    });

    test('3.5 Negative currency resilience: negative currency fails all purchase checks without underflow', async ({ page }) => {
      const result = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.currency = -100;

        gm.upgradeFireRate();
        gm.upgradeMultiShot();
        gm.upgradePiercing();
        gm.upgradeAcidShield();

        return {
          currency: gm.currency,
          fireRate: gm.getUpgrades().fireRate,
          multiShot: gm.player.multiShot,
        };
      });

      expect(result.currency).toBe(-100);
      expect(result.fireRate).toBe(1);
      expect(result.multiShot).toBe(1);
    });
  });

  // =========================================================================
  // 4. STAGE PROGRESSION & RESTART LIFECYCLE
  // =========================================================================
  test.describe('4. Stage Progression & Restart Lifecycle', () => {
    test('4.1 Wave 1 clear cleanly transitions to SHOP with game paused, and Next Wave advances to Wave 2', async ({ page }) => {
      // 1. Clear Wave 1
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies.forEach((e: any) => { e.isDead = true; });
      });
      await page.waitForTimeout(150);

      // Verify SHOP state
      const shopState = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          state: gm.state,
          isPaused: gm.isPaused,
          level: gm.level,
        };
      });
      expect(shopState.state).toBe('SHOP');
      expect(shopState.isPaused).toBe(true);
      expect(shopState.level).toBe(1);

      // 2. Click NEXT WAVE button in Shop UI
      await page.locator('button', { hasText: 'NEXT WAVE' }).click();
      await page.waitForTimeout(150);

      // Verify Wave 2 PLAYING state
      const wave2State = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          state: gm.state,
          isPaused: gm.isPaused,
          level: gm.level,
          enemyCount: gm.enemies.length,
        };
      });
      expect(wave2State.state).toBe('PLAYING');
      expect(wave2State.isPaused).toBe(false);
      expect(wave2State.level).toBe(2);
      expect(wave2State.enemyCount).toBeGreaterThan(0);
    });

    test('4.2 Boss Wave 5 clear transitions to SHOP, and Next Wave advances to Wave 6', async ({ page }) => {
      const bossState = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        // Advance to level 5 and spawn boss
        gm.level = 5;
        gm.enemies = [];
        (gm as any).spawnWave();

        const boss = gm.enemies.find((e: any) => e.type === 2);
        return {
          hasBoss: !!boss,
          bossHp: boss ? boss.hp : 0,
        };
      });
      expect(bossState.hasBoss).toBe(true);
      expect(bossState.bossHp).toBeGreaterThan(0);

      // Defeat boss and minions
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies.forEach((e: any) => { e.isDead = true; });
      });
      await page.waitForTimeout(150);

      // Check SHOP state
      const shopState = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return { state: gm.state, isPaused: gm.isPaused };
      });
      expect(shopState.state).toBe('SHOP');
      expect(shopState.isPaused).toBe(true);

      // Advance to Wave 6
      await page.locator('button', { hasText: 'NEXT WAVE' }).click();
      await page.waitForTimeout(150);

      const wave6State = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return { state: gm.state, level: gm.level, isPaused: gm.isPaused };
      });
      expect(wave6State.state).toBe('PLAYING');
      expect(wave6State.level).toBe(6);
      expect(wave6State.isPaused).toBe(false);
    });

    test('4.3 Game restart via Continue vs Restart from Beginning options', async ({ page }) => {
      // 1. Setup upgraded player in wave 3 with score and currency
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.level = 3;
        gm.score = 2500;
        gm.currency = 400;
        gm.player.multiShot = 3;
        gm.player.piercing = 2;
        gm.player.hasAcidShield = true;
        (gm as any).updateScoreUI();
        (gm as any).updateUpgradesUI();

        // Kill player
        gm.player.hp = 0;
        (gm as any).gameOver('정수기 파괴');
      });

      await expect(page.locator('text=GAME OVER')).toBeVisible();

      // 2. Test Continue: keeps wave, upgrades, score, and currency
      await page.locator('[data-testid="continue-button"]').click();
      await page.waitForTimeout(200);

      const continueState = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          state: gm.state,
          isPaused: gm.isPaused,
          level: gm.level,
          score: gm.score,
          currency: gm.currency,
          playerHp: gm.player.hp,
          multiShot: gm.player.multiShot,
          piercing: gm.player.piercing,
          hasAcidShield: gm.player.hasAcidShield,
          enemyCount: gm.enemies.length,
          bulletsCount: gm.bullets.length,
          hazardCount: gm.hazardProjectiles.length,
        };
      });

      expect(continueState.state).toBe('PLAYING');
      expect(continueState.isPaused).toBe(false);
      expect(continueState.level).toBe(3); // Preserved wave
      expect(continueState.playerHp).toBe(3);
      expect(continueState.multiShot).toBe(3); // Preserved upgrades
      expect(continueState.piercing).toBe(2);
      expect(continueState.hasAcidShield).toBe(true);
      expect(continueState.score).toBe(2500); // Preserved score
      expect(continueState.currency).toBe(400); // Preserved currency
      expect(continueState.enemyCount).toBeGreaterThan(0);
      expect(continueState.bulletsCount).toBe(0);
      expect(continueState.hazardCount).toBe(0);

      // 3. Kill player again and test Restart from Beginning
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.player.hp = 0;
        (gm as any).gameOver('정수기 재파괴');
      });

      await expect(page.locator('text=GAME OVER')).toBeVisible();
      await page.locator('[data-testid="restart-button"]').click();
      await page.waitForTimeout(200);

      const restartState = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        return {
          state: gm.state,
          isPaused: gm.isPaused,
          level: gm.level,
          score: gm.score,
          currency: gm.currency,
          playerHp: gm.player.hp,
          multiShot: gm.player.multiShot,
          piercing: gm.player.piercing,
          hasAcidShield: gm.player.hasAcidShield,
          enemyCount: gm.enemies.length,
          bulletsCount: gm.bullets.length,
        };
      });

      expect(restartState.state).toBe('PLAYING');
      expect(restartState.isPaused).toBe(false);
      expect(restartState.level).toBe(1); // Reset to wave 1
      expect(restartState.playerHp).toBe(3);
      expect(restartState.multiShot).toBe(1); // Reset upgrades
      expect(restartState.piercing).toBe(1);
      expect(restartState.hasAcidShield).toBe(false);
      expect(restartState.score).toBe(0); // Reset score
      expect(restartState.currency).toBe(150); // Reset currency
      expect(restartState.enemyCount).toBeGreaterThan(0);
      expect(restartState.bulletsCount).toBe(0);
    });

    test('4.4 10 consecutive deaths and PLAY AGAIN restarts maintain loop stability and zero entity leakage', async ({ page }) => {
      const stressResult = await page.evaluate(async () => {
        const gm = (window as any).gameManager;

        for (let i = 0; i < 10; i++) {
          // Kill player
          gm.player.hp = 0;
          (gm as any).gameOver('Stress test kill');
          
          // Re-init with preserved upgrades
          gm.init(false, true);
          gm.startGame();

          // Let a physics frame pass
          await new Promise((r) => requestAnimationFrame(r));
        }

        return {
          state: gm.state,
          level: gm.level,
          playerHp: gm.player.hp,
          bulletsCount: gm.bullets.length,
          particlesCount: gm.particles.length,
          isPaused: gm.isPaused,
          hasValidLoop: gm.animationFrameId > 0,
        };
      });

      expect(stressResult.state).toBe('PLAYING');
      expect(stressResult.level).toBe(1);
      expect(stressResult.playerHp).toBe(3);
      expect(stressResult.bulletsCount).toBe(0);
      expect(stressResult.isPaused).toBe(false);
      expect(stressResult.hasValidLoop).toBe(true);
    });
  });
});

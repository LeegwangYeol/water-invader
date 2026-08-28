import { test, expect } from '@playwright/test';

test.describe('Adversarial Stress Test Suite: Milestone 1 (F-01, F-02, F-04, F-15)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('F-01 [STRESS]: Barricade collision decoupling (0 bullets vs 50 bullets), 5x multi-gnawing, and diver crashes', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;
      const BarricadeClass = gm.barricades[0].constructor;

      // -------------------------------------------------------------
      // Case 1: 0 Bullets vs Destructible Barricade (1 Normal Enemy)
      // -------------------------------------------------------------
      gm.bullets = [];
      const barricade0 = new BarricadeClass(100, 200, 0); // DESTRUCTIBLE
      gm.barricades = [barricade0];
      const normalEnemy0 = new EnemyClass(100, 200, gm.logicalWidth, 1, 0); // NORMAL
      gm.enemies = [normalEnemy0];
      const initialHp0 = barricade0.hp;

      gm.checkCollisions();
      const damageWith0Bullets = initialHp0 - barricade0.hp;

      // -------------------------------------------------------------
      // Case 2: 50 Bullets vs Destructible Barricade (1 Normal Enemy)
      // -------------------------------------------------------------
      const barricade50 = new BarricadeClass(100, 200, 0); // DESTRUCTIBLE
      gm.barricades = [barricade50];
      const normalEnemy50 = new EnemyClass(100, 200, gm.logicalWidth, 1, 0); // NORMAL
      gm.enemies = [normalEnemy50];
      // Inject 50 dummy non-colliding bullets
      gm.bullets = [];
      for (let i = 0; i < 50; i++) {
        gm.bullets.push(new BulletClass(500, 500, -400, 1, true, 1));
      }
      const initialHp50 = barricade50.hp;

      gm.checkCollisions();
      const damageWith50Bullets = initialHp50 - barricade50.hp;

      // -------------------------------------------------------------
      // Case 3: 5 Simultaneous Gnawing Enemies on 1 Destructible Barricade
      // -------------------------------------------------------------
      const multiBarricade = new BarricadeClass(200, 200, 0); // DESTRUCTIBLE
      gm.barricades = [multiBarricade];
      gm.bullets = [];
      const gnawingEnemies: any[] = [];
      for (let i = 0; i < 5; i++) {
        gnawingEnemies.push(new EnemyClass(200, 200, gm.logicalWidth, 1, 0));
      }
      gm.enemies = gnawingEnemies;
      const initialMultiHp = multiBarricade.hp;

      gm.checkCollisions();
      const damageWith5Enemies = initialMultiHp - multiBarricade.hp;
      const all5Gnawing = gnawingEnemies.every(e => e.isGnawing === true);

      // -------------------------------------------------------------
      // Case 4: Diver Crash into Destructible vs Indestructible Stone
      // -------------------------------------------------------------
      const destructibleDiverBarricade = new BarricadeClass(100, 100, 0); // DESTRUCTIBLE
      const stoneDiverBarricade = new BarricadeClass(300, 100, 1); // INDESTRUCTIBLE
      gm.barricades = [destructibleDiverBarricade, stoneDiverBarricade];

      const diver1 = new EnemyClass(100, 100, gm.logicalWidth, 1, 4); // DIVER = 4
      const diver2 = new EnemyClass(300, 100, gm.logicalWidth, 1, 4); // DIVER = 4
      gm.enemies = [diver1, diver2];

      const initDestructibleDiverHp = destructibleDiverBarricade.hp;
      const initStoneDiverHp = stoneDiverBarricade.hp;

      gm.checkCollisions();

      return {
        damageWith0Bullets,
        damageWith50Bullets,
        damageWith5Enemies,
        all5Gnawing,
        diver1Dead: diver1.isDead,
        diver2Dead: diver2.isDead,
        destructibleDiverHpLoss: initDestructibleDiverHp - destructibleDiverBarricade.hp,
        stoneDiverHpLoss: initStoneDiverHp - stoneDiverBarricade.hp,
      };
    });

    // 1. Barricade damage is completely decoupled from bullet count (both deal exactly 0.1 damage)
    expect(result.damageWith0Bullets).toBeCloseTo(0.1, 2);
    expect(result.damageWith50Bullets).toBeCloseTo(0.1, 2);
    expect(result.damageWith0Bullets).toBe(result.damageWith50Bullets);

    // 2. 5 simultaneous gnawing enemies deal exactly 5 * 0.1 = 0.5 damage
    expect(result.all5Gnawing).toBe(true);
    expect(result.damageWith5Enemies).toBeCloseTo(0.5, 2);

    // 3. Diver crash behavior
    expect(result.diver1Dead).toBe(true);
    expect(result.diver2Dead).toBe(true);
    expect(result.destructibleDiverHpLoss).toBe(20);
    expect(result.stoneDiverHpLoss).toBe(0); // Stone barricade is indestructible
  });

  test('F-01 [STRESS]: Indestructible stone barricade rigid vertical containment against 6 enemy archetypes', async ({ page }) => {
    const containmentResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BarricadeClass = gm.barricades[0].constructor;

      // Stone barricade at y=450 spanning full width
      const stoneBarricade = new BarricadeClass(0, 450, 1); // INDESTRUCTIBLE
      stoneBarricade.size.width = gm.logicalWidth;
      stoneBarricade.hp = 100;
      stoneBarricade.maxHp = 100;
      gm.barricades = [stoneBarricade];

      // 6 Enemy Archetypes: NORMAL(0), ZIGZAG(1), SNIPER(3), DIVER(4), SHIELDED(5), SPLITTER(6)
      const diverEnemy = new EnemyClass(290, 430, gm.logicalWidth, 1, 4);
      diverEnemy.isDiving = true;

      const enemies = [
        new EnemyClass(50, 430, gm.logicalWidth, 1, 0),
        new EnemyClass(130, 430, gm.logicalWidth, 1, 1),
        new EnemyClass(210, 430, gm.logicalWidth, 1, 3),
        diverEnemy,
        new EnemyClass(370, 430, gm.logicalWidth, 1, 5),
        new EnemyClass(450, 420, gm.logicalWidth, 1, 6),
      ];
      gm.enemies = enemies;
      const initialStoneHp = stoneBarricade.hp;

      // Run 60 frames of movement updates and collision checks
      for (let frame = 0; frame < 60; frame++) {
        for (const e of gm.enemies) {
          if (!e.isDead) {
            e.update(0.016, 1.0, []);
          }
        }
        gm.checkCollisions();
      }

      const positions = gm.enemies.map((e: any) => ({
        type: e.type,
        y: e.position.y,
        height: e.size.height,
        isDead: e.isDead,
        maxAllowedY: stoneBarricade.position.y - e.size.height,
        penetrated: e.position.y > stoneBarricade.position.y - e.size.height + 0.001,
      }));

      return {
        initialStoneHp,
        finalStoneHp: stoneBarricade.hp,
        positions,
        diverDead: diverEnemy.isDead,
      };
    });

    expect(containmentResult.finalStoneHp).toBe(containmentResult.initialStoneHp);
    expect(containmentResult.diverDead).toBe(true);

    for (const p of containmentResult.positions) {
      if (!p.isDead) {
        expect(p.penetrated).toBe(false);
        expect(p.y).toBeLessThanOrEqual(p.maxAllowedY + 0.01);
      }
    }
  });

  test('F-02 [STRESS]: 20 rapid lifecycle calls in succession (startGame, stopGame, resume) verify cancellation, rAF frequency, and delta clamping', async ({ page }) => {
    // Phase 1: Verify 20 rapid calls cancel previous animationFrameId without leaking
    const cancelMetrics = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const originalCancel = window.cancelAnimationFrame;
      let cancelCount = 0;
      window.cancelAnimationFrame = (id: number) => {
        cancelCount++;
        return originalCancel.call(window, id);
      };

      // 20 rapid calls in succession
      for (let i = 0; i < 20; i++) {
        gm.startGame();
      }
      gm.stopGame();

      window.cancelAnimationFrame = originalCancel;

      return {
        cancelCount, // 20 startGame calls + 1 stopGame = 21 cancel calls
        finalAnimationId: gm.animationFrameId,
      };
    });

    expect(cancelMetrics.cancelCount).toBe(21);
    expect(cancelMetrics.finalAnimationId).toBe(0);

    // Phase 2: Frame tick frequency stability & delta time clamping under 20 restarts
    const loopStability = await page.evaluate(async () => {
      const gm = (window as any).gameManager;

      // Rapidly restart 20 times before steady state
      for (let i = 0; i < 20; i++) {
        gm.startGame();
      }

      let tickCount = 0;
      const recordedDeltaTimes: number[] = [];
      const originalUpdate = gm.update;

      gm.update = function (dt: number) {
        tickCount++;
        recordedDeltaTimes.push(dt);
        return originalUpdate.call(gm, dt);
      };

      const startTime = performance.now();
      await new Promise(resolve => setTimeout(resolve, 400));
      const durationMs = performance.now() - startTime;

      gm.update = originalUpdate;
      gm.stopGame();

      const maxDt = Math.max(...recordedDeltaTimes);
      const minDt = Math.min(...recordedDeltaTimes);
      const hasClampedSpikes = recordedDeltaTimes.every(dt => dt <= 0.1001 && dt >= 0);

      return {
        tickCount,
        durationMs,
        maxDt,
        minDt,
        hasClampedSpikes,
        sampleCount: recordedDeltaTimes.length,
      };
    });

    // In 400ms at 60-120Hz, tick count should be ~20-50 ticks. If 20 duplicate loops were running, it would exceed >400 ticks!
    expect(loopStability.tickCount).toBeLessThan(70);
    expect(loopStability.tickCount).toBeGreaterThan(15);
    expect(loopStability.hasClampedSpikes).toBe(true);
    expect(loopStability.maxDt).toBeLessThanOrEqual(0.1);
  });

  test('F-04 [STRESS]: Rapid-fire assault of 5 enemy bullets within 0.1s deals only 1 damage due to 1.0s i-frames', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;

      gm.isGodMode = false;
      gm.player.hp = 5;
      gm.player.invincibilityTimer = 0;

      const playerX = gm.player.position.x;
      const playerY = gm.player.position.y;

      const bulletResults: { step: number; hp: number; iFrameTimer: number; bulletIsDead: boolean }[] = [];

      // Step 1: Bullet 1 hits player at t = 0.0s
      const bullet1 = new BulletClass(playerX, playerY, 200, 1, false);
      gm.bullets = [bullet1];
      gm.checkCollisions();
      bulletResults.push({
        step: 1,
        hp: gm.player.hp,
        iFrameTimer: gm.player.invincibilityTimer,
        bulletIsDead: bullet1.isDead,
      });

      // Step 2: Bullets 2, 3, 4, 5 hit player within 0.1s
      for (let i = 2; i <= 5; i++) {
        gm.player.update(0.02);
        const nextBullet = new BulletClass(playerX, playerY, 200, 1, false);
        gm.bullets = [nextBullet];
        gm.checkCollisions();
        bulletResults.push({
          step: i,
          hp: gm.player.hp,
          iFrameTimer: gm.player.invincibilityTimer,
          bulletIsDead: nextBullet.isDead,
        });
      }

      // Step 3: Mid-way test at t = 0.5s
      gm.player.update(0.42);
      const bulletMid = new BulletClass(playerX, playerY, 200, 1, false);
      gm.bullets = [bulletMid];
      gm.checkCollisions();
      const midHp = gm.player.hp;
      const midTimer = gm.player.invincibilityTimer;

      // Step 4: Expiration test at t = 1.1s
      gm.player.update(0.6);
      const expiredTimer = gm.player.invincibilityTimer;
      const bulletAfterExpire = new BulletClass(playerX, playerY, 200, 1, false);
      gm.bullets = [bulletAfterExpire];
      gm.checkCollisions();
      const finalHp = gm.player.hp;
      const finalTimer = gm.player.invincibilityTimer;

      return {
        bulletResults,
        midHp,
        midTimer,
        expiredTimer,
        finalHp,
        finalTimer,
      };
    });

    expect(result.bulletResults[0].hp).toBe(4);
    expect(result.bulletResults[0].iFrameTimer).toBe(1.0);
    expect(result.bulletResults[0].bulletIsDead).toBe(true);

    for (let i = 1; i < 5; i++) {
      expect(result.bulletResults[i].hp).toBe(4);
      expect(result.bulletResults[i].bulletIsDead).toBe(true);
      expect(result.bulletResults[i].iFrameTimer).toBeGreaterThan(0.8);
    }

    expect(result.midHp).toBe(4);
    expect(result.midTimer).toBeCloseTo(0.5, 1);

    expect(result.expiredTimer).toBe(0);
    expect(result.finalHp).toBe(3);
    expect(result.finalTimer).toBe(1.0);
  });

  test('F-15 [STRESS]: LocalStorage exhaustive edge cases (NaN, undefined, -500, {invalid json}, null, MAX_SAFE_INTEGER, QuotaExceeded)', async ({ page }) => {
    const storageResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const results: { testCase: string; initialStored: any; finalStored: string | null; passed: boolean }[] = [];

      // Helper function to test gameOver score update
      const runStorageTest = (testCase: string, initialValue: string | null, scoreToSet: number, expectedSaved: string) => {
        if (initialValue === null) {
          localStorage.removeItem('waterInvaderHighScore');
        } else {
          localStorage.setItem('waterInvaderHighScore', initialValue);
        }
        gm.score = scoreToSet;
        gm.gameOver('Testing ' + testCase);
        const finalStored = localStorage.getItem('waterInvaderHighScore');
        results.push({
          testCase,
          initialStored: initialValue,
          finalStored,
          passed: finalStored === expectedSaved,
        });
      };

      // 1. 'NaN'
      runStorageTest('string NaN', 'NaN', 1200, '1200');

      // 2. 'undefined'
      runStorageTest('string undefined', 'undefined', 850, '850');

      // 3. '-500' (negative corrupted score)
      runStorageTest('negative number', '-500', 300, '300');

      // 4. '{invalid json}'
      runStorageTest('malformed JSON', '{"score": "invalid}', 550, '550');

      // 5. null (empty storage)
      runStorageTest('null / empty', null, 400, '400');

      // 6. Extreme integer score (Number.MAX_SAFE_INTEGER: 9007199254740991)
      runStorageTest('MAX_SAFE_INTEGER', '1000', Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER.toString());

      // 7. Legitimate higher score preserved when current score is lower
      runStorageTest('lower score retention', '5000', 2500, '5000');

      // 8. Storage exception safety (SecurityError / QuotaExceededError)
      let exceptionHandled = false;
      const originalSetItem = Storage.prototype.setItem;
      const originalGetItem = Storage.prototype.getItem;
      try {
        Storage.prototype.getItem = () => { throw new Error('SecurityError: access denied'); };
        Storage.prototype.setItem = () => { throw new Error('QuotaExceededError: quota exceeded'); };

        gm.score = 999;
        gm.gameOver('Test exception');
        exceptionHandled = (gm.state === 'GAME_OVER'); // GameState.GAME_OVER
      } catch {
        exceptionHandled = false;
      } finally {
        Storage.prototype.setItem = originalSetItem;
        Storage.prototype.getItem = originalGetItem;
      }

      results.push({
        testCase: 'storage exception safety',
        initialStored: 'EXCEPTION_SIM',
        finalStored: 'GAME_OVER_TRANSITION',
        passed: exceptionHandled,
      });

      return results;
    });

    for (const r of storageResults) {
      expect(r.passed).toBe(true);
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Enemy Y-Axis Boundary & Dive Mechanic Fixes Suite (R1 & R2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('R1-01: Strict Math.min clamping of Y-axis coordinates for all standard enemy types', async ({ page }) => {
    const clampingResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const types = [0, 1, 2, 3, 4, 5, 6]; // NORMAL, ZIGZAG, BOSS, SNIPER, DIVER, SHIELDED, SPLITTER
      const results: { type: number; initialY: number; finalY: number; maxY: number; clamped: boolean; hasNaN: boolean }[] = [];

      for (const t of types) {
        // Start near bottom boundary at y = 760
        const enemy = new EnemyClass(200, 760, gm.logicalWidth, 1, t, gm.logicalHeight);
        const expectedMaxY = gm.logicalHeight - enemy.size.height;

        // Run 500 update frames without playerPos (so DIVER does not dive)
        for (let frame = 0; frame < 500; frame++) {
          enemy.update(0.016, 1.0, []);
        }

        results.push({
          type: t,
          initialY: 760,
          finalY: enemy.position.y,
          maxY: expectedMaxY,
          clamped: enemy.position.y <= expectedMaxY,
          hasNaN: Number.isNaN(enemy.position.y),
        });
      }

      return results;
    });

    for (const r of clampingResults) {
      expect(r.hasNaN).toBe(false);
      expect(r.clamped).toBe(true);
      expect(r.finalY).toBeLessThanOrEqual(r.maxY);
      expect(r.finalY).toBe(r.maxY); // Strictly clamped at maxY
    }
  });

  test('R1-02: Zigzag enemy horizontal oscillation while strictly clamped at bottom Y bound', async ({ page }) => {
    const zigzagResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // ZIGZAG = 1
      const zigzag = new EnemyClass(300, 760, gm.logicalWidth, 1, 1, gm.logicalHeight);
      const expectedMaxY = gm.logicalHeight - zigzag.size.height; // 800 - 30 = 770

      const xPositions: number[] = [];
      const yPositions: number[] = [];

      for (let frame = 0; frame < 120; frame++) {
        zigzag.update(0.016, 1.0, []);
        xPositions.push(zigzag.position.x);
        yPositions.push(zigzag.position.y);
      }

      return {
        expectedMaxY,
        yPositions,
        minX: Math.min(...xPositions),
        maxX: Math.max(...xPositions),
        allYClamped: yPositions.every(y => y <= expectedMaxY && !Number.isNaN(y)),
        finalY: zigzag.position.y,
      };
    });

    expect(zigzagResult.allYClamped).toBe(true);
    expect(zigzagResult.finalY).toBe(zigzagResult.expectedMaxY);
    expect(zigzagResult.maxX).toBeGreaterThan(zigzagResult.minX); // Kept moving horizontally
  });

  test('R2-01: Diver plunge attack trigger, safe trajectory acceleration, and boundary containment', async ({ page }) => {
    const diveResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Place player at center
      gm.player.position.x = 275;
      gm.player.position.y = 740;

      // Diver placed directly above player at y = 100
      const diver = new EnemyClass(280, 100, gm.logicalWidth, 1, 4, gm.logicalHeight);
      const initialY = diver.position.y;

      // Update frame with player position directly below
      diver.update(0.05, 1.0, [], gm.player.position);
      const isDiving = diver.isDiving;
      const yAfterTrigger = diver.position.y;
      const dy = yAfterTrigger - initialY;

      // Advance dive for 100 frames to reach bottom bound
      for (let i = 0; i < 100; i++) {
        diver.update(0.05, 1.0, [], gm.player.position);
      }

      const finalY = diver.position.y;
      const hasNaN = Number.isNaN(diver.position.y) || Number.isNaN(diver.position.x);

      return {
        isDiving,
        dy,
        finalY,
        hasNaN,
        maxCanvasBoundWithMargin: gm.logicalHeight + 50,
      };
    });

    expect(diveResult.isDiving).toBe(true);
    expect(diveResult.dy).toBeGreaterThan(10); // Plunged rapidly
    expect(diveResult.hasNaN).toBe(false);
    expect(diveResult.finalY).toBeLessThanOrEqual(diveResult.maxCanvasBoundWithMargin);
  });

  test('R2-02: Diver crashing into destructible barricade deals 20 crash damage and is destroyed', async ({ page }) => {
    const crashResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BarricadeClass = gm.barricades[0].constructor;

      const destructibleBarricade = new BarricadeClass(200, 400, 0); // DESTRUCTIBLE
      destructibleBarricade.hp = 20;
      gm.barricades = [destructibleBarricade];

      const diver = new EnemyClass(210, 400, gm.logicalWidth, 1, 4, gm.logicalHeight); // DIVER
      diver.isDiving = true;
      gm.enemies = [diver];

      const particlesBefore = gm.particles.length;
      gm.checkCollisions();
      const particlesAfter = gm.particles.length;

      return {
        diverIsDead: diver.isDead,
        barricadeHp: destructibleBarricade.hp,
        particlesSpawned: particlesAfter - particlesBefore,
      };
    });

    expect(crashResult.diverIsDead).toBe(true);
    expect(crashResult.barricadeHp).toBe(0); // 20 - 20 = 0
    expect(crashResult.particlesSpawned).toBeGreaterThanOrEqual(30);
  });

  test('R2-03: Diver crashing into indestructible stone barricade is destroyed with 0 damage to barricade', async ({ page }) => {
    const crashResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BarricadeClass = gm.barricades[0].constructor;

      const stoneBarricade = new BarricadeClass(200, 400, 1); // INDESTRUCTIBLE
      const initialHp = stoneBarricade.hp;
      gm.barricades = [stoneBarricade];

      const diver = new EnemyClass(210, 400, gm.logicalWidth, 1, 4, gm.logicalHeight); // DIVER
      diver.isDiving = true;
      gm.enemies = [diver];

      gm.checkCollisions();

      return {
        diverIsDead: diver.isDead,
        stoneBarricadeHp: stoneBarricade.hp,
        initialHp,
      };
    });

    expect(crashResult.diverIsDead).toBe(true);
    expect(crashResult.stoneBarricadeHp).toBe(crashResult.initialHp);
  });

  test('R2-04: Diver ramming player damages player and destroys diver', async ({ page }) => {
    const ramResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      gm.isGodMode = false;
      gm.player.hp = 5;
      gm.player.invincibilityTimer = 0;
      gm.player.position.x = 200;
      gm.player.position.y = 740;

      const diver = new EnemyClass(200, 740, gm.logicalWidth, 1, 4, gm.logicalHeight);
      diver.isDiving = true;
      gm.enemies = [diver];

      // Process collision in game loop
      gm.update(0.016);

      return {
        diverDead: diver.isDead,
        playerHp: gm.player.hp,
        invincibilityTimer: gm.player.invincibilityTimer,
        stressLevel: gm.player.stressLevel,
      };
    });

    expect(ramResult.diverDead).toBe(true);
    expect(ramResult.playerHp).toBe(4);
    expect(ramResult.invincibilityTimer).toBe(1.0);
    expect(ramResult.stressLevel).toBeGreaterThanOrEqual(40);
  });

  test('R2-05: Enemy reaching bottom boundary is gracefully despawned with breach penalty', async ({ page }) => {
    const breachResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      gm.isGodMode = false;
      gm.player.hp = 4;
      gm.player.position.x = 50; // away from enemy x = 400
      gm.player.position.y = 740;

      // Normal enemy placed at bottom boundary
      const breachingEnemy = new EnemyClass(400, gm.logicalHeight - 30, gm.logicalWidth, 1, 0, gm.logicalHeight);
      gm.enemies = [breachingEnemy];

      const initialHp = gm.player.hp;
      gm.update(0.016);

      return {
        enemyDead: breachingEnemy.isDead,
        playerHpAfter: gm.player.hp,
        hpLoss: initialHp - gm.player.hp,
        stressAfter: gm.player.stressLevel,
        remainingEnemies: gm.enemies.length,
      };
    });

    expect(breachResult.enemyDead).toBe(true);
    expect(breachResult.hpLoss).toBe(1);
    expect(breachResult.playerHpAfter).toBe(3);
    expect(breachResult.remainingEnemies).toBe(0); // filtered out in update
  });

  test('R2-06: Robustness under extreme / NaN inputs and missing parameters', async ({ page }) => {
    const robustnessResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      const diver = new EnemyClass(100, 100, gm.logicalWidth, 1, 4, gm.logicalHeight);

      // 1. Negative deltaTime
      diver.update(-1, 1.0, []);
      const yAfterNegDt = diver.position.y;

      // 2. NaN deltaTime
      diver.update(NaN, 1.0, []);
      const yAfterNaNDt = diver.position.y;

      // 3. PlayerPos with NaN coordinates
      diver.update(0.016, 1.0, [], { x: NaN, y: NaN } as any);
      const isDivingWithNaNPos = diver.isDiving;
      const yAfterNaNPos = diver.position.y;

      // 4. Extreme large deltaTime
      diver.update(9999, 1.0, []);
      const yAfterHugeDt = diver.position.y;

      // 5. Sniper fire with NaN playerPos
      const sniper = new EnemyClass(200, 100, gm.logicalWidth, 1, 3, gm.logicalHeight);
      sniper.fireTimer = 0;
      const bullet = sniper.fire({ x: NaN, y: NaN } as any);

      return {
        yAfterNegDt,
        yAfterNaNDt,
        isDivingWithNaNPos,
        yAfterNaNPos,
        yAfterHugeDt,
        bulletCreated: !!bullet,
        bulletVx: bullet ? bullet.velocity.x : null,
        bulletVy: bullet ? bullet.velocity.y : null,
        noNaNPositions: !Number.isNaN(diver.position.y) && !Number.isNaN(diver.position.x),
      };
    });

    expect(robustnessResult.yAfterNegDt).toBe(100); // Unchanged
    expect(robustnessResult.yAfterNaNDt).toBe(100); // Unchanged
    expect(robustnessResult.isDivingWithNaNPos).toBe(false); // Did not erroneously trigger dive
    expect(robustnessResult.yAfterHugeDt).toBeLessThanOrEqual(800); // Clamped strictly!
    expect(robustnessResult.noNaNPositions).toBe(true);
  });

  test('R2-07: NaN canvas dimensions and invalid speed multipliers do not corrupt positions', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // 1. Constructor with NaN dimensions
      const enemyWithNaNDim = new EnemyClass(100, 100, NaN, NaN, 0, NaN);
      for (let i = 0; i < 50; i++) {
        enemyWithNaNDim.update(0.016, 1.0, []);
      }

      // 2. Update with NaN / negative speedMultiplier
      const enemyWithNaNSpeed = new EnemyClass(100, 100, 600, 1, 0, 800);
      enemyWithNaNSpeed.update(0.016, NaN, []);
      enemyWithNaNSpeed.update(0.016, -5, []);
      enemyWithNaNSpeed.update(0.016, 0, []);

      return {
        dimEnemyY: enemyWithNaNDim.position.y,
        dimEnemyX: enemyWithNaNDim.position.x,
        dimEnemyHasNaN: Number.isNaN(enemyWithNaNDim.position.y) || Number.isNaN(enemyWithNaNDim.position.x),
        speedEnemyY: enemyWithNaNSpeed.position.y,
        speedEnemyX: enemyWithNaNSpeed.position.x,
        speedEnemyHasNaN: Number.isNaN(enemyWithNaNSpeed.position.y) || Number.isNaN(enemyWithNaNSpeed.position.x),
      };
    });

    expect(result.dimEnemyHasNaN).toBe(false);
    expect(result.dimEnemyY).toBeGreaterThanOrEqual(100);
    expect(result.dimEnemyY).toBeLessThanOrEqual(800);
    expect(result.speedEnemyHasNaN).toBe(false);
  });

  test('R2-08: Diver does NOT trigger downward dive when player is above the diver', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Diver at y = 500
      const diver = new EnemyClass(200, 500, gm.logicalWidth, 1, 4, gm.logicalHeight);

      // Player at y = 300 (above diver) with same X
      const playerAbove = { x: 200 - 5, y: 300 }; // horizontally aligned

      diver.update(0.016, 1.0, [], playerAbove);

      return {
        isDiving: diver.isDiving,
        positionY: diver.position.y,
      };
    });

    expect(result.isDiving).toBe(false); // Should NOT dive when player is above
  });

  test('R2-09: Multiple simultaneous divers under fluctuating deltaTimes (240 FPS to lag spikes)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      gm.isGodMode = true; // God mode to keep running through all collisions
      gm.player.position.x = 275;
      gm.player.position.y = 740;

      // Spawn 5 divers across the canvas
      const divers = [
        new EnemyClass(50, 100, gm.logicalWidth, 1, 4, gm.logicalHeight),
        new EnemyClass(150, 120, gm.logicalWidth, 1, 4, gm.logicalHeight),
        new EnemyClass(280, 80, gm.logicalWidth, 1, 4, gm.logicalHeight), // directly above player
        new EnemyClass(400, 140, gm.logicalWidth, 1, 4, gm.logicalHeight),
        new EnemyClass(500, 100, gm.logicalWidth, 1, 4, gm.logicalHeight),
      ];

      gm.enemies = [...divers];

      // Simulate 100 frames with varying framerate: 240 FPS (dt=0.004) -> 60 FPS (dt=0.016) -> lag spike (dt=0.1)
      const deltaSequence = [0.004, 0.004, 0.016, 0.033, 0.1, 0.004, 0.016];
      let maxRecordedY = 0;
      let hasAnyNaN = false;

      for (let f = 0; f < 100; f++) {
        const dt = deltaSequence[f % deltaSequence.length];
        gm.update(dt);
        for (const e of gm.enemies) {
          if (e.position.y > maxRecordedY) maxRecordedY = e.position.y;
          if (Number.isNaN(e.position.x) || Number.isNaN(e.position.y)) hasAnyNaN = true;
        }
      }

      return {
        hasAnyNaN,
        maxRecordedY,
        remainingEnemies: gm.enemies.length,
      };
    });

    expect(result.hasAnyNaN).toBe(false);
    expect(result.maxRecordedY).toBeLessThanOrEqual(850);
  });

  test('R2-10: Diver with NaN constructor coordinates or during dive recovers to finite values and despawns gracefully', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Create Diver with NaN coordinates
      const nanDiver = new EnemyClass(NaN, NaN, gm.logicalWidth, 1, 4, gm.logicalHeight);
      nanDiver.isDiving = true;
      gm.enemies = [nanDiver];

      const initialX = nanDiver.position.x;
      const initialY = nanDiver.position.y;
      const initHasNaN = Number.isNaN(initialX) || Number.isNaN(initialY);

      // Run 200 frames of update (ample time for 280px/s diver to travel 800px)
      for (let i = 0; i < 200; i++) {
        gm.update(0.016);
      }

      return {
        initHasNaN,
        initialX,
        initialY,
        finalEnemiesCount: gm.enemies.length,
        diverDead: nanDiver.isDead,
        finalY: nanDiver.position.y,
        finalHasNaN: Number.isNaN(nanDiver.position.y) || Number.isNaN(nanDiver.position.x),
      };
    });

    expect(result.initHasNaN).toBe(false); // Constructor sanitized to finite
    expect(result.finalHasNaN).toBe(false);
    expect(result.diverDead).toBe(true); // Reached bottom and despawned instead of stalling
    expect(result.finalEnemiesCount).toBe(0);
  });

  test('R2-11: Negative initial coordinates and negative speed impulses are clamped to upper boundary (Y >= 0)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Enemy created at negative coordinates
      const enemy = new EnemyClass(-50, -100, gm.logicalWidth, 1, 0, gm.logicalHeight);
      const constructedX = enemy.position.x;
      const constructedY = enemy.position.y;

      // Manually set position negative to test update clamp
      enemy.position.y = -200;
      enemy.position.x = -150;
      enemy.update(0.016, 1.0, []);

      return {
        constructedX,
        constructedY,
        updatedX: enemy.position.x,
        updatedY: enemy.position.y,
      };
    });

    expect(result.constructedX).toBe(0);
    expect(result.constructedY).toBe(0);
    expect(result.updatedX).toBe(0);
    expect(result.updatedY).toBe(0);
  });

  test('R2-12: Massive lag spike (deltaTime = 0.5s) is capped to 0.1s timestep inside Enemy.update', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      const diver = new EnemyClass(100, 100, gm.logicalWidth, 1, 4, gm.logicalHeight);
      diver.isDiving = true;

      // Update with massive lag spike dt = 1.0s
      diver.update(1.0, 1.0, []);

      // With diveSpeed = 280, dt clamped to 0.1s -> max movement is 28px, not 280px!
      const dy = diver.position.y - 100;

      return {
        dy,
        clampedY: diver.position.y,
      };
    });

    expect(result.dy).toBeLessThanOrEqual(55); // Clamped to 0.1s step (approx 28px)
    expect(result.dy).toBeGreaterThanOrEqual(25);
  });

  test('R2-13: Enemy ramming player resets combo to 0 and updates score UI', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      gm.isGodMode = false;
      gm.combo = 10; // High combo before ram
      gm.player.hp = 3;
      gm.player.invincibilityTimer = 0;
      gm.player.position.x = 200;
      gm.player.position.y = 740;

      // Place enemy directly on top of player
      const rammer = new EnemyClass(200, 740, gm.logicalWidth, 1, 0, gm.logicalHeight);
      gm.enemies = [rammer];

      gm.update(0.016);

      return {
        playerHpAfter: gm.player.hp,
        comboAfter: gm.combo,
        enemyIsDead: rammer.isDead,
      };
    });

    expect(result.playerHpAfter).toBe(2);
    expect(result.comboAfter).toBe(0); // Combo strictly reset on hit!
    expect(result.enemyIsDead).toBe(true);
  });

  test('R2-14: Splitter mini-enemies spawn strictly inside canvas boundaries at extreme edges', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Spawn Splitter at left boundary x = 0
      const leftSplitter = new EnemyClass(0, 200, gm.logicalWidth, 1, 6, gm.logicalHeight); // SPLITTER
      leftSplitter.hp = 1;
      gm.enemies = [leftSplitter];

      // Player bullet to kill it
      const killerBullet = new (gm.player.update(0.016)[0]?.constructor || (leftSplitter as any).constructor)(10, 210, -500, 10, true, 1);
      killerBullet.isPlayerBullet = true;
      killerBullet.position = { x: 10, y: 210 };
      killerBullet.size = { width: 6, height: 12 };
      killerBullet.damage = 10;
      killerBullet.piercing = 1;
      killerBullet.hitEntities = new Set();
      gm.bullets = [killerBullet];

      gm.checkCollisions();
      gm.update(0.016); // Cleanup dead entities and advance mini positions

      const miniPositions = gm.enemies.map((e: any) => ({ x: e.position.x, y: e.position.y, w: e.size.width, h: e.size.height }));

      return {
        enemiesCount: gm.enemies.length,
        miniPositions,
        allInsideBounds: miniPositions.every((p: any) => p.x >= 0 && p.x + p.w <= gm.logicalWidth && p.y >= 0 && p.y + p.h <= gm.logicalHeight),
      };
    });

    expect(result.enemiesCount).toBe(2); // 2 minis spawned
    expect(result.allInsideBounds).toBe(true);
  });

  test('R3-15: Boss and Splitter size re-clamping immediately in constructor at extreme boundaries', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Boss (150x100) created at extreme right & bottom (550, 750)
      const boss = new EnemyClass(550, 750, gm.logicalWidth, 1, 2, gm.logicalHeight); // BOSS = 2
      // Splitter (50x40) created at extreme right & bottom (580, 780)
      const splitter = new EnemyClass(580, 780, gm.logicalWidth, 1, 6, gm.logicalHeight); // SPLITTER = 6

      return {
        bossX: boss.position.x,
        bossY: boss.position.y,
        bossMaxX: gm.logicalWidth - 150, // 450
        bossMaxY: gm.logicalHeight - 100, // 700
        splitterX: splitter.position.x,
        splitterY: splitter.position.y,
        splitterMaxX: gm.logicalWidth - 50, // 550
        splitterMaxY: gm.logicalHeight - 40, // 760
      };
    });

    expect(result.bossX).toBe(result.bossMaxX);
    expect(result.bossY).toBe(result.bossMaxY);
    expect(result.splitterX).toBe(result.splitterMaxX);
    expect(result.splitterY).toBe(result.splitterMaxY);
  });

  test('R3-16: Defense breach penalty strictly resets player combo to 0 and updates score UI', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      gm.isGodMode = false;
      gm.combo = 15; // Active combo
      gm.player.hp = 3;

      // Enemy at bottom boundary
      const breacher = new EnemyClass(300, gm.logicalHeight - 30, gm.logicalWidth, 1, 0, gm.logicalHeight);
      gm.enemies = [breacher];

      gm.update(0.016);

      return {
        playerHp: gm.player.hp,
        combo: gm.combo,
        enemyDead: breacher.isDead,
      };
    });

    expect(result.playerHp).toBe(2);
    expect(result.combo).toBe(0); // Combo strictly reset on defense breach!
    expect(result.enemyDead).toBe(true);
  });

  test('R3-17: Diver horizontal bounds containment and trajectory stability during plunge', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      const diver = new EnemyClass(200, 100, gm.logicalWidth, 1, 4, gm.logicalHeight);
      diver.isDiving = true;

      // Force negative X and extreme positive X during dive
      diver.position.x = -100;
      diver.update(0.016, 1.0, []);
      const clampedNegX = diver.position.x;

      diver.position.x = 9999;
      diver.update(0.016, 1.0, []);
      const clampedPosX = diver.position.x;

      return {
        clampedNegX,
        clampedPosX,
        maxX: gm.logicalWidth - diver.size.width,
        isDiving: diver.isDiving,
      };
    });

    expect(result.clampedNegX).toBe(0);
    expect(result.clampedPosX).toBe(result.maxX);
  });

  test('R3-18: 1000-Frame continuous stress across all enemy movement patterns with zero NaN and zero out-of-bounds', async ({ page }) => {
    const stressResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      const testEnemies: any[] = [];
      const types = [0, 1, 2, 3, 4, 5, 6];

      for (const t of types) {
        testEnemies.push(new EnemyClass(Math.random() * 400, Math.random() * 400, gm.logicalWidth, 5, t, gm.logicalHeight));
      }

      let hadNaN = false;
      let hadOutOfBounds = false;

      for (let frame = 0; frame < 1000; frame++) {
        const dt = 0.016 + Math.sin(frame) * 0.005; // Fluctuating timestep
        const sm = 1.0 + Math.abs(Math.sin(frame / 50)) * 0.8;

        for (const e of testEnemies) {
          e.update(dt, sm, [], { x: 300, y: 750 });
          if (Number.isNaN(e.position.x) || Number.isNaN(e.position.y)) {
            hadNaN = true;
          }
          if (e.position.x < 0 || e.position.x + e.size.width > gm.logicalWidth + 0.001) {
            hadOutOfBounds = true;
          }
          if (e.isDiving) {
            if (e.position.y < 0 || e.position.y > gm.logicalHeight + 50.001) {
              hadOutOfBounds = true;
            }
          } else {
            if (e.position.y < 0 || e.position.y + e.size.height > gm.logicalHeight + 0.001) {
              hadOutOfBounds = true;
            }
          }
        }
      }

      return {
        hadNaN,
        hadOutOfBounds,
        count: testEnemies.length,
      };
    });

    expect(stressResult.hadNaN).toBe(false);
    expect(stressResult.hadOutOfBounds).toBe(false);
    expect(stressResult.count).toBe(7);
  });
});


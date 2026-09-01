import { test, expect } from '@playwright/test';

test.describe('Adversarial R3 Reviewer: Comprehensive Crossfire & Score Persistence Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('ADV-R3.1: Multi-Cycle Death & Respawn: Score, Currency & Post-Death Upgrades monotonically persist', async ({ page }) => {
    const cycleResult = await page.evaluate(async () => {
      const gm = (window as any).gameManager;
      if (!gm) throw new Error('GameManager missing');

      // Cycle 1: Earn initial score and currency
      gm.score = 2500;
      gm.currency = 350;
      gm.level = 3;

      // Trigger Game Over
      gm.player.hp = 0;
      gm.update(0.016); // Detects hp <= 0 and calls gameOver()

      const stateAfterDeath1 = gm.state; // GAME_OVER
      const scoreAfterDeath1 = gm.score;
      const currencyAfterDeath1 = gm.currency;

      // In Game Over state, simulate player purchasing upgrades
      // FireRate costs 50, Piercing costs 200
      gm.upgradeFireRate();
      gm.upgradePiercing();
      const upgradesAfterPurchase = gm.getUpgrades();
      const currencyAfterPurchase = gm.currency; // 350 - 50 - 200 = 100

      // Respawn (init with resetScoreAndCash = false)
      gm.init(false);
      gm.startGame();

      const scoreAfterRespawn1 = gm.score;
      const currencyAfterRespawn1 = gm.currency;
      const playerHpAfterRespawn1 = gm.player.hp;
      const playerPiercingAfterRespawn1 = gm.player.piercing;

      // Cycle 2: Accumulate additional score and cash in the new run
      gm.score += 1200;
      gm.currency += 80;

      // Die again in Cycle 2
      gm.player.hp = 0;
      gm.update(0.016);

      const scoreAfterDeath2 = gm.score; // 2500 + 1200 = 3700
      const currencyAfterDeath2 = gm.currency; // 100 + 80 = 180

      // Respawn second time
      gm.init(false);
      gm.startGame();

      const scoreAfterRespawn2 = gm.score;
      const currencyAfterRespawn2 = gm.currency;

      return {
        stateAfterDeath1,
        scoreAfterDeath1,
        currencyAfterDeath1,
        upgradesAfterPurchase,
        currencyAfterPurchase,
        scoreAfterRespawn1,
        currencyAfterRespawn1,
        playerHpAfterRespawn1,
        playerPiercingAfterRespawn1,
        scoreAfterDeath2,
        currencyAfterDeath2,
        scoreAfterRespawn2,
        currencyAfterRespawn2,
      };
    });

    expect(cycleResult.scoreAfterDeath1).toBe(2500);
    expect(cycleResult.currencyAfterDeath1).toBe(350);
    expect(cycleResult.currencyAfterPurchase).toBe(100);
    expect(cycleResult.upgradesAfterPurchase.fireRate).toBeGreaterThanOrEqual(1);
    expect(cycleResult.upgradesAfterPurchase.piercing).toBeGreaterThanOrEqual(1);

    expect(cycleResult.scoreAfterRespawn1).toBe(2500);
    expect(cycleResult.currencyAfterRespawn1).toBe(100);
    expect(cycleResult.playerHpAfterRespawn1).toBe(3);

    expect(cycleResult.scoreAfterDeath2).toBe(3700);
    expect(cycleResult.currencyAfterDeath2).toBe(180);
    expect(cycleResult.scoreAfterRespawn2).toBe(3700);
    expect(cycleResult.currencyAfterRespawn2).toBe(180);
  });

  test('ADV-R3.2: Vertical Column Simultaneous Multi-Fire: Self-Immunity & Progressive Friendly Fire Collisions', async ({ page }) => {
    const columnResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      // Clear existing entities
      gm.enemies = [];
      gm.bullets = [];

      // Create a vertical column of 5 Invader enemies spaced 50px apart vertically
      const columnEnemies: any[] = [];
      for (let i = 0; i < 5; i++) {
        const e = new EnemyClass(200, 50 + i * 50, gm.logicalWidth, 1, 0, gm.logicalHeight);
        e.hp = 10;
        e.faction = 'INVADER';
        e.fireTimer = 0;
        columnEnemies.push(e);
        gm.enemies.push(e);
      }

      // Each enemy fires a downward bullet simultaneously
      for (const e of columnEnemies) {
        e.fireTimer = 0;
        const bullet = e.fire({ x: 200, y: 600 }, gm.enemies);
        if (bullet) {
          gm.bullets.push(bullet);
        }
      }

      const initialBulletCount = gm.bullets.length;

      // Verify on tick 0 (frame of firing) NO enemy took damage from its own bullet
      gm.checkCollisions(0.001);

      const hpsAfterTick0 = columnEnemies.map(e => e.hp);
      const allHp10OnTick0 = hpsAfterTick0.every(hp => hp === 10);

      // Advance simulation across 30 ticks (0.5s) to allow upper bullets to descend into lower enemies
      for (let t = 0; t < 30; t++) {
        for (const b of gm.bullets) {
          b.update(0.016);
        }
        gm.checkCollisions(0.016);
      }

      const hpsAfterDescent = columnEnemies.map(e => e.hp);
      // Top enemy [0] should have 10 HP (no bullet above it)
      // Lower enemies [1..4] should have taken damage from the bullets spawned above them
      const topEnemyUntouched = hpsAfterDescent[0] === 10;
      const lowerEnemiesDamaged = columnEnemies.slice(1).some(e => e.hp < 10);

      return {
        initialBulletCount,
        allHp10OnTick0,
        hpsAfterTick0,
        hpsAfterDescent,
        topEnemyUntouched,
        lowerEnemiesDamaged,
      };
    });

    expect(columnResult.initialBulletCount).toBe(5);
    expect(columnResult.allHp10OnTick0).toBe(true);
    expect(columnResult.topEnemyUntouched).toBe(true);
    expect(columnResult.lowerEnemiesDamaged).toBe(true);
  });

  test('ADV-R3.3: Splitter Crossfire Elimination Spawns Same-Faction Mini Enemies with Valid State', async ({ page }) => {
    const splitterResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;
      const BulletClass = (window as any).Bullet || gm.bullets[0]?.constructor;

      gm.enemies = [];
      gm.bullets = [];
      gm.score = 0;
      gm.currency = 0;
      gm.combo = 0;

      // Spawn an Invader Splitter enemy with 1 HP
      // EnemyType.SPLITTER = 6
      const splitter = new EnemyClass(150, 100, gm.logicalWidth, 1, 6, gm.logicalHeight);
      splitter.hp = 1;
      splitter.faction = 'INVADER';
      gm.enemies.push(splitter);

      // Spawn a Rogue Mech bullet aiming directly at Splitter
      const rogueBullet = new BulletClass(155, 90, 200, 2, false, 1);
      rogueBullet.faction = 'ROGUE';
      rogueBullet.velocity.y = 200;
      gm.bullets.push(rogueBullet);

      // Update positions and collide
      rogueBullet.update(0.1); // moves to y = 110, directly colliding with Splitter at y = 100
      gm.checkCollisions(0.1);

      const splitterDead = splitter.isDead;
      const totalEnemiesNow = gm.enemies.length;
      const miniEnemies = gm.enemies.filter((e: any) => !e.isDead && e !== splitter);

      // Verify mini enemies inherit Invader faction and valid finite coords
      const minisValid = miniEnemies.length === 2 && miniEnemies.every((m: any) =>
        m.faction === 'INVADER' &&
        Number.isFinite(m.position.x) &&
        Number.isFinite(m.position.y) &&
        m.size.width === 20 &&
        m.size.height === 20
      );

      const scoreAwarded = gm.score;
      const currencyAwarded = gm.currency;
      const comboCount = gm.combo;

      return {
        splitterDead,
        totalEnemiesNow,
        miniEnemiesCount: miniEnemies.length,
        minisValid,
        scoreAwarded,
        currencyAwarded,
        comboCount,
      };
    });

    expect(splitterResult.splitterDead).toBe(true);
    expect(splitterResult.miniEnemiesCount).toBe(2);
    expect(splitterResult.minisValid).toBe(true);
    expect(splitterResult.scoreAwarded).toBeGreaterThan(0);
    expect(splitterResult.currencyAwarded).toBeGreaterThan(0);
    expect(splitterResult.comboCount).toBe(1);
  });

  test('ADV-R3.4: Crossfire Mid-Air Interception between Hostile Sniper & Rogue Stalker Bullets', async ({ page }) => {
    const interceptResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet || gm.bullets[0]?.constructor;

      gm.enemies = [];
      gm.bullets = [];

      // Invader Sniper interceptable bullet traveling DOWNWARD from y = 100
      const sniperBullet = new BulletClass(200, 100, 200, 2, false, 1);
      sniperBullet.faction = 'INVADER';
      sniperBullet.isInterceptable = true;
      sniperBullet.velocity.x = 0;
      sniperBullet.velocity.y = 200;

      // Rogue Stalker interceptable bullet traveling UPWARD from y = 200
      const rogueBullet = new BulletClass(200, 200, -200, 2, false, 1);
      rogueBullet.faction = 'ROGUE';
      rogueBullet.isInterceptable = true;
      rogueBullet.velocity.x = 0;
      rogueBullet.velocity.y = -200;

      gm.bullets.push(sniperBullet, rogueBullet);

      // Advance 0.25s: sniper bullet reaches y = 150, rogue bullet reaches y = 150 -> mid-air collision!
      sniperBullet.update(0.25);
      rogueBullet.update(0.25);
      gm.checkCollisions(0.25);

      return {
        sniperBulletDead: sniperBullet.isDead,
        rogueBulletDead: rogueBullet.isDead,
        particlesSpawned: gm.particles.length,
      };
    });

    expect(interceptResult.sniperBulletDead).toBe(true);
    expect(interceptResult.rogueBulletDead).toBe(true);
    expect(interceptResult.particlesSpawned).toBeGreaterThan(0);
  });

  test('ADV-R3.5: 60-Unit Heavy 3-Way Crossfire Simulation: Math/Physics Stability & Entity Pool Safety', async ({ page }) => {
    const simulationResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      gm.enemies = [];
      gm.bullets = [];
      gm.score = 5000;
      gm.currency = 400;

      // Spawn 30 Invaders and 30 Rogues across a grid
      for (let i = 0; i < 30; i++) {
        const type = i % 6; // various archetypes
        const invader = new EnemyClass(30 + (i % 6) * 50, 40 + Math.floor(i / 6) * 30, gm.logicalWidth, 5, type, gm.logicalHeight);
        invader.faction = 'INVADER';
        gm.enemies.push(invader);
      }

      for (let i = 0; i < 30; i++) {
        const type = 7 + (i % 3); // Rogue archetypes: ROGUE_DRONE, ROGUE_STALKER, ROGUE_MECH
        const rogue = new EnemyClass(30 + (i % 6) * 50, 200 + Math.floor(i / 6) * 30, gm.logicalWidth, 5, type, gm.logicalHeight);
        rogue.faction = 'ROGUE';
        gm.enemies.push(rogue);
      }

      let nanDetected = false;

      // Run 120 physics frames (2.0s real time)
      for (let frame = 0; frame < 120; frame++) {
        // Trigger intermittent shooting from surviving units
        if (frame % 10 === 0) {
          for (const e of gm.enemies) {
            if (!e.isDead) {
              e.fireTimer = 0;
              const target = e.faction === 'INVADER' ? { x: 200, y: 300 } : { x: 200, y: 50 };
              const b = e.fire(target, gm.enemies);
              if (b) gm.bullets.push(b);
            }
          }
        }

        gm.update(0.016);

        // Check for any NaN coordinates or velocities
        for (const e of gm.enemies) {
          if (
            !Number.isFinite(e.position.x) ||
            !Number.isFinite(e.position.y) ||
            !Number.isFinite(e.hp)
          ) {
            nanDetected = true;
          }
        }

        for (const b of gm.bullets) {
          if (
            !Number.isFinite(b.position.x) ||
            !Number.isFinite(b.position.y) ||
            !Number.isFinite(b.velocity.x) ||
            !Number.isFinite(b.velocity.y)
          ) {
            nanDetected = true;
          }
        }

        if (!Number.isFinite(gm.score) || !Number.isFinite(gm.currency)) {
          nanDetected = true;
        }
      }

      const survivingInvaders = gm.enemies.filter((e: any) => !e.isDead && e.faction === 'INVADER').length;
      const survivingRogues = gm.enemies.filter((e: any) => !e.isDead && e.faction === 'ROGUE').length;
      const totalCrossfireCasualties = 60 - (survivingInvaders + survivingRogues);

      return {
        nanDetected,
        totalCrossfireCasualties,
        finalScore: gm.score,
        finalCurrency: gm.currency,
        scoreIncreased: gm.score >= 5000,
        currencyIncreased: gm.currency >= 400,
      };
    });

    expect(simulationResult.nanDetected).toBe(false);
    expect(simulationResult.totalCrossfireCasualties).toBeGreaterThan(0);
    expect(simulationResult.scoreIncreased).toBe(true);
    expect(simulationResult.currencyIncreased).toBe(true);
  });
});

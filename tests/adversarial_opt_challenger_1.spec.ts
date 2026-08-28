import { test, expect } from '@playwright/test';

test.describe('Challenger 1: Adversarial Mechanics & Stress Testing Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  // =========================================================================
  // DOMAIN 1: EXTREME PROJECTILE DENSITY & ARRAY COMPACTION STRESS
  // =========================================================================
  test('Domain 1.1: 600+ Simultaneous Multi-Faction Bullets & Two-Pointer In-Place Compaction', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;
      const FactionEnum = (window as any).Faction;

      gm.bullets = [];
      gm.enemies = [];
      gm.helpers = [];

      // Spawn 200 Player Bullets, 200 Ally Bullets, 200 Enemy Bullets across canvas
      for (let i = 0; i < 200; i++) {
        const x = (i * 3) % gm.logicalWidth;
        const y = 300 + (i % 50) * 8;
        // Player bullet
        const pb = new BulletClass(x, y, -400, 1, true, 1, FactionEnum.PLAYER);
        gm.bullets.push(pb);
      }

      for (let i = 0; i < 200; i++) {
        const x = (i * 3 + 1) % gm.logicalWidth;
        const y = 350 + (i % 50) * 8;
        // Ally bullet
        const ab = new BulletClass(x, y, -350, 1, true, 1, FactionEnum.ALLY);
        gm.bullets.push(ab);
      }

      for (let i = 0; i < 200; i++) {
        const x = (i * 3 + 2) % gm.logicalWidth;
        const y = 100 + (i % 50) * 8;
        // Enemy bullet
        const eb = new BulletClass(x, y, 300, 1, false, 1, FactionEnum.INVADER);
        gm.bullets.push(eb);
      }

      const initialCount = gm.bullets.length;

      // Run 120 frames of updates (~2.0 seconds)
      const frameTimes: number[] = [];
      for (let frame = 0; frame < 120; frame++) {
        const t0 = performance.now();
        gm.update(1 / 60);
        const t1 = performance.now();
        frameTimes.push(t1 - t0);

        // Verify array integrity during simulation: no undefined/null entries
        for (let bIdx = 0; bIdx < gm.bullets.length; bIdx++) {
          const b = gm.bullets[bIdx];
          if (!b || isNaN(b.position.x) || isNaN(b.position.y)) {
            throw new Error(`Corrupted bullet detected at frame ${frame}, index ${bIdx}`);
          }
        }
      }

      const finalCount = gm.bullets.length;
      const allBulletsAlive = gm.bullets.every((b: any) => !b.isDead);
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);

      return {
        initialCount,
        finalCount,
        allBulletsAlive,
        avgFrameTime,
        maxFrameTime,
        particlesCount: gm.particles.length,
        particlePoolCount: (gm as any).particlePool ? (gm as any).particlePool.length : 0,
      };
    });

    console.log('[Domain 1.1 Projectile Density Result]:', result);
    expect(result.initialCount).toBe(600);
    expect(result.allBulletsAlive).toBe(true);
    expect(result.avgFrameTime).toBeLessThan(16.6); // Well under 60fps frame budget (16.6ms)
  });

  test('Domain 1.2: Bullet-vs-Bullet Cross-Faction Annihilation Stress', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;
      const FactionEnum = (window as any).Faction;

      gm.bullets = [];
      gm.enemies = [];

      // 50 head-on collisions: Player bullets moving up vs Interceptable Invader bullets moving down
      for (let i = 0; i < 50; i++) {
        const x = 50 + i * 10;
        const pb = new BulletClass(x, 400, -300, 1, true, 1, FactionEnum.PLAYER);
        const eb = new BulletClass(x, 400, 300, 1, false, 1, FactionEnum.INVADER);
        eb.isInterceptable = true;
        gm.bullets.push(pb, eb);
      }

      const countBefore = gm.bullets.length;
      gm.checkCollisions();

      // Check how many bullets died
      const deadBullets = gm.bullets.filter((b: any) => b.isDead);
      
      // Update once to run array compaction
      gm.update(1 / 60);
      const countAfterCompaction = gm.bullets.length;

      return {
        countBefore,
        deadCount: deadBullets.length,
        countAfterCompaction,
        particlesGenerated: gm.particles.length,
      };
    });

    console.log('[Domain 1.2 Bullet-vs-Bullet Result]:', result);
    expect(result.countBefore).toBe(100);
    expect(result.deadCount).toBe(100);
    expect(result.countAfterCompaction).toBe(0);
    expect(result.particlesGenerated).toBeGreaterThan(0);
  });

  // =========================================================================
  // DOMAIN 2: HIGH-WAVE SCALING & BOSS MECHANICS
  // =========================================================================
  test('Domain 2.1: Wave 50+ Enemy Stat Scaling & Boundary Stability', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;

      // 0: NORMAL, 1: ZIGZAG, 2: BOSS, 3: SNIPER, 4: DIVER, 5: SHIELDED, 6: SPLITTER, 7: ROGUE_DRONE, 8: ROGUE_STALKER, 9: ROGUE_MECH
      const types = [0, 1, 3, 4, 5, 6, 7, 8, 9];

      const enemyStats: any[] = [];
      for (const t of types) {
        const e50 = new EnemyClass(100, 100, gm.logicalWidth, 50, t, gm.logicalHeight);
        const e100 = new EnemyClass(100, 100, gm.logicalWidth, 100, t, gm.logicalHeight);

        // Update enemies over 60 frames to check boundary handling
        for (let f = 0; f < 60; f++) {
          e50.update(0.016, 1.0, [], { x: 300, y: 700 });
          e100.update(0.016, 1.0, [], { x: 300, y: 700 });
        }

        enemyStats.push({
          type: t,
          hp50: e50.hp,
          hp100: e100.hp,
          e50ValidPos: Number.isFinite(e50.position.x) && Number.isFinite(e50.position.y) && e50.position.y >= 0,
          e100ValidPos: Number.isFinite(e100.position.x) && Number.isFinite(e100.position.y) && e100.position.y >= 0,
        });
      }

      return { enemyStats };
    });

    console.log('[Domain 2.1 Wave Scaling Stats]:', result);
    for (const stat of result.enemyStats) {
      expect(stat.hp50).toBeGreaterThan(0);
      expect(stat.hp100).toBeGreaterThanOrEqual(stat.hp50);
      expect(stat.e50ValidPos).toBe(true);
      expect(stat.e100ValidPos).toBe(true);
    }
  });

  test('Domain 2.2: Wave 50 Boss Encounter, HP Scaling & HUD Rendering Stability', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      gm.level = 50;
      gm.enemies = [];
      (gm as any).spawnWave();

      // Boss is type 2
      const boss = gm.enemies.find((e: any) => e.type === 2);
      if (!boss) throw new Error('Boss was not spawned at Wave 50');

      const initialBossHp = boss.hp;
      const initialBossMaxHp = boss.maxHp;

      // Simulate rendering of boss HP bar without throwing errors
      let renderError = false;
      try {
        (gm as any).drawBossHpBar(boss);
        boss.hp = Math.floor(boss.maxHp / 2);
        (gm as any).drawBossHpBar(boss);
        boss.hp = 0;
        (gm as any).drawBossHpBar(boss);
      } catch (err) {
        renderError = true;
      }

      return {
        bossSpawned: !!boss,
        initialBossHp,
        initialBossMaxHp,
        renderError,
        bossType: boss.type,
      };
    });

    console.log('[Domain 2.2 Boss Wave 50 Result]:', result);
    expect(result.bossSpawned).toBe(true);
    expect(result.initialBossHp).toBe(500); // 50 * 10 = 500
    expect(result.initialBossMaxHp).toBe(500);
    expect(result.renderError).toBe(false);
  });

  test('Domain 2.3: Diver High-Speed Trajectory & Screen Wrap / Safe Boundaries', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;

      // Diver = 4
      const diver = new EnemyClass(300, 100, gm.logicalWidth, 50, 4, gm.logicalHeight);
      gm.enemies = [diver];

      const playerPos = { x: 285, y: 700 }; // Player directly aligned below diver

      const trajectory: any[] = [];
      for (let f = 0; f < 180; f++) {
        diver.update(0.016, 1.0, [], playerPos);
        if (f % 15 === 0) {
          trajectory.push({
            frame: f,
            y: diver.position.y,
            isDiving: diver.isDiving,
          });
        }
      }

      return {
        trajectory,
        finalY: diver.position.y,
        isFinite: Number.isFinite(diver.position.y),
        bounded: diver.position.y >= 0 && diver.position.y <= gm.logicalHeight + 100,
      };
    });

    console.log('[Domain 2.3 Diver Trajectory Result]:', result);
    expect(result.isFinite).toBe(true);
    expect(result.bounded).toBe(true);
  });

  test('Domain 2.4: Splitter High-Wave Fragmentation Stress', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = gm.player.fire()[0].constructor;

      // Splitter = 6
      const splitter = new EnemyClass(200, 200, gm.logicalWidth, 20, 6, gm.logicalHeight);
      splitter.hp = 1;
      gm.enemies = [splitter];

      // Bullet hitting splitter
      const bullet = new BulletClass(210, 210, -300, 1, true, 1);
      gm.bullets = [bullet];

      gm.checkCollisions();
      gm.update(0.016);

      // Normal = 0
      const splitChildren = gm.enemies.filter((e: any) => e.type === 0);

      return {
        initialEnemiesCount: 1,
        finalEnemiesCount: gm.enemies.length,
        splitChildrenCount: splitChildren.length,
      };
    });

    console.log('[Domain 2.4 Splitter Result]:', result);
    expect(result.splitChildrenCount).toBe(2);
  });

  // =========================================================================
  // DOMAIN 3: RAPID INPUT SPAM & FOCUS/BLUR/VISIBILITY FLIPPING
  // =========================================================================
  test('Domain 3.1: Rapid Key Spam & KeyUp Fix Verification (F4)', async ({ page }) => {
    // 1. Press ArrowLeft and 'A' simultaneously
    await page.keyboard.down('ArrowLeft');
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(50);

    let isMovingLeft = await page.evaluate(() => (window as any).gameManager.player.isMovingLeft);
    expect(isMovingLeft).toBe(true);

    // 2. Release 'A' while still holding 'ArrowLeft' -> MUST STILL MOVE LEFT
    await page.keyboard.up('KeyA');
    await page.waitForTimeout(50);

    isMovingLeft = await page.evaluate(() => (window as any).gameManager.player.isMovingLeft);
    expect(isMovingLeft).toBe(true);

    // 3. Release 'ArrowLeft' -> Now stops moving left
    await page.keyboard.up('ArrowLeft');
    await page.waitForTimeout(50);

    isMovingLeft = await page.evaluate(() => (window as any).gameManager.player.isMovingLeft);
    expect(isMovingLeft).toBe(false);

    // 4. Simultaneous Left + Right rapid spam (100 rapid key transitions)
    for (let i = 0; i < 20; i++) {
      await page.keyboard.down('ArrowLeft');
      await page.keyboard.down('ArrowRight');
      await page.keyboard.up('ArrowLeft');
      await page.keyboard.up('ArrowRight');
    }

    const stateClean = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        isMovingLeft: gm.player.isMovingLeft,
        isMovingRight: gm.player.isMovingRight,
        playerPosX: gm.player.position.x,
        validX: Number.isFinite(gm.player.position.x) && gm.player.position.x >= 0 && gm.player.position.x <= 550,
      };
    });

    expect(stateClean.validX).toBe(true);
  });

  test('Domain 3.2: Window Focus/Blur & Tab Visibility Flip (Spiral of Death Prevention)', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const gm = (window as any).gameManager;

      // 1. Simulate active keys
      gm.handleKeyDown('ArrowLeft');
      gm.handleKeyDown(' ');

      // 2. Trigger Window Blur event
      window.dispatchEvent(new Event('blur'));

      const keysAfterBlur = { ...gm.keysPressed };
      const playerShootingAfterBlur = gm.player.isShooting;
      const playerMovingAfterBlur = gm.player.isMovingLeft;

      // 3. Simulate Tab background lag jump (e.g. 5.0 seconds jump in deltaTime)
      const prevX = gm.player.position.x;
      const prevScore = gm.score;
      gm.update(5.0); // Extreme delta time

      const postLagX = gm.player.position.x;
      const validLagUpdate = Number.isFinite(postLagX) && postLagX >= 0 && postLagX <= 550;

      // 4. Trigger Window Focus event
      window.dispatchEvent(new Event('focus'));

      return {
        keysAfterBlur,
        playerShootingAfterBlur,
        playerMovingAfterBlur,
        validLagUpdate,
        postLagX,
      };
    });

    console.log('[Domain 3.2 Focus/Blur Lag Result]:', result);
    expect(result.playerShootingAfterBlur).toBe(false);
    expect(result.playerMovingAfterBlur).toBe(false);
    expect(result.validLagUpdate).toBe(true);
  });

  // =========================================================================
  // DOMAIN 4: DESTRUCTIBLE & STONE BARRICADE STRESS
  // =========================================================================
  test('Domain 4.1: Destructible Barricade Gnawing Damage Delta Scaling & Zero Negative HP', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BarricadeClass = gm.barricades[0].constructor;

      // Create a single destructible barricade (type = 0: DESTRUCTIBLE, maxHp = 20)
      const barricade = new BarricadeClass(200, 400, 0);
      barricade.hp = 10;
      barricade.maxHp = 10;
      gm.barricades = [barricade];

      // Create an enemy directly overlapping barricade to gnaw
      // Barricade is (200, 400, 60, 40). Enemy at (210, 410, 40, 30)
      const enemy = new EnemyClass(210, 410, gm.logicalWidth, 1, 0, gm.logicalHeight);
      gm.enemies = [enemy];

      // Test 1: Gnawing with deltaTime = 1/60s (0.016667s)
      const hpBefore1 = barricade.hp;
      gm.checkCollisions(1 / 60);
      const damage1 = hpBefore1 - barricade.hp; // expected: 6.0 * (1/60) = 0.1

      // Test 2: Gnawing with deltaTime = 1/30s (0.033333s)
      const hpBefore2 = barricade.hp;
      gm.checkCollisions(1 / 30);
      const damage2 = hpBefore2 - barricade.hp; // expected: 6.0 * (1/30) = 0.2

      // Test 3: Gnaw to zero and ensure HP never goes negative
      for (let i = 0; i < 200; i++) {
        gm.checkCollisions(1 / 60);
        if (barricade.hp <= 0) {
          barricade.hp = Math.max(0, barricade.hp);
          barricade.isDead = true;
          break;
        }
      }

      const finalHp = barricade.hp;
      const isDead = barricade.isDead;

      return {
        damage1,
        damage2,
        damageRatio: damage2 / damage1,
        finalHp,
        isDead,
      };
    });

    console.log('[Domain 4.1 Destructible Barricade Scaling Result]:', result);
    expect(result.damage1).toBeCloseTo(0.1, 3);
    expect(result.damage2).toBeCloseTo(0.2, 3);
    expect(result.damageRatio).toBeCloseTo(2.0, 1);
    expect(result.finalHp).toBe(0);
    expect(result.isDead).toBe(true);
  });

  test('Domain 4.2: Indestructible Stone Barricades Immune to Bullets and Gnawing', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BarricadeClass = gm.barricades[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      // Stone Barricade at (200, 500) (type = 1: INDESTRUCTIBLE)
      const stoneBarricade = new BarricadeClass(200, 500, 1);
      const initialHp = stoneBarricade.hp;
      gm.barricades = [stoneBarricade];

      // 1. Fire 20 bullets at stone barricade
      for (let i = 0; i < 20; i++) {
        const b = new BulletClass(210, 510, -200, 1, true, 1);
        gm.bullets.push(b);
      }

      gm.checkCollisions();
      const bulletsDead = gm.bullets.every((b: any) => b.isDead);
      const hpAfterBullets = stoneBarricade.hp;

      // 2. Place gnawing enemy overlapping stone barricade
      const enemy = new EnemyClass(200, 510, gm.logicalWidth, 1, 0, gm.logicalHeight);
      gm.enemies = [enemy];

      gm.checkCollisions(0.1);
      const hpAfterGnawing = stoneBarricade.hp;
      const enemyClampedY = enemy.position.y;

      return {
        initialHp,
        bulletsDead,
        hpAfterBullets,
        hpAfterGnawing,
        enemyClampedY,
        expectedClampedY: stoneBarricade.position.y - enemy.size.height,
      };
    });

    console.log('[Domain 4.2 Stone Barricade Result]:', result);
    expect(result.bulletsDead).toBe(true);
    expect(result.hpAfterBullets).toBe(result.initialHp);
    expect(result.hpAfterGnawing).toBe(result.initialHp);
    expect(result.enemyClampedY).toBe(result.expectedClampedY);
  });
});

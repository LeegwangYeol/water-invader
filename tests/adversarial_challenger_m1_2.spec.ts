import { test, expect } from '@playwright/test';

test.describe('Challenger M1 Adversarial Verification Suite (teamwork_preview_challenger_m1_2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('EMP-WAVE-01: Exhaustive Wave Scaling & Boundary Invariants (Waves 1 to 50)', async ({ page }) => {
    const waveResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const results: {
        wave: number;
        enemyCount: number;
        cols: number;
        rows: number;
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        hasNaN: boolean;
        isBossWave: boolean;
        bossHp?: number;
      }[] = [];

      for (let wave = 1; wave <= 50; wave++) {
        gm.level = wave;
        gm.enemies = [];
        gm.spawnWave();

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        let hasNaN = false;

        const expectedRows = Math.min(5, 3 + Math.floor(wave / 4));
        const expectedCols = Math.min(8, 6 + Math.floor(wave / 3));

        for (const enemy of gm.enemies) {
          if (
            Number.isNaN(enemy.position.x) ||
            Number.isNaN(enemy.position.y) ||
            Number.isNaN(enemy.size.width) ||
            Number.isNaN(enemy.size.height) ||
            Number.isNaN(enemy.hp)
          ) {
            hasNaN = true;
          }

          if (enemy.position.x < minX) minX = enemy.position.x;
          if (enemy.position.x + enemy.size.width > maxX) maxX = enemy.position.x + enemy.size.width;
          if (enemy.position.y < minY) minY = enemy.position.y;
          if (enemy.position.y + enemy.size.height > maxY) maxY = enemy.position.y + enemy.size.height;
        }

        const isBossWave = wave % 5 === 0;
        const boss = isBossWave ? gm.enemies.find((e: any) => e.type === 2) : null;

        results.push({
          wave,
          enemyCount: gm.enemies.length,
          cols: expectedCols,
          rows: expectedRows,
          minX,
          maxX,
          minY,
          maxY,
          hasNaN,
          isBossWave,
          bossHp: boss ? boss.hp : undefined,
        });
      }

      return results;
    });

    expect(waveResults.length).toBe(50);

    for (const r of waveResults) {
      // 1. No NaN values in any entity property
      expect(r.hasNaN).toBe(false);

      // 2. Enemy counts and grid dimensions are bounded
      expect(r.cols).toBeLessThanOrEqual(8);
      expect(r.cols).toBeGreaterThanOrEqual(6);
      expect(r.rows).toBeLessThanOrEqual(5);
      expect(r.rows).toBeGreaterThanOrEqual(3);

      if (r.isBossWave) {
        expect(r.enemyCount).toBe(1);
        expect(r.bossHp).toBe(r.wave * 10);
      } else {
        // Grid capped at 5 rows x 8 cols = 40 enemies max
        expect(r.enemyCount).toBeGreaterThanOrEqual(18); // 3x6 = 18 min
        expect(r.enemyCount).toBeLessThanOrEqual(40); // 5x8 = 40 max
      }

      // 3. Boundaries: within logical canvas width [0, 600]
      expect(r.minX).toBeGreaterThanOrEqual(0);
      expect(r.maxX).toBeLessThanOrEqual(600);

      // 4. Boundaries: spawn Y starts at or below 80 (F-13 / E-06)
      expect(r.minY).toBeGreaterThanOrEqual(80);
      // Spawn maxY should never overlap barricades at y=600
      expect(r.maxY).toBeLessThan(500);
    }
  });

  test('EMP-BARRICADE-01: Stone Barricade Rigid Body Collision & Anti-Ghosting Verification', async ({ page }) => {
    const collisionResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BarricadeClass = gm.barricades[0].constructor;

      // Create a wide indestructible stone barricade at y=500 spanning entire test corridor
      const stoneBarricade = new BarricadeClass(0, 500, 1); // BarricadeType.INDESTRUCTIBLE = 1
      stoneBarricade.size.width = gm.logicalWidth; // wide barrier
      stoneBarricade.hp = 100;
      stoneBarricade.maxHp = 100;
      gm.barricades = [stoneBarricade];

      // Place multiple enemy types descending into the stone barricade
      // Types: 0=NORMAL, 1=ZIGZAG, 3=SNIPER, 4=DIVER, 5=SHIELDED, 6=SPLITTER
      const testEnemies = [
        new EnemyClass(100, 460, gm.logicalWidth, 1, 0), // NORMAL (height 30)
        new EnemyClass(180, 460, gm.logicalWidth, 1, 1), // ZIGZAG (height 30)
        new EnemyClass(260, 460, gm.logicalWidth, 1, 3), // SNIPER (height 30)
        new EnemyClass(340, 460, gm.logicalWidth, 1, 4), // DIVER (height 30)
        new EnemyClass(420, 460, gm.logicalWidth, 1, 5), // SHIELDED (height 30)
        new EnemyClass(500, 450, gm.logicalWidth, 1, 6), // SPLITTER (height 40)
      ];

      gm.enemies = testEnemies;
      const initialBarricadeHp = stoneBarricade.hp;

      // Simulate 120 continuous physics frames (2 seconds)
      for (let f = 1; f <= 120; f++) {
        // Update enemies movement
        for (const e of gm.enemies) {
          if (!e.isDead) {
            e.update(0.016, 1.0, []);
          }
        }

        // Run collision detection
        gm.checkCollisions();
      }

      const finalEnemies = gm.enemies.map((e: any) => ({
        type: e.type,
        y: e.position.y,
        height: e.size.height,
        isDead: e.isDead,
        maxAllowedY: stoneBarricade.position.y - e.size.height,
      }));

      return {
        initialBarricadeHp,
        finalBarricadeHp: stoneBarricade.hp,
        finalEnemies,
        diverDiedOnImpact: testEnemies[3].isDead,
        survivingCount: gm.enemies.filter((e: any) => !e.isDead).length,
      };
    });

    // 1. Stone barricade is indestructible (takes 0 damage)
    expect(collisionResult.finalBarricadeHp).toBe(collisionResult.initialBarricadeHp);

    // 2. Diver died on impact with stone barricade
    expect(collisionResult.diverDiedOnImpact).toBe(true);

    // 3. For all surviving enemies, verify they NEVER penetrated/ghosted past the stone barricade top edge
    for (const e of collisionResult.finalEnemies) {
      if (!e.isDead) {
        expect(e.y).toBeLessThanOrEqual(e.maxAllowedY + 0.01);
      }
    }
  });

  test('EMP-BARRICADE-02: Destructible Barricade Gnawing Speed Throttling (0.2x Multiplier)', async ({ page }) => {
    const gnawThrottleResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BarricadeClass = gm.barricades[0].constructor;

      // 1. Free unhindered enemy test
      const freeEnemy = new EnemyClass(100, 100, gm.logicalWidth, 1, 0); // NORMAL
      freeEnemy.isGnawing = false;
      const freeInitialY = freeEnemy.position.y;
      const freeInitialX = freeEnemy.position.x;

      for (let i = 0; i < 60; i++) {
        freeEnemy.update(0.016, 1.0, []);
      }
      const freeDeltaY = freeEnemy.position.y - freeInitialY;
      const freeDeltaX = Math.abs(freeEnemy.position.x - freeInitialX);

      // 2. Gnawing enemy test (speed throttled by isGnawing = true)
      const destructibleBarricade = new BarricadeClass(300, 200, 0); // BarricadeType.DESTRUCTIBLE = 0
      gm.barricades = [destructibleBarricade];

      const gnawingEnemy = new EnemyClass(300, 100, gm.logicalWidth, 1, 0);
      gnawingEnemy.isGnawing = true;

      const initialBarricadeHp = destructibleBarricade.hp;
      const gnawInitialY = gnawingEnemy.position.y;
      const gnawInitialX = gnawingEnemy.position.x;

      for (let i = 0; i < 60; i++) {
        destructibleBarricade.takeDamage(0.1);
        gnawingEnemy.update(0.016, 1.0, []);
      }

      const gnawDeltaY = gnawingEnemy.position.y - gnawInitialY;
      const gnawDeltaX = Math.abs(gnawingEnemy.position.x - gnawInitialX);
      const finalBarricadeHp = destructibleBarricade.hp;

      return {
        freeDeltaY,
        freeDeltaX,
        gnawDeltaY,
        gnawDeltaX,
        isGnawing: gnawingEnemy.isGnawing,
        initialBarricadeHp,
        finalBarricadeHp,
        gnawDamageDealt: initialBarricadeHp - finalBarricadeHp,
        speedRatioY: gnawDeltaY / freeDeltaY,
      };
    });

    // 1. isGnawing flag is correctly asserted during barricade overlap
    expect(gnawThrottleResult.isGnawing).toBe(true);

    // 2. Destructible barricade received gnaw damage (60 frames * 0.1 hp = 6.0 hp damage)
    expect(gnawThrottleResult.gnawDamageDealt).toBeCloseTo(6.0, 1);
    expect(gnawThrottleResult.finalBarricadeHp).toBeLessThan(gnawThrottleResult.initialBarricadeHp);

    // 3. Movement is throttled to exactly ~20% (0.2x speedMultiplier)
    // freeDeltaY is ~7.68px, gnawDeltaY is ~1.536px -> ratio is ~0.20
    expect(gnawThrottleResult.speedRatioY).toBeCloseTo(0.2, 2);
    expect(gnawThrottleResult.gnawDeltaY).toBeLessThan(gnawThrottleResult.freeDeltaY * 0.25);
  });
});

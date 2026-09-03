import { test, expect } from '@playwright/test';

test.describe('R3: Multi-Wave Progression & Boss Encounter Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('Clearing Wave 1 triggers intermission shop and advances to Wave 2', async ({ page }) => {
    // 1. Initial state check
    const initialWave = await page.evaluate(() => (window as any).gameManager.level);
    expect(initialWave).toBe(1);

    // 2. Kill all enemies in Wave 1
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.enemies.forEach((e: any) => { e.isDead = true; });
    });

    // 3. Wait for game update loop to recognize wave clear and transition to SHOP
    await page.waitForTimeout(200);

    const shopState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        state: gm.state,
        isPaused: gm.isPaused,
      };
    });

    expect(shopState.state).toBe('SHOP'); // GameState.SHOP
    expect(shopState.isPaused).toBe(true);

    // Verify WAVE CLEARED overlay and NEXT WAVE button
    const waveClearedOverlay = page.locator('h1', { hasText: 'WAVE CLEARED' });
    await expect(waveClearedOverlay).toBeVisible();

    // Click NEXT WAVE button
    await page.locator('button', { hasText: 'NEXT WAVE' }).click();

    // Wait for wave advance
    await page.waitForTimeout(300);

    const wave2State = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        level: gm.level,
        state: gm.state,
        isPaused: gm.isPaused,
        enemiesCount: gm.enemies.length,
      };
    });

    expect(wave2State.level).toBe(2);
    expect(wave2State.state).toBe('PLAYING'); // GameState.PLAYING
    expect(wave2State.isPaused).toBe(false);
    expect(wave2State.enemiesCount).toBeGreaterThan(0);

    // Update UI callback and verify HUD reflects WAVE 2
    await page.evaluate(() => {
      (window as any).gameManager.handleEnemyKill();
    });
    const waveHUD = page.locator('p', { hasText: 'WAVE 2' });
    await expect(waveHUD).toBeVisible();
  });

  test('Multi-wave progression advances through Wave 2, 3, 4 to Wave 5 Boss wave', async ({ page }) => {
    // Advance directly through waves
    for (let targetLevel = 2; targetLevel <= 5; targetLevel++) {
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.startNextWave();
      });
      await page.waitForTimeout(300);

      const currentLevel = await page.evaluate(() => (window as any).gameManager.level);
      expect(currentLevel).toBe(targetLevel);
    }

    // At Wave 5, verify Boss enemy spawn
    const bossData = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const boss = gm.enemies.find((e: any) => e.type === 2); // EnemyType.BOSS = 2
      return {
        totalEnemies: gm.enemies.length,
        hasBoss: !!boss,
        bossType: boss ? boss.type : null,
        bossHp: boss ? boss.hp : null,
        bossWidth: boss ? boss.size.width : null,
        bossHeight: boss ? boss.size.height : null,
        bossColor: boss ? boss.color : null,
      };
    });

    expect(bossData.totalEnemies).toBe(1); // Boss wave spawns solitary boss
    expect(bossData.hasBoss).toBe(true);
    expect(bossData.bossType).toBe(2);
    expect(bossData.bossHp).toBe(50); // Level 5 * 10 = 50 HP
    expect(bossData.bossWidth).toBe(150);
    expect(bossData.bossHeight).toBe(100);
    expect(bossData.bossColor).toBe('#dc2626');
  });

  test('Boss defeat triggers massive explosion particles and advances to Wave 6', async ({ page }) => {
    // Jump to Boss wave
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 5;
      gm.enemies = [];
      gm.spawnWave();
    });

    const bossDeathResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = gm.player.fire()[0].constructor;
      const boss = gm.enemies[0];
      
      const initialParticles = gm.particles.length;
      
      // Fire ultra-high damage piercing bullet at boss
      const killBullet = new BulletClass(boss.position.x + 50, boss.position.y + 50, -400, 100, true, 10);
      gm.bullets.push(killBullet);

      gm.checkCollisions();

      const particlesAfter = gm.particles.length;

      return {
        bossDead: boss.isDead,
        particlesCreated: particlesAfter - initialParticles,
      };
    });

    expect(bossDeathResult.bossDead).toBe(true);
    // 150 boss explosion particles + 5 bullet hit water splash particles = 155 particles
    expect(bossDeathResult.particlesCreated).toBe(155);

    // Advance to Wave 6 via startNextWave
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.startNextWave();
    });

    await page.waitForTimeout(300);

    const wave6State = await page.evaluate(() => (window as any).gameManager.level);
    expect(wave6State).toBe(6);
  });

  test('Combo multiplier increments score and pure water currency accurately', async ({ page }) => {
    const scoreProgression = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const scores: { combo: number; score: number; currency: number }[] = [];

      // Simulate 6 sequential enemy kills
      for (let i = 0; i < 6; i++) {
        gm.handleEnemyKill();
        scores.push({
          combo: gm.combo,
          score: gm.score,
          currency: gm.currency,
        });
      }

      return scores;
    });

    expect(scoreProgression.length).toBe(6);
    expect(scoreProgression[0].combo).toBe(1);
    expect(scoreProgression[0].score).toBe(100);
    expect(scoreProgression[0].currency).toBe(155);

    // At combo = 5 (6th kill, combo reached 5), multiplier becomes 1 + Math.floor(5/5)*0.5 = 1.5x
    expect(scoreProgression[4].combo).toBe(5);
    expect(scoreProgression[5].combo).toBe(6);
    expect(scoreProgression[5].score).toBeGreaterThan(scoreProgression[4].score + 100); // 150 points added
  });
});

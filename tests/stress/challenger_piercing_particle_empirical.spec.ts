import { test, expect } from '@playwright/test';

test.describe('Challenger Empirical Verification: G-01 Piercing & G-04 Particle Pooling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('G-01 [EMPIRICAL 1]: Piercing Bullet vs Single 100 HP Enemy - Hit Tracking prevents frame-by-frame tick depletion', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      // Single standard enemy with 100 HP
      const enemy = new EnemyClass(200, 200, gm.logicalWidth, 1, 0);
      enemy.hp = 100;
      enemy.maxHp = 100;
      enemy.size = { width: 40, height: 30 };
      gm.enemies = [enemy];

      // Bullet with piercing = 3 starting below and moving through enemy
      const bullet = new BulletClass(215, 235, -200, 1, true, 3);
      gm.bullets = [bullet];

      const framesLog: any[] = [];

      // Run 20 frames of collision & movement (traversing ~60px through 30px enemy)
      for (let frame = 1; frame <= 20; frame++) {
        const prevPiercing = bullet.piercing;
        const prevHp = enemy.hp;
        const isColliding = bullet.checkCollision(enemy);
        const alreadyHit = bullet.hitEntities.has(enemy);

        gm.checkCollisions();
        bullet.position.y += bullet.velocity.y * 0.016; // -3.2px per frame

        framesLog.push({
          frame,
          bulletY: bullet.position.y,
          isColliding,
          alreadyHit,
          piercing: bullet.piercing,
          piercingDelta: prevPiercing - bullet.piercing,
          enemyHp: enemy.hp,
          enemyHpDelta: prevHp - enemy.hp,
          bulletDead: bullet.isDead,
          hitEntitiesSize: bullet.hitEntities.size
        });
      }

      const totalPiercingConsumed = 3 - bullet.piercing;
      const totalDamageDealt = 100 - enemy.hp;

      return {
        totalPiercingConsumed,
        totalDamageDealt,
        finalPiercing: bullet.piercing,
        finalEnemyHp: enemy.hp,
        bulletIsDead: bullet.isDead,
        framesLog
      };
    });

    console.log('[G-01 Single Enemy Traversal Summary]:', {
      totalPiercingConsumed: result.totalPiercingConsumed,
      totalDamageDealt: result.totalDamageDealt,
      finalPiercing: result.finalPiercing,
      bulletIsDead: result.bulletIsDead
    });

    // Verification: Exactly 1 piercing charge consumed, exactly 1 damage dealt
    expect(result.totalPiercingConsumed).toBe(1);
    expect(result.totalDamageDealt).toBe(1);
    expect(result.finalPiercing).toBe(2);
    expect(result.finalEnemyHp).toBe(99);
    expect(result.bulletIsDead).toBe(false);
  });

  test('G-01 [EMPIRICAL 2]: Piercing Bullet vs Single Boss (50 HP, 150x80 hitbox) - No multi-tick depletion', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      // Boss with 50 HP (size 150x80)
      const boss = new EnemyClass(150, 150, gm.logicalWidth, 5, 2); // BOSS = 2
      boss.hp = 50;
      boss.maxHp = 50;
      boss.size = { width: 150, height: 80 };
      gm.enemies = [boss];

      // Bullet starting at bottom of Boss and moving upwards through the 80px hitbox
      const bullet = new BulletClass(200, 230, -200, 1, true, 3);
      gm.bullets = [bullet];

      let hitsCount = 0;
      let initialHp = boss.hp;

      for (let frame = 1; frame <= 40; frame++) {
        const hpBefore = boss.hp;
        gm.checkCollisions();
        if (boss.hp < hpBefore) {
          hitsCount++;
        }
        bullet.position.y += bullet.velocity.y * 0.016;
      }

      return {
        hitsCount,
        initialHp,
        finalBossHp: boss.hp,
        finalPiercing: bullet.piercing,
        bulletIsDead: bullet.isDead
      };
    });

    console.log('[G-01 Boss Traversal Summary]:', result);
    expect(result.hitsCount).toBe(1);
    expect(result.finalBossHp).toBe(49);
    expect(result.finalPiercing).toBe(2);
    expect(result.bulletIsDead).toBe(false);
  });

  test('G-01 [EMPIRICAL 3]: Piercing=3 cleanly penetrates and damages 3 distinct enemies in a vertical column', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      // 4 distinct enemies positioned vertically in a column at x=200
      const enemy1 = new EnemyClass(190, 300, gm.logicalWidth, 1, 0); // Bottom enemy
      const enemy2 = new EnemyClass(190, 200, gm.logicalWidth, 1, 0); // Middle enemy
      const enemy3 = new EnemyClass(190, 100, gm.logicalWidth, 1, 0); // Top enemy
      const enemy4 = new EnemyClass(190, 20, gm.logicalWidth, 1, 0);  // 4th enemy beyond piercing capacity

      [enemy1, enemy2, enemy3, enemy4].forEach(e => {
        e.hp = 10;
        e.maxHp = 10;
        e.size = { width: 40, height: 30 };
        e.speedX = 0;
        e.speedY = 0;
        e.canEvade = false;
      });

      gm.enemies = [enemy1, enemy2, enemy3, enemy4];

      // Bullet starting at y=360 moving upwards (speedY = -200) with piercing = 3
      const bullet = new BulletClass(205, 360, -200, 1, true, 3);
      gm.bullets = [bullet];

      const history: any[] = [];

      // Step simulation over 120 frames (~2.0 seconds)
      for (let frame = 1; frame <= 120; frame++) {
        gm.update(0.016);

        if (frame % 10 === 0 || bullet.isDead) {
          history.push({
            frame,
            bulletY: bullet.position.y,
            bulletDead: bullet.isDead,
            piercing: bullet.piercing,
            e1Hp: enemy1.hp,
            e2Hp: enemy2.hp,
            e3Hp: enemy3.hp,
            e4Hp: enemy4.hp
          });
        }
      }

      return {
        finalEnemy1Hp: enemy1.hp,
        finalEnemy2Hp: enemy2.hp,
        finalEnemy3Hp: enemy3.hp,
        finalEnemy4Hp: enemy4.hp,
        finalPiercing: bullet.piercing,
        bulletIsDead: bullet.isDead,
        hitEntitiesCount: bullet.hitEntities.size,
        history
      };
    });

    console.log('[G-01 3-Enemy Penetration Result]:', {
      e1Hp: result.finalEnemy1Hp,
      e2Hp: result.finalEnemy2Hp,
      e3Hp: result.finalEnemy3Hp,
      e4Hp: result.finalEnemy4Hp,
      finalPiercing: result.finalPiercing,
      bulletIsDead: result.bulletIsDead,
      hitEntitiesCount: result.hitEntitiesCount
    });

    // Verification:
    // 1. Enemy 1 took 1 hit (10 -> 9)
    // 2. Enemy 2 took 1 hit (10 -> 9)
    // 3. Enemy 3 took 1 hit (10 -> 9)
    // 4. Bullet piercing reached 0 and bullet died after 3rd hit
    // 5. Enemy 4 was NOT damaged (remains 10 HP)
    expect(result.finalEnemy1Hp).toBe(9);
    expect(result.finalEnemy2Hp).toBe(9);
    expect(result.finalEnemy3Hp).toBe(9);
    expect(result.finalEnemy4Hp).toBe(10);
    expect(result.finalPiercing).toBe(0);
    expect(result.bulletIsDead).toBe(true);
    expect(result.hitEntitiesCount).toBe(3);
  });

  test('G-01 [EMPIRICAL 4]: Standard Bullet (Piercing=1) destroys on first enemy and does not touch subsequent enemies', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;
      const BulletClass = gm.player.fire()[0].constructor;

      const enemy1 = new EnemyClass(190, 300, gm.logicalWidth, 1, 0);
      const enemy2 = new EnemyClass(190, 200, gm.logicalWidth, 1, 0);
      [enemy1, enemy2].forEach(e => {
        e.hp = 10;
        e.maxHp = 10;
        e.size = { width: 40, height: 30 };
        e.speedX = 0;
        e.speedY = 0;
        e.canEvade = false;
      });
      gm.enemies = [enemy1, enemy2];

      const bullet = new BulletClass(205, 360, -200, 1, true, 1);
      gm.bullets = [bullet];

      for (let frame = 1; frame <= 60; frame++) {
        gm.update(0.016);
      }

      return {
        e1Hp: enemy1.hp,
        e2Hp: enemy2.hp,
        bulletIsDead: bullet.isDead,
        finalPiercing: bullet.piercing
      };
    });

    console.log('[G-01 Standard Bullet Piercing=1 Result]:', result);
    expect(result.e1Hp).toBe(9);
    expect(result.e2Hp).toBe(10);
    expect(result.bulletIsDead).toBe(true);
    expect(result.finalPiercing).toBe(0);
  });

  test('G-04 [EMPIRICAL 1]: Particle Object Pool recycles dead particles into pool on update', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      // Clear existing particles
      gm.particles = [];
      (gm as any).particlePool = [];

      // 1. Trigger explosion of 20 particles
      (gm as any).createExplosion(300, 400, '#38bdf8', 20);
      const activeCountAfterSpawn = gm.particles.length;
      const poolCountAfterSpawn = (gm as any).particlePool.length;

      // Capture object references of the 20 spawned particles
      const spawnedParticleRefs = [...gm.particles];

      // 2. Advance time past maxLifeTime (particles last 0.3s - 0.7s)
      for (let i = 0; i < 60; i++) {
        gm.update(0.02); // 1.2s total elapsed
      }

      const activeCountAfterExpire = gm.particles.length;
      const poolCountAfterExpire = (gm as any).particlePool.length;

      // 3. Trigger second explosion of 20 particles
      (gm as any).createExplosion(300, 400, '#ef4444', 20);
      const activeCountSecondSpawn = gm.particles.length;
      const poolCountSecondSpawn = (gm as any).particlePool.length;

      // Check how many of the newly active particles are reused object instances from the first spawn
      const recycledCount = gm.particles.filter((p: any) => spawnedParticleRefs.includes(p)).length;

      return {
        activeCountAfterSpawn,
        poolCountAfterSpawn,
        activeCountAfterExpire,
        poolCountAfterExpire,
        activeCountSecondSpawn,
        poolCountSecondSpawn,
        recycledCount
      };
    });

    console.log('[G-04 Particle Pool Recycling Result]:', result);

    // Initial spawn: 20 active, 0 in pool
    expect(result.activeCountAfterSpawn).toBe(20);
    expect(result.poolCountAfterSpawn).toBe(0);

    // After expiration: 0 active, 20 recycled into pool
    expect(result.activeCountAfterExpire).toBe(0);
    expect(result.poolCountAfterExpire).toBe(20);

    // Second spawn: 20 active, 0 in pool, exactly 20 recycled object instances!
    expect(result.activeCountSecondSpawn).toBe(20);
    expect(result.poolCountSecondSpawn).toBe(0);
    expect(result.recycledCount).toBe(20);
  });

  test('G-04 [EMPIRICAL 2]: Particle Pool Capacity is strictly bounded at 500 to prevent unbounded heap memory growth', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      gm.particles = [];
      (gm as any).particlePool = [];

      // Spawn 1000 particles across 50 explosions
      for (let i = 0; i < 50; i++) {
        (gm as any).createExplosion(300, 400, '#38bdf8', 20);
      }

      const totalSpawnedActive = gm.particles.length;

      // Advance time by 1.5 seconds to expire all 1000 particles
      for (let i = 0; i < 75; i++) {
        gm.update(0.02);
      }

      const activeAfterExpire = gm.particles.length;
      const poolSizeAfterExpire = (gm as any).particlePool.length;

      // Spawn another 600 particles
      for (let i = 0; i < 30; i++) {
        (gm as any).createExplosion(300, 400, '#ef4444', 20);
      }

      const activeAfterSecondSpawn = gm.particles.length;
      const poolSizeAfterSecondSpawn = (gm as any).particlePool.length;

      return {
        totalSpawnedActive,
        activeAfterExpire,
        poolSizeAfterExpire,
        activeAfterSecondSpawn,
        poolSizeAfterSecondSpawn
      };
    });

    console.log('[G-04 Particle Pool Capacity Bound Result]:', result);

    // Total 1000 particles spawned
    expect(result.totalSpawnedActive).toBe(1000);
    // After expiration, active is 0
    expect(result.activeAfterExpire).toBe(0);
    // Pool size must be capped at exactly 500 (not 1000!)
    expect(result.poolSizeAfterExpire).toBe(500);

    // Second spawn of 600 particles: drains 500 from pool, creates 100 new, pool empty
    expect(result.activeAfterSecondSpawn).toBe(600);
    expect(result.poolSizeAfterSecondSpawn).toBe(0);
  });

  test('G-04 [EMPIRICAL 3]: Reused particles reinitialize state correctly without NaN or stale velocity', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.particles = [];
      (gm as any).particlePool = [];

      // Spawn 1 particle, let it move and die
      (gm as any).createExplosion(100, 100, '#ffffff', 1);
      const originalParticle = gm.particles[0];

      // Update until dead
      for (let i = 0; i < 50; i++) {
        gm.update(0.02);
      }

      const wasDead = originalParticle.isDead;
      const poolHasIt = (gm as any).particlePool.includes(originalParticle);

      // Re-spawn at new location (450, 600) with red color
      (gm as any).createExplosion(450, 600, '#ff0000', 1);
      const reusedParticle = gm.particles[0];

      const isSameRef = originalParticle === reusedParticle;
      const isDeadReset = reusedParticle.isDead === false;
      const posCorrect = reusedParticle.position.x === 450 && reusedParticle.position.y === 600;
      const colorCorrect = reusedParticle.color === '#ff0000';
      const lifeTimeValid = reusedParticle.lifeTime > 0 && !isNaN(reusedParticle.lifeTime);
      const velocityValid = !isNaN(reusedParticle.velocity.x) && !isNaN(reusedParticle.velocity.y);

      return {
        wasDead,
        poolHasIt,
        isSameRef,
        isDeadReset,
        posCorrect,
        colorCorrect,
        lifeTimeValid,
        velocityValid
      };
    });

    console.log('[G-04 Particle State Reset Result]:', result);
    expect(result.wasDead).toBe(true);
    expect(result.isSameRef).toBe(true);
    expect(result.isDeadReset).toBe(true);
    expect(result.posCorrect).toBe(true);
    expect(result.colorCorrect).toBe(true);
    expect(result.lifeTimeValid).toBe(true);
    expect(result.velocityValid).toBe(true);
  });
});

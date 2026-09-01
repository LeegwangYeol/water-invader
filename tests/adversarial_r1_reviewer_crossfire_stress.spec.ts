import { test, expect } from '@playwright/test';

test.describe('Adversarial Reviewer R1: Crossfire, Friendly Fire & Score/Cash Persistence Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.click('button:has-text("START GAME")');
    await page.waitForFunction(() => !!(window as any).gameManager);
  });

  // =========================================================================
  // ADV-R1.1: MULTI-DEATH SCORE & CASH COMPOUNDING PERSISTENCE
  // =========================================================================
  test('ADV-R1.1: Multi-death loop compounds score and cash monotonically across successive game overs', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const history: { run: number; score: number; currency: number; hp: number; level: number }[] = [];

      // Run 1: Earn initial score/currency then die
      gm.score = 500;
      gm.currency = 80;
      gm.level = 2;
      gm.player.hp = 0;
      (gm as any).gameOver('Death 1');
      history.push({ run: 1, score: gm.score, currency: gm.currency, hp: gm.player.hp, level: gm.level });

      // Respawn 1
      gm.init();
      // Earn more
      gm.score += 1200;
      gm.currency += 150;
      gm.level = 3;
      gm.player.hp = 0;
      (gm as any).gameOver('Death 2');
      history.push({ run: 2, score: gm.score, currency: gm.currency, hp: gm.player.hp, level: gm.level });

      // Respawn 2
      gm.init();
      // Earn more via crossfire kills
      const EnemyClass = (window as any).Enemy;
      const dummyBoss = new EnemyClass(100, 100, gm.logicalWidth, 1, 2, gm.logicalHeight); // EnemyType.BOSS = 2
      (gm as any).handleCrossfireKill(dummyBoss, 'ROGUE');
      history.push({ run: 3, score: gm.score, currency: gm.currency, hp: gm.player.hp, level: gm.level });

      return {
        history,
        finalScore: gm.score,
        finalCurrency: gm.currency,
        finalLevel: gm.level,
        finalHp: gm.player.hp,
      };
    });

    expect(result.history[0].score).toBe(500);
    expect(result.history[0].currency).toBe(80);
    expect(result.history[1].score).toBe(1700);
    expect(result.history[1].currency).toBe(230);
    expect(result.history[2].score).toBe(3200); // 1700 + 1500 boss crossfire
    expect(result.history[2].currency).toBe(305); // 230 + 75 boss crossfire
    expect(result.finalLevel).toBe(1); // Respawned at level 1
    expect(result.finalHp).toBe(3); // Restored player health
  });

  // =========================================================================
  // ADV-R1.2: SIMULTANEOUS BOSS CROSSFIRE KILL & PLAYER ACID STORM DEATH
  // =========================================================================
  test('ADV-R1.2: Simultaneous Boss crossfire elimination and Player Acid Storm death frame', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = (window as any).Bullet;

      gm.score = 1000;
      gm.currency = 100;
      gm.enemies = [];
      gm.bullets = [];
      gm.hazardProjectiles = [];

      // Boss with 1 HP (EnemyType.BOSS = 2)
      const boss = new EnemyClass(200, 150, gm.logicalWidth, 1, 2, gm.logicalHeight);
      boss.hp = 1;
      boss.faction = 'INVADER';
      gm.enemies.push(boss);

      // Rogue bullet colliding with boss
      const rogueBullet = new BulletClass(200, 150, 200, 2, false, 1);
      rogueBullet.faction = 'ROGUE';
      gm.bullets.push(rogueBullet);

      // Player with 1 HP
      gm.player.hp = 1;
      gm.player.invincibilityTimer = 0;

      // Toxic Acid hazard projectile overlapping player
      gm.hazardProjectiles.push({
        x: gm.player.position.x + 10,
        y: gm.player.position.y + 10,
        speedY: 200,
        damage: 1,
        radius: 6,
        isDead: false,
      });

      // Execute single physics frame update (which handles hazards then bullets)
      (gm as any).update(1 / 60);

      const stateAfterSimultaneousFrame = gm.state;
      const scoreAfterFrame = gm.score;
      const currencyAfterFrame = gm.currency;
      const bossIsDead = boss.isDead;
      const playerHp = gm.player.hp;

      // Respawn
      gm.init();

      return {
        stateAfterSimultaneousFrame,
        scoreAfterFrame,
        currencyAfterFrame,
        bossIsDead,
        playerHp,
        scoreAfterRespawn: gm.score,
        currencyAfterRespawn: gm.currency,
        levelAfterRespawn: gm.level,
        playerHpAfterRespawn: gm.player.hp,
      };
    });

    expect(result.bossIsDead).toBe(true);
    expect(result.playerHp).toBe(0);
    expect(result.stateAfterSimultaneousFrame).toBe('GAME_OVER');
    expect(result.scoreAfterFrame).toBe(2500); // 1000 + 1500 boss crossfire reward
    expect(result.currencyAfterFrame).toBe(175); // 100 + 75 boss crossfire reward
    expect(result.scoreAfterRespawn).toBe(2500);
    expect(result.currencyAfterRespawn).toBe(175);
    expect(result.levelAfterRespawn).toBe(1);
    expect(result.playerHpAfterRespawn).toBe(3);
  });

  // =========================================================================
  // ADV-R1.3: DEAD SHOOTER AIRBORNE PROJECTILE FRIENDLY FIRE
  // =========================================================================
  test('ADV-R1.3: Airborne projectile from eliminated shooter continues path and inflicts friendly fire on ally', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = (window as any).Bullet;

      gm.enemies = [];
      gm.bullets = [];

      // Invader 1 (Shooter) at (200, 100) - ALREADY DEAD
      const deadShooter = new EnemyClass(200, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
      deadShooter.hp = 0;
      deadShooter.isDead = true;
      deadShooter.faction = 'INVADER';

      // Invader 2 (Ally Target) at (200, 200) - 2 HP
      const allyTarget = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
      allyTarget.hp = 2;
      allyTarget.faction = 'INVADER';
      gm.enemies.push(allyTarget);

      // Bullet previously fired by Invader 1
      const airborneBullet = new BulletClass(200, 200, 200, 1, false, 1);
      airborneBullet.faction = 'INVADER';
      airborneBullet.shooter = deadShooter;
      airborneBullet.hitEntities.add(deadShooter);
      gm.bullets.push(airborneBullet);

      (gm as any).checkCollisions();

      return {
        bulletIsDead: airborneBullet.isDead,
        allyHp: allyTarget.hp,
        allyIsDead: allyTarget.isDead,
      };
    });

    expect(result.bulletIsDead).toBe(true);
    expect(result.allyHp).toBe(1);
    expect(result.allyIsDead).toBe(false);
  });

  // =========================================================================
  // ADV-R1.4: MULTI-STAGE PIERCING FRIENDLY FIRE TRAVERSAL
  // =========================================================================
  test('ADV-R1.4: Piercing bullet traverses 4 same-faction enemies with exact charge decrement', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = (window as any).Bullet;

      gm.enemies = [];
      gm.bullets = [];

      // 4 enemies in a vertical row
      const e1 = new EnemyClass(200, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
      const e2 = new EnemyClass(200, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
      const e3 = new EnemyClass(200, 200, gm.logicalWidth, 1, 0, gm.logicalHeight);
      const e4 = new EnemyClass(200, 250, gm.logicalWidth, 1, 0, gm.logicalHeight);

      [e1, e2, e3, e4].forEach(e => {
        e.hp = 3;
        e.faction = 'INVADER';
        gm.enemies.push(e);
      });

      // Piercing bullet with charge = 3 starting at e1 position
      const piercingBullet = new BulletClass(200, 100, 200, 1, false, 3);
      piercingBullet.faction = 'INVADER';
      gm.bullets.push(piercingBullet);

      // Hit e1
      (gm as any).checkCollisions();
      const pAfterE1 = piercingBullet.piercing;
      const e1Hp = e1.hp;

      // Move bullet to e2
      piercingBullet.position.y = 150;
      (gm as any).checkCollisions();
      const pAfterE2 = piercingBullet.piercing;
      const e2Hp = e2.hp;

      // Move bullet to e3
      piercingBullet.position.y = 200;
      (gm as any).checkCollisions();
      const pAfterE3 = piercingBullet.piercing;
      const e3Hp = e3.hp;
      const bulletDeadAfterE3 = piercingBullet.isDead;

      // Move bullet to e4 (should be dead, no damage)
      piercingBullet.position.y = 250;
      (gm as any).checkCollisions();
      const e4Hp = e4.hp;

      return {
        pAfterE1,
        e1Hp,
        pAfterE2,
        e2Hp,
        pAfterE3,
        e3Hp,
        bulletDeadAfterE3,
        e4Hp,
      };
    });

    expect(result.pAfterE1).toBe(2);
    expect(result.e1Hp).toBe(2);
    expect(result.pAfterE2).toBe(1);
    expect(result.e2Hp).toBe(2);
    expect(result.pAfterE3).toBe(0);
    expect(result.e3Hp).toBe(2);
    expect(result.bulletDeadAfterE3).toBe(true);
    expect(result.e4Hp).toBe(3); // Untouched
  });

  // =========================================================================
  // ADV-R1.5: 50-UNIT HIGH DENSITY CROSSFIRE SIMULATION
  // =========================================================================
  test('ADV-R1.5: High density 50-unit crossfire swarm executes 180 physics frames without NaN or memory leakage', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;

      gm.enemies = [];
      gm.bullets = [];
      gm.particles = [];
      (gm as any).particlePool = [];

      // Spawn 25 Invaders and 25 Rogues
      for (let i = 0; i < 25; i++) {
        const invader = new EnemyClass(30 + (i % 5) * 60, 60 + Math.floor(i / 5) * 35, gm.logicalWidth, 2, 0, gm.logicalHeight);
        invader.faction = 'INVADER';
        invader.fireTimer = Math.random() * 0.5;
        gm.enemies.push(invader);
      }
      for (let i = 0; i < 25; i++) {
        const rogue = new EnemyClass(40 + (i % 5) * 60, 240 + Math.floor(i / 5) * 35, gm.logicalWidth, 2, 7, gm.logicalHeight);
        rogue.faction = 'ROGUE';
        rogue.fireTimer = Math.random() * 0.5;
        gm.enemies.push(rogue);
      }

      let hasNaN = false;
      for (let frame = 0; frame < 180; frame++) {
        (gm as any).update(1 / 60);

        if (!Number.isFinite(gm.score) || !Number.isFinite(gm.currency)) {
          hasNaN = true;
          break;
        }
        for (const e of gm.enemies) {
          if (!Number.isFinite(e.position.x) || !Number.isFinite(e.position.y) || !Number.isFinite(e.hp)) {
            hasNaN = true;
            break;
          }
        }
        for (const b of gm.bullets) {
          if (!Number.isFinite(b.position.x) || !Number.isFinite(b.position.y) || !Number.isFinite(b.velocity.x) || !Number.isFinite(b.velocity.y)) {
            hasNaN = true;
            break;
          }
        }
      }

      return {
        hasNaN,
        enemyCountRemaining: gm.enemies.filter((e: any) => !e.isDead).length,
        particleCount: gm.particles.length,
        particlePoolCount: (gm as any).particlePool.length,
        score: gm.score,
        currency: gm.currency,
      };
    });

    expect(result.hasNaN).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(result.currency).toBeGreaterThan(0);
    expect(result.particlePoolCount).toBeLessThanOrEqual(500);
  });

  // =========================================================================
  // ADV-R1.6: DYNAMIC TARGET SWITCHING (SNIPER)
  // =========================================================================
  test('ADV-R1.6: Invader Sniper dynamically shifts targeting from Player to closer Rogue Mech upon spawn', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;

      gm.enemies = [];
      gm.bullets = [];

      // Invader Sniper at (100, 100)
      const sniper = new EnemyClass(100, 100, gm.logicalWidth, 1, 3, gm.logicalHeight);
      sniper.faction = 'INVADER';
      (sniper as any).fireTimer = 0;
      gm.enemies.push(sniper);

      // Player at (100, 700) (directly below)
      gm.player.position = { x: 75, y: 700 };

      // Shot 1 (no other enemies): targets player downwards
      const bullet1 = sniper.fire(gm.player.position, gm.enemies);

      // Now spawn Rogue Mech at (300, 100) (closer horizontally)
      const rogueMech = new EnemyClass(300, 100, gm.logicalWidth, 1, 8, gm.logicalHeight);
      rogueMech.faction = 'ROGUE';
      gm.enemies.push(rogueMech);

      // Reset fire timer for shot 2
      (sniper as any).fireTimer = 0;

      // Shot 2: targets Rogue Mech horizontally
      const bullet2 = sniper.fire(gm.player.position, gm.enemies);

      return {
        bullet1Vy: bullet1 ? bullet1.velocity.y : 0,
        bullet1Vx: bullet1 ? bullet1.velocity.x : 0,
        bullet2Vy: bullet2 ? bullet2.velocity.y : 0,
        bullet2Vx: bullet2 ? bullet2.velocity.x : 0,
      };
    });

    // Bullet 1 aimed primarily down at player
    expect(result.bullet1Vy).toBeGreaterThan(300);
    expect(Math.abs(result.bullet1Vx)).toBeLessThan(50);

    // Bullet 2 aimed primarily right at Rogue Mech
    expect(result.bullet2Vx).toBeGreaterThan(300);
    expect(Math.abs(result.bullet2Vy)).toBeLessThan(50);
  });
});

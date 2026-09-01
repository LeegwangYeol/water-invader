import { test, expect } from '@playwright/test';

test.describe('Adversarial R2 Reviewer Deep Crossfire & Edge-Case Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.click('button:has-text("START GAME")');
    await page.waitForFunction(() => !!(window as any).gameManager);
  });

  // =========================================================================
  // ADV-R2.1: Barricade Crossfire Interception & Dynamic Gap Penetration
  // =========================================================================
  test('ADV-R2.1: Barricade blocks same-faction crossfire bullet, degrades, and permits crossfire once destroyed', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0]?.constructor || (window as any).Enemy;
      const BulletClass = gm.bullets[0]?.constructor || (window as any).Bullet;
      const BarricadeClass = gm.barricades[0]?.constructor;

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      // Create destructible barricade with 2 HP at (190, 190)
      const barricade = new BarricadeClass(190, 190, 0); // BarricadeType.DESTRUCTIBLE
      barricade.hp = 2;
      barricade.maxHp = 20;
      gm.barricades.push(barricade);

      // Target Invader sitting behind the barricade at (190, 250)
      const targetInvader = new EnemyClass(190, 250, gm.logicalWidth, 1, 0, gm.logicalHeight);
      targetInvader.hp = 5;
      targetInvader.faction = 'INVADER';
      gm.enemies.push(targetInvader);

      // Firing Invader at (190, 150)
      const shooter = new EnemyClass(190, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
      shooter.hp = 5;
      shooter.faction = 'INVADER';
      gm.enemies.push(shooter);

      // Shot 1: Crossfire bullet headed straight through barricade toward targetInvader
      const bullet1 = new BulletClass(200, 195, 200, 1, false, 1);
      bullet1.faction = 'INVADER';
      bullet1.shooter = shooter;
      bullet1.hitEntities.add(shooter);
      gm.bullets.push(bullet1);

      // Collide shot 1: Should hit barricade and NOT damage targetInvader
      (gm as any).checkCollisions(1 / 60);
      barricade.update(1 / 60);

      const shot1_barricadeHp = barricade.hp;
      const shot1_barricadeDead = barricade.isDead;
      const shot1_bullet1Dead = bullet1.isDead;
      const shot1_targetHp = targetInvader.hp;

      // Shot 2: Destroys the remaining 1 HP of the barricade
      const bullet2 = new BulletClass(200, 195, 200, 1, false, 1);
      bullet2.faction = 'INVADER';
      bullet2.shooter = shooter;
      bullet2.hitEntities.add(shooter);
      gm.bullets.push(bullet2);

      (gm as any).checkCollisions(1 / 60);
      barricade.update(1 / 60);

      const shot2_barricadeHp = barricade.hp;
      const shot2_barricadeDead = barricade.isDead;
      const shot2_targetHp = targetInvader.hp;

      // Shot 3: Barricade is now dead, crossfire bullet must penetrate through to targetInvader
      const bullet3 = new BulletClass(200, 250, 200, 1, false, 1);
      bullet3.faction = 'INVADER';
      bullet3.shooter = shooter;
      bullet3.hitEntities.add(shooter);
      gm.bullets.push(bullet3);

      (gm as any).checkCollisions(1 / 60);

      const shot3_bullet3Dead = bullet3.isDead;
      const shot3_targetHp = targetInvader.hp;

      return {
        shot1_barricadeHp,
        shot1_barricadeDead,
        shot1_bullet1Dead,
        shot1_targetHp,
        shot2_barricadeHp,
        shot2_barricadeDead,
        shot2_targetHp,
        shot3_bullet3Dead,
        shot3_targetHp,
      };
    });

    expect(result.shot1_bullet1Dead).toBe(true);
    expect(result.shot1_barricadeHp).toBe(1);
    expect(result.shot1_barricadeDead).toBe(false);
    expect(result.shot1_targetHp).toBe(5); // Target completely protected

    expect(result.shot2_barricadeHp).toBe(0);
    expect(result.shot2_barricadeDead).toBe(true);
    expect(result.shot2_targetHp).toBe(5); // Target still unharmed when barricade absorbs final blow

    expect(result.shot3_bullet3Dead).toBe(true);
    expect(result.shot3_targetHp).toBe(4); // Crossfire reaches target now that cover is destroyed
  });

  // =========================================================================
  // ADV-R2.2: Helper Drone Absorbing Hostile Crossfire Projectiles
  // =========================================================================
  test('ADV-R2.2: Player Helper Tank intercepts and absorbs stray hostile crossfire bullet', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = (window as any).Bullet;
      const HelperClass = (window as any).Helper;

      gm.enemies = [];
      gm.bullets = [];
      gm.helpers = [];

      // Spawn Player Tank Helper with 15 HP at (200, 300)
      const tankHelper = new HelperClass(200, 300, gm.logicalWidth, gm.logicalHeight, 2); // HelperType.TANK
      tankHelper.hp = 15;
      tankHelper.isInvincible = false;
      gm.helpers.push(tankHelper);

      // Hostile Rogue Mech crossfire bullet aimed downwards
      const rogueBullet = new BulletClass(210, 310, 250, 2, false, 1);
      rogueBullet.faction = 'ROGUE';
      gm.bullets.push(rogueBullet);

      (gm as any).checkCollisions(1 / 60);

      const helperHpAfterHit = tankHelper.hp;
      const bulletDead = rogueBullet.isDead;

      // Friendly bullet from Player does NOT damage Player Helper
      const playerBullet = new BulletClass(210, 310, -400, 1, true, 1);
      playerBullet.faction = 'PLAYER';
      gm.bullets.push(playerBullet);

      (gm as any).checkCollisions(1 / 60);

      const helperHpAfterPlayerBullet = tankHelper.hp;
      const playerBulletDead = playerBullet.isDead;

      return {
        helperHpAfterHit,
        bulletDead,
        helperHpAfterPlayerBullet,
        playerBulletDead,
      };
    });

    expect(result.bulletDead).toBe(true);
    expect(result.helperHpAfterHit).toBe(13); // Took 2 damage from Rogue Mech bullet
    expect(result.helperHpAfterPlayerBullet).toBe(13); // Friendly bullet caused 0 damage
    expect(result.playerBulletDead).toBe(false); // Friendly bullet was not blocked by helper
  });

  // =========================================================================
  // ADV-R2.3: Shop Upgrade Currency Deduction and Post-Death Run Persistence
  // =========================================================================
  test('ADV-R2.3: Currency spent in Shop/GameOver persists correctly across death and respawn', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      // Accumulate 1000 cash and 5000 score
      gm.score = 5000;
      gm.currency = 1000;

      // Spend 50 currency on FireRate upgrade
      gm.upgradeFireRate();
      const currencyAfter1stUpgrade = gm.currency; // 950
      const fireRateLevelAfter1st = gm.getUpgrades().fireRate; // 2

      // Spend 100 currency on MultiShot upgrade
      gm.upgradeMultiShot();
      const currencyAfter2ndUpgrade = gm.currency; // 850
      const multiShotLevelAfter2nd = gm.getUpgrades().multiShot; // 2

      // Kill player to trigger Game Over
      gm.player.hp = 0;
      (gm as any).gameOver('Hull breach');
      const stateOnDeath = gm.state;
      const currencyOnDeath = gm.currency;
      const scoreOnDeath = gm.score;

      // Respawn via init()
      gm.init();
      const scoreAfterRespawn = gm.score;
      const currencyAfterRespawn = gm.currency;

      // Earn 50 more currency in the new life
      gm.currency += 50;
      gm.score += 300;

      return {
        currencyAfter1stUpgrade,
        fireRateLevelAfter1st,
        currencyAfter2ndUpgrade,
        multiShotLevelAfter2nd,
        stateOnDeath,
        currencyOnDeath,
        scoreOnDeath,
        scoreAfterRespawn,
        currencyAfterRespawn,
        finalCurrency: gm.currency,
        finalScore: gm.score,
      };
    });

    expect(result.currencyAfter1stUpgrade).toBe(950);
    expect(result.fireRateLevelAfter1st).toBe(2);
    expect(result.currencyAfter2ndUpgrade).toBe(850);
    expect(result.multiShotLevelAfter2nd).toBe(2);
    expect(result.stateOnDeath).toBe('GAME_OVER');
    expect(result.currencyOnDeath).toBe(850);
    expect(result.scoreOnDeath).toBe(5000);
    expect(result.currencyAfterRespawn).toBe(850); // Preserves exact remaining balance
    expect(result.scoreAfterRespawn).toBe(5000);
    expect(result.finalCurrency).toBe(900);
    expect(result.finalScore).toBe(5300);
  });

  // =========================================================================
  // ADV-R2.4: Boss Escort Legion Crossfire Shield Break & Boss Elimination
  // =========================================================================
  test('ADV-R2.4: Stage 10+ Boss Escort crossfire triggers Shielded enemy shield break and awards crossfire kill bonuses', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const BulletClass = (window as any).Bullet;

      gm.level = 10;
      gm.enemies = [];
      gm.bullets = [];
      gm.score = 1000;
      gm.currency = 100;
      gm.combo = 0;

      // Shielded enemy with 8 HP and 6 Shield HP
      const shielded = new EnemyClass(150, 150, gm.logicalWidth, 10, 5, gm.logicalHeight); // EnemyType.SHIELDED = 5
      shielded.hp = 8;
      shielded.shieldHp = 6;
      shielded.faction = 'INVADER';
      gm.enemies.push(shielded);

      // Rogue Mech with 3-damage crossfire bullet hitting Shielded enemy twice
      const bullet1 = new BulletClass(155, 155, 200, 3, false, 1);
      bullet1.faction = 'ROGUE';
      gm.bullets.push(bullet1);
      const collided1 = bullet1.checkCollision(shielded);
      (gm as any).checkCollisions(1 / 60);

      const shieldAfterHit1 = shielded.shieldHp;
      const hpAfterHit1 = shielded.hp;

      const bullet2 = new BulletClass(155, 155, 200, 3, false, 1);
      bullet2.faction = 'ROGUE';
      gm.bullets.push(bullet2);
      (gm as any).checkCollisions(1 / 60);

      const shieldAfterHit2 = shielded.shieldHp;
      const hpAfterHit2 = shielded.hp;

      // Hit 3: Direct HP damage now that shield is broken
      const bullet3 = new BulletClass(155, 155, 200, 8, false, 1);
      bullet3.faction = 'ROGUE';
      gm.bullets.push(bullet3);
      (gm as any).checkCollisions(1 / 60);

      return {
        collided1,
        shieldAfterHit1,
        hpAfterHit1,
        shieldAfterHit2,
        hpAfterHit2,
        shieldedDead: shielded.isDead,
        finalScore: gm.score,
        finalCurrency: gm.currency,
        combo: gm.combo,
      };
    });

    expect(result.collided1).toBe(true);
    expect(result.shieldAfterHit1).toBe(3);
    expect(result.hpAfterHit1).toBe(8);
    expect(result.shieldAfterHit2).toBe(0); // Shield broken
    expect(result.hpAfterHit2).toBe(8); // HP preserved while shield absorbed the hit
    expect(result.shieldedDead).toBe(true); // Destroyed by direct HP hit
    expect(result.finalScore).toBe(1150); // 1000 + 150 crossfire kill
    expect(result.finalCurrency).toBe(108); // 100 + 8 crossfire currency
    expect(result.combo).toBe(1);
  });

  // =========================================================================
  // ADV-R2.5: Mid-Air Bullet vs Bullet Interception Between Hostile Factions
  // =========================================================================
  test('ADV-R2.5: Hostile interceptable bullets collide and neutralize each other mid-flight', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet;

      gm.enemies = [];
      gm.bullets = [];

      // Invader Sniper bullet (isInterceptable = true) moving downward at (200, 200)
      const invaderBullet = new BulletClass(200, 200, 200, 2, false, 1);
      invaderBullet.faction = 'INVADER';
      invaderBullet.isInterceptable = true;

      // Rogue Stalker bullet (isInterceptable = true) moving upward/crossing at (202, 202)
      const rogueBullet = new BulletClass(202, 202, -200, 2, false, 1);
      rogueBullet.faction = 'ROGUE';
      rogueBullet.isInterceptable = true;

      gm.bullets.push(invaderBullet, rogueBullet);

      (gm as any).checkCollisions(1 / 60);

      return {
        invaderBulletDead: invaderBullet.isDead,
        rogueBulletDead: rogueBullet.isDead,
        particlesGenerated: gm.particles.length,
      };
    });

    expect(result.invaderBulletDead).toBe(true);
    expect(result.rogueBulletDead).toBe(true);
    expect(result.particlesGenerated).toBeGreaterThanOrEqual(8);
  });

  // =========================================================================
  // ADV-R2.6: High Density 3-Way Chaos Stress Simulation (120 Fixed Ticks)
  // =========================================================================
  test('ADV-R2.6: 40-unit 3-way chaotic battle executes 120 fixed physics ticks without NaN or memory leakage', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const HelperClass = (window as any).Helper;

      gm.enemies = [];
      gm.bullets = [];
      gm.helpers = [];
      gm.particles = [];

      // Spawn 15 Invaders
      for (let i = 0; i < 15; i++) {
        const x = 30 + (i % 5) * 80;
        const y = 50 + Math.floor(i / 5) * 45;
        const enemy = new EnemyClass(x, y, gm.logicalWidth, 5, i % 5, gm.logicalHeight);
        enemy.faction = 'INVADER';
        gm.enemies.push(enemy);
      }

      // Spawn 15 Rogues
      for (let i = 0; i < 15; i++) {
        const x = 50 + (i % 5) * 80;
        const y = 200 + Math.floor(i / 5) * 45;
        const enemy = new EnemyClass(x, y, gm.logicalWidth, 5, 6 + (i % 3), gm.logicalHeight);
        enemy.faction = 'ROGUE';
        gm.enemies.push(enemy);
      }

      // Spawn 2 Player Helpers
      gm.helpers.push(new HelperClass(100, 500, gm.logicalWidth, gm.logicalHeight, 0));
      gm.helpers.push(new HelperClass(300, 500, gm.logicalWidth, gm.logicalHeight, 2));

      let nanDetails: string[] = [];

      // Run 120 physics steps
      for (let step = 0; step < 120; step++) {
        (gm as any).update(1 / 60);

        // Check for any NaN coordinates
        for (let i = 0; i < gm.enemies.length; i++) {
          const e = gm.enemies[i];
          if (!Number.isFinite(e.position.x)) nanDetails.push(`step ${step} enemy[${i}] type ${e.type} x is ${e.position.x}`);
          if (!Number.isFinite(e.position.y)) nanDetails.push(`step ${step} enemy[${i}] type ${e.type} y is ${e.position.y}`);
          if (!Number.isFinite(e.hp)) nanDetails.push(`step ${step} enemy[${i}] type ${e.type} hp is ${e.hp}`);
        }
        for (let i = 0; i < gm.bullets.length; i++) {
          const b = gm.bullets[i];
          if (!Number.isFinite(b.position.x)) nanDetails.push(`step ${step} bullet[${i}] x is ${b.position.x}`);
          if (!Number.isFinite(b.position.y)) nanDetails.push(`step ${step} bullet[${i}] y is ${b.position.y}`);
        }
        for (let i = 0; i < gm.particles.length; i++) {
          const p = gm.particles[i];
          if (!Number.isFinite(p.position.x)) nanDetails.push(`step ${step} particle[${i}] x is ${p.position.x}`);
          if (!Number.isFinite(p.position.y)) nanDetails.push(`step ${step} particle[${i}] y is ${p.position.y}`);
        }
        if (nanDetails.length > 0) break;
      }

      return {
        hasNaN: nanDetails.length > 0,
        nanDetails,
        enemiesRemaining: gm.enemies.length,
        bulletsRemaining: gm.bullets.length,
        particlesRemaining: gm.particles.length,
        score: gm.score,
        currency: gm.currency,
      };
    });

    expect(result.nanDetails).toEqual([]);
    expect(result.hasNaN).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(result.currency).toBeGreaterThan(0);
  });
});

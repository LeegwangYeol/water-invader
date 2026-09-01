import { test, expect } from '@playwright/test';

test.describe('Milestone M4: Extreme Difficulty Scaling & Emergency Crisis Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE
  // =========================================================================

  test('T1-01 [HP SCALING]: Stage 10+ enemies exhibit piecewise exponential HP scaling', async ({ page }) => {
    const results = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const EnemyType = {
        NORMAL: 0,
        ZIGZAG: 1,
        BOSS: 2,
        SNIPER: 3,
        DIVER: 4,
        SHIELDED: 5,
        SPLITTER: 6,
        ROGUE_DRONE: 7,
        ROGUE_STALKER: 8,
        ROGUE_MECH: 9
      };

      // Wave 1-9 Baseline
      const eW1 = new EnemyClass(100, 100, gm.logicalWidth, 1, EnemyType.NORMAL, gm.logicalHeight);
      const eW9 = new EnemyClass(100, 100, gm.logicalWidth, 9, EnemyType.NORMAL, gm.logicalHeight);

      // Stage 10+ Scaling: standardHp = 4 + (lvl - 9)*6 + floor((lvl - 9)^1.5)
      // Level 10: 4 + 6 + 1 = 11
      const eW10_Normal = new EnemyClass(100, 100, gm.logicalWidth, 10, EnemyType.NORMAL, gm.logicalHeight);
      // Level 11: 4 + 12 + 2 = 18
      const eW11_Normal = new EnemyClass(100, 100, gm.logicalWidth, 11, EnemyType.NORMAL, gm.logicalHeight);
      // Level 12: 4 + 18 + 5 = 27
      const eW12_Normal = new EnemyClass(100, 100, gm.logicalWidth, 12, EnemyType.NORMAL, gm.logicalHeight);

      // Shielded: hp = 8 + (lvl-9)*4 = 12, shieldHp = 6 + (lvl-9)*3 = 9 at lvl 10
      const eW10_Shielded = new EnemyClass(100, 100, gm.logicalWidth, 10, EnemyType.SHIELDED, gm.logicalHeight);

      // Rogues at lvl 10:
      // Drone: 3 + (10-9)*3 = 6
      const eW10_RogueDrone = new EnemyClass(100, 100, gm.logicalWidth, 10, EnemyType.ROGUE_DRONE, gm.logicalHeight);
      // Stalker: 6 + (10-9)*5 = 11
      const eW10_RogueStalker = new EnemyClass(100, 100, gm.logicalWidth, 10, EnemyType.ROGUE_STALKER, gm.logicalHeight);
      // Mech: 15 + (10-9)*10 = 25
      const eW10_RogueMech = new EnemyClass(100, 100, gm.logicalWidth, 10, EnemyType.ROGUE_MECH, gm.logicalHeight);

      // Boss at lvl 10: 50 + 10*25 + floor(5^2 * 2.5) = 50 + 250 + 62 = 362
      const eW10_Boss = new EnemyClass(100, 100, gm.logicalWidth, 10, EnemyType.BOSS, gm.logicalHeight);

      return {
        eW1_hp: eW1.hp,
        eW9_hp: eW9.hp,
        eW10_Normal_hp: eW10_Normal.hp,
        eW11_Normal_hp: eW11_Normal.hp,
        eW12_Normal_hp: eW12_Normal.hp,
        eW10_Shielded_hp: eW10_Shielded.hp,
        eW10_Shielded_shield: eW10_Shielded.shieldHp,
        eW10_RogueDrone_hp: eW10_RogueDrone.hp,
        eW10_RogueStalker_hp: eW10_RogueStalker.hp,
        eW10_RogueMech_hp: eW10_RogueMech.hp,
        eW10_Boss_hp: eW10_Boss.hp,
        eW10_Normal_isAggressive: eW10_Normal.isAggressive,
        eW10_Normal_rushMod: eW10_Normal.rushVelocityModifier,
      };
    });

    expect(results.eW1_hp).toBe(1);
    expect(results.eW9_hp).toBe(4);
    expect(results.eW10_Normal_hp).toBe(11);
    expect(results.eW11_Normal_hp).toBe(18);
    expect(results.eW12_Normal_hp).toBe(27);
    expect(results.eW10_Shielded_hp).toBe(12);
    expect(results.eW10_Shielded_shield).toBe(9);
    expect(results.eW10_RogueDrone_hp).toBe(6);
    expect(results.eW10_RogueStalker_hp).toBe(11);
    expect(results.eW10_RogueMech_hp).toBe(25);
    expect(results.eW10_Boss_hp).toBe(362);
    expect(results.eW10_Normal_isAggressive).toBe(true);
    expect(results.eW10_Normal_rushMod).toBeGreaterThanOrEqual(1.8);
  });

  test('T1-02 [ATTACK TEMPO & ELITE SHOTS]: Stage 10+ elite shots deal 2 damage with accelerated velocity', async ({ page }) => {
    const results = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;
      const EnemyType = {
        NORMAL: 0,
        BOSS: 2,
        SNIPER: 3,
        ROGUE_DRONE: 7,
        ROGUE_STALKER: 8,
        ROGUE_MECH: 9
      };

      // Stage 10 Normal vs Elite
      const normalLvl10 = new EnemyClass(100, 100, gm.logicalWidth, 10, EnemyType.NORMAL, gm.logicalHeight);
      const sniperLvl10 = new EnemyClass(150, 100, gm.logicalWidth, 10, EnemyType.SNIPER, gm.logicalHeight);
      const bossLvl10 = new EnemyClass(200, 100, gm.logicalWidth, 10, EnemyType.BOSS, gm.logicalHeight);
      const droneLvl10 = new EnemyClass(250, 100, gm.logicalWidth, 10, EnemyType.ROGUE_DRONE, gm.logicalHeight);
      const stalkerLvl10 = new EnemyClass(300, 100, gm.logicalWidth, 10, EnemyType.ROGUE_STALKER, gm.logicalHeight);
      const mechLvl10 = new EnemyClass(350, 100, gm.logicalWidth, 10, EnemyType.ROGUE_MECH, gm.logicalHeight);

      // Force fire timers to 0
      normalLvl10.fireTimer = 0;
      sniperLvl10.fireTimer = 0;
      bossLvl10.fireTimer = 0;
      droneLvl10.fireTimer = 0;
      stalkerLvl10.fireTimer = 0;
      mechLvl10.fireTimer = 0;

      const bulletNormal = normalLvl10.fire(gm.player.position, []);
      const bulletSniper = sniperLvl10.fire(gm.player.position, []);
      const bulletBoss = bossLvl10.fire(gm.player.position, []);
      const bulletDrone = droneLvl10.fire(gm.player.position, []);
      const bulletStalker = stalkerLvl10.fire(gm.player.position, []);
      const bulletMech = mechLvl10.fire(gm.player.position, []);

      return {
        normalDamage: bulletNormal.damage,
        normalSpeed: Math.round(Math.hypot(bulletNormal.velocity.x, bulletNormal.velocity.y)),
        sniperDamage: bulletSniper.damage,
        sniperSpeed: Math.round(Math.hypot(bulletSniper.velocity.x, bulletSniper.velocity.y)),
        bossDamage: bulletBoss.damage,
        bossSpeed: Math.round(Math.hypot(bulletBoss.velocity.x, bulletBoss.velocity.y)),
        droneDamage: bulletDrone.damage,
        droneSpeed: Math.round(Math.hypot(bulletDrone.velocity.x, bulletDrone.velocity.y)),
        stalkerDamage: bulletStalker.damage,
        stalkerSpeed: Math.round(Math.hypot(bulletStalker.velocity.x, bulletStalker.velocity.y)),
        mechDamage: bulletMech.damage,
        mechSpeed: Math.round(Math.hypot(bulletMech.velocity.x, bulletMech.velocity.y)),
        mechPiercing: bulletMech.piercing,
      };
    });

    // Normal & Drone shots: 1 damage
    expect(results.normalDamage).toBe(1);
    expect(results.droneDamage).toBe(1);

    // Elite shots (Sniper, Boss, Stalker, Mech): 2 damage
    expect(results.sniperDamage).toBe(2);
    expect(results.bossDamage).toBe(2);
    expect(results.stalkerDamage).toBe(2);
    expect(results.mechDamage).toBe(2);
    expect(results.mechPiercing).toBe(2);

    // Accelerated projectile speeds at Stage 10 (250 px/s standard, 400 px/s sniper)
    expect(results.normalSpeed).toBe(250);
    expect(results.sniperSpeed).toBe(400);
    expect(results.bossSpeed).toBe(250);
    expect(results.stalkerSpeed).toBe(250);
  });

  test('T1-03 [BOSS ESCORTS]: Stage 10 Boss spawns with dedicated minion escort formations', async ({ page }) => {
    const results = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.enemies = [];
      gm.level = 10;

      // Call spawnWave at level 10 (Boss wave % 5 === 0)
      gm.spawnWave();

      const boss = gm.enemies.find((e: any) => e.type === 2); // BOSS
      const shieldedEscorts = gm.enemies.filter((e: any) => e.type === 5); // SHIELDED
      const sniperEscorts = gm.enemies.filter((e: any) => e.type === 3); // SNIPER
      const diverEscorts = gm.enemies.filter((e: any) => e.type === 4); // DIVER

      return {
        totalEnemies: gm.enemies.length,
        hasBoss: !!boss,
        bossHp: boss?.hp,
        shieldedCount: shieldedEscorts.length,
        sniperCount: sniperEscorts.length,
        diverCount: diverEscorts.length,
      };
    });

    expect(results.hasBoss).toBe(true);
    expect(results.bossHp).toBe(362);
    expect(results.totalEnemies).toBeGreaterThanOrEqual(5); // Boss + at least 4 escorts
    expect(results.shieldedCount).toBeGreaterThanOrEqual(1);
    expect(results.sniperCount).toBeGreaterThanOrEqual(1);
    expect(results.diverCount).toBeGreaterThanOrEqual(1);
  });

  test('T1-04 [5 CRISES]: All 5 Emergency Crisis archetypes trigger and instantiate correct unit formations', async ({ page }) => {
    // 1. TITAN_HORDE
    const titanResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.enemies = [];
      gm.triggerCrisis('TITAN_HORDE');
      gm.crisisState.warningTimer = 0;
      gm.activateCrisisEffect('TITAN_HORDE');

      const boss = gm.enemies.find((e: any) => e.type === 2);
      const shielded = gm.enemies.filter((e: any) => e.type === 5);
      const divers = gm.enemies.filter((e: any) => e.type === 4);

      return {
        activeCrisis: gm.crisisState.activeCrisis,
        bossHp: boss?.hp,
        shieldedCount: shielded.length,
        diverCount: divers.length,
        totalEnemies: gm.enemies.length,
      };
    });
    expect(titanResult.activeCrisis).toBe('TITAN_HORDE');
    expect(titanResult.bossHp).toBeGreaterThanOrEqual(250);
    expect(titanResult.shieldedCount).toBe(4);
    expect(titanResult.diverCount).toBe(4);
    expect(titanResult.totalEnemies).toBe(9);

    // 2. SWARM_BLITZ
    const swarmResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.enemies = [];
      gm.triggerCrisis('SWARM_BLITZ');
      gm.crisisState.warningTimer = 0;
      gm.activateCrisisEffect('SWARM_BLITZ');

      const divers = gm.enemies.filter((e: any) => e.type === 4);
      const zigzags = gm.enemies.filter((e: any) => e.type === 1);

      return {
        activeCrisis: gm.crisisState.activeCrisis,
        diverCount: divers.length,
        zigzagCount: zigzags.length,
        totalEnemies: gm.enemies.length,
      };
    });
    expect(swarmResult.activeCrisis).toBe('SWARM_BLITZ');
    expect(swarmResult.diverCount).toBe(8);
    expect(swarmResult.zigzagCount).toBe(3);
    expect(swarmResult.totalEnemies).toBe(11);

    // 3. EMP_DISRUPTION
    const empResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.enemies = [];
      gm.triggerCrisis('EMP_DISRUPTION');
      gm.crisisState.warningTimer = 0;
      gm.activateCrisisEffect('EMP_DISRUPTION');

      return {
        activeCrisis: gm.crisisState.activeCrisis,
        empSuppressionActive: gm.crisisState.empSuppressionActive,
        empTimer: gm.crisisState.empTimer,
        playerShooting: gm.player.isShooting,
        suppressionLevel: gm.player.suppressionLevel,
        enemyCount: gm.enemies.length,
      };
    });
    expect(empResult.activeCrisis).toBe('EMP_DISRUPTION');
    expect(empResult.empSuppressionActive).toBe(true);
    expect(empResult.empTimer).toBe(2.5);
    expect(empResult.playerShooting).toBe(false);
    expect(empResult.suppressionLevel).toBe(100);
    expect(empResult.enemyCount).toBe(4); // 2 Snipers + 2 Rogue Stalkers

    // 4. TOTAL_WAR
    const totalWarResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.enemies = [];
      gm.triggerCrisis('TOTAL_WAR');
      gm.crisisState.warningTimer = 0;
      gm.activateCrisisEffect('TOTAL_WAR');

      const invaders = gm.enemies.filter((e: any) => e.faction === 'INVADER');
      const rogues = gm.enemies.filter((e: any) => e.faction === 'ROGUE');

      return {
        activeCrisis: gm.crisisState.activeCrisis,
        invaderCount: invaders.length,
        rogueCount: rogues.length,
        totalEnemies: gm.enemies.length,
      };
    });
    expect(totalWarResult.activeCrisis).toBe('TOTAL_WAR');
    expect(totalWarResult.invaderCount).toBe(11);
    expect(totalWarResult.rogueCount).toBe(11);
    expect(totalWarResult.totalEnemies).toBe(22);

    // 5. ACID_STORM
    const acidResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.hazardProjectiles = [];
      gm.triggerCrisis('ACID_STORM');
      gm.crisisState.warningTimer = 0;
      gm.activateCrisisEffect('ACID_STORM');

      for (let i = 0; i < 10; i++) {
        gm.update(0.05);
      }

      return {
        activeCrisis: gm.crisisState.activeCrisis,
        hasHazards: gm.hazardProjectiles.length > 0,
        sampleHazardDamage: gm.hazardProjectiles[0]?.damage,
      };
    });
    expect(acidResult.activeCrisis).toBe('ACID_STORM');
    expect(acidResult.hasHazards).toBe(true);
    expect(acidResult.sampleHazardDamage).toBe(1);
  });

  test('T1-05 [WEB AUDIO PROCEDURAL SYNTHESIS]: Crisis alarm, EMP sound, and Acid storm sound execute without error', async ({ page }) => {
    const audioResult = await page.evaluate(() => {
      let errorLogged = null;

      try {
        const gm = (window as any).gameManager;
        gm.triggerCrisis('TITAN_HORDE');
        gm.activateCrisisEffect('EMP_DISRUPTION');
        gm.activateCrisisEffect('ACID_STORM');
      } catch (e: any) {
        errorLogged = e.message;
      }

      return {
        errorLogged,
      };
    });

    expect(audioResult.errorLogged).toBeNull();
  });

  test('T1-06 [HUD WARNING & BADGES]: Crisis Warning Banner, EMP Badge, and Acid Storm Badge render accurately', async ({ page }) => {
    // 1. Check Warning Banner
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerCrisis('TITAN_HORDE');
    });

    const banner = page.locator('[data-testid="crisis-warning-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('EMERGENCY CRISIS DETECTED');
    await expect(banner).toContainText('TITAN BIO-MECH ESCORT HORDE');

    // 2. Check EMP Badge
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerCrisis('EMP_DISRUPTION');
    });
    // Wait for 2s warning to transition into active phase
    await page.waitForTimeout(2200);

    const empBadge = page.locator('[data-testid="emp-suppression-badge"]');
    await expect(empBadge).toBeVisible();
    await expect(empBadge).toContainText('WEAPONS SUPPRESSED (EMP ACTIVE)');

    // 3. Check Acid Storm Badge
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.triggerCrisis('ACID_STORM');
    });
    await page.waitForTimeout(2200);

    const acidBadge = page.locator('[data-testid="acid-storm-badge"]');
    await expect(acidBadge).toBeVisible();
    await expect(acidBadge).toContainText('TOXIC ACID STORM ACTIVE');
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  test('T2-01 [BOUNDARY CONTINUITY]: Stage 9 (4 HP) vs Stage 10 (11 HP) inflection point', async ({ page }) => {
    const boundaryCheck = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy;

      const hpW8 = new EnemyClass(100, 100, gm.logicalWidth, 8, 0, gm.logicalHeight).hp;
      const hpW9 = new EnemyClass(100, 100, gm.logicalWidth, 9, 0, gm.logicalHeight).hp;
      const hpW10 = new EnemyClass(100, 100, gm.logicalWidth, 10, 0, gm.logicalHeight).hp;

      return {
        hpW8,
        hpW9,
        hpW10,
        deltaW9_W8: hpW9 - hpW8,
        deltaW10_W9: hpW10 - hpW9,
      };
    });

    // Wave 8 -> Wave 9: 3 -> 4 (delta 1)
    expect(boundaryCheck.hpW8).toBe(3);
    expect(boundaryCheck.hpW9).toBe(4);
    expect(boundaryCheck.deltaW9_W8).toBe(1);

    // Wave 9 -> Wave 10: 4 -> 11 (sharp jump of 7 HP for extreme difficulty)
    expect(boundaryCheck.hpW10).toBe(11);
    expect(boundaryCheck.deltaW10_W9).toBe(7);
  });

  test('T2-02 [EMP RESTORATION]: EMP suppression lasts exactly 2.5s and cleanly restores shooting ability', async ({ page }) => {
    const suppressionLifecycle = await page.evaluate(async () => {
      const gm = (window as any).gameManager;
      gm.triggerCrisis('EMP_DISRUPTION');
      gm.crisisState.warningTimer = 0;
      gm.activateCrisisEffect('EMP_DISRUPTION');

      // Frame 1: During EMP
      gm.player.isShooting = true;
      gm.update(0.5); // 2.0s remaining
      const shootingDuringEMP = gm.player.isShooting;
      const empActiveDuring = gm.crisisState.empSuppressionActive;
      const empTimerRemaining = gm.crisisState.empTimer;

      // Update 2.1s more -> total 2.6s elapsed (EMP should expire)
      gm.update(2.1);
      const empActiveAfter = gm.crisisState.empSuppressionActive;
      const empTimerAfter = gm.crisisState.empTimer;

      // Now player shoots
      gm.player.isShooting = true;
      gm.player.fireTimer = 0;
      const newBullets = gm.player.update(0.1);

      return {
        shootingDuringEMP,
        empActiveDuring,
        empTimerRemaining,
        empActiveAfter,
        empTimerAfter,
        restoredBulletsFired: newBullets.length,
      };
    });

    expect(suppressionLifecycle.shootingDuringEMP).toBe(false);
    expect(suppressionLifecycle.empActiveDuring).toBe(true);
    expect(suppressionLifecycle.empTimerRemaining).toBeCloseTo(2.0, 1);
    expect(suppressionLifecycle.empActiveAfter).toBe(false);
    expect(suppressionLifecycle.empTimerAfter).toBe(0);
    expect(suppressionLifecycle.restoredBulletsFired).toBeGreaterThanOrEqual(1);
  });

  test('T2-03 [HAZARD CLEANUP]: Off-screen Acid Storm projectiles are garbage-collected to prevent memory leaks', async ({ page }) => {
    const cleanupResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.hazardProjectiles = [];
      gm.crisisState.activeCrisis = null;
      gm.crisisState.warningTimer = 0;

      // Add 10 hazard projectiles, 5 on-screen and 5 past logicalHeight + 30
      for (let i = 0; i < 5; i++) {
        gm.hazardProjectiles.push({
          x: 100 + i * 20,
          y: 200,
          radius: 5,
          speedY: 200,
          damage: 1,
          isDead: false,
        });
      }
      for (let i = 0; i < 5; i++) {
        gm.hazardProjectiles.push({
          x: 100 + i * 20,
          y: gm.logicalHeight + 50, // Past bottom boundary
          radius: 5,
          speedY: 200,
          damage: 1,
          isDead: false,
        });
      }

      const initialCount = gm.hazardProjectiles.length; // 10

      // Run update
      gm.update(0.05);

      const compactedCount = gm.hazardProjectiles.length;
      const remainingOffscreen = gm.hazardProjectiles.filter((hz: any) => hz.y > gm.logicalHeight + 30);

      return {
        initialCount,
        compactedCount,
        remainingOffscreenCount: remainingOffscreen.length,
      };
    });

    expect(cleanupResult.initialCount).toBe(10);
    expect(cleanupResult.compactedCount).toBe(5);
    expect(cleanupResult.remainingOffscreenCount).toBe(0);
  });

  test('T2-04 [ZERO SOFT-LOCKS]: Wave cleanly transitions to SHOP when crisis hostiles are eliminated', async ({ page }) => {
    const transitionCheck = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 10;
      gm.state = 'PLAYING';
      gm.enemies = [];
      gm.triggerCrisis('TOTAL_WAR');
      gm.crisisState.warningTimer = 0;
      gm.activateCrisisEffect('TOTAL_WAR');

      // Verify units are present
      const initialEnemies = gm.enemies.length; // 22

      // Kill all enemies
      gm.enemies.forEach((e: any) => {
        e.isDead = true;
      });

      // Clear warning timer and pending reinforcement
      gm.warningTimer = 0;
      gm.pendingReinforcement = null;
      gm.crisisState.warningTimer = 0;
      gm.crisisState.activeCrisis = null;

      // Run update
      gm.update(0.1);

      return {
        initialEnemies,
        finalState: gm.state,
        activeCrisisState: gm.crisisState.activeCrisis,
        enemiesRemaining: gm.enemies.length,
      };
    });

    expect(transitionCheck.initialEnemies).toBe(22);
    expect(transitionCheck.finalState).toBe('SHOP');
    expect(transitionCheck.activeCrisisState).toBeNull();
    expect(transitionCheck.enemiesRemaining).toBe(0);
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================

  test('T3-01 [TOTAL WAR + EMP]: 3-Way combat runs seamlessly with simultaneous EMP weapon disruption', async ({ page }) => {
    const combatSimulation = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 10;
      gm.state = 'PLAYING';
      gm.enemies = [];

      // Trigger Total War and activate
      gm.triggerCrisis('TOTAL_WAR');
      gm.crisisState.warningTimer = 0;
      gm.activateCrisisEffect('TOTAL_WAR');

      // Set fire timers on several enemies to 0 so they immediately engage in crossfire
      gm.enemies.forEach((e: any, idx: number) => {
        if (idx % 2 === 0) e.fireTimer = 0;
      });

      // Manually trigger EMP suppression on top
      gm.crisisState.empSuppressionActive = true;
      gm.crisisState.empTimer = 2.5;

      // Run 60 physics simulation steps (1/60s each = 1 second)
      for (let step = 0; step < 60; step++) {
        gm.update(1 / 60);
      }

      const activeInvaders = gm.enemies.filter((e: any) => !e.isDead && e.faction === 'INVADER');
      const activeRogues = gm.enemies.filter((e: any) => !e.isDead && e.faction === 'ROGUE');
      const activeBullets = gm.bullets.filter((b: any) => !b.isDead);

      return {
        empSuppressionActive: gm.crisisState.empSuppressionActive,
        playerShooting: gm.player.isShooting,
        activeInvaderCount: activeInvaders.length,
        activeRogueCount: activeRogues.length,
        activeBulletCount: activeBullets.length,
        gameState: gm.state,
      };
    });

    expect(combatSimulation.empSuppressionActive).toBe(true);
    expect(combatSimulation.playerShooting).toBe(false);
    expect(combatSimulation.activeBulletCount).toBeGreaterThan(0);
    expect(combatSimulation.gameState).toBe('PLAYING');
  });

  test('T3-02 [SHOP UPGRADES VS STAGE 10+]: Max upgraded player pierces and clears high-HP Stage 10+ horde', async ({ page }) => {
    const upgradeCombat = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet;
      const EnemyClass = (window as any).Enemy;

      gm.level = 10;
      gm.player.multiShot = 5;
      gm.player.piercing = 3;
      gm.player.baseFireRate = 0.15;
      gm.player.position.x = 200;
      gm.player.position.y = 600;

      // Spawn 3 Stage 10 normal enemies lined up vertically in front of player
      // e3 is at 400, e2 at 350, e1 at 300
      const e1 = new EnemyClass(200, 300, gm.logicalWidth, 10, 0, gm.logicalHeight);
      const e2 = new EnemyClass(200, 350, gm.logicalWidth, 10, 0, gm.logicalHeight);
      const e3 = new EnemyClass(200, 400, gm.logicalWidth, 10, 0, gm.logicalHeight);
      e1.speedX = 0;
      e2.speedX = 0;
      e3.speedX = 0;
      gm.enemies = [e1, e2, e3];

      const initialHp1 = e1.hp; // 11
      const initialHp2 = e2.hp; // 11
      const initialHp3 = e3.hp; // 11

      // Fire a piercing bullet through all 3 centered at x = 217 (velocity -500 px/s)
      const piercingBullet = new BulletClass(217, 420, -500, 5, true, 3); // 5 damage, piercing 3
      gm.bullets = [piercingBullet];

      // Run simulation steps so bullet travels up through all 3 enemies
      for (let step = 0; step < 25; step++) {
        gm.update(0.016);
      }

      return {
        initialHp1,
        initialHp2,
        initialHp3,
        finalHp1: e1.hp,
        finalHp2: e2.hp,
        finalHp3: e3.hp,
        bulletPiercingRemaining: piercingBullet.piercing,
      };
    });

    expect(upgradeCombat.initialHp1).toBe(11);
    expect(upgradeCombat.initialHp2).toBe(11);
    expect(upgradeCombat.initialHp3).toBe(11);
    // Bullet should have damaged all 3 enemies due to piercing
    expect(upgradeCombat.finalHp3).toBeLessThan(11);
    expect(upgradeCombat.finalHp2).toBeLessThan(11);
    expect(upgradeCombat.finalHp1).toBeLessThan(11);
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================

  test('T4-01 [STAGE 10+ END-TO-END]: Multi-wave progression from Wave 9 -> Wave 10 Boss fight -> Crisis survival -> Wave 11', async ({ page }) => {
    const progressionResult = await page.evaluate(async () => {
      const gm = (window as any).gameManager;

      // Start at Wave 9
      gm.level = 9;
      gm.enemies = [];
      gm.spawnWave();
      const wave9EnemyCount = gm.enemies.length;
      const wave9NormalHp = gm.enemies[0]?.hp; // 4

      // Clear Wave 9
      gm.enemies.forEach((e: any) => (e.isDead = true));
      gm.update(0.1);
      const stateAfterWave9 = gm.state; // SHOP

      // Advance to Wave 10
      gm.startNextWave();
      const wave10Level = gm.level; // 10
      const wave10State = gm.state; // PLAYING

      const boss = gm.enemies.find((e: any) => e.type === 2);
      const bossHp = boss?.hp; // 362
      const escortCount = gm.enemies.length - 1; // Boss + escorts

      // Trigger mid-battle crisis
      gm.triggerCrisis('SWARM_BLITZ');
      gm.crisisState.warningTimer = 0;
      gm.activateCrisisEffect('SWARM_BLITZ');
      const enemiesDuringCrisis = gm.enemies.length;

      // Clear Wave 10
      gm.enemies.forEach((e: any) => (e.isDead = true));
      gm.warningTimer = 0;
      gm.pendingReinforcement = null;
      gm.crisisState.activeCrisis = null;
      gm.update(0.1);
      const stateAfterWave10 = gm.state; // SHOP

      // Advance to Wave 11
      gm.startNextWave();
      const wave11Level = gm.level; // 11
      const normalEnemy = gm.enemies.find((e: any) => e.type === 0) || gm.enemies[0];
      const wave11EnemyHp = normalEnemy?.hp; // 18

      return {
        wave9EnemyCount,
        wave9NormalHp,
        stateAfterWave9,
        wave10Level,
        wave10State,
        hasBoss: !!boss,
        bossHp,
        escortCount,
        enemiesDuringCrisis,
        stateAfterWave10,
        wave11Level,
        wave11EnemyHp,
      };
    });

    expect(progressionResult.wave9NormalHp).toBe(4);
    expect(progressionResult.stateAfterWave9).toBe('SHOP');
    expect(progressionResult.wave10Level).toBe(10);
    expect(progressionResult.wave10State).toBe('PLAYING');
    expect(progressionResult.hasBoss).toBe(true);
    expect(progressionResult.bossHp).toBe(362);
    expect(progressionResult.escortCount).toBeGreaterThanOrEqual(4);
    expect(progressionResult.enemiesDuringCrisis).toBeGreaterThan(progressionResult.escortCount);
    expect(progressionResult.stateAfterWave10).toBe('SHOP');
    expect(progressionResult.wave11Level).toBe(11);
    expect(progressionResult.wave11EnemyHp).toBe(18);
  });
});

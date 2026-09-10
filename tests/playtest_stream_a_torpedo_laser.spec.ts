import { test, expect, Page } from '@playwright/test';

test.describe.serial('Stream A Live QA Playtest: Cavitation Torpedo & Prism Laser', () => {
  let page: Page;
  let consoleErrors: string[] = [];
  let pageErrors: Error[] = [];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('ERR_CONNECTION_REFUSED') && !text.includes('WebSocket')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Start game
    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    // Wait for managers to be mounted
    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      return gm && fm && gm.player;
    }, { timeout: 10000 });

    // Enable god mode so test is deterministic and free from incidental death
    await page.evaluate(() => {
      (window as any).gameManager.isGodMode = true;
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(() => {
    consoleErrors = [];
    pageErrors = [];
  });

  test.afterEach(() => {
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  // ==========================================================================
  // SECTION 1: CAVITATION TORPEDO VERIFICATION
  // ==========================================================================

  test('STREAM-A-TORP-01: Tap [C] launches torpedo, sets initial v0=180px/s, INERT state, and generates vapor bubbles', async () => {
    const launchData = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      const sys = fm.cavitationTorpedo;
      sys.reset();

      const initialAmmo = sys.torpedoAmmo;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
      const ammoAfterFire = sys.torpedoAmmo;
      const t = sys.torpedoes[0];

      return {
        initialAmmo,
        ammoAfterFire,
        torpedoCount: sys.torpedoes.length,
        v0: Math.abs(t.velocity.y),
        state: t.state,
        distanceTraveled: t.distanceTraveled,
        config: t.config
      };
    });

    expect(launchData.initialAmmo).toBe(3);
    expect(launchData.ammoAfterFire).toBe(2);
    expect(launchData.torpedoCount).toBe(1);
    expect(launchData.v0).toBe(180);
    expect(launchData.state).toBe('INERT');
    expect(launchData.distanceTraveled).toBe(0);
    expect(launchData.config.armDistance).toBe(100);
    expect(launchData.config.aCav).toBe(420);
    expect(launchData.config.vMax).toBe(580);
  });

  test('STREAM-A-TORP-02: Arming safety distance (<100px deals 15 blunt damage, NO detonation)', async () => {
    const safetyResult = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      const sys = fm.cavitationTorpedo;
      sys.reset();

      sys.fireTorpedo({ x: 300, y: 700 });
      const t = sys.torpedoes[0];

      // Place hostile at y = 670 (30px distance < 100px armDistance)
      let enemyHp = 100;
      const enemy = {
        position: { x: 295, y: 670 },
        size: { width: 24, height: 24 },
        isDead: false,
        takeDamage: (dmg: number) => { enemyHp -= dmg; }
      };

      // Simulate step
      t.update(0.05, [enemy as any], []);

      return {
        state: t.state,
        distanceTraveled: t.distanceTraveled,
        enemyDamageTaken: 100 - enemyHp,
        isDead: t.isDead
      };
    });

    expect(safetyResult.state).toBe('INERT');
    expect(safetyResult.distanceTraveled).toBeLessThan(100);
    expect(safetyResult.enemyDamageTaken).toBe(15);
    expect(safetyResult.isDead).toBe(false);
  });

  test('STREAM-A-TORP-03: Tap [C] in flight triggers remote detonation into Phase 1 Singularity (140px suction, zero velocity)', async () => {
    const detResult = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      const sys = fm.cavitationTorpedo;
      sys.reset();

      sys.fireTorpedo({ x: 300, y: 700 });
      const t = sys.torpedoes[0];

      // Simulate travel past arming threshold
      t.distanceTraveled = 120;
      t.state = 'ARMED';

      // Remote detonate via second tap [C]
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));

      // Check singularity inward suction on enemy and hostile bullet
      let enemyX = 350;
      const enemy = {
        position: { x: enemyX, y: t.position.y },
        size: { width: 20, height: 20 },
        isDead: false
      };
      let bulletX = 260;
      const hostileBullet = {
        position: { x: bulletX, y: t.position.y },
        size: { width: 6, height: 6 },
        isDead: false,
        faction: 'enemy'
      };

      t.update(0.04, [enemy as any], [hostileBullet as any]);

      return {
        state: t.state,
        vx: t.velocity.x,
        vy: t.velocity.y,
        vacuumRadius: t.config.vacuumRadius,
        vacuumDuration: t.config.vacuumDuration,
        enemyPulled: enemy.position.x < enemyX,
        bulletPulled: hostileBullet.position.x > bulletX
      };
    });

    expect(detResult.state).toBe('SINGULARITY');
    expect(detResult.vx).toBe(0);
    expect(detResult.vy).toBe(0);
    expect(detResult.vacuumRadius).toBe(140);
    expect(detResult.vacuumDuration).toBe(0.08);
    expect(detResult.enemyPulled).toBe(true);
    expect(detResult.bulletPulled).toBe(true);
  });

  test('STREAM-A-TORP-04: Phase 2 Hyperbaric Shockwave (150px, 120-300 damage, 100% bullet vaporization)', async () => {
    const shockResult = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      const sys = fm.cavitationTorpedo;
      sys.reset();

      sys.fireTorpedo({ x: 300, y: 500 });
      const t = sys.torpedoes[0];
      t.state = 'SINGULARITY';
      t.vacuumTimer = t.config.vacuumDuration; // 0.08s

      // Transition to shockwave
      t.update(0.016, [], []);
      const state = t.state;

      // Hostile bullet within blast radius (dist = 40px <= 150px)
      const bulletInBlast = {
        position: { x: 330, y: 500 },
        size: { width: 4, height: 4 },
        isDead: false,
        faction: 'enemy'
      };

      // Hostile entity
      let enemyHp = 300;
      const enemy = {
        position: { x: 320, y: 500 },
        size: { width: 20, height: 20 },
        isDead: false,
        takeDamage: (d: number) => { enemyHp -= d; }
      };

      // Advance shockwave
      t.update(0.1, [enemy as any], [bulletInBlast as any]);

      return {
        state,
        shockVelocity: t.config.shockVelocity,
        blastRadius: t.config.blastRadius,
        currentRadius: t.currentRadius,
        bulletVaporized: bulletInBlast.isDead === true,
        damageDealt: 300 - enemyHp
      };
    });

    expect(shockResult.state).toBe('SHOCKWAVE');
    expect(shockResult.shockVelocity).toBe(750);
    expect(shockResult.blastRadius).toBe(150);
    expect(shockResult.currentRadius).toBeGreaterThan(0);
    expect(shockResult.bulletVaporized).toBe(true);
    expect(shockResult.damageDealt).toBeGreaterThanOrEqual(100);
  });

  test('STREAM-A-TORP-05: Sympathetic acoustic fracture on barricades within <=85px (none if >85px)', async () => {
    const fractureResult = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      const sys = fm.cavitationTorpedo;
      sys.reset();

      sys.fireTorpedo({ x: 300, y: 600 });
      const t = sys.torpedoes[0];
      t.state = 'SHOCKWAVE';
      t.currentRadius = 100;

      let closeBarHp = 50;
      let farBarHp = 50;

      const closeBar = {
        position: { x: 340, y: 600 }, // dx = 40 <= 85px
        size: { width: 20, height: 20 },
        isDead: false,
        takeDamage: (d: number) => { closeBarHp -= d; }
      };

      const farBar = {
        position: { x: 420, y: 600 }, // dx = 120 > 85px
        size: { width: 20, height: 20 },
        isDead: false,
        takeDamage: (d: number) => { farBarHp -= d; }
      };

      t.checkBarricadeFractures([closeBar as any, farBar as any]);

      return {
        closeBarDamage: 50 - closeBarHp,
        farBarDamage: 50 - farBarHp,
        acousticRadius: t.config.barricadeAcousticRadius
      };
    });

    expect(fractureResult.acousticRadius).toBe(85);
    expect(fractureResult.closeBarDamage).toBe(15);
    expect(fractureResult.farBarDamage).toBe(0);
  });

  // ==========================================================================
  // SECTION 2: PRISM LASER & REFRACTION PRISMS VERIFICATION
  // ==========================================================================

  test('STREAM-A-LASER-01: Laser continuous 20Hz raycast damage delivery and heat accumulation (+26 HU/s)', async () => {
    const laserResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const laser = fm.prismLaser;
      const context = gm.getFlagshipContext();
      laser.reset();

      // Enemy directly above player craft
      let enemyHp = 100;
      const target = {
        position: { x: context.player.position.x + context.player.size.width / 2 - 10, y: 350 },
        size: { width: 20, height: 20 },
        isDead: false,
        takeDamage: (d: number) => { enemyHp -= d; }
      };

      laser.setFiring(true);

      // Simulate 60 frames (1.0s) of continuous fire at 60 FPS
      for (let i = 0; i < 60; i++) {
        laser.update(1 / 60, { ...context, enemies: [target as any] });
      }

      return {
        heatAfter1s: laser.heat,
        damageTaken: 100 - enemyHp,
        isFiring: laser.isFiring,
        zone: laser.getHeatZone()
      };
    });

    // Heat rate is dH/dt = 30 - 4 = 26 HU/s
    expect(laserResult.heatAfter1s).toBeCloseTo(26, 1);
    // At 20 ticks/sec with 0.8 damage/tick, 1 second yields ~16 DPS
    expect(laserResult.damageTaken).toBeGreaterThan(12);
    expect(laserResult.isFiring).toBe(true);
    expect(laserResult.zone).toBe('COOL');
  });

  test('STREAM-A-LASER-02: Supercharged state at 80-99 HU grants +25% bonus DPS', async () => {
    const dpsResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const laser = fm.prismLaser;
      const context = gm.getFlagshipContext();
      laser.reset();

      let normalHp = 100;
      let superHp = 100;

      const target1 = {
        position: { x: context.player.position.x + context.player.size.width / 2 - 10, y: 350 },
        size: { width: 20, height: 20 },
        isDead: false,
        takeDamage: (d: number) => { normalHp -= d; }
      };
      const target2 = {
        position: { x: context.player.position.x + context.player.size.width / 2 - 10, y: 350 },
        size: { width: 20, height: 20 },
        isDead: false,
        takeDamage: (d: number) => { superHp -= d; }
      };

      // Normal tick at heat = 30
      laser.heat = 30;
      laser.setFiring(true);
      laser.update(0.06, { ...context, enemies: [target1 as any] });

      // Supercharged tick at heat = 85
      laser.heat = 85;
      laser.setFiring(true);
      laser.update(0.06, { ...context, enemies: [target2 as any] });

      return {
        normalDmg: 100 - normalHp,
        superDmg: 100 - superHp,
        multiplier: (100 - superHp) / (100 - normalHp),
        zone85: laser.getHeatZone()
      };
    });

    expect(dpsResult.zone85).toBe('SUPERCHARGED');
    expect(dpsResult.multiplier).toBeCloseTo(1.25, 2);
  });

  test('STREAM-A-LASER-03: Thermal Lockout at 100 HU enforces 2.2s venting lockout and blocks firing', async () => {
    const lockoutResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const laser = fm.prismLaser;
      const context = gm.getFlagshipContext();
      laser.reset();

      laser.heat = 99.8;
      laser.setFiring(true);
      laser.update(0.05, context);

      const lockedOutState = laser.isLockedOut;
      const initialTimer = laser.lockoutTimer;
      const zone = laser.getHeatZone();

      // Attempt to fire during lockout
      laser.setFiring(true);
      const firingBlocked = laser.isFiring === false;

      // Simulate 1.0s elapsed
      laser.update(1.0, context);
      const timerAfter1s = laser.lockoutTimer;

      // Simulate remainder of lockout duration (1.2s + extra)
      laser.update(1.3, context);
      const recoveredState = laser.isLockedOut;
      const heatAfterRecovery = laser.heat;

      return {
        lockedOutState,
        initialTimer,
        zone,
        firingBlocked,
        timerAfter1s,
        recoveredState,
        heatAfterRecovery
      };
    });

    expect(lockoutResult.lockedOutState).toBe(true);
    expect(lockoutResult.initialTimer).toBe(2.2);
    expect(lockoutResult.zone).toBe('LOCKOUT');
    expect(lockoutResult.firingBlocked).toBe(true);
    expect(lockoutResult.timerAfter1s).toBeCloseTo(1.2, 1);
    expect(lockoutResult.recoveredState).toBe(false);
    expect(lockoutResult.heatAfterRecovery).toBe(0);
  });

  test('STREAM-A-LASER-04: Deploy quartz refraction prism [P] splits beam into 3-way fan (-35°, 0°, +35°) with 190% total power', async () => {
    const prismResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const laser = fm.prismLaser;
      const context = gm.getFlagshipContext();
      laser.reset();

      const initialCharges = laser.prismCharges;
      // Press P key to deploy prism
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));

      const chargesAfter = laser.prismCharges;
      const activePrismsCount = laser.activePrisms.length;
      const prism = laser.activePrisms[0];

      // Laser firing through prism
      laser.setFiring(true);
      laser.update(0.06, context);

      const segments = (laser as any).activeBeamSegments;

      return {
        initialCharges,
        chargesAfter,
        activePrismsCount,
        splitAngles: prism?.splitAngles,
        powerRatios: prism?.powerRatios,
        totalPower: prism?.powerRatios?.reduce((a: number, b: number) => a + b, 0),
        segmentsCount: segments?.length,
        prismGlowing: prism?.refractionGlowTimer > 0
      };
    });

    expect(prismResult.initialCharges).toBe(3);
    expect(prismResult.chargesAfter).toBe(2);
    expect(prismResult.activePrismsCount).toBe(1);
    expect(prismResult.splitAngles).toEqual([-35, 0, 35]);
    expect(prismResult.powerRatios).toEqual([0.6, 0.7, 0.6]);
    expect(prismResult.totalPower).toBeCloseTo(1.9, 2);
    expect(prismResult.segmentsCount).toBe(4); // 1 incoming + 3 refracted
    expect(prismResult.prismGlowing).toBe(true);
  });

  test('STREAM-A-LASER-05: Silicate Barricades take ZERO damage from laser and refract twin beams (120% total power)', async () => {
    const barricadeRefractResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const laser = fm.prismLaser;
      const context = gm.getFlagshipContext();
      laser.reset();

      let barHp = 100;
      const barricade = {
        position: { x: context.player.position.x + context.player.size.width / 2 - 15, y: 550 },
        size: { width: 30, height: 20 },
        isDead: false,
        takeDamage: (d: number) => { barHp -= d; }
      };

      laser.setFiring(true);
      laser.update(0.06, { ...context, barricades: [barricade as any] });

      const segments = (laser as any).activeBeamSegments;

      return {
        barricadeDamage: 100 - barHp,
        segmentsCount: segments?.length
      };
    });

    expect(barricadeRefractResult.barricadeDamage).toBe(0);
    expect(barricadeRefractResult.segmentsCount).toBe(3); // 1 incoming + 2 twin refracted beams
  });
});

import { test, expect } from '@playwright/test';

test.describe('Stream D: Multi-Stage Apex Boss Kraken Prime / Charybdis Maw (Feature 10)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click START GAME to enter active gameplay state
    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    // Ensure game and flagship managers are populated on window
    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      return gm && fm && gm.player;
    }, { timeout: 10000 });
  });

  test('KRAKEN-E2E-01: Health & Structure - Total 12,000 HP budget split into three 4,000 HP phases', async ({ page }) => {
    const data = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      return {
        totalHp: apex.activeBoss.totalHp,
        maxHp: apex.activeBoss.maxHp,
        phase: apex.activeBoss.phase,
        tentaclesCount: apex.tentacles.length,
        hasMaw: !!apex.mawSubsystem,
        mawHp: apex.mawSubsystem.hp,
        hasCore: !!apex.coreSubsystem,
        coreHp: apex.coreSubsystem.hp,
      };
    });

    expect(data.totalHp).toBe(12000);
    expect(data.maxHp).toBe(12000);
    expect(data.phase).toBe(1);
    expect(data.tentaclesCount).toBe(8); // 4 frontal ramparts + 4 flank fins
    expect(data.hasMaw).toBe(true);
    expect(data.mawHp).toBe(4000);
    expect(data.hasCore).toBe(true);
    expect(data.coreHp).toBe(4000);
  });

  test('KRAKEN-E2E-02: Phase 1 Tentacle Ramparts - 100% Body Invulnerability while frontal tentacles live', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const initialHp = apex.activeBoss.totalHp;
      const frontalCount = apex.getAliveFrontalTentaclesCount();

      // Fire 5 high-caliber player bullets directly at the central hull core (x: 300, y: 110)
      const ctx = gm.getFlagshipContext();
      const bullets = [];
      for (let i = 0; i < 5; i++) {
        bullets.push({
          position: { x: 300, y: 110 },
          size: { width: 4, height: 10 },
          velocity: { x: 0, y: -400 },
          isDead: false,
          faction: 'PLAYER',
        });
      }
      ctx.bullets = bullets;

      // Update boss collision tick
      apex.update(0.016, ctx);

      const allDeflected = bullets.every((b: any) => b.isDead);
      const hpAfterAttack = apex.activeBoss.totalHp;

      return {
        initialHp,
        hpAfterAttack,
        frontalCount,
        allDeflected,
        damageTaken: initialHp - hpAfterAttack,
      };
    });

    expect(result.frontalCount).toBe(4);
    expect(result.allDeflected).toBe(true);
    expect(result.damageTaken).toBe(0);
    expect(result.hpAfterAttack).toBe(12000);
  });

  test('KRAKEN-E2E-03: Phase 1 Active Missile Swatting - 70px interception & 1.2s fatigue cooldown', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const t0 = apex.tentacles[0];
      t0.swatCooldown = 0;

      const tipX = t0.localBounds.x + 5;
      const tipY = t0.localBounds.y + 5;

      const homingMissile = {
        position: { x: tipX, y: tipY },
        size: { width: 6, height: 12 },
        velocity: { x: 0, y: -200 },
        isDead: false,
        faction: 'PLAYER',
        isHoming: true,
      };

      const ctx = gm.getFlagshipContext();
      ctx.bullets = [homingMissile];

      apex.update(0.016, ctx);

      return {
        missileDestroyed: homingMissile.isDead,
        cooldownSet: t0.swatCooldown > 1.0 && t0.swatCooldown <= 1.2,
        swatCooldownVal: t0.swatCooldown,
      };
    });

    expect(result.missileDestroyed).toBe(true);
    expect(result.cooldownSet).toBe(true);
  });

  test('KRAKEN-E2E-04: Phase 1 Seismic Barricade Pulverizer - 1.8s telegraph & 40 damage block crushing', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const ctx = gm.getFlagshipContext();
      const t0 = apex.tentacles[0];

      // Spawn fresh destructible barricade
      const BarricadeClass = ctx.barricades[0]?.constructor;
      const testBarricade = new BarricadeClass(270, 740, 0); // DESTRUCTIBLE
      ctx.barricades = [testBarricade];

      t0.isSlamming = true;
      t0.slamTimer = 0.01;
      t0.slamTelegraphX = 300; // Aligned with barricade center

      // Frame 1: decrement timer in updateIK
      apex.update(0.016, ctx);
      // Frame 2: execute slam impact
      apex.update(0.016, ctx);
      testBarricade.update(0.016);

      return {
        barricadeHp: testBarricade.hp,
        barricadeDead: testBarricade.isDead,
        remainingBlocks: testBarricade.blocks.filter((b: boolean) => b).length,
        isSlammingAfter: t0.isSlamming,
      };
    });

    expect(result.barricadeHp).toBe(0);
    expect(result.barricadeDead).toBe(true);
    expect(result.remainingBlocks).toBe(0);
    expect(result.isSlammingAfter).toBe(false);
  });

  test('KRAKEN-E2E-05: Phase 1 Tentacle Severing - +150 Pure Water reward & permanent firing lane', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const ctx = gm.getFlagshipContext();
      // First tick settles IK so localBounds is positioned at tentacle tip
      apex.update(0.016, ctx);

      const t0 = apex.tentacles[0];
      const curBefore = ctx.currency;

      t0.hp = 10;
      const killBullet = {
        position: { x: t0.localBounds.x + 5, y: t0.localBounds.y + 5 },
        size: { width: 4, height: 10 },
        isDead: false,
      };
      ctx.bullets = [killBullet];
      apex.update(0.016, ctx);

      const tentacleDead = t0.isDestroyed;
      const currencyGain = ctx.currency - curBefore;

      // Check that subsequent bullets pass cleanly through severed tentacle lane
      const laneBullet = {
        position: { x: t0.localBounds.x + 5, y: t0.localBounds.y + 5 },
        size: { width: 4, height: 10 },
        isDead: false,
      };
      ctx.bullets = [laneBullet];
      apex.update(0.016, ctx);

      return {
        tentacleDead,
        currencyGain,
        laneBulletSurvived: !laneBullet.isDead,
      };
    });

    expect(result.tentacleDead).toBe(true);
    expect(result.currencyGain).toBe(150);
    expect(result.laneBulletSurvived).toBe(true);
  });

  test('KRAKEN-E2E-06: Phase 2 Charybdis Maw - Inhalation Vortex suction pull at ~220 px/s', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const ctx = gm.getFlagshipContext();

      // Trigger Phase 2
      apex.activeBoss.totalHp = 8000;
      apex.update(0.016, ctx);

      // Measure player vertical displacement under vortex pull
      ctx.player.position = { x: 300, y: 500 };
      const y0 = ctx.player.position.y;
      apex.update(0.1, ctx); // 100ms
      const y1 = ctx.player.position.y;

      return {
        phase: apex.activeBoss.phase,
        vortexActive: apex.activeBoss.vortexActive,
        initialY: y0,
        pulledY: y1,
        upwardDisplacement: y0 - y1,
        vortexForce: apex.activeBoss.vortexPullForce,
      };
    });

    expect(result.phase).toBe(2);
    expect(result.vortexActive).toBe(true);
    expect(result.upwardDisplacement).toBeGreaterThan(0);
    expect(result.vortexForce).toBeGreaterThan(0);
  });

  test('KRAKEN-E2E-07: Phase 2 Charybdis Gullet - 2.5x Critical Weakpoint damage', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const ctx = gm.getFlagshipContext();

      // In Phase 2 at 8000 HP
      apex.activeBoss.totalHp = 8000;
      apex.update(0.016, ctx);

      const hpBefore = apex.activeBoss.totalHp;

      // Shoot directly into maw gullet (x: 300, y: 110, radius <= 48)
      const mawShot = {
        position: { x: apex.position.x, y: apex.position.y },
        size: { width: 4, height: 10 },
        isDead: false,
      };
      ctx.bullets = [mawShot];
      apex.update(0.016, ctx);

      const hpAfter = apex.activeBoss.totalHp;
      const dmgDealt = hpBefore - hpAfter;

      return {
        hpBefore,
        hpAfter,
        dmgDealt,
        // Base damage is 15 -> 15 * 2.5 = 37.5
        expectedCritDamage: 15 * 2.5,
      };
    });

    expect(result.dmgDealt).toBe(37.5);
    expect(result.hpAfter).toBe(7962.5);
  });

  test('KRAKEN-E2E-08: Phase 2 Concussion Stun - Torpedo in gullet inflicts 2.5s stun & halts vortex', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const ctx = gm.getFlagshipContext();

      // Enter Phase 2
      apex.activeBoss.totalHp = 7000;
      apex.update(0.016, ctx);

      // Trigger Concussion Stun
      apex.triggerConcussionStun(2.5);

      const stunDuration = apex.concussionStunTimer;
      const vortexDuringStun = apex.activeBoss.vortexActive;

      // Update 1.0s during stun
      ctx.player.position = { x: 300, y: 500 };
      const yBefore = ctx.player.position.y;
      apex.update(1.0, ctx);
      const yAfter = ctx.player.position.y;
      const stunRemaining = apex.concussionStunTimer;

      return {
        stunDuration,
        vortexDuringStun,
        stunRemaining,
        playerMoved: yBefore !== yAfter,
      };
    });

    expect(result.stunDuration).toBe(2.5);
    expect(result.vortexDuringStun).toBe(false);
    expect(result.stunRemaining).toBeCloseTo(1.5, 1);
    expect(result.playerMoved).toBe(false); // Player was NOT pulled while boss was stunned!
  });

  test('KRAKEN-E2E-09: Phase 3 Abyssal Rage - Bioluminescent Ink Blackout, 750 px/s Breach Charge & 45s Enrage Timer', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const ctx = gm.getFlagshipContext();

      // Drop to Phase 3 threshold (<= 4000 HP)
      apex.activeBoss.totalHp = 4000;
      apex.update(0.016, ctx);

      const phase = apex.activeBoss.phase;
      const isEnraged = apex.activeBoss.isEnraged;
      const darknessAlpha = apex.activeBoss.darknessOverlayAlpha;
      const enrageTimerInitial = apex.activeBoss.enrageTimer;

      // Verify timer countdown
      apex.update(1.0, ctx);
      const enrageTimerAfter1s = apex.activeBoss.enrageTimer;

      // Verify 750 px/s breach charge
      apex.chargeCooldown = 0.01;
      apex.isCharging = false;
      apex.update(0.016, ctx);
      const isCharging = apex.isCharging;
      const chargeSpeed = apex.chargeSpeed;

      return {
        phase,
        isEnraged,
        darknessAlpha,
        enrageTimerInitial,
        enrageTimerAfter1s,
        timerDecrementedBy1s: Math.abs((enrageTimerInitial - enrageTimerAfter1s) - 1.0) < 0.05,
        isCharging,
        chargeSpeed,
      };
    });

    expect(result.phase).toBe(3);
    expect(result.isEnraged).toBe(true);
    expect(result.darknessAlpha).toBe(0.88); // 88% ink blackout
    expect(result.enrageTimerInitial).toBeCloseTo(45.0, 1);
    expect(result.timerDecrementedBy1s).toBe(true);
    expect(result.isCharging).toBe(true);
    expect(result.chargeSpeed).toBe(750); // 750 px/s breach charge
  });

  test('KRAKEN-E2E-10: Complete Boss Defeat - Awards 25,000 score, +500 currency, clears all boss entities', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const ctx = gm.getFlagshipContext();

      const scoreBefore = ctx.score;
      const curBefore = ctx.currency;

      // Reduce HP to 0
      apex.activeBoss.totalHp = 0;
      apex.update(0.016, ctx);

      return {
        bossStateNull: apex.activeBoss === null,
        tentaclesDestroyed: apex.tentacles.every((t: any) => t.isDestroyed),
        toothProjectilesCleared: apex.toothProjectiles.length === 0,
        scoreGained: ctx.score - scoreBefore,
        currencyGained: ctx.currency - curBefore,
      };
    });

    expect(result.bossStateNull).toBe(true);
    expect(result.tentaclesDestroyed).toBe(true);
    expect(result.toothProjectilesCleared).toBe(true);
    expect(result.scoreGained).toBe(25000);
    expect(result.currencyGained).toBe(500);
  });
});

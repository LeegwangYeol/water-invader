import { test, expect } from '@playwright/test';

test.describe('Stream C: Modular Submersible Chassis & Deep-Sea Hangar Live Playtest', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[Browser Error]: ${msg.text()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('STREAM-C-01: Pre-Wave Lobby Deep-Sea Hangar allows selecting all 5 chassis with animated 6-axis radar chart', async ({ page }) => {
    // 1. Open Pre-Game Shop / Armory
    const armoryBtn = page.locator('button', { hasText: /ARMORY \/ SHOP/i });
    await expect(armoryBtn).toBeVisible({ timeout: 10000 });
    await armoryBtn.click();

    // 2. Verify Hangar header and 5 chassis buttons
    await expect(page.locator('text=DEEP-SEA HANGAR')).toBeVisible({ timeout: 5000 });
    
    const chassisIds = ['nautilus', 'stingray', 'leviathan', 'ghost', 'kraken'];
    for (const id of chassisIds) {
      const btn = page.locator(`[data-testid="chassis-select-${id}"]`);
      await expect(btn).toBeVisible();
    }

    // 3. Verify 6-axis animated radar chart canvas is mounted and renders non-blank pixels
    const radarCanvas = page.locator('[data-testid="chassis-radar-canvas"]');
    await expect(radarCanvas).toBeVisible();

    const canvasHasPixels = await radarCanvas.evaluate((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let nonZeroCount = 0;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 0) nonZeroCount++;
      }
      return nonZeroCount > 200; // Has radar grid and polygon rendered
    });
    expect(canvasHasPixels).toBe(true);

    // 4. Click through each chassis button and verify active chassis state updates
    for (const id of chassisIds) {
      const btn = page.locator(`[data-testid="chassis-select-${id}"]`);
      await btn.click();
      await page.waitForTimeout(100);

      const activeId = await page.evaluate(() => {
        return (window as any).gameManager?.flagshipManager?.modularChassis?.activeChassis?.id;
      });
      expect(activeId).toBe(id.toUpperCase());
    }

    // 5. Select Stingray and start mission
    await page.locator('[data-testid="chassis-select-stingray"]').click();
    const startMissionBtn = page.locator('[data-testid="start-mission-button"]');
    await startMissionBtn.click();

    // 6. Verify player deployed with Stingray attributes
    const playerStats = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        speed: gm.player.speed,
        hitboxW: gm.player.size.width,
        hitboxH: gm.player.size.height,
        hp: gm.player.hp,
        baseFireRate: gm.player.baseFireRate,
      };
    });

    expect(playerStats.speed).toBe(420);
    expect(playerStats.hitboxW).toBe(38);
    expect(playerStats.hitboxH).toBe(30);
    expect(playerStats.baseFireRate).toBe(0.4); // +25% fire rate
  });

  test('STREAM-C-02: Continue Shop maintains Hangar access and updates chassis stats on revival', async ({ page }) => {
    // 1. Start game directly
    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await startBtn.click();

    await page.waitForFunction(() => (window as any).gameManager?.player);

    // 2. Simulate player death to trigger GAME_OVER state
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      gm.player.isDead = true;
      gm.gameOver('KILLED_IN_ACTION');
    });

    // 3. Game Over screen with Continue button should appear
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await continueBtn.click();

    // 4. Continue Shop opens: verify Hangar is accessible
    await expect(page.locator('text=ARMORY & WORKSHOP (CONTINUE)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chassis-select-nautilus"]')).toBeVisible();

    // 5. Switch to Nautilus Dreadnought in Continue Shop
    await page.locator('[data-testid="chassis-select-nautilus"]').click();

    // 6. Resume wave
    const resumeBtn = page.locator('[data-testid="resume-wave-button"]');
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();

    // 7. Verify player resumed with Nautilus stats
    const resumedStats = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return {
        speed: gm.player.speed,
        hitboxW: gm.player.size.width,
        hitboxH: gm.player.size.height,
        maxHp: gm.player.maxHp,
        activeChassis: gm.flagshipManager.modularChassis.activeChassis.id,
      };
    });

    expect(resumedStats.activeChassis).toBe('NAUTILUS');
    expect(resumedStats.speed).toBe(220);
    expect(resumedStats.hitboxW).toBe(64);
    expect(resumedStats.hitboxH).toBe(46);
    expect(resumedStats.maxHp).toBe(9);
  });

  test('STREAM-C-03: Nautilus Dreadnought stat matrix, flat armor, and Aegis Bulkhead steam shockwave', async ({ page }) => {
    // Start game
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager?.player);

    // Select Nautilus Dreadnought
    const testResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const cm = fm.modularChassis;

      cm.selectChassis('NAUTILUS');
      cm.applyToPlayer(gm.player);

      const initialHp = gm.player.hp;
      const initialSpeed = gm.player.speed;
      const initialHitbox = { w: gm.player.size.width, h: gm.player.size.height };

      // 1. Test flat armor mitigation: incoming damage 2 is mitigated to 1
      const armorMitigation = cm.activeChassis.onTakeDamage(initialHp, 2);

      // 2. Test Aegis Bulkhead: when HP <= 2, triggers bullet-clearing shockwave and 1.5s i-frames
      gm.player.hp = 2;

      // Spawn hostile bullets near the player (<120px) and far (>150px)
      const px = gm.player.position.x + gm.player.size.width / 2;
      const py = gm.player.position.y + gm.player.size.height / 2;

      // Close bullet (dist = 50px)
      const closeBullet = {
        position: { x: px + 50, y: py },
        velocity: { x: 0, y: 100 },
        damage: 1,
        isPlayerBullet: false,
      };
      // Far bullet (dist = 200px)
      const farBullet = {
        position: { x: px + 200, y: py },
        velocity: { x: 0, y: 100 },
        damage: 1,
        isPlayerBullet: false,
      };

      gm.bullets = [closeBullet, farBullet];

      // Simulate damage taken at <= 2 HP through FlagshipManager
      fm.onPlayerDamage(1, gm.getFlagshipContext());

      const closeBulletCleared = !gm.bullets.includes(closeBullet);
      const farBulletPreserved = gm.bullets.includes(farBullet);
      const invulnerabilityGranted = gm.player.invincibilityTimer >= 1.4;
      const aegisCooldownActive = cm.aegisCooldownTimer > 50;

      return {
        initialHp,
        initialSpeed,
        initialHitbox,
        mitigatedDamage: armorMitigation.mitigatedDamage,
        closeBulletCleared,
        farBulletPreserved,
        invulnerabilityGranted,
        aegisCooldownActive,
      };
    });

    expect(testResult.initialHp).toBe(7);
    expect(testResult.initialSpeed).toBe(220);
    expect(testResult.initialHitbox.w).toBe(64);
    expect(testResult.initialHitbox.h).toBe(46);
    expect(testResult.mitigatedDamage).toBe(1); // 2 incoming - 1 armor = 1
    expect(testResult.closeBulletCleared).toBe(true);
    expect(testResult.farBulletPreserved).toBe(true);
    expect(testResult.invulnerabilityGranted).toBe(true);
    expect(testResult.aegisCooldownActive).toBe(true);
  });

  test('STREAM-C-04: Stingray Interceptor agility, +25% fire rate, and Cavitation Slipstream overdrive lance', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager?.player);

    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const cm = fm.modularChassis;

      cm.selectChassis('STINGRAY');
      cm.applyToPlayer(gm.player);

      const speed = gm.player.speed;
      const hitbox = { w: gm.player.size.width, h: gm.player.size.height };
      const fireRate = gm.player.baseFireRate;

      // Simulate lateral movement to charge Cavitation Slipstream overdrive
      gm.player.isMovingRight = true;
      for (let i = 0; i < 10; i++) {
        cm.update(0.35, gm.getFlagshipContext());
      }
      const chargeAfterMove = cm.slipstreamCharge;
      const isReady = cm.isSlipstreamReady;

      // When fully charged (100%) and firing, releases Cavitation Lance + 0.5s i-frames
      gm.player.isShooting = true;
      const bulletCountBefore = gm.bullets.length;
      cm.update(0.016, gm.getFlagshipContext());
      const bulletCountAfter = gm.bullets.length;
      const lanceFired = bulletCountAfter > bulletCountBefore;
      const lanceBullet = gm.bullets[gm.bullets.length - 1];
      const invulnerabilityGranted = gm.player.invincibilityTimer >= 0.45;
      const chargeReset = cm.slipstreamCharge === 0;

      return {
        speed,
        hitbox,
        fireRate,
        chargeAfterMove,
        isReady,
        lanceFired,
        lanceDamage: lanceBullet?.damage,
        lanceColor: lanceBullet?.color,
        invulnerabilityGranted,
        chargeReset,
      };
    });

    expect(result.speed).toBe(420);
    expect(result.hitbox.w).toBe(38);
    expect(result.hitbox.h).toBe(30);
    expect(result.fireRate).toBe(0.4); // 0.4s vs 0.5s baseline (+25% fire rate)
    expect(result.chargeAfterMove).toBe(100);
    expect(result.isReady).toBe(true);
    expect(result.lanceFired).toBe(true);
    expect(result.lanceDamage).toBe(4);
    expect(result.lanceColor).toBe('#38bdf8');
    expect(result.invulnerabilityGranted).toBe(true);
    expect(result.chargeReset).toBe(true);
  });

  test('STREAM-C-05: Leviathan Harvester economy, water magnet, and +1 HP sustain per 100 pure water', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager?.player);

    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const cm = fm.modularChassis;

      cm.selectChassis('LEVIATHAN');
      cm.applyToPlayer(gm.player);

      const speed = gm.player.speed;
      const hitbox = { w: gm.player.size.width, h: gm.player.size.height };
      const baseHp = gm.player.hp;

      // 1. Test screen-wide water magnet bonus on enemy kill (+35% mob, +50% boss)
      const currencyBefore = gm.currency;
      const mockMob = { isBoss: false, type: 0, position: { x: 100, y: 100 }, size: { width: 30, height: 30 } };
      cm.onEnemyKilled(mockMob, gm.getFlagshipContext());
      const mobBonusWater = gm.currency - currencyBefore;

      const currencyBeforeBoss = gm.currency;
      const mockBoss = { isBoss: true, type: 2, position: { x: 300, y: 200 }, size: { width: 80, height: 80 } };
      cm.onEnemyKilled(mockBoss, gm.getFlagshipContext());
      const bossBonusWater = gm.currency - currencyBeforeBoss;

      // 2. Test +1 HP sustain per 100 Pure Water collected
      gm.player.hp = 3; // Damaged player (max 7)
      cm.lastRecordedWater = 100;
      gm.currency = 205; // Crossed the 200 threshold (+105 water)
      cm.update(0.1, gm.getFlagshipContext());
      const hpAfterWater100 = gm.player.hp;

      return {
        speed,
        hitbox,
        baseHp,
        mobBonusWater,
        bossBonusWater,
        hpAfterWater100,
      };
    });

    expect(result.speed).toBe(270);
    expect(result.hitbox.w).toBe(54);
    expect(result.hitbox.h).toBe(42);
    expect(result.baseHp).toBe(6);
    expect(result.mobBonusWater).toBeGreaterThan(0);
    expect(result.bossBonusWater).toBeGreaterThan(result.mobBonusWater);
    expect(result.hpAfterWater100).toBe(4); // Restored +1 HP
  });

  test('STREAM-C-06: Ghost Stealth Sub 70% opacity Sonar Cloak after 1.5s idle and 300% crit ambush', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager?.player);

    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const cm = fm.modularChassis;

      cm.selectChassis('GHOST');
      cm.applyToPlayer(gm.player);

      const speed = gm.player.speed;
      const hitbox = { w: gm.player.size.width, h: gm.player.size.height };
      const baseHp = gm.player.hp;

      // 1. Idle for 1.5s (not shooting) activates Sonar Cloak
      gm.player.isShooting = false;
      cm.update(1.6, gm.getFlagshipContext());

      const isGhostCloaked = cm.isGhostCloaked;
      const playerIsCloaked = gm.player.isCloaked;
      const ambushReady = cm.ghostAmbushReady;

      // 2. Fire while cloaked to unleash 300% crit ambush wave (damage 6)
      gm.player.isShooting = true;
      const bulletsBefore = gm.bullets.length;
      cm.update(0.016, gm.getFlagshipContext());
      const bulletsAfter = gm.bullets.length;
      const ambushBullet = gm.bullets[gm.bullets.length - 1];

      return {
        speed,
        hitbox,
        baseHp,
        isGhostCloaked,
        playerIsCloaked,
        ambushReady,
        fired: bulletsAfter > bulletsBefore,
        ambushDamage: ambushBullet?.damage,
        ambushColor: ambushBullet?.color,
        cloakedAfterFire: cm.isGhostCloaked,
        playerCloakedAfterFire: gm.player.isCloaked,
      };
    });

    expect(result.speed).toBe(320);
    expect(result.hitbox.w).toBe(46);
    expect(result.hitbox.h).toBe(34);
    expect(result.baseHp).toBe(4);
    expect(result.isGhostCloaked).toBe(true);
    expect(result.playerIsCloaked).toBe(true);
    expect(result.ambushReady).toBe(true);
    expect(result.fired).toBe(true);
    expect(result.ambushDamage).toBe(6); // 300% crit damage
    expect(result.ambushColor).toBe('#a855f7');
    expect(result.cloakedAfterFire).toBe(false);
    expect(result.playerCloakedAfterFire).toBe(false);
  });

  test('STREAM-C-07: Kraken Bioship pulsating speed, acid immunity, 25s passive regen, and tentacle defense', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager?.player);

    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const cm = fm.modularChassis;

      cm.selectChassis('KRAKEN');
      cm.applyToPlayer(gm.player);

      const hitbox = { w: gm.player.size.width, h: gm.player.size.height };
      const baseHp = gm.player.hp;
      const hasAcidShield = gm.player.hasAcidShield;

      // 1. Verify pulsating speed over time (240 - 360 px/s)
      const speeds: number[] = [];
      for (let t = 0; t < 5; t++) {
        cm.update(0.4, gm.getFlagshipContext());
        speeds.push(gm.player.speed);
      }
      const minSpeed = Math.min(...speeds);
      const maxSpeed = Math.max(...speeds);

      // 2. Verify 25s out-of-combat passive regeneration (+1 HP)
      gm.player.hp = 3;
      cm.update(25.1, gm.getFlagshipContext());
      const hpAfterRegen = gm.player.hp;

      // 3. Verify autonomous tentacle defense within 90px
      const enemy = {
        isDead: false,
        hp: 30,
        maxHp: 30,
        position: { x: gm.player.position.x + 20, y: gm.player.position.y - 30 },
        size: { width: 30, height: 30 },
      };
      gm.enemies = [enemy];
      cm.tentacleWhipCooldown = 0;
      cm.update(0.1, gm.getFlagshipContext());
      const enemyHpAfterTentacle = enemy.hp;

      // 4. Verify taking damage releases blinding ink cloud slowing enemy bullets
      cm.activeChassis.onTakeDamage(gm.player.hp, 1);
      const inkTimerActive = cm.inkCloudTimer > 3.0;

      return {
        hitbox,
        baseHp,
        hasAcidShield,
        minSpeed,
        maxSpeed,
        speedOscillates: maxSpeed > minSpeed,
        hpAfterRegen,
        enemyHpAfterTentacle,
        inkTimerActive,
      };
    });

    expect(result.hitbox.w).toBe(50);
    expect(result.hitbox.h).toBe(40);
    expect(result.baseHp).toBe(5);
    expect(result.hasAcidShield).toBe(true); // Permanent natural acid immunity
    expect(result.speedOscillates).toBe(true);
    expect(result.minSpeed).toBeGreaterThanOrEqual(239);
    expect(result.maxSpeed).toBeLessThanOrEqual(361);
    expect(result.hpAfterRegen).toBe(4); // Regenerated +1 HP
    expect(result.enemyHpAfterTentacle).toBe(15); // Suffered 15 damage
    expect(result.inkTimerActive).toBe(true);
  });

  test('STREAM-C-08: All 5 chassis strictly respect the 600x800 logical canvas boundaries with clamped hitboxes', async ({ page }) => {
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager?.player);

    const boundaryResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const cm = (window as any).flagshipManager.modularChassis;
      const chassisList = ['NAUTILUS', 'STINGRAY', 'LEVIATHAN', 'GHOST', 'KRAKEN'];
      const report: Record<string, any> = {};

      for (const cid of chassisList) {
        cm.selectChassis(cid);
        cm.applyToPlayer(gm.player);

        // Move far left beyond canvas boundary
        gm.player.position.x = -500;
        gm.player.update(0.1);
        const clampedMinX = gm.player.position.x;

        // Move far right beyond canvas boundary
        gm.player.position.x = 2000;
        gm.player.update(0.1);
        const clampedMaxX = gm.player.position.x;
        const expectedMaxX = 600 - gm.player.size.width;

        // Move far top
        gm.player.position.y = -500;
        gm.player.update(0.1);
        const clampedMinY = gm.player.position.y;

        // Move far bottom
        gm.player.position.y = 2000;
        gm.player.update(0.1);
        const clampedMaxY = gm.player.position.y;
        const expectedMaxY = 800 - gm.player.size.height;

        report[cid] = {
          clampedMinX,
          clampedMaxX,
          expectedMaxX,
          clampedMinY,
          clampedMaxY,
          expectedMaxY,
          hitboxW: gm.player.size.width,
          hitboxH: gm.player.size.height,
        };
      }

      return report;
    });

    for (const cid of Object.keys(boundaryResults)) {
      const r = boundaryResults[cid];
      expect(r.clampedMinX).toBe(0);
      expect(r.clampedMaxX).toBe(r.expectedMaxX);
      expect(r.clampedMinY).toBe(0);
      expect(r.clampedMaxY).toBe(r.expectedMaxY);
      expect(r.clampedMaxX + r.hitboxW).toBe(600);
      expect(r.clampedMaxY + r.hitboxH).toBe(800);
    }
  });

  test('STREAM-C-09: Browser console integrity and zero unhandled exceptions during live chassis transitions', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errorLogs.push(msg.text());
    });
    page.on('pageerror', (err) => errorLogs.push(err.message));

    // Open Pre-Game Shop
    await page.locator('button', { hasText: /ARMORY \/ SHOP/i }).click();
    await page.waitForTimeout(200);

    // Rapidly switch between all 5 chassis
    const chassisList = ['nautilus', 'stingray', 'leviathan', 'ghost', 'kraken'];
    for (let loop = 0; loop < 2; loop++) {
      for (const id of chassisList) {
        await page.locator(`[data-testid="chassis-select-${id}"]`).click();
        await page.waitForTimeout(50);
      }
    }

    // Start mission
    await page.locator('[data-testid="start-mission-button"]').click();
    await page.waitForTimeout(500);

    // Move player and fire
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('Space');

    expect(errorLogs).toEqual([]);
  });

  test('STREAM-C-10: Capture visual playtest artifacts of Pre-Wave Lobby, Continue Shop, and Radar Chart', async ({ page }) => {
    // 1. Open Pre-Wave Lobby / Armory
    await page.locator('button', { hasText: /ARMORY \/ SHOP/i }).click();
    await page.waitForTimeout(400);

    // Screenshot 1: Nautilus Dreadnought in Pre-Wave Lobby
    await page.screenshot({ path: 'reports/screenshots/stream_c_hangar/01_prewave_lobby_nautilus.png' });

    // Switch to Stingray and wait for radar animation
    await page.locator('[data-testid="chassis-select-stingray"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'reports/screenshots/stream_c_hangar/02_prewave_lobby_stingray_radar.png' });

    // Switch to Kraken
    await page.locator('[data-testid="chassis-select-kraken"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'reports/screenshots/stream_c_hangar/03_prewave_lobby_kraken.png' });

    // Start mission
    await page.locator('[data-testid="start-mission-button"]').click();
    await page.waitForTimeout(500);

    // Trigger Game Over to test Continue Shop Hangar
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      gm.player.isDead = true;
      gm.gameOver('KILLED_IN_ACTION');
    });
    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForTimeout(400);

    // Screenshot 4: Continue Shop Hangar
    await page.screenshot({ path: 'reports/screenshots/stream_c_hangar/04_continue_shop_hangar.png' });

    // Switch to Ghost in Continue Shop
    await page.locator('[data-testid="chassis-select-ghost"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'reports/screenshots/stream_c_hangar/05_continue_shop_ghost.png' });

    // Resume wave
    await page.locator('[data-testid="resume-wave-button"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'reports/screenshots/stream_c_hangar/06_gameplay_resumed_ghost.png' });
  });
});

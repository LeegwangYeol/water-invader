import { test, expect } from '@playwright/test';

test.describe('DEF-TST-02: Flagship Factions Live Browser E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start game to hydrate GameManager, Player, and Flagship subsystems
    const startBtn = page.locator('button', { hasText: /START GAME|게임 시작/i });
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();

    // Wait for GameManager and FlagshipManager hydration
    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      return (
        gm &&
        fm &&
        gm.player &&
        gm.state === 'PLAYING' &&
        fm.bioHorror &&
        fm.automatonPhalanx
      );
    }, { timeout: 15000 });
  });

  // =========================================================================
  // SUB-SUITE 1: HADAL BIO-HORRORS PARASITE CLINGER & 4-WIGGLE SHAKE-OFF
  // =========================================================================
  test('DEF-TST-02.1: Hadal parasite clinger attachment reduces speed and 4-wiggle shake-off restores speed in live browser', async ({ page }) => {
    // 1. Verify baseline player speed from active submersible chassis
    const baseSpeed = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return gm.player.baseSpeed || gm.player.speed;
    });
    expect(baseSpeed).toBeGreaterThan(0);

    // 2. Attach 1 parasite clinger via HadalBioHorrors
    const attachResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const bhm = (window as any).flagshipManager.bioHorror;
      bhm.attachClinger({
        id: 9001,
        attachOffset: { x: 0, y: 0 },
        dragIntensity: 0.25,
        torqueDirection: 1,
      });

      // Update to apply drag reduction to player
      bhm.update(0.016, gm.getFlagshipContext());

      return {
        attachedCount: bhm.state.attachedParasiteCount,
        speedAfterAttachment: gm.player.speed,
      };
    });

    expect(attachResult.attachedCount).toBe(1);
    // Speed should be reduced by 25%: baseSpeed * 0.75
    expect(attachResult.speedAfterAttachment).toBe(Math.round(baseSpeed * 0.75));

    // 3. Counterplay test: Repeated non-alternating key presses (Left, Left, Left) must NOT shake off clinger
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    const nonAlternatingStatus = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const bhm = (window as any).flagshipManager.bioHorror;
      bhm.update(0.016, gm.getFlagshipContext());
      return {
        attachedCount: bhm.state.attachedParasiteCount,
        speed: gm.player.speed,
      };
    });
    expect(nonAlternatingStatus.attachedCount).toBe(1);
    expect(nonAlternatingStatus.speed).toBe(Math.round(baseSpeed * 0.75));

    // 4. Counterplay test: Dispatch 4 alternating Left-Right wiggles within 1.2s window
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // 5. Verify shake-off completed and player speed fully restored to baseline
    const postShakeStatus = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const bhm = (window as any).flagshipManager.bioHorror;
      bhm.update(0.016, gm.getFlagshipContext());
      return {
        attachedCount: bhm.state.attachedParasiteCount,
        speed: gm.player.speed,
      };
    });

    expect(postShakeStatus.attachedCount).toBe(0);
    expect(postShakeStatus.speed).toBe(baseSpeed);
  });

  test('DEF-TST-02.2: Hadal parasite clinger proximity latching threshold (45px) in live browser', async ({ page }) => {
    const proximityResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const bhm = (window as any).flagshipManager.bioHorror;
      bhm.reset();

      const baseSpeed = gm.player.baseSpeed || gm.player.speed;
      const px = gm.player.position.x + 20;
      const py = gm.player.position.y + 15;

      // Spawn clinger within 40px (< 45px proximity radius)
      const clingerNear = bhm.spawnParasiteClinger(px, py - 35);
      // First update triggers proximity latching in step 5
      bhm.update(0.016, gm.getFlagshipContext());
      // Second update applies speed reduction in step 2 based on newly attached clinger
      bhm.update(0.016, gm.getFlagshipContext());

      return {
        baseSpeed,
        attachedCount: bhm.state.attachedParasiteCount,
        clingerIsDead: clingerNear.isDead,
        playerSpeed: gm.player.speed,
      };
    });

    expect(proximityResult.attachedCount).toBe(1);
    expect(proximityResult.clingerIsDead).toBe(true);
    expect(proximityResult.playerSpeed).toBe(Math.round(proximityResult.baseSpeed * 0.75));
  });

  // =========================================================================
  // SUB-SUITE 2: AUTOMATON SHIELD PHALANX GRID LINKING & INDUCTIVE BACKLASH
  // =========================================================================
  test('DEF-TST-02.3: Automaton Shield Phalanx grid linking and 40% dampening on frontal deflection in live browser', async ({ page }) => {
    const shieldResult = await page.evaluate(() => {
      const phalanx = (window as any).flagshipManager.automatonPhalanx;
      phalanx.grid.reset();
      phalanx.units = [];

      // Spawn 2 Aegis drones 80px apart (coupling distance limit is 160px)
      const d1 = phalanx.spawnAegisDrone(240, 300, 1);
      const d2 = phalanx.spawnAegisDrone(320, 300, 1);

      const linksCount = phalanx.grid.links.length;

      // Resolve a direct frontal shot against d1 (incoming velocity vy = -400)
      const hit = phalanx.grid.resolveHit(
        d1.id,
        { x: 240, y: 320 },
        { x: 0, y: -400 },
        100, // raw damage
        false // non-piercing
      );

      const d1Node = phalanx.grid.drones.get(d1.id);
      const d2Node = phalanx.grid.drones.get(d2.id);

      return {
        dronesRegistered: phalanx.grid.drones.size,
        linksCount,
        isDeflected: hit.isDeflected,
        damageToHull: hit.damageToHull,
        damageToShield: hit.damageToShield,
        d1ShieldHp: d1Node?.shieldHp,
        d2ShieldHp: d2Node?.shieldHp,
        d1MaxShield: d1Node?.maxShieldHp,
        d2MaxShield: d2Node?.maxShieldHp,
        d1Id: d1.id,
        d2Id: d2.id,
      };
    });

    expect(shieldResult.dronesRegistered).toBe(2);
    expect(shieldResult.linksCount).toBeGreaterThanOrEqual(1);
    expect(shieldResult.isDeflected).toBe(true);
    expect(shieldResult.damageToHull).toBe(0); // 100% frontal deflection to hull

    // 100 raw damage with 40% dampening -> 60 damage split equally between 2 drones = 30 each
    expect(shieldResult.damageToShield).toBe(30);
    expect(shieldResult.d1ShieldHp).toBe(shieldResult.d1MaxShield - 30);
    expect(shieldResult.d2ShieldHp).toBe(shieldResult.d2MaxShield - 30);
  });

  test('DEF-TST-02.4: Automaton shield collapse triggers inductive backlash stun on linked drone in live browser', async ({ page }) => {
    const backlashResult = await page.evaluate(() => {
      const phalanx = (window as any).flagshipManager.automatonPhalanx;
      phalanx.grid.reset();
      phalanx.units = [];

      // Spawn 2 Aegis drones with small shield HP on d1
      const d1 = phalanx.spawnAegisDrone(240, 300, 1);
      const d2 = phalanx.spawnAegisDrone(320, 300, 1);

      // Set d1 shield to low value so hit breaks it
      const d1Node = phalanx.grid.drones.get(d1.id)!;
      d1Node.shieldHp = 10;

      // Frontal shot of 100 dmg breaks d1 shield
      const hit = phalanx.grid.resolveHit(
        d1.id,
        { x: 240, y: 320 },
        { x: 0, y: -400 },
        100,
        false
      );

      const d2Node = phalanx.grid.drones.get(d2.id)!;

      return {
        triggeredBacklash: hit.triggeredBacklash,
        d1ShieldHp: d1Node.shieldHp,
        d2Stunned: d2Node.isBacklashStunned,
        d2StunTimer: d2Node.stunTimer,
        d2FrontalShieldActive: d2Node.isFrontalShieldActive,
        d2Hp: d2Node.hp,
        d2MaxHp: d2Node.maxHp,
      };
    });

    expect(backlashResult.triggeredBacklash).toBe(true);
    expect(backlashResult.d1ShieldHp).toBe(0);
    expect(backlashResult.d2Stunned).toBe(true);
    expect(backlashResult.d2StunTimer).toBeGreaterThanOrEqual(1.8);
    expect(backlashResult.d2FrontalShieldActive).toBe(false);
    // Backlash deals true hull damage to linked drones (min 80 or 35% maxHp)
    expect(backlashResult.d2Hp).toBeLessThan(backlashResult.d2MaxHp);
  });

  test('DEF-TST-02.5: Piercing weapon bypasses Automaton hexagonal shield grid in live browser', async ({ page }) => {
    const pierceResult = await page.evaluate(() => {
      const phalanx = (window as any).flagshipManager.automatonPhalanx;
      phalanx.grid.reset();
      const drone = phalanx.spawnAegisDrone(300, 300, 1);

      const hit = phalanx.grid.resolveHit(
        drone.id,
        { x: 300, y: 320 },
        { x: 0, y: -400 },
        60,
        true // isPiercing = true
      );

      const node = phalanx.grid.drones.get(drone.id)!;

      return {
        isDeflected: hit.isDeflected,
        bypassesShield: hit.bypassesShield,
        damageToHull: hit.damageToHull,
        shieldHp: node.shieldHp,
        maxShieldHp: node.maxShieldHp,
      };
    });

    expect(pierceResult.isDeflected).toBe(false);
    expect(pierceResult.bypassesShield).toBe(true);
    expect(pierceResult.damageToHull).toBe(60);
    expect(pierceResult.shieldHp).toBe(pierceResult.maxShieldHp); // Shield untouched!
  });

  // =========================================================================
  // SUB-SUITE 3: 4-SIDED BOUNDS CULLING PREVENTING OFF-SCREEN LEAKS
  // =========================================================================
  test('DEF-TST-02.6: Hadal Bio-Horrors and Automaton Phalanx cull entities across all 4 bounds in live browser', async ({ page }) => {
    const cullingResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const bhm = (window as any).flagshipManager.bioHorror;
      const phalanx = (window as any).flagshipManager.automatonPhalanx;

      // 1. Seed Hadal units: 4 off-screen on all 4 sides + 1 in-bounds
      bhm.units = [];
      const uLeft = bhm.spawnParasiteClinger(-180, 300);     // Left: x < -150
      const uRight = bhm.spawnParasiteClinger(780, 300);    // Right: x > 750
      const uTop = bhm.spawnParasiteClinger(300, -180);      // Top: y < -150
      const uBottom = bhm.spawnParasiteClinger(300, 880);   // Bottom: y > 850
      const uValid = bhm.spawnParasiteClinger(300, 400);    // Valid in-bounds

      // 2. Seed Automaton railSlugs: 4 off-screen on all 4 sides + 1 in-bounds
      phalanx.railSlugs = [
        { x: -120, y: 300, vx: -50, vy: 0, damage: 15, isDead: false }, // Left: x < -100
        { x: 720, y: 300, vx: 50, vy: 0, damage: 15, isDead: false },   // Right: x > 700
        { x: 300, y: -120, vx: 0, vy: -50, damage: 15, isDead: false },  // Top: y < -100
        { x: 300, y: 880, vx: 0, vy: 50, damage: 15, isDead: false },   // Bottom: y > 850
        { x: 300, y: 300, vx: 0, vy: 200, damage: 99, isDead: false },  // Valid in-bounds
      ];

      // Update both systems
      bhm.update(0.016, gm.getFlagshipContext());
      phalanx.update(0.016, gm.getFlagshipContext());

      return {
        bhmUnitsCount: bhm.units.length,
        bhmHasValid: bhm.units.some((u: any) => u.id === uValid.id),
        bhmHasLeft: bhm.units.some((u: any) => u.id === uLeft.id),
        bhmHasRight: bhm.units.some((u: any) => u.id === uRight.id),
        bhmHasTop: bhm.units.some((u: any) => u.id === uTop.id),
        bhmHasBottom: bhm.units.some((u: any) => u.id === uBottom.id),
        railSlugsCount: phalanx.railSlugs.length,
        railSlugsValidPresent: phalanx.railSlugs.some((s: any) => s.damage === 99),
      };
    });

    // Bio-Horror verification: Only the 1 valid in-bounds unit survives
    expect(cullingResult.bhmUnitsCount).toBe(1);
    expect(cullingResult.bhmHasValid).toBe(true);
    expect(cullingResult.bhmHasLeft).toBe(false);
    expect(cullingResult.bhmHasRight).toBe(false);
    expect(cullingResult.bhmHasTop).toBe(false);
    expect(cullingResult.bhmHasBottom).toBe(false);

    // Automaton rail slugs verification: Only the 1 valid in-bounds slug survives
    expect(cullingResult.railSlugsCount).toBe(1);
    expect(cullingResult.railSlugsValidPresent).toBe(true);
  });
});

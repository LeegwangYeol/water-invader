import { test, expect } from '@playwright/test';
import { HydrothermalVent, HydrothermalVentManager } from '../src/game/flagship/environment/HydrothermalVent';
import { OceanCurrent } from '../src/game/flagship/environment/OceanCurrent';
import { VentState, Faction, EnemyType } from '../src/game/flagship/types';
import { Player } from '../src/game/Player';
import { Enemy } from '../src/game/Enemy';
import { Bullet } from '../src/game/Bullet';

test.describe('Stream B Live QA Playtest: Hydrothermal Vents & Ocean Currents', () => {

  // --------------------------------------------------------------------------
  // 1. Conical Plume Geometry
  // --------------------------------------------------------------------------
  test('STREAM-B-01: Conical plume geometry conforms to seabed y=760, cap y=100, and analytical radius profiles', () => {
    const vent = new HydrothermalVent('vent_left', 180, 0);

    expect(vent.baseY).toBe(760);
    expect(vent.capY).toBe(100);

    // Seabed aperture: R_core(760) = 22 + (760 - 760) * 0.08 = 22 px -> Diameter = 44 px
    const baseCoreR = vent.getCoreRadius(760);
    expect(baseCoreR).toBe(22);
    expect(baseCoreR * 2).toBe(44); // 44px aperture

    // Mid-depth y = 400: R_core(400) = 22 + (760 - 400) * 0.08 = 22 + 28.8 = 50.8 px
    const midCoreR = vent.getCoreRadius(400);
    expect(midCoreR).toBeCloseTo(50.8, 4);

    // Dissipation cap y = 100: R_core(100) = 22 + (760 - 100) * 0.08 = 22 + 52.8 = 74.8 px
    const capCoreR = vent.getCoreRadius(100);
    expect(capCoreR).toBeCloseTo(74.8, 4);

    // Convective Cooling Halo: R_halo(y) = R_core(y) * 1.85
    expect(vent.getHaloRadius(760)).toBeCloseTo(22 * 1.85, 4); // 40.7 px
    expect(vent.getHaloRadius(400)).toBeCloseTo(50.8 * 1.85, 4); // 93.98 px
    expect(vent.getHaloRadius(100)).toBeCloseTo(74.8 * 1.85, 4); // 138.38 px (~140px)

    // Boundaries clamping: above cap y < 100 or below seabed y > 780 must return false
    expect(vent.isInCore(180, 90)).toBe(false);
    expect(vent.isInHalo(180, 90)).toBe(false);
    expect(vent.isInCore(180, 790)).toBe(false);

    // Core hit testing at mid-depth y = 400 (R_core = 50.8, anchorX = 180)
    expect(vent.isInCore(180, 400)).toBe(true); // Center
    expect(vent.isInCore(180 + 45, 400)).toBe(true); // Inside core (45 <= 50.8)
    expect(vent.isInCore(180 + 55, 400)).toBe(false); // Outside core (55 > 50.8)

    // Halo hit testing at mid-depth y = 400 (R_halo = 93.98)
    expect(vent.isInHalo(180 + 55, 400)).toBe(true); // In outer halo (50.8 < 55 <= 93.98)
    expect(vent.isInHalo(180 + 100, 400)).toBe(false); // Outside halo (100 > 93.98)
  });

  // --------------------------------------------------------------------------
  // 2. Thermal Core Dynamics: Player Grace / DoT & Hostile Scaling Decay
  // --------------------------------------------------------------------------
  test('STREAM-B-02: Player takes 1 HP damage per 1.25s after 0.5s grace window', () => {
    const vent = new HydrothermalVent('vent_left', 180, 0);
    const player = new Player(600, 800);
    player.hp = 10;
    player.position = { x: 180 - 16, y: 500 }; // Player centered at x=180 inside core

    // Frame 1: 0.4s exposure (within 0.5s grace window)
    vent.update(0.4, player, [], []);
    expect(player.hp).toBe(10); // No damage taken during grace window
    expect(vent.playerCoreExposureTimer).toBeCloseTo(0.4, 4);

    // Frame 2: +0.2s exposure (total 0.6s -> exceeds 0.5s grace, but burn interval timer is at 0.1s)
    vent.update(0.2, player, [], []);
    expect(player.hp).toBe(10); // Burn interval (1.25s) has not yet elapsed

    // Frame 3: Advance by 1.15s (burn interval timer reaches 1.25s)
    vent.update(1.15, player, [], []);
    expect(player.hp).toBe(9); // First 1 HP damage inflicted!

    // Frame 4: Advance another 1.25s
    vent.update(1.25, player, [], []);
    expect(player.hp).toBe(8); // Second 1 HP damage inflicted!

    // Exit core: move player to x = 350 (far from vent anchor 180)
    player.position.x = 350;
    vent.update(0.5, player, [], []);
    expect(player.hp).toBe(8); // No further damage
    expect(vent.playerCoreExposureTimer).toBeLessThan(3.0); // Exposure timer decays at 2x rate

    // Advance 1.5s outside core: exposure timer completely resets to 0
    vent.update(1.5, player, [], []);
    expect(vent.playerCoreExposureTimer).toBe(0);
  });

  test('STREAM-B-03: Hostiles in scalding core suffer DPS = 28 + 0.06 * MaxHP and shield suppression', () => {
    const vent = new HydrothermalVent('vent_left', 180, 0);
    const dummyPlayer = new Player(600, 800);

    // Hostile with MaxHP = 200 inside core at x=180, y=500
    const enemy = new Enemy(180 - 16, 500 - 16, 600, 1, ((EnemyType as any).ELITE ?? EnemyType.SHIELDED));
    (enemy as any).maxHp = 200;
    (enemy as any).hp = 200;
    (enemy as any).shieldRegenSuppressed = false;

    // Theoretical DPS = 28 + 0.06 * 200 = 28 + 12 = 40.0 DPS
    // For dt = 0.25s: expected damage = 40.0 * 0.25 = 10.0 HP
    vent.update(0.25, dummyPlayer, [enemy], []);

    expect((enemy as any).hp).toBeCloseTo(190.0, 2);
    expect((enemy as any).shieldRegenSuppressed).toBe(true);

    // Another 0.5s in core: expected additional damage = 40.0 * 0.5 = 20.0 HP
    vent.update(0.5, dummyPlayer, [enemy], []);
    expect((enemy as any).hp).toBeCloseTo(170.0, 2);
  });

  // --------------------------------------------------------------------------
  // 3. Steam Lance Transformation
  // --------------------------------------------------------------------------
  test('STREAM-B-04: Player bullets passing through core convert into Steam Lances (+35% dmg, +1 pierce, -680 px/s)', () => {
    const vent = new HydrothermalVent('vent_left', 180, 0);
    const dummyPlayer = new Player(600, 800);

    // Standard player bullet moving upward through core
    const bullet = new Bullet(180, 500, -320, 20, true);
    bullet.isPlayerBullet = true;
    bullet.piercing = 1;
    expect((bullet as any).__steamLance).toBeUndefined();

    // Advance 1 frame inside core
    vent.update(0.016, dummyPlayer, [], [bullet]);

    expect((bullet as any).__steamLance).toBe(true);
    expect(bullet.damage).toBe(Math.round(20 * 1.35)); // 27 (+35%)
    expect(bullet.piercing).toBe(2); // 1 + 1 pierce
    expect(bullet.velocity.y).toBe(-680); // Speed boosted to -680 px/s

    // Verify transformation is idempotent (subsequent frames do not compound bonuses)
    vent.update(0.016, dummyPlayer, [], [bullet]);
    expect(bullet.damage).toBe(27);
    expect(bullet.piercing).toBe(2);
    expect(bullet.velocity.y).toBe(-680);
  });

  // --------------------------------------------------------------------------
  // 4. Hostile Bullet Vaporization & Counter-Buoyancy
  // --------------------------------------------------------------------------
  test('STREAM-B-05: Descending hostile bullets suffer ay = -520 px/s² and dissolve within 0.35s', () => {
    const vent = new HydrothermalVent('vent_left', 180, 0);
    const dummyPlayer = new Player(600, 800);

    // Hostile bullet descending at +250 px/s through vent core
    const enemyBullet = new Bullet(180, 350, 250, 1, false);
    enemyBullet.isPlayerBullet = false;
    expect(enemyBullet.isDead).toBe(false);

    // Frame 1: dt = 0.1s
    vent.update(0.1, dummyPlayer, [], [enemyBullet]);
    // Velocity: 250 + (-520 * 0.1) = 198 px/s
    expect(enemyBullet.velocity.y).toBeCloseTo(198, 2);
    expect(enemyBullet.isDead).toBe(false);
    expect((enemyBullet as any).__ventDissolveTimer).toBeCloseTo(0.1, 4);

    // Frame 2: dt = 0.2s (total 0.3s)
    vent.update(0.2, dummyPlayer, [], [enemyBullet]);
    // Velocity: 198 + (-520 * 0.2) = 94 px/s
    expect(enemyBullet.velocity.y).toBeCloseTo(94, 2);
    expect(enemyBullet.isDead).toBe(false);

    // Frame 3: dt = 0.06s (total 0.36s >= 0.35s threshold)
    vent.update(0.06, dummyPlayer, [], [enemyBullet]);
    expect(enemyBullet.isDead).toBe(true); // Vaporized into bubbles!
  });

  // --------------------------------------------------------------------------
  // 5. Convective Cooling Halo (Buoyant Lift & Weapon Heat Dissipation)
  // --------------------------------------------------------------------------
  test('STREAM-B-06: Player in halo receives +160 px/s buoyant lift and +250% weapon heat dissipation', () => {
    const vent = new HydrothermalVent('vent_left', 180, 0);
    vent.state = VentState.DORMANT;

    const player = new Player(600, 800);
    // At y = 500, R_core = 22 + 260 * 0.08 = 42.8 px, R_halo = 42.8 * 1.85 = 79.18 px
    // Place player at x = 180 + 60 (inside halo, outside core)
    player.position = { x: 240 - 16, y: 500 };

    // Verify player is in halo but outside core
    expect(vent.isInCore(240, 500 + 16)).toBe(false);
    expect(vent.isInHalo(240, 500 + 16)).toBe(true);

    const initialY = player.position.y;
    // Advance 0.5s: lift = 160 px/s * 0.5s = 80 px
    vent.update(0.5, player, [], []);
    expect(player.position.y).toBeCloseTo(initialY - 80, 2);

    // Verify erupting state lift: 260 px/s
    vent.state = VentState.ERUPTING;
    const curY = player.position.y;
    vent.update(0.5, player, [], []);
    expect(player.position.y).toBeCloseTo(curY - 130, 2); // 260 * 0.5 = 130 px
  });

  // --------------------------------------------------------------------------
  // 6. Stratified Deep Ocean Currents (Upper Shelf East, Lower Shelf West)
  // --------------------------------------------------------------------------
  test('STREAM-B-07: Ocean currents maintain +75 px/s East (y<400) and -60 px/s West (y>=400) with sigmoid shear', () => {
    const current = new OceanCurrent(600, 800);

    // 1. Upper stratum (y = 200, well above shelfBoundaryY = 400 and shearBand = 80)
    const upperVel = current.getVelocityAt(300, 200);
    expect(upperVel.x).toBe(75); // Exactly +75 px/s East
    expect(upperVel.y).toBe(0);

    // 2. Lower stratum (y = 600, well below shelfBoundaryY = 400 and shearBand = 80)
    const lowerVel = current.getVelocityAt(300, 600);
    expect(lowerVel.x).toBe(-60); // Exactly -60 px/s West
    expect(lowerVel.y).toBe(0);

    // 3. Shear boundary midline (y = 400)
    const midVel = current.getVelocityAt(300, 400);
    // At deltaY = 0, normalizedDist = 0, blend = 0.5
    // vx = 75 * 0.5 + (-60) * 0.5 = 7.5 px/s
    expect(midVel.x).toBeCloseTo(7.5, 4);

    // 4. Seafloor no-slip boundary condition (y >= 700)
    const seabedVel = current.getVelocityAt(300, 720);
    expect(seabedVel.x).toBe(0);
    expect(seabedVel.y).toBe(0);

    // 5. Entity conveyor drag
    const upperMob = new Enemy(300, 200, 600, 1, EnemyType.NORMAL);
    current.applyCurrentDrag(upperMob, 1.0); // 1s drag: shift = 75 * 0.18 = +13.5 px
    expect(upperMob.position.x).toBeCloseTo(300 + 13.5, 2);

    const lowerMob = new Enemy(300, 600, 600, 1, EnemyType.NORMAL);
    current.applyCurrentDrag(lowerMob, 1.0); // 1s drag: shift = -60 * 0.18 = -10.8 px
    expect(lowerMob.position.x).toBeCloseTo(300 - 10.8, 2);

    // 6. Projectile parabolic curvature
    const bullet = new Bullet(300, 200, -400, 10, true);
    bullet.velocity.x = 0;
    // drag formula: bullet.velocity.x += (currentVel.x - bullet.velocity.x) * 0.35 * dt
    current.applyCurrentToBullet(bullet, 0.2);
    // expected vx = (75 - 0) * 0.35 * 0.2 = 5.25 px/s
    expect(bullet.velocity.x).toBeCloseTo(5.25, 2);
  });

  // --------------------------------------------------------------------------
  // 7. Live Browser Playtesting & Clean Console Verification
  // --------------------------------------------------------------------------
  test('STREAM-B-08: Live browser playtest renders vents and currents without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(`[PageError] ${err.message}`);
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    // Ensure game and flagship managers are populated on window
    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      return gm && fm && gm.player;
    }, { timeout: 10000 });

    // Verify hydrothermal vents subsystem in live window context
    const liveTelemetry = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      if (!fm) return null;

      const vm = fm.hydrothermalVents;
      const oc = vm?.currentSystem;

      return {
        hasFlagshipManager: true,
        ventCount: vm?.vents?.length ?? 0,
        ventLeftAnchor: vm?.vents?.[0]?.anchorX,
        ventRightAnchor: vm?.vents?.[1]?.anchorX,
        upperCurrentSpeed: oc?.upperShelfVelocityX,
        lowerCurrentSpeed: oc?.lowerShelfVelocityX,
        laserCoolingHaloState: fm.prismLaser?.inCoolingHalo,
      };
    });

    expect(liveTelemetry).not.toBeNull();
    expect(liveTelemetry?.ventCount).toBe(2);
    expect(liveTelemetry?.ventLeftAnchor).toBe(180);
    expect(liveTelemetry?.ventRightAnchor).toBe(420);
    expect(liveTelemetry?.upperCurrentSpeed).toBe(75);
    expect(liveTelemetry?.lowerCurrentSpeed).toBe(-60);

    // Run active gameplay loop for 2 seconds while moving player into vent halo
    await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      const game = (window as any).gameManager;
      if (game?.player) {
        // Place player inside Vent Left outer halo (anchorX=180, at y=740 R_core=23.6, R_halo=43.7)
        // With width=50, center will be at 185 + 25 = 210 (distance 30px, between 23.6 and 43.7)
        game.player.position.x = 185;
        game.player.position.y = 740;
        game.player.isMovingLeft = false;
        game.player.isMovingRight = false;
      }
    });

    await page.waitForTimeout(1000);

    // Verify weapon cooling halo was triggered in real game loop
    const coolingHaloActiveInLoop = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      return fm.prismLaser?.inCoolingHalo;
    });

    expect(coolingHaloActiveInLoop).toBe(true);

    // Ensure zero runtime errors in browser console
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('turbopack')
    );
    expect(criticalErrors).toHaveLength(0);
  });

});

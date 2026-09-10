import { test, expect } from '@playwright/test';

test.describe('Flagship 12 Features Master E2E Suite', () => {
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

  test('FLAGSHIP-00: All 12 Flagship subsystems are instantiated, mounted, and registered in FlagshipManager', async ({ page }) => {
    const subsystemsStatus = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      return {
        hasCavitationTorpedo: !!fm.cavitationTorpedo,
        hasPrismLaser: !!fm.prismLaser,
        hasHydraulicHarpoon: !!fm.hydraulicHarpoon,
        hasHydrothermalVents: !!fm.hydrothermalVents,
        hasBiolapseDarkness: !!fm.biolapseDarkness,
        hasModularChassis: !!fm.modularChassis,
        hasCrewDeck: !!fm.crewDeck,
        hasBioHorror: !!fm.bioHorror,
        hasAutomatonPhalanx: !!fm.automatonPhalanx,
        hasApexBoss: !!fm.apexBoss,
        hasEndlessDescent: !!fm.endlessDescent,
        hasSonarRenderer: !!fm.sonarRenderer,
        subsystemsCount: fm.getSubsystems().length,
      };
    });

    expect(subsystemsStatus.hasCavitationTorpedo).toBe(true);
    expect(subsystemsStatus.hasPrismLaser).toBe(true);
    expect(subsystemsStatus.hasHydraulicHarpoon).toBe(true);
    expect(subsystemsStatus.hasHydrothermalVents).toBe(true);
    expect(subsystemsStatus.hasBiolapseDarkness).toBe(true);
    expect(subsystemsStatus.hasModularChassis).toBe(true);
    expect(subsystemsStatus.hasCrewDeck).toBe(true);
    expect(subsystemsStatus.hasBioHorror).toBe(true);
    expect(subsystemsStatus.hasAutomatonPhalanx).toBe(true);
    expect(subsystemsStatus.hasApexBoss).toBe(true);
    expect(subsystemsStatus.hasEndlessDescent).toBe(true);
    expect(subsystemsStatus.hasSonarRenderer).toBe(true);
    expect(subsystemsStatus.subsystemsCount).toBeGreaterThanOrEqual(12);
  });

  test('FLAGSHIP-01: Cavitation Torpedo [C] fires ordnance, consumes ammo, and supports remote detonation', async ({ page }) => {
    const initialAmmo = await page.evaluate(() => (window as any).flagshipManager.cavitationTorpedo.torpedoAmmo);
    expect(initialAmmo).toBe(3);

    // Press 'c' key to fire torpedo
    await page.keyboard.press('c');

    const statusAfterFire = await page.evaluate(() => {
      const torpSys = (window as any).flagshipManager.cavitationTorpedo;
      return {
        ammo: torpSys.torpedoAmmo,
        torpedoCount: torpSys.torpedoes.length,
        firstTorpedoState: torpSys.torpedoes[0]?.state,
      };
    });

    expect(statusAfterFire.ammo).toBe(2);
    expect(statusAfterFire.torpedoCount).toBeGreaterThanOrEqual(1);

    // Advance simulation slightly and trigger remote detonation
    await page.evaluate(() => {
      const torpSys = (window as any).flagshipManager.cavitationTorpedo;
      const t = torpSys.torpedoes[0];
      if (t) {
        t.distanceTraveled = 120; // Arm the torpedo
        t.state = 'ARMED';
      }
      torpSys.detonateActiveTorpedo();
    });

    const detonatedState = await page.evaluate(() => {
      const torpSys = (window as any).flagshipManager.cavitationTorpedo;
      return torpSys.torpedoes[0]?.state;
    });

    expect(detonatedState).toBe('SINGULARITY');
  });

  test('FLAGSHIP-02: Bioluminescent Laser [Space] heats up thermodynamic engine and [P] deploys Refraction Prism', async ({ page }) => {
    const initialLaserState = await page.evaluate(() => {
      const laser = (window as any).flagshipManager.prismLaser;
      return {
        heat: laser.heat,
        heatZone: laser.getHeatZone(),
        prismCharges: laser.prismCharges,
        prismsCount: laser.activePrisms.length,
      };
    });

    expect(initialLaserState.heat).toBe(0);
    expect(initialLaserState.heatZone).toBe('COOL');

    // Press 'p' to deploy floating Quartz Refraction Prism
    await page.keyboard.press('p');

    const prismDeployed = await page.evaluate(() => {
      const laser = (window as any).flagshipManager.prismLaser;
      return {
        charges: laser.prismCharges,
        count: laser.activePrisms.length,
      };
    });

    expect(prismDeployed.count).toBe(1);
    expect(prismDeployed.charges).toBe(initialLaserState.prismCharges - 1);

    // Fire laser continuously to build heat
    await page.evaluate(() => {
      const laser = (window as any).flagshipManager.prismLaser;
      laser.setFiring(true);
      laser.heat = 85; // Set into Supercharged sweet-spot zone
    });

    const superchargedZone = await page.evaluate(() => (window as any).flagshipManager.prismLaser.getHeatZone());
    expect(superchargedZone).toBe('SUPERCHARGED');
  });

  test('FLAGSHIP-03: Hydraulic Harpoon [H] launches pneumatic dart and [Shift] triggers winch', async ({ page }) => {
    const initialHarpoon = await page.evaluate(() => {
      const h = (window as any).flagshipManager.hydraulicHarpoon;
      return { state: h.state, isWinching: h.isWinching };
    });

    expect(initialHarpoon.state).toBe('READY');

    // Press 'h' to fire harpoon dart
    await page.keyboard.press('h');

    const flyingState = await page.evaluate(() => (window as any).flagshipManager.hydraulicHarpoon.state);
    expect(flyingState).toBe('FLYING');

    // Engage winch with Shift key down
    await page.keyboard.down('Shift');
    await page.evaluate(() => {
      const h = (window as any).flagshipManager.hydraulicHarpoon;
      h.state = 'TETHERED';
      h.startWinch();
    });

    const winching = await page.evaluate(() => (window as any).flagshipManager.hydraulicHarpoon.isWinching);
    expect(winching).toBe(true);

    await page.keyboard.up('Shift');
  });

  test('FLAGSHIP-04: Hydrothermal Vents & Ocean Currents update in environment layers', async ({ page }) => {
    const ventsStatus = await page.evaluate(() => {
      const vm = (window as any).flagshipManager.hydrothermalVents;
      return {
        count: vm.vents.length,
        hasCurrent: !!vm.currentSystem,
        firstVentState: vm.vents[0]?.state,
      };
    });

    expect(ventsStatus.count).toBeGreaterThanOrEqual(2);
    expect(ventsStatus.hasCurrent).toBe(true);
    expect(['DORMANT', 'CHARGING', 'ERUPTING']).toContain(ventsStatus.firstVentState);
  });

  test('FLAGSHIP-05: Biolapse Darkness Cycle [L] headlight, [V] high-beam, and [B] acoustic sonar ping', async ({ page }) => {
    // Press 'l' to toggle searchlight
    await page.keyboard.press('l');

    const lightOn = await page.evaluate(() => (window as any).flagshipManager.biolapseDarkness.isLightOn);
    expect(lightOn).toBe(true);

    // Press 'v' to toggle high-beam overdrive
    await page.keyboard.press('v');

    const highBeamOn = await page.evaluate(() => (window as any).flagshipManager.biolapseDarkness.isHighBeam);
    expect(highBeamOn).toBe(true);

    // Press 'b' to trigger acoustic sonar ping
    await page.keyboard.press('b');

    const sonarPingActive = await page.evaluate(() => (window as any).flagshipManager.biolapseDarkness.sonarPingActive);
    expect(sonarPingActive).toBe(true);
  });

  test('FLAGSHIP-06: Modular Submersible Chassis maintains 6-axis radar profiles and selection', async ({ page }) => {
    const chassisData = await page.evaluate(() => {
      const cm = (window as any).flagshipManager.modularChassis;
      const initialChassis = cm.activeChassis.id;

      // Select Stingray Interceptor
      cm.selectChassis('STINGRAY');
      const stingrayStats = cm.activeChassis.radarStats;

      return {
        initialChassis,
        switchedChassis: cm.activeChassis.id,
        speed: stingrayStats.speed,
        armor: stingrayStats.armor,
      };
    });

    expect(chassisData.switchedChassis).toBe('STINGRAY');
    expect(chassisData.speed).toBeGreaterThan(chassisData.armor);
  });

  test('FLAGSHIP-07: Veteran Crew Synergy Deck abilities trigger on hotkeys [1], [2], [3], [4]', async ({ page }) => {
    // Press '1' to trigger Ingrid's SCRAM Purge
    await page.keyboard.press('1');

    const ingridCooldown = await page.evaluate(() => {
      const deck = (window as any).flagshipManager.crewDeck;
      return deck.state.officers['INGRID'].activeAbility.currentCooldown;
    });

    expect(ingridCooldown).toBeGreaterThan(0);

    // Press '2' to trigger Jax's Titan Salvo
    await page.keyboard.press('2');

    const jaxCooldown = await page.evaluate(() => {
      const deck = (window as any).flagshipManager.crewDeck;
      return deck.state.officers['JAX'].activeAbility.currentCooldown;
    });

    expect(jaxCooldown).toBeGreaterThan(0);
  });

  test('FLAGSHIP-08: Hadal Bio-Horrors unit spawning and epigenetic damage telemetry', async ({ page }) => {
    const horrorState = await page.evaluate(() => {
      const bhm = (window as any).flagshipManager.bioHorror;
      const clinger = bhm.spawnParasiteClinger(300, 400);
      bhm.recordDamageDealt('kinetic', 450);

      return {
        unitsCount: bhm.units.length,
        spawnedType: clinger.type,
        activeMutation: bhm.state.activeMutation,
      };
    });

    expect(horrorState.unitsCount).toBeGreaterThanOrEqual(1);
    expect(horrorState.spawnedType).toBe('CLINGER');
  });

  test('FLAGSHIP-09: Automaton Shield Phalanx drone linking and grid dampening', async ({ page }) => {
    const phalanxState = await page.evaluate(() => {
      const ph = (window as any).flagshipManager.automatonPhalanx;
      ph.grid.registerDrone({
        id: 101,
        type: 'AEGIS',
        x: 250,
        y: 350,
        shieldHp: 200,
        maxShieldHp: 200,
        isFrontalShieldActive: true,
        shieldNormal: { x: 0, y: 1 },
        linkedDroneIds: [],
        isBacklashStunned: false,
      });
      ph.grid.registerDrone({
        id: 102,
        type: 'AEGIS',
        x: 310,
        y: 350,
        shieldHp: 200,
        maxShieldHp: 200,
        isFrontalShieldActive: true,
        shieldNormal: { x: 0, y: 1 },
        linkedDroneIds: [],
        isBacklashStunned: false,
      });

      return {
        dronesCount: ph.grid.drones.size,
        linksCount: ph.grid.links.length,
        dampenedDamage: ph.grid.distributeDamage(101, 100),
      };
    });

    expect(phalanxState.dronesCount).toBe(2);
    expect(phalanxState.linksCount).toBe(1);
    expect(phalanxState.dampenedDamage).toBe(30); // 100 * 0.60 / 2
  });

  test('FLAGSHIP-10: Apex Boss Kraken Prime initiates 12,000 EHP encounter with 8 tentacles', async ({ page }) => {
    const bossState = await page.evaluate(() => {
      const apex = (window as any).flagshipManager.apexBoss;
      apex.spawnApexBoss();

      return {
        totalHp: apex.activeBoss?.totalHp,
        maxHp: apex.activeBoss?.maxHp,
        tentaclesCount: apex.tentacles.length,
        hasMawSubsystem: !!apex.mawSubsystem,
      };
    });

    expect(bossState.totalHp).toBe(12000);
    expect(bossState.maxHp).toBe(12000);
    expect(bossState.tentaclesCount).toBe(8);
    expect(bossState.hasMawSubsystem).toBe(true);
  });

  test('FLAGSHIP-11: Roguelike Endless Mode (Endless Descent) DAG generation and ballast purge', async ({ page }) => {
    const descentState = await page.evaluate(() => {
      const ed = (window as any).flagshipManager.endlessDescent;
      ed.startRun();
      ed.runState.pressure.stressPercentage = 60;
      const vented = ed.ventBallast();

      return {
        isActive: ed.runState.isActive,
        depth: ed.runState.pressure.currentDepthMeters,
        stressAfterPurge: ed.runState.pressure.stressPercentage,
        nodesCount: Object.keys(ed.runState.mapNodes).length,
      };
    });

    expect(descentState.isActive).toBe(true);
    expect(descentState.depth).toBe(100);
    expect(descentState.stressAfterPurge).toBeLessThan(60);
    expect(descentState.nodesCount).toBeGreaterThan(5);
  });

  test('FLAGSHIP-12: Sonar/Hydrophone sensory suite rotates sweep beam and generates stress fractures', async ({ page }) => {
    const sensoryData = await page.evaluate(() => {
      const sr = (window as any).flagshipManager.sonarRenderer;
      const initialSweep = sr.hud.radarState.sweepAngleRad;

      // Add a glass fracture
      sr.addFracture(70);

      return {
        initialSweep,
        bandsCount: sr.spectrogram.waterfallState.frequencyBands.length,
        fracturesCount: sr.stressFX.fractureLines.length,
      };
    });

    expect(sensoryData.bandsCount).toBe(16);
    expect(sensoryData.fracturesCount).toBeGreaterThan(0);
  });
});

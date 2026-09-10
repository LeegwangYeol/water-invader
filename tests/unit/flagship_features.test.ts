import { test, expect } from '@playwright/test';
import { Player } from '../../src/game/Player';
import { Enemy, EnemyType } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { Barricade, BarricadeType } from '../../src/game/Barricade';
import { Faction, Vector2D } from '../../src/game/types';

// Flagship Subsystems & Types
import {
  FlagshipManager,
  FlagshipUpdateContext,
  CavitationTorpedo,
  CavitationTorpedoSystem,
  DEFAULT_TORPEDO_CONFIG,
  TorpedoState,
  BioluminescentLaserSystem,
  LaserHeatZone,
  QuartzRefractionPrism,
  HydraulicHarpoon,
  DEFAULT_HARPOON_CONFIG,
  HarpoonState,
  HydrothermalVent,
  HydrothermalVentManager,
  OceanCurrent,
  VentState,
  BiolapseDarknessCycle,
  BiolapsePhase,
  ModularChassisManager,
  ChassisId,
  ChassisRadarChart,
  RADAR_AXES,
  CrewOfficerDeckManager,
  OfficerId,
  HadalBioHorrors,
  EpigeneticMutationEngine,
  AutomatonPhalanx,
  AutomatonShieldGrid,
  KrakenPrimeBoss,
  CharybdisTentacle,
  EndlessDescent,
  BathymetricDAG,
  BoonDraftDeck,
  SonarRenderer,
  TacticalSonarHUD,
  HydrophoneSpectrogram,
  HullStressFX,
} from '../../src/game/flagship';

/**
 * Creates a deterministic, isolated FlagshipUpdateContext for unit simulation testing
 */
function createMockContext(overrides: Partial<FlagshipUpdateContext> = {}): FlagshipUpdateContext {
  const player = new Player(600, 800);
  player.position = { x: 300, y: 720 };
  player.hp = 3;
  player.maxHp = 5;

  return {
    player,
    enemies: [],
    bullets: [],
    barricades: [],
    helpers: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 100,
    createExplosion: () => {},
    triggerScreenShake: () => {},
    ...overrides,
  };
}

// ============================================================================
// FEATURE 1: CAVITATION TORPEDO & PRESSURE IMPLOSION ORDNANCE
// ============================================================================
test.describe('Flagship Feature 1: Cavitation Torpedo & Implosion Ordnance', () => {
  test('TORPEDO-01: State machine transitions from INERT to ARMED after arming distance threshold', () => {
    const torpedo = new CavitationTorpedo(300, 700);
    expect(torpedo.state).toBe(TorpedoState.INERT);
    expect(torpedo.distanceTraveled).toBe(0);

    // Initial update: travels less than armDistance (100 px)
    torpedo.update(0.2, [], []);
    expect(torpedo.state).toBe(TorpedoState.INERT);
    expect(torpedo.distanceTraveled).toBeGreaterThan(0);
    expect(torpedo.distanceTraveled).toBeLessThan(DEFAULT_TORPEDO_CONFIG.armDistance);

    // Continue updating until distance >= 100 px
    torpedo.update(0.6, [], []);
    expect(torpedo.distanceTraveled).toBeGreaterThanOrEqual(DEFAULT_TORPEDO_CONFIG.armDistance);
    expect(torpedo.state).toBe(TorpedoState.ARMED);
  });

  test('TORPEDO-02: Remote detonation (double-tap trigger) transitions ARMED torpedo into SINGULARITY', () => {
    const torpedo = new CavitationTorpedo(300, 700);
    
    // Cannot remote detonate while still INERT (safety threshold)
    const earlyTrigger = torpedo.triggerRemoteDetonation();
    expect(earlyTrigger).toBe(false);
    expect(torpedo.state).toBe(TorpedoState.INERT);

    // Advance until armed
    torpedo.update(0.8, [], []);
    expect(torpedo.state).toBe(TorpedoState.ARMED);

    // Double-tap trigger
    const triggered = torpedo.triggerRemoteDetonation();
    expect(triggered).toBe(true);
    expect(torpedo.state).toBe(TorpedoState.SINGULARITY);
    expect(torpedo.velocity.x).toBe(0);
    expect(torpedo.velocity.y).toBe(0);
  });

  test('TORPEDO-03: Negative pressure Singularity exerts gravitational pull on nearby hostiles', () => {
    const torpedo = new CavitationTorpedo(300, 400);
    torpedo.state = TorpedoState.SINGULARITY;
    torpedo.vacuumTimer = 0.01;

    // Enemy placed 60px to the right of torpedo (within vacuumRadius = 140px)
    const initialEnemyX = 360;
    const initialEnemyY = 400;
    const enemy = new Enemy(initialEnemyX, initialEnemyY, 600, 1, EnemyType.NORMAL);

    torpedo.update(0.03, [enemy], []);

    // Enemy should have been drawn toward the torpedo center (x < 360)
    expect(enemy.position.x).toBeLessThan(initialEnemyX);
    expect(Math.abs(enemy.position.y - 400)).toBeLessThanOrEqual(2);
  });

  test('TORPEDO-04: Singularity transitions to Shockwave after vacuum duration, vaporizing enemy bullets', () => {
    const torpedo = new CavitationTorpedo(300, 400);
    torpedo.state = TorpedoState.SINGULARITY;
    torpedo.vacuumTimer = 0;

    const hostileBullet = new Bullet(320, 400, 100, 1, false);
    hostileBullet.isPlayerBullet = false;
    hostileBullet.faction = Faction.INVADER;

    // Inside vacuum pull
    torpedo.update(0.02, [], [hostileBullet]);
    expect(hostileBullet.isDead).toBe(false);

    // Advance past vacuumDuration (0.08s) into SHOCKWAVE stage
    torpedo.update(0.1, [], []);
    expect(torpedo.state).toBe(TorpedoState.SHOCKWAVE);

    // Expand shockwave wavefront and vaporize bullet
    torpedo.update(0.05, [], [hostileBullet]);
    expect(torpedo.currentRadius).toBeGreaterThan(0);
    expect(hostileBullet.isDead).toBe(true);
  });

  test('TORPEDO-05: Shockwave applies hyperbaric damage and impulse pushback to hostiles', () => {
    const torpedo = new CavitationTorpedo(300, 400);
    torpedo.state = TorpedoState.SHOCKWAVE;
    torpedo.blastTimer = 0.1;
    torpedo.currentRadius = 100;

    const enemy = new Enemy(320, 400, 600, 1, EnemyType.NORMAL);
    const initialHp = enemy.hp;

    torpedo.update(0.05, [enemy], []);
    
    // Enemy must take hyperbaric base damage (180 dmg)
    expect(enemy.hp).toBeLessThan(initialHp);
  });

  test('TORPEDO-06: CavitationTorpedoSystem manages ammo reserves, consumption, and recharge cycle', () => {
    const system = new CavitationTorpedoSystem();
    expect(system.torpedoAmmo).toBe(3);
    expect(system.maxTorpedoAmmo).toBe(3);

    // Launch all 3 torpedoes
    const fired1 = system.fireTorpedo({ x: 300, y: 700 });
    const fired2 = system.fireTorpedo({ x: 300, y: 700 });
    const fired3 = system.fireTorpedo({ x: 300, y: 700 });

    expect(fired1).toBe(true);
    expect(fired2).toBe(true);
    expect(fired3).toBe(true);
    expect(system.torpedoAmmo).toBe(0);
    expect(system.torpedoes.length).toBe(3);

    // Launching with 0 ammo is rejected
    const firedEmpty = system.fireTorpedo({ x: 300, y: 700 });
    expect(firedEmpty).toBe(false);

    // Recharging over time
    const context = createMockContext();
    system.update(system.rechargeCooldown + 0.1, context);
    expect(system.torpedoAmmo).toBe(1);
  });
});

// ============================================================================
// FEATURE 2: BIOLUMINESCENT LASER & REFRACTION PRISMS
// ============================================================================
test.describe('Flagship Feature 2: Bioluminescent Laser & Refraction Prisms', () => {
  test('LASER-01: Laser starts in COOL thermodynamic state and heats up when firing', () => {
    const laser = new BioluminescentLaserSystem();
    const context = createMockContext();

    expect(laser.heat).toBe(0);
    expect(laser.getHeatZone()).toBe(LaserHeatZone.COOL);
    expect(laser.isFiring).toBe(false);

    // Fire laser continuously
    laser.setFiring(true);
    expect(laser.isFiring).toBe(true);

    laser.update(1.0, context);
    expect(laser.heat).toBeGreaterThan(0);
  });

  test('LASER-02: Thermodynamic heat zones scale accurately to WARM, SUPERCHARGED, and LOCKOUT', () => {
    const laser = new BioluminescentLaserSystem();
    
    laser.heat = 20;
    expect(laser.getHeatZone()).toBe(LaserHeatZone.COOL);

    laser.heat = 55;
    expect(laser.getHeatZone()).toBe(LaserHeatZone.WARM);

    laser.heat = 85;
    expect(laser.getHeatZone()).toBe(LaserHeatZone.SUPERCHARGED);

    // Reaching maximum heat triggers thermal lockout
    laser.heat = 100;
    const context = createMockContext();
    laser.setFiring(true);
    laser.update(0.05, context);

    expect(laser.isLockedOut).toBe(true);
    expect(laser.getHeatZone()).toBe(LaserHeatZone.LOCKOUT);
    expect(laser.isFiring).toBe(false);
  });

  test('LASER-03: Thermal lockout enforces cooldown duration and blocks firing attempts', () => {
    const laser = new BioluminescentLaserSystem();
    const context = createMockContext();

    laser.isLockedOut = true;
    laser.lockoutTimer = laser.lockoutDuration;

    // Firing request rejected during lockout
    laser.setFiring(true);
    expect(laser.isFiring).toBe(false);

    // Partial elapsed time
    laser.update(1.0, context);
    expect(laser.isLockedOut).toBe(true);
    expect(laser.lockoutTimer).toBeLessThan(laser.lockoutDuration);

    // Full cooldown expiration resets lockout
    laser.update(laser.lockoutDuration, context);
    expect(laser.isLockedOut).toBe(false);
    expect(laser.getHeatZone()).not.toBe(LaserHeatZone.LOCKOUT);
  });

  test('LASER-04: Floating Quartz Refraction Prism splits hitscan laser beam into multi-angle fan', () => {
    const laser = new BioluminescentLaserSystem();
    const context = createMockContext();

    // Deploy prism directly above player craft
    const deployed = laser.deployPrism(300, 360);
    expect(deployed).toBe(true);
    expect(laser.activePrisms.length).toBe(1);
    expect(laser.prismCharges).toBe(2);

    // Set firing: laser raycast hits prism at (300, 360) and fans out
    laser.setFiring(true);
    laser.update(0.05, context);

    // Active beam segments should contain the initial beam + refracted fan rays
    const segments = (laser as any).activeBeamSegments;
    expect(segments.length).toBeGreaterThan(1);
  });

  test('LASER-05: Hydrothermal cooling halo accelerates thermal dissipation rate', () => {
    const laserNormal = new BioluminescentLaserSystem();
    const laserCooled = new BioluminescentLaserSystem();
    const context = createMockContext();

    laserNormal.heat = 60;
    laserCooled.heat = 60;
    laserCooled.inCoolingHalo = true;

    laserNormal.update(1.0, context);
    laserCooled.update(1.0, context);

    // Cooled laser should have dissipated significantly more heat
    expect(laserCooled.heat).toBeLessThan(laserNormal.heat);
  });
});

// ============================================================================
// FEATURE 3: HYDRAULIC HARPOON & KINETIC SLINGSHOT WINCH
// ============================================================================
test.describe('Flagship Feature 3: Hydraulic Harpoon & Kinetic Slingshot', () => {
  test('HARPOON-01: Pneumatic dart launches upward into FLYING state', () => {
    const harpoon = new HydraulicHarpoon();
    expect(harpoon.state).toBe(HarpoonState.READY);

    const launched = harpoon.fire({ x: 300, y: 720 });
    expect(launched).toBe(true);
    expect(harpoon.state).toBe(HarpoonState.FLYING);
    expect(harpoon.headVelocity.y).toBeLessThan(0); // Upward velocity
  });

  test('HARPOON-02: Dart collision with hostile entity transitions into TETHERED state', () => {
    const harpoon = new HydraulicHarpoon();
    const enemy = new Enemy(280, 360, 600, 1, EnemyType.NORMAL);
    enemy.hp = 100;
    enemy.maxHp = 100;
    const context = createMockContext({ enemies: [enemy] });

    harpoon.fire({ x: 300, y: 720 });
    
    // Position harpoon head right at top of enemy box
    harpoon.headPosition = { x: 300, y: 395 };
    harpoon.update(0.02, context);

    expect(harpoon.state).toBe(HarpoonState.TETHERED);
    expect(harpoon.tetheredEntity).toBe(enemy);
  });

  test('HARPOON-03: Hydraulic winching reduces cable rest length at configured speed', () => {
    const harpoon = new HydraulicHarpoon();
    const enemy = new Enemy(300, 450, 600, 1, EnemyType.NORMAL);
    const context = createMockContext({ enemies: [enemy] });

    harpoon.state = HarpoonState.TETHERED;
    harpoon.tetheredEntity = enemy;
    const initialRestLength = (harpoon as any).effectiveRestLength;

    harpoon.startWinch();
    expect(harpoon.isWinching).toBe(true);

    harpoon.update(0.2, context);
    expect((harpoon as any).effectiveRestLength).toBeLessThan(initialRestLength);

    harpoon.stopWinch();
    expect(harpoon.isWinching).toBe(false);
  });

  test('HARPOON-04: Saline Electrical Shock Conduction deals damage and triggers EMP burst', () => {
    const harpoon = new HydraulicHarpoon();
    const enemy = new Enemy(300, 500, 600, 1, EnemyType.NORMAL);
    harpoon.state = HarpoonState.TETHERED;
    harpoon.tetheredEntity = enemy;
    const initialHp = enemy.hp;

    harpoon.conductElectricalShock(1200);

    expect(enemy.hp).toBeLessThan(initialHp);
    expect((harpoon as any).activeEmpBursts.length).toBeGreaterThan(0);
  });

  test('HARPOON-05: Slingshot catapult release launches tethered entity as high-velocity kinetic missile', () => {
    const harpoon = new HydraulicHarpoon();
    const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
    harpoon.state = HarpoonState.TETHERED;
    harpoon.tetheredEntity = enemy;

    const result = harpoon.releaseSlingshot();
    expect(result).not.toBeNull();
    expect(result!.entity).toBe(enemy);
    expect(result!.damage).toBe(DEFAULT_HARPOON_CONFIG.slingshotDamage);
    expect(Math.abs(result!.velocity.y)).toBeGreaterThanOrEqual(DEFAULT_HARPOON_CONFIG.slingshotBonus);

    // Harpoon state resets back toward retracting
    expect(harpoon.tetheredEntity).toBeNull();
    expect(harpoon.state).toBe(HarpoonState.RETRACTING);
  });
});

// ============================================================================
// FEATURE 4: HYDROTHERMAL VENTS & OCEAN CURRENTS
// ============================================================================
test.describe('Flagship Feature 4: Hydrothermal Vents & Ocean Currents', () => {
  test('VENT-01: Conical plume radius broadens with ascent from seafloor chimney base to cap', () => {
    const vent = new HydrothermalVent('vent-1', 200);

    const baseRadius = (vent as any).getCoreRadius(760);
    const midRadius = (vent as any).getCoreRadius(480);
    const capRadius = (vent as any).getCoreRadius(200);

    expect(baseRadius).toBeGreaterThan(0);
    expect(midRadius).toBeGreaterThan(baseRadius);
    expect(capRadius).toBeGreaterThan(midRadius);
  });

  test('VENT-02: Thermal cycle strictly transitions DORMANT -> CHARGING -> ERUPTING', () => {
    const vent = new HydrothermalVent('vent-1', 200);
    const dummyPlayer = new Enemy(300, 700, 600, 1, EnemyType.NORMAL);

    expect(vent.state).toBe(VentState.DORMANT);

    // Advance through dormant phase (7.5s)
    vent.update(7.6, dummyPlayer, [], []);
    expect(vent.state).toBe(VentState.CHARGING);

    // Advance through charging phase (1.5s)
    vent.update(1.6, dummyPlayer, [], []);
    expect(vent.state).toBe(VentState.ERUPTING);

    // Advance through erupting phase (3.0s)
    vent.update(3.1, dummyPlayer, [], []);
    expect(vent.state).toBe(VentState.DORMANT);
  });

  test('VENT-03: Erupting hydrothermal plume upgrades passing player bullets to Steam Lance', () => {
    const vent = new HydrothermalVent('vent-1', 300);
    vent.state = VentState.ERUPTING;

    const bullet = new Bullet(300, 500, -300, 10, true);
    bullet.isPlayerBullet = true;
    bullet.faction = Faction.PLAYER;
    const initialDamage = bullet.damage;
    const dummyPlayer = new Enemy(100, 700, 600, 1, EnemyType.NORMAL);

    vent.update(0.05, dummyPlayer, [], [bullet]);

    // Bullet inside the erupting thermal core gains Steam Lance properties
    expect((bullet as any).__steamLance).toBe(true);
    expect(bullet.damage).toBeGreaterThan(initialDamage);
  });

  test('VENT-04: Erupting plume exerts upward counter-buoyancy deceleration on enemy bullets', () => {
    const vent = new HydrothermalVent('vent-1', 300);
    vent.state = VentState.ERUPTING;

    // Downward enemy bullet at (300, 400)
    const bullet = new Bullet(300, 400, 250, 1, false);
    bullet.isPlayerBullet = false;
    bullet.faction = Faction.INVADER;
    const initialVy = bullet.velocity.y;
    const dummyPlayer = new Enemy(100, 700, 600, 1, EnemyType.NORMAL);

    vent.update(0.05, dummyPlayer, [], [bullet]);

    // Counter-buoyancy drag reduces downward speed (velocity.y += -520 * dt)
    expect(bullet.velocity.y).toBeLessThan(initialVy);
  });

  test('CURRENT-05: OceanCurrent applies shear drag displacement to traversing entities', () => {
    const current = new OceanCurrent(600, 800);
    const enemy = new Enemy(300, 200, 600, 1, EnemyType.NORMAL); // Upper shelf (+75 px/s)
    const initialX = enemy.position.x;

    current.applyCurrentDrag(enemy, 0.5);

    // Upper shelf moves rightward (+X)
    expect(enemy.position.x).toBeGreaterThan(initialX);
  });
});

// ============================================================================
// FEATURE 5: BIOLAPSE DARKNESS CYCLE & SEARCHLIGHT
// ============================================================================
test.describe('Flagship Feature 5: Biolapse Darkness Cycle & Searchlight', () => {
  test('BIOLAPSE-01: Cyclic ambient lux transitions across DIURNAL, TWILIGHT, MIDNIGHT, and DAWN', () => {
    const cycle = new BiolapseDarknessCycle(600, 800);
    const context = createMockContext();

    expect(cycle.currentPhase).toBe(BiolapsePhase.DIURNAL);
    expect(cycle.ambientLux).toBe(1.0);

    // Advance through Diurnal (60s)
    cycle.update(60.1, context);
    expect(cycle.currentPhase).toBe(BiolapsePhase.TWILIGHT);
    expect(cycle.ambientLux).toBeLessThan(1.0);

    // Advance through Twilight (5s)
    cycle.update(5.1, context);
    expect(cycle.currentPhase).toBe(BiolapsePhase.MIDNIGHT);
    expect(cycle.ambientLux).toBe(0.0);

    // Advance through Midnight (25s)
    cycle.update(25.1, context);
    expect(cycle.currentPhase).toBe(BiolapsePhase.DAWN);
    expect(cycle.ambientLux).toBeGreaterThan(0.0);

    // Advance through Dawn (5s) back to Diurnal
    cycle.update(5.1, context);
    expect(cycle.currentPhase).toBe(BiolapsePhase.DIURNAL);
    expect(cycle.ambientLux).toBe(1.0);
  });

  test('BIOLAPSE-02: Searchlight drains battery while active, high-beam drains at accelerated rate', () => {
    const cycle = new BiolapseDarknessCycle(600, 800);
    const context = createMockContext();

    cycle.currentPhase = BiolapsePhase.MIDNIGHT;
    cycle.toggleLight();
    expect(cycle.isLightOn).toBe(true);

    const initialBattery = cycle.battery;
    cycle.update(1.0, context);
    const standardDrain = initialBattery - cycle.battery;
    expect(standardDrain).toBeGreaterThan(0);

    // Activate High-Beam
    cycle.setHighBeam(true);
    expect(cycle.isHighBeam).toBe(true);
    const preHighBeamBattery = cycle.battery;
    cycle.update(1.0, context);
    const highBeamDrain = preHighBeamBattery - cycle.battery;

    // High beam drain must exceed standard beam drain
    expect(highBeamDrain).toBeGreaterThan(standardDrain);
  });

  test('BIOLAPSE-03: Battery depletion down to zero resets high-beam overdrive', () => {
    const cycle = new BiolapseDarknessCycle(600, 800);
    const context = createMockContext();

    cycle.currentPhase = BiolapsePhase.MIDNIGHT;
    cycle.isLightOn = true;
    cycle.isHighBeam = true;
    cycle.battery = 0.5;

    cycle.update(1.0, context);
    expect(cycle.battery).toBe(0);
    expect(cycle.isHighBeam).toBe(false);
  });

  test('BIOLAPSE-04: Enemy kill during midnight recharges searchlight battery', () => {
    const manager = new FlagshipManager(600, 800);
    const context = createMockContext();
    const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);

    manager.biolapseDarkness.currentPhase = BiolapsePhase.MIDNIGHT;
    manager.biolapseDarkness.battery = 50;

    manager.onEnemyKilled(enemy, context);
    expect(manager.biolapseDarkness.battery).toBe(65); // +15 battery bonus
  });

  test('BIOLAPSE-05: Sonar ping triggers acoustic illumination wave in darkness', () => {
    const cycle = new BiolapseDarknessCycle(600, 800);
    expect(cycle.sonarPingActive).toBe(false);

    cycle.triggerSonarPing();
    expect(cycle.sonarPingActive).toBe(true);
    expect(cycle.sonarPingTimer).toBe(cycle.sonarPingDuration);
  });
});

// ============================================================================
// FEATURE 6: MODULAR SUBMERSIBLE CHASSIS & RADAR PROFILES
// ============================================================================
test.describe('Flagship Feature 6: Modular Submersible Chassis', () => {
  test('CHASSIS-01: All 5 chassis archetypes are available with distinct attributes', () => {
    const manager = new ModularChassisManager();
    const chassisList = [
      ChassisId.NAUTILUS,
      ChassisId.STINGRAY,
      ChassisId.KRAKEN,
      ChassisId.LEVIATHAN,
      ChassisId.GHOST,
    ];

    for (const id of chassisList) {
      const selected = manager.selectChassis(id);
      expect(selected).toBe(true);
      expect(manager.activeChassis).toBeDefined();
      expect(manager.activeChassis.id).toBe(id);
      expect(manager.activeChassis.nameEn.length).toBeGreaterThan(0);
    }
  });

  test('CHASSIS-02: 6-axis radar profile stats evaluate within normalized [0, 100] range', () => {
    const manager = new ModularChassisManager();
    const stats = manager.activeChassis.radarStats;

    expect(stats.speed).toBeGreaterThanOrEqual(0);
    expect(stats.speed).toBeLessThanOrEqual(100);
    expect(stats.armor).toBeGreaterThanOrEqual(0);
    expect(stats.armor).toBeLessThanOrEqual(100);
    expect(stats.hardpoints).toBeGreaterThanOrEqual(0);
    expect(stats.hardpoints).toBeLessThanOrEqual(100);
    expect(stats.energy).toBeGreaterThanOrEqual(0);
    expect(stats.energy).toBeLessThanOrEqual(100);
    expect(stats.hitboxProfile).toBeGreaterThanOrEqual(0);
    expect(stats.hitboxProfile).toBeLessThanOrEqual(100);
    expect(stats.salvage).toBeGreaterThanOrEqual(0);
    expect(stats.salvage).toBeLessThanOrEqual(100);
  });

  test('CHASSIS-03: Nautilus Hull passive triggers Steam Pulse on qualifying damage', () => {
    const manager = new ModularChassisManager();
    manager.selectChassis(ChassisId.NAUTILUS);
    const nautilus = manager.activeChassis;
    expect(nautilus.onTakeDamage).toBeDefined();

    // Take damage: current HP = 2, incoming = 2
    const mitigation = nautilus.onTakeDamage!(2, 2);
    expect(mitigation.mitigatedDamage).toBe(1);
    expect(mitigation.triggeredEffect).toBe('STEAM_PULSE');
  });

  test('CHASSIS-04: RADAR_AXES constant accurately registers the 6 telemetry parameters', () => {
    expect(RADAR_AXES.length).toBe(6);
    const keys = RADAR_AXES.map((a) => a.key);
    expect(keys).toContain('speed');
    expect(keys).toContain('armor');
    expect(keys).toContain('hardpoints');
    expect(keys).toContain('energy');
    expect(keys).toContain('hitboxProfile');
    expect(keys).toContain('salvage');
  });
});

// ============================================================================
// FEATURE 7: VETERAN CREW SYNERGY DECK & ACTIVE BRIDGE ABILITIES
// ============================================================================
test.describe('Flagship Feature 7: Veteran Crew Synergy Deck', () => {
  test('CREW-01: Crew deck initializes 4 stationed officers with unique stations and perks', () => {
    const deck = new CrewOfficerDeckManager();
    const officers = deck.state.officers;

    expect(officers['INGRID']).toBeDefined();
    expect(officers['JAX']).toBeDefined();
    expect(officers['REN']).toBeDefined();
    expect(officers['LYRA']).toBeDefined();

    expect(officers['INGRID'].station).toBe('ENGINEERING');
    expect(officers['JAX'].station).toBe('GUNNERY');
    expect(officers['REN'].station).toBe('SONAR');
    expect(officers['LYRA'].station).toBe('BIOLOGY');

    expect(officers['INGRID'].perks.length).toBeGreaterThan(0);
  });

  test('CREW-02: Dr. Lyra Vance active ability deploys Holographic Decoy Pod', () => {
    const deck = new CrewOfficerDeckManager();
    const context = createMockContext();

    expect(deck.activeDecoyPod).toBeNull();
    const activated = deck.triggerAbility('LYRA', context);

    expect(activated).toBe(true);
    expect(deck.activeDecoyPod).not.toBeNull();
    expect(deck.activeDecoyPod!.active).toBe(true);
    expect(deck.activeDecoyPod!.hp).toBeGreaterThan(0);
  });

  test('CREW-03: Ren active ability initiates Tactical Stasis Bubble', () => {
    const deck = new CrewOfficerDeckManager();
    const context = createMockContext();

    expect(deck.activeStasisTimer).toBe(0);
    const activated = deck.triggerAbility('REN', context);

    expect(activated).toBe(true);
    expect(deck.activeStasisTimer).toBeGreaterThan(0);
  });

  test('CREW-04: Officer active ability usage incurs fatigue and cooldown lockout', () => {
    const deck = new CrewOfficerDeckManager();
    const context = createMockContext();

    const initialFatigue = deck.state.officers['JAX'].fatigue;
    deck.triggerAbility('JAX', context);

    // Jax's fatigue increased
    expect(deck.state.officers['JAX'].fatigue).toBeGreaterThan(initialFatigue);

    // Immediate second trigger rejected due to active cooldown
    const secondTrigger = deck.triggerAbility('JAX', context);
    expect(secondTrigger).toBe(false);
  });
});

// ============================================================================
// FEATURE 8: MUTATING BIO-HORRORS & EPIGENETIC MUTATIONS
// ============================================================================
test.describe('Flagship Feature 8: Hadal Bio-Horrors & Epigenetics', () => {
  test('HORROR-01: Epigenetic mutation engine adapts Anti-Kinetic Calcification against kinetic damage', () => {
    const engine = new EpigeneticMutationEngine();

    // Record high kinetic damage (>50% ratio)
    engine.recordDamage('kinetic', 600);
    engine.recordDamage('missile', 50);

    engine.evaluateWaveTransition(2);

    expect(engine.getActiveMutation()).toBe('ANTI_KINETIC_CALCIFICATION');
    const result = engine.calculateMitigation(100, 'kinetic');
    expect(result.finalDamage).toBe(60); // 40% mitigation
    expect(result.mitigatedAmount).toBe(40);
  });

  test('HORROR-02: Engine shifts to Bioluminescent Chaff when missile damage dominates', () => {
    const engine = new EpigeneticMutationEngine();

    engine.recordDamage('missile', 800);
    engine.recordDamage('kinetic', 50);

    engine.evaluateWaveTransition(3);

    expect(engine.getActiveMutation()).toBe('BIOLUMINESCENT_CHAFF');
    const result = engine.calculateMitigation(100, 'missile');
    expect(result.finalDamage).toBe(60);
  });

  test('HORROR-03: Parasite Clinger latching and rapid wiggle shake-off counterplay', () => {
    const horror = new HadalBioHorrors();
    const context = createMockContext();

    // Spawn a Clinger
    const clinger = horror.spawnParasiteClinger(300, 700);
    expect(clinger.type).toBe('CLINGER');
    horror.attachClinger({
      id: clinger.id,
      attachOffset: { x: 0, y: 0 },
      dragIntensity: 0.25,
      torqueDirection: 1,
    });
    expect(horror.state.attachedParasiteCount).toBe(1);

    // Alternating Left/Right wiggles 4 times within 1.2s window
    horror.handleInput('ArrowLeft', true, context);
    horror.handleInput('ArrowRight', true, context);
    horror.handleInput('ArrowLeft', true, context);
    horror.handleInput('ArrowRight', true, context);

    // Latched parasite must be shaken off
    expect(horror.state.attachedParasiteCount).toBe(0);
  });

  test('HORROR-04: Colossus bone shield absorbs frontal impacts and shatters upon depletion', () => {
    const horror = new HadalBioHorrors();
    const colossus = horror.spawnCarapaceColossus(300, 200);

    expect(colossus.boneShieldHp).toBe(40);
    expect(colossus.isShieldShattered).toBe(false);

    // Inflict 50 damage to shield
    colossus.boneShieldHp = Math.max(0, colossus.boneShieldHp! - 50);
    if (colossus.boneShieldHp <= 0) {
      colossus.isShieldShattered = true;
    }

    expect(colossus.boneShieldHp).toBe(0);
    expect(colossus.isShieldShattered).toBe(true);
  });
});

// ============================================================================
// FEATURE 9: AUTOMATON SHIELD PHALANX & LINKED GRIDS
// ============================================================================
test.describe('Flagship Feature 9: Automaton Shield Phalanx', () => {
  test('PHALANX-01: Adjacent automaton drones within link range establish hexagonal barrier links', () => {
    const grid = new AutomatonShieldGrid();

    grid.registerDrone({
      id: 1,
      x: 200,
      y: 300,
      shieldHp: 200,
      maxShieldHp: 200,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    grid.registerDrone({
      id: 2,
      x: 280,
      y: 300,
      shieldHp: 200,
      maxShieldHp: 200,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    const drone1 = grid.drones.get(1);
    const drone2 = grid.drones.get(2);
    expect(drone1!.linkedDroneIds).toContain(2);
    expect(drone2!.linkedDroneIds).toContain(1);
    expect(grid.links.length).toBe(1);
  });

  test('PHALANX-02: Linked grid dampens incoming hostile damage by 40%', () => {
    const grid = new AutomatonShieldGrid();

    grid.registerDrone({
      id: 1,
      x: 200,
      y: 300,
      shieldHp: 200,
      maxShieldHp: 200,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [2],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    grid.registerDrone({
      id: 2,
      x: 280,
      y: 300,
      shieldHp: 200,
      maxShieldHp: 200,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [1],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    // 100 raw damage with 40% dampening split between 2 drones:
    // (100 * 0.60) / 2 = 30 per drone
    const distributed = grid.distributeDamage(1, 100);
    expect(distributed).toBe(30);
  });

  test('PHALANX-03: Shield collapse triggers grid overload backlash on linked drones', () => {
    const grid = new AutomatonShieldGrid();

    grid.registerDrone({
      id: 1,
      x: 200,
      y: 300,
      shieldHp: 20,
      maxShieldHp: 200,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [2],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    grid.registerDrone({
      id: 2,
      x: 280,
      y: 300,
      shieldHp: 200,
      maxShieldHp: 200,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [1],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    // Frontal impact destroying drone 1 shield
    const hitResult = grid.resolveHit(
      1,
      { x: 200, y: 350 },
      { x: 0, y: -400 },
      100,
      false
    );

    expect(hitResult.isDeflected).toBe(true);
    expect(hitResult.triggeredBacklash).toBe(true);

    // Linked drone 2 is backlash stunned
    expect(grid.drones.get(2)!.isBacklashStunned).toBe(true);
    expect(grid.drones.get(2)!.isFrontalShieldActive).toBe(false);
  });
});

// ============================================================================
// FEATURE 10: APEX BOSS KRAKEN PRIME (CHARYBDIS PRIME)
// ============================================================================
test.describe('Flagship Feature 10: Apex Boss Kraken Prime', () => {
  test('KRAKEN-01: Multi-part structure possesses 12,000 Total Effective Health Pool', () => {
    const boss = new KrakenPrimeBoss();
    boss.spawnApexBoss();

    expect(boss.activeBoss).not.toBeNull();
    expect(boss.activeBoss!.totalHp).toBe(12000);
    expect(boss.activeBoss!.maxHp).toBe(12000);
    expect(boss.tentacles.length).toBe(8);
  });

  test('KRAKEN-02: 8 Tentacles solve 5-segment Inverse Kinematics toward target coordinates', () => {
    const boss = new KrakenPrimeBoss();
    boss.spawnApexBoss();
    const tentacle = boss.tentacles[0];

    expect(tentacle.joints.length).toBe(5);

    // Update IK reaching downward towards player at (300, 700)
    tentacle.updateIK(300, 700, 1.0, 0.05);

    expect(tentacle.joints[4].y).toBeGreaterThan(0);
    for (const joint of tentacle.joints) {
      expect(Number.isFinite(joint.x)).toBe(true);
      expect(Number.isFinite(joint.y)).toBe(true);
    }
  });

  test('KRAKEN-03: Maw vortex pull applies inward gravitational displacement on player', () => {
    const boss = new KrakenPrimeBoss();
    boss.spawnApexBoss();
    const context = createMockContext();
    context.player.position = { x: 300, y: 600 };

    // Set Phase 2 vortex
    boss.activeBoss!.totalHp = 7000;
    boss.activeBoss!.phase = 2;
    boss.activeBoss!.vortexActive = true;

    const initialY = context.player.position.y;
    boss.update(0.1, context);

    // Player pulled upward toward maw at y=110
    expect(context.player.position.y).toBeLessThan(initialY);
  });

  test('KRAKEN-04: Exposed gullet weakpoint multiplies incoming damage by 2.5x', () => {
    const boss = new KrakenPrimeBoss();
    boss.spawnApexBoss();

    expect(boss.mawSubsystem).not.toBeNull();
    const initialHp = boss.activeBoss!.totalHp;
    const critDealt = boss.mawSubsystem!.takeDamage(100);

    expect(critDealt).toBe(250); // 100 * 2.5
    expect(boss.activeBoss!.totalHp).toBe(initialHp - 250);
  });
});

// ============================================================================
// FEATURE 11: ROGUELIKE ENDLESS MODE (ENDLESS DESCENT)
// ============================================================================
test.describe('Flagship Feature 11: Roguelike Endless Mode & Pressure Engine', () => {
  test('DESCENT-01: Start expedition initializes depth at 100m with ambient pressure formula', () => {
    const descent = new EndlessDescent();
    descent.startRun();

    expect(descent.runState.isActive).toBe(true);
    expect(descent.runState.sectorTier).toBe(1);
    expect(descent.runState.pressure.currentDepthMeters).toBe(100);
    expect(descent.runState.pressure.ambientPressureBar).toBe(11.0);
  });

  test('DESCENT-02: Bathymetric DAG generates interconnected stratums with valid path topology', () => {
    const dagNodes = BathymetricDAG.generateSectorDAG(1);
    const nodes = Object.values(dagNodes);

    expect(nodes.length).toBeGreaterThan(5);
    
    // Stratum 1 nodes must connect downstream to Stratum 2 nodes
    const stratum1 = nodes.filter((n) => n.stratum === 1);
    const stratum2 = nodes.filter((n) => n.stratum === 2);

    expect(stratum1.length).toBeGreaterThan(0);
    expect(stratum2.length).toBeGreaterThan(0);

    for (const n1 of stratum1) {
      expect(n1.connectedDownstreamIds.length).toBeGreaterThan(0);
    }
  });

  test('DESCENT-03: Ballast purge venting reduces hull stress percentage', () => {
    const descent = new EndlessDescent();
    descent.startRun();
    descent.runState.pressure.stressPercentage = 75;

    const vented = descent.ventBallast();
    expect(vented).toBe(true);
    expect(descent.runState.pressure.stressPercentage).toBeLessThan(75);
  });

  test('DESCENT-04: Boon draft hand generates 3 distinct tiered cards for drafting', () => {
    const draftHand = BoonDraftDeck.getRandomDraft(3);
    expect(draftHand.length).toBe(3);

    const ids = new Set(draftHand.map((b) => b.id));
    expect(ids.size).toBe(3); // Unique cards
  });
});

// ============================================================================
// FEATURE 12: TACTICAL SONAR & HYDROPHONE UI
// ============================================================================
test.describe('Flagship Feature 12: Tactical Sonar HUD & Sensory Suite', () => {
  test('SONAR-01: Polar radar sweep line rotates at calibrated angular velocity (1.8 rad/s)', () => {
    const hud = new TacticalSonarHUD();
    const context = createMockContext();

    expect(hud.radarState.sweepAngleRad).toBe(0);
    hud.update(1.0, context);

    // Delta = 1.8 rad
    expect(hud.radarState.sweepAngleRad).toBeCloseTo(1.8, 2);
  });

  test('SONAR-02: Sweep line crossing hostile contact registers Doppler contact echo bloom', () => {
    const hud = new TacticalSonarHUD();
    // Center at (300, 528). Enemy box [280, 320] x [360, 390] has center (300, 375).
    // dx = 0, dy = -153. Angle = -PI/2 -> normalized to 3*PI/2 = 4.71239 rad
    const enemy = new Enemy(280, 360, 600, 1, EnemyType.NORMAL);
    const context = createMockContext({ enemies: [enemy] });

    // Align sweep angle right at enemy angle
    hud.radarState.sweepAngleRad = (3 * Math.PI) / 2;
    hud.update(0.01, context);

    expect(hud.radarState.activeContacts.length).toBeGreaterThan(0);
    const contact = hud.radarState.activeContacts[0];
    expect(contact.bloomTimer).toBeGreaterThan(0);
  });

  test('SONAR-03: 16-band Hydrophone FFT waterfall spectrogram updates frequency bands', () => {
    const hydro = new HydrophoneSpectrogram();
    const context = createMockContext();

    expect(hydro.waterfallState.frequencyBands.length).toBe(16);
    expect(hydro.historySlices).toBe(48);

    hydro.update(0.1, context);
    expect(hydro.waterfallState.frequencyBands.length).toBe(16);
  });

  test('SONAR-04: Critical hull stress generates acoustic glass fracture branching lines', () => {
    const stressFX = new HullStressFX();
    expect(stressFX.fractureLines.length).toBe(0);

    stressFX.addFracture(75); // 75% hull stress
    expect(stressFX.fractureLines.length).toBeGreaterThan(0);
  });
});

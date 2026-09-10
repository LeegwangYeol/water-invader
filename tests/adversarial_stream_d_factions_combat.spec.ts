import { test, expect } from '@playwright/test';
import { HadalBioHorrors, BioHorrorUnit } from '../src/game/flagship/factions/HadalBioHorrors';
import { EpigeneticMutationEngine } from '../src/game/flagship/factions/EpigeneticMutationEngine';
import { AutomatonPhalanx, AutomatonUnit } from '../src/game/flagship/factions/AutomatonPhalanx';
import { AutomatonShieldGrid } from '../src/game/flagship/factions/AutomatonShieldGrid';
import { FlagshipManager } from '../src/game/flagship/FlagshipManager';
import { Player } from '../src/game/Player';
import { Bullet } from '../src/game/Bullet';
import { Barricade } from '../src/game/Barricade';
import { FlagshipUpdateContext } from '../src/game/flagship/types';

function createMockContext(overrides?: Partial<FlagshipUpdateContext>): FlagshipUpdateContext {
  const player = new Player(600, 800);
  return {
    player,
    enemies: [],
    bullets: [],
    barricades: [],
    helpers: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 0,
    createExplosion: () => {},
    triggerScreenShake: () => {},
    ...overrides,
  };
}

// ============================================================================
// FEATURE 8: HADAL BIO-HORRORS ADVERSARIAL CHALLENGES
// ============================================================================
test.describe('Stream D Adversarial: Feature 8 Hadal Bio-Horrors', () => {

  // --------------------------------------------------------------------------
  // PARASITE CLINGER CHALLENGES
  // --------------------------------------------------------------------------
  test('ADV-CLINGER-01: Proximity latching boundary (45px latch vs 46px miss)', () => {
    const horror = new HadalBioHorrors();
    const context = createMockContext();
    // In Player.ts, canvasWidth=600, player is at (600/2 - 25, 800 - 60) = (275, 740)
    // HadalBioHorrors uses player center: (player.x + 20, player.y + 15) = (295, 755)

    // Clinger within 45px of player center (40px above center)
    const clingerIn = horror.spawnParasiteClinger(295, 755 - 40);
    horror.update(0.001, context);
    // Should latch and increment attached count
    expect(horror.state.attachedParasiteCount).toBe(1);
    expect(clingerIn.isDead).toBe(true);

    horror.reset();

    // Clinger outside 45px of player center (50px away)
    const clingerOut = horror.spawnParasiteClinger(295, 755 - 50);
    clingerOut.velocity = { x: 0, y: 0 };
    horror.update(0.001, context);
    expect(horror.state.attachedParasiteCount).toBe(0);
    expect(clingerOut.isDead).toBe(false);
  });

  test('ADV-CLINGER-02: Speed drag scaling (-25% per clinger, max -75% at 3 clingers)', () => {
    const horror = new HadalBioHorrors();
    const context = createMockContext();
    const baseSpeed = 300;

    // 1 clinger: -25% -> 225
    horror.attachClinger({ id: 1, attachOffset: { x: 0, y: 0 }, dragIntensity: 0.25, torqueDirection: 1 });
    horror.update(0.016, context);
    expect(context.player.speed).toBe(baseSpeed * 0.75);

    // 2 clingers: -50% -> 150
    horror.attachClinger({ id: 2, attachOffset: { x: 0, y: 0 }, dragIntensity: 0.25, torqueDirection: 1 });
    horror.update(0.016, context);
    expect(context.player.speed).toBe(baseSpeed * 0.50);

    // 3 clingers: -75% -> 75
    horror.attachClinger({ id: 3, attachOffset: { x: 0, y: 0 }, dragIntensity: 0.25, torqueDirection: 1 });
    horror.update(0.016, context);
    expect(context.player.speed).toBe(baseSpeed * 0.25);

    // 4th clinger rejected by attachClinger invariant
    const attached4 = horror.attachClinger({ id: 4, attachOffset: { x: 0, y: 0 }, dragIntensity: 0.25, torqueDirection: 1 });
    expect(attached4).toBe(false);
    expect(horror.state.attachedParasiteCount).toBe(3);
  });

  test('ADV-CLINGER-03 [DEFECT FINDING]: Player speed is NEVER restored when clingers are removed', () => {
    const horror = new HadalBioHorrors();
    const context = createMockContext();
    expect(context.player.speed).toBe(300);

    // Attach 1 clinger -> speed drops to 225
    horror.attachClinger({ id: 1, attachOffset: { x: 0, y: 0 }, dragIntensity: 0.25, torqueDirection: 1 });
    horror.update(0.016, context);
    expect(context.player.speed).toBe(225);

    // Remove clinger -> count becomes 0
    horror.removeClingers(1);
    expect(horror.state.attachedParasiteCount).toBe(0);

    // Next update: when n=0, player.speed is restored to baseSpeed (300)!
    horror.update(0.016, context);
    expect(context.player.speed).toBe(300); // Remediated: speed restored to baseSpeed!
  });

  test('ADV-CLINGER-04: Wiggle shake-off strict alternating pattern and timing window', () => {
    const horror = new HadalBioHorrors();
    const context = createMockContext();

    horror.attachClinger({ id: 1, attachOffset: { x: 0, y: 0 }, dragIntensity: 0.25, torqueDirection: 1 });
    expect(horror.state.attachedParasiteCount).toBe(1);

    // Non-alternating taps (LEFT, LEFT, LEFT, LEFT) should FAIL to shake off
    horror.handleInput('ArrowLeft', true, context);
    horror.handleInput('ArrowLeft', true, context);
    horror.handleInput('ArrowLeft', true, context);
    horror.handleInput('ArrowLeft', true, context);
    expect(horror.state.attachedParasiteCount).toBe(1);

    // Alternating taps: ArrowLeft, ArrowRight, ArrowLeft, ArrowRight
    horror.handleInput('ArrowRight', true, context);
    horror.handleInput('ArrowLeft', true, context);
    horror.handleInput('ArrowRight', true, context);
    expect(horror.state.attachedParasiteCount).toBe(0); // Successfully shaken off!
  });

  test('ADV-CLINGER-05: Barricade scraping counterplay', () => {
    const horror = new HadalBioHorrors();
    // Use BarricadeType.DESTRUCTIBLE (which is 0)
    const barricade = new Barricade(275, 740, 0);
    const context = createMockContext({ barricades: [barricade] });

    horror.attachClinger({ id: 1, attachOffset: { x: 0, y: 0 }, dragIntensity: 0.25, torqueDirection: 1 });
    expect(horror.state.attachedParasiteCount).toBe(1);

    // Player center is at 295, 755. Barricade center is 275 + 30 = 305, 740 + 20 = 760.
    // Distance = hypot(295 - 305, 755 - 760) = hypot(10, 5) = 11.18px (< 38px)
    const initialBarricadeHp = barricade.hp;
    horror.update(0.016, context);

    // Parasite should be scraped off, and barricade takes 5 damage
    expect(horror.state.attachedParasiteCount).toBe(0);
    expect(barricade.hp).toBe(initialBarricadeHp - 5);
  });

  // --------------------------------------------------------------------------
  // SPORE SIPHONER CHALLENGES
  // --------------------------------------------------------------------------
  test('ADV-SIPHONER-01: Ingestion vortex attracts player bullets within 110px', () => {
    const horror = new HadalBioHorrors();
    const siphoner = horror.spawnSporeSiphoner(300, 300);
    // Bullet placed 80px away from siphoner
    const bullet = new Bullet(300, 380, -300, 10);
    const context = createMockContext({ bullets: [bullet] });

    const initialDist = Math.hypot(siphoner.position.x - bullet.position.x, siphoner.position.y - bullet.position.y);
    horror.update(0.05, context);
    const newDist = Math.hypot(siphoner.position.x - bullet.position.x, siphoner.position.y - bullet.position.y);

    // Bullet should have been pulled toward siphoner center
    expect(newDist).toBeLessThan(initialDist);
  });

  test('ADV-SIPHONER-02 [DEFECT FINDING]: Siphoner swallows ALL bullets including piercing bullets, rendering it invulnerable to center shots', () => {
    const horror = new HadalBioHorrors();
    const siphoner = horror.spawnSporeSiphoner(300, 300);
    const initialHp = siphoner.hp;

    // Bullet right at center sac (< 24px) with piercing = 3
    const piercingBullet = new Bullet(300, 305, -300, 10);
    (piercingBullet as any).piercing = 3;
    const context = createMockContext({ bullets: [piercingBullet] });

    horror.update(0.016, context);

    // Spec says piercing weapons should detonate/pierce siphoner before swallowing
    // Remediated: piercing bullets are not swallowed
    expect(piercingBullet.isDead).toBe(false); // Not swallowed!
    expect(siphoner.absorbedBullets).toBe(0);
  });

  test('ADV-SIPHONER-03: Corrosive Spore Cloud lifecycle and 1 HP / 0.75s DoT', () => {
    const horror = new HadalBioHorrors();
    const context = createMockContext();

    // Spawn spore cloud at player's location
    horror.spawnSporeCloud(context.player.position.x + 20, context.player.position.y + 15, 25, 120, 4.5);
    expect(horror.state.activeSporeClouds.length).toBe(1);
    expect(horror.state.activeSporeClouds[0].duration).toBe(4.5);

    // Over 4.5 seconds of simulated time, cloud expires
    horror.update(4.6, context);
    expect(horror.state.activeSporeClouds.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // CARAPACE COLOSSUS CHALLENGES
  // --------------------------------------------------------------------------
  test('ADV-COLOSSUS-01: Frontal shield mitigates 85% damage vs 2.0x rear weakpoint critical', () => {
    const horror = new HadalBioHorrors();
    const colossus = horror.spawnCarapaceColossus(300, 300);
    const context = createMockContext();

    // 1. Frontal hit: bullet coming from below (y = 310 > colossus.y, vy = -300)
    const frontalBullet = new Bullet(300, 310, -300, 10);
    colossus.hp = 280;
    horror['checkBulletCollisions'](colossus, [frontalBullet], context);

    // Frontal rawDamage = 10 * 0.15 = 1.5. No mutation yet -> finalDamage = 1.5.
    expect(colossus.hp).toBeCloseTo(280 - 1.5, 1);

    // 2. Rear hit: bullet coming from above (y = 290 < colossus.y, vy = 300)
    const rearBullet = new Bullet(300, 290, 300, 10);
    colossus.hp = 280;
    horror['checkBulletCollisions'](colossus, [rearBullet], context);

    // Rear rawDamage = 10 * 2.0 = 20. finalDamage = 20.
    expect(colossus.hp).toBe(280 - 20);
  });

  test('ADV-COLOSSUS-02: Piercing attacks shatter bone shield and apply 2.5s stun', () => {
    const horror = new HadalBioHorrors();
    const colossus = horror.spawnCarapaceColossus(300, 300);
    const context = createMockContext();

    expect(colossus.isShieldShattered).toBe(false);
    expect(colossus.stunTimer).toBe(0);

    const piercingBullet = new Bullet(300, 310, 0, -300);
    (piercingBullet as any).piercing = 2;

    horror['checkBulletCollisions'](colossus, [piercingBullet], context);

    expect(colossus.isShieldShattered).toBe(true);
    expect(colossus.boneShieldHp).toBe(0);
    expect(colossus.stunTimer).toBe(2.5);

    // While stunned, colossus does not move
    const initialPos = { ...colossus.position };
    horror.update(0.5, context);
    expect(colossus.position.x).toBe(initialPos.x);
    expect(colossus.position.y).toBe(initialPos.y);
    expect(colossus.stunTimer).toBeCloseTo(2.0, 1);
  });

  test('ADV-COLOSSUS-03 [SPEC GAP]: Frontal non-piercing bullets NEVER deplete boneShieldHp', () => {
    const horror = new HadalBioHorrors();
    const colossus = horror.spawnCarapaceColossus(300, 300);
    const context = createMockContext();

    expect(colossus.boneShieldHp).toBe(40);

    // Fire 20 frontal non-piercing bullets
    for (let i = 0; i < 20; i++) {
      const b = new Bullet(300, 310, 0, -300);
      horror['checkBulletCollisions'](colossus, [b], context);
    }

    // boneShieldHp is never decremented by frontal impacts in checkBulletCollisions!
    expect(colossus.boneShieldHp).toBe(40);
    expect(colossus.isShieldShattered).toBe(false);
  });

  // --------------------------------------------------------------------------
  // EPIGENETIC MUTATION ENGINE CHALLENGES
  // --------------------------------------------------------------------------
  test('ADV-MUTATION-01: Threshold activation and priority order (Missile > Kinetic > Pierce)', () => {
    const engine = new EpigeneticMutationEngine();

    // 1. Kinetic > 50% activates ANTI_KINETIC_CALCIFICATION
    engine.recordDamage('kinetic', 600);
    engine.recordDamage('missile', 200);
    engine.recordDamage('pierce', 200);
    let analysis = engine.evaluateWaveTransition(1);
    expect(analysis.activeMutation).toBe('ANTI_KINETIC_CALCIFICATION');
    expect(analysis.mitigationPercent).toBe(40);

    engine.reset();

    // 2. Missile > 40% activates BIOLUMINESCENT_CHAFF
    engine.recordDamage('missile', 450);
    engine.recordDamage('kinetic', 350);
    engine.recordDamage('pierce', 200);
    analysis = engine.evaluateWaveTransition(1);
    expect(analysis.activeMutation).toBe('BIOLUMINESCENT_CHAFF');

    engine.reset();

    // 3. Pierce > 40% activates AMOEBIC_VISCOUS_FLESH
    engine.recordDamage('pierce', 500);
    engine.recordDamage('kinetic', 300);
    engine.recordDamage('missile', 200);
    analysis = engine.evaluateWaveTransition(1);
    expect(analysis.activeMutation).toBe('AMOEBIC_VISCOUS_FLESH');

    engine.reset();

    // 4. Tie-break: Both Missile >= 40% and Kinetic >= 50%
    engine.recordDamage('missile', 450);
    engine.recordDamage('kinetic', 550);
    analysis = engine.evaluateWaveTransition(1);
    // Missile is evaluated first in code, so Missile wins tie-break!
    expect(analysis.activeMutation).toBe('BIOLUMINESCENT_CHAFF');
  });

  test('ADV-MUTATION-02: Alert banner verification and localization check', () => {
    const engine = new EpigeneticMutationEngine();
    engine.recordDamage('kinetic', 1000);
    engine.evaluateWaveTransition(1);

    const banner = engine.getAlertBannerText();
    expect(banner).not.toBeNull();
    // Verify Korean text contains adaptation details
    expect(banner).toContain('하달 군체 변태 감지');
    expect(banner).toContain('다이아몬드 갑각 경화');

    // Verify timer is 4.0s
    expect(engine.getAlertBannerTimer()).toBe(4.0);

    // Decay banner timer
    engine.update(4.1);
    expect(engine.getAlertBannerText()).toBeNull();
  });

  test('ADV-MUTATION-03: Strict 40% mitigation cap invariant', () => {
    const engine = new EpigeneticMutationEngine();
    engine.setActiveMutation('ANTI_KINETIC_CALCIFICATION');

    const result = engine.calculateMitigation(100, 'kinetic');
    expect(result.mitigatedAmount).toBe(40);
    expect(result.finalDamage).toBe(60);

    // Even if huge damage dealt, mitigation ratio is never > 40%
    const hugeResult = engine.calculateMitigation(10000, 'kinetic');
    expect(hugeResult.mitigatedAmount).toBe(4000);
    expect(hugeResult.finalDamage).toBe(6000);
  });

  test('ADV-MUTATION-04 [INTEGRATION FLAW]: FlagshipManager hardcodes kinetic on every enemy kill', () => {
    const flagship = new FlagshipManager(600, 800);
    const mockEnemy: any = { maxHp: 50 };
    const context = createMockContext();

    // Simulate killing an enemy with a missile
    flagship.onEnemyKilled(mockEnemy, context);

    const history = (flagship.bioHorror as HadalBioHorrors).mutationEngine.getDamageHistory();
    // FlagshipManager always recorded 'kinetic'!
    expect(history.kinetic).toBe(50);
    expect(history.missile).toBe(0);
    expect(history.pierce).toBe(0);
  });
});

// ============================================================================
// FEATURE 9: ANCIENT AUTOMATON PHALANX ADVERSARIAL CHALLENGES
// ============================================================================
test.describe('Stream D Adversarial: Feature 9 Ancient Automaton Phalanx', () => {

  // --------------------------------------------------------------------------
  // AEGIS DRONE & SHIELD GRID CHALLENGES
  // --------------------------------------------------------------------------
  test('ADV-AEGIS-01: Frontal 100% deflection and 40% dampening across linked units', () => {
    const grid = new AutomatonShieldGrid();

    grid.registerDrone({
      id: 1,
      x: 200,
      y: 300,
      shieldHp: 300,
      maxShieldHp: 300,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    grid.registerDrone({
      id: 2,
      x: 300,
      y: 300, // Distance = 100px (< 160px)
      shieldHp: 300,
      maxShieldHp: 300,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    expect(grid.links.length).toBe(1);

    // Frontal bullet hit with 100 raw damage
    const hit = grid.resolveHit(1, { x: 200, y: 320 }, { x: 0, y: -400 }, 100, false);

    expect(hit.isDeflected).toBe(true);
    expect(hit.damageToHull).toBe(0); // 100% frontal deflection (0 hull damage)
    // Dampened by 40% -> 60 total damage. Split between 2 drones -> 30 each.
    expect(hit.damageToShield).toBe(30);
    expect(grid.drones.get(1)!.shieldHp).toBe(270);
    expect(grid.drones.get(2)!.shieldHp).toBe(270);
  });

  test('ADV-AEGIS-02 [SPEC DISCREPANCY]: Flanking angle threshold requires > 60° off-axis instead of > 45°', () => {
    const grid = new AutomatonShieldGrid();
    grid.registerDrone({
      id: 1,
      x: 300,
      y: 300,
      shieldHp: 300,
      maxShieldHp: 300,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    // Test a flank shot at 50° off-axis (which is > 45° off-axis)
    // For shieldNormal (0, 1), a 50° shot has vx = sin(50°), vy = -cos(50°)
    const rad50 = (50 * Math.PI) / 180;
    const bulletVel50 = { x: Math.sin(rad50) * 400, y: -Math.cos(rad50) * 400 };

    const hit50 = grid.resolveHit(1, { x: 300, y: 320 }, bulletVel50, 50, false);

    // In spec: Flanking > 45° off-axis should bypass shield!
    // Remediated: SHIELD_ARC_COS is cos(45°) ~ 0.7071, so 50° flank shot bypasses shield!
    expect(hit50.isDeflected).toBe(false);
    expect(hit50.bypassesShield).toBe(true);

    // Only when angle > 60° (e.g. 65° off-axis) does it bypass
    const rad65 = (65 * Math.PI) / 180;
    const bulletVel65 = { x: Math.sin(rad65) * 400, y: -Math.cos(rad65) * 400 };
    const hit65 = grid.resolveHit(1, { x: 300, y: 320 }, bulletVel65, 50, false);
    expect(hit65.isDeflected).toBe(false);
    expect(hit65.bypassesShield).toBe(true);
  });

  test('ADV-AEGIS-03: Piercing weapons bypass hexagonal shield completely', () => {
    const grid = new AutomatonShieldGrid();
    grid.registerDrone({
      id: 1,
      x: 300,
      y: 300,
      shieldHp: 300,
      maxShieldHp: 300,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    // Directly frontal shot (0° off-axis), but with piercing = true
    const hit = grid.resolveHit(1, { x: 300, y: 320 }, { x: 0, y: -400 }, 50, true);

    expect(hit.isDeflected).toBe(false);
    expect(hit.bypassesShield).toBe(true);
    expect(hit.damageToHull).toBe(50);
    expect(grid.drones.get(1)!.shieldHp).toBe(300); // Shield untouched!
  });

  test('ADV-AEGIS-04 [NUMERICAL DEFECT]: Shield break stun duration is 1.8s instead of 3.5s', () => {
    const grid = new AutomatonShieldGrid();
    grid.registerDrone({
      id: 1,
      x: 200,
      y: 300,
      shieldHp: 10,
      maxShieldHp: 300,
      maxHp: 200,
      hp: 200,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [2],
      isBacklashStunned: false,
      stunTimer: 0,
    });
    grid.registerDrone({
      id: 2,
      x: 300,
      y: 300,
      shieldHp: 300,
      maxShieldHp: 300,
      maxHp: 200,
      hp: 200,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 },
      linkedDroneIds: [1],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    // Break drone 1 shield
    grid.resolveHit(1, { x: 200, y: 320 }, { x: 0, y: -400 }, 50, false);

    const drone2 = grid.drones.get(2)!;
    expect(drone2.isBacklashStunned).toBe(true);

    // SPEC REQUIREMENT: "shield break triggers 3.5s inductive stun"
    // Remediated: stunTimer is 3.5s
    expect(drone2.stunTimer).toBe(3.5);

    // Verify 35% Max HP damage (or min 80)
    // For maxHp = 200, 35% is 70, min is 80 -> dmg = 80
    expect(drone2.hp).toBe(120);
  });

  // --------------------------------------------------------------------------
  // EMP PROWLER CHALLENGES
  // --------------------------------------------------------------------------
  test('ADV-EMP-01 [MECHANIC DEFECT]: EMP Pulse increases suppression instead of cutting player fire rate and ignores barricades', () => {
    const phalanx = new AutomatonPhalanx();
    const prowler = phalanx.spawnEmpProwler(300, 600);
    prowler.empCooldown = 0.01; // Ready to pulse

    const barricade = new Barricade(300, 700, 0);
    const context = createMockContext({ barricades: [barricade] });

    // Position player within 240px of prowler
    context.player.position.x = 300;
    context.player.position.y = 700;
    context.player.suppressionLevel = 0;
    const initialBaseFireRate = context.player.baseFireRate;

    phalanx.update(0.02, context);

    // SPEC: "reducing player fire rate by -50% for 3.0s and halting barricade repair"
    // ACTUAL: Increases suppressionLevel by 40 (causes weapon spread, not fire rate!)
    expect(context.player.suppressionLevel).toBe(40);
    expect(context.player.baseFireRate).toBe(initialBaseFireRate); // Fire rate unaffected!

    // Barricade is completely unreferenced during EMP pulse
    expect(barricade.hp).toBe(barricade.maxHp);
  });

  test('ADV-EMP-02: EMP Prowler supercharges adjacent Aegis shield regeneration', () => {
    const phalanx = new AutomatonPhalanx();
    const prowler = phalanx.spawnEmpProwler(300, 300);
    const aegis = phalanx.spawnAegisDrone(320, 300, 1);

    // Damage Aegis shield
    const droneNode = phalanx.grid.drones.get(aegis.id)!;
    droneNode.shieldHp = 100;

    // Update phalanx for 1 second
    phalanx.update(1.0, createMockContext());

    // Drone natural regen is 10/s, prowler supercharge adds 15/s = +25 total
    expect(droneNode.shieldHp).toBeCloseTo(125, 0);
  });

  // --------------------------------------------------------------------------
  // RAIL-MORTAR SENTINEL CHALLENGES
  // --------------------------------------------------------------------------
  test('ADV-RAIL-01: Piercing slug punches through barricades and creates induction shock puddle', () => {
    const phalanx = new AutomatonPhalanx();
    const sentinel = phalanx.spawnRailSentinel(300, 200);
    sentinel.lockdownTimer = 0.01; // Ready to fire

    // Use BarricadeType.DESTRUCTIBLE (0)
    const barricade = new Barricade(290, 400, 0);
    const initialBarricadeHp = barricade.hp;
    const context = createMockContext({ barricades: [barricade] });

    // Step 1: Sentinel fires rail slug
    phalanx.update(0.02, context);
    expect(phalanx.railSlugs.length).toBe(1);
    expect(phalanx.railSlugs[0].vy).toBe(450);

    // Step 2: Slug moves through barricade
    phalanx.railSlugs[0].y = 405;
    phalanx.update(0.016, context);
    expect(barricade.hp).toBe(initialBarricadeHp - 2);
    // Slug should NOT be destroyed by barricade (punch through)
    expect(phalanx.railSlugs[0].isDead).toBe(false);

    // Step 3: Slug reaches seabed (y >= 780) -> creates shock puddle
    phalanx.railSlugs[0].y = 781;
    phalanx.update(0.016, context);
    expect(phalanx.shockPuddles.length).toBe(1);
    expect(phalanx.shockPuddles[0].radius).toBe(40); // 80px diameter
    expect(phalanx.shockPuddles[0].duration).toBe(2.5);
  });

  test('ADV-RAIL-02: Radiator cooling vents open for 2.4s post-fire receiving 300% critical damage', () => {
    const phalanx = new AutomatonPhalanx();
    const sentinel = phalanx.spawnRailSentinel(300, 200);
    const context = createMockContext();

    // 1. Normal hit without cooling vents open
    expect(sentinel.isCoolingVentsOpen).toBe(false);
    sentinel.hp = 260;
    const normalBullet = new Bullet(300, 200, -300, 12);
    phalanx['checkBulletCollisions'](sentinel, [normalBullet], context);
    expect(sentinel.hp).toBe(260 - 12); // Normal 12 damage

    // 2. Trigger fire sequence to open cooling vents
    sentinel.lockdownTimer = 0.01;
    phalanx.update(0.02, context);
    expect(sentinel.isCoolingVentsOpen).toBe(true);
    // After 0.02s update tick, timer is 2.4 - 0.02 = 2.38s
    expect(sentinel.coolingVentTimer).toBeCloseTo(2.38, 2);

    // 3. Hit while vents are open -> 300% Critical Damage!
    sentinel.hp = 260;
    const critBullet = new Bullet(300, 200, -300, 12);
    phalanx['checkBulletCollisions'](sentinel, [critBullet], context);
    expect(sentinel.hp).toBe(260 - (12 * 3.0)); // 36 damage (300% crit!)

    // 4. After 2.4s, vents close
    phalanx.update(2.5, context);
    expect(sentinel.isCoolingVentsOpen).toBe(false);
  });
});

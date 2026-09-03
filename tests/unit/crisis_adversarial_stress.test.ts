import { test, expect } from '@playwright/test';
import {
  CrisisArchetype,
  CrisisPhase,
  Faction,
} from '../../src/game/types';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { Bullet } from '../../src/game/Bullet';
import { Player } from '../../src/game/Player';
import { Particle } from '../../src/game/Particle';

/**
 * Mock Canvas 2D Context for stress testing draw routines under edge inputs
 */
function createMockCanvasContext(): CanvasRenderingContext2D {
  const ctx: any = {
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    ellipse: () => {},
    quadraticCurveTo: () => {},
    bezierCurveTo: () => {},
    rect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    createRadialGradient: () => ({
      addColorStop: () => {},
    }),
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1.0,
    font: '10px sans-serif',
    textAlign: 'left',
  };
  return ctx as CanvasRenderingContext2D;
}

test.describe('Empirical Adversarial Stress Test Suite: End-Game Crisis (M1)', () => {

  // =========================================================================
  // 1. DIMENSIONAL RIFT ADVERSARIAL STRESS TESTS
  // =========================================================================

  test('ST-R1: DimensionalRift under Extreme DeltaTimes and 10,000 Rapid Updates', () => {
    const rift = new DimensionalRift(100, 150, 0, 600);
    rift.setSovereignTarget({ x: 300, y: 150 });

    // Rapid 10,000 micro-step updates
    for (let i = 0; i < 10000; i++) {
      rift.update(0.001);
    }
    expect(Number.isFinite(rift.position.x)).toBe(true);
    expect(Number.isFinite(rift.position.y)).toBe(true);
    expect(Number.isFinite(rift.accretionDiskAngle)).toBe(true);
    expect(Number.isFinite(rift.pulsePhase)).toBe(true);

    // DeltaTime = 0
    const prevX = rift.position.x;
    rift.update(0);
    expect(rift.position.x).toBe(prevX);

    // Extreme DeltaTime Spike (1000.0s frame drop)
    rift.update(1000.0);
    expect(Number.isFinite(rift.position.x)).toBe(true);
    expect(Number.isFinite(rift.position.y)).toBe(true);

    // Negative DeltaTime
    rift.update(-5.0);
    expect(Number.isFinite(rift.position.x)).toBe(true);

    // Micro DeltaTime (1e-9)
    rift.update(1e-9);
    expect(Number.isFinite(rift.position.x)).toBe(true);
  });

  test('ST-R2: DimensionalRift Damage Boundaries, Overkill & Zero/Negative Amounts', () => {
    const rift = new DimensionalRift(100, 100, 0, 600);

    // Zero damage
    const dmg0 = rift.takeDamage(0);
    expect(dmg0).toBe(0);
    expect(rift.hp).toBe(600);
    expect(rift.isDead).toBe(false);

    // Normal damage
    const dmg1 = rift.takeDamage(250);
    expect(dmg1).toBe(250);
    expect(rift.hp).toBe(350);

    // Overkill damage (exceeding remaining HP)
    const dmgOverkill = rift.takeDamage(99999);
    expect(dmgOverkill).toBe(350); // Capped at remaining HP
    expect(rift.hp).toBe(0);
    expect(rift.isDead).toBe(true);

    // Damage after death
    const dmgPostDeath = rift.takeDamage(100);
    expect(dmgPostDeath).toBe(0);
    expect(rift.hp).toBe(0);

    // Damage when invulnerable
    const riftInv = new DimensionalRift(100, 100, 1, 600);
    riftInv.isInvulnerable = true;
    const dmgInv = riftInv.takeDamage(100);
    expect(dmgInv).toBe(0);
    expect(riftInv.hp).toBe(600);
  });

  test('ST-R3: DimensionalRift Vector Draw Resilience with Degenerate Conduit Vectors', () => {
    const ctx = createMockCanvasContext();
    const rift = new DimensionalRift(100, 100, 0, 600);

    // Draw with no target
    expect(() => rift.draw(ctx)).not.toThrow();

    // Draw with target at exact same coordinates (dist = 0, dx=0, dy=0)
    rift.setSovereignTarget(rift.getSingularityCenter());
    expect(() => rift.draw(ctx)).not.toThrow();

    // Draw with target at infinity
    rift.setSovereignTarget({ x: 1e9, y: 1e9 });
    expect(() => rift.draw(ctx)).not.toThrow();

    // Draw with flash timer active
    rift.flashTimer = 0.08;
    expect(() => rift.draw(ctx)).not.toThrow();

    // Draw when dead
    rift.isDead = true;
    expect(() => rift.draw(ctx)).not.toThrow();
  });

  // =========================================================================
  // 2. CRISIS SOVEREIGN ADVERSARIAL STRESS TESTS
  // =========================================================================

  test('ST-S1: CrisisSovereign Rapid Updates, Extreme DeltaTimes & Degenerate Player Positions', () => {
    const sov = new CrisisSovereign(170, 70, CrisisArchetype.VOID_SOVEREIGN, 2500, 1500);

    // 10,000 rapid updates in Phase 2
    sov.setPhase(CrisisPhase.PHASE_2_HULL);
    for (let i = 0; i < 10000; i++) {
      sov.update(0.001, { x: 300 + Math.sin(i), y: 700 });
    }
    expect(Number.isFinite(sov.position.x)).toBe(true);
    expect(Number.isFinite(sov.position.y)).toBe(true);
    expect(Number.isFinite(sov.eyeAngle)).toBe(true);

    // Player position exactly at core center (atan2(0, 0))
    const core = sov.getCoreCenter();
    sov.update(0.016, { x: core.x, y: core.y });
    expect(Number.isFinite(sov.eyeAngle)).toBe(true);

    // Player position at extreme coordinates (+-10,000,000)
    sov.update(0.016, { x: 1e7, y: -1e7 });
    expect(Number.isFinite(sov.eyeAngle)).toBe(true);

    // Missing player position
    sov.update(0.016, undefined);
    expect(Number.isFinite(sov.position.x)).toBe(true);

    // Extreme DeltaTimes: 0, 500s, -1s
    sov.update(0);
    sov.update(500.0);
    sov.update(-1.0);
    expect(Number.isFinite(sov.position.x)).toBe(true);
    expect(Number.isFinite(sov.position.y)).toBe(true);
  });

  test('ST-S2: CrisisSovereign Phase 1 Invulnerability & Multi-Phase Damage Gating', () => {
    const sov = new CrisisSovereign(170, 70, CrisisArchetype.VOID_SOVEREIGN, 2500, 1500);

    // 1. INCURSION Phase: Damage must be completely ignored
    sov.setPhase(CrisisPhase.INCURSION);
    expect(sov.takeDamage(1000)).toBe(0);
    expect(sov.hullHp).toBe(2500);
    expect(sov.coreHp).toBe(1500);
    expect(sov.hp).toBe(4000);

    // 2. PHASE 1 (SHIELD): Must deflect 100% of damage
    sov.setPhase(CrisisPhase.PHASE_1_SHIELD);
    expect(sov.isInvulnerable).toBe(true);
    for (let d = 1; d <= 5000; d += 500) {
      expect(sov.takeDamage(d)).toBe(0);
      expect(sov.hullHp).toBe(2500);
      expect(sov.coreHp).toBe(1500);
    }
    expect(sov.shieldFlashTimer).toBeGreaterThan(0);

    // 3. PHASE 2 (HULL): Hull absorbs damage; does NOT bleed over into Core in one hit
    sov.setPhase(CrisisPhase.PHASE_2_HULL);
    expect(sov.isInvulnerable).toBe(false);

    // Hit with 1,000 damage
    expect(sov.takeDamage(1000)).toBe(1000);
    expect(sov.hullHp).toBe(1500);
    expect(sov.coreHp).toBe(1500);
    expect(sov.hp).toBe(3000);

    // Hit with massive 50,000 damage - should break Hull (1,500) and trigger Phase 3 without damaging Core
    const breakHullDmg = sov.takeDamage(50000);
    expect(breakHullDmg).toBe(1500); // Only takes the remaining 1500 hull HP
    expect(sov.hullHp).toBe(0);
    expect(sov.coreHp).toBe(1500); // Core remains intact at full 1500 HP!
    expect(sov.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(sov.isInvulnerable).toBe(false);

    // 4. PHASE 3 (CORE): Core absorbs damage
    expect(sov.takeDamage(500)).toBe(500);
    expect(sov.coreHp).toBe(1000);
    expect(sov.hp).toBe(1000);

    // Massive hit kills Core
    expect(sov.takeDamage(9999)).toBe(1000);
    expect(sov.coreHp).toBe(0);
    expect(sov.hp).toBe(0);
    expect(sov.phase).toBe(CrisisPhase.DEFEATED);
    expect(sov.isDead).toBe(true);

    // 5. DEFEATED Phase: Damage must be 0
    expect(sov.takeDamage(500)).toBe(0);
  });

  test('ST-S3: Phase 3 Enrage Countdown & Reality Distortion Surge', () => {
    const sov = new CrisisSovereign(170, 70, CrisisArchetype.CYBERNETIC_EXTERMINATOR, 2500, 1500);
    sov.setPhase(CrisisPhase.PHASE_3_CORE);

    expect(sov.enrageTimer).toBe(35.0);
    expect(sov.realityDistortionLevel).toBe(0);

    // Advance 20 seconds
    sov.update(20.0, { x: 300, y: 700 });
    expect(sov.enrageTimer).toBeCloseTo(15.0, 1);
    expect(sov.realityDistortionLevel).toBe(0);

    // Advance past 35s enrage limit
    sov.update(20.0, { x: 300, y: 700 });
    expect(sov.enrageTimer).toBe(0);
    expect(sov.realityDistortionLevel).toBe(1.0); // Enrage triggered!
  });

  test('ST-S4: CrisisSovereign HUD & Vector Draw Under Edge Canvas Widths', () => {
    const ctx = createMockCanvasContext();
    const sov = new CrisisSovereign(170, 70, CrisisArchetype.ABYSSAL_LEVIATHAN, 2500, 1500);

    // Screen widths: normal, ultra-wide, narrow, zero
    for (const w of [600, 1920, 3840, 200, 50, 0]) {
      expect(() => sov.drawBossHUD(ctx, w)).not.toThrow();
    }

    // All archetypes drawing in all phases
    for (const arch of [
      CrisisArchetype.VOID_SOVEREIGN,
      CrisisArchetype.ABYSSAL_LEVIATHAN,
      CrisisArchetype.CYBERNETIC_EXTERMINATOR,
    ]) {
      sov.archetype = arch;
      for (const p of [
        CrisisPhase.INCURSION,
        CrisisPhase.PHASE_1_SHIELD,
        CrisisPhase.PHASE_2_HULL,
        CrisisPhase.PHASE_3_CORE,
        CrisisPhase.DEFEATED,
      ]) {
        sov.setPhase(p);
        sov.flashTimer = 0.08;
        sov.shieldFlashTimer = 0.12;
        expect(() => sov.draw(ctx)).not.toThrow();
      }
    }
  });

  // =========================================================================
  // 3. END-GAME CRISIS COORDINATOR INTEGRATION & STRESS TESTS
  // =========================================================================

  test('ST-C1: 10,000 Frame Full Loop Simulation with High Particle/Bullet Counts', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);

    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    // Pre-populate with 200 bullets and 300 particles
    for (let i = 0; i < 200; i++) {
      bullets.push(new Bullet(100 + (i % 400), 200 + (i % 400), -300, 10, true));
    }
    for (let i = 0; i < 300; i++) {
      particles.push(new Particle(200, 200, '#ffffff', 1.0));
    }

    // Run 10,000 updates at 60fps (deltaTime = 0.0166)
    for (let f = 0; f < 10000; f++) {
      crisis.update(0.0166, player, bullets, particles);
    }

    expect(crisis.isCrisisActive()).toBe(true);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
    expect(Number.isFinite(player.position.x)).toBe(true);
    expect(Number.isFinite(player.position.y)).toBe(true);
  });

  test('ST-C2: Strict Phase 1 Damage Absorption & Invulnerability Verification', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    crisis.update(3.1, new Player(600, 800), [], []); // Finish incursion -> Phase 1

    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
    expect(crisis.sovereign!.isInvulnerable).toBe(true);

    const sov = crisis.sovereign!;
    const [riftLeft, riftRight] = crisis.riftAnchors;

    // Direct bullet hit on Sovereign in Phase 1
    const bSov = new Bullet(sov.position.x + 50, sov.position.y + 50, -400, 500, true);
    const hitSov = crisis.handleBulletCollision(bSov);
    expect(hitSov).toBe(true);
    expect(bSov.isDead).toBe(true);
    expect(sov.hullHp).toBe(2500); // 0 damage dealt!
    expect(sov.coreHp).toBe(1500);
    expect(sov.shieldFlashTimer).toBeGreaterThan(0);

    // Destroy Rift Left (600 HP)
    const bRiftL = new Bullet(riftLeft.position.x + 10, riftLeft.position.y + 10, -400, 600, true);
    crisis.handleBulletCollision(bRiftL);
    expect(riftLeft.isDead).toBe(true);

    // Update coordinator with 1 rift remaining (processes rift destruction and clears isShielding)
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(riftLeft.isShielding).toBe(false);
    // Sovereign MUST STILL BE INVULNERABLE in Phase 1!
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
    expect(sov.isInvulnerable).toBe(true);

    // Try attacking Sovereign again while Rift Right (600 HP) is still alive (1000 barrage hits)
    for (let h = 0; h < 1000; h++) {
      const bSovLoop = new Bullet(sov.position.x + 50, sov.position.y + 50, -400, 999, true);
      crisis.handleBulletCollision(bSovLoop);
    }
    expect(sov.hullHp).toBe(2500); // Still 100% immune!

    // Deal partial damage to Rift Right (300 / 600 HP remaining)
    const bRiftR1 = new Bullet(riftRight.position.x + 10, riftRight.position.y + 10, -400, 300, true);
    crisis.handleBulletCollision(bRiftR1);
    expect(riftRight.hp).toBe(300);
    expect(riftRight.isDead).toBe(false);

    // Sovereign STILL immune with 1 HP or partial HP on last rift
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
    expect(sov.isInvulnerable).toBe(true);

    // Destroy Rift Right (remaining 300 HP)
    const bRiftR2 = new Bullet(riftRight.position.x + 10, riftRight.position.y + 10, -400, 300, true);
    crisis.handleBulletCollision(bRiftR2);
    expect(riftRight.isDead).toBe(true);

    // Now update coordinator -> Transitions to Phase 2 (HULL)!
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);
    expect(sov.isInvulnerable).toBe(false);

    // Now Sovereign Hull takes damage!
    const bSov3 = new Bullet(sov.position.x + 50, sov.position.y + 50, -400, 400, true);
    crisis.handleBulletCollision(bSov3);
    expect(sov.hullHp).toBe(2100);
  });

  test('ST-C3: Gravitational Pull & Bullet Bending Extreme Edge Distances', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    crisis.update(3.1, new Player(600, 800), [], []);

    const player = new Player(600, 800);
    const rift = crisis.riftAnchors[0];
    const riftCenter = rift.getSingularityCenter();

    // 1. Player exactly on rift center (distance = 0)
    player.position.x = riftCenter.x - player.size.width / 2;
    player.position.y = riftCenter.y - player.size.height / 2;
    // Should not throw division by zero due to distSq > 100 guard
    expect(() => crisis.update(0.1, player, [], [])).not.toThrow();
    expect(Number.isFinite(player.position.x)).toBe(true);

    // 2. Player very far outside gravitational radius (dist = 10,000)
    player.position.x = 10000;
    player.position.y = 10000;
    crisis.update(0.1, player, [], []);
    expect(player.position.x).toBe(10000); // Unmoved

    // 3. Bullets: enemy bullets vs player bullets
    const playerBullet = new Bullet(riftCenter.x + 50, riftCenter.y + 50, -300, 10, true);
    const enemyBullet = new Bullet(riftCenter.x + 50, riftCenter.y + 50, 300, 10, false);
    const bullets = [playerBullet, enemyBullet];

    const initialEBX = enemyBullet.position.x;
    crisis.update(0.1, player, bullets, []);

    // Player bullet bent towards rift
    expect(playerBullet.position.x).toBeLessThan(riftCenter.x + 50);
    // Enemy bullet NOT affected by gravity
    expect(enemyBullet.position.x).toBe(initialEBX);
  });

  test('ST-C4: Superweapons & Attack Patterns for All 3 Archetypes without Exception', () => {
    const player = new Player(600, 800);

    for (const arch of [
      CrisisArchetype.VOID_SOVEREIGN,
      CrisisArchetype.ABYSSAL_LEVIATHAN,
      CrisisArchetype.CYBERNETIC_EXTERMINATOR,
    ]) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);
      crisis.update(3.1, player, [], []); // Enter Phase 1

      const bullets: Bullet[] = [];
      const particles: Particle[] = [];

      // Force attack execution by advancing beyond attack cooldown (2.5s)
      crisis.update(2.5, player, bullets, particles);

      // Verify bullets spawned
      expect(bullets.length).toBeGreaterThan(0);
      for (const b of bullets) {
        expect(Number.isFinite(b.position.x)).toBe(true);
        expect(Number.isFinite(b.position.y)).toBe(true);
        expect(Number.isFinite(b.velocity.x)).toBe(true);
        expect(Number.isFinite(b.velocity.y)).toBe(true);
        expect(b.faction).toBe(Faction.INVADER);
      }
    }
  });

  test('ST-C5: High Piercing Projectile Penetration & Score Multipliers', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    crisis.update(3.1, new Player(600, 800), [], []);

    // Create a piercing bullet (piercing = 3)
    const rift = crisis.riftAnchors[0];
    const piercingBullet = new Bullet(rift.position.x + 10, rift.position.y + 10, -400, 100, true);
    piercingBullet.piercing = 3;

    let scoreAdded = 0;
    const hit = crisis.handleBulletCollision(piercingBullet, (pts) => {
      scoreAdded += pts;
    });

    expect(hit).toBe(true);
    // Bullet should not be dead since piercing > 1
    expect(piercingBullet.isDead).toBe(false);
    expect(piercingBullet.hitEntities.has(rift)).toBe(true);
    expect(scoreAdded).toBe(1000); // 100 dmg * 10 = 1000 score
  });

  test('ST-C6: Full Cataclysm Lifecycle End-to-End under High DPS Simulation', () => {
    const crisis = new EndGameCrisis(600, 800);
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    let phaseTransitions: CrisisPhase[] = [];
    crisis.callbacks.onPhaseChange = (phase) => {
      phaseTransitions.push(phase);
    };

    let defeatedArchetype: CrisisArchetype | null = null;
    crisis.callbacks.onDefeated = (arch) => {
      defeatedArchetype = arch;
    };

    // 1. Incursion Trigger
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    expect(crisis.phase).toBe(CrisisPhase.INCURSION);

    // 2. Incursion Warning (3.0s)
    crisis.update(3.1, player, bullets, particles);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    // 3. Destroy Rift 0 (600 HP) and Rift 1 (600 HP)
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, player, bullets, particles);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    // 4. Destroy Hull (2,500 HP)
    crisis.sovereign!.takeDamage(2500);
    crisis.update(0.016, player, bullets, particles);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

    // 5. Destroy Core (1,500 HP)
    crisis.sovereign!.takeDamage(1500);
    crisis.update(0.016, player, bullets, particles);
    expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
    expect(crisis.isDefeated()).toBe(true);
    expect(defeatedArchetype).toBe(CrisisArchetype.VOID_SOVEREIGN);

    // Check phase transition sequence
    expect(phaseTransitions).toContain(CrisisPhase.PHASE_1_SHIELD);
    expect(phaseTransitions).toContain(CrisisPhase.PHASE_2_HULL);
    expect(phaseTransitions).toContain(CrisisPhase.PHASE_3_CORE);
    expect(phaseTransitions).toContain(CrisisPhase.DEFEATED);

    // Check cataclysm explosion particles spawned
    expect(particles.length).toBeGreaterThanOrEqual(40);
  });

  test('ST-C7: Non-Player Bullet and Dead Bullet Collision Rejection', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    crisis.update(3.1, new Player(600, 800), [], []);

    const sov = crisis.sovereign!;

    // 1. Invader Bullet
    const invaderBullet = new Bullet(sov.position.x + 50, sov.position.y + 50, 400, 50, false);
    invaderBullet.faction = Faction.INVADER;
    expect(crisis.handleBulletCollision(invaderBullet)).toBe(false);

    // 2. Rogue Bullet
    const rogueBullet = new Bullet(sov.position.x + 50, sov.position.y + 50, 400, 50, false);
    rogueBullet.faction = Faction.ROGUE;
    expect(crisis.handleBulletCollision(rogueBullet)).toBe(false);

    // 3. Dead Player Bullet
    const deadBullet = new Bullet(sov.position.x + 50, sov.position.y + 50, -400, 50, true);
    deadBullet.isDead = true;
    expect(crisis.handleBulletCollision(deadBullet)).toBe(false);
  });

  test('ST-C8: EndGameCrisis State Snapshot Integrity Across All Phases', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);

    // Incursion
    let state = crisis.getState();
    expect(state.isActive).toBe(true);
    expect(state.phase).toBe(CrisisPhase.INCURSION);
    expect(state.shieldIntegrity).toBe(0);
    expect(state.maxHp).toBe(4000);
    expect(state.totalHp).toBe(4000);

    // Phase 1 (Shield)
    crisis.update(3.1, new Player(600, 800), [], []);
    state = crisis.getState();
    expect(state.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
    expect(state.shieldIntegrity).toBe(1.0);

    // Phase 2 (Hull)
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, new Player(600, 800), [], []);
    state = crisis.getState();
    expect(state.phase).toBe(CrisisPhase.PHASE_2_HULL);
    expect(state.shieldIntegrity).toBe(0);

    // Phase 3 (Core)
    crisis.sovereign!.takeDamage(2500);
    crisis.update(0.016, new Player(600, 800), [], []);
    state = crisis.getState();
    expect(state.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(state.totalHp).toBe(1500);

    // Defeated
    crisis.sovereign!.takeDamage(1500);
    crisis.update(0.016, new Player(600, 800), [], []);
    state = crisis.getState();
    expect(state.phase).toBe(CrisisPhase.DEFEATED);
    expect(state.totalHp).toBe(0);
    expect(state.isActive).toBe(false);
  });
});

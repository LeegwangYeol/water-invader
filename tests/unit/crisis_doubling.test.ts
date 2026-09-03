import { test, expect } from '@playwright/test';
import {
  CrisisArchetype,
  CrisisPhase,
  CrisisAttackType,
  CRISIS_ARCHETYPE_CONFIGS,
  Faction,
} from '../../src/game/types';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { Bullet } from '../../src/game/Bullet';
import { Player } from '../../src/game/Player';
import { Particle } from '../../src/game/Particle';

/**
 * Mock Canvas 2D Context for verifying vector draw logic headlessly
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
    roundRect: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    setLineDash: () => {},
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

test.describe('Crisis Doubling Suite: 6 Distinct Archetypes & Bespoke Mechanics', () => {

  // =========================================================================
  // 1. CRISIS COUNT DOUBLED CONTRACT VERIFICATION
  // =========================================================================
  test('DOUBLE-01: End-Game Crisis Archetype enum count is strictly doubled from 3 to 6', () => {
    const archetypes = Object.keys(CrisisArchetype);
    expect(archetypes.length).toBe(6);

    // Original 3 Archetypes
    expect(CrisisArchetype.VOID_SOVEREIGN).toBe('VOID_SOVEREIGN');
    expect(CrisisArchetype.ABYSSAL_LEVIATHAN).toBe('ABYSSAL_LEVIATHAN');
    expect(CrisisArchetype.CYBERNETIC_EXTERMINATOR).toBe('CYBERNETIC_EXTERMINATOR');

    // 3 New Doubled Archetypes
    expect(CrisisArchetype.CHRONO_DEVOURER).toBe('CHRONO_DEVOURER');
    expect(CrisisArchetype.SOLARIS_COLOSSUS).toBe('SOLARIS_COLOSSUS');
    expect(CrisisArchetype.NEBULA_PHANTASM).toBe('NEBULA_PHANTASM');

    // All 6 archetypes have valid entries in CRISIS_ARCHETYPE_CONFIGS
    for (const arch of Object.values(CrisisArchetype)) {
      const cfg = CRISIS_ARCHETYPE_CONFIGS[arch];
      expect(cfg).toBeDefined();
      expect(cfg.name.length).toBeGreaterThan(0);
      expect(cfg.subtitle.length).toBeGreaterThan(0);
      expect(cfg.riftHp).toBe(600);
      expect(cfg.sovereignHullHp).toBe(2500);
      expect(cfg.coreHp).toBe(1500);
      expect(cfg.enrageTime).toBe(35.0);
    }
  });

  // =========================================================================
  // 2. INITIALIZATION & 5,200 ENCOUNTER EHP INTEGRITY
  // =========================================================================
  test('DOUBLE-02: Initialization and 5,200 EHP encounter contract across all 6 archetypes', () => {
    const allArchetypes = [
      CrisisArchetype.VOID_SOVEREIGN,
      CrisisArchetype.ABYSSAL_LEVIATHAN,
      CrisisArchetype.CYBERNETIC_EXTERMINATOR,
      CrisisArchetype.CHRONO_DEVOURER,
      CrisisArchetype.SOLARIS_COLOSSUS,
      CrisisArchetype.NEBULA_PHANTASM,
    ];

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      expect(crisis.isActive).toBe(true);
      expect(crisis.phase).toBe(CrisisPhase.INCURSION);
      expect(crisis.archetype).toBe(arch);
      expect(crisis.warningTimer).toBe(3.0);
      expect(crisis.bannerText).toContain('DIMENSIONAL ANOMALY DETECTED');

      // Sovereign entity verification
      expect(crisis.sovereign).not.toBeNull();
      const sov = crisis.sovereign!;
      expect(sov.size.width).toBe(260);
      expect(sov.size.height).toBe(130);
      expect(sov.maxHullHp).toBe(2500);
      expect(sov.hullHp).toBe(2500);
      expect(sov.maxCoreHp).toBe(1500);
      expect(sov.coreHp).toBe(1500);
      expect(sov.maxHp).toBe(4000);
      expect(sov.hp).toBe(4000);

      // 2 Flanking Dimensional Rift Anchors (600 HP each)
      expect(crisis.riftAnchors.length).toBe(2);
      const [leftRift, rightRift] = crisis.riftAnchors;
      expect(leftRift.maxHp).toBe(600);
      expect(leftRift.hp).toBe(600);
      expect(rightRift.maxHp).toBe(600);
      expect(rightRift.hp).toBe(600);
      expect(leftRift.archetype).toBe(arch);
      expect(rightRift.archetype).toBe(arch);

      // Total Encounter EHP strictly equals 5,200 EHP
      const totalEncounterEHP = leftRift.hp + rightRift.hp + sov.hullHp + sov.coreHp;
      expect(totalEncounterEHP).toBe(5200);

      // State snapshot verification
      const state = crisis.getState();
      expect(state.archetype).toBe(arch);
      expect(state.totalHp).toBe(4000);
      expect(state.maxHp).toBe(4000);
      expect(state.enrageTimer).toBe(35.0);
    }
  });

  // =========================================================================
  // 3. MULTI-PHASE TRANSITIONS ACROSS ALL 6 ARCHETYPES
  // =========================================================================
  test('DOUBLE-03: Multi-phase state machine transitions (Incursion -> Shield -> Hull -> Core -> Defeated)', () => {
    const allArchetypes = Object.values(CrisisArchetype);

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      const phaseHistory: CrisisPhase[] = [];
      crisis.callbacks.onPhaseChange = (newP) => phaseHistory.push(newP);

      let defeatedArchetype: CrisisArchetype | null = null;
      crisis.callbacks.onDefeated = (defeated) => { defeatedArchetype = defeated; };

      crisis.startIncursion(arch);
      const player = new Player(600, 800);
      const bullets: Bullet[] = [];
      const particles: Particle[] = [];

      // Phase 0: INCURSION (3.0s warning timer)
      expect(crisis.phase).toBe(CrisisPhase.INCURSION);
      crisis.update(1.5, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.INCURSION);
      expect(crisis.warningTimer).toBeCloseTo(1.5, 1);

      // Progress past warning timer into PHASE_1_SHIELD
      crisis.update(1.6, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
      expect(crisis.sovereign!.isInvulnerable).toBe(true);

      // Phase 1 Shield Invulnerability Contract: Sovereign absorbs 0 damage
      const shieldedDmg = crisis.sovereign!.takeDamage(300);
      expect(shieldedDmg).toBe(0);
      expect(crisis.sovereign!.hullHp).toBe(2500);

      // Destroy Anchor 1 -> Sovereign remains invulnerable
      crisis.riftAnchors[0].takeDamage(3000);
      expect(crisis.riftAnchors[0].isDead).toBe(true);
      crisis.update(0.1, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
      expect(crisis.sovereign!.isInvulnerable).toBe(true);

      // Destroy Anchor 2 -> Triggers automatic transition to PHASE_2_HULL
      crisis.riftAnchors[1].takeDamage(3000);
      expect(crisis.riftAnchors[1].isDead).toBe(true);
      crisis.update(0.1, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);
      expect(crisis.sovereign!.isInvulnerable).toBe(false);

      // Phase 2: Sovereign Hull takes direct damage
      const hullDmg = crisis.sovereign!.takeDamage(1000);
      expect(hullDmg).toBe(1000);
      expect(crisis.sovereign!.hullHp).toBe(1500);

      // Finish off remaining hull -> Transitions to PHASE_3_CORE
      crisis.sovereign!.takeDamage(1500);
      expect(crisis.sovereign!.hullHp).toBe(0);
      crisis.update(0.1, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
      expect(crisis.sovereign!.coreHp).toBe(1500);
      expect(crisis.sovereign!.enrageTimer).toBe(35.0);

      // Enrage timer counts down
      crisis.sovereign!.update(36.0);
      expect(crisis.sovereign!.enrageTimer).toBe(0);
      expect(crisis.sovereign!.realityDistortionLevel).toBe(1.0);

      // Finish off core -> Transitions to DEFEATED
      crisis.sovereign!.takeDamage(1500);
      expect(crisis.sovereign!.coreHp).toBe(0);
      expect(crisis.sovereign!.isDead).toBe(true);
      crisis.update(0.1, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis.isActive).toBe(false);
      expect(defeatedArchetype).toBe(arch);
    }
  });

  // =========================================================================
  // 4. BESPOKE ANCHOR BEHAVIORS FOR NEW ARCHETYPES
  // =========================================================================
  test('DOUBLE-04A: CHRONO_DEVOURER Tachyon Monolith emits needles and creates chronal distortion', () => {
    const rift = new DimensionalRift(100, 150, 0, 600, CrisisArchetype.CHRONO_DEVOURER);
    expect(rift.color).toBe('#fbbf24');
    expect(rift.gravitationalPullRadius).toBe(200);

    const player = new Player(600, 800);
    const bullets: Bullet[] = [];

    // Advance by 2.6s to trigger needle firing
    const spawned = rift.update(2.6, player, bullets);
    expect(spawned.length).toBe(3);
    for (const b of spawned) {
      expect(b.color).toBe('#fbbf24');
      expect(b.isInterceptable).toBe(true);
      expect(b.velocity.y).toBe(120);
    }

    // Tachyon needles accelerate over time in subsequent updates
    bullets.push(...spawned);
    rift.update(0.5, player, bullets);
    for (const b of spawned) {
      expect(b.velocity.y).toBeGreaterThan(120);
    }

    // Chronal distortion field slows passing player bullets
    const playerBullet = new Bullet(rift.getSingularityCenter().x, rift.getSingularityCenter().y + 50, -400, 1, true);
    bullets.push(playerBullet);
    const initialVel = playerBullet.velocity.y;
    rift.update(0.2, player, bullets);
    expect(Math.abs(playerBullet.velocity.y)).toBeLessThan(Math.abs(initialVel));
  });

  test('DOUBLE-04B: SOLARIS_COLOSSUS Prominence Pillar fires incendiary sparks & sweeping tripwire', () => {
    const leftPillar = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.SOLARIS_COLOSSUS);
    const rightPillar = new DimensionalRift(470, 170, 1, 600, CrisisArchetype.SOLARIS_COLOSSUS);
    leftPillar.setSiblingRift(rightPillar);
    rightPillar.setSiblingRift(leftPillar);

    expect(leftPillar.color).toBe('#f97316');

    const player = new Player(600, 800);
    const bullets: Bullet[] = [];

    // Advance 3.1s to trigger 4 incendiary sparks
    const spawned = leftPillar.update(3.1, player, bullets);
    expect(spawned.length).toBe(4);
    for (const spark of spawned) {
      expect(spark.color).toBe('#f97316');
      expect(spark.isInterceptable).toBe(true);
    }

    // Tripwire state machine cycling
    leftPillar.tripwireTimer = 3.2; // in active ignited window
    // Position player directly in tripwire Y path
    const sweepProgress = (Math.sin(leftPillar['floatTime'] * 0.8) + 1) / 2;
    const tripwireY = 190 + sweepProgress * 420;
    player.position.y = tripwireY - player.size.height / 2;
    player.invincibilityTimer = 0;
    const initialHp = player.hp;

    leftPillar.update(0.1, player, bullets);
    expect(player.hp).toBe(initialHp - 1);
    expect(player.invincibilityTimer).toBeGreaterThan(0);
  });

  test('DOUBLE-04C: NEBULA_PHANTASM Entangled Phase Pods toggle Coherent/Shifted resistance', () => {
    const leftPod = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.NEBULA_PHANTASM);
    const rightPod = new DimensionalRift(470, 170, 1, 600, CrisisArchetype.NEBULA_PHANTASM);
    leftPod.setSiblingRift(rightPod);
    rightPod.setSiblingRift(leftPod);

    expect(leftPod.color).toBe('#6366f1');

    // Pod 0 starts in Coherent phase (100% damage), Pod 1 starts in Shifted phase (80% reduction)
    leftPod.isCoherentPhase = true;
    rightPod.isCoherentPhase = false;

    // Coherent pod takes full 100 damage
    const leftDmg = leftPod.takeDamage(100);
    expect(leftDmg).toBe(100);
    expect(leftPod.hp).toBe(500);

    // Shifted pod takes 80% reduced damage (20% of 100 = 20)
    const rightDmg = rightPod.takeDamage(100);
    expect(rightDmg).toBe(20);
    expect(rightPod.hp).toBe(580);

    // Phase toggle after 3.6s
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    leftPod.update(3.6, player, bullets);
    expect(leftPod.isCoherentPhase).toBe(false); // Pod 0 now shifted
  });

  // =========================================================================
  // 5. ATTACK PATTERN EXECUTION ACROSS ALL 6 ARCHETYPES
  // =========================================================================
  test('DOUBLE-05: Phase 2 and Phase 3 attack patterns execute correctly across all 6 archetypes', () => {
    const allArchetypes = Object.values(CrisisArchetype);

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);
      crisis['transitionToPhase'](CrisisPhase.PHASE_2_HULL);

      const player = new Player(600, 800);
      const bullets: Bullet[] = [];

      // Execute attack in Phase 2
      crisis['executeArchetypeAttack'](player, bullets);
      expect(bullets.length).toBeGreaterThan(0);

      // Verify specific archetype projectile signatures
      if (arch === CrisisArchetype.CHRONO_DEVOURER) {
        const hasTachyon = bullets.some(b => b.color === '#fbbf24');
        expect(hasTachyon).toBe(true);
      } else if (arch === CrisisArchetype.SOLARIS_COLOSSUS) {
        const hasSolar = bullets.some(b => b.color === '#f97316' || b.color === '#ef4444');
        expect(hasSolar).toBe(true);
      } else if (arch === CrisisArchetype.NEBULA_PHANTASM) {
        const hasQuantum = bullets.some(b => b.color === '#6366f1' || b.color === '#06b6d4');
        expect(hasQuantum).toBe(true);
      }

      // Execute attack in Phase 3 (Core Overdrive)
      bullets.length = 0;
      crisis['transitionToPhase'](CrisisPhase.PHASE_3_CORE);
      crisis['executeArchetypeAttack'](player, bullets);
      expect(bullets.length).toBeGreaterThan(0);

      if (arch === CrisisArchetype.CHRONO_DEVOURER) {
        // 8-way tachyon starburst
        expect(bullets.length).toBe(8);
      } else if (arch === CrisisArchetype.SOLARIS_COLOSSUS) {
        // 10-way solar starburst
        expect(bullets.length).toBe(10);
      } else if (arch === CrisisArchetype.NEBULA_PHANTASM) {
        // 12-way quantum curtain
        expect(bullets.length).toBe(12);
      }
    }
  });

  // =========================================================================
  // 6. CANVAS 2D VECTOR RENDERING SANITY (NO THROWN RUNTIME EXCEPTIONS)
  // =========================================================================
  test('DOUBLE-06: Headless Canvas 2D vector rendering sanity for all 6 archetypes across all 5 phases', () => {
    const ctx = createMockCanvasContext();
    const allArchetypes = Object.values(CrisisArchetype);
    const phases = [
      CrisisPhase.INCURSION,
      CrisisPhase.PHASE_1_SHIELD,
      CrisisPhase.PHASE_2_HULL,
      CrisisPhase.PHASE_3_CORE,
      CrisisPhase.DEFEATED,
    ];

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      for (const phase of phases) {
        crisis['transitionToPhase'](phase);
        expect(() => {
          crisis.draw(ctx, 600, 800);
        }).not.toThrow();
      }
    }
  });

  // =========================================================================
  // 7. BULLET COLLISION ROUTING ACROSS MULTI-NODES
  // =========================================================================
  test('DOUBLE-07: High-velocity player bullet collisions route accurately to active colliders', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.CHRONO_DEVOURER);
    crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

    // Bullet hitting Left Anchor
    const leftRift = crisis.riftAnchors[0];
    const bullet1 = new Bullet(leftRift.position.x + 10, leftRift.position.y + 10, -400, 100, true);
    let scoreGained = 0;
    const hit1 = crisis.handleBulletCollision(bullet1, (pts) => { scoreGained += pts; });
    expect(hit1).toBe(true);
    expect(leftRift.hp).toBe(500);
    expect(scoreGained).toBe(1000);
    expect(bullet1.isDead).toBe(true);

    // Bullet hitting Shielded Sovereign in Phase 1 -> deflected with 0 damage dealt
    const sov = crisis.sovereign!;
    const bullet2 = new Bullet(sov.position.x + 50, sov.position.y + 50, -400, 100, true);
    const hit2 = crisis.handleBulletCollision(bullet2);
    expect(hit2).toBe(true);
    expect(sov.hullHp).toBe(2500); // 0 damage dealt
    expect(bullet2.isDead).toBe(true);

    // Destroy both anchors via bullet collisions to enter Phase 2
    const killBullet1 = new Bullet(leftRift.position.x + 10, leftRift.position.y + 10, -400, 500, true);
    crisis.handleBulletCollision(killBullet1);
    const killBullet2 = new Bullet(crisis.riftAnchors[1].position.x + 10, crisis.riftAnchors[1].position.y + 10, -400, 600, true);
    crisis.handleBulletCollision(killBullet2);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    // Now bullet hitting Sovereign deals direct hull damage
    const bullet3 = new Bullet(sov.position.x + 50, sov.position.y + 50, -400, 200, true);
    const hit3 = crisis.handleBulletCollision(bullet3);
    expect(hit3).toBe(true);
    expect(sov.hullHp).toBe(2300);
  });
});

import { test, expect } from '@playwright/test';
import {
  CrisisArchetype,
  CrisisPhase,
  CRISIS_ARCHETYPE_CONFIGS,
} from '../../src/game/crisis/types';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { Player } from '../../src/game/Player';
import { Bullet } from '../../src/game/Bullet';
import { Particle } from '../../src/game/Particle';

/**
 * Creates a comprehensive headless mock for HTML5 Canvas 2D Context.
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
    arcTo: () => {},
    ellipse: () => {},
    bezierCurveTo: () => {},
    quadraticCurveTo: () => {},
    rect: () => {},
    roundRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    clearRect: () => {},
    fill: () => {},
    stroke: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    fillText: () => {},
    measureText: () => ({ width: 100 }),
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    createRadialGradient: () => ({
      addColorStop: () => {},
    }),
    setLineDash: () => {},
    getLineDash: () => [],
    shadowBlur: 0,
    shadowColor: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    textAlign: 'center',
    textBaseline: 'middle',
    font: '',
  };
  return ctx as CanvasRenderingContext2D;
}

test.describe('12-Crisis Expansion Suite: Comprehensive Archetype, Balance, and State Machine Verification', () => {

  // =========================================================================
  // EXP12-01: ENUM COUNT & CONFIG DICTIONARY INTEGRITY
  // =========================================================================
  test('EXP12-01: Verify all 12 distinct CrisisArchetype keys and CRISIS_ARCHETYPE_CONFIGS entries exist with non-empty fields and exact HP values', () => {
    const archetypes = Object.keys(CrisisArchetype);
    expect(archetypes.length).toBe(12);

    const expectedArchetypes: CrisisArchetype[] = [
      CrisisArchetype.VOID_SOVEREIGN,
      CrisisArchetype.ABYSSAL_LEVIATHAN,
      CrisisArchetype.CYBERNETIC_EXTERMINATOR,
      CrisisArchetype.CHRONO_DEVOURER,
      CrisisArchetype.SOLARIS_COLOSSUS,
      CrisisArchetype.NEBULA_PHANTASM,
      CrisisArchetype.BIOMORPHIC_SWARM,
      CrisisArchetype.SINGULARITY_CORE,
      CrisisArchetype.NANITE_HARVESTER,
      CrisisArchetype.PSIONIC_SHROUD,
      CrisisArchetype.GLACIAL_OBLIVION,
      CrisisArchetype.COSMIC_DEVOURER,
    ];

    expect(expectedArchetypes.length).toBe(12);

    for (const arch of expectedArchetypes) {
      expect(CrisisArchetype[arch]).toBe(arch);

      const cfg = CRISIS_ARCHETYPE_CONFIGS[arch];
      expect(cfg).toBeDefined();
      expect(cfg.name.length).toBeGreaterThan(0);
      expect(cfg.subtitle.length).toBeGreaterThan(0);
      expect(cfg.primaryColor.length).toBeGreaterThan(0);
      expect(cfg.secondaryColor.length).toBeGreaterThan(0);
      expect(cfg.accentColor.length).toBeGreaterThan(0);
      expect(cfg.coreGlowColor.length).toBeGreaterThan(0);

      // Exact HP and Timer invariant contracts
      expect(cfg.riftHp).toBe(600);
      expect(cfg.sovereignHullHp).toBe(2500);
      expect(cfg.coreHp).toBe(1500);
      expect(cfg.enrageTime).toBe(35.0);
      expect(cfg.vortexStrength).toBeGreaterThan(0);
      expect(cfg.baseFireRate).toBeGreaterThan(0);
    }
  });

  // =========================================================================
  // EXP12-02: STRICT 5,200 EHP ENCOUNTER INVARIANT ACROSS ALL 12 ARCHETYPES
  // =========================================================================
  test('EXP12-02: Strict 5,200 EHP invariant (2x600 + 2500 + 1500 = 5,200) across all 12 archetypes', () => {
    const allArchetypes = Object.values(CrisisArchetype);
    expect(allArchetypes.length).toBe(12);

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      expect(crisis.isActive).toBe(true);
      expect(crisis.archetype).toBe(arch);
      expect(crisis.riftAnchors.length).toBe(2);
      expect(crisis.sovereign).not.toBeNull();

      const [leftRift, rightRift] = crisis.riftAnchors;
      const sov = crisis.sovereign!;

      // Left anchor EHP
      expect(leftRift.hp).toBe(600);
      expect(leftRift.maxHp).toBe(600);

      // Right anchor EHP
      expect(rightRift.hp).toBe(600);
      expect(rightRift.maxHp).toBe(600);

      // Sovereign Hull EHP
      expect(sov.hullHp).toBe(2500);
      expect(sov.maxHullHp).toBe(2500);

      // Sovereign Core EHP
      expect(sov.coreHp).toBe(1500);
      expect(sov.maxCoreHp).toBe(1500);

      // Total encounter effective HP must strictly equal 5,200 EHP
      const totalEHP = leftRift.hp + rightRift.hp + sov.hullHp + sov.coreHp;
      expect(totalEHP).toBe(5200);

      // Verify exposed state reflects total Sovereign health (4,000 HP)
      const state = crisis.getState();
      expect(state.archetype).toBe(arch);
      expect(state.totalHp).toBe(4000);
      expect(state.maxHp).toBe(4000);
      expect(state.enrageTimer).toBe(35.0);
    }
  });

  // =========================================================================
  // EXP12-03: 5-PHASE STATE MACHINE LIFECYCLE ACROSS ALL 12 ARCHETYPES
  // =========================================================================
  test('EXP12-03: 5-Phase State Machine lifecycle across all 12 archetypes (INCURSION -> PHASE_1_SHIELD -> PHASE_2_HULL -> PHASE_3_CORE -> DEFEATED)', () => {
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

      // Advance past 3.0s warning into PHASE_1_SHIELD
      crisis.update(1.6, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
      expect(crisis.sovereign!.isInvulnerable).toBe(true);

      // Sovereign invulnerability contract: absorbs 0 damage in Phase 1
      const shieldedDmg = crisis.sovereign!.takeDamage(400);
      expect(shieldedDmg).toBe(0);
      expect(crisis.sovereign!.hullHp).toBe(2500);

      // Destroy Anchor 1 -> Sovereign must remain shielded
      crisis.riftAnchors[0].takeDamage(3000);
      expect(crisis.riftAnchors[0].isDead).toBe(true);
      crisis.update(0.1, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
      expect(crisis.sovereign!.isInvulnerable).toBe(true);

      // Destroy Anchor 2 -> Automatic transition to PHASE_2_HULL
      crisis.riftAnchors[1].takeDamage(3000);
      expect(crisis.riftAnchors[1].isDead).toBe(true);
      crisis.update(0.1, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);
      expect(crisis.sovereign!.isInvulnerable).toBe(false);

      // Phase 2: Sovereign Hull is now vulnerable to direct damage
      const hullDmg = crisis.sovereign!.takeDamage(1000);
      expect(hullDmg).toBe(1000);
      expect(crisis.sovereign!.hullHp).toBe(1500);

      // Finish off remaining Hull (1,500 HP) -> Transitions to PHASE_3_CORE
      crisis.sovereign!.takeDamage(1500);
      expect(crisis.sovereign!.hullHp).toBe(0);
      crisis.update(0.1, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
      expect(crisis.sovereign!.coreHp).toBe(1500);
      expect(crisis.sovereign!.enrageTimer).toBe(35.0);

      // Enrage clock counts down
      crisis.sovereign!.update(36.0);
      expect(crisis.sovereign!.enrageTimer).toBe(0);
      expect(crisis.sovereign!.realityDistortionLevel).toBe(1.0);

      // Finish off Core (1,500 HP) -> Transitions to DEFEATED
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
  // EXP12-04: BESPOKE PHASE 1 ANCHOR MECHANICS FOR 6 NEW ARCHETYPES
  // =========================================================================
  test('EXP12-04A: BIOMORPHIC_SWARM Chitinous Hatchery Sacs spawn undulating seeker spores', () => {
    const rift = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.BIOMORPHIC_SWARM);
    expect(rift.color).toBe('#b91c1c');

    const player = new Player(600, 800);
    const bullets: Bullet[] = [];

    // Advance 2.5s to trigger seeker spore burst
    const spawned = rift.update(2.5, player, bullets);
    expect(spawned.length).toBe(3);

    for (const b of spawned) {
      expect(b.color).toBe('#f59e0b');
      expect((b as any).isBiomorphicSpore).toBe(true);
      expect(b.velocity.y).toBe(170);
      expect(b.isInterceptable).toBe(true);
    }

    // Active spores maintain sinusoidal trajectory on subsequent ticks
    bullets.push(...spawned);
    rift.update(0.1, player, bullets);
    for (const b of bullets) {
      expect(b.velocity.x).not.toBe(0);
    }
  });

  test('EXP12-04B: SINGULARITY_CORE Polarized Gravitational Dampeners exert opposing lateral forces', () => {
    const leftRift = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.SINGULARITY_CORE);
    const rightRift = new DimensionalRift(470, 170, 1, 600, CrisisArchetype.SINGULARITY_CORE);

    const player1 = new Player(600, 800);
    player1.position.x = 300;
    const playerBullet1 = new Bullet(300, 400, -400, 1, true);

    // Left Anchor pulls player and bullets to the left (-50 px/s)
    leftRift.update(1.0, player1, [playerBullet1]);
    expect(player1.position.x).toBe(250); // 300 - 50
    expect(playerBullet1.position.x).toBe(250);

    const player2 = new Player(600, 800);
    player2.position.x = 300;
    const playerBullet2 = new Bullet(300, 400, -400, 1, true);

    // Right Anchor pushes player and bullets to the right (+50 px/s)
    rightRift.update(1.0, player2, [playerBullet2]);
    expect(player2.position.x).toBe(350); // 300 + 50
    expect(playerBullet2.position.x).toBe(350);

    // Compression pulse firing after 2.8s
    const pulses = leftRift.update(1.9, player1, []);
    expect(pulses.some(b => b.color === '#8b5cf6')).toBe(true);
  });

  test('EXP12-04C: NANITE_HARVESTER Nanite Assembly Fabricators execute mutual 15 HP/s healing', () => {
    const fab0 = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.NANITE_HARVESTER);
    const fab1 = new DimensionalRift(470, 170, 1, 600, CrisisArchetype.NANITE_HARVESTER);
    fab0.siblingRift = fab1;
    fab1.siblingRift = fab0;

    // Damage fab1 to 400 HP
    fab1.hp = 400;
    expect(fab1.hp).toBe(400);

    const player = new Player(600, 800);
    const bullets: Bullet[] = [];

    // fab0 updates for 1.0s -> repairs sibling fab1 by 15 HP
    fab0.update(1.0, player, bullets);
    expect(fab1.hp).toBe(415);

    // If fab0 is destroyed, mutual healing to fab1 immediately ceases
    fab0.hp = 0;
    fab0.isDead = true;
    fab0.update(1.0, player, bullets);
    expect(fab1.hp).toBe(415); // Unchanged

    // Fires 4 splinter shards every 3.0s
    const shards = fab1.update(3.1, player, bullets);
    expect(shards.filter(b => b.color === '#14b8a6').length).toBe(4);
  });

  test('EXP12-04D: PSIONIC_SHROUD Telepathic Beacons spawn real psychic bolts and phantom mirage decoys', () => {
    const beacon = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.PSIONIC_SHROUD);
    const player = new Player(600, 800);

    // Advance 2.5s to trigger telepathic beacon volley
    const spawned = beacon.update(2.5, player, []);
    expect(spawned.length).toBe(4);

    const realBolts = spawned.filter(b => b.damage === 1 && b.color === '#d946ef');
    const decoys = spawned.filter(b => b.damage === 0 && (b as any).isPhantomDecoy === true);

    expect(realBolts.length).toBe(2);
    expect(decoys.length).toBe(2);
    expect(decoys[0].color).toContain('rgba(217, 70, 239');
  });

  test('EXP12-04E: GLACIAL_OBLIVION Cryo-Condensers reflect 4 ice splinters when rapid-fired (>6 shots/s)', () => {
    const cryo = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.GLACIAL_OBLIVION);
    const player = new Player(600, 800);

    // Rapid player fire: 7 hits within 0.5s
    for (let i = 0; i < 7; i++) {
      cryo.takeDamage(10);
    }

    // Next update flushes reflected flak
    const flak = cryo.update(0.016, player, []);
    expect(flak.length).toBe(4);
    for (const splinter of flak) {
      expect(splinter.color).toBe('#f0f9ff');
      expect(splinter.velocity.y).toBe(240);
    }
  });

  test('EXP12-04F: COSMIC_DEVOURER Astral Siphon Maw regurgitates Dark Star Flares with fire trails', () => {
    const maw = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.COSMIC_DEVOURER);
    const player = new Player(600, 800);

    // Advance 2.7s to trigger flare release
    const spawned = maw.update(2.7, player, []);
    expect(spawned.length).toBe(1);

    const flare = spawned[0];
    expect(flare.color).toBe('#dc2626');
    expect((flare as any).isDarkStarFlare).toBe(true);
    expect(Math.hypot(flare.velocity.x, flare.velocity.y)).toBeCloseTo(190, 0);
    expect(flare.velocity.y).toBeGreaterThan(0);

    // Subsequent updates spawn fire hazard trail zones
    const bullets: Bullet[] = [flare];
    maw.update(0.15, player, bullets);
    expect(maw.fireTrails.length).toBeGreaterThanOrEqual(1);
    expect(maw.fireTrails[0].radius).toBe(15);
    expect(maw.fireTrails[0].life).toBeGreaterThan(0);
  });

  // =========================================================================
  // EXP12-05: ARCHEΤΥΡAL PHASE 2 & 3 ATTACKS ACROSS ALL 12 ARCHETYPES
  // =========================================================================
  test('EXP12-05: Archetypal Phase 2 and Phase 3 attack pattern execution across all 12 archetypes', () => {
    const allArchetypes = Object.values(CrisisArchetype);

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);
      crisis['transitionToPhase'](CrisisPhase.PHASE_2_HULL);

      const player = new Player(600, 800);
      const bullets: Bullet[] = [];

      // Execute Phase 2 Attack
      crisis['executeArchetypeAttack'](player, bullets);
      expect(bullets.length).toBeGreaterThan(0);

      // Execute Phase 3 Attack (Core Overdrive)
      bullets.length = 0;
      crisis['transitionToPhase'](CrisisPhase.PHASE_3_CORE);
      crisis['executeArchetypeAttack'](player, bullets);
      expect(bullets.length).toBeGreaterThan(0);

      // Verify specific archetype barrage signatures in Phase 3
      switch (arch) {
        case CrisisArchetype.CHRONO_DEVOURER:
          expect(bullets.length).toBe(8); // 8-way tachyon starburst
          break;
        case CrisisArchetype.SOLARIS_COLOSSUS:
          expect(bullets.length).toBe(10); // 10-way solar starburst
          break;
        case CrisisArchetype.NEBULA_PHANTASM:
          expect(bullets.length).toBe(12); // 12-way quantum curtain
          break;
        case CrisisArchetype.BIOMORPHIC_SWARM:
          expect(bullets.length).toBe(14); // 14-way bio-plasmid helix
          break;
        case CrisisArchetype.SINGULARITY_CORE:
          expect(bullets.length).toBe(16); // 16-way Hawking Nova
          break;
        case CrisisArchetype.NANITE_HARVESTER:
          expect(bullets.length).toBe(16); // 16-way radial nanite storm
          break;
        case CrisisArchetype.PSIONIC_SHROUD:
          expect(bullets.length).toBe(12); // 12-way psychic terror star
          break;
        case CrisisArchetype.GLACIAL_OBLIVION:
          expect(bullets.length).toBe(14); // 14-way blizzard starburst
          break;
        case CrisisArchetype.COSMIC_DEVOURER:
          expect(bullets.length).toBe(17); // 16-way corona + 1 aimed breath
          break;
      }
    }
  });

  // =========================================================================
  // EXP12-06: HEADLESS CANVAS 2D VECTOR DRAWING SANITY (60 PERMUTATIONS)
  // =========================================================================
  test('EXP12-06: Headless Canvas 2D vector drawing sanity across all 12x5 = 60 archetype/phase permutations (zero exceptions)', () => {
    const ctx = createMockCanvasContext();
    const allArchetypes = Object.values(CrisisArchetype);
    const phases = [
      CrisisPhase.INCURSION,
      CrisisPhase.PHASE_1_SHIELD,
      CrisisPhase.PHASE_2_HULL,
      CrisisPhase.PHASE_3_CORE,
      CrisisPhase.DEFEATED,
    ];

    expect(allArchetypes.length).toBe(12);
    expect(phases.length).toBe(5);

    let drawCount = 0;
    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      for (const phase of phases) {
        crisis['transitionToPhase'](phase);
        expect(() => {
          crisis.draw(ctx, 600, 800);
          drawCount++;
        }).not.toThrow();
      }
    }

    expect(drawCount).toBe(60);
  });

  // =========================================================================
  // EXP12-07: HIGH-VELOCITY PLAYER BULLET COLLISIONS & DAMAGE GATING
  // =========================================================================
  test('EXP12-07: High-velocity player bullet collisions, piercing deduction, and damage gating', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.BIOMORPHIC_SWARM);
    crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

    // Left Anchor takes damage from player bullet
    const leftAnchor = crisis.riftAnchors[0];
    const bullet1 = new Bullet(leftAnchor.position.x + 10, leftAnchor.position.y + 10, -450, 150, true, 1);
    let scoreAccum = 0;

    const hitLeft = crisis.handleBulletCollision(bullet1, (pts) => { scoreAccum += pts; });
    expect(hitLeft).toBe(true);
    expect(leftAnchor.hp).toBe(450);
    expect(scoreAccum).toBe(1500);
    expect(bullet1.isDead).toBe(true);

    // Piercing bullet hits Left Anchor and penetrates with isDead false
    const piercingBullet = new Bullet(leftAnchor.position.x + 10, leftAnchor.position.y + 10, -450, 200, true, 3);
    const hitPierce = crisis.handleBulletCollision(piercingBullet);
    expect(hitPierce).toBe(true);
    expect(leftAnchor.hp).toBe(250);
    expect(piercingBullet.isDead).toBe(false);
    expect(piercingBullet.hitEntities.has(leftAnchor)).toBe(true);

    // Sovereign in Phase 1 deflects player bullet with 0 damage dealt
    const sov = crisis.sovereign!;
    const bulletAtShield = new Bullet(sov.position.x + 50, sov.position.y + 50, -450, 200, true, 1);
    const hitShield = crisis.handleBulletCollision(bulletAtShield);
    expect(hitShield).toBe(true);
    expect(sov.hullHp).toBe(2500);
    expect(bulletAtShield.isDead).toBe(true);

    // Destroy both anchors to transition to Phase 2
    crisis.riftAnchors[0].takeDamage(1000);
    crisis.riftAnchors[1].takeDamage(1000);
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    // Direct hull hit now deals exact damage
    const bulletAtHull = new Bullet(sov.position.x + 50, sov.position.y + 50, -450, 250, true, 1);
    const hitHull = crisis.handleBulletCollision(bulletAtHull);
    expect(hitHull).toBe(true);
    expect(sov.hullHp).toBe(2250);
    expect(bulletAtHull.isDead).toBe(true);
  });
});

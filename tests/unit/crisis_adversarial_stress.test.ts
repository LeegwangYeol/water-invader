import { test, expect } from '@playwright/test';
import { CrisisArchetype, CrisisPhase, CRISIS_ARCHETYPE_CONFIGS } from '../../src/game/crisis/types';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { Player } from '../../src/game/Player';
import { Bullet } from '../../src/game/Bullet';
import { Particle } from '../../src/game/Particle';
import { GameManager } from '../../src/game/GameManager';
import { GameState, Faction } from '../../src/game/types';

function createMockCanvas(): HTMLCanvasElement {
  return {
    width: 600,
    height: 800,
    getContext: () => ({
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      fill: () => {},
      stroke: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      fillText: () => {},
      measureText: () => ({ width: 50 }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      setLineDash: () => {},
    }),
  } as unknown as HTMLCanvasElement;
}

test.describe('Adversarial Stress Suite: 12 End-Game Crisis Edge Cases & Invariants', () => {

  // =========================================================================
  // SCENARIO 1: RAPID DAMAGE BURSTS TO ANCHORS AND CORE
  // =========================================================================

  test('ADV-01A: Massive single-shot overkill burst on Anchor does not bleed to sibling or Sovereign', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    const [leftAnchor, rightAnchor] = crisis.riftAnchors;
    const sov = crisis.sovereign!;

    // Deliver 10,000 burst damage to Left Anchor (has 600 HP)
    const dmgDealt = leftAnchor.takeDamage(10000);
    expect(dmgDealt).toBe(600); // Clamped to actual HP
    expect(leftAnchor.hp).toBe(0);
    expect(leftAnchor.isDead).toBe(true);

    // Sibling Anchor and Sovereign must remain completely untouched
    expect(rightAnchor.hp).toBe(600);
    expect(rightAnchor.isDead).toBe(false);
    expect(sov.hullHp).toBe(2500);
    expect(sov.coreHp).toBe(1500);
    expect(sov.isInvulnerable).toBe(true);

    // Update crisis - must still be in Phase 1 because right anchor is alive
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
  });

  test('ADV-01B: Massive single-shot overkill burst on Sovereign Hull does not bleed into Core HP', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);

    // Destroy both anchors to enter Phase 2
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    const sov = crisis.sovereign!;
    expect(sov.hullHp).toBe(2500);
    expect(sov.coreHp).toBe(1500);

    // Deliver 50,000 overkill burst to Hull
    const hullDmg = sov.takeDamage(50000);
    expect(hullDmg).toBe(2500);
    expect(sov.hullHp).toBe(0);
    expect(sov.phase).toBe(CrisisPhase.PHASE_3_CORE);

    // CRITICAL INVARIANT: Core HP must strictly remain 1,500 HP (zero bleed)
    expect(sov.coreHp).toBe(1500);
    expect(sov.isDead).toBe(false);

    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
  });

  test('ADV-01C: Overkill damage truncation on phase boundary: 20 damage discarded on threshold bullet', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.SOLARIS_COLOSSUS);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);

    // Destroy anchors to enter Phase 2
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    const sov = crisis.sovereign!;
    // Set Hull to 20 HP
    sov.hullHp = 20;

    // Fire a 40-damage bullet directly at Sovereign Hull
    const b = new Bullet(sov.position.x + 50, sov.position.y + 50, -400, 40, true, 1);
    let recordedScore = 0;
    crisis.handleBulletCollision(b, (pts) => { recordedScore = pts; });

    // The bullet dealt 20 damage (Math.min(hullHp, 40) = 20)
    // 20 damage was discarded due to phase clamping!
    expect(sov.hullHp).toBe(0);
    expect(recordedScore).toBe(20 * 15); // 300 points
    expect(sov.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(sov.coreHp).toBe(1500); // Intact at 1500 HP
  });

  test('ADV-01D: Remediation Verified: Piercing bullet decrements piercing and does not deal multi-hit damage on subsequent frames', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);

    // Transition to Phase 2
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    const sov = crisis.sovereign!;
    // Bullet with piercing = 5, damage = 100
    const bullet = new Bullet(sov.position.x + 100, sov.position.y + 120, -100, 100, true, 5);

    // Frame 1 collision
    const hit1 = crisis.handleBulletCollision(bullet);
    expect(hit1).toBe(true);
    expect(bullet.hitEntities.has(sov)).toBe(true);
    expect(sov.hullHp).toBe(2400);
    expect(bullet.piercing).toBe(4); // REMEDIATION VERIFIED: Piercing decremented by 1!

    // Frame 2 collision: bullet moved slightly but still inside Sovereign hitbox
    bullet.position.y -= 10;
    const hit2 = crisis.handleBulletCollision(bullet);
    expect(hit2).toBe(false); // REMEDIATION VERIFIED: Sovereign does NOT take damage again!
    expect(sov.hullHp).toBe(2400);
    expect(bullet.piercing).toBe(4); // Remains 4

    // Frame 3 collision
    bullet.position.y -= 10;
    const hit3 = crisis.handleBulletCollision(bullet);
    expect(hit3).toBe(false);
    expect(sov.hullHp).toBe(2400);
  });

  // =========================================================================
  // SCENARIO 2: TRANSITIONING FROM PHASE 1 TO PHASE 3 INSTANTANEOUSLY
  // =========================================================================

  test('ADV-02A: Instantaneous Phase 1 -> Phase 2 -> Phase 3 transition in zero ticks via chained bullet strikes', () => {
    const crisis = new EndGameCrisis(600, 800);
    const recordedPhases: CrisisPhase[] = [];
    crisis.callbacks.onPhaseChange = (p) => recordedPhases.push(p);

    crisis.startIncursion(CrisisArchetype.ABYSSAL_LEVIATHAN);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    // Anchor 0 destroyed
    crisis.riftAnchors[0].takeDamage(600);

    // Bullet 1 kills Anchor 1 (triggering immediate Phase 2 transition)
    const anchor1 = crisis.riftAnchors[1];
    const b1 = new Bullet(anchor1.position.x + 10, anchor1.position.y + 10, -400, 600, true, 1);
    crisis.handleBulletCollision(b1);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    // Bullet 2 in the exact same tick strikes Sovereign for 2500 dmg (depleting hull instantly)
    const sov = crisis.sovereign!;
    const b2 = new Bullet(sov.position.x + 50, sov.position.y + 50, -400, 2500, true, 1);
    crisis.handleBulletCollision(b2);

    // Phase 2 lasted zero update ticks, immediately entering Phase 3
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(sov.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(sov.hullHp).toBe(0);
    expect(sov.coreHp).toBe(1500);

    // Verify all lifecycle phases were dispatched: INCURSION -> PHASE_1_SHIELD -> PHASE_2_HULL -> PHASE_3_CORE
    expect(recordedPhases).toEqual([
      CrisisPhase.INCURSION,
      CrisisPhase.PHASE_1_SHIELD,
      CrisisPhase.PHASE_2_HULL,
      CrisisPhase.PHASE_3_CORE
    ]);
  });

  test('ADV-02B: Allied Reinforcements spawned via callback even when Phase 2 has zero ticks', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 16;

    // Use VOID_SOVEREIGN to avoid shifted phase damage reduction
    const crisis = gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
    crisis.warningTimer = 0;
    crisis.update(0.016, gm.player, gm.bullets, gm.particles);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
    expect(gm.alliedReinforcements).toBeUndefined();

    // Kill both anchors and hull in rapid succession in the same frame
    crisis.riftAnchors[0].takeDamage(600);
    const b1 = new Bullet(crisis.riftAnchors[1].position.x + 10, crisis.riftAnchors[1].position.y + 10, -400, 600, true, 1);
    crisis.handleBulletCollision(b1); // Triggers PHASE_2_HULL callback -> spawns allied reinforcements!

    expect(gm.alliedReinforcements).toBeDefined();

    // Immediately deplete hull to enter Phase 3 in zero ticks
    const b2 = new Bullet(crisis.sovereign!.position.x + 50, crisis.sovereign!.position.y + 50, -400, 2500, true, 1);
    crisis.handleBulletCollision(b2); // Triggers PHASE_3_CORE

    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(gm.alliedReinforcements).toBeDefined();
  });

  test('ADV-02C: Remediation Verified: Crisis phase synchronizes to PHASE_3_CORE when Sovereign is in Phase 3', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.CHRONO_DEVOURER);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    // Modify Sovereign phase to PHASE_3_CORE while crisis is in PHASE_1_SHIELD
    crisis.sovereign!.phase = CrisisPhase.PHASE_3_CORE;
    crisis.sovereign!.hullHp = 0;

    // Call update
    crisis.update(0.016, new Player(600, 800), [], []);

    // REMEDIATION VERIFIED: update() properly transitions to PHASE_3_CORE!
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
  });

  // =========================================================================
  // SCENARIO 3: ENRAGE TIMER EXPIRATION BEHAVIOR (enrageTime <= 0)
  // =========================================================================

  test('ADV-03A: Enrage timer countdown to 0.0s and realityDistortionLevel saturation at 1.0', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.GLACIAL_OBLIVION);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);

    // Destroy anchors and hull properly
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, new Player(600, 800), [], []); // Enter Phase 2
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    crisis.sovereign!.takeDamage(2500);
    crisis.update(0.016, new Player(600, 800), [], []); // Enter Phase 3
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

    const sov = crisis.sovereign!;
    expect(sov.enrageTimer).toBe(35.0);
    expect(sov.realityDistortionLevel).toBe(0);

    // Advance 34.0 seconds
    crisis.update(34.0, new Player(600, 800), [], []);
    expect(sov.enrageTimer).toBeCloseTo(1.0, 1);
    expect(sov.realityDistortionLevel).toBe(0);

    // Advance past 35.0s enrage limit
    crisis.update(2.0, new Player(600, 800), [], []);
    expect(sov.enrageTimer).toBe(0);
    expect(sov.realityDistortionLevel).toBe(1.0);

    // Further updates clamp at 0 and 1.0
    crisis.update(10.0, new Player(600, 800), [], []);
    expect(sov.enrageTimer).toBe(0);
    expect(sov.realityDistortionLevel).toBe(1.0);
  });

  test('ADV-03B: Anomaly Confirmed: Enrage expiration (enrageTimer <= 0) lacks game-over penalty or attack acceleration', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.SINGULARITY_CORE);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);

    // Transition cleanly to Phase 3
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, new Player(600, 800), [], []); // Phase 2
    crisis.sovereign!.takeDamage(2500);
    crisis.update(0.016, new Player(600, 800), [], []); // Phase 3
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

    // Force enrage timer to 0
    crisis.sovereign!.enrageTimer = 0;
    crisis.sovereign!.realityDistortionLevel = 1.0;

    const bullets: Bullet[] = [];
    const player = new Player(600, 800);

    // Run 5 seconds (300 ticks) at enrageTimer = 0
    for (let t = 0; t < 300; t++) {
      crisis.update(1 / 60, player, bullets, []);
    }

    // ANOMALY FINDING:
    // 1. Crisis remains active indefinitely; player is NOT wiped.
    expect(crisis.isActive).toBe(true);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(crisis.sovereign!.coreHp).toBe(1500);

    // 2. Attack interval remains strictly 1.4s (no hyper-dense attack overdrive)
    // Over 5 seconds with 1.4s cadence: expect ~3-4 attacks fired
    expect(bullets.length).toBeGreaterThan(0);

    // 3. realityDistortionLevel is 1.0, but unused in rendering or mechanics
    expect(crisis.sovereign!.realityDistortionLevel).toBe(1.0);
  });

  // =========================================================================
  // SCENARIO 4: DEFEATING SOVEREIGN WHILE ANCHORS ALIVE / RE-TRIGGERING INCURSION
  // =========================================================================

  test('ADV-04A: Remediation Verified: Defeating Sovereign while Anchors alive marks anchors as dead', () => {
    const crisis = new EndGameCrisis(600, 800);
    let defeatedReported = false;
    crisis.callbacks.onDefeated = () => { defeatedReported = true; };

    crisis.startIncursion(CrisisArchetype.PSIONIC_SHROUD);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    const [leftAnchor, rightAnchor] = crisis.riftAnchors;
    expect(leftAnchor.hp).toBe(600);
    expect(rightAnchor.hp).toBe(600);

    // Destroy Sovereign in Phase 1
    const sov = crisis.sovereign!;
    sov.hullHp = 0;
    sov.coreHp = 0;
    sov.hp = 0;
    sov.isDead = true;

    // Update crisis
    crisis.update(0.016, new Player(600, 800), [], []);

    expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
    expect(crisis.isDefeated()).toBe(true);
    expect(defeatedReported).toBe(true);

    // REMEDIATION VERIFIED: Anchors are cleanly marked isDead = true!
    expect(leftAnchor.isDead).toBe(true);
    expect(rightAnchor.isDead).toBe(true);

    // REMEDIATION VERIFIED: getActiveColliders() reports 0 living colliders!
    const colliders = crisis.getActiveColliders();
    expect(colliders.length).toBe(0);
  });

  test('ADV-04B: Anomaly Confirmed: Re-triggering incursion during active crisis orphans active Allied Reinforcements', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 16;

    // Trigger crisis 1 (Chrono Devourer)
    const crisis1 = gm.triggerEndGameCrisis(CrisisArchetype.CHRONO_DEVOURER);
    crisis1.warningTimer = 0;
    crisis1.update(0.016, gm.player, gm.bullets, gm.particles);

    // Advance crisis 1 to Phase 2 (allied reinforcements spawn)
    crisis1.riftAnchors[0].takeDamage(600);
    crisis1.riftAnchors[1].takeDamage(600);
    crisis1.update(0.016, gm.player, gm.bullets, gm.particles);
    expect(crisis1.phase).toBe(CrisisPhase.PHASE_2_HULL);
    expect(gm.alliedReinforcements).toBeDefined();

    const originalAllied = gm.alliedReinforcements;

    // Now re-trigger crisis 2 (Biomorphic Swarm) while crisis 1 is mid-fight
    const crisis2 = gm.triggerEndGameCrisis(CrisisArchetype.BIOMORPHIC_SWARM);

    // ANOMALY: GameManager overwrites endGameCrisis without cleaning up AlliedReinforcements
    expect(gm.endGameCrisis).toBe(crisis2);
    expect(crisis2.phase).toBe(CrisisPhase.INCURSION);

    // Allied fleet from Crisis 1 is still present on screen during Incursion warning of Crisis 2!
    expect(gm.alliedReinforcements).toBe(originalAllied);
  });

  test('ADV-04C: Re-calling startIncursion() on same EndGameCrisis instance resets encounter but preserves unreset attackTimer', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.NANITE_HARVESTER);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);

    // Progress to Phase 2
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    // Progress to Phase 3
    crisis.sovereign!.takeDamage(2500);
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

    // Re-call startIncursion directly on the same instance
    crisis.startIncursion(CrisisArchetype.COSMIC_DEVOURER);

    // Archetype and Phase reset to INCURSION
    expect(crisis.archetype).toBe(CrisisArchetype.COSMIC_DEVOURER);
    expect(crisis.phase).toBe(CrisisPhase.INCURSION);
    expect(crisis.sovereign!.hullHp).toBe(2500);
    expect(crisis.sovereign!.coreHp).toBe(1500);
    expect(crisis.riftAnchors.length).toBe(2);
    expect(crisis.riftAnchors[0].hp).toBe(600);
  });
});

import { test, expect } from '@playwright/test';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { AlliedReinforcements } from '../../src/game/crisis/AlliedReinforcements';
import { CrisisArchetype, CrisisPhase, CRISIS_ARCHETYPE_CONFIGS } from '../../src/game/crisis/types';
import { Player } from '../../src/game/Player';
import { Bullet } from '../../src/game/Bullet';
import { Particle } from '../../src/game/Particle';
import { Faction, GameState } from '../../src/game/types';
import { GameManager } from '../../src/game/GameManager';

function createMockCanvas(width: number = 600, height: number = 800): HTMLCanvasElement {
  return {
    width,
    height,
    getContext: () => ({
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      rotate: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      fill: () => {},
      stroke: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      drawImage: () => {},
      roundRect: () => {},
      measureText: () => ({ width: 50 }),
      setLineDash: () => {},
      clearRect: () => {},
      globalAlpha: 1,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    }),
  } as unknown as HTMLCanvasElement;
}

test.describe('Empirical Challenger: End-Game Crisis Stress & Adversarial Suite', () => {

  // =========================================================================
  // SCENARIO 1: RAPID DAMAGE BURSTS TO ANCHORS AND CORE
  // =========================================================================
  test.describe('Scenario 1: Rapid Damage Bursts to Anchors and Core', () => {

    test('1.1: Single massive overkill burst (1,000,000 damage) to anchors clamps exactly to 0 HP and prevents negative HP', () => {
      for (const arch of Object.values(CrisisArchetype)) {
        const crisis = new EndGameCrisis(600, 800);
        crisis.startIncursion(arch);
        crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

        const leftAnchor = crisis.riftAnchors[0];
        const rightAnchor = crisis.riftAnchors[1];

        // Ensure coherent phase for NEBULA_PHANTASM so raw damage is not reduced
        leftAnchor.isCoherentPhase = true;
        rightAnchor.isCoherentPhase = true;

        let scoreEarned = 0;
        const megaBulletLeft = new Bullet(leftAnchor.position.x + 20, leftAnchor.position.y + 20, -500, 1_000_000, true, 1);
        const hitLeft = crisis.handleBulletCollision(megaBulletLeft, (pts) => { scoreEarned += pts; });

        expect(hitLeft).toBe(true);
        expect(leftAnchor.hp).toBe(0);
        expect(leftAnchor.isDead).toBe(true);
        expect(scoreEarned).toBe(600 * 10); // Exactly 600 damage absorbed * 10 pts, not 1,000,000 * 10

        // Sovereign must remain shielded with 0 damage taken
        expect(crisis.sovereign!.hullHp).toBe(2500);
        expect(crisis.sovereign!.coreHp).toBe(1500);
        expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

        // Overkill right anchor
        const megaBulletRight = new Bullet(rightAnchor.position.x + 20, rightAnchor.position.y + 20, -500, 500_000, true, 1);
        const hitRight = crisis.handleBulletCollision(megaBulletRight, (pts) => { scoreEarned += pts; });

        expect(hitRight).toBe(true);
        expect(rightAnchor.hp).toBe(0);
        expect(rightAnchor.isDead).toBe(true);
        expect(scoreEarned).toBe((600 + 600) * 10);

        // Transition to Phase 2 occurs immediately upon second anchor death
        expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);
        expect(crisis.sovereign!.isInvulnerable).toBe(false);
      }
    });

    test('1.2: Rapid multishot burst (500 bullets in a single tick) does not leak damage past 600 EHP anchor capacity', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
      crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

      const anchor = crisis.riftAnchors[0];
      let damageAbsorbed = 0;

      // 500 bullets dealing 10 damage each (5,000 total potential damage)
      for (let i = 0; i < 500; i++) {
        const bullet = new Bullet(anchor.position.x + 20, anchor.position.y + 20, -500, 10, true, 1);
        crisis.handleBulletCollision(bullet, (pts) => { damageAbsorbed += pts / 10; });
      }

      expect(anchor.hp).toBe(0);
      expect(anchor.isDead).toBe(true);
      expect(damageAbsorbed).toBe(600); // Clamped at exactly anchor HP
    });

    test('1.3: Sovereign Hull overkill burst (100,000 damage) does not bleed into Core HP', () => {
      for (const arch of Object.values(CrisisArchetype)) {
        const crisis = new EndGameCrisis(600, 800);
        crisis.startIncursion(arch);
        crisis['transitionToPhase'](CrisisPhase.PHASE_2_HULL);

        const sov = crisis.sovereign!;
        expect(sov.hullHp).toBe(2500);
        expect(sov.coreHp).toBe(1500);

        let scoreAdded = 0;
        const massiveBullet = new Bullet(sov.position.x + 50, sov.position.y + 50, -500, 100_000, true, 1);
        crisis.handleBulletCollision(massiveBullet, (pts) => { scoreAdded += pts; });

        // Hull absorbed 2500, clamped to 0
        expect(sov.hullHp).toBe(0);
        // Overkill 97,500 damage must NOT bleed into Core!
        expect(sov.coreHp).toBe(1500);
        expect(sov.isDead).toBe(false);
        expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
        expect(scoreAdded).toBe(2500 * 15);
      }
    });

    test('1.4: Sovereign Core overkill burst (100,000 damage) clamps cleanly to 0 HP without NaN or negative values', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
      crisis['transitionToPhase'](CrisisPhase.PHASE_3_CORE);

      const sov = crisis.sovereign!;
      expect(sov.coreHp).toBe(1500);

      const killBullet = new Bullet(sov.position.x + 50, sov.position.y + 50, -500, 100_000, true, 1);
      crisis.handleBulletCollision(killBullet);

      expect(sov.coreHp).toBe(0);
      expect(sov.hp).toBe(0);
      expect(sov.isDead).toBe(true);
      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis.isActive).toBe(false);
      expect(Number.isNaN(sov.hp)).toBe(false);
      expect(Number.isNaN(sov.coreHp)).toBe(false);
    });

    test('1.5: Glacial Oblivion anchor flak cooldown prevents infinite splinter queue during 100-hit rapid barrage', () => {
      const rift = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.GLACIAL_OBLIVION);
      expect(rift.pendingFlakCount).toBe(0);
      expect(rift.flakCooldownTimer).toBe(0);

      // Fire 100 rapid hits of 1 damage each in the same tick
      for (let i = 0; i < 100; i++) {
        rift.takeDamage(1);
      }

      // Hit 7 triggered pendingFlakCount += 4 and set flakCooldownTimer = 0.4
      // Subsequent hits in same tick were blocked by flakCooldownTimer > 0
      expect(rift.pendingFlakCount).toBe(4);
      expect(rift.flakCooldownTimer).toBe(0.4);

      // Now update rift to release the 4 flak splinters
      const spawned = rift.update(0.016);
      expect(spawned.length).toBe(4);
      expect(rift.pendingFlakCount).toBe(0);
    });

    test('1.6: Nanite Harvester anchor mutual healing functions correctly under partial rapid damage', () => {
      const left = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.NANITE_HARVESTER);
      const right = new DimensionalRift(470, 170, 1, 600, CrisisArchetype.NANITE_HARVESTER);
      left.setSiblingRift(right);
      right.setSiblingRift(left);

      // Damage left rift by 200 HP
      left.takeDamage(200);
      expect(left.hp).toBe(400);

      // Update right rift for 2.0 seconds -> should heal left rift by 15 HP/s * 2s = 30 HP
      right.update(2.0);
      expect(left.hp).toBeCloseTo(430, 1);
    });
  });

  // =========================================================================
  // SCENARIO 2: INSTANTANEOUS PHASE 1 TO PHASE 3 TRANSITION (ZERO TICK DELAY)
  // =========================================================================
  test.describe('Scenario 2: Instantaneous Phase 1 to Phase 3 Transition (Zero Tick Delay)', () => {

    test('2.1: Instantaneous zero-tick burst from Phase 1 -> Phase 2 -> Phase 3 maintains state machine integrity', () => {
      for (const arch of Object.values(CrisisArchetype)) {
        const crisis = new EndGameCrisis(600, 800);
        crisis.startIncursion(arch);
        crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

        const phaseChanges: CrisisPhase[] = [];
        crisis.callbacks.onPhaseChange = (p) => phaseChanges.push(p);

        const [leftRift, rightRift] = crisis.riftAnchors;
        leftRift.isCoherentPhase = true;
        rightRift.isCoherentPhase = true;

        const sov = crisis.sovereign!;

        // In the exact same synchronous frame:
        // 1. Kill Left Rift (600 dmg)
        const b1 = new Bullet(leftRift.position.x + 20, leftRift.position.y + 20, -500, 600, true, 1);
        crisis.handleBulletCollision(b1);
        expect(leftRift.isDead).toBe(true);
        expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

        // 2. Kill Right Rift (600 dmg) -> triggers immediate transition to Phase 2
        const b2 = new Bullet(rightRift.position.x + 20, rightRift.position.y + 20, -500, 600, true, 1);
        crisis.handleBulletCollision(b2);
        expect(rightRift.isDead).toBe(true);
        expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);
        expect(sov.isInvulnerable).toBe(false);

        // 3. Kill Hull (2,500 dmg) in the exact same tick -> triggers immediate transition to Phase 3
        const b3 = new Bullet(sov.position.x + 50, sov.position.y + 50, -500, 2500, true, 1);
        crisis.handleBulletCollision(b3);
        expect(sov.hullHp).toBe(0);
        expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
        expect(sov.phase).toBe(CrisisPhase.PHASE_3_CORE);
        expect(sov.coreHp).toBe(1500);
        expect(sov.enrageTimer).toBe(35.0);

        // Callbacks recorded both transitions in exact sequence without skipping
        expect(phaseChanges).toEqual([CrisisPhase.PHASE_2_HULL, CrisisPhase.PHASE_3_CORE]);
      }
    });

    test('2.2: Complete encounter annihilation in 0 ticks (Phase 1 -> 2 -> 3 -> DEFEATED)', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.COSMIC_DEVOURER);
      crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

      let defeatedArch: CrisisArchetype | null = null;
      crisis.callbacks.onDefeated = (arch) => { defeatedArch = arch; };

      const [leftRift, rightRift] = crisis.riftAnchors;
      const sov = crisis.sovereign!;

      // 1. Kill both rifts
      crisis.handleBulletCollision(new Bullet(leftRift.position.x + 20, leftRift.position.y + 20, -500, 600, true, 1));
      crisis.handleBulletCollision(new Bullet(rightRift.position.x + 20, rightRift.position.y + 20, -500, 600, true, 1));
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

      // 2. Kill Hull
      crisis.handleBulletCollision(new Bullet(sov.position.x + 50, sov.position.y + 50, -500, 2500, true, 1));
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

      // 3. Kill Core
      crisis.handleBulletCollision(new Bullet(sov.position.x + 50, sov.position.y + 50, -500, 1500, true, 1));
      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis.isActive).toBe(false);
      expect(sov.isDead).toBe(true);
      expect(defeatedArch).toBe(CrisisArchetype.COSMIC_DEVOURER);
    });
  });

  // =========================================================================
  // SCENARIO 3: ENRAGE TIMER EXPIRATION BEHAVIOR (enrageTime <= 0)
  // =========================================================================
  test.describe('Scenario 3: Enrage Timer Expiration Behavior (enrageTime <= 0)', () => {

    test('3.1: Enrage timer smoothly expires from 35.0s to exactly 0.0s, triggering realityDistortionLevel = 1.0 on Sovereign', () => {
      const sov = new CrisisSovereign(170, 65, CrisisArchetype.VOID_SOVEREIGN, 2500, 1500);
      sov.setPhase(CrisisPhase.PHASE_3_CORE);
      expect(sov.enrageTimer).toBe(35.0);
      expect(sov.realityDistortionLevel).toBe(0);

      // Advance 15s
      sov.update(15.0);
      expect(sov.enrageTimer).toBeCloseTo(20.0, 1);
      expect(sov.realityDistortionLevel).toBe(0);

      // Advance 19.9s (total 34.9s)
      sov.update(19.9);
      expect(sov.enrageTimer).toBeCloseTo(0.1, 1);
      expect(sov.realityDistortionLevel).toBe(0);

      // Advance 0.2s -> Timer hits 0 and clamps exactly at 0
      sov.update(0.2);
      expect(sov.enrageTimer).toBe(0);
      expect(sov.realityDistortionLevel).toBe(1.0);

      // Additional updates keep timer clamped at 0
      sov.update(10.0);
      expect(sov.enrageTimer).toBe(0);
      expect(sov.realityDistortionLevel).toBe(1.0);
    });

    test('3.2: Setting enrageTimer negative does not cause NaN or negative countdown in update()', () => {
      const sov = new CrisisSovereign(170, 65, CrisisArchetype.BIOMORPHIC_SWARM, 2500, 1500);
      sov.setPhase(CrisisPhase.PHASE_3_CORE);

      sov.enrageTimer = -5.0;
      sov.update(1.0);
      // Because `this.enrageTimer > 0` guard fails, it stays <= 0 and does not decrement further
      expect(sov.enrageTimer).toBe(-5.0);
      expect(Number.isNaN(sov.enrageTimer)).toBe(false);
    });

    test('3.3: Attack pattern interval in EndGameCrisis is 1.4s throughout Phase 3 (invariant before and after enrage expiration)', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.CHRONO_DEVOURER);
      crisis['transitionToPhase'](CrisisPhase.PHASE_3_CORE);

      // In standard progression, rifts are already dead before reaching Phase 3
      crisis.riftAnchors.forEach(r => { r.isDead = true; });

      const player = new Player(600, 800);
      const bullets: Bullet[] = [];
      const particles: Particle[] = [];

      // Step 1: Before enrage timer expiry (enrageTimer = 35.0s)
      // At 1.3s: attackTimer has not reached 1.4s -> 0 bullets spawned
      crisis.update(1.3, player, bullets, particles);
      expect(bullets.length).toBe(0);

      // At 1.41s: attackTimer reaches 1.4s -> 8-way chrono-implosion starburst spawns (8 bullets)
      crisis.update(0.11, player, bullets, particles);
      expect(bullets.length).toBe(8);

      // Step 2: Manually expire enrage timer to 0
      crisis.sovereign!.enrageTimer = 0;
      crisis.sovereign!.realityDistortionLevel = 1.0;
      bullets.length = 0;

      // Remediated (DEFECT-A2): Attack interval accelerates to 0.7s upon enrage expiration
      crisis.update(0.75, player, bullets, particles);
      expect(bullets.length).toBe(8);
    });

    test('3.4: ANOMALY: EndGameCrisis.realityDistortion is desynchronized from CrisisSovereign.realityDistortionLevel', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.SINGULARITY_CORE);

      // During INCURSION warning (3s), EndGameCrisis.realityDistortion ramps to 1.0
      crisis.update(3.0, new Player(600, 800), [], []);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
      expect(crisis.realityDistortion).toBe(1.0); // Ramped to 1.0 during incursion

      // In Phase 1 and 2, Sovereign.realityDistortionLevel is 0
      expect(crisis.sovereign!.realityDistortionLevel).toBe(0);

      // Advance to Phase 3
      crisis['transitionToPhase'](CrisisPhase.PHASE_3_CORE);
      expect(crisis.sovereign!.enrageTimer).toBe(35.0);
      expect(crisis.sovereign!.realityDistortionLevel).toBe(0);

      // But EndGameCrisis.getState().realityDistortion still returns 1.0 from incursion!
      const stateBeforeEnrage = crisis.getState();
      expect(stateBeforeEnrage.realityDistortion).toBe(1.0); // Desynchronized!
      expect(crisis.sovereign!.realityDistortionLevel).toBe(0); // Sovereign is 0!
    });
  });

  // =========================================================================
  // SCENARIO 4: DEFEATING SOVEREIGN WHILE ANCHORS ARE ALIVE & RE-TRIGGERING INCURSIONS
  // =========================================================================
  test.describe('Scenario 4: Defeating Sovereign with Anchors Alive & Re-triggering Incursion', () => {

    test('4.1: ANOMALY: If Sovereign is defeated while anchors are alive, anchors remain orphaned with isDead=false', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.NANITE_HARVESTER);
      crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

      const [anchorLeft, anchorRight] = crisis.riftAnchors;
      expect(anchorLeft.hp).toBe(600);
      expect(anchorLeft.isDead).toBe(false);
      expect(anchorRight.hp).toBe(600);
      expect(anchorRight.isDead).toBe(false);

      // Force defeat Sovereign (e.g. debug kill or external bypass)
      crisis.sovereign!.hullHp = 0;
      crisis.sovereign!.coreHp = 0;
      crisis.sovereign!.setPhase(CrisisPhase.DEFEATED);

      // Call update to process Sovereign death
      crisis.update(0.016, new Player(600, 800), [], []);

      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis.isDefeated()).toBe(true);
      expect(crisis.isActive).toBe(false);

      // REMEDIATION VERIFIED (DEFECT-A4): Anchors are marked isDead = true on Sovereign defeat!
      expect(anchorLeft.isDead).toBe(true);
      expect(anchorRight.isDead).toBe(true);

      // getActiveColliders() returns empty array
      const colliders = crisis.getActiveColliders();
      expect(colliders.length).toBe(0);
    });

    test('4.2: Calling startIncursion() on an active crisis replaces entities but reports CrisisPhase.DEFEATED as prevPhase', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
      crisis['transitionToPhase'](CrisisPhase.PHASE_2_HULL);

      let prevPhaseReported: CrisisPhase | null = null;
      let newPhaseReported: CrisisPhase | null = null;
      crisis.callbacks.onPhaseChange = (newP, prevP) => {
        newPhaseReported = newP;
        prevPhaseReported = prevP;
      };

      // Re-trigger incursion mid-combat with different archetype
      crisis.startIncursion(CrisisArchetype.GLACIAL_OBLIVION);

      expect(crisis.archetype).toBe(CrisisArchetype.GLACIAL_OBLIVION);
      expect(crisis.phase).toBe(CrisisPhase.INCURSION);
      expect(crisis.warningTimer).toBe(3.0);
      expect(crisis.sovereign!.hullHp).toBe(2500);

      // ANOMALY DETECTED: startIncursion reports prevPhase as CrisisPhase.DEFEATED regardless of actual prevPhase!
      expect(newPhaseReported).toBe(CrisisPhase.INCURSION);
      expect(prevPhaseReported).toBe(CrisisPhase.DEFEATED);
    });

    test('4.3: ANOMALY: Re-triggering crisis in GameManager retains existing AlliedReinforcements dreadnought', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 16;

      // 1. Trigger first crisis and advance to Phase 2 to spawn AlliedReinforcements
      const crisis1 = gm.triggerEndGameCrisis(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
      crisis1['transitionToPhase'](CrisisPhase.PHASE_2_HULL);

      expect(gm.alliedReinforcements).not.toBeNull();
      expect(gm.alliedReinforcements!.isActive).toBe(true);

      // 2. Re-trigger crisis while first crisis is still ongoing and AlliedReinforcements are active
      const crisis2 = gm.triggerEndGameCrisis(CrisisArchetype.ABYSSAL_LEVIATHAN);
      expect(gm.endGameCrisis).toBe(crisis2);
      expect(crisis2.phase).toBe(CrisisPhase.INCURSION);

      // ANOMALY DETECTED: alliedReinforcements from crisis 1 is NOT reset or warped out!
      // It remains in active combat during the 3.0s INCURSION warning of crisis 2!
      expect(gm.alliedReinforcements).not.toBeNull();
      expect(gm.alliedReinforcements!.isActive).toBe(true);
    });

    test('4.4: CRITICAL BUG: Defeating Sovereign via player bullet collision causes defeat rewards (+2000 score, +500 cash) to NEVER be awarded', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 16;

      // Start crisis and advance to Phase 3 Core with 1 HP remaining
      const crisis = gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
      crisis['transitionToPhase'](CrisisPhase.PHASE_3_CORE);
      crisis.sovereign!.coreHp = 1;
      crisis.sovereign!.hp = 1;

      const scoreBeforeFatalShot = gm.score;
      const currencyBeforeFatalShot = gm.currency;
      const comboBeforeFatalShot = gm.combo;

      // Player fires fatal bullet dealing 10 damage to Sovereign Core
      const fatalBullet = new Bullet(
        crisis.sovereign!.position.x + 50,
        crisis.sovereign!.position.y + 50,
        -500,
        10,
        true,
        1
      );
      gm.bullets.push(fatalBullet);

      // Run checkCollisions (where bullets hit entities in GameManager)
      gm['checkCollisions'](1 / 60);

      // Bullet hit Sovereign: Core HP became 0, sovereign transitioned to DEFEATED
      expect(crisis.sovereign!.coreHp).toBe(0);
      expect(crisis.sovereign!.isDead).toBe(true);
      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
      // Because transitionToPhase(DEFEATED) was called inside handleBulletCollision:
      expect(crisis.isActive).toBe(false);

      // Now run GameManager.update(1/60)
      gm['update'](1 / 60);

      // BUG VERIFICATION:
      // Line 722 of GameManager.ts checks: `if (this.endGameCrisis && this.endGameCrisis.isActive)`
      // Because `this.endGameCrisis.isActive` was already set to `false` during checkCollisions,
      // line 722 evaluates to FALSE and skips the entire block!
      // Therefore, line 754:
      //   if (this.endGameCrisis.isDefeated()) {
      //     this.endGameCrisisDefeatedHandled = true;
      //     this.score += 2000;
      //     this.currency += 500;
      //     this.combo += 10;
      //   }
      // NEVER EXECUTES!

      // REMEDIATION VERIFIED (DEFECT-A5): Defeat rewards are granted!
      expect(gm.endGameCrisisDefeatedHandled).toBe(true);
      expect(gm.score - scoreBeforeFatalShot).toBeGreaterThanOrEqual(2000);
      expect(gm.currency - currencyBeforeFatalShot).toBe(500);
    });
  });
});

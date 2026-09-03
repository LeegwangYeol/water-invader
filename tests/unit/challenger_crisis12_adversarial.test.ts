import { test, expect } from '@playwright/test';
import { AlliedReinforcements } from '../../src/game/crisis/AlliedReinforcements';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { CrisisArchetype, CrisisPhase, CRISIS_ARCHETYPE_CONFIGS } from '../../src/game/crisis/types';
import { Player } from '../../src/game/Player';
import { Enemy } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { Faction, EnemyType, GameState } from '../../src/game/types';
import { GameManager } from '../../src/game/GameManager';

/**
 * Challenger 2 Adversarial & Empirical Test Harness
 */
test.describe('Challenger 2 Empirical Combat & Reinforcements Suite', () => {

  // =========================================================================
  // 1. FORWARD PLASMA CANNONS DEAL GENUINE DAMAGE TO SOVEREIGN & ENEMIES
  // =========================================================================
  test('CHALLENGE-01: Allied forward plasma cannons deal genuine damage to Sovereign Hull, Sovereign Core, and Enemies', () => {
    const allied = new AlliedReinforcements(600, 800);
    allied.isWarpingIn = false;
    allied.warpTimer = 0;

    const player = new Player(600, 800);
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.CYBERNETIC_EXTERMINATOR);

    // 1A. Fire in Phase 2: verify plasma cannon deals genuine damage to Sovereign Hull
    crisis['transitionToPhase'](CrisisPhase.PHASE_2_HULL);
    const initialHull = crisis.sovereign!.hullHp; // 2500
    expect(initialHull).toBe(2500);

    const fleetShots = allied.update(0.85, player, [], [], crisis);
    // Fleet shots include heavy plasma cannons (damage 3) and escort blasters (damage 1)
    const plasmaCannons = fleetShots.filter(b => b.damage === 3 && b.piercing === 2);
    expect(plasmaCannons.length).toBe(2);

    for (const bolt of plasmaCannons) {
      expect(bolt.faction).toBe(Faction.PLAYER);
      expect(bolt.damage).toBe(3);
      expect(bolt.piercing).toBe(2);
      expect(bolt.isInterceptable).toBe(false);

      // Force bolt position to collide with Sovereign
      const core = crisis.sovereign!.getCoreCenter();
      bolt.position.x = core.x - bolt.size.width / 2;
      bolt.position.y = core.y - bolt.size.height / 2;

      const hit = crisis.handleBulletCollision(bolt);
      expect(hit).toBe(true);
    }

    // Two bolts dealing 3 damage each = 6 damage to Sovereign Hull
    expect(crisis.sovereign!.hullHp).toBe(2500 - 6);

    // 1B. Fire in Phase 3: verify plasma cannon deals genuine damage to Sovereign Core
    crisis['transitionToPhase'](CrisisPhase.PHASE_3_CORE);
    const initialCore = crisis.sovereign!.coreHp; // 1500
    expect(initialCore).toBe(1500);

    const phase3FleetShots = allied.update(0.85, player, [], [], crisis);
    const phase3Cannons = phase3FleetShots.filter(b => b.damage === 3 && b.piercing === 2);
    expect(phase3Cannons.length).toBe(2);

    for (const bolt of phase3Cannons) {
      const core = crisis.sovereign!.getCoreCenter();
      bolt.position.x = core.x - bolt.size.width / 2;
      bolt.position.y = core.y - bolt.size.height / 2;
      crisis.handleBulletCollision(bolt);
    }
    expect(crisis.sovereign!.coreHp).toBe(1500 - 6);

    // 1C. Fire into normal enemies: verify damage reduction and kills
    const enemy = new Enemy(150, 150, EnemyType.NORMAL);
    enemy.hp = 5;
    const enemyFleetShots = allied.update(0.85, player, [enemy], [], null);
    const enemyCannons = enemyFleetShots.filter(b => b.damage === 3 && b.piercing === 2);
    expect(enemyCannons.length).toBe(2);

    // First bolt deals 3 damage to enemy (5 - 3 = 2)
    const b0 = enemyCannons[0];
    b0.position.x = enemy.position.x + 5;
    b0.position.y = enemy.position.y + 5;
    if (b0.checkCollision(enemy)) {
      enemy.hp -= b0.damage;
    }
    expect(enemy.hp).toBe(2);

    // Second bolt finishes enemy (2 - 3 <= 0 -> dead)
    const b1 = enemyCannons[1];
    b1.position.x = enemy.position.x + 5;
    b1.position.y = enemy.position.y + 5;
    if (b1.checkCollision(enemy)) {
      enemy.hp -= b1.damage;
      if (enemy.hp <= 0) enemy.isDead = true;
    }
    expect(enemy.hp).toBeLessThanOrEqual(0);
    expect(enemy.isDead).toBe(true);
  });

  // =========================================================================
  // 2. 120PX POINT-DEFENSE LASER GRID VAPORIZATION & PLAYER PRESERVATION
  // =========================================================================
  test('CHALLENGE-02: 120px point-defense laser grid vaporizes hostile projectiles and preserves player projectiles under 1,000-bullet barrage', () => {
    const allied = new AlliedReinforcements(600, 800);
    // Anchor in stable combat position
    allied.isWarpingIn = false;
    allied.warpTimer = 0;
    allied.position.y = allied.targetY;

    const player = new Player(600, 800);
    player.position.x = 270;
    player.position.y = 720;

    const dreadCenter = {
      x: allied.position.x + allied.size.width / 2,
      y: allied.targetY + allied.size.height / 2,
    };
    const playerCenter = {
      x: player.position.x + player.size.width / 2,
      y: player.position.y + player.size.height / 2,
    };

    // Construct 1,000 mixed bullets
    const bullets: Bullet[] = [];
    let expectedVaporizedHostiles = 0;
    let expectedPreservedHostiles = 0;
    let expectedPreservedPlayer = 0;

    for (let i = 0; i < 1000; i++) {
      const isPlayer = i % 3 === 0;
      const angle = (i / 1000) * Math.PI * 2;
      const distFromPlayer = (i % 250) + 10; // Range 10px to 260px
      const bx = playerCenter.x + Math.cos(angle) * distFromPlayer;
      const by = playerCenter.y + Math.sin(angle) * distFromPlayer;

      const bullet = new Bullet(bx, by, isPlayer ? -400 : 200, 1, isPlayer);
      bullet.faction = isPlayer ? Faction.PLAYER : Faction.INVADER;

      // The PD grid calculates distance using the bullet center:
      const bulletCenterX = bullet.position.x + bullet.size.width / 2;
      const bulletCenterY = bullet.position.y + bullet.size.height / 2;

      const dP = Math.hypot(bulletCenterX - playerCenter.x, bulletCenterY - playerCenter.y);
      const dD = Math.hypot(bulletCenterX - dreadCenter.x, bulletCenterY - dreadCenter.y);
      const withinPerimeter = dP <= 120 || dD <= 120;

      if (!isPlayer && withinPerimeter) {
        expectedVaporizedHostiles++;
      } else if (!isPlayer && !withinPerimeter) {
        expectedPreservedHostiles++;
      } else if (isPlayer) {
        expectedPreservedPlayer++;
      }

      bullets.push(bullet);
    }

    allied.update(0.016, player, [], bullets, null);

    let vaporizedCount = 0;
    let preservedHostilesCount = 0;
    let preservedPlayerCount = 0;

    for (const b of bullets) {
      if (b.faction === Faction.INVADER) {
        if (b.isDead) vaporizedCount++;
        else preservedHostilesCount++;
      } else {
        if (!b.isDead) preservedPlayerCount++;
      }
    }

    expect(vaporizedCount).toBe(expectedVaporizedHostiles);
    expect(preservedHostilesCount).toBe(expectedPreservedHostiles);
    expect(preservedPlayerCount).toBe(expectedPreservedPlayer);
    expect(allied.pdLaserBeams.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // 3. RESTORATIVE NANO-SHIELD AURA HEALS HP AND REDUCES STRESS
  // =========================================================================
  test('CHALLENGE-03: Restorative nano-shield aura heals player HP by +1 exactly every 5.0s and reduces combat stress / suppression', () => {
    const allied = new AlliedReinforcements(600, 800);
    allied.isWarpingIn = false;
    const player = new Player(600, 800);

    player.hp = 1;
    player.maxHp = 4;
    player.stressLevel = 90;
    player.suppressionLevel = 80;

    // Advance 4.95s in small increments
    for (let i = 0; i < 99; i++) {
      allied.update(0.05, player, [], [], null);
    }
    // No heal yet
    expect(player.hp).toBe(1);
    expect(player.stressLevel).toBe(90);
    expect(player.suppressionLevel).toBe(80);

    // Cross 5.0s mark
    allied.update(0.06, player, [], [], null);
    expect(player.hp).toBe(2);
    expect(player.stressLevel).toBe(65); // 90 - 25
    expect(player.suppressionLevel).toBe(55); // 80 - 25

    // Second cycle (cross 10.0s)
    allied.update(5.01, player, [], [], null);
    expect(player.hp).toBe(3);
    expect(player.stressLevel).toBe(40); // 65 - 25
    expect(player.suppressionLevel).toBe(30); // 55 - 25

    // Third cycle (cross 15.0s) -> reaches maxHp (4)
    allied.update(5.01, player, [], [], null);
    expect(player.hp).toBe(4);
    expect(player.stressLevel).toBe(15);
    expect(player.suppressionLevel).toBe(5);

    // Fourth cycle (cross 20.0s) -> clamps at maxHp and clamps stress/suppression at 0
    allied.update(5.01, player, [], [], null);
    expect(player.hp).toBe(4);
    expect(player.stressLevel).toBe(0);
    expect(player.suppressionLevel).toBe(0);
  });

  // =========================================================================
  // 4. ESCORT INTERCEPTORS FLANKING FORMATION & SUPPRESSING BLASTERS
  // =========================================================================
  test('CHALLENGE-04: Escort interceptors maintain formation tracking across violent player maneuvers and fire suppressing blasters', () => {
    const allied = new AlliedReinforcements(600, 800);
    allied.isWarpingIn = false;
    const player = new Player(600, 800);

    // Initial player position
    player.position.x = 100;
    player.position.y = 600;

    // Simulate 1.0s to establish formation
    for (let step = 0; step < 20; step++) {
      allied.update(0.05, player, [], [], null);
    }

    const [f0, f1] = allied.escortFighters;
    expect(f0.x).toBeLessThan(player.position.x);
    expect(f1.x).toBeGreaterThan(player.position.x + player.size.width);

    // Sudden rapid player dash to the far right: x = 450
    player.position.x = 450;
    allied.update(0.05, player, [], [], null);

    // Fighters should have positive lateral velocity and positive roll angle
    expect(f0.vx).toBeGreaterThan(0);
    expect(f0.rollAngle).toBeGreaterThan(0);

    // After letting formation converge
    for (let step = 0; step < 25; step++) {
      allied.update(0.05, player, [], [], null);
    }
    expect(f0.x).toBeLessThan(player.position.x);
    expect(f1.x).toBeGreaterThan(player.position.x + player.size.width);

    // Verify blasters fire on cadence
    const suppressingBolts = allied.update(0.65, player, [], [], null);
    const escortBolts = suppressingBolts.filter(b => b.color === '#06b6d4');
    expect(escortBolts.length).toBeGreaterThan(0);
    for (const b of escortBolts) {
      expect(b.damage).toBe(1);
      expect(b.velocity.y).toBe(-420);
      expect(b.faction).toBe(Faction.PLAYER);
    }
  });

  // =========================================================================
  // 5. WARP-IN AND WARP-OUT TRANSITIONS
  // =========================================================================
  test('CHALLENGE-05: Warp-in descent and warp-out departure lifecycle transitions', () => {
    const allied = new AlliedReinforcements(600, 800);
    const player = new Player(600, 800);

    expect(allied.isWarpingIn).toBe(true);
    expect(allied.isWarpingOut).toBe(false);
    expect(allied.isActive).toBe(true);
    expect(allied.warpTimer).toBe(2.0);

    const initialY = allied.position.y;
    // Step forward 1.0s
    allied.update(1.0, player, [], [], null);
    expect(allied.isWarpingIn).toBe(true);
    expect(allied.position.y).toBeLessThan(initialY); // Moved up toward targetY

    // Complete warp-in
    allied.update(1.05, player, [], [], null);
    expect(allied.isWarpingIn).toBe(false);
    expect(allied.warpTimer).toBe(0);
    expect(allied.position.y).toBeCloseTo(allied.targetY, 1);

    // Call warpOut()
    allied.warpOut();
    expect(allied.isWarpingOut).toBe(true);

    // Advance until dismissed off-screen
    while (allied.isActive) {
      allied.update(0.1, player, [], [], null);
    }

    expect(allied.isActive).toBe(false);
    expect(allied.isDismissed).toBe(true);
    expect(allied.position.y).toBeLessThan(-allied.size.height);
  });
});

test.describe('Adversarial 5,200 EHP Invariant & High-DPS Load Testing Suite', () => {

  // =========================================================================
  // ADVERSARIAL TEST 1: PROVE SOVEREIGN CANNOT TAKE DAMAGE IN PHASE 1
  // =========================================================================
  test('ADVERSARIAL-01: Sovereign is strictly invulnerable in Phase 1 under 1,000,000 DPS player barrage', () => {
    for (const arch of Object.values(CrisisArchetype)) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);
      crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

      const sov = crisis.sovereign!;
      expect(sov.isInvulnerable).toBe(true);
      expect(sov.hullHp).toBe(2500);
      expect(sov.coreHp).toBe(1500);

      // Attack Sovereign with 1,000 individual 1,000-damage bullets (1,000,000 total damage)
      for (let i = 0; i < 1000; i++) {
        const bullet = new Bullet(sov.position.x + 50, sov.position.y + 50, -500, 1000, true, 1);
        const hit = crisis.handleBulletCollision(bullet);
        expect(hit).toBe(true);
        expect(bullet.isDead).toBe(true);
      }

      // Sovereign Hull and Core must remain completely unblemished
      expect(sov.hullHp).toBe(2500);
      expect(sov.coreHp).toBe(1500);
      expect(sov.isInvulnerable).toBe(true);

      // Now destroy Anchor 0: Sovereign must STILL be completely invulnerable!
      crisis.riftAnchors[0].takeDamage(3000);
      expect(crisis.riftAnchors[0].isDead).toBe(true);
      expect(crisis.riftAnchors[1].isDead).toBe(false);

      // Barrage again with 500,000 damage
      for (let i = 0; i < 500; i++) {
        const bullet = new Bullet(sov.position.x + 50, sov.position.y + 50, -500, 1000, true, 1);
        crisis.handleBulletCollision(bullet);
      }

      expect(sov.hullHp).toBe(2500);
      expect(sov.coreHp).toBe(1500);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
    }
  });

  // =========================================================================
  // ADVERSARIAL TEST 2: PROVE PHASE 2 ACTIVATES WHEN BOTH ANCHORS DIE
  // =========================================================================
  test('ADVERSARIAL-02: Phase 2 activates if and only if both anchors are dead, with strict hull isolation from overkill', () => {
    for (const arch of Object.values(CrisisArchetype)) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);
      crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

      const [leftRift, rightRift] = crisis.riftAnchors;
      const sov = crisis.sovereign!;

      // Anchor 1 takes lethal damage -> Dies
      leftRift.takeDamage(3000);
      expect(leftRift.isDead).toBe(true);

      // Phase is still Phase 1
      crisis.update(0.016, new Player(600, 800), [], []);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
      expect(sov.isInvulnerable).toBe(true);

      // Anchor 2 takes lethal damage via handleBulletCollision (3,000 damage guarantees death even with NEBULA 80% shield)
      const killBullet = new Bullet(rightRift.position.x + 20, rightRift.position.y + 20, -500, 3000, true, 1);
      crisis.handleBulletCollision(killBullet);
      expect(rightRift.isDead).toBe(true);

      // Phase 2 triggers immediately!
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);
      expect(sov.isInvulnerable).toBe(false);
      expect(sov.hullHp).toBe(2500);
      expect(sov.coreHp).toBe(1500);

      // Overkill test: Deal a single 100,000 damage hit to Sovereign Hull
      const overkillBullet = new Bullet(sov.position.x + 50, sov.position.y + 50, -500, 100000, true, 1);
      crisis.handleBulletCollision(overkillBullet);

      // Hull must be depleted to 0
      expect(sov.hullHp).toBe(0);
      // Zero bleed-through! Core must NOT have taken the remaining 97,500 damage!
      expect(sov.coreHp).toBe(1500);
      // Must have transitioned to Phase 3
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
    }
  });

  // =========================================================================
  // ADVERSARIAL TEST 3: PROVE PHASE 3 ENGAGES 35.0S ENRAGE AND EXACT 1,500 CORE HP
  // =========================================================================
  test('ADVERSARIAL-03: Phase 3 engages exact 35.0s enrage clock and Core absorbs exact 1,500 damage to defeat', () => {
    for (const arch of Object.values(CrisisArchetype)) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      // Transition to Phase 2, then deplete Hull
      crisis['transitionToPhase'](CrisisPhase.PHASE_2_HULL);
      crisis.sovereign!.takeDamage(2500);
      expect(crisis.sovereign!.hullHp).toBe(0);

      // Trigger update to synchronize phase
      crisis.update(0.016, new Player(600, 800), [], []);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

      const sov = crisis.sovereign!;
      // Enrage clock verification
      expect(sov.enrageTimer).toBe(35.0);
      expect(sov.enrageMaxTime).toBe(35.0);
      expect(sov.coreHp).toBe(1500);

      // Enrage countdown: advance 20.0s
      sov.update(20.0);
      expect(sov.enrageTimer).toBe(15.0);
      expect(sov.realityDistortionLevel).toBeLessThan(1.0);

      // Advance remaining 15.0s -> enrage clock expires
      sov.update(15.1);
      expect(sov.enrageTimer).toBe(0);
      expect(sov.realityDistortionLevel).toBe(1.0);

      // Deal exactly 1,499 damage to Core -> Sovereign is still alive
      sov.takeDamage(1499);
      expect(sov.coreHp).toBe(1);
      expect(sov.isDead).toBe(false);
      expect(crisis.isDefeated()).toBe(false);

      // Deal the final 1 damage -> Sovereign defeated!
      sov.takeDamage(1);
      expect(sov.coreHp).toBe(0);
      expect(sov.isDead).toBe(true);
      crisis.update(0.016, new Player(600, 800), [], []);
      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis.isDefeated()).toBe(true);
    }
  });

  // =========================================================================
  // ADVERSARIAL TEST 4: STRICT 5,200 EHP MATHEMATICAL PROOF UNDER ARBITRARY DPS
  // =========================================================================
  test('ADVERSARIAL-04: Mathematical proof that encounter absorbs exactly 5,200 total EHP across all 12 archetypes', () => {
    for (const arch of Object.values(CrisisArchetype)) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);
      crisis['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);

      // Ensure coherent phase for NEBULA_PHANTASM so 1 raw damage = 1 effective damage
      crisis.riftAnchors[0].isCoherentPhase = true;
      crisis.riftAnchors[1].isCoherentPhase = true;

      let totalDamageAbsorbed = 0;

      // 1. Damage Left Anchor in 3 chunks of 200 (total 600)
      for (let i = 0; i < 3; i++) {
        const b = new Bullet(crisis.riftAnchors[0].position.x + 20, crisis.riftAnchors[0].position.y + 20, -500, 200, true, 1);
        crisis.handleBulletCollision(b, (pts) => { totalDamageAbsorbed += pts / 10; });
      }
      expect(crisis.riftAnchors[0].hp).toBe(0);
      expect(crisis.riftAnchors[0].isDead).toBe(true);

      // 2. Damage Right Anchor in 6 chunks of 100 (total 600)
      for (let i = 0; i < 6; i++) {
        const b = new Bullet(crisis.riftAnchors[1].position.x + 20, crisis.riftAnchors[1].position.y + 20, -500, 100, true, 1);
        crisis.handleBulletCollision(b, (pts) => { totalDamageAbsorbed += pts / 10; });
      }
      expect(crisis.riftAnchors[1].hp).toBe(0);
      expect(crisis.riftAnchors[1].isDead).toBe(true);

      expect(totalDamageAbsorbed).toBe(1200);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

      // 3. Damage Hull in 10 chunks of 250 (total 2500)
      for (let i = 0; i < 10; i++) {
        const b = new Bullet(crisis.sovereign!.position.x + 50, crisis.sovereign!.position.y + 50, -500, 250, true, 1);
        crisis.handleBulletCollision(b, (pts) => { totalDamageAbsorbed += pts / 15; });
      }
      expect(crisis.sovereign!.hullHp).toBe(0);
      expect(totalDamageAbsorbed).toBe(3700); // 1200 + 2500

      // 4. Damage Core in 3 chunks of 500 (total 1500)
      for (let i = 0; i < 3; i++) {
        const b = new Bullet(crisis.sovereign!.position.x + 50, crisis.sovereign!.position.y + 50, -500, 500, true, 1);
        crisis.handleBulletCollision(b, (pts) => { totalDamageAbsorbed += pts / 15; });
      }
      expect(crisis.sovereign!.coreHp).toBe(0);
      expect(totalDamageAbsorbed).toBe(5200); // 1200 + 2500 + 1500

      crisis.update(0.016, new Player(600, 800), [], []);
      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
    }
  });
});

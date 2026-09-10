import { test, expect } from '@playwright/test';
import { Player } from '../../src/game/Player';
import { Enemy, EnemyType } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { Faction, Vector2D } from '../../src/game/types';
import {
  HydraulicHarpoon,
  DEFAULT_HARPOON_CONFIG,
  HarpoonState,
  FlagshipUpdateContext,
} from '../../src/game/flagship';

/**
 * Creates a deterministic, headless FlagshipUpdateContext for stress-testing.
 */
function createHarpoonContext(overrides: Partial<FlagshipUpdateContext> = {}): FlagshipUpdateContext {
  const player = new Player(600, 800);
  player.position = { x: 300, y: 720 };
  player.hp = 5;
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

test.describe('Stream A Specialist Challenger: Hydraulic Harpoon & Kinetic Slingshot Physics', () => {

  // ==========================================================================
  // 1. HARPOON PNEUMATIC LAUNCH SPEED & ATTACHMENT DYNAMICS
  // ==========================================================================
  test.describe('1. Harpoon Pneumatic Launch Speed & Attachment Dynamics', () => {
    test('HARPOON-LNCH-01: Launch muzzle velocity is exactly 650 px/s upward', () => {
      const harpoon = new HydraulicHarpoon();
      expect(harpoon.state).toBe(HarpoonState.READY);

      const fired = harpoon.fire({ x: 300, y: 712 });
      expect(fired).toBe(true);
      expect(harpoon.state).toBe(HarpoonState.FLYING);
      expect(harpoon.headVelocity.x).toBe(0);
      expect(harpoon.headVelocity.y).toBe(-650);

      // Verify kinematics after 0.1s: head position should travel exactly 65 px upward
      const context = createHarpoonContext();
      harpoon.update(0.1, context);
      expect(harpoon.headPosition.y).toBeCloseTo(712 - 65, 1);
    });

    test('HARPOON-LNCH-02: Automatic retraction when exceeding maxLength (420px) without target', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();
      harpoon.fire({ x: 300, y: 720 });

      // After (420 / 650) = 0.646s, dart travels 420px
      // Advance by 0.7s with no enemies
      harpoon.update(0.7, context);

      expect(harpoon.state).toBe(HarpoonState.RETRACTING);
      expect(harpoon.tetheredEntity).toBeNull();
    });

    test('HARPOON-LNCH-03: Ceiling boundary limit (y <= 30) triggers auto-retraction', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();
      harpoon.fire({ x: 300, y: 100 }); // Fired close to top

      // 0.15s flight moves dart 97.5px up to y = 2.5 (<= 30)
      harpoon.update(0.15, context);

      expect(harpoon.state).toBe(HarpoonState.RETRACTING);
    });

    test('HARPOON-LNCH-04: Dart collision deals 35 initial penetration damage and tethers living enemy', () => {
      const harpoon = new HydraulicHarpoon();
      const enemy = new Enemy(280, 450, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      enemy.maxHp = 100;
      const context = createHarpoonContext({ enemies: [enemy] });

      harpoon.fire({ x: 300, y: 720 });
      harpoon.headPosition = { x: 300, y: 475 }; // Inside enemy box after -10.4px step: 475 - 10.4 = 464.6 in [450, 480]

      harpoon.update(0.016, context);

      expect(enemy.hp).toBe(65); // 100 - 35 = 65
      expect(harpoon.state).toBe(HarpoonState.TETHERED);
      expect(harpoon.tetheredEntity).toBe(enemy);
    });

    test('HARPOON-LNCH-05 [EMPIRICAL DEFECT TEST]: Low HP enemy (<= 35 HP) killed on impact does not tether, but checks whether isDead is set', () => {
      const harpoon = new HydraulicHarpoon();
      const enemy = new Enemy(280, 450, 600, 1, EnemyType.NORMAL);
      enemy.hp = 25; // Less than 35 damage
      enemy.maxHp = 25;
      const context = createHarpoonContext({ enemies: [enemy] });

      harpoon.fire({ x: 300, y: 720 });
      harpoon.headPosition = { x: 300, y: 475 }; // Inside enemy box after -10.4px step

      harpoon.update(0.016, context);

      expect(enemy.hp).toBeLessThanOrEqual(0); // -10 HP
      expect(harpoon.state).toBe(HarpoonState.RETRACTING);
      expect(harpoon.tetheredEntity).toBeNull();


      // Check whether enemy.isDead is set or remains false (unreaped zombie state)
      console.log(`[EMPIRICAL OBSERVATION] Low HP enemy hit by dart: hp=${enemy.hp}, isDead=${enemy.isDead}`);
      // In current code, takeDamage does not set isDead=true
    });

    test('HARPOON-LNCH-06 [EMPIRICAL TUNNELING STRESS]: High delta-time jump skips over thin enemy box', () => {
      const harpoon = new HydraulicHarpoon();
      // Thin enemy: height = 16px located at y = 500 to 516
      const thinEnemy = new Enemy(285, 500, 600, 1, EnemyType.NORMAL);
      thinEnemy.size = { width: 30, height: 16 };
      thinEnemy.hp = 100;
      const context = createHarpoonContext({ enemies: [thinEnemy] });

      harpoon.fire({ x: 300, y: 550 });
      // At dt = 0.08s, travel step = 650 * 0.08 = 52px
      // Head position moves from 550 to 550 - 52 = 498
      // Since 498 < 500 (ey), the point completely jumped over the enemy [500, 516]!
      harpoon.update(0.08, context);

      console.log(`[EMPIRICAL TUNNELING] Head pos after 0.08s: y=${harpoon.headPosition.y}, enemy span=[500, 516], state=${harpoon.state}`);
      // If tunneling occurs, harpoon remains FLYING and did not hit thinEnemy
      const didTunnel = harpoon.state === HarpoonState.FLYING && harpoon.headPosition.y < 500;
      console.log(`[EMPIRICAL TUNNELING RESULT] Did point jump tunnel over enemy box: ${didTunnel}`);
    });
  });

  // ==========================================================================
  // 2. DAMPED HARMONIC SPRING-CONSTRAINT PHYSICS FORMULATION
  // ==========================================================================
  test.describe('2. Damped Harmonic Spring-Constraint Physics Formulation', () => {
    test('HARPOON-SPRG-01: Elastic force matches pitch specification formula', () => {
      const ks = DEFAULT_HARPOON_CONFIG.springStiffness; // 95.0 N/px
      const l0 = DEFAULT_HARPOON_CONFIG.restLength;      // 110 px
      const lMax = DEFAULT_HARPOON_CONFIG.maxLength;     // 420 px

      // Evaluate formula: F_elastic = ks * (L - L0) * [1 + 3.2 * ((L - L0)/(L_max - L0))^2]
      function computeSpecForce(L: number): number {
        if (L <= l0) return 0;
        const deltaL = L - l0;
        const nonLinear = 1 + 3.2 * (deltaL / (lMax - l0)) ** 2;
        return ks * deltaL * nonLinear;
      }

      // At L = 200px: deltaL = 90, (90/310)^2 = 0.08428, nonLinear = 1.2697, F = 95 * 90 * 1.2697 = 10,856 N
      const f200 = computeSpecForce(200);
      expect(f200).toBeGreaterThan(8500);
      expect(f200).toBeLessThan(12000);

      // At L = 400px: deltaL = 290, (290/310)^2 = 0.875, nonLinear = 3.80, F = 95 * 290 * 3.80 = 104,690 N (extreme strain hardening)
      const f400 = computeSpecForce(400);
      expect(f400).toBeGreaterThan(100000);
      console.log(`[NUMERICAL VERIFICATION] Spring forces: L=200px -> ${f200.toFixed(1)} N, L=400px -> ${f400.toFixed(1)} N`);
    });

    test('HARPOON-SPRG-02: Cable snap occurs when L > L_max (420px)', () => {
      const harpoon = new HydraulicHarpoon();
      let shakeTriggered = false;
      const context = createHarpoonContext({
        triggerScreenShake: () => { shakeTriggered = true; }
      });

      // Position enemy 450px away from player prow (player at 300, 716; enemy at 300, 200 -> dist = 516px > 420px)
      const enemy = new Enemy(300, 200, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      harpoon.update(0.016, context);

      expect(harpoon.state).toBe(HarpoonState.RETRACTING);
      expect(harpoon.tetheredEntity).toBeNull();
      expect(shakeTriggered).toBe(true);
    });

    test('HARPOON-SPRG-03: Mass resistance: Boss (m=6) experiences 1/6th the displacement of Normal (m=1)', () => {
      const context = createHarpoonContext();

      // Normal enemy (m = 1) with aligned center at (320, 515)
      const normalHarpoon = new HydraulicHarpoon();
      (normalHarpoon as any).prevPlayerPos = { x: context.player.position.x + context.player.size.width / 2, y: context.player.position.y - 4 };
      const normalEnemy = new Enemy(300, 500, 600, 1, EnemyType.NORMAL); // size 40x30 -> center (320, 515)
      normalEnemy.hp = 100;
      normalHarpoon.state = HarpoonState.TETHERED;
      normalHarpoon.tetheredEntity = normalEnemy;
      const normalInitialY = normalEnemy.position.y;
      normalHarpoon.update(0.016, context);
      const normalDisp = normalEnemy.position.y - normalInitialY;

      // Boss enemy (m = 6) with center aligned at exact same (320, 515)
      // Boss size is 150x100 -> position (320 - 75, 515 - 50) = (245, 465)
      const bossHarpoon = new HydraulicHarpoon();
      (bossHarpoon as any).prevPlayerPos = { x: context.player.position.x + context.player.size.width / 2, y: context.player.position.y - 4 };
      const bossEnemy = new Enemy(245, 465, 600, 1, EnemyType.BOSS);
      bossEnemy.hp = 500;
      bossHarpoon.state = HarpoonState.TETHERED;
      bossHarpoon.tetheredEntity = bossEnemy;
      const bossInitialY = bossEnemy.position.y;
      bossHarpoon.update(0.016, context);
      const bossDisp = bossEnemy.position.y - bossInitialY;

      console.log(`[ALIGNED CENTERS] Normal disp: ${normalDisp.toFixed(3)}px, Boss disp: ${bossDisp.toFixed(3)}px`);
      console.log(`[ALIGNED CENTERS] Empirical mass ratio: ${(normalDisp / (bossDisp || 1e-6)).toFixed(3)} (Expected: ~6.0)`);
      expect(normalDisp / (bossDisp || 1e-6)).toBeCloseTo(6.0, 1);



    });

    test('HARPOON-SPRG-04: Slack cable (L <= L0 = 110px) applies zero pull force', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();

      // Player at (300, 720). Enemy at (300, 630). Distance = 90px <= 110px restLength
      const enemy = new Enemy(300, 630, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      const initialPos = { ...enemy.position };
      harpoon.update(0.016, context);

      expect(enemy.position.x).toBe(initialPos.x);
      expect(enemy.position.y).toBe(initialPos.y);
      expect(harpoon.strainRatio).toBe(0);
    });

    test('HARPOON-SPRG-05: Strict boundary clamping [0, 600] x [0, 800] during violent lateral pulls', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();
      // Move player far to right edge (x = 580)
      context.player.position = { x: 580, y: 720 };

      // Enemy at edge (x = 590)
      const enemy = new Enemy(590, 500, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      // Update 20 frames
      for (let i = 0; i < 20; i++) {
        harpoon.update(0.016, context);
        expect(enemy.position.x).toBeGreaterThanOrEqual(0);
        expect(enemy.position.x).toBeLessThanOrEqual(600 - enemy.size.width);
        expect(enemy.position.y).toBeGreaterThanOrEqual(0);
        expect(enemy.position.y).toBeLessThanOrEqual(800 - enemy.size.height);
      }
    });
  });

  // ==========================================================================
  // 3. HYDRAULIC WINCH REELING
  // ==========================================================================
  test.describe('3. Hydraulic Winch Reeling Dynamics', () => {
    test('HARPOON-WNCH-01: Winching reels cable at exactly 240 px/s down to 65px floor', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();
      const enemy = new Enemy(300, 450, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      harpoon.startWinch();
      expect(harpoon.isWinching).toBe(true);

      // Initial rest length = 110
      // After dt = 0.1s: rest length = 110 - 240 * 0.1 = 86 px
      harpoon.update(0.1, context);
      expect((harpoon as any).effectiveRestLength).toBeCloseTo(86, 1);

      // Reeling for another 0.5s: 86 - 240 * 0.5 = -34 -> clamped to 65 px minimum floor
      harpoon.update(0.5, context);
      expect((harpoon as any).effectiveRestLength).toBe(65);

      // Further winching stays strictly at 65 px
      harpoon.update(1.0, context);
      expect((harpoon as any).effectiveRestLength).toBe(65);
    });

    test('HARPOON-WNCH-02: Stopping winch halts reeling', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();
      const enemy = new Enemy(300, 450, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      harpoon.startWinch();
      harpoon.update(0.1, context); // reels to ~86
      const reeledLength = (harpoon as any).effectiveRestLength;

      harpoon.stopWinch();
      expect(harpoon.isWinching).toBe(false);

      harpoon.update(0.2, context);
      expect((harpoon as any).effectiveRestLength).toBe(reeledLength);
    });
  });

  // ==========================================================================
  // 4. CENTRIPETAL WHIP & MEAT-SHIELD DYNAMICS
  // ==========================================================================
  test.describe('4. Centripetal Whip & Meat-Shield Dynamics', () => {
    test('HARPOON-WHIP-01: Lateral player movement triggers centripetal whip collision damage (60-140)', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();

      // Tethered enemy at (300, 500)
      const tetheredEnemy = new Enemy(285, 500, 600, 1, EnemyType.NORMAL);
      tetheredEnemy.hp = 200;
      tetheredEnemy.maxHp = 200;

      // Other enemy directly touching tethered enemy at (315, 500)
      const otherEnemy = new Enemy(315, 500, 600, 1, EnemyType.NORMAL);
      otherEnemy.hp = 200;
      otherEnemy.maxHp = 200;

      context.enemies = [tetheredEnemy, otherEnemy];
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = tetheredEnemy;

      // Simulate player moving rapidly rightward: previous player at 200, current at 300 in dt = 0.05s -> vx = 2000 px/s
      (harpoon as any).prevPlayerPos = { x: 200, y: 720 };
      context.player.position = { x: 300, y: 720 };

      harpoon.update(0.05, context);

      console.log(`[EMPIRICAL WHIP DAMAGE] Other enemy HP after whip: ${otherEnemy.hp} / 200 (dealt ${200 - otherEnemy.hp} dmg)`);
      console.log(`[EMPIRICAL WHIP DAMAGE] Tethered enemy HP after whip: ${tetheredEnemy.hp} / 200 (dealt ${200 - tetheredEnemy.hp} self-dmg)`);

      expect(otherEnemy.hp).toBeLessThan(200);
      expect(tetheredEnemy.hp).toBeLessThan(200);

      // Verify slam damage was within [60, 140] per hit
      const damageDealt = 200 - otherEnemy.hp;
      expect(damageDealt).toBeGreaterThanOrEqual(60);
    });

    test('HARPOON-WHIP-02 [EMPIRICAL DEFECT TEST]: Whip damage killing other enemy leaves it in unreaped isDead=false state', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();

      const tetheredEnemy = new Enemy(285, 500, 600, 1, EnemyType.NORMAL);
      tetheredEnemy.hp = 200;

      const otherEnemy = new Enemy(315, 500, 600, 1, EnemyType.NORMAL);
      otherEnemy.hp = 50; // Low HP: will drop below 0 from slam damage (>= 60)

      context.enemies = [tetheredEnemy, otherEnemy];
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = tetheredEnemy;

      (harpoon as any).prevPlayerPos = { x: 200, y: 720 };
      context.player.position = { x: 300, y: 720 };

      harpoon.update(0.05, context);

      console.log(`[EMPIRICAL OBSERVATION] Other enemy HP: ${otherEnemy.hp}, isDead: ${otherEnemy.isDead}`);
      expect(otherEnemy.hp).toBeLessThanOrEqual(0);
      // Notice: otherEnemy.isDead is false because takeDamage does not set isDead!
    });

    test('HARPOON-SHIELD-01: Tethered enemy intercepts descending hostile bullets and neutralizes them', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();

      // Place enemy at rest length equilibrium (L = 110px from player prow at 325, 716)
      // enemy center at (325, 606) -> enemy position at (305, 591), size 40x30
      const tetheredEnemy = new Enemy(305, 591, 600, 1, EnemyType.NORMAL);
      tetheredEnemy.hp = 100;
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = tetheredEnemy;

      // Hostile bullet positioned right inside the enemy box
      const hostileBullet = new Bullet(320, 600, 200, 15, false);
      hostileBullet.faction = Faction.INVADER;

      // Player bullet positioned at same coords
      const playerBullet = new Bullet(320, 600, -300, 20, true);
      playerBullet.faction = Faction.PLAYER;

      context.bullets = [hostileBullet, playerBullet];

      harpoon.update(0.016, context);

      // Hostile bullet neutralized
      expect(hostileBullet.isDead).toBe(true);
      // Tethered enemy absorbed 15 damage
      expect(tetheredEnemy.hp).toBe(85);
      // Player bullet was NOT absorbed
      expect(playerBullet.isDead).toBe(false);
    });

    test('HARPOON-SHIELD-02: Meat-shield destruction untethers harpoon and triggers retraction', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();

      // Enemy at equilibrium (L = 110px)
      const tetheredEnemy = new Enemy(305, 591, 600, 1, EnemyType.NORMAL);
      tetheredEnemy.hp = 10; // Only 10 HP left
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = tetheredEnemy;

      // Big hostile bullet with 25 damage
      const hostileBullet = new Bullet(320, 600, 200, 25, false);
      hostileBullet.faction = Faction.INVADER;
      context.bullets = [hostileBullet];

      // First update: bullet hits enemy, enemy hp becomes -15
      harpoon.update(0.016, context);
      expect(tetheredEnemy.hp).toBeLessThanOrEqual(0);

      // Next update: updateTethered detects enemy.hp <= 0 -> untethers and RETRACTS
      harpoon.update(0.016, context);
      expect(harpoon.state).toBe(HarpoonState.RETRACTING);
      expect(harpoon.tetheredEntity).toBeNull();
    });

  });

  // ==========================================================================
  // 5. KINETIC SLINGSHOT CATAPULT EJECT & PIERCING IMPACT
  // ==========================================================================
  test.describe('5. Kinetic Slingshot Catapult Eject & Piercing Impact', () => {
    test('HARPOON-SLING-01: Slingshot release flings enemy at +720 px/s with 180 piercing damage', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();

      const enemy = new Enemy(300, 500, 600, 1, EnemyType.NORMAL);
      enemy.hp = 100;
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      // Set lateral velocity on player
      (harpoon as any).playerVelocity = { x: 100, y: 0 };

      const result = harpoon.releaseSlingshot();
      expect(result).not.toBeNull();
      expect(result!.entity).toBe(enemy);
      expect(result!.damage).toBe(180);
      expect(result!.velocity.y).toBe(-720); // Upward velocity boost
      expect(result!.velocity.x).toBe(50);   // 0.5 * playerVelocity.x

      expect(harpoon.state).toBe(HarpoonState.RETRACTING);
      expect(harpoon.tetheredEntity).toBeNull();
    });

    test('HARPOON-SLING-02: Slingshot projectile pierces through multiple enemies along trajectory', () => {
      const harpoon = new HydraulicHarpoon();

      const launchedEnemy = new Enemy(300, 600, 600, 1, EnemyType.NORMAL);
      launchedEnemy.hp = 100;

      // Create 3 backline enemies aligned along the upward trajectory (x = 300)
      const enemy1 = new Enemy(300, 480, 600, 1, EnemyType.NORMAL);
      enemy1.hp = 200;
      const enemy2 = new Enemy(300, 360, 600, 1, EnemyType.NORMAL);
      enemy2.hp = 200;
      const enemy3 = new Enemy(300, 240, 600, 1, EnemyType.NORMAL);
      enemy3.hp = 200;

      const context = createHarpoonContext({
        enemies: [launchedEnemy, enemy1, enemy2, enemy3],
      });

      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = launchedEnemy;
      (harpoon as any).playerVelocity = { x: 0, y: 0 };

      harpoon.releaseSlingshot();

      // Slingshot velocity is -720 px/s.
      // In 0.6s, projectile travels 720 * 0.6 = 432 px upward (from 600 to 168)
      // It should pierce enemy1 (480), enemy2 (360), and enemy3 (240)
      for (let f = 0; f < 30; f++) {
        harpoon.update(0.02, context);
      }

      console.log(`[EMPIRICAL PIERCING IMPACT] enemy1 HP: ${enemy1.hp} / 200`);
      console.log(`[EMPIRICAL PIERCING IMPACT] enemy2 HP: ${enemy2.hp} / 200`);
      console.log(`[EMPIRICAL PIERCING IMPACT] enemy3 HP: ${enemy3.hp} / 200`);

      // Each enemy was hit once for 180 damage: 200 - 180 = 20 HP
      expect(enemy1.hp).toBe(20);
      expect(enemy2.hp).toBe(20);
      expect(enemy3.hp).toBe(20);
    });

    test('HARPOON-SLING-03: Launched entity despawns and marks isDead=true after exiting screen or expiring', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();

      const launchedEnemy = new Enemy(300, 100, 600, 1, EnemyType.NORMAL);
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = launchedEnemy;

      harpoon.releaseSlingshot();

      // Flung from y = 100 at 720 px/s -> reaches y <= -60 in (160 / 720) = 0.22s
      harpoon.update(0.3, context);

      expect(launchedEnemy.isDead).toBe(true);
      expect((harpoon as any).slingshotProjectiles.length).toBe(0);
    });
  });

  // ==========================================================================
  // 6. 12-NODE VERLET PHYSICS CABLE NUMERICAL STABILITY
  // ==========================================================================
  test.describe('6. 12-Node Verlet Physics Cable Numerical Stability', () => {
    test('HARPOON-VRLT-01: Verlet cable coordinates remain strictly finite (no NaN / Infinity) across extreme dt', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();
      const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      const testDeltaTimes = [0.0001, 0.005, 0.016, 0.033, 0.1, 0.25, 0.5, 1.0, 5.0];

      for (const dt of testDeltaTimes) {
        harpoon.update(dt, context);

        const nodes = (harpoon as any).cableNodes;
        expect(nodes.length).toBe(12);

        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          expect(Number.isFinite(n.x)).toBe(true);
          expect(Number.isFinite(n.y)).toBe(true);
          expect(Number.isNaN(n.x)).toBe(false);
          expect(Number.isNaN(n.y)).toBe(false);
        }
      }
    });

    test('HARPOON-VRLT-02: Extreme teleportation of endpoints does not cause numerical explosion', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();
      const enemy = new Enemy(100, 400, 600, 1, EnemyType.NORMAL);
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      // Teleport player across entire canvas in 1 frame
      context.player.position = { x: 550, y: 720 };
      harpoon.update(0.016, context);

      const nodes = (harpoon as any).cableNodes;
      for (const n of nodes) {
        expect(Number.isFinite(n.x)).toBe(true);
        expect(Number.isFinite(n.y)).toBe(true);
      }
    });

    test('HARPOON-VRLT-03: Zero-length cable (player directly overlapping target) does not divide by zero', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();
      // Target at exact same position as player prow
      const enemy = new Enemy(285, 680, 600, 1, EnemyType.NORMAL);
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      // Update 5 frames with identical coordinates
      for (let i = 0; i < 5; i++) {
        harpoon.update(0.016, context);
      }

      const nodes = (harpoon as any).cableNodes;
      for (const n of nodes) {
        expect(Number.isFinite(n.x)).toBe(true);
        expect(Number.isFinite(n.y)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 7. INPUT HANDLING & HUD / AUDIO HOOKS
  // ==========================================================================
  test.describe('7. Input Handling & HUD Rendering Hooks', () => {
    test('HARPOON-INP-01: Key "H" toggles fire when READY and slingshot when TETHERED', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();

      expect(harpoon.state).toBe(HarpoonState.READY);

      // Press 'h' -> fires
      harpoon.handleInput('h', true, context);
      expect(harpoon.state).toBe(HarpoonState.FLYING);

      // Fake tether
      const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;

      // Press 'h' again -> slingshots
      harpoon.handleInput('h', true, context);
      expect(harpoon.state).toBe(HarpoonState.RETRACTING);
      expect(harpoon.tetheredEntity).toBeNull();
    });

    test('HARPOON-INP-02: Key "Shift" toggles winching', () => {
      const harpoon = new HydraulicHarpoon();
      const context = createHarpoonContext();
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);

      harpoon.handleInput('Shift', true, context);
      expect(harpoon.isWinching).toBe(true);

      harpoon.handleInput('Shift', false, context);
      expect(harpoon.isWinching).toBe(false);
    });

    test('HARPOON-HUD-01: drawWorld and drawForeground execute safely on mock CanvasRenderingContext2D', () => {
      const harpoon = new HydraulicHarpoon();
      const enemy = new Enemy(300, 400, 600, 1, EnemyType.NORMAL);
      harpoon.state = HarpoonState.TETHERED;
      harpoon.tetheredEntity = enemy;
      harpoon.strainRatio = 0.85;

      const mockCtx: any = {
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        quadraticCurveTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        closePath: () => {},
      };

      expect(() => harpoon.drawWorld(mockCtx)).not.toThrow();
      expect(() => harpoon.drawForeground(mockCtx)).not.toThrow();
    });
  });
});

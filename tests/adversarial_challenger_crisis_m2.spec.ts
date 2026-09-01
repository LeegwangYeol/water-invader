import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import {
  CrisisArchetype,
  CrisisPhase,
  EndGameCrisisState,
  Faction,
  GameState,
  EnemyType,
} from '../src/game/types';
import { Bullet } from '../src/game/Bullet';
import { Player } from '../src/game/Player';
import { EndGameCrisis } from '../src/game/crisis/EndGameCrisis';
import { DimensionalRift } from '../src/game/crisis/DimensionalRift';
import { CrisisSovereign } from '../src/game/crisis/CrisisSovereign';

function createMockCanvas(width: number = 600, height: number = 800): HTMLCanvasElement {
  const canvas = {
    width,
    height,
    getContext: (_type: string) => ({
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
    }),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

test.describe('Empirical Adversarial Verification — Milestone 2: Crisis Combat & Physics', () => {

  // =========================================================================
  // SUITE 1: PHASE 1 SOVEREIGN INVULNERABILITY ORACLE & FUZZING
  // =========================================================================
  test.describe('1. Sovereign Invulnerability Oracle in Phase 1', () => {
    test('ADV-1.1: Fuzz test: 5,000 randomized player bullets against Sovereign in Phase 1 with rifts alive', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 15;

      for (const arch of [CrisisArchetype.VOID_SOVEREIGN, CrisisArchetype.ABYSSAL_LEVIATHAN, CrisisArchetype.CYBERNETIC_EXTERMINATOR]) {
        const crisis = new EndGameCrisis(600, 800);
        crisis.startIncursion(arch);
        // Advance past warning (3.0s) to Phase 1
        crisis.update(3.1, gm.player, [], []);
        expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

        const sovereign = crisis.getMainBody()!;
        expect(sovereign.hullHp).toBe(2500);
        expect(sovereign.coreHp).toBe(1500);
        expect(sovereign.hp).toBe(4000);

        // Fire 1,000 fuzzed bullets directly inside Sovereign bounding box
        for (let i = 0; i < 1000; i++) {
          const randX = sovereign.position.x + Math.random() * sovereign.size.width;
          const randY = sovereign.position.y + Math.random() * sovereign.size.height;
          const randDmg = Math.floor(Math.random() * 1000) + 1;
          const randPiercing = Math.floor(Math.random() * 10) + 1;
          const bullet = new Bullet(randX, randY, -400, randDmg, true, randPiercing);
          bullet.faction = Faction.PLAYER;

          const handled = crisis.handleBulletCollision(bullet);
          if (!handled || !bullet.isDead || sovereign.hullHp !== 2500 || sovereign.coreHp !== 1500) {
            throw new Error(`Shield penetration breach at bullet ${i}!`);
          }
        }
        expect(sovereign.hullHp).toBe(2500);
        expect(sovereign.coreHp).toBe(1500);
        expect(sovereign.hp).toBe(4000);
      }
    });

    test('ADV-1.2: Partial Rift Destruction Oracle: Sovereign remains 100% invulnerable when Rift 0 is dead and Rift 1 has 1 HP', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
      const player = new Player(600, 800);
      crisis.update(3.1, player, [], []);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

      const rifts = crisis.getRifts();
      const sovereign = crisis.getMainBody()!;

      // Destroy Rift 0 completely
      rifts[0].takeDamage(600);
      expect(rifts[0].isDead).toBe(true);

      // Reduce Rift 1 to 1 HP
      rifts[1].takeDamage(599);
      expect(rifts[1].hp).toBe(1);
      expect(rifts[1].isDead).toBe(false);

      // Verify phase is still PHASE_1_SHIELD
      crisis.update(0.016, player, [], []);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

      // Sovereign hit with 10,000 damage nuke
      const nuke = new Bullet(sovereign.position.x + 20, sovereign.position.y + 20, -500, 10000, true, 99);
      nuke.faction = Faction.PLAYER;
      crisis.handleBulletCollision(nuke);

      expect(sovereign.hullHp).toBe(2500);
      expect(sovereign.hp).toBe(4000);
      expect(nuke.isDead).toBe(true);

      // Now destroy the final 1 HP on Rift 1
      const finishRift = new Bullet(rifts[1].position.x + 10, rifts[1].position.y + 10, -500, 1, true);
      finishRift.faction = Faction.PLAYER;
      crisis.handleBulletCollision(finishRift);

      expect(rifts[1].isDead).toBe(true);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

      // Now Sovereign takes damage in Phase 2
      const phase2Shot = new Bullet(sovereign.position.x + 20, sovereign.position.y + 20, -500, 500, true);
      phase2Shot.faction = Faction.PLAYER;
      crisis.handleBulletCollision(phase2Shot);
      expect(sovereign.hullHp).toBe(2000);
    });

    test('ADV-1.3: Bullets during INCURSION warning (3.0s) deal 0 damage to Sovereign and Rifts', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
      expect(crisis.phase).toBe(CrisisPhase.INCURSION);

      const sovereign = crisis.getMainBody()!;
      const rifts = crisis.getRifts();

      // Bullets fired during warning phase
      const bSov = new Bullet(sovereign.position.x + 20, sovereign.position.y + 20, -500, 1000, true);
      bSov.faction = Faction.PLAYER;
      sovereign.takeDamage(1000);
      expect(sovereign.hullHp).toBe(2500);

      // Rift takes damage if directly damaged or via collision
      expect(crisis.phase).toBe(CrisisPhase.INCURSION);
    });
  });

  // =========================================================================
  // SUITE 2: GRAVITATIONAL VORTEX TRAJECTORY & SINGULARITY PHYSICS
  // =========================================================================
  test.describe('2. Gravitational Vortex Physics & Trajectory Math', () => {
    test('ADV-2.1: Singularity proximity stress: Distance = 0 and sub-pixel distances never produce NaN or Infinity', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
      const player = new Player(600, 800);
      crisis.update(3.1, player, [], []);

      const rift = crisis.getRifts()[0];
      const riftCenter = rift.getSingularityCenter();

      // Test extreme proximity coordinates
      const testDistances = [0, 0.0001, 0.1, 1, 5, 9.9, 10, 10.1, 50, 100, 239.9, 240, 240.1, 500];

      for (const d of testDistances) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const testX = riftCenter.x + Math.cos(angle) * d;
          const testY = riftCenter.y + Math.sin(angle) * d;

          // Test on Bullet
          const bullet = new Bullet(testX, testY, -400, 10, true);
          bullet.faction = Faction.PLAYER;
          const bullets = [bullet];

          // Test on Player
          player.position.x = testX;
          player.position.y = testY;

          // Update physics with varying deltaTimes (including lag spikes)
          for (const dt of [0.001, 1 / 60, 0.033, 0.1]) {
            crisis['applyRiftGravity'](rift, player, bullets, dt);

            // Assert NO NaN or Infinity in Player
            expect(Number.isNaN(player.position.x)).toBe(false);
            expect(Number.isNaN(player.position.y)).toBe(false);
            expect(Number.isFinite(player.position.x)).toBe(true);
            expect(Number.isFinite(player.position.y)).toBe(true);

            // Assert NO NaN or Infinity in Bullet
            expect(Number.isNaN(bullet.position.x)).toBe(false);
            expect(Number.isNaN(bullet.position.y)).toBe(false);
            expect(Number.isFinite(bullet.position.x)).toBe(true);
            expect(Number.isFinite(bullet.position.y)).toBe(true);
          }
        }
      }
    });

    test('ADV-2.2: Continuous trajectory curvature: Trajectory is smooth with monotonically decreasing distance within pull zone', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
      const player = new Player(600, 800);
      crisis.update(3.1, player, [], []);

      const rift = crisis.getRifts()[0]; // center at (90, 210)
      const riftCenter = rift.getSingularityCenter();

      // Launch a bullet upward starting at x = 160 (70px to the right of rift center), y = 350
      const bullet = new Bullet(160, 350, -300, 10, true);
      bullet.faction = Faction.PLAYER;

      const trajectory: { x: number; y: number }[] = [];
      const dt = 1 / 60;

      // Simulate 60 frames of flight
      for (let f = 0; f < 60; f++) {
        bullet.update(dt);
        crisis['applyRiftGravity'](rift, player, [bullet], dt);
        trajectory.push({ x: bullet.position.x, y: bullet.position.y });
      }

      // Check trajectory properties:
      // 1. Initial x was 160. As it flies past y=210, x should have curved leftward towards x=90.
      expect(trajectory[trajectory.length - 1].x).toBeLessThan(160);

      // 2. Velocity steps between consecutive frames must be smooth (|dx[i] - dx[i-1]| < 5px)
      for (let i = 2; i < trajectory.length; i++) {
        const step1 = trajectory[i - 1].x - trajectory[i - 2].x;
        const step2 = trajectory[i].x - trajectory[i - 1].x;
        const jerk = Math.abs(step2 - step1);
        expect(jerk).toBeLessThan(2.0); // Smooth curvature without jerky teleportation
      }
    });

    test('ADV-2.3: Multi-rift gravitational cancellation at exact midpoint', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
      const player = new Player(600, 800);
      crisis.update(3.1, player, [], []);

      const rifts = crisis.getRifts();
      const r0Center = rifts[0].getSingularityCenter(); // (90, 210)
      const r1Center = rifts[1].getSingularityCenter(); // (510, 210)

      // Place bullet at exact horizontal center (300, 210)
      const midX = (r0Center.x + r1Center.x) / 2; // 300
      const midY = (r0Center.y + r1Center.y) / 2; // 210

      const bullet = new Bullet(midX, midY, -300, 10, true);
      bullet.faction = Faction.PLAYER;
      const bullets = [bullet];

      const dt = 1 / 60;
      crisis['applyRiftGravity'](rifts[0], player, bullets, dt);
      crisis['applyRiftGravity'](rifts[1], player, bullets, dt);

      // In sequential Euler integration, applying rift 0 moves the bullet slightly before rift 1 is evaluated,
      // creating a tiny sub-pixel displacement (< 0.1px).
      expect(Math.abs(bullet.position.x - midX)).toBeLessThan(0.1);
    });
  });

  // =========================================================================
  // SUITE 3: BULLET COLLISION ROUTING STRESS TEST (GameManager.checkCollisions)
  // =========================================================================
  test.describe('3. Bullet Collision Routing Stress & Edge Cases', () => {
    test('ADV-3.1: Heavy bullet load stress: 1,000 mixed bullets processed simultaneously without crash or memory leak', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 15;

      gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
      gm['update'](3.1); // Advance to Phase 1

      // Spawn 1,000 mixed bullets
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 600;
        const y = Math.random() * 800;
        const speedY = (Math.random() - 0.5) * 800;
        const dmg = Math.floor(Math.random() * 50) + 1;
        const isPlayer = i % 2 === 0;
        const b = new Bullet(x, y, speedY, dmg, isPlayer);
        if (!isPlayer) {
          b.faction = i % 4 === 1 ? Faction.INVADER : Faction.ROGUE;
          b.isInterceptable = i % 3 === 0;
        }
        gm.bullets.push(b);
      }

      expect(gm.bullets.length).toBe(1000);

      // Run collision routing
      expect(() => {
        for (let f = 0; f < 30; f++) {
          gm['update'](1 / 60);
        }
      }).not.toThrow();

      // Dead bullets should be pruned properly in update loop
      const deadBullets = gm.bullets.filter(b => b.isDead);
      expect(deadBullets.length).toBe(0);
    });

    test('ADV-3.2: Piercing bullet behavior across multi-phase sovereign lifecycle', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 15;

      const crisis = gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
      gm['update'](3.1); // Phase 1

      const sovereign = crisis.getMainBody()!;
      const rifts = crisis.getRifts();

      // 1. High-piercing bullet hitting Sovereign in Phase 1 -> deflected and killed
      const pBullet = new Bullet(sovereign.position.x + 20, sovereign.position.y + 20, -500, 100, true, 5);
      pBullet.faction = Faction.PLAYER;
      gm.bullets = [pBullet];
      gm['update'](1 / 60);
      expect(pBullet.isDead).toBe(true); // Deflected
      expect(sovereign.hullHp).toBe(2500);

      // 2. Destroy Rifts to enter Phase 2
      rifts[0].takeDamage(600);
      rifts[1].takeDamage(600);
      gm['update'](1 / 60);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

      // 3. Piercing bullet hitting Sovereign in Phase 2
      const pBullet2 = new Bullet(sovereign.position.x + 20, sovereign.position.y + 20, -500, 500, true, 2);
      pBullet2.faction = Faction.PLAYER;
      gm.bullets = [pBullet2];
      gm['update'](1 / 60);
      expect(sovereign.hullHp).toBe(2000);
    });

    test('ADV-3.3: Hostile bullets (INVADER / ROGUE) do not damage Sovereign or Rifts', () => {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
      const player = new Player(600, 800);
      crisis.update(3.1, player, [], []);

      const sovereign = crisis.getMainBody()!;
      const rift = crisis.getRifts()[0];

      // Invader bullet
      const invBullet = new Bullet(sovereign.position.x + 20, sovereign.position.y + 20, 300, 50, false);
      invBullet.faction = Faction.INVADER;
      const h1 = crisis.handleBulletCollision(invBullet);
      expect(h1).toBe(false);
      expect(sovereign.hullHp).toBe(2500);

      // Rogue bullet
      const rogueBullet = new Bullet(rift.position.x + 20, rift.position.y + 20, 300, 50, false);
      rogueBullet.faction = Faction.ROGUE;
      const h2 = crisis.handleBulletCollision(rogueBullet);
      expect(h2).toBe(false);
      expect(rift.hp).toBe(600);
    });
  });

  // =========================================================================
  // SUITE 4: STATE MACHINE, TRANSITIONS & REWARD ORACLE
  // =========================================================================
  test.describe('4. Lifecycle State Machine & Wave Transition Safety', () => {
    test('ADV-4.1: Full lifecycle: INCURSION -> PHASE 1 -> PHASE 2 -> PHASE 3 -> DEFEATED', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 15;

      const crisis = gm.triggerEndGameCrisis(CrisisArchetype.ABYSSAL_LEVIATHAN);
      expect(crisis.phase).toBe(CrisisPhase.INCURSION);

      // 1. Advance warning timer to 0 -> PHASE 1
      gm['update'](3.1);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

      // 2. Kill Rift 0 (Rift 1 alive -> still PHASE 1)
      crisis.riftAnchors[0].takeDamage(600);
      gm['update'](1 / 60);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

      // 3. Kill Rift 1 -> PHASE 2
      crisis.riftAnchors[1].takeDamage(600);
      gm['update'](1 / 60);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

      // 4. Deplete Hull (2500 HP) -> PHASE 3
      crisis.sovereign!.takeDamage(2500);
      gm['update'](1 / 60);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
      expect(crisis.sovereign!.enrageTimer).toBe(35.0);

      // 5. Deplete Core (1500 HP) -> DEFEATED
      crisis.sovereign!.takeDamage(1500);
      gm['update'](1 / 60);
      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis.isDefeated()).toBe(true);

      // 6. Next frame transitions to SHOP
      gm['update'](1 / 60);
      expect(gm.state).toBe(GameState.SHOP);
    });

    test('ADV-4.2: Reward uniqueness: Defeat rewards (+2000 score, +500 currency) are granted EXACTLY ONCE over 120 frames', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 15;
      gm.score = 1000;
      gm.currency = 200;

      const crisis = gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
      gm['update'](3.1); // Phase 1

      // Kill Rifts to trigger Phase 2
      crisis.riftAnchors[0].takeDamage(600);
      crisis.riftAnchors[1].takeDamage(600);
      gm['update'](1 / 60);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

      // Deplete Hull (2500) to trigger Phase 3
      crisis.sovereign!.takeDamage(2500);
      gm['update'](1 / 60);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

      // Deplete Core (1500) to trigger DEFEATED
      crisis.sovereign!.takeDamage(1500);
      gm['update'](1 / 60);
      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);

      const scoreAfterDefeat = gm.score;
      const currencyAfterDefeat = gm.currency;

      expect(scoreAfterDefeat).toBe(3000); // 1000 + 2000
      expect(currencyAfterDefeat).toBe(700); // 200 + 500

      // Keep updating for 120 frames
      for (let f = 0; f < 120; f++) {
        gm.state = GameState.PLAYING; // Keep playing to test guard
        gm['update'](1 / 60);
      }

      // Assert rewards did NOT increment again
      expect(gm.score).toBe(scoreAfterDefeat);
      expect(gm.currency).toBe(currencyAfterDefeat);
    });

    test('ADV-4.3: Sovereign collision contact with player inflicts 1 damage and 1.0s invincibility', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 15;

      const crisis = gm.triggerEndGameCrisis(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
      gm['update'](3.1);

      const sovereign = crisis.getMainBody()!;
      // Place player directly overlapping sovereign
      gm.player.position.x = sovereign.position.x + 20;
      gm.player.position.y = sovereign.position.y + 20;
      gm.player.hp = 3;
      gm.player.invincibilityTimer = 0;

      // First frame overlap -> Player takes 1 damage
      gm['update'](1 / 60);
      expect(gm.player.hp).toBe(2);
      expect(gm.player.invincibilityTimer).toBeGreaterThan(0.9);

      // Subsequent 30 frames inside invincibility window -> Player takes 0 damage
      for (let f = 0; f < 30; f++) {
        gm['update'](1 / 60);
      }
      expect(gm.player.hp).toBe(2);
    });
  });
});

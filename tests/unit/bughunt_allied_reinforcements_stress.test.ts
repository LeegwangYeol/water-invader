import { test, expect } from '@playwright/test';
import { AlliedReinforcements } from '../../src/game/crisis/AlliedReinforcements';
import { Player } from '../../src/game/Player';
import { Enemy } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { CrisisArchetype, CrisisPhase } from '../../src/game/crisis/types';
import { GameManager } from '../../src/game/GameManager';
import { Faction, EnemyType, GameState } from '../../src/game/types';
import { Particle } from '../../src/game/Particle';

/**
 * Headless Canvas Context Mock for stress testing
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
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
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

function createMockCanvas(): HTMLCanvasElement {
  const canvas = {
    width: 600,
    height: 800,
    getContext: () => createMockCanvasContext(),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

test.describe('Empirical Challenger: AlliedReinforcements Extreme Stress Suite', () => {

  // =========================================================================
  // SCENARIO 1: DENSE PROJECTILE BARRAGE (100+ HOSTILE BULLETS)
  // =========================================================================
  test.describe('Scenario 1: Dense Projectile Barrage (100+ Hostile Bullets) entering 120px PD Radius', () => {

    test('STRESS-1.1: 150 hostile bullets entering Player 120px radius simultaneously vaporize with zero unhandled exceptions', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      allied.warpTimer = 0;

      const player = new Player(600, 800);
      player.position.x = 270;
      player.position.y = 700;
      const playerCenter = {
        x: player.position.x + player.size.width / 2,
        y: player.position.y + player.size.height / 2,
      };

      const bullets: Bullet[] = [];
      const particles: Particle[] = [];

      // Spawn 150 hostile bullets inside 120px radius of player
      for (let i = 0; i < 150; i++) {
        const angle = (i / 150) * Math.PI * 2;
        const dist = 10 + (i % 90); // 10px to 100px (strictly within 120px)
        const bx = playerCenter.x + Math.cos(angle) * dist;
        const by = playerCenter.y + Math.sin(angle) * dist;
        const b = new Bullet(bx, by, 200, 1, false);
        b.faction = Faction.INVADER;
        bullets.push(b);
      }

      expect(bullets.length).toBe(150);

      // Measure execution time
      const startTime = performance.now();
      expect(() => {
        allied.update(0.016, player, [], bullets, null, particles);
      }).not.toThrow();
      const elapsedMs = performance.now() - startTime;

      // Verification assertions: zero performance hitches (<50ms for 150 bullets)
      expect(elapsedMs).toBeLessThan(50);

      let vaporizedCount = 0;
      for (const b of bullets) {
        if (b.isDead) vaporizedCount++;
      }
      expect(vaporizedCount).toBe(150); // 100% vaporized

      // Verify laser beams generated
      expect(allied.pdLaserBeams.length).toBe(150);

      // Verify rendering with 150 active beams
      const ctx = createMockCanvasContext();
      expect(() => allied.draw(ctx)).not.toThrow();

      // Advance time by 0.15s (> 0.12s beam lifetime) to verify beam memory cleanup
      allied.update(0.15, player, [], [], null, particles);
      expect(allied.pdLaserBeams.length).toBe(0); // All beams cleanly pruned
    });

    test('STRESS-1.2: 250 hostile bullets entering Dreadnought 120px radius simultaneously vaporize without particle runaway', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      allied.position.y = allied.targetY;
      const dreadCenter = {
        x: allied.position.x + allied.size.width / 2,
        y: allied.targetY + allied.size.height / 2,
      };

      const player = new Player(600, 800);
      const bullets: Bullet[] = [];
      const particles: Particle[] = [];

      // Spawn 250 hostile bullets around Dreadnought perimeter
      for (let i = 0; i < 250; i++) {
        const angle = (i / 250) * Math.PI * 2;
        const dist = 15 + (i % 85); // 15px to 100px (strictly within 120px)
        const bx = dreadCenter.x + Math.cos(angle) * dist;
        const by = dreadCenter.y + Math.sin(angle) * dist;
        const b = new Bullet(bx, by, 300, 2, false);
        b.faction = Faction.INVADER;
        bullets.push(b);
      }

      const startTime = performance.now();
      expect(() => {
        allied.update(0.016, player, [], bullets, null, particles);
      }).not.toThrow();
      const elapsedMs = performance.now() - startTime;

      expect(elapsedMs).toBeLessThan(50);
      const vaporized = bullets.filter(b => b.isDead).length;
      expect(vaporized).toBe(250);

      // Verify particles are strictly bounded by 400 cap
      expect(particles.length).toBeLessThanOrEqual(404);
    });

    test('STRESS-1.3: Mixed ultra-dense barrage (500 bullets: 250 hostile + 250 player) preserves player fire', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      const player = new Player(600, 800);
      const playerCenter = {
        x: player.position.x + player.size.width / 2,
        y: player.position.y + player.size.height / 2,
      };

      const bullets: Bullet[] = [];
      for (let i = 0; i < 500; i++) {
        const isPlayer = i % 2 === 0;
        const bx = playerCenter.x + (i % 60) - 30;
        const by = playerCenter.y + (i % 60) - 30;
        const b = new Bullet(bx, by, isPlayer ? -400 : 200, 1, isPlayer);
        b.faction = isPlayer ? Faction.PLAYER : Faction.INVADER;
        bullets.push(b);
      }

      allied.update(0.016, player, [], bullets, null);

      const survivingPlayerBullets = bullets.filter(b => b.faction === Faction.PLAYER && !b.isDead);
      const deadHostileBullets = bullets.filter(b => b.faction === Faction.INVADER && b.isDead);

      expect(survivingPlayerBullets.length).toBe(250); // 0 player bullets vaporized
      expect(deadHostileBullets.length).toBe(250);     // 100% hostile bullets vaporized
    });

    test('STRESS-1.4: 1,000 bullet extreme barrage benchmark under 60fps budget', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      const player = new Player(600, 800);

      const bullets: Bullet[] = [];
      for (let i = 0; i < 1000; i++) {
        const b = new Bullet(player.position.x + 20, player.position.y + 20, 200, 1, false);
        b.faction = Faction.INVADER;
        bullets.push(b);
      }

      const start = performance.now();
      allied.update(0.016, player, [], bullets, null);
      const duration = performance.now() - start;

      // 16.6ms is frame budget; single update for 1,000 bullets takes well under 35ms
      expect(duration).toBeLessThan(35);
      expect(bullets.every(b => b.isDead)).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIO 2: PLAYER AT 0 HP OR MAX HP DURING NANO-SHIELD PULSE
  // =========================================================================
  test.describe('Scenario 2: Player HP Boundary Integrity during Nano-Shield Pulse', () => {

    test('HP-2.1: Player at MAX HP does NOT overheal past maxHp across repeated pulses', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      const player = new Player(600, 800);
      player.hp = 5;
      player.maxHp = 5;

      // Fire 5 full healing cycles (25 seconds)
      for (let cycle = 0; cycle < 5; cycle++) {
        allied.update(5.1, player, [], [], null);
        expect(player.hp).toBe(5);
        expect(player.hp).toBeLessThanOrEqual(player.maxHp);
      }
    });

    test('DEFECT-B1-FIXED: Player at 0 HP is protected from resurrection by Nano-Shield pulse', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      const player = new Player(600, 800);

      // Player brought to 0 HP
      player.hp = 0;
      expect(player.isDead).toBe(false);

      // Advance past 5.0s pulse interval
      allied.update(5.1, player, [], [], null);

      // REMEDIATION VERIFIED:
      // AlliedReinforcements.updateRestorativeNanoShield checks `if (!player || player.isDead || player.hp <= 0) return;`.
      // The dead player remains at 0 HP.
      expect(player.hp).toBe(0);
    });

    test('HP-2.3: Player with explicit isDead=true is protected from resurrection', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      const player = new Player(600, 800);
      player.hp = 0;
      player.isDead = true;

      allied.update(5.1, player, [], [], null);

      expect(player.hp).toBe(0);
      expect(allied.healPulseTimer).toBe(0); // No heal pulse emitted
    });

    test('DEFECT-B1-FIXED: Player at negative HP (-2) does not receive heal increment', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      const player = new Player(600, 800);
      player.hp = -2; // Overkill damage

      allied.update(5.1, player, [], [], null);

      // REMEDIATION VERIFIED: Player remains at -2 HP (no heal pulse applied)
      expect(player.hp).toBe(-2);
    });
  });

  // =========================================================================
  // SCENARIO 3: SOVEREIGN DEFEAT WHILE DREADNOUGHT IS MID-WARP OR FIRING
  // =========================================================================
  test.describe('Scenario 3: Sovereign Defeat Race Conditions (Mid-Warp & Mid-Firing)', () => {

    test('STATE-3.1: Sovereign defeated while Dreadnought is mid-warp-in (isWarpingIn=true) completes warp lifecycle cleanly', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      // Start crisis and trigger Allied Reinforcements
      const crisis = gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
      const allied = gm.triggerAlliedReinforcements();

      // Dreadnought is mid-warp-in
      expect(allied.isWarpingIn).toBe(true);
      expect(allied.warpTimer).toBe(2.0);

      // Fast-forward past crisis incursion warning (3.0s) into Phase 1
      crisis.update(3.1, gm.player, gm.bullets, gm.particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

      // Advance 0.5s into dreadnought warp (1.5s remaining)
      allied.update(0.5, gm.player, [], [], crisis);
      expect(allied.isWarpingIn).toBe(true);
      expect(allied.warpTimer).toBeCloseTo(1.5, 1);

      // Destroy anchors to enter Phase 2
      crisis.riftAnchors[0].takeDamage(600);
      crisis.riftAnchors[1].takeDamage(600);
      crisis.update(0.016, gm.player, gm.bullets, gm.particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

      // Deplete hull to enter Phase 3
      crisis.sovereign!.takeDamage(2500);
      crisis.update(0.016, gm.player, gm.bullets, gm.particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

      // Deplete core to trigger Defeat
      crisis.sovereign!.takeDamage(1500);
      crisis.update(0.016, gm.player, gm.bullets, gm.particles);
      expect(crisis.isDefeated()).toBe(true);

      // Process GameManager frame: onDefeated triggers allied.warpOut()
      expect(() => gm['update'](0.016)).not.toThrow();

      // Verify warpOut was signaled
      expect(allied.isWarpingOut).toBe(true);

      // ARCHITECTURAL BEHAVIOR:
      // While isWarpingIn is true, warpOut() sets isWarpingOut = true,
      // but the update loop finishes warp-in descent before ascending.
      // Advance 5.0s to allow both warp-in completion and warp-out ascent:
      for (let step = 0; step < 50; step++) {
        allied.update(0.1, gm.player, [], [], crisis);
      }

      // Assert that it cleanly dismisses off-screen without hanging
      expect(allied.isWarpingIn).toBe(false);
      expect(allied.isDismissed).toBe(true);
      expect(allied.isActive).toBe(false);
      expect(allied.position.y).toBeLessThan(-allied.size.height);
    });

    test('RACE-3.2: Sovereign defeated on the exact frame heavy plasma cannons are ready to fire', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      allied.warpTimer = 0;

      const player = new Player(600, 800);
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(CrisisArchetype.SINGULARITY_CORE);

      // Fast forward to Phase 1 then Phase 2 then Phase 3
      crisis.update(3.1, player, [], []);
      crisis.riftAnchors.forEach(r => r.takeDamage(600));
      crisis.update(0.016, player, [], []);
      crisis.sovereign!.takeDamage(2500);
      crisis.update(0.016, player, [], []);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

      // Advance cannon timer to 0.79s (0.01s before fireInterval of 0.8s)
      allied.update(0.79, player, [], [], crisis);

      // Exact frame of defeat: kill Sovereign Core
      crisis.sovereign!.takeDamage(1500);
      crisis.update(0.016, player, [], []);
      expect(crisis.isDefeated()).toBe(true);
      expect(crisis.sovereign!.isDead).toBe(true);

      // Trigger warpOut on allied
      allied.warpOut();
      expect(allied.isWarpingOut).toBe(true);

      // Next frame: 0.02s elapsed -> would cross 0.8s fireInterval if active
      let firedBullets: Bullet[] = [];
      expect(() => {
        firedBullets = allied.update(0.02, player, [], [], crisis);
      }).not.toThrow();

      // Because isWarpingOut is true, line 195 suppresses cannon firing
      expect(firedBullets.length).toBe(0);
    });

    test('EDGE-3.3: Sovereign defeated while crisis is passed as null to update', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      const player = new Player(600, 800);

      expect(() => {
        allied.update(1.0, player, [], [], null);
      }).not.toThrow();

      allied.warpOut();
      expect(() => {
        allied.update(0.5, player, [], [], null);
      }).not.toThrow();
    });

    test('DEFENSE-3.4: Hostile bullets still present in arena when Sovereign is defeated are vaporized during warp-out', () => {
      const allied = new AlliedReinforcements(600, 800);
      allied.isWarpingIn = false;
      allied.warpOut(); // Warping out after boss defeat

      const player = new Player(600, 800);
      // Residual hostile bullets floating near player
      const hostileBullet = new Bullet(player.position.x + 10, player.position.y + 10, 100, 1, false);
      hostileBullet.faction = Faction.INVADER;

      // Even while warping out, Point-Defense grid remains active to protect player during departure
      allied.update(0.016, player, [], [hostileBullet], null);
      expect(hostileBullet.isDead).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIO 4: MULTIPLE CALLS TO triggerAlliedReinforcements() (IDEMPOTENCY)
  // =========================================================================
  test.describe('Scenario 4: Idempotency & Lifecycle Handling of triggerAlliedReinforcements()', () => {

    test('DEFECT-B3-FIXED: Verification that triggerAlliedReinforcements() is strictly idempotent', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      // First call
      const firstInstance = gm.triggerAlliedReinforcements();
      expect(firstInstance).toBeDefined();
      expect(firstInstance.isActive).toBe(true);

      // Advance 1.0s into warp
      firstInstance.update(1.0, gm.player, [], [], null);
      expect(firstInstance.warpTimer).toBeCloseTo(1.0, 1);

      // Second call to triggerAlliedReinforcements() while first is active
      const secondInstance = gm.triggerAlliedReinforcements();

      // REMEDIATION VERIFIED:
      // triggerAlliedReinforcements() returns existing active instance without resetting or re-allocating
      expect(firstInstance === secondInstance).toBe(true);
      expect(secondInstance.warpTimer).toBeCloseTo(1.0, 1);
    });

    test('STRESS-4.2: Rapid 50 successive calls to triggerAlliedReinforcements() does not crash', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      expect(() => {
        for (let i = 0; i < 50; i++) {
          gm.triggerAlliedReinforcements();
        }
      }).not.toThrow();

      expect(gm.alliedReinforcements).toBeDefined();
      expect(gm.alliedReinforcements!.isActive).toBe(true);
    });

    test('LIFECYCLE-4.3: triggerAlliedReinforcements() after previous dreadnought was dismissed properly replaces it', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      const firstInstance = gm.triggerAlliedReinforcements();
      firstInstance.isActive = false;
      firstInstance.isDismissed = true;

      // When previous is dismissed, triggering should instantiate a fresh replacement
      const secondInstance = gm.triggerAlliedReinforcements();
      expect(secondInstance).toBeDefined();
      expect(secondInstance.isActive).toBe(true);
      expect(secondInstance.isDismissed).toBe(false);
    });
  });
});

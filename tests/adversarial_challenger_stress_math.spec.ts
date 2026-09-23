import { test, expect } from '@playwright/test';
import { Bullet, HomingMissile } from '../src/game/Bullet';
import { Entity } from '../src/game/Entity';
import { Barricade, BarricadeType } from '../src/game/Barricade';
import { Faction, GameState } from '../src/game/types';
import { CavitationTorpedo, DEFAULT_TORPEDO_CONFIG } from '../src/game/flagship/weapons/CavitationTorpedo';
import { TorpedoState } from '../src/game/flagship/types';
import { HadalBioHorrors, BioHorrorUnit } from '../src/game/flagship/factions/HadalBioHorrors';
import { AutomatonPhalanx } from '../src/game/flagship/factions/AutomatonPhalanx';
import { Player } from '../src/game/Player';

// Mock Canvas 2D context to track and assert rendering coordinate safety
function createMockCanvasContext() {
  const arcCalls: Array<{ x: number; y: number; r: number }> = [];
  const translateCalls: Array<{ x: number; y: number }> = [];
  const rotateCalls: number[] = [];

  const ctx = {
    save: () => {},
    restore: () => {},
    translate: (x: number, y: number) => {
      translateCalls.push({ x, y });
    },
    rotate: (angle: number) => {
      rotateCalls.push(angle);
    },
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: (x: number, y: number, r: number) => {
      arcCalls.push({ x, y, r });
    },
    ellipse: (x: number, y: number, rx: number, ry: number, rot: number, start: number, end: number) => {
      arcCalls.push({ x, y, r: Math.max(rx, ry) });
    },
    bezierCurveTo: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    globalAlpha: 1.0,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1.0,
    shadowColor: '',
    shadowBlur: 0,
    font: '',
  } as unknown as CanvasRenderingContext2D;

  return { ctx, arcCalls, translateCalls, rotateCalls };
}

// Minimal dummy entity for testing collision geometry and damage reception
class TestTarget extends Entity {
  public hp: number = 100;
  public update(_dt: number) {}
  public draw(_ctx: CanvasRenderingContext2D) {}
  public takeDamage(amount: number) {
    this.hp -= amount;
  }
}

// Mock FlagshipUpdateContext
function createMockFlagshipContext(overrides: Record<string, any> = {}) {
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
  } as any;
}

test.describe('Adversarial Challenger 1: Mathematical & Collision Stress Suite', () => {

  // =========================================================================
  // SECTION 1: HOMING MISSILE MATHEMATICAL STRESS TESTS (Bullet.ts)
  // =========================================================================
  test.describe('Section 1: Bullet.ts Homing Missile Mathematical Stability', () => {

    test('CHAL-MATH-01: Zero-distance coincident target (dist = 0, dx = 0, dy = 0)', () => {
      const missile = new HomingMissile(300, 400, 4);
      // Target placed at exact same (x, y) and size
      const coincidentTarget = new TestTarget(300, 400, missile.size.width, missile.size.height);
      missile.target = coincidentTarget;

      // Single step
      missile.update(0.016, [coincidentTarget], null);

      expect(Number.isFinite(missile.angle), 'Missile angle must be finite').toBe(true);
      expect(Number.isFinite(missile.velocity.x), 'Velocity X must be finite').toBe(true);
      expect(Number.isFinite(missile.velocity.y), 'Velocity Y must be finite').toBe(true);
      expect(Number.isFinite(missile.position.x), 'Position X must be finite').toBe(true);
      expect(Number.isFinite(missile.position.y), 'Position Y must be finite').toBe(true);

      // Multi-step soak test (100 frames coincident)
      for (let i = 0; i < 100; i++) {
        coincidentTarget.position.x = missile.position.x;
        coincidentTarget.position.y = missile.position.y;
        missile.update(0.016, [coincidentTarget], null);

        expect(Number.isFinite(missile.angle)).toBe(true);
        expect(Number.isFinite(missile.velocity.x)).toBe(true);
        expect(Number.isFinite(missile.velocity.y)).toBe(true);
        expect(Number.isFinite(missile.position.x)).toBe(true);
        expect(Number.isFinite(missile.position.y)).toBe(true);
      }
    });

    test('CHAL-MATH-02: Sub-pixel epsilon distance (0 < distSq <= 0.0001)', () => {
      const missile = new HomingMissile(300, 400, 4);
      // Sub-pixel offset dx = 0.005, dy = 0.005 => distSq = 0.00005 < 0.0001
      const subpixelTarget = new TestTarget(
        missile.position.x + 0.005,
        missile.position.y + 0.005,
        missile.size.width,
        missile.size.height
      );
      missile.target = subpixelTarget;

      missile.update(0.016, [subpixelTarget], null);

      expect(Number.isFinite(missile.angle)).toBe(true);
      expect(Number.isFinite(missile.velocity.x)).toBe(true);
      expect(Number.isFinite(missile.velocity.y)).toBe(true);
    });

    test('CHAL-MATH-03: Negative coordinates & deep negative target positions', () => {
      const missile = new HomingMissile(300, 400, 4);

      // Target in negative space
      const negativeTarget = new TestTarget(-50, -50, 20, 20);
      missile.target = negativeTarget;

      missile.update(0.016, [negativeTarget], null);

      expect(Number.isFinite(missile.angle)).toBe(true);
      expect(Number.isFinite(missile.velocity.x)).toBe(true);
      expect(Number.isFinite(missile.velocity.y)).toBe(true);

      // Missile itself in negative coordinates
      missile.position.x = -200;
      missile.position.y = -300;
      missile.update(0.016, [negativeTarget], null);

      expect(Number.isFinite(missile.angle)).toBe(true);
      expect(Number.isFinite(missile.velocity.x)).toBe(true);
      expect(Number.isFinite(missile.velocity.y)).toBe(true);
      expect(Number.isFinite(missile.position.x)).toBe(true);
      expect(Number.isFinite(missile.position.y)).toBe(true);
    });

    test('CHAL-MATH-04: Target with NaN coordinates & canvas drawing guards', () => {
      const missile = new HomingMissile(300, 400, 4);
      const nanTarget = new TestTarget(NaN, NaN, 20, 20);
      missile.target = nanTarget;

      missile.update(0.016, [nanTarget], null);

      expect(Number.isFinite(missile.angle)).toBe(true);
      expect(Number.isFinite(missile.velocity.x)).toBe(true);
      expect(Number.isFinite(missile.velocity.y)).toBe(true);
      expect(Number.isFinite(missile.position.x)).toBe(true);
      expect(Number.isFinite(missile.position.y)).toBe(true);

      // Partially NaN target: x=NaN, y=200
      const partialNanTarget = new TestTarget(NaN, 200, 20, 20);
      missile.target = partialNanTarget;
      missile.update(0.016, [partialNanTarget], null);

      expect(Number.isFinite(missile.angle)).toBe(true);
      expect(Number.isFinite(missile.velocity.x)).toBe(true);
      expect(Number.isFinite(missile.velocity.y)).toBe(true);

      // Target with NaN size
      const nanSizeTarget = new TestTarget(200, 200, NaN, NaN);
      missile.target = nanSizeTarget;
      missile.update(0.016, [nanSizeTarget], null);

      expect(Number.isFinite(missile.angle)).toBe(true);
      expect(Number.isFinite(missile.velocity.x)).toBe(true);
      expect(Number.isFinite(missile.velocity.y)).toBe(true);

      // Smoke trail check
      for (const s of missile.smokeTrail) {
        expect(Number.isFinite(s.x)).toBe(true);
        expect(Number.isFinite(s.y)).toBe(true);
        expect(Number.isFinite(s.r)).toBe(true);
        expect(Number.isFinite(s.alpha)).toBe(true);
      }

      // Drawing execution check: verify NO NaN values passed to canvas context
      const { ctx, arcCalls, translateCalls, rotateCalls } = createMockCanvasContext();
      missile.draw(ctx);

      for (const t of translateCalls) {
        expect(Number.isFinite(t.x)).toBe(true);
        expect(Number.isFinite(t.y)).toBe(true);
      }
      for (const a of rotateCalls) {
        expect(Number.isFinite(a)).toBe(true);
      }
      for (const arc of arcCalls) {
        expect(Number.isFinite(arc.x)).toBe(true);
        expect(Number.isFinite(arc.y)).toBe(true);
        expect(Number.isFinite(arc.r)).toBe(true);
      }
    });

    test('CHAL-MATH-05: Injected state corruption self-healing (NaN angle, NaN position, NaN velocity)', () => {
      const missile = new HomingMissile(300, 400, 4);

      // Directly poison internal state with NaN
      missile.angle = NaN;
      missile.position.x = NaN;
      missile.position.y = NaN;
      missile.velocity.x = NaN;
      missile.velocity.y = NaN;
      missile.currentSpeed = NaN;

      // Update should self-heal all corrupted properties
      missile.update(0.016, [], null);

      expect(Number.isFinite(missile.angle), 'Missile must restore finite angle').toBe(true);
      expect(Number.isFinite(missile.position.x), 'Missile must restore finite position.x').toBe(true);
      expect(Number.isFinite(missile.position.y), 'Missile must restore finite position.y').toBe(true);
      expect(Number.isFinite(missile.velocity.x), 'Missile must restore finite velocity.x').toBe(true);
      expect(Number.isFinite(missile.velocity.y), 'Missile must restore finite velocity.y').toBe(true);
      expect(Number.isFinite(missile.currentSpeed), 'Missile must restore finite currentSpeed').toBe(true);
    });

    test('CHAL-MATH-06: 1,000-frame Monte Carlo adversarial stress harness', () => {
      const missile = new HomingMissile(300, 400, 4);
      // Extend lifeTimer to allow exhaustive 1,000-frame simulation
      missile.lifeTimer = 9999;

      const testEnemies: Entity[] = [];

      // Create a pool of chaotic targets: NaN, extreme negatives, extreme positives, coincident
      testEnemies.push(new TestTarget(NaN, NaN, 20, 20));
      testEnemies.push(new TestTarget(-9999, -9999, 20, 20));
      testEnemies.push(new TestTarget(9999, 9999, 20, 20));
      testEnemies.push(new TestTarget(300, 400, 20, 20)); // Coincident

      for (let frame = 0; frame < 1000; frame++) {
        // Randomize delta time between 0.001s and 0.2s (including lag spikes and sub-millisecond ticks)
        const dt = 0.001 + Math.random() * 0.199;

        // Periodically inject corruptions
        if (frame % 50 === 0) {
          missile.angle = NaN;
        } else if (frame % 70 === 0) {
          missile.currentSpeed = -999;
        }

        missile.update(dt, testEnemies, null);

        expect(Number.isFinite(missile.angle), `Frame ${frame}: angle is finite`).toBe(true);
        expect(Number.isFinite(missile.velocity.x), `Frame ${frame}: vx is finite`).toBe(true);
        expect(Number.isFinite(missile.velocity.y), `Frame ${frame}: vy is finite`).toBe(true);
        expect(Number.isFinite(missile.position.x), `Frame ${frame}: px is finite`).toBe(true);
        expect(Number.isFinite(missile.position.y), `Frame ${frame}: py is finite`).toBe(true);
        expect(Number.isFinite(missile.currentSpeed), `Frame ${frame}: currentSpeed is finite`).toBe(true);
      }
    });
  });

  // =========================================================================
  // SECTION 2: CAVITATION TORPEDO CCD TUNNELING STRESS TESTS
  // =========================================================================
  test.describe('Section 2: CavitationTorpedo.ts Continuous Collision Detection (CCD) & Tunneling', () => {

    test('CHAL-CCD-01: High simulated lag (dt = 0.1s, 58px displacement) over small target (15px radius)', () => {
      // Create armed torpedo moving upward at terminal cruise speed 580 px/s
      const torpedo = new CavitationTorpedo(300, 500, DEFAULT_TORPEDO_CONFIG, 180);
      torpedo.state = TorpedoState.ARMED;
      torpedo.velocity.y = -580;

      // Small target: width=30, height=30 (radius = 15px).
      // Place target at y=470 (center y=485).
      // With dt = 0.1s, torpedo moves from y=500 to y=442 (displacement = 58px).
      // At start (y=500), torpedo is at [500, 526]. Target is [470, 500]. No overlap!
      // At end (y=442), torpedo is at [442, 468]. Target is [470, 500]. Zero overlap!
      const smallTarget = new TestTarget(295, 470, 30, 30); // 15px radius, center (310, 485)
      expect(500 < 470 + 30 && 500 + 26 > 470).toBe(false);
      expect(442 < 470 + 30 && 468 > 470).toBe(false);

      // Discrete collision check would fail completely and tunnel straight through!
      // Now run swept CCD update:
      torpedo.update(0.1, [smallTarget], [], []);

      // CCD must catch the collision and transition torpedo to SINGULARITY stage!
      expect(torpedo.state).toBe(TorpedoState.SINGULARITY);
    });

    test('CHAL-CCD-02: High simulated lag (dt = 0.1s, 58px displacement) passing over barricade', () => {
      const torpedo = new CavitationTorpedo(250, 600, DEFAULT_TORPEDO_CONFIG, 180);
      torpedo.state = TorpedoState.ARMED;
      torpedo.velocity.y = -580;

      // Barricade placed at y=575, height=10 [575, 585]
      // In 0.1s, torpedo moves from y=600 to y=542.
      // Start: [600, 626] > 585. End: [542, 568] < 575.
      // Zero overlap at both start and end!
      const thinBarricade = new Barricade(240, 575, BarricadeType.DESTRUCTIBLE);
      (thinBarricade as any).size = { width: 50, height: 10 };

      torpedo.update(0.1, [], [], [thinBarricade]);

      // CCD swept raycast must detect barricade intersection!
      expect(torpedo.state).toBe(TorpedoState.SINGULARITY);
    });

    test('CHAL-CCD-03: Extreme lag spike (dt = 0.2s, 116px jump and dt = 0.5s, 290px jump)', () => {
      // 1. dt = 0.2s: 116px leap
      const t1 = new CavitationTorpedo(300, 600, DEFAULT_TORPEDO_CONFIG, 180);
      t1.state = TorpedoState.ARMED;
      t1.velocity.y = -580;

      const target1 = new TestTarget(295, 530, 20, 20);
      t1.update(0.2, [target1], [], []);
      expect(t1.state).toBe(TorpedoState.SINGULARITY);

      // 2. dt = 0.5s: 290px leap
      const t2 = new CavitationTorpedo(300, 700, DEFAULT_TORPEDO_CONFIG, 180);
      t2.state = TorpedoState.ARMED;
      t2.velocity.y = -580;

      const target2 = new TestTarget(295, 550, 20, 20);
      t2.update(0.5, [target2], [], []);
      expect(t2.state).toBe(TorpedoState.SINGULARITY);
    });

    test('CHAL-CCD-04: Precision near-miss does NOT trigger false-positive detonation', () => {
      const torpedo = new CavitationTorpedo(300, 500, DEFAULT_TORPEDO_CONFIG, 180);
      torpedo.state = TorpedoState.ARMED;
      torpedo.velocity.y = -580;

      // Torpedo hitRadius = 13. Center X = 307.
      // Small target radius = 15. Combined radius = 28px.
      // Place target center X at 307 + 28 + 4 = 339 (target position.x = 339 - 15 = 324).
      // Target is directly beside the flight corridor, 4px clear of the swept cylinder.
      const nearMissTarget = new TestTarget(324, 470, 30, 30);

      torpedo.update(0.1, [nearMissTarget], [], []);

      // Torpedo must NOT collide with the near-miss target!
      expect(torpedo.state).toBe(TorpedoState.ARMED);
    });

    test('CHAL-CCD-05: INERT torpedo deals blunt collision damage without detonating into singularity', () => {
      const torpedo = new CavitationTorpedo(300, 500, DEFAULT_TORPEDO_CONFIG, 180);
      torpedo.state = TorpedoState.INERT;
      torpedo.velocity.y = -180;

      const target = new TestTarget(295, 485, 30, 30);
      expect(target.hp).toBe(100);

      torpedo.update(0.1, [target], [], []);

      // Inert collision deals 15 damage
      expect(target.hp).toBe(85);
      // Torpedo must NOT detonate into singularity (remains INERT)
      expect(torpedo.state).toBe(TorpedoState.INERT);
    });
  });

  // =========================================================================
  // SECTION 3: SWEPT AABB FALSE-POSITIVE PHANTOM HITS (Entity.ts)
  // =========================================================================
  test.describe('Section 3: Entity.sweptAABB() False-Positive Phantom Hits on Diagonal Trajectories', () => {

    test('CHAL-AABB-01: Up-Right diagonal trajectory eliminates corner false positives', () => {
      // Entity 1 moving diagonally from (100, 500) to (300, 300)
      const mover = new TestTarget(300, 300, 8, 8);
      mover.prevPosition = { x: 100, y: 500 };

      // Swept broadphase AABB is [100, 308] x [300, 508].
      // Off-path Entity in top-left corner: (120, 320), size 20x20.
      // True trajectory at x=120 is at y=480 (160px away).
      const topLeftPhantom = new TestTarget(120, 320, 20, 20);
      expect(mover.checkCollision(topLeftPhantom)).toBe(false);
      expect(mover.sweptAABB(topLeftPhantom)).toBe(false);

      // Off-path Entity in bottom-right corner: (280, 480), size 20x20.
      // True trajectory at x=280 is at y=320 (160px away).
      const bottomRightPhantom = new TestTarget(280, 480, 20, 20);
      expect(mover.checkCollision(bottomRightPhantom)).toBe(false);
      expect(mover.sweptAABB(bottomRightPhantom)).toBe(false);
    });

    test('CHAL-AABB-02: Down-Right diagonal trajectory eliminates corner false positives', () => {
      // Entity 1 moving diagonally from (100, 100) to (400, 400)
      const mover = new TestTarget(400, 400, 10, 10);
      mover.prevPosition = { x: 100, y: 100 };

      // Swept broadphase AABB is [100, 410] x [100, 410].
      // Bottom-Left corner: (110, 380), size 20x20
      const bottomLeftPhantom = new TestTarget(110, 380, 20, 20);
      expect(mover.checkCollision(bottomLeftPhantom)).toBe(false);
      expect(mover.sweptAABB(bottomLeftPhantom)).toBe(false);

      // Top-Right corner: (380, 110), size 20x20
      const topRightPhantom = new TestTarget(380, 110, 20, 20);
      expect(mover.checkCollision(topRightPhantom)).toBe(false);
      expect(mover.sweptAABB(topRightPhantom)).toBe(false);
    });

    test('CHAL-AABB-03: Up-Left & Down-Left diagonal trajectories (all 4 quadrants)', () => {
      // Up-Left: (400, 500) -> (100, 200)
      const upLeftMover = new TestTarget(100, 200, 8, 8);
      upLeftMover.prevPosition = { x: 400, y: 500 };

      const phantom1 = new TestTarget(380, 220, 20, 20);
      expect(upLeftMover.checkCollision(phantom1)).toBe(false);

      // Down-Left: (400, 100) -> (100, 400)
      const downLeftMover = new TestTarget(100, 400, 8, 8);
      downLeftMover.prevPosition = { x: 400, y: 100 };

      const phantom2 = new TestTarget(380, 380, 20, 20);
      expect(downLeftMover.checkCollision(phantom2)).toBe(false);
    });

    test('CHAL-AABB-04: Corner grazing discrimination (1px outside vs 1px inside)', () => {
      // Stationary target at (200, 200), size 40x40 (span [200, 240] x [200, 240])
      const target = new TestTarget(200, 200, 40, 40);

      // Mover bullet: size 10x10.
      // Minkowski expanded target: x in [200 - 10, 240] = [190, 240], y in [190, 240].
      // Trajectory 1: passing vertically at x = 188 (2px to the left of expanded target):
      const outsideBullet = new TestTarget(188, 300, 10, 10);
      outsideBullet.prevPosition = { x: 188, y: 100 };
      expect(outsideBullet.checkCollision(target)).toBe(false);

      // Trajectory 2: passing vertically at x = 191 (1px inside expanded target):
      const insideBullet = new TestTarget(191, 300, 10, 10);
      insideBullet.prevPosition = { x: 191, y: 100 };
      expect(insideBullet.checkCollision(target)).toBe(true);
    });

    test('CHAL-AABB-05: Opposing high-speed entities (True crossing vs parallel offset)', () => {
      // Entity 1 moving (100, 100) -> (300, 300)
      const e1 = new TestTarget(300, 300, 10, 10);
      e1.prevPosition = { x: 100, y: 100 };

      // Entity 2 moving (100, 300) -> (300, 100)
      // At t=0.5, E1 is at (200, 200) and E2 is at (200, 200). True temporal crossing!
      const e2 = new TestTarget(300, 100, 10, 10);
      e2.prevPosition = { x: 100, y: 300 };

      expect(e1.checkCollision(e2)).toBe(true);

      // Entity 3 moving (180, 300) -> (380, 100) (shifted in X by 80px)
      // At any t in [0, 1], delta X is 80px, while combined width is only 20px!
      const e3 = new TestTarget(380, 100, 10, 10);
      e3.prevPosition = { x: 180, y: 300 };

      expect(e1.checkCollision(e3)).toBe(false);
    });
  });

  // =========================================================================
  // SECTION 4: 4-SIDED BOUNDARY CULLING & NON-FINITE COORDINATES
  // =========================================================================
  test.describe('Section 4: 4-Sided Boundary Culling & Coordinate Extremes', () => {

    test('CHAL-CULL-01: HadalBioHorrors extreme negative positions (x < -150, y < -150)', () => {
      const faction = new HadalBioHorrors();
      faction.units = [];

      // Place units with extreme negative coordinates far beyond 1-frame traversal distance
      const u1 = faction.spawnParasiteClinger(-300, 300);
      const u2 = faction.spawnParasiteClinger(-10000, 300);
      const u3 = faction.spawnParasiteClinger(300, -300);
      const u4 = faction.spawnParasiteClinger(300, -10000);

      expect(faction.units.length).toBe(4);

      const ctx = createMockFlagshipContext();
      faction.update(0.016, ctx);

      // All 4 units beyond negative boundaries must be culled
      expect(faction.units.length).toBe(0);
    });

    test('CHAL-CULL-02: HadalBioHorrors extreme positive positions (x > 750, y > 850)', () => {
      const faction = new HadalBioHorrors();
      faction.units = [];

      // Place units with extreme positive coordinates far beyond 1-frame traversal distance
      const u1 = faction.spawnParasiteClinger(900, 300);
      const u2 = faction.spawnParasiteClinger(99999, 300);
      const u3 = faction.spawnParasiteClinger(300, 950);
      const u4 = faction.spawnParasiteClinger(300, 99999);

      expect(faction.units.length).toBe(4);

      const ctx = createMockFlagshipContext();
      faction.update(0.016, ctx);

      // All 4 units beyond positive boundaries must be culled
      expect(faction.units.length).toBe(0);
    });

    test('CHAL-CULL-03: Boundary threshold exactness with stationary units (stunned/zero velocity)', () => {
      const faction = new HadalBioHorrors();
      faction.units = [];

      // Create units with zero velocity to test precise boundary geometry:
      // Boundary is x in [-150, 750], y in [-150, 850]
      const makeStationary = (x: number, y: number): BioHorrorUnit => ({
        id: Math.floor(Math.random() * 1000000),
        type: 'SIPHONER',
        position: { x, y },
        velocity: { x: 0, y: 0 },
        width: 32,
        height: 20,
        hp: 40,
        maxHp: 40,
        isDead: false,
        alpha: 1.0,
        hitFlashTimer: 0,
        animTimer: 0,
        stunTimer: 0, // Unstunned to allow culling logic to execute
      });

      // Inside boundary
      const uInLeft = makeStationary(-149, 300);
      const uInRight = makeStationary(749, 300);
      const uInTop = makeStationary(300, -149);
      const uInBottom = makeStationary(300, 849);

      // Outside boundary
      const uOutLeft = makeStationary(-151, 300);
      const uOutRight = makeStationary(751, 300);
      const uOutTop = makeStationary(300, -151);
      const uOutBottom = makeStationary(300, 851);

      faction.units = [uInLeft, uInRight, uInTop, uInBottom, uOutLeft, uOutRight, uOutTop, uOutBottom];
      expect(faction.units.length).toBe(8);

      const ctx = createMockFlagshipContext();
      faction.update(0.016, ctx);

      // Outside units must be culled, inside units must remain
      expect(faction.units.includes(uOutLeft), 'uOutLeft culled').toBe(false);
      expect(faction.units.includes(uOutRight), 'uOutRight culled').toBe(false);
      expect(faction.units.includes(uOutTop), 'uOutTop culled').toBe(false);
      expect(faction.units.includes(uOutBottom), 'uOutBottom culled').toBe(false);

      expect(faction.units.includes(uInLeft), 'uInLeft survives').toBe(true);
      expect(faction.units.includes(uInRight), 'uInRight survives').toBe(true);
      expect(faction.units.includes(uInTop), 'uInTop survives').toBe(true);
      expect(faction.units.includes(uInBottom), 'uInBottom survives').toBe(true);
      expect(faction.units.length).toBe(4);
    });

    test('CHAL-CULL-03b: StunTimer > 0 does NOT bypass 4-sided boundary culling (Remediated)', () => {
      const faction = new HadalBioHorrors();
      faction.units = [];

      // Create an outside unit that is stunned
      const stunnedOutUnit: BioHorrorUnit = {
        id: 7777,
        type: 'SIPHONER',
        position: { x: -999, y: -999 },
        velocity: { x: 0, y: 0 },
        width: 32,
        height: 20,
        hp: 40,
        maxHp: 40,
        isDead: false,
        alpha: 1.0,
        hitFlashTimer: 0,
        animTimer: 0,
        stunTimer: 2.0, // Stunned!
      };

      faction.units.push(stunnedOutUnit);
      const ctx = createMockFlagshipContext();
      faction.update(0.016, ctx);

      // Stunned outside unit must now be cleanly culled!
      const survived = faction.units.includes(stunnedOutUnit);
      console.log('CHAL-CULL-03b: Stunned outside unit culled properly:', !survived);
      expect(survived).toBe(false);
    });

    test('CHAL-CULL-04: AutomatonPhalanx railSlugs 4-sided boundary culling', () => {
      const phalanx = new AutomatonPhalanx();
      phalanx.railSlugs = [
        { x: -101, y: 300, vx: -50, vy: 0, damage: 15, isDead: false }, // Left out
        { x: 701, y: 300, vx: 50, vy: 0, damage: 15, isDead: false },   // Right out
        { x: 300, y: -101, vx: 0, vy: -50, damage: 15, isDead: false },  // Top out
        { x: 300, y: 851, vx: 0, vy: 50, damage: 15, isDead: false },   // Bottom out
        { x: 300, y: 300, vx: 0, vy: 50, damage: 15, isDead: false },   // Valid inside
      ];

      const ctx = createMockFlagshipContext();
      phalanx.update(0.016, ctx);

      // Only the 1 inside slug should remain
      expect(phalanx.railSlugs.length).toBe(1);
      expect(phalanx.railSlugs[0].x).toBe(300);
      // y integrated by 50 * 0.016 = 0.8 => 300.8
      expect(phalanx.railSlugs[0].y).toBeCloseTo(300.8, 1);
    });

    test('CHAL-CULL-05: Non-finite (NaN / Infinity) coordinate boundary leak investigation', () => {
      const faction = new HadalBioHorrors();
      faction.units = [];

      // Spawn unit with NaN coordinates
      const nanUnit = faction.spawnParasiteClinger(NaN, NaN);
      const ctx = createMockFlagshipContext();
      faction.update(0.016, ctx);

      // In JavaScript, NaN < -150 and NaN > 750 are both false.
      // Therefore, standard boundary checks (x < -150 || x > 750) do NOT cull NaN entities!
      // Verify whether the unit survived in memory:
      const nanSurvived = faction.units.includes(nanUnit);

      // If NaN survived, this documents an empirical vulnerability in boundary culling!
      console.log('CHAL-CULL-05 Investigation: Did NaN unit survive boundary culling?', nanSurvived);

      // Drawing the NaN unit passes NaN to ctx.translate(NaN, NaN)
      const { ctx: mockCtx, translateCalls } = createMockCanvasContext();
      faction.drawWorld(mockCtx, 1.0);

      const hasNanTranslate = translateCalls.some(t => !Number.isFinite(t.x) || !Number.isFinite(t.y));
      // Verify that NaN unit is culled and does not poison canvas
      expect(nanSurvived, 'NaN unit must be culled').toBe(false);
      expect(hasNanTranslate, 'NaN coordinates must not propagate to ctx.translate').toBe(false);
      expect(typeof nanSurvived).toBe('boolean');
    });
  });
});

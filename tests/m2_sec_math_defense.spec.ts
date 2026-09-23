import { test, expect } from '@playwright/test';
import { Bullet, HomingMissile } from '../src/game/Bullet';
import { Entity } from '../src/game/Entity';
import { Barricade, BarricadeType } from '../src/game/Barricade';
import { Faction, GameState } from '../src/game/types';
import { CrisisSovereign } from '../src/game/crisis/CrisisSovereign';
import { AutomatonShieldGrid } from '../src/game/flagship/factions/AutomatonShieldGrid';
import { BioluminescentLaserSystem } from '../src/game/flagship/weapons/BioluminescentLaser';
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

// Minimal dummy entity for testing collision geometry
class TestEntity extends Entity {
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

test.describe('M2 Security, CCD & Math Defense Suite', () => {

  // =========================================================================
  // PILLAR 1: DEF-SEC-01 - COORDINATE MATH & NaN DEFENSE
  // =========================================================================
  test.describe('Pillar 1: NaN Resistance & Coordinate Math Defense', () => {

    test('DEF-SEC-01.1: Homing Bullet angle, position, and smokeTrail are immune to NaN targets', () => {
      const missile = new HomingMissile(300, 400, 4);

      // Assign target with NaN coordinates
      const nanTarget = new TestEntity(NaN, NaN, 32, 32);
      missile.target = nanTarget;

      // Update kinematics
      missile.update(0.016, [nanTarget], null);

      expect(Number.isFinite(missile.angle)).toBe(true);
      expect(Number.isFinite(missile.velocity.x)).toBe(true);
      expect(Number.isFinite(missile.velocity.y)).toBe(true);
      expect(Number.isFinite(missile.position.x)).toBe(true);
      expect(Number.isFinite(missile.position.y)).toBe(true);

      // Verify smokeTrail contains only finite numbers
      for (const s of missile.smokeTrail) {
        expect(Number.isFinite(s.x)).toBe(true);
        expect(Number.isFinite(s.y)).toBe(true);
        expect(Number.isFinite(s.r)).toBe(true);
        expect(Number.isFinite(s.alpha)).toBe(true);
      }

      // Verify drawing never passes NaN to canvas
      const { ctx, arcCalls, translateCalls, rotateCalls } = createMockCanvasContext();
      missile.draw(ctx);

      for (const call of translateCalls) {
        expect(Number.isFinite(call.x)).toBe(true);
        expect(Number.isFinite(call.y)).toBe(true);
      }
      for (const angle of rotateCalls) {
        expect(Number.isFinite(angle)).toBe(true);
      }
      for (const call of arcCalls) {
        expect(Number.isFinite(call.x)).toBe(true);
        expect(Number.isFinite(call.y)).toBe(true);
        expect(Number.isFinite(call.r)).toBe(true);
      }
    });

    test('DEF-SEC-01.2: Homing Bullet handles zero-distance epsilon smoothly without division by zero', () => {
      const missile = new HomingMissile(300, 400, 4);
      // Target placed exactly coincident with missile center
      const coincidentTarget = new TestEntity(300, 400, missile.size.width, missile.size.height);
      missile.target = coincidentTarget;

      missile.update(0.016, [coincidentTarget], null);

      expect(Number.isFinite(missile.angle)).toBe(true);
      expect(Number.isFinite(missile.velocity.x)).toBe(true);
      expect(Number.isFinite(missile.velocity.y)).toBe(true);
    });

    test('DEF-SEC-01.3: CrisisSovereign eyeAngle and pupil rendering are guarded against NaN', () => {
      const sovereign = new CrisisSovereign(170, 65);

      // Update with NaN player position
      sovereign.update(0.016, { x: NaN, y: NaN } as any);
      expect(Number.isFinite(sovereign.eyeAngle)).toBe(true);

      // Manually poison eyeAngle with NaN to test draw guard
      sovereign.eyeAngle = NaN;
      sovereign.position.x = 170;
      sovereign.position.y = 65;

      const { ctx, arcCalls } = createMockCanvasContext();
      sovereign.draw(ctx);

      expect(Number.isFinite(sovereign.eyeAngle)).toBe(true);
      for (const call of arcCalls) {
        expect(Number.isFinite(call.x)).toBe(true);
        expect(Number.isFinite(call.y)).toBe(true);
        expect(Number.isFinite(call.r)).toBe(true);
      }
    });

    test('DEF-SEC-01.4: AutomatonShieldGrid bulletSpeed guards against Infinity and NaN velocities', () => {
      const grid = new AutomatonShieldGrid();
      // Register an active drone
      grid.registerDrone({
        id: 1,
        x: 300,
        y: 200,
        shieldNormal: { x: 0, y: 1 },
        shieldHp: 100,
        maxShieldHp: 100,
        isFrontalShieldActive: true,
        isBacklashStunned: false,
        stunTimer: 0,
        linkedDroneIds: [],
      });

      const testDrone = grid.drones.get(1)!;
      expect(testDrone).toBeDefined();

      // Test with Infinity velocity (Infinity / Infinity would yield NaN)
      const resInf = grid.resolveHit(testDrone.id, { x: 300, y: 300 }, { x: Infinity, y: 0 }, 50, false);
      expect(typeof resInf.isDeflected).toBe('boolean');
      expect(Number.isFinite(resInf.damageToHull)).toBe(true);
      expect(Number.isFinite(resInf.damageToShield)).toBe(true);

      // Test with NaN velocity
      const resNaN = grid.resolveHit(testDrone.id, { x: 300, y: 300 }, { x: NaN, y: NaN }, 50, false);
      expect(typeof resNaN.isDeflected).toBe('boolean');
      expect(Number.isFinite(resNaN.damageToHull)).toBe(true);

      // Test with zero velocity
      const resZero = grid.resolveHit(testDrone.id, { x: 300, y: 300 }, { x: 0, y: 0 }, 50, false);
      expect(typeof resZero.isDeflected).toBe('boolean');
    });

    test('DEF-SEC-01.5: BioluminescentLaser lenSq guards against NaN and sub-pixel degenerate segments', () => {
      const laser = new BioluminescentLaserSystem();
      const enemy = new TestEntity(200, 300, 30, 30);

      // Test with NaN coordinates: should return early without throwing
      expect(() => {
        (laser as any).damageEnemiesAlongSegment(NaN, 100, 200, 300, 50, [enemy]);
      }).not.toThrow();
      expect(enemy.hp).toBe(100);

      // Test with degenerate zero length: (100, 100) -> (100, 100)
      expect(() => {
        (laser as any).damageEnemiesAlongSegment(100, 100, 100, 100, 50, [enemy]);
      }).not.toThrow();
      expect(enemy.hp).toBe(100);

      // Test with valid intersecting segment: (200, 100) -> (200, 500)
      (laser as any).damageEnemiesAlongSegment(200, 100, 200, 500, 30, [enemy]);
      expect(enemy.hp).toBe(70);
    });
  });

  // =========================================================================
  // PILLAR 2: DEF-SEC-02 - CONTINUOUS COLLISION DETECTION (CCD) & TUNNELING
  // =========================================================================
  test.describe('Pillar 2: Continuous Collision Detection & Anti-Tunneling', () => {

    test('DEF-SEC-02.1: Entity sweptAABB eliminates diagonal false-positive phantom hits', () => {
      // Entity 1 moving diagonally from (100, 500) to (300, 300)
      const bullet = new TestEntity(300, 300, 4, 4);
      bullet.prevPosition = { x: 100, y: 500 };

      // Entity 2 at (120, 320) with size 20x20.
      // In broadphase swept AABB, [100, 304]x[300, 504] encloses (120, 320).
      // But the diagonal trajectory passes at y=480 when x=120, so it is 160px away!
      const offPathEnemy = new TestEntity(120, 320, 20, 20);

      const isColliding = bullet.checkCollision(offPathEnemy);
      const isSwept = bullet.sweptAABB(offPathEnemy);

      expect(isColliding).toBe(false);
      expect(isSwept).toBe(false);
    });

    test('DEF-SEC-02.2: Entity sweptAABB detects true collisions along diagonal trajectory', () => {
      // Entity 1 moving diagonally from (100, 500) to (300, 300)
      const bullet = new TestEntity(300, 300, 4, 4);
      bullet.prevPosition = { x: 100, y: 500 };

      // Entity on path at (200, 400), size 20x20
      const onPathEnemy = new TestEntity(200, 400, 20, 20);

      const isColliding = bullet.checkCollision(onPathEnemy);
      const isSwept = bullet.sweptAABB(onPathEnemy);

      expect(isColliding).toBe(true);
      expect(isSwept).toBe(true);
    });

    test('DEF-SEC-02.3: Entity sweptAABB detects opposing head-on high-speed collisions', () => {
      // Bullet 1 moving downwards: (200, 100) -> (200, 300)
      const bullet1 = new TestEntity(200, 300, 6, 6);
      bullet1.prevPosition = { x: 200, y: 100 };

      // Bullet 2 moving upwards: (200, 400) -> (200, 200)
      const bullet2 = new TestEntity(200, 200, 6, 6);
      bullet2.prevPosition = { x: 200, y: 400 };

      // At end-of-frame, bullet1 is at y=300 and bullet2 is at y=200; instantaneous boxes do NOT overlap
      expect(bullet1.getRect().y).toBe(300);
      expect(bullet2.getRect().y).toBe(200);

      // But relative trajectory crossed at y=250!
      const isColliding = bullet1.checkCollision(bullet2);
      expect(isColliding).toBe(true);
    });

    test('DEF-SEC-02.4: Cavitation Torpedo continuous swept segment prevents tunneling through hostiles at 580 px/s', () => {
      // Create armed torpedo moving upward at 580 px/s
      const torpedo = new CavitationTorpedo(300, 500, DEFAULT_TORPEDO_CONFIG, 180);
      torpedo.state = TorpedoState.ARMED;
      torpedo.velocity.y = -580;

      // Small hostile placed at y=485, size 16x16
      const hostile = new TestEntity(296, 485, 16, 16);

      // On a lag spike of 0.05s (20 FPS), displacement is 29px.
      // Instantaneous y goes from 500 to 471.
      // Discrete point check at end (y=471) would be 14px away and tunnel through hostile at y=485!
      torpedo.update(0.05, [hostile], []);

      // Swept check must detect hostile and trigger remote detonation!
      expect(torpedo.state).toBe(TorpedoState.SINGULARITY);
    });

    test('DEF-SEC-02.5: Cavitation Torpedo continuous swept segment prevents tunneling through barricades', () => {
      const torpedo = new CavitationTorpedo(250, 600, DEFAULT_TORPEDO_CONFIG, 180);
      torpedo.state = TorpedoState.ARMED;
      torpedo.velocity.y = -580;

      // Barricade placed at y=580, height 40
      const barricade = new Barricade(240, 580, BarricadeType.DESTRUCTIBLE);

      // 0.05s step: y jumps from 600 to 571, traversing past barricade
      torpedo.update(0.05, [], [], [barricade]);

      // Torpedo must detect barricade and detonate into singularity
      expect(torpedo.state).toBe(TorpedoState.SINGULARITY);
    });
  });

  // =========================================================================
  // PILLAR 3: DEF-SEC-03 - 4-SIDED BOUNDS CULLING & SHOP / PAUSE FREEZE
  // =========================================================================
  test.describe('Pillar 3: 4-Sided Bounds Culling & Shop/Pause Freeze', () => {

    test('DEF-SEC-03.1: HadalBioHorrors applies 4-sided bounds culling in all directions', () => {
      const faction = new HadalBioHorrors();
      faction.units = [];

      // Spawn 4 units:
      // Unit 1: pushed beyond left bound (x < -150)
      const uLeft = faction.spawnParasiteClinger(-160, 300);
      // Unit 2: pushed beyond right bound (x > 750)
      const uRight = faction.spawnParasiteClinger(760, 300);
      // Unit 3: pushed beyond top bound (y < -150)
      const uTop = faction.spawnParasiteClinger(300, -160);
      // Unit 4: valid in-bounds (100, 300)
      const uValid = faction.spawnParasiteClinger(100, 300);

      expect(faction.units.length).toBe(4);

      const ctx = createMockFlagshipContext();
      faction.update(0.016, ctx);

      // Off-screen units on all 4 sides must be culled
      expect(faction.units.includes(uLeft)).toBe(false);
      expect(faction.units.includes(uRight)).toBe(false);
      expect(faction.units.includes(uTop)).toBe(false);
      expect(faction.units.includes(uValid)).toBe(true);
      expect(faction.units.length).toBe(1);
    });

    test('DEF-SEC-03.2: Broodmother parasite spawn timer is frozen during GameState.SHOP', () => {
      const faction = new HadalBioHorrors();
      faction.units = [];

      // Create Broodmother unit
      const broodmother: BioHorrorUnit = {
        id: 9999,
        type: 'BROODMOTHER',
        position: { x: 300, y: 120 },
        velocity: { x: 20, y: 0 },
        width: 80,
        height: 60,
        hp: 500,
        maxHp: 500,
        isDead: false,
        alpha: 1.0,
        hitFlashTimer: 0,
        animTimer: 0,
        spawnTimer: 8.0,
      };
      faction.units.push(broodmother);

      // Context with state = GameState.SHOP
      const shopCtx = createMockFlagshipContext({ state: GameState.SHOP });

      // Simulate 15 seconds in SHOP
      for (let i = 0; i < 15; i++) {
        faction.update(1.0, shopCtx);
      }

      // Timer must be frozen at 8.0 and no parasites spawned!
      expect(broodmother.spawnTimer).toBe(8.0);
      expect(faction.units.length).toBe(1); // Only broodmother, 0 minions

      // Now resume with state = GameState.PLAYING
      const playCtx = createMockFlagshipContext({ state: GameState.PLAYING });
      // Simulate 9 seconds of gameplay
      for (let i = 0; i < 9; i++) {
        faction.update(1.0, playCtx);
      }

      // Minions must now be spawned!
      expect(faction.units.length).toBeGreaterThan(1);
    });

    test('DEF-SEC-03.3: AutomatonPhalanx railSlugs are culled in all 4 directions', () => {
      const phalanx = new AutomatonPhalanx();
      phalanx.railSlugs = [
        { x: -110, y: 300, vx: -50, vy: 0, damage: 15, isDead: false }, // Left out-of-bounds
        { x: 710, y: 300, vx: 50, vy: 0, damage: 15, isDead: false },   // Right out-of-bounds
        { x: 300, y: -110, vx: 0, vy: -50, damage: 15, isDead: false },  // Top out-of-bounds
        { x: 300, y: 300, vx: 0, vy: 200, damage: 15, isDead: false },  // In-bounds
      ];

      const ctx = createMockFlagshipContext();
      phalanx.update(0.016, ctx);

      // Left, right, and top exiting slugs must be culled
      expect(phalanx.railSlugs.length).toBe(1);
      expect(phalanx.railSlugs[0].x).toBe(300);
    });
  });

  // =========================================================================
  // PILLAR 4: DEF-SEC-04 - POINTER CLAMPING & INPUT SANITIZATION
  // =========================================================================
  test.describe('Pillar 4: Pointer Clamping & Input Sanitization', () => {

    test('DEF-SEC-04.1: Browser canvas pointer events clamp coordinates to [0, logicalWidth] and [0, logicalHeight]', async ({ page }) => {
      const targetUrl = process.env.TARGET_URL || 'http://localhost:3005';
      await page.goto(targetUrl);
      await page.waitForLoadState('networkidle');

      // Wait for gameManager to be available on window
      await page.waitForFunction(() => (window as any).gameManager !== undefined);

      // Start game
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        if (gm && gm.state !== 'PLAYING') {
          gm.startGame();
        }
      });

      await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

      // Dispatch synthetic pointerdown with negative and extreme coordinates
      const pointerResults = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        if (!gm) return null;

        const calls: Array<{ x: number; y: number; isDown: boolean; button: number }> = [];
        const originalHandlePointer = gm.handlePointer.bind(gm);
        gm.handlePointer = (x: number, y: number, isDown: boolean, button: number) => {
          calls.push({ x, y, isDown, button });
          return originalHandlePointer(x, y, isDown, button);
        };

        const canvas = document.querySelector('canvas');
        if (!canvas) return null;

        // Dispatch pointerdown far to the left of canvas (-500)
        canvas.dispatchEvent(new PointerEvent('pointerdown', {
          clientX: -500,
          clientY: -200,
          button: 0,
          bubbles: true,
          pointerId: 1,
        }));

        // Dispatch pointerdown far to the right (+2500)
        canvas.dispatchEvent(new PointerEvent('pointerdown', {
          clientX: 2500,
          clientY: 3000,
          button: 0,
          bubbles: true,
          pointerId: 2,
        }));

        // Dispatch pointerdown with NaN coordinates
        const nanEvent = new PointerEvent('pointerdown', {
          clientX: 0,
          clientY: 0,
          button: 0,
          bubbles: true,
          pointerId: 3,
        });
        Object.defineProperty(nanEvent, 'clientX', { value: NaN });
        Object.defineProperty(nanEvent, 'clientY', { value: NaN });
        canvas.dispatchEvent(nanEvent);

        return {
          logicalWidth: gm.logicalWidth,
          logicalHeight: gm.logicalHeight,
          calls,
        };
      });

      expect(pointerResults).not.toBeNull();
      const { logicalWidth, logicalHeight, calls } = pointerResults!;

      // Verify that all forwarded coordinates are strictly within [0, logicalWidth] and [0, logicalHeight]
      // and none are NaN
      expect(calls.length).toBeGreaterThan(0);
      for (const call of calls) {
        expect(Number.isFinite(call.x)).toBe(true);
        expect(Number.isFinite(call.y)).toBe(true);
        expect(call.x).toBeGreaterThanOrEqual(0);
        expect(call.x).toBeLessThanOrEqual(logicalWidth);
        expect(call.y).toBeGreaterThanOrEqual(0);
        expect(call.y).toBeLessThanOrEqual(logicalHeight);
      }
    });
  });
});

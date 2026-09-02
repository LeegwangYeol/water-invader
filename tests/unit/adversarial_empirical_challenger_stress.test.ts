import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Player } from '../../src/game/Player';
import { Bullet } from '../../src/game/Bullet';
import { Enemy } from '../../src/game/Enemy';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import {
  HazardProjectile,
  SolarFlareBeam,
  GameState,
  CrisisType,
  CrisisArchetype,
  CrisisPhase,
  Faction,
  EnemyType,
} from '../../src/game/types';

/**
 * Mock Canvas & 2D Rendering Context for Headless Simulation
 */
function createMockCanvas(width: number = 600, height: number = 800): HTMLCanvasElement {
  return {
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
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1.0,
      shadowColor: '#000000',
      shadowBlur: 0,
    }),
  } as unknown as HTMLCanvasElement;
}

/**
 * High-performance numeric invariant verification
 */
function verifyNumericInvariants(gm: GameManager, label: string) {
  const p = gm.player;
  if (p) {
    if (Number.isNaN(p.position.x) || !Number.isFinite(p.position.x)) {
      throw new Error(`${label}: player.position.x is NaN/Infinite: ${p.position.x}`);
    }
    if (Number.isNaN(p.position.y) || !Number.isFinite(p.position.y)) {
      throw new Error(`${label}: player.position.y is NaN/Infinite: ${p.position.y}`);
    }
    if (Number.isNaN(p.hp) || p.hp < 0) {
      throw new Error(`${label}: player.hp is invalid: ${p.hp}`);
    }
  }

  for (let i = 0; i < gm.hazardProjectiles.length; i++) {
    const hz = gm.hazardProjectiles[i];
    if (Number.isNaN(hz.x) || !Number.isFinite(hz.x)) {
      throw new Error(`${label}: hazard[${i}].x is NaN/Infinite: ${hz.x}`);
    }
    if (Number.isNaN(hz.y) || !Number.isFinite(hz.y)) {
      throw new Error(`${label}: hazard[${i}].y is NaN/Infinite: ${hz.y}`);
    }
  }

  for (let i = 0; i < gm.bullets.length; i++) {
    const b = gm.bullets[i];
    if (Number.isNaN(b.position.x) || !Number.isFinite(b.position.x)) {
      throw new Error(`${label}: bullet[${i}].position.x is NaN/Infinite: ${b.position.x}`);
    }
    if (Number.isNaN(b.position.y) || !Number.isFinite(b.position.y)) {
      throw new Error(`${label}: bullet[${i}].position.y is NaN/Infinite: ${b.position.y}`);
    }
  }

  for (let i = 0; i < gm.solarFlares.length; i++) {
    const sf = gm.solarFlares[i];
    if (Number.isNaN(sf.x) || !Number.isFinite(sf.x)) {
      throw new Error(`${label}: solarFlare[${i}].x is NaN/Infinite: ${sf.x}`);
    }
    if (Number.isNaN(sf.width) || !Number.isFinite(sf.width)) {
      throw new Error(`${label}: solarFlare[${i}].width is NaN/Infinite: ${sf.width}`);
    }
  }
}

test.describe('Empirical Adversarial Stress Suite: Combat Simulations & Hazard Mechanics', () => {

  // =========================================================================
  // 1. High-Density Acid Storm Stress Tests (100+ droplets with & without shield)
  // =========================================================================
  test.describe('1. High-Density Acid Storm Stress', () => {

    test('STRESS-ACID-01: High-Density 120-droplet barrage WITHOUT Acid Shield (Damage & Invariants)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.player.hasAcidShield = false;
      gm.player.hp = 5;
      gm.player.maxHp = 5;
      gm.player.invincibilityTimer = 0;

      const px = gm.player.position.x;
      const py = gm.player.position.y;
      const count = 120;

      // Spawn 120 droplets packed across and above the player hitbox
      gm.hazardProjectiles = Array.from({ length: count }, (_, i) => ({
        x: px + (i % 8) * 5,
        y: py - 50 + Math.floor(i / 8) * 6,
        radius: 4 + (i % 4),
        speedY: 200 + (i % 10) * 15,
        speedX: (i % 2 === 0 ? 1 : -1) * (i % 5) * 5,
        damage: 1,
        color: '#a3e635',
        isDead: false,
      }));

      expect(gm.hazardProjectiles.length).toBe(120);

      // Simulate 60 ticks (1.0s at 60 FPS)
      for (let ticks = 0; ticks < 60; ticks++) {
        (gm as any).update(1 / 60);
        verifyNumericInvariants(gm, `Acid-01 tick ${ticks}`);
      }

      // Verify damage was taken properly
      expect(gm.player.hp).toBeLessThan(5);
      expect(gm.player.hp).toBeGreaterThanOrEqual(0);
      expect(gm.player.invincibilityTimer).toBeGreaterThanOrEqual(0);
    });

    test('STRESS-ACID-02: Ultra-Density 250-droplet barrage WITH Acid Shield (100% Deflection, 0 Leakage)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.player.hasAcidShield = true;
      gm.player.hp = 5;
      gm.player.maxHp = 5;
      gm.player.invincibilityTimer = 0;

      const px = gm.player.position.x;
      const py = gm.player.position.y;
      const initialHp = gm.player.hp;
      const count = 250;

      // Spawn 250 dense acid droplets raining directly through player bounding box
      gm.hazardProjectiles = Array.from({ length: count }, (_, i) => ({
        x: px + (i % 10) * 4,
        y: py - 200 + i * 2,
        radius: 5 + (i % 3),
        speedY: 300 + (i % 20) * 10,
        speedX: ((i % 5) - 2) * 8,
        damage: 1,
        color: '#a3e635',
        isDead: false,
      }));

      // Simulate 120 ticks (2.0s at 60 FPS)
      for (let tick = 0; tick < 120; tick++) {
        (gm as any).update(1 / 60);

        // Zero damage leakage assertion: Player HP MUST remain at initialHp
        expect(gm.player.hp).toBe(initialHp);
        // Player should NEVER receive invincibility frames from shield deflection
        expect(gm.player.invincibilityTimer).toBe(0);
        expect(gm.state).toBe(GameState.PLAYING);

        verifyNumericInvariants(gm, `Acid-02 tick ${tick}`);
      }

      // Verify all 250 droplets have been deflected or pruned
      expect(gm.hazardProjectiles.length).toBe(0);
      expect(gm.player.hp).toBe(initialHp);
    });

    test('STRESS-ACID-03: Extreme boundary check: 500 simultaneous droplets update & particle stability', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.player.hasAcidShield = true;

      // 500 droplets
      gm.hazardProjectiles = Array.from({ length: 500 }, (_, i) => ({
        x: 10 + (i % 580),
        y: -100 + (i % 100),
        radius: 6,
        speedY: 250 + (i % 50),
        speedX: (Math.random() - 0.5) * 20,
        damage: 1,
        color: '#a3e635',
        isDead: false,
      }));

      const startTime = performance.now();
      for (let t = 0; t < 60; t++) {
        (gm as any).update(1 / 60);
      }
      const elapsed = performance.now() - startTime;

      // 60 ticks of 500 projectiles should run in < 250ms in headless node
      expect(elapsed).toBeLessThan(250);
      expect(gm.player.hp).toBe(3);
      expect(gm.state).toBe(GameState.PLAYING);
      verifyNumericInvariants(gm, 'Acid-03 final');
    });
  });

  // =========================================================================
  // 2. Solar Flare Hazard Sweeps + Boss Projectiles + Acid Storm Combined
  // =========================================================================
  test.describe('2. Multi-Hazard Simultaneous Combat Convergence', () => {

    test('STRESS-MULTI-01: Combined Triple Crisis Chaos (Solar Flares + 60 Boss Bullets + 100 Acid Droplets)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.player.hasAcidShield = true;
      gm.player.hp = 5;
      gm.player.maxHp = 5;

      // 1. Setup Solar Flare Crisis
      gm.crisisState = {
        activeCrisis: 'SOLAR_FLARE' as CrisisType,
        timer: 10.0,
        duration: 10.0,
        warningTimer: 0,
        bannerText: 'CONVERGED CATACLYSM HAZARD TEST',
        hazardProjectiles: [],
        solarFlares: [
          { x: 50, width: 80, chargeTimer: 0.1, chargeDuration: 0.5, activeTimer: 2.0, activeDuration: 2.0, damageDealt: false, isDead: false },
          { x: 250, width: 90, chargeTimer: 0.3, chargeDuration: 0.8, activeTimer: 2.5, activeDuration: 2.5, damageDealt: false, isDead: false },
          { x: 450, width: 80, chargeTimer: 0.5, chargeDuration: 1.0, activeTimer: 2.0, activeDuration: 2.0, damageDealt: false, isDead: false },
        ],
        empSuppressionActive: false,
        empTimer: 0,
      };
      gm.solarFlares = [...gm.crisisState.solarFlares!];

      // 2. Setup 100 Acid Storm Hazard Projectiles
      gm.hazardProjectiles = Array.from({ length: 100 }, (_, i) => ({
        x: 20 + (i * 5.5) % 560,
        y: -20 - (i * 8),
        radius: 6,
        speedY: 280,
        speedX: (i % 2 === 0 ? 15 : -15),
        damage: 1,
        color: '#a3e635',
        isDead: false,
      }));

      // 3. Setup 60 High-Velocity Hostile Boss & Rogue Projectiles
      for (let i = 0; i < 60; i++) {
        const ang = (i / 60) * Math.PI * 2;
        const speed = 200 + (i % 10) * 15;
        const b = new Bullet(300, 150, Math.sin(ang) * speed, 1, false);
        b.velocity.x = Math.cos(ang) * speed;
        b.faction = Faction.INVADER;
        b.color = i % 2 === 0 ? '#ef4444' : '#c084fc';
        gm.bullets.push(b);
      }

      // Add a boss enemy firing continuous salvos
      const boss = new Enemy(220, 80, 600, 10, EnemyType.BOSS, 800);
      gm.enemies.push(boss);

      let totalTicks = 0;
      const maxTicks = 300; // 5 seconds at 60 FPS
      const tickTimes: number[] = [];

      while (totalTicks < maxTicks) {
        const t0 = performance.now();
        (gm as any).update(1 / 60);
        const t1 = performance.now();
        tickTimes.push(t1 - t0);
        totalTicks++;

        // Assert 0 NaNs and valid numeric invariants
        verifyNumericInvariants(gm, `Multi-01 tick ${totalTicks}`);
      }

      const avgTick = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length;
      // High performance verification: average tick time must be < 3.0ms
      expect(avgTick).toBeLessThan(3.0);
      expect(totalTicks).toBe(maxTicks);
    });

    test('STRESS-MULTI-02: Solar Flare Damage Resolution & Hit Confirmation', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.player.hp = 5;
      gm.player.invincibilityTimer = 0;

      // Position player inside Solar Flare beam x-bounds
      const flareX = gm.player.position.x - 10;
      const flareW = gm.player.size.width + 20;

      gm.solarFlares = [
        {
          x: flareX,
          width: flareW,
          chargeTimer: 0.04,
          chargeDuration: 0.04,
          activeTimer: 1.0,
          activeDuration: 1.0,
          damageDealt: false,
          isDead: false,
        },
      ];

      // Tick 1: Charging (chargeTimer reduces from 0.04 to 0.02)
      (gm as any).update(0.02);
      expect(gm.player.hp).toBe(5);
      expect(gm.solarFlares[0].damageDealt).toBe(false);

      // Tick 2: Charge finishes (chargeTimer drops from 0.02 to <= 0)
      (gm as any).update(0.03);
      expect(gm.player.hp).toBe(5);

      // Tick 3: Active beam now fires and damages player
      (gm as any).update(0.02);
      expect(gm.player.hp).toBe(4);
      expect(gm.solarFlares[0].damageDealt).toBe(true);
      expect(gm.player.invincibilityTimer).toBeGreaterThan(0);

      // Subsequent ticks within the same flare duration do NOT multi-hit
      (gm as any).update(0.1);
      expect(gm.player.hp).toBe(4);
    });
  });

  // =========================================================================
  // 3. Phase 1 Boss Anchor Destruction Across All 3 Archetypes
  // =========================================================================
  test.describe('3. Phase 1 Boss Anchor Destruction & Invulnerability Contract', () => {

    const testArchetypes = [
      {
        archetype: CrisisArchetype.VOID_SOVEREIGN,
        name: 'Void Sovereign (Dimensional Singularity Rifts)',
      },
      {
        archetype: CrisisArchetype.ABYSSAL_LEVIATHAN,
        name: 'Abyssal Leviathan (Bio-Brood Sacks)',
      },
      {
        archetype: CrisisArchetype.CYBERNETIC_EXTERMINATOR,
        name: 'Cybernetic Exterminator (EMP Laser Pylons)',
      },
    ];

    for (const config of testArchetypes) {
      test(`STRESS-BOSS-ANCHOR: ${config.name} - Complete Phase 1 Shield & Invulnerability Lifecycle`, () => {
        const crisis = new EndGameCrisis(600, 800);
        const player = new Player(600, 800);
        const bullets: Bullet[] = [];
        const particles: any[] = [];

        // 1. Start Incursion
        crisis.startIncursion(config.archetype);
        expect(crisis.isActive).toBe(true);
        expect(crisis.phase).toBe(CrisisPhase.INCURSION);
        expect(crisis.archetype).toBe(config.archetype);
        expect(crisis.riftAnchors.length).toBe(2);
        expect(crisis.sovereign).not.toBeNull();

        // 2. Fast forward 3.0s warning phase
        crisis.update(3.1, player, bullets, particles);
        expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
        expect(crisis.sovereign?.isInvulnerable).toBe(true);

        const sovereign = crisis.sovereign!;
        const [anchor1, anchor2] = crisis.riftAnchors;

        expect(anchor1.hp).toBe(600);
        expect(anchor2.hp).toBe(600);
        expect(anchor1.isDead).toBe(false);
        expect(anchor2.isDead).toBe(false);

        // 3. Fire 50 direct high-damage player bullets into Sovereign during Phase 1
        for (let i = 0; i < 50; i++) {
          const directBullet = new Bullet(sovereign.position.x + 50, sovereign.position.y + 50, -400, 10, true);
          directBullet.faction = Faction.PLAYER;
          const hit = crisis.handleBulletCollision(directBullet);
          expect(hit).toBe(true);
          // Invulnerability verification: Sovereign MUST absorb 0 damage
          expect(sovereign.hp).toBe(sovereign.maxHp);
          expect(sovereign.hullHp).toBe(sovereign.maxHullHp);
        }

        // 4. Damage Anchor 1 partially (300 damage)
        const hitBullet1 = new Bullet(anchor1.position.x + 20, anchor1.position.y + 20, -400, 300, true);
        hitBullet1.faction = Faction.PLAYER;
        crisis.handleBulletCollision(hitBullet1);

        expect(anchor1.hp).toBe(300);
        expect(anchor1.isDead).toBe(false);
        expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
        expect(sovereign.isInvulnerable).toBe(true);

        // 5. Destroy Anchor 1 completely (remaining 300 damage)
        const killBullet1 = new Bullet(anchor1.position.x + 20, anchor1.position.y + 20, -400, 400, true);
        killBullet1.faction = Faction.PLAYER;
        crisis.handleBulletCollision(killBullet1);

        expect(anchor1.hp).toBe(0);
        expect(anchor1.isDead).toBe(true);
        // Sovereign MUST STILL BE INVULNERABLE because Anchor 2 is alive
        expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
        expect(sovereign.isInvulnerable).toBe(true);

        // Fire another bullet at Sovereign to double check invulnerability holding
        const testBullet = new Bullet(sovereign.position.x + 50, sovereign.position.y + 50, -400, 50, true);
        testBullet.faction = Faction.PLAYER;
        crisis.handleBulletCollision(testBullet);
        expect(sovereign.hp).toBe(sovereign.maxHp);

        // 6. Destroy Anchor 2 completely (600 damage)
        const killBullet2 = new Bullet(anchor2.position.x + 20, anchor2.position.y + 20, -400, 650, true);
        killBullet2.faction = Faction.PLAYER;
        crisis.handleBulletCollision(killBullet2);

        expect(anchor2.hp).toBe(0);
        expect(anchor2.isDead).toBe(true);
        expect(crisis.riftAnchors.every(a => a.isDead)).toBe(true);

        // 7. Verify Phase 2 Transition
        expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);
        expect(sovereign.isInvulnerable).toBe(false);

        // 8. Sovereign now takes full damage in Phase 2
        const hullDamageBullet = new Bullet(sovereign.position.x + 50, sovereign.position.y + 50, -400, 500, true);
        hullDamageBullet.faction = Faction.PLAYER;
        crisis.handleBulletCollision(hullDamageBullet);

        expect(sovereign.hullHp).toBe(sovereign.maxHullHp - 500);
        expect(sovereign.hp).toBe(sovereign.maxHp - 500);

        // 9. Deplete remaining Hull HP -> Transitions to Phase 3 Core
        const killHullBullet = new Bullet(sovereign.position.x + 50, sovereign.position.y + 50, -400, 2000, true);
        killHullBullet.faction = Faction.PLAYER;
        crisis.handleBulletCollision(killHullBullet);

        expect(sovereign.hullHp).toBe(0);
        expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);
        expect(sovereign.phase).toBe(CrisisPhase.PHASE_3_CORE);

        // 10. Deplete Core HP -> Boss Defeated
        const killCoreBullet = new Bullet(sovereign.position.x + 50, sovereign.position.y + 50, -400, 1500, true);
        killCoreBullet.faction = Faction.PLAYER;
        crisis.handleBulletCollision(killCoreBullet);

        expect(sovereign.coreHp).toBe(0);
        expect(sovereign.hp).toBe(0);
        expect(sovereign.isDead).toBe(true);
        expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
        expect(crisis.isDefeated()).toBe(true);
      });
    }
  });

  // =========================================================================
  // 4. Mathematical & Physics Invariant Stress Tests (NaNs, Limits, Draw Safety)
  // =========================================================================
  test.describe('4. Mathematical & Rendering Pipeline Invariants', () => {

    test('STRESS-INVAR-01: Zero deltaTime and massive deltaTime simulation stability', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      // Zero deltaTime test
      expect(() => (gm as any).update(0)).not.toThrow();
      verifyNumericInvariants(gm, 'Delta 0');

      // Extreme 10.0s lag spike delta
      expect(() => (gm as any).update(10.0)).not.toThrow();
      verifyNumericInvariants(gm, 'Delta 10.0');
    });

    test('STRESS-INVAR-02: Sovereign, Rift, and Bullet Render Pipeline Zero Exception Assurance', () => {
      const canvas = createMockCanvas();
      const ctx = canvas.getContext('2d')!;

      const archetypes = [
        CrisisArchetype.VOID_SOVEREIGN,
        CrisisArchetype.ABYSSAL_LEVIATHAN,
        CrisisArchetype.CYBERNETIC_EXTERMINATOR,
      ];

      for (const arch of archetypes) {
        const crisis = new EndGameCrisis(600, 800);
        crisis.startIncursion(arch);

        // Render incursion warning
        expect(() => crisis.draw(ctx)).not.toThrow();

        // Advance to Phase 1
        crisis.update(3.1, new Player(600, 800), [], []);
        expect(() => crisis.draw(ctx)).not.toThrow();

        // Advance to Phase 2
        crisis.riftAnchors.forEach(a => a.takeDamage(1000));
        crisis.update(0.1, new Player(600, 800), [], []);
        expect(() => crisis.draw(ctx)).not.toThrow();

        // Advance to Phase 3
        crisis.sovereign?.takeDamage(2500);
        crisis.update(0.1, new Player(600, 800), [], []);
        expect(() => crisis.draw(ctx)).not.toThrow();

        // Render defeated
        crisis.sovereign?.takeDamage(1500);
        crisis.update(0.1, new Player(600, 800), [], []);
        expect(() => crisis.draw(ctx)).not.toThrow();
      }
    });
  });
});

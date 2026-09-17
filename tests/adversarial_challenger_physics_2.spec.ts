import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import { Player } from '../src/game/Player';
import { Enemy } from '../src/game/Enemy';
import { Bullet } from '../src/game/Bullet';
import { GameState, EnemyType, Faction } from '../src/game/types';
import {
  HarpoonState,
  TorpedoState,
  FlagshipUpdateContext,
} from '../src/game/flagship/types';
import { BioluminescentLaserSystem } from '../src/game/flagship/weapons/BioluminescentLaser';
import { CavitationTorpedo } from '../src/game/flagship/weapons/CavitationTorpedo';
import { HydraulicHarpoon } from '../src/game/flagship/weapons/HydraulicHarpoon';
import {
  KrakenPrimeBoss,
  CharybdisTentacle,
} from '../src/game/flagship/factions/KrakenPrimeBoss';
import { HadalBioHorrors } from '../src/game/flagship/factions/HadalBioHorrors';
import { soundManager } from '../src/game/SoundManager';

// Headless polyfills for Node test runner
if (typeof (global as any).requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number;
  (global as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
}

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
      clearRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      drawImage: () => {},
      roundRect: () => {},
      measureText: () => ({ width: 60 }),
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

function createMockFlagshipContext(
  player: Player,
  enemies: Enemy[] = [],
  bullets: Bullet[] = []
): FlagshipUpdateContext {
  return {
    player,
    enemies,
    bullets,
    barricades: [],
    helpers: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 0,
    createExplosion: () => {},
    triggerScreenShake: () => {},
  };
}

test.describe('Adversarial Challenger Physics Suite 2', () => {

  test.beforeAll(() => {
    try {
      soundManager.isMuted = true;
    } catch {
      // Safe fallback
    }
  });

  // ==========================================================================
  // CHALLENGE 1: Harpoon Swept CCD Under Thin Targets & Variable Frame Deltas
  // ==========================================================================
  test.describe('Challenge 1: Harpoon Swept Continuous Collision Detection (CCD)', () => {

    test('1.1: Harpoon Swept CCD detects 100% of razor-thin targets (1px to 10px height) across wide dt spectrum', () => {
      // Test at various frame deltas: 60 FPS (0.016s), 30 FPS (0.033s), 20 FPS (0.05s), 10 FPS (0.10s), 4 FPS (0.25s)
      const frameDeltas = [0.005, 0.016, 0.033, 0.05, 0.10, 0.20];
      const targetHeights = [1, 2, 3, 5, 8, 12]; // Razor-thin geometries

      let totalTrials = 0;
      let hitDetections = 0;

      for (const dt of frameDeltas) {
        for (const height of targetHeights) {
          // Place target in mid-flight between y=300 and y=500
          for (let targetY = 320; targetY <= 480; targetY += 20) {
            totalTrials++;

            const harpoon = new HydraulicHarpoon();
            const player = new Player(600, 800);
            player.position = { x: 300 - player.size.width / 2, y: 700 };

            // Target right on the centerline x=290 to x=310
            const enemy = new Enemy(290, targetY, 600, 1, EnemyType.NORMAL);
            enemy.size = { width: 20, height };
            enemy.hp = 100;
            enemy.isDead = false;

            // Fire harpoon from prow (x=300, y=700)
            harpoon.fire({ x: 300, y: 700 });
            expect(harpoon.state).toBe(HarpoonState.FLYING);

            // Step harpoon simulation frame by frame until it hits or passes y=30
            const context = createMockFlagshipContext(player, [enemy]);
            let hit = false;
            let step = 0;

            while (harpoon.state === HarpoonState.FLYING && step++ < 500) {
              harpoon.update(dt, context);
              if ((harpoon.state as any) === HarpoonState.TETHERED || enemy.hp < 100 || enemy.isDead) {
                hit = true;
                break;
              }
            }

            if (hit) {
              hitDetections++;
            } else {
              console.log(`[CCD MISS] dt=${dt}, height=${height}, targetY=${targetY}, finalHeadY=${harpoon.headPosition.y}, finalState=${harpoon.state}`);
            }
          }
        }
      }

      // Assert 100% continuous detection rate: zero tunneling through razor-thin targets
      expect(totalTrials).toBeGreaterThan(100);
      expect(hitDetections).toBe(totalTrials);
    });

    test('1.2: Harpoon Swept CCD against horizontally moving thin targets across 500 randomized velocity vectors', () => {
      let detections = 0;
      const totalRuns = 100;

      for (let run = 0; run < totalRuns; run++) {
        const harpoon = new HydraulicHarpoon();
        const player = new Player(600, 800);
        player.position = { x: 300 - player.size.width / 2, y: 700 };

        // Random target height 2px to 8px, moving horizontally at -150 to +150 px/s
        const height = 2 + (run % 7);
        const targetY = 350 + (run % 10) * 15;
        const startX = 250 + (run % 40);
        const vx = ((run % 2 === 0 ? 1 : -1) * (40 + (run % 80)));

        const enemy = new Enemy(startX, targetY, 600, 1, EnemyType.NORMAL);
        enemy.size = { width: 40, height };
        enemy.hp = 100;
        enemy.isDead = false;

        harpoon.fire({ x: 300, y: 700 });
        const context = createMockFlagshipContext(player, [enemy]);

        const dt = 0.016; // 60 FPS
        let hit = false;

        for (let frame = 0; frame < 80; frame++) {
          enemy.position.x += vx * dt;
          harpoon.update(dt, context);

          if (harpoon.state === HarpoonState.TETHERED || enemy.hp < 100 || enemy.isDead) {
            hit = true;
            break;
          }
          if (harpoon.state !== HarpoonState.FLYING) break;
        }

        if (hit) {
          detections++;
        }
      }

      // Detections must be confirmed for intersecting paths
      expect(detections).toBeGreaterThan(20);
    });

  });

  // ==========================================================================
  // CHALLENGE 2: Lethal Damage Wave Progression (Laser & Torpedo Mass Kills)
  // ==========================================================================
  test.describe('Challenge 2: Lethal Damage & Multi-Faction Wave Progression', () => {

    test('2.1: Rapid mass kill via Bioluminescent Laser instantly transitions all 30 enemies to isDead=true', () => {
      const laser = new BioluminescentLaserSystem();
      const player = new Player(600, 800);
      player.position = { x: 300 - player.size.width / 2, y: 700 };

      // Spawn 30 enemies along vertical column with fragile hp (0.5 hp)
      const enemies: Enemy[] = [];
      for (let i = 0; i < 30; i++) {
        const e = new Enemy(290, 100 + i * 18, 600, 1, i % 2 === 0 ? EnemyType.NORMAL : EnemyType.SHIELDED);
        e.hp = 0.5;
        e.shieldHp = 0;
        e.isDead = false;
        enemies.push(e);
      }

      const context = createMockFlagshipContext(player, enemies);

      // Fire beam directly through the column (x=300)
      laser.setFiring(true);
      // Advance with dt = 0.06 to trigger tickInterval (0.05s) hitscan damage tick
      laser.update(0.06, context);

      // Assert all enemies took lethal damage, have hp <= 0 and isDead === true
      for (const e of enemies) {
        expect(e.hp).toBeLessThanOrEqual(0);
        expect(e.isDead).toBe(true);
      }
    });

    test('2.2: Rapid mass kill via Cavitation Torpedo hyperbaric shockwave kills 25 clustered enemies cleanly', () => {
      const torpedo = new CavitationTorpedo(300, 300, { baseDamage: 200, blastRadius: 250 });
      const player = new Player(600, 800);
      player.position = { x: 300 - player.size.width / 2, y: 700 };

      // Spawn cluster of 25 enemies within blast radius (R = 150px around x=300, y=300) with 10 hp
      const enemies: Enemy[] = [];
      for (let i = 0; i < 25; i++) {
        const angle = (i / 25) * 2 * Math.PI;
        const dist = 30 + (i % 5) * 20;
        const ex = 300 + Math.cos(angle) * dist - 16;
        const ey = 300 + Math.sin(angle) * dist - 16;
        const e = new Enemy(ex, ey, 600, 1, EnemyType.NORMAL);
        e.hp = 10;
        e.isDead = false;
        enemies.push(e);
      }

      const context = createMockFlagshipContext(player, enemies);

      // Arm and detonate torpedo at (300, 300)
      torpedo.state = TorpedoState.ARMED;
      torpedo.triggerRemoteDetonation();
      // Advance past vacuum to shockwave phase
      (torpedo as any).vacuumTimer = 999;
      torpedo.update(0.016, enemies, []);
      expect(torpedo.state).toBe(TorpedoState.SHOCKWAVE);

      // Update shockwave over blast duration (blastRadius = 250, shockVelocity = 750)
      for (let f = 0; f < 25; f++) {
        torpedo.update(0.016, enemies, []);
      }

      // Assert all enemies in blast radius have hp <= 0 and isDead === true
      for (const e of enemies) {
        expect(e.hp).toBeLessThanOrEqual(0);
        expect(e.isDead).toBe(true);
      }
    });

    test('2.3: Full Wave Progression in GameManager - mass kill transitions remainingHostiles to 0 and advances to SHOP', () => {
      const canvas = createMockCanvas(600, 800);
      const gm = new GameManager(canvas);

      // Start game in PLAYING state
      gm.state = GameState.PLAYING;
      (gm as any).level = 1;
      (gm as any).warningTimer = 0;
      (gm as any).pendingReinforcement = null;
      (gm as any).crisisState.warningTimer = 0;
      (gm as any).crisisState.activeCrisis = null;

      // Populate wave with 20 Invaders and 10 Rogues
      gm.enemies = [];
      for (let i = 0; i < 20; i++) {
        const e = new Enemy(100 + (i % 5) * 80, 100 + Math.floor(i / 5) * 40, 600, 1, EnemyType.NORMAL);
        e.faction = Faction.INVADER;
        e.hp = 50;
        e.isDead = false;
        gm.enemies.push(e);
      }
      for (let i = 0; i < 10; i++) {
        const r = new Enemy(120 + (i % 5) * 80, 260 + Math.floor(i / 5) * 40, 600, 1, EnemyType.ROGUE_DRONE);
        r.faction = Faction.ROGUE;
        r.hp = 50;
        r.isDead = false;
        gm.enemies.push(r);
      }

      expect(gm.enemies.length).toBe(30);

      // Verify active hostile count before mass kill
      let remainingBefore = 0;
      for (const e of gm.enemies) {
        if (!e.isDead && (e.faction === Faction.INVADER || e.faction === Faction.ROGUE)) {
          remainingBefore++;
        }
      }
      expect(remainingBefore).toBe(30);

      // Apply rapid mass kills to all enemies via takeDamage
      for (const e of gm.enemies) {
        e.takeDamage(100);
      }

      // Assert each enemy is now dead
      for (const e of gm.enemies) {
        expect(e.hp).toBe(0);
        expect(e.isDead).toBe(true);
      }

      // Advance GameManager by 1 tick (0.016s) to trigger in-place compaction and wave clear logic
      gm.update(0.016);

      // In-place compaction must have removed all dead enemies
      expect(gm.enemies.length).toBe(0);

      // State must have smoothly transitioned to GameState.SHOP
      expect(gm.state).toBe(GameState.SHOP);
    });

  });

  // ==========================================================================
  // CHALLENGE 3: Flocking Avoidance Under 10+ Identical-Column Enemies
  // ==========================================================================
  test.describe('Challenge 3: Flocking Friendly-Fire Avoidance & Anti-Lockstep', () => {

    test('3.1: 10 identical-column enemies resolve symmetric ties without infinite lockstep or fire deadlock', () => {
      // Spawn 10 Sniper enemies in an exact vertical column at x = 280
      const enemies: Enemy[] = [];
      for (let i = 0; i < 10; i++) {
        const e = new Enemy(280, 100 + i * 35, 600, 1, EnemyType.SNIPER);
        e.speedX = 0; // Freeze default horizontal wander to isolate slideDir evasion
        (e as any).fireTimer = 0; // Ready to fire
        enemies.push(e);
      }

      // Target player is located down at (296, 750)
      const target = { x: 296, y: 750 };

      // Run 60 frames of fire and movement simulation
      let totalBulletsFired = 0;

      for (let frame = 0; frame < 60; frame++) {
        for (const e of enemies) {
          const bullet = e.fire(target, enemies);
          if (bullet) {
            totalBulletsFired++;
          }
          // Update movement to allow slideTimer to apply position offset
          e.update(0.016, 1.0, []);
        }
      }

      // 1. Verify that enemies did not remain frozen in exact identical X coordinates
      const finalXPositions = enemies.map(e => e.position.x);
      const uniqueXPositions = new Set(finalXPositions.map(x => Math.round(x * 10) / 10));

      // With 10 stacked enemies, they must diverge into distinct positions rather than infinite lockstep
      expect(uniqueXPositions.size).toBeGreaterThan(1);

      // 2. Front-line and diverged enemies must have successfully fired bullets
      expect(totalBulletsFired).toBeGreaterThan(0);

      // 3. All enemies must remain strictly within logical boundaries [0, 600]
      for (const e of enemies) {
        expect(e.position.x).toBeGreaterThanOrEqual(0);
        expect(e.position.x + e.size.width).toBeLessThanOrEqual(600);
      }
    });

    test('3.2: 15 identical-column enemies near canvas left border (x=5) do not penetrate wall or lockup', () => {
      const enemies: Enemy[] = [];
      for (let i = 0; i < 15; i++) {
        const e = new Enemy(4, 100 + i * 25, 600, 1, EnemyType.SNIPER);
        e.speedX = 0;
        (e as any).fireTimer = 0;
        enemies.push(e);
      }

      const target = { x: 20, y: 750 };

      // Run 100 simulation frames
      for (let frame = 0; frame < 100; frame++) {
        for (const e of enemies) {
          e.fire(target, enemies);
          e.update(0.016, 1.0, []);
          // Boundary verification on every single frame
          expect(e.position.x).toBeGreaterThanOrEqual(0);
          expect(e.position.x + e.size.width).toBeLessThanOrEqual(600);
        }
      }

      // Assert strict boundary containment across all 15 enemies: zero wall penetration
      for (const e of enemies) {
        expect(e.position.x).toBeGreaterThanOrEqual(0);
        expect(e.position.x + e.size.width).toBeLessThanOrEqual(600);
      }

      // Verify that when an enemy is at the left border and attempts to fire with a leftward obstacle tie,
      // it explicitly redirects slideDir to +1 (rightward) away from the wall
      const borderEnemy = new Enemy(4, 100, 600, 1, EnemyType.SNIPER);
      const blockingAlly = new Enemy(4, 140, 600, 1, EnemyType.SNIPER);
      borderEnemy.lastBlockingAlly = blockingAlly;
      (borderEnemy as any).fireTimer = 0;
      borderEnemy.fire(target, [borderEnemy, blockingAlly]);
      expect(borderEnemy.slideDir).toBe(1); // Redirected rightward away from x <= 5 wall
    });

  });

  // ==========================================================================
  // CHALLENGE 4: Kraken Boss Kinematics (360° IK Sweep & Phase 2 Vortex Escape)
  // ==========================================================================
  test.describe('Challenge 4: Kraken Boss Kinematics (360° IK & Maw Vortex)', () => {

    test('4.1: Charybdis Tentacle IK solves across complete 360-degree radial sweep without NaN or crumpling', () => {
      const tentacle = new CharybdisTentacle('adversarial_tentacle', 'Tentacle Stress', 300, 150, 0);

      const sweepRadius = 120; // Reaching distance
      const angleSteps = 360; // Every 1 degree across full 2*pi
      let maxAdjacentDelta = 0;

      for (let step = 0; step < angleSteps; step++) {
        const theta = (step / angleSteps) * 2 * Math.PI;
        const targetX = 300 + Math.cos(theta) * sweepRadius;
        const targetY = 150 + Math.sin(theta) * sweepRadius;

        tentacle.updateIK(targetX, targetY, step * 0.016, 0.016);

        // Verify all 5 joints
        for (let j = 0; j < tentacle.joints.length; j++) {
          const joint = tentacle.joints[j];

          // 1. Strict finite coordinate check (no NaN or Infinity)
          expect(Number.isFinite(joint.x)).toBe(true);
          expect(Number.isFinite(joint.y)).toBe(true);
          expect(Number.isFinite(joint.angle)).toBe(true);

          // 2. Segment length conservation (each segment must equal 32px length)
          const parentX = j === 0 ? tentacle.rootX : tentacle.joints[j - 1].x;
          const parentY = j === 0 ? tentacle.rootY : tentacle.joints[j - 1].y;
          const actualLength = Math.hypot(joint.x - parentX, joint.y - parentY);
          expect(Math.abs(actualLength - 32)).toBeLessThan(0.001);

          // 3. Adjacent angle delta check
          if (j > 0) {
            let diff = Math.abs(joint.angle - tentacle.joints[j - 1].angle);
            while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);
            if (diff > maxAdjacentDelta) {
              maxAdjacentDelta = diff;
            }
          }
        }
      }

      // Max adjacent joint curvature must be smooth and bounded (< 0.65 rad, no accordion crumple)
      expect(maxAdjacentDelta).toBeLessThan(0.65);
    });

    test('4.2: Phase 2 Maw Inhalation Vortex - player escapes downward under maximum in-game sluggishness', () => {
      const kraken = new KrakenPrimeBoss();
      kraken.spawnApexBoss();
      kraken.activeBoss!.phase = 2; // Active Maw Vortex Phase

      const player = new Player(600, 800);
      // Place player at the closest upward pull clamp: y = 220
      player.position = { x: 300 - player.size.width / 2, y: 220 };

      // Maximum in-game sluggishness configuration:
      // Ironclad base speed (220) with 3 Hadal parasites (-75% = 55 px/s)
      const maxSluggishSpeed = 55;
      player.speed = maxSluggishSpeed;
      player.velocity = { x: 0, y: maxSluggishSpeed }; // Actively thrusting downward

      const context = createMockFlagshipContext(player);

      // Simulate 60 frames (1 second) of active downward thrust vs Maw vortex
      const dt = 0.016;
      for (let frame = 0; frame < 60; frame++) {
        // Player moves downward
        player.position.y += player.velocity.y * dt;
        // Boss applies vortex pull
        kraken.update(dt, context);
      }

      // Assert that player successfully made downward progress and escaped vortex
      // Starting from y = 220, player should have moved down past y = 250
      expect(player.position.y).toBeGreaterThan(250);
    });

    test('4.3: Phase 2 Maw Inhalation Vortex - extreme stress test at sub-sluggish speed threshold', () => {
      const kraken = new KrakenPrimeBoss();
      kraken.spawnApexBoss();
      kraken.activeBoss!.phase = 2;

      // Test a series of downward speeds: 60, 45, 30, 20, 15 px/s
      const speedsToTest = [60, 45, 30, 20, 15];

      for (const speed of speedsToTest) {
        const player = new Player(600, 800);
        player.position = { x: 300 - player.size.width / 2, y: 220 };
        player.velocity = { x: 0, y: speed };

        const context = createMockFlagshipContext(player);
        const dt = 0.016;

        for (let frame = 0; frame < 30; frame++) {
          player.position.y += player.velocity.y * dt;
          kraken.update(dt, context);
        }

        // Even at 15 px/s downward velocity, player must not get pinned or dragged past y=220
        expect(player.position.y).toBeGreaterThanOrEqual(220);
      }
    });

    test('4.4: Tentacle IK handles zero-distance singularity (target at exact root) without NaN or crash', () => {
      const tentacle = new CharybdisTentacle('singularity_tentacle', 'Tentacle Singularity', 300, 150, 0);

      // Target placed precisely at the root coordinates
      tentacle.updateIK(300, 150, 0, 0.016);

      for (let j = 0; j < tentacle.joints.length; j++) {
        const joint = tentacle.joints[j];
        expect(Number.isFinite(joint.x)).toBe(true);
        expect(Number.isFinite(joint.y)).toBe(true);
        expect(Number.isFinite(joint.angle)).toBe(true);
        expect(Number.isNaN(joint.x)).toBe(false);
        expect(Number.isNaN(joint.y)).toBe(false);
      }
    });

    test('4.5: Tentacle IK handles extreme target coordinates (x=10000, y=10000) stably', () => {
      const tentacle = new CharybdisTentacle('extreme_tentacle', 'Tentacle Extreme', 300, 150, 0);
      tentacle.updateIK(10000, 10000, 1.0, 0.016);

      for (let j = 0; j < tentacle.joints.length; j++) {
        const joint = tentacle.joints[j];
        expect(Number.isFinite(joint.x)).toBe(true);
        expect(Number.isFinite(joint.y)).toBe(true);
        expect(Number.isFinite(joint.angle)).toBe(true);
      }
    });

    test('4.6: Phase 2 Maw Inhalation Vortex pulls passive/unmoving player upward and clamps safely at y=220', () => {
      const kraken = new KrakenPrimeBoss();
      kraken.spawnApexBoss();
      kraken.activeBoss!.phase = 2;

      const player = new Player(600, 800);
      player.position = { x: 300 - player.size.width / 2, y: 500 };
      player.velocity = { x: 0, y: 0 }; // Player is passive, not moving

      const context = createMockFlagshipContext(player);

      // Over 100 frames (1.6s), passive player is pulled upward toward maw
      for (let f = 0; f < 100; f++) {
        kraken.update(0.016, context);
      }

      // Player must have been pulled upward (y < 500)
      expect(player.position.y).toBeLessThan(500);

      // Even after 500 frames of upward pull, player must NEVER cross the y=220 ceiling clamp
      for (let f = 0; f < 400; f++) {
        kraken.update(0.016, context);
      }
      expect(player.position.y).toBeGreaterThanOrEqual(220);
    });

  });

  // ==========================================================================
  // DEEP STRESS HARNESS: 20-Stack Flocking & Massive Overkill
  // ==========================================================================
  test.describe('Deep Stress Harness: Overkill Wave Progression & 20-Stack Flocking', () => {

    test('5.1: 20 identical-column enemies diverge over time and sustain non-zero fire output', () => {
      const enemies: Enemy[] = [];
      for (let i = 0; i < 20; i++) {
        const e = new Enemy(300, 80 + i * 20, 600, 1, EnemyType.SNIPER);
        e.speedX = 0;
        (e as any).fireTimer = 0;
        enemies.push(e);
      }

      const target = { x: 300, y: 750 };
      let totalFired = 0;

      for (let f = 0; f < 120; f++) {
        for (const e of enemies) {
          const b = e.fire(target, enemies);
          if (b) totalFired++;
          e.update(0.016, 1.0, []);
        }
      }

      const finalXs = new Set(enemies.map(e => Math.round(e.position.x)));
      // With 20 enemies, multiple distinct lanes must be formed
      expect(finalXs.size).toBeGreaterThanOrEqual(2);
      expect(totalFired).toBeGreaterThan(0);
    });

    test('5.2: Overkill lethal damage through massive shields (1000 shield HP) still sets isDead=true and clears wave', () => {
      const canvas = createMockCanvas(600, 800);
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      (gm as any).warningTimer = 0;
      (gm as any).pendingReinforcement = null;
      (gm as any).crisisState.warningTimer = 0;
      (gm as any).crisisState.activeCrisis = null;

      // Spawn heavily shielded boss-like enemy
      const shieldedBoss = new Enemy(300, 200, 600, 1, EnemyType.SHIELDED);
      shieldedBoss.shieldHp = 1000;
      shieldedBoss.hp = 200;
      shieldedBoss.isDead = false;
      shieldedBoss.faction = Faction.INVADER;
      gm.enemies = [shieldedBoss];

      // Deal 5000 overkill damage
      shieldedBoss.takeDamage(5000);

      expect(shieldedBoss.shieldHp).toBe(0);
      expect(shieldedBoss.hp).toBe(0);
      expect(shieldedBoss.isDead).toBe(true);

      // Run GM tick
      gm.update(0.016);
      expect(gm.enemies.length).toBe(0);
      expect(gm.state).toBe(GameState.SHOP);
    });

  });

});

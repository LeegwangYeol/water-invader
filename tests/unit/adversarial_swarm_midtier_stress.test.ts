import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Enemy } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { GameState, Faction, EnemyType } from '../../src/game/types';

// Mock requestAnimationFrame & cancelAnimationFrame for Node environment
if (typeof global.requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
  (global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
}

/**
 * Headless Canvas Mock supporting 2D context rendering operations
 */
function createMockCanvas(width: number = 720, height: number = 960): HTMLCanvasElement {
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
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1.0,
      shadowColor: '#000000',
      shadowBlur: 0,
      clearRect: () => {},
    }),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

test.describe('Adversarial Stress Suite: Enemy Swarms & 3rd Faction Mid-Tier Monsters', () => {

  // ==========================================================================
  // REQUIREMENT 1: SWARM SAFETY CAP & PERFORMANCE BENCHMARK
  // ==========================================================================
  test.describe('1. Swarm Safety Cap & Frame Rate Benchmark', () => {

    test('STRESS-1.1: Extreme continuous spawning flood NEVER exceeds 70 concurrent units', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 14; // Max grid expansion (6 rows x 10 cols = 60 initial units, non-boss wave)
      gm.enemies = [];
      gm.spawnWave();

      const initialCount = gm.enemies.filter(e => !e.isDead).length;
      expect(initialCount).toBe(60);

      // Adversarial assault: trigger 100 consecutive rapid spawning calls of all types
      const reinforcementTypes = ['FLANK', 'SPEARHEAD', 'ROGUE_INCURSION', '3WAY_CLASH', 'CHAOTIC_AIRDROP'];
      for (let i = 0; i < 100; i++) {
        const type = reinforcementTypes[i % reinforcementTypes.length];
        gm.spawnDynamicReinforcement(type);
        gm.triggerSwarmEchelon();

        const activeEnemies = gm.enemies.filter(e => !e.isDead);
        // INVARIANT: Concurrent active enemies must NEVER exceed 70 units
        expect(activeEnemies.length).toBeLessThanOrEqual(70);
      }

      const finalActive = gm.enemies.filter(e => !e.isDead);
      expect(finalActive.length).toBeLessThanOrEqual(70);
    });

    test('STRESS-1.2: Boundary saturation test at exactly 68 and 69 active units', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 12;
      gm.enemies = [];

      // Artificially populate to exactly 68 living units
      for (let i = 0; i < 68; i++) {
        gm.enemies.push(new Enemy(20 + (i % 10) * 60, 80 + Math.floor(i / 10) * 35, 720, 12, EnemyType.NORMAL, 960));
      }
      expect(gm.enemies.filter(e => !e.isDead).length).toBe(68);

      // Attempt reinforcement at 68 (should be blocked by currentActive >= 60 threshold)
      gm.spawnDynamicReinforcement('ROGUE_INCURSION');
      expect(gm.enemies.filter(e => !e.isDead).length).toBe(68);

      // Direct trigger of echelon at 68 (should be blocked by activeCount >= 60)
      gm.triggerSwarmEchelon();
      expect(gm.enemies.filter(e => !e.isDead).length).toBe(68);

      // Add 1 more unit to reach 69
      gm.enemies.push(new Enemy(100, 100, 720, 12, EnemyType.NORMAL, 960));
      expect(gm.enemies.filter(e => !e.isDead).length).toBe(69);

      // Attempt carrier split at 69: handleCarrierSplit checks currentActive < 68
      const carrier = new Enemy(300, 200, 720, 12, EnemyType.ROGUE_CARRIER, 960);
      carrier.hp = 0;
      carrier.isDead = true;
      (gm as any).handleCarrierSplit(carrier);

      // 69 active + dead carrier: active is 69, so handleCarrierSplit spawns 0 drones
      expect(gm.enemies.filter(e => !e.isDead).length).toBe(69);
    });

    test('STRESS-1.3: Simultaneous multi-carrier cluster split at near-cap does not exceed 70', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 14;
      gm.enemies = [];

      // 65 regular enemies + 3 carriers = 68 total
      for (let i = 0; i < 65; i++) {
        gm.enemies.push(new Enemy(20 + (i % 10) * 60, 80 + Math.floor(i / 10) * 35, 720, 14, EnemyType.NORMAL, 960));
      }
      const carrier1 = new Enemy(100, 150, 720, 14, EnemyType.ROGUE_CARRIER, 960);
      const carrier2 = new Enemy(200, 150, 720, 14, EnemyType.ROGUE_CARRIER, 960);
      const carrier3 = new Enemy(300, 150, 720, 14, EnemyType.ROGUE_CARRIER, 960);
      gm.enemies.push(carrier1, carrier2, carrier3);

      expect(gm.enemies.filter(e => !e.isDead).length).toBe(68);

      // Kill carrier 1 (active drops to 67, currentActive < 68 -> spawns Math.min(3, 70-67) = 3 drones -> active = 70)
      carrier1.isDead = true;
      (gm as any).handleCarrierSplit(carrier1);
      expect(gm.enemies.filter(e => !e.isDead).length).toBeLessThanOrEqual(70);

      // Kill carrier 2 (active is 70, 70 is not < 68 -> spawns 0 drones)
      carrier2.isDead = true;
      (gm as any).handleCarrierSplit(carrier2);
      expect(gm.enemies.filter(e => !e.isDead).length).toBeLessThanOrEqual(70);

      // Kill carrier 3 (active is 70, spawns 0 drones)
      carrier3.isDead = true;
      (gm as any).handleCarrierSplit(carrier3);
      expect(gm.enemies.filter(e => !e.isDead).length).toBeLessThanOrEqual(70);
    });

    test('PERF-1.4: Tick duration / frame rate under 60 concurrent enemies (>= 40-60 FPS)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 14; // 60 enemies
      gm.enemies = [];
      gm.spawnWave();

      const activeCount = gm.enemies.filter(e => !e.isDead).length;
      expect(activeCount).toBe(60);

      // Populate bullets to simulate real combat load
      for (let i = 0; i < 20; i++) {
        const b = new Bullet(100 + i * 25, 400 + (i % 5) * 50, 400, 2);
        b.faction = (i % 2 === 0) ? Faction.PLAYER : Faction.ROGUE;
        gm.bullets.push(b);
      }

      // Warm-up JIT compilation (50 ticks)
      const dt = 1 / 60;
      for (let i = 0; i < 50; i++) {
        gm.update(dt);
      }

      // Benchmark 500 consecutive frame updates
      const tickDurations: number[] = [];
      const iterations = 500;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        gm.update(dt);
        const duration = performance.now() - start;
        tickDurations.push(duration);
      }

      const meanDuration = tickDurations.reduce((a, b) => a + b, 0) / iterations;
      tickDurations.sort((a, b) => a - b);
      const p95Duration = tickDurations[Math.floor(iterations * 0.95)];
      const p99Duration = tickDurations[Math.floor(iterations * 0.99)];
      const maxDuration = tickDurations[iterations - 1];

      // Console telemetry for empirical audit
      console.log(`[PERF BENCHMARK 60 ENEMIES] Mean: ${meanDuration.toFixed(3)}ms, P95: ${p95Duration.toFixed(3)}ms, P99: ${p99Duration.toFixed(3)}ms, Max: ${maxDuration.toFixed(3)}ms`);

      // 60 FPS corresponds to 16.67ms tick step; 40 FPS corresponds to 25.0ms tick step.
      // Mean tick duration must be well within 60 FPS budget (< 16.6ms)
      expect(meanDuration).toBeLessThan(16.67);
      // 95th and 99th percentiles must strictly stay below 25.0ms (ensuring >= 40 FPS under sustained load)
      expect(p95Duration).toBeLessThanOrEqual(25.0);
      expect(p99Duration).toBeLessThanOrEqual(25.0);
    });
  });

  // ==========================================================================
  // REQUIREMENT 2: 3RD FACTION AI & FRIENDLY FIRE RAYCAST SUPPRESSION
  // ==========================================================================
  test.describe('2. 3rd Faction AI & Friendly Fire Raycast Suppression', () => {

    test('AI-2.1: 3-way crossfire targeting: Rogues engage closest hostile (Player vs Invader)', () => {
      // Case A: Invader is closer than Player
      const rogue = new Enemy(300, 300, 720, 10, EnemyType.ROGUE_MECH, 960);
      rogue.faction = Faction.ROGUE;
      (rogue as any).fireTimer = 0; // Ready to shoot

      const closeInvader = new Enemy(300, 420, 720, 10, EnemyType.NORMAL, 960); // 120px away
      closeInvader.faction = Faction.INVADER;

      const distantPlayer = { x: 300 - 25, y: 700 - 20 }; // 400px away
      const allEnemies = [rogue, closeInvader];

      const bulletA = rogue.fire(distantPlayer, allEnemies);
      expect(bulletA).not.toBeNull();
      if (bulletA) {
        expect(bulletA.faction).toBe(Faction.ROGUE);
        // Fired downward towards the invader (dy > 0, vy > 0)
        expect(bulletA.velocity.y).toBeGreaterThan(0);
        // Heading towards closeInvader's center X (300 + 20 = 320)
        expect(Math.abs(bulletA.velocity.x)).toBeLessThan(50);
      }

      // Case B: Player is closer than Invader
      const rogueB = new Enemy(300, 500, 720, 10, EnemyType.ROGUE_MECH, 960);
      rogueB.faction = Faction.ROGUE;
      (rogueB as any).fireTimer = 0;

      const distantInvader = new Enemy(100, 100, 720, 10, EnemyType.NORMAL, 960); // ~447px away
      distantInvader.faction = Faction.INVADER;

      const closePlayer = { x: 300 - 25, y: 600 - 20 }; // 100px away
      const allEnemiesB = [rogueB, distantInvader];

      const bulletB = rogueB.fire(closePlayer, allEnemiesB);
      expect(bulletB).not.toBeNull();
      if (bulletB) {
        expect(bulletB.faction).toBe(Faction.ROGUE);
        expect(bulletB.velocity.y).toBeGreaterThan(0);
      }
    });

    test('AI-2.2: Friendly-fire raycast suppression prevents allied Rogues from damaging each other', () => {
      const rogueShooter = new Enemy(300, 200, 720, 10, EnemyType.ROGUE_MECH, 960);
      rogueShooter.faction = Faction.ROGUE;
      (rogueShooter as any).fireTimer = 0;

      // Place allied Rogue directly in front of rogueShooter
      const rogueAlly = new Enemy(300, 320, 720, 10, EnemyType.ROGUE_DRONE, 960);
      rogueAlly.faction = Faction.ROGUE;

      const playerPos = { x: 300 - 25, y: 750 - 20 };
      const allEnemies = [rogueShooter, rogueAlly];

      // Raycast check should flag the ally
      const isBlocked = rogueShooter.hasAlliedObstacleInShotPath(
        allEnemies,
        rogueShooter.position.x + rogueShooter.size.width / 2,
        rogueShooter.position.y + rogueShooter.size.height,
        playerPos.x + 25,
        playerPos.y + 20,
        5
      );
      expect(isBlocked).toBe(true);
      expect(rogueShooter.lastBlockingAlly).toBe(rogueAlly);

      // Fire method must suppress fire (returns null) and initiate lateral evasion slide
      const bullet = rogueShooter.fire(playerPos, allEnemies);
      expect(bullet).toBeNull();
      expect((rogueShooter as any).slideTimer).toBeGreaterThan(0);
    });

    test('AI-2.3: Hostile Invader in shot path does NOT suppress Rogue fire', () => {
      const rogueShooter = new Enemy(300, 200, 720, 10, EnemyType.ROGUE_MECH, 960);
      rogueShooter.faction = Faction.ROGUE;
      (rogueShooter as any).fireTimer = 0;

      // Place hostile Invader in front of rogueShooter
      const hostileInvader = new Enemy(300, 320, 720, 10, EnemyType.NORMAL, 960);
      hostileInvader.faction = Faction.INVADER; // Different faction

      const playerPos = { x: 300 - 25, y: 750 - 20 };
      const allEnemies = [rogueShooter, hostileInvader];

      // Raycast against ALLIES should return false because hostileInvader is an INVADER!
      const isBlocked = rogueShooter.hasAlliedObstacleInShotPath(
        allEnemies,
        rogueShooter.position.x + rogueShooter.size.width / 2,
        rogueShooter.position.y + rogueShooter.size.height,
        playerPos.x + 25,
        playerPos.y + 20,
        5
      );
      expect(isBlocked).toBe(false);

      // Rogue fires freely at the hostile
      const bullet = rogueShooter.fire(playerPos, allEnemies);
      expect(bullet).not.toBeNull();
      expect(bullet?.faction).toBe(Faction.ROGUE);
    });

    test('AI-2.4: Allied Rogue BEHIND shooter does NOT suppress forward fire', () => {
      const rogueShooter = new Enemy(300, 300, 720, 10, EnemyType.ROGUE_MECH, 960);
      rogueShooter.faction = Faction.ROGUE;
      (rogueShooter as any).fireTimer = 0;

      // Allied Rogue is BEHIND (y = 150 < 300)
      const rogueAllyBehind = new Enemy(300, 150, 720, 10, EnemyType.ROGUE_DRONE, 960);
      rogueAllyBehind.faction = Faction.ROGUE;

      const playerPos = { x: 300 - 25, y: 750 - 20 };
      const allEnemies = [rogueShooter, rogueAllyBehind];

      const isBlocked = rogueShooter.hasAlliedObstacleInShotPath(
        allEnemies,
        rogueShooter.position.x + rogueShooter.size.width / 2,
        rogueShooter.position.y + rogueShooter.size.height,
        playerPos.x + 25,
        playerPos.y + 20,
        5
      );
      expect(isBlocked).toBe(false);

      const bullet = rogueShooter.fire(playerPos, allEnemies);
      expect(bullet).not.toBeNull();
    });

    test('AI-2.5: Crossfire Kill awards strategic bonus score and currency', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.score = 1000;
      gm.currency = 50;
      gm.combo = 0;

      const killedInvader = new Enemy(200, 200, 720, 10, EnemyType.NORMAL, 960);
      killedInvader.faction = Faction.INVADER;

      // Trigger crossfire kill with killerFaction = Faction.ROGUE
      gm.handleCrossfireKill(killedInvader, Faction.ROGUE);

      // Base crossfire reward: +150 score, +8 currency, combo incremented
      expect(gm.score).toBe(1150);
      expect(gm.currency).toBe(58);
      expect(gm.combo).toBe(1);
      expect((gm as any).comboTimer).toBe(2.5);
    });
  });

  // ==========================================================================
  // REQUIREMENT 3: MID-TIER MONSTER MECHANICS
  // ==========================================================================
  test.describe('3. Mid-Tier Mechanics: Goliath, Phantom, Carrier', () => {

    test('MIDTIER-3.1: Rogue Goliath kinetic shield absorption and EMP shockwave on shield break', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.level = 10;

      // 1. Instantiation and stats verification
      const goliath = new Enemy(300, 200, 720, 10, EnemyType.ROGUE_GOLIATH, 960);
      expect(goliath.faction).toBe(Faction.ROGUE);
      expect(goliath.isMidTier).toBe(true);
      expect(goliath.hp).toBe(35);
      expect(goliath.shieldHp).toBe(12);

      // 2. Kinetic Shield absorbs damage before base HP
      const damage1 = 8;
      const initialHp = goliath.hp;
      const remaining1 = goliath.takeDamage(damage1);
      expect(remaining1).toBe(0);
      expect(goliath.shieldHp).toBe(4);
      expect(goliath.hp).toBe(initialHp); // Base HP completely protected

      // 3. Populate hostile bullets near Goliath to test EMP shockwave neutralization
      // Bullet within 110px EMP blast radius
      const hostileBulletInside = new Bullet(320, 210, 200, 2);
      hostileBulletInside.faction = Faction.INVADER;
      // Bullet outside 110px radius
      const hostileBulletOutside = new Bullet(500, 210, 200, 2);
      hostileBulletOutside.faction = Faction.INVADER;
      // Player bullet (should NOT be destroyed by EMP)
      const playerBulletInside = new Bullet(320, 210, 200, 2);
      playerBulletInside.faction = Faction.PLAYER;

      gm.bullets.push(hostileBulletInside, hostileBulletOutside, playerBulletInside);

      // 4. Trigger shield break with remaining 4 shield + 2 overflow damage
      goliath.takeDamage(6);
      expect(goliath.shieldHp).toBe(0);
      expect(goliath.hp).toBe(initialHp - 2); // 2 overflow damage penetrated

      // Trigger EMP shockwave at Goliath's position
      gm.triggerEMPShockwave(goliath.position.x + goliath.size.width / 2, goliath.position.y + goliath.size.height / 2);

      // EMP blast radius verification (110px)
      expect(hostileBulletInside.isDead).toBe(true); // Neutralized!
      expect(hostileBulletOutside.isDead).toBe(false); // Out of range
      expect(playerBulletInside.isDead).toBe(false); // Friendly/player bullet unharmed
    });

    test('MIDTIER-3.2: Rogue Goliath alternating twin-barrel trajectory', () => {
      const goliath = new Enemy(300, 200, 720, 10, EnemyType.ROGUE_GOLIATH, 960);
      (goliath as any).fireTimer = 0;
      const playerPos = { x: 300 - 25, y: 700 - 20 };

      // Shot 1: goliathBarrelToggle toggles to true (-14px offset)
      const b1 = goliath.fire(playerPos, [goliath]);
      expect(b1).not.toBeNull();
      const b1X = b1!.position.x;

      // Shot 2: goliathBarrelToggle toggles to false (+14px offset)
      (goliath as any).fireTimer = 0;
      const b2 = goliath.fire(playerPos, [goliath]);
      expect(b2).not.toBeNull();
      const b2X = b2!.position.x;

      // Difference between the two barrels must be exactly 28px (-14 to +14)
      expect(Math.abs(b2X - b1X)).toBe(28);
    });

    test('MIDTIER-3.3: Rogue Phantom phase dash teleport under sustained damage', () => {
      const phantom = new Enemy(300, 200, 720, 10, EnemyType.ROGUE_PHANTOM, 960);
      expect(phantom.faction).toBe(Faction.ROGUE);
      expect(phantom.isMidTier).toBe(true);
      expect(phantom.canEvade).toBe(true);
      expect(phantom.hp).toBe(25);

      const initialX = phantom.position.x;

      // 1st Hit: sustainedHitCount becomes 1, no teleport yet
      phantom.takeDamage(2);
      expect(phantom.sustainedHitCount).toBe(1);
      expect(phantom.position.x).toBe(initialX);
      expect(phantom.isPhaseDashing).toBe(false);

      // 2nd Hit within 800ms: sustained damage threshold reached -> triggers phase dash!
      phantom.takeDamage(2);
      expect(phantom.position.x).not.toBe(initialX);
      expect(Math.abs(phantom.position.x - initialX)).toBeGreaterThanOrEqual(70); // 80-120px nominal
      expect(phantom.phaseDashCooldown).toBe(2.5);
      expect(phantom.isPhaseDashing).toBe(true);
      expect(phantom.phaseAfterimages.length).toBeGreaterThan(0);

      // 3rd Hit while on cooldown: MUST NOT re-teleport
      const positionAfterDash = phantom.position.x;
      phantom.takeDamage(2);
      expect(phantom.position.x).toBe(positionAfterDash);
    });

    test('MIDTIER-3.4: Rogue Carrier cluster split on death spawns 2-3 Rogue Drones', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.level = 10;
      gm.enemies = [];

      const carrier = new Enemy(300, 200, 720, 10, EnemyType.ROGUE_CARRIER, 960);
      expect(carrier.faction).toBe(Faction.ROGUE);
      expect(carrier.isMidTier).toBe(true);
      expect(carrier.hp).toBe(30);
      expect(carrier.shieldHp).toBe(8);
      gm.enemies.push(carrier);

      // Kill the carrier
      carrier.hp = 0;
      carrier.isDead = true;
      (gm as any).handleCarrierSplit(carrier);

      // Filter spawned drones
      const spawnedDrones = gm.enemies.filter(e => e.type === EnemyType.ROGUE_DRONE && !e.isDead);
      expect(spawnedDrones.length).toBeGreaterThanOrEqual(2);
      expect(spawnedDrones.length).toBeLessThanOrEqual(3);

      for (const drone of spawnedDrones) {
        // Must belong to Faction.ROGUE
        expect(drone.faction).toBe(Faction.ROGUE);
        // Positioned around Carrier death coordinate
        expect(Math.abs(drone.position.x - carrier.position.x)).toBeLessThanOrEqual(60);
        expect(drone.position.y).toBeGreaterThanOrEqual(40);
        // Dispersal velocities applied
        expect(Math.abs(drone.speedX)).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // REQUIREMENT 4: SOLITARY BOSS INTEGRITY (WAVE 5)
  // ==========================================================================
  test.describe('4. Solitary Boss Integrity (Wave 5)', () => {

    test('BOSS-4.1: Wave 5 strictly spawns exactly 1 Boss and 0 minions / mid-tiers', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Spawn Wave 5
      gm.level = 5;
      gm.enemies = [];
      gm.spawnWave();

      // INVARIANT 1: Total enemies spawned is strictly 1
      expect(gm.enemies.length).toBe(1);

      const boss = gm.enemies[0];
      // INVARIANT 2: Entity must be of type EnemyType.BOSS
      expect(boss.type).toBe(EnemyType.BOSS);
      expect(boss.hp).toBe(50); // Level 5 * 10
      expect(boss.size.width).toBe(150);
      expect(boss.size.height).toBe(100);

      // INVARIANT 3: 0 minions, 0 mid-tier monsters
      const nonBosses = gm.enemies.filter(e => e.type !== EnemyType.BOSS);
      expect(nonBosses.length).toBe(0);

      // INVARIANT 4: Swarm echelons are disabled on boss wave
      expect((gm as any).swarmEchelonsRemaining).toBe(0);
    });

    test('BOSS-4.2: Contrast with Wave 10+ boss waves having escort legions', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      // Wave 10: 1 Boss + 4 Escorts = 5 units
      gm.level = 10;
      gm.enemies = [];
      gm.spawnWave();
      expect(gm.enemies.length).toBe(5);
      expect(gm.enemies[0].type).toBe(EnemyType.BOSS);
      expect(gm.enemies.slice(1).every(e => e.type !== EnemyType.BOSS)).toBe(true);

      // Wave 15: 1 Boss + 6 Escorts = 7 units
      gm.level = 15;
      gm.enemies = [];
      gm.spawnWave();
      expect(gm.enemies.length).toBe(7);
      expect(gm.enemies[0].type).toBe(EnemyType.BOSS);
    });

    test('BOSS-4.3: Dynamic echelons do not trigger during Wave 5 solitary boss fight', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 5;
      gm.enemies = [];
      gm.spawnWave();

      expect(gm.enemies.length).toBe(1);

      // Run 60 update ticks
      for (let i = 0; i < 60; i++) {
        gm.update(1 / 60);
      }

      // Population must remain strictly 1 Boss
      expect(gm.enemies.filter(e => !e.isDead).length).toBe(1);
      expect(gm.enemies[0].type).toBe(EnemyType.BOSS);
    });
  });
});

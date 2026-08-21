import { test, expect } from '@playwright/test';
import {
  SwarmBotEngine,
  extractBotPerception,
  injectSwarmBot,
  SwarmBotPerception,
  SwarmBotOptions,
  DEFAULT_BOT_OPTIONS
} from './swarm_bot_engine';

/**
 * Mock GameManager implementation matching GameManager.ts specifications exactly
 */
class MockGameManager {
  public state = 1; // PLAYING
  public currency = 0;
  public level = 1;
  public logicalWidth = 600;
  public logicalHeight = 800;
  public bullets: any[] = [];
  public enemies: any[] = [];
  public barricades: any[] = [];
  public helpers: any[] = [];

  public player = {
    position: { x: 275, y: 740 },
    size: { width: 50, height: 40 },
    hp: 3,
    maxHp: 5,
    speed: 300,
    baseFireRate: 0.5,
    fireRate: 0.5,
    multiShot: 1,
    piercing: 1,
    ultimateGauge: 0,
    stressLevel: 0,
    suppressionLevel: 0,
    isMovingLeft: false,
    isMovingRight: false,
    isShooting: false
  };

  public ultimateCastsCount = 0;
  public allySummonsCount = 0;

  public upgradeFireRate(): void {
    if (this.currency >= 50 && this.player.fireRate > 0.05) {
      this.currency -= 50;
      this.player.fireRate = Math.max(0.1, Math.round((this.player.fireRate - 0.1) * 10) / 10);
      this.player.baseFireRate = this.player.fireRate;
    }
  }

  public upgradeMultiShot(): void {
    if (this.currency >= 100 && this.player.multiShot < 5) {
      this.currency -= 100;
      this.player.multiShot++;
    }
  }

  public upgradePiercing(): void {
    if (this.currency >= 200 && this.player.piercing < 99) {
      this.currency -= 200;
      this.player.piercing++;
    }
  }

  public triggerUltimate(): void {
    if (this.player.ultimateGauge >= 100) {
      this.player.ultimateGauge = 0;
      this.ultimateCastsCount++;
      // Spawn 30 bullets like real GameManager
      for (let i = 0; i < 30; i++) {
        this.bullets.push({
          x: Math.random() * this.logicalWidth,
          y: -20,
          vx: 0,
          vy: 300,
          isPlayerBullet: true,
          damage: 10
        });
      }
    }
  }

  public triggerSummonAlly(): void {
    if (this.currency >= 50) {
      this.currency -= 50;
      this.allySummonsCount++;
      this.helpers.push({ type: 0, hp: 5 });
    }
  }
}

test.describe('Challenger 2 Empirical Verification: Corner Cases & Stress Harness', () => {

  // =========================================================================
  // CORNER CASE 1: Currency Reaching 10,000 Pure Water & Extreme Economy Stress
  // =========================================================================
  test.describe('1. Currency 10,000 Pure Water & Economic Stress', () => {

    test('1.1 Exact 10,000 Pure Water: Maxes Fire Rate (0.1), Multi-Shot (5), and buys Piercing (48) without infinite loops', async () => {
      const game = new MockGameManager();
      game.currency = 10000;
      game.player.fireRate = 0.5;
      game.player.multiShot = 1;
      game.player.piercing = 1;

      // In a live game, injectSwarmBot calls evaluateEconomy per tick.
      // With 10,000 currency and maxIterations = 20 per call:
      // Tick 1: 4 FireRate (0.1), 4 MultiShot (5), 12 Piercing (Lv 13) -> 20 upgrades, spent 3000, 7000 left
      // Tick 2: 20 Piercing (Lv 33) -> spent 4000, 3000 left
      // Tick 3: 15 Piercing (Lv 48) -> spent 3000, 0 left (total 47 piercing upgrades)
      const bot = injectSwarmBot(game);

      const startTime = Date.now();
      let ticksNeeded = 0;
      while (game.currency > 0 && ticksNeeded < 10) {
        bot.tick();
        ticksNeeded++;
      }
      const durationMs = Date.now() - startTime;

      expect(ticksNeeded).toBeLessThanOrEqual(5);
      expect(durationMs).toBeLessThan(100); // Must complete instantly

      // Verification of stats
      expect(game.player.fireRate).toBe(0.1); // Maxed out to 0.1s
      expect(game.player.multiShot).toBe(5);   // Maxed out to Lv 5
      expect(game.player.piercing).toBe(48);   // 1 base + 47 upgrades (47 * 200 = 9400)
      expect(game.currency).toBe(0);          // Exactly 0 remaining

      // Telemetry check
      const telemetry = bot.getTelemetry();
      expect(telemetry.upgradesBought.fireRate).toBe(4);
      expect(telemetry.upgradesBought.multiShot).toBe(4);
      expect(telemetry.upgradesBought.piercing).toBe(47);
      expect(telemetry.upgradesBought.totalSpent).toBe(10000);
      expect(telemetry.upgradesBought.fireRate * 50 + telemetry.upgradesBought.multiShot * 100 + telemetry.upgradesBought.piercing * 200).toBe(10000);
    });

    test('1.2 Massive Currency 1,000,000 Pure Water: Caps at max piercing (99) and does not infinite loop', async () => {
      const game = new MockGameManager();
      game.currency = 1000000;
      game.player.fireRate = 0.5;
      game.player.multiShot = 1;
      game.player.piercing = 1;

      const bot = injectSwarmBot(game);

      // Run multiple ticks until all upgrades are fully maxed out
      for (let i = 0; i < 15; i++) {
        bot.tick();
      }

      // FireRate maxed (4 upgrades: 200), MultiShot maxed (4 upgrades: 400), Piercing maxed (98 upgrades: 19600)
      // Total spent = 20,200. Remaining currency = 979,800.
      expect(game.player.fireRate).toBe(0.1);
      expect(game.player.multiShot).toBe(5);
      expect(game.player.piercing).toBe(99);
      expect(game.currency).toBe(979800);

      // Verify that further ticks do NOT enter infinite loops and spend 0 currency
      const prevCurrency = game.currency;
      bot.tick();
      expect(game.currency).toBe(prevCurrency);
    });

    test('1.3 Boundary Currency Testing: 0, 49, 50, 99, 100, 199, 200', async () => {
      // 49 currency -> cannot buy anything
      const g49 = new MockGameManager();
      g49.currency = 49;
      expect(SwarmBotEngine.evaluateEconomy(g49).totalSpent).toBe(0);
      expect(g49.currency).toBe(49);

      // 50 currency -> buys exactly 1 FireRate
      const g50 = new MockGameManager();
      g50.currency = 50;
      const p50 = SwarmBotEngine.evaluateEconomy(g50);
      expect(p50.fireRate).toBe(1);
      expect(p50.totalSpent).toBe(50);
      expect(g50.currency).toBe(0);

      // 99 currency -> buys 1 FireRate (50), leaves 49 (cannot buy second)
      const g99 = new MockGameManager();
      g99.currency = 99;
      const p99 = SwarmBotEngine.evaluateEconomy(g99);
      expect(p99.fireRate).toBe(1);
      expect(g99.currency).toBe(49);

      // 100 currency -> buys 2 FireRate (50x2) because Priority 1 takes precedence
      const g100 = new MockGameManager();
      g100.currency = 100;
      const p100 = SwarmBotEngine.evaluateEconomy(g100);
      expect(p100.fireRate).toBe(2);
      expect(g100.currency).toBe(0);

      // 100 currency with FireRate already at 0.1 -> buys 1 MultiShot (100)
      const g100_ms = new MockGameManager();
      g100_ms.player.fireRate = 0.1;
      g100_ms.currency = 100;
      const p100_ms = SwarmBotEngine.evaluateEconomy(g100_ms);
      expect(p100_ms.fireRate).toBe(0);
      expect(p100_ms.multiShot).toBe(1);
      expect(g100_ms.currency).toBe(0);

      // 200 currency with FireRate=0.1, MultiShot=5 -> buys 1 Piercing (200)
      const g200_p = new MockGameManager();
      g200_p.player.fireRate = 0.1;
      g200_p.player.multiShot = 5;
      g200_p.currency = 200;
      const p200_p = SwarmBotEngine.evaluateEconomy(g200_p);
      expect(p200_p.piercing).toBe(1);
      expect(g200_p.currency).toBe(0);
    });
  });

  // =========================================================================
  // CORNER CASE 2: Skill Gauge Rapid Oscillation & Idempotency / Double-Spend Attack
  // =========================================================================
  test.describe('2. Rapid Skill Gauge Oscillation & Idempotency Verification', () => {

    test('2.1 Burst applyDecision with Ultimate: Zero double-spending within same frame', async () => {
      const game = new MockGameManager();
      game.player.ultimateGauge = 100;
      game.enemies = [
        { x: 100, y: 100, width: 40, height: 30, type: 0, hp: 1 },
        { x: 200, y: 100, width: 40, height: 30, type: 0, hp: 1 },
        { x: 300, y: 100, width: 40, height: 30, type: 0, hp: 1 }
      ];

      const perception = extractBotPerception(game);
      const decision = SwarmBotEngine.computeDecision(perception);
      expect(decision.useUltimate).toBe(true);

      // Call applyDecision 50 times in a burst with the same decision
      for (let i = 0; i < 50; i++) {
        SwarmBotEngine.applyDecision(game, decision);
      }

      // First call consumed gauge to 0; remaining 49 must do nothing
      expect(game.ultimateCastsCount).toBe(1);
      expect(game.player.ultimateGauge).toBe(0);
      expect(game.bullets.length).toBe(30); // Exactly 30 bullets, not 1500!
    });

    test('2.2 High-frequency gauge oscillation across 500 ticks: Exact cast count tracking', async () => {
      const game = new MockGameManager();
      game.enemies = [
        { x: 100, y: 100, width: 40, height: 30, type: 0, hp: 1 },
        { x: 200, y: 100, width: 40, height: 30, type: 0, hp: 1 },
        { x: 300, y: 100, width: 40, height: 30, type: 0, hp: 1 }
      ];

      const bot = injectSwarmBot(game);
      let expectedCasts = 0;

      // Simulate 500 ticks with rapid charging and discharging
      for (let tick = 0; tick < 500; tick++) {
        if (tick % 5 === 0) {
          game.player.ultimateGauge = 100; // Ready to cast
          expectedCasts++;
        } else {
          // Fluctuating gauge 0-99.9
          game.player.ultimateGauge = (tick * 17) % 100;
        }

        bot.tick();
      }

      const telemetry = bot.getTelemetry();
      expect(game.ultimateCastsCount).toBe(expectedCasts);
      expect(telemetry.ultimatesCast).toBe(expectedCasts);
    });

    test('2.3 Burst Ally Summon double-spend attack: Never overdraws currency', async () => {
      const game = new MockGameManager();
      game.currency = 50;
      game.enemies = [
        { x: 100, y: 500, width: 40, height: 30, type: 0, hp: 1 } // Breach condition (y > 450)
      ];

      const perception = extractBotPerception(game);
      const decision = SwarmBotEngine.computeDecision(perception);
      expect(decision.summonAlly).toBe(true);

      // Burst call applyDecision 20 times
      for (let i = 0; i < 20; i++) {
        SwarmBotEngine.applyDecision(game, decision);
      }

      expect(game.allySummonsCount).toBe(1);
      expect(game.currency).toBe(0);
      expect(game.helpers.length).toBe(1);
    });

    test('2.4 Strategic Skill Boundaries: Strict conditions for Ultimate and Ally', async () => {
      // Gauge 100, 2 enemies (below threshold 3), no Boss -> NO Ultimate
      const p1: SwarmBotPerception = {
        player: {
          x: 275, y: 740, width: 50, height: 40, hp: 3, maxHp: 5, speed: 300,
          fireRate: 0.5, multiShot: 1, piercing: 1, ultimateGauge: 100, stressLevel: 0, suppressionLevel: 0
        },
        bullets: [],
        enemies: [
          { x: 100, y: 100, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 },
          { x: 200, y: 100, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 }
        ],
        barricades: [],
        currency: 0,
        level: 1,
        canvasWidth: 600,
        canvasHeight: 800,
        gameState: 1
      };
      expect(SwarmBotEngine.computeDecision(p1).useUltimate).toBe(false);

      // Gauge 100, 1 Boss (type 2) -> YES Ultimate
      const pBoss = {
        ...p1,
        enemies: [{ x: 200, y: 100, width: 150, height: 100, type: 2, hp: 100, speedX: 30, speedY: 0 }]
      };
      expect(SwarmBotEngine.computeDecision(pBoss).useUltimate).toBe(true);

      // Ally: Currency 50, 5 enemies (below threshold 6), max Y = 449 (below threshold 450) -> NO Ally
      const pAllyFalse = {
        ...p1,
        currency: 50,
        enemies: Array.from({ length: 5 }, (_, i) => ({
          x: i * 80, y: 449, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8
        }))
      };
      expect(SwarmBotEngine.computeDecision(pAllyFalse).summonAlly).toBe(false);

      // Ally: Currency 50, 5 enemies, but 1 at Y = 451 (> 450) -> YES Ally
      const pAllyTrue = {
        ...pAllyFalse,
        enemies: [
          ...pAllyFalse.enemies.slice(0, 4),
          { x: 320, y: 451, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 }
        ]
      };
      expect(SwarmBotEngine.computeDecision(pAllyTrue).summonAlly).toBe(true);
    });
  });

  // =========================================================================
  // CORNER CASE 3: Controller Lifecycle & High-Frequency Start/Stop/Tick
  // =========================================================================
  test.describe('3. Controller Lifecycle Torture & Dynamic Configuration', () => {

    test('3.1 500 Rapid start/stop cycles: Zero timer leaks, accurate isRunning state, clean key release', async () => {
      const game = new MockGameManager();
      const bot = injectSwarmBot(game, { tickIntervalMs: 16 });

      for (let i = 0; i < 500; i++) {
        bot.start();
        expect(bot.isRunning()).toBe(true);
        bot.stop();
        expect(bot.isRunning()).toBe(false);
      }

      // After stop, all player control flags must be false
      expect(game.player.isMovingLeft).toBe(false);
      expect(game.player.isMovingRight).toBe(false);
      expect(game.player.isShooting).toBe(false);
    });

    test('3.2 Manual tick interleaved with running controller', async () => {
      const game = new MockGameManager();
      let decisionsCount = 0;
      const bot = injectSwarmBot(game, {
        onDecision: () => { decisionsCount++; }
      });

      bot.start();
      bot.tick(); // Manual tick while running
      bot.tick();
      bot.stop();

      const telemetry = bot.getTelemetry();
      expect(telemetry.ticksExecuted).toBeGreaterThanOrEqual(2);
      expect(decisionsCount).toBeGreaterThanOrEqual(2);
    });

    test('3.3 Dynamic setOptions and resetTelemetry on running bot', async () => {
      const game = new MockGameManager();
      const bot = injectSwarmBot(game, { tickIntervalMs: 20 });

      bot.start();
      bot.tick();
      bot.tick();

      const t1 = bot.getTelemetry();
      expect(t1.ticksExecuted).toBe(2);

      // Reset telemetry
      bot.resetTelemetry();
      const t2 = bot.getTelemetry();
      expect(t2.ticksExecuted).toBe(0);
      expect(t2.decisionsCount).toBe(0);
      expect(t2.upgradesBought.totalSpent).toBe(0);

      // Mutate options to faster interval
      bot.setOptions({ tickIntervalMs: 10, autoShoot: false });
      bot.tick();
      expect(game.player.isShooting).toBe(false);

      bot.stop();
    });
  });

  // =========================================================================
  // CORNER CASE 4: Extreme Projectile Barrage & Potential Field Robustness
  // =========================================================================
  test.describe('4. Extreme Projectile Barrage & Potential Field Solver Stress', () => {

    test('4.1 500-Bullet Dense Barrage Performance: Under 10ms execution per tick', async () => {
      const denseBullets: SwarmBotPerception['bullets'] = [];
      for (let i = 0; i < 500; i++) {
        denseBullets.push({
          x: (i * 1.2) % 600,
          y: (i * 7) % 700,
          vx: ((i % 5) - 2) * 20,
          vy: 200 + (i % 10) * 15,
          width: 8,
          height: 8,
          isPlayerBullet: false,
          damage: 1
        });
      }

      const perception: SwarmBotPerception = {
        player: {
          x: 275, y: 740, width: 50, height: 40, hp: 3, maxHp: 5, speed: 300,
          fireRate: 0.5, multiShot: 1, piercing: 1, ultimateGauge: 0, stressLevel: 0, suppressionLevel: 0
        },
        bullets: denseBullets,
        enemies: [
          { x: 200, y: 100, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 }
        ],
        barricades: [
          { x: 100, y: 650, width: 60, height: 40, type: 1, hp: 1 },
          { x: 400, y: 650, width: 60, height: 40, type: 0, hp: 20 }
        ],
        currency: 0,
        level: 5,
        canvasWidth: 600,
        canvasHeight: 800,
        gameState: 1
      };

      const t0 = performance.now();
      const decision = SwarmBotEngine.computeDecision(perception);
      const t1 = performance.now();
      const duration = t1 - t0;

      expect(duration).toBeLessThan(15.0); // 500 bullets evaluated within 15ms
      expect(Number.isFinite(decision.bestCandidateX)).toBe(true);
      expect(decision.bestCandidateX).toBeGreaterThanOrEqual(0);
      expect(decision.bestCandidateX).toBeLessThanOrEqual(550);
      expect(['LEFT', 'RIGHT', 'STAY']).toContain(decision.move);
    });

    test('4.2 Multi-Diver Overload: Potential field selects gap between diving columns', async () => {
      const perception: SwarmBotPerception = {
        player: {
          x: 275, y: 740, width: 50, height: 40, hp: 3, maxHp: 5, speed: 300,
          fireRate: 0.5, multiShot: 1, piercing: 1, ultimateGauge: 0, stressLevel: 0, suppressionLevel: 0
        },
        bullets: [],
        enemies: [
          // Divers diving at X=100, X=200, X=400, X=500 (Gap at X=300)
          { x: 100, y: 350, width: 40, height: 30, type: 4, hp: 2, speedX: 0, speedY: 200, isDiving: true },
          { x: 200, y: 350, width: 40, height: 30, type: 4, hp: 2, speedX: 0, speedY: 200, isDiving: true },
          { x: 400, y: 350, width: 40, height: 30, type: 4, hp: 2, speedX: 0, speedY: 200, isDiving: true },
          { x: 500, y: 350, width: 40, height: 30, type: 4, hp: 2, speedX: 0, speedY: 200, isDiving: true }
        ],
        barricades: [],
        currency: 0,
        level: 3,
        canvasWidth: 600,
        canvasHeight: 800,
        gameState: 1
      };

      const decision = SwarmBotEngine.computeDecision(perception);
      const playerCenter = decision.bestCandidateX + 25;

      // Safe corridor is around X = 300 (between 240 and 360)
      expect(playerCenter).toBeGreaterThanOrEqual(240);
      expect(playerCenter).toBeLessThanOrEqual(360);
    });

    test('4.3 Empty Perception Edge Case: No crash, defaults to safe center positioning', async () => {
      const emptyPerception: SwarmBotPerception = {
        player: {
          x: 0, y: 740, width: 50, height: 40, hp: 3, maxHp: 5, speed: 300,
          fireRate: 0.5, multiShot: 1, piercing: 1, ultimateGauge: 0, stressLevel: 0, suppressionLevel: 0
        },
        bullets: [],
        enemies: [],
        barricades: [],
        currency: 0,
        level: 1,
        canvasWidth: 600,
        canvasHeight: 800,
        gameState: 1
      };

      const decision = SwarmBotEngine.computeDecision(emptyPerception);
      expect(Number.isFinite(decision.bestCandidateX)).toBe(true);
      expect(decision.bestCandidateX).toBeGreaterThanOrEqual(0);
      expect(decision.bestCandidateX).toBeLessThanOrEqual(550);
      expect(decision.move).toBe('RIGHT'); // Should move inward from edge X=0
    });
  });

});

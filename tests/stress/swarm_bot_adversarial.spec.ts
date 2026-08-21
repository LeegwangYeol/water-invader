import { test, expect } from '@playwright/test';
import {
  SwarmBotEngine,
  extractBotPerception,
  injectSwarmBot,
  SwarmBotPerception,
  SwarmBotOptions
} from './swarm_bot_engine';

test.describe('Milestone 1: SwarmBotEngine Adversarial Stress & Empirical Challenge Suite', () => {

  test('ADV-1: 500 Simultaneous High-Speed Bullets & Dense Curtain Stress Benchmark', async () => {
    // Generate 500 high-speed enemy bullets across various X and Y trajectories
    const bullets: SwarmBotPerception['bullets'] = [];
    for (let i = 0; i < 500; i++) {
      bullets.push({
        x: (i * 17) % 600,
        y: (i * 23) % 700,
        vx: ((i % 5) - 2) * 40,
        vy: 200 + (i % 7) * 50,
        width: 8,
        height: 12,
        isPlayerBullet: false,
        damage: 1,
        isDead: false
      });
    }

    // 20 mixed enemies and 4 barricades
    const enemies: SwarmBotPerception['enemies'] = [];
    for (let i = 0; i < 20; i++) {
      enemies.push({
        x: 30 + i * 28,
        y: 100 + (i % 4) * 50,
        width: 40,
        height: 30,
        type: i % 7,
        hp: 5,
        speedX: 30,
        speedY: 8
      });
    }

    const barricades: SwarmBotPerception['barricades'] = [
      { x: 50, y: 650, width: 60, height: 40, type: 1, hp: 100 },
      { x: 180, y: 650, width: 60, height: 40, type: 0, hp: 20 },
      { x: 320, y: 650, width: 60, height: 40, type: 1, hp: 100 },
      { x: 460, y: 650, width: 60, height: 40, type: 0, hp: 20 }
    ];

    const perception: SwarmBotPerception = {
      player: {
        x: 275,
        y: 740,
        width: 50,
        height: 40,
        hp: 3,
        maxHp: 5,
        speed: 300,
        fireRate: 0.5,
        multiShot: 1,
        piercing: 1,
        ultimateGauge: 100,
        stressLevel: 0,
        suppressionLevel: 0
      },
      bullets,
      enemies,
      barricades,
      currency: 500,
      level: 5,
      canvasWidth: 600,
      canvasHeight: 800,
      gameState: 1
    };

    // 1. Single tick validity check
    const singleDecision = SwarmBotEngine.computeDecision(perception);
    expect(Number.isFinite(singleDecision.bestCandidateX)).toBe(true);
    expect(singleDecision.bestCandidateX).toBeGreaterThanOrEqual(0);
    expect(singleDecision.bestCandidateX).toBeLessThanOrEqual(550);
    expect(['LEFT', 'RIGHT', 'STAY']).toContain(singleDecision.move);
    expect(singleDecision.minDangerScore).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(singleDecision.minDangerScore)).toBe(true);

    // 2. High-volume execution latency benchmark (1,000 consecutive ticks under 500 bullets)
    const iterations = 1000;
    const durations: number[] = [];
    const tStart = performance.now();

    for (let i = 0; i < iterations; i++) {
      // Dynamic shift to simulate active frame advancement
      perception.player.x = (perception.player.x + (i % 3) - 1 + 550) % 550;
      const t0 = performance.now();
      const dec = SwarmBotEngine.computeDecision(perception);
      const t1 = performance.now();
      durations.push(t1 - t0);

      if (dec.bestCandidateX < 0 || dec.bestCandidateX > 550 || Number.isNaN(dec.bestCandidateX)) {
        throw new Error(`Invalid candidate coordinate at tick ${i}: ${dec.bestCandidateX}`);
      }
    }

    const tTotal = performance.now() - tStart;
    const avgDuration = tTotal / iterations;
    const maxDuration = Math.max(...durations);
    durations.sort((a, b) => a - b);
    const p95Duration = durations[Math.floor(iterations * 0.95)];
    const p99Duration = durations[Math.floor(iterations * 0.99)];

    console.log(`[ADV-1 Performance Report] 500 Bullets Benchmark:`);
    console.log(`  - Total Iterations: ${iterations}`);
    console.log(`  - Total Time: ${tTotal.toFixed(2)}ms`);
    console.log(`  - Avg Tick Time: ${avgDuration.toFixed(4)}ms (Target < 2.0ms)`);
    console.log(`  - P95 Tick Time: ${p95Duration.toFixed(4)}ms`);
    console.log(`  - P99 Tick Time: ${p99Duration.toFixed(4)}ms`);
    console.log(`  - Max Tick Time: ${maxDuration.toFixed(4)}ms`);

    expect(avgDuration).toBeLessThan(2.0); // Strict requirement: < 2.0ms
  });

  test('ADV-2: Multi-Diver Swarm Intercept (30 Simultaneous Divers)', async () => {
    const diverEnemies: SwarmBotPerception['enemies'] = [];
    for (let i = 0; i < 30; i++) {
      diverEnemies.push({
        x: 10 + i * 19,
        y: 200 + (i % 6) * 40,
        width: 40,
        height: 30,
        type: 4, // Diver
        hp: 2,
        speedX: 0,
        speedY: 250,
        isDiving: true
      });
    }

    const perception: SwarmBotPerception = {
      player: {
        x: 275,
        y: 740,
        width: 50,
        height: 40,
        hp: 3,
        maxHp: 5,
        speed: 300,
        fireRate: 0.5,
        multiShot: 1,
        piercing: 1,
        ultimateGauge: 100,
        stressLevel: 0,
        suppressionLevel: 0
      },
      bullets: [],
      enemies: diverEnemies,
      barricades: [],
      currency: 100,
      level: 4,
      canvasWidth: 600,
      canvasHeight: 800,
      gameState: 1
    };

    const decision = SwarmBotEngine.computeDecision(perception);
    expect(Number.isFinite(decision.bestCandidateX)).toBe(true);
    expect(decision.bestCandidateX).toBeGreaterThanOrEqual(0);
    expect(decision.bestCandidateX).toBeLessThanOrEqual(550);
    expect(decision.useUltimate).toBe(true);
  });

  test('ADV-3A: Resilience to Non-Sparse Malformed Perception (NaN, Infinity, Missing Fields)', async () => {
    const malformedPerception: SwarmBotPerception = {
      player: {
        x: 275,
        y: 740,
        width: 50,
        height: 40,
        hp: 3,
        maxHp: 5,
        speed: 300,
        fireRate: 0.5,
        multiShot: 1,
        piercing: 1,
        ultimateGauge: 0,
        stressLevel: 0,
        suppressionLevel: 0
      },
      bullets: [
        { x: NaN, y: 100, vx: 0, vy: 200, width: 6, height: 10, isPlayerBullet: false, damage: 1 },
        { x: 300, y: NaN, vx: 0, vy: 200, width: 6, height: 10, isPlayerBullet: false, damage: 1 },
        { x: 300, y: 100, vx: NaN, vy: 200, width: 6, height: 10, isPlayerBullet: false, damage: 1 },
        { x: 300, y: 100, vx: 0, vy: NaN, width: 6, height: 10, isPlayerBullet: false, damage: 1 }
      ],
      enemies: [
        { x: NaN, y: 100, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 },
        { x: 200, y: NaN, width: 40, height: 30, type: 4, hp: 1, speedX: 30, speedY: 8, isDiving: true }
      ],
      barricades: [
        { x: NaN, y: 650, width: 60, height: 40, type: 1, hp: 100 }
      ],
      currency: NaN,
      level: 1,
      canvasWidth: 600,
      canvasHeight: 800,
      gameState: 1
    };

    const decision = SwarmBotEngine.computeDecision(malformedPerception);
    expect(Number.isFinite(decision.bestCandidateX)).toBe(true);
    expect(decision.bestCandidateX).toBeGreaterThanOrEqual(0);
    expect(decision.bestCandidateX).toBeLessThanOrEqual(550);
  });

  test('ADV-3B: Resilience to Sparse/Null Elements in Entity Arrays (Null-Safety Verified)', async () => {
    // Sparse arrays containing null / undefined elements
    const sparseGame: any = {
      player: {
        position: { x: 275, y: 740 },
        size: { width: 50, height: 40 },
        hp: 3
      },
      bullets: [
        null,
        undefined,
        { position: { x: 200, y: 200 }, velocity: { x: 0, y: 200 }, size: { width: 6, height: 10 }, isDead: false }
      ],
      enemies: [
        null,
        { position: { x: 100, y: 100 }, size: { width: 40, height: 30 }, hp: 1, isDead: false }
      ],
      barricades: [
        undefined,
        { position: { x: 150, y: 650 }, size: { width: 60, height: 40 }, hp: 20, type: 0 }
      ]
    };

    let threwError = false;
    let perception: any = null;
    try {
      perception = extractBotPerception(sparseGame);
    } catch (e: any) {
      threwError = true;
    }

    expect(threwError).toBe(false);
    expect(perception).not.toBeNull();
    expect(perception.bullets.length).toBe(1);
    expect(perception.enemies.length).toBe(1);
    expect(perception.barricades.length).toBe(1);
  });

  test('ADV-4: Zero-Health, Dead Entities, and Empty State Non-Interference', async () => {
    const deadBullets = Array.from({ length: 100 }, (_, i) => ({
      x: 100 + i,
      y: 700,
      vx: 0,
      vy: 300,
      width: 10,
      height: 10,
      isPlayerBullet: false,
      damage: 1,
      isDead: true
    }));

    const deadEnemies = Array.from({ length: 50 }, (_, i) => ({
      x: 50 + i * 10,
      y: 400,
      width: 40,
      height: 30,
      type: 4,
      hp: i % 2 === 0 ? 0 : -5,
      speedX: 0,
      speedY: 100,
      isDead: i % 3 === 0
    }));

    const deadBarricades = Array.from({ length: 10 }, (_, i) => ({
      x: 50 + i * 50,
      y: 650,
      width: 60,
      height: 40,
      type: 0,
      hp: 0,
      isDead: true
    }));

    const perception: SwarmBotPerception = {
      player: {
        x: 275,
        y: 740,
        width: 50,
        height: 40,
        hp: 3,
        maxHp: 5,
        speed: 300,
        fireRate: 0.5,
        multiShot: 1,
        piercing: 1,
        ultimateGauge: 100,
        stressLevel: 0,
        suppressionLevel: 0
      },
      bullets: deadBullets,
      enemies: deadEnemies,
      barricades: deadBarricades,
      currency: 100,
      level: 1,
      canvasWidth: 600,
      canvasHeight: 800,
      gameState: 1
    };

    const decision = SwarmBotEngine.computeDecision(perception);
    expect(decision.minDangerScore).toBe(0);
    expect(decision.useUltimate).toBe(false);
    expect(decision.summonAlly).toBe(false);
  });

  test('ADV-5: Extreme Currency Overflow & Broken Upgrade Safeguard', async () => {
    class MassiveCurrencyGame {
      public currency = 1_000_000_000;
      public player = {
        fireRate: 0.5,
        multiShot: 1,
        piercing: 1
      };
      public upgradeFireRate() {
        this.currency -= 50;
        this.player.fireRate = Math.max(0.1, this.player.fireRate - 0.1);
      }
      public upgradeMultiShot() {
        this.currency -= 100;
        this.player.multiShot = Math.min(5, this.player.multiShot + 1);
      }
      public upgradePiercing() {
        this.currency -= 200;
        this.player.piercing++;
      }
    }

    const game = new MassiveCurrencyGame();
    const purchases = SwarmBotEngine.evaluateEconomy(game);
    expect(purchases.totalSpent).toBeGreaterThan(0);
    expect(purchases.totalSpent).toBeLessThanOrEqual(20 * 200);
    expect(game.player.fireRate).toBe(0.1);
    expect(game.player.multiShot).toBe(5);

    class BuggedGame {
      public currency = 5000;
      public player = { fireRate: 0.5, multiShot: 1, piercing: 1 };
      public upgradeFireRate() {}
    }
    const buggedGame = new BuggedGame();
    const buggedPurchases = SwarmBotEngine.evaluateEconomy(buggedGame);
    expect(buggedPurchases.fireRate).toBe(0);
    expect(buggedPurchases.totalSpent).toBe(0);
  });

  test('ADV-6: Continuous In-Page Controller 200 Ticks Endurance with 500 Entities', async () => {
    class Mock500EntityGame {
      public state = 1;
      public currency = 1000;
      public level = 10;
      public logicalWidth = 600;
      public logicalHeight = 800;
      public player = {
        position: { x: 275, y: 740 },
        size: { width: 50, height: 40 },
        hp: 5,
        maxHp: 5,
        speed: 300,
        fireRate: 0.5,
        multiShot: 1,
        piercing: 1,
        ultimateGauge: 100,
        stressLevel: 0,
        suppressionLevel: 0,
        isMovingLeft: false,
        isMovingRight: false,
        isShooting: false
      };
      public bullets: any[] = [];
      public enemies: any[] = [];
      public barricades: any[] = [
        { position: { x: 100, y: 650 }, size: { width: 60, height: 40 }, type: 1, hp: 100 }
      ];

      constructor() {
        this.generateEntities();
      }

      public generateEntities() {
        this.bullets = [];
        for (let i = 0; i < 500; i++) {
          this.bullets.push({
            position: { x: (i * 29) % 600, y: (i * 37) % 700 },
            velocity: { x: 0, y: 250 + (i % 5) * 50 },
            size: { width: 8, height: 12 },
            isPlayerBullet: false,
            damage: 1,
            isDead: false
          });
        }
        this.enemies = [];
        for (let i = 0; i < 30; i++) {
          this.enemies.push({
            position: { x: 20 + i * 18, y: 150 + (i % 5) * 40 },
            size: { width: 40, height: 30 },
            type: i % 5,
            hp: 2,
            speedX: 30,
            speedY: 8,
            isDead: false
          });
        }
      }

      public upgradeFireRate() {
        if (this.currency >= 50 && this.player.fireRate > 0.1) {
          this.currency -= 50;
          this.player.fireRate = Math.max(0.1, this.player.fireRate - 0.1);
        }
      }
      public upgradeMultiShot() {
        if (this.currency >= 100 && this.player.multiShot < 5) {
          this.currency -= 100;
          this.player.multiShot++;
        }
      }
      public upgradePiercing() {
        if (this.currency >= 200) {
          this.currency -= 200;
          this.player.piercing++;
        }
      }
      public triggerUltimate() {
        this.player.ultimateGauge = 0;
      }
      public triggerSummonAlly() {
        if (this.currency >= 50) this.currency -= 50;
      }
    }

    const game = new Mock500EntityGame();
    const bot = injectSwarmBot(game, {
      tickIntervalMs: 16,
      autoShoot: true,
      autoSkills: true,
      autoUpgrade: true
    });

    for (let i = 0; i < 200; i++) {
      if (i % 10 === 0) game.generateEntities();
      bot.tick();
    }

    const telemetry = bot.getTelemetry();
    console.log(`[ADV-6 Telemetry Report]:`);
    console.log(`  - Ticks Executed: ${telemetry.ticksExecuted}`);
    console.log(`  - Average Tick Duration: ${telemetry.averageTickDurationMs.toFixed(4)}ms`);
    console.log(`  - Max Tick Duration: ${telemetry.maxTickDurationMs.toFixed(4)}ms`);
    console.log(`  - Ultimates Cast: ${telemetry.ultimatesCast}`);
    console.log(`  - Upgrades Total Spent: ${telemetry.upgradesBought.totalSpent}`);

    expect(telemetry.ticksExecuted).toBe(200);
    expect(telemetry.averageTickDurationMs).toBeLessThan(2.0);
  });

  test('ADV-7: Fuzz Stress Testing 10,000 Random Extreme States', async () => {
    const totalRuns = 10000;
    const t0 = performance.now();

    for (let run = 0; run < totalRuns; run++) {
      const canvasWidth = 400 + (run % 400);
      const playerWidth = 30 + (run % 40);
      const maxCandX = canvasWidth - playerWidth;

      const bulletCount = run % 20;
      const bullets = [];
      for (let b = 0; b < bulletCount; b++) {
        bullets.push({
          x: Math.sin(run + b) * 1000,
          y: Math.cos(run + b) * 1000,
          vx: ((b % 5) - 2) * 50,
          vy: ((b % 7) - 1) * 60,
          width: 8,
          height: 12,
          isPlayerBullet: b % 2 === 0,
          damage: 1,
          isDead: b % 4 === 0
        });
      }

      const p: SwarmBotPerception = {
        player: {
          x: (run * 13) % (canvasWidth + 200) - 100,
          y: 740,
          width: playerWidth,
          height: 40,
          hp: run % 6,
          maxHp: 5,
          speed: 300,
          fireRate: 0.5,
          multiShot: 1,
          piercing: 1,
          ultimateGauge: (run * 17) % 150,
          stressLevel: 0,
          suppressionLevel: 0
        },
        bullets,
        enemies: [
          {
            x: (run * 23) % canvasWidth,
            y: (run * 7) % 600,
            width: 40,
            height: 30,
            type: run % 7,
            hp: run % 5,
            speedX: 30,
            speedY: 8,
            isDiving: run % 3 === 0
          }
        ],
        barricades: [],
        currency: run * 10,
        level: (run % 10) + 1,
        canvasWidth,
        canvasHeight: 800,
        gameState: 1
      };

      const decision = SwarmBotEngine.computeDecision(p);
      if (
        !Number.isFinite(decision.bestCandidateX) ||
        decision.bestCandidateX < 0 ||
        decision.bestCandidateX > maxCandX
      ) {
        throw new Error(
          `Fuzz failed at run ${run}: candidateX=${decision.bestCandidateX}, maxCandX=${maxCandX}`
        );
      }
    }

    const tTotal = performance.now() - t0;
    const avgFuzzMs = tTotal / totalRuns;
    console.log(`[ADV-7 Fuzz Report] Completed ${totalRuns} fuzz iterations in ${tTotal.toFixed(2)}ms (avg ${avgFuzzMs.toFixed(4)}ms/run). All 10,000 invariants passed.`);
    expect(avgFuzzMs).toBeLessThan(0.5);
  });

});

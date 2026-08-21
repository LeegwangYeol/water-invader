import { test, expect } from '@playwright/test';
import {
  SwarmBotEngine,
  extractBotPerception,
  injectSwarmBot,
  SwarmBotPerception,
  SwarmBotOptions
} from './swarm_bot_engine';

test.describe('Milestone 1: Swarm Bot Engine Core Unit & Simulation Suite', () => {

  test('1. 1D Potential Field Evasion: Dodges incoming high-speed bullet', async () => {
    // Player at center X = 275 (width 50 => centerX = 300), Y = 740
    // Enemy bullet at X = 295, Y = 500, Vy = 300 (falling directly toward player center)
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
        ultimateGauge: 0,
        stressLevel: 0,
        suppressionLevel: 0
      },
      bullets: [
        {
          x: 295,
          y: 500,
          vx: 0,
          vy: 300,
          width: 10,
          height: 10,
          isPlayerBullet: false,
          damage: 1
        }
      ],
      enemies: [
        {
          x: 275,
          y: 100,
          width: 40,
          height: 30,
          type: 0,
          hp: 1,
          speedX: 30,
          speedY: 8
        }
      ],
      barricades: [],
      currency: 0,
      level: 1,
      canvasWidth: 600,
      canvasHeight: 800,
      gameState: 1
    };

    const decision = SwarmBotEngine.computeDecision(perception);
    
    // Player must NOT stay at center X=275 where bullet impacts. Candidate must shift away from 275.
    expect(decision.bestCandidateX).not.toBe(275);
    expect(Math.abs(decision.bestCandidateX - 275)).toBeGreaterThanOrEqual(15);
    expect(decision.move).not.toBe('STAY');
    expect(decision.shoot).toBe(true);
  });

  test('2. Barricade Shadowing: Stone (0.02x) and Ice (0.2x) suppress bullet threat potential', async () => {
    // Bullet headed towards X = 200, Y = 400 with Vy = 300
    // Evaluate danger score at candidate centerX = 200, playerY = 740
    const candidateCenterX = 200;
    const playerY = 740;
    const bullets = [
      {
        x: 200,
        y: 400,
        vx: 0,
        vy: 300,
        width: 10,
        height: 10,
        isPlayerBullet: false,
        damage: 1
      }
    ];

    // Case A: No barricade
    const dangerNoBarricade = SwarmBotEngine.calculateCandidateDanger(
      candidateCenterX,
      playerY,
      bullets,
      [],
      []
    );

    // Case B: Indestructible Stone Barricade at X = 180, Y = 650, Width = 60 (type 1)
    const dangerStone = SwarmBotEngine.calculateCandidateDanger(
      candidateCenterX,
      playerY,
      bullets,
      [],
      [{ x: 180, y: 650, width: 60, height: 40, type: 1, hp: 1 }]
    );

    // Case C: Destructible Ice Barricade at X = 180, Y = 650, Width = 60 (type 0, hp 20)
    const dangerIce = SwarmBotEngine.calculateCandidateDanger(
      candidateCenterX,
      playerY,
      bullets,
      [],
      [{ x: 180, y: 650, width: 60, height: 40, type: 0, hp: 20 }]
    );

    // In the unshielded case, danger is > 1000
    expect(dangerNoBarricade).toBeGreaterThan(1000);
    // In stone barricade, threat is reduced by 98% (0.02x)
    expect(dangerStone).toBeCloseTo(dangerNoBarricade * 0.02, 1);
    // In ice barricade, threat is reduced by 80% (0.2x)
    expect(dangerIce).toBeCloseTo(dangerNoBarricade * 0.2, 1);
    expect(dangerStone).toBeLessThan(dangerIce);
    expect(dangerIce).toBeLessThan(dangerNoBarricade);
  });

  test('3. Diver Crash Alert: Heavy penalty for diver column intercept', async () => {
    const perceptionWithDiver: SwarmBotPerception = {
      player: {
        x: 300,
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
      bullets: [],
      enemies: [
        {
          x: 305,
          y: 400,
          width: 40,
          height: 30,
          type: 4, // DIVER
          hp: 2,
          speedX: 0,
          speedY: 150,
          isDiving: true
        }
      ],
      barricades: [],
      currency: 0,
      level: 2,
      canvasWidth: 600,
      canvasHeight: 800,
      gameState: 1
    };

    const decision = SwarmBotEngine.computeDecision(perceptionWithDiver);
    // Player should evade the diver's X trajectory (X=305)
    const playerCenterX = decision.bestCandidateX + 25;
    expect(Math.abs(playerCenterX - (305 + 20))).toBeGreaterThanOrEqual(25);
  });

  test('4. Strategic Skills: Ultimate (E) triggers at gauge >= 100 with >= 3 enemies or Boss', async () => {
    // Sub-case 4.1: Gauge 100, 3 normal enemies -> Should use Ultimate
    const p1: SwarmBotPerception = {
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
      enemies: [
        { x: 100, y: 100, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 },
        { x: 200, y: 100, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 },
        { x: 300, y: 100, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 }
      ],
      barricades: [],
      currency: 0,
      level: 1,
      canvasWidth: 600,
      canvasHeight: 800,
      gameState: 1
    };
    expect(SwarmBotEngine.computeDecision(p1).useUltimate).toBe(true);

    // Sub-case 4.2: Gauge 99, 5 enemies -> Should NOT use Ultimate
    const p2: SwarmBotPerception = {
      ...p1,
      player: { ...p1.player, ultimateGauge: 99 }
    };
    expect(SwarmBotEngine.computeDecision(p2).useUltimate).toBe(false);

    // Sub-case 4.3: Gauge 100, 1 Boss enemy (Type 2) -> Should use Ultimate
    const p3: SwarmBotPerception = {
      ...p1,
      enemies: [
        { x: 200, y: 90, width: 150, height: 100, type: 2, hp: 50, speedX: 30, speedY: 0 }
      ]
    };
    expect(SwarmBotEngine.computeDecision(p3).useUltimate).toBe(true);

    // Sub-case 4.4: Gauge 100, only 1 normal enemy -> Should NOT waste Ultimate
    const p4: SwarmBotPerception = {
      ...p1,
      enemies: [
        { x: 200, y: 100, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 }
      ]
    };
    expect(SwarmBotEngine.computeDecision(p4).useUltimate).toBe(false);
  });

  test('5. Strategic Skills: Ally Summon (Q) triggers at currency >= 50 with >= 6 enemies or Y > 450', async () => {
    // Sub-case 5.1: Currency 50, 6 enemies -> Should summon Ally
    const enemies6 = Array.from({ length: 6 }, (_, i) => ({
      x: 50 + i * 80,
      y: 150,
      width: 40,
      height: 30,
      type: 0,
      hp: 1,
      speedX: 30,
      speedY: 8
    }));

    const p1: SwarmBotPerception = {
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
      bullets: [],
      enemies: enemies6,
      barricades: [],
      currency: 50,
      level: 2,
      canvasWidth: 600,
      canvasHeight: 800,
      gameState: 1
    };
    expect(SwarmBotEngine.computeDecision(p1).summonAlly).toBe(true);

    // Sub-case 5.2: Currency 49, 10 enemies -> Should NOT summon
    const p2: SwarmBotPerception = { ...p1, currency: 49 };
    expect(SwarmBotEngine.computeDecision(p2).summonAlly).toBe(false);

    // Sub-case 5.3: Currency 50, 2 enemies but one is at Y=460 (> 450) -> Should summon Ally
    const p3: SwarmBotPerception = {
      ...p1,
      enemies: [
        { x: 100, y: 100, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 },
        { x: 200, y: 460, width: 40, height: 30, type: 0, hp: 1, speedX: 30, speedY: 8 }
      ]
    };
    expect(SwarmBotEngine.computeDecision(p3).summonAlly).toBe(true);
  });

  test('6. In-Game Economy Auto-Buyer: Evaluates upgrades in strict priority (FireRate -> MultiShot -> Piercing)', async () => {
    // Mock Game Manager
    class MockGame {
      public state = 1;
      public currency = 350;
      public player = {
        position: { x: 275, y: 740 },
        size: { width: 50, height: 40 },
        hp: 3,
        maxHp: 5,
        speed: 300,
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
      public bullets: any[] = [];
      public enemies: any[] = [];
      public barricades: any[] = [];

      public upgradeFireRate() {
        if (this.currency >= 50 && this.player.fireRate > 0.1) {
          this.currency -= 50;
          this.player.fireRate = Math.max(0.1, Math.round((this.player.fireRate - 0.1) * 10) / 10);
        }
      }
      public upgradeMultiShot() {
        if (this.currency >= 100 && this.player.multiShot < 5) {
          this.currency -= 100;
          this.player.multiShot++;
        }
      }
      public upgradePiercing() {
        if (this.currency >= 200 && this.player.piercing < 99) {
          this.currency -= 200;
          this.player.piercing++;
        }
      }
      public triggerUltimate() {}
      public triggerSummonAlly() {}
    }

    const mockGame = new MockGame();

    // 1st Evaluation with 350 currency:
    // FireRate starts at 0.5 -> buys 4 upgrades (0.4, 0.3, 0.2, 0.1) costing 200 currency (leaves 150)
    // MultiShot starts at 1 -> buys 1 upgrade (Lv 2) costing 100 currency (leaves 50)
    // Piercing costs 200 -> cannot afford with 50 currency
    // FireRate is already maxed at 0.1
    // Total spent: 300 currency, leaving 50 currency
    const purchases = SwarmBotEngine.evaluateEconomy(mockGame);
    expect(purchases.fireRate).toBe(4);
    expect(purchases.multiShot).toBe(1);
    expect(purchases.piercing).toBe(0);
    expect(purchases.totalSpent).toBe(300);
    expect(mockGame.currency).toBe(50);
    expect(mockGame.player.fireRate).toBe(0.1);
    expect(mockGame.player.multiShot).toBe(2);
    expect(mockGame.player.piercing).toBe(1);

    // Give 1000 currency to test maxing Multi-Shot Lv 5 and purchasing Piercing
    mockGame.currency += 1000; // total 1050
    const multiPurchases = SwarmBotEngine.evaluateEconomy(mockGame);
    // FireRate is already maxed at 0.1 -> 0 purchases
    // MultiShot is at 2 -> buys 3 upgrades (3, 4, 5) costing 300 currency (leaves 750)
    // Piercing starts at 1 -> buys 3 upgrades (2, 3, 4) costing 600 currency (leaves 150)
    // Total spent: 900 currency, leaving 150 currency
    expect(multiPurchases.fireRate).toBe(0);
    expect(mockGame.player.fireRate).toBe(0.1);
    expect(multiPurchases.multiShot).toBe(3);
    expect(mockGame.player.multiShot).toBe(5);
    expect(multiPurchases.piercing).toBe(3);
    expect(mockGame.player.piercing).toBe(4);
    expect(mockGame.currency).toBe(150);
  });

  test('7. Zero-Latency In-Page Injection: injectSwarmBot lifecycle & telemetry', async () => {
    class MockInteractiveGame {
      public state = 1;
      public currency = 100;
      public level = 1;
      public logicalWidth = 600;
      public logicalHeight = 800;
      public player = {
        position: { x: 275, y: 740 },
        size: { width: 50, height: 40 },
        hp: 3,
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
      public enemies: any[] = [
        { position: { x: 100, y: 100 }, size: { width: 40, height: 30 }, type: 0, hp: 1, speedX: 30, speedY: 8 },
        { position: { x: 200, y: 100 }, size: { width: 40, height: 30 }, type: 0, hp: 1, speedX: 30, speedY: 8 },
        { position: { x: 300, y: 100 }, size: { width: 40, height: 30 }, type: 0, hp: 1, speedX: 30, speedY: 8 }
      ];
      public barricades: any[] = [];

      public upgradeFireRate() {
        if (this.currency >= 50 && this.player.fireRate > 0.1) {
          this.currency -= 50;
          this.player.fireRate = Math.max(0.1, Math.round((this.player.fireRate - 0.1) * 10) / 10);
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
        if (this.player.ultimateGauge >= 100) {
          this.player.ultimateGauge = 0;
        }
      }
      public triggerSummonAlly() {
        if (this.currency >= 50) {
          this.currency -= 50;
        }
      }
    }

    const game = new MockInteractiveGame();
    let decisionCallbackCount = 0;

    const bot = injectSwarmBot(game, {
      tickIntervalMs: 16,
      autoShoot: true,
      autoSkills: true,
      autoUpgrade: true,
      onDecision: () => {
        decisionCallbackCount++;
      }
    });

    expect(bot.isRunning()).toBe(false);

    // Run a manual tick
    const decision = bot.tick();
    expect(decision).toBeDefined();
    expect(decisionCallbackCount).toBe(1);
    expect(game.player.isShooting).toBe(true);
    expect(game.player.ultimateGauge).toBe(0); // Ultimate was triggered and reset to 0

    const telemetry1 = bot.getTelemetry();
    expect(telemetry1.ticksExecuted).toBe(1);
    expect(telemetry1.ultimatesCast).toBe(1);
    // 100 currency -> buys 2 FireRate upgrades (50 + 50)
    expect(telemetry1.upgradesBought.fireRate).toBe(2);
    expect(game.currency).toBe(0);

    // Start automated timer
    bot.start();
    expect(bot.isRunning()).toBe(true);

    // Wait ~60ms for 3-4 ticks
    await new Promise(resolve => setTimeout(resolve, 60));

    const telemetry2 = bot.getTelemetry();
    expect(telemetry2.ticksExecuted).toBeGreaterThanOrEqual(2);
    expect(telemetry2.averageTickDurationMs).toBeGreaterThanOrEqual(0);
    expect(telemetry2.averageTickDurationMs).toBeLessThan(5.0); // Sub-5ms execution

    // Stop bot
    bot.stop();
    expect(bot.isRunning()).toBe(false);
    expect(game.player.isShooting).toBe(false);
    expect(game.player.isMovingLeft).toBe(false);
    expect(game.player.isMovingRight).toBe(false);
  });

});

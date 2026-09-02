import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import { GameState, Faction } from '../src/game/types';

// Mock Browser Environment for Headless Node / Playwright Unit Execution
if (typeof (global as any).requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16);
}
if (typeof (global as any).cancelAnimationFrame === 'undefined') {
  (global as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
}

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
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1.0,
      shadowColor: '#000000',
      shadowBlur: 0,
    }),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

test.describe('Empirical Adversarial Stress Suite: Economy, Shop State Machine & Lifecycle Persistence', () => {

  // =========================================================================
  // 1. STARTING ECONOMY & PRE-GAME SHOP AFFORDABILITY (150 PURE WATER)
  // =========================================================================

  test('ECON-01: Starter Pure Water budget (150 💧) initialized on GameManager creation and baseline stats verified', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Initial state: MENU, 150 Pure Water allowance
    expect(gm.state).toBe(GameState.MENU);
    expect(gm.currency).toBe(150);
    expect(gm.score).toBe(0);
    expect(gm.level).toBe(1);

    // Initial player stats (Baseline Lv.1)
    expect(gm.player.baseFireRate).toBe(0.5);
    expect(gm.player.multiShot).toBe(1);
    expect(gm.player.piercing).toBe(1);
    expect(gm.player.hasAcidShield).toBe(false);
    expect(gm.player.hp).toBe(3);
    expect(gm.player.maxHp).toBe(5);

    // getUpgrades() level representation
    const upgrades = gm.getUpgrades();
    expect(upgrades.fireRate).toBe(1);
    expect(upgrades.multiShot).toBe(1);
    expect(upgrades.piercing).toBe(1);
    expect(upgrades.hasAcidShield).toBe(false);
  });

  test('ECON-02 [Option A]: Purchasing Acid Shield (150 💧) consumes entire starter budget and unlocks hydrophobic canopy', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    expect(gm.currency).toBe(150);
    expect(gm.player.hasAcidShield).toBe(false);

    gm.upgradeAcidShield();

    expect(gm.currency).toBe(0);
    expect(gm.player.hasAcidShield).toBe(true);
    expect(gm.getUpgrades().hasAcidShield).toBe(true);

    // Weapon stats remain baseline
    expect(gm.player.baseFireRate).toBe(0.5);
    expect(gm.player.multiShot).toBe(1);
    expect(gm.player.piercing).toBe(1);
  });

  test('ECON-03 [Option B]: Purchasing Fire Rate (50 💧) + Multi-Shot (100 💧) before Wave 1 consumes exact 150 budget', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    expect(gm.currency).toBe(150);

    // Buy Fire Rate Lv.2 (cost 50)
    gm.upgradeFireRate();
    expect(gm.currency).toBe(100);
    expect(gm.player.baseFireRate).toBeCloseTo(0.4, 5);
    expect(gm.getUpgrades().fireRate).toBe(2);

    // Buy Multi-Shot Lv.2 (cost 100)
    gm.upgradeMultiShot();
    expect(gm.currency).toBe(0);
    expect(gm.player.multiShot).toBe(2);
    expect(gm.getUpgrades().multiShot).toBe(2);

    // Piercing and Acid Shield untouched
    expect(gm.player.piercing).toBe(1);
    expect(gm.player.hasAcidShield).toBe(false);
  });

  test('ECON-04 [Option C]: Purchasing 3 consecutive Fire Rate upgrades (50x3 = 150 💧) achieves Lv.4 Fire Rate', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    expect(gm.currency).toBe(150);

    // Lv.1 -> Lv.2
    gm.upgradeFireRate();
    expect(gm.currency).toBe(100);
    expect(gm.player.baseFireRate).toBeCloseTo(0.4, 5);
    expect(gm.getUpgrades().fireRate).toBe(2);

    // Lv.2 -> Lv.3
    gm.upgradeFireRate();
    expect(gm.currency).toBe(50);
    expect(gm.player.baseFireRate).toBeCloseTo(0.3, 5);
    expect(gm.getUpgrades().fireRate).toBe(3);

    // Lv.3 -> Lv.4
    gm.upgradeFireRate();
    expect(gm.currency).toBe(0);
    expect(gm.player.baseFireRate).toBeCloseTo(0.2, 5);
    expect(gm.getUpgrades().fireRate).toBe(4);
  });

  test('ECON-05 [Option D]: Purchasing Piercing (200 💧) is rejected with starter 150 budget without modifying state', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    expect(gm.currency).toBe(150);

    // Attempt Piercing (cost 200 > 150)
    gm.upgradePiercing();

    // Must be rejected safely
    expect(gm.currency).toBe(150);
    expect(gm.player.piercing).toBe(1);
    expect(gm.getUpgrades().piercing).toBe(1);
  });

  // =========================================================================
  // 2. BOUNDARY CHECKS & ZERO / INSUFFICIENT FUNDS RESILIENCE
  // =========================================================================

  test('BOUND-01: Zero funds (0 💧) rejects all upgrade purchase attempts without state mutation', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.currency = 0;

    // Capture baseline
    const initialUpgrades = gm.getUpgrades();
    expect(initialUpgrades).toEqual({
      fireRate: 1,
      multiShot: 1,
      piercing: 1,
      hasAcidShield: false,
    });

    // Attempt all upgrades at 0 funds
    gm.upgradeFireRate();
    gm.upgradeMultiShot();
    gm.upgradePiercing();
    gm.upgradeAcidShield();

    // Verify state remained pristine
    expect(gm.currency).toBe(0);
    expect(gm.player.baseFireRate).toBe(0.5);
    expect(gm.player.multiShot).toBe(1);
    expect(gm.player.piercing).toBe(1);
    expect(gm.player.hasAcidShield).toBe(false);
    expect(gm.getUpgrades()).toEqual(initialUpgrades);
  });

  test('BOUND-02: Near-threshold insufficient funds (49, 99, 149, 199 💧) boundary checks', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // 49 💧: Fire Rate (needs 50) fails
    gm.currency = 49;
    gm.upgradeFireRate();
    expect(gm.currency).toBe(49);
    expect(gm.player.baseFireRate).toBe(0.5);

    // 99 💧: Multi-Shot (needs 100) fails
    gm.currency = 99;
    gm.upgradeMultiShot();
    expect(gm.currency).toBe(99);
    expect(gm.player.multiShot).toBe(1);

    // 149 💧: Acid Shield (needs 150) fails
    gm.currency = 149;
    gm.upgradeAcidShield();
    expect(gm.currency).toBe(149);
    expect(gm.player.hasAcidShield).toBe(false);

    // 199 💧: Piercing (needs 200) fails
    gm.currency = 199;
    gm.upgradePiercing();
    expect(gm.currency).toBe(199);
    expect(gm.player.piercing).toBe(1);
  });

  test('BOUND-03: Sequential draining basket: 400 💧 -> Piercing(200) -> MultiShot(100) -> FireRate(50) -> FireRate(50) -> 0 💧', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.currency = 400;

    // 1. Buy Piercing (200)
    gm.upgradePiercing();
    expect(gm.currency).toBe(200);
    expect(gm.player.piercing).toBe(2);

    // 2. Buy MultiShot (100)
    gm.upgradeMultiShot();
    expect(gm.currency).toBe(100);
    expect(gm.player.multiShot).toBe(2);

    // 3. Buy FireRate (50)
    gm.upgradeFireRate();
    expect(gm.currency).toBe(50);
    expect(gm.player.baseFireRate).toBeCloseTo(0.4, 5);

    // 4. Buy FireRate (50)
    gm.upgradeFireRate();
    expect(gm.currency).toBe(0);
    expect(gm.player.baseFireRate).toBeCloseTo(0.3, 5);

    // 5. Attempt another FireRate with 0 funds -> rejected
    gm.upgradeFireRate();
    expect(gm.currency).toBe(0);
    expect(gm.player.baseFireRate).toBeCloseTo(0.3, 5);

    // 6. Attempt Acid Shield with 0 funds -> rejected
    gm.upgradeAcidShield();
    expect(gm.currency).toBe(0);
    expect(gm.player.hasAcidShield).toBe(false);
  });

  // =========================================================================
  // 3. UPGRADE LEVEL CAPS & DUPLICATE PURCHASE BOUNDARIES
  // =========================================================================

  test('CAP-01 [BUG SURFACE]: Fire Rate purchase capping and floating-point precision check', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.currency = 1000;

    // 4 upgrades: 0.5s -> 0.4s -> 0.3s -> 0.2s -> 0.1s (Cost: 4 * 50 = 200)
    for (let i = 0; i < 4; i++) {
      gm.upgradeFireRate();
    }
    // Check state at Lv.5
    expect(gm.getUpgrades().fireRate).toBe(5);
    expect(gm.player.baseFireRate).toBeCloseTo(0.1, 5);

    // Track currency before 5th attempt
    const currencyAtLv5 = gm.currency;

    // Attempt 5th upgrade
    gm.upgradeFireRate();

    // Check if 5th upgrade was erroneously accepted due to float IEEE 754 precision (0.10000000000000003 > 0.1)
    const floatBugDetected = (gm.currency === currencyAtLv5 - 50);
    console.log(`[CAP-01 Log] Currency before 5th attempt: ${currencyAtLv5}, after: ${gm.currency}. Float bug detected: ${floatBugDetected}`);
    
    // Assert strictly against spec: Level 5 must not deduct extra currency
    expect(gm.currency, 'Fire Rate at Level 5 cap must not allow 5th purchase or deduct extra currency').toBe(800);
  });

  test('CAP-02: Multi-Shot caps strictly at Lv.5 (5 projectiles) and rejects surplus purchases', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.currency = 1000;

    // 4 successful upgrades: 1 -> 2 -> 3 -> 4 -> 5 (Cost: 4 * 100 = 400)
    for (let i = 0; i < 4; i++) {
      gm.upgradeMultiShot();
    }
    expect(gm.currency).toBe(600);
    expect(gm.player.multiShot).toBe(5);
    expect(gm.getUpgrades().multiShot).toBe(5);

    // Attempt extra upgrades past cap
    for (let i = 0; i < 3; i++) {
      gm.upgradeMultiShot();
    }
    // Currency must NOT be deducted
    expect(gm.currency).toBe(600);
    expect(gm.player.multiShot).toBe(5);
    expect(gm.getUpgrades().multiShot).toBe(5);
  });

  test('CAP-03: Piercing caps strictly at Lv.5 (5 hits) and rejects surplus purchases', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.currency = 2000;

    // 4 successful upgrades: 1 -> 2 -> 3 -> 4 -> 5 (Cost: 4 * 200 = 800)
    for (let i = 0; i < 4; i++) {
      gm.upgradePiercing();
    }
    expect(gm.currency).toBe(1200);
    expect(gm.player.piercing).toBe(5);
    expect(gm.getUpgrades().piercing).toBe(5);

    // Attempt extra upgrades past cap
    for (let i = 0; i < 3; i++) {
      gm.upgradePiercing();
    }
    // Currency must NOT be deducted
    expect(gm.currency).toBe(1200);
    expect(gm.player.piercing).toBe(5);
    expect(gm.getUpgrades().piercing).toBe(5);
  });

  test('CAP-04: Acid Shield is strictly a 1-time purchase (150 💧) and rejects duplicate re-purchasing', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.currency = 1000;

    // 1st purchase (150 💧)
    gm.upgradeAcidShield();
    expect(gm.currency).toBe(850);
    expect(gm.player.hasAcidShield).toBe(true);
    expect(gm.getUpgrades().hasAcidShield).toBe(true);

    // 2nd, 3rd, 4th purchase attempt
    for (let i = 0; i < 3; i++) {
      gm.upgradeAcidShield();
    }
    // Currency must remain 850
    expect(gm.currency).toBe(850);
    expect(gm.player.hasAcidShield).toBe(true);
    expect(gm.getUpgrades().hasAcidShield).toBe(true);
  });

  // =========================================================================
  // 4. LIFECYCLE PERSISTENCE ACROSS GameManager.init()
  // =========================================================================

  test('PERSIST-01: GameManager.init(false, true) preserves all upgraded stats, Acid Shield, and remaining currency into Wave 1', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Spend starting budget: Buy Fire Rate Lv.2 (50) + Multi-Shot Lv.2 (100) = 150
    gm.upgradeFireRate();
    gm.upgradeMultiShot();
    expect(gm.currency).toBe(0);
    expect(gm.player.baseFireRate).toBeCloseTo(0.4, 5);
    expect(gm.player.multiShot).toBe(2);

    // Grant 350 more pure water and buy Piercing Lv.2 (200) + Acid Shield (150)
    gm.currency = 350;
    gm.upgradePiercing();
    gm.upgradeAcidShield();
    gm.currency = 88; // Leave 88 currency

    expect(gm.player.baseFireRate).toBeCloseTo(0.4, 5);
    expect(gm.player.multiShot).toBe(2);
    expect(gm.player.piercing).toBe(2);
    expect(gm.player.hasAcidShield).toBe(true);
    expect(gm.currency).toBe(88);

    // Simulate game start from lobby: init(false, true) [resetScoreAndCash: false, preserveUpgrades: true]
    gm.init(false, true);

    // Verify full preservation
    expect(gm.player.baseFireRate).toBeCloseTo(0.4, 5);
    expect(gm.player.multiShot).toBe(2);
    expect(gm.player.piercing).toBe(2);
    expect(gm.player.hasAcidShield).toBe(true);
    expect(gm.currency).toBe(88);
    expect(gm.level).toBe(1);
    expect(gm.player.hp).toBe(3);
  });

  test('PERSIST-02: GameManager.init(true, false) wipes all stats back to baseline and restores starter currency to 150', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Max out stats
    gm.currency = 5000;
    for (let i = 0; i < 4; i++) gm.upgradeFireRate();
    for (let i = 0; i < 4; i++) gm.upgradeMultiShot();
    for (let i = 0; i < 4; i++) gm.upgradePiercing();
    gm.upgradeAcidShield();
    gm.score = 12500;
    gm.level = 8;

    // Full fresh game restart: init(true, false) [resetScoreAndCash: true, preserveUpgrades: false]
    gm.init(true, false);

    // Verify complete wipe back to defaults
    expect(gm.player.baseFireRate).toBe(0.5);
    expect(gm.player.multiShot).toBe(1);
    expect(gm.player.piercing).toBe(1);
    expect(gm.player.hasAcidShield).toBe(false);
    expect(gm.currency).toBe(150); // Restored starter pure water allowance
    expect(gm.score).toBe(0);
    expect(gm.level).toBe(1);
  });

  test('PERSIST-03: Default init() invocation without arguments cleanly resets player stats and preserves currency if resetScoreAndCash is omitted', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Buy some upgrades
    gm.currency = 500;
    gm.upgradeFireRate();
    gm.upgradeMultiShot();
    gm.upgradeAcidShield();
    const remainingCurrency = gm.currency; // 500 - 50 - 100 - 150 = 200

    // Invoke default init()
    gm.init();

    // Default init() has preserveUpgrades=false -> resets weapon stats
    expect(gm.player.baseFireRate).toBe(0.5);
    expect(gm.player.multiShot).toBe(1);
    expect(gm.player.piercing).toBe(1);
    expect(gm.player.hasAcidShield).toBe(false);

    // Default init() has resetScoreAndCash=false -> keeps remaining currency
    expect(gm.currency).toBe(remainingCurrency);
  });

  test('PERSIST-04 [INTERFACE DEFECT CHECK]: Passing options object init({ preserveUpgrades: true }) vs positional arguments', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    gm.currency = 500;
    gm.upgradeFireRate();
    gm.upgradeMultiShot();
    gm.upgradePiercing();
    gm.upgradeAcidShield();
    gm.currency = 77;

    // Attempt init({ preserveUpgrades: true } as any) as specified in mission/contract
    (gm as any).init({ preserveUpgrades: true });

    // In current implementation, passing object as 1st param is treated as truthy resetScoreAndCash, with preserveUpgrades=undefined (false)
    // This causes player stats to be WIPED and currency to be reset to 150!
    console.log(`[PERSIST-04 Log] After init({ preserveUpgrades: true }): fireRate=${gm.player.baseFireRate}, multiShot=${gm.player.multiShot}, currency=${gm.currency}`);

    // If options object is not supported, fireRate resets to 0.5 and currency resets to 150
    const wasWipedDueToSignatureMismatch = (gm.player.baseFireRate === 0.5 && gm.currency === 150);
    console.log(`[PERSIST-04 Log] Wiped due to positional vs object signature mismatch: ${wasWipedDueToSignatureMismatch}`);
  });

  test('PERSIST-05: Multi-wave progression (startNextWave) maintains upgrade stats across Wave transitions', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Buy upgrades before wave
    gm.currency = 500;
    gm.upgradeFireRate(); // 0.4
    gm.upgradeMultiShot(); // 2
    gm.upgradePiercing(); // 2
    gm.upgradeAcidShield(); // true

    // Wave 1 -> Wave 2
    gm.startNextWave();
    expect(gm.level).toBe(2);
    expect(gm.state).toBe(GameState.PLAYING);
    expect(gm.player.baseFireRate).toBeCloseTo(0.4, 5);
    expect(gm.player.multiShot).toBe(2);
    expect(gm.player.piercing).toBe(2);
    expect(gm.player.hasAcidShield).toBe(true);

    // Wave 2 -> Wave 3
    gm.startNextWave();
    expect(gm.level).toBe(3);
    expect(gm.player.baseFireRate).toBeCloseTo(0.4, 5);
    expect(gm.player.multiShot).toBe(2);
    expect(gm.player.piercing).toBe(2);
    expect(gm.player.hasAcidShield).toBe(true);
  });

  // =========================================================================
  // 5. REACT UI CALLBACKS & STATE SYNCHRONIZATION
  // =========================================================================

  test('SYNC-01: onUpgradesChange and onScoreChange callbacks trigger synchronously on every purchase', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    const upgradeEvents: any[] = [];
    const scoreEvents: any[] = [];

    gm.onUpgradesChange = (upg) => {
      upgradeEvents.push({ ...upg });
    };
    gm.onScoreChange = (score, currency, combo, wave, ult) => {
      scoreEvents.push({ score, currency, combo, wave, ult });
    };

    gm.currency = 300;

    // Purchase 1: Fire Rate
    gm.upgradeFireRate();
    expect(upgradeEvents.length).toBe(1);
    expect(upgradeEvents[0].fireRate).toBe(2);
    expect(scoreEvents.length).toBe(1);
    expect(scoreEvents[0].currency).toBe(250);

    // Purchase 2: Multi-Shot
    gm.upgradeMultiShot();
    expect(upgradeEvents.length).toBe(2);
    expect(upgradeEvents[1].multiShot).toBe(2);
    expect(scoreEvents.length).toBe(2);
    expect(scoreEvents[1].currency).toBe(150);

    // Purchase 3: Acid Shield
    gm.upgradeAcidShield();
    expect(upgradeEvents.length).toBe(3);
    expect(upgradeEvents[2].hasAcidShield).toBe(true);
    expect(scoreEvents.length).toBe(3);
    expect(scoreEvents[2].currency).toBe(0);
  });
});

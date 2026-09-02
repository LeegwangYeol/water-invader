import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { GameState, Faction } from '../../src/game/types';

if (typeof global.requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
  (global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
}

/**
 * Mock Canvas for Headless Unit Simulation
 */
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

test.describe('Unit Simulation: Pre-Game Shop Access & State Persistence', () => {

  test('SHOP-01: Starter Pure Water allowance allows pre-game shop preparations', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Initial state is MENU
    expect(gm.state).toBe(GameState.MENU);
    // Baseline player stats
    expect(gm.player.baseFireRate).toBe(0.5);
    expect(gm.player.multiShot).toBe(1);
    expect(gm.player.piercing).toBe(1);
    expect(gm.player.hasAcidShield).toBe(false);
  });

  test('SHOP-02: Purchasing Fire Rate upgrade before Wave 1 upgrades baseFireRate and deducts pure water', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.currency = 150; // Starter budget

    gm.upgradeFireRate();
    expect(gm.player.baseFireRate).toBe(0.4); // Level 2 fire rate
    expect(gm.currency).toBe(100); // 150 - 50 = 100
  });

  test('SHOP-03: Purchasing Acid Shield before Wave 1 activates hasAcidShield and deducts 150 pure water', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.currency = 150;

    if ((gm as any).upgradeAcidShield) {
      (gm as any).upgradeAcidShield();
    }
    expect(gm.player.hasAcidShield).toBe(true);
    expect(gm.currency).toBe(0);
  });

  test('SHOP-04: gameManager.init(preserveUpgrades = true) preserves all upgraded stats and remaining currency', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Give budget and buy multiple upgrades
    gm.currency = 500;
    gm.upgradeFireRate(); // fireRate -> 0.4
    gm.upgradeMultiShot(); // multiShot -> 2
    gm.upgradePiercing(); // piercing -> 2
    if ((gm as any).upgradeAcidShield) (gm as any).upgradeAcidShield(); // hasAcidShield -> true
    const remainingCurrency = gm.currency;

    // Trigger init with preserveUpgrades = true (or init(false, true))
    (gm as any).init(false, true);

    // Verify all stats are strictly preserved
    expect(gm.player.baseFireRate).toBe(0.4);
    expect(gm.player.multiShot).toBe(2);
    expect(gm.player.piercing).toBe(2);
    expect(gm.player.hasAcidShield).toBe(true);
    expect(gm.currency).toBe(remainingCurrency);
  });

  test('SHOP-05: gameManager.init(preserveUpgrades = false) cleanly resets player back to base stats', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    gm.currency = 500;
    gm.upgradeFireRate();
    gm.upgradeMultiShot();
    gm.upgradePiercing();
    if ((gm as any).upgradeAcidShield) (gm as any).upgradeAcidShield();

    // Trigger full unpreserved reset
    (gm as any).init(true, false);

    expect(gm.player.baseFireRate).toBe(0.5);
    expect(gm.player.multiShot).toBe(1);
    expect(gm.player.piercing).toBe(1);
    expect(gm.player.hasAcidShield).toBe(false);
    expect(gm.score).toBe(0);
    expect(gm.level).toBe(1);
  });

  test('SHOP-06: startGame() seamlessly carries pre-game purchased weapon stats into Wave 1 gameplay', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Pre-game shopping (multiShot 100 + piercing 200 + acid shield 150 = 450)
    gm.currency = 500;
    gm.upgradeMultiShot(); // multiShot = 2
    gm.upgradePiercing(); // piercing = 2
    if ((gm as any).upgradeAcidShield) (gm as any).upgradeAcidShield(); // hasAcidShield = true

    // Start game
    gm.startGame();

    expect(gm.state).toBe(GameState.PLAYING);
    expect(gm.level).toBe(1);
    expect(gm.player.multiShot).toBe(2);
    expect(gm.player.piercing).toBe(2);
    expect(gm.player.hasAcidShield).toBe(true);

    // Test projectile generation in Wave 1
    gm.player.isShooting = true;
    const bullets = gm.player.fire();
    expect(bullets.length).toBe(2);
    expect(bullets.every(b => b.faction === Faction.PLAYER)).toBe(true);
    expect(bullets.every(b => b.piercing === 2)).toBe(true);
  });

  test('SHOP-07: Pre-game shop upgrades respect maximum tier caps and prevent over-purchasing', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.currency = 5000; // Unlimited testing budget

    // Max out Fire Rate (Lv 5 -> 0.1s)
    for (let i = 0; i < 6; i++) {
      gm.upgradeFireRate();
    }
    expect(gm.player.baseFireRate).toBeCloseTo(0.1, 2);

    // Max out Multi-Shot (Lv 5 -> 5 projectiles)
    for (let i = 0; i < 6; i++) {
      gm.upgradeMultiShot();
    }
    expect(gm.player.multiShot).toBe(5);

    // Max out Piercing (Lv 5 -> 5 hits)
    for (let i = 0; i < 6; i++) {
      gm.upgradePiercing();
    }
    expect(gm.player.piercing).toBe(5);

    // Test fire with max multi-shot produces 5 projectiles
    const maxBullets = gm.player.fire();
    expect(maxBullets.length).toBe(5);
    expect(maxBullets.every(b => b.piercing === 5)).toBe(true);
  });
});

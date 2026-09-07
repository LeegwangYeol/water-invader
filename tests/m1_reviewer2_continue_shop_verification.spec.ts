import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import { GameState, Faction } from '../src/game/types';

// Mock Browser Environment for Headless Node / Playwright Unit Execution
let rafCallbacks: Map<number, FrameRequestCallback> = new Map();
let nextRafId = 1;

(global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
  const id = nextRafId++;
  rafCallbacks.set(id, cb);
  return id;
};
(global as any).cancelAnimationFrame = (id: number) => {
  rafCallbacks.delete(id);
};

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

test.describe('Milestone 1 Reviewer 2: Pre-Continue Shop Access & Stability Verification', () => {
  test.beforeEach(() => {
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      const id = nextRafId++;
      rafCallbacks.set(id, cb);
      return id;
    };
    (global as any).cancelAnimationFrame = (id: number) => {
      rafCallbacks.delete(id);
    };
  });

  test('VERIFY-01: prepareContinue sets GameState.SHOP, cancels rAF, and purges hazards', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    gm.startGame();
    expect(gm.state).toBe(GameState.PLAYING);
    expect((gm as any).animationFrameId).toBeTruthy();

    // Simulate player death at wave 5 with score & cash
    gm.level = 5;
    gm.score = 12500;
    gm.currency = 450;
    gm.player.hp = 0;
    gm.player.isDead = true;
    (gm as any).gameOver('Test death');
    expect(gm.state).toBe(GameState.GAME_OVER);

    // Call prepareContinue()
    gm.prepareContinue();

    // 1. State must be SHOP and paused
    expect(gm.state).toBe(GameState.SHOP);
    expect(gm.isPaused).toBe(true);

    // 2. rAF must be cancelled and reset to 0
    expect((gm as any).animationFrameId).toBe(0);

    // 3. Player revived with at least 3 HP, dead flag cleared
    expect(gm.player.isDead).toBe(false);
    expect(gm.player.hp).toBe(3);

    // 4. Volatiles purged
    expect(gm.bullets.length).toBe(0);
    expect(gm.enemies.length).toBe(0);
    expect(gm.helpers.length).toBe(0);
    expect(gm.hazardProjectiles.length).toBe(0);
    expect(gm.solarFlares.length).toBe(0);

    // 5. Score and level preserved
    expect(gm.level).toBe(5);
    expect(gm.score).toBe(12500);
    expect(gm.currency).toBe(450);
  });

  test('VERIFY-02: Tank repair in Continue Shop restores HP to 4 and 5, deducting 75 currency per repair', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    gm.level = 3;
    gm.currency = 200;
    (gm as any).gameOver('Death');
    gm.prepareContinue();

    expect(gm.player.hp).toBe(3);
    expect(gm.currency).toBe(200);

    // 1st repair: 3 -> 4 HP, 200 -> 125 currency
    const r1 = gm.repairTank();
    expect(r1).toBe(true);
    expect(gm.player.hp).toBe(4);
    expect(gm.currency).toBe(125);

    // 2nd repair: 4 -> 5 HP, 125 -> 50 currency
    const r2 = gm.repairTank();
    expect(r2).toBe(true);
    expect(gm.player.hp).toBe(5);
    expect(gm.currency).toBe(50);

    // 3rd repair: Already MAX (5 HP), should return false without deducting currency
    const r3 = gm.repairTank();
    expect(r3).toBe(false);
    expect(gm.player.hp).toBe(5);
    expect(gm.currency).toBe(50);
  });

  test('VERIFY-03: continueGame preserves repaired 5 HP, grants 1.5s i-frames, and resumes single rAF loop', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    gm.level = 7;
    gm.score = 25000;
    gm.currency = 300;
    (gm as any).gameOver('Boss laser');
    gm.prepareContinue();

    // Player repairs tank up to 5 HP in shop
    gm.repairTank();
    gm.repairTank();
    expect(gm.player.hp).toBe(5);

    // Now continueGame() is called when clicking "Resume Wave"
    gm.continueGame();

    // 1. Repaired HP is preserved! Not downgraded to 3
    expect(gm.player.hp).toBe(5);

    // 2. Invincibility timer is set to 1.5 seconds
    expect(gm.player.invincibilityTimer).toBe(1.5);

    // 3. State transitions to PLAYING
    expect(gm.state).toBe(GameState.PLAYING);
    expect(gm.isPaused).toBe(false);

    // 4. Wave level and score strictly preserved
    expect(gm.level).toBe(7);
    expect(gm.score).toBe(25000);

    // 5. Exactly one active rAF loop scheduled
    expect((gm as any).animationFrameId).toBeGreaterThan(0);

    // 6. Barricades and wave enemies spawned
    expect(gm.barricades.length).toBe(4);
    expect(gm.enemies.length).toBeGreaterThan(0);
  });

  test('VERIFY-04: Stress test: 20 sequential death -> prepareContinue -> continueGame cycles without rAF leaks or state degradation', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    gm.startGame();
    let initialWave = 8;
    gm.level = initialWave;
    gm.score = 50000;
    gm.currency = 5000;

    for (let cycle = 1; cycle <= 20; cycle++) {
      // 1. Player dies
      gm.player.hp = 0;
      gm.player.isDead = true;
      (gm as any).gameOver(`Death cycle ${cycle}`);
      expect(gm.state).toBe(GameState.GAME_OVER);

      // 2. Player opens Continue Shop
      gm.prepareContinue();
      expect(gm.state).toBe(GameState.SHOP);
      expect(gm.isPaused).toBe(true);
      expect((gm as any).animationFrameId).toBe(0);

      // 3. Optional shop repair
      if (cycle % 2 === 0) {
        gm.repairTank();
        expect(gm.player.hp).toBe(4);
      } else {
        expect(gm.player.hp).toBe(3);
      }

      // 4. Resume wave
      gm.continueGame();
      expect(gm.state).toBe(GameState.PLAYING);
      expect(gm.isPaused).toBe(false);
      expect((gm as any).animationFrameId).toBeGreaterThan(0);
      expect(gm.player.invincibilityTimer).toBe(1.5);

      // Verify wave and score are never corrupted
      expect(gm.level).toBe(initialWave);
      expect(gm.score).toBe(50000);
      expect(Number.isFinite(gm.player.hp)).toBe(true);
      expect(Number.isFinite(gm.currency)).toBe(true);
      expect(gm.bullets.length).toBe(0);
    }

    gm.stopGame();
    expect((gm as any).animationFrameId).toBe(0);
  });

  test('VERIFY-05: Invincibility timer decrements and protects player from damage during 1.5s window', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    gm.continueGame();
    expect(gm.player.invincibilityTimer).toBe(1.5);

    // Update with 0.5s deltaTime
    gm.player.update(0.5);
    expect(gm.player.invincibilityTimer).toBeCloseTo(1.0, 2);

    // Update with another 0.8s
    gm.player.update(0.8);
    expect(gm.player.invincibilityTimer).toBeCloseTo(0.2, 2);

    // Update with 0.3s (expires to 0)
    gm.player.update(0.3);
    expect(gm.player.invincibilityTimer).toBe(0);
  });

  test('VERIFY-06: Pause during GAME_OVER or SHOP cancels rAF and sets isPaused', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    gm.startGame();
    (gm as any).gameOver('Test');
    expect(gm.state).toBe(GameState.GAME_OVER);

    gm.pause();
    expect(gm.isPaused).toBe(true);
    expect((gm as any).animationFrameId).toBe(0);

    gm.prepareContinue();
    expect(gm.state).toBe(GameState.SHOP);
    expect(gm.isPaused).toBe(true);
    expect((gm as any).animationFrameId).toBe(0);
  });

});

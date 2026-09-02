import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Player } from '../../src/game/Player';
import { HazardProjectile, GameState } from '../../src/game/types';

/**
 * Mock Canvas & 2D Context for Headless Unit Simulation
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

test.describe('Unit Simulation: Acid Rain Counterplay & Acid Shield Mechanics', () => {

  test('ACID-01: Player entity initializes with hasAcidShield = false by default', () => {
    const player = new Player(600, 800);
    expect(player.hasAcidShield).toBe(false);
    expect(player.hp).toBe(3);
    expect(player.maxHp).toBe(5);
  });

  test('ACID-02: Unshielded player collision with Acid Rain droplet deducts 1 HP and marks droplet dead', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.player.hasAcidShield = false;
    gm.player.hp = 3;
    gm.player.invincibilityTimer = 0;

    // Position an Acid Rain hazard droplet directly inside player hitbox
    const px = gm.player.position.x;
    const py = gm.player.position.y;
    const droplet: HazardProjectile = {
      x: px + 15,
      y: py + 10,
      radius: 6,
      speedY: 250,
      speedX: 0,
      damage: 1,
      color: '#a3e635',
      isDead: false,
    };
    gm.hazardProjectiles = [droplet];

    // Simulate 1 fixed physics tick (1/60s)
    (gm as any).update(1 / 60);

    // Verify damage taken
    expect(droplet.isDead).toBe(true);
    expect(gm.player.hp).toBe(2);
    expect(gm.player.invincibilityTimer).toBeGreaterThan(0);
    expect(gm.player.hitFlashTimer).toBeGreaterThan(0);
  });

  test('ACID-03: Fatal unshielded acid droplet collision triggers Game Over when HP drops to 0', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.player.hasAcidShield = false;
    gm.player.hp = 1;
    gm.player.invincibilityTimer = 0;

    const droplet: HazardProjectile = {
      x: gm.player.position.x + 10,
      y: gm.player.position.y + 10,
      radius: 6,
      speedY: 200,
      damage: 1,
      color: '#a3e635',
      isDead: false,
    };
    gm.hazardProjectiles = [droplet];

    (gm as any).update(1 / 60);

    expect(gm.player.hp).toBe(0);
    expect(droplet.isDead).toBe(true);
    expect(gm.state).toBe(GameState.GAME_OVER);
  });

  test('ACID-04: Shielded player (hasAcidShield = true) safely deflects Acid Rain droplets with 0 damage', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.player.hasAcidShield = true;
    gm.player.hp = 3;
    gm.player.invincibilityTimer = 0;

    const droplet: HazardProjectile = {
      x: gm.player.position.x + 20,
      y: gm.player.position.y + 15,
      radius: 8,
      speedY: 280,
      damage: 1,
      color: '#a3e635',
      isDead: false,
    };
    gm.hazardProjectiles = [droplet];

    (gm as any).update(1 / 60);

    // Droplet is destroyed on contact, but Player HP remains untouched
    expect(droplet.isDead).toBe(true);
    expect(gm.player.hp).toBe(3);
    // Player was not hurt, so no damage i-frames or game over
    expect(gm.player.invincibilityTimer).toBe(0);
    expect(gm.state).toBe(GameState.PLAYING);
  });

  test('ACID-05: upgradeAcidShield() transactions, pure water cost deduction, and idempotency', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Case A: Insufficient pure water (< 150)
    gm.currency = 100;
    gm.player.hasAcidShield = false;
    if ((gm as any).upgradeAcidShield) {
      (gm as any).upgradeAcidShield();
    }
    expect(gm.currency).toBe(100);
    expect(gm.player.hasAcidShield).toBe(false);

    // Case B: Sufficient pure water (150)
    gm.currency = 150;
    if ((gm as any).upgradeAcidShield) {
      (gm as any).upgradeAcidShield();
    }
    expect(gm.currency).toBe(0);
    expect(gm.player.hasAcidShield).toBe(true);

    // Case C: Already purchased - idempotent check
    gm.currency = 200;
    if ((gm as any).upgradeAcidShield) {
      (gm as any).upgradeAcidShield();
    }
    expect(gm.currency).toBe(200); // Does not double-charge
    expect(gm.player.hasAcidShield).toBe(true);
  });

  test('ACID-06: Swarm Stress Test: Deflecting 20 simultaneous acid storm droplets with 0 damage leakage', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.player.hasAcidShield = true;
    gm.player.hp = 3;

    // Spawn 20 overlapping acid droplets colliding simultaneously
    const px = gm.player.position.x;
    const py = gm.player.position.y;
    gm.hazardProjectiles = Array.from({ length: 20 }, (_, i) => ({
      x: px + (i % 5) * 8,
      y: py + Math.floor(i / 5) * 6,
      radius: 6,
      speedY: 200 + i * 5,
      damage: 1,
      color: '#a3e635',
      isDead: false,
    }));

    (gm as any).update(1 / 60);

    // Verify all 20 droplets dead and 0 damage taken
    expect(gm.hazardProjectiles.every(hz => hz.isDead)).toBe(true);
    expect(gm.player.hp).toBe(3);
    expect(gm.state).toBe(GameState.PLAYING);
  });

  test('ACID-07: Player draw pipeline renders cleanly with hasAcidShield = true and false', () => {
    const canvas = createMockCanvas();
    const ctx = canvas.getContext('2d')!;
    const player = new Player(600, 800);

    // Draw unshielded
    player.hasAcidShield = false;
    expect(() => player.draw(ctx)).not.toThrow();

    // Draw shielded
    player.hasAcidShield = true;
    expect(() => player.draw(ctx)).not.toThrow();
  });
});

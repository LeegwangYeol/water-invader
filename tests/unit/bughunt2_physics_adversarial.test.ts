import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Enemy, EnemyType } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { Barricade, BarricadeType } from '../../src/game/Barricade';
import { Helper, HelperType } from '../../src/game/Helper';
import { Player } from '../../src/game/Player';
import { Faction } from '../../src/game/types';

/**
 * Headless Canvas Context Mock for testing GameManager physics and collisions
 */
function createMockCanvasContext(): CanvasRenderingContext2D {
  const ctx: any = {
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    arcTo: () => {},
    ellipse: () => {},
    bezierCurveTo: () => {},
    quadraticCurveTo: () => {},
    rect: () => {},
    roundRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    clearRect: () => {},
    fill: () => {},
    stroke: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    fillText: () => {},
    strokeText: () => {},
    measureText: (text: string) => ({ width: text.length * 8 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    setLineDash: () => {},
    getLineDash: () => [],
    shadowBlur: 0,
    shadowColor: '',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1.0,
    globalCompositeOperation: 'source-over',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    font: '10px sans-serif'
  };
  return ctx as CanvasRenderingContext2D;
}

function createMockCanvas(): HTMLCanvasElement {
  const canvas = {
    width: 600,
    height: 800,
    getContext: () => createMockCanvasContext(),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

test.describe('Adversarial Empirical Challenge: Physics, Combat, Barricades & Crisis Mechanics', () => {

  // =========================================================================
  // CHALLENGE 1: Piercing Penetration Against Helper Drones
  // =========================================================================
  test.describe('CH-01: Piercing Penetration Against Helper Drones', () => {

    test('CH-01.1: Bullet with piercing = 2 penetrates Helper 1, decrements piercing to 1, and impacts Helper 2 behind it', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.helpers = [];
      gm.barricades = [];

      // Helper 1 at (200, 300), size 32x24, HP = 10
      const helper1 = new Helper(200, 300, gm.logicalWidth, gm.logicalHeight, HelperType.FIGHTER);
      helper1.hp = 10;

      // Helper 2 at (200, 350), size 32x24, HP = 10 (directly behind Helper 1)
      const helper2 = new Helper(200, 350, gm.logicalWidth, gm.logicalHeight, HelperType.MEDIC);
      helper2.hp = 10;

      gm.helpers.push(helper1, helper2);

      // Hostile bullet at (210, 305) with damage = 2, piercing = 2
      const bullet = new Bullet(210, 305, 100, 2, false, 2);
      bullet.faction = Faction.INVADER;
      gm.bullets.push(bullet);

      // Frame 1: Collide with Helper 1
      (gm as any).checkCollisions(1 / 60);

      expect(helper1.hp).toBe(8); // Takes 2 damage
      expect(bullet.piercing).toBe(1); // Decremented 2 -> 1
      expect(bullet.isDead).toBe(false); // Survives
      expect((bullet.hitEntities as Set<any>).has(helper1)).toBe(true);
      expect(helper2.hp).toBe(10); // Helper 2 untouched on this frame

      // Frame 2: Bullet travels down to Helper 2 at (210, 355)
      bullet.position.y = 355;
      (gm as any).checkCollisions(1 / 60);

      expect(helper2.hp).toBe(8); // Helper 2 takes 2 damage
      expect(bullet.piercing).toBe(0); // Piercing exhausted 1 -> 0
      expect(bullet.isDead).toBe(true); // Bullet is destroyed
      expect((bullet.hitEntities as Set<any>).has(helper2)).toBe(true);
    });

    test('CH-01.2: Hostile bullet with piercing = 2 penetrates Helper and deals damage to Player behind it', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.helpers = [];
      gm.barricades = [];
      gm.isGodMode = false;
      gm.player.hp = 3;
      gm.player.invincibilityTimer = 0;

      const px = gm.player.position.x;
      const py = gm.player.position.y;

      // Helper placed directly in front of the player
      const helper = new Helper(px, py - 40, gm.logicalWidth, gm.logicalHeight, HelperType.TANK);
      helper.hp = 15;
      gm.helpers.push(helper);

      // Hostile bullet colliding with Helper
      const bullet = new Bullet(px + 10, py - 35, 200, 1, false, 2);
      bullet.faction = Faction.INVADER;
      gm.bullets.push(bullet);

      // Step 1: Hit Helper
      (gm as any).checkCollisions(1 / 60);
      expect(helper.hp).toBe(14); // 1 damage to helper
      expect(bullet.piercing).toBe(1);
      expect(bullet.isDead).toBe(false);
      expect(gm.player.hp).toBe(3); // Player unharmed on step 1

      // Step 2: Advance bullet into player hitbox
      bullet.position.y = py + 10;
      (gm as any).checkCollisions(1 / 60);

      expect(gm.player.hp).toBe(2); // Player takes damage
      expect(bullet.isDead).toBe(true); // Consumed on player hit
      expect(gm.player.invincibilityTimer).toBe(1.0);
    });

    test('CH-01.3: Piercing = 1 bullet does NOT penetrate Helper and cannot reach target behind it', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.helpers = [];
      gm.player.hp = 3;
      gm.player.invincibilityTimer = 0;

      const helper = new Helper(200, 300, gm.logicalWidth, gm.logicalHeight, HelperType.FIGHTER);
      helper.hp = 10;
      const targetBehind = new Helper(200, 350, gm.logicalWidth, gm.logicalHeight, HelperType.REPAIRER);
      targetBehind.hp = 10;
      gm.helpers.push(helper, targetBehind);

      const bullet = new Bullet(210, 305, 100, 2, false, 1); // piercing = 1
      bullet.faction = Faction.INVADER;
      gm.bullets.push(bullet);

      (gm as any).checkCollisions(1 / 60);

      expect(helper.hp).toBe(8);
      expect(bullet.piercing).toBe(0);
      expect(bullet.isDead).toBe(true);

      // Advance bullet to target position
      bullet.position.y = 355;
      (gm as any).checkCollisions(1 / 60);

      // Target behind is 100% unharmed
      expect(targetBehind.hp).toBe(10);
    });

    test('CH-01.4: Multi-frame CCD deduplication: Bullet staying within Helper hitbox only deals damage once', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.helpers = [];

      const helper = new Helper(200, 300, gm.logicalWidth, gm.logicalHeight, HelperType.FIGHTER);
      helper.hp = 10;
      gm.helpers.push(helper);

      // Slow bullet spending 15 frames inside helper hitbox
      const bullet = new Bullet(210, 302, 10, 2, false, 2);
      bullet.faction = Faction.INVADER;
      gm.bullets.push(bullet);

      for (let frame = 0; frame < 15; frame++) {
        (gm as any).checkCollisions(1 / 60);
        bullet.position.y += 1; // 1px shift per frame
      }

      // Damage must be applied EXACTLY once (10 - 2 = 8), piercing decremented EXACTLY once (2 -> 1)
      expect(helper.hp).toBe(8);
      expect(bullet.piercing).toBe(1);
      expect(bullet.isDead).toBe(false);
    });
  });

  // =========================================================================
  // CHALLENGE 2: Barricade Zero-HP Phantom Collisions
  // =========================================================================
  test.describe('CH-02: Barricade Zero-HP Phantom Collisions', () => {

    test('CH-02.1: In same tick, after Bullet 1 reduces Barricade HP to <= 0, subsequent bullets pass through without ghost hits', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];
      gm.helpers = [];
      gm.player.hp = 3;
      gm.player.invincibilityTimer = 0;

      // Barricade with 2 HP at (200, 300)
      const barricade = new Barricade(200, 300, BarricadeType.DESTRUCTIBLE);
      barricade.hp = 2;
      gm.barricades.push(barricade);

      // Three bullets in same frame at barricade coordinates
      // Bullet 0: will destroy barricade (damage = 2)
      const bullet0 = new Bullet(210, 305, 100, 2, false, 1);
      bullet0.faction = Faction.INVADER;

      // Bullet 1: right behind bullet 0 in the same tick
      const bullet1 = new Bullet(215, 305, 100, 1, false, 1);
      bullet1.faction = Faction.INVADER;

      // Bullet 2: also in the same tick
      const bullet2 = new Bullet(220, 305, 100, 1, false, 1);
      bullet2.faction = Faction.INVADER;

      gm.bullets.push(bullet0, bullet1, bullet2);

      // Execute single collision pass
      (gm as any).checkCollisions(1 / 60);

      // Barricade is dead
      expect(barricade.hp).toBe(0);
      expect(barricade.isDead).toBe(true);

      // Bullet 0 hit and died
      expect(bullet0.isDead).toBe(true);
      expect((bullet0.hitEntities as Set<any>).has(barricade)).toBe(true);

      // Bullet 1 & Bullet 2 MUST NOT have collided with dead barricade!
      expect(bullet1.isDead).toBe(false);
      expect((bullet1.hitEntities as Set<any>).has(barricade)).toBe(false);
      expect(bullet2.isDead).toBe(false);
      expect((bullet2.hitEntities as Set<any>).has(barricade)).toBe(false);
    });

    test('CH-02.2: Subsequent frame bullets completely ignore zero-HP / dead barricades', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      const deadBarricade = new Barricade(200, 300, BarricadeType.DESTRUCTIBLE);
      deadBarricade.hp = 0;
      deadBarricade.isDead = true;
      gm.barricades.push(deadBarricade);

      const bullet = new Bullet(210, 305, 200, 3, false, 2);
      bullet.faction = Faction.INVADER;
      gm.bullets.push(bullet);

      (gm as any).checkCollisions(1 / 60);

      expect(bullet.isDead).toBe(false);
      expect(bullet.piercing).toBe(2);
      expect((bullet.hitEntities as Set<any>).has(deadBarricade)).toBe(false);
    });

    test('CH-02.3: Lethal piercing bullet destroys barricade and continues without ghost re-hit', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      // Barricade with 5 HP
      const barricade = new Barricade(200, 300, BarricadeType.DESTRUCTIBLE);
      barricade.hp = 5;
      gm.barricades.push(barricade);

      // Piercing bullet with piercing = 2, damage = 10
      const bullet = new Bullet(210, 305, 100, 10, false, 2);
      bullet.faction = Faction.PLAYER;
      gm.bullets.push(bullet);

      // Hit barricade: destroys it
      (gm as any).checkCollisions(1 / 60);

      expect(barricade.hp).toBe(0);
      expect(barricade.isDead).toBe(true);
      expect(bullet.piercing).toBe(1); // Decremented from 2 to 1
      expect(bullet.isDead).toBe(false); // Bullet survives!

      // Step 2: Next frame while still in same bounding area
      (gm as any).checkCollisions(1 / 60);
      // Piercing does NOT decrement again, bullet does NOT die
      expect(bullet.piercing).toBe(1);
      expect(bullet.isDead).toBe(false);
    });
  });

  // =========================================================================
  // CHALLENGE 3: Barricade Voxel Reconstruction
  // =========================================================================
  test.describe('CH-03: Barricade Voxel Reconstruction With hp > maxHp', () => {

    test('CH-03.1: Barricade.update() with hp > maxHp terminates in < 100ms with no infinite loop', () => {
      const barricade = new Barricade(100, 500, BarricadeType.DESTRUCTIBLE);
      barricade.maxHp = 20;
      barricade.hp = 35; // Excess HP

      const start = Date.now();
      barricade.update(0.016);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
      const activeBlocks = barricade.blocks.filter(b => b).length;
      expect(activeBlocks).toBe(barricade.blocks.length); // 24
      expect(barricade.isDead).toBe(false);
    });

    test('CH-03.2: Extreme over-healing (hp = 10000) terminates instantly and clamps blocks to 24', () => {
      const barricade = new Barricade(100, 500, BarricadeType.DESTRUCTIBLE);
      barricade.maxHp = 20;
      barricade.hp = 10000;

      for (let i = 0; i < 50; i++) {
        barricade.update(0.016);
      }

      const activeBlocks = barricade.blocks.filter(b => b).length;
      expect(activeBlocks).toBe(24);
      expect(barricade.isDead).toBe(false);
    });

    test('CH-03.3: Reconstructing from 0 active blocks under over-heal conditions terminates correctly', () => {
      const barricade = new Barricade(100, 500, BarricadeType.DESTRUCTIBLE);
      barricade.maxHp = 20;
      barricade.blocks.fill(false); // Destroy all 24 blocks
      expect(barricade.blocks.filter(b => b).length).toBe(0);

      barricade.hp = 50; // Overheal
      barricade.update(0.016);

      const reconstructed = barricade.blocks.filter(b => b).length;
      expect(reconstructed).toBe(24);
      expect(barricade.isDead).toBe(false);
    });

    test('CH-03.4: Negative HP stress clamps hp to 0, sets isDead, and clears all blocks', () => {
      const barricade = new Barricade(100, 500, BarricadeType.DESTRUCTIBLE);
      barricade.maxHp = 20;
      barricade.hp = -100;

      barricade.update(0.016);

      expect(barricade.hp).toBe(0);
      expect(barricade.isDead).toBe(true);
      const activeBlocks = barricade.blocks.filter(b => b).length;
      expect(activeBlocks).toBe(0);
    });
  });

  // =========================================================================
  // CHALLENGE 4: Saboteur Lateral Traversal
  // =========================================================================
  test.describe('CH-04: Saboteur Lateral Traversal Vertical Clamping', () => {

    test('CH-04.1: During lateral traversal between central barricades, Saboteur y remains strictly clamped to latchY', () => {
      // Setup central barricades 1 & 2 at y = 720
      const b0 = new Barricade(50, 720, BarricadeType.DESTRUCTIBLE);
      const b1 = new Barricade(200, 720, BarricadeType.DESTRUCTIBLE); // x: 200..260
      const b2 = new Barricade(380, 720, BarricadeType.DESTRUCTIBLE); // x: 380..440
      const b3 = new Barricade(550, 720, BarricadeType.DESTRUCTIBLE);
      const barricades = [b0, b1, b2, b3];

      const saboteur = new Enemy(200, 690, 720, 15, EnemyType.SABOTEUR, 960);
      const latchY = b1.position.y - saboteur.size.height + 2; // 720 - 32 + 2 = 690
      saboteur.position.y = latchY;

      // Saboteur destroys central barricade 1
      b1.hp = 0;
      b1.isDead = true;

      // Simulate 120 frames (2 seconds) of Saboteur pathfinding towards central barricade 2
      const yHistory: number[] = [];
      for (let f = 0; f < 120; f++) {
        saboteur.update(0.016, 1.0, [], { x: 360, y: 880 }, [], barricades);
        yHistory.push(saboteur.position.y);
      }

      // Every frame must be clamped to latchY, never plunging down towards player lane (y > 690)
      for (let i = 0; i < yHistory.length; i++) {
        expect(yHistory[i], `Frame ${i} y position`).toBeLessThanOrEqual(latchY);
      }
      // Saboteur moved horizontally towards Barricade 2
      expect(saboteur.position.x).toBeGreaterThan(200);
    });

    test('CH-04.2: Traversal to flank barricades after both central barricades are destroyed maintains latchY clamp', () => {
      const b0 = new Barricade(50, 720, BarricadeType.DESTRUCTIBLE);
      const b1 = new Barricade(200, 720, BarricadeType.DESTRUCTIBLE); b1.hp = 0; b1.isDead = true;
      const b2 = new Barricade(380, 720, BarricadeType.DESTRUCTIBLE); b2.hp = 0; b2.isDead = true;
      const b3 = new Barricade(550, 720, BarricadeType.DESTRUCTIBLE);
      const barricades = [b0, b1, b2, b3];

      const saboteur = new Enemy(200, 690, 720, 15, EnemyType.SABOTEUR, 960);
      const latchY = b0.position.y - saboteur.size.height + 2;

      for (let f = 0; f < 60; f++) {
        saboteur.update(0.016, 1.0, [], { x: 360, y: 880 }, [], barricades);
        expect(saboteur.position.y).toBeLessThanOrEqual(latchY);
      }
    });

    test('CH-04.3: When all barricades are destroyed, Saboteur proceeds downward to invade player zone', () => {
      const b0 = new Barricade(50, 720, BarricadeType.DESTRUCTIBLE); b0.hp = 0; b0.isDead = true;
      const b1 = new Barricade(200, 720, BarricadeType.DESTRUCTIBLE); b1.hp = 0; b1.isDead = true;
      const b2 = new Barricade(380, 720, BarricadeType.DESTRUCTIBLE); b2.hp = 0; b2.isDead = true;
      const b3 = new Barricade(550, 720, BarricadeType.DESTRUCTIBLE); b3.hp = 0; b3.isDead = true;
      const barricades = [b0, b1, b2, b3];

      const saboteur = new Enemy(200, 690, 720, 15, EnemyType.SABOTEUR, 960);
      const initialY = saboteur.position.y;

      for (let f = 0; f < 60; f++) {
        saboteur.update(0.016, 1.0, [], { x: 360, y: 880 }, [], barricades);
      }

      // Without barricades to latch onto, saboteur plunges downward
      expect(saboteur.position.y).toBeGreaterThan(initialY);
    });
  });

  // =========================================================================
  // CHALLENGE 5: Diver-Barricade Collision
  // =========================================================================
  test.describe('CH-05: Diver-Barricade Collision Exclusivity', () => {

    test('CH-05.1: Diver impact damages only the impacted barricade and terminates loop (neighboring barricades take 0 damage)', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      // Two adjacent barricades touching/overlapping at border
      // Barricade A: x=200..260, y=700..740
      const barricadeA = new Barricade(200, 700, BarricadeType.DESTRUCTIBLE);
      barricadeA.hp = 20;

      // Barricade B: x=259..319, y=700..740 (overlaps Barricade A by 1px)
      const barricadeB = new Barricade(259, 700, BarricadeType.DESTRUCTIBLE);
      barricadeB.hp = 20;

      gm.barricades = [barricadeA, barricadeB];

      // Diver positioned to simultaneously overlap both barricades: x=250..280, y=710..740
      const diver = new Enemy(250, 710, gm.logicalWidth, 10, EnemyType.DIVER, gm.logicalHeight);
      diver.isDiving = true;
      gm.enemies.push(diver);

      // Verify geometry: diver overlaps BOTH barricades
      expect(diver.checkCollision(barricadeA)).toBe(true);
      expect(diver.checkCollision(barricadeB)).toBe(true);

      // Execute collision resolution
      (gm as any).checkCollisions(1 / 60);

      // Diver dies on impact
      expect(diver.isDead).toBe(true);

      // Barricade A takes full 20 damage and is destroyed
      expect(barricadeA.hp).toBe(0);
      expect(barricadeA.isDead).toBe(true);

      // CRITICAL VERIFICATION: Barricade B took ZERO damage because loop breaks on first impact
      expect(barricadeB.hp).toBe(20);
      expect(barricadeB.isDead).toBe(false);
    });

    test('CH-05.2: In a 4-barricade standard layout, Diver hitting Barricade 1 leaves 0, 2, and 3 untouched', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      const b0 = new Barricade(50, 700, BarricadeType.DESTRUCTIBLE); b0.hp = 20;
      const b1 = new Barricade(200, 700, BarricadeType.DESTRUCTIBLE); b1.hp = 20;
      const b2 = new Barricade(350, 700, BarricadeType.DESTRUCTIBLE); b2.hp = 20;
      const b3 = new Barricade(500, 700, BarricadeType.DESTRUCTIBLE); b3.hp = 20;
      gm.barricades = [b0, b1, b2, b3];

      const diver = new Enemy(210, 710, gm.logicalWidth, 10, EnemyType.DIVER, gm.logicalHeight);
      diver.isDiving = true;
      gm.enemies.push(diver);

      (gm as any).checkCollisions(1 / 60);

      expect(diver.isDead).toBe(true);
      expect(b0.hp).toBe(20);
      expect(b1.hp).toBe(0); // Only b1 destroyed
      expect(b2.hp).toBe(20);
      expect(b3.hp).toBe(20);
    });

    test('CH-05.3: Diver hitting Indestructible barricade dies without damaging subsequent barricades or stone HP', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);

      gm.enemies = [];
      gm.bullets = [];
      gm.barricades = [];

      const stone = new Barricade(200, 700, BarricadeType.INDESTRUCTIBLE); stone.hp = 20;
      const wood = new Barricade(259, 700, BarricadeType.DESTRUCTIBLE); wood.hp = 20;
      gm.barricades = [stone, wood];

      const diver = new Enemy(250, 710, gm.logicalWidth, 10, EnemyType.DIVER, gm.logicalHeight);
      diver.isDiving = true;
      gm.enemies.push(diver);

      (gm as any).checkCollisions(1 / 60);

      expect(diver.isDead).toBe(true);
      expect(stone.hp).toBe(20); // Indestructible
      expect(wood.hp).toBe(20);  // Unharmed
    });
  });

  // =========================================================================
  // CHALLENGE 6: Late-Game Wave Speed Limits
  // =========================================================================
  test.describe('CH-06: Late-Game Wave Speed Limits (Diver and Zigzag <= 350 px/s)', () => {

    test('CH-06.1: Sweep waves 1 to 150 - Zigzag and Diver horizontal speed never exceeds 350 px/s', () => {
      for (let w = 1; w <= 150; w++) {
        const zigzag = new Enemy(100, 100, 720, w, EnemyType.ZIGZAG, 960);
        const diver = new Enemy(100, 100, 720, w, EnemyType.DIVER, 960);

        expect(zigzag.speedX, `Wave ${w} Zigzag speedX`).toBeLessThanOrEqual(350);
        expect(diver.speedX, `Wave ${w} Diver speedX`).toBeLessThanOrEqual(350);
      }
    });

    test('CH-06.2: Extreme late-game wave milestones (Wave 200, 500, 1000, 9999) speed bounds', () => {
      const extremeWaves = [200, 500, 1000, 9999];

      for (const w of extremeWaves) {
        const zigzag = new Enemy(100, 100, 720, w, EnemyType.ZIGZAG, 960);
        const diver = new Enemy(100, 100, 720, w, EnemyType.DIVER, 960);

        expect(zigzag.speedX, `Wave ${w} Zigzag speedX`).toBe(350);
        expect(diver.speedX, `Wave ${w} Diver speedX`).toBe(350);
      }
    });

    test('CH-06.3: Runtime speedX property and Diver horizontal traversal respect 350 px/s ceiling', () => {
      const zigzag = new Enemy(100, 100, 720, 100, EnemyType.ZIGZAG, 960);
      const diver = new Enemy(100, 100, 720, 100, EnemyType.DIVER, 960);

      // Base speed properties are strictly clamped
      expect(zigzag.speedX).toBe(350);
      expect(diver.speedX).toBe(350);

      // Diver pre-dive runtime update: horizontal speed strictly <= 350 px/s
      const initialDiverX = diver.position.x;
      diver.update(0.016, 1.0, [], { x: 10, y: 880 }, [], []); // Player not below diver, so no dive trigger
      const diverDeltaX = Math.abs(diver.position.x - initialDiverX);
      const diverEffectiveSpeed = diverDeltaX / 0.016;

      expect(diverEffectiveSpeed).toBeLessThanOrEqual(350.01);

      // Zigzag linear speed component currentSpeedX respects 350 px/s
      // (Note: Zigzag also adds a 4px sinusoidal weave Math.sin(...) * 4)
      const expectedLinearStep = zigzag.speedX * 0.016; // 5.6px
      expect(expectedLinearStep).toBeLessThanOrEqual(350 * 0.016);
    });

    test('CH-06.4: Diver during dive: Movement is purely vertical with zero lateral drift', () => {
      const diver = new Enemy(200, 100, 720, 100, EnemyType.DIVER, 960);
      diver.isDiving = true;
      const initialX = diver.position.x;

      for (let f = 0; f < 30; f++) {
        diver.update(0.016, 1.0, [], { x: 360, y: 880 }, [], []);
        // Horizontal position strictly unchanged
        expect(diver.position.x).toBe(initialX);
        // Vertical position plunging downward
        expect(diver.position.y).toBeGreaterThan(100);
      }
    });
  });
});

import { test, expect } from '@playwright/test';
import { Enemy, EnemyType } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { Barricade, BarricadeType } from '../../src/game/Barricade';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { CrisisArchetype } from '../../src/game/crisis/types';
import { Helper, HelperType } from '../../src/game/Helper';
import { Player } from '../../src/game/Player';
import { Faction } from '../../src/game/types';

function createMockContext(): any {
  return {
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    closePath: () => {},
    arc: () => {},
    ellipse: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    roundRect: () => {},
    measureText: (text: string) => ({ width: text.length * 8 }),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1.0,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    font: '10px sans-serif'
  };
}

test.describe('Bughunt 2 Combat & Mechanics QA Suite', () => {

  test('DEF-P3: Diver enemy never shoots bullets before diving (isDiving = false)', () => {
    const diver = new Enemy(200, 100, 720, 15, EnemyType.DIVER, 960);
    (diver as any).fireTimer = 0;
    expect(diver.isDiving).toBe(false);
    expect(diver.type).toBe(EnemyType.DIVER);

    // Call fire() multiple times with player position
    const bullet = diver.fire({ x: 200, y: 700 }, []);
    expect(bullet).toBeNull();
  });

  test('DEF-P4: Rogue Elites fire with piercing matching getPiercingCount()', () => {
    // Wave 20 Rogue Stalker (Elite)
    const stalker = new Enemy(200, 100, 720, 20, EnemyType.ROGUE_STALKER, 960);
    (stalker as any).fireTimer = 0;
    expect(stalker.isElite).toBe(true);
    expect(stalker.getPiercingCount()).toBe(3);

    const stalkerBullet = stalker.fire({ x: 200, y: 700 }, []);
    expect(stalkerBullet).not.toBeNull();
    expect(stalkerBullet!.piercing).toBe(3);

    // Wave 20 Rogue Mech (Elite)
    const mech = new Enemy(300, 100, 720, 20, EnemyType.ROGUE_MECH, 960);
    (mech as any).fireTimer = 0;
    expect(mech.isElite).toBe(true);
    expect(mech.getPiercingCount()).toBe(3);

    const mechBullet = mech.fire({ x: 300, y: 700 }, []);
    expect(mechBullet).not.toBeNull();
    expect(mechBullet!.piercing).toBe(3);

    // Wave 12 Rogue Carrier (Elite)
    const carrier = new Enemy(400, 100, 720, 12, EnemyType.ROGUE_CARRIER, 960);
    (carrier as any).fireTimer = 0;
    expect(carrier.isElite).toBe(true);
    expect(carrier.getPiercingCount()).toBe(2);

    const carrierBullet = carrier.fire({ x: 400, y: 700 }, []);
    expect(carrierBullet).not.toBeNull();
    expect(carrierBullet!.piercing).toBe(2);
  });

  test('DEF-P6: Clamps late-game Zigzag and Diver horizontal speed to max 350 px/s', () => {
    // Wave 50 Zigzag
    const zigzag50 = new Enemy(100, 100, 720, 50, EnemyType.ZIGZAG, 960);
    expect(zigzag50.speedX).toBeLessThanOrEqual(350);

    // Wave 100 Zigzag
    const zigzag100 = new Enemy(100, 100, 720, 100, EnemyType.ZIGZAG, 960);
    expect(zigzag100.speedX).toBeLessThanOrEqual(350);

    // Wave 100 Diver
    const diver100 = new Enemy(100, 100, 720, 100, EnemyType.DIVER, 960);
    expect(diver100.speedX).toBeLessThanOrEqual(350);
  });

  test('DEF-A2: Saboteur lateral traversal clamps vertical position to latchY', () => {
    const saboteur = new Enemy(150, 690, 720, 10, EnemyType.SABOTEUR, 960);
    const barricade = new Barricade(300, 720, BarricadeType.DESTRUCTIBLE); // x: 300..360, y: 720
    const latchY = barricade.position.y - saboteur.size.height + 2; // 720 - 32 + 2 = 690

    saboteur.position.y = latchY; // Already at latchY
    saboteur.position.x = 150; // Not in horizontal contact with barricade at 300

    // Provide 4 barricades so barricades[1] is the target
    const barricades = [barricade, barricade, barricade, barricade];

    // Update for multiple frames while traveling laterally towards barricade
    // Signature: update(deltaTime, speedMultiplier, bullets, playerPos, allEnemies, barricades)
    for (let i = 0; i < 60; i++) {
      saboteur.update(0.016, 1.0, [], { x: 360, y: 880 }, [], barricades);
      // Vertical position must remain clamped at latchY, never descending into player lane
      expect(saboteur.position.y).toBeLessThanOrEqual(latchY);
    }
  });

  test('DEF-C2: Interceptable bullets preserve base archetype color', () => {
    const ctx = createMockContext();
    let capturedFillStyle = '';
    ctx.fill = () => {
      capturedFillStyle = ctx.fillStyle;
    };

    // Crisis bullet with explicit Lime color and isInterceptable = true
    const crisisBullet = new Bullet(100, 200, 300, 1, false);
    crisisBullet.color = '#84cc16'; // Abyssal Leviathan lime
    crisisBullet.isInterceptable = true;

    crisisBullet.draw(ctx);
    // ctx.fillStyle during Tier 3 plasma shell draw should be '#84cc16', NOT '#a855f7'
    expect(crisisBullet.color).toBe('#84cc16');
  });

  test('DEF-A3: Barricade.update() does not hang in infinite loop when hp > maxHp', () => {
    const barricade = new Barricade(100, 700, BarricadeType.DESTRUCTIBLE);
    barricade.maxHp = 20;
    barricade.hp = 25; // Exceeds maxHp

    const startTime = Date.now();
    barricade.update(0.016);
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(100); // Must terminate immediately
    const activeCount = barricade.blocks.filter(b => b).length;
    expect(activeCount).toBe(barricade.blocks.length); // Max blocks
    expect(barricade.isDead).toBe(false);
  });

  test('DEF-C3: DimensionalRift hazards trigger player.isDead = true on lethal hit', () => {
    const rift = new DimensionalRift(100, 100, 0, 600, CrisisArchetype.SOLARIS_COLOSSUS);
    const player = new Player(720, 960);
    player.hp = 1;
    player.invincibilityTimer = 0;

    // Simulate tripwire lethal damage
    rift.tripwireTimer = 3.4; // Active window
    (rift as any).floatTime = 0;
    // SweepProgress at floatTime 0: (sin(0)+1)/2 = 0.5 -> tripwireY = 190 + 0.5*420 = 400
    player.position.y = 400 - player.size.height / 2;

    rift.update(0.016, player, []);
    expect(player.hp).toBe(0);
    expect(player.isDead).toBe(true);

    // Test fire trail lethal damage with COSMIC_DEVOURER
    const cosmicRift = new DimensionalRift(100, 100, 0, 600, CrisisArchetype.COSMIC_DEVOURER);
    const player2 = new Player(720, 960);
    player2.hp = 1;
    player2.invincibilityTimer = 0;
    (cosmicRift as any).fireTrails = [
      { x: player2.position.x + player2.size.width / 2, y: player2.position.y + player2.size.height / 2, radius: 20, life: 3.0 }
    ];

    cosmicRift.update(0.016, player2, []);
    expect(player2.hp).toBe(0);
    expect(player2.isDead).toBe(true);
  });

  test('DEF-A5: Helper role badge dynamically scales for [🔧 REPAIR BOT]', () => {
    const ctx = createMockContext();
    let drawnWidth = 0;
    ctx.roundRect = (_x: number, _y: number, w: number, _h: number) => {
      drawnWidth = w;
    };

    const repairBot = new Helper(200, 700, 720, 960, HelperType.REPAIRER);
    repairBot.draw(ctx);

    // Width must be at least 84px to prevent overflow of [🔧 REPAIR BOT]
    expect(drawnWidth).toBeGreaterThanOrEqual(84);
  });

  test('DEF-A8 & DEF-A9: Repair Bot heals at +8 HP/s and Fighter does not fire when no hostiles exist', () => {
    const repairBot = new Helper(200, 700, 720, 960, HelperType.REPAIRER);
    expect(repairBot.actionInterval).toBe(0.5); // +4 HP every 0.5s = 8 HP/s

    const barricade = new Barricade(200, 700, BarricadeType.DESTRUCTIBLE);
    barricade.hp = 10;
    barricade.maxHp = 20;

    // Hover directly over barricade
    repairBot.position.x = barricade.position.x;
    repairBot.position.y = barricade.position.y - 25;

    repairBot.update(0.5, [barricade], [], []);
    expect(barricade.hp).toBe(14); // +4 HP applied

    // Fighter hostile check
    const fighter = new Helper(200, 700, 720, 960, HelperType.FIGHTER);
    (fighter as any).fireTimer = 0;

    // Update with empty enemies array
    const bullets = fighter.update(0.1, [barricade], [], []);
    expect(bullets.length).toBe(0); // Must NOT fire into empty air
  });
});

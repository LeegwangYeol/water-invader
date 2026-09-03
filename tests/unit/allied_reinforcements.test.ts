import { test, expect } from '@playwright/test';
import { AlliedReinforcements } from '../../src/game/crisis/AlliedReinforcements';
import { Player } from '../../src/game/Player';
import { Enemy } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { CrisisArchetype, CrisisPhase } from '../../src/game/crisis/types';
import { GameManager } from '../../src/game/GameManager';
import { Faction, EnemyType, GameState } from '../../src/game/types';

/**
 * Creates a mock 2D canvas context for rendering assertions.
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
    measureText: () => ({ width: 100 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    setLineDash: () => {},
    getLineDash: () => [],
    shadowBlur: 0,
    shadowColor: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    textAlign: 'center',
    textBaseline: 'middle',
    font: '',
  };
  return ctx as CanvasRenderingContext2D;
}

/**
 * Creates a minimal mock HTMLCanvasElement for GameManager tests.
 */
function createMockCanvas(): HTMLCanvasElement {
  const canvas = {
    width: 600,
    height: 800,
    getContext: () => createMockCanvasContext(),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

test.describe('Massive Allied Reinforcements Suite (Aegis Vanguard Command Dreadnought)', () => {

  // =========================================================================
  // REINFORCE-01: INSTANTIATION & CANVAS 2D VECTOR RENDERING SANITY
  // =========================================================================
  test('REINFORCE-01: Instantiation and procedural Canvas 2D vector drawing sanity across lifecycles', () => {
    const allied = new AlliedReinforcements(600, 800);
    const ctx = createMockCanvasContext();
    const player = new Player(600, 800);

    // Initial properties
    expect(allied.isActive).toBe(true);
    expect(allied.isWarpingIn).toBe(true);
    expect(allied.isWarpingOut).toBe(false);
    expect(allied.isDismissed).toBe(false);
    expect(allied.warpTimer).toBe(2.0);
    expect(allied.size.width).toBe(220);
    expect(allied.size.height).toBe(100);
    expect(allied.escortFighters.length).toBe(2);
    expect(allied.hasActiveBanner()).toBe(true);
    expect(allied.bannerText.length).toBeGreaterThan(0);

    // 1. Draw during warp-in
    expect(() => allied.draw(ctx)).not.toThrow();
    expect(() => allied.drawPlayerNanoShield(ctx, player)).not.toThrow();
    expect(() => allied.drawUI(ctx, 600, 800)).not.toThrow();

    // 2. Complete warp-in
    allied.update(2.1, player, [], [], null);
    expect(allied.isWarpingIn).toBe(false);
    expect(() => allied.draw(ctx)).not.toThrow();
    expect(() => allied.drawPlayerNanoShield(ctx, player)).not.toThrow();

    // 3. Initiate warp-out
    allied.warpOut();
    expect(allied.isWarpingOut).toBe(true);
    expect(() => allied.draw(ctx)).not.toThrow();
  });

  // =========================================================================
  // REINFORCE-02: FORWARD HEAVY PLASMA CANNONS (TARGETING & DAMAGE SPECS)
  // =========================================================================
  test('REINFORCE-02: Forward heavy plasma cannons fire dual high-velocity bolts targeting Sovereign Core or nearest enemies', () => {
    const allied = new AlliedReinforcements(600, 800);
    const player = new Player(600, 800);
    // Finish warp-in
    allied.isWarpingIn = false;
    allied.warpTimer = 0;

    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    const core = crisis.sovereign!.getCoreCenter();

    // Fire heavy plasma cannons after interval (0.8s)
    const bullets = allied.update(0.85, player, [], [], crisis);
    const heavyCannons = bullets.filter(b => b.damage === 3 && b.piercing === 2);
    expect(heavyCannons.length).toBe(2);

    for (const b of heavyCannons) {
      expect(b.faction).toBe(Faction.PLAYER);
      expect(b.damage).toBe(3);
      expect(b.piercing).toBe(2);
      expect(b.isInterceptable).toBe(false);
      // Velocity directed towards upper screen core
      expect(b.velocity.y).toBeLessThan(0);
      expect(b.color === '#38bdf8' || b.color === '#fbbf24').toBe(true);
    }

    // Now test targeting nearest enemy when crisis is null
    const enemy = new Enemy(150, 200, EnemyType.NORMAL);
    enemy.isDead = false;
    const enemyBullets = allied.update(0.85, player, [enemy], [], null);
    const enemyHeavyCannons = enemyBullets.filter(b => b.damage === 3 && b.piercing === 2);
    expect(enemyHeavyCannons.length).toBe(2);
    for (const b of enemyHeavyCannons) {
      expect(b.faction).toBe(Faction.PLAYER);
      expect(b.velocity.y).toBeLessThan(0);
    }
  });

  // =========================================================================
  // REINFORCE-03: 120PX POINT-DEFENSE LASER GRID (BULLET INTERCEPTION)
  // =========================================================================
  test('REINFORCE-03: 120px point-defense laser grid vaporizes hostile bullets within perimeter of player and dreadnought', () => {
    const allied = new AlliedReinforcements(600, 800);
    const player = new Player(600, 800);
    player.position.x = 280;
    player.position.y = 700;

    const dreadCenterX = allied.position.x + allied.size.width / 2;
    const dreadCenterY = allied.position.y + allied.size.height / 2;
    const playerCenterX = player.position.x + player.size.width / 2;
    const playerCenterY = player.position.y + player.size.height / 2;

    // 1. Hostile bullet near Player (< 120px) -> Intercepted
    const hostileNearPlayer = new Bullet(playerCenterX + 30, playerCenterY - 40, 200, 1, false);
    hostileNearPlayer.faction = Faction.INVADER;

    // 2. Hostile bullet near Dreadnought (< 120px) -> Intercepted
    const hostileNearDread = new Bullet(dreadCenterX + 20, dreadCenterY + 30, 200, 1, false);
    hostileNearDread.faction = Faction.INVADER;

    // 3. Hostile bullet far away (> 250px) -> NOT Intercepted
    const hostileFar = new Bullet(50, 100, 200, 1, false);
    hostileFar.faction = Faction.INVADER;

    // 4. Player bullet near Player (< 120px) -> NOT Intercepted (Friendly Fire Immunity)
    const playerBullet = new Bullet(playerCenterX, playerCenterY - 20, -400, 1, true);
    playerBullet.faction = Faction.PLAYER;

    const bullets = [hostileNearPlayer, hostileNearDread, hostileFar, playerBullet];
    allied.update(0.016, player, [], bullets, null);

    expect(hostileNearPlayer.isDead).toBe(true);
    expect(hostileNearDread.isDead).toBe(true);
    expect(hostileFar.isDead).toBe(false);
    expect(playerBullet.isDead).toBe(false);

    // Point-defense laser beam effects recorded
    expect(allied.pdLaserBeams.length).toBeGreaterThanOrEqual(2);
    for (const beam of allied.pdLaserBeams) {
      expect(beam.color).toBe('#38bdf8');
      expect(beam.life).toBeGreaterThan(0);
    }
  });

  // =========================================================================
  // REINFORCE-04: RESTORATIVE NANO-SHIELD AURA (HEALING & STRESS RELIEF)
  // =========================================================================
  test('REINFORCE-04: Restorative nano-shield aura heals player HP by +1 every 5.0s and alleviates combat stress', () => {
    const allied = new AlliedReinforcements(600, 800);
    const player = new Player(600, 800);
    allied.isWarpingIn = false;

    player.hp = 1;
    player.maxHp = 3;
    player.stressLevel = 60;
    player.suppressionLevel = 50;

    // Advance 4.5s -> No healing yet
    allied.update(4.5, player, [], [], null);
    expect(player.hp).toBe(1);
    expect(player.stressLevel).toBe(60);

    // Advance 0.6s (total > 5.0s) -> Healing trigger
    allied.update(0.6, player, [], [], null);
    expect(player.hp).toBe(2);
    expect(player.stressLevel).toBe(35); // 60 - 25
    expect(player.suppressionLevel).toBe(25); // 50 - 25
    expect(allied.healPulseTimer).toBeGreaterThan(0);

    // Next 5.0s heals to max HP and clamps at maxHp
    allied.update(5.1, player, [], [], null);
    expect(player.hp).toBe(3);

    // Cannot exceed maxHp
    allied.update(5.1, player, [], [], null);
    expect(player.hp).toBe(3);
  });

  // =========================================================================
  // REINFORCE-05: ESCORT INTERCEPTORS FORMATION & SUPPRESSING FIRE
  // =========================================================================
  test('REINFORCE-05: 2 Escort interceptors track player in flanking formation and fire suppressing blasters', () => {
    const allied = new AlliedReinforcements(600, 800);
    const player = new Player(600, 800);
    allied.isWarpingIn = false;

    player.position.x = 200;
    player.position.y = 650;

    // Update over multiple frames to allow formation lerp
    for (let i = 0; i < 20; i++) {
      allied.update(0.05, player, [], [], null);
    }

    const [leftFighter, rightFighter] = allied.escortFighters;
    expect(leftFighter.side).toBe('left');
    expect(rightFighter.side).toBe('right');

    // Left fighter should be flanking to the left of player
    expect(leftFighter.x).toBeLessThan(player.position.x + player.size.width / 2);
    // Right fighter should be flanking to the right of player
    expect(rightFighter.x).toBeGreaterThan(player.position.x + player.size.width / 2);

    // Both fighters fire suppressing blaster bolts
    const shots = allied.update(0.7, player, [], [], null);
    const escortShots = shots.filter(b => b.color === '#06b6d4' && b.damage === 1);
    expect(escortShots.length).toBeGreaterThan(0);
    for (const s of escortShots) {
      expect(s.faction).toBe(Faction.PLAYER);
      expect(s.velocity.y).toBe(-420);
    }
  });

  // =========================================================================
  // REINFORCE-06: WARP-IN & WARP-OUT LIFECYCLE
  // =========================================================================
  test('REINFORCE-06: Warp-in entry descent and warp-out jump on crisis victory', () => {
    const allied = new AlliedReinforcements(600, 800);
    const player = new Player(600, 800);

    // Initial state: warping in
    expect(allied.isWarpingIn).toBe(true);
    expect(allied.warpTimer).toBe(2.0);

    // 1.0s elapsed: halfway through warp
    allied.update(1.0, player, [], [], null);
    expect(allied.isWarpingIn).toBe(true);
    expect(allied.warpTimer).toBeCloseTo(1.0, 1);

    // 2.1s total: warp-in completes
    allied.update(1.1, player, [], [], null);
    expect(allied.isWarpingIn).toBe(false);
    expect(allied.warpTimer).toBe(0);

    // Trigger warp-out departure
    allied.warpOut();
    expect(allied.isWarpingOut).toBe(true);

    // Ascends upwards off-screen
    for (let i = 0; i < 30; i++) {
      allied.update(0.1, player, [], [], null);
    }

    expect(allied.isActive).toBe(false);
    expect(allied.isDismissed).toBe(true);
  });

  // =========================================================================
  // REINFORCE-07: GAMEMANAGER INTEGRATION & AUTOMATIC SUMMON IN PHASE 2
  // =========================================================================
  test('REINFORCE-07: GameManager triggers Allied Reinforcements automatically when entering Phase 2 and orders warp-out on crisis defeat', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;

    // 1. Verify manual deterministic trigger hook
    const manualAllied = gm.triggerAlliedReinforcements();
    expect(manualAllied).toBeDefined();
    expect(gm.alliedReinforcements).toBe(manualAllied);
    expect(manualAllied.isActive).toBe(true);

    // 2. Test automatic trigger on Phase 2 transition
    gm.alliedReinforcements = undefined;
    gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
    expect(gm.endGameCrisis).not.toBeNull();
    expect(gm.endGameCrisis!.phase).toBe(CrisisPhase.INCURSION);
    expect(gm.alliedReinforcements).toBeUndefined();

    // Fast-forward past incursion into Phase 1
    gm.endGameCrisis!.update(3.2, gm.player, gm.bullets, gm.particles);
    expect(gm.endGameCrisis!.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
    expect(gm.alliedReinforcements).toBeUndefined();

    // Destroy Anchor 1
    gm.endGameCrisis!.riftAnchors[0].takeDamage(600);
    gm['update'](0.016);
    expect(gm.alliedReinforcements).toBeUndefined(); // Still in Phase 1

    // Destroy Anchor 2 -> Enters Phase 2 -> Triggers Allied Reinforcements!
    gm.endGameCrisis!.riftAnchors[1].takeDamage(600);
    gm['update'](0.016);
    expect(gm.endGameCrisis!.phase).toBe(CrisisPhase.PHASE_2_HULL);
    expect(gm.alliedReinforcements).toBeDefined();
    expect(gm.alliedReinforcements!.isActive).toBe(true);

    // 3. Defeat crisis -> Orders warp-out
    gm.endGameCrisis!.sovereign!.takeDamage(2500); // Deplete hull -> Phase 3
    gm['update'](0.016);
    expect(gm.endGameCrisis!.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(gm.alliedReinforcements!.isWarpingOut).toBe(false);

    gm.endGameCrisis!.sovereign!.takeDamage(1500); // Deplete core -> Defeated
    gm['update'](0.016);
    expect(gm.endGameCrisis === null || gm.endGameCrisis.isDefeated()).toBe(true);
    expect(gm.alliedReinforcements!.isWarpingOut).toBe(true);
  });
});

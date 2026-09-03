import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Player } from '../../src/game/Player';
import { Bullet } from '../../src/game/Bullet';
import { Enemy } from '../../src/game/Enemy';
import { Barricade, BarricadeType } from '../../src/game/Barricade';
import { AlliedReinforcements } from '../../src/game/crisis/AlliedReinforcements';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { CrisisArchetype, CrisisPhase } from '../../src/game/crisis/types';
import { EnemyType, GameState } from '../../src/game/types';

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

function createMockCanvas(width = 600, height = 800): HTMLCanvasElement {
  return {
    width,
    height,
    getContext: () => createMockCanvasContext(),
  } as unknown as HTMLCanvasElement;
}

test.describe('Remediation Verification & State Machine Edge-Cases Audit', () => {

  // =========================================================================
  // TRACK F: Game Lifecycle, Wave Transitions & State Cleansing
  // =========================================================================

  test('DEFECT-F1: Score is unconditionally reset to 0 in GameManager.init() on PLAY AGAIN', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    
    // Simulate active game with high score and currency
    gm.score = 15420;
    gm.currency = 850;
    gm.combo = 15;

    // Simulate PLAY AGAIN (keepUpgrades = true)
    gm.init(false, true);

    expect(gm.score).toBe(0); // REMEDIATION VERIFIED: score does not leak across runs!
    expect(gm.currency).toBe(850); // Upgrades/currency persisted
    expect(gm.combo).toBe(0);
  });

  test('DEFECT-F2: hasEndGameCrisisOccurred is unconditionally reset to false in GameManager.init()', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    // Crisis occurred in run 1
    gm.hasEndGameCrisisOccurred = true;

    // Play Again
    gm.init(false, true);
    expect(gm.hasEndGameCrisisOccurred).toBe(false); // REMEDIATION VERIFIED: can spawn in subsequent runs
  });

  test('DEFECT-F3: updateScoreUI is called immediately when player takes bullet damage to clear ghost combo', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.init(true);
    gm.state = GameState.PLAYING;

    let uiScoreUpdated = false;
    gm.onScoreChange = () => { uiScoreUpdated = true; };

    gm.combo = 12;
    const hostileBullet = new Bullet(gm.player.position.x + 5, gm.player.position.y + 5, 200, 1, false);
    gm.bullets.push(hostileBullet);

    (gm as any).update(1 / 60);

    expect(gm.combo).toBe(0);
    expect(uiScoreUpdated).toBe(true); // REMEDIATION VERIFIED: TopHUD is updated immediately
  });

  test('DEFECT-F4: Bullets, solar flares, and hazard projectiles are cleared on startNextWave()', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.init(true);

    // Add orphaned projectiles
    gm.bullets.push(new Bullet(100, 100, 200, 1, true));
    gm.bullets.push(new Bullet(200, 200, 200, 1, false));
    gm.solarFlares.push({
      x: 150,
      width: 40,
      chargeTimer: 1.0,
      chargeDuration: 2.0,
      activeTimer: 0,
      activeDuration: 1.0,
      damageDealt: false,
      isDead: false,
    });
    gm.hazardProjectiles.push({ x: 250, y: 250, radius: 8, speedY: 100, damage: 1 });

    gm.startNextWave();

    expect(gm.bullets.length).toBe(0); // REMEDIATION VERIFIED: projectiles cleared
    expect(gm.solarFlares.length).toBe(0);
    expect(gm.hazardProjectiles.length).toBe(0);
  });

  test('DEFECT-F6: Barricade collision check includes hazard radius', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.init(true);
    gm.state = GameState.PLAYING;

    const barricade = new Barricade(100, 200, BarricadeType.DESTRUCTIBLE);
    gm.barricades = [barricade];

    // Hazard projectile with radius 10 positioned at (92, 200)
    // Point (92) is outside barricade [100, 160], but 92 + radius(10) = 102 >= 100!
    gm.hazardProjectiles = [{ x: 92, y: 205, radius: 10, speedY: 0, damage: 1 }];

    const initialHp = barricade.hp;
    (gm as any).update(1 / 60);

    // With radius included, collision is detected and barricade takes damage
    expect(barricade.hp).toBeLessThan(initialHp);
    expect(gm.hazardProjectiles.length).toBe(0);
  });

  // =========================================================================
  // TRACK B: Allied Reinforcements
  // =========================================================================

  test('DEFECT-B1: Restorative Nano-Shield strictly ignores dead or 0-HP players', () => {
    const allied = new AlliedReinforcements(600, 800);
    allied.isWarpingIn = false;
    allied.warpTimer = 0;

    const deadPlayer = new Player(600, 800);
    deadPlayer.hp = 0;
    deadPlayer.isDead = true;

    // Fast-forward nano-shield cooldown
    (allied as any).healTimer = (allied as any).healInterval;
    allied.update(0.1, deadPlayer, [], [], null, []);

    // REMEDIATION VERIFIED: Dead player must not receive healing or resurrection!
    expect(deadPlayer.hp).toBe(0);
    expect(deadPlayer.isDead).toBe(true);
  });

  test('DEFECT-B2: GameManager dispatches onPlayerHpChange when Allied Reinforcements heals player', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.init(true);
    gm.state = GameState.PLAYING;

    let reportedHp = -1;
    gm.onPlayerHpChange = (hp) => { reportedHp = hp; };

    gm.player.hp = 2; // Damaged player
    gm.triggerAlliedReinforcements();
    gm.alliedReinforcements!.isWarpingIn = false;
    gm.alliedReinforcements!.warpTimer = 0;

    // Trigger nano-shield heal
    (gm.alliedReinforcements! as any).healTimer = (gm.alliedReinforcements! as any).healInterval;
    (gm as any).update(1 / 60);

    expect(gm.player.hp).toBe(3);
    expect(reportedHp).toBe(3); // REMEDIATION VERIFIED: UI dispatched on heal
  });

  test('DEFECT-B3: triggerAlliedReinforcements() is idempotent when active instance exists', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.init(true);

    const firstInstance = gm.triggerAlliedReinforcements();
    expect(firstInstance).toBeDefined();

    // Re-triggering must return existing instance without creating duplicate dreadnought
    const secondInstance = gm.triggerAlliedReinforcements();
    expect(secondInstance).toBe(firstInstance);
    expect(gm.alliedReinforcements).toBe(firstInstance);
  });

  test('DEFECT-B4: Escort fighter positions and movement targets are clamped to [10, logicalWidth - 30]', () => {
    const allied = new AlliedReinforcements(600, 800);
    allied.isWarpingIn = false;
    allied.warpTimer = 0;

    const player = new Player(600, 800);
    // Move player to extreme right
    player.position.x = 1000;
    allied.update(1.0, player, [], [], null, []);

    const fighters = (allied as any).escortFighters;
    for (const f of fighters) {
      expect(f.x).toBeLessThanOrEqual(600 - 30);
      expect(f.x).toBeGreaterThanOrEqual(10);
    }
  });

  // =========================================================================
  // TRACK A: End-Game Crisis State Machine & Archetype Super-Weapons
  // =========================================================================

  test('DEFECT-A1: Sovereign collision decrements bullet.piercing and prevents multi-hit damage', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);

    // Transition to Phase 2
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, new Player(600, 800), [], []);

    const sov = crisis.sovereign!;
    const bullet = new Bullet(sov.position.x + 50, sov.position.y + 50, -100, 100, true, 3);

    // Frame 1: Hit
    const hit1 = crisis.handleBulletCollision(bullet);
    expect(hit1).toBe(true);
    expect(bullet.piercing).toBe(2); // Decremented
    expect(sov.hullHp).toBe(2400);

    // Frame 2: Same bullet still inside hitbox
    const hit2 = crisis.handleBulletCollision(bullet);
    expect(hit2).toBe(false); // Ignored
    expect(sov.hullHp).toBe(2400); // No double damage
  });

  test('DEFECT-A2 & DEFECT-A6: Enraged Phase 3 accelerates attack cooldown to 0.7s and triggers archetype Phase 3 attacks', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    crisis.warningTimer = 0;
    
    // Advance out of INCURSION to PHASE_1_SHIELD
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    // Jump to Phase 3 Core
    crisis.sovereign!.phase = CrisisPhase.PHASE_3_CORE;
    crisis.sovereign!.hullHp = 0;
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

    // Enrage sovereign
    crisis.sovereign!.enrageTimer = 0;

    const bullets: Bullet[] = [];
    // Advance time by 0.75s (should trigger attack at interval 0.7s)
    crisis.update(0.75, new Player(600, 800), bullets, []);

    // Enraged VOID_NOVA fires 10 omnidirectional bolts
    expect(bullets.length).toBeGreaterThanOrEqual(10);
    expect(crisis.sovereign!.realityDistortionLevel).toBe(1.0);
  });

  test('DEFECT-A3: Phase 3 transition triggers regardless of starting phase when Sovereign reaches Phase 3', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.CHRONO_DEVOURER);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    // Force Sovereign to Phase 3 directly from Phase 1
    crisis.sovereign!.phase = CrisisPhase.PHASE_3_CORE;
    crisis.sovereign!.hullHp = 0;
    crisis.update(0.016, new Player(600, 800), [], []);

    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE); // REMEDIATION VERIFIED: cleanly synchronized
  });

  test('DEFECT-A4: Sovereign defeat marks all anchors as isDead = true', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.PSIONIC_SHROUD);
    crisis.warningTimer = 0;
    crisis.update(0.016, new Player(600, 800), [], []);

    // Sovereign dies while anchors intact
    crisis.sovereign!.hullHp = 0;
    crisis.sovereign!.coreHp = 0;
    crisis.sovereign!.isDead = true;

    crisis.update(0.016, new Player(600, 800), [], []);

    expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
    for (const anchor of crisis.riftAnchors) {
      expect(anchor.isDead).toBe(true); // REMEDIATION VERIFIED: no orphaned living colliders
    }
    expect(crisis.getActiveColliders().length).toBe(0);
  });

  test('DEFECT-A5: GameManager grants crisis defeat rewards even if isActive is false when phase is DEFEATED', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.init(true);
    gm.state = GameState.PLAYING;

    gm.triggerEndGameCrisis();
    gm.endGameCrisis!.warningTimer = 0;
    gm.endGameCrisis!.update(0.016, gm.player, [], []); // INCURSION -> PHASE_1_SHIELD

    // Simulate Sovereign defeat
    gm.endGameCrisis!.sovereign!.hullHp = 0;
    gm.endGameCrisis!.sovereign!.coreHp = 0;
    gm.endGameCrisis!.sovereign!.isDead = true;
    gm.endGameCrisis!.update(0.016, gm.player, [], []);

    expect(gm.endGameCrisis!.phase).toBe(CrisisPhase.DEFEATED);
    expect(gm.endGameCrisis!.isActive).toBe(false);

    const prevScore = gm.score;
    const prevCurrency = gm.currency;
    const prevCombo = gm.combo;

    // Run game update loop
    (gm as any).update(1 / 60);

    // REMEDIATION VERIFIED: victory rewards (+2000 score, +500 currency, +10 combo) granted!
    expect(gm.score).toBe(prevScore + 2000);
    expect(gm.currency).toBe(prevCurrency + 500);
    expect(gm.combo).toBe(prevCombo + 10);
  });

  // =========================================================================
  // TRACK C: Physics, CCD & Canvas Coordinate Sanitization
  // =========================================================================

  test('DEFECT-C1: Continuous Collision Detection (CCD) prevents bullet tunneling at 10,000 px/s under frame lag', () => {
    const player = new Player(600, 800);
    player.position = { x: 280, y: 700 };
    player.size = { width: 40, height: 40 };

    // Bullet at y=600 moving down at 10,000 px/s with frame lag dt=0.05s (500px step!)
    // Start position: y=600. End position: y=1100.
    // Instantaneous AABB at y=1100 does NOT collide with player at y=700.
    // But swept AABB [600, 1100] captures the player!
    const bullet = new Bullet(290, 600, 10000, 1, false);
    bullet.update(0.05);

    expect(bullet.position.y).toBe(1100);
    expect(bullet.checkCollision(player)).toBe(true); // REMEDIATION VERIFIED: CCD detects swept collision!
    expect(player.checkCollision(bullet)).toBe(true); // Bidirectional check also succeeds
  });

  test('DEFECT-C2: Player Y is clamped to [0, canvasHeight - height] and NaN coordinates are sanitized', () => {
    const player = new Player(600, 800);
    const ctx = createMockCanvasContext();

    // 1. Extreme bottom placement
    player.position.y = 9999;
    player.update(0.016);
    expect(player.position.y).toBe(800 - player.size.height); // Clamped

    // 2. Extreme negative placement
    player.position.y = -500;
    player.update(0.016);
    expect(player.position.y).toBe(0); // Clamped

    // 3. NaN placement
    player.position.x = NaN;
    player.position.y = NaN;
    player.update(0.016);
    expect(Number.isFinite(player.position.x)).toBe(true);
    expect(Number.isFinite(player.position.y)).toBe(true);
    expect(() => player.draw(ctx)).not.toThrow(); // Does not crash canvas
  });

  test('DEFECT-C3: Enemy raycast center is aligned to true bullet center (spawnX + 5) and ship center', () => {
    const enemy = new Enemy(100, 100, 600, 1, EnemyType.ROGUE_MECH, 800);
    const bulletWidth = 10;
    const spawnX = enemy.position.x + enemy.size.width / 2 - 5;
    const originX = spawnX + 5;
    const shipCenterX = enemy.position.x + enemy.size.width / 2;

    // Assert that originX strictly matches ship center
    expect(originX).toBe(shipCenterX);

    // Verify the bullet rectangle [spawnX, spawnX + 10] is symmetrically centered on the ship [enemy.position.x, enemy.position.x + enemy.size.width]
    const leftMargin = spawnX - enemy.position.x;
    const rightMargin = (enemy.position.x + enemy.size.width) - (spawnX + bulletWidth);
    expect(leftMargin).toBe(rightMargin);
    expect(spawnX + bulletWidth / 2).toBe(shipCenterX);

    // Verify fired bullet instance has identical centered coordinates
    (enemy as any).fireTimer = 0;
    const bullet = enemy.fire(undefined, []);
    expect(bullet).not.toBeNull();
    if (bullet) {
      expect(bullet.position.x).toBe(spawnX);
      expect(bullet.size.width).toBe(bulletWidth);
      expect(bullet.position.x + bullet.size.width / 2).toBe(shipCenterX);
    }
  });
});

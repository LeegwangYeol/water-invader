import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import {
  CrisisArchetype,
  CrisisPhase,
  EndGameCrisisState,
  EnemyType,
  Faction,
  GameState,
} from '../../src/game/types';
import { Bullet } from '../../src/game/Bullet';
import { Player } from '../../src/game/Player';
import { soundManager } from '../../src/game/SoundManager';

// Mock Canvas for Headless Unit Testing
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
    }),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

test.describe('Milestone 2: End-Game Crisis Incursion Engine & GameManager Integration', () => {

  test('M2-1: GameManager initializes endGameCrisis as null and has triggerEndGameCrisis method', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    expect(gm.endGameCrisis).toBeNull();
    expect(gm.hasEndGameCrisisOccurred).toBe(false);
    expect(typeof gm.triggerEndGameCrisis).toBe('function');
  });

  test('M2-2: triggerEndGameCrisis initializes EndGameCrisis, starts incursion, and clears regular enemies', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    // Put some standard enemies on the battlefield
    gm.spawnDynamicReinforcement('FLANK');
    expect(gm.enemies.length).toBeGreaterThan(0);

    let reportedState: EndGameCrisisState | null = null;
    gm.onEndGameCrisisEvent = (state) => {
      reportedState = state;
    };

    const crisis = gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);

    expect(gm.endGameCrisis).toBe(crisis);
    expect(gm.hasEndGameCrisisOccurred).toBe(true);
    expect(gm.enemies.length).toBe(0); // Regular enemies cleared for crisis
    expect(crisis.isActive).toBe(true);
    expect(crisis.phase).toBe(CrisisPhase.INCURSION);
    expect(crisis.archetype).toBe(CrisisArchetype.VOID_SOVEREIGN);
    expect(crisis.warningTimer).toBe(3.0);
    expect(reportedState).not.toBeNull();
    expect((reportedState as EndGameCrisisState | null)?.phase).toBe(CrisisPhase.INCURSION);
  });

  test('M2-3: spawnWave prioritizes Boss waves on multiples of 5 (Stage 15, 20) and triggers Crisis on non-boss stages (Stage 16, 17, 18)', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;

    // 1. Stage 14 (non-boss wave, below stage 15) -> No crisis, standard grid spawns
    gm.level = 14;
    gm.hasEndGameCrisisOccurred = false;
    gm.endGameCrisis = null;
    gm.enemies = [];
    gm['spawnWave']();
    expect(gm.endGameCrisis).toBeNull();
    expect(gm.enemies.length).toBeGreaterThan(0);
    expect(gm.enemies.some(e => e.type === EnemyType.BOSS)).toBe(false);

    // 2. Stage 15 (Boss wave on multiple of 5) -> Boss + Escorts spawn, Crisis does NOT trigger
    gm.level = 15;
    gm.hasEndGameCrisisOccurred = false;
    gm.endGameCrisis = null;
    gm.enemies = [];
    gm['spawnWave']();
    expect(gm.endGameCrisis).toBeNull();
    expect(gm.enemies.some(e => e.type === EnemyType.BOSS)).toBe(true);
    expect(gm.enemies.length).toBeGreaterThan(1); // 1 Boss + escorts

    // 3. Stage 16 (non-boss stage 15+): Random roll failure (Math.random >= 0.30) -> No crisis, standard enemies spawn
    gm.level = 16;
    gm.hasEndGameCrisisOccurred = false;
    gm.endGameCrisis = null;
    gm.enemies = [];
    const origRandom = Math.random;
    try {
      Math.random = () => 0.75; // >= 0.30 -> roll fails
      gm['spawnWave']();
      expect(gm.endGameCrisis).toBeNull();
      expect(gm.enemies.length).toBeGreaterThan(0);
      expect(gm.hasEndGameCrisisOccurred).toBe(false);

      // 4. Stage 17 (non-boss stage 15+): Random roll success (Math.random < 0.30) -> Triggers Crisis
      gm.level = 17;
      gm.hasEndGameCrisisOccurred = false;
      gm.endGameCrisis = null;
      gm.enemies = [];
      Math.random = () => 0.15; // < 0.30 -> roll succeeds
      gm['spawnWave']();
      expect(gm.endGameCrisis).not.toBeNull();
      expect(gm.endGameCrisis!.isActive).toBe(true);
      expect(gm.hasEndGameCrisisOccurred).toBe(true);
      expect(gm.enemies.length).toBeGreaterThan(0); // Standard enemies generated alongside crisis incursion
    } finally {
      Math.random = origRandom;
    }

    // 5. Stage 18 (non-boss stage, pity threshold >= 18) -> Guaranteed Crisis trigger even if Math.random() is 0.99
    gm.level = 18;
    gm.hasEndGameCrisisOccurred = false;
    gm.endGameCrisis = null;
    gm.enemies = [];
    try {
      Math.random = () => 0.99; // Would fail random roll, but pity triggers
      gm['spawnWave']();
      expect(gm.endGameCrisis).not.toBeNull();
      expect(gm.endGameCrisis!.isActive).toBe(true);
      expect(gm.hasEndGameCrisisOccurred).toBe(true);
    } finally {
      Math.random = origRandom;
    }

    // 6. Stage 20 (Boss wave on multiple of 5) -> Boss wave takes precedence over pity trigger!
    gm.level = 20;
    gm.hasEndGameCrisisOccurred = false;
    gm.endGameCrisis = null;
    gm.enemies = [];
    gm['spawnWave']();
    expect(gm.endGameCrisis).toBeNull();
    expect(gm.enemies.filter(e => e.type === EnemyType.BOSS).length).toBe(1);
    expect(gm.enemies.length).toBe(9); // 1 Boss + 8 Escorts
  });

  test('M2-4: Reality-bending vortex pulls player and curves player bullets towards rift singularity', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
    const crisis = gm.endGameCrisis!;

    // Advance past incursion warning (3.0s) -> Phase 1 (Shield active)
    gm['update'](3.1);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    // Place player near left rift (Rift 0 is at x=50, y=170, center=(90, 210))
    gm.player.position.x = 130;
    gm.player.position.y = 210;
    const initialPlayerX = gm.player.position.x;

    // Fire player bullet to the right of left rift center (e.g. x=120)
    const pBullet = new Bullet(120, 210, -500, 10, true);
    pBullet.faction = Faction.PLAYER;
    gm.bullets = [pBullet];

    // Update with delta time
    gm['update'](0.1);

    // Player should be pulled to the left towards rift center (90)
    expect(gm.player.position.x).toBeLessThan(initialPlayerX);

    // Player bullet should be bent to the left towards rift center (90)
    expect(pBullet.position.x).toBeLessThan(120);
  });

  test('M2-5: Collision detection: Phase 1 sovereign invulnerability and rift destruction', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
    const crisis = gm.endGameCrisis!;
    gm['update'](3.1); // Advance to Phase 1

    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    const rifts = crisis.getRifts();
    const mainBody = crisis.getMainBody();
    expect(rifts.length).toBe(2);
    expect(mainBody).not.toBeNull();

    // 1. Direct hit on Sovereign in Phase 1 -> 0 damage, deflected
    const sovPos = mainBody!.position;
    const sovBullet = new Bullet(sovPos.x + 50, sovPos.y + 50, -500, 500, true);
    sovBullet.faction = Faction.PLAYER;
    gm.bullets = [sovBullet];

    const initialScore = gm.score;
    gm['update'](1 / 60);

    expect(sovBullet.isDead).toBe(true);
    expect(mainBody!.hullHp).toBe(2500); // 100% immune
    expect(gm.score).toBe(initialScore);

    // 2. Direct hit on Rift 0 -> takes damage and awards score
    const rift0 = rifts[0];
    const riftBullet = new Bullet(rift0.position.x + 20, rift0.position.y + 20, -500, 600, true);
    riftBullet.faction = Faction.PLAYER;
    gm.bullets = [riftBullet];

    gm['update'](1 / 60);
    expect(rift0.hp).toBe(0);
    expect(rift0.isDead).toBe(true);
    expect(gm.score).toBeGreaterThan(initialScore);

    // Sovereign is STILL immune because Rift 1 is still alive
    const sovBullet2 = new Bullet(sovPos.x + 50, sovPos.y + 50, -500, 500, true);
    sovBullet2.faction = Faction.PLAYER;
    gm.bullets = [sovBullet2];
    gm['update'](1 / 60);
    expect(mainBody!.hullHp).toBe(2500);

    // Destroy Rift 1 -> Transitions to Phase 2
    const rift1 = rifts[1];
    const rift1Bullet = new Bullet(rift1.position.x + 20, rift1.position.y + 20, -500, 600, true);
    rift1Bullet.faction = Faction.PLAYER;
    gm.bullets = [rift1Bullet];
    gm['update'](1 / 60);
    expect(rift1.isDead).toBe(true);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    // In Phase 2, Sovereign takes direct damage
    const sovBullet3 = new Bullet(sovPos.x + 50, sovPos.y + 50, -500, 1000, true);
    sovBullet3.faction = Faction.PLAYER;
    gm.bullets = [sovBullet3];
    gm['update'](1 / 60);
    expect(mainBody!.hullHp).toBe(1500);
  });

  test('M2-6: Wave Clear Safety: Game does NOT transition to SHOP while crisis is alive', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
    const crisis = gm.endGameCrisis!;
    expect(crisis.isActive).toBe(true);

    // Standard enemies count is 0
    expect(gm.enemies.length).toBe(0);

    // Advance multiple frames - game MUST remain in GameState.PLAYING because crisis is active
    for (let i = 0; i < 30; i++) {
      gm['update'](1 / 60);
    }
    expect(gm.state).toBe(GameState.PLAYING);
    expect(crisis.isCrisisActive()).toBe(true);
  });

  test('M2-7: Cataclysm Defeat resolution: Awards massive victory bonus (+2000 score, +500 currency) and transitions to SHOP', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;
    gm.score = 500;
    gm.currency = 100;

    gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
    const crisis = gm.endGameCrisis!;
    gm['update'](3.1); // Advance to Phase 1

    // Destroy Rifts (Phase 1 -> Phase 2)
    crisis.riftAnchors[0].takeDamage(600);
    crisis.riftAnchors[1].takeDamage(600);
    gm['update'](1 / 60);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    // Destroy Hull (Phase 2 -> Phase 3)
    crisis.sovereign!.takeDamage(2500);
    gm['update'](1 / 60);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

    // Destroy Core (Phase 3 -> DEFEATED)
    crisis.sovereign!.takeDamage(1500);
    expect(crisis.sovereign!.hp).toBe(0);

    // Update triggers defeat transition, bonus award, and SHOP state
    gm['update'](1 / 60);
    expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
    expect(crisis.isDefeated()).toBe(true);
    expect(gm.score).toBeGreaterThanOrEqual(2500); // 500 + 2000 bonus
    expect(gm.currency).toBeGreaterThanOrEqual(600); // 100 + 500 bonus
    expect(gm.state).toBe(GameState.SHOP);
  });

  test('M2-8: GameManager.draw invokes EndGameCrisis.draw and renders with 0 errors', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    gm.triggerEndGameCrisis(CrisisArchetype.CYBERNETIC_EXTERMINATOR);

    // Draw in incursion warning phase
    expect(() => gm['draw']()).not.toThrow();

    // Advance to Phase 1
    gm['update'](3.1);
    expect(() => gm['draw']()).not.toThrow();

    // Advance to Phase 2
    gm.endGameCrisis!.riftAnchors.forEach(r => r.takeDamage(600));
    gm['update'](1 / 60);
    expect(() => gm['draw']()).not.toThrow();

    // Advance to Phase 3
    gm.endGameCrisis!.sovereign!.takeDamage(2500);
    gm['update'](1 / 60);
    expect(() => gm['draw']()).not.toThrow();
  });
});

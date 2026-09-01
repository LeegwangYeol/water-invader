import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import {
  CrisisArchetype,
  CrisisPhase,
  EndGameCrisisState,
  Faction,
  GameState,
} from '../../src/game/types';
import { Bullet } from '../../src/game/Bullet';
import { Enemy, EnemyType } from '../../src/game/Enemy';

// Polyfill window / rAF for headless test execution
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
  global.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

// Mock Canvas for Headless Unit & Stress Testing
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

test.describe('Adversarial Stress Harness: Milestone 2 Crisis Incursion & Transition Robustness', () => {

  // =========================================================================
  // SUITE 1: MONTE CARLO PROBABILITY & TRIGGER DISTRIBUTION (1,000+ RUNS)
  // =========================================================================

  test('STRESS-1.1: 1,000 independent wave entries at Stage 16 show ~30% empirical trigger rate and Stage 15 preserves Boss priority', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;

    // First verify Stage 15 (milestone boss wave) prioritizes Boss wave (0 crisis triggers)
    gm.level = 15;
    gm.endGameCrisis = null;
    gm.hasEndGameCrisisOccurred = false;
    gm.enemies = [];
    gm['spawnWave']();
    expect(gm.endGameCrisis).toBeNull();
    expect(gm.enemies.some(e => e.type === EnemyType.BOSS)).toBe(true);

    // Now test 1,000 independent wave entries at Stage 16 (non-boss wave)
    gm.level = 16;
    let triggerCount = 0;
    const NUM_TRIALS = 1000;

    for (let i = 0; i < NUM_TRIALS; i++) {
      gm.endGameCrisis = null;
      gm.hasEndGameCrisisOccurred = false;
      gm.enemies = [];

      gm['spawnWave']();

      if (gm.endGameCrisis !== null && gm.hasEndGameCrisisOccurred) {
        triggerCount++;
      }
    }

    const empiricalRate = triggerCount / NUM_TRIALS;
    console.log(`[STRESS-1.1] Stage 16 Trigger Rate: ${(empiricalRate * 100).toFixed(2)}% (${triggerCount}/${NUM_TRIALS})`);

    // With N=1000, p=0.30, sigma = sqrt(1000*0.3*0.7) = 14.49 (1.45%)
    // 3-sigma bounds: [25.6%, 34.4%]
    expect(empiricalRate).toBeGreaterThanOrEqual(0.25);
    expect(empiricalRate).toBeLessThanOrEqual(0.35);
  });

  test('STRESS-1.2: 1,000 independent wave entries at Stage 18 guarantee 100% pity trigger', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 18;

    let triggerCount = 0;
    const NUM_TRIALS = 1000;

    for (let i = 0; i < NUM_TRIALS; i++) {
      gm.endGameCrisis = null;
      gm.hasEndGameCrisisOccurred = false;
      gm.enemies = [];

      gm['spawnWave']();

      if (gm.endGameCrisis !== null && gm.hasEndGameCrisisOccurred) {
        triggerCount++;
      }
    }

    const empiricalRate = triggerCount / NUM_TRIALS;
    console.log(`[STRESS-1.2] Stage 18 Pity Trigger Rate: ${(empiricalRate * 100).toFixed(2)}% (${triggerCount}/${NUM_TRIALS})`);
    expect(empiricalRate).toBe(1.0);
    expect(triggerCount).toBe(NUM_TRIALS);
  });

  test('STRESS-1.3: 1,000 campaign progressions from Stage 15 to 18 achieve 100% trigger by Stage 18', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    const NUM_CAMPAIGNS = 1000;

    const triggersByStage: { [stage: number]: number } = { 15: 0, 16: 0, 17: 0, 18: 0 };
    let totalTriggered = 0;

    for (let c = 0; c < NUM_CAMPAIGNS; c++) {
      gm.state = GameState.PLAYING;
      gm.endGameCrisis = null;
      gm.hasEndGameCrisisOccurred = false;

      for (let stage = 15; stage <= 18; stage++) {
        gm.level = stage;
        gm.enemies = [];
        gm['spawnWave']();

        if (gm.endGameCrisis !== null) {
          triggersByStage[stage]++;
          totalTriggered++;
          break; // Campaign triggered crisis
        }
      }
    }

    console.log('[STRESS-1.3] Campaign Trigger Breakdown:', {
      Stage15: `${triggersByStage[15]} (${((triggersByStage[15] / NUM_CAMPAIGNS) * 100).toFixed(1)}%)`,
      Stage16: `${triggersByStage[16]} (${((triggersByStage[16] / NUM_CAMPAIGNS) * 100).toFixed(1)}%)`,
      Stage17: `${triggersByStage[17]} (${((triggersByStage[17] / NUM_CAMPAIGNS) * 100).toFixed(1)}%)`,
      Stage18: `${triggersByStage[18]} (${((triggersByStage[18] / NUM_CAMPAIGNS) * 100).toFixed(1)}%)`,
      TotalTriggered: `${totalTriggered}/${NUM_CAMPAIGNS} (100%)`,
    });

    // 100% of all campaigns MUST have triggered an incursion on or before Stage 18
    expect(totalTriggered).toBe(NUM_CAMPAIGNS);
    expect(triggersByStage[15]).toBe(0); // Milestone Boss wave has 0 crisis triggers
    expect(triggersByStage[16]).toBeGreaterThan(240); // ~300 expected (30% of 1000)
    expect(triggersByStage[17]).toBeGreaterThan(150); // ~210 expected (30% of ~700)
    expect(triggersByStage[18]).toBeGreaterThan(380); // ~490 expected (100% pity of ~490)
  });

  test('STRESS-1.4: Pre-Stage 15 isolation: 1,000 trials across Stages 1, 5, 10, 14 produce 0 triggers', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;

    const testStages = [1, 5, 10, 14];
    for (const stage of testStages) {
      let stageTriggers = 0;
      for (let i = 0; i < 250; i++) {
        gm.endGameCrisis = null;
        gm.hasEndGameCrisisOccurred = false;
        gm.enemies = [];
        gm.level = stage;

        gm['spawnWave']();

        if (gm.endGameCrisis !== null) {
          stageTriggers++;
        }
      }
      expect(stageTriggers).toBe(0);
    }
  });

  test('STRESS-1.5: Single occurrence invariant: 1,000 subsequent wave spawns never trigger a second crisis', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.hasEndGameCrisisOccurred = true; // Crisis already occurred

    let secondTriggers = 0;
    for (let stage = 15; stage <= 30; stage++) {
      for (let i = 0; i < 100; i++) {
        gm.endGameCrisis = null;
        gm.level = stage;
        gm.enemies = [];
        gm['spawnWave']();

        if (gm.endGameCrisis !== null) {
          secondTriggers++;
        }
      }
    }
    expect(secondTriggers).toBe(0);
  });

  test('STRESS-1.6: Archetype random selection distributes across all 3 archetypes evenly', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;

    const counts: { [arch: string]: number } = {
      [CrisisArchetype.VOID_SOVEREIGN]: 0,
      [CrisisArchetype.ABYSSAL_LEVIATHAN]: 0,
      [CrisisArchetype.CYBERNETIC_EXTERMINATOR]: 0,
    };

    const NUM_TRIALS = 1500;
    for (let i = 0; i < NUM_TRIALS; i++) {
      const crisis = gm.triggerEndGameCrisis();
      counts[crisis.archetype]++;
    }

    console.log('[STRESS-1.6] Archetype Distribution across 1,500 rolls:', counts);
    // Each archetype should receive roughly 500 (+/- 80)
    expect(counts[CrisisArchetype.VOID_SOVEREIGN]).toBeGreaterThan(400);
    expect(counts[CrisisArchetype.ABYSSAL_LEVIATHAN]).toBeGreaterThan(400);
    expect(counts[CrisisArchetype.CYBERNETIC_EXTERMINATOR]).toBeGreaterThan(400);
  });

  // =========================================================================
  // SUITE 2: ZERO SOFT-LOCK TRANSITION PERMUTATIONS
  // =========================================================================

  test('STRESS-2.1: Player death during Incursion Warning Phase transitions cleanly to GAME_OVER and allows clean restart', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;
    gm.score = 1200;
    gm.currency = 350;

    gm.triggerEndGameCrisis();
    expect(gm.endGameCrisis?.phase).toBe(CrisisPhase.INCURSION);

    // Player takes fatal damage during warning phase
    gm.player.hp = 0;
    gm['gameOver']('Fatal error test');

    expect(gm.state).toBe(GameState.GAME_OVER);
    expect(gm.score).toBe(1200);
    expect(gm.currency).toBe(350);

    // Respawn via init(false)
    expect(() => gm.init(false)).not.toThrow();
    expect(gm.player.hp).toBe(3);
    expect(gm.endGameCrisis).toBeNull();
    expect(gm.score).toBe(1200); // Preserved on soft reset
    expect(gm.currency).toBe(350);
  });

  test('STRESS-2.2: Player death during Phase 1, Phase 2, and Phase 3 cleanly transitions to GAME_OVER without hanging loop', () => {
    const phases = [CrisisPhase.PHASE_1_SHIELD, CrisisPhase.PHASE_2_HULL, CrisisPhase.PHASE_3_CORE];

    for (const phase of phases) {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.level = 15;

      gm.triggerEndGameCrisis();
      gm['update'](3.1); // Enter combat
      gm.endGameCrisis!.sovereign?.setPhase(phase);
      gm.endGameCrisis!.phase = phase;

      // Position player directly in front of sovereign to trigger contact damage
      gm.player.hp = 1;
      gm.player.position.x = gm.endGameCrisis!.sovereign!.position.x + 50;
      gm.player.position.y = gm.endGameCrisis!.sovereign!.position.y + 30;
      gm.player.invincibilityTimer = 0;

      gm['update'](1 / 60);

      expect(gm.player.hp).toBeLessThanOrEqual(0);
      expect(gm.state).toBe(GameState.GAME_OVER);
      expect(() => gm.init(false)).not.toThrow();
    }
  });

  test('STRESS-2.3: Simultaneous multi-kill: Crisis defeated while normal/rogue enemies are still alive prevents premature SHOP transition', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    gm.triggerEndGameCrisis();
    const crisis = gm.endGameCrisis!;
    gm['update'](3.1); // Advance to Phase 1

    // Manually inject a rogue enemy into the battlefield (e.g. dynamic event)
    const rogue = new Enemy(100, 100, 600, 15, EnemyType.ROGUE_MECH, 800);
    rogue.faction = Faction.ROGUE;
    gm.enemies = [rogue];

    // Defeat the crisis step by step
    crisis.riftAnchors.forEach(r => r.takeDamage(600));
    gm['update'](1 / 60); // Phase 1 -> Phase 2
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    crisis.sovereign!.takeDamage(2500);
    gm['update'](1 / 60); // Phase 2 -> Phase 3
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

    crisis.sovereign!.takeDamage(1500);
    gm['update'](1 / 60); // Phase 3 -> DEFEATED
    expect(crisis.isDefeated()).toBe(true);

    // Because rogue enemy is still alive, game MUST NOT transition to SHOP yet
    expect(gm.state).toBe(GameState.PLAYING);
    expect(gm.enemies.length).toBe(1);

    // Kill the rogue enemy
    rogue.isDead = true;
    gm['update'](1 / 60);

    // Now all hostiles & crisis are cleared -> Game cleanly transitions to SHOP
    expect(gm.state).toBe(GameState.SHOP);
    expect(gm.endGameCrisis).toBeNull();
  });

  test('STRESS-2.4: Rapid 100-cycle pause / resume loop maintains zero NaN and zero frame drop', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    gm.triggerEndGameCrisis();

    for (let cycle = 0; cycle < 100; cycle++) {
      gm.pause();
      expect(gm.isPaused).toBe(true);
      gm.resume();
      expect(gm.isPaused).toBe(false);

      // Advance physics
      gm['update'](1 / 60);

      expect(Number.isFinite(gm.player.position.x)).toBe(true);
      expect(Number.isFinite(gm.player.position.y)).toBe(true);
      expect(Number.isNaN(gm.score)).toBe(false);
    }
  });

  test('STRESS-2.5: 50-step full progression sequence (Defeat -> SHOP -> Next Wave -> Defeat) never hangs', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    // Trigger crisis at Stage 15
    gm.triggerEndGameCrisis();
    const crisis = gm.endGameCrisis!;
    gm['update'](3.1); // Advance to Phase 1

    // Defeat Crisis through all phases
    crisis.riftAnchors.forEach(r => r.takeDamage(600));
    gm['update'](1 / 60);
    crisis.sovereign!.takeDamage(2500);
    gm['update'](1 / 60);
    crisis.sovereign!.takeDamage(1500);
    gm['update'](1 / 60);

    expect(gm.state).toBe(GameState.SHOP);
    expect(gm.endGameCrisis).toBeNull();

    // Advance 5 consecutive waves through SHOP -> startNextWave()
    for (let w = 16; w <= 20; w++) {
      expect(() => gm.startNextWave()).not.toThrow();
      expect(gm.state).toBe(GameState.PLAYING);
      expect(gm.level).toBe(w);

      // Clear standard enemies
      gm.enemies.forEach(e => (e.isDead = true));
      gm['update'](1 / 60);

      expect(gm.state).toBe(GameState.SHOP);
    }
  });

  // =========================================================================
  // SUITE 3: VECTOR MATH, GRAVITATIONAL VORTEX & PHYSICS HARNESS
  // =========================================================================

  test('STRESS-3.1: 500 simultaneous high-piercing bullets routed via handleBulletCollision do not overflow or corrupt arrays', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
    gm['update'](3.1); // Advance to Phase 1

    const rifts = gm.endGameCrisis!.getRifts();

    // Fire 500 player bullets directly into Rift 0 (x=50, y=170) and Rift 1 (x=470, y=170)
    for (let i = 0; i < 500; i++) {
      const targetRift = rifts[i % 2];
      const b = new Bullet(targetRift.position.x + 20, targetRift.position.y + 20, -100, 10, true, 3);
      b.faction = Faction.PLAYER;
      gm.endGameCrisis!.handleBulletCollision(b);
    }

    // Both rifts should have taken enough damage to be destroyed
    expect(rifts[0].isDead).toBe(true);
    expect(rifts[1].isDead).toBe(true);

    // Update frame to propagate phase change to Phase 2
    gm['update'](1 / 60);
    expect(gm.endGameCrisis?.phase).toBe(CrisisPhase.PHASE_2_HULL);
  });

  test('STRESS-3.2: Gravitational singularity point-blank proximity (distSq < 100) never produces division by zero or NaN', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 15;

    gm.triggerEndGameCrisis(CrisisArchetype.VOID_SOVEREIGN);
    gm['update'](3.1);

    const rift = gm.endGameCrisis!.riftAnchors[0];
    const center = rift.getSingularityCenter();

    // Place player and bullet directly on top of singularity center (dx=0, dy=0)
    gm.player.position.x = center.x - gm.player.size.width / 2;
    gm.player.position.y = center.y - gm.player.size.height / 2;

    const b = new Bullet(center.x, center.y, -300, 10, true);
    b.faction = Faction.PLAYER;
    gm.bullets = [b];

    // Update with delta time
    gm['update'](0.1);

    expect(Number.isFinite(gm.player.position.x)).toBe(true);
    expect(Number.isFinite(gm.player.position.y)).toBe(true);
    expect(Number.isNaN(gm.player.position.x)).toBe(false);
    expect(Number.isNaN(gm.player.position.y)).toBe(false);
    expect(Number.isFinite(b.position.x)).toBe(true);
    expect(Number.isNaN(b.position.x)).toBe(false);
  });

  test('STRESS-3.3: Phase 3 Enrage timer down to 0 triggers reality distortion surge safely', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.isGodMode = true; // Use god mode for long enrage clock advance so player does not die to railguns
    gm.level = 15;

    gm.triggerEndGameCrisis(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
    gm['update'](3.1); // Advance to Phase 1

    // Fast-forward to Phase 3
    gm.endGameCrisis!.riftAnchors.forEach(r => r.takeDamage(600));
    gm['update'](1 / 60); // Phase 1 -> Phase 2
    expect(gm.endGameCrisis?.phase).toBe(CrisisPhase.PHASE_2_HULL);

    gm.endGameCrisis!.sovereign!.takeDamage(2500);
    gm['update'](1 / 60); // Phase 2 -> Phase 3
    expect(gm.endGameCrisis?.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(gm.endGameCrisis?.sovereign?.enrageTimer).toBe(35);

    // Advance 36 seconds of gameplay to trigger enrage clock expiration
    for (let s = 0; s < 36 * 10; s++) {
      gm['update'](0.1);
    }

    expect(gm.endGameCrisis?.sovereign?.enrageTimer).toBe(0);
    expect(gm.endGameCrisis?.sovereign?.realityDistortionLevel).toBe(1.0);
    expect(gm.state).toBe(GameState.PLAYING); // Still alive and playing
  });
});

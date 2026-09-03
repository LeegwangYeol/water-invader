import { test, expect } from '@playwright/test';
import { CrisisArchetype } from '../../src/game/crisis/types';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { GameManager } from '../../src/game/GameManager';
import { GameState, EnemyType } from '../../src/game/types';

/**
 * Creates a minimal headless Canvas element mock for GameManager wave evaluation.
 */
function createMockCanvas(): HTMLCanvasElement {
  const canvas = {
    width: 600,
    height: 800,
    getContext: () => ({
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      fill: () => {},
      stroke: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      fillText: () => {},
      measureText: () => ({ width: 50 }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      setLineDash: () => {},
    }),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

test.describe('12-Crisis Statistical Distribution & Incursion Gating Suite', () => {

  // =========================================================================
  // STAT12-01 & STAT12-02 & STAT12-03: 12,000 MONTE CARLO TRIALS & CHI-SQUARE
  // =========================================================================
  test('STAT12-01 to STAT12-03: 12,000 Monte Carlo trials satisfy Pearson Chi-Square (df=11, p<0.01) and [850, 1150] per-archetype bounds', () => {
    const archetypes = Object.values(CrisisArchetype);
    expect(archetypes.length).toBe(12);

    const counts: Record<CrisisArchetype, number> = {
      [CrisisArchetype.VOID_SOVEREIGN]: 0,
      [CrisisArchetype.ABYSSAL_LEVIATHAN]: 0,
      [CrisisArchetype.CYBERNETIC_EXTERMINATOR]: 0,
      [CrisisArchetype.CHRONO_DEVOURER]: 0,
      [CrisisArchetype.SOLARIS_COLOSSUS]: 0,
      [CrisisArchetype.NEBULA_PHANTASM]: 0,
      [CrisisArchetype.BIOMORPHIC_SWARM]: 0,
      [CrisisArchetype.SINGULARITY_CORE]: 0,
      [CrisisArchetype.NANITE_HARVESTER]: 0,
      [CrisisArchetype.PSIONIC_SHROUD]: 0,
      [CrisisArchetype.GLACIAL_OBLIVION]: 0,
      [CrisisArchetype.COSMIC_DEVOURER]: 0,
    };

    const TOTAL_TRIALS = 12000;
    const EXPECTED_PER_ARCHETYPE = TOTAL_TRIALS / 12; // 1,000

    // Seeded PRNG (Mulberry32) ensures 100% deterministic repeatability across CI environments (QA Caveat 2)
    const originalRandom = Math.random;
    let seed = 42;
    Math.random = () => {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    try {
      // STAT12-01: Run 12,000 trials
      for (let i = 0; i < TOTAL_TRIALS; i++) {
        const crisis = new EndGameCrisis(600, 800);
        crisis.startIncursion(); // Random uniform selection across all 12
        counts[crisis.archetype]++;
      }
    } finally {
      Math.random = originalRandom;
    }

    console.log('--- 12,000 Monte Carlo Spawning Distribution ---');
    for (const arch of archetypes) {
      console.log(`  ${arch}: ${counts[arch]} (Expected: ${EXPECTED_PER_ARCHETYPE})`);
    }

    // STAT12-02: Pearson's Chi-Square Goodness-of-Fit test (df = 11, alpha = 0.01)
    // Critical value: chi^2_(0.01, 11) = 24.725
    let chiSquare = 0;
    for (const arch of archetypes) {
      const observed = counts[arch];
      const diff = observed - EXPECTED_PER_ARCHETYPE;
      chiSquare += (diff * diff) / EXPECTED_PER_ARCHETYPE;
    }

    console.log(`Pearson Chi-Square statistic: ${chiSquare.toFixed(4)} (Threshold: < 24.725)`);
    expect(chiSquare).toBeLessThan(24.725);

    // STAT12-03: Absolute Per-Archetype Bounds Verification [850, 1150]
    // sigma = sqrt(12000 * (1/12) * (11/12)) = 30.276
    // [850, 1150] represents a > 4.95-sigma margin
    for (const arch of archetypes) {
      const observed = counts[arch];
      expect(observed).toBeGreaterThanOrEqual(850);
      expect(observed).toBeLessThanOrEqual(1150);
    }
  });

  // =========================================================================
  // STAT12-04: INCURSION GATING INVARIANTS (STAGE 15, 16, 18)
  // =========================================================================
  test('STAT12-04: Incursion gating invariants: Stage 15 has 0% crisis chance, Stage 16 has 30% +- 5%, Stage 18 has 100% pity trigger', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;

    // 1. Stage 15 Priority: Milestone Boss wave always takes precedence (0% crisis chance)
    gm.level = 15;
    const NUM_TRIALS = 1000;
    let stage15CrisisCount = 0;

    for (let i = 0; i < NUM_TRIALS; i++) {
      gm.endGameCrisis = null;
      gm.hasEndGameCrisisOccurred = false;
      gm.enemies = [];
      gm['spawnWave']();

      if (gm.endGameCrisis !== null) {
        stage15CrisisCount++;
      }
    }
    expect(stage15CrisisCount).toBe(0);
    expect(gm.enemies.some(e => e.type === EnemyType.BOSS)).toBe(true);

    // 2. Stage 16 Random Incursion: 30% +- 5% empirical trigger rate
    gm.level = 16;
    let stage16CrisisCount = 0;

    for (let i = 0; i < NUM_TRIALS; i++) {
      gm.endGameCrisis = null;
      gm.hasEndGameCrisisOccurred = false;
      gm.enemies = [];
      gm['spawnWave']();

      if (gm.endGameCrisis !== null && gm.hasEndGameCrisisOccurred) {
        stage16CrisisCount++;
      }
    }

    const stage16Rate = stage16CrisisCount / NUM_TRIALS;
    console.log(`[STAT12-04] Stage 16 Trigger Rate: ${(stage16Rate * 100).toFixed(2)}% (${stage16CrisisCount}/${NUM_TRIALS})`);
    expect(stage16Rate).toBeGreaterThanOrEqual(0.25);
    expect(stage16Rate).toBeLessThanOrEqual(0.35);

    // 3. Stage 18 Pity Incursion: 100% guaranteed trigger
    gm.level = 18;
    let stage18CrisisCount = 0;

    for (let i = 0; i < NUM_TRIALS; i++) {
      gm.endGameCrisis = null;
      gm.hasEndGameCrisisOccurred = false;
      gm.enemies = [];
      gm['spawnWave']();

      if (gm.endGameCrisis !== null && gm.hasEndGameCrisisOccurred) {
        stage18CrisisCount++;
      }
    }

    const stage18Rate = stage18CrisisCount / NUM_TRIALS;
    console.log(`[STAT12-04] Stage 18 Pity Trigger Rate: ${(stage18Rate * 100).toFixed(2)}% (${stage18CrisisCount}/${NUM_TRIALS})`);
    expect(stage18Rate).toBe(1.0);
    expect(stage18CrisisCount).toBe(NUM_TRIALS);
  });
});

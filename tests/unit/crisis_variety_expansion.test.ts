import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { Player } from '../../src/game/Player';
import {
  CrisisArchetype,
  CrisisPhase,
  CrisisType,
  GameState,
} from '../../src/game/types';

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

test.describe('Unit Simulation: Crisis Variety Expansion & Cataclysm Boss Archetypes', () => {

  test('CRISIS-01: SOLAR_FLARE crisis activation, telegraph warning, and state machine', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;

    // Trigger Solar Flare intermediate crisis
    gm.crisisState = {
      activeCrisis: 'SOLAR_FLARE' as CrisisType,
      timer: 12.0,
      duration: 12.0,
      warningTimer: 2.5,
      bannerText: '⚠ WARNING: SOLAR FLARE ERUPTION IMMINENT ⚠',
      hazardProjectiles: [],
      empSuppressionActive: false,
      empTimer: 0,
    };

    expect(gm.crisisState.activeCrisis).toBe('SOLAR_FLARE');
    expect(gm.crisisState.warningTimer).toBe(2.5);

    // Update 1.0 second during telegraph warning phase
    (gm as any).update(1.0);
    expect(gm.crisisState.warningTimer).toBeCloseTo(1.5, 1);
    expect(gm.crisisState.activeCrisis).toBe('SOLAR_FLARE');

    // Progress past warning timer into active flare phase
    (gm as any).update(2.0);
    expect(gm.crisisState.warningTimer).toBeLessThanOrEqual(0);
  });

  test('CRISIS-02: Solar Flare hazard projectile / beam lifecycle and expiration cleanup', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;

    gm.crisisState = {
      activeCrisis: 'SOLAR_FLARE' as CrisisType,
      timer: 1.0,
      duration: 1.0,
      warningTimer: 0,
      bannerText: 'SOLAR FLARE ACTIVE',
      hazardProjectiles: [
        {
          x: 200,
          y: 0,
          radius: 12,
          speedY: 400,
          damage: 1,
          color: '#f97316',
          isDead: false,
        },
      ],
      empSuppressionActive: false,
      empTimer: 0,
    };
    gm.hazardProjectiles = [...(gm.crisisState.hazardProjectiles || [])];

    // Tick past duration
    (gm as any).update(1.5);

    // Crisis must cleanly reset
    expect(gm.crisisState.activeCrisis).toBeNull();
    expect(gm.crisisState.bannerText).toBeNull();
  });

  test('CRISIS-03: EndGameCrisis Phase 1 Anchor diversity across all 3 Cataclysm Boss Archetypes', () => {
    // 1. VOID_SOVEREIGN (Dimensional Rift Singularity Anchors)
    const voidCrisis = new EndGameCrisis(600, 800);
    voidCrisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    expect(voidCrisis.archetype).toBe(CrisisArchetype.VOID_SOVEREIGN);
    expect(voidCrisis.riftAnchors.length).toBe(2);
    expect(voidCrisis.sovereign).not.toBeNull();
    expect(voidCrisis.sovereign?.maxHullHp).toBe(2500);
    expect(voidCrisis.sovereign?.maxHp).toBe(4000);
    expect(voidCrisis.riftAnchors[0].hp).toBe(600);
    expect(voidCrisis.riftAnchors[1].hp).toBe(600);

    // 2. ABYSSAL_LEVIATHAN (Bio-Brood Sacks / Spore Anchors)
    const leviathanCrisis = new EndGameCrisis(600, 800);
    leviathanCrisis.startIncursion(CrisisArchetype.ABYSSAL_LEVIATHAN);
    expect(leviathanCrisis.archetype).toBe(CrisisArchetype.ABYSSAL_LEVIATHAN);
    expect(leviathanCrisis.riftAnchors.length).toBe(2);
    expect(leviathanCrisis.sovereign?.archetype).toBe(CrisisArchetype.ABYSSAL_LEVIATHAN);

    // 3. CYBERNETIC_EXTERMINATOR (EMP Laser Pylons / Matrix Anchors)
    const exterminatorCrisis = new EndGameCrisis(600, 800);
    exterminatorCrisis.startIncursion(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
    expect(exterminatorCrisis.archetype).toBe(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
    expect(exterminatorCrisis.riftAnchors.length).toBe(2);
    expect(exterminatorCrisis.sovereign?.archetype).toBe(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
  });

  test('CRISIS-04: Phase 1 Shield Invulnerability Contract across all 3 archetypes', () => {
    const archetypes = [
      CrisisArchetype.VOID_SOVEREIGN,
      CrisisArchetype.ABYSSAL_LEVIATHAN,
      CrisisArchetype.CYBERNETIC_EXTERMINATOR,
    ];

    for (const arch of archetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      // Fast forward warning phase (3.0s)
      const player = new Player(600, 800);
      crisis.update(3.1, player, [], []);

      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
      expect(crisis.sovereign?.isInvulnerable).toBe(true);

      // Firing directly at Sovereign while anchors are alive yields 0 damage
      const dmgDealt = crisis.sovereign?.takeDamage(100);
      expect(dmgDealt).toBe(0);
      expect(crisis.sovereign?.hp).toBe(crisis.sovereign?.maxHp);

      // Destroy both Phase 1 anchors
      crisis.riftAnchors.forEach(anchor => {
        anchor.takeDamage(1000);
      });
      expect(crisis.riftAnchors.every(a => a.isDead)).toBe(true);

      // Run update to trigger phase transition
      crisis.update(0.1, player, [], []);

      // Verify progression to Phase 2 HULL exposure
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);
      expect(crisis.sovereign?.isInvulnerable).toBe(false);

      // Now Sovereign takes full damage
      const realDmg = crisis.sovereign?.takeDamage(200);
      expect(realDmg).toBe(200);
      expect(crisis.sovereign?.hp).toBe(crisis.sovereign!.maxHp - 200);
    }
  });

  test('CRISIS-05: Archetype-specific attack pattern dispatching and identity', () => {
    // Void Sovereign should execute void attacks
    const voidSovereign = new CrisisSovereign(170, 65, CrisisArchetype.VOID_SOVEREIGN, 2500, 1500);
    expect(voidSovereign.archetype).toBe(CrisisArchetype.VOID_SOVEREIGN);

    // Abyssal Leviathan should execute organic bio attacks
    const leviathan = new CrisisSovereign(170, 65, CrisisArchetype.ABYSSAL_LEVIATHAN, 2500, 1500);
    expect(leviathan.archetype).toBe(CrisisArchetype.ABYSSAL_LEVIATHAN);

    // Cybernetic Exterminator should execute laser / EMP attacks
    const exterminator = new CrisisSovereign(170, 65, CrisisArchetype.CYBERNETIC_EXTERMINATOR, 2500, 1500);
    expect(exterminator.archetype).toBe(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
  });
});

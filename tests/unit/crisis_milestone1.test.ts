import { test, expect } from '@playwright/test';
import {
  CrisisArchetype,
  CrisisPhase,
  EndGameCrisisState,
  Faction,
} from '../../src/game/types';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { Bullet } from '../../src/game/Bullet';
import { Player } from '../../src/game/Player';
import { Particle } from '../../src/game/Particle';
import { SoundManager, soundManager } from '../../src/game/SoundManager';

/**
 * Mock Canvas 2D Context for verifying vector draw logic
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
    ellipse: () => {},
    quadraticCurveTo: () => {},
    bezierCurveTo: () => {},
    rect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    createRadialGradient: () => ({
      addColorStop: () => {},
    }),
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1.0,
    font: '10px sans-serif',
    textAlign: 'left',
  };
  return ctx as CanvasRenderingContext2D;
}

test.describe('Milestone 1: Crisis Types, Entities & Vector Visuals', () => {

  test('T1: Crisis Types & Enums Contract Validation', () => {
    // Archetype enums
    expect(CrisisArchetype.VOID_SOVEREIGN).toBe('VOID_SOVEREIGN');
    expect(CrisisArchetype.ABYSSAL_LEVIATHAN).toBe('ABYSSAL_LEVIATHAN');
    expect(CrisisArchetype.CYBERNETIC_EXTERMINATOR).toBe('CYBERNETIC_EXTERMINATOR');

    // Phase enums
    expect(CrisisPhase.INCURSION).toBe('INCURSION');
    expect(CrisisPhase.PHASE_1_SHIELD).toBe('PHASE_1_SHIELD');
    expect(CrisisPhase.PHASE_2_HULL).toBe('PHASE_2_HULL');
    expect(CrisisPhase.PHASE_3_CORE).toBe('PHASE_3_CORE');
    expect(CrisisPhase.DEFEATED).toBe('DEFEATED');
  });

  test('T2: DimensionalRift Entity Construction, Dimensions & Health', () => {
    const rift = new DimensionalRift(100, 150, 0, 600);

    // Verify 80x80 anomaly dimensions
    expect(rift.size.width).toBe(80);
    expect(rift.size.height).toBe(80);
    expect(rift.faction).toBe(Faction.INVADER);
    expect(rift.maxHp).toBe(600);
    expect(rift.hp).toBe(600);
    expect(rift.isShielding).toBe(true);
    expect(rift.isDead).toBe(false);

    // Singularity center
    const center = rift.getSingularityCenter();
    expect(center.x).toBe(140);
    expect(center.y).toBe(190);

    // Damage processing
    const dmg = rift.takeDamage(150);
    expect(dmg).toBe(150);
    expect(rift.hp).toBe(450);
    expect(rift.flashTimer).toBeGreaterThan(0);

    // Fatal damage
    rift.takeDamage(500);
    expect(rift.hp).toBe(0);
    expect(rift.isDead).toBe(true);
  });

  test('T3: DimensionalRift Procedural Vector Update & Draw', () => {
    const rift = new DimensionalRift(80, 120, 1, 600);
    rift.setSovereignTarget({ x: 300, y: 150 });

    const initialAngle = rift.accretionDiskAngle;
    rift.update(0.1);

    expect(rift.accretionDiskAngle).not.toBe(initialAngle);
    expect(rift.pulsePhase).toBeGreaterThan(0);

    // Canvas drawing should run cleanly with zero errors
    const ctx = createMockCanvasContext();
    expect(() => rift.draw(ctx)).not.toThrow();
  });

  test('T4: CrisisSovereign Archetypes, Health Pools & 5,200 EHP Mathematical Design', () => {
    // Verify 3 distinct archetypes can be constructed
    const voidSovereign = new CrisisSovereign(170, 70, CrisisArchetype.VOID_SOVEREIGN, 2500, 1500);
    const leviathan = new CrisisSovereign(170, 70, CrisisArchetype.ABYSSAL_LEVIATHAN, 2500, 1500);
    const exterminator = new CrisisSovereign(170, 70, CrisisArchetype.CYBERNETIC_EXTERMINATOR, 2500, 1500);

    expect(voidSovereign.size.width).toBe(260);
    expect(voidSovereign.size.height).toBe(130);
    expect(voidSovereign.maxHullHp).toBe(2500);
    expect(voidSovereign.maxCoreHp).toBe(1500);

    // Total EHP across all phases = 2x600 (Rifts) + 2500 (Hull) + 1500 (Core) = 5200 HP
    const totalEhp = 600 + 600 + voidSovereign.maxHullHp + voidSovereign.maxCoreHp;
    expect(totalEhp).toBe(5200);

    expect(voidSovereign.faction).toBe(Faction.INVADER);
    expect(leviathan.faction).toBe(Faction.INVADER);
    expect(exterminator.faction).toBe(Faction.INVADER);
  });

  test('T5: CrisisSovereign Multi-Phase Damage Gate & State Transitions', () => {
    const sovereign = new CrisisSovereign(170, 70, CrisisArchetype.VOID_SOVEREIGN, 2500, 1500);

    // Phase 1 (Shield Active): Invulnerable - 100% damage deflection
    sovereign.setPhase(CrisisPhase.PHASE_1_SHIELD);
    expect(sovereign.isInvulnerable).toBe(true);
    const deflectedDmg = sovereign.takeDamage(500);
    expect(deflectedDmg).toBe(0);
    expect(sovereign.hullHp).toBe(2500);
    expect(sovereign.coreHp).toBe(1500);
    expect(sovereign.shieldFlashTimer).toBeGreaterThan(0);

    // Phase 2 (Hull Exposed): Takes damage to hull
    sovereign.setPhase(CrisisPhase.PHASE_2_HULL);
    expect(sovereign.isInvulnerable).toBe(false);
    const hullDmg = sovereign.takeDamage(1000);
    expect(hullDmg).toBe(1000);
    expect(sovereign.hullHp).toBe(1500);

    // Breaking Hull triggers Phase 3 (Core Overdrive)
    sovereign.takeDamage(1500);
    expect(sovereign.hullHp).toBe(0);
    expect(sovereign.phase).toBe(CrisisPhase.PHASE_3_CORE);
    expect(sovereign.enrageTimer).toBe(35.0);

    // Phase 3 (Core Overdrive): Takes damage to core
    const coreDmg = sovereign.takeDamage(500);
    expect(coreDmg).toBe(500);
    expect(sovereign.coreHp).toBe(1000);

    // Enrage timer counts down during Phase 3
    sovereign.update(1.0, { x: 300, y: 700 });
    expect(sovereign.enrageTimer).toBe(34.0);

    // Depleting Core triggers DEFEATED
    sovereign.takeDamage(1000);
    expect(sovereign.coreHp).toBe(0);
    expect(sovereign.phase).toBe(CrisisPhase.DEFEATED);
    expect(sovereign.isDead).toBe(true);
  });

  test('T6: CrisisSovereign Pure Vector Graphics for All 3 Archetypes & Boss HUD', () => {
    const ctx = createMockCanvasContext();

    for (const arch of [
      CrisisArchetype.VOID_SOVEREIGN,
      CrisisArchetype.ABYSSAL_LEVIATHAN,
      CrisisArchetype.CYBERNETIC_EXTERMINATOR,
    ]) {
      const sov = new CrisisSovereign(170, 70, arch, 2500, 1500);
      sov.update(0.016, { x: 300, y: 700 });
      
      // Draw in all phases
      sov.setPhase(CrisisPhase.PHASE_1_SHIELD);
      expect(() => sov.draw(ctx)).not.toThrow();
      expect(() => sov.drawBossHUD(ctx, 600)).not.toThrow();

      sov.setPhase(CrisisPhase.PHASE_2_HULL);
      expect(() => sov.draw(ctx)).not.toThrow();

      sov.setPhase(CrisisPhase.PHASE_3_CORE);
      expect(() => sov.draw(ctx)).not.toThrow();
    }
  });

  test('T7: EndGameCrisis Coordinator Lifecycle, Incursion & Phase Orchestration', () => {
    const crisis = new EndGameCrisis(600, 800);
    expect(crisis.isActive).toBe(false);

    // Start Incursion
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    expect(crisis.isActive).toBe(true);
    expect(crisis.phase).toBe(CrisisPhase.INCURSION);
    expect(crisis.warningTimer).toBe(3.0);
    expect(crisis.riftAnchors.length).toBe(2);
    expect(crisis.sovereign).not.toBeNull();

    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    // Advance 3.0s warning phase -> transitions to Phase 1
    crisis.update(3.1, player, bullets, particles);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
    expect(crisis.sovereign?.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

    // Bullets deflect off sovereign in Phase 1
    const pBullet = new Bullet(crisis.sovereign!.position.x + 50, crisis.sovereign!.position.y + 50, -500, 20, true);
    const hitSovereign = crisis.handleBulletCollision(pBullet);
    expect(hitSovereign).toBe(true);
    expect(crisis.sovereign?.hullHp).toBe(2500); // Unchanged due to shield

    // Bullets damage rifts in Phase 1
    const leftRift = crisis.riftAnchors[0];
    const riftBullet = new Bullet(leftRift.position.x + 10, leftRift.position.y + 10, -500, 300, true);
    const hitRift = crisis.handleBulletCollision(riftBullet);
    expect(hitRift).toBe(true);
    expect(leftRift.hp).toBe(300);

    // Destroy both rifts -> auto-transitions to Phase 2
    leftRift.takeDamage(300);
    crisis.riftAnchors[1].takeDamage(600);
    crisis.update(0.016, player, bullets, particles);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);

    // In Phase 2, Sovereign takes direct damage
    const hullBullet = new Bullet(crisis.sovereign!.position.x + 50, crisis.sovereign!.position.y + 50, -500, 1000, true);
    crisis.handleBulletCollision(hullBullet);
    expect(crisis.sovereign?.hullHp).toBe(1500);

    // Depleting Hull -> transitions to Phase 3
    crisis.sovereign?.takeDamage(1500);
    crisis.update(0.016, player, bullets, particles);
    expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

    // Depleting Core -> Defeated
    crisis.sovereign?.takeDamage(1500);
    crisis.update(0.016, player, bullets, particles);
    expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
    expect(crisis.isDefeated()).toBe(true);
  });

  test('T8: Reality-Bending Vortex & Gravitational Attraction Physics', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    crisis.update(3.1, new Player(600, 800), [], []); // Enter Phase 1

    const player = new Player(600, 800);
    const rift = crisis.riftAnchors[0]; // Rift at x=50, y=170
    player.position.x = 80;
    player.position.y = 200;
    const initialPlayerX = player.position.x;

    // Right-side bullet (at x=120, right of rift center 90)
    const bulletRight = new Bullet(120, 220, -400, 10, true);
    const bullets = [bulletRight];

    // Update with delta time
    crisis.update(0.1, player, bullets, []);

    // 1. Player (center at 105, right of rift center 90) pulled left towards 90
    expect(player.position.x).toBeLessThan(initialPlayerX);

    // 2. Right-side bullet (at x=120, right of rift center 90) pulled left towards 90
    expect(bulletRight.position.x).toBeLessThan(120);

    // 3. Left-side bullet (at x=40, left of rift center 90) pulled right towards 90
    const bulletLeft = new Bullet(40, 220, -400, 10, true);
    const bulletsLeft = [bulletLeft];
    crisis.update(0.1, player, bulletsLeft, []);
    expect(bulletLeft.position.x).toBeGreaterThan(40);
  });

  test('T9: SoundManager Crisis Audio Synthesis Methods', () => {
    expect(typeof soundManager.playCrisisCataclysmSiren).toBe('function');
    expect(typeof soundManager.playDarkMatterBeam).toBe('function');
    expect(typeof soundManager.playDimensionalRiftPulse).toBe('function');
    expect(typeof soundManager.playSingularityCollapse).toBe('function');

    // Calling them in headless environment without audio context should safely no-op without exceptions
    expect(() => soundManager.playCrisisCataclysmSiren()).not.toThrow();
    expect(() => soundManager.playDarkMatterBeam()).not.toThrow();
    expect(() => soundManager.playDimensionalRiftPulse()).not.toThrow();
    expect(() => soundManager.playSingularityCollapse()).not.toThrow();
  });
});

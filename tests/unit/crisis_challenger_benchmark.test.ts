import { test, expect } from '@playwright/test';
import {
  CrisisArchetype,
  CrisisPhase,
  Faction,
} from '../../src/game/types';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { Bullet } from '../../src/game/Bullet';
import { Player } from '../../src/game/Player';
import { Particle } from '../../src/game/Particle';

/**
 * Enhanced Mock Canvas 2D Context that counts operations and verifies save/restore stack depth
 */
class BenchmarkingCanvasContext {
  public saveDepth = 0;
  public maxDepth = 0;
  public minDepth = 0;
  public opCounts: Record<string, number> = {
    save: 0,
    restore: 0,
    beginPath: 0,
    closePath: 0,
    moveTo: 0,
    lineTo: 0,
    arc: 0,
    ellipse: 0,
    bezierCurveTo: 0,
    quadraticCurveTo: 0,
    rect: 0,
    fillRect: 0,
    strokeRect: 0,
    fill: 0,
    stroke: 0,
    fillText: 0,
    translate: 0,
    rotate: 0,
    createRadialGradient: 0,
    createLinearGradient: 0,
  };

  public save() {
    this.saveDepth++;
    if (this.saveDepth > this.maxDepth) this.maxDepth = this.saveDepth;
    this.opCounts.save++;
  }

  public restore() {
    this.saveDepth--;
    if (this.saveDepth < this.minDepth) this.minDepth = this.saveDepth;
    this.opCounts.restore++;
  }

  public beginPath() { this.opCounts.beginPath++; }
  public closePath() { this.opCounts.closePath++; }
  public moveTo(_x: number, _y: number) { this.opCounts.moveTo++; }
  public lineTo(_x: number, _y: number) { this.opCounts.lineTo++; }
  public arc(_x: number, _y: number, _r: number, _s: number, _e: number) { this.opCounts.arc++; }
  public ellipse(_x: number, _y: number, _rx: number, _ry: number, _rot: number, _s: number, _e: number) { this.opCounts.ellipse++; }
  public bezierCurveTo(_cp1x: number, _cp1y: number, _cp2x: number, _cp2y: number, _x: number, _y: number) { this.opCounts.bezierCurveTo++; }
  public quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number) { this.opCounts.quadraticCurveTo++; }
  public rect(_x: number, _y: number, _w: number, _h: number) { this.opCounts.rect++; }
  public fillRect(_x: number, _y: number, _w: number, _h: number) { this.opCounts.fillRect++; }
  public strokeRect(_x: number, _y: number, _w: number, _h: number) { this.opCounts.strokeRect++; }
  public fill() { this.opCounts.fill++; }
  public stroke() { this.opCounts.stroke++; }
  public fillText(_text: string, _x: number, _y: number) { this.opCounts.fillText++; }
  public translate(_x: number, _y: number) { this.opCounts.translate++; }
  public rotate(_angle: number) { this.opCounts.rotate++; }
  public scale(_x: number, _y: number) {}

  public createRadialGradient(_x0: number, _y0: number, _r0: number, _x1: number, _y1: number, _r1: number) {
    this.opCounts.createRadialGradient++;
    return {
      addColorStop: (_offset: number, _color: string) => {},
    };
  }

  public createLinearGradient(_x0: number, _y0: number, _x1: number, _y1: number) {
    this.opCounts.createLinearGradient++;
    return {
      addColorStop: (_offset: number, _color: string) => {},
    };
  }

  public fillStyle: string | any = '#000000';
  public strokeStyle: string | any = '#000000';
  public lineWidth: number = 1;
  public globalAlpha: number = 1.0;
  public font: string = '10px sans-serif';
  public textAlign: string = 'left';
}

test.describe('Adversarial Challenger Benchmark: Milestone 1 Crisis Vector Performance & Memory', () => {

  test('C1: Canvas Save/Restore Stack Balance Invariant (0 Leak in 2D Context State)', () => {
    const archetypes = [
      CrisisArchetype.VOID_SOVEREIGN,
      CrisisArchetype.ABYSSAL_LEVIATHAN,
      CrisisArchetype.CYBERNETIC_EXTERMINATOR,
    ];
    const phases = [
      CrisisPhase.INCURSION,
      CrisisPhase.PHASE_1_SHIELD,
      CrisisPhase.PHASE_2_HULL,
      CrisisPhase.PHASE_3_CORE,
      CrisisPhase.DEFEATED,
    ];

    for (const arch of archetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      for (const phase of phases) {
        crisis.phase = phase;
        if (crisis.sovereign) crisis.sovereign.setPhase(phase);

        const mockCtx = new BenchmarkingCanvasContext();
        const ctx = mockCtx as unknown as CanvasRenderingContext2D;

        crisis.draw(ctx, 600, 800);

        // Save/Restore must be perfectly balanced: saveDepth must equal 0 at the end of draw
        expect(mockCtx.saveDepth, `Save/Restore stack leaked on ${arch} in phase ${phase}`).toBe(0);
        expect(mockCtx.minDepth, `ctx.restore() called more times than save() on ${arch} in phase ${phase}`).toBeGreaterThanOrEqual(0);
        expect(mockCtx.opCounts.save).toBe(mockCtx.opCounts.restore);
      }
    }
  });

  test('C2: 10,000-Frame Vector Drawing Throughput — Void Sovereign', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    const mockCtx = new BenchmarkingCanvasContext();
    const ctx = mockCtx as unknown as CanvasRenderingContext2D;
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    const TOTAL_FRAMES = 10000;
    const dt = 1 / 60; // 60 FPS fixed delta

    const startTime = performance.now();

    for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
      // Cycle through phases to test all vector drawing routines
      if (frame === 100) crisis.phase = CrisisPhase.PHASE_1_SHIELD;
      if (frame === 3000) {
        crisis.riftAnchors.forEach(r => r.takeDamage(1000));
        crisis.phase = CrisisPhase.PHASE_2_HULL;
        crisis.sovereign?.setPhase(CrisisPhase.PHASE_2_HULL);
      }
      if (frame === 7000) {
        crisis.sovereign?.setPhase(CrisisPhase.PHASE_3_CORE);
        crisis.phase = CrisisPhase.PHASE_3_CORE;
      }

      crisis.update(dt, player, bullets, particles);
      crisis.draw(ctx, 600, 800);
    }

    const elapsedMs = performance.now() - startTime;
    const avgMsPerFrame = elapsedMs / TOTAL_FRAMES;
    const fps = (TOTAL_FRAMES / elapsedMs) * 1000;

    console.log(`[Challenger] Void Sovereign: 10,000 frames in ${elapsedMs.toFixed(2)}ms (${avgMsPerFrame.toFixed(4)}ms/frame, ${fps.toFixed(0)} FPS equivalent)`);

    // Must exceed 1,000 FPS throughput (avg < 1.0ms per simulated frame)
    expect(avgMsPerFrame).toBeLessThan(1.0);
    expect(mockCtx.saveDepth).toBe(0);
  });

  test('C3: 10,000-Frame Vector Drawing Throughput — Abyssal Leviathan', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.ABYSSAL_LEVIATHAN);
    const mockCtx = new BenchmarkingCanvasContext();
    const ctx = mockCtx as unknown as CanvasRenderingContext2D;
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    const TOTAL_FRAMES = 10000;
    const dt = 1 / 60;

    const startTime = performance.now();

    for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
      if (frame === 100) crisis.phase = CrisisPhase.PHASE_1_SHIELD;
      if (frame === 3000) {
        crisis.riftAnchors.forEach(r => r.takeDamage(1000));
        crisis.phase = CrisisPhase.PHASE_2_HULL;
        crisis.sovereign?.setPhase(CrisisPhase.PHASE_2_HULL);
      }
      if (frame === 7000) {
        crisis.sovereign?.setPhase(CrisisPhase.PHASE_3_CORE);
        crisis.phase = CrisisPhase.PHASE_3_CORE;
      }

      crisis.update(dt, player, bullets, particles);
      crisis.draw(ctx, 600, 800);
    }

    const elapsedMs = performance.now() - startTime;
    const avgMsPerFrame = elapsedMs / TOTAL_FRAMES;
    const fps = (TOTAL_FRAMES / elapsedMs) * 1000;

    console.log(`[Challenger] Abyssal Leviathan: 10,000 frames in ${elapsedMs.toFixed(2)}ms (${avgMsPerFrame.toFixed(4)}ms/frame, ${fps.toFixed(0)} FPS equivalent)`);

    expect(avgMsPerFrame).toBeLessThan(1.0);
    expect(mockCtx.saveDepth).toBe(0);
  });

  test('C4: 10,000-Frame Vector Drawing Throughput — Cybernetic Exterminator', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
    const mockCtx = new BenchmarkingCanvasContext();
    const ctx = mockCtx as unknown as CanvasRenderingContext2D;
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    const TOTAL_FRAMES = 10000;
    const dt = 1 / 60;

    const startTime = performance.now();

    for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
      if (frame === 100) crisis.phase = CrisisPhase.PHASE_1_SHIELD;
      if (frame === 3000) {
        crisis.riftAnchors.forEach(r => r.takeDamage(1000));
        crisis.phase = CrisisPhase.PHASE_2_HULL;
        crisis.sovereign?.setPhase(CrisisPhase.PHASE_2_HULL);
      }
      if (frame === 7000) {
        crisis.sovereign?.setPhase(CrisisPhase.PHASE_3_CORE);
        crisis.phase = CrisisPhase.PHASE_3_CORE;
      }

      crisis.update(dt, player, bullets, particles);
      crisis.draw(ctx, 600, 800);
    }

    const elapsedMs = performance.now() - startTime;
    const avgMsPerFrame = elapsedMs / TOTAL_FRAMES;
    const fps = (TOTAL_FRAMES / elapsedMs) * 1000;

    console.log(`[Challenger] Cybernetic Exterminator: 10,000 frames in ${elapsedMs.toFixed(2)}ms (${avgMsPerFrame.toFixed(4)}ms/frame, ${fps.toFixed(0)} FPS equivalent)`);

    expect(avgMsPerFrame).toBeLessThan(1.0);
    expect(mockCtx.saveDepth).toBe(0);
  });

  test('C5: Memory Leak & Heap Stability Profiling over 10,000 Frames', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    const mockCtx = new BenchmarkingCanvasContext();
    const ctx = mockCtx as unknown as CanvasRenderingContext2D;
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    const dt = 1 / 60;
    const warmUpFrames = 2000;
    const sampleFrames = 10000;

    // Warm-up phase to trigger JIT compilation and establish baseline heap
    for (let i = 0; i < warmUpFrames; i++) {
      crisis.update(dt, player, bullets, particles);
      crisis.draw(ctx, 600, 800);
    }

    if (global.gc) {
      global.gc();
    }
    const initialHeap = process.memoryUsage().heapUsed;

    // Run 10,000 frames with simulated player activity and periodic particle pruning
    for (let i = 0; i < sampleFrames; i++) {
      // Simulate player moving
      player.position.x = 250 + Math.sin(i * 0.05) * 200;
      
      crisis.update(dt, player, bullets, particles);
      crisis.draw(ctx, 600, 800);

      // Prune dead particles as standard game loop would
      for (let pIdx = particles.length - 1; pIdx >= 0; pIdx--) {
        particles[pIdx].update(dt);
        if (particles[pIdx].isDead) {
          particles.splice(pIdx, 1);
        }
      }

      // Prune dead bullets
      for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
        bullets[bIdx].update(dt);
        if (bullets[bIdx].isDead || bullets[bIdx].position.y > 900 || bullets[bIdx].position.y < -100) {
          bullets.splice(bIdx, 1);
        }
      }
    }

    if (global.gc) {
      global.gc();
    }
    const finalHeap = process.memoryUsage().heapUsed;
    const heapDeltaMB = (finalHeap - initialHeap) / (1024 * 1024);

    console.log(`[Challenger] Memory Profiling: Initial Heap=${(initialHeap / 1024 / 1024).toFixed(2)}MB, Final Heap=${(finalHeap / 1024 / 1024).toFixed(2)}MB, Delta=${heapDeltaMB.toFixed(2)}MB`);

    // Delta should be bounded (< 30MB without explicit GC, < 5MB with GC)
    expect(heapDeltaMB).toBeLessThan(30);
  });

  test('C6: Particle Invariant & Bounded Particle Array Guard', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    // Pre-fill particles close to the 400 cap
    for (let i = 0; i < 399; i++) {
      particles.push(new Particle(100, 100, '#ffffff', 1.0));
    }

    // Run 500 update cycles WITHOUT particle pruning
    for (let i = 0; i < 500; i++) {
      crisis.update(0.016, player, bullets, particles);
    }

    // Ambient particles generated by Rifts MUST obey `particles.length < 400` guard
    // It should never explosively grow beyond 400 + max 2 (one per active rift if both spawn on frame 399)
    expect(particles.length).toBeLessThanOrEqual(402);
  });

  test('C7: Extreme Lag Spike & Variable Delta Time Stability (dt = 0, 10.0s, -0.1s)', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.CYBERNETIC_EXTERMINATOR);
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    // 1. Zero deltaTime
    expect(() => crisis.update(0, player, bullets, particles)).not.toThrow();

    // 2. Massive 10-second lag spike
    expect(() => crisis.update(10.0, player, bullets, particles)).not.toThrow();

    // Sovereign position must still be finite (no NaN / Infinity)
    expect(Number.isFinite(crisis.sovereign!.position.x)).toBe(true);
    expect(Number.isFinite(crisis.sovereign!.position.y)).toBe(true);

    // 3. Negative delta time (time reversal anomaly)
    expect(() => crisis.update(-0.1, player, bullets, particles)).not.toThrow();
  });

  test('C8: Massive 1,000-Bullet Collision Stress Test & Piercing Deflection Gate', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    // Transition to Phase 1 (Shield active)
    crisis.update(3.1, new Player(600, 800), [], []);

    const sov = crisis.sovereign!;
    const initialHull = sov.hullHp;
    const initialCore = sov.coreHp;

    // Spawn 1,000 high-damage piercing bullets right inside the Sovereign's bounding box
    const bullets: Bullet[] = [];
    for (let i = 0; i < 1000; i++) {
      const b = new Bullet(sov.position.x + 20, sov.position.y + 20, -500, 100, true);
      b.piercing = 999;
      bullets.push(b);
    }

    let deflectionCount = 0;
    for (const b of bullets) {
      const handled = crisis.handleBulletCollision(b);
      if (handled) deflectionCount++;
    }

    // 100% of bullets should be intercepted and deflected
    expect(deflectionCount).toBe(1000);
    // Sovereign HP must remain 100% intact due to Phase 1 Shield
    expect(sov.hullHp).toBe(initialHull);
    expect(sov.coreHp).toBe(initialCore);
    expect(sov.isInvulnerable).toBe(true);
  });

  test('C9: Cosmic Core Overdrive 35s Enrage Countdown & Implosion Resolution', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    // Force transition to Phase 3
    crisis.phase = CrisisPhase.PHASE_3_CORE;
    crisis.sovereign?.setPhase(CrisisPhase.PHASE_3_CORE);

    expect(crisis.sovereign?.enrageTimer).toBe(35.0);

    // Advance 36 seconds
    crisis.update(36.0, player, bullets, particles);

    // Enrage timer should clamp to 0 and trigger maximum reality distortion
    expect(crisis.sovereign?.enrageTimer).toBe(0);
    expect(crisis.sovereign?.realityDistortionLevel).toBe(1.0);

    // Kill Core -> Transition to DEFEATED
    crisis.sovereign?.takeDamage(9999);
    crisis.update(0.016, player, bullets, particles);

    expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
    expect(crisis.isDefeated()).toBe(true);
    expect(crisis.isActive).toBe(false);
  });

  test('C10: Mobile HUD Viewport Scaling & Clamping Safety (screenWidth = 320px)', () => {
    const sov = new CrisisSovereign(50, 50, CrisisArchetype.CYBERNETIC_EXTERMINATOR, 2500, 1500);
    const mockCtx = new BenchmarkingCanvasContext();
    const ctx = mockCtx as unknown as CanvasRenderingContext2D;

    // Test extreme narrow mobile screen width (320px)
    expect(() => sov.drawBossHUD(ctx, 320)).not.toThrow();
    expect(mockCtx.saveDepth).toBe(0);

    // Test large 4K screen width (3840px)
    expect(() => sov.drawBossHUD(ctx, 3840)).not.toThrow();
    expect(mockCtx.saveDepth).toBe(0);
  });

  test('C11: Robustness against NaN, Negative Damage, and Over-kill Values', () => {
    const sov = new CrisisSovereign(100, 100, CrisisArchetype.VOID_SOVEREIGN, 2500, 1500);
    sov.setPhase(CrisisPhase.PHASE_2_HULL);

    // Negative damage should deal 0 or negative without corrupting state
    const negDmg = sov.takeDamage(-50);
    expect(negDmg).toBeLessThanOrEqual(0);
    expect(sov.hullHp).toBeGreaterThanOrEqual(2500);

    // Massive overkill damage
    const overDmg = sov.takeDamage(999999);
    expect(sov.hullHp).toBe(0);
    expect(sov.phase).toBe(CrisisPhase.PHASE_3_CORE);

    // Core overkill damage
    const coreOverDmg = sov.takeDamage(999999);
    expect(sov.coreHp).toBe(0);
    expect(sov.phase).toBe(CrisisPhase.DEFEATED);
    expect(sov.isDead).toBe(true);
  });

  test('C12: Null Player and Missing SoundManager Safety in update() and draw()', () => {
    const crisis = new EndGameCrisis(600, 800);
    crisis.startIncursion(CrisisArchetype.ABYSSAL_LEVIATHAN);
    const mockCtx = new BenchmarkingCanvasContext();
    const ctx = mockCtx as unknown as CanvasRenderingContext2D;

    // Update with null player (e.g. during player death/respawn transition) and no soundManager
    expect(() => crisis.update(0.016, null as any, [], [], undefined)).not.toThrow();
    expect(() => crisis.draw(ctx, 600, 800)).not.toThrow();
    expect(mockCtx.saveDepth).toBe(0);
  });

  test('C13: State Snapshot Isolation and Integrity via getState()', () => {
    const crisis = new EndGameCrisis(600, 800);
    // Before incursion
    const preState = crisis.getState();
    expect(preState.isActive).toBe(false);
    expect(preState.totalHp).toBe(0);
    expect(preState.riftAnchors.length).toBe(0);
    expect(preState.mainBody).toBeNull();

    // After incursion
    crisis.startIncursion(CrisisArchetype.VOID_SOVEREIGN);
    const postState = crisis.getState();
    expect(postState.isActive).toBe(true);
    expect(postState.totalHp).toBe(4000);
    expect(postState.riftAnchors.length).toBe(2);
    expect(postState.mainBody).not.toBeNull();
  });
});

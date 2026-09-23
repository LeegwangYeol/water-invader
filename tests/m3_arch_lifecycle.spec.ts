import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import { GameState, EnemyType, Faction } from '../src/game/types';
import { FlagshipManager } from '../src/game/flagship/FlagshipManager';
import { FlagshipUpdateContext, IFlagshipSubsystem } from '../src/game/flagship/types';
import { SoundManager } from '../src/game/SoundManager';
import { Enemy } from '../src/game/Enemy';
import { Player } from '../src/game/Player';

// Mock Canvas 2D context helper for headless Node testing
function createMockCanvas(width: number = 600, height: number = 800): HTMLCanvasElement {
  return {
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
      clearRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      drawImage: () => {},
      roundRect: () => {},
      measureText: () => ({ width: 60 }),
      setLineDash: () => {},
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1.0,
      shadowColor: '#000000',
      shadowBlur: 0,
    }),
  } as unknown as HTMLCanvasElement;
}

// Polyfill rAF and cAF in Node test environment if not present
let nextRafId = 1;
const activeRafCallbacks = new Map<number, FrameRequestCallback>();

if (typeof (globalThis as any).requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = nextRafId++;
    activeRafCallbacks.set(id, callback);
    return id;
  };
}

if (typeof (globalThis as any).cancelAnimationFrame === 'undefined') {
  (globalThis as any).cancelAnimationFrame = (id: number): void => {
    activeRafCallbacks.delete(id);
  };
}

// Mock Web Audio API for Node environment
class MockAudioParam {
  public value: number = 1;
  public setValueAtTime(val: number, _time: number) {
    this.value = val;
  }
}

class MockGainNode {
  public gain = new MockAudioParam();
  public connectedTo: any = null;
  public connect(dest: any) {
    this.connectedTo = dest;
  }
  public disconnect() {
    this.connectedTo = null;
  }
}

class MockAnalyserNode {
  public fftSize: number = 64;
  public connectedTo: any = null;
  public connect(dest: any) {
    this.connectedTo = dest;
  }
  public disconnect() {
    this.connectedTo = null;
  }
}

class MockAudioContext {
  public state: 'running' | 'suspended' | 'closed' = 'running';
  public currentTime: number = 0;
  public destination = { name: 'mockDestination' };

  public createGain() {
    return new MockGainNode();
  }

  public createAnalyser() {
    return new MockAnalyserNode();
  }

  public async suspend() {
    this.state = 'suspended';
  }

  public async resume() {
    this.state = 'running';
  }

  public async close() {
    this.state = 'closed';
  }
}

// Helper to provide FlagshipUpdateContext
function createMockFlagshipContext(player: Player, gameState: GameState = GameState.PLAYING): FlagshipUpdateContext {
  return {
    player,
    enemies: [],
    bullets: [],
    barricades: [],
    helpers: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 0,
    gameState,
    createExplosion: () => {},
    triggerScreenShake: () => {},
  };
}

test.describe('M3: Architecture, State & Memory Lifecycle Verification Suite', () => {

  // ==========================================================================
  // DEF-ARC-01: rAF Loop Exit Guards & Management in GameManager
  // ==========================================================================
  test.describe('DEF-ARC-01: rAF Loop Exit Guards & Management', () => {

    test('DEF-ARC-01.1: GameManager starts with animationFrameId > 0 when running', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.isPaused = false;
      
      gm.start();
      expect(gm.animationFrameId).toBeGreaterThan(0);

      // Clean up
      gm.pause();
    });

    test('DEF-ARC-01.2: pause() immediately cancels rAF and resets animationFrameId to 0', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.isPaused = false;
      gm.start();

      expect(gm.animationFrameId).toBeGreaterThan(0);
      const activeId = gm.animationFrameId;

      gm.pause();
      expect(gm.isPaused).toBe(true);
      expect(gm.animationFrameId).toBe(0);
      expect(activeRafCallbacks.has(activeId)).toBe(false);
    });

    test('DEF-ARC-01.3: resume() restarts rAF loop and assigns new non-zero animationFrameId', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.isPaused = false;
      gm.start();

      gm.pause();
      expect(gm.animationFrameId).toBe(0);

      gm.resume();
      expect(gm.isPaused).toBe(false);
      expect(gm.animationFrameId).toBeGreaterThan(0);

      // Clean up
      gm.pause();
    });

    test('DEF-ARC-01.4: Calling resume() when already active is idempotent and does not spawn duplicate rAF loops', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.isPaused = false;
      gm.start();

      const initialId = gm.animationFrameId;
      expect(initialId).toBeGreaterThan(0);

      // Call resume again while already running
      gm.resume();
      expect(gm.animationFrameId).toBe(initialId);

      // Clean up
      gm.pause();
    });

    test('DEF-ARC-01.5: gameOver() cancels rAF loop and resets animationFrameId to 0', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;
      gm.isPaused = false;
      gm.start();

      expect(gm.animationFrameId).toBeGreaterThan(0);
      const activeId = gm.animationFrameId;

      gm.gameOver();
      expect(gm.state).toBe(GameState.GAME_OVER);
      expect(gm.animationFrameId).toBe(0);
      expect(activeRafCallbacks.has(activeId)).toBe(false);
    });

    test('DEF-ARC-01.6: rAF loop exits early and returns if state !== GameState.PLAYING or isPaused === true', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.SHOP;
      gm.isPaused = false;
      gm.animationFrameId = 999;

      // Manually trigger loop
      (gm as any).loop(performance.now());

      // Because state is SHOP, loop must have cleared animationFrameId and exited early without scheduling new rAF
      expect(gm.animationFrameId).toBe(0);
    });

  });

  // ==========================================================================
  // DEF-ARC-02: Crisis State Lifespan & Non-Acid Crisis Persistence
  // ==========================================================================
  test.describe('DEF-ARC-02: Non-Acid Crisis Persistence Across Wave Clear', () => {

    test('DEF-ARC-02.1: Non-Acid crisis (e.g. SOLAR_FLARE) does NOT clear prematurely on wave clear when timer > 0', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      // Set up an active non-Acid crisis with remaining duration
      gm.crisisState.activeCrisis = 'SOLAR_FLARE';
      gm.crisisState.timer = 15.0; // 15 seconds remaining
      gm.enemies = []; // All enemies defeated

      // Call update
      gm.update(0.016);

      // The crisis must NOT be cleared prematurely!
      expect(gm.crisisState.activeCrisis).toBe('SOLAR_FLARE');
      expect(gm.crisisState.timer).toBeCloseTo(15.0 - 0.016, 2);
      // And wave completion must be prevented while crisis is active
      expect(gm.state).toBe(GameState.PLAYING);
    });

    test('DEF-ARC-02.2: EMP_DISRUPTION crisis does NOT clear prematurely on wave clear when timer > 0', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      gm.crisisState.activeCrisis = 'EMP_DISRUPTION';
      gm.crisisState.timer = 8.5;
      gm.enemies = [];

      gm.update(0.016);

      expect(gm.crisisState.activeCrisis).toBe('EMP_DISRUPTION');
      expect(gm.crisisState.timer).toBeCloseTo(8.5 - 0.016, 2);
      expect(gm.state).toBe(GameState.PLAYING);
    });

    test('DEF-ARC-02.3: Non-Acid crisis clears normally when timer reaches <= 0', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      gm.crisisState.activeCrisis = 'SOLAR_FLARE';
      gm.crisisState.timer = 0.01; // Almost expired
      gm.enemies = [];

      // Update with dt > remaining timer
      gm.update(0.02);

      // Timer has elapsed: crisis is cleared
      expect(gm.crisisState.activeCrisis).toBeNull();
      expect(gm.crisisState.timer).toBe(0);
    });

    test('DEF-ARC-02.4: ACID_STORM crisis clears when timer reaches <= 0', () => {
      const canvas = createMockCanvas();
      const gm = new GameManager(canvas);
      gm.state = GameState.PLAYING;

      gm.crisisState.activeCrisis = 'ACID_STORM';
      gm.crisisState.timer = 0.01;
      gm.enemies = [];

      gm.update(0.02);

      expect(gm.crisisState.activeCrisis).toBeNull();
      expect(gm.crisisState.timer).toBe(0);
    });

  });

  // ==========================================================================
  // DEF-ARC-03: Subsystem Array Caching & Zero-Allocation Draw
  // ==========================================================================
  test.describe('DEF-ARC-03: Subsystem Array Caching & Zero-Allocation Draw', () => {

    test('DEF-ARC-03.1: getSubsystems() returns identical cached array reference on consecutive calls', () => {
      const flagship = new FlagshipManager();
      const ref1 = flagship.getSubsystems();
      const ref2 = flagship.getSubsystems();
      const ref3 = flagship.getSubsystems();

      expect(ref1).toBe(ref2);
      expect(ref2).toBe(ref3);
      expect(Array.isArray(ref1)).toBe(true);
      expect(ref1.length).toBeGreaterThan(0);
    });

    test('DEF-ARC-03.2: Registering a new subsystem invalidates and rebuilds the subsystem cache', () => {
      const flagship = new FlagshipManager();
      const initialCache = flagship.getSubsystems();
      const initialCount = initialCache.length;

      const dummySubsystem: IFlagshipSubsystem = {
        id: 'test_custom_subsystem',
        init: () => {},
        update: () => {},
        drawBackground: () => {},
        drawWorld: () => {},
        drawForeground: () => {},
      };

      flagship.registerSubsystem(dummySubsystem);
      const newCache = flagship.getSubsystems();

      expect(newCache).not.toBe(initialCache);
      expect(newCache.length).toBe(initialCount + 1);
      expect(newCache.includes(dummySubsystem)).toBe(true);

      // Subsequent call returns the new cached reference
      expect(flagship.getSubsystems()).toBe(newCache);
    });

    test('DEF-ARC-03.3: drawForeground executes without creating new Set instances', () => {
      const flagship = new FlagshipManager();
      const canvas = createMockCanvas();
      const ctx = canvas.getContext('2d')!;

      // Track Set constructor calls during drawForeground
      const OriginalSet = globalThis.Set;
      let setCreations = 0;

      (globalThis as any).Set = class extends OriginalSet {
        constructor(...args: any[]) {
          super(...args);
          setCreations++;
        }
      };

      try {
        setCreations = 0;
        flagship.drawForeground(ctx);
        // Zero Set instantiations per frame!
        expect(setCreations).toBe(0);

        flagship.drawForeground(ctx);
        expect(setCreations).toBe(0);
      } finally {
        (globalThis as any).Set = OriginalSet;
      }
    });

    test('DEF-ARC-03.4: FlagshipManager.update() freezes subsystems when gameState is GameState.SHOP', () => {
      const flagship = new FlagshipManager();
      const player = new Player(600, 800);
      const shopContext = createMockFlagshipContext(player, GameState.SHOP);

      let customSubsystemUpdated = false;
      const testSubsystem: IFlagshipSubsystem = {
        id: 'test_shop_freeze',
        init: () => {},
        update: () => {
          customSubsystemUpdated = true;
        },
        drawBackground: () => {},
        drawWorld: () => {},
        drawForeground: () => {},
      };

      flagship.registerSubsystem(testSubsystem);
      flagship.update(0.016, shopContext);

      // Subsystems must not update during SHOP state!
      expect(customSubsystemUpdated).toBe(false);

      // In PLAYING state, subsystems update normally
      const playContext = createMockFlagshipContext(player, GameState.PLAYING);
      flagship.update(0.016, playContext);
      expect(customSubsystemUpdated).toBe(true);
    });

    test('DEF-ARC-03.5: Enemy linear and radial gradients are cached when position movement is within 1.5px', () => {
      const normalEnemy = new Enemy(100, 100, 600, 1, EnemyType.NORMAL);
      const sniperEnemy = new Enemy(100, 100, 600, 1, EnemyType.SNIPER);
      let linearCount = 0;
      let radialCount = 0;

      const baseCtx = createMockCanvas().getContext('2d') as any;
      const mockCtx: any = {
        ...baseCtx,
        createLinearGradient: () => {
          linearCount++;
          return { addColorStop: () => {} };
        },
        createRadialGradient: () => {
          radialCount++;
          return { addColorStop: () => {} };
        },
      };

      // First draw creates radial gradient for normal mob and linear gradient for sniper mob
      normalEnemy.draw(mockCtx);
      sniperEnemy.draw(mockCtx);
      expect(radialCount).toBeGreaterThan(0);
      expect(linearCount).toBeGreaterThan(0);
      const initialRadial = radialCount;
      const initialLinear = linearCount;

      // Draw again without moving -> gradient must be reused from cache!
      normalEnemy.draw(mockCtx);
      sniperEnemy.draw(mockCtx);
      expect(radialCount).toBe(initialRadial);
      expect(linearCount).toBe(initialLinear);

      // Draw again after sub-pixel movement (0.5px) -> gradient still reused
      normalEnemy.position.x += 0.5;
      sniperEnemy.position.x += 0.5;
      normalEnemy.draw(mockCtx);
      sniperEnemy.draw(mockCtx);
      expect(radialCount).toBe(initialRadial);
      expect(linearCount).toBe(initialLinear);

      // Move > 1.5px -> gradient refreshed
      normalEnemy.position.x += 5.0;
      sniperEnemy.position.x += 5.0;
      normalEnemy.draw(mockCtx);
      sniperEnemy.draw(mockCtx);
      expect(radialCount).toBeGreaterThan(initialRadial);
      expect(linearCount).toBeGreaterThan(initialLinear);
    });

  });

  // ==========================================================================
  // DEF-ARC-04: Master GainNode & Audio Lifecycle Management
  // ==========================================================================
  test.describe('DEF-ARC-04: Master GainNode & Audio Lifecycle Management', () => {
    let originalWindow: any;

    test.beforeAll(() => {
      originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        AudioContext: MockAudioContext as any,
      };
    });

    test.afterAll(() => {
      (globalThis as any).window = originalWindow;
    });

    test('DEF-ARC-04.1: SoundManager.init() sets up masterGain connected to audioCtx.destination', () => {
      const sound = new SoundManager();
      sound.init();

      const masterGain = sound.getMasterGain();
      const analyser = sound.getAnalyser();
      const audioCtx = sound.getAudioContext();

      expect(masterGain).not.toBeNull();
      expect(analyser).not.toBeNull();
      expect(audioCtx).not.toBeNull();

      // Analyser connects to masterGain, masterGain connects to destination
      expect((analyser as any).connectedTo).toBe(masterGain);
      expect((masterGain as any).connectedTo).toBe(audioCtx!.destination);
    });

    test('DEF-ARC-04.2: setMuted(true) sets masterGain to 0 and setMuted(false) restores to 1', () => {
      const sound = new SoundManager();
      sound.init();
      const masterGain = sound.getMasterGain()!;

      expect(masterGain.gain.value).toBe(1);

      sound.setMuted(true);
      expect(sound.isMuted).toBe(true);
      expect(masterGain.gain.value).toBe(0);

      sound.setMuted(false);
      expect(sound.isMuted).toBe(false);
      expect(masterGain.gain.value).toBe(1);
    });

    test('DEF-ARC-04.3: toggleMute() toggles masterGain value between 0 and 1', () => {
      const sound = new SoundManager();
      sound.init();
      const masterGain = sound.getMasterGain()!;

      sound.toggleMute();
      expect(sound.isMuted).toBe(true);
      expect(masterGain.gain.value).toBe(0);

      sound.toggleMute();
      expect(sound.isMuted).toBe(false);
      expect(masterGain.gain.value).toBe(1);
    });

    test('DEF-ARC-04.4: suspend() transitions AudioContext to suspended state and resume() transitions to running', async () => {
      const sound = new SoundManager();
      sound.init();
      const audioCtx = sound.getAudioContext()!;

      expect(audioCtx.state).toBe('running');

      await sound.suspend();
      expect(audioCtx.state).toBe('suspended');

      await sound.resume();
      expect(audioCtx.state).toBe('running');
    });

    test('DEF-ARC-04.5: destroy() closes AudioContext and cleans up masterGain and analyser', async () => {
      const sound = new SoundManager();
      sound.init();
      const audioCtx = sound.getAudioContext()!;

      await sound.destroy();
      expect(audioCtx.state).toBe('closed');
      expect(sound.getMasterGain()).toBeNull();
      expect(sound.getAnalyser()).toBeNull();
      expect(sound.getAudioContext()).toBeNull();
    });

  });

});

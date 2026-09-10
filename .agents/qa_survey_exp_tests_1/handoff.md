# Handoff Report: Test Infrastructure Explorer (qa_survey_exp_tests_1)

## Executive Summary
This investigation surveyed the test infrastructure, Playwright configuration, dev server operational parameters, and autonomous headless playtesting capabilities for the Water Invader project. The codebase is backed by an exceptionally mature testing framework, including a 1D Potential Field Evasion bot engine (`SwarmBotEngine`) and a non-intrusive runtime telemetry collector (`telemetry_stress_collector.ts`). The project compiles cleanly (`npx tsc --noEmit` and `npm run build` pass with 0 errors), and the master 12 Flagship features suite (`tests/20_flagship_12_features.spec.ts`) passed 13/13 tests cleanly in 13.7s. Complete recommendations are provided below to coordinate the upcoming 30+ agent playtest swarm across 6 parallel functional streams.

---

## 1. Observation

### 1.1 `package.json` Scripts & Dependencies
From `/Users/user/src/water-invader/package.json` (lines 5–28):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "playwright test",
  "test:ci": "playwright test --ignore-snapshots"
}
```
- Runtime: Node.js `v25.8.1` on Darwin arm64.
- Core dependencies: Next.js `16.3.1`, React `19.2.8`, TailwindCSS `^4`.
- Dev dependencies: `@playwright/test ^1.62.1`, TypeScript `^5`, ESLint `^9`.

### 1.2 Build & Static Analysis Verification
- `npx tsc --noEmit`: Exited with code `0` (zero TypeScript errors).
- `npm run build`:
  - Compiled successfully in 495ms (Next.js Turbopack).
  - Type-checking completed in 816ms.
  - Generated static routes (`/`, `/_not-found`, `/manifest.webmanifest`) in 218ms.
  - Exited with code `0`.

### 1.3 Dev Server & Port Configuration
- Executed `lsof -i :3000`: Exited with code `1` (port 3000 is currently free; no running Next.js dev server).
- In `/Users/user/src/water-invader/playwright.config.ts` (lines 18–35):
  ```typescript
  use: {
    baseURL: process.env.TARGET_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 900 },
  },
  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  }
  ```
  - Playwright automatically starts `npm run dev` if port 3000 is inactive.
  - `reuseExistingServer: true` allows an externally launched background daemon (`npm run dev`) to be instantly reused without cold-start overhead.
  - `workers: 1` by default; can be overridden via CLI (`--workers=N`) or environment variable.
  - Benchmark folder is excluded from regular runs by default: `testIgnore: ['**/benchmark/**']`.

### 1.4 Test Suite Inventory
The repository contains **74+ `.spec.ts` test files** in `/Users/user/src/water-invader/tests/`, categorized into:
1. **Core Feature & Milestone Suites**:
   - `01_ui_and_controls.spec.ts` through `06_shop_economy_max_upgrades.spec.ts`
   - `12_extreme_difficulty_and_crises.spec.ts`, `13_qol_and_crisis_mechanics.spec.ts`
   - `14_responsive_warning_background_and_contrast.spec.ts`
   - `15_endgame_crisis_12_archetypes.spec.ts`, `16_homing_missile_combat.spec.ts`
   - `17_dynamic_backgrounds_and_threat_signifiers.spec.ts`
   - `18_allied_reinforcements_and_roles.spec.ts`, `19_barricade_saboteur_and_repair.spec.ts`
   - `20_flagship_12_features.spec.ts` (Master integration test for all 12 flagship systems)
2. **Adversarial & Edge-Case Suites**:
   - `adversarial_flagship_state_transitions.spec.ts` (Revive mechanics, boss multi-part destruction)
   - `bughunt_ui_responsive_viewports.spec.ts` (Aspect ratio, touch clearance, zero overflow)
   - `bughunt_physics_adversarial_stress.spec.ts` (Finite coordinates, collision stability)
3. **Stress, Swarm & Telemetry Infrastructure** (`tests/stress/`):
   - `swarm_bot_engine.ts` (809 lines): Zero-latency autonomous bot brain using 1D Potential Field Raymarching, bullet Time-To-Impact (TTI) evasion, barricade shadowing occlusion, diver collision avoidance, offensive target priority, and auto-shopping.
   - `telemetry_stress_collector.ts` (1140 lines): In-page monitoring of FPS, stutters (>33ms, >50ms), freezes (>1000ms), `performance.memory` heap slope (MB/min), active Web Audio node tracking (oscillator/gain lifecycle leaks), entity counts, and unhandled window exceptions.
   - `endless_survival_swarm.spec.ts`: Playwright runner executing autonomous bot survival sessions, high-density projectile bursts, and exporting structured JSON reports (`test-artifacts/stress_results.json`).
   - `challenger_audio_perf_stress.spec.ts`: Web Audio node stability under 200+ particle explosions & 100+ SFX bursts in <1s, muted/unmuted switching, and autoplay-blocked states.
4. **Benchmark Suite** (`tests/benchmark/`):
   - `automated_runner.spec.ts`, `bot_heuristics.ts`, `telemetry_collector.ts`, `baseline_results.json`.

### 1.5 Execution of Master Flagship Suite
Executed command:
`npx playwright test tests/20_flagship_12_features.spec.ts`
Result:
```
Running 13 tests using 1 worker
  ✓   1 FLAGSHIP-00: All 12 Flagship subsystems instantiated, mounted, and registered in FlagshipManager (1.1s)
  ✓   2 FLAGSHIP-01: Cavitation Torpedo [C] fires ordnance, consumes ammo, and supports remote detonation (915ms)
  ✓   3 FLAGSHIP-02: Bioluminescent Laser [Space] heats up thermodynamic engine and [P] deploys Refraction Prism (893ms)
  ✓   4 FLAGSHIP-03: Hydraulic Harpoon [H] launches pneumatic dart and [Shift] triggers winch (872ms)
  ✓   5 FLAGSHIP-04: Hydrothermal Vents & Ocean Currents update in environment layers (846ms)
  ✓   6 FLAGSHIP-05: Biolapse Darkness Cycle [L] headlight, [V] high-beam, and [B] acoustic sonar ping (895ms)
  ✓   7 FLAGSHIP-06: Modular Submersible Chassis maintains 6-axis radar profiles and selection (893ms)
  ✓   8 FLAGSHIP-07: Veteran Crew Synergy Deck abilities trigger on hotkeys [1], [2], [3], [4] (871ms)
  ✓   9 FLAGSHIP-08: Hadal Bio-Horrors unit spawning and epigenetic damage telemetry (886ms)
  ✓  10 FLAGSHIP-09: Automaton Shield Phalanx drone linking and grid dampening (872ms)
  ✓  11 FLAGSHIP-10: Apex Boss Kraken Prime initiates 12,000 EHP encounter with 8 tentacles (873ms)
  ✓  12 FLAGSHIP-11: Roguelike Endless Mode (Endless Descent) DAG generation and ballast purge (902ms)
  ✓  13 FLAGSHIP-12: Sonar/Hydrophone sensory suite rotates sweep beam and generates stress fractures (871ms)

  13 passed (13.7s)
```

### 1.6 Architectural Canvas & Responsiveness Invariants
- `src/game/GameManager.ts` (lines 161–162):
  ```typescript
  public readonly logicalWidth: number = 600;
  public readonly logicalHeight: number = 800;
  ```
- `src/components/game-canvas.tsx` (lines 1241–1248):
  ```tsx
  <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-2 sm:border-4 border-blue-900 shadow-2xl bg-slate-900">
    <CanvasCore canvasRef={canvasRef} ... />
    <TopHUD ... />
  ```
- `src/components/game-canvas.tsx` (lines 1460–1468):
  Mobile controls (`[data-testid="mobile-controls-wrapper"]`) are placed outside and below the canvas container.
- Verification in `bughunt_ui_responsive_viewports.spec.ts` confirms:
  1. Canvas aspect ratio is maintained at `0.75` (width/height between 0.70 and 0.80).
  2. Canvas internal bitmap buffer is strictly `600 * dpr` by `800 * dpr`.
  3. No horizontal scrollbar (`document.documentElement.scrollWidth <= clientWidth + 1`).
  4. Crisis warning banner boundaries match canvas bounding box within 1.5px subpixel tolerance.

---

## 2. Logic Chain

1. **Build & Type Soundness**:
   - `npm run build` and `npx tsc --noEmit` pass with zero errors, confirming that all 12 flagship features, crises, and UI elements compile without structural type defects.
2. **Subsystem Registrations on Window**:
   - `GameManager.ts:190` attaches `(window as any).flagshipManager` and `(window as any).gameManager`.
   - `FLAGSHIP-00` verifies all 12 subsystem properties (`cavitationTorpedo`, `prismLaser`, `hydraulicHarpoon`, `hydrothermalVents`, `biolapseDarkness`, `modularChassis`, `crewDeck`, `bioHorror`, `automatonPhalanx`, `apexBoss`, `endlessDescent`, `sonarRenderer`) exist and are accessible during runtime.
3. **Headless & Dev Server Mechanics**:
   - `playwright.config.ts` handles automated web server launching on port 3000.
   - Starting a persistent dev server (`npm run dev`) before parallel swarm execution eliminates web server startup contention when running concurrent browser sessions.
4. **Input Injection Feasibility**:
   - Keyboard events can be dispatched via Playwright's native API (`page.keyboard.press('c')`, `page.keyboard.down('Shift')`) or through in-page dispatch (`gm.handleKeyDown(key)`).
   - Pointer & touch interactions can be simulated via `page.mouse.click()` or `page.mouse.down()/move()/up()` on the canvas, triggering harpoon grappling, cavitation torpedo launches, and Endless Descent node/boon selection.
5. **Runtime Telemetry & Error Catching**:
   - Playwright page listeners (`page.on('console')`, `page.on('pageerror')`) capture console warnings and unhandled exceptions.
   - `telemetry_stress_collector.ts` provides deep in-engine instrumentation for memory leak slopes (`usedJSHeapSize` rate in MB/min) and Web Audio node leaks (`activeOscillators + activeGains`).
6. **Responsiveness Invariant Guarantee**:
   - The user rule strictly forbids altering `logicalWidth` (600) or `logicalHeight` (800).
   - The existing layout accomplishes full multi-device adaptability (iPhone SE, iPhone 14, iPad, Desktop 1080p) strictly via CSS `aspect-[3/4]` and container bounds.

---

## 3. Caveats

1. **Autoplay Policies & Web Audio in Headless Mode**:
   - In headless Chromium, Web Audio works without hardware audio output. Autoplay policies require user interaction before `AudioContext.state` transitions from `'suspended'` to `'running'`. Clicking `'START GAME'` satisfies this gesture. In non-interactive tests, calling `soundManager.init()` programmatically handles context resumption.
2. **Long-Running Heap Stability**:
   - Standard Playwright tests run for 10–60 seconds. A true 10-minute endurance session requires using `SwarmBotEngine` with `telemetry_stress_collector` to calculate long-term heap slope.
3. **Multi-Worker Concurrency**:
   - `playwright.config.ts` currently sets `workers: 1`. When scaling to the 30+ swarm, Playwright tests should be run with explicit worker counts (e.g. `--workers=4` or `--workers=6`) or partitioned by stream to avoid CPU resource starvation on macOS.

---

## 4. Conclusion & Test Harness Recommendations

### 4.1 Test Harness Architecture for 30+ Agent Swarm

To maximize coverage across all 12 Flagship Features and prevent overlapping test pollution, organize the 30+ playtest agents into **6 Specialized Functional Streams** (5 agents per stream):

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                      30+ AGENT PLAYTEST SWARM HARNESS                         │
├─────────────────┬───────────────────────────────────┬─────────────────────────┤
│ Stream          │ Target Flagship Features          │ Test Harness Pattern    │
├─────────────────┼───────────────────────────────────┼─────────────────────────┤
│ Stream A        │ 1. Cavitation Torpedo             │ Playwright Key/Pointer  │
│ (Weapons)       │ 2. Prism Laser                    │ + Projectile Saturation │
│                 │ 3. Hydraulic Harpoon              │ & Winch Physics E2E     │
├─────────────────┼───────────────────────────────────┼─────────────────────────┤
│ Stream B        │ 4. Hydrothermal Vents             │ Environment Layering &  │
│ (Hazards)       │ 5. Biolapse Darkness Cycle        │ Luminance/Contrast      │
│                 │                                   │ Canvas Pixel Sampler    │
├─────────────────┼───────────────────────────────────┼─────────────────────────┤
│ Stream C        │ 6. Modular Chassis                │ State Transition &      │
│ (Progression)   │ 7. Crew Synergy Deck              │ Hotkey Verification     │
│                 │                                   │ ([1][2][3][4] Abilities)│
├─────────────────┼───────────────────────────────────┼─────────────────────────┤
│ Stream D        │ 8. Mutating Bio-Horror            │ Entity Lifecycle &      │
│ (Factions/Boss) │ 9. Automaton Shield Phalanx       │ Boss Multi-Phase        │
│                 │ 10. Apex Boss Kraken Prime        │ 12,000 EHP Destruction  │
├─────────────────┼───────────────────────────────────┼─────────────────────────┤
│ Stream E        │ 11. Roguelike Endless Mode        │ In-Page SwarmBotEngine  │
│ (Modes/Sensory) │ 12. Sonar/Hydrophone UI           │ + Telemetry Collector   │
│                 │ + SoundManager Web Audio          │ (Audio/Memory Leaks)    │
├─────────────────┼───────────────────────────────────┼─────────────────────────┤
│ Stream F        │ Responsive CSS Layout             │ Multi-Viewport Matrix   │
│ (Viewports)     │ (Mobile SE, iPhone, iPad, Desktop)│ (Bounding Box, Overflow,│
│                 │ 600x800 Canvas Invariant          │ Touch Target Clearance) │
└─────────────────┴───────────────────────────────────┴─────────────────────────┘
```

### 4.2 Standard Automated Harness Template for Swarm Workers
Each playtest agent script should follow this battle-tested pattern:

```typescript
import { test, expect } from '@playwright/test';
import { attachTelemetryToPage, stopTelemetryAndCollectFinal } from './stress/telemetry_stress_collector';

test('SWARM: Feature Verification with Zero-Error & Zero-Leak Invariants', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('_next/hmr')) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // 1. Attach Telemetry
  await attachTelemetryToPage(page, {
    sampleIntervalMs: 50,
    audioNodeLeakThreshold: 30,
    frameDropThresholdFps: 30,
  });

  // 2. Start Game
  await page.locator('button', { hasText: 'START GAME' }).click();
  await page.waitForFunction(() => (window as any).gameManager && (window as any).flagshipManager);

  // 3. Trigger Subsystem Actions (e.g. Cavitation Torpedo)
  await page.keyboard.press('c');
  await page.waitForTimeout(1000);

  // 4. Collect Final Telemetry & Assert Invariants
  const results = await stopTelemetryAndCollectFinal(page, 'swarm_run_01');
  
  // Invariant Checks
  expect(consoleErrors).toHaveLength(0);
  expect(results.anomalies.filter(a => a.severity === 'CRITICAL')).toHaveLength(0);
  expect(results.memorySummary.growthRateMbPerMin).toBeLessThan(15.0);
  expect(results.audioSummary.peakActiveNodes).toBeLessThanOrEqual(30);
});
```

---

## 5. Verification Method

To independently verify these findings, run the following commands:

1. **Verify TypeScript compilation**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected: Exits with code 0 and no output.*

2. **Verify Next.js Production Build**:
   ```bash
   npm run build
   ```
   *Expected: Static generation of all routes in ~2s, exit code 0.*

3. **Verify Master 12 Flagship Features Suite**:
   ```bash
   npx playwright test tests/20_flagship_12_features.spec.ts
   ```
   *Expected: 13/13 tests pass in under 15s.*

4. **Verify Viewport Responsiveness Suite**:
   ```bash
   npx playwright test tests/bughunt_ui_responsive_viewports.spec.ts
   ```
   *Expected: All viewport configurations conform to aspect ratio and zero horizontal overflow.*

5. **Verify Autonomous Swarm Survival & Telemetry**:
   ```bash
   npx playwright test tests/stress/endless_survival_swarm.spec.ts
   ```
   *Expected: Swarm bot runs multi-wave combat, collects telemetry, and outputs `test-artifacts/stress_results.json`.*

### Invalidation Conditions
- Any TypeScript compile error in `src/` or `tests/`.
- Failure in `tests/20_flagship_12_features.spec.ts`.
- Any mutation of `logicalWidth` or `logicalHeight` in `src/game/GameManager.ts` or `src/game/Enemy.ts`.
- Port 3000 occupied by an unkillable hanging process.

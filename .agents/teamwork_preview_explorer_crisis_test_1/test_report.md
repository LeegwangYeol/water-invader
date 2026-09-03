# Testing, Simulation & Balancing Infrastructure Report: Water Invader Crisis System

## Executive Summary
This report presents an in-depth investigation of the testing, simulation, and balancing infrastructure of **Water Invader** to support the implementation and verification of the **Stellaris-Style End-Game Crisis System** (Milestone R1–R3). 

Key findings:
1. **Existing Test Topology**: 440 automated tests across 47 spec files in `tests/`, utilizing Playwright for both browser-level E2E tests and headless unit tests via mock canvas stubs.
2. **State Injection Patterns**: Reliable runtime manipulation via `(window as any).gameManager` and associated entity constructors (`Enemy`, `Bullet`, `Helper`, `Faction`), enabling arbitrary stage and upgrade mocks in `< 5ms`.
3. **Simulation Infrastructure**: Pre-existing 1,497-line headless Monte Carlo balance engine (`scripts/simulate_balance.ts`) and autonomous swarm bot telemetry runner (`scripts/run_swarm_endurance.ts`).
4. **Calculated Player Max DPS**: Sustained single-target DPS reaches **$56.67\text{ DPS}$ (0 stress)** to **$156.67\text{ DPS}$ (100 stress)**, with theoretical multi-target piercing spikes of **$756.67\text{ aggregate DPS}$**.
5. **Crisis Survivability Constraint**: While a standard Stage 15 Boss (675 HP) is eliminated in $4.31\text{s} - 6.75\text{s}$, the End-Game Crisis requires **$\ge 2,000 - 3,500\text{ EHP}$** (or defensive phase mechanics) to survive $\ge 15.0\text{s} - 30.0\text{s}$ against max-upgraded player firepower.

---

## 1. Examination of Existing Playwright Test Infrastructure

### 1.1 Test Suite Organization & Topology
The test infrastructure is structured into a 5-tier architecture:
- **Tier 1 (Feature Coverage)**: UI & controls (`01_ui_and_controls.spec.ts`), vector rendering (`02_rendering_and_vector_art.spec.ts`), core mechanics (`03_game_mechanics.spec.ts`), wave progression (`04_multiwave_progression.spec.ts`), 3-way faction combat (`05_three_way_battle.spec.ts`), shop upgrades (`06_shop_economy_max_upgrades.spec.ts`), and crisis events (`12_extreme_difficulty_and_crises.spec.ts`, `12_crisis_director_e2e.spec.ts`).
- **Tier 2 (Boundary & Corner Cases)**: Edge clamping, off-screen projectile GC, EMP restoration lifecycle, zero soft-lock wave transitions.
- **Tier 3 (Cross-Feature Combinations)**: 3-way clash with EMP weapon suppression, max-upgraded piercing against high-density hordes.
- **Tier 4 (Real-World E2E Scenarios)**: Multi-wave progression (Wave 1 to Boss wave to Stage 10+ crisis survival).
- **Adversarial & Unit Verification**: `tests/unit/physics_and_math.test.ts` (570 lines), `tests/unit/crisis_director_m2.test.ts` (275 lines), and 20+ adversarial challenger suites.

### 1.2 Runner Configuration (`playwright.config.ts`)
```typescript
export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/benchmark/**'],
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  outputDir: 'test-artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.TARGET_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

### 1.3 State Injection & Mocking Mechanisms
Two complementary patterns are established across the repository:

#### Pattern A: Browser-Level Runtime State Injection
In browser tests, `page.evaluate()` directly manipulates the `window.gameManager` singleton exposed by `src/components/game-canvas.tsx`:
```typescript
await page.evaluate(() => {
  const gm = (window as any).gameManager;
  gm.level = 15;
  gm.state = 'PLAYING';
  gm.enemies = [];
  gm.player.hp = 5;
  gm.player.multiShot = 5;
  gm.player.piercing = 5;
  gm.player.baseFireRate = 0.1;
  gm.updateScoreUI();
  gm.updateUpgradesUI();
});
```

#### Pattern B: Headless Mock Canvas Unit Testing
For sub-millisecond execution without browser navigation overhead, tests in `tests/unit/` instantiate `GameManager` using a stubbed 2D context:
```typescript
function createMockCanvas(width = 600, height = 800): HTMLCanvasElement {
  return {
    width,
    height,
    getContext: () => ({
      save: () => {}, restore: () => {}, scale: () => {}, translate: () => {},
      beginPath: () => {}, closePath: () => {}, moveTo: () => {}, lineTo: () => {},
      arc: () => {}, fill: () => {}, stroke: () => {}, fillRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      measureText: () => ({ width: 50 }),
    }),
  } as unknown as HTMLCanvasElement;
}
```

---

## 2. Investigation of Previous Balance Simulations & Stress Tests

### 2.1 Headless Monte Carlo Simulation Engine (`scripts/simulate_balance.ts`)
- **Architecture**: A 1,497-line standalone simulation runner modeling discrete-event combat frames (60 FPS tick integration).
- **Player Loadout Profiles**:
  - `BASELINE`: HP 3, Fire Rate 0.5s, Multi-Shot 1, Piercing 1, 0 Drones.
  - `MID_TIER`: HP 4, Fire Rate 0.3s, Multi-Shot 2, Piercing 2, 1 Drone.
  - `MAX_UPGRADE`: HP 5, Fire Rate 0.1s, Multi-Shot 5, Piercing 5, 3 Drones (Fighter, Repairer, Tank).
- **Skill Profiles**:
  - `NOVICE`: 50% accuracy, 50% normal evasion, 25% elite evasion, 70% suppression vulnerability.
  - `AVERAGE`: 75% accuracy, 72% normal evasion, 50% elite evasion, 35% suppression vulnerability.
  - `EXPERT`: 90% accuracy, 86% normal evasion, 68% elite evasion, 15% suppression vulnerability.
- **Statistical Outputs**: Computes Win Rate, 95% Wilson Confidence Intervals, Average Time to Clear (TTC), Average Player DPS, Incoming Enemy DPS, and EHP Depletion Rate across 100+ runs per stage.

### 2.2 Swarm Bot Telemetry Suite (`tests/stress/`, `scripts/run_swarm_endurance.ts`)
- Implements real-time bot heuristics prioritizing:
  1. Low-Y hostiles ($Y > 500\text{px}$)
  2. Diving enemies and Bosses
  3. Barricade protection positioning
  4. Projectile avoidance vector calculation
- Collects continuous telemetry on frame budget ($< 16.6\text{ms}$ per tick), active entity counts, bullet collisions, and memory usage.

---

## 3. Crisis Mechanics & Player DPS Mathematical Analysis

### 3.1 Max-Level Player Firepower Equations
Let the player upgrades be at maximum level:
- Base fire rate: $T_{\text{base}} = 0.100\text{ s}$ ($10\text{ shots/s}$)
- Stress scaling factor: $S \in [0, 100]$
- Effective fire period: 
  $$T_{\text{eff}}(S) = \frac{T_{\text{base}}}{1 + \frac{S}{50}} \implies \begin{cases} 0.100\text{ s} & (S=0, f = 10\text{ Hz}) \\ 0.050\text{ s} & (S=50, f = 20\text{ Hz}) \\ 0.0333\text{ s} & (S=100, f = 30\text{ Hz}) \end{cases}$$
- Multi-shot projectile count: $N = 5$
- Bullet damage: $D = 1$
- Helper Fighter drone: 1 shot of 2 damage every $0.3\text{ s} \implies \text{DPS}_{\text{helper}} = \frac{2}{0.3} \approx 6.67\text{ DPS}$
- Helper Tank & Repairer: EHP absorption and active barricade/hull maintenance.

#### Single-Target Focused Sustained DPS:
$$\text{DPS}_{\text{single}}^{\text{min}} = \frac{5 \times 1}{0.100} + 6.67 = 56.67\text{ DPS}$$
$$\text{DPS}_{\text{single}}^{\text{max}} = \frac{5 \times 1}{0.0333} + 6.67 = 156.67\text{ DPS}$$
$$\overline{\text{DPS}}_{\text{single}} \approx 100.0\text{ DPS (under nominal combat stress)}$$

#### Multi-Target Piercing Capacity:
With Piercing Lv. 5, each bullet penetrates up to 5 overlapping targets:
$$\text{DPS}_{\text{aggregate}}^{\text{max}} = 5 \times 5 \times 30 + 6.67 = 756.67\text{ aggregate DPS}$$

### 3.2 Vulnerability of Standard Bosses at Stage 15
Stage 15 Standard Boss HP formula from `Enemy.ts`:
$$\text{HP}_{\text{Boss}}(15) = 50 + 15 \times 25 + \lfloor(15 - 5)^2 \times 2.5\rfloor = 50 + 375 + 250 = 675\text{ HP}$$
Time-to-kill against max-level player:
$$\text{TTK}_{\text{Boss}} = \frac{675\text{ HP}}{100\text{ DPS}} \approx 6.75\text{ seconds (or } 4.31\text{s under max stress)}$$
**Conclusion**: A standard Boss cannot serve as an End-Game Crisis because a maxed player obliterates it in under 7 seconds.

### 3.3 End-Game Crisis Survivability Requirements
To ensure the Crisis provides an existential threat requiring active management over an extended battle duration:
- **Target Survival Time under uninhibited max player DPS**: $t_{\text{survival}} \ge 20.0\text{ to } 30.0\text{ seconds}$.
- **Required Crisis Event Total EHP**:
  $$\text{EHP}_{\text{Crisis}} \ge \overline{\text{DPS}}_{\text{single}} \times t_{\text{survival}} = 100\text{ DPS} \times 20\text{ s} = 2,000\text{ EHP}$$
  Under multi-entity / vanguard formation configurations, total encounter HP pool should be **$2,500 - 4,000\text{ HP}$**.
- **Defensive & Reality-Bending Mechanics**:
  1. Multi-phase shield barriers (e.g. dimensional anchors or regenerating plasma barriers).
  2. EMP / Suppression counter-waves (forcing player spread and temporary fire suppression).
  3. High-velocity escort vanguards intercepting player projectiles.

---

## 4. Testing Strategy Formulations

### 4.1 Playwright Test: Stage 15 Mock & Random Crisis Trigger
**Target File**: `tests/13_endgame_crisis_stage15.spec.ts`

**Key Verification Scenarios**:
1. **Mock Stage 15 Entry**:
   - Set `gm.level = 15; gm.state = 'PLAYING'; gm.crisisTimer = 0.05;`
   - Advance physics update `gm.update(0.1)` to trigger random crisis selection.
   - Assert `gm.crisisState.activeCrisis` is non-null and matches a valid `CrisisType`.
   - Assert `gm.crisisState.warningTimer > 0` and Warning Banner UI renders with alert text.
2. **Random Trigger Non-Crashing Verification**:
   - Run 25 randomized Stage 15 crisis activations across distinct seeds/evaluations.
   - Confirm zero unhandled exceptions, zero `NaN` coordinates, and bounded entity counts.
   - Verify active phase transition (`gm.update(2.1)`) correctly spawns crisis entities.
3. **End-to-End Wave Completion**:
   - Eliminate crisis hostiles (`gm.enemies.forEach(e => e.isDead = true)`).
   - Verify clean transition to `GameState.SHOP` without soft-locking.

### 4.2 Mathematical Proof & Automated Simulation Test for Crisis Survivability
**Target File**: `tests/unit/endgame_crisis_simulation.test.ts`

**Test Assertions**:
1. **Analytical DPS Mathematical Proof**:
   - Formally assert the calculated bounds of player DPS:
     - Minimum focused sustained single-target DPS $\ge 50.0\text{ DPS}$.
     - Maximum focused sustained single-target DPS $\le 160.0\text{ DPS}$.
     - Standard Stage 15 Boss TTK $\le 10.0\text{ seconds}$.
2. **Headless Combat Simulation Loop**:
   - Instantiate max-upgraded Player ($T_{\text{fire}} = 0.1\text{s}$, multi-shot 5, piercing 5, 3 drones) facing the End-Game Crisis entity/formation.
   - Run 60 FPS fixed-timestep loop (`dt = 1/60s`) where the player fires continuously at point-blank range with 100% accuracy.
   - Track elapsed time $t_{\text{kill}}$ until all Crisis entities reach 0 HP.
   - **Hard Assertion**: `expect(t_kill).toBeGreaterThanOrEqual(15.0);` (proves that even with perfect aim and maximum upgrades, the Crisis cannot be cleared in $< 15\text{ seconds}$).

### 4.3 Strategy for Preserving 100% Pass Rate Across Existing 440+ Tests
To maintain zero regression across the existing 440 tests:
1. **Enum & Contract Preservation**:
   - Retain all existing `EnemyType` (0–9) and `Faction` enum values. Append new Crisis types without modifying existing integer mappings.
   - Preserve existing `CrisisType` strings (`'TITAN_HORDE'`, `'ACID_STORM'`, `'SWARM_BLITZ'`, `'EMP_DISRUPTION'`, `'TOTAL_WAR'`). Add new End-Game Crisis types additively.
2. **Wave Scaling Backwards Compatibility**:
   - Waves 1–9 baseline scaling ($1 + \lfloor\text{level}/3\rfloor$) remains unchanged.
   - Waves 10–14 extreme difficulty equations remain unchanged.
   - Stage 15+ triggers the End-Game Crisis without mutating early wave formulas.
3. **Test Isolation**:
   - New tests reside in dedicated files (`tests/13_endgame_crisis_stage15.spec.ts` and `tests/unit/endgame_crisis_simulation.test.ts`).
   - Run verification via `npx playwright test` and `npm run build` (`npx tsc --noEmit`).

---

## 5. Actionable Implementation & Verification Matrix

| Area | Component | Implementation / Test Target | Verification Command |
|---|---|---|---|
| **E2E Test** | Stage 15 Random Crisis Mock | `tests/13_endgame_crisis_stage15.spec.ts` | `npx playwright test tests/13_endgame_crisis_stage15.spec.ts` |
| **Unit / Simulation** | Mathematical Proof & Survivability | `tests/unit/endgame_crisis_simulation.test.ts` | `npx playwright test tests/unit/endgame_crisis_simulation.test.ts` |
| **Monte Carlo Engine** | Stage 15+ Balance Calibration | `scripts/simulate_balance.ts` | `npx ts-node scripts/simulate_balance.ts` |
| **Full Regression** | 440+ Test Suite Integrity | Entire `tests/` directory | `npx playwright test` |
| **Build & Typecheck** | Next.js 16 / TypeScript 5 | Project Root | `npm run build` |


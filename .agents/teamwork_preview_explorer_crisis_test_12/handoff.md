# Crisis QA & Test Architecture Report: 12-Crisis Expansion

**Project**: Water Invader (Next.js / HTML5 Canvas / TypeScript)  
**Agent**: Crisis QA & Test Explorer (`teamwork_preview_explorer_crisis_test_12`)  
**Mission**: Comprehensive investigation of existing testing infrastructure and formulation of automated QA test requirements, statistical distribution tests, E2E specs, and build verification for the 12-Crisis Expansion.  
**Date**: 2026-09-03  

---

## 1. Observation

### 1.1 Test Infrastructure & Configuration
- **Testing Framework**: `@playwright/test` v1.62.1 configured in `/Users/user/src/water-invader/package.json` (lines 10-12, 19):
  ```json
  "scripts": {
    "test": "playwright test",
    "test:ci": "playwright test --ignore-snapshots"
  }
  ```
- **Playwright Configuration** (`/Users/user/src/water-invader/playwright.config.ts`, lines 4-36):
  - `testDir`: `'./tests'` (encompasses both integration specs in `tests/` and headless unit tests in `tests/unit/`).
  - `fullyParallel`: `false`, `workers`: `1` (deterministic sequential execution avoiding port conflicts and canvas race conditions).
  - `webServer`: Launches Next.js dev server on `http://localhost:3000` unless `SKIP_WEBSERVER=1` is passed in environment variables. Headless unit tests can be executed instantly with `SKIP_WEBSERVER=1 npx playwright test tests/unit/...`.
- **TypeScript & Build Tooling** (`package.json`, lines 6, 27):
  - Next.js: `16.3.1`, React: `19.2.8`, TypeScript: `^5`.
  - Type-check command: `npx tsc --noEmit` (executed cleanly with exit code 0 in ~1.8s).
  - Production build command: `npm run build` (`next build`).

### 1.2 Existing Crisis Unit Testing Architecture (`tests/unit/`)
1. **Structural & Balance Contract Testing** (`tests/unit/crisis_doubling.test.ts`):
   - **Enum & Metadata Integrity** (lines 63-88): Verifies `CrisisArchetype` keys and values match expectations and that each archetype has a populated `CRISIS_ARCHETYPE_CONFIGS` entry with name, subtitle, and HP fields.
   - **5,200 EHP Balance Contract** (lines 93-146):
     ```typescript
     // Total Encounter EHP strictly equals 5,200 EHP
     const totalEncounterEHP = leftRift.hp + rightRift.hp + sov.hullHp + sov.coreHp;
     expect(totalEncounterEHP).toBe(5200);
     ```
     Where `leftRift.hp = 600`, `rightRift.hp = 600`, `sov.hullHp = 2500`, and `sov.coreHp = 1500`.
   - **Multi-Phase State Machine** (lines 151-224): Validates transition flow:
     `INCURSION (3.0s warning)` $\rightarrow$ `PHASE_1_SHIELD (Sovereign invulnerable)` $\rightarrow$ Anchor destruction $\rightarrow$ `PHASE_2_HULL (Sovereign exposed)` $\rightarrow$ Hull depletion $\rightarrow$ `PHASE_3_CORE (35.0s Enrage clock)` $\rightarrow$ Core depletion $\rightarrow$ `DEFEATED`.
   - **Phase 1 Shield Invulnerability Contract** (lines 178-182): `crisis.sovereign!.takeDamage(300)` returns `0` damage absorbed while anchors are alive.
   - **Headless Vector Drawing Sanity** (lines 375-397): Employs `createMockCanvasContext()` (2D context mock) and validates that `crisis.draw(ctx, 600, 800)` executes across all archetypes and all phases without throwing exceptions.
   - **Collision & Routing** (lines 402-437): Verifies high-velocity `Bullet` routing via `crisis.handleBulletCollision(bullet, callback)` correctly damps piercing and deals damage to active colliders.

2. **Mathematical Combat Balance & Empirical Simulation** (`tests/unit/endgame_crisis_simulation.test.ts`):
   - **Discrete 60 FPS Simulation Loop** (lines 136-241): Executes a headless frame-by-frame combat simulation pitting a max-upgraded player (150-170 focused DPS with 3 Fighter drones) against the 5,200 EHP boss.
   - **Hard Survival Invariant** (lines 233-241): Formally proves the crisis survives $\ge 15.0$ seconds (empirically surviving ~30.5s under 100% stress overdrive), with Phase 1 surviving $\ge 3.0$s, Phase 2 $\ge 7.0$s, and Phase 3 $\ge 4.0$s.

3. **Spawning & Probability Stress Testing** (`tests/unit/crisis_adversarial_stress_m2.test.ts`):
   - **Stage 15 Milestone Priority** (lines 62-75): 1,000 trials verify Stage 15 always spawns the milestone Boss wave with 0 crisis incursion triggers.
   - **Stage 16 Non-Boss Random Trigger Rate** (lines 76-100): 1,000 trials verify empirical trigger rate is within 3-sigma bounds $[25\%, 35\%]$ centered on $p = 0.30$.
   - **Stage 18 Pity Trigger** (lines 102-127): 1,000 trials verify 100% guaranteed pity trigger at Stage 18.
   - **Single-Occurrence Invariant** (lines 195-215): 1,000 post-crisis wave spawns produce 0 secondary crisis triggers.
   - **Monte Carlo Distribution Test** (lines 217-246):
     ```typescript
     test('STRESS-1.6: Archetype random selection distributes across all 6 archetypes evenly', () => {
       const counts: { [arch: string]: number } = { ... };
       const NUM_TRIALS = 1500;
       for (let i = 0; i < NUM_TRIALS; i++) {
         const crisis = gm.triggerEndGameCrisis();
         counts[crisis.archetype]++;
       }
       // Expected rolls per archetype: 1500 / 6 = 250 (std dev ~14.4)
       // Assert > 120 per archetype
     });
     ```

### 1.3 Crisis Spawning Architecture in Engine (`src/game/`)
- **Archetype Roll in Engine** (`src/game/crisis/EndGameCrisis.ts`, lines 62-74):
  ```typescript
  if (archetype) {
    this.archetype = archetype;
  } else {
    const archetypes = [
      CrisisArchetype.VOID_SOVEREIGN,
      CrisisArchetype.ABYSSAL_LEVIATHAN,
      CrisisArchetype.CYBERNETIC_EXTERMINATOR,
      CrisisArchetype.CHRONO_DEVOURER,
      CrisisArchetype.SOLARIS_COLOSSUS,
      CrisisArchetype.NEBULA_PHANTASM,
    ];
    this.archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  }
  ```
  In the 12-crisis expansion, this array (or `Object.values(CrisisArchetype)`) expands to 12 distinct enum members, producing a uniform probability of $1/12 \approx 8.333\%$ per roll.
- **Wave Trigger Evaluation** (`src/game/GameManager.ts`, lines 396-403):
  ```typescript
  if (this.level >= 15 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
    const isPityTrigger = this.level >= 18;
    const isRandomTrigger = Math.random() < 0.30;
    if (isPityTrigger || isRandomTrigger) {
      this.triggerEndGameCrisis();
    }
  }
  ```

### 1.4 Playwright E2E Integration Testing (`tests/*.spec.ts`)
- **E2E DOM Selectors and Assertions** (`tests/13_endgame_crisis_e2e.spec.ts` & `tests/13_endgame_crisis_stage15.spec.ts`):
  - Warning Banner: `[data-testid="endgame-crisis-warning-banner"]` renders during `INCURSION` phase with title and countdown timer.
  - Active Phase HUD Badge: `[data-testid="endgame-crisis-active-badge"]` displays `PHASE 1: DIMENSIONAL SHIELD ACTIVE`, `PHASE 2: SOVEREIGN HULL EXPOSED`, or `PHASE 3: CORE OVERDRIVE (${timer}s)`.
  - Resolution & Intermission: Defeat triggers reward delivery (`+2000 score, +500 currency`) and modal `text=WAVE CLEARED` with `button:has-text("NEXT WAVE")`.
- **Responsive Viewport Decoupling** (`tests/14_responsive_warning_background_and_contrast.spec.ts`):
  - Validates warning banner matching canvas bounding box within 1.5px across Desktop HD, iPhone 12/13/14, iPhone SE, and iPad Mini without clipping or overlapping mobile controls.
  - Pixel luminance sampling verifies $\ge 7:1$ WCAG AAA projectile contrast.

---

## 2. Logic Chain

1. **Roster Expansion Scope**:
   - The user request requires doubling the crisis roster to exactly 12 distinct archetypes, uniformly distributed, with 0 errors on `npm run build` and `npx playwright test`.
   - Current codebase implements 6 archetypes (`VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`, `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, `NEBULA_PHANTASM`).
   - The 6 new archetypes designed by the Spec Miner (e.g. `NANITE_HARVESTER`, `PSIONIC_SHROUD`, `SINGULARITY_BEHEMOTH`, `BIOMORPHIC_SWARM`, `GLACIAL_OBLIVION`, `ANTIMATTER_DREADNOUGHT`) must integrate seamlessly into `src/game/crisis/types.ts`, `CrisisSovereign.ts`, `DimensionalRift.ts`, and `EndGameCrisis.ts`.

2. **Mathematical Uniformity & Statistical Rigor**:
   - For 12 archetypes, each has theoretical probability $p = 1/12 \approx 0.083333$.
   - Testing over $N = 12,000$ simulation trials yields an expected count of $E_i = N \cdot p = 1,000$ occurrences per archetype.
   - The binomial standard deviation is:
     $$\sigma = \sqrt{N \cdot p \cdot (1 - p)} = \sqrt{12000 \cdot \frac{1}{12} \cdot \frac{11}{12}} = \sqrt{916.667} \approx 30.276$$
   - Under Pearson's Chi-Square Goodness-of-Fit test:
     $$\chi^2 = \sum_{i=1}^{12} \frac{(O_i - E_i)^2}{E_i}$$
     Degrees of freedom $df = 12 - 1 = 11$.
     At significance level $\alpha = 0.01$, the critical chi-square value is $\chi^2_{0.01, 11} \approx 24.725$.
     At $\alpha = 0.001$, critical value is $\approx 31.264$.
   - By asserting $\chi^2 < 24.725$ AND bounding each archetype count between $850 \le O_i \le 1150$ ($> 4.95\sigma$ margin), we achieve definitive statistical verification of true uniform random distribution with $< 10^{-6}$ probability of false flakiness.

3. **Encounter Balance Invariance (5,200 EHP)**:
   - Every single one of the 12 archetypes must adhere to the immutable 5,200 EHP budget:
     $$\text{Total EHP} = \text{Rift}_1(600) + \text{Rift}_2(600) + \text{Hull}(2500) + \text{Core}(1500) = 5,200$$
   - A single automated unit test looping over `Object.values(CrisisArchetype)` will systematically instantiate all 12 archetypes and enforce this equation.

4. **Phase State Machine & Invulnerability Verification**:
   - For all 12 archetypes, Sovereign entity must be 100% immune to damage during Phase 1 (`takeDamage()` returns 0).
   - Once both anchors die, transition to Phase 2 must automatically set `isInvulnerable = false`.
   - Once hull hits 0, Phase 3 enrage countdown must engage.
   - Core depletion must trigger `CrisisPhase.DEFEATED`, invoke `callbacks.onDefeated(arch)`, set `isActive = false`, and prepare rewards.

5. **Headless & E2E Test Strategy**:
   - Headless unit tests (`tests/unit/crisis_expansion_12.test.ts` and `tests/unit/crisis_distribution_12.test.ts`) require 0 DOM / browser overhead, running in $< 1.5$s.
   - E2E Playwright specs (`tests/15_endgame_crisis_12_archetypes.spec.ts`) verify actual canvas rendering, warning banner DOM elements, HUD badge state updates, and intermission wave progression.

---

## 3. Test Suite Specification for 12-Crisis Expansion

### 3.1 Suite 1: Automated Unit Test Suite (`tests/unit/crisis_expansion_12.test.ts`)
| Test ID | Test Name | Purpose & Verification Logic |
|---|---|---|
| `EXP12-01` | Enum Count & Dictionary Completeness | Asserts `Object.keys(CrisisArchetype).length === 12`. Asserts `CRISIS_ARCHETYPE_CONFIGS` has valid entry for all 12 keys, each with non-empty `name`, `subtitle`, `primaryColor`, `secondaryColor`, `accentColor`, `coreGlowColor`, `riftHp === 600`, `sovereignHullHp === 2500`, `coreHp === 1500`, and `enrageTime === 35.0`. |
| `EXP12-02` | Strict 5,200 EHP Contract Across All 12 Archetypes | Instantiates `new EndGameCrisis(600, 800)` for each archetype. Asserts `riftAnchors.length === 2`, `leftRift.maxHp === 600`, `rightRift.maxHp === 600`, `sovereign.maxHullHp === 2500`, `sovereign.maxCoreHp === 1500`. Asserts `leftRift.hp + rightRift.hp + sovereign.hullHp + sovereign.coreHp === 5200`. |
| `EXP12-03` | 5-Phase State Machine Lifecycle Across All 12 Archetypes | Steps each archetype through `INCURSION` (3.0s warning) $\rightarrow$ `PHASE_1_SHIELD` (deflects damage, absorbs 0) $\rightarrow$ Anchor 1 kill (remains shielded) $\rightarrow$ Anchor 2 kill $\rightarrow$ `PHASE_2_HULL` (vulnerable, takes damage) $\rightarrow$ Hull kill $\rightarrow$ `PHASE_3_CORE` (35s enrage active) $\rightarrow$ Core kill $\rightarrow$ `DEFEATED` (`isActive === false`). |
| `EXP12-04` | Bespoke Phase 1 Anchor Mechanics for 6 New Archetypes | Verifies each new archetype's anchors have unique behaviors (e.g. projectile types, orbital defenses, tether lasers, healing pulses, or shield toggles). |
| `EXP12-05` | Archetype-Specific Attack Dispatching (Phase 2 & Phase 3) | Calls `executeArchetypeAttack()` for all 12 archetypes in Phase 2 and Phase 3, asserting non-empty bullet arrays and distinctive bullet colors, trajectories, and damage values. |
| `EXP12-06` | Headless Vector Drawing Sanity (12 Archetypes x 5 Phases) | Mocks `CanvasRenderingContext2D` and executes `crisis.draw(ctx, 600, 800)` across all $12 \times 5 = 60$ archetype/phase permutations, asserting zero thrown exceptions. |
| `EXP12-07` | High-Velocity Bullet Collision & Dynamic Node Routing | Fires player bullets at Left Anchor, Right Anchor, Shielded Sovereign, and Exposed Sovereign, confirming exact damage deduction, piercing reduction, score callbacks, and bullet deaths. |

### 3.2 Suite 2: Statistical Distribution & Monte Carlo Suite (`tests/unit/crisis_distribution_12.test.ts`)
| Test ID | Test Name | Formula & Assertion Criteria |
|---|---|---|
| `STAT12-01` | Monte Carlo 12,000-Trial Spawning Distribution | Runs $N = 12,000$ headless calls of `gm.triggerEndGameCrisis()` or `EndGameCrisis.startIncursion()`. Records frequency histogram $O_i$ for all 12 archetypes. |
| `STAT12-02` | Pearson's Chi-Square Goodness-of-Fit Test | Computes $\chi^2 = \sum_{i=1}^{12} \frac{(O_i - 1000)^2}{1000}$. Asserts $\chi^2 < 24.725$ ($df = 11$, $\alpha = 0.01$). |
| `STAT12-03` | Absolute Per-Archetype Bounds Verification | Asserts $850 \le O_i \le 1150$ for every archetype $i \in [1, 12]$ ($> 4.95\sigma$ margin). Proves 0 archetypes are starved and 0 are favored. |
| `STAT12-04` | Stage 15-18 Incursion Gating Invariants | Asserts Stage 15 has 0% crisis chance (boss wave priority), Stage 16 has $30\% \pm 5\%$ chance, and Stage 18 guarantees 100% pity incursion. |

### 3.3 Suite 3: Playwright E2E Integration Suite (`tests/15_endgame_crisis_12_archetypes.spec.ts`)
| Test ID | Test Name | Browser Interaction & Verification Steps |
|---|---|---|
| `E2E12-01` | Incursion Warning Banners for All 12 Archetypes | Loops through all 12 archetypes, triggers each via `(window as any).gameManager.triggerEndGameCrisis(arch)`. Verifies `[data-testid="endgame-crisis-warning-banner"]` appears, displays correct uppercase title, and countdown ticks down. |
| `E2E12-02` | Tri-Phase Active HUD Badge Updates | Advances time past 3.0s incursion to Phase 1, destroys anchors to enter Phase 2, damages hull to enter Phase 3. Asserts `[data-testid="endgame-crisis-active-badge"]` updates text accordingly. |
| `E2E12-03` | Full Boss Defeat, Reward Dispatch & Intermission Progression | Defeats crisis in browser; verifies `score += 2000`, `currency += 500`, DOM shows `text=WAVE CLEARED`, clicking `"NEXT WAVE"` advances to Stage 16 without error. |
| `E2E12-04` | Multi-Viewport Responsive Integrity | Tests rendering on Desktop (1280x800) and Mobile (390x844), asserting canvas wrapper containment and zero banner overflow. |
| `E2E12-05` | Zero Uncaught Browser Exceptions | Monitors `page.on('pageerror')` across 180 frames of active 12-crisis combat, asserting `errors.length === 0`. |

### 3.4 Suite 4: Build & Compilation Verification
| Verification Step | Command | Success Criteria |
|---|---|---|
| TypeScript Compilation | `npx tsc --noEmit` | Exit code 0, 0 type errors. |
| Next.js Production Build | `npm run build` | Exit code 0, successful static & dynamic page generation. |
| Fast Headless Unit Pass | `SKIP_WEBSERVER=1 npx playwright test tests/unit/` | All unit tests pass in $< 5.0$s. |
| Full E2E Playwright Pass | `npx playwright test` | All test suites pass cleanly. |

---

## 4. Caveats

1. **New Archetype Identifiers**: This QA specification defines the testing contracts, mathematical boundaries, and verification suites for 12 archetypes. The exact enum identifiers (e.g. `NANITE_HARVESTER` vs `GREY_TEMPEST`) must match between the Crisis Designer spec miner (`teamwork_preview_spec_miner_crisis_12`) and the Implementation team.
2. **Deterministic Random Seed in Tests**: While `Math.random()` with $N = 12,000$ trials has a $> 99.999\%$ theoretical pass rate within $[850, 1150]$, if desired, a seeded pseudo-random number generator (PRNG) or fixed seed can be supplied in test harness to guarantee $100.00\%$ deterministic repeatability.
3. **Hardware Acceleration**: Headless Playwright tests running via GitHub Actions / Linux CI use software rasterization (`--disable-gpu` / SwiftShader); Canvas 2D mock tests in `tests/unit/` do not rely on WebGL and are completely immune to GPU driver differences.

---

## 5. Conclusion

The existing test infrastructure in Water Invader is exceptionally well-architected, featuring fast headless unit test harnesses (`tests/unit/`), discrete 60 FPS numerical combat simulation engines, Monte Carlo probability verifiers, and multi-viewport Playwright E2E browser tests.

Expanding the End-Game Crisis system from 6 to 12 archetypes is completely covered by this 4-suite QA blueprint:
1. **Automated Unit Suite**: 12 archetypes, 5,200 EHP invariant, 5-phase state machine, anchor mechanics, vector draw sanity.
2. **Statistical Suite**: 12,000 Monte Carlo trials with formal Pearson's Chi-Square ($df=11, \alpha=0.01$) ensuring uniform 1/12 spawning.
3. **E2E Playwright Suite**: Warning banners, HUD badges, defeat rewards, wave progression, zero console errors.
4. **Build Check Gate**: `npx tsc --noEmit` and `npm run build` verification before any git commit or push.

---

## 6. Verification Method

To independently verify the existing test suite and execution performance:
```bash
# 1. Verify TypeScript type safety
npx tsc --noEmit

# 2. Run existing crisis unit tests headlessly (execution time < 1s)
SKIP_WEBSERVER=1 npx playwright test tests/unit/crisis_doubling.test.ts

# 3. Run existing crisis mathematical balance simulation
SKIP_WEBSERVER=1 npx playwright test tests/unit/endgame_crisis_simulation.test.ts

# 4. Run existing adversarial stress test (including 1,500 Monte Carlo rolls)
SKIP_WEBSERVER=1 npx playwright test tests/unit/crisis_adversarial_stress_m2.test.ts

# 5. Full production build test
npm run build
```

# Handoff Report: Testing, Simulation & Balancing Infrastructure for Crisis Events

## 1. Observation
- **Test Topology**: Confirmed 440 tests across 47 test files in `tests/`, configured in `playwright.config.ts` (single worker, sequential execution, 60s timeout, Next.js dev server at `http://localhost:3000`).
- **State Injection Points**: 
  - `(window as any).gameManager` is bound in `src/components/game-canvas.tsx:598`.
  - Constructors `Bullet`, `Enemy`, `Helper`, `Faction` are bound in `src/game/GameManager.ts:87-90`.
  - Level, player HP, multi-shot, piercing, fire rate, and crisis state can be overridden synchronously inside `page.evaluate()` or via headless `createMockCanvas` unit tests (`tests/unit/crisis_director_m2.test.ts`).
- **Existing Balance Tools**:
  - `scripts/simulate_balance.ts` (1,497 lines): Headless Monte Carlo engine modeling 60 FPS combat frames, player tiers (`BASELINE`, `MID_TIER`, `MAX_UPGRADE`), and skill profiles (`NOVICE`, `AVERAGE`, `EXPERT`).
  - `scripts/run_swarm_endurance.ts` (500 lines) and `tests/stress/swarm_bot_engine.ts`: Multi-worker browser stress bot telemetry runner.
- **Player Max-Level Firepower & Math**:
  - Base fire rate: $0.1\text{s}$ ($10\text{ volleys/s}$).
  - Stress multiplier (up to 100 stress): $0.1 / (1 + 100/50) = 0.0333\text{s}$ ($30\text{ volleys/s}$).
  - Multi-Shot: 5 bullets per volley.
  - Bullet Damage: 1 per hit (Helper Fighter: 2 damage / 0.3s $\approx 6.67\text{ DPS}$).
  - Single-Target Sustained DPS: $56.67\text{ DPS}$ (0 stress) to $156.67\text{ DPS}$ (100 stress), averaging $\sim 100\text{ DPS}$.
  - Multi-Target Piercing DPS: Up to $756.67\text{ aggregate DPS}$ against 5 overlapping targets.
  - Standard Stage 15 Boss HP ($675\text{ HP}$) time-to-kill: $4.31\text{s} - 6.75\text{s}$.

## 2. Logic Chain
1. **Observation 1**: Max-upgraded player sustained focused single-target DPS is $\sim 100\text{ DPS}$ ($56.67 - 156.67\text{ DPS}$).
2. **Observation 2**: Standard Stage 15 Boss has only $675\text{ HP}$, resulting in a Time-to-Kill of $\approx 4.31\text{s} - 6.75\text{s}$.
3. **Inference 1**: Standard bosses are trivialized in $< 7\text{s}$ by late-game upgrades. An End-Game Crisis must be fundamentally distinct in durability, scaling, and mechanics.
4. **Observation 3**: To survive $\ge 20.0\text{s}$ under continuous max-player DPS ($100\text{ DPS}$), the Crisis entity/swarm must possess at least $\text{EHP} \ge 100\text{ DPS} \times 20\text{s} = 2,000\text{ EHP}$, with total encounter pool around $2,500 - 4,000\text{ HP}$.
5. **Observation 4**: In `GameManager.ts`, `crisisTimer` is ticked during `PLAYING` state when `level >= 10`. Stage 15+ random trigger can be tested by injecting `level = 15; state = 'PLAYING'; crisisTimer = 0.05;` and ticking the game loop.
6. **Inference 2**: Unit tests using `createMockCanvas` can execute deterministic mathematical proofs and 60 FPS combat simulation loops in $< 10\text{ms}$, while Playwright browser tests verify DOM warning banners, HUD badges, and non-crashing random triggers.

## 3. Caveats
- **Browser Randomness in CI**: Random crisis selection must assert that the chosen crisis belongs to the valid `CrisisType` set rather than expecting a single deterministic string, unless `triggerCrisis(specificType)` is explicitly invoked.
- **Render Loop Jitter**: In browser E2E tests, `page.waitForTimeout` can fluctuate slightly under heavy CI loads; tests should favor deterministic state evaluations (`page.evaluate`) and Playwright web assertions (`toBeVisible`, `toContainText`) over fixed sleeps.

## 4. Conclusion
- A comprehensive testing and balance strategy has been formulated:
  1. `tests/13_endgame_crisis_stage15.spec.ts`: Playwright test mocking Stage 15, validating random Crisis triggers, warning banner transitions, and crash-free execution.
  2. `tests/unit/endgame_crisis_simulation.test.ts`: Automated simulation and mathematical proof asserting that the Crisis entity/event survives $\ge 15.0\text{s}$ against max-level player continuous point-blank DPS.
  3. Preservation of all existing 440 tests through additive enum expansion and backward-compatible wave scaling.
- Full details documented in `test_report.md`.

## 5. Verification Method
1. **Run Unit Simulation Test**:
   ```bash
   npx playwright test tests/unit/endgame_crisis_simulation.test.ts
   ```
2. **Run E2E Stage 15 Crisis Test**:
   ```bash
   npx playwright test tests/13_endgame_crisis_stage15.spec.ts
   ```
3. **Run Full 440+ Playwright Test Suite**:
   ```bash
   npx playwright test
   ```
4. **Compile & Typecheck Verification**:
   ```bash
   npm run build
   ```

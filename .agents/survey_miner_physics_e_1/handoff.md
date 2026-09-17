# Handoff Report: Stream E (Game Loop, Time Scaling, State Transitions & Physics Test Harnesses)

**Agent**: survey_miner_physics_e_1  
**Working Directory**: `/Users/user/src/water-invader/.agents/survey_miner_physics_e_1`  
**Handoff Type**: Hard (Task Complete)  
**Date**: 2026-09-17  

---

## 1. Observation

1. **Fixed-Step Accumulator Loop (`GameManager.ts:1212-1244`)**:
   - `FIXED_STEP = 1 / 60` (line 41).
   - `let frameTime = Math.max(0, (timestamp - this.lastTime) / 1000);` (line 1215).
   - Delta-t clamping: `if (frameTime > 0.1) frameTime = 0.1;` (lines 1219-1221).
   - Accumulator stepping: `while (this.accumulator >= this.FIXED_STEP) { this.update(this.FIXED_STEP); this.accumulator -= this.FIXED_STEP; if (this.state !== GameState.PLAYING) { this.accumulator = 0; break; } }` (lines 1233-1240).
   - In `update(deltaTime)`, all subsystems receive deterministic `FIXED_STEP` (1/60s).

2. **Tab Unfocus & Window Blur Handlers (`game-canvas.tsx:871-889`)**:
   - Window blur: `activePointerIdRef.current = null; lastPointerXRef.current = null; isDraggingRef.current = false; game.clearKeys();` (lines 871-876).
   - Visibility change: When `document.hidden === true`, keys and pointer drags are cleared. AudioContext resumes on return if unmuted.
   - Gameplay does not forcibly pause during tab backgrounding; instead, browser rAF throttling and the 100ms `frameTime` clamp prevent excessive sub-step accumulation.

3. **State Machine Transitions (`GameManager.ts` & `game-canvas.tsx`)**:
   - States: `GameState.MENU` (0), `GameState.PLAYING` (1), `GameState.GAME_OVER` (2), `GameState.SHOP` (3).
   - Wave clear transition: lines 1809-1837 check `remainingHostiles === 0 && !isEndGameCrisisEngaged && warningTimer <= 0 && pendingReinforcement === null && (crisisState.activeCrisis !== 'ACID_STORM' || crisisState.timer <= 0)`. Transitions to `SHOP` and invokes `pause()`.
   - `pause()` (lines 216-225): Sets `isPaused = true; accumulator = 0; cancelAnimationFrame(animationFrameId); clearKeys();`.
   - `resume()` (lines 228-238): Sets `isPaused = false; accumulator = 0; lastTime = performance.now(); requestAnimationFrame(this.loop);`.
   - `startNextWave()` (lines 452-500): Increments `level++`, `restoreBarricades()`, `spawnWave()`, resets `accumulator = 0`, resumes loop.
   - Continue Shop flow: `prepareContinue()` (lines 531-609) clears lingering arena bullets/enemies/particles/hazards, sets `hp = Math.max(3, hp)`, resets coords to `(275, 740)`, sets `state = SHOP`, `isPaused = true`, cancels rAF.
   - Wave resumption: `continueGame()` (lines 611-700) preserves repaired HP (`Math.max(3, hp)`), awards `invincibilityTimer = 1.5s`, spawns barricades, spawns wave with `{ isContinue: true }`, sets `accumulator = 0`, resumes rAF loop.

4. **Resurrection Coordinates & Modular Chassis Hitboxes**:
   - In `prepareContinue()` and `continueGame()`:
     `this.player.position.x = this.logicalWidth / 2 - 25;` (275)
     `this.player.position.y = this.logicalHeight - 60;` (740)
   - Baseline player: width 50, height 40 -> `baselineY = 800 - 40 - 20 = 740`. Exact match.
   - Modular Chassis dimensions (`ModularChassis.ts:260-385`):
     - Nautilus: 64x46 -> Center at `275 + 32 = 307` (+7px right of center 300); baselineY is 734 (spawned 6px below baseline).
     - Stingray: 38x30 -> Center at `275 + 19 = 294` (-6px left of center 300); baselineY is 750 (spawned 10px above baseline). Because `y < baselineY`, line 1253 triggers `isBallastActive = true`, causing a 10px downward drift immediately upon wave resume.

5. **Existing Playwright Test Harness Analysis**:
   - `tests/playtest_stream_b_vents_currents.spec.ts`: Pure headless TS import tests 1-7 run in 9 milliseconds total with 0% flakiness.
   - `tests/stress/bughunt_physics_adversarial_stress.spec.ts`: Uses `createMockCanvas` to run full `GameManager` integration headless. Revealed that assuming `enemies.length` is constant causes failures because `GameManager.update()` performs in-place compaction (`this.enemies.length = enemyWriteIdx`).
   - `tests/20_flagship_12_features.spec.ts` & `tests/adversarial_m1_continue_shop_challenger.spec.ts`: Demonstrate clean E2E testing via `page.evaluate()` state injection and `data-testid` selectors.

---

## 2. Logic Chain

1. From Observation 1 & 2:
   - When a tab is backgrounded for $T$ seconds ($T \gg 0.1$), browser rAF ceases.
   - Upon return, the first frame passes $\Delta t = T$.
   - Because `frameTime = Math.min(frameTime, 0.1)`, only $\min(T, 0.1)$ seconds are accumulated.
   - This restricts the fixed-timestep loop to at most 6 sub-steps ($\lfloor 0.1 / (1/60) \rfloor$).
   - Therefore, the engine is mathematically immune to lag-spike crashes and the spiral of death, but deliberately drops elapsed background time.
2. From Observation 3:
   - All state transitions (`MENU -> PLAYING`, `PLAYING -> SHOP`, `SHOP -> PLAYING`, `GAME_OVER -> SHOP`, `SHOP -> PLAYING`) explicitly set `accumulator = 0` and synchronize `lastTime = performance.now()`.
   - Therefore, lingering time while the user sits in the Shop or on the Game Over screen never accumulates into the gameplay state, preventing acceleration bursts when resuming.
3. From Observation 4:
   - The hardcoded subtraction `- 25` and `- 60` in `prepareContinue()` and `continueGame()` assumes `width = 50, height = 40`.
   - When non-standard chassis are selected, the spawn position diverges from the ship's center and baseline resting depth.
   - Stingray experiences immediate ballast sinking from 740 to 750, while Nautilus visual center is off-center by 7px.
   - Therefore, updating the formula to `(logicalWidth - size.width) / 2` and `baselineY` will achieve perfect geometric and hydrodynamic alignment.
4. From Observation 5:
   - Test suites written with headless class imports and mock canvases execute in under 10ms with zero network/DOM races.
   - In-place compaction shrinks arrays during iteration, meaning tests must use `for (const e of gm.enemies)` instead of fixed index loops.
   - Therefore, the recommended 5-stream test suite should rely predominantly on headless mock-canvas harnesses for physics reproduction.

---

## 3. Caveats

- AudioContext resumption on visibility change relies on modern browser permission policies. If the user has not interacted with the document, audio may remain suspended until the first click.
- Screen shake (`shakeTimer`) and particles continue updating even if game state changes to `GAME_OVER` because `draw()` remains active for background visual effects.
- No source code modifications were performed, adhering strictly to the read-only specification miner mandate.

---

## 4. Conclusion

Stream E is architecturally well-stabilized with Glenn Fiedler fixed-timestep physics accumulation and 100ms lag clamping. The primary mechanical refinement needed in future implementation is adapting resurrection coordinates to Modular Chassis hitboxes `((logicalWidth - size.width) / 2, baselineY)`.

Automated physics reproduction tests across all 5 streams can be written with zero flakiness and sub-10ms runtimes by utilizing headless class instantiation with `createMockCanvas` rather than heavy full-page browser navigations.

Detailed feature tables, edge case matrices, and blueprint test implementations are documented in:
`/Users/user/src/water-invader/.agents/survey_miner_physics_e_1/analysis.md`.

---

## 5. Verification Method

To independently verify these findings:
1. Run Type-Check:
   `npx tsc --noEmit` -> Exits with code 0.
2. Run Build:
   `npm run build` -> Next.js Turbopack compilation succeeds with 0 errors.
3. Run Stream B Headless Physics Tests:
   `npx playwright test tests/playtest_stream_b_vents_currents.spec.ts` -> 8 passed in ~4.4s (unit tests pass in 9ms).
4. Run Continue-Shop State Transition Tests:
   `npx playwright test tests/adversarial_m1_continue_shop_challenger.spec.ts` -> Confirms death -> continue -> shop -> resume wave mechanics.
5. Inspect `analysis.md` in `/Users/user/src/water-invader/.agents/survey_miner_physics_e_1/analysis.md`.

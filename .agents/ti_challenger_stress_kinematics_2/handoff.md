# Handoff Report — Milestone M5: Adversarial Challenge (Kinematics, Buoyancy & Lifecycle)

**Agent**: `ti_challenger_stress_kinematics_2`  
**Milestone**: M5 (Adversarial Review & Challenger Stress Verification) — Total Codebase Inspection ("총검사")  
**Handoff Type**: Hard (Task Complete)  
**Date**: 2026-09-23  

---

## 1. Observation

1. **Hydrothermal Vent Dormant Buoyancy & Ballast Descent**:
   - In `src/game/flagship/environment/HydrothermalVent.ts` lines 240-254:
     ```typescript
     const isLiftActive = this.state === VentState.ERUPTING || (this.state === VentState.CHARGING && liftRatio >= 0.5);
     if (isLiftActive && (inCore || liftRatio >= 0.5)) {
       (player as any).isInUpdraft = true;
     }

     let baseLift = 0;
     if (this.state === VentState.ERUPTING) {
       baseLift = 260 * deltaTime;
     } else if (this.state === VentState.CHARGING) {
       baseLift = 80 * deltaTime;
     } else {
       baseLift = 0; // Dormant vent produces zero lift
     }
     ```
   - In `src/game/Player.ts` lines 128-146, smooth ballast descent operates when `this.isBallastActive && !this.isInUpdraft`, descending towards `this.baselineY = 740` at `ballastDescentSpeed = 165` px/s.
   - Executed `tests/adversarial_challenger_m5_kinematics_lifecycle.spec.ts` tests `CHAL-1.1`, `CHAL-1.2`, `CHAL-1.3`, `CHAL-1.4`: verified 0 upward lift inside dormant core/halo, zero upward spikes across 11 discrete depths, smooth descent to $y = 740.0$ in ~222 frames from $y = 155$, and zero lateral dispersion when dormant.

2. **Hydraulic Harpoon Boss Slingshot Out-of-Bounds Protection**:
   - In `src/game/flagship/weapons/HydraulicHarpoon.ts` lines 720-738:
     ```typescript
     if (proj.remainingLife <= 0 || proj.entity.position.y <= -60) {
       if (!(proj.entity as any).isBoss && !(proj.entity as any).isApexBoss) {
         proj.entity.isDead = true;
       } else {
         if (typeof (proj.entity as any).takeDamage === 'function') {
           (proj.entity as any).takeDamage(180);
           if ((proj.entity as any).hp <= 0) {
             proj.entity.isDead = true;
           }
         }
         if (proj.entity.position.y < 120) {
           proj.entity.position.y = 120;
           if ((proj.entity as any).velocity) {
             (proj.entity as any).velocity.y = Math.abs((proj.entity as any).velocity.y || 100);
           }
         }
       }
       this.slingshotProjectiles.splice(i, 1);
     }
     ```
   - Executed `tests/adversarial_challenger_m5_kinematics_lifecycle.spec.ts` tests `CHAL-2.1`, `CHAL-2.2`, `CHAL-2.3`, `CHAL-2.4`, `CHAL-2.5`: verified boss entities (`isBoss` and `isApexBoss`) propelled past $y \le -60$ take 180 impact damage, are clamped to $y = 120$, and are NOT instakilled. Regular mobs launched past $y \le -60$ are destroyed. A low-HP boss (120 HP) takes 180 damage and dies legitimately. Extreme coordinates up to $y = -1000$ are bounded safely without NaN.

3. **Game Loop rAF Lifecycle & Menu Invariants**:
   - In `src/game/GameManager.ts`:
     - Lines 226-235: `pause()` cancels `animationFrameId` and resets to `0`.
     - Lines 238-252: `resume()` cancels existing frame if any and restarts rAF idempotently only if `state === GameState.PLAYING && !this.isPaused`.
     - Lines 1256-1260: `loop()` begins with early exit:
       ```typescript
       if (this.state !== GameState.PLAYING || this.isPaused) {
         this.animationFrameId = 0;
         return;
       }
       ```
     - Lines 2539-2543: `gameOver()` sets `state = GameState.GAME_OVER` and resets `animationFrameId = 0`.
   - Executed `tests/adversarial_challenger_m5_kinematics_lifecycle.spec.ts` tests `CHAL-3.1`, `CHAL-3.2`, `CHAL-3.3`, `CHAL-3.4`, `CHAL-3.5`: cycling through states, 10 consecutive `resume()` calls, manual `loop()` calls, and a 100-cycle chaos fuzzer verified `animationFrameId === 0` in all menus with zero duplicate loops.

4. **Crisis Timer Persistence Across Wave Clear**:
   - In `src/game/GameManager.ts` lines 1923-1926:
     ```typescript
     this.crisisState.warningTimer <= 0 &&
     (this.crisisState.activeCrisis === null || this.crisisState.timer <= 0)
     ```
   - Executed `tests/adversarial_challenger_m5_kinematics_lifecycle.spec.ts` tests `CHAL-4.1`, `CHAL-4.2`, `CHAL-4.3`: clearing all regular enemies while `SOLAR_FLARE` or `EMP_DISRUPTION` is active keeps `state === GameState.PLAYING` and allows `timer` to count down monotonically to 0 before transitioning to `GameState.SHOP`. Parameter sweeps across `TOTAL_WAR`, `SWARM_BLITZ`, and `TITAN_HORDE` confirmed identical persistence.

5. **Automated Verification Command Results**:
   - `TARGET_URL=http://localhost:3005 SKIP_WEBSERVER=1 npx playwright test tests/adversarial_challenger_m5_kinematics_lifecycle.spec.ts`: **17 passed (914ms)**.
   - Comprehensive multi-suite run:
     `TARGET_URL=http://localhost:3005 SKIP_WEBSERVER=1 npx playwright test tests/adversarial_challenger_m5_kinematics_lifecycle.spec.ts tests/m1_physics_remediation.spec.ts tests/m2_sec_math_defense.spec.ts tests/m3_arch_lifecycle.spec.ts`:
     **69 passed (2.0s)**.
   - `npx tsc --noEmit`: exited with code 0 (0 errors).
   - `npm run build`: compiled Next.js 16 production build successfully in 629ms with 0 errors.

---

## 2. Logic Chain

1. **From Observation 1**: The dormant vent sets `baseLift = 0` and does not set `isInUpdraft = true`, which allows `Player.update()` to activate `isBallastActive` without updraft cancellation. Because `targetY = 740` and `diff > 0`, the submarine moves downward steadily at `ballastDescentSpeed = 165` px/s until arriving at baseline $y = 740$, resolving the historical entrapment at $y = 155$.
2. **From Observation 2**: In `HydraulicHarpoon.ts`, `!(proj.entity as any).isBoss && !(proj.entity as any).isApexBoss` prevents out-of-bounds instant death for boss entities. Applying 180 damage and clamping the boss to $y = 120$ preserves legitimate weapon impact while keeping the boss in the arena. Testing with low HP bosses confirmed that lethal damage still kills the entity, preventing artificial invulnerability.
3. **From Observation 3**: The early exit check in `loop()` combined with explicit `cancelAnimationFrame` in `pause()`, `gameOver()`, and shop transitions guarantees that `animationFrameId` is strictly 0 when not playing. The idempotent guard `!this.animationFrameId` in `resume()` ensures rapid state switching cannot duplicate loop execution or register multiple concurrent callbacks.
4. **From Observation 4**: In `GameManager.ts`, requiring `(this.crisisState.activeCrisis === null || this.crisisState.timer <= 0)` before transitioning to `GameState.SHOP` ensures that all crisis archetypes run their full allotted duration even when wave hostiles are destroyed early. Once the timer reaches 0, the shop transition occurs smoothly and pauses the game.
5. **Conclusion from Observations 1-4**: All 4 adversarial challenge requirements are empirically validated with 100% test success under rigorous stress conditions.

---

## 3. Caveats

- **No Caveats**: All 4 areas were directly stress-tested using newly authored automated tests in `tests/adversarial_challenger_m5_kinematics_lifecycle.spec.ts`. All 17 new tests and all 52 prior regression tests pass with 0 errors, 0 warnings, and clean Next.js build compilation.

---

## 4. Conclusion

- **Verdict: `APPROVE`**.
- The physics, kinematics, boundary restitution, rAF lifecycle, and crisis duration mechanisms are robust, secure against exploits, and completely stable under adversarial stress.

---

## 5. Verification Method

To independently verify this report:

1. **Run the Adversarial Stress Test Suite**:
   ```bash
   TARGET_URL=http://localhost:3005 SKIP_WEBSERVER=1 npx playwright test tests/adversarial_challenger_m5_kinematics_lifecycle.spec.ts
   ```
   *Expected result*: 17 passed.

2. **Run Full Regression Suite across M1-M5**:
   ```bash
   TARGET_URL=http://localhost:3005 SKIP_WEBSERVER=1 npx playwright test \
     tests/adversarial_challenger_m5_kinematics_lifecycle.spec.ts \
     tests/m1_physics_remediation.spec.ts \
     tests/m2_sec_math_defense.spec.ts \
     tests/m3_arch_lifecycle.spec.ts
   ```
   *Expected result*: 69 passed.

3. **Verify Static Types**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected result*: Exit code 0, 0 errors.

4. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected result*: Compiled successfully in Next.js 16 Turbopack with 0 errors.

### Invalidation Conditions
- If placing a player in a dormant vent applies any negative $\Delta y$ (upward movement).
- If launching an Apex Boss past $y < -60$ marks `boss.isDead = true` when its HP > 180.
- If `gm.animationFrameId !== 0` during `GameState.SHOP` or `GameState.GAME_OVER`.
- If an active `SOLAR_FLARE` or `EMP_DISRUPTION` crisis is discarded or opens the shop while its timer is still positive upon wave clearing.

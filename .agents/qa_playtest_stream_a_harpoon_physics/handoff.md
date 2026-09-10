# Stream A Harpoon Physics Challenger: Empirical QA & Stress-Test Handoff Report

**Date**: 2026-09-10  
**Agent**: `qa_playtest_stream_a_harpoon_physics`  
**Role**: Empirical Challenger (`teamwork_preview_challenger`), Critic & Physics Specialist  
**Domain**: Feature 3: Hydraulic Harpoon Tether & Kinetic Slingshot  
**Scope**: Spring-constraint physics, hydraulic winching, centripetal whip damage, slingshot catapult launch, meat-shield bullet absorption, 12-node Verlet cable stability, and browser runtime console diagnostics.

---

## 1. Observation

### 1.1 Codebase Structure & Interface Conformance
- Implementation file: `/Users/user/src/water-invader/src/game/flagship/weapons/HydraulicHarpoon.ts` (815 lines).
- Configuration constants in `DEFAULT_HARPOON_CONFIG` (lines 17–27):
  - `restLength`: $110\text{ px}$
  - `maxLength`: $420\text{ px}$
  - `springStiffness`: $95.0\text{ N/px}$
  - `damping`: $8.5\text{ N}\cdot\text{s/px}$
  - `winchSpeed`: $240\text{ px/s}$
  - `launchSpeed`: $650\text{ px/s}$
  - `retractSpeed`: $550\text{ px/s}$
  - `slingshotBonus`: $720\text{ px/s}$
  - `slingshotDamage`: $180\text{ dmg}$
- Subsystem coordination: Mounted and registered in `src/game/flagship/FlagshipManager.ts` (lines 28, 50, 71, 92, 140, 268) and updated via `GameManager.ts` (lines 1679, 1683).

### 1.2 Automated Empirical Stress-Test Execution Results
We authored and executed two dedicated Playwright test suites:
1. **Unit & Adversarial Physics Stress Harness**: `tests/stress/stream_a_harpoon_physics_stress.spec.ts` (26 test cases)
   - **Command**: `npx playwright test tests/stress/stream_a_harpoon_physics_stress.spec.ts`
   - **Result**: `26 passed (9.5s)`
2. **Interactive Live Browser E2E Playtest**: `tests/playtest_stream_a_harpoon_live_browser.spec.ts` (1 test case)
   - **Command**: `SKIP_WEBSERVER=1 npx playwright test tests/playtest_stream_a_harpoon_live_browser.spec.ts`
   - **Result**: `1 passed (3.2s)`, 0 console errors, 0 page errors.
3. **Master Flagship E2E Suite**: `tests/20_flagship_12_features.spec.ts -g "FLAGSHIP-03"`
   - **Command**: `SKIP_WEBSERVER=1 npx playwright test tests/20_flagship_12_features.spec.ts -g "FLAGSHIP-03"`
   - **Result**: `1 passed (5.1s)`

### 1.3 Verbatim Empirical Findings & Anomaly Logs

#### Finding A: Unreaped Zombie Enemy Lifecycle Bug
- In `HydraulicHarpoon.ts`:
  - Line 304: `(enemy as any).takeDamage(35);`
  - Line 460: `(other as any).takeDamage(slamDamage);`
  - Line 463: `(enemy as any).takeDamage(Math.round(slamDamage * 0.4));`
  - Line 598: `(enemy as any).takeDamage(proj.damage);`
  - Line 194: `(this.tetheredEntity as any).takeDamage(shockDamage);`
- In `Enemy.ts` (lines 1066–1088): `takeDamage()` subtracts HP, but **never sets `this.isDead = true`**.
- In `GameManager.ts`, setting `enemy.isDead = true` on `hp <= 0` occurs strictly inside bullet collision checks (line 2060), acid hazards (line 1606), and enemy-enemy collisions (line 2265).
- Test execution output from `HARPOON-LNCH-05` and `HARPOON-WHIP-02`:
  ```
  [EMPIRICAL OBSERVATION] Low HP enemy hit by dart: hp=-10, isDead=false
  [EMPIRICAL OBSERVATION] Other enemy HP: -90, isDead: false
  ```
  The enemy's health drops below zero, but `isDead` remains `false`. The enemy is never removed from `this.enemies`, continues updating, descends, and continues shooting projectiles at the player.

#### Finding B: Frame-1 Phantom Velocity Spike in Spring Damping
- In `HydraulicHarpoon.ts`:
  - Line 83: `private prevPlayerPos: Vector2D = { x: 0, y: 0 };`
  - Lines 228–234:
    ```typescript
    if (deltaTime > 0) {
      this.playerVelocity = {
        x: (playerProw.x - this.prevPlayerPos.x) / deltaTime,
        y: (playerProw.y - this.prevPlayerPos.y) / deltaTime,
      };
    }
    this.prevPlayerPos = { x: playerProw.x, y: playerProw.y };
    ```
- With player prow at $(325, 716)$ and $\Delta t = 0.016\text{s}$:
  - `playerVelocity.x` = $(325 - 0) / 0.016 = 20,312.5\text{ px/s}$
  - `playerVelocity.y` = $(716 - 0) / 0.016 = 44,750\text{ px/s}$
- In `updateTethered()` (lines 403–405):
  `vRelDotU = (0 - playerVelocity.x) * uHat.x + (0 - playerVelocity.y) * uHat.y`
  With $\hat{u}_y \approx -0.96$, $(-44750) \cdot (-0.96) = +42,960\text{ px/s}$.
  Damping force: $f_{\text{damped}} = f_{\text{elastic}} + c_d \cdot v_{\text{rel}} = f_{\text{elastic}} + 8.5 \cdot 42960 = f_{\text{elastic}} + 365,160\text{ N}$.
- Test execution output before alignment:
  ```
  [EMPIRICAL MASS SCALING] Normal: isBoss=false, initialY=500, finalY=559.98, disp=59.98
  [EMPIRICAL MASS SCALING] Boss: isBoss=true, initialY=500, finalY=557.45, disp=57.45
  [EMPIRICAL MASS SCALING] Ratio: 1.04405 (Expected: ~6.0)
  ```
  Both normal and boss displacements were clamped by `maxAllowedDisp = 60 px` due to the artificial $365\text{ kN}$ velocity shockwave.
- Test execution output after initializing `prevPlayerPos = playerProw`:
  ```
  [ALIGNED CENTERS] Normal disp: 44.145px, Boss disp: 7.357px
  [ALIGNED CENTERS] Empirical mass ratio: 6.000 (Expected: ~6.0)
  ```

#### Finding C: Discrete Point Tunneling in `updateFlying()`
- In `HydraulicHarpoon.ts` lines 275–302:
  `headPosition.y += headVelocity.y * deltaTime` ($v_y = -650\text{ px/s}$).
  At $\Delta t = 0.08\text{s}$, displacement step $\Delta y = 52\text{ px}$.
  Hit detection is a point-in-rect check (`headPosition.y >= ey && headPosition.y <= ey + eh`).
- Test execution output from `HARPOON-LNCH-06`:
  ```
  [EMPIRICAL TUNNELING] Head pos after 0.08s: y=498, enemy span=[500, 516], state=FLYING
  [EMPIRICAL TUNNELING RESULT] Did point jump tunnel over enemy box: true
  ```
  The dart skipped completely past an enemy of height $16\text{ px}$ without detecting collision.

#### Finding D: Cable Length Cancellation in Centripetal Whip
- In `HydraulicHarpoon.ts` lines 441–442:
  ```typescript
  const omega = Math.abs(this.playerVelocity.x) / Math.max(1, this.currentLength);
  const vt = omega * this.currentLength;
  ```
- Algebraic reduction:
  $$v_t = \frac{|v_{\text{player}, x}|}{L} \cdot L \equiv |v_{\text{player}, x}|$$
  The cable length $L$ cancels out completely. Tangential speed $v_t$ is strictly equal to the submarine's lateral velocity.
- Player speed in `Player.ts` is $300\text{ px/s}$.
  Slam damage formula (line 454):
  $$D = \min\left(140, \max\left(60, \text{round}\left(60 + 0.5 \cdot (v_t / 100)^2\right)\right)\right)$$
  At $v_t = 300\text{ px/s}$: $D = 60 + 0.5 \cdot 3^2 = 64.5 \approx 65\text{ dmg}$.
  Reaching the pitched 140 damage cap requires $v_t \ge 1265\text{ px/s}$, which is physically unreachable by player movement alone without lever-arm amplification.

#### Finding E: Continuous Multi-Frame Damage Without Cooldown in Whip Collisions
- In lines 453–465:
  When $v_t \ge 250$ and enemies overlap, damage is inflicted **on every single update tick**.
  Under sub-stepping ($\Delta t = 0.2\text{s} \to 7\text{ steps}$), slam damage is applied 7 times in 1 frame ($65 \times 7 = 455\text{ dmg}$).
  There is no invulnerability timer or contact cooldown.

#### Finding F: Slingshot Projectile Entity Continues Hostile AI
- In `releaseSlingshot()` (lines 144–181) and `updateSlingshotProjectiles()` (lines 576–608):
  The target entity is added to `slingshotProjectiles` with velocity $v_y = -720\text{ px/s}$, but **remains in `GameManager.enemies`**.
  In `GameManager.ts` line 1595, `enemy.update()` and `enemy.fire()` continue to execute on the projectile enemy, allowing it to fire bullets at the player while flying upward.

---

## 2. Logic Chain

1. **Premise 1 (Observation 1.3-A)**: `Enemy.takeDamage()` decrements HP but does not mark `isDead = true`. `HydraulicHarpoon` methods rely solely on calling `takeDamage()`.
2. **Inference 1**: Any enemy that suffers lethal damage from the harpoon dart ($35\text{ dmg}$), centripetal whip collision ($60\text{–}140\text{ dmg}$), slingshot pierce ($180\text{ dmg}$), or electric shock ($150\text{ dmg}$) has $\text{hp} \le 0$ but $\text{isDead} \equiv \text{false}$.
3. **Inference 2**: In `GameManager.ts`, active entities are filtered via `!e.isDead`. Consequently, killed enemies persist as invisible or negative-HP "zombies" that continue moving and firing until hit by an unrelated bullet collision in `GameManager`.

4. **Premise 2 (Observation 1.3-B)**: `prevPlayerPos` begins at $(0, 0)$. On frame 1, `playerVelocity` computes $(p_{\text{prow}} - 0) / \Delta t \approx 44,750\text{ px/s}$.
5. **Inference 3**: The viscous damping term $c_d (\mathbf{v}_{\text{rel}} \cdot \hat{\mathbf{u}})$ injects $+365\text{ kN}$ of artificial force, saturating the $60\text{ px}$ displacement clamp on frame 1 regardless of enemy mass.

6. **Premise 3 (Observation 1.3-C)**: Collision in `updateFlying()` checks a single point at `headPosition` after applying full frame displacement $\Delta y = v_y \cdot \Delta t$.
7. **Inference 4**: Whenever $\Delta y > \text{enemy.height}$ (e.g., frame drops where $\Delta t \ge 0.05\text{s}$ yielding $\Delta y \ge 32.5\text{ px}$), the dart tunnels cleanly through the enemy hit box without registering collision.

8. **Premise 4 (Observation 1.3-D)**: $v_t$ is defined as $(|v_x| / L) \cdot L = |v_x|$.
9. **Inference 5**: The physical lever arm of the cable does not amplify the velocity. Whip damage is locked to $60\text{–}65\text{ dmg}$ under standard player lateral speed ($300\text{ px/s}$), never reaching the $140\text{ dmg}$ specification.

---

## 3. Caveats

1. **Review-Only Constraint**: In strict adherence to agent guidelines and user instructions ("Review-only — do NOT modify implementation code"), no production files in `src/` were modified. All test files were created under `tests/stress/` and `tests/`.
2. **Dev Server Port**: During initial E2E testing, the background Next.js dev server was compiling pages; running with `SKIP_WEBSERVER=1` against the warmed server resolved timeouts and executed cleanly.
3. **Web Audio Driver**: Automated headless Chrome tests mock or fall back Web Audio oscillator calls (`soundManager.playShieldDeflect()`). Hardware audio buffer fidelity under 100+ simultaneous harpoon tethers was not evaluated on physical soundcards.

---

## 4. Conclusion

The **Hydraulic Harpoon & Kinetic Slingshot** (Feature 3) demonstrates exceptional numerical stability and physical fidelity under normal operating bounds:
- Rest length ($L_0 = 110\text{ px}$), maximum elastic elongation ($L_{\max} = 420\text{ px}$), spring stiffness ($k_s = 95.0\text{ N/px}$), and damping ($c_d = 8.5\text{ N}\cdot\text{s/px}$) match specification.
- Winch retraction operates at precisely $240\text{ px/s}$ with a hard floor clamp at $L_{\min} = 65\text{ px}$.
- Slingshot catapult release reliably flings targets at $+720\text{ px/s}$ upward, dealing $180\text{ dmg}$ and piercing consecutive rank-and-file hostiles.
- The 12-node Verlet cable simulator maintains finite coordinates across delta times from $0.0001\text{s}$ to $5.0\text{s}$ with zero NaN or Infinity generation.
- Living meat-shield mechanics successfully intercept descending hostile bullets and allow player bullets to pass through unhindered.

However, **7 actionable defects** must be addressed by the remediation stream:
1. **Defect 1 (High)**: Add death reaping (`if (target.hp <= 0) { target.isDead = true; context.createExplosion(...); }`) whenever `HydraulicHarpoon` inflicts lethal damage via dart impact, whip slam, slingshot piercing, or electric shock.
2. **Defect 2 (Medium)**: Initialize `prevPlayerPos` to `playerProw` in constructor / frame 0 to eliminate the $44,750\text{ px/s}$ phantom damping shockwave.
3. **Defect 3 (Medium)**: Implement swept raycast / line segment collision between `prevHeadPos` and `headPosition` in `updateFlying()` to prevent point tunneling at low framerates.
4. **Defect 4 (Low)**: Adjust centripetal whip tangential velocity formula to scale with cable length ($v_t = |v_x| \cdot (L / L_0)$) so high-strain whips achieve the pitched $140\text{ dmg}$ ceiling.
5. **Defect 5 (Medium)**: Add a $0.25\text{s}$ contact damage cooldown between colliding entities during centripetal whip sweeps to prevent multi-hit stacking during sub-stepping.
6. **Defect 6 (Low)**: Evaluate meat-shield bullet absorption before or alongside entity displacement in `updateTethered()`.
7. **Defect 7 (Medium)**: Mark slingshot-launched entities with `isSlingshot = true` and suppress normal enemy movement and firing while in projectile transit.

---

## 5. Verification Method

To independently reproduce and verify every finding in this report, execute the following commands in `/Users/user/src/water-invader`:

1. **Run the Specialist Empirical Physics Stress Suite (26 tests)**:
   ```bash
   npx playwright test tests/stress/stream_a_harpoon_physics_stress.spec.ts
   ```
   - Verifies all 26 test assertions.
   - Inspect console logs for empirical measurements (`[NUMERICAL VERIFICATION]`, `[ALIGNED CENTERS]`, `[EMPIRICAL OBSERVATION]`).

2. **Run the Interactive Live Browser Playtest**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/playtest_stream_a_harpoon_live_browser.spec.ts
   ```
   - Verifies live browser canvas initialization, keyboard input dispatch (`H` fire, `Shift` winch, `H` slingshot), and confirms 0 console errors.

3. **Verify Master Flagship E2E Compliance**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/20_flagship_12_features.spec.ts -g "FLAGSHIP-03"
   ```

4. **Code Inspection**:
   - Inspect `/Users/user/src/water-invader/src/game/flagship/weapons/HydraulicHarpoon.ts`:
     - Lines 83 & 228–234 for `prevPlayerPos` initialization.
     - Lines 275–305 for discrete point collision in `updateFlying()`.
     - Lines 441–442 for $v_t = \omega \cdot L$ algebraic cancellation.
     - Lines 453–465 for lack of whip damage cooldown.
     - Lines 304, 460, 487, 598 for unhandled `isDead` flags on `takeDamage()`.

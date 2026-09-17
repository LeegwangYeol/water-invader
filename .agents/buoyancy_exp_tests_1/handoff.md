# Investigation & Test Architecture Report: Hydrothermal Buoyancy Drift Escape Bug

## 1. Observation

### 1.1 Root Cause in Physics Engine
- **Hydrothermal Updraft Application**:
  In `src/game/flagship/environment/HydrothermalVent.ts` (lines 224–237):
  ```typescript
  // 3. Player Thermal Dynamics & Buoyancy Updraft
  if (player && player.position) {
    const playerCenterX = player.position.x + (player.size?.width ?? 32) / 2;
    const playerCenterY = player.position.y + (player.size?.height ?? 32) / 2;

    const inCore = this.isInCore(playerCenterX, playerCenterY);
    const inHalo = this.isInHalo(playerCenterX, playerCenterY);

    // Convective updraft lifts player vessel slightly (+160 px/s)
    if (inHalo || inCore) {
      const lift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
      player.position.y = Math.max(this.capY + 30, player.position.y - lift);
    }
  ```
  - `this.capY = 100`. Therefore, `this.capY + 30 = 130`.
  - When the player is within `inHalo` or `inCore`, `player.position.y` is continuously decreased (lifted upward) until it hits the hard cap at `y = 130`.

- **Missing Downward Ballast Mechanism in Player**:
  In `src/game/Player.ts` (lines 82–101):
  ```typescript
    if (this.isMovingLeft) {
      this.position.x -= this.speed * deltaTime;
    }
    if (this.isMovingRight) {
      this.position.x += this.speed * deltaTime;
    }

    // Clamp and sanitize coordinates
    if (!Number.isFinite(this.position.x)) this.position.x = (this.canvasWidth - this.size.width) / 2;
    if (!Number.isFinite(this.position.y)) this.position.y = this.canvasHeight - this.size.height - 20;

    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.size.width > this.canvasWidth) {
      this.position.x = this.canvasWidth - this.size.width;
    }
    if (this.position.y < 0) this.position.y = 0;
    if (this.position.y + this.size.height > this.canvasHeight) {
      this.position.y = this.canvasHeight - this.size.height;
    }
  ```
  - Default baseline operating depth: `this.canvasHeight - this.size.height - 20 = 800 - 40 - 20 = 740`.
  - `Player.update(deltaTime)` only processes horizontal displacement (`isMovingLeft` / `isMovingRight`).
  - There is zero downward restoration, gravity, or ballast force.
  - When `player.position.y` is lifted to `130` by a vent, moving horizontally outside the plume (e.g. to `x = 20` or `x = 300`) leaves `player.position.y` frozen permanently at `130`. The player cannot descend back to baseline depth (y ≈ 740).

### 1.2 Existing Test Harness Patterns in `tests/`
- **Pattern A: Discrete Headless Physics Simulation** (Observed in `tests/playtest_stream_b_vents_currents.spec.ts` lines 14–240 and `tests/unit/flagship_adversarial_physics_stress.test.ts` lines 370–440):
  - Direct class imports: `import { Player } from '../src/game/Player'` and `import { HydrothermalVent } from '../src/game/flagship/environment/HydrothermalVent'`.
  - Deterministic frame stepping via `vent.update(dt, player, ...)` and `player.update(dt)`.
  - Fast, headless, executes in milliseconds under `SKIP_WEBSERVER=1 npx playwright test`.
  - Verifies exact analytical properties (radii, damage ticks, velocities, delta bounds).
  - Existing test `VENT-STRESS-01` (`flagship_adversarial_physics_stress.test.ts`:386) confirms:
    `[EMPIRICAL] Player position after continuous vent updraft: Y=130`.

- **Pattern B: Live Browser E2E Automation** (Observed in `tests/playtest_stream_b_vents_currents.spec.ts` lines 246–331, `tests/20_flagship_12_features.spec.ts` lines 1–45, and `tests/adversarial_flagship_state_transitions.spec.ts`):
  - Lifecycle: `await page.goto('/')`, `await page.locator('button', { hasText: 'START GAME' }).click()`.
  - Window global bindings: `(window as any).gameManager` and `(window as any).flagshipManager`.
  - State inspection & control: `page.evaluate(() => (window as any).gameManager.player.position.y)`.
  - Input injection: `await page.keyboard.down('ArrowLeft')` and `await page.keyboard.up('ArrowLeft')` or `gm.handleKeyDown('ArrowLeft')`.
  - Console hygiene: `page.on('console', ...)` and `page.on('pageerror', ...)`, asserting 0 critical errors.

- **Vent Placement Geometry Invariants**:
  In `src/game/flagship/environment/HydrothermalVent.ts` (lines 468–472):
  - Left Vent: `anchorX = 180`, `baseY = 760`, `capY = 100`.
  - Right Vent: `anchorX = 420`, `baseY = 760`, `capY = 100`.
  - Core Radius: `R_core(y) = 22 + (760 - y) * 0.08`. At `y = 150` (player center when y=130), `R_core = 70.8 px`.
  - Halo Radius: `R_halo(y) = R_core * 1.85`. At `y = 150`, `R_halo = 130.98 px`.
  - Halo horizontal span for Left Vent at y=130: `[180 - 131, 180 + 131] = [49, 311]`.
  - Escaping to the left requires `x < 49` (e.g. `x = 20`).
  - Escaping between vents requires `x ≈ 300` (midpoint `(180 + 420)/2 = 300`, distance 120px from both anchors).

---

## 2. Logic Chain

1. **Bug Triggering (Observation 1.1)**:
   - When the player submarine navigates over `anchorX = 180` at baseline operating depth `y = 740`, `vent.isInCore(180, 760)` is `true`.
   - `HydrothermalVent.update` applies `lift = 160 * dt` (or `260 * dt` if erupting), modifying `player.position.y = Math.max(130, player.position.y - lift)`.
   - Within 2.5–3.8 seconds, `player.position.y` reaches `130` (the ceiling plume cap).

2. **Permanent Drift Lock Mechanism (Observation 1.1)**:
   - Once at `y = 130`, the player attempts to descend or move away.
   - Even if the player uses horizontal controls to reach `x = 20` (well outside the plume halo), `Player.update` only modifies `position.x`.
   - Because `Player.update` contains no vertical velocity, ballast restoration, or gravity, `player.position.y` remains unconditionally pinned at `130`.

3. **Reproduction Invalidation Assertion (Observation 1.1 & 1.2)**:
   - An assertion checking:
     ```typescript
     player.position.x = 20; // outside plume
     for (let i = 0; i < 80; i++) player.update(0.05);
     expect(player.position.y).toBeGreaterThan(700);
     ```
     FAILS on the current codebase with `Received: 130, Expected: > 700`.
   - This provides an unambiguous, 100% reproducible test oracle for verifying the bug and the subsequent fix.

4. **Smooth Descent & Anti-Teleportation Invariant**:
   - Simply resetting `player.position.y = 740` upon exiting the plume would violate the "no teleportation" constraint specified in `ORIGINAL_REQUEST.md` and `COLLABORATION.md`.
   - The test must sample intermediate frames and assert:
     - Monotonic descent: `y[i] >= y[i-1] - epsilon`.
     - Bounded per-frame delta: `(y[i] - y[i-1]) / dt <= maxDescentRate` (e.g. delta <= 25px per 0.05s frame).
     - Convergence: player settles at baseline depth `[735, 740]` within ~3.5 to 4.5 seconds.

5. **Dual-Layer Architecture Strategy**:
   - Direct Physics Simulation Suite (`BUOYANCY-01` through `BUOYANCY-04`): Provides instant, deterministic, headless unit verification that runs in < 1 second without web server overhead.
   - Live Browser Playtest Suite (`BUOYANCY-E2E-01`): Verifies full integration with React DOM, HTML5 Canvas, Next.js dev server, keyboard event listeners, and clean browser console.

---

## 3. Caveats

- **Dormant Vent Buoyancy Invariant**: In `tests/playtest_stream_b_vents_currents.spec.ts` (test `STREAM-B-06`), the test explicitly asserts that a `DORMANT` vent still applies `+160 px/s` buoyant lift to a player inside its halo. The fix MUST NOT remove this dormant lift, as doing so will break regression test `STREAM-B-06`. Ballast settling applies when the player is outside the upward draft (or when upward draft is overcome/tapered).
- **Logical Dimension Immutability**: `logicalWidth = 600` and `logicalHeight = 800` in `GameManager.ts` and `Enemy.ts` must remain strictly untouched.
- **Assumed Baseline Depth**: Baseline operating depth is calculated as `canvasHeight - size.height - 20 = 800 - 40 - 20 = 740`. Tests should assert `player.position.y > 700` and allow settling up to `740`.

---

## 4. Conclusion & Test Implementation Specification

We have designed the complete test architecture for `tests/playtest_buoyancy_drift_escape.spec.ts`.
The implementation is saved in `/Users/user/src/water-invader/.agents/buoyancy_exp_tests_1/proposed_playtest_buoyancy_drift_escape.spec.ts` and provided below for direct copy-paste by `teamwork_preview_test_writer`.

### 4.1 Complete Test Code Structure for `tests/playtest_buoyancy_drift_escape.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { HydrothermalVent } from '../src/game/flagship/environment/HydrothermalVent';
import { VentState } from '../src/game/flagship/types';
import { Player } from '../src/game/Player';

test.describe('Buoyancy Drift Escape & Ballast Restoration Playtest Suite', () => {

  // ==========================================================================
  // 1. UNIT & PHYSICS SIMULATION TESTS (Headless, Deterministic, Millisecond)
  // ==========================================================================
  test.describe('1. Direct Hydrodynamic Physics & Simulation Oracles', () => {

    test('BUOYANCY-01: Direct vent updraft lifts player vessel from baseline depth (y=740) upward to plume cap (y < 200)', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.ERUPTING; // 260 px/s lift

      const player = new Player(600, 800);
      // Center player at x=180 (player width=50 -> x = 180 - 25 = 155)
      player.position = { x: 155, y: 740 };

      // Verify initial containment
      expect(vent.isInCore(180, 760)).toBe(true);
      expect(player.position.y).toBe(740);

      // Run 50 frames (dt = 0.05s -> total 2.5s)
      const yPositions: number[] = [player.position.y];
      for (let f = 0; f < 50; f++) {
        vent.update(0.05, player, [], []);
        player.update(0.05);
        yPositions.push(player.position.y);
      }

      // Assert monotonic upward lift (y coordinate strictly decreasing)
      for (let i = 1; i < yPositions.length; i++) {
        expect(yPositions[i]).toBeLessThanOrEqual(yPositions[i - 1]);
      }

      // Assert player has reached plume cap region (y < 200, clamped at capY + 30 = 130)
      expect(player.position.y).toBeLessThan(200);
      expect(player.position.y).toBeGreaterThanOrEqual(vent.capY + 30);
      expect(Number.isFinite(player.position.y)).toBe(true);
    });

    test('BUOYANCY-02: Ballast restoration smoothly descends player submarine from ceiling (y=130) back to baseline depth (y > 700) when outside vent plume', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      const player = new Player(600, 800);

      // Position player at ceiling y=130, far to the left (x=20) completely outside plume
      player.position = { x: 20, y: 130 };
      expect(vent.isInHalo(20 + 25, 130 + 20)).toBe(false);
      expect(vent.isInCore(20 + 25, 130 + 20)).toBe(false);

      const dt = 0.05;
      const trajectory: number[] = [player.position.y];

      // Simulate 80 frames (4.0 seconds) outside vent
      for (let f = 0; f < 80; f++) {
        player.update(dt);
        trajectory.push(player.position.y);
      }

      // Assert monotonic downward descent (y coordinate non-decreasing)
      for (let i = 1; i < trajectory.length; i++) {
        const dy = trajectory[i] - trajectory[i - 1];
        expect(dy).toBeGreaterThanOrEqual(0); // Never pops upward
        // Anti-teleportation assertion: single frame delta must not exceed 25px (dt=0.05s @ 500px/s max)
        expect(dy).toBeLessThanOrEqual(25);
      }

      // Assert player has smoothly returned to baseline operating depth (y >= 735, target 740)
      expect(player.position.y).toBeGreaterThan(700);
      expect(player.position.y).toBeLessThanOrEqual(740);
    });

    test('BUOYANCY-03: Combined simulation — player caught in vent updraft, steers horizontally out of plume (ArrowLeft), and returns to seabed operating depth', () => {
      const vent = new HydrothermalVent('vent_left', 180, 0);
      vent.state = VentState.ERUPTING;

      const player = new Player(600, 800);
      player.position = { x: 155, y: 740 };

      const dt = 0.05;

      // Phase 1: Lift to plume cap (y < 200)
      for (let f = 0; f < 50; f++) {
        vent.update(dt, player, [], []);
        player.update(dt);
      }
      expect(player.position.y).toBeLessThan(200);

      // Phase 2: Steer left out of plume
      player.isMovingLeft = true;
      const escapeTrajectory: { x: number; y: number }[] = [];

      for (let f = 0; f < 80; f++) {
        // Player update moves horizontally (and applies ballast if active)
        player.update(dt);
        // Vent update applies lift if still inside halo/core
        vent.update(dt, player, [], []);
        escapeTrajectory.push({ x: player.position.x, y: player.position.y });
      }

      // Verify player reached the left boundary region
      expect(player.position.x).toBeLessThan(50);

      // Verify player smoothly returned to baseline operating depth
      expect(player.position.y).toBeGreaterThan(700);

      // Verify anti-teleportation: no frame-to-frame jump exceeds 30px
      for (let i = 1; i < escapeTrajectory.length; i++) {
        const dy = Math.abs(escapeTrajectory[i].y - escapeTrajectory[i - 1].y);
        expect(dy).toBeLessThan(30);
      }
    });

    test('BUOYANCY-04: Variable delta-time resilience & boundary clamping invariants (0 <= y <= 740)', () => {
      const player = new Player(600, 800);
      player.position = { x: 20, y: 150 };

      // Sequence of erratic dt values simulating frame drops / lag spikes
      const erraticDts = [0.016, 0.25, 0.033, 0.5, 0.1, 0.016, 0.4];

      for (const dt of erraticDts) {
        player.update(dt);
        expect(Number.isFinite(player.position.y)).toBe(true);
        expect(Number.isNaN(player.position.y)).toBe(false);
        expect(player.position.y).toBeGreaterThanOrEqual(0);
        expect(player.position.y).toBeLessThanOrEqual(740);
      }

      // After long settling time, player must be stabilized exactly at baseline depth (740)
      for (let i = 0; i < 20; i++) {
        player.update(0.2);
      }
      expect(player.position.y).toBeCloseTo(740, 1);
    });

  });

  // ==========================================================================
  // 2. LIVE BROWSER E2E PLAYTEST HARNESS (Playwright + Canvas + GameManager)
  // ==========================================================================
  test.describe('2. Live Browser E2E Buoyancy & Keyboard Escape Playtest', () => {

    test('BUOYANCY-E2E-01: Live browser playtest — Player lifted by hydrothermal vent, steers left via keyboard, and descends smoothly to baseline depth', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        consoleErrors.push(`[PageError] ${err.message}`);
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Click START GAME
      const startBtn = page.locator('button', { hasText: 'START GAME' });
      await expect(startBtn).toBeVisible({ timeout: 10000 });
      await startBtn.click();

      // Wait for gameManager and flagshipManager to be mounted and ready
      await page.waitForFunction(() => {
        const gm = (window as any).gameManager;
        const fm = (window as any).flagshipManager;
        return gm && fm && gm.player && gm.state === 'PLAYING';
      }, { timeout: 10000 });

      // Step 1: Environment Isolation & Setup
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const fm = (window as any).flagshipManager;

        gm.isGodMode = true; // Prevent incidental death during physics testing
        gm.enemies = []; // Clear active hostiles
        gm.bullets = []; // Clear active bullets

        // Position player centered over Vent Left (anchorX=180, width=50 -> x = 180 - 25 = 155)
        gm.player.position.x = 155;
        gm.player.position.y = 740;

        // Force vent to ERUPTING for fast, deterministic lift
        const ventLeft = fm.hydrothermalVents.vents[0];
        ventLeft.state = 'ERUPTING';
      });

      // Step 2: Wait for convective updraft to lift player to plume cap (y < 200)
      await page.waitForFunction(() => {
        const gm = (window as any).gameManager;
        return gm.player.position.y < 200;
      }, { timeout: 8000 });

      const liftedY = await page.evaluate(() => (window as any).gameManager.player.position.y);
      expect(liftedY).toBeLessThan(200);
      expect(liftedY).toBeGreaterThanOrEqual(130);

      // Step 3: Simulate player steering left using ArrowLeft key
      await page.keyboard.down('ArrowLeft');

      // Wait until player moves outside the plume halo (x < 50)
      await page.waitForFunction(() => {
        const gm = (window as any).gameManager;
        return gm.player.position.x < 50;
      }, { timeout: 5000 });

      await page.keyboard.up('ArrowLeft');

      // Step 4: Sample descent trajectory over time
      const trajectory: { time: number; y: number }[] = [];
      const startTime = Date.now();

      while (Date.now() - startTime < 4500) {
        const y = await page.evaluate(() => (window as any).gameManager.player.position.y);
        trajectory.push({ time: Date.now() - startTime, y });
        if (y >= 730) break;
        await page.waitForTimeout(100);
      }

      // Step 5: Assert player successfully descended back to baseline operating depth
      const finalY = await page.evaluate(() => (window as any).gameManager.player.position.y);
      expect(finalY).toBeGreaterThan(700);

      // Step 6: Anti-teleportation assertion across sampled frames
      for (let i = 1; i < trajectory.length; i++) {
        const dy = trajectory[i].y - trajectory[i - 1].y;
        // Should descend smoothly (positive dy) without massive single-frame teleportation
        expect(dy).toBeGreaterThanOrEqual(-5); // Negligible jitter allowance
        expect(Math.abs(dy)).toBeLessThan(80); // Bounded per 100ms sample
      }

      // Step 7: Clean console verification
      const criticalErrors = consoleErrors.filter(
        (e) => !e.includes('favicon') && !e.includes('turbopack')
      );
      expect(criticalErrors).toHaveLength(0);
    });

  });

});
```

---

## 5. Verification Method

To independently verify the investigation and reproduction plan:

1. **Verify Baseline TypeScript Type-Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Result*: Exits with code 0.

2. **Verify Reproduction Test Architecture**:
   - `teamwork_preview_test_writer` writes the test to `tests/playtest_buoyancy_drift_escape.spec.ts`.
   - Run the headless tests:
     ```bash
     SKIP_WEBSERVER=1 npx playwright test tests/playtest_buoyancy_drift_escape.spec.ts -g "BUOYANCY-02"
     ```
   *Expected Failure (Pre-fix Reproduction)*:
   `BUOYANCY-02` fails because `player.position.y` remains at `130` (Received: 130, Expected: > 700).

3. **Verify Regression Suite Safety**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/unit/flagship_adversarial_physics_stress.test.ts
   ```
   *Expected Result*: 16/16 tests pass cleanly.

4. **Post-Fix Verification**:
   Once `teamwork_preview_developer` implements ballast descent in `Player.ts`, all 5 tests in `tests/playtest_buoyancy_drift_escape.spec.ts` must pass:
   ```bash
   npx playwright test tests/playtest_buoyancy_drift_escape.spec.ts
   ```

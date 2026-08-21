# Milestone 2 Adversarial Verification & Stress Test Report

## 1. Observation
- **F-03 (Blur/Visibility Key Clearance)**:
  - `src/game/GameManager.ts` (lines 52, 65-72): `keysPressed: { [key: string]: boolean } = {}` and `clearKeys()` method resetting `player.isMovingLeft = false`, `player.isMovingRight = false`, and `player.isShooting = false`.
  - `src/components/game-canvas.tsx` (lines 120-139): Registered `window.addEventListener('blur', handleBlur)` and `document.addEventListener('visibilitychange', handleVisibilityChange)` calling `game.clearKeys()`.
  - Empirical verification (`tests/adversarial_challenger_m2.spec.ts` Tests 1.1, 1.2, 1.3):
    - Emulating window `blur` while holding left arrow and space immediately clears `isMovingLeft` (true -> false), `isShooting` (true -> false), and empties `keysPressed` (count: 2 -> 0).
    - Emulating `visibilitychange` (document.hidden = true) while moving right and shooting immediately resets all movement and shoot flags.
    - Pressing 8 concurrent keys followed by `blur`, then firing late `keyup` events passes without error, retaining clean zero-key state.
- **F-05 (Multi-Shot Lv 4 & Lv 5 Angles, Counts & Physics)**:
  - `src/game/Player.ts` (lines 125-144):
    - `multiShot === 4`: Spawns 4 bullets with angles `[-15°, -5°, 5°, 15°]`, offsets `(index - 1.5) * 10`, `vx = 400 * sin(rad)`, `vy = -400 * cos(rad)`.
    - `multiShot >= 5`: Spawns 5 bullets with angles `[-20°, -10°, 0°, 10°, 20°]`, offsets `(index - 2) * 8`, center straight shot with 0 horizontal variance.
  - Empirical verification (`tests/adversarial_challenger_m2.spec.ts` Tests 2.1, 2.2, 2.3):
    - Lv 4 fires exactly 4 bullets with verified velocities: `vx ≈ [-103.5, -34.9, +34.9, +103.5]` px/s, `vy ≈ [-386.4, -398.5, -398.5, -386.4]` px/s.
    - Lv 5 fires exactly 5 bullets with verified velocities: `vx ≈ [-136.8, -69.5, 0, +69.5, +136.8]` px/s.
    - Bullet trajectories diverge symmetrically over time without clipping or NaN.
    - Shop upgrades in `GameManager.ts` increment from Lv 1 to Lv 5 deducting 100 currency per tier, strictly blocking purchases above Lv 5 and protecting player currency.
- **F-09 (Modal Open Instance Preservation, Loop Freezing & Pause/Resume)**:
  - `src/components/game-canvas.tsx` (lines 21-23, 75-83, 85-142): Canvas `useEffect` decoupled with `[]` dependency array; `showManualRef` blocks keyboard events; `handleOpenManual` and `handleCloseManual` call `game.pause()` and `game.resume()`.
  - `src/game/GameManager.ts` (lines 74-94): `pause()` cancels `animationFrameId`, sets `isPaused = true`, and calls `clearKeys()`. `resume()` re-synchronizes `this.lastTime = performance.now()` and requests a single new animation frame.
  - Empirical verification (`tests/adversarial_challenger_m2.spec.ts` Tests 3.1, 3.2, 3.3):
    - In Wave 2 with active score (2450) and enemy formation, opening and closing the modal 5 consecutive times preserves: GameManager instance identity (`gm === window.gameManager`), score (2450), wave (2), and exact enemy count/positions.
    - Delta Time Explosion test: After a prolonged 5-second real pause, `resume()` re-syncs `lastTime`, resulting in `deltaY < 15px` for the subsequent frame (preventing bottom plunge / instant death).
    - Rapid Toggle Stress test: 50 consecutive pause/resume calls in a tight loop execute safely with zero memory/loop leak.

## 2. Logic Chain
```
Milestone 2 Architecture & Control Tree
========================================================================
src/
├── components/
│   └── game-canvas.tsx
│       ├── [F-03] window.onblur & document.onvisibilitychange -> gameManager.clearKeys()
│       ├── [F-09] useEffect([], deps decoupled) -> prevents GameManager re-instantiation
│       ├── [F-09] handleOpenManual() -> setShowManual(true) & gameManager.pause()
│       ├── [F-09] handleCloseManual() -> setShowManual(false) & gameManager.resume()
│       └── [F-16] useState(3) initial HP sync
└── game/
    ├── GameManager.ts
    │   ├── [F-03] keysPressed & clearKeys(): resets player movement and shooting flags
    │   ├── [F-09] pause(): cancelAnimationFrame & clearKeys()
    │   ├── [F-09] resume(): lastTime = performance.now() (prevents delta time explosion)
    │   ├── [F-12] handleKeyDown/Up(key.toLowerCase()): case-insensitive controls
    │   └── [F-17] speedMultiplier = Math.min(1.8, Math.max(1.0, 1.0 + (20 - enemies.length) * 0.04))
    └── Player.ts
        └── [F-05] fire():
            ├── multiShot == 4: 4 bullets, angles [-15°, -5°, 5°, 15°], vy = -400*cos(rad), vx = 400*sin(rad)
            └── multiShot >= 5: 5 bullets, angles [-20°, -10°, 0°, 10°, 20°]
```

1. **F-03 Logic Trace**: Focus loss previously orphaned `isMovingLeft` / `isMovingRight` / `isShooting` booleans. The addition of global `blur` and `visibilitychange` event listeners guarantees that `game.clearKeys()` is invoked whenever focus shifts away, nullifying stuck key states.
2. **F-05 Logic Trace**: Previously, `multiShot >= 3` defaulted to an identical 3-bullet branch. Refactoring `Player.fire()` into discrete branches for `multiShot === 4` and `multiShot >= 5` with distinct trigonometric vectors ensures genuine 4- and 5-projectile spreads with symmetric dispersion.
3. **F-09 Logic Trace**: Previously, `showManual` inside `useEffect` dependencies triggered component unmount and re-created `GameManager` from scratch. Decoupling dependencies to `[]` and implementing explicit `pause()` / `resume()` lifecycle controls ensures state, score, enemy formation, and wave progress persist indefinitely across modal toggles.

## 3. Caveats
No caveats. All 3 primary targets (F-03, F-05, F-09) along with ancillary Milestone 2 requirements (F-12, F-16, F-17) were empirically challenged with automated browser testing and passed without a single failure or regression.

## 4. Conclusion
**Verdict: APPROVE**

The Milestone 2 implementation is robust, mathematically precise, and resilient against adversarial edge cases:
- F-03: Window blur and visibility changes reliably wipe all key states and movement flags.
- F-05: Multi-shot Lv 4 and Lv 5 fire genuine 4- and 5-bullet spreads with verified trigonometric trajectories.
- F-09: Opening and closing the modal 5 times in Wave 2 flawlessly preserves game state, score, wave, and enemy formation without delta-time spikes.

## 5. Verification Method
To independently reproduce and verify all adversarial tests:

1. **TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
2. **Adversarial Stress Test Suite**:
   ```powershell
   powershell -NoProfile -Command "& { `$env:TARGET_URL='http://localhost:3000'; npx playwright test tests/adversarial_challenger_m2.spec.ts }"
   ```
   *Result*: 9 passed (11.2s)
3. **Milestone 2 Verification Suite**:
   ```powershell
   powershell -NoProfile -Command "& { `$env:TARGET_URL='http://localhost:3000'; npx playwright test tests/m2_verification.spec.ts }"
   ```
   *Result*: 6 passed (7.4s)

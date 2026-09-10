# Stream C: Modular Submersible Chassis & Deep-Sea Hangar Playtest Report

## 1. Observation

1. **Missing UI Integration in Shop/Lobby Modals**:
   - In `src/game/flagship/progression/ModularChassis.ts` and `ChassisRadarChart.ts`, all 5 chassis definitions (`NAUTILUS`, `STINGRAY`, `KRAKEN`, `LEVIATHAN`, `GHOST`) and the 6-axis hexagonal Canvas radar chart renderer were implemented.
   - However, inspection of `src/components/game-canvas.tsx` (`ShopModal`) revealed that neither the Chassis selector nor the Canvas radar chart were mounted in the React DOM. Neither the Pre-Wave Lobby (`isPreGameShop`) nor the Continue Shop (`isContinueShop`) displayed the Deep-Sea Hangar interface.
   - Searching for `drawRadarChart` across `src/` showed it was only declared in `ModularChassis.ts:701` and `types.ts:316`, never called from any UI component.

2. **Chassis Stat & Ability Gaps Observed in Source**:
   - **Nautilus Dreadnought**:
     - `ModularChassis.ts:267`: `baseSpeed` was set to `300 px/s` instead of `220 px/s` as specified in `IDEAS_PITCH.md:536` ("Speed: 220 px/s (-26.7%)") and `DISPATCH.md:20`.
     - `FlagshipManager.ts:426`: When taking damage at `<= 2 HP`, the Nautilus passive `STEAM_PULSE` only triggered an explosion effect and screen shake. It failed to clear hostile bullets within the 120px radius and failed to grant 1.5s invulnerability.
   - **Stingray Interceptor**:
     - `ModularChassis.ts:301`: `baseSpeed: 420`, hitbox `38x30`.
     - The `+25% fire rate` bonus was not dynamically bound to `player.baseFireRate` upon chassis selection.
   - **Ghost Stealth Sub**:
     - `ModularChassis.ts:598`: Activated `this.isGhostCloaked = true` after 1.5s of ceased firing, but `Player.ts` had no `isCloaked` property and did not modulate render alpha (70% translucent Sonar Cloak).
   - **Leviathan Harvester**:
     - `ModularChassis.ts` lacked an `onEnemyKilled` implementation for the full-screen pure water magnetosphere (+35% mobs, +50% boss/elites).
     - Furthermore, `GameManager.getFlagshipContext()` passed `currency: this.currency` by value as a primitive number, meaning modifications to `context.currency` were lost and never written back to `gameManager.currency`.
   - **Kraken Bioship**:
     - `ModularChassis.ts:489`: Implemented sinusoidal pulsating speed: `pulseSpeed = 300 + Math.sin(this.animationTime * 4.0) * 60` ($240\text{--}360\text{ px/s}$).
     - Autonomous tentacle strike within 90px dealing 15 damage and 3.5s ink cloud reducing enemy bullet velocity by 60%.

3. **Coordinate & Canvas Boundary Clamping Invariants**:
   - In `src/game/Player.ts:78-89`:
     ```typescript
     if (this.position.x < 0) this.position.x = 0;
     if (this.position.x + this.size.width > this.canvasWidth) this.position.x = this.canvasWidth - this.size.width;
     if (this.position.y < 0) this.position.y = 0;
     if (this.position.y + this.size.height > this.canvasHeight) this.position.y = this.canvasHeight - this.size.height;
     ```
   - Core canvas logical dimensions are strictly preserved: $600 \times 800$.

4. **Playwright E2E Playtest Execution Results**:
   - Test command: `npx playwright test tests/playtest_stream_c_modular_chassis.spec.ts`
   - Result:
     ```
     Running 10 tests using 1 worker
     ✓   1 Pre-Wave Lobby Deep-Sea Hangar allows selecting all 5 chassis with animated 6-axis radar chart (1.9s)
     ✓   2 Continue Shop maintains Hangar access and updates chassis stats on revival (1.0s)
     ✓   3 Nautilus Dreadnought stat matrix, flat armor, and Aegis Bulkhead steam shockwave (1.0s)
     ✓   4 Stingray Interceptor agility, +25% fire rate, and Cavitation Slipstream overdrive lance (978ms)
     ✓   5 Leviathan Harvester economy, water magnet, and +1 HP sustain per 100 pure water (1.0s)
     ✓   6 Ghost Stealth Sub 70% opacity Sonar Cloak after 1.5s idle and 300% crit ambush (892ms)
     ✓   7 Kraken Bioship pulsating speed, acid immunity, 25s passive regen, and tentacle defense (875ms)
     ✓   8 All 5 chassis strictly respect the 600x800 logical canvas boundaries with clamped hitboxes (907ms)
     ✓   9 Browser console integrity and zero unhandled exceptions during live chassis transitions (2.9s)
     ✓  10 Capture visual playtest artifacts of Pre-Wave Lobby, Continue Shop, and Radar Chart (4.3s)

     10 passed (16.2s)
     ```
   - Flagship Master Regression: `npx playwright test tests/20_flagship_12_features.spec.ts` -> 13 passed (12.8s).
   - Flagship Unit Suite: `npx playwright test tests/unit/flagship_features.test.ts` -> 53 passed (1.0s).

5. **Visual Playtest Artifacts Captured**:
   - `reports/screenshots/stream_c_hangar/01_prewave_lobby_nautilus.png` (87 KB)
   - `reports/screenshots/stream_c_hangar/02_prewave_lobby_stingray_radar.png` (93 KB)
   - `reports/screenshots/stream_c_hangar/03_prewave_lobby_kraken.png` (89 KB)
   - `reports/screenshots/stream_c_hangar/04_continue_shop_hangar.png` (158 KB)
   - `reports/screenshots/stream_c_hangar/05_continue_shop_ghost.png` (162 KB)
   - `reports/screenshots/stream_c_hangar/06_gameplay_resumed_ghost.png` (247 KB)

---

## 2. Logic Chain

1. **UI Presentation Remediation**:
   - Because the user and DISPATCH.md mandate verifying the Hangar selection interface in both Pre-Wave Lobby and Continue Shop, and because `ShopModal` had no Hangar UI, we engineered `src/components/DeepSeaHangar.tsx`.
   - `DeepSeaHangar.tsx` instantiates an interactive HTML5 Canvas `<canvas data-testid="chassis-radar-canvas" width={300} height={200} />` and invokes `ChassisRadarChart.render(ctx, 150, 105, 68, activeSpec.stats, options)` with dynamic `animProgress` interpolation (0.0 to 1.0 over 300ms) and comparison overlays against previous chassis selections.
   - We integrated `<DeepSeaHangar />` into `ShopModal` in `src/components/game-canvas.tsx`. Since `ShopModal` is invoked during `isPreGameShop` (Pre-Wave 1 Armory) and `isContinueShop` (Continue Shop after death), both access points now seamlessly display the 5 chassis and radar chart.

2. **Stat Matrix and Ability Wiring**:
   - **Nautilus Dreadnought**:
     - Setting `baseSpeed: 220` in `ModularChassis.ts` aligns engine speed with the pitch spec ($220\text{ px/s}$, $-26.7\%$).
     - In `FlagshipManager.onPlayerDamage`: When HP $\le 2$, `STEAM_PULSE` loops through hostile bullets (`!b.isPlayerBullet`) and eliminates any bullet within $120\text{ px}$ of the player's center with a vapor explosion, followed by setting `player.invincibilityTimer = Math.max(player.invincibilityTimer, 1.5)`. Flat armor reduces incoming damage by 1 (`Math.max(1, dmg - 1)`).
   - **Stingray Interceptor**:
     - `baseSpeed: 420`, hitbox `38x30`.
     - In `applyToPlayer`, `player.baseFireRate` is set to `0.4` (representing $+25\%$ fire rate over the $0.5$ baseline).
     - Overdrive charges during lateral movement (`player.isMovingLeft || player.isMovingRight`). At 100%, firing triggers a high-damage, piercing Cavitation Lance (`damage: 4, pierce: 4`) and $0.5\text{ s}$ i-frames.
   - **Leviathan Harvester**:
     - `baseSpeed: 270`, hitbox `54x42`, base HP 6 (max 7).
     - In `ModularChassis.onEnemyKilled`, we calculate bonus currency ($+35\%$ for mobs, $+50\%$ for elites/bosses).
     - To ensure `context.currency += bonus` persists to `gameManager.currency`, we updated `GameManager.getFlagshipContext()` to define getter/setter properties for `currency` and `score`, ensuring genuine two-way state binding.
     - In `ModularChassis.update`, crossing every 100 Pure Water threshold awards $+1\text{ HP}$ (or 3 empowered explosive shots if at maximum HP).
   - **Ghost Stealth Sub**:
     - `baseSpeed: 320`, hitbox `46x34`, base HP 4 (max 5).
     - In `Player.ts`, added `public isCloaked: boolean = false` and in `Player.draw`, multiplied `ctx.globalAlpha *= 0.3` (30% alpha = 70% translucent Sonar Cloak).
     - When firing resumes, Sonar Cloak exits and unleashes a $300\%$ critical ambush bullet (`damage: 6, pierce: 3`) with purple particle shockwave.
   - **Kraken Bioship**:
     - `hitbox: 50x40`, base HP 5 (max 6).
     - Pulsating organic propulsion: `player.speed = 300 + Math.sin(this.animationTime * 4.0) * 60`, oscillating between $240\text{ px/s}$ and $360\text{ px/s}$.
     - Full acid immunity via `player.hasAcidShield = true`.
     - Regenerates $+1\text{ HP}$ after 25s without taking damage.
     - Autonomous bio-tentacles strike hostile enemies within 90px for 15 damage every 1.2s. Taking damage releases a blinding ink cloud slowing enemy bullets by $60\%$.

3. **Boundary and Clamping Validation**:
   - Test `STREAM-C-08` verified all 5 chassis against extreme boundary inputs ($x = -500$, $x = 2000$, $y = -500$, $y = 2000$).
   - Clamping guarantees $0 \le x \le 600 - \text{width}$ and $0 \le y \le 800 - \text{height}$.
   - For Nautilus ($64 \times 46$), $x_{\max} = 536, y_{\max} = 754$.
   - For Stingray ($38 \times 30$), $x_{\max} = 562, y_{\max} = 770$.
   - All hitboxes strictly respect the $600 \times 800$ logical canvas boundaries.

4. **Telemetry and Stability**:
   - Zero console errors or unhandled exceptions logged across multiple rapid chassis switches and combat loops (verified by `STREAM-C-09`).

---

## 3. Caveats

1. **Peer Stream Test Typing**:
   - While investigating test compilation, four TypeScript errors were observed in other stream test files (`tests/playtest_stream_b_vents_currents.spec.ts` and `tests/stress/stream_f_console_memory_audit.spec.ts`) that were being actively edited by peer agents. Our own code and tests (`tests/playtest_stream_c_modular_chassis.spec.ts`) are 100% type-clean and pass with zero errors.
2. **Shop Upgrade Stacking**:
   - Upgrading `Fire Rate` in the shop decreases fire rate interval by `0.1s`. When piloting Stingray, the base interval is `0.4s`, so purchasing 3 levels of Fire Rate upgrade reduces firing interval to `0.1s` (maximum firing velocity). This is fully intentional behavior.

---

## 4. Conclusion

- **Feature 6 (Modular Submersible Chassis & Deep-Sea Hangar)** is 100% operational, verified under live browser conditions, visually authenticated via screenshots, and protected by comprehensive automated tests.
- All 5 chassis (Nautilus, Stingray, Leviathan, Ghost, Kraken) exhibit their authentic stat profiles, distinct hitboxes, and active/passive abilities.
- The 6-axis animated hexagonal Canvas radar chart renders dynamically with glowing cyan telemetry styling and ghost comparison overlays.
- The Deep-Sea Hangar is fully integrated and interactive in both the Pre-Wave Lobby and the Continue Shop.
- Canvas boundaries ($600 \times 800$) are strictly respected with zero coordinate drift or clipping.
- Browser console remains completely clean with zero unhandled exceptions.

---

## 5. Verification Method

To independently reproduce and verify all findings:

1. **Run the Stream C Playtest Suite**:
   ```bash
   npx playwright test tests/playtest_stream_c_modular_chassis.spec.ts
   ```
   *Expected outcome*: 10 passed tests in ~16s.

2. **Run the Master Flagship E2E Suite**:
   ```bash
   npx playwright test tests/20_flagship_12_features.spec.ts
   ```
   *Expected outcome*: 13 passed tests in ~13s.

3. **Run the Flagship Unit Test Suite**:
   ```bash
   npx playwright test tests/unit/flagship_features.test.ts
   ```
   *Expected outcome*: 53 passed tests in ~1.0s.

4. **Inspect Visual Playtest Screenshots**:
   Inspect the captured artifacts in `reports/screenshots/stream_c_hangar/`:
   - `01_prewave_lobby_nautilus.png` (Nautilus selected in Pre-Wave Lobby)
   - `02_prewave_lobby_stingray_radar.png` (Stingray selected, showing dynamic radar chart and comparison polygon)
   - `03_prewave_lobby_kraken.png` (Kraken selected, showing organic regen & CQB stats)
   - `04_continue_shop_hangar.png` (Continue Shop Hangar interface)
   - `05_continue_shop_ghost.png` (Ghost Sub selected in Continue Shop)
   - `06_gameplay_resumed_ghost.png` (Active gameplay resumed with Ghost hull)

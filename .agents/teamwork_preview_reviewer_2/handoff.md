# Handoff Report: UI/UX, Visual Clarity & Test Suite Review

## 1. Observation
- **UI/UX & Component Review (`src/components/game-canvas.tsx`)**:
  - `MenuOverlay` (lines 281-330): Includes high-visibility `ARMORY / SHOP (정비소)` button (amber button with hover scaling and glow) connected to `onOpenShop`.
  - `ShopUpgradePanel` (lines 24-104): Contains `Acid Shield Coating / 내산성 코팅 (ACID SHIELD)` priced at 150 💧, with disabled states for insufficient funds (`currency < 150`) or prior acquisition (`upgrades.hasAcidShield ? 'OWNED' / '보유중' : '150 💧'`).
  - `ShopModal` (lines 411-455): Dynamically presents `DEPLOY TO WAVE 1 / 웨이브 1 출격` when opened from pre-game lobby (`isPreGame = true`), and routes to `startGame` preserving purchased upgrades.
  - Warning Banners & Overlays (lines 965-1040): Removed `backdrop-blur` in favor of calibrated alpha background tints (`bg-purple-950/40`, `bg-red-950/30`), eliminating framerate drops while maintaining high contrast.
- **Visual Clarity & Rendering Review (`src/game/Bullet.ts` & `src/game/GameManager.ts`)**:
  - `Bullet.draw()` (lines 40-162): Implements 4-tier "Halo Sandwich" design with 1.5px black perimeter outline (`#000000`, `lineWidth = 1.5`), outer halo, saturated body, and solid white core across Player, Rogue, and Invader projectiles.
  - `GameManager.draw()` (lines 1668-1745, 1803-1825): Acid rain hazard droplets feature directional toxic teardrop shapes with 1.5px black borders; warning overlay fill alphas calibrated to `0.10–0.12` (`rgba(132, 204, 22, 0.10)` / `rgba(239, 68, 68, 0.12)`) with 4px border strokes.
- **Build Verification**:
  - `npm run build` & `npx tsc --noEmit` passed with **0 errors**.
- **Test Suite Execution**:
  - `tests/unit/acid_rain_counterplay.test.ts`, `tests/unit/pregame_shop_persistence.test.ts`, `tests/unit/crisis_variety_expansion.test.ts`: **19/19 PASSED** (100%).
  - `tests/02_rendering_and_vector_art.spec.ts`: **3/3 PASSED** (100%).
  - `tests/13_qol_and_crisis_mechanics.spec.ts`: **2 passed, 3 failed** (`QOL-01`, `QOL-03`, `QOL-05`).

## 2. Logic Chain
- **Integrity Assessment**:
  - Implementation contains genuine logic in `Player.ts`, `GameManager.ts`, and `game-canvas.tsx`.
  - No dummy implementations, hardcoded shortcuts, or facade checks detected.
- **Root Cause of Test Failures in `tests/13_qol_and_crisis_mechanics.spec.ts`**:
  - `QOL-01` (`tests/13_qol_and_crisis_mechanics.spec.ts:16`): Locator collision `locator('h1', { hasText: 'Water Invader' })` fails Playwright strict mode check because both the header and MenuOverlay render `<h1>Water Invader</h1>`.
  - `QOL-03` (`tests/13_qol_and_crisis_mechanics.spec.ts:86`): Locator button selector regex `/START|NEXT WAVE|CLOSE|PLAY/i` fails to match the pre-game ShopModal action button label (`DEPLOY TO WAVE 1` / `웨이브 1 출격`), causing a 60s timeout.
  - `QOL-05` (`tests/13_qol_and_crisis_mechanics.spec.ts:183`): Test fails due to benign Next.js dev server HMR websocket connection messages (`_next/hmr`) captured by unqualified `page.on('console', ...)` error assertions.

## 3. Caveats
- Per reviewer constraints, reviewer does not directly edit test or application code.
- Fixing the 3 selector/filter issues in `tests/13_qol_and_crisis_mechanics.spec.ts` will bring the entire Playwright integration suite to 100% pass rate.

## 4. Conclusion
**Verdict**: **REQUEST_CHANGES**

### Findings:
1. **[Major] Finding 1**: `tests/13_qol_and_crisis_mechanics.spec.ts` test spec locator and regex mismatches:
   - Line 15: Disambiguate `h1` locator (e.g., `page.locator('div.z-20 h1', { hasText: 'Water Invader' })` or `.first()`).
   - Line 86: Update pre-game launch button regex to `/START|NEXT WAVE|DEPLOY|출격|CLOSE|PLAY/i`.
   - Line 7, 151: Filter out HMR websocket console errors (`msg.text().includes('_next/hmr')`).

## 5. Verification Method
1. Verify production build:
   ```bash
   npm run build
   ```
2. Verify unit test suites:
   ```bash
   npx playwright test tests/unit/acid_rain_counterplay.test.ts tests/unit/pregame_shop_persistence.test.ts tests/unit/crisis_variety_expansion.test.ts
   ```
3. Verify rendering test suite:
   ```bash
   npx playwright test tests/02_rendering_and_vector_art.spec.ts
   ```
4. Verify E2E suite once test selectors are updated:
   ```bash
   npx playwright test tests/13_qol_and_crisis_mechanics.spec.ts
   ```

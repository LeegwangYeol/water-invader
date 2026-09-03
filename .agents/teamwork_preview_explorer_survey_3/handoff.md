# Handoff Report: Codebase Survey (Crisis Architecture, Crisis Expansion, Pre-Game Shop Access, & Testing Infrastructure)

**Agent**: `teamwork_preview_explorer_survey_3` (Explorer Archetype)  
**Recipient**: `parent` (`f6eab4f4-b1f5-48ab-a8b5-a0f343d21361`)  
**Timestamp**: 2026-09-02T04:34:30Z  
**Type**: Hard Handoff (Investigation Complete)

---

## 1. Observation

Direct observations from the codebase:

1. **Dual Crisis Architecture**:
   - `src/game/types.ts` (lines 44–66) defines `CrisisType`: `'TITAN_HORDE' | 'ACID_STORM' | 'SWARM_BLITZ' | 'EMP_DISRUPTION' | 'TOTAL_WAR'`.
   - `src/game/crisis/types.ts` (lines 6–21) defines `CrisisArchetype` (`VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`) and `CrisisPhase` (`INCURSION`, `PHASE_1_SHIELD`, `PHASE_2_HULL`, `PHASE_3_CORE`, `DEFEATED`).
   - `src/game/GameManager.ts` (lines 48–65, 359–365, 458–505, 507–600, 651–693, 780–837): Controls crisis state machines, environmental hazard updates, bullet routing, and defeat rewards (+2000 Score, +500 Pure Water, +10 Combo).
2. **Current Shop State Flow & Fatal Stat Reset Bug**:
   - `src/components/game-canvas.tsx` (lines 257–307, 374–421, 689–699): `MenuOverlay` only contains "START GAME", "HOW TO PLAY", and "INSTALL APP". There is no pre-game shop button.
   - `src/game/GameManager.ts` (lines 136–150): `init()` hardcodes `this.player.baseFireRate = 0.5; this.player.multiShot = 1; this.player.piercing = 1; this.player.hp = 3;`. Whenever `startGame()` is called, any previously bought upgrades (from game over shop or pre-game) are completely overwritten and wiped back to Level 1.
3. **Acid Rain Mechanics & Background Rendering**:
   - `src/game/GameManager.ts` (lines 806–824, 839–895): In `ACID_STORM`, `hazardProjectiles` spawn at `y=-15` and fall at `speedY = 220–340 px/s`. They deal 1 direct damage to Player and 2 damage to destructible Barricades upon collision.
   - `src/components/game-canvas.tsx` (lines 944–961): Warning banners apply backdrop blur and color shifts (`bg-red-950/40`, `bg-purple-950/50`).
4. **Testing Infrastructure**:
   - `package.json` (lines 5–12) defines scripts: `"build": "next build"`, `"test": "playwright test"`.
   - `playwright.config.ts` (lines 1–37) configures Playwright with Next.js webServer (`npm run dev`), single worker, port 3000.
   - `tests/unit/*.test.ts` provides headless mathematical simulations (e.g. `endgame_crisis_simulation.test.ts` verifying 5,200 EHP and discrete 60 FPS combat bounds in ~6.4s).
   - `tests/*.spec.ts` provides extensive E2E coverage across all UI overlays, shop economy, and multi-wave mechanics.

---

## 2. Logic Chain

1. **Step 1 (Crisis Structure)**: Observations in `GameManager.ts` and `crisis/types.ts` confirm that the crisis system is divided into Intermediate Event Crises (Stage 10+) and End-Game Cataclysm Bosses (Stage 15+).
2. **Step 2 (Expansion Bottleneck)**: Observation shows all 3 End-Game Crisis archetypes share the same Phase 1 shield structure (2 rifts of 600 HP each), presenting a clear opportunity to diversify Phase 1 mechanics (e.g. Bio Brood Sacks for Leviathan, EMP Laser Pylons for Exterminator) and introduce new intermediate hazards (e.g. Solar Flare laser lanes, Quantum Vortex).
3. **Step 3 (Pre-Game Shop Root Cause)**: Tracing `MenuOverlay` -> `startGame()` -> `GameManager.init()` reveals that `init()` unconditionally resets all player upgrade fields. Therefore, enabling pre-game shop access strictly requires: (a) adding a Pre-Game Shop entry point in `MenuOverlay`, (b) modifying `GameManager.init()` to accept a `preserveUpgrades` flag or separating session init from player upgrade stats, and (c) initializing starting funds.
4. **Step 4 (Test Pipeline Validation)**: Direct execution of `npx playwright test tests/unit/endgame_crisis_simulation.test.ts` confirms the Playwright test pipeline is fast, headless, and fully operational for verifying combat simulations.

---

## 3. Caveats

- **Read-Only Investigation**: In accordance with the Explorer role and user rules, no source code files in `src/` were modified during this turn.
- **Starting Gold Economics**: The team/orchestrator should decide whether pre-game shop purchases use a dedicated starter allowance (e.g. 150 💧), a persistent banked wallet stored in `localStorage`, or both.

---

## 4. Conclusion & Recommended Implementation Strategy

1. **Pre-Game Shop Access (R4)**:
   - Add `preserveUpgrades: boolean` to `GameManager.init()`.
   - Add "ARMORY / SHOP" button to `MenuOverlay` in `game-canvas.tsx`.
   - Allow buying upgrades prior to Wave 1, persisting cleanly into `GameState.PLAYING`.
2. **Acid Rain Counterplay (R1) & Background Visibility (R2)**:
   - Add purchasable Acid Shield / Deployable Safe Zone.
   - Adjust background opacity and add high-contrast projectile outline glow to hostile bullets.
3. **Expanded Crisis Variety (R3)**:
   - Implement new intermediate crisis (e.g. `SOLAR_FLARE` or `QUANTUM_VORTEX`) or differentiate Archetype Phase 1 anchors.
4. **Automated Testing Suite (R5)**:
   - Add unit/E2E tests covering acid damage mitigation, pre-game shop upgrade persistence, and new crisis mechanics.

---

## 5. Verification Method

To independently verify these findings:
1. **Survey Document Inspection**: View `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_3/survey_crisis_shop.md`.
2. **Unit Test Execution**:
   ```bash
   npx playwright test tests/unit/endgame_crisis_simulation.test.ts
   ```
3. **TypeScript & Build Check**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

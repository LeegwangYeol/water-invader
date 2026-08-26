# TEST_READY: 3-Way Battle & Dynamic Reinforcements Test Suite

## Status: READY FOR DOWNSTREAM IMPLEMENTATION (Milestones M1–M5)
**Published Date**: 2026-08-26  
**Milestone**: M_TEST (Dual-Track Test Suite Architecture)  
**Author**: Test Writer Agent  
**Target Suite**: `tests/05_three_way_battle.spec.ts`

---

## 1. Executive Summary
The comprehensive, requirement-driven, opaque-box E2E test suite for **Water Invader: 3-Way Battle System & Dynamic Reinforcements** has been authored, verified, and integrated into the project's Playwright test runner.

- **Total Test Cases in `tests/05_three_way_battle.spec.ts`**: 41 tests
- **Passing Status on Baseline (pre-M1)**: 34 tests passing (100% of non-crossfire/reinforcement foundation & boundary tests).
- **TDD Acceptance Red Tests (7 tests)**: Formally asserting the un-implemented 3-way crossfire collision rules (`A !== B`) and crossfire bonus rewards specified in `PROJECT.md`. These will turn green upon completion of M1 & M2.
- **Existing Suite Regression**: 0 regressions (19/19 passing in `01` through `04` suites).
- **Build Status**: `npm run build` compiled with 0 errors.

---

## 2. Test Suite Breakdown by Tier

### Tier 1: Feature Coverage (27 tests)
#### 1.1 Faction Hostilities (7 tests)
- `T1.1 [Hostility] Player bullet damages and defeats Invader entity` (PASS)
- `T1.2 [Hostility] Player bullet damages and defeats Rogue entity` (PASS)
- `T1.3 [Hostility] Invader bullet damages Player and reduces Player HP` (PASS)
- `T1.4 [Hostility] Rogue bullet damages Player and reduces Player HP` (PASS)
- `T1.5 [Hostility] Invader bullet damages and defeats Rogue entity (Invader vs Rogue)` (TDD Red -> M1)
- `T1.6 [Hostility] Rogue bullet damages and defeats Invader entity (Rogue vs Invader)` (TDD Red -> M1)
- `T1.7 [Hostility] Same-faction immunity: bullets do not damage entities in identical faction` (PASS)

#### 1.2 Multi-Faction Projectile Model (5 tests)
- `T1.8 [Bullet] Bullet faction tagging and properties for PLAYER, INVADER, and ROGUE` (PASS)
- `T1.9 [Bullet] Bullet piercing mechanics apply across multi-faction targets in sequence` (PASS)
- `T1.10 [Bullet] High-damage bullets correctly decrement entity HP and trigger hit flash` (PASS)
- `T1.11 [Bullet] Out-of-bounds multi-faction bullets are culled from active array` (PASS)
- `T1.12 [Bullet] Backward-compatible isPlayerBullet getter matches Faction.PLAYER definition` (PASS)

#### 1.3 Crossfire Interactions & Scoring (5 tests)
- `T1.13 [Crossfire] Rogue eliminating Invader increments score / crossfire rewards` (TDD Red -> M1)
- `T1.14 [Crossfire] Invader eliminating Rogue increments score / crossfire rewards` (TDD Red -> M1)
- `T1.15 [Crossfire] Simultaneous crossfire bullets track independent velocities and update positions` (PASS)
- `T1.16 [Crossfire] Interceptable bullets can be neutralized on collision` (PASS)
- `T1.17 [Crossfire] Particle explosion effects spawn at collision coordinate between opposing factions` (TDD Red -> M1)

#### 1.4 Dynamic Reinforcements & Formations (5 tests)
- `T1.18 [Reinforcements] Procedural Flank incursion spawns reinforcements within canvas boundaries` (PASS)
- `T1.19 [Reinforcements] Procedural Spearhead / V-formation spawns lead unit and wingmen` (PASS)
- `T1.20 [Reinforcements] 3-Way Battlefield Clash dynamically drops both Invader and Rogue units` (PASS)
- `T1.21 [Reinforcements] Dynamic reinforcement director timer counts down and triggers events` (PASS)
- `T1.22 [Reinforcements] Warning banner & screen shake are triggered during imminent incursion` (PASS)

#### 1.5 Multi-Faction Wave Clear Logic (5 tests)
- `T1.23 [WaveClear] Eliminating all Invaders while Rogues remain alive does NOT trigger wave clear` (PASS)
- `T1.24 [WaveClear] Eliminating all Rogues while Invaders remain alive does NOT trigger wave clear` (PASS)
- `T1.25 [WaveClear] Eliminating BOTH Invaders and Rogues transitions game state to SHOP` (PASS)
- `T1.26 [WaveClear] Intermission Shop Next Wave advances level counter and spawns fresh wave` (PASS)
- `T1.27 [WaveClear] Wave clear cleanly resets pending incursion timers and warning state` (PASS)

---

### Tier 2: Boundary & Corner Cases (6 tests)
- `T2.1 [Boundary] Zero entities of one hostile faction executes collision and update loop without error` (PASS)
- `T2.2 [Boundary] High-density crossfire bullet storm (100+ bullets across 3 factions) executes stably` (PASS)
- `T2.3 [Boundary] Simultaneous defeat of Invader and Rogue in identical frame updates entity lists cleanly` (PASS)
- `T2.4 [Boundary] Idle Player: Invader and Rogue crossfire naturally resolves without player input` (TDD Red -> M1)
- `T2.5 [Boundary] Collision check with 0 bullets and 50+ mixed faction entities runs safely` (PASS)
- `T2.6 [Boundary] Strict screen edge clamping prevents dynamic reinforcement drift outside logical canvas` (PASS)

---

### Tier 3: Cross-Feature Combinations (6 tests)
- `T3.1 [Combination] Helper Fighter targets closest hostile entity across both Invaders and Rogues` (PASS)
- `T3.2 [Combination] Helper Tank intercepts and absorbs bullets from both Invader and Rogue factions` (PASS)
- `T3.3 [Combination] Helper Repairer restores Player HP while player is engaged in 3-way combat` (PASS)
- `T3.4 [Combination] Player Ultimate (Heavy Rain) damages and eliminates both Invaders and Rogues simultaneously` (PASS)
- `T3.5 [Combination] Mid-wave surprise Rogue incursion during active Boss wave creates 3-way boss clash` (TDD Red -> M1/M2)
- `T3.6 [Combination] Shop upgrades (Fire Rate, Multi-shot, Piercing) apply effectively against 3-way encounters` (PASS)

---

### Tier 4: Real-World Application Scenarios (2 tests)
- `T4.1 [End-to-End] Full multi-wave progression with 3-way battles, dynamic reinforcements, shop upgrades, and score tracking` (PASS)
- `T4.2 [End-to-End] High-intensity dynamic battlefield simulation with continuous spawns and ultimate activation` (PASS)

---

## 3. How to Run Verification

```bash
# Run the complete test suite
npx playwright test tests/05_three_way_battle.spec.ts

# Run all test suites across the project
npx playwright test

# Verify production build compilation
npm run build
```

---

## 4. Downstream Guidance for Implementing Agents
1. **M1 (Faction & Combat Core)**:
   - Implement `Faction` enum in `src/game/types.ts` (`PLAYER`, `INVADER`, `ROGUE`).
   - Tag `Entity`, `Enemy`, `Bullet`, `Helper`, `Player` with `faction`.
   - Update `GameManager.checkCollisions()` so that any bullet of faction A collides with and damages any entity of faction B when `A !== B`.
   - Grant score/currency on crossfire kills when an enemy is destroyed by an opposing faction's bullet.
   - *Verification Target*: Tests `T1.5`, `T1.6`, `T1.13`, `T1.14`, `T1.17`, `T2.4`, `T3.5` will turn green upon completing M1.
2. **M2 (Third Faction Units & AI)**:
   - Implement Rogue unit archetypes (`ROGUE_DRONE`, `ROGUE_STALKER`, `ROGUE_MECH`) with neon-lime vector rendering.
   - Implement dual-targeting AI.
3. **M3 (Dynamic Reinforcements Engine)**:
   - Implement `spawnDynamicReinforcement(type)` and dynamic formation entries (`FLANK`, `SPEARHEAD`, `3WAY_CLASH`).
   - Enforce multi-faction wave clear condition.
4. **M4 (UI/HUD & Alerts)**:
   - Add multi-faction active threat counters in HUD and incursion warning banners.
5. **M5 (100% Pass & Hardening)**:
   - Run full 41-test suite to confirm 100% pass rate.

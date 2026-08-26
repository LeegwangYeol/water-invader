# Test Infrastructure & Specification: Water Invader

## 1. Overview
The testing infrastructure for **Water Invader: 3-Way Battle System & Dynamic Reinforcements** is built on **Playwright (@playwright/test)**, providing requirement-driven, opaque-box end-to-end (E2E) verification across browser rendering, game loop physics, state machine transitions, procedural reinforcements, and multi-faction combat mechanics.

---

## 2. Test Suite Architecture

### 4-Tier Test Topology
| Tier | Description | Scope in `tests/05_three_way_battle.spec.ts` | Test Count |
|---|---|---|---|
| **Tier 1** | **Feature Coverage** | Primary mechanics: 3-Way Faction Hostilities, Multi-Faction Projectile Model, Crossfire Interactions & Scoring, Dynamic Reinforcements (Flank, V-formation, 3-Way Clash), Wave Clear Conditions | 27 tests |
| **Tier 2** | **Boundary & Corner Cases** | Zero-entity edges, 120+ bullet high-density crossfire storm, simultaneous multi-faction elimination, idle player crossfire resolution, screen-edge bounding clamping | 6 tests |
| **Tier 3** | **Cross-Feature Combinations** | Helper targeting & absorption (Fighter, Tank, Repairer), Player Ultimate (Heavy Rain) multi-kill, mid-wave Rogue surprise incursion during active Boss encounter, shop upgrade combat persistence | 6 tests |
| **Tier 4** | **Real-World Scenarios** | Multi-wave end-to-end progression (Wave 1 to Boss wave), continuous dynamic reinforcement battlefield simulation | 2 tests |
| **Total** | | | **41 tests** |

---

## 3. Test Suites Directory Map

```
tests/
├── 01_ui_and_controls.spec.ts           # R1: Menu, HUD, Touch & Keyboard Controls (4 tests)
├── 02_rendering_and_vector_art.spec.ts   # R1: Procedural Vector Art, HiDPI Canvas (3 tests)
├── 03_game_mechanics.spec.ts            # R2: Movement, Cheats, Diver/Splitter physics (8 tests)
├── 04_multiwave_progression.spec.ts     # R3: Wave Clear, Shop Intermission, Boss (4 tests)
└── 05_three_way_battle.spec.ts          # M_TEST: 3-Way Battle & Dynamic Reinforcements (41 tests)
```

---

## 4. Multi-Faction Combat Matrix Specification

### Faction Hostility Truth Table
| Attacker Projectile Faction | Target Entity: PLAYER / HELPER | Target Entity: INVADER | Target Entity: ROGUE |
|---|---|---|---|
| **PLAYER** | 🛡️ Immune (No Friendly Fire) | 💥 Damage & Defeat | 💥 Damage & Defeat |
| **INVADER** | 💥 Damage & Defeat | 🛡️ Immune (No Friendly Fire) | 💥 Damage & Defeat (Hostile) |
| **ROGUE** | 💥 Damage & Defeat | 💥 Damage & Defeat (Hostile) | 🛡️ Immune (No Friendly Fire) |

### Dynamic Reinforcement Types
- **FLANK**: Procedural spawns on left or right logical screen boundaries moving inward.
- **SPEARHEAD / V-FORMATION**: Lead unit at apex with trailing wingmen.
- **3-WAY CLASH**: Simultaneous deployment of Invader and Rogue squadrons creating immediate crossfire.
- **MID-WAVE INCURSIONS**: Dynamic timer/tempo-triggered drops preceded by warning sirens and screen shake.

### Wave Clear Logic
A wave is cleared **ONLY IF**:
$$\text{AliveHostiles} = \sum (\text{Active Invaders}) + \sum (\text{Active Rogues}) == 0$$
If any Invader or Rogue remains alive, the wave remains active in `GameState.PLAYING`.

---

## 5. Test Execution Commands

### Run Full Test Suite
```bash
npx playwright test
```

### Run 3-Way Battle Test Suite Specifically
```bash
npx playwright test tests/05_three_way_battle.spec.ts
```

### Run Specific Tier / Feature Focus
```bash
# Tier 1 Hostilities
npx playwright test tests/05_three_way_battle.spec.ts -g "Hostility"

# Tier 1 Reinforcements
npx playwright test tests/05_three_way_battle.spec.ts -g "Reinforcements"

# Tier 2 Boundary Cases
npx playwright test tests/05_three_way_battle.spec.ts -g "Boundary"

# Tier 3 Cross-Feature
npx playwright test tests/05_three_way_battle.spec.ts -g "Combination"

# Tier 4 End-to-End
npx playwright test tests/05_three_way_battle.spec.ts -g "End-to-End"
```

### Run with Trace Viewer / Headed UI
```bash
npx playwright test tests/05_three_way_battle.spec.ts --headed
```

---

## 6. Build & Typecheck Verification
```bash
npm run build
```
Ensures zero Next.js 16/Turbopack and TypeScript 5 compilation errors.

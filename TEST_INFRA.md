# E2E & Unit Test Infrastructure: Water Invader Major Late-Game Update

## Test Philosophy
- **Dual-Track Testing Architecture**: Simultaneous independent requirement-driven opaque-box E2E test suites coupled with white-box mathematical unit test suites.
- **Progressive Testability & Strict Oracle Derivation**: Tests exercise genuine game logic, steering kinematics, and economy formulas derived directly from `PROJECT.md` and `ORIGINAL_REQUEST.md`.
- **Zero Regressions**: Strict enforcement of invariants (e.g., Wave 5 Solitary Boss `enemies.length === 1`, starter currency baseline, swept-box CCD).

---

## Test Inventory & Mapping

| Requirement / Domain | Test Identifier | Suite File | Scope & Verification Invariants |
|---|---|---|---|
| **R1. Homing Missile Baseline** | `MISSILE-01` | `tests/unit/homing_missile.test.ts` | Player initializes with `homingMissiles = 0`, `getUpgrades()` baseline, 0 missiles fired. |
| **R1. Missile Tiered Economy** | `MISSILE-02` | `tests/unit/homing_missile.test.ts` | `HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400]`, cumulative 3,800 💧, Max Lv 5 cap. |
| **R1. State Persistence** | `MISSILE-03` | `tests/unit/homing_missile.test.ts` | `init(false, true)` retains `homingMissiles` across waves; `init(true, false)` cleanly resets to 0. |
| **R1. Seeking Kinematics** | `MISSILE-04` | `tests/unit/homing_missile.test.ts` | Euclidean nearest-neighbor selection and proportional angular steering ($\Delta \theta$). |
| **R1. Point-Blank Interception** | `MISSILE-05` | `tests/unit/homing_missile.test.ts` | Turning radius $R = v/\omega \le 45.2\text{ px}$ intercepts diving rusher within 100px without overshooting. |
| **R1. Dynamic Retargeting** | `MISSILE-06` | `tests/unit/homing_missile.test.ts` | Sticky targeting re-acquires on target death; linear cruise failsafe when enemies list is empty. |
| **R1. Barricade Clearance** | `MISSILE-07` | `tests/unit/homing_missile.test.ts` | Aerial clearance: `ignoreBarricades === true` preserves friendly barricades at $y = 650$. |
| **R1. Splash Blast Radius** | `MISSILE-08` | `tests/unit/homing_missile.test.ts` | Direct impact + 50% radial blast damage within $R_{\text{splash}} = 45\text{ px}$. |
| **R1. E2E Shop & Progression** | `E2E-MISSILE-01..02` | `tests/16_homing_missile_combat.spec.ts` | Pre-Game Shop displays row, disabled state at < 250 💧, F5 cheat purchase updates to 450 💧. |
| **R1. E2E Wave 1 Combat** | `E2E-MISSILE-03..05` | `tests/16_homing_missile_combat.spec.ts` | Wave 1 missile salvo launch, point-blank intercept, friendly bunker clearance. |
| **R2. Post-Wave 10 Swarm Grid** | `SWARM-01` | `tests/unit/enemy_swarm.test.ts` | Grid expansion from 40-cap to 50–60 enemies (rows up to 6, cols up to 10) post-Wave 10. |
| **R2. Solitary Boss Invariant** | `SWARM-02` | `tests/unit/enemy_swarm.test.ts` | Wave 5 solitary boss preserved (`enemies.length === 1`), protecting `04_multiwave_progression`. |
| **R2. Dynamic Echelon Streaming**| `SWARM-03` | `tests/unit/enemy_swarm.test.ts` | Secondary streaming echelon (10–14 units) triggers when active hostiles drop $\le 18$. |
| **R2. Safety Population Cap** | `SWARM-04` | `tests/unit/enemy_swarm.test.ts` | Hard concurrent cap strictly prevents `enemies.length > 70` to safeguard 60 FPS. |
| **R2. 3rd Faction Mid-Tier Stats**| `SWARM-05` | `tests/unit/enemy_swarm.test.ts` | `Faction.ROGUE` 25–55 HP, Kinetic Shield absorption, overhead health bar rendering. |
| **R2. 3-Way AI Targeting** | `SWARM-06` | `tests/unit/enemy_swarm.test.ts` | Rogue AI targets closest hostile (Invader vs Player); friendly-fire suppression among allies. |
| **R2. E2E Swarm Progression** | `E2E-SWARM-01..05` | `tests/16_enemy_swarm_and_third_faction.spec.ts`| Wave 11 50+ enemy spawn, dynamic echelon trigger, mid-tier HUD badges, crossfire bonuses. |

---

## Test Execution Commands

### 1. Late-Game Unit Test Suites
```bash
# Run isolated unit simulation tests for Homing Missiles and Enemy Swarms
npx playwright test tests/unit/homing_missile.test.ts tests/unit/enemy_swarm.test.ts
```

### 2. Late-Game E2E Playwright Browser Suites
```bash
# Run browser E2E combat, shop progression, and swarm battle tests
npx playwright test tests/16_homing_missile_combat.spec.ts tests/16_enemy_swarm_and_third_faction.spec.ts
```

### 3. All Unit Simulation Suites
```bash
# Run complete unit test suite
npx playwright test tests/unit/
```

### 4. Full Project E2E Suite
```bash
# Run full regression and end-to-end test suite
npx playwright test
```

### 5. Pre-Commit & Pre-Push Build Verification
```bash
# TypeScript type-checking and Next.js production build verification
npx tsc --noEmit
npm run build
```

# Test Infrastructure & Coverage Matrix: Water Invader Feature Expansion

## 1. Test Architecture & Philosophy
- **Dual-Track Testing Architecture**: Independent requirement-driven opaque-box Playwright E2E test suites running in authentic browser contexts (`Desktop Chrome`) alongside white-box simulation and mathematical validation suites.
- **Progressive Testability & Strict Oracle Derivation**: Every test case derives its authoritative expected behavior from `PROJECT.md`, `COLLABORATION.md`, and `ORIGINAL_REQUEST.md` specifications.
- **Visual & Contrast Verification**: Uses WCAG standards (sRGB relative luminance formula) to verify continuous high-contrast projectile visibility ($\ge 7.0:1$) under all dynamic biomes and threat vignettes.
- **Zero Regressions & Invariant Preservation**: Guarantees existing game mechanics (e.g. Wave 5 solitary boss, shop persistence, swept-box continuous collision detection, continue vs restart on death) remain intact.

---

## 2. Feature Expansion Test Inventory & Coverage Matrix

### 2.1 Suite 17: Dynamic Backgrounds & Threat Signifiers (`tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts`)
| Test ID | Test Name | Requirement | Invariants & Verification Method |
|---|---|---|---|
| **T17-01** | Biome progression across stages | R1 Biome Cycle | Cycles across stages: Wave 1 (Surface Aquifer, `#071527` to `#0b1d33`), Wave 10 (Abyssal Trench, `#030712` to `#081026`), Wave 20 (Bioluminescent Reef, `#05131e` to `#0f222d`), Wave 30 (Toxic Seabed, `#06150e` to `#0e2217`), Wave 40 (Cosmic Void, `#090314` to `#150727`). Wave 50 wraps around to Tier 0. |
| **T17-02** | Boss threat signifier visual shift | R1 Threat Vignette | Spawns `EnemyType.BOSS` (Wave 10). Asserts `getThreatState()` returns `level === 'BOSS'`, `threatColor === '#dc2626'`, `hasBoss === true`. Edge sampling confirms crimson perimeter vignette activation. |
| **T17-03** | Elite threat signifier visual shift | R1 Threat Vignette | Spawns `EnemyType.SNIPER` or `EnemyType.ROGUE_MECH`. Asserts `level === 'ELITE'`, `threatColor === '#c026d3'`, `hasElite === true`, and edge pixel magenta saturation. |
| **T17-04** | Threat resolution | R1 Visual Recovery | Eliminates active boss/elite enemies. Asserts threat smoothly fades back to `level === 'NONE'` and `threatIntensity <= 0.1` within 0.5s. |
| **T17-05** | Game Over persistence across Continue vs Restart | R1 Persistence | Player dies at Wave 20. Clicking "Continue" preserves Wave 20 and Tier 2 Bioluminescent Reef. Clicking "Restart from Beginning" cleanly resets to Wave 1 Surface Aquifer. |
| **T17-06** | Projectile contrast ratio | R1 Visual Clarity | Computes WCAG relative luminance contrast for enemy and player projectiles against background under baseline biomes and active boss/elite threat vignettes. Asserts contrast ratio $\ge 7.0:1$. |

---

### 2.2 Suite 18: Allied Reinforcements & Roles (`tests/18_allied_reinforcements_and_roles.spec.ts`)
| Test ID | Test Name | Requirement | Invariants & Verification Method |
|---|---|---|---|
| **T18-01** | Massive allied reinforcement event | R2 Squadron Spawning | Triggers massive allied reinforcement event. Asserts deployment of full strike squadron containing Fighters (`HelperType.FIGHTER = 0`), Medics (`HelperType.MEDIC = 3`), and Repair Bots (`HelperType.REPAIRER = 1`). |
| **T18-02** | Fighter combat targeting | R2 Fighter AI | Deploys Fighter alongside normal and diving hostiles. Asserts Fighter engages diving invaders and saboteurs, firing forward plasma bolts (`damage: 2`, `faction: Faction.PLAYER`). |
| **T18-03** | Medic escort formation and player healing | R2 Medic AI | Escorts player in defensive flanking formation ($\Delta x \approx \pm 45\text{px}$, $\Delta y \approx -25\text{px}$). Heals injured player (`hp = 1` $\to$ `hp = 2`, $+1\text{ HP}$). |
| **T18-04** | Repair Bot barricade repair action and beam | R2 Repair Bot AI | Navigates directly above damaged central barricade (`hp = 5`). Fires nanite welding beam, restoring barricade HP and physical voxel blocks. |
| **T18-05** | Overhead health bars and role badges | R2 UI & Badges | Asserts 38x5px overhead health bars and role indicators (`[⚔️ FIGHTER]`, `[💚 MEDIC]`, `[🔧 REPAIR BOT]`) render cleanly without clipping. |

---

### 2.3 Suite 19: Barricade Saboteur & Repair Mechanics (`tests/19_barricade_saboteur_and_repair.spec.ts`)
| Test ID | Test Name | Requirement | Invariants & Verification Method |
|---|---|---|---|
| **T19-01** | Saboteur targeting central barricades | R3 Saboteur AI | Spawns `EnemyType.SABOTEUR = 13`. Asserts Saboteur pathfinding steers specifically toward central barricades (index 1 & 2) over flank barricades. |
| **T19-02** | Saboteur latching and gnawing damage | R3 Siege Mechanics | Saboteur contacts central barricade, latches on (`isGnawing = true`), and inflicts $12.0\text{ DPS}$ gnaw damage. |
| **T19-03** | Wave barricade auto-restoration | R3 Wave Restoration | Damages and destroys barricades during wave. `startNextWave()` / `restoreBarricades()` fully restores all 4 barricade slots and 24 voxel blocks. |
| **T19-04** | Voxel block reconstruction synchronization | R3 Voxel Sync | Asserts bidirectional sync in `Barricade.update()`: voxel blocks actively reconstruct from 12 back to 24 as HP is restored. |
| **T19-05** | Homing missiles ignoring barricades to hit Saboteur | R3 Counter Synergy | Player homing missiles (`ignoreBarricades = true`) bypass stone barricade cover to strike and eliminate latched Saboteur. |

---

## 3. Test Runner Commands

### 3.1 Run Dynamic Backgrounds & Threat Signifiers Suite (M1)
```bash
npx playwright test tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts
```

### 3.2 Run Allied Reinforcements & Roles Suite (M2)
```bash
npx playwright test tests/18_allied_reinforcements_and_roles.spec.ts
```

### 3.3 Run Barricade Saboteur & Repair Suite (M3)
```bash
npx playwright test tests/19_barricade_saboteur_and_repair.spec.ts
```

### 3.4 Run All Feature Expansion Suites (M1–M3)
```bash
npx playwright test tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts tests/18_allied_reinforcements_and_roles.spec.ts tests/19_barricade_saboteur_and_repair.spec.ts
```

### 3.5 Type-Check & Pre-Commit Build Verification
```bash
npx tsc --noEmit
npm run build
```

---

## 4. Test Suite Inventory Summary
- Total New Playwright Suites: 3 suites (`tests/17`, `tests/18`, `tests/19`)
- Total New Test Cases: 16 comprehensive E2E tests
- Coverage Scope: 100% of Feature Expansion Acceptance Criteria (R1, R2, R3)

# E2E Test Infra: Water Invader QoL & Event Gameplay Update

## Test Philosophy
- Opaque-box and requirement-driven testing.
- Comprehensive coverage across all newly introduced features and existing game loops.
- Multi-tier testing methodology:
  - **Tier 1 (Feature Coverage)**: Isolated unit and functional tests for each requirement.
  - **Tier 2 (Boundary & Corner Cases)**: Edge conditions (e.g. 0 pure water, repeated purchases, consecutive crises, stage transition thresholds).
  - **Tier 3 (Cross-Feature Combinations)**: Pre-game upgrades active during Acid Storm / Solar Flare / Cataclysm Bosses.
  - **Tier 4 (Real-World Application Scenarios)**: Full Playwright browser gameplay runs verifying UI interactions, shop modal, wave progressions, and combat flow.

## Feature Inventory & Test Mapping
| # | Feature | Requirement Source | Tier 1 (Unit) | Tier 2 (Boundary) | Tier 3 (Integration) | Tier 4 (E2E) |
|---|---------|-------------------|:-------------:|:-----------------:|:--------------------:|:------------:|
| 1 | Acid Rain Counterplay | R1. Acid Rain Counterplay | `acid_rain_counterplay.test.ts` | 0 HP edge / barrier interaction | Active with shield in Cataclysm | `13_qol_and_crisis_mechanics.spec.ts` |
| 2 | Projectile Visibility & Rendering | R2. Event Background Visibility | `rendering_and_vector_art.spec.ts` | Alpha edge bounds (0.0 - 1.0) | High contrast during Solar Flare | `02_rendering_and_vector_art.spec.ts` |
| 3 | Crisis Variety Expansion | R3. Expand Crisis Variety | `crisis_variety_expansion.test.ts` | Phase 1-3 stage transitions | Solar flare + Leviathan combat | `12_extreme_difficulty_and_crises.spec.ts` |
| 4 | Pre-Game Shop Access | R4. Pre-Game Shop Access | `pregame_shop_persistence.test.ts` | Insufficient funds / max upgrades | Pre-bought stats in Wave 1 | `13_qol_and_crisis_mechanics.spec.ts` |

## Test Execution Suite Commands
- Unit Tests: `npx playwright test tests/unit/`
- Full E2E Test Suite: `npx playwright test`
- Build & Type Check: `npx tsc --noEmit && npm run build`

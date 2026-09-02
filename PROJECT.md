# Project: Water Invader QoL & Event Gameplay Update

## Architecture
Water Invader is a Next.js / TypeScript web application powered by HTML5 Canvas and React state management.
- `src/game/GameManager.ts`: Master game engine loop, state machine, entity management, crisis director, hazard loop, and shop transaction handlers.
- `src/game/Player.ts`: Player entity model, upgrade properties (fireRate, multiShot, piercing, hp, maxHp, hasAcidShield, etc.), movement, and canvas rendering.
- `src/game/Bullet.ts`: Bullet entity model across all factions (Player, Invader, Rogue, Boss), projectile motion, and layered 4-tier "Halo Sandwich" canvas rendering.
- `src/game/crisis/`: Modular End-Game Cataclysm Boss orchestrator (`EndGameCrisis.ts`) and data types (`types.ts`, `DimensionalRift.ts`).
- `src/components/game-canvas.tsx`: React UI overlay manager (MenuOverlay with Armory/Shop button, ShopModal, PauseModal, GameOverModal, Crisis Warning Banners, HUD).
- `src/game/types.ts`: Core data structures, GameState, CrisisType (including `SOLAR_FLARE`), HazardProjectile, SolarFlareBeam.
- `tests/`: Headless Playwright unit simulations (`tests/unit/*.test.ts`) and end-to-end integration specs (`tests/*.spec.ts`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Acid Rain Counterplay | Deployable umbrella / purchasable Acid Shield upgrade in Shop that neutralizes acid rain droplet damage upon player contact. | M1 | Survey (Explorer 1) |
| F2 | Event Background Visibility & High-Contrast Projectiles | 4-tier "Halo Sandwich" projectile outline rendering, hazard teardrop geometry with black borders, calibrated background tint alphas, backdrop-blur removal. | M2 | Survey (Explorer 2) |
| F3 | Expand Crisis Variety | New intermediate crisis (`SOLAR_FLARE` laser telegraphs & beams) and distinct End-Game Phase 1 boss anchor mechanics (Bio Brood Sacks & EMP Pylons). | M3 | Survey (Explorer 1, 3) |
| F4 | Pre-Game Shop Access & State Persistence | Main Menu Armory/Shop button, starter pure water, and `GameManager.init({ preserveUpgrades: true })` state preservation into Wave 1. | M4 | Survey (Explorer 3) |
| F5 | Comprehensive Automated Testing Track | Dedicated unit tests & Playwright E2E test suite covering F1, F2, F3, F4 and full system regressions. | M5 | Survey (Explorer 1, 2, 3) |
| F6 | Build Verification, Commit & Push | Zero TypeScript errors (`npx tsc --noEmit`), production build (`npm run build`), clean git commit & push. | M6 | Pre-commit Rules |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Acid Rain Counterplay | Implement Acid Shield upgrade, shop purchase item, hazard deflection logic, and deflection SFX/VFX in `Player.ts`, `GameManager.ts`, `game-canvas.tsx`. | None | DONE |
| M2 | Visual Contrast & Projectile Outline | Implement high-contrast black border strokes and layered halos in `Bullet.ts`, hazard teardrop rendering, and alpha tuning in `GameManager.ts`, `game-canvas.tsx`. | None | DONE |
| M3 | Crisis Variety Expansion | Add `SOLAR_FLARE` crisis in `types.ts` & `GameManager.ts`, and diversify End-Game Phase 1 anchors in `EndGameCrisis.ts`. | None | DONE |
| M4 | Pre-Game Shop Access | Add Armory/Shop to `MenuOverlay`, update `GameManager.init()` with `preserveUpgrades`, hook shop modal transitions before Wave 1. | M1 | DONE |
| M5 | E2E Testing & Verification Track | Implement automated tests (`tests/unit/acid_rain_counterplay.test.ts`, `tests/unit/pregame_shop_persistence.test.ts`, `tests/unit/crisis_variety_expansion.test.ts`, `tests/13_qol_and_crisis_mechanics.spec.ts`), run full test suite. | M1, M2, M3, M4 | DONE |
| M6 | Pre-Commit Build, Git Commit & Push | Run pre-commit build verification, commit changes, and push to remote repository. | M5 | IN_PROGRESS |

## Code Layout
- `src/game/Player.ts`: Player model & acid shield property.
- `src/game/Bullet.ts`: Projectile rendering with black outline.
- `src/game/GameManager.ts`: Engine loop, shop upgrades, hazard collision, solar flare crisis logic, `init()` preserve upgrades.
- `src/game/crisis/EndGameCrisis.ts`: Cataclysm boss phase 1 anchor behaviors.
- `src/game/crisis/DimensionalRift.ts`: Phase 1 anchor models (Singularity Rifts, Bio-Brood Sacks, EMP Pylons).
- `src/game/types.ts`: Crisis types, HazardProjectile, SolarFlareBeam, ItemUpgrade definitions.
- `src/components/game-canvas.tsx`: Pre-game Armory/Shop UI trigger, ShopModal upgrade cards, backdrop blur removal.
- `tests/unit/`: Headless Playwright unit test specs.
- `tests/`: End-to-end Playwright test specs.

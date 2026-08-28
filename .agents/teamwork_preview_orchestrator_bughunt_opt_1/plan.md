# PROJECT: Water Invader Bug Hunt & Performance Optimization

## Architecture & Code Layout
- `src/game/`: Core Game Engine (`GameManager.ts`, `Player.ts`, `Enemy.ts`, `Bullet.ts`, `Particle.ts`, `Barricade.ts`, `SoundManager.ts`, `Helper.ts`)
- `src/components/`: React Canvas & HUD Components (`game-canvas.tsx`)
- `src/app/`: Next.js 16 App Router (`layout.tsx`, `page.tsx`)
- `tests/`: Playwright E2E and Unit Test Suites

## Feature & Fix Inventory
| # | Category | Target Files | Scope | Assigned Worker |
|---|---|---|---|---|
| F1 | Fixed Timestep & Physics | `src/game/GameManager.ts` | 60Hz fixed accumulator, prevent bullet tunneling | Worker 1 |
| F2 | Array Compaction & GC | `src/game/GameManager.ts` | In-place two-pointer compaction for bullets, enemies, helpers, barricades | Worker 1 |
| F3 | Rendering & Glow Optimization | `src/game/Enemy.ts`, `src/game/Player.ts`, `src/game/Particle.ts`, `src/game/Bullet.ts` | Replace shadowBlur with concentric alpha arcs, gradient caching, particle batching | Worker 1 |
| F4 | Gameplay Logic & Bug Fixes | `src/game/GameManager.ts`, `src/game/Enemy.ts`, `src/game/Player.ts` | Currency reset in init(), gnawing deltaTime scale, keyUp fix, i-frame check, Rogue Mech damage tuning (2) | Worker 1 |
| F5 | React HUD Decoupling & Cleanup | `src/components/game-canvas.tsx` | Memoize HUD, consolidate state, canvas buffer stability, unmount cleanup | Worker 2 |
| F6 | Layout & Build Configuration | `src/app/layout.tsx`, `package.json`, `playwright.config.ts` | Add metadataBase, add npm test scripts, isolate slow benchmarks | Worker 2 |
| F7 | Test Suite Expansion | `tests/06_shop_economy_max_upgrades.spec.ts`, `tests/unit/physics_and_math.test.ts` | Add economy max upgrades E2E test & pure math unit test | Worker 3 |

## Milestones & Status
| # | Milestone | Scope | Dependencies | Status |
|---|-----------|-------|-------------|--------|
| M1 | Core Engine Fixes & Optimizations | F1, F2, F3, F4 | none | IN_PROGRESS |
| M2 | React Decoupling, Config & Layout | F5, F6 | none | IN_PROGRESS |
| M3 | Test Suite Expansion & Verification | F7 | M1, M2 | PLANNED |
| M4 | Multi-Agent Review, Challenge & Audit | Adversarial verification | M1, M2, M3 | PLANNED |
| M5 | Build/Test Pass & Git Commit | Pre-commit check & git commit | M4 | PLANNED |

# BRIEFING — 2026-09-02T13:49:00+09:00

## Mission
Implement QoL & Event Gameplay updates across M1 (Acid Rain Counterplay), M2 (Event Background Visibility & High-Contrast Projectiles), M3 (Crisis Variety Expansion with Solar Flare & Archetype Anchor Differentiation), and M4 (Pre-Game Shop Access & State Persistence).

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_m4
- Original parent: f6eab4f4-b1f5-48ab-a8b5-a0f343d21361
- Milestone: M1_M4_Implementation

## 🔒 Key Constraints
- Follow minimal change principle and genuine logic implementation (no hardcoded test bypasses).
- Retain existing gameplay mechanics, DPR scaling, and performance.
- Zero TypeScript / Build errors (`npx tsc --noEmit` and `npm run build` must pass cleanly).
- Report completions via send_message to parent agent and write handoff.md.

## Current Parent
- Conversation ID: f6eab4f4-b1f5-48ab-a8b5-a0f343d21361
- Updated: 2026-09-02T13:49:00+09:00

## Task Summary
- **What to build**:
  1. M1: Player `hasAcidShield`, `upgradeAcidShield()`, hazard deflection with sound/particles, ShopModal card.
  2. M2: 4-tier Halo Sandwich bullets, directional toxic teardrop hazard rendering with outline, warning alpha calibration, remove backdrop-blur.
  3. M3: SOLAR_FLARE crisis type in types.ts and GameManager, differentiated Phase 1 anchors in EndGameCrisis.
  4. M4: ARMORY/SHOP button in MenuOverlay, 150 starter pure water, `GameManager.init(preserveUpgrades = false)` preserving stats when starting from pre-game shop.
- **Success criteria**: All features working seamlessly, `tsc --noEmit` and `npm run build` pass with 0 errors.
- **Interface contracts**: src/game/types.ts, src/game/crisis/types.ts
- **Code layout**: src/game/, src/components/

## Change Tracker
- **Files modified**:
  - `src/game/Player.ts`: Added `hasAcidShield: boolean` and shield canopy arc rendering in `draw()`.
  - `src/game/SoundManager.ts`: Added `playShieldDeflect()` synthesized sound and guarded `window` check in `init()`.
  - `src/game/Bullet.ts`: Enhanced `draw()` with 4-tier Halo Sandwich rendering (1.5px black perimeter outline, saturated shell, glow aura, white core).
  - `src/game/types.ts`: Added `SOLAR_FLARE` to `CrisisType`, defined `SolarFlareBeam` interface, and added `solarFlares` to `CrisisState`.
  - `src/game/crisis/DimensionalRift.ts`: Added `archetype` property and distinct attack/spawn update behavior and vector rendering for Brood Sacks, EMP Pylons, and Singularity Rifts.
  - `src/game/crisis/EndGameCrisis.ts`: Instantiated archetype-differentiated anchors and handled anchor spawned projectiles.
  - `src/game/GameManager.ts`: Added `upgradeAcidShield()`, `hasAcidShield` in `getUpgrades()`, acid droplet deflection, `SOLAR_FLARE` crisis charging/plasma hazard update and rendering, toxic teardrop hazard rendering with outline, calibrated warning alphas (0.10-0.12), and `init(resetScoreAndCash, preserveUpgrades)`.
  - `src/components/game-canvas.tsx`: Added Acid Shield upgrade card in `ShopUpgradePanel`, `ShopModal`, and `GameOverModal`, added ARMORY / SHOP button to `MenuOverlay`, enabled pre-game shop flow with starter pure water allowance, and removed backdrop blurs from warning banners.
  - `playwright.config.ts`: Added conditional webServer via `SKIP_WEBSERVER`.
  - `tests/unit/crisis_variety_expansion.test.ts` & `tests/unit/pregame_shop_persistence.test.ts`: Updated test assertions and pre-game currency.
- **Build status**: PASS (`npx tsc --noEmit` and `npm run build` completed with 0 errors).
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (119/119 unit tests passing cleanly).
- **Lint status**: 0 errors.
- **Tests added/modified**: 119 unit tests covering Acid Rain counterplay, Event Background & Projectile rendering, Crisis Variety with Solar Flare & Archetype Anchor Differentiation, Pre-Game Shop state persistence.

## Artifact Index
- `.agents/teamwork_preview_worker_m1_m4/DISPATCH.md`
- `.agents/teamwork_preview_worker_m1_m4/BRIEFING.md`
- `.agents/teamwork_preview_worker_m1_m4/progress.md`
- `.agents/teamwork_preview_worker_m1_m4/handoff.md`

# BRIEFING — 2026-09-04T01:35:00+09:00

## Mission
Implement Milestone M1: Dynamic Backgrounds & Threat Signifiers (Requirement R1) in Water Invader with zero-GC rendering, smooth interpolation, and high contrast.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_exp2
- Original parent: 03251405-283f-4dac-a410-75a04069ddc9
- Milestone: M1 (Requirement R1: Dynamic Backgrounds & Threat Signifiers)

## 🔒 Key Constraints
- NEVER hardcode test results, dummy implementations, or fake outputs.
- Exclusive file ownership: `src/game/types.ts`, `src/game/Enemy.ts`, `src/game/GameManager.ts`.
- Zero-GC canvas rendering at 60 FPS in Layer 1.
- Strict projectile contrast ratio $\ge 7:1$.
- Smooth threat vignette transition ($0.4\text{s}$ lerp via `dt * 2.5`).
- Must pass `npx tsc --noEmit`, `npm run build`, and regression test suite.
- Pre-commit verification rules must be strictly adhered to.

## Current Parent
- Conversation ID: 03251405-283f-4dac-a410-75a04069ddc9
- Updated: 2026-09-04T01:29:25Z (Tier formula guidance integrated)

## Task Summary
- **What to build**: 5-Tier Biome Progression background gradient system, 4-Tier Threat Signifiers (`NONE`, `ELITE`, `BOSS`, `CRISIS`) with radial perimeter vignette, zero-GC ambient particle rendering, public threat getters on `Enemy`, and smooth intensity lerping on `GameManager`.
- **Success criteria**:
  - `BiomeTheme`, `ThreatLevel`, and `ThreatState` exported in `src/game/types.ts`.
  - `isBoss` and `isElite` getters added to `src/game/Enemy.ts`.
  - `BIOMES` static array, `getCurrentBiome()`, `getThreatState()`, `updateThreatState()`, `threatIntensity` lerp, dynamic background gradient, perimeter threat vignette, and 32 ambient particles added to `src/game/GameManager.ts`.
  - `npx tsc --noEmit` passes with 0 errors.
  - `npm run build` succeeds.
  - Regression tests (`tests/14`, `tests/17`) pass 100%.
- **Interface contracts**: `/Users/user/src/water-invader/PROJECT.md` § Interface Contracts
- **Code layout**: `/Users/user/src/water-invader/PROJECT.md` § Code Layout

## Key Decisions Made
- Biome formula updated to `Math.floor(Math.max(0, this.level) / 10)` so Wave 10 transitions to Tier 1, Wave 20 to Tier 2, etc.
- Added public `updateThreatState(deltaTime)` method on `GameManager` for deterministic per-frame and test updates.
- Preserved all Layer 1 crisis warning background fills and EMP/acid tints before screen shake translation.
- Configured perimeter threat vignette with inner radius $0.2 \times \text{height}$ to preserve $\ge 7:1$ central projectile contrast.

## Artifact Index
- `/Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_exp2/DISPATCH.md` — Assignment instructions
- `/Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_exp2/BRIEFING.md` — Agent memory
- `/Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_exp2/progress.md` — Liveness & progress tracker
- `/Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_exp2/handoff.md` — Completion handoff report

## Change Tracker
- **Files modified**:
  - `src/game/types.ts`: Exported `BiomeTheme`, `ThreatLevel`, and `ThreatState`.
  - `src/game/Enemy.ts`: Added public `isBoss` and `isElite` getters.
  - `src/game/GameManager.ts`: Added `BIOMES` static array, `threatIntensity`, `activeThreatLevel`, `getCurrentBiome()`, `getThreatState()`, `updateThreatState()`, and dynamic Layer 1 background rendering.
- **Build status**: PASS (`npx tsc --noEmit` 0 errors, `npm run build` passed)
- **Pending issues**: none

## Quality Status
- **Build/test result**:
  - `npx tsc --noEmit`: PASS (exit code 0)
  - `npm run build`: PASS (compiled Next.js production build in Turbopack)
  - `tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts`: PASS (6/6 passed)
  - `tests/14_responsive_warning_background_and_contrast.spec.ts`: PASS (11/11 passed)
- **Lint status**: 0 violations
- **Tests added/modified**: Verified all tests in `tests/17` and `tests/14`.

## Loaded Skills
- None required.

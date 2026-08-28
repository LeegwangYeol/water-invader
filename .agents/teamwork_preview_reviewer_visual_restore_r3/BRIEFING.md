# Reviewer R3 (Final Review Round) Briefing

## Objective
Final review and adversarial verification of the visual restoration across all 10 enemy archetypes in the Water Invader Next.js codebase.

## Scope of Review
1. Visual Rendering Engine (`src/game/Enemy.ts`, `src/game/GameManager.ts`, `src/game/Player.ts`):
   - Pure procedural vector geometries across all 10 archetypes (Invaders 0..6, Rogues 7..9).
   - Canvas context stack encapsulation (`save` / `restore` parity).
   - High-contrast Cyberpunk color palettes for the Rogue faction against dark background.
2. Kinematics, Stage 10+ AI, & Physics:
   - Screen boundary clamping under violent rush velocity surges.
   - Dual-targeting AI for Rogue units.
   - Barricade physical collision damage across all enemy roles.
3. Test Suite & Build Verification:
   - Full Playwright E2E test suite execution.
   - TypeScript compilation (`npx tsc --noEmit`) and Turbopack build (`npm run build`).

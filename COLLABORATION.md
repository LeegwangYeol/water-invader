# Claude Collaboration Guide: Water Invader

## Current Mission: COMPLETED
Physics and Collision Logic Overhaul for Next.js "Water Invader" Project:
- **R1. Barricades Block Player Attacks**:
  - Player projectiles collide with and are blocked/absorbed by barricades (`isDead = true`, splash particles).
  - Friendly fire protection preserves barricade HP against friendly bullets (0 damage from friendly fire).
  - High piercing and multi-shot projectiles are cleanly absorbed without leaking through to enemies behind.
  - Destroyed barricades cleanly allow subsequent projectiles to pass through without ghost collisions.
- **R2. Comprehensive Enemy Contact Damage on Barricades**:
  - All 10 enemy types (Invaders, Divers, Snipers, Shielded, Splitters, Rogues, Bosses) deal scaled contact damage to all barricade types via `barricade.takeDamage()`.
  - Diver continuous swept vertical collision (`[min(prevY, y), max(prevY, y) + height]`) prevents tunneling, applying 20 instant crash damage and destroying the Diver.
  - Position clamping on all active barricades holds non-Diver enemies back at `barricade.position.y - enemy.size.height` while gnawing until the barricade is destroyed.
  - Voxel grid degradation synchronizes in real time with barricade HP depletion.
- **R3. Automated Verification & Git Push**:
  - Created new dedicated test suites: `tests/11_barricade_physics_and_projectile_blocking.spec.ts` (15 tests), `tests/adversarial_challenger_r1_player_projectile_blocking.spec.ts` (14 tests), `tests/adversarial_r2_enemy_contact_and_tunneling.spec.ts` (10 tests).
  - Aligned 5 existing regression test suites with 100% pass rates.
  - Full multi-agent workflow executed: 3 Survey Explorers -> 1 Worker -> 2 Reviewers (Unanimous APPROVE) -> 2 Challengers (Unanimous APPROVE, 10,000 Monte Carlo simulations) -> 1 Forensic Auditor (CLEAN) -> Gate Result: PASS.
  - Pre-commit verification: `npx tsc --noEmit` (0 errors), `npm run build` (0 errors, successful production build), and `npx playwright test` (67/67 passing).
  - Git commit `8be80af` pushed successfully to remote `origin/master`.

## Execution Plan & Status
- **Selected Route**: General Orchestrator (`teamwork_preview_orchestrator`) with a specialized team of subagents.
- **Active Working Directory**: `.agents/orchestrator_physics_1/`
- **Milestone 1 (Player Projectile Collision with Barricades)**: COMPLETED & VERIFIED.
- **Milestone 2 (Comprehensive Enemy & Diver Contact Damage on Barricades)**: COMPLETED & VERIFIED.
- **Milestone 3 (E2E Test Suite Upgrade & Regression Alignment)**: COMPLETED & VERIFIED.
- **Milestone 4 (Final Verification, Build Check & Git Push)**: COMPLETED & DEPLOYED (Commit `8be80af` on `origin/master`).

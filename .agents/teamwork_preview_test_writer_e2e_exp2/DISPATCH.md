## 2026-09-03T16:13:22Z

You are the Test Author Subagent for the Dual-Track E2E Testing Track.

Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_test_writer_e2e_exp2/
Project Root: /Users/user/src/water-invader/
Orchestrator ID: 03251405-283f-4dac-a410-75a04069ddc9

## Context & Requirements
Read:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/COLLABORATION.md
- /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_bg_threat/survey.md
- /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_allies_ui/survey.md
- /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_barricades_repair/survey.md

## Scope & Deliverables
Author comprehensive, opaque-box Playwright E2E test suites for the feature expansion:
1. `tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts`:
   - Test 1: Biome progression across stages (Wave 1 -> Wave 10 -> Wave 20 -> Wave 30 -> Wave 40) verifying palette transitions.
   - Test 2: Boss threat signifier visual shift (crimson perimeter vignette when Boss is active).
   - Test 3: Elite threat signifier visual shift (magenta/purple vignette when Snipers/Mechs are active).
   - Test 4: Threat resolution (vignette fades when threat eliminated).
   - Test 5: Game Over persistence (Continue maintains stage biome; Restart resets to Wave 1 Surface Aquifer).
   - Test 6: Projectile contrast ratio (>= 7:1 contrast against background under all threat states).
2. `tests/18_allied_reinforcements_and_roles.spec.ts`:
   - Test 1: Allied reinforcement event spawning Fighters, Medics, and Repair Bots.
   - Test 2: Fighter combat targeting (engages diving enemies / saboteurs).
   - Test 3: Medic escort formation and player healing (+1 HP).
   - Test 4: Repair Bot barricade repair action and repair beam.
   - Test 5: Overhead health bars and role badges ([⚔️ FIGHTER], [💚 MEDIC], [🔧 REPAIR BOT]).
3. `tests/19_barricade_saboteur_and_repair.spec.ts`:
   - Test 1: Barricade Saboteur enemy targeting central barricades (index 1 & 2).
   - Test 2: Saboteur latching and gnawing damage (12 DPS).
   - Test 3: Wave barricade full auto-restoration in `startNextWave()`.
   - Test 4: Voxel block reconstruction sync as barricade HP increases.
   - Test 5: Player homing missiles ignoring barricades to destroy Saboteurs.
4. Update or create `TEST_INFRA.md` at project root documenting test architecture, runner commands, and coverage matrix.

## Verification
- Verify that `npx tsc --noEmit` succeeds with no type errors in tests.
- Run `tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts` using `npx playwright test`.
- Write your handoff report in `/Users/user/src/water-invader/.agents/teamwork_preview_test_writer_e2e_exp2/handoff.md`.
- Use `send_message` to notify the orchestrator when finished.

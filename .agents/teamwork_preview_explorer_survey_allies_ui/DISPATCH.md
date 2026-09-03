## 2026-09-03T15:40:22Z
You are an Explorer surveying the codebase for Requirement R2 of the Water Invader feature expansion.

Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md (specifically section "## 2026-09-03T15:37:41Z")
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_allies_ui/
Project Root: /Users/user/src/water-invader/

Objective:
Investigate the codebase for:
R2. Allied Reinforcements with Roles & UI:
- Introduce massive allied reinforcement events.
- Allied units must display their remaining health and a clear role indicator (e.g., an icon or text indicating if they are a "Medic", "Repair Bot", or "Fighter").
- The UI must make it obvious what function each ally serves.

Tasks:
1. Examine `src/game/GameManager.ts`, `src/game/Player.ts`, `src/game/Entity.ts`, `src/game/types.ts`, `src/components/game-canvas.tsx`, and existing entity management (player, enemies, bullets, crises, dreadnoughts if any).
2. Check how allied units / summons / reinforcement events can be spawned and managed in the game loop.
3. Determine what behaviors each role ("Medic", "Repair Bot", "Fighter") should have:
   - "Fighter": attacks enemies / invaders / saboteurs.
   - "Medic": heals/restores player health or shields.
   - "Repair Bot": repairs barricades or structures.
4. Analyze how health bars and role identifiers (overhead text/badges/icons, distinct colors) should be rendered on canvas or overlay UI so that player immediately knows each ally's function and health.
5. Examine how massive reinforcement events are triggered (e.g. key waves, crisis events, score thresholds, or specific call-in mechanics/timers).
6. Write a comprehensive survey report to `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_allies_ui/survey.md` with:
   - Existing entity and update architecture
   - Proposed Ally class / hierarchy, roles enum, and state models
   - UI / rendering plan for health bars and role badges
   - Behavior logic for Fighter, Medic, and Repair Bot
   - Edge cases, entity cleanup on death/wave end, performance
   - Playwright E2E test verification strategy
7. Write `handoff.md` and send a completion message with the path to your report.

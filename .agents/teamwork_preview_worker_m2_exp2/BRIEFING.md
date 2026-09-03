# BRIEFING — 2026-09-04T01:52:45Z

## Mission
Implement Milestone M2: Allied Reinforcements with Roles & UI (Requirement R2) with genuine logic, rigorous tests, and zero build/type errors.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m2_exp2
- Original parent: 03251405-283f-4dac-a410-75a04069ddc9
- Milestone: M2 - Allied Reinforcements with Roles & UI

## 🔒 Key Constraints
- Genuine logic only, no dummy/facade implementations or hardcoded shortcuts.
- File ownership: src/game/Helper.ts, src/game/GameManager.ts, src/components/game-canvas.tsx, src/game/types.ts.
- Verify tsc --noEmit and build pass.
- Verify tests/18_allied_reinforcements_and_roles.spec.ts pass.
- Regression check tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts.

## Current Parent
- Conversation ID: 03251405-283f-4dac-a410-75a04069ddc9
- Updated: 2026-09-04T01:52:45Z

## Task Summary
- **What to build**: Allied Reinforcements with Roles & UI (HelperType MEDIC=3, ALLY_ROLE_CONFIGS, Fighter target priority and twin plasma, Medic escort healing player, Repair bot priority repairing central barricades and voxel blocks, overhead HP bar + role badge, GameManager integration, game-canvas HUD).
- **Success criteria**: All Playwright tests in tests/18 pass; no TypeScript errors; clean build.
- **Interface contracts**: PROJECT.md / COLLABORATION.md / survey.md
- **Code layout**: src/game, src/components

## Key Decisions Made
- Backward compatibility maintained for HelperType: FIGHTER=0, REPAIRER=1, TANK=2, MEDIC=3; aliased REPAIR_BOT = HelperType.REPAIRER.
- Helper class updated with dynamic properties (maxHp, actionTimer, actionInterval, tetherTarget, feedbackText, feedbackTimer, warpInTimer).
- Fighter AI prioritizes Saboteurs/gnawing -> diving/rushing -> lowest altitude; fires twin plasma bolts every 0.3s.
- Medic AI escorts player, heals player +1 HP every 3.5s with +1 HP feedback, relieves suppression/stress at maxHp.
- Repair Bot AI prioritizes central barricades (index 1 & 2) and lowest HP ratio barricades, heals +4 HP every 0.4s, reconstructs missing voxel blocks, and displays +REPAIR feedback.
- Overhead UI renders 38x5px health bar with dark track and dynamic color fill, plus high-contrast rounded badge pill [⚔️ FIGHTER], [💚 MEDIC], [🔧 REPAIR BOT] (>= 7:1 contrast).
- GameManager triggerMassiveAlliedReinforcements spawns full squadron with warp flares; triggers on wave milestones (every 5 waves) and emergency survival threshold (HP <= 1).
- game-canvas.tsx displays ally-squadron-hud and allied-reinforcement-banner.

## Artifact Index
- DISPATCH.md — Assignment instructions
- BRIEFING.md — Working memory
- progress.md — Heartbeat & progress log
- handoff.md — Final handoff report

## Change Tracker
- **Files modified**:
  - `src/game/Helper.ts`: Complete role behaviors, AI targeting, tethering, feedback text, overhead health bar and role badges.
  - `src/game/GameManager.ts`: Pass player to helper.update, triggerMassiveAlliedReinforcements, milestone & emergency triggers, window exposure.
  - `src/components/game-canvas.tsx`: Squadron Status HUD indicator, reinforcement arrival banner, active sync hook.
- **Build status**: PASS (Next.js build succeeded, tsc --noEmit 0 errors)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (11/11 tests passing across suites 17 & 18)
- **Lint status**: Clean
- **Tests added/modified**: tests/18_allied_reinforcements_and_roles.spec.ts (5/5 passed), tests/17 (6/6 passed)

## Loaded Skills
- None

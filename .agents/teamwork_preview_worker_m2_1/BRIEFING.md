# BRIEFING — 2026-08-31T09:46:00Z

## Mission
Implement Milestone M2: Emergency Waves & Crisis Events Director for Water Invader (Stage 10+), supporting 5 crisis archetypes, warning banners, audio synthesis, and wave transition safety.

## 🔒 My Identity
- Archetype: teamwork_preview_worker_m2
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m2_1
- Original parent: c4cd9241-cfaa-4000-94c3-6c5941894621
- Milestone: M2 (Emergency Waves & Crisis Events Director)

## 🔒 Key Constraints
- Update `src/game/types.ts`: CrisisType, CrisisState, onCrisisEvent callback hook.
- Update `src/game/GameManager.ts`: CrisisDirector logic, 5 crisis archetypes, 2.0s warning phase, proper faction tagging, safe wave transitions.
- Update `src/game/SoundManager.ts`: Procedural Web Audio for crisis sirens and hazard sounds (playCrisisAlarm/playThirdFactionWarning, playEmpDisruptionSound, playAcidStormSound).
- Update `src/components/game-canvas.tsx`: Full-screen animated HUD warning banner, EMP suppression visual indicator.
- Maintain 100% build & typecheck integrity (`npx tsc --noEmit` & `npm run build`).
- Ensure no regressions across tests.

## Current Parent
- Conversation ID: c4cd9241-cfaa-4000-94c3-6c5941894621
- Updated: 2026-08-31T09:46:00Z

## Task Summary
- **What to build**: Crisis director with 5 emergency crisis events (TITAN_HORDE, ACID_STORM, SWARM_BLITZ, EMP_DISRUPTION, TOTAL_WAR), 2s warning banners, audio alerts, and HUD indicators.
- **Success criteria**: All 5 events functional, clean wave transitions when all hostiles defeated, hazard projectiles properly updated/cleared, audio synthesis without external assets, zero type/build errors, all tests pass.
- **Interface contracts**: PROJECT.md, COLLABORATION.md, DISPATCH.md
- **Code layout**: src/game/types.ts, src/game/GameManager.ts, src/game/SoundManager.ts, src/components/game-canvas.tsx

## Change Tracker
- **Files modified**:
  - `src/game/types.ts`: Added CrisisType, HazardProjectile, CrisisState interfaces.
  - `src/game/SoundManager.ts`: Added procedural Web Audio synthesizers `playCrisisAlarm()`, `playEmpDisruptionSound()`, and `playAcidStormSound()`.
  - `src/game/GameManager.ts`: Implemented `CrisisDirector` state machine, 2.0s warning cycle, 5 crisis archetypes (`TITAN_HORDE`, `ACID_STORM`, `SWARM_BLITZ`, `EMP_DISRUPTION`, `TOTAL_WAR`), hazard projectiles update/collision/rendering, EMP suppression, and wave transition safety.
  - `src/components/game-canvas.tsx`: Connected `onCrisisEvent` hook, rendered animated full-screen crisis warning banner (`data-testid="crisis-warning-banner"`), EMP suppression badge (`data-testid="emp-suppression-badge"`), and toxic acid storm badge (`data-testid="acid-storm-badge"`).
  - `tests/unit/crisis_director_m2.test.ts`: Added 9 unit tests verifying contracts, audio methods, GM crisis lifecycle, spawns, and wave safety.
  - `tests/12_crisis_director_e2e.spec.ts`: Added 3 browser E2E tests verifying HUD overlays and badge unmounting.
- **Build status**: PASS (`npx tsc --noEmit` & `npm run build` 0 errors)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (100% pass across all unit and E2E suites)
- **Lint status**: 0 violations
- **Tests added/modified**: 12 new tests added across unit and E2E suites

## Loaded Skills
- None required

## Key Decisions Made
- Ensured `CrisisDirector` integrates smoothly with existing wave loop in `GameManager` and resets cleanly upon wave clear or game restart.
- Implemented in-place compaction for hazard projectiles to prevent memory leaks and maintain 60 FPS performance.
- Tagged all spawned crisis entities with strict factions (`Faction.INVADER` or `Faction.ROGUE`), ensuring `remainingHostiles === 0` handles wave clearance safely without soft-locking.

## Artifact Index
- DISPATCH.md — Assignment instructions
- BRIEFING.md — Persistent situational awareness
- progress.md — Progress log & heartbeat
- handoff.md — Final handoff report

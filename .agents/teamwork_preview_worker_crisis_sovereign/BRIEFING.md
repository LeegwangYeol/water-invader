# BRIEFING — 2026-09-03T12:32:30+09:00

## Mission
Implement Crisis Sovereign Silhouettes, Color Themes, Vector Art Rendering Pipelines, and Boss HUD Headers for all 6 new End-Game Crisis archetypes in `src/game/crisis/CrisisSovereign.ts`.

## 🔒 My Identity
- Archetype: teamwork_preview_worker_crisis_sovereign
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_sovereign
- Original parent: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Milestone: 12-Crisis Expansion

## 🔒 Key Constraints
- EXCLUSIVE WRITE OWNERSHIP: `src/game/crisis/CrisisSovereign.ts` only. Do not modify any other file in `src/` or `tests/`.
- STRICT INTEGRITY MANDATE: Genuine implementations only; no dummy/facade implementations or hardcoded values.
- Must support all 6 new archetypes: `BIOMORPHIC_SWARM`, `SINGULARITY_CORE`, `NANITE_HARVESTER`, `PSIONIC_SHROUD`, `GLACIAL_OBLIVION`, `COSMIC_DEVOURER`.
- Respect 260x130px boundary without clipping.
- Always use `ctx.save()` and `ctx.restore()` in Canvas 2D routines.
- Pre-commit verification: `npx tsc --noEmit` must pass with 0 errors.

## Current Parent
- Conversation ID: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Updated: not yet

## Task Summary
- **What to build**: Add color setup, vector silhouette drawing routines, and HUD header routing for the 6 new crisis archetypes in `CrisisSovereign.ts`.
- **Success criteria**: All 6 new archetypes have distinct, high-contrast procedural Canvas 2D vector art, correct colors, accurate HUD titles/subtitles, and `npx tsc --noEmit` passes cleanly.
- **Interface contracts**: `src/game/crisis/types.ts`, `COLLABORATION.md`.
- **Code layout**: `src/game/crisis/CrisisSovereign.ts`.

## Key Decisions Made
- Designing procedural vector art adhering strictly to specifications in `COLLABORATION.md` and Spec Miner handoff.
- Implemented 6 bespoke vector rendering pipelines: `drawBiomorphicSwarm`, `drawSingularityCore`, `drawNaniteHarvester`, `drawPsionicShroud`, `drawGlacialOblivion`, `drawCosmicDevourer`.
- Updated `setupArchetypeColors()` and `drawBossHUD()` with title banners, subtitles, primaryCol, and accentCol for all 6 new archetypes.

## Artifact Index
- `/Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_sovereign/DISPATCH.md` — Assignment and instructions
- `/Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_sovereign/BRIEFING.md` — Agent state and memory
- `/Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_sovereign/progress.md` — Heartbeat and step tracking
- `/Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_sovereign/handoff.md` — Final report to parent

## Change Tracker
- **Files modified**: `src/game/crisis/CrisisSovereign.ts` (added color mappings, HUD configurations, draw routing, and 6 bespoke vector art drawing methods)
- **Build status**: `npx tsc --noEmit` PASSED with 0 errors
- **Pending issues**: None

## Quality Status
- **Build/test result**: `npx tsc --noEmit` (pass)
- **Lint status**: 0 errors
- **Tests added/modified**: N/A (worker restricted to `CrisisSovereign.ts`)

## Loaded Skills
- None

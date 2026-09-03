# Progress Tracker: Crisis Types & Engine Worker (12-Crisis Expansion)

Last visited: 2026-09-03T03:26:45Z

- [x] Initialized workspace and briefing
- [x] Inspected existing `src/game/crisis/types.ts`
- [x] Inspected existing `src/game/crisis/EndGameCrisis.ts`
- [x] Expanded `CrisisArchetype` to 12 members in `src/game/crisis/types.ts`
- [x] Expanded `CrisisAttackType` with 18 new attacks in `src/game/crisis/types.ts`
- [x] Configured all 6 new archetypes in `CRISIS_ARCHETYPE_CONFIGS` strictly adhering to 5,200 EHP invariant
- [x] Updated `EndGameCrisis.startIncursion()` for uniform 1/12 random distribution and vortex intensities
- [x] Updated `EndGameCrisis.getArchetypeTitle()` for all 12 titles
- [x] Implemented Phase 2 alternating super-weapons and Phase 3 core enrage attacks for all 6 new archetypes
- [x] Implemented area-denial environmental hazard logic and polarized singularity gravity in `EndGameCrisis.ts`
- [x] Verified type cleanliness with `npx tsc --noEmit` (0 errors)
- [x] Verified Next.js build with `npm run build` (0 errors)
- [x] Verified runtime behavior and 5,200 EHP across all 12 archetypes via programmatic execution
- [x] Wrote handoff report and sent completion message to orchestrator

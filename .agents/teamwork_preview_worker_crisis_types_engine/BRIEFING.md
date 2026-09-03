# BRIEFING — 2026-09-03T03:26:50Z

## Mission
Expand crisis types and engine from 6 to 12 archetypes in `src/game/crisis/types.ts` and `src/game/crisis/EndGameCrisis.ts` with genuine logic and the 5,200 EHP invariant.

## 🔒 My Identity
- Archetype: teamwork_preview_worker_crisis_types_engine
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_types_engine
- Original parent: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Milestone: 12-Crisis Expansion

## 🔒 Key Constraints
- Exclusive write ownership: ONLY modify `src/game/crisis/types.ts` and `src/game/crisis/EndGameCrisis.ts`
- DO NOT CHEAT. All implementations must be genuine.
- Strict 5,200 EHP invariant across all 12 archetypes (riftHp: 600, sovereignHullHp: 2500, coreHp: 1500, enrageTime: 35.0)
- Uniform 1/12 random distribution

## Current Parent
- Conversation ID: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Updated: 2026-09-03T03:26:50Z

## Task Summary
- **What to build**: Expand `CrisisArchetype` to 12, add 18 new `CrisisAttackType`s, populate `CRISIS_ARCHETYPE_CONFIGS` for the 6 new archetypes, update `EndGameCrisis.ts` (startIncursion, getArchetypeTitle, executeArchetypeAttack, passive hazard handling).
- **Success criteria**: Clean compilation via `npx tsc --noEmit`, full behavior fidelity per Spec Miner handoff.
- **Interface contracts**: `COLLABORATION.md`, Spec Miner handoff.

## Key Decisions Made
- Used explicit 12-element array containing all 12 `CrisisArchetype` values for uniform 1/12 random distribution in `startIncursion()`.
- Added exact configs in `CRISIS_ARCHETYPE_CONFIGS` preserving the strict 5,200 EHP invariant: $600 \times 2 + 2500 + 1500 = 5,200$.
- Assigned `vortexPullIntensity` per archetype (20 for Biomorphic, 50 for Singularity, 25 for Nanite, 30 for Psionic, 20 for Glacial, 35 for Cosmic).
- Added uppercase titles in `getArchetypeTitle()`.
- Implemented Phase 2 alternating attacks and Phase 3 core enrage attacks for all 6 new archetypes with bespoke bullet speeds, colors, counts, and trajectories.
- Implemented polarized anchor gravity for Singularity Core and area-denial environmental hazard logic in `applyEnvironmentalHazards()`.

## Change Tracker
- **Files modified**:
  * `src/game/crisis/types.ts`: Added 6 enum members, 18 attack types, 6 configs with 5,200 EHP invariant.
  * `src/game/crisis/EndGameCrisis.ts`: Added 12-archetype incursion roll, vortex pull intensities, uppercase titles, full Phase 2 & 3 attack cases, polarized gravity, and environmental hazards.
- **Build status**: `npx tsc --noEmit` PASS (0 errors), `npm run build` PASS (0 errors).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Pass. Programmatic simulation verified all 12 archetypes instantiate and execute attacks in Phases 2 and 3.
- **Lint status**: Clean TypeScript types, no emit errors.
- **Tests added/modified**: Verified against unit and stress requirements.

## Loaded Skills
- None

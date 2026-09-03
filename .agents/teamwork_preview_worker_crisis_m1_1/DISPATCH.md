## 2026-09-01T06:25:24Z

You are a teamwork_preview_worker implementing Milestone 1 (Crisis Types, Entities & Vector Visuals) for the Water Invader project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_m1_1

Read these files first:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/COLLABORATION.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership for Milestone 1:
- `src/game/crisis/types.ts` (NEW)
- `src/game/crisis/DimensionalRift.ts` (NEW)
- `src/game/crisis/CrisisSovereign.ts` (NEW)
- `src/game/crisis/EndGameCrisis.ts` (NEW)
- `src/game/SoundManager.ts` (EDIT - add crisis audio synthesis)
- `src/game/types.ts` (EDIT if needed to re-export crisis types)

Milestone 1 Requirements:
1. Create `src/game/crisis/types.ts` with comprehensive TypeScript types:
   - `CrisisArchetype`: `'VOID_SOVEREIGN'`, `'ABYSSAL_LEVIATHAN'`, `'CYBERNETIC_EXTERMINATOR'`
   - `CrisisPhase`: `'INCURSION'`, `'PHASE_1_SHIELD'`, `'PHASE_2_HULL'`, `'PHASE_3_CORE'`, `'DEFEATED'`
   - `EndGameCrisisState`, `ICrisisEntity`, `ICrisisRift`, `CrisisAttackPattern`
2. Create `src/game/crisis/DimensionalRift.ts`:
   - Extends `Entity` (or integrates with game entities).
   - Dimensions: 80x80px dimensional anomaly.
   - Procedural vector rendering: glowing swirling purple/cyan accretion disk, particle distortion, pulsing core event horizon.
   - HP pool: 600 HP each. Emits gravitational wave particles and shields the Crisis Sovereign while alive.
3. Create `src/game/crisis/CrisisSovereign.ts`:
   - Screen-filling cataclysm entity (260x130px), `Faction.INVADER`.
   - Procedural vector rendering: 100% pure Canvas 2D vector art (crystalline void hull, glowing energy conduit lines, central pulsating singularity eye, rotating hex-barrier deflection matrix during shielded phase).
   - Multi-phase health bars and damage processing.
   - Total effective health pool: 2,500 HP Sovereign + 1,200 HP Rifts (Phase 1 Anchors) + Phase 3 Enraged Core (1,500 HP) = 5,200 EHP.
   - Distinct procedural vector rendering for the 3 Archetypes (Void Sovereign, Bio-Swarm Leviathan, Cybernetic Exterminator).
4. Create `src/game/crisis/EndGameCrisis.ts`:
   - Coordinator managing the End-Game Crisis lifecycle: incursion warning countdown (3.0s), phase transitions, entity update loop, collision hooks, bullet emission, reality-bending vortex pulls, and victory/defeat callbacks.
5. In `src/game/SoundManager.ts`:
   - Implement `playCrisisCataclysmSiren()`, `playDarkMatterBeam()`, `playDimensionalRiftPulse()`, `playSingularityCollapse()`.
   - Ensure all methods check `if (!this.enabled || !this.audioCtx || this.isMuted) return;` and safely clean up all nodes.
6. Verify code compiles with `npx tsc --noEmit` and passes `npm run build`.
7. Write your detailed report to /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_m1_1/report.md and create handoff.md.
8. Send a message to the caller when complete.

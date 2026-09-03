## 2026-09-03T03:22:39Z

You are the Crisis Types & Engine Worker for the 12-Crisis Expansion project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_types_engine
Workspace directory: /Users/user/src/water-invader
ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
PROJECT.md: /Users/user/src/water-invader/PROJECT.md
COLLABORATION.md: /Users/user/src/water-invader/COLLABORATION.md
Spec Miner Handoff: /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_12/handoff.md
Crisis Arch Handoff: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_arch_12/handoff.md

MANDATORY: Read ORIGINAL_REQUEST.md first.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own and may modify ONLY these two files:
1. `src/game/crisis/types.ts`
2. `src/game/crisis/EndGameCrisis.ts`

Task Details:
1. In `src/game/crisis/types.ts`:
   - Expand `CrisisArchetype` enum to 12 members by adding:
     * `BIOMORPHIC_SWARM = 'BIOMORPHIC_SWARM'`
     * `SINGULARITY_CORE = 'SINGULARITY_CORE'`
     * `NANITE_HARVESTER = 'NANITE_HARVESTER'`
     * `PSIONIC_SHROUD = 'PSIONIC_SHROUD'`
     * `GLACIAL_OBLIVION = 'GLACIAL_OBLIVION'`
     * `COSMIC_DEVOURER = 'COSMIC_DEVOURER'`
   - Expand `CrisisAttackType` union with all new attacks specified in the Spec Miner handoff:
     * `CORROSIVE_BILE_BARRAGE` | `MANDIBLE_RIPPER_VOLLEY` | `SWARM_INFESTATION`
     * `HAWKING_RADIATION_LANCE` | `RELATIVISTIC_JET_FLARE` | `EVENT_HORIZON_IMPLOSION`
     * `MOLECULAR_DISASSEMBLY_RAY` | `SUBATOMIC_NANITE_FLAK` | `GREY_SINGULARITY_STORM`
     * `MIND_FLAY_LANCE` | `TELEKINETIC_DAGGER_HELIX` | `SHROUD_APOCALYPSE_INVERSION`
     * `SUB_ZERO_ICICLE_VOLLEY` | `CRYO_THERMAL_DRAIN` | `BLIZZARD_DEEP_FREEZE`
     * `SUPERNOVA_BREATH_BEAM` | `ASTRAL_SCALE_SCATTER` | `STAR_DEVOURING_EXTINCTION`
   - Add all 6 new configs in `CRISIS_ARCHETYPE_CONFIGS` conforming to the exact 5,200 EHP invariant:
     * `riftHp: 600`, `sovereignHullHp: 2500`, `coreHp: 1500`, `enrageTime: 35.0`
     * Precise color codes, vortex strengths, and base fire rates per `COLLABORATION.md` and the Spec Miner handoff.

2. In `src/game/crisis/EndGameCrisis.ts`:
   - In `startIncursion()`:
     * Update the archetype selection array to include all 12 `CrisisArchetype` enum values (or `Object.values(CrisisArchetype)`), ensuring uniform 1/12 random distribution.
     * Assign `vortexPullIntensity` for all 6 new archetypes (e.g. 20 for Biomorphic, 50 for Singularity, 25 for Nanite, 30 for Psionic, 20 for Glacial, 35 for Cosmic).
   - In `getArchetypeTitle()`:
     * Add uppercase title cases for all 6 new archetypes for warning banners and HUD display.
   - In `executeArchetypeAttack()`:
     * Add full switch cases implementing Phase 2 primary/secondary alternating attacks and Phase 3 core enrage barrages for each of the 6 new archetypes according to the Spec Miner handoff.
     * Ensure bullet colors, speeds, counts, and trajectories faithfully match the design (e.g. 14-way bio-plasmid helix, 16-way Hawking Nova, 16-way radial nanite storm, 12-way Shroud terror stars, 14-way blizzard starburst, 16-way solar flare corona).
   - In environmental hazard handling:
     * Add area-denial hazard logic (e.g. spore hazard, gravity curving, frost slow, etc.).

3. Verification:
   - Run `npx tsc --noEmit` to verify type cleanliness.
   - Write your handoff report to `/Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_types_engine/handoff.md` and send a message back to the orchestrator.

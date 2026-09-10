# Dispatch for pitch_worker_stream_b_environment

**Role**: Stream B: Environmental Dynamics & Lighting Architect
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_worker_stream_b_environment
**Assigned Features**:
- Feature 4: Hydrothermal Vents & Ocean Currents (`src/game/flagship/environment/HydrothermalVent.ts`, `src/game/flagship/environment/OceanCurrent.ts`)
- Feature 5: Biolapse Darkness Cycle & Prow Searchlight (`src/game/flagship/environment/BiolapseDarknessCycle.ts`)

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Inputs**:
- `/Users/user/src/water-invader/src/game/flagship/types.ts`
- `/Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts`
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_1/handoff.md` (Features 4–5 mathematical formulas and specs)
- `/Users/user/src/water-invader/IDEAS_PITCH.md`

**Write Ownership**:
- `src/game/flagship/environment/HydrothermalVent.ts`
- `src/game/flagship/environment/OceanCurrent.ts`
- `src/game/flagship/environment/BiolapseDarknessCycle.ts`
- `src/game/flagship/environment/index.ts`

**Strict Invariants**:
- Logical coordinate bounds: 600 x 800.
- Implement full `IFlagshipSubsystem` interface (`init`, `update`, `drawBackground`, `drawWorld`, `drawForeground`, `handleInput`, `reset`).
- Zero external assets (all procedural Canvas 2D gradients, composite operations for lighting masks, and particle columns).
- Verify type safety with `npx tsc --noEmit`.
- Write handoff report to `/Users/user/src/water-invader/.agents/pitch_worker_stream_b_environment/handoff.md`.

## 2026-09-10T05:38:27Z
You are pitch_worker_stream_b_environment, a teamwork_preview_worker.
Your working directory is: /Users/user/src/water-invader/.agents/pitch_worker_stream_b_environment.
Read your dispatch at /Users/user/src/water-invader/.agents/pitch_worker_stream_b_environment/DISPATCH.md.

Read:
- /Users/user/src/water-invader/src/game/flagship/types.ts
- /Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts
- /Users/user/src/water-invader/.agents/pitch_spec_miner_1/handoff.md (Features 4–5 math and specs)
- /Users/user/src/water-invader/IDEAS_PITCH.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/game/flagship/environment/HydrothermalVent.ts
- src/game/flagship/environment/OceanCurrent.ts
- src/game/flagship/environment/BiolapseDarknessCycle.ts
- src/game/flagship/environment/index.ts

Implement the environmental dynamics and lighting systems:
1. Hydrothermal Vents & Currents: Seabed mineral chimneys projecting conical 380°C plumes, enemy heat DoT, player bullet superheated steam lances (+35% dmg, +1 pierce, -680px/s), counter-buoyancy bullet dissolution, laser cooling halo, mineral ejection buffs, ocean current shear drift vectors.
2. Biolapse Darkness Cycle: 4-phase day/night cycle (sunlight 60s, twilight 5s, midnight 25s, dawn 5s), directional prow searchlight cone with battery drain (-4 U/s) and kinetic dynamo recharge, photonic flash shock stun, bioluminescent predator camouflage.

Implement full IFlagshipSubsystem interface on each class or a unified EnvironmentSubsystem.
Verify with `npx tsc --noEmit`.
Write your handoff report to /Users/user/src/water-invader/.agents/pitch_worker_stream_b_environment/handoff.md and notify parent when complete.


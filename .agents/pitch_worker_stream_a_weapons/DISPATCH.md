# Dispatch for pitch_worker_stream_a_weapons

**Role**: Stream A: Advanced Weapons & Kinetic Systems Architect
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_worker_stream_a_weapons
**Assigned Features**:
- Feature 1: Cavitation Torpedo (`src/game/flagship/weapons/CavitationTorpedo.ts`)
- Feature 2: Bioluminescent Laser & Refraction Prisms (`src/game/flagship/weapons/BioluminescentLaser.ts`, `src/game/flagship/weapons/RefractionPrism.ts`)
- Feature 3: Hydraulic Harpoon & Slingshot (`src/game/flagship/weapons/HydraulicHarpoon.ts`)

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Inputs**:
- `/Users/user/src/water-invader/src/game/flagship/types.ts`
- `/Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts`
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_1/handoff.md` (Features 1–3 mathematical formulas and specs)
- `/Users/user/src/water-invader/IDEAS_PITCH.md`

**Write Ownership**:
- `src/game/flagship/weapons/CavitationTorpedo.ts`
- `src/game/flagship/weapons/BioluminescentLaser.ts`
- `src/game/flagship/weapons/RefractionPrism.ts`
- `src/game/flagship/weapons/HydraulicHarpoon.ts`
- `src/game/flagship/weapons/index.ts`

**Strict Invariants**:
- Logical coordinate bounds: 600 x 800.
- Implement full `IFlagshipSubsystem` interface (`init`, `update`, `drawWorld`, `drawForeground`, `handleInput`, `reset`).
- Zero external assets (all procedural Canvas 2D vector art & particle rendering).
- Verify type safety with `npx tsc --noEmit`.
- Write handoff report to `/Users/user/src/water-invader/.agents/pitch_worker_stream_a_weapons/handoff.md`.

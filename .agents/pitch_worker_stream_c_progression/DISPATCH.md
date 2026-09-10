# Dispatch for pitch_worker_stream_c_progression

**Role**: Stream C: Progression, Chassis & Crew Deck Architect
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_worker_stream_c_progression
**Assigned Features**:
- Feature 6: Modular Submersible Chassis & Hangar Radar Chart (`src/game/flagship/progression/ModularChassis.ts`, `src/game/flagship/progression/ChassisRadarChart.ts`)
- Feature 7: Veteran Crew Synergy Deck (`src/game/flagship/progression/CrewOfficerDeck.ts`)

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Inputs**:
- `/Users/user/src/water-invader/src/game/flagship/types.ts`
- `/Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts`
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_1/handoff.md` (Feature 6 hull archetypes & radar math)
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md` (Feature 7 crew officers, passives, actives, combos)
- `/Users/user/src/water-invader/IDEAS_PITCH.md`

**Write Ownership**:
- `src/game/flagship/progression/ModularChassis.ts`
- `src/game/flagship/progression/ChassisRadarChart.ts`
- `src/game/flagship/progression/CrewOfficerDeck.ts`
- `src/game/flagship/progression/index.ts`

**Strict Invariants**:
- Logical coordinate bounds: 600 x 800.
- Implement full `IFlagshipSubsystem` interface.
- 5 Hulls: Nautilus (Ironclad Dreadnought), Stingray (Deep Recon), Kraken (Bio-Symbiont), Leviathan (Heavy Harvester), Ghost (Stealth Sub).
- 4 Officers: Ingrid Vane, Jax Callahan, Ren Thorne, Dr. Lyra Vance with active abilities, keybindings, and resonances.
- Zero external assets.
- Verify type safety with `npx tsc --noEmit`.
- Write handoff report to `/Users/user/src/water-invader/.agents/pitch_worker_stream_c_progression/handoff.md`.

## 2026-09-10T05:38:27Z
You are pitch_worker_stream_c_progression, a teamwork_preview_worker.
Your working directory is: /Users/user/src/water-invader/.agents/pitch_worker_stream_c_progression.
Read your dispatch at /Users/user/src/water-invader/.agents/pitch_worker_stream_c_progression/DISPATCH.md.

Read:
- /Users/user/src/water-invader/src/game/flagship/types.ts
- /Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts
- /Users/user/src/water-invader/.agents/pitch_spec_miner_1/handoff.md (Feature 6 hull archetypes & radar math)
- /Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md (Feature 7 crew officers, passives, actives, combos)
- /Users/user/src/water-invader/IDEAS_PITCH.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/game/flagship/progression/ModularChassis.ts
- src/game/flagship/progression/ChassisRadarChart.ts
- src/game/flagship/progression/CrewOfficerDeck.ts
- src/game/flagship/progression/index.ts

Implement the progression systems:
1. Modular Submersible Chassis: 5 distinct hulls (Nautilus Dreadnought, Stingray Interceptor, Kraken Bioship, Leviathan Harvester, Ghost Stealth Sub), 6-axis radar profiles, stat trade-offs, modular hardpoint slot mapping, Canvas 2D hexagonal radar chart rendering.
2. Veteran Crew Synergy Deck: 4 Bridge Officers (Ingrid Vane, Jax Callahan, Ren Thorne, Dr. Lyra Vance) across 4 stations, 12 passives, 4 active cooldown abilities with keybindings [1]-[4] / [Q][E][R][F], 6 dual resonance combos, and the quad Abyssal Leviathan Matrix.

Implement full IFlagshipSubsystem interface on each class or a unified ProgressionSubsystem.
Verify with `npx tsc --noEmit`.
Write your handoff report to /Users/user/src/water-invader/.agents/pitch_worker_stream_c_progression/handoff.md and notify parent when complete.

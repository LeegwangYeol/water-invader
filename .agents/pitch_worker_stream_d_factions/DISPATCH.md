# Dispatch for pitch_worker_stream_d_factions

**Role**: Stream D: Factions, Swarm Defenses & Apex Encounters Architect
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_worker_stream_d_factions
**Assigned Features**:
- Feature 8: Mutating Bio-Horror Faction & Epigenetic Mutation (`src/game/flagship/factions/HadalBioHorrors.ts`, `src/game/flagship/factions/EpigeneticMutationEngine.ts`)
- Feature 9: Automaton Shield Phalanx & Barrier Grid (`src/game/flagship/factions/AutomatonPhalanx.ts`, `src/game/flagship/factions/AutomatonShieldGrid.ts`)
- Feature 10: Apex Bosses - Charybdis Prime Kraken (`src/game/flagship/factions/KrakenPrimeBoss.ts`)

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Inputs**:
- `/Users/user/src/water-invader/src/game/flagship/types.ts`
- `/Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts`
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md` (Features 8, 9, 10 mathematical models, states, abilities)
- `/Users/user/src/water-invader/IDEAS_PITCH.md`

**Write Ownership**:
- `src/game/flagship/factions/HadalBioHorrors.ts`
- `src/game/flagship/factions/EpigeneticMutationEngine.ts`
- `src/game/flagship/factions/AutomatonPhalanx.ts`
- `src/game/flagship/factions/AutomatonShieldGrid.ts`
- `src/game/flagship/factions/KrakenPrimeBoss.ts`
- `src/game/flagship/factions/index.ts`

**Strict Invariants**:
- Logical coordinate bounds: 600 x 800.
- Implement full `IFlagshipSubsystem` interface.
- Bio-Horrors: Clinger, Siphoner, Colossus, Angler, Broodmother + dynamic weapon resistance adaptation.
- Automaton Phalanx: Aegis Drones, EMP Prowlers, Rail Sentinels + Euclidean distance linked shield grid.
- Apex Boss: Multi-part Kraken with 8 IK tentacles, inhalation vortex pull, critical gullet weakpoint, ink blackout.
- Zero external assets.
- Verify type safety with `npx tsc --noEmit`.
- Write handoff report to `/Users/user/src/water-invader/.agents/pitch_worker_stream_d_factions/handoff.md`.

## 2026-09-10T05:38:27Z
You are pitch_worker_stream_d_factions, a teamwork_preview_worker.
Your working directory is: /Users/user/src/water-invader/.agents/pitch_worker_stream_d_factions.
Read your dispatch at /Users/user/src/water-invader/.agents/pitch_worker_stream_d_factions/DISPATCH.md.

Read:
- /Users/user/src/water-invader/src/game/flagship/types.ts
- /Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts
- /Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md (Features 8, 9, 10 mathematical models, states, abilities)
- /Users/user/src/water-invader/IDEAS_PITCH.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/game/flagship/factions/HadalBioHorrors.ts
- src/game/flagship/factions/EpigeneticMutationEngine.ts
- src/game/flagship/factions/AutomatonPhalanx.ts
- src/game/flagship/factions/AutomatonShieldGrid.ts
- src/game/flagship/factions/KrakenPrimeBoss.ts
- src/game/flagship/factions/index.ts

Implement the enemy factions and apex encounters:
1. Hadal Bio-Horrors: 5 distinct units (Parasite Clinger, Spore Siphoner, Carapace Colossus, Abyssal Angler, Broodmother Matriarch) + Epigenetic Mutation Engine dynamically countering player weapon doctrines (capped at 40% mitigation).
2. Automaton Shield Phalanx: Ancient bronze relic fleet (Phalanx Aegis Drones, EMP Disruption Prowlers, Rail-Mortar Sentinels), Euclidean distance coupling (d <= 160px) for shared hexagonal energy walls with 40% dampening, inductive resonant backlash cascade vulnerability.
3. Apex Boss: Charybdis Prime (Abyssal Megalodon Kraken) with 12,000 EHP, 8 destructible tentacles with inverse kinematics, upward inhalation vortex pull, 2.5x critical gullet weakpoint, and bioluminescent ink blackout.

Implement full IFlagshipSubsystem interface on each class or a unified FactionsSubsystem.
Verify with `npx tsc --noEmit`.
Write your handoff report to /Users/user/src/water-invader/.agents/pitch_worker_stream_d_factions/handoff.md and notify parent when complete.


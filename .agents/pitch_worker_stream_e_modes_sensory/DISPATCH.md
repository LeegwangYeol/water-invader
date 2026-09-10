# Dispatch for pitch_worker_stream_e_modes_sensory

**Role**: Stream E: Novel Modes & Sensory Immersion UI Architect
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_worker_stream_e_modes_sensory
**Assigned Features**:
- Feature 11: Roguelike Endless Mode & Bathymetric DAG (`src/game/flagship/modes/EndlessDescent.ts`, `src/game/flagship/modes/BathymetricDAG.ts`, `src/game/flagship/modes/BoonDraftDeck.ts`)
- Feature 12: Sonar/Hydrophone UI & Stress FX (`src/game/flagship/sensory/TacticalSonarHUD.ts`, `src/game/flagship/sensory/HydrophoneSpectrogram.ts`, `src/game/flagship/sensory/HullStressFX.ts`)

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Inputs**:
- `/Users/user/src/water-invader/src/game/flagship/types.ts`
- `/Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts`
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md` (Features 11 & 12 specifications and math)
- `/Users/user/src/water-invader/IDEAS_PITCH.md`

**Write Ownership**:
- `src/game/flagship/modes/EndlessDescent.ts`
- `src/game/flagship/modes/BathymetricDAG.ts`
- `src/game/flagship/modes/BoonDraftDeck.ts`
- `src/game/flagship/modes/index.ts`
- `src/game/flagship/sensory/TacticalSonarHUD.ts`
- `src/game/flagship/sensory/HydrophoneSpectrogram.ts`
- `src/game/flagship/sensory/HullStressFX.ts`
- `src/game/flagship/sensory/index.ts`

**Strict Invariants**:
- Logical coordinate bounds: 600 x 800.
- Implement full `IFlagshipSubsystem` interface.
- Endless Mode: 0m to 11,000m+ depth scaling across 5 strata, DAG node generator, hydrostatic pressure engine with ballast purging ('C'), 24 curated boons + 6 curses.
- Sensory UI: Polar radar sweep line with echo blooms and shockwaves, 16-band hydrophone FFT spectrogram, procedural glass stress fractures on damage.
- Zero external assets.
- Verify type safety with `npx tsc --noEmit`.
- Write handoff report to `/Users/user/src/water-invader/.agents/pitch_worker_stream_e_modes_sensory/handoff.md`.

## 2026-09-10T05:38:27Z
Received Stream E assignment:
Features:
- Feature 11: Roguelike Endless Mode & Bathymetric DAG (`src/game/flagship/modes/EndlessDescent.ts`, `src/game/flagship/modes/BathymetricDAG.ts`, `src/game/flagship/modes/BoonDraftDeck.ts`)
- Feature 12: Sonar/Hydrophone UI & Stress FX (`src/game/flagship/sensory/TacticalSonarHUD.ts`, `src/game/flagship/sensory/HydrophoneSpectrogram.ts`, `src/game/flagship/sensory/HullStressFX.ts`)
Ownership:
- `src/game/flagship/modes/EndlessDescent.ts`
- `src/game/flagship/modes/BathymetricDAG.ts`
- `src/game/flagship/modes/BoonDraftDeck.ts`
- `src/game/flagship/modes/index.ts`
- `src/game/flagship/sensory/TacticalSonarHUD.ts`
- `src/game/flagship/sensory/HydrophoneSpectrogram.ts`
- `src/game/flagship/sensory/HullStressFX.ts`
- `src/game/flagship/sensory/index.ts`
Verification: `npx tsc --noEmit`.


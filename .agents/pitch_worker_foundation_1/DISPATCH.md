# Dispatch for pitch_worker_foundation_1

**Role**: Flagship Foundation & Types Architect
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_worker_foundation_1
**Task**: Establish `src/game/flagship/types.ts`, `src/game/flagship/FlagshipManager.ts`, `src/game/flagship/index.ts`, and update `PROJECT.md`.

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Inputs**:
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_1/handoff.md` (Features 1–6 types & specs)
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md` (Features 7–12 types & specs)
- `/Users/user/src/water-invader/.agents/pitch_explorer_arch_1/handoff.md` (Modular file structure & lifecycle design)
- `/Users/user/src/water-invader/PROJECT.md`

**Write Ownership**:
- `src/game/flagship/types.ts`
- `src/game/flagship/FlagshipManager.ts`
- `src/game/flagship/index.ts`
- `PROJECT.md` (update to document 12 Flagship Features architecture)

**Instructions**:
1. Read the input handoff reports.
2. Create `src/game/flagship/types.ts` containing the unified enums, interfaces, and state types for all 12 Flagship Features.
3. Create `src/game/flagship/FlagshipManager.ts` providing the centralized coordinator that manages instances of all feature systems, orchestrating lifecycle hooks (`init`, `update`, `drawBackground`, `drawWorld`, `drawForeground`, `handleInput`, `reset`). Include safe fallback stubs for uninitialized sub-modules so downstream workers can develop concurrently.
4. Create `src/game/flagship/index.ts` re-exporting all types and `FlagshipManager`.
5. Update `PROJECT.md` to reflect the 12 Flagship Features architecture, inventory, and milestones.
6. Run `npx tsc --noEmit` to verify type safety.
7. Write your completion report to `/Users/user/src/water-invader/.agents/pitch_worker_foundation_1/handoff.md` and notify parent.

## 2026-09-10T05:33:30Z

You are pitch_worker_foundation_1, a teamwork_preview_worker.
Your working directory is: /Users/user/src/water-invader/.agents/pitch_worker_foundation_1.
Read your dispatch at /Users/user/src/water-invader/.agents/pitch_worker_foundation_1/DISPATCH.md.

Read:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/.agents/pitch_spec_miner_1/handoff.md
- /Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md
- /Users/user/src/water-invader/.agents/pitch_explorer_arch_1/handoff.md
- /Users/user/src/water-invader/PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/game/flagship/types.ts
- src/game/flagship/FlagshipManager.ts
- src/game/flagship/index.ts
- PROJECT.md (update to reflect 12 Flagship Features architecture, inventory, and milestones)

Tasks:
1. Implement `src/game/flagship/types.ts` with all shared interfaces, enums, DTOs, and state definitions for the 12 Flagship Features synthesized from the spec miners.
2. Implement `src/game/flagship/FlagshipManager.ts` providing the centralized coordinator that manages instances of all feature systems, orchestrating lifecycle hooks (`init`, `update`, `drawBackground`, `drawWorld`, `drawForeground`, `handleInput`, `reset`). Include safe fallback stubs for uninitialized sub-modules so downstream workers can develop concurrently.
3. Implement `src/game/flagship/index.ts` re-exporting all types and `FlagshipManager`.
4. Update `PROJECT.md` to reflect the 12 Flagship Features architecture, inventory, and milestones.
5. Verify with `npx tsc --noEmit`.
6. Write your report in `/Users/user/src/water-invader/.agents/pitch_worker_foundation_1/handoff.md` and send a message to parent when complete.

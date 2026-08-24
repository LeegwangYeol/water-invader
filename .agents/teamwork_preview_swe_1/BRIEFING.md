# BRIEFING — 2026-08-24T16:40:10+09:00

## Mission
Fix the Wave Intermission Shop transition and restore the Game Over shop in Water Invader.

## 🔒 My Identity
- Archetype: teamwork_preview_swe
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: C:\src\SpaceInvader\.agents\teamwork_preview_swe_1
- Original parent: parent
- Original parent conversation ID: 26d0be31-5832-4123-9cb1-e7ab125e1bd4

## 🔒 My Workflow
- **Pattern**: SWE Light
- **Scope document**: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
1. **Decompose**: No decomposition. Single line of sequential refinement.
2. **Dispatch & Execute**:
   - teamwork_preview_implementer -> teamwork_preview_reviewer -> teamwork_preview_reviewer -> ... -> teamwork_preview_victory_auditor
3. **On failure**:
   - Retry -> Replace -> Skip -> Redistribute -> Degrade
4. **Succession**: Self-succeed when spawn count >= 16 and all subagents complete.
- **Work items**:
  1. Fix wave intermission transition and restore game over shop [in-progress]
- **Current phase**: 2 (Dispatch & Execute)
- **Current focus**: Waiting for teamwork_preview_implementer (544c93cc-c199-4d89-8c16-d8f5b9d862ef)

## 🔒 Key Constraints
- NEVER write, modify, or create source code files yourself. Delegate all implementation and repair to workers.
- NEVER explore or debug the codebase to solve the task yourself.
- Verify independently: spot-check diffs and re-run build/tests.
- Carry open-issues ledger across all rounds.
- Run at least 3 review rounds and verify tests/build before victory audit.
- Propagate original task verbatim.

## Current Parent
- Conversation ID: 26d0be31-5832-4123-9cb1-e7ab125e1bd4
- Updated: 2026-08-24T16:40:00+09:00

## Key Decisions Made
- Initialized SWE Light sequential refinement workflow.
- Dispatched teamwork_preview_implementer (convId: 544c93cc-c199-4d89-8c16-d8f5b9d862ef).

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|---|---|---|---|---|
| teamwork_preview_implementer_1 | teamwork_preview_implementer | Implementation of wave intermission shop & game over shop | in-progress | 544c93cc-c199-4d89-8c16-d8f5b9d862ef |

## Succession Status
- Succession required: no
- Spawn count: 1 / 16
- Pending subagents: 544c93cc-c199-4d89-8c16-d8f5b9d862ef
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 55d1d2b6-bb21-46b4-af9b-44e248657adc/task-11
- Safety timer: none

## Artifact Index
- C:\src\SpaceInvader\.agents\teamwork_preview_swe_1\BRIEFING.md
- C:\src\SpaceInvader\.agents\teamwork_preview_swe_1\DISPATCH.md
- C:\src\SpaceInvader\.agents\teamwork_preview_swe_1\progress.md

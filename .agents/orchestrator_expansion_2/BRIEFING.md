# BRIEFING — 2026-09-04T01:01:00+09:00

## Mission
Orchestrate the major feature expansion of Water Invader: Dynamic Backgrounds (R1), Allied Reinforcements (R2), and Barricade Saboteurs & Repair Mechanics (R3) with rigorous multi-agent verification and Claude collaboration.

## 🔒 My Identity
- Archetype: orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: /Users/user/src/water-invader/.agents/orchestrator_expansion_2
- Original parent: Sentinel
- Original parent conversation ID: e047ca5c-667e-42d8-aa5c-b737e38a8d2a

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: /Users/user/src/water-invader/PROJECT.md
1. **Decompose**: Survey (Phase 0 Explorers) -> Architecture & Feature Inventory -> Decompose Milestones -> Implementation & E2E Tracks
2. **Dispatch & Execute**:
   - Survey: 3 Explorers dispatched and completed (R1, R2, R3).
   - Plan & Claude Sync: Updated COLLABORATION.md & PROJECT.md with full architectural blueprints.
   - User Explicit Approval Gate: Present plan to user and Claude; await explicit user approval ("proceed") before code implementation.
   - Implementation Track (M1, M2, M3) & E2E Testing Track (M4) dispatched upon approval.
3. **On failure**:
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: At 16 spawns, write handoff.md, spawn successor
- **Work items**:
  1. Survey & Architecture Mapping [DONE]
  2. Plan & Claude Collaboration Sync [DONE]
  3. User Explicit Approval Gate [ACTIVE - Awaiting User Approval]
  4. Milestone M1: Dynamic Backgrounds & Threat Signifiers [pending approval]
  5. Milestone M2: Allied Reinforcements with Roles & UI [pending approval]
  6. Milestone M3: Barricade Saboteurs & Repair Mechanics [pending approval]
  7. Milestone M4: Dual-Track Verification, E2E Suites, Audit & Git Sync [pending approval]
- **Current phase**: 0 -> Approval Gate
- **Current focus**: Awaiting explicit user approval ("proceed") to start implementation

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- You MAY use file-editing tools ONLY for metadata/state files (.md) in your .agents/ folder, plus PROJECT.md and COLLABORATION.md.
- ALWAYS wait for explicit user approval before proceeding with implementation code changes.
- DO NOT CHEAT warning on all workers.
- Pre-commit build rule: npm run build & npx tsc --noEmit must pass with 0 errors.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.

## Current Parent
- Conversation ID: e047ca5c-667e-42d8-aa5c-b737e38a8d2a
- Updated: not yet

## Key Decisions Made
- Dispatched Phase 0 Explorers (3 parallel agents) to survey the codebase across R1, R2, R3.
- All 3 Explorers completed in-depth architectural and test specifications.
- Unified architecture synthesized into PROJECT.md and COLLABORATION.md.
- Adhering strictly to User Global Rule: Waiting for user approval ("proceed") before any code modifications or worker dispatches.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|---|---|---|---|---|
| worker_m1 | teamwork_preview_worker | Implement M1: Dynamic Backgrounds & Threat Signifiers | completed | 3171d21a-0e0c-4849-832b-8c3c5c22d6ca |
| test_writer_e2e | teamwork_preview_test_writer | Dual-Track E2E Test Suite Creation | completed | a18fc10d-e7a3-427d-933b-32699e1cebd3 |
| worker_m2 | teamwork_preview_worker | Implement M2: Allied Reinforcements with Roles & UI | completed | 13128a4b-4f08-4b69-9800-7ae1de19bb94 |
| worker_m3 | teamwork_preview_worker | Implement M3: Barricade Saboteurs & Repair Mechanics | in-progress | 3afdfd70-3b5e-4ef0-aa41-8a17de46f202 |

## Succession Status
- Succession required: no
- Spawn count: 4 / 16
- Pending subagents: 3afdfd70-3b5e-4ef0-aa41-8a17de46f202
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 03251405-283f-4dac-a410-75a04069ddc9/task-25
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run manage_task(Action="list") — re-create if missing

## Artifact Index
- /Users/user/src/water-invader/.agents/orchestrator_expansion_2/DISPATCH.md — Initial dispatch instructions
- /Users/user/src/water-invader/.agents/orchestrator_expansion_2/BRIEFING.md — Persistent working memory
- /Users/user/src/water-invader/.agents/orchestrator_expansion_2/progress.md — Liveness & progress tracking
- /Users/user/src/water-invader/PROJECT.md — Global project architecture & feature inventory
- /Users/user/src/water-invader/COLLABORATION.md — Claude collaboration guide
- /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_bg_threat/survey.md — R1 Survey Report
- /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_allies_ui/survey.md — R2 Survey Report
- /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_barricades_repair/survey.md — R3 Survey Report

# BRIEFING — 2026-09-03T05:18:25Z

## Mission
Adversarially stress-test and fuzz state transitions and game-breaking edge conditions in water-invader (pause spam, simultaneous 0-HP boss/player, shop illegal purchase, localStorage corruption).

## 🔒 My Identity
- Archetype: bughunt_chal_edgecases_1
- Roles: critic, specialist
- Working directory: /Users/user/src/water-invader/.agents/bughunt_chal_edgecases_1
- Original parent: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Milestone: bughunt
- Instance: 1 of 1

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code
- Report failures as findings — do NOT fix them yourself
- .agents/ holds only agent metadata — NEVER place source code, tests, or data files here
- Empirically verify all bugs by writing and running verification code/tests in project test suite or runner
- Mandatory read: ORIGINAL_REQUEST.md, COLLABORATION.md, PROJECT.md

## Current Parent
- Conversation ID: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Updated: 2026-09-03T05:18:25Z

## Review Scope
- **Files to review**: Game loop, state managers, combat resolution, shop system, storage system
- **Interface contracts**: PROJECT.md, COLLABORATION.md
- **Review criteria**: State integrity, determinism, crash/exception immunity, NaN protection, validation

## Attack Surface
- **Hypotheses tested**: TBD
- **Vulnerabilities found**: TBD
- **Untested angles**: Rapid pause spam, simultaneous 0 HP, invalid shop purchases, localStorage corruption

## Loaded Skills
- None required directly yet

## Key Decisions Made
- Initializing empirical fuzzing harness to reproduce edge conditions directly against game logic

## Artifact Index
- DISPATCH.md — Dispatch log
- BRIEFING.md — Situational awareness
- progress.md — Liveness & heartbeat
- handoff.md — Final handoff report

# BRIEFING — 2026-09-03T03:19:30Z

## Mission
Exhaustive technical investigation of the current Crisis Architecture (6 archetypes, EHP models, attack phases, DimensionalRift anchors, GameManager integration, and extension points for 12 archetypes).

## 🔒 My Identity
- Archetype: explorer
- Roles: Crisis Architecture Explorer
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_arch_12
- Original parent: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Milestone: 12-Crisis Expansion Technical Investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code
- Files in .agents/ must only contain metadata (no source/tests/data)
- Always wait for explicit user approval before proceeding with implementation
- Claude collaboration workflow via COLLABORATION.md
- Produce comprehensive handoff.md with 5 components

## Current Parent
- Conversation ID: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Updated: 2026-09-03T03:19:30Z

## Investigation State
- **Explored paths**:
  - `src/game/crisis/types.ts`: CrisisArchetype enum, CrisisPhase, CRISIS_ARCHETYPE_CONFIGS, CrisisAttackPattern, ICrisisEntity, EndGameCrisisState
  - `src/game/crisis/EndGameCrisis.ts`: Coordinator class, phase state machine, incursion warning, attack loops, bullet collision handling
  - `src/game/crisis/DimensionalRift.ts`: Phase 1 anchor entities, gravity vortexes, laser tripwires, phase-shifting pods
  - `src/game/crisis/CrisisSovereign.ts`: Sovereign hull/core HP, hex deflector barriers, 6 distinct vector art drawing functions, HUD
  - `src/game/GameManager.ts`: Stage 15+ spawn trigger logic, pity timer, collision routing, defeat rewards, 3-layer rendering pipeline
  - `src/components/game-canvas.tsx`: Warning overlay and active crisis badges
  - `tests/unit/crisis_doubling.test.ts`: Existing 9 unit tests verifying 6-archetype contracts and 5,200 EHP invariant
  - `tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts`: Existing stress test verifying 6 archetypes
- **Key findings**:
  - 5,200 EHP standard invariant: 2 anchors @ 600 HP (1,200 total) + 2,500 Sovereign Hull HP + 1,500 Core HP = 5,200 EHP across all archetypes.
  - Phase 3 Enrage is 35.0s across all archetypes, accelerating fire interval from ~2.2s to 1.4s.
  - Hardcoded array in `EndGameCrisis.startIncursion()` currently lists 6 archetypes. Must be converted to dynamic `Object.values(CrisisArchetype)`.
  - Exactly 5 files in codebase need extension to add 6 new archetypes cleanly.
  - `expect(archetypes.length).toBe(6)` exists in test files and must be updated to 12.
- **Unexplored areas**: None. Complete coverage achieved.

## Key Decisions Made
- Fully documented all 6 crisis archetypes, EHP models, attack patterns, anchor mechanics, and GameManager lifecycle.
- Synthesized exact 5-point extension blueprint for implementing 6 new archetypes (total 12).

## Artifact Index
- DISPATCH.md — Recorded dispatch request
- BRIEFING.md — Living context and memory
- progress.md — Liveness heartbeat
- handoff.md — Comprehensive investigation report

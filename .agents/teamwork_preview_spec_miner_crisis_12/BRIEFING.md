# BRIEFING — 2026-09-03T03:19:30Z

## Mission
Discover, design, and thoroughly specify 6 brand-new End-Game Crisis archetypes to double the crisis roster from 6 to 12 with full mechanics, phase balancing (total 5,200 EHP standard), visual themes, environmental hazards, and uniform 1/12 distribution.

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: Grand Strategy Crisis Designer and Spec Miner
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_12
- Original parent: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Milestone: 12-Crisis Expansion Phase 1 (Spec Mining & Game Design)

## 🔒 Key Constraints
- Do NOT implement anything — read-only spec mining and design.
- Exactly 6 new distinct archetypes expanding total from 6 to 12.
- Total boss EHP per crisis must be exactly 5,200 (Phase 1 Anchors: 1,200, Phase 2 Hull: 2,500, Phase 3 Core: 1,500).
- Detailed visual styling (accent, secondary, glow, banner, silhouette, particle trail).
- Unique environmental hazard/minion mechanics per archetype.
- Uniform distribution (1/12 chance = 8.33% each) and no collisions with existing 6 crises.
- Handoff report in handoff.md with 5 components plus Features Discovered & Edge Cases tables.

## Current Parent
- Conversation ID: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Updated: not yet

## Task Summary
- **What to build**: Comprehensive specification and game design for 6 new crisis archetypes doubling the roster to 12.
- **Success criteria**: Full details on all 6 new archetypes (enum, title, lore, visual theme, 3-phase mechanics with exact 5,200 EHP split, environmental hazards, spawn logic, test verification method).
- **Interface contracts**: PROJECT.md, src/game/crisis/types.ts, src/game/crisis/EndGameCrisis.ts, src/game/crisis/DimensionalRift.ts, src/game/crisis/CrisisSovereign.ts
- **Code layout**: src/game/crisis, tests/unit, tests/stress, handoff.md

## Key Decisions Made
- Analyzed existing 6 crises (`VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`, `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, `NEBULA_PHANTASM`).
- Designed 6 new archetypes:
  1. `BIOMORPHIC_SWARM` (Extragalactic Chitin Flesh-Hive)
  2. `SINGULARITY_CORE` (Supermassive Event Horizon Entity)
  3. `NANITE_HARVESTER` (Grey-Goo Molecular Disassembler)
  4. `PSIONIC_SHROUD` (Extra-Dimensional Astral Inmate)
  5. `GLACIAL_OBLIVION` (Absolute Zero Entropic Engine)
  6. `COSMIC_DEVOURER` (Astral Void Dragon Behemoth)
- Verified strict 5,200 EHP invariant (1,200 anchors + 2,500 hull + 1,500 core).
- Verified uniform 1/12 (8.33%) distribution without collisions.
- Outlined exact code contracts, vector silhouettes, phase mechanics, and test plan.

## Artifact Index
- /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_12/DISPATCH.md — Dispatch instructions
- /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_12/progress.md — Liveness heartbeat
- /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_12/handoff.md — Final specification report

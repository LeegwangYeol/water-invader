# BRIEFING — 2026-09-17T04:54:30Z

## Mission
Extract precise quantitative specifications, physics invariants, and edge conditions for player buoyancy, ballast restoration, and hydrothermal vent dissipation.

## 🔒 My Identity
- Archetype: teamwork_preview_spec_miner
- Roles: Specification Miner, Domain Expert, Physics Analyst
- Working directory: /Users/user/src/water-invader/.agents/buoyancy_spec_miner_1
- Original parent: bd5b0c5d-7349-4270-bc7f-be21cf043787
- Milestone: M1 Exploration & Specification

## 🔒 Key Constraints
- Read-only agent: MUST NOT modify any source code files.
- NEVER alter logicalWidth (600) or logicalHeight (800) in GameManager.ts or Enemy.ts.
- Preserves existing game invariants (Steam lance transformation, enemy vent damage, updraft feel).
- Communicate with caller parent (bd5b0c5d-7349-4270-bc7f-be21cf043787) via send_message.

## Current Parent
- Conversation ID: bd5b0c5d-7349-4270-bc7f-be21cf043787
- Updated: not yet

## Task Summary
- **What to build**: Comprehensive specification document (handoff.md) analyzing player baseline Y, lift rates, ballast settling speed, lateral plume dissipation, projectile transformations, enemy damage ticks, and edge cases.
- **Success criteria**: Complete quantitative constraints, code location references, invariants, and edge cases analyzed and verified against codebase.
- **Interface contracts**: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/SCOPE.md
- **Code layout**: /Users/user/src/water-invader/src/game/

## Key Decisions Made
- Confirmed baseline Y formula: `canvasHeight - size.height - 20` (740px default, 734-750px across chassis) maintaining 20px keel clearance above 800px seafloor.
- Identified updraft speeds: 160 px/s (Dormant/Charge) and 260 px/s (Erupting) clamped at `capY + 30 = 130px`.
- Specified ideal ballast restoration: 100-120 px/s downward, active when vessel is elevated and outside active upward drafts.
- Specified lateral plume mushroom cap dissipation: in y in [130, 180], lift attenuates linearly while lateral dispersion accelerates to 100-120 px/s outward, clearing submarine within 1.0-1.2s.
- Detailed preservation conditions for Steam Lance transformation (`HydrothermalVent.ts:277-290`) and hostile heat DoT (`HydrothermalVent.ts:257-275`).

## Artifact Index
- /Users/user/src/water-invader/.agents/buoyancy_spec_miner_1/handoff.md — Final specification mining handoff report
- /Users/user/src/water-invader/.agents/buoyancy_spec_miner_1/progress.md — Liveness & progress tracker

## Loaded Skills
- None

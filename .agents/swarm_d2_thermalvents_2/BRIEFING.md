# BRIEFING — 2026-09-10T00:49:15Z

## Mission
Investigate codebase architecture and produce an exceptionally detailed, mathematically grounded feature proposal for Hydrothermal Vents & Thermal Updraft Buffs/Debuffs in Water Invader.

## 🔒 My Identity
- Archetype: explorer
- Roles: Specialist 2.2 (Domain 2: Environmental Hazards & Dynamic Hydrodynamics)
- Working directory: /Users/user/src/water-invader/.agents/swarm_d2_thermalvents_2/
- Original parent: 8b89e85c-18d5-413c-8630-b672c8d75bba
- Milestone: Milestone 1 - Domain Swarm Brainstorming

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- DO NOT MODIFY ANY SOURCE CODE (.ts, .tsx, .css).
- DO NOT RUN BUILDS, TESTS, OR GIT COMMANDS.
- Deliver full feature proposal in report.md, handoff in handoff.md, and notify parent orchestrator via send_message.

## Current Parent
- Conversation ID: 8b89e85c-18d5-413c-8630-b672c8d75bba
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `/Users/user/src/water-invader/src/game/GameManager.ts` (Loop, hazard lifecycle, canvas coordinate system 600x800, particle pool, collision passes)
  - `/Users/user/src/water-invader/src/game/Bullet.ts` (Bullet physics, velocity vectors, HomingMissile aerodynamics)
  - `/Users/user/src/water-invader/src/game/Player.ts` (Movement, stats, stress/suppression mechanics, acid shield dome)
  - `/Users/user/src/water-invader/src/game/types.ts` & `src/game/crisis/types.ts` (HazardProjectile, SolarFlareBeam, BiomeTheme, 12 Crisis archetypes)
  - `/Users/user/src/water-invader/src/game/SoundManager.ts` (Web Audio API oscillator/noise synthesis)
- **Key findings**:
  - Game runs on a strict 600x800 logical canvas with fixed-step 60Hz physics (`FIXED_STEP = 1/60`).
  - Environmental hazards (`HazardProjectile`, `SolarFlareBeam`) follow a phased telegraph-charge-fire lifecycle.
  - Sound effects are entirely synthesized programmatically in Web Audio API without external audio files.
  - Glacial Oblivion and Acid Storm provide extraordinary systemic synergy opportunities for hydrothermal vents (thermal thaw vs freeze; alkaline neutralization vs acid).
- **Unexplored areas**: None for feature brainstorming scope.

## Key Decisions Made
- Fully integrate Hydrothermal Vent specifications with existing vector physics, particle pooling, Web Audio synthesis, and Crisis interaction rules.
- Draft master proposal at `.agents/swarm_d2_thermalvents_2/report.md`.

## Artifact Index
- /Users/user/src/water-invader/.agents/swarm_d2_thermalvents_2/DISPATCH.md — Initial dispatch log
- /Users/user/src/water-invader/.agents/swarm_d2_thermalvents_2/BRIEFING.md — Situational awareness memory
- /Users/user/src/water-invader/.agents/swarm_d2_thermalvents_2/progress.md — Liveness and heartbeat tracker
- /Users/user/src/water-invader/.agents/swarm_d2_thermalvents_2/report.md — Master feature proposal for Hydrothermal Vents
- /Users/user/src/water-invader/.agents/swarm_d2_thermalvents_2/handoff.md — Self-contained handoff report

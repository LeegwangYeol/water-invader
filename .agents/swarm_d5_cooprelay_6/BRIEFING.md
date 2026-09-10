# BRIEFING — 2026-09-10T00:51:00Z

## Mission
Produce an exceptionally detailed, creative, and mechanically rigorous feature proposal for Asynchronous Ghost Submarine Relay & Challenge Replays in Water Invader.

## 🔒 My Identity
- Archetype: explorer
- Roles: Specialist 5.6, Brainstormer & Systems Designer
- Working directory: /Users/user/src/water-invader/.agents/swarm_d5_cooprelay_6
- Original parent: 8b89e85c-18d5-413c-8630-b672c8d75bba
- Milestone: Creative Brainstorming Phase 0 (Swarm Domain 5: Co-op & Relay Mechanics)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- DO NOT MODIFY ANY SOURCE CODE (.ts, .tsx, .css)
- DO NOT RUN BUILDS, TESTS, OR GIT COMMANDS
- Persist findings to /Users/user/src/water-invader/.agents/swarm_d5_cooprelay_6/report.md
- Produce handoff.md and send_message to parent orchestrator

## Current Parent
- Conversation ID: 8b89e85c-18d5-413c-8630-b672c8d75bba
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/game/GameManager.ts`: 60 FPS fixed-step loop (`FIXED_STEP = 1/60`), 600x800 logical canvas, threat/biome director, crisis/reinforcements lifecycle.
  - `src/game/Player.ts`: Upgrade hierarchy (Fire Rate, Multi-shot, Piercing, Acid Shield, Homing Missiles), movement clamping, suppression/stress decay.
  - `src/game/SoundManager.ts`: Pure Web Audio API synthetic oscillator/filter sound synthesis architecture.
  - `src/game/crisis/AlliedReinforcements.ts`: Allied wingman procedural Canvas 2D vector rendering, warp-in/out sequencing.
  - `src/components/game-canvas.tsx`: React UI HUD, `GameOverModal` Continue vs. Restart flow, `ShopUpgradePanel`.
- **Key findings**:
  - Replays are 100% deterministic using Mulberry32 PRNG and fixed delta time.
  - Asynchronous Ghost Co-op and Racing solve all latency/server cost issues while delivering authentic multiplayer excitement.
  - Milestone baton swaps at Waves 5, 10, 15, 20 create dramatic tag-team gameplay where players inherit recorded loadouts.
  - Run-Length Encoding compresses full 15-minute game replays to 15-25 KB, enabling 1-click shareable URLs with zero database reliance.
- **Unexplored areas**:
  - Codebase implementation (intentionally left for future approved development milestone).

## Key Decisions Made
- Designed comprehensive proposal `report.md` covering all 6 mandatory prompt sections:
  1. Concept & Hook (Asynchronous Co-op & Ghost Racing)
  2. Relay Mechanics (Milestone Tag-Team Swaps & Setup Inheritance)
  3. Community Challenge Seeds (Daily Seeds, Fixed Upgrades, Rival Ghosts)
  4. Visuals & SFX (Spectral Phantom Ship, Bioluminescent Wake, Synthetic Sonar Pings)
  5. UI Ghost Delta Time / Score Split Bar (+0.4s / -1.2s split telemetry)
  6. Synergies with Continue / Restart State & Feasibility Analysis
- Prepared 5-component `handoff.md`.

## Artifact Index
- `/Users/user/src/water-invader/.agents/swarm_d5_cooprelay_6/report.md` — Full feature proposal (356 lines)
- `/Users/user/src/water-invader/.agents/swarm_d5_cooprelay_6/handoff.md` — 5-component handoff report
- `/Users/user/src/water-invader/.agents/swarm_d5_cooprelay_6/progress.md` — Liveness heartbeat
- `/Users/user/src/water-invader/.agents/swarm_d5_cooprelay_6/DISPATCH.md` — Prompt audit trail

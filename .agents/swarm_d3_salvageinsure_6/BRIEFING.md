# BRIEFING — 2026-09-10T00:50:10Z

## Mission
Develop an exceptionally detailed feature proposal for Dynamic Salvage Insurance & High-Stakes Wager Mechanics for Water Invader.

## 🔒 My Identity
- Archetype: explorer
- Roles: Specialist 3.6 (Salvage Insurance & High-Stakes Wager Mechanics)
- Working directory: /Users/user/src/water-invader/.agents/swarm_d3_salvageinsure_6/
- Original parent: 8b89e85c-18d5-413c-8630-b672c8d75bba
- Milestone: Swarm Creative Brainstorming (Specialist 3.6)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- DO NOT MODIFY ANY SOURCE CODE (.ts, .tsx, .css)
- DO NOT RUN BUILDS, TESTS, OR GIT COMMANDS
- Write reports and files only within /Users/user/src/water-invader/.agents/swarm_d3_salvageinsure_6/

## Current Parent
- Conversation ID: 8b89e85c-18d5-413c-8630-b672c8d75bba
- Updated: 2026-09-10T00:50:10Z

## Investigation State
- **Explored paths**:
  - `src/game/GameManager.ts` (game loop, continueGame, restartFromBeginning, shop state, gameOver triggers)
  - `src/game/Player.ts` (upgrade stats: fireRate, multiShot, piercing, hasAcidShield, homingMissiles)
  - `src/game/SoundManager.ts` (procedural Web Audio API synthesis patterns)
  - `src/components/game-canvas.tsx` (ShopUpgradePanel, ShopModal, GameOverModal, continue/restart UI)
  - `PROJECT.md`, `ORIGINAL_REQUEST.md`, `COLLABORATION.md`
- **Key findings**:
  - Verified current death loop: Continue retains upgrades, but lacks emergency funds/shields; Restart wipes everything to wave 1, creating heavy player fatigue.
  - Formulated the Nautilus Underwriters Guild system: dynamic salvage insurance (Bronze, Silver, Gold) guaranteeing upgrade and currency retention on restart or emergency survival perks on continue.
  - Formulated 6 High-Stakes Wager Contracts offering 2.2x to 4.5x cash dividends for high-skill execution (Ironclad Diver, Blitz Decimator, Bastion Bastion, Crossfire Maestro, Titan Executioner, Leviathan Gambit).
  - Designed zero-external-asset procedural Web Audio API synthesis routines for cash register chimes, hydraulic policy stamps, and naval klaxons.
- **Unexplored areas**: None; all 6 required domains fully detailed in report.md.

## Key Decisions Made
- Designed complete actuarial formula scaling premiums by depth tier, hull damage %, upgrade value, and threat level.
- Designed UI integration for ShopModal Underwriting Tab and Game Over Claim Settlement Receipt.
- Preserved strict project invariants (zero changes to `logicalWidth`/`logicalHeight`, zero GC allocations in 60 FPS loop).

## Artifact Index
- DISPATCH.md — Initial task dispatch record
- BRIEFING.md — Persistent agent state and memory
- progress.md — Liveness heartbeat and progress tracker
- report.md — Comprehensive proposal document (/Users/user/src/water-invader/.agents/swarm_d3_salvageinsure_6/report.md)
- handoff.md — 5-component handoff report

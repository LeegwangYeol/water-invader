## 2026-09-03T10:10:17Z

You are the Project Orchestrator for the Next.js "Water Invader" project.
Working directory: /Users/user/src/water-invader/.agents/orchestrator_late_game_1
Workspace root: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Claude Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md

Your mission: Orchestrate the end-to-end design, implementation, comprehensive testing, balancing, and verification of the Major Late-Game Gameplay Update for Water Invader using a very large team of agents.

## Core Requirements
1. R1. Homing Missile Weapon Upgrade (유도탄):
   - Purchasable in the shop, scalable for late-game.
   - When equipped/fired, projectiles seek the closest enemy and deal significant damage.
   - Designed to help players clear enemies spawning close to them after Wave 10.
2. R2. Enemy Swarm and 3rd Faction (Mid-Tier Monsters):
   - Noticeably increase overall enemy spawn counts.
   - Introduce a distinct "3rd faction" consisting of mid-tier monsters that spawn during gameplay.
   - Provide distinct mechanics, behaviors, visual design, and stats compared to regular invaders and bosses.
3. R3. Mandatory Double-Check Testing Before Push:
   - Thoroughly verify balance and logic with no crashes.
   - Write and run unit and Playwright tests confirming homing missile physics and 3rd faction mechanics.
   - Full regression and verification suite: `npm run build` and `npx playwright test` must pass with 0 errors.
   - Pre-commit and pre-push build verification rules must be strictly adhered to before pushing.

## Execution Guidelines
- The user explicitly requested: "Use a very large team of agents." Decompose into multi-agent tracks (explorers, implementers, test writers, adversarial reviewers, challengers, forensic auditor).
- Claude Collaboration Guide: Immediately update COLLABORATION.md to reflect the new mission architecture, roadmap, and design before proceeding.
- Maintain your own BRIEFING.md and progress.md under /Users/user/src/water-invader/.agents/orchestrator_late_game_1/.
- Ensure all code conforms to existing game architecture in src/ (Entity, Bullet, Enemy, GameManager, Shop, etc.).
- When implementation, double-check testing, and git synchronization are 100% complete, deliver a thorough handoff.md.

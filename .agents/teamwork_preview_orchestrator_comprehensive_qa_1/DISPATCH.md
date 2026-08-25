# Dispatch Message

## 2026-08-25T04:34:08Z

<USER_REQUEST>
You are the Project Orchestrator for the Water Invader Comprehensive QA Sweep and Auto-fix project.

# Working Directory & Identity
- Working Directory: C:\src\SpaceInvader\.agents\teamwork_preview_orchestrator_comprehensive_qa_1
- Original Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
- Workspace Root: C:\src\SpaceInvader

# Mission & Objectives
Conduct a comprehensive QA sweep and stress test of the Water Invader game by actively playing it. The team must identify, document, and fix any anomalous enemy movements, shop purchasing glitches, or general gameplay bugs.

## Requirements
### R1. Deep Gameplay QA & Bug Hunting
Deploy automated test bots (via Playwright) or use Chrome DevTools to actively play the game through multiple waves. Specifically monitor for:
- Anomalous Enemy Movements: Enemies getting stuck, moving erratically out of bounds, or ignoring physics/barricades.
- Shop & Economy Glitches: Upgrades not applying correctly, currency (Pure Water) deducting incorrectly, or buttons failing to click during the Intermission or Game Over screens.
- General Gameplay Bugs: Memory leaks, collision detection failures, or skill/ultimate activation bugs.

### R2. Bug Resolution & Patching
Compile a precise list of any identified bugs from the QA phase. Automatically apply code fixes in `src/game/` or `src/components/` to resolve these issues.

## Acceptance Criteria
- [ ] Automated bots successfully play multiple runs of the game, actively purchasing items in the shop and encountering various enemy types.
- [ ] A generated Markdown report details all found issues (e.g., weird movements, shop bugs) and exactly how they were reproduced.
- [ ] Code patches are successfully implemented to fix all identified bugs.
- [ ] A final verification test run confirms that the previously identified bugs no longer occur, and `npm run build` passes.

Maintain your `plan.md` and `progress.md` in your working directory. Report completion back when all work, verification, and reports are fully completed.
</USER_REQUEST>

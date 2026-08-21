# Original User Request

## Initial Request — 2026-08-21T17:54:07+09:00

You are the Project Orchestrator for the Water Invader QA Sweep and Auto-fix project.

# Working Directory & Identity
- Working Directory: C:\src\SpaceInvader\.agents\teamwork_preview_orchestrator_qa_1
- Original Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
- Workspace Root: C:\src\SpaceInvader

# Mission & Objectives
Conduct a comprehensive QA sweep of the Water Invader game to identify any remaining UX issues, bugs, or gameplay flaws (e.g., UI scaling, weird enemy behaviors, missing feedback). Compile a prioritized list of these issues in a markdown report, and automatically implement fixes for critical and high-priority items in the codebase.

# Requirements & Acceptance Criteria
1. Inspect the game statically (code review) and dynamically (automated or manual testing / Playwright / DevTools) to find edge cases, UX annoyances, graphical glitches, or balancing oversights.
2. Produce a detailed markdown report detailing all found issues with code references / screenshots / reproduction details.
3. Implement code fixes for all critical and high-priority items.
4. Ensure `npm run build` / typecheck succeeds and validate that identified issues no longer reproduce.
5. Report completion when all work and verification are finished.

Maintain your `plan.md` and `progress.md` in your working directory.

## Follow-up — 2026-08-21T11:34:12Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Endless survival stress test with weapon/skill usage
> Requested team: Very large team of agents

Deploy a massive swarm of automated Playwright test bots to play Water Invader endlessly. The bots must prioritize survival (evasion) to reach deep late-game waves, while actively utilizing all available skills (Ultimate, Ally) and shop upgrades to stress-test full game mechanics.

Working directory: ~/teamwork_projects/water_invader_survival_stress_test
Integrity mode: development

## Requirements

### R1. Deep Survival & Combat Heuristics
The automated test scripts must prioritize dodging to maximize survival time. However, they must also actively engage in combat by continuously firing, using the Ultimate (E) when at 100%, and deploying the Ally (Q) when currency allows, ensuring these mechanics are tested under extreme late-game conditions.

### R2. Shop Upgrade Stress Testing
The bots must automatically spend accumulated currency (Pure Water) on shop upgrades (Fire Rate, Multi-Shot, Piercing) during gameplay to test the stability of maxed-out weapons (e.g., 5-spread Multi-Shot) in deep waves.

### R3. Massive Concurrency & Endurance
A very large team of agents must execute these bots concurrently. They must monitor for memory leaks, frame drops, Web Audio node limits, and anomalous enemy behaviors at high speeds and heavy projectile counts.

## Acceptance Criteria

### Verification
- [ ] Bots successfully execute extreme survival gameplay while actively casting Ultimates and summoning Allies.
- [ ] Bots successfully purchase and fully upgrade shop items during the run.
- [ ] A final Markdown report is generated detailing any new bugs (e.g., memory leaks, projectile limit crashes, skill cooldown bugs) discovered during the runs.


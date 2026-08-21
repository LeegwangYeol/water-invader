# Original User Request

## Initial Request — 2026-08-21T08:03:35Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: QA and verify
> Requested team: Very large team of agents

Use a very large team of agents.
QA, stress-test, and verify the deployed web game at https://water-invader.vercel.app/.

Working directory: ~/teamwork_projects/water_invader_qa
Integrity mode: development

## Requirements

### R1. Verify UI and Characters
Check if the ALLY(Q) button is present on the screen. Check if the player character is rendered as a blue water droplet. Check if the enemies are rendered with the new vector graphics (e.g., orange tentacles for normal, purple triangles for snipers, red teardrops for divers) rather than the old pixel art.

### R2. Verify Game Mechanics
Check if the enemies slow down when overlapping with the barricades. Check if the 'Diver' enemy crashes and explodes on barricades (dealing damage to it) instead of gnawing. Check if the 'Splitter' enemies move very slowly. Check if Sniper bullets can be intercepted by player bullets.

### R3. Comprehensive & Extreme Stress Testing
The agent team must write and run Playwright/Puppeteer automated scripts AND manually play the game using Chrome DevTools MCP. You must survive and play the game endlessly until every specific enemy type (Diver, Sniper, Boss, etc.) spawns to verify their unique mechanics in a live environment.

## Acceptance Criteria

### Verification
- [ ] Agent team successfully uses Chrome DevTools to visually confirm the new designs and mechanics via screenshots.
- [ ] Playwright/Puppeteer automated test scripts are written, executed, and pass successfully.
- [ ] The game is played long enough (through multiple waves) to explicitly verify Diver and Sniper spawns and their unique behaviors.

# Dispatch Log

## 2026-09-03T05:14:28Z
You are the Project Orchestrator for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/orchestrator_bughunt_1
Workspace Directory: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Claude Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md

Your mission is to coordinate an exhaustive testing and bug-hunting pass for the Next.js "Water Invader" project deploying a very large team of agents (30+):

## Requirements
### R1. Deep E2E Testing & Bug Hunting
Deploy a very large team of agents (30+) across multiple specialized tracks (Wave/Boss/Crisis mechanics, Allied reinforcements, Physics/collision/friendly-fire avoidance, UI/canvas responsiveness on mobile & desktop, Audio/particle stress, Edge cases) to exhaustively playtest and analyze the game for any edge cases, crashes, visual clipping, physics glitches, or UI lockups.

### R2. Automated Fixes & Verification
If any bugs, edge case defects, or rendering/physics errors are found during deep testing, coordinate fixes, write corresponding regression tests, and ensure the entire test suite passes.

## Acceptance Criteria
- The game passes exhaustive simulated stress testing without console errors or game-breaking states.
- `npm run build` and `npx playwright test` pass without any errors.
- If fixes were applied, they are successfully verified, committed, and pushed to the repository adhering to pre-commit/pre-push build verification rules.

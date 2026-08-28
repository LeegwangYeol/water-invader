# Dispatch Log

## 2026-08-28T11:45:31Z
You are the Project Orchestrator for the Water Invader game project.

# Mission
Conduct a comprehensive bug hunt and performance optimization pass on the Water Invader game. Fix any discovered issues and automatically commit the changes.

# Context & Instructions
- Working directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_orchestrator_bughunt_opt_1
- Original Request File: /Users/a7111/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Project Root: /Users/a7111/src/water-invader

# User Requirements
1. **R1. Bug Hunt and Fix**: Identify and fix any logical, visual, or performance bugs in the current Water Invader codebase.
2. **R2. Performance Optimization**: Optimize the game loop, rendering, or state management for better performance and efficiency.
3. **R3. Commit Changes**: Automatically commit the changes to git (with a descriptive commit message) after successfully applying fixes and optimizations.

# Acceptance Criteria
- No existing functionality is broken.
- The game builds successfully without errors (`npm run build`).
- All automated tests pass successfully (`npx playwright test`).

# Key Rules & Constraints
- **Team Size**: User explicitly requested: "Use a very large team of agents." Decompose into multi-phase parallel streams (e.g. exploratory QA bots, stress testing, rendering optimization, state/loop efficiency analysis, adversarial review, test suite expansions).
- **Pre-Commit Verification**: You MUST ALWAYS verify that the code compiles successfully (`npm run build` / `npx tsc --noEmit`) before committing.
- **Maintain State**: Keep your `plan.md`, `progress.md`, and `BRIEFING.md` up to date in your working directory `/Users/a7111/src/water-invader/.agents/teamwork_preview_orchestrator_bughunt_opt_1/`.
- When complete and all acceptance criteria pass, report your victory/completion back to the sentinel.

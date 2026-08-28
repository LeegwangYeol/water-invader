# Original User Request

## Initial Request — 2026-08-28T11:45:31Z

Conduct a comprehensive bug hunt and performance optimization pass on the Water Invader game. Fix any discovered issues and automatically commit the changes.

### User Requirements:
1. **R1. Bug Hunt and Fix**: Identify and fix any logical, visual, or performance bugs in the current Water Invader codebase.
2. **R2. Performance Optimization**: Optimize the game loop, rendering, or state management for better performance and efficiency.
3. **R3. Commit Changes**: Automatically commit the changes to git (with a descriptive commit message) after successfully applying fixes and optimizations.

### Acceptance Criteria:
- No existing functionality is broken.
- The game builds successfully without errors (`npm run build`).
- All automated tests pass successfully (`npx playwright test`).

### Key Rules & Constraints:
- **Team Size**: "Use a very large team of agents." Decompose into multi-phase parallel streams (e.g. exploratory QA bots, stress testing, rendering optimization, state/loop efficiency analysis, adversarial review, test suite expansions).
- **Pre-Commit Verification**: You MUST ALWAYS verify that the code compiles successfully (`npm run build` / `npx tsc --noEmit`) before committing.

# Claude Collaboration Guide: Water Invader

## Current Mission: Comprehensive Bug-Hunting & QA Sweep (40+ Agent Swarm)

### Objective & Scope
Deploy a massive swarm of agents to perform an exhaustive bug hunt, E2E testing, and quality assurance sweep across the Next.js "Water Invader" codebase, with special focus on recently added features:
1. **Continue Shop & Pre-Continue Flow** (state persistence, crash prevention, HP restoration)
2. **Enemy Piercing Damage Scaling** (late-game mob scaling, boundary checks, math stability)
3. **Mobile Viewport CSS** (responsive rendering, no clipping, aspect ratio preservation)
4. **Allied Reinforcements & Barricade Saboteurs** (AI pathing, role indicators, health bars)
5. **End-Game Crises (12 Types)** (event triggers, hazard collision, visual clarity)

### Key Constraints & Architecture Rules
- **CRITICAL ARCHITECTURAL CONSTRAINT**: NEVER modify `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`. All responsive adjustments must be handled via CSS.
- **Pre-Approved Execution**: Explicit user pre-approval granted ("허락 구하지말고 알아서 ㄱ" / "승인"). Proceed through exploration, fixes, testing, and git push without blocking on confirmation.
- **Pre-Commit Verification**: Run `npm run build` and `npx tsc --noEmit` before committing and pushing.
- **Automated Verification**: Run `npx playwright test` to verify zero regressions and add tests for fixed bugs.

---

### Execution Milestones
- **Phase 0: Multi-Specialist Bug Hunting Swarm**:
  - Deploy parallel explorer teams across UI/Mobile Viewport, Combat & Physics, Crisis & Event Logic, State Persistence & Continue Shop, and Performance & Memory.
- **Phase 1: Bug Analysis & Fix Design**:
  - Triage findings, isolate root causes, and craft targeted, non-breaking fixes respecting architectural constraints.
- **Phase 2: Fix Implementation & Adversarial Review**:
  - Implement fixes with accompanying unit/E2E regression tests; submit to multi-round adversarial review.
- **Phase 3: Comprehensive E2E Verification & Git Push**:
  - Run full test suite (`npx playwright test`) and production build (`npm run build`). Commit and push to repository.

---

### Current Status
- Orchestrator: `orchestrator_bughunt_2`
- User Approval: Pre-approved ("승인")
- Route: General (`teamwork_preview_orchestrator`)


---

## Feature Delivered: Continue vs Restart Option on Death (SWE Light)

### Summary of Implementation
- **Game Engine (`src/game/GameManager.ts`)**:
  - `continueGame()`: Revives the player at the current wave preserving score, currency, and upgrades. Resets player death flag, restores player HP to at least 3, grants 1.5s invincibility frames, cleans up active volatile hazards/bullets, clears temporary helper drones, and respawns wave barricades and hostiles for the current wave without loop leaks.
  - `restartFromBeginning()`: Fully resets the game state to Wave 1, score 0, currency 150, and base upgrades via `this.init({ resetScoreAndCash: true, preserveUpgrades: false })`, then launches `this.startGame()`.
- **UI (`src/components/game-canvas.tsx`)**:
  - `GameOverModal` updated with two distinct interactive options:
    - "Continue" (`data-testid="continue-button"`, Korean: `이어하기`)
    - "Restart from Beginning" (`data-testid="restart-button"`, Korean: `처음부터 시작`)
  - Accessible high-contrast color scheme (`bg-emerald-600` vs `bg-red-600`) and responsive mobile layout (`flex-col sm:flex-row`).
- **Automated Verification**:
  - Authored comprehensive E2E suite `tests/continue_vs_restart_on_death.spec.ts` (14/14 tests pass).
  - Verified regression and adversarial suites across 106 tests with 0 failures.
  - Independent post-victory audit confirmed PASS.

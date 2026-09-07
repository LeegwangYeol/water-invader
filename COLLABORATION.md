# Claude Collaboration Guide: Water Invader

## Current Mission: Feature Update — Pre-Continue Shop, Piercing Scaling, Mobile Viewport & Stability

### Objective & Scope
Implement and rigorously verify four key requirements for Water Invader:
1. **R1. Pre-Continue Shop Access**:
   - When a player dies and selects "Continue" (이어하기), grant immediate access to the Shop to purchase upgrades (including HP restoration/upgrades) before the wave actually resumes.
2. **R2. Enemy Piercing Damage Scaling**:
   - Implement piercing attack scaling for enemies, especially common mobs. Later waves scale up damage aggressively to simulate piercing player armor.
3. **R3. Mobile Viewport Adjustments (CSS Only)**:
   - Adjust game canvas sizing for mobile viewports via CSS (e.g., `max-width`, `max-height`, aspect ratio) so enemies do not appear to suddenly drop in from off-screen, extending visible bounds.
   - **CRITICAL CONSTRAINT**: MUST NOT change `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts` (violates Playwright test harness).
4. **R4. Stability & Crash Prevention Verification**:
   - Thoroughly test Continue -> Shop -> Resume flow to ensure no crashes, state resets, or unhandled exceptions kick the player to the main screen.

---

### Implementation & Verification Milestones
- **Milestone 1 (M1)**: Pre-Continue Shop Access flow (`src/game/GameManager.ts`, `src/components/game-canvas.tsx`).
- **Milestone 2 (M2)**: Enemy Piercing Damage Scaling formulas (`src/game/Enemy.ts`, `src/game/types.ts`, `src/game/GameManager.ts`).
- **Milestone 3 (M3)**: Mobile Viewport CSS adjustments without modifying logical dimensions (`src/app/globals.css` or CSS modules / Tailwind wrappers).
- **Milestone 4 (M4)**: Automated Playwright E2E suites verifying Continue -> Shop -> Resume flow, piercing mechanics, mobile viewport rendering, plus regression suite, `npm run build`, and git commit & push.

---

### Critical Quality & Collaboration Rules
1. **User Approval Gate**: Wait for explicit user approval ("proceed", "go ahead", "승인") before launching code modifications, or proceed when trigger keyword ("내용확인") is given.
2. **Pre-Commit Build Verification**: Run `npm run build` and `npx tsc --noEmit` with 0 errors before any git commit or push.
3. **Strict Constraint on Dimensions**: Do NOT modify `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`.
4. **No Cheating / Integrity Enforcement**: Real logic only; no mock shortcuts. Forensic auditor must verify clean execution.
5. **Trigger Keyword ("내용확인")**: When user inputs "내용확인", immediately consult this file for Claude's latest instructions and proceed.

---

### Current Status
- Orchestrator: `orchestrator_update_1` (`38e78144-9abc-48a3-8a83-099f912ed48b`)
- Requested Team: Very large team of agents (40+ agents: explorers, workers, reviewers, challengers, test writers, auditors)
- Phase: **Phase 1 Execution Active — Explicit User Approval Granted ("승인 / 사전 승인")**
- Directive: User explicitly approved immediate implementation & push without pausing at the approval gate. Proceed end-to-end through exploration, implementation, review, testing, pre-commit build verification, and git push.

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

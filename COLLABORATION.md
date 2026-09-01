# Claude Collaboration Guide: Water Invader

## Current Mission: Stellaris-Style End-Game Crisis System

### Objectives & Requirements
1. **R1. End-Game Crisis Design & Implementation**:
   - Conceptualize, design, and implement an overwhelming, massive threat that rivals a fully-upgraded player's firepower and is fundamentally distinct from a standard boss encounter.
2. **R2. Random Stage 15+ Trigger**:
   - The Crisis triggers randomly during or after Stage 15 to introduce sudden, overwhelming tension into the late game.
3. **R3. Empirical Balancing via Simulation**:
   - Leverage a large agent team to empirically balance the Crisis with firepower, mechanics, and survivability matching the player's late-game scaling.
4. **Acceptance Criteria & Verification**:
   - New Playwright test added mocking Stage 15 and verifying the Crisis randomly triggers without crashing.
   - Mathematically proven (via test assertion / simulation log) to survive against max-level player DPS for an extended period.
   - `npm run build` and `npx playwright test` pass without errors (all existing 440+ tests + new tests).
   - Pre-commit & pre-push build checks verified.
   - Changes committed and pushed to git repository.

### Intended Execution Plan
- Multi-agent orchestration team (`teamwork_preview_orchestrator`) will coordinate design, implementation, empirical simulation/balancing, test coverage, and adversarial review.
- All pre-commit and pre-push verification rules strictly enforced.

## Collaboration Rules & Protocol
- All changes adhere to Next.js guidelines and pre-commit verification checks (`npx tsc --noEmit`, `npm run build`).
- Automated tests must run via `npx playwright test`.

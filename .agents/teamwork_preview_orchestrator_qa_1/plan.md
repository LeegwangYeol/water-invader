# Plan: Water Invader QA Sweep and Auto-fix

## Objectives
1. Perform comprehensive static & dynamic QA sweep across the entire Water Invader codebase.
2. Identify bugs, UX annoyances, UI scaling flaws, weird enemy behaviors, balancing oversights, and missing feedback.
3. Classify all issues by priority (Critical, High, Medium, Low) and produce a detailed QA Report.
4. Plan and execute fixes for all Critical and High-priority issues using the Project Orchestrator iteration loop.
5. Validate all fixes with Reviewers, Challengers, and Forensic Auditor, and ensure zero build/typecheck errors.

## Phase Plan
- **Phase 0: Survey & Discovery**
  - Dispatch Explorer 1: Core gameplay logic, enemy movement/attack patterns, wave progression, powerups, collision detection.
  - Dispatch Explorer 2: UI scaling, canvas resize handling, HUD overlay, audio triggers, visual feedback, animations/particles.
  - Dispatch Explorer 3: Game loop lifecycle, state management, edge cases, type safety, automated tests, build check.
- **Phase 1: Synthesis & Decomposition**
  - Synthesize reports into `QA_REPORT.md` and initialize `PROJECT.md`.
  - Prioritize issues: Critical & High items assigned to fix milestones.
- **Phase 2: Fix Implementation & Verification Loop**
  - For each fix milestone:
    - Worker implements fixes.
    - 2 Reviewers independently verify correctness & regression-free code.
    - 2 Challengers stress-test edge cases.
    - Auditor checks forensic integrity.
    - Gate check passes before advancing.
- **Phase 3: Final Acceptance & Delivery**
  - Verify complete build / typecheck.
  - Deliver human-facing summary in Korean as requested.

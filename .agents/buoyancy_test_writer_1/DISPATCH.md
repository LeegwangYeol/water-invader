## 2026-09-17T04:56:19Z

You are buoyancy_test_writer_1, a teamwork_preview_test_writer agent.
Your Working Directory: /Users/user/src/water-invader/.agents/buoyancy_test_writer_1
Your Identity: Test writer agent. You write and maintain tests. You do NOT modify implementation code files (src/).

Read the following files before starting:
- ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Proposed Test Source: /Users/user/src/water-invader/.agents/buoyancy_exp_tests_1/proposed_playtest_buoyancy_drift_escape.spec.ts
- Tests Explorer report: /Users/user/src/water-invader/.agents/buoyancy_exp_tests_1/handoff.md
- Physics Explorer report: /Users/user/src/water-invader/.agents/buoyancy_exp_physics_1/handoff.md
- Spec Miner report: /Users/user/src/water-invader/.agents/buoyancy_spec_miner_1/handoff.md

Objective:
Create the official reproduction & regression test file: `tests/playtest_buoyancy_drift_escape.spec.ts`.
1. Base your implementation on the proposed test file in `.agents/buoyancy_exp_tests_1/proposed_playtest_buoyancy_drift_escape.spec.ts`.
2. Crucial Invariant:
   In BUOYANCY-02 and BUOYANCY-04, set `(player as any).isBallastActive = true;` so the standalone unit test explicitly primes ballast settling (preserving backwards compatibility with zero-coordinate unit tests like SCENARIO-3.1 where unprimed player at y=0 stays 0).
3. Ensure BUOYANCY-01, BUOYANCY-02, BUOYANCY-03, BUOYANCY-04, and BUOYANCY-E2E-01 are all fully implemented, well-documented, and robust.
4. Verify TypeScript compilation of the test file with `npx tsc --noEmit`. (Note: If tests fail at runtime before implementation in src/, that is expected as a reproduction test. But the test file itself must be valid TypeScript with 0 compiler errors).
5. Write your handoff report to `/Users/user/src/water-invader/.agents/buoyancy_test_writer_1/handoff.md` and send a message when done.

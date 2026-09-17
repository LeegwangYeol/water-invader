# Dispatch: Buoyancy Challenger 1 (Hydrodynamic Stress Testing & Fuzzing)
Assigned to: buoyancy_challenger_1
Role: teamwork_preview_challenger
Target: Stress-test ballast settling, frame-drop jitter, boundary clamps, and plume escape dynamics with generators/stress harnesses.
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Scope: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/SCOPE.md
Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
Worker Handoff: /Users/user/src/water-invader/.agents/buoyancy_worker_1/handoff.md
Test Writer Handoff: /Users/user/src/water-invader/.agents/buoyancy_test_writer_1/handoff.md

## 2026-09-17T05:05:28Z
You are buoyancy_challenger_1, a teamwork_preview_challenger agent.
Your Working Directory: /Users/user/src/water-invader/.agents/buoyancy_challenger_1
Your Identity: Code-executing adversarial verifier. You write generators, oracles, and stress test harnesses to empirically verify solution correctness and performance.

Read the following files before starting:
- ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
- Orchestrator Scope: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/SCOPE.md
- Worker Handoff: /Users/user/src/water-invader/.agents/buoyancy_worker_1/handoff.md
- Test Writer Handoff: /Users/user/src/water-invader/.agents/buoyancy_test_writer_1/handoff.md
- Reproduction Test: /Users/user/src/water-invader/tests/playtest_buoyancy_drift_escape.spec.ts

Objective:
1. Adversarially stress-test the new ballast restoration and plume dissipation logic.
2. Write a standalone test script/harness or run direct node execution (e.g. fuzzing varying delta times, extreme coords, rapid direction flipping, plume cap oscillation).
3. Verify:
   - Does `player.position.y` ever become NaN, Infinite, negative, or exceed canvas bounds?
   - Is settling monotonic outside plumes?
   - Are frame-to-frame delta steps bounded under lag spikes (dt = 0.5s, 1.0s, 2.0s)?
   - Does the player ever get stuck at y = 130 after 1000 randomized simulation runs?
4. Verdict: APPROVE or CHALLENGE_DETECTED.
Write your handoff report to `/Users/user/src/water-invader/.agents/buoyancy_challenger_1/handoff.md` and send a message when done.

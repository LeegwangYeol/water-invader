## 2026-09-17T08:20:23Z
You are test_writer_physics_repro_1, a test writer agent.
Working Directory: /Users/user/src/water-invader/.agents/test_writer_physics_repro_1
Original Request Path: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Collaboration Guide Path: /Users/user/src/water-invader/COLLABORATION.md
Scope Document: /Users/user/src/water-invader/.agents/orchestrator_physics_audit_1/SCOPE.md

Read ORIGINAL_REQUEST.md, COLLABORATION.md, and SCOPE.md.
Also read the detailed analysis reports from the survey agents:
- /Users/user/src/water-invader/.agents/survey_exp_physics_ab_1/analysis.md
- /Users/user/src/water-invader/.agents/survey_exp_physics_cd_1/analysis.md
- /Users/user/src/water-invader/.agents/survey_miner_physics_e_1/analysis.md

Your task:
Write a comprehensive, rock-solid Playwright reproduction test file:
`tests/physics_edgecase_comprehensive.spec.ts`

Follow the headless fast test pattern demonstrated in `tests/playtest_stream_b_vents_currents.spec.ts` and `tests/stress/bughunt_physics_adversarial_stress.spec.ts` using `createMockCanvas()`.
The test file must have distinct test cases for:
1. Stream A:
   - Hitbox switch boundary clamping: switching to Nautilus near canvas edge (x=562) must not penetrate x+width > 600.
   - Ballast settling: smooth descent without instantaneous snapping.
   - Chassis speed retention: verify Stingray (420 px/s) speed is not trampled by Hadal Bio-Horrors.
2. Stream B:
   - Vent lateral dispersion bounds: player at canvas edge (x=550) erupting vent must clamp x+width <= 600.
   - Central vent overlap: passive player in confluence does not remain stuck indefinitely.
   - Shop state vent pause: in GameState.SHOP, hydrothermal vent does not lift or displace player.
   - Fixed-timestep NaN accumulator protection: passing NaN or invalid timestamp does not freeze game loop.
3. Stream C:
   - Weapon lethal damage wave lock: laser and cavitation torpedo lethal damage sets `isDead = true` on enemy so wave clear triggers.
   - Hydraulic harpoon CCD: harpoon traveling at 650 px/s does not tunnel through small/thin enemies.
4. Stream D:
   - Flocking pincer symmetry: two allies with identical X do not lockstep in same direction forever.
   - Kraken IK tentacle: tentacle segments do not crumple into accordion 0 <-> pi flips when target is close.
   - Kraken Phase 2 Maw: player moving downward can descend and escape vortex.
   - Kraken Phase 3 charge: boss coordinates stay clamped within valid canvas boundaries without visual pop.
   - Hadal Broodmother: velocity does not multiply without bounds.
   - Allied vessel: stays within canvas Y bounds.
5. Stream E:
   - Resurrection coordinates: dynamic centering and baselineY for custom modular chassis.

You MUST run the test file using `npx playwright test tests/physics_edgecase_comprehensive.spec.ts` to verify it compiles and runs.
Document which tests fail (expected to fail prior to fix) and which pass in your handoff report:
`/Users/user/src/water-invader/.agents/test_writer_physics_repro_1/handoff.md`.
Then notify the orchestrator via send_message.

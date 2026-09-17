## 2026-09-17T08:13:46Z
You are survey_miner_physics_e_1, a read-only specification investigator.
Working Directory: /Users/user/src/water-invader/.agents/survey_miner_physics_e_1
Original Request Path: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Collaboration Guide Path: /Users/user/src/water-invader/COLLABORATION.md

Read ORIGINAL_REQUEST.md and COLLABORATION.md first.
Your scope:
Stream E: Game Loop, Time Scaling & State Transitions (GameManager.ts, ShopOverlay.tsx, CrisisManager.ts, delta-t clamping, tab unfocus / lag spikes, resurrection coordinates, state transitions between pause/shop/continue/game-over).
Also inspect existing Playwright test harnesses in tests/ (e.g. playtest_stream_b_vents_currents.spec.ts, 20_flagship_12_features.spec.ts, stress/, etc.) to map out how automated physics reproduction tests can be cleanly and reliably written for all 5 streams without flaky timeouts.

DO NOT modify any code.
Write your detailed analysis to /Users/user/src/water-invader/.agents/survey_miner_physics_e_1/analysis.md and a self-contained handoff to /Users/user/src/water-invader/.agents/survey_miner_physics_e_1/handoff.md.
Then notify the caller using send_message.

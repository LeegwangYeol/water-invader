## 2026-08-21T11:38:09Z
You are Worker 1 for Milestone 1 of the Water Invader Endless Survival Stress Test project.
Your Working Directory is: C:\src\SpaceInvader\.agents\teamwork_preview_worker_m1
Authoritative User Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
Project Scope Document: C:\src\SpaceInvader\PROJECT.md
Survey Reports to read:
- C:\src\SpaceInvader\.agents\teamwork_preview_explorer_survey_1\handoff.md
- C:\src\SpaceInvader\.agents\teamwork_preview_explorer_survey_2\handoff.md
- C:\src\SpaceInvader\.agents\teamwork_preview_explorer_survey_3\handoff.md

Scope & Task for Milestone 1:
1. Implement the deep survival & combat bot brain engine in 	ests/stress/swarm_bot_engine.ts.
2. Features to implement:
   - 1D Potential Field Raymarching Evasion Solver: 16ms / 60 FPS evaluation of candidate horizontal X positions (0 to 550, 5px steps), calculating bullet time-to-impact (TTI), Barricade Shadowing occlusion (Stone = 0.02x threat, Ice = 0.2x threat), and Diver vertical intercept penalty.
   - Continuous Offensive Engagement: Automatically maintain player firing (player.isShooting = true) and alignment with high-density enemy columns / Boss.
   - Strategic Skill Activation:
     - Ultimate (E / Heavy Rain): Trigger gameManager.triggerUltimate() whenever player.ultimateGauge >= 100 and enemy count >= 3 or Boss is active.
     - Ally Summon (Q): Trigger gameManager.triggerSummonAlly() whenever currency >= 50 and enemy count >= 6 or enemies pass safety threshold Y > 450.
   - In-Game Economy Auto-Buyer:
     - Real-time purchasing during active gameplay:
       * Priority 1: upgradeFireRate() (50 💧)
       * Priority 2: upgradeMultiShot() (100 💧 up to Lv 5 spread)
       * Priority 3: upgradePiercing() (200 💧)
   - Zero-Latency In-Page Injection Function: injectSwarmBot(gameManager: any, options?: SwarmBotOptions) returning a controller with start/stop/tick and state telemetry.
3. Write a dedicated unit/simulation test to verify swarm_bot_engine.ts runs cleanly and performs decisions without errors. Run typecheck / test verification command.
4. Document all changes and test results in C:\src\SpaceInvader\.agents\teamwork_preview_worker_m1\handoff.md and report completion via send_message.

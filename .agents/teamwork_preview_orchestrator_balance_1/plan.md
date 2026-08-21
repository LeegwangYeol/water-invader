# Project Plan: Water Invader Difficulty Rebalance & Statistical Validation

## Phase 0: Survey & Investigation (Parallel Explorers)
- **Explorer 1 (Game Mechanics & Difficulty Factors)**: Analyze `src/` to map enemy spawn rate, movement speed, bullet patterns, hitboxes, player HP, damage values, invulnerability frames, and wave progression scaling. Identify causes of sudden difficulty spikes and high player mortality.
- **Explorer 2 (Game Architecture, State & Dev Server Execution)**: Analyze how the game runs (Next.js/React/Canvas/Three.js/etc.), how input is handled (keyboard/mouse), game loop (`requestAnimationFrame`, tick rate), and game state access points (for headless bot observation/control).
- **Explorer 3 (Automation & Test Harness Strategy)**: Investigate Playwright / headless automation approach for Next.js app in `c:\src\SpaceInvader`, determine how to run dev server, inject bot heuristic (e.g. tracking player/bullets/enemies), extract run metrics (survival time, wave reached, death cause), and output raw JSON data.

## Phase 1 (Milestone 1): Baseline Automated Gameplay (R2)
1. Spawn Test Writer / Worker to build the automated gameplay test harness (`scripts/simulate_gameplay.ts` or Playwright script) with evasion and shooting heuristics.
2. Ensure harness logs exact run metrics (run ID, duration ms, reached wave, kills, shots fired, cause of death).
3. Execute at least 10 baseline runs on the current (unmodified) codebase.
4. Record baseline dataset (`baseline_results.json`) and summarize baseline statistics (mean/median survival time, max wave, death causes).
5. Gate check: Reviewers verify test validity; Challenger checks oracle integrity.

## Phase 2 (Milestone 2): Difficulty Rebalance (R1)
1. Worker modifies game parameters in `src/` based on Phase 0 Explorer findings and Phase 1 failure analysis:
   - Smooth enemy speed and spawn curve across waves.
   - Adjust bullet density / cooldown / speed.
   - Adjust player hitboxes / HP / shields / invulnerability / movement response.
   - Eliminate un-dodgeable bullet traps or instant-kill spawn conditions.
2. Reviewers check code correctness, type check, build check.
3. Challenger tests edge cases (e.g. boss waves, max wave scaling, performance).
4. Forensic Auditor audits code integrity (no dummy shortcuts or fake game bypasses).

## Phase 3 (Milestone 3): Post-Rebalance Statistical Validation (R2)
1. Execute the automated test harness for at least 10 runs on the rebalanced codebase under identical bot conditions.
2. Collect post-rebalance dataset (`rebalanced_results.json`).
3. Compute statistical comparison:
   - Average & median survival time (before vs after)
   - Max wave reached distribution (before vs after)
   - Death cause breakdown (before vs after)
   - Statistical significance / progression smoothness.
4. Gate check: Reviewer and Auditor verify fidelity and consistency.

## Phase 4 (Milestone 4): Comprehensive Reporting & Sentinel Handoff
1. Synthesize all findings, exact parameter changes before vs after, tree-structured analysis of difficulty bottlenecks, and statistical proof tables.
2. Write final comprehensive report.
3. Send handoff message to Sentinel / parent agent.

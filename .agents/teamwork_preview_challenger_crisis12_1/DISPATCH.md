## 2026-09-03T03:51:13Z
You are Challenger 1 for the 12-Crisis Expansion and Massive Allied Reinforcements project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_challenger_crisis12_1
Workspace directory: /Users/user/src/water-invader
ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
PROJECT.md: /Users/user/src/water-invader/PROJECT.md
COLLABORATION.md: /Users/user/src/water-invader/COLLABORATION.md

MANDATORY: Read ORIGINAL_REQUEST.md first.
Your mission:
1. Empirically verify the statistical uniform distribution of all 12 crisis archetypes:
   - Run large-scale Monte Carlo trials (e.g. 12,000+ rolls) of `EndGameCrisis.startIncursion()`.
   - Calculate Chi-Square metric and confirm $\chi^2 < 24.725$ ($df=11, \alpha=0.01$).
   - Confirm all 12 archetypes spawn without starvation or bias ($850 \le O_i \le 1150$).
2. Adversarially stress-test rapid instantiation, phase skipping, simultaneous anchor destruction, and enrage timeout across all 12 archetypes.
3. Execute stress verification via `npx playwright test tests/unit/crisis_distribution_12.test.ts tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts`.
4. Deliver your verdict (`APPROVE` or `REQUEST_CHANGES`) with full numerical data to `/Users/user/src/water-invader/.agents/teamwork_preview_challenger_crisis12_1/handoff.md` and send a message back.

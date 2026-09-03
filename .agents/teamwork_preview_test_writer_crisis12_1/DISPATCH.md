## 2026-09-03T03:34:54Z
You are the Test Writer for the 12-Crisis Expansion and Massive Allied Reinforcements project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_test_writer_crisis12_1
Workspace directory: /Users/user/src/water-invader
ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
PROJECT.md: /Users/user/src/water-invader/PROJECT.md
COLLABORATION.md: /Users/user/src/water-invader/COLLABORATION.md
QA Survey Handoff: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_test_12/handoff.md
Spec Miner Handoff: /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_12/handoff.md
Allied Reinforcements Handoff: /Users/user/src/water-invader/.agents/teamwork_preview_worker_allied_reinforcements/handoff.md

MANDATORY: Read ORIGINAL_REQUEST.md first.

Your mission:
Implement the complete test suite for the 12-Crisis Expansion and Massive Allied Reinforcements:

1. Update Existing Test Assertions:
   - In `tests/unit/crisis_doubling.test.ts` (around line 65): update `expect(archetypes.length).toBe(6)` or `expect(Object.keys(CrisisArchetype).length).toBe(6)` to `toBe(12)`.
   - In `tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts` (around line 357): update `expect(allArchetypes.length).toBe(6)` to `toBe(12)`.

2. Create `tests/unit/crisis_expansion_12.test.ts`:
   - Follow the detailed specification from QA Survey Report (`tests/unit/crisis_expansion_12.test.ts`):
     * `EXP12-01`: Verify all 12 distinct `CrisisArchetype` keys and `CRISIS_ARCHETYPE_CONFIGS` entries exist with non-empty fields and exact HP values.
     * `EXP12-02`: Strict 5,200 EHP invariant ($2 \times 600 + 2500 + 1500 = 5,200$) across all 12 archetypes.
     * `EXP12-03`: 5-Phase State Machine lifecycle for all 12 archetypes (`INCURSION` -> `PHASE_1_SHIELD` [sovereign invulnerable, takes 0 dmg] -> anchor 1 & 2 destruction -> `PHASE_2_HULL` [vulnerable] -> hull kill -> `PHASE_3_CORE` [35s enrage] -> core kill -> `DEFEATED`).
     * `EXP12-04`: Bespoke Phase 1 anchor mechanics for the 6 new archetypes (Biomorphic seeker spores, Singularity polarized gravity, Nanite mutual 15 HP/s healing, Psionic phantom mirage decoys, Glacial cryo flak reflection, Cosmic dark star fire trails).
     * `EXP12-05`: Archetypal Phase 2 and Phase 3 attack pattern execution and bullet generation across all 12 archetypes.
     * `EXP12-06`: Headless Canvas 2D vector drawing sanity across all $12 \times 5 = 60$ archetype/phase permutations (zero exceptions).
     * `EXP12-07`: High-velocity player bullet collisions, piercing deduction, and damage gating.

3. Create `tests/unit/crisis_distribution_12.test.ts`:
   - Follow the statistical distribution specifications:
     * `STAT12-01`: 12,000 Monte Carlo trials calling `EndGameCrisis.startIncursion()` or `gm.triggerEndGameCrisis()`.
     * `STAT12-02`: Pearson's Chi-Square Goodness-of-Fit test ($df=11, \alpha=0.01$). Assert $\chi^2 = \sum \frac{(O_i - 1000)^2}{1000} < 24.725$.
     * `STAT12-03`: Absolute Per-Archetype Bounds: Assert $850 \le O_i \le 1150$ for every archetype ($> 4.95\sigma$ margin).
     * `STAT12-04`: Incursion gating: Stage 15 has 0% crisis chance, Stage 16 has $30\% \pm 5\%$, Stage 18 has 100% pity trigger.

4. Create `tests/unit/allied_reinforcements.test.ts`:
   - Test `AlliedReinforcements`:
     * Instantiation and vector draw sanity with mock Canvas context.
     * Forward heavy plasma cannons firing targeting boss or enemies.
     * 120px point-defense laser grid bullet interception (marks hostile bullets `isDead = true`).
     * Restorative nano-shield aura (+1 HP healing every 5s and stress reduction).
     * 2 escort interceptors formation flight and suppressing fire.
     * Warp-in entry and warp-out jump on crisis defeat.
     * `GameManager.triggerAlliedReinforcements()` integration and automatic summoning in Phase 2.

5. Create `tests/15_endgame_crisis_12_archetypes.spec.ts`:
   - Playwright browser E2E test verifying:
     * Incursion warning banner rendering for all 12 archetypes with uppercase titles.
     * Active HUD status badge updates across phases.
     * Massive Allied Reinforcements arrival banner (`[data-testid="endgame-crisis-warning-banner"]` or in-game toast).
     * Crisis defeat, score and currency rewards, and clean wave advancement.
     * Multi-viewport responsive integrity and 0 uncaught browser console errors.

6. Execution & Verification:
   - Run the headless unit tests: `SKIP_WEBSERVER=1 npx playwright test tests/unit/crisis_expansion_12.test.ts tests/unit/crisis_distribution_12.test.ts tests/unit/allied_reinforcements.test.ts tests/unit/crisis_doubling.test.ts`
   - Run `npx tsc --noEmit` to verify type cleanliness.
   - Write your handoff report to `/Users/user/src/water-invader/.agents/teamwork_preview_test_writer_crisis12_1/handoff.md` and send a message back.

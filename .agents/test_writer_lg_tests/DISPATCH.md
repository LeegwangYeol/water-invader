## 2026-09-03T10:40:37Z

You are a Test Writer subagent for the Next.js "Water Invader" project.
Your working directory: /Users/user/src/water-invader/.agents/test_writer_lg_tests
Workspace root: /Users/user/src/water-invader
Authoritative Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Master Project Blueprint: /Users/user/src/water-invader/PROJECT.md
Survey Reports:
- /Users/user/src/water-invader/.agents/explorer_lg_survey_shop/handoff.md
- /Users/user/src/water-invader/.agents/explorer_lg_survey_combat/handoff.md
- /Users/user/src/water-invader/.agents/explorer_lg_survey_enemies/handoff.md

Mission:
Author comprehensive Unit Test Suites and Playwright E2E Test Suites for Requirement 1 (Homing Missiles) and Requirement 2 (Enemy Swarms & 3rd Faction Mid-Tier Monsters) per the Dual-Track Testing specification:

Tasks:
1. Create `tests/unit/homing_missile.test.ts`:
   - Unit tests using Vitest/Node test runner or custom assertions:
     - MISSILE-01: Baseline verification (`homingMissiles === 0` by default).
     - MISSILE-02: Upgrade pricing and tiered progression (`HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400]`).
     - MISSILE-03: State persistence in `init(false, true)` vs reset in `init(true, false)`.
     - MISSILE-04: Nearest-neighbor seeking geometry (orienting towards closest Euclidean target).
     - MISSILE-05: Point-blank interception: turning radius $R \le 45\text{ px}$ intercepts diving rusher within 100px without overshooting.
     - MISSILE-06: Retargeting on target death; linear cruise when target list is empty.
     - MISSILE-07: Barricade clearance (`ignoreBarricades === true`).
     - MISSILE-08: Splash blast damage application.

2. Create `tests/unit/enemy_swarm.test.ts`:
   - SWARM-01: Wave 10+ grid expansion generates 50–60 enemies (rows up to 6, cols up to 10).
   - SWARM-02: Solitary boss invariant on Wave 5 (`enemies.length === 1`).
   - SWARM-03: Dynamic echelon streaming triggers when active hostiles drop $\le 18$.
   - SWARM-04: Concurrent population safety cap strictly prevents `enemies.length > 70`.
   - SWARM-05: 3rd Faction `Faction.ROGUE` mid-tier monster stats, kinetic shields, and overhead health bars.
   - SWARM-06: 3-Way AI targeting: Rogue shoots closest hostile (Player vs Invader).

3. Create `tests/16_homing_missile_combat.spec.ts` (Playwright E2E):
   - Pre-Game Shop displays Homing Missile upgrade row with disabled state when currency < 250.
   - Granting currency via debug key (or game balance) allows purchasing Lv. 1, updating button to 450 💧.
   - In Wave 1, launching homing missiles tracks and destroys enemies.
   - Close-spawning rusher test: missile curves and hits diving hostile without overshooting.
   - Bypasses friendly barricades at $y = 650$.

4. Create `tests/16_enemy_swarm_and_third_faction.spec.ts` (Playwright E2E):
   - Wave 11 spawn count verification (>= 50 enemies).
   - Secondary streaming echelon verification when count $\le 18$.
   - Mid-tier Rogue monster presence with overhead mini-health bar.
   - Crossfire interaction between Rogues and Invaders.
   - Wave 5 boss solitary check.

5. Create `TEST_INFRA.md` and `TEST_READY.md` at project root documenting test runner commands and coverage matrix.
6. Verify tests with `npm run build` and test execution.
7. Write your handoff report to `/Users/user/src/water-invader/.agents/test_writer_lg_tests/handoff.md` and report back.

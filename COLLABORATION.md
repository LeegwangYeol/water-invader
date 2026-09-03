# Claude Collaboration Guide: Water Invader

## Current Mission: Major Late-Game Gameplay Update (Homing Missiles, Enemy Swarm & 3rd Faction)

### Executive Summary & Mission Scope
The Project Orchestrator has deployed a multi-agent team to architect, implement, rigorously test, balance, and verify the Major Late-Game Gameplay Update for Water Invader.

This update addresses late-game progression and difficulty scaling after Wave 10 across three core requirements:
1. **R1. Homing Missile Weapon Upgrade (유도탄)**:
   - Purchasable in the Pre-Game and Inter-Wave Shop, scaling into the late-game economy.
   - Autonomous secondary salvo launcher mounted on ship wingtips.
   - Automatically acquires the closest threat in Euclidean distance and deals high burst damage (3–7 dmg base, up to 8 direct + 4 splash), clearing fast rushers and diving hostiles in Wave 10+.
2. **R2. Enemy Swarm and 3rd Faction (Mid-Tier Monsters)**:
   - **Swarm Scaling (2-Tier Architecture)**: Post-Wave 10 grid expands from 40 to 50–60 units, and dynamic secondary echelons stream in when active hostiles drop below 18, scaling wave casualties to 70–90+ enemies with a 65–70 concurrent entity safety cap.
   - **3rd Faction Mid-Tier Monsters (`Faction.ROGUE`)**: Distinct mid-tier entities (Rogue Goliath, Rogue Phase Phantom, Rogue Brood Carrier) with overhead mini-health bars, kinetic shields, phase-dash teleports, cluster-split spawns, and 3-way crossfire AI targeting both Invaders and Player.
3. **R3. Mandatory Double-Check Testing Before Push**:
   - Zero crashes, zero regressions, stable 60 FPS under peak 70-enemy swarms.
   - Unit tests (`tests/unit/homing_missile.test.ts`, `tests/unit/enemy_swarm.test.ts`) and Playwright E2E suites (`tests/16_homing_missile_combat.spec.ts`, `tests/16_enemy_swarm_and_third_faction.spec.ts`).
   - Strict adherence to pre-commit and pre-push build verification rules (`npm run build`, `npx tsc --noEmit`, `npx playwright test`).

---

### Key Technical Survey Findings (Exploration Phase Completed)

#### Track 1: Shop & Weapon Architecture (`explorer_lg_survey_shop`)
- **Shop UI Co-location**: `ShopUpgradePanel`, `ShopModal`, and `GameOverModal` reside in `src/components/game-canvas.tsx`.
- **Economy Scaling**: Early upgrades cap at 1,550 💧. Players accumulating 2,000–4,000+ 💧 by Wave 10 have surplus liquidity.
- **Homing Missile Tiered Pricing**:
  - `HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400]` (Cumulative: 3,800 💧).
  - Lv 1 (250 💧): 1 missile every 2.0s, 3 damage.
  - Lv 2 (450 💧): 1 missile every 1.6s, 4 damage.
  - Lv 3 (700 💧): 2 missiles every 1.4s, 5 damage.
  - Lv 4 (1,000 💧): 2 missiles every 1.1s, 6 damage.
  - Lv 5 (1,400 💧): 3 missiles every 0.9s, 7 damage (MAX).
- **State Persistence**: Preserved across runs via `GameManager.init(false, true)`.

#### Track 2: Combat & Missile Physics (`explorer_lg_survey_combat`)
- **Subclass**: `HomingMissile extends Bullet` integrates into swept-box Continuous Collision Detection (CCD, `DEFECT-C1`) and pierce tracking (`DEFECT-A1`).
- **Steering Physics**:
  - Angular velocity clamp $\omega = 6.2\text{ rad/s}$, launch speed $v_0 = 280\text{ px/s}$, acceleration $a = 360\text{ px/s}^2$, max speed $v_{\max} = 520\text{ px/s}$.
  - Turning radius $R = v/\omega \approx 45\text{ px}$, ensuring tight intercept curves without overshooting close-spawning rushers ($y \in [600, 720]$).
- **Barricade Clearance**: `ignoreBarricades = true` ensures missiles fly over friendly defensive bunkers at $y = 650$.
- **Sticky Retargeting**: Instant re-acquisition upon target death; linear cruise failsafe if all hostiles are cleared.

#### Track 3: Enemy Swarm & 3rd Faction (`explorer_lg_survey_enemies`)
- **Grid Plateau Fix**: Current wave generation caps at 40 units (`rows=5, cols=8`) from Wave 8 onward. Post-Wave 10 grid expands to 6 rows x 10 cols (50–60 units) compacted in $Y \in [80, 290]$.
- **Dynamic Echelon Streaming**: Post-Wave 10 streams in secondary echelons (10–14 units) when active hostiles drop $\le 18$.
- **Mid-Tier Rogue Monsters**:
  1. *Rogue Goliath*: 56x42, 35–55 HP, Kinetic Shield, EMP shockwave on shield break.
  2. *Rogue Phase Phantom*: 48x34, 25–40 HP, erratic horizontal Phase Dash (80–120px teleport) shedding locks.
  3. *Rogue Brood Carrier*: 52x40, 30–45 HP, cluster-split deploying 2–3 Rogue Drones on defeat.
- **Overhead Mini-Health Bar**: 40x4px container with shield overlay and dynamic health gradient.
- **3-Way AI Crossfire**: Attacks both Invaders and Player. Crossfire kills trigger `handleCrossfireKill()` (+150 score, +8 💧, +2% ult).
- **Regression Safety**: Wave 5 Boss solitary spawn (1 enemy) is strictly guarded for `04_multiwave_progression.spec.ts`.

---

### Milestone Decomposition & Roadmap

| Milestone | Name | Primary Scope | Deliverables & Verification | Status |
|---|---|---|---|---|
| **M1** | Homing Missile Weapon System | `Bullet.ts`, `Player.ts`, `GameManager.ts`, `game-canvas.tsx`, `SoundManager.ts` | `HomingMissile` class, steering physics, shop tier pricing (250..1400 💧), UI rows, persistence, sound FX | **COMPLETED** |
| **M2** | Enemy Swarm & 3rd Faction | `Enemy.ts`, `GameManager.ts`, `types.ts` | Swarm grid expansion (50–60 units), dynamic streaming echelons, 3rd faction mid-tier monsters, overhead health bars, 3-way crossfire AI | **COMPLETED** |
| **M3** | Dual-Track Testing & Hardening | `tests/unit/`, `tests/`, Playwright runner | Unit test suites, Playwright E2E suites (`16_homing_missile_combat.spec.ts`, `16_enemy_swarm_and_third_faction.spec.ts`), adversarial review, forensic audit, build & push | **COMPLETED** |

---

### Gate Verification Status
- **Reviewer 1 (Architecture & Implementation)**: APPROVED (55/55 tests passed)
- **Reviewer 2 (Regression & Stability)**: APPROVED (Multi-wave regression suites 04, 05, 06, 12 passed)
- **Challenger 1 (Homing Missiles Stress)**: APPROVED (15/15 stress tests passed)
- **Challenger 2 (Enemy Swarm Stress)**: APPROVED (16/16 stress tests passed, memory safe)
- **Forensic Auditor (Integrity)**: CLEAN (0 shortcuts, 0 facades, authentic behavior)
- **Gate Result**: UNANIMOUS PASS (Ready for Git Release & Remote Sync)


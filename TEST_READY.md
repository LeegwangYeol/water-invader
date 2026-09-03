# Dual-Track Test Suites Ready: Major Late-Game Gameplay Update

## Test Suite Execution
- **Unit Test Runner**: `npx playwright test tests/unit/homing_missile.test.ts tests/unit/enemy_swarm.test.ts`
- **E2E Test Runner**: `npx playwright test tests/16_homing_missile_combat.spec.ts tests/16_enemy_swarm_and_third_faction.spec.ts`
- **Full Unit Suite**: `npx playwright test tests/unit/`
- **Pre-Commit Verification**: `npx tsc --noEmit && npm run build`

---

## Coverage Summary: Late-Game Update Suites

| Suite File | Track | Tests Count | Focus Areas |
|---|---|:---:|---|
| `tests/unit/homing_missile.test.ts` | Unit / Mathematical | 8 | Baseline state, 5-tier pricing array (250..1400 💧), persistence, nearest-neighbor Euclidean targeting, turning radius $R \le 45.2\text{ px}$, target death retargeting, linear cruise, barricade clearance, splash blast ($R = 45\text{ px}$). |
| `tests/unit/enemy_swarm.test.ts` | Unit / Mathematical | 6 | Wave 10+ grid expansion (50–60 units), Wave 5 solitary boss invariant, dynamic echelon streaming ($\le 18$ hostiles), concurrent population cap ($\le 70$), 3rd Faction `Faction.ROGUE` stats & shield absorption & overhead health bars, 3-way AI targeting. |
| `tests/16_homing_missile_combat.spec.ts` | E2E Browser | 5 | Pre-game shop UI disabled state, F5 debug purchase & price increment to 450 💧, Wave 1 missile launching, close-spawning rusher intercept, friendly barricade clearance at $y = 650$. |
| `tests/16_enemy_swarm_and_third_faction.spec.ts` | E2E Browser | 5 | Wave 11 50+ enemy spawn, dynamic echelon trigger on $\le 18$ enemies, Rogue mid-tier monster stats & HUD badge, 3-way crossfire kill scoring bonus, Wave 5 solitary boss regression invariant. |
| **Total New Tests** | **Dual-Track** | **24** | **100% specification coverage for R1 (Homing Missiles) & R2 (Enemy Swarm & 3rd Faction)** |

---

## Feature Verification Matrix

| Requirement | Unit Test ID | E2E Spec ID | Expected Invariant |
|---|:---:|:---:|---|
| **Homing Missile Baseline** | `MISSILE-01` | `E2E-MISSILE-01` | `homingMissiles === 0` by default; disabled button when currency < 250 💧. |
| **Tiered Upgrade Costs** | `MISSILE-02` | `E2E-MISSILE-02` | `HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400]`; button reflects next tier cost. |
| **Upgrade Persistence** | `MISSILE-03` | `E2E-MISSILE-03` | `init(false, true)` retains missile upgrades; `init(true, false)` resets to 0. |
| **Seeking Kinematics** | `MISSILE-04` | `E2E-MISSILE-03` | Nearest Euclidean hostile acquired; angular turn velocity $\omega = 6.2\text{ rad/s}$. |
| **Point-Blank Intercept** | `MISSILE-05` | `E2E-MISSILE-04` | Turning radius $R \approx 45\text{ px}$ intercepts diving rushers within 100px. |
| **Barricade Clearance** | `MISSILE-07` | `E2E-MISSILE-05` | `ignoreBarricades = true` allows missiles to bypass friendly bunkers at $y = 650$. |
| **Post-Wave 10 Swarm** | `SWARM-01` | `E2E-SWARM-01` | Wave 11 generates 50–60 enemies (rows up to 6, cols up to 10). |
| **Solitary Boss Invariant**| `SWARM-02` | `E2E-SWARM-05` | Wave 5 spawns exactly 1 boss and 0 minions. |
| **Echelon Streaming** | `SWARM-03` | `E2E-SWARM-02` | Active hostiles $\le 18$ triggers secondary swarm echelon (10–14 units). |
| **Population Safety Cap** | `SWARM-04` | `E2E-SWARM-01` | Active concurrent enemies strictly capped at $\le 70$ to guarantee 60 FPS. |
| **3rd Faction Mid-Tier** | `SWARM-05` | `E2E-SWARM-03` | `Faction.ROGUE` 25–55 HP, Kinetic Shield, overhead mini-health bar. |
| **3-Way AI Crossfire** | `SWARM-06` | `E2E-SWARM-04` | Rogue attacks closest hostile; crossfire kill awards +150 score, +8 💧, +2% ult. |

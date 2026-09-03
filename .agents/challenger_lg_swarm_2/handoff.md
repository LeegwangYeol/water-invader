# Adversarial Empirical Challenge Report: Late Game R2 Swarms & 3rd Faction Mid-Tier Monsters

**Agent**: `challenger_lg_swarm_2`  
**Milestone**: Late Game R2 Swarms & Mid-Tier Verification  
**Authoritative Specifications**: `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`, `/Users/user/src/water-invader/PROJECT.md`  
**Working Directory**: `/Users/user/src/water-invader/.agents/challenger_lg_swarm_2`  
**Verdict**: **APPROVE**

---

## 1. Observation

### 1.1 Source Code Inspection
- **Swarm Grid & Population Cap**:
  - `src/game/GameManager.ts:472-476`: Non-boss post-Wave 10 grids scale to 50–60 enemies (`rows = Math.min(6, 5 + Math.floor((this.level - 10) / 4))`, `cols = 10`, max 60).
  - `src/game/GameManager.ts:528-531`: `spawnDynamicReinforcement` gates entrance:
    ```typescript
    const currentActive = this.enemies.filter(e => !e.isDead).length;
    if (currentActive >= 60) {
      return;
    }
    ```
  - `src/game/GameManager.ts:538, 560, 573, 588`: Inner loops enforce hard cap:
    ```typescript
    if (this.enemies.filter(e => !e.isDead).length >= 70) break;
    ```
  - `src/game/GameManager.ts:615-618, 633, 642`: `triggerSwarmEchelon` gates at `>= 60` and breaks if `>= 70`.
  - `src/game/GameManager.ts:1840-1844`: `handleCarrierSplit` gates at `< 68` and bounds drone count:
    ```typescript
    const currentActive = this.enemies.filter(e => !e.isDead).length;
    if (currentActive < 68) {
      const droneCount = Math.min(3, Math.max(2, 70 - currentActive));
    ```

- **3rd Faction Dual-Targeting AI & Friendly-Fire Raycast Suppression**:
  - `src/game/Enemy.ts:681-706`: Rogue AI scans Euclidean distance between Player center and active Invader centers, selecting the closest hostile target.
  - `src/game/Enemy.ts:476-674`: `hasAlliedObstacleInShotPath` implements 2D corridor and slab raycasting against same-faction live allies (`ally.faction === this.faction`). Hostiles (`ally.faction !== this.faction`) are explicitly excluded (lines 504, 566).
  - `src/game/Enemy.ts:718-742`: When `hasAlliedObstacleInShotPath` returns true, `fire()` returns `null`, resets `fireTimer = Math.random() * 0.12 + 0.12`, and sets lateral evasion velocity (`this.slideDir`, `this.slideTimer = 1.0`).
  - `src/game/GameManager.ts:1858-1873`: Crossfire kills grant combo increments, charge player ultimate gauge (`+2.0`), and award bonus score (`+150 * comboMultiplier`) and currency (`+8 * comboMultiplier`).

- **Mid-Tier Monster Mechanics**:
  - `src/game/Enemy.ts:152-178, 239-266`: Instantiates `ROGUE_GOLIATH` (HP 35–55, Shield 12–20), `ROGUE_PHANTOM` (HP 25–40, canEvade true), `ROGUE_CARRIER` (HP 30–45, Shield 8).
  - `src/game/Enemy.ts:909-922`: `takeDamage()` absorbs incoming damage via `this.shieldHp` before base `this.hp`.
  - `src/game/GameManager.ts:1523-1534`: Shield break on `ROGUE_GOLIATH` triggers `this.triggerEMPShockwave(...)`.
  - `src/game/GameManager.ts:1824-1838`: `triggerEMPShockwave(x, y)` destroys hostile non-player bullets within `empRadius = 110` and triggers screen shake.
  - `src/game/Enemy.ts:768-771`: Goliath twin barrels alternate X offset between `-14` and `+14` px.
  - `src/game/Enemy.ts:926-972`: Phantom sustained damage detector triggers `triggerPhaseDash()` on 2nd hit within 800ms, teleporting 80–120px horizontally, spawning afterimages, and applying a 2.5s cooldown.
  - `src/game/GameManager.ts:1840-1856`: Carrier death triggers `handleCarrierSplit()`, spawning 2–3 Rogue Drones with dispersal velocities.

- **Wave 5 Solitary Boss Invariant**:
  - `src/game/GameManager.ts:401-438`:
    ```typescript
    if (this.level % 5 === 0) {
      this.swarmEchelonsRemaining = 0;
      const boss = new Enemy(this.logicalWidth / 2 - 75, 90, this.logicalWidth, this.level, EnemyType.BOSS, this.logicalHeight);
      this.enemies.push(boss);

      if (this.level >= 10) {
        // Stage 10+ Boss Escort Legions ...
      }
      return;
    }
    ```
    On Wave 5, `this.level >= 10` evaluates to `false`. Zero escorts, zero minions, and zero mid-tier monsters are spawned.

### 1.2 Empirical Test Execution & Telemetry
1. **Adversarial Stress Suite** (`tests/unit/adversarial_swarm_midtier_stress.test.ts`):
   - Command: `SKIP_WEBSERVER=1 npx playwright test tests/unit/adversarial_swarm_midtier_stress.test.ts`
   - Output:
     ```
     Running 16 tests using 1 worker
     ✓   1 [chromium] › STRESS-1.1: Extreme continuous spawning flood NEVER exceeds 70 concurrent units (134ms)
     ✓   2 [chromium] › STRESS-1.2: Boundary saturation test at exactly 68 and 69 active units (4ms)
     ✓   3 [chromium] › STRESS-1.3: Simultaneous multi-carrier cluster split at near-cap does not exceed 70 (12ms)
     [PERF BENCHMARK 60 ENEMIES] Mean: 0.230ms, P95: 0.623ms, P99: 5.192ms, Max: 13.188ms
     ✓   4 [chromium] › PERF-1.4: Tick duration / frame rate under 60 concurrent enemies (>= 40-60 FPS) (231ms)
     ✓   5 [chromium] › AI-2.1: 3-way crossfire targeting: Rogues engage closest hostile (Player vs Invader) (9ms)
     ✓   6 [chromium] › AI-2.2: Friendly-fire raycast suppression prevents allied Rogues from damaging each other (1ms)
     ✓   7 [chromium] › AI-2.3: Hostile Invader in shot path does NOT suppress Rogue fire (2ms)
     ✓   8 [chromium] › AI-2.4: Allied Rogue BEHIND shooter does NOT suppress forward fire (2ms)
     ✓   9 [chromium] › AI-2.5: Crossfire Kill awards strategic bonus score and currency (2ms)
     ✓  10 [chromium] › MIDTIER-3.1: Rogue Goliath kinetic shield absorption and EMP shockwave on shield break (18ms)
     ✓  11 [chromium] › MIDTIER-3.2: Rogue Goliath alternating twin-barrel trajectory (6ms)
     ✓  12 [chromium] › MIDTIER-3.3: Rogue Phantom phase dash teleport under sustained damage (45ms)
     ✓  13 [chromium] › MIDTIER-3.4: Rogue Carrier cluster split on death spawns 2-3 Rogue Drones (63ms)
     ✓  14 [chromium] › BOSS-4.1: Wave 5 strictly spawns exactly 1 Boss and 0 minions / mid-tiers (5ms)
     ✓  15 [chromium] › BOSS-4.2: Contrast with Wave 10+ boss waves having escort legions (4ms)
     ✓  16 [chromium] › BOSS-4.3: Dynamic echelons do not trigger during Wave 5 solitary boss fight (15ms)
     16 passed (4.0s)
     ```

2. **Standard Swarm Unit Suite** (`tests/unit/enemy_swarm.test.ts`):
   - Command: `SKIP_WEBSERVER=1 npx playwright test tests/unit/enemy_swarm.test.ts`
   - Result: 6 passed (4.4s).

3. **Playwright E2E Integration Suite** (`tests/16_enemy_swarm_and_third_faction.spec.ts`):
   - Command: `npx playwright test tests/16_enemy_swarm_and_third_faction.spec.ts`
   - Result: 5 passed (24.9s).

4. **External TypeScript Finding**:
   - `npx tsc --noEmit` flagged an error in `tests/unit/adversarial_homing_missile_stress.test.ts:340:104` (`Property 'FAST' does not exist on type 'typeof EnemyType'`), created by a peer agent. Our swarm test suite `tests/unit/adversarial_swarm_midtier_stress.test.ts` compiles cleanly with zero type errors.

---

## 2. Logic Chain

1. **Safety Cap Invariant Verification**:
   - *Observation*: Under `STRESS-1.1`, 100 consecutive rapid spawning requests of all 5 reinforcement formations were executed on Wave 14 (initial 60 enemies).
   - *Reasoning*: Because `spawnDynamicReinforcement` gates when active units $\ge 60$ and unconditionally breaks out of unit insertion loops when active units $\ge 70$, active unit counts were empirically bounded to $[60, 70]$.
   - *Observation*: Under `STRESS-1.3`, 3 carriers were destroyed simultaneously at active population 68.
   - *Reasoning*: `handleCarrierSplit` gates at `currentActive < 68` and uses `Math.min(3, 70 - currentActive)`. The first carrier spawned 3 units (reaching 70), after which subsequent carriers were suppressed from spawning drones. Active units never exceeded 70.

2. **Frame Rate & Tick Performance Verification**:
   - *Observation*: Under `PERF-1.4`, 500 consecutive frame updates with 60 concurrent active hostiles and 20 active projectiles were benchmarked.
   - *Reasoning*: Mean tick duration was 0.230ms, P95 was 0.623ms, P99 was 5.192ms, and Max was 13.188ms. Since 60 FPS corresponds to 16.67ms and 40 FPS corresponds to 25.0ms, the system runs comfortably at $\ge 60$ FPS with $\sim 1.3\times$ safety margin under worst-case 60-enemy load.

3. **3-Way Crossfire & Friendly Fire Suppression Verification**:
   - *Observation*: Under `AI-2.1`, Rogues successfully targeted Invaders when Invaders were Euclidean closer, and targeted the Player when the Player was closer.
   - *Observation*: Under `AI-2.2`, an allied Rogue placed along the shot path triggered `hasAlliedObstacleInShotPath() === true`, suppressing fire (`fire() === null`) and commanding a lateral slide.
   - *Observation*: Under `AI-2.3`, an Invader placed along the shot path did not trigger suppression, allowing Rogues to fire at Invaders.
   - *Observation*: Under `AI-2.4`, an ally behind the shooter did not block forward fire.
   - *Observation*: Under `AI-2.5`, Rogues killing Invaders awarded $+150$ score and $+8$ currency via `handleCrossfireKill()`.

4. **Mid-Tier Monster Mechanics Verification**:
   - *Observation*: Under `MIDTIER-3.1`, Goliath kinetic shield absorbed 8 damage without base HP reduction. Breaking the shield triggered `triggerEMPShockwave()`, which neutralized non-player hostile projectiles within 110px while leaving player projectiles intact.
   - *Observation*: Under `MIDTIER-3.2`, Goliath alternating barrels fired with exact $\pm 14\text{px}$ offsets ($28\text{px}$ total spread).
   - *Observation*: Under `MIDTIER-3.3`, Phantom withstood 1 hit without teleporting, but teleported $\ge 70\text{px}$ on the 2nd hit within 800ms, entering phase dash with afterimages and a 2.5s cooldown preventing spam teleportation.
   - *Observation*: Under `MIDTIER-3.4`, Carrier death spawned 2–3 Rogue Drones with radial dispersal speeds.

5. **Solitary Boss Wave 5 Integrity**:
   - *Observation*: Under `BOSS-4.1` through `BOSS-4.3`, Wave 5 spawned strictly 1 unit of `EnemyType.BOSS` with 50 HP. 0 minions and 0 mid-tiers spawned, and dynamic echelons remained disabled (`swarmEchelonsRemaining === 0`).

---

## 3. Caveats

- Web Audio API synthesizers (`soundManager`) operate with no-op audio nodes in Node/headless unit environments; sound execution was verified via method call telemetry rather than acoustic capture.
- A peer test file `tests/unit/adversarial_homing_missile_stress.test.ts` contains a type error (`EnemyType.FAST`) that should be corrected by the homing missile challenger/worker agent before final build verification.

---

## 4. Conclusion

**Verdict**: **APPROVE**

All requirements defined in the Mission Statement and Master Project Blueprint have been empirically verified and stress-tested:
1. **Swarm Safety Cap**: Under extreme continuous spawning assault and multi-carrier split, concurrent on-screen enemies strictly never exceed 70 units.
2. **Frame Rate**: Average tick duration is 0.230ms (P99 5.192ms, Max 13.188ms), guaranteeing $\ge 40\text{--}60$ FPS (well under the 25ms frame threshold).
3. **3-Way Crossfire & Friendly Fire AI**: 3-way targeting correctly engages the closest hostile (Player vs Invader). Friendly-fire raycasting suppresses shots and initiates lateral sliding when allied Rogues are in the line of fire, while permitting fire against hostile Invaders.
4. **Mid-Tier Monster Mechanics**: Goliath kinetic shield and EMP shockwave, Phantom phase dash evasion under sustained damage, and Carrier cluster split on death behave exactly to specification.
5. **Solitary Boss Invariant**: Wave 5 spawns strictly 1 Boss and 0 minions/mid-tiers.

---

## 5. Verification Method

To independently execute and verify the adversarial stress test suite:

```bash
# 1. Run the comprehensive adversarial stress test suite
SKIP_WEBSERVER=1 npx playwright test tests/unit/adversarial_swarm_midtier_stress.test.ts

# 2. Run the baseline swarm unit test suite
SKIP_WEBSERVER=1 npx playwright test tests/unit/enemy_swarm.test.ts

# 3. Run the Playwright browser E2E integration suite
npx playwright test tests/16_enemy_swarm_and_third_faction.spec.ts
```

### Invalidation Conditions
- Any test failure in `tests/unit/adversarial_swarm_midtier_stress.test.ts`.
- Active enemy count exceeding 70 under any spawning loop.
- Frame tick time exceeding 25ms in steady-state operation under 60 enemies.
- Rogue shooting through an allied Rogue and damaging it.
- Wave 5 spawning more than 1 enemy entity.

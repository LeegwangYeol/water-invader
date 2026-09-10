# Adversarial QA Handoff: Stream D Factions Combat Verification

## 1. Observation

Direct empirical code audits and execution of the 23-test adversarial verification suite (`tests/adversarial_stream_d_factions_combat.spec.ts`) yielded the following observations:

### Observation 1.1: Permanent Player Speed Leak on Clinger Removal
- **File**: `/Users/user/src/water-invader/src/game/flagship/factions/HadalBioHorrors.ts`
- **Lines 320–327**:
  ```ts
  const n = Math.min(3, this.state.attachedParasiteCount);
  const speedRatio = Math.max(0.25, 1.0 - 0.25 * n);
  // Adjust player speed according to attached count
  if (n > 0) {
    player.speed = 300 * speedRatio;
  }
  ```
- **Test Result**: `ADV-CLINGER-03` empirically verified that when 1 clinger latches, `player.speed` drops to 225. When the clinger is removed (count = 0), `if (n > 0)` is false; `player.speed` is NEVER restored to 300. The player remains permanently slowed at 225 px/s for the rest of the game session unless overridden by an external system.

### Observation 1.2: Spore Siphoner Swallows Piercing Bullets & Core Shielding
- **File**: `/Users/user/src/water-invader/src/game/flagship/factions/HadalBioHorrors.ts`
- **Lines 454–472, 571, 592**:
  ```ts
  // In update() for 'SIPHONER':
  for (const b of bullets) {
    if (b.isDead) continue;
    const dist = Math.hypot(unit.position.x - b.position.x, unit.position.y - b.position.y);
    if (dist < (unit.auraRadius || 110)) {
      ...
      // Swallowed into bladder
      if (dist < (unit.currentSacRadius || 24)) {
        b.isDead = true;
        unit.absorbedBullets = (unit.absorbedBullets || 0) + 1;
        unit.currentSacRadius = Math.min(80, (unit.currentSacRadius || 24) + 4);
        createExplosion(b.position.x, b.position.y, '#84cc16', 5, 0.6);
      }
    }
  }
  ```
- **Lines 571, 592**:
  `this.checkBulletCollisions(unit, bullets, context);` runs after the switch block. Inside `checkBulletCollisions`:
  `for (const b of bullets) { if (b.isDead) continue; ... }`
- **Test Result**: `ADV-SIPHONER-02` verified that when a high-tier piercing bullet (`piercing = 3`) strikes the center of a Spore Siphoner, it is swallowed unconditionally (`b.isDead = true`) in the pre-pass and deals 0 damage to the Siphoner. This directly violates `IDEAS_PITCH.md:701`: *"Piercing weapons detonate its core safely before it swells."*

### Observation 1.3: Automaton Phalanx Flanking Angle Mathematical Bug (> 60° vs > 45°)
- **File**: `/Users/user/src/water-invader/src/game/flagship/factions/AutomatonShieldGrid.ts`
- **Lines 30, 216–221**:
  ```ts
  private static readonly SHIELD_ARC_COS = 0.50; // 60-degree total arc (30 deg half-angle: cos(60) = 0.5)
  ...
  const impactCos = -(bulletDirX * drone.shieldNormal.x + bulletDirY * drone.shieldNormal.y);
  const isFrontal = impactCos >= AutomatonShieldGrid.SHIELD_ARC_COS;
  if (isFrontal) {
    // 100% frontal deflection...
  ```
- **Test Result**: `ADV-AEGIS-02` empirically proved that a shot fired at 50° off-axis (which satisfies the specification requirement of flanking `> 45°`) results in `impactCos = cos(50°) ≈ 0.6428 >= 0.50`. The shot is DEFLECTED as frontal. The developer incorrectly assumed $\cos(60^\circ) = 0.5$ represents a 30° half-angle, whereas $\cos(60^\circ)$ is actually a 60° half-angle (120° total arc). The player must flank at $> 60^\circ$ to bypass the shield.

### Observation 1.4: Inductive Backlash Stun Duration Numerical Defect (1.8s vs 3.5s)
- **File**: `/Users/user/src/water-invader/src/game/flagship/factions/AutomatonShieldGrid.ts`
- **Lines 278–280**:
  ```ts
  drone.isFrontalShieldActive = false;
  drone.isBacklashStunned = true;
  drone.stunTimer = 1.8;
  ```
- **Test Result**: `ADV-AEGIS-04` empirically verified that upon shield collapse, linked drones receive `stunTimer = 1.8;`. In `update()` line 315–322, the shield reboots as soon as `stunTimer <= 0` (after only 1.8 seconds). Both `DISPATCH.md:22` and `IDEAS_PITCH.md:773` explicitly require: *"shield break triggers 3.5s inductive stun + 35% Max HP damage."*

### Observation 1.5: EMP Prowler Mechanical Defect (Suppression Spread vs Fire Rate & No Barricade Halt)
- **File**: `/Users/user/src/water-invader/src/game/flagship/factions/AutomatonPhalanx.ts`
- **Lines 371–380**:
  ```ts
  if (distToPlayer <= 240) {
    // Overload weapon heat sinks: fire rate -50% for 3s
    player.suppressionLevel = Math.min(100, player.suppressionLevel + 40);
    createExplosion(player.position.x + 20, player.position.y, '#00f0ff', 15, 1.5);
  }
  ```
- **File**: `/Users/user/src/water-invader/src/game/Player.ts`
- **Lines 29, 153–155, 164**:
  `Player.ts` line 29: `public suppressionLevel: number = 0; // 0 to 100. High = less accuracy`. Line 164: `const spread = (this.suppressionLevel / 100) * maxSpread;`.
  Line 153–155: `const currentFireRate = this.baseFireRate / (1 + (this.stressLevel / 50));`
- **Test Result**: `ADV-EMP-01` proved that `suppressionLevel` only affects projectile angular spread, leaving `player.baseFireRate` and shot intervals completely untouched. Furthermore, `barricades` are not referenced anywhere in the EMP pulse handler, failing the requirement to *"halt barricade repair"*.

### Observation 1.6: FlagshipManager Hardcoded Kinetic Telemetry Distortion
- **File**: `/Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts`
- **Lines 405–407**:
  ```ts
  // 2. Track damage telemetry for epigenetic mutation engine
  if (this.bioHorror && typeof this.bioHorror.recordDamageDealt === 'function') {
    this.bioHorror.recordDamageDealt('kinetic', enemy.maxHp || 10);
  }
  ```
- **Test Result**: `ADV-MUTATION-04` proved that whenever any enemy dies, `FlagshipManager` hardcodes `'kinetic'` into the mutation engine, regardless of whether the enemy was killed by homing missiles, piercing shots, or laser beams. This artificially skews the Hive towards `ANTI_KINETIC_CALCIFICATION`.

### Observation 1.7: Colossus Bone Shield HP Non-Depletion
- **File**: `/Users/user/src/water-invader/src/game/flagship/factions/HadalBioHorrors.ts`
- **Lines 647–650**:
  ```ts
  } else if (isFrontalHit && !unit.isShieldShattered) {
    // 85% damage mitigation on frontal bone shield!
    rawDamage *= 0.15;
    createExplosion(b.position.x, b.position.y, '#94a3b8', 6, 0.7);
  }
  ```
- **Test Result**: `ADV-COLOSSUS-03` confirmed that firing 20 frontal non-piercing bullets reduces unit HP by 1.5 per shot, but `colossus.boneShieldHp` remains at 40/40. The shield never depletes or shatters from non-piercing bullets.

### Observation 1.8: Epigenetic Mutation UI Banner Localization Discrepancy
- **File**: `/Users/user/src/water-invader/src/game/flagship/factions/EpigeneticMutationEngine.ts`
- **Lines 114–121**:
  ```ts
  if (mutation === 'ANTI_KINETIC_CALCIFICATION') {
    this.alertBannerText = '⚠️ 하달 군체 변태 감지 // 다이아몬드 갑각 경화 (운동 에너지 방어 +40%)';
  } else if (mutation === 'BIOLUMINESCENT_CHAFF') {
    this.alertBannerText = '⚠️ 하달 군체 변태 감지 // 발광성 페로몬 채프 (유도 미사일 교란)';
  } else if (mutation === 'AMOEBIC_VISCOUS_FLESH') {
    this.alertBannerText = '⚠️ 하달 군체 변태 감지 // 아메바형 점성 육질 (관통 충격 흡수)';
  }
  ```
- **Test Result**: `ADV-MUTATION-02` confirmed that `alertBannerText` is set and persists for 4.0s, but uses Korean text (`⚠️ 하달 군체 변태 감지`) rather than the English string `⚠️ HIVE METAMORPHOSIS DETECTED` specified in `DISPATCH.md:20`.

---

## 2. Logic Chain

1. **Premise A (Speed Drag)**: In `HadalBioHorrors.ts:324`, `player.speed = 300 * speedRatio` is guarded by `if (n > 0)`. When all clingers detach (`n = 0`), the branch is skipped. Since `Player.ts:update` never resets `this.speed`, the reduction persists indefinitely.
   - *Inference*: Any player who gets latched by a parasite and shakes it off will suffer permanent sluggish movement for the rest of the game.

2. **Premise B (Execution Order in Siphoner)**: In `HadalBioHorrors.ts`, unit update routines run before collision checks. Siphoner's ingestion loop checks all bullets against `dist < currentSacRadius (24px)` and marks `b.isDead = true` without checking `b.piercing`. When `checkBulletCollisions` executes later in the same frame, it skips `b.isDead` bullets.
   - *Inference*: Piercing shots aimed at the center sac of a Spore Siphoner are swallowed without inflicting damage or triggering safe detonation.

3. **Premise C (Trigonometric Inversion in Shield Grid)**: In `AutomatonShieldGrid.ts:30`, `SHIELD_ARC_COS = 0.50`. The dot product condition `impactCos >= 0.50` equates to $\theta \le \arccos(0.50) = 60^\circ$. A bullet traveling at $50^\circ$ relative to the shield normal produces $\cos(50^\circ) \approx 0.6428 \ge 0.50$, registering as frontal deflection.
   - *Inference*: Players positioning at tactical flanking angles between $45^\circ$ and $60^\circ$ are penalized with full shield deflection, conflicting with the published $45^\circ$ flanking mechanic.

4. **Premise D (Inductive Stun Contract)**: `AutomatonShieldGrid.ts:279` sets `drone.stunTimer = 1.8;` and restores shields upon timer expiry (`AutomatonShieldGrid.ts:316–322`).
   - *Inference*: The player's reward window for breaking a resonant shield grid is halved from 3.5s to 1.8s, making phalanx recovery disproportionately fast.

5. **Premise E (EMP Target Inefficiency)**: `AutomatonPhalanx.ts:378` increments `player.suppressionLevel` by 40. In `Player.ts:153–164`, `suppressionLevel` only widens weapon inaccuracy spread and has zero effect on `currentFireRate`. Furthermore, no barricade variables are modified.
   - *Inference*: The EMP Prowler's stated role of stalling weapon fire and paralyzing barricade repair is completely absent in runtime gameplay.

---

## 3. Caveats

- **Kraken Prime Boss (Feature 10)**: The Apex Boss Kraken Prime subsystem resides in `KrakenPrimeBoss.ts` and has independent test coverage in `flagship_features.test.ts:879–939`. This review strictly scoped Features 8 & 9 (Hadal Bio-Horrors and Automaton Phalanx).
- **Audio Synthesis**: Procedural Web Audio synthesis (squelches, metallic deflections, EMP hum) is mocked out in the test harness (`playSpatialSound: () => {}`). Audio node graphs were inspected visually in code but not sampled through physical audio output devices.
- **Review-Only Constraint**: As an EMPIRICAL CHALLENGER under strict review-only constraints, no implementation fixes have been committed to source files. All findings are fully documented and reproducible via test suites.

---

## 4. Conclusion

Features 8 (Hadal Bio-Horrors) and 9 (Automaton Phalanx) are rich in vector visual effects and core gameplay concepts, but harbor **3 high-severity gameplay bugs**, **2 numerical specification deviations**, and **2 architectural telemetry/localization gaps**:

1. **High Severity Bug**: Permanent player speed penalty leak when shaking off Parasite Clingers (`HadalBioHorrors.ts:324`).
2. **High Severity Bug**: Spore Siphoner swallows piercing bullets and nullifies center hits due to pre-collision absorption (`HadalBioHorrors.ts:466`).
3. **High Severity Bug**: EMP Prowler fails to reduce player fire rate and fails to halt barricade repairs (`AutomatonPhalanx.ts:378`).
4. **Specification Discrepancy**: Flanking angle threshold requires $> 60^\circ$ instead of $> 45^\circ$ due to $\cos(60^\circ)=0.50$ math error (`AutomatonShieldGrid.ts:30`).
5. **Specification Discrepancy**: Inductive backlash stun timer set to 1.8s instead of 3.5s (`AutomatonShieldGrid.ts:279`).
6. **Telemetry Bias**: `FlagshipManager.onEnemyKilled` hardcodes `'kinetic'` damage for all enemy deaths (`FlagshipManager.ts:406`).
7. **Mechanic Gap**: Carapace Colossus frontal bone shield HP never depletes from non-piercing hits (`HadalBioHorrors.ts:649`).
8. **UI Discrepancy**: Epigenetic mutation alert banner is purely Korean without English token `⚠️ HIVE METAMORPHOSIS DETECTED` (`EpigeneticMutationEngine.ts:114`).

---

## 5. Verification Method

### Test Suite Execution
Run the dedicated empirical adversarial test suite containing all 23 test scenarios:
```bash
cd /Users/user/src/water-invader
npx playwright test tests/adversarial_stream_d_factions_combat.spec.ts
```
**Expected Result**: All 23 tests pass (Exit code: 0), isolating and confirming each verified behavior, edge case, and defect.

### Regression Verification
Verify zero regressions against existing flagship unit tests:
```bash
npx playwright test tests/unit/flagship_features.test.ts
```
**Expected Result**: 76 passed (Exit code: 0).

### Type Invariant Check
```bash
npx tsc --noEmit
```
**Expected Result**: Zero type errors in `tests/adversarial_stream_d_factions_combat.spec.ts`.

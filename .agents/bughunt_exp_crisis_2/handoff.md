# End-Game Crisis (12 Archetypes) Exhaustive Bug & Architecture Audit

**Author**: `bughunt_exp_crisis_2` (Read-Only Exploration Agent)  
**Target Files**:
- `src/game/crisis/types.ts`
- `src/game/crisis/DimensionalRift.ts`
- `src/game/crisis/CrisisSovereign.ts`
- `src/game/crisis/EndGameCrisis.ts`
- `src/game/GameManager.ts`

---

## 1. Observation

### 1.1 Invariant Verification: 5,200 EHP Balance Contract
- **Specification**: In `types.ts` (`CRISIS_ARCHETYPE_CONFIGS`, lines 171–341) and `COLLABORATION.md` (lines 34–38), every archetype is specified to have:
  $$\text{Total EHP} = 2 \times \text{riftHp (600)} + \text{sovereignHullHp (2500)} + \text{coreHp (1500)} = 5,200\text{ EHP}$$
- **Direct Code Inspection**:
  - `types.ts`: All 12 configuration objects in `CRISIS_ARCHETYPE_CONFIGS` (`VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`, `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, `NEBULA_PHANTASM`, `BIOMORPHIC_SWARM`, `SINGULARITY_CORE`, `NANITE_HARVESTER`, `PSIONIC_SHROUD`, `GLACIAL_OBLIVION`, `COSMIC_DEVOURER`) set `riftHp: 600`, `sovereignHullHp: 2500`, `coreHp: 1500`, and `enrageTime: 35.0`.
  - `EndGameCrisis.ts`: Lines 92, 100–101:
    ```typescript
    this.sovereign = new CrisisSovereign(sovereignX, sovereignY, this.archetype, 2500, 1500);
    const leftRift = new DimensionalRift(riftLeftX, riftY, 0, 600, this.archetype);
    const rightRift = new DimensionalRift(riftRightX, riftY, 1, 600, this.archetype);
    ```
    Values are instantiated with 2,500 Hull, 1,500 Core, and 2x 600 Anchors.
  - **Discrepancy 1A (`EndGameCrisis.getState()` under-reports total EHP)**:
    In `EndGameCrisis.ts` lines 1151–1154:
    ```typescript
    const hullHp = this.sovereign ? this.sovereign.hullHp : 0;
    const coreHp = this.sovereign ? this.sovereign.coreHp : 0;
    const totalHp = hullHp + coreHp;
    const maxHp = (this.sovereign ? this.sovereign.maxHullHp + this.sovereign.maxCoreHp : 4000);
    ```
    `totalHp` and `maxHp` return only 4,000 HP (Sovereign Hull + Core), entirely omitting the 1,200 HP from the 2 rift anchors.
  - **Discrepancy 1B (Hardcoded Instantiation)**:
    `EndGameCrisis.startIncursion()` uses hardcoded literals `2500`, `1500`, and `600` instead of referencing `CRISIS_ARCHETYPE_CONFIGS[this.archetype]`.
  - **Discrepancy 1C (Dynamic In-Combat EHP Divergence)**:
    - `NEBULA_PHANTASM` (`DimensionalRift.ts`: lines 158–160): When in shifted phase (`!isCoherentPhase`), incoming damage is scaled down by 80%: `effectiveDamage = Math.max(1, Math.floor(amount * 0.2))`. If shot during shifted phase, each 600 HP anchor absorbs up to 3,000 effective player damage ($2 \times 3,000 + 4,000 = 10,000$ combat EHP).
    - `NANITE_HARVESTER` (`DimensionalRift.ts`: lines 388–391): Living fabricators heal their sibling anchor by $+15\text{ HP/s}$, scaling encounter EHP dynamically over time.

---

### 1.2 Phase Transition Mechanics
- **Phase 1 (`PHASE_1_SHIELD`)**:
  - Sovereign is invulnerable (`isInvulnerable = true`).
  - Player bullets striking Sovereign trigger `sovereign.takeDamage(0)` (`EndGameCrisis.ts`: line 1028), which sets `shieldFlashTimer = 0.12` and destroys the bullet (`bullet.isDead = true`).
  - Active anchors channel animated shield conduits (`DimensionalRift.drawShieldConduit`).
  - Transition occurs when both anchors reach 0 HP (`!anyRiftAlive` in `EndGameCrisis.ts`: line 1014, and `activeRiftsCount === 0` in line 236).
- **Phase 2 (`PHASE_2_HULL`)**:
  - Shields collapse, Sovereign hull takes up to 2,500 damage.
  - Overkill damage does not bleed into Core HP (`CrisisSovereign.ts`: lines 160–168: `actualDmg = Math.min(this.hullHp, amount)`).
  - Automatically summons Allied Reinforcements (`GameManager.ts`: lines 330–332, 726–728).
  - Transitions to Phase 3 when `this.hullHp <= 0`.
- **Phase 3 (`PHASE_3_CORE`)**:
  - Core is exposed with 1,500 HP.
  - Enrage timer counts down from 35.0s (`CrisisSovereign.ts`: lines 212–219).
  - Cadence accelerates to 1.4s (`EndGameCrisis.ts`: line 462).
  - If `enrageTimer <= 0`, `sovereign.realityDistortionLevel = 1.0`.
  - Transitions to `DEFEATED` when `this.coreHp <= 0`.
- **Phase 4 (`DEFEATED`)**:
  - `transitionToPhase(CrisisPhase.DEFEATED)` sets `this.isActive = false`, triggers `callbacks.onDefeated`, and warps out allied reinforcements.

---

### 1.3 Critical Bug: Defeat Rewards Omission (`isActive = false` Deadlock)
- **Code Reference**:
  - `src/game/crisis/EndGameCrisis.ts`: Line 287:
    ```typescript
    else if (newPhase === CrisisPhase.DEFEATED) {
      this.bannerText = '✦ CATACLYSM AVERTED — CRISIS SOVEREIGN DESTROYED ✦';
      this.isActive = false;
      ...
    ```
  - `src/game/GameManager.ts`: Line 722:
    ```typescript
    // End-Game Crisis Incursion & Combat Update
    if (this.endGameCrisis && this.endGameCrisis.isActive) {
      this.endGameCrisis.update(deltaTime, this.player, this.bullets, this.particles, soundManager);
      ...
      // Defeat resolution: grant massive victory bonus (+2000 score, +500 cash)
      if (this.endGameCrisis.isDefeated()) {
        if (!this.endGameCrisisDefeatedHandled) {
          this.endGameCrisisDefeatedHandled = true;
          this.score += 2000;
          this.currency += 500;
          this.combo += 10;
          this.comboTimer = 5.0;
          this.updateScoreUI();
          this.createExplosion(this.logicalWidth / 2, 200, '#fbbf24', 120, 3.0);
          this.triggerScreenShake(1.2);
          soundManager.playVictory();
        }
      }
    }
    ```
  - `src/game/GameManager.ts`: Line 1139: `this.checkCollisions(deltaTime);`
  - `src/game/GameManager.ts`: Lines 1217–1241:
    ```typescript
    const isEndGameCrisisEngaged = this.endGameCrisis !== null && !this.endGameCrisis.isDefeated();
    if (this.state === GameState.PLAYING && remainingHostiles === 0 && !isEndGameCrisisEngaged ...) {
      this.state = GameState.SHOP;
      ...
      if (this.endGameCrisis && this.endGameCrisis.isDefeated()) {
        this.endGameCrisis = null;
        this.endGameCrisisDefeatedHandled = false;
        if (this.onEndGameCrisisEvent) this.onEndGameCrisisEvent(null);
      }
    ```
- **Direct Observation**:
  1. Player bullets strike and kill Sovereign Core during `checkCollisions()` (line 1139).
  2. `handleBulletCollision()` triggers `transitionToPhase(DEFEATED)`, which immediately sets `this.isActive = false;` (line 287).
  3. At the end of that frame, `checkCollisions()` finishes. Because `remainingHostiles === 0` (standard enemies were purged at crisis start) and `isEndGameCrisisEngaged` is false, `GameManager` immediately sets `this.state = GameState.SHOP` and destroys `this.endGameCrisis = null;` (line 1238).
  4. In the main update loop (line 722), `if (this.endGameCrisis && this.endGameCrisis.isActive)` is evaluated. Because `isActive` is `false` (and on subsequent frames `endGameCrisis` is `null`), lines 754–766 **NEVER RUN**.
  5. The player receives **0 victory score** (missing $+2,000$), **0 currency** (missing $+500\text{ 💧}$), **0 combo** (missing $+10$), no 120-particle celebration explosion, and no victory audio.
  6. Verified empirically in `tests/unit/challenger_crisis_empirical_stress.test.ts` lines 523–525.

---

### 1.4 Unhandled Attack Types in `executeArchetypeAttack`
- **Code Reference**: `src/game/crisis/EndGameCrisis.ts`: Lines 480–545
  - `CrisisArchetype.VOID_SOVEREIGN` (lines 481–503): Only spawns 5-way spread dark-matter bolts and flanking bolts. Has **no** `if (this.phase === CrisisPhase.PHASE_3_CORE)` block. Never executes `VOID_NOVA` (defined in `types.ts:39` and `COLLABORATION.md:19`).
  - `CrisisArchetype.ABYSSAL_LEVIATHAN` (lines 504–520): Only spawns 6-way spore spiral. Has **no** `if (this.phase === CrisisPhase.PHASE_3_CORE)` block. Never executes `BIO_LARVAE_SWARM` (defined in `types.ts:42` and `COLLABORATION.md:20`).
  - `CrisisArchetype.CYBERNETIC_EXTERMINATOR` (lines 521–545): Only spawns twin railgun and aimed center cluster. Has **no** `if (this.phase === CrisisPhase.PHASE_3_CORE)` block. Never executes `EMP_CASCADE` (defined in `types.ts:45` and `COLLABORATION.md:21`).
  - Archetypes 4–12 (`CHRONO_DEVOURER` through `COSMIC_DEVOURER`) all implement bespoke Phase 3 attacks (lines 550, 596, 642, 693, 739, 792, 839, 886, 932).
  - `switch (this.archetype)` contains no `default:` fallback at line 987.

---

### 1.5 Inert Properties & Callbacks
- **Code Reference**:
  - `EndGameCrisis.ts`: Line 40: `private activeAttack: CrisisAttackPattern | null = null;`. It is returned in `getState()` (line 1171) but is never assigned any value. Always `null`.
  - `CrisisSovereign.ts`: Line 39: `public activeAttack: CrisisAttackPattern | null = null;`. Never set or read.
  - `types.ts`: Line 349: `onAttackStart?: (attack: CrisisAttackPattern) => void;`. Never invoked anywhere in the codebase.
  - `types.ts`: Line 351: `onRealityDistortion?: (intensity: number) => void;`. Never invoked anywhere in the codebase.

---

### 1.6 Reality Distortion Desynchronization & Clamping Issues
- **Code Reference**:
  - `EndGameCrisis.ts`: Line 181:
    ```typescript
    this.realityDistortion = Math.min(1.0, (this.warningDuration - this.warningTimer) / this.warningDuration);
    ```
    - Lacks lower bound clamping `Math.max(0, ...)`. If `warningTimer > warningDuration`, value becomes negative.
    - When warning finishes, `this.realityDistortion = 1.0`.
    - It is **never reset to 0** upon transitioning to Phase 1, Phase 2, or Phase 3. It remains stuck at `1.0` permanently.
  - `CrisisSovereign.ts`: Line 217:
    ```typescript
    this.realityDistortionLevel = 1.0;
    ```
    - Set when enrage timer expires, but never copied to `EndGameCrisis.realityDistortion`.
    - Never read anywhere within `CrisisSovereign.ts` (e.g. `drawPhase3CoreAura` does not use it).
    - No visual shader, post-processing filter, or canvas distortion actually reads or renders `realityDistortion`.

---

### 1.7 Anchor Edge Cases: 0-Damage Bug, Physics & Duplicate Actions
- **0-Damage Bug on Shifted Pods**:
  In `DimensionalRift.ts` lines 158–160:
  ```typescript
  if (this.archetype === CrisisArchetype.NEBULA_PHANTASM && !this.isCoherentPhase) {
    effectiveDamage = Math.max(1, Math.floor(amount * 0.2));
  }
  ```
  Calling `takeDamage(0)` evaluates `Math.floor(0 * 0.2) = 0`, then `Math.max(1, 0) = 1`. A zero-damage hit deals 1 damage to shifted pods!
  Neither `DimensionalRift` nor `CrisisSovereign` guards against non-positive `amount` (`amount <= 0`).
- **Missing Sound Effects on Bullet-Triggered Transitions**:
  In `EndGameCrisis.ts` lines 1016 and 1045, `handleBulletCollision` invokes `this.transitionToPhase()` without passing `soundManager`. Consequently:
  - Shield break SFX does not play when destroying the final anchor.
  - Crisis alarm SFX does not play when destroying the hull.
  - Victory collapse audio does not play when destroying the core.
- **Duplicate Trail Processing**:
  In `DimensionalRift.ts` lines 496–550 (`COSMIC_DEVOURER`), both left and right anchors independently loop over all bullets and spawn duplicate fire trails at the exact same coordinates, doubling collision calculations.
- **Dual Gravity Model for Singularity Core**:
  `DimensionalRift.ts` lines 363–376 applies a constant, un-attenuated horizontal velocity ($[-50, +50]\text{ px/s}$) to player and bullets screen-wide, with hardcoded boundary `600 - player.size.width`. Simultaneously, `EndGameCrisis.ts` lines 345–382 applies a radial inverse-distance gravity pull/push.
- **Orphaned Anchors on Premature Boss Defeat**:
  If the Sovereign core dies while rift anchors are alive (`EndGameCrisis.ts`: line 285), the anchors are not marked `isDead = true`, causing `getActiveColliders()` to return orphaned living anchors after defeat.
- **startIncursion `prevPhase` Reporting**:
  `startIncursion` (`EndGameCrisis.ts`: line 133) invokes `this.callbacks.onPhaseChange(this.phase, CrisisPhase.DEFEATED)` with hardcoded `CrisisPhase.DEFEATED`, misreporting the previous phase if invoked mid-game.

---

## 2. Logic Chain

```
[Observation 1.3: Fatal core hit occurs during checkCollisions()]
      │
      ▼
[handleBulletCollision() calls transitionToPhase(DEFEATED)]
      │
      ▼
[transitionToPhase(DEFEATED) sets this.isActive = false]
      │
      ▼
[checkCollisions() ends; GameManager sees remainingHostiles===0 and isEndGameCrisisEngaged===false]
      │
      ▼
[GameManager sets this.state = GameState.SHOP and this.endGameCrisis = null]
      │
      ▼
[Next frame: GameManager.update() line 722 checks if (endGameCrisis && endGameCrisis.isActive)]
      │
      ├──────────────────────────────┬──────────────────────────────┐
      ▼                              ▼                              ▼
[isActive is false]        [endGameCrisis is null]         [state is GameState.SHOP]
      │                              │                              │
      └──────────────────────────────┴──────────────────────────────┘
                                     │
                                     ▼
                  [Lines 754-766 are NEVER reached]
                                     │
                                     ▼
     [+2000 Score, +500 Currency, +10 Combo, Explosion, Fanfare DROPPED]
```

```
[Observation 1.4: types.ts defines VOID_NOVA, BIO_LARVAE_SWARM, EMP_CASCADE]
      │
      ▼
[EndGameCrisis.executeArchetypeAttack() switch statement inspected]
      │
      ▼
[Cases 1, 2, 3 have NO if (this.phase === CrisisPhase.PHASE_3_CORE)]
      │
      ▼
[Cases 1, 2, 3 repeat Phase 2 weapon definitions during Phase 3]
      │
      ▼
[Phase 3 super-weapons for first 3 archetypes are never executed]
```

```
[Observation 1.6: Incursion warning runs for 3.0s]
      │
      ▼
[realityDistortion ramps to 1.0 at line 181]
      │
      ▼
[Transition to PHASE_1_SHIELD occurs at warningTimer <= 0]
      │
      ▼
[realityDistortion is never reset or updated in Phase 1, 2, 3]
      │
      ▼
[EndGameCrisis.getState().realityDistortion is permanently 1.0]
      │
      ▼
[Sovereign.realityDistortionLevel is set to 1.0 at line 217, but never synced]
```

---

## 3. Caveats

1. **Read-Only Scope**: In strict accordance with the explorer agent archetype, no source files were modified. All defects are documented with precise line numbers and drop-in code fixes.
2. **Existing Unit Test Coverage**: `tests/unit/challenger_crisis_empirical_stress.test.ts` was written by an adversarial challenger and intentionally asserts the presence of Bug 1.3 (`expect(gm.endGameCrisisDefeatedHandled).toBe(false)`). When fixing Bug 1.3, this specific test expectation will need to be inverted to `expect(gm.endGameCrisisDefeatedHandled).toBe(true)`.
3. **Canvas 2D vs WebGL Shaders**: "Reality distortion shader" in this HTML5 Canvas architecture refers to Canvas 2D radial gradient vignettes, particle turbulence, and coordinate warping, as the game does not use a WebGL fragment shader pipeline.

---

## 4. Conclusion

The 12 End-Game Crisis archetypes subsystem features exceptional Canvas 2D procedural rendering, complete architectural symmetry across all 12 archetypes, and conforms nominally to the 5,200 EHP contract ($2 \times 600 + 2500 + 1500 = 5,200$).

However, **7 distinct bugs and design anomalies** must be resolved by the implementation team:
1. **CRITICAL**: Defeat rewards (+2,000 score, +500 currency, +10 combo, fanfare) are dropped due to the `isActive = false` update gate deadlock.
2. **HIGH**: Archetypes 1 (`VOID_SOVEREIGN`), 2 (`ABYSSAL_LEVIATHAN`), and 3 (`CYBERNETIC_EXTERMINATOR`) lack Phase 3 bespoke attacks in `executeArchetypeAttack`.
3. **MEDIUM**: `activeAttack`, `onAttackStart`, and `onRealityDistortion` are completely inert dead-code constructs.
4. **MEDIUM**: `realityDistortion` remains stuck at `1.0` after incursion and lacks bidirectional synchronization between `CrisisSovereign` and `EndGameCrisis`.
5. **MEDIUM**: `EndGameCrisis.getState().totalHp` reports 4,000 instead of 5,200 during Phase 1, and `startIncursion` uses hardcoded instantiation literals.
6. **LOW**: `DimensionalRift.takeDamage` deals 1 damage on `amount = 0` for shifted `NEBULA_PHANTASM` pods and lacks non-positive damage guards.
7. **LOW**: `handleBulletCollision` lacks a `soundManager` reference, causing audio dropout on phase transitions.

---

## 5. Verification Method & Concrete Fix Recommendations

### 5.1 Verification Commands
1. Run crisis unit tests:
   ```bash
   npx playwright test tests/unit/crisis_expansion_12.test.ts tests/unit/crisis_distribution_12.test.ts tests/unit/challenger_crisis_empirical_stress.test.ts
   ```
2. Run full unit suite:
   ```bash
   npx playwright test tests/unit/
   ```
3. Type-check:
   ```bash
   npx tsc --noEmit
   ```

---

### 5.2 Recommended Code Fixes

#### Fix 1: Resolve Defeat Reward Payout Deadlock (`src/game/GameManager.ts`)
**Target**: `src/game/GameManager.ts` (lines 337–344 and lines 754–766)  
Award the rewards inside the `onDefeated` callback or before `isActive = false`:
```typescript
// In GameManager.ts triggerEndGameCrisis:
onDefeated: (_arch) => {
  if (!this.endGameCrisisDefeatedHandled) {
    this.endGameCrisisDefeatedHandled = true;
    this.score += 2000;
    this.currency += 500;
    this.combo += 10;
    this.comboTimer = 5.0;
    this.updateScoreUI();
    this.createExplosion(this.logicalWidth / 2, 200, '#fbbf24', 120, 3.0);
    this.triggerScreenShake(1.2);
    soundManager.playVictory();
  }
  if (this.alliedReinforcements && !this.alliedReinforcements.isWarpingOut) {
    this.alliedReinforcements.warpOut();
  }
  if (this.onEndGameCrisisEvent && this.endGameCrisis) {
    this.onEndGameCrisisEvent(this.endGameCrisis.getState());
  }
}
```

#### Fix 2: Implement Phase 3 Attacks for Archetypes 1, 2, 3 (`src/game/crisis/EndGameCrisis.ts`)
**Target**: `src/game/crisis/EndGameCrisis.ts` (lines 481–545)
```typescript
case CrisisArchetype.VOID_SOVEREIGN:
  if (soundManager) soundManager.playDarkMatterBeam();
  if (this.phase === CrisisPhase.PHASE_3_CORE) {
    // Phase 3: VOID_NOVA (12-way starburst)
    const numBolts = 12;
    for (let i = 0; i < numBolts; i++) {
      const ang = (i * Math.PI * 2) / numBolts + this.attackPhaseTime * 1.5;
      const speed = 240;
      const b = new Bullet(core.x, core.y, Math.sin(ang) * speed, 2, false);
      b.velocity.x = Math.cos(ang) * speed;
      b.color = '#c084fc';
      b.isInterceptable = true;
      bullets.push(b);
    }
  } else {
    // Existing Phase 2 5-way spread...
  }
  break;

case CrisisArchetype.ABYSSAL_LEVIATHAN:
  if (soundManager) soundManager.playAcidStormSound();
  if (this.phase === CrisisPhase.PHASE_3_CORE) {
    // Phase 3: BIO_LARVAE_SWARM (Hyper-dense 12-spore spiral)
    const numSpores = 12;
    for (let i = 0; i < numSpores; i++) {
      const baseAng = this.attackPhaseTime * 2.5 + (i * Math.PI * 2) / numSpores;
      const speed = 210;
      const b = new Bullet(core.x, core.y, Math.sin(baseAng) * speed, 1, false);
      b.velocity.x = Math.cos(baseAng) * speed;
      b.color = '#84cc16';
      b.isInterceptable = true;
      bullets.push(b);
    }
  } else {
    // Existing Phase 2 spore spiral...
  }
  break;

case CrisisArchetype.CYBERNETIC_EXTERMINATOR:
  if (soundManager) soundManager.playRogueShoot();
  if (this.phase === CrisisPhase.PHASE_3_CORE) {
    // Phase 3: EMP_CASCADE (Tri-directional high-velocity rail bursts)
    for (let i = -2; i <= 2; i++) {
      const rail = new Bullet(core.x + i * 20, core.y, 400, 2, false);
      rail.velocity.x = i * 60;
      rail.color = '#ef4444';
      rail.isInterceptable = true;
      bullets.push(rail);
    }
  } else {
    // Existing Phase 2 dual railguns...
  }
  break;
```

#### Fix 3: Sync & Clamp Reality Distortion (`src/game/crisis/EndGameCrisis.ts`)
**Target**: `src/game/crisis/EndGameCrisis.ts` (lines 181, 263, 1169)
```typescript
// In INCURSION:
this.realityDistortion = Math.max(0, Math.min(1.0, (this.warningDuration - this.warningTimer) / this.warningDuration));

// In transitionToPhase:
if (newPhase === CrisisPhase.PHASE_1_SHIELD) {
  this.realityDistortion = 0.0;
}

// In getState():
realityDistortion: this.phase === CrisisPhase.INCURSION 
  ? this.realityDistortion 
  : (this.sovereign ? this.sovereign.realityDistortionLevel : 0),
```

#### Fix 4: Fix 0-Damage Bug and Input Guard in `DimensionalRift.ts`
**Target**: `src/game/crisis/DimensionalRift.ts` (lines 153–161)
```typescript
public takeDamage(amount: number, _piercing?: number): number {
  if (amount <= 0 || this.isDead || this.isInvulnerable) return 0;

  let effectiveDamage = amount;
  if (this.archetype === CrisisArchetype.NEBULA_PHANTASM && !this.isCoherentPhase) {
    effectiveDamage = Math.max(1, Math.floor(amount * 0.2));
  }
  ...
```

#### Fix 5: Include Anchor HP in `EndGameCrisis.getState()`
**Target**: `src/game/crisis/EndGameCrisis.ts` (lines 1150–1155)
```typescript
public getState(): EndGameCrisisState {
  const hullHp = this.sovereign ? this.sovereign.hullHp : 0;
  const coreHp = this.sovereign ? this.sovereign.coreHp : 0;
  const riftHp = this.riftAnchors.reduce((sum, r) => sum + (r.isDead ? 0 : r.hp), 0);
  const totalHp = hullHp + coreHp + riftHp;
  const maxHp = (this.sovereign ? this.sovereign.maxHullHp + this.sovereign.maxCoreHp : 4000) + 1200;
  ...
```

#### Fix 6: Clean Up Anchors on Sovereign Defeat
**Target**: `src/game/crisis/EndGameCrisis.ts` (lines 286–295)
```typescript
else if (newPhase === CrisisPhase.DEFEATED) {
  this.bannerText = '✦ CATACLYSM AVERTED — CRISIS SOVEREIGN DESTROYED ✦';
  this.isActive = false;
  for (const rift of this.riftAnchors) {
    rift.hp = 0;
    rift.isDead = true;
    rift.isShielding = false;
  }
  ...
```

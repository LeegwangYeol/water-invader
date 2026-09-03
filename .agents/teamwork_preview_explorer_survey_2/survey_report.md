# Comprehensive Investigation & Architectural Survey Report: Extreme Difficulty Rebalancing & Screen-Overwhelming Crisis Events (Stage 10+)

**Author**: Explorer Survey Agent 2  
**Date**: 2026-08-31  
**Project**: Water Invader Extreme Difficulty Rebalancing & Event Scripting (`water-invader`)  
**Target Focus**:
1. Wave generation, progression, boss spawns, and dynamic formations in `src/game/GameManager.ts`, `src/game/Enemy.ts`, `src/components/game-canvas.tsx`.
2. Mid-wave incursions, Rogue faction airdrops, and warning banners/audio alerts.
3. Architecture for Emergency Waves & Screen-Overwhelming Crisis Events starting from Stage 10 (R2) without breaking existing wave clear logic.

---

## Executive Summary

An exhaustive analysis of the `water-invader` codebase was conducted across core engine files (`GameManager.ts`, `Enemy.ts`, `Player.ts`, `Barricade.ts`, `Helper.ts`, `Bullet.ts`, `SoundManager.ts`, `game-canvas.tsx`) and the test suite (`tests/`).

### Key Discoveries:
1. **The Max-Level Player Balance Disconnect**:
   - A fully upgraded player achieves:
     - **Fire Rate**: 0.1s interval (10 shots/sec)
     - **Stress Overdrive**: Up to 3.0x multiplier under combat pressure (effective interval ~0.033s = 30 bursts/sec)
     - **Multi-Shot**: 5 spread projectiles per burst
     - **Piercing**: 5 penetrations per projectile
     - **Theoretical Damage Output**: $30 \times 5 \times 5 = 750\text{ potential hits/sec}$ (or $150\text{ raw dps}$ on single target, up to $750\text{ dps}$ against hordes).
     - **Support & Cover**: 5 HP, Ultimate "Heavy Rain" (30 piercing projectiles), summoned Helper drones (Fighter, Tank, Repairer), and 4 barricades (2 indestructible stone, 2 destructible ice).
   - In contrast, existing Stage 10 enemy HP scales via `1 + Math.floor(level / 3)`:
     - At Wave 10, standard enemies possess only **4 HP**!
     - Max-level player projectiles eliminate entire enemy waves in under 0.2 seconds.
2. **Current Formation & Incursion Bottlenecks**:
   - Spawns only occur via regular grid matrices (`rows = 3..5, cols = 6..8`) and 4 static incursion presets (`FLANK`, `SPEARHEAD`, `ROGUE_INCURSION`, `3WAY_CLASH`).
   - Wave clear logic in `GameManager.ts:594` strictly requires `remainingHostiles === 0 && warningTimer <= 0 && pendingReinforcement === null`. Any mid-wave crisis must seamlessly plug into this hostiles-tracking model to prevent infinite soft-locks or premature shop transitions.
3. **Stage 10+ Crisis Architecture Solution**:
   - Introduces a modular **Crisis Director Subsystem** featuring 5 crisis archetypes: *Titan Bio-Mech Escort Horde*, *Toxic Acid Rain Hazard*, *Swarm Diver Blitz*, *EMP Overcharge Disruption*, and *3-Way Total War*.
   - Implements exponential mathematical health and resistance curves for Stage 10+ entities to restore authentic high-stakes survival tension.

---

## Section 1: In-Depth Investigation of Wave Generation, Progression, and Boss Formations

### 1.1 Wave Progression Lifecycle & Flow
The wave progression pipeline is governed by `GameManager.ts`:
- **State Initialization**: When `startNextWave()` (`GameManager.ts:172-190`) is invoked, `this.level` is incremented, and `this.spawnWave()` is called.
- **Wave Clear Detection** (`GameManager.ts:586-602`):
  ```typescript
  // Multi-Faction Wave Clear Logic: only clears when all hostile Invaders and Rogues are destroyed
  let remainingHostiles = 0;
  for (let i = 0; i < this.enemies.length; i++) {
    const e = this.enemies[i];
    if (!e.isDead && (e.faction === Faction.INVADER || e.faction === Faction.ROGUE)) {
      remainingHostiles++;
    }
  }
  if (this.state === GameState.PLAYING && remainingHostiles === 0 && this.warningTimer <= 0 && this.pendingReinforcement === null) {
    this.state = GameState.SHOP;
    this.warningTimer = 0;
    this.warningMessage = "";
    this.warningText = "";
    if (this.onStateChange) this.onStateChange(this.state);
    this.pause();
  }
  ```

### 1.2 Grid Generation & Unit Composition (`GameManager.ts:218-250`)
```typescript
private spawnWave() {
  if (this.level % 5 === 0) {
    // Boss wave
    const boss = new Enemy(this.logicalWidth / 2 - 75, 90, this.logicalWidth, this.level, EnemyType.BOSS, this.logicalHeight);
    this.enemies.push(boss);
    return;
  }

  const rows = Math.min(5, 3 + Math.floor(this.level / 4));
  const cols = Math.min(8, 6 + Math.floor(this.level / 3));
  const paddingX = 60;
  const paddingY = 50;
  const offsetX = Math.max(20, (this.logicalWidth - ((cols - 1) * paddingX)) / 2);
  
  let specialCount = 0;
  const maxSpecials = Math.max(1, Math.min(1 + Math.floor(this.level / 2), 4));
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let type = EnemyType.NORMAL;
      if (r === 1 && c % 2 === 0) {
        type = EnemyType.ZIGZAG;
      } else if (specialCount < maxSpecials && Math.random() > 0.85) {
        const specials = [EnemyType.SNIPER, EnemyType.DIVER, EnemyType.SHIELDED, EnemyType.SPLITTER];
        type = specials[Math.floor(Math.random() * specials.length)];
        specialCount++;
      }
      this.enemies.push(new Enemy(offsetX + c * paddingX, 80 + r * paddingY, this.logicalWidth, this.level, type, this.logicalHeight));
    }
  }
}
```

### 1.3 Enemy Scaling Parameters (`Enemy.ts:53-137`)

| Unit Type | Base HP Formula | Wave 1 HP | Wave 5 HP | Wave 10 HP (Current) | Speed Characteristics | Faction |
|---|---|---|---|---|---|---|
| **NORMAL** | `1 + Math.floor(level / 3)` | 1 HP | 2 HP | 4 HP | $30 + \text{level} \times 5$ px/s | INVADER |
| **ZIGZAG** | `Math.max(1, hp - 1)` | 1 HP | 1 HP | 3 HP | $80 + \text{level} \times 10$ px/s | INVADER |
| **SNIPER** | `Math.max(1, hp - 1)` | 1 HP | 1 HP | 3 HP | 20 px/s (Static Long-Range) | INVADER |
| **DIVER** | `1 + Math.floor(level / 3)` | 1 HP | 2 HP | 4 HP | Dives at $\ge 280$ px/s on proximity | INVADER |
| **SHIELDED** | `1 + Math.floor(level / 3)` + 3 Shield | 1+3 HP | 2+3 HP | 4+3 HP | Standard Speed, 5s Shield Regen | INVADER |
| **SPLITTER** | `1 + Math.floor(level / 3)` | 1 HP | 2 HP | 4 HP | Spawns 2 Minis on Death | INVADER |
| **BOSS** | $\text{level} \times 10$ | N/A | 50 HP | 100 HP | $30 + \text{level} \times 2$ px/s, Titan Chassis | INVADER |
| **ROGUE_DRONE** | $1 + \lfloor(\text{level}-1)/4\rfloor$ | 1 HP | 2 HP | 3 HP | $50 + \text{level} \times 6$ px/s, Evasive | ROGUE |
| **ROGUE_STALKER**| $2 + \lfloor(\text{level}-1)/2\rfloor$ | 2 HP | 4 HP | 6 HP | $30 + \text{level} \times 4$ px/s, Tracking AI | ROGUE |
| **ROGUE_MECH** | $4 + \lfloor(\text{level}-1) \times 1.5\rfloor$ | 4 HP | 10 HP | 17 HP | $18 + \text{level} \times 2$ px/s, Piercing Lasers | ROGUE |

### 1.4 Stage 10+ Aggression Mechanism (`Enemy.ts:69-75, 178-206`)
- When `level >= 10`:
  - `isAggressive = true` and `aggressionMode = true`.
  - `rushVelocityModifier = 1.8 + Math.min(1.2, (level - 10) * 0.15)` (Scaling from 1.8x to 3.0x).
  - **Directional Homing**: Drifts horizontally toward `player.position.x` at `homingStrength = Math.min(45, 25 + (level - 10) * 3)` px/s.
  - **Surge Charging**: Every 1.5–4.0s, triggers a high-velocity downward surge of `chargeSurgeY = Math.max(60, 40 + (level - 10) * 6)` px/s for 0.8s.

---

## Section 2: Incursion and Event Systems Deep Dive

### 2.1 Mid-Wave Event Director Architecture (`GameManager.ts:369-444`)
The mid-wave incursion system operates via a continuous state timer in `update(deltaTime)`:

```
[Wave Starts] --> reinforcementTimer initialized (8-16s)
                       |
                       v
         [reinforcementTimer <= 0]
                       |
        +--------------+--------------+
        |                             |
 (20% Chance)                  (80% Chance)
        |                             |
[pendingReinforcement = 'ALLY'] [pendingReinforcement = Chosen Incursion]
        |                             |
[warningTimer = 2.0s]          [warningTimer = 2.0s]
[Screen Tint: Green]           [Screen Tint: Lime/Red]
[playPowerUp()]                [playThirdFactionWarning()]
        |                             |
        +--------------+--------------+
                       |
              [warningTimer <= 0]
                       |
        [spawnDynamicReinforcement()]
        [pendingReinforcement = null]
```

### 2.2 Incursion Presets Catalog (`GameManager.ts:252-315`)

1. **`FLANK` Incursion**:
   - Spawns $2 + \lfloor\text{level} / 3\rfloor$ (max 3) pairs.
   - Left side: `EnemyType.ROGUE_DRONE` entering from $x=10$ with positive velocity $+35 + \text{level} \times 3$.
   - Right side: `EnemyType.ZIGZAG` entering from $x=\text{logicalWidth}-50$ with negative velocity $-35 - \text{level} \times 3$.
2. **`SPEARHEAD` / `V_FORMATION`**:
   - Spawns a 5-ship wedge formation centered horizontally.
   - Apex ($x=\text{center}, y=80$): `EnemyType.ROGUE_MECH` (Level $+2$).
   - Left Wing ($y=125, y=170$): `ROGUE_STALKER`, `ROGUE_DRONE`.
   - Right Wing ($y=125, y=170$): `ROGUE_DRONE`, `ROGUE_STALKER`.
3. **`ROGUE_INCURSION` / `CHAOTIC_AIRDROP`**:
   - Spawns $3 + \lfloor\text{level} / 3\rfloor$ (max 5) units evenly spaced across canvas width ($x=50 \dots 550$).
   - Staggered $y$ offsets ($80\text{px}, 110\text{px}$) with alternating Drone, Stalker, Mech composition.
4. **`3WAY_CLASH`**:
   - Spawns $2 + \lfloor\text{level} / 4\rfloor$ pairs.
   - Left ($x=40$): `EnemyType.ZIGZAG`, `Faction.INVADER`.
   - Right ($x=\text{logicalWidth}-85$): `EnemyType.ROGUE_STALKER`, `Faction.ROGUE`.

### 2.3 Audio & Visual Warning Alert Pipeline
- **Visual Alert Rendering (`GameManager.ts:1104-1121`)**:
  - Full-screen flashing alpha overlay:
    - Rogue / 3-Way: `rgba(132, 204, 22, 0.25)` (Neon Lime)
    - Ally: `rgba(0, 255, 0, 0.2)` (Emerald)
    - Invader: `rgba(255, 0, 0, 0.3)` (Crimson)
  - Alternating strobed 36px bold text banner centered on screen with 4px black outline stroke.
- **Audio Synthesizer Alert (`SoundManager.ts:248-279`)**:
  - Web Audio API sawtooth oscillator frequency sweep:
    $880\text{Hz} \rightarrow 587\text{Hz} \rightarrow 880\text{Hz} \rightarrow 587\text{Hz} \rightarrow 440\text{Hz}$ over 0.6s with exponential decay envelope.

---

## Section 3: Architecture for Emergency Waves & Screen-Overwhelming Crisis Events (Stage 10+)

### 3.1 The Difficulty Deficit at Stage 10+
To quantify why a max-level player is currently near-invincible, we compare Player DPS vs Enemy Health Pool:

$$\text{Player DPS} = \frac{1}{\text{FireRate}} \times \text{MultiShot} \times \text{DamagePerBullet} \times \text{Piercing}$$
$$\text{At Max Upgrade: } \text{DPS}_{\text{burst}} = \frac{1}{0.033\text{s}} \times 5 \times 1 \times 5 = 750\text{ effective hits/sec}$$

A wave of 40 Invaders with 4 HP each represents a total health pool of only **160 HP**. The player clears the entire wave in **0.21 seconds**!

### 3.2 Stage 10+ Extreme Scaling Model (R1 Recommendation)

To create genuine tactical pressure for maxed players, we propose the following scaling rebalance starting at Stage 10:

```typescript
// Proposed Rebalanced HP Formula
if (this.level < 10) {
  this.hp = 1 + Math.floor(this.level / 3);
} else {
  // Stage 10+: Exponential baseline matching player's 50-750 DPS
  const stageOver = this.level - 10;
  if (type === EnemyType.BOSS) {
    this.hp = 120 + stageOver * 40; // Wave 10: 120 HP, Wave 15: 320 HP, Wave 20: 520 HP
  } else if (type === EnemyType.ROGUE_MECH) {
    this.hp = 18 + stageOver * 5;  // Wave 10: 18 HP, Wave 15: 43 HP
  } else if (type === EnemyType.SHIELDED) {
    this.hp = 8 + stageOver * 2;
    this.shieldHp = 8 + stageOver * 2; // Shield absorbs 8-18 damage
  } else if (type === EnemyType.DIVER) {
    this.hp = 6 + stageOver * 2;
  } else {
    this.hp = 6 + Math.floor(stageOver * 1.5); // Wave 10: 6 HP, Wave 15: 13 HP, Wave 20: 21 HP
  }
}
```

### 3.3 Crisis Event Architecture Specification (R2 Recommendation)

We recommend structuring Emergency Crises through a dedicated `CrisisState` interface and event catalog in `GameManager.ts`:

```typescript
export interface CrisisState {
  isActive: boolean;
  type: 'TITAN_ESCORT' | 'ACID_STORM' | 'SWARM_BLITZ' | 'EMP_OVERCHARGE' | 'TOTAL_WAR' | null;
  durationTimer: number;
  intensity: number;
  hazardTimer: number;
  warningText: string;
}
```

#### Proposed Crisis Catalog (Stage 10+):

```
+-----------------------------------------------------------------------------------+
|                           STAGE 10+ CRISIS CATALOG                               |
+=====================+======================================+======================+
| Crisis Event Name   | Spawning & Mechanical Dynamics       | Visual / Audio Cue   |
+=====================+======================================+======================+
| 1. TITAN BIO-MECH   | Triggered on Wave 10, 15, 20.        | Flashing Crimson/Gold|
|    ESCORT HORDE     | Spawns Boss (120-520 HP) escorted by | Klaxon Siren +       |
|                     | 6 Rogue Mechs + 8 Dive Bombers in    | "EMERGENCY: TITAN    |
|                     | dual-flank pincer formation.         | ESCORT HORDE!"       |
+---------------------+--------------------------------------+----------------------+
| 2. TOXIC ACID STORM | 30-50 Acid rain hazard droplets drop | Acid Green Tint +    |
|    HAZARD           | at 350 px/s from canvas top over 5s. | Hissing WebAudio FX +|
|                     | Damages player & erodes barricades.  | "HAZARD: ACID STORM!"|
+---------------------+--------------------------------------+----------------------+
| 3. SWARM DIVER      | 16-24 Divers spawn in rapid 4-wave   | Strobe Red Overlay + |
|    BLITZ            | cascade (4x4 formation) charging     | Rapid Dive Siren +   |
|                     | at 320 px/s directly at player.      | "ALERT: DIVER BLITZ!"|
+---------------------+--------------------------------------+----------------------+
| 4. EMP OVERCHARGE   | High-frequency EMP wave triggers     | Cyan/Blue Strobe +   |
|    DISRUPTOR        | max suppression (100%) on player,    | Electrical Hum FX +  |
|                     | increasing bullet spread for 4.0s.   | "WARNING: EMP PULSE!"|
+---------------------+--------------------------------------+----------------------+
| 5. 3-WAY TOTAL WAR  | 10 Invader Snipers + 10 Rogue Mechs  | Yellow/Lime Split +  |
|    CROSSFIRE SURGE  | drop simultaneously on opposite      | Battle Clash FX +    |
|                     | flanks, creating 100+ bullet hell.   | "CRISIS: TOTAL WAR!" |
+---------------------+--------------------------------------+----------------------+
```

### 3.4 Integration & Wave Clear Safety Guard

To prevent state desynchronization, premature shop transitions, or lingering phantom entities:
1. **Hostile Registration**: Every crisis-spawned enemy must instantiate with a valid `Faction.INVADER` or `Faction.ROGUE`.
2. **Hazard Bullets**: Environmental hazards (e.g. Acid Rain) instantiate as `Bullet` objects tagged with `Faction.INVADER` and velocity $v_y > 0$.
3. **State Guard**:
   ```typescript
   const isCrisisActive = this.crisisState && this.crisisState.isActive;
   if (this.state === GameState.PLAYING && remainingHostiles === 0 && this.warningTimer <= 0 && this.pendingReinforcement === null && !isCrisisActive) {
     this.state = GameState.SHOP;
     // Cleanup crisis timers
     this.resetCrisisState();
     this.pause();
   }
   ```
4. **Intermission Reset**: `startNextWave()` must explicitly reset `this.crisisState` and all temporary alert flags.

---

## Section 4: Telemetry & Automated Verification Strategy (R3 & R4)

### 4.1 Integration with Existing Test Infrastructure
The project contains established testing frameworks:
- `tests/benchmark/automated_runner.spec.ts`: Executes 10 automated test runs with heuristic bot telemetry (`RunTelemetry`, `BenchmarkReport`).
- `tests/stress/endless_survival_swarm.spec.ts`: Autonomous survival bot using 1D potential field raymarching.
- `tests/tier5_adversarial_combat.spec.ts` & `tests/tier5_adversarial_reinforcements.spec.ts`: 200+ projectile collision stress tests.

### 4.2 Recommended Verification Test Cases for Implementation Phase
1. **Mathematical Stage 10+ Threat Oracle**:
   - Run max-upgraded bot against Stage 10. Verify average player damage taken $> 0$ and survival requires active tactical movement.
2. **Emergency Crisis Spawn Assertion**:
   - Verify at least one Emergency Crisis triggers during Stage 10+ wave progression.
   - Assert `warningTimer > 0`, `warningMessage` matches crisis type, and sound dispatcher is called.
3. **Zero-Lag 100-Entity Particle Bound Assertion**:
   - Under 50+ enemy crisis horde + 150 bullets, assert FPS $\ge 55$ and particle pooling remains $\le 500$.
4. **Wave Clear Guarantee**:
   - Verify that Stage 10+ emergency waves advance cleanly to Stage 11 Shop once all hostile units are neutralized.

---

## Conclusion & Recommendations

1. **Architecture is Fully Feasible**: The existing `GameManager` loop and in-place entity compaction provide an excellent foundation. Stage 10+ Emergency Waves can be introduced with zero breaking changes to previous stages (Waves 1–9).
2. **Deterministic & Safe**: By leveraging the existing `remainingHostiles` counter and `warningTimer` guard, crisis scripting will remain 100% compliant with existing multi-wave progression tests.
3. **Readiness**: All findings and design formulas are compiled and ready for implementation upon explicit user authorization.

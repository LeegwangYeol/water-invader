# Handoff Report: Water Invader Wave, Enemy AI, and Dynamic Reinforcement Spawning System

**Author**: Survey Explorer 2  
**Working Directory**: `/Users/a7111/src/water-invader/.agents/teamwork_preview_explorer_survey_2`  
**Date**: 2026-08-26  
**Objective**: Comprehensive investigation of the Wave/Spawner/Reinforcement systems, Enemy types/stats/AI, and formulation of an architectural blueprint for a 3-way battle system with dynamic, unpredictable reinforcements.

---

## 1. Observation

Direct code observations from the Water Invader codebase across all primary subsystems:

### 1.1 Wave Lifecycle & Grid Spawner Mechanics
* **Location**: `src/game/GameManager.ts` (lines 202–235, 424–428, 162–175)
* **Initial Wave Generation**:
  ```typescript
  // GameManager.ts lines 202-235
  private spawnWave() {
    if (this.level % 5 === 0) {
      // Boss wave (F-13: spawn Y lowered to 90)
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
    const maxSpecials = Math.max(1, Math.min(1 + Math.floor(this.level / 2), 4)); // 1~2 early on, cap at 4
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = EnemyType.NORMAL;
        
        if (r === 1 && c % 2 === 0) {
          type = EnemyType.ZIGZAG; // keep some zigzags
        } else if (specialCount < maxSpecials && Math.random() > 0.85) {
          const specials = [EnemyType.SNIPER, EnemyType.DIVER, EnemyType.SHIELDED, EnemyType.SPLITTER];
          type = specials[Math.floor(Math.random() * specials.length)];
          specialCount++;
        }
        
        // F-13: Spawn Y offset at 80 so enemies and bullets do not emerge behind top HUD overlay cards
        this.enemies.push(new Enemy(offsetX + c * paddingX, 80 + r * paddingY, this.logicalWidth, this.level, type, this.logicalHeight));
      }
    }
  }
  ```
* **Wave Progression Math**:
  - `rows`: bounded in `[3, 5]` via `Math.min(5, 3 + Math.floor(level / 4))`
  - `cols`: bounded in `[6, 8]` via `Math.min(8, 6 + Math.floor(level / 3))`
  - Total grid count: `18` (Wave 1: 3x6) to `40` (Wave 8+: 5x8)
  - `maxSpecials`: `Math.max(1, Math.min(1 + Math.floor(level / 2), 4))` (1 at Wave 1, up to 4 at Wave 6+)
  - Boss frequency: Solitary boss every 5th wave (`level % 5 === 0`), HP = `level * 10`
* **Wave Completion & State Transition**:
  - `GameManager.ts` lines 424–428:
    ```typescript
    if (this.state === GameState.PLAYING && this.enemies.length === 0 && this.warningTimer <= 0) {
      this.state = GameState.SHOP;
      if (this.onStateChange) this.onStateChange(this.state);
      this.pause();
    }
    ```
  - Intermission transition (`startNextWave()`): sets `this.level++`, `this.state = GameState.PLAYING`, calls `this.spawnWave()`, restarts `requestAnimationFrame(this.loop)`.

### 1.2 Current Reinforcement Subsystem
* **Location**: `src/game/GameManager.ts` (lines 36–41, 276–314, 860–870)
* **Variables**:
  - `reinforcementTimer: number = 10;`
  - `warningTimer: number = 0;`
  - `warningMessage: string = "";`
  - `pendingReinforcement: 'ENEMY' | 'ALLY' | null = null;`
* **Cadence & Execution**:
  ```typescript
  // GameManager.ts lines 276-314
  if (this.warningTimer > 0) {
    this.warningTimer -= deltaTime;
    if (this.warningTimer <= 0 && this.pendingReinforcement) {
      if (this.pendingReinforcement === 'ENEMY') {
        for (let i = 0; i < 4; i++) {
           this.enemies.push(new Enemy(50 + i * 100, 80, this.logicalWidth, this.level + 2, EnemyType.ZIGZAG, this.logicalHeight));
        }
      } else if (this.pendingReinforcement === 'ALLY') {
        const count = Math.floor(Math.random() * 3) + 1; // 1 to 3
        for (let i = 0; i < count; i++) {
          const type = Math.floor(Math.random() * 3); // 0: FIGHTER, 1: REPAIRER, 2: TANK
          this.helpers.push(new Helper(
             Math.random() * (this.logicalWidth - 40), 
             this.logicalHeight - 80, 
             this.logicalWidth, 
             this.logicalHeight, 
             type as HelperType
          ));
          this.createExplosion(this.logicalWidth / 2, this.logicalHeight - 20, '#4ade80', 20);
        }
      }
      this.pendingReinforcement = null;
    }
  } else {
    this.reinforcementTimer -= deltaTime;
    if (this.reinforcementTimer <= 0) {
      this.reinforcementTimer = Math.random() * 10 + 10; // 10-20 seconds
      if (Math.random() > 0.5 && this.enemies.length > 0) {
        this.triggerScreenShake(1);
        this.warningTimer = 2.0;
        this.pendingReinforcement = Math.random() > 0.6 ? 'ALLY' : 'ENEMY';
        this.warningMessage = this.pendingReinforcement === 'ENEMY' ? "WARNING! ENEMY REINFORCEMENTS!" : "ALLY SUPPORT INCOMING!";
      }
    }
  }
  ```
* **Player Summon Ally Action**:
  - `triggerSummonAlly()` (lines 860–870): Player spends 50 Pure Water (`currency`), sets `pendingReinforcement = 'ALLY'`, `warningTimer = 2.0`, `reinforcementTimer = 0.1`, `warningMessage = "ALLY SUPPORT SUMMONED!"`.

### 1.3 Enemy Specifications & AI Catalog
* **Location**: `src/game/Enemy.ts` (lines 5–367)
* **Comprehensive Stats & Behavior Table**:

| Enemy Type | Enum | Size (W x H) | Base HP Formula | Color | SpeedX / SpeedY | Movement AI & Dynamics | Shooting AI & Cadence |
|---|---|---|---|---|---|---|---|
| **NORMAL** | `0` | 40 x 30 | `1 + Math.floor(L/3)` | `#f97316` (Orange) | `30 + L*5` / `8` | Horizontal wall bounce (`0` to `600 - W`), Y descent. Bullet evasion if `canEvade=true` (1.5x speed boost, 1.5s cooldown). | Straight down (`vy=200`, `dmg=1`). Fire timer: `1~4s` (`rand*3 + 2`). |
| **ZIGZAG** | `1` | 40 x 30 | `Math.max(1, (1+Math.floor(L/3))-1)` | `#eab308` (Yellow) | `80 + L*10` / `8` | Rapid horizontal patrol + sinusoidal oscillation `Math.sin(now/200)*5` + downward descent. | Straight down (`vy=200`, `dmg=1`). Fire timer: `1~4s`. |
| **BOSS** | `2` | 150 x 100 | `L * 10` | `#dc2626` (Dark Red) | `30 + L*2` / `8` | Heavy horizontal sweep. Dedicated Canvas Top HP bar. Collision deals 10 dmg to boss and 1 dmg to player (1s i-frame). | Rapid fire (`vy=300`, `dmg=1`). Fire timer: `0.5~3.5s` (`rand*3 + 0.5`). |
| **SNIPER** | `3` | 40 x 30 | `Math.max(1, (1+Math.floor(L/3))-1)` | `#a855f7` (Purple) | `20` / `8` | Slow horizontal drift + descent. | Targeted aimed bullet at player: `atan2(dy, dx)`, `speed=400`. Bullet has `isInterceptable=true` (shootable by player). Fire timer: `3~6s`. |
| **DIVER** | `4` | 40 x 30 | `1 + Math.floor(L/3)` | `#ef4444` (Red) | `30 + L*8` / `8` | Patrols until `Math.abs(diverX - playerX) < 25` and player is below (`playerY > diverY`). Rockets down at `max(280, speedY*35)` (~280-350+ px/s). Dies on crash with barricade (20 dmg) or player. | Does not shoot while diving (`isDiving`). |
| **SHIELDED** | `5` | 40 x 30 | `1 + Math.floor(L/3)` | `#64748b` (Slate) | `30` / `8` | Armored hexagon with blue energy bubble. `shieldHp = 3`. Absorbs overkill damage. On break: 5.0s cooldown before full shield regen. | Straight down (`vy=200`, `dmg=1`). Fire timer: `1~4s`. |
| **SPLITTER** | `6` | 50 x 40 | `1 + Math.floor(L/3)` | `#22c55e` (Green) | `30` / `8` | Dual toxic bubbles. On death (`hp <= 0`), spawns 2 Mini-Enemies (`20x20`, `speedX = +10/-10`, `speedY = 5`). | Straight down (`vy=200`, `dmg=1`). Fire timer: `1~4s`. |

* **Swarm Speed Scaling**:
  - `GameManager.ts` line 318: `speedMultiplier = Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, enemies.length)) * 0.04))`
  - Accelerates remaining enemies up to 1.8x as the swarm count drops below 20.
* **Barricade Interaction & Gnawing**:
  - `GameManager.ts` lines 617–644 & `Enemy.ts` line 101:
  - Non-diver enemies overlapping barricades have `isGnawing = true`.
  - Speed is throttled to 20% (`gnawMultiplier = 0.2`).
  - Destructible ice barricades take 0.1 damage per frame. Indestructible stone barricades clamp Y to prevent penetration: `position.y = Math.min(position.y, barricade.y - size.height)`.

### 1.4 Helper / Allied Unit AI
* **Location**: `src/game/Helper.ts` (lines 7–193)
* 3 Helper Types:
  1. `FIGHTER` (HP: 3, Green `#4ade80`, Lifespan: 15s): Tracks lowest/closest enemy X, fires 2-damage bullets upwards every 0.3s.
  2. `REPAIRER` (HP: 1, Invincible, Yellow `#fbbf24`, Lifespan: 8s): Tracks most damaged barricade X, repairs blocks at 50% rate/frame.
  3. `TANK` (HP: 15, Purple `#a855f7`, Lifespan: 20s): Tracks lowest incoming enemy bullet X, positions body to intercept.

---

## 2. Logic Chain

From our codebase observations to the requirements of the Authoritative User Request:

1. **Static Wave Limitation**: Currently, all non-boss waves spawn an identical rectangle grid at `y = 80`. Reinforcements are limited to a hardcoded coin-flip between 4 Zigzags and 1-3 Helpers every 10–20 seconds. This creates repetitive, predictable gameplay where players simply memorize column positions.
2. **Missing Faction Differentiation**: Currently, entities and bullets only distinguish between `isPlayerBullet` (boolean) and enemies. There is no concept of a Third Faction or inter-faction hostility.
3. **Requirement for 3-Way Battlefield**:
   - Player & Allies (Faction 0)
   - Invaders / Original Enemies (Faction 1)
   - Third Faction / Rogue / Mutant / Abyssal Raiders (Faction 2)
   - Hostility Rule: Every faction is hostile to all other factions ($A \leftrightarrow B, B \leftrightarrow C, C \leftrightarrow A$). Bullets of Faction $F$ must collide with and damage entities of any Faction $F' \neq F$.
4. **Requirement for Dynamic, Unpredictable Reinforcement Spawning**:
   - Instead of a single static grid followed by long lulls, spawning should be driven by a **Dynamic Reinforcement Event Director**.
   - Spawns should feature varied entry vectors (Top drops, Left/Right flank sweeps, tactical warp-ins), diverse unit compositions (e.g. Infiltration Squads, Strike Teams, Crossfire Skirmishes), and adaptive pacing based on combat intensity.
5. **Contract & Test Suite Compatibility**:
   - Existing automated tests (e.g. `tests/04_multiwave_progression.spec.ts`, `tests/adversarial_challenger_m1_2.spec.ts`, `tests/stress/swarm_bot_engine.ts`, `tests/water-invader.spec.ts`) rely on:
     - `gameManager.level` progression through waves.
     - `level % 5 === 0` spawning a Boss with `level * 10` HP and Boss UI bar.
     - `gameManager.enemies` holding active hostile units.
     - `gameManager.startNextWave()` advancing state from `SHOP` to `PLAYING`.
     - `gameManager.triggerSummonAlly()` remaining functional via Q key.
   - Any rework must maintain 100% backward compatibility with these existing interface signatures while providing the enhanced dynamic behavior.

---

## 3. Caveats & Assumptions

1. **Performance Bounds**: The canvas runs at 60 FPS on a 600x800 logical viewport. Total active hostile entities on screen should be soft-capped at ~35–45 entities simultaneously to prevent frame drops on mobile and low-end devices.
2. **Object Pooling & Memory**: Projectiles and particles are pooled (Particle pool up to 500 in `GameManager.ts`). New third-faction projectiles and particles must adhere to this zero-leak lifecycle.
3. **Test Suite Invariants**: `tests/adversarial_challenger_m1_2.spec.ts` executes `spawnWave()` across 50 consecutive waves and validates that initial `spawnWave()` returns between 18 and 40 enemies with `minY >= 80`. Dynamic reinforcements should spawn during wave updates rather than exceeding initial grid bounds on `spawnWave()` calls if tests inspect immediate return values.
4. **Third-Faction Balance**: If Third Faction units and Invaders destroy each other too quickly, the player could win passively. To prevent passive exploitation, the AI should maintain dual pressure (e.g., 50% threat targeting toward player/allies, 50% threat targeting toward opposing faction, with score/currency incentives for player involvement).

---

## 4. Conclusion & Architecture Rework Proposal

### 4.1 Faction System Architecture (`Faction` Enum & Multi-Faction Collision Matrix)

```typescript
// Proposed Faction Model in types.ts or GameManager.ts
export enum Faction {
  PLAYER = 'PLAYER',     // Player ship and allied Helpers
  INVADER = 'INVADER',   // Original Water Invaders (Normal, Zigzag, Boss, Sniper, Diver, Shielded, Splitter)
  ROGUE = 'ROGUE'        // Third Faction: Abyssal Raiders / Rogue Mercenaries
}
```

#### Collision & Damage Resolution Matrix:

| Bullet Faction | Hits Player / Helper | Hits Invader Enemy | Hits Rogue (Third Faction) |
|---|---|---|---|
| **PLAYER** | ❌ (Friendly) | ✅ Deals Damage | ✅ Deals Damage |
| **INVADER** | ✅ Deals Damage | ❌ (Friendly) | ✅ Deals Damage |
| **ROGUE** | ✅ Deals Damage | ✅ Deals Damage | ❌ (Friendly) |

#### Cross-Faction Bullet Clash:
- Interceptable bullets (e.g., Sniper bullets or Rogue Heavy Orbs) can be neutralized by opposing faction projectiles when they intersect, creating dynamic aerial firefights.

---

### 4.2 Third Faction Unit Catalog (Abyssal / Rogue Raiders)

We propose adding 3 distinct Third-Faction unit types within `EnemyType` (or as a unified Faction-tagged `Enemy` class):

```typescript
export enum EnemyType {
  // Original Invaders (0-6)
  NORMAL = 0,
  ZIGZAG = 1,
  BOSS = 2,
  SNIPER = 3,
  DIVER = 4,
  SHIELDED = 5,
  SPLITTER = 6,
  
  // Third Faction: Abyssal / Rogue Raiders (7-9)
  ROGUE_SCOUT = 7,       // Fast flanking skirmisher with twin plasma darts
  ROGUE_CRUISER = 8,     // Heavy armored gunship with broadside multi-targeting
  ROGUE_ASSASSIN = 9     // Stealth infiltrator with curved flank trajectories
}
```

1. **`ROGUE_SCOUT` (Type 7)**:
   - **Color**: `#06b6d4` (Cyan / Electric Teal)
   - **Size**: 36 x 28
   - **HP**: `Math.max(1, Math.floor(level / 3))`
   - **Movement**: Enters laterally from left or right screen edge, executes high-speed elliptical sweeps across the mid-field (`y = 150..350`).
   - **Shooting AI**: Dual-firing turret. Scans for closest hostile entity within 300px radius (evaluating both Player and Invaders). Fires dual cyan plasma bolts (`speed = 280`).
2. **`ROGUE_CRUISER` (Type 8)**:
   - **Color**: `#ec4899` (Hot Pink / Magenta)
   - **Size**: 65 x 45
   - **HP**: `4 + Math.floor(level / 2)`
   - **Movement**: Slow, imposing horizontal sweep at `y = 120..220`.
   - **Shooting AI**: Broadside burst. Fires 3-spread pulse cannons targeting opposing Invader clusters and downward toward the player every 2.5s.
3. **`ROGUE_ASSASSIN` (Type 9)**:
   - **Color**: `#8b5cf6` (Deep Violet)
   - **Size**: 32 x 32 (Dart shape)
   - **HP**: `2 + Math.floor(level / 4)`
   - **Movement**: Dive-bomb flanker. Spawns high and curves aggressively toward high-density combat zones, colliding with both Invaders and Player barricades.

---

### 4.3 Dynamic Reinforcement Event Director

Replace the simple `reinforcementTimer = 10..20s` coin-flip with a **Weighted Dynamic Reinforcement Director**:

```typescript
export type ReinforcementEventType =
  | 'INVADER_FLANK_AMBUSH'       // Fast Zigzag/Diver pincer from left & right flanks
  | 'ROGUE_INCURSION'           // Third Faction squad drops into mid-field
  | 'CROSSFIRE_CLASH'           // Simultaneous drop of Invader Vanguard vs Rogue Strike Team
  | 'ELITE_SNIPER_BATTERY'      // Shielded + Sniper battery supporting the backline
  | 'ALLY_AIRDROP';             // Friendly Helper or Supply Beacon

export interface ReinforcementEvent {
  type: ReinforcementEventType;
  warningDuration: number;
  bannerText: string;
  bannerColor: string;
  shakeIntensity: number;
  composition: Array<{
    faction: Faction;
    enemyType: EnemyType;
    entryVector: 'TOP_GRID' | 'LEFT_FLANK' | 'RIGHT_FLANK' | 'WARP_IN';
    startX: number;
    startY: number;
    initialVx: number;
    initialVy: number;
    level: number;
  }>;
}
```

#### Event Director Selection Algorithm:

```
Every Reinforcement Cycle (Timer = 8s + Math.random() * 8s):
1. Evaluate Battlefield Telemetry:
   - Active Invaders Count (Ni)
   - Active Rogue Units Count (Nr)
   - Player HP & Stress Level
   - Current Wave Level
2. Determine Event Weights:
   - If Ni > 15 and Nr == 0: Boost Weight of ROGUE_INCURSION (brings 3-way chaos to break grid stalemates).
   - If Player HP <= 2 or Stress > 70%: Boost Weight of ALLY_AIRDROP (dynamic assistance).
   - If Level >= 3: Enable CROSSFIRE_CLASH (simultaneous dual-faction entry).
   - If Ni < 5 and Level > 1: Trigger INVADER_FLANK_AMBUSH to maintain pressure.
3. Trigger Visual Warning:
   - Display color-coded banner overlay:
     * Red banner: "⚠️ WARNING: INVADER REINFORCEMENTS!"
     * Magenta/Cyan banner: "⚡ ALERT: ROGUE FACTION INCURSION DETECTED!"
     * Purple banner: "🔥 CHAOS: 3-WAY CROSSFIRE ENGAGEMENT!"
     * Green banner: "🛡️ ALLY SUPPORT INCOMING!"
   - Screen shake + spatial audio siren.
4. Execute Multi-Vector Spawn:
   - Left/Right Flank units enter with horizontal momentum (`vx = ±150`, `vy = 50`).
   - Warp-In units materialize with particle burst rings.
```

---

### 4.4 Multi-Vector Entry Dynamics & Movement Equations

1. **Lateral Flank Entry**:
   - Spawns at $x = -40$ (moving right with $v_x = +160$) or $x = 640$ (moving left with $v_x = -160$).
   - Transition to standard bounce patrol once $x$ enters safe canvas bounds $[40, 560]$.
2. **V-Formation / Pincer Entry**:
   - 3 to 5 units spawned with staggered Y coordinates:
     $$y_i = 80 + |i - \lfloor N/2 \rfloor| \times 25$$
     $$x_i = \text{offsetX} + i \times 70$$
3. **Sinusoidal Cross-Patrol**:
   - Trajectory defined by:
     $$x(t) = x_0 + A \cdot \sin(\omega t + \phi)$$
     $$y(t) = y_0 + v_y \cdot t$$
     where $A = 120\text{px}$, $\omega = 3.5\text{ rad/s}$.

---

### 4.5 Targeting & Cross-Faction AI Decision Loop

For each hostile unit during `update()`:

```typescript
public getBestTarget(allEntities: Entity[]): Entity | null {
  // Filter for hostile entities (entities of different faction)
  const hostileTargets = allEntities.filter(e => 
    !e.isDead && 
    e.faction !== this.faction &&
    (e.faction === Faction.PLAYER || e.faction === Faction.INVADER || e.faction === Faction.ROGUE)
  );

  if (hostileTargets.length === 0) return null;

  // Weight formula: prioritize close proximity and vertical threat
  let bestTarget = null;
  let minScore = Infinity;

  for (const target of hostileTargets) {
    const dx = (target.position.x + target.size.width / 2) - (this.position.x + this.size.width / 2);
    const dy = (target.position.y + target.size.height / 2) - (this.position.y + this.size.height / 2);
    const dist = Math.hypot(dx, dy);

    // Player target priority weighting
    const playerBonus = (target.faction === Faction.PLAYER) ? 0.8 : 1.0;
    const score = dist * playerBonus;

    if (score < minScore) {
      minScore = score;
      bestTarget = target;
    }
  }

  return bestTarget;
}
```

---

## 5. Verification Method

To verify the proposed rework and ensure zero regression against existing game systems and tests:

### 5.1 Verification Commands

```bash
# 1. Type-check & Production Build
npm run build

# 2. Existing Regression & Milestone Verification Tests
npx playwright test tests/01_ui_and_controls.spec.ts
npx playwright test tests/02_rendering_and_vector_art.spec.ts
npx playwright test tests/03_game_mechanics.spec.ts
npx playwright test tests/04_multiwave_progression.spec.ts
npx playwright test tests/m1_verification.spec.ts
npx playwright test tests/adversarial_challenger_m1.spec.ts
npx playwright test tests/adversarial_challenger_m1_2.spec.ts
npx playwright test tests/adversarial_challenger_m3.spec.ts

# 3. Swarm Bot Endurance & Autonomous Stress Tests
npx playwright test tests/stress/endless_survival_swarm.spec.ts
npx playwright test tests/stress/qa_harvest_verification.spec.ts
```

### 5.2 Specific Test Assertions to Implement for 3-Way & Dynamic Reinforcements:
1. **`test('3-Way Battle: Rogue projectile inflicts damage on Invader entity')`**:
   - Spawn Invader Enemy (`HP = 10`, `Faction.INVADER`) at (200, 200).
   - Spawn Rogue Bullet (`Damage = 2`, `Faction.ROGUE`) at (200, 200).
   - Run `checkCollisions()`.
   - Assert `enemy.hp === 8` and `bullet.isDead === true`.
2. **`test('3-Way Battle: Invader projectile inflicts damage on Rogue entity')`**:
   - Spawn Rogue Enemy (`HP = 5`, `Faction.ROGUE`) at (300, 200).
   - Spawn Invader Bullet (`Damage = 1`, `Faction.INVADER`) at (300, 200).
   - Run `checkCollisions()`.
   - Assert `rogue.hp === 4` and `bullet.isDead === true`.
3. **`test('Dynamic Reinforcements: Rogue Incursion event spawns rogue units with distinct banner')`**:
   - Trigger reinforcement event with type `'ROGUE_INCURSION'`.
   - Fast forward `warningTimer` to 0.
   - Assert `enemies.some(e => e.faction === Faction.ROGUE)` is `true`.
4. **`test('Multi-Vector Entry: Lateral flank units enter within canvas bounds without clipping or stuck state')`**:
   - Spawn flank reinforcement from $x = -40$.
   - Advance physics for 60 frames.
   - Assert entity $x \in [0, 600 - \text{width}]$ and $y \in [80, 750]$.
5. **`test('Zero-Crash & High-Intensity Stress: 60s Swarm bot survival under 3-way multi-faction crossfire')`**:
   - Run autonomous SwarmBot for 60 seconds with continuous 3-way dynamic reinforcement spawns.
   - Assert `avgFps >= 30`, 0 critical anomalies, 0 NaN coordinates.

### 5.3 Invalidation Conditions
- Any change causing `npm run build` or `npx tsc --noEmit` to fail with TypeScript errors.
- Any regression breaking the 5-wave Boss cycle (`level % 5 === 0`) or Boss HP bar rendering (`F-14`).
- Any entity getting stuck at $x = 0$ or $x = 600$ (regression of `BUG-E01`).
- Any memory leak in projectile/particle allocation during continuous reinforcement spawns.

---
*End of Handoff Report.*

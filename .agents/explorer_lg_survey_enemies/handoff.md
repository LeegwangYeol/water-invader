# Handoff Report: Requirement 2 — Enemy Swarm & 3rd Faction (Mid-Tier Monsters) Technical Design

**Working Directory**: `/Users/user/src/water-invader/.agents/explorer_lg_survey_enemies`  
**Target Requirement**: R2 — Enemy Swarm and 3rd Faction (Mid-Tier Monsters)  
**Author**: Explorer Subagent (Late-Game Survey)  
**Recipient**: Orchestrator / Lead Implementer (`64f804cc-0c89-4eaf-b63c-7323a06289e4`)  

---

## 1. Observation

Direct code examination of the codebase yielded the following concrete architectural facts:

### 1.1 Existing Wave Generation & Spawn Cap Bottleneck
In `src/game/GameManager.ts`, lines 444–468 (`spawnWave`):
```typescript
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
```
- **Finding**: Enemy count plateaus at **40 units** (`rows=5`, `cols=8`) from Wave 8 onward. Wave 9, 11, 12, 13, 14, 16 all spawn only 40 enemies.
- **Boss Wave Scaling** (`src/game/GameManager.ts`, lines 396–433):
  - Wave 5: Spawns only 1 Boss (`EnemyType.BOSS`).
  - Wave 10+: Spawns 1 Boss + `escortCount` minions (`Math.min(8, 4 + Math.floor((this.level - 10) / 5) * 2)`: 4 to 8 minions).
- **Reinforcement Pacing** (`src/game/GameManager.ts`, lines 846–850):
  - Reinforcements trigger only every 8 to 16 seconds:
    `const tempoInterval = Math.max(8, 16 - Math.min(6, this.level) - Math.min(3, Math.floor(this.combo / 5)));`
    `this.reinforcementTimer = tempoInterval + Math.random() * 4;`
  - When triggered, drops only 3 to 5 enemies.

### 1.2 Existing Faction Architecture & 3rd Faction Precedents
In `src/game/types.ts`, lines 25–42:
```typescript
export enum Faction {
  PLAYER = 'PLAYER',
  INVADER = 'INVADER',
  ROGUE = 'ROGUE'
}

export enum EnemyType {
  NORMAL = 0,
  ZIGZAG = 1,
  BOSS = 2,
  SNIPER = 3,
  DIVER = 4,
  SHIELDED = 5,
  SPLITTER = 6,
  ROGUE_DRONE = 7,
  ROGUE_STALKER = 8,
  ROGUE_MECH = 9
}
```
- `Faction.ROGUE` is already declared and recognized in the UI and test suites.
- In `src/components/game-canvas.tsx`, lines 146–158:
  - The HUD specifically contains:
    - `data-testid="invader-threat-badge"` displaying `👾 {invaderCount}`
    - `data-testid="rogue-threat-badge"` displaying `⚡ {rogueCount}`
- In `src/game/GameManager.ts`, lines 1618–1623:
  - Score update broadcasts `invaderCount` and `rogueCount`:
    `const invaderCount = this.enemies.filter(e => !e.isDead && e.faction === Faction.INVADER).length;`
    `const rogueCount = this.enemies.filter(e => !e.isDead && e.faction === Faction.ROGUE).length;`
- In `src/game/GameManager.ts`, lines 1224–1231:
  - Wave clear requires all hostiles dead:
    `if (!e.isDead && (e.faction === Faction.INVADER || e.faction === Faction.ROGUE))`
- In `src/game/GameManager.ts`, lines 1593–1615 (`handleCrossfireKill`):
  - Crossfire kills grant +150 score, +8 currency, combo extension to 2.5s, and +2.0% ultimate gauge.

### 1.3 Rogue Spawning Limitation in Current Game
In `src/game/GameManager.ts`, line 470–533:
- Rogues currently **only** spawn via `spawnDynamicReinforcement('ROGUE_INCURSION' | 'SPEARHEAD' | '3WAY_CLASH' | 'FLANK')` or during `TOTAL_WAR` crisis.
- `spawnWave()` **never** places Rogue units in the initial wave layout or natural wave progression.
- Regular gameplay between waves 1 and 10 rarely features Rogues unless the player happens to survive long enough in a single wave for the 8-16s reinforcement timer to roll a Rogue incursion.

### 1.4 Stage 10+ AI and Combat Scaling
In `src/game/Enemy.ts`:
- Lines 82–88: `if (this.level >= 10) { this.isAggressive = true; this.rushVelocityModifier = 1.8 + Math.min(1.2, (this.level - 10) * 0.15); }`
- Lines 147–206: Standard Stage 10+ HP scaling formula:
  `const standardHp = 4 + (this.level - 9) * 6 + Math.floor(Math.pow(this.level - 9, 1.5));`
- Lines 259–287: Stage 10+ homing drift (`Math.sign(dx) * homingStrength`) and downward surge charging.
- Lines 400–590: Friendly-Fire Line of Sight check (`hasAlliedObstacleInShotPath`) with raycasting, corridor buffering, and lateral sliding evasion.

### 1.5 Existing Test Constraints
- `tests/04_multiwave_progression.spec.ts` line 97:
  `expect(bossData.totalEnemies).toBe(1); // Wave 5 Boss solitary spawn`
  -> Wave 5 MUST remain solitary boss.
- `tests/02_rendering_and_vector_art.spec.ts` line 126:
  `expect(enemyRenderResults.length).toBe(7);`
  -> Loops over `[0, 1, 2, 3, 4, 5, 6]`. Adding enum values 10+ will not affect this test.
- `tests/12_extreme_difficulty_and_crises.spec.ts` lines 74–86 & 531:
  - Checks exact HP for types 0..9 at level 10: Normal=11, Shielded=12, Drone=6, Stalker=11, Mech=25, Boss=362.
  - Checks `initialEnemies === 22` in `activateCrisisEffect('TOTAL_WAR')`.
  -> These values and `TOTAL_WAR` crisis effect must remain untouched.

---

## 2. Logic Chain

1. **Premise 1 (Requirement 2 Objectives)**:
   - Noticeably increase overall enemy spawn counts.
   - Introduce a distinct 3rd faction consisting of mid-tier monsters that spawn during gameplay.
   - Provide distinct mechanics, behaviors, visual design, and stats compared to regular invaders and bosses.

2. **Premise 2 (Canvas & Performance Constraints)**:
   - Logical canvas dimensions are 600px width x 800px height.
   - Simply packing 80+ enemies into the initial static grid at Y=80 creates visual clutter, renders rows down to Y=450 (too close to player at Y=740), and creates an intense projectile wall that causes immediate player death or lag spikes.
   - Therefore, increasing overall enemy counts requires a **two-tier scaling model**:
     a. **Expanded Initial Formation**: Expand grid width (up to 10 cols) and rows (up to 6 rows) post-Wave 10, bringing initial count to 50–60 enemies.
     b. **Dynamic Swarm Sub-Waves / Echelons**: Stream in secondary swarm formations (10–18 fast skirmishers/divers/drones) when the on-screen population drops below 40% (<= 15–20 enemies).
     c. Total wave casualties scale to **70–90+ enemies per wave** (a >2x increase over the previous 40-cap), fulfilling the requirement "noticeably increase overall enemy spawn counts".

3. **Premise 3 (3rd Faction Integration & Mid-Tier Monsters)**:
   - `Faction.ROGUE` is already established in types, UI (`rogue-threat-badge`), and collision matrix.
   - However, currently Rogues only spawn as occasional light/reinforcement units (Drone/Stalker/Mech).
   - To deliver **Mid-Tier Monsters**:
     - They must spawn **naturally in wave progression** starting at Wave 7 (introductory) and heavily post-Wave 10 (guaranteed 2–4 mid-tier monsters per wave).
     - They must be distinct from both regular Invaders (40x30, squishy, grid marchers) and Bosses (150x100, stationary top center, 362+ HP):
       - Mid-tier dimensions: 48x36 to 64x48.
       - Mid-tier HP: 25 to 55 HP (roughly 3x to 5x regular invaders, but 1/6th of a boss).
       - Overhead mini-health bar showing current HP and Shield state.
       - Distinct visual palette: High-voltage Electric Magenta (`#d946ef`), Neon Lime (`#84cc16`), and Ultraviolet (`#c026d3`) with cyan scanning visors and animated thrusters.
       - 3-Way Hostile crossfire AI: Simultaneously attacks both regular Invaders and Player.

4. **Premise 4 (Distinct Mid-Tier Mechanics)**:
   To ensure they feel mechanically unique rather than just "spongy invaders":
   - **Archetype 1: Rogue Goliath / Dreadnought (`ROGUE_MECH` / `ROGUE_GOLIATH`)**:
     - *Mechanic*: Kinetic Barrier (10-20 shield HP). Upon shield depletion, triggers an EMP Shockwave that vaporizes nearby projectiles (both player and invader shots). Alternating dual-cannon crossfire.
   - **Archetype 2: Rogue Phase Stalker (`ROGUE_STALKER`)**:
     - *Mechanic*: Erratic Phase Dash / Teleport. When targeted by homing missiles or taking sustained damage, glitches 80-120px horizontally with cyan afterimages, shedding missile tracking.
   - **Archetype 3: Rogue Brood Carrier (`ROGUE_CARRIER` / Cluster Splitting)**:
     - *Mechanic*: Upon death, undergoes tactical mitosis / cluster detachment, deploying 2–3 aggressive `ROGUE_DRONE` skirmishers.

5. **Premise 5 (Test Suite Safety)**:
   - Wave 5 boss solitary spawn (1 total enemy) must be strictly maintained for `tests/04_multiwave_progression.spec.ts`.
   - Existing HP formulas for Wave 10 (types 0..9) must be strictly maintained for `tests/12_extreme_difficulty_and_crises.spec.ts`.
   - `TOTAL_WAR` crisis enemy count (22) must be untouched for `tests/12_extreme_difficulty_and_crises.spec.ts`.
   - All new features can be covered by adding a new comprehensive test suite: `tests/16_enemy_swarm_and_third_faction.spec.ts`.

---

## 3. Caveats

1. **Homing Missile Synergy (Requirement 1 vs Requirement 2)**:
   - The user request pairs Enemy Swarms with R1 (Homing Missiles). Homing missiles target the nearest enemy. With 70 concurrent enemies and 3-way battles, homing missiles must properly acquire targets based on euclidean distance regardless of whether the enemy is an Invader or a Rogue Mid-Tier monster.
2. **Raycast Performance at 70 Enemies**:
   - `hasAlliedObstacleInShotPath` in `Enemy.ts` checks allies of the same faction. With up to 60-70 enemies, naive nested raycasting could do up to `70 * 70 = 4,900` checks if all fire on the same frame. The existing spatial pruning (Y-axis distance threshold `distY / 300` and same-faction check) already eliminates ~90% of candidates. A broadphase bounding-box guard should be kept.
3. **Canvas Bounds & Mobile Viewports**:
   - Canvas logical dimensions are 600x800. On narrow mobile viewports, the canvas scales via CSS while maintaining 600x800 coordinate space. Spawns must strictly stay within `X: 20 .. 580` and `Y: 60 .. 320` to prevent offscreen clipping.

---

## 4. Conclusion & Technical Design

### 4.1 Swarm Scaling Architecture
In `src/game/GameManager.ts`:
- **Wave Grid Sizing Formula**:
  ```typescript
  // Wave 1-4: Standard progression (18 -> 28 enemies)
  // Wave 5: Solitary Boss (1 enemy, preserves test 04_multiwave_progression)
  // Wave 6-9: 4-5 rows x 8 cols (32 -> 40 enemies)
  // Wave 10+: Noticeable Swarm Expansion (50 - 60 initial enemies)
  let rows: number;
  let cols: number;
  if (this.level < 5) {
    rows = Math.min(4, 3 + Math.floor(this.level / 4));
    cols = Math.min(7, 6 + Math.floor(this.level / 3));
  } else if (this.level < 10) {
    rows = Math.min(5, 3 + Math.floor(this.level / 4));
    cols = Math.min(8, 6 + Math.floor(this.level / 3));
  } else {
    // Stage 10+ Swarm Grid
    rows = Math.min(6, 4 + Math.floor((this.level - 10) / 4)); // 5 to 6 rows
    cols = Math.min(10, 8 + Math.floor((this.level - 10) / 3)); // 8 to 10 cols
  }
  ```
- **Dynamic Swarm Sub-Waves (Post-Wave 10 Streaming)**:
  - Track `public swarmEchelonsRemaining: number = 0;`
  - In `startNextWave()`:
    - For `this.level >= 10`: Set `this.swarmEchelonsRemaining = this.level >= 15 ? 2 : 1;`
  - In `update()` / `checkCollisions()`:
    - If `this.state === GameState.PLAYING` and `this.swarmEchelonsRemaining > 0`:
      - When active hostile enemies (`invaderCount + rogueCount`) drops `<= 18`:
        - Decrement `this.swarmEchelonsRemaining--`.
        - Trigger an incoming Swarm Echelon (10–14 units: V-formation Divers, Zigzags, and 1-2 Mid-Tier Rogues).
        - Display a brief in-game banner / sound: `"⚠ SWARM REINFORCEMENTS DETECTED!"`.
- **Concurrent Population Safety Cap**:
  - Hard limit of **65–70 concurrent active enemies**.
  - If `enemies.filter(e => !e.isDead).length >= 60`, any pending spawn or reinforcement is delayed until active enemies fall below 45.

### 4.2 3rd Faction Mid-Tier Monsters Specification
In `src/game/types.ts`:
```typescript
export enum EnemyType {
  NORMAL = 0,
  ZIGZAG = 1,
  BOSS = 2,
  SNIPER = 3,
  DIVER = 4,
  SHIELDED = 5,
  SPLITTER = 6,
  ROGUE_DRONE = 7,
  ROGUE_STALKER = 8,
  ROGUE_MECH = 9,
  ROGUE_GOLIATH = 10,  // Mid-Tier Armored Dreadnought
  ROGUE_PHANTOM = 11,  // Mid-Tier Phase Teleporter
  ROGUE_CARRIER = 12   // Mid-Tier Brood Carrier
}
```
*(Alternatively, `ROGUE_MECH` and `ROGUE_STALKER` can be promoted to mid-tier monster status directly with enhanced properties, while maintaining backward compatibility for existing level-10 tests).*

#### Mid-Tier Monster Characteristics:
| Property | Rogue Goliath (Mech) | Rogue Phase Phantom (Stalker) | Rogue Brood Carrier |
|---|---|---|---|
| **Faction** | `Faction.ROGUE` | `Faction.ROGUE` | `Faction.ROGUE` |
| **Size** | 56 x 42 px | 48 x 34 px | 52 x 40 px |
| **Base HP (W1-9)** | 15 HP | 10 HP | 12 HP |
| **Base HP (W10+)** | 35 – 55 HP | 25 – 40 HP | 30 – 45 HP |
| **Shield HP** | 12 – 20 Shield HP | 0 | 8 Shield HP |
| **Unique Mechanic** | Kinetic Shield + EMP blast on break | Horizontal Phase Dash (80-120px teleport) | Splits into 2-3 Rogue Drones upon death |
| **Attack Style** | Alternating heavy dual-bolt | Rapid interceptable dual-plasma | Tracking energy orb |
| **AI Crossfire** | Dual-targets Invaders & Player | Targets highest threat / closest | Spreads crossfire chaos |
| **Visual Render** | Overhead health bar, Magenta armor | Overhead health bar, Ultraviolet wings | Overhead health bar, Lime bio-chassis |
| **Score / Drop** | 400 Score / 20 💧 / +5% Ult | 350 Score / 15 💧 / +4% Ult | 350 Score / 15 💧 / +4% Ult |

### 4.3 Overhead Health Bar Rendering
In `src/game/Enemy.ts`, for all Mid-Tier Monsters (`isMidTier || type >= 7`):
```typescript
public drawHealthBar(ctx: CanvasRenderingContext2D): void {
  if (this.hp <= 0) return;
  const barWidth = Math.max(36, this.size.width);
  const barHeight = 4;
  const bx = this.position.x + (this.size.width - barWidth) / 2;
  const by = this.position.y - 8;

  ctx.save();
  // Background container
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(bx - 1, by - 1, barWidth + 2, barHeight + 2);

  // Health fill (Magenta to Lime gradient)
  const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
  ctx.fillStyle = hpRatio > 0.5 ? '#84cc16' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
  ctx.fillRect(bx, by, barWidth * hpRatio, barHeight);

  // Shield bar overlay if shielded
  if (this.shieldHp > 0 && this.maxShieldHp > 0) {
    const shieldRatio = Math.max(0, Math.min(1, this.shieldHp / this.maxShieldHp));
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(bx, by - 3, barWidth * shieldRatio, 2);
  }
  ctx.restore();
}
```

### 4.4 3-Way AI Targeting & Friendly Fire Integration
In `src/game/Enemy.ts`:
- `this.fire(playerPos, allEnemies)`:
  - For `Faction.ROGUE`:
    - Scans for closest target among `playerPos` AND all living `Faction.INVADER` enemies.
    - If nearest is an Invader, aims at the Invader's center coordinate.
    - If nearest is the Player, aims at the Player.
  - Friendly Fire:
    - Runs `hasAlliedObstacleInShotPath(allEnemies, originX, originY, targetX, targetY)` filtering by `ally.faction === this.faction`.
    - If another Rogue is directly in the firing trajectory, fire is suppressed for 0.15s and the unit performs a lateral tactical reposition slide.
  - Crossfire Collisions:
    - Bullets from Rogues damage Invaders, and Invader bullets damage Rogues.
    - Eliminating an enemy via crossfire calls `handleCrossfireKill()`, granting the player bonus score, 2.5s combo refresh, and ultimate charge.

---

## 5. Verification Method

### 5.1 Independent Verification Commands
```bash
# 1. Type check and Next.js build verification
npm run build

# 2. Existing multiwave and 3-way battle tests
npx playwright test tests/04_multiwave_progression.spec.ts
npx playwright test tests/05_three_way_battle.spec.ts
npx playwright test tests/12_extreme_difficulty_and_crises.spec.ts

# 3. New dedicated Enemy Swarm & 3rd Faction test suite
npx playwright test tests/16_enemy_swarm_and_third_faction.spec.ts
```

### 5.2 Test Plan (`tests/16_enemy_swarm_and_third_faction.spec.ts`)
1. **Test 1 — Wave 10+ Swarm Count Verification**:
   - Advance to Wave 11, verify total initial spawned enemies is >= 50 (noticeably higher than Wave 4's 28 and Wave 8's 40).
2. **Test 2 — Dynamic Swarm Echelon Streaming**:
   - In Wave 11, eliminate enemies until count <= 18; verify a secondary swarm echelon streams in, bringing total defeated count for the wave to >= 65 enemies.
3. **Test 3 — Concurrent Population Safety Cap**:
   - Under heavy spawn conditions, verify `gm.enemies.length` does not exceed 70 concurrent entities at any single frame.
4. **Test 4 — Natural Mid-Tier 3rd Faction Spawning**:
   - In Wave 7+ and Wave 10+, verify `Faction.ROGUE` mid-tier entities spawn naturally in `gm.enemies`.
   - Verify `rogue-threat-badge` in HUD accurately reflects the active Rogue mid-tier monster count.
5. **Test 5 — Mid-Tier Monster Mechanics**:
   - Verify Mid-Tier Monster has overhead health bar rendered.
   - Verify Kinetic Shield absorbs damage before HP is reduced.
   - Verify Phase Dash / Teleport activates upon taking sustained fire.
   - Verify Cluster Split: destroying a carrier monster spawns 2-3 Rogue Drones.
6. **Test 6 — 3-Way Crossfire AI**:
   - Place a Mid-Tier Rogue closer to an Invader than to the Player; verify Rogue projectile travels towards the Invader.
   - Verify Invader takes damage and dies, triggering `handleCrossfireKill` with bonus score.
   - Verify friendly fire line-of-sight suppression prevents same-faction backstabbing.
7. **Test 7 — Wave 5 Solitary Boss Integrity**:
   - Verify Wave 5 spawns exactly 1 Boss and 0 additional minions/mid-tier monsters (regression test).

### 5.3 Invalidation Conditions
The design is invalidated if:
- Frame rate drops below 55 FPS during peak swarm combat on standard devices.
- Screen becomes overcrowded so that safe player maneuverability is completely eliminated.
- Wave 5 boss solitary status breaks, causing `04_multiwave_progression.spec.ts` to fail.
- Crossfire between Rogues and Invaders halts wave progression or prevents shop transition.

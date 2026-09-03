# Codebase Survey Report: Requirement R2 — Allied Reinforcements with Roles & UI

**Milestone**: Feature Expansion — Requirement R2  
**Target Area**: Allied Reinforcements, Roles (Fighter, Medic, Repair Bot), UI Health Bars & Indicators  
**Author**: Explorer Subagent  
**Date**: 2026-09-04  
**Project Root**: `/Users/user/src/water-invader/`  

---

## 1. Executive Summary

Requirement R2 expands the Water Invader allied support mechanic into a full-fledged tactical reinforcement system featuring:
1. **Massive Allied Reinforcement Events**: The battlefield can be bolstered mid-game by a dedicated squadron of specialized friendly units (Fighters, Medics, Repair Bots) warping into the arena.
2. **Explicit Specialized Roles**:
   - **Fighter**: Aggressive attack drone targeting enemy vanguard, diving invaders, and barricade saboteurs.
   - **Medic**: Support drone tethered to the player, restoring player health (`+1 HP`), reducing combat stress, or reinforcing shields.
   - **Repair Bot**: Dedicated engineer drone prioritizing damaged defensive barricades, restoring broken voxel blocks and repairing structural integrity.
3. **High-Clarity Overhead UI**: Every allied unit displays a distinct, high-contrast overhead health bar (background track, colored fill, numerical readout) and a role badge (icon + text, e.g., `[⚔️ FIGHTER]`, `[💚 MEDIC]`, `[🔧 REPAIR BOT]`) designed to remain 100% visible against any dynamic background, dark space, or bright crisis distortion.
4. **On-Screen Squadron HUD**: The UI overlay clearly communicates what function each active ally serves, providing immediate tactical situational awareness.

---

## 2. Existing Entity and Update Architecture

### 2.1 Entity Hierarchy & Base Classes
- **`Entity` (`src/game/Entity.ts:3-98`)**:
  - Properties: `position: Vector2D`, `velocity: Vector2D`, `size: Size`, `isDead: boolean`, `color: string`, `faction: Faction` (lines 4-9).
  - Collision Detection: Employs both instantaneous AABB (lines 61-68) and Continuous Collision Detection (CCD) via swept bounding boxes (`getSweptRect()`, lines 39-54, 70-95).
  - Faction: Factions are defined in `src/game/types.ts:25-29` (`PLAYER`, `INVADER`, `ROGUE`). Friendly helpers and the player share `Faction.PLAYER`.

### 2.2 Existing Helper Implementation (`src/game/Helper.ts:1-198`)
- **Current Role Model (`HelperType`, lines 8-12)**:
  ```typescript
  export enum HelperType {
    FIGHTER,   // 0: Green (#4ade80), HP: 3, shoots bullets every 0.3s
    REPAIRER,  // 1: Yellow (#fbbf24), HP: 1, invincible, restores barricade blocks
    TANK       // 2: Purple (#a855f7), HP: 15, intercepts hostile bullets
  }
  ```
- **Update Cycle (`Helper.update`, lines 58-152)**:
  - Signature: `public update(deltaTime: number, barricades: Barricade[], enemies: Enemy[], bullets: Bullet[]): Bullet[]`
  - **Limitation 1 (No Player Access)**: Does NOT accept `player: Player`. A Medic role cannot heal or inspect player HP without access to the player instance.
  - **Limitation 2 (Barebones Overhead Rendering)**:
    Lines 186-193:
    ```typescript
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    if (!this.isInvincible) {
       ctx.fillText(`HP:${this.hp}`, cx, this.position.y - 5);
    } else {
       ctx.fillText(`INV`, cx, this.position.y - 5);
    }
    ```
    There is no health bar, no role icon, no role badge, and no visual indicator of what function the unit performs.
  - **Limitation 3 (Incomplete Role Set)**: Currently lacks a "Medic" role (only has Fighter, Repairer, Tank).

### 2.3 Capital Dreadnought Reinforcements (`src/game/crisis/AlliedReinforcements.ts:1-955`)
- Represents the Aegis Vanguard Command Dreadnought (220x100px vector capital ship) deployed specifically during End-Game Crisis (Stage 15+ Phase 2).
- Key capabilities: Forward heavy plasma cannons, 120px Point-Defense (PD) laser grid vaporizing enemy bullets, restorative nano-shield aura for player (+1 HP every 5s), 2 escort interceptors.
- Stored as `alliedReinforcements?: AlliedReinforcements` on `GameManager` (line 71).

### 2.4 Entity Lifecycle in `GameManager` (`src/game/GameManager.ts`)
- **Storage**: `public helpers: Helper[] = [];` (line 27).
- **Spawn Logic (Single/Small Reinforcement)**:
  - Dynamic Event Director (lines 1043-1055): Spawns 1-3 random helpers when `pendingReinforcement === 'ALLY'`.
  - Manual Call-in (lines 2341-2350): `triggerSummonAlly()` deducts 50 Pure Water and sets `pendingReinforcement = 'ALLY'`.
- **Game Loop Integration**:
  - Update: Lines 1367-1372:
    ```typescript
    this.helpers.forEach(helper => {
       const newBullets = helper.update(deltaTime, this.barricades, this.enemies, this.bullets);
       if (newBullets && newBullets.length > 0) {
          this.bullets.push(...newBullets);
       }
    });
    ```
  - In-place Array Compaction: Lines 1403-1411 (two-pointer write compaction checking `!h.isExpired()`).
  - Bullet Collision: Lines 1775-1791 (hostile bullets collide with helpers, reducing `helper.hp` and spawning explosions).
  - Canvas Draw Pipeline: Line 2152 (`this.helpers.forEach(h => h.draw(this.ctx))`).

### 2.5 React UI & Overlay HUD (`src/components/game-canvas.tsx`)
- Container: Aspect-ratio 3/4 canvas container (line 1031) with `CanvasCore` (line 1033) and `TopHUD` (line 1041).
- Overlays: End-game crisis warning banner (line 1057), active crisis badge (line 1077), warning banner (line 1095), EMP suppression badge (line 1115), Acid Storm badge (line 1125).
- **Current Gap**: No dedicated UI elements for allied reinforcements (no squadron fleet status indicator, no active ally count, no notification when massive allied reinforcements warp in).

---

## 3. Proposed Architecture for Allied Reinforcements & Roles

### 3.1 Role Enumeration & Strict Backward Compatibility

Existing tests (`tests/05_three_way_battle.spec.ts:1229`, `tests/adversarial_challenger_m1_faction_combat.ts:141-143`, `tests/tier5_adversarial_combat.spec.ts:475`) explicitly instantiate helpers using numeric and enum keys:
`HelperType.FIGHTER = 0`, `HelperType.REPAIRER = 1`, `HelperType.TANK = 2`.

To guarantee 100% backward compatibility while introducing the required roles:
```typescript
export enum HelperType {
  FIGHTER = 0,
  REPAIRER = 1,  // Equivalent to REPAIR_BOT
  TANK = 2,      // Preserved for existing test suites
  MEDIC = 3      // Newly introduced for Requirement R2
}

// Semantic alias for clean typing
export const REPAIR_BOT = HelperType.REPAIRER;

export type AllyRoleName = 'Fighter' | 'Medic' | 'Repair Bot' | 'Tank';

export interface AllyRoleConfig {
  name: AllyRoleName;
  badgeLabel: string;
  icon: string;
  primaryColor: string;
  accentColor: string;
  borderColor: string;
  description: string;
  baseHp: number;
  maxHp: number;
  speed: number;
  lifespan: number;
}

export const ALLY_ROLE_CONFIGS: Record<HelperType, AllyRoleConfig> = {
  [HelperType.FIGHTER]: {
    name: 'Fighter',
    badgeLabel: 'FIGHTER',
    icon: '⚔️',
    primaryColor: '#22c55e', // Plasma Green
    accentColor: '#86efac',
    borderColor: '#16a34a',
    description: 'Intercepts & attacks hostile invaders and saboteurs',
    baseHp: 4,
    maxHp: 4,
    speed: 320,
    lifespan: 18,
  },
  [HelperType.MEDIC]: {
    name: 'Medic',
    badgeLabel: 'MEDIC',
    icon: '💚',
    primaryColor: '#06b6d4', // Cyan / Emerald
    accentColor: '#67e8f9',
    borderColor: '#0891b2',
    description: 'Heals player HP, mitigates stress, and restores shields',
    baseHp: 3,
    maxHp: 3,
    speed: 280,
    lifespan: 20,
  },
  [HelperType.REPAIRER]: {
    name: 'Repair Bot',
    badgeLabel: 'REPAIR BOT',
    icon: '🔧',
    primaryColor: '#fbbf24', // Hazard Amber
    accentColor: '#fde047',
    borderColor: '#d97706',
    description: 'Prioritizes and repairs damaged barricades & structures',
    baseHp: 5,
    maxHp: 5,
    speed: 260,
    lifespan: 18,
  },
  [HelperType.TANK]: {
    name: 'Tank',
    badgeLabel: 'TANK',
    icon: '🛡️',
    primaryColor: '#a855f7', // Shield Purple
    accentColor: '#d8b4fe',
    borderColor: '#7e22ce',
    description: 'Absorbs and intercepts incoming hostile projectiles',
    baseHp: 15,
    maxHp: 15,
    speed: 380,
    lifespan: 22,
  },
};
```

### 3.2 State Model & Expanded Helper Class Attributes
To support rich combat behaviors and UI visualization, `Helper` will maintain:
- `public type: HelperType`
- `public hp: number; public maxHp: number; public isInvincible: boolean;`
- `public lifespan: number; public maxLifespan: number;`
- `public actionTimer: number`: Timer for firing (Fighter), healing (Medic), or welding (Repair Bot).
- `public actionInterval: number`: Frequency of action execution.
- `public tetherTarget: { x: number; y: number } | null`: Coordinates of the active beam target.
- `public feedbackText: string | null; public feedbackTimer: number;`: Floating text (e.g. `+1 HEAL`, `+REPAIR`).
- `public warpInTimer: number`: 0.6s spawn flare animation.

---

## 4. Behavior Logic for Fighter, Medic, and Repair Bot

### 4.1 Fighter AI (`HelperType.FIGHTER`)
- **Mission**: Engage and neutralize hostile forces before they breach defense lines.
- **Targeting Hierarchy**:
  1. **Barricade Saboteurs**: Enemies marked as gnawing (`enemy.isGnawing === true`) or saboteur archetypes.
  2. **Low-Altitude Invaders**: Enemies closest to bottom of canvas (highest `position.y`).
  3. **High-Threat / Diving Monsters**: Enemies in dive or rush state (`enemy.isDiving || enemy.isRushing`).
  4. **Nearest Living Enemy**: Fallback Euclidean distance.
- **Movement & Positioning**:
  - Tracks target X position smoothly with speed $320\text{px/s}$.
  - Hovers at defense altitude ($y \approx \text{logicalHeight} - 80$).
- **Weapon System**:
  - Fire rate: Every 0.3s.
  - Spawns high-velocity plasma bolts (`velocity.y = -500`, `damage = 2`, `piercing = 1`, `faction = Faction.PLAYER`).
  - Target laser sight drawn between Fighter and acquired hostile.

### 4.2 Medic AI (`HelperType.MEDIC`)
- **Mission**: Escort the player vessel, keep player alive, mitigate combat penalties.
- **Targeting**:
  - Always targets `player` (`src/game/Player.ts`).
- **Movement & Formation**:
  - Flies in defensive formation flanking the player:
    $$\text{targetX} = \text{player.position.x} + (\text{offsetSide} \cdot 45\text{px})$$
    $$\text{targetY} = \text{player.position.y} - 25\text{px}$$
  - Maintains horizontal offset so it does not block the player's line of fire.
- **Healing & Shielding Logic**:
  - Action interval: Every $3.5\text{s}$.
  - Condition 1: If `player.hp < player.maxHp`:
    - Restores `player.hp = Math.min(player.maxHp, player.hp + 1)`.
    - Spawns floating `+1 HP` text and green pulse shockwave.
  - Condition 2: If `player.hp === player.maxHp`:
    - Relieves player stress and combat suppression:
      `player.stressLevel = Math.max(0, player.stressLevel - 30);`
      `player.suppressionLevel = Math.max(0, player.suppressionLevel - 30);`
    - Provides a 1.5s nano-shield buff / invulnerability tick or refreshes `hasAcidShield`.
  - Visual Tether: Emits an emerald nano-stream connecting Medic to Player ship with orbiting green crosses.

### 4.3 Repair Bot AI (`HelperType.REPAIRER`)
- **Mission**: Prioritize and repair damaged defensive barricades and central structures.
- **Targeting Hierarchy**:
  1. Barricade under active enemy attack (`enemy.isGnawing === true` on that barricade).
  2. Damaged barricade with the lowest current HP ratio:
     $$\min \left( \frac{\text{barricade.hp}}{\text{barricade.maxHp}} \right) \quad \text{where } \text{barricade.hp} < \text{barricade.maxHp}$$
  3. If all barricades are at 100% HP: Sweeps back and forth in a patrol pattern across the defense line.
- **Movement & Positioning**:
  - Flees directly toward target barricade: $\text{targetX} = \text{barricade.position.x} + \frac{\text{barricade.width}}{2} - \frac{\text{this.width}}{2}$.
  - Hovers $20\text{px}$ directly above the barricade structure.
- **Repair Mechanics**:
  - Action interval: Every $0.4\text{s}$ while in range ($\Delta x < 25\text{px}$).
  - Restores missing voxel blocks (`barricade.blocks[i] = true`).
  - Restores HP: `barricade.hp = Math.min(barricade.maxHp, barricade.hp + 4)`.
  - If barricade was destroyed (`barricade.hp === 0`), revives the barricade structure!
  - Emits an amber electrical arc stream downward with welding spark particles falling onto the structure.

---

## 5. UI and Rendering Plan for Health Bars, Role Badges & Overlays

```
       +------------------------------------+
       |         [ ⚔️ FIGHTER ]             |  <-- Role Badge Pill (icon + name + border)
       |  +------------------------------+  |
       |  |████████████████████░░░░░░░░░|  |  <-- Overhead Health Bar (HP: 3/4)
       |  +------------------------------+  |
       |               ▼                    |
       |          /=========\               |
       |         |   (• •)   |              |  <-- Vector Ally Model
       |          \=========/               |
       |             ▲   ▲                  |
       |            Engine Exhaust          |
       +------------------------------------+
```

### 5.1 Canvas Overhead Health Bar
- **Dimensions**: $38\text{px}$ width $\times$ $5\text{px}$ height.
- **Position**: Centered above ally at $y = \text{position.y} - 8\text{px}$.
- **Background Track**: Solid slate `#0f172a` with a crisp $1\text{px}$ outline `#000000` to prevent visual blending against starfields or bright crisis backgrounds.
- **Health Ratio Fill**:
  $$\text{fillWidth} = 36\text{px} \times \max\left(0, \min\left(1, \frac{\text{hp}}{\text{maxHp}}\right)\right)$$
- **Color Progression**:
  - High ($> 60\%$): `#22c55e` (Vibrant Emerald)
  - Medium ($30\% - 60\%$): `#f59e0b` (Amber)
  - Critical ($< 30\%$): `#ef4444` (Crimson)
  - Invincible / Tank: Pulsing cyan/gold shimmer (`#38bdf8`)
- **Micro Numerical Display**: Clean $8\text{px}$ bold text (e.g. `HP 3/4` or `3`) rendered centered on or above the bar with text shadow.

### 5.2 Canvas Overhead Role Badge
- **Position**: Centered above the health bar at $y = \text{position.y} - 22\text{px}$.
- **Badge Container**: Rounded pill ($r = 3\text{px}$), dimensions $\approx 64\text{px} \times 14\text{px}$.
- **Style**:
  - Fill: `rgba(15, 23, 42, 0.92)` (High opacity deep slate).
  - Border: $1.5\text{px}$ stroke in the role's primary color (Fighter: `#22c55e`, Medic: `#06b6d4`, Repair Bot: `#fbbf24`).
  - Text & Icon:
    - Fighter: `⚔️ FIGHTER` in `#86efac`
    - Medic: `💚 MEDIC` in `#67e8f9`
    - Repair Bot: `🔧 REPAIR BOT` in `#fde047`
    - Tank: `🛡️ TANK` in `#d8b4fe`
  - Stroke: $2\text{px}$ black stroke behind text (`ctx.strokeText()`) guaranteeing 100% legibility on mobile and desktop regardless of background color shifts.

### 5.3 Action Feedback FX & Tethers
1. **Fighter Targeting Beam**: Delicate dashed laser line (`#22c55e`, opacity 0.3) pointing from Fighter to target enemy.
2. **Medic Healing Tether**: Double-sine glowing wave (`#06b6d4` & `#34d399`) drawn from Medic to Player ship with floating `+1 HP` floater.
3. **Repair Bot Arc Welding**: Jagged lightning arc (`#fbbf24`) with falling shower of welding particles hitting damaged barricade voxels.

### 5.4 Screen UI / React DOM Overlay Integration (`src/components/game-canvas.tsx`)
1. **Active Squadron Status HUD**:
   - Location: Top-left below TopHUD, or top center.
   - Component: `AlliedSquadronHUD`
   - Content: Shows active allies by role:
     `[ 🛡️ ALLIES: ⚔️ 2 | 💚 1 | 🔧 1 ]`
   - Interactive Tooltip / Label: "Fighter: Attacks Invaders | Medic: Heals Tank | Repair Bot: Restores Barricades".
2. **Massive Reinforcements In-Game Banner**:
   - Element: `data-testid="allied-reinforcement-banner"`
   - Triggered when a massive reinforcement event begins.
   - Styling: Blue/Gold double border banner with pulse animation:
     `✦ MASSIVE ALLIED REINFORCEMENTS ARRIVED! ✦`
     `[SQUADRON DEPLOYED: FIGHTERS, MEDICS & REPAIR BOTS ON STATION]`

---

## 6. Massive Reinforcement Event Trigger Mechanics

### 6.1 Event Trigger Channels
1. **Wave Milestones (Scheduled Arrival)**:
   - At key wave intervals (e.g. Wave 5, Wave 10, Wave 15, Wave 20), or at wave midpoint ($50\%$ enemies cleared).
   - Informs player: "ALLIED SQUADRON ARRIVED TO FORTIFY DEFENSES!"
2. **Crisis Counter-Measures (Emergency Survival Arrival)**:
   - When an Emergency Crisis (Stage 10+) or End-Game Crisis (Stage 15+) begins.
   - Or when Player HP reaches critical threshold (`player.hp <= 1`) and barricades are failing ($< 30\%$ health).
   - Prevents frustrating sudden-death game-overs by providing clutch tactical support.
3. **Dynamic Event Director**:
   - Existing random reinforcement timer (`reinforcementTimer`, `GameManager.ts:1078`):
   - Upgrade probability of `ALLY` event from 0.2 to 0.3 during high-difficulty waves, with a chance to trigger `MASSIVE_ALLY`.
4. **Manual Strategic Call-in**:
   - Existing `triggerSummonAlly()` (costs 50 Pure Water).
   - Upgraded to support:
     - `triggerSummonAlly()`: Summons 1 random specialized ally (50 Water).
     - `triggerMassiveAlliedReinforcements()`: Summons a complete tactical strike squadron (e.g. 100 Water, or accessible programmatically).

### 6.2 Squadron Composition Specification
When a **Massive Allied Reinforcement Event** is triggered, it spawns a full coordinated squadron of 4-5 units:
- **2x Fighters**: Deployed on left and right flanks.
- **1x Medic**: Deployed in close proximity to player vessel.
- **1-2x Repair Bots**: Deployed directly over the barricade clusters.
Each unit enters with a blue/cyan hyperspace warp-in flash (`this.createExplosion(...)` with `#38bdf8` particles) and audible warp chime.

---

## 7. Edge Cases, Entity Cleanup & Performance

### 7.1 Lifecycle & Destruction vs Expiration
- **Combat Destruction (`hp <= 0`)**:
  - Ally takes damage from hostile projectiles (`Faction.INVADER` or `Faction.ROGUE`).
  - Upon reaching $0$ HP: Ally explodes into role-colored particles, plays explosion sound, marks `isDead = true`.
- **Lifespan Expiry (`lifespan <= 0`)**:
  - Allies remain on station for their full duration (18-22 seconds).
  - During final 3 seconds: Flashes with sinusoidal alpha transparency (`Math.sin(lifespan * 15)`).
  - Upon expiry: Warps away into hyperspace (no violent death explosion).
- **Wave Clear Transition (`startNextWave()`)**:
  - In `startNextWave()`, existing helpers should either:
    - Persist into the next wave if their lifespan has not expired, OR
    - Safely warp out before the shop screen opens so they don't linger in frozen states.
  - Recommendation: At wave end (`GameState.SHOP`), active helpers warp out cleanly; fresh summons or reinforcements can occur on next wave start.

### 7.2 Performance & Memory Optimization
- **Array Compaction**: Uses in-place two-pointer compaction in `GameManager.update()` (lines 1403-1411), ensuring zero heap allocation during removal of expired/destroyed helpers.
- **Canvas Rendering Optimization**:
  - Static badge widths and cached metrics: Do not measure text every frame.
  - Draw order: Helpers drawn in Layer 2 (World Entities, line 2152) subject to screen shake, while banners and squadron HUD are drawn in Layer 3 (Stable Foreground, line 2270) without jitter.
- **Collision Efficiency**:
  - Uses existing `checkCollision(helper)` AABB and CCD logic.
  - Bullet-vs-Helper checks only run for hostile bullets (`bullet.faction !== Faction.PLAYER`, line 1776).

---

## 8. Playwright E2E Test Verification Strategy

### 8.1 Unit & Simulation Test Cases
1. **`allied_roles_initialization.test.ts`**:
   - Verify all 4 roles (`FIGHTER`, `MEDIC`, `REPAIRER/REPAIR_BOT`, `TANK`) initialize with correct `hp`, `maxHp`, `primaryColor`, and role metadata.
   - Assert `HelperType.FIGHTER === 0`, `HelperType.REPAIRER === 1`, `HelperType.TANK === 2`, `HelperType.MEDIC === 3`.
2. **`fighter_targeting_and_combat.test.ts`**:
   - Spawn a Fighter, an Invader, and a Saboteur gnawing a barricade.
   - Assert Fighter prioritizes the Saboteur / closest threat.
   - Assert all bullets generated by Fighter have `faction === Faction.PLAYER` and deal damage to enemies.
3. **`medic_healing_and_buffs.test.ts`**:
   - Set `player.hp = 1` and `player.stressLevel = 80`.
   - Spawn Medic helper and tick update loop by $3.6\text{s}$.
   - Assert `player.hp` increases to $2$ and `player.stressLevel` decreases.
   - Assert `player.hp` never exceeds `player.maxHp` (5).
4. **`repair_bot_barricade_restoration.test.ts`**:
   - Set `barricade[0].hp = 5` (out of 20) with multiple broken blocks.
   - Spawn Repair Bot and tick update loop.
   - Assert Repair Bot targets damaged barricade, restores broken blocks, and increments `barricade.hp`.
5. **`massive_reinforcement_event_orchestration.test.ts`**:
   - Invoke `gameManager.triggerMassiveAlliedReinforcements()`.
   - Assert that multiple helpers ($\ge 4$) are spawned containing at least one Fighter, one Medic, and one Repair Bot.
   - Assert active banner state is set.

### 8.2 Canvas & UI Verification Test Cases
1. **`allied_ui_overhead_badges_and_healthbars.spec.ts`**:
   - Evaluate `window.gameManager` via Playwright `page.evaluate()`.
   - Spawn each ally role and verify drawing routines execute without throwing errors.
   - Verify role labels (`FIGHTER`, `MEDIC`, `REPAIR BOT`) and health bar coordinates.
   - Inspect DOM elements: `data-testid="allied-reinforcement-banner"`, `data-testid="ally-squadron-hud"`.
2. **`allied_damage_and_destruction.spec.ts`**:
   - Spawn hostile enemy bullet colliding with a Fighter (`hp: 4`).
   - Bullet deals 2 damage $\to$ verify `fighter.hp === 2` and health bar width updates.
   - Bullet deals 2 damage $\to$ verify `fighter.hp === 0`, `fighter.isExpired() === true`, and entity is removed via compaction.
3. **Regression Suite**:
   - Run full Playwright test suite (`npx playwright test`) ensuring 0 regressions on existing 101 tests.

---

## 9. Implementation Roadmap & Checklist

| Phase | Target Files | Key Actions |
|-------|--------------|-------------|
| **1. Types & Models** | `src/game/Helper.ts`, `src/game/types.ts` | Define `HelperType.MEDIC = 3`, `AllyRoleName`, role configs, stat attributes. |
| **2. AI Behaviors** | `src/game/Helper.ts` | Pass `player?: Player` to `Helper.update()`. Implement Medic healing/buff logic, Repair Bot barricade prioritization, Fighter saboteur prioritization. |
| **3. Overhead UI** | `src/game/Helper.ts` | Implement vector rendering, overhead health bar ($38\times 5\text{px}$) with dynamic colors, overhead role badge ($[⚔️ FIGHTER]$, $[💚 MEDIC]$, $[🔧 REPAIR BOT]$) with black outline. |
| **4. Event Director** | `src/game/GameManager.ts` | Implement `triggerMassiveAlliedReinforcements()`, integrate with wave milestones (every 5 waves) and emergency low-HP trigger. |
| **5. Overlay & HUD** | `src/components/game-canvas.tsx` | Add `AlliedSquadronHUD` and `data-testid="allied-reinforcement-banner"` in overlay layer. |
| **6. Verification** | `tests/` | Implement comprehensive Playwright test suite for R2; verify `npx tsc --noEmit` and `npx playwright test`. |

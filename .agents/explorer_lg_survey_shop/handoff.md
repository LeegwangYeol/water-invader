# Handoff Report: Shop System, Player Weapon Inventory, and Homing Missile (유도탄) Architecture

- **Date / Timestamp**: 2026-09-03T10:16:00Z
- **Author**: Explorer Subagent (`explorer_lg_survey_shop`)
- **Target Feature**: Requirement 1 (R1) — Homing Missile Weapon Upgrade (유도탄)
- **Status**: Complete Investigation & Actionable Technical Specification

---

## 1. Observation

### 1.1 Codebase Structure & File Locations
1. **Shop UI Location**:
   - The user prompt referenced `src/components/Shop.tsx`, but direct filesystem inspection confirms no standalone `Shop.tsx` currently exists.
   - All shop rendering is located in `src/components/game-canvas.tsx`:
     - `ShopUpgradePanel` (`src/components/game-canvas.tsx:24–104`): Memoized upgrade rows used across modals.
     - `ShopModal` (`src/components/game-canvas.tsx:409–455`): Inter-wave shop overlay and pre-game armory overlay.
     - `GameOverModal` (`src/components/game-canvas.tsx:472–518`): Post-defeat shop allowing players to spend residual currency before replay.
2. **Player Weapon & Upgrade State**:
   - In `src/game/Player.ts:12–18`:
     ```ts
     // Upgradeable stats
     public baseFireRate: number = 0.5; // seconds between shots
     public multiShot: number = 1; // number of projectiles
     public piercing: number = 1; // new weapon upgrade
     public hasAcidShield: boolean = false; // Acid Rain immunity shield
     public ultimateGauge: number = 0; // 0 to 100
     ```
   - Primary firing logic is located in `src/game/Player.ts:103–169` (`Player.fire()`):
     - Uses `this.baseFireRate` reduced dynamically by `stressLevel`.
     - Multi-shot (`1..5`) calculates horizontal offsets and angles (`[-20, -10, 0, 10, 20]`).
     - Piercing (`1..5`) sets the initial `piercing` counter on spawned `Bullet` instances.
     - Returns `Bullet[]` which `GameManager` collects and pushes to `this.bullets`.
3. **GameManager Upgrade Methods & UI Sync**:
   - In `src/game/GameManager.ts:2054–2109`:
     ```ts
     public getUpgrades(): { fireRate: number; multiShot: number; piercing: number; hasAcidShield: boolean } {
       const fireRateLevel = this.player ? Math.min(5, Math.max(1, Math.round((0.5 - this.player.baseFireRate) / 0.1) + 1)) : 1;
       return {
         fireRate: fireRateLevel,
         multiShot: this.player ? this.player.multiShot : 1,
         piercing: this.player ? this.player.piercing : 1,
         hasAcidShield: this.player ? !!this.player.hasAcidShield : false,
       };
     }
     ```
   - Purchasing methods:
     - `upgradeFireRate()`: Requires `currency >= 50 && fireRate < 5`, deducts 50 💧, decreases `player.fireRate` by 0.1s.
     - `upgradeMultiShot()`: Requires `currency >= 100 && player.multiShot < 5`, deducts 100 💧, increments `player.multiShot++`.
     - `upgradePiercing()`: Requires `currency >= 200 && player.piercing < 5`, deducts 200 💧, increments `player.piercing++`.
     - `upgradeAcidShield()`: Requires `currency >= 150 && !player.hasAcidShield`, deducts 150 💧, sets `player.hasAcidShield = true`.
     - Hull repair is handled in `game-canvas.tsx:787–803`: `currency >= 75 && player.hp < maxHp`, restores 1 HP for 75 💧.
4. **State Persistence Across Runs & Pre-Game vs In-Game Shop**:
   - In `src/game/GameManager.ts:152–242` (`init(resetScoreAndCashOrOptions, preserveUpgrades)`):
     - `preserveUpgrades === true`: Retains `player.baseFireRate`, `player.multiShot`, `player.piercing`, `player.hasAcidShield`, and preserves existing `this.currency`.
     - `preserveUpgrades === false`: Completely resets player stats to Lv. 1, `hasAcidShield = false`, and currency to 150 starter allowance (if `resetScoreAndCash = true`).
   - Pre-Game Shop flow:
     - Main menu "ARMORY & WORKSHOP" calls `handleOpenPreGameShop()` (`game-canvas.tsx:743–753`), setting `isPreGameShop = true` and `gameState = GameState.SHOP`.
     - Starting from pre-game shop triggers `startGame()` (`game-canvas.tsx:730–741`), executing `init(false, true)` which strictly preserves pre-game purchases into Wave 1.
5. **Existing Economy Scaling**:
   - Starter allowance: 150 💧 (`GameManager.ts:34`).
   - Kill rewards: Normal enemy base 5 💧, Boss base 50 💧 (`GameManager.ts:1585`), scaled by `comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.5`.
   - Crisis defeat reward: +500 💧 (`GameManager.ts:375`).
   - Total cost to purchase ALL existing upgrades:
     - Fire Rate (Lv 1->5): 4 * 50 = 200 💧
     - Multi-Shot (Lv 1->5): 4 * 100 = 400 💧
     - Piercing (Lv 1->5): 4 * 200 = 800 💧
     - Acid Shield: 150 💧
     - **Grand Total for Existing Upgrades: 1,550 💧**.
   - Consequence: By Wave 8–10, players typically acquire 2,000–4,000+ 💧, leaving the economy with excess liquidity and no late-game weapon sinks.
6. **Existing Target-Seeking Patterns in Codebase**:
   - `src/game/crisis/AlliedReinforcements.ts:260–274`:
     ```ts
     let nearestDist = Infinity;
     for (const e of enemies) {
       if (!e.isDead) {
         const ex = e.position.x + e.size.width / 2;
         const ey = e.position.y + e.size.height / 2;
         const d = Math.hypot(ex - (this.position.x + this.size.width / 2), ey - this.position.y);
         if (d < nearestDist) {
           nearestDist = d;
           targetX = ex;
           targetY = ey;
         }
       }
     }
     ```
   - `src/game/Helper.ts:68–80`: Similar targeting logic finding closest/lowest enemy.

---

## 2. Logic Chain

1. **Problem Analysis (Late-Game Swarm & Close Spawns)**:
   - Wave 10+ introduces aggressive enemy archetypes (Divers diving at high speed, Snipers at screen edges, Escort Legions, and Bosses).
   - In Waves 10–25, enemies spawn closer to the player or dive down rapidly.
   - Primary weapon fire travels straight or in fixed forward spreads (`[-20°..+20°]`), leaving the lower flanks vulnerable.
   - Homing Missiles (유도탄) must actively prioritize the closest threat in Euclidean distance, providing 360° defensive coverage and high burst damage.

2. **Weapon Equipping & Firing Slot Analysis (Task 3 Evaluation)**:
   - *Option A: Autonomous Secondary Missile Pod (Selected)*:
     - Player ship possesses an independent secondary launcher.
     - Operates on a dedicated cadence (`missileTimer`), independent of player shooting input (or active whenever player is in combat).
     - *Advantage*: Zero extra button inputs needed; flawless touch/mobile support; fires autonomously even while player is frantically dodging.
   - *Option B: Supplementary Salvo on Primary Fire*:
     - Missiles fire only when player presses shoot / spacebar.
     - *Advantage*: Predictable control.
     - *Risk*: If coupled naively to primary fire rate, stress mechanics (3x fire rate) would flood missiles unless a secondary timer throttles it.
   - *Option C: Weapon Toggle*:
     - Toggle key between Primary Water Cannon and Missiles.
     - *Flaw*: Unviable for mobile touch controls (requires extra UI toggle button) and disrupts core arcade flow.
   - *Conclusion on Slotting*:
     - **Autonomous Secondary Salvo Pod**: Integrated directly into `Player.ts`.
     - When `player.homingMissiles > 0`, the pod charges a missile timer.
     - When charged and not EMP-suppressed, it detects the closest living enemy and launches high-velocity seeking torpedoes.

3. **Pricing Curve Logic (Task 4 Evaluation)**:
   - Existing early upgrades cost 50, 100, 200 💧 (totaling 1,550 💧).
   - Homing Missiles represent a Tier-2 advanced weapon system intended for late-game scaling.
   - Initial unlock (Lv. 1) should be priced at **250 💧** (exceeds the 150 starter allowance so it cannot be acquired on Wave 0 without prior earnings, but is affordable by Wave 3–5).
   - Subsequent levels scale non-linearly to absorb surplus late-game currency:
     - **Lv. 1**: 250 💧 (Unlock pod: 1 missile every 2.0s, 3 damage)
     - **Lv. 2**: 450 💧 (1 missile every 1.6s, 4 damage)
     - **Lv. 3**: 700 💧 (2-missile salvo every 1.4s, 5 damage)
     - **Lv. 4**: 1,000 💧 (2-missile salvo every 1.1s, 6 damage)
     - **Lv. 5**: 1,400 💧 (3-missile salvo every 0.9s, 7 damage, MAX)
     - **Cumulative Cost**: **3,800 💧**.
   - This provides meaningful progression from mid-game (Wave 5–8) all the way into deep late-game (Wave 15–25+).

4. **Physics & Seeking Trajectory Mechanics**:
   - Each frame, missile computes Euclidean distance to all living hostiles:
     `d = Math.hypot(enemyCenterX - missileX, enemyCenterY - missileY)`
   - Missiles track the target using smooth angular velocity turning (e.g. `turnRate = 8.0 rad/s`, max speed `450 px/s`).
   - If the locked target is destroyed before impact, the missile immediately re-locks onto the next closest living enemy.
   - If no enemies remain on screen, the missile accelerates forward off-screen.
   - CCD (Continuous Collision Detection) already built into `Entity.checkCollision()` via swept bounds prevents tunneling through fast-moving enemies.

---

## 3. Caveats

1. **File Organization (Shop.tsx vs game-canvas.tsx)**:
   - The user request mentions `src/components/Shop.tsx`. Currently, `ShopUpgradePanel`, `ShopModal`, and `GameOverModal` are co-located in `src/components/game-canvas.tsx`.
   - Modifying `game-canvas.tsx` directly ensures zero risk of broken imports or React context mismatches with existing tests.
   - If desired, `ShopUpgradePanel` can also be cleanly extracted or re-exported via `src/components/Shop.tsx` for cleaner architectural modularity.
2. **EMP Crisis Interaction**:
   - During `EMP_DISRUPTION` crisis, `crisisState.empSuppressionActive` is set to `true`.
   - Homing missiles must respect EMP suppression (launcher disabled while EMP is active) to maintain crisis tension.
3. **Target Eligibility**:
   - The homing seeker must exclusively target hostile entities:
     - `Faction.INVADER`
     - `Faction.ROGUE`
     - Crisis boss sovereign body (`CrisisSovereign`) and rift anchors (`DimensionalRift`).
   - It must never target player helpers, barricades, or allied reinforcements.

---

## 4. Conclusion & Complete Technical Specification

### 4.1 Data Structures & Type Definitions

#### `src/game/types.ts`
```ts
export interface UpgradesState {
  fireRate: number;       // Lv 1..5
  multiShot: number;      // Lv 1..5
  piercing: number;       // Lv 1..5
  hasAcidShield: boolean; // boolean
  homingMissiles: number; // Lv 0..5 (0 = unpurchased, 1..5 = active tier)
}
```

#### `src/game/Bullet.ts` (or `HomingMissile.ts`)
Add homing capabilities to projectile architecture:
```ts
export class HomingMissile extends Bullet {
  public target: Entity | null = null;
  public turnSpeed: number = 7.5; // radians per second
  public maxSpeed: number = 440;  // pixels per second
  public lifeTimer: number = 4.0; // 4 seconds max flight
  public smokeTimer: number = 0;

  constructor(x: number, y: number, damage: number) {
    super(x, y, -250, damage, true, 1);
    this.size = { width: 8, height: 16 };
    this.color = '#818cf8'; // Indigo/Cyan Torpedo
    this.isInterceptable = false;
  }

  public update(deltaTime: number, enemies?: Entity[]): void {
    this.prevPosition = { x: this.position.x, y: this.position.y };
    this.lifeTimer -= deltaTime;
    if (this.lifeTimer <= 0) {
      this.isDead = true;
      return;
    }

    // Retarget if current target is dead or unassigned
    if (!this.target || this.target.isDead) {
      this.target = this.findClosestTarget(enemies);
    }

    if (this.target && !this.target.isDead) {
      const tx = this.target.position.x + this.target.size.width / 2;
      const ty = this.target.position.y + this.target.size.height / 2;
      const mx = this.position.x + this.size.width / 2;
      const my = this.position.y + this.size.height / 2;

      const targetAngle = Math.atan2(ty - my, tx - mx);
      let currentAngle = Math.atan2(this.velocity.y, this.velocity.x);

      // Shortest angular delta
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const turnStep = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turnSpeed * deltaTime);
      currentAngle += turnStep;

      this.velocity.x = Math.cos(currentAngle) * this.maxSpeed;
      this.velocity.y = Math.sin(currentAngle) * this.maxSpeed;
    }

    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  private findClosestTarget(entities?: Entity[]): Entity | null {
    if (!entities || entities.length === 0) return null;
    let closest: Entity | null = null;
    let minDist = Infinity;
    const mx = this.position.x + this.size.width / 2;
    const my = this.position.y + this.size.height / 2;

    for (const e of entities) {
      if (e.isDead || (e.faction !== Faction.INVADER && e.faction !== Faction.ROGUE)) continue;
      const ex = e.position.x + e.size.width / 2;
      const ey = e.position.y + e.size.height / 2;
      const dist = Math.hypot(ex - mx, ey - my);
      if (dist < minDist) {
        minDist = dist;
        closest = e;
      }
    }
    return closest;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // Custom vector torpedo drawing with rotating angle, glowing fins, and booster plume
    ...
  }
}
```

### 4.2 Player Integration (`src/game/Player.ts`)
1. **New Fields**:
   ```ts
   public homingMissiles: number = 0; // 0 = unpurchased, 1..5 = upgrade level
   private missileTimer: number = 0;
   ```
2. **Missile Salvo Cadence & Damage Scaling**:
   | Level | Interval | Missiles per Salvo | Damage per Missile | Total Salvo Burst |
   |---|---|---|---|---|
   | **Lv. 1** | 2.0s | 1 | 3 | 3 |
   | **Lv. 2** | 1.6s | 1 | 4 | 4 |
   | **Lv. 3** | 1.4s | 2 | 5 | 10 |
   | **Lv. 4** | 1.1s | 2 | 6 | 12 |
   | **Lv. 5 (MAX)** | 0.9s | 3 | 7 | 21 |
3. **Update Loop Integration**:
   ```ts
   public update(deltaTime: number, enemies?: Enemy[]): Bullet[] {
     ...
     const generatedBullets: Bullet[] = [];
     if (this.isShooting) {
       generatedBullets.push(...this.fire());
     }
     
     // Autonomous Homing Missile Salvo Pod
     if (this.homingMissiles > 0) {
       this.missileTimer -= deltaTime;
       if (this.missileTimer <= 0) {
         const intervals = [0, 2.0, 1.6, 1.4, 1.1, 0.9];
         const counts = [0, 1, 1, 2, 2, 3];
         const damages = [0, 3, 4, 5, 6, 7];

         const lvl = Math.min(5, Math.max(1, this.homingMissiles));
         this.missileTimer = intervals[lvl];
         const count = counts[lvl];
         const dmg = damages[lvl];

         for (let i = 0; i < count; i++) {
           const offset = (i - (count - 1) / 2) * 16;
           const missile = new HomingMissile(
             this.position.x + this.size.width / 2 + offset,
             this.position.y - 10,
             dmg
           );
           generatedBullets.push(missile);
         }
       }
     }
     return generatedBullets;
   }
   ```

### 4.3 GameManager Integration (`src/game/GameManager.ts`)
1. **Pricing Array Constant**:
   ```ts
   export const HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400];
   ```
2. **Upgrade Method**:
   ```ts
   public upgradeHomingMissiles(): boolean {
     const currentLevel = this.player ? this.player.homingMissiles : 0;
     if (currentLevel >= 5) return false;
     const cost = HOMING_MISSILE_COSTS[currentLevel];
     if (this.currency < cost) return false;

     this.currency -= cost;
     this.player.homingMissiles++;
     soundManager.playPowerUp();
     this.updateScoreUI();
     this.updateUpgradesUI();
     return true;
   }
   ```
3. **State Preservation in `init()`**:
   ```ts
   // In init() preserveUpgrades branch:
   // Preserve player upgrades:
   this.player.homingMissiles = this.player.homingMissiles;
   // In !shouldPreserve branch:
   this.player.homingMissiles = 0;
   ```
4. **`getUpgrades()` Return Type**:
   ```ts
   public getUpgrades() {
     return {
       fireRate: fireRateLevel,
       multiShot: this.player ? this.player.multiShot : 1,
       piercing: this.player ? this.player.piercing : 1,
       hasAcidShield: this.player ? !!this.player.hasAcidShield : false,
       homingMissiles: this.player ? this.player.homingMissiles : 0,
     };
   }
   ```
5. **Bullet Update Loop**:
   - When updating bullets in `GameManager.ts:1152`:
     ```ts
     this.bullets.forEach(bullet => {
       if (bullet instanceof HomingMissile) {
         bullet.update(deltaTime, this.enemies);
       } else {
         bullet.update(deltaTime);
       }
     });
     ```

### 4.4 UI Integration (`src/components/game-canvas.tsx`)
1. **Row Component in `ShopUpgradePanel`**:
   ```tsx
   {/* Homing Missiles (유도탄) */}
   <div className="flex justify-between items-center mb-4">
     <div>
       <div className="flex items-center gap-1.5">
         <p className="font-bold">
           {t('유도 미사일', 'Homing Missiles')} (Lv. {upgrades.homingMissiles || 0})
         </p>
         {upgrades.homingMissiles > 0 && (
           <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500 font-mono">
             🚀 Lv.{upgrades.homingMissiles}
           </span>
         )}
       </div>
       <p className="text-xs sm:text-sm text-slate-400">
         {t('가장 가까운 적을 자동 추적하여 큰 피해를 줍니다', 'Auto-seeks nearest enemy with heavy damage')}
       </p>
     </div>
     <button
       data-testid="buy-homing-missiles-btn"
       onClick={onBuyHomingMissiles}
       disabled={
         (upgrades.homingMissiles || 0) >= 5 ||
         currency < HOMING_MISSILE_COSTS[upgrades.homingMissiles || 0]
       }
       className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 rounded font-bold transition-colors"
     >
       {(upgrades.homingMissiles || 0) >= 5
         ? 'MAX'
         : `${HOMING_MISSILE_COSTS[upgrades.homingMissiles || 0]} 💧`}
     </button>
   </div>
   ```
2. **Handlers & Prop Drilling**:
   - `onBuyHomingMissiles` wired through `ShopUpgradePanelProps`, `ShopModalProps`, `GameOverModalProps`.
   - Memoized callback `buyHomingMissiles` created in `GameCanvas` via `useCallback`.

### 4.5 Sound Effects (`src/game/SoundManager.ts`)
- Add `playMissileLaunch()`: Frequency sweep from 220Hz up to 660Hz with soft white-noise rocket booster hiss.
- Add `playMissileExplosion()`: Low rumble burst at 80Hz exponentially decaying over 0.35s.

---

## 5. Verification Method

### 5.1 Independent Verification Plan
Once approved for implementation, verify the system through automated tests:

1. **Unit Test Suite (`tests/unit/homing_missile.test.ts`)**:
   - **MISSILE-01**: Baseline verification: `player.homingMissiles === 0` by default.
   - **MISSILE-02**: Upgrade pricing and progression:
     - Starting with 4,000 💧, buying Lv. 1 deducts 250 💧.
     - Buying Lv. 2 deducts 450 💧.
     - Buying Lv. 3 deducts 700 💧.
     - Buying Lv. 4 deducts 1,000 💧.
     - Buying Lv. 5 deducts 1,400 💧.
     - Total remaining currency is 200 💧.
     - 6th purchase attempt is rejected (`upgradeHomingMissiles()` returns `false`).
   - **MISSILE-03**: State persistence:
     - `init(false, true)` preserves `player.homingMissiles`.
     - `init(true, false)` resets `player.homingMissiles` to 0.
   - **MISSILE-04**: Nearest-enemy seeking geometry:
     - Place 3 enemies at `(100, 200)`, `(300, 500)`, `(500, 100)`.
     - Spawn homing missile at `(300, 600)`.
     - Verify missile velocity vector orients towards `(300, 500)` (distance 100) rather than distant enemies.
   - **MISSILE-05**: Damage and collision:
     - Spawn Diver enemy (HP 2).
     - Missile (damage 4) hits Diver -> Diver dies in 1 hit, verifying high burst clearance.
   - **MISSILE-06**: EMP suppression:
     - When `crisisState.empSuppressionActive === true`, missile timer does not fire.

2. **Integration / E2E Suite (`tests/07_homing_missile_shop_progression.spec.ts`)**:
   - Verify Pre-Game Shop renders Homing Missile row with bilingual copy and correct disabled state when currency < 250.
   - Give 1,000 💧 via F5 cheat key -> purchase Lv. 1 (250 💧) -> verify button updates to `450 💧`.
   - Deploy to Wave 1 -> fire missiles -> verify Playwright screenshot/canvas inspect confirms seeking trajectories.
   - Simulate Wave 10+ close spawn conditions -> confirm missiles lock on and destroy incoming flankers.

3. **Regression Commands**:
   ```bash
   npx tsc --noEmit
   npm run build
   npx playwright test tests/06_shop_economy_max_upgrades.spec.ts tests/unit/pregame_shop_persistence.test.ts tests/adversarial_economy_shop_persistence_stress.spec.ts
   ```

---
*Report completed by Explorer subagent `explorer_lg_survey_shop`.*

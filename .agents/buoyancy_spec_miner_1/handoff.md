# Handoff Report: Buoyancy, Ballast Restoration & Hydrothermal Vent Physics Specifications

**Agent**: `buoyancy_spec_miner_1` (`teamwork_preview_spec_miner`)  
**Mission**: Mine exact quantitative specifications, constants, physics invariants, and edge condition behaviors for player submarine buoyancy, ballast restoration, and hydrothermal vent dissipation.  
**Deliverable Path**: `/Users/user/src/water-invader/.agents/buoyancy_spec_miner_1/handoff.md`  
**Date**: 2026-09-17  

---

## 1. Observation

Direct codebase observations across architecture, formulas, and existing test suites:

### 1.1 Canvas Dimensions & Grid Invariants
- **`src/game/GameManager.ts`**:
  - Line 161: `public readonly logicalWidth: number = 600;`
  - Line 162: `public readonly logicalHeight: number = 800;`
  - Lines 181–183:
    ```typescript
    this.canvas.width = this.logicalWidth * this.dpr;
    this.canvas.height = this.logicalHeight * this.dpr;
    this.flagshipManager = new FlagshipManager(this.logicalWidth, this.logicalHeight);
    ```
  - Lines 310–311, 321–322, 540–541, 620–621:
    ```typescript
    this.player.position.x = this.logicalWidth / 2 - 25; // 275
    this.player.position.y = this.logicalHeight - 60;    // 740
    ```
- **`src/game/Enemy.ts`**:
  - Line 46: `public canvasHeight: number = 960;` (default parameter fallback)
  - Line 126: `constructor(..., canvasWidth: number = 720, ..., canvasHeight: number = 960)`
  - In actual instantiation within `GameManager.ts`, all enemies receive `this.logicalWidth` (600) and `this.logicalHeight` (800).
  - *Invariant Confirmation*: `logicalWidth = 600` and `logicalHeight = 800` are strictly preserved.

### 1.2 Player Entity Dimensions & Baseline Y Coordinates
- **`src/game/Player.ts`**:
  - Lines 53–56:
    ```typescript
    constructor(canvasWidth: number, canvasHeight: number) {
      super(canvasWidth / 2 - 25, canvasHeight - 60, 50, 40);
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
    ```
  - Line 91:
    ```typescript
    if (!Number.isFinite(this.position.y)) this.position.y = this.canvasHeight - this.size.height - 20;
    ```
  - Lines 97–100 (Hard boundaries):
    ```typescript
    if (this.position.y < 0) this.position.y = 0;
    if (this.position.y + this.size.height > this.canvasHeight) {
      this.position.y = this.canvasHeight - this.size.height;
    }
    ```
- **`src/game/flagship/progression/ModularChassis.ts`**:
  Hitbox specifications across modular chassis profiles (`applyToPlayer` lines 416–417):
  - `DEFAULT` (no chassis equipped): `hitboxWidth: 50`, `hitboxHeight: 40`
  - `NAUTILUS` (`ChassisId.NAUTILUS`): `hitboxWidth: 64`, `hitboxHeight: 46`
  - `STINGRAY` (`ChassisId.STINGRAY`): `hitboxWidth: 38`, `hitboxHeight: 30`
  - `KRAKEN` (`ChassisId.KRAKEN`): `hitboxWidth: 50`, `hitboxHeight: 40`
  - `LEVIATHAN` (`ChassisId.LEVIATHAN`): `hitboxWidth: 54`, `hitboxHeight: 42`
  - `GHOST` (`ChassisId.GHOST`): `hitboxWidth: 46`, `hitboxHeight: 34`

  Using the operational baseline formula `baselineY = canvasHeight - size.height - 20`:
  | Chassis | Hitbox ($W \times H$) | Baseline $Y$ (`canvasHeight - H - 20`) | Submarine Range ($Y$) | Seafloor Clearance |
  | :--- | :--- | :--- | :--- | :--- |
  | **DEFAULT** | $50 \times 40$ | **$740\text{ px}$** | $[740, 780]$ | $20\text{ px}$ |
  | **NAUTILUS** | $64 \times 46$ | **$734\text{ px}$** | $[734, 780]$ | $20\text{ px}$ |
  | **STINGRAY** | $38 \times 30$ | **$750\text{ px}$** | $[750, 780]$ | $20\text{ px}$ |
  | **KRAKEN** | $50 \times 40$ | **$740\text{ px}$** | $[740, 780]$ | $20\text{ px}$ |
  | **LEVIATHAN** | $54 \times 42$ | **$738\text{ px}$** | $[738, 780]$ | $20\text{ px}$ |
  | **GHOST** | $46 \times 34$ | **$746\text{ px}$** | $[746, 780]$ | $20\text{ px}$ |
  *(Note: All chassis maintain submarine keel bottom $Y = 780\text{ px}$, leaving exactly $20\text{ px}$ clearance above the $800\text{ px}$ seafloor).*

### 1.3 Hydrothermal Vent Plume Geometry & Updraft Forces
- **`src/game/flagship/environment/HydrothermalVent.ts`**:
  - Lines 34–36: `anchorX: number` (180 or 420), `baseY = 760`, `capY = 100`.
  - Lines 41–44: Cycle durations: `dormantDuration: 7.5s`, `chargingDuration: 1.5s`, `eruptingDuration: 3.0s` (total 12.0s).
  - Lines 109–120:
    ```typescript
    public getCoreRadius(y: number): number {
      const clampedY = Math.max(this.capY, Math.min(this.baseY, y));
      return 22 + (this.baseY - clampedY) * 0.08;
    }
    public getHaloRadius(y: number): number {
      return this.getCoreRadius(y) * 1.85;
    }
    ```
    - At seabed ($y=760$): $R_{\text{core}} = 22.0\text{ px}$, $R_{\text{halo}} = 40.7\text{ px}$.
    - At baseline ($y=740$): $R_{\text{core}} = 23.6\text{ px}$, $R_{\text{halo}} = 43.66\text{ px}$.
    - At plume cap ($y=100$): $R_{\text{core}} = 74.8\text{ px}$, $R_{\text{halo}} = 138.38\text{ px}$.
    - At lift limit ($y=130$): $R_{\text{core}} = 72.4\text{ px}$, $R_{\text{halo}} = 133.94\text{ px}$.
  - Lines 232–236 (Current Updraft Implementation):
    ```typescript
    // Convective updraft lifts player vessel slightly (+160 px/s)
    if (inHalo || inCore) {
      const lift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
      player.position.y = Math.max(this.capY + 30, player.position.y - lift);
    }
    ```
  - **Lift Rates**:
    - `DORMANT` / `CHARGING`: $+160\text{ px/s}$ upward ($\Delta y = -160 \cdot \Delta t$).
    - `ERUPTING`: $+260\text{ px/s}$ upward ($\Delta y = -260 \cdot \Delta t$).
    - Ceiling Clamp: `this.capY + 30 = 130\text{ px}`.
  - **Missing Physics**: Once lifted to $y=130$, there is NO restoring force in `Player.ts`. Even if the player steers horizontally outside $R_{\text{halo}}$, `player.position.y` remains permanently frozen at $y=130$. Furthermore, at $y=130$, there is zero lateral plume dissipation force to push an idle submarine out of the column.

### 1.4 Steam Lance Transformation Invariant
- **`src/game/flagship/environment/HydrothermalVent.ts`** (Lines 277–290):
  ```typescript
  // 5. Projectile Interactions: Steam Lances & Counter-Buoyancy
  for (const bullet of bullets) {
    if (!bullet || !bullet.position || bullet.isDead) continue;
    const inCore = this.isInCore(bullet.position.x, bullet.position.y);

    if (inCore) {
      if (bullet.isPlayerBullet) {
        // Player Bullet -> Superheated Steam Lance Transformation
        if (!(bullet as any).__steamLance) {
          (bullet as any).__steamLance = true;
          bullet.damage = Math.round(bullet.damage * 1.35); // +35% damage
          bullet.piercing = (bullet.piercing || 1) + 1; // +1 pierce
          bullet.velocity.y = Math.min(bullet.velocity.y, -680); // Speed boosted to -680 px/s
        }
      } else {
        // Enemy Bullet -> Counter-buoyancy (ay = -520 px/s^2) and vaporization within 0.35s
        bullet.velocity.y += -520 * deltaTime;
        (bullet as any).__ventDissolveTimer = ((bullet as any).__ventDissolveTimer || 0) + deltaTime;
        if ((bullet as any).__ventDissolveTimer >= 0.35) {
          bullet.isDead = true;
        }
      }
    }
  }
  ```
- Explicit conditions verified by `tests/playtest_stream_b_vents_currents.spec.ts` (STREAM-B-04) and `tests/unit/flagship_features.test.ts` (VENT-03, VENT-04).

### 1.5 Enemy Vent Damage Invariant
- **`src/game/flagship/environment/HydrothermalVent.ts`** (Lines 257–275):
  ```typescript
  // 4. Hostile Entity Heat DoT in Core: DPS = 28 + 0.06 * MaxHP
  for (const enemy of hostiles) {
    if (!enemy || !enemy.position) continue;
    const ex = enemy.position.x + (enemy.size?.width ?? 32) / 2;
    const ey = enemy.position.y + (enemy.size?.height ?? 32) / 2;

    if (this.isInCore(ex, ey)) {
      const maxHp = (enemy as any).maxHp ?? 50;
      const dps = 28 + 0.06 * maxHp;
      const damageThisFrame = dps * deltaTime;

      (enemy as any).hp -= damageThisFrame;
      (enemy as any).hitFlashTimer = 0.08;

      // Suppress boss shield regeneration while submerged in scalding core
      (enemy as any).shieldRegenSuppressed = true;
    }
  }
  ```
- Explicitly verified by `STREAM-B-03` in `tests/playtest_stream_b_vents_currents.spec.ts`.

---

## 2. Logic Chain

1. **Bug Root Cause**:
   - Updraft in `HydrothermalVent.ts` directly decrements `player.position.y` until clamped at `capY + 30` ($130\text{ px}$).
   - `Player.ts` update loop only processes horizontal velocity ($v_x = \pm 300\text{ px/s}$). It possesses no vertical velocity, ballast restoration, or gravity terms.
   - When the player is lifted to $y=130$, `player.position.y` never increases back toward $y=740$, permanently locking the submarine at the ceiling.

2. **Kinematic Requirements for Natural Ballast Restoration**:
   - Submarines rely on neutral trim ballast. When not subjected to upward buoyant convection, gravity and flooded trim tanks smoothly pull the vessel down to its baseline operating depth.
   - Desired descent speed: $v_{\text{descent}} = 100\text{--}120\text{ px/s}$.
     - At $110\text{ px/s}$, descending from $y=130$ to $y=740$ ($610\text{ px}$) takes $\frac{610}{110} \approx 5.54\text{ seconds}$.
     - This matches tactical pacing: it gives the player a 5-second tactical window to snipe from elevated depth before automatically re-settling into the baseline combat zone.
   - External Force Interaction: Ballast descent MUST NOT penalize or negate the $+160\text{ px/s}$ / $+260\text{ px/s}$ lift when inside an active vent updraft. If descent ran unconditionally at $110\text{ px/s}$ against a $160\text{ px/s}$ updraft, net lift would drop to a sluggish $+50\text{ px/s}$ (taking over $12\text{ seconds}$ to lift, exceeding the entire vent cycle duration). Thus, ballast restoration applies when outside active updraft (or when external net vertical force is non-positive).

3. **Plume Cap Lateral Dissipation ($y \le 180$)**:
   - In hydrothermal fluid dynamics, ascending plumes decelerate vertically as they approach neutral buoyancy density layers and mushroom outward laterally.
   - Between $y=180$ and $y=130$ ($\Delta y = 50\text{ px}$):
     - Vertical lift smoothly attenuates: $L(y) = L_0 \cdot \frac{y - 130}{50}$.
     - Lateral dispersion velocity accelerates: $v_{\text{lateral}} = 110 \cdot (1 - \frac{y - 130}{50}) \cdot \text{sgn}(playerCenterX - anchorX)$.
   - An idle player reaching $y=130$ receives a lateral drift of $\sim 110\text{ px/s}$ pushing them away from the vent axis.
   - Within $1.0\text{--}1.2\text{ seconds}$, the player is ejected past $R_{\text{halo}}(130) \approx 134\text{ px}$, escaping the plume and allowing ballast restoration to bring them down.

4. **Preservation of Game Invariants**:
   - Projectile loop (`HydrothermalVent.ts:277-290`) and enemy DoT loop (`HydrothermalVent.ts:257-275`) are completely independent of player vertical settling. Preserving their formulas guarantees 100% test compatibility.
   - Canvas logical dimensions ($600 \times 800$) remain strictly immutable.

---

## 3. Specification Matrices

### Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Baseline Geometry | Chassis Depth Baseline | Each chassis calculates baseline operating depth via `canvasHeight - size.height - 20` | `canvasHeight=800`, `size.height` (30..46) | Baseline $Y \in [734, 750]$ ($740$ default) | If NaN/infinite, reset to formula | `Player.ts:91`, `ModularChassis.ts:269-377` |
| 2 | Updraft Physics | Vent Convective Lift | Upward buoyant velocity applied to player inside core or halo | `deltaTime`, `state`, `inHalo \|\| inCore` | $\Delta y = -160 \cdot \Delta t$ (Dormant/Charge) or $-260 \cdot \Delta t$ (Erupt) | Clamped to $\min y = \text{capY} + 30 = 130$ | `HydrothermalVent.ts:233-236`, `playtest_stream_b:188-196` |
| 3 | Ballast Mechanics | Neutral Trim Settling | Downward restoration returning elevated submarine to baseline depth | $y < y_{\text{baseline}}$, $!inUpdraft$ | $\Delta y = +v_{\text{descent}} \cdot \Delta t$ ($100\text{--}120\text{ px/s}$) | Clamped at $y \le y_{\text{baseline}}$ | USER_REQUEST, `COLLABORATION.md:30-38` |
| 4 | Plume Dissipation | Cap Mushroom Outward Ejection | Outward lateral dispersion pushing player away from plume centerline near $y \approx 130$ | $y \in [130, 180]$, $playerCenterX - anchorX$ | $v_x = \pm 100\text{--}120\text{ px/s}$ outward drift | Screen edge clamping ($x \in [0, 600-W]$) | `COLLABORATION.md:34-37`, Fluid Dynamics |
| 5 | Weapon Invariant | Steam Lance Conversion | Friendly bullets passing through thermal core convert into superheated Steam Lances | `bullet.isPlayerBullet`, `isInCore(x,y)` | Damage $+35\%$, Pierce $+1$, $v_y = -680\text{ px/s}$ | Guarded by `__steamLance` idempotence | `HydrothermalVent.ts:281-290`, `playtest_stream_b:125-138` |
| 6 | Hazard Invariant | Hostile Core Heat DoT | Hostiles within core suffer thermal damage and shield regen suppression | `enemy.isInCore(x,y)`, `enemy.maxHp` | $DPS = 28 + 0.06 \cdot \text{maxHp}$, `shieldRegenSuppressed=true` | Flash timer set to $0.08\text{s}$ | `HydrothermalVent.ts:257-275`, `playtest_stream_b:90-110` |
| 7 | Hazard Invariant | Hostile Bullet Vaporization | Descending hostile bullets suffer upward counter-buoyancy and dissolve | `!bullet.isPlayerBullet`, `isInCore(x,y)` | $a_y = -520\text{ px/s}^2$, dissolves at $t \ge 0.35\text{s}$ | `bullet.isDead = true` | `HydrothermalVent.ts:291-297`, `playtest_stream_b:143-168` |
| 8 | Sensory Invariant | Convective Cooling Halo | Convective halo dissipates weapon heat (+250% laser cooling rate) | `isInHalo(playerCenterX, playerCenterY)` | `prismLaser.inCoolingHalo = true` | Deactivates when outside halo | `HydrothermalVent.ts:311`, `playtest_stream_b:173-196` |
| 9 | Environmental | Stratified Ocean Currents | Eastward upper shelf current ($+75\text{ px/s}$) and Westward lower shelf current ($-60\text{ px/s}$) | `y < 400` vs `y \ge 400` | Entity drag coupling $0.18$, bullet drag $0.35$ | No-slip seafloor ($y \ge 700 \implies v=0$) | `OceanCurrent.ts:112-138`, `playtest_stream_b:201-241` |

### Edge Cases
| # | Feature | Input Scenario | Observed & Required Behavior |
|---|---------|----------------|------------------------------|
| 1 | Lateral Movement During Descent | Player holds Left/Right while descending at $y=300$ | Horizontal steering ($v_x = \pm 300\text{ px/s}$) and ballast settling ($v_y = +110\text{ px/s}$) operate orthogonally. Submarine smoothly glides along diagonal descent vector ($\approx 20^\circ$ dive slope). Coordinates independently clamped at canvas edges. |
| 2 | Vent Re-entry During Settling | Player descends through $y=450$ and steers laterally into vent halo/core | Vent `inHalo || inCore` immediately evaluates `true`. External lift ($+160$ or $+260\text{ px/s}$) activates. Ballast descent suspends. Vertical velocity reverses cleanly from descending to ascending with zero coordinate teleportation. |
| 3 | Overlapping Vent Plumes | Player situated at mid-line $x \in [286, 314]$ at $y=130$ (Left anchor 180, Right anchor 420) | Halos overlap by $28\text{ px}$ at cap. Updraft lift MUST NOT stack additively (cap at $\max(\text{lift}_1, \text{lift}_2) = 260\text{ px/s}$). Lateral dispersion resolves toward nearest anchor, or utilizes ambient $+75\text{ px/s}$ Eastward upper ocean current to break symmetry, preventing midpoint stall. Cores never overlap (gap $\ge 90\text{ px}$). |
| 4 | Bottom Baseline Boundary Contact | Player settling reaches $y = y_{\text{baseline}}$ ($740\text{ px}$) | Clamped at $\min(y_{\text{baseline}}, y + v_{\text{descent}} \cdot \Delta t)$. Settling velocity cleanly reaches 0. Submarine rests with $20\text{ px}$ clearance above the $800\text{ px}$ canvas bottom. Never penetrates into seabed or hard bottom boundary ($760\text{ px}$). |
| 5 | Modular Chassis Hitbox Variance | Player switches to Nautilus ($h=46$) or Stingray ($h=30$) | Baseline depth dynamically adapts: Nautilus settles to $y=734$; Stingray settles to $y=750$. In all chassis variations, bottom keel is maintained at $y=780\text{ px}$ ($20\text{ px}$ clearance). |
| 6 | Kraken Boss Maw Vortex Pull | Kraken Boss Phase 2 pulls player upward to $y=220$ | When boss vortex pull ($F_{\text{pull}} \approx 220\text{ px/s}$) ends or player moves away, player naturally settles back to baseline $y=740\text{ px}$ via ballast restoration. |
| 7 | Game State Transitions | Player dies, enters pre-game shop, or continues game | During Game Over or Shop pause, physics updates pause. On continue/restart, `GameManager.ts` sets $y = \text{logicalHeight} - 60 = 740\text{ px}$. Ballast settling resumes upon unpausing. |

---

## 4. Caveats

1. **Test Coupling in Unit Tests**:
   Unit tests such as `tests/playtest_stream_b_vents_currents.spec.ts` (STREAM-B-06) instantiate `Player` and call `vent.update(0.5, player, [], [])` isolated from the main `GameManager` loop. Therefore, `vent.update()` itself must NOT include an opposing downward ballast drag that alters the pure $+160\text{ px/s}$ / $+260\text{ px/s}$ delta in `vent.update`. Ballast restoration must be integrated into `Player.ts: update()` or orchestrated by `GameManager.ts` when external lift is absent.
2. **Current Updraft Indicator**:
   To prevent `Player.update()` and `HydrothermalVent.update()` from fighting each other in the full game loop, `Player` should track whether external lift was applied during the current frame (e.g. `player.externalLiftActive` reset each tick, or an upward force buffer), or `HydrothermalVent` can manage the state cleanly.

---

## 5. Conclusion

- **Baseline Operating Depth**:
  $y_{\text{baseline}} = \text{canvasHeight} - \text{size.height} - 20$, yielding $y = 740\text{ px}$ for standard hull (and $734\text{--}750\text{ px}$ across modular chassis), maintaining a strict $20\text{ px}$ keel clearance above the $800\text{ px}$ seabed.
- **Updraft Speed**:
  $160\text{ px/s}$ (Dormant/Charging) and $260\text{ px/s}$ (Erupting), bounded at $y \ge \text{capY} + 30 = 130\text{ px}$.
- **Ballast Restoration Speed**:
  $100\text{--}120\text{ px/s}$ downward ($+y$). It applies smoothly when the vessel is elevated above baseline and outside active upward buoyant lift, achieving full depth recovery in $\approx 5.5\text{ seconds}$.
- **Plume Cap Dissipation**:
  Between $y \in [130, 180]$, vertical lift attenuates linearly to $0$, while lateral dispersion accelerates outward from the plume anchor at $100\text{--}120\text{ px/s}$, clearing the submarine from the column within $1.0\text{--}1.2\text{ seconds}$.
- **Invariants**:
  Steam Lance transformation ($+35\%$ damage, $+1$ pierce, $v_y = -680\text{ px/s}$), enemy core DoT ($28 + 0.06 \cdot \text{maxHp}$), and canvas dimensions ($600 \times 800$) are fully cataloged and strictly protected.

---

## 6. Verification Method

To independently verify these specifications against the project codebase:

1. **Static Type & Code Inspection**:
   ```bash
   npx tsc --noEmit
   ```
2. **Execute Hydrothermal Vents & Ocean Currents Playtest Suite**:
   ```bash
   npx playwright test tests/playtest_stream_b_vents_currents.spec.ts
   ```
   Asserts conical plume radii, $160\text{ px/s}$ and $260\text{ px/s}$ lift, Steam Lance conversions, and enemy DoT.
3. **Execute Adversarial Physics Stress Suite**:
   ```bash
   npx playwright test tests/unit/flagship_adversarial_physics_stress.test.ts
   ```
   Asserts `VENT-STRESS-01` ($y \ge \text{capY} + 30 = 130\text{ px}$ clamping) and projectile counter-buoyancy.
4. **Execute Full Flagship Feature Verification**:
   ```bash
   npx playwright test tests/20_flagship_12_features.spec.ts
   ```

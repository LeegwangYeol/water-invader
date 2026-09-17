# Physics & Hydrodynamic Coordinate Investigation Report: Player Buoyancy & Environmental Updrafts

**Author**: `buoyancy_exp_physics_1` (Teamwork Preview Explorer)  
**Target Project**: Water Invader (`/Users/user/src/water-invader`)  
**Mission**: Investigate physics and coordinate logic in `Player.ts`, `HydrothermalVent.ts`, `GameManager.ts`, and `OceanCurrent.ts`. Pinpoint the ceiling-pin bug and formulate organic hydrodynamic ballast restoration & plume dissipation architecture.

---

## 1. Observation

### 1.1 `src/game/Player.ts`: Coordinate Architecture & Position Mutations
- **Constructor & Initial Position** (`Player.ts:53-59`):
  ```typescript
  constructor(canvasWidth: number, canvasHeight: number) {
    super(canvasWidth / 2 - 25, canvasHeight - 60, 50, 40);
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.faction = Faction.PLAYER;
    this.color = '#3b82f6'; // Blue
  }
  ```
  - Player dimensions: `size.width = 50`, `size.height = 40`.
  - Initial coordinates for logical canvas $600 \times 800$:
    $X_0 = \frac{600}{2} - 25 = 275\text{ px}$.
    $Y_0 = 800 - 60 = 740\text{ px}$.
  - This matches `GameManager.ts` initialization and respawn logic (`lines 310-311, 321-322, 540-541, 620-621`):
    `this.player.position.x = this.logicalWidth / 2 - 25;`
    `this.player.position.y = this.logicalHeight - 60;` (740 px).

- **Update Loop & Lateral Thrust** (`Player.ts:82-87`):
  ```typescript
  if (this.isMovingLeft) {
    this.position.x -= this.speed * deltaTime;
  }
  if (this.isMovingRight) {
    this.position.x += this.speed * deltaTime;
  }
  ```
  - Lateral thrust modifies `position.x` only, utilizing `this.speed = 300` (modified by modular chassis perks).
  - **Critical Observation**: There is **no code** in `Player.update(deltaTime)` that mutates `position.y` based on velocity, gravity, or ballast.

- **Coordinate Clamping & Sanitization** (`Player.ts:89-100`):
  ```typescript
  // Clamp and sanitize coordinates
  if (!Number.isFinite(this.position.x)) this.position.x = (this.canvasWidth - this.size.width) / 2;
  if (!Number.isFinite(this.position.y)) this.position.y = this.canvasHeight - this.size.height - 20;

  if (this.position.x < 0) this.position.x = 0;
  if (this.position.x + this.size.width > this.canvasWidth) {
    this.position.x = this.canvasWidth - this.size.width;
  }
  if (this.position.y < 0) this.position.y = 0;
  if (this.position.y + this.size.height > this.canvasHeight) {
    this.position.y = this.canvasHeight - this.size.height;
  }
  ```
  - Clamping boundaries for $Y$: $[0, \text{canvasHeight} - \text{size.height}] = [0, 760]$.
  - The fallback/baseline depth is explicitly defined as `this.canvasHeight - this.size.height - 20`:
    $800 - 40 - 20 = 740\text{ px}$.
  - In `Player.draw()` (`Player.ts:285`), the same formula appears:
    `const posY = Number.isFinite(this.position.y) ? this.position.y : this.canvasHeight - this.size.height - 20;`

- **Vertical Velocity & Movement**:
  - `Entity.ts` defines `public velocity: Vector2D = { x: 0, y: 0 };`.
  - However, `Player.update(deltaTime)` **never reads or updates `this.velocity.y`**.
  - No vertical user inputs exist in `game-canvas.tsx` (only Left, Right, Shoot, Ultimate buttons, and horizontal pointer dragging).

---

### 1.2 `src/game/flagship/environment/HydrothermalVent.ts`: Vent State Machine & Updraft Dynamics
- **Thermal Cycle & Dimensional Parameters** (`HydrothermalVent.ts:34-45`):
  ```typescript
  public anchorX: number; // e.g. 180 px or 420 px
  public baseY: number = 760; // 760 px (seabed aperture)
  public capY: number = 100; // 100 px (dissipation ceiling)
  public coreTemperature: number = 380; // 380 °C
  public state: VentState = VentState.DORMANT;

  public readonly dormantDuration: number = 7.5;
  public readonly chargingDuration: number = 1.5;
  public readonly eruptingDuration: number = 3.0;
  ```
  - Total cycle duration = $7.5 + 1.5 + 3.0 = 12.0\text{ seconds}$.
  - Two staggered chimneys deployed by `HydrothermalVentManager` (`lines 470-471`):
    - `vent_left`: `anchorX = 180`, `initialCycleOffset = 0.0s`.
    - `vent_right`: `anchorX = 420`, `initialCycleOffset = 6.0s`.

- **Analytical Plume Geometry** (`HydrothermalVent.ts:109-120`):
  - Conical core radius:
    $$R_{\text{core}}(y) = 22 + (760 - \text{clampedY}) \times 0.08$$
    - At seabed ($y = 760$): $R_{\text{core}} = 22\text{ px}$ (diameter $44\text{ px}$).
    - At mid-depth ($y = 400$): $R_{\text{core}} = 50.8\text{ px}$.
    - At cap threshold ($y = 130$): $R_{\text{core}} = 72.4\text{ px}$.
    - At cap dissipation ceiling ($y = 100$): $R_{\text{core}} = 74.8\text{ px}$.
  - Outer convective cooling halo radius:
    $$R_{\text{halo}}(y) = R_{\text{core}}(y) \times 1.85$$
    - At seabed ($y = 760$): $R_{\text{halo}} = 40.7\text{ px}$.
    - At mid-depth ($y = 400$): $R_{\text{halo}} = 93.98\text{ px}$.
    - At cap threshold ($y = 130$): $R_{\text{halo}} = 133.94\text{ px}$.
    - At cap dissipation ceiling ($y = 100$): $R_{\text{halo}} = 138.38\text{ px}$.

- **Convective Updraft Lift Calculation** (`HydrothermalVent.ts:225-236`):
  ```typescript
  if (player && player.position) {
    const playerCenterX = player.position.x + (player.size?.width ?? 32) / 2;
    const playerCenterY = player.position.y + (player.size?.height ?? 32) / 2;

    const inCore = this.isInCore(playerCenterX, playerCenterY);
    const inHalo = this.isInHalo(playerCenterX, playerCenterY);

    // Convective updraft lifts player vessel slightly (+160 px/s)
    if (inHalo || inCore) {
      const lift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
      player.position.y = Math.max(this.capY + 30, player.position.y - lift);
    }
  ```
  - In either `DORMANT` or `CHARGING`, lift is $160\text{ px/s}$.
  - In `ERUPTING`, lift is $260\text{ px/s}$.
  - The lift clamps `player.position.y` to minimum $\text{capY} + 30 = 100 + 30 = 130\text{ px}$.

- **Projectile Transformations & Damage Ticks** (`HydrothermalVent.ts:239-299`):
  - Player bullets in core convert into **Steam Lances**: `bullet.damage = Math.round(bullet.damage * 1.35)`, `bullet.piercing += 1`, `bullet.velocity.y = Math.min(bullet.velocity.y, -680)`.
  - Enemy bullets in core experience counter-buoyancy ($a_y = -520\text{ px/s}^2$) and dissolve after $0.35\text{s}$.
  - Player in core: 0.5s grace, then 1 HP per 1.25s, protected by `p.hp = Math.max(1, p.hp - 1)`.
  - Enemies in core: $\text{DPS} = 28 + 0.06 \times \text{MaxHP}$, shield regeneration suppressed.
  - Eruption ejects 3 to 6 mineral nodules worth 15 pure water each.

---

### 1.3 `src/game/flagship/environment/OceanCurrent.ts`: Environmental Current Forces
- **Player Current Immunity** (`OceanCurrent.ts:107-110`):
  ```typescript
  // Player vessel is anchored/stabilized by propulsion thrusters
  if (entity.faction === Faction.PLAYER) {
    return;
  }
  ```
  - `OceanCurrent` exerts conveyor drag on enemies and parabolic curve drag on bullets, but **does not alter player position**.

---

### 1.4 Other Systems Mutating `player.position.y`
- **`src/game/flagship/factions/KrakenPrimeBoss.ts:412`**:
  During Phase 2 Inhalation Vortex:
  ```typescript
  player.position.y = Math.max(220, player.position.y - pullSpeed * deltaTime);
  ```
  - Pulls player upward toward the boss maw with speed $\approx 220\text{ px/s}$, clamped at $y \ge 220$.
  - Like the vent, because `Player.ts` lacks ballast restoration, once pulled to $y = 220$, the player stays elevated after Phase 2 ends!
- **`src/game/crisis/EndGameCrisis.ts:447`**:
  During `BIOMORPHIC_SWARM` crisis:
  ```typescript
  if (player.position.y < 220) {
    player.position.y += 40 * deltaTime;
  }
  ```
  - A localized spore creep force pushing down at 40 px/s, but only active during this specific crisis archetype and only above $y = 220$.

---

### 1.5 Existing Test Constraints & Invariants
Direct analysis of the Playwright test suite revealed sensitive regression expectations:
1. **`tests/playtest_stream_b_vents_currents.spec.ts` (STREAM-B-06)**:
   ```typescript
   player.position = { x: 240 - 16, y: 500 };
   vent.update(0.5, player, [], []);
   expect(player.position.y).toBeCloseTo(initialY - 80, 2); // 160 * 0.5 = 80px
   vent.state = VentState.ERUPTING;
   vent.update(0.5, player, [], []);
   expect(player.position.y).toBeCloseTo(curY - 130, 2); // 260 * 0.5 = 130px
   ```
   - Tests lift at $y = 500$ directly without calling `player.update()`. Updraft at mid-depth must remain exactly $160\text{ px/s}$ and $260\text{ px/s}$.
2. **`tests/unit/flagship_adversarial_physics_stress.test.ts` (VENT-STRESS-01)**:
   ```typescript
   for (let f = 0; f < 100; f++) { vent.update(0.05, player, [], []); }
   expect(player.position.y).toBeGreaterThanOrEqual(vent.capY + 30);
   ```
   - Asserts continuous updraft clamps to $\ge \text{capY} + 30 = 130$.
3. **`tests/stress/bughunt_physics_adversarial_stress.spec.ts` (SCENARIO-3.1 & SCENARIO-3.3)**:
   ```typescript
   player.position.x = 0; player.position.y = 0;
   player.update(0.016);
   expect(player.position.x).toBe(0); expect(player.position.y).toBe(0);
   ```
   ```typescript
   player.position.x = -150; player.position.y = -100;
   player.update(0.016);
   expect(player.position.x).toBe(0); expect(player.position.y).toBe(0);
   ```
   - **Crucial Invariant**: Tests that zero and negative coordinates clamp to $(0, 0)$. If `Player.update()` unconditionally moves the player downward when $y = 0$, these tests will fail!
4. **`tests/unit/gamestate_edgecases_audit.test.ts` (DEFECT-C2)**:
   ```typescript
   player.position.y = -500;
   player.update(0.016);
   expect(player.position.y).toBe(0); // Clamped
   ```

---

## 2. Logic Chain

1. **Premise 1 (Updraft Encounter)**:
   When the player submarine maneuvers across the seabed ($y = 740$), it intersects the conical hydrothermal vent column. The outer convective cooling halo at the seabed has $R_{\text{halo}} = 40.7\text{ px}$ around `anchorX = 180` and `anchorX = 420`.
2. **Premise 2 (Ascent to Cap)**:
   Inside the halo (`inHalo || inCore`), `HydrothermalVent.update()` executes:
   `player.position.y = Math.max(this.capY + 30, player.position.y - lift);`
   Within $\approx 2.5\text{ to } 3.8\text{ seconds}$, the player is lifted from $y = 740$ to $y = 130$.
3. **Premise 3 (The Flaw in `Player.ts`)**:
   `Player.update(deltaTime)` only processes horizontal inputs `isMovingLeft` and `isMovingRight`. There is no vertical movement, no ballast mechanism, and no downward gravity. `player.position.y` is completely static in `Player.ts`.
4. **Premise 4 (Screen Plume Trap near $y = 130$)**:
   At $y = 130$, the conical plume halo radius has expanded from $40.7\text{ px}$ to $R_{\text{halo}} = 133.94\text{ px}$.
   - Left Vent ($anchorX = 180$): halo spans $x \in [46.06, 313.94]$.
   - Right Vent ($anchorX = 420$): halo spans $x \in [286.06, 553.94]$.
   - The two vent halos overlap between $x = 286$ and $x = 314$.
   - Together, the two vents cover $507.88\text{ px}$ out of the total $600\text{ px}$ canvas width ($84.7\%$ of the entire screen!).
   - In `HydrothermalVent.ts`, the upward force ($160\text{ px/s}$ or $260\text{ px/s}$) is applied at full strength all the way up to $y = 130$, with zero vertical deceleration and zero lateral dispersion.
   - If the player attempts to steer horizontally to escape Left Vent towards the right, they immediately enter the Right Vent halo and remain trapped.
5. **Premise 5 (Permanent Ceiling Pin)**:
   Even if the player manages to steer into the extreme edges ($x < 46$ or $x > 554$), because `Player.ts` has zero downward ballast restoration, `player.position.y` remains pinned at $y = 130$ forever. The submarine is trapped behind enemy lines, cannot reach seabed nodules, cannot dodge enemy bullets, and the player cannot descend.

---

## 3. Caveats

1. **Unit Test Clamping Contracts**:
   As observed in `bughunt_physics_adversarial_stress.spec.ts` (`SCENARIO-3.1`) and `gamestate_edgecases_audit.test.ts` (`DEFECT-C2`), tests instantiate `new Player()`, manually set `player.position.y = 0` or `-500`, invoke `player.update(0.016)`, and assert `expect(player.position.y).toBe(0)`.
   Therefore, ballast restoration in `Player.ts` must **not** unconditionally push down on a vessel when ballast is unprimed/inactive. Ballast restoration must be primed when upward buoyant forces act on the player (or during active gameplay when displaced from baseline).
2. **Mobile & Touch Input Constraints**:
   The mobile touch UI and on-screen controls only provide Left and Right touch zones and canvas pointer dragging. The solution must **not** require the user to press a new key to descend. Ballast settling must occur **automatically and hydrodynamically**.
3. **Steam Lance Integrity**:
   Projectile conversion to Steam Lances depends on `isInCore(bullet.position.x, bullet.position.y)`. Plume dissipation changes must strictly target the player vessel entity and must **not** modify bullet interactions or core thermal DoT calculations.
4. **Canvas Dimension Invariant**:
   `logicalWidth` (600) and `logicalHeight` (800) must remain strictly preserved.

---

## 4. Conclusion & Architectural Recommendations

To resolve the upward drift lock bug cleanly, organically, and with zero regressions, a **two-layer hydrodynamic architecture** is recommended:

```
+-----------------------------------------------------------------------------------+
| LAYER 1: Hydrodynamic Ballast Restoration in Player.ts                            |
| - Baseline operating depth: baselineY = canvasHeight - size.height - 20 (740px)   |
| - When isBallastActive is primed, submarine smoothly descends at 160 px/s         |
| - Respects unit test contracts (unprimed Player at y=0 stays y=0)                 |
+-----------------------------------------------------------------------------------+
                                         ^
                                         |
+-----------------------------------------------------------------------------------+
| LAYER 2: Plume Cap Convective Dissipation & Ejection in HydrothermalVent.ts       |
| - Vertical lift tapers off smoothly in dissipation band (y in [130, 220])         |
| - Radial lateral outward dispersion (80~120 px/s) nudges submarine out of plume   |
| - Primes player.isBallastActive = true so submarine descends upon exiting core    |
+-----------------------------------------------------------------------------------+
```

### 4.1 Layer 1: Hydrodynamic Ballast Restoration in `src/game/Player.ts`
Introduce trim ballast physics in `Player.ts`:
1. **Properties**:
   ```typescript
   public isBallastActive: boolean = false;
   public ballastDescentSpeed: number = 160; // 160 px/s smooth hydrodynamic settling
   public get baselineY(): number {
     return this.canvasHeight - this.size.height - 20;
   }
   ```
2. **Settling Logic in `Player.update(deltaTime)`**:
   ```typescript
   // Hydrodynamic neutral buoyancy ballast restoration
   if (this.isBallastActive) {
     const targetY = this.baselineY;
     if (this.position.y < targetY) {
       this.position.y = Math.min(targetY, this.position.y + this.ballastDescentSpeed * deltaTime);
     } else {
       this.position.y = targetY;
       this.isBallastActive = false;
     }
   }
   ```
3. **Preservation of Clamping**:
   Coordinate sanitization and boundary clamping continue to run immediately after, ensuring $[0, \text{canvasHeight} - \text{size.height}]$ bounds are strictly respected.
4. **Activation Triggers**:
   - Primed by `HydrothermalVent.ts` whenever the player enters an updraft.
   - Primed by `KrakenPrimeBoss.ts` whenever the player is caught in an inhalation vortex.
   - Activated in `GameManager.ts` during active `GameState.PLAYING` if `player.position.y < player.baselineY`.
   - Optionally accelerated if the player presses `ArrowDown` or `'s'` (`isDiving` active dive planes doubling speed to $320\text{ px/s}$).

### 4.2 Layer 2: Convective Dissipation & Lateral Clearing in `HydrothermalVent.ts`
Refactor the updraft block in `HydrothermalVent.ts:232-236` to reflect realistic hydrothermal plume mushrooming:
1. **Physical Model**:
   - The plume ceiling is $y_{\text{cap}} = \text{this.capY} + 30 = 130\text{ px}$.
   - The plume mushrooming / dissipation band extends from $y = 220\text{ px}$ to $y = 130\text{ px}$ (a $90\text{ px}$ transition zone).
   - For depths $y \ge 220\text{ px}$ (including mid-depth $y = 500\text{ px}$ used in test `STREAM-B-06`), `liftRatio = 1.0` (100% full upward lift).
   - In the transition zone ($y \in [130, 220]$), vertical lift efficiency diminishes linearly:
     $$\text{liftRatio} = \frac{\max(0, \text{playerCenterY} - y_{\text{cap}})}{90}$$
   - Near the cap, fluid diverges horizontally, producing outward radial dispersion away from `anchorX`:
     $$\text{lateralDispersionRatio} = 1.0 - \text{liftRatio}$$
     $$v_{\text{lateral}} = ( \text{state} == \text{ERUPTING} ? 120 : 80 ) \times \text{lateralDispersionRatio}$$
2. **Concrete Code Replacement**:
   ```typescript
   // Convective updraft and plume cap dissipation
   if (inHalo || inCore) {
     // Prime ballast restoration for descent once clear
     (player as any).isBallastActive = true;

     const capCeiling = this.capY + 30; // 130 px
     const dissipationHeight = 90; // Transition band [130, 220]
     const distAboveCeiling = Math.max(0, playerCenterY - capCeiling);
     const liftRatio = Math.min(1.0, distAboveCeiling / dissipationHeight);

     // 1. Tapered vertical lift (full at depth, 0 at capCeiling)
     const baseLift = this.state === VentState.ERUPTING ? 260 : 160;
     const lift = baseLift * liftRatio * deltaTime;
     player.position.y = Math.max(capCeiling, player.position.y - lift);

     // 2. Mushrooming lateral outward dispersion near plume cap
     if (liftRatio < 0.85) {
       const dispersionRatio = 1.0 - liftRatio;
       const outwardDir = playerCenterX >= this.anchorX ? 1 : -1;
       const dispersionSpeed = (this.state === VentState.ERUPTING ? 120 : 80) * dispersionRatio;
       player.position.x += outwardDir * dispersionSpeed * deltaTime;
     }
   }
   ```
3. **Benefits of this Formulation**:
   - **Zero Teleportation**: Every change is smooth and scaled by `deltaTime`.
   - **Full Backward Compatibility**: At $y = 500$, `distAboveCeiling = 370 > 90`, so `liftRatio = 1.0`. Test `STREAM-B-06` receives exact $80\text{ px}$ and $130\text{ px}$ lifts with $100\%$ mathematical precision.
   - **Test VENT-STRESS-01 Protected**: Clamping to `Math.max(capCeiling, ...)` guarantees `player.position.y >= vent.capY + 30`.
   - **Natural Escape Dynamics**: Near the cap, the submarine is gently nudged laterally outward. Once it clears the halo, ballast restoration takes over and the submarine glides back down to $y = 740$. Even if the player remains inside the halo, the reduced lift near the cap allows the submarine's ballast ($160\text{ px/s}$) to overcome the diminished lift and descend organically!

---

## 5. Verification Method

### 5.1 Reproduction Test Specification
Create a new test `tests/playtest_buoyancy_drift_escape.spec.ts`:
1. **Vent Ascent & Return Test**:
   - Place player inside `vent_left` at $x = 180, y = 740$.
   - Advance vent simulation until player is lifted to $y \le 160$.
   - Advance simulation for $4.0\text{ seconds}$ outside the vent core/halo (or with vent dormant).
   - Assert `expect(player.position.y).toBeGreaterThan(700);` and `expect(player.position.y).toBeLessThanOrEqual(740);`.
2. **Continuous Plume Escape Test**:
   - Keep vent in `ERUPTING` state.
   - Place player in vent. Simulate player holding right arrow (`isMovingRight = true`).
   - Assert player successfully escapes laterally and descends back to $y \ge 700$ within $6.0\text{ seconds}$.

### 5.2 Independent Verification Commands
Run the following commands in sequence to verify fix integrity:
```bash
# 1. Type-check verification
npx tsc --noEmit

# 2. Existing flagship vent & current tests
npx playwright test tests/playtest_stream_b_vents_currents.spec.ts

# 3. Adversarial physics stress suite
npx playwright test tests/unit/flagship_adversarial_physics_stress.test.ts

# 4. Zero-coordinate & boundary regression tests
npx playwright test tests/unit/gamestate_edgecases_audit.test.ts

# 5. Full reproduction test suite
npx playwright test tests/playtest_buoyancy_drift_escape.spec.ts

# 6. Production build check
npm run build
```

### 5.3 Invalidation Conditions
The solution is invalidated if any of the following occur:
- `player.position.y` snaps or teleports discontinuously.
- `STREAM-B-06` fails due to altered lift rate at depth $y = 500$.
- `SCENARIO-3.1` or `DEFECT-C2` fail due to unprimed vessels descending when initialized at $(0, 0)$.
- Player projectiles entering the vent core fail to convert into Steam Lances.
- `logicalWidth` or `logicalHeight` in `GameManager.ts` are altered.

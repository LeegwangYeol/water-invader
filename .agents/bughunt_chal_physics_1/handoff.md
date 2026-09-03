# Empirical Adversarial Challenge Handoff Report: Physics, Friendly-Fire AI, Bullet Tunneling, and Boundary Safety

**Agent**: `bughunt_chal_physics_1` (Empirical Challenger: Critic & Specialist)  
**Project**: Water Invader  
**Test Harness Location**: `/Users/user/src/water-invader/tests/stress/bughunt_physics_adversarial_stress.spec.ts`  
**Execution Command**: `SKIP_WEBSERVER=1 npx playwright test tests/stress/bughunt_physics_adversarial_stress.spec.ts`  
**Result**: 12/12 stress tests executed, empirical defect matrix validated.

---

## 1. Observation

Direct code inspections, test runs, and verbatim tool outputs confirm three distinct physical and computational defects:

### Observation 1: Bullet Tunneling Under High Velocity & Frame Latency
- **Code Inspection**:
  - `src/game/Entity.ts` (lines 37–47):
    ```typescript
    public checkCollision(other: Entity): boolean {
      const rect1 = this.getRect();
      const rect2 = other.getRect();

      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    }
    ```
  - `src/game/Bullet.ts` (lines 34–37):
    ```typescript
    public update(deltaTime: number): void {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
    }
    ```
  - `src/game/GameManager.ts` (lines 1136, 1139):
    ```typescript
    this.bullets.forEach(bullet => bullet.update(deltaTime));
    this.checkCollisions(deltaTime);
    ```
- **Empirical Measurement**:
  - In `bughunt_physics_adversarial_stress.spec.ts` (`SCENARIO-2.1`), hostile bullets approaching the player (height 40px, interval $[800, 840]$) tunneled completely through without triggering collision:
    - At 60 FPS ($dt = 0.017\text{s}$):
      - Velocity $3,000\text{ px/s}$ ($\text{step} = 50\text{px}$): **11.0% tunneled** (11/100 trials missed).
      - Velocity $5,000\text{ px/s}$ ($\text{step} = 83\text{px}$): **50.0% tunneled** (50/100 trials missed).
      - Velocity $10,000\text{ px/s}$ ($\text{step} = 167\text{px}$): **100.0% tunneled** (100/100 trials missed).
    - At 30 FPS ($dt = 0.033\text{s}$):
      - Velocity $2,000\text{ px/s}$: **43.0% tunneled**.
      - Velocity $3,000\text{ px/s}$: **60.0% tunneled**.
      - Velocity $5,000\text{ px/s}$: **100.0% tunneled**.
    - Under 10 FPS lag spike ($dt = 0.100\text{s}$, clamped at `Enemy.ts:222`):
      - Velocity $500\text{ px/s}$: **11.0% tunneled**.
      - Velocity $800\text{ px/s}$: **51.0% tunneled**.
      - Velocity $1,200\text{ px/s}$: **80.0% tunneled**.
      - Velocity $2,000+\text{ px/s}$: **100.0% tunneled**.
  - In `SCENARIO-2.3`, a player bullet with speed $-600\text{ px/s}$ against a standard invader (height 30px) under a 100ms lag frame ($dt = 0.1\text{s}$) tunneled **28.0% of the time** (14/50 trials missed).
  - In `SCENARIO-2.2`, player bullets against the Crisis Sovereign (height 130px) tunneled at $-9,000\text{ px/s}$ at 60 FPS (4.0%) and at $-6,000\text{ px/s}$ at 20 FPS (100.0%).

### Observation 2: Canvas Crash on Non-Finite Coordinates (`NaN` / `Infinity`) & Player Y-Boundary Leak
- **Code Inspection**:
  - `src/game/Player.ts` (lines 66–70):
    ```typescript
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.size.width > this.canvasWidth) {
      this.position.x = this.canvasWidth - this.size.width;
    }
    ```
    `position.y` is never clamped.
  - `src/game/Player.ts` (lines 194–211):
    ```typescript
    const cx = this.position.x + this.size.width / 2 + jitterX;
    const cy = this.position.y + this.size.height / 2 + bounce + jitterY;
    const grad = ctx.createRadialGradient(cx, cy + h/4, 5, cx, cy, Math.max(w, h)*1.5);
    ```
  - `src/game/crisis/CrisisSovereign.ts` (lines 202–203, 294):
    ```typescript
    this.position.x = this.initialX + Math.sin(this.floatTime * sweepSpeed) * sweepAmpX;
    this.position.y = this.initialY + Math.cos(this.floatTime * sweepSpeed * 1.2) * sweepAmpY;
    // In drawVoidSovereign:
    const outerAura = ctx.createRadialGradient(cx, cy, 30, cx, cy, 140);
    ```
- **Verbatim Error Reproduction**:
  - When `player.position.x = NaN`, `player.update()` fails to reset coordinates (`NaN < 0` is false, `NaN > max` is false).
  - Calling `player.draw(ctx)` throws:
    `TypeError: Failed to execute 'createRadialGradient' on 'CanvasRenderingContext2D': The provided double value is non-finite.`
  - When `sovereign.initialX = NaN`, calling `sovereign.draw(ctx)` throws:
    `TypeError: Failed to execute 'createRadialGradient' on 'CanvasRenderingContext2D': The provided double value is non-finite.`
  - Calling `player.fire()` while coordinates are `NaN` spawns bullets with `b.position.x = NaN`. In `GameManager.ts:1176`, `b.position.x > -100` evaluates to `false`, causing all player bullets to be culled immediately, resulting in permanent weapon lockup.

### Observation 3: Enemy Friendly-Fire AI Geometric Asymmetry & Dynamic Weave
- **Code Inspection**:
  - `src/game/Enemy.ts` (lines 624–627, 705–708):
    ```typescript
    const spawnX = this.position.x + this.size.width / 2 - 3;
    const spawnY = this.position.y + this.size.height;
    // Raycast origin aligned exactly with bullet spawn center (centerX = spawnX + 3)
    const originX = spawnX + 3;
    ```
  - Enemy bullet width is 10px (`Bullet.ts:23`), occupying $[spawnX, spawnX + 10]$. The geometric center is $spawnX + 5$, whereas `originX` is set to $spawnX + 3$.
  - In `hasAlliedObstacleInShotPath` (`Enemy.ts:392-590`), the checked corridor covers $[originX - 5, originX + 5] = [spawnX - 2, spawnX + 8]$. The right 2 pixels of the bullet ($[spawnX + 8, spawnX + 10]$) extend beyond the raycast corridor.
- **Empirical Measurement**:
  - In `SCENARIO-1.1` (dense 5x5 grid of 25 units with 5px row gaps) and `SCENARIO-1.2` (dense grid with 12 diagonal snipers), **0 friendly fire collisions occurred**, verifying that vertical and straight diagonal suppression holds robustly in static alignments.
  - In `challenger_exp_1_friendly_fire_crisis_stress.spec.ts` (`STRESS-FF-03`), chaotic sinusoidal movement produced **1 friendly fire hit** due to the absence of second-order harmonic trajectory anticipation.

---

## 2. Logic Chain

1. **Premise 1 (Collision Architecture)**: `Entity.checkCollision()` performs instantaneous AABB intersection testing between `this.getRect()` and `other.getRect()`. It does not calculate a swept volume or ray segment between $P(t)$ and $P(t + \Delta t)$.
2. **Premise 2 (Displacement Geometry)**: In any physics update step $\Delta t$, an entity displaces by $\Delta \vec{r} = \vec{v} \cdot \Delta t$. If the component along the direction of motion $|\Delta r|$ exceeds the sum of the target extent $H_{\text{target}}$ and projectile extent $H_{\text{proj}}$, there exists a set of initial offsets where the projectile begins completely in front of the target at $t$ and ends completely behind the target at $t + \Delta t$.
3. **Deduction 1 (Tunneling Inevitability)**: For player height 40px and bullet height 10px ($H_{\text{total}} = 50\text{px}$), any velocity where $|v_y| \cdot \Delta t > 50\text{px}$ guarantees tunneling. At 60 FPS ($dt \approx 0.0167\text{s}$), this threshold is $|v_y| > 3,000\text{ px/s}$. Under a 100ms lag spike ($dt = 0.1\text{s}$), this threshold drops to $|v_y| > 500\text{ px/s}$. Because high-speed bullets (e.g., tachyon needles, railgun bolts, or fast player ordnance) exceed these bounds, bullets mathematically and empirically phase through entities.
4. **Premise 3 (W3C Canvas Specification)**: The HTML5 Canvas standard specifies that passing non-finite values (`NaN`, `Infinity`, `-Infinity`) to `CanvasRenderingContext2D.createRadialGradient` or `createLinearGradient` must throw a `TypeError` or do nothing. In Chromium, WebKit, and Gecko, `TypeError` is thrown.
5. **Deduction 2 (Canvas Freeze on NaN)**: Because `Player.ts` and `CrisisSovereign.ts` perform no `Number.isFinite` validation on their positions during update or draw, any external or mathematical corruption producing `NaN` or `Infinity` propagates directly into `createRadialGradient()`, causing an unhandled runtime exception that terminates the `requestAnimationFrame` render loop.
6. **Premise 4 (Raycast Symmetry)**: Raycasting accurately prevents projectile collision only if the swept probe bounds fully enclose the projectile bounding box: $\text{probe.minX} \le \text{bullet.minX}$ and $\text{probe.maxX} \ge \text{bullet.maxX}$.
7. **Deduction 3 (Clipping Vulnerability)**: Setting `originX = spawnX + 3` with radius 5 produces an upper probe bound of $spawnX + 8$, while the bullet spans to $spawnX + 10$. Consequently, an ally occupying the right 2-pixel margin ($[spawnX + 8, spawnX + 10]$) is not detected by the line-of-sight check, allowing hostile bullets to graze allies on launch.

---

## 3. Caveats

1. **Frame Rate Assumptions**: Bullet tunneling rates were measured under discrete time steps ($1/60\text{s}$, $1/30\text{s}$, $0.05\text{s}$, $0.1\text{s}$). Under steady 120 FPS or 144 FPS monitors, tunneling thresholds are proportionately higher ($|v| > 6,000\text{ px/s}$ for player).
2. **Current Weapon Velocities**: The current game configuration limits standard player bullets to 400 px/s and enemy bullets to 200–380 px/s. At 60 FPS, tunneling is dormant during normal gameplay, but activates immediately during browser tab throttling or GC pauses ($dt \ge 0.1\text{s}$) or when extreme velocities ($>500\text{ px/s}$) are configured.
3. **Canvas Implementation**: Headless Playwright tests utilized a standards-compliant Canvas 2D mock mirroring browser TypeError specifications.

---

## 4. Conclusion

1. **Bullet Tunneling**: Confirmed defect. High-speed bullets ($> 500\text{ px/s}$ under lag, or $\ge 3,000\text{ px/s}$ at 60 FPS) tunnel through targets due to lack of Continuous Collision Detection (CCD) or swept AABB tests.
2. **Non-Finite (`NaN`/`Infinity`) Coordinates**: Confirmed defect. `Player.ts` and `CrisisSovereign.ts` lack `Number.isFinite` sanitization, resulting in game-freezing `TypeError` exceptions inside `ctx.createRadialGradient` and permanent player weapon disabling.
3. **Friendly-Fire AI**: The line-of-sight system in `Enemy.ts` successfully prevents direct friendly fire in dense vertical and diagonal formations (0 damage across 25-unit grids). However, an asymmetric 2-pixel offset between bullet spawn center and raycast origin leaves a right-side clipping defect, and dynamic sinusoidal motion can defeat the linear lead estimation.

---

## 5. Verification Method

To independently execute and verify these findings, run the following commands from `/Users/user/src/water-invader`:

```bash
# 1. Run the empirical physics and bug-hunting stress harness
SKIP_WEBSERVER=1 npx playwright test tests/stress/bughunt_physics_adversarial_stress.spec.ts

# 2. Run existing stress tests
SKIP_WEBSERVER=1 npx playwright test tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts

# 3. Verify TypeScript build integrity
npx tsc --noEmit
npm run build
```

**Invalidation Conditions**:
- If `SCENARIO-2.1` produces 0% tunneling for speed 3,000 px/s at 60 FPS, CCD has been implemented.
- If `SCENARIO-3.4` does not throw an exception when `player.draw(ctx)` is called with `player.position.x = NaN`, finite guard checks have been added.

# Gate 2 Adversarial Challenge Report: Multi-Vent Overlap Zone Passive Drift Verification

**Agent**: `buoyancy_challenger_gate2_1` (`teamwork_preview_challenger`)  
**Roles**: Critic, Specialist  
**Working Directory**: `/Users/user/src/water-invader/.agents/buoyancy_challenger_gate2_1`  
**Date**: 2026-09-17T05:25:00Z  
**Verdict**: **CHALLENGE_DETECTED**  
**Test Harness Path**: `/Users/user/src/water-invader/tests/adversarial_buoyancy_gate2_verification.spec.ts`  

---

## 1. Observation

### 1.1 Source Code Implementation Under Audit

#### 1.1.1 `src/game/flagship/environment/HydrothermalVent.ts` (Lines 232–253)
```typescript
// Convective updraft and plume cap dissipation
if (inHalo || inCore) {
  (player as any).isBallastActive = true;
  const capCeiling = this.capY + 30; // 130
  const transitionZone = 90; // Plume cap dissipation band [130, 220]
  const depthAboveCap = Math.max(0, playerCenterY - capCeiling);
  const liftRatio = Math.min(1.0, depthAboveCap / transitionZone);
  if (inCore || liftRatio >= 0.5) {
    (player as any).isInUpdraft = true;
  }
  const baseLift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
  const lift = baseLift * liftRatio;
  player.position.y = Math.max(capCeiling, player.position.y - lift);

  // Radial lateral outward dispersion near the plume cap
  if (liftRatio < 1.0) {
    const dispersionRatio = 1.0 - liftRatio;
    const dispersionSpeed = (this.state === VentState.ERUPTING ? 120 : 80) * dispersionRatio * deltaTime;
    const sign = playerCenterX >= this.anchorX ? 1 : -1;
    player.position.x += sign * dispersionSpeed;
  }
}
```

#### 1.1.2 `src/game/Player.ts` (Lines 55–57, 100–111)
```typescript
public get baselineY(): number {
  return this.canvasHeight - this.size.height - 20;
}
...
// Smooth hydrodynamic ballast restoration
if (this.isBallastActive && !this.isInUpdraft) {
  const targetY = this.baselineY;
  if (this.position.y < targetY) {
    this.position.y = Math.min(targetY, this.position.y + this.ballastDescentSpeed * deltaTime);
  } else {
    this.position.y = targetY;
    this.isBallastActive = false;
  }
}
this.isInUpdraft = false;
```

---

### 1.2 Empirical Test Execution Results

#### 1.2.1 Passive Drift 60s Trajectory Across All 6 Modular Chassis Hulls (`tests/adversarial_buoyancy_gate2_verification.spec.ts`)
Each submarine was initialized in the overlap confluence center at $x = 300 - W/2, y = 130$ with passive drift (`isMovingLeft = false`, `isMovingRight = false`) for 60.0 seconds (1200 frames at $\Delta t = 0.05\text{s}$):

| Chassis Hull | Hitbox ($W \times H$) | Target `baselineY` | 60s Final $X$ | 60s Final $Y$ | Max $Y$ Reached | Distance to Baseline | Baseline Descent % | Reached Baseline? |
|---|---|---|---|---|---|---|---|---|
| `DEFAULT` | $50 \times 40$ | $740.0\text{ px}$ | $282.42\text{ px}$ | $138.20\text{ px}$ | $151.53\text{ px}$ | $601.80\text{ px}$ | **1.34%** | **NO** |
| `NAUTILUS` | $64 \times 46$ | $734.0\text{ px}$ | $275.40\text{ px}$ | $135.20\text{ px}$ | $148.53\text{ px}$ | $598.80\text{ px}$ | **0.86%** | **NO** |
| `STINGRAY` | $38 \times 30$ | $750.0\text{ px}$ | $289.50\text{ px}$ | $143.21\text{ px}$ | $156.06\text{ px}$ | $606.79\text{ px}$ | **2.13%** | **NO** |
| `KRAKEN` | $50 \times 40$ | $740.0\text{ px}$ | $282.42\text{ px}$ | $138.20\text{ px}$ | $151.53\text{ px}$ | $601.80\text{ px}$ | **1.34%** | **NO** |
| `LEVIATHAN` | $54 \times 42$ | $738.0\text{ px}$ | $282.34\text{ px}$ | $137.57\text{ px}$ | $150.53\text{ px}$ | $600.43\text{ px}$ | **1.24%** | **NO** |
| `GHOST` | $46 \times 34$ | $746.0\text{ px}$ | $284.06\text{ px}$ | $147.90\text{ px}$ | $154.53\text{ px}$ | $598.10\text{ px}$ | **2.91%** | **NO** |

**Verbatim Observation**:
- **0 out of 6** modular chassis hulls ever descend toward baseline depth ($y \approx 734\text{--}750$).
- Across 60 full seconds of passive drift, every single hull remains permanently pinned in the top ceiling zone ($y \le 156.06\text{ px}$), falling short of baseline depth by approximately **600 pixels**.
- The total distance descended is less than **3%** of the journey to baseline.

#### 1.2.2 Spatial Grid Sampling Across Overlap Zone $x \in [286, 314]$ at $y=130$
Tested across 7 horizontal positions spanning the analytical overlap band ($[286.06, 313.94]$) for 30s:
```
┌─────────┬────────┬────────┬────────┬────────┬─────────────────┐
│ (index) │ startX │ finalX │ finalY │ maxY   │ reachedBaseline │
├─────────┼────────┼────────┼────────┼────────┼─────────────────┤
│ 0       │ 286    │ 264.24 │ 145.07 │ 151.53 │ false           │
│ 1       │ 290    │ 282.73 │ 142.58 │ 151.52 │ false           │
│ 2       │ 295    │ 264.64 │ 142.90 │ 151.53 │ false           │
│ 3       │ 300    │ 283.26 │ 138.41 │ 150.31 │ false           │
│ 4       │ 305    │ 264.62 │ 142.90 │ 150.31 │ false           │
│ 5       │ 310    │ 283.55 │ 138.21 │ 150.31 │ false           │
│ 6       │ 314    │ 263.46 │ 142.91 │ 150.98 │ false           │
└─────────┴────────┴────────┴────────┴────────┴─────────────────┘
```
**Verbatim Observation**:
- Every tested coordinate within $[286, 314]$ converges to the identical stagnant trap ($finalY \in [138, 145]$, $maxY \le 151.53$).

#### 1.2.3 Microsecond Mechanics & Limit-Cycle Oscillation at $y \approx 147\text{--}151\text{ px}$
Direct frame-by-frame probe of `Player` and `HydrothermalVent` in `GATE2-MECHANICS`:
```
┌─────────┬───────┬────────┬─────────────┬───────────┐
│ (index) │ frame │ y      │ isInUpdraft │ liftRatio │
├─────────┼───────┼────────┼─────────────┼───────────┤
│ 0       │ 1     │ 143.20 │ false       │ 0.369     │
│ 1       │ 2     │ 144.41 │ false       │ 0.382     │
│ 2       │ 3     │ 145.42 │ false       │ 0.394     │
│ 3       │ 4     │ 146.25 │ false       │ 0.403     │
│ 4       │ 5     │ 146.94 │ false       │ 0.410     │
│ 5       │ 6     │ 147.51 │ true        │ 0.417     │  <-- isInUpdraft toggles ON
│ 6       │ 7     │ 141.14 │ false       │ 0.346     │  <-- KICKED UPWARD by 6.37 px!
│ 7       │ 8     │ 142.70 │ false       │ 0.363     │
│ 8       │ 9     │ 143.99 │ false       │ 0.378     │
│ 9       │ 10    │ 145.07 │ false       │ 0.390     │
│ 10      │ 11    │ 145.96 │ false       │ 0.400     │
│ 11      │ 12    │ 146.70 │ false       │ 0.408     │
│ 12      │ 13    │ 147.31 │ false       │ 0.415     │
│ 13      │ 14    │ 147.82 │ true        │ 0.420     │  <-- isInUpdraft toggles ON
│ 14      │ 15    │ 141.40 │ false       │ 0.349     │  <-- KICKED UPWARD by 6.42 px!
└─────────┴───────┴────────┴─────────────┴───────────┘
```
**Verbatim Observation**:
- In 100 frames (5.0s), `isInUpdraft` toggled **26 times**.
- Each time the submarine slowly sinks below $y \approx 147$, `isInUpdraft` is set to `true`, instantly freezing ballast descent. Convective lift then pushes the vessel back upward to $y \approx 141$, creating an infinite hydrodynamic trap.

---

## 2. Logic Chain

1. **Analytical Origin of Baseline Depth**:
   - In `Player.ts:55-57`, `baselineY` is defined as `canvasHeight - size.height - 20`.
   - For canvas height 800:
     - `DEFAULT` / `KRAKEN`: $800 - 40 - 20 = 740\text{ px}$.
     - `NAUTILUS`: $800 - 46 - 20 = 734\text{ px}$.
     - `STINGRAY`: $800 - 30 - 20 = 750\text{ px}$.
     - `LEVIATHAN`: $800 - 42 - 20 = 738\text{ px}$.
     - `GHOST`: $800 - 34 - 20 = 746\text{ px}$.
   - Baseline depth is universally located in $[734, 750]$, near the seabed at the bottom of the screen.

2. **The Flaw in Worker 2's Remediated Logic**:
   - In Worker 2's fix, line 239 was changed from unconditional `isInUpdraft = true;` to:
     ```typescript
     if (inCore || liftRatio >= 0.5) {
       (player as any).isInUpdraft = true;
     }
     ```
   - In `HydrothermalVent.ts`, `capCeiling = 130` and `transitionZone = 90`.
   - `depthAboveCap = playerCenterY - 130`.
   - Therefore, `liftRatio = (playerCenterY - 130) / 90`.
   - For `DEFAULT` ($H=40$), `playerCenterY = y + 20`.
   - When $y < 155$, `liftRatio < 0.5`, so `isInUpdraft` remains `false`.
   - Because `isInUpdraft` is false, `Player.ts:101` allows ballast settling to sink the vessel from $y = 130$ to $y \approx 150$.
   - Worker 2 observed that $y$ moved from $130$ to $151.2$, causing Challenger 2's Iteration 1 assertion `expect(player.position.y).toBeLessThan(140)` to fail.
   - Worker 2 mistakenly concluded that this test failure proved the bug was fixed.

3. **Why the Submarine Never Descends to Baseline Depth**:
   - As soon as the vessel sinks past $y \approx 147\text{--}155$, `liftRatio` approaches $0.5$ (or lateral dispersion sloshes the vessel into a higher-lift region).
   - Once `liftRatio >= 0.5`, `isInUpdraft` becomes `true`.
   - In `Player.ts:101`, `if (this.isBallastActive && !this.isInUpdraft)` evaluates to `false`. Downward ballast descent ($165\text{ px/s}$) **immediately ceases**.
   - Simultaneously, `HydrothermalVent.ts:243` calculates upward lift:
     $$\text{lift} = \text{baseLift} \times \text{liftRatio} = (160\text{ to }260) \times 0.5 \times \Delta t \ge 80 \times \Delta t\text{ px}.$$
   - The vent applies this upward lift directly to `player.position.y`, lifting the vessel back up into $y \in [135, 141]$.
   - As soon as $y < 147$, `liftRatio < 0.5`, turning `isInUpdraft` off and re-engaging ballast.
   - This produces a **stable limit-cycle attractor** at $y \in [135, 156]$:
     - The submarine can never sink past $y \approx 156\text{ px}$.
     - Baseline depth is at $y \approx 740\text{ px}$.
     - The submarine remains trapped **600 pixels away from baseline depth indefinitely**.

4. **Horizontal Stagnation in Dual-Vent Halo Overlap**:
   - The halos of Vent Left ($anchorX=180$) and Vent Right ($anchorX=420$) overlap across $x \in [286, 314]$ at $y \le 160$.
   - In this region, Vent Left applies eastward dispersion ($+x$) and Vent Right applies westward dispersion ($-x$).
   - The opposing dispersion forces cancel each other out horizontally, trapping the vessel between $x \approx 260$ and $x \approx 285$.
   - Every 6.0 seconds, one of the two staggered vents enters an ERUPTION state ($baseLift = 260\text{ px/s}$), providing violent upward kicks that reset any downward progress back to $y \approx 130$.

---

## 3. Adversarial Challenge Report

### Challenge Summary
- **Overall Risk Assessment**: **CRITICAL**
- Worker 2's fix merely displaced the ceiling boundary from $y = 130$ to $y \approx 151$.
- Under passive drift, **NO submarine can ever return to baseline operating depth**.
- The player remains permanently trapped at the top 20% of the canvas.

### Challenge 1: Limit-Cycle Ceiling Trap at $y \approx 151\text{--}156\text{ px}$
- **Assumption Challenged**: Worker 2's claim that `if (inCore || liftRatio >= 0.5) isInUpdraft = true;` allows submarines to naturally descend toward baseline depth under passive drift.
- **Attack Scenario**:
  1. A submarine is placed or lifted into the overlap zone ($x = 300, y = 130$).
  2. The player does not press any horizontal movement keys (passive drift, stunned by EMP, or novice player waiting for ballast to sink).
  3. Ballast pulls the vessel down to $y \approx 150$.
  4. At $y \approx 151\text{--}155$, `liftRatio` hits $0.5$, triggering `isInUpdraft = true`.
  5. Ballast descent is killed, and convective lift kicks the player back up to $y \approx 141$.
  6. Every 6 seconds, a vent erupts with $260\text{ px/s}$ lift, shoving the submarine back up to $y = 130$.
  7. The player is permanently stranded in a vertical limit cycle 600px above seabed.
- **Blast Radius**:
  - Affects 100% of modular chassis hulls (`DEFAULT`, `NAUTILUS`, `STINGRAY`, `KRAKEN`, `LEVIATHAN`, `GHOST`).
  - Covers the entire central overlap zone $[286, 314]$ across the top of the board.
  - Player cannot descend to access seabed pickups, repair barricades, or avoid top-spawning enemies.
- **Mitigation**:
  - Rather than gating `isInUpdraft` with a hard step function at `liftRatio >= 0.5`, allow ballast descent to compete organically with attenuated plume cap lift, OR taper the vent halo radius near `capY` so that open water exists between the two chimneys, allowing unobstructed descent between $x = 250$ and $x = 350$.

---

## 4. Caveats

1. **Active Steering Contrast**:
   - If the player actively steers (`ArrowLeft` or `ArrowRight`), the submarine's horizontal engine ($220\text{--}420\text{ px/s}$) overpowers the vent turbulence ($80\text{--}120\text{ px/s}$) and escapes outward past $x < 46$ or $x > 554$, where it successfully reaches 100% baseline depth ($y = 740$).
   - This failure mode is specific to **passive drift** (when no lateral keys are pressed or when the player is incapacitated/stunned/idle).
2. **Review-Only Compliance**:
   - In strict compliance with Challenger role constraints, zero modifications were made to production source code (`src/`).

---

## 5. Conclusion

- **Question 1**: Did Worker 2's fix resolve the multi-vent overlap zone ($x \in [286, 314]$ at $y = 130$)?
  - **Assessment**: **NO**. It only shifted the equilibrium height from $y = 130$ to $y \approx 151$.
- **Question 2**: When a submarine is placed at $x = 300, y = 130$ with no player movement keys pressed (passive drift), does the submarine now descend toward baseline depth?
  - **Assessment**: **NO**. Measured final Y across all 6 hulls is $y \in [135, 148]$ (target baseline is $734\text{--}750$). Total descent achieved is less than 3% of the required distance.
- **Question 3**: Verification across all 6 modular chassis hulls:
  - `DEFAULT`: 1.34% descent (final $y = 138.20$, baseline $740$)
  - `NAUTILUS`: 0.86% descent (final $y = 135.20$, baseline $734$)
  - `STINGRAY`: 2.13% descent (final $y = 143.21$, baseline $750$)
  - `KRAKEN`: 1.34% descent (final $y = 138.20$, baseline $740$)
  - `LEVIATHAN`: 1.24% descent (final $y = 137.57$, baseline $738$)
  - `GHOST`: 2.91% descent (final $y = 147.90$, baseline $746$)
- **Final Verdict**: **CHALLENGE_DETECTED**

---

## 6. Verification Method

To independently reproduce all empirical findings:

```bash
# 1. Run Gate 2 Adversarial Verification Suite (all 9 tests pass, proving the trap)
SKIP_WEBSERVER=1 npx playwright test tests/adversarial_buoyancy_gate2_verification.spec.ts

# 2. Inspect limit-cycle oscillation logs showing 26 updraft toggles in 100 frames
SKIP_WEBSERVER=1 npx playwright test tests/adversarial_buoyancy_gate2_verification.spec.ts -g "GATE2-MECHANICS"

# 3. Verify TypeScript Compilation & Production Build
npx tsc --noEmit
npm run build
```

# Adversarial Challenge & Verification Handoff Report

**Agent**: `buoyancy_challenger_2` (`teamwork_preview_challenger`)  
**Mission**: Adversarially test modular chassis profiles, multi-vent interactions, ballast restoration across all hulls, and evaluate the vent overlap zone ($x \in [286, 314]$ at $y=130$).  
**Deliverable Path**: `/Users/user/src/water-invader/.agents/buoyancy_challenger_2/handoff.md`  
**Test Harness Path**: `/Users/user/src/water-invader/tests/adversarial_buoyancy_modular_overlap.spec.ts`  
**Date**: 2026-09-17  
**Verdict**: **CHALLENGE_DETECTED** (Detailed in Section 4)

---

## 1. Observation

### 1.1 Source Code Inspections

#### 1.1.1 Modular Submersible Chassis Hulls & Baseline Depths
In `src/game/Player.ts` (lines 55–57):
```typescript
public get baselineY(): number {
  return this.canvasHeight - this.size.height - 20;
}
```
In `src/game/flagship/progression/ModularChassis.ts` (lines 260–385 and lines 416–417):
```typescript
player.size.width = this.activeChassis.hitboxWidth;
player.size.height = this.activeChassis.hitboxHeight;
```
Direct dimensions and analytical baseline operating depths for $800\text{px}$ canvas height:
- `DEFAULT`: $50 \times 40 \implies \text{baselineY} = 800 - 40 - 20 = 740\text{ px}$
- `NAUTILUS`: $64 \times 46 \implies \text{baselineY} = 800 - 46 - 20 = 734\text{ px}$
- `STINGRAY`: $38 \times 30 \implies \text{baselineY} = 800 - 30 - 20 = 750\text{ px}$
- `KRAKEN`: $50 \times 40 \implies \text{baselineY} = 800 - 40 - 20 = 740\text{ px}$
- `LEVIATHAN`: $54 \times 42 \implies \text{baselineY} = 800 - 42 - 20 = 738\text{ px}$
- `GHOST`: $46 \times 34 \implies \text{baselineY} = 800 - 34 - 20 = 746\text{ px}$

#### 1.1.2 Plume Cap Dissipation & Lateral Outward Dispersion
In `src/game/flagship/environment/HydrothermalVent.ts` (lines 232–251):
```typescript
// Convective updraft and plume cap dissipation
if (inHalo || inCore) {
  (player as any).isBallastActive = true;
  (player as any).isInUpdraft = true;
  const capCeiling = this.capY + 30; // 130
  const transitionZone = 90; // Plume cap dissipation band [130, 220]
  const depthAboveCap = Math.max(0, playerCenterY - capCeiling);
  const liftRatio = Math.min(1.0, depthAboveCap / transitionZone);
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

#### 1.1.3 Multi-Vent Benthic Placement
In `src/game/flagship/environment/HydrothermalVent.ts` (lines 483–488):
```typescript
// Initialize 2 staggered benthic hydrothermal chimneys
this.vents = [
  new HydrothermalVent('vent_left', 180, 0.0),
  new HydrothermalVent('vent_right', 420, 6.0), // Staggered by 6.0s
];
```

#### 1.1.4 Halo Geometry at Plume Cap ($y = 130$)
In `src/game/flagship/environment/HydrothermalVent.ts` (lines 110–120):
```typescript
public getCoreRadius(y: number): number {
  const clampedY = Math.max(this.capY, Math.min(this.baseY, y));
  return 22 + (this.baseY - clampedY) * 0.08;
}
public getHaloRadius(y: number): number {
  return this.getCoreRadius(y) * 1.85;
}
```
At $y = 130$:
- $\text{coreR}(130) = 22 + (760 - 130) \times 0.08 = 22 + 50.4 = 72.4\text{ px}$
- $\text{haloR}(130) = 72.4 \times 1.85 = 133.94\text{ px}$
- **Vent Left Halo Coverage**: $[180 - 133.94, 180 + 133.94] = [46.06, 313.94]$
- **Vent Right Halo Coverage**: $[420 - 133.94, 420 + 133.94] = [286.06, 553.94]$
- **Overlap Region**: $[286.06, 313.94] \approx [286, 314]$
- **Combined Contiguous Halo Union**: $[46.06, 553.94]$ (spans $507.88\text{ px}$ of the $600\text{ px}$ canvas, or **84.65%** of the visible game board).

---

### 1.2 Empirical Test Execution Results

All verification tests were directly authored and executed via Playwright runner:
- **Test File**: `tests/adversarial_buoyancy_modular_overlap.spec.ts`
- **Execution Command**: `SKIP_WEBSERVER=1 npx playwright test tests/adversarial_buoyancy_modular_overlap.spec.ts`
- **Result**: **12 passed (854ms)**

#### 1.2.1 Modular Chassis Ballast Settling (Outside Vents)
| Chassis Hull | Hitbox ($W \times H$) | Target `baselineY` | Measured Descent Rate | Final Settled $Y$ | Ballast Deactivated? |
|---|---|---|---|---|---|
| `DEFAULT` | $50 \times 40$ | $740\text{ px}$ | $165\text{ px/s}$ monotonic | $740.0\text{ px}$ | Yes (`isBallastActive = false`) |
| `NAUTILUS` | $64 \times 46$ | $734\text{ px}$ | $165\text{ px/s}$ monotonic | $734.0\text{ px}$ | Yes (`isBallastActive = false`) |
| `STINGRAY` | $38 \times 30$ | $750\text{ px}$ | $165\text{ px/s}$ monotonic | $750.0\text{ px}$ | Yes (`isBallastActive = false`) |
| `KRAKEN` | $50 \times 40$ | $740\text{ px}$ | $165\text{ px/s}$ monotonic | $740.0\text{ px}$ | Yes (`isBallastActive = false`) |
| `LEVIATHAN` | $54 \times 42$ | $738\text{ px}$ | $165\text{ px/s}$ monotonic | $738.0\text{ px}$ | Yes (`isBallastActive = false`) |
| `GHOST` | $46 \times 34$ | $746\text{ px}$ | $165\text{ px/s}$ monotonic | $746.0\text{ px}$ | Yes (`isBallastActive = false`) |

*Result*: 100% PASS for all modular chassis hulls when clear of plume columns.

#### 1.2.2 Instantaneous Lateral Velocity Vector Field at $y = 130$ (`VENT-OVERLAP-EMPIRICAL-05`)
Measured at 20px increments across canvas width ($x \in [20, 560]$) with both vents in `DORMANT` state ($V_{\text{disp}} = 62.2\text{ px/s}$):
```
x=20  (center=45):  vx=  0.0 px/s --- (0)       | LeftHalo=false, RightHalo=false (Open Sea)
x=40  (center=65):  vx=-62.2 px/s <-- (West)    | LeftHalo=true,  RightHalo=false
x=100 (center=125): vx=-62.2 px/s <-- (West)    | LeftHalo=true,  RightHalo=false
x=160 (center=185): vx=+62.2 px/s --> (East)    | LeftHalo=true,  RightHalo=false
x=220 (center=245): vx=+62.2 px/s --> (East)    | LeftHalo=true,  RightHalo=false
x=280 (center=305): vx=  0.0 px/s --- (Stagnant)| LeftHalo=true,  RightHalo=true  (Overlap Sink!)
x=340 (center=365): vx=-62.2 px/s <-- (West)    | LeftHalo=false, RightHalo=true
x=400 (center=425): vx=+62.2 px/s --> (East)    | LeftHalo=false, RightHalo=true
x=520 (center=545): vx=+62.2 px/s --> (East)    | LeftHalo=false, RightHalo=true
x=540 (center=565): vx=  0.0 px/s --- (0)       | LeftHalo=false, RightHalo=false (Open Sea)
```

#### 1.2.3 Extended 30-Second Passive Drift in Overlap Zone (`VENT-OVERLAP-EMPIRICAL-04`)
Test initialized all 6 modular chassis hulls in the overlap zone at $x = 300 - W/2, y = 130$ for 600 frames ($30.0\text{ seconds}$ at $\Delta t = 0.05\text{s}$):
| Chassis | Initial Position | 30s Final $X$ | 30s Final $Y$ | $Y_{\min}$ | $Y_{\max}$ | Frames Descended ($Y > 135$) |
|---|---|---|---|---|---|---|
| `DEFAULT` | $(275, 130)$ | $261.0\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | **0 / 600** |
| `NAUTILUS` | $(268, 130)$ | $276.9\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | **0 / 600** |
| `STINGRAY` | $(281, 130)$ | $266.0\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | **0 / 600** |
| `KRAKEN` | $(275, 130)$ | $284.3\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | **0 / 600** |
| `LEVIATHAN` | $(273, 130)$ | $259.2\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | **0 / 600** |
| `GHOST` | $(277, 130)$ | $286.7\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | $130.0\text{ px}$ | **0 / 600** |

*Verbatim Measurement*: Under passive conditions, **no chassis hull ever descended past the ceiling boundary** ($Y = 130$). Final $Y$ remained pinned at $130.0\text{ px}$ with zero descent frames across all 6 hulls.

#### 1.2.4 Active Steering Escape from Overlap Zone (`VENT-OVERLAP-EMPIRICAL-02`, `03`, `06`)
When player actively steers (`ArrowLeft` or `ArrowRight`), the hull's lateral propulsion ($220\text{--}420\text{ px/s}$) overcomes the vent turbulence ($62.2\text{--}93.3\text{ px/s}$):
- Steering Left from $(275, 130)$: vessel clears $x = 46$ at $t \approx 1.25\text{s}$, settles cleanly to baseline depth:
  - `DEFAULT`: settles to $740.0\text{ px}$
  - `NAUTILUS`: settles to $734.0\text{ px}$
  - `STINGRAY`: settles to $750.0\text{ px}$
  - `KRAKEN`: settles to $740.0\text{ px}$
  - `LEVIATHAN`: settles to $738.0\text{ px}$
  - `GHOST`: settles to $746.0\text{ px}$
- Steering Right from $(275, 130)$: vessel clears $x = 554$ at $t \approx 1.35\text{s}$, settles cleanly to $740.0\text{ px}$.

---

## 2. Logic Chain

1. **Analytical Baseline Deduction**:
   - `Player.prototype.baselineY` is implemented as `canvasHeight - size.height - 20`.
   - Each chassis has a distinct height: Nautilus (46) -> 734, Leviathan (42) -> 738, Default/Kraken (40) -> 740, Ghost (34) -> 746, Stingray (30) -> 750.
   - When isolated from updrafts, `Player.update()` settles monotonically toward `baselineY` at $165\text{ px/s}$ and clamps safely (Obs 1.1.1, Obs 1.2.1).

2. **The Passive Overlap Equilibrium Trap**:
   - In `HydrothermalVent.ts`, lateral dispersion near the plume cap is computed via:
     `sign = playerCenterX >= this.anchorX ? 1 : -1;`
   - For Vent Left ($anchorX = 180$), $playerCenterX > 180 \implies sign = +1$ (pushes Eastward toward $420$).
   - For Vent Right ($anchorX = 420$), $playerCenterX < 420 \implies sign = -1$ (pushes Westward toward $180$).
   - In the region between the two vents ($x \in (180, 420)$), the vectors point directly toward each other, forming a convergent stagnation point at $x \approx 300$ (Obs 1.1.2, Obs 1.2.2).

3. **Continuous Updraft Suppression of Ballast**:
   - At $y = 130$, the halo of Vent Left reaches $x = 313.94$ and the halo of Vent Right reaches $x = 286.06$ (Obs 1.1.4).
   - Because $313.94 > 286.06$, there is **zero clear water** between the two vents at the top of the canvas; the halos overlap continuously across $[286, 314]$ (Obs 1.1.4).
   - In `HydrothermalVent.update`, being in either halo sets `(player as any).isInUpdraft = true;` and executes `player.position.y = Math.max(130, player.position.y - lift);` on every frame (Obs 1.1.2).
   - In `Player.update`, ballast settling only executes if `!this.isInUpdraft`.
   - Because the player is trapped between the two inward-pushing vents, `isInUpdraft` is never false. Ballast descent is 100% suppressed, and the upward lift continuously forces $y = 130$ (Obs 1.2.3).

4. **Active Steering Asymmetry**:
   - Submersible thrusters produce $220\text{--}420\text{ px/s}$. Vent dispersion produces at most $120 \times (1 - 20/90) = 93.3\text{ px/s}$.
   - Player steering can easily overcome the dispersion. However, because the halo union spans $[46.06, 553.94]$ (84.65% of screen width), the player cannot escape by steering into the "gap" between vents (there is no gap). They must steer all the way past the outer flanks ($x < 46$ or $x > 554$) before ballast engages (Obs 1.2.4).

---

## 3. Adversarial Challenge Report

### Challenge Summary
**Overall Risk Assessment**: **MEDIUM / HIGH**  
The core bug (permanent lock when steering away from a single vent) is fixed. However, in the dual-vent environment present in actual gameplay, passive dispersion in the overlap zone does not disperse outward or descend; it acts as a convergent hydrodynamic trap that pins idle players indefinitely at $y = 130$.

### Challenge 1: Multi-Vent Convergent Stagnation Trap in Overlap Zone $[286, 314]$
- **Assumption Challenged**: The assumption that plume cap radial dispersion naturally dissipates upward buoyant pinning and permits passive lateral clearing into descending waters.
- **Attack Scenario**:
  1. Player submarine is caught in Vent Left ($anchorX=180$) and lifted to plume cap ($y=130$).
  2. Plume cap dispersion pushes the player to the right ($+x$).
  3. Player reaches $x \approx 286\text{ px}$, entering the halo of Vent Right ($anchorX=420$).
  4. Vent Right applies equal-and-opposite westward dispersion ($-x$), arresting lateral movement.
  5. The player enters an infinite equilibrium trap at $(x \approx 261\text{--}286, y = 130)$.
  6. Because both halos are active, `isInUpdraft` remains permanently `true`, completely disabling ballast restoration.
  7. If the player releases their controls (or is stunned/slowed), the submarine remains pinned at $y = 130$ forever.
- **Blast Radius**:
  - Affects all 6 modular chassis hulls uniformly (Obs 1.2.3).
  - Covers $84.65\%$ of the horizontal canvas width at the ceiling ($y \le 130$), forcing players to steer all the way to the screen edges ($< 46\text{px}$ or $> 554\text{px}$) to descend.
  - Players unable to maneuver (e.g., EMP shock, heavy suppression, or novice players expecting passive buoyancy settling) will be permanently trapped at the ceiling.
- **Mitigation Proposals**:
  1. **Halo Cap Tapering (Recommended)**: Taper `haloRadius` near `capY` (e.g. scale `haloR` by `Math.max(0.5, (y - capY) / 200)` for $y < 300$). At $y = 130$, this shrinks `haloR` from $134\text{px}$ to $\approx 67\text{px}$, opening a wide neutral water descent lane ($x \in [247, 353]$) between the two chimneys.
  2. **Updraft Priority Inversion in Plume Cap**: In `Player.ts`, if `player.position.y <= capCeiling + 5` and the player is not in a scalding `core`, allow ballast restoration to overpower the attenuated halo lift ($165\text{ px/s}$ descent vs $35\text{ px/s}$ attenuated lift), enabling gradual descent even within overlapping halos.
  3. **Explicit Design Rule**: If this convergence trap is intended as a deliberate "deadly benthic eddy" environmental hazard, document it in `GAMEPLAY_RULES.md` and ensure the UI/Sonar provides a visual whirlpool indicator.

---

## 4. Caveats

1. **Active Steering Is Fully Functional**: This challenge strictly affects passive/idle drift. Active steering (`ArrowLeft` / `ArrowRight`) reliably breaks out of the overlap zone to screen boundaries and restores depth for all 6 hulls.
2. **Single-Vent Isolation**: In a test or wave with only one vent active, passive dispersion functions as designed: the vessel is pushed past $x = 314$ into open water and descends to baseline depth.
3. **No Vertical Steering in Game Engine**: Water Invader's `Player.ts` has no vertical propulsion controls (`ArrowDown` does not exist). Therefore, the player has no active vertical dive thruster to force a descent inside an updraft.

---

## 5. Conclusion

- **Modular Chassis Ballast Profiles**: **APPROVED**. All 6 chassis hulls (`DEFAULT`, `NAUTILUS`, `STINGRAY`, `KRAKEN`, `LEVIATHAN`, `GHOST`) correctly calculate their unique `baselineY` ($734\text{--}750\text{ px}$) and restore depth smoothly and monotonically at $165\text{ px/s}$ without popping.
- **Multi-Vent Overlap Zone ($x \in [286, 314]$ at $y=130$)**:
  - **Does the player submarine successfully disperse outward and descend?**
    - **Under Passive Drift**: **NO**. The opposing dispersion vectors form a convergent stagnation sink, and contiguous halo updrafts prevent ballast restoration from ever engaging.
    - **Under Active Steering**: **YES**. Submarine horizontal thrusters overpower the vent turbulence and achieve full descent at the screen edges.
- **Final Verdict**: **CHALLENGE_DETECTED** due to the multi-vent passive ceiling trap.

---

## 6. Verification Method

To reproduce and independently verify all empirical findings:

1. **TypeScript Type-Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: Code 0 (zero errors).

2. **Run Full Adversarial Stress Test Suite**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/adversarial_buoyancy_modular_overlap.spec.ts
   ```
   *Expected*: 12/12 passed (demonstrates chassis settling, overlap velocity vector field, 30s passive ceiling trap, and active steering escape).

3. **Inspect Output Logs**:
   Observe `Instantaneous Lateral Velocity Vector Field at y=130` proving $v_x = 0$ at center $305$ with opposing signs on either side, and `30s Passive Overlap` showing `descendedCount = 0` and `finalY = 130.0` across all 6 hulls.

4. **Production Build Integrity**:
   ```bash
   npm run build
   ```
   *Expected*: Next.js build succeeds cleanly in $< 1.5\text{s}$.

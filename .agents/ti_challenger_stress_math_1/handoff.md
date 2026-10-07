# Handoff Report: Adversarial Challenge 1 (Stress Math & Collision Defenses)

**Agent**: `ti_challenger_stress_math_1` (EMPIRICAL CHALLENGER / critic, specialist)  
**Milestone**: M5 (Total Codebase Inspection — "총검사")  
**Handoff Type**: Hard (Inspection & Stress Testing Complete)  
**Verdict**: `REQUEST_CHANGES`

---

## 1. Observation

Direct empirical observations from code inspection and test execution:

1. **`Bullet.ts` Homing Missile Kinematic Safeguards**:
   - In `src/game/Bullet.ts:295-306`:
     ```ts
     if (Number.isFinite(dx) && Number.isFinite(dy) && distSq > 0.0001) {
       const targetAngle = Math.atan2(dy, dx);
       if (Number.isFinite(targetAngle)) { ... }
     }
     if (!Number.isFinite(this.angle)) { this.angle = -Math.PI / 2; }
     ```
   - Observed that when $dx = 0$ and $dy = 0$ ($distSq = 0$), the condition $distSq > 0.0001$ evaluates to `false`, safely skipping `Math.atan2(0, 0)` calculation.
   - In a 1,000-frame Monte Carlo simulation with randomized delta times ($\Delta t \in [0.001, 0.2]\text{s}$), NaN coordinates, and zero-distance targets (`CHAL-MATH-01 ~ 06`), 100% of frames maintained finite values for `angle`, `position`, and `velocity`.

2. **`CavitationTorpedo.ts` Swept CCD Anti-Tunneling**:
   - In `src/game/flagship/weapons/CavitationTorpedo.ts:190-236`:
     ```ts
     const vx = p1x - p0x;
     const vy = p1y - p0y;
     const segLenSq = vx * vx + vy * vy;
     ...
     const t = Math.max(0, Math.min(1, ((hx - p0x) * vx + (hy - p0y) * vy) / segLenSq));
     const cx = p0x + t * vx;
     const cy = p0y + t * vy;
     distSq = (cx - hx) ** 2 + (cy - hy) ** 2;
     if (distSq <= combinedRadius * combinedRadius)
     ```
   - Swept capsule-to-circle and swept segment-to-AABB (`Entity.lineSegmentIntersectsAABB`) algorithms were tested with simulated frame lags of $\Delta t = 0.1\text{s}$ ($58\text{px}$ leap), $\Delta t = 0.2\text{s}$ ($116\text{px}$ leap), and $\Delta t = 0.5\text{s}$ ($290\text{px}$ leap) over small targets ($15\text{px}$ radius) and thin barricades ($10\text{px}$ height).
   - At $\Delta t = 0.1\text{s}$, discrete check at end of frame had zero AABB overlap ($y=442$ vs $[470, 500]$), but swept CCD successfully detected the collision and detonated into `SINGULARITY`. Near-misses $4\text{px}$ outside the flight tube maintained `ARMED` state with zero false positives.

3. **`Entity.ts` Narrowphase Swept AABB**:
   - In `src/game/Entity.ts:104-139`:
     ```ts
     const deltaRel = { x: deltaP.x - deltaQ.x, y: deltaP.y - deltaQ.y };
     const bx = p0.x + deltaRel.x;
     const by = p0.y + deltaRel.y;
     const xmin = q0.x - this.size.width;
     const xmax = q0.x + other.size.width;
     ...
     return Entity.lineSegmentIntersectsAABB(ax, ay, bx, by, xmin, xmax, ymin, ymax);
     ```
   - Diagonal trajectories $(100, 500) \to (300, 300)$ tested against entities placed at corners of the broadphase swept AABB ($x=120, y=320$ and $x=280, y=480$) returned `false` for both `checkCollision` and `sweptAABB`, proving zero false-positive phantom hits across all 4 quadrants.

4. **Boundary Culling Defect: Non-Finite (`NaN`) Coordinates Bypass Culling**:
   - In `src/game/flagship/factions/HadalBioHorrors.ts:595-603`:
     ```ts
     if (
       unit.isDead ||
       unit.position.x < -150 ||
       unit.position.x > 750 ||
       unit.position.y < -150 ||
       unit.position.y > 850
     ) {
       this.units.splice(i, 1);
     }
     ```
   - In `tests/adversarial_challenger_stress_math.spec.ts:CHAL-CULL-05`:
     Injecting `unit.position = { x: NaN, y: NaN }` resulted in `faction.units.length = 1` surviving across updates because `NaN < -150` and `NaN > 750` both evaluate to `false`.
     Furthermore, `HadalBioHorrors.ts:808` executes `ctx.translate(unit.position.x, unit.position.y)`, which with `NaN` poisons the 2D transformation matrix.

5. **Boundary Culling Defect: `stunTimer > 0` Bypass**:
   - In `src/game/flagship/factions/HadalBioHorrors.ts:414-417`:
     ```ts
     if (unit.stunTimer && unit.stunTimer > 0) {
       unit.stunTimer -= deltaTime;
       continue; // Stunned, cannot move or act
     }
     ```
   - In `tests/adversarial_challenger_stress_math.spec.ts:CHAL-CULL-03b`:
     A unit with `stunTimer = 2.0` positioned at $x = -999, y = -999$ survives update because `continue;` skips the boundary culling check at lines 595-603.

---

## 2. Logic Chain

1. **Premise 1**: The mathematical defense in `Bullet.ts` implements guards against $distSq \le 0.0001$, `!Number.isFinite(dx)`, and `!Number.isFinite(this.angle)`.
   - *Supported by*: Observation 1, Tests CHAL-MATH-01 ~ 06 passing 100%.
   - *Inference*: Homing missile steering and velocity updates are mathematically stable against division by zero, negative positions, and NaN inputs.

2. **Premise 2**: Discrete collision checks fail when an entity's per-frame displacement exceeds its target's bounding dimension (tunneling).
   - *Supported by*: Observation 2, where a $58\text{px}$ leap at $\Delta t = 0.1\text{s}$ hops over a $30\text{px}$ target without start-of-frame or end-of-frame AABB overlap.
   - *Inference*: `CavitationTorpedo.ts`'s swept segment raycast and `Entity.ts`'s Minkowski difference swept line intersection reliably eliminate tunneling under high simulated lag ($\Delta t \le 0.5\text{s}$).

3. **Premise 3**: Naive swept AABBs produce phantom hits on diagonal trajectories because the bounding box enclosing the trajectory contains empty off-path space.
   - *Supported by*: Observation 3, where broadphase contains $(120, 320)$ but narrowphase line segment intersection rejects it.
   - *Inference*: `Entity.sweptAABB` narrowphase accurately evaluates whether the relative movement segment intersects the Minkowski sum box, producing zero phantom hits.

4. **Premise 4**: Culling checks that rely exclusively on inequality checks against finite bounds (`x < MIN || x > MAX`) fail for `NaN` values under IEEE 754 floating-point standards.
   - *Supported by*: Observation 4, where `NaN < -150` evaluates to `false`.
   - *Inference*: Corrupted entities with `NaN` coordinates cannot be culled by the current logic in `HadalBioHorrors.ts` or `AutomatonPhalanx.ts` and will leak into memory and poison `ctx.translate`.

5. **Premise 5**: Control flow structures that skip the remainder of an entity loop via `continue` before boundary culling prevent the culling of stunned or deactivated entities.
   - *Supported by*: Observation 5, where line 416 `continue;` bypasses lines 595-603.
   - *Inference*: Stunned entities placed out of bounds will linger in memory until stun expiration.

---

## 3. Caveats

- **Scope Boundary**: As an Empirical Challenger, we do NOT modify application source code in `src/`. All findings are demonstrated via tests in `tests/adversarial_challenger_stress_math.spec.ts`.
- **Pre-existing Stability**: The NaN culling bypass requires an entity to obtain `NaN` coordinates first; during standard gameplay without manual state poisoning, entities rarely acquire `NaN`. However, defensive programming requires boundary culling to be foolproof against corrupted states.
- **Stationary vs Moving Units**: Units with high natural velocities (e.g. Clinger corkscrew $v_x = 160$) can move across boundaries in a single frame; this is natural kinematic motion rather than a boundary detection failure.

---

## 4. Conclusion

- **Verdict**: **`REQUEST_CHANGES`**
- **Defenses Holding**:
  1. `Bullet.ts` homing missile logic is robust against coincident coordinates, sub-pixel distances, negative coordinates, and NaN inputs.
  2. `CavitationTorpedo.ts` CCD prevents tunneling through small targets ($15\text{px}$ radius) and barricades under lag spikes up to $\Delta t = 0.5\text{s}$.
  3. `Entity.sweptAABB()` exhibits zero false-positive phantom hits on diagonal passing trajectories.
- **Defects Requiring Remediation**:
  1. Add `!Number.isFinite(unit.position.x) || !Number.isFinite(unit.position.y)` to the boundary culling check in `src/game/flagship/factions/HadalBioHorrors.ts:595` and `src/game/flagship/factions/AutomatonPhalanx.ts:283`.
  2. In `src/game/flagship/factions/HadalBioHorrors.ts:414-417`, ensure `stunTimer > 0` only bypasses movement/attack AI, without bypassing terminal boundary culling and `isDead` removal.

---

## 5. Verification Method

To independently reproduce and verify all observations and conclusions:

```bash
# 1. Run the dedicated 22-test adversarial stress test suite
SKIP_WEBSERVER=1 npx playwright test tests/adversarial_challenger_stress_math.spec.ts

# 2. Run TypeScript compilation check
npx tsc --noEmit

# 3. Run production Next.js build verification
npm run build
```

# Handoff Report: Physics & Kinematic Edge-Case Survey (Streams A & B)

**Author Agent**: `survey_exp_physics_ab_1`  
**Working Directory**: `/Users/user/src/water-invader/.agents/survey_exp_physics_ab_1`  
**Recipients**: Orchestrator (`a6b982e7-d1a2-4856-a461-1d227c9eea67`), Specialist Implementation Agents (Streams A, B, C, D, E)  
**Type**: Hard Handoff (Investigation Complete)

---

## 1. Observation

Direct code observations from `/Users/user/src/water-invader/src/game/`:

### Stream A Observations
1. **Hitbox switch boundary penetration**:
   - In `src/game/flagship/progression/ModularChassis.ts` (lines 415-417):
     ```typescript
     player.speed = this.activeChassis.baseSpeed;
     player.size.width = this.activeChassis.hitboxWidth;
     player.size.height = this.activeChassis.hitboxHeight;
     ```
     `hitboxWidth` varies from 38px (Stingray) to 64px (Nautilus). If player is at $x = 562$ (right boundary for Stingray: $562 + 38 = 600$), switching to Nautilus results in $x + \text{width} = 562 + 64 = 626 > 600\text{ px}$. No coordinate clamping is performed in `applyToPlayer`.
2. **Instantaneous Ballast Teleportation**:
   - In `src/game/Player.ts` (lines 101-108):
     ```typescript
     if (this.isBallastActive && !this.isInUpdraft) {
       const targetY = this.baselineY;
       if (this.position.y < targetY) {
         this.position.y = Math.min(targetY, this.position.y + this.ballastDescentSpeed * deltaTime);
       } else {
         this.position.y = targetY;
         this.isBallastActive = false;
       }
     }
     ```
     When `position.y > targetY`, the `else` branch snaps `position.y = targetY` in a single frame.
3. **Hardcoded Respawn Coordinates**:
   - In `src/game/GameManager.ts` (lines 310-311, 321-322, 620-621):
     ```typescript
     this.player.position.x = this.logicalWidth / 2 - 25;
     this.player.position.y = this.logicalHeight - 60;
     ```
     Hardcodes $x = 275$ and $y = 740$, misaligning non-default chassis (Nautilus baseline is 734, Stingray baseline is 750).
4. **Permanent Speed Overwrite by Hadal Bio-Horrors**:
   - In `src/game/flagship/progression/ModularChassis.ts` (line 415), `player.baseSpeed` is not updated when changing chassis.
   - In `src/game/flagship/factions/HadalBioHorrors.ts` (lines 324-328):
     ```typescript
     if (n > 0) {
       player.speed = (player.baseSpeed || 300) * speedRatio;
     } else {
       player.speed = player.baseSpeed || 300;
     }
     ```
     Unconditionally overwrites `player.speed` to 300 px/s every frame.
5. **Input Lockout on State Transition**:
   - In `src/game/GameManager.ts` (lines 2942-2947):
     ```typescript
     if (this.state === GameState.PLAYING) {
       if (k === 'arrowleft' || k === 'a') this.player.isMovingLeft = true;
     ```
     Buffered keys during SHOP/CONTINUE states are not synced on entering PLAYING.
6. **Harpoon Velocity Spike**:
   - In `src/game/flagship/weapons/HydraulicHarpoon.ts` (lines 236-241):
     ```typescript
     this.playerVelocity = {
       x: (playerProw.x - this.prevPlayerPos.x) / deltaTime,
       y: (playerProw.y - this.prevPlayerPos.y) / deltaTime,
     };
     ```
     Spikes to -16,566 px/s upon player respawn teleportation.

### Stream B Observations
7. **Unbounded Vent Plume Dispersion**:
   - In `src/game/flagship/environment/HydrothermalVent.ts` (lines 255-259):
     ```typescript
     const dispersionSpeed = (this.state === VentState.ERUPTING ? 120 : 80) * dispersionRatio * deltaTime;
     const sign = playerCenterX >= this.anchorX ? 1 : -1;
     const ambientSurfaceDrift = (playerCenterX >= this.anchorX ? 60 : 0) * dispersionRatio * deltaTime;
     player.position.x += sign * dispersionSpeed + ambientSurfaceDrift;
     ```
     No clamping to $[0, 600 - \text{width}]$. Right vent pushes player past $x > 550$.
8. **Vent Physics Unpaused in Shop**:
   - In `src/game/GameManager.ts` (lines 1705-1709):
     `flagshipManager.update()` is executed during `GameState.SHOP`, but `player.update()` is not. Vent lifts player to $y = 130$ and pushes them out of bounds while shopping.
9. **Convergent Stagnation Zone**:
   - In `src/game/flagship/environment/HydrothermalVentManager.ts` (lines 494-497): Left Vent anchor is 180, Right Vent anchor is 420.
   - At $y = 130$, Left Vent halo reaches $x = 313.94$, Right Vent halo reaches $x = 286.06$.
   - Left Vent pushes East; Right Vent pushes West. Passive player is trapped at $y = 130$ permanently (`adversarial_buoyancy_modular_overlap.spec.ts:238`).
10. **Kraken Prime vs Vent Ceiling Conflict**:
    - `HydrothermalVent.ts:244`: `player.position.y = Math.max(130, player.position.y - lift);`
    - `KrakenPrimeBoss.ts:412`: `player.position.y = Math.max(220, player.position.y - pullSpeed * deltaTime);`
    - Sequential execution creates a 60px positional flicker between $y = 160$ and $y = 220$.
11. **Singularity Rift Clamping Absence**:
    - `EndGameCrisis.ts` lines 322, 365 modify `player.position.x` without canvas boundary clamping.
12. **Fixed Timestep Accumulator NaN Poisoning**:
    - `GameManager.ts:1215-1223` does not verify `Number.isFinite(frameTime)`, allowing NaN to corrupt `this.accumulator` and freeze the simulation loop permanently.

---

## 2. Logic Chain

1. **Hitbox Switch Boundary Violation (Observation 1)** $\implies$ A player changing chassis at the edge of the board expands their bounding box past $x = 600$ or $y = 800$. Because boundary clamping only occurs in `player.update()`, entities can render and collide outside valid logical boundaries.
2. **Ballast Snapping (Observation 2)** $\implies$ If $y > \text{baselineY}$, `position.y < targetY` is false, executing the `else` branch which sets `position.y = targetY` unconditionally. This causes an abrupt position teleportation rather than smooth hydrodynamic settling.
3. **Speed Stat Annihilation (Observation 4)** $\implies$ Because `ModularChassis.applyToPlayer()` sets `player.speed` but leaves `player.baseSpeed = 300`, `HadalBioHorrors.update()` evaluates `player.speed = player.baseSpeed || 300` every frame. All chassis speed traits (Nautilus 220, Stingray 420, Leviathan 270, Kraken pulse) are immediately neutralized to 300 px/s.
4. **Shop State Desync (Observation 8)** $\implies$ Because `flagshipManager.update()` is called during `GameState.SHOP` while `player.update()` is skipped, environmental lift and dispersion run unchecked without player ballast or clamping, stranding the player at the top of the canvas when the next wave begins.
5. **Stagnation Well Entrapment (Observation 9)** $\implies$ In the confluence region $x \in [286, 314]$ at $y = 130$, Left Vent forces push $+x$ and Right Vent forces push $-x$, while both apply upward lift. This cancels lateral egress and permanently disables ballast descent (`isInUpdraft = true`), physically trapping passive vessels.
6. **Derivative Velocity Spike (Observation 6)** $\implies$ Using unconstrained finite differences $\Delta x / \Delta t$ across discrete teleportation events (continue/respawn) yields velocities exceeding 16,000 px/s, breaking subsequent physics calculations (slingshot launches, centripetal whip damage).

---

## 3. Caveats

- **Scope Delimitation**: This survey was strictly read-only and restricted to Stream A (Player Kinematics & Ballast) and Stream B (Environmental Dynamics & Hazard Fields). Stream C (Weapons CCD), Stream D (Flocking / Boss IK), and Stream E (State transitions outside shop/kinematics) were referenced only where their physics directly coupled with Streams A and B.
- **Architectural Invariants**: All observations respect the core constraints: `logicalWidth = 600`, `logicalHeight = 800`.
- **Alternative Interpretations**:
  - In `HydrothermalVent.ts`, the prevailing surface drift was added to prevent stagnation, but because the right vent does not apply eastward surface drift when $x < 420$, convergence persists between $x=286$ and $x=314$.
  - In `HadalBioHorrors.ts`, the author intended to apply parasitic slow scaling against base speed, but inadvertently omitted updating `baseSpeed` in `ModularChassis`.

---

## 4. Conclusion

The physics engine exhibits 16 distinct vulnerabilities spanning boundary penetration, kinematic snapping, stat overwrite, state machine leaks, and vortex entrapment wells. The most urgent issues requiring remediation are:
1. **BUG-04**: Sync `player.baseSpeed = this.activeChassis.baseSpeed` in `ModularChassis.ts` and stop `HadalBioHorrors` from trampling chassis speeds.
2. **BUG-01 & BUG-09 & BUG-14**: Enforce explicit canvas boundary clamping $[0, \text{canvasWidth} - \text{width}]$ in `ModularChassis.applyToPlayer()`, `HydrothermalVent.update()`, and `EndGameCrisis.applyRiftGravity()`.
3. **BUG-02**: Replace the asymmetric `else` snap in `Player.ts:106` with bi-directional signed easing toward `targetY`.
4. **BUG-10**: Pause hydrothermal vent forces and entity displacements during `GameState.SHOP`.
5. **BUG-12**: Introduce a non-zero net ejection vector or timeout release in the central vent overlap zone.
6. **BUG-16**: Guard `frameTime` in `GameManager.loop` against NaN to prevent permanent fixed-timestep freezing.

---

## 5. Verification Method

### 5.1 Playwright Test Suite Verification
Run the existing test suites to confirm current behavior:
```bash
npx playwright test tests/adversarial_buoyancy_ballast_stress.spec.ts
npx playwright test tests/adversarial_buoyancy_modular_overlap.spec.ts
npx playwright test tests/playtest_stream_b_vents_currents.spec.ts
```

### 5.2 Reproduction Test Invalidation Conditions
To independently verify the bugs identified in this report, create a test file `tests/physics_edgecase_streams_a_b.spec.ts` asserting:
1. **BUG-01 Reproduction**: Set player at $x = 562$ with Stingray, switch to Nautilus $\implies$ Assert $x + \text{width} \le 600$. (Currently fails: evaluates to 626).
2. **BUG-04 Reproduction**: Select Stingray ($v = 420$), run `flagshipManager.update(0.016)` $\implies$ Assert `player.speed === 420`. (Currently fails: evaluates to 300).
3. **BUG-09 Reproduction**: Place player at $x = 550, y = 135$ near Right Vent ($x = 420$) erupting $\implies$ Run vent update $\implies$ Assert $x + \text{width} \le 600$. (Currently fails: evaluates to $> 600$).
4. **BUG-10 Reproduction**: Set state to `GameState.SHOP` with player at $y = 600$ inside vent column, run 60 frames of GM loop $\implies$ Assert player remains at $y = 600$. (Currently fails: player is lifted to $y = 130$).
5. **BUG-16 Reproduction**: Invoke `GameManager.loop(NaN)` $\implies$ Assert subsequent calls to `this.update()` still execute. (Currently fails: accumulator is NaN, updates cease permanently).

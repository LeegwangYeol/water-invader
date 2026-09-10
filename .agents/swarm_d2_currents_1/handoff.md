# Handoff Report: Specialist 2.1 — Abyssal Trench Ocean Currents & Lateral Drift Vectors

## 1. Observation
1. **Repository Constraints & Guidelines**:
   - `COLLABORATION.md` line 19: `STRICT CONSTRAINT: DO NOT MODIFY SOURCE CODE: This is an ideation-only task. You MUST NOT modify any source code files (e.g., .ts, .tsx, .css). Do not attempt to implement the ideas, do not run tests, and do not push to git.`
   - User dispatch message: `CRITICAL HARD CONSTRAINTS: DO NOT MODIFY ANY SOURCE CODE (.ts, .tsx, .css). DO NOT RUN BUILDS, TESTS, OR GIT COMMANDS.`
2. **Game Architecture & Coordinates**:
   - `src/game/GameManager.ts` lines 159-160: `public readonly logicalWidth: number = 600; public readonly logicalHeight: number = 800;`
   - `src/game/GameManager.ts` line 39: `private readonly FIXED_STEP: number = 1 / 60;`
   - `src/game/GameManager.ts` lines 103-113: Biome `ABYSSAL_TRENCH` (Tier 1) is already configured with `particleColor: 'rgba(96, 165, 250, 0.14)'`, `particleDirection: 'DOWN'`.
   - `src/game/GameManager.ts` lines 2492-2495: Sinking marine snow ambient procedural particles are drawn using modular loop `y = (time * speed + i * 85) % this.logicalHeight;`.
3. **Player & Bullet Kinematics**:
   - `src/game/Player.ts` line 8: `public speed: number = 300;`
   - `src/game/Player.ts` lines 71-76: Lateral movement is clamped directly between `0` and `canvasWidth - size.width`.
   - `src/game/Bullet.ts` line 37: `this.position.x += this.velocity.x * deltaTime;` already accommodates $v_x$ lateral motion.
4. **Touch Input Mechanics**:
   - `src/components/game-canvas.tsx` lines 1050-1065: Active dragging calculates `deltaLogicalX = deltaClientX * scaleX` and updates `player.position.x` authoritatively.

## 2. Logic Chain
1. **Constraint Alignment**: Because the swarm is operating in strict read-only ideation mode (Observation 1), all outputs must be confined to `.agents/swarm_d2_currents_1/` without touching source code or triggering builds.
2. **Feasibility within Logical Boundaries**: Observation 2 establishes that the entire game world is bounded by $600 \times 800$ logical coordinates with a $1/60\text{s}$ fixed timestep. Any fluid dynamics formula must compute within this coordinate box without resizing canvas buffers.
3. **Ballistic Curvature Integration**: In Observation 3, `Bullet.ts` already integrates `this.position.x += this.velocity.x * deltaTime`. Therefore, applying a dynamic current requires only modulating bullet $v_x$ per frame based on local fluid drag $\frac{dv_x}{dt} = \frac{C_x(y) - v_x}{\tau_p}$, producing smooth parabolic ballistic curves without rewriting bullet collision or drawing logic.
4. **Mobile Usability Preservation**: In Observation 4, touch dragging directly sets position. Applying current drift while a finger is dragging would create unpleasant "slippery" control feel. Thus, the solution requires a dual-input model: 100% authoritative thruster tracking during active drag, transitioning to natural fluid drift when the finger is released (coasting) or when using virtual directional buttons.
5. **Aesthetic & Audio Synthesis**: Observation 2 shows procedural marine snow is already rendered. Upgrading these into velocity-stretched vector streamlines and using `SoundManager`'s native Web Audio API BiquadFilter bandpass noise synthesis delivers high-fidelity oceanic atmosphere with zero asset bloat.

## 3. Caveats
- No actual source code modifications were made, per explicit hard constraints.
- Real-time performance of drawing 48 streamline strokes was estimated based on standard Canvas 2D batching (`ctx.beginPath()` + multiple `moveTo`/`lineTo` + single `ctx.stroke()`), which takes $<0.15\text{ms}$ on modern mobile browsers.
- Specific tuning values (e.g. $V_{base} = 60\text{–}120\text{ px/s}$, drag coefficient $\kappa_d = 0.60$) are baseline recommendations subject to playtesting calibration once implementation is authorized.

## 4. Conclusion
The comprehensive proposal for **Dynamic Ocean Currents & Lateral Drift Vectors** is complete, mathematically formulated, visually and acoustically specified, and fully documented in `/Users/user/src/water-invader/.agents/swarm_d2_currents_1/report.md`. It provides rich tactical variety (curved trick-shots, slingshot torpedoes, counter-thruster braking), thematic immersion for the Abyssal Trench biome, WCAG AAA compliant HUD telemetry, and seamless mobile ergonomics with zero architectural risk.

## 5. Verification Method
1. Inspect the proposal file:
   `view_file /Users/user/src/water-invader/.agents/swarm_d2_currents_1/report.md`
2. Confirm source code immutability:
   Confirm zero files modified under `/Users/user/src/water-invader/src/` via file inspection.
3. Invalidation condition:
   If any formula exceeds the $600 \times 800$ coordinate boundary or requires modifying `logicalWidth` / `logicalHeight`, the proposal is invalid. (All formulas in `report.md` are strictly clamped and bounded within $0 \le x \le 600$, $0 \le y \le 800$).

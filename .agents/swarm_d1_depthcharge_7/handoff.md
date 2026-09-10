# Handoff Report — Specialist 1.7 (Sub-surface Depth Charge Barrage & Geyser Eruptions)

**Agent ID**: Specialist 1.7  
**Working Directory**: `/Users/user/src/water-invader/.agents/swarm_d1_depthcharge_7/`  
**Parent Agent**: `parent` (`8b89e85c-18d5-413c-8630-b672c8d75bba`)  
**Task**: Brainstorming Feature Proposal for Sub-surface Depth Charges and Geyser Eruptions  
**Deliverable**: `/Users/user/src/water-invader/.agents/swarm_d1_depthcharge_7/report.md`

---

## 1. Observation

1. **System Constraints & Instructions**:
   - `ORIGINAL_REQUEST.md` (lines 336-339): "STRICT CONSTRAINT: DO NOT MODIFY SOURCE CODE: This is an ideation-only task. You MUST NOT modify any source code files (e.g., .ts, .tsx, .css). Do not attempt to implement the ideas, do not run tests, and do not push to git."
   - Dispatch task requirements:
     - 1. Concept & Hook (launching timed explosive canisters upward that detonate at specific screen depths, triggering seabed geysers)
     - 2. Mechanics & Math (adjustable fuse depth, vertical splash damage cylinder, water column lifting enemies)
     - 3. Tactical Loop (anticipating enemy descent speed, timing multi-charge synchronized detonations)
     - 4. Visuals & SFX (deep bubbling detonation, massive vertical boiling water column, concussive bass)
     - 5. UI Fuse Depth Dial on HUD
     - 6. Synergies with Barricades & Feasibility
2. **Game Architecture Observations**:
   - `src/game/GameManager.ts`:
     - Line 159: `public readonly logicalWidth: number = 600;`
     - Line 160: `public readonly logicalHeight: number = 800;`
     - Lines 393-396: Barricade layout sits at `y = this.logicalHeight - 150` ($Y=650$), with 4 barricades horizontally spaced with `padding = 150`, starting at `startX = (600 - (3 * 150 + 60)) / 2 = 45`.
     - Lines 13: `HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400];` — shows economy pricing baseline for weapon upgrades.
   - `src/game/Player.ts`:
     - Line 43: Player initialized at `(canvasWidth / 2 - 25, canvasHeight - 60, 50, 40)`, placing benthic submarine craft at $Y=740$.
     - Line 8: `speed: number = 300;` px/sec.
   - `src/game/Barricade.ts`:
     - Lines 13-16: Voxel grid structure: `cols = 6; rows = 4; blocks: boolean[]; maxHp = 20`.
     - Line 23: Destructible ice barricades (`#38bdf8`) and indestructible stone barricades (`#94a3b8`).
   - `src/game/Enemy.ts`:
     - Line 25: Enemy types include `NORMAL`, `ZIGZAG`, `DIVER`, `SNIPER`, `SHIELDED`, `SABOTEUR`, `ROGUE_STALKER`, `ROGUE_MECH`, `BOSS`.
     - Lines 26-27: Saboteurs feature `isGnawing: boolean` targeting barricades.
     - Line 42: `shieldHp: number` blocks frontal damage.
   - `src/game/SoundManager.ts`:
     - Lines 28-82: Real-time procedural audio synthesis using native `AudioContext`, custom oscillators (square, sawtooth, sine), exponential gain envelopes, and biquad filters without external audio assets.

---

## 2. Logic Chain

1. **Grounded Mechanical Scaling (Connecting Obs 1 & 2)**:
   - Given logical dimensions of $600 \times 800$, player altitude $Y=740$, and enemy presence across $Y \in [100, 650]$, the depth charge fuse range was precisely bounded within $Y_{\text{fuse}} \in [120, 680]$ (with a baseline default of $380 \text{ px}$).
   - Applying hydrodynamic fluid buoyancy ($a_{\text{buoyancy}} = -140 \text{ px/s}^2$) and drag ($k_{\text{drag}} = 0.0016 \text{ px}^{-1}$), ascent times vary from $0.37 \text{ s}$ (point-blank bunker defense) to $1.83 \text{ s}$ (high-altitude sniper interception), creating an organic timing puzzle for players.
2. **Cavitation & Geyser Two-Stage Design (Connecting Obs 1 & 2)**:
   - Primary Cavitation Blast ($R_{\text{blast}} = 75 \text{ px}$, $45 \text{ HP}$ core damage) expands isotropically, striking shielded enemies from behind and bypassing frontal `shieldHp`.
   - Secondary Geyser Column erupts from seabed floor ($Y=800$) to apex $Y_{\text{top}}$, exerting upward buoyant lift force ($F_{\text{lift}} = 520 \text{ px/s}^2$) modulated by enemy mass ($M_{\text{enemy}}$), arresting dives from `DIVER` crabs and knocking back `SABOTEUR` gnawers.
3. **Barricade & Projectile Interception Synergy (Connecting Obs 2)**:
   - Canisters ascend with `ignoreBarricades = true`, allowing firing from full cover behind bunkers ($Y=650$).
   - The geyser stream ($W_{\text{geyser}} = 56 \text{ px}$) actively vaporizes incoming enemy projectiles and accelerates adjacent ice barricade voxel crystallization (+50% repair speed when Repair Bots are active).
4. **Procedural Web Audio Specification (Connecting Obs 2)**:
   - To match `SoundManager.ts`, 3 concrete synthesis routines (`playDepthChargeLaunch`, `playDepthChargeDetonation`, `playGeyserRoar`) were authored using band-pass filtered pink/white noise, sub-bass sawtooth ramps ($65 \text{ Hz} \to 18 \text{ Hz}$), and water-hammer cavitation snaps.
5. **HUD Ergonomics**:
   - Designed a dual-layer HUD: an in-world dashed depth line at $Y = Y_{\text{fuse}}$ and a tactical rotary dial ($64 \text{ px}$ diameter) in the lower right, controllable via mouse wheel, keys `[Q]/[E]`, quick presets `[1]/[2]/[3]`, and touch drag.

---

## 3. Caveats

- **No Implementation Mode**: In strict accordance with user constraints and `COLLABORATION.md`, zero `.ts`, `.tsx`, or `.css` files were modified, and no git or build commands were run.
- **Balancing Tuning During Prototyping**: Lift force ($520 \text{ px/s}^2$) and tick damage ($4 \text{ HP}$ per 0.08s) are mathematically balanced against existing enemy HP pools (e.g. Normal 1-2 HP, Mid-Tier 15-30 HP, Boss 100+ HP), but may warrant slight scaling adjustments based on live playtester feedback.
- **No other caveats**: The proposal is fully self-contained, mathematically consistent, and directly executable.

---

## 4. Conclusion

The feature proposal for **Sub-surface Depth Charge Barrage & Geyser Eruptions** has been successfully produced and documented in `/Users/user/src/water-invader/.agents/swarm_d1_depthcharge_7/report.md`. It fulfills all 6 prompt requirements with complete mathematical specifications, procedural Web Audio snippets, rendering equations, UI/UX control designs, shop progression curves, and barricade synergy models. It introduces meaningful vertical tactical depth without altering core logical constraints.

---

## 5. Verification Method

To independently verify the deliverable:
1. **File Integrity & Existence**:
   - Inspect `/Users/user/src/water-invader/.agents/swarm_d1_depthcharge_7/report.md` via `view_file`.
   - Confirm all 6 core sections + Shop + Architectural blueprint are fully fleshed out.
2. **Hard Constraint Compliance**:
   - Run `git status` or inspect file modification dates across `/Users/user/src/water-invader/src/` to confirm zero source files were modified.
3. **Mathematical Consistency**:
   - Verify coordinate calculations against $W_{\text{logical}} = 600$ and $H_{\text{logical}} = 800$, player position $Y=740$, and barricade plane $Y=650$.

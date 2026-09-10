# Specification Mining Handoff: 12 Flagship Pitch Features & QA Criteria

**Document**: `handoff.md`  
**Agent**: `qa_survey_miner_pitch_1` (`teamwork_preview_spec_miner`)  
**Working Directory**: `/Users/user/src/water-invader/.agents/qa_survey_miner_pitch_1`  
**Target Milestone**: Deep Visual & Interactive QA Playtesting of 12 Flagship Features  
**Timestamp**: 2026-09-10T10:41:30Z  

---

## 1. Observation

### 1.1 Authoritative Specification Source
The primary authoritative specification is `/Users/user/src/water-invader/IDEAS_PITCH.md` (Total Lines: 1399, Total Bytes: 134,100), complemented by the operational directives in `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`, `/Users/user/src/water-invader/COLLABORATION.md`, and the codebase architecture in `/Users/user/src/water-invader/src/game/flagship/`.

Key verbatim passages and architectural constraints observed:
1. **Engine Dimension Invariant (`IDEAS_PITCH.md`, Lines 126–133)**:
   > "Strict Architectural Invariants (`GameManager.ts`): Fixed Logical Coordinate Space: The internal game loop executes within a strict coordinate boundary: logicalWidth = 600 px, logicalHeight = 800 px. All physics formulas, velocities, collision bounds, and particle radii are mathematically normalized to this 600x800 canvas frame."
2. **Procedural Rendering & Audio (`IDEAS_PITCH.md`, Lines 134–138)**:
   > "Procedural Canvas 2D Vector Rendering: Zero external sprite sheets, PNGs, or 3D models... 100% Procedural Web Audio API Synthesis: Zero MP3 or WAV audio downloads... synthesized entirely through procedural audio graphs (`OscillatorNode`, `BiquadFilterNode`, `WaveShaperNode`, `ConvolverNode`)."
3. **Subsystem Architecture (`src/game/flagship/FlagshipManager.ts`, Lines 43–81)**:
   All 12 flagship subsystems are coordinated under `FlagshipManager` with standard lifecycle hooks (`init`, `update`, `drawBackground`, `drawWorld`, `drawForeground`, `handleInput`, `reset`).
4. **Flagship Types & Contracts (`src/game/flagship/types.ts`, Lines 1–697)**:
   Formal TypeScript type definitions, state enumerations, configurations, and interfaces exist for all 12 flagship features, including extended enemy types (14 to 21) and factions (`HADAL_BIO`, `ANCIENT_AUTOMATON`).

---

## 2. Logic Chain

1. **Requirement Mapping**: `ORIGINAL_REQUEST.md` (2026-09-10T10:37:58Z) and `COLLABORATION.md` mandate live QA playtesting, visual inspection, and runtime error verification of all 12 Flagship Features.
2. **Authoritative Feature Identification**: Detailed mechanical definitions, mathematical formulations, numerical parameters, and sensory profiles for all 12 features originate directly from Section 3 of `IDEAS_PITCH.md`.
3. **Extraction Rigor**: For every feature, the exact numerical equations (acceleration, damage curves, heat dissipation, spring stiffness, lux cycles, stat matrices, officer abilities, mutation thresholds, shield deflection, boss phases, DAG nodes, and FFT frequencies) are harvested verbatim.
4. **QA Acceptance Formulation**: Each numerical value, trigger state, and sensory spec is converted into explicit, binary-testable QA Acceptance Criteria for unit testing, Playwright automation, and manual DevTools playtesting.
5. **Secondary Innovation Harvesting**: Per Specification Miner Rule 4, related innovations in Section 4 (Domain 1–6 Innovations) and Section 5 (Emergent Synergies) of `IDEAS_PITCH.md` are also systematically probed and documented in the Features Discovered table.

---

## 3. Deep Feature Specifications & QA Acceptance Criteria

### Feature 1: The Cavitation Torpedo & Pressure Implosion Ordnance
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 144–218 (`swarm_d1_cavitation_1`); `src/game/flagship/weapons/CavitationTorpedo.ts`
- **Core Mechanics & State Machine**:
  - `READY` $\to$ `INERT` (first 100 px) $\to$ `ARMED` $\to$ `SINGULARITY` (0.00s–0.08s) $\to$ `SHOCKWAVE` (0.08s–0.35s) $\to$ `EXPIRED`.
  - **Double-Tap Trigger**: Tap 1 launches torpedo from submarine prow ($y = 740$ px); Tap 2 manually detonates torpedo mid-flight.
- **Formulations & Exact Numbers**:
  - Kinematics: $\vec{v}(t) = \min(v_{\max}, v_0 + a_{\text{cav}} \cdot t) \cdot \hat{u}$, where $v_0 = 180$ px/s, $a_{\text{cav}} = 420$ px/s², $v_{\max} = 580$ px/s.
  - Arming Safety Distance: $d_{\text{arm}} = 100$ px. Collision while $d < 100$ px deals 15 blunt damage without detonating.
  - Phase 1 Singularity (0.00s–0.08s, 5 frames): Radius $R_{\text{pull}} = 140$ px; inward force constant $G \cdot M = 85,000$ px³/s², softening parameter $\epsilon = 25$ px.
  - Phase 2 Hyperbaric Blast (0.08s–0.35s): Blast radius $R_{\text{blast}} = 150$ px, shockwave expansion velocity $v_{\text{shock}} = 750$ px/s.
  - Damage Formula: $D(r) = D_{\text{core}} \cdot (1 - (r / R_{\text{blast}})^2)^{1.25}$, where $D_{\text{core}} = 120$ (Lv 1) $\to 300$ (Lv 5).
  - Pushback Impulse: $I_0 = 480$ px/s divided by entity mass multiplier ($\mu_{\text{mob}} = 1.0, \mu_{\text{elite}} = 2.2, \mu_{\text{boss}} = 8.0$).
  - Projectile Vaporization: All enemy projectiles within $r \le R_{\text{shock}}(t)$ are instantly destroyed.
  - Barricade Sympathetic Fracture: Detonation $\le 85$ px from player barricade damages 1–4 voxel blocks.
  - Reserves & Cooldown: Base cooldown 4.5s; ammo reserve cap = 3 torpedoes.
- **Controls & Input**: Key `C`, `X`, Right Mouse Button, or Mobile Touch Button ($r = 32$ px, amber flashing).
- **Sensory & Web Audio Specifications**:
  - Visuals: Translucent cyan teardrop envelope (`#06b6d4` to `rgba(56, 189, 248, 0.15)`), 3 micro-cavitation bubbles/frame; black contracting sphere with electric corona on collapse; refractive shockwave ring with chromatic aberration.
  - Audio Launch: Bandpass white noise (320 Hz $\to$ 80 Hz) + rising sine turbine (120 Hz $\to$ 780 Hz).
  - Audio Void Duck: Master gain ducks to $0.05$ and global lowpass ramps to 250 Hz for 50 ms.
  - Audio Sub-Bass Blast: Sawtooth+Sine wave sweeping from 52 Hz $\to$ 18 Hz over 0.38s via soft-clipping `WaveShaperNode` ($k=8$).
- **QA Acceptance Criteria**:
  - [ ] Tap 1 launches torpedo upward along $y$-axis with initial speed 180 px/s accelerating at 420 px/s² up to 580 px/s.
  - [ ] Torpedo traveling $< 100$ px deals 15 blunt damage on enemy contact and does NOT explode.
  - [ ] Tap 2 while in flight immediately triggers detonation sequence.
  - [ ] Detonation Phase 1 pulls enemies and debris within 140 px toward detonation center for exactly 0.08s (5 frames).
  - [ ] Master audio ducks to 0.05 gain and 250 Hz cutoff during the 50 ms singularity phase.
  - [ ] Detonation Phase 2 expands shockwave ring to 150 px at 750 px/s, dealing 120–300 damage scaled quadratically with distance.
  - [ ] 100% of enemy bullets within shockwave radius are vaporized upon contact.
  - [ ] Detonations within 85 px of player barricades damage 1 to 4 voxel blocks.
  - [ ] Sub-bass thud (52 Hz $\to$ 18 Hz) triggers synchronously with blast expansion.

---

### Feature 2: Bioluminescent Laser Array & Refraction Prisms
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 219–288 (`swarm_d1_biolaser_2`); `src/game/flagship/weapons/BioluminescentLaser.ts`, `RefractionPrism.ts`
- **Core Mechanics & State Machine**:
  - Continuous raycast delivering ticks at 20 Hz (50 ms interval).
  - Heat Zone State Machine: `COOL` (0–49 HU) $\to$ `WARM` (50–79 HU) $\to$ `SUPERCHARGED` (80–99 HU) $\to$ `LOCKOUT` (100 HU).
- **Formulations & Exact Numbers**:
  - Raycast Damage: $0.8$ dmg/tick (Lv 1) $\to 2.4$ dmg/tick (Lv 5); effective DPS = $16.0 \to 48.0$ DPS.
  - Overheat Accumulation: $dH/dt = +30.0 - K_{\text{cool}} = +26.0$ HU/s when firing ($K_{\text{cool}} = 4.0$ HU/s).
  - Natural Cooling: $dH/dt = -25.0 \times \mu_{\text{state}}$ HU/s when idle.
  - Supercharged Sweet Spot (80–99 HU): **+25% bonus DPS**; beam core renders incandescent gold-cyan.
  - Thermal Lockout (100 HU): 2.2s emergency steam venting lockout; $-15\%$ ship movement speed penalty; firing disabled.
  - Refraction Prisms: Hexagonal quartz crystal ($24 \times 24$ px) hovering at $y = 360$ px; 12s cooldown; max 3 charges (`[◆ ◆ ◇]`).
  - Prism Splitting Ratios: Center beam $70\%$ power ($0^\circ$), Left beam $60\%$ power ($-35^\circ$), Right beam $60\%$ power ($+35^\circ$); cumulative output = **$190\%$ damage**.
  - Level 5 Pentagonal Split: 5 beams ($-50^\circ, -25^\circ, 0^\circ, +25^\circ, +50^\circ$) covering $85\%$ of canvas.
  - Silicate Barricade Interaction: Firing into barricades does not damage them; refracts beam at $120\%$ total efficiency.
  - Hydrothermal Vent Synergy: Outer convection halo triples cooling ($+250\%$ dissipation), preventing lockout.
- **Controls & Input**: Key `Spacebar`, Hold Left Mouse Button, or Mobile Fire Touch Button. Prism deploy on Key `V` / Touch.
- **Sensory & Web Audio Specifications**:
  - Visuals: Multi-layered beam with 4px $\to$ 10px white core, 28px outer cyan bloom (`#00f0ff`), caustic ripples, micro-steam bubbles. Lockout generates expanding white steam cloud.
  - Audio: Dual triangle + sawtooth oscillator at 440 Hz modulating upward with 6 Hz pitch vibrato. Lockout triggers 1.2 kHz high-pass filtered white noise steam burst.
- **QA Acceptance Criteria**:
  - [ ] Holding fire emits continuous instantaneous raycast dealing damage every 50 ms.
  - [ ] Heat gauge increases linearly by ~26 HU/s while firing and decreases by ~25 HU/s when idle.
  - [ ] When heat is between 80 and 99 HU, beam damage is increased by exactly +25% and color shifts to gold-cyan.
  - [ ] Hitting 100 HU immediately triggers 2.2s lockout with white steam burst, -15% speed, and firing lockout.
  - [ ] Primary beam striking a Refraction Prism splits into 3 beams (angles -35°, 0°, +35°) with damage ratios 0.6 / 0.7 / 0.6.
  - [ ] Primary beam striking barricade voxels causes non-destructive refraction at 1.2x total power.
  - [ ] Ship inside hydrothermal vent halo has cooling rate boosted by +250%, maintaining continuous fire.

---

### Feature 3: Hydraulic Harpoon Tether & Kinetic Slingshot
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 289–353 (`swarm_d1_harpoon_6`); `src/game/flagship/weapons/HydraulicHarpoon.ts`
- **Core Mechanics & State Machine**:
  - `READY` $\to$ `FLYING` $\to$ `TETHERED` $\to$ `RETRACTING` (Winching) $\to$ `SLINGSHOT_RELEASE` $\to$ `READY`.
- **Formulations & Exact Numbers**:
  - Spring-Constraint Physics: Rest length $L_0 = 110$ px, maximum elastic length $L_{\max} = 420$ px.
  - Elastic Constant: $k_s = 95.0$ N/px, damping coefficient $c_d = 8.5$ N·s/px.
  - Elastic Force Formula: $F_{\text{elastic}} = k_s \cdot (L - L_0) \cdot [1 + 3.2 ((L - L_0)/(L_{\max} - L_0))^2]$.
  - Tension Vector: $\mathbf{F}_{\text{tension}} = -\max(0, F_{\text{elastic}} + c_d (\mathbf{v}_{\text{rel}} \cdot \hat{\mathbf{u}})) \hat{\mathbf{u}}$.
  - Hydraulic Winch Retraction: Reeling speed $v_{\text{winch}} = 240$ px/s down to minimum length $L_{\min} = 65$ px.
  - Harpoon Velocity: Launch speed $v_{\text{launch}} = 650$ px/s, retraction speed $v_{\text{retract}} = 550$ px/s.
  - Centripetal Whip & Wrecking Ball: Tangential speed $v_t = |\omega| \cdot L(t) > 900$ px/s. Collision damage $D = \frac{1}{2} m v_t^2$ (60–140 dmg).
  - Kinetic Slingshot Release: Releasing winch at peak strain flings impaled enemy upward with velocity boost $+720$ px/s, dealing 180 piercing impact damage.
  - Living Meat-Shield: Tethered enemy absorbs hostile bullets in front of player.
- **Controls & Input**: Key `Shift` or dedicated Winch Key / Touch Icon (Hold to reel, release at strain for slingshot).
- **Sensory & Web Audio Specifications**:
  - Visuals: 12-node Verlet physics cable; strain colors: cyan (`#06b6d4`, $<0.5$), amber (`#f59e0b`, $0.5\text{–}0.8$), vibrating crimson (`#ef4444`, $>0.8$).
  - Audio: FM sawtooth high-tension wire creak with pitch spike on release; pneumatic launch hiss; resonant metallic impact thud.
- **QA Acceptance Criteria**:
  - [ ] Harpoon launches at 650 px/s and attaches upon colliding with an enemy within 420 px.
  - [ ] Once attached, tether acts as a damped spring constraint pulling enemy towards player.
  - [ ] Holding winch key reels cable in at 240 px/s down to 65 px minimum distance.
  - [ ] Moving laterally whips the tethered enemy into other enemies, inflicting 60–140 collision damage.
  - [ ] Tethered enemy blocks incoming enemy projectiles, preserving player HP.
  - [ ] Releasing winch at high strain flings enemy forward with +720 px/s velocity boost, dealing 180 damage to enemies pierced.
  - [ ] Cable color dynamically shifts cyan $\to$ amber $\to$ crimson based on current strain ratio ($L / L_{\max}$).

---

### Feature 4: Hydrothermal Vents & Deep Ocean Currents
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 354–422 (`swarm_d2_thermalvents_2`, `swarm_d2_currents_1`); `src/game/flagship/environment/HydrothermalVent.ts`, `OceanCurrent.ts`
- **Core Mechanics & Geometry**:
  - Anchor at seabed $y_{\text{vent}} = 760$ px (aperture width 44 px); chimney rises to dissipation cap $y_{\text{cap}} = 100$ px.
  - Radius Formulas: $R_{\text{core}}(y) = 22 + (760 - y) \cdot 0.08$; $R_{\text{halo}}(y) = R_{\text{core}}(y) \cdot 1.85$.
  - Thermal Core Profile: $T_{\text{core}} = 380^\circ$C, $T_{\text{ambient}} = 2^\circ$C.
- **Formulations & Exact Numbers**:
  - Core Damage to Player: 0.50s grace buffer; lingering in core inflicts 1 HP per 1.25s.
  - Core Damage to Hostiles: $\text{DPS}_{\text{enemy}} = 28 + 0.06 \cdot \text{MaxHP}_{\text{enemy}}$; common mobs vaporize in 0.05s; boss shield regen suppressed and takes up to 45 DPS.
  - Updraft Velocity: $\vec{u}(y) = -360 \cdot \sqrt{y / 800}$ px/s. Lifts submarine at $+160$ px/s.
  - Steam Lance Transformation: Player bullets entering core gain $+35\%$ damage, $+1$ piercing level, and speed boosted to $-680$ px/s.
  - Hostile Projectile Dissolution: Descending enemy bullets enter counter-buoyancy ($a_y = -520$ px/s²) and dissolve into bubbles within 0.35s.
  - Convective Cooling Halo: Outer halo ($R_{\text{core}} < r \le R_{\text{halo}}$) accelerates weapon heat dissipation by **$+250\%$**.
  - Ocean Currents & Stratified Shear: Upper shelf ($y < 400$) drifts East at $+75$ px/s; lower shelf ($y \ge 400$) drifts West at $-60$ px/s. Drag acceleration $a_x = \frac{1}{2} C_d \rho A (v_{\text{current}} - v_x)^2$.
  - Mineral Nodules: Vent eruptions periodically spawn mineral nodules drifting up (worth $+15$ Pure Water).
- **Sensory & Web Audio Specifications**:
  - Visuals: Rising black sulfide mineral particulates, luminous steam bubbles, sinusoidal canvas refractive heat shimmer overlay.
  - Audio: Brownian noise through dual resonant lowpass filters (120 Hz and 240 Hz, $Q = 4.0$) with periodic bubbling pops.
- **QA Acceptance Criteria**:
  - [ ] Vent spawns at seabed ($y = 760$) and extends expanding conical plume up to $y = 100$.
  - [ ] Player standing inside core takes 1 HP damage every 1.25s after an initial 0.5s grace window.
  - [ ] Enemies inside core take $28 + 0.06 \times \text{MaxHP}$ DPS; common mobs die almost instantly.
  - [ ] Player bullets traversing core convert to Steam Lances (+35% damage, +1 pierce, speed -680 px/s).
  - [ ] Enemy bullets entering core decelerate ($a_y = -520$ px/s²) and despawn within 0.35s.
  - [ ] Player in outer halo gains +160 px/s buoyant lift and +250% laser cooling rate.
  - [ ] Ocean current applies distinct $+75$ px/s East drift above $y=400$ and $-60$ px/s West drift below $y=400$.

---

### Feature 5: Deep Biolapse & Dynamic Bioluminescent Darkness Cycles
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 423–505 (`swarm_d2_darknesscycle_6`); `src/game/flagship/environment/BiolapseDarknessCycle.ts`
- **Core Mechanics & State Machine**:
  - 4-Phase State Machine:
    1. `DIURNAL` (60.0s): Ambient Lux $L = 1.0$. Full normal visibility.
    2. `TWILIGHT` (5.0s): $L(t) = 1.0 - (t / 5.0)$. Muffled warning ping sounds.
    3. `MIDNIGHT` (25.0s): $L = 0.0$. Total pitch black (`#030712`). Headlight and bioluminescent organs only.
    4. `DAWN` (5.0s): $L(t) = t / 5.0$. Light returns, ending darkness state.
    - Total cycle period = exactly 95.0 seconds.
- **Formulations & Exact Numbers**:
  - Headlight Dynamic Tilt: $\theta_{\text{beam}} = -90^\circ + (v_x / v_{\max}) \times 15^\circ$ ($\pm 15^\circ$ cone steering).
  - Beam Angle: $\phi = 28^\circ$ (Normal) $\to 38^\circ$ (High-Beam Overdrive).
  - Illumination Range: $R_{\text{beam}}(B) = 440 \times (0.35 + 0.65 \times B / 100)$ px ($440$ px at $100\%$ battery, $154$ px at $0\%$ battery).
  - Battery Capacity & Drain:
    - Normal Light ON: $-4.0$ units/s ($25.0$ s total continuous life).
    - High-Beam Overdrive: $-10.0$ units/s ($10.0$ s total life).
    - Light OFF (Kinetic Dynamo): $+3.0$ units/s while moving, $+1.2$ units/s while stationary.
    - Phosphor Pickup: Slain glowing enemies drop crystals restoring $+15.0$ Battery Units.
  - Predator Ambush & Photonic Stun:
    - Unlit enemies move $+35\%$ faster and cannot be acquired by Homing Missiles.
    - Sweeping headlight over unlit enemy inflicts **Photonic Flash Shock**: stunned for $0.8$ s and takes $+25\%$ vulnerability damage.
- **Controls & Input**: Key `F` or Double-Tap / Touch Button (Toggle light ON/OFF; Hold for High-Beam).
- **Sensory & Web Audio Specifications**:
  - Visuals: Fullscreen darkness composite layer using Canvas `destination-out` for soft gradient cone. Unlit enemies render glowing eye photophores (`#ef4444`, `#facc15`). Barricades cast soft geometric shadows.
  - Audio: Heavy mechanical relay switch click on toggle; 55 Hz electrical drone hum while light is ON; 4.8 kHz capacitor whine during Overdrive.
- **QA Acceptance Criteria**:
  - [ ] Darkness cycle follows exact 60s $\to$ 5s $\to$ 25s $\to$ 5s timing (95s full loop).
  - [ ] In Midnight phase, canvas is covered by #030712 darkness; only headlight cone and photophores are visible.
  - [ ] Moving left tilts headlight cone $-15^\circ$; moving right tilts cone $+15^\circ$.
  - [ ] Battery drains at 4.0 u/s (normal) and 10.0 u/s (high-beam); turns off when empty; recharges when light is OFF.
  - [ ] Sweeping headlight beam across an unlit enemy stuns it for exactly 0.8s and increases damage taken by +25%.
  - [ ] Homing missiles refuse target lock on enemies in the dark until headlight illuminates them.

---

### Feature 6: Submersible Modular Chassis & Deep-Sea Hangar
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 506–590 (`swarm_d3_hullchassis_1`); `src/game/flagship/progression/ModularChassis.ts`, `ChassisRadarChart.ts`
- **Core Mechanics & 6-Axis Radar**:
  - Radar axes: Speed ($S$), Armor/HP ($A$), Hardpoints ($H$), Energy/Cooldown ($E$), Hitbox Profile ($B$), Salvage/Economy ($C$).
  - Accessible via Pre-Wave 1 Lobby and Continue Shop screens.
- **Formulations & Chassis Roster**:
  1. **Nautilus Dreadnought (Juggernaut Tank)**:
     - HP: $7$ HP (Base 5 + 2). Speed: $220$ px/s ($-26.7\%$). Hitbox: $64 \times 46$ px.
     - Flat armor: $-1$ damage from common mobs. Dual broadside hardpoints.
     - Passive (*Aegis Bulkhead*): At $\le 2$ HP, releases steam shockwave clearing bullets within $120$ px and grants $1.5$ s invulnerability ($60$ s CD).
  2. **Stingray Interceptor (Glass Cannon)**:
     - HP: $3$ HP ($-2$ HP). Speed: $420$ px/s ($+40\%$). Hitbox: $38 \times 30$ px ($-43\%$ area).
     - Fire rate scaling $+25\%$.
     - Passive (*Cavitation Slipstream*): Lateral movement charges overdrive bar; at $100\%$ charge, firing unleashes a piercing cavitation lance with $0.5$ s i-frames.
  3. **Leviathan Harvester (Economy Bruiser)**:
     - HP: $6$ HP. Speed: $270$ px/s. Hitbox: $54 \times 42$ px.
     - Full-screen Pure Water magnetosphere; $+35\%$ currency from mobs, $+50\%$ from elites/bosses.
     - Passive (*Pure Water Condenser*): Every $100$ Water collected restores $+1$ HP or empowers next 3 shots with explosive hydro-splash.
  4. **Ghost Stealth Sub (Ambush/Phasing)**:
     - HP: $4$ HP. Speed: $320$ px/s. Hitbox: $46 \times 34$ px.
     - Invulnerability duration extended to $2.2$ s (base 1.0s). Snipers suffer $40\%$ tracking delay.
     - Passive (*Sonar Cloak*): Ceasing fire for $1.5$ s activates $70\%$ translucent cloak; exiting cloak deals $300\%$ crit damage with homing sonic wave.
  5. **Kraken Bioship (Organic Symbiont)**:
     - HP: $5$ HP. Speed: $240\text{–}360$ px/s pulsating. Hitbox: $50 \times 40$ px.
     - Natural immunity to Acid Rain and Toxic Blooms (saves 150 Water). Regenerates $+1$ HP every $25$ s out of combat.
     - Passive (*Tentacle Sweep & Ink*): Autonomous tentacles whip within $90$ px; taking damage drops ink cloud slowing enemy bullets by $60\%$.
- **Sensory & Web Audio Specifications**:
  - Visuals: Procedural vector silhouettes with animated thrusters, bubble wakes, rotating turrets, and bio-chitin. Interactive Hexagonal Radar Chart in Hangar.
  - Audio: Nautilus (deep diesel hum), Stingray (electric turbine whine), Leviathan (hydro-scoop churn), Ghost (quiet phase hum), Kraken (organic wet pulse).
- **QA Acceptance Criteria**:
  - [ ] Hangar UI allows selecting between all 5 chassis in pre-game and continue shop.
  - [ ] Selecting Nautilus sets HP to 7, speed to 220 px/s, hitbox to 64x46, and triggers Aegis Bulkhead at $\le 2$ HP.
  - [ ] Selecting Stingray sets HP to 3, speed to 420 px/s, hitbox to 38x30, and charges Slipstream on movement.
  - [ ] Selecting Leviathan pulls water drops from anywhere on screen and heals +1 HP every 100 water collected.
  - [ ] Selecting Ghost triggers 70% opacity cloak after 1.5s idle, granting 300% crit on next attack.
  - [ ] Selecting Kraken provides acid damage immunity, passive 25s out-of-combat healing, and tentacle defense.
  - [ ] Animated hexagonal radar chart updates dynamically to reflect the selected chassis's stats.

---

### Feature 7: Veteran Crew Officer Synergy Deck & Active Bridge Abilities
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 591–662 (`swarm_d3_crewsynergy_2`); `src/game/flagship/progression/CrewOfficerDeck.ts`
- **Core Mechanics & Officer Roster**:
  - 4 Bridge Officers:
    1. **Chief Engineer Ingrid "Anvil" Vane (Engineering, Gold `#f59e0b`)**:
       - Passives: Max HP $+1$, collision damage taken $-30\%$; restores $25\%$ HP to all barricades at wave start; destroyed barricades emit $100$ px bullet-clearing shockwave; if stress $>50$, speed $+20\%$ and regenerates $1$ HP / $25$ s.
       - Active `[1] / Q`: **Emergency SCRAM Purge** ($35$ s CD) — Cleanses debuffs, grants $1$ HP temp shield, emits $300$ px knockback wave.
    2. **Master Gunner Jax Callahan (Gunnery, Crimson `#ef4444`)**:
       - Passives: Bullet velocity $+25\%$, fire rate interval $-12\%$; homing missiles deal $+35\%$ damage ($3\times$ boss target weight); every 4th shot becomes a Hyper-Kinetic Slug with $+3$ pierce and $2.0\times$ damage.
       - Active `[2] / E`: **Titan Cavitation Salvo** ($28$ s CD) — Fires $12$ super-cavitating torpedoes in a $180^\circ$ forward fan.
    3. **Hydro-Acoustic Specialist Ren Thorne (Sonar, Emerald `#10b981`)**:
       - Passives: $18\%$ chance on hit to mark enemy for $6.0$ s ($+30\%$ crit damage taken); projectiles within $40$ px grant $+15\%$ speed for $0.6$ s; crisis warnings appear $3.0$ s earlier; hazard spawn frequency $-20\%$.
       - Active `[3] / R`: **Hydro-Acoustic Stasis** ($32$ s CD) — Slows enemy bullets by $70\%$ for $5.0$ s, highlights weak points for $100\%$ crits.
    4. **Dr. Lyra Vance (Xenobiology, Cyan `#06b6d4`)**:
       - Passives: Kills within $150$ px drop Bio-Nutrient Pearls ($+10$ Water, $-5\%$ Stress); acid rain damage reduced by $60\%$ (shield absorption grants $+1$ Water); missiles/slugs apply $35\%$ slow to enemy movement/attacks for $4.0$ s.
       - Active `[4] / F`: **Bioluminescent Decoy Pod** ($30$ s CD) — Deploys $120$ HP decoy pod attracting $75\%$ enemy fire for $6.0$ s.
  - Dual-Officer Resonances:
    - **Steam & Thunder (Ingrid + Jax)**: Barricade repairs automatically fire 4 steam missiles at nearest enemies.
    - **Acoustic Biosynthesis (Ren + Lyra)**: Critical hits on acoustically tagged enemies grant $5\%$ lifesteal.
- **Controls & Input**: Hotkeys `1`/`2`/`3`/`4` or `Q`/`E`/`R`/`F`, or HUD touch circular buttons.
- **Sensory & Web Audio Specifications**:
  - Visuals: Diegetic portrait widgets on top-left HUD; ability trigger flashes screen with officer's signature color and tactical banner.
  - Audio: Filtered pink noise radio transmission crunch + square-wave squelch tone, followed by signature sound.
- **QA Acceptance Criteria**:
  - [ ] Officers can be assigned to bridge stations in Pre-Wave and Continue Shop menus.
  - [ ] Triggering Q (SCRAM Purge) gives 1 HP shield and 300 px knockback wave with 35s cooldown.
  - [ ] Triggering E (Titan Salvo) fires 12 torpedoes in a 180° fan with 28s cooldown.
  - [ ] Triggering R (Stasis Pulse) slows all enemy bullets by 70% for 5.0s with 32s cooldown.
  - [ ] Triggering F (Decoy Pod) spawns 120 HP decoy pod redirecting 75% enemy bullets for 6.0s with 30s cooldown.
  - [ ] Equipping Ingrid+Jax triggers Steam & Thunder passive on barricade repair.
  - [ ] Equipping Ren+Lyra triggers 5% lifesteal on acoustically tagged critical hits.

---

### Feature 8: Mutating Bio-Horror Faction & Epigenetic Mutation Engine
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 663–733 (`swarm_d4_hadalbio_1`); `src/game/flagship/factions/HadalBioHorrors.ts`, `EpigeneticMutationEngine.ts`
- **Core Mechanics & Enemy Roster**:
  - 4 Hadal Bio-Horror Archetypes:
    1. **Parasite Clinger (*Hadal Hirudinea*)**: Corkscrew dive ($v_x = 160, v_y = 180$ px/s); latches within 45 px; inflicts **-25% speed per clinger** (max 3 = **-75% speed**) and $+20\%$ weapon delay. Counterplay: Wiggle `← → ← →` 4 times within 1.2s shakes off clinger; scraping barricade deals 5 damage.
    2. **Spore Siphoner (*Cystis Siphonophora*)**: Floating bladder ($48 \times 48$ px); projects ingestion vortex ($R = 110$ px) swallowing player bullets; ruptures on non-piercing death into $90\text{–}160$ px corrosive spore cloud (4.5s duration, 1 HP / 0.75s, scrambles missiles).
    3. **Carapace Colossus (*Decapoda Titanus*)**: Heavy crustacean ($80 \times 60$ px) with $140^\circ$ frontal bone shield ($40$ HP) mitigating **85% frontal non-piercing damage**. Rear thorax takes $200\%$ crit damage. Piercing attacks ($\ge 2$) shatter shield and stun for $2.5$ s.
    4. **Abyssal Angler (*Ceratias Occultus*)**: Murky camouflage (`alpha = 0.15`) with lure mimicking $+50$ Water pickup; approaching triggers flashbang setting `suppressionLevel` to 95 (extreme weapon spread).
  - Epigenetic Reactive Mutation Engine:
    - Evaluates 2-wave damage ratios:
      - Kinetic ratio $> 0.50 \implies$ **Diamond-Carapace Hardening** ($+40\%$ armor deflection).
      - Missile ratio $> 0.40 \implies$ **Pheromone Chaff Decoys** ($50\%$ chance missiles lose lock).
      - Pierce ratio $> 0.40 \implies$ **Gelatinous Viscous Flesh** (absorbs multi-penetration without bonus damage).
    - UI banner alerts player upon mutation: `⚠️ HIVE METAMORPHOSIS DETECTED`.
- **Sensory & Web Audio Specifications**:
  - Visuals: Iridescent viridian chitin (`#059669`), pulsating neon bile sacs (`#84cc16`), undulating tentacles.
  - Audio: FM triangle wave organic squelches; 2.4 kHz high-pass white noise chitinous bone shatter.
- **QA Acceptance Criteria**:
  - [ ] Parasite Clinger latches onto player and reduces speed by 25% (up to 75% for 3 clingers).
  - [ ] Alternating Left and Right arrow keys 4 times within 1.2s shakes off all attached clingers.
  - [ ] Spore Siphoner absorbs non-piercing bullets and detonates into corrosive cloud upon death.
  - [ ] Carapace Colossus reduces frontal damage by 85%; rear damage is multiplied by 2.0x; piercing attacks shatter shield and stun for 2.5s.
  - [ ] Approaching Angler lure triggers suppressionLevel 95 weapon inaccuracy.
  - [ ] Exceeding 50% kinetic damage, 40% missile damage, or 40% pierce damage over 2 waves activates corresponding counter-mutation with UI banner.

---

### Feature 9: Ancient Automaton Fleet & Hexagonal Phalanx Shield Grids
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 734–802 (`swarm_d4_ancientmech_2`); `src/game/flagship/factions/AutomatonPhalanx.ts`, `AutomatonShieldGrid.ts`
- **Core Mechanics & Enemy Roster**:
  - 3 Automaton Archetypes:
    1. **Phalanx Aegis Drone (`AutomatonPhalanxDrone`)**:
       - Hull HP: $180 + (\text{Wave} \times 25)$, Shield HP: $220 + (\text{Wave} \times 35)$.
       - Projected Hex-Barrier: Forward $60^\circ$ arc (80 px width) granting **100% frontal deflection** against non-piercing bullets.
       - Resonant Coupling: Linked within 160 px into a shared shield wall with visible runic conduits.
       - Harmonic Damage Dampening: Frontal damage shared across linked units and dampened by **40%**: $D_{\text{drone}} = (D_{\text{incoming}} \cdot 0.60) / N_{\text{linked}}$.
       - Inductive Backlash: Depleting shared shield triggers electromagnetic surge stunning all linked drones for $3.5$ s and dealing $35\%$ Max HP true damage.
    2. **EMP Disruption Prowler (`AutomatonEmpProwler`)**:
       - Sinusoidal strafing ($v_x = 110$ px/s, amplitude 90 px).
       - Ventral EMP Nova: Discharges EMP ring ($R = 240$ px) every 7.5s (1.2s charge). Reduces player fire rate by $-50\%$ for 3.0s and halts barricade auto-repair for 4.0s.
       - Grid Battery Link: Accelerates linked Aegis shield regen by $+100\%$ ($15$ SHP/s).
    3. **Rail-Mortar Sentinel (`AutomatonRailSentinel`)**:
       - Quadruped bronze platform ($64 \times 46$ px).
       - Lockdown Rail-Mortar: Locks for 1.8s, fires copper slug ($v = 450$ px/s) piercing barricades and leaving electric puddle ($80$ px diameter, $12$ DPS for $2.5$ s).
       - Cooling Vent Vulnerability: Radiators open for $2.4$ s post-fire: attacks deal **300% Critical Damage**.
  - Flanking & Counterplay:
    - Flanking $> 45^\circ$ off-axis bypasses frontal 100% deflection shield.
    - Piercing weapons bypass hex-barrier directly.
- **Sensory & Web Audio Specifications**:
  - Visuals: Faceted dark bronze chassis (`#78350f`) with verdigris patina (`#0d9488`), glowing cyan runic lenses (`#00f0ff`), pulsating hexagonal tessellated barriers.
  - Audio: Metallic barrier deflection clinks; hydraulic piston chuffs; 1.8 kHz electrical arcing during EMP.
- **QA Acceptance Criteria**:
  - [ ] Aegis Drones within 160 px connect via glowing runic conduits into a shared phalanx shield.
  - [ ] Frontal attacks against linked Aegis drones are deflected 100% or dampened by 40% across all linked units.
  - [ ] Flanking attacks (>45° off-axis) and piercing weapons deal direct unmitigated hull damage.
  - [ ] Breaking the shared shield stuns all linked drones for 3.5s and deals 35% Max HP damage.
  - [ ] EMP Prowler pulses 240 px nova every 7.5s, reducing player fire rate by 50% and stopping barricade repair.
  - [ ] Rail-Mortar Sentinel exposes glowing radiator core for 2.4s after firing, taking 300% critical damage.

---

### Feature 10: Multi-Stage Apex Boss: The Kraken Prime / Charybdis Maw
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 803–876 (`swarm_d4_megalodonboss_5`); `src/game/flagship/factions/KrakenPrimeBoss.ts`
- **Core Mechanics & Phase Breakdown**:
  - Total Health Budget: $12,000$ HP ($18,000$ HP on Hard/Crisis), divided into three $4,000$ HP phases. Boss spans top third of canvas ($600$ px width).
  - **Phase 1: Tentacle Ramparts ($4,000$ HP)**:
    - 4 independent articulating tentacles ($1,000$ HP each). Main boss hull is $100\%$ invulnerable while any tentacle is alive.
    - Active Missile Swat: Tentacles swat incoming homing missiles within 70 px (rapid fire induces 1.2s fatigue).
    - Seismic Barricade Pulverizer: Tentacle elevates with 1.8s amber telegraph, then slams downward destroying $10\text{–}14$ voxel blocks in that column.
    - Severing a tentacle awards $+150$ Pure Water and clears a permanent firing lane.
  - **Phase 2: Charybdis Maw ($4,000$ HP)**:
    - Counter-rotating serrated teeth gullet opens.
    - Hydrodynamic Inhalation Vortex: Upward suction pulls player toward maw at $v_{\text{pull}} = 220$ px/s ($F_{\text{pull}}(y) = F_{\max} \cdot ((800-y)/800)^{1.5}$).
    - Player must use reverse thrusters while dodging teeth shrapnel.
    - Shooting directly into open gullet deals **2.5x Critical Weakpoint Damage**.
    - Harpoon tethering anchors sub against suction; Cavitation torpedo detonated inside gullet inflicts 2.5s concussion stun.
  - **Phase 3: Abyssal Rage ($4,000$ HP)**:
    - Bioluminescent Ink Blackout: Discharges ink clouds, reducing canvas ambient light to zero.
    - Screen-Crossing Breach Charge: Charges across canvas at $750$ px/s with audio and glowing eye telegraphs.
    - Enrage Timer: $45.0$ s countdown before screen-wiping Hadal Extinction Wave.
- **Sensory & Web Audio Specifications**:
  - Visuals: Procedural 3-segment inverse kinematics for tentacles; rotating spiral tooth vortex; billowing ink particle dissipation.
  - Audio: 30 Hz infrasonic whale growl; 200 Hz $\to$ 1.4 kHz bandpass suction noise; explosive chitin rupture on tentacle sever.
- **QA Acceptance Criteria**:
  - [ ] Boss health bar displays 3 distinct segments of 4,000 HP each.
  - [ ] Phase 1: Boss hull is 100% invulnerable until all 4 tentacles are destroyed; tentacles swat missiles and smash barricades.
  - [ ] Phase 2: Open maw pulls player upward at 220 px/s; shots into gullet deal 2.5x critical damage.
  - [ ] Harpoon tethering anchors player against vortex pull; torpedo inside maw stuns boss for 2.5s.
  - [ ] Phase 3: Ink cloud darkens canvas; boss charges at 750 px/s; 45s enrage timer displays and triggers defeat on expiry.

---

### Feature 11: Endless Descent: Roguelike Abyssal Run Mode
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 877–947 (`swarm_d5_endlessdescent_1`); `src/game/flagship/modes/EndlessDescent.ts`, `BathymetricDAG.ts`, `BoonDraftDeck.ts`
- **Core Mechanics & Bathymetric DAG**:
  - Sequential 2,000-meter Depth Sectors: 1,000m (Twilight), 4,000m (Midnight), 6,000m (Abyssal Plains), 10,000m+ (Hadal Void).
  - Each sector contains $7\text{–}9$ strata with $2\text{–}4$ nodes per row.
  - Node Archetypes: Combat Zone, Elite Incursion, Supply Cache, Sunken Shrine, Hazard Anomaly, Pressure Relief Outpost, Apex Boss Node.
  - Hydrostatic Pressure Engine:
    - Pressure rate: $dP/dt = k_d \cdot (\text{Depth} / 1000)$.
    - At $50\%$ Pressure: Cockpit glass develops micro-fractures; movement speed $-15\%$.
    - At $80\%$ Pressure: Max HP temporarily throttled by $-1$ notch.
    - At $100\%$ Pressure (Critical Strain): Hull leaks $1$ damage every $12$ s until vented.
  - 24-Boon Draft System:
    - Rarity distribution: Common ($60\%$), Rare ($28\%$), Legendary ($9\%$), Abyssal Cursed ($3\%$).
    - Examples:
      - *Vortical Railgun (Legendary)*: $300\%$ damage piercing hydro-lance, $1.2$ s CD.
      - *Emergency Ballast Jettison (Legendary)*: $3.0$ s i-frames on lethal hit, resets pressure to $0\%$, screen depth charge (1 per run).
      - *Leviathan's Maw (Cursed)*: $+150\%$ damage, $-35\%$ speed, $+25\%$ hitbox size.
      - *Abyssal Overcharge (Cursed)*: $+100\%$ fire rate, permanent piercing, $+100\%$ faster pressure accumulation.
- **Sensory & Web Audio Specifications**:
  - Visuals: Monochrome phosphor green sonar map with pulsing blips. Arena turbidity and marine snow multiply with depth.
  - Audio: Deep reverberant sonar echo; FM cluster hull groans (60–90 Hz).
- **QA Acceptance Criteria**:
  - [ ] Endless Descent mode generates valid connected DAG map across 7–9 strata per sector.
  - [ ] Selecting a node loads corresponding wave/encounter parameters.
  - [ ] Hydrostatic pressure increases continuously with depth, triggering speed penalty at 50%, HP throttle at 80%, and leak damage at 100%.
  - [ ] Clearing combat nodes presents 3-card boon draft with correct rarity weighting (60/28/9/3%).
  - [ ] Supply Caches allow welding hull (+2 HP) or venting pressure.
  - [ ] Drafting cursed boons applies specified negative stat tradeoffs.

---

### Feature 12: Tactical Sonar Ping HUD, Hydrophone Spectrogram & Claustrophobic Stress FX
- **Authoritative Source**: `IDEAS_PITCH.md`, Lines 948–1017 (`swarm_d6_sonarhud_1`, `swarm_d6_pressuregauge_2`, `swarm_d6_radarcrt_5`); `src/game/flagship/sensory/TacticalSonarHUD.ts`, `HydrophoneSpectrogram.ts`, `HullStressFX.ts`
- **Core Mechanics & Sensory Suite**:
  - Concentric Polar Sonar Grid:
    - 5 dashed range rings at $R \in \{80, 160, 240, 320, 400\}$ px representing 50m to 250m nautical zones (`rgba(56, 189, 248, 0.12)`).
    - Rotating radial sweep line: $\theta(t) = (1.8 \cdot t) \pmod{2\pi}$ (1 full revolution every $3.5$ s).
    - Echo Bloom: Intersecting enemy hitbox triggers contact flare ($R = 18$ px, alpha $0.85$ decaying over $400$ ms).
  - Acoustic Detonation Wavefronts:
    - Expands on explosions: $R(t) = R_0 + 280 \cdot t^{0.85}$, $\alpha(t) = 0.35 \cdot (1 - t/0.65)^2$, $\text{lineWidth}(t) = W_0 \cdot (1 + 0.5 \cdot t/0.65)$.
  - Hydrophone Spectrogram Waterfall:
    - 16-band real-time spectrum analyzer along bottom HUD border ($40$ Hz to $12$ kHz).
    - Sampled from Web Audio `AnalyserNode.getByteFrequencyData()`.
  - Claustrophobic Hull Stress & Glass Fracture FX:
    - Stress meter $\in [0, 100]$:
      - $\text{Stress} > 50$: Vignetted chromatic aberration and low-frequency hull groans.
      - $\text{Stress} > 75$: Procedural branching glass fracture lines spiderweb across screen corners via recursive midpoint displacement.
      - Taking damage at $\text{Stress} > 80$: Camera micro-shake ($14$ px amplitude, $0.22$ s decay) with cavitation bubble trails.
- **Sensory & Web Audio Specifications**:
  - Visuals: Phosphor green/cyan CRT radar aesthetic with scanlines, range typography, and lens distortion.
  - Audio: Active Sonar Ping = $880$ Hz pure sine pulse with $3.2$ s reverb tail; Doppler shift for approaching/retreating targets; 800 Hz lowpass depth filter.
- **QA Acceptance Criteria**:
  - [ ] Polar sonar HUD renders 5 concentric range rings and radial sweep revolving once every 3.5s.
  - [ ] Sweep line crossing enemies generates distinct echo contact flares.
  - [ ] Explosions spawn expanding acoustic wavefront rings with quadratic alpha dissipation.
  - [ ] Hydrophone spectrogram displays 16 frequency bars driven by live audio output.
  - [ ] Reaching stress $>50$ triggers chromatic aberration; $>75$ generates procedural glass fractures; $>80$ damage triggers 14 px screen shake.
  - [ ] Active sonar ping emits 880 Hz tone with 3.2s reverberation tail.

---

## 4. Features Discovered

In accordance with the Specification Miner procedure, all features—including the 12 Flagship Features, the 30 Deep-Sea Compendium Innovations, and cross-system synergies—are enumerated below:

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Weapons | Cavitation Torpedo | Supercavitating torpedo with double-tap remote detonation, vacuum suction, shockwave blast, and bullet clearing | Key C / X / RMB / Touch (Tap to fire, tap to detonate) | Inert flight (15 dmg), Singularity suction (140px), Shockwave (150px, 120-300 dmg) | Fires only if ammo > 0 and CD ready; inert <100px | `IDEAS_PITCH.md` §3 Feature 1 |
| 2 | Weapons | Bioluminescent Laser & Prisms | Continuous raycast laser with overheat gauge, supercharged zone, and floating refraction prisms | Hold Space / LMB; Deploy prism Key V | 16-48 DPS raycast; +25% DPS at 80-99 HU; 190% damage 3-way prism split | Reaching 100 HU triggers 2.2s Lockout with -15% speed | `IDEAS_PITCH.md` §3 Feature 2 |
| 3 | Weapons | Hydraulic Harpoon & Slingshot | Pneumatic harpoon anchoring enemies with damped spring constraint, winching, whipping, and slingshot eject | Key Shift / Winch Key (Hold to reel, release to sling) | Damped tether pull, 60-140 wrecking ball dmg, +720 px/s 180 dmg slingshot | Breaks if length exceeds 420px max strain | `IDEAS_PITCH.md` §3 Feature 3 |
| 4 | Hazards | Hydrothermal Vents & Currents | Scalding black smoker vents with scalding core, convective cooling halo, updraft, and lateral shear currents | Entity coordinates in vent cone or current stratum | Core DoT (1 HP/1.25s player, 28+6% enemy), steam lance bullets, +250% laser cooling | Clamped to 600x800 logical canvas | `IDEAS_PITCH.md` §3 Feature 4 |
| 5 | Hazards | Biolapse Darkness Cycle | 4-phase daylight/darkness cycle with steerable headlight cone, battery drain, and predator photonic stun | Key F (Toggle / Hold for high-beam); Submarine velocity | 60s/5s/25s/5s cycle, #030712 darkness, 0.8s photonic stun, +25% enemy vuln | Empty battery shrinks beam to 154px emergency cone | `IDEAS_PITCH.md` §3 Feature 5 |
| 6 | Progression | Submersible Modular Chassis | 5 distinct submarine hulls (Nautilus, Stingray, Leviathan, Ghost, Kraken) with 6-axis radar profiles | Selection in Pre-Game Lobby / Continue Shop | Unique HP, speed, hitbox, and passives (Aegis Bulkhead, Slipstream, Condenser, Cloak, Ink) | Clamped to player entity bounds; no logic resizing | `IDEAS_PITCH.md` §3 Feature 6 |
| 7 | Progression | Veteran Crew Synergy Deck | 4 bridge officers (Ingrid, Jax, Ren, Lyra) with passive perks, active bridge commands, and dual resonances | Hotkeys 1-4 / Q, E, R, F / Touch badges | SCRAM Purge (1 HP shield/300px wave), Titan Salvo (12 torps), Stasis (70% slow), Decoy (120 HP) | Active abilities obey individual cooldown timers (28-35s) | `IDEAS_PITCH.md` §3 Feature 7 |
| 8 | Factions | Hadal Bio-Horror Faction | Parasite Clingers, Spore Siphoners, Carapace Colossi, Anglers, and reactive Epigenetic Mutation Engine | Player weapon profile over 2 waves; enemy proximity | Speed reduction (-25%/clinger), bone shield (85% mitig), spore clouds, +40% counter-mutations | Wiggle Left-Right 4x to remove clingers; pierce shatters bone | `IDEAS_PITCH.md` §3 Feature 8 |
| 9 | Factions | Ancient Automaton Phalanx | Aegis Drones, EMP Prowlers, and Rail Sentinels with hexagonal barriers, shared damage, and inductive backlash | Spatial proximity <160px; weapon impact angles | 100% frontal deflection, 40% dampening, 240px EMP pulse, 300% core crit vulnerability | Flanking >45° or pierce bypasses barrier; shield break stuns 3.5s | `IDEAS_PITCH.md` §3 Feature 9 |
| 10 | Bosses | Kraken Prime / Charybdis Maw | 3-phase titan with 4 destructible tentacles, hydrodynamic inhalation vortex, and 45s ink enrage | Boss damage thresholds (4,000 HP / phase) | Phase 1 invulnerable hull, Phase 2 vortex pull (220 px/s, 2.5x crit maw), Phase 3 750 px/s charge | 45s enrage timer expires $\to$ screen-wiping Hadal Wave | `IDEAS_PITCH.md` §3 Feature 10 |
| 11 | Modes | Endless Descent Roguelike | Procedural bathymetric DAG map with depth sectors, hydrostatic pressure penalties, and 24-boon drafts | Node selection, depth progress, card drafting | 7-9 strata, pressure debuffs (50% speed, 80% HP, 100% leak), Common-Cursed boons | Depth pressure leaks 1 HP/12s at 100% strain until vented | `IDEAS_PITCH.md` §3 Feature 11 |
| 12 | Sensory | Tactical Sonar & Hydrophone UI | Concentric polar radar rings, 3.5s sweep, echo blooms, 16-band audio waterfall, and procedural glass fractures | Entity positions, Web Audio output, player stress | 5 range rings, echo blooms, shockwave rings, FFT spectrum bars, 14px trauma shake | Contrast-first accessibility mode allows toggling overlay | `IDEAS_PITCH.md` §3 Feature 12 |
| 13 | Weapons | Cryo-Freezing Mines | Endothermic proximity mines freezing enemies into brittle ice statues that shatter on impact | Proximity trigger within 42 px | 120-160px cryo-blast, 3.2s freeze, +200% shatter crit, 8-12 shrapnel shards | Clamped to max 3-5 active mines | `IDEAS_PITCH.md` §4 Innovation 1.1 |
| 14 | Weapons | Electric Eel Arc Cannon | Saline pilot stream discharging cascading violet lightning bolts jumping between hostiles | Fire trigger | 14-38 initial dmg, jumps up to 3-8 targets within 130-230px, 1.2-2.8s stun | Damage attenuates by 16% per jump | `IDEAS_PITCH.md` §4 Innovation 1.2 |
| 15 | Weapons | Aegis Remora Micro-Drones | Autonomous micro-subs orbiting player craft in an elastic hydrodynamic ellipse | Automatic drone bay spawn | Point defense vaporizing bullets within 85px; sacrificial kinetic ablation on fatal hits | 15s repair cooldown when drone sacrifices itself | `IDEAS_PITCH.md` §4 Innovation 1.3 |
| 16 | Weapons | Depth Charge Geyser Barrage | Hydrostatic barometer canisters ascending and detonating at preset depth Y_fuse, erupting steam geyser | Launch trigger | 110px cavitation (80-180 true dmg), 70px steam geyser dealing 16 DPS and lifting foes | Bounded by seabed y=800 and Y_fuse | `IDEAS_PITCH.md` §4 Innovation 1.4 |
| 17 | Hazards | Sonar Blackout Zones | Murky oceanic pycnoclines cloaking enemies and preventing homing missile target lock | Entity inside y in [180, 480] zone | Acoustic blindness; active sonar ping illuminates enemies as wireframes for 4.0s | Active ping alerts nearby enemies to charge ping origin | `IDEAS_PITCH.md` §4 Innovation 2.2 |
| 18 | Hazards | Toxic Phytoplankton Blooms | Corrosive red tide drifting with currents, dissolving metal hulls and healing bio-invaders | Drift contact | 1 HP / 1.5s corrosion to metal hulls; +8% HP/s and +25% haste to bio-invaders | Destroying Algae Spore Pods (40-80 HP) prevents bloom | `IDEAS_PITCH.md` §4 Innovation 2.3 |
| 19 | Hazards | Oceanic Whirlpools | Rankine-Lamb-Oseen marine vortex pulling entities and curving torpedoes into hyperbolic orbits | Proximity within 200px | Radial pull (320 px/s²), tangential swirl, 25 DPS core crushing damage | Pull clamped at core radius 30px | `IDEAS_PITCH.md` §4 Innovation 2.4 |
| 20 | Hazards | Tectonic Seabed Rifts | Seismic fault fractures venting supercritical magma steam pillars from seabed | Seismic warning (2.2s rumble) | 90px wide column, 1,200 px/s eruption, 50 DPS true damage, displaces barricades | Erupts for exactly 3.0s | `IDEAS_PITCH.md` §4 Innovation 2.5 |
| 21 | Meta | Sunken Precursor Relics | Heavy salvage claw dredging encrypted datacores and cursed artifacts during boss waves | 45s extraction window | Unlocks permanent passive augments or game-warping cursed relic modifiers | Fails if timer expires before dredging | `IDEAS_PITCH.md` §4 Innovation 3.1 |
| 22 | Meta | Bathymetric Tech Tree | 4-branch research matrix (Hydrodynamics, Ballistics, Acoustics, Nanotech) funded by Hydro-Alloys | Dredged alloys & water | 32 total tech nodes with branching milestone specializations | Requires prerequisite nodes in branch | `IDEAS_PITCH.md` §4 Innovation 3.2 |
| 23 | Meta | Abyssal Dredging Bounties | High-priority tactical contracts in hangar with distinct kill/survival criteria | Contract completion | Pure Water rewards (+250-500), missile pods, rare paint finishes | Fails if contract conditions violated | `IDEAS_PITCH.md` §4 Innovation 3.3 |
| 24 | Meta | Salvage Insurance & Wagers | Lloyd's Abyssal Insurance policies providing death revives or 4.0x dividend survival wagers | Purchase in Shop | Hull coverage (revive once with 2 HP, 3s i-frames); Trench wager (4.0x payout) | Wager forfeits water if player takes damage | `IDEAS_PITCH.md` §4 Innovation 3.4 |
| 25 | Meta | Echo Shards Prestige | Black box telemetry crystallization converting score and depth into permanent prestige currency | Run victory or defeat | Shards = floor(Score/10000) + (Wave*2) + (Crises*15); unlocks legacy doctrines | Permanent account-wide persistence | `IDEAS_PITCH.md` §4 Innovation 3.5 |
| 26 | Factions | Deep Trench Apex Predators | Unaligned giant fauna (Abyssal Gulper Eel, Colossal Siphonophore) hunting player and invaders | Ambient spawning | Gulper swallows small entities & spits shrapnel; Siphonophore stings with bio-toxin | Attacks both player and enemy invaders | `IDEAS_PITCH.md` §4 Innovation 4.1 |
| 27 | Factions | Corrupted Ghost Submersibles | Derelict human exploration subs reanimated by alien neural parasites, mirroring player capabilities | Ambient spawning | Booster dashes, reverse-homing torpedoes, 160px acoustic radar jamming field | Symmetrical tactical duel | `IDEAS_PITCH.md` §4 Innovation 4.2 |
| 28 | Bosses | SMS Leviathan-01 Dreadnought | Rusted 520x180 px iron battleship boss with modular batteries, CIWS flak, and exposed railgun core | Spatial targeting | Modular destruction: 380mm turrets (1,200 HP), CIWS (800 HP), VLS (1,000 HP), Core (3,000 HP) | Core only vulnerable after deck turrets destroyed | `IDEAS_PITCH.md` §4 Innovation 4.3 |
| 29 | Factions | Dynamic Flock Pincer AI | Decentralized Reynolds Boids flocking with 3-echelon coordinated military pincer strikes | Wave 10+ enemy squads | Fluid swimming around barricades; simultaneous vanguard, diving flank, and sniper pincer | Bounded to 600x800 logical canvas | `IDEAS_PITCH.md` §4 Innovation 4.4 |
| 30 | Modes | Sunken Outpost Base Defense | Tower-defense hybrid defending central geothermal dome (500 Structural HP) with automated turrets | Outpost hardpoint turret deploy | Deployable Pure Water Gatlings, Cryo-Slowers, Missile Pods; Allied bot bulkhead welding | Defeat if outpost core reaches 0 HP | `IDEAS_PITCH.md` §4 Innovation 5.1 |
| 31 | Modes | Trench Escort Convoy Mode | Escorting the unarmed cargo bathyscaphe Thalassa (150 HP, 40 px/s) across active trench warzones | Player positioning | Barge body-blocking, deployable barricade protection, escort progression | Defeat if Thalassa is destroyed | `IDEAS_PITCH.md` §4 Innovation 5.2 |
| 32 | Modes | Tidal Surge Sprint | Compression time attack where crimson hyperbaric pressure wall rises from y=800 at 8 px/s | Wave kills & combos | Kills push wall down by -15px (-40px on combos); touching wall inflicts 2 HP/s | Instant defeat if crushed by surge | `IDEAS_PITCH.md` §4 Innovation 5.3 |
| 33 | Modes | Boss Rush Gauntlet | Consecutive tournament gauntlet against all 6 End-Game Sovereigns with 30s inter-boss shop phase | Boss kills | Continuous health and cooldown persistence across unbroken boss duels | Permadeath on hull loss | `IDEAS_PITCH.md` §4 Innovation 5.4 |
| 34 | Modes | Ghost Submarine Relay | Asynchronous cooperative ghost telemetry replaying high-score runs with emergency supply pod drops | Telemetry sync | Translucent ally vessel firing recorded loadouts; drops +1 HP and +100 Water on original death | Zero network latency / pure local telemetry | `IDEAS_PITCH.md` §4 Innovation 5.5 |
| 35 | Events | Distress Beacon In-Run Event | Sinking allied research drone capsule (y=120 to y=780 at 35 px/s) requiring intercept rescue | Intercepting capsule | Rescue: +200 Water, random officer perk, or escort fighter; Ignored: enemies gain +20% shield | Capsule lost if reaches seabed y=780 | `IDEAS_PITCH.md` §4 Innovation 5.6 |
| 36 | Sensory | Marine Snow Particle Field | 80-150 GPU/Canvas particulates with Brownian drift reacting to shockwaves and currents | Physics impulses | Fluid eddies behind submarine; radial dispersal from detonations; realistic water depth | Zero runtime object allocations via pooling | `IDEAS_PITCH.md` §4 Innovation 6.2 |
| 37 | Sensory | Volumetric Lights & Caustics | Dual searchlight Tyndall beams and animated sinusoidal seabed caustics | Submarine prow pos | Procedural dancing golden-cyan caustics across seabed sediment | Rendered via canvas vector path gradients | `IDEAS_PITCH.md` §4 Innovation 6.3 |
| 38 | Sensory | Directional Screen Shake & Distortion | Hydrodynamic camera displacement vector aligned with blast epicenters and refraction warping | Explosion epicenters | Directional displacement A0*e^(-t/tau); localized canvas pixel displacement | Clamped to prevent motion sickness | `IDEAS_PITCH.md` §4 Innovation 6.5 |
| 39 | Synergy | Vent-Surfing Solar Lance | Tripling laser cooling in hydrothermal vent halo while using updraft to shoot over barricades | Submarine in vent halo + Laser | Continuous Supercharged laser firing (+25% DPS) with zero overheat; bullets dissolve | Overheating impossible while in halo | `IDEAS_PITCH.md` §5.2 Scenario A |
| 40 | Synergy | Harpoon Guillotine | Impaling shielded Colossus with Harpoon and whipping it into a tectonic magma fissure geyser | Harpoon impale + Winch whip | Instant kill from 50 DPS geyser; acoustic shockwave shatters backline sniper shells | Cable breaks if exceeding 420px | `IDEAS_PITCH.md` §5.2 Scenario B |

---

## 5. Edge Cases & Boundary Behaviors

| # | Feature | Input / Condition | Observed & Documented Behavior |
|---|---------|-------------------|--------------------------------|
| 1 | Cavitation Torpedo | Second tap within first 100 px of travel | Torpedo is in `INERT` safety phase. Second tap is ignored or buffered; blunt collision deals exactly 15 damage without detonating, preventing player self-destruction. |
| 2 | Cavitation Torpedo | Detonation within 85 px of player barricades | Sympathetic acoustic vibration damages 1 to 4 protective barricade voxels. Players must fire past defensive line or through cleared lanes. |
| 3 | Bioluminescent Laser | Continuous fire reaches 100 HU | Triggers `LOCKOUT` state: emergency steam venting sound, -15% movement speed penalty, and exactly 2.2s lockout where weapon cannot fire. |
| 4 | Bioluminescent Laser | Firing into player barricades | Silicate voxels act as natural low-efficiency prisms, refracting beam into fan array at 120% total power without damaging player barricade blocks. |
| 5 | Hydraulic Harpoon | Cable stretched beyond 420 px ($L > L_{\max}$) | Tension exceeds elastic limit. High-tension wire snaps with sharp metallic snap sound, releasing target without dealing slingshot impact damage. |
| 6 | Hydraulic Harpoon | Tethered enemy dies while attached | Cable immediately detaches and triggers rapid pneumatic retraction at 550 px/s back to the submarine prow. |
| 7 | Hydrothermal Vents | Player lingers in thermal core $> 0.5$ s | Grace buffer expires; player takes 1 HP true damage every 1.25s until maneuvering into the outer convection halo. |
| 8 | Hydrothermal Vents | Hostile boss enters thermal core | Boss energy shield regeneration is completely halted; takes flat + percentage health decay capped at 45 DPS. |
| 9 | Biolapse Darkness | Battery reaches 0% during Midnight | Headlight does not shut off completely; drops into emergency reserve mode with illumination range shrinking from 440 px down to 154 px. |
| 10 | Biolapse Darkness | Homing missile fired at unlit enemy | Missile cannot establish acoustic/optical target lock in the dark; flies in a straight upward dumb trajectory until player sweeps headlight over the target. |
| 11 | Modular Chassis | Player switches to Stingray with 3 HP | Base HP drops from 5 to 3 notches; any incoming piercing damage in late-game waves deals lethal damage if unmitigated. |
| 12 | Modular Chassis | Nautilus reaches $\le 2$ HP | Triggers Aegis Bulkhead passive: releases 120 px steam shockwave clearing bullets and grants 1.5s invulnerability (60s internal cooldown). |
| 13 | Crew Officer Deck | Activating SCRAM Purge (Q) while at 0 HP | If lethal hit occurs and Purge is ready with canReviveWithPurge flag, revives ship with 1 HP shield and pushes all enemies back 300 px (once per run). |
| 14 | Bio-Horrors | 3 Parasite Clingers attach simultaneously | Player propulsion speed is reduced by cumulative 75% (-25% per bug), making evasion almost impossible until Left/Right keys are alternated 4 times. |
| 15 | Automaton Phalanx | Frontal shot strikes linked Aegis drone | Bullet is 100% deflected or deals damage dampened by 40% distributed across all linked drones; non-piercing bullets ricochet harmlessly. |
| 16 | Automaton Phalanx | Shared shield HP reaches 0 | Inductive Backlash triggers: electromagnetic pulse stuns all linked drones for 3.5s and inflicts 35% Max HP true damage to each. |
| 17 | Kraken Prime Boss | Player attacks main body during Phase 1 | Central hull is 100% invulnerable while any of the 4 tentacles remain alive; bullets bounce off chitinous shell. |
| 18 | Kraken Prime Boss | Phase 3 45s countdown timer expires | Soft enrage timer triggers Hadal Extinction Wave sweeping entire 600x800 canvas, instantly destroying player craft. |
| 19 | Endless Descent | Hydrostatic pressure reaches 100% | Hull Critical Strain activates: hull develops leaks dealing 1 HP damage every 12 seconds until pressure is vented at a cache or outpost. |
| 20 | Tactical Sonar HUD | Player stress exceeds 75% | Procedural branching glass fracture lines spiderweb across screen corners via recursive midpoint displacement, degrading optical clarity. |

---

## 6. Caveats

1. **Test Environment Independence**: Specifications mined in this report represent the canonical game design and numerical baselines from `IDEAS_PITCH.md`. Live runtime verification across all viewports (Mobile 375x667, Tablet 768x1024, Desktop 1920x1080) must be conducted by the QA playtest swarm without altering `logicalWidth: 600` or `logicalHeight: 800`.
2. **Audio Autoplay Policies**: Web Audio API context requires a user gesture (`pointerdown`, `click`, or `keydown`) in standard browsers before procedural audio synthesis can unmute; headless test runs must account for audio context resume states.
3. **Responsive Scaling Constraint**: Canvas resizing must operate strictly through outer CSS letterboxing (`globals.css` / `game-canvas.tsx`), never modifying logical coordinates.

---

## 7. Conclusion

The authoritative specification in `IDEAS_PITCH.md` provides an exceptionally detailed, mathematically formalized, and physically coherent blueprint for all 12 Flagship Features. Every mechanic features exact velocities, damage formulas, cooldown thresholds, and Web Audio synthesis parameters.

The Next.js codebase at `src/game/flagship/` is fully structured to accommodate these specifications under `FlagshipManager.ts` and `types.ts`. The QA playtest swarm now has the exact acceptance criteria, triggers, and boundary conditions required to conduct deep manual playtesting, verify visual and auditory rendering, and audit runtime stability.

---

## 8. Verification Method

To independently verify the facts, citations, and formulas documented in this report:

1. **Document Verification**:
   - Inspect `/Users/user/src/water-invader/IDEAS_PITCH.md` at the cited line numbers (Section 3: Lines 140–1018; Section 4: Lines 1020–1290; Section 5: Lines 1292–1324).
   - Inspect `/Users/user/src/water-invader/src/game/flagship/types.ts` to confirm interface definitions and constant mappings.
   - Inspect `/Users/user/src/water-invader/src/game/flagship/FlagshipManager.ts` to confirm subsystem coordinator lifecycle hooks.
2. **Typecheck & Build Validation**:
   - Run `npx tsc --noEmit` from `/Users/user/src/water-invader` to verify type integrity.
   - Run `npm run build` to confirm compilation without Next.js build errors.
3. **Invalidation Conditions**:
   - This report would be invalidated if `IDEAS_PITCH.md` numerical constants (such as 180 px/s torpedo speed, 2.2s laser lockout, 420 px max harpoon length, or 95s darkness cycle) are altered in the master design specification.

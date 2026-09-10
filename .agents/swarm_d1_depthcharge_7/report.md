# Feature Proposal: Sub-surface Depth Charge Barrage & Geyser Eruptions
**Specialist 1.7 — Weapons & Sub-aquatic Combat Architecture**  
**Project**: Water Invader (Canvas 600x800 Architecture)  
**Document Version**: 1.0.0-PROPOSAL  
**Working Directory**: `/Users/user/src/water-invader/.agents/swarm_d1_depthcharge_7/`

---

## Executive Summary

The **Sub-surface Depth Charge Barrage & Geyser Eruptions** system introduces vertical hydrodynamic warfare to *Water Invader*. While standard weaponry (pure water lasers, homing missiles) operates primarily along horizontal tracking axes, the Depth Charge Barrage gives players precise control over hydrostatic detonation depth ($Y_{\text{fuse}}$) within the oceanic water column.

Players fire pressurized explosive canisters upward from their benthic craft ($Y=740$). As canisters ascend against gravity and fluid drag, an internal hydrostatic sensor monitors ambient water pressure. Upon reaching the player-selected fuse depth, the canister triggers a dual-phase detonation:
1. **Primary Cavitation Implosion**: A localized high-pressure shockwave that bypasses directional front shields and deals devastating area-of-effect damage.
2. **Secondary Seabed Geyser Eruption**: A superheated hydrothermal geyser that vents violently from the ocean floor ($Y=800$) to the detonation ceiling, creating a persistent boiling water column that physically lifts, suspends, and thermal-scorches descending invaders while disintegrating incoming enemy projectiles.

This weapon transforms the tactical loop from simple horizontal dodging into multi-dimensional depth anticipation, perfectly synergizing with voxel barricades and providing an indispensable countermeasure against late-game dive-bombers and crisis echelons.

---

## 1. Concept & Hook

### 1.1 The Thematic & Mechanical Hook
- **Core Hook**: *"Predict the Depth. Crack the Ocean."*
- **The Problem in Conventional Space Invaders**: Combat is fundamentally one-dimensional: enemies move laterally and drop down; the player slides horizontally and shoots straight up. Weapon variety is often limited to spread shots, lasers, or homing missiles.
- **The Sub-aquatic Solution**: In *Water Invader*, the player operates deep underwater (across biomes: *Surface Aquifer*, *Abyssal Trench*, *Bioluminescent Reef*, *Toxic Seabed*, *Cosmic Void*). The entire ocean volume between the seabed floor ($Y=800$) and the surface ($Y=0$) is a three-dimensional fluid mass.
- **The Gameplay Dynamic**:
  - Instead of bullet collision on direct contact, depth charges are **time-and-depth fused**.
  - Players dial in a target detonation depth (e.g., $Y=380$).
  - When the canister reaches that exact altitude, it detonates in mid-water, triggering a violent ocean-floor geyser that erupts straight upward.
  - This allows the player to pre-emptively mine specific depth strata, hitting enemies hiding behind indestructible barricades or ambushing diving crabs at the exact inflection point of their descent.

### 1.2 The Two-Stage Cataclysm
```
+========================================================================+
| STAGE 1: CANISTER ASCENT & CAVITATION IMPLOSION                        |
|                                                                        |
|    [Enemy Formation]       * * * * * (Shielded Crabs / Snipers)        |
|    Depth Plane: Y_fuse ----[  BOOM! CAVITATION IMPLOSION  ]------------|
|                             ^  (Shockwave radiates 360 deg, bypasses)  |
|                             |                                          |
|                      (Canister Ascends)                                |
|                             |                                          |
|    [Barricades]             #         #         #         #            |
|    [Player Sub]         <==[===]==> (Y=740)                            |
+========================================================================+
| STAGE 2: SEABED HYDROTHERMAL GEYSER ERUPTION                           |
|                                                                        |
|    [Disrupted Invaders]    \  /  \  /  (Enemies lifted & stunned)      |
|    Depth Plane: Y_top -----~~~~~~~~~~~~~~~~~~~~~~~~~ (Steam Plume)-----|
|                            ||  ::  ||  ::  ||                          |
|                            ||  ::  ||  ::  || (Boiling Water Column)   |
|                            ||  ::  ||  ::  || (Vaporizes Enemy Bullets)|
|    [Barricades Protected]  ||  #   ||  #   ||                          |
|    Ocean Floor (Y=800) ====[SEABED VENT ERUPTING]======================|
+========================================================================+
```

---

## 2. Mechanics & Mathematical Specifications

### 2.1 Coordinate Space & Dimensions
All calculations strictly adhere to *Water Invader's* standard logical dimensions:
- Canvas Logical Dimensions: $W_{\text{logical}} = 600 \text{ px}$, $H_{\text{logical}} = 800 \text{ px}$.
- Player Position: $X_p \in [25, 575]$, $Y_p = 740 \text{ px}$ (size: $50 \times 40 \text{ px}$).
- Barricade Plane: $Y_b = 650 \text{ px}$, 4 bunkers positioned at $X \in \{45, 195, 345, 495\}$.
- Enemy Descent Zone: $Y_e \in [50, 650]$.
- Depth Fuse Range: $Y_{\text{fuse}} \in [120, 680]$ (default: $380 \text{ px}$).

### 2.2 Hydrodynamic Ascent & Fuse Physics
The canister is fired with an initial upward propellant charge and accelerates according to buoyancy and fluid drag.

Let:
- $y(t)$: Vertical position of canister at time $t$
- $v_y(t)$: Vertical velocity (negative is upward)
- $v_0 = -380 \text{ px/s}$ (initial muzzle velocity)
- $a_{\text{buoyancy}} = -140 \text{ px/s}^2$ (net upward buoyant acceleration in seawater)
- $k_{\text{drag}} = 0.0016 \text{ px}^{-1}$ (hydrodynamic form drag)

The governing differential equation:
$$\frac{dv_y}{dt} = a_{\text{buoyancy}} - k_{\text{drag}} \cdot v_y |v_y|$$

Integrated terminal ascent velocity:
$$v_{\text{term}} = -\sqrt{\frac{|a_{\text{buoyancy}}|}{k_{\text{drag}}}} = -\sqrt{\frac{140}{0.0016}} \approx -295.8 \text{ px/s}$$

With initial boost $v_0 = -380 \text{ px/s}$, velocity smoothly transitions toward $-296 \text{ px/s}$.
The mean ascent speed is $\bar{v}_y \approx -340 \text{ px/s}$.

#### Ascent Duration Table
| Fuse Target Depth ($Y_{\text{fuse}}$) | Distance Traveled ($\Delta Y$) | Flight Time ($t_{\text{det}}$) | Strategic Zone |
|:---:|:---:|:---:|:---|
| **600 px** | 140 px | **0.37 sec** | Point-Blank Bunker Defense / Anti-Diver Trap |
| **480 px** | 260 px | **0.72 sec** | Lower Swarm Front / Mid-tier Intercept |
| **360 px** | 380 px | **1.08 sec** | Main Invader Formations |
| **240 px** | 500 px | **1.45 sec** | High-Altitude Snipers & Rogue Carriers |
| **120 px** | 620 px | **1.83 sec** | Ceiling Spawn Incursion / Boss Flak |

### 2.3 Detonation Conditions
Detonation occurs at time $t$ if either of the following criteria is met:
1. **Hydrostatic Fuse Trigger**:
   $$y(t) \le Y_{\text{fuse}}$$
2. **Emergency Proximity Impact Fuse**:
   If an enemy entity bounds intersect the canister before reaching $Y_{\text{fuse}}$:
   $$\text{dist}(Canister, Enemy) \le R_{\text{prox}} \quad (R_{\text{prox}} = 22 \text{ px})$$
   The canister detonates immediately with 75% blast radius as an emergency fail-safe.

### 2.4 Damage Profile & Blast Radii
Upon detonation at coordinate $(X_{\text{det}}, Y_{\text{det}})$:

#### Phase A: Spherical Cavitation Blast
- Blast Radius: $R_{\text{blast}} = 75 \text{ px}$
- Base Core Damage: $D_{\text{core}} = 45 \text{ HP}$
- Radial Damage Falloff:
  $$D(r) = D_{\text{core}} \cdot \left(1 - \left(\frac{r}{R_{\text{blast}}}\right)^{1.5}\right) \quad \text{for } r \le R_{\text{blast}}$$
- **Shield Bypassing Rule**:
  In standard combat, `SHIELDED` enemies absorb damage through `shieldHp` from the front (downward facing).
  Because the cavitation shockwave expands isotropically from within the formation:
  - If $Y_{\text{det}} \le Y_{\text{enemy}} + 10$, the blast strikes from above/lateral sides:
    $$\text{Target Damage applied directly to } Enemy.hp \quad (\text{Shield bypassed!})$$

#### Phase B: Seabed Geyser Column Eruption
- Origin: Ocean floor $(X_{\text{det}}, Y=800)$.
- Apex: $Y_{\text{top}} = \max(60, Y_{\text{det}} - 100 \text{ px})$.
- Column Width: $W_{\text{geyser}} = 56 \text{ px}$ (spanning $[X_{\text{det}} - 28, X_{\text{det}} + 28]$).
- Eruption Duration: $T_{\text{geyser}} = 1.50 \text{ seconds}$.
- Tick Rate: Every $\Delta t_{\text{tick}} = 0.08 \text{ seconds}$ (18 ticks total).
- Tick Damage: $D_{\text{tick}} = 4 \text{ HP}$ per tick (Max cumulative damage: $72 \text{ HP}$).

### 2.5 Hydrodynamic Upwelling (Enemy Lifting & Interruption)
Every frame within $T_{\text{geyser}}$, any enemy with bounding box intersecting $[X_{\text{det}} - 28, X_{\text{det}} + 28]$ and $Y \in [Y_{\text{top}}, 800]$ experiences a vertical buoyant upwelling force:

$$v_{y,\text{enemy}}(t + \Delta t) = v_{y,\text{enemy}}(t) - \left(\frac{F_{\text{lift}}}{M_{\text{enemy}}}\right) \cdot \Delta t$$

Where:
- Nominal Lift Force: $F_{\text{lift}} = 520 \text{ px/s}^2$ upward.
- Enemy Mass Coefficients ($M_{\text{enemy}}$):
  - `NORMAL`, `ZIGZAG`: $M = 1.0 \implies \Delta v_y = -520 \text{ px/s}^2$ (lifted rapidly upward).
  - `DIVER`: $M = 1.2 \implies$ Dive attack halted ($+250 \text{ px/s} \to -180 \text{ px/s}$ upward rebound).
  - `SNIPER`, `SABOTEUR`: $M = 1.4 \implies$ Aim disrupted, firing canceled.
  - `ROGUE_STALKER`, `ROGUE_MECH`: $M = 2.8 \implies$ Slowed descent by 70%.
  - `BOSS`, `CRISIS_SOVEREIGN`: $M = 9.0 \implies$ Upward lift clamped to 15% slow effect; does not move boss off-screen.

```
Lifting Vector Diagram:
          Enemy (v_y = +220 px/s diving)
                     |
                     V
         =========================  <-- Geyser Upward Drag (F_lift = 520 px/s^2)
                     ^
                     |
        Net Result: Dive arrested in 0.42s -> Enemy blasted backward into ranks!
```

### 2.6 Projectile Vaporization Grid
Any enemy projectile (bullet, bio-acid droplet, plasma orb) entering the geyser column ($X \in [X_{\text{det}} \pm 28], Y \in [Y_{\text{top}}, 800]$) is instantly neutralized:
$$\text{Bullet.isDead} = \text{true}; \quad \text{spawnWaterVaporPuff}(X, Y);$$
This gives the weapon an exceptional dual-purpose utility: high offensive DPS and deployable vertical shield wall.

---

## 3. Tactical Loop & Gameplay Dynamics

### 3.1 The Anticipation Cycle
```
[Identify Threat Vector]
       |
       +--> Diver crabs readying swoops (Wave 8+) OR Clustered Snipers (Wave 12+)
       |
[Assess Altitude & Velocity]
       |
       +--> Enemy moving down at 25 px/s; current Y = 280. Expected Y in 1.1s = ~310.
       |
[Adjust Fuse Dial]
       |
       +--> Player rolls dial to 320m with mouse wheel or [Q]/[E].
       |
[Deploy Depth Charge Salvo]
       |
       +--> Canister launched from submarine, trailing luminous bubbles.
       |
[Detonation & Chain Reaction]
       |
       +--> Cavitation implosion rips enemy armor.
       +--> Geyser column surges from seabed floor.
       +--> Trailing divers pushed into shockwave, triggering chain combo!
```

### 3.2 Advanced Tactical Maneuvers
1. **The "Seabed Minefield" (Benthos Trap)**:
   - Setting $Y_{\text{fuse}} = 620$ (just above barricades).
   - Used against fast diving crabs or `SABOTEUR` units rushing to destroy barricades. The detonation occurs almost instantly (0.35s flight), obliterating flank rushers before they touch the bunkers.
2. **The "Staggered Flak Wall"**:
   - Firing 3 charges across the horizontal axis with a 0.2s spacing:
     - Canister 1: $X=150, Y_{\text{fuse}}=360$
     - Canister 2: $X=300, Y_{\text{fuse}}=360$
     - Canister 3: $X=450, Y_{\text{fuse}}=360$
   - Generates an impenetrable horizontal fire curtain and 3 parallel thermal geysers that block all incoming enemy fire across 40% of the entire screen for 1.5 seconds.
3. **The "Elevator Slam"**:
   - Detonating a geyser beneath an enemy formation pushes the front-line enemies upward into the rear-guard rows.
   - When combined with friendly-fire collision physics (introduced in recent AI updates), the pushed enemies bump into their allies, triggering mass chaos and staggered firing pauses.

---

## 4. Visuals & SFX (Audio-Visual Spectacle)

### 4.1 Visual Styling & Canvas Rendering Pipeline

#### A. Canister In-Flight Rendering
- **Geometry**: Heavy brass & titanium cylinder, $12 \text{ px}$ wide $\times 20 \text{ px}$ tall.
- **Visual Features**:
  - Twin contra-rotating stabilizing hydrodynamic fins at tail.
  - Luminous Depth Sensor Diode at nose:
    - Blicks cyan (`#22d3ee`) when $> 200 \text{ px}$ from fuse.
    - Transitions to amber (`#f59e0b`) when within $100 \text{ px}$.
    - Solid pulsing crimson (`#ef4444`) with halo when within $30 \text{ px}$.
  - Bubble Cavitation Wake: Spawns 2 micro-bubble particles per frame ($r=1.5 \text{ px}$, `#e0f2fe`, buoyant rise $+40 \text{ px/s}$).

#### B. The Cavitation Implosion Effect (0.0s - 0.25s)
- **Frame 0 (0-30ms)**: Negative-luminance shock sphere. Canvas composite `destination-out` briefly darkens the immediate water volume, followed by a brilliant white-hot flash point ($r=12 \text{ px}$, `#ffffff`, luminance 1.0).
- **Frame 1-8 (30-130ms)**: Expanding dual shockwave rings:
  - Outer Ring: Aqua shockwave (`#38bdf8`), line width $3.5 \text{ px}$, expanding to $R=75 \text{ px}$.
  - Inner Ring: Electric cyan cavitation ripple (`#00e5ff`), fading with alpha $\alpha(t) = 1.0 - (t / 0.25)$.
- **Particle Burst**: 24 cavitation vapor shards blasted outward at $360^\circ$ with initial velocity $350 \text{ px/s}$, decelerating rapidly in water.

#### C. The Seabed Geyser Column Eruption (0.15s - 1.65s)
- **Seabed Rupture Vent**: At $(X_{\text{det}}, Y=800)$, a violent venting fracture glows with geothermal orange/cyan thermal plumes (`#38bdf8` to `#f97316`).
- **Main Water Column**:
  - Rendered using layered vertical gradients with oscillating boundaries:
    $$X_{\text{left}}(y, t) = X_{\text{det}} - 28 + 6 \cdot \sin(0.04 y + 14 t)$$
    $$X_{\text{right}}(y, t) = X_{\text{det}} + 28 + 6 \cdot \sin(0.04 y + 14 t + \pi)$$
  - Linear Gradient from ocean floor to apex:
    - $Y=800$: Superheated white-cyan (`rgba(255, 255, 255, 0.85)`)
    - $Y=Y_{\text{mid}}$: High-pressure aquamarine (`rgba(6, 182, 212, 0.70)`)
    - $Y=Y_{\text{top}}$: Frothing oceanic mist (`rgba(147, 197, 253, 0.40)`)
- **Ascending Bubble Swarm**:
  - 40 pooled particles per geyser, rushing upward at $-700 \text{ px/s}$ with random horizontal turbulence jitter ($\pm 15 \text{ px}$).
- **Screen Shake**:
  - Detonation trigger: `shakeTimer = 0.28s`, max displacement amplitude $\pm 5.5 \text{ px}$.

```
Visual Rendering Composite:
                Y=top  .~~. (Frothing White Hydrothermal Crown)
                       |::|
                       |::|   <-- Boiling Cyan Water Column with
                       |::|       swirling turbulence sine waves
                       |::|
       Y_det ---------( * )--- Cavitation Shockwave Ring (R=75px)
                       |::|
       Y=650           |::|   <-- Rushes past Barricade gaps
                       |::|
       Y=800 =========[VENT]=== (Geothermal Fracture on Seabed)
```

---

### 4.2 Web Audio API Procedural Synthesis Architecture
In full alignment with `src/game/SoundManager.ts`, all audio is 100% procedurally synthesized in real time via the native Web Audio API, requiring **zero audio files or network requests**.

#### A. Canister Pneumatic Launch (`playDepthChargeLaunch`)
```typescript
public playDepthChargeLaunch(): void {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;

  // 1. High-pressure pneumatic ejection impulse (Bandpass filtered white noise)
  const bufferSize = this.audioCtx.sampleRate * 0.18;
  const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noiseNode = this.audioCtx.createBufferSource();
  noiseNode.buffer = noiseBuffer;

  const filter = this.audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(320, now);
  filter.Q.setValueAtTime(3.5, now);

  const noiseGain = this.audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.25, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  noiseNode.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(this.audioCtx.destination);
  noiseNode.start(now);

  // 2. Rising hydrodynamic hydrophone "thwump"
  const osc = this.audioCtx.createOscillator();
  const oscGain = this.audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.15);

  oscGain.gain.setValueAtTime(0.2, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(oscGain);
  oscGain.connect(this.audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}
```

#### B. Cavitation Detonation & Concussive Sub-Bass (`playDepthChargeDetonation`)
```typescript
public playDepthChargeDetonation(): void {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;

  // 1. Sharp cavitation snap (Water hammer effect)
  const snapOsc = this.audioCtx.createOscillator();
  const snapGain = this.audioCtx.createGain();
  snapOsc.type = 'triangle';
  snapOsc.frequency.setValueAtTime(1800, now);
  snapOsc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
  snapGain.gain.setValueAtTime(0.35, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  snapOsc.connect(snapGain);
  snapGain.connect(this.audioCtx.destination);
  snapOsc.start(now);
  snapOsc.stop(now + 0.04);

  // 2. Deep oceanic concussive sub-bass resonance (Simulates deep ocean water pressure)
  const subOsc = this.audioCtx.createOscillator();
  const subGain = this.audioCtx.createGain();
  subOsc.type = 'sawtooth';
  subOsc.frequency.setValueAtTime(65, now);
  subOsc.frequency.exponentialRampToValueAtTime(18, now + 0.75); // Extreme sub-bass drop

  const lowpass = this.audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(120, now);
  lowpass.frequency.linearRampToValueAtTime(45, now + 0.75);

  subGain.gain.setValueAtTime(0.45, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

  subOsc.connect(lowpass);
  lowpass.connect(subGain);
  subGain.connect(this.audioCtx.destination);
  subOsc.start(now);
  subOsc.stop(now + 0.75);
}
```

#### C. Continuous Geyser Eruption Roar (`playGeyserRoar`)
```typescript
public playGeyserRoar(): void {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;
  const duration = 1.4;

  const bufferSize = Math.floor(this.audioCtx.sampleRate * duration);
  const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
  const out = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Pink noise approximation for heavy boiling water rumble
    out[i] = (Math.random() * 2 - 1) * 0.8;
  }

  const noise = this.audioCtx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = this.audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(220, now);
  bandpass.frequency.exponentialRampToValueAtTime(850, now + 0.3); // Surging upward roar
  bandpass.frequency.linearRampToValueAtTime(450, now + duration);
  bandpass.Q.setValueAtTime(2.0, now);

  const gain = this.audioCtx.createGain();
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.linearRampToValueAtTime(0.28, now + 0.2);
  gain.gain.setValueAtTime(0.28, now + duration - 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(this.audioCtx.destination);
  noise.start(now);
}
```

---

## 5. UI Fuse Depth Dial & HUD Integration

### 5.1 HUD Placement & Responsive Layout
The Fuse Depth control is integrated into both the Canvas Rendering Layer (in-world depth line) and the React UI Layer (tactical control dial).

```
+------------------------------------------------------------------------+
| [WAVE 14]   [SCORE: 48,200]   [PURE WATER: 850]    [COMBO x12]        |
|                                                                        |
|  (In-World Tactical Reticle)                                           |
|  - - - - - - - - - - - - - - - - - - - - - - [FUSE: 380m] - - - - - -  |
|                                                     ^                  |
|                                                     | Semi-transparent |
|                                                     | Cyan dashed line |
|                                                                        |
|                                                                        |
|                                            [ TACTICAL DEPTH DIAL ]     |
|                                            +---------------------+     |
|                                            |    /---\  380m      |     |
|                                            |   |  O  | [ROTARY]  |     |
|                                            |    \---/            |     |
|                                            | [PRESETS]           |     |
|                                            | [1:SURF] [2:MID]    |     |
|                                            | [3:DEEP] [KEY: Q/E] |     |
| [Player HP: |||||]   [DEPTH CHARGES: (2/2)]+---------------------+     |
+------------------------------------------------------------------------+
```

### 5.2 Rotary Depth Dial Design Specifications
- **Positioning**: Docked at bottom-right of viewport ($X=510, Y=700$ within the $600 \times 800$ canvas, or docked in React HUD overlay).
- **Dial Diameter**: $64 \text{ px}$ with a brushed gunmetal outer rim (`#1e293b`) and glowing cyan calibration ticks.
- **Dial Needle**:
  - Needle angle $\theta \in [-135^\circ, +135^\circ]$ mapped linearly from $Y_{\text{fuse}} \in [100 \text{ px}, 680 \text{ px}]$.
  - Equation:
    $$\theta(Y_{\text{fuse}}) = -135^\circ + \left(\frac{Y_{\text{fuse}} - 100}{580}\right) \times 270^\circ$$
- **Digital Readout**:
  - Large monospace text: `380m` (displayed in `#38bdf8` font with neon drop-shadow).
  - Depth Zone Indicator:
    - $Y_{\text{fuse}} \in [100, 250]$: `ZONE: PELAGIC (HIGH)`
    - $Y_{\text{fuse}} \in [251, 480]$: `ZONE: MESO (MID)`
    - $Y_{\text{fuse}} \in [481, 680]$: `ZONE: BENTHIC (DEEP)`

### 5.3 Player Input Ergonomics & Controls
To ensure intuitive control during fast-paced bullet hell sequences:
1. **Mouse Wheel Scroll (Primary)**:
   - Rolling mouse wheel up decreases $Y_{\text{fuse}}$ (shallower / higher elevation) by $30 \text{ px}$ per tick.
   - Rolling mouse wheel down increases $Y_{\text{fuse}}$ (deeper / closer to seabed).
2. **Keyboard Hotkeys**:
   - `[Q]` or `[PageUp]`: Decrement depth by $50 \text{ px}$ (fuse rises).
   - `[E]` or `[PageDown]`: Increment depth by $50 \text{ px}$ (fuse sinks).
   - `[Space]` or `[Left Click]`: Standard primary fire.
   - `[Shift]` or `[Right Click]`: Deploy Depth Charge canister.
3. **Quick-Preset Hotkeys (`[1]`, `[2]`, `[3]`)**:
   - `[1]`: *Surface Snipers (200m)* — instantly sets $Y_{\text{fuse}} = 200$.
   - `[2]`: *Standard Mid-Swarm (380m)* — instantly sets $Y_{\text{fuse}} = 380$.
   - `[3]`: *Barricade Perimeter Shield (580m)* — instantly sets $Y_{\text{fuse}} = 580$.
4. **Mobile / Touch Controls**:
   - Vertical slide bar on the rightmost $40 \text{ px}$ edge of the screen: dragging up/down with thumb smoothly positions the depth reticle.

---

## 6. Synergies with Barricades & Feasibility

### 6.1 Interaction with Existing Barricade Architecture
In `src/game/Barricade.ts`:
- Barricades are placed at $Y=650$, width $60$, height $40$, using a $6 \times 4$ voxel destruction array (24 voxels total per bunker).
- 4 barricades: 1st and 4th are `DESTRUCTIBLE` (ice, `#38bdf8`), 2nd and 3rd are `INDESTRUCTIBLE` (stone, `#94a3b8`).
- Player is stationed at $Y=740$.

#### A. Friendly Fire Immunity & Clearance
Canisters launched from $Y=740$ ignore allied barricade collision during ascent:
```typescript
// DepthChargeCanister.ts
public update(deltaTime: number): void {
  super.update(deltaTime);
  // Canisters pass freely through barricades during ascent
  this.ignoreBarricades = true; 
}
```
This ensures players can fire depth charges from behind full-cover bunkers without accidentally detonating on their own defenses.

#### B. The Geyser Protective Screening Synergy
When a geyser erupts at $X_{\text{det}}$ that coincides with or flanks a barricade:
1. **Bullet Interception**: Enemy sniper rounds and elite piercing needles cannot penetrate the geyser stream, providing a 1.5-second impenetrable shield window that prevents voxel erosion.
2. **Repelling Barricade Saboteurs**:
   - `EnemyType.SABOTEUR` entities specifically move toward $Y=650$ and latch on to gnaw away barricade HP (`isGnawing = true`).
   - A geyser erupting at $Y_{\text{fuse}} = 600$ instantly strips saboteurs off the barricade, deals $72 \text{ HP}$ thermal damage, and flings them backward into the upper ocean layers!

#### C. Geothermal Mineral Solidification (Healing Synergy)
When Allied Repair Bots (`HelperType.REPAIR_BOT`, introduced in recent milestones) operate in the presence of an active geyser:
- The mineral-rich hydrothermal spray provides a +50% repair speed bonus to adjacent damaged ice barricades, regenerating 2 voxels per tick instead of 1.

```
Barricade Synergy Map:
+------------------------------------------------------------------------+
|                                                                        |
|    [Gnawing Saboteur] ---> Dislodged by Geyser Lift Force              |
|           \                                                            |
|            V                                                           |
|       [ GEYSER ]                                                       |
|       [ COLUMN ]                                                       |
|       [  STREAM]   +-------------+                                     |
|       [   ||   ]   | BARRICADE   | <-- Mineral crystallization bonus   |
|       [   ||   ]   | [][][][][][]|     restores damaged ice voxels!    |
|       [   ||   ]   | [][][][][][]|                                     |
|       [   ||   ]   +-------------+                                     |
|       [ SEABED ]      (Y = 650)                                        |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## 7. Shop Upgrades & Economy Integration

The Depth Charge Barrage seamlessly integrates into the existing Pre-Game and Mid-Game Shop system (`GameManager.ts`, `HOMING_MISSILE_COSTS`).

### 7.1 Purchasable Upgrade Tiers
| Tier | Name | Cost (Pure Water) | Magazine | Cooldown | Blast Radius | Geyser Duration | Special Attribute |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **0** | *Unpurchased* | - | 0 | - | - | - | Locked |
| **1** | Pneumatic Depth Charge | 300 | 1 | 2.2s | 65 px | 1.0s | Baseline cavitation blast |
| **2** | Dual-Silo Pneumatics | 500 | 2 | 1.8s | 75 px | 1.2s | Allows 2-charge salvos |
| **3** | Hydrothermal Cavitation Core | 800 | 2 | 1.5s | 85 px | 1.5s | Bypasses all front shields |
| **4** | Geothermal Vent Booster | 1,200 | 3 | 1.2s | 95 px | 1.8s | Geyser width expands to 70px |
| **5** | Tectonic Abyssal Eruptor | 1,800 | 4 | 0.9s | 110 px | 2.2s | Geysers trigger secondary mini-shockwaves |

---

## 8. Technical Feasibility & Clean Architecture

### 8.1 Zero-Regression Compliance
- **Strict Logical Dimensions**: Maintains `logicalWidth = 600` and `logicalHeight = 800` without a single pixel of change, ensuring zero risk of Playwright test suite regression.
- **Strict Read-Only Integrity**: This specification was drafted under complete zero-code-modification constraints.
- **Memory & Garbage Collection Safety**:
  - Uses fixed-size object pools for canisters (`DepthChargeCanister[4]`), geyser columns (`GeyserColumn[4]`), and particles (`ParticlePool[150]`).
  - Allocation-free update loop: $0 \text{ bytes}$ garbage generated per frame.
- **Execution Performance**:
  - Collision check: Bounding box AABB + radial check only against active enemies ($N \le 40$).
  - Estimated frame compute cost: $< 0.12 \text{ ms}$ on 60 FPS update cycle.

### 8.2 Clean Class Extension Blueprint
For future implementation (once explicitly approved):
1. `src/game/DepthCharge.ts`: Extends `Entity`. Encapsulates ascent, hydrostatic sensor, fuse proximity, and detonation trigger.
2. `src/game/GeyserColumn.ts`: Extends `Entity`. Encapsulates seabed vent coordinates, vertical damage cylinder, enemy lift forces, and projectile vaporization.
3. `src/game/SoundManager.ts`: Add `playDepthChargeLaunch()`, `playDepthChargeDetonation()`, and `playGeyserRoar()`.
4. `src/game/GameManager.ts`: Maintain `depthCharges: DepthCharge[]` and `geysers: GeyserColumn[]` arrays in the main tick/render loop.

---

## Conclusion
The **Sub-surface Depth Charge Barrage & Geyser Eruptions** feature delivers an exceptionally rich, tactile, and cinematic combat experience tailored to *Water Invader's* deep-sea lore. By combining predictive depth-fuse planning, shield-bypassing cavitation blasts, and seabed-to-surface geyser shielding, it introduces true vertical strategy while perfectly preserving the game's core retro-arcade identity.

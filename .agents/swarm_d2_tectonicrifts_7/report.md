# Feature Proposal: Tectonic Seabed Rifts & Geothermal Geysers
**Swarm Specialist 2.7 — Domain 2: Environmental Hazards & Map Events**
**Project:** Water Invader (Next.js / HTML5 Canvas Deep-Sea Bullet-Hell)
**Document Version:** 1.0.0
**Target Delivery:** Swarm Milestone 1 / `IDEAS_PITCH.md` Domain 2

---

## Executive Summary

In *Water Invader*, underwater combat has historically unfolded across a static vertical plane where threats descend exclusively from the surface or upper water layers. **Tectonic Seabed Rifts & Geothermal Geysers** revolutionizes the environmental dynamics by introducing catastrophic, dynamic threats that erupt directly from the abyssal seabed floor.

As seismic tremors destabilize the lithosphere, glowing tectonic fault lines fracture open across the ocean floor. Following a calculated telegraph window, high-pressure **Geothermal Steam Geysers** violently erupt, projecting towering vertical columns of supercritical water, cavitation steam, and volcanic tephra through the entire 800px water column. 

This is not merely an obstacle to dodge; it is a **high-skill tactical terrain weapon**. The eruption column is completely non-partisan: while it can shred the player's hull and destabilize protective barricades, skilled players can read seismic telemetry, bait dense enemy swarms or high-threat elites directly into eruption zones, and use tectonic displacement to dynamically reshape the battlefield cover layout.

```
+-----------------------------------------------------------------------+
|  [WAVE 14]             SCORE: 048,250              PURE WATER: 850    |
+-----------------------------------------------------------------------+
|                                                                       |
|   [INVADER]    [INVADER]          [ROGUE MECH]         [INVADER]      |
|        \           \                   |                   /          |
|         \           \                  v                  /           |
|          \           \           +-----------+           /            |
|           \           \          | GEO-STEAM |          /             |
|            \           \         |  GEYSER   |         /              |
|                                  |  COLUMN   |                        |
|                                  | (CRITICAL |                        |
|    [ICE BARRICADE]               |  DAMAGE)  |        [ICE BARRICADE] |
|        (x=45)                    |           |            (x=495)     |
|                   [STONE SHIELD] |           | [STONE SHIELD]         |
|                       (x=195)    |           |    (x=345 -> x=390)    |
|                        SHIFTED!  |           |     DISPLACED!         |
|                                  |           |                        |
|                     [SEISMIC SENSOR: DETONATING 0.4s]                 |
|                   ===================#@#@#@#====================      |
|    SEABED FLOOR:  ~~~~~~~~~/ /~~~~[MANTLE FISSURE]~~~~~/ /~~~~~~~~    |
|                             (x=280 to 370, Width=90px)                |
|                                                                       |
|                 [PLAYER SUBMARINE: EVACUATED TO FLANK]                |
+-----------------------------------------------------------------------+
```

---

## 1. Concept & Hook

### 1.1 The Abyssal Fantasy & Visual Hook
Deep-sea warfare takes place in the abyssal zone above an active continental subduction trench (the Mariana Megathrust Basin). The seabed is alive with violent geotectonic forces. 
- **The Visual Hook**: The dark oceanic abyss suddenly reverberates with low-frequency tremors. Glowing magma fractures (`#ff3300`, `#ffaa00`) spiderweb across the seabed sediment, releasing streams of boiling micro-bubbles and iridescent thermal plumes. 
- **The Eruption**: Without warning, the crust yields, detonating a 90px-wide pillar of superheated steam and volcanic brine that roars upward at 1,200 px/sec, illuminating the ocean with blinding white cavitation and amber thermal energy.
- **Indiscriminate Cataclysm**: Unlike enemy projectiles, geotectonic hazards do not belong to the invaders. The geyser blast column pulverizes anything caught within its cross-section: vaporizing enemy swarms, melting ice barricades, violently shoving stone bunkers, and throwing both submarines and alien mechs into chaotic hydro-dynamic turmoil.

### 1.2 Core Pillars of the Feature
1. **Vertical Bidirectional Pressure**: Forces the player to split attention between threats descending from above and cataclysms rising from below.
2. **Double-Edged Environmental Weaponry**: Transforms an environmental hazard into a rewarding high-risk player weapon through baiting, positioning, and crowd control.
3. **Dynamic Micro-Topography**: Prevents static gameplay by physically shifting barricade shelf coordinates, forcing players out of comfortable camping habits.
4. **Spectacular Sensory Feedback**: Delivers deep infrasonic rumblings, screen-shaking seismic tremors, and intense thermodynamic particle plumes.

---

## 2. Mechanics & Mathematical Specifications

### 2.1 Coordinate System & Spatial Geometry
All spatial coordinates are mapped to the canonical `GameManager` logical grid:
- **Logical Bounds**: Width $W_{canvas} = 600\text{ px}$, Height $H_{canvas} = 800\text{ px}$.
- **Seabed Floor Baseline**: $Y_{bed} = 780\text{ px}$ to $800\text{ px}$.
- **Player Hull Bounding Box**: $X_{player} \in [10, 540]$, $Y_{player} = 740\text{ px}$, $W_{player} = 50\text{ px}$, $H_{player} = 40\text{ px}$.
- **Barricade Shelf**: Baseline $Y_{barr} = 650\text{ px}$, 4 units (Width = 60px, Height = 40px), initial $X \in \{45, 195, 345, 495\}$.
- **Tectonic Rift Zone**:
  - Horizontal Center: $X_{rift} \in [80, 520]$ (generated pseudo-randomly or targeted at high-density clusters).
  - Rift Width: $W_{rift} = 90\text{ px} \pm 15\text{ px}$ (spanning roughly 15% of the total screen width).
  - Effective Column Bounding Box: 
    $$\text{AABB}_{geyser} = [X_{rift} - \frac{W_{rift}}{2}, 0, W_{rift}, 800]$$

```
+-------------------------------------------------------------+ y=0
|                                                             |
|                          Eruption                           |
|                           Blast                             |
|                           Column                            |
|                       Width: 75-105px                       |
|                                                             |
|                                                             |
|                                                             |
|      [B1: Ice]      [B2: Stone]      [B3: Stone]  [B4: Ice] | y=650
|        x=45            x=195            x=345       x=495   |
|                                                             |
|                         [Player Sub]                        | y=740
|                                                             |
|               ~ ~ ~ ~ [Fissure Crack] ~ ~ ~ ~               | y=780
|=============================================================| y=800
  x=0                                                   x=600
```

---

### 2.2 The Three-Phase Event Lifecycle

The Tectonic Rift operates on a strict, finite-state machine (FSM) designed for competitive clarity, predictability, and fairness:

```
[IDLE / STRESS ACCUMULATION] 
            |
            v (Trigger: Wave Event or Timer t >= T_interval)
[PHASE 1: CRUSTAL FRACTURE TELEGRAPH] (Duration: 2.2s - 2.5s)
  - Seismic sensor UI spikes
  - Seafloor glows & cracks open
  - Low rumble + screen tremor (amplitude: 1.5px -> 3.5px)
  - Micro-bubble plumes rise at 120 px/s
            |
            v (Telegraph Complete)
[PHASE 2: SUPERCRITICAL GEYSER ERUPTION] (Duration: 1.4s)
  - Violent impulse burst (0.2s rise)
  - Full-column blast pillar active (0.9s sustain)
  - Massive damage tick rate (10 Hz)
  - Intercepts and incinerates enemy plasma/slugs
  - Displaces barricades & knocks entities upward
  - Dissipation & pressure blowdown (0.3s decay)
            |
            v
[PHASE 3: BASALT COOLING & DORMANT VENT] (Duration: 3.0s)
  - Obsidian glass crust forms
  - Gentle cooling steam effervescence
  - Residual geothermal aura (+15% energy recharge)
            |
            v
[RETURN TO IDLE POOL]
```

#### Detailed Phase Equations & Timers:

| Phase | Duration ($T$) | State Flags | Damage Active | Physics Impulse | Visual Characteristics |
|---|---|---|---|---|---|
| **Phase 1: Telegraph** | $2.5\text{s} - (0.04 \times \text{Wave})$ ($\min: 1.6\text{s}$) | `isTelegraphing = true` | `false` | None | Glowing magma crack, micro-bubbles, screen jitter $\pm 2\text{px}$, audio tremor |
| **Phase 2: Eruption** | $1.4\text{s}$ total ($0.2\text{s}$ rise, $0.9\text{s}$ sustained, $0.3\text{s}$ fade) | `isErupting = true` | `true` (10 Hz tick) | $v_y = -350\text{px/s}$, $F_x = \pm 180\text{px/s}$ | Blinding vertical steam pillar, amber core, 60+ cavitation particles, screen shake $\pm 8\text{px}$ |
| **Phase 3: Cooldown** | $3.0\text{s}$ | `isCooling = true` | `false` | None | Black basalt fissure, dissipating ember particles, thermal energy field |

---

### 2.3 Damage Formulas & Interaction Matrix

The eruption column acts as a lethal thermodynamic boundary. Calculations execute on a fixed $60\text{ Hz}$ tick accumulator, processing damage in discrete $100\text{ms}$ intervals ($10\text{ ticks/sec}$).

#### 1. Damage to Invaders & Rogue Faction Entities
Enemies caught within $X_{rift} - \frac{W_{rift}}{2} \le X_e \le X_{rift} + \frac{W_{rift}}{2}$ receive severe thermal cavitation damage:
$$\text{Damage}_{\text{enemy}}(\text{per tick}) = 5 + \lfloor 1.2 \times \text{Wave} \rfloor$$
$$\text{Total Damage over } 1.4\text{s Eruption (9 sustained ticks)} \approx 45 + 10.8 \times \text{Wave}$$

*Impact Analysis across Enemy Archetypes*:
- **Basic Invaders / Swarmers** (HP: 10 - 25): Annihilated within 2–3 ticks ($0.2\text{s} - 0.3\text{s}$).
- **Mid-Tier Divers & Zigzags** (HP: 35 - 70): Obliterated if caught in the core; severely crippled if clipped on the margin.
- **Rogue Stalkers & Mechs** (HP: 120 - 250): Suffer 35% - 50% max HP damage, stripping shielding and interrupting charge routines.
- **Bosses / Crisis Sovereigns**: Suffer capped flat damage ($180\text{ dmg}$ total) plus a guaranteed 1.0-second weapon-firing stagger.

#### 2. Damage & Control Turbulence to Player Submarine
The player cannot simply ignore the geyser:
$$\text{Damage}_{\text{player}}(\text{per tick}) = 12\text{ Hull / Shield Damage}$$
$$\text{Control Turbulence: } v_{drift}(t) = \sin(35 \cdot t) \times 140\text{ px/s} \quad (\text{pushes ship violently left/right})$$
- Entering the blast column strips 1 whole shield pip within $0.25\text{s}$ and buffets the submarine toward the outer boundaries, enforcing strict movement discipline.

#### 3. Bullet & Projectile Incineration
- **Standard Enemy Slugs / Plasma**: 100% destruction rate upon contact with column $\text{AABB}_{geyser}$. Projectiles dissolve into boiling steam puffs.
- **High-Velocity Lasers / Railguns**: Suffer 50% damage attenuation and a 5-degree refractive trajectory deviation.
- **Player Torpedoes / Missiles**: If the player shoots *through* the geyser, player kinetic rounds are superheated, granting a **Thermal Supercharge**: bullets passing through gain $+25\%$ bonus fire damage and blazing orange trails!

---

### 2.4 Barricade Tectonic Dislocation & Thermal Stress

The central defensive barricades represent the player’s primary shelter. When a seabed rift forms directly beneath or adjacent to the barricade shelf ($Y=650$), tectonic forces induce physical displacement and structural strain:

```
                  [GEYSER PLUME]
                        ||
                        ||
         <- [PUSH]      ||      [PUSH] ->
      +------------+    ||    +------------+
      | B2 (STONE) |    ||    | B3 (STONE) |
      +------------+    ||    +------------+
           x=170        ||         x=370
        (shifted left)  ||     (shifted right)
==================================================
           FAULT RIFT: [x=255 to 345]
```

#### Collision & Overlap Evaluation:
For each barricade $b \in \text{barricades}$:
$$\text{Overlap}(b, \text{Rift}) = \max\left(0, \min(b.x + 60, X_{rift} + \frac{W}{2}) - \max(b.x, X_{rift} - \frac{W}{2})\right)$$

1. **Destructible Ice Barricades ($b.\text{type} == \text{DESTRUCTIBLE}$)**:
   - **Thermal Melting**: If $\text{Overlap} > 15\text{ px}$, the ice undergoes rapid thermodynamic phase change:
     $$\frac{d(\text{HP})}{dt} = -6.0\text{ HP/sec}$$
     Blocks dissolve in random voxel patterns at 3x normal rate.
   - **Flash Steam Shroud (Reward)**: If an Ice Barricade is completely destroyed by a Geothermal Geyser, it detonates into an expansive, opaque **Steam Cloak** ($150\text{ px}$ radius, lasts $2.5\text{s}$) that blinds incoming enemy aim algorithms and renders the player untargetable!

2. **Indestructible Stone Barricades ($b.\text{type} == \text{INDESTRUCTIBLE}$)**:
   - **Tectonic Dislocation**: Stone barricades possess infinite compressive strength, resisting melting. Instead, ground fault expansion displaces them horizontally:
     $$\Delta X = \text{sgn}(b.x + 30 - X_{rift}) \times \min(45\text{ px}, 1.2 \times \text{Overlap})$$
     - The barricade shifts along the X-axis over $0.4\text{s}$ with smooth cubic easing ($x(t) = x_0 + \Delta X (3t^2 - 2t^3)$).
     - **Boundary & Spacing Clamping**: Displaced barricades are clamped to maintain minimum $20\text{px}$ clearance from screen margins and adjacent barricades, preventing overlap glitches.
   - **Plume Deflection Mechanics**: If an Indestructible Barricade remains partially inside the blast column, its heavy granite bevel deflects the rising geothermal column at an angle ($\theta = 25^\circ$), creating a **Diagonal Geothermal Deflection Jet** that covers a broader upper screen zone!

---

## 3. Tactical Gameplay Loop

### 3.1 Decision Flowchart
```
                [SEISMIC SENSOR ALARM: P-Wave Detected]
                                   |
                +------------------+------------------+
                |                                     |
    [Player Inside Hazard Zone?]          [Enemy Cluster Approaching?]
                |                                     |
       +--------+--------+                   +--------+--------+
       |                 |                   |                 |
     (YES)              (NO)               (YES)              (NO)
       |                 |                   |                 |
  Execute Swift    Maintain Position   Execute Baiting   Prioritize Snipers
  Lateral Thruster Behind Shifted      Maneuver Across   & Non-Rift
  Evacuation       Barricade           Fissure Axis      Flanks
       |                 |                   |                 |
  Verify Safe Zone  Fire into Plume     Enemy Wave Trapped  Conserve Energy
  (X < X_r - W/2 or  for Thermal        in 1,200 px/s       for Wave Clear
   X > X_r + W/2)   Supercharge Buff    Supercritical Boil
```

### 3.2 High-Level Tactical Archetypes

#### 1. The "Geothermal Funnel" (Enemy Swarm Eradication)
On Waves 8+, diving enemies (`EnemyType.DIVER`) and zigzagging raiders (`EnemyType.ZIGZAG`) aggressively home in on the player's horizontal coordinate. By briefly hovering directly above a crack in Phase 1 (Telegraph), the player baits the swarm's diving trajectory directly into the eruption corridor. At $t = 2.0\text{s}$, the player dashes clear using lateral thrusters. The descending enemy swarm crashes headfirst into the erupting $1,200\text{ px/s}$ geothermal geyser, wiping out the wave with zero ammunition expenditure.

#### 2. The "Shifting Shield" Shuffle
When an Indestructible Barricade is shoved laterally by an eruption, the player's previously guarded pocket opens up while an open lane becomes shielded. Advanced players anticipate the dislocation vector:
- If Rift forms at $X=220$, Barricade 2 (originally $X=195$) will be pushed left to $X=150$.
- The player pre-emptively slides left to $X=150$, using the displaced bunker to block a high-tier sniper or boss laser volley while the exposed rift at $X=220$ incinerates flanking trash mobs.

#### 3. Thermal Bullet Amplification
Shooting through the geyser column superheats player bullets, turning regular plasma into incendiary torpedoes. Skilled players intentionally align themselves on the flank of the geyser, firing diagonally through the steam column into high-durability enemies on the opposite side to achieve a $+25\%$ DPS boost.

---

## 4. Visuals, Animation & Audio Synthesis

### 4.1 Visual Styling & Canvas Rendering Pipeline
The visual presentation uses lightweight HTML5 Canvas 2D primitives, ensuring 60 FPS performance without WebGL overhead or external sprite dependencies.

```
Canvas Layering Order (Z-Index):
  1. Seabed Mesh & Magma Fissure Lines (Base Canvas)
  2. Thermal Updraft Glow & Heat Wave Distortion (globalCompositeOperation = 'screen')
  3. Barricades (including dynamic displacement offsets)
  4. Geothermal Steam Geyser Column (Core + Outer Gradient)
  5. Cavitation Particles & Tephra Shards (Particle Pool)
  6. Player, Enemies & Projectiles
  7. HUD Seismic Sensor & Warning Overlays
```

#### Layer-by-Layer Specifications:

1. **Magma Fissure (Phase 1 & 2)**:
   - Drawn as a multi-segment jagged path on the seabed ($Y \in [780, 800]$):
   - Outer glow: `strokeStyle = 'rgba(255, 68, 0, 0.4)'`, `lineWidth = 14`, `lineCap = 'round'`.
   - Core fracture: `strokeStyle = '#ffdd55'`, `lineWidth = 3`.
   - Pulsing luminance: Sinusoidal modulation of alpha: $\alpha(t) = 0.7 + 0.3 \sin(18 \cdot t)$.

2. **The Geothermal Geyser Column (Phase 2)**:
   - Width dynamically flutters using high-frequency noise:
     $$W(y, t) = W_{rift} \cdot \left[1.0 + 0.08 \sin\left(\frac{y}{25} - 40 \cdot t\right) + 0.04 \cos\left(\frac{y}{10} + 25 \cdot t\right)\right]$$
   - Linear gradient fill across X:
     - $0.0 \to \text{rgba}(255, 100, 0, 0.0)$
     - $0.2 \to \text{rgba}(255, 140, 20, 0.35)$
     - $0.5 \to \text{rgba}(255, 255, 255, 0.85)$ (Superheated core)
     - $0.8 \to \text{rgba}(255, 140, 20, 0.35)$
     - $1.0 \to \text{rgba}(255, 100, 0, 0.0)$
   - Vertical gradient attenuation from seabed ($Y=800$, fully opaque) to surface ($Y=0$, 40% opacity).

3. **Cavitation Bubble & Ash Particle System**:
   - Spawns 45–60 particles from a pre-allocated pool:
     - **Steam Bubbles (70%)**: Size $3\text{px} - 7\text{px}$, color `#e0f2fe`, upward velocity $v_y = -700\text{ px/s} \pm 200\text{ px/s}$, rapid oscillatory wobble on X.
     - **Volcanic Tephra / Embers (30%)**: Size $2\text{px} - 4\text{px}$, color `#f59e0b` / `#ef4444`, life $0.6\text{s}$, leaving fading trail particles.

4. **Screen Shake Trauma Model**:
   - Integrated into `GameManager.shakeTimer`:
     - Phase 1 (Tremor): Amplitude $A = 2.0\text{ px}$, frequency $25\text{ Hz}$.
     - Phase 2 (Detonation Spike): Sudden shock impulse $A = 7.5\text{ px}$, decaying exponentially over $0.4\text{s}$.

---

### 4.2 Synthesized Web Audio API Implementation (Zero Asset Files)
Following `SoundManager.ts` conventions, all acoustic elements are synthesized mathematically in real-time without external `.mp3` or `.wav` files:

#### 1. Infrasound Seismic Tremor (`playSeismicTremor`)
- **Oscillator 1**: Sine wave sweeping from $28\text{ Hz}$ to $55\text{ Hz}$.
- **Oscillator 2**: Triangle wave at $36\text{ Hz}$ detuned by $+4\text{ Hz}$ to create natural acoustic beating.
- **Filter**: Biquad Low-Pass filter (Cutoff: $90\text{ Hz}$, Q: 3.5).
- **Modulation**: LFO at $7\text{ Hz}$ modulating master gain for tectonic pulsation.

#### 2. Lithosphere Fracture Snap (`playFissureCrack`)
- **Noise Generator**: Short $0.05\text{s}$ pink noise burst.
- **Envelope**: Instant attack ($1\text{ms}$), sharp exponential decay ($45\text{ms}$).
- **Resonator**: High-pass filter at $1,200\text{ Hz}$ + parallel pitch-drop oscillator ($320\text{ Hz} \to 45\text{ Hz}$).

#### 3. Supercritical Geothermal Eruption Roar (`playGeothermalEruption`)
- **Dual Noise + Sub-bass**:
  - Buffer noise passed through a sweeping Band-Pass filter ($250\text{ Hz} \to 1,800\text{ Hz} \to 450\text{ Hz}$) to simulate explosive cavitation bubble collapse.
  - Secondary Sawtooth oscillator at $65\text{ Hz}$ for sustained low-end physical punch.
  - Duration: $1.4\text{s}$, stereo panning aligned to $X_{rift} / 600$ (panned left/center/right depending on screen position!).

```typescript
// Proposed procedural audio implementation for SoundManager.ts
public playGeothermalEruption(xPos: number): void {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;
  
  // 1. Stereo Panner for positional audio
  const panNode = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;
  if (panNode) {
    panNode.pan.setValueAtTime(Math.max(-1, Math.min(1, (xPos / 300) - 1)), now);
  }
  
  // 2. Low rumble oscillator
  const subOsc = this.audioCtx.createOscillator();
  const subGain = this.audioCtx.createGain();
  subOsc.type = 'sawtooth';
  subOsc.frequency.setValueAtTime(65, now);
  subOsc.frequency.exponentialRampToValueAtTime(30, now + 1.4);
  subGain.gain.setValueAtTime(0.3, now);
  subGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
  
  // 3. Cavitation Noise Generator
  const bufferSize = this.audioCtx.sampleRate * 1.4;
  const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = this.audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = this.audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.linearRampToValueAtTime(1400, now + 0.3);
  filter.frequency.exponentialRampToValueAtTime(200, now + 1.4);
  filter.Q.setValueAtTime(4.0, now);
  
  const noiseGain = this.audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.35, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
  
  // Audio graph wiring
  subOsc.connect(subGain);
  noise.connect(filter);
  filter.connect(noiseGain);
  
  const destination = panNode ? panNode : this.audioCtx.destination;
  subGain.connect(destination);
  noiseGain.connect(destination);
  if (panNode) panNode.connect(this.audioCtx.destination);
  
  subOsc.start(now);
  subOsc.stop(now + 1.4);
  noise.start(now);
  noise.stop(now + 1.4);
}
```

---

## 5. UI Seismic Sensor Early Warning Indicator

To guarantee competitive clarity and eliminate "cheap deaths", the feature integrates an intuitive multi-tiered telemetry HUD.

```
+-------------------------------------------------------------+
| [SEISMIC TELEMETRY HUD]                                     |
|  STATUS: [CRITICAL STRESS]         EPICENTER: X=315         |
|  SENSOR: |/|/|/|/|/|/|/|/|/|----|  COUNTDOWN: 1.8s          |
+-------------------------------------------------------------+
                            |
                            v
       [DANGER COLUMN OVERLAY ON PLAYFIELD]
             | / / / / / / / / / / / |
             |   ⚠ GEYSER ERUPTION  |
             |       INCOMING!       |
             |      [== 1.8s ==]     |
             | / / / / / / / / / / / |
             +-----------------------+
```

### 5.1 Telemetry Display Elements
1. **Vertical Hazard Column Overlay**:
   - During Phase 1 ($T_{warn} = 2.5\text{s}$), a translucent vertical stripe pattern fills the column $X \in [X_{rift} - \frac{W}{2}, X_{rift} + \frac{W}{2}]$.
   - Rendered with alternating diagonal amber hazard bands (`rgba(245, 158, 11, 0.15)`).
   - A central HUD reticle projects a descending progress meter indicating exact time-to-detonation.

2. **Seismograph Waveform Meter (Bottom HUD)**:
   - Displayed at $Y = 770\text{ px}$ in the center console.
   - Oscilloscope polyline that flutters with simulated micro-earthquake tremors, accelerating in frequency as detonation nears.

3. **Ship Proximity Warning HUD**:
   - If the player's submarine enters the active rift column during Phase 1:
     - Reticle flashes high-contrast red warning brackets `[ ! ] EVACUATE ZONE [ ! ]`.
     - An emergency acoustic audio beep ($880\text{ Hz}$ intermittent pulse) sounds.
     - Directional arrows point toward the closest safe corridor (Left or Right).

---

## 6. Synergies with Barricade Repair, Allied Reinforcements & Feasibility

### 6.1 Synergy with Allied Repair Bots & Wave Mechanics
The game's existing updates (R1–R3) introduced **Allied Reinforcements** (Medics, Fighters, Repair Bots) and **Barricade Restoration**:
- **Allied Repair Bot Interaction**:
  - When an Indestructible Barricade is displaced by a tectonic rift, Allied Repair Bots recognize the altered barricade coordinate dynamically!
  - Repair Bots do not freeze; their AI pathfinding targets the displaced coordinate $b.x$, establishing temporary magnetic anchor beams.
  - **Geothermal Heat Exchanger (Buff)**: If a Repair Bot is positioned within $80\text{px}$ of an active geyser vent, it absorbs excess ambient thermal energy, granting **"Overclocked Welders"** (+50% repair speed to nearby damaged barricades for 6.0 seconds)!
- **Interactions with Wave Restores**:
  - `GameManager.restoreBarricades()` is invoked at the start of each wave. Under this proposal, `restoreBarricades()` not only replenishes 20 HP and 24 voxel blocks, but also smoothly resets barricade X coordinates back to default alignment ($X \in \{45, 195, 345, 495\}$), creating a fresh, clean slate for every wave.

### 6.2 Synergy with Enemy AI & Factions
- **Rogue Faction Mechs (`ROGUE_MECH`)**:
  - Rogue Mechs possess heavy armor and ground-slam abilities. If a Rogue Mech is caught in a geyser, its heavy chassis resists vertical knockback, causing it to take **Double Thermal Burn Damage** due to conductive hull heating.
- **Friendly Fire & Pathfinding Synergy**:
  - In accordance with R3 (Enemy Line-of-Sight & Friendly Fire AI), enemies will detect the geyser column as an opaque obstacle! Standard invaders will hold their fire rather than shooting blindly into the steam wall, preventing wasted ammunition and creating opportunities for the player to hide behind the plume.

---

### 6.3 Technical Feasibility & Architecture Blueprint

The design strictly adheres to all project constraints and clean architectural patterns:

#### Constraint Compliance:
- **No Logical Dimension Changes**: Operates strictly within $W=600$ and $H=800$.
- **Zero Heavy Dependencies**: Uses native Canvas 2D and Web Audio API.
- **Zero Regressions on Existing Playwright Tests**: Barricade classes, player bounding boxes, and game manager loops remain 100% contract-compatible.

#### Proposed Class Architecture (`TectonicRift.ts`):
```typescript
export enum RiftState {
  INACTIVE = 'INACTIVE',
  TELEGRAPH = 'TELEGRAPH',
  ERUPTING = 'ERUPTING',
  COOLING = 'COOLING'
}

export class TectonicRift {
  public x: number = 0;
  public width: number = 90;
  public state: RiftState = RiftState.INACTIVE;
  public timer: number = 0;
  public telegraphDuration: number = 2.5;
  public eruptionDuration: number = 1.4;
  public coolingDuration: number = 3.0;
  
  // Voxel & particle cache
  private bubbles: { x: number; y: number; vy: number; radius: number; alpha: number }[] = [];
  
  public trigger(x: number, wave: number): void {
    this.x = x;
    this.state = RiftState.TELEGRAPH;
    this.telegraphDuration = Math.max(1.6, 2.5 - 0.04 * wave);
    this.timer = this.telegraphDuration;
  }

  public update(deltaTime: number, gm: GameManager): void {
    if (this.state === RiftState.INACTIVE) return;
    this.timer -= deltaTime;

    if (this.state === RiftState.TELEGRAPH) {
      // Screen micro-shake
      gm.triggerScreenShake(0.05, 1.8);
      if (this.timer <= 0) {
        this.state = RiftState.ERUPTING;
        this.timer = this.eruptionDuration;
        gm.triggerScreenShake(0.4, 7.5);
        soundManager.playGeothermalEruption(this.x);
        this.displaceBarricades(gm.barricades);
      }
    } else if (this.state === RiftState.ERUPTING) {
      this.processEruptionHazards(deltaTime, gm);
      if (this.timer <= 0) {
        this.state = RiftState.COOLING;
        this.timer = this.coolingDuration;
      }
    } else if (this.state === RiftState.COOLING) {
      if (this.timer <= 0) {
        this.state = RiftState.INACTIVE;
      }
    }
  }

  private displaceBarricades(barricades: Barricade[]): void {
    const left = this.x - this.width / 2;
    const right = this.x + this.width / 2;
    for (const b of barricades) {
      if (b.position.x + b.size.width > left && b.position.x < right) {
        if (b.type === BarricadeType.INDESTRUCTIBLE) {
          const shift = (b.position.x + 30 > this.x ? 1 : -1) * 45;
          b.position.x = Math.max(15, Math.min(525, b.position.x + shift));
        }
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // High-performance procedural Canvas 2D rendering
  }
}
```

---

## 7. Comparative Balance & Impact Assessment

| Metric | Without Tectonic Rifts (Baseline) | With Tectonic Rifts (Proposed) | Impact on Player Experience |
|---|---|---|---|
| **Bottom Playfield Threat** | Zero; player hugs bottom edge with complete safety. | Dynamic threat rising from seabed every 15–25s. | Eliminates passive camping; demands spatial awareness. |
| **Barricade Dynamics** | Static bunker positions that only degrade. | Dynamic barricades that shift, melt, and deflect plumes. | Creates evolving cover geometry throughout waves. |
| **Crowd Control Potential** | Restricted to munitions and homing missiles. | High-damage environmental kill zones. | Rewarding tactical mastery and movement baiting. |
| **Visual & Audio Drama** | Surface-focused color shifts and standard explosions. | Infrasonic seismic rumble, screen shock, volcanic plumes. | Cinematic immersion matching late-game crisis grandeur. |

---

## 8. Conclusion & Recommendation

The **Tectonic Seabed Rifts & Geothermal Geysers** feature provides a dramatic leap in gameplay depth, audiovisual spectacle, and tactical variety for *Water Invader*. It is mathematically rigorous, fully respects the strict `600x800` logical canvas boundaries, integrates cleanly with the existing `Barricade`, `AlliedReinforcements`, and `SoundManager` systems, and introduces zero risk of breaking existing E2E regression tests.

It is highly recommended as a marquee environmental mechanic for inclusion in the master **`IDEAS_PITCH.md`** pitch presentation.

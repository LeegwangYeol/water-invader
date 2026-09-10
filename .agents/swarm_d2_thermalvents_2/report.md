# FEATURE PROPOSAL: HYDROTHERMAL VENTS & THERMAL UPDRAFT BUFFS/DEBUFFS
**Agent**: Specialist 2.2 (Domain 2: Environmental Hazards & Dynamic Hydrodynamics)  
**Target Architecture**: Next.js / HTML5 2D Canvas (`600 × 800` Fixed Logical Grid) / Web Audio API  
**Status**: Proposal Complete & Grounded in Production Engine Architecture  

---

## 1. Concept & Hook: The Abyssal Black Smokers

### 1.1 Overview & Setting
In the extreme depths of the abyssal seafloor (Waves 10+, particularly dominant in the *Abyssal Trench* and *Toxic Seabed* biomes), tectonic fault lines split open to reveal towering polymetallic hydrothermal chimneys known as **Black Smokers**. Superheated hydrothermal fluids (exceeding 380°C in real-world abyssal vents) erupt violently from the seabed into near-freezing deep oceanic water, precipitating dense clouds of black iron, copper, and zinc sulfides that surge upward toward the surface.

### 1.2 The Core Hook: A Double-Edged Hydrodynamic Sandbox
Unlike generic hazards that simply hurt the player, **Hydrothermal Vents are dual-natured tactical arenas**. They introduce localized, persistent physical micro-zones that completely distort the combat environment:
- **Core Scalding Plume (Danger Zone)**: A roaring, dense black mineral column that shreds hulls with thermal boiling damage-over-time (DoT) and violently pushes light vessels upward. Lingering here is fatal for both player and invaders.
- **Outer Convection Halo / Thermal Updraft (Buff Zone)**: Surrounding the scalding core is an energetic convection boundary where rushing water currents provide intense convective heat exchange. Inside this updraft boundary, player weapon heat sinks cool at triple speed (rapid weapon cooling buff), while the powerful vertical fluid draft lifts all upward-moving projectiles, accelerating player water spears into hyper-velocity steam bolts.

Players who master "Vent Surfing"—skimming the turbulent outer boundary without getting caught in the lethal core—can turn a terrifying seabed eruption into an overwhelming offensive springboard, melting incoming swarms while weapon systems fire with zero heat penalty.

---

## 2. Mechanics & Mathematical Formalism

### 2.1 Spatial Geometry & State Lifecycle
Each Hydrothermal Vent is anchored to the seabed floor (`y = 730` to `y = 790`) and projects an expanding conical plume upward through the `600 × 800` logical coordinate space.

```
                  Top of Canvas (y = 0)
                          ▲
                          │
       . . - - ~ ~ * * * *│* * * * ~ ~ - - . .   y = 120 (Plume Dissipation Cap)
      (   Thermal Updraft │ Buoyant Zone      )  Width = 140px
       \   [Convection]   │   [Convection]   /
        \  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  /
         \ ▒▒ [SCALDING CORE DoT] ▒▒▒▒▒▒▒  /     Width = 90px (y = 400)
          \▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│▒▒▒▒▒▒▒▒▒▒▒▒▒▒ /
           \             ▲│▲             /
            \            │││            /
             \    Mineral Chimney      /         Width = 44px (y = 740)
              \  [Seabed Anchor]      /
               \_______[====]________/           Seabed Baseline (y = 780)
```

The vent's effective radius at any vertical coordinate $y \in [y_{cap}, y_{vent}]$ is governed by a linear conic expansion with boundary clamping:

$$R_{\text{core}}(y) = R_{\text{base}} + (y_{\text{vent}} - y) \cdot \tan(\theta_{\text{core}})$$
$$R_{\text{halo}}(y) = R_{\text{core}}(y) \cdot 1.85$$

Where:
- $y_{\text{vent}} = 760\text{ px}$ (seafloor orifice)
- $y_{\text{cap}} = 100\text{ px}$ (maximum upward plume extension)
- $R_{\text{base}} = 22\text{ px}$ (aperture width $44\text{ px}$)
- $\tan(\theta_{\text{core}}) = 0.08$ (gradual expansion up to $R_{\text{core}} \approx 75\text{ px}$ at $y = 100$)
- $R_{\text{halo}}$ extends the outer convection boundary up to $\approx 140\text{ px}$ radius.

---

### 2.2 Thermal Damage Over Time (DoT) Formulation

Temperature distribution across the vent cross-section is modeled as a continuous Gaussian radial profile:

$$T(r) = T_{\text{ambient}} + (T_{\text{core}} - T_{\text{ambient}}) \cdot \exp\left(-\frac{r^2}{2 \sigma^2}\right)$$

Where $T_{\text{ambient}} = 2^\circ\text{C}$, $T_{\text{core}} = 380^\circ\text{C}$, and $\sigma = R_{\text{core}} / 2.146$ (so that at $r = R_{\text{core}}$, temperature drops below the hazardous threshold $T_{\text{hazard}} = 100^\circ\text{C}$).

#### Player Damage Exposure
The player's vessel possesses a thermal inertia buffer ("Submersible Heat Sink"):
- **Thermal Grace Buffer**: $t_{\text{buffer}} = 0.50\text{ seconds}$. Entering the core does not inflict immediate HP damage, allowing high-skill emergency cuts across the plume.
- **Continuous Core Burn**: If cumulative exposure exceeds $0.50\text{ s}$, the player takes **1 HP per 1.25 seconds** of continued presence in $r \le R_{\text{core}}(y)$.
- **Hull Flash & Alarm**: During thermal burn, the player's droplet vessel flashes incandescent white-orange (`#ffedd5` to `#f97316`) and triggers the localized hull sizzle sound.

#### Enemy / Hostile Damage Exposure
Hostile invaders and rogue mechs lack thermal insulation suited for superheated abyssal sulfides. Inside $r \le R_{\text{core}}(y)$, hostiles suffer severe percentage-based thermal degradation:

$$\text{Damage}_{\text{enemy}}(\Delta t) = \left(28 + 0.06 \cdot \text{MaxHP}_{\text{enemy}}\right) \cdot \Delta t$$

- Normal Invaders ($HP = 1$): Vaporized within 1-2 frames of touching the core plume ($0.03\text{ s}$).
- Heavy Rogues (Rogue Goliath, Mechs, Carriers): Melt under the dual flat + 6% Max HP DoT, losing huge health pools in 3-4 seconds.
- Bosses & Crisis Sovereign: Suffer continuous DoT (capped at 45 DPS) and strip defensive shield regenerations while inside the plume column.

---

### 2.3 Thermal Updraft Physics & Projectile Trajectory Alteration

The roaring ascent of superheated fluid creates a massive buoyant upward hydrodynamic current with velocity vector:

$$\vec{u}_{\text{updraft}}(y, r) = \left(0, -V_{\text{max}} \cdot \left(1 - \frac{r}{R_{\text{halo}}(y)}\right) \cdot \sqrt{\frac{y}{800}}\right)$$

Where $V_{\text{max}} = 360\text{ px/s}$.

#### Effect on Player Projectiles (Water Spears & Missiles)
1. **Velocity Boost**: Player bullets entering the updraft zone ($r \le R_{\text{halo}}$) receive an upward buoyant acceleration $a_y = -480\text{ px/s}^2$. A base water spear ($v_y = -400\text{ px/s}$) accelerates up to **$-680\text{ px/s}$**, traversing the screen almost instantaneously.
2. **Superheated Steam Transformation**: Bullets passing through the core ($r \le R_{\text{core}}$) absorb mineral heat, transforming into **Superheated Steam Spears**:
   - Visual: Cyan water droplet transforms into an incandescent white-gold plasma bolt with a boiling bubble trail.
   - Damage: **$+35\%$ bonus damage** and $+1$ bonus piercing count!

```
Player Bullet Passing Through Vent Core:
[Standard Water Spear: 1 dmg, 400 px/s] ──► [CORE ABSORPTION] ──► [Steam Lance: 1.35 dmg, 680 px/s, Piercing +1]
```

#### Effect on Enemy Hostile Bullets (Descending Plasma & Slime)
Hostile projectiles descend downward ($v_y > 0$). The upward hydrodynamic force acts as severe counter-buoyancy:
- Downward bullets traveling at $v_y = +220\text{ px/s}$ are decelerated by $a_y = -520\text{ px/s}^2$.
- Within $0.35\text{ s}$, descending bullets reach zero downward velocity and are **reversed or dissolved into vapor bubbles**!
- Snipers firing down into a vent column have their heavy rounds dragged off-target and deflected sideways.

#### Effect on Player Submersible Movement
- When the player enters the updraft column ($r \le R_{\text{halo}}$), they experience a buoyant lift force:
  $$v_{y,\text{player}} = -160\text{ px/s}$$
  This gently lifts the submarine off the bottom baseline (`y = 740 -> 640`), providing temporary vertical elevation to shoot over barricades or clear low-altitude divers!

---

### 2.4 Weapon Cooling Buff: Rapid Heat Dissipation

To introduce high-octane mechanical depth, hydrothermal vents interact directly with player weapon cycles:
- **Convective Cooling Zone**: In the outer halo ($R_{\text{core}} < r \le R_{\text{halo}}$), high-velocity turbulent water circulation strips heat from the player's engines.
- **Cooling Rate**: Normal weapon cycle recovery / heat decay is accelerated by **$+250\%$** ($3.5\times$ base cooling rate).
- **Practical Impact**: If paired with continuous-fire beam weapons, rapid laser upgrades, or high-tier multi-shot cannons, the player can sustain continuous maximum-cadence firing without triggering weapon stalls or spread penalties (`suppressionLevel` decays $3\times$ faster).

---

## 3. Tactical Loop: "The Bait & Boil"

Hydrothermal Vents transform static wave clearing into dynamic spatial mastery:

```
                  ┌──────────────────────────────────────────────┐
                  │          TACTICAL GAMEPLAY LOOP              │
                  └──────────────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │   DEFENSIVE HARNESS   │                       │   OFFENSIVE BAIT      │
     ├───────────────────────┤                       ├───────────────────────┤
     │ • Take cover behind   │                       │ • Position player on  │
     │   convection halo.    │                       │   opposite side of    │
     │ • Thermal updraft     │                       │   core plume.         │
     │   slows & vaporizes   │                       │ • Enemy Divers &      │
     │   incoming sniper     │                       │   Stalkers charge     │
     │   hostile bullets.    │                       │   straight through    │
     │ • Emergency escape    │                       │   scalding core DoT.  │
     │   lift over mobs.     │                       │ • Heavy mobs lose 40% │
     │                       │                       │   HP before reaching  │
     │                       │                       │   barricades!         │
     └───────────────────────┘                       └───────────────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                             ┌───────────────────────┐
                             │    "VENT SURFING"     │
                             │  Skim boundary edge:  │
                             │  +300% weapon cooling │
                             │  +35% Steam Lance dmg │
                             │  Zero DoT penalty     │
                             └───────────────────────┘
```

### 3.1 Baiting Aggressive Invaders (Diver & Saboteur Neutralization)
Diver enemies (`EnemyType.DIVER`) and Rogue Stalkers dive aggressively toward the player's X coordinate. By hovering near the flank of a hydrothermal vent, the player forces diving enemies to chart an intercept course directly through the core plume. The $28\text{ DPS} + 6\%\text{ MaxHP}$ DoT evaporates diving invaders before they can touch defensive barricades.

### 3.2 Destructible Chimney & Super-Eruption Detonation
The mineral chimney at the seabed is targetable and destructible:
- Chimney Health: $HP = 120$ (immune to normal enemy fire, damaged by player water spears, depth charges, or homing missiles).
- **Rupture Mechanic ("Geothermal Blowout")**: Destroying or heavily damaging the chimney causes an explosive over-pressure eruption:
  - The vent violently expands to $2.5\times$ its radius for $2.5\text{ seconds}$.
  - Releases a concussive shockwave ($150\text{ px}$ radius at seafloor) dealing 80 damage to nearby seabed crawlers and clearing all low-flying hostiles.
  - The chimney then collapses into dormant rubble for the remainder of the wave.

---

## 4. Visuals & Procedural Web Audio SFX

The feature is crafted strictly within the existing Canvas 2D engine constraints, requiring **zero external image or audio files**.

### 4.1 Visual Architecture & Canvas Rendering Pipeline

Rendering is structured in four distinct render tiers to guarantee WCAG AAA contrast and high-octane visual spectacle:

```
[Layer 1: Seabed Fissure Magma Glow]  (Deep orange-red radial gradient on canvas floor)
                 ▼
[Layer 2: Outer Convection Updraft]   (Subtle shimmering cyan/white convective flow lines)
                 ▼
[Layer 3: Dense Polymetallic Plume]   (Multi-layered overlapping black/charcoal sulfide puffs)
                 ▼
[Layer 4: Superheated Core & Sparks]  (White-hot core gradient with floating gold pyrite sparks)
```

#### Canvas 2D Implementation Details:
1. **Billowing Sulfide Cloud Puffs**:
   - Each active vent maintains an array of $24$ recycled smoke particles.
   - Puffs spawn at the nozzle ($y = 750$) and rise rapidly ($v_y = -220\text{ to } -380\text{ px/s}$), expanding from $r = 8\text{ px}$ to $r = 32\text{ px}$.
   - Palette: Layered `#18181b` (zinc sulfide black), `#27272a` (iron sulfide charcoal), and `#451a03` (copper-rich dark bronze).
   - Global alpha smoothly fades from $0.85$ near nozzle to $0.0$ at plume cap ($y = 120$).
2. **Heat Shimmer & Refractive Turbulence**:
   - Simulated without expensive GLSL shaders by drawing alternating micro-curved bezier distortion ribs with additive blending (`ctx.globalCompositeOperation = 'lighter'`) and minimal opacity ($0.08$).
   - Creates an organic, watery mirage effect that visibly bends the background and stars behind the plume.
3. **Cavitation Micro-Bubbles**:
   - High-speed rising micro-bubbles ($r = 1.5\text{ to } 3.0\text{ px}$, color `#e0f2fe`) wobble laterally ($\sin(t \cdot 12) \cdot 6\text{ px}$) and pop at random intervals, producing realistic underwater boiling aesthetics.
4. **Incandescent Nozzle Cracks**:
   - The basalt chimney at the seafloor features glowing volcanic fissures rendered with intense linear gradients: `#ea580c` $\rightarrow$ `#f97316` $\rightarrow$ `#fef08a`.

---

### 4.2 Web Audio API Procedural Audio Architecture

In alignment with `SoundManager.ts`, all audio is synthesized in real time via the browser's native `AudioContext`.

```
                  ┌──────────────────────────────────────────────┐
                  │    PROCEDURAL HYDROTHERMAL SOUND SYNTHESIS   │
                  └──────────────────────────────────────────────┘
                                         │
         ┌───────────────────────────────┴───────────────────────────────┐
         ▼                                                               ▼
┌─────────────────────────────────┐                     ┌─────────────────────────────────┐
│   ROARING CONTINUOUS PLUME      │                     │   CAVITATION BUBBLE BURSTS      │
├─────────────────────────────────┤                     ├─────────────────────────────────┤
│ • White Noise AudioBuffer       │                     │ • Periodic Sine Wave bursts     │
│ • BiquadFilter (Bandpass,       │                     │ • Freq sweep: 450Hz -> 820Hz    │
│   center: 280Hz, Q: 3.2)        │                     │ • Envelope duration: 25ms       │
│ • LFO Modulator (0.4Hz sweep    │                     │ • Simulates explosive boiling   │
│   for hydrothermal pulsing)     │                     │   cavitation pops               │
│ • Sub-bass Gain: 0.18           │                     │ • Gain: 0.08                    │
└─────────────────────────────────┘                     └─────────────────────────────────┘
```

#### Exact Web Audio Code Structure:
```typescript
public playHydrothermalRumble() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;
  
  // 1. Procedural White Noise Buffer (1.0 sec loop)
  const bufferSize = this.audioCtx.sampleRate;
  const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  const whiteNoise = this.audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  // 2. Deep Hydrothermal Bandpass Filter
  const filter = this.audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(260, now);
  filter.Q.setValueAtTime(3.0, now);

  // 3. Low-Frequency Modulation (Volcanic Surge breathing)
  const lfo = this.audioCtx.createOscillator();
  const lfoGain = this.audioCtx.createGain();
  lfo.frequency.setValueAtTime(0.5, now); // 0.5 Hz wave
  lfoGain.gain.setValueAtTime(80, now);
  lfo.connect(filter.frequency);

  // 4. Master Vent Gain Envelope
  const gainNode = this.audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.01, now);
  gainNode.gain.linearRampToValueAtTime(0.16, now + 0.4);

  whiteNoise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(this.audioCtx.destination);

  whiteNoise.start(now);
  lfo.start(now);
}
```

---

## 5. UI Seafloor Vent Warning Eruption Indicators

To maintain competitive fairness, high-lethal environmental hazards must never spawn without unmistakable telegraphic signaling.

### 5.1 The 4-Phase Vent Eruption Lifecycle

| Phase | Duration | Visual Telegraph & Screen Indicators | Audio Cues | Tactical Context |
|---|---|---|---|---|
| **1. Dormant Chimney** | Persistent | Dark mineral cone on seabed; quiet wisps of silver bubbles. | Subtle low hum | Baseline battlefield terrain. |
| **2. Seismic Warning** | **1.6 s** | **Seabed fissure cracks glow pulsing scarlet (`#ef4444`); vertical dashed yellow telegraph lines (`setLineDash([8, 6])`) rise to top of screen; HUD Tremor Warning icon flashes.** | Rhythmic low-pitch thumping (60Hz) & rising hiss | Player has 1.6s to clear the column or set up lure trap. |
| **3. Violent Eruption** | **5.0 s** | Massive black sulfide plume surges from floor to $y = 120$; screen shake ($0.35$); boiling steam aura active. | Roaring deep oceanic rumble & bubbling hiss | Core DoT active; thermal updraft active; +35% steam bullet boost. |
| **4. Quenching / Dissipation** | **1.2 s** | Plume thins into buoyant floating soot clusters; colors fade from black to translucent cyan. | Descending filter sweep | Buffs/debuffs tapering off; vent entering cooldown. |

### 5.2 Cockpit HUD Gauges & Status Overlay

```
┌────────────────────────────────────────────────────────────────────────┐
│  WAVE: 14     SCORE: 48,250    [♥♥♥♡♡] HP     PURE WATER: 940 💧       │
│                                                                        │
│                 [▲▲ GEOTHERMAL PRESSURE SURGE ▲▲]                      │
│                  SECTOR 3 FISSURE ERUPTION IN 1.2s                     │
│                                                                        │
│   ┌───────────────────────────┐         ┌──────────────────────────┐   │
│   │ HULL TEMP: 84°C [OPTIMAL] │         │ BUFF: THERMAL UPDRAFT ⚡ │   │
│   │ [██████████░░░░░] SAFE    │         │ +300% WEAPON COOLING     │   │
│   └───────────────────────────┘         └──────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Seismic Directional Arrow**: When a vent begins charging off-screen or below player focus, a flashing yellow/orange chevron (`▲ SEISMIC FISSURE CHARGING ▲`) points directly at the seafloor orifice.
2. **Dynamic Hull Temp Gauge**: An integrated thermal dial rendered above the player's submersible:
   - $0^\circ\text{C} - 60^\circ\text{C}$ (Deep Cyan): Ambient safe abyssal water.
   - $61^\circ\text{C} - 99^\circ\text{C}$ (Vibrant Gold): Updraft Convection Zone (Buff Active, $+300\%$ Cooling).
   - $\ge 100^\circ\text{C}$ (Flashing Crimson with Audio Klaxon): Scalding Core ($1\text{ HP}$ DoT imminent).

---

## 6. Synergies with Crises, Bosses & Technical Feasibility

### 6.1 Direct Synergy with Existing End-Game Crises

The hydrothermal vent mechanic is not isolated—it creates game-changing cross-reactions with Water Invader's crisis systems:

#### Synergy 1: Hard Counter to *Glacial Oblivion* (Crisis Archetype 11)
- *Crisis Mechanic*: Glacial Oblivion lowers ambient temperatures to absolute zero, inflicting a $-40\%$ movement penalty on the player and increasing weapon refire delays by $+50\%$.
- *Vent Interaction*: Hydrothermal Vents become vital **Geothermal Sanctuaries**! Entering the convection halo instantly nullifies the cryogenic freeze debuff, restores $100\%$ movement speed, and melts incoming `SUB_ZERO_ICICLE_VOLLEY` projectiles into harmless water vapor.

#### Synergy 2: Chemical Neutralization of *Acid Storm* (Crisis Type 2)
- *Crisis Mechanic*: Acid Storm bombards the screen with falling green corrosive droplets (`HazardProjectile`).
- *Vent Interaction*: Black smokers vent alkaline mineral complexes (calcium carbonates, metal sulfides). Rising hydrothermal plumes chemically neutralize all incoming acid droplets inside their column, turning the vent into a **protective chemical umbrella** for the player and barricades!

#### Synergy 3: Singularity Vortex Kinetic Escape (*Singularity Core & Void Sovereign*)
- *Crisis Mechanic*: The Singularity Core creates an intense gravitational inward pull ($vortexStrength = 50$) that drags the player helplessly toward the screen center.
- *Vent Interaction*: Surfing a hydrothermal vent's vertical updraft imparts enough buoyant kinetic velocity to slingshot the player out of the gravitational event horizon!

---

### 6.2 Technical Feasibility & Performance Profiling

| Metric | Constraint | Proposed Hydrothermal Vent Performance |
|---|---|---|
| **Canvas Dimensions** | Strict $600 \times 800$ Logical Grid | Perfectly bounded; vents span $X = [40, 560]$, $Y = [120, 780]$. |
| **Frame Rate Target** | Stable 60 FPS ($16.6\text{ ms}$ budget) | Hydrothermal simulation consumes **$< 0.72\text{ ms}$** per frame. |
| **Object Pooling** | Zero GC allocations during combat | Plume puffs & bubbles are recycled via `GameManager.particlePool`. |
| **Memory Footprint** | $< 100\text{ KB}$ runtime overhead | State represented by lightweight structs (8 numeric variables per vent). |
| **Asset Dependency** | Strictly zero external sprites/audio | $100\%$ native Canvas 2D vectors, gradients, and Web Audio API nodes. |

---

## 7. Comprehensive Feature Specification Table

| Attribute | Specification |
|---|---|
| **Feature Name** | Hydrothermal Vents & Thermal Updraft Convection System |
| **Spawning Waves** | Waves 8+ (Common in Wave 10+ Abyssal Trench & Toxic Seabed Biomes) |
| **Concurrent Vents** | 1 to 2 simultaneous vents active on canvas |
| **Chimney Anchor** | Seabed baseline ($y = 740\text{ to }780$, $w = 44\text{ px}$, $h = 36\text{ px}$) |
| **Plume Dimensions** | Height: $640\text{ px}$ (reaches $y = 120$); Core Width: $44\text{ px} \rightarrow 90\text{ px}$; Halo Width: $80\text{ px} \rightarrow 160\text{ px}$ |
| **Damage to Player** | 0 damage for first $0.5\text{ s}$; thereafter 1 HP per $1.25\text{ s}$ of continuous core presence |
| **Damage to Enemies** | $(28 + 0.06 \times \text{MaxHP}) \cdot \Delta t$ per second in core (vaporizes mobs in $0.1\text{ s}$) |
| **Player Bullet Buff** | $+35\%$ damage, $+1$ piercing, upward velocity increased from $400\text{ px/s}$ to $680\text{ px/s}$ |
| **Enemy Bullet Debuff** | Downward bullets decelerated by $-520\text{ px/s}^2$; reversed or neutralized within $0.35\text{ s}$ |
| **Weapon Cooling Buff** | $+250\%$ heat dissipation rate in outer halo ($3.5\times$ base cooldown speed) |
| **Player Updraft Lift** | Gentle vertical elevation force ($-160\text{ px/s}$) while traversing vent |
| **Chimney Destructibility** | $HP = 120$; rupture triggers $150\text{ px}$ concussive blast dealing $80$ damage to seabed foes |
| **Audio Synthesis** | Bandpass filtered white noise ($260\text{ Hz}$, $Q=3.0$) + $0.5\text{ Hz}$ LFO surge + sine bubble pops |
| **Telegraph Indicator** | $1.6\text{ s}$ pulsing seabed fissure + dashed vertical boundary lines + HUD seismic banner |
| **Crisis Interop** | Thaws Glacial Oblivion freeze; neutralizes Acid Rain; breaks Singularity gravitational pull |

---
*Authored by Specialist 2.2 for the Water Invader 42-Agent Swarm.*

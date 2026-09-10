# Comprehensive Feature Proposal: Toxic Phytoplankton Blooms & Corrosive Red Tide
**Document ID**: WI-SPEC-D2-TOXICBLOOMS-04  
**Author**: Specialist 2.4 — Swarm Domain 2 (Environmental Hazards & Dynamic Biomes)  
**Target Project**: Water Invader (Next.js / HTML5 Canvas 2D / TypeScript Game Engine)  
**Status**: Complete Proposal & Architecture Plan (NO CODE MODIFICATIONS PER CONSTRAINT)

---

## Executive Summary
This proposal introduces **Toxic Phytoplankton Blooms & Corrosive Red Tide**, an organic, volumetric spatial hazard system that dynamically alters the underwater battlefield of *Water Invader*. Unlike instantaneous or purely directional weather hazards (such as the vertical falling droplets of the existing `ACID_STORM`), Phytoplankton Blooms exist as persistent, drifting biological fluid masses governed by fluid currents, cellular life cycles, and biochemical interactions.

The core tension is biological asymmetry:
1. **Mechanical Deterioration**: Synthetic materials, metal hulls (the player vessel, defensive barricades, and mechanical Rogue Mechs) suffer continuous catalytic oxidation and voxel rot.
2. **Organic Proliferation**: Extraterrestrial bio-invaders (Chitinous swarms, splitters, bio-larvae, and broodmasters) enter symbiotic resonance, gaining rapid cell regeneration and attack haste within the blooms.
3. **Tactical Intervention**: Players must physically manage the aquatic environment through deployable neutralization chemicals, precision interception of floating algal spore pods, and tactical positioning to prevent lethal eutrophication.

---

## 1. Concept & Hook

### 1.1 The Thematic Fantasy: "The Crimson Eutrophication"
Beneath the celestial ocean of *Water Invader*, alien agricultural runoff and bio-weapon residue trigger catastrophic algal blooms. Microscopic dinoflagellates and cyanobacteria rapidly multiply into massive, pulsating clouds that drift across the screen. As nutrient densities peak, the bloom metastasizes into a **Corrosive Red Tide** (*Karenia Sanguinea*), turning clear waters into an anoxic, bio-luminescent graveyard.

### 1.2 The Core Asymmetry
- **For the Player & Barricades**: The blooms release concentrated neurotoxic and acidolytic enzymes (saxitoxin analogs and hydrogen sulfide complexes). Metal alloys corrode, optical sensors distort, and the defensive barricades dissolve block by block into necrotic sludge.
- **For Organic Bio-Invaders**: Invader species share genetic ancestry with the extraterrestrial algae. The bloom provides an hyper-oxygenated nutrient bath that rapidly knits their chitinous carapaces, accelerates synaptic firing, and shields them from energy fire.
- **For Third-Faction Rogues**: Mechanical Rogues (Rogue Drones, Mechs, and Carriers) are synthetic and thus suffer the same corrosive breakdown as the player, leading to frantic three-way battlefield dynamics where Rogues panic-fire into both player and bloom clusters.

### 1.3 Why It Hooks the Player
- **Spatial Strategy over Twitch Dodging**: Rather than just dodging bullets along the bottom axis, players must read the ocean drift, navigate around expanding toxic fog, and decide whether to expend ammo popping incoming Spore Pods or burning down bio-invaders before they retreat into the healing mists.
- **Dynamic Terrain in an Open Arena**: Water Invader's canvas shifts from an empty void into an evolving tactical topography with dangerous choke points and safe pockets.

---

## 2. Mechanics & Mathematical Models

### 2.1 Bloom Lifecycle & Data Structures
Each bloom consists of a dynamic cluster of organic fluid discs with soft Gaussian falloff.

```typescript
export interface AlgaeSporePod {
  id: string;
  x: number;
  y: number;
  radius: number;           // 18 - 28px
  hp: number;               // 40 - 80 HP
  maxHp: number;
  incubationTimer: number;  // 6.0s countdown to detonation
  driftVelocity: Vector2D;  // Drift speed driven by sub-currents (e.g., dx: 15 px/s, dy: 25 px/s)
  stage: 'INCUBATING' | 'BLOOMING' | 'RUPTURED';
  pulsePhase: number;
}

export interface ToxicBloomCell {
  id: string;
  x: number;
  y: number;
  radius: number;           // 40 - 110px dynamic radius
  maxRadius: number;
  density: number;          // 0.0 (fading) to 1.0 (peak red tide)
  type: 'CHLOROPHYTE_GREEN' | 'CORROSIVE_RED_TIDE';
  driftVelocity: Vector2D;
  lifeTime: number;         // Current age in seconds
  maxLifeTime: number;      // 12.0s to 24.0s
  expansionRate: number;    // px per second
  acidityMultiplier: number;
}
```

#### Lifecycle Phases:
1. **Infiltration (Spore Stage - 0.0s to 6.0s)**: High-density Algae Pods descend from the upper boundary. If not destroyed, they burst into 2-3 expanding Bloom Cells.
2. **Proliferation (Green Chlorophyte Bloom - 0.0s to 8.0s)**: Initial green algae cloud. Mild hull corrosion (1.5 HP/sec), moderate enemy healing (+2% HP/sec).
3. **Eutrophic Climax (Corrosive Red Tide - 8.0s to 18.0s)**: The bloom shifts from emerald green to deep bioluminescent crimson/rust. Toxicity doubles: severe hull corrosion (4.5 HP/sec), intense enemy healing (+5% HP/sec), and barricade voxel disintegration.
4. **Senescence & Decay (18.0s to 22.0s)**: Nutrient exhaustion causes the bloom to turn brown and dissolve into harmless organic particles.

---

### 2.2 Mathematical Formulas for Damage & Buffs

#### A. Player Hull Corrosion Formula
When the player vessel overlaps with one or more Bloom Cells, corrosion damage is evaluated every frame ($\Delta t$):

$$\text{OverlapRatio}(i) = \max\left(0, 1 - \frac{\text{Distance}(\text{Player}, \text{Bloom}_i)}{\text{Radius}_i}\right)$$

$$\text{EffectiveToxicity} = \sum_{i \in \text{Overlapping}} \text{Density}_i \times \text{AcidityMult}_i \times \text{OverlapRatio}(i)$$

$$\text{DPS}_{\text{corrosion}} = D_{\text{base}} \times \left(1 + \text{EffectiveToxicity} \times \alpha_{\text{toxicity}}\right) \times (1 - \text{Resist}_{\text{hull}})$$

**Tuned Parameters**:
- $D_{\text{base}} = 3.0 \text{ HP/second}$ (Green Bloom) / $6.0 \text{ HP/second}$ (Red Tide)
- $\alpha_{\text{toxicity}} = 0.75$
- $\text{Resist}_{\text{hull}} = 0.0$ default; reduced by $0.50$ (50% reduction) if player purchases the *Anti-Corrosive Polymer Coating* shop upgrade; reduced to $0.0$ damage if sheltered inside an *Ozone Aerator Bubble*.

#### B. Bio-Invader Regeneration Formula
Organic Invader entities inside the bloom absorb nutrients:

$$\text{HealPerSecond}(E) = \min\left(E.\text{maxHp} \times 0.04, 12\right) \times \text{Density} \times \text{BioAffinity}$$

- $\text{BioAffinity}$:
  - Regular Invader (NORMAL, ZIGZAG, SPLITTER): $1.0$
  - Boss / Leviathan / Saboteur: $0.65$ (capped at $15 \text{ HP/sec}$ to prevent unkillable stall states)
  - Synthetic Rogues (ROGUE_DRONE, ROGUE_MECH): $-0.80$ (Rogues take damage instead of healing!)

#### C. Barricade Biological Rot (Voxel Decay)
Water Invader features 24-voxel destructible barricades (6 cols $\times$ 4 rows, 20 HP). When a bloom intersects a barricade:
- Every $0.4 \text{ seconds}$, a rot tick triggers:
  $$P(\text{voxel\_rot}) = 0.25 \times \text{EffectiveToxicity}$$
- On successful roll, 1 voxel is dissolved, emitting a green/red sizzling smoke particle, bypassing projectile armor!

---

### 2.3 Deployable Neutralization Chemistry & Counter-Play
Players can deploy counter-measures to clear blooms:
1. **Copper Sulphate Neutralizer Pod (Shop Active / Key 'E' or Spacebar Drop)**:
   - Cost: 75 Currency (or replenishable drop from elite units).
   - Deploys a floating chemical disperser canister at the player's position.
   - Explodes in a cyan-tinted chemical mist ($R = 120\text{px}$).
   - Chemical Reaction: Instantly reduces all intersecting bloom radii by $75\%$ and reverts Red Tide toxicity to $0$, producing harmless, clear water bubbles.
2. **Ozone Aerator Safe Zone**:
   - Anchors an oxygenation dome ($R = 85\text{px}$) for $8.0\text{s}$. Inside this dome, atmospheric toxicity is $0$, player shields recharge $+10\%$ faster, and all incoming toxic droplets/spores vaporize upon contact.

---

## 3. Tactical Gameplay Loop

### 3.1 The Micro-Loop: Intercept, Zone, and Protect
```
         [Spore Pods Descend]
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
[Pop Pods Early]       [Pod Reaches Depth]
  • Drops Nutrient       • Explodes into Red Tide
    Crystals (Money)     • Barricades Start Rotting
                         • Enemies Swarm into Mist
                               │
                               ▼
                   [Deploy Neutralizer OR]
                   [Kite Enemies out to Clear Water]
```

### 3.2 Key Tactical Decisions
1. **Pod Prioritization vs Invader Suppression**:
   - Spore Pods take 3-4 basic shots to pop. Ignoring a pod allows it to create a massive red tide zone right over your barricades.
   - Popping a pod before it matures awards +25 Bio-Essence (Currency) and a satisfying wet pop explosion that stuns nearby light invaders for $0.8\text{s}$.
2. **Environmental Herding (Kiting)**:
   - Enemies inside the bloom are dangerous sponges. Smart players bait enemies across the clear boundary line where they lose their HP regeneration and haste buffs.
3. **Barricade Preservation**:
   - In late waves, Saboteurs often coordinate with Red Tides. While Saboteurs drill the physical voxels, the biological rot dissolves structural integrity from above. Deploying a Neutralizer Canister on top of a decaying barricade immediately halts voxel decay and sanitizes the area.

---

## 4. Visuals, Shaders & Audio Synthesis

### 4.1 Canvas 2D Rendering Pipeline (Zero WebGL Dependency)
The visual presentation uses multi-layered Canvas 2D techniques optimized for 60 FPS:

```
[Layer 1: Deep Caustic Underlay]
  └─ ctx.createRadialGradient() with 'screen' blend mode
  └─ Soft pulsing green/crimson cellular discs with sine-wave breathing radii:
     r = baseRadius + sin(time * 2.5 + cellIndex) * 6

[Layer 2: Bio-luminescent Bloom Nucleus]
  └─ Inner nucleus: Bright neon green (#10b981) or virulent crimson (#f43f5e)
  └─ Outer plume: Diffuse toxic haze (rgba(16, 185, 129, 0.15) -> rgba(225, 29, 72, 0.22))

[Layer 3: Sizzling Chemical Bubble Particles]
  └─ 15-30 micro-bubbles per cell drifting upward (speedY: -20 to -45 px/s)
  └─ Sizzling pops at water surface emitting tiny micro-sparks (#bef264, #fca5a5)

[Layer 4: Entity Corrosion Shading]
  └─ When player or barricade overlaps:
     ctx.shadowColor = '#84cc16' or '#ef4444'
     ctx.shadowBlur = 10 + sin(time * 12) * 4
     Tiny sizzling sparks emit from ship wings every 4 frames
```

### 4.2 Web Audio API Procedural SFX (No External Assets)
Fully synthesizable using `AudioContext` nodes adhering to `SoundManager.ts` patterns:

#### 1. Toxic Bloom Gurgle / Viscous Bubble Pop (`playToxicBubbleSound()`)
- **Oscillator**: Triangle/Sine mix with dynamic Frequency Modulation (FM).
- **Modulation**: Carrier frequency at $420\text{Hz}$, mod frequency at $32\text{Hz}$, pitch envelope diving to $140\text{Hz}$ over $0.18\text{s}$.
- **Gain**: Rapid attack ($0.01\text{s}$) with quadratic exponential decay, simulating a viscous methane/sulfide bubble surfacing and bursting.

#### 2. Hull Corrosion Sizzle (`playCorrosionSizzleSound()`)
- **Noise Generator**: Procedural white-noise AudioBuffer fed into a dynamic BiquadFilter (Bandpass, center freq: $3200\text{Hz}$, Q: $4.5$).
- **Tremolo**: Amplitude modulated by an LFO at $18\text{Hz}$, creating a crisp, terrifying frying-pan sizzle when hull metal dissolves.

#### 3. Pod Rupture / Wet Pop (`playPodRuptureSound()`)
- **Dual Element**: A low-frequency sub-bass thump ($90\text{Hz} \to 35\text{Hz}$ over $0.25\text{s}$) combined with a snappy organic transient click ($1800\text{Hz} \to 300\text{Hz}$).

---

## 5. UI Atmospheric & Aquatic Toxicity Gauge

### 5.1 HUD Architecture
A dedicated **Toxicity Monitor** renders seamlessly on the game canvas HUD (top-right or adjacent to the Threat Level indicator):

```
┌────────────────────────────────────────────────────────┐
│ [BIO-HAZARD] RED TIDE SEVERITY                         │
│ [████████████████████░░░░░░░░░░░░░░] 64% - TOXIC STAGE │
│ ⚠ BIO-REGENERATION ACTIVE | HULL CORROSION: 3.2 HP/s   │
└────────────────────────────────────────────────────────┘
```

### 5.2 Gauge Progression Stages

| Toxicity Range | Status Name | Color Code | Environmental Effects |
| :--- | :--- | :--- | :--- |
| **0% – 25%** | **NOMINAL WATER** | `#38bdf8` (Cyan) | Clear water, standard projectile physics. |
| **26% – 55%** | **ALGAL SWELL** | `#10b981` (Emerald) | Scattered green clouds; +15% enemy move speed; +1.5 HP/s enemy heal. |
| **56% – 85%** | **CORROSIVE RED TIDE** | `#f59e0b` (Amber/Orange) | Water turns murky amber/crimson; player hull corrodes; barricades rot. |
| **86% – 100%**| **ANOXIC EXTINCTION** | `#dc2626` (Neon Red Pulse)| Screen edge vignette pulses crimson; hazardous gas geysers erupt; emergency siren blips. |

### 5.3 Screen Vignette & Post-FX
When atmospheric toxicity exceeds $60\%$:
- An animated radial vignette (`radial-gradient(ellipse at center, transparent 70%, rgba(220, 38, 38, alpha))`) pulses synchronously with player heartbeat.
- Faint chromatic aberration / caustic ripple displacement simulation via subtle offset canvas drawing.

---

## 6. Synergies with Acid Rain & Implementation Feasibility

### 6.1 Mechanical Synergy with Existing Systems
1. **Acid Storm Interaction (`ACID_STORM` + Red Tide)**:
   - When Acid Storm rain droplets (already in `GameManager.ts` line 1442) impact an active Phytoplankton Bloom, an **Exothermic Acid Splash** reaction triggers.
   - The droplet is consumed, releasing a secondary ring of caustic micro-shrapnel that deals radial damage to both players and non-bio units.
2. **Differentiation from `hasAcidShield`**:
   - The current `hasAcidShield` item protects solely against vertical falling rain from above.
   - Toxic Blooms surround the vessel horizontally and immersion-wise from below.
   - This creates meaningful upgrade progression:
     - Tier 1: *Acid Shield* (Overhead canopy defense).
     - Tier 2: *Bio-Polymer Hull Coating* (Subsurface immersion defense).
     - Active Item: *Neutralizer Canister* (Tactical area purge).
3. **Synergy with Saboteur Enemies**:
   - Saboteurs (added in recent updates) seek out barricades to gnaw them down. In a Red Tide, Saboteurs gain a toxic damage aura, turning them into high-priority mini-boss threats.

### 6.2 Implementation Feasibility & Engine Safety
- **Zero Modifications to Logical Dimensions**: Operates strictly within logical boundaries ($800 \times 600$), zero risk to Playwright viewport tests.
- **Garbage Collection & Performance Budget**:
  - Bloom cells use an object pool (maximum 8 active bloom clusters at any time).
  - Bubbles and sizzle particles recycle indices from a pre-allocated array of 120 particles.
  - Per-frame collision checks use simple Euclidean squared-distance ($dx \times dx + dy \times dy < r^2$), requiring $< 0.05\text{ms}$ CPU time per frame on mobile.
- **Architectural Placement**:
  - Cleanly encapsulated in `src/game/hazards/ToxicBloomManager.ts` (when implemented in future milestones).
  - Hooks into `GameManager.update()` and `GameManager.draw()` with single-line lifecycle calls.

---

## Conclusion & Recommendation
The **Toxic Phytoplankton Blooms & Corrosive Red Tide** hazard elevates *Water Invader* from a standard space-invaders arcade shooter into an atmospheric, tactically rich underwater survival experience. It delivers visceral audio-visual feedback, deep synergy with existing acid and barricade mechanics, and compelling risk-reward micro-gameplay.

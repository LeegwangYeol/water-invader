# Feature Proposal: Cavitation Torpedoes & Acoustic Shockwave Mechanics
**Agent Specialist 1.1 — Weapons & Hydrodynamic Combat Systems**  
**Project**: Water Invader (Next.js / HTML5 Canvas 60 FPS Tactical Shooter)  
**Document Classification**: Architectural & Design Pitch (Phase 0 Swarm Ideation)  
**Target File**: `.agents/swarm_d1_cavitation_1/report.md`  

---

## Executive Summary

The **Cavitation Torpedo (해저 공동 어뢰 — "Aegis-Breaker")** is an advanced tactical sub-surface ordnance system engineered to address late-game enemy density, aggressive swarms (Stage 10+), and the monumental threat of 12-type End-Game Crises. 

Unlike the high-cadence stream of primary Pure Water darts or autonomous single-target Homing Missiles, the Cavitation Torpedo is a **high-impact, skill-indexed heavy ordnance weapon**. Utilizing the physical phenomenon of *supercavitation*, the torpedo vaporizes the liquid medium at its nose cone to cruise inside an artificial gaseous envelope with negligible hydrodynamic drag, accelerating to extreme velocities before undergoing a **two-stage catastrophic implosion**:
1. **Phase 1: Vacuum Collapse (0.00s – 0.08s)** — A violent negative pressure drop that pulls adjacent hostiles, projectiles, and debris toward the torpedo's epicenter.
2. **Phase 2: Hyperbaric Shockwave (0.08s – 0.35s)** — An explosive acoustic pressure wave that obliterates enemy swarms, deflects incoming hostile plasma bolts, and temporarily concusses heavy entities and bosses.

This proposal establishes the full mechanical, mathematical, acoustic, visual, and architectural specification for this weapon while strictly respecting the core engine constraints (`logicalWidth: 600`, `logicalHeight: 800`).

---

## 1. Lore & Thematic Pitch Hook

### 1.1 The World Under Pressure
Deep within the trench basin of Kepler-Oceanus, humanity’s oceanic survival platform ("Nautilus-01") faces relentless onslaughts from extraterrestrial invaders, rogue bio-mechanical drones, and deep-sea abyssal leviathans. Standard kinetic water projectiles pierce individual invaders, but when the abyss unleashes dense bio-swarms and hyper-dense dimensional rift fleets, point-defense fire is mathematically insufficient.

To counter this extinction threat, the Nautilus Skunkworks developed **Project Hydros-Breaker**: the **Mark-IV Supercavitating Acoustic Torpedo**.

> *"In the deep abyss, water is not merely the battlefield—it is the explosive. By shearing the sea itself into a pocket of vacuum, we force the weight of ten thousand atmospheres to crush our invaders in a single heartbeat."*  
> — Chief Engineer Vane, Sub-surface Defense Command

### 1.2 Thematic Differentiation
- **Primary Water Blaster**: Continuous kinetic needle-fire. Relies on accuracy, tracking, and rapid trigger control.
- **Homing Missiles (유도탄)**: Autonomous, "fire-and-forget" swarm clearance targeting nearest enemies with modest splash.
- **Cavitation Torpedo (공동 어뢰)**: Deliberate, high-cooldown, heavy ordinance requiring trajectory planning and remote detonation timing. It transforms the battlefield geometry, creating dynamic crowd-control gravity wells and acoustic clearings.

---

## 2. Mechanics & Mathematical Formulations

```
          [Launch]                 [Arming Distance]             [Remote Trigger / Target Proximity]
Player Craft ===> ===>  (Vapor Cavity Accelerates)  ===>  (Armed: Flashing Core)  ===>  [STAGE 1: VACUUM IMPLOSION]
  (y = 740)                  (d < 100px: Inert)                 (d >= 100px)                      |
                                                                                                  v
                                                                                   [STAGE 2: ACOUSTIC OVERPRESSURE]
                                                                                     (Hostiles blasted & stunned)
```

### 2.1 Kinematics & Supercavitation Trajectory
The torpedo expels superheated gas from its nose cavitator, enclosing the entire hull inside an ellipsoidal vapor bubble. This negates fluid drag until terminal velocity is reached.

| Parameter | Symbol | Base Value | Scaled (Upgraded Lvl 5) | Units |
| :--- | :--- | :--- | :--- | :--- |
| **Launch Velocity** | $v_0$ | $180$ | $260$ | $\text{px/s}$ |
| **Cavitation Acceleration** | $a_{\text{cav}}$ | $420$ | $680$ | $\text{px/s}^2$ |
| **Terminal Velocity** | $v_{\max}$ | $580$ | $850$ | $\text{px/s}$ |
| **Arming Distance** | $d_{\text{arm}}$ | $110$ | $90$ | $\text{px}$ |
| **Max Range / Lifetime** | $T_{\text{life}}$ | $3.2$ | $4.0$ | $\text{seconds}$ |
| **Torpedo Size** | $W \times H$ | $14 \times 32$ | $16 \times 36$ | $\text{px}$ |

#### Equation of Motion:
$$\vec{v}(t) = \min\left(v_{\max},\; v_0 + a_{\text{cav}} \cdot t\right) \cdot \hat{u}_{\text{heading}}$$
$$\vec{p}(t) = \vec{p}_0 + \int_0^t \vec{v}(\tau) d\tau$$

### 2.2 Safety Arming Threshold ($d_{\text{arm}}$)
To prevent accidental self-destruction from point-blank detonation against barricades or the player hull:
- **Inert Flight ($y_{\text{launch}} - y(t) < d_{\text{arm}}$)**: The torpedo cannot detonate. If it collides with an enemy or barricade while unarmed, it deals blunt impact kinetic damage ($D_{\text{blunt}} = 15$) and shatters without triggering a shockwave.
- **Armed State ($y_{\text{launch}} - y(t) \ge d_{\text{arm}}$)**: The nose cavitator pulses white-hot. Remote detonation is now permitted, and impact triggers the full dual-phase implosion.

---

### 2.3 Dual-Phase Implosion Shockwave Physics

#### Phase 1: Vacuum Collapse (Negative Pressure Well)
Upon triggering at position $\vec{P}_{\text{det}}$, the vapor bubble collapses in on itself as ambient hydrostatic pressure rushes into the void. This lasts for duration $T_{\text{vac}} = 0.08\text{ s}$ (approx. 5 frames at 60Hz).

Any enemy entity $i$ within suction radius $R_{\text{pull}} = 140\text{ px}$ experiences an inward gravitational pull acceleration:

$$\vec{F}_{\text{pull}}(\vec{r}_i) = -G_{\text{hydro}} \cdot \frac{M_{\text{cav}}}{\max(r_i^2, \epsilon^2)} \cdot \hat{r}_i$$

Where:
- $\vec{r}_i = \vec{P}_i - \vec{P}_{\text{det}}$, and $r_i = \|\vec{r}_i\|$
- $G_{\text{hydro}} \cdot M_{\text{cav}} = 85,000\text{ px}^3/\text{s}^2$ (tuned for sharp, snappy vacuum snap)
- $\epsilon = 25\text{ px}$ (softening parameter to prevent infinite acceleration at epicenter)
- Mass Scaling Factor: Heavy/Boss units experience $0.25\times$ suction acceleration.

#### Phase 2: Hyperbaric Blast Overpressure (Shockwave)
The instant the inward fluid jets collide at the singularity point, an omnidirectional acoustic shockwave expands outward at velocity $v_{\text{shock}} = 750\text{ px/s}$ up to max radius $R_{\text{blast}} = 150\text{ px}$.

##### Damage Distribution Formula:
Damage scales down quadratically from the epicenter to reward precise centroid detonations:

$$D(r) = D_{\text{core}} \cdot \left(1 - \left(\frac{r}{R_{\text{blast}}}\right)^2\right)^{\alpha}$$

Where:
- $D_{\text{core}} = 120\text{ damage}$ (Level 1) $\longrightarrow 300\text{ damage}$ (Level 5)
- $\alpha = 1.25$ (pressure steepness coefficient)
- Minimum perimeter damage: $D(R_{\text{blast}}) \ge 0.15 \cdot D_{\text{core}}$

##### Radial Impulse & Pushback:
$$\vec{v}_{\text{impulse}}(\vec{r}_i) = I_0 \cdot \left(1 - \frac{r_i}{R_{\text{blast}}}\right) \cdot \frac{1}{\mu_{\text{tier}}} \cdot \hat{r}_i$$

Where:
- $I_0 = 480\text{ px/s}$ instantaneous velocity impulse
- Entity Mass Multiplier $\mu_{\text{tier}}$:
  * Common Mob (Squid, Jellyfish, Zigzag): $\mu = 1.0$ (blown back $60 - 90\text{ px}$)
  * Elite / Diver / Heavy Invader: $\mu = 2.2$ (pushed back $25 - 40\text{ px}$)
  * Boss / Sovereign: $\mu = 8.0$ (slight disruption / visual shudder of $5 - 10\text{ px}$)

##### Stun Duration Equation:
$$T_{\text{stun}}(r) = T_{\max} \cdot \left(1 - \frac{r}{R_{\text{blast}}}\right) \cdot S_{\text{resist}}$$
- $T_{\max} = 1.8\text{ seconds}$ (Core Concussion)
- $S_{\text{resist}} = 1.0$ (Normal), $0.5$ (Elites), $0.25$ (Bosses/Sovereign anchors)

---

### 2.4 Acoustic Bullet Interception Field
One of the most powerful tactical aspects of the cavitation blast is **Hydro-Acoustic Interception**:
- Any hostile projectile (`Bullet` where `faction === Faction.INVADER` or `Faction.ROGUE`) inside the expanding shockwave front ($r \le R_{\text{shock}}(t)$) is **vaporized and neutralized immediately**.
- Exception: Massive boss beams (e.g. `DARK_MATTER_BEAM`, `ORBITAL_SWEEP_RAILGUN`) cannot be neutralized, but their width/intensity is dampened by $40\%$ for the duration of the shockwave.

---

## 3. Tactical Gameplay Loop & Player Decisions

```
              ┌──────────────────────────────────────────┐
              │           PLAYER DETONATION TIMING       │
              └──────────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
   [PREMATURE DETONATION]                             [CENTROID DETONATION]
   • Low damage (outer rim)                           • High damage (core 120-300)
   • Clears incoming bullets                          • Sucks surrounding swarm together
   • Saves player in panic pinch                      • Complete cluster obliteration
         │                                                   │
         ▼                                                   ▼
  [PROXIMITY HAZARD]                                 [TACTICAL COLLABORATION]
  • Detonating within 90px                           • Sucks enemies away from
    of Barricades causes                               Repair Bots & Medics
    Acoustic Fracture!                               • Creates 1.8s alpha-strike window
```

### 3.1 The Remote Trigger Decision
The Cavitation Torpedo employs a **Double-Tap Remote Fire Protocol**:
1. **Tap 1**: Launches the torpedo into the water column.
2. **Tap 2**: Manually detonates the torpedo at its current coordinate $\vec{p}(t)$.
3. **Passive Trigger**: If the player does not manually detonate, the torpedo detonates automatically upon direct collision with any solid hostile entity or when reaching screen top ($y \le 30$).

This introduces high-skill tactical micro:
- **Flak Defensive Detonation**: Detonating 150px ahead of the player craft to erase a dense curtain of enemy bullets.
- **Deep Core Implosion**: Letting the torpedo glide into the middle of a V-formation or behind an armored vanguard to pull backline snipers into the blast.

### 3.2 Environmental & Collateral Mechanics (Barricade Interaction)
The defensive barricades in *Water Invader* utilize a 24-voxel grid ($6 \times 4$ blocks, 20 HP). Because water is an incompressible fluid, acoustic overpressure transmits violently into structures:
- If a Cavitation Torpedo detonates within **$\le 85\text{ px}$ of a Barricade**, the shockwave causes **Acoustic Sympathetic Vibration**:
  $$\text{Damage}_{\text{barricade}} = \text{round}\left(4 \cdot \left(1 - \frac{d_{\text{barricade}}}{85}\right)\right)$$
- **Player Risk**: Detonating too close to defensive barricades chips away 1 to 4 voxel blocks. Players must fire through barricade gaps or aim past the forward perimeter before popping the torpedo!

### 3.3 Friendly Coordination with Allied Reinforcements
Allied reinforcements (Fighter, Medic, Repair Bot) feature active roles:
- **Shockwave Shielding**: Allied units are hardened against player shockwaves ($\text{Damage} = 0$), but experience a gentle slipstream boost ($+15\%$ movement speed for 2.0s).
- **Repair Bot Zone Defense**: The implosion vacuum acts as an anti-saboteur tool. When a Barricade Saboteur or Diver dives toward an allied Repair Bot, a well-timed cavitation shockwave sucks the saboteur away from the bot and stuns it, providing uninterrupted repair uptime.

---

## 4. Audio & Visual Spectacle

```
  VISUAL PIPELINE:
  [Torpedo Sprite + Vapor Sheath] ──> [White-Flash Singularity] ──> [Displacement Ring Shader] ──> [Cavitation Fizz Particles]
  
  AUDIO PIPELINE (Web Audio API):
  [Pneumatic Eject: Noise+Filter] ──> [Cavitation Turbine Whine] ──> [AUDIO VOID DUCK (60ms)] ──> [Sub-Bass Implosion Thud (45Hz)]
```

### 4.1 Visual FX & Rendering Specification

#### 1. The Supercavitation Vapor Envelope (In Flight)
- The torpedo sprite is encapsulated in a translucent, shimmering tear-drop vapor bubble drawn with Canvas 2D composite paths:
  * Inner Core: Sleek titanium torpedo chassis with a pulsating cyan LED at the nose (`#06b6d4`).
  * Envelope: Radial gradient (`rgba(255,255,255,0.85)` at apex to `rgba(56, 189, 248, 0.15)` at flanks).
  * Trail: High-speed micro-cavitation bubble trail. Every $0.02\text{s}$, spawn 2-3 micro-bubbles that oscillate via damped harmonic motion (Rayleigh-Plesset approximation):
    $$r_{\text{bubble}}(t) = r_0 \cdot \left(1 + 0.35 \sin(24\pi t)\right) \cdot e^{-3.5 t}$$

#### 2. The Singularity Collapse Lens (Phase 1)
- For $0.06\text{s}$ (3-4 frames), render a reverse radial contraction:
  * A stark, pure black sphere (`#000000`) with an electric-cyan corona (`#38bdf8`) rapidly contracts from radius $60\text{px}$ down to $8\text{px}$.
  * Inward velocity streaks (40 particle lines) converging onto the epicenter.

#### 3. The Hyperbaric Refraction Shockwave (Phase 2)
- To create a screen-warping underwater shockwave without external textures:
  * **Canvas 2D Normal Ring**: Draw an expanding dual-ring arc with gradient alpha and lineWidth $12\text{px} \to 2\text{px}$:
    ```typescript
    ctx.save();
    ctx.lineWidth = Math.max(1, 14 * (1 - currentRadius / maxRadius));
    ctx.strokeStyle = `rgba(224, 242, 254, ${0.9 * (1 - currentRadius / maxRadius)})`;
    ctx.beginPath();
    ctx.arc(epicenter.x, epicenter.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Chromatic Aberration Halo Ring (Red-shifted inner, Blue-shifted outer)
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 * (1 - currentRadius / maxRadius)})`;
    ctx.beginPath();
    ctx.arc(epicenter.x, epicenter.y, currentRadius + 3.0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ```
  * **Screen Displacement**: Inject an instantaneous camera micro-shake ($14\text{px}$ amplitude decaying over $0.22\text{s}$).

#### 4. Cavitation Foam Dissipation
- Following the blast, 80-120 tiny effervescent fizz particles (`rgba(240, 249, 255, 0.9)`) float upward with random lateral wobble ($v_y = -35\text{ to } -70\text{ px/s}$, $v_x = \sin(t \cdot 8) \cdot 15$), simulating dissolved oceanic gas returning to equilibrium.

---

### 4.2 Web Audio API Procedural Synthesis Specification
Water Invader relies on zero-asset procedural Web Audio. The Cavitation Torpedo introduces three bespoke audio synthesis profiles:

#### 1. Pneumatic Launch & Cavitation Whine (`playTorpedoLaunch()`)
- **Pneumatic Shudder**: White noise buffer passed through a Biquad Bandpass Filter ($Q = 3.5$) centered at $320\text{ Hz}$, ramping down to $80\text{ Hz}$ over $0.18\text{s}$.
- **Turbine Spool-up**: Sine oscillator pitching up exponentially from $120\text{ Hz} \to 780\text{ Hz}$ with frequency modulation ($LFO = 32\text{ Hz}$ vibrato) to simulate cavitation propeller bite.

#### 2. The Signature "Muffled Void Collapse" (`playCavitationImplosion()`)
This is the psychological highlight of the weapon. Real underwater implosions momentarily deafen the surrounding medium:

```
[AUDIO EVENT TIMELINE]
0.00s ────────────────────────> 0.05s ───────────────> 0.35s
|  AUDIO DUCK (All channels)   |  DEEP SUB-BASS THUD  |  REVERB DECAY
|  Master gain drops to 0.05   |  48Hz -> 16Hz Saw    |  Hydro-fizz hiss
```

- **Step 1 (The Acoustic Vacuum / Muffle)**: Instantly ramp the global audio context lowpass filter down to $250\text{ Hz}$ and duck other sound channels for $50\text{ms}$. This creates an eerie, breathtaking silence right before the hammer falls.
- **Step 2 (The Sub-Bass Implosion)**:
  * Oscillator: Dual combined oscillators (Sawtooth + Sine).
  * Fundamental Frequency: Starts at $52\text{ Hz}$ and exponentially drops to $18\text{ Hz}$ over $0.38\text{s}$ (rattling deep subwoofers and headphones).
  * Overdrive / Distortion: Soft-clipping WaveShaperNode ($k = 8$) to add warm oceanic pressure resonance.
- **Step 3 (The Cavitation Crack & Fizz)**:
  * Pink noise burst with a high-resonance low-pass filter opening from $400\text{ Hz} \to 2400\text{ Hz}$ and decaying over $0.65\text{s}$, perfectly recreating the crackling sound of collapsing micro-bubbles.

---

## 5. UI/HUD Mockup & Controls

```
+------------------------------------------------------------------+
| SCORE: 142,850   WAVE: 14   [WATER: 820]   COMBO: x8 [█████░░░░] |
| HP: [██████████████░░░░]                    THREAT: LEVEL III    |
+------------------------------------------------------------------+
|                                                                  |
|                          (GAME AREA)                             |
|                                                                  |
|                        ▲  [TORPEDO]                              |
|                       / \  (Armed!)                              |
|                                                                  |
|                                                                  |
|        [BARRICADE]                  [BARRICADE]                  |
|                                                                  |
|                         [PLAYER]                                 |
+------------------------------------------------------------------+
|  [MISSILE PODS: 3]              [CAVITATION TORPEDO]             |
|  [● ● ●] (Auto-Salvo)           [ [●] READY | KEY: C / RMB ]     |
|                                 [ CD: [████████████] 100%  ]     |
+------------------------------------------------------------------+
```

### 5.1 Controls & Input Mapping
To ensure flawless parity between Desktop PC and Mobile/Tablet screens:

#### Desktop (Keyboard & Mouse):
- **Fire Primary**: `Space` or `Left Mouse Button` (uninterrupted kinetic stream).
- **Launch Cavitation Torpedo**: `KeyC`, `KeyX`, or `Right Mouse Button`.
- **Detonate Torpedo In-Flight**: Pressing `KeyC`, `KeyX`, or `Right Mouse Button` a second time while the torpedo is active immediately triggers Phase 1 implosion at current coordinates.

#### Mobile / Touch HUD:
- A dedicated **Tactical Ordnance Button** positioned in the bottom-right corner ($r = 32\text{px}$, safely offset from the canvas edge):
  * **State A (Ready)**: Deep navy circle with a pulsing cyan torpedo silhouette and outer cooldown glow ring.
  * **State B (In-Flight / Armed)**: Transforms into a high-visibility, flashing amber/red **"DETONATE"** button with dynamic radial pulse matching torpedo arming status.
  * **State C (Cooldown)**: Translucent radial wipe sweep with remaining recharge timer ($4.5\text{s}$).

### 5.2 Tactical Rangefinder Reticle (In-Flight Visual Aid)
When the torpedo is launched, a subtle holographic tactical overlay projects on the canvas:
1. **Arming Line**: A faint dashed cyan line at $y = y_{\text{launch}} - d_{\text{arm}}$ indicating where the torpedo becomes live.
2. **Blast Envelope Indicator**: Surrounding the torpedo nose, a faint translucent ring ($R = 150\text{px}$, alpha $0.15$) illustrates the exact reach of the shockwave, allowing players to execute frame-perfect centroid detonations.

---

## 6. Synergies with Crises, Bosses, and Allied Reinforcements

```
+-----------------------------------------------------------------------------+
|                     SYNERGY & COUNTERPLAY MATRIX                            |
+-----------------------------------------------------------------------------+
| GAMEPLAY ELEMENT        | CAVITATION TORPEDO REACTION                       |
+-------------------------+---------------------------------------------------+
| 12 End-Game Crises      | Shatters Phase 1 Rift Shields; disrupts core      |
| (Sovereign, Leviathan)  | super-weapon charge cycles.                       |
+-------------------------+---------------------------------------------------+
| 3rd Faction Mid-Tiers   | Pulls cloaked Rogue Stalkers out of stealth;      |
| (Rogue Mechs, Drones)   | interrupts Rogue Mech railgun sniper aim.         |
+-------------------------+---------------------------------------------------+
| Allied Reinforcements   | Vacuum pulls saboteurs away from Repair Bots;     |
| (Medic, Repair Bot)     | stuns swarms to let Allied Fighters alpha-strike. |
+-------------------------+---------------------------------------------------+
| Acid Rain & Environmental| Shockwave acoustic front neutralizes all acid    |
| Hazards                 | globules in a 150px radius.                       |
+-------------------------+---------------------------------------------------+
+-----------------------------------------------------------------------------+
```

### 6.1 Countering the 12 End-Game Crises

The 12 Grand Strategy / Sci-Fi Crises present overwhelming bullet density and invulnerability mechanics. The Cavitation Torpedo serves as the ultimate tactical answer:

1. **Dimensional Rift Anchors (Phase 1 Shield Interruption)**:
   - During Phase 1, the Crisis Sovereign is invulnerable while 2 Dimensional Rifts siphon energy from the rift flanks ($x = 90$ and $x = 510$).
   - A Cavitation Torpedo detonated between an escort cluster and a rift pulls the escort swarm into the rift's hitbox, allowing the $120-300$ blast damage to crack the rift open in 2-3 precise shots.
2. **Singularity Core & Gravitational Pulses**:
   - The *Singularity Core* crisis pulls the player craft toward hazard vortices. The Cavitation Torpedo's outward Phase 2 blast directly counteracts this, neutralizing gravitational vortex vectors for $1.5\text{s}$.
3. **Biomorphic Swarm (Flesh Hive Larvae Clusters)**:
   - Dense swarms of 30+ bio-larvae that normally overwhelm single-target weapons are instantly sucked into a tight knot and eradicated by the overpressure wave in a single glorious explosion.
4. **Boss Stun Windows**:
   - Detonating directly on the hull of the *Abyssal Leviathan* or *Solaris Colossus* inflicts a **$0.45\text{s}$ Hyperbaric Concussion**, interrupting their devastating charged attack routines (`DARK_MATTER_BEAM`, `CORONAL_MASS_EJECTION`) and giving the player crucial escape frames.

### 6.2 Synergy with 3rd Faction Encounters
- **Rogue Stalker De-Cloaking**: Rogue Stalkers navigate along flank angles while partially cloaked. The cavitation vacuum pulls them into the open and strips their cloaking field for $2.5\text{s}$.
- **Rogue Mech Disruption**: Rogue Mechs charge high-damage piercing railguns. The cavitation impulse knocks them backward, resetting their charge cycle.

### 6.3 Interlocking with Allied Reinforcements
- **Repair Bot Escort**: When allied Repair Bots arrive to reconstruct destroyed barricade voxels, common invaders target the bots. Detonating a torpedo ahead of the bots establishes a $150\text{px}$ perimeter free of enemy fire.
- **Allied Medic Preservation**: When the player is low on HP, a forward cavitation detonation buys $2.0\text{s}$ of absolute safety, allowing the Medic drone to complete its tethered healing link.

---

## 7. Technical Feasibility & Architectural Alignment

```
================================================================================
CLASS INHERITANCE & INTEGRATION HIERARCHY
================================================================================

      Entity (x, y, vx, vy, size)
        │
        ├── Bullet (damage, piercing, faction, CCD)
        │     │
        │     ├── HomingMissile (steering, smokeTrail)
        │     │
        │     └── CavitationTorpedo (vaporEnvelope, armingDistance, remoteTrigger)
        │
        └── ShockwaveField (epicenter, currentRadius, maxRadius, vacuumPhase)

================================================================================
```

### 7.1 Strict Adherence to Engine Boundaries
- **GameManager Dimensions**:
  * `logicalWidth = 600;`
  * `logicalHeight = 800;`
  * All physics equations, blast radii ($R_{\text{blast}} = 150$), and suction limits ($R_{\text{pull}} = 140$) are mathematically tuned for a $600 \times 800$ logical grid.
  * Off-screen safety culling: Torpedo is pruned if $x < -40$, $x > 640$, or $y < -40$.

### 7.2 Zero-Allocation Object Lifecycle & Performance
1. **Particle Pool Recycling**:
   - The bubble trail and cavitation foam fizz particles leverage `GameManager.particlePool` with fixed object reuse, preventing Garbage Collection pauses.
2. **Shockwave Spatial Pruning**:
   - Collision detection for the shockwave evaluates a preliminary axis-aligned bounding box (AABB) before calculating Euclidean distance squared ($r^2 \le R^2$), avoiding costly `Math.sqrt()` operations on out-of-range entities:
     ```typescript
     const dx = enemyCenterX - epicenter.x;
     const dy = enemyCenterY - epicenter.y;
     if (Math.abs(dx) <= R && Math.abs(dy) <= R) {
       const distSq = dx * dx + dy * dy;
       if (distSq <= R * R) {
         // Apply vacuum or blast force
       }
     }
     ```
3. **Continuous Collision Detection (CCD)**:
   - The torpedo retains `prevPosition` and sweeps line segments against enemy hitboxes during its high-speed cruise ($580-850\text{ px/s}$), ensuring it never tunnels through fast-moving dive bombers or rifts.

### 7.3 Progressive Shop Economy & Upgrade Matrix

The Cavitation Torpedo is purchasable in the Pre-Game Shop and Mid-Wave / Continue Shop:

| Upgrade Tier | Name | Shop Cost (Pure Water) | Damage ($D_{\text{core}}$) | Radius ($R_{\text{blast}}$) | Cooldown | Special Attribute |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | Pneumatic Cavitator | $300\text{ Water}$ | $120$ | $130\text{ px}$ | $6.5\text{s}$ | Remote Detonation Unlocked |
| **Tier 2** | Hydro-Acoustic Core | $550\text{ Water}$ | $160$ | $140\text{ px}$ | $5.8\text{s}$ | Bullet Vaporization Zone |
| **Tier 3** | Vacuum Singularity | $850\text{ Water}$ | $210$ | $150\text{ px}$ | $5.0\text{s}$ | Vacuum Suction Force $+40\%$ |
| **Tier 4** | Titanium Sheath | $1,200\text{ Water}$ | $260$ | $160\text{ px}$ | $4.4\text{s}$ | Arming distance reduced to $90\text{px}$ |
| **Tier 5** | Oblivion Imploder | $1,650\text{ Water}$ | $320$ | $175\text{ px}$ | $3.8\text{s}$ | Dual Shockwave (Double Pulse) |

---

## 8. Summary of Strategic Value to "Water Invader"

The Cavitation Torpedo elevates *Water Invader* from a reflex-only vertical shooter to a **high-satisfaction tactical combat experience**:
1. **Solves Late-Game Swarm Saturation**: Provides players with a deliberate counter to the extreme density of Wave 10+ and 12-crisis encounters.
2. **Deep Mechanical Mastery**: The manual double-tap trigger and barricade-acoustic trade-off reward game sense, timing, and positional awareness over mindless button mashing.
3. **Visceral Audiovisual Juice**: The "ear-popping" audio vacuum followed by the bone-shaking sub-bass implosion thud and optical refraction ring provides an extraordinary sensory peak during intense battles.
4. **Architecturally Flawless**: Plugs directly into `Entity`, `Bullet`, `GameManager`, and `SoundManager` with zero structural disruption and zero modification of logical boundaries.

# Feature Proposal: Sunken Research Base Defense (Tower Defense Hybrid Mode)
**Specialist Domain:** 5.2 — Outpost & Base Defense Systems  
**Project:** Water Invader (Next.js / HTML5 Canvas Engine)  
**Author:** Specialist 5.2 (Swarm Outpost Defense Team)  
**Date:** 2026-09-10  
**Status:** Proposal Draft for `IDEAS_PITCH.md` Integration  

---

## Executive Summary

**Sunken Research Base Defense** is a high-intensity **Tower Defense / Arcade Shmup Hybrid Mode** designed for *Water Invader*. Set at the ocean floor (depth: 9,000 meters) around the **"Aegis Deep-Vent Facility Alpha"**, the player must pilot their advanced submersible interceptor to protect three vulnerable **Geothermal Reactor Cores** against relentless waves of abyssal invaders, rogue mechs, and barricade saboteurs.

Rather than relying purely on evasive flight and player fire, this mode introduces **tactical infrastructure warfare**: players capture seafloor mounting pads, deploy specialized automated turrets and decoy buoys, tap volcanic hydrothermal vents for **Geothermal Energy (MegaWatts)**, and manage an active **Base Power Grid**. The mode seamlessly leverages Water Invader's existing voxel barricade destruction engine and massive Allied Reinforcement fleets, creating a rich synthesis of twitch reflexes and spatial strategy.

---

## 1. Concept & Hook: "Operation Abyssal Bastion"

### 1.1 The Narrative & Setting
Beneath the abyssal trench lies **Aegis Deep-Vent Facility Alpha**, humanity's last deep-sea geothermal research laboratory and clean water refinery. The facility harnesses superheated oceanic mantle plumes to distill the pure water humanity desperately needs. Drawn by the immense thermal and electromagnetic footprint, the Invader armada and Rogue swarm converge on the sea trench to crush the facility's three exposed **Geothermal Reactor Cores** (Core Alpha, Core Beta, Core Gamma).

### 1.2 The Core Gameplay Tension: "The Shmup Commander"
Traditional tower defense games are passive; traditional shmups are individualist dogfights. **Sunken Base Defense merges both into a high-stakes symbiotic loop**:
1. **The Interceptor (The Player):** Moves freely across the screen (X: 0–600, Y: 0–800), drawing fire, taking out high-threat snipers/bosses, and collecting thermal energy droplets.
2. **The Base Fortifications (The Grid):** Stationary automated structures anchored to the ocean floor provide persistent area control, bullet suppression, and point-defense screens.
3. **The Core Generators (The Vulnerability):** Three vital generators positioned at the seafloor (Y = 730). If all three generators suffer structural collapse, the facility implodes in catastrophic cavitation, resulting in an immediate Game Over regardless of player HP.

```
+-------------------------------------------------------------+
| [WAVE 18: SEABED SIEGE]                CORE INTEGRITY: 78%  |
|                                                             |
|           [Hostile Diver Swarms & Rogue Carriers]          |
|                       \         /                           |
|                        v       v                            |
|                                                             |
|                       [PLAYER SHIP]                         |
|                            <o>                              |
|                                                             |
|   [P1: Gatling]      [P2: Cryo Pylon]      [P3: Nanite]     |
|       [===]              (( * ))              [+++]         |
|   [BARRICADE A]       [BARRICADE B]       [BARRICADE C]     |
|   ==============      ==============      ==============    |
|   [CORE ALPHA]         [CORE BETA]         [CORE GAMMA]     |
|     (850 HP)             (0 HP - DOWN)       (1200 HP)      |
| ~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~ |
|    [HYDROTHERMAL VENT #1]          [HYDROTHERMAL VENT #2]   |
+-------------------------------------------------------------+
```

### 1.3 Win / Loss Conditions & Mode Integration
* **Loss Condition:** All 3 Geothermal Reactor Cores reach 0 HP (Cavitation Implosion), OR the Player ship is destroyed with 0 continues remaining.
* **Victory Condition (Wave Survival):** Successfully defending the surviving cores through 5 consecutive siege waves (e.g., Waves 15–20), leading into the **Abyssal Leviathan Core Siege Boss**.
* **Mode Accessibility:** Available as an alternate game mode from the Main Menu ("Base Defense Mode") or as a high-stakes, recurring **End-Game Crisis Event ("Deep-Sea Outpost Defense")** occurring every 10 stages starting from Wave 10.

---

## 2. Deployable Defense Mechanics

### 2.1 Seafloor Mounting Pads (Hardpoint Architecture)
The seafloor base features **6 Fixed Mounting Pads (P1 through P6)** situated strategically between the player barricades and the core generators:
* **Positioning:**
  * **P1 & P2 (Forward Flanks):** (X: 60, Y: 620) and (X: 540, Y: 620) — Ideal for long-range point defense and anti-flank interception.
  * **P3 & P4 (Center Vanguard):** (X: 200, Y: 640) and (X: 400, Y: 640) — Direct frontal coverage shielding Barricades B and C.
  * **P5 & P6 (Core Redoubt):** (X: 130, Y: 710) and (X: 470, Y: 710) — Close-in defense protecting the primary reactor manifolds.
* **Pad States:**
  * `UNOCCUPIED`: Displays a pulsating holographic wireframe socket.
  * `DEPLOYING`: Shows hydraulic assembly arms rising with bright electric welding sparks (1.5s construction timer).
  * `ACTIVE`: Fully operational structure tracking targets and drawing grid power.
  * `OVERHEATED / DAMAGED`: Emits black bubble smoke; requires nanite repair or player triage.

### 2.2 The 5 Defense Structure Archetypes

| Structure Type | Role / Damage Class | Cost (MW / Water) | Power Load | Mechanical Functionality |
| :--- | :--- | :--- | :--- | :--- |
| **Type A: CIWS Gatling Torpedo Turret** | Rapid Kinetic / Anti-Swarm | 75 MW / 100 Water | 15 kW | Rotates 360° to track nearest enemy within 240px. Fires dual micro-torpedoes (Speed: 520 px/s, Damage: 3, Fire Rate: 6 shots/s). Prioritizes fast Divers and Rogue Drones. |
| **Type B: Cryo-Concussion Shock Pylon** | Crowd Control / Energy | 100 MW / 150 Water | 25 kW | Emits expanding cryogenic shock rings every 2.4s in a 180px radius. Slows enemy movement by 50%, reduces enemy projectile speed by 40%, and shatters incoming acid rain drops. |
| **Type C: Sub-Harmonic Acoustic Lure Buoy** | Tactical Decoy / Aggro Redirection | 60 MW / 80 Water | 10 kW | Broadcasts high-frequency bio-acoustic sonar pings. Forces all enemies within 300px to redirect their targeting away from Cores and the Player. Explodes on death in a 200px concussion blast (150 AOE dmg). |
| **Type D: Seafloor Nanite Repair Station** | Support / Structural Restoration | 120 MW / 200 Water | 30 kW | Channels dual twin-laser welding beams to the most damaged adjacent Barricade or Core within 160px. Rebuilds 2 Barricade voxel blocks per second and restores +15 Core HP/s. Repairs player ship if docked nearby (+1 HP / 2s). |
| **Type E: Thermal Lance Arc Discharger** | Heavy Piercing / High-Tech | 160 MW / 280 Water | 45 kW | Charges for 1.8s then fires a sustained piercing molten plasma beam (Length: 500px, Width: 12px, Damage: 22/sec). Connects with adjacent Arc Dischargers to form a lethal electric tripwire fence across the seafloor. |

### 2.3 Branching Upgrade Specialization (T1 → T2 → T3)
Players can interact with any existing turret during combat or pre-wave phases to upgrade its technology tree:
* **CIWS Gatling Turret:**
  * *Path Alpha (Flak Interceptor):* Upgrades ammo to proximity-detonating shrapnel shells that intercept and vaporize hostile enemy bullets.
  * *Path Beta (Depleted Uranium Drill):* Adds heavy armor-piercing rounds dealing +200% damage to Bosses, Rogue Mechs, and Saboteurs.
* **Cryo-Concussion Pylon:**
  * *Path Alpha (Absolute Zero Field):* Periodically flash-freezes enemies solid for 1.5 seconds, interrupting boss beam charges.
  * *Path Beta (Superconductive Resonance):* Enemies affected by cryo take +35% increased damage from player weapons and homing missiles.
* **Nanite Repair Station:**
  * *Path Alpha (Aegis Shield Projector):* Grants temporary bubble overshields to repaired barricades and core generators.
  * *Path Beta (Combat Drone Foundry):* Periodically launches 2 autonomous micro-welder drones that fly across the map to repair distant units.

### 2.4 Deconstruction & Tactical Relocation
* Selecting an active structure grants the option to **Recycle (환원)**: returns **75% of invested Geothermal Energy and Water**, detonating a clean pneumatic purge that pushes back nearby enemies.
* Allows players to rapidly shift defenses from one flank to another during sudden enemy flank incursions or boss phase transitions.

---

## 3. Resource Management: The Geothermal Energy & Power Grid Loop

### 3.1 Dual-Resource Economy
Base defense integrates two interconnected currencies:
1. **Pure Water (순수한 물 - Existing Game Currency):** Earned from killing enemies and clearing waves. Used for baseline structure acquisition and permanent ship upgrades.
2. **Geothermal Energy (지열 메가와트 - Mode-Specific Tactical Resource):** Measured in **MegaWatts (MW)**. Used to power active structures, trigger emergency base abilities, and fuel structural overclocks.

```
+-------------------------------------------------------------------+
| BASE GRID: [==== LOAD: 115 kW / CAP: 150 kW ====] (STABLE)        |
| GEOTHERMAL ENERGY: 280 MW  (+14 MW/s)     PURE WATER: 840 W       |
+-------------------------------------------------------------------+
```

### 3.2 Hydrothermal Vent Dynamics & Harvesting
* **Subsea Hydrothermal Fissures:** Two active volcanic vents are located on the seabed floor at `(X: 100, Y: 780)` and `(X: 500, Y: 780)`.
* **Vent Eruption Cycles:** Every 12 seconds, a vent enters a **Superheated Eruption Phase**:
  * Emits towering geysers of bubbling thermal steam (Y: 780 up to Y: 580).
  * Spawns **Thermal Plasma Droplets** (+15 MW each) that float upwards.
  * **Tactical Risk / Reward:** Navigating the player interceptor through the geyser collects energy at 3x speed, but causes slight hull thermal stress unless protected by shields or quick piloting.

### 3.3 Power Grid Load & Brownout Thresholds
The base generator has a maximum power transmission capacity (default: **150 kW**).
* Each turret draws continuous power while active (e.g., Gatling: 15 kW, Arc Discharger: 45 kW).
* **Grid Balancing:**
  * **Below 100% Load:** All systems operate at peak efficiency with bright cyan energy conduits.
  * **100%–120% Load (Overload Warning):** Conduits turn glowing amber. Turrets generate +20% heat; emergency sirens beep softly.
  * **Above 120% Load (Grid Brownout):** The base enters a brownout state. All turret fire rates drop by 45%, and nanite repair stations shut down until excess structures are deconstructed or generator cores are upgraded.

### 3.4 Tactical Core Abilities (Emergency Geothermal Vents)
When energy is abundant, the player can trigger powerful facility-wide defense countermeasures via dedicated tactical inputs:
* **Thermal Geyser Purge (Cost: 100 MW - Key 'T'):** Forces both seafloor vents into an explosive upward steam blast. Vaporizes all lower-tier enemy projectiles on the bottom half of the screen and deals 80 thermal burn damage to descending enemies.
* **Core Magnetron EMP Shockwave (Cost: 150 MW - Key 'G'):** Discharges an electrical ring from the three reactor cores, instantly disabling Rogue mechs and Saboteurs within 250px for 4 seconds.
* **Emergency Coolant Flush (Cost: 80 MW - Key 'C'):** Instantly cools all overheated turrets and provides 5 seconds of maximum firing speed (+50% fire rate) with 0 kW power consumption.

---

## 4. Visuals, Atmosphere & SFX Design

### 4.1 Atmospheric Canvas Worldbuilding
The canvas visual pipeline transforms the bottom 25% of the screen into a breathtaking, living underwater research habitat:
* **The Geodesic Research Domes:** Transparent acrylic pressurized domes (rendered with soft glowing glass reflections and refraction rings) anchor the base. Inside the domes, tiny animated scientist silhouettes and computer telemetry screens scramble as alarms sound.
* **The Tri-Core Generators:** Three massive vertical reactor vessels rendered in industrial titanium (`#334155`) with glowing cylindrical plasma tubes (`#06b6d4` glowing cyan at 100% HP, shifting to `#f59e0b` amber at 50% HP, and violent flashing `#ef4444` crimson at <25% HP).
* **Volcanic Abyssal Trench:** The seafloor features rugged dark basalt rock textures, rising hydrothermal smoke columns rendered via procedural semi-transparent particle clusters, and fiery magma vein underglows (`rgba(249, 115, 22, 0.15)`).

```
Visual Architecture (Canvas Layers):
+-----------------------------------------------------------------+
| Layer 6: UI HUD (Power Grid, Core HP, Radial Wheel, Reticles)   |
| Layer 5: Projectiles, Lasers, Cryo Waves & Arc Sparks           |
| Layer 4: Player Submarine, Allied Fighters & Enemy Swarms       |
| Layer 3: Turrets & Mounting Pads (P1-P6) with Welding Sparks    |
| Layer 2: Barricades & Power Conduit Bezier Cables               |
| Layer 1: Geodesic Domes, Reactor Cores & Seabed Hydrothermal    |
| Layer 0: Deep Oceanic Gradient & Abyssal Particle Starfield     |
+-----------------------------------------------------------------+
```

### 4.2 Dynamic Structural Damage Signifiers
* **Pressure Hull Cracking:** As a Core or Barricade loses health, high-contrast structural stress fracture decals are procedurally drawn across the surface.
* **Decompression Cavitation:** At <30% Core HP, rapid high-speed bubble jets erupt from pipe fractures, accompanied by screen vibration and warning sirens.
* **Amber Warning Strobes:** Rotating emergency strobe lights cast rhythmic sweeping radial gradients (`rgba(245, 158, 11, 0.18)`) across the seafloor during critical threat states.

### 4.3 High-Fidelity Particle & VFX Specifications
* **Nanite Arc-Welding:** High-frequency procedural zigzag electrical arcs between the repair nozzle and the target barricade, spawning 12–18 bouncing molten spark particles (`#fef08a`, `#f59e0b`, `#38bdf8`) with gravity physics and fading alpha.
* **Acoustic Lure Sonar Ripples:** Concentric, expanding sinusoidal wireframe rings radiating outward with smooth easing (`ctx.arc` with decaying line width and fading alpha).
* **Thermal Lance Plasma:** Dual-core glowing laser beam with an intense white-hot core (`#ffffff`), secondary cyan plasma sheath (`#22d3ee`), and chaotic particle dissipation at the impact point.

### 4.4 Web Audio API Procedural Sound Design
Fully integrated with `SoundManager.ts` using synthesis nodes (no heavy external asset downloads required):
1. **Pulsating Geothermal Reactor Hum:** Low-frequency dual-oscillator drone (48 Hz + 52 Hz detuned sine waves) with a slow low-pass filter sweep, providing visceral sub-bass ocean rumble.
2. **Sub-Aquatic Alarm Klaxon:** Resonant dual-tone FM synth (320 Hz / 480 Hz) modulating at 1.2 Hz with dampening ocean reverb, triggering when any core drops below 40% health.
3. **Pneumatic Turret Deploy Sound:** Quick high-pressure white noise burst (`puff`) followed by a sharp metallic transient click (`hydraulic clamp`).
4. **Nanite Arc Welder Sizzle:** Granular random frequency noise bursts (2,000–6,000 Hz) simulating rapid electric arcing and metal bonding.
5. **Acoustic Lure Ping:** Classic deep ASDIC/sonar ping (880 Hz decaying sine wave with high-feedback comb filter delay).

---

## 5. UI Base Power Grid HUD & Turret Deployment Radial Wheel

### 5.1 Ergonomic In-Game HUD Layout (600x800 Canvas)
The UI is engineered specifically to maximize combat readability without occluding descending enemy formations:

```
[TOP SCREEN]
Wave: 16 | Score: 142,500 | Pure Water: 840 W | Geothermal: 320 MW
===================================================================
GRID LOAD: [====== 110 kW / 150 kW ======] (73%) | VENT SURGE: 85%

[MID SCREEN - COMBAT ZONE]
(Unobstructed dogfight and bullet-hell space from Y: 60 to Y: 580)

[SEABED COMBAT ZONE - Y: 590 to 760]
(P1) [Gatling]                             (P2) [Cryo Pylon]
      [BARRICADE A]   [BARRICADE B]   [BARRICADE C]
CORE ALPHA [85%]     CORE BETA [42%]     CORE GAMMA [100%]
-------------------------------------------------------------------
[BOTTOM TACTICAL BAR]
[Q: Deploy Menu]  [T: Vent Purge (100MW)]  [G: EMP Pulse (150MW)]
```

### 5.2 The Turret Deployment Radial Wheel
To enable lightning-fast building during frantic dogfights, the interface provides a frictionless **Deployment Radial Wheel**:
* **Invocation Methods:**
  * *Keyboard/Mouse:* Hover over or fly near an unoccupied Pad and press `Q` or `E` (or Click/Tap directly on the Pad).
  * *Gamepad:* Left Bumper (`LB`) or Right Trigger (`RT`) opens the radial wheel centered on the nearest pad.
* **Radial Wheel Architecture:**
  * A semi-transparent circular overlay (Radius: 85px) divided into **5 ergonomic pie slices**, each corresponding to a defense archetype.
  * Each slice displays a crisp vector icon, name, Water/MW cost, and power load.
  * Slices glow green if the player has sufficient resources, or dim red if resources/grid capacity are insufficient.
  * Hovering or flicking the analog stick toward a slice projects a **Holographic Range Ghost** onto the actual game canvas, showing exactly what firing arc and range radius the turret will cover.
  * Releasing the key or tapping confirms the build instantly. Construction commences seamlessly without pausing the action.

```
                  [1] Gatling CIWS
                     (75 MW / 15kW)
                           ^
        [5] Arc Lance     / \     [2] Cryo Pylon
       (160 MW / 45kW)   /   \    (100 MW / 25kW)
               <---   [PAD #2]   --->
                         \   /
        [4] Repair Bot    \ /     [3] Acoustic Lure
        (120 MW / 30kW)    v      (60 MW / 10kW)
```

### 5.3 Mobile Touch Optimization
* On mobile/tablet viewports, the radial wheel supports **Touch-and-Flick Gestures**: touching a pad and swiping outward in the direction of the desired structure selects and builds it in under 200 milliseconds.
* Alternatively, a collapsible bottom **Tactile Quick-Build Toolbar** is available for one-tap deployment on whatever pad the player ship is currently hovering over.

---

## 6. Synergies with Allied Reinforcements & Feasibility Analysis

### 6.1 Synergy with Existing Game Systems
Sunken Base Defense is designed not in isolation, but to amplify existing *Water Invader* mechanics:

#### A. Synergy with `AlliedReinforcements.ts` (Aegis Vanguard Dreadnought)
* **The Orbital Conduit Link:** When the massive Allied Command Dreadnought warps into the sector (occurring during mid-wave crises), its ventral core projects an energy transfer beam down to the seafloor facility.
* **Effect:** Instantly expands the Base Grid capacity by **+100 kW** and provides **+20 MW/s free geothermal feed** while the dreadnought is present.
* **Fighter Escort Coordination:** The Dreadnought's two agile Escort Interceptors actively patrol the perimeter, automatically targeting enemies caught in the slow fields of Cryo-Concussion Pylons.

#### B. Synergy with Allied Support Roles (`Helper.ts`)
* **Allied Repair Bots:** Rather than wandering aimlessly, Allied Repair Bots automatically link with **Seafloor Nanite Stations**, tripling their repair output and restoring destroyed Barricade voxel blocks at lightning speed.
* **Allied Medics:** Cast an overshield dome that encompasses both the player and the central Core Beta generator.
* **Allied Fighters:** Concentrate suppressive plasma volleys directly at enemies lured by the **Acoustic Lure Buoy**.

#### C. Synergy with `Barricade.ts` (Voxel Block Destruction Grid)
* Mounting pads P3 and P4 sit directly behind the central destructible ice/stone barricades (6x4 voxel grids).
* Turrets fire cleanly over the tops of barricades, while barricades absorb incoming enemy torpedoes and diver collision damage, shielding the turrets from direct physical impact.
* Saboteur enemies (`EnemyType.SABOTEUR`) will prioritize gnawing through barricades to reach the reactor cores, creating clear tactical chokepoints where Cryo Pylons and Gatling Turrets excel.

#### D. Synergy with Player Upgrades
* **Homing Missiles (유도탄):** Player homing missiles automatically prioritize targets marked by the Acoustic Lure Buoy or locked by the Thermal Lance.
* **Acid Rain Shield (산성비 우산/쉴드):** The player's purchased acid shield can be positioned over an active turret or damaged Core to shield it from hazardous environmental acid rain cascades.

### 6.2 Implementation Feasibility & Performance Budget

```
+-----------------------------------------------------------------------+
| ARCHITECTURAL FEASIBILITY SCORECARD                                  |
+-----------------------------------------------------------------------+
| Criterion                       | Status  | Technical Specification   |
|---------------------------------+---------+---------------------------|
| Canvas Coordinate Invariance    | PASS    | Strict 600x800 logical dim|
| Frame Rate Budget (60 FPS)      | PASS    | Zero allocation in render |
| Object Pooling Compliance       | PASS    | Pool for sparks & shells  |
| Modular File Separation         | PASS    | Clean /game/defense/ pkg  |
| E2E Playwright Compatibility    | PASS    | No breaking changes       |
+-----------------------------------------------------------------------+
```

1. **Strict Logical Coordinate Adherence:**
   * All mounting pads, cores, vents, and HUD elements are strictly indexed within the invariant `logicalWidth = 600` and `logicalHeight = 800` system defined in `GameManager.ts`.
   * Responsive canvas scaling (`canvas.width = logicalWidth * dpr`, CSS `max-width`, aspect-ratio preservation) works natively without requiring any structural changes.
2. **Object Pooling & Garbage Collection Hygiene:**
   * Defense structures reuse the engine's pre-existing `Bullet`, `Particle`, and `Entity` pools.
   * Welding sparks and acoustic ripples are handled via pre-allocated circular buffers, guaranteeing zero garbage collection pauses during intense 60 FPS combat.
3. **Proposed Modular Architecture:**
   * A clean, decoupled module structure:
     * `src/game/defense/DefenseStructure.ts` (Abstract base extending `Entity`)
     * `src/game/defense/TurretTypes.ts` (Implementations of Gatling, Cryo, Lure, Nanite, Thermal Lance)
     * `src/game/defense/PowerGridManager.ts` (MW generation, vent timers, grid load calculations)
     * `src/game/defense/CoreGenerator.ts` (HP tracking, cavitation FX, failure triggers)
   * `GameManager.ts` simply updates and renders the `PowerGridManager` alongside existing helpers and barricades.

---

## 7. Conclusion & Next Steps

The **Sunken Research Base Defense** mode turns *Water Invader* from a great retro arcade shooter into a multi-layered, deeply replayable action-strategy experience. It solves the fatigue of traditional wave-based shmups by giving the player tangible assets to build, power, upgrade, and protect.

With full architectural compatibility, zero logical coordinate disruption, and rich gameplay synergies with existing allied fleets, barricades, and weapons, this proposal represents a flagship feature ready for seamless incorporation into the master pitch document (`IDEAS_PITCH.md`).

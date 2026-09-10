# Feature Proposal: Multi-Stage Boss — The Sunken Dreadnought Titan
**Specialist 4.6 (Boss Encounters & Multi-Stage Mechanics)**  
**Swarm Focus Domain: Advanced Boss Architecture & Tactical Combat**  
**Document Target**: `/Users/user/src/water-invader/.agents/swarm_d4_dreadnoughtboss_6/report.md`  
**Game Context**: Water Invader (Next.js, Canvas 2D, Web Audio API, Logical Grid 600x800)

---

## Executive Summary

The **Sunken Dreadnought Titan** (designated *SMS Leviathan-01 / 심해 거함 타이탄*) is an apex-tier multi-stage naval fortress boss engineered to redefine late-game boss encounters in *Water Invader*. Spanning almost the entire width of the logical battlefield (520px wide × 180px high on the 600×800 logical canvas), this monolithic warship rises from the abyssal trenches with heavy deck turrets, active missile silos, reinforced armor bulkheads, and an internal drone carrier hangar.

Unlike standard single-hitbox bullet sponges, the Dreadnought Titan features an authentic **Modular Sub-System Destruction Mechanic**: players systematically dismantle distinct deck hardpoints (Port/Starboard Batteries, CIWS Point-Defense, VLS Missile Silos, and Hangar Bays) to neutralize specific attack vectors and expose its superheated Magnetic Railgun Reactor Core. 

This proposal provides a complete, production-ready specification including combat phase progressions, procedural vector rendering routines, Web Audio API sound synthesis equations, component-level UI HUD architecture, and deep mathematical synergies with the newly introduced Homing Missile upgrade system.

---

## 1. Concept & Hook

### 1.1 The High Concept
A rusted, bio-fouled super-dreadnought battleship from a forgotten naval era, raised from the ocean floor and retrofitted with alien abyssal energy cores. The Dreadnought represents an intimidating industrial war machine contrasting with the organic/aquatic invaders—a floating iron island bristling with heavy artillery, rotating flak turrets, and humming magnetic rails.

```
       [==== PORT BATTERY ====]         [BRIDGE TOWER]         [==== STARBOARD BATTERY ====]
              \                     /-----[ CIWS ]-----\                     /
               +-------------------+                    +-------------------+
               |  VLS SILO CELL A  |   [CARRIER BAY]    |  VLS SILO CELL B  |
               +-------------------+                    +-------------------+
              /                     \==================/                     \
       [====== PORT FLAK ======]      [MAGNETIC RAILGUN]       [===== STARBOARD FLAK ======]
                                      (EXPOSED IN PHASE 3)
```

### 1.2 Dramatic Entrance & Atmospheric Narrative
1. **Sonar Ping & Screen Tremor**: The music dims; low-frequency sonar pings (440Hz ping with decaying 3-second echo) pulse through the canvas.
2. **Abyssal Trench Emergence**: Screen shake intensifies (`triggerScreenShake(0.6)`). Dark turbulent bubble columns boil upward along both screen edges.
3. **Iron Bulkhead Descent**: The massive prow slides down from the top of the screen (`y: -200` to `y: 40`) over 3.5 seconds, casting a massive dynamic shadow over the barricades and player space.
4. **Alarm Klaxon & Searchlight Sweep**: Red emergency beacon lights rotate across the deck plating, sweeping dual semi-transparent cones across the player's coordinate space. The threat HUD registers:  
   `⚠️ ALERT: APEX CLASS WARSHIP DETECTED // TITAN DREADNOUGHT LEVEL X`.

### 1.3 Strategic Tactical Role
- **Scale**: Dimensions `520px` width × `180px` height, anchored at `y = 45` to `y = 225`. It controls the upper hemisphere of the combat arena.
- **Micro-Targeting vs Macro-Dodging**: Forces the player to divide attention between sweeping bullet curtain patterns and precision aim on critical sub-systems.
- **Dynamic Threat Reduction**: Each destroyed hardpoint tangibly reduces incoming bullet density, granting immediate positive reinforcement and tactical agency.

---

## 2. Phase Progression Breakdown

The encounter evolves through three distinct, escalating phases triggered by collective subsystem damage and structural integrity thresholds.

```
+-----------------------------------------------------------------------------------------------+
|  PHASE 1: HEAVY BROADSIDE BARRAGE                                                             |
|  - Dual Heavy 380mm Turrets (Crossfire arcs)                                                  |
|  - Twin VLS Missile Silos (Targeted depth mortar blasts)                                      |
|  - CIWS Point-Defense Flak (Intercepts incoming player projectiles & missiles)                |
|  - Target: Destroy Port & Starboard Batteries to breach deck armor                            |
+-----------------------------------------------------------------------------------------------+
                                               │
                                               ▼ (Combined Battery HP <= 0)
+-----------------------------------------------------------------------------------------------+
|  PHASE 2: DECK BREACH & FIGHTER DRONE SCRAMBLE                                                |
|  - Center Deck splits open, exposing smoking flight catapults                                 |
|  - Continuous scramble of high-speed Rogue Interceptor Drones & Kamikaze Mine-Layers          |
|  - Cascading Carpet Bombing runs & Depth Charge spreads across player lane                    |
|  - Target: Annihilate Hangar Bay Catapults & Bulkhead Anchors                                 |
+-----------------------------------------------------------------------------------------------+
                                               │
                                               ▼ (Titan Structural HP <= 35%)
+-----------------------------------------------------------------------------------------------+
|  PHASE 3: CORE OVERLOAD & SPINAL MAGNETIC RAILGUN (ENRAGE CLOCK)                              |
|  - Emergency Siren Klaxon + Reactor Containment Breach                                        |
|  - Exposed Plasma Fusion Core pulsing at center hull                                          |
|  - Spinal Magnetic Railgun: 1.2s Telegraph beam -> 0.8s Screen-Melting Hyper-Laser            |
|  - Spiral plasma exhaust volleys while dodging massive spinal blast sweeps                    |
|  - Target: Destroy the Exposed Overheated Core before 45s Enrage meltdown                     |
+-----------------------------------------------------------------------------------------------+
```

---

### Phase 1: Port & Starboard Broadside Batteries (Heavy Crossfire)

#### Mechanics & Attack Patterns
1. **Alternating 380mm Naval Crossfire**:
   - The Port Turret fires a 3-round spread of heavy shells angled diagonally across the screen towards `x = 450..580` at `speed = 260px/s`.
   - 0.8 seconds later, the Starboard Turret mirrors with an interlocking crossfire spread towards `x = 20..150`.
   - The overlapping intersection forms an "X" kill-zone in the center column (`x = 250..350`), requiring rhythmic horizontal shifts to safe pockets.
2. **Vertical Launch System (VLS) Mortar Salvos**:
   - Every 4.5 seconds, VLS Silo Cells launch 2 mortar canisters upward that loop in an arc and land at the player's recorded `X` coordinate with a 1.0s circular red telegraph ring (`radius: 35px`).
   - On impact, mortars leave lingering shockwave patches that persist for 1.2 seconds, degrading defensive barricades or inflicting heavy hull damage to players.
3. **CIWS Point Defense (Rotary Flak)**:
   - Tracks incoming player rockets or standard bullets that enter within a 90px radius of the main bridge, firing rapid micro-tracers that neutralize up to 2 incoming projectiles per second.

#### Player Counterplay & Tactical Flow
- Players must identify the alternating rhythm between Port and Starboard batteries.
- Focus-firing on one battery (e.g. Port) first cuts the crossfire pattern in half, opening a permanent safe pocket on the left side of the screen.

---

### Phase 2: Deck Breach & Fighter Drone Scramble (Carrier Swarm)

#### Mechanics & Attack Patterns
1. **Flight Deck Fracture Transition**:
   - When both heavy batteries are destroyed, a massive metal groaning SFX plays. Heavy iron blast doors slide open at the dreadnought's center, venting thick steam and glowing red embers.
2. **Carrier Drone Scramble**:
   - Every 3.5 seconds, the Hangar Bay catapults 2 **Escort Interceptor Drones** (`size: 24x18px`, `HP: 18`, `speed: 210px/s`).
   - Interceptor Drones employ evasive sinusoidal weaves (`x(t) = x0 + 40 * sin(4t)`), strafing downward while firing paired micro-plasma darts.
3. **Kamikaze Torpedo Drones**:
   - Every 7.0 seconds, a specialized heavy drone dives straight down toward the player's last known position at accelerating speed (`speed: 150 -> 420px/s`), flashing crimson. If not shot down, it detonates in a 60px radius splash blast upon reaching `y = 720`.
4. **Secondary Deck Flak Suppression**:
   - The remaining secondary deck mounts fire sweeping arcs of 5-way green plasma pellets (`speed: 190px/s`), filling the screen gaps while drones dive.

#### Player Counterplay & Tactical Flow
- Player must balance direct damage to the carrier hangar with crowd control against the drone swarm.
- This phase heavily rewards weapon upgrades: Piercing shots cut through swarming drones into the hangar below, while Homing Missiles automatically seek and eliminate agile interceptors before they dive.

---

### Phase 3: Core Overload & Magnetic Railgun (The Enrage Climax)

#### Mechanics & Attack Patterns
1. **Reactor Breach Exposure**:
   - When overall Titan health reaches 35%, internal explosions tear through the flight deck. The central spinal compartment locks forward, revealing the **Overheated Magnetic Railgun & Antimatter Core** (`HP: 2,200`, critical damage zone).
2. **Telegraph Warning Lines (Dual Targeting Lasers)**:
   - 1.4 seconds before firing, dual high-contrast, pulsating neon-red targeting lasers (`width: 3px`, alpha oscillating 0.4 to 1.0 at 12Hz) project from the spinal muzzle straight down the screen, tracking the player's horizontal position with a slight rotational inertia (`tracking speed: 180px/s`).
   - 0.4 seconds before firing, the lasers lock into place (turn bright white-red and freeze position), granting a twitch-reaction dodge window.
3. **Spinal Magnetic Railgun Discharge**:
   - Fires a massive 54px-wide hyper-magnetic energy beam lasting 0.85 seconds.
   - The beam pulverizes any barricade column it contacts instantly and inflicts lethal continuous damage (`80 damage/sec`) to the player.
   - Generates intense radial shockwave rings and screen blur.
4. **Coolant Vent Plasma Ejection**:
   - As the railgun cools, four lateral exhaust ports vent cascading spirals of superheated steam bubbles and plasma balls (`speed: 160px/s`, 12-shot spiral spray), denying the screen edges and forcing the player into narrow mid-range corridors.
5. **45-Second Enrage Timer**:
   - A pulsing red countdown HUD element activates: `CORE MELTDOWN IN: 45.0s`. Each successful railgun cycle accelerates by 10%. If the core is not destroyed before the timer expires, the dreadnought detonates in a catastrophic self-destruct wave causing immediate mission failure.

---

## 3. Sub-System Destruction Mechanic

### 3.1 Hardpoint Architectural Blueprint
The Titan is built as a composite multi-entity structure. While the core hull retains master structural integrity, six distinct sub-systems function as autonomous targetable components with dedicated hitboxes, health pools, and behavior scripts.

```
+--------------------------+--------+---------+--------------------+---------------------------------------+
| Sub-System Component     | HP     | Armor   | Local Canvas Rect  | Disablement Consequence               |
+--------------------------+--------+---------+--------------------+---------------------------------------+
| 1. Port Main Battery     | 650 HP | 20% Red | [x: 40, y: 70,     | Silences heavy diagonal left cannon.  |
|                          |        |         |  w: 65, h: 45]     | Removes 3-way 380mm shell pattern.    |
+--------------------------+--------+---------+--------------------+---------------------------------------+
| 2. Starboard Main Battery| 650 HP | 20% Red | [x: 415, y: 70,    | Silences heavy diagonal right cannon. |
|                          |        |         |  w: 65, h: 45]     | Removes right crossfire volley.       |
+--------------------------+--------+---------+--------------------+---------------------------------------+
| 3. CIWS Point-Defense    | 400 HP | 0% Red  | [x: 235, y: 55,    | Disables defensive projectile &       |
|    Turret Array          |        |         |  w: 50, h: 30]     | missile interception field.           |
+--------------------------+--------+---------+--------------------+---------------------------------------+
| 4. Port VLS Missile Silo | 500 HP | 15% Red | [x: 120, y: 95,    | Eliminates left-lane depth mortar     |
|                          |        |         |  w: 45, h: 40]     | telegraph zones.                      |
+--------------------------+--------+---------+--------------------+---------------------------------------+
| 5. Starboard VLS Silo    | 500 HP | 15% Red | [x: 355, y: 95,    | Eliminates right-lane depth mortar    |
|                          |        |         |  w: 45, h: 40]     | telegraph zones.                      |
+--------------------------+--------+---------+--------------------+---------------------------------------+
| 6. Central Carrier Hangar| 950 HP | 25% Red | [x: 200, y: 90,    | Destroys flight catapults; permanently|
|                          |        |         |  w: 120, h: 60]    | halts all drone reinforcements.       |
+--------------------------+--------+---------+--------------------+---------------------------------------+
| 7. Exposed Reactor Core  | 2,200  | 0%      | [x: 215, y: 110,   | Vulnerable ONLY in Phase 3. 2.0x Crit |
|    (Spinal Hardpoint)    |   HP   | (Crit)  |  w: 90, h: 70]     | damage to player Piercing weapons.    |
+--------------------------+--------+---------+--------------------+---------------------------------------+
```

### 3.2 Visual & Physics States Upon Destruction
- **Rupture Explosion**: When any hardpoint reaches 0 HP, it triggers a localized high-particle explosion (`createExplosion(x, y, '#fbbf24', 60, 2.5)`), followed by a persistent dark smoke emitter (`smokeParticleCount: 3/frame`) and secondary electrical arc sparks.
- **Debris Shedding**: The destroyed turret barrel or hatch physically detaches, tumbling downward as an inert visual kinematic entity with rotational inertia (`vy: 140px/s`, `omega: 3.2 rad/s`) that vanishes past the bottom screen edge.
- **Hull Transfer Damage**: 50% of the subsystem's total HP is instantly subtracted from the master Titan Hull bar as structural shock, ensuring tactical attacks contribute directly to boss death.
- **Skeletal Wreckage Sprite**: The subsystem texture swaps to a scorched, exposed metal frame with flickering amber wire conduits.

---

## 4. Visuals & Procedural Canvas 2D SFX Design

### 4.1 Pure Canvas 2D Vector Rendering Pipeline (No External Assets Required)
The Dreadnought Titan is rendered purely with high-performance Canvas 2D primitives, ensuring zero external asset loading overhead and crisp vector scaling at any resolution:

1. **Rusted Warship Armor Plating**:
   - Base hull rendered using multi-stop linear gradients (`#1e293b` deep slate navy, `#334155` oxidized steel, `#78350f` burnt rust patches).
   - Armor seam lines drawn with crisp 1px strokes (`#0f172a`) and highlight bevel lines (`rgba(255,255,255,0.15)`).
   - Procedural rivet lines spaced every 12px along main bulkhead perimeter rings (`ctx.arc(rx, ry, 1.5, 0, Math.PI * 2)` in `#64748b`).
2. **Waterline Bioluminescence & Bio-Fouling**:
   - Abyssal green/cyan moss and barnacle clusters procedurally seeded on the lower keel using irregular Bézier curves with emerald-tinted specular accents (`rgba(16, 185, 129, 0.4)`).
3. **Muzzle Blast & Dynamic Recoil**:
   - Turret barrels render with realistic recoil offsets (`barrelRecoilX`, `barrelRecoilY` kick back by 8px and linearly recover over 0.25s).
   - Radial flash bursts (`createRadialGradient(fx, fy, 2, fx, fy, 28)`) blending from `#ffffff` core to `#f59e0b` amber and `#ef4444` crimson edge with instant alpha falloff.
4. **Magnetic Railgun Charge Effect**:
   - Arcing electric arcs (`ctx.lineTo` with random jitter ±6px) leaping between the twin rail armatures toward the central muzzle.
   - Dual holographic laser guides: `setLineDash([8, 6])` with shifting offset `dashOffset -= dt * 60` for an animated flowing laser sight.
   - When firing, a layered beam:
     - Outer Glow: `54px` width, `rgba(59, 130, 246, 0.35)` with `ctx.shadowBlur = 24`.
     - Mid Plasma: `28px` width, `rgba(96, 165, 250, 0.85)`.
     - Inner Core: `10px` width, `#ffffff` pure white blinding laser.

```
Canvas 2D Rendering Stack:
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Railgun Beam & Muzzle Flares (Screen Blending)     │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Active Turrets & Recoiling Barrels (Shadows)       │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Subsystem Details, Rivet Rows, Blast Doors         │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Main Armored Warship Hull & Keel Gradient          │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Abyssal Ambient Shadow & Water Distortion Haze     │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 Web Audio API Procedural Sound Design
Aligned with `SoundManager.ts`, all audio cues are synthesized in real-time with zero audio sample dependencies:

#### 1. Abyssal Metal Groaning & Structural Collapse (`playDreadnoughtGroan`)
- **Synthesis Profile**: Two detuned `sawtooth` oscillators (28Hz and 31Hz) passed through a low-pass BiquadFilter with resonance `Q = 14`.
- **Modulation**: Filter cutoff sweeps from 180Hz down to 40Hz over 1.8 seconds.
- **Sub-Bass Rumble**: Generates a visceral physical sensation of thousands of tons of submerged iron twisting under pressure.

#### 2. Heavy 380mm Naval Artillery Thud (`playNavalArtillery`)
- **Attack Punch**: White noise burst through an exponential decay gain envelope (0.04s punch) combined with a 75Hz sine oscillator dropping to 22Hz.
- **Body & Reverb**: Second stage band-pass filter at 120Hz creates the hollow "boom" of a heavy naval gun barrel echoing through deep water.

#### 3. Magnetic Railgun Charging Whine (`playRailgunCharge`)
- **Pitch Ramp**: Pure `sine` oscillator ascending exponentially from 80Hz to 2,400Hz over 1.4 seconds.
- **Harmonic Modulation**: Fast vibrato LFO (frequency 32Hz, depth 25Hz) giving an intense, unstable turbine spool-up sensation.

#### 4. Spinal Railgun Hyper-Discharge (`playRailgunBlast`)
- **Initial Crack**: High-gain square wave mixed with saturated noise burst (duration 0.08s, gain 0.35).
- **Sustained Energy Drone**: Low 55Hz sawtooth with aggressive low-pass filter humming during the 0.85s beam duration.
- **Screen Shake Interlock**: Perfectly synchronized with `triggerScreenShake(0.75)`.

#### 5. Subsystem Rupture & Secondary Cook-off (`playSubsystemExplosion`)
- **Staggered Detonations**: Three micro-explosions spaced 90ms apart, pitching upward (60Hz -> 95Hz -> 140Hz) simulating internal ammunition cook-off in the breached turret magazine.

---

## 5. UI Multi-Part Component Health HUD

### 5.1 HUD Architecture & Positioning
Positioned at the top of the canvas (`y = 12..48`) above the active combat arena, the **Titan Tactical Component HUD** delivers instant situational awareness without obscuring enemy projectile lanes:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚓ SMS LEVIATHAN-01 // TITAN DREADNOUGHT                                      PHASE 1: BROADSIDE │
│  [=================================== MASTER HULL: 68% ======================================]   │
│                                                                                                  │
│  [PORT 380mm]     [PORT VLS]      [CIWS FLAK]      [HANGAR BAY]     [STBD VLS]    [STBD 380mm]   │
│  [████████--]     [██████████]    [--DESTROYED]    [██████████]     [██████----]  [██████████]   │
│     78%               100%             0%              100%             62%           100%       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Dynamic Component State Visuals
1. **Master Hull Bar**:
   - Multi-segment gradient bar: Tiered from Crimson (`#ef4444`) to Amber (`#f59e0b`) and Cyan (`#38bdf8`) with a silver armored boundary.
   - Smooth lerp interpolation for damage reduction display (`hullLerp = lerp(hullLerp, currentHull, 0.1)`).
2. **Sub-System Status Badges**:
   - **Active & Healthy (100% - 50%)**: Bright neon cyan/emerald border (`#10b981`), filled segments.
   - **Damaged & Smoking (49% - 1%)**: Flashing amber/red outline (`#f59e0b`), particle smoke drifting up from the badge icon.
   - **Destroyed (0%)**: Dark slate red background, strike-through text `[DESTROYED]`, faint red static glitch pulses.
3. **Phase 3 Enrage & Railgun Charge HUD**:
   - Master bar transitions to a pulsing fire-gradient: `REACTOR CRITICAL: OVERLOAD IN 32.4s`.
   - Railgun Charge Meter located directly under the core health bar: Fills with high-visibility electric purple/cyan during the 1.4s telegraph phase.

### 5.3 Mobile & Responsive Scaling
- On mobile viewports (`logicalWidth = 600` rendered on narrow devices), the subsystem badges collapse into a compact 6-segment mini-pip matrix (`6px × 8px` each) beneath the primary health bar, preventing any UI clutter or text overlap.

---

## 6. Synergies with Homing Missiles & Technical Feasibility

### 6.1 Synergies with Player's Homing Missile Upgrade
The newly added **Homing Missile Upgrade** (`HomingMissile` class in `Bullet.ts`) achieves its ultimate design payoff in this encounter:

1. **Sub-System Lock-On Hierarchy**:
   - `HomingMissile.findNearestTarget()` natively interfaces with the Dreadnought's individual subsystem entities.
   - Targeting Priority Algorithm:
     ```
     Priority 1: Active Drones within 140px (immediate defensive threat)
     Priority 2: Active CIWS Point-Defense Turret (neutralize defense network)
     Priority 3: Exposed Active Weapons (Port/Starboard batteries, VLS cells)
     Priority 4: Main Hull / Exposed Reactor Core (in Phase 3)
     ```
2. **Splash Blast Cleave (45px Radius AoE)**:
   - Homing Missiles detonate with a 45px area-of-effect splash (`splashDamage = floor(damage * 0.5)`).
   - Because the Dreadnought's deck components are closely arranged (e.g. Port VLS Silo at `x = 120` and Port Main Battery at `x = 40..105`), a missile striking the junction deals full direct damage to the battery **AND** cleaves splash damage onto the adjacent missile silo!
3. **CIWS Interception Counterplay**:
   - The Dreadnought's CIWS rotary cannon introduces an engaging cat-and-mouse dynamic: It can shoot down isolated homing missiles. 
   - However, upgrading Homing Missiles to Level 3+ (firing 3 to 5 missiles simultaneously) overwhelms the CIWS tracking capacity, allowing the salvo to punch through and demolish the turret!

```
 Salvo Launch (Level 4: 4 Missiles)
            │
            ├─► Missile 1 ───► Intercepted by CIWS [Flak Spark]
            ├─► Missile 2 ───► Strikes CIWS [Direct Hit 12 Dmg] ──► CIWS Destroyed!
            ├─► Missile 3 ───► Strikes Port Battery [Direct Hit 12 Dmg + 6 Splash to Silo]
            └─► Missile 4 ───► Strikes Port Silo [Direct Hit 12 Dmg + 6 Splash to Battery]
```

### 6.2 Synergies with Other Player Weapons & Upgrades
- **Piercing Ammo (관통탄)**: Piercing rounds pass sequentially through the armored forward bow plate into the central hangar or core behind it, inflicting multiple hit registrations per bullet.
- **Multi-Shot Spread**: Wide spreads allow players to damage both the Port and Starboard batteries simultaneously from the center screen lane.
- **Acid Shield (산성 쉴드)**: Protects against the Dreadnought's Phase 1 lingering mortar corrosive residue patches.

---

### 6.3 Technical Feasibility & Architectural Alignment

#### 1. Zero Modification to Logical Canvas Constraints
- The Dreadnought strictly complies with the engine's core invariant: `logicalWidth = 600` and `logicalHeight = 800`.
- All movement, bullet speeds, and subsystem coordinates are bound to the `[0..600, 0..800]` coordinate space.

#### 2. Clean Class Hierarchy & Component Structure
- Built as a specialized class `DreadnoughtTitan` extending `Entity` (or integrated alongside `CrisisSovereign`), with child `DreadnoughtHardpoint` instances registered in the collision evaluation pipeline.
- Reuses existing bullet pooling and particle explosion systems (`createExplosion`), introducing zero additional GC pressure.

#### 3. High Performance (60 FPS Guarantee)
- All geometry consists of pre-computed local offsets.
- No dynamic asset downloads, zero network latency, instant startup.
- Raycasted laser telegraphs use simple segment math (`ctx.moveTo(x, y); ctx.lineTo(x, 800);`), executing in less than 0.05ms per frame.

---

## 7. Mathematical Balance & Gameplay Progression Curves

### 7.1 Health & Scaling Formula Across Wave Levels
The Dreadnought Titan is designed to appear as an End-Game Crisis event or Apex Boss encounter (e.g. Wave 20, Wave 30, or `CRISIS_TYPE = 'DREADNOUGHT_TITAN'`).

$$\text{Titan Hull HP}(W) = 3200 \times \left(1 + 0.12 \times \max(0, W - 15)\right)$$

$$\text{Subsystem HP}(W) = \text{BaseSubsystemHP} \times \left(1 + 0.08 \times \max(0, W - 15)\right)$$

- **Wave 20 Baseline**: Master Hull = 5,120 EHP, Subsystems = 600–1,200 EHP.
- **Estimated Battle Duration**: 65 to 90 seconds of high-intensity tactical engagement.

### 7.2 Reward Economy
- **Score Value**: `25,000 pts` (highest single boss bounty in game).
- **Currency Drop**: `350 Water Gems` + Guaranteed Level 5 Weapon Upgrade drop or repair kit.

---

## 8. Implementation Blueprint (Phase-Ready for Future Coding)

When the user grants implementation approval, the feature can be cleanly integrated via the following modular task steps:

1. **`src/game/dreadnought/DreadnoughtTitan.ts`**:
   - Composite boss entity managing state, phase timers, and sub-system array.
2. **`src/game/dreadnought/DreadnoughtHardpoint.ts`**:
   - Subsystem hitboxes, local offsets, individual health, and destruction debris.
3. **`src/game/dreadnought/DreadnoughtHUD.ts`**:
   - Top-screen multi-part component health bar and railgun telegraph warnings.
4. **`src/game/SoundManager.ts`**:
   - Add procedural audio routines: `playNavalArtillery()`, `playRailgunCharge()`, `playRailgunBlast()`, `playDreadnoughtGroan()`.
5. **`src/game/GameManager.ts`**:
   - Hook boss spawn in wave loop, route homing missile targeting to include active hardpoints, and handle screen shake triggers.

---

## Conclusion
The **Sunken Dreadnought Titan** elevates *Water Invader* from a standard arcade shooter into an epic, tactical multi-part boss experience. By combining visible subsystem destruction, escalating multi-phase patterns, procedural naval visual styling, visceral synthesized audio, and seamless homing missile synergies, this encounter will stand as the definitive highlight of late-game combat.

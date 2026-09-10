# Feature Proposal: Deep Trench Escort Mission (Allied Cargo Submarine Convoy)
**Agent**: Specialist 5.3 (Creative Brainstorming Swarm — Mission & Game Mode Architecture)  
**Target Domain**: High-Stakes Objective-Based Escort Encounters & Trench Navigation  
**Deliverable File**: `/Users/user/src/water-invader/.agents/swarm_d5_escortmission_3/report.md`  
**Status**: Comprehensive Proposal (Complete)

---

## Executive Summary

The **Deep Trench Escort Mission** ("Operation Hadal Lifeline") introduces a transformative objective-based game mode and dynamic in-run crisis event to *Water Invader*. Departing from pure static wave defense, the player is tasked with shepherding a massive, lumbering deep-sea transport submarine—the **USN *Aegis-Hauler* (Type-IV Benthic Transporter)**—through a narrow, claustrophobic abyssal chasm. 

The chasm is riddled with tectonic shear walls, drift mines, off-screen torpedo batteries, and high-velocity **Suicide Rammer Invaders** eager to pierce the cargo hold. By blending spatial positioning dilemmas (forward mine-clearing vs. close-in torpedo interception), modular voxel hull damage modeling (derived from the game's existing `Barricade.ts` architecture), and rich audiovisual atmospheric design, this feature injects immense tension, tactical depth, and heroic multiplayer/solo satisfaction into *Water Invader*.

---

## 1. Concept & Core Hook

```
                                  [ TRENCH CAVERN ROOF ]
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                         |                     * Bio-Mine *
                         |           [===]                     <-- Offscreen Torpedo
                         |       (Player Vanguard)
                         |
  [ TRENCH ROCK WALL ]   |               [=======================]      [ TRENCH ROCK WALL ]
  (Narrowing Bounds)     |               |   USN AEGIS-HAULER    |      (Narrowing Bounds)
                         |               |  [O]  [O]  [O]  [O]   |
                         |               [=======================]
                         |                 ^ Flashing Nav Lights
                         |
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                [ TRENCH OCEAN BED / ABYSS ]
```

### 1.1 The Narrative & Dramatic Setup
In the deep lore of *Water Invader*, humanity's survivors rely on subterranean oceanic sanctuaries connected by treacherous hadal fault trenches. The **USN *Aegis-Hauler*** is a 180-meter pressurized transport sub carrying critical cargo:
- **Refined Geothermal Power Cores**: Stabilizing subterranean habitats.
- **Pure Water Desalination Hydro-Filters**: The literal lifeblood of the fleet.
- **Civilian & Science Evacuation Pods**: Fleeing fallen upper aquifers.

The transport is heavily armored and shielded, but it is slow, cumbersome, and has zero forward offensive armaments. The player's interceptor submarine is the sole vanguard standing between the convoy and total annihilation by the Abyssal Swarm.

### 1.2 The Hook: Dynamic Objective vs. Static Defense
- **Dynamic Scroll Vectoring**: Rather than defending fixed bottom barricades while enemies descend, the screen environment dynamically scrolls downward (or the convoy slowly pushes upward at 35–50 px/s along the Y-axis), creating an authentic sense of vertical subterranean descent/ascent.
- **High-Stakes Failure State**: Convoy destruction does not just end a wave; it triggers a catastrophic decompression shockwave. Conversely, successfully escorting the convoy into the **Safe Harbor Trench Airlock** yields massive pure-water bounties, legendary weapons, and full fleet reinforcements.
- **Dual Modes of Integration**:
  1. **Dedicated Game Mode ("Trench Convoy Run")**: A standalone 5-stage progressive escort campaign through distinct hadal biomes (Sulfur Chasm, Basalt Gut, Abyssal Trench).
  2. **In-Run Emergency Crisis Event ("Operation Leviathan Lifeline")**: Triggerable at Wave 15 or 25 as an alternative to standard End-Game Crises (`EndGameCrisis.ts`), where saving the convoy rewards the player with an automated Allied Dreadnought or Repair Bot fleet for subsequent waves.

---

## 2. Escort Mechanics & Submarine Systems

### 2.1 Convoy Physical & Navigational Specifications
| Parameter | Value / Formula | Design Rationale |
| :--- | :--- | :--- |
| **Dimensions** | 180px width × 75px height | Massive presence occupying ~30% of logical canvas width (600px). |
| **Base Movement Speed** | 35 px/s (Vertical ascent/descent) | Deliberately slow crawl requiring continuous player escort vigilance. |
| **Maximum Health (HP)** | 100 HP (Split across 3 modular compartments) | High durability to prevent instant wipeouts, but vulnerable to focused assault. |
| **Energy Deflector Shield** | 50 Shield HP (Regens after 5.0s unattacked) | Absorbs chip damage; collapses under concentrated fire. |
| **Collision Boundary** | 3 Distinct Hitboxes (Bow, Midship, Engines) | Allows tactical damage distribution and directional protection. |

### 2.2 Convoy Subsystems & Interactive Behaviors
1. **Supply Tender Aura (Tactical Proximity Buff)**:
   - When the player remains within **140px** of the cargo sub's center, an energy tether engages (`Supply Line Connected`).
   - **Player Buffs**: +25% Primary Weapon Fire Rate (`baseFireRate` reduced by 25%), +1 Homing Missile recharge rate every 4 seconds, and steady stress reduction (`stressLevel -= 10/s`).
   - **Convoy Buff**: While the player is inside the escort radius, the convoy's shield regeneration delay is halved (from 5.0s to 2.5s).
2. **Modular Compartment Damage**:
   - **Bow (Front Section)**: Takes head-on torpedo and mine impact. If destroyed (0/30 HP), convoy speed drops by 40% due to hydrodynamic drag.
   - **Midship (Cargo Compartments)**: Houses the payload. If hull breach occurs (0/40 HP), precious cargo crates leak into the trench (player can scoop them for partial salvage, but final mission rating drops).
   - **Stern Propulsion (Engines)**: Vulnerable to flanking predators. If damaged (0/30 HP), steering locks, causing the sub to drift erratically toward trench rock walls.
3. **Automated Point-Defense Chaff Launcher (PDC)**:
   - The convoy has 2 automated dual-mount PDCs mounted on the upper dorsal hull.
   - Automatically fires kinetic micro-flak bursts every 1.8 seconds at enemy torpedoes or mines within 100px.
   - Can be overwhelmed by dense barrages, reinforcing that the player is the primary defender.

### 2.3 Enemy Threat Archetypes & Suicide Rammer Invaders

```
       [Kamikaze Rammer]                  [Bio-Mine Dropper]             [Heavy Trench Torpedo]
         ▼ Glowing Red                       ▼ Floats Down                  ▼ High Impact
        / \                                  ( O )                         /======>
       /___\  (380 px/s rush)                / | \                         \======>
         |                                  (Spikes)                       (Homing)
```

1. **Abyssal Prowler (Suicide Rammer Invader)**:
   - **Behavior**: Spawns from high trench crevices, pauses for 0.6s to emit a high-pitched sonic screech and glow fiery crimson, then engages hydro-thrusters in a 380 px/s parabolic ramming charge directly targeting the cargo sub's midsection.
   - **Impact Damage**: Deals 15 direct structural damage to the convoy upon impact, bypassing 50% of shields.
   - **Player Interception**: The player can physically body-block the rammer (if player has invincibility frames or heavy shields) or destroy it mid-flight. Destroying it within 60px of the convoy triggers an explosion that can splash damage nearby enemies.
2. **Abyssal Trench Mine-Layers**:
   - Lurk along trench rock faces, deploying floating spiked bio-mines that anchor directly in the convoy's calculated path.
   - If not detonated by player primary weapons or homing missiles, the convoy collides with them for 20 severe hull damage.
3. **Trench Siege Torpedo Launchers**:
   - Stationary heavy batteries embedded into the canyon walls that fire slow, high-durability guided torpedoes with 400 HP and tracking thrusters.
4. **Hadal Leeches (Parasitic Clingers)**:
   - Small, serpentine organisms that swarm past the player and latch onto the cargo sub's hull, dealing 1.5 DoT per second and slowing convoy speed until the player scrapes them off using precision cannon fire.

---

## 3. Tactical Positioning Dilemma: The Core Push-Pull Loop

The defining gameplay triumph of the Deep Trench Escort Mission is the constant, nerve-wracking **Tension of Spatial Commitment**. The player cannot be in two places at once, forcing continuous high-stakes triage:

```
               +-------------------------------------------------------------+
               |                    FORWARD VANGUARD ZONE                    |
               | (Sweep 180-350px ahead: Clear bio-mines, destroy torpedo    |
               |  launchers, ambush elite spawn portals before they fire)     |
               +-------------------------------------------------------------+
                                              ▲
                                              | PUSH FORWARD: Clear path!
                                              | RETREAT: Defend sub!
                                              ▼
               +-------------------------------------------------------------+
               |                    CLOSE ESCORT BASTION                     |
               | (Stay 0-140px near convoy: Supply aura active, intercept    |
               |  diving rammers, body-block torpedoes, shoot hull leeches)  |
               +-------------------------------------------------------------+
```

### 3.1 The Tactical Choice Matrix

| Tactical Stance | Player Position | Key Advantages | Fatal Risks & Failure Modes |
| :--- | :--- | :--- | :--- |
| **Vanguard Sweeper (Offensive Push)** | Moving 200–350px ahead of the cargo sub near screen top/mid. | Destroys bio-mines before the convoy reaches them; neutralizes torpedo batteries before they fire; collects dropped currency. | High-speed Suicide Rammers or stealth flankers spawn from trench sides behind the player, striking the defenseless convoy before the player can backtrack. |
| **Close Bastion (Defensive Cling)** | Hovering directly above/beside the cargo sub (0–120px). | 100% interception rate against suicide rammers; supply tender aura keeps ammo/shields active; player can use barricades to shield sub. | Unchecked bio-mines drift into the convoy's path; long-range siege batteries accumulate on screen edges, overwhelming point-defense systems. |
| **Flank Sweeper (Perimeter Patrol)** | Weaving along the narrow trench walls (X: 50–120px or 480–550px). | Destroys wall-clinging leech nests and stationary missile turrets; opens bonus secret ore pockets in rock walls. | Leaves the central channel exposed to vertical dive-bombing swarms. |

### 3.2 Dynamic Tactical Modifiers (Environmental Curveballs)
- **Trench Narrows**: Rock walls constrict the logical width from 600px down to 420px for 12 seconds. Maneuvering room is severely restricted, forcing tight defense against rammers with zero margin for dodging.
- **Thermal Vent Cross-Currents**: Massive horizontal volcanic gas geysers blast across the chasm, pushing the convoy and player horizontally toward rock walls while obscuring projectile visibility.
- **Abyssal Blackout (Hadal Fog)**: Lighting cuts out; player searchlights and convoy yellow hazard strobes provide the only illumination cone, turning radar pings into life-or-death warnings.

---

## 4. Visuals & Web Audio SFX Direction

### 4.1 Visual Design: USN *Aegis-Hauler* Procedural Canvas 2D Vector Art

The convoy sub is designed to look industrial, rugged, and colossal, utilizing rich layered Canvas 2D primitives:

```
                  +----------------------------------------------+
                  |  [YELLOW HAZARD BEACON] (Blinks at 1.5 Hz)   |
  +---------------+----------------------------------------------+---------------+
  |  BOW SECTION  |         CENTRAL PRESSURIZED CARGO BAY        | ENGINE BLOCK  |
  |  (Reinforced  |  [CRYOGENIC POD 1]   [DESAL FILTER CORE]     | (Dual Bronze  |
  |   Ramming Prow|  (Glowing Cyan LED)  (Pulsing Water Tube)    |  Propellers)  |
  +---------------+----------------------------------------------+---------------+
                  |  PDC FLAK TURRET      PDC FLAK TURRET        | BUBBLE EXHAUST|
                  +----------------------------------------------+---------------+
```

1. **Hull Palette & Texture**:
   - Primary Hull: Weathered battleship slate-blue (`#1e293b`) with industrial submarine yellow trim (`#f59e0b`).
   - Hazard Stripes: 45-degree alternating yellow/black warning diagonals along the cargo bay rim.
   - Glass Observation Dome: Deep cyan tinted gradient with silhouette of crew inside operating consoles.
2. **Lighting & Beacons**:
   - **Blinking Navigation Strobes**: Dual high-intensity amber strobe lights at the bow and stern flash every 0.8s (`ctx.arc` with radial gradient glow radiating 35px).
   - **Forward Searchlight Cones**: Twin semi-transparent white-yellow spotlight beams (`rgba(254, 240, 138, 0.12)`) sweeping ahead into the murk, dynamically illuminating incoming mines and enemies.
3. **Dynamic Damage Stages**:
   - **100%–70% HP**: Pristine metallic sheen, smooth continuous twin bubble trails from bronze props.
   - **69%–35% HP**: Pitted armor scorched black, one engine sputtering intermittent black smoke and jagged spark particles (`#fbbf24`).
   - **< 35% HP (Critical Hull)**: Entire sub bathed in pulsing red emergency sirens (`rgba(239, 68, 68, 0.3)`), massive plumes of pressurized white air bubbles venting from ruptured compartments, noticeable propeller cavitation flutter.

### 4.2 Environmental Trench Aesthetics
- **Trench Cavern Walls**: Textured dark basalt rock borders on the left (`x: 0` to `x: 70`) and right (`x: 530` to `x: 600`) rendered with procedural polygon crags and glowing bioluminescent sea-moss (`#10b981`).
- **Depth Atmospheric Gradient**: Background deepens from dark navy ocean (`#030712`) to pitch hadal abyss (`#02040a`) with rising sulfur thermals and suspended marine snow particles drifting upward.

### 4.3 Procedural Web Audio SFX (Zero External Asset Overhead)
Fully implemented via Web Audio API nodes in `SoundManager.ts`:

1. **Submarine Active Sonar Convoy Ping (`playConvoySonarPing`)**:
   - *Acoustics*: Low, haunting, resonant oceanic ping with 2.2s wet decay.
   - *Synthesis*: Dual Sine oscillators at 330 Hz exponentially decaying to 110 Hz through a high-Q Biquad Bandpass filter (220 Hz, Q=8.0) and convolved with an exponential aquatic gain envelope.
2. **Heavy Diesel-Electric Cavitation Drone (`playConvoyEngineLoop`)**:
   - *Acoustics*: Rhythmic, low-frequency 45 Hz sawtooth rumble that gently modulates in frequency (+/- 4 Hz) to simulate massive bronze propellers displacing dense water.
3. **Emergency Klaxon & Radio Distress Beep (`playConvoyDistressCall`)**:
   - *Acoustics*: Urgent maritime dual-tone chirp (880 Hz / 660 Hz alternating at 6 Hz) accompanied by a low radio static burst.
4. **Suicide Rammer Lock-On Screech (`playRammerAlarm`)**:
   - *Acoustics*: High-frequency rising pitch glide (400 Hz to 1400 Hz over 0.6s) warning the player of an incoming ramming run.
5. **Hull Breach / Metal Creak Thud (`playConvoyHullImpact`)**:
   - *Acoustics*: Low-frequency resonant impact (75 Hz decaying to 25 Hz) layered with a metallic distortion flutter simulating buckled submarine bulkheads.

---

## 5. UI Architecture: Convoy Hull Integrity & Navigational Telemetry

```
+--------------------------------------------------------------------------------------------------+
| [CONVOY: USN AEGIS-HAULER]   SHIELD: [||||||||||] 50/50   HULL: [||||||||||||||||||||] 100/100    |
| DISTANCE TO SAFE HARBOR: [=====>--------------------------------------] 280m / 1000m             |
+--------------------------------------------------------------------------------------------------+
```

### 5.1 Convoy Telemetry HUD Widget (Top-Center Canvas Overlay)
1. **Dual-Layer Structural Status Bar**:
   - **Energy Shield Bar (Upper Thin Bar)**: Hex-cyan (`#38bdf8`), displays current 0–50 Shield HP with animated hexagonal pulse when taking fire.
   - **Armored Hull Bar (Lower Thick Bar)**: Segmented into 3 distinct sections (Bow [30%], Cargo [40%], Engines [30%]). Color transitions dynamically based on aggregate health:
     - > 65% HP: Emerald Green (`#22c55e`)
     - 35%–64% HP: Industrial Amber (`#f59e0b`)
     - < 35% HP: Flashing Emergency Crimson (`#ef4444`) with pulsing "HULL CRITICAL" alert text.
2. **Distance-to-Safe-Harbor Navigational Progress Track**:
   - A sleek horizontal telemetry track positioned directly beneath the health bar.
   - **Convoy Marker**: Mini submarine icon sliding smoothly from Left (0m - Trench Entry) to Right (1000m - Sub-Surface Harbor Gate).
   - **Hazard Waypoints**: Icons placed along the bar indicating upcoming hazards:
     - ⚠️ Minefield (At 350m)
     - ⚡ Tectonic Rift Zone (At 600m)
     - 💀 Abyssal Apex Ambush (At 850m)
     - 🏁 Safe Harbor Airlock (At 1000m)
3. **Off-Screen Threat Radar & Proximity Reticles**:
   - When Suicide Rammers or Torpedoes spawn off-screen, directional holographic chevron arrows flash at screen borders:
     - `[⬇️ RAMMER: 220px]` (Flashing red, size pulses relative to speed).
     - `[⬆️ TORPEDO: 180px]` (Flashing yellow-orange with audio proximity beeps).
4. **Supply Tether Indicator**:
   - When the player is within 140px of the convoy, an electric blue tether line connects the player ship to the sub, and a subtle HUD badge illuminates: `SUPPLY LINE LINKED // RAPID FIRE + RELOAD ENGAGED`.

---

## 6. Synergies with Barricades, Weapons & Systems

### 6.1 Unprecedented Synergy with the Barricade System (`Barricade.ts`)
The existing *Water Invader* codebase features a sophisticated 6x4 voxel block destructible/indestructible barricade architecture (`Barricade.ts`). The Deep Trench Escort Mission creates ground-breaking synergies with this system:

```
         [ Incoming Torpedo / Rammer ]
                      │
                      ▼
            [#][#][#][#][#][#]  <-- Player Deploys Trench Barricade (Deployable Bulwark)
            [#][ ][#][#][ ][#]      Voxel grid absorbs 20 direct damage, saving the convoy!
                      │
            ~~~~~~~~~~~~~~~~~~~~
             [ CONVOY SUBMARINE ]
```

1. **Convoy Hull as Dynamic Multi-Compartment Voxel Armor**:
   - Instead of a simple single health integer, the cargo sub's external armored belt can reuse `Barricade.ts`'s 6x4 voxel block destruction logic!
   - Incoming attacks knock out specific armor blocks on the submarine's flanks, exposing internal machinery. Players can visibly watch the transport's armor peel away under fire.
2. **Deployable Trench Barricades (Pocket Pontoons)**:
   - Players can purchase or earn **Deployable Magnetic Barricades**. Dropping a barricade directly into the trench channel creates an instant 60x40px defensive barrier that drifts slowly along with the convoy or anchors to trench walls.
   - It intercepts suicide rammers and absorbing heavy torpedo strikes before they touch the submarine.
3. **Allied Repair Bot (`HelperType.REPAIRER`) Synergy**:
   - In existing code (`Helper.ts`), `REPAIR_BOT` searches for damaged barricades and restores their voxel blocks.
   - During the Escort Mission, the player's deployed Repair Bots automatically tether to the convoy sub, actively reconstructing missing armor voxel blocks and patching breached compartments!

### 6.2 Synergy with Player Weapons & Progression
- **Homing Missiles (`HomingMissile`)**: Fast-moving Suicide Rammers are difficult to track with standard cannons; homing missiles provide the vital counterplay to snipe charging rammers in their 0.6s acceleration phase.
- **Piercing Weapon Upgrades**: Piercing rounds punch through clustered minefields, detonating 3–4 mines in a single shot to clear wide shipping lanes for the convoy.
- **Acid Rain Shield**: If encountering an abyssal sulfur vent or toxic brine pool, the player can position their ship with Acid Rain Shield directly above the convoy's vulnerable cargo intake to neutralize corrosive damage.

### 6.3 Synergy with End-Game Crises (`EndGameCrisis.ts`)
- **Crisis Climax - "Operation Leviathan Lifeline"**:
  - The mission can culminate at 900m with an ambush by a **Crisis Sovereign** (e.g. *Leviathan World-Eater* or *Phantom Dreadnought*).
  - The player must hold off the boss while the cargo sub completes its emergency docking sequence.
  - Upon reaching 1000m, the safe harbor heavy railgun batteries power on, unleashing an apocalyptic retaliatory barrage that obliterates the remaining invaders in a triumphant climax!

---

## 7. Architectural Feasibility & Technical Implementation

### 7.1 Strict Compliance with Engine Constraints
- **Logical Dimension Preservation**: Fully operates within the mandatory `canvasWidth = 600` and `canvasHeight = 800` logical coordinate system in `GameManager.ts`. No viewport or logical size modifications required!
- **Zero Heavy Dependencies**: All visuals (submarine, beacons, bubbles, rock walls) use native HTML5 Canvas 2D methods (`ctx.beginPath`, `ctx.bezierCurveTo`, `ctx.arc`, `ctx.fillRect`).
- **Web Audio Compliance**: All SFX leverage existing `SoundManager.ts` patterns without requiring external sound files or audio decoders.
- **Performance Budget**: The convoy sub and 10–15 mine/rammer entities introduce negligible overhead (< 0.8ms per frame on mobile browsers), with all particle effects recycling through the existing `particlePool`.

### 7.2 Core Class Structure (`EscortMission.ts` Architecture Draft)

```typescript
export interface ConvoyCompartment {
  id: 'BOW' | 'CARGO' | 'ENGINES';
  hp: number;
  maxHp: number;
  voxelBlocks: boolean[]; // 6x4 damage grid matching Barricade.ts
}

export class CargoConvoySubmarine extends Entity {
  public shieldHp: number = 50;
  public maxShieldHp: number = 50;
  public compartments: Record<'BOW' | 'CARGO' | 'ENGINES', ConvoyCompartment>;
  
  public distanceTraveled: number = 0;
  public readonly targetDistance: number = 1000;
  public crawlSpeed: number = 38; // px/sec
  
  public beaconTimer: number = 0;
  public tetherActive: boolean = false;
  
  constructor(canvasWidth: number, startY: number) {
    super((canvasWidth - 180) / 2, startY, 180, 75);
    // Initialize modular voxel compartments matching Barricade architecture
  }

  public update(deltaTime: number, player: Player): void {
    // 1. Update distance & forward movement
    // 2. Check player proximity for Supply Tether (140px radius)
    // 3. Regenerate shield if unattacked for > 5.0s (or 2.5s with player tether)
    // 4. Update beacon strobe animations and bubble particle emissions
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // Procedural rendering of industrial hull, yellow hazard trim,
    // observation dome, blinking strobes, and voxel armor damage overlay
  }
}
```

---

## 8. Summary of Player Impact & Engagement Value

1. **Breaks Repetition**: Replaces predictable stationary bottom-defense with a dynamic, moving tactical theater where the defensive anchor is constantly in motion.
2. **Empowers Heroic Saves**: Body-blocking a lethal torpedo intended for an allied transport at 5% hull provides an unmatched adrenaline rush and emotional victory.
3. **Elevates Non-Offensive Upgrades**: Makes movement speed, barricade utility, repair bots, and defensive shields as strategically critical as pure DPS.
4. **Rich World-Building**: Transforms *Water Invader* from an abstract arcade shooter into an epic, living oceanic defense saga.

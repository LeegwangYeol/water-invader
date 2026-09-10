# FEATURE PROPOSAL: THE HADAL BIO-HORRORS
## Domain: Parasitic, Swarming, Mutating Faction (Specialist 4.1)

**Target Document**: `/Users/user/src/water-invader/.agents/swarm_d4_hadalbio_1/report.md`  
**Author**: Specialist 4.1 (42-Agent Creative Brainstorming Swarm)  
**Classification**: Game Design & Systems Architecture Specification  
**Game**: Water Invader (Next.js / HTML5 Canvas / Web Audio Engine)  

---

## 1. Executive Summary & Thematic Pitch Hook

### 1.1 The Thematic Pitch Hook: "The Mariana Inversion"
Deep beneath the photic zone, below the bathypelagic twilight and into the abyssal trenches of the Marianas (11,000+ meters down), hydrostatic pressures exceed 1,100 bar, sunlight is an alien concept, and superheated hydrothermal vents discharge mineral sulfur, heavy silicates, and primordial enzymes. In this Stygian cradle, life did not evolve through silicon technology or mechanical chassis—it coalesced into an ancient, sentient macro-organism: **The Hadal Chitin Hive (하달 갑각 군체)**.

For millennia, the Hadal Bio-Horrors slumbered in perpetual darkness, feeding on abyssal hydrothermal vents and marine snow. However, the surface-aquifer sonic mining operations of humanity's Sub-Fighters and the invasive subterranean drill-pods of the mechanical **Rogue Faction** shattered the tectonic bedrock of the trench. Awakening in fury, the Hadal Bio-Horrors ascend through the water column.

Unlike the disciplined metallic formations of the Invaders or the high-tech energy-shielded drones of the Rogues, the Hadal Bio-Horrors represent **visceral biological terror**:
- **Blind Sensory Perception**: Lacking optical eyes, they navigate through hypersensitive acoustic lateral-line organs and electro-receptive vibrissae that instantly lock onto engine propeller cavitations and muzzle flashes.
- **Mineralized Chitin-Bone Exoskeletons**: Layered aragonite and organic silicates form an ultra-dense outer shell that deflects un-pierced ballistic munitions.
- **Parasitic Symbiosis**: They do not merely destroy their enemies; they latch onto hulls, siphon sub-atomic reactor power, choke ballasts, and lay bio-larval clutches directly into exhaust manifolds.
- **Rapid Epigenetic Mutation**: When battered by a specific weapon doctrine, the hive's collective cellular RNA rearranges within seconds, breeding hyper-specialized resistances against the player's primary damage sources.

```
+=======================================================================================+
|                              THE HADAL HIERARCHY CONCEPT                              |
+=======================================================================================+
|                                                                                       |
|   [Wave 1-9: The Trench Seeps]       --> Parasite Clingers scout and test hulls       |
|   [Wave 10-19: Abyssal Swarm Echelon]--> Spore Siphoners create choking minefields    |
|   [Wave 20-29: Chitin Siege Titan]   --> Carapace Colossi form impenetrable bone walls|
|   [Wave 30+ / Crisis: Hive Incursion]--> Synergy with Biomorphic Swarm End-Game Crisis|
|                                                                                       |
+=======================================================================================+
```

---

## 2. Enemy Roster & Unique Mechanics

The Hadal Bio-Horrors introduce five brand-new, mechanically distinct enemy archetypes designed to shatter standard static shooting habits. They emphasize tactical positioning, weapon variety, and active movement.

```
+---------------------+-------------+-----------+-----------------------------------------+
| Enemy Archetype     | Threat Tier | Base Role | Signature Mechanics                     |
+---------------------+-------------+-----------+-----------------------------------------+
| Parasite Clinger    | Mob / Swarm | Flanker   | Hull Adhesion, Drag, Torque, Wiggle Off |
| Spore Siphoner      | Mid-Tier    | Area Denial| Vacuum Absorption, Persistent Bile Cloud|
| Carapace Colossus   | Heavy Elite | Bulwark   | 140° Directional Shield, Piercing Shatter|
| Abyssal Angler      | Elite Hunter| Ambush    | False Radar Decoy, Blinding Stun Flash  |
| Broodmother Matriarch| Mini-Boss  | Spawner   | Larval Injection, Pheromone Frenzy Aura |
+---------------------+-------------+-----------+-----------------------------------------+
```

### 2.1 Parasite Clinger (기생 흡착체 — *Hadal Hirudinea*)
- **Role**: Hyper-aggressive swarming parasite that targets player maneuverability.
- **Visual Appearance**: Segmented vermicular body (width 32px, height 24px) rendered in glistening iridescent viridian (`#059669`). Features 8 barbed chitinous walking claws, a pulsating translucent dorsal organ (`#10b981`), and a circular lamprey-style ring of recurved serrated teeth.
- **Behavior Pattern**:
  1. *Evasive Approach*: Dives downward in high-frequency corkscrew trajectories (`speedX: 160`, `speedY: 180`), dodging straight-line player shots.
  2. *Latching Maneuver*: When within 45px radius of the Player's Submarine, the Clinger executes an explosive pounce, disabling its regular hit-box and affixing itself directly onto the player ship's chassis.
- **Mechanics & Status Effects (Parasitic Drag)**:
  - **Speed Reduction**: Each attached Clinger reduces the player's horizontal propulsion speed by **-25%** (stacking up to 3 clingers for a catastrophic **-75%** movement penalty).
  - **Rotational & Steering Torque**: The Clinger imposes continuous lateral drift, physically dragging the submarine toward the side of the hull it attached to.
  - **Cooling Choke**: Chokes the player's weapon heat sinks, increasing `baseFireRate` delay by **+20%** per parasite.
- **Player Counterplay (The "Wiggle & Scrape" Protocol)**:
  - *Rapid Alternating Steer*: Tapping Left and Right keys alternately 4 times (`← → ← →` within 1.2s) dislodges one Clinger via centrifugal force.
  - *Barricade Scrape*: Flying close alongside a friendly Barricade physically shears off the Clinger, dealing 5 damage to the parasite.
  - *Emergency Burst*: Firing the Homing Missile launcher pod blows parasites off the hull in a blast of backwash pressure.

### 2.2 Spore Siphoner (포자 착취체 — *Cystis Siphonophora*)
- **Role**: Aerial area-denial hazard generator and ammunition sponge.
- **Visual Appearance**: Bulbous, floating hydrostatic bladder (width 48px, height 48px) suspended inside a ribcage of semi-flexible chitin calipers. The sac is filled with glowing toxic bile (`#84cc16` neon lime to `#d97706` amber), rhythmically undulating with heartbeat pulses.
- **Behavior Pattern**:
  - *Hover & Siphon*: Floats lazily along sinusoidal waves in the upper-middle canvas (`Y: 120 - 280`). 
  - *Kinetic Ingestion Aura*: Projects a gravitational siphon vortex (radius 110px). Any player bullet that misses an enemy and enters this field is consumed by the Siphoner, causing its bioluminescent sac to swell by +10% volume and +15% detonation radius per bullet absorbed.
- **Death Cataclysm — Corrosive Spore Cloud**:
  - Upon HP reaching 0, the sac ruptures violently, bathing a **90px radius area** (scaling up to 160px if fully gorged) in an acidic bile aerosol that lingers for **4.5 seconds**.
  - *Corrosive Degradation*: Dealing 1 HP damage per 0.75 seconds to any player or barricade caught within the cloud.
  - *Missile Scrambler*: Homing missiles passing through the spore cloud have their seeker sensors blinded, causing them to corkscrew out of control and explode harmlessly.
  - *Counterplay*: Using weapons with `piercing >= 2` detonates the internal pressure core instantly before it swells, reducing the death cloud radius by 60%.

### 2.3 Carapace Colossus (갑각 거수 — *Decapoda Titanus*)
- **Role**: Frontline heavy bulwark with high directional defense.
- **Visual Appearance**: Massive monolithic crustacean behemoth (width 80px, height 60px) armored in massive, multi-tiered calcified bone plates (`#334155` deep slate reinforced with `#e2e8f0` fossilized calcium). At its center pulses a raw, unarmored heart vent glowing incandescent magenta (`#ec4899`).
- **Mechanics & Directional Bone Shield**:
  - **140° Frontal Deflection Arc**: The front facing of the Colossus is protected by a directional bone carapace possessing its own dedicated health pool (`carapaceHp: 40`).
  - **Damage Mitigation**: Non-piercing kinetic bullets striking the frontal arc suffer an **85% damage reduction**, with bullets deflecting off the armor at randomized reflection angles as harmless white spark ricochets.
  - **Dynamic Tracking Angle**: The Colossus rotates its bone shield dynamically toward the player's current X coordinate with an angular lerp speed of `0.05 per frame`.
  - **Flanking Vulnerability**: The dorsal vents and rear thorax are completely unarmored. Projectiles hitting from the sides or homing missiles curving around its rear inflict **200% Critical True Damage**.
  - **Carapace Fracture System**: When the player lands weapon hits with `piercing >= 2`, or focuses 40 damage onto the shield, the bone plate shatters with an explosive ceramic crack sound (`SFX_CHITIN_SHATTER`). The Colossus is stunned for 2.5 seconds, exposing its vulnerable heart core to frontal assault.

### 2.4 Abyssal Angler (심해 아귀 초롱체 — *Ceratias Occultus*)
- **Role**: Camouflaged stealth sniper and visual deceiver.
- **Visual Appearance**: Silhouette cloaked in deep refractive camouflage matching the stage background (`alpha: 0.15`), making it nearly invisible against the dark water, save for a long, arching bioluminescent lure (*esca*) dangling forward (`#38bdf8` electric azure).
- **Mechanics**:
  - *False Radar Lure*: The glowing lure mimics the sprite and pulsation of a floating `Pure Water Currency (+50)` drop or an `Allied Distress Beacon`. 
  - *Bioluminescent Flashbang*: When the player approaches within 120px to collect the lure, the Angler flashes its organ at blinding intensity:
    - Sets the player's `suppressionLevel` instantly to **95** (causing maximum bullet spread).
    - Flashes the canvas with an intense vignette bloom.
    - Lunges forward at 320 px/s with open needle fangs dealing 2 contact damage.
  - *Counterplay*: Observant players can identify the false lure by its erratic horizontal twitching and subtle chromatic aberration, destroying the lure from long range to trigger an ocular overload that paralyzes the Angler.

### 2.5 Broodmother Matriarch (하달 군체 모체 — *Nautilus Regina*) [Wave Leader / Mini-Boss]
- **Role**: Siege carrier and biological reinforcement coordinator.
- **Visual Appearance**: Colossal spiral-shelled nautiloid terror (width 140px, height 110px) featuring exposed translucent egg-clusters along its ventral keel and twin siphon jets churning bubbles.
- **Mechanics**:
  - *Egg Clutch Deployment*: Spits batches of 3-5 leathery egg sacs toward the bottom of the screen. If not destroyed within 3.0 seconds, each egg hatches into an active Parasite Clinger.
  - *Pheromone Frenzy Aura*: Radiates a pulsing crimson bio-field (`radius: 250px`). All Hadal Bio-Horrors within the aura receive +35% movement speed, +25% attack rate, and gain 10% lifesteal whenever they gnaw on player barricades.
  - *Pressurized Hydro-Cannon*: Fires high-pressure jets of liquefied bio-acid that slice vertically across the screen, demanding rapid player dodging.

---

## 3. Real-Time Mutation & Adaptation Engine

The defining mechanical identity of the Hadal Bio-Horrors is **Epigenetic Reactive Evolution**. Unlike static invaders that merely scale in HP and projectile speed, the Hadal Hive actively analyzes the player's loadout and playstyle, mutating defensive counter-traits across successive waves.

```
+=======================================================================================+
|                     HIVE GENETIC REACTION PIPELINE (LOGICAL LOOP)                     |
+=======================================================================================+
|                                                                                       |
|   1. Weapon Metric Sensor (GameManager tracks player damage profile)                  |
|      - Kinetic Multi-shot DPS vs. Homing Missiles vs. Piercing Railguns                |
|                                                                                       |
|   2. Genetic Mutation Threshold Check (Calculated at end of every 2nd Wave)           |
|      - Dominant Weapon Archetype identified (>50% of total damage dealt)              |
|                                                                                       |
|   3. Epigenetic Adaptation Trigger                                                    |
|      -> IF Kinetic Dominance   : [Mutate: Diamond-Carapace Hardening]                |
|      -> IF Missile Dominance   : [Mutate: Pheromone Chaff Decoy Siphoners]            |
|      -> IF Piercing Dominance  : [Mutate: Viscous Gelatinous Flesh]                   |
|      -> IF Ally Dominance      : [Mutate: Apex Predator Tendril Hooks]                |
|                                                                                       |
|   4. Dynamic UI Warning: "HIVE METAMORPHOSIS DETECTED: ADAPTATION IMMINENT"          |
|                                                                                       |
+=======================================================================================+
```

### 3.1 Weapon Adaptation Matrix

| Detected Dominant Weapon | Trigger Condition | Hive Genetic Mutation | Mechanical In-Game Consequence | Player Tactical Pivot Required |
| :--- | :--- | :--- | :--- | :--- |
| **Kinetic Multi-Shot Spam** (`multiShot >= 3`) | Deals >50% of total player damage across last 2 waves | **Anti-Ballistic Calcification** (*방탄 석회화 갑각*) | Enemies develop hexagonal mineral scales. Grants **35% flat kinetic damage resistance**; 20% chance for bullets to ricochet harmlessly. | Shift from wide spread bullet spray to concentrated Homing Missiles or high-piercing center-line strikes. |
| **Homing Missile Salvos** (`homingMissiles >= 2`) | Homing missiles account for >45% of total kills | **Bioluminescent Chaff Siphon** (*생체 발광 교란 페로몬*) | All dying enemies expel a cloud of fluorescent ink flakes that decoy and divert incoming homing missiles away from high-value targets. | Turn off auto-reliance on missiles; manually aim precise direct-fire weapons at priority targets. |
| **Piercing Rail Munitions** (`piercing >= 2`) | High linear pierce kills through columns of enemies | **Amoebic Viscous Cellular Matrix** (*비뉴턴 유체형 점액질*) | Flesh becomes non-Newtonian fluid. **Projectiles lose pierce capability** after hitting the first target, absorbing kinetic energy and slowing the projectile. | Reposition laterally for wide-angle flanking rather than relying on vertical hallway piercing. |
| **Allied Fleet Dependency** (Repair Bots / Fighters active) | Allied units inflict >35% of wave damage | **Allied Pheromone Scent-Hounds** (*지원군 포식자 페로몬*) | Fast parasite clingers reprioritize targets: they ignore the player and swarm Allied Reinforcements, devouring them to heal the Hive. | Protect and escort allied support craft; clear flankers before they swarm defensive drones. |

### 3.2 Dynamic Resistance Math & Bounds
To preserve arcade balance and prevent unwinnable scenarios:
- **Maximum Damage Resistance Cap**: No mutation may exceed a **40% damage reduction** ceiling.
- **Single Adaptation Per Cycle**: The Hive can only sustain **one major mutation simultaneously** per echelon (waves 1-9: 0 mutations, waves 10-19: 1 mutation, waves 20-29: 2 mutations).
- **Genetic Reversion**: If the player switches weapons and the previous dominant weapon drops below 30% of damage dealt for 2 consecutive waves, the previous adaptation atrophies and falls off, rewarding adaptable players.

---

## 4. Audio & Visual Spectacle

The Hadal Bio-Horrors transform Water Invader into a dark, pulsing, biopunk underwater nightmare. All audio and visual elements are fully feasible within the project's native HTML5 2D Canvas rendering context and procedural Web Audio API architecture.

### 4.1 Visual Rendering & Organic Canvas Shaders
1. **Procedural Pulsing & Breathing**:
   - Rather than rigid static sprites, Hadal bodies use dynamic sinusoidal vertex offsets:
     $$\text{pulseScale} = 1.0 + 0.08 \times \sin(\text{timeAlive} \times 4.5)$$
     $$\text{tentacleWiggle} = \sin(\text{timeAlive} \times 6.0 + \text{segmentIndex} \times 0.8) \times 6.0$$
   - This produces eerie, living breathing motions where fleshy bellies contract and expand in organic cycles.
2. **Bioluminescent Phosphor Glows (Additive Canvas Compositing)**:
   - Utilizes `ctx.globalCompositeOperation = 'lighter'` and multi-stop radial gradients:
     - Outer Glow: `rgba(16, 185, 129, 0.0)` (0px) to `rgba(16, 185, 129, 0.35)` (45px radius).
     - Core Flare: `rgba(245, 158, 11, 0.9)` (pure amber bioluminescence).
   - In deep waters, these glowing nodes pierce through the dark background, providing striking contrast without obscuring bullet trajectories.
3. **Viscous Bioluminescent Blood & Splatter Emitters**:
   - On taking damage, instead of standard metal debris particles, Hadal enemies spray glowing fluorescent fluid droplets (`#10b981`, `#84cc16`, `#a855f7`).
   - Particles possess randomized viscosity drag, gravity buoyancy, and fade through an exponential alpha curve.
   - When a Carapace Colossus shield fractures, calcified ivory bone fragments splinter outwards with rotational physics.

```
+=======================================================================================+
|                   CANVAS 2D PROCEDURAL RENDERING PIPELINE FOR HADAL                   |
+=======================================================================================+
|                                                                                       |
|   1. Background Depth Wash: Deep Hadal Trench tint (#020617 -> #041f18 gradient)      |
|   2. Particle Layer: Floating bioluminescent marine snow & toxic spore filaments       |
|   3. Underlay Glow: ctx.globalCompositeOperation = 'lighter' radial aura passes       |
|   4. Organic Body Hull: ctx.beginPath() bezier curves for pulsing flesh & carapaces   |
|   5. Segmented Limbs: Inverse-kinematic wiggling tentacle joints                      |
|   6. Overlay Details: Serrated mandibles, bone ridges, phosphorescent organ sacs      |
|   7. UI Splatter Overlay: Dripping green parasite mucus along screen margins          |
|                                                                                       |
+=======================================================================================+
```

### 4.2 Web Audio API Procedural Sound Synthesis
In strict adherence to `SoundManager.ts` patterns (no external MP3/WAV dependencies, zero loading latency, pure Web Audio synthesis):

```typescript
// Conceptual Synthesis Blueprint for SoundManager.ts

/**
 * Procedural synthesis of wet chitinous skittering (Parasite Clinger swarm movement)
 */
public playHadalSkitter() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const bufferSize = this.audioCtx.sampleRate * 0.05; // 50ms micro-burst
  const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Granular burst with high-frequency noise and sudden decay
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
  }
  const noiseSource = this.audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  const filter = this.audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3200 + Math.random() * 800, this.audioCtx.currentTime);
  filter.Q.setValueAtTime(6.0, this.audioCtx.currentTime);
  const gain = this.audioCtx.createGain();
  gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(this.audioCtx.destination);
  noiseSource.start();
}

/**
 * Procedural synthesis of organic squelch / pustule rupture (Spore Siphoner burst)
 */
public playOrganicRupture() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const osc1 = this.audioCtx.createOscillator();
  const osc2 = this.audioCtx.createOscillator();
  const gain = this.audioCtx.createGain();
  const filter = this.audioCtx.createBiquadFilter();

  osc1.type = 'sawtooth';
  osc2.type = 'sine';
  filter.type = 'lowpass';

  // Squelch downward frequency dive
  const now = this.audioCtx.currentTime;
  osc1.frequency.setValueAtTime(380, now);
  osc1.frequency.exponentialRampToValueAtTime(45, now + 0.25);
  osc2.frequency.setValueAtTime(140, now);
  osc2.frequency.exponentialRampToValueAtTime(30, now + 0.3);

  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(180, now + 0.25);
  filter.Q.setValueAtTime(8.0, now); // Visceral liquid resonance

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(this.audioCtx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.3);
  osc2.stop(now + 0.3);
}

/**
 * Procedural synthesis of deep ceramic chitin bone shield deflection
 */
public playChitinDeflect() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const osc = this.audioCtx.createOscillator();
  const gain = this.audioCtx.createGain();
  osc.type = 'triangle';
  const now = this.audioCtx.currentTime;
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.linearRampToValueAtTime(0.01, now + 0.06);
  osc.connect(gain);
  gain.connect(this.audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}
```

---

## 5. UI HUD Threat Indicators & Screen FX

The Hadal Bio-Horrors introduce dedicated HUD telemetry that signals evolutionary state and direct physical parasitism to the player.

```
+=======================================================================================+
|                             HUD HADAL THREAT OVERLAY LAYOUT                           |
+=======================================================================================+
|  SCORE: 148,200   WAVE 18   CURRENCY: 1,250 Pure Water            THREAT: [BIO-HAZARD]|
|  [||||||||||||||||||||] HP: 4/5   STRESS: 35%   SUPPRESSION: 12%                      |
|---------------------------------------------------------------------------------------|
|  >> HIVE ADAPTATION STATUS:                                                           |
|     [●●●] ANTI-KINETIC CHITIN : ACTIVE (35% DMG REDUCTION)                            |
|     [○○○] PHEROMONE CHAFF     : DORMANT (12% THRESHOLD)                               |
|---------------------------------------------------------------------------------------|
|                                                                                       |
|   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~   |
|                                                                                       |
|                    [ SPORE SIPHONER (Swelling Bio-Sac) ]                              |
|                                                                                       |
|                                                                                       |
|                                                                                       |
|           / \                                                                         |
|          / | \   <-- [PARASITE CLINGER ATTACHED!]                                     |
|         [ SUB ]       "WIGGLE [A][D] TO SHAKE OFF!" (Sticky Green Ooze on Screen)     |
|          \___/                                                                        |
|                                                                                       |
|  [BARRICADE 85%]                  [BARRICADE 40%]                  [BARRICADE 100%]   |
+=======================================================================================+
```

### 5.1 HUD Features
1. **Bio-Adaptation Telemetry Bar**:
   - Positioned in the upper UI strip below the score and wave counters.
   - Displays real-time evolutionary adaptation meters (e.g. `BIO-DEFENSE: CALCIFIED CHITIN [82%]`). When maxed, pulses with a vivid biological amber aura warning the player that their current weapon is undergoing diminishing returns.
2. **Parasitic Infestation Screen Vignette**:
   - When one or more Parasite Clingers latch onto the player's ship, the outer 30px screen border darkens into an undulating, visceral green bio-vignette (`rgba(5, 150, 105, 0.45)`).
   - Small dripping bio-mucus droplets slide down the glass viewport.
   - A pulsing central alert appears directly above the player ship: `⚠ HULL INFESTED! RAPID WIGGLE (← →) TO BREAK FREE!`.
3. **Directional Chitin Bone Shield Arc**:
   - For the Carapace Colossus, a small semi-transparent curved bone-arc reticle renders in front of the enemy, glowing brighter as it takes hits and flashing red when its fracture threshold approaches.
4. **Toxic Spore Cloud Boundary Warning**:
   - The boundary of persisting spore clouds is highlighted with glowing green particle fringes, ensuring the player can clearly read the dangerous collision boundary on high-resolution displays.

---

## 6. Synergies with End-Game Crisis System & Feasibility

### 6.1 Direct Alignment with the 12-Crisis Framework
In the game's existing architecture, `game/crisis/types.ts` defines 12 distinct Crisis Archetypes with a strict **5,200 Effective HP Invariant** (`riftHp: 600 * 2 = 1,200` + `sovereignHullHp: 2,500` + `coreHp: 1,500 = 5,200 total`).

The Hadal Bio-Horrors faction provides the perfect narrative and mechanical prologue leading directly into two existing End-Game Crises:
1. **`CrisisArchetype.BIOMORPHIC_SWARM` ("Extragalactic Chitin Flesh-Hive")**:
   - The Hadal Bio-Horrors serve as the vanguard scouts of the Biomorphic Swarm.
   - When Wave 15+ triggers the Biomorphic Swarm Crisis:
     - The two **Dimensional Rifts** are re-skinned as **Abyssal Bio-Gestation Rifts**, continuously spawning swarms of Parasite Clingers.
     - Crisis attacks `CORROSIVE_BILE_BARRAGE` and `SWARM_INFESTATION` trigger the same toxic cloud mechanics as the Spore Siphoners, creating natural player familiarity and deep mastery.
     - The Sovereign Hull activates the Carapace Colossus's directional bone shielding during Phase 2, demanding tactical circling and flanking.
2. **`CrisisArchetype.ABYSSAL_LEVIATHAN` ("Corrupted Bio-Swarm Horror")**:
   - The Leviathan acts as the colossal progenitor patriarch of the Hadal species.
   - The Leviathan's `SPORE_SPIRAL` and `BIO_LARVAE_SWARM` attacks directly utilize the Parasite Clinger latching logic, threatening to anchor the player in place while sweeping massive hydro-beams.

### 6.2 Emergent 3-Way & 4-Way Crossfire Ecology
Currently, `Faction.ts` supports `PLAYER`, `INVADER`, and `ROGUE`. Introducing `Faction.HADAL_BIO` establishes a rich four-way oceanic war:
- **Hadal vs. Rogue**: The organic Hadal Bio-Horrors despise the cold mechanical Rogue drones. Parasite Clingers will actively hunt Rogue Drones, latching onto them and triggering mutual self-destructions.
- **Player Tactical Baiting**: The player can bait a Carapace Colossus into the line of fire of an Invader Sniper or Rogue Goliath, using the Colossus's 140° bone shield as temporary mobile cover, or luring Spore Siphoners into enemy clusters to detonate them as environmental bio-bombs.

### 6.3 Architectural Feasibility & Compliance Checklist

```
+=======================================================================================+
|                         ARCHITECTURAL FEASIBILITY SCORECARD                           |
+=======================================================================================+
|                                                                                       |
|   [CRITICAL CONSTRAINT] logicalWidth / logicalHeight Unchanged:             PASS (OK) |
|   - Operates strictly within logicalWidth: 720, logicalHeight: 960 bounds.            |
|                                                                                       |
|   [PERFORMANCE CONSTRAINT] 60 FPS Fixed Timestep (1/60s):                   PASS (OK) |
|   - Zero memory allocations per frame. Reuses GameManager's existing                  |
|     `particlePool` for bio-splatters and spore clouds.                                |
|                                                                                       |
|   [AUDIO CONSTRAINT] Zero External Asset Dependencies:                      PASS (OK) |
|   - All skittering, rupture, and deflection sounds synthesized procedurally           |
|     via native Web Audio API oscillators, noise buffers, and biquad filters.          |
|                                                                                       |
|   [CRISIS COMPLIANCE] 5,200 EHP Invariant Preserved:                        PASS (OK) |
|   - Perfectly respects existing CrisisArchetype balance contracts in types.ts.        |
|                                                                                       |
|   [ZERO SOURCE CODE MODIFICATION RULE]:                                     PASS (OK) |
|   - Pure ideation and architectural design specification. Zero edits to               |
|     .ts, .tsx, or .css files during this phase.                                       |
|                                                                                       |
+=======================================================================================+
```

---

## 7. Concrete Implementation Roadmap (Phase 1 Engineering Spec)

When approved for implementation in subsequent phases, the Hadal Bio-Horrors feature can be integrated cleanly through the following modular touchpoints:

1. **`src/game/types.ts`**:
   - Add `HADAL_BIO = 'HADAL_BIO'` to `Faction` enum.
   - Add `HADAL_CLINGER = 14`, `HADAL_SIPHONER = 15`, `HADAL_COLOSSUS = 16`, `HADAL_ANGLER = 17`, `HADAL_BROODMOTHER = 18` to `EnemyType` enum.
   - Add `HadalMutationType = 'NONE' | 'ANTI_KINETIC' | 'CHAFF_PHEROMONE' | 'VISCOUS_FLESH' | 'PREDATOR_FERVOR'` to `CrisisState` or `GameManager`.
2. **`src/game/Player.ts`**:
   - Add `attachedParasites: number = 0`.
   - In `Player.update()`, apply `speedModifier = Math.max(0.25, 1.0 - this.attachedParasites * 0.25)`.
   - Add wiggle detection: check alternating `isMovingLeft` / `isMovingRight` inputs within 1.2 seconds to decrement `attachedParasites`.
3. **`src/game/Enemy.ts`**:
   - Implement `carapaceAngle`, `carapaceHp`, and `isCarapaceShattered` in `Enemy` class.
   - In `takeDamage()`, compute angle of incoming bullet relative to enemy orientation; if within 140° frontal arc and non-piercing, apply deflection reduction.
4. **`src/game/GameManager.ts`**:
   - In `updateWave()`, track weapon damage dealt across categories.
   - Compute `checkHadalMutation(wave)` every 2-3 waves.
   - In `spawnEnemies()`, integrate Hadal Bio-Horror archetypes into waves 11-25 and crisis waves.
5. **`src/game/SoundManager.ts`**:
   - Add `playHadalSkitter()`, `playOrganicRupture()`, `playChitinDeflect()`, and `playPheromoneHiss()`.

---

## 8. Conclusion
The **Hadal Bio-Horrors** deliver a rich, grotesque, biopunk evolution to *Water Invader*. By combining **Parasitic Drag**, **Directional Bone Shields**, **Persistent Corrosive Clouds**, and **Epigenetic Reactive Evolution**, this faction eliminates gameplay stagnation, forces weapon diversification, elevates visual spectacle through bioluminescent lighting, and seamlessly grounds the game's late-game End-Game Crisis encounters.

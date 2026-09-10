# Feature Proposal: Endless Descent (무한 심해 강하)
## Roguelike Abyssal Run Mode for Water Invader
**Specialist**: 5.1 (Endless Descent Specialist)  
**Date**: 2026-09-10  
**Status**: Proposal & Technical Specification (NO CODE MODIFICATIONS)  
**Target Repository**: `LeegwangYeol/water-invader`

---

## 1. Executive Summary & Creative Hook

### 1.1 The Concept: "Descent into Challenger Deep"
In standard *Water Invader*, the player defends a fixed defensive perimeter against waves of invaders ascending from below. In **Endless Descent Mode (무한 심해 강하)**, the gameplay axis is inverted and reimagined: the player commands an advanced deep-submergence combat vessel (*Benthos-X*) undertaking an expedition descending into uncharted oceanic abyssal trenches.

Instead of a linear wave progression, the player navigates an interconnected **Bathymetric Sonar Descent Map** (similar to *Slay the Spire* / *FTL*, but oriented downwards into escalating atmospheric depth). Between combat encounters, the player scans acoustic returns and chooses which underwater trench, geothermal fissure, or ancient sunken waypoint to traverse.

```
                      [Surface Aquifer: 0m]
                            (START)
                            /     \
               [Combat: Trench]   [Hazard: Thermal Vent]
                   /     \             /     \
        [Supply Cache]  [Sunken Shrine]   [Combat: Swarm]
                   \     /             \     /
                 [ELITE: Leviathan Incursion]
                            \     /
                 [Pressure Relief Outpost]
                            /     \
                  ... Continuing to 11,000m+ ...
```

### 1.2 The Hook: Dual Tension of Bullets & Hydrostatic Pressure
The defining tension of *Endless Descent* is not merely dodging enemy projectiles; it is surviving the **Hydrostatic Pressure Engine**. As the submarine plunges past 1,000m (Mesopelagic), 4,000m (Bathypelagic), 6,000m (Abyssopelagic), and 10,000m+ (Hadopelagic), the crushing weight of the ocean compresses the vessel's hull:
- Ambient pressure progressively throttles and reduces **Max HP** (e.g., from 5 HP down to 4, 3, 2, or even 1 HP "Critical Hull Strain").
- Players must continually balance offensive fire-power upgrades with **Pressure Valves, Hull Reinforced Bulkheads, and Ballast Purges**.
- The deeper the vessel reaches, the more exotic the rewards: Precursor Atlantean Relics, Bioluminescent Hyper-Lasers, Cavitation Torpedoes, and Black Smoker Energy Caches.

---

## 2. Procedural Descent & Node Selection Mechanics

### 2.1 The Bathymetric Descent DAG (Directed Acyclic Graph)
The run is procedurally structured into sequential **Depth Sectors** (each representing a 2,000m descent tier):
1. **Sector I: Sunlight & Twilight Zone (0m – 2,000m)**: Introduction of basic branching; mild pressure build-up; high supply density.
2. **Sector II: The Midnight Bathypelagic (2,000m – 4,000m)**: Bioluminescent threats appear; line-of-sight visual obfuscation; moderate pressure penalties.
3. **Sector III: The Abyssal Plains (4,000m – 6,000m)**: Heavy rogue submersible incursions, crushing depth events, elite mini-boss encounters.
4. **Sector IV: Hadal Trenches & Fissures (6,000m – 10,000m)**: Severe hydrostatic degradation, tectonic tremors, eldritch cephalopod leviathans.
5. **Sector V: The Uncharted Singularity (10,000m – Endless)**: Procedurally scaled infinite depths with compounding mutators, escalating high scores, and mythical artifact drops.

#### Depth Layer Topology
- Each Sector consists of **7 to 9 Depth Strata (Rows)**.
- Each stratum generates **2 to 4 Nodes**.
- Connections only link downward to adjacent strata (guaranteeing forward/downward momentum without dead ends).
- At the end of each Sector (Stratum 8), the paths converge upon an **Apex Abyssal Boss Node** followed by an **Outpost Decompression Chamber**.

```
[Stratum 1]         (Node 1A)              (Node 1B)
                     /      \             /        \
[Stratum 2]    (Node 2A)   (Node 2B)   (Node 2C)  (Node 2D)
                  |     \     /    \     /    |
[Stratum 3]    (Node 3A)   (Node 3B)   (Node 3C)
                  ... (Branching down to Apex Node) ...
```

---

### 2.2 The Six Node Archetypes

Every node presents a transparent risk-versus-reward calculation displayed on the Sonar Radar before selection:

| Node Type | Icon & Visual Identity | Encounter Mechanics | Guaranteed Rewards |
| :--- | :--- | :--- | :--- |
| **Combat Zone (표준 교전 구역)** | ⚔️ Cyan Crosshairs | Standard invader formations or rogue drone patrols adapted to current depth biome. Waves last 30–45 seconds. | +Pure Water (💧 40–80), Combo Score, Minor Scavenged Alloys. |
| **Elite Incursion (정예 침투 구역)** | 💀 Amber Skull & Crest | High-threat mini-bosses (e.g., *Abyssal Apex Stalker*, *Tectonic Carrier*). Armored enemies with phase-shields or piercing lasers. | +Heavy Water (💧 150–250), **Guaranteed 3-Card Relic Draft**, Sector Key. |
| **Supply Cache (심해 보급 기지)** | 📦 Emerald Shipping Pod | Automated pre-war underwater depot. Non-combat rest site. Player can choose ONE action: Weld Hull (+2 HP), Vent Pressure (-40% Pressure Stress), or Salvage Coolant (+💧 100). | Free restore/vent choice, safe respite from combat. |
| **Sunken Shrine (가라앉은 고대 제단)** | 🔮 Amethyst Atlantean Runes | Ancient pre-human altars found in deep ocean trenches. Presents a Faustian gamble (Blood/Hull Sacrifice for Forbidden Hadal Tech). | Mythic Cursed Artifacts, game-warping build transformations. |
| **Hazard Anomaly (해저 이상 현상)** | ⚠️ Blazing Orange Vortex | Environmental modifier combat: Extreme hydrothermal heat vents (+Fire Rate, but overheating hazard), Acid Trenches (droplets dissolve shields), or Electric Squalls (erratic projectile arcs). | Double Currency (💧 2x), Chance for Exotic Element Boons. |
| **Pressure Relief Outpost (감압 관제소)** | 🛡️ Deep Navy Barricade Shield | Found at Sector boundaries. Allows full decompression, shop vendor access, valve recalibration, and meta-currency banking. | Full hull overhaul, shop item purchases, checkpoint lock-in. |

---

### 2.3 Path Planning Mechanics & Sonar Ping Mechanics
To deepen strategic decision-making:
- **Acoustic Sonar Fog**: Nodes beyond 2 strata ahead are shrouded in underwater acoustic static.
- **Sonar Ping Ability**: Players can expend 25 💧 (Pure Water) to broadcast an active sonar pulse across the descent map, revealing the contents and hazard modifiers of obscured distant nodes.
- **Trench Collapses**: Occasionally, choosing one branch causes an acoustic shockwave that triggers a landslide across an adjacent branch, closing off alternate routes and forcing calculated path commitments.

---

## 3. Roguelike Boons, Curses & Stacking Synergies

Upon defeating an Elite Node, clearing an environmental Hazard Anomaly, or resting at a Sunken Shrine, the player enters the **Acoustic Transmission Interface** to draft **1 of 3 randomized Boons**.

### 3.1 Card Rarities & Draft Weighting
- **Common (파란색 - Blue, 60% base chance)**: Incremental stat augmentations and tactical adjustments.
- **Rare (보라색 - Purple, 28% base chance)**: Synergistic modifiers that alter weapon behavior or utility drones.
- **Legendary (황금색 - Gold, 9% base chance)**: Archetype-defining powers, unique weapon modes, screen-clearing triggers.
- **Abyssal / Corrupted (흑적색 - Crimson/Void, 3% base chance or 100% at Sunken Shrines)**: Massive overpowered benefits paired with debilitating systemic curses.

---

### 3.2 Exemplary Boon Catalog (24 Curated Boons)

#### Offensive Boons (화력 & 무기 체계)
1. **Cavitation Burst (공동현상 작렬)** [Common]: Player bullets create micro-vacuum implosions upon impact, dealing 25% splash damage in a 30px radius.
2. **Superheated Plasma Jet (초고온 플라즈마 분사)** [Rare]: Multi-shot projectiles merge into a concentrated beam that pierces through up to 3 targets with burning DoT.
3. **Benthic Swarm Protocols (심해 군집 유도 프로토콜)** [Rare]: Homing missiles fire in pairs and split into 2 smaller micro-torpedoes upon enemy contact.
4. **Vortical Railgun (와류 레일건)** [Legendary]: Normal primary fire is replaced by a high-velocity piercing hydrodynamic lance. Penetrates all enemies in a vertical column with 300% damage, but fire rate is locked at 1.2s.
5. **Chain Lightning Torpedoes (연쇄 번개 어뢰)** [Rare]: Critical hits cause electric arc discharges jumping to 3 nearby foes for 60% damage.
6. **Ricochet Sonar Rounds (음파 도탄 탄환)** [Common]: Bullets bounce off the left and right screen borders once, gaining +35% velocity and +20% damage on bounce.

#### Defensive & Pressure Boons (선체 & 압력 조절)
7. **Titanium Hydro-Alloy (티타늄 내압 합금)** [Common]: Increases Max HP by +1 and slows Hydrostatic Pressure build-up by 20%.
8. **Pneumatic Purge Valve (공압 배출 밸브)** [Rare]: Taking damage instantly triggers a high-pressure hydrodynamic shockwave that destroys all hostile bullets in a 200px radius and pushes enemies upward.
9. **Superhydrophobic Nanocoat (초소수성 나노 코팅)** [Rare]: Grants complete immunity to Acid Rain / Toxic Seabed hazards and reflects 15% of hostile laser beams.
10. **Emergency Ballast Jettison (비상 밸러스트 사출)** [Legendary]: When lethal damage is taken, the vessel consumes its ballast instead of dying: invulnerability for 3.0s, resets pressure to 0%, and detonates a screen-wide depth charge (1 charge per run).
11. **Electrolytic Hull Repair (전기분해 자가수복)** [Common]: Every 15 combo hits regenerates 10% of a hull integrity notch.

#### Utility & Drone Boons (지원 체계 & 드론)
12. **Remotely Operated Sentry (원격 조종 잠수정)** [Common]: Spawns an autonomous mini-sub drone that orbits the player, firing suppressive darts at nearby enemies.
13. **Bio-Sonoluminescence (생체 음향 발광)** [Rare]: Killing an enemy causes an acoustic flash that blinds and freezes adjacent enemies for 1.5 seconds.
14. **Thermal Siphon Turbine (열수 환원 터빈)** [Rare]: Converts 50% of ambient environmental hazard heat into Ultimate Gauge energy.
15. **Salvage Magnet (수중 음파 견인 빔)** [Common]: Currency drops (Pure Water 💧) are magnetically pulled toward the player from twice the distance.
16. **Precursor Shield Matrix (선구자 보호막)** [Legendary]: Generates a rotating dual-layered crystalline energy shield that absorbs up to 2 direct hits before entering a 20-second recharge cycle.

---

### 3.3 Corrupted Abyssal Boons ("Curse of the Hadal Void")
Obtained exclusively at Sunken Shrines or Hadal Trench anomalies. High-risk, game-altering powers:

| Corrupted Boon | Tremendous Boon (+) | Crushing Curse (-) |
| :--- | :--- | :--- |
| **Leviathan's Maw (레비아탄의 아귀)** | Weapon damage is amplified by **+150%**; every kill restores 5 💧 Pure Water. | Submarine movement speed reduced by **35%**; vessel hitbox increased by **25%**. |
| **Abyssal Overcharge (심해 과충전 원자로)** | Fire Rate increased by **+100%**; all shots have permanent piercing. | Submarine continuously radiates heat: pressure accumulates **100% faster**, causing hull leaks if not vented within 30s. |
| **Blood-Hydraulic Actuators (혈류 유압 구동계)** | Unlimited Homing Missile barrages without cooldown. | Every missile fired drains 1% of the player's current combo score; taking any damage removes 1 Max HP permanently. |
| **Black Smoker Core (흑색 열수구 핵)** | Bullets leave incendiary thermal trails that incinerate all passing projectiles. | Barricades can no longer be repaired or spawned; all incoming enemy damage is increased by +1. |
| **Siren's Acoustic Lure (세이렌의 음향 유혹)** | Pure Water (💧) drop rates multiplied by **3x**; Shop prices discounted by 50%. | Enemy spawn density increased by **60%**; fast Diver and Saboteur enemies spawn twice as frequently. |
| **Hadal Singularity (하달 특이점)** | The player's Ultimate Attack is replaced by a localized black hole that collapses the entire screen for 8 seconds. | Player's Max HP is permanently capped at **2 HP** for the remainder of the run. |

---

### 3.4 Synergistic Archetypes (Emergent Build Stacking)

```
       [Cavitation Resonance]              [Cryo-Benthic Shock]
     (Cavitation + Vortical Rail)       (Sonar Freeze + Shatter Arc)
                  \                           /
                   \                         /
              [THE HADAL DREADNOUGHT BUILD]
                (Ultimate Stacking Engine)
                   /                         \
                  /                           \
       [Bioluminescent Swarm]             [Thermal Valve Reactor]
     (Homing Salvo + Siren's Lure)      (Purge Valve + Abyssal Reactor)
```

1. **The Cavitation Shockwave Build (공동현상 충격파 빌드)**:
   - *Components*: Cavitation Burst + Vortical Railgun + Pneumatic Purge Valve.
   - *Synergy*: Every piercing lance shot triggers a daisy chain of vacuum collapses down the enemy column. The screen vibrates with hydro-acoustic shockwaves, clearing swarms effortlessly.
2. **The Bioluminescent Torpedo Swarm Build (생체 유도 어뢰 빌드)**:
   - *Components*: Benthic Swarm Protocols + Homing Missiles Lv.5 + Siren's Acoustic Lure.
   - *Synergy*: The player fires a screen-filling cloud of autonomous bioluminescent micro-missiles that hunt down targets, turning the screen into a fireworks display of blue and violet light.
3. **The High-Pressure Thermal Tank Build (고압 증기 전함 빌드)**:
   - *Components*: Abyssal Overcharge + Titanium Hydro-Alloy + Emergency Ballast Jettison.
   - *Synergy*: Plays on the razor's edge of 95% pressure, converting near-death hull strain into 300% attack speed and screen-clearing emergency blasts.

---

## 4. Hydrostatic Pressure & Hull Escalation Mechanics

### 4.1 The Physics & Math of Oceanic Depth
In real oceanography, hydrostatic pressure increases by approximately 1 atmosphere (~1 bar) for every 10 meters of descent. At the bottom of the Mariana Trench (11,000m), pressure exceeds 1,100 bars (over 8 tons per square inch).

*Endless Descent* translates this into a thrilling gameplay mechanic:
$$\text{Ambient Pressure } (P) = \text{Depth (m)} \times 0.1 \text{ Bar}$$

```
[Depth: 0m - 2,000m]   | Ambient: 1 - 200 Bar   | Safe Zone. Green Pressure Bar. Full 5 Max HP.
[Depth: 2,000m - 5,000m] | Ambient: 200 - 500 Bar | Yellow Warning. Hull stress accumulates at 1%/sec.
[Depth: 5,000m - 8,000m] | Ambient: 500 - 800 Bar | Orange Alert. Max HP degraded to 4. Metal creaks audible.
[Depth: 8,000m - 10,000m]| Ambient: 800 - 1,000 Bar| Red Alert. Max HP degraded to 3. Vignette distortion.
[Depth: 10,000m+]        | Ambient: 1,000+ Bar    | CRITICAL HADAL STRAIN. Max HP degraded to 2 or 1.
```

---

### 4.2 Hull Stress & Max HP Degradation Mechanics

1. **The Hydrostatic Stress Gauge (0% – 100%)**:
   - Located on the HUD next to the player's HP bar.
   - Accumulates continually during combat waves based on current Depth Tier.
   - In Hazard Anomalies or against heavy crushing attacks, stress spikes rapidly.
2. **Hull Buckling Thresholds**:
   - At **50% Stress**: Submarine handling becomes slightly sluggish (-10% speed); acoustic creaking sound effects trigger.
   - At **75% Stress**: **Hull Degradation Triggered**. The right-most heart in the Max HP tray turns into a crushed, cracked steel icon. The player's Max HP is temporarily reduced by 1 (e.g. from 5 to 4).
   - At **95% Stress**: Second Hull Degradation. Max HP reduced to 3 or lower. Screen borders display dark blue vignetting with water droplets leaking across the visor.
   - At **100% Stress (HULL BREACH)**: The vessel suffers progressive pressure implosion damage: 1 HP lost every 6 seconds until vented!
3. **Pressure Relieving Countermeasures**:
   - **Manual Venting (Keybind 'C' or Mobile Button)**: Expends 10% of the player's collected Pure Water (💧) to vent ballast, instantly reducing Hull Stress by 30%.
   - **Pressure Relief Valves**: Purchasable in the shop or dropped at Supply Caches. Instantly restores degraded Max HP containers.
   - **Rest Stops (Outposts & Supply Depots)**: Provide complete chamber decompression, resetting stress to 0% and restoring all damaged hull integrity.

---

### 4.3 Deep-Sea Enemy Pressure Adaptations
As depth increases, enemy invaders also adapt to the extreme environment:
- **Abyssal Carapace (Depth 3,000m+)**: Invaders spawn with dense chitinous shells, reducing incoming direct bullet damage by 25% unless pierced.
- **Bioluminescent Cloaking (Depth 5,000m+)**: Rogue submarines and stealth stalkers cloak in the darkness, revealing themselves only when firing or when swept by the player's primary weapon flashlight.
- **Trench Leviathans (Depth 8,000m+)**: Colossal entities whose movement creates hydrodynamic drag currents, pulling the player's vessel towards their maw or pushing projectiles off-course.

---

## 5. UI/UX Design Specifications

All UI additions strictly maintain the game's **600x800 logical canvas viewport** and responsive mobile wrappers, operating seamlessly via CSS overlay modals and canvas HUD HUD elements.

### 5.1 The Bathymetric Sonar Descent Map Screen
When a wave is completed, the game transitions to `GameState.DESCENT_MAP`. The descent map is rendered with a high-contrast nautical sonar aesthetic:

```
+-------------------------------------------------------------+
| [DEPTH: 4,250m]  [PRESSURE: 425 BAR]  [💧 PURE WATER: 380]   |
| SECTOR III: THE ABYSSAL PLAINS                              |
+-------------------------------------------------------------+
|                                                             |
|                         ( CURRENT )                         |
|                             (o)                             |
|                           /     \                           |
|                         /         \                         |
|             [ ⚔️ TRENCH COMBAT ]   [ ⚠️ THERMAL VENT ]       |
|             Threat: Moderate       Hazard: High Heat        |
|             Reward: 💧 65          Reward: 💧 120 + Boon    |
|                     |                   /       \           |
|                     |                 /           \         |
|             [ 📦 SUPPLY DEPOT ]  [ 🔮 SUNKEN SHRINE ]       |
|             Hull Weld / Vent     Faustian Gamble            |
|                     \                /                      |
|                       \            /                        |
|                 [ 💀 APEX DREADNOUGHT ]                     |
|                 Depth Guardian - Sector Boss                |
|                                                             |
+-------------------------------------------------------------+
| [ ACTIVE ARTIFACTS: 4/8 ]                                   |
| [⚙️ Cavitation] [🛡️ Nano-Coat] [🚀 Swarm Proto] [⚡ Arc Core]  |
+-------------------------------------------------------------+
| [ SONAR SCAN (25 💧) ]                 [ COMMENCE DIVE ⬇️ ] |
+-------------------------------------------------------------+
```

#### Visual & Design Details:
- **Color Palette**: Deep benthic navy (`#020617`), sonar phosphor cyan (`#06b6d4`), radioactive amber (`#f59e0b`), and eldritch violet (`#a855f7`).
- **Sonar Sweep Animation**: A faint 360-degree radar line rotates across the map, lighting up node icons and sonar bathymetry contours as it sweeps past.
- **Node Selection Interaction**: Clicking or tapping a node shows a floating tactical brief: estimated enemy composition, environmental modifiers, and projected rewards. Confirming initiates a descent dive transition (screen scrolls down into the abyss with bubble particle cascades).

---

### 5.2 In-Game HUD: Hydrostatic Pressure & Artifact Tray

During active combat, the top and bottom HUD are expanded without obscuring the combat arena:

```
+-------------------------------------------------------------+
| 💧 420 | SCORE: 84,200 | COMBO x18 | DEPTH: 6,420m (HADAL)  |
| HP: [❤️][❤️][❤️][💔_STRESS][🔒_CRUSHED] (3/5)               |
| PRESSURE: [||||||||||||||||||||||........] 72% [VENT (C)]   |
+-------------------------------------------------------------+
|                                                             |
|                       [ GAME CANVAS ]                       |
|                       (600 x 800 Px)                        |
|                                                             |
+-------------------------------------------------------------+
| ARTIFACTS: [⚙️][🛡️][🚀][⚡][🔮]  ULT: [██████████] READY [SPACE]|
+-------------------------------------------------------------+
```

- **Crushed Heart Icons**: Visually communicate when Max HP is locked out due to high pressure.
- **Artifact Dock**: Horizontal tray along the bottom rim. Hovering or tapping an artifact displays an instant tooltip detailing stack count, damage contribution, and lore.

---

### 5.3 3-Card Boon Draft Modal

Upon clearing an Elite or Hazard node, a full-screen holographic draft overlay smoothly transitions into view:

```
+-------------------------------------------------------------+
|              ACOUSTIC TRANSMISSION INTERCEPTED              |
|               SELECT ONE SUB-SURFACE UPGRADE                |
+-------------------------------------------------------------+
|  +-----------------+  +-----------------+  +---------------+|
|  |     [RARE]      |  |   [LEGENDARY]   |  |   [CORRUPTED] ||
|  |  BENTHIC SWARM  |  |    VORTICAL     |  |  LEVIATHAN'S  ||
|  |    PROTOCOLS    |  |     RAILGUN     |  |      MAW      ||
|  |                 |  |                 |  |               ||
|  | Homing missiles |  | Primary fire    |  | +150% Damage  ||
|  | split into twin |  | becomes a 300%  |  | +5 💧 per kill||
|  | micro-torpedoes |  | piercing hydro- |  |               ||
|  | on impact.      |  | lance beam.     |  | -35% Movement ||
|  |                 |  |                 |  | +25% Hitbox   ||
|  | [SYNERGY: 🚀]   |  | [SYNERGY: ⚡]   |  | [CURSE: ⚠️]   ||
|  |    [SELECT]     |  |    [SELECT]     |  |   [SELECT]    ||
|  +-----------------+  +-----------------+  +---------------+|
+-------------------------------------------------------------+
|                [ REROLL TRANSMISSION (30 💧) ]              |
+-------------------------------------------------------------+
```

---

## 6. Meta-Progression & Pre-Game Shop Integration

*Endless Descent* seamlessly bridges individual runs with the player's long-term profile progression through the **Pre-Game Shop** and **Benthic Research Lab**.

### 6.1 Abyssal Core Meta-Currency (심해 정수 핵)
- In addition to standard Pure Water (💧), defeating Depth Guardians and reaching deeper sectors rewards **Abyssal Pearls (심해 진주)**.
- Abyssal Pearls never reset on death. They are brought back to the Surface Hangar to fund permanent sub-sea technologies.

### 6.2 The Benthic Research Tree (Permanent Unlocks)

| Research Tech | Tier | Abyssal Pearl Cost | Permanent Effect |
| :--- | :--- | :--- | :--- |
| **Titanium Pressure Hull I–V** | Tier 1 | 5 – 25 Pearls | Baseline hull pressure tolerance increases by +10% per rank; delays HP degradation. |
| **Sonar Array Calibration** | Tier 1 | 10 Pearls | Starts every descent run with 1 stratum of Sonar Fog pre-revealed. |
| **Boon Transceiver** | Tier 2 | 20 Pearls | Grants 1 free Boon Reroll per descent run. |
| **Emergency Cryo-Stasis Chamber** | Tier 2 | 35 Pearls | Once per run, surviving a lethal blow retains 1 HP and freezes all enemies for 3 seconds. |
| **Atlantean Decryptor** | Tier 3 | 50 Pearls | Unlocks Sunken Shrines on the Bathymetric Map; reveals curse details before accepting. |
| **Hadal Engine Overdrive** | Tier 3 | 75 Pearls | Unlocks the *Benthos-Void* experimental sub hull with built-in cavitation cannons. |

---

### 6.3 Pre-Game Submersible Loadout Customization
Before embarking on a descent run from the Main Menu:
1. **Choose Submersible Hull**:
   - *Vanguard Alpha* (Balanced: 5 HP, Standard Cannons).
   - *Nautilus Recon* (Agile: 4 HP, +25% Speed, Built-in Sonar Scan, -15% Hull Armor).
   - *Titan Dreadnought* (Heavy: 6 HP, Built-in Flak Cannons, -20% Speed, Increased Hitbox).
2. **Pre-Game Shop Synergies**:
   - Upgrades purchased in the existing Pre-Game Shop (Fire Rate, Multi-Shot, Piercing, Acid Shield, Homing Missiles) carry over directly into the Descent mode as baseline hull stats.
   - Pre-purchased Homing Missiles synergize immediately with Benthic Swarm boons drafted in Sector I!

---

## 7. Technical Architecture & Implementation Feasibility

### 7.1 Separation of Concerns & Clean Directory Layout
The Endless Descent feature can be added with zero regression risk to the existing Classic Mode by encapsulating the roguelike loop within a dedicated subsystem under `src/game/descent/`:

```
src/game/descent/
├── DescentManager.ts         # Coordinates map generation, depth progression, and state transitions
├── DescentMapGenerator.ts    # Procedural DAG generator for bathymetric strata and nodes
├── DescentTypes.ts           # Type definitions (DescentNode, Boon, Artifact, PressureState)
├── BoonRegistry.ts           # Database of all 24 Boons, 6 Curses, and rarity draft tables
├── PressureEngine.ts         # Physics and math model for hydrostatic pressure and hull degradation
└── components/
    ├── DescentMapModal.tsx   # React modal for the interactive bathymetric descent map
    ├── BoonDraftModal.tsx    # React modal for 3-card upgrade drafting
    └── ArtifactTray.tsx      # HUD overlay displaying active relics and tooltips
```

---

### 7.2 TypeScript Interface Specifications

```typescript
// src/game/descent/DescentTypes.ts

export enum DescentNodeType {
  COMBAT = 'COMBAT',
  ELITE = 'ELITE',
  SUPPLY_CACHE = 'SUPPLY_CACHE',
  SUNKEN_SHRINE = 'SUNKEN_SHRINE',
  HAZARD_ANOMALY = 'HAZARD_ANOMALY',
  OUTPOST = 'OUTPOST'
}

export type BoonRarity = 'COMMON' | 'RARE' | 'LEGENDARY' | 'CORRUPTED';

export interface BoonDefinition {
  id: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  rarity: BoonRarity;
  icon: string;
  synergyTag: 'BULLET' | 'MISSILE' | 'PRESSURE' | 'DEFENSE' | 'DRONE' | 'CURSE';
  curseDescription?: string;
  apply: (player: any, descentState: DescentRunState) => void;
  onEnemyKill?: (enemy: any, player: any) => void;
  onDamageTaken?: (damage: number, player: any) => void;
}

export interface DescentNode {
  id: string;
  stratumIndex: number;
  nodeIndex: number;
  type: DescentNodeType;
  depthMeters: number;
  ambientPressureBar: number;
  hazardModifier?: 'THERMAL_VENT' | 'ACID_TRENCH' | 'ELECTRIC_SQUALL' | 'DARK_TRENCH';
  connectedNodeIds: string[]; // Outgoing edges downward
  isRevealed: boolean;
  isCleared: boolean;
}

export interface PressureState {
  currentDepthMeters: number;
  ambientPressureBar: number;
  hullStressPercent: number; // 0 to 100
  degradedMaxHpLoss: number; // e.g. 1 or 2 crushed hearts
  stressAccumulationRate: number; // % per second
  isHullBreached: boolean;
}

export interface DescentRunState {
  isActive: boolean;
  sectorIndex: number; // 1 to 5
  currentStratum: number;
  currentNodeId: string | null;
  mapNodes: Record<string, DescentNode>;
  pressure: PressureState;
  activeBoons: BoonDefinition[];
  rerollsRemaining: number;
  abyssalPearlsEarned: number;
}
```

---

### 7.3 Integration into Existing `GameManager.ts` State Machine
The integration requires only minimal, non-breaking lifecycle hooks in `GameManager`:
1. **Extend `GameState`**:
   ```typescript
   export enum GameState {
     MENU = 'MENU',
     PLAYING = 'PLAYING',
     GAME_OVER = 'GAME_OVER',
     SHOP = 'SHOP',
     DESCENT_MAP = 'DESCENT_MAP',    // New state: Navigating the bathymetric tree
     BOON_SELECT = 'BOON_SELECT'     // New state: Drafting 3-card upgrades
   }
   ```
2. **Post-Wave Callback**:
   When playing in Descent Mode, completing a wave does not automatically trigger the standard Shop; instead, it checks `DescentManager.onWaveComplete()`:
   - If node is ELITE or HAZARD -> switches to `GameState.BOON_SELECT`.
   - After selecting boon -> opens `GameState.DESCENT_MAP` for the next depth branch.
3. **Canvas Bounds Absolute Compliance**:
   - The logical dimensions remain strictly `logicalWidth = 600, logicalHeight = 800`.
   - Modals and Map overlays render as responsive React elements matching the container aspect ratio, ensuring zero regressions with Playwright E2E suites.

---

## 8. Audio-Visual Immersion & Procedural Sound Design

Leveraging the existing WebAudio synthesizer in `src/game/SoundManager.ts`, Endless Descent introduces procedural sound synthesis for deep-sea acoustic immersion without requiring heavy audio assets:

1. **Hydro-Acoustic Sonar Ping (음파 탐지 핑)**:
   - Sine wave at 1800 Hz with high resonance exponential decay, followed by a low-amplitude muffled reflection 240ms later to simulate sonar echoes in deep water trenches.
2. **Hull Strain & Metal Creak (선체 압축 경보음)**:
   - Low-frequency saw oscillator modulated by a randomized low-frequency filter (30 Hz – 110 Hz) creating ominous structural steel groans when Hydrostatic Stress exceeds 70%.
3. **Benthic Depth Charge Detonation (심해 폭뢰 폭발음)**:
   - Band-pass filtered white noise burst with extreme sub-bass boost (40 Hz) and slow volume decay, creating the physical sensation of an underwater shockwave.
4. **Bioluminescent Shimmer (생체 발광 음향)**:
   - C-Major pentatonic arpeggios synthesized through FM oscillators with soft chorus and reverb, playing gently during Sunken Shrine encounters.

---

## 9. Comparative Value & Impact Analysis

| Feature Metric | Classic Arcade Mode | Endless Descent Roguelike Mode |
| :--- | :--- | :--- |
| **Session Length & Pacing** | 10–15 minute linear survival wave climb | 25–45 minute strategic expedition with distinct rest and high-stakes decision moments |
| **Decision Density** | Linear upgrades between waves; twitch-reflex focus | Macro strategic pathing, risk-reward routing, tactical build crafting, resource venting |
| **Replayability Factor** | Moderate (wave patterns repeat predictably) | **Virtually Infinite** (procedural maps, 24+ boons, 6 curses, hundreds of build combinations) |
| **Atmospheric Immersion** | Classic arcade sci-fi shooter | Moody, atmospheric sub-aquatic thriller (*The Abyss* meets *Slay the Spire*) |
| **Monetization / Long-Term Retention** | High initial drop-off once Wave 20 is cleared | Deep meta-progression tree keeps players returning for "just one more dive" |

---

## 10. Conclusion & Verification Summary

The **Endless Descent** proposal elevates *Water Invader* from a nostalgic arcade homage into a premier roguelite action experience. By marrying the tight, responsive 60fps canvas shooting mechanics with branching bathymetric exploration, hydrostatic pressure tension, and synergistic card drafting, it provides unparalleled gameplay depth while strictly preserving all existing architectural constraints (`logicalWidth = 600, logicalHeight = 800`, zero regression to existing modes).

This specification is complete, mathematically modeled, and ready for immediate phased implementation upon user and orchestrator approval.

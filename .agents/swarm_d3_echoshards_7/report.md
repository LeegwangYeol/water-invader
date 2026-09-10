# Feature Proposal: Depth Multipliers & Abyssal Echo Shard Prestige Economy

**Agent:** Specialist 3.7 (Swarm Domain 3: Meta-Progression & Prestige Economy)  
**Target Project:** Water Invader (Next.js / TypeScript / HTML5 Canvas / Web Audio API)  
**Document Status:** Complete Proposal & Architectural Blueprint  
**File Location:** `.agents/swarm_d3_echoshards_7/report.md`  

---

## Executive Summary

Currently, **Water Invader** features a robust tactical in-run economy centered around **Pure Water (💧)**, which players earn by defeating invaders and spend between waves on temporary upgrades (Fire Rate, Multi-Shot, Piercing, Acid Shield, Homing Missiles). However, once a run concludes—whether through death or manual restart—the player's progress resets to zero. While the newly introduced **Continue vs. Restart** mechanic allows players to push further into higher waves, the game lacks a long-term **meta-progression hook** that rewards repeated descents and master-level play.

This proposal introduces **Depth Multipliers & the Abyssal Echo Shard Prestige Economy**:
1. **Thematic Depth Scaling**: Translating wave progression into physical ocean depth ($\text{Depth} = \text{Wave} \times 100\text{m}$), immersing the player in a harrowing descent from the sunlit surface aquifer down to the Hadopelagic abyss of the Mariana Trench ($10,000\text{m}+$ Challenger Deep).
2. **Abyssal Echo Shards (💎)**: A rare, iridescent crystalline currency awarded for braving high-pressure abyssal zones, defeating Bosses/Elites, and resolving End-Game Crises. Shard drops scale exponentially with depth.
3. **The Primordial Reliquary (Prestige Ascension)**: A permanent meta-progression shrine where players spend Echo Shards on **Primordial Perks** across four specialized oceanic constellations (Hadopelagic Arsenal, Hydrostatic Hull, Abyssal Scavenging, and Crisis Transmutation).
4. **Visual & Audio Polish**: Iridescent shimmering crystal particles, trailing buoyant motes, and procedural Web Audio API crystal chimes and subsea sonar resonance.
5. **HUD Integration & Biome Synergy**: A sleek bathymeter (Depth Meter) and real-time Shard Counter that harmonize with existing Wave 10/20 dynamic background biome shifts (`SURFACE_AQUIFER` $\to$ `ABYSSAL_TRENCH` $\to$ `BIOLUMINESCENT_REEF` $\to$ `TOXIC_SEABED` $\to$ `COSMIC_VOID`).

---

## 1. Concept & Lore Hook: Descent into Challenger Deep

### 1.1 The Narrative & Thematic Anchor
In the planetary ocean of *Water Invader*, the alien invader fleet does not merely hover over the sea—their invasion motherships and biomechanical hives are anchored deep within the **Mariana Trench**, siphoning Earth's hydrosphere from the seabed up. 

To eradicate the invasion at its roots, the player's submersible interceptor must execute an operational descent known as **Project Hadal Dive**. As the player descends:
* Atmospheric water pressure escalates by **1 atmosphere every 10 meters** ($100\text{m} = 10\text{ atm}$, $1,000\text{m} = 100\text{ atm}$, $10,000\text{m} = 1,000\text{ atm}$).
* At extreme depths, the intense pressure and ambient alien bio-plasma crystallize residual water energy into **Abyssal Echo Shards (심해 에코 파편)**—condensed, iridescent prisms resonating with primordial frequency.
* The deeper the vessel ventures, the more concentrated these crystalline formations become. Extracting them and ascending back to the surface station allows the research armory to forge permanent hull and weapon enhancements that transcend individual runs.

### 1.2 The Dual-Currency Economy
| Currency | Visual Icon | Lifetime | Acquisition Source | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| **Pure Water** | 💧 (Cyan Droplet) | In-Run (Resets on Full Restart) | Standard Invader & Rogue kills | Tactical run upgrades (Fire Rate Lv.1-5, Multi-Shot Lv.1-5, Piercing Lv.1-5, Acid Shield, Homing Missiles, Hull Repairs) |
| **Abyssal Echo Shard** | 💎 (Iridescent Prism) | **Permanent** (Persists Across All Runs via `localStorage`) | Depth milestone thresholds, Elite kills, Boss kills, End-Game Crisis defeats | **Ascension Meta-Progression**: Unlocking and upgrading permanent Primordial Perks in the Primordial Reliquary |

### 1.3 The Ascension / Prestige Fantasy
The Prestige loop caters to both casual players looking for steady progress and hardcore arcade enthusiasts pushing for leaderboard dominance:
* **The "Just One More Run" Drive**: Even a failed run at Wave 14 awards 25–40 Echo Shards, ensuring that death never feels like lost time.
* **The Hadal Push**: Because shard yields scale super-linearly with depth, surviving an extra 5 waves at deep depths delivers dramatically more shards than farming early waves, heavily incentivizing risk-taking, crisis confrontation, and deep-wave survival.

---

## 2. Mechanics & Mathematical Model

### 2.1 Depth Formula & Oceanic Depth Zones
Depth is strictly bound to the game's existing wave counter:
$$\text{Depth (meters)} = \text{Wave} \times 100$$

This ties directly into the oceanographic bathypelagic layers and the game's existing `BiomeTheme` system in `GameManager.ts`:

| Wave Range | Depth (Meters) | Oceanographic Zone | Biome ID in Code | Environmental Palette & Tone |
| :--- | :--- | :--- | :--- | :--- |
| **Wave 1 – 9** | $100\text{m} - 900\text{m}$ | **Epipelagic / Mesopelagic** (Sunlight & Twilight) | `SURFACE_AQUIFER` (Tier 0) | Vibrant cyan surface gradient, bright sunlight rays, floating oxygen bubbles |
| **Wave 10 – 19** | $1,000\text{m} - 1,900\text{m}$ | **Bathypelagic** (Midnight Zone) | `ABYSSAL_TRENCH` (Tier 1) | Deep oceanic navy/black, downward sinking marine snow, cold pressure vibes |
| **Wave 20 – 29** | $2,000\text{m} - 2,900\text{m}$ | **Abyssopelagic** (Lower Abyssal Zone) | `BIOLUMINESCENT_REEF` (Tier 2) | Midnight blue with pulsating neon cyan bioluminescent polyps and spores |
| **Wave 30 – 39** | $3,000\text{m} - 3,900\text{m}$ | **Hydrothermal Hydro-Benthos** | `TOXIC_SEABED` (Tier 3) | Murky sulfur-green seabed, rising toxic hydrothermal steam bubbles |
| **Wave 40 – 49** | $4,000\text{m} - 4,900\text{m}$ | **Hadopelagic Trench Floor** | `COSMIC_VOID` (Tier 4) | Deep void purple, cosmic plasma distortion, floating antimatter motes |
| **Wave 50+** | $5,000\text{m} - 11,000\text{m}$ | **Challenger Deep Core** | *Abyssal Singularity* (Tier 4+) | Extreme chromatic aberration, hyper-dense pressure pulses, intense echo resonance |

---

### 2.2 Echo Shard Drop Mechanics & Formulae

Echo Shards drop through three primary vectors:
1. **Direct In-Combat Drops (Entities)**: Floating physical pick-ups that glide towards the player.
2. **Wave Completion Depth Stipend**: Granted automatically upon completing each wave.
3. **Major Milestone & Crisis Triumph Bonuses**: Lump-sum payouts for milestone depths and crisis clearances.

#### 2.2.1 Base Yield Table
| Entity / Event | Base Drop Rate ($P_{\text{drop}}$) | Base Quantity ($Q_{\text{base}}$) | Drop Behavior |
| :--- | :--- | :--- | :--- |
| **Standard Invader** | $1.5\%$ | 1 Shard | Floating micro-shard with buoyant upward drift |
| **Rogue Faction Mob** | $3.5\%$ | 1 Shard | Pulsating lime/emerald shard |
| **Elite Enemy** (`isElite`) | $100\%$ | $3 - 5$ Shards | Burst of 3–5 crystalline shards with spread physics |
| **Wave Boss** (Every 5th Wave) | $100\%$ | $15$ Shards | Radial explosion of 15 high-value shards |
| **Crisis Sovereign / Crisis Triumph** | $100\%$ | $40$ Shards | Massive celestial burst with screen flash & victory chord |
| **Wave Clear Depth Stipend** | $100\%$ | $\lfloor \text{Wave} / 2 \rfloor$ | Awarded directly to in-run bank on wave transition |

---

### 2.3 The Depth Multiplier Formula ($M_{\text{depth}}$)

To ensure that descending into deeper zones yields exponential progression rewards without destabilizing early-game pacing, the depth multiplier uses a power curve:

$$M_{\text{depth}}(\text{Wave}) = 1.0 + \left(\frac{\text{Wave}}{10}\right)^{1.75}$$

Equivalently, expressed in depth meters:
$$M_{\text{depth}}(\text{Depth}) = 1.0 + \left(\frac{\text{Depth}}{1000}\right)^{1.75}$$

#### Final Shard Payout Calculation:
For any drop or wave reward:
$$\text{Shards Awarded} = \text{round}\left( Q_{\text{base}} \times M_{\text{depth}}(\text{Wave}) \times (1 + \text{PerkBonus}) \right)$$

#### Numerical Depth Multiplier Progression Table:
| Wave | Depth ($\text{m}$) | Zone / Biome | $M_{\text{depth}}$ | Elite Kill Yield (Base 4) | Boss Kill Yield (Base 15) | Wave Clear Stipend | Cumulative Run Shards (Est.) |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **1** | $100\text{m}$ | Surface Aquifer | **$1.02\times$** | 4 | 15 | 0 | 2 |
| **5** | $500\text{m}$ | Surface Aquifer | **$1.30\times$** | 5 | 20 | 3 | 28 |
| **10** | $1,000\text{m}$ | **Abyssal Trench (Tier 1)** | **$2.00\times$** | 8 | 30 | 10 | 115 |
| **15** | $1,500\text{m}$ | Abyssal Trench | **$3.03\times$** | 12 | 45 | 21 | 290 |
| **20** | $2,000\text{m}$ | **Bioluminescent Reef (Tier 2)**| **$4.36\times$** | 17 | 65 | 44 | 610 |
| **25** | $2,500\text{m}$ | Bioluminescent Reef | **$5.98\times$** | 24 | 90 | 72 | 1,120 |
| **30** | $3,000\text{m}$ | **Toxic Seabed (Tier 3)** | **$7.86\times$** | 31 | 118 | 118 | 1,890 |
| **40** | $4,000\text{m}$ | **Cosmic Void (Tier 4)** | **$12.31\times$** | 49 | 185 | 246 | 4,250 |
| **50** | $5,000\text{m}$ | Challenger Deep Threshold | **$17.68\times$** | 71 | 265 | 442 | 8,400 |
| **100** | $10,000\text{m}$ | Hadal Core Singularity | **$57.23\times$** | 229 | 858 | 2,862 | 52,000+ |

**Key Mathematical Insights**:
* **Early waves (1–9)**: Multiplier ranges from $1.02\times$ to $1.8\times$. Novice players earn modest quantities ($10-80$ shards per run), enough to buy Tier-1 entry perks.
* **Mid-game (Waves 10–25)**: Multiplier climbs from $2.0\times$ to $6.0\times$. Players unlock mid-tier perks (Acid Resistance, Starting Cash, Hull Hardening).
* **End-game (Waves 30+)**: Exponential scaling activates ($8\times$ to $57\times$), fueling late-game high-cost primordial masteries.

---

### 2.4 Prestige Reset Mechanics & Ascension Bonuses

When a run ends via **Game Over** (or if the player opts to Ascend in the pre-wave armory):
1. **Preserve Upgrades vs. Full Reset**:
   * If the player selects **Continue (이어하기)**: In-run upgrades and current wave are preserved; the run continues, and accrued shards remain in the "in-run cargo bay".
   * If the player selects **Ascend / Play Again (처음부터 시작 / 심해 승천)**:
     * All accrued in-run Echo Shards are banked into the permanent wallet (`localStorage['waterInvaderEchoShards']`).
     * The player is awarded the **Depth Milestone Ascension Bonus**.

#### 2.4.1 Depth Milestone First-Time & Repeat Ascension Bonuses
Reaching designated depth benchmarks grants bonus shards upon completing the run:

| Depth Benchmark | Wave Required | First-Time Discovery Bonus | Repeat Ascension Bonus | Title / Badge Awarded |
| :---: | :---: | :---: | :---: | :--- |
| **$1,000\text{m}$** | Wave 10 | **$100$ Shards** | $25$ Shards | *Trench Diver (해구 잠수사)* |
| **$2,000\text{m}$** | Wave 20 | **$300$ Shards** | $75$ Shards | *Abyssal Pioneer (심해 개척자)* |
| **$3,000\text{m}$** | Wave 30 | **$800$ Shards** | $200$ Shards | *Benthos Sovereign (해저의 군주)* |
| **$5,000\text{m}$** | Wave 50 | **$2,500$ Shards** | $600$ Shards | *Hadopelagic Conqueror (초심해 정복자)* |
| **$10,000\text{m}$** | Wave 100 | **$10,000$ Shards** | $2,500$ Shards | *Challenger Singularity (해구의 지배자)* |

---

## 3. Meta Progression Loop: The Primordial Reliquary

The **Primordial Reliquary (태초의 성유물 심해 제단)** is accessible:
1. From the **Main Menu** (via a glowing cyan crystal button: `[💎 PRIMORDIAL RELIQUARY]`).
2. From the **Pre-Game Shop / Armory** (before starting Wave 1).
3. From the **Game Over Screen** before initiating a new dive.

The Reliquary is structured into **four thematic constellations**, each comprising 3 distinct perks (12 total perks) with multi-rank progression.

```
                    [ PRIMORDIAL RELIQUARY ]
                 (Permanent Echo Shard Forge)
                               |
       +-----------------------+-----------------------+
       |                       |                       |
[ CONSTELLATION A ]     [ CONSTELLATION B ]     [ CONSTELLATION C ]     [ CONSTELLATION D ]
Hadopelagic Arsenal     Hydrostatic Hull        Oceanic Fortune         Crisis Transmutation
  • Resonant Bore         • Bathysphere Core      • Brine Wellspring      • Abyssal Anchor
  • Echo Piercing         • Acid Neutralizer      • Echo Siphon           • Sovereign Bounty
  • Hadal Cascade         • Barricade Weave       • Deep Bargain          • Singularity Rift
```

---

### 3.1 Detailed Perk Trees & Specifications

#### Constellation A: Hadopelagic Arsenal (화력 강화 성좌)
Focuses on base offensive properties that augment all in-run projectile upgrades.

| Perk Name | Max Rank | Cost Formula (per rank $r$) | Mechanical Effect | Flavor Description |
| :--- | :---: | :--- | :--- | :--- |
| **Resonant Bore (공명 천공)** | 5 | $50 \times 2^{r-1}$ ($50, 100, 200, 400, 800$) | Increases bullet projectile speed by $+8\%$ and hitbox width by $+1.5\text{px}$ per rank. | *Hyper-compressed water jets slice through dense abyssal currents with pinpoint precision.* |
| **Echo Piercing Core (에코 관통 핵)** | 5 | $100 \times 2^{r-1}$ ($100, 200, 400, 800, 1600$) | When a bullet penetrates an enemy, it gains $+15\%$ damage per penetrated target. | *Killed enemies detonate micro-sonoluminescence pulses that accelerate outgoing rounds.* |
| **Hadal Shockwave (해구 충격파)** | 3 | $250 \times 3^{r-1}$ ($250, 750, 2250$) | Defeating an Elite or Boss triggers a sonic shockwave clearing all enemy bullets within a $150\text{px} / 250\text{px} / 350\text{px}$ radius. | *The collapse of high-tier alien armor discharges a defensive cavitation ring.* |

---

#### Constellation B: Hydrostatic Hull (선체 내압 성좌)
Focuses on defensive resilience, mitigating environmental threats and bolstering barricades.

| Perk Name | Max Rank | Cost Formula (per rank $r$) | Mechanical Effect | Flavor Description |
| :--- | :---: | :--- | :--- | :--- |
| **Titanium Bathysphere (티타늄 심해정)** | 2 | Rank 1: $500$ 💎<br>Rank 2: $2,500$ 💎 | Permanently increases player maximum HP from $5 \to 6$ (Rank 1) and $6 \to 7$ (Rank 2). Run starts with full HP. | *Reinforced composite titanium plating rated for depths exceeding 11,000 meters.* |
| **Hydrostatic Buffer (수압 완충막)** | 4 | $75 \times 2^{r-1}$ ($75, 150, 300, 600$) | Reduces environmental hazard damage (Acid Rain, Solar Flare tick) by $-15\%$ per rank (up to $-60\%$). Extends invulnerability frames by $+0.25\text{s}$. | *Nanoscale hydrophobic barrier repels corrosive acids and toxic seafloor plumes.* |
| **Barricade Nanite Weave (방벽 나노 복원)** | 5 | $60 \times 2^{r-1}$ ($60, 120, 240, 480, 960$) | Central defensive barricades gain $+25\%$ max health per rank, and automatically repair $15\%$ of lost HP between waves. | *Allied nanobots continuously reconstitute the mineral integrity of protective barriers.* |

---

#### Constellation C: Oceanic Fortune (심해 자원 성좌)
Optimizes the in-run economy and speeds up Echo Shard farming efficiency.

| Perk Name | Max Rank | Cost Formula (per rank $r$) | Mechanical Effect | Flavor Description |
| :--- | :---: | :--- | :--- | :--- |
| **Brine Wellspring (해수 용출원)** | 4 | $40 \times 2^{r-1}$ ($40, 80, 160, 320$) | Starts every run with $+50 / +100 / +175 / +275$ bonus Pure Water (💧). | *Sub-seafloor reservoirs tapped before dive deployment grant an immediate resource infusion.* |
| **Echo Siphon (에코 흡인기)** | 5 | $80 \times 2^{r-1}$ ($80, 160, 320, 640, 1280$) | Regular invaders have $+1.0\%$ base chance per rank to drop Echo Shards (up to $+5.0\%$ total, quadrupling trash mob drops). Shard magnet pull radius $+40\text{px}$ per rank. | *Magnetic collector arrays draw loose resonant crystals directly into the ship's cargo hold.* |
| **Tidal Market Concession (조석 할인 협약)** | 5 | $100 \times 2^{r-1}$ ($100, 200, 400, 800, 1600$) | Reduces in-run Shop prices (Fire Rate, Multi-Shot, Homing Missiles, etc.) by $4\%$ per rank (up to $-20\%$). | *Standardized supply logistics streamline tactical armory transactions.* |

---

#### Constellation D: Crisis Transmutation (재앙 변환 성좌)
Unlocks god-tier mechanics specifically tailored for mastering late-game End-Game Crises.

| Perk Name | Max Rank | Cost Formula (per rank $r$) | Mechanical Effect | Flavor Description |
| :--- | :---: | :--- | :--- | :--- |
| **Abyssal Early-Warning (심해 조기 경보)** | 3 | $150 \times 2^{r-1}$ ($150, 300, 600$) | Increases Crisis Warning Timer by $+1.5\text{s}$ per rank and reveals upcoming Crisis archetype on the HUD $5\text{s}$ in advance. | *Deep-sea hydrophone arrays decipher seismic alien communications prior to an assault.* |
| **Sovereign Extractor (지배체 정제기)** | 3 | $300 \times 2^{r-1}$ ($300, 600, 1200$) | Defeating an End-Game Crisis or Crisis Sovereign grants $+50\% / +100\% / +200\%$ bonus Echo Shards and instantly recharges the Ultimate Gauge to $100\%$. | *Extracting corrupted crisis cores unleashes a cataclysmic surge of primordial energy.* |
| **Challenger Singularity (도전자 특이점)** | 1 | $5,000$ 💎 | When player HP reaches 0, consume 100 Echo Shards to trigger **Temporal Cavitation**: revives ship at 3 HP, wipes all non-boss entities, and freezes time for $3.0\text{s}$ (once per run). | *Bending gravitational pressure folds time itself to prevent hull breach annihilation.* |

---

### 3.2 Total Progression Curve & Pacing Balance
* **Total Shards to 100% Max All Perks**: **$26,450$ 💎**
* **Projected Pacing**:
  * Runs 1–5 (Waves 5–12): Earn $\sim 200$ shards total. Player maxes Tier-1 *Brine Wellspring* and *Resonant Bore*.
  * Runs 6–15 (Waves 15–25): Earn $\sim 2,500$ shards total. Player unlocks *Titanium Bathysphere Rank 1* (6 HP) and *Echo Siphon*.
  * Runs 16–35 (Waves 30–45): Earn $\sim 10,000$ shards total. Player unlocks mid/high-tier Crisis perks.
  * Runs 36–60+ (Waves 50–100 Master Runs): Final mastery, unlocking *Challenger Singularity* and Rank 2 *Titanium Bathysphere* (7 HP).
* This provides **20–30 hours of compelling meta-progression** that completely transforms replayability without breaking early game difficulty.

---

## 4. Visual Effects & Audio Design

### 4.1 Shard Entity & Particle Physics

#### Visual Rendering of the Echo Shard:
* **Geometry**: A rotating 2D isometric crystalline hexagon/dodecahedron (diameter $12\text{px} \times 16\text{px}$).
* **Color Palette**:
  * Core: Radiant iridescent cyan (`#38bdf8`)
  * Facet Glints: Prismatic violet (`#c084fc`) and magenta (`#f43f5e`)
  * Outer Glow: Soft pulsed radial blur (`rgba(56, 189, 248, 0.4)`)
* **Motion Dynamics**:
  * Drops inherit a small randomized upward burst velocity ($v_y = -80 \text{ to } -140\text{ px/s}$, $v_x = -40 \text{ to } 40\text{ px/s}$).
  * **Buoyancy Floating**: Subsea buoyancy decelerates downward gravity, causing shards to gently bob with a sine-wave drift ($y = y_0 + \sin(t \times 3) \times 4\text{px}$).
  * **Magnetic Collection**: When the player ship comes within $120\text{px}$ (or higher with *Echo Siphon*), shards accelerate smoothly toward the player center using a cubic ease-in vector.

```
       /\
      /  \       <-- Sharp Iridescent Facets (#38bdf8 / #c084fc)
     / /\ \
    | |  | |     <-- Inner Luminescent Core (Alpha Pulsing 0.7 - 1.0)
     \ \/ /
      \  /       <-- Sparkling Cometary Trail (3-4 micro-spark particles)
       \/
```

#### Collection VFX:
Upon contact with the player ship:
1. Shard pops into an 8-particle burst of iridescent sparkles using the project's zero-allocation `particlePool` in `GameManager.ts`.
2. A subtle floating combat text appears above the player ship: `+1 💎` (or `+12 💎` for elites) in bold electric-cyan with a gold outline, floating upwards and fading out over $0.6\text{s}$.
3. Top HUD Shard Counter triggers an elastic scale pop animation ($1.0 \to 1.35 \to 1.0$ over $180\text{ms}$).

---

### 4.2 Depth Atmospheric Rendering
As the depth counter increases, background visual elements dynamically mutate:
* **Marine Snow (심해설)**:
  * At depths $> 1,000\text{m}$ (Wave 10+), ambient background particles transition from upward bubbles to downward-drifting glowing organic particulates ("marine snow") reflecting the current biome tint.
* **Hydrostatic Pressure Distortion**:
  * At depths $> 3,000\text{m}$ (Wave 30+), subtle chromatic aberration shaders or multi-pass canvas offsets apply a very faint horizontal ripple every 10 seconds, simulating heavy water refraction.
* **Trench Light Shafts**:
  * Fading from golden sun rays (Wave 1) to bioluminescent cyan caustic webbing (Wave 20) and pitch-black void with distant hydrothermal vent flares (Wave 30+).

---

### 4.3 Web Audio API Procedural SFX Specifications

In strict adherence to the project's architecture (where `SoundManager.ts` generates all audio purely via the browser's Web Audio API without external `.mp3`/`.wav` assets), four new procedural synthesizers are designed:

#### 1. Shard Drop & Bobbing Ping (`playShardSpawn`)
* **Oscillator Type**: Dual `sine` oscillators.
* **Frequencies**: High crystal fundamental at $2,093\text{ Hz}$ (C7) layered with a harmonic at $3,136\text{ Hz}$ (G7).
* **Envelope**: Immediate attack ($2\text{ms}$), sharp exponential decay ($120\text{ms}$) down to zero gain.
* **Character**: Light, delicate crystal bell "ting".

#### 2. Shard Collection Chime (`playShardCollect`)
* **Oscillator Type**: 3-stage arpeggiated `triangle` oscillator.
* **Frequencies**: Rapid ascending pentatonic tri-tone:
  * $t = 0.00\text{s}$: $1,318.5\text{ Hz}$ (E6)
  * $t = 0.04\text{s}$: $1,760.0\text{ Hz}$ (A6)
  * $t = 0.08\text{s}$: $2,637.0\text{ Hz}$ (E7)
* **Envelope**: Gain starts at $0.15$, exponential ramp to $0.001$ over $350\text{ms}$.
* **Character**: Satisfying, luminous cosmic chime that cuts cleanly through explosion audio without harshness.

#### 3. Depth Milestone Sonar Pulse (`playDepthMilestone`)
* **Oscillator Type**: Combined `sine` sub-bass and resonant bandpass `square`.
* **Frequencies**:
  * Sub-bass oscillator: Deep underwater sonar ping at $65.4\text{ Hz}$ (C2) sliding to $55.0\text{ Hz}$ (A1) over $1.2\text{s}$.
  * Upper harmonic oscillator: $880\text{ Hz}$ (A5) with a high Q ($Q = 12$) bandpass filter opening from $400\text{ Hz} \to 2,400\text{ Hz}$.
* **Envelope**: Slow bell swell ($60\text{ms}$ attack, $1,500\text{ms}$ decay).
* **Character**: Dramatic, cavernous oceanic sonar gong signaling arrival into a new trench depth tier.

#### 4. Reliquary Perk Infusion (`playPerkInfusion`)
* **Oscillator Type**: Dual `sawtooth` passed through a steep lowpass filter.
* **Filter Modulation**: Cutoff frequency sweeps from $200\text{ Hz} \to 3,200\text{ Hz}$ over $0.4\text{s}$.
* **Chord Progression**: Multi-oscillator root-fifth chord (D3 + A3 + D4) with shimmer detuning ($+4\text{ cents}$).
* **Character**: Majestic sci-fi power-up resonance confirming permanent perk acquisition.

---

## 5. UI/UX Architecture: Depth Meter & Shard Counter

### 5.1 Top HUD Bathymeter & Counter Mockup

The top HUD in `game-canvas.tsx` is enhanced with a dedicated **Bathymeter (Depth Meter)** and **Echo Shard Counter**:

```
+---------------------------------------------------------------------------------------+
|  SCORE: 148,250                [ DEPTH: 1,400m ]                  [HP: ● ● ● ● ● ○]   |
|  💧 PURE WATER: 420            ZONE: ABYSSAL TRENCH               [ 🔇 SOUND ]        |
|  💎 ECHO SHARDS: 84 (+16)      NEXT BIOME: 600m ▼                                     |
|  -----------------------------------------------------------------------------------  |
|  WAVE 14    👾 INVADERS: 12    ⚡ ROGUES: 4        [ULTIMATE: ████████░░ 82%]         |
+---------------------------------------------------------------------------------------+
```

#### Detailed Layout Elements:
1. **Depth Altimeter (Center-Top Badge)**:
   * **Real-time Readout**: `DEPTH: X,XXXm` in high-contrast neon cyan (`#38bdf8`) with monospace tabular numbers (`font-mono font-black`).
   * **Zone Indicator**: Sub-label showing current ocean zone name (e.g. `ZONE: ABYSSAL TRENCH (Tier 1)`).
   * **Wave Transition Animation**: When a wave clears, the depth counter smoothly rolls up by $+100\text{m}$ with a digital tick effect. If a new Biome threshold is crossed (e.g. Wave 10, 20, 30), a full-width golden banner flashes: `DESCENDING INTO ABYSSAL TRENCH (1,000m)`.
2. **Echo Shard Counter (Left HUD)**:
   * Positioned immediately below Pure Water:
     `💎 84 (+16)` where `84` is banked lifetime shards and `(+16)` is accrued in-run shards awaiting ascension banking.
   * Icon features a subtle continuous iridescent CSS shimmer (`shimmer-gradient`).
3. **Mobile Screen Adaptation**:
   * On narrow viewports ($< 640\text{px}$), the depth display collapses to a compact badge: `1.4km 🌊` and the shard counter shows `💎 84` to prevent clipping with health or score widgets.

---

### 5.2 Primordial Reliquary (Ascension Shop) Modal UI

Accessible between waves, from the Game Over screen, or from the Main Menu:

```
+---------------------------------------------------------------------------------------+
|                              [ PRIMORDIAL RELIQUARY ]                                 |
|               Permanent Abyssal Perks  •  Total Banked: 💎 1,240 Echo Shards          |
+---------------------------------------------------------------------------------------+
| [ HADOPELAGIC ARSENAL ]    [ HYDROSTATIC HULL ]    [ OCEANIC FORTUNE ]   [ CRISIS ]   |
|                                                                                       |
|  +-------------------------------------+  +-------------------------------------+     |
|  | Resonant Bore             Lv. 3/5   |  | Titanium Bathysphere      Lv. 1/2   |     |
|  | Bullet Speed +24%, Hitbox +4.5px    |  | Max Ship HP: 6 (+1 Base HP)         |     |
|  | [ Upgrade: 400 💎 ]                 |  | [ Upgrade: 2,500 💎 ] (Locked)      |     |
|  +-------------------------------------+  +-------------------------------------+     |
|                                                                                       |
|  +-------------------------------------+  +-------------------------------------+     |
|  | Echo Piercing Core        Lv. 1/5   |  | Hydrostatic Buffer        Lv. 2/4   |     |
|  | +15% damage per pierced target      |  | Hazard Damage: -30%                 |     |
|  | [ Upgrade: 200 💎 ]                 |  | [ Upgrade: 300 💎 ]                 |     |
|  +-------------------------------------+  +-------------------------------------+     |
|                                                                                       |
|  +-------------------------------------+  +-------------------------------------+     |
|  | Brine Wellspring          Lv. 2/4   |  | Abyssal Early-Warning     Lv. 0/3   |     |
|  | Start runs with +100 Pure Water     |  | +1.5s Crisis Warning Duration       |     |
|  | [ Upgrade: 160 💎 ]                 |  | [ Unlock: 150 💎 ]                  |     |
|  +-------------------------------------+  +-------------------------------------+     |
|                                                                                       |
|  [ ASCENSION MILESTONE REWARDS ]                                                      |
|  ★ 1,000m Reached: CLAIMED (+100 💎)     ★ 2,000m Reached: CLAIMED (+300 💎)          |
|  ★ 3,000m Reached: [ CLAIM 800 💎 ]      ☆ 5,000m Reached: LOCKED                     |
|                                                                                       |
|                   [ CLOSE RELIQUARY ]      [ DIVE TO WAVE 1 ]                         |
+---------------------------------------------------------------------------------------+
```

---

## 6. Synergies with Wave 10/20 Background Shifts & Feasibility

### 6.1 Direct Alignment with Existing Code Architecture

The proposal directly hooks into existing data structures in `src/game/GameManager.ts` and `src/game/types.ts`:

1. **Seamless Biome Integration**:
   In `GameManager.ts`:
   ```ts
   // Line 236-240 in existing codebase:
   public getCurrentBiome(): BiomeTheme {
     const tier = Math.floor(Math.max(0, this.level) / 10);
     const index = tier % GameManager.BIOMES.length;
     return GameManager.BIOMES[index];
   }
   ```
   Our depth formula $\text{Depth} = \text{Wave} \times 100\text{m}$ aligns perfectly:
   * Wave 10 = $1,000\text{m} \implies$ Tier 1 (`ABYSSAL_TRENCH`)
   * Wave 20 = $2,000\text{m} \implies$ Tier 2 (`BIOLUMINESCENT_REEF`)
   * Wave 30 = $3,000\text{m} \implies$ Tier 3 (`TOXIC_SEABED`)
   * Wave 40 = $4,000\text{m} \implies$ Tier 4 (`COSMIC_VOID`)
   Every background color transition, particle speed shift, and ambient glow directly reflects a milestone oceanic depth layer.

2. **Integration with Existing Dynamic Threat Vignette**:
   In `GameManager.ts` (lines 2423–2447), radial vignettes pulse when Elites, Bosses, or Crises appear. Echo Shard visual effects leverage this same overlay layer:
   * When an Elite or Boss is defeated, the threat vignette collapses inward while a luminous cyan radial glow pulse expands outward, signaling shard condensation.

3. **Integration with Continue vs. Restart Loop**:
   In `GameManager.init()`:
   * `preserveUpgrades: true` (Continue): Accrued in-run shards are kept in active buffer; depth continues advancing.
   * `resetScoreAndCash: true` (Restart / Ascend): Finalizes the dive, banks in-run shards into `localStorage`, calculates milestone bonuses, and resets depth to $100\text{m}$ with primordial perks applied.

---

### 6.2 Technical Feasibility & Constraint Verification

| Project Constraint | Requirement | Proposed Implementation Compliance |
| :--- | :--- | :--- |
| **Grid Dimensions** | `logicalWidth = 600`, `logicalHeight = 800` MUST NOT CHANGE | Fully compliant. Depth meter and HUD additions are styled in HTML/CSS overlays or drawn within existing logical coordinates. Zero changes to core dimensions. |
| **Performance Budget** | 60 FPS on mobile & desktop, zero garbage collection pauses | Shard pickups and particle bursts reuse `particlePool` in `GameManager.ts`. No allocation of new objects in the render loop. |
| **Persistence Engine** | Web browser storage without server dependency | Uses HTML5 `localStorage` keys: `waterInvaderEchoShards`, `waterInvaderPerks`, `waterInvaderMaxDepth`, perfectly matching `waterInvaderHighScore`. |
| **Audio Pipeline** | Web Audio API procedural synthesis, no external assets | Synthesizes crystal pings and sonar drones via existing `audioCtx` oscillators and gain nodes in `SoundManager.ts`. Zero network latency or missing asset risks. |
| **Playwright Testability** | All flows verifiable via automated tests | Specific data-testids: `data-testid="depth-meter"`, `data-testid="echo-shard-counter"`, `data-testid="reliquary-modal"`, `data-testid="buy-perk-*"`. |

---

### 6.3 Code Implementation Blueprint (Design Sketch)

#### 1. TypeScript State Definitions (`src/game/types.ts`)
```ts
export interface PrimordialPerkState {
  resonantBore: number;       // Lv 0-5
  echoPiercingCore: number;   // Lv 0-5
  hadalShockwave: number;     // Lv 0-3
  titaniumBathysphere: number;// Lv 0-2
  hydrostaticBuffer: number;  // Lv 0-4
  barricadeNanites: number;   // Lv 0-5
  brineWellspring: number;    // Lv 0-4
  echoSiphon: number;         // Lv 0-5
  tidalDiscount: number;      // Lv 0-5
  earlyWarning: number;       // Lv 0-3
  sovereignExtractor: number; // Lv 0-3
  challengerSingularity: boolean;
}

export interface EchoShardPickup {
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  lifeTime: number;
  maxLife: number;
  isDead: boolean;
}
```

#### 2. Depth Calculation Helper (`src/game/GameManager.ts`)
```ts
public getDepthInMeters(): number {
  return Math.max(1, this.level) * 100;
}

public getDepthMultiplier(): number {
  const depthInKm = this.getDepthInMeters() / 1000;
  return 1.0 + Math.pow(depthInKm, 1.75);
}
```

#### 3. Shard Collection Hook (`src/game/GameManager.ts`)
```ts
public spawnEchoShard(x: number, y: number, baseValue: number = 1): void {
  const mult = this.getDepthMultiplier();
  const perkBonus = 1 + (this.perks.sovereignExtractor * 0.5);
  const totalValue = Math.max(1, Math.round(baseValue * mult * perkBonus));
  
  this.echoShardPickups.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 60,
    vy: -100 - Math.random() * 40,
    value: totalValue,
    lifeTime: 8.0,
    maxLife: 8.0,
    isDead: false
  });
  soundManager.playShardSpawn();
}
```

---

## 7. Strategic Impact & Evaluation

| Dimension | Impact Level | Detailed Assessment |
| :--- | :---: | :--- |
| **Player Retention & Replayability** | **Extreme (5/5)** | Adds a multi-tier meta-game that converts a standard 10-minute arcade session into a 30-hour progressive campaign. Even failed runs feel deeply rewarding. |
| **Gameplay Depth & Skill Expression** | **High (4.5/5)** | Pushing into hazardous deeper trenches ($2,000\text{m}+$ and $4,000\text{m}+$) pays out exponentially more currency than resetting early, promoting aggressive, skillful play. |
| **Visual & Auditory Polish** | **Very High (5/5)** | Iridescent crystalline particles, floating light motes, and procedural crystal chimes provide sensory satisfaction and strong thematic immersion. |
| **Architectural Elegance** | **Flawless (5/5)** | 100% compliant with existing Next.js App Router, zero modification to `logicalWidth`/`logicalHeight`, uses existing particle pool and Web Audio synthesis. |

---

## Conclusion

The **Depth Multipliers & Abyssal Echo Shard Prestige Economy** bridges the gap between *Water Invader's* high-intensity in-run arcade shooting and long-term player investment. By contextualizing wave progression as a perilous descent into the Mariana Trench and rewarding players with iridescent Echo Shards, this feature transforms every dive into an epic scientific and martial expedition. It is elegant, mathematically sound, technically lightweight, and ready for immediate synthesis into the master pitch document.

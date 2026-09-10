# Deep-Sea Research Laboratory & Permanent Tech Tree: Comprehensive Feature Proposal
**Specialist 3.4 Feature Pitch Document — Water Invader Swarm**
**Domain:** Meta-Progression, Sub-Aquatic Laboratory System, Interactive Node-Graph Tech Tree & DNA Economy
**Document Version:** 1.0.0 | **Author:** Specialist 3.4 (Domain 3: Meta-Progression & Economy)
**Target File Path:** `/Users/user/src/water-invader/.agents/swarm_d3_techtree_4/report.md`

---

## 1. Executive Summary & Concept Hook

### 1.1 The High Concept: Project "Abyssal Xenobiology" (심해 이종생물학 연구소)
In *Water Invader*, humanity fights a desperate aquatic battle to cleanse and defend Earth's subterranean freshwater aquifers from grotesque alien invaders and rogue cybernetic machines. While the in-run Armory & Workshop allows tactical overclocks using **Pure Water (💧)**, real victory against apocalyptic stage-15+ End-Game Crises demands long-term technological evolution.

**The Hook:** Defeated invaders are not mere mechanical debris; they are biomechanical xenobiotic organisms infused with mutagenic alien DNA and crystallized abyssal plasmids. Between runs, players descend to **Station Nautilus (심해 바이오 랩)**—a subterranean research bunker deep within the Mariana Trench. Here, players spend harvested **Abyssal DNA (🧬)** to reverse-engineer invader biology, permanently mutating and augmenting their submarine gunship across a sprawling, branching **Interactive Blueprint Schematic Tech Tree**.

```
[ IN-RUN TACTICAL LOOP ]                        [ PERMANENT META-LOOP ]
  Enemy Defeat (Wave 1-30+)                       Station Nautilus (Bio-Lab)
         │                                                   │
   Collect 💧 Pure Water                              Harvest 🧬 Abyssal DNA
         │                                                   │
  In-Run Tactical Upgrades                       Permanent Branching Tech Tree
 (Fire Rate, Multi-shot, Repairs)              (Ballistics, Bio-Armor, Propulsion, Sonar)
         │                                                   │
  Wave Survival / Death ──────────────────────────> Unlock Game-Changing Keystones
                                                             │
                                                  Deploy Empowered Gunship (Next Run)
```

### 1.2 The Duality of Currencies
To preserve tight in-run tension while providing irresistible long-term progression, the economic architecture establishes a strict separation between tactical and permanent resources:

| Economy Axis | Tactical Currency: Pure Water (💧) | Permanent Meta Currency: Abyssal DNA (🧬) |
| :--- | :--- | :--- |
| **Source** | Defeated invaders, combo streaks, wave clears | Elites, Bosses, Crisis Sovereigns, High Combo Multipliers |
| **Lifespan** | Ephemeral — resets upon Game Over (preserved on Continue) | Persistent — stored in persistent local profile (`localStorage`) |
| **Utility** | In-run field repairs, temporary stat boosts, homing ammo | Permanent laboratory research, node-tree mastery, keystones |
| **Drop Frequency**| High volume (15 - 500 per kill) | Scarce, prized (1 - 25 per elite/boss kill) |
| **Game Feel** | Arcade gratification, immediate survival urgency | Long-term strategic investment, meta-power fantasy |

---

## 2. Mechanics, Disciplines & Mathematical Modeling

The Research Laboratory features four primary research wings, each representing a distinct scientific discipline of deep-sea warfare. Each discipline contains **4 Progressive Tier Nodes** (with 3 to 5 investable ranks) and **1 Capstone Keystone Passive Node** (single unlock) that fundamentally alters gunship gameplay.

```
                         ┌─────────────────────────────┐
                         │   CORE BIO-REACTOR (CENTRAL) │
                         └──────────────┬──────────────┘
               ┌────────────────┬───────┴────────┬────────────────┐
               │                │                │                │
       [ DISCIPLINE 1 ]  [ DISCIPLINE 2 ]  [ DISCIPLINE 3 ]  [ DISCIPLINE 4 ]
        SUPERCAVITATING     CHITINOUS       MAGNETOHYDRO-       ACTIVE SONAR
          BALLISTICS        BIO-ARMOR        PROPULSION         & WARFARE
               │                │                │                │
           Tier 1-4         Tier 1-4         Tier 1-4         Tier 1-4
               │                │                │                │
         [ KEYSTONE A ]   [ KEYSTONE B ]   [ KEYSTONE C ]   [ KEYSTONE D ]
          Singularity       Symbiotic       Supercavitation     Acoustic
         Vortex Cannon    Living Carapace      Phase Dash      Resonance
```

### 2.1 Discipline Breakdown & Node Matrix

#### Discipline 1: Supercavitating Ballistics (초공동 탄도학)
*Focus: Projectile kinetics, hydro-cavitation envelopes, firing tempo, and mass destructive yield.*
- **Node 1.1: Cavitation Needle Injectors (공동 주입 노즐)** [Max Rank: 5]
  - *Effect:* Increases projectile muzzle velocity by $+8\%$ per rank and base bullet hit radius by $+6\%$ per rank.
  - *Mathematical Formula:* $V_{proj}(L) = V_0 \times (1 + 0.08 \cdot L)$; $R_{proj}(L) = R_0 \times (1 + 0.06 \cdot L)$.
- **Node 1.2: Pressurized Bore Accelerator (고압 포신 가속기)** [Max Rank: 5]
  - *Effect:* Reduces the base firing cooldown interval by $4\%$ per rank (multiplicative), allowing higher sustained DPS without overheating.
  - *Mathematical Formula:* $Interval_{fire}(L) = Interval_{base} \times (0.96)^L$.
- **Node 1.3: Superheated Plasma Core (초고온 플라즈마 탄두)** [Max Rank: 4]
  - *Effect:* Projectiles gain a flat $+12\%$ chance per rank to inflict "Thermobaric Boil" for 2.0s, dealing $25\%$ weapon damage per second.
  - *Mathematical Formula:* $P_{burn}(L) = 0.12 \cdot L$; $DPS_{burn} = 0.25 \times Damage_{base}$.
- **Node 1.4: Tungsten Kinetic Core (텅스텐 관통 심봉)** [Max Rank: 3]
  - *Effect:* Increases base piercing capability by $+1$ at Rank 1 and Rank 3, and adds $+20\%$ damage retention per enemy pierced.
- **Node 1.5 [KEYSTONE]: Singularity Vortex Cannon (중력 와류 특이점 포)** [Capstone: 1 Rank]
  - *Effect:* Every 8th primary projectile fired creates an imploding micro-cavitation vortex on impact. The vortex draws all enemies within a 90px radius inward for 1.2s and detonates for $250\%$ kinetic splash damage.

#### Discipline 2: Chitinous Bio-Armor (키틴질 생체장갑)
*Focus: Deep-sea hydrostatic pressure resistance, reactive plates, corrosive mitigation, and survival thresholds.*
- **Node 2.1: Abyssal Chitin Weave (심해 키틴질 외피)** [Max Rank: 5]
  - *Effect:* Increases submarine maximum HP by $+1$ at Rank 2 and Rank 5. Increases invulnerability frames (i-frames) upon taking damage by $+0.12s$ per rank.
  - *Mathematical Formula:* $iFrames(L) = 1.0s + (0.12s \cdot L)$; $HP_{max}(L) = 5 + \lfloor L / 2 \rfloor$.
- **Node 2.2: Hydrophobic Mucilage Sealant (소수성 점액 코팅)** [Max Rank: 4]
  - *Effect:* Reduces incoming damage from environmental hazards (Acid Rain, Solar Flare ground ticks, Toxic Seabed miasma) by $15\%$ per rank (up to $60\%$ mitigation).
  - *Mathematical Formula:* $Mitigation_{hazard}(L) = 0.15 \cdot L$.
- **Node 2.3: Osmotic Cell Regeneration (삼투성 나노 수복막)** [Max Rank: 3]
  - *Effect:* Restores $1$ HP upon completing every 4th wave (Rank 1), every 3rd wave (Rank 2), or every 2nd wave (Rank 3).
- **Node 2.4: Reactive Carapace Spikes (반사형 가시 골격)** [Max Rank: 4]
  - *Effect:* When struck by an enemy projectile or contact damage, releases a radial burst of 8 chitin shards dealing $40$ damage each and briefly suppressing nearby hostiles.
- **Node 2.5 [KEYSTONE]: Symbiotic Living Carapace (공생형 자율 외골격)** [Capstone: 1 Rank]
  - *Effect:* When submarine health drops to exactly 1 HP, the living carapace enters emergency stasis: granting $2.5s$ of absolute invulnerability, venting a radial corrosive wave that clears all enemy projectiles within 200px, and restoring 1 temporary emergency barrier shield (cooldown: once per 5 waves).

#### Discipline 3: Hydrodynamic Propulsion (자기유체역학 추진)
*Focus: Vector thrust, lateral agility, evasion frames, and wake turbulence control.*
- **Node 3.1: Superconducting Turbine (초전도 터빈 임펠러)** [Max Rank: 5]
  - *Effect:* Increases lateral movement speed by $+6\%$ per rank (enhancing evasion across the 800px logical canvas).
  - *Mathematical Formula:* $Speed_{move}(L) = 300 \times (1 + 0.06 \cdot L)$.
- **Node 3.2: Inertial Dampening Baffles (관성 제어 배플)** [Max Rank: 4]
  - *Effect:* Reduces ship deceleration time and drift latency by $18\%$ per rank, providing razor-sharp micro-positioning against dense bullet curtains.
- **Node 3.3: Cavitation Slipstream Wake (후류 공동 와류)** [Max Rank: 4]
  - *Effect:* While moving continuously, the submarine generates an acoustic wake trailing behind it. Enemy projectiles entering the wake are slowed by $8\%$ per rank.
- **Node 3.4: Emergency Thrust Overdrive (비상 분사 부스터)** [Max Rank: 3]
  - *Effect:* When stress/panic reaches $70\%$, movement speed instantly surges by $+35\%$ and grants $+20\%$ passive projectile evasion chance for 3.0s.
- **Node 3.5 [KEYSTONE]: Supercavitation Phase Dash (초공동 위상 질주)** [Capstone: 1 Rank]
  - *Effect:* Double-tapping Left or Right (or pressing Shift/Space while directional input is held) executes an instantaneous $140px$ hydrodynamic flash-dash. The submarine is completely invulnerable during the $0.2s$ dash and emits a planar shockwave along the dash path that shears through enemy formations for $120$ damage. Cooldown: $4.5s$.

#### Discipline 4: Active Sonar & Bio-Acoustics (음향전 및 생체소나)
*Focus: Target acquisition, acoustic resonance, homing missile optimization, and faction disruption.*
- **Node 4.1: Hydrophone Sensor Array (고감도 하이드로폰 어레이)** [Max Rank: 5]
  - *Effect:* Homing Missiles acquire targets $15\%$ faster per rank, and missile turning radius improves by $+10\%$ per rank, eliminating missed trajectories against agile zigzag invaders.
- **Node 4.2: Echolocation Ping (반향 정위 펄스)** [Max Rank: 4]
  - *Effect:* Every 6.0s (reduced by $0.5s$ per rank), the ship automatically emits an invisible 360-degree sonar ping. Pinged enemies are marked with a glowing acoustic beacon for 4.0s, taking $+15\%$ increased damage from all sources.
- **Node 4.3: Acoustic Scrambler (음향 교란 재머)** [Max Rank: 4]
  - *Effect:* Increases the likelihood of Rogue Cyber-Faction units targeting Invaders instead of the Player during 3-way crossfire battles by $+12\%$ per rank.
- **Node 4.4: Resonant Frequency Tuning (공진 주파수 동조)** [Max Rank: 3]
  - *Effect:* Direct bullet hits against enemies with an active Sonar Beacon generate an acoustic shock that deals $30\%$ splash damage to adjacent enemies within 50px.
- **Node 4.5 [KEYSTONE]: Acoustic Resonance Disruption (공진 분쇄 소나)** [Capstone: 1 Rank]
  - *Effect:* Activating the Ultimate Skill ("Heavy Rain") now triggers a cataclysmic acoustic resonance rupture: all active enemy projectiles currently on screen are converted into friendly homing water torpedoes that reverse direction and strike the nearest invaders.

---

### 2.2 Cost Scaling & Diminishing Return Curves

To balance player retention over dozens of runs without causing astronomical runaway power creep, node upgrade costs follow a **controlled geometric progression**, while the marginal utility of high-rank stat upgrades follows an **asymptotic logarithmic curve**.

#### The DNA Cost Function
For a node in Tier $T \in \{1, 2, 3, 4, \text{Keystone}\}$ at level $L \in \{1 \dots L_{max}\}$:

$$\text{Cost}(T, L) = \begin{cases} 
\text{Round}\left( \text{BaseCost}(T) \times (1 + \alpha_T)^{L - 1} \right) & \text{for regular nodes} \\
\text{KeystoneCost}(T) & \text{for keystones (fixed 1-rank)}
\end{cases}$$

Where:
- $\text{BaseCost}(T)$ represents the entry investment: Tier 1 = $10$ 🧬, Tier 2 = $25$ 🧬, Tier 3 = $50$ 🧬, Tier 4 = $90$ 🧬, Keystone = $200$ 🧬.
- $\alpha_T$ is the escalation multiplier: $\alpha_1 = 0.40$, $\alpha_2 = 0.50$, $\alpha_3 = 0.65$, $\alpha_4 = 0.80$.

| Tier Level | Rank 1 Cost | Rank 2 Cost | Rank 3 Cost | Rank 4 Cost | Rank 5 Cost | Total DNA to Max |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Base)** | 10 🧬 | 14 🧬 | 20 🧬 | 27 🧬 | 38 🧬 | **109 🧬** |
| **Tier 2 (Advanced)** | 25 🧬 | 38 🧬 | 56 🧬 | 84 🧬 | — | **203 🧬** |
| **Tier 3 (Mastery)** | 50 🧬 | 83 🧬 | 136 🧬 | — | — | **269 🧬** |
| **Tier 4 (Apex)** | 90 🧬 | 162 🧬 | 292 🧬 | — | — | **544 🧬** |
| **Keystone (Apex)** | 200 🧬 | — | — | — | — | **200 🧬** |

#### Total Discipline Investment
To fully master a single discipline:
$$\text{Cost}_{Discipline} = 109 + 203 + 269 + 544 + 200 = 1,325 \text{ 🧬}$$
To fully master all 4 disciplines:
$$\text{Cost}_{Total} = 4 \times 1,325 = 5,300 \text{ 🧬}$$

#### Asymptotic Stat Curve vs Flat Growth
To prevent early nodes from making later waves trivial, stat scaling uses a diminishing marginal benefit formula:
$$\Delta \text{Benefit}(L) = \Delta_0 \times (0.85)^{L - 1}$$
This guarantees that while players always feel stronger with every purchase, the percentage leap from Rank 4 to 5 is a modest refinement ($+5.2\%$) rather than a game-breaking doubling, keeping combat intense and skill-reliant.

---

### 2.3 Abyssal DNA Yield & Harvesting Economics

DNA drop rules are tied to enemy classifications, wave difficulty tiers, and combo mastery:

#### DNA Drop Table per Enemy Archetype

| Enemy Type | Base DNA Drop Chance | Base DNA Amount | Guaranteed Spawn Conditions |
| :--- | :--- | :--- | :--- |
| **Normal Invader** | $8\%$ | 1 🧬 | Regular swarm waves |
| **Zigzag / Diver** | $15\%$ | 1 🧬 | Fast flanking waves |
| **Sniper / Shielded / Splitter** | $30\%$ | 2 🧬 | High-threat formations |
| **Rogue Drone / Stalker** | $25\%$ | 2 🧬 | 3-way crossfire encounters |
| **Rogue Goliath / Carrier** | $60\%$ | 4 🧬 | Heavy cyber incursions |
| **Saboteur** | $50\%$ | 3 🧬 | Barricade gnawers |
| **Mini-Boss (Wave 5, 10, 20)** | $100\%$ | 15 🧬 | Every 5th wave boss encounter |
| **Crisis Sovereign (Stage 15+)** | $100\%$ | 35 🧬 | End-Game Crisis climax |

#### Combo Multiplier Scaling Formula
Skillful play is dramatically rewarded. The in-game combo counter dynamically amplifies DNA yields:

$$\text{FinalDNA} = \lfloor \text{BaseDNA} \times \left(1 + 0.25 \times \min(12, \log_2(1 + \text{Combo}))\right) \rfloor$$

- At $0$ Combo: Multiplier = $1.0\times$
- At $15$ Combo: Multiplier = $2.0\times$ (Double DNA yield)
- At $63$ Combo: Multiplier = $2.5\times$ (Peak efficiency for expert survivalists)

#### Run Yield Projections
- **Beginner Run (Waves 1-8):** $15 \sim 35$ 🧬 (enough to purchase 2-3 Tier 1 upgrades).
- **Competent Mid-Game Run (Waves 9-18):** $70 \sim 140$ 🧬 (unlocks Tier 2/3 nodes).
- **Crisis Mastery Run (Waves 19-30+):** $250 \sim 400$ 🧬 (fuels Keystone unlocks).

---

### 2.4 Respec Mechanic: "Cryo-Centrifuge Genetic Purification"
- **Zero Penalty Experimentation:** Players can freely reset any discipline or the entire tree at Station Nautilus.
- **100% DNA Refund:** All invested Abyssal DNA is immediately returned to the player's balance.
- **Nominal Tactical Cost:** A small calibration charge of $100$ Pure Water (💧) or a free toggle ensures players feel empowered to test distinct builds (e.g., swapping from a pure "Ballistics DPS" build to a "Bio-Armor Tank" build before tackling specific End-Game Crises).

---

## 3. The Meta Progression Loop & Build Archetypes

### 3.1 The Three-Phase Meta Loop

```
           ┌──────────────────────────────────────────────┐
           │                  PHASE 1                     │
           │              DEPLOYMENT & RUN                │
           │  • Battle Waves 1 - 30+                      │
           │  • Spend 💧 Pure Water on tactical armory    │
           │  • Slay Elites & Bosses to extract 🧬 DNA    │
           └──────────────────────┬───────────────────────┘
                                  │ (Game Over or Victory)
                                  ▼
           ┌──────────────────────────────────────────────┐
           │                  PHASE 2                     │
           │        STATION NAUTILUS LABORATORY           │
           │  • Inspect Blueprint Schematic Matrix        │
           │  • Hear soldering sparks & pneumatic hiss    │
           │  • Allocate 🧬 DNA to branch nodes           │
           │  • Unlock Capstone Keystones                 │
           └──────────────────────┬───────────────────────┘
                                  │ (Launch Next Mission)
                                  ▼
           ┌──────────────────────────────────────────────┐
           │                  PHASE 3                     │
           │           AUGMENTED FIELD TRIAL              │
           │  • Deploy with permanent stat baseline       │
           │  • Trigger unique keystone combat abilities  │
           │  • Reach higher wave tiers & conquer crises  │
           └──────────────────────────────────────────────┘
```

### 3.2 Distinct Build Archetypes Enabled by Keystones

1. **The Dreadnought (Bio-Armor + Ballistics)**
   - *Keystones:* **Symbiotic Living Carapace** + **Tungsten Kinetic Core**.
   - *Playstyle:* Aggressive face-tanking. The player intentionally allows temporary hits to trigger reactive spike bursts and cavitation knockback, relying on emergency cocoon i-frames to survive Stage-20 crisis swarms.
2. **The Ghost Torpedo Interceptor (Hydro-Propulsion + Sonar Warfare)**
   - *Keystones:* **Supercavitation Phase Dash** + **Acoustic Resonance Disruption**.
   - *Playstyle:* Hyper-mobile hit-and-run tactics. The player dashes through dense bullet walls to escape corners, pinging large clusters with sonar and detonating inverted projectile cascades with "Heavy Rain".
3. **The Singularity Gunship (Ballistics + Sonar Warfare)**
   - *Keystones:* **Singularity Vortex Cannon** + **Resonant Frequency Tuning**.
   - *Playstyle:* Crowd-control mastery. Every 8th shot groups splitters and snipers into a compact vortex, where acoustic resonance amplifies piercing damage by $+300\%$.

---

## 4. Visual & Sound Design (Aesthetic Specification)

### 4.1 Visual Styling: The Retro Blueprint Schematic Aesthetic

The Deep-Sea Research Laboratory adopts a mesmerizing **Cold-War Retro-Futuristic Submarine Blueprint** visual theme, contrasting sharply with the neon arcade energy of the main battlefield:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [STATION NAUTILUS - BIO-XENO RESEARCH MATRIX]            [DNA: 🧬 340] [X] │
├────────────────────────────────────────────────────────────────────────────┤
│ GRID: 1mm CAD CALIBRATION   LOC: TRENCH-DEPTH 10,924M     SEC: XENO-HELIX   │
│                                                                            │
│       (B-1) ───[B-2]───[B-3]───[B-4]═════★ [KEYSTONE A: VORTEX CANNON]     │
│      /                                                                     │
│    [CORE] ──[A-1]───[A-2]───[A-3]───[A-4]═════★ [KEYSTONE B: LIVING CARAPACE]│
│      \                                                                     │
│       (P-1) ───[P-2]───[P-3]───[P-4]═════★ [KEYSTONE C: PHASE DASH]        │
│        \                                                                   │
│        (S-1) ──[S-2]───[S-3]───[S-4]═════★ [KEYSTONE D: RESONANCE DISRUPT] │
│                                                                            │
│ [ SELECTED NODE: B-1 CAVITATION NEEDLE INJECTORS (LV 3/5) ]                │
│ > Muzzle Velocity: +24%  |  Bullet Hitbox: +18%                            │
│ > UPGRADE COST: 27 🧬 [RESEARCH SOLDER BUTTON]   [REFUND ALL DISCIPLINE]   │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Visual Tokens & Palette
- **Background Blueprint Canvas:** Deep Cyan-Navy drafting paper (`#061121`) with a subtle 20px grid composed of faint blue lines (`rgba(56, 189, 248, 0.08)`) and bold 100px major axis marks.
- **Drafting Markings:** White and cyan technical annotations, dimension callouts with dashed leader lines, angular ISO coordinate brackets `[LAT: 11°21'N, PRESS: 108.6 MPa]`, and biological specimen accession tags (`SPECIMEN-INV-OMEGA`).
- **Circuit Conduits:** Thick architectural conduits connect parent and child nodes.
  - *Unpowered Conduits:* Dim slate blue (`rgba(100, 116, 139, 0.4)`).
  - *Powered Conduits:* Glowing cyan (`#38bdf8`) with animated dashed electrical pulses traveling from the Core outward toward unlocked nodes.
- **Node States:**
  - *Locked Node:* Steel-gray circular schematic glyph with a padlock icon and dashed border; tooltip reveals prerequisite requirements.
  - *Available to Research:* Pulsing neon amber/cyan border with high-voltage flickering particles emitting from the perimeter.
  - *Mastered Node:* Solid luminous cyan-amber fill with high-contrast circuit tracery and glowing numeric rank pips (`●●●○○`).
  - *Keystone Node:* Large octagonal gold-cyan glyph with radiating geometric corona rings and an animated central holographic icon.

---

### 4.2 Web Audio API Procedural Sound Design (Zero Asset Bloat)

In strict accordance with the game's lightweight architecture, all audio effects for the Research Laboratory are **procedurally synthesized via the Web Audio API** inside `SoundManager.ts`, requiring **zero external WAV/MP3 downloads**:

#### 1. Electrical Soldering Spark SFX (`playSolderingSpark()`)
Simulates high-voltage micro-welding torches soldering mutagenic bio-circuits into the submarine's frame:
```typescript
// Web Audio API Synthesis Spec:
// 1. White Noise Buffer (0.18s burst)
// 2. BiquadFilterNode (Bandpass: center 2800Hz, Q: 3.5)
// 3. Modulated Sawtooth Oscillator (Frequency: 850Hz -> 3200Hz erratic jitter)
// 4. GainNode Envelope: Fast attack (0.01s), rapid crackle stutter (50Hz tremolo), decay (0.15s)
```
*Acoustic Character:* A crisp, tactile, electric sizzle with tiny randomized popping sparks that feels incredibly satisfying on mouse-click.

#### 2. Node Activation Chime (`playNodeUnlockChime()`)
Plays upon successfully purchasing a research node:
```typescript
// Web Audio API Synthesis Spec:
// Harmonic Major Triad Chime (C5: 523.25Hz, E5: 659.25Hz, G5: 783.99Hz, C6: 1046.5Hz)
// Sine oscillators staggered by 35ms each.
// Long resonant decay (0.85s) through an exponential gain ramp.
// Layered with a low-frequency pneumatic valve release (Sawtooth 80Hz -> 20Hz + White Noise hiss).
```
*Acoustic Character:* A bright, triumphant sub-aquatic crystalline chime followed by a satisfying hydraulic pressure release, rewarding the player's investment.

#### 3. Keystone Mastery Boom (`playKeystoneAwaken()`)
Plays when unlocking a game-changing Keystone Capstone:
```typescript
// Web Audio API Synthesis Spec:
// Deep sub-bass resonance (Sawtooth 55Hz exponential drop to 15Hz over 1.4s).
// Dual resonant peak bandpass filter (sweep from 400Hz to 1200Hz).
// Stereo chorus detune (+/- 7 cents) creating a massive spatial deep-sea shudder.
```

#### 4. Blueprint UI Hover Tick (`playBlueprintTick()`)
```typescript
// Web Audio API Synthesis Spec:
// 12ms Square wave micro-click (1400Hz -> 600Hz drop), low gain (0.04).
```

---

## 5. UI Node-Graph Interactive Tech Tree Interface

### 5.1 Graph Architecture & Spatial Layout

The tech tree interface is constructed as a 2D responsive graph rendered directly on a dedicated interactive Canvas or layered SVG inside `components/TechTreeModal.tsx`:

```
                       [ Y = -180: BALLISTICS ]
                       (B-1) ─ (B-2) ─ (B-3) ─ (B-4) ═ [★ KEYSTONE A]
                                  ▲
                                  │
[ X = -280: BIO-ARMOR ]           │          [ X = +280: PROPULSION ]
[★ KEYSTONE B] ═ (A-4) ─ (A-3) ─ [CORE] ─ (P-1) ─ (P-2) ─ (P-3) ─ (P-4) ═ [★ KEYSTONE C]
                                  │
                                  ▼
                       (S-1) ─ (S-2) ─ (S-3) ─ (S-4) ═ [★ KEYSTONE D]
                       [ Y = +180: SONAR WARFARE ]
```

### 5.2 Interactive Navigation & UX Controls
1. **Pan & Drag:** Smooth inertial dragging across the canvas using pointer/mouse drag or single-finger touch drag.
2. **Smooth Pinch & Scroll Zoom:** Clamped zoom scale from $0.65\times$ (full tree bird's-eye view) to $1.75\times$ (magnified blueprint scrutiny).
3. **Recenter Button (`[ ⌖ RECENTER ]`):** Instantly animates the viewport back to the central Core Bio-Reactor with smooth ease-out interpolation.
4. **Discipline Filter Tabs:** Quick buttons at the top (`ALL`, `BALLISTICS`, `ARMOR`, `PROPULSION`, `SONAR`) smoothly slide the camera directly to that branch.
5. **DNA Status HUD:** Prominent top-right counter displaying currently available Abyssal DNA (🧬) with glowing counter animations whenever DNA is harvested or spent.

### 5.3 Detailed Node Inspector Drawer (Sidebar / Modal)
Clicking any node pauses graph panning and slides open the **Schematic Inspector Drawer**:

```
┌──────────────────────────────────────────────────┐
│ [SCHEMATIC SPEC: B-1.1]                 [STATUS] │
│ CAVITATION NEEDLE INJECTORS (공동 주입 노즐)    MASTERED │
├──────────────────────────────────────────────────┤
│ DISCIPLINE: SUPERCAVITATING BALLISTICS (TIER 1)  │
│ CURRENT LEVEL: [ ■ ■ ■ □ □ ] 3 / 5               │
├──────────────────────────────────────────────────┤
│ [BLUEPRINT SPECIFICATION]                        │
│ High-frequency sonic micro-nozzles coat primary  │
│ projectiles in a micro-bubble envelope, sharply  │
│ lowering hydrodynamic drag and stabilizing mass. │
├──────────────────────────────────────────────────┤
│ CURRENT BENEFIT:                                 │
│  • Projectile Speed: +24.0%                      │
│  • Hitbox Clearance: +18.0%                      │
│                                                  │
│ NEXT RANK (LEVEL 4):                             │
│  • Projectile Speed: +32.0% (+8.0%)              │
│  • Hitbox Clearance: +24.0% (+6.0%)              │
├──────────────────────────────────────────────────┤
│ RESEARCH COST: 27 🧬 ABYSSAL DNA                  │
│ PLAYER BALANCE: 340 🧬                           │
│                                                  │
│   [ ⚡ RESEARCH UPGRADE (27 🧬) ]   [ CLOSE ]    │
└──────────────────────────────────────────────────┘
```

---

## 6. Synergies with Wave Scaling, Crises, & Technical Feasibility

### 6.1 Balancing Synergies with Existing Systems

#### Synergy with Common Enemy Piercing Damage Scaling
In the current game balance, late-game common invaders scale up with aggressive piercing multipliers that chew through player health.
- **Counterplay Integration:** The **Chitinous Bio-Armor** tree provides dedicated damage absorption, hazard mitigation, and reactive i-frame expansions. Rather than trivializing enemies, this provides players with the breathing room needed to survive waves 20+.

#### Synergy with the 12 End-Game Crisis Archetypes
- **Acid Storm / Toxic Seabed:** Players investing in *Hydrophobic Mucilage Sealant* gain up to $60\%$ resistance against acidic downpours.
- **EMP Disruption:** *Cavitation Needle Injectors* ensures high muzzle velocity even when weapon firing cadence is suppressed by electromagnetic shockwaves.
- **Titan Horde / Swarm Blitz:** *Singularity Vortex Cannon* acts as the premier crowd-control counter to massive cluster swarms.
- **Dimensional Rifts:** *Supercavitation Phase Dash* allows players to warp directly through rift shockwaves without taking lethal contact damage.

#### Synergy with 3-Way Factions & Crossfire
- *Acoustic Scrambler (Node 4.3)* increases the rate at which Rogue Cyber-Faction units lock onto Alien Invaders rather than the player. This turns the existing 3-way battlefield into an interactive tactical playground where players herd warring factions into mutual annihilation.

---

### 6.2 Technical Feasibility & Storage Architecture

#### 1. Strict Respect of Core Invariants
- **ZERO Modification to `logicalWidth` (800) and `logicalHeight` (600):** All node perks operate strictly on logical gameplay variables (`player.speed`, `player.maxHp`, `player.baseFireRate`, `bullet.velocity`, `missile.seekSpeed`) without tampering with the fixed game resolution or physics bounding box.
- **Pure Additive Architecture:** The tech tree lives in an isolated manager (`TechTreeManager.ts`) and UI component (`TechTreeModal.tsx`), cleanly referenced when initializing the player in `GameManager.ts`.

#### 2. Persistent Save-State Schema (`localStorage`)
The entire tech tree state is encapsulated in a lightweight, versioned JSON object stored in `localStorage` under `WATER_INVADER_TECH_TREE_V1`:

```typescript
export interface TechTreeSaveData {
  version: 1;
  abyssalDna: number;           // Total harvested DNA available
  lifetimeDna: number;          // Total DNA ever collected (for achievements)
  unlockedNodes: Record<string, number>; // nodeId -> investedRank (e.g. { 'ballistics_1': 3, 'armor_keystone': 1 })
  activeKeystones: string[];    // Array of currently equipped keystones
  checksum: string;             // CRC32/SHA256 signature to prevent corruption
}
```

#### 3. Seamless Game Engine Integration Point
When `GameManager` initializes or respawns the player:
```typescript
// Proposed clean hook in GameManager (zero breaking changes):
public applyPermanentTechTree(player: Player, techData: TechTreeSaveData) {
  const multipliers = TechTreeManager.computeModifiers(techData);
  player.speed = 300 * multipliers.moveSpeed;
  player.maxHp = 5 + multipliers.bonusMaxHp;
  player.baseFireRate = 0.5 * multipliers.fireRateMult;
  player.piercing += multipliers.bonusPiercing;
  player.invincibilityDuration = 1.0 + multipliers.bonusIFrames;
  // Apply unlocked keystones to player capability flags
  player.hasVortexCannon = techData.activeKeystones.includes('keystone_vortex');
  player.hasPhaseDash = techData.activeKeystones.includes('keystone_dash');
}
```

---

## 7. Comprehensive Summary Table of All 20 Tech Nodes

| Node ID | Name (KR / EN) | Branch | Max Rank | Primary Benefit per Rank | Keystone? |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `B-1` | 공동 주입 노즐 (Cavitation Injectors) | Ballistics | 5 | Bullet Speed +8%, Radius +6% | No |
| `B-2` | 고압 포신 가속기 (Pressure Accelerator)| Ballistics | 5 | Fire Interval -4% (Compound) | No |
| `B-3` | 초고온 플라즈마 탄두 (Plasma Core) | Ballistics | 4 | +12% Chance to ignite target | No |
| `B-4` | 텅스텐 관통 심봉 (Tungsten Core) | Ballistics | 3 | +1 Piercing (Lv 1, 3), +20% dmg retain | No |
| `B-KEY`| **중력 와류 특이점 포 (Singularity Vortex)**| **Ballistics** | **1** | **Every 8th shot creates vortex pull & AoE blast** | **YES** |
| `A-1` | 심해 키틴질 외피 (Abyssal Chitin) | Bio-Armor | 5 | Max HP +1 (Lv 2, 5), i-Frames +0.12s | No |
| `A-2` | 소수성 점액 코팅 (Mucilage Sealant) | Bio-Armor | 4 | Hazard / Acid damage -15% | No |
| `A-3` | 삼투성 나노 수복막 (Osmotic Regen) | Bio-Armor | 3 | Heals 1 HP every 4 / 3 / 2 waves | No |
| `A-4` | 반사형 가시 골격 (Reactive Spikes) | Bio-Armor | 4 | Struck releases 8-shard radial counter-burst | No |
| `A-KEY`| **공생형 자율 외골격 (Symbiotic Carapace)**| **Bio-Armor** | **1** | **At 1 HP: 2.5s absolute invulnerability + clear screen** | **YES** |
| `P-1` | 초전도 터빈 임펠러 (Superconducting Turbine)| Propulsion | 5 | Movement Speed +6% | No |
| `P-2` | 관성 제어 배플 (Inertial Baffles) | Propulsion | 4 | Deceleration lag -18% (Crisp stopping) | No |
| `P-3` | 후류 공동 와류 (Slipstream Wake) | Propulsion | 4 | Trailing wake slows enemy bullets by 8% | No |
| `P-4` | 비상 분사 부스터 (Emergency Overdrive)| Propulsion | 3 | At 70% panic: Speed +35%, Evasion +20% | No |
| `P-KEY`| **초공동 위상 질주 (Supercavitation Dash)**| **Propulsion** | **1** | **Double-tap flash dash 140px with i-frames & dmg** | **YES** |
| `S-1` | 고감도 하이드로폰 (Hydrophone Array)| Sonar | 5 | Missile acquisition +15%, Turn rate +10% | No |
| `S-2` | 반향 정위 펄스 (Echolocation Ping) | Sonar | 4 | Auto-ping pulse every 6s; targets take +15% dmg| No |
| `S-3` | 음향 교란 재머 (Acoustic Scrambler) | Sonar | 4 | Rogue AI crossfire targeting invaders +12% | No |
| `S-4` | 공진 주파수 동조 (Resonant Tuning) | Sonar | 3 | Bullet hits on pinged targets deal 30% AoE splash | No |
| `S-KEY`| **공진 분쇄 소나 (Resonance Disruption)**| **Sonar** | **1** | **Ultimate converts enemy bullets into friendly torpedoes**| **YES** |

---

## 8. Conclusion & Pitch Recommendation
Project **"Abyssal Xenobiology" (Station Nautilus)** elevates *Water Invader* from an exhilarating single-session arcade shooter into a world-class roguelite with endless replayability. By combining:
1. **Compelling narrative lore** (sub-aquatic xenobiology and invader reverse-engineering),
2. **Mathematically balanced diminishing-return progression curves**,
3. **Distinct build archetypes enabled by game-changing Keystones**,
4. **An authentic retro-blueprint schematic visual aesthetic**, and
5. **Procedural Web Audio API sound synthesis with zero bundle overhead**,

this system provides the long-term retention backbone needed to keep players returning across hundreds of runs. It directly complements the existing 12 End-Game Crises, 3-way faction crossfire, and wave scaling without requiring any changes to the underlying canvas dimensions or breaking existing test suites.

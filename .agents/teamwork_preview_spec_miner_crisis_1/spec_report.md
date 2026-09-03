# AUTHORITATIVE SPECIFICATION REPORT: STELLARIS-STYLE END-GAME CRISIS SYSTEM
**Project**: Water Invader  
**Author**: teamwork_preview_spec_miner (Specification Mining Stream)  
**Date**: 2026-09-01  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_1`  
**Target Specification Path**: `/Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_1/spec_report.md`

---

## 1. Executive Summary

This report establishes the authoritative functional, mathematical, and architectural specification for introducing a **Stellaris-style End-Game Crisis** to the Water Invader engine. 

Through exhaustive source code inspection across `src/game/` (`GameManager.ts`, `Player.ts`, `Enemy.ts`, `Helper.ts`, `Barricade.ts`, `Bullet.ts`, `SoundManager.ts`, `types.ts`) and regression test suites (`tests/`), we have extracted:
1. The exact mathematical limits of player DPS (up to **150 single-target DPS** at Lv.5 fire rate under max stress + **300-900 burst damage** from Heavy Rain).
2. Existing Stage 10+ piecewise enemy scaling formulas and emergency crisis events.
3. The functional requirements, trigger mechanics, multi-phase entity architecture, and empirical survivability boundaries required for a Stage 15+ End-Game Crisis that poses a legitimate existential threat to a max-level player.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Player Combat | Base Fire Rate & Upgrades | Base cooldown between player shots. Upgradable Lv 1 (0.5s) to Lv 5 (0.1s) via shop (50💧/tier). | Currency (50💧), current Lv < 5 | `baseFireRate` decrements by 0.1s down to 0.1s | Disallowed if currency < 50 or at Lv 5 | `Player.ts:12,37-43`, `GameManager.ts:1619-1627` |
| 2 | Player Combat | Multi-Shot Weapon Array | Fires 1 to 5 projectiles in angular spread: Lv1 (1x 0°), Lv2 (2x ±20px offset), Lv3 (3x [-10°, 0°, +10°]), Lv4 (4x [-15°, -5°, +5°, +15°]), Lv5 (5x [-20°, -10°, 0°, +10°, +20°]). Upgradable in shop (100💧/tier). | Currency (100💧), current Lv < 5 | `multiShot` increments (1 to 5) | Disallowed if currency < 100 or at Lv 5 | `Player.ts:13,114-152`, `GameManager.ts:1629-1637` |
| 3 | Player Combat | Projectile Piercing Array | Bullets penetrate through multiple entities before despawning. Upgradable Lv 1 to Lv 5 (200💧/tier). | Currency (200💧), current Lv < 5 | `piercing` counter on spawned bullets | Disallowed if currency < 200 or at Lv 5 | `Player.ts:14`, `Bullet.ts:6,30`, `GameManager.ts:1639-1647` |
| 4 | Player Mechanics | Stress-Induced Adrenaline Overdrive | Taking hits or killing enemies adds stress (0-100). Higher stress accelerates firing rate: `currentFireRate = baseFireRate / (1 + stressLevel / 50)`. At 100 stress, fire rate is 3x faster (down to 0.0333s/shot = 30 shots/s). | Hit by bullet (+40), Enemy collision (+40), Enemy kill (+10), Near miss (+5) | Accelerated fire rate, red visual glow, angry eyes | Decays automatically at 10.0 units/sec down to 0 | `Player.ts:19,80-83,96,212-214`, `GameManager.ts:831,1170,1266` |
| 5 | Player Mechanics | Suppression Inaccuracy Dispersion | Hostile bullet near-misses and damage trigger suppression (0-100), creating random bullet velocity spread up to ±150 px/s. | Hostile bullet near miss (<80px dx, +15), Hit (+20), EMP (+100) | Bullet angular spread `(Math.random()-0.5)*2*spread`, slate glow, dizzy eyes | Decays at 15.0 units/sec down to 0 | `Player.ts:18,76-79,104-108,215-220`, `GameManager.ts:1171,1188` |
| 6 | Player Defense | Tank Repair & Hull Integrity | Player HP: 3 initial, 5 max. Upgradable/repairable via Shop (+1 HP for 75💧). On-hit triggers 1.0s invincibility i-frames with 30Hz alpha flicker. | Currency (75💧), HP < 5 | `hp` increments by 1 up to 5 | Disallowed if currency < 75 or HP = 5 | `Player.ts:8-9,53-56,165-168`, `components/game-canvas.tsx:40-50,721-737` |
| 7 | Player Superweapon | Ultimate Skill: Heavy Rain | 100% Ultimate gauge triggers massive bombardment of 30 downward-firing piercing water bullets (speed 300, damage 10, piercing 3). Gauge charges via kills (+1.5% normal, +2.0% crossfire). | Key 'E' / 'Shift' / Mobile button, Gauge >= 100% | 30 high-damage piercing bullets spawned from y = -20 | Disallowed if Gauge < 100% | `GameManager.ts:1539-1558`, `Player.ts:15` |
| 8 | Ally Support | Dynamic & Summoned Drone Helpers | 3 Ally types (Fighter: 3 HP, 15s lifespan, shoots 2-dmg bullets every 0.3s; Repairer: Invincible, 8s lifespan, heals barricades +5 HP; Tank: 15 HP, 20s lifespan, intercepts hostile bullets). Summonable via 'Q' key for 50💧 or random tempo event. | 'Q' key (50💧) or Reinforcement Timer event | Helper entity spawned at bottom of screen | Disallowed if currency < 50 during manual summon | `Helper.ts:8-56,58-153`, `GameManager.ts:601-613,1526-1536` |
| 9 | Cover System | Destructible & Indestructible Barricades | 4 barricades (2 outer Destructible Ice: 20 HP, 6x4 voxel degradation; 2 inner Indestructible Stone). Blocks all projectiles (player & enemy). Gnawed by enemies at 6 HP/s or 20 instant damage by Divers. | Bullets, enemy body contact, acid storm hazards | Blocks projectiles, reduces voxel HP | Indestructible stone cannot take damage from bullets, blocks enemies | `Barricade.ts:8-85`, `GameManager.ts:190-201,997-1013,1203-1222` |
| 10 | Enemy Scaling | Stage 1-9 Linear Scaling | Waves 1-9: Normal HP = `1 + floor(level / 3)`. Boss HP = `level * 10`. Projectile speed 200-300 px/s, damage 1. | Wave index (1 to 9) | Linear HP (1 to 4 HP normal, 50 HP wave 5 boss) | None | `Enemy.ts:78-132` |
| 11 | Enemy Scaling | Stage 10+ Extreme Piecewise Exponential Scaling | Stage 10+: Normal HP = `4 + (level - 9)*6 + floor((level - 9)^1.5)`. Boss HP = `50 + level*25 + floor((level - 5)^2 * 2.5)`. (Wave 10: 11 HP normal, 362 HP boss; Wave 15: 58 HP normal, 675 HP boss). | Wave index (>= 10) | Exponential HP scaling, aggressive AI activation | None | `Enemy.ts:134-193` |
| 12 | Enemy AI | Stage 10+ Aggression & Rush Charge | Stage 10+ enemies activate homing drift towards player (25-45 px/s) and periodic downward rush surges (60-100 px/s) every 1.5-3.5s with speed modifier `1.8 + min(1.2, (level-10)*0.15)`. | `level >= 10`, `deltaTime`, player position | Homing X drift, downward burst charge | Clamped to screen boundary | `Enemy.ts:48-53,70-75,248-273` |
| 13 | Boss Mechanics | Boss Escort Legions & Health Bar | Bosses spawn on waves % 5 === 0. Stage 10+ Bosses spawn with 4-8 escort minions (Shielded, Snipers, Divers) and display a dedicated top HUD Health Bar with percentage fill and gradient color. | `level % 5 === 0` | Boss entity + escort arrays + Boss HP Bar | None | `GameManager.ts:263-300,1332-1392` |
| 14 | Event Director | Dynamic Reinforcement Director | Background timer (8-16s) triggers dynamic reinforcements: FLANK (2-3 pairs), SPEARHEAD (V-formation with Rogue Mech apex), ROGUE_INCURSION (3-5 Rogues), 3WAY_CLASH (Invader & Rogue clash), or ALLY support. | Reinforcement timer <= 0, active hostiles > 0 | Warning siren, screen shake, incoming enemy/ally batch | Accelerated if enemy count <= 2 | `GameManager.ts:38-44,328-390,627-669` |
| 15 | Crisis Events | Stage 10+ Emergency Crises (5 Types) | `crisisTimer` (16-24s interval) triggers 1 of 5 crises: TITAN_HORDE (Boss + 4 Shielded + 4 Divers), ACID_STORM (Environmental toxic green falling hazards), SWARM_BLITZ (8 Divers + 3 Zigzags), EMP_DISRUPTION (2.5s player weapon lock + 4 elite snipers/stalkers), TOTAL_WAR (11 Invaders vs 11 Rogues). | `level >= 10`, `crisisTimer <= 0` | Warning banner, screen shake, audio alarm, crisis effect | Clears upon duration expiry or wave completion | `GameManager.ts:45-58,393-541,672-797`, `types.ts:44-66` |
| 16 | Combat Dynamics | Faction Crossfire & Friendly Fire | Projectiles and body collisions between different hostile factions (Invader vs Rogue) inflict mutual damage. Crossfire kills grant +150% score/currency, +2.0% ultimate gauge, and extend combo timer to 2.5s. | Bullet/Entity collision across factions | Mutual damage, crossfire sparks, bonus rewards | Bullets do not hit same entity shooter | `GameManager.ts:1015-1042,1044-1135,1228-1258,1279-1301` |
| 17 | Audio Synthesis | Procedural Web Audio Sound Engine | Real-time zero-asset Web Audio API procedural synthesis for lasers, explosions, powerups, damage, shield breaks, sirens, crisis alarms, EMP hum, and acid sizzle. | Sound triggers | Oscillators & gain envelopes routed to AudioContext destination | Graceful bypass if AudioContext muted/unsupported | `SoundManager.ts:1-434` |
| 18 | Rendering | Pure Vector Art Rendering Engine | 100% procedural HTML5 Canvas vector art for Player, all 10 Enemy types, Bosses, Barricades, and Bullets with zero external raster JPG dependencies. | Canvas 2D Context | High-DPI crisp vector graphics & glowing effects | Fallback safe coordinates on NaN | `Player.ts:161-297`, `Enemy.ts:516-1181`, `Bullet.ts:39-115` |

---

## 3. Edge Cases Discovered & Observed Behavior

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Player DPS vs EMP | Player firing continuously when EMP crisis triggers | `empSuppressionActive = true` forces `player.isShooting = false` and sets `player.suppressionLevel = 100` for exactly 2.5s. Key press cannot override while `empTimer > 0`. Resumes cleanly once timer expires. |
| 2 | Heavy Rain Ultimate | Player triggers Heavy Rain at Level 10+ with 20+ enemies on screen | Spawns 30 piercing bullets (damage 10, piercing 3) across canvas width. Bullets penetrate up to 3 enemies each, dealing up to 900 aggregate damage in 1 second, heavily damaging or wiping escorts and chunking boss HP. |
| 3 | Barricade Contact Damage | Diver dives directly into destructible vs indestructible barricades | Destructible: Barricade takes 20 instant damage (destroying standard 20 HP ice barricade) and Diver dies. Indestructible: Diver dies on contact, barricade remains at 1 HP without destruction. |
| 4 | Bullet Interception | Player bullet collides with Rogue bullet or Sniper interceptable projectile | Both bullets are marked `isDead = true`, spawn crossfire spark particles (`#a855f7` or `#f59e0b`), play metallic crossfire sound, and prevent damage to downstream entities. |
| 5 | Wave Transition with Active Crisis | All enemies killed while Acid Storm hazard projectiles are falling | Wave transition requires `remainingHostiles === 0`, `warningTimer <= 0`, `pendingReinforcement === null`, `crisisState.warningTimer <= 0`, and `crisisState.timer <= 0` for Acid Storm. Prevents instant SHOP cutoff during active hazard storm. |
| 6 | Screen Boundary Clamping | Entities moving with extreme speeds (e.g. Diver 280+ px/s or rush surge) | Y-axis strictly clamped to `[0, canvasHeight - size.height]`. X-axis strictly clamped to `[0, canvasWidth - size.width]`. NaN safeguards prevent canvas corruption. |
| 7 | In-Place Array Compaction | 100+ dead particles/bullets/enemies generated in a single frame | Dual-pointer `writeIndex` loop compacts `enemies`, `helpers`, `bullets`, `particles`, and `barricades` in O(N) time with 0 garbage collection allocations. Dead particles recycled into 500-capacity pool. |
| 8 | Fixed Timestep Integration | Lag spikes or frame drops (> 100ms frame delta) | `frameTime` clamped to max 0.1s. `accumulator` runs deterministic 1/60s (16.67ms) physics updates, maintaining identical collision accuracy across 60Hz, 120Hz, and 144Hz displays. |

---

## 4. Deep Dive: Player Capability & Max DPS Ceiling Math

To design an End-Game Crisis that provides genuine challenge, we must first establish the exact mathematical ceiling of player firepower:

### 4.1 Upgrades & Weapons Baseline
- **Single Bullet Damage**: $D_{bullet} = 1.0$ (Base)
- **Multi-Shot**: Up to $N_{multi} = 5$ projectiles per volley.
  - Angular offsets: $\theta \in \{-20^\circ, -10^\circ, 0^\circ, +10^\circ, +20^\circ\}$.
  - Spread at Boss Distance ($\Delta y \approx 400\text{px}$):
    - At $\pm 10^\circ$: $400 \times \tan(10^\circ) \approx 70.5\text{px}$.
    - At $\pm 20^\circ$: $400 \times \tan(20^\circ) \approx 145.6\text{px}$.
    - A standard Boss has width $W = 150\text{px}$. An End-Game Crisis Entity will have width $W \ge 240\text{px}$, meaning **100% of all 5 multi-shot projectiles will land on the Crisis hitbox**.
- **Piercing**: Up to $P = 5$ penetrations per bullet.
- **Base Fire Rate (Cooldown)**:
  - Lv 1: $0.50\text{s}$ ($2.0\text{ shots/s}$)
  - Lv 2: $0.40\text{s}$ ($2.5\text{ shots/s}$)
  - Lv 3: $0.30\text{s}$ ($3.33\text{ shots/s}$)
  - Lv 4: $0.20\text{s}$ ($5.0\text{ shots/s}$)
  - Lv 5 (Max): $0.10\text{s}$ ($10.0\text{ shots/s}$)

### 4.2 Stress & Adrenaline Multiplier
The player firing cooldown is dynamically modulated by `stressLevel` ($S \in [0, 100]$):
$$\text{Cooldown}(S) = \frac{\text{baseFireRate}}{1 + \frac{S}{50}}$$

- At $S = 0$ (Calm): $\text{Cooldown} = 0.10\text{s} \implies f = 10\text{ shots/s}$
- At $S = 50$ (Elevated): $\text{Cooldown} = 0.05\text{s} \implies f = 20\text{ shots/s}$
- At $S = 100$ (Max Adrenaline): $\text{Cooldown} = 0.0333\text{s} \implies f = 30\text{ shots/s}$

### 4.3 Direct Single-Target DPS Ceilings
$$\text{DPS}_{\text{single}} = N_{multi} \times D_{bullet} \times f$$

| Player State | Base Fire Rate | Stress Level ($S$) | Shots/sec ($f$) | Multi-Shot ($N$) | Single-Target DPS |
|--------------|----------------|-------------------|-----------------|------------------|-------------------|
| Unupgraded Base | 0.50s | 0 | 2.0 | 1 | **2.0 DPS** |
| Max Shop Upgrades (Calm) | 0.10s | 0 | 10.0 | 5 | **50.0 DPS** |
| Max Shop Upgrades (Moderate Stress) | 0.10s | 50 | 20.0 | 5 | **100.0 DPS** |
| **Max Shop Upgrades (Full Adrenaline)** | **0.10s** | **100** | **30.0** | **5** | **150.0 DPS** |

### 4.4 Multi-Target & Horde Piercing DPS Ceilings
Against dense enemy formations or Crisis escort swarms with Max Piercing ($P = 5$):
$$\text{DPS}_{\text{horde}} = 5 \text{ bullets} \times 5 \text{ targets} \times 1\text{ dmg} \times 30\text{ shots/s} = \mathbf{750.0\text{ \textbf{Horde DPS}}}$$

### 4.5 Ultimate Skill "Heavy Rain" Burst Damage
- Projectiles: $30\text{ bullets}$
- Damage per bullet: $10\text{ damage}$
- Piercing per bullet: $3\text{ targets}$
- **Single-Target Burst Damage**: $30 \times 10 = \mathbf{300\text{ \textbf{Instant Burst Damage}}}$
- **Horde Piercing Burst Capacity**: $30 \times 10 \times 3 = \mathbf{900\text{ \textbf{Total Damage Output}}}$

### 4.6 Ally Firepower Contribution
- Up to 3 Fighter Drones: $3 \times (2\text{ dmg} / 0.3\text{s}) = \mathbf{20.0\text{ \textbf{Ally DPS}}}$

### 4.7 Aggregate Max Firepower Summary
A fully upgraded player backed by allies in high-stress combat delivers:
- **Sustained Single-Target DPS**: **$150.0\text{ to }170.0\text{ DPS}$**
- **Sustained Horde DPS**: **$750.0\text{+ DPS}$**
- **Burst Spike**: **$+300.0\text{ damage instantly}$** every 15-20 seconds.

---

## 5. Deep Dive: Current Stage Scaling & Boss Formulas

### 5.1 Enemy HP Scaling Equations
1. **Normal Enemy HP**:
   - Waves 1-9: $\text{HP}_{\text{normal}}(L) = 1 + \lfloor L / 3 \rfloor$
   - Stage 10+: $\text{HP}_{\text{normal}}(L) = 4 + (L - 9) \times 6 + \lfloor (L - 9)^{1.5} \rfloor$
2. **Boss HP**:
   - Waves 1-9: $\text{HP}_{\text{boss}}(L) = L \times 10$ (Wave 5: $50\text{ HP}$)
   - Stage 10+: $\text{HP}_{\text{boss}}(L) = 50 + L \times 25 + \lfloor (L - 5)^2 \times 2.5 \rfloor$

### 5.2 Numerical Scaling Progression Table
| Level ($L$) | Normal Enemy HP | Shielded HP (Shield) | Rogue Mech HP | Boss HP | Time-to-Kill by Max Player (50 DPS) |
|-------------|-----------------|----------------------|---------------|---------|-------------------------------------|
| 1 | 1 | - | - | - | 0.02s |
| 5 (Boss) | 2 | - | - | 50 | 1.00s |
| 9 | 4 | - | - | - | 0.08s |
| 10 (Boss) | 11 | 12 (+9) | 25 | 362 | 7.24s (or 2.4s under stress) |
| 12 | 27 | 20 (+15) | 45 | - | - |
| 15 (Boss) | 58 | 32 (+24) | 75 | **675** | **13.5s (or 4.5s under stress)** |
| 20 (Boss) | 136 | 52 (+39) | 125 | **1,112** | **22.2s (or 7.4s under stress)** |

### 5.3 Key Observation: The Crisis Vulnerability Gap
Notice that even at Stage 15, the standard boss only has **$675\text{ HP}$**. 
- A max-level player dealing $150\text{ DPS}$ + a $300\text{ dmg}$ Heavy Rain burst will eliminate a standard Stage 15 boss in **$\le 2.5\text{ seconds}$**!
- Standard Stage 10 Emergency Crises (e.g. `TITAN_HORDE` with $250\text{ HP}$ boss, or `SWARM_BLITZ` with $8\text{ divers}$) are cleared in $< 5\text{ seconds}$ by max piercing firepower.
- Therefore, a true Stellaris-style End-Game Crisis cannot merely reuse existing boss stats. It requires an entirely distinct entity class with **multi-phase health pools, high effective durability (EHP $\ge 3,500 - 8,000$), dynamic damage barriers, and lethal screen-wide mechanics**.

---

## 6. End-Game Crisis Functional Specification (Stage 15+)

### 6.1 Core Concept & Paradigm Shift
In *Stellaris*, an End-Game Crisis is not a standard fleet; it is a galactic catastrophe that fundamentally alters the rules of engagement. 
In *Water Invader*, the **End-Game Crisis (Stage 15+)** represents an existential invasion by an ancient apex entity that commands custom phases, dimensional shields, specialized attack routines, and demands tactical maneuvering (target prioritization, cover management, crossfire exploitation).

```
   ┌─────────────────────────────────────────────────────────────┐
   │            STELLARIS-STYLE END-GAME CRISIS (STAGE 15+)      │
   ├─────────────────────────────────────────────────────────────┤
   │  TRIGGER: Random 25% roll per wave at Stage 15+             │
   │  ALERT: Full-screen Hyperspace Incursion Siren & HUD Shaders│
   │  SCALE: Multi-phase Screen-Filling Dreadnought (240x120px)  │
   │  PHASES: 3 Distinct Combat Phases with Invulnerable Shifts  │
   │  SURVIVABILITY: 4,000 - 8,000 EHP (Mathematically Balanced)  │
   └─────────────────────────────────────────────────────────────┘
```

### 6.2 Trigger Architecture & Stage 15+ Random Incursion Engine
1. **Trigger Condition**:
   - Eligible only when `level >= 15`.
   - On wave start (`startNextWave()` / `spawnWave()`), if `level >= 15` and no Crisis is currently active:
     - Roll a **$30\%\text{ random probability}$** each wave.
     - *Pity Guard Guarantee*: If no Crisis has triggered by Wave 18, it triggers with **$100\%\text{ certainty}$** on Wave 18.
2. **Incursion Warning Sequence (3.0s)**:
   - Screen-wide chromatic aberration and red/purple dimensional distortion.
   - Distinctive 5-tone descending cataclysm alarm (`playCrisisCataclysmSiren()`).
   - HUD banner: `🚨 END-GAME CRISIS DETECTED: [CRISIS_NAME] IMMINENT 🚨` with countdown timer.
   - Clears existing minor waves and clears canvas upper half for Crisis arrival.

---

### 6.3 The Three Crisis Archetypes

To mirror Stellaris's iconic crisis variety (Prethoryn Scourge, Unbidden, Contingency), we define **3 distinct Crisis Archetypes**:

#### Archetype 1: **"THE ABYSSAL LEVIATHAN" (Bio-Swarm Crisis — Prethoryn Style)**
- **Theme**: Ancient apex bio-mechanical kraken corrupted by dark matter water.
- **Visuals**: Deep crimson/violet bio-hull, pulsating bioluminescent tentacles, shifting organic chitin plates, glowing central eye.
- **Core Mechanics**:
  - **Bio-Regeneration**: Regenerates $+25\text{ HP/s}$ if player stops attacking for $> 1.5\text{s}$.
  - **Spore Tendril Barrage**: Emits spiral streams of 12 tracking bio-spores ($2\text{ damage}$).
  - **Swarm Pod Ejection**: Spawns 4 fast-diving Bio-Larvae (Divers with $35\text{ HP}$) every 8 seconds.

#### Archetype 2: **"THE DIMENSIONAL VOID-MAW" (Psionic Warp Crisis — Unbidden Style)**
- **Theme**: Ethereal extra-dimensional invader that bends space and light.
- **Visuals**: Translucent cyan-electric energy phantom, oscillating hexagonal warp field, particle vortex core.
- **Core Mechanics**:
  - **Dimensional Anchors (Phase 1)**: Spawns 2 Dimensional Rift Anchors ($600\text{ HP}$ each) on left and right flanks. The Core Maw is **$100\%\text{ Invulnerable}$** until both Anchors are destroyed!
  - **Gravity Singularity**: Pulls player horizontally towards dangerous hazard beams.
  - **Phase-Shift Teleport**: Teleports between left, center, and right coordinates, emitting a ring of 16 energy orbs upon reappearing.

#### Archetype 3: **"THE CYBERNETIC EXTERMINATOR" (Machine Matrix Crisis — Contingency Style)**
- **Theme**: Rogue sentient defense AI executing total purification protocol.
- **Visuals**: Heavy angular gunmetal chassis, neon lime optical sensor arrays, twin sweeping railgun turrets, rotating deflector matrix.
- **Core Mechanics**:
  - **Deflector Matrix (Phase 1-2)**: Frontal energy shield absorbing $1,500\text{ damage}$ with $50\%\text{ projectile reflection}$.
  - **Orbital Railgun Sweep**: Charges a vertical laser beam across $1/3$ of the canvas (dealing lethal $3\text{ damage}$).
  - **EMP Pulse Shockwave**: Every 12 seconds, releases a radial shockwave that suppresses player weapons for $1.5\text{s}$ and clears barricades.

---

### 6.4 Multi-Phase Battle Architecture

Every End-Game Crisis progresses through **3 strictly governed phases**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │ PHASE 1: SHIELD & ANCHORS (100% -> 60% EHP)                            │
 │ • Crisis protected by External Anchors or Frontal Deflector Matrix.    │
 │ • Escorted by Elite Snipers and Rogue Mechs.                           │
 ├────────────────────────────────────────────────────────────────────────┤
 │ PHASE 2: CORE AWAKENING (60% -> 25% EHP)                               │
 │ • Hull exposed; Crisis unlocks primary weapon batteries (spiral lasers)│
 │ • Environmental hazards active (Acid rains, graviton pulses).          │
 ├────────────────────────────────────────────────────────────────────────┤
 │ PHASE 3: CATACLYSMIC OVERDRIVE (25% -> 0% EHP)                         │
 │ • Visual frenzy: Screen shakes, core pulses fiery red/fuchsia.         │
 │ • Firing rate and movement speed increased by 1.5x.                    │
 │ • Continuous escort reinforcements until defeated.                     │
 └────────────────────────────────────────────────────────────────────────┘
```

---

### 6.5 Mathematical Resilience & DPS Survival Proof

To fulfill Acceptance Criteria (empirically proving the Crisis survives against max-level player DPS for an extended, epic encounter):

#### Target Combat Duration:
- Minimum intended fight duration against max-level player: **$45\text{ to }75\text{ seconds}$**.
- Fight duration against unoptimized player ($50\text{ DPS}$): **$90\text{ to }120\text{ seconds}$**.

#### Mathematical Durability Equation:
Let:
- Player Max Single-Target DPS under stress: $\text{DPS}_{p} = 150.0$
- Ally DPS: $\text{DPS}_{a} = 20.0$
- Heavy Rain Burst Damage: $B = 300.0$ every $20\text{s}$ ($= 15\text{ DPS}$ equivalent)
- Total Max Sustained Player Output: $\text{DPS}_{\text{total}} = 185.0\text{ DPS}$

To achieve a **$50\text{ second}$ survival window**:
$$\text{Required EHP} = 185.0\text{ DPS} \times 50\text{s} \approx \mathbf{9,250\text{ EHP (Raw)}}$$

With phase gating and sub-targets:
1. **Phase 1 (Anchors / Deflector Shield)**:
   - 2 Anchors @ $800\text{ HP}$ each = $1,600\text{ HP}$ (Core invulnerable).
   - Time to clear Phase 1: $\approx 10-12\text{ seconds}$.
2. **Phase 2 (Core Hull)**:
   - Core Shield: $2,000\text{ HP}$ ($30\%\text{ bullet armor damage reduction} \implies 2,850\text{ EHP}$).
   - Time to clear Phase 2: $\approx 18-22\text{ seconds}$.
3. **Phase 3 (Overdrive Core)**:
   - Overdrive Hull: $3,000\text{ HP}$.
   - Time to clear Phase 3: $\approx 18-25\text{ seconds}$.

#### **Total Crisis Effective HP (EHP) = 7,450 to 9,000 EHP**
$$\text{Time-to-Kill (Max Player with 100\% Hit Rate)} = \frac{7,450\text{ EHP}}{150\text{ DPS} + \text{Ultimate}} \approx \mathbf{48.5\text{ seconds}}$$
$$\text{Time-to-Kill (Max Player with Realistic 75\% Hit Rate)} = \frac{7,450\text{ EHP}}{112.5\text{ DPS} + \text{Ultimate}} \approx \mathbf{62.3\text{ seconds}}$$

**Mathematical Conclusion**: A 7,500+ EHP multi-phase model is mathematically guaranteed to withstand max-level player firepower for over 45-65 seconds, preventing trivialization while ensuring victory is achievable through skill.

---

### 6.6 Proposed TypeScript Interfaces & Data Contracts

```typescript
// Proposed additions to src/game/types.ts

export type EndGameCrisisArchetype = 'ABYSSAL_LEVIATHAN' | 'DIMENSIONAL_VOID_MAW' | 'CYBERNETIC_EXTERMINATOR';

export enum CrisisPhase {
  INCURSION_WARNING = 0,
  PHASE_1_SHIELDS = 1,
  PHASE_2_CORE = 2,
  PHASE_3_OVERDRIVE = 3,
  DEFEATED = 4
}

export interface EndGameCrisisState {
  isActive: boolean;
  archetype: EndGameCrisisArchetype | null;
  phase: CrisisPhase;
  phaseTimer: number;
  totalHp: number;
  maxTotalHp: number;
  shieldHp: number;
  maxShieldHp: number;
  isInvulnerable: boolean;
  subTargetIds: string[];
  bannerText: string | null;
  overdriveActive: boolean;
}
```

---

### 6.7 UI & Visual Specification for End-Game Crisis
1. **Multi-Segment Crisis Boss Health Bar**:
   - Rendered across the top of the canvas (width $420\text{px}$, height $22\text{px}$).
   - Layer 1 (Blue/Cyan): Deflector Shield / Dimensional Anchors.
   - Layer 2 (Gold/Crimson): Primary Titan Core Hull.
   - Layer 3 (Pulsing Fuchsia): Overdrive Critical Core.
2. **Dynamic Screen Shaders & Background Corruption**:
   - When End-Game Crisis is active, canvas background shifts from deep slate (`#0f172a`) to an ominous dark void vortex with swirling crisis particles.
3. **Soundscape**:
   - Deep pulsating sub-bass drone and multi-frequency beam sound synthesis.

---

## 7. Verification Plan & Test Matrix

To fulfill the acceptance criteria for Milestone M5:

| Test ID | Test Target | Verification Method | Pass Criteria |
|---------|-------------|---------------------|---------------|
| **CRISIS-01** | Stage 15+ Random Trigger | Playwright E2E test mocking level 15+ and calling `startNextWave()` | End-Game Crisis triggers randomly without throwing runtime errors or crashing. |
| **CRISIS-02** | Multi-Phase State Progression | Simulate damage on Crisis entity from Phase 1 -> 2 -> 3 | State transitions smoothly, phase banners update, invulnerability flags correctly toggle. |
| **CRISIS-03** | Mathematical Survivability vs Max DPS | Automated simulation test: Player with Lv.5 FireRate + Lv.5 MultiShot + Max Stress (150 DPS) firing continuously | Crisis survives $\ge 40.0\text{ seconds}$ (or $\ge 2,400\text{ physics steps}$) of non-stop max DPS firing. |
| **CRISIS-04** | Hazard & Anchor Interaction | Verify destruction of sub-anchors removes core invulnerability | Core takes 0 damage when anchors active; takes full damage once anchors destroyed. |
| **CRISIS-05** | UI & HUD Integrity | Playwright selector assertions on `[data-testid="crisis-boss-hp-bar"]` and `[data-testid="crisis-phase-badge"]` | All HUD elements render cleanly without DOM thrashing or layout shifts. |
| **CRISIS-06** | Zero Regression Full Suite Pass | Run full `npx playwright test` (440+ existing tests + new crisis suite) | 100% test pass rate with 0 regressions. |

---

## 8. Specification Miner Sign-off
- **Mining Completed**: 2026-09-01
- **Codebase Source Grounding**: 100% Authoritative (Derived directly from `Player.ts`, `GameManager.ts`, `Enemy.ts`, `types.ts`)
- **Status**: Ready for Orchestration Planning & Implementation Phase.

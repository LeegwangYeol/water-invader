# End-Game Crisis System Investigation & Expansion Architectural Report

**Author**: Explorer 1 (`teamwork_preview_explorer_crisis_1`)  
**Workspace**: `/Users/user/src/water-invader`  
**Date**: 2026-09-03  
**Status**: Comprehensive Investigation & Architectural Specification Complete  

---

## Executive Summary

This investigation examines the existing Crisis architecture in Water Invader across `src/game/types.ts`, `src/game/crisis/`, `src/game/GameManager.ts`, `src/components/game-canvas.tsx`, and associated Playwright unit and E2E test suites (`tests/` and `tests/unit/`).

### Core Findings at a Glance
1. **Current Distinct End-Game Crisis Count**: **3** (`CrisisArchetype` in `src/game/crisis/types.ts`).
   - `VOID_SOVEREIGN` (Extra-dimensional crystalline void dreadnought)
   - `ABYSSAL_LEVIATHAN` (Corrupted bio-mechanical kraken)
   - `CYBERNETIC_EXTERMINATOR` (Sentient rogue purification AI dreadnought)
2. **Current Intermediate/Hazard Crisis Count**: **6** (`CrisisType` in `src/game/types.ts`).
   - `TITAN_HORDE`, `ACID_STORM`, `SWARM_BLITZ`, `EMP_DISRUPTION`, `TOTAL_WAR`, `SOLAR_FLARE`
3. **Doubling Target**: To double the current number of distinct End-Game Crisis types, the system expands from **3 to 6 archetypes** by specifying 3 entirely new End-Game Crisis concepts:
   - `CHRONO_DEVOURER` (Temporal Paradox Harbinger)
   - `SOLARIS_COLOSSUS` (Stellar Hypergiant Dreadnought)
   - `NEBULA_PHANTASM` (Quantum Spectral Swarm)
4. **Encounter Contract**: Each End-Game Crisis commands **5,200 total EHP** across 3 discrete combat phases (2x 600 HP Phase 1 anchors with an invulnerable Sovereign, 2,500 HP Phase 2 hull, 1,500 HP Phase 3 core with a 35.0s enrage countdown), preceded by a 3.0s incursion warning and followed by a cataclysmic defeat resolution.

---

## 1. Current Crisis Types & Inventory Count

### 1.1 Distinct End-Game Crisis Types (`CrisisArchetype`)
Defined in `src/game/crisis/types.ts` (lines 6–10) and re-exported in `src/game/types.ts` (line 80):

| Index | Identifier (`CrisisArchetype`) | Title & Subtitle | Visual Signature | Primary Anchor Type |
|---|---|---|---|---|
| 1 | `VOID_SOVEREIGN` | `THE VOID SOVEREIGN — EXTRA-DIMENSIONAL CATACLYSM` | Violet crystalline hull (`#c084fc`, `#1e1b4b`), floating psionic rift spikes, dark singularity eye | Singularity Rifts (`#a855f7`, `#06b6d4`) with gravitational vortex physics |
| 2 | `ABYSSAL_LEVIATHAN` | `THE ABYSSAL LEVIATHAN — CORRUPTED BIO-SWARM HORROR` | Deep emerald chitin (`#10b981`, `#022c22`), 6 waving procedural spore tendrils, toxic gland glow | Bio-Brood Sacks (`#84cc16`) spawning toxic acid spitters/larvae |
| 3 | `CYBERNETIC_EXTERMINATOR` | `CYBERNETIC EXTERMINATOR MATRIX — PURIFICATION DREADNOUGHT PROTOCOL` | Titanium angled plates (`#ef4444`, `#0f172a`), dual railgun sponsons, hazard stripes | EMP Laser Pylons (`#ef4444`) firing high-velocity shock rail bolts |

**Total Distinct End-Game Crisis Count**: **3**

### 1.2 Intermediate / Environmental Hazard Crisis Types (`CrisisType`)
Defined in `src/game/types.ts` (line 44) and triggered during regular wave gameplay via `GameManager.triggerCrisis(type?: CrisisType)`:

| Index | Identifier (`CrisisType`) | Banner Text | Duration | Mechanics & Enemy Composition |
|---|---|---|---|---|
| 1 | `TITAN_HORDE` | `EMERGENCY CRISIS: TITAN BIO-MECH ESCORT HORDE!` | 10.0s | Heavy boss (250+ HP) escorted by 4 Shielded and 4 Diver units |
| 2 | `ACID_STORM` | `EMERGENCY CRISIS: TOXIC ACID STORM HAZARD!` | 10.0s | Falling environmental acidic projectiles across canvas; mitigated by acid shield |
| 3 | `SWARM_BLITZ` | `EMERGENCY CRISIS: SWARM DIVER BLITZ!` | 8.0s | Coordinated pincer dive attacks: 4 left divers, 4 right divers, 3 center zigzags |
| 4 | `EMP_DISRUPTION` | `EMERGENCY CRISIS: EMP WEAPON DISRUPTION!` | 3.5s | 2.5s player weapon suppression; 2 Snipers + 2 Rogue Stalkers spawned |
| 5 | `TOTAL_WAR` | `EMERGENCY CRISIS: 3-WAY TOTAL WAR INCURSION!` | 12.0s | 22-unit clash: 11 Invaders (left) vs 11 Rogues (right) |
| 6 | `SOLAR_FLARE` | `EMERGENCY CRISIS: HIGH-ENERGY SOLAR FLARE SURGE!` | 8.0s | 3 vertical telegraph warning beams igniting into sweeping plasma columns |

**Total Intermediate Hazard Crisis Count**: **6**

---

## 2. End-Game Crisis Architectural Deep Dive

### 2.1 Trigger Lifecycle & Idempotency
- **Autonomous Campaign Trigger (`GameManager.spawnWave()`, lines 384–391)**:
  - Evaluated on Stage >= 15 on non-boss waves (`level % 5 !== 0`).
  - Strict idempotency guards: `!this.endGameCrisis && !this.hasEndGameCrisisOccurred` ensure the crisis triggers at most once per run.
  - Probability: 30% random roll per eligible wave (`Math.random() < 0.30`), with a deterministic pity trigger at Wave >= 18 (`this.level >= 18`).
- **Deterministic Testing Hook (`GameManager.triggerEndGameCrisis(archetype?)`, lines 306–342)**:
  - Sets `this.hasEndGameCrisisOccurred = true`.
  - Instantly clears all standard enemies (`this.enemies = []`).
  - Instantiates coordinator: `new EndGameCrisis(this.logicalWidth, this.logicalHeight)`.
  - Invokes `endGameCrisis.startIncursion(archetype, soundManager)`.
  - Binds event callbacks: `onPhaseChange`, `onDefeated`, `onRiftDestroyed`.
  - Triggers screen shake (1.5 magnitude) and cataclysm siren audio (`soundManager.playCrisisCataclysmSiren()`).

### 2.2 Structural Architecture & Entity Composition
```
                   ┌─────────────────────────────────────────┐
                   │        EndGameCrisis Coordinator        │
                   │ (isActive, phase, warningTimer, state)  │
                   └────────────────────┬────────────────────┘
                                        │
           ┌────────────────────────────┴───────────────────────────┐
           ▼                                                        ▼
┌─────────────────────────────────┐                      ┌─────────────────────────────────┐
│     CrisisSovereign (260x130)   │                      │  DimensionalRift Anchors (x2)   │
│ Hull: 2500 HP | Core: 1500 HP   │                      │ Left: 600 HP | Right: 600 HP    │
│ Total EHP: 4,000 HP             │                      │ Total Anchor EHP: 1,200 HP      │
└─────────────────────────────────┘                      └─────────────────────────────────┘
```
- **Total Encounter EHP**: 1,200 (Anchors) + 2,500 (Hull) + 1,500 (Core) = **5,200 EHP**.
- **Colliders**: Managed in `getActiveColliders()`: both live rifts and the live sovereign act as distinct hitboxes.

### 2.3 Discrete Phase State Machine & Transitions

```
[Wave 15+ Trigger]
        │
        ▼
┌──────────────────┐  3.0s Timer   ┌──────────────────┐  Both Rifts Dead  ┌──────────────────┐
│  Phase 0:        ├──────────────►│  Phase 1:        ├──────────────────►│  Phase 2:        │
│  INCURSION       │               │  PHASE_1_SHIELD  │                   │  PHASE_2_HULL    │
│  Warning Banner  │               │  Sovereign Invul │                   │  Hull (2500 HP)  │
└──────────────────┘               └──────────────────┘                   └─────────┬────────┘
                                                                                    │ Hull <= 0
                                                                                    ▼
┌──────────────────┐   Core <= 0   ┌──────────────────┐  35.0s Enrage     ┌──────────────────┐
│  Phase 4:        │◄──────────────┤  Phase 3:        │◄──────────────────┤  Singularity     │
│  DEFEATED        │               │  PHASE_3_CORE    │   Accelerated     │  Overdrive       │
│  Implosion/Bonus │               │  Core (1500 HP)  │   Attacks (1.4s)  │  Enrage Clock    │
└──────────────────┘               └──────────────────┘                   └──────────────────┘
```

#### Phase 0: INCURSION (3.0s Warning)
- Duration: 3.0s countdown (`warningTimer = 3.0`).
- Canvas Render: Radial purple vignette (`rgba(147, 51, 234, 0.4)`), screen glitch distortion, center warning box (`⚠ INCOMING END-GAME CRISIS ⚠`), and countdown toast (`WARP CONVERGENCE IN: Xs`).
- Sovereign and Rifts pre-spawned and positioned.
- When `warningTimer <= 0`, transitions to `PHASE_1_SHIELD`.

#### Phase 1: PHASE_1_SHIELD (1,200 Anchor EHP, Sovereign 100% Invulnerable)
- 2 Flanking Rifts (80x80px) active at `(50, 170)` and `(logicalWidth - 130, 170)`, each with 600 HP.
- Sovereign `isInvulnerable = true`. A rotating hexagonal deflection barrier (`drawHexDeflectorBarrier()`) deflects all player bullets (0 damage, barrier flash, bullet destroyed).
- Anchor Archetype Mechanics:
  - `VOID_SOVEREIGN`: Singularity gravitational vortex (radius 240, force 45) actively pulls player position and bends player bullet trajectories toward rift centers.
  - `ABYSSAL_LEVIATHAN`: Bio-Brood Sacks emit toxic spore spitters toward player every 2.8s.
  - `CYBERNETIC_EXTERMINATOR`: EMP Laser Pylons charge and fire red shock rail bolts every 3.2s.
- Transition: When both anchors reach 0 HP (`isDead = true`), shields collapse (`playShieldBreak()`), and immediate transition to `PHASE_2_HULL` occurs.

#### Phase 2: PHASE_2_HULL (2,500 Hull HP)
- Sovereign `isInvulnerable = false`. Player bullets deal direct damage to the 2,500 HP hull.
- Sovereign floats with sinusoidal horizontal sweeping (amplitude 30px, speed 0.8) and tracks player with its central eye/optic.
- Archetypal super-weapons fire every 2.2s:
  - `VOID_SOVEREIGN`: 5-way dark matter bolt fan (`#c084fc`, speed 220) + flanking wing bolts (`#38bdf8`, speed 250).
  - `ABYSSAL_LEVIATHAN`: 6-spore rotating spiral emission (`#84cc16`, speed 190).
  - `CYBERNETIC_EXTERMINATOR`: Dual heavy railgun beams (`#ef4444`, speed 380, damage 2) + aimed center cluster bullet (`#06b6d4`, speed 280).
- Transition: When `hullHp <= 0`, Sovereign immediately transitions to `PHASE_3_CORE`.

#### Phase 3: PHASE_3_CORE (1,500 Core HP, 35.0s Enrage Clock)
- Sovereign central core exposed (1,500 HP).
- Enrage countdown: `enrageTimer = 35.0`. If timer reaches 0, reality distortion spikes to 1.0 (`realityDistortionLevel = 1.0`).
- Movement dynamics escalate: sweep amplitude increases from 30px to 45px, sweep speed increases from 0.8 to 1.4.
- Combat cadence accelerates: attack interval drops from 2.2s to 1.4s.
- Visuals: Pulsating crimson/orange cosmic distortion aura around core.
- Transition: When `coreHp <= 0`, Sovereign reaches 0 HP and transitions to `DEFEATED`.

#### Phase 4: DEFEATED (Cataclysmic Resolution)
- Cataclysm explosion: 40 multi-colored particles burst from core center.
- `isActive = false`, `isDead = true`.
- Victory audio triggers: `soundManager.playSingularityCollapse()`, `soundManager.playVictory()`.
- GameManager awards: **+2,000 score** and **+500 currency**.
- Soft-lock prevention: `isEndGameCrisisEngaged = false` allows wave progression to transition cleanly to `GameState.SHOP`.

---

## 3. Specification to DOUBLE End-Game Crisis Types (3 -> 6)

To double the current number of distinct End-Game Crisis types, 3 entirely new archetypes are specified. Each archetype introduces brand-new mechanics, distinct vector art silhouettes, bespoke color palettes, unique Phase 1 anchor behaviors, and tailored player counterplay.

```
Existing (3):
  1. VOID_SOVEREIGN
  2. ABYSSAL_LEVIATHAN
  3. CYBERNETIC_EXTERMINATOR

New (3) — Doubling to 6:
  4. CHRONO_DEVOURER       (Temporal Paradox / Chrono-Anchors / Time-Dilation / Afterimages)
  5. SOLARIS_COLOSSUS      (Stellar Hypergiant / Prominence Pillars / Coronal Ejection / Heatwaves)
  6. NEBULA_PHANTASM       (Quantum Spectral Swarm / Entangled Pods / Phased Decoys / Homing Wisps)
```

---

### 3.1 Archetype 4: `CHRONO_DEVOURER` ("THE CHRONO DEVOURER — TEMPORAL PARADOX HARBINGER")

#### Concept & Narrative
An ancient temporal leviathan that feeds on spacetime continuum lines. It bends the flow of battle, manipulating projectile velocities, creating delayed afterimage echoes, and casting chronal shockwaves that alter player maneuverability.

#### Identifiers & Balance Config
- **Enum Key**: `CrisisArchetype.CHRONO_DEVOURER`
- **Title**: `✦ THE CHRONO DEVOURER ✦`
- **Subtitle**: `TEMPORAL PARADOX HARBINGER`
- **Health Pool**: 600 HP (Left Tachyon Monolith) + 600 HP (Right Tachyon Monolith) + 2,500 HP (Chrono Hull) + 1,500 HP (Paradox Core) = **5,200 EHP**.
- **Colors**: Primary: Amber Gold (`#fbbf24`), Secondary: Deep Bronze (`#78350f`), Accent: Celestial Topaz (`#fef08a`), Glow: Tachyon Shimmer (`#f59e0b`).

#### Phase 1: Tachyon Monolith Anchors
- **Visuals**: Two floating golden obelisks etched with glowing chronal runes and counter-rotating golden gears.
- **Behavior**: Every 2.5s, the Monoliths pulse a **Tachyon Surge**:
  - Left Monolith emits 3 accelerating tachyon needles that start slow (speed 80) and accelerate exponentially to 350.
  - Right Monolith emits a chronological distortion radius (200px) that slows passing player bullets by 50% while accelerating within the field.
- **Counterplay**: Shift to the opposite side of the screen when needles fire; lead shots ahead of the slow field to hit the monoliths.

#### Phase 2: Hull Mechanics — Time-Dilation Waves & Afterimage Echoes
- **Attack 1 — Tachyon Lance Fan (`CrisisAttackType.TACHYON_LANCE`)**:
  - 5 needle-thin golden laser telegraph lines trace downward from the Sovereign's temporal astrolabe.
  - After 0.7s, they flash into high-velocity piercing beams (speed 420, damage 1).
- **Attack 2 — Paradox Afterimage Echo (`CrisisAttackType.TEMPORAL_BURST`)**:
  - The boss leaves a translucent golden ghost silhouette at its current position.
  - 1.5 seconds later, the ghost repeats the previous attack volley from that past coordinate.
- **Counterplay**: Remember past boss coordinates to anticipate afterimage volley origins; weave between the narrow lance beams.

#### Phase 3: Singularity Core — Paradox Cascade
- **Attack — Chrono-Implosion**:
  - The Paradox Core charges an amber ring that expands to screen edges, freezes for 0.4s, and rapidly implodes back into the core, pulling the player ship inward unless actively thrusting away.
- **Enrage Threat (35s clock)**:
  - Enrage causes continuous time-dilation flickering, forcing 1.2s rapid-fire lance bursts.

#### Visual Vector Art Hull Geometry
- **Silhouette**: Astrolabe-shaped dreadnought with 3 concentric rotating brass gear rings, stepped pyramid pylons on each wing, and a central glowing golden pendulum optic.
- **Audio Cues**: Clockwork clicking, reverse whooshes (`osc.frequency` sweeping upward while amplitude fades), resonant bronze bell chimes.

---

### 3.2 Archetype 5: `SOLARIS_COLOSSUS` ("SOLARIS COLOSSUS — STELLAR HYPERGIANT DREADNOUGHT")

#### Concept & Narrative
A star-forged mechanical juggernaut powered by a miniature artificial sun. It dominates the arena with radiant heatwaves, blistering plasma columns, and explosive coronal mass ejections that deny horizontal space.

#### Identifiers & Balance Config
- **Enum Key**: `CrisisArchetype.SOLARIS_COLOSSUS`
- **Title**: `✦ SOLARIS COLOSSUS ✦`
- **Subtitle**: `STELLAR HYPERGIANT DREADNOUGHT`
- **Health Pool**: 600 HP (Left Prominence Pillar) + 600 HP (Right Prominence Pillar) + 2,500 HP (Thermonuclear Hull) + 1,500 HP (Supernova Core) = **5,200 EHP**.
- **Colors**: Primary: Radiant Orange (`#f97316`), Secondary: Obsidian Basalt (`#451a03`), Accent: Solar Flare Crimson (`#ef4444`), Glow: Incandescent White-Yellow (`#fef08a`).

#### Phase 1: Prominence Pillar Anchors
- **Visuals**: Two cylindrical fusion conduits erupting continuous flame plumes and orbiting ember particles.
- **Behavior**:
  - Every 3.0s, the pillars project a horizontal **Thermal Tripwire Conduit** between left and right pillars, forcing the player to duck beneath the beam before it ignites.
  - Periodic bursting fires 4 arcing incendiary sparks per pillar that arc outward and down.
- **Counterplay**: Maintain vertical clearance under the tripwire line; focus fire on one pillar to break the circuit and disable the tripwire early.

#### Phase 2: Hull Mechanics — Coronal Mass Ejection (CME)
- **Attack 1 — Coronal Mass Ejection (`CrisisAttackType.CORONAL_MASS_EJECTION`)**:
  - Launches 3 superheated plasma balls toward the bottom player baseline.
  - Upon impact with the bottom screen edge, they create 80px wide lingering thermal fire zones for 2.0s.
- **Attack 2 — Prominence Sweep (`CrisisAttackType.PROMINENCE_SWEEP`)**:
  - Sweeps a vertical 60px wide plasma beam across 1/3 of the screen width, preceded by an orange telegraph warning line.
- **Counterplay**: Bait CME magma shots to the outer boundaries, keeping the central channel clear; use indestructible barricades as thermal shields against sweeping beams.

#### Phase 3: Singularity Core — Supernova Fusion Overdrive
- **Attack — Stellar Flare Spiral**:
  - Central fusion furnace discharges an 8-way rotating incendiary starburst while emitting screen-wide thermal ripple distortion.
- **Enrage Threat (35s clock)**:
  - The furnace glows white-hot; twin continuous prominence beams flank the boss, restricting player movement to a narrow central dodge channel.

#### Visual Vector Art Hull Geometry
- **Silhouette**: Heavy chevron juggernaut with flared thermal radiator wings, exhaust vents glowing with animated orange flame gradients, and a central fusion furnace eye crowned with solar corona horns.
- **Audio Cues**: Roaring thermonuclear furnace hum, crackling fire bursts, ascending plasma sizzles.

---

### 3.3 Archetype 6: `NEBULA_PHANTASM` ("THE NEBULA PHANTASM — QUANTUM SPECTRAL SWARM")

#### Concept & Narrative
An extra-galactic entity comprised of semi-solid dark matter and quantum mist. It phases between reality states, projecting holographic decoys, cloaking its hull, and deploying curving spectral wisps that home in on the player.

#### Identifiers & Balance Config
- **Enum Key**: `CrisisArchetype.NEBULA_PHANTASM`
- **Title**: `✦ THE NEBULA PHANTASM ✦`
- **Subtitle**: `QUANTUM SPECTRAL SWARM`
- **Health Pool**: 600 HP (Left Quantum Pod) + 600 HP (Right Quantum Pod) + 2,500 HP (Spectral Hull) + 1,500 HP (Dark Matter Core) = **5,200 EHP**.
- **Colors**: Primary: Spectral Indigo (`#6366f1`), Secondary: Deep Void Navy (`#0f172a`), Accent: Bioluminescent Cyan (`#06b6d4`), Glow: Phantom Magenta (`#d946ef`).

#### Phase 1: Entangled Quantum Pod Anchors
- **Visuals**: Translucent crystalline cocoons surrounded by mist motes that alternate between visible and phase-shifted transparency.
- **Behavior**:
  - The two pods are **Quantum Entangled**: every 4.0s, one pod shines brightly (Coherent Phase) while the other dims (Shifted Phase).
  - Damaging the Coherent pod deals 100% damage. Damaging the Shifted pod deals 20% damage and reflects a dark-energy counter-shard at the player.
  - Pods fire undulating spectral needles that sway in sine waves toward the player.
- **Counterplay**: Track the glowing Coherent pod and concentrate fire; avoid spraying bullets into the Shifted pod.

#### Phase 2: Hull Mechanics — Holographic Decoys & Phase Shift
- **Attack 1 — Quantum Mirage (`CrisisAttackType.QUANTUM_MIRAGE_NOVA`)**:
  - The Sovereign splits visually into 3 entities (1 true Sovereign + 2 translucent mirages).
  - All 3 move together in synchronized hover patterns.
  - Striking a mirage destroys the mirage in a cyan smoke puff without damaging the main hull. Striking the true Sovereign deals full damage and dispels mirages for 4.0s.
- **Attack 2 — Spectral Homing Wisps (`CrisisAttackType.SPECTRAL_PHANTOM_WISP`)**:
  - Launches 4 slow, undulating spectral wisps (`#06b6d4`, speed 140) that curve their trajectory toward the player's position over 3.0s.
- **Counterplay**: Identify the true Sovereign by its vibrant core eye and opaque armor; shoot approaching wisps with interceptable bullets or barricades.

#### Phase 3: Singularity Core — Dimensional Shroud Overdrive
- **Attack — Nebula Nova Curtain**:
  - Emits a dense 360-degree curtain of alternating indigo and cyan needle darts while drifting silently across the ceiling.
- **Enrage Threat (35s clock)**:
  - Dimensional shroud darkens the screen backdrop; spectral wisps spawn every 1.2s, creating a high-stress evasion gauntlet.

#### Visual Vector Art Hull Geometry
- **Silhouette**: Ghostly phantom manta-ray silhouette with semi-translucent trailing mist tendrils, layered refractive armor plates, and a haunting triple-pupil spectral optic.
- **Audio Cues**: Ethereal harmonic choir hums, glass-like phase shimmer sounds, whispering wind echoes.

---

## 4. Code Integration Architecture

The following table maps the exact integration touchpoints required to implement the 3 new End-Game Crisis archetypes:

```
┌──────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Source File                          │ Integration Scope & Modifications                           │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ src/game/crisis/types.ts             │ 1. Expand CrisisArchetype enum with 3 new members:          │
│                                      │    CHRONO_DEVOURER, SOLARIS_COLOSSUS, NEBULA_PHANTASM       │
│                                      │ 2. Expand CrisisAttackType with 6 new attack identifiers:   │
│                                      │    TACHYON_LANCE, TEMPORAL_BURST,                           │
│                                      │    CORONAL_MASS_EJECTION, PROMINENCE_SWEEP,                 │
│                                      │    SPECTRAL_PHANTOM_WISP, QUANTUM_MIRAGE_NOVA               │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ src/game/crisis/CrisisSovereign.ts   │ 1. setupArchetypeColors(): Add color mappings for 3 new     │
│                                      │    archetypes (#fbbf24, #f97316, #6366f1)                   │
│                                      │ 2. draw(): Add cases to invoke:                             │
│                                      │    - drawChronoDevourer(ctx)                                │
│                                      │    - drawSolarisColossus(ctx)                               │
│                                      │    - drawNebulaPhantasm(ctx)                                │
│                                      │ 3. drawBossHUD(): Add title, subtitle, and color schemes    │
│                                      │    for all 3 new archetypes                                 │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ src/game/crisis/DimensionalRift.ts   │ 1. constructor: Initialize colors and particle hue palettes │
│                                      │    for Chrono Monoliths, Prominence Pillars, Quantum Pods   │
│                                      │ 2. update(): Implement archetype-specific Phase 1 attacks: │
│                                      │    - Chrono: accelerating tachyon needles                   │
│                                      │    - Solaris: thermal sparks and tripwire checks            │
│                                      │    - Nebula: undulating spectral needles                    │
│                                      │ 3. draw(): Render procedural visuals:                      │
│                                      │    - Chrono: golden clockwork runic obelisk                 │
│                                      │    - Solaris: burning pillar with flame crest               │
│                                      │    - Nebula: refractive phased crystal pod                  │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ src/game/crisis/EndGameCrisis.ts     │ 1. startIncursion(): Include all 6 archetypes in random     │
│                                      │    selection array                                          │
│                                      │ 2. getArchetypeTitle(): Exhaustive title string mappings    │
│                                      │ 3. executeArchetypeAttack(): Add attack pattern logic for   │
│                                      │    CHRONO_DEVOURER, SOLARIS_COLOSSUS, NEBULA_PHANTASM       │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ src/game/GameManager.ts              │ 1. spawnWave(): Random crisis selection picks from all 6    │
│                                      │ 2. triggerEndGameCrisis(archetype?): Accepts all 6          │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ src/components/game-canvas.tsx       │ 1. Dynamic banner and active badge styling with distinct    │
│                                      │    color classes and archetype icons (⏳, ☀️, 🔮)           │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ scripts/simulate_balance.ts          │ 1. Update SimulatedCrisisArchetype union to 6 members        │
│                                      │ 2. Update Monte Carlo simulation loop for all 6 archetypes  │
└──────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 5. Automated Test Strategy

To verify with complete mathematical rigor and software integrity that the distinct End-Game Crisis types have doubled and each functions properly, the automated test strategy spans 7 structured test tiers:

### 5.1 Test Tier 1: Enum Contract & Count Verification
- **Target**: `tests/unit/endgame_crisis_variety.test.ts` (or `tests/unit/crisis_types.test.ts`)
- **Assertions**:
  - `Object.keys(CrisisArchetype).length === 6` (doubled from original 3).
  - Explicit checks:
    ```ts
    expect(CrisisArchetype.VOID_SOVEREIGN).toBe('VOID_SOVEREIGN');
    expect(CrisisArchetype.ABYSSAL_LEVIATHAN).toBe('ABYSSAL_LEVIATHAN');
    expect(CrisisArchetype.CYBERNETIC_EXTERMINATOR).toBe('CYBERNETIC_EXTERMINATOR');
    expect(CrisisArchetype.CHRONO_DEVOURER).toBe('CHRONO_DEVOURER');
    expect(CrisisArchetype.SOLARIS_COLOSSUS).toBe('SOLARIS_COLOSSUS');
    expect(CrisisArchetype.NEBULA_PHANTASM).toBe('NEBULA_PHANTASM');
    ```

### 5.2 Test Tier 2: Entity Instantiation & Archetype Diversity
- **Target**: `tests/unit/endgame_crisis_variety.test.ts`
- **Assertions**:
  - Loop across all 6 archetypes:
    - `crisis.startIncursion(arch)` correctly sets `crisis.archetype = arch`.
    - `crisis.sovereign` is constructed with 260x130 dimensions, 2,500 maxHullHp, 1,500 maxCoreHp, 4,000 maxHp.
    - `crisis.riftAnchors.length === 2`, each with 600 maxHp and 600 hp.
    - Total encounter EHP strictly equals 5,200 EHP across all 6 archetypes.
    - Banner text contains the expected title string for each archetype.

### 5.3 Test Tier 3: Phase 1 Shield Invulnerability Contract
- **Target**: `tests/unit/endgame_crisis_variety.test.ts`
- **Assertions**:
  - For each of the 6 archetypes:
    - Fast-forward incursion warning (3.0s).
    - Sovereign `takeDamage(500)` returns `0` damage while anchors are alive; sovereign HP remains at 4,000 HP.
    - Anchor 1 takes 600 damage -> dies; Sovereign remains invulnerable.
    - Anchor 2 takes 600 damage -> dies; both anchors are dead.
    - `crisis.update(0.1)` triggers automatic transition from `PHASE_1_SHIELD` to `PHASE_2_HULL`.
    - Sovereign `isInvulnerable` transitions to `false`.
    - Now Sovereign `takeDamage(200)` deals exactly 200 damage to hull.

### 5.4 Test Tier 4: Phase 2 Hull & Phase 3 Core Enrage Transitions
- **Target**: `tests/unit/endgame_crisis_variety.test.ts`
- **Assertions**:
  - For each of the 6 archetypes:
    - Damage hull by 2,500 -> triggers transition to `PHASE_3_CORE`.
    - Sovereign `hullHp === 0`, `coreHp === 1500`, `hp === 1500`.
    - `enrageTimer === 35.0`.
    - Update by 36.0s -> `enrageTimer === 0` and `realityDistortionLevel === 1.0`.
    - Damage core by 1,500 -> triggers transition to `DEFEATED`.

### 5.5 Test Tier 5: Unique Attack Pattern Bullet Emission
- **Target**: `tests/unit/endgame_crisis_variety.test.ts`
- **Assertions**:
  - For each archetype, trigger `executeArchetypeAttack()`:
    - `VOID_SOVEREIGN`: Spawns 7 bullets (5-way spread + 2 wing bolts), color `#c084fc` / `#38bdf8`.
    - `ABYSSAL_LEVIATHAN`: Spawns 6 spiral spore bullets, color `#84cc16`.
    - `CYBERNETIC_EXTERMINATOR`: Spawns 3 bullets (2 high-speed railguns + 1 aimed cluster), color `#ef4444` / `#06b6d4`.
    - `CHRONO_DEVOURER`: Spawns 5 tachyon lance bullets (`#fbbf24`) with high velocity.
    - `SOLARIS_COLOSSUS`: Spawns 3 coronal flare projectiles (`#f97316`) and 2 prominence beams.
    - `NEBULA_PHANTASM`: Spawns 4 homing spectral wisps (`#06b6d4`, `#6366f1`) with curved trajectory math.

### 5.6 Test Tier 6: Canvas 2D Vector Rendering Sanity
- **Target**: `tests/unit/endgame_crisis_variety.test.ts`
- **Assertions**:
  - Mock Canvas 2D context passed to `draw()` across all 6 archetypes across all 5 phases (`INCURSION`, `PHASE_1_SHIELD`, `PHASE_2_HULL`, `PHASE_3_CORE`, `DEFEATED`).
  - Asserts 0 thrown runtime exceptions, proving procedural vector paths, bezier curves, radial gradients, and HUD bars render seamlessly.

### 5.7 Test Tier 7: E2E Playwright Browser Tests & Build Verification
- **Execution Commands**:
  - Unit tests: `SKIP_WEBSERVER=1 npx playwright test tests/unit/endgame_crisis_variety.test.ts`
  - Full test suite: `npx playwright test`
  - TypeScript & Next.js production build: `npm run build`

---

## 6. Implementation Readiness Checklist

When user approval is provided to implement this specification:
- [ ] Update `src/game/crisis/types.ts`: Add `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, `NEBULA_PHANTASM` to `CrisisArchetype` and add new `CrisisAttackType`s.
- [ ] Update `src/game/crisis/CrisisSovereign.ts`: Add vector draw routines (`drawChronoDevourer`, `drawSolarisColossus`, `drawNebulaPhantasm`), HUD formatting, and color palettes.
- [ ] Update `src/game/crisis/DimensionalRift.ts`: Add anchor mechanics, particle orbits, and draw logic for Tachyon Monoliths, Prominence Pillars, and Quantum Pods.
- [ ] Update `src/game/crisis/EndGameCrisis.ts`: Expand attack dispatcher, incursion pool, and title mappings.
- [ ] Update `src/game/GameManager.ts`: Ensure random selection and trigger hooks support all 6 archetypes.
- [ ] Update `src/components/game-canvas.tsx`: Enhance warning banners and active badges with archetype-specific badges.
- [ ] Create `tests/unit/endgame_crisis_variety.test.ts`: Implement comprehensive 7-tier test coverage.
- [ ] Run `npm run build` and `npx playwright test` to verify 100% pass rate.

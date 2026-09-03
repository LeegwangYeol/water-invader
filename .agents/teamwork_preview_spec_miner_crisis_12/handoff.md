# End-Game Crisis 12-Archetype Expansion Specification & Game Design Blueprint

**Author**: Grand Strategy Crisis Designer & Specification Miner  
**Target Milestone**: 12-Crisis Expansion  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_12`  
**Workspace**: `/Users/user/src/water-invader`  

---

## 1. Observation

Direct code inspection of the Water Invader crisis subsystem revealed the following exact interfaces, balance contracts, and test structures:

1. **Crisis Archetypes Enumeration & Configuration (`src/game/crisis/types.ts:6-13, 140-225`)**:
   - `CrisisArchetype` currently defines 6 archetypes:
     ```typescript
     export enum CrisisArchetype {
       VOID_SOVEREIGN = 'VOID_SOVEREIGN',
       ABYSSAL_LEVIATHAN = 'ABYSSAL_LEVIATHAN',
       CYBERNETIC_EXTERMINATOR = 'CYBERNETIC_EXTERMINATOR',
       CHRONO_DEVOURER = 'CHRONO_DEVOURER',
       SOLARIS_COLOSSUS = 'SOLARIS_COLOSSUS',
       NEBULA_PHANTASM = 'NEBULA_PHANTASM',
     }
     ```
   - Each archetype maps to a `CrisisArchetypeConfig` specifying: `name`, `subtitle`, `riftHp: 600`, `sovereignHullHp: 2500`, `coreHp: 1500`, `primaryColor`, `secondaryColor`, `accentColor`, `coreGlowColor`, `enrageTime: 35.0`, `vortexStrength`, and `baseFireRate`.

2. **Strict 5,200 EHP Encounter Invariant (`src/game/crisis/types.ts:140-225`, `src/game/crisis/EndGameCrisis.ts:86-95`)**:
   - Total boss encounter effective hitpoints (EHP) is exactly **5,200 EHP** across 3 discrete combat phases:
     - **Phase 1 (Shield / Anchors)**: 2 Flanking Dimensional Rift Anchors @ 600 HP each = **1,200 EHP** (Sovereign is invulnerable).
     - **Phase 2 (Hull)**: Crisis Sovereign Hull = **2,500 EHP**.
     - **Phase 3 (Core & Enrage)**: Exposed Sovereign Core = **1,500 EHP** with an active **35.0-second enrage countdown**.
     - Calculation: $1,200 + 2,500 + 1,500 = 5,200$ EHP.

3. **Incursion Roll & Selection Logic (`src/game/crisis/EndGameCrisis.ts:65-74`)**:
   - Currently selects from a hardcoded 6-element array when `archetype` is not explicitly passed:
     ```typescript
     const archetypes = [
       CrisisArchetype.VOID_SOVEREIGN,
       CrisisArchetype.ABYSSAL_LEVIATHAN,
       CrisisArchetype.CYBERNETIC_EXTERMINATOR,
       CrisisArchetype.CHRONO_DEVOURER,
       CrisisArchetype.SOLARIS_COLOSSUS,
       CrisisArchetype.NEBULA_PHANTASM,
     ];
     this.archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
     ```

4. **Anchor & Entity Rendering Lifecycle (`src/game/crisis/DimensionalRift.ts:41-86`, `src/game/crisis/CrisisSovereign.ts:69-90, 209-242`)**:
   - Anchors are instantiated at flanking coordinates ($x_1=50, y_1=170$ and $x_2=\text{logicalWidth}-130, y_2=170$, size 80x80px).
   - Sovereign occupies top-center ($x=\frac{\text{logicalWidth}-260}{2}, y=65$, size 260x130px).
   - Pure Canvas 2D vector drawing pipeline renders distinct silhouettes, glowing radial underlays, and procedural particle orbits.

5. **Test Assertions on Archetype Count (`tests/unit/crisis_doubling.test.ts:64-65`, `tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts:356-357`)**:
   - `expect(Object.keys(CrisisArchetype).length).toBe(6);`
   - `expect(allArchetypes.length).toBe(6);`
   - These test assertions verify enum counts and must be updated to expect 12 when expanding the roster.

---

## 2. Logic Chain

1. **Expansion Goal**: The user request specifies doubling the End-Game Crisis roster from 6 to 12 distinct archetypes, inspired by grand strategy and epic sci-fi tropes (e.g. Stellaris crises: Prethoryn Biomorphic Swarm, Contingency AI Singularity, Unbidden Energy Entity, Grey Tempest Nanites, Cetana Synthetic Queen, Void Dragon Astral Devourer, Psionic Shroud, Singularity Gravity Collapse, etc.).
2. **Orthogonality & Zero Collision**: To ensure variety and eliminate mechanical redundancy, each of the 6 new archetypes must occupy an unfilled aesthetic, mechanical, and hazard niche:
   - `VOID_SOVEREIGN` = Dimensional Void / Dark Matter
   - `ABYSSAL_LEVIATHAN` = Deep Ocean Bio-Colossus
   - `CYBERNETIC_EXTERMINATOR` = Synthetic Mech Exterminator
   - `CHRONO_DEVOURER` = Temporal Dilation / Paradox
   - `SOLARIS_COLOSSUS` = Nuclear Fusion / Solar Prominence
   - `NEBULA_PHANTASM` = Quantum Mirage / Spectral Phase
   - **New 7**: `BIOMORPHIC_SWARM` = Extragalactic Flesh-Hive / Chitin Parasite Swarm
   - **New 8**: `SINGULARITY_CORE` = Supermassive Black Hole / Polarized Gravity Collapse
   - **New 9**: `NANITE_HARVESTER` = Grey-Goo Molecular Disassembly / Self-Replicating Tessellation
   - **New 10**: `PSIONIC_SHROUD` = Astral Entity / Psychic Illusions & Sanity Distortion
   - **New 11**: `GLACIAL_OBLIVION` = Absolute Zero Entropy / Cryo-Armor & Frostbite Zone
   - **New 12**: `COSMIC_DEVOURER` = Astral Void Dragon / Solar Siphon Maw & Dark Plasma Breath
3. **Equitable Encounter Balance (5,200 EHP Invariant)**:
   - All 6 new archetypes strictly conform to the 5,200 EHP formula ($1,200 + 2,500 + 1,500$) with a 35.0-second Phase 3 enrage timer, preserving exact game pacing, scoring balance, and progression difficulty.
4. **Uniform Distribution (1/12 = 8.333% probability)**:
   - Expanding the incursion selection array in `EndGameCrisis.startIncursion()` to include all 12 enum members guarantees an exact, unbiased uniform probability of $1/12 \approx 8.333\%$ for each archetype.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| F1 | Architecture | `CrisisArchetype` Enum Expansion (6 -> 12) | Expand enum with 6 new distinct archetypes (`BIOMORPHIC_SWARM`, `SINGULARITY_CORE`, `NANITE_HARVESTER`, `PSIONIC_SHROUD`, `GLACIAL_OBLIVION`, `COSMIC_DEVOURER`) | TS Enum definition | 12 unique archetype string literals | Missing case throws TS error in exhaustive switch | `src/game/crisis/types.ts:6-13` |
| F2 | Balance | Strict 5,200 EHP Invariant Across 12 Archetypes | Maintain identical EHP distribution: 2 Anchors @ 600 HP (1,200), Sovereign Hull 2,500 HP, Core 1,500 HP | `CRISIS_ARCHETYPE_CONFIGS` entry per archetype | Total EHP strictly equals 5,200 | Asserted in tests; mismatch fails `CRISIS-02` | `src/game/crisis/types.ts:140-225` |
| F3 | State Machine | 5-Phase Lifecycle Contract | Sequential progression: INCURSION (3.0s warning) -> PHASE_1_SHIELD -> PHASE_2_HULL -> PHASE_3_CORE (35s enrage) -> DEFEATED | Delta time, player bullets, entity HP | State updates & UI callbacks | Handled safely via `transitionToPhase()` | `src/game/crisis/EndGameCrisis.ts:25-30` |
| F4 | Mechanics | Bespoke Phase 1 Anchor Systems | Differentiated Phase 1 behaviors: Hatchery Sacs, Gravitational Dampeners, Nanite Fabricators, Psionic Beacons, Cryo-Condensers, Astral Siphon Maws | `DimensionalRift.update(deltaTime, player, bullets)` | Bullets spawned, field effects | Null entity safety guards | `src/game/crisis/DimensionalRift.ts:160-290` |
| F5 | Combat | Archetypal Phase 2 & Phase 3 Attacks | Unique bullet spreads, laser sweeps, accelerating projectiles, and desperation barrages per archetype | `executeArchetypeAttack(player, bullets)` | Injected enemy projectiles | Empty array if sovereign is dead | `src/game/crisis/EndGameCrisis.ts:329-545` |
| F6 | Environmental | Unique Hazards & Arena Fields | Dynamic area-denial: creeping bio-spores, polarized gravity shear, molecular decay mist, phantom mirage cloaking, permafrost slow zones, solar wind flares | Environmental updates during tick | Player velocity offsets, status effects | Bounded to logical canvas bounds (600x800) | `src/game/crisis/EndGameCrisis.ts:270-305` |
| F7 | Visuals | Vector Art Silhouettes & Color Themes | Canvas 2D procedural path drawing for each boss hull, engine glows, hex-shields, and distinctive warning banners | Canvas context, coordinates, flash state | High-contrast vector render | Wrapped in `ctx.save()` / `ctx.restore()` | `src/game/crisis/CrisisSovereign.ts:209-242` |
| F8 | Probability | Uniform 1/12 Random Roll | Incursion selection picks uniformly from an array of all 12 archetypes ($P=1/12 \approx 8.333\%$) | `startIncursion()` with undefined archetype | Selected random `CrisisArchetype` | Defaults to random roll if invalid | `src/game/crisis/EndGameCrisis.ts:65-74` |
| F9 | Testing Hook | Deterministic Trigger Hook | `GameManager.triggerEndGameCrisis(archetype?: CrisisArchetype)` allows deterministic E2E testing for all 12 archetypes | Archetype enum or string parameter | Activated `EndGameCrisis` instance | Graceful fallback to random if omitted | `src/game/GameManager.ts:318-354` |
| F10 | Verification | Automated Test Hardening | Playwright unit and stress tests verifying enum counts, EHP invariants, phase transitions, and visual rendering across all 12 archetypes | Test runners (`npx playwright test`) | Green test suite (0 errors) | Test failure terminates pipeline | `tests/unit/crisis_doubling.test.ts` |

---

## 4. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| EC1 | Random Roll Mapping | `Math.floor(Math.random() * 12)` | Evaluates strictly to integers 0 through 11. Boundary values 0.000 (Index 0: `VOID_SOVEREIGN`) and 0.9999 (Index 11: `COSMIC_DEVOURER`) map correctly without out-of-bounds undefined errors. |
| EC2 | Deterministic Test Invocations | String literal passed to `triggerEndGameCrisis('BIOMORPHIC_SWARM' as CrisisArchetype)` | TypeScript enum matching string value enables both programmatic enum access and string-based E2E Playwright test triggers without type mismatch. |
| EC3 | Phase 1 Shield Invulnerability | Player fires high-damage projectile (e.g. 500 dmg) directly at Sovereign during Phase 1 | `sovereign.takeDamage()` returns 0, flashes hex-shield (`shieldFlashTimer = 0.12`), and hull HP remains unchanged at 2,500 HP until both anchors are eliminated. |
| EC4 | Simultaneous Anchor Destruction | Both flanking anchors reduced to 0 HP on the exact same frame tick | Loop handles anchor 0 death, updates count, handles anchor 1 death; active count reaches 0, cleanly triggering `transitionToPhase(CrisisPhase.PHASE_2_HULL)`. |
| EC5 | Hull Overflow Protection | Player deals 800 damage to Sovereign Hull when hull only has 200 HP remaining | `actualDmg = Math.min(this.hullHp, amount)` deals exactly 200 damage, clamps `hullHp` to 0, transitions to `PHASE_3_CORE`, leaving full 1,500 Core HP intact. |
| EC6 | Enrage Clock Expiry | Phase 3 Core combat exceeds 35.0 seconds | `enrageTimer` reaches 0.0, sets `realityDistortionLevel = 1.0`, triggers continuous crisis alarm audio, and activates hyper-dense desperation bullet hell. |
| EC7 | Polarized Gravity Calculation | Player ship positioned exactly equidistant between Left (pull) and Right (push) anchors of `SINGULARITY_CORE` | Forces cancel out ($+50 + (-50) = 0$), resulting in zero net lateral drift at the exact center line ($x=300$). |
| EC8 | Nanite Fabricator Mutual Healing | One Nanite Fabricator at 100 HP while the other is undamaged | Damaged fabricator receives healing only if second fabricator is alive; if player destroys one fabricator, mutual healing immediately terminates. |
| EC9 | Psionic Mirage Detection | Player bullet collides with Psionic Shroud "Phantom Mirage Decoy" | Bullet passes through decoy or dissipates decoy with 0 score/damage, maintaining visual distinction between real threats and psychic illusions. |
| EC10 | Glacial Permafrost Slow Stacking | Player ship enters Glacial Oblivion frostbite zone while having speed upgrades | Speed multiplier (0.80x) applies multiplicatively to base speed; does not clip or overflow minimum movement bounds. |

---

## 5. Comprehensive Roster: The 12 End-Game Crises

| # | Archetype Enum | Title & Subtitle | Visual Palette | Anchor Mechanics (Phase 1) | Boss Attacks (Phase 2 & 3) | Unique Environmental Hazard |
|---|----------------|------------------|----------------|----------------------------|----------------------------|----------------------------|
| 1 | `VOID_SOVEREIGN` | THE VOID SOVEREIGN<br>*Extra-Dimensional Cataclysm* | Primary: `#c084fc`<br>Sec: `#1e1b4b`<br>Accent: `#38bdf8` | Singularity Rifts (2x 600 HP)<br>Gravitational pull on player & shots | 5-way dark matter spread, flanking wing bolts, Void Nova (Phase 3) | Central gravitational vortex bending player trajectories |
| 2 | `ABYSSAL_LEVIATHAN` | THE ABYSSAL LEVIATHAN<br>*Corrupted Bio-Swarm Horror* | Primary: `#10b981`<br>Sec: `#022c22`<br>Accent: `#84cc16` | Bio-Brood Sacks (2x 600 HP)<br>Spawns toxic acid spitters | Spore spiral, acidic barrage, bio-larvae swarm (Phase 3) | Acid mist puddles restricting vertical movement |
| 3 | `CYBERNETIC_EXTERMINATOR` | CYBERNETIC EXTERMINATOR MATRIX<br>*Purification Dreadnought Protocol* | Primary: `#ef4444`<br>Sec: `#0f172a`<br>Accent: `#06b6d4` | EMP Laser Pylons (2x 600 HP)<br>Charges high-speed shock rail bolts | High-velocity twin railguns, aimed center cluster, EMP cascade (Phase 3) | Electrified grid zones causing temporary shield disruption |
| 4 | `CHRONO_DEVOURER` | THE CHRONO DEVOURER<br>*Temporal Paradox Harbinger* | Primary: `#fbbf24`<br>Sec: `#78350f`<br>Accent: `#fef08a` | Tachyon Monoliths (2x 600 HP)<br>Fires accelerating tachyon needles | Tachyon lance fan, temporal afterimage echo, 8-way chrono-implosion (Phase 3) | Chronal time-dilation field slowing player bullets by 60% |
| 5 | `SOLARIS_COLOSSUS` | SOLARIS COLOSSUS<br>*Stellar Hypergiant Dreadnought* | Primary: `#f97316`<br>Sec: `#451a03`<br>Accent: `#ef4444` | Prominence Pillars (2x 600 HP)<br>Sweeping thermal laser tripwires | Coronal mass ejection plasma balls, prominence sweep, 10-way supernova (Phase 3) | Heatwave distortion & horizontal solar tripwire beams |
| 6 | `NEBULA_PHANTASM` | THE NEBULA PHANTASM<br>*Quantum Spectral Swarm* | Primary: `#6366f1`<br>Sec: `#0f172a`<br>Accent: `#06b6d4` | Entangled Phase Pods (2x 600 HP)<br>80% damage reduction in Shifted phase | Quantum mirage nova, curving spectral homing wisps, 12-way curtain (Phase 3) | Quantum phase-shift flicker obscuring sovereign hitbox |
| 7 | **`BIOMORPHIC_SWARM`** *(NEW)* | THE BIOMORPHIC SWARM<br>*Extragalactic Chitin Flesh-Hive* | Primary: `#b91c1c`<br>Sec: `#450a0a`<br>Accent: `#f59e0b`<br>Glow: `#84cc16` | Chitinous Hatchery Sacs (2x 600 HP)<br>Spawns 3 undulating parasitic seeker spores | Corrosive bile barrage (bursts into micro-spits), mandible ripper needles, 14-way bio-plasmid helix (Phase 3) | Bio-corrosive spore creep slowly descending from top of screen |
| 8 | **`SINGULARITY_CORE`** *(NEW)* | THE SINGULARITY CORE<br>*Supermassive Event Horizon Entity* | Primary: `#09090b`<br>Sec: `#1e1b4b`<br>Accent: `#ffffff`<br>Glow: `#8b5cf6` | Gravitational Dampeners (2x 600 HP)<br>Polarized: Left pulls (-50), Right pushes (+50) | Hawking radiation lance (piercing center beam), relativistic jet flares ($45^\circ$ scissor), 16-way Nova (Phase 3) | Relativistic spacetime warp curving player bullets near center |
| 9 | **`NANITE_HARVESTER`** *(NEW)* | NANITE HARVESTER NEXUS<br>*Grey-Goo Molecular Disassembler* | Primary: `#94a3b8`<br>Sec: `#0f172a`<br>Accent: `#14b8a6`<br>Glow: `#06b6d4` | Nanite Fabricators (2x 600 HP)<br>Emits deconstruction clouds & heals sibling at 15 HP/s | Molecular disassembly ray (3 parallel beams), sub-atomic flak canisters, 16-way radial nanite storm (Phase 3) | Nanite screen erosion: corrosive nanite swarms lining canvas walls |
| 10 | **`PSIONIC_SHROUD`** *(NEW)* | THE PSIONIC SHROUD<br>*Extra-Dimensional Astral Inmate* | Primary: `#7c3aed`<br>Sec: `#2e1065`<br>Accent: `#d946ef`<br>Glow: `#fb7185` | Telepathic Beacons (2x 600 HP)<br>Spawns 2 real bullets + 2 40%-opacity phantom decoys | Mind-flay psionic lance (telegraphed beam), telekinetic dagger helix, 12-way Shroud terror star (Phase 3) | Telepathic input hysteresis: cyclic $\pm 10$px horizontal ship wobble |
| 11 | **`GLACIAL_OBLIVION`** *(NEW)* | GLACIAL OBLIVION<br>*Absolute Zero Entropic Engine* | Primary: `#38bdf8`<br>Sec: `#0c4a6e`<br>Accent: `#f0f9ff`<br>Glow: `#22d3ee` | Cryo-Condensers (2x 600 HP)<br>Retaliates with ice splinters if rapid-fired (>6/s) | Sub-zero icicle cascade (8 sharp darts), thermal drain cryo-lasers, 14-way blizzard starburst (Phase 3) | Absolute Zero Frostbite Zone: bottom 110px slows player speed by 20% |
| 12 | **`COSMIC_DEVOURER`** *(NEW)* | THE COSMIC DEVOURER<br>*Astral Void Dragon Behemoth* | Primary: `#18181b`<br>Sec: `#d97706`<br>Accent: `#dc2626`<br>Glow: `#facc15` | Astral Siphon Maws (2x 600 HP)<br>Regurgitates dark star flares with lingering fire trails | Supernova dark plasma breath ($50^\circ$ cone), astral scale scatter, 16-way solar flare corona (Phase 3) | Solar wind flare turbulence: lateral buffeting gusts ($\pm 40$px/s) |

---

## 6. Detailed Specifications for the 6 New Archetypes

### Archetype 7: `BIOMORPHIC_SWARM`
- **Enum Key**: `BIOMORPHIC_SWARM = 'BIOMORPHIC_SWARM'`
- **Inspiration**: Stellaris Prethoryn Scourge, Tyranid Hive Fleet, Starcraft Zerg Leviathan.
- **Config Attributes**:
  - `name`: `'THE BIOMORPHIC SWARM'`
  - `subtitle`: `'EXTRAGALACTIC CHITIN FLESH-HIVE'`
  - `riftHp`: 600, `sovereignHullHp`: 2500, `coreHp`: 1500, `enrageTime`: 35.0, `vortexStrength`: 20, `baseFireRate`: 2.2
  - `primaryColor`: `'#b91c1c'` (Blood Crimson)
  - `secondaryColor`: `'#450a0a'` (Visceral Burgundy)
  - `accentColor`: `'#f59e0b'` (Bile Amber)
  - `coreGlowColor`: `'#84cc16'` (Toxic Lime)
- **Warning Banner**: `⚠ BIOLOGICAL HORROR DETECTED — THE BIOMORPHIC SWARM INCURSION ⚠`
- **Vector Silhouette**: 260x130px segmented insectoid carapace. Triple-tiered chitinous shell with razor-sharp outward-curving dorsal mandibles, four pulsing glandular pods, and a gaping central bio-plasmid maw.
- **Phase 1 (Anchors - Chitinous Hatchery Sacs)**:
  - Total EHP: 1,200 (2 x 600 HP). Flanking coordinates: (50, 170) and (470, 170).
  - Spawns 3 undulating seeker spores (`#f59e0b`) every 2.4s that home in on the player via sine-wave trajectories ($v_x = \sin(t \cdot 4) \cdot 70$, $v_y = 170$).
  - Spores burst upon impact or player interception into 30px lingering bio-acid hazard puddles lasting 2.0s.
- **Phase 2 (Hull - 2,500 HP)**:
  - Movement: Predatory serpentine slither ($x = \text{initialX} + \sin(t \cdot 1.1) \cdot 55$, $y = \text{initialY} + \cos(t \cdot 2.2) \cdot 15$).
  - Primary Attack: *Corrosive Bile Barrage* — fires 7 decelerating bio-globules (`#84cc16`, initial speed 240) that burst at mid-screen into twin diagonal acid micro-shards.
  - Secondary Attack: *Mandible Ripper Volley* — high-speed twin chitin spikes (`#b91c1c`, speed 360) shot alternately from left and right mandibles.
- **Phase 3 (Core - 1,500 HP, 35.0s Enrage)**:
  - Enrage Barrage: *Extragalactic Swarm Infestation* — the exposed hive heart beats at 8 Hz, expelling a continuous 14-way spiraling bio-plasmid helix (`#84cc16` / `#f59e0b`, speed 220) and rapid-fire swarmer larvae.
- **Environmental Hazard**: *Bio-Corrosive Spore Creep* — creeping toxic spore haze slowly descends from top of screen, restricting vertical retreat and dealing damage to players camping in corners.

---

### Archetype 8: `SINGULARITY_CORE`
- **Enum Key**: `SINGULARITY_CORE = 'SINGULARITY_CORE'`
- **Inspiration**: Stellaris Horizon Signal / Black Hole Behemoth, Relativistic Gravity Collapse.
- **Config Attributes**:
  - `name`: `'THE SINGULARITY CORE'`
  - `subtitle`: `'SUPERMASSIVE EVENT HORIZON ENTITY'`
  - `riftHp`: 600, `sovereignHullHp`: 2500, `coreHp`: 1500, `enrageTime`: 35.0, `vortexStrength`: 50, `baseFireRate`: 2.0
  - `primaryColor`: `'#09090b'` (Obsidian Black)
  - `secondaryColor`: `'#1e1b4b'` (Accretion Indigo)
  - `accentColor`: `'#ffffff'` (White-Hot Hawking Radiation)
  - `coreGlowColor`: `'#8b5cf6'` (Relativistic Violet)
- **Warning Banner**: `⚠ GRAVITATIONAL ANOMALY DETECTED — SINGULARITY CORE INCURSION ⚠`
- **Vector Silhouette**: 260x130px dreadnought centered around an opaque black sphere (radius 36px), surrounded by three counter-rotating elliptical accretion rings and flanked by monolithic magnetic compression pylons.
- **Phase 1 (Anchors - Polarized Gravitational Dampeners)**:
  - Total EHP: 1,200 (2 x 600 HP). Flanking coordinates: (50, 170) and (470, 170).
  - Left anchor exerts an attractive gravity well (pulls player and bullets left with force 50 within 250px). Right anchor exerts a repulsive anti-gravity field (pushes player and bullets right with force 50 within 250px).
  - Anchors fire heavy gravity compression pulses (`#8b5cf6`, speed 190) every 2.8s.
- **Phase 2 (Hull - 2,500 HP)**:
  - Movement: Heavy, slow, micro-pulsing gravitational levitation ($x = \text{initialX} + \sin(t \cdot 0.7) \cdot 25$, $y = \text{initialY} + \cos(t \cdot 1.4) \cdot 8$).
  - Primary Attack: *Hawking Radiation Lance* — a focused, continuous central beam (`#ffffff` core, `#8b5cf6` corona, speed 420) sweeping $\pm 20^\circ$ across the canvas.
  - Secondary Attack: *Relativistic Jet Flares* — twin diagonal plasma jets fired from magnetic poles at $45^\circ$ angles, creating a crossfire cage.
- **Phase 3 (Core - 1,500 HP, 35.0s Enrage)**:
  - Enrage Barrage: *Event Horizon Gravitational Implosion* — core breaches containment, pulling the player toward center with vortex strength 75 while discharging an 8-stage cascading Nova of 16 Hawking plasma bolts (`#ffffff` / `#8b5cf6`, speed 240) in alternating rotations.
- **Environmental Hazard**: *Event Horizon Spacetime Warp* — all player projectiles passing within 180px of the central singularity curve along gravitational geodesics, bending trajectory toward the event horizon.

---

### Archetype 9: `NANITE_HARVESTER`
- **Enum Key**: `NANITE_HARVESTER = 'NANITE_HARVESTER'`
- **Inspiration**: Stellaris Grey Tempest / L-Cluster Nanite Swarm, Star Trek Borg Nanoprobes.
- **Config Attributes**:
  - `name`: `'NANITE HARVESTER NEXUS'`
  - `subtitle`: `'GREY-GOO MOLECULAR DISASSEMBLER'`
  - `riftHp`: 600, `sovereignHullHp`: 2500, `coreHp`: 1500, `enrageTime`: 35.0, `vortexStrength`: 25, `baseFireRate`: 2.0
  - `primaryColor`: `'#94a3b8'` (Chrome Silver)
  - `secondaryColor`: `'#0f172a'` (Carbon Dark Slate)
  - `accentColor`: `'#14b8a6'` (Circuit Teal)
  - `coreGlowColor`: `'#06b6d4'` (Molecular Dissolution Cyan)
- **Warning Banner**: `⚠ SYSTEM REPLICATION DETECTED — NANITE HARVESTER INCURSION ⚠`
- **Vector Silhouette**: 260x130px morphing faceted polyhedron. Tessellated floating polygonal armor plates that shift and rotate independently around a glowing crystalline processor core.
- **Phase 1 (Anchors - Nanite Assembly Fabricators)**:
  - Total EHP: 1,200 (2 x 600 HP). Flanking coordinates: (50, 170) and (470, 170).
  - Emits molecular deconstruction clouds and transmits self-repair nanites to heal its sibling anchor at 15 HP/s unless suppressed by sustained player fire.
  - Fires 4 high-speed splinter shards (`#14b8a6`, speed 220) every 3.0s.
- **Phase 2 (Hull - 2,500 HP)**:
  - Movement: Non-inertial quantum tessellation (sudden 40px lateral micro-teleport steps followed by 1.2s stabilization).
  - Primary Attack: *Molecular Disassembly Ray* — 3 parallel high-velocity teal laser lances (`#06b6d4`, speed 390) fired in a sweeping fan across player position.
  - Secondary Attack: *Sub-Atomic Nanite Flak* — 2 canisters launched into mid-screen that burst into 12 splinter shards expanding radially in a hexagonal lattice.
- **Phase 3 (Core - 1,500 HP, 35.0s Enrage)**:
  - Enrage Barrage: *Grey Singularity Assimilation* — outer hull disintegrates into a cloud of billions of nanites. Emits an omnidirectional 16-way radial nanite storm every 1.1s while deploying 2 persistent hunter-seeker nanite micro-vortices.
- **Environmental Hazard**: *Nanite Screen Erosion* — nanite swarms line the outer canvas walls (15px wide border) that damage the player if hugging the screen edges.

---

### Archetype 10: `PSIONIC_SHROUD`
- **Enum Key**: `PSIONIC_SHROUD = 'PSIONIC_SHROUD'`
- **Inspiration**: Stellaris The Shroud / Unbidden Incursion, Lovecraftian Cosmic Entities.
- **Config Attributes**:
  - `name`: `'THE PSIONIC SHROUD'`
  - `subtitle`: `'EXTRA-DIMENSIONAL ASTRAL INMATE'`
  - `riftHp`: 600, `sovereignHullHp`: 2500, `coreHp`: 1500, `enrageTime`: 35.0, `vortexStrength`: 30, `baseFireRate`: 2.0
  - `primaryColor`: `'#7c3aed'` (Astral Violet)
  - `secondaryColor`: `'#2e1065'` (Psychic Abyss Navy)
  - `accentColor`: `'#d946ef'` (Telepathic Magenta)
  - `coreGlowColor`: `'#fb7185'` (Ethereal Rose)
- **Warning Banner**: `⚠ PSYCHIC DISTORTION DETECTED — THE PSIONIC SHROUD INCURSION ⚠`
- **Vector Silhouette**: 260x130px ethereal crown. Translucent crystalline psychic crest hovering over six undulating astral tendrils, with an all-seeing weeping telepathic ocular iris at center.
- **Phase 1 (Anchors - Telepathic Resonance Beacons)**:
  - Total EHP: 1,200 (2 x 600 HP). Flanking coordinates: (50, 170) and (470, 170).
  - Projects a reality-bending psychic illusion field. Every 2.4s, each beacon discharges 2 genuine psychic bolts (`#d946ef`, speed 200, damage 1) alongside 2 *Phantom Mirage Decoys* (identical color, 40% transparency, 0 damage). Players must read visual clarity cues to prioritize dodges.
- **Phase 2 (Hull - 2,500 HP)**:
  - Movement: Weightless floating Lissajous wave (smooth figure-8 loop: $x = \text{initialX} + \sin(t \cdot 1.0) \cdot 48$, $y = \text{initialY} + \sin(t \cdot 2.0) \cdot 14$, opacity oscillating between 0.65 and 0.95).
  - Primary Attack: *Mind-Flay Psionic Lance* — instant-hit telegraph line (0.6s warning glow) followed by a high-velocity piercing beam (`#d946ef`, speed 440) targeting player position.
  - Secondary Attack: *Telekinetic Dagger Helix* — 8 psychic blades swirling in a double-helix spiral that converge on player coordinates.
- **Phase 3 (Core - 1,500 HP, 35.0s Enrage)**:
  - Enrage Barrage: *Shroud Apocalypse Inversion* — astral boundary shatters. Emits a continuous 12-way star of psychic terror spheres (`#fb7185` / `#7c3aed`, speed 210) accompanied by inward sweeping lateral telekinetic shockwaves.
- **Environmental Hazard**: *Telepathic Input Hysteresis* — subtle psychic turbulence creating a gentle periodic $\pm 10$px horizontal drift on the player ship, simulating telepathic disorientation.

---

### Archetype 11: `GLACIAL_OBLIVION`
- **Enum Key**: `GLACIAL_OBLIVION = 'GLACIAL_OBLIVION'`
- **Inspiration**: Stellaris Crystalline Entities / Ice Dreadnoughts, Absolute Zero Entropy.
- **Config Attributes**:
  - `name`: `'GLACIAL OBLIVION'`
  - `subtitle`: `'ABSOLUTE ZERO ENTROPIC ENGINE'`
  - `riftHp`: 600, `sovereignHullHp`: 2500, `coreHp`: 1500, `enrageTime`: 35.0, `vortexStrength`: 20, `baseFireRate`: 2.0
  - `primaryColor`: `'#38bdf8'` (Permafrost Ice Blue)
  - `secondaryColor`: `'#0c4a6e'` (Glacial Abyss Navy)
  - `accentColor`: `'#f0f9ff'` (Absolute Zero White)
  - `coreGlowColor`: `'#22d3ee'` (Cryogenic Cyan)
- **Warning Banner**: `⚠ THERMAL COLLAPSE DETECTED — GLACIAL OBLIVION INCURSION ⚠`
- **Vector Silhouette**: 260x130px jagged crystalline iceberg colossus. Heavy geometric ice-shelf armor, razor-sharp downward-jutting icicle spires, crystallized outriggers, and a radiant sub-zero crystal heart.
- **Phase 1 (Anchors - Permafrost Cryo-Condensers)**:
  - Total EHP: 1,200 (2 x 600 HP). Flanking coordinates: (50, 170) and (470, 170).
  - Cryo-Reactive Shielding: Anchors take normal damage, but if hit by rapid player fire (>6 shots/sec), they emit a defensive frost flash that reflects 4 retaliatory ice splinters (`#f0f9ff`, speed 240) in a fan spread.
  - Generates an *Absolute Zero Frostbite Zone* in the bottom 110px of the canvas, reducing player movement speed by 20% while inside.
- **Phase 2 (Hull - 2,500 HP)**:
  - Movement: Slow, heavy tectonic drifting with periodic sudden glacial shifts ($x = \text{initialX} + \sin(t \cdot 0.6) \cdot 35$, $y = \text{initialY} + \cos(t \cdot 1.2) \cdot 10$).
  - Primary Attack: *Sub-Zero Icicle Volley* — 8 crystalline icicle darts (`#f0f9ff`, speed 310) forming horizontally above the player before dropping in rapid cascade.
  - Secondary Attack: *Thermal Drain Cryo-Lasers* — twin cryogenic beams from wingtips that leave temporary frozen lines on screen that shatter into ice debris after 1.0s.
- **Phase 3 (Core - 1,500 HP, 35.0s Enrage)**:
  - Enrage Barrage: *Entropic Deep Freeze Cataclysm* — core crystallizes completely, emitting an omnidirectional 14-way blizzard star of rotating snowflake clusters (`#22d3ee` / `#f0f9ff`, speed 230) that detonate into secondary micro-crystals.
- **Environmental Hazard**: *Freezing Blizzard Screen Frost* — frosted ice vignettes creep inward from the four corners of the screen during Phase 3, scattering diamond-dust particles.

---

### Archetype 12: `COSMIC_DEVOURER`
- **Enum Key**: `COSMIC_DEVOURER = 'COSMIC_DEVOURER'`
- **Inspiration**: Stellaris Void Dragon / Stellarite Devourer / Astral Leviathans, World Serpent.
- **Config Attributes**:
  - `name`: `'THE COSMIC DEVOURER'`
  - `subtitle`: `'ASTRAL VOID DRAGON BEHEMOTH'`
  - `riftHp`: 600, `sovereignHullHp`: 2500, `coreHp`: 1500, `enrageTime`: 35.0, `vortexStrength`: 35, `baseFireRate`: 2.0
  - `primaryColor`: `'#18181b'` (Obsidian Dragon Scale)
  - `secondaryColor`: `'#d97706'` (Molten Amber Core)
  - `accentColor`: `'#dc2626'` (Supernova Crimson Breath)
  - `coreGlowColor`: `'#facc15'` (Radiant Solar Gold)
- **Warning Banner**: `⚠ APEX PREDATOR DETECTED — THE COSMIC DEVOURER INCURSION ⚠`
- **Vector Silhouette**: 260x130px draconic leviathan. Sweeping curved obsidian wings with razor-sharp wingtalons, glowing celestial dorsal spines, serpentine neck armor, and a gaping draconic maw blazing with solar plasma.
- **Phase 1 (Anchors - Astral Siphon Maw Nodes)**:
  - Total EHP: 1,200 (2 x 600 HP). Flanking coordinates: (50, 170) and (470, 170).
  - Siphons cosmic energy into the Devourer. Every 2.6s, each node regurgitates a *Dark Star Flare* (`#dc2626` / `#facc15`, speed 190) that arcs towards the player and leaves a burning fire trail.
  - Flare impact zones ignite temporary molten fire patches lasting 2.0s that block player bullets and deal damage on contact.
- **Phase 2 (Hull - 2,500 HP)**:
  - Movement: Majestic serpentine slither (wide undulating sinusoidal wave: $x = \text{initialX} + \sin(t \cdot 1.2) \cdot 55$, $y = \text{initialY} + \sin(t \cdot 2.4) \cdot 18$).
  - Primary Attack: *Supernova Breath Beam* — wide, devastating dark plasma column (`#dc2626` exterior, `#facc15` thermonuclear core, speed 380) unleashed from dragon maw across a $50^\circ$ forward cone.
  - Secondary Attack: *Astral Scale Scatter* — 10 burning obsidian dragon scales shed from wings drifting downward in criss-crossing pendulum arcs (`#d97706`, speed 200).
- **Phase 3 (Core - 1,500 HP, 35.0s Enrage)**:
  - Enrage Barrage: *Celestial Star-Devouring Extinction* — devourer enters an apocalyptic feeding frenzy, emitting a continuous 16-way solar flare corona (`#dc2626` / `#facc15`, speed 250) every 1.1s and launching high-speed aimed dragon breath fireballs (`#facc15`, speed 370).
- **Environmental Hazard**: *Solar Wind Flare Turbulence* — periodic solar wind gusts buffeting the player laterally ($\pm 40$px/s force every 4.0s), demanding sharp piloting reflexes.

---

## 7. Implementation Blueprint for Software Engineers

### File-by-File Change Plan

1. **`src/game/crisis/types.ts`**:
   - Update `CrisisArchetype` enum to include all 12 entries.
   - Update `CrisisAttackType` union with new attacks:
     ```typescript
     | 'CORROSIVE_BILE_BARRAGE' | 'MANDIBLE_RIPPER_VOLLEY' | 'SWARM_INFESTATION'
     | 'HAWKING_RADIATION_LANCE' | 'RELATIVISTIC_JET_FLARE' | 'EVENT_HORIZON_IMPLOSION'
     | 'MOLECULAR_DISASSEMBLY_RAY' | 'SUBATOMIC_NANITE_FLAK' | 'GREY_SINGULARITY_STORM'
     | 'MIND_FLAY_LANCE' | 'TELEKINETIC_DAGGER_HELIX' | 'SHROUD_APOCALYPSE_INVERSION'
     | 'SUB_ZERO_ICICLE_VOLLEY' | 'CRYO_THERMAL_DRAIN' | 'BLIZZARD_DEEP_FREEZE'
     | 'SUPERNOVA_BREATH_BEAM' | 'ASTRAL_SCALE_SCATTER' | 'STAR_DEVOURING_EXTINCTION'
     ```
   - Add entries for all 6 new archetypes in `CRISIS_ARCHETYPE_CONFIGS`.

2. **`src/game/crisis/EndGameCrisis.ts`**:
   - Update `startIncursion()` selection array to contain all 12 `CrisisArchetype` members.
   - Expand `getArchetypeTitle()` switch cases for the 6 new archetypes.
   - Expand `executeArchetypeAttack()` switch cases to implement Phase 2 & Phase 3 attacks for the 6 new archetypes.
   - Update `applyPassiveHazards()` or environmental update hooks for the new hazards (spores, gravity shear, nanite borders, psionic drift, frost slow, solar gusts).

3. **`src/game/crisis/DimensionalRift.ts`**:
   - Expand constructor color mapping and orbital particle hues for the 6 new archetypes.
   - Implement Phase 1 anchor behaviors in `update()`:
     - `BIOMORPHIC_SWARM`: undulating seeker spores and lingering acid pools.
     - `SINGULARITY_CORE`: polarized left-pull and right-push gravitational shear.
     - `NANITE_HARVESTER`: mutual 15 HP/s healing and splinter shard bursts.
     - `PSIONIC_SHROUD`: phantom mirage decoys (40% opacity, 0 dmg).
     - `GLACIAL_OBLIVION`: cryo-reactive retaliatory frost flak and bottom-lane slow field.
     - `COSMIC_DEVOURER`: dark star flares with lingering firewalls.
   - Implement custom anchor vector rendering for each archetype in `draw()`.

4. **`src/game/crisis/CrisisSovereign.ts`**:
   - Expand `setupArchetypeColors()` for the 6 new archetypes.
   - Add drawing methods for each new boss silhouette:
     - `drawBiomorphicSwarm(ctx)`
     - `drawSingularityCore(ctx)`
     - `drawNaniteHarvester(ctx)`
     - `drawPsionicShroud(ctx)`
     - `drawGlacialOblivion(ctx)`
     - `drawCosmicDevourer(ctx)`

5. **`tests/unit/crisis_doubling.test.ts` & `tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts`**:
   - Update `expect(Object.keys(CrisisArchetype).length).toBe(12);`
   - Update `expect(allArchetypes.length).toBe(12);`
   - Add specific behavioral unit tests for each of the 6 new archetypes validating Phase 1 anchor attacks, Phase 2 attacks, Phase 3 enrage, and EHP invariants.

---

## 8. Caveats

1. **Test Update Requirement**: Existing test suites (`tests/unit/crisis_doubling.test.ts` line 65 and `tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts` line 357) explicitly test `expect(allArchetypes.length).toBe(6)`. The implementation engineer must update these assertions to `12` simultaneously with the enum expansion to maintain continuous passing tests.
2. **Read-Only Mining Scope**: As Specification Miner, no implementation changes or file modifications to `src/` or `tests/` were made in this task. All specifications are completely defined here for execution by the Implementation Engineer.
3. **Sound Effects**: The existing audio system uses procedural Web Audio oscillators (`soundManager.playDarkMatterBeam()`, `soundManager.playAcidStormSound()`, `soundManager.playRogueShoot()`, etc.). The new archetypes reuse and combine these procedural sound triggers cleanly without requiring external audio asset files.

---

## 9. Conclusion

The specification for expanding Water Invader from 6 to 12 End-Game Crisis archetypes is complete, fully articulated, and mathematically balanced:
- **6 Distinct New Archetypes**: `BIOMORPHIC_SWARM`, `SINGULARITY_CORE`, `NANITE_HARVESTER`, `PSIONIC_SHROUD`, `GLACIAL_OBLIVION`, and `COSMIC_DEVOURER`.
- **Encounter Balance**: Exactly **5,200 EHP** across all 12 crises ($1,200 + 2,500 + 1,500$), with a uniform 35.0-second Phase 3 enrage clock.
- **Uniform Distribution**: Exact $1/12 \approx 8.333\%$ probability per crisis during incursion triggers with zero theme or naming collisions.
- **Complete Visual & Mechanical Specs**: Full vector silhouettes, color palettes, warning banner text, anchor mechanics, boss primary/secondary attacks, and unique environmental hazards are ready for code implementation.

---

## 10. Verification Method

To independently verify this specification upon implementation:

1. **Type Checking**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Result*: 0 type errors. Exhaustive switches in `CrisisSovereign.draw()` and `EndGameCrisis.executeArchetypeAttack()` properly handle all 12 archetypes.

2. **Crisis Expansion Unit Test Suite**:
   ```bash
   npx playwright test tests/unit/crisis_doubling.test.ts
   ```
   *Expected Result*: All tests pass, confirming 12 distinct archetypes, 5,200 EHP invariant across all 12, and clean headless Canvas 2D vector rendering.

3. **Stress & Adversarial Simulation**:
   ```bash
   npx playwright test tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts
   ```
   *Expected Result*: Rapid-fire instantiation of all 12 archetypes across 60 cycles with 0 memory leaks and 0 unhandled exceptions.

4. **Deterministic Incursion Hook Verification**:
   Verify in node / headless environment that `gm.triggerEndGameCrisis(CrisisArchetype.<ARCHETYPE>)` successfully initializes all 12 archetypes.

# Deep Specification Mining & Architecture Interface Report: Features 7–12
**Agent:** `pitch_spec_miner_2` (Factions & Systems Spec Miner)  
**Target Repository:** `water-invader` (Next.js 15 / TypeScript / HTML5 2D Canvas / Web Audio API)  
**Working Directory:** `/Users/user/src/water-invader/.agents/pitch_spec_miner_2`  
**Date:** September 10, 2026  
**Status:** M1 Final Feature Specification & TypeScript Contract Deliverable  

---

# 1. Observation

Direct code inspection of the production repository yielded the following structural, mathematical, and interface baselines:

### 1.1 Core Game Loop, Invariants & Dimensions
1. **Coordinate Boundaries in `GameManager.ts`**:
   - `logicalWidth = 600` (or `720` in older viewport configs), `logicalHeight = 800` (or `960` in older viewport configs).
   - In `GameManager.ts` lines 128–130:
     ```typescript
     public readonly logicalWidth: number = 600;
     public readonly logicalHeight: number = 800;
     ```
   - In `COLLABORATION.md` lines 21–22 and `ORIGINAL_REQUEST.md` line 221:
     > `"CRITICAL CONSTRAINT: You MUST NOT change logicalWidth or logicalHeight in GameManager.ts or Enemy.ts, as this will immediately fail the Playwright test suite. All visual scaling and viewport extensions must be handled strictly via CSS."`
2. **Player Weapon & Upgrade Architecture (`Player.ts`)**:
   - In `Player.ts` lines 9–18:
     ```typescript
     public speed: number = 300;
     public hp: number = 3;
     public maxHp: number = 5;
     public baseFireRate: number = 0.5;
     public multiShot: number = 1;
     public piercing: number = 1;
     public hasAcidShield: boolean = false;
     public homingMissiles: number = 0;
     public ultimateGauge: number = 0;
     ```
   - In `Player.ts` lines 29–32:
     ```typescript
     public suppressionLevel: number = 0; // 0 to 100. High = less accuracy
     public stressLevel: number = 0;      // 0 to 100. High = faster fire rate
     public invincibilityTimer: number = 0;
     public hitFlashTimer: number = 0;
     ```
3. **Enemy Factions & Piercing Multipliers (`Enemy.ts`)**:
   - In `types.ts` lines 25–46:
     - `Faction`: `PLAYER`, `INVADER`, `ROGUE`.
     - `EnemyType`: `NORMAL = 0`, `ZIGZAG = 1`, `BOSS = 2`, `SNIPER = 3`, `DIVER = 4`, `SHIELDED = 5`, `SPLITTER = 6`, `ROGUE_DRONE = 7` through `ROGUE_CARRIER = 12`, `SABOTEUR = 13`.
   - In `Enemy.ts` lines 99–114:
     - Piercing multiplier scales with wave: `1.0 + Math.min(1.5, Math.max(0, this.level - 10) * 0.08)`.
     - Piercing count scales up to 3 for high-level elites.
4. **End-Game Crisis 5,200 EHP Invariant (`src/game/crisis/types.ts`)**:
   - In `src/game/crisis/types.ts` lines 6–20 and 171–341:
     - 12 Archetypes: `VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`, `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, `NEBULA_PHANTASM`, `BIOMORPHIC_SWARM`, `SINGULARITY_CORE`, `NANITE_HARVESTER`, `PSIONIC_SHROUD`, `GLACIAL_OBLIVION`, `COSMIC_DEVOURER`.
     - Every single archetype configuration satisfies:
       $$\text{EHP} = \text{riftHp} \times 2 + \text{sovereignHullHp} + \text{coreHp} = 600 \times 2 + 2500 + 1500 = 5,200\text{ EHP}$$
5. **Procedural Web Audio Engine (`SoundManager.ts`)**:
   - In `SoundManager.ts`, zero external audio samples (`.mp3`, `.wav`) are loaded. Everything is synthesized via Web Audio API nodes (`OscillatorNode`, `BiquadFilterNode`, `GainNode`, `WaveShaperNode`).
6. **Component HUD & Touch Input Layer (`game-canvas.tsx`)**:
   - In `game-canvas.tsx` lines 1084–1180: Pointer events on canvas handle drag movement and fire inputs (`handleKeyDown(' ')`), with separate mobile control containers outside the canvas.

---

# 2. Logic Chain

1. **Feature 7 (Veteran Crew Synergy Deck)** maps to the player's bridge progression:
   - Observation: `Player.ts` manages stats like `speed`, `hp`, `baseFireRate`, `multiShot`, `piercing`, `stressLevel`, and `suppressionLevel`.
   - Deduction: Officers can directly modulate these scalar values through a cleanly detached `CrewManager` without modifying core player geometry.
   - Dual-Officer combos emerge from pairing two stationed officers, triggering conditional listeners on game events (e.g. `onBarricadeDamage`, `onEnemyTagged`, `onHazardActive`).
2. **Feature 8 (Mutating Bio-Horror Faction)** expands the adversary ecology:
   - Observation: `EnemyType` currently has 14 variants (0 to 13), and `Faction` has `PLAYER`, `INVADER`, `ROGUE`.
   - Deduction: Adding `Faction.HADAL_BIO` creates a multi-way crossfire (Invaders vs. Rogues vs. Bio-Horrors vs. Player).
   - Reactive evolution tracks player weapon output in `GameManager` (kinetic vs. missile vs. pierce), triggering defensive mutations that cap at 40% mitigation to preserve playability.
3. **Feature 9 (Automaton Shield Phalanx)** introduces geometric puzzle combat:
   - Observation: Current shielded enemies (`EnemyType.SHIELDED`) use a scalar `shieldHp` that takes damage from any angle.
   - Deduction: An ancient mechanical faction requires true directional deflection (100% frontal deflection) and network graph coupling: when two drones are within $160\text{px}$ with aligned normals, they share an energy barrier. Breaking one drone trips an inductive backlash that stuns the cluster.
4. **Feature 10 (Apex Bosses)** scales milestone encounters into multi-part leviathans:
   - Observation: `EnemyType.BOSS` is a single rectangular sprite; `CrisisSovereign` is a 3-phase boss with rifts.
   - Deduction: Apex Bosses require segmented sub-component architectures (destructible tentacles, weapon batteries, gullets) where destroying sub-hitboxes permanently strips boss capabilities and opens critical weakpoints (e.g. 2.5x critical inside the Charybdis Maw).
5. **Feature 11 (Roguelike Endless Mode)** provides infinite bathymetric progression:
   - Observation: `GameManager.ts` has `GameState.MENU`, `PLAYING`, `SHOP`, `GAME_OVER`.
   - Deduction: Introducing `GameState.DESCENT_MAP` and `GameState.BOON_SELECT` creates a downward DAG navigation loop from $0\text{m}$ to $11,000\text{m}+$. Hydrostatic pressure acts as a soft timer degrading Max HP containers unless vented.
6. **Feature 12 (Sonar/Hydrophone UI)** transforms the audiovisual atmosphere:
   - Observation: Canvas rendering is structured in layers; Web Audio generates sound in real-time.
   - Deduction: A dedicated polar radar sweep, contact telemetry tags, CRT phosphor bloom, and a 16-band hydrophone waterfall visualizer can be rendered between the background and entity layers, ensuring zero obstruction of bullets.

---

# 3. Caveats

1. **Mobile Aspect Ratio & CSS Letterboxing**: Although the canvas coordinate frame is strictly $600 \times 800$, mobile touch devices use responsive CSS containing wrappers. All HUD badges and UI elements placed on the canvas must avoid the extreme corners ($<10\text{px}$) to avoid clipping.
2. **Garbage Collection (GC) in 60 FPS Canvas**: Creating new objects (`new Vector()`, dynamic arrays) inside `update()` or `render()` causes micro-stutters on mobile browsers. All shockwave wavefronts, sonar particles, and mutation timers must use pre-allocated static object pools.
3. **Audio Context Autoplay Policy**: Modern browsers restrict Web Audio API initialization until the first user interaction (pointerdown or keydown). `SoundManager` already handles this via `ensureAudioContext()`, and all new procedural synthesis methods must pass through this check.

---

# 4. Conclusion

Features 7 through 12 form a cohesive, synergistic second half of the *Abyssal Odyssey* expansion. They seamlessly integrate with the existing codebase:
- They respect the inviolable $600 \times 800$ logical coordinate space.
- They conform to the zero-external-asset vector rendering and procedural Web Audio paradigm.
- They interlock with recent features including Homing Missiles, Allied Reinforcements, and the 12 End-Game Crises.
- The specifications below provide mathematical formulas, state machine transition diagrams, and complete TypeScript interface contracts ready for implementation agents.

---

# 5. Verification Method

To independently verify the contracts, architecture, and logic:
1. **Type Checking**:
   ```bash
   npx tsc --noEmit
   ```
2. **Full Next.js Production Build**:
   ```bash
   npm run build
   ```
3. **Automated Playwright Test Suite**:
   ```bash
   npx playwright test
   ```
4. **Coordinate Integrity Check**:
   Verify that `logicalWidth` (600) and `logicalHeight` (800) in `src/game/GameManager.ts` remain completely untouched.

---

# Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Crew Deck | Officer Roster & Stationing | 4 Officers (Ingrid Vane, Jax Callahan, Ren Thorne, Dr. Lyra Vance) slotted into bridge stations | Officer ID, Station Index | Stat modifiers, active ability bindings | Station occupied or officer locked -> rejection with audio click | `swarm_d3_crewsynergy_2/report.md` |
| 2 | Crew Deck | Active Bridge Abilities | 4 manual tactical cooldowns (`[1]-[4]` / `[Q][E][R][F]`) with durations and effects | Key event or Touch badge | Screen VFX, shockwaves, torpedo fans, slow-mo | Fired during cooldown -> no-op with negative audio buzz | `IDEAS_PITCH.md` § Feature 7 |
| 3 | Crew Deck | Dual & Quad Combo Resonances | 6 dual synergies + 1 quad grand resonance (*Abyssal Leviathan Matrix*) | Pair/Quad of active officers at Rank III+ | Automated passive perks (e.g. missile retaliation on barricade hit) | Inactive if rank threshold not met | `swarm_d3_crewsynergy_2/report.md` |
| 4 | Crew Deck | Fatigue & Rotation System | Extended combat stress/damage builds Fatigue (0-100); 100 = Exhausted (+20% CD) | Player HP < 2, high suppression | Fatigue accumulation, cooldown penalty | Capped at 100; cleared by 1 run in reserve | `swarm_d3_crewsynergy_2/report.md` |
| 5 | Bio-Horror | Parasite Clinger | Vermicular parasite corkscrewing down; latches onto player hull, reducing speed by -25% each | Proximity < 45px to player | Speed debuff, lateral drag, cooling choke | Shaken off by alternating `← →` 4 times or scraping barricade | `swarm_d4_hadalbio_1/report.md` |
| 6 | Bio-Horror | Spore Siphoner | Floating bladder creating 110px vacuum aura; swallows missed bullets; bursts into acid cloud | Missed player bullets inside aura | Sac expansion; on death, 90-160px acid spore cloud | Piercing weapon (pierce >= 2) reduces cloud radius by 60% | `IDEAS_PITCH.md` § Feature 8 |
| 7 | Bio-Horror | Carapace Colossus | Heavy bulwark with 140° frontal bone carapace (40 HP) deflecting 85% non-piercing damage | Incoming projectile vector & angle | Frontal deflection vs. 200% critical hit on rear | Piercing weapons (pierce >= 2) shatter bone plate and stun for 2.5s | `swarm_d4_hadalbio_1/report.md` |
| 8 | Bio-Horror | Abyssal Angler | Camouflaged stealth sniper (alpha 0.15) dangling false +50 water lure; flashbangs approacher | Player proximity < 120px to lure | Suppression set to 95, screen flash, lunging bite | Destroying lure at long range stuns and unmasks the Angler | `swarm_d4_hadalbio_1/report.md` |
| 9 | Bio-Horror | Epigenetic Mutation Engine | Hive tracks player damage profile over 2 waves; mutates counter-traits (Kinetic/Missile/Pierce) | Weapon damage ratios over 2 waves | Active mutation (+40% armor, chaff pheromones, or viscous flesh) | Max 40% mitigation cap; atrophies if weapon usage drops < 30% | `swarm_d4_hadalbio_1/report.md` |
| 10 | Automaton | Phalanx Aegis Drone | Frontline drone with 60° frontal barrier (100% deflection); links with nearby drones | Bullets from frontal arc; nearby drones | Shared barrier wall, 40% harmonic damage dampening | When shield breaks, trips Inductive Backlash stunning linked units | `swarm_d4_ancientmech_2/report.md` |
| 11 | Automaton | Inductive Backlash Cascade | Electromagnetic feedback surge when a linked shield collapses | Shield HP reaching 0 on linked drone | All connected shields dissolve; 80 hull damage; 1.8s EMP stagger | Isolated drones take normal damage without triggering cascade | `IDEAS_PITCH.md` § Feature 9 |
| 12 | Automaton | EMP Disruption Prowler | Agile strafer discharging 240px EMP Nova; overcharges adjacent Aegis shield regeneration | Charge timer (7.5s interval, 1.2s windup) | 240px EMP pulse; player fire rate -50% for 3s; barricade repair halted | Player moves outside 240px radius to avoid pulse | `swarm_d4_ancientmech_2/report.md` |
| 13 | Automaton | Rail-Mortar Sentinel | Quadrupedal platform with hydraulic lockdown; fires piercing copper slugs leaving shock pools | 1.8s lockdown sequence | Piercing slug (v=450px/s) + 80px shock puddle (12 DPS for 2.5s) | Post-fire cooling window (2.4s) opens core for 300% critical damage | `swarm_d4_ancientmech_2/report.md` |
| 14 | Apex Boss | Kraken Prime (Charybdis Maw) | 3-phase 12,000 EHP aquatic titan spanning canvas width; tentacles, vortex maw, ink blackout | Phase HP thresholds (4000 / 4000 / 4000) | Tentacle swats, vortex inhalation pull, 2.5x crit gullet, predator charges | Enrage timer (45s in Phase 3) before Hadal Extinction Wave | `swarm_d4_megalodonboss_5/report.md` |
| 15 | Apex Boss | Sunken Mech Titan (SMS Leviathan) | Modular 520x180px warship with 6 destructible sub-systems (Batteries, CIWS, VLS, Hangar, Core) | Sub-system HP depletion | Disables specific attacks; sheds debris; Phase 3 Spinal Railgun | 45s reactor meltdown countdown in Phase 3 | `swarm_d4_dreadnoughtboss_6/report.md` |
| 16 | Apex Boss | Hadal Patriarch (Siphonophore) | 300px colonial organism with bioluminescent stinging zooids, nectophore chains, acid torrents | Segment destruction | Stage hazard interactions, sulfur geysers, fluid drag currents | Severing individual bells breaks colonial command chain | `IDEAS_PITCH.md` § Feature 10 |
| 17 | Endless Mode | Bathymetric Descent DAG | Procedural branching descent map (200m -> 11,000m+) across 5 Depth Sectors | Node selection, 25 💧 Sonar Ping | Transitions to Combat, Elite, Supply, Shrine, Hazard, Outpost | Non-connecting nodes cannot be jumped; landslides block branches | `swarm_d5_endlessdescent_1/report.md` |
| 18 | Endless Mode | Hydrostatic Pressure Engine | Physical pressure accumulation $P = \text{Depth} \times 0.1\text{ bar}$; degrades player Max HP containers | Depth, time elapsed, hazard exposure | Stress gauge (0-100%), Max HP reduced (5->4->3->2), hull leaks | Venting ballast ('C') expends 10% water to clear 30% stress | `IDEAS_PITCH.md` § Feature 11 |
| 19 | Endless Mode | 3-Card Boon Draft System | Draft 1 of 3 randomized upgrades (Common 60%, Rare 28%, Legendary 9%, Corrupted 3%) | Clearing Elite/Hazard nodes | In-run gameplay mutations (e.g. Vortical Railgun, Benthic Swarm) | Corrupted boons grant extreme power with permanent debuffs | `swarm_d5_endlessdescent_1/report.md` |
| 20 | Endless Mode | Meta-Unlock Tokens & Benthic Lab | Permanent progression via Abyssal Pearls; unlocks chassis, pressure tolerance, pre-revealed fog | Run completion / death conversion | Permanent tech tree upgrades and hangar hull customization | Run-specific boons reset; meta-pearls persist in `localStorage` | `swarm_d5_endlessdescent_1/report.md` |
| 21 | Sonar UI | Polar Sonar Grid & Sweep Line | Concentric range rings (50m-250m) and continuous rotating sweep line $\omega=1.8\text{ rad/s}$ | Game time $\Delta t$, entity positions | Phosphor trail, Echo Bloom (18px radius) on enemy intersection | Contrast-first rendering guarantees 100% bullet visibility | `swarm_d6_sonarhud_1/report.md` |
| 22 | Sonar UI | Acoustic Detonation Wavefronts | Radial shockwave expansion spawned on torpedo detonations and barrier breaks | High-yield explosion events | Expanding dual-ring wavefronts $R(t)=R_0 + 280 \cdot t^{0.85}$ | Max 0.35 alpha ensures zero epileptogenic flash hazard | `IDEAS_PITCH.md` § Feature 12 |
| 23 | Sonar UI | Hydrophone Waterfall Spectrogram | 16-band real-time audio FFT visualizer (40 Hz - 12 kHz) + scrolling waterfall history | Web Audio API `AnalyserNode` | Decibel bar heights, rolling color-mapped spectrogram stream | Runs asynchronously; 0 overhead on main game canvas thread | `swarm_d6_sonarhud_1/report.md` |
| 24 | Sonar UI | Claustrophobic Hull Stress FX | Diegetic stress feedback: hull groans (Stress>50), glass cracks (Stress>75), camera shake | Player HP and Hydrostatic Stress | Procedural glass fracture lines via recursive midpoint displacement | Stress cleared restores normal optical clarity | `swarm_d6_pressuregauge_2/report.md` |

---

# Edge Cases & Boundary Behaviors

| # | Feature | Input / Edge Case | Observed & Specified Behavior |
|---|---------|-------------------|-------------------------------|
| 1 | Crew Deck | Player triggers active ability while on cooldown | Ability does not fire; HUD badge pulses dark red with an authentic audio "buzzer" squelch. Cooldown timer remains strictly monotonic. |
| 2 | Crew Deck | Player vessel HP drops to 0 while Quad Resonance is active | Sub-Zero Reactor Purge triggers: cancels death, restores HP to 5/5, triggers screen-wide 150 damage flash and 4.0s invincibility (1 charge per run). |
| 3 | Bio-Horror | 4th Parasite Clinger attempts to latch onto player | Latching cap enforced: max 3 Clingers simultaneously on player hull (-75% speed cap). 4th clinger bounces off and remains in free-swimming mode. |
| 4 | Bio-Horror | Player rapidly alternates left-right keys during pause or shop | Wiggle detection is strictly gated by `deltaTime > 0` and active playing state; paused/shop inputs do not decrement parasite count. |
| 5 | Bio-Horror | Spore Siphoner absorbs bullets while already at maximum volume | Volume cap enforced: maximum 160px death explosion radius. Further bullets deal standard damage to the Siphoner without increasing cloud size. |
| 6 | Bio-Horror | Player deals exactly 50% kinetic and 50% missile damage over 2 waves | Priority tie-breaker: highest tier weapon breaks tie (Homing Missiles > Multi-shot Kinetic). Single mutation rule strictly maintained. |
| 7 | Automaton | Aegis Drone isolated with no other drone within 160px | Drone operates standalone: forward 60° arc deflector active, but no link conduit rendered and no harmonic damage dampening applied. |
| 8 | Automaton | 5 Aegis Drones linked in a continuous line; middle drone destroyed | Inductive Backlash cascades bi-directionally to immediate left and right neighbors only; does not infinite-loop. Line splits into two severed halves. |
| 9 | Automaton | Player fires piercing rail slug into Phalanx hexagonal shield | Piercing weapon bypasses directional 100% deflection, penetrating through the barrier and damaging the underlying chassis directly. |
| 10 | Apex Boss | Player enters Phase 2 Charybdis Maw with 0 speed upgrades | Reverse thrusters still provide enough backward velocity ($v_y = 120\text{px/s}$) to hover at safe distance ($y = 450\text{px}$) from tooth contact hitbox. |
| 11 | Apex Boss | Player detonates Cavitation Torpedo inside the open Charybdis Maw | Triggers an Acoustic Concussion Stun: vortex suction halts for 2.5s, dealing 2.5x critical damage and clearing active tooth shrapnel. |
| 12 | Apex Boss | Phase 3 enrage countdown reaches 0.0s | Megalodon submerges and triggers Hadal Extinction Wave: continuous 15 damage/sec fills the screen, forcing rapid death within 1-2 seconds. |
| 13 | Endless Mode | Hydrostatic Pressure reaches 100% (Hull Breach) | Hull leaks trigger: player takes 1 damage every 6 seconds. If player vents ballast via 'C', stress drops to 70% and leak stops immediately. |
| 14 | Endless Mode | Player has 1 HP container left (4 crushed by pressure) and takes damage | If player possesses Emergency Ballast Jettison, ballast consumes: 3.0s invincibility, resets pressure to 0%, restores containers to 3. Otherwise fatal. |
| 15 | Endless Mode | Player disconnects or closes browser during a descent run | `DescentRunState` is fully serialized in `localStorage`; resuming resumes at the exact stratum and node with current boons and pressure preserved. |
| 16 | Sonar UI | Active Sonar Ping fired during a total darkness cycle (Biolapse) | Ping wavefront sweeps at 480 px/s; all enemies touched are rendered as bright neon-green wireframe contacts for 4.0s before fading back into shadows. |
| 17 | Sonar UI | 20 explosions occur simultaneously on screen | Wavefront pool clamps to max 12 concurrent active wavefronts via FIFO recycling to preserve 60 FPS performance and avoid visual clutter. |
| 18 | Sonar UI | Audio is muted by user via TopHUD mute toggle | Audio synthesizers are silenced, but visual hydrophone spectrogram waterfall transitions to a procedural synthetic ambient noise stream. |

---

# Feature 7: Veteran Crew Synergy Deck

```
+=======================================================================================================+
|                                    FEATURE 7: BRIDGE CREW DECK ARCHITECTURE                           |
+=======================================================================================================+
|                                                                                                       |
|   [BRIDGE STATION 1: ENGR]    [BRIDGE STATION 2: GUNS]    [BRIDGE STATION 3: SONAR]   [STATION 4: BIO]|
|   Chief Ingrid Vane           Master Gunner Jax Callahan  Hydro-Officer Ren Thorne    Dr. Lyra Vance  |
|   Palette: Gold (#f59e0b)     Palette: Crimson (#ef4444)  Palette: Emerald (#10b981)  Palette: Cyan   |
|   Active: SCRAM PURGE [1]/Q   Active: TITAN SALVO [2]/E   Active: STASIS PULSE [3]/R  Active: DECOY   |
|   (Cleanses, 300px Blast)     (12 Torpedoes in Fan)       (Slows bullets 70%, Crits)  (Draws Fire)    |
|                                                                                                       |
|   =================================================================================================   |
|   [CROSS-OFFICER COMBO RESONANCE MATRIX]                                                              |
|   - Steam & Thunder (Ingrid + Jax): Barricade hits retaliate with 2 homing missiles.                  |
|   - Thermal Plume (Ingrid + Lyra) : Hazard presence grants continuous shield regeneration.            |
|   - Dead Reckoning (Jax + Ren)    : Homing missiles gain +50% speed and permanent lock on tagged foes.|
|   - Abyssal Echosphere (Ren + Lyra): Acoustically tagged enemies take +100% enemy friendly-fire.       |
|   - Aegis Bulkhead (Ingrid + Ren) : Taking damage auto-reflects the next hostile bullet (12s CD).     |
|   - Bio-Ballistics (Jax + Lyra)   : Piercing shots leave a 3 DPS corrosive acid trail for 5 seconds.  |
|                                                                                                       |
|   >>> QUAD GRAND RESONANCE (ALL 4 AT RANK III+): "THE ABYSSAL LEVIATHAN MATRIX" <<<                   |
|   - -20% Global Active Cooldowns. Once per run revive at 0 HP with 150 damage screen-clearing blast.  |
|                                                                                                       |
+=======================================================================================================+
```

### Mathematical Formulations
1. **Nano-Alloy Bulkhead (Ingrid Tier I)**:
   $$\text{MaxHP} = \text{BaseMaxHP} + 1, \quad \text{CollisionDamageTaken} = \text{BaseDamage} \times 0.70$$
2. **Active Barricade Tether (Ingrid Tier II)**:
   $$\text{BarricadeHP}_{\text{start}} = \min\left(\text{MaxHP}, \text{BarricadeHP} + 0.25 \times \text{MaxHP}\right)$$
3. **Supercavitation Propellant (Jax Tier I)**:
   $$v_{\text{bullet}} = v_{\text{base}} \times 1.25, \quad \Delta t_{\text{fire}} = \Delta t_{\text{base}} \times 0.88$$
4. **Apex Homing Warhead (Jax Tier II)**:
   $$\text{Damage}_{\text{missile}} = \text{BaseDamage} \times 1.35, \quad \text{TargetPriority} = \text{Boss}(3.0) > \text{Elite}(2.0) > \text{Common}(1.0)$$
5. **Hydrophone Ping Mark (Ren Tier I)**:
   $$P(\text{AcousticTag}) = 0.18, \quad \text{DamageReceived} = \text{BaseDamage} \times 1.30 \quad (\text{Duration } \tau = 6.0\text{s})$$
6. **Active Cooldown Reduction by Rank**:
   $$\text{Cooldown}(R) = \text{BaseCooldown} \times \left(1.0 - 0.15 \times \max(0, R - 1)\right)$$

### State Machine Transition Model
```
[OFFICER: LOCKED] ---> (Recruit: 200 Pure Water) ---> [RANK I: ENSIGN]
                                                             |
                                           (Promote: 350 Water + 100 Merits)
                                                             v
                                                     [RANK II: LIEUTENANT]
                                                             |
                                      (Promote: 600 Water + 250 Merits + 1 Core)
                                                             v
                                                     [RANK III: COMMANDER] (Unlocks Dual Resonances)
                                                             |
                                      (Promote: 1000 Water + 500 Merits + 2 Cores)
                                                             v
                                                     [RANK IV: FLEET CAPTAIN] (Unlocks Quad Resonance)
```

---

# Feature 8: Mutating Bio-Horror Faction

```
+=======================================================================================================+
|                                    FEATURE 8: HADAL BIO-HORROR HIERARCHY                              |
+=======================================================================================================+
|                                                                                                       |
|   [PARASITE CLINGER]                [SPORE SIPHONER]                  [CARAPACE COLOSSUS]             |
|   - 32x24px, viridian chitin        - 48x48px hydrostatic bladder     - 80x60px monolithic crustacean|
|   - Corkscrew dive (vx:160, vy:180) - Ingestion aura (r=110px)        - 140° bone shield (40 HP)      |
|   - Latches on hull within 45px     - Swallows missed bullets         - 85% damage mitigation front   |
|   - Drag: -25% speed per clinger    - On death: 90-160px acid cloud   - 200% critical hit to rear     |
|   - Wiggle [<- ->] to dislodge      - Blinds homing missile sensors   - Pierce >= 2 shatters bone     |
|                                                                                                       |
|   =================================================================================================   |
|   [EPIGENETIC REACTIVE MUTATION ENGINE]                                                               |
|   - Sensor tracks damage profile across 2-wave rolling window:                                        |
|     • Ratio_kinetic > 50% ==> [MUTATION: Anti-Kinetic Calcification] (35% kinetic defense)            |
|     • Ratio_missile > 40% ==> [MUTATION: Bioluminescent Chaff] (Missiles decoyed into ink)           |
|     • Ratio_pierce  > 40% ==> [MUTATION: Amoebic Viscous Flesh] (Absorbs pierce after 1st hit)        |
|   - Single mutation active per echelon; max 40% mitigation ceiling; atrophies if ratio drops < 30%    |
|                                                                                                       |
+=======================================================================================================+
```

### Mathematical Formulations
1. **Parasitic Drag & Steering Torque**:
   $$v_{\text{player}}(n) = v_{\text{base}} \times \max\left(0.25, 1.0 - 0.25 \cdot n_{\text{parasites}}\right), \quad n \in [0, 3]$$
   $$\Delta t_{\text{fireDelay}}(n) = \Delta t_{\text{base}} \times \left(1.0 + 0.20 \cdot n_{\text{parasites}}\right)$$
2. **Directional Carapace Deflection**:
   Given bullet velocity vector $\vec{v}_b$ and Colossus forward normal $\vec{n}_c$:
   $$\theta_{\text{impact}} = \arccos\left(\frac{-\vec{v}_b \cdot \vec{n}_c}{\|\vec{v}_b\| \|\vec{n}_c\|}\right)$$
   $$\text{DamageMultiplier} = \begin{cases} 0.15 & \text{if } \theta_{\text{impact}} \le 70^\circ \text{ and } \text{pierce} < 2 \\ 1.00 & \text{if } \text{pierce} \ge 2 \\ 2.00 & \text{if } \theta_{\text{impact}} > 110^\circ \text{ (Rear Hit)} \end{cases}$$
3. **Reactive Evolution Metric Sensor**:
   $$\text{Ratio}_w = \frac{\sum_{\text{wave}-1}^{\text{wave}} D_w}{\sum_{\text{wave}-1}^{\text{wave}} D_{\text{total}}}, \quad w \in \{\text{kinetic}, \text{missile}, \text{pierce}\}$$

---

# Feature 9: Automaton Shield Phalanx

```
+=======================================================================================================+
|                                    FEATURE 9: AUTOMATON PHALANX GRID                                  |
+=======================================================================================================+
|                                                                                                       |
|   [BACKLINE ARTILLERY]          [RAIL-MORTAR SENTINEL]         [RAIL-MORTAR SENTINEL]                 |
|                                 • 64x46px bronze platform      • Pierces player barricades            |
|                                 • 1.8s lockdown sequence       • Copper slug + 80px induction pool    |
|                                 • Cooling vents exposed post-fire (2.4s at 300% Critical Damage!)     |
|                                                                                                       |
|   [MIDLINE SUPPORT]                      [EMP DISRUPTION PROWLER]                                     |
|                                          • 44x30px agile sinusoidal strafer (vx:110px/s)              |
|                                          • Ventral EMP Nova (r=240px, player fire rate -50% for 3s)   |
|                                          • Supercharges adjacent Aegis shield regen +100% (15 SHP/s)  |
|                                                                                                       |
|   [FRONTLINE BULWARK]         [AEGIS DRONE] =============== [AEGIS DRONE]                             |
|                               \---------------- SHIELD WALL ----------------/                         |
|                                 • 52x38px bronze chassis, 60° frontal barrier (100% deflection)       |
|                                 • Resonant coupling conduit when distance <= 160px                    |
|                                 • Harmonic damage dampening: D_each = (D_in * 0.60) / N_linked        |
|                                                                                                       |
|   >>> INDUCTIVE RESONANT BACKLASH (Achilles' Heel) <<<                                                |
|   When 1 linked shield collapses -> all linked shields dissolve for 3.5s + 80 hull damage + 1.8s stun |
|                                                                                                       |
+=======================================================================================================+
```

### Mathematical Formulations
1. **Euclidean Coupling & Alignment Invariant**:
   $$d_{ij} = \|\mathbf{p}_i - \mathbf{p}_j\| \le 160\text{ px}, \quad \hat{\mathbf{n}}_i \cdot \hat{\mathbf{n}}_j \ge \cos(25^\circ) \approx 0.906$$
2. **Distributed Harmonic Damage Pool**:
   $$D_{\text{drone}, k} = \frac{D_{\text{incoming}} \cdot (1 - 0.40)}{N_{\text{linked}}}, \quad \forall k \in [1, N_{\text{linked}}]$$
3. **Inductive Resonant Backlash Propagation**:
   $$\text{If } \text{ShieldHP}_k \le 0 \implies \forall m \in \text{Neighbors}(k): \text{StunTimer}_m = 1.8\text{s}, \; \text{HP}_m -= 80, \; \text{ShieldActive}_m = \text{false} \; (\tau = 3.5\text{s})$$

---

# Feature 10: Apex Bosses

```
+=======================================================================================================+
|                                    FEATURE 10: MULTI-STAGE APEX BOSSES                                |
+=======================================================================================================+
|                                                                                                       |
|   BOSS 1: CHARYBDIS PRIME (ABYSSAL LEVIATHAN KRAKEN) — 12,000 EHP                                     |
|   - Phase 1: Tentacle Ramparts (4x 1,000 HP tentacles; swats homing missiles, slams barricades)       |
|   - Phase 2: Charybdis Maw (4,000 HP; upward inhalation vortex F_pull=K/(dy)^1.2; 2.5x crit throat)   |
|   - Phase 3: Abyssal Rage (4,000 HP; bioluminescent ink blackout; 520px/s breach charge; 45s enrage)  |
|                                                                                                       |
|   BOSS 2: SMS LEVIATHAN-01 (SUNKEN MECH TITAN) — 12,000 EHP                                           |
|   - 520x180px multi-hardpoint naval fortress controlling upper canvas                                 |
|   - Phase 1: Heavy Broadside Batteries (Port & Starboard 380mm turrets, VLS mortars, CIWS flak)       |
|   - Phase 2: Carrier Deck Breach (Scrambles Interceptor & Kamikaze drones; carpet bombing runs)       |
|   - Phase 3: Overheated Antimatter Core (Dual targeting lasers -> 54px wide railgun beam; 45s timer)  |
|                                                                                                       |
|   BOSS 3: THE HADAL PATRIARCH (COLOSSAL SIPHONOPHORE SOVEREIGN) — 12,000 EHP                          |
|   - 300px colonial colonial organism with segmented nectophore bells and bio-toxin tentacle curtain   |
|   - Stage hazards: geothermal abyssal rifts, sulfur geysers, acid torrents                            |
|                                                                                                       |
+=======================================================================================================+
```

### Mathematical Formulations
1. **Charybdis Hydrodynamic Vortex Pull**:
   $$\vec{F}_{\text{pull}}(y) = -K_{\text{vortex}} \cdot \frac{1}{\max(40, y_{\text{player}} - y_{\text{maw}})^{1.2}} \cdot \hat{\mathbf{j}}, \quad K_{\text{vortex}} = 14,500\text{ px}^{2.2}/\text{s}^2$$
2. **Segmented Inverse Kinematics for Tentacle Joints**:
   For each bone segment $i \in [1, 5]$ with link length $L_i = 32\text{px}$:
   $$\theta_i(t) = \theta_{\text{root}} + A_i \sin(\omega t + i \cdot \phi) + \text{IKSolve}(\mathbf{p}_{\text{target}})$$
3. **Modular Sub-system Health Transfer**:
   $$\text{MasterHullDamage} = \sum_{\text{hardpoints}} \Delta \text{HP}_{\text{sub}} \times 0.50 + D_{\text{direct}}$$

---

# Feature 11: Roguelike Endless Mode

```
+=======================================================================================================+
|                                    FEATURE 11: ENDLESS DESCENT ROGUELIKE MODE                         |
+=======================================================================================================+
|                                                                                                       |
|   BATHYMETRIC SONAR DESCENT DAG (0m -> 11,000m+)                                                      |
|   - Sector I: Sunlight & Twilight (0m - 2,000m)       | Sector II: Midnight Bathypelagic (2k - 4k)    |
|   - Sector III: Abyssal Plains (4,000m - 6,000m)      | Sector IV: Hadal Trench & Fissures (6k - 10k)  |
|   - Sector V: Uncharted Singularity (10,000m+)                                                        |
|                                                                                                       |
|   NODE ARCHETYPES:                                                                                    |
|   [Combat Zone] ⚔️ | [Elite Incursion] 💀 | [Supply Cache] 📦 | [Sunken Shrine] 🔮 | [Hazard] ⚠️      |
|                                                                                                       |
|   HYDROSTATIC PRESSURE ENGINE:                                                                        |
|   - Ambient Pressure: P = Depth(m) * 0.1 Bar                                                          |
|   - Stress Gauge: Accumulates continuously. High stress degrades Max HP (5 -> 4 -> 3 -> 2 -> 1).     |
|   - Ballast Venting: Press [C] / Touch Button to expend 10% pure water and vent 30% stress.           |
|                                                                                                       |
|   3-CARD BOON DRAFT (24 Boons + 6 Abyssal Curses):                                                    |
|   - Common (60%), Rare (28%), Legendary (9%), Corrupted (3% or 100% at Sunken Shrines)               |
|                                                                                                       |
|   META-UNLOCK CURRENCY (ABYSSAL PEARLS & ECHO SHARDS):                                                |
|   - Retained permanently across runs to fund Benthic Research Tree and Hangar Hull Chassis variants.  |
|                                                                                                       |
+=======================================================================================================+
```

### Mathematical Formulations
1. **Hydrostatic Ambient Pressure & Stress Accumulation**:
   $$P_{\text{ambient}} = \text{Depth} \times 0.1\text{ Bar}$$
   $$\frac{d(\text{Stress})}{dt} = k_{\text{base}} \cdot \left(1.0 + \frac{\text{Depth}}{2500}\right) \cdot \mu_{\text{hazard}}$$
2. **Max HP Container Throttling**:
   $$\text{MaxHP}_{\text{effective}} = \text{BaseMaxHP} - \begin{cases} 0 & \text{if Stress } < 75\% \\ 1 & \text{if } 75\% \le \text{Stress} < 95\% \\ 2 & \text{if Stress } \ge 95\% \end{cases}$$
3. **Prestige Echo Shard Conversion**:
   $$\text{EchoShards} = \left\lfloor \frac{\text{Score}}{10,000} \right\rfloor + (\text{MaxStratum} \times 2) + (\text{ElitesDefeated} \times 5) + (\text{BossesDefeated} \times 15)$$

---

# Feature 12: Sonar/Hydrophone UI

```
+=======================================================================================================+
|                                    FEATURE 12: TACTICAL SONAR & ACOUSTIC SUITE                        |
+=======================================================================================================+
|                                                                                                       |
|   [000° N]     BRG 042° // RNG 180m // CONT: ROGUE_EEL         WAVE 14 // DEPTH 6,400m                |
|   + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +   |
|   |        . . . . . . ( CONCENTRIC RANGE RINGS: 50m, 100m, 150m, 200m, 250m ) . . . . . .         |   |
|   |                    /                            \                                             |   |
|   |      [150m]       /        RADIAL SWEEP          \       [150m]                               |   |
|   |                  /           BEAM (360°)          \                                           |   |
|   |                 /                                  \                                          |   |
|   |                v           * ENEMY PING *           v                                         |   |
|   |                             (Echo Bloom)                                                      |   |
|   |                                                                                               |   |
|   |           ((( ACOUSTIC DETONATION WAVEFRONT )))                                               |   |
|   |                  * High-Yield Kinetic Shockwave *                                             |   |
|   |                                                                                               |   |
|   |                      [PLAYER SUBMERSIBLE]                                                     |   |
|   + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +   |
|   [HYDROPHONE] |||||/\_/\__|||||||/\_|| [SPECTRUM WATERFALL: 40Hz - 12kHz STREAM]                 |
|   [HULL STRESS GAUGE: 82%] [PROCEDURAL GLASS FRACTURE LINES ON CORNERS: AMPLITUDE 14px]           |
|                                                                                                       |
+=======================================================================================================+
```

### Mathematical Formulations
1. **Polar Sweep Dynamics & Echo Bloom**:
   $$\theta_{\text{sweep}}(t) = (1.8 \cdot t) \pmod{2\pi}, \quad \text{Intersection}: \|\mathbf{p}_{\text{enemy}} - \mathbf{p}_{\text{center}}\| \in [r_{\text{sweep}} - \delta, r_{\text{sweep}} + \delta]$$
   $$\alpha_{\text{bloom}}(t) = 0.85 \cdot e^{-t / 0.40}$$
2. **Acoustic Shockwave Wavefront Expansion**:
   $$R_{\text{wave}}(t) = R_0 + 280 \cdot t^{0.85}, \quad \alpha(t) = 0.35 \cdot \left(1 - \frac{t}{0.65}\right)^2, \quad W(t) = W_0 \cdot \left(1 + 0.5 \frac{t}{0.65}\right)$$
3. **Doppler Pitch Shift on Acoustic Echoes**:
   $$f' = f_0 \cdot \frac{c}{c - v_{\text{radial}}}, \quad c = 1,500\text{ m/s (Speed of sound in seawater)}$$
4. **Procedural Glass Fracture (Recursive Midpoint Displacement)**:
   $$\mathbf{p}_{\text{mid}} = \frac{\mathbf{p}_a + \mathbf{p}_b}{2} + \hat{\mathbf{n}} \cdot \text{Random}(-1, 1) \cdot \text{Roughness} \cdot \|\mathbf{p}_a - \mathbf{p}_b\|$$

---

# TypeScript Interface Contracts

Below are the complete, standalone, compilation-ready TypeScript interfaces specifying all types, entities, states, and event listeners for Features 7 through 12.

```typescript
// ============================================================================
// FEATURE 7: VETERAN CREW SYNERGY DECK CONTRACTS
// ============================================================================

export type OfficerId = 'INGRID' | 'JAX' | 'REN' | 'LYRA';
export type OfficerRank = 1 | 2 | 3 | 4; // Ensign, Lieutenant, Commander, Fleet Captain
export type StationId = 'ENGINEERING' | 'GUNNERY' | 'SONAR' | 'BIOLOGY';

export interface OfficerPerk {
  id: string;
  officerId: OfficerId;
  tier: 1 | 2 | 3;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  isActive: boolean;
}

export interface ActiveBridgeAbility {
  id: string;
  officerId: OfficerId;
  nameKo: string;
  nameEn: string;
  keybind: string; // '1' | '2' | '3' | '4' / 'Q' | 'E' | 'R' | 'F'
  cooldown: number; // Base seconds
  currentCooldown: number;
  duration: number; // Active effect duration
  isActive: boolean;
  execute: (game: any) => void;
}

export interface DualResonance {
  id: string;
  nameKo: string;
  nameEn: string;
  officerA: OfficerId;
  officerB: OfficerId;
  descriptionKo: string;
  descriptionEn: string;
  isActive: boolean;
}

export interface CrewOfficerState {
  id: OfficerId;
  nameKo: string;
  nameEn: string;
  station: StationId;
  rank: OfficerRank;
  unlocked: boolean;
  meritXp: number;
  fatigue: number; // 0 to 100
  isExhausted: boolean; // True if fatigue == 100
  paletteColor: string;
  accentColor: string;
  perks: OfficerPerk[];
  activeAbility: ActiveBridgeAbility;
}

export interface CrewDeckState {
  officers: Record<OfficerId, CrewOfficerState>;
  stationAssignments: Record<StationId, OfficerId | null>;
  activeResonances: DualResonance[];
  isQuadGrandResonanceActive: boolean; // All 4 at Rank 3+
  abyssalCores: number;
  canReviveWithPurge: boolean; // Once per run
}

// ============================================================================
// FEATURE 8: MUTATING BIO-HORROR FACTION CONTRACTS
// ============================================================================

export type HadalMutationType =
  | 'NONE'
  | 'ANTI_KINETIC_CALCIFICATION'
  | 'BIOLUMINESCENT_CHAFF'
  | 'AMOEBIC_VISCOUS_FLESH'
  | 'PREDATOR_SCENT_HOUNDS';

export interface ParasiteClingerData {
  id: number;
  attachOffset: { x: number; y: number };
  dragIntensity: number; // 0.25 speed reduction
  torqueDirection: -1 | 1;
}

export interface HadalFactionState {
  activeMutation: HadalMutationType;
  mutationProgress: number; // 0 to 100% towards next adaptation
  damageHistory: {
    kinetic: number;
    missile: number;
    pierce: number;
    windowDuration: number;
  };
  attachedParasiteCount: number; // Max 3
  activeSporeClouds: Array<{
    id: number;
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    duration: number;
    remainingLife: number;
  }>;
}

// ============================================================================
// FEATURE 9: AUTOMATON SHIELD PHALANX CONTRACTS
// ============================================================================

export interface AutomatonDroneNode {
  id: number;
  x: number;
  y: number;
  shieldHp: number;
  maxShieldHp: number;
  isFrontalShieldActive: boolean;
  shieldNormal: { x: number; y: number }; // Directional arc normal
  linkedDroneIds: number[];
  isBacklashStunned: boolean;
  stunTimer: number;
}

export interface ShieldPhalanxGrid {
  drones: Map<number, AutomatonDroneNode>;
  links: Array<{ droneA: number; droneB: number; conduitAlpha: number }>;
  harmonicDampeningFactor: number; // 0.40 (40% damage dampening)
  conduitCouplingDistance: number; // 160px
}

// ============================================================================
// FEATURE 10: APEX BOSS CONTRACTS
// ============================================================================

export enum ApexBossType {
  CHARYBDIS_PRIME = 'CHARYBDIS_PRIME',
  SMS_LEVIATHAN = 'SMS_LEVIATHAN',
  HADAL_PATRIARCH = 'HADAL_PATRIARCH',
}

export interface IBossSubsystem {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  isDestroyed: boolean;
  localBounds: { x: number; y: number; width: number; height: number };
  damageMultiplier: number;
  takeDamage(amount: number): number;
}

export interface ApexBossState {
  type: ApexBossType;
  phase: 1 | 2 | 3;
  totalHp: number;
  maxHp: number;
  subsystems: Map<string, IBossSubsystem>;
  isEnraged: boolean;
  enrageTimer: number; // 45s countdown in Phase 3
  vortexActive: boolean;
  vortexPullForce: number;
  darknessOverlayAlpha: number; // Phase 3 ink blackout (0.0 to 0.88)
}

// ============================================================================
// FEATURE 11: ROGUELIKE ENDLESS DESCENT CONTRACTS
// ============================================================================

export enum DescentNodeType {
  COMBAT = 'COMBAT',
  ELITE = 'ELITE',
  SUPPLY_CACHE = 'SUPPLY_CACHE',
  SUNKEN_SHRINE = 'SUNKEN_SHRINE',
  HAZARD_ANOMALY = 'HAZARD_ANOMALY',
  OUTPOST = 'OUTPOST',
}

export type BoonRarity = 'COMMON' | 'RARE' | 'LEGENDARY' | 'CORRUPTED';

export interface BoonCard {
  id: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  rarity: BoonRarity;
  icon: string;
  synergyTag: 'BULLET' | 'MISSILE' | 'PRESSURE' | 'DEFENSE' | 'DRONE' | 'CURSE';
  cursePenaltyKo?: string;
  cursePenaltyEn?: string;
  applyEffect: (game: any) => void;
}

export interface DescentMapNode {
  id: string;
  stratum: number; // Row (1 to 9)
  indexInStratum: number;
  type: DescentNodeType;
  depthMeters: number;
  ambientPressureBar: number;
  connectedDownstreamIds: string[];
  isRevealed: boolean;
  isCompleted: boolean;
}

export interface HydrostaticPressureState {
  currentDepthMeters: number;
  ambientPressureBar: number;
  stressPercentage: number; // 0 to 100%
  degradedHeartContainers: number; // 0 to 4 crushed hearts
  isHullBreached: boolean;
  leakDamageTimer: number;
}

export interface EndlessDescentRunState {
  isActive: boolean;
  sectorTier: 1 | 2 | 3 | 4 | 5;
  currentStratum: number;
  currentNodeId: string | null;
  mapNodes: Record<string, DescentMapNode>;
  pressure: HydrostaticPressureState;
  draftedBoons: BoonCard[];
  abyssalPearlsBanked: number;
  rerollsAvailable: number;
}

// ============================================================================
// FEATURE 12: SONAR & HYDROPHONE UI CONTRACTS
// ============================================================================

export interface AcousticWavefront {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  life: number;
  maxLife: number;
  color: string;
  lineWidth: number;
}

export interface SonarContactTarget {
  id: number;
  bearingDeg: number;
  rangeMeters: number;
  classification: string;
  radialVelocity: number;
  bloomTimer: number; // Phosphor bloom decay
}

export interface SonarRadarState {
  sweepAngleRad: number;
  sweepAngularSpeed: number; // 1.8 rad/s
  rangeRingsMeters: number[]; // [50, 100, 150, 200, 250]
  activeWavefronts: AcousticWavefront[];
  activeContacts: SonarContactTarget[];
  glassFractureLines: Array<{ startX: number; startY: number; endX: number; endY: number }>;
  screenShakeTrauma: number;
}

export interface HydrophoneWaterfallState {
  frequencyBands: Uint8Array; // 16 discrete FFT frequency buckets (40Hz to 12kHz)
  waterfallBuffer: Uint8ClampedArray; // Off-screen 128x64 rolling pixel memory
  updateIntervalMs: number; // 50ms (20Hz refresh)
}
```

---

# Integration Touchpoints Matrix

| Feature | Target Codebase Location | Integration Nature | Architectural Guardrail |
|:---|:---|:---|:---|
| **7. Veteran Crew Synergy Deck** | `src/game/crew/CrewManager.ts`, `src/game/Player.ts`, `game-canvas.tsx` | New modular directory `src/game/crew/`; event hooks in `Player.ts` (`onTakeDamage`, `fire()`); HUD badges in `game-canvas.tsx` | Strictly bounds HUD badges to canvas margin; zero change to `logicalWidth: 600`. |
| **8. Mutating Bio-Horror Faction** | `src/game/Enemy.ts`, `src/game/types.ts`, `src/game/GameManager.ts` | New enum values in `Faction` and `EnemyType`; directional bone shield in `Enemy.ts`; damage ratio metrics in `GameManager.ts` | Cap mutation mitigation at 40%; clamp Clingers to max 3 on player hull. |
| **9. Automaton Shield Phalanx** | `src/game/automaton/AutomatonPhalanx.ts`, `src/game/Enemy.ts` | New class module under `src/game/automaton/`; proximity link checks in `update()`; inductive backlash cascade logic | Distance squared optimization ($d^2 \le 160^2$) to eliminate `Math.sqrt` overhead in 60 FPS loop. |
| **10. Apex Bosses** | `src/game/boss/ApexBoss.ts`, `src/game/GameManager.ts`, `game-canvas.tsx` | Modular boss subclass under `src/game/boss/`; multi-hitbox composite tree; 3-segment boss HP bar overlay | Enforce 12,000 EHP invariant matching late-game crisis scaling. Clamped within $600 \times 800$. |
| **11. Roguelike Endless Mode** | `src/game/descent/DescentManager.ts`, `src/game/types.ts`, `game-canvas.tsx` | New `GameState.DESCENT_MAP` and `GameState.BOON_SELECT`; React modals for DAG map and 3-card draft | Classic mode remains 100% untouched; seamless state serialization in `localStorage`. |
| **12. Sonar/Hydrophone UI** | `src/game/sonar/SonarRenderer.ts`, `src/game/GameManager.ts`, `src/game/SoundManager.ts` | Canvas render pass between background and entities; procedural audio synthesizers in `SoundManager.ts` | Web Audio FFT runs on background audio thread; zero frame drops on Canvas 2D render thread. |

---

*End of Deep Specification Mining & Architecture Interface Report.*

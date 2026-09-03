# Claude Collaboration Guide: Water Invader

## Current Mission: 12-Crisis Massive Expansion (Doubling from 6 to 12 Types)

### Executive Summary & Status
The Water Invader development team has completed the technical surveys (Spec Miner, Crisis Architecture Explorer, and QA Test Explorer) for the massive End-Game Crisis expansion.
The game is expanding from 6 crisis archetypes to **12 distinct archetypes**, drawing inspiration from grand strategy and epic sci-fi space opera tropes (e.g. Stellaris endgame crises: Prethoryn Scourge, Contingency AI, Unbidden Shroud, Grey Tempest, Astral Leviathans, Absolute Zero Thermodynamic Collapse).

User approval ("승인") was explicitly confirmed in `ORIGINAL_REQUEST.md` ("승인 - 진행하세요. The user has already provided explicit approval: '승인'. Proceed with the source code modifications and milestone implementation immediately."). Therefore, implementation proceeds immediately across all coordinated workstreams.

---

### The 12 End-Game Crisis Archetypes

The roster features 12 completely orthogonal archetypes with zero aesthetic, mechanical, or naming overlap. Each crisis features bespoke color schemes, warning banners, Phase 1 anchor systems, Phase 2 super-weapons, Phase 3 core enrage barrages, and dynamic environmental hazards:

| # | Archetype Enum | Title & Subtitle | Visual Palette | Anchor Mechanics (Phase 1) | Boss Attacks (Phase 2 & Phase 3) | Unique Environmental Hazard |
|---|----------------|------------------|----------------|----------------------------|----------------------------------|-----------------------------|
| 1 | `VOID_SOVEREIGN` | **THE VOID SOVEREIGN**<br>*Extra-Dimensional Cataclysm* | Primary: `#c084fc`<br>Sec: `#1e1b4b`<br>Accent: `#38bdf8`<br>Glow: `#ec4899` | **Singularity Rifts** (2x 600 HP)<br>Pulls player & curves player bullets toward rift centers | 5-way dark matter spread (speed 220), flanking wing bolts. Phase 3: Void Nova starburst. | Central gravitational vortex bending player trajectories |
| 2 | `ABYSSAL_LEVIATHAN` | **THE ABYSSAL LEVIATHAN**<br>*Corrupted Bio-Swarm Horror* | Primary: `#10b981`<br>Sec: `#022c22`<br>Accent: `#84cc16`<br>Glow: `#bef264` | **Bio-Brood Sacks** (2x 600 HP)<br>Pulsing pods firing aimed toxic bio-larvae every 2.8s | Spore spiral (6 rotating spores), acidic barrage. Phase 3: Hyper-dense bio-larvae swarm. | Acid mist hazard puddles restricting vertical movement |
| 3 | `CYBERNETIC_EXTERMINATOR` | **CYBERNETIC EXTERMINATOR MATRIX**<br>*Purification Dreadnought Protocol* | Primary: `#ef4444`<br>Sec: `#0f172a`<br>Accent: `#06b6d4`<br>Glow: `#f97316` | **EMP Laser Pylons** (2x 600 HP)<br>Charges high-speed shock rail bolts every 3.2s | High-velocity twin orbital railguns (speed 380, 2 dmg) + aimed center cluster. Phase 3: EMP cascade. | Electrified grid zones causing shield disruption |
| 4 | `CHRONO_DEVOURER` | **THE CHRONO DEVOURER**<br>*Temporal Paradox Harbinger* | Primary: `#fbbf24`<br>Sec: `#78350f`<br>Accent: `#fef08a`<br>Glow: `#f59e0b` | **Tachyon Monoliths** (2x 600 HP)<br>Fires 3 accelerating tachyon needles every 2.5s | Tachyon lance fan (5 bolts, speed 380), temporal afterimage echo. Phase 3: 8-way chrono-implosion. | Chronal time-dilation field slowing player bullets by up to 70% |
| 5 | `SOLARIS_COLOSSUS` | **SOLARIS COLOSSUS**<br>*Stellar Hypergiant Dreadnought* | Primary: `#f97316`<br>Sec: `#451a03`<br>Accent: `#ef4444`<br>Glow: `#fef08a` | **Prominence Pillars** (2x 600 HP)<br>Sweeping thermal laser tripwire connecting anchors | Coronal mass ejection plasma fireballs, prominence sweep. Phase 3: 10-way rotating supernova starburst. | Heatwave visual distortion & horizontal solar tripwire beams |
| 6 | `NEBULA_PHANTASM` | **THE NEBULA PHANTASM**<br>*Quantum Spectral Swarm* | Primary: `#6366f1`<br>Sec: `#0f172a`<br>Accent: `#06b6d4`<br>Glow: `#d946ef` | **Entangled Phase Pods** (2x 600 HP)<br>Shifted phase gains 80% damage reduction | Quantum mirage nova (6 criss-cross needles), homing spectral wisps. Phase 3: 12-way quantum curtain. | Quantum phase-shift flicker obscuring sovereign hitbox |
| 7 | `BIOMORPHIC_SWARM` *(NEW)* | **THE BIOMORPHIC SWARM**<br>*Extragalactic Chitin Flesh-Hive* | Primary: `#b91c1c`<br>Sec: `#450a0a`<br>Accent: `#f59e0b`<br>Glow: `#84cc16` | **Chitinous Hatchery Sacs** (2x 600 HP)<br>Spawns 3 undulating seeker spores bursting into 30px acid puddles | Corrosive bile barrage (bursts into micro-spits), mandible ripper needles. Phase 3: 14-way bio-plasmid helix. | Bio-corrosive spore creep descending slowly from top of screen |
| 8 | `SINGULARITY_CORE` *(NEW)* | **THE SINGULARITY CORE**<br>*Supermassive Event Horizon Entity* | Primary: `#09090b`<br>Sec: `#1e1b4b`<br>Accent: `#ffffff`<br>Glow: `#8b5cf6` | **Gravitational Dampeners** (2x 600 HP)<br>Polarized: Left pulls (-50), Right pushes (+50) | Hawking radiation lance ($\pm 20^\circ$ sweep), relativistic jet flares ($45^\circ$ scissor). Phase 3: 16-way Hawking nova. | Relativistic spacetime warp curving player bullets near center |
| 9 | `NANITE_HARVESTER` *(NEW)* | **NANITE HARVESTER NEXUS**<br>*Grey-Goo Molecular Disassembler* | Primary: `#94a3b8`<br>Sec: `#0f172a`<br>Accent: `#14b8a6`<br>Glow: `#06b6d4` | **Nanite Fabricators** (2x 600 HP)<br>Emits deconstruction clouds & heals sibling at 15 HP/s | Molecular disassembly ray (3 parallel teal beams), sub-atomic flak canisters. Phase 3: 16-way radial nanite storm. | Nanite screen erosion: corrosive swarms lining canvas screen walls |
| 10 | `PSIONIC_SHROUD` *(NEW)* | **THE PSIONIC SHROUD**<br>*Extra-Dimensional Astral Inmate* | Primary: `#7c3aed`<br>Sec: `#2e1065`<br>Accent: `#d946ef`<br>Glow: `#fb7185` | **Telepathic Beacons** (2x 600 HP)<br>Spawns 2 real bullets + 2 phantom mirage decoys (40% opacity, 0 dmg) | Mind-flay psionic lance (telegraphed beam), telekinetic dagger helix. Phase 3: 12-way Shroud terror star. | Telepathic input hysteresis: cyclic $\pm 10$px horizontal ship wobble |
| 11 | `GLACIAL_OBLIVION` *(NEW)* | **GLACIAL OBLIVION**<br>*Absolute Zero Entropic Engine* | Primary: `#38bdf8`<br>Sec: `#0c4a6e`<br>Accent: `#f0f9ff`<br>Glow: `#22d3ee` | **Cryo-Condensers** (2x 600 HP)<br>Retaliates with 4 ice splinters if rapid-fired (>6/s) | Sub-zero icicle cascade (8 sharp darts), thermal drain cryo-lasers. Phase 3: 14-way blizzard starburst. | Absolute Zero Frostbite Zone: bottom 110px slows player speed by 20% |
| 12 | `COSMIC_DEVOURER` *(NEW)* | **THE COSMIC DEVOURER**<br>*Astral Void Dragon Behemoth* | Primary: `#18181b`<br>Sec: `#d97706`<br>Accent: `#dc2626`<br>Glow: `#facc15` | **Astral Siphon Maws** (2x 600 HP)<br>Regurgitates dark star flares leaving burning fire trails | Supernova dark plasma breath ($50^\circ$ cone), astral scale scatter. Phase 3: 16-way solar flare corona. | Solar wind flare turbulence: lateral buffeting gusts ($\pm 40$px/s) |

---

### Strict 5,200 EHP Encounter Invariant

To maintain equitable combat pacing, balanced DPS thresholds, and zero score disparity regardless of which crisis spawns, all 12 archetypes strictly conform to the **5,200 EHP invariant**:

$$\text{Total EHP} = \text{Anchor Left (600)} + \text{Anchor Right (600)} + \text{Sovereign Hull (2,500)} + \text{Exposed Core (1,500)} = 5,200\text{ EHP}$$

1. **Phase 1 (Dimensional Shield & Anchors)**:
   - **EHP**: $2 \times 600 = 1,200\text{ HP}$ (23.08% of total encounter EHP).
   - **Sovereign Status**: Invulnerable (`isInvulnerable = true`).
   - **Mechanics**: Projectiles striking Sovereign deal 0 damage and trigger defensive hex-shield flash (`shieldFlashTimer = 0.12s`). Pulsing conduit lines link flanking anchors to the Sovereign core.
   - **Transition**: Occurs when both anchors reach 0 HP (`activeRiftsCount === 0`).

2. **Phase 2 (Exposed Sovereign Hull)**:
   - **EHP**: $2,500\text{ HP}$ (48.08% of total encounter EHP).
   - **Sovereign Status**: Vulnerable (`isInvulnerable = false`).
   - **Mechanics**: Sovereign engages active flight maneuvers and cycles between primary and secondary super-weapons at base fire rate (~2.0s - 2.2s).
   - **Transition**: Occurs when `hullHp <= 0`. Overkill damage does not bleed into Core HP.

3. **Phase 3 (Core Overdrive & Enrage Clock)**:
   - **EHP**: $1,500\text{ HP}$ (28.85% of total encounter EHP).
   - **Enrage Clock**: Strictly timed **35.0-second countdown** (`enrageTimer = 35.0`).
   - **Mechanics**: Attack cadence accelerates drastically (interval shrinks to 1.4s). Core exposes dynamic particle aura and reality distortion rises.
   - **Enrage Penalty**: If `enrageTimer <= 0.0`, `realityDistortionLevel = 1.0`, triggering crisis sirens and hyper-dense bullet hell.
   - **Victory Resolution**: Depleting the 1,500 Core HP sets `CrisisPhase.DEFEATED`, grants +2,000 score, +500 currency, +10 combo, triggers a 120-particle explosion, and unlocks the next stage.

---

### Uniform 1/12 Random Spawning Distribution & Statistical Verification

1. **Engine Selection Contract**:
   - `EndGameCrisis.startIncursion()` selects from an array of all 12 enum entries (or `Object.values(CrisisArchetype)`).
   - Theoretical probability per crisis: $p = \frac{1}{12} \approx 8.333\%$.
   - Wave eligibility in `GameManager.spawnWave()`: Triggered on non-boss waves (`level % 5 !== 0`) at `level >= 15` (30% random roll per wave, with guaranteed pity incursion at `level >= 18`).

2. **Statistical Verification via Pearson's Chi-Square Goodness-of-Fit**:
   - Automated Monte Carlo test (`tests/unit/crisis_distribution_12.test.ts`) simulates $N = 12,000$ consecutive incursion rolls.
   - Expected occurrences per archetype: $E_i = N \cdot p = 12000 \times \frac{1}{12} = 1,000$.
   - Binomial standard deviation:
     $$\sigma = \sqrt{N \cdot p \cdot (1 - p)} = \sqrt{12000 \times \frac{1}{12} \times \frac{11}{12}} \approx 30.276$$
   - Pearson's Chi-Square Statistic:
     $$\chi^2 = \sum_{i=1}^{12} \frac{(O_i - 1000)^2}{1000}$$
   - **Acceptance Criteria**:
     - Degrees of freedom $df = 12 - 1 = 11$.
     - At $\alpha = 0.01$ significance level, critical $\chi^2_{0.01, 11} \approx 24.725$. The test asserts $\chi^2 < 24.725$.
     - Absolute bounds: Each archetype count must fall within $850 \le O_i \le 1150$ ($> 4.95\sigma$ safety bound), ensuring 0 archetypes are starved and 0 are favored.

---

### User Approval & Implementation Authorization

- **User Approval Confirmation**: The user explicitly confirmed approval in `ORIGINAL_REQUEST.md`: `"승인 - 진행하세요."` and `"The user has already provided explicit approval: '승인'. Proceed with the source code modifications and milestone implementation immediately."`
- **Implementation Status**: Codebase modifications and automated test implementations are authorized to proceed immediately without waiting for additional confirmation.
- **Pre-Commit / Pre-Push Verification**: Every commit must strictly verify `npx tsc --noEmit`, `npm run build`, and `npx playwright test` pass with 0 errors.

---

### Massive Allied Reinforcements: Aegis Vanguard Command Dreadnought ("중간에 큰 아군의 증원도넣어주삼")

In response to the urgent user requirement to introduce massive allied reinforcements during crisis/mid-game battles, the **Aegis Vanguard Command Dreadnought** (`src/game/crisis/AlliedReinforcements.ts`) has been integrated into `GameManager.ts`.

#### 1. Tactical Specifications & Architecture
- **Vessel Class**: *Aegis Vanguard Command Dreadnought* (아군 대규모 증원 함대 지휘전함)
- **Dimensions**: 220x100px grand capital battleship, procedurally rendered in pure Canvas 2D vector art.
- **Visual Design**:
  - Grand naval cyan (`#0369a1`, `#38bdf8`) and burnished gold (`#f59e0b`, `#fbbf24`) armor plating with dark slate citadel.
  - Dual plasma engine exhausts emitting dynamic flickering cyan thrust plumes at stern.
  - 3 rotating point-defense turrets (center bridge and port/starboard flanks) tracking targets.
  - Port and starboard forward railgun sponsons with magnetic accelerator coils.
  - Shimmering blue hyperspace warp glow and expanding portal rings.
- **Announcement Toast Banner**:
  - Dynamic in-game UI announcement banner: `"✦ ALLIED REINFORCEMENTS ARRIVED! ✦"` / `"아군 대규모 증원 함대 참전 — AEGIS VANGUARD DREADNOUGHT"`.
  - Neon pulsing cyan/gold double border with tactical HUD corner brackets and status tickers.

#### 2. Combat Capabilities & Offensive Systems
1. **Forward Heavy Plasma Cannons**:
   - Fires twin high-velocity blue/gold plasma bolts (speed 450, damage 3, piercing 2, player faction) every 0.8s.
   - Automatically acquires the highest-priority target: Crisis Sovereign core/rifts or closest living enemies.
2. **Point-Defense Laser Grid (120px Interception Perimeter)**:
   - Continuously sweeps a 120px protective radius around both the player ship and the dreadnought hull.
   - Vaporizes incoming hostile enemy/boss projectiles entering the perimeter, discharging crisp electric laser zap lines and spark particle bursts.
3. **Restorative Nano-Shield Aura**:
   - Projects a protective energy field around the player ship with orbiting emerald/cyan nano motes.
   - Periodically repairs player HP by +1 every 5.0 seconds (up to max HP) and reduces combat stress and suppression levels by 25%.
   - Emits an expanding restorative shockwave ring and floating `"+1 REPAIRED"` visual indicator.
4. **Agile Escort Interceptors**:
   - Two escort interceptor fighters fly in formation flanking the player ship (port and starboard).
   - Features responsive lerped formation flight with bank roll angles and twin suppressing blasters firing every 0.6s (speed 420, damage 1).

#### 3. Trigger Conditions & Lifecycle
- **Automatic Incursion Support**: Automatically warps into combat when an End-Game Crisis encounter reaches **Phase 2 (`CrisisPhase.PHASE_2_HULL`)** as the boss shields collapse.
- **Deterministic Testing Hook**: Accessible via `GameManager.triggerAlliedReinforcements(): AlliedReinforcements`.
- **Crisis Victory & Departure**: When the Crisis Sovereign is destroyed, the Dreadnought and Escort Interceptors execute a safe hyperspace warp jump (`warpOut()`).

---

## Current Mission: Comprehensive Testing & Bug-Hunting Pass (30+ Agent Swarm)

### Executive Summary & Strategy
The user has requested an exhaustive end-to-end testing, simulated stress testing, and bug-hunting pass across the entire Water Invader codebase deploying a very large swarm of specialist agents (30+ agents).

### Coordinated Workstreams:
1. **Wave & Crisis Mechanics Stress Swarm**:
   - Stress test all 12 End-Game Crisis archetypes, transitions (Phase 1 -> 2 -> 3 -> Defeat), anchor mechanics, reality distortion shaders, and 5,200 EHP invariant.
   - Stress test Allied Reinforcements (Aegis Vanguard Dreadnought + Interceptors), point defense laser grid, shield aura, and warp transitions.
2. **Physics, Collision & Spatial Awareness Swarm**:
   - Verify enemy friendly-fire avoidance and line-of-sight raycasting.
   - Detect projectile clipping, bounding box misalignments, and out-of-bounds entity leaks.
3. **UI, Layout & Responsiveness Swarm**:
   - Verify canvas scaling across desktop (1920x1080, 1440x900) and mobile/touch viewports (375x667, 390x844, 412x915).
   - Verify warning backgrounds, pause overlay, pre-game shop modal, HUD elements, and floating combat text.
4. **Regression, Build & Integrity Verification Swarm**:
   - Execute and expand Playwright E2E browser tests and unit test suites.
   - Run type-checking (`npx tsc --noEmit`) and production builds (`npm run build`).
   - If bugs/anomalies are discovered, implement targeted fixes with regression tests, verify with clean builds, and sync via git.



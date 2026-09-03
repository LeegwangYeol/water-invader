# Technical Investigation & Handoff Report: End-Game Crisis Architecture (12-Crisis Expansion)

**Author**: Crisis Architecture Explorer  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_arch_12`  
**Date**: 2026-09-03  
**Target Milestone**: 12-Crisis Expansion (6 existing archetypes -> 12 total archetypes)

---

## 1. Observation

Direct, verified observations from exhaustive inspection of the codebase:

### 1.1 File Architecture Overview
The End-Game Crisis subsystem is localized strictly within:
- `src/game/crisis/types.ts` (237 lines): Type definitions, enums (`CrisisArchetype`, `CrisisPhase`), attack types, interface contracts (`ICrisisEntity`, `ICrisisRift`, `EndGameCrisisState`), and `CRISIS_ARCHETYPE_CONFIGS`.
- `src/game/crisis/DimensionalRift.ts` (887 lines): Phase 1 anchor entity class (`DimensionalRift`), managing gravitational distortion, projectile attacks, tether lines, and bespoke visuals.
- `src/game/crisis/CrisisSovereign.ts` (1,071 lines): Phase 2 & 3 boss dreadnought class (`CrisisSovereign`), handling hull/core EHP, hex-barrier deflector shields, 6 vector art drawing pipelines, and boss HUD rendering.
- `src/game/crisis/EndGameCrisis.ts` (763 lines): Central encounter coordinator orchestrating warning incursion (3.0s), phase transitions, combat attack execution, bullet collision routing, and defeat resolution.
- `src/game/GameManager.ts` (2,040 lines): Engine lifecycle integrating End-Game Crisis at lines 47-66, 212-233, 318-354 (`triggerEndGameCrisis`), 396-403 (`spawnWave` evaluation), 704-745 (update & direct collision), 1175-1203 (wave victory & transition), 1233-1249 (player bullet collisions), and 1684-1695 & 1830-1834 (3-layer rendering).
- `src/components/game-canvas.tsx` (1,110 lines): React overlay rendering lines 965-1001 for the warning banner and active crisis badge.

---

### 1.2 The 6 Current Crisis Archetypes (Detailed Specifications)

| Archetype Enum | Title & Subtitle | Primary / Secondary / Accent / Glow Colors | Anchor Name & Phase 1 Mechanics | Sovereign Hull Visual & Weaponry |
|---|---|---|---|---|
| `VOID_SOVEREIGN` | **THE VOID SOVEREIGN**<br>*(EXTRA-DIMENSIONAL CATACLYSM)* | Primary: `#c084fc`<br>Secondary: `#1e1b4b`<br>Accent: `#38bdf8`<br>Core Glow: `#ec4899` | **Cosmic Singularity Rift**:<br>Gravitational vortex (radius 240px, force 45) pulling player and bending player bullets. Swirling accretion disk, event horizon. | Crystalline void dreadnought with floating psionic rift spikes on flanks, multifaceted purple armor, and central tracking singularity eye.<br>**Attacks**: 5-way dark matter spread (speed 220, `#c084fc`) + dual wing bolts (`#38bdf8`). |
| `ABYSSAL_LEVIATHAN` | **THE ABYSSAL LEVIATHAN**<br>*(CORRUPTED BIO-SWARM HORROR)* | Primary: `#10b981`<br>Secondary: `#022c22`<br>Accent: `#84cc16`<br>Core Glow: `#bef264` | **Bio-Brood Sack**:<br>Organic pulsating egg-sac with slime aura. Fires toxic bio-larvae spores periodically every 2.8s (speed 180, `#84cc16`, aimed at player). | Bio-mechanical kraken with chitin carapaces, segmented inner ribs, toxic glands, and 6 procedural waving spore tendrils.<br>**Attacks**: Spore Spiral (6 spores in rotating spiral, speed 190, `#84cc16`). |
| `CYBERNETIC_EXTERMINATOR` | **CYBERNETIC EXTERMINATOR MATRIX**<br>*(PURIFICATION DREADNOUGHT PROTOCOL)* | Primary: `#ef4444`<br>Secondary: `#0f172a`<br>Accent: `#06b6d4`<br>Core Glow: `#f97316` | **EMP Laser Defense Pylon**:<br>Hexagonal mechanical spire with inner power core. Fires high-tech shock rail bolts every 3.2s (speed 260, `#ef4444`). | Titanium fortress dreadnought with dual heavy orbital railguns in sponsons, hazard stripes, cooling vents, and central AI optic sensor.<br>**Attacks**: Dual heavy railgun beams (speed 380, 2 dmg, `#ef4444`) + aimed center cluster bolt (speed 280, `#06b6d4`). |
| `CHRONO_DEVOURER` | **THE CHRONO DEVOURER**<br>*(TEMPORAL PARADOX HARBINGER)* | Primary: `#fbbf24`<br>Secondary: `#78350f`<br>Accent: `#fef08a`<br>Core Glow: `#f59e0b` | **Tachyon Monolith**:<br>Golden clockwork obelisk with brass gears. Fires 3 accelerating tachyon needles every 2.5s (`#fbbf24`). Chronal field slows passing player bullets by up to 70%. | Astrolabe dreadnought with 3 concentric counter-rotating brass gear rings, stepped pyramid wing pylons, and pendulum optic.<br>**Attacks**: Phase 2 alternates Tachyon Lance (5 bolts, speed 380, `#fbbf24`) and Temporal Burst (wing echoes `#f59e0b` + center paradox `#fef08a`). Phase 3: 8-way tachyon starburst (speed 260). |
| `SOLARIS_COLOSSUS` | **SOLARIS COLOSSUS**<br>*(STELLAR HYPERGIANT DREADNOUGHT)* | Primary: `#f97316`<br>Secondary: `#451a03`<br>Accent: `#ef4444`<br>Core Glow: `#fef08a` | **Prominence Pillar**:<br>Molten basalt pillar firing 4 incendiary sparks every 3.0s (`#f97316`). Sweeping thermal laser tripwire connects left and right pillars (active 3.0s-3.8s in 4.0s cycle, 1 dmg). | Heavy basalt obsidian juggernaut with solar prominence horns, molten radiator slots, and thermonuclear furnace core.<br>**Attacks**: Phase 2 alternates Coronal Mass Ejection (3 heavy plasma fireballs, speed 220, 2 dmg, `#f97316`) and Prominence Sweep (dual wing beams speed 350, 2 dmg, `#ef4444` + center spark). Phase 3: 10-way rotating solar starburst (speed 240, 2 dmg, `#fef08a`). |
| `NEBULA_PHANTASM` | **THE NEBULA PHANTASM**<br>*(QUANTUM SPECTRAL SWARM)* | Primary: `#6366f1`<br>Secondary: `#0f172a`<br>Accent: `#06b6d4`<br>Core Glow: `#d946ef` | **Entangled Phase Pod**:<br>Phasing chrysalis connected by dual undulating quantum laser tethers. Fires 2 undulating spectral needles every 2.4s (speed 170). Alternates Coherent/Shifted resistance (Shifted takes 80% reduced damage). | Spectral manta-ray silhouette with trailing quantum mist tendrils, crystalline shield facets, and triple-pupil optic cluster.<br>**Attacks**: Phase 2 alternates Quantum Mirage Nova (6 criss-cross needles, speed 250, `#6366f1` / `#06b6d4`) and Spectral Homing Wisps (4 wisps aimed at player, speed 160). Phase 3: 12-way quantum nebula curtain (speed 200, `#d946ef` / `#6366f1`). |

---

### 1.3 The 5,200 EHP Standard Model

Every single archetype follows this mathematical invariant:
$$\text{Total EHP} = \text{Anchor Left (600)} + \text{Anchor Right (600)} + \text{Sovereign Hull (2,500)} + \text{Singularity Core (1,500)} = 5,200\text{ EHP}$$

- **Phase 1 (Anchors Active)**:
  - 2 Anchors $\times$ 600 HP = 1,200 EHP (23.08% of total encounter EHP).
  - Sovereign is invulnerable (`isInvulnerable = true`).
  - Bullet collisions with Sovereign in Phase 1 deal 0 damage and trigger deflection flash (`shieldFlashTimer = 0.12s`).
  - Pulsing animated conduit beams connect each anchor to the Sovereign's core center.
- **Phase 2 (Hull Exposed)**:
  - Triggered automatically when both anchors reach 0 HP (`activeRiftsCount === 0`).
  - Sovereign loses invulnerability (`isInvulnerable = false`).
  - Hull takes direct damage: 2,500 HP (48.08% of encounter EHP).
  - Archetype super-weapons fire at base cooldown (~2.0s - 2.2s).
- **Phase 3 (Singularity Core Overdrive / Enrage)**:
  - Triggered when `hullHp <= 0`.
  - Core takes direct damage: 1,500 HP (28.85% of encounter EHP).
  - Sovereign initiates an enrage clock: `enrageTimer = 35.0s`.
  - Attack cooldown accelerates drastically: interval shrinks to `1.4s`!
  - If `enrageTimer` expires ($\le 0$), `realityDistortionLevel = 1.0`.
  - Destroying the 1,500 core HP transitions to `CrisisPhase.DEFEATED`.

---

### 1.4 Spawning & GameManager Lifecycle Integration
Direct observations from `src/game/GameManager.ts`:
1. **Trigger Condition (`spawnWave()`, line 397)**:
   - Evaluated on non-boss waves (`level % 5 !== 0`) when `level >= 15`.
   - `isPityTrigger = this.level >= 18;`
   - `isRandomTrigger = Math.random() < 0.30;`
   - If either condition passes and `!this.endGameCrisis && !this.hasEndGameCrisisOccurred`, `this.triggerEndGameCrisis()` is called.
2. **Crisis Selection (`EndGameCrisis.startIncursion()`, lines 65-74)**:
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
   *Note*: Currently hardcoded as a 6-element literal array. Must be expanded to all 12 or use `Object.values(CrisisArchetype)`.
3. **Collision Architecture**:
   - `GameManager.checkCollisions()` (lines 1234-1249) passes player bullets to `this.endGameCrisis.handleBulletCollision()`.
   - Hits on rifts or hull reward scores: `damageDealt * 10` for rifts, `damageDealt * 15` for Sovereign hull/core. Also increments combo and charges ultimate gauge.
   - Direct physical collision between Sovereign body (260x130px) and Player (lines 716-728): deals 1 damage, triggers 1.0s invincibility, +40 stress, screen shake, and hit sound.
4. **Defeat Resolution**:
   - When `this.endGameCrisis.isDefeated()` evaluates true (lines 732-744): grants +2,000 score, +500 currency, +10 combo, 5.0s combo timer, massive yellow explosion (count 120, speed 3.0), 1.2s screen shake, and victory sound.
   - Cleared on wave completion when entering `GameState.SHOP` (lines 1195-1199).

---

## 2. Logic Chain

1. **Premise**: The project requirement is to double the End-Game Crisis archetypes from 6 to 12 (`R1. Massive Crisis Expansion (12 Types)`).
2. **From Observation 1.1 & 1.2**: Each archetype requires a distinct sci-fi/grand-strategy trope (e.g., Stellaris endgame crisis themes), bespoke color scheme, custom Phase 1 anchor with unique defensive/offensive behavior, bespoke Phase 2 & Phase 3 attack patterns, and custom Canvas 2D vector art for the Sovereign dreadnought hull.
3. **From Observation 1.3**: All 12 archetypes MUST strictly preserve the **5,200 EHP Invariant** (600 HP $\times$ 2 anchors + 2,500 Hull + 1,500 Core) and the **35.0s Enrage Clock** in Phase 3. Any deviation will break balance and fail automated tests (`CRISIS-02` in stress test, `DOUBLE-02` in doubling test).
4. **From Observation 1.4**: In `EndGameCrisis.startIncursion()`, the random roll is currently hardcoded with a 6-element array. To ensure all 12 archetypes spawn with **uniform random distribution**, `startIncursion()` must select from an expanded 12-element array or `Object.values(CrisisArchetype)`.
5. **From Existing Test Observations**:
   - `tests/unit/crisis_doubling.test.ts:65` asserts `expect(archetypes.length).toBe(6)`.
   - `tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts:357` asserts `expect(allArchetypes.length).toBe(6)`.
   - Therefore, expanding `CrisisArchetype` to 12 will intentionally cause these specific `toBe(6)` assertions to fail unless they are updated to `toBe(12)` or accommodated in the new test suite.

---

## 3. Caveats

1. **Read-Only Explorer Scope**: In accordance with user rules and instructions, this exploration performed zero code modifications. All source code changes must await explicit user approval.
2. **Sound Asset Re-use**: `SoundManager.ts` uses Web Audio API synthesized oscillators/envelopes (e.g., `playDarkMatterBeam`, `playAcidStormSound`, `playCrisisCataclysmSiren`). New archetypes should reuse these existing synthesized sounds or combine them, avoiding external audio file dependencies.
3. **Canvas Aspect Ratio & Mobile Viewport**: Vector drawing routines must remain strictly within logical bounds (`logicalWidth = 600`, `logicalHeight = 800`) to guarantee responsiveness without clipping on mobile screens.
4. **No other files in `src/game/` or `src/components/` need modification**: The crisis system is cleanly encapsulated in `src/game/crisis/`.

---

## 4. Conclusion & Extension Blueprint

To expand the game from 6 to 12 End-Game Crisis archetypes seamlessly, exactly **5 extension points** must be implemented:

### Extension Point 1: `src/game/crisis/types.ts`
1. Expand `CrisisArchetype` enum to 12:
   ```typescript
   export enum CrisisArchetype {
     VOID_SOVEREIGN = 'VOID_SOVEREIGN',
     ABYSSAL_LEVIATHAN = 'ABYSSAL_LEVIATHAN',
     CYBERNETIC_EXTERMINATOR = 'CYBERNETIC_EXTERMINATOR',
     CHRONO_DEVOURER = 'CHRONO_DEVOURER',
     SOLARIS_COLOSSUS = 'SOLARIS_COLOSSUS',
     NEBULA_PHANTASM = 'NEBULA_PHANTASM',
     // --- 6 New Archetypes ---
     STELLAR_HARVESTER = 'STELLAR_HARVESTER',     // Stellaris Dyson/Dark Matter Inversion
     NANITE_SWARM = 'NANITE_SWARM',               // Gray Goo / Self-Replicating Assembler
     ELDRITCH_OBLIVION = 'ELDRITCH_OBLIVION',     // Shroud/End of the Cycle entity
     GLITCH_SINGULARITY = 'GLITCH_SINGULARITY',   // Cybernetic Reality Corruptor
     CRYO_TYRANT = 'CRYO_TYRANT',                 // Absolute Zero Thermodynamic Stasis
     PLASMA_JUGGERNAUT = 'PLASMA_JUGGERNAUT',     // Antimatter Super-Collider Battleship
   }
   ```
2. Expand `CrisisAttackType` union with bespoke attack types for each new archetype (3 attacks each = 18 new attack types).
3. Populate `CRISIS_ARCHETYPE_CONFIGS` with 12 complete entries conforming to the 5,200 EHP model:
   - `riftHp: 600`
   - `sovereignHullHp: 2500`
   - `coreHp: 1500`
   - `enrageTime: 35.0`
   - Bespoke `primaryColor`, `secondaryColor`, `accentColor`, `coreGlowColor`, `vortexStrength`, and `baseFireRate`.

### Extension Point 2: `src/game/crisis/EndGameCrisis.ts`
1. In `startIncursion()`:
   - Update random selection to `const archetypes = Object.values(CrisisArchetype);` guaranteeing uniform 1/12 probability.
   - Add `vortexPullIntensity` assignments for the 6 new archetypes.
2. In `getArchetypeTitle()`:
   - Add 6 switch cases returning uppercase titles for the incursion banner.
3. In `executeArchetypeAttack()`:
   - Add 6 switch cases implementing Phase 2 alternating super-weapons and Phase 3 core enrage bullet bursts.

### Extension Point 3: `src/game/crisis/DimensionalRift.ts`
1. In constructor:
   - Add color and gravitational property branch for the 6 new archetypes.
   - Add particle hue generator cases for orbital motes.
2. In `update()`:
   - Implement Phase 1 anchor unique behaviors (e.g., Nanite replicators, Cryo slowing fields, Antimatter cluster bombs, Eldritch tentacles, Glitch stutter pulses, Plasma beam sweeps).
3. In `draw()`:
   - Add dedicated anchor drawing helper functions (`drawNaniteNode`, `drawCryoMonolith`, etc.).
   - Add conduit beam colors in `drawShieldConduit()`.
   - Add HP bar color overrides in `drawHealthBar()`.

### Extension Point 4: `src/game/crisis/CrisisSovereign.ts`
1. In `setupArchetypeColors()`:
   - Add 6 primary color mappings.
2. In `draw()`:
   - Add 6 switch cases routing to 6 new vector art drawing methods (`drawStellarHarvester`, `drawNaniteSwarm`, etc.).
3. Vector Art Hull implementations:
   - Draw 6 distinct Canvas 2D silhouettes (obsidian geometric wedges, organic Shroud tentacles, metallic nanite swarms, crystalline ice lattices, high-tech angular dreadnoughts).
4. In `drawBossHUD()`:
   - Add 6 switch cases setting `title`, `sub`, `primaryCol`, and `accentCol` for the boss banner and health gauge.

### Extension Point 5: Test Suite Updates & New Test Suite
1. Update `tests/unit/crisis_doubling.test.ts` line 65 and `tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts` line 357 to expect `12` archetypes instead of `6`.
2. Create dedicated headless unit test suite `tests/unit/crisis_expansion_12.test.ts` verifying:
   - Exactly 12 distinct enum members in `CrisisArchetype`.
   - 12 valid entries in `CRISIS_ARCHETYPE_CONFIGS` strictly obeying 5,200 EHP invariant.
   - Multi-phase state machine transitions across all 12 archetypes.
   - Bespoke Phase 1 anchor mechanics for all 6 new archetypes.
   - Phase 2 and Phase 3 attack pattern execution and bullet colors across all 12 archetypes.
   - Headless Canvas 2D vector rendering sanity (no unhandled exceptions) for all 12 archetypes across all 5 phases.
   - High-velocity player bullet collisions routing and damage gating.

---

## 5. Verification Method

To independently verify this investigation and validate downstream implementations:

1. **TypeScript Type-Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Result*: 0 errors.

2. **Run Existing Crisis Tests**:
   ```bash
   npx playwright test tests/unit/crisis_doubling.test.ts
   npx playwright test tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts
   ```
   *Expected Result*: All tests pass cleanly.

3. **Validate 5,200 EHP Invariant Verification Code Snippet**:
   ```typescript
   for (const arch of Object.values(CrisisArchetype)) {
     const cfg = CRISIS_ARCHETYPE_CONFIGS[arch];
     if (cfg.riftHp * 2 + cfg.sovereignHullHp + cfg.coreHp !== 5200) {
       throw new Error(`Archetype ${arch} violates 5,200 EHP standard!`);
     }
   }
   ```

4. **Invalidation Conditions**:
   - Any archetype where total encounter EHP $\ne$ 5,200.
   - Any archetype with missing vector art or unhandled switch statement.
   - Any archetype missing from `CRISIS_ARCHETYPE_CONFIGS` or `startIncursion()`.
   - Sovereign taking damage during Phase 1 while anchors are alive.

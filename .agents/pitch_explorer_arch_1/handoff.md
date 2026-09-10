# Architecture & Baseline Report: 12 Flagship Features Integration

**Agent**: `pitch_explorer_arch_1` (teamwork_preview_explorer)  
**Role**: Core Architecture & QA Explorer  
**Working Directory**: `/Users/user/src/water-invader/.agents/pitch_explorer_arch_1`  
**Date**: 2026-09-10  
**Target Repository**: `LeegwangYeol/water-invader` (Next.js 16.3.1 / React 19.2.8 / TypeScript 5 / Tailwind CSS 4)

---

## 1. Observation

### 1.1 Existing Game Engine Architecture Mapping

A comprehensive code inspection of the core game engine components revealed the following internal architecture:

| Component | File Path | Key Architectural Role | Core Subsystems / Mechanics |
| :--- | :--- | :--- | :--- |
| **Game Loop & Coordinator** | `src/game/GameManager.ts` (2,936 lines) | Orchestrates simulation timestep, state machine, entity collections, collision resolution, and layered rendering. | Fixed-timestep accumulator (`dt = 1/60s`), 3-layer rendering pipeline, screen shake, wave spawning, crisis triggers, dynamic biomes, sound triggers. |
| **Player Entity** | `src/game/Player.ts` (426 lines) | Encapsulates player state, motion kinematics, primary firing, homing missile pod, dynamic suppression & stress mechanics. | `speed: 300`, `hp: 3`, `maxHp: 5`, `baseFireRate: 0.5`, `multiShot: 1`, `piercing: 1`, `hasAcidShield: false`, `homingMissiles: 0..5`, `MISSILE_SPECS`. |
| **Enemy Entity & AI** | `src/game/Enemy.ts` (2,103 lines) | Defines 14 enemy archetypes (`EnemyType` 0..13), late-game scaling, friendly-fire suppression AI, and procedural vector art rendering. | Piecewise HP curves, stage 10+ aggression, lateral dodging, piercing multipliers, Saboteur barricade gnaw logic. |
| **Barricade System** | `src/game/Barricade.ts` (99 lines) | Voxel-based defensive cover (4 slots, 24 voxels each) with bidirectional damage/repair synchronization. | `cols = 6`, `rows = 4`, `maxHp = 20`, voxel array deconstruction on damage and reconstruction on heal. |
| **Allied Units** | `src/game/Helper.ts` (584 lines) | Implements squadron warp-in units with role hierarchies and overhead badges. | `HelperType`: `FIGHTER = 0`, `REPAIRER = 1`, `TANK = 2`, `MEDIC = 3`. Role badges `[⚔️ FIGHTER]`, `[💚 MEDIC]`, `[🔧 REPAIR BOT]`. |
| **Crisis System** | `src/game/crisis/` (4 files) | Modular multi-phase crisis system with 12 Stellaris-style archetypes and allied dreadnoughts. | `EndGameCrisis.ts`, `AlliedReinforcements.ts`, `CrisisSovereign.ts`, `DimensionalRift.ts`, `types.ts`. |
| **Sound System** | `src/game/SoundManager.ts` (663 lines) | 100% procedural Web Audio API audio synthesis engine with zero downloaded sound files. | Oscillator graphs, biquad filters, white/pink noise buffers, volume envelopes, mute toggling. |
| **React Viewport & HUD** | `src/components/game-canvas.tsx` (1,390 lines) | React integration wrapper managing `<canvas>`, pointer event scaling, Top HUD, Shop overlay, and mobile controls. | `CanvasCore`, `TopHUD`, `ShopOverlay`, `MobileControls`, CSS aspect ratio container, pointer coordinate scaling. |

### 1.2 Verification of Strict Architectural Invariants

#### A. Logical Coordinate Invariants (`GameManager.ts` and `Enemy.ts`)
Direct inspection of `GameManager.ts` and `Enemy.ts` confirms the exact values and usage of coordinate space constants:

- **`src/game/GameManager.ts:159-160`**:
  ```typescript
  159:   public readonly logicalWidth: number = 600;
  160:   public readonly logicalHeight: number = 800;
  ```
- **`src/game/GameManager.ts:178-180`**:
  ```typescript
  178:     this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  179:     this.canvas.width = this.logicalWidth * this.dpr;
  180:     this.canvas.height = this.logicalHeight * this.dpr;
  ```
- **`src/game/Enemy.ts:116, 122-123`**:
  ```typescript
  116:   constructor(x: number, y: number, canvasWidth: number = 720, level: number = 1, type: EnemyType = EnemyType.NORMAL, canvasHeight: number = 960) {
  ...
  122:     this.canvasWidth = Number.isFinite(canvasWidth) ? Math.max(100, canvasWidth) : 720;
  123:     this.canvasHeight = Number.isFinite(canvasHeight) ? Math.max(100, canvasHeight) : 960;
  ```
- **`src/game/GameManager.ts:742, 766, 863`**:
  ```typescript
  742:   const boss = new Enemy(this.logicalWidth / 2 - 75, 90, this.logicalWidth, this.level, EnemyType.BOSS, this.logicalHeight);
  766:   this.enemies.push(new Enemy(x, y, this.logicalWidth, this.level, type, this.logicalHeight));
  863:   this.enemies.push(new Enemy(offsetX + c * paddingX, startY + r * paddingY, this.logicalWidth, this.level, type, this.logicalHeight));
  ```
*Observation*: `GameManager` enforces a fixed internal coordinate grid of $600 \times 800\text{ px}$. When `GameManager` instantiates `Enemy`, it explicitly passes `this.logicalWidth` ($600$) and `this.logicalHeight` ($800$). `Enemy.ts` retains default parameters of $720$ and $960$ for standalone testing. **Neither set of numbers can be modified without causing severe regression in existing Playwright tests.**

#### B. Strictly CSS-Based Responsiveness
Inspection of `src/components/game-canvas.tsx` reveals how responsiveness is handled without modifying logical dimensions:
- **`src/components/game-canvas.tsx:1159-1166`**:
  ```tsx
  1159: <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-2 sm:border-4 border-blue-900 shadow-2xl bg-slate-900">
  1160:   {/* Canvas Viewport (Memoized container, DPR buffer sizing protected) */}
  1161:   <CanvasCore
  1162:     canvasRef={canvasRef}
  1163:     onPointerDown={handleCanvasPointerDown}
  1164:     onPointerMove={handleCanvasPointerMove}
  1165:     onPointerUp={handleCanvasPointerUp}
  1166:   />
  ```
- **`src/components/game-canvas.tsx:234-241`**:
  ```tsx
  234: <canvas
  235:   onPointerDown={onPointerDown}
  ...
  240:   className="w-full h-full block bg-slate-900 touch-none select-none"
  241: />
  ```
- **`src/components/game-canvas.tsx:1037-1042`**:
  ```typescript
  1037: const rect = canvas.getBoundingClientRect();
  1038: const logicalWidth = gameManagerRef.current.logicalWidth;
  1039: const scaleX = logicalWidth / contentWidth;
  1040: const logicalHeight = gameManagerRef.current.logicalHeight;
  1041: const scaleY = logicalHeight / contentHeight;
  1042: const canvasX = (clientX - offsetX) * scaleX;
  ```
*Observation*: The `<canvas>` DOM element occupies $100\%$ of a container styled with Tailwind's `aspect-[3/4]` ($600/800 = 0.75$). Device pixel ratio scaling ($dpr$) is applied exclusively to the canvas buffer (`canvas.width = 600 * dpr`), and pointer inputs are converted to logical coordinates via `scaleX = 600 / contentWidth`. Logical coordinates remain 100% decoupled from physical CSS display sizes.

### 1.3 Baseline Verification Results

The baseline build and test suites were executed with the following results:

1. **Typecheck (`npx tsc --noEmit`)**:
   - Command: `npx tsc --noEmit`
   - Exit code: `0`
   - Errors: `0` (clean pass)
2. **Production Build (`npm run build`)**:
   - Command: `next build` (Next.js 16.3.1 Turbopack)
   - Exit code: `0`
   - Compilation time: `700ms`
   - TypeScript verification: `774ms`
   - Static page generation: `5/5 in 216ms`
   - Output routes: `/`, `/_not-found`, `/manifest.webmanifest`
3. **Playwright Feature Expansion Suites (`tests/17`, `tests/18`, `tests/19`)**:
   - Suite 17: `tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts` -> **6/6 passed (5.0s)**
   - Suite 18: `tests/18_allied_reinforcements_and_roles.spec.ts` -> **5/5 passed**
   - Suite 19: `tests/19_barricade_saboteur_and_repair.spec.ts` -> **5/5 passed**
   - Combined run of Suites 18 & 19: **10/10 passed (5.8s)**
4. **Unit Simulation Suite (`tests/unit/`)**:
   - Command: `npx playwright test tests/unit/`
   - Exit code: `0`
   - Results: **300 passed (9.6s)** across all mathematical, physics, homing missile, and pre-game shop test cases.

---

## 2. Logic Chain

### 2.1 Invariant Preservation Logic
1. **Observation**: `GameManager.ts:159-160` sets `logicalWidth: 600` and `logicalHeight: 800`. Playwright tests in `tests/` (e.g. `17`, `18`, `19`, and unit tests in `tests/unit/physics_and_math.test.ts`) assert exact entity bounds, spawn positions, barricade offsets (`logicalWidth / 2 - 25`), and collision envelopes.
2. **Inference**: If any worker alters `logicalWidth` or `logicalHeight` in `GameManager.ts`, or alters constructor defaults in `Enemy.ts`, the entire Playwright test suite will break immediately.
3. **Conclusion**: All 12 Flagship Features must accept `logicalWidth` and `logicalHeight` as injected constants from `GameManager`, clamping all positions within $[0, 600]$ and $[0, 800]$.

### 2.2 Parallel Worker Concurrency & Collision Hazards Logic
1. **Observation**: `GameManager.ts` is already 2,936 lines long. If 40+ implementation agents attempt to directly modify `GameManager.ts` to insert 12 distinct flagship features (torpedoes, lasers, harpoons, vents, darkness, chassis, crew, mutations, automatons, bosses, endless mode, sonar HUD), frequent git merge conflicts and file corruptions will occur.
2. **Inference**: By isolating feature logic into dedicated modules in `src/game/flagship/` and introducing a single facade/director (`FlagshipManager.ts`), specialist workers can implement, test, and refine each feature in dedicated files without touching each other's code.
3. **Conclusion**: The modular architecture must place each flagship system in its own directory under `src/game/flagship/`, exposing uniform lifecycle hooks (`init`, `update`, `drawBackground`, `drawWorld`, `drawForeground`, `handleInput`, `reset`).

### 2.3 Layered Render Pipeline Alignment Logic
1. **Observation**: `GameManager.ts:2402-2717` structures rendering into three explicit layers:
   - Layer 1: Static Background Layer (biomes, threat radial vignette, ambient particles, drawn without screen shake).
   - Layer 2: World Entity Layer (barricades, player, helpers, enemies, bullets, hazard columns, drawn with screen shake).
   - Layer 3: Stable Foreground Layer (boss HP bar, perimeter warnings, HUD, banners, drawn without screen shake).
2. **Inference**: Each of the 12 Flagship Features maps neatly into these existing layers:
   - Vents & Currents: Layer 1 (background drift) + Layer 2 (steam plume column).
   - Darkness & Searchlights: Layer 3 (destination-out mask) or Layer 1/2 composite.
   - Weapons, Bio-Horrors, Automatons, Bosses: Layer 2 (world entities).
   - Sonar HUD, Spectrogram, Crew Badges, Glass Stress Fractures: Layer 3 (foreground HUD).
3. **Conclusion**: The `FlagshipManager` interface must provide distinct render hooks corresponding directly to Layers 1, 2, and 3.

---

## 3. Modular File Structure Architecture for the 12 Flagship Features

To allow parallel implementation by multiple specialist workers without file collisions, the following modular file structure in `src/game/flagship/` is architected:

```
src/game/flagship/
├── index.ts                               # Unified exports and public facade
├── types.ts                               # Shared flagship interfaces, enums, DTOs
├── FlagshipManager.ts                     # Central lifecycle orchestrator and GameManager hook
│
├── weapons/                               # GROUP 1: ADVANCED WEAPONS & KINETIC SYSTEMS
│   ├── CavitationTorpedo.ts               # Feature 1: Supercavitating torpedo, suction well, shockwave
│   ├── BioluminescentLaser.ts             # Feature 2: Photic lance raycast, heat mechanics, overheat lockout
│   ├── RefractionPrism.ts                 # Feature 2: Hexagonal quartz prism entity, 3-way/5-way beam splitter
│   └── HydraulicHarpoon.ts                # Feature 3: Pneumatic harpoon, damped spring tether, slingshot winch
│
├── environment/                           # GROUP 2: ENVIRONMENTAL HAZARDS & LIGHTING
│   ├── HydrothermalVent.ts                # Feature 4: Black smoker chimneys, thermal updrafts, steam lances
│   ├── OceanCurrent.ts                    # Feature 4: Stratified shear drift vectors, hydrodynamic drag
│   └── BiolapseDarknessCycle.ts           # Feature 5: 4-phase darkness state machine, searchlight cone, battery
│
├── progression/                           # GROUP 3: SUBMERSIBLE CHASSIS & CREW DECK
│   ├── ModularChassis.ts                  # Feature 6: 5 Submersible hulls (Nautilus, Stingray, Leviathan, Ghost, Kraken)
│   ├── ChassisRadarChart.ts               # Feature 6: Canvas 2D hexagonal stat radar rendering
│   └── CrewOfficerDeck.ts                 # Feature 7: 4 Bridge officers (Ingrid, Jax, Ren, Lyra), perks & active abilities
│
├── factions/                              # GROUP 4: FACTIONS & APEX ENCOUNTERS
│   ├── HadalBioHorrors.ts                 # Feature 8: Chitin Hive (Clinger, Siphoner, Colossus, Angler)
│   ├── EpigeneticMutationEngine.ts        # Feature 8: Damage profile telemetry and reactive counter-mutations
│   ├── AutomatonPhalanx.ts                # Feature 9: Ancient Automaton fleet (Aegis Drone, EMP Prowler, Rail Sentinel)
│   ├── AutomatonShieldGrid.ts             # Feature 9: Hexagonal phalanx shield wall link & damage sharing
│   └── KrakenPrimeBoss.ts                 # Feature 10: Multi-stage apex boss (Tentacles IK, Charybdis Maw, Ink Blackout)
│
├── modes/                                 # GROUP 5: NOVEL GAME MODES
│   ├── EndlessDescent.ts                  # Feature 11: Roguelike mode manager, hydrostatic pressure, strata loop
│   ├── BathymetricDAG.ts                  # Feature 11: Procedural node map generator (Combat, Shrine, Cache, Boss)
│   └── BoonDraftDeck.ts                   # Feature 11: 24 curated boons (Common, Rare, Legendary, Cursed)
│
└── sensory/                               # GROUP 6: SENSORY IMMERSION & HUD
    ├── TacticalSonarHUD.ts                # Feature 12: Polar range rings, 360° phosphor sweep, contact blooms
    ├── HydrophoneSpectrogram.ts           # Feature 12: Web Audio AnalyserNode FFT waterfall spectrum
    └── HullStressFX.ts                    # Feature 12: Claustrophobic cockpit glass fractures, acoustic groan triggers
```

### Worker Allocation Matrix (Zero-Collision Mapping)
Each feature is assigned to dedicated files, allowing parallel work streams:

| Feature # | Feature Name | Primary Assigned Files | Secondary Files |
| :--- | :--- | :--- | :--- |
| **F-01** | Cavitation Torpedo | `src/game/flagship/weapons/CavitationTorpedo.ts` | `SoundManager.ts` (implosion audio) |
| **F-02** | Bioluminescent Laser & Prisms | `src/game/flagship/weapons/BioluminescentLaser.ts`, `RefractionPrism.ts` | `SoundManager.ts` (laser hum) |
| **F-03** | Hydraulic Harpoon & Slingshot | `src/game/flagship/weapons/HydraulicHarpoon.ts` | `SoundManager.ts` (tension creak) |
| **F-04** | Hydrothermal Vents & Currents | `src/game/flagship/environment/HydrothermalVent.ts`, `OceanCurrent.ts` | `GameManager.ts` (layer 1 background) |
| **F-05** | Biolapse Darkness & Searchlight | `src/game/flagship/environment/BiolapseDarknessCycle.ts` | `Player.ts` (headlight prow) |
| **F-06** | Modular Chassis & Hangar | `src/game/flagship/progression/ModularChassis.ts`, `ChassisRadarChart.ts` | `Player.ts` (base stats injection) |
| **F-07** | Veteran Crew Officer Deck | `src/game/flagship/progression/CrewOfficerDeck.ts` | `components/game-canvas.tsx` (ability buttons) |
| **F-08** | Hadal Bio-Horrors & Mutation | `src/game/flagship/factions/HadalBioHorrors.ts`, `EpigeneticMutationEngine.ts` | `Enemy.ts` (enum values 14..17) |
| **F-09** | Ancient Automaton Phalanx Grid | `src/game/flagship/factions/AutomatonPhalanx.ts`, `AutomatonShieldGrid.ts` | `Enemy.ts` (enum values 18..20) |
| **F-10** | Kraken Prime / Charybdis Boss | `src/game/flagship/factions/KrakenPrimeBoss.ts` | `Enemy.ts` (enum value 21) |
| **F-11** | Endless Descent Roguelike Mode | `src/game/flagship/modes/EndlessDescent.ts`, `BathymetricDAG.ts`, `BoonDraftDeck.ts` | `components/game-canvas.tsx` (DAG overlay) |
| **F-12** | Tactical Sonar HUD & Stress FX | `src/game/flagship/sensory/TacticalSonarHUD.ts`, `HydrophoneSpectrogram.ts`, `HullStressFX.ts` | `SoundManager.ts` (sonar ping) |

---

## 4. Integration Touchpoints Detail

### 4.1 `GameManager.ts` Touchpoints

1. **Facade Initialization**:
   - In `GameManager.constructor`:
     ```typescript
     this.flagshipManager = new FlagshipManager(this.logicalWidth, this.logicalHeight);
     ```
   - In `init(preserveUpgrades, isContinue)`:
     ```typescript
     this.flagshipManager.reset(preserveUpgrades, isContinue);
     ```
2. **Update Loop (`GameManager.update`)**:
   - Inside `update(deltaTime)`:
     ```typescript
     this.flagshipManager.update(deltaTime, {
       player: this.player,
       enemies: this.enemies,
       bullets: this.bullets,
       barricades: this.barricades,
       helpers: this.helpers,
       particles: this.particles,
       level: this.level,
       score: this.score,
       currency: this.currency,
       createExplosion: (x, y, color, count, scale) => this.createExplosion(x, y, color, count, scale),
       triggerScreenShake: (duration, amount) => this.triggerScreenShake(duration, amount)
     });
     ```
3. **Render Pipeline Integration (`GameManager.draw`)**:
   - **Layer 1 (Background)**:
     ```typescript
     // Immediately after ambient biome particles (line ~2512):
     this.flagshipManager.drawBackground(this.ctx, time);
     ```
   - **Layer 2 (World Entities, inside Screen Shake)**:
     ```typescript
     // Alongside world entities (line ~2534):
     this.flagshipManager.drawWorld(this.ctx, time);
     ```
   - **Layer 3 (Foreground / HUD, outside Screen Shake)**:
     ```typescript
     // After warning banners (line ~2715):
     this.flagshipManager.drawForeground(this.ctx, time);
     ```
4. **Input Dispatcher (`GameManager.handleKeyDown` / `handleKeyUp`)**:
   - Dispatch keys:
     - `C` / `X`: Cavitation Torpedo launch & detonation.
     - `Space` / `Shift`: Harpoon tether & winch.
     - `F`: Headlight searchlight toggle / high-beam.
     - `1`, `2`, `3`, `4`: Crew bridge abilities (Ingrid, Jax, Ren, Lyra).
5. **Wave Spawning & Enemy Lifecycle**:
   - When spawning wave hostiles, check if Endless Mode or specialized faction wave is active; spawn Hadal Bio-Horrors or Automaton Phalanxes.
   - At wave completion, invoke `flagshipManager.onWaveComplete(this.level)`.

### 4.2 `Player.ts` Touchpoints

1. **Chassis Stats Injection**:
   - Introduce `public applyChassis(chassis: SubmersibleChassis): void` to set:
     - `this.maxHp = chassis.baseHp`
     - `this.speed = chassis.speed`
     - `this.size.width = chassis.hitbox.width`, `this.size.height = chassis.hitbox.height`
     - `this.activeChassisType = chassis.type`
2. **Kinetic Modifiers**:
   - In `Player.update()`:
     - Apply drag from latched Parasite Clingers (`-25%` speed per clinger).
     - Apply current shear forces from `OceanCurrent`.
3. **Searchlight Origin**:
   - Expose `public getSearchlightProw(): Vector2D` returning `{ x: this.position.x + this.size.width / 2, y: this.position.y }`.
4. **Procedural Vector Silhouette**:
   - In `Player.draw()`:
     - Delegate to chassis-specific vector rendering (`drawNautilus`, `drawStingray`, `drawLeviathan`, `drawGhost`, `drawKraken`).

### 4.3 `Enemy.ts` Touchpoints

1. **Enum Expansion**:
   - Add new `EnemyType` values without modifying existing 0..13 values:
     ```typescript
     // Flagship Factions
     HADAL_CLINGER = 14,
     HADAL_SIPHONER = 15,
     HADAL_COLOSSUS = 16,
     HADAL_ANGLER = 17,
     AUTOMATON_AEGIS = 18,
     AUTOMATON_EMP = 19,
     AUTOMATON_SENTINEL = 20,
     KRAKEN_PRIME = 21,
     ```
2. **AI & Defense Interceptors**:
   - `AutomatonPhalanxDrone`: Deflects frontal non-piercing bullets when within $60^\circ$ forward arc.
   - `CarapaceColossus`: Reduces frontal non-piercing damage by $85\%$.
   - `HadalHirudinea (Clinger)`: On collision with player, latches instead of immediate destruction.
3. **Procedural Rendering**:
   - Add vector path routines for Hadal Chitin Hive, Ancient Automatons, and Kraken Prime.

### 4.4 `src/components/game-canvas.tsx` & UI Touchpoints

1. **Pre-Game & Continue Hangar Modal**:
   - `<ChassisSelector />`: Component displaying the 5 chassis with interactive Hexagonal Radar Chart.
   - `<CrewDeckSelector />`: Component for assigning 4 bridge officers.
   - `<ModeSelector />`: Toggle between Classic Arcade and Endless Descent Roguelike Mode.
2. **In-Game HUD Overlays**:
   - Bridge Officer quick-cast ability icons with numeric cooldown sweep.
   - Headlight Battery & Cavitation Torpedo Reserve indicators.
   - Hydrophone spectrogram canvas element or direct canvas HUD waterfall.
   - Mobile touch buttons for secondary actions (`[TORPEDO]`, `[HARPOON]`, `[LIGHT]`, `[CREW 1..4]`).

### 4.5 `SoundManager.ts` Touchpoints

Add procedural Web Audio API synthesis methods:
- `playCavitationLaunch()`: Rising turbine sine ($120\text{ Hz} \to 780\text{ Hz}$) + bandpass noise.
- `playImplosionThud()`: Exponential pitch drop ($52\text{ Hz} \to 18\text{ Hz}$) with wave shaper distortion.
- `playAudioVoidDuck()`: Temporary lowpass ramp down to $250\text{ Hz}$ for $50\text{ ms}$.
- `playLaserHum(frequency, heatRatio)`: Frequency-modulated triangle/saw wave.
- `playHarpoonTension(strainRatio)`: High-tension FM wire creak.
- `playSonarPing(frequency, doppler)`: Pure $880\text{ Hz}$ tone with long synthetic decay.
- `playOrganicChitinCrack()`: Highpass white noise burst ($2.4\text{ kHz}$).
- `playAutomatonEMP()`: Electrical arcing flutter ($1.8\text{ kHz}$).

---

## 5. Caveats

1. **Web Audio API Gesture Activation**:
   - `AudioContext` requires a user interaction gesture (`pointerdown`, `keydown`) to resume from `suspended` state in modern browsers. This is already safely handled in `SoundManager.init()`, but tests running in headless Playwright must ensure user interaction is simulated before expecting audio output.
2. **Canvas 2D Batching & Performance**:
   - With multiple new visual systems (marine snow, searchlights, sonar rings, laser blooms), all path operations must be batched (`ctx.beginPath()`, single `ctx.stroke()` or `ctx.fill()`) to maintain a strict $60\text{ FPS}$ frame budget without frame drops or GC pauses.
3. **Testing Scope & Execution Time**:
   - Running the full suite of 943 Playwright tests takes several minutes. For rapid developer iteration, workers should run their feature-specific tests (e.g. `npx playwright test tests/flagship/01_*.spec.ts`) and unit tests (`npx playwright test tests/unit/`), reserving the full 943-test suite for milestone integration passes.

---

## 6. Conclusion

1. **System Readiness**: The Water Invader codebase is in an exceptionally healthy state. The build compiles with zero TypeScript errors, and all baseline unit and E2E suites pass with $100\%$ success.
2. **Architectural Safety**: The strict invariants (`GameManager` logical dimensions $600 \times 800$, `Enemy` constructor defaults $720 \times 960$, and CSS-only responsiveness via `aspect-[3/4]`) have been fully mapped and protected.
3. **Modular Plan**: The proposed `src/game/flagship/` modular architecture and `FlagshipManager` facade isolate all 12 Flagship Features into dedicated submodules. This ensures that a massive swarm of specialist agents can implement, verify, and deliver the entire *Abyssal Odyssey* expansion without merge collisions or regressions.

---

## 7. Verification Method

### 7.1 Verification Commands
To independently verify the architectural baseline and test suite:

```bash
# 1. Type-check verification
npx tsc --noEmit

# 2. Production build verification
npm run build

# 3. Dynamic background & threat signifiers suite (M1)
npx playwright test tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts

# 4. Allied reinforcements & roles suite (M2)
npx playwright test tests/18_allied_reinforcements_and_roles.spec.ts

# 5. Barricade saboteur & repair suite (M3)
npx playwright test tests/19_barricade_saboteur_and_repair.spec.ts

# 6. Comprehensive unit simulation suite (300 tests)
npx playwright test tests/unit/
```

### 7.2 Invalidation Conditions
The architectural findings and baseline established in this report are invalidated if:
1. `logicalWidth` (600) or `logicalHeight` (800) in `GameManager.ts` is modified.
2. Default arguments in `Enemy.ts` (`canvasWidth = 720`, `canvasHeight = 960`) are modified.
3. Responsive scaling in `src/components/game-canvas.tsx` ceases to be CSS-based or breaks aspect ratio mapping.
4. Existing `EnemyType` numerical assignments ($0\text{..}13$) are shifted or reordered.

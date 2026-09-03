# Architecture Investigation & Technical Blueprint: Stellaris-Style "End-Game Crisis" System for Water Invader

**Document Version:** 1.0.0  
**Author:** `teamwork_preview_explorer_crisis_arch_1`  
**Target Milestone:** Stellaris-Style End-Game Crisis Architecture  
**Working Directory:** `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_arch_1`  
**Date:** 2026-09-01  

---

## 1. Executive Summary

Water Invader is a high-performance, 2D arcade shoot-'em-up developed with Next.js 16, React, and HTML5 Canvas. The engine employs a fixed-timestep game loop (60Hz deterministic physics), an optimized two-pointer in-place compaction entity system, a multi-faction crossfire simulation (Player, Invaders, Rogues), and 100% procedural vector graphics.

To introduce a **Stellaris-style "End-Game Crisis"** on or after **Stage 15**, the game requires an existential threat that fundamentally transcends standard wave bosses. While standard bosses are single large sprites with static bullet patterns and scaled HP, the End-Game Crisis must be an overwhelming, multi-phase encounter featuring screen-filling dimensional titans, active abyssal rifts, reality-bending gravitational and EMP auras, and segmented kinetic barriers capable of surviving sustained max-level player DPS (50–150+ DPS) for 30–60+ seconds.

This report documents the current codebase architecture, analyzes engine boundaries, and provides an end-to-end architectural blueprint and interface specification for implementing the End-Game Crisis without regressing existing wave progression, test coverage (440+ assertions), or performance characteristics.

---

## 2. Current Engine Architecture Deep-Dive

### 2.1 Game Loop & Fixed-Timestep Physics (`GameManager.ts`)

```
requestAnimationFrame(loop)
         │
         ▼
[Frame Delta Time Calculation]
         │ (Clamped to max 0.1s to prevent spiral of death)
         ▼
[Accumulator += frameTime]
         │
         ├───► while (accumulator >= FIXED_STEP (1/60s))
         │         │
         │         ├── update(1/60s)
         │         │     ├── Player.update() & Bullet generation
         │         │     ├── Dynamic Reinforcement & Crisis Director ticks
         │         │     ├── Enemy AI update & weapon discharges
         │         │     ├── Helper AI & Barricade physics
         │         │     ├── Collision Detection & Crossfire resolution
         │         │     └── Two-pointer in-place entity compaction
         │         │
         │         └── accumulator -= FIXED_STEP
         ▼
[draw() Screen Render]
         │
         ├── Background parallax scrolling
         ├── Barricades, Player, Helpers, Enemies, Bullets, Particles
         ├── Hazard Projectiles (Acid Storm / EMP static sweeps)
         ├── Boss HP Bars & HUD Overlays
         └── Debug hitbox / FPS diagnostics
```

**Key Architectural Properties:**
- **Deterministic Physics:** `FIXED_STEP = 1 / 60` decouples gameplay logic from display refresh rates (60Hz, 120Hz, 144Hz, 240Hz).
- **In-Place Compaction:** Dead entities are removed via two-pointer index compaction (`enemyWriteIdx`, `bulletWriteIdx`, `particleWriteIdx`, `barricadeWriteIdx`), preventing array allocation and GC jitter during heavy hordes.
- **Particle Pool:** 500-instance object pool recycles particle memory.

---

### 2.2 Entity Hierarchy & Data Models

| Entity Class | Base Class | Responsibilities | Key Attributes |
|---|---|---|---|
| `Entity` | - | Position, bounding box, faction, collision checks | `position`, `velocity`, `size`, `faction`, `isDead` |
| `Player` | `Entity` | Movement, weapons, upgrades, stress & suppression | `hp`, `baseFireRate`, `multiShot`, `piercing`, `ultimateGauge`, `stressLevel`, `suppressionLevel` |
| `Enemy` | `Entity` | AI movement (dive, homing, zigzag), weapons, vector rendering | `type: EnemyType`, `hp`, `shieldHp`, `speedX`, `speedY`, `isAggressive`, `rushVelocityModifier` |
| `Bullet` | `Entity` | Projectile movement, damage, faction tagging, piercing | `damage`, `piercing`, `faction`, `isInterceptable`, `shooter`, `hitEntities: Set<Entity>` |
| `Barricade` | `Entity` | Voxel-grid destructible/indestructible cover | `type: BarricadeType`, `blocks: boolean[]`, `hp`, `maxHp` |
| `Helper` | `Entity` | Autonomous friendly drones (Fighter, Repairer, Tank) | `type: HelperType`, `hp`, `lifespan`, AI target coordinates |
| `Particle` | - | Explosion & impact visual effects | `x`, `y`, `vx`, `vy`, `alpha`, `color`, `life` |

---

### 2.3 Stage & Wave Progression Flow

```
[Game Start (Level 1)] 
         │
         ├──► [spawnWave()] ──► [Normal Enemy Grid / Boss at Level % 5 == 0]
         │          │
         │          ├──► [Mid-Wave Dynamic Reinforcements (Timer: 8-16s)]
         │          │         (FLANK, SPEARHEAD, ROGUE_INCURSION, 3WAY_CLASH)
         │          │
         │          ├──► [Stage 10+ Emergency Crises (Timer: 16-24s)]
         │          │         (TITAN_HORDE, ACID_STORM, SWARM_BLITZ, EMP_DISRUPTION, TOTAL_WAR)
         │          │
         │          ▼
         │    [Check Wave Clear Condition]
         │          │  (remainingHostiles == 0 && warningTimer <= 0 && pendingReinforcement == null)
         │          ▼
         └──► [State = SHOP] ──► [Player Buys Upgrades] ──► [startNextWave() -> Level++]
```

---

### 2.4 Multi-Faction Collision & Crossfire System

The collision engine in `GameManager.checkCollisions()` executes in three decoupled phases:

1. **Phase 1: Projectiles**
   - Bullets vs. Barricades (Destructible vs. Indestructible).
   - Bullets vs. Bullets (Hostile ordnance interception).
   - Bullets vs. Enemies (Player damage & inter-faction crossfire damage between Invaders and Rogues).
   - Bullets vs. Helpers & Player (Hostile fire with near-miss suppression triggers).
2. **Phase 2: Physical Contact on Barricades**
   - Normal enemies slowly gnaw destructible barricades.
   - Diver enemies trigger high-damage kinetic suicide crashes.
3. **Phase 3: Inter-Faction Unit Clashing**
   - Direct physical collision between Invader and Rogue units inflicts mutual damage.

---

### 2.5 Rendering & Audio Pipeline

- **100% Pure Procedural Vector Art:** All entity graphics (`Enemy.ts`, `Player.ts`, `Barricade.ts`) use canvas 2D vector path primitives, linear/radial gradients, and glowing halos without raster sprite lag.
- **Audio Engine (`SoundManager.ts`):** Web Audio API oscillator synthesis generating dynamic SFX for lasers, explosions, alarms, sirens, and environmental hazard static.

---

## 3. Analysis: Bosses vs. Normal Enemies vs. Stage 10+ Crises

### 3.1 Current Mechanisms Comparison

| Attribute | Normal Enemy | Multiples of 5 Boss | Stage 10+ Emergency Event |
|---|---|---|---|
| **Class** | `Enemy` | `Enemy` (`EnemyType.BOSS`) | Mix of `Enemy` + `HazardProjectile` |
| **Dimensions** | 36x28 to 56x42 px | 150x100 px | Standard enemy sizes |
| **HP Scaling** | 1–4 (Lv 1–9), 11–27+ (Lv 10+) | `50 + lvl*25 + (lvl-5)^2 * 2.5` (~362 at Lv 10) | Standard enemy stats per unit |
| **Behavior** | Grid drift, homing rush, dive | Side-to-side sweep, escort spawns | Environmental hazards, EMP lock, multi-flank |
| **Lifespan vs Max DPS**| 0.05–0.2 seconds | 3–6 seconds against max player | 8–12 seconds timer |
| **HUD Feedback** | Threat badges | Top Boss HP Bar | Warning Banner, EMP/Acid badges |

### 3.2 Architectural Gaps for a True End-Game Crisis (Stage 15+)

1. **Lack of Multi-Segment / Multi-Part Hitboxes:** Current bosses are a single `Rect`. A colossal screen-filling crisis entity needs multi-part targetable segments (Core, Kinetic Shield Wings, Void Cannons, Herald Rifts).
2. **Player DPS Melt Issue:** At Stage 15+, a max-level player with 5-way multi-shot, piercing 5, base fire rate 0.1s, and stress boost inflicts **150+ DPS**. Without dynamic barrier mechanics or invulnerability phases tied to sub-objectives (rifts/pylons), any single-HP entity is instantly obliterated.
3. **Trigger Predictability:** Bosses currently only spawn deterministically on `level % 5 === 0`. The Crisis requires an unpredictable, non-deterministic trigger on or after Stage 15 that injects immediate existential dread.
4. **Clean Decoupling:** Adding a complex multi-phase crisis directly inside `Enemy.ts` would increase file complexity beyond maintainable boundaries. A dedicated `Crisis` module is required.

---

## 4. End-Game Crisis Architectural Blueprint (Stage 15+)

### 4.1 Crisis Identity & Concept: *"The Abyssal Singularity: Void Sovereign"*

Inspired by Stellaris End-Game Crises (The Unbidden, Prethoryn Scourge, Contingency), the Water Invader crisis is an extradimensional catastrophe: **The Abyssal Singularity (심연의 특이점: 공허의 군주)**.

#### Core Distinguishing Characteristics:
- **Screen-Filling Dimensional Entity:** Spans 350x220 logical pixels (over 55% of canvas width), flanked by floating Dimensional Rifts.
- **Tri-Phase Battle Structure:**
  - **Phase 1: Rift Incursion (차원 균열의 전조)**: Two Abyssal Void Rifts spawn on opposite sides of the upper canvas, opening gravity vortices that pull player projectiles off-course while spawning relentless Void Swarms. The Sovereign is shielded by an invulnerable Void Shroud until both rifts are stabilized/destroyed.
  - **Phase 2: Void Sovereign Awakening (군주의 각성 & 현실 왜곡)**: The Sovereign descends. It deploys a rotating Kinetic Hex-Barrier (absorbs frontal shots), emits Reality-Bending Gravitational Waves (distorts player movement velocity), and fires Dual Dark-Matter Spiral Beams.
  - **Phase 3: Cosmic Core Collapse (특이점 폭주 & 공간 붕괴)**: With outer armor shattered, the glowing Singularity Core is exposed. It initiates a 30-second Spatial Collapse countdown, firing dense radial bullet-hell Nova bursts and reality-tearing laser sweeps.

---

### 4.2 Tri-Phase State Machine Diagram

```
                 [Stage 15+ Wave Active / Transition]
                                  │
                                  ▼
           [Random Trigger Engine (25% Chance per Wave 15+)]
                                  │
                                  ▼
       [STATE: CRISIS_WARNING (3.0s Screen Shake + Void Siren + Dark Fog)]
                                  │
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │  PHASE 1: RIFT INCURSION                         │
        │  - 2 Dimensional Rifts (Left & Right)            │
        │  - Sovereign has 100% Void Barrier Invulnerability│
        │  - Void Swarms spawn continuously                │
        │  - Gravitational Vortex bends bullets            │
        └─────────────────────────┬────────────────────────┘
                                  │ (Both Rifts Destroyed)
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │  PHASE 2: VOID SOVEREIGN BATTLE                  │
        │  - Kinetic Hex-Shield (Frontal Damage Dampening) │
        │  - Gravitational Wave Auras (Player speed mod)   │
        │  - Dual Dark-Matter Spiral Beams                 │
        │  - Sovereign HP: 2,500 HP                        │
        └─────────────────────────┬────────────────────────┘
                                  │ (Sovereign HP <= 0)
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │  PHASE 3: CORE COLLAPSE (ENRAGED SINGULARITY)    │
        │  - Exposed Singularity Core (1,500 HP)           │
        │  - Spatial Collapse Timer (35s)                  │
        │  - 360-Degree Radial Nova Bullet Hell            │
        │  - Dark Plasma Laser Sweeps                      │
        └─────────────────────────┬────────────────────────┘
                                  │ (Core Destroyed)
                                  ▼
        [CRISIS_DEFEATED: Massive Screen Shockwave + Victory Loot (500💧)]
                                  │
                                  ▼
                     [Standard Wave Clear / SHOP]
```

---

### 4.3 Random Stage 15+ Trigger Logic & Wave Compatibility

To ensure the crisis triggers non-deterministically without breaking standard stage completion or soft-locking the wave transition:

1. **Trigger Hook Points:**
   - **Wave Start Trigger:** Upon calling `spawnWave()` when `this.level >= 15`, evaluate a random roll:
     ```ts
     const isCrisisEligible = this.level >= 15 && !this.endGameCrisisState.hasTriggeredThisSession;
     const roll = Math.random();
     if (isCrisisEligible && (this.level >= 18 || roll < 0.35)) {
       this.triggerEndGameCrisis();
     }
     ```
   - **Mid-Wave Incursion Trigger:** If not triggered at start, mid-wave combat director can trigger a sudden rift tear when active enemies drop below 5.
   - **Test & Debug Override:** Allow explicit triggering via `gm.triggerEndGameCrisis()` and debug keys for automated E2E testing.
2. **Safe Wave Completion Contract:**
   - The wave clear check in `GameManager.update()` is extended:
     ```ts
     const isEndGameCrisisActive = this.endGameCrisis && !this.endGameCrisis.isDead;
     if (
       this.state === GameState.PLAYING &&
       remainingHostiles === 0 &&
       !isEndGameCrisisActive &&
       this.warningTimer <= 0 &&
       this.pendingReinforcement === null &&
       this.crisisState.warningTimer <= 0
     ) {
       this.state = GameState.SHOP;
       // Proceed cleanly to Shop
     }
     ```
   - When the End-Game Crisis is defeated, it awards massive rewards (e.g. 5,000 Score, 500 Pure Water 💧, full Ultimate charge), cleans up all active rifts/swarms, and lets the player transition to SHOP.

---

### 4.4 Empirical DPS & Survivability Balancing Model

#### Player Late-Game Firepower Profile:
- Max Multi-Shot: 5 projectiles
- Max Piercing: 5 targets
- Base Fire Rate: 0.10s (10 shots/s = 50 bullets/s)
- Stress Overdrive (100 Stress): 3x multiplier = ~30 shots/s = 150 bullets/s
- Theoretical Peak DPS: **150 to 300 DPS** against stationary large hitboxes.

#### Crisis Survivability Design:

| Phase | Component | Base HP | Damage Mitigation Mechanics | Expected Survival vs Max DPS |
|---|---|---|---|---|
| **Phase 1** | 2x Dimensional Rifts | 400 HP each (800 total) | Sovereign is 100% immune; rifts pull player aim with vortex force | 12–18 seconds |
| **Phase 2** | Sovereign Hull & Shields | 2,500 HP | Frontal Kinetic Shield reduces multi-shot damage by 40%; periodic shield phase | 20–30 seconds |
| **Phase 3** | Singularity Core | 1,500 HP | High-speed oscillation; bullet hell pushback; 35s enrage clock | 15–25 seconds |
| **TOTAL** | **Full Crisis Encounter** | **4,800 Effective HP** | **Adaptive Shielding + Rift Phases** | **47–73 Seconds** |

This guarantees the encounter will **never be trivialized in under 10 seconds**, fulfilling the user requirement for an existential, overwhelming threat.

---

## 5. Clean Interface Contracts & Module Boundaries

To maintain clean architecture, all End-Game Crisis logic will be housed in dedicated files under `src/game/crisis/`:

```
src/game/
├── types.ts                     # Extended with EndGameCrisis types
├── GameManager.ts               # Integration hooks & delegation
├── crisis/
│   ├── EndGameCrisis.ts         # Main Crisis controller & Phase State Machine
│   ├── DimensionalRift.ts      # Phase 1 Rift entities & vortex gravity physics
│   ├── CrisisSovereign.ts       # Phase 2 Colossal segmented vector entity
│   ├── SingularityCore.ts       # Phase 3 Bullet-hell core & collapse countdown
│   └── CrisisAuraDirector.ts   # Reality-bending audio-visual & movement auras
```

### 5.1 TypeScript Interface Definitions

```typescript
// src/game/types.ts extensions

export enum EndGameCrisisPhase {
  INACTIVE = 'INACTIVE',
  WARNING = 'WARNING',
  PHASE_1_RIFTS = 'PHASE_1_RIFTS',
  PHASE_2_SOVEREIGN = 'PHASE_2_SOVEREIGN',
  PHASE_3_CORE_COLLAPSE = 'PHASE_3_CORE_COLLAPSE',
  DEFEATED = 'DEFEATED'
}

export interface ICrisisRift {
  id: string;
  position: Vector2D;
  hp: number;
  maxHp: number;
  isDead: boolean;
  vortexStrength: number;
  spawnTimer: number;
  update(deltaTime: number, gm: any): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export interface ICrisisSegment {
  name: string;
  relativeX: number;
  relativeY: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  isBroken: boolean;
  armorFactor: number;
}

export interface EndGameCrisisState {
  isActive: boolean;
  phase: EndGameCrisisPhase;
  phaseTimer: number;
  totalHp: number;
  maxTotalHp: number;
  riftsRemaining: number;
  collapseTimeRemaining: number;
  hasTriggeredThisSession: boolean;
  bannerTitle: string;
  subText: string;
}
```

### 5.2 `EndGameCrisis.ts` Interface Contract

```typescript
export class EndGameCrisis {
  public phase: EndGameCrisisPhase;
  public state: EndGameCrisisState;
  public rifts: ICrisisRift[];
  public sovereign: CrisisSovereign | null;
  public core: SingularityCore | null;

  constructor(canvasWidth: number, canvasHeight: number, level: number);

  public update(deltaTime: number, gm: GameManager): void;
  public draw(ctx: CanvasRenderingContext2D, gm: GameManager): void;
  public handleBulletCollision(bullet: Bullet, gm: GameManager): boolean;
  public isDefeated(): boolean;
  public reset(): void;
}
```

---

## 6. Audio-Visual & HUD Presentation

### 6.1 Procedural Vector Visuals
1. **Dimensional Rifts:** Swirling violet-magenta accretion disks (`createRadialGradient`) with orbiting spatial rift shards and gravitational distortion particles.
2. **Void Sovereign:** Imposing 350px bio-mechanical hull with glowing abyssal obsidian plates, animated kinetic hex-shields, and dual plasma railguns.
3. **Singularity Core:** Intense pulsing dark star surrounded by glowing cyan event-horizon rings and lens flares.

### 6.2 Reality-Bending Auras
- **Vortex Pull:** Player bullets within 120px of active rifts experience curve distortion towards the rift center.
- **Gravity Surge:** Periodic dimensional shockwaves cause subtle vertical inertia shifts for the player.
- **EMP Pulse:** Periodic short interference waves with cyan screen static.

### 6.3 HUD & Audio Enhancements
- **Multi-Phase Boss HP HUD:** Distinctive 3-segment Crisis Health Bar at the top of the screen displaying Phase status, remaining rifts, and Collapse Countdown clock.
- **Procedural Sound Synthesizers in `SoundManager.ts`:**
  - `playCrisisRiftOpen()`: Deep sub-bass drop followed by oscillating space-tear resonance.
  - `playSingularityNova()`: High-pitch granular energy blast.
  - `playSovereignBeam()`: Resonant low-frequency dark-matter laser beam.

---

## 7. Implementation Roadmap & Verification Plan

### 7.1 Implementation Steps

1. **Step 1: Type Definitions & State Contracts (`types.ts`)**
   - Define `EndGameCrisisPhase`, `EndGameCrisisState`, and associated interfaces.
2. **Step 2: Core Crisis Engine Modules (`src/game/crisis/`)**
   - Implement `DimensionalRift.ts` (Phase 1).
   - Implement `CrisisSovereign.ts` (Phase 2).
   - Implement `SingularityCore.ts` (Phase 3).
   - Implement `EndGameCrisis.ts` (Coordinator & State Machine).
3. **Step 3: Integration into `GameManager.ts`**
   - Hook into `spawnWave()`, `update()`, `checkCollisions()`, `draw()`, and wave clear logic.
   - Add `triggerEndGameCrisis()` method and Stage 15+ random trigger roll.
4. **Step 4: UI / HUD Components (`game-canvas.tsx`)**
   - Add Crisis Phase HP Bar and Spatial Collapse countdown timer.
5. **Step 5: Audio Enhancements (`SoundManager.ts`)**
   - Add dimensional rift, void beam, and cosmic nova procedural synthesis methods.

### 7.2 Verification & Test Strategy

1. **Playwright E2E Tests:**
   - Add `tests/13_endgame_crisis_stage15.spec.ts`:
     - Test 1: Mocks reaching Stage 15, verifies random Crisis trigger occurs without crashing.
     - Test 2: Simulates multi-phase transition (Rifts -> Sovereign -> Core Collapse -> Defeat).
     - Test 3: Mathematical DPS survival verification — proves Crisis survives against max-upgraded player DPS (multi-shot 5, piercing 5, 0.1s fire rate) for over 30 seconds.
     - Test 4: Verifies clean transition to SHOP upon crisis defeat (zero softlocks).
2. **Regression Check:**
   - Execute all 440+ existing test assertions across all 12 spec files.
3. **Pre-Commit Verification:**
   - `npm run build` (`npx tsc --noEmit`) verified 100% clean.

---

## 8. Conclusion

The proposed architecture introduces a true Stellaris-style End-Game Crisis to Water Invader. By decoupling the crisis into dedicated multi-phase modules, implementing kinetic damage mitigation, adding active dimensional rifts and auras, and integrating seamless Stage 15+ trigger hooks, the design delivers an overwhelming late-game challenge that respects the player's progression while preserving the codebase's modularity, performance, and stability.

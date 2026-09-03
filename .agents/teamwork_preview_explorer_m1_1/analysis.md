# Milestone 1 Deep Analysis: Crisis Types, Entities & Vector Visuals
**Water Invader — Stellaris-Style End-Game Crisis System**
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_m1_1`
**Author**: Teamwork Preview Explorer (M1)

---

## 1. Executive Summary & Architectural Scope

The objective of **Milestone 1** is to establish the foundational architecture for the Stellaris-style End-Game Crisis system. Unlike standard bosses in Water Invader (which possess 500–1,000 HP and simple zig-zag or diving patterns), the End-Game Crisis is a multi-phase existential cataclysm commanding an effective health pool of **3,500–8,000 EHP** with reality-bending environmental mechanics, flanking dimensional rift anchors, and 100% procedural vector graphics.

### Core Architecture Principles:
1. **Zero External Image Dependencies**: Adheres strictly to the project's pure procedural HTML5 Canvas 2D vector art direction (no raster assets/PNGs/JPGs). All visual assets are rendered dynamically using Bezier curves, radial/linear gradients, glowing path strokes, animated trigonometric harmonic tentacles, and mathematical hex-grid forcefields.
2. **Clean Module Encapsulation (`src/game/crisis/`)**: All crisis entities and state managers reside inside a dedicated submodule:
   - `src/game/crisis/types.ts`
   - `src/game/crisis/DimensionalRift.ts`
   - `src/game/crisis/CrisisSovereign.ts`
   - `src/game/crisis/EndGameCrisis.ts`
   - `src/game/crisis/index.ts`
3. **Compatibility with Existing Game Loop**: Full interoperability with `Entity.ts`, `Bullet.ts`, `Player.ts`, `SoundManager.ts`, and `GameManager.ts`.
4. **Deterministic Multi-Phase Progression**:
   - **Phase 1 (Shield / Rifts)**: 2 Flanking Dimensional Rift Anchors (600 HP each = 1,200 HP total). Sovereign is 100% invulnerable while tethered to active rifts.
   - **Phase 2 (Hull Assault)**: Sovereign hull exposed (2,400 HP base). Employs dark-matter lance beams, grav-wave pulses, and void homing torpedoes.
   - **Phase 3 (Core Overdrive / Enrage)**: Cosmic Core Collapse (1,800 HP base). 35-second enrage countdown, gravitational vortex suction, and 16-spoke radial Nova bullet hell spirals.
   - **Total Base EHP**: 5,400 HP (scales up to 7,200+ on higher loops).

---

## 2. Type Contracts (`src/game/crisis/types.ts`)

The crisis type system cleanly separates crisis archetypes, phase state machines, entity interfaces, and combat parameter objects while remaining fully compatible with `src/game/types.ts`.

```typescript
import { Vector2D, Size, Rect, Faction } from '../types';

/**
 * The 3 distinct Stellaris-style Crisis Archetypes
 */
export enum CrisisArchetype {
  VOID_SOVEREIGN = 'VOID_SOVEREIGN',               // Psionic Warp Crisis: Ethereal Void Flagship + Singularity
  ABYSSAL_LEVIATHAN = 'ABYSSAL_LEVIATHAN',         // Bio-Swarm Crisis: Regenerating Bio-mechanical Kraken
  CYBERNETIC_EXTERMINATOR = 'CYBERNETIC_EXTERMINATOR', // Machine Matrix Crisis: Sentient AI Purification Matrix
}

/**
 * Tri-Phase progression state machine
 */
export enum CrisisPhase {
  INCURSION = 'INCURSION',             // Warning alert & dimensional breach transition (3.0s)
  PHASE_1_SHIELD = 'PHASE_1_SHIELD',   // Dimensional Rifts active, Sovereign invulnerable (100% Shroud)
  PHASE_2_HULL = 'PHASE_2_HULL',       // Rifts destroyed, direct hull combat + gravitational auras
  PHASE_3_CORE = 'PHASE_3_CORE',       // Core Overdrive / Cosmic Collapse (35s Enrage Timer + Nova Bullet Hell)
  DEFEATED = 'DEFEATED',               // Crisis defeated, supernova dispersion & wave victory
}

/**
 * Attack behaviors and pattern tags
 */
export enum CrisisAttackPattern {
  IDLE = 'IDLE',
  VOID_LANCE = 'VOID_LANCE',                   // Concentrated forward energy beam
  GRAVITATIONAL_PULL = 'GRAVITATIONAL_PULL',   // Singularity vortex pulling player/bullets
  SINGULARITY_ORBS = 'SINGULARITY_ORBS',       // Cluster of dense tracking void orbs
  NOVA_BURST = 'NOVA_BURST',                   // Radial 16-32 bullet spiral hell
  TENTACLE_SWEEP = 'TENTACLE_SWEEP',           // Sweeping kinetic tentacle hazard
  DEFLECTOR_BEAM = 'DEFLECTOR_BEAM',           // Projectile-reflecting energy wave
  RIFT_SUMMON = 'RIFT_SUMMON',                 // Rifts spawning voidling escorts
}

/**
 * Interface contract for all Crisis combat participants
 */
export interface ICrisisEntity {
  position: Vector2D;
  velocity: Vector2D;
  size: Size;
  hp: number;
  maxHp: number;
  isDead: boolean;
  isInvulnerable: boolean;
  phase: CrisisPhase;
  faction: Faction;
  hitFlashTimer: number;
  
  getRect(): Rect;
  getHitBox(): Rect;
  takeDamage(damage: number, sourceFaction: Faction): boolean;
  update(deltaTime: number, ...args: any[]): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

/**
 * Interface for Dimensional Rift Anchors
 */
export interface ICrisisRift extends ICrisisEntity {
  riftId: string;
  anchorIndex: number; // 0 = Left Anchor, 1 = Right Anchor
  tetherTarget: Vector2D;
  pulsePhase: number;
  spawnTimer: number;
  getTetherEnd(): Vector2D;
}

/**
 * Gravitational vortex physics descriptor
 */
export interface CrisisVortex {
  center: Vector2D;
  radius: number;
  pullForce: number;
  duration: number;
  isActive: boolean;
}

/**
 * Comprehensive snapshot of End-Game Crisis state
 */
export interface EndGameCrisisState {
  isActive: boolean;
  archetype: CrisisArchetype;
  phase: CrisisPhase;
  warningTimer: number;
  totalHp: number;
  maxHp: number;
  phaseHp: number;
  phaseMaxHp: number;
  enrageTimer: number;
  maxEnrageTimer: number;
  vortex: CrisisVortex | null;
  riftsAlive: number;
  totalRifts: number;
  bannerTitle: string;
  bannerSubtitle: string;
  isEnraged: boolean;
}
```

---

## 3. Dimensional Rift Anchor (`src/game/crisis/DimensionalRift.ts`)

### 3.1 Class Specification
- **Inheritance**: Extends `Entity` and implements `ICrisisEntity`, `ICrisisRift`.
- **Dimensions & Positions**:
  - `size`: width = 48, height = 48
  - Left Anchor: placed at `x = 70`, `y = 120`
  - Right Anchor: placed at `x = canvasWidth - 118`, `y = 120`
- **Health**: `hp = 600`, `maxHp = 600` (Total 1,200 HP across two anchors).
- **Core Mechanics**:
  - Emits a continuous psionic tether beam directly to Sovereign Core `(targetX, targetY)`.
  - While either anchor is alive, Sovereign has `isInvulnerable = true`.
  - Periodically emits void pulses every 3.5s and fires void projectile spirals toward the player.
  - Takes full damage from player projectiles (and crossfire); on hit, triggers hit flash and sparks.
  - On death: Triggers screen shake, generates 40 void particles, plays rift collapse sound, and severs tether.

### 3.2 Procedural Vector Rendering Details
1. **Outer Gravitational Accretion Disk**:
   - Rotating dual elliptical halos with `ctx.rotate(time * 2.5)` and `ctx.rotate(-time * 1.8)`.
   - Gradient: Radial gradient `#a855f7` (Purple) -> `#6b21a8` (Deep Amethyst) -> `rgba(15, 5, 29, 0)`.
2. **Singularity Core Event Horizon**:
   - Deep obsidian void circle `ctx.arc(cx, cy, 14, 0, Math.PI * 2)` filled with `#090514`.
   - Inner event horizon ring with neon cyan/magenta rim `#e879f9` and `shadowBlur = 15`.
3. **Inward Swirling Particle Inflow**:
   - 6 spiral arms mathematically calculated:
     $$r(\theta) = r_0 \cdot (1 - 0.5 \cdot t_{pulse}), \quad \theta = i \cdot \frac{2\pi}{6} + \text{time} \cdot 3.0$$
4. **Psionic Tether Energy Beam**:
   - Bezier curve from Rift Center to Sovereign Core Center with oscillating sine wave displacement:
     ```typescript
     const midX = (riftCenterX + sovereignCoreX) / 2 + Math.sin(time * 8) * 12;
     const midY = (riftCenterY + sovereignCoreY) / 2 + Math.cos(time * 8) * 8;
     ctx.beginPath();
     ctx.moveTo(riftCenterX, riftCenterY);
     ctx.quadraticCurveTo(midX, midY, sovereignCoreX, sovereignCoreY);
     ctx.strokeStyle = '#c084fc';
     ctx.lineWidth = 3 + Math.sin(time * 10) * 1.5;
     ctx.shadowColor = '#d946ef';
     ctx.shadowBlur = 12;
     ctx.stroke();
     ```
5. **Anchor Health Meter**:
   - Arc health gauge encircling the rift $(-\frac{\pi}{2} \text{ to } -\frac{\pi}{2} + 2\pi \cdot \frac{hp}{maxHp})$.

---

## 4. Crisis Sovereign Flagship (`src/game/crisis/CrisisSovereign.ts`)

### 4.1 Class Specification
- **Inheritance**: Extends `Entity` and implements `ICrisisEntity`.
- **Dimensions**: `size`: width = 240, height = 180 (centered at `x = (canvasWidth - 240) / 2`, `y = 45`).
- **Health Architecture**:
  - `Phase 1 (Shielded)`: `isInvulnerable = true`. HP stays at maximum.
  - `Phase 2 (Hull)`: 2,400 HP.
  - `Phase 3 (Cosmic Core)`: 1,800 HP with 35s Enrage Timer.
  - Overall Effective Health: **5,400 EHP** (combined with anchors).
- **Faction**: `Faction.INVADER` (participates in crossfire vs Rogue units while focusing player).

### 4.2 Procedural Vector Rendering Architecture
Every component of the Sovereign is procedurally computed in local space $(cx, cy)$:

```
           [ Crown Psionic Spire / Event Sensor ]
                      /             \
       [ Left Wing Armor ]   [ Core Reactor ]   [ Right Wing Armor ]
        /      |      \             |             /      |      \
   [Tentacle 1] [Tentacle 2]  [Singularity Disk]   [Tentacle 5] [Tentacle 6]
         \             /                          \             /
          [Tentacle 3]                              [Tentacle 4]
```

#### Detailed Path & Visual Specs:
1. **Dreadnought Carapace Hull**:
   - Heavy segmented interstellar armor plates rendered with multi-stop linear and radial gradients:
     - Top Shell: `#1e1035` -> `#3b0764` -> `#581c87` -> `#7e22ce` -> `#a855f7`.
     - Sub-armor ribbing with neon highlights (`#c084fc`, `lineWidth = 2`).
   - Symmetrical angular wing bastions flanking the main chassis extending to $cx \pm 110$.
2. **Sinuous Undulating Void Tentacles (6 Total)**:
   - 3 tentacles on the left flank ($x = cx - 80, -50, -25$), 3 on the right flank ($x = cx + 25, +50, +80$).
   - Rendered using segmented 4-point cubic Bezier curves with trigonometric phase delays:
     $$y_1 = cy + 40, \quad x_{\text{ctrl1}} = x_{\text{base}} + \sin(t \cdot 4 + i \cdot 0.9) \cdot 18$$
     $$y_2 = cy + 90, \quad x_{\text{ctrl2}} = x_{\text{base}} + \sin(t \cdot 5 + i \cdot 1.1 + 1) \cdot 28$$
     $$y_{\text{tip}} = cy + 140 + \cos(t \cdot 3 + i) \cdot 15, \quad x_{\text{tip}} = x_{\text{base}} + \sin(t \cdot 4 + i) \cdot 38$$
   - Tentacle stroke: Gradient from `#7e22ce` (Violet) to `#e879f9` (Bright Orchid) tapering from width 8 down to 2 with glowing tips.
3. **Singularity Reactor Core (The Heart of the Cataclysm)**:
   - Located at $(cx, cy + 15)$.
   - Radius: Base 26px, expanding up to 34px during Phase 3 enrage.
   - **Glow Shroud**: Triple-stop radial gradient:
     - Stop 0.0: `#ffffff` (Pure white singularity center)
     - Stop 0.3: `#f0abfc` (Vivid neon psionic magenta)
     - Stop 0.6: `#9333ea` (Deep cosmic purple)
     - Stop 1.0: `rgba(15, 5, 29, 0)` (Event horizon shadow fade)
   - **Coronal Accretion Flares**: 8 pulsating rotational energy filaments spinning at $\omega = 4.0 \, \text{rad/s}$.
4. **Hexagonal Forcefield Shield Lattice (Phase 1 & Shielded States)**:
   - When `isInvulnerable === true`, a massive pulsating hexagonal forcefield dome envelops the sovereign ($R = 135\text{px}$).
   - Mathematical Hexagonal Tessellation:
     $$\text{Hex}(i): \left( cx + R \cos\left(\frac{i\pi}{3} + t\right), cy + R \sin\left(\frac{i\pi}{3} + t\right) \right), \quad i \in [0, 5]$$
   - Concentric inner hexagons with pulsing opacity ($0.25 + 0.15 \sin(t \cdot 6)$) and hex sub-facets reflecting incoming player fire.
5. **Phase 3 Enrage Visual Transformation**:
   - Carapace cracks open with glowing orange-crimson interior energy (`#ef4444` -> `#f97316`).
   - Singularity Core pulses at double frequency ($12\,\text{Hz}$), casting violent screen-wide gravitational distortion rings.
   - 35-Second Enrage Countdown circular dial rendered above the sovereign crown with flashing warning runes.

---

## 5. EndGameCrisis Coordinator (`src/game/crisis/EndGameCrisis.ts`)

`EndGameCrisis` serves as the encapsulated controller managing the lifecycle, combat interactions, reality-bending physics, and HUD rendering.

### 5.1 Lifecycle & Phase Flow

```
[Level >= 15 Trigger] (30% roll / pity Wave 18)
        │
        ▼
[INCURSION ALERT] (3.0s Warning Siren, Screen Shake, Cataclysm Banner)
        │
        ▼
[PHASE 1: SHIELD] (Sovereign Invulnerable + 2 Rift Anchors @ 600 HP)
        │  (Player destroys both Rift Anchors)
        ▼
[PHASE 2: HULL] (Sovereign Hull Exposed @ 2,400 HP + Grav Auras)
        │  (Sovereign reaches <= 1,800 HP / Phase 2 threshold)
        ▼
[PHASE 3: CORE ENRAGE] (Core Collapse @ 1,800 HP + 35s Enrage Timer + Nova Bullet Hell)
        │  (Player defeats Sovereign before timer reaches 0)
        ▼
[DEFEATED] (Massive Supernova Shockwave + Victory SFX + Shop Transition Guard Lifted)
```

### 5.2 Key Methods and Responsibilities

```typescript
export class EndGameCrisis {
  public state: EndGameCrisisState;
  public sovereign: CrisisSovereign | null = null;
  public rifts: DimensionalRift[] = [];
  public projectiles: Bullet[] = [];
  
  constructor(canvasWidth: number = 600, canvasHeight: number = 800);
  
  public initiateIncursion(archetype: CrisisArchetype = CrisisArchetype.VOID_SOVEREIGN): void;
  public update(deltaTime: number, playerPos: Vector2D, playerBullets: Bullet[]): Bullet[];
  public draw(ctx: CanvasRenderingContext2D): void;
  public drawHUD(ctx: CanvasRenderingContext2D, canvasWidth: number): void;
  public checkPlayerBulletCollisions(bullets: Bullet[]): { damagedHp: number; kills: number };
  public getVortexPull(pos: Vector2D): Vector2D | null;
  public isCrisisActive(): boolean;
  public isVictory(): boolean;
  public isEnraged(): boolean;
  public getTotalRemainingHp(): number;
  public getTotalMaxHp(): number;
}
```

### 5.3 Gravitational Vortex Physics Calculation
During Phase 2 & 3, the Singularity creates a real-time inward gravitational field pulling the player and non-piercing bullets towards the Sovereign Core $(cx, cy)$:

$$\vec{F}_{\text{vortex}}(x, y) = \frac{G \cdot M}{(r + \epsilon)^2} \cdot \hat{u}_r$$

- Clamped with a soft inner radius to prevent uncontrollable snapping while creating high-tension maneuvering challenges.
- Inward drag vector is returned by `getVortexPull(player.position)` and applied directly inside `Player.update()` or `GameManager.update()`.

---

## 6. Procedural Audio Synthesis (`src/game/SoundManager.ts`)

To complement the pure vector visuals, the End-Game Crisis introduces 5 new Web Audio synthesis procedures in `SoundManager.ts` using native oscillators, gain envelopes, and frequency ramps without external sound files.

| Method Name | Waveform | Frequency Ramp Profile | Gain Envelope | Aesthetic Purpose |
|-------------|----------|------------------------|---------------|-------------------|
| `playCataclysmWarning()` | Sawtooth + Square Dual | $960 \to 720 \to 1280 \to 640 \to 480\,\text{Hz}$ | $0.35 \to 0.01$ (3.0s) | 5-Tone descending planetary cataclysm siren |
| `playDarkMatterBeam()` | Triangle + Sawtooth | $180 \to 420 \to 90\,\text{Hz}$ sweep | $0.28 \to 0.01$ (0.8s) | Deep resonant void lance hum and beam burst |
| `playDimensionalWarp()` | Sine + FM modulation | $60 \to 880 \to 220\,\text{Hz}$ exponential | $0.30 \to 0.01$ (0.6s) | Reality-bending space rift distortion sound |
| `playRiftCollapse()` | Sawtooth + White Noise | $450 \to 40\,\text{Hz}$ with resonance | $0.40 \to 0.01$ (0.9s) | Heavy mechanical-psionic anchor explosion |
| `playCrisisPhaseTransition()` | Triangle + Sub-bass | $80 \to 320 \to 50\,\text{Hz}$ crescendo | $0.45 \to 0.01$ (1.2s) | Dramatic cinematic phase shift explosion |

---

## 7. Crisis HUD Visual Specifications

The End-Game Crisis features a dedicated top-screen Boss HUD bar designed in Canvas 2D:

1. **Cataclysm Title & Archetype Badge**:
   - Font: `bold 13px 'Press Start 2P', monospace, sans-serif`.
   - Text: `VOID SOVEREIGN — PSIONIC CATACLYSM` with glowing neon purple shadow.
2. **Tri-Segment Health Gauge Bar**:
   - Centered horizontally (`width = 440px`, `height = 14px`, `y = 18px`).
   - Frame: Gold-trimmed cybernetic border with beveled corners.
   - **Segment 1 (Anchors)**: Cyan/Magenta segmented fill ($1,200\,\text{HP}$).
   - **Segment 2 (Hull)**: Deep Violet/Indigo fill ($2,400\,\text{HP}$).
   - **Segment 3 (Core)**: Brilliant Magenta/White fill ($1,800\,\text{HP}$).
3. **Phase Badges & Anchor Status Indicators**:
   - Twin diamond icons representing Left and Right Rift Anchors (Active: Glowing Cyan $\blacklozenge$, Destroyed: Dim Grey $\lozenge$).
4. **Phase 3 Enrage Timer Dial**:
   - When in Phase 3, a pulsating warning badge shows `CORE COLLAPSE IN: XX.Xs` with a circular radial progress ring turning from Yellow $\to$ Orange $\to$ Flashing Red when time $< 10\text{s}$.

---

## 8. File & Export Inventory (Milestone 1)

```
src/game/crisis/
├── types.ts              // Crisis enums, interfaces, ICrisisEntity, EndGameCrisisState
├── DimensionalRift.ts    // Flanking anchor entity, invulnerability tether, void summon
├── CrisisSovereign.ts    // Dreadnought flagship, multi-jointed tentacles, singularity core
├── EndGameCrisis.ts      // Coordinator, multi-phase state machine, vortex physics, HUD
└── index.ts              // Barrel export for clean GameManager integration
```

---

## 9. Verification & Quality Matrix

| Component | Target File | Verification Criteria |
|-----------|-------------|-----------------------|
| Type Definitions | `src/game/crisis/types.ts` | Complete TypeScript contracts, 0 compilation errors (`npx tsc --noEmit`). |
| Dimensional Rift Anchor | `src/game/crisis/DimensionalRift.ts` | 600 HP, accurate flanking coordinates, procedural accretion disk rendering, tether beam math. |
| Crisis Sovereign Flagship | `src/game/crisis/CrisisSovereign.ts` | 240x180 bounds, pure Canvas 2D vector hull, 6 animated undulating tentacles, pulsing core, hex forcefield. |
| EndGameCrisis Manager | `src/game/crisis/EndGameCrisis.ts` | Phase state machine transitions, vortex physics math, 5,400+ EHP pool tracking, HUD rendering. |
| Audio Procedures | `src/game/SoundManager.ts` | 5 Web Audio synthesis functions, graceful suspended context handling, zero audio clipping. |
| Vector Art Integrity | Rendering Specs | 100% zero-raster dependency verified. |

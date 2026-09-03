# Project: Water Invader — 12-Crisis Massive Expansion

## Architecture

Water Invader is a Next.js / TypeScript web application powered by HTML5 Canvas, React state management, and Web Audio procedural synthesis. The End-Game Crisis subsystem is cleanly isolated in `src/game/crisis/` and orchestrated via `GameManager.ts`.

### Subsystem Breakdown

1. **`src/game/crisis/types.ts`**:
   - **`CrisisArchetype` Enum**: Defines all 12 crisis archetypes:
     - 6 Existing: `VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`, `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, `NEBULA_PHANTASM`.
     - 6 New: `BIOMORPHIC_SWARM`, `SINGULARITY_CORE`, `NANITE_HARVESTER`, `PSIONIC_SHROUD`, `GLACIAL_OBLIVION`, `COSMIC_DEVOURER`.
   - **`CrisisPhase` Enum**: `INCURSION` (3.0s warning), `PHASE_1_SHIELD` (Anchors active, Sovereign shielded), `PHASE_2_HULL` (Anchors destroyed, Hull exposed), `PHASE_3_CORE` (Hull depleted, Core exposed with 35.0s enrage clock), `DEFEATED` (Resolution & rewards).
   - **`CRISIS_ARCHETYPE_CONFIGS` Dictionary**: Contains immutable balance configurations for all 12 archetypes, strictly enforcing the 5,200 EHP invariant (`riftHp: 600`, `sovereignHullHp: 2500`, `coreHp: 1500`, `enrageTime: 35.0`).
   - **`CrisisAttackType` Union**: Defines all primary, secondary, and enrage attack types across the 12 archetypes.

2. **`src/game/crisis/DimensionalRift.ts`**:
   - Manages Phase 1 flanking anchor entities instantiated at $(50, 170)$ and $(\text{logicalWidth}-130, 170)$ (size 80x80px, 600 HP each).
   - Houses unique Phase 1 mechanics: gravitational pull/push, brood seeker spores, railgun charges, tachyon needles, solar tripwire beams, quantum phase shifting, nanite mutual healing, psionic phantom decoys, cryo retaliation splinters, and dark star fire trails.
   - Renders procedural Canvas 2D vector art for all 12 anchor types, orbital particle fields, animated conduit beams connecting to Sovereign, and HP indicators.

3. **`src/game/crisis/CrisisSovereign.ts`**:
   - Manages the primary boss dreadnought centered at $((\text{logicalWidth}-260)/2, 65)$ (size 260x130px).
   - Enforces Phase 1 shield deflector (`shieldFlashTimer = 0.12s`, 0 damage taken while anchors alive), Phase 2 Hull damage intake (2,500 HP), and Phase 3 Core overdrive (1,500 HP with 35.0s enrage timer).
   - Features 12 dedicated procedural Canvas 2D vector art drawing routines rendering unique silhouettes, engine glows, and particle shields without external image assets.
   - Renders boss HUD with archetype-specific titles, phase badges, and animated dual health bars.

4. **`src/game/crisis/EndGameCrisis.ts`**:
   - Central encounter coordinator managing state progression, uniform random selection across all 12 archetypes, attack dispatching (`executeArchetypeAttack`), passive environmental hazard fields, bullet collision routing, and defeat event emission.

5. **`src/game/crisis/AlliedReinforcements.ts`**:
   - Manages the massive allied command capital ship ("Aegis Vanguard Command Dreadnought", 220x100px) and 2 escort interceptor fighters warping in to assist the player during crisis Phase 2.
   - Features Forward Heavy Plasma Cannons (speed 450, damage 3, fire rate 0.8s), Point-Defense Laser Grid (120px interception perimeter vaporizing hostile bullets), Restorative Nano-Shield Aura (+1 HP repair and -25% stress every 5s), and agile escort formation flight.
   - Procedural Canvas 2D vector art with dual plasma thrusters, rotating turrets, and dynamic UI announcement banner.

6. **`src/game/GameManager.ts`**:
   - Master engine loop:
     - Wave trigger evaluation at `level >= 15` on non-boss waves (`isPityTrigger = level >= 18`, `isRandomTrigger = Math.random() < 0.30`).
     - 3-Layer Rendering Pipeline: Layer 1 (Static background & warnings), Layer 2 (World entities, screen shake), Layer 3 (Foreground UI, borders).
     - Player bullet collision routing to crisis entities via `crisis.handleBulletCollision()`.
     - Sovereign physical collision handling dealing 1 damage, invincibility frames, and screen shake.
     - Defeat rewards (+2,000 score, +500 currency, +10 combo, 120-particle explosion).
     - Deterministic testing hook: `triggerEndGameCrisis(archetype?: CrisisArchetype)`.
     - Deterministic allied reinforcements hook: `triggerAlliedReinforcements(): AlliedReinforcements` (auto-triggered on Phase 2).

7. **`src/components/game-canvas.tsx`**:
   - React viewport wrapper isolating `<canvas>` in a `relative w-full aspect-[3/4] overflow-hidden` container from `MobileControls`, preventing overlay clipping.
   - Displays crisis incursion warning banner (`[data-testid="endgame-crisis-warning-banner"]`) and active HUD status badge (`[data-testid="endgame-crisis-active-badge"]`).

---

## Feature Inventory

| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| F1 | 12-Crisis Archetype Expansion | Expand `CrisisArchetype` from 6 to 12 distinct entries (`BIOMORPHIC_SWARM`, `SINGULARITY_CORE`, `NANITE_HARVESTER`, `PSIONIC_SHROUD`, `GLACIAL_OBLIVION`, `COSMIC_DEVOURER`) with comprehensive metadata in `CRISIS_ARCHETYPE_CONFIGS`. | M2 | PLANNED | Spec Miner / Arch Survey |
| F2 | Strict 5,200 EHP Balance Contract | Guarantee exact 5,200 EHP across all 12 archetypes: 2 Anchors @ 600 HP (1,200 HP), Hull 2,500 HP, Core 1,500 HP with 35.0s enrage clock. | M2 | PLANNED | Spec Miner / Arch Survey |
| F3 | Bespoke Phase 1 Anchor Mechanics | Implement distinct Phase 1 behaviors in `DimensionalRift.ts`: Hatchery spores, Polarized gravity pull/push, Nanite mutual healing, Psionic phantom decoys, Cryo-retaliation splinters, and Astral firewalls. | M3 | PLANNED | Spec Miner / Arch Survey |
| F4 | Archetypal Phase 2 & 3 Combat Attacks | Implement alternating primary/secondary super-weapons and accelerated Phase 3 enrage barrages (1.4s cadence) for all 12 archetypes in `EndGameCrisis.ts`. | M5 | PLANNED | Spec Miner / Arch Survey |
| F5 | Dynamic Environmental Hazards | Implement active area-denial hazard fields (Bio-spore creep, Spacetime warp geodesics, Nanite wall erosion, Telepathic input wobble, Frostbite slow zone, Solar wind gusts). | M5 | PLANNED | Spec Miner / Arch Survey |
| F6 | Procedural Canvas 2D Vector Art | Implement 12 distinct Canvas 2D vector art silhouettes and color palettes in `CrisisSovereign.ts` and `DimensionalRift.ts` with high-contrast outlines and responsive bounds. | M3, M4 | PLANNED | Spec Miner / Arch Survey |
| F7 | Uniform 1/12 Spawning Distribution | Update `EndGameCrisis.startIncursion()` to pick uniformly from all 12 archetypes ($p = 1/12 \approx 8.333\%$) with deterministic test overrides. | M5 | PLANNED | Arch / QA Survey |
| F8 | Chi-Square Statistical Test Suite | Automated Monte Carlo test ($N=12,000$ trials) verifying Pearson's Chi-Square $\chi^2 < 24.725$ ($df=11, \alpha=0.01$) and bounds $850 \le O_i \le 1150$. | M6 | PLANNED | QA Survey |
| F9 | Headless Unit & E2E Integration Suite | Automated unit tests (`crisis_expansion_12.test.ts`) and Playwright E2E browser tests (`tests/15_endgame_crisis_12_archetypes.spec.ts`) validating 0 errors. | M6 | PLANNED | QA Survey |
| F10 | Pre-Commit Build & Deployment Pipeline | Clean compilation verification via `npx tsc --noEmit` and `npm run build`, followed by clean git commit and push. | M7 | PLANNED | Pre-commit Rules |
| F11 | Massive Allied Reinforcements (Aegis Vanguard) | Procedural capital dreadnought & escort interceptor wing warping in during Crisis Phase 2 with heavy plasma cannons, 120px point-defense laser grid, restorative nano-shield aura, and announcement banner. | M8 | COMPLETED | Urgent User Request |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Spec & Doc Synchronization | Synchronize `COLLABORATION.md` and `PROJECT.md` with complete 12-crisis specifications from survey reports. | None | **IN PROGRESS** |
| M2 | Crisis Core Types & Configs | Implement 12 enum members in `src/game/crisis/types.ts`, 18 new attack types in `CrisisAttackType`, and 12 entries in `CRISIS_ARCHETYPE_CONFIGS` with 5,200 EHP invariant. | M1 | PLANNED |
| M3 | Phase 1 Anchor Mechanics & Vector Art | Implement bespoke behaviors, particle palettes, and vector art for all 6 new anchor types in `src/game/crisis/DimensionalRift.ts`. | M2 | PLANNED |
| M4 | Sovereign Hull Vector Art & Boss HUD | Implement Canvas 2D vector drawing routines and HUD mappings for all 6 new boss silhouettes in `src/game/crisis/CrisisSovereign.ts`. | M2 | PLANNED |
| M5 | Encounter Coordinator, Attacks & Hazards | Expand `EndGameCrisis.ts` with 1/12 uniform random selection, Phase 2/3 attack execution, and environmental hazard effects for all 12 archetypes. | M2, M3, M4 | PLANNED |
| M6 | Automated QA Testing & Chi-Square Simulation | Implement `tests/unit/crisis_expansion_12.test.ts`, `tests/unit/crisis_distribution_12.test.ts`, update legacy `toBe(6)` assertions to `toBe(12)`, and add E2E Playwright specs. | M5 | PLANNED |
| M7 | Pre-Commit Build Verification & Push | Run `npx tsc --noEmit`, `npm run build`, and `npx playwright test`. Verify 0 errors, commit, and push. | M6 | PLANNED |
| M8 | Massive Allied Reinforcements Integration | Implement `AlliedReinforcements.ts`, integrate lifecycle, Phase 2 trigger, combat/defense systems, and render loops into `GameManager.ts`. | M1 | **COMPLETED** |

---

## Interface Contracts

### 1. `CrisisArchetype` Enum (`src/game/crisis/types.ts`)
```typescript
export enum CrisisArchetype {
  // Existing 6 Archetypes
  VOID_SOVEREIGN = 'VOID_SOVEREIGN',
  ABYSSAL_LEVIATHAN = 'ABYSSAL_LEVIATHAN',
  CYBERNETIC_EXTERMINATOR = 'CYBERNETIC_EXTERMINATOR',
  CHRONO_DEVOURER = 'CHRONO_DEVOURER',
  SOLARIS_COLOSSUS = 'SOLARIS_COLOSSUS',
  NEBULA_PHANTASM = 'NEBULA_PHANTASM',
  // New 6 Archetypes (12 Total)
  BIOMORPHIC_SWARM = 'BIOMORPHIC_SWARM',
  SINGULARITY_CORE = 'SINGULARITY_CORE',
  NANITE_HARVESTER = 'NANITE_HARVESTER',
  PSIONIC_SHROUD = 'PSIONIC_SHROUD',
  GLACIAL_OBLIVION = 'GLACIAL_OBLIVION',
  COSMIC_DEVOURER = 'COSMIC_DEVOURER',
}
```

### 2. `CrisisArchetypeConfig` & 5,200 EHP Balance Contract
```typescript
export interface CrisisArchetypeConfig {
  name: string;
  subtitle: string;
  riftHp: number;          // Strictly 600 HP (2 Anchors = 1,200 EHP)
  sovereignHullHp: number; // Strictly 2,500 HP
  coreHp: number;          // Strictly 1,500 HP (Total EHP = 1,200 + 2,500 + 1,500 = 5,200)
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  coreGlowColor: string;
  enrageTime: number;      // Strictly 35.0 seconds
  vortexStrength: number;
  baseFireRate: number;
}
```

### 3. Incursion & Spawning Selection (`src/game/crisis/EndGameCrisis.ts`)
```typescript
// Guaranteed uniform 1/12 random selection
public startIncursion(archetype?: CrisisArchetype): void {
  if (archetype) {
    this.archetype = archetype;
  } else {
    const archetypes = Object.values(CrisisArchetype);
    this.archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  }
  // Initialize Phase 1 anchors and sovereign...
}
```

### 4. Deterministic Testing Hook (`src/game/GameManager.ts`)
```typescript
public triggerEndGameCrisis(archetype?: CrisisArchetype): EndGameCrisis {
  this.endGameCrisis = new EndGameCrisis(this.logicalWidth, this.logicalHeight, {
    onDefeated: (arch) => this.handleCrisisDefeated(arch),
    onPhaseTransition: (p) => this.handleCrisisPhaseTransition(p),
  });
  this.endGameCrisis.startIncursion(archetype);
  return this.endGameCrisis;
}
```

---

## Code Layout

```
/Users/user/src/water-invader/
├── src/
│   ├── components/
│   │   └── game-canvas.tsx         # Decoupled responsive canvas wrapper & crisis HUD banners
│   ├── game/
│   │   ├── crisis/
│   │   │   ├── types.ts            # CrisisArchetype (12), CrisisPhase, configs (5,200 EHP), attacks
│   │   │   ├── EndGameCrisis.ts    # Encounter coordinator, 1/12 uniform roll, attacks, hazards
│   │   │   ├── DimensionalRift.ts  # Phase 1 anchors (2x 600 HP), bespoke mechanics & vector art
│   │   │   └── CrisisSovereign.ts  # Phase 2 (2,500 HP) & Phase 3 (1,500 HP), vector art, boss HUD
│   │   ├── Bullet.ts               # Projectiles with layered high-contrast armor rims
│   │   ├── Enemy.ts                # Enemy AI with friendly-fire avoidance line-of-sight checks
│   │   └── GameManager.ts          # Master game loop, 3-layer rendering, crisis wave evaluation
├── tests/
│   ├── unit/
│   │   ├── crisis_expansion_12.test.ts         # Unit tests for 12 archetypes, EHP invariant, transitions
│   │   ├── crisis_distribution_12.test.ts      # 12,000-trial Monte Carlo Chi-Square uniformity test
│   │   ├── crisis_doubling.test.ts             # Updated legacy crisis unit test (12 archetypes)
│   │   └── endgame_crisis_simulation.test.ts   # 60 FPS combat simulation & balance proof
│   ├── stress/
│   │   └── challenger_exp_1_friendly_fire_crisis_stress.spec.ts # Stress tests (12 archetypes)
│   ├── 13_endgame_crisis_e2e.spec.ts           # E2E crisis browser flow
│   ├── 14_responsive_warning_background_and_contrast.spec.ts # Responsive canvas tests
│   └── 15_endgame_crisis_12_archetypes.spec.ts # E2E test suite for all 12 crisis archetypes
├── COLLABORATION.md                # Claude & multi-agent alignment documentation
└── PROJECT.md                      # Master architecture & milestone tracking specification
```

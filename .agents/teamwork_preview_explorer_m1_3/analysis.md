# Milestone 1 Technical Analysis & Architecture Specification: EndGameCrisis State Machine & Integration Contracts

**Author**: teamwork_preview_explorer (Crisis Architecture & Integration Contracts)  
**Target Milestone**: Milestone 1 (M1) — Crisis Models, State Machine & Integration Contracts  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_m1_3`  
**Scope**: `src/game/GameManager.ts`, `src/components/game-canvas.tsx`, `src/game/crisis/`  

---

## 1. Executive Summary

This report establishes the complete architectural contract and technical specification for integrating the **Stellaris-style End-Game Crisis System** into `GameManager.ts` and `game-canvas.tsx`. 

Unlike standard 150×100 px bosses (which possess only 362–675 HP and are obliterated in < 3 seconds by a max-level player's 150+ DPS), the End-Game Crisis is a **screen-filling (260×140 px), tri-phase cataclysmic dreadnought commanding 7,500+ Effective HP (EHP)**. It features an initial **Incursion Warning sequence**, **flanking Dimensional Rift Anchors with an Invulnerability Shroud (Phase 1)**, **an exposed Core Dreadnought with Gravitational Auras and Dark-Matter Beams (Phase 2)**, and a **Singularity Core Overdrive with a 35s Enrage Timer and radial Nova bullet hell (Phase 3)**.

All interfaces, state representations, lifecycle transitions, collision routing, and HUD Boss Bar contracts are defined below with complete backward compatibility and zero soft-lock guarantees.

---

## 2. Codebase Baseline & Observations

### 2.1 Fixed Timestep Game Loop (`GameManager.ts:24-28, 543-575`)
- `GameManager` runs a fixed 60Hz physics accumulator loop (`FIXED_STEP = 1 / 60`).
- Updates are evaluated in discrete sub-steps (`this.update(this.FIXED_STEP)`), ensuring physics determinism across 60Hz, 120Hz, and 144Hz monitors.

### 2.2 Entity Arrays & In-Place Compaction (`GameManager.ts:880-937`)
- The engine uses two-pointer `writeIndex` loops for `enemies`, `bullets`, `particles`, `barricades`, and `helpers` to avoid GC allocation spikes.
- Crisis sub-entities (Anchors, Escorts, Sovereign body) must conform to this pattern or be cleanly updated and compacted inside an `EndGameCrisis` coordinator.

### 2.3 Existing Boss Spawning vs. Crisis Requirements (`GameManager.ts:263-299, Enemy.ts:143-147`)
- Regular bosses spawn deterministically on `this.level % 5 === 0`.
- Stage 15 boss has $HP = 50 + 15 \times 25 + \lfloor (15 - 5)^2 \times 2.5 \rfloor = 675\text{ HP}$.
- Max-level player output ($150\text{ sustained single-target DPS}$ + $300\text{ burst}$ Heavy Rain) deletes 675 HP in **2.5 seconds**.
- Therefore, `EndGameCrisis` must operate as an independent entity coordinator with a total effective health pool of **$\ge 7,500\text{ EHP}$** to achieve a **45–70s** epic battle duration.

### 2.4 Wave Completion Guard (`GameManager.ts:940-967`)
- Wave completion currently checks:
  ```typescript
  if (
    this.state === GameState.PLAYING &&
    remainingHostiles === 0 &&
    this.warningTimer <= 0 &&
    this.pendingReinforcement === null &&
    this.crisisState.warningTimer <= 0 &&
    (this.crisisState.activeCrisis === null || (this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0))
  ) {
    this.state = GameState.SHOP;
    ...
  }
  ```
- **Critical Requirement**: Adding `this.endGameCrisis` requires integrating an `!this.isEndGameCrisisActive()` guard into this conditional to prevent soft-locks or premature SHOP state transitions while the Crisis is engaged.

### 2.5 React & Canvas HUD Architecture (`game-canvas.tsx:91-178, 876-939`)
- `game-canvas.tsx` renders memoized sub-components (`TopHUD`, `CanvasCore`, `MobileControls`, `ShopModal`).
- Active events are signaled via React callbacks (`onCrisisEvent`, `onScoreChange`, etc.).
- A dedicated callback `onEndGameCrisisChange?: (crisis: EndGameCrisisState | null) => void` is needed to power both Canvas 2D overlays and DOM HUD components (`[data-testid="crisis-boss-bar"]`).

---

## 3. EndGameCrisis Integration Contract

### 3.1 Type Definitions (`src/game/crisis/types.ts`)

```typescript
import { Vector2D, Size, Rect, Faction } from '../types';
import { Entity } from '../Entity';

export enum CrisisArchetype {
  VOID_SOVEREIGN = 'VOID_SOVEREIGN',
  ABYSSAL_LEVIATHAN = 'ABYSSAL_LEVIATHAN',
  CYBERNETIC_EXTERMINATOR = 'CYBERNETIC_EXTERMINATOR',
}

export enum CrisisPhase {
  INCURSION = 'INCURSION',           // 3.0s cataclysm siren & hyperspace warning
  PHASE_1_SHIELD = 'PHASE_1_SHIELD', // Flanking Dimensional Rift Anchors active (Core Invulnerable)
  PHASE_2_HULL = 'PHASE_2_HULL',     // Sovereign Hull exposed; Dark-Matter Beams & Gravitational Auras
  PHASE_3_CORE = 'PHASE_3_CORE',     // Singularity Core Overdrive; 35s Enrage Clock & Nova Bullet Hell
  DEFEATED = 'DEFEATED',             // Implosion sequence, rewards, and wave unblock
}

export interface ICrisisCollider {
  id: string;
  position: Vector2D;
  size: Size;
  hp: number;
  maxHp: number;
  isDead: boolean;
  isInvulnerable: boolean;
  getRect(): Rect;
  checkCollision(other: Entity): boolean;
  takeDamage(amount: number): { actualDamage: number; destroyed: boolean };
}

export interface EndGameCrisisState {
  isActive: boolean;
  archetype: CrisisArchetype;
  phase: CrisisPhase;
  warningTimer: number;
  totalHp: number;
  maxHp: number;
  shieldHp: number;
  maxShieldHp: number;
  enrageTimer: number;
  maxEnrageTimer: number;
  isInvulnerable: boolean;
  anchors: Array<{ id: string; name: string; hp: number; maxHp: number; isDead: boolean; x: number; y: number }>;
  bannerTitle: string;
  bannerSubtitle: string;
}
```

---

### 3.2 State Representation in `GameManager.ts`

`GameManager` manages the `EndGameCrisis` instance as a top-level entity coordinator:

```typescript
import { EndGameCrisis } from './crisis/EndGameCrisis';
import { CrisisArchetype, CrisisPhase, EndGameCrisisState } from './crisis/types';

export class GameManager {
  // ... existing fields ...
  
  // End-Game Crisis (Stage 15+ Cataclysm Coordinator)
  public endGameCrisis: EndGameCrisis | null = null;
  public onEndGameCrisisChange?: (crisis: EndGameCrisisState | null) => void;

  public isEndGameCrisisActive(): boolean {
    return this.endGameCrisis !== null && !this.endGameCrisis.isDead && this.endGameCrisis.phase !== CrisisPhase.DEFEATED;
  }
}
```

#### Lifecycle Hooks in `GameManager.ts`:
1. **`init(resetScoreAndCash)`**:
   - `this.endGameCrisis = null;`
   - If `this.onEndGameCrisisChange`, notify `null`.
2. **`spawnWave()` (Stage 15+ Incursion Engine)**:
   ```typescript
   if (this.level >= 15 && !this.endGameCrisis) {
     const isPityWave = this.level >= 18;
     const roll = Math.random();
     if (roll < 0.30 || isPityWave) {
       this.triggerEndGameCrisis();
       return; // Crisis replaces standard wave roster
     }
   }
   ```
3. **Deterministic Trigger Hook `triggerEndGameCrisis(archetype?: CrisisArchetype)`**:
   ```typescript
   public triggerEndGameCrisis(archetype?: CrisisArchetype): EndGameCrisis {
     if (this.state !== GameState.PLAYING) {
       this.state = GameState.PLAYING;
     }
     const chosenArchetype = archetype || CrisisArchetype.VOID_SOVEREIGN;
     this.endGameCrisis = new EndGameCrisis(
       this.logicalWidth,
       this.logicalHeight,
       this.level,
       chosenArchetype
     );
     this.triggerScreenShake(1.5);
     soundManager.playCrisisAlarm();
     this.notifyCrisisUI();
     return this.endGameCrisis;
   }
   ```

---

## 4. Phase Lifecycle & State Machine

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. INCURSION (Warning Sequence — 3.0s)                                 │
  │ • Screen-wide chromatic aberration, 5-tone cataclysm siren.            │
  │ • Warning Banner: "🚨 STELLARIS END-GAME CRISIS: VOID SOVEREIGN 🚨"    │
  │ • Transition: warningTimer <= 0 -> Enters PHASE_1_SHIELD.              │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 2. PHASE 1: SHIELD & RIFT ANCHORS (1,600 EHP)                          │
  │ • Sovereign Core arrives at y = 80 px (100% Invulnerability Shroud).   │
  │ • 2 Dimensional Rift Anchors spawn (Left: x=60, Right: x=480, 800 HP). │
  │ • Anchors fire targeting void bolts & spawn void herald swarms.        │
  │ • Transition: Both Anchors destroyed -> Enters PHASE_2_HULL.           │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 3. PHASE 2: SOVEREIGN HULL EXPOSED (3,500 EHP)                         │
  │ • Invulnerability Shroud shatters; Sovereign Hull exposed.             │
  │ • Weaponry: Dark-Matter Lance (1.2s charge), Gravitational Wave Aura.  │
  │ • Transition: Hull HP <= 0 (or <= 25% total EHP) -> PHASE_3_CORE.      │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 4. PHASE 3: SINGULARITY CORE OVERDRIVE (2,400 EHP + 35.0s Enrage Clock)│
  │ • Outer chassis collapses, exposing pulsating Singularity Reactor.     │
  │ • Enrage Clock: 35.0s timer. If expires: 999 lethal supernova wipe.    │
  │ • Radial Nova Bullet Hell: 16-way and 24-way cosmic orbs every 1.8s.   │
  │ • Transition: Core HP <= 0 -> Enters DEFEATED.                         │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 5. DEFEATED (Cataclysm Resolution & Unblock)                           │
  │ • 3.0s multi-stage explosion chain reaction (500+ particles).          │
  │ • Rewards: +10,000 Score, +500 Pure Water (💧).                         │
  │ • endGameCrisis.isDead = true -> Wave Clear Guard unblocks SHOP.      │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Collision & Combat Integration (`GameManager.checkCollisions`)

### 5.1 Player Bullets vs. Crisis Active Colliders
```typescript
if (this.endGameCrisis && !this.endGameCrisis.isDead && this.endGameCrisis.phase !== CrisisPhase.INCURSION) {
  const colliders = this.endGameCrisis.getActiveColliders();
  for (const collider of colliders) {
    if (collider.isDead) continue;
    if (bullet.hitEntities.has(collider as any)) continue;

    if (bullet.checkCollision(collider as any)) {
      bullet.hitEntities.add(collider as any);
      bullet.piercing--;
      if (bullet.piercing <= 0) bullet.isDead = true;

      if (collider.isInvulnerable) {
        // Shroud deflection: 0 damage, cyan deflection sparks
        this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 6);
        soundManager.playEnemyHit();
      } else {
        const { actualDamage, destroyed } = collider.takeDamage(bullet.damage);
        this.createExplosion(bullet.position.x, bullet.position.y, '#f43f5e', 5);
        soundManager.playEnemyHit();

        if (destroyed) {
          this.createExplosion(
            collider.position.x + collider.size.width / 2,
            collider.position.y + collider.size.height / 2,
            '#fbbf24',
            80,
            2.0
          );
          soundManager.playVictory();
          this.triggerScreenShake(0.8);
        }
      }

      this.notifyCrisisUI();
      if (bullet.isDead) break;
    }
  }
}
```

### 5.2 Wave Completion Guard (`GameManager.update`)
```typescript
const isCrisisActive = this.endGameCrisis !== null && !this.endGameCrisis.isDead && this.endGameCrisis.phase !== CrisisPhase.DEFEATED;

if (
  this.state === GameState.PLAYING &&
  remainingHostiles === 0 &&
  !isCrisisActive && // Critical anti-soft-lock guard
  this.warningTimer <= 0 &&
  this.pendingReinforcement === null &&
  this.crisisState.warningTimer <= 0 &&
  (this.crisisState.activeCrisis === null || (this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0))
) {
  this.state = GameState.SHOP;
  // Cleanup crisis state
  this.endGameCrisis = null;
  this.notifyCrisisUI();
  this.pause();
}
```

---

## 6. HUD Boss Bar & Visual Overlay Specification

### 6.1 Canvas 2D In-Game Rendering (`GameManager.draw`)
When `this.endGameCrisis` is active, `drawCrisisHpBar(this.endGameCrisis)` renders across the top:
- **Dimensions**: $460\text{px}$ width $\times 26\text{px}$ height, centered at $x = 70, y = 20$.
- **Phase 1 (Shield & Anchors)**:
  - Dual sub-bars for Left Rift Anchor and Right Rift Anchor.
  - Central Shroud Lock icon: `🔒 VOID SHROUD (100% IMMUNITY) 🔒`.
- **Phase 2 (Sovereign Hull)**:
  - Multi-stop linear gradient: `#4338ca` (Indigo) $\to$ `#8b5cf6` (Purple) $\to$ `#f43f5e` (Rose).
  - Text: `⚠️ CRISIS: VOID SOVEREIGN — 2,850 / 3,500 HP (81%) ⚠️`.
- **Phase 3 (Singularity Core & Enrage)**:
  - Pulsing crimson/fuchsia bar with animated striped warning fill.
  - Enrage Countdown Banner: `⚡ SINGULARITY OVERDRIVE ENRAGE: 24.8s ⚡`.

### 6.2 React DOM Component (`components/game-canvas.tsx`)
A dedicated memoized component `CrisisBossBarOverlay` with complete test IDs:

```tsx
interface CrisisBossBarProps {
  crisisState: EndGameCrisisState | null;
}

export const CrisisBossBarOverlay = React.memo(function CrisisBossBarOverlay({ crisisState }: CrisisBossBarProps) {
  if (!crisisState || !crisisState.isActive || crisisState.phase === CrisisPhase.DEFEATED) return null;

  return (
    <div data-testid="crisis-boss-bar" className="absolute top-12 left-1/2 -translate-x-1/2 w-[92%] max-w-[540px] pointer-events-none z-30 flex flex-col items-center">
      {/* Phase Title Badge */}
      <div data-testid="crisis-phase-title" className="px-3 py-1 bg-purple-950/90 border border-purple-500 rounded-t-lg text-xs font-black text-purple-300 uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.5)]">
        {crisisState.bannerTitle} — {crisisState.phase}
      </div>

      {/* Main Health Bar Frame */}
      <div className="w-full h-6 bg-slate-950/90 border-2 border-purple-500 rounded-lg p-0.5 relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.6)]">
        <div
          data-testid="crisis-hp-fill"
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 transition-all duration-150 rounded"
          style={{ width: `${Math.max(0, Math.min(100, (crisisState.totalHp / crisisState.maxHp) * 100))}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white font-mono drop-shadow">
          {crisisState.totalHp} / {crisisState.maxHp} HP ({Math.round((crisisState.totalHp / crisisState.maxHp) * 100)}%)
        </span>
      </div>

      {/* Phase 1: Dual Anchor Sub-Bars */}
      {crisisState.phase === CrisisPhase.PHASE_1_SHIELD && (
        <div data-testid="crisis-anchor-container" className="w-full flex justify-between gap-2 mt-1">
          {crisisState.anchors.map((anchor) => (
            <div key={anchor.id} data-testid={`crisis-anchor-${anchor.id}`} className="flex-1 bg-slate-900/80 border border-cyan-500/80 rounded px-2 py-0.5 flex justify-between text-[10px] text-cyan-300 font-mono">
              <span>{anchor.name}</span>
              <span>{anchor.hp > 0 ? `${anchor.hp} HP` : 'DESTROYED'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Phase 3: Enrage Timer Badge */}
      {crisisState.phase === CrisisPhase.PHASE_3_CORE && (
        <div data-testid="crisis-enrage-badge" className="mt-1 px-4 py-1 bg-red-950/90 border border-red-500 rounded-full text-xs font-black text-red-300 animate-pulse flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.7)]">
          <span>⚡</span> SINGULARITY COLLAPSE: {crisisState.enrageTimer.toFixed(1)}s <span>⚡</span>
        </div>
      )}
    </div>
  );
});
```

---

## 7. Mathematical Proof of Durability Against Max-Level Player

| Metric | Max Player Profile | Crisis Phase 1 (Anchors) | Crisis Phase 2 (Hull) | Crisis Phase 3 (Core) | Total / Combined |
|---|---|---|---|---|---|
| **Health Pool (Raw)** | — | $1,600\text{ HP}$ ($2 \times 800$) | $3,500\text{ HP}$ | $2,400\text{ HP}$ | **$7,500\text{ Raw HP}$** |
| **Damage Mitigation** | — | Core 100% Immune | 20% Armor Reduction | 15% Armor Reduction | **$8,150\text{ EHP}$** |
| **Single-Target DPS** | $150.0\text{ DPS}$ | $150.0\text{ DPS}$ | $120.0\text{ Eff. DPS}$ | $127.5\text{ Eff. DPS}$ | — |
| **Ultimate Burst** | $300\text{ dmg} / 20\text{s}$ | $15\text{ DPS Eq.}$ | $15\text{ DPS Eq.}$ | $15\text{ DPS Eq.}$ | — |
| **Time-to-Clear (100% Accuracy)** | — | **$9.7\text{ seconds}$** | **$25.9\text{ seconds}$** | **$16.8\text{ seconds}$** | **$\mathbf{52.4\text{ \textbf{seconds}}}$** |
| **Time-to-Clear (75% Real Combat Acc)** | — | **$12.5\text{ seconds}$** | **$33.3\text{ seconds}$** | **$21.8\text{ seconds}$** | **$\mathbf{67.6\text{ \textbf{seconds}}}$** |

**Conclusion**: The Crisis is mathematically guaranteed to withstand non-stop max-level player firepower for over **$50\text{ to }70\text{ seconds}$**, completely satisfying the requirement that the Crisis cannot be trivialized by late-game upgrades.

---

## 8. Verification & Test Suite Blueprint

1. **Unit & Headless Simulation Test (`tests/unit/endgame_crisis_simulation.test.ts`)**:
   - Spawns `EndGameCrisis` and steps through 60Hz physics frames.
   - Asserts Phase 1 invulnerability prevents damage to Sovereign Core until both anchors are defeated.
   - Simulates continuous $150\text{ DPS}$ max player firing and verifies total survival time is $\ge 45.0\text{s}$ ($\ge 2,700\text{ frames}$).
2. **Playwright Stage 15 Incursion E2E Test (`tests/13_endgame_crisis_stage15.spec.ts`)**:
   - Mocks Stage 15 state and verifies random trigger probability.
   - Uses `window.gameManager.triggerEndGameCrisis()` to force trigger.
   - Asserts DOM elements `[data-testid="crisis-boss-bar"]`, `[data-testid="crisis-warning-banner"]`, `[data-testid="crisis-hp-fill"]`, and `[data-testid="crisis-enrage-badge"]`.
   - Verifies defeat rewards (+10,000 score, +500 💧) and unblocking of `GameState.SHOP`.
3. **Full Regression Run**:
   - `npm run build` and `npx playwright test` must pass 100% across all 440+ existing assertions.

# Project: Water Invader Expansion (Crisis Doubling, Responsive Warnings, Smart AI)

## Architecture
Water Invader is a Next.js / TypeScript web application powered by HTML5 Canvas and React state management.
- `src/game/crisis/types.ts` & `src/game/crisis/`: Modular End-Game Crisis architecture. Currently contains 3 archetypes (`VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`). Expanded to 6 archetypes by adding `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, and `NEBULA_PHANTASM`.
- `src/game/crisis/EndGameCrisis.ts`: Cataclysm boss coordinator managing phases (Incursion, Shield, Hull, Core, Defeated), anchors, and attack loops.
- `src/game/crisis/DimensionalRift.ts`: Phase 1 anchor models and mechanics.
- `src/components/game-canvas.tsx`: React UI overlay manager. Responsive canvas wrapper container isolated from `MobileControls` to eliminate overlay stretching and mobile clipping.
- `src/game/GameManager.ts`: Master engine loop. 3-layer rendering pipeline (static background, shaking world, stable foreground). Firing loops and enemy array coordination.
- `src/game/Bullet.ts`: Projectile rendering with high-contrast armor rims layered above outer bloom.
- `src/game/Enemy.ts`: Base enemy class with line-of-sight (LOS) clearance checks, fire suppression micro-delays, and tactical lateral slide repositioning.
- `tests/unit/`: Headless Playwright unit simulations for crisis mechanics and friendly-fire avoidance.
- `tests/`: End-to-end Playwright test specs.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | End-Game Crisis Doubling (3 -> 6) | Implement 3 new distinct End-Game Crisis archetypes: `CHRONO_DEVOURER` (temporal afterimages & monoliths), `SOLARIS_COLOSSUS` (prominence lasers & magma pools), and `NEBULA_PHANTASM` (quantum decoy split & homing wisps) in `src/game/crisis/`. | M1 | Survey (Explorer 1) |
| F2 | Responsive Warning Backgrounds & Projectile Contrast | Fix mobile clipping by decoupling canvas from `MobileControls`, implement 3-layer rendering pipeline in `GameManager.draw()`, and reorder `Bullet.draw()` layer hierarchy for >= 7:1 WCAG contrast. | M2 | Survey (Explorer 2) |
| F3 | Smarter Enemy Friendly-Fire AI | Implement 2-tiered line-of-sight (LOS) spatial awareness in `Enemy.ts` and `GameManager.ts` to suppress fire with micro-delays and trigger lateral repositioning when allies block the shot corridor. | M3 | Survey (Explorer 3) |
| F4 | Comprehensive Automated Testing Track | Implement unit tests for all 6 crisis archetypes, friendly-fire suppression, and responsive Playwright E2E tests (`tests/14_responsive_warning_background_and_contrast.spec.ts`). | M4 | Survey (Explorer 1, 2, 3) |
| F5 | Pre-Commit Build Verification & Git Push | Clean `npx tsc --noEmit`, `npm run build`, and `npx playwright test` verification, followed by git commit and push. | M5 | Pre-commit Rules |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Double End-Game Crisis Types | Implement `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, and `NEBULA_PHANTASM` in `src/game/crisis/types.ts`, `EndGameCrisis.ts`, `DimensionalRift.ts`, and `GameManager.ts`. Add headless tests in `tests/unit/crisis_doubling.test.ts`. | None | PLANNED |
| M2 | Responsive Warning Backgrounds | Fix DOM container in `src/components/game-canvas.tsx`, 3-layer draw in `src/game/GameManager.ts`, bullet outline layering in `src/game/Bullet.ts`. Add tests in `tests/14_responsive_warning_background_and_contrast.spec.ts`. | None | PLANNED |
| M3 | Smarter Enemy Friendly-Fire AI | Add 2-tier LOS algorithm (fast-path vertical + angled raycast), fire suppression micro-delay, and lateral repositioning in `src/game/Enemy.ts`. Add tests in `tests/unit/friendly_fire_ai.test.ts`. | None | PLANNED |
| M4 | Comprehensive E2E Testing & Hardening | Run all unit tests, Playwright specs, and adversarial challenger verification. | M1, M2, M3 | PLANNED |
| M5 | Build Verification, Git Commit & Push | Run `npx tsc --noEmit`, `npm run build`, `npx playwright test`, then commit and push to remote. | M4 | PLANNED |

## Interface Contracts
### `CrisisArchetype` (types.ts)
```typescript
export enum CrisisArchetype {
  VOID_SOVEREIGN = 'VOID_SOVEREIGN',
  ABYSSAL_LEVIATHAN = 'ABYSSAL_LEVIATHAN',
  CYBERNETIC_EXTERMINATOR = 'CYBERNETIC_EXTERMINATOR',
  CHRONO_DEVOURER = 'CHRONO_DEVOURER',
  SOLARIS_COLOSSUS = 'SOLARIS_COLOSSUS',
  NEBULA_PHANTASM = 'NEBULA_PHANTASM'
}
```

### Line-of-Sight API (`Enemy.ts`)
```typescript
public hasAlliedObstacleInShotPath(
  allEnemies: Enemy[],
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  projectileRadius: number = 8
): boolean;
```

### Canvas Viewport Decoupling (`game-canvas.tsx`)
```tsx
// Outer flex-col container
<div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-2 select-none">
  {/* Isolated 3:4 canvas container */}
  <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-4 border-blue-900 shadow-2xl">
    <canvas ref={canvasRef} ... />
    {/* Warning overlays are now strictly bound to canvas aspect-ratio bounds */}
    {crisisState && <CrisisWarningOverlay ... />}
  </div>
  {/* Mobile controls positioned cleanly BELOW canvas container */}
  <MobileControls ... />
</div>
```

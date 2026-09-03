# Claude Collaboration Guide: Water Invader

## Current Mission: Feature Expansion — Dynamic Backgrounds, Allied Reinforcements & Barricade Saboteurs

### Objective & Scope
Implement and rigorously verify three interconnected major feature additions for Water Invader:
1. **R1. Dynamic Backgrounds & Threat Signifiers**:
   - 5-Tier Biome Progression cycling every 10 stages (Surface Aquifer -> Abyssal Trench -> Bioluminescent Reef -> Toxic Seabed -> Cosmic Void) with procedural vertical gradients and distinct particle physics.
   - 4-Tier Threat Signifiers (`NONE`, `ELITE`, `BOSS`, `CRISIS`) providing smooth (0.4s lerp) ambient danger shifts, radial perimeter threat vignettes (crimson for Bosses, fuchsia/amber for Elites), and zero-overhead 60 FPS rendering with $\ge 7:1$ projectile contrast.
2. **R2. Allied Reinforcements with Roles & UI**:
   - Massive Allied Reinforcement squadron warp-in events (Fighters, Medics, Repair Bots) triggered on wave milestones (every 5 waves) and emergency survival thresholds.
   - Specialized role AI behaviors:
     - **Fighter** (`HelperType.FIGHTER = 0`): Targets Saboteurs, diving invaders, and low-altitude hostiles with dual plasma bolts.
     - **Medic** (`HelperType.MEDIC = 3`): Escorts player, restoring player health (`+1 HP` every 3.5s) and relieving suppression.
     - **Repair Bot** (`HelperType.REPAIRER = 1`): Prioritizes damaged barricades with nanite repair beams (+8 HP/s).
   - High-contrast overhead UI: $38\times 5\text{px}$ dynamic health bars, overhead role badges (`[⚔️ FIGHTER]`, `[💚 MEDIC]`, `[🔧 REPAIR BOT]`), and on-screen Squadron Status HUD + Arrival Banner.
3. **R3. Barricade Saboteurs & Repair Mechanics**:
   - New **Barricade Saboteur** enemy (`EnemyType.SABOTEUR = 13`) targeting central barricades, homing in, latching, and dealing 12.0 DPS gnaw damage with animated rotary drills.
   - **Dual Counter-Mechanics**:
     - Automatic full barricade restoration on wave transitions (`startNextWave()`).
     - Active Repair Bot priority healing with synchronized voxel brick reconstruction in `Barricade.update()`.

---

### Implementation & Verification Milestones
- **Milestone 1 (M1)**: R1 Dynamic Backgrounds & Threat Signifiers (`src/game/GameManager.ts`, `src/game/Enemy.ts`, `src/game/types.ts`).
- **Milestone 2 (M2)**: R2 Allied Reinforcements, Roles & UI (`src/game/Helper.ts`, `src/game/GameManager.ts`, `src/components/game-canvas.tsx`).
- **Milestone 3 (M3)**: R3 Barricade Saboteurs & Repair Mechanics (`src/game/Barricade.ts`, `src/game/Enemy.ts`, `src/game/GameManager.ts`).
- **Milestone 4 (M4)**: Dual-Track Verification, Playwright E2E Suites, Stress Testing, Integrity Audit, and Pre-Commit Build & Git Sync.

---

### Critical Quality & Collaboration Rules
1. **User Approval Gate**: Wait for explicit user approval ("proceed", "go ahead", "승인") before launching implementation workers.
2. **Pre-Commit Build Verification**: Run `npm run build` and `npx tsc --noEmit` with 0 errors before any git commit or push.
3. **No Cheating / Integrity Enforcement**: Real logic only; no hardcoded test shortcuts. Forensic auditor must verify CLEAN.
4. **Trigger Keyword ("내용확인")**: When user inputs "내용확인", immediately consult this file for Claude's latest instructions and proceed.

---

### Current Status
- Orchestrator: `orchestrator_expansion_2`
- Phase: **Phase 1 Execution Active — User Approval Granted ("승인")**
- Dispatched Tracks:
  - **Milestone 1 (M1)**: Dynamic Backgrounds & Threat Signifiers [DONE — 6/6 E2E pass, build pass]
  - **Milestone 2 (M2)**: Allied Reinforcements with Roles & UI [DONE — 5/5 E2E pass, build pass]
  - **E2E Testing Track**: Dual-track Playwright E2E test suite authoring (`tests/17`, `tests/18`, `tests/19`, `TEST_INFRA.md`) [DONE]
  - **Milestone 3 (M3)**: Barricade Saboteurs & Repair Mechanics [IN PROGRESS]
- Next Steps:
  - Complete M3, verify via Reviewers and Challengers.
  - Execute M4 comprehensive E2E validation (all suites), stress tests, forensic integrity audit, pre-commit build verification, and git sync.

---

## Feature Delivered: Continue vs Restart Option on Death (SWE Light)

### Summary of Implementation
- **Game Engine (`src/game/GameManager.ts`)**:
  - `continueGame()`: Revives the player at the current wave preserving score, currency, and upgrades. Resets player death flag, restores player HP to at least 3, grants 1.5s invincibility frames, cleans up active volatile hazards/bullets, clears temporary helper drones, and respawns wave barricades and hostiles for the current wave without loop leaks.
  - `restartFromBeginning()`: Fully resets the game state to Wave 1, score 0, currency 150, and base upgrades via `this.init({ resetScoreAndCash: true, preserveUpgrades: false })`, then launches `this.startGame()`.
- **UI (`src/components/game-canvas.tsx`)**:
  - `GameOverModal` updated with two distinct interactive options:
    - "Continue" (`data-testid="continue-button"`, Korean: `이어하기`)
    - "Restart from Beginning" (`data-testid="restart-button"`, Korean: `처음부터 시작`)
  - Accessible high-contrast color scheme (`bg-emerald-600` vs `bg-red-600`) and responsive mobile layout (`flex-col sm:flex-row`).
- **Automated Verification**:
  - Authored comprehensive E2E suite `tests/continue_vs_restart_on_death.spec.ts` (14/14 tests pass).
  - Verified regression and adversarial suites across 106 tests with 0 failures.
  - Independent post-victory audit confirmed PASS.

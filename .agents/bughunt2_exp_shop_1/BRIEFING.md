# BRIEFING — 2026-09-09T02:51:50Z

## Mission
Investigate Pre-Continue Shop Access Flow & State Persistence in Water Invader, identifying all bugs, race conditions, edge cases, and state corruptions.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/user/src/water-invader/.agents/bughunt2_exp_shop_1
- Original parent: 17c9b6c2-8167-4601-83eb-a48bc12725ca
- Milestone: bughunt2_exp_shop_1

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- NEVER recommend modifying logicalWidth or logicalHeight in GameManager.ts or Enemy.ts
- Wait for explicit user approval before implementation

## Current Parent
- Conversation ID: 17c9b6c2-8167-4601-83eb-a48bc12725ca
- Updated: 2026-09-09T02:48:16Z

## Investigation State
- **Explored paths**:
  - `src/game/GameManager.ts` (`prepareContinue`, `continueGame`, `restartFromBeginning`, `repairTank`, `upgrade...`, `loop`, `spawnWave`, `spawnBarricades`, `init`, `gameOver`)
  - `src/components/game-canvas.tsx` (`ShopUpgradePanel`, `ShopModal`, `GameOverModal`, `handleContinueToShop`, `handleResumeContinuedWave`, `repairTank`)
  - `tests/continue_vs_restart_on_death.spec.ts` (14 Playwright tests)
  - `tests/adversarial_m1_continue_shop_challenger.spec.ts` (8 Playwright tests)
  - `tests/m1_reviewer2_continue_shop_verification.spec.ts` (6 Playwright unit/integration tests)
  - `src/game/Player.ts` (fireRate getters/setters, i-frame flicker, hit flash)
  - `src/game/SoundManager.ts`
- **Key findings**:
  1. **DEFECT 1 (Economy Trap)**: In `GameOverModal`, `ShopUpgradePanel` allows purchasing `Repair Tank (+1 HP)` while player HP is 0 (or <= 0). Purchasing repairs costs 75 currency and increments HP (e.g. 0 -> 1). However, clicking Continue calls `prepareContinue()`, which executes `this.player.hp = Math.max(3, this.player.hp)`. Because `Math.max(3, 1) === 3`, the 75 currency is deducted with ZERO benefit. Players who buy repair in GameOverModal are cheated of currency.
  2. **DEFECT 2 (State Leak / Permanent Invalidation)**: `emergencyAlliesTriggeredThisWave` is never reset in `prepareContinue()`, `continueGame()`, or `init()`. Once player HP drops <= 1 and triggers emergency reinforcements, if the player dies, continuing or restarting will leave `emergencyAlliesTriggeredThisWave === true`. Emergency allies will NEVER trigger again on that wave (or on Wave 1 of a restarted game).
  3. **DEFECT 3 (Visual Desync)**: `alliedReinforcementBannerTimer` and `alliedReinforcementBannerText` are not reset in `prepareContinue()` or `continueGame()`, and `onAlliedReinforcements(false, "")` is not called. A reinforcement banner can persist across Continue onto an arena where all allies were purged.
  4. **DEFECT 4 (Threat Vignette Lingering)**: `threatIntensity` and `activeThreatLevel` are not reset in `prepareContinue()` or `continueGame()`. If death occurred during a Boss or Elite threat, the intense crimson/magenta vignette lingers on a non-boss wave respawn and slowly lerps down instead of clearing.
  5. **DEFECT 5 (Code Duplication / Divergence)**: `game-canvas.tsx:repairTank()` duplicates `GameManager.repairTank()` logic instead of delegating to it, unlike other upgrade methods (`upgradeFireRate`, `upgradeMultiShot`, etc.).
  6. **DEFECT 6 (Flaky End-Game Crisis Incursion on Continued Wave 15+)**: In `continueGame()`, `hasEndGameCrisisOccurred` is reset to false, and `spawnWave()` has a 30% chance (`Math.random() < 0.30`) to immediately trigger an End-Game Crisis on the very first frame of a continued wave, unexpectedly replacing all spawned enemies with the crisis boss with 0s warning banner.
- **Unexplored areas**:
  - Playwright test runner results confirmation (running task-132)

## Key Decisions Made
- Confirmed full flow: Death -> GameOverModal -> Continue -> ShopModal -> Resume Wave.
- Isolated 6 concrete defects/flaws in state persistence, economy, and reset logic.

## Artifact Index
- DISPATCH.md — record of incoming task instructions
- progress.md — task progress and heartbeat
- handoff.md — comprehensive final report

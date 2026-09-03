# BRIEFING — 2026-09-03T14:24:00+09:00

## Mission
Exhaustively investigate edge cases in game state management (GameManager.ts, React state hooks in page.tsx, shop, acid rain/events, game over transitions, pause delta time, combo/high score).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesizer
- Working directory: /Users/user/src/water-invader/.agents/bughunt_exp_edgecases_1/
- Original parent: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Milestone: bughunt_edgecases

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Deliverable: handoff.md in /Users/user/src/water-invader/.agents/bughunt_exp_edgecases_1/
- Send completion message to parent via send_message

## Current Parent
- Conversation ID: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/app/page.tsx`
  - `src/components/game-canvas.tsx`
  - `src/game/GameManager.ts`
  - `src/game/Player.ts`
  - `src/game/Barricade.ts`
  - `src/game/crisis/EndGameCrisis.ts`
  - `src/game/crisis/types.ts`
  - `src/game/Enemy.ts`
  - `tests/unit/pregame_shop_persistence.test.ts`
  - `tests/unit/acid_rain_counterplay.test.ts`
- **Key findings**:
  1. Score carries over across runs upon Game Over -> PLAY AGAIN (`init(false, true)` leaves `this.score` intact).
  2. `this.hasEndGameCrisisOccurred` never resets across runs when starting via `init(false, true)`, permanently disabling crisis incursion in Run 2+.
  3. `this.bullets` is never cleared on `startNextWave()`, leaving previous wave boss bullets in flight.
  4. Missing `this.updateScoreUI()` on bullet hit collision (line 1468) desyncs React TopHUD combo display.
  5. `repairTank` in `GameOverModal` allows spending 75 currency to heal from 0 to 1 HP, which is wiped out to default 3 HP by `Math.max(3, hp)` upon starting again.
  6. Barricade safe zones work cleanly against acid rain, but have 90px gaps between umbrellas; Acid Shield is permanent and 100% effective against acid droplets.
  7. Fixed-timestep physics accumulator cleanly prevents delta time explosion upon unpause; however, no manual pause key exists during active gameplay.
  8. High score is only saved to localStorage upon `gameOver()`; quitting mid-run discards record scores.
- **Unexplored areas**: None within scope.

## Key Decisions Made
- Completed full audit of all 5 requested focus areas plus cross-component React/GameManager interactions.
- Preparing 5-Component handoff report.

## Artifact Index
- `/Users/user/src/water-invader/.agents/bughunt_exp_edgecases_1/handoff.md` — Final analysis report and risk assessment

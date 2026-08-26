# Scope: Milestone 1 — Core Engine & Collision Fixes

## Architecture & Code Layout
- `src/game/GameManager.ts`: Main loop, collision handling, state transitions, event handling, score persistence
- `src/game/Player.ts`: Player state, rendering, shooting, invincibility timer/flicker
- `src/game/Enemy.ts`: Enemy state, shield HP, shield cooldown/regen, rendering
- `src/game/Bullet.ts`: Bullet state, styling, near-miss tracking, interceptable flag
- `src/game/Barricade.ts`: Barricade block grid, health, rendering

## Feature / Defect Inventory
| # | Defect ID | Description | Affected Files | Fix Strategy | Status |
|---|-----------|-------------|----------------|--------------|--------|
| 1 | F-01 | Nested Barricade Collision in Bullet Loop | `GameManager.ts` | Separate enemy-barricade collision check into its own independent loop | DONE |
| 2 | F-02 | Duplicate rAF Game Loops on Restart | `GameManager.ts` | Cancel previous `animationFrameId` before starting a new rAF loop | DONE |
| 3 | F-04 | Player 0s Invincibility Frames | `GameManager.ts`, `Player.ts` | Add 1.0s i-frames timer upon taking damage; skip damage during i-frames; render flicker | DONE |
| 4 | F-06 | Shielded Enemy Direct HP Bypass & 0s Regen | `GameManager.ts`, `Enemy.ts` | Deduct from `shieldHp` first; set 5.0s recharge cooldown on shield break | DONE |
| 5 | F-07 | Sniper Bullet Intercept & Color Styling | `Bullet.ts`, `GameManager.ts` | Render purple for interceptable enemy bullets; add player bullet vs interceptable enemy bullet collision detection | DONE |
| 6 | F-08 | Near-Miss Multi-Frame Suppression Surge | `GameManager.ts`, `Bullet.ts` | Add `hasTriggeredNearMiss` flag on `Bullet` to ensure near-miss applies at most once per bullet | DONE |
| 7 | F-15 | LocalStorage NaN score corruption recovery | `GameManager.ts` | Add validation/fallback when parsing score/highScore from LocalStorage (`isNaN(score) ? 0 : score`) | DONE |

## Quality Gate Criteria
1. Build check passes cleanly: `npm run build` -> **PASS**
2. Test check passes cleanly: `npx playwright test` -> **PASS** (19/19 M1 tests + 33/33 Core tests = 52/52 tests)
3. All Reviewers APPROVE -> **PASS** (`reviewer_1`, `reviewer_2`)
4. All Challengers confirm correctness & no regressions -> **PASS** (`challenger_1`, `challenger_2`)
5. Forensic Auditor reports CLEAN -> **PASS** (`auditor_1`)

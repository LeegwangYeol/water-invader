# Handoff Report: Specialist 3.6 — Dynamic Salvage Insurance & High-Stakes Wagers

**Agent**: Specialist 3.6 (Swarm Creative Brainstorming)  
**Domain**: Dynamic Salvage Insurance, High-Stakes Wagers & Underwater Underwriting Mechanics  
**Working Directory**: `/Users/user/src/water-invader/.agents/swarm_d3_salvageinsure_6/`  
**Full Proposal Report**: `/Users/user/src/water-invader/.agents/swarm_d3_salvageinsure_6/report.md`  

---

## 1. Observation

1. **Current Death & Continue Architecture**:
   - In `src/game/GameManager.ts`:
     - Line 2319: `this.state = GameState.GAME_OVER;` triggers death sequence and updates high score.
     - Lines 565–652 (`continueGame()`): Revives player at current wave (`this.spawnWave({ isContinue: true })`), restores HP to at least 3 (`this.player.hp = Math.max(3, this.player.hp)`), and clears hostiles, preserving all player upgrades.
     - Lines 654–657 (`restartFromBeginning()`): Calls `this.init({ resetScoreAndCash: true, preserveUpgrades: false })`, resetting the player completely to Wave 1 with 0 upgrades and 0 currency.
   - In `src/components/game-canvas.tsx`:
     - Lines 540–589 (`GameOverModal`): Displays `ShopUpgradePanel` followed by two explicit choices: Continue (`onContinue`) and Restart from Beginning (`handleRestart`).
2. **Upgrades & Economic Sinks**:
   - In `src/game/Player.ts` (lines 12–26):
     - Player has upgradeable stats: `baseFireRate`, `multiShot`, `piercing`, `hasAcidShield`, and `homingMissiles` (Levels 1 to 5, costing up to 500 💧).
   - In `src/components/game-canvas.tsx` (lines 40–127):
     - Upgrades cost from 50 💧 (Fire Rate) to 200 💧 (Piercing) and escalating costs for Homing Missiles.
3. **Procedural Web Audio API Sound Infrastructure**:
   - In `src/game/SoundManager.ts` (lines 1–90):
     - All game sounds (`playShoot`, `playExplosion`, `playPowerUp`) are procedurally synthesized using `AudioContext`, oscillators, gain nodes, and biquad filters, requiring zero external MP3/WAV assets.
4. **Architectural & Test Constraints**:
   - In `PROJECT.md` & `ORIGINAL_REQUEST.md`:
     - Hard invariant: `logicalWidth` (800) and `logicalHeight` (600) in `GameManager.ts` must never be altered.
     - Hard constraint for this ideation phase: Zero modification of source code (.ts, .tsx, .css), no builds, no git commands.

---

## 2. Logic Chain

1. **Premise 1 (Observation 1)**: Players who reach deep waves (Waves 10–25) and suffer hull breach face an acute psychological dilemma. Restarting wipes 100% of upgrades and resets to Wave 1, producing severe fatigue. Continuing with depleted currency often traps the player in a repeat death cycle.
2. **Premise 2 (Observation 2)**: Upgrade investments accumulate to thousands of Pure Water drops (💧) by late game. Because currency represents player skill and combo mastery, losing it entirely feels unfairly punishing, whereas insuring it introduces engaging economic decision-making.
3. **Inference 1 (Salvage Insurance Solution)**: Introducing the **Nautilus Underwriters Guild** allows players to buy salvage policies (Bronze, Silver, Gold). Under Gold Sovereign indemnity, a player perishing on Wave 15 retains 85% currency and their weapons (e.g. Homing Missiles Lv 4), converting "Restart from Beginning" into a thrilling, empowered **Prestige New Game+ Run** where they blaze through early waves to set record scores.
4. **Inference 2 (High-Stakes Wager Synergy)**: To cater to aggressive, high-skill players, offering 6 High-Stakes Wager contracts (e.g. Ironclad Diver for 0-hit clears, Blitz Decimator for sub-30s clears) provides 2.2x to 4.5x cash dividends. This creates a compelling press-your-luck loop that fuels faster upgrade acquisition.
5. **Inference 3 (Audio & UI Compliance - Observations 3 & 4)**: The proposed audio suite (cash register clink, wax stamp chunk, warning klaxon) can be synthesized purely through Web Audio API nodes in `SoundManager.ts`. The UI can be integrated cleanly into `ShopModal` and `GameOverModal` in `game-canvas.tsx` with zero impact on `logicalWidth`/`logicalHeight` and zero GC overhead during 60 FPS combat.

---

## 3. Caveats

- **No Code Implementation Executed**: In strict compliance with the prompt's hard constraints, no `.ts`, `.tsx`, or `.css` files were modified, and no git commands or builds were executed.
- **Cross-Run Persistence Assumption**: The proposal assumes `localStorage` is accessible for saving persistent salvage policies across browser sessions (consistent with existing `waterInvaderHighScore` usage in `GameManager.ts:2327`).
- **Balancing Tuning**: Specific payout multipliers (e.g., 2.8x for Ironclad Diver, 85% return on Gold policy) are modeled on typical 15-minute arcade play sessions and should be fine-tuned via Playwright automated headless playthroughs prior to release.

---

## 4. Conclusion

The proposal for **Dynamic Salvage Insurance & High-Stakes Wager Mechanics** provides a comprehensive, mathematically rigorous, and theme-cohesive feature expansion for "Water Invader". It solves the game's core player-retention dilemma on death, introduces exhilarating press-your-luck wagering, features rich audiovisual immersion via procedural Web Audio synthesis, and seamlessly interlocks with the existing Continue and Pre-Game Shop systems.

The complete 7-section design document has been written to:  
`/Users/user/src/water-invader/.agents/swarm_d3_salvageinsure_6/report.md`.

---

## 5. Verification Method

To independently verify this work:
1. Inspect the proposal report:
   ```bash
   cat /Users/user/src/water-invader/.agents/swarm_d3_salvageinsure_6/report.md
   ```
2. Verify that zero source code modifications were made:
   ```bash
   git status --porcelain
   ```
   (Should confirm no modified files in `src/`).
3. Verify that all 6 required domains from the dispatch prompt are exhaustively detailed in `report.md`:
   - Section 1: Concept & Underwater Underwriting Hook
   - Section 2: Mechanics & Actuarial Math (premiums, payouts, salvage %)
   - Section 3: Tactical & Economy Loop (hedging vs pushing luck)
   - Section 4: Visuals & Procedural Web Audio SFX
   - Section 5: UI Insurance Policy & Claim Settlement Modals
   - Section 6: Synergies with Continue vs Restart Mechanic & Feasibility

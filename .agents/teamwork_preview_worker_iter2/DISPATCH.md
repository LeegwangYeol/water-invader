## 2026-09-02T06:01:42Z
You are teamwork_preview_worker_iter2.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_iter2
Workspace Directory: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Challenger 2 Report: /Users/user/src/water-invader/.agents/teamwork_preview_challenger_2/handoff.md
Reviewer 2 Report: /Users/user/src/water-invader/.agents/teamwork_preview_reviewer_2/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership (Files you own):
- src/game/GameManager.ts
- tests/13_qol_and_crisis_mechanics.spec.ts

Tasks to Implement:
1. In `src/game/GameManager.ts` line ~1925:
   Fix `upgradeFireRate()` cap condition:
   ```ts
   public upgradeFireRate() {
     if (this.currency >= 50 && this.getUpgrades().fireRate < 5) {
       this.currency -= 50;
       this.player.fireRate = Math.max(0.1, Number((this.player.fireRate - 0.1).toFixed(2)));
       soundManager.playPowerUp();
       this.updateScoreUI();
       this.updateUpgradesUI();
     }
   }
   ```

2. In `src/game/GameManager.ts` line ~138:
   Support polymorphic options object and positional boolean parameters in `init()`:
   ```ts
   public init(
     resetScoreAndCashOrOptions: boolean | { resetScoreAndCash?: boolean; preserveUpgrades?: boolean } = false,
     preserveUpgrades: boolean = false
   ) {
     let resetScoreAndCash = false;
     let shouldPreserve = preserveUpgrades;
     if (typeof resetScoreAndCashOrOptions === 'object' && resetScoreAndCashOrOptions !== null) {
       resetScoreAndCash = !!resetScoreAndCashOrOptions.resetScoreAndCash;
       shouldPreserve = !!resetScoreAndCashOrOptions.preserveUpgrades;
     } else if (typeof resetScoreAndCashOrOptions === 'boolean') {
       resetScoreAndCash = resetScoreAndCashOrOptions;
     }
     // Ensure shouldPreserve is used for all upgrade preservation logic
   ```

3. In `tests/13_qol_and_crisis_mechanics.spec.ts`:
   - Line 15: Disambiguate `h1` locator (use `page.locator('h1').first()` or `page.locator('div.z-20 h1')`).
   - Line 86: Update pre-game launch button regex to `/START|NEXT WAVE|DEPLOY|출격|CLOSE|PLAY/i`.
   - Filter HMR websocket messages (`msg.text().includes('_next/hmr')`) in console error listener.

4. Verification:
   - Run `npx tsc --noEmit`
   - Run `npm run build`
   - Run `SKIP_WEBSERVER=1 npx playwright test tests/adversarial_economy_shop_persistence_stress.spec.ts tests/unit/`
   - Run `npx playwright test tests/13_qol_and_crisis_mechanics.spec.ts`
   - Write `handoff.md` and report back.

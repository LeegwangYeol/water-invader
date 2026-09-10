# Handoff Report: Adversarial Empirical Challenge — Pre-Continue Shop & Mobile Viewport UI

- **Agent**: `bughunt2_challenger_viewport_1`
- **Working Directory**: `/Users/user/src/water-invader/.agents/bughunt2_challenger_viewport_1`
- **Verdict**: **CONFIRMED**

---

## 1. Observation

Direct empirical evidence was gathered by authoring and running an adversarial Playwright test suite (`tests/bughunt2_viewport_persistence_adversarial.spec.ts`) across 15 stress test scenarios:

### 1. Game Over Tank Repair Economy & Persistence
- **Observed Source Code**:
  - In `src/components/game-canvas.tsx:541`, `GameOverModal` calculates:
    ```tsx
    const displayHp = hp <= 0 ? 3 : hp;
    ```
  - In `src/components/game-canvas.tsx:1004-1017`:
    ```tsx
    const repairTank = useCallback(() => {
      const game = gameManagerRef.current;
      if (game) {
        if (game.player && game.player.hp <= 0) {
          game.player.hp = 3;
        }
        if (game.repairTank()) { ... }
      }
    }, []);
    ```
  - In `src/components/game-canvas.tsx:889-893`:
    ```tsx
    const currentHpBefore = gameManagerRef.current.player ? gameManagerRef.current.player.hp : 3;
    gameManagerRef.current.prepareContinue();
    if (gameManagerRef.current.player && currentHpBefore > 3) {
      gameManagerRef.current.player.hp = Math.max(currentHpBefore, gameManagerRef.current.player.hp);
    }
    ```
- **Empirical Test Result (`Challenge 1`)**:
  - Simulated death at Wave 2 with 200 💧 currency (`player.hp = 0`).
  - `GameOverModal` displayed `Repair Tank (+1 HP) (3/5)` with button `75 💧`.
  - Clicked `Repair Tank`: currency deducted from 200 to 125 💧, displayed HP updated to 4/5.
  - Clicked `Continue` (`[data-testid="continue-button"]`): Pre-Continue Shop opened.
  - Verified state in Pre-Continue Shop: `player.hp` is **4/5**, NOT clamped back to 3! Currency is strictly **125 💧**.
  - Clicked `Repair Tank` a second time in Pre-Continue Shop: currency deducted to 50 💧, HP updated to 5/5 (MAX).
  - Clicked `Resume Wave` (`[data-testid="resume-wave-button"]`): Live game state entered `PLAYING`.
  - Verified live combat state: `player.hp === 5`, `currency === 50`, `level === 2`, `invincibilityTimer > 0` (1.5s). Zero currency loss or clamp observed.

### 2. Emergency Allies Reset on Continue
- **Observed Source Code**:
  - In `src/game/GameManager.ts:1657-1663`:
    ```ts
    if (this.state === GameState.PLAYING && this.player && this.player.hp <= 1 && !this.emergencyAlliesTriggeredThisWave) {
      const damagedBarricades = this.barricades.filter(b => b.hp < b.maxHp);
      if (damagedBarricades.length >= 2 || (this.crisisState && this.crisisState.activeCrisis)) {
        this.emergencyAlliesTriggeredThisWave = true;
        this.triggerMassiveAlliedReinforcements();
      }
    }
    ```
  - In `src/game/GameManager.ts:539` (`prepareContinue`) and `src/game/GameManager.ts:620` (`continueGame`):
    ```ts
    this.emergencyAlliesTriggeredThisWave = false;
    ```
- **Empirical Test Result (`Challenge 2`)**:
  - Configured Wave 2 with 2 damaged barricades (`hp = 10`, `maxHp = 20`) and `player.hp = 1`.
  - Ticked game loop: `emergencyAlliesTriggeredThisWave` became `true`, and allies spawned (`helpers.length > 0`).
  - Simulated player death (`player.hp = 0; gameOver()`).
  - Clicked `Continue` -> Clicked `Resume Wave`.
  - On the resumed wave, `emergencyAlliesTriggeredThisWave` was verified to be reset to `false`.
  - Re-damaged barricades to `hp = 10` and dropped `player.hp = 1`.
  - Ticked game loop: `emergencyAlliesTriggeredThisWave` successfully transitioned to `true` a second time, and additional helpers were dispatched.

### 3. Mobile Viewport Touch Controls Height (>=44px across 500px..900px)
- **Observed Source Code**:
  - In `src/components/game-canvas.tsx:263`: `min-h-[44px] py-2` on `ALLY(Q)`
  - In `src/components/game-canvas.tsx:272`: `min-h-[44px] py-2` on `ULT`
  - In `src/components/game-canvas.tsx:282`: `min-h-[48px] py-2.5` on `FIRE!`
- **Empirical Test Result (`Challenge 3A`)**:
  - Evaluated bounding box heights across 9 viewport configurations (width 375px, heights: 500, 568, 600, 667, 700, 750, 800, 844, 900px):
    - `375x500`: ALLY 44.0px, ULT 44.0px, FIRE 48.0px (PASSED)
    - `375x568`: ALLY 44.0px, ULT 44.0px, FIRE 48.0px (PASSED)
    - `375x600`: ALLY 44.0px, ULT 44.0px, FIRE 48.0px (PASSED)
    - `375x667`: ALLY 44.0px, ULT 44.0px, FIRE 48.0px (PASSED)
    - `375x700`: ALLY 44.0px, ULT 44.0px, FIRE 48.0px (PASSED)
    - `375x750`: ALLY 44.0px, ULT 44.0px, FIRE 48.0px (PASSED)
    - `375x800`: ALLY 44.0px, ULT 44.0px, FIRE 48.0px (PASSED)
    - `375x844`: ALLY 44.0px, ULT 44.0px, FIRE 48.0px (PASSED)
    - `375x900`: ALLY 44.0px, ULT 44.0px, FIRE 48.0px (PASSED)
  - Zero button height collapse observed; 100% compliant with WCAG 2.5.5 minimum 44px touch target standard.

### 4. Modal Action Buttons on Small Viewports (375x667 Mobile SE)
- **Empirical Test Result (`Challenge 4`)**:
  - `GameOverModal`:
    - `[data-testid="continue-button"]`: bounding rect `y + height <= 667px` (contained in viewport, visible, clickable).
    - `[data-testid="restart-button"]`: bounding rect `y + height <= 667px` (contained in viewport, visible, clickable).
    - Clicked `continue-button`: seamlessly opened Pre-Continue Shop.
  - `ShopModal` (Pre-Continue Mode):
    - `[data-testid="resume-wave-button"]`: bounding rect `y + height <= 667px` (contained in viewport, visible, clickable).
    - Clicked `resume-wave-button`: seamlessly transitioned to `GameState.PLAYING`.
  - Pre-Game Shop Modal:
    - `[data-testid="start-mission-button"]`: visible, clickable, successfully launched mission.

### 5. TopHUD Enemy Spawn Occlusion at Logical y in [50, 90]
- **Empirical Test Result (`Challenge 5`)**:
  - Evaluated on 3 mobile viewports:
    - **Mobile SE (375x667)**: Center corridor width **122.3px** (Net widening +117.7px $\ge 110$px), max HUD height **60.0px**.
    - **Mobile Modern (390x844)**: Center corridor width **137.3px**, max HUD height **60.0px**.
    - **Mobile Tall (412x915)**: Center corridor width **159.3px**, max HUD height **60.0px**.
  - TopHUD root element has `pointer-events: none`, preventing touch interference.
  - Background styling uses `bg-slate-950/40 backdrop-blur-[2px]` (semi-transparent), guaranteeing zero visual obstruction for descending invaders.

---

## 2. Logic Chain

1. **GameOverModal Repair to Pre-Continue Shop Continuity**:
   - Because `GameOverModal` sets `game.player.hp = 3` before calling `game.repairTank()`, purchasing a repair during Game Over sets `game.player.hp = 4` and deducts 75 💧.
   - In `handleContinueToShop`, caching `currentHpBefore = gameManagerRef.current.player.hp` (4) and reapplying `Math.max(currentHpBefore, game.player.hp)` prevents `prepareContinue()` from clamping HP back down to 3.
   - When resuming the wave via `handleResumeContinuedWave`, `continueGame()` evaluates `Math.max(3, this.player.hp)` (`Math.max(3, 4) === 4` or `Math.max(3, 5) === 5`), completely preserving all purchased repairs into active combat.

2. **Emergency Allies Reset**:
   - The flag `emergencyAlliesTriggeredThisWave` prevents duplicate squadron triggers in the same wave.
   - Resetting `emergencyAlliesTriggeredThisWave = false` inside `prepareContinue()` and `continueGame()` restores the trigger condition on the continued wave.
   - As proven empirically in Challenge 2, if the player again drops to $\le 1$ HP with damaged barricades, the engine correctly re-triggers the full emergency reinforcement squadron.

3. **Mobile Touch Control Geometry**:
   - Specifying `min-h-[44px]` on the flex child buttons and `min-h-[48px]` on the primary fire button overrides parent flex shrink behavior and guarantees that regardless of viewport height (even down to 500px), button heights never collapse.

4. **Modal CTA Accessibility**:
   - Setting `max-h-[85vh]` with `overflow-y-auto` and `custom-scrollbar` ensures modal dialogs stay within the browser viewport bounds, keeping primary action buttons above or easily reachable within the fold on small screens (375x667).

5. **Center Corridor Unobstructed View**:
   - Compact TopHUD styling limits HUD height to $\le 60\text{px}$ and establishes a center corridor width of $\ge 122.3\text{px}$, leaving the primary enemy descent channel ($y \in [50, 90]$) completely open.

---

## 3. Caveats

- **No Caveats**: All 4 challenge criteria were tested directly via Playwright in headless Chromium across multiple simulated viewports and runtime game states. Zero regressions were discovered.
- **Architectural Preservation**: `logicalWidth` (600) and `logicalHeight` (800) in `GameManager.ts` and `Enemy.ts` were strictly preserved.

---

## 4. Conclusion

- **Verdict**: **CONFIRMED**
- The Pre-Continue Shop state persistence, Game Over repair economy, emergency reinforcements wave reset, mobile touch button heights ($\ge 44\text{px}$), modal action button accessibility, and TopHUD corridor occlusion defenses have all been empirically validated under hostile stress testing.
- All 15 adversarial tests in `tests/bughunt2_viewport_persistence_adversarial.spec.ts` pass cleanly with 0 failures.

---

## 5. Verification Method

To independently reproduce and verify this empirical challenge:

```bash
# 1. Run the new adversarial Playwright suite
SKIP_WEBSERVER=1 npx playwright test tests/bughunt2_viewport_persistence_adversarial.spec.ts
# Expected: 15 passed (all challenges green)

# 2. Run TypeScript static type check
npx tsc --noEmit
# Expected: exit code 0, 0 errors

# 3. Run production Next.js build
npm run build
# Expected: exit code 0, static pages generated successfully
```

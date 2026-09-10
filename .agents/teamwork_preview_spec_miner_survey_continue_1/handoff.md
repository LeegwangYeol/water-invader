# Specification Mining Report: Continue Flow, Pre-Continue Shop Access & Crash Prevention (R1 & R4)

**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_survey_continue_1`  
**Target Project**: Water Invader (Next.js 16 / React 19 / TypeScript)  
**Assigned Requirements**: R1 (Pre-Continue Shop Access) & R4 (Stability & Crash Prevention Verification)  
**Authoritative Specs**: `ORIGINAL_REQUEST.md`, `PROJECT.md`, `COLLABORATION.md`  

---

## 1. Observation

### 1.1 Death & Game Over Lifecycle
- **Trigger Points (`src/game/GameManager.ts`)**:
  - Direct enemy bullet collision: Line 1149: `if (this.player.hp <= 0) this.gameOver("정수기가 파괴되었습니다. (체력 소진)");`
  - Environmental acid storm tick: Line 1380: `this.gameOver("정수기가 산성 폭풍에 부식되었습니다. (체력 소진)");`
  - Solar flare beam tick: Line 1444: `this.gameOver("정수기가 고에너지 태양 플레어에 소멸되었습니다. (체력 소진)");`
  - Hazard projectile collision: Line 1501: `if (this.player.hp <= 0) this.gameOver("정수기능이 파괴되었습니다 (체력 소진)");`
  - Invader threshold breach: Line 1517: `this.gameOver("워터 인베이더가 방어선을 돌파했습니다! (체력 소진)");`
  - Direct ship collision: Line 1996: `this.gameOver("정수기가 파괴되었습니다. (체력 소진)");`
- **Engine State on Death (`src/game/GameManager.ts`, lines 2187–2208)**:
  ```ts
  private gameOver(reason: string) {
    this.gameOverReason = reason;
    this.state = GameState.GAME_OVER;
    if (this.player) {
      this.player.isDead = true;
    }
    this.alliedReinforcements = undefined;
    soundManager.playGameOver();
    ...
    if (this.onStateChange) this.onStateChange(this.state);
  }
  ```
  - **Loop Behavior**: `requestAnimationFrame(this.loop)` is **not** cancelled on `gameOver()`. Instead, `loop` continues running at 60 FPS (lines 1066–1098), but `while (this.accumulator >= this.FIXED_STEP)` breaks immediately when `this.state !== GameState.PLAYING`. It executes `draw()` each frame to keep background visuals alive under the React overlay.
- **UI State on Death (`src/components/game-canvas.tsx`, lines 1260–1279)**:
  - `gameState === GameState.GAME_OVER` renders `<GameOverModal>` overlay.
  - `<GameOverModal>` currently renders:
    1. Title: "GAME OVER" + `gameOverReason` + `Final Score: score`
    2. Embedded `<ShopUpgradePanel ... />` (lines 532–544)
    3. Two buttons:
       - Continue button: `data-testid="continue-button"`, `onClick={onContinue}` (bound to `continueGame`)
       - Restart button: `data-testid="restart-button"`, `onClick={restartFromBeginning}`

---

### 1.2 `continueGame()` vs `restartFromBeginning()` Comparison
Inspected lines 486–569 and 285–350 in `src/game/GameManager.ts`:

| Property / System | `continueGame()` (lines 486–560) | `restartFromBeginning()` (lines 562–565 & `init` lines 285–350) |
|---|---|---|
| **`state`** | `GameState.PLAYING` | `GameState.PLAYING` (via `startGame()`) |
| **`level` (Wave)** | **Preserved** (`this.level` remains untouched, e.g. Wave 4) | **Reset to 1** (`this.level = 1`) |
| **`score`** | **Preserved** (`this.score` retained) | **Reset to 0** (`this.score = 0`) |
| **`currency`** | **Preserved** (`this.currency` retained) | **Reset to 150** (`this.currency = 150`) |
| **`player.hp`** | `Math.max(3, this.player.hp)` (revived to $\ge 3$) | Reset to 3 (`this.player.hp = 3`) |
| **`player.isDead`** | Set to `false` | Set to `false` |
| **`player` upgrades** | **Preserved intact** (`baseFireRate`, `multiShot`, `piercing`, `hasAcidShield`, `homingMissiles`) | **Reset to base** (`multiShot=1`, `piercing=1`, `hasAcidShield=false`, `homingMissiles=0`, `fireRate=0.5`) |
| **`player.invincibilityTimer`** | Set to **1.5s** (`1.5`) | Set to 0 |
| **`player.position`** | Centered: `(logicalWidth / 2 - 25, logicalHeight - 60)` | Centered: `(logicalWidth / 2 - 25, logicalHeight - 60)` |
| **Volatile Hazards** | Cleared (`bullets = []`, `hazardProjectiles = []`, `solarFlares = []`) | Cleared |
| **Enemies** | Cleared (`enemies = []`), then `spawnWave()` for **current** `this.level` | Cleared, then `spawnWave()` for **Wave 1** |
| **Allied Drones (`helpers`)** | Cleared (`helpers = []`) | Cleared (`helpers = []`) |
| **Barricades** | Freshly re-spawned via `this.spawnBarricades()` (all 4 slots with 24 full voxels) | Freshly re-spawned via `this.spawnBarricades()` |
| **EndGameCrisis** | `this.endGameCrisis = null`, resets `hasEndGameCrisisOccurred = false` if undefeated | Reset |
| **Animation Loop** | Cancels existing rAF if present, starts fresh `requestAnimationFrame(this.loop)` | Cancels existing rAF, starts fresh `loop` |

---

### 1.3 Shop Modal & Upgrades Architecture
- **Component Definition (`src/components/game-canvas.tsx`, lines 420–483)**:
  - `ShopModal` currently supports two modes:
    - Normal wave clear: `isPreGame = false`, Title: "웨이브 클리어 (WAVE CLEARED)", Button: "다음 웨이브 (NEXT WAVE)" (`onClick={startNextWave}`).
    - Pre-game lobby: `isPreGame = true`, Title: "정비소 / 무기고 (ARMORY & WORKSHOP)", Button: "웨이브 1 출격 (START MISSION)" (`onClick={startGame}`).
- **Purchasable Items (`ShopUpgradePanel`, lines 25–130)**:
  1. Tank Repair: Cost 75 💧, restores +1 HP up to `player.maxHp || 5`.
  2. Fire Rate: Cost 50 💧, level 1–5.
  3. Multi-Shot: Cost 100 💧, level 1–5.
  4. Piercing: Cost 200 💧, level 1–5.
  5. Acid Shield: Cost 150 💧, single purchase (boolean).
  6. Homing Missiles: Costs `[250, 450, 700, 1000, 1400]` 💧, level 0–5.
- **CRITICAL DEFECT IDENTIFIED (Line 51 of `src/components/game-canvas.tsx`)**:
  ```tsx
  <button 
    onClick={onRepairTank}
    disabled={currency < 75 || hp >= 5 || hp <= 0}
    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded font-bold transition-colors"
  >{hp >= 5 ? 'MAX' : '75 💧'}</button>
  ```
  **Verbatim Blocker**: `hp <= 0` is present in the `disabled` condition! When the player dies, `hp` is 0. If the player enters the shop while `hp === 0`, **the Repair Tank button is permanently disabled**, making it impossible to purchase HP restoration unless either:
  1. The player is revived with `hp = 3` upon clicking Continue before the Shop opens, AND
  2. The `hp <= 0` condition is removed from `disabled` in `ShopUpgradePanel`.

---

### 1.4 Existing Test Harness Impact
- **Test File**: `tests/continue_vs_restart_on_death.spec.ts` (lines 64–99) & `tests/bughunt_empirical_edgecases_state_machine.spec.ts` (lines 639–673).
  - In `continue_vs_restart_on_death.spec.ts`:
    ```ts
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await continueBtn.click();
    await page.waitForTimeout(200);
    ...
    expect(gameState.state).toBe('PLAYING');
    ```
  - **Direct Impact**: The previous test suite expected that clicking `[data-testid="continue-button"]` transitioned `gameState` directly to `'PLAYING'`. Under requirement R1, clicking Continue enters the Shop modal (`state === 'SHOP'`), and gameplay only resumes after clicking the Shop's action button (e.g. `[data-testid="resume-wave-button"]`).

---

## 2. Logic Chain

1. **Premise 1 (User Requirement R1)**: `ORIGINAL_REQUEST.md` (lines 213–215, 229) specifies: *"When a player dies and selects the 'Continue' (이어하기) option, they must be given an opportunity to access the Shop to purchase additional upgrades (including HP restoration/upgrades) before the wave actually resumes."*
2. **Premise 2 (Current Flaw in Continue)**: In `src/components/game-canvas.tsx` (line 1274), `GameOverModal` binds `onContinue={continueGame}`. `continueGame()` (lines 835–847) immediately calls `gameManagerRef.current.continueGame()`, which starts `spawnWave()`, resets `this.state = GameState.PLAYING`, and fires `requestAnimationFrame(this.loop)`. There is zero intermediate pause or dedicated shop modal.
3. **Premise 3 (HP Repair Barrier)**: Even though `ShopUpgradePanel` was embedded into `GameOverModal`, `ShopUpgradePanel.tsx` line 51 disables the repair button if `hp <= 0`. On death, `hp === 0`, so the player could never buy HP restoration on death.
4. **Premise 4 (State Separation)**:
   - When the player selects "Continue" (`data-testid="continue-button"`):
     - The game should NOT immediately spawn the wave and resume combat.
     - Instead, the engine should revive the player baseline (`player.isDead = false`, `player.hp = Math.max(3, player.hp)`), pause combat loop execution (`gameManager.pause()`), and transition to `GameState.SHOP` with `shopMode = 'CONTINUE'` (or `isContinueShop = true`).
   - The `<ShopModal>` component must display:
     - Header: "정비소 / 무기고 (이어하기)" / "ARMORY & WORKSHOP (CONTINUE)"
     - Subtitle: "전투 재개 전 무기와 체력을 정비하세요!" / "Prepare weapons & restore HP before resuming Wave X!"
     - Full `ShopUpgradePanel` (with `hp <= 0` disabled check removed so HP repair works up to `maxHp = 5`).
     - Action button: "전투 재개 (RESUME WAVE)" with `data-testid="resume-wave-button"` (and dual fallback `data-testid="next-wave-button"`).
   - When that resume button is clicked:
     - The engine executes `continueGame()`, which spawns fresh barricades, spawns wave hostiles for the current wave, grants 1.5s invincibility frames, and starts the `requestAnimationFrame(this.loop)` loop cleanly.
5. **Conclusion on Architecture**: Wiring Continue -> Shop -> Resume cleanly separates death recovery, player purchasing, and combat resumption into distinct, verifiable phases without state corruption.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Death Flow | `GameManager.gameOver(reason)` | Sets `state = GAME_OVER`, marks `player.isDead = true`, clears allied fleet, triggers game over audio, records high score in `localStorage`. | `reason: string` | None (fires `onStateChange`) | Gracefully catches `localStorage` exceptions (`try/catch`). | `src/game/GameManager.ts:2187` |
| 2 | Continue Flow | `GameManager.continueGame()` | Respawns player on current wave with score, currency, and upgrades preserved; restores HP $\ge 3$; clears bullets/hazards; spawns barricades and wave enemies. | None | None | Re-initializes `player` if missing. | `src/game/GameManager.ts:486` |
| 3 | Reset Flow | `GameManager.restartFromBeginning()` | Calls `init({ resetScoreAndCash: true, preserveUpgrades: false })`, wipes upgrades, resets wave to 1, score to 0, currency to 150. | None | None | None. | `src/game/GameManager.ts:562` |
| 4 | Shop UI | `ShopModal` (Pre-Game & Wave Clear) | Modal overlay presenting `ShopUpgradePanel` and a button to advance to Wave 1 (`startGame`) or next wave (`startNextWave`). | Props: `currency, hp, upgrades, isPreGame, onNextWave` | JSX Element | Buttons disabled when currency insufficient or stat maxed. | `src/components/game-canvas.tsx:435` |
| 5 | Shop Upgrades | Tank Repair (`repairTank`) | Restores +1 HP (up to 5) for 75 Pure Water currency. Plays powerup sound. | Click event | `player.hp` +1, `currency` -75 | Blocked if `currency < 75` or `hp >= 5` or `hp <= 0`. | `src/components/game-canvas.tsx:915` |
| 6 | Shop Upgrades | Weapon Upgrades (FireRate, MultiShot, Piercing, AcidShield, HomingMissiles) | Purchases tactical weapon upgrades with tier-based scaling prices and stat ceilings. | Currency | Increments player stat, updates UI | Returns false / no-op if currency insufficient or max tier reached. | `src/game/GameManager.ts:2734` |
| 7 | Barricade Reset | `spawnBarricades()` vs `restoreBarricades()` | `spawnBarricades()` instantiates fresh Barricades; `restoreBarricades()` refills blocks in place. | None | 4 Barricade objects | Self-heals if `barricades.length < 4`. | `src/game/GameManager.ts:388, 401` |
| 8 | Crisis Recovery | Undefeated Crisis Reset on Continue | If player died during End-Game Crisis (Stage 15) without defeating it, `hasEndGameCrisisOccurred` is reset to `false` so the crisis can re-occur. | None | Boolean flag reset | Guarded by `endGameCrisisDefeatedHandled`. | `src/game/GameManager.ts:532` |
| 9 | Audio Management | Sound Concurrency on Death/Revive | `soundManager.playGameOver()`, `soundManager.init()`, `soundManager.playPowerUp()`. | Audio context | Web Audio synth tones | Ignores suspended audio context until interaction. | `src/game/SoundManager.ts` |
| 10 | Loop Throttling | Frame Accumulator & Death Spiral Guard | Max `frameTime` clamped to `0.1s` (100ms) to prevent simulation explosion on lag/tab out. | `timestamp: number` | Physics update ticks | Clamps `frameTime <= 0.1`. | `src/game/GameManager.ts:1073` |

---

## 4. Edge Cases & Observed Behavior

| # | Feature | Input / Scenario | Observed / Expected Behavior |
|---|---------|------------------|------------------------------|
| 1 | HP Repair on Death | Player has 0 HP on death and enters Shop | In current code, `disabled={... \|\| hp <= 0}` prevents repair. Fix: revive to baseline 3 HP on Continue, and remove `hp <= 0` disable check so player can repair from 3 to 4 or 5. |
| 2 | Consecutive Continues | Player dies, continues, dies again on same wave | Loop restarts cleanly; score and currency accumulate; wave level does not change; barricades cleanly reset each time. |
| 3 | Rapid Button Spam | Player rapidly clicks "Continue" 3–5 times within 100ms | In current code, multiple rAF requests could leak if not debounced. With `isResuming` debouncing and `cancelAnimationFrame`, exactly 1 loop survives. |
| 4 | Mid-Crisis Death | Player killed during Stage 15 End-Game Crisis | `endGameCrisis` is cleared; `hasEndGameCrisisOccurred` reset to `false`; player can continue without permanent crisis lockout. |
| 5 | Mid-Warp-In Death | Player killed while Allied Reinforcements are warping in | `alliedReinforcements = undefined` cleans reference; `helpers = []` purges lingering drones; zero memory or entity leaks. |
| 6 | Currency Depletion | Player spends all currency on upgrades in Continue Shop | Player currency drops to 0; remaining buttons disable cleanly; wave resumes with purchased upgrades intact. |
| 7 | Zero Purchases | Player opens Continue Shop and clicks "Resume Wave" without buying anything | Game resumes with baseline 3 HP, preserved score/currency/upgrades, and fresh wave hostiles. |
| 8 | Mobile Pointer Drag on Death | Player dies while actively dragging finger on touch screen | `isDraggingRef.current` and pointer refs must be reset to `null` so ship does not jerk across screen upon wave resume. |
| 9 | Wave Cleared vs Continue | Distinguishing wave clear shop from continue shop | Wave clear shop increments `level++` via `startNextWave()`; Continue shop retains current `level` via `continueGame()`. |
| 10 | Barricade Saboteur Latch | Saboteur latched onto barricade when player dies | `this.enemies = []` and `spawnBarricades()` cleanly instantiate fresh objects, eliminating latch reference leaks. |

---

## 5. Failure Mode & Crash Risk Analysis (R4)

| Failure Mode | Root Cause | Impact | Specific Mitigation & Architecture Rule |
|---|---|---|---|
| **FM-1: Double rAF Loop Leak** | Uncancelled `this.animationFrameId` when transitioning between `GAME_OVER`, `SHOP`, and `PLAYING`. | 120+ FPS double update, physics tunneling, battery drain, game speed doubling. | 1) `gm.pause()` explicitly calls `cancelAnimationFrame(this.animationFrameId)` and sets `this.animationFrameId = 0`.<br>2) `continueGame()` cancels any existing ID before requesting a new frame.<br>3) React button sets disabled state during transition. |
| **FM-2: Instant Re-Death on Resume** | Lingering hostile bullets, hazards, or divers right above player spawn point (`x=275, y=logicalHeight-60`). | Player killed within 1 frame of resuming; feels unfair and broken. | 1) `this.bullets = []`, `this.hazardProjectiles = []`, `this.solarFlares = []` cleared on continue.<br>2) `this.player.invincibilityTimer = 1.5` granted upon wave resumption.<br>3) `this.player.hp = Math.max(3, this.player.hp)` guarantees living status. |
| **FM-3: Double Wave / Boss Duplication** | Calling `spawnWave()` on Continue click AND again on Shop Resume click. | Spawns 2x enemy count (e.g. 2 bosses on Wave 5). | `spawnWave()` must ONLY be called once, at the final step when resuming combat in `continueGame()`. |
| **FM-4: Stale Wave Skip (`level++`)** | Reusing `startNextWave()` for Continue Shop resume. | Skips the wave the player failed on! Player jumps from Wave 4 failure straight to Wave 5. | Continue Shop action button MUST call `continueGame()` (which keeps `this.level`), NOT `startNextWave()` (which runs `this.level++`). |
| **FM-5: Persistent Audio Siren Leak** | Stage 15 End-Game Crisis cataclysm siren looping after player dies and enters shop. | Annoying continuous alarm audio playing during shop and subsequent waves. | Ensure `soundManager.stopSiren?.()` or `soundManager.init()` silences looping crisis sirens on death and shop entry. |
| **FM-6: Mobile Drag Lockup** | Pointer drag state `isDraggingRef.current = true` left open across modal unmounts. | Next touch event locks or player ship instantly snaps to edge. | Reset `isDraggingRef.current = false`, `activePointerIdRef.current = null`, and `clearKeys()` when opening shop and resuming wave. |
| **FM-7: React / Engine HP Desync** | Player buys Tank Repair (+1 HP) in Shop, but `continueGame()` hardcodes `this.player.hp = 3`. | Player's purchased repair is discarded and stolen! | In `continueGame()`: use `this.player.hp = Math.max(3, this.player.hp)`. Repaired HP (4 or 5) is preserved intact. |
| **FM-8: Unhandled Exception on Null Player** | Accessing `gm.player.hp` or `gm.player.isDead` if player reference was dereferenced. | Uncaught TypeError crashes React tree, kicking user to blank screen or main menu. | Use optional chaining and null guards: `if (!gm.player) gm.player = new Player(gm.logicalWidth, gm.logicalHeight)`. |

---

## 6. Architecture Blueprint for Implementation

### Proposed Flow Diagram
```
[Player Dies in Wave N]
        │
        ▼
[GameState.GAME_OVER]
  - GameOverModal displayed
  - Options: [Restart from Beginning] vs [Continue (이어하기)]
        │
        ▼ Player clicks [Continue] (data-testid="continue-button")
[Transition to Continue Shop]
  - gm.player.isDead = false; gm.player.hp = Math.max(3, gm.player.hp);
  - gm.pause(); (cancels rAF loop)
  - gm.state = GameState.SHOP;
  - isContinueShop = true; setGameState(GameState.SHOP);
        │
        ▼
[GameState.SHOP: ShopModal (Continue Mode)]
  - Title: "정비소 / 무기고 (이어하기)" / "ARMORY & WORKSHOP (CONTINUE)"
  - Subtitle: "웨이브 N 재개 전 무기와 체력을 정비하세요!"
  - Full ShopUpgradePanel (Repair Tank available from 3 -> 4 -> 5 HP)
  - Action Button: [전투 재개 (RESUME WAVE)] (data-testid="resume-wave-button")
        │
        ▼ Player clicks [전투 재개]
[Resume Wave N Combat]
  - isContinueShop = false;
  - gm.continueGame();
    - spawnBarricades();
    - spawnWave() for current Wave N;
    - player.invincibilityTimer = 1.5;
    - gm.state = GameState.PLAYING;
    - requestAnimationFrame(gm.loop);
  - setGameState(GameState.PLAYING);
```

### Key Implementation Diff Specifications

#### In `src/components/game-canvas.tsx`:
1. **Remove `hp <= 0` from Repair Tank button disable**:
   ```tsx
   // Line 51:
   // Change from: disabled={currency < 75 || hp >= 5 || hp <= 0}
   // To:
   disabled={currency < 75 || hp >= 5}
   ```
2. **Add `isContinueShop` state**:
   ```tsx
   const [isContinueShop, setIsContinueShop] = useState(false);
   ```
3. **Update Continue click handler**:
   ```tsx
   const handleContinueToShop = useCallback(() => {
     if (gameManagerRef.current) {
       const gm = gameManagerRef.current;
       if (gm.player) {
         gm.player.isDead = false;
         gm.player.hp = Math.max(3, gm.player.hp);
         gm.player.stressLevel = 0;
         gm.player.suppressionLevel = 0;
       }
       gm.clearKeys();
       gm.bullets = [];
       gm.hazardProjectiles = [];
       gm.solarFlares = [];
       gm.pause();
       gm.state = GameState.SHOP;

       setUpgrades(gm.getUpgrades());
       setCurrency(gm.currency);
       setScore(gm.score);
       setWave(gm.level);
       if (gm.player) {
         setHp(gm.player.hp);
       }
     }
     setIsPreGameShop(false);
     setIsContinueShop(true);
     setGameState(GameState.SHOP);
   }, []);
   ```
4. **Update Resume from Continue Shop handler**:
   ```tsx
   const handleResumeContinuedWave = useCallback(() => {
     setIsContinueShop(false);
     setIsPreGameShop(false);
     if (gameManagerRef.current) {
       gameManagerRef.current.continueGame();
       setUpgrades(gameManagerRef.current.getUpgrades());
       setCurrency(gameManagerRef.current.currency);
       setScore(gameManagerRef.current.score);
       setWave(gameManagerRef.current.level);
       if (gameManagerRef.current.player) {
         setHp(gameManagerRef.current.player.hp);
       }
     }
     setGameState(GameState.PLAYING);
   }, []);
   ```
5. **Update `ShopModal` props & JSX**:
   - Add `isContinue?: boolean`, `wave?: number`.
   - Action button text: `isContinue ? t('전투 재개', 'RESUME WAVE') : (isPreGame ? t('웨이브 1 출격', 'START MISSION') : t('다음 웨이브', 'NEXT WAVE'))`.
   - `data-testid`: `"resume-wave-button"` when continuing, or dual testid.
   - `onNextWave`: bound to `isContinueShop ? handleResumeContinuedWave : (isPreGameShop ? startGame : startNextWave)`.

---

## 7. Caveats
- **Test Harness Update Required**: Existing tests in `tests/continue_vs_restart_on_death.spec.ts` (e.g. R1.2, R1.5) click `continue-button` and immediately assert `state === 'PLAYING'`. When Continue enters the Shop, tests must click `resume-wave-button` (or `continueGame()` can be called directly by headless tests). This test update is planned under Milestone 4.
- **`logicalWidth` / `logicalHeight` Invariant**: Must remain strictly unchanged (600x800) in `GameManager.ts` per `ORIGINAL_REQUEST §R3`.
- **Pre-Approved Execution**: User prompt 2026-09-07T15:44:53Z explicitly approved implementation without waiting for confirmation gates.

---

## 8. Conclusion
The Continue Flow and Pre-Continue Shop Access (R1) are fully specified and ready for implementation. The root blockers (immediate transition to PLAYING without shop modal, and the `hp <= 0` disabled check on tank repair) have been identified with exact line numbers and concrete code diffs. All 8 failure modes (rAF leaks, lingering bullet damage, wave duplication, audio leaks, mobile pointer locks) have defined mitigations to guarantee crash-free stability (R4).

---

## 9. Verification Method

### Automated Test Commands
```bash
# 1. Type-check verification
npx tsc --noEmit

# 2. Build verification
npm run build

# 3. Existing Continue vs Restart test suite
npx playwright test tests/continue_vs_restart_on_death.spec.ts

# 4. State machine & edge case suite
npx playwright test tests/bughunt_empirical_edgecases_state_machine.spec.ts

# 5. Full regression test suite
npx playwright test
```

### Manual / Browser Verification Checklist
1. Launch dev server (`npm run dev`) and navigate to `http://localhost:3000`.
2. Start game, accumulate > 200 currency, die on Wave 2 or 3.
3. On Game Over screen, click "이어하기" (`[data-testid="continue-button"]`).
4. Verify Shop modal opens (`GameState.SHOP`) showing "ARMORY & WORKSHOP (CONTINUE)".
5. Verify Tank Repair button is ENABLED and increases HP from 3 to 4.
6. Buy an upgrade (e.g. Multi-Shot or Piercing).
7. Click "전투 재개" (`[data-testid="resume-wave-button"]`).
8. Verify wave resumes at current level (Wave 2 or 3), player has 4 HP, upgrades active, and invincibility shield flashes.

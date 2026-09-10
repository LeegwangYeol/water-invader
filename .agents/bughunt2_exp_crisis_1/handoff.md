# Investigation Report: 12 End-Game Crises, Environmental Hazards & Bullet Visibility

## 1. Observation

Direct code inspections, runtime traces, and test evaluations across `src/game/EndGameCrisis.ts`, `src/game/CrisisSovereign.ts`, `src/game/DimensionalRift.ts`, `src/game/GameManager.ts`, `src/game/Bullet.ts`, `src/components/game-canvas.tsx`, and `tests/` revealed the following exact observations:

### Observation 1: `spawnWave()` Fall-Through Horde Spawning on Crisis Trigger
- **File**: `src/game/GameManager.ts:751-832`
- **Verbatim Code**:
  ```ts
  751: if (this.level >= 15 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
  752:   const isPityTrigger = this.level >= 18;
  753:   const isRandomTrigger = Math.random() < 0.30;
  754:   if (isPityTrigger || isRandomTrigger) {
  755:     this.triggerEndGameCrisis();
  756:   }
  757: }
  758: 
  759: let rows: number;
  ...
  830: this.enemies.push(new Enemy(offsetX + c * paddingX, startY + r * paddingY, this.logicalWidth, this.level, type, this.logicalHeight));
  ```
- **Direct Finding**: `this.triggerEndGameCrisis()` at line 640 executes `this.enemies = []; // Clear standard hostiles for existential crisis encounter`. However, `spawnWave()` lacks a `return;` statement after line 756. It immediately proceeds to lines 759–832, pushing 50 to 60 regular enemies, Rogues, Snipers, and Divers directly on top of the Crisis Sovereign and Rifts.

### Observation 2: Universal Color Override to Purple for all 12 Crisis Projectiles
- **File**: `src/game/Bullet.ts:128`
- **Verbatim Code**:
  ```ts
  128: const shellColor = this.isInterceptable ? '#a855f7' : (this.color || '#ef4444');
  ```
- **Direct Finding**: In `src/game/crisis/EndGameCrisis.ts` (lines 500-501, 542-543, 615-616, 629-630, 675-676, 707-708, 758-759, 804-805, 858-859, 904-905, 951-952, 998-999) and `src/game/crisis/DimensionalRift.ts` (lines 224-225, 234-235, 247-248, 281-282, 315-316, 334-335, 383-384, 399-400, 419-420, 467-468), all crisis projectiles configure explicit archetypal colors (e.g. Abyssal Leviathan `#84cc16`, Chrono Devourer `#fbbf24`, Solaris Colossus `#f97316`, Glacial Oblivion `#22d3ee`, Cosmic Devourer `#dc2626`, Nanite Harvester `#14b8a6`) and set `isInterceptable = true`.
- Because line 128 tests `this.isInterceptable` first, every single crisis bullet has its color overridden to `'#a855f7'` (purple), completely erasing archetypal color themes. Furthermore, against purple incursion vignettes, these purple bullets have degraded contrast.

### Observation 3: Missing Player HP Update & Game Over Handling on DimensionalRift Hazards
- **File**: `src/game/crisis/DimensionalRift.ts:288-298, 524-534`
- **Verbatim Code**:
  ```ts
  291: if (player && Math.abs(player.position.y + player.size.height / 2 - tripwireY) < 14) {
  292:   if (player.invincibilityTimer <= 0) {
  293:     player.hp -= 1;
  294:     player.invincibilityTimer = 1.0;
  295:     player.hitFlashTimer = 0.15;
  296:   }
  297: }
  ...
  529: if (tdx * tdx + tdy * tdy < (trail.radius + player.size.width / 3) * (trail.radius + player.size.width / 3)) {
  530:   player.hp -= 1;
  531:   player.invincibilityTimer = 1.0;
  532:   player.hitFlashTimer = 0.15;
  533: }
  ```
- **File**: `src/game/GameManager.ts:1185-1216`
- **Direct Finding**: Both Prominence Tripwires (line 293) and Cosmic Fire Trails (line 530) decrement `player.hp -= 1` directly without checking `if (player.hp <= 0) gameOver(...)` and without calling `onPlayerHpChange`.
- In `GameManager.ts` line 1187, `this.endGameCrisis.update(...)` is called, but `GameManager` only checks for Sovereign body collision (line 1202) and never checks `this.player.hp <= 0` or fires `onPlayerHpChange` after `endGameCrisis.update()`. Consequently, a player reduced to 0 or negative HP by a rift hazard becomes a "zombie" player: the player ship remains active and controllable at 0 HP until hit by a standard enemy bullet or mob.

### Observation 4: Tunneling and Lack of Continuous Collision Detection (CCD)
- **File**: `src/game/GameManager.ts:1414-1428` (Hazard Projectiles / Acid Storm)
  - `hz.y += hz.speedY * deltaTime;` is updated before an instantaneous AABB check. High-velocity droplets (speedY 250–450 px/s = 8–15 px/frame at 60Hz, 16–30 px at 30Hz) lack swept bounds (`prevPosition` unused) and can tunnel through player and barricades.
- **File**: `src/game/crisis/DimensionalRift.ts:288-298` (Prominence Tripwire)
  - `Math.abs(...) < 14` is an instantaneous proximity check. A fast-moving player or sweeping tripwire can jump across the 14px band in a single frame.
- **File**: `src/game/crisis/DimensionalRift.ts:536-548` (Fire Trails vs Player Bullets)
  - Point-in-circle check `bdx*bdx + bdy*bdy < (15 + 6)^2 = 441` with no swept line segment. Fast player bullets (upward speed 500–800 px/s = 10–14 px/frame at 60Hz, 25+ px at 30Hz) frequently tunnel through the 15px radius fire trails without being destroyed.
- **File**: `src/game/crisis/CrisisSovereign.ts:189-215`, `src/game/crisis/DimensionalRift.ts:184-205`
  - Neither `CrisisSovereign` nor `DimensionalRift` assigns `this.prevPosition = { x, y }` during their hover/sweep motion. Their swept bounding boxes default to instantaneous AABB bounds.

### Observation 5: Continue Shop Two-Step Flow Resets `hasEndGameCrisisOccurred`
- **File**: `src/game/GameManager.ts:526-530, 595-600`
- **Verbatim Code**:
  ```ts
  // In prepareContinue():
  526: if (!this.endGameCrisisDefeatedHandled) {
  527:   this.hasEndGameCrisisOccurred = false;
  528: }
  529: this.endGameCrisis = null;
  530: this.endGameCrisisDefeatedHandled = false;
  ...
  // In continueGame():
  595: if (!this.endGameCrisisDefeatedHandled) {
  596:   this.hasEndGameCrisisOccurred = false;
  597: }
  ```
- **Direct Finding**: When player enters Continue Shop via `prepareContinue()`, line 530 resets `this.endGameCrisisDefeatedHandled = false;`.
- When the player finishes shopping and resumes the wave via `continueGame()`, line 595 evaluates `!this.endGameCrisisDefeatedHandled`, which is NOW TRUE! It unconditionally executes line 596: `this.hasEndGameCrisisOccurred = false;`.
- If the player defeated the crisis before dying, this flag reset wipes the defeat memory, causing `spawnWave()` on the continued wave to spawn another End-Game Crisis (100% on Stage 18, 30% on Stage 16), creating an infinite loop and score/cash exploit.

### Observation 6: Simultaneous Player & Crisis Defeat Edge Case
- **File**: `src/game/GameManager.ts:1219-1221, 1709-1736, 2261-2282`
- **Direct Finding**: If a player bullet destroys the Sovereign Core on the same frame that an in-flight hostile bullet reduces `player.hp` to 0:
  1. `handleCrisisDefeatedRewards()` executes: player receives +2000 score and +500 currency, and `endGameCrisisDefeatedHandled` becomes `true`.
  2. `gameOver(...)` executes: `this.state` becomes `GameState.GAME_OVER`.
  3. `checkWaveProgression()` requires `this.state === GameState.PLAYING`, so wave progression to `GameState.SHOP` is blocked.
  4. In `transitionToPhase(CrisisPhase.DEFEATED)`, existing hostile bullets in flight are NOT removed (`bullets` array is untouched).
  5. The player is faced with Game Over. Upon selecting "Continue", the player respawns on the same wave level with retained bonus score/cash, and Observation 5 triggers a re-spawn of the crisis.

### Observation 7: Triple Vignette Darkening and Duplicate Banners During Incursion
- **File**: `src/game/GameManager.ts:2414-2423`, `src/game/crisis/EndGameCrisis.ts:1161-1190`, `src/components/game-canvas.tsx:1206-1223`
- **Direct Finding**: During the 3.0s INCURSION phase, three separate purple overlays are rendered simultaneously:
  1. `GameManager.ts` Layer 1 radial purple vignette (`0.35 * pulse`);
  2. `EndGameCrisis.ts` Layer 2 radial purple vignette (`0.4 * pulse`);
  3. `game-canvas.tsx` DOM overlay (`bg-purple-950/40` + purple glow + inset shadow).
  Furthermore, `EndGameCrisis.ts` draws a canvas-based banner box at `height / 2 - 45` while React DOM mounts a separate banner modal at the exact same screen center.

### Observation 8: Void Sovereign Boss HUD Color Desynchronization
- **File**: `src/game/crisis/CrisisSovereign.ts:711-714`
- **Verbatim Code**:
  ```ts
  711: let title = '✦ THE VOID SOVEREIGN ✦';
  712: let sub = 'EXTRA-DIMENSIONAL CATACLYSM';
  713: let primaryCol = '#ef4444';
  714: let accentCol = '#f97316';
  ```
- **Direct Finding**: In `CRISIS_ARCHETYPE_CONFIGS`, `VOID_SOVEREIGN` is configured with `primaryColor: '#c084fc'` (purple) and `accentColor: '#38bdf8'` (sky blue). However, in `drawBossHUD`, default `primaryCol` and `accentCol` are hardcoded to `#ef4444` (red) and `#f97316` (orange).

### Observation 9: Unchecked Environmental Crisis Trigger during Active End-Game Crisis
- **File**: `src/game/GameManager.ts:1401-1406`
- **Verbatim Code**:
  ```ts
  1401: } else if (this.level >= 10) {
  1402:   this.crisisTimer -= deltaTime;
  1403:   if (this.crisisTimer <= 0 && this.enemies.length > 0 && this.warningTimer <= 0 && this.pendingReinforcement === null) {
  1404:     this.triggerCrisis();
  1405:     this.crisisTimer = 16.0 + Math.random() * 8.0;
  1406:   }
  1407: }
  ```
- **Direct Finding**: Line 1401 does not check `!this.endGameCrisis`. Because of Observation 1 (`spawnWave()` spawns 50 enemies during an End-Game Crisis), `this.enemies.length > 0` remains true. When `this.crisisTimer` hits 0, `triggerCrisis()` fires on top of the End-Game Crisis, overwriting UI warning banners and triggering Acid Storm or EMP weapon suppression while fighting the Sovereign.

---

## 2. Logic Chain

1. **Step 1 (Horde Overlap)**:
   - Observation 1 demonstrates `spawnWave()` calls `triggerEndGameCrisis()` but does not return.
   - Observation 9 demonstrates that because enemies exist, `triggerCrisis()` can also trigger during an End-Game Crisis.
   - *Inference*: The game engine intends End-Game Crises to be isolated, existential battles (proven by `this.enemies = []; // Clear standard hostiles for existential crisis encounter` at line 640). The lack of `return;` compromises game balance and causes cascading secondary bugs (unintended environmental crises during Sovereign battles).

2. **Step 2 (Bullet Aesthetics & Visibility)**:
   - Observation 2 demonstrates that line 128 in `Bullet.ts` overrides all bullets where `isInterceptable = true` to `#a855f7`.
   - Observation 7 demonstrates that during incursion, triple purple vignettes stack up.
   - *Inference*: Projectiles with explicit thematic color palettes (toxic green, gold, orange, cyan, teal) lose their visual identity, and purple bullets against purple vignettes have degraded contrast compared to other game phases.

3. **Step 3 (Collision Integrity & Zombie State)**:
   - Observation 3 proves that `DimensionalRift` hazards (tripwire and fire trails) decrement `player.hp` directly without checking `<= 0` and without calling `onPlayerHpChange`.
   - Observation 3 also proves `GameManager` does not check `player.hp <= 0` after `endGameCrisis.update()`.
   - *Inference*: A player brought to 0 HP by a rift hazard does not die, entering an undefined "zombie" state where gameplay continues with 0 HP until another hostile entity inflicts damage.

4. **Step 4 (CCD Gaps & Tunneling)**:
   - Observation 4 shows that Acid Storm droplets, laser tripwires, fire trails, and Crisis Sovereign/Rifts rely on instantaneous discrete collision checks or lack swept bounds.
   - *Inference*: Fast-moving player bullets tunnel through fire trails, high-speed acid rain droplets can skip past the player/barricades on frame drops, and moving tripwires can fail to detect player movement across frames.

5. **Step 5 (Mutual Death & Continue Exploitation)**:
   - Observation 5 and 6 demonstrate that when player and crisis die simultaneously, `handleCrisisDefeatedRewards()` grants rewards, but `prepareContinue()` clears `endGameCrisisDefeatedHandled = false`, which causes `continueGame()` to reset `hasEndGameCrisisOccurred = false`.
   - *Inference*: The two-step continue flow creates a desynchronization where the engine forgets the crisis was defeated, re-spawning it on the continued wave and allowing recursive score/currency farming.

---

## 3. Caveats

1. **Architectural Constraint Adherence**:
   - In accordance with mandatory guidelines, none of the findings or proposed remedies require altering `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`. All coordinate systems are 600x800 logical.
2. **Existing Test Suite Specificity**:
   - The existing 37 Playwright tests in `tests/*crisis*.spec.ts` pass because they invoke `gm.triggerEndGameCrisis()` in isolation (bypassing `spawnWave()`) or test mathematical EHP models without executing full wave-spawning logic. They do not exercise the `spawnWave()` fall-through, `DimensionalRift` hazard lethal damage, or two-step continue flows.
3. **Read-Only Investigation Protocol**:
   - In adherence to user instructions and agent rules, NO production code was modified during this investigation.

---

## 4. Conclusion & Recommended Fix Strategy

| Defect ID | Component | Severity | Description | Recommended Fix Strategy |
|---|---|---|---|---|
| **DEF-C1** | `GameManager.ts:751-757` | High | `spawnWave()` lacks `return;` after `triggerEndGameCrisis()`, spawning 50–60 normal enemies over the crisis. | Add `return;` immediately after `this.triggerEndGameCrisis();` at line 756. |
| **DEF-C2** | `Bullet.ts:128` | High | Line 128 overrides all `isInterceptable` bullets to `#a855f7`, discarding archetypal colors. | Change to: `const shellColor = this.color || (this.isInterceptable ? '#a855f7' : '#ef4444');` |
| **DEF-C3** | `DimensionalRift.ts:291-297, 529-534` & `GameManager.ts:1216` | High | Rift tripwires & fire trails do not trigger `gameOver()` or `onPlayerHpChange` when player HP <= 0, causing zombie player state. | In `GameManager.ts:1216`, check `if (this.player && this.player.hp <= 0) this.gameOver("정수기가 차원 균열 위험물에 파괴되었습니다. (체력 소진)");` and call `this.onPlayerHpChange(this.player.hp)` if HP changed. |
| **DEF-C4** | `GameManager.ts:526-530, 595-600` | Medium | Two-step continue flow (`prepareContinue` -> `continueGame`) resets `hasEndGameCrisisOccurred = false` even if crisis was defeated. | Preserve crisis defeat state across continue by setting a persistent flag or checking `this.hasEndGameCrisisOccurred` before resetting `endGameCrisisDefeatedHandled`. |
| **DEF-C5** | `GameManager.ts:1401-1406` | Medium | Environmental crisis timer fires during End-Game Crisis. | Add `&& !this.endGameCrisis` to condition at line 1401. |
| **DEF-C6** | `CrisisSovereign.ts:711-714` | Low | Void Sovereign HUD colors hardcoded to red/orange instead of purple/sky-blue. | Update lines 713–714 to use `primaryCol = '#c084fc'; accentCol = '#38bdf8';`. |
| **DEF-C7** | `EndGameCrisis.ts:62-64, 137-164` | Low | Unvalidated archetype string results in `undefined` title and invisible Sovereign. | Validate `archetype` against `Object.values(CrisisArchetype)`, provide fallback to `VOID_SOVEREIGN`, and handle legacy names (e.g. `DIMENSIONAL_DEVOURER` -> `CHRONO_DEVOURER`). |
| **DEF-C8** | `GameManager.ts:2414-2424` & `EndGameCrisis.ts:1161-1167` | Low | Triple purple vignette stacking during incursion reduces visual contrast. | Remove duplicate vignette in `EndGameCrisis.drawIncursionWarningBanner()` and let `GameManager.draw()` manage the single background layer. |
| **DEF-C9** | `DimensionalRift.ts:536-548` | Low | Player bullets tunnel through fire trails due to point-in-circle check. | Use ray-to-circle or segment intersection check from `bullet.prevPosition` to `bullet.position`. |
| **DEF-C10** | `EndGameCrisis.ts:286-298` | Low | Hostile bullets remain lethal after Sovereign defeat, causing immediate player death during victory sequence. | Neutralize or clear in-flight hostile bullets when entering `CrisisPhase.DEFEATED`. |

---

## 5. Verification Method

To independently verify these findings:

1. **Verify DEF-C1 (Horde Spawning during Crisis)**:
   ```bash
   npx playwright test tests/unit/crisis_distribution_12.test.ts
   ```
   Inspect `gm.enemies.length` after `spawnWave()` triggers a crisis on Stage 18: `gm.enemies.length` is currently 60 instead of 0.
2. **Verify DEF-C2 (Bullet Color Override)**:
   Instantiate a bullet with `b = new Bullet(100, 100, 200, 1, false); b.color = '#84cc16'; b.isInterceptable = true;`. Render via `b.draw(ctx)`. Inspect `ctx.fillStyle` during Tier 3: it receives `#a855f7` instead of `#84cc16`.
3. **Verify DEF-C3 (Zombie Player on Rift Hazard Death)**:
   Set `player.hp = 1`, place player on tripwire (`y = tripwireY`), call `rift.update(0.016, player)`. Verify `player.hp` becomes 0, but `gameManager.gameOver` is never called, and `gameManager.state` remains `GameState.PLAYING`.
4. **Verify DEF-C4 (Continue Flag Wipe)**:
   Set `gm.endGameCrisisDefeatedHandled = true`. Call `gm.prepareContinue()`, then call `gm.continueGame()`. Inspect `gm.hasEndGameCrisisOccurred`: it is erroneously reset to `false`.
5. **Production Build & Regression Command**:
   ```bash
   npm run build
   npx playwright test
   ```

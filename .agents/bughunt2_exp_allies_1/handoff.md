# Handoff Report: Allied Reinforcements & Barricade Saboteurs Investigation

## 1. Observation

### Summary of System Scope
Investigation domain: **Allied Reinforcements** (`src/game/Helper.ts`, `src/game/GameManager.ts`, `src/components/game-canvas.tsx`) and **Barricade Saboteurs** (`src/game/Enemy.ts`, `src/game/Barricade.ts`).

---

### Direct Observations & Code Evidence

#### Obs 1: In-Place Compaction of `this.barricades` in `GameManager.ts`
- **File & Line**: `src/game/GameManager.ts:1688-1696`
- **Verbatim Code**:
  ```typescript
  // In-place compaction for barricades
  let barricadeWriteIdx = 0;
  for (let i = 0; i < this.barricades.length; i++) {
    const b = this.barricades[i];
    if (!b.isDead) {
      this.barricades[barricadeWriteIdx++] = b;
    }
  }
  this.barricades.length = barricadeWriteIdx;
  ```
- **File & Line**: `src/game/Enemy.ts:378, 389`
  ```typescript
  // Living central barricades (index 1 & 2)
  const central = [barricades[1], barricades[2]].filter(b => b && !b.isDead && b.hp > 0);
  ...
  // Living flank barricades (index 0 & 3)
  const flanks = [barricades[0], barricades[3]].filter(b => b && !b.isDead && b.hp > 0);
  ```
- **File & Line**: `src/game/Helper.ts:301-304, 346-348`
  ```typescript
  const centralIndices = [1, 2].filter(idx => idx < barricades.length);
  const damagedCentral = centralIndices
    .map(idx => barricades[idx])
    .filter(b => b && b.hp < b.maxHp);
  ...
  bestBarricade.hp = Math.min(bestBarricade.maxHp, bestBarricade.hp + 4);
  bestBarricade.isDead = false;
  ```
- **File & Line**: `src/game/GameManager.ts:1624-1629`
  ```typescript
  // Emergency survival threshold check: If player HP <= 1 and defense line compromised
  if (this.state === GameState.PLAYING && this.player && this.player.hp <= 1 && !this.emergencyAlliesTriggeredThisWave) {
    const damagedBarricades = this.barricades.filter(b => b.hp < b.maxHp);
    if (damagedBarricades.length >= 2 || (this.crisisState && this.crisisState.activeCrisis)) {
      this.emergencyAlliesTriggeredThisWave = true;
      this.triggerMassiveAlliedReinforcements();
    }
  }
  ```

#### Obs 2: Saboteur Retargeting Lateral Traversal Vertical Plunge / Teleportation
- **File & Line**: `src/game/Enemy.ts:412-436`
- **Verbatim Code**:
  ```typescript
  const latchY = targetBarricade.position.y - this.size.height + 2;
  const horizontalContact = this.position.x < targetBarricade.position.x + targetBarricade.size.width &&
                            this.position.x + this.size.width > targetBarricade.position.x;

  // When in contact with the barricade
  if (horizontalContact && this.position.y >= latchY - 2) {
    // Clamp Y: latch onto top edge
    this.position.y = latchY;
    this.isGnawing = true;
    targetBarricade.hp = Math.max(0, targetBarricade.hp - 12.0 * deltaTime);
    this.gnawedThisFrame = true;
    if (targetBarricade.hp <= 0) {
      targetBarricade.hp = 0;
      targetBarricade.isDead = true;
      this.isGnawing = false;
    }
  } else {
    this.isGnawing = false;
    // Vertical movement: descend at 30 px/s towards barricade
    this.position.y += 30 * clampedDt * validSpeedMultiplier;
    if (horizontalContact && this.position.y >= latchY) {
      this.position.y = latchY;
      this.isGnawing = true;
    }
  }
  ```

#### Obs 3: Unbounded Upper Limit on `targetActiveBlocks` Causing Infinite Loop Hang in `Barricade.ts`
- **File & Line**: `src/game/Barricade.ts:40, 51-60`
- **Verbatim Code**:
  ```typescript
  const targetActiveBlocks = Math.round((Math.max(0, this.hp) / this.maxHp) * this.blocks.length);
  let currentActive = this.blocks.filter(b => b).length;
  ...
  } else if (currentActive < targetActiveBlocks) {
    // Reconstruct blocks on healing/repair
    while (currentActive < targetActiveBlocks) {
      const idx = Math.floor(Math.random() * this.blocks.length);
      if (!this.blocks[idx]) {
        this.blocks[idx] = true;
        currentActive++;
      }
    }
  }
  ```

#### Obs 4: DOM Squadron Status HUD Directly Overlaps and Clips TopHUD
- **File & Line**: `src/components/game-canvas.tsx:1158-1160`
- **Verbatim Code**:
  ```tsx
  <div
    data-testid="ally-squadron-hud"
    className="absolute top-14 left-4 pointer-events-none z-30 px-3 py-1 rounded-lg bg-slate-950/90 border border-emerald-500/80 text-white text-xs font-mono flex items-center gap-2 shadow-[0_0_12px_rgba(34,197,94,0.5)] select-none backdrop-blur-sm"
  >
  ```
- **File & Line**: `src/components/game-canvas.tsx:163-170`
  ```tsx
  <div className="absolute top-0 left-0 w-full p-4 p-2 sm:p-4 max-sm:!p-2 flex justify-between items-start text-white touch-none z-30 pointer-events-none">
    <div>
      <h2 className="text-sm sm:text-2xl font-bold text-blue-400">{t('점수:', 'Score:')} {score}</h2>
      <p className="text-xs sm:text-base text-blue-200">{t('정수된 물:', 'Pure Water:')} {currency} 💧</p>
      {gameState === GameState.PLAYING && (
        <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
          <p className="text-xs sm:text-base text-yellow-300 font-bold">WAVE {wave}</p>
  ```

#### Obs 5: Role Badge Pill Text Overflow for `[🔧 REPAIR BOT]` on Canvas UI
- **File & Line**: `src/game/Helper.ts:534, 551-558`
- **Verbatim Code**:
  ```typescript
  const badgeY = barY - 14;
  const badgeWidth = 68;
  const badgeHeight = 12;
  const badgeX = cx - badgeWidth / 2;
  ...
  const badgeText = `[${config.icon} ${config.badgeLabel}]`;
  ctx.font = 'bold 8px sans-serif';
  ...
  ctx.strokeText(badgeText, cx, badgeY + badgeHeight / 2);
  ctx.fillText(badgeText, cx, badgeY + badgeHeight / 2);
  ```

#### Obs 6: Continuous Re-Render Loop in `syncAllies` Every 200ms
- **File & Line**: `src/components/game-canvas.tsx:819-842`
- **Verbatim Code**:
  ```tsx
  const syncAllies = () => {
    if (gameManagerRef.current) {
      const helpers = gameManagerRef.current.helpers || [];
      setSquadronStatus({
        total: helpers.length,
        fighters: helpers.filter(h => h.type === 0).length,
        medics: helpers.filter(h => h.type === 3).length,
        repairers: helpers.filter(h => h.type === 1).length,
        tanks: helpers.filter(h => h.type === 2).length,
      });
  ...
  const interval = setInterval(syncAllies, 200);
  return () => clearInterval(interval);
  ```

#### Obs 7: State Leak of `emergencyAlliesTriggeredThisWave` Across `continueGame()`
- **File & Line**: `src/game/GameManager.ts:83, 438, 549-605`
- `emergencyAlliesTriggeredThisWave` is declared at line 83 and cleared at line 438 in `startNextWave()`, but is **completely omitted** in `continueGame()` (lines 549-615).

#### Obs 8: Repair Bot Rate Discrepancy (+10 HP/s vs Documented +8 HP/s)
- **File & Line**: `src/game/Helper.ts:343-346`
- **Verbatim Code**:
  ```typescript
  if (this.actionTimer >= 0.4) {
    this.actionTimer = 0;
    // +4 HP up to maxHp
    bestBarricade.hp = Math.min(bestBarricade.maxHp, bestBarricade.hp + 4);
  ```
  `+4 HP` per `0.4s` = `10.0 HP/s` (exceeds the 8 HP/s specified in `PROJECT.md:10, 29`).

#### Obs 9: Fighter Unconditional Firing Into Empty Air
- **File & Line**: `src/game/Helper.ts:228-246`
- Firing interval executes unconditionally even when `hostiles.length === 0` and `targetEnemy === null`.

#### Obs 10: Missing Collision Loop `break` on Diver vs Barricade Impact
- **File & Line**: `src/game/GameManager.ts:2098-2107`
- When Diver hits a barricade, `enemy.isDead = true`, but the inner loop over `this.barricades` does not `break`, allowing multi-barricade damage if intersecting the seam between adjacent barricades.

---

## 2. Logic Chain

### Chain 1: Barricade Array In-Place Compaction Failure
1. **Starting Point**: `GameManager.ts:1688-1696` in-place compacts `this.barricades` when `b.isDead` is true.
2. **Step 1**: Barricades are created at 4 fixed horizontal layout slots in `spawnBarricades()` (index 0: Ice, index 1: Stone, index 2: Stone, index 3: Ice).
3. **Step 2**: When a barricade's HP hits 0, `isDead = true`. Compaction deletes it from `this.barricades`, reducing `this.barricades.length` from 4 to 3, 2, or 1.
4. **Step 3**: If barricade 0 is destroyed, original index 1 shifts to index 0, index 2 shifts to index 1, and index 3 shifts to index 2.
5. **Step 4**: `Enemy.ts:378` (`central = [barricades[1], barricades[2]]`) and `Enemy.ts:389` (`flanks = [barricades[0], barricades[3]]`) now target index 2 (a flank ice barricade) as a central barricade, and treat index 0 (a central stone barricade) as a flank!
6. **Step 5**: `Helper.ts:347` explicitly has `bestBarricade.isDead = false; bestBarricade.hp = ...` to allow Repair Bots to reconstruct destroyed barricades. However, because dead barricades are permanently spliced out of `this.barricades`, Repair Bots can never target or reconstruct dead barricades.
7. **Step 6**: In `GameManager.ts:1625`, `const damagedBarricades = this.barricades.filter(b => b.hp < b.maxHp); if (damagedBarricades.length >= 2)`. When 3 barricades are completely destroyed and removed, `this.barricades` only has 1 surviving barricade. If that 1 barricade has full HP, `damagedBarricades.length` is 0. The emergency reinforcement trigger fails to fire even though the base defense is obliterated!

### Chain 2: Saboteur Lateral Movement Vertical Plunge
1. **Starting Point**: In `Enemy.ts:419-421`, Saboteur latches onto a barricade at `y = latchY` and gnaws it down to 0 HP.
2. **Step 1**: When the barricade dies, `Enemy.update()` retargets another living central barricade (e.g. 150px away).
3. **Step 2**: For the new barricade, `horizontalContact` is false because the Saboteur is still at the previous X position.
4. **Step 3**: Because `horizontalContact` is false, lines 428-436 execute:
   `this.position.y += 30 * clampedDt * validSpeedMultiplier;`
5. **Step 4**: The Saboteur travels laterally at 45 px/s. Covering 150px takes 3.33 seconds.
6. **Step 5**: During those 3.33 seconds, it descends `3.33s * 30 px/s = 100 pixels` downwards!
7. **Step 6**: The top edge of the barricades is at `y = 722`. Descending 100px puts the Saboteur at `y = 822` (into the player combat lane or near canvas bottom `logicalHeight = 900`).
8. **Step 7**: If it reaches the canvas bottom, it triggers line 1567 (`enemy.position.y + enemy.size.height >= this.logicalHeight`), causing a defense breach penalty to player HP! If it reaches horizontal contact below the barricade, line 418 abruptly teleports it 100px upwards back to `latchY`!

### Chain 3: Infinite While Loop in `Barricade.update()`
1. **Starting Point**: In `Barricade.ts:40`, `targetActiveBlocks = Math.round((Math.max(0, this.hp) / this.maxHp) * this.blocks.length)`.
2. **Step 1**: If `this.hp` ever exceeds `this.maxHp` (e.g. `21/20`), `targetActiveBlocks` evaluates to `25` or higher.
3. **Step 2**: The array `this.blocks` has a fixed length of 24.
4. **Step 3**: At line 53, `while (currentActive < targetActiveBlocks)` searches for `!this.blocks[idx]`.
5. **Step 4**: When all 24 blocks are true, `!this.blocks[idx]` is never true. `currentActive` never increments.
6. **Step 5**: The while loop hangs infinitely on the main JavaScript thread, locking up the browser tab and freezing the game.

### Chain 4: DOM Squadron HUD Layout Overlap
1. **Starting Point**: `game-canvas.tsx:1159` renders `ally-squadron-hud` at `absolute top-14 left-4`.
2. **Step 1**: `top-14` is `top: 56px`, `left-4` is `left: 16px`.
3. **Step 2**: In `TopHUD`, the left column contains Score, Pure Water, and Wave badges starting at `top: 16px, left: 16px` (desktop) or `top: 8px, left: 8px` (mobile).
4. **Step 3**: The height of Score + Pure Water + Wave is ~96px on desktop and ~64px on mobile.
5. **Step 4**: `ally-squadron-hud` at y=56px renders directly on top of the Pure Water and Wave text, causing severe visual clipping and unreadable text.

### Chain 5: Role Badge Text Overflow
1. **Starting Point**: `Helper.ts:534` sets `badgeWidth = 68` for all roles.
2. **Step 1**: For Repair Bot, `badgeText` is `[🔧 REPAIR BOT]`.
3. **Step 2**: `ctx.font = 'bold 8px sans-serif'` with `ctx.lineWidth = 2` stroke renders `[🔧 REPAIR BOT]` at ~82-84px in width.
4. **Step 3**: The text extends ~41px to the left and right of `cx`, whereas the 68px pill only extends 34px.
5. **Step 4**: The text overflows the badge pill boundary by ~7px on both sides.

---

## 3. Caveats

1. **No Source Modifications Made**: This investigation strictly complied with the explorer read-only mandate. No game source code or tests were modified during this phase.
2. **Playwright Synthetic Test Passes**: Synthetic tests in `tests/18_allied_reinforcements_and_roles.spec.ts` and `tests/19_barricade_saboteur_and_repair.spec.ts` passed because they test single barricades or single-frame cycles in isolation, without running multiple multi-barricade kill cycles that trigger array compaction index shifts or lateral traversal descents.
3. **Architectural Constraint Adherence**: In accordance with the critical instruction, no recommendation modifies `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`.

---

## 4. Conclusion

The core mechanics for Allied Reinforcements and Barricade Saboteurs are feature-rich and architecturally sound (including the `ignoreBarricades = true` homing missile synergy and animated rotary saw teeth), but contain **10 specific defects** that cause runtime glitches, visual clipping, AI pathing flaws, and potential infinite-loop freezes:

| Defect # | Category | Description | Target File & Line | Severity |
|---|---|---|---|---|
| **D1** | Architecture / Logic | Barricade array compaction breaks index mapping (1 & 2), prevents dead barricade repair, and breaks emergency reinforcement threshold | `src/game/GameManager.ts:1688-1696` | High |
| **D2** | Physics / AI | Saboteur lateral retargeting descends unclamped past `latchY`, plunging 100px downwards and triggering boundary breach or vertical teleportation | `src/game/Enemy.ts:428-436` | High |
| **D3** | Stability / Crash | Missing upper clamp on `targetActiveBlocks` in `Barricade.update()` causes infinite while-loop hang if `hp > maxHp` | `src/game/Barricade.ts:40, 53-59` | Critical |
| **D4** | UI / Layout | DOM Squadron Status HUD positioned at `top-14 left-4` directly collides and clips TopHUD Score, Pure Water, and Wave | `src/components/game-canvas.tsx:1159` | Medium |
| **D5** | UI / Canvas | Role badge pill fixed width (68px) is too narrow for `[🔧 REPAIR BOT]`, causing text spillover | `src/game/Helper.ts:534` | Low |
| **D6** | Performance / GC | `syncAllies` allocates new state objects unconditionally every 200ms, forcing 5 re-renders/s even with 0 allies | `src/components/game-canvas.tsx:819-842` | Medium |
| **D7** | State Persistence | `emergencyAlliesTriggeredThisWave` is not reset in `continueGame()`, permanently locking players out of emergency allies on continue | `src/game/GameManager.ts:549-615` | Medium |
| **D8** | Game Balance | Repair Bot repair rate is +10 HP/s (+4 HP every 0.4s) rather than the documented +8 HP/s | `src/game/Helper.ts:343-346` | Low |
| **D9** | AI Behavior | Fighter drone continues firing twin plasma bolts into empty space when all hostiles are dead | `src/game/Helper.ts:228-246` | Low |
| **D10** | Physics / Collision | Missing `break;` on Diver vs Barricade collision causes double damage on multi-barricade seam contact | `src/game/GameManager.ts:2100-2107` | Low |

---

## 5. Recommended Fix Strategies

### Fix Strategy 1: Preserve Stationary 4-Barricade Array Structure
- **Target**: `src/game/GameManager.ts:1688-1696`
- **Fix**: Remove in-place compaction for `this.barricades`. Barricades should remain in their fixed array indices `[0, 1, 2, 3]` with `isDead = true` and `hp = 0` when destroyed.
- **Benefits**:
  - `barricades[1]` and `barricades[2]` permanently remain central barricades.
  - Repair Bots can locate destroyed barricades, restore +4 HP, and toggle `isDead = false`.
  - `damagedBarricades.length >= 2` accurately detects destroyed barricades for emergency warp-in.

### Fix Strategy 2: Clamp Saboteur Lateral Descent to `latchY`
- **Target**: `src/game/Enemy.ts:428-436`
- **Fix**: When steering towards `targetBarricade`, clamp descent to `latchY`:
  ```typescript
  } else {
    this.isGnawing = false;
    if (this.position.y < latchY) {
      this.position.y = Math.min(latchY, this.position.y + 30 * clampedDt * validSpeedMultiplier);
    }
    if (horizontalContact && this.position.y >= latchY) {
      this.position.y = latchY;
      this.isGnawing = true;
    }
  }
  ```
  Only descend past `latchY` when all barricades are destroyed (`!targetBarricade`, line 437).

### Fix Strategy 3: Safe Clamp in `Barricade.update()`
- **Target**: `src/game/Barricade.ts:40`
- **Fix**:
  ```typescript
  const clampedHp = Math.max(0, Math.min(this.maxHp, this.hp));
  const targetActiveBlocks = Math.max(0, Math.min(this.blocks.length, Math.round((clampedHp / this.maxHp) * this.blocks.length)));
  ```
  Also add `if (this.hp > 0 && this.isDead) this.isDead = false;` to sync revive states.

### Fix Strategy 4: Reposition DOM Squadron Status HUD
- **Target**: `src/components/game-canvas.tsx:1159`
- **Fix**: Adjust CSS positioning below TopHUD left stack:
  ```tsx
  className="absolute top-20 sm:top-28 left-2 sm:left-4 pointer-events-none z-30 px-3 py-1 ..."
  ```

### Fix Strategy 5: Dynamic Role Badge Pill Width
- **Target**: `src/game/Helper.ts:534`
- **Fix**:
  ```typescript
  const textMetrics = ctx.measureText(badgeText);
  const badgeWidth = Math.max(68, Math.ceil(textMetrics.width) + 12);
  ```

### Fix Strategy 6: Memoized State Update in `syncAllies`
- **Target**: `src/components/game-canvas.tsx:822-828`
- **Fix**: Check previous counts before setting state to avoid 5 re-renders per second when counts do not change.

### Fix Strategy 7: Reset Emergency Flag in `continueGame()`
- **Target**: `src/game/GameManager.ts:602`
- **Fix**: Add `this.emergencyAlliesTriggeredThisWave = false;`.

### Fix Strategy 8: Adjust Repair Bot Rate to Exact 8 HP/s
- **Target**: `src/game/Helper.ts:135, 343`
- **Fix**: Set `actionInterval = 0.5;` with `+4 HP` (4 / 0.5 = 8 HP/s).

### Fix Strategy 9: Guard Fighter Firing on Living Hostiles
- **Target**: `src/game/Helper.ts:229`
- **Fix**: Add `if ((targetEnemy || hostiles.length > 0) && this.fireTimer <= 0)`.

### Fix Strategy 10: Add `break;` in Diver Barricade Collision
- **Target**: `src/game/GameManager.ts:2107`
- **Fix**: Add `break;` immediately after destroying the Diver.

---

## 6. Verification Method

To independently verify these findings:
1. **Playwright Multi-Barricade Compaction Test**:
   ```bash
   npx playwright test tests/19_barricade_saboteur_and_repair.spec.ts
   ```
2. **Verify Saboteur Retargeting Path**:
   Inspect `Enemy.ts:428-436`. Simulate a Saboteur at `y = latchY` retargeting from `barricades[1]` to `barricades[2]`. Trace `this.position.y += 30 * dt`.
3. **Verify Infinite Loop in Barricade**:
   Run in console: `b = new Barricade(0,0,0); b.hp = 25; b.update(0.016);`. Observe infinite while loop.
4. **Visual Layout Verification**:
   Inspect `game-canvas.tsx:1159` vs `game-canvas.tsx:163`. Note that `top-14` (56px) and `left-4` (16px) occupies the exact bounding box of the TopHUD Pure Water / Wave container.
5. **Full Build Check**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

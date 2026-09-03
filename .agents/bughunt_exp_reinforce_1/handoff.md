# Allied Reinforcements Subsystem Audit Report (Aegis Vanguard Command Dreadnought)

**Auditor Agent**: `bughunt_exp_reinforce_1`  
**Target Files**: `src/game/crisis/AlliedReinforcements.ts`, `src/game/GameManager.ts`  
**Status**: COMPLETE (Read-Only Investigation)  
**Timestamp**: 2026-09-03T05:25:00Z  

---

## 1. Observation

### 1.1 Lifecycle & State Transitions
- **Warp-in Configuration**: `warpTimer` defaults to `2.0` and `warpDuration` to `2.0` (`AlliedReinforcements.ts:58-59`). The vessel spawns at `y = targetY + 80` (`AlliedReinforcements.ts:91`) where `targetY = canvasHeight * 0.65` (`line 86`).
- **Descent Trajectory**: Calculated using `progress = Math.max(0, 1 - (this.warpTimer / this.warpDuration))` and `this.position.y = (this.targetY + 80) - 80 * this.easeOutCubic(progress)` (`AlliedReinforcements.ts:142-149`).
- **Combat Inactivity During Warp-In**: Heavy plasma cannons, restorative nano-shield, and escort fighters are guarded by `if (!this.isWarpingIn && !this.isWarpingOut)` (`AlliedReinforcements.ts:195`). However, `this.updatePointDefenseGrid` is invoked at line 184 unconditionally, providing active bullet interception during warp-in.
- **Warp-out Transition**: Triggered via `warpOut()` setting `isWarpingOut = true; warpRingAlpha = 1.0;` (`AlliedReinforcements.ts:446-451`). The vessel ascends at `380 * deltaTime` (`line 158`) and escort interceptors ascend at `420 * deltaTime` (`line 213`). When `position.y < -this.size.height - 50` (-150px), `isActive = false; isDismissed = true;` (`lines 162-165`).
- **GameManager Integration**:
  - Auto-summoned when crisis enters Phase 2 in both callback (`GameManager.ts:330-331`) and game loop (`GameManager.ts:726-727`): `if (this.endGameCrisis.phase === CrisisPhase.PHASE_2_HULL && !this.alliedReinforcements) this.triggerAlliedReinforcements();`.
  - Warp-out ordered on crisis defeat in callback (`GameManager.ts:338-340`) and loop (`GameManager.ts:784-786`).
  - Reference cleanup: `this.alliedReinforcements = undefined;` is executed in `startStage` (`line 232`), `nextStage` (`line 282`), and `gameOver` (`line 1613`).
  - **Omission in `triggerEndGameCrisis`**: In `GameManager.ts:322-364`, `this.alliedReinforcements` is NOT reset to `undefined`. If a second crisis is initiated within the same stage session, `!this.alliedReinforcements` evaluates to `false`, preventing the Dreadnought from auto-deploying in the subsequent crisis.

### 1.2 Point-Defense Grid (120px Perimeter)
- **Interception Mathematics**: Tested using squared distance against both Dreadnought center $(x + 110, y + 50)$ and Player ship center $(px + 25, py + 20)$: `const INTERCEPT_RADIUS_SQ = 120 * 120;` (`AlliedReinforcements.ts:320-321`).
- **Target Filtering**: Evaluates `if (bullet.isDead || bullet.faction === Faction.PLAYER) continue;` (`AlliedReinforcements.ts:325-327`). All hostile bullets (`Faction.INVADER`, `Faction.ROGUE`) within 120px have `bullet.isDead = true;` set (`line 339`). It does not discriminate by `bullet.isInterceptable`.
- **Bullet Removal & Array Safety**:
  - `AlliedReinforcements.ts` does NOT mutate `bullets` array via `splice()` or `filter()`. It exclusively flags `bullet.isDead = true;`.
  - In `GameManager.ts:1273, 1292, 1434`, collision checks verify `if (bullet.isDead) continue;`, guaranteeing intercepted projectiles never damage the player or interact with barricades.
  - In `GameManager.ts:1169-1182`, dead bullets are compacted in-place using a two-pointer writeIndex loop (`this.bullets[bulletWriteIdx++] = b; this.bullets.length = bulletWriteIdx;`).
  - Active beam lifespans in `AlliedReinforcements.ts:187-192` decrement `beam.life` and safely remove expired beams using a backward iterating loop: `for (let i = this.pdLaserBeams.length - 1; i >= 0; i--) { ... this.pdLaserBeams.splice(i, 1); }`.
- **Non-Bullet Hazards**:
  - Acid Storm droplets (`this.hazardProjectiles`, `GameManager.ts:915, 951-990`) and Solar Flare strikes (`this.solarFlares`, `GameManager.ts:923, 1020-1060`) are stored in separate arrays and are not instances of `Bullet`.
  - `AlliedReinforcements.update` accepts only `bullets: Bullet[]`. Non-bullet environmental hazards bypass the 120px grid entirely.
- **Perimeter Visual Discrepancy**:
  - `AlliedReinforcements.ts:864-878` (`drawDefensivePerimeters`) only renders a 120px dashed circle around the Dreadnought hull (`ctx.arc(dreadCenterX, dreadCenterY, 120, 0, Math.PI * 2)`).
  - No 120px perimeter circle is rendered around the Player ship; only the 36px nano-shield ellipse is rendered (`drawPlayerNanoShield:517`). Hostile bullets vaporize in empty space 120px away from the player with laser beams connecting to them.

### 1.3 Restorative Nano-Shield Aura
- **Heal Interval & Clamping**:
  - `healInterval = 5.0` seconds (`AlliedReinforcements.ts:74`).
  - When `healTimer >= healInterval`: `player.hp = Math.min(player.maxHp, player.hp + 1);` (`AlliedReinforcements.ts:387-388`).
  - Clamping strictly prevents exceeding `player.maxHp`.
- **Stress & Suppression Math**:
  - `player.stressLevel = Math.max(0, player.stressLevel - 25);` (`AlliedReinforcements.ts:391`).
  - `player.suppressionLevel = Math.max(0, player.suppressionLevel - 25);` (`AlliedReinforcements.ts:392`).
  - Math is strictly bounded: negative stress or suppression values are impossible.
- **React UI State Desynchronization (CRITICAL)**:
  - In `src/components/game-canvas.tsx:663`, React state is updated via `game.onPlayerHpChange = setHp;`.
  - In `GameManager.ts`, `this.onPlayerHpChange(this.player.hp)` is invoked during damage intake (`lines 748, 983, 1047, 1105, 1120, 1469`) and stage initialization (`line 241`).
  - In `GameManager.ts:770-781` (`alliedReinforcements.update`), `player.hp` increases by +1, but `this.onPlayerHpChange(this.player.hp)` is NEVER called.
  - As a result, the top HUD heart indicators in the React DOM do not refresh when the player is repaired, remaining stale until subsequent damage is taken.

### 1.4 Escort Interceptors
- **Formation Offsets & Math**:
  - Left fighter target: `player.position.x + targetOffsetX` (`-45px`) (`AlliedReinforcements.ts:411`).
  - Right fighter target: `player.position.x + player.size.width + (targetOffsetX - fighter.size.width)` (`+19px` net gap) (`AlliedReinforcements.ts:412`).
  - Target Y: `player.position.y + 8` (`line 414`).
  - Symmetric formation clearance is exactly 19px on both sides.
- **Lerp & Banking Physics**:
  - `fighter.x += (targetX - fighter.x) * Math.min(1.0, 9.0 * deltaTime);` (`line 418`).
  - `fighter.vx = (fighter.x - prevX) / (deltaTime || 0.016);` (`line 422`).
  - `fighter.rollAngle = Math.max(-0.4, Math.min(0.4, (fighter.vx / 300) * 0.4));` (`line 423`).
  - Guarded against division by zero via `(deltaTime || 0.016)`. Roll angle is strictly clamped to $[-0.4, +0.4]$ radians ($[-22.9^\circ, +22.9^\circ]$).
- **Boundary Clamping Defect**:
  - Neither `targetX` nor `fighter.x` is clamped to canvas boundaries `[0, canvasWidth - fighter.size.width]`.
  - When the player touches the left border ($x = 0$), `targetX = -45`. The left fighter flies 45px outside the canvas.
  - At line 434, the off-screen fighter fires bullets at $x = -35$, which spawn and travel off-screen.
  - When the player touches the right border ($x = \text{canvasWidth} - 50$), the right fighter flies to $x = \text{canvasWidth} + 19$, flying and shooting outside the right canvas boundary.
- **Target Acquisition Absence**:
  - Escort interceptors fire fixed vertical bolts: `const bolt = new Bullet(muzzleX - 3, muzzleY, -420, 1, true, 1);` (`lines 434-436`). `bolt.velocity.x` defaults to 0. They do not track or lead targets.
- **Player Death Handling**:
  - `if (!player || player.isDead) return [];` (`line 404`).
  - Escort interceptors immediately halt movement and freeze at their last coordinates upon player death. No NaN coordinates are produced.

### 1.5 Audio/Visual Rendering & UI Banner Toasts
- **Layer Separation**:
  - World elements (`alliedReinforcements.draw`, `drawPlayerNanoShield`) execute inside Layer 2 (`GameManager.ts:1880-1881`), correctly applying screen shake.
  - Toast banner (`drawUI`) executes in Layer 3 (`GameManager.ts:1953-1955`), remaining stable outside camera shake.
- **Mobile Viewport Banner Overflow**:
  - In `AlliedReinforcements.ts:550`, `bannerWidth = Math.min(500, screenWidth - 30)`. On 375px screens, `bannerWidth = 345px`.
  - Line 610 renders: `'HEAVY PLASMA CANNONS: ONLINE  |  PD LASER GRID: ACTIVE  |  NANO-SHIELD: LINKED'`.
  - In 9px monospace font, 72 characters span $\approx 388$px, exceeding the 345px banner container and spilling across both edges of a 375px canvas.
- **Sound Effect Omissions**:
  - `AlliedReinforcements.ts` does not import or use `soundManager`.
  - The only audio cue is `soundManager.playPowerUp()` on summon (`GameManager.ts:368`).
  - Plasma cannon shots, PD laser grid zaps, escort blaster fire, nano-shield heals, and warp-out departure are completely silent.

---

## 2. Logic Chain

1. **Premise**: In React/Next.js canvas games, visual state in the DOM HUD must match engine state.
   - *Evidence*: `game.onPlayerHpChange = setHp;` in `game-canvas.tsx:663`.
   - *Step*: `updateRestorativeNanoShield` increments `player.hp` by +1 (`AlliedReinforcements.ts:387`), but neither it nor `GameManager.ts:770-781` notifies `onPlayerHpChange`.
   - *Inference*: The player's in-game health is restored, but the user-facing HUD display is out-of-date, leading players to believe the repair mechanic failed.

2. **Premise**: Game entities and their projectiles should remain within the playable arena unless despawning.
   - *Evidence*: Escort target offsets are $-45$px and $+19$px without canvas boundary clamping (`AlliedReinforcements.ts:411-420`).
   - *Step*: Player movement to $x=0$ causes left fighter to lerp to $x=-45$ and spawn bullets at $x=-35$.
   - *Inference*: Fighters and projectiles render off-canvas, generating useless projectile objects that traverse off-screen until pruned at $y < -50$.

3. **Premise**: Responsive canvas banners must constrain text within the container bounding box.
   - *Evidence*: Toast banner container width is $345$px on a $375$px mobile viewport (`AlliedReinforcements.ts:550`), while the status ticker text string spans $\approx 388$px (`line 610`).
   - *Inference*: On mobile viewports $\le 390$px wide, the text overflows the tactical border and clips against the viewport boundary.

4. **Premise**: Array compaction and iteration must not skip elements or cause memory leaks.
   - *Evidence*: `updatePointDefenseGrid` marks `bullet.isDead = true;` without splicing (`line 339`); `GameManager.ts:1169-1182` uses a two-pointer writeIndex compaction; `pdLaserBeams` prunes via backward iteration (`lines 187-192`).
   - *Inference*: The array lifecycle and pruning architecture is mathematically sound, garbage-collection friendly, and free of index-skipping bugs.

---

## 3. Caveats

- **Environmental Hazard Immunity Intent**: It is possible that non-bullet hazards (Acid Storm, Solar Flares) bypassing the Point-Defense Grid is an intentional design choice to preserve the utility of the purchasable Acid Shield (`player.hasAcidShield`).
- **Escort Straight-Firing Design**: Fixed upward trajectories (`vy = -420, vx = 0`) for escort interceptors may be intentional to act as suppressing lane fire rather than homing turrets.
- **Audio Clutter Prevention**: Complete silence during continuous PD laser interceptions and escort firing may have been an intentional balance choice to prevent Web Audio oscillator saturation during heavy bullet hell phases.

---

## 4. Conclusion

The Allied Reinforcements subsystem is architecturally robust, exhibiting stable physics lerping, leak-free bullet management, and compliant 5,200 EHP integration. However, 5 actionable issues and edge cases were identified:

1. **[High] React HUD HP Desync**: `onPlayerHpChange` is not triggered when the Restorative Nano-Shield repairs player HP, leaving the DOM health bar out of sync.
2. **[Medium] Escort Boundary Clamping**: Escort fighters fly off-screen (up to $-45$px) and fire into the void when the player maneuvers along screen edges.
3. **[Medium] Mobile Toast Text Overflow**: The 72-character status ticker overflows the 345px banner box on $\le 390$px mobile screens.
4. **[Low] Player PD Perimeter Visual**: 120px defensive perimeter circle is only rendered around the Dreadnought hull, not around the player ship.
5. **[Low] Crisis Re-Trigger Retention**: `GameManager.triggerEndGameCrisis` does not reset `alliedReinforcements = undefined`, preventing re-summoning if multiple crises occur in the same stage.

### Proposed Fix Snippets (For Implementation Agent)

#### Fix 1: Sync React HP on Nano-Shield Repair (`GameManager.ts:770-782`)
```typescript
// Before:
const alliedBullets = this.alliedReinforcements.update(...);
if (alliedBullets && alliedBullets.length > 0) {
  this.bullets.push(...alliedBullets);
}

// After:
const prevHp = this.player.hp;
const alliedBullets = this.alliedReinforcements.update(...);
if (alliedBullets && alliedBullets.length > 0) {
  this.bullets.push(...alliedBullets);
}
if (this.player.hp !== prevHp && this.onPlayerHpChange) {
  this.onPlayerHpChange(this.player.hp);
}
```

#### Fix 2: Clamp Escort Positions to Play Area (`AlliedReinforcements.ts:411-420`)
```typescript
// Before:
const targetX = fighter.side === 'left'
  ? player.position.x + fighter.targetOffsetX
  : player.position.x + player.size.width + (fighter.targetOffsetX - fighter.size.width);

// After:
let targetX = fighter.side === 'left'
  ? player.position.x + fighter.targetOffsetX
  : player.position.x + player.size.width + (fighter.targetOffsetX - fighter.size.width);
targetX = Math.max(4, Math.min(this.canvasWidth - fighter.size.width - 4, targetX));
```

#### Fix 3: Responsive Status Ticker Text on Mobile (`AlliedReinforcements.ts:608-610`)
```typescript
// Before:
ctx.font = '9px monospace';
ctx.fillText('HEAVY PLASMA CANNONS: ONLINE  |  PD LASER GRID: ACTIVE  |  NANO-SHIELD: LINKED', screenWidth / 2, bannerY + 59);

// After:
ctx.font = screenWidth < 420 ? '8px monospace' : '9px monospace';
const tickerText = screenWidth < 420 
  ? 'CANNONS: ONLINE | PD GRID: ACTIVE | NANO-SHIELD: ON' 
  : 'HEAVY PLASMA CANNONS: ONLINE  |  PD LASER GRID: ACTIVE  |  NANO-SHIELD: LINKED';
ctx.fillText(tickerText, screenWidth / 2, bannerY + 59);
```

#### Fix 4: Reset Allied Reference in `triggerEndGameCrisis` (`GameManager.ts:326`)
```typescript
// Before:
this.endGameCrisisDefeatedHandled = false;

// After:
this.endGameCrisisDefeatedHandled = false;
this.alliedReinforcements = undefined;
```

---

## 5. Verification Method

To independently verify all findings and validate the proposed changes:

1. **Run Allied Reinforcements Unit Suite**:
   ```bash
   npx playwright test tests/unit/allied_reinforcements.test.ts
   ```
   *Expected*: All 7 unit tests pass (validates baseline lifecycle, PD grid, healing, escort formation, and GameManager hooks).

2. **Run Challenger Adversarial Stress Suite**:
   ```bash
   npx playwright test tests/unit/challenger_crisis12_adversarial.test.ts
   ```
   *Expected*: All 9 adversarial tests pass (validates 1,000-bullet PD barrage, 1,000,000 DPS invariance, and 5,200 EHP balance).

3. **Verify Boundary Clamping Edge Case**:
   - Inspect `AlliedReinforcements.ts:411-420`.
   - Set `player.position.x = 0`, call `allied.update(0.5, player, [], [], null)`.
   - Assert `allied.escortFighters[0].x < 0` (confirms bug where left fighter is at $-45$px).

4. **Verify React HUD Desynchronization**:
   - Inspect `GameManager.ts:770-782`.
   - Verify that `onPlayerHpChange` is not referenced within the Allied Reinforcements update branch.

# Quality & Adversarial Review Report: Stream C Crew Synergy Deck

**Reviewer**: `qa_playtest_stream_c_crew_synergy` (teamwork_preview_reviewer / critic)  
**Target Feature**: Feature 7: Veteran Crew Officer Synergy Deck & Active Bridge Abilities  
**Review Verdict**: **REQUEST_CHANGES**  
**Integrity Finding**: **INTEGRITY VIOLATION (Facade Implementations & Unimplemented Requirements)**  
**Overall Risk Assessment**: **CRITICAL**

---

## 1. Observation

### Obs 1: Officer Perks Are Cosmetic Data Structures With Zero Gameplay Logic
- **Files**: `src/game/flagship/progression/CrewOfficerDeck.ts` (lines 74–375, 450–455, 1003–1006), `src/game/Player.ts` (lines 8–18, 50–56, 152–220), `src/game/GameManager.ts` (lines 470–472, 1794–1796).
- **Direct Code Evidence**:
  In `CrewOfficerDeck.ts`:
  ```typescript
  // Lines 88-118:
  perks: [
    { id: 'PERK_INGRID_1', tier: 1, nameEn: 'Nano-Alloy Bulkhead', descriptionEn: 'Max HP +1, collision damage taken reduced by 30%', isActive: true },
    { id: 'PERK_INGRID_2', tier: 2, nameEn: 'Active Barricade Tether', descriptionEn: 'Restores 25% HP to all barricades at wave start; destroyed barricades emit 100px shockwave', isActive: false },
    { id: 'PERK_INGRID_3', tier: 3, nameEn: 'Reactor Heat Siphon', descriptionEn: 'When stress > 50, speed +20% and regenerates 1 HP every 25s', isActive: false },
  ]
  ```
  Similar entries exist for Jax (`PERK_JAX_1`, `PERK_JAX_2`, `PERK_JAX_3`), Ren (`PERK_REN_1`, `PERK_REN_2`, `PERK_REN_3`), and Lyra (`PERK_LYRA_1`, `PERK_LYRA_2`, `PERK_LYRA_3`).
- **Grep Search Findings**:
  A global search for `PERK_INGRID`, `PERK_JAX`, `PERK_REN`, and `PERK_LYRA` across `src/` yielded matches *only* within `CrewOfficerDeck.ts`.
  Searching for `.perks` across `src/` revealed it is only touched at:
  - Line 451: `for (const perk of officer.perks) { if (perk.tier <= officer.rank) { perk.isActive = true; } }`
  - Line 1003: `for (const perk of off.perks) { perk.isActive = perk.tier === 1; }`
- **Simulation Verification**:
  In `Player.ts`, `player.maxHp` defaults to 5 and is never incremented by Ingrid's `PERK_INGRID_1`. Player bullet velocity is hardcoded to `400` in `fire()` (line 171) and fire rate interval ignores Jax's `PERK_JAX_1` (-12% interval, +25% bullet velocity). Hyper-Kinetic Slugs on every 4th shot (`PERK_JAX_3`), acoustic ping marking on hit (`PERK_REN_1`), Bio-Nutrient Pearl drops on kill (`PERK_LYRA_1`), and acid rain damage reduction (`PERK_LYRA_2`) are completely absent from `Player.ts`, `Enemy.ts`, `Barricade.ts`, and `GameManager.ts`.

### Obs 2: 5 of 6 Dual Resonances Are Unimplemented Dummy Objects; Steam & Thunder Has Inverted Logic and Wrong Missile Count
- **File**: `src/game/flagship/progression/CrewOfficerDeck.ts` (lines 469–569, 699–730)
- **Direct Code Evidence**:
  - In `evaluateResonances()` (lines 485–569), 6 resonances are instantiated and pushed into `this.state.activeResonances`:
    1. `RESONANCE_STEAM_THUNDER` (Ingrid + Jax)
    2. `RESONANCE_THERMAL_PLUME` (Ingrid + Lyra)
    3. `RESONANCE_AEGIS_BULKHEAD` (Ingrid + Ren)
    4. `RESONANCE_DEAD_RECKONING` (Jax + Ren)
    5. `RESONANCE_BIO_BALLISTICS` (Jax + Lyra)
    6. `RESONANCE_ABYSSAL_ECHOSPHERE` (Ren + Lyra, representing Acoustic Biosynthesis)
  - Grep search confirms `RESONANCE_THERMAL_PLUME`, `RESONANCE_AEGIS_BULKHEAD`, `RESONANCE_DEAD_RECKONING`, `RESONANCE_BIO_BALLISTICS`, and `RESONANCE_ABYSSAL_ECHOSPHERE` appear *strictly once* in the entire repository (their declaration line in `evaluateResonances`). There is zero gameplay code executing their effects.
  - In `update()` (lines 699–725), `RESONANCE_STEAM_THUNDER` checks:
    ```typescript
    } else if (currentBarricadeHp < this.previousBarricadeHpSum) {
      // Barricade took damage!
      this.previousBarricadeHpSum = currentBarricadeHp;
      if (this.barricadeRetaliationCooldown <= 0) {
        this.barricadeRetaliationCooldown = 1.8;
        // Launch 2 retaliation missiles
        const m1 = new HomingMissile(pX - 12, pY, 15);
        const m2 = new HomingMissile(pX + 12, pY, 15);
        context.bullets.push(m1, m2);
      }
    }
    ```
  - **Tool Execution (`npx tsx`)**:
    - When barricade HP increases (repair from 100 to 120): `Bullets fired: 0`.
    - When barricade HP decreases (damage from 120 to 80): `Bullets fired: 2`.
  - **Contract Invalidation**:
    DISPATCH.md Section 3 and IDEAS_PITCH.md line 607 explicitly specify:
    *"Steam & Thunder (Ingrid + Jax): Barricade repairs auto-fire 4 steam missiles."*
    The code fires 2 missiles on barricade damage, never on repair.
  - **Unreachable in Normal Play**:
    All 4 officers initialize at `rank: 1`. `isPairActive(a, b)` requires `offA.rank >= 2 && offB.rank >= 2`. `promoteOfficer` is never invoked anywhere in runtime gameplay code, rendering all dual resonances (including Steam & Thunder) 100% inactive in a standard playthrough.

### Obs 3: Complete Absence of Bridge Officer Assignment UI in Pre-Wave Lobby and Continue Shop
- **Files**: `src/components/game-canvas.tsx` (lines 12–129, 338–475, 478–559, 561–647), `src/game/flagship/types.ts` (lines 389–390), `src/game/flagship/progression/CrewOfficerDeck.ts` (lines 426–463).
- **Direct Code Evidence**:
  - `ShopUpgradePanel` contains only 6 upgrade rows: Tank Repair, Fire Rate, Multi-Shot, Piercing, Acid Shield, and Homing Missiles.
  - `ShopModal` (used for Wave Cleared, Pre-Game Armory, and Continue Shop) and `GameOverModal` render `ShopUpgradePanel` and standard action buttons.
  - Neither `assignStation` nor `promoteOfficer` is imported or referenced anywhere in `src/components/game-canvas.tsx` or `src/app/page.tsx`.
  - There is no station assignment screen, officer roster modal, or perk tree interface.

### Obs 4: Mobile Touch Controls Missing Officers 3 & 4, and Inverted Button Tooltips
- **File**: `src/components/game-canvas.tsx` (lines 301–321)
- **Direct Code Evidence**:
  ```tsx
  <button 
    onPointerDown={onTouchStart('1')}
    title="Weapons Officer: Ballistic Salvo (1)"
  >
    OFFICER 1
  </button>
  <button 
    onPointerDown={onTouchStart('2')}
    title="Engineer: Ballast Shield (2)"
  >
    OFFICER 2
  </button>
  ```
  - Only `OFFICER 1` and `OFFICER 2` exist in `MobileControls`. There are NO buttons for `OFFICER 3` (Ren Thorne) or `OFFICER 4` (Dr. Lyra Vance).
  - Inverted Role Labels:
    - Button `OFFICER 1` triggers key `'1'` (which is Chief Engineer Ingrid Vane / SCRAM Purge), but its tooltip reads `"Weapons Officer: Ballistic Salvo (1)"`.
    - Button `OFFICER 2` triggers key `'2'` (which is Master Gunner Jax Callahan / Titan Salvo), but its tooltip reads `"Engineer: Ballast Shield (2)"`.
  - Canvas cards drawn via `crewDeck.drawHUD(ctx)` have no pointer event listeners. `FlagshipManager.handlePointer` does not check coordinates against the officer cards (x: 12..136, y: 82..240), meaning touchscreen players cannot tap the canvas HUD to activate abilities.

### Obs 5: Per-Frame Exponential Decay in Ren's Stasis Pulse Causes Permanent Bullet Freeze
- **File**: `src/game/flagship/progression/CrewOfficerDeck.ts` (lines 664–672)
- **Direct Code Evidence**:
  ```typescript
  if (this.activeStasisTimer > 0) {
    this.activeStasisTimer -= deltaTime;
    for (const bullet of context.bullets) {
      if (!bullet.isPlayerBullet) {
        bullet.velocity.x *= 0.85;
        bullet.velocity.y *= 0.85;
      }
    }
  }
  ```
- **Direct Tool Measurement (`npx tsx`)**:
  - Starting hostile bullet velocity: $v_y = 200\text{ px/s}$.
  - After 60 frames ($1.0\text{ s}$ of Stasis): $v_y = 0.0116\text{ px/s}$.
  - Reduction factor: $0.85^{60} \approx 0.000058$ ($99.994\%$ reduction in $1\text{ s}$).
  - Consequence: Instead of slowing bullets by $70\%$ for $5.0\text{ s}$ as specified, bullets decelerate into a near-total stop in under $0.3\text{ s}$.
  - Velocity Destruction: When `activeStasisTimer` reaches $0$, velocities are never restored, leaving enemy projectiles permanently stranded in space.

### Obs 6: Keybinding Collisions Between Bridge Officers and Core Mechanics (Q and E)
- **Files**: `src/game/GameManager.ts` (lines 2888–2905), `src/game/flagship/FlagshipManager.ts` (lines 243–250).
- **Direct Code Evidence**:
  In `GameManager.ts`:
  ```typescript
  // Line 2890:
  this.flagshipManager.handleInput(key, true, this.getFlagshipContext());
  // Line 2900:
  if (k === 'e' || k === 'shift') { this.triggerUltimate(); }
  // Line 2903:
  if (k === 'q') { this.triggerSummonAlly(); }
  ```
  - Pressing `Q` executes Ingrid's `SCRAM_PURGE` (35s CD) AND simultaneously triggers `triggerSummonAlly()` (spending 50 💧).
  - Pressing `E` executes Jax's `TITAN_SALVO` (28s CD) AND simultaneously discharges `triggerUltimate()` (consuming the 100% ultimate meter).

---

## 2. Logic Chain

1. **Premise 1 (Integrity Standard)**: Per agent mandate, any work product exhibiting dummy/facade implementations that look correct on the surface but execute no real logic, or shortcuts that bypass intended requirements, MUST receive a verdict of `REQUEST_CHANGES` with a Critical finding tagged as `INTEGRITY VIOLATION`.
2. **Premise 2 (Cosmetic Perks)**: Observation 1 confirms that all 12 perks across the 4 officers are string descriptors stored in arrays. `perk.isActive` is toggled on paper, but zero underlying mechanics (HP boost, barricade wave-start repairs, speed boosts, crit marks, pearl drops, acid mitigation) are queried or applied in `Player.ts`, `Enemy.ts`, or `GameManager.ts`.
3. **Premise 3 (Facade Resonances)**: Observation 2 proves that 5 of the 6 dual resonances (`RESONANCE_THERMAL_PLUME`, `RESONANCE_AEGIS_BULKHEAD`, `RESONANCE_DEAD_RECKONING`, `RESONANCE_BIO_BALLISTICS`, `RESONANCE_ABYSSAL_ECHOSPHERE`) are never queried in any game loop logic. Acoustic Biosynthesis (+5% lifesteal on marked enemies) has zero lines of implementation. The 6th resonance (Steam & Thunder) operates on damage rather than repair, fires 2 missiles instead of 4, and is unreachable because officer promotion is not wired up.
4. **Premise 4 (Missing Assignment UI)**: Observation 3 establishes that the Pre-Wave Lobby and Continue Shop have no UI for officer management.
5. **Premise 5 (Critical Flaws & Edge Cases)**: Observations 4, 5, and 6 establish that mobile players are locked out of officers 3 and 4, Stasis Pulse destroys bullet physics via per-frame compounding deceleration, and pressing Q or E triggers double-firing conflicts with Ally Summon and Ultimate.
6. **Deductive Conclusion**: The implementation constitutes a facade pattern for perks and resonances and fails key deliverables of Feature 7. Therefore, the review verdict must be `REQUEST_CHANGES` with an `INTEGRITY VIOLATION` finding.

---

## 3. Findings

### [Critical — INTEGRITY VIOLATION] Finding 1: Facade Implementation of Officer Passive Perks and Dual Resonances
- **What**: All 12 officer perks across the 4 officers and 5 of the 6 dual resonances are dummy declarations that do not execute gameplay logic.
- **Where**: `src/game/flagship/progression/CrewOfficerDeck.ts` (lines 88–371, 499–569).
- **Why**: Violates delivery integrity. Players equipping officers receive zero passive stat bonuses, no wave-start barricade repair, no kinetic slug on the 4th shot, no acoustic crit marks, and no acoustic lifesteal.
- **Suggestion**:
  1. Wire Ingrid's `PERK_INGRID_1` into `Player.ts` to add +1 to `maxHp` and reduce collision damage by 30%.
  2. Implement `onWaveComplete` or wave-start hooks in `CrewOfficerDeckManager` to repair barricades by 25%.
  3. Wire Jax's velocity and fire rate modifiers into `Player.ts` `fire()`, and track shot count to fire Hyper-Kinetic slugs on every 4th shot.
  4. Implement enemy tagging and +5% lifesteal for Acoustic Biosynthesis in `Enemy.ts` / `Bullet.ts`.
  5. Either implement the remaining 4 dual resonances or prune them from claims.

### [Critical] Finding 2: Missing Bridge Officer Assignment & Promotion UI in Pre-Wave Lobby and Shop
- **What**: No UI exists in `ShopModal`, `ShopUpgradePanel`, or `game-canvas.tsx` allowing players to assign officers to stations or promote them.
- **Where**: `src/components/game-canvas.tsx` (lines 478–647).
- **Why**: Directly fails Requirement 1 of the dispatch ("Verify UI for assigning officers in Pre-Wave Lobby and Continue Shop"). Players cannot interact with the synergy deck.
- **Suggestion**: Add a "Bridge Crew Roster" tab or section inside `ShopUpgradePanel` / `ShopModal` where players can inspect officer stats, swap stations, and spend currency/merit XP to promote officers to Rank 2 and Rank 3.

### [Major] Finding 3: Mobile Touch Controls Missing Officers 3 & 4 and Inverted Button Labels
- **What**: `MobileControls` only renders `OFFICER 1` and `OFFICER 2`. Officers 3 (Ren) and 4 (Lyra) are inaccessible on mobile. Additionally, Officer 1 and 2 titles are inverted, and canvas HUD cards do not respond to touch.
- **Where**: `src/components/game-canvas.tsx` (lines 301–321), `src/game/flagship/FlagshipManager.ts` (lines 308–360).
- **Why**: Renders 50% of active bridge abilities unusable on mobile viewports.
- **Suggestion**:
  1. Add touch buttons for `OFFICER 3` and `OFFICER 4` (or a compact 4-button bridge pad).
  2. Correct the labels: Officer 1 = Chief Engineer (SCRAM), Officer 2 = Master Gunner (Salvo).
  3. Add hit detection in `FlagshipManager.handlePointer` so tapping canvas cards activates abilities.

### [Major] Finding 4: Exponential Compounding Velocity Loss in Stasis Pulse
- **What**: `bullet.velocity.x *= 0.85` occurs every frame during the 5s timer, resulting in $0.85^{60} \approx 0.000058$ velocity reduction within 1 second. Bullets freeze permanently in midair even after stasis expires.
- **Where**: `src/game/flagship/progression/CrewOfficerDeck.ts` (lines 664–672).
- **Why**: Corrupts projectile physics and creates floating bullet clutter on screen.
- **Suggestion**: Apply speed scaling non-destructively or scale velocity relative to base speed once, restoring it upon timer expiration.

### [Major] Finding 5: Keybinding Collision Between Bridge Abilities and Core Game Actions (Q and E)
- **What**: Pressing `Q` or `E` triggers both the officer bridge ability and the core action (Ally summon on Q, Ultimate on E).
- **Where**: `src/game/GameManager.ts` (lines 2890, 2900, 2903).
- **Why**: Players unintentionally blow 35s cooldowns or waste 50 water currency/ultimate charge on single key presses.
- **Suggestion**: Separate keybinds: reserve `1`, `2`, `3`, `4` strictly for officers, and remove `Q`/`E` from officer triggering, or require a modifier key.

---

## 4. Adversarial Challenge & Stress Test

### Challenge Summary
- **Overall Risk Assessment**: **CRITICAL**
- **Primary Failure Modes**:
  1. Facade perk verification passes unit tests because tests only assert array length (`perks.length > 0`), not gameplay execution.
  2. Bullets accumulating in stasis with near-zero velocity cause entity list bloat.
  3. Unpromotable officers lock all dual and quad resonances behind an unreachable gate.

### Stress Test Results

| # | Stress Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| S1 | Check initial officer ranks & active resonances | Requires Rank 2; UI allows promoting | Ranks fixed at 1; 0 active resonances; no promotion mechanism | **FAIL** |
| S2 | Barricade repair with Ingrid+Jax active | Fires 4 steam rockets on repair | 0 rockets on repair; fires 2 rockets on damage | **FAIL** |
| S3 | Stasis Pulse bullet speed over 1 second | Bullets slowed by 70% ($0.30 \times v$) | Bullets reduced by 99.994% ($0.000058 \times v$) | **FAIL** |
| S4 | Player health with Ingrid stationed | Player max HP increases by +1 | Player max HP remains default (5) | **FAIL** |
| S5 | Mobile touch interaction with Officer 3 & 4 | Buttons exist to trigger Ren & Lyra | Only Officer 1 & 2 buttons present in DOM | **FAIL** |
| S6 | Active ability trigger on key [1] and [2] | Triggers SCRAM Purge and Titan Salvo | Successfully sets cooldowns and spawns missiles | **PASS** |
| S7 | Decoy Pod bullet interception | Intercepts enemy bullets within 50px | Absorbs bullets up to 120 HP and expires cleanly | **PASS** |
| S8 | Canvas HUD rendering | Cards, readiness bars, and banners render | Renders cleanly on foreground layer | **PASS** |

---

## 5. Verified vs Unverified Claims

### Verified Working
- Active bridge ability triggers via hotkeys `1`, `2`, `3`, `4`:
  - `SCRAM_PURGE` (Ingrid): Cleanses debuffs, sets 1.5s invincibility, wipes bullets within 300px, knocks back enemies.
  - `TITAN_SALVO` (Jax): Launches 12 homing torpedoes in a forward 180° fan with base cooldown 28s.
  - `BIO_DECOY` (Lyra): Spawns 120 HP Decoy Pod that absorbs bullets within 50px and heals player +1 HP.
- Canvas HUD card rendering (station letter, rank stars, name, readiness progress bar).
- Tactical Announcement Banners on ability trigger.
- Sub-Zero Reactor Purge revive logic when Quad Grand Resonance is manually forced in test environment.

### Disproved / Unimplemented Claims
- UI for assigning/promoting officers in Pre-Wave Lobby and Continue Shop: **Does not exist**.
- Ingrid's passive perks (Max HP +1, wave-start barricade repair): **Not wired to gameplay**.
- Jax's passive perks (velocity +25%, fire interval -12%, every 4th shot Hyper-Kinetic slug): **Not wired to gameplay**.
- Ren's passive perks (18% acoustic mark with +30% crit): **Not wired to gameplay**.
- Lyra's passive perks (Bio-pearl drops, acid rain reduction): **Not wired to gameplay**.
- Dual Resonances (Thermal Plume, Aegis Bulkhead, Dead Reckoning, Bio-Ballistics, Acoustic Biosynthesis): **Zero gameplay implementation**.
- Steam & Thunder: **Operates on barricade damage (not repair), fires 2 missiles (not 4), and is unreachable in normal play**.

---

## 6. Caveats

- We did not modify any source code files, strictly adhering to the review-only mandate.
- Build (`npm run build`) and the current test suite pass because existing tests only assert schema properties (`expect(officers['INGRID'].perks.length).toBeGreaterThan(0)`) and initial ability cooldown triggers, masking the lack of passive and resonance integration.

---

## 7. Conclusion

The Veteran Crew Synergy Deck implementation features well-structured visual canvas cards and active ability execution for hotkeys `1`-`4`. However, the core depth of the feature—including all passive perks, 5 of 6 dual resonances, barricade wave-start repairs, acoustic lifesteal, and the Pre-Wave/Continue Shop officer assignment UI—consists of dummy facade data structures without runtime logic. In accordance with the system integrity directive, the verdict is **REQUEST_CHANGES** under **INTEGRITY VIOLATION**.

---

## 8. Verification Method

To independently verify all findings:
1. **Perk & Resonance Facade Check**:
   ```bash
   npx tsx -e "
   import { CrewOfficerDeckManager } from './src/game/flagship/progression/CrewOfficerDeck';
   const deck = new CrewOfficerDeckManager();
   console.log('Active Resonances at Start:', deck.state.activeResonances.length);
   console.log('Ranks:', Object.fromEntries(Object.entries(deck.state.officers).map(([k, v]) => [k, v.rank])));
   "
   ```
   *Expected Result*: Active resonances = 0. Ranks = all 1.
2. **Steam & Thunder Inverted Logic Check**:
   ```bash
   npx tsx -e "
   import { CrewOfficerDeckManager } from './src/game/flagship/progression/CrewOfficerDeck';
   import { Player } from './src/game/Player';
   import { Barricade } from './src/game/Barricade';
   const deck = new CrewOfficerDeckManager();
   deck.promoteOfficer('INGRID'); deck.promoteOfficer('JAX'); deck.evaluateResonances();
   const bar = new Barricade(100, 500, 600); bar.hp = 100;
   const bullets = [];
   const ctx = { player: new Player(600, 800), enemies: [], bullets, barricades: [bar], helpers: [], particles: [], level: 1, score: 0, currency: 100, createExplosion: () => {}, triggerScreenShake: () => {} };
   deck.update(0.016, ctx);
   bar.hp = 120; deck.update(0.016, ctx);
   console.log('Bullets on Repair:', bullets.length);
   bar.hp = 80; deck.update(0.016, ctx);
   console.log('Bullets on Damage:', bullets.length);
   "
   ```
   *Expected Result*: Bullets on Repair: 0. Bullets on Damage: 2.
3. **Stasis Pulse Compounding Slowdown Check**:
   ```bash
   npx tsx -e "
   import { CrewOfficerDeckManager } from './src/game/flagship/progression/CrewOfficerDeck';
   import { Bullet } from './src/game/Bullet';
   import { Player } from './src/game/Player';
   const deck = new CrewOfficerDeckManager();
   const b = new Bullet(300, 300, 200, 1, false); b.isPlayerBullet = false;
   deck.activeStasisTimer = 5.0;
   const ctx = { player: new Player(600, 800), enemies: [], bullets: [b], barricades: [], helpers: [], particles: [], level: 1, score: 0, currency: 100, createExplosion: () => {}, triggerScreenShake: () => {} };
   for (let i = 0; i < 60; i++) deck.update(0.0166, ctx);
   console.log('Final Bullet Speed:', b.velocity.y, '(Factor:', b.velocity.y / 200, ')');
   "
   ```
   *Expected Result*: Final bullet speed ~0.0116 px/s (factor ~0.000058).

# Handoff Report: Requirement R2 — Allied Reinforcements with Roles & UI Survey

**Date**: 2026-09-04  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_allies_ui/`  
**Report File**: `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_allies_ui/survey.md`  

---

## 1. Observation

1. **Helper Entity & Current Roles (`src/game/Helper.ts:8-12, 186-193`)**:
   - `HelperType` currently defines 3 numeric values:
     ```typescript
     export enum HelperType {
       FIGHTER,
       REPAIRER,
       TANK
     }
     ```
   - Overhead rendering is currently barebones text without health bars or role badges:
     ```typescript
     ctx.fillStyle = '#ffffff';
     ctx.font = '10px monospace';
     ctx.textAlign = 'center';
     if (!this.isInvincible) {
        ctx.fillText(`HP:${this.hp}`, cx, this.position.y - 5);
     } else {
        ctx.fillText(`INV`, cx, this.position.y - 5);
     }
     ```
2. **Helper Update Signature (`src/game/Helper.ts:58`)**:
   - `public update(deltaTime: number, barricades: Barricade[], enemies: Enemy[], bullets: Bullet[]): Bullet[]`
   - It does not receive `player: Player`, preventing any Medic unit from accessing `player.hp` or `player.maxHp`.
3. **Existing Test Dependencies on HelperType (`tests/05_three_way_battle.spec.ts:1229`, `tests/adversarial_challenger_m1_faction_combat.ts:141-143`)**:
   - Existing tests instantiate helpers using explicit numeric and enum indices:
     - `new HelperClass(300, 700, gm.logicalWidth, gm.logicalHeight, 0); // HelperType.FIGHTER = 0`
     - `const tank = new Helper(200, 700, 600, 800, HelperType.TANK); // HelperType.TANK = 2`
     - `const repairer = new Helper(300, 700, 600, 800, HelperType.REPAIRER); // HelperType.REPAIRER = 1`
4. **GameManager Loop Integration (`src/game/GameManager.ts:27, 1043-1055, 1367-1372, 1403-1411, 1775-1791, 2152`)**:
   - Helpers are stored in `public helpers: Helper[] = [];` (line 27).
   - In-place compaction removes expired/dead helpers via `isExpired()` (lines 1403-1411).
   - Hostile bullets damage helpers and trigger explosions (lines 1775-1791).
   - Reinforcements are currently summoned either randomly via `pendingReinforcement === 'ALLY'` (lines 1043-1055, spawning 1-3 helpers) or manually via `triggerSummonAlly()` (lines 2341-2350).
5. **Dreadnought Capital Ship (`src/game/crisis/AlliedReinforcements.ts:1-955`)**:
   - Deployed during End-Game Crisis (Stage 15+ Phase 2) as an Aegis Vanguard Command Dreadnought, distinct from standard wave squad helpers.
6. **React UI & Overlays (`src/components/game-canvas.tsx:1030-1133`)**:
   - Has banners for crisis warnings, but has no HUD element or toast banner for allied reinforcements or active squadron status.
7. **Type-Check Sanity (`npx tsc --noEmit`)**:
   - Executed `npx tsc --noEmit` and confirmed zero TypeScript compilation errors.

---

## 2. Logic Chain

1. **Role Compatibility (From Observation 1 & Observation 3)**:
   - Because existing tests explicitly depend on `HelperType.FIGHTER === 0`, `HelperType.REPAIRER === 1`, and `HelperType.TANK === 2`, modifying these values would cause regressions across multiple test files.
   - Therefore, `HelperType` must preserve `FIGHTER = 0`, `REPAIRER = 1` (aliased to `REPAIR_BOT`), `TANK = 2`, and append `MEDIC = 3`.
2. **Medic Role Integration (From Observation 2 & Observation 4)**:
   - In `GameManager.update()` (line 1367), `this.player` is in scope when `helper.update()` is called.
   - Updating `helper.update(deltaTime, barricades, enemies, bullets, player)` allows the Medic role to heal `player.hp`, alleviate `player.stressLevel`, and recharge shields.
3. **UI & Rendering Plan (From Observation 1 & Observation 6)**:
   - To satisfy R2 ("Allied units must display their remaining health and a clear role indicator"), `Helper.draw()` must render:
     - A $38\times 5\text{px}$ overhead health bar with a slate-950 background track, black outline, and dynamic green/amber/red fill based on HP percentage.
     - A rounded pill badge overhead displaying role icons and uppercase titles (`[⚔️ FIGHTER]`, `[💚 MEDIC]`, `[🔧 REPAIR BOT]`) with a high-contrast outline to guarantee legibility on any background.
   - In `game-canvas.tsx`, an on-screen Squadron HUD and a massive reinforcement arrival toast banner (`✦ MASSIVE ALLIED REINFORCEMENTS ARRIVED! ✦`) provide immediate situational awareness.
4. **Massive Reinforcement Events (From Observation 4)**:
   - Instead of 1-3 random helpers, a massive reinforcement event spawns a balanced 4-5 unit squadron: 2 Fighters, 1 Medic, 1-2 Repair Bots.
   - This can be triggered on wave milestones (multiples of 5 waves), emergency health drops (`player.hp <= 1`), or via programmatic call-in (`triggerMassiveAlliedReinforcements()`).

---

## 3. Caveats

1. **Scope Boundary**: This exploration was strictly read-only; no implementation code in `src/` or `components/` was modified.
2. **Barricade Saboteur Synergy (R2 vs R3)**: Requirement R3 introduces Barricade Saboteur enemies. The Fighter AI targeting logic is designed to prioritize enemies with `isGnawing === true` or `type === EnemyType.SABOTEUR`, providing seamless interoperability with R3.
3. **Tank Role Retention**: Although R2 specifically enumerates "Medic", "Repair Bot", and "Fighter", retaining `HelperType.TANK` is essential for zero regressions on existing test suites.

---

## 4. Conclusion

Requirement R2 has a clear, low-risk implementation pathway that fully integrates with existing game systems and ensures 100% backward compatibility:
1. Extend `HelperType` with `MEDIC = 3` and alias `REPAIRER` as `REPAIR_BOT`.
2. Update `Helper.update` to accept `player?: Player` and implement distinct AI routines:
   - **Fighter**: Prioritizes Saboteurs and lowest invaders; fires twin plasma bolts.
   - **Medic**: Follows player vessel; pulses `+1 HP` every 3.5s and mitigates stress.
   - **Repair Bot**: Prioritizes damaged barricades; restores broken voxel blocks and structure HP.
3. Replace primitive text in `Helper.draw()` with graphical overhead health bars and high-contrast role badges (`[⚔️ FIGHTER]`, `[💚 MEDIC]`, `[🔧 REPAIR BOT]`).
4. Add `triggerMassiveAlliedReinforcements()` to `GameManager` and an active squadron HUD badge to `game-canvas.tsx`.
5. Comprehensive survey report is saved at `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_allies_ui/survey.md`.

---

## 5. Verification Method

1. **Type-Check Verification**:
   ```bash
   npx tsc --noEmit
   ```
   Must pass with 0 errors.
2. **Inspect Survey Report**:
   Inspect `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_allies_ui/survey.md` to verify all architectural sections, formulas, and pseudo-code.
3. **Independent Playwright Verification Strategy**:
   - Run existing unit test suite:
     ```bash
     npx playwright test tests/unit/allied_reinforcements.test.ts
     ```
   - Once implemented, verify new R2 tests for:
     - `HelperType.MEDIC` instantiation and healing logic.
     - `HelperType.FIGHTER` combat targeting.
     - `HelperType.REPAIRER` barricade voxel restoration.
     - Overhead health bar rendering & role badge contrast.
     - Massive reinforcement event trigger & DOM banner presence.

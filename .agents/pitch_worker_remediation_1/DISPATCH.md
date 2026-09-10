# Dispatch for pitch_worker_remediation_1

**Role**: Flagship Gate Remediation Specialist
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_worker_remediation_1
**Task**: Implement the 8 specific physical and state-synchronization fixes identified by Challengers 1 & 2.

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Inputs**:
- `/Users/user/src/water-invader/.agents/pitch_challenger_1/handoff.md`
- `/Users/user/src/water-invader/.agents/pitch_challenger_2/handoff.md`
- `/Users/user/src/water-invader/tests/unit/flagship_adversarial_physics_stress.test.ts`
- `/Users/user/src/water-invader/tests/adversarial_flagship_state_transitions.spec.ts`
- Target files:
  1. `src/game/flagship/weapons/CavitationTorpedo.ts`
  2. `src/game/flagship/weapons/HydraulicHarpoon.ts`
  3. `src/game/flagship/environment/OceanCurrent.ts`
  4. `src/game/GameManager.ts`
  5. `src/game/flagship/factions/KrakenPrimeBoss.ts`
  6. `src/game/flagship/environment/BiolapseDarknessCycle.ts`
  7. `src/game/flagship/modes/EndlessDescent.ts` & `src/game/flagship/FlagshipManager.ts`
  8. `src/game/flagship/factions/AutomatonShieldGrid.ts`

**Instructions**:
1. Fix `CavitationTorpedo.ts`:
   - In `applyShockwave()`, clamp enemy positions within $[0, 600] \times [0, 800]$ after applying radial impulse.
2. Fix `HydraulicHarpoon.ts`:
   - In `updateTetherPhysics()`, clamp displacement per timestep (`Math.min(disp, 60)`), clamp velocity, and clamp entity positions to $[0, 600] \times [0, 800]$. Subdivide step if $dt > 0.05$s.
3. Fix `OceanCurrent.ts`:
   - Ensure `Faction` is properly imported from `../types` and typed.
4. Fix `GameManager.ts` & Revive:
   - When player takes lethal damage in `checkCollisions()`, check if `flagshipManager.checkRevive()` or `crewOfficerDeck.triggerSubZeroPurge()` can revive the player.
   - If revive succeeds: restore `player.hp = player.maxHp`, ensure `player.isDead = false`, and do NOT call `this.gameOver()`.
5. Fix `KrakenPrimeBoss.ts`:
   - Add handler when `this.totalHp <= 0`: mark boss defeated, advance wave, trigger explosion FX, and stop enrage breach attacks.
   - In Phase 2, ensure `coreSubsystem` takes 0 damage while `mawSubsystem` is alive (`!mawSubsystem.isDestroyed`).
6. Fix `BiolapseDarknessCycle.ts`:
   - If `battery <= 0`, set `isLightOn = false` so dynamo recharge in `else` branch triggers.
   - In `isEntityIlluminated()`, return `false` if `this.battery <= 0`.
7. Fix `EndlessDescent.ts` & `FlagshipManager.ts`:
   - Remap ballast venting key to `[V]` (and 'v') so torpedo on `[C]` is never intercepted.
   - In `EndlessDescent.ts`, when hull stress returns to 0% (vented), restore `player.maxHp = 5`.
8. Fix `AutomatonShieldGrid.ts`:
   - Apply genuine damage to `drone.hp` on inductive backlash.
   - In `unregisterDrone()`, when an Aegis drone is destroyed by player, trigger resonant disruption / stun to neighbor linked drones.
9. Verification:
   - Run `npx tsc --noEmit`
   - Run `npx playwright test tests/unit/flagship_features.test.ts tests/20_flagship_12_features.spec.ts tests/adversarial_flagship_state_transitions.spec.ts`
   - Ensure all 3 test suites pass 100%!
10. Write handoff report to `/Users/user/src/water-invader/.agents/pitch_worker_remediation_1/handoff.md` and notify parent.

## 2026-09-10T06:18:33Z

You are pitch_worker_remediation_1, a teamwork_preview_worker.
Your working directory is: /Users/user/src/water-invader/.agents/pitch_worker_remediation_1.
Read your dispatch at /Users/user/src/water-invader/.agents/pitch_worker_remediation_1/DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement the 8 specific fixes requested by Challengers 1 & 2:
1. `CavitationTorpedo.ts`: Clamp enemy positions within [0, 600] x [0, 800] in `applyShockwave()`.
2. `HydraulicHarpoon.ts`: Clamp maximum displacement per frame, clamp velocity, clamp entity positions to [0, 600] x [0, 800], and sub-step if dt > 0.05s.
3. `OceanCurrent.ts`: Import `Faction` from `../types` cleanly.
4. `GameManager.ts`: Check `flagshipManager.checkRevive()` before calling `this.gameOver()`. If revive succeeds, restore player HP, set isDead = false, and do NOT transition to GAME_OVER.
5. `KrakenPrimeBoss.ts`: Handle totalHp <= 0 to trigger boss defeat, advance wave, spawn loot, and halt enrage breach. In Phase 2, deflect Core damage while maw is alive.
6. `BiolapseDarknessCycle.ts`: Turn off light when battery <= 0 so dynamo recharge can resume; require battery > 0 in `isEntityIlluminated()`.
7. `EndlessDescent.ts` & `FlagshipManager.ts`: Remap ballast venting to [V] ('v') so torpedo on [C] is never intercepted. Restore player.maxHp = 5 when stress is vented back to 0%.
8. `AutomatonShieldGrid.ts`: Apply genuine damage to drone.hp on backlash; trigger resonant disruption/stun to neighbor linked drones on Aegis drone death.

Verification:
- Run `npx tsc --noEmit`
- Run `npx playwright test tests/unit/flagship_features.test.ts tests/20_flagship_12_features.spec.ts tests/adversarial_flagship_state_transitions.spec.ts`
- Ensure all tests pass 100%!

Write your handoff report to /Users/user/src/water-invader/.agents/pitch_worker_remediation_1/handoff.md and notify parent when complete.

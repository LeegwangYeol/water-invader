# Dispatch for Orchestrator Gen 2 (orchestrator_pitch_impl_1_gen2)

**Timestamp**: 2026-09-10T15:18:10+09:00
**Parent Conversation ID**: c037a359-674f-4a38-8bdb-f0f0f4a727f7
**Predecessor Working Directory**: /Users/user/src/water-invader/.agents/orchestrator_pitch_impl_1

Resume work at `/Users/user/src/water-invader/.agents/orchestrator_pitch_impl_1_gen2`.
Read:
- `/Users/user/src/water-invader/.agents/orchestrator_pitch_impl_1/handoff.md`
- `/Users/user/src/water-invader/.agents/orchestrator_pitch_impl_1/BRIEFING.md`
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/.agents/orchestrator_pitch_impl_1/DISPATCH.md`
- `/Users/user/src/water-invader/.agents/orchestrator_pitch_impl_1/progress.md`
- `/Users/user/src/water-invader/.agents/orchestrator_pitch_impl_1/GATE_STATUS.md`
- `/Users/user/src/water-invader/IDEAS_PITCH.md`

Your parent is `c037a359-674f-4a38-8bdb-f0f0f4a727f7` — use this ID for all escalation and status reporting (`send_message`).

**Mission & Next Steps**:
1. Spawn a remediation worker (`teamwork_preview_worker`) to implement the 8 specific fixes identified by Challengers 1 & 2 in `handoff.md`:
   - `CavitationTorpedo.ts`: Radial impulse boundary clamping to [0, 600] x [0, 800].
   - `HydraulicHarpoon.ts`: Spring displacement clamping & 2x sub-stepping under high dt.
   - `OceanCurrent.ts`: Import `Faction` from `../../types`.
   - `GameManager.ts`: Check `flagshipManager.checkRevive()` before `this.gameOver()` to restore HP and cancel game-over transition.
   - `KrakenPrimeBoss.ts`: Death sequence when `totalHp <= 0`, invulnerable Core in Phase 2 until Maw destroyed.
   - `BiolapseDarknessCycle.ts`: Turn off searchlight on 0 battery; require `battery > 0` in `isEntityIlluminated()`.
   - `EndlessDescent.ts`: Remap ballast vent to `[V]` so torpedo on `[C]` is never hijacked; restore `maxHp` when stress vented.
   - `AutomatonShieldGrid.ts`: Apply true damage on backlash; trigger cascade disruption to neighbor drones when an Aegis drone dies.
2. Re-verify the gate (Reviewer/Challenger/Auditor) and update `GATE_STATUS.md` to PASS.
3. Spawn Git Deployment Worker to run `npm run build`, `npx playwright test`, commit changes, and push to `origin/master`.
4. Send completion message to parent (`c037a359-674f-4a38-8bdb-f0f0f4a727f7`).

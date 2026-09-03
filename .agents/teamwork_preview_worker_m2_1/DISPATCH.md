## 2026-08-31T09:29:47Z
Task Assignment: Milestone M2 — Emergency Waves & Crisis Events Director
Scope:
1. Update `src/game/types.ts`:
   - Add enum or type `CrisisType`: `'TITAN_HORDE'`, `'ACID_STORM'`, `'SWARM_BLITZ'`, `'EMP_DISRUPTION'`, `'TOTAL_WAR'`.
   - Add `CrisisState` interface tracking `activeCrisis: CrisisType | null`, `timer: number`, `duration: number`, `warningTimer: number`, `bannerText: string | null`, `hazardProjectiles?: Array<...>`, etc.
   - Add any needed state hooks/callbacks for UI (`onCrisisEvent?: (crisis: CrisisState | null) => void`).
2. Update `src/game/GameManager.ts`:
   - Implement `CrisisDirector` logic inside `GameManager`:
     - Starting from Stage 10 (`level >= 10`), on wave start or dynamically during waves (e.g., at specific intervals or on wave start with high probability/scripted rotation), trigger one of the 5 emergency crisis events:
       1. `TITAN_HORDE`: Spawns heavy boss dreadnought escorted by 4 Shielded and 4 Diver units.
       2. `ACID_STORM`: Environmental falling toxic projectile barrage across the screen requiring tactical dodging.
       3. `SWARM_BLITZ`: Coordinated high-speed pincer dive attacks with rapid movement.
       4. `EMP_DISRUPTION`: Temporary weapon suppression (player firing disabled/slowed for a brief window, e.g. 2-3s) with rapid hostile beam sweeps.
       5. `TOTAL_WAR`: Massive dual-flank chaotic clash between Invader and Rogue legions (spawns 10+ Invaders and 10+ Rogues clashing).
     - Full warning period (e.g., 2.0s warning before crisis hazard/spawns activate, triggering warning banner and siren sound).
     - Wave transition safety: all crisis units must be registered in `this.enemies` or `this.thirdFaction` with proper faction tagging (`Faction.INVADER` or `Faction.ROGUE`), ensuring `remainingHostiles === 0` cleanly advances wave without soft-locking.
3. Update `src/game/SoundManager.ts`:
   - Add procedural Web Audio synthesizer methods for crisis sirens and hazard sounds:
     - `playCrisisAlarm()` / `playThirdFactionWarning()`: Pulsing multi-tone emergency siren sound.
     - `playEmpDisruptionSound()`: Low-frequency electrical hum / static burst.
     - `playAcidStormSound()`: Sizzling / splashing hazard audio.
4. Update `src/components/game-canvas.tsx`:
   - Connect crisis state to the HUD overlay:
     - Full-screen animated HUD warning banner (e.g. red/amber pulsing border, "EMERGENCY CRISIS DETECTED: [EVENT NAME]", alert icons/flashing text).
     - Visual indicator for EMP suppression status if active.
5. Verification:
   - Run `npx tsc --noEmit` and `npm run build` to verify 0 errors.
   - Run existing Playwright test suites to ensure 0 regressions.

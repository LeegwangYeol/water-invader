# Claude Collaboration Guide: Water Invader

## Current Mission: Implementation & Verification in Progress
Massive Difficulty Rebalancing (Stage 10+) & Event Scripting Update:
- **R1. Extreme Difficulty Scaling (Stage 10+)**: [COMPLETED & VERIFIED]
  - Piecewise exponential HP, speed, projectile velocity, and attack tempo scaling implemented in `src/game/Enemy.ts` and `src/game/GameManager.ts`.
  - Waves 1–9 baseline preserved ($HP = 1 + \lfloor\text{level}/3\rfloor$).
  - Stage 10+ normal enemies scale to $11\sim 106\text{ HP}$, Bosses reach $362\sim 1112\text{ HP}$ escorted by minion fleets (Shielded, Snipers, Divers).
  - Elite projectiles deal 2 damage with rapid fire cooldowns ($0.8\sim 1.5\text{s}$) and multi-directional spread bursts.
- **R2. Emergency Waves & Crises**: [COMPLETED & VERIFIED]
  - `CrisisDirector` state machine in `GameManager.ts` supporting 5 distinct emergency crisis archetypes:
    1. *Titan Bio-Mech Escort Horde* (Boss + 4 Shielded + 4 Divers)
    2. *Toxic Acid Storm Hazard* (Falling environmental projectile barrage)
    3. *Swarm Diver Blitz* (High-speed coordinated dive-bombers)
    4. *EMP Overcharge Disruption* (Weapon suppression debuff + high-velocity enemy lasers)
    5. *3-Way Total War Incursion* (Massive 22-unit dual-flank crossfire clash)
  - Animated full-screen warning banners and Web Audio procedural multi-tone siren alarms (`playCrisisAlarm()`, `playEmpDisruptionSound()`, `playAcidStormSound()`).
- **R3. Data-Driven Balancing**: [COMPLETED & VERIFIED]
  - `scripts/simulate_balance.ts` (Headless Monte Carlo, 36,750 simulated runs) proving Waves 1–9 accessibility (82.4% win rate), Stage 10+ exponential threat (Novice 29.4% win rate, Boss 20 0.8%), Expert engagement (86.3%), and 100% mathematical winnability.
  - `scripts/run_benchmark.ts` (Playwright autonomous bot playtester) capturing live browser telemetry (FPS, DPS, hit ratio, survival duration).
- **R4. Automated Verification & Git Deployment**: [IN PROGRESS]
  - Playwright test suite expanded with `tests/12_extreme_difficulty_and_crises.spec.ts` (13 tests across 4 Tiers, 100% pass rate).
  - Maintained 100% pass rate across entire regression suite (402+ tests).
  - Strictly enforced `npm run build` and `npx tsc --noEmit` with 0 errors.
  - Remote Git push executing via Worker M5.

## Milestone Plan:
- **M1**: Extreme Difficulty Scaling Engine (`src/game/Enemy.ts`, `src/game/GameManager.ts`) — [DONE]
- **M2**: Emergency Waves & Crisis Events Director (`src/game/GameManager.ts`, `src/game/SoundManager.ts`, `src/components/game-canvas.tsx`) — [DONE]
- **M3**: Data-Driven Simulation Harness & Empirical Balancing (`scripts/simulate_balance.ts`, `scripts/run_benchmark.ts`) — [DONE]
- **M4**: E2E Test Suite Expansion & Hardening (`tests/12_extreme_difficulty_and_crises.spec.ts`) — [DONE]
- **M5**: 100% Verification, Production Build & Git Push (`npx tsc --noEmit`, `npm run build`, `npx playwright test`, `git commit & push`) — [IN PROGRESS]

## Collaboration Rules & Protocol:
- All changes adhere to Next.js guidelines and pre-commit verification checks.
- Detailed progress and gate checks are tracked in `.agents/teamwork_preview_orchestrator_rebalance_2/progress.md` and `PROJECT.md`.


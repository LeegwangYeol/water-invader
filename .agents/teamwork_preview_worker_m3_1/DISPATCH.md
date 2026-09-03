## 2026-08-31T09:46:42Z

Task Assignment: Milestone M3 — Data-Driven Simulation Harness & Empirical Balancing
Scope:
1. Create `scripts/simulate_balance.ts`:
   - Headless Monte Carlo mathematical combat balance simulation script.
   - Simulates combat exchanges between a player (testing baseline, mid-tier, and max-upgraded player configurations: damage, fire rate, multi-shot, shield, drone allies) and enemy waves (Stage 1 through Stage 20+, including Stage 10+ exponential scaling, boss escort formations, and crisis events).
   - Gathers detailed statistical metrics:
     - Win rates per stage across skill profiles (Novice, Average, Expert).
     - Player DPS output vs Enemy Total HP pool and time-to-clear.
     - Incoming Enemy DPS and Player EHP depletion rate.
     - Probability of survival under extreme crisis events (Titan Horde, Acid Storm, Swarm Blitz, EMP Disruption, Total War).
   - Generates formatted statistical tables and outputs balance summaries proving that:
     - Waves 1–9 remain accessible and rewarding for standard progression.
     - Stage 10+ poses a severe, legitimate mathematical threat to a max-upgrade player (low novice win rate, challenging expert win rate 40%–70%).
     - All stages remain mathematically winnable.
2. Create/Update `scripts/run_benchmark.ts`:
   - Browser-based autonomous Playwright bot playtester that launches the actual Next.js application, executes automated gameplay across waves, logs real-time combat telemetry (DPS, frame rates, hit ratios, crisis triggers, wave clear times), and outputs structured JSON/Markdown reports.
3. Verification:
   - Run both simulation scripts and verify they execute cleanly and produce empirical balance logs.
   - Run `npx tsc --noEmit` and `npm run build` to verify zero build or type errors.

# BRIEFING — 2026-08-31T19:08:30+09:00

## Mission
Milestone M3: Data-Driven Simulation Harness & Empirical Balancing for Water Invader Next.js Project.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m3_1
- Original parent: c4cd9241-cfaa-4000-94c3-6c5941894621
- Milestone: M3 (Data-Driven Simulation Harness & Empirical Balancing)

## 🔒 Key Constraints
- Genuine, mathematically sound Monte Carlo and browser-based benchmark harness.
- No hardcoded test results, facade logic, or shortcuts.
- Mandatory strict pre-commit rule: ALWAYS verify `npm run build` and `npx tsc --noEmit` pass with zero errors.

## Current Parent
- Conversation ID: c4cd9241-cfaa-4000-94c3-6c5941894621
- Updated: 2026-08-31T19:08:30+09:00

## Task Summary
- **What to build**:
  1. `scripts/simulate_balance.ts`: Headless Monte Carlo mathematical combat balance simulation script modeling time-stepped ($dt=0.05s$) combat exchanges across 20 stages and 5 emergency crises for Novice, Average, and Expert profiles.
  2. `scripts/run_benchmark.ts`: Browser-based autonomous Playwright bot playtester logging comprehensive real-time combat telemetry (DPS, frame rates, hit ratios, crisis triggers/survival, wave clear times, death causes) with formatted JSON and Markdown reports.
- **Success criteria**:
  - Accessible onboarding waves 1–9 ($Win \ge 75\%$).
  - Stage 10+ exponential scaling and crisis lethal threat ($Win < 35\%$ for novices).
  - 100% of stages mathematically winnable.
  - Zero build or type errors (`npx tsc --noEmit` and `npm run build`).
  - 402/402 Playwright tests passing.

## Change Tracker
- **Files modified/created**:
  - `scripts/simulate_balance.ts`: Complete headless Monte Carlo simulation script.
  - `scripts/run_benchmark.ts`: Upgraded browser-based autonomous playtester and statistical engine.
  - `test-artifacts/balance_simulation_report.json`: Monte Carlo balance dataset across 36,750 runs.
  - `test-artifacts/balance_simulation_report.md`: Markdown summary table and balance proofs.
  - `test-artifacts/benchmark_report.json`: Real-time Playwright bot telemetry dataset.
  - `test-artifacts/benchmark_report.md`: Real-time bot performance summary table.
- **Build status**: PASS (`npm run build` & `npx tsc --noEmit`).
- **Test status**: 402/402 passing (`npx playwright test`).

## Quality Status
- **Build/test result**: All passing. Zero errors.
- **Lint/Typecheck**: Clean.

## Loaded Skills
- **Source**: `/Users/user/.gemini/config/skills/auto-playtest-balancer/SKILL.md`
- **Local copy**: `.agents/teamwork_preview_worker_m3_1/auto-playtest-balancer-skill.md`
- **Core methodology**: Autonomous playtest balancing, error log parsing, win rate modeling, iterative tuning.

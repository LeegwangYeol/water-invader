# Project: Water Invader Endless Survival Stress Test

## Architecture
The Endless Survival Stress Test infrastructure employs a Dual-Tier Hybrid Swarm architecture designed for zero-latency in-browser bot intelligence, automated economy/skill optimization, and multi-process concurrency endurance:

`
[Swarm Orchestration Layer]
 ├── scripts/run_swarm_endurance.ts (Multi-Worker Concurrent Headless Browser Pool)
 └── tests/stress/endless_survival_swarm.spec.ts (Standard Playwright Multi-Worker Spec)
         │
         ▼
[Browser Runtime & In-Page Engine Layer (tests/stress/swarm_bot_engine.ts)]
 ├── Perception: 60 FPS hook on window.gameManager (Player, Enemies, Bullets, Barricades, Economy)
 ├── 1D Potential Field Solver: Bullet TTI, Barricade Shadowing (Stone/Ice), Diver Intercept
 ├── Combat Controller: Continuous Fire, Ultimate (E) at 100%, Ally (Q) Summon at >=50 💧 
 └── Economy Auto-Buyer: Fire Rate (50💧) -> Multi-Shot (100💧 up to 5-spread) -> Piercing (200💧)
         │
         ▼
[Telemetry & Telemetry Monitor Layer (tests/stress/telemetry_stress_collector.ts)]
 ├── Performance: FPS (Avg/Min/1% Low), JS Heap Memory (used/total), Web Audio Active Nodes
 ├── Entities: Bullet count, Particle count, Enemy count, Wave level
 └── Anomaly Watchdog: Janks (>50ms frames), NaN Coordinates, Unhandled Errors
         │
         ▼
[Artifacts & Reporting]
 ├── test-artifacts/stress_results.json (540k lines time-series dataset)
 └── reports/ENDLESS_SURVIVAL_STRESS_TEST_REPORT.md (448 lines comprehensive report)
`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 1D Potential Field Evasion | Zero-latency 16ms raymarching evasion with barricade shadow occlusion & diver alert | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Automated Combat & Skills (E/Q) | Continuous fire, Ultimate Heavy Rain (E) at 100%, Ally Summon (Q) at 50+💧 | M1 | ORIGINAL_REQUEST §R1 |
| 3 | In-Game Shop Upgrade Automation | Auto-spending Pure Water on Fire Rate (50💧), 5-Spread Multi-Shot (100💧), Piercing (200💧) | M1 | ORIGINAL_REQUEST §R2 |
| 4 | Real-Time Telemetry & Metric Engine | FPS, JS Heap memory, Web Audio node tracking, entity counts, kill & wave analytics | M2 | ORIGINAL_REQUEST §R3 |
| 5 | Anomaly & Leak Watchdog | Detection of memory growth slopes, frame drops (<30 FPS), projectile overload, crashes | M2 | ORIGINAL_REQUEST §R3 |
| 6 | Playwright Multi-Worker Test Suite | Standard Playwright test specification supporting parallel worker execution | M3 | ORIGINAL_REQUEST §R3 |
| 7 | Swarm Endurance CLI Runner | Standalone multi-process/multi-context endurance runner for deep wave stress | M3 | ORIGINAL_REQUEST §R3 |
| 8 | Deep Wave Endurance Execution | Multi-worker live execution reaching deep waves with maxed weapon stats | M4 | ORIGINAL_REQUEST §Verification |
| 9 | Forensic Integrity Verification | Forensic audit ensuring authentic execution without mocks, hardcoding, or cheats | M5 | ORIGINAL_REQUEST §Verification |
| 10 | Final Comprehensive Stress Report | Detailed Markdown report with test architecture, run metrics, bugs, and analysis | M5 | ORIGINAL_REQUEST §Verification |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| 1 | Bot Engine & Auto-Upgrades | 	ests/stress/swarm_bot_engine.ts (Evasion, Combat, E/Q Skills, Shop Auto-Buy) | none | DONE |
| 2 | Telemetry & Anomaly Collector | 	ests/stress/telemetry_stress_collector.ts (FPS, Heap, Audio, Entity metrics) | M1 | DONE |
| 3 | Swarm Harness & Test Runners | 	ests/stress/endless_survival_swarm.spec.ts & scripts/run_swarm_endurance.ts | M1, M2 | DONE |
| 4 | Deep Wave Swarm Stress Run | Multi-worker parallel endurance execution, telemetry data collection | M3 | DONE |
| 5 | Forensic Audit & Final Report | Audit verification & eports/ENDLESS_SURVIVAL_STRESS_TEST_REPORT.md generation | M4 | DONE |

## Interface Contracts
### swarm_bot_engine.ts ↔ window.gameManager
- window.gameManager.player: { position, hp, ultimateGauge, baseFireRate, multiShot, piercing, isMovingLeft, isMovingRight, isShooting }
- window.gameManager.currency: number
- window.gameManager.triggerUltimate(): void
- window.gameManager.triggerSummonAlly(): void
- window.gameManager.upgradeFireRate(): void
- window.gameManager.upgradeMultiShot(): void
- window.gameManager.upgradePiercing(): void

### 	elemetry_stress_collector.ts ↔ Test Runners
- ttachTelemetry(page: Page): Promise<void>
- getTelemetrySnapshot(page: Page): Promise<TelemetrySnapshot>
- exportStressMetrics(results: TelemetrySnapshot[]): StressReportData

## Code Layout
- 	ests/stress/swarm_bot_engine.ts — Core in-page bot decision engine and action dispatcher
- 	ests/stress/telemetry_stress_collector.ts — Performance, memory, audio, entity, and anomaly tracker
- 	ests/stress/endless_survival_swarm.spec.ts — Playwright multi-worker test suite
- scripts/run_swarm_endurance.ts — Standalone multi-worker concurrent endurance runner
- eports/ENDLESS_SURVIVAL_STRESS_TEST_REPORT.md — Final comprehensive stress testing report
- 	est-artifacts/stress_results.json — Time-series telemetry benchmark dataset
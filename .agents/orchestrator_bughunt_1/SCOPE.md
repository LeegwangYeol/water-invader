# Scope: Comprehensive 30+ Agent Testing & Bug-Hunting Swarm

## Architecture & Systems Under Test
- **Game Engine & Core Loop**: `src/game/GameManager.ts` (3-layer rendering, wave spawning, combat resolutions, screen shake, audio synthesis, state machine)
- **12 End-Game Crisis Archetypes**: `src/game/crisis/` (`types.ts`, `DimensionalRift.ts`, `CrisisSovereign.ts`, `EndGameCrisis.ts`)
- **Allied Reinforcements Subsystem**: `src/game/crisis/AlliedReinforcements.ts` (Aegis Vanguard Command Dreadnought, twin heavy plasma cannons, point-defense grid, nano-shield aura, escort interceptors)
- **Enemy AI & Physics**: `src/game/Enemy.ts`, `src/game/Bullet.ts`, `src/game/Player.ts`
- **Responsive UI & Canvas Layout**: `src/components/game-canvas.tsx`, `src/components/mobile-controls.tsx`, `src/components/game-overlay.tsx`
- **Automated Test Suites**: `tests/unit/`, `tests/stress/`, `tests/*.spec.ts`

## Testing Tracks & Agent Allocations (Target: 30+ Agents Total)

| Track | Focus Area | Subagent Roles | Target Invariants & Stress Objectives |
|-------|------------|----------------|---------------------------------------|
| **Track A** | Wave, Boss & 12 Crisis Mechanics | Explorers & Challengers | Test all 12 crisis archetypes, phase transitions (1->2->3->Defeat), 5,200 EHP invariant, anchor respawn/despawn, enrage timers, boss HUD |
| **Track B** | Allied Reinforcements Systems | Explorers & Challengers | Test Aegis Vanguard Dreadnought arrival, point-defense laser grid interception, restorative nano-shield aura (+1 HP / 5s), escort interceptor formation, warp exit |
| **Track C** | Physics, Collision & Friendly-Fire | Explorers & Challengers | Test line-of-sight raycasting, enemy ally blocking, projectile collision bounds, bullet clipping, edge wall bouncing, bounding box anomalies |
| **Track D** | UI, Canvas & Multi-Viewport | Explorers & Challengers | Test canvas scaling, mobile viewports (375x667, 390x844, 412x915), desktop viewports (1440x900, 1920x1080), warning backgrounds, HUD contrast |
| **Track E** | Audio, Particle System & Heap Leak | Explorers & Challengers | Test particle caps, Web Audio procedural synthesis under load, WebGL/Canvas2D 60 FPS stability, memory leak and heap explosion prevention |
| **Track F** | Edge Cases, Inputs & State Machine | Explorers & Challengers | Test rapid pause/unpause, shop modal transitions, game over / victory resets, combo counters, negative score handling, multi-touch input hysteresis |
| **Track G** | Defect Remediation & Verification | Workers, Reviewers, Challengers, Forensic Auditor | Fix identified defects, implement regression tests, verify zero console errors, pass `tsc`, `npm run build`, and `npx playwright test` |

## Gate Criteria
1. Full test execution confirms 0 game-breaking crashes or unhandled rejections.
2. Build checks (`npx tsc --noEmit` and `npm run build`) pass cleanly with 0 errors.
3. Full Playwright E2E test suite passes cleanly with 0 failures.
4. Reviewer verdicts: APPROVE.
5. Forensic Auditor verdict: CLEAN.

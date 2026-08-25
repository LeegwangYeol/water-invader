# Project: Water Invader Comprehensive QA Sweep and Auto-fix

## Architecture
```
[Water Invader Application Architecture]
├── src/
│   ├── components/
│   │   ├── game-canvas.tsx (Canvas setup, React UI overlays: MENU, PLAYING, SHOP, GAME_OVER, Modal controls)
│   │   └── ui/ (Tailwind / Lucide UI icons & buttons)
│   ├── game/
│   │   ├── Entity.ts (Base AABB bounding box, collision math)
│   │   ├── GameManager.ts (Game loop, state machine, wave spawner, collision resolution, economy & upgrades, skills)
│   │   ├── Player.ts (Ship position, HP, speed, fire rate, multi-shot, piercing, ultimate gauge, combo)
│   │   ├── Enemy.ts (7 enemy types, movement, evasion, diving, shooting, hit flashes)
│   │   ├── Bullet.ts (Player & enemy projectiles, piercing counters, entity hit tracking)
│   │   ├── Barricade.ts (Destructible ice voxel grid & indestructible stone barriers)
│   │   ├── Helper.ts (Allies: Fighter, Repairer, Tank)
│   │   ├── Particle.ts (Visual effects, splash, spark, explosions, object pooling)
│   │   └── SoundManager.ts (Web Audio synthesis oscillators and gain nodes)
│   └── types.ts (Game state, upgrade types, enemy types)
└── tests/
    ├── stress/
    │   ├── swarm_bot_engine.ts (1D Potential Field Evasion, Threat Targeter, Auto-Shop, Skill Invoker)
    │   ├── telemetry_stress_collector.ts (FPS, Heap, Web Audio nodes, Anomaly Watchdog)
    │   ├── endless_survival_swarm.spec.ts (Multi-worker Playwright endurance bot suite)
    │   └── qa_harvest_verification.spec.ts (16-defect verification suite)
    └── ...
```

## Feature Inventory & QA Bug Matrix
| # | Defect / Feature | Category | Location | Assigned Milestone | Status | Source |
|---|---|---|---|---|---|---|
| 1 | E-01: Splitter Mini2 Stuck at Left Wall | Enemy Physics | `GameManager.ts`, `Enemy.ts` | M1 | DONE (PASSED) | Survey (Explorer 1) |
| 2 | E-02: Diver Enemy Missing in `spawnWave()` | Spawning / Dead Code | `GameManager.ts` | M1 | DONE (PASSED) | Survey (Explorer 1) |
| 3 | E-04: Zigzag Enemy Missing Y-Descent | Enemy Movement | `Enemy.ts` | M1 | DONE (PASSED) | Survey (Explorer 1) |
| 4 | E-05: Diver Dive Speed Too Slow | Enemy Movement | `Enemy.ts` | M1 | DONE (PASSED) | Survey (Explorer 1) |
| 5 | E-06: Wave Grid Scaling Unbounded | Wave Engine | `GameManager.ts` | M1 | DONE (PASSED) | Survey (Explorer 1) |
| 6 | E-07: Enemy Penetrates Stone Barricades / Gnawing | Physics / Barricades | `GameManager.ts`, `Enemy.ts` | M1 | DONE (PASSED) | Survey (Explorer 1) |
| 7 | E-08: Player Ramming Boss Causes 0-Dmg Instakill | Combat / Balance | `GameManager.ts` | M1 | DONE (PASSED) | Survey (Explorer 1) |
| 8 | S-01: Fire Rate Max Upgrade Infinite Currency Drain | Shop / Economy | `GameManager.ts` | M2-3 | DONE (PASSED) | Survey (Explorer 2) |
| 9 | S-02: React Upgrades State Desync | UI / React State | `game-canvas.tsx` | M2-3 | DONE (PASSED) | Survey (Explorer 2) |
| 10 | S-03: Q/E Skills Activated During Non-Playing States | UI / Controls | `game-canvas.tsx`, `GameManager.ts` | M2-3 | DONE (PASSED) | Survey (Explorer 2) |
| 11 | S-04: Piercing Cap Discrepancy (UI 5 vs Engine 99) | Shop / Economy | `GameManager.ts` | M2-3 | DONE (PASSED) | Survey (Explorer 2) |
| 12 | S-05: Duplicate Shop JSX in Canvas Component | Code Quality / UI | `game-canvas.tsx` | M2-3 | DONE (PASSED) | Survey (Explorer 2) |
| 13 | G-01: Piercing Bullets Multi-Hit / Frame Depletion | Weapon Collision | `Bullet.ts`, `GameManager.ts` | M2-3 | DONE (PASSED) | Survey (Explorer 3) |
| 14 | G-02: Modal Open/Close Resets Active Game Session | UX / Lifecycle | `game-canvas.tsx` | M2-3 | DONE (PASSED) | Survey (Explorer 3) |
| 15 | G-03: Barricade Gnawing Movement Throttle | Enemy Physics | `Enemy.ts`, `GameManager.ts` | M1 | DONE (PASSED) | Survey (Explorer 3) |
| 16 | G-04: Particle System Pooling Optimization | Memory / Performance | `Particle.ts`, `GameManager.ts` | M2-3 | DONE (PASSED) | Survey (Explorer 3) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| 0 | Comprehensive QA Bot Sweep | Playwright bot multi-run gameplay & anomaly harvesting | none | DONE |
| 1 | Enemy Physics & Movement Fixes | E-01, E-02, E-04, E-05, E-06, E-07, E-08, G-03 in `Enemy.ts`, `GameManager.ts` | M0 | DONE |
| 2-3 | Shop, UI, Piercing & Performance Fixes | S-01~S-05, G-01, G-02, G-04 in `game-canvas.tsx`, `GameManager.ts`, `Bullet.ts`, `Particle.ts` | M1 | DONE |
| 4 | Final E2E Verification & Build | Playwright multi-worker stress run + full test suite + `npm run build` | M2-3 | DONE |
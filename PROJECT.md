# Project: Water Invader QA & Stress Testing

## Architecture & Logic Overview
```text
Water Invader System Architecture
├── Frontend & UI Layer (Next.js 15 / React 19 / Canvas 2D)
│   ├── src/components/game-canvas.tsx (Canvas container, HUD, mobile controls, ALLY(Q) button)
│   └── src/app/page.tsx (Page layout and canvas mounting)
├── Core Game Engine
│   ├── src/game/GameManager.ts (Main game loop, wave spawning, collision detection, state machine)
│   ├── src/game/Player.ts (Player state, Cute Droplet vector renderer, stress/suppression)
│   ├── src/game/Enemy.ts (7 enemy classes, vector renderers, diving/splitting/aiming behaviors)
│   ├── src/game/Bullet.ts (Player droplet projectiles, sniper interceptable bullets, boss bullets)
│   ├── src/game/Barricade.ts (Destructible & indestructible shields, HP blocks)
│   └── src/game/Helper.ts (Allied fighters, repairers, tanks)
└── QA & Testing Track
    ├── Automated Test Suite (Playwright/Puppeteer E2E scripts)
    ├── Chrome DevTools MCP Live Interactive Testing (Real-time evaluation, screenshots)
    └── Autopilot Live Stress & Multi-Wave Survival Harness
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | ALLY(Q) Button & Summoning | Q-key and touch button triggering friendly helper reinforcement (50 Pure Water cost) | M1 | Survey |
| 2 | Player Droplet Vector Art | Procedural Bezier curve cute water droplet with dynamic eyes, radial gradients, and damage states | M1 | Survey |
| 3 | Enemy Vector Graphics | 7 enemy types rendered entirely via 2D Canvas vector paths (Orange tentacles, Purple triangles, Red teardrops, etc.) | M1 | Survey |
| 4 | Barricade Slow Down Mechanic | Enemies moving through barricades must suffer speed reduction | M2 | Survey |
| 5 | Diver Crash & Explosion | Diver enemy accelerates 15x downwards on alignment and explodes on barricade dealing 20 dmg | M2 | Survey |
| 6 | Splitter Enemy Mechanics | Moves slowly (speed 50/10) and splits into 2 small (20x20) mini-enemies on death | M2 | Survey |
| 7 | Sniper Bullet Interception | Player droplet bullets can intercept and destroy enemy sniper projectiles | M2 | Survey |
| 8 | Playwright/Puppeteer E2E Test Suite | Automated end-to-end test scripts verifying game load, controls, score, and state | M3 | Survey |
| 9 | Chrome DevTools Live MCP Testing | Interactive live play, screenshot capture, and DOM/Canvas inspection on deployed site | M3 | Survey |
| 10 | Multi-Wave Stress & Boss Survival | Autopilot survival across waves 1-5+ to observe Diver, Sniper, Splitter, and Boss | M4 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | UI & Vector Visuals QA (R1) | Verify ALLY(Q) button, player droplet rendering, and 7 enemy vector graphics | None | IN_PROGRESS |
| M2 | Mechanics & Physics QA (R2) | Test barricade slowdown, Diver crash explosion, Splitter slow movement, bullet interception | M1 | PLANNED |
| M3 | Automated Test Suite (R3) | Playwright/Puppeteer test script creation & execution against live & local app | M1 | PLANNED |
| M4 | Live Multi-Wave Survival & Stress (R3) | Chrome DevTools live play across Waves 1-5+, verifying live spawns of Divers, Snipers, Boss | M2, M3 | PLANNED |
| M5 | Multi-Review, Challenger & Forensic Audit | 2 Reviewers, 2 Challengers, and Forensic Integrity Auditor gate check | M4 | PLANNED |

## Interface & Test Contracts
- Target Live Deployed URL: `https://water-invader.vercel.app/`
- Target Local Codebase: `C:\src\SpaceInvader`
- Game State Interface: `window.gameManager` (exposes player, enemies, bullets, barricades, helpers, wave/level, currency)

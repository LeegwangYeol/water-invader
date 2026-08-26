# Project: Water Invader — 3-Way Battle System & Dynamic Reinforcements

## Architecture
- **Framework**: Next.js 16.3.1 (App Router), React 19.2.8, Tailwind CSS v4, TypeScript 5
- **Game Engine**: HTML5 Canvas 2D with procedural vector graphics & bioluminescent aquatic rendering, Web Audio API procedural synthesis, 60 FPS requestAnimationFrame loop
- **State Machine**: Menu -> Playing (Wave & Reinforcements Loop) -> Shop (Inter-wave Upgrades) -> Game Over
- **Multi-Faction Architecture**:
  - `Faction.PLAYER`: Player ship (Pristine Water Droplet `#38bdf8`) and summoned Helpers (Fighter, Repairer, Tank).
  - `Faction.INVADER`: Toxic Sea Invaders (Bioluminescent Octopus `#f97316`, Coral Bio-Mech Titan `#dc2626`/`#f43f5e`, Electric Deep-Sea Angler `#a855f7`, Toxic Piranha Diver `#ef4444`/`#f59e0b`, Crystal Armored Turtle `#06b6d4`, Toxic Anemone `#22c55e`).
  - `Faction.ROGUE`: Cybernetic Marine Raiders (Cyber Jellyfish Drone `#84cc16`/`#a3e635`, Abyssal Stalker Ray `#10b981`/`#f59e0b`, Heavy Coral Dreadnought `#eab308`/`#84cc16`).
  - **Collision Matrix**: Projectile of Faction A damages and collides with any Entity of Faction B if `A !== B`.
  - **Dynamic Event Director**: Replaces static grid wave spawning with procedural formations, flank incursions, unpredictable rogue drops, and adaptive pacing.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Faction Enum & Entity Tagging | Define `Faction` enum (`PLAYER`, `INVADER`, `ROGUE`) on `Entity`, `Enemy`, `Helper`, `Bullet` | M1 | Survey |
| 2 | Multi-Faction Projectile Model | Bullets carry `faction`, unique vector rendering (Cyan/Orange/Neon Lime), and backward-compatible `isPlayerBullet` getter | M1 | Survey |
| 3 | 3-Way Collision & Combat Resolution | Bullets damage any entity of different faction (`A !== B`), support crossfire bullet interception, scoring, and particles | M1 | Survey |
| 4 | Audio Synthesis for 3rd Faction & Crossfire | Web Audio API synthesizers: `playThirdFactionWarning()`, `playRogueShoot()`, `playCrossfireHit()` | M1 | Survey |
| 5 | Rogue Unit Archetypes & Vector Art | Implement Rogue Drone, Rogue Stalker, and Rogue Mech with neon lime/amber procedural silhouettes and thrusters | M2 | Survey |
| 6 | 3-Way Dynamic AI & Dual-Targeting | Rogue units identify and attack closest/highest-threat targets among both Player/Helpers and Invaders | M2 | Survey |
| 7 | Dynamic Formations Engine | Procedural wave entries: V-formation spearheads, flank incursions (left/right), and dual-flank pincer spawns | M3 | Survey |
| 8 | Unpredictable Mid-Wave Incursions | Procedural mid-combat reinforcement drops (Rogue airdrops, Invader surprise flanks) based on battle tempo | M3 | Survey |
| 9 | Multi-Faction Wave Clear Logic | Wave clears only when both hostile factions (Invaders + Rogues) are completely eliminated | M3 | Survey |
| 10 | Multi-Faction HUD Indicators | Top HUD display showing active counts for both Invader and Rogue factions alongside Player status | M4 | Survey |
| 11 | Incursion Alert Banners & Alerts | Animated fullscreen warning banners for 3rd Faction Incursion and 3-Way Crossfire | M4 | Survey |
| 12 | How to Play Modal Update | Updated modal explaining 3-Way Battlefield dynamics, crossfire tactics, and rogue faction behaviors | M4 | Survey |
| 13 | E2E Opaque-Box Test Suite (Tiers 1-4) | Comprehensive Playwright test suite covering all multi-faction and dynamic spawn features | M_TEST | Dual Track |
| 14 | 100% E2E Verification & Tier 5 Hardening | Full integration pass and adversarial stress/edge-case verification | M5 | Final Milestone |
| 15 | Vibrant Aquatic/Deep-Sea Visual Overhaul | Colorful, vivid bioluminescent vector palettes & animated aquatic geometry (replacing dull/black shapes) | M2, M4 | User Update |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M_TEST | E2E Testing Suite | Comprehensive test suite (Tiers 1-4) published to `TEST_READY.md` | None | DONE |
| M1 | Faction & Combat Core | `Faction` enum, `Entity`/`Bullet` tagging, 3-way collision matrix, crossfire scoring, audio synthesis | None | DONE |
| M2 | Third Faction Units & AI + Aquatic Art | Rogue Drone/Stalker/Mech classes, dual-target AI, vibrant aquatic vector art for all enemies | M1 | DONE |
| M3 | Dynamic Reinforcements Engine | Dynamic formation generator, unpredictable mid-wave incursions, wave clear conditions | M1, M2 | DONE |
| M4 | UI/HUD & Visual Feedback | Multi-faction threat badges, warning banners, updated How-to-Play modal | M1, M2, M3 | DONE |
| M5 | 100% E2E Test Pass & Hardening | Verify 100% pass on Tiers 1-4 E2E tests, followed by Tier 5 adversarial hardening | M_TEST, M1, M2, M3, M4 | DONE |

## Code Layout
- `src/game/types.ts`: `Faction`, `EnemyType`, `GameState`, `Vector2D`, `Size`, `Rect`
- `src/game/Entity.ts`: Base entity class with `faction`
- `src/game/Bullet.ts`: Multi-faction bullet styling, damage, piercing, and hit tracking
- `src/game/Enemy.ts`: Standard Invaders + Rogue unit implementations with vibrant aquatic/bioluminescent rendering
- `src/game/GameManager.ts`: Game loop, multi-faction collision coordinator, dynamic reinforcement director, wave state
- `src/game/SoundManager.ts`: Procedural Web Audio synthesizers (Rogue lasers, alert sirens, crossfire clashes)
- `src/components/game-canvas.tsx`: React HUD overlay (threat counters, badges, alert banners, modal updates)
- `tests/05_three_way_battle.spec.ts`: E2E opaque-box test suite for 3-way battle & dynamic reinforcements
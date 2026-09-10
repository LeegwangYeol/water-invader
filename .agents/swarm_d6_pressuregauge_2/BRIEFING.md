# BRIEFING — 2026-09-10T00:51:00Z

## Mission
Produce an exceptionally detailed feature proposal for Claustrophobic Depth Pressure Gauge & Hull Stress FX for "Water Invader".

## 🔒 My Identity
- Archetype: explorer
- Roles: Specialist 6.2 - Claustrophobic Depth Pressure Gauge & Hull Stress FX
- Working directory: /Users/user/src/water-invader/.agents/swarm_d6_pressuregauge_2/
- Original parent: 8b89e85c-18d5-413c-8630-b672c8d75bba
- Milestone: Creative Brainstorming Swarm (Specialist 6.2)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- DO NOT MODIFY ANY SOURCE CODE (.ts, .tsx, .css).
- DO NOT RUN BUILDS, TESTS, OR GIT COMMANDS.

## Current Parent
- Conversation ID: 8b89e85c-18d5-413c-8630-b672c8d75bba
- Updated: 2026-09-10T00:51:00Z

## Investigation State
- **Explored paths**:
  - `src/game/GameManager.ts` (Dynamic Biome cycle, Layer 1/2/3 render loop, logicalWidth=600, logicalHeight=800, threat vignette pipeline)
  - `src/game/Player.ts` (hp, maxHp, stressLevel, suppressionLevel, invincibilityTimer)
  - `src/game/SoundManager.ts` (Procedural Web Audio API architecture, oscillator nodes, envelopes)
  - `src/game/types.ts` (BiomeTheme, ThreatState, CrisisState)
  - `src/components/game-canvas.tsx` (Canvas mounting, React HUD overlay, ShopUpgradePanel)
  - `.agents/ORIGINAL_REQUEST.md` & `COLLABORATION.md`
- **Key findings**:
  - Player ship already has `stressLevel` (0-100) and `hp` (up to 5) tracking in `Player.ts`.
  - Game already has a 5-tier biome progression cycling every 10 stages (`Math.floor((level - 1) / 10)`).
  - Canvas rendering in `GameManager.draw()` cleanly separates Layer 1 (Static Background), Layer 2 (World Entities + Screen Shake), and Layer 3 (Stable Foreground & HUD).
  - Web Audio API is 100% procedural with zero external audio assets.
  - Zero GC allocation can be preserved by pre-allocating droplet and crack geometry.
  - High-contrast rules (WCAG 2.1 AAA $\ge 7:1$) are maintained by restricting severe effects to outer 15% screen perimeter and keeping 1.5px black strokes on projectiles.
- **Unexplored areas**:
  - Exact sensory balancing of audio decibels across different mobile speaker hardware.

## Key Decisions Made
- Framed the screen as a reinforced quartz bathysphere viewport.
- Designed a 2nd-order damped harmonic oscillator for analog brass needle physics.
- Designed procedural corner micro-fractures scaling strictly with player HP loss.
- Designed procedural Web Audio API topology for metal groans, rivet pings, steam vents, and adrenaline heartbeat.
- Structured proposal into 6 comprehensive sections in `report.md`.

## Artifact Index
- `DISPATCH.md` — Task dispatch log
- `BRIEFING.md` — Persistent working memory
- `progress.md` — Execution status heartbeat
- `report.md` — Exhaustive feature proposal and architecture blueprint
- `handoff.md` — 5-component handoff report

# BRIEFING — 2026-09-17T04:55:00Z

## Mission
Investigate physics and coordinate logic for player submarine and hydrothermal vent updrafts, pinpointing the ceiling-pin bug and designing ballast restoration and vent clearing mechanics.

## 🔒 My Identity
- Archetype: explorer
- Roles: Teamwork explorer
- Working directory: /Users/user/src/water-invader/.agents/buoyancy_exp_physics_1
- Original parent: bd5b0c5d-7349-4270-bc7f-be21cf043787
- Milestone: buoyancy_physics_investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify any source code files
- Wait for explicit user approval before proceeding with implementation
- Communicate with Claude via Rule Guide (Markdown) / COLLABORATION.md

## Current Parent
- Conversation ID: bd5b0c5d-7349-4270-bc7f-be21cf043787
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/game/Player.ts` (lines 1-458): Verified constructor Y baseline (740), update loop (horizontal only), clamping, zero vertical velocity handling.
  - `src/game/flagship/environment/HydrothermalVent.ts` (lines 1-625): Analyzed 3 vent states (DORMANT, CHARGING, ERUPTING), conical plume equations ($R_{core}$, $R_{halo}$), upward lift formula (`Math.max(capY + 30, y - lift)`), Steam Lance transformation, bullet counter-buoyancy, and core DoT.
  - `src/game/flagship/environment/OceanCurrent.ts` (lines 1-241): Confirmed player immunity to current drag (`entity.faction === Faction.PLAYER`).
  - `src/game/GameManager.ts`: Verified input mapping, lifecycle resets, update execution order (`player.update()` then `flagshipManager.update()`).
  - `src/game/flagship/factions/KrakenPrimeBoss.ts`: Confirmed vortex pull to $y \ge 220$.
  - `src/game/crisis/EndGameCrisis.ts`: Checked Biomorphic Swarm downward spore creep.
  - Regression test suites: `tests/playtest_stream_b_vents_currents.spec.ts`, `tests/stress/bughunt_physics_adversarial_stress.spec.ts`, `tests/unit/gamestate_edgecases_audit.test.ts`, `tests/unit/flagship_adversarial_physics_stress.test.ts`.
- **Key findings**:
  - Root cause: Plume halo broadens to $R_{halo} = 133.9\text{ px}$ at cap ($y=130$), covering $84.7\%$ screen width across both chimneys with an overlap band. Lift force ($160\text{ px/s}$) continues unchecked up to $y=130$, and `Player.ts` has zero downward ballast/gravity restoring force. Once lifted, player remains permanently elevated at $y=130$.
  - Sensitive test invariant: Unit tests (`SCENARIO-3.1`, `DEFECT-C2`) test coordinate clamping at $(0, 0)$ and $(-500, \dots)$, expecting unprimed vessels at $y=0$ to stay $y=0$. Ballast restoration must be primed when buoyant forces act on the player (or active gameplay displacement).
  - Tapered lift + lateral dispersion model: Diminishing lift ratio ($y \in [130, 220]$) and radial dispersion ($80 \sim 120\text{ px/s}$) near the cap naturally clears the submarine without breaking Steam Lances or mid-depth tests.
- **Unexplored areas**: None. Exploration complete.

## Key Decisions Made
- Formulated a dual-layer organic architecture:
  1. Layer 1 (`Player.ts`): Hydrodynamic ballast restoration to baseline depth `740` with `isBallastActive` primed flag.
  2. Layer 2 (`HydrothermalVent.ts`): Plume cap convective dissipation & lateral radial ejection in $[130, 220]$ transition band.

## Artifact Index
- handoff.md — Comprehensive 5-component physics exploration report
- progress.md — Liveness heartbeat and milestone progress
- DISPATCH.md — Initial dispatch log

# BRIEFING — 2026-09-10T14:43:00+09:00

## Mission
Implement Feature 4 (Hydrothermal Vents & Ocean Currents) and Feature 5 (Biolapse Darkness Cycle & Photonic Searchlight) for Water Invader Flagship Systems.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/pitch_worker_stream_b_environment
- Original parent: 825a4037-5803-4947-8e62-404f0b0d33b5
- Milestone: Swarm Phase 1 — Stream B: Environmental Dynamics & Lighting Systems

## 🔒 Key Constraints
- Logical coordinate bounds: 600 x 800.
- Implement full `IFlagshipSubsystem` interface (`init`, `update`, `drawBackground`, `drawWorld`, `drawForeground`, `handleInput`, `reset`).
- Zero external assets (all procedural Canvas 2D gradients, composite operations for lighting masks, and particle columns).
- Verify type safety with `npx tsc --noEmit`.
- Write handoff report to `/Users/user/src/water-invader/.agents/pitch_worker_stream_b_environment/handoff.md`.
- Exclusive write ownership:
  - `src/game/flagship/environment/HydrothermalVent.ts`
  - `src/game/flagship/environment/OceanCurrent.ts`
  - `src/game/flagship/environment/BiolapseDarknessCycle.ts`
  - `src/game/flagship/environment/index.ts`
- MANDATORY INTEGRITY: No cheat implementations, no dummy facade stubs, genuine math and mechanics.

## Current Parent
- Conversation ID: 825a4037-5803-4947-8e62-404f0b0d33b5
- Updated: 2026-09-10T14:43:00+09:00

## Task Summary
- **What to build**:
  1. `OceanCurrent.ts`: Completed. Stratified horizontal shear currents (+75 px/s East / -60 px/s West, shelf boundary 400px with 80px smooth sinusoidal transition band), hydrodynamic drag for player, enemies, and bullets. Procedural streamlines and shear vortices.
  2. `HydrothermalVent.ts`: Completed. Seabed mineral chimneys projecting conical 380°C plumes ($R_{\text{core}}(y) = 22 + (760-y) \cdot 0.08$, $R_{\text{halo}} = 1.85 \cdot R_{\text{core}}$), enemy heat DoT ($28 + 0.06 \cdot \text{MaxHP}$), player bullet steam lances (+35% dmg, +1 pierce, -680px/s), hostile bullet counter-buoyancy ($a_y = -520\text{ px/s}^2$) and vaporization after 0.35s, cooling halo, 12s eruption cycle ejecting 3-6 polymetallic nodules (+15 water).
  3. `BiolapseDarknessCycle.ts`: Completed. 4-phase day/night cycle (Diurnal 60s, Twilight 5s, Midnight 25s, Dawn 5s), ambient lux math ($1.0 \to 0.0 \to 1.0$), directional prow searchlight cone with inertial tilt (-90° ± 15°), battery drain (-4 U/s, High-beam -10 U/s) and kinetic hydro-dynamo recharge (+3 U/s moving, +1.2 U/s idle), photonic flash shock stun ($0.8\text{ s}$ stun, +25% vulnerability for 3s), unlit bioluminescent predator camouflage (+35% dive speed, ocular photophore dots, homing missile lock blocking), active sonar ping (4s reveal).
  4. `index.ts`: Completed. Re-exports and unified `EnvironmentSubsystem` implementing `IFlagshipSubsystem`.
- **Success criteria**: Genuine complete implementations with math matching specifications, satisfying `IHydrothermalVentManager`, `IBiolapseManager`, and `IFlagshipSubsystem`, passing `npx tsc --noEmit`.
- **Interface contracts**: `/Users/user/src/water-invader/src/game/flagship/types.ts`
- **Code layout**: `src/game/flagship/environment/*`

## Key Decisions Made
- Deterministic time-budgeted state machine updates in `HydrothermalVent` and `BiolapseDarknessCycle` ensuring exact phase progression across both 60 FPS tick rates and arbitrary timesteps.
- Non-compounding flag `__steamLance` on transformed bullets ensuring single application of damage and pierce bonuses.
- Direct Canvas 2D destination-out compositing for searchlight cone and tactile submarine hull aura, layered with volumetric light rays and atmospheric particulate motes.

## Change Tracker
- **Files modified**:
  - `src/game/flagship/environment/OceanCurrent.ts`: Implemented `OceanCurrent` conforming to `IOceanCurrent`.
  - `src/game/flagship/environment/HydrothermalVent.ts`: Implemented `HydrothermalVent` and `HydrothermalVentManager` conforming to `IHydrothermalVent`, `IHydrothermalVentManager`, and `IFlagshipSubsystem`.
  - `src/game/flagship/environment/BiolapseDarknessCycle.ts`: Implemented `BiolapseDarknessCycle` conforming to `IBiolapseManager` and `IFlagshipSubsystem`.
  - `src/game/flagship/environment/index.ts`: Unified barrel exports and `EnvironmentSubsystem`.
- **Build status**: `npx tsc --noEmit` PASS (Exit Code 0).
- **Pending issues**: None. All requirements satisfied and verified.

## Quality Status
- **Build/test result**: PASS. Complete unit and behavioral simulation passing.
- **Lint status**: 0 violations.
- **Tests added/modified**: Verified via end-to-end multi-frame simulation in node environment.

## Loaded Skills
None loaded for this stream.

## Artifact Index
- `BRIEFING.md` — Agent working memory
- `DISPATCH.md` — Dispatch directives
- `progress.md` — Liveness heartbeat
- `handoff.md` — Comprehensive 5-component handoff report

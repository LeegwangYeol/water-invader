## 2026-09-17T08:12:47Z

# Mission & Context
The user has requested a comprehensive, codebase-wide audit and remediation of all physical/mechanical edge cases in the Water Invader game physics engine.
Explicit user approval has been granted ("승인").

- Working Directory: /Users/user/src/water-invader/.agents/orchestrator_physics_audit_1
- Workspace Root: /Users/user/src/water-invader
- Original Request File: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
- Requested Team: Use a very large team of agents (100+ agents) across specialized streams (explorers, spec-miners, test-writers, implementers, reviewers, and challengers).

# Requirements

### R1. Comprehensive Physics Edge-Case Audit
Thoroughly inspect all subsystems (GameManager.ts, Player.ts, weapons, environments, factions, and boss mechanics) for physics vulnerabilities. Look for scenarios where players or entities can get permanently stuck, escape the 600x800 logical boundary, reach infinite/NaN velocity, experience input lockouts, or suffer from unrecoverable states.
Follow the 5 streams outlined in COLLABORATION.md:
1. Stream A: Player Kinematics & Ballast Subsystem (Player.ts, ModularChassis.ts, controls, baseline depth settling, boundary collision).
2. Stream B: Environmental Dynamics & Hazard Fields (HydrothermalVent.ts, OceanCurrent.ts, Whirlpool.ts, TectonicRift.ts, multi-hazard superposition, vortex trapping).
3. Stream C: Weapons, Projectiles & Collision CCD (Projectile.ts, HomingMissile.ts, BioLaser.ts, Harpoon.ts, CryoMine.ts, continuous collision tunneling, zero-distance division by zero).
4. Stream D: Factions, Swarms & Boss Mechanics (Enemy.ts, ApexPredator.ts, KrakenBoss.ts, DreadnoughtBoss.ts, AncientMech.ts, AlliedVessel.ts, flocking pincer singularities, boss multi-segment physics).
5. Stream E: Game Loop, Time Scaling & State Transitions (GameManager.ts, ShopOverlay.tsx, CrisisManager.ts, delta-t clamping, lag spikes, resurrection coordinates).

### R2. Robust Remediation
Fix any identified physics errors organically. All fixes must preserve the core game mechanics, invariants (logicalWidth = 600, logicalHeight = 800), and existing expected behaviors without relying on arbitrary teleportation.

# Acceptance Criteria
- For every physics error or vulnerability discovered, a new Playwright automated test MUST be written that specifically reproduces the issue.
- The new tests must verify that the applied fix successfully resolves the vulnerability without side effects.
- Running npx playwright test passes 100% of all existing regression tests and all newly created bugfix tests.
- Running npx tsc --noEmit and npm run build exits with 0 errors.
- Independent reviewing agent (or team of reviewers) confirms that all fixes feel natural from a player's perspective with no frustration, entrapment, or unrecoverable states.

# Critical Constraints
- NEVER modify logicalWidth = 600 or logicalHeight = 800 in GameManager.ts, Player.ts, or Enemy.ts. Viewport adaptations must remain CSS-only.
- Maintain progress.md and BRIEFING.md continuously in your working directory.
- When all streams, remediations, tests, and build checks are complete, report completion to the Sentinel so independent victory audit can be triggered.

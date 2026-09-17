# Scope: Comprehensive Physics Engine Edge-Case Audit & Remediation

## Architecture
- Platform: Next.js 16 (App Router), React 19, HTML5 2D Canvas, Web Audio API, Playwright E2E.
- Strict Invariants: `logicalWidth = 600`, `logicalHeight = 800` strictly maintained across all subsystems.
- All fixes must be organic hydrodynamic calculations, no synthetic teleports or clip snapping.

## Feature & Vulnerability Inventory
| # | Stream | Component | Vulnerability / Edge Case | Root Cause & File |
|---|--------|-----------|---------------------------|-------------------|
| 1 | Stream A | ModularChassis | Hitbox switch boundary penetration | `ModularChassis.ts:415-417`: Width changes 38->64px without coordinate clamping, pushing ship past 600px |
| 2 | Stream A | Player Ballast | Instantaneous snapping when y > targetY | `Player.ts:101-108`: Asymmetric `else` branch snaps position.y = targetY in one frame |
| 3 | Stream A | Player Respawn | Hardcoded respawn coordinates | `GameManager.ts:310, 620`: Hardcodes 275, 740 ignoring modular chassis hitboxes and baselineY |
| 4 | Stream A | Hadal / Modular | Speed stat overwrite by Bio-Horrors | `ModularChassis.ts:415` & `HadalBioHorrors.ts:324`: Faction resets `player.speed = player.baseSpeed \|\| 300` |
| 5 | Stream A | Controls | Input lockout on state transition | `GameManager.ts:2942`: Buffered keys during SHOP/CONTINUE not synchronized on entering PLAYING |
| 6 | Stream A | HydraulicHarpoon | Derivative velocity spike on teleport | `HydraulicHarpoon.ts:236`: Unclamped finite difference (dx/dt) spikes to >16,000 px/s |
| 7 | Stream B | HydrothermalVent | Unbounded lateral dispersion | `HydrothermalVent.ts:255`: Plume pushes player past canvasWidth (x > 550) without clamping |
| 8 | Stream B | GameManager / Vent | Vent physics unpaused in Shop state | `GameManager.ts:1705`: `flagshipManager.update()` runs during `GameState.SHOP`, lifting player to y=130 |
| 9 | Stream B | Vent Manager | Central vent overlap stagnation well | `HydrothermalVentManager.ts`: Left/right vent forces cancel laterally at x=300, y=130, trapping player |
| 10 | Stream B | Boss / Vent | Kraken Prime vs Vent ceiling conflict | `HydrothermalVent.ts:244` (min y=130) vs `KrakenPrimeBoss.ts:412` (min y=220) creates 60px positional flicker |
| 11 | Stream B | EndGameCrisis | Rift gravitational force boundary leak | `EndGameCrisis.ts:322`: Rift pull lacks canvas edge containment clamping |
| 12 | Stream B/E | GameManager | Fixed timestep accumulator NaN poisoning | `GameManager.ts:1215`: Unchecked frameTime allows NaN to permanently freeze accumulator simulation |
| 13 | Stream C | Weapons / Enemy | Immortal zombie enemies & wave lock | `BioluminescentLaser.ts`, `CavitationTorpedo.ts`, `Enemy.ts`: `takeDamage()` does not set `isDead = true` when hp <= 0 |
| 14 | Stream C | HydraulicHarpoon | Continuous collision tunneling at high speed | `HydraulicHarpoon.ts:287`: Single point-in-rect check tunnels through thin enemies at 650 px/s |
| 15 | Stream C/D | Kraken Boss | Dead code / type mismatch in missile swat | `KrakenPrimeBoss.ts:357`: Checks `b.isHoming` instead of `instanceof HomingMissile` |
| 16 | Stream D | Enemy Flocking | Friendly-fire avoidance lockstep singularity | `Enemy.ts:1030`: `selfCenterX <= allyCenterX` symmetric tie causes permanent overlap and fire suppression |
| 17 | Stream D | Kraken Boss | IK tentacle accordion crumple singularity | `KrakenPrimeBoss.ts:96`: `atan2(0,0)=0` causes 0 <-> pi accordion folding when target is close |
| 18 | Stream D | Kraken Boss | Phase 2 Maw inhalation unrecoverable pin lock | `KrakenPrimeBoss.ts:406`: Upward pull overpowers downward player movement when slowed |
| 19 | Stream D | Kraken Boss | Phase 3 breach charge boundary teleport pop | `KrakenPrimeBoss.ts:452`: Snapping from x=550 to x=420 causes 130px visual pop |
| 20 | Stream D | Hadal Bio-Horrors | Broodmother unbounded velocity multiplication | `HadalBioHorrors.ts:565`: Velocity multiplied by 1.3 every 14s without speed cap |
| 21 | Stream D | Allied Vessels | Helper vessel Y-axis drift without clamping | `Helper.ts`: Missing top/bottom containment boundaries |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Survey & Architecture Mapping | Survey all subsystems across Streams A-E | None | DONE |
| M1 | Playwright Reproduction Test Suite | Author comprehensive headless reproducer test suite `tests/physics_edgecase_comprehensive.spec.ts` reproducing all vulnerabilities | M0 | IN_PROGRESS |
| M2 | Organic Physics Remediation | Fix all 21 vulnerabilities in `Player.ts`, `ModularChassis.ts`, `HydrothermalVent*.ts`, `Enemy.ts`, `HydraulicHarpoon.ts`, `KrakenPrimeBoss.ts`, `GameManager.ts`, etc. | M1 | PLANNED |
| M3 | Verification & Review | Challenger stress tests, Reviewer confirmation of natural hydrodynamic feel, zero entrapment | M2 | PLANNED |
| M4 | Full Regression & Build Check | `npx playwright test` (100% passing) + `npx tsc --noEmit` & `npm run build` | M3 | PLANNED |
| M5 | Forensic Integrity & Victory Audit | Independent auditor verification of authentic implementation and zero cheating | M4 | PLANNED |

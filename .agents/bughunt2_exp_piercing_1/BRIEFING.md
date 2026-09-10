# BRIEFING — 2026-09-09T02:52:30Z

## Mission
Investigate enemy piercing damage scaling, late-game wave math, CCD integration, bullet damage application, and numeric edge cases across Enemy.ts, Bullet.ts, GameManager.ts, and tests.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Investigator, Synthesizer
- Working directory: /Users/user/src/water-invader/.agents/bughunt2_exp_piercing_1
- Original parent: 17c9b6c2-8167-4601-83eb-a48bc12725ca
- Milestone: bughunt2_piercing_and_late_game_wave_math

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- NEVER recommend modifying logicalWidth or logicalHeight in GameManager.ts or Enemy.ts
- Write only to /Users/user/src/water-invader/.agents/bughunt2_exp_piercing_1/
- Follow Handoff Protocol (5 sections: Observation, Logic Chain, Caveats, Conclusion, Verification Method)
- Communicate with Claude via COLLABORATION.md rules

## Current Parent
- Conversation ID: 17c9b6c2-8167-4601-83eb-a48bc12725ca
- Updated: 2026-09-09T02:48:16Z

## Investigation State
- **Explored paths**: `src/game/Enemy.ts`, `src/game/Bullet.ts`, `src/game/GameManager.ts`, `src/game/Entity.ts`, `src/game/Barricade.ts`, `src/game/Helper.ts`, `src/game/crisis/EndGameCrisis.ts`, `tests/enemy_piercing_damage_scaling.spec.ts`, `tests/adversarial_challenger_m2_piercing_stress.spec.ts`, `tests/adversarial_math_physics_m1_m2_c2.spec.ts`, `tests/stress/challenger_piercing_particle_empirical.spec.ts`
- **Key findings**:
  1. `getPiercingMultiplier()` is disconnected dead code not applied in `Enemy.fire()`.
  2. `getPiercingCount()` disagrees with `Enemy.fire()` for Rogue Elites (Stalker, Phantom, Carrier spawned with piercing=1).
  3. Hostile piercing bullets unconditionally terminate on Helper Drones (never penetrate allies).
  4. Multiple bullets in the same frame hit destroyed 0-HP barricades, wasting piercing on phantom barriers.
  5. Divers shoot bullets before diving despite design intent.
  6. Zigzag and Diver horizontal speeds scale unbounded into late waves (Wave 50, 100+).
  7. Wave 20+ Elite 3-damage projectiles cause abrupt instant death on 3-HP base player.
  8. Swept CCD lacks `swept1` vs `swept2` opposing projectile collision check.
- **Unexplored areas**: Complete for scope.

## Key Decisions Made
- Comprehensive 5-section report written to `handoff.md`.
- Formulated specific line-numbered fix strategies for implementers.

## Artifact Index
- DISPATCH.md — Dispatch log
- BRIEFING.md — Persistent context & memory
- progress.md — Liveness heartbeat
- handoff.md — Final investigation report

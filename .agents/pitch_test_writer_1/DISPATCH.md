# Dispatch for pitch_test_writer_1

**Role**: Flagship E2E & Unit Test Writer
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_test_writer_1
**Task**: Author comprehensive Playwright E2E and unit test suites covering all 12 Flagship Features.

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All tests must be genuine verification tests. DO NOT hardcode trivial passes. A teamwork_preview_auditor will independently verify your work.

**Inputs**:
- `/Users/user/src/water-invader/IDEAS_PITCH.md`
- `/Users/user/src/water-invader/src/game/flagship/`
- `/Users/user/src/water-invader/.agents/pitch_worker_integration_1/handoff.md`

**Write Ownership**:
- `tests/20_flagship_12_features.spec.ts` (Playwright E2E tests)
- `tests/unit/flagship_features.test.ts` (Unit simulation tests)

**Requirements**:
Write tests that verify:
1. Cavitation Torpedo: suction well pull, shockwave detonation, bullet vaporization, double-tap trigger.
2. Bioluminescent Laser & Prisms: hitscan raycast, heat accumulation, sweet-spot boost, overheat lockout, prism fan splitting.
3. Hydraulic Harpoon: tether physics, winch reel-in, whip damage, slingshot catapult eject, shock combo.
4. Hydrothermal Vents & Currents: conical plume radius, player bullet steam lance upgrade, bullet counter-buoyancy, current shear drift.
5. Biolapse Darkness Cycle: day/night phase transitions, searchlight cone orientation & battery drain, flash shock stun.
6. Modular Submersible Chassis: 5 hull archetypes, stat radar profile calculations, active chassis passives.
7. Veteran Crew Synergy Deck: 4 officers, passives, manual cooldown activations, resonance combos.
8. Mutating Bio-Horrors: 5 horror types, kinetic/missile/pierce damage mitigation adaptations.
9. Automaton Shield Phalanx: Aegis drone barrier, distance-linked shield grid, 40% dampening, backlash vulnerability.
10. Apex Boss (Kraken Prime): multi-part 12,000 EHP, 8 tentacles IK, vortex pull, gullet weakpoint, ink blackout.
11. Roguelike Endless Mode: depth scaling 0m->11,000m, DAG generation, hydrostatic pressure ballast purge ('C'), boons draft.
12. Sonar/Hydrophone UI: radar sweep line, contact echo blooms, 16-band hydrophone FFT visualization, hull stress fractures.

Run the tests using `npx playwright test` to ensure they execute and pass cleanly.
Write your handoff report to `/Users/user/src/water-invader/.agents/pitch_test_writer_1/handoff.md`.

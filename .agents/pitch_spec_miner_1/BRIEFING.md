# BRIEFING — 2026-09-10T14:32:30+09:00

## Mission
Deep specification mining, mathematical modeling, state machine design, and TypeScript interface contracts for Features 1-6 (Cavitation Torpedo, Prism Laser, Hydraulic Harpoon, Hydrothermal Vents, Biolapse Darkness Cycle, Modular Submersible Chassis).

## 🔒 My Identity
- Archetype: teamwork_preview_spec_miner
- Roles: Weapons & Environment Spec Miner
- Working directory: /Users/user/src/water-invader/.agents/pitch_spec_miner_1
- Original parent: 825a4037-5803-4947-8e62-404f0b0d33b5
- Milestone: Phase 0 Deep Spec Mining

## 🔒 Key Constraints
- Specification mining only — do NOT implement or modify source code files in src/.
- Core Game Dimensions: logicalWidth (600/720) and logicalHeight (800/960) in GameManager.ts and Enemy.ts must NEVER be modified.
- Full interface enumeration, mathematical formulas, state models, edge cases, and TypeScript contracts for Features 1-6.
- Handoff report in .agents/pitch_spec_miner_1/handoff.md with 5 components (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
- Send message back to parent agent upon completion.

## Current Parent
- Conversation ID: 825a4037-5803-4947-8e62-404f0b0d33b5
- Updated: 2026-09-10T14:32:30+09:00

## Task Summary
- **What to build**: Comprehensive specification and interface design for Features 1-6 (Weapons & Environments & Hull Chassis).
- **Success criteria**: Exhaustive math formulas, state machines, TypeScript definitions, edge cases table, and feature inventory tables matching authoritative specs (IDEAS_PITCH.md, src/game/ codebase).
- **Interface contracts**: handoff.md containing complete TypeScript contracts ready for implementation agents.
- **Code layout**: src/game/ engine architecture.

## Key Decisions Made
- Fully ground all systems in the 600x800 logical canvas frame and 1/60s fixed timestep in GameManager.ts.
- Feature 1: Model Cavitation Torpedo as a two-stage implosion (negative pressure vacuum pull G*M=85,000 px^3/s^2, followed by hyperbaric acoustic blast r=150px, 120-300 damage with bullet vaporization).
- Feature 2: Model Prism Laser as hitscan raycast (20 ticks/s, 16-48 DPS) with thermodynamic heat engine (80-99 HU supercharge +25% DPS, 100 HU lockout 2.2s) and deployable quartz prisms (190% cumulative power).
- Feature 3: Model Hydraulic Harpoon with damped harmonic non-linear spring (k_s=95 N/px, L_max=420px), winch motor (240 px/s), centripetal whip (60-140 slam dmg), slingshot catapult (180 kinetic dmg), and electrical conductivity.
- Feature 4: Model Hydrothermal Vents with Gaussian thermal core (380°C, 28 + 6% maxHp DoT to enemies), convective cooling halo (+250% weapon heat dissipation), updraft steam lances (+35% dmg, +1 pierce), and periodic mineral buffs.
- Feature 5: Model Biolapse Darkness with 4-phase state machine (60s/5s/25s/5s), dynamic prow headlight cone (440px range at 100% battery, -4 U/s), photonic flash stun (0.8s), and active sonar integration.
- Feature 6: Model Modular Chassis with 6-axis radar framework, mapping authoritative specs (Nautilus Dreadnought / Ironclad, Stingray Interceptor / Deep Recon, Kraken Bioship / Bio-Symbiont, Leviathan Harvester, Ghost Stealth Sub).
- Discovered & cataloged 9 companion features from the Deep-Sea Compendium (Cryo Mines, Electric Eel, Micro-Drones, Depth Charges, Ocean Currents, Sonar Blackout, Toxic Blooms, Whirlpools, Tectonic Rifts).

## Artifact Index
- /Users/user/src/water-invader/.agents/pitch_spec_miner_1/DISPATCH.md — Dispatch assignment and history
- /Users/user/src/water-invader/.agents/pitch_spec_miner_1/progress.md — Liveness and progress heartbeat (COMPLETED)
- /Users/user/src/water-invader/.agents/pitch_spec_miner_1/handoff.md — Final authoritative specification & contracts report

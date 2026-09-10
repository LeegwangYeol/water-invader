# BRIEFING — 2026-09-10T14:33:00Z

## Mission
Deep specification mining and interface design for Features 7-12 (Crew Deck, Bio-Horror Faction, Automaton Shield Phalanx, Apex Bosses, Roguelike Endless Mode, Sonar/Hydrophone UI) for the Water Invader overhaul pitch.

## 🔒 My Identity
- Archetype: teamwork_preview_spec_miner
- Roles: Factions & Systems Spec Miner
- Working directory: /Users/user/src/water-invader/.agents/pitch_spec_miner_2
- Original parent: 825a4037-5803-4947-8e62-404f0b0d33b5
- Milestone: M1 Pitch Specification Mining (Features 7-12)

## 🔒 Key Constraints
- Read-only on codebase: Discover and document features; do NOT implement anything in game code.
- Wait for explicit user approval before proceeding with implementation.
- Communicate with Claude via COLLABORATION.md if applicable.
- Write handoff report with 5 components to `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md`.
- Maintain heartbeat in `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/progress.md`.

## Current Parent
- Conversation ID: 825a4037-5803-4947-8e62-404f0b0d33b5
- Updated: not yet

## Task Summary
- **What to build**: Detailed specification, mathematical formulas, state machine design, and TypeScript interface contracts for Features 7-12.
- **Success criteria**: Complete mathematical formulas for depth scaling/reactive evolution/interlocking shields, state machines for bosses & sonar sweeps, comprehensive TypeScript types matching existing engine idioms.
- **Interface contracts**: `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md`
- **Code layout**: `src/game/` (engine, entities, types), `src/components/` (UI, overlays, canvas)

## Key Decisions Made
- Anchored all physics formulas and entity bounding boxes to the strict $600 \times 800$ logical coordinate space.
- Formulated the Epigenetic Mutation Engine with a strict 40% damage resistance ceiling and single-adaptation-per-echelon rule to prevent unwinnable scenarios.
- Modeled the Automaton Phalanx Shield Grid with Euclidean distance coupling ($d \le 160\text{px}$) and Inductive Resonant Backlash to create dramatic chain-reaction vulnerability moments.
- Structured Apex Bosses with multi-component hierarchical hitbox trees and 12,000 EHP pools matching the late-game Crisis balance framework.
- Designed the Endless Descent mode around a bathymetric DAG map (200m to 11,000m+) and hydrostatic pressure gauge that degrades Max HP containers until vented.
- Designed the Sonar/Hydrophone suite as a contrast-first middle canvas layer with Web Audio FFT waterfall analysis operating asynchronously without impacting 60 FPS performance.
- Completed comprehensive 5-component handoff report at `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md`.

## Artifact Index
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/DISPATCH.md` — Dispatch log and history
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/handoff.md` — Final 5-component handoff report
- `/Users/user/src/water-invader/.agents/pitch_spec_miner_2/progress.md` — Liveness heartbeat & task tracking

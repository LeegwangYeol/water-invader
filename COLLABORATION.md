# Claude Collaboration Guide: Water Invader

## Current Mission: Full Implementation of 12 Flagship Features (40+ Agent Swarm)

### Objective & Scope
Deploy a massive swarm of agents (40+ agents) to implement ALL 12 Flagship Features detailed in `IDEAS_PITCH.md` into the Next.js "Water Invader" codebase:
1. **Cavitation Torpedo** (Weapon)
2. **Prism Laser** (Weapon)
3. **Hydraulic Harpoon** (Weapon)
4. **Hydrothermal Vents** (Hazard)
5. **Biolapse Darkness Cycle** (Hazard)
6. **Modular Submersible Chassis** (Player Progression)
7. **Veteran Crew Synergy Deck** (Player Progression)
8. **Mutating Bio-Horror Faction** (Enemy Faction)
9. **Automaton Shield Phalanx** (Enemy Faction)
10. **Apex Bosses** (Boss Encounters)
11. **Roguelike Endless Mode** (Game Mode)
12. **Sonar/Hydrophone UI** (UI/UX & Audio)

### Key Constraints & Architecture Rules
- **Core Game Dimensions**: `logicalWidth` (600/720) and `logicalHeight` (800/960) in `GameManager.ts` and `Enemy.ts` MUST NOT be changed. All responsive adjustments must be strictly CSS-based.
- **Pre-Approved Execution**: User explicitly authorized full implementation ("전부 구현해야지...", "승인", "Proceed"). Proceed one-stop without blocking at approval gates.
- **Quality & Pre-Commit Verification**: Run `npm run build` and `npx playwright test` to verify zero regression. Code must compile without errors before commit and push.
- **Git Sync**: Upon unanimous verification of all systems, commit changes and push to `origin/master`.

---

### Execution Milestones
- **Phase 0: Deep Codebase & Pitch Architecture Survey**:
  - Analyze existing game systems (`GameManager.ts`, `Player.ts`, `Enemy.ts`, `Weapon.ts`, UI overlay components).
  - Map modular integration points for each of the 12 features.
- **Phase 1: Subsystem Implementation Swarm (Parallel Modules)**:
  - Stream A: Advanced Arsenal (Cavitation Torpedo, Prism Laser, Hydraulic Harpoon).
  - Stream B: Environmental Dynamics (Hydrothermal Vents, Biolapse Darkness Cycle).
  - Stream C: Fleet Customization (Modular Chassis, Crew Synergy Deck).
  - Stream D: Adversary Overhaul (Mutating Bio-Horrors, Automaton Phalanx, Apex Bosses).
  - Stream E: Modes & Sensory Feedback (Roguelike Endless Mode, Sonar/Hydrophone UI).
- **Phase 2: Game Loop Integration & Balance**:
  - Integrate all systems into `GameManager.ts` and UI overlays without breaking coordinate math or loop timing.
- **Phase 3: Automated Testing & Adversarial Review**:
  - Unit tests and Playwright E2E suites verifying all 12 systems.
  - Pre-commit build check (`npm run build`).
- **Phase 4: Independent Victory Audit & Git Deployment**:
  - Independent verification before commit and push to remote.

---

### Current Status
- Sentinel: Active
- Active Orchestrator: `orchestrator_pitch_impl_1` (spawning)
- User Approval: Pre-approved ("전부 구현해야지 새끼야", "승인", "Proceed")
- Route: General (`teamwork_preview_orchestrator`)

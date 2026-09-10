# Claude Collaboration Guide: Water Invader

## Current Mission: Live QA Playtesting & Visual Inspection of 12 Flagship Features (30+ Agent Swarm)

### Objective & Scope
Deploy a massive swarm of agents (30+ agents) for extensive manual QA playtesting, visual inspection, and runtime error/layout verification of the newly implemented 12 Flagship Features using browser automation and Chrome DevTools troubleshooting tools:
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

### Key Requirements & Constraints
- **R1: Deep Visual & Interactive Playtesting**: Start Next.js dev server, connect via browser automation / Chrome DevTools, actively play and trigger all 12 flagship features, observe visual rendering and interactive physics.
- **R2: Runtime Error & Layout Verification**: Monitor browser console for warnings, memory leaks, unhandled exceptions; verify CSS responsiveness and canvas integrity (logical 600x800 canvas must not be clipped or distorted).
- **R3: Automated Remediation**: If bugs, console errors, or desyncs are detected, fix them in the codebase, verify in browser, test with `npm run build` and `npx playwright test`, then push to `origin/master`.
- **Architectural Rules**: NEVER modify `logicalWidth` (600) or `logicalHeight` (800) in `GameManager.ts` or `Enemy.ts`. Responsive layout must remain CSS-only.
- **Pre-Approved Execution**: User prompt status is "Launched". Pre-approved for playtesting, bug hunting, remediation, and git push.

---

### Execution Milestones
- **Phase 1: Test Server Setup & DevTools Connection**:
  - Launch Next.js dev server on available port.
  - Connect headless/automated browser sessions with console logging enabled.
- **Phase 2: Live Playtesting & Visual Inspection Swarm (Parallel Streams)**:
  - Stream A: Weapon & Projectile Physics (Torpedo, Prism Laser, Harpoon).
  - Stream B: Environmental Hazards & Darkness Cycles (Vents, Biolapse).
  - Stream C: Fleet Customization & Synergies (Modular Chassis, Crew Deck).
  - Stream D: Adversary Factions & Boss Mechanics (Bio-Horrors, Phalanx, Apex Bosses).
  - Stream E: Modes, Audio & Sensory Feedback (Endless Mode, Sonar UI, WebAudio).
  - Stream F: Layout, Viewports & Responsiveness (Desktop, Mobile, Tablet viewports).
- **Phase 3: Automated Remediation & Regression Testing**:
  - Fix any discovered bugs, console warnings, or memory leak sources.
  - Run full test suite (`npm run build` and `npx playwright test`).
- **Phase 4: Reporting & Remote Deployment**:
  - Generate comprehensive playtest report (`QA_REPORT.md`).
  - Git commit and push to `origin/master`.
- **Phase 5: Independent Victory Audit**:
  - Verification by independent auditor before sentinel declares completion.

---

### Current Status
- Sentinel: Active
- Orchestrator: Spawning `orchestrator_qa_playtest_1`
- Route: General (`teamwork_preview_orchestrator`)
- Team Size: 30+ agent swarm


# Claude Collaboration Guide: Water Invader

## Current Mission: Total Codebase Inspection ("총검사") & Hardening (100+ Agent Swarm)

### 1. Objective & Background
Execute a comprehensive, codebase-wide Total Inspection ("총검사"). Deploy a massive team of 100+ specialized agents (QA, Security, Architecture) to exhaustively inspect every file, module, and subsystem across the codebase (`GameManager.ts`, `Player.ts`, weapons, environments, factions, boss mechanics, UI, audio, rendering, and test suites).
The objective is to identify any past physical or logical errors, architecture flaws, memory leaks, performance bottlenecks, or edge cases, and apply robust remediation to permanently harden the system against repeat mistakes.

---

### 2. Architectural Invariants & Core Constraints
- **Canvas Invariants**: Strictly preserve `logicalWidth = 600` and `logicalHeight = 800` in `GameManager.ts`, `Player.ts`, and `Enemy.ts`. All responsive layout adjustments must remain CSS-only.
- **Organic Remediation & Hardening**: Fixes must preserve existing expected gameplay behaviors, hydrodynamic physics, and balance without synthetic hacks or arbitrary clipping/teleportation.
- **Permanent Regression Prevention**: For every error or vulnerability identified, an automated test MUST be created or updated to permanently prevent regressions.
- **Zero Regressions**: 100% of existing and newly created Playwright tests (`npx playwright test`) must pass.
- **Build Quality**: `npx tsc --noEmit` and `npm run build` must exit with 0 errors.
- **Pre-commit / Pre-push Verification**: Always verify build before git operations.

---

### 3. Comprehensive Subsystem Audit Matrix (100+ Agent Swarm Decomposition)
To satisfy the requested 100+ agent swarm, the inspection is decomposed into specialized streams:
1. **QA Stream**: Exhaustive edge cases, input transitions, state synchronization, physics entrapment, and automated Playwright coverage across all subsystems.
2. **Security & Boundary Stream**: Boundary violation prevention, NaN/Infinity math defense, state corruption defense, resource leak prevention, and input sanitization.
3. **Architecture & Reliability Stream**: Game loop stability, memory lifecycle (DOM/Audio/Canvas listeners), state recovery, weapon/faction modularity, and build pipeline health.

---

### 4. Verification & Acceptance Protocol
1. **Automated Reproduction & Regression Tests**:
   - Automated tests for all discovered issues permanently preventing regressions.
   - 100% pass rate on `npx playwright test`.
2. **Build Verification**:
   - `npx tsc --noEmit` and `npm run build` pass with 0 errors.
3. **Independent Review & Audit (Agent-as-Judge)**:
   - Independent reviewing agent confirms fixes are correct and natural.
   - Security/architecture auditor confirms system is robust and free of repeat mistakes.
4. **Mandatory Post-Victory Audit**:
   - Sentinel spawns independent `teamwork_preview_victory_auditor` to audit timeline, test integrity, and anti-cheating compliance before reporting completion.

---

### 5. Current Status & Active Operations
- **Status**: Milestone M6 (Final Verification, Build, Test Suite & Push) COMPLETE — Total Codebase Inspection ("총검사") 100% SUCCESS
- **Trigger**: "총검사" (Total Codebase Inspection & Hardening Swarm)
- **Active Orchestrator**: `.agents/orchestrator_total_inspection_1`
- **Milestone Verification Summary**:
  1. **M1 (Core Physics & Kinematics)**: REMEDIATED & VERIFIED (Player velocity synchronization, dormant vent lift removal, boss slingshot damage, boundary containment clamp).
  2. **M2 (Security, CCD & Math Defense)**: REMEDIATED & VERIFIED (NaN/Infinity guards, Liang-Barsky swept AABB and torpedo CCD, 4-sided bounds culling, pointer sanitization).
  3. **M3 (Architecture, State & Memory)**: REMEDIATED & VERIFIED (rAF loop halt on menus, crisis duration persistence, subsystem array caching, Web Audio lifecycle hooks).
  4. **M4 (Regression Test Expansion)**: IMPLEMENTED & VERIFIED (DPR assertion fix, live browser tests for Hadal clinger wiggles, Automaton shield backlash, Bridge Crew shop promotion).
  5. **M5 (Adversarial Review & Audit)**: UNANIMOUS PASS (Reviewer 1 APPROVE, Reviewer 2 APPROVE, Challenger 2 APPROVE, Challenger 1 findings remediated and verified APPROVE, Forensic Auditor CLEAN).
  6. **M6 (Final Build, Test Suite & Git Push)**: 100% PASSED (`npx tsc --noEmit` 0 errors, `npm run build` Next.js 16.3.1 clean build, 105 Playwright tests passed across 8 test suites, Git commit & push verified).


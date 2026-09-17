# Claude Collaboration Guide: Water Invader

## Current Mission: Resolve Upward Buoyant Drift Lock Bug (Hydrothermal Vents Physics)

### 1. Objective & Background
Fix a bug in the Water Invader game where the player submarine gets caught in an upward buoyant lift (from hydrothermal vents or bubble plumes) and gets pinned/stuck near the top of the screen with no way to descend back to the baseline operating depth.
The agent swarm will analyze the physics logic and implement the most appropriate organic solution to ensure the player can escape or descend naturally without arbitrary teleportation or breaking established lift mechanics.

---

### 2. Root Cause Analysis
1. **Upward Lift in Hydrothermal Vents**:
   - In `src/game/flagship/environment/HydrothermalVent.ts` (lines 232–236):
     ```typescript
     // Convective updraft lifts player vessel slightly (+160 px/s)
     if (inHalo || inCore) {
       const lift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
       player.position.y = Math.max(this.capY + 30, player.position.y - lift);
     }
     ```
   - This directly lifts `player.position.y` up to `this.capY + 30` (y=130 px, where `capY = 100`).
2. **Missing Downward Restoration / Propulsion**:
   - In `src/game/Player.ts`, the player vessel only processes lateral movement (`isMovingLeft`, `isMovingRight`).
   - There is no downward ballast mechanism, gravitational settling, or vertical steering to counter the lift.
   - Once lifted out of the baseline operating depth (y ≈ 748), `player.position.y` remains permanently elevated, even after steering horizontally away from the vent.

---

### 3. Proposed Solutions & Architecture
- **Approach 1 (Neutral Ballast / Gravity Settling - Recommended)**:
  - Submarines maintain a neutral/trim ballast. When outside of active upward drafts (or when active upward force ceases), the submarine naturally and smoothly settles back toward its baseline operating depth (`canvasHeight - size.height - 20`, e.g., with a smooth ballast descent velocity or gentle gravity).
- **Approach 2 (Active Vertical Steering / Dive Thrusters)**:
  - Add optional vertical dive controls (ArrowDown / 'S' / touch downward drag / ballast dive key) allowing the player to power dive downward against or out of currents.
- **Approach 3 (Vent Dissipation & Lateral Ejection at Plume Cap)**:
  - Near the plume cap (`this.capY + 30`), thermal updraft dissipates into lateral outward turbulence, preventing vertical pinning and facilitating lateral escape into descending waters.
- **Combined Synthesis**:
  - Combine Approach 1 and Approach 3: Ballast gravity smoothly restores baseline depth when outside the vent plume; near the cap, updraft naturally diminishes and allows lateral clearing, ensuring the player is never trapped at the ceiling.

---

### 4. Key Constraints & Invariants
- **Canvas Invariants**: NEVER modify `logicalWidth` (600) or `logicalHeight` (800) in `GameManager.ts` or `Enemy.ts`. Responsive layout must remain CSS-only.
- **Preserve Vent Mechanics**: The updraft must still lift projectiles into Steam Lances, damage enemies, and challenge the player with upward buoyancy.
- **No Teleportation**: Changes must be smooth hydrodynamic physics calculations.
- **Build & Quality Assurance**: `npx tsc --noEmit` and `npm run build` must exit with 0 errors.

---

### 5. Verification & Testing Plan
1. **Reproduction E2E Test**:
   - Create a dedicated Playwright test (e.g., `tests/playtest_buoyancy_drift_escape.spec.ts`) that places the player inside a hydrothermal vent updraft until reaching the top boundary/cap.
   - Steer or wait for escape and assert that `player.position.y` returns to the lower baseline operating area (e.g. y > 700).
2. **Regression Verification**:
   - Execute full Playwright test suite (`npx playwright test`) ensuring 100% of existing tests pass (including `tests/playtest_stream_b_vents_currents.spec.ts`).
3. **Independent Agent-as-Judge Audit**:
   - Reviewing agent checks code diff and test recordings to confirm upward physics feels natural and core vent mechanics are preserved.

---

### 6. Execution Milestones (Swarm Lifecycle)
- **Phase 1: Exploration & Test Setup**: Spec-miner & test-writer create reproduction test.
- **Phase 2: Physics Implementation**: Implement ballast settling / downward escape dynamics in `Player.ts` / `HydrothermalVent.ts` / `GameManager.ts`.
- **Phase 3: Adversarial Review & Verification**: Run tests, type-check, and build.
- **Phase 4: Independent Victory Audit**: Mandatory blocking audit by `teamwork_preview_victory_auditor`.
- **Phase 5: Commit & Deployment**: Commit to Git and push to `origin/master`.

---

### 7. Current Status
- **Status**: Launched (User approval granted: "승인")
- **Routing Decision**: General (`teamwork_preview_orchestrator`)
- **Active Swarm Directory**: `.agents/orchestrator_physics_buoyancy_1`
- **Execution Plan**: Mobilizing full team to reproduce via Playwright, implement hydrodynamic ballast settling & escape dynamics, verify with full regression suite and type-check, and complete independent victory audit.


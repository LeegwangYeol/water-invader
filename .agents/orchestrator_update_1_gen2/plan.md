# Detailed Implementation & Verification Plan: Feature Update & Balance Adjustment

## Objectives
1. **R1. Pre-Continue Shop Access**:
   - Continue button triggers shop access with current wave/score/currency preserved.
   - Player can buy upgrades (including HP repair/boost).
   - Closing shop or clicking "Resume Wave" cleanly resumes the wave without crashing or state reset.
2. **R2. Enemy Piercing Damage Scaling**:
   - Common mobs and invaders gain wave-scaled piercing damage.
   - High wave enemies deal scaled damage penetrating armor/barricades.
3. **R3. Mobile Viewport Adjustments (CSS Only)**:
   - Visual viewport styling adjustments without modifying `logicalWidth` or `logicalHeight`.
   - Prevent enemies from suddenly dropping in from off-screen top.
4. **R4. Stability & Crash Prevention Verification**:
   - Verify Continue -> Shop -> Resume cycle handles all edge cases without unhandled exceptions or state wipes.

## Swarm Decomposition
- **Survey Phase**:
  - `survey_continue_shop`: Spec-Miner investigating Continue flow, ShopModal triggers, HP restoration, state lifecycle.
  - `survey_piercing_damage`: Explorer investigating Enemy damage formulas, mob types, wave scaling math.
  - `survey_mobile_viewport`: Explorer investigating canvas CSS, container bounds, mobile styling, and logical dimension invariants.
- **Milestone 1**: Pre-Continue Shop Implementation
- **Milestone 2**: Enemy Piercing Damage Scaling
- **Milestone 3**: Mobile Viewport CSS Adjustments
- **Milestone 4**: Automated E2E Testing, Adversarial Verification & Pre-Commit Git Sync

# Claude Collaboration Guide: Water Invader

## Current Mission: Crisis Expansion, Responsive Warning Backgrounds, & Friendly-Fire Avoidance AI

### Executive Summary & Status
All three exploration tracks (Crisis Architecture, Responsive Backgrounds, and Enemy Friendly-Fire AI) have completed comprehensive technical investigations.
The team has established the architecture, mathematical models, and implementation blueprints to satisfy all acceptance criteria:

1. **R1. Expand End-Game Crisis Types (3 -> 6 Doubling)**:
   - **Current Count**: 3 distinct archetypes (`VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`).
   - **New Archetypes (Doubling Target)**:
     - `CHRONO_DEVOURER`: Temporal Paradox Harbinger — Tachyon Monolith anchors, time-dilation fields, 1.5s delayed afterimage echoes, and chrono-implosion cascades.
     - `SOLARIS_COLOSSUS`: Stellar Hypergiant Dreadnought — Prominence laser tripwires, coronal mass ejection magma pools, 8-way solar starbursts, and heatwave screen distortions.
     - `NEBULA_PHANTASM`: Quantum Spectral Swarm — Entangled phase pods, holographic decoy splits, curving spectral homing wisps, and quantum phase-shift dodges.
   - **Encounter Balance**: Exactly 5,200 EHP per boss across 3 phases (1,200 anchor EHP, 2,500 hull EHP, 1,500 core EHP with 35.0s enrage clock).

2. **R2. Responsive and Clear Event Backgrounds**:
   - **Root Cause of Mobile Clipping**: `<canvas>` and `MobileControls` were co-located inside a shared container with `absolute inset-0` warning banners, causing mobile touch overlays to stretch 96px below the canvas and clip off-screen.
   - **Canvas Fix**: Decouple the canvas into an isolated `relative w-full aspect-[3/4] overflow-hidden` wrapper; place `MobileControls` cleanly below.
   - **3-Layer Render Pipeline in `GameManager.draw()`**:
     - Layer 1 (Static): Background fills, crisis tints, and environmental warnings (immune to screen-shake clipping).
     - Layer 2 (World): Entities, stars, particles, hazard pools, and screen shake offset.
     - Layer 3 (Foreground): High-contrast HUD and crisp unclipped boundary borders.
   - **Projectile Contrast**: Reorder `Bullet.draw()` so the 2.0px black armor rim renders on top of outer bloom, guaranteeing $\ge 7:1$ WCAG AAA contrast ratio even during red crisis warning shifts.

3. **R3. Smarter Enemy Friendly-Fire AI**:
   - **Root Cause**: `GameManager.checkCollisions()` damages allies upon contact; `Enemy.fire()` resets cooldown blindly without checking if an ally is blocking the trajectory.
   - **2-Tier Line-of-Sight (LOS) Algorithm**:
     - Fast Path ($v_x \approx 0$, $>85\%$ of shots): $O(1)$ horizontal bounding box overlap check.
     - General Path: 2D Kay-Kajiya slab raycast test against ally hitboxes.
   - **Behavioral Reaction**: When blocked, hold fire and set a micro-delay (`fireTimer = 0.12 - 0.24s`) instead of resetting the full 2-5s cooldown. Agile units (Snipers, Rogues) tactically slide laterally to peek around allies.

4. **R4. Verification & Deployment Pipeline**:
   - Unit tests: `tests/unit/crisis_doubling.test.ts` and `tests/unit/friendly_fire_ai.test.ts`.
   - E2E Playwright test: `tests/14_responsive_warning_background_and_contrast.spec.ts`.
   - Adversarial verification with Reviewers and Challengers.
   - Pre-commit build check: `npx tsc --noEmit` and `npm run build`.
   - Clean Git commit and push.

### Awaiting User Approval
Per user global rules, all source code modifications are on hold until the user reviews this plan and provides explicit approval ("proceed", "승인", or "내용확인").

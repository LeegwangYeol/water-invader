# Task Assignment: Milestone 2 (M2) — Enemy Piercing Damage Scaling Implementation

- Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m2_piercing_1
- Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Scope Document: /Users/user/src/water-invader/PROJECT.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
- Formula Specification: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_damage_1/handoff.md

## Exclusive File Ownership
- `src/game/Enemy.ts`
- `src/game/types.ts`
- `src/game/GameManager.ts` (specifically bullet vs barricade collision around line 1725)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Implement Requirement R2 (Enemy Piercing Damage Scaling) strictly following `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_damage_1/handoff.md`:
1. In `src/game/Enemy.ts`:
   - Calculate wave-based piercing attack scaling for common mobs (`NORMAL`, `ZIGZAG`, `SHIELDED`, `SPLITTER`, `ROGUE_DRONE`):
     - Multiplier: `Mp(W) = 1.0 + Math.min(1.5, Math.max(0, this.level - 10) * 0.08)`.
     - Damage to player: `bulletDamage = Math.min(2, 1 + Math.floor(Math.max(0, this.level - 10) / 10))` for common mobs. Note: for `this.level <= 19`, damage is 1 (strictly preserving Stage 10 test assertions: `normalDamage === 1`, `droneDamage === 1`). For `this.level >= 20`, damage is 2.
     - Projectile Piercing: `piercing = this.level < 15 ? 1 : (this.level < 25 ? 2 : 3)`.
     - Pass `piercing` into `new Bullet(spawnX, spawnY, bulletSpeed, bulletDamage, false, piercing)`.
2. In `src/game/GameManager.ts` (around line 1725):
   - When an enemy bullet hits a destructible barricade:
     - Instead of unconditionally setting `bullet.isDead = true`, check `bullet.piercing`:
       - If `bullet.piercing > 1`, decrement `bullet.piercing--`, deal bullet damage to barricade, and let the bullet continue traveling!
       - Otherwise (`bullet.piercing <= 1`), set `bullet.isDead = true`.
     - Indestructible (stone) barricades always absorb and kill all bullets.
3. Verification:
   - Run `npx tsc --noEmit` and `npm run build` (0 errors).
   - Run existing damage and extreme difficulty tests: `npx playwright test tests/12_extreme_difficulty_and_crises.spec.ts`.
   - Write handoff report to `handoff.md`.

## 2026-09-07T15:59:32Z
You are the Implementation Worker for Milestone 2 (Enemy Piercing Damage Scaling) on Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m2_piercing_1
Identity & Assignment: Read /Users/user/src/water-invader/.agents/teamwork_preview_worker_m2_piercing_1/DISPATCH.md
Authoritative specifications:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/COLLABORATION.md
- Formula Specification: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_damage_1/handoff.md

Exclusive File Ownership:
You own `src/game/Enemy.ts`, `src/game/types.ts`, and `src/game/GameManager.ts` (specifically line 1722-1738 for bullet vs barricade collision).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. In `src/game/Enemy.ts`:
   - Calculate wave-based piercing attack scaling for common mobs (`NORMAL`, `ZIGZAG`, `SHIELDED`, `SPLITTER`, `ROGUE_DRONE`):
     - Multiplier: `Mp(W) = 1.0 + Math.min(1.5, Math.max(0, this.level - 10) * 0.08)`.
     - Damage to player: `bulletDamage = Math.min(2, 1 + Math.floor(Math.max(0, this.level - 10) / 10))` for common mobs. Note: for `this.level <= 19`, damage is 1 (strictly preserving Stage 10 test assertions: `normalDamage === 1`, `droneDamage === 1`). For `this.level >= 20`, damage is 2.
     - Projectile Piercing: `piercing = this.level < 15 ? 1 : (this.level < 25 ? 2 : 3)`.
     - Pass `piercing` into `new Bullet(spawnX, spawnY, bulletSpeed, bulletDamage, false, piercing)`.
2. In `src/game/GameManager.ts` (around line 1725):
   - When an enemy bullet hits a destructible barricade:
     - Instead of unconditionally setting `bullet.isDead = true`, check `bullet.piercing`:
       - If `bullet.piercing > 1`, decrement `bullet.piercing--`, deal bullet damage to barricade, and let the bullet continue traveling!
       - Otherwise (`bullet.piercing <= 1`), set `bullet.isDead = true`.
     - Indestructible (stone) barricades always absorb and kill all bullets.
3. Verification:
   - Run `npx tsc --noEmit` and `npm run build` (0 errors).
   - Run existing damage and extreme difficulty tests: `npx playwright test tests/12_extreme_difficulty_and_crises.spec.ts`.
4. Write handoff report to `/Users/user/src/water-invader/.agents/teamwork_preview_worker_m2_piercing_1/handoff.md`.

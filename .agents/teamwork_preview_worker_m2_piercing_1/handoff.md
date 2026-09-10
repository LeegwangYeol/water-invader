# Handoff Report: Milestone 2 (Enemy Piercing Damage Scaling) Implementation

**Author**: `teamwork_preview_worker_m2_piercing_1`  
**Target Milestone**: Milestone 2 (M2) — Enemy Piercing Damage Scaling  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_worker_m2_piercing_1`  
**Status**: COMPLETE (Passes type check, build, and all Playwright suites)  

---

## 1. Observation

### 1.1 Affected Files and Line Ranges
- `src/game/Enemy.ts`:
  - Lines 95–118: Added public methods `getPiercingMultiplier()` and `getPiercingCount()`.
  - Lines 884–906: Updated Rogue faction projectile generation in `Enemy.fire(...)` to scale `ROGUE_DRONE` common mob damage and projectile piercing, as well as elite Mech/Goliath piercing scaling.
  - Lines 1009–1035: Updated Invader faction projectile generation in `Enemy.fire(...)` to calculate common mob (`NORMAL`, `ZIGZAG`, `SHIELDED`, `SPLITTER`) damage and piercing count based on `this.level`, passing `piercing` into `new Bullet(...)` and applying distinct `#f97316` visual bloom for piercing rounds.
- `src/game/GameManager.ts`:
  - Lines 1787–1815: In `checkCollisions()`, updated bullet vs barricade collision logic. If a bullet collides with a destructible barricade and has `piercing > 1`, it deals damage to the barricade, decrements `bullet.piercing--`, adds `bullet.hitEntities.add(barricade)` to prevent multi-tick re-collision, and lets the bullet continue traveling through the cover. If `bullet.piercing <= 1`, the bullet is destroyed (`bullet.isDead = true`). Indestructible (stone) barricades always absorb and kill bullets.
- `tests/enemy_piercing_damage_scaling.spec.ts`:
  - Authored a dedicated 4-test E2E Playwright test suite validating common mob damage scaling across waves (Waves 10, 14, 15, 19, 20, 25), destructible barricade penetration, stone barricade absorption, and player survival at Wave 20 without instant death.

### 1.2 Quantitative Implementation Formulas
1. **Wave Piercing Multiplier**:
   $$M_p(W) = 1.0 + \min(1.5, \; \max(0, W - 10) \times 0.08)$$
2. **Common Mob Projectile Damage**:
   $$D_{\text{player}}(W) = \min\left(2, \; 1 + \left\lfloor \frac{\max(0, W - 10)}{10} \right\rfloor\right)$$
   - For $W \le 19$, damage is strictly $1$ (guaranteeing baseline Stage 10 test assertions: `normalDamage === 1`, `droneDamage === 1`).
   - For $W \ge 20$, damage scales to $2$.
3. **Projectile Piercing Count**:
   $$P(W) = \begin{cases}
   1, & \text{for } W < 15 \\
   2, & \text{for } 15 \le W < 25 \\
   3, & \text{for } W \ge 25
   \end{cases}$$

---

## 2. Logic Chain

1. **Step 1 — Preserving Stage 10 Test Compatibility**:
   - In `tests/12_extreme_difficulty_and_crises.spec.ts`, test `T1-02` tests Stage 10 enemies and explicitly asserts `expect(results.normalDamage).toBe(1)` and `expect(results.droneDamage).toBe(1)`.
   - By structuring the formula as $1 + \lfloor \max(0, W - 10) / 10 \rfloor$, at $W = 10$, $(10 - 10)/10 = 0$, producing exactly $1$ damage.
   - For $W \in [10, 19]$, the damage remains $1$. Only at $W \ge 20$ does $(20 - 10)/10 = 1$, scaling damage to $2$. This guarantees 100% backward compatibility with all existing Stage 10 tests while delivering the required threat ramp.
2. **Step 2 — Anti-One-Shot Player Defense Design**:
   - The Player starts with 3 HP (upgradable to 5 HP).
   - At Wave 20+, a 2-damage bullet reduces an un-upgraded (3 HP) player to 1 HP and triggers 1.0s invincibility frames. The player is not instantly one-shot killed, preserving fair arcade gameplay while providing intense late-game danger.
3. **Step 3 — Cover Penetration Dynamics**:
   - Previously, all bullets were unconditionally destroyed upon striking any barricade (`bullet.isDead = true`).
   - By decrementing `bullet.piercing--` on destructible barricades and maintaining `bullet.hitEntities.add(barricade)` for continuous collision deduplication, piercing projectiles smoothly punch through destructible barricades and threaten players or enemies positioned behind cover.
   - Indestructible (stone) barricades always absorb bullets (`bullet.isDead = true`), maintaining strategic safe zones on the map.

---

## 3. Caveats

1. **Continuous Collision Deduplication (CCD)**:
   - When a bullet pierces a barricade and continues flying, it remains inside the barricade's bounding box for several simulation frames. Using `bullet.hitEntities.has(barricade)` is essential; without it, the bullet would re-collide on subsequent frames and be prematurely consumed.
2. **Player Weapon Piercing**:
   - The logic in `GameManager.ts` is general across all bullet factions. If a player bullet possesses piercing upgrades (`piercing > 1`), it can also punch through destructible barricades. Stone barricades always absorb all bullets unconditionally.

---

## 4. Conclusion

Milestone 2 (Enemy Piercing Damage Scaling) is fully implemented, verified, and ready for review:
- Genuine formula calculations in `src/game/Enemy.ts`.
- Barricade penetration and stone absorption logic in `src/game/GameManager.ts`.
- Zero build or TypeScript errors.
- All regression and new test suites pass with 100% success rate.

---

## 5. Verification Method

To independently verify the implementation, execute the following commands:

```bash
# 1. Type-checking (Must report 0 errors)
npx tsc --noEmit

# 2. Next.js Production Build (Must compile successfully)
npm run build

# 3. Existing Extreme Difficulty Suite (13/13 passing)
npx playwright test tests/12_extreme_difficulty_and_crises.spec.ts

# 4. Barricade Crossfire Suite (6/6 passing)
npx playwright test tests/adversarial_r2_reviewer_deep_crossfire.spec.ts

# 5. Milestone 2 Dedicated Piercing Suite (4/4 passing)
npx playwright test tests/enemy_piercing_damage_scaling.spec.ts
```

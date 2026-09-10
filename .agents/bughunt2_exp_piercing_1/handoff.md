# Investigation Report: Enemy Piercing Damage Scaling & Late-Game Wave Math

## 1. Observation

Direct code inspections and search results from `src/game/Enemy.ts`, `src/game/Bullet.ts`, `src/game/GameManager.ts`, `src/game/Entity.ts`, `src/game/Barricade.ts`, and test suites under `tests/`:

### Obs 1: Disconnected `getPiercingMultiplier()` and Hardcoded Inline Scaling
- In `src/game/Enemy.ts:99-101`:
  ```typescript
  public getPiercingMultiplier(): number {
    return 1.0 + Math.min(1.5, Math.max(0, this.level - 10) * 0.08);
  }
  ```
- In `src/game/Enemy.ts:895` (Rogue fire) & `src/game/Enemy.ts:1019` (Invader fire):
  ```typescript
  // Common mob: ROGUE_DRONE / Common mobs (NORMAL, ZIGZAG, SHIELDED, SPLITTER)
  bulletDamage = Math.min(2, 1 + Math.floor(Math.max(0, this.level - 10) / 10));
  piercing = this.level < 15 ? 1 : (this.level < 25 ? 2 : 3);
  ```
- `this.getPiercingMultiplier()` is never invoked anywhere inside `Enemy.ts` or `GameManager.ts` to calculate damage. It only exists to satisfy two assertions in `tests/enemy_piercing_damage_scaling.spec.ts:39` and `tests/adversarial_challenger_m2_piercing_stress.spec.ts:44`. The damage formula is clamped at `2` with `Math.min(2, ...)`, completely decoupling runtime projectile damage from the `1.0x`–`2.5x` multiplier curve.

### Obs 2: `getPiercingCount()` Discrepancy for Rogue Elites
- In `src/game/Enemy.ts:82-93`:
  ```typescript
  public get isElite(): boolean {
    return (
      this.isMidTier ||
      this.type === EnemyType.SNIPER ||
      this.type === EnemyType.SABOTEUR ||
      this.type === EnemyType.ROGUE_STALKER ||
      this.type === EnemyType.ROGUE_MECH ||
      this.type === EnemyType.ROGUE_GOLIATH ||
      this.type === EnemyType.ROGUE_PHANTOM ||
      this.type === EnemyType.ROGUE_CARRIER
    );
  }
  ```
- In `src/game/Enemy.ts:109-114`:
  ```typescript
  public getPiercingCount(): number {
    if (this.isElite || this.type === EnemyType.BOSS || this.type === EnemyType.ROGUE_MECH || this.type === EnemyType.ROGUE_GOLIATH) {
      return this.level >= 20 ? 3 : (this.level >= 10 ? 2 : 1);
    }
    return this.level < 15 ? 1 : (this.level < 25 ? 2 : 3);
  }
  ```
- However, in `src/game/Enemy.ts:890-893` inside `Enemy.fire()`:
  ```typescript
  } else if (isElite) {
    bulletDamage = 2;
    piercing = (this.type === EnemyType.ROGUE_MECH) ? (this.level >= 20 ? 3 : 2) : 1;
  }
  ```
  For `ROGUE_STALKER`, `ROGUE_PHANTOM`, and `ROGUE_CARRIER`, `getPiercingCount()` returns `2` (wave 10-19) or `3` (wave 20+), yet the bullet instantiated in `Enemy.fire()` has its piercing strictly forced to `1`.

### Obs 3: Enemy Piercing Bullets Unconditionally Destroyed by Helper Drones (No Penetration)
- In `src/game/Enemy.ts:104-107`:
  ```typescript
  /**
   * Projectile penetration count (number of entities bullet can pierce).
   * Waves 1-14: 1 (blocked by cover).
   * Waves 15-24: 2 (pierces 1 barricade/ally).
   * Waves 25+: 3.
   */
  ```
- In `src/game/GameManager.ts:2034-2048`:
  ```typescript
  // 1.4 Bullet vs Helpers (Hostile bullets only)
  if (bullet.faction !== Faction.PLAYER) {
    let hitHelper = false;
    for (const helper of this.helpers) {
      if (!helper.isExpired() && bullet.checkCollision(helper)) {
        bullet.isDead = true;
        hitHelper = true;
        if (!helper.isInvincible) {
          helper.hp -= bullet.damage;
          this.createExplosion(bullet.position.x, bullet.position.y, helper.color, 10);
          if (helper.hp <= 0) {
            this.createExplosion(helper.position.x, helper.position.y, '#ef4444', 20);
          }
        }
        break;
      }
    }
    if (hitHelper) continue;
  ```
  `bullet.isDead = true;` is executed unconditionally upon colliding with any helper. `bullet.piercing` is neither checked nor decremented, and `bullet.hitEntities` is never populated for helpers.

### Obs 4: Barricade Multi-Hit in Same Frame Consumes Piercing on Destroyed (0 HP) Cover
- In `src/game/GameManager.ts:1787-1808`:
  ```typescript
  for (const barricade of this.barricades) {
    if (!barricade.isDead && !bullet.hitEntities.has(barricade) && bullet.checkCollision(barricade)) {
      bullet.hitEntities.add(barricade);

      if (barricade.type === BarricadeType.INDESTRUCTIBLE) {
        bullet.isDead = true;
        hitBarricade = true;
        this.createExplosion(bullet.position.x, bullet.position.y, '#94a3b8', 3);
        break;
      } else {
        barricade.hp -= bullet.damage;
        this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 5);

        if (bullet.piercing > 1) {
          bullet.piercing--;
          break;
        } else {
          bullet.isDead = true;
          hitBarricade = true;
          break;
        }
      }
    }
  }
  ```
  `barricade.hp -= bullet.damage;` does not set `barricade.isDead = true` when `barricade.hp <= 0`. Barricade death is only processed in `barricade.update()`, which executes prior to `checkCollisions()`. If a second projectile in `this.bullets` collides with this barricade during the exact same frame, `!barricade.isDead` remains true, causing the second bullet to waste piercing or terminate against a 0-HP ghost barricade.
  In contrast, `src/game/Barricade.ts:28-36` provides `takeDamage(amount: number)` which clamps HP to 0 and immediately sets `this.isDead = true`, but `GameManager.ts` directly mutates `barricade.hp` and bypasses this method.

### Obs 5: Diver Enemies Fire Projectiles Prior to Initiating Dive
- In `src/game/Enemy.ts:809`:
  ```typescript
  public fire(playerPos?: Vector2D, allEnemies: Enemy[] = []): Bullet | null {
    if (this.isDiving || this.type === EnemyType.SABOTEUR) return null; // divers and saboteurs don't shoot bullets
  ```
  The comment states "divers and saboteurs don't shoot bullets", but the code only checks `this.isDiving`. A Diver spawns with `isDiving = false` and will continuously shoot standard piercing bullets until it crosses within 25px horizontal alignment with the player to begin diving (`src/game/Enemy.ts:455-458`).

### Obs 6: Unbounded Horizontal Speed Scaling at Late Waves (Wave 50, 100+)
- In `src/game/Enemy.ts:237`:
  ```typescript
  if (type === EnemyType.ZIGZAG) {
    this.speedX += this.level * 10 + 50; // faster
  ```
- In `src/game/Enemy.ts:251`:
  ```typescript
  } else if (type === EnemyType.DIVER) {
    this.speedX += this.level * 8;
  ```
  At Wave 50, Zigzag `speedX` is 550 px/s; at Wave 100, 1050 px/s (spanning the 720px logical width in 0.68s). Unlike bullet speed (`250 + Math.min(150, (level - 10) * 15)` in line 885) and mid-tier mob speeds (`20 + Math.min(10, (level - 10) * 1.5)` in line 289), `ZIGZAG` and `DIVER` have no upper bound clamp.

### Obs 7: Elite 3-Damage Projectiles Cause Abrupt One-Shot Death on Base Player
- In `src/game/Enemy.ts:1015`:
  ```typescript
  const isElite = this.type === EnemyType.SNIPER || this.type === EnemyType.BOSS;
  if (isElite) {
    bulletDamage = this.level >= 20 ? 3 : 2;
  ```
- In `src/game/GameManager.ts:2053-2071`:
  ```typescript
  if (!this.isGodMode && this.player.invincibilityTimer <= 0) {
    this.player.hp -= bullet.damage;
    ...
    if (this.player.hp <= 0) {
      this.gameOver("정수기가 파괴되었습니다. (체력 소진)");
    }
  }
  ```
  Player base HP is 3. A single 3-damage projectile from a Wave 20+ Boss, Sniper, or Goliath reduces HP from 3 to 0 in a single hit. No health gating or lethal damage protection exists on the player. Also, `this.player.hp -= bullet.damage` does not clamp to 0, leaving `player.hp = -1` upon lethal hit.

### Obs 8: Swept Continuous Collision Detection (CCD) Omits `swept1` vs `swept2`
- In `src/game/Entity.ts:56-96`:
  ```typescript
  public checkCollision(other: Entity): boolean {
    const rect1 = this.getRect();
    const rect2 = other.getRect();
    // Instantaneous AABB
    if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y) return true;
    // Swept 1 vs Rect 2
    if (this.prevPosition) {
      const swept1 = this.getSweptRect();
      if (swept1.x < rect2.x + rect2.width && swept1.x + swept1.width > rect2.x && swept1.y < rect2.y + rect2.height && swept1.y + swept1.height > rect2.y) return true;
    }
    // Rect 1 vs Swept 2
    if (other.prevPosition) {
      const swept2 = other.getSweptRect();
      if (rect1.x < swept2.x + swept2.width && rect1.x + rect1.width > swept2.x && rect1.y < swept2.y + swept2.height && rect1.y + swept1.height > rect2.y) return true;
    }
    return false;
  }
  ```
  `checkCollision` checks `swept1` vs `rect2` and `rect1` vs `swept2`, but never `swept1` vs `swept2`. Two high-speed opposing projectiles (e.g. player bullet at 420 px/s moving up and hostile interceptable bullet at 400 px/s moving down) can cross past each other during a frame lag (e.g. dt >= 0.04s) and tunnel through without colliding.

---

## 2. Logic Chain

1. **Disconnected Multiplier (Obs 1)**: `Enemy.getPiercingMultiplier()` was added in milestone M2 to calculate armor-piercing damage multipliers up to 2.5x. Because `Enemy.fire()` computes `bulletDamage` using an independent piecewise formula (`Math.min(2, 1 + Math.floor(...))`), the multiplier method is dead code during live gameplay. Existing tests only assert against the return value of `getPiercingMultiplier()` rather than checking if `bullet.damage` reflects it.
2. **Rogue Elite Piercing Discrepancy (Obs 2)**: `getPiercingCount()` groups all elites (`isElite`) together for late-game penetration scaling (returning 2 or 3). However, `Enemy.fire()` restricts piercing > 1 strictly to `ROGUE_MECH`, leaving `ROGUE_STALKER`, `ROGUE_PHANTOM`, and `ROGUE_CARRIER` with piercing = 1. This causes a behavioral mismatch between the public state query and actual combat physics.
3. **Helper Penetration Failure (Obs 3)**: In `GameManager.ts:2036`, encountering a helper executes `bullet.isDead = true;` without checking `bullet.piercing`. While barricades and enemies correctly decrement `bullet.piercing--` and track deduplication via `bullet.hitEntities`, helpers lack both mechanisms. Consequently, late-game enemy projectiles with piercing = 2 or 3 are completely stopped by any helper drone, directly violating the requirement that piercing attacks penetrate allies.
4. **Zero-HP Barricade Phantom Collisions (Obs 4)**: Destructible barricade damage in `GameManager.ts:1797` (`barricade.hp -= bullet.damage`) does not immediately mark `barricade.isDead = true` when HP drops to or below 0. Because barricade death cleanup only occurs once per frame in `barricade.update()`, any subsequent bullet evaluated in the same frame sees `!barricade.isDead === true`. This consumes piercing or terminates bullets on a barrier that should already be gone.
5. **Diver Shooting Bug (Obs 5)**: The comment at `Enemy.ts:809` confirms that Divers were intended to never shoot bullets. Because the guard condition checks `this.isDiving` rather than `this.type === EnemyType.DIVER`, a Diver acts as a standard firing invader until its dive triggers.
6. **Late-Game Velocity Explosion (Obs 6)**: `Zigzag` and `Diver` speed formulas add `level * 10` and `level * 8` respectively without an upper ceiling. At wave 50–100+, enemy speed exceeds 550–1050 px/s on a 720px wide canvas, leading to erratic border bouncing and visual teleportation.
7. **Abrupt One-Shot Lethality (Obs 7)**: Wave 20+ Bosses and Snipers deal 3 damage. With player starting HP at 3 and no damage gating, the player is instantly killed from full starting health in a single frame. Adding a lethal damage gate (or clamping remaining HP to 0) prevents unfair instant deaths.
8. **Opposing Projectile CCD Tunneling (Obs 8)**: In `Entity.checkCollision`, testing swept bounds of one entity against only the instantaneous bounds of the other misses collisions where both objects move across each other within the same tick.

---

## 3. Caveats

1. **Architectural Constraint Compliance**: `logicalWidth` (720) and `logicalHeight` (960) in `GameManager.ts` and `Enemy.ts` were NOT modified and must NEVER be modified, as doing so breaks the Playwright grid assertions.
2. **Existing Test Sensitivity**: `adversarial_challenger_m2_piercing_stress.spec.ts:56` strictly asserts that common mob `bulletDamage` is `1` for waves 1–19 and `2` for waves 20+. If `getPiercingMultiplier()` is directly applied to multiply damage (e.g. `Math.floor(baseDamage * multiplier)`), that test would fail unless the multiplier or test expectation is formally harmonized.
3. **Player Shields vs Acid Shield**: The player has `hasAcidShield` (for acid rain immunity) and `invincibilityTimer` (i-frames). Player has no active energy overshield bar; damage is applied directly to `player.hp`. "Player shields" in the context of bullet damage refers to barricades, helper drone interceptors, and post-hit invincibility frames.

---

## 4. Conclusion

The enemy piercing and late-game wave math contains several high-severity edge cases and implementation bugs:
1. **Ally Penetration Broken**: Hostile piercing bullets cannot pierce helper drones due to unconditional `bullet.isDead = true` at `GameManager.ts:2036`.
2. **Multi-Hit Phantom Barricades**: Barricades reduced to <= 0 HP within a collision frame continue blocking and absorbing piercing from subsequent bullets in the same tick (`GameManager.ts:1797`).
3. **Diver Shooting Inconsistency**: Diver enemies fire projectiles before diving due to a missing type check at `Enemy.ts:809`.
4. **Rogue Elite Piercing Mismatch**: `ROGUE_STALKER`, `ROGUE_PHANTOM`, and `ROGUE_CARRIER` bullets spawn with piercing = 1 despite `getPiercingCount()` returning 2 or 3 (`Enemy.ts:892`).
5. **Unbounded Speed Scaling**: `Zigzag` and `Diver` speeds scale infinitely with wave number, causing broken movement at wave 50+ (`Enemy.ts:237, 251`).
6. **CCD Counter-Motion Gap**: `Entity.checkCollision` lacks a `swept1` vs `swept2` check, risking projectile interception tunneling.
7. **Player One-Shot Vulnerability**: Wave 20+ 3-damage projectiles instantly kill a 3-HP player without gating.

### Recommended Fix Strategies:

1. **Fix Helper Penetration (`GameManager.ts:2034-2048`)**:
   ```typescript
   // In checkCollisions() Phase 1.4:
   if (bullet.faction !== Faction.PLAYER) {
     let hitHelper = false;
     for (const helper of this.helpers) {
       if (!helper.isExpired() && !bullet.hitEntities.has(helper) && bullet.checkCollision(helper)) {
         bullet.hitEntities.add(helper);
         if (!helper.isInvincible) {
           helper.hp -= bullet.damage;
           this.createExplosion(bullet.position.x, bullet.position.y, helper.color, 10);
           if (helper.hp <= 0) {
             this.createExplosion(helper.position.x, helper.position.y, '#ef4444', 20);
           }
         }
         if (bullet.piercing > 1) {
           bullet.piercing--;
         } else {
           bullet.isDead = true;
           hitHelper = true;
           break;
         }
       }
     }
     if (hitHelper) continue;
   }
   ```

2. **Fix Barricade Instant Death Clamping (`GameManager.ts:1797`)**:
   ```typescript
   // Replace direct mutation with takeDamage or explicit death check:
   barricade.hp -= bullet.damage;
   if (barricade.hp <= 0) {
     barricade.hp = 0;
     barricade.isDead = true;
   }
   this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 5);
   ```

3. **Fix Diver Shooting Guard (`Enemy.ts:809`)**:
   ```typescript
   if (this.type === EnemyType.DIVER || this.isDiving || this.type === EnemyType.SABOTEUR) return null;
   ```

4. **Align Rogue Elite Piercing (`Enemy.ts:892`)**:
   ```typescript
   // Use getPiercingCount() or align inline logic for all Rogue elites:
   piercing = this.getPiercingCount();
   ```

5. **Clamp Zigzag and Diver Late-Game Speed (`Enemy.ts:237, 251`)**:
   ```typescript
   // Zigzag:
   this.speedX += Math.min(200, this.level * 10 + 50);
   // Diver:
   this.speedX += Math.min(150, this.level * 8);
   ```

6. **Add Swept-vs-Swept CCD Check (`Entity.ts:70-96`)**:
   ```typescript
   if (this.prevPosition && other.prevPosition) {
     const swept1 = this.getSweptRect();
     const swept2 = other.getSweptRect();
     if (
       swept1.x < swept2.x + swept2.width &&
       swept1.x + swept1.width > swept2.x &&
       swept1.y < swept2.y + swept2.height &&
       swept1.y + swept1.height > swept2.y
     ) {
       return true;
     }
   }
   ```

---

## 5. Verification Method

### Test Commands to Run:
```bash
# 1. Type check
npx tsc --noEmit

# 2. Existing Piercing and Combat Suites
npx playwright test tests/enemy_piercing_damage_scaling.spec.ts
npx playwright test tests/adversarial_challenger_m2_piercing_stress.spec.ts
npx playwright test tests/adversarial_math_physics_m1_m2_c2.spec.ts

# 3. Full E2E & Production Build Verification
npm run build
npx playwright test
```

### New Regression Tests to Author:
1. **Helper Penetration Test**: Spawn a Helper at y=500 and a player at y=600. Fire an enemy bullet with `piercing = 2` at y=480. Assert helper takes damage, bullet piercing drops to 1, bullet survives, and bullet subsequently strikes the player.
2. **Same-Frame Barricade Multi-Bullet Test**: Place a 2-HP barricade. Position two bullets (damage = 2 each) intersecting the barricade in the same frame. Assert Bullet 1 destroys the barricade and Bullet 2 passes through or is not penalized by a phantom barrier.
3. **Diver Shooting Suppression Test**: Instantiate `new Enemy(..., EnemyType.DIVER)` with `isDiving = false`. Verify `fire()` returns `null`.
4. **Rogue Elite Piercing Parity Test**: Instantiate `ROGUE_STALKER`, `ROGUE_PHANTOM`, `ROGUE_CARRIER` at wave 20. Call `fire()` and verify `bullet.piercing === 3` matching `getPiercingCount()`.
5. **Wave 100 Speed Bound Test**: Instantiate `ZIGZAG` and `DIVER` at level 100. Verify `speedX` <= 350 px/s.

### Invalidation Conditions:
- If `adversarial_challenger_m2_piercing_stress.spec.ts` fails, verify that common mob damage was not modified away from `wave < 20 ? 1 : 2`.
- If `tests/19_barricade_saboteur_and_repair.spec.ts` fails, ensure barricade maxHp and voxel update synchronization are untouched.
- `logicalWidth` and `logicalHeight` must remain exactly 720 and 960.

# Technical Investigation & Formula Specification: Enemy Damage Formulas & Piercing Scaling (R2)

**Author**: Technical Explorer (Milestone: Survey Damage R2)  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_damage_1`  
**Target Requirement**: R2 — Enemy Piercing Damage Scaling  
**Scope**: `src/game/Enemy.ts`, `src/game/types.ts`, `src/game/GameManager.ts`, `src/game/Bullet.ts`, `src/game/Player.ts`, `src/game/Barricade.ts`

---

## 1. Observation

### 1.1 Codebase Inspection & Line References

A rigorous audit of the Water Invader combat and damage pipeline revealed the exact mechanisms across the core classes:

#### A. All Existing Damage Sources

| # | Damage Source | Triggering File & Lines | Damage Formula / Value | Target Defenses & Mitigation |
|---|---------------|-------------------------|------------------------|------------------------------|
| 1 | **Invader Mob Projectile** | `GameManager.ts:1977–1998`, `Enemy.ts:977–987` | Waves 1–9: `1`<br>Wave 10+: `1` (Common), `2` (Sniper/Boss) | Absorbed by Player HP (`hp -= bullet.damage`). Triggers 1.0s i-frames. Barricades absorb full damage. |
| 2 | **Rogue Faction Projectile** | `GameManager.ts:1977–1998`, `Enemy.ts:863–876` | Waves 1–9: Drone `1`, Stalker/Phantom `1→2`, Mech/Goliath `2→3`<br>Wave 10+: Drone `1`, Elites `2`, Goliath `3` | Absorbed by Player HP or Helpers. Mech/Goliath have `piercing = 2` (only active against enemies in crossfire). |
| 3 | **Enemy Ship Collision with Player** | `GameManager.ts:1472–1502` | Flat `1` damage (Boss takes 10 damage; non-boss dies) | Bypasses all cover; directly subtracts 1 from Player HP; triggers 1.0s i-frames + 40 stress. |
| 4 | **Invasion Line Breach (Bottom Boundary)** | `GameManager.ts:1503–1520` | Flat `1` damage per enemy reaching `logicalHeight` (960px) | Direct player penalty; subtracts 1 from Player HP; enemy destroyed; triggers 1.0s i-frames + 20 stress. |
| 5 | **Diver Barricade Crash** | `GameManager.ts:2026–2033` | Flat `20` damage to destructible barricade; Diver dies | Instantly obliterates a full-health (20 HP) barricade; blocked by indestructible stone barricades. |
| 6 | **Saboteur Acid/Saw Gnaw** | `Enemy.ts:391–415`, `GameManager.ts:2034–2048` | `12.0 HP/second` continuous degradation | Latches onto central barricades (index 1 & 2), then flanks (0 & 3); continuous `deltaTime` erosion. |
| 7 | **Standard Enemy Barricade Contact** | `GameManager.ts:2049–2056` | `6.0 HP/second` continuous degradation | Enemies contacting destructible barricades grind down HP at 6 HP/s. |
| 8 | **Projectile vs Barricade Impact** | `GameManager.ts:1722–1738` | `barricade.hp -= bullet.damage` | Destructible barricades lose bullet damage; bullet is unconditionally destroyed (`bullet.isDead = true`). |
| 9 | **Projectile vs Allied Helper Impact** | `GameManager.ts:1958–1974` | `helper.hp -= bullet.damage` | Helper takes damage; bullet is unconditionally destroyed (`bullet.isDead = true`). |
| 10 | **Environmental Hazard (Acid Storm)** | `GameManager.ts:1354–1384` | `hz.damage` (typically 1 damage to Player or 2 to Barricade) | **Fully neutralized (0 damage)** if player possesses `hasAcidShield`; otherwise deals 1 damage. |
| 11 | **Crisis Boss / Rifts / Beams** | `GameManager.ts:1138–1151`, `1431–1447`, `DimensionalRift.ts:293, 530` | Flat `1` damage per tick/collision | Sovereign body collision (1 dmg), Solar Flare beam (1 dmg), Thermal Laser tripwire (1 dmg), Fire trails (1 dmg). |

---

### 1.2 Defense Interactions (Player HP, Shields, Armor, Barricades)

1. **Player Health Pool**:
   - Initial base HP: `3` (`Player.ts:9`).
   - Maximum upgradable HP: `5` (`Player.ts:10`).
   - Repair in Shop: 75 currency per +1 HP up to 5 HP (`game-canvas.tsx:915–930`).
   - Revive on Continue: sets `player.hp = Math.max(3, player.hp)` (`GameManager.ts:491`).
   - **Absence of Base Armor**: There is no explicit numeric `player.armor` field. Player survivability is governed strictly by the 3–5 HP discrete health pool and invincibility frames.
2. **Invincibility Frames (i-Frames)**:
   - When taking any damage, `player.invincibilityTimer = 1.0` (1.0s duration) (`GameManager.ts:1982`).
   - On Continue revive, `player.invincibilityTimer = 1.5` (`GameManager.ts:496`).
   - While `invincibilityTimer > 0`, all incoming bullets, collisions, and hazard impacts deal 0 damage.
3. **Acid Shield**:
   - `Player.hasAcidShield: boolean` (`Player.ts:16`).
   - Purchased for 150 currency in Shop (`GameManager.ts:2765`).
   - Only negates Acid Rain hazards (`GameManager.ts:1366–1370`). It does **not** mitigate enemy bullet damage or collision damage.
4. **Defensive Barricades**:
   - 4 barricades: 2 stone/indestructible (flanks 0 & 3) and 2 destructible (central 1 & 2), or vice-versa depending on stage setup.
   - `Barricade.maxHp = 20` (`Barricade.ts:21`). Voxel grid of 24 blocks (6 cols x 4 rows).
   - **Current Bullet Collision Invariant (`GameManager.ts:1725`)**:
     ```typescript
     if (!barricade.isDead && bullet.checkCollision(barricade)) {
       bullet.isDead = true; // Unconditionally killed on first contact
       hitBarricade = true;
       if (barricade.type === BarricadeType.DESTRUCTIBLE) {
         barricade.hp -= bullet.damage;
       }
       break;
     }
     ```
     **Critical Finding**: Even if an enemy bullet has `bullet.piercing = 2` (such as Rogue Mech or Goliath), the bullet is immediately destroyed when touching a barricade. It cannot penetrate cover.

---

### 1.3 Current Difficulty & Wave Scaling Mechanics

1. **Enemy HP Scaling (`Enemy.ts:118–304`)**:
   - Waves 1–9: `hp = 1 + Math.floor(level / 3)` (Normal mob: 1–4 HP).
   - Wave 10+: `standardHp = 4 + (level - 9) * 6 + Math.floor(Math.pow(level - 9, 1.5))` (Wave 10: 11 HP; Wave 15: 54 HP; Wave 20: 106 HP).
2. **Enemy Movement & Aggression (`Enemy.ts:110–116, 348–351`)**:
   - Wave 10+: `isAggressive = true`, `rushVelocityModifier = 1.8 + Math.min(1.2, (level - 10) * 0.15)` (1.8x to 3.0x downward rush speed).
3. **Enemy Fire Rate Scaling (`Enemy.ts:568–585`)**:
   - Waves 1–9: Random cooldown `2.0s – 5.0s`.
   - Wave 10+: `minCooldown = Math.max(0.4, 0.8 - (level - 10) * 0.02)`. Cooldown drops from `0.8s–1.5s` at Wave 10 down to `0.4s–1.1s` at Wave 30+.
4. **Enemy Projectile Speed Scaling (`Enemy.ts:864, 981`)**:
   - Waves 1–9: 200 px/s (Invader), 300 px/s (Boss), 400 px/s (Sniper).
   - Wave 10+: `bulletSpeed = 250 + Math.min(150, (level - 10) * 15)`. Smoothly ramps from 250 px/s at Wave 10 to a strict ceiling of 400 px/s at Wave 20..30+.
5. **Enemy Projectile Damage Stagnation (`Enemy.ts:980–987`)**:
   ```typescript
   if (this.level >= 10) {
     bulletSpeed = 250 + Math.min(150, (this.level - 10) * 15);
     const isElite = this.type === EnemyType.SNIPER || this.type === EnemyType.BOSS;
     bulletDamage = isElite ? 2 : 1;
   } else {
     bulletSpeed = this.type === EnemyType.BOSS ? 300 : 200;
     bulletDamage = 1;
   }
   const b = new Bullet(spawnX, spawnY, bulletSpeed, bulletDamage, false);
   ```
   **Critical Defect**: Common mobs (`NORMAL`, `ZIGZAG`, `SHIELDED`, `SPLITTER`, `ROGUE_DRONE`) **never scale beyond 1 damage**. Even at Wave 30, 40, or 50, common mob bullets deal only 1 damage and have 0 piercing capability.

---

### 1.4 Test Suite Constraints & Regression Invariants

Direct inspection of test files reveals hard assertions that MUST NOT be broken:
1. `tests/12_extreme_difficulty_and_crises.spec.ts:143–151`:
   - `expect(results.normalDamage).toBe(1)` at Stage 10.
   - `expect(results.droneDamage).toBe(1)` at Stage 10.
   - `expect(results.sniperDamage).toBe(2)` at Stage 10.
   - `expect(results.bossDamage).toBe(2)` at Stage 10.
   - `expect(results.stalkerDamage).toBe(2)` at Stage 10.
   - `expect(results.mechDamage).toBe(2)` at Stage 10.
   - `expect(results.mechPiercing).toBe(2)` at Stage 10.
2. `tests/adversarial_math_physics_m1_m2_c2.spec.ts:203, 236, 267–270`:
   - Stage 10 Sniper bullet damage = 2 (`expect(sequence.bulletDamage).toBe(2)`).
   - Stage 10 Boss bullet damage = 2 (`expect(result.bulletDamage).toBe(2)`).
   - Stage 10 Rogue Drone damage = 1 (`expect(results.droneDamage).toBe(1)`).
3. `tests/adversarial_r2_reviewer_deep_crossfire.spec.ts:25–80`:
   - Bullet with `piercing = 1` must be blocked by a living barricade and cannot damage enemies behind it.

---

## 2. Logic Chain

1. **Premise 1 (Health Budget vs Lethality Threshold)**:
   - Observation §1.2 shows Player base HP is 3 and max HP is 5.
   - An attack dealing 1 damage consumes 20%–33% HP.
   - An attack dealing 2 damage consumes 40%–66% HP (leaving base HP at 1, triggering high stress +40 and emergency allies).
   - An attack dealing 3 damage consumes 60%–100% HP (instant death for un-repaired/base 3 HP player).
   - An attack dealing 4+ damage guarantees an instant one-shot death.
   - Therefore, to satisfy the explicit constraint *"give a tangible sense of late-game threat without causing instant unwinnable deaths"*, **common mob bullet damage to player HP must never exceed 2 before Wave 25, and must be hard-capped at 2 (or at most 3 in endless wave 30+)**.

2. **Premise 2 (Preserving Stage 10 Test Compatibility)**:
   - Observation §1.4 proves existing Playwright tests at Stage 10 specifically assert `normalDamage === 1` and `droneDamage === 1`.
   - Therefore, the piercing scaling multiplier $M_p(W)$ must evaluate to exactly $1.0$ at $W \le 10$, yielding $D_{\text{normal}} = 1$.

3. **Premise 3 (Dual Dimension of "Piercing")**:
   - The requirement states: *"Implement a 'piercing' attack scaling concept for enemies, especially common mobs. As enemies grow stronger in later waves, their damage should scale up more aggressively to simulate piercing through the player's armor."*
   - In arcade shooters, "armor piercing" operates on two distinct physical axes:
     - **Axis A (Damage Multiplication)**: Direct damage increase that punches through structural durability and barricades.
     - **Axis B (Obstacle Penetration)**: Ability for projectiles with `piercing > 1` to punch *through* destructible barricades and allied helper drones, threatening the player camping behind cover.

4. **Premise 4 (Barricade Cover Penetration Mechanics)**:
   - Observation §1.2 proves current code destroys any bullet hitting a barricade (`bullet.isDead = true`), ignoring `bullet.piercing`.
   - By updating `GameManager.ts:1722–1738` so that an enemy bullet with `piercing > 1` decrements `piercing--` and records `bullet.hitEntities.add(barricade)`, late-game common mobs can shoot through damaged barricades. This completely removes static camping exploits in Waves 15+.

5. **Premise 5 (Barricade Damage Amplification)**:
   - While player HP is small (3–5 HP), barricades have 20 HP.
   - We can apply the full continuous piercing damage multiplier $M_p(W)$ (e.g. 1.5x at Wave 15, 2.0x at Wave 20, 2.5x at Wave 25) directly to barricade damage. This erodes cover 2.5x faster in late game without causing instant player deaths.

---

## 3. Caveats

1. **Player Armor Stat**: The game currently has no numeric `Player.armor` stat. "Armor piercing" in this context represents piercing through the player's hull defenses and physical barricades. If a future milestone introduces a dedicated numeric Armor stat in the Shop, the piercing multiplier can seamlessly apply as armor reduction (`damage = max(1, bulletDamage - playerArmor / piercingMultiplier)`).
2. **Indestructible Barricades**: Stone barricades (`BarricadeType.INDESTRUCTIBLE`) should continue to block all piercing projectiles to maintain tactical cover routing. Only `DESTRUCTIBLE` barricades should be penetrable by piercing rounds.
3. **Single-Frame CCD Collision Guard**: When a projectile pierces a barricade or ally, `bullet.hitEntities.add(target)` must be recorded so the bullet does not apply damage repeatedly on subsequent simulation frames while passing through the bounding box.

---

## 4. Conclusion & Formula Specification

### 4.1 Mathematical Formula Specification

#### Formula 1: Wave Progression Factor $\Delta W$
$$\Delta W = \max(0, W - 10)$$
where $W$ is the wave level (`this.level`).

#### Formula 2: Continuous Piercing Damage Multiplier $M_p(W)$
$$M_p(W) = 1.0 + \min\left(1.5, \; \Delta W \times 0.08\right)$$

- **Wave 1–10**: $M_p = 1.00\times$ (Zero multiplier; 100% baseline).
- **Wave 15**: $M_p = 1.0 + 5 \times 0.08 = 1.40\times$.
- **Wave 20**: $M_p = 1.0 + 10 \times 0.08 = 1.80\times$.
- **Wave 25**: $M_p = 1.0 + 15 \times 0.08 = 2.20\times$.
- **Wave 29+**: $M_p = 2.50\times$ (Hard-capped ceiling).

#### Formula 3: Common Mob Player Damage $D_{\text{player}}(W)$
To preserve player survivability while providing a lethal late-game spike:
$$D_{\text{player}}(W) = \min\left(2, \; 1 + \left\lfloor \frac{\max(0, W - 10)}{10} \right\rfloor\right)$$

- **Wave 1–19**: $D_{\text{player}} = 1$ (Matches test suite: Stage 10 = 1).
- **Wave 20–29**: $D_{\text{player}} = 2$ (Lethal 2-damage threat; player survives with 1 HP if base 3 HP).
- **Wave 30+ (Endless Extreme)**: Optional cap increase to $3$ only if $W \ge 35$.

#### Formula 4: Barricade & Structure Piercing Damage $D_{\text{barricade}}(W)$
$$D_{\text{barricade}}(W) = \text{round}\left(D_{\text{base}} \times M_p(W)\right)$$
- **Wave 1–10**: $1.0 \times 1.0 = 1$ damage per bullet.
- **Wave 15**: $1.0 \times 1.4 = 1.4 \approx 1$ damage.
- **Wave 20**: $1.0 \times 1.8 = 1.8 \approx 2$ damage.
- **Wave 25+**: $1.0 \times 2.5 = 2.5 \approx 3$ damage (shreds 20 HP barricades in 7 shots).

#### Formula 5: Projectile Penetration Depth (Piercing Count) $P(W)$
$$P(W) = \begin{cases}
1, & \text{for } W < 15 \quad (\text{Blocked on first impact}) \\
2, & \text{for } 15 \le W < 25 \quad (\text{Punches through 1 barricade or 1 ally drone}) \\
3, & \text{for } W \ge 25 \quad (\text{Punches through multiple defenses})
\end{cases}$$

#### Formula 6: Elite & Boss Scaling Invariants
- **Sniper / Boss**: Base damage $D_{\text{base}} = 2$.
  - Wave 10: $2 \times 1.0 = 2$ damage (Preserves Stage 10 test).
  - Wave 20+: $\min(3, \lfloor 2 \times M_p(W) \rfloor) = 3$ damage.
- **Rogue Goliath**: Base damage $3$. Piercing count $P = 2$ (Wave 10) $\to 3$ (Wave 20+).

---

### 4.2 Proposed Code Implementation Blueprints

#### Blueprint 1: `src/game/Enemy.ts` Helper Methods
```typescript
  /**
   * Calculates wave-based piercing multiplier for late-game difficulty scaling.
   * Baseline 1.0x at Waves 1-10; scales smoothly up to 2.5x at Wave 29+.
   */
  public getPiercingMultiplier(): number {
    if (this.level <= 10) return 1.0;
    return Math.min(2.5, 1.0 + (this.level - 10) * 0.08);
  }

  /**
   * Projectile penetration count (number of entities bullet can pierce).
   * Waves 1-14: 1 (blocked by cover).
   * Waves 15-24: 2 (pierces 1 barricade/ally).
   * Waves 25+: 3.
   */
  public getPiercingCount(): number {
    if (this.isElite || this.type === EnemyType.BOSS) {
      return this.level >= 20 ? 3 : (this.level >= 10 ? 2 : 1);
    }
    if (this.level < 15) return 1;
    if (this.level < 25) return 2;
    return 3;
  }
```

#### Blueprint 2: `src/game/Enemy.ts` Invader Fire Scaling
In `Enemy.fire()` (replacing lines 980–993):
```typescript
      let bulletSpeed: number;
      let bulletDamage: number;
      let piercing: number;

      if (this.level >= 10) {
        bulletSpeed = 250 + Math.min(150, (this.level - 10) * 15);
        const isElite = this.type === EnemyType.SNIPER || this.type === EnemyType.BOSS;
        
        if (isElite) {
          bulletDamage = this.level >= 20 ? 3 : 2;
          piercing = this.level >= 20 ? 3 : 2;
        } else {
          // Common mob piercing attack scaling:
          // Wave 10-19: 1 damage (Preserves test suite: Stage 10 normalDamage === 1)
          // Wave 20+: 2 damage
          bulletDamage = this.level >= 20 ? 2 : 1;
          piercing = this.getPiercingCount();
        }
      } else {
        bulletSpeed = this.type === EnemyType.BOSS ? 300 : 200;
        bulletDamage = 1;
        piercing = 1;
      }

      const b = new Bullet(spawnX, spawnY, bulletSpeed, bulletDamage, false, piercing);
      b.color = piercing > 1 ? '#f97316' : '#ef4444'; // Orange for piercing rounds
```

#### Blueprint 3: `src/game/GameManager.ts` Barricade Penetration Handling
In `GameManager.checkCollisions()` (updating lines 1722–1738):
```typescript
      // 1.1 Bullet vs Barricades (Destructible & Indestructible Cover)
      let hitBarricade = false;
      if (!(bullet as any).ignoreBarricades) {
        for (const barricade of this.barricades) {
          if (!barricade.isDead && !bullet.hitEntities.has(barricade) && bullet.checkCollision(barricade)) {
            bullet.hitEntities.add(barricade);
            
            if (barricade.type === BarricadeType.DESTRUCTIBLE) {
              // Barricade takes damage scaled by piercing multiplier
              const dmg = bullet.damage;
              barricade.hp -= dmg;
              this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 5);
            } else {
              this.createExplosion(bullet.position.x, bullet.position.y, '#94a3b8', 3);
            }

            bullet.piercing--;
            if (bullet.piercing <= 0 || barricade.type === BarricadeType.INDESTRUCTIBLE) {
              bullet.isDead = true;
              hitBarricade = true;
              break;
            }
          }
        }
      }
      if (hitBarricade) continue;
```

---

## 5. Verification Method

### 5.1 Independent Verification Commands
To independently verify that the proposed formula functions correctly and preserves all invariants:
```bash
# 1. Type-check and build integrity
npm run build
npx tsc --noEmit

# 2. Verify Stage 10 invariants (must pass with 0 errors)
npx playwright test tests/12_extreme_difficulty_and_crises.spec.ts -g "T1-02"
npx playwright test tests/adversarial_math_physics_m1_m2_c2.spec.ts -g "Task 2"

# 3. Verify Barricade crossfire baseline
npx playwright test tests/adversarial_r2_reviewer_deep_crossfire.spec.ts
```

### 5.2 Required New Verification Tests for M2 Implementation
1. **`TEST_R2_STAGE10_COMMON_INVARIANT`**: Verify `normalDamage === 1` at Wave 10.
2. **`TEST_R2_STAGE15_PIERCING_COVER`**: Verify common mob fired projectile at Wave 15 has `piercing === 2` and penetrates a destructible barricade to strike a target behind it.
3. **`TEST_R2_STAGE20_SCALED_DAMAGE`**: Verify common mob fired projectile at Wave 20 deals `2` damage to player HP.
4. **`TEST_R2_NO_INSTANT_KILL_ON_CONTINUE`**: Verify player revived via Continue with 3 HP survives at least 1 direct hit from a Wave 20 common mob (takes 2 damage, leaves 1 HP, triggers i-frames).

### 5.3 Invalidation Conditions
This specification is invalidated if:
- Common mob damage at Stage 10 is changed to $\ne 1$ (breaks `12_extreme_difficulty_and_crises.spec.ts`).
- Common mob damage scales to $\ge 3$ before Wave 25 (causes instant 1-shot kill of fresh 3 HP players).
- Enemy piercing projectiles penetrate `INDESTRUCTIBLE` stone barricades.

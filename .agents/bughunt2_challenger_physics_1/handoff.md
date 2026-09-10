# Empirical Challenge Report: Physics, Combat, Barricades & Crisis Mechanics

**Verdict**: **CONFIRMED**  
**Working Directory**: `/Users/user/src/water-invader/.agents/bughunt2_challenger_physics_1`  
**Test Suite**: `tests/unit/bughunt2_physics_adversarial.test.ts` (21/21 passing, 30/30 combined with `bughunt2_combat_qa.test.ts`)  
**Build & Typecheck**: `npx tsc --noEmit` (PASS, 0 errors), `npm run build` (PASS, 0 errors)

---

## 1. Observation

Direct code observations and empirical execution outputs across the 6 adversarial challenge domains:

### Challenge 1: Piercing Penetration Against Helper Drones
- **Code Observation (`src/game/GameManager.ts:2068-2098`)**:
  ```typescript
  if (bullet.faction !== Faction.PLAYER) {
    let hitHelper = false;
    for (const helper of this.helpers) {
      const helperKey = (helper as any).id || helper;
      if (!helper.isExpired() && !(bullet.hitEntities as Set<any>).has(helper) && ... && bullet.checkCollision(helper)) {
        (bullet.hitEntities as Set<any>).add(helper);
        if (!helper.isInvincible) helper.hp -= bullet.damage;
        if (bullet.piercing > 1) {
          bullet.piercing--;
        } else {
          bullet.piercing = 0;
          bullet.isDead = true;
          hitHelper = true;
          break;
        }
      }
    }
  ```
- **Empirical Test Observation (`CH-01.1`, `CH-01.2`, `CH-01.4`)**:
  - A bullet with `piercing = 2`, `damage = 2` impacts Helper 1 (`hp: 10 -> 8`), decrements `piercing` from 2 to 1, remains alive (`isDead = false`), and on the subsequent step reaches Helper 2, dealing 2 damage (`hp: 10 -> 8`), exhausting `piercing` to 0, and terminating (`isDead = true`).
  - When placed in front of the player, Helper absorbs 1 damage, `piercing` drops to 1, and the bullet continues to strike the player behind it, dealing damage and setting player i-frames.
  - Multi-frame CCD deduplication was verified: a bullet spending 15 consecutive frames within a Helper hitbox deals damage exactly once and decrements piercing exactly once.

### Challenge 2: Barricade Zero-HP Phantom Collisions
- **Code Observation (`src/game/GameManager.ts:1819-1844`)**:
  ```typescript
  for (const barricade of this.barricades) {
    if (!barricade.isDead && !bullet.hitEntities.has(barricade) && bullet.checkCollision(barricade)) {
      bullet.hitEntities.add(barricade);
      ...
      barricade.hp -= bullet.damage;
      if (barricade.hp <= 0) {
        barricade.hp = 0;
        barricade.isDead = true;
      }
  ```
- **Empirical Test Observation (`CH-02.1`, `CH-02.2`, `CH-02.3`)**:
  - In a same-tick multi-bullet barrage (3 bullets hitting a 2-HP barricade simultaneously in the same frame): Bullet 0 deals 2 damage, setting `barricade.hp = 0` and `barricade.isDead = true`.
  - In the exact same frame loop, Bullets 1 and 2 check `!barricade.isDead`, evaluate to `false`, do not collide, remain alive, do not have `barricade` added to `hitEntities`, and continue traveling forward without ghost collisions.
  - When pre-destroyed (`isDead = true`), both hostile and player bullets pass through with zero drag, zero damage loss, and zero ghost hits.

### Challenge 3: Barricade Voxel Reconstruction
- **Code Observation (`src/game/Barricade.ts:40-64`)**:
  ```typescript
  const targetActiveBlocks = Math.min(this.blocks.length, Math.max(0, Math.round((this.hp / this.maxHp) * this.blocks.length)));
  let currentActive = this.blocks.filter(b => b).length;
  ...
  while (currentActive < targetActiveBlocks && attempts < 200) {
    attempts++;
    const idx = Math.floor(Math.random() * this.blocks.length);
    if (!this.blocks[idx]) {
      this.blocks[idx] = true;
      currentActive++;
    }
  }
  ```
- **Empirical Test Observation (`CH-03.1`, `CH-03.2`, `CH-03.3`, `CH-03.4`)**:
  - When `hp = 35` or `hp = 10000` with `maxHp = 20`, `targetActiveBlocks` is strictly clamped by `Math.min(this.blocks.length, ...)` to 24 (`this.blocks.length`).
  - Execution terminates in < 2ms (no infinite loop). All 24 blocks are reconstructed, and the `attempts < 200` guard prevents stalls.
  - Negative HP (`hp = -100`) clamps `hp` to 0, sets `isDead = true`, and sets active blocks to 0.

### Challenge 4: Saboteur Lateral Traversal
- **Code Observation (`src/game/Enemy.ts:412-440`)**:
  ```typescript
  const latchY = targetBarricade.position.y - this.size.height + 2;
  const horizontalContact = this.position.x < targetBarricade.position.x + targetBarricade.size.width &&
                            this.position.x + this.size.width > targetBarricade.position.x;
  if (horizontalContact && this.position.y >= latchY - 2) {
    this.position.y = latchY;
    this.isGnawing = true;
    ...
  } else {
    this.isGnawing = false;
    if (this.position.y < latchY) {
      this.position.y = Math.min(latchY, this.position.y + 30 * clampedDt * validSpeedMultiplier);
    } else {
      this.position.y = latchY;
    }
  ```
- **Empirical Test Observation (`CH-04.1`, `CH-04.2`, `CH-04.3`)**:
  - Central barricade 1 was destroyed while Saboteur was latched at `latchY = 690`.
  - Over a 120-frame traversal simulation towards central barricade 2, Saboteur's `y` position remained strictly `<= latchY` (690) across 100% of frames (0 frames plunged towards the player lane).
  - When all 4 barricades were destroyed, Saboteur resumed descending (`y > 690`) towards the player lane as intended.

### Challenge 5: Diver-Barricade Collision
- **Code Observation (`src/game/GameManager.ts:2150-2163`)**:
  ```typescript
  for (const barricade of this.barricades) {
    if (!barricade.isDead && enemy.checkCollision(barricade)) {
      if (enemy.type === EnemyType.DIVER) {
        enemy.isDead = true;
        if (barricade.type === BarricadeType.DESTRUCTIBLE) {
          barricade.hp -= 20;
          if (barricade.hp <= 0) {
            barricade.hp = 0;
            barricade.isDead = true;
          }
        }
        ...
        break; // IMMEDIATELY EXITS BARRICADE LOOP
      }
    }
  }
  ```
- **Empirical Test Observation (`CH-05.1`, `CH-05.2`, `CH-05.3`)**:
  - Adversarial geometry test: Two barricades placed with touching/overlapping boundary (`x: 200..260` and `x: 259..319`). A diving Diver was placed at `x: 250..280`, overlapping BOTH barricades simultaneously.
  - Upon running collision resolution, Diver impacted Barricade A, dealt 20 damage (destroying it), set `enemy.isDead = true`, and executed `break;`.
  - Barricade B received exactly 0 damage and remained at 20 HP (`isDead = false`).
  - Stone barricade test: Diver impacted stone barricade, diver was destroyed, stone remained at 20 HP, and adjacent destructible barricade received 0 damage.

### Challenge 6: Late-Game Wave Speed Limits
- **Code Observation (`src/game/Enemy.ts:237, 251`)**:
  ```typescript
  if (type === EnemyType.ZIGZAG) {
    this.speedX = Math.min(350, this.speedX + this.level * 10 + 50); // clamped to max 350 px/s
  } else if (type === EnemyType.DIVER) {
    this.speedX = Math.min(350, this.speedX + this.level * 8);
  }
  ```
- **Empirical Test Observation (`CH-06.1`, `CH-06.2`, `CH-06.3`, `CH-06.4`)**:
  - Full wave sweep from Wave 1 to Wave 150 confirmed `zigzag.speedX <= 350` and `diver.speedX <= 350` at every single wave.
  - Extreme milestone stress test (Waves 200, 500, 1000, 9999) confirmed `speedX` is exactly 350 px/s.
  - Diver runtime test: Horizontal pre-dive speed is <= 350 px/s; during dive (`isDiving = true`), descent is purely vertical with 0.00px lateral displacement.
  - Zigzag linear speed component strictly satisfies the 350 px/s ceiling (`currentSpeedX <= 350`).

---

## 2. Logic Chain

1. **Helper Piercing**:
   - Given `bullet.piercing > 1`, `bullet.piercing--` executes and `bullet.isDead` remains `false`.
   - The loop does not terminate early with `hitHelper = true`, allowing the bullet to proceed to the next entity in the traversal path.
   - Therefore, a bullet with `piercing = 2` damages a helper, decrements to 1, and continues traveling to hit another helper or the player behind it.

2. **Phantom Collision Elimination**:
   - Given that `barricade.isDead` is set to `true` immediately when `barricade.hp <= 0` during the collision loop, any subsequent bullet in `this.bullets` evaluated within the same tick checks `!barricade.isDead`.
   - Because `!barricade.isDead` evaluates to `false`, the collision check is bypassed.
   - Therefore, no ghost collisions or damage absorption occur for destroyed barricades.

3. **Voxel Reconstruction Safety**:
   - Given that `targetActiveBlocks = Math.min(this.blocks.length, Math.max(0, Math.round((this.hp / this.maxHp) * this.blocks.length)))`, any value of `hp > maxHp` evaluates to `targetActiveBlocks = 24`.
   - The while loop `while (currentActive < targetActiveBlocks && attempts < 200)` terminates as soon as `currentActive == 24` or after 200 attempts.
   - Therefore, infinite loops are mathematically impossible.

4. **Saboteur Vertical Clamping**:
   - Given `else { if (this.position.y < latchY) { ... } else { this.position.y = latchY; } }`, whenever Saboteur is at or below `latchY` during lateral movement towards another barricade, `this.position.y` is assigned `latchY`.
   - Therefore, `y` cannot plunge into the player lane while a target barricade exists.

5. **Diver Single-Barricade Exclusivity**:
   - Given `if (enemy.type === EnemyType.DIVER) { enemy.isDead = true; ... break; }`, the inner loop over `this.barricades` breaks immediately upon the first collision.
   - Even if multiple barricades share intersecting coordinates with the Diver, only the first barricade in the array is processed.
   - Therefore, neighboring barricades cannot be damaged on the same frame.

6. **Speed Limits**:
   - Given `Math.min(350, ...)`, horizontal speed is capped at 350 px/s for all waves >= 10.
   - Pre-wave 10 calculations maximums: Zigzag Wave 9 = 170 px/s; Diver Wave 9 = 102 px/s.
   - Therefore, horizontal speeds never exceed 350 px/s across any wave.

---

## 3. Caveats

1. **Zigzag Visual Sinusoidal Wobble**: While `zigzag.speedX` is strictly capped at 350 px/s and linear translation per frame is capped at `350 * dt`, line 570 in `src/game/Enemy.ts` includes `Math.sin(Date.now() / 180 + this.position.y) * 4 * validSpeedMultiplier`. This adds an instantaneous visual weave of ±4px per frame. This is a game design feature defining the "Zigzag" archetype, not a bug, but should be understood as distinct from base linear speed.
2. **First-Run JIT Warmup**: In Node/V8 testing, the first execution of `Barricade.update()` can take ~20-25ms due to JIT compiler parsing, while all subsequent runs take < 1ms. Timers measuring loop termination must account for V8 startup overhead (e.g. `expect(elapsed).toBeLessThan(100)`).

---

## 4. Conclusion

**Verdict: CONFIRMED.**

All six physical, combat, barricade, and crisis mechanics function as specified with zero game-breaking bugs, zero infinite loops, zero phantom collisions, and zero unbounded velocity anomalies.

---

## 5. Verification Method

To independently execute and verify the adversarial physics and combat test suites:

```bash
# Run the adversarial challenge suite
npx playwright test tests/unit/bughunt2_physics_adversarial.test.ts

# Run both combat and physics unit suites
npx playwright test tests/unit/bughunt2_combat_qa.test.ts tests/unit/bughunt2_physics_adversarial.test.ts

# Verify TypeScript compilation
npx tsc --noEmit

# Verify Next.js production build
npm run build
```

**Passing Criteria**:
- All 21 tests in `bughunt2_physics_adversarial.test.ts` pass with 0 failures.
- All 9 tests in `bughunt2_combat_qa.test.ts` pass with 0 failures.
- `npx tsc --noEmit` exits with status 0.
- `npm run build` exits with status 0.

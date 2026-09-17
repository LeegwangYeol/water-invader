# Handoff Report — Physics & Mechanical Edge-Case Survey (Stream C & Stream D)

**Agent**: `survey_exp_physics_cd_1` (Read-Only Exploration Agent)  
**Working Directory**: `/Users/user/src/water-invader/.agents/survey_exp_physics_cd_1`  
**Target Milestone**: Stream C (Weapons, Projectiles & Collision CCD) & Stream D (Factions, Swarms & Boss Mechanics)  
**Detailed Analysis**: `/Users/user/src/water-invader/.agents/survey_exp_physics_cd_1/analysis.md`

---

## 1. Observation

Direct code inspections across `src/game/` revealed the following concrete vulnerabilities:

1. **Immortal Zombie Enemies & Wave Lock via Laser & Torpedo (`BioluminescentLaser.ts`, `CavitationTorpedo.ts`, `Enemy.ts`, `GameManager.ts`)**:
   - `BioluminescentLaser.ts` lines 435–439:
     ```typescript
     if (distSq <= hitRadius * hitRadius) {
       if (typeof (enemy as any).takeDamage === 'function') {
         (enemy as any).takeDamage(damage);
       }
     }
     ```
   - `CavitationTorpedo.ts` lines 343–346:
     ```typescript
     if (typeof (hostile as any).takeDamage === 'function') {
       (hostile as any).takeDamage(appliedDamage);
     }
     ```
   - `Enemy.ts` lines 1110–1139:
     ```typescript
     public takeDamage(damage: number): number {
       ...
       this.hp -= remainingDamage;
       this.hitFlashTimer = 0.08;
       ...
       return remainingDamage;
     }
     ```
   - `GameManager.ts` lines 1740–1744 & 1799–1804:
     ```typescript
     for (let i = 0; i < this.enemies.length; i++) {
       const e = this.enemies[i];
       if (!e.isDead && (e.faction === Faction.INVADER || e.faction === Faction.ROGUE)) {
         remainingHostiles++;
       }
     }
     ```
   - *Direct Fact*: Neither `BioluminescentLaser` nor `CavitationTorpedo` checks `enemy.hp <= 0` or sets `enemy.isDead = true`. `Enemy.takeDamage()` does NOT set `this.isDead = true`. Enemies killed by laser or torpedo remain active with 0 HP, and `remainingHostiles` never reaches 0.

2. **Harpoon Continuous Collision Tunneling (`HydraulicHarpoon.ts`)**:
   - `HydraulicHarpoon.ts` lines 287–314:
     ```typescript
     this.headPosition.y += this.headVelocity.y * deltaTime; // headVelocity.y = -650 px/s
     ...
     if (
       this.headPosition.x >= ex &&
       this.headPosition.x <= ex + ew &&
       this.headPosition.y >= ey &&
       this.headPosition.y <= ey + eh
     )
     ```
   - *Direct Fact*: The check tests a single point at the end of the frame. At 30 FPS, $\Delta y = 21.6\text{ px}$. Splitter mini-enemies (`Enemy.ts:2123`) have height $20\text{ px}$. The harpoon completely jumps over enemies between frames.

3. **Flocking Friendly-Fire Avoidance Lockstep Singularity (`Enemy.ts`)**:
   - `Enemy.ts` lines 1030–1046:
     ```typescript
     const selfCenterX = this.position.x + this.size.width / 2;
     const allyCenterX = this.lastBlockingAlly.position.x + (this.lastBlockingAlly.width ?? this.lastBlockingAlly.size.width) / 2;
     slideDir = selfCenterX <= allyCenterX ? -1 : 1;
     ...
     this.position.x += slideDir * 45 * dt;
     this.slideDir = slideDir;
     this.slideTimer = 1.0;
     ```
   - *Direct Fact*: When two agile allies share identical X coordinates (`selfCenterX === allyCenterX`), `selfCenterX <= allyCenterX` evaluates to `true` for both. Both set `slideDir = -1`, slide left together, bounce off the left wall together, and remain permanently overlapping with fire suppressed.

4. **IK Tentacle Accordion Crumple Singularity (`KrakenPrimeBoss.ts`)**:
   - `KrakenPrimeBoss.ts` lines 96–105:
     ```typescript
     const dx = targetX - prevX;
     const dy = targetY - prevY;
     const targetAngle = Math.atan2(dy, dx);
     ...
     joint.x = prevX + Math.cos(joint.angle) * joint.length;
     joint.y = prevY + Math.sin(joint.angle) * joint.length;
     ```
   - *Direct Fact*: When the target is within $160\text{ px}$ of the root ($y \le 220$), joint $k$ reaches `(targetX, targetY)`. For segment $k+1$, $dx=0, dy=0 \implies \text{atan2}(0,0)=0$ (horizontal right). Segment $k+2$ starts at $x+32, y$, producing $dx=-32, dy=0 \implies \text{atan2}(0,-32)=\pi$ (horizontal left). The tentacle collapses into an alternating $0 \leftrightarrow \pi$ horizontal zigzag.

5. **Phase 2 Maw Inhalation Unrecoverable Player Pin Lock (`KrakenPrimeBoss.ts`)**:
   - `KrakenPrimeBoss.ts` lines 406–412:
     ```typescript
     const dy = Math.max(40, player.position.y - this.position.y);
     const kFactor = 14500;
     const pullSpeed = (kFactor / Math.pow(dy, 1.2)); // ~220 px/s near middle
     player.position.y = Math.max(220, player.position.y - pullSpeed * deltaTime);
     ```
   - *Direct Fact*: In Phase 2, `player.position.y` is unconditionally pulled upward. When encumbered by Hadal Clingers (`HadalBioHorrors.ts:325`), downward speed drops to $75\text{ px/s}$. Since $pullSpeed \ge 175\text{ px/s}$, net downward velocity is $-100\text{ px/s}$. The player cannot descend and is permanently trapped at $y = 220$ directly in front of the mouth.

6. **Phase 3 Breach Charge Boundary Violation & Teleport Pop (`KrakenPrimeBoss.ts`)**:
   - `KrakenPrimeBoss.ts` lines 452–456 & 337–343:
     ```typescript
     if (this.position.x < -100 || this.position.x > 700) {
       this.position.x = this.chargeDir > 0 ? 550 : 50;
     }
     ...
     if (this.position.x < 180) { this.position.x = 180; ... }
     else if (this.position.x > 420) { this.position.x = 420; ... }
     ```
   - *Direct Fact*: Resetting to $x = 550$ extends the $540\text{px}$-wide boss to $x = 820$ ($220\text{px}$ off-screen). On the next frame, line 340 snaps $550 \to 420$, causing a $130\text{px}$ instant teleport pop.

7. **Broodmother Unbounded Velocity Multiplication (`HadalBioHorrors.ts`)**:
   - `HadalBioHorrors.ts` lines 565–568:
     ```typescript
     for (const u of this.units) {
       u.velocity.x *= 1.3;
       u.velocity.y *= 1.3;
     }
     ```
   - *Direct Fact*: Executed every $14\text{s}$ without an upper speed clamp. Within $140\text{s}$, speeds compound by $13.78\times$ ($>2,400\text{ px/s}$), causing total collision tunneling across the canvas.

8. **Dead Code in Kraken Missile Swat (`KrakenPrimeBoss.ts`)**:
   - `KrakenPrimeBoss.ts` line 357: `if (!b.isDead && ((b as any).isHoming || (b as any).homing))`
   - *Direct Fact*: Neither `isHoming` nor `homing` exists on `HomingMissile` in `Bullet.ts`. The check is always falsy.

---

## 2. Logic Chain

1. **Chain A: Lethal Weapon Hits $\implies$ Immortal Enemies $\implies$ Infinite Wave Lock**
   - Step 1: Player fires Bioluminescent Laser (`BioluminescentLaser.ts:437`) or Cavitation Torpedo (`CavitationTorpedo.ts:344`).
   - Step 2: Raycast / radial distance check passes; `(enemy as any).takeDamage(damage)` is invoked.
   - Step 3: `Enemy.takeDamage()` subtracts HP; `this.hp` reaches 0 or negative.
   - Step 4: `Enemy.takeDamage()` does not touch `this.isDead`. `this.isDead` remains `false`.
   - Step 5: `GameManager.checkCollisions()` does not process laser or torpedo hits.
   - Step 6: In `GameManager.update()`, `remainingHostiles` filters on `!e.isDead`.
   - Step 7: Since `e.isDead === false`, `remainingHostiles` is never 0.
   - Step 8: Wave clear condition `remainingHostiles === 0` never triggers. Game is locked in an infinite wave.

2. **Chain B: Discrete Point Check at High Speed $\implies$ Tunneling**
   - Step 1: Harpoon muzzle speed is $650\text{ px/s}$.
   - Step 2: At $\Delta t = 0.033\text{s}$ (30 FPS), displacement is $21.6\text{ px}$.
   - Step 3: Splitter mini-enemies have height $20\text{ px}$.
   - Step 4: On frame $N$, harpoon tip is below enemy ($y > ey + eh$).
   - Step 5: On frame $N+1$, harpoon tip is above enemy ($y < ey$).
   - Step 6: Point-in-box check returns `false` on both frames.
   - Step 7: Harpoon passes completely through the enemy without collision.

3. **Chain C: Symmetric Avoidance Inequality $\implies$ Permanent Overlap**
   - Step 1: Two agile enemies spawn or get pulled to identical X coordinates (`selfCenterX === allyCenterX`).
   - Step 2: In `hasAlliedObstacleInShotPath`, `slideDir = selfCenterX <= allyCenterX ? -1 : 1`.
   - Step 3: Since `selfCenterX === allyCenterX`, the condition is true for BOTH entities.
   - Step 4: Both entities set `slideDir = -1` and translate by $-45 \cdot \Delta t$.
   - Step 5: Their displacement is identical; their X coordinates remain identical.
   - Step 6: When reaching $x \le 5$, both flip to $+1$ and translate right together.
   - Step 7: They remain permanently overlapping with line-of-sight blocked and fire suppressed.

4. **Chain D: Inverse Kinematics Target Overrun $\implies$ Angle Flip Collapse**
   - Step 1: `CharybdisTentacle` has 5 segments of length $32\text{ px}$ rooted at $y = 140$.
   - Step 2: Target player is at $y \le 220$ during Phase 2 vortex.
   - Step 3: Segment $k$ reaches `(targetX, targetY)`.
   - Step 4: For segment $k+1$, `prevX = targetX, prevY = targetY`, giving $dx = 0, dy = 0$.
   - Step 5: `Math.atan2(0, 0) = 0` forces joint $k+1$ horizontally right to $x + 32$.
   - Step 6: For segment $k+2$, `prevX = targetX + 32`, giving $dx = -32, dy = 0$.
   - Step 7: `Math.atan2(0, -32) = \pi` forces joint $k+2$ horizontally left back to $targetX$.
   - Step 8: The tentacle collapses into a $0 \leftrightarrow \pi$ horizontal zigzag.

---

## 3. Caveats

- **Audio Subsystem**: Audio failures in `soundManager` methods during collisions fallback safely to empty try/catch blocks; audio does not affect physics state.
- **Renderer Decoupling**: Drawing methods (`drawWorld`, `drawHexDeflectorBarrier`, etc.) contain procedural canvas calculations that assume finite inputs; position sanitization in `CrisisSovereign.ts` prevents browser canvas crash, but does not prevent gameplay physics desyncs.
- **No Source Modifications**: As mandated by the user instructions for read-only exploration agents, zero source code files were edited during this survey.

---

## 4. Conclusion

The audit has uncovered eight discrete, actionable bugs spanning Stream C and Stream D. The two most critical issues—**Immortal Zombie Enemies via `takeDamage` (BUG-CD-01/02)** and **Phase 2 Maw Pin Lock (BUG-CD-07)**—directly cause game-breaking state locks and unrecoverable player entrapment.

### Summary of Required Fixes for Implementer:
1. **`Enemy.ts`**: In `takeDamage(damage)`, add:
   ```typescript
   if (this.hp <= 0) {
     this.hp = 0;
     this.isDead = true;
   }
   ```
2. **`HydraulicHarpoon.ts`**: Replace discrete point check in `updateFlying` with swept segment collision from `prevHeadPosition` to `headPosition`.
3. **`Enemy.ts`**: In `hasAlliedObstacleInShotPath`, break tie symmetry when `Math.abs(selfCenterX - allyCenterX) < 1e-3` by comparing entity unique IDs.
4. **`KrakenPrimeBoss.ts`**:
   - In `CharybdisTentacle.updateIK()`, if `Math.hypot(dx, dy) < 4`, hold previous segment angle to avoid $0 \leftrightarrow \pi$ accordion folding.
   - In Phase 2 vortex, allow player to descend by reducing pull speed by $70\%$ when `player.velocity.y > 0`.
   - In Phase 3 breach charge, clamp exit and re-entry coordinates to patrol boundaries ($180 \le x \le 420$) to eliminate the $130\text{px}$ teleport pop.
   - In missile swat line 357, replace `(b as any).isHoming` with `b instanceof HomingMissile`.
5. **`HadalBioHorrors.ts`**: In Broodmother roar, clamp unit velocities to `Math.hypot(vx, vy) <= 400`.
6. **`Helper.ts`**: Add Y-axis boundary clamping: `this.position.y = Math.max(30, Math.min(this.canvasHeight - 50, this.position.y));`.

---

## 5. Verification Method

To independently verify these findings:

1. **Reproduction Test for Bug-CD-01/02 (Zombie Enemies & Wave Lock)**:
   - Spawn an enemy with $HP = 10$.
   - Instantiate `BioluminescentLaserSystem` and call `damageEnemiesAlongSegment` with $damage = 20$.
   - Assert `enemy.hp <= 0`.
   - Assert `enemy.isDead === false` (current buggy state).
   - Advance game manager loop; verify `remainingHostiles > 0` and wave fails to advance.

2. **Reproduction Test for Bug-CD-03 (Harpoon Tunneling)**:
   - Place a $20\text{px}$ high enemy at $y = 300$.
   - Position harpoon head at $y = 325$ with $v_y = -650$.
   - Step harpoon with $\Delta t = 0.05\text{s}$ ($32.5\text{px}$ displacement).
   - Head position becomes $y = 292.5$.
   - Assert harpoon is not tethered and enemy took 0 damage (tunneling confirmed).

3. **Reproduction Test for Bug-CD-05 (Symmetric Lockstep)**:
   - Spawn two agile snipers at identical X coordinates: `new Enemy(200, 100)` and `new Enemy(200, 150)`.
   - Call `fire()` on both enemies.
   - Assert `slideDir === -1` for both entities. Both move to the left together without diverging.

4. **Independent Test Execution**:
   - `npm run build`
   - `npx playwright test`

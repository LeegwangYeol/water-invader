# Comprehensive Physics & Mechanical Edge-Case Survey Report (Stream C & Stream D)

**Author**: `survey_exp_physics_cd_1` (Read-Only Exploration Agent)  
**Date**: 2026-09-17  
**Scope**: 
- **Stream C**: Weapons, Projectiles & Collision Continuous Collision Detection (CCD) (`Bullet.ts`, `HomingMissile`, `BioluminescentLaser.ts`, `HydraulicHarpoon.ts`, `CavitationTorpedo.ts`, `RefractionPrism.ts`, `Entity.ts`, `GameManager.ts`)
- **Stream D**: Factions, Swarms & Boss Mechanics (`Enemy.ts`, `KrakenPrimeBoss.ts`, `CrisisSovereign.ts`, `DimensionalRift.ts`, `AutomatonPhalanx.ts`, `AutomatonShieldGrid.ts`, `HadalBioHorrors.ts`, `AlliedReinforcements.ts`, `Helper.ts`)

---

## Executive Summary

A comprehensive, line-by-line static audit of the Water Invader game physics and mechanics codebase was conducted across Streams C and D. 
Eight critical defect clusters were identified:
1. **Immortal Zombie Enemies & Infinite Wave Lock via Flagship Damage**: `BioluminescentLaser.ts` and `CavitationTorpedo.ts` invoke `enemy.takeDamage(damage)` without checking `enemy.hp <= 0` or setting `enemy.isDead = true`. Because `Enemy.takeDamage()` only decrements `this.hp` and never sets `isDead`, enemies killed by laser hitscan or torpedo shockwaves remain active as 0-HP immortal zombies, permanently blocking `GameManager.update()` wave completion (`remainingHostiles > 0`).
2. **High-Speed Point Collision Tunneling in Hydraulic Harpoon**: `HydraulicHarpoon.ts` launches at $650\text{ px/s}$ using a single discrete point check (`this.headPosition`) without continuous collision detection (CCD) or swept line intersection. At 30 FPS, each step is $21.7\text{ px}$, completely tunneling over enemies with height $\le 20\text{ px}$ (e.g., Splitter minis).
3. **Flocking Friendly-Fire Avoidance Symmetric Lockstep Singularity**: In `Enemy.ts`, when two agile enemies overlap at the exact same X coordinate (`selfCenterX === allyCenterX`), the collision avoidance formula `slideDir = selfCenterX <= allyCenterX ? -1 : 1` resolves to `-1` for both entities. Both slide left in unison, bounce off the left wall together, and remain permanently overlapping with fire suppressed.
4. **Inverse Kinematics Accordion Crumple & Fold Singularity in Kraken Tentacles**: In `KrakenPrimeBoss.ts`, `CharybdisTentacle.updateIK()` computes `targetAngle = Math.atan2(targetY - prevY, targetX - prevX)` per joint. If the submarine is close to the boss root (e.g., $y \le 220$ during Phase 2 vortex), intermediate segments reach `(targetX, targetY)` where $dx=0, dy=0$, triggering `atan2(0,0) = 0` and alternating $0 \leftrightarrow \pi$ horizontal flips that crumple the tentacle into a zero-thickness zigzag.
5. **Phase 2 Maw Inhalation Unrecoverable Player Pin Lock**: In `KrakenPrimeBoss.ts`, Phase 2 vortex applies an unconditional upward velocity $v_{\text{pull}} \approx 175\text{--}220\text{ px/s}$. When player speed is reduced by Hadal Clingers ($75\text{ px/s}$ downward), net downward velocity is negative ($-100\text{ px/s}$), permanently pinning the player at $y = 220$ directly in front of the mouth with zero escape capability.
6. **Phase 3 Breach Charge Canvas Boundary Violation & 130px Instant Teleportation**: In `KrakenPrimeBoss.ts`, the breach charge travels to $x = -100$ and $x = 700$. When charging terminates, position is reset to $x = 550$ or $x = 50$, leaving the $540\text{px}$-wide boss protruding $220\text{px}$ off-screen. On the subsequent frame, idle clamping snaps the boss from $550 \to 420$ or $50 \to 180$, causing an abrupt 130px visual teleport pop.
7. **Unbounded Exponential Velocity Blowup in Broodmother Roar**: In `HadalBioHorrors.ts`, every 14.0 seconds the Broodmother executes `u.velocity.x *= 1.3; u.velocity.y *= 1.3;` on all living bio-horrors without an upper clamping ceiling. Within 2 minutes, velocities scale by $13.8\times$ ($2,480\text{ px/s}$ for Clingers), instantly bypassing collision checks and tunneling across the screen.
8. **Dead Code in Kraken Missile Swat Defense**: In `KrakenPrimeBoss.ts`, the swat logic queries `(b as any).isHoming || (b as any).homing`, but `HomingMissile` in `Bullet.ts` defines neither property, rendering the entire tentacle swat defensive feature non-functional.

---

## Part 1: Stream C — Weapons, Projectiles & Collision CCD

### 1.1 Projectile Mechanics & Collision Tunneling

#### Location: `src/game/flagship/weapons/HydraulicHarpoon.ts` (Lines 281–346)
```typescript
287: this.headPosition.y += this.headVelocity.y * deltaTime;
288: this.headPosition.x += this.headVelocity.x * deltaTime;
...
308: // Bounding box hit check
309: if (
310:   this.headPosition.x >= ex &&
311:   this.headPosition.x <= ex + ew &&
312:   this.headPosition.y >= ey &&
313:   this.headPosition.y <= ey + eh
314: ) {
```
- **Analysis**:
  - `launchSpeed` is $650\text{ px/s}$ (`headVelocity.y = -650`).
  - The collision check evaluates ONLY the instantaneous head point `(headPosition.x, headPosition.y)`.
  - At $60\text{ FPS}$ ($\Delta t = 0.0166\text{s}$), displacement per frame is $10.8\text{ px}$.
  - At $30\text{ FPS}$ ($\Delta t = 0.0333\text{s}$), displacement per frame is $21.6\text{ px}$.
  - At $20\text{ FPS}$ ($\Delta t = 0.05\text{s}$), displacement per frame is $32.5\text{ px}$.
  - Splitter mini-enemies (`Enemy.ts:2123`) have size $20 \times 20\text{ px}$. Normal enemies have height $24\text{--}30\text{ px}$.
  - If on frame $N$, `headPosition.y = ey + eh + 5` and on frame $N+1$, `headPosition.y = ey - 10`, the harpoon completely skips the enemy hitbox.
  - **Proposed Fix**: Implement continuous ray/swept segment collision between `prevHeadPosition` and `headPosition` using segment-to-box intersection or sub-stepped ray marching ($ds \le 8\text{ px}$).

---

### 1.2 Immortal Zombie Enemies & Infinite Wave Lock

#### Location: `src/game/flagship/weapons/BioluminescentLaser.ts` (Lines 410–441)
```typescript
435: if (distSq <= hitRadius * hitRadius) {
436:   if (typeof (enemy as any).takeDamage === 'function') {
437:     (enemy as any).takeDamage(damage);
438:   }
439: }
```
#### Location: `src/game/flagship/weapons/CavitationTorpedo.ts` (Lines 343–346, 199–201)
```typescript
343: if (typeof (hostile as any).takeDamage === 'function') {
344:   (hostile as any).takeDamage(appliedDamage);
345: }
```
#### Location: `src/game/Enemy.ts` (Lines 1110–1139)
```typescript
1110: public takeDamage(damage: number): number {
...
1131:   this.hp -= remainingDamage;
1132:   this.hitFlashTimer = 0.08;
1133: 
1134:   if (this.type === EnemyType.ROGUE_PHANTOM && this.hp > 0) {
1135:     this.checkPhaseDash();
1136:   }
1137: 
1138:   return remainingDamage;
1139: }
```
#### Location: `src/game/GameManager.ts` (Lines 1739–1745, 1798–1805)
```typescript
1739: // In-place compaction for enemies
1740: for (let i = 0; i < this.enemies.length; i++) {
1741:   const e = this.enemies[i];
1742:   if (!e.isDead) {
1743:     this.enemies[enemyWriteIdx++] = e;
1744:   }
1745: }
...
1798: // Multi-Faction Wave Clear Logic
1799: for (let i = 0; i < this.enemies.length; i++) {
1800:   const e = this.enemies[i];
1801:   if (!e.isDead && (e.faction === Faction.INVADER || e.faction === Faction.ROGUE)) {
1802:     remainingHostiles++;
1803:   }
1804: }
```
- **Analysis**:
  - In standard bullet collisions (`GameManager.ts:2095`), death is handled explicitly:
    ```typescript
    if (enemy.hp <= 0) { enemy.isDead = true; this.handleEnemyKill(enemy, bullet); ... }
    ```
  - However, `Enemy.takeDamage()` does NOT mutate `this.isDead`.
  - When `BioluminescentLaser` or `CavitationTorpedo` deals lethal damage via `enemy.takeDamage()`, `enemy.hp` falls to $\le 0$, but `enemy.isDead` remains `false`.
  - The enemy continues living, moving, and firing while at zero or negative health.
  - In `GameManager.update()`, `remainingHostiles` checks `!e.isDead`. Since `isDead` is never set to `true`, `remainingHostiles` remains $\ge 1$, permanently preventing the wave from ever ending.
  - **Proposed Fix**: In `Enemy.takeDamage()`, if `this.hp <= 0`, set `this.isDead = true`. Alternatively, in `BioluminescentLaser.ts` and `CavitationTorpedo.ts`, check `if ((enemy as any).hp <= 0) { enemy.isDead = true; ... }` (matching the pattern in `HydraulicHarpoon.ts:318, 485, 641`).

---

### 1.3 Asymmetric CCD & Swept AABB Over-Approximation

#### Location: `src/game/Entity.ts` (Lines 39–65, 81–115)
```typescript
39: public getSweptRect(): Rect {
40:   if (!this.prevPosition) {
41:     return this.getRect();
42:   }
43:   const minX = Math.min(this.prevPosition.x, this.position.x);
44:   const maxX = Math.max(this.prevPosition.x + this.size.width, this.position.x + this.size.width);
45:   const minY = Math.min(this.prevPosition.y, this.position.y);
46:   const maxY = Math.max(this.prevPosition.y + this.size.height, this.position.y + this.size.height);
47:   return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
48: }
```
- **Analysis**:
  - `getSweptRect()` generates an axis-aligned bounding box covering the entire trajectory rectangle.
  - For steep diagonal trajectories (e.g., Homing Missile turning laterally or diagonal sniper shots moving from $(100, 700) \to (300, 200)$), the bounding box is $[100, 310] \times [200, 712]$ ($210 \times 512\text{ px}$).
  - Any entity located anywhere inside this giant box triggers a collision, even if the bullet was hundreds of pixels away from that point (false positive collision / ghost hits).
  - Furthermore, `Player.ts` does not maintain `prevPosition`. In `GameManager.ts:2183`, `bullet.checkCollision(this.player)` only sweeps the bullet against the player's instantaneous position. If the player dashes across a vertical bullet stream, the player tunnels through the projectiles.

---

### 1.4 Homing Missile Steering Singularity & NaN Vector Corruption

#### Location: `src/game/Bullet.ts` (Lines 285–305)
```typescript
291: const targetAngle = Math.atan2(targetY - myY, targetX - myX);
292: const deltaTheta = Math.atan2(Math.sin(targetAngle - this.angle), Math.cos(targetAngle - this.angle));
293: const maxTurn = this.turnRate * deltaTime;
294: this.angle += Math.max(-maxTurn, Math.min(maxTurn, deltaTheta));
...
299: this.velocity.x = Math.cos(this.angle) * this.currentSpeed;
300: this.velocity.y = Math.sin(this.angle) * this.currentSpeed;
```
- **Analysis**:
  - When `targetY === myY` and `targetX === myX` (zero distance upon contact):
    - `Math.atan2(0, 0) = 0` (pointing directly East/Right).
    - If the missile was ascending vertically at $-\pi/2$, `deltaTheta = \pi/2$, causing an immediate right-angle steering jerk.
  - If `target.position.x` or `target.position.y` is `NaN`:
    - `targetAngle = NaN`, `deltaTheta = NaN`, `this.angle = NaN`.
    - `velocity.x = NaN`, `velocity.y = NaN`.
    - Positions become `NaN`. The missile pushes `{x: NaN, y: NaN}` into `smokeTrail`, causing Canvas 2D matrix corruption during `ctx.translate(cx, cy)`.
  - **Proposed Fix**: Guard target angle calculation with `const distSq = (targetX - myX)**2 + (targetY - myY)**2; if (distSq > 1e-4) { ... }` and validate `Number.isFinite(targetX) && Number.isFinite(targetY)`.

---

## Part 2: Stream D — Factions, Swarms & Boss Mechanics

### 2.1 Flocking Friendly-Fire Avoidance Symmetric Lockstep Singularity

#### Location: `src/game/Enemy.ts` (Lines 1021–1048)
```typescript
1030: if (isAgile) {
1031:   let slideDir = 1;
1032:   if (this.lastBlockingAlly) {
1033:     const selfCenterX = this.position.x + this.size.width / 2;
1034:     const allyCenterX = this.lastBlockingAlly.position.x + (this.lastBlockingAlly.width ?? this.lastBlockingAlly.size.width) / 2;
1035:     slideDir = selfCenterX <= allyCenterX ? -1 : 1;
1036:   }
1037:   if (this.position.x <= 5 && slideDir < 0) {
1038:     slideDir = 1;
1039:   } else if (this.position.x + this.size.width >= this.canvasWidth - 5 && slideDir > 0) {
1040:     slideDir = -1;
1041:   }
1042:   const dt = 1 / 60;
1043:   this.position.x += slideDir * 45 * dt;
1044:   this.position.x = Math.max(0, Math.min(this.position.x, this.canvasWidth - this.size.width));
1045:   this.slideDir = slideDir;
1046:   this.slideTimer = 1.0;
1047: }
```
- **Analysis**:
  - When two same-type agile enemies (e.g., two Snipers or two Stalkers) overlap at identical X coordinates (`selfCenterX === allyCenterX`):
    - Entity A evaluates `selfCenterX <= allyCenterX` $\to$ `true` $\to$ `slideDir = -1`.
    - Entity B evaluates `selfCenterX <= allyCenterX` $\to$ `true` $\to$ `slideDir = -1`.
  - Both entities receive `slideDir = -1` and slide to the left simultaneously.
  - Because they move at the exact same velocity ($45\text{ px/s}$), their X coordinates remain identical.
  - Upon reaching the left wall (`position.x <= 5`), both flip to `slideDir = 1` and slide to the right in unison.
  - Since they never separate, both entities remain blocked by each other, keeping their fire permanently suppressed.
  - **Proposed Fix**: Break tie symmetry when `Math.abs(selfCenterX - allyCenterX) < 1e-3` by comparing entity unique IDs (`this.id < this.lastBlockingAlly.id ? -1 : 1`) or using pseudo-random dispersion.

---

### 2.2 Inverse Kinematics Accordion Crumple in Kraken Tentacles

#### Location: `src/game/flagship/factions/KrakenPrimeBoss.ts` (Lines 86–109)
```typescript
91: for (let i = 0; i < segCount; i++) {
92:   const joint = this.joints[i];
93:   const wave = Math.sin(time * 3 + this.waveOffset + i * 0.8) * 0.45;
94:   
95:   // Target direction influence
96:   const dx = targetX - prevX;
97:   const dy = targetY - prevY;
98:   const targetAngle = Math.atan2(dy, dx);
99: 
100:  // Blend target angle with wave undulation
101:  const blend = (i + 1) / segCount;
102:  joint.angle = (1 - blend * 0.6) * (Math.PI / 2 + wave) + blend * 0.6 * targetAngle;
103: 
104:  joint.x = prevX + Math.cos(joint.angle) * joint.length;
105:  joint.y = prevY + Math.sin(joint.angle) * joint.length;
106: 
107:  prevX = joint.x;
108:  prevY = joint.y;
109: }
```
- **Analysis**:
  - In `CharybdisTentacle`, segment length is $32\text{ px}$ with 5 segments (total length $160\text{ px}$).
  - In Phase 2, the player is pulled upward to $y \approx 220\text{ px}$. The tentacle root is at $y = 140\text{ px}$ ($300 + \text{offset}, 140$).
  - When the distance to the target is less than $160\text{ px}$, joint $k$ ($k \in [1, 4]$) can land directly on `(targetX, targetY)`.
  - On the next segment $k+1$, `prevX = targetX, prevY = targetY`, resulting in $dx = 0, dy = 0$.
  - `Math.atan2(0, 0)` returns `0`. Segment $k+1$ snaps horizontally right ($0\text{ rad}$).
  - Segment $k+2$ starts at `targetX + 32, targetY`. For segment $k+2$, $dx = -32, dy = 0$, yielding `Math.atan2(0, -32) = \pi$. Segment $k+2$ snaps horizontally left ($\pi\text{ rad}$).
  - This produces an alternating $0 \leftrightarrow \pi$ horizontal crumple singularity where segments fold over each other like an accordion.
  - **Proposed Fix**: Add distance threshold: if `Math.hypot(dx, dy) < 4`, maintain the previous segment's angle (`targetAngle = this.joints[i - 1]?.angle ?? (Math.PI / 2)`) rather than querying `Math.atan2(0, 0)`.

---

### 2.3 Phase 2 Maw Inhalation Unrecoverable Player Pin Lock

#### Location: `src/game/flagship/factions/KrakenPrimeBoss.ts` (Lines 406–413)
```typescript
406: const dy = Math.max(40, player.position.y - this.position.y);
407: const kFactor = 14500;
408: const pullSpeed = (kFactor / Math.pow(dy, 1.2)); // ~220 px/s near middle
409: this.activeBoss.vortexPullForce = pullSpeed;
410: 
411: // Pull player upward toward the maw!
412: player.position.y = Math.max(220, player.position.y - pullSpeed * deltaTime);
```
- **Analysis**:
  - `player.position.y` is modified directly every frame by subtracting `pullSpeed * deltaTime`.
  - At $dy = 40$, $pullSpeed = 175.7\text{ px/s}$. At $dy = 110$ (when player is at $y = 220$), $pullSpeed \approx 51.4\text{ px/s}$.
  - When the player is encumbered by Hadal Clingers (`HadalBioHorrors.ts:325`), player speed drops by up to $75\%$ to $75\text{ px/s}$.
  - If player speed is $75\text{ px/s}$ downward while $pullSpeed = 175\text{ px/s}$ upward, the net vertical movement is $-100\text{ px/s}$ (upward).
  - The player cannot descend away from the maw. The player remains permanently pinned against $y = 220$, suffering unavoidable tooth shrapnel damage ($130\text{ px}$ spawn point).
  - **Proposed Fix**: Apply vortex pull as a force in `player.velocity.y` rather than direct coordinate mutation, or provide a directional escape bonus when the player holds Down/S (`if (player.velocity.y > 0) pullSpeed *= 0.35`).

---

### 2.4 Phase 3 Breach Charge Boundary Violation & 130px Teleportation

#### Location: `src/game/flagship/factions/KrakenPrimeBoss.ts` (Lines 337–343, 450–456)
```typescript
450: if (this.isCharging) {
451:   this.position.x += this.chargeDir * this.chargeSpeed * deltaTime;
452:   if (this.position.x < -100 || this.position.x > 700) {
453:     this.isCharging = false;
454:     this.chargeCooldown = 6.0;
455:     this.position.x = this.chargeDir > 0 ? 550 : 50;
456:   }
...
337: if (this.position.x < 180) {
338:   this.position.x = 180;
339:   this.velocity.x = Math.abs(this.velocity.x);
340: } else if (this.position.x > 420) {
341:   this.position.x = 420;
342:   this.velocity.x = -Math.abs(this.velocity.x);
343: }
```
- **Analysis**:
  - The boss has width $540\text{ px}$ (`halfW = 270`).
  - At `position.x = 550`, the right half extends to $x = 820$ ($220\text{ px}$ beyond the $600\text{ px}$ canvas limit).
  - When charging completes, on the very next frame, line 340 detects `this.position.x > 420` (550 > 420) and snaps `this.position.x = 420`.
  - This produces an instantaneous $130\text{ px}$ teleport ($550 \to 420$ or $50 \to 180$), creating an abrupt visual pop and hitbox teleportation that violates the project's non-teleportation guidelines.
  - **Proposed Fix**: Re-enter the screen with continuous deceleration or set target entry coordinates to the boundary patrol margin ($420$ or $180$).

---

### 2.5 Unbounded Velocity Growth in Broodmother Roar

#### Location: `src/game/flagship/factions/HadalBioHorrors.ts` (Lines 560–569)
```typescript
560: unit.pheromoneTimer = (unit.pheromoneTimer || 0) + deltaTime;
561: if (unit.pheromoneTimer >= 14.0) {
562:   unit.pheromoneTimer = 0;
...
565:   for (const u of this.units) {
566:     u.velocity.x *= 1.3;
567:     u.velocity.y *= 1.3;
568:   }
569: }
```
- **Analysis**:
  - Every $14.0\text{ seconds}$, all living units have velocity scaled by $1.3\times$.
  - There is no upper limit or velocity clamping (`Math.hypot(vx, vy) <= maxSpeed`).
  - After 5 cycles ($70\text{s}$), speed increases by $3.71\times$.
  - After 10 cycles ($140\text{s}$), speed increases by $13.78\times$.
  - Clingers dive at $2,480\text{ px/s}$, traversing the entire $800\text{px}$ canvas in $0.32\text{ seconds}$ and causing complete collision tunneling.
  - **Proposed Fix**: Clamp unit speeds to a maximum threshold ($v_{\text{max}} \le 400\text{ px/s}$).

---

### 2.6 Dead Code in Kraken Tentacle Missile Swat

#### Location: `src/game/flagship/factions/KrakenPrimeBoss.ts` (Lines 356–366)
```typescript
356: for (const b of bullets) {
357:   if (!b.isDead && ((b as any).isHoming || (b as any).homing)) {
...
361:     b.isDead = true;
362:     createExplosion(b.position.x, b.position.y, '#38bdf8', 15, 1.3);
363:     break;
364:   }
365: }
```
- **Analysis**:
  - `HomingMissile` in `Bullet.ts` has no `isHoming` or `homing` property.
  - `((b as any).isHoming || (b as any).homing)` is always `undefined` / `falsy`.
  - The entire missile swatting defense never triggers.
  - **Proposed Fix**: Replace with `b instanceof HomingMissile`.

---

### 2.7 Missing Y-Axis Boundary Clamping on Allied Helpers

#### Location: `src/game/Helper.ts` (Lines 400–405)
```typescript
400: // Clamp within canvas bounds
401: if (this.position.x < 0) this.position.x = 0;
402: if (this.position.x + this.size.width > this.canvasWidth) {
403:   this.position.x = this.canvasWidth - this.size.width;
404: }
```
- **Analysis**:
  - Only X coordinate is clamped.
  - `position.y` is completely unconstrained against $0$ and `canvasHeight`.
  - If a Medic or Repair Bot follows an entity outside the canvas, it remains permanently out of bounds.
  - **Proposed Fix**: Clamp Y: `this.position.y = Math.max(20, Math.min(this.canvasHeight - 50, this.position.y));`.

---

## Part 3: Matrix of Findings & Severity Classification

| Ref # | Subsystem | File | Lines | Issue Description | Severity | Impact |
|---|---|---|---|---|---|---|
| **BUG-CD-01** | Stream C (Weapons) | `BioluminescentLaser.ts` | 435–439 | Laser calls `enemy.takeDamage()` without setting `isDead = true` on lethal damage. | **CRITICAL** | Immortal zombie enemies; infinite wave lock |
| **BUG-CD-02** | Stream C (Weapons) | `CavitationTorpedo.ts` | 343–346 | Torpedo shockwave calls `hostile.takeDamage()` without setting `isDead = true`. | **CRITICAL** | Immortal zombie enemies; infinite wave lock |
| **BUG-CD-03** | Stream C (Weapons) | `HydraulicHarpoon.ts` | 308–314 | Discrete point hit check at $650\text{ px/s}$ causes high-speed collision tunneling. | **HIGH** | Projectile passes through enemies without hitting |
| **BUG-CD-04** | Stream C (Weapons) | `Bullet.ts` (`HomingMissile`) | 291–304 | `Math.atan2(0,0)` steering singularity on zero distance / NaN coordinate propagation. | **MEDIUM** | Sudden 90-deg angle snap or NaN visual transform |
| **BUG-CD-05** | Stream D (Factions) | `Enemy.ts` | 1033–1045 | Friendly fire avoidance symmetric lockstep when entities share identical X coordinate. | **HIGH** | Permanent fire suppression & synchronized wandering |
| **BUG-CD-06** | Stream D (Bosses) | `KrakenPrimeBoss.ts` | 96–109 | Inverse Kinematics tentacle accordion folding singularity when distance $\le 160\text{px}$. | **HIGH** | Tentacle crumples into $0 \leftrightarrow \pi$ horizontal zigzag |
| **BUG-CD-07** | Stream D (Bosses) | `KrakenPrimeBoss.ts` | 406–413 | Phase 2 vortex upward pull ($175\text{ px/s}$) overpowers encumbered player ($75\text{ px/s}$). | **CRITICAL** | Unrecoverable player pin lock against mouth at $y=220$ |
| **BUG-CD-08** | Stream D (Bosses) | `KrakenPrimeBoss.ts` | 455, 337–343 | Phase 3 breach charge resets to $x=550$, followed by instantaneous $130\text{px}$ snap to $420$. | **MEDIUM** | Visual popping / telefragging beyond canvas border |
| **BUG-CD-09** | Stream D (Factions) | `HadalBioHorrors.ts` | 565–568 | Unbounded exponential velocity growth ($1.3\times$ per $14\text{s}$) during Broodmother roar. | **HIGH** | Velocity explosion ($>2,400\text{ px/s}$) & tunneling |
| **BUG-CD-10** | Stream D (Bosses) | `KrakenPrimeBoss.ts` | 357 | Missile swat queries nonexistent `isHoming`/`homing` properties on `HomingMissile`. | **LOW** | Dead code: tentacle missile swat never fires |
| **BUG-CD-11** | Stream D (Factions) | `Helper.ts` | 400–405 | Missing vertical Y-axis boundary clamping on Allied vessels. | **MEDIUM** | Drones drift out of logical canvas bounds |
| **BUG-CD-12** | Stream C (Weapons) | `Entity.ts` | 39–65 | Axis-aligned swept AABB creates massive false positive hit envelope for diagonal movement. | **MEDIUM** | Unintended ghost collisions on fast diagonal projectiles |

---

## Part 4: Recommended Remediation Strategy

1. **Fix `Enemy.takeDamage()` and Flagship Lethal Hit Handlers**:
   - Update `Enemy.takeDamage()`: if `this.hp <= 0`, mark `this.hp = 0` and `this.isDead = true`.
   - In `BioluminescentLaser.ts` and `CavitationTorpedo.ts`, verify `if ((enemy as any).hp <= 0) { enemy.isDead = true; }`.
2. **Implement Harpoon Raycast CCD**:
   - Replace point-in-rect check in `HydraulicHarpoon.updateFlying` with segment intersection from `prevHeadPosition` to `headPosition`.
3. **Break Symmetry in Flocking Avoidance**:
   - In `Enemy.hasAlliedObstacleInShotPath`, if `Math.abs(selfCenterX - allyCenterX) < 1e-3`, resolve direction via entity ID tie-breaker (`this.id % 2 === 0 ? 1 : -1`).
4. **Guard Inverse Kinematics in Kraken Tentacles**:
   - In `CharybdisTentacle.updateIK()`, if `Math.hypot(dx, dy) < 4`, hold the previous joint's angle to prevent accordion flipping.
5. **Add Escape Threshold to Phase 2 Maw Vortex**:
   - In `KrakenPrimeBoss.ts`, reduce `pullSpeed` by $70\%$ when player is actively thrusting downwards (`player.velocity.y > 0`).
6. **Clamp Velocity Growth in Bio-Horrors**:
   - In `HadalBioHorrors.ts`, enforce `Math.hypot(u.velocity.x, u.velocity.y) <= 400`.
7. **Fix `HomingMissile` Property Check**:
   - Change `(b as any).isHoming` to `b instanceof HomingMissile` in `KrakenPrimeBoss.ts:357`.
8. **Add Y-Axis Boundary Clamp to Allied Vessels**:
   - Add `this.position.y = Math.max(30, Math.min(this.canvasHeight - 50, this.position.y))` in `Helper.ts`.

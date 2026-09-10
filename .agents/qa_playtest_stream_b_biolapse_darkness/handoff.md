# QA Review & Adversarial Stress-Test Report: Stream B Biolapse Darkness Cycle

- **Target Feature**: Feature 5 — Deep Biolapse & Dynamic Bioluminescent Darkness Cycles
- **Reviewer**: `qa_playtest_stream_b_biolapse_darkness` (Role: reviewer, critic)
- **Verdict**: **REQUEST_CHANGES** (with Critical Findings tagged as **INTEGRITY VIOLATION**)
- **Date**: 2026-09-10T10:57:00Z

---

## 1. Observation

### 1.1 State Machine & Headlight Dynamics Verification
- **File**: `src/game/flagship/environment/BiolapseDarknessCycle.ts:48-53`
  ```typescript
  public readonly diurnalDuration: number = 60.0;
  public readonly twilightDuration: number = 5.0;
  public readonly midnightDuration: number = 25.0;
  public readonly dawnDuration: number = 5.0;
  ```
  Total duration: $60.0 + 5.0 + 25.0 + 5.0 = 95.0$ seconds.
- **Empirical Measurement**:
  - Initial Phase: `DIURNAL`, `ambientLux = 1.0`
  - After 60.0s: `TWILIGHT`, `ambientLux` scales linearly $1.0 \to 0.0$ over 5.0s
  - After 65.0s: `MIDNIGHT`, `ambientLux = 0.0`
  - After 90.0s: `DAWN`, `ambientLux` scales linearly $0.0 \to 1.0$ over 5.0s
  - After 95.0s: Loops back to `DIURNAL`, `ambientLux = 1.0`
- **Headlight Steering**:
  - `getBeamAngle(0) = -90.00°` (straight up, pointing towards $-Y$)
  - `getBeamAngle(300) = -75.00°` ($+15.00°$ tilt)
  - `getBeamAngle(-300) = -105.00°` ($-15.00°$ tilt)
  - Clamping verified: lateral velocities $> 300$ or $< -300$ remain strictly clamped at $\pm 15°$.
- **Cone Half-Angle**:
  - Standard beam: $28.00°$ half-span ($56.00°$ full cone)
  - High-beam overdrive: $38.00°$ half-span ($76.00°$ full cone)
- **Range vs. Battery**:
  - $B = 100$: $440.00$ px
  - $B = 50$: $297.00$ px
  - $B = 0.001$: $154.00$ px
  - $B = 0$: Returns $0.00$ px (`if (this.battery <= 0) return 0;` at line 158).

### 1.2 Battery Thermodynamics Verification
- **Drain Rates**:
  - Standard light active: $-4.00$ units/s (lasts exactly $25.0$s from full charge)
  - High-beam overdrive active: $-10.00$ units/s (lasts exactly $10.0$s from full charge)
- **Recharge Rates**:
  - Light OFF + moving ($|v_x| > 10$): $+3.00$ units/s
  - Light OFF + stationary ($|v_x| \le 10$): $+1.20$ units/s
- **Kill Recharge**:
  - Slain enemies do NOT drop physical crystal items on the field.
  - In `src/game/flagship/FlagshipManager.ts:397-402`, kills in `BiolapsePhase.MIDNIGHT` immediately add $+15$ units directly to `biolapseDarkness.battery`.
  - Kills during `TWILIGHT` or `DAWN` (where darkness is also active) award $0$ battery.

### 1.3 Critical Finding 1: Integrity Violation — Facade Hostile Interaction Mechanics
- **Observation in `src/game/flagship/environment/BiolapseDarknessCycle.ts:368-393`**:
  ```typescript
  if (!this.previouslyIlluminatedEnemyIds.has(enemyId) && this.ambientLux < 0.4) {
    // 0.8s stun
    (enemy as any).isStunned = true;
    (enemy as any).stunTimer = Math.max((enemy as any).stunTimer || 0, 0.8);

    // +25% damage vulnerability for 3.0s
    (enemy as any).vulnerabilityTimer = 3.0;
    (enemy as any).vulnerabilityMultiplier = 1.25;
    ...
  }
  ...
  if (this.ambientLux < 0.3) {
    (enemy as any).isCamouflaged = true; // Prevents homing missile lock
  }
  ```
- **Direct Inspection of `src/game/Enemy.ts` and `src/game/Bullet.ts`**:
  - `grep_search` across `src/game/Enemy.ts` for `isStunned`, `stunTimer`, `vulnerabilityTimer`, and `vulnerabilityMultiplier` returned **0 matches**.
  - `grep_search` across `src/game/Bullet.ts` for `isCamouflaged` returned **0 matches**.
  - In `src/game/Bullet.ts:217`, `HomingMissile.findNearestTarget` specifies:
    ```typescript
    if (!e.isDead && e.faction !== Faction.PLAYER) {
      if (e.position.x >= -60 && ...
    ```
    There is no check for `isCamouflaged`. Homing missiles acquire lock on unlit enemies indiscriminately.
  - In `src/game/Enemy.ts:1066-1088`, `Enemy.takeDamage` calculates:
    ```typescript
    public takeDamage(damage: number): number {
      let remainingDamage = damage;
      if (this.shieldHp > 0) { ... }
      this.hp -= remainingDamage;
      this.hitFlashTimer = 0.08;
      ...
      return remainingDamage;
    }
    ```
    There is no multiplication by `vulnerabilityMultiplier`.
- **Empirical Execution Output (`npx tsx`)**:
  ```
  Unlit enemy isCamouflaged: true
  Unlit enemy speedY before/after (dive haste check): 100
  Homing missile target acquired on unlit enemy?: YES (Target Lock NOT BLOCKED!)
  After illuminated - isStunned: true
  After illuminated - stunTimer: 0.8
  After illuminated - vulnerabilityMultiplier: 1.25
  After illuminated - vulnerabilityTimer: 3
  Does enemy move while isStunned=true?: Y moved from 400 to 410 (Delta: 10 )
  Does enemy decrement stunTimer?: 0.8
  Enemy took damage with vulnerabilityMultiplier=1.25: 10 hp left: 90 (Expected 12.5 damage if vulnerability worked, got: 10 )
  ```

### 1.4 Critical Finding 2: Canvas `destination-out` Composite Rendering Vaporizes World Entities
- **Observation in `src/game/flagship/environment/BiolapseDarknessCycle.ts:418-467`**:
  ```typescript
  // 1. Fullscreen darkness veil (#030712)
  ctx.fillStyle = `rgba(3, 7, 18, ${darknessAlpha})`;
  ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

  // 2. Cut out searchlight beam using destination-out
  if (this.isLightOn && this.battery > 0) {
    ctx.globalCompositeOperation = 'destination-out';
    ...
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(prowX, prowY);
    ctx.arc(prowX, prowY, beamRange, beamAngle - halfAngle, beamAngle + halfAngle);
    ctx.closePath();
    ctx.fill();
    ...
    ctx.globalCompositeOperation = 'source-over';
  ```
- **Execution Context in `src/game/GameManager.ts:2598-2794`**:
  `GameManager.render()` draws all game entities to `this.ctx` in this order:
  1. Starfield / deep water background
  2. Barricades (`b.draw(this.ctx)`)
  3. Player (`this.player.draw(this.ctx)`)
  4. Allies (`h.draw(this.ctx)`)
  5. Enemies (`e.draw(this.ctx)`)
  6. Bullets (`b.draw(this.ctx)`)
  7. Particles (`p.draw(this.ctx)`)
  8. `this.flagshipManager.drawForeground(this.ctx, time)` $\to$ invokes `BiolapseDarknessCycle.renderDarknessOverlay(ctx, ...)`
- **Mathematical & Empirical Compositing Invariant**:
  - `destination-out` replaces destination pixels $D$ by $D \times (1 - S_A)$.
  - Where $S_A = 1.0$ (the center of the searchlight cone), $D_{out} = (0, 0, 0, 0)$.
  - Because this is invoked directly on the primary canvas buffer `this.ctx`, it does NOT simply erase the darkness veil: **it vaporizes all background, player, bullet, and enemy pixels already rendered on `this.ctx` down to full transparency (Alpha 0)**.
  - The browser canvas element (`<canvas className="bg-slate-900" />`) therefore reveals the raw CSS background `#0f172a`, completely erasing in-game entities within the light cone.

### 1.5 Major Finding 3: Keybinding Conflict & On-Screen HUD Desync
- **In-Game HUD in `src/game/flagship/environment/BiolapseDarknessCycle.ts:586`**:
  ```typescript
  ctx.fillText(`BATTERY: ${Math.round(this.battery)}% [F: LIGHT]`, x, y - 6);
  ```
- **Actual Event Routing in `src/game/flagship/FlagshipManager.ts:245-278`**:
  ```typescript
  // 2. Officer skills: [1]/[Q], [2]/[E], [3]/[R], [4]/[F]
  if (isDown) {
    if (['1', '2', '3', '4', 'q', 'Q', 'e', 'E', 'r', 'R', 'f', 'F'].includes(key)) {
      if (this.crewDeck.handleInput && this.crewDeck.handleInput(key, isDown, context)) {
        return true;
      }
    }
  }
  ...
  // 6. Biolapse Searchlight toggle [L], High-Beam [V], Sonar Ping [B]
  if (isDown) {
    if (key === 'l' || key === 'L') {
      this.biolapseDarkness.toggleLight();
      return true;
    }
  ```
- When the player follows the on-screen instruction and presses `F`, the key is intercepted by `crewDeck.handleInput` to trigger Crew Officer Dr. Lyra Vance's Decoy Pod ability. Searchlight toggle is actually bound to `L`.

### 1.6 Build Verification Failure
- Command: `npm run build`
- Output:
  ```
  Creating an optimized production build ...
  ✓ Compiled successfully in 11.5s
  Running TypeScript ...
  tests/playtest_stream_b_vents_currents.spec.ts(95,67): error TS2339: Property 'ELITE' does not exist on type 'typeof EnemyType'.
  tests/stress/stream_f_console_memory_audit.spec.ts(52,18): error TS2367: This comparison appears to be unintentional...
  tests/stress/stream_f_console_memory_audit.spec.ts(526,11): error TS2367: This comparison appears to be unintentional...
  tests/stress/stream_f_console_memory_audit.spec.ts(690,12): error TS18048: 'auditResult.issues' is possibly 'undefined'.
  Failed to type check.
  ```

---

## 2. Logic Chain

1. **Premise 1 (Spec & Pitch Contract)**:
   Per `IDEAS_PITCH.md:479` and `DISPATCH.md`, unlit enemies must gain $+35\%$ dive speed, block homing missile lock, and when illuminated, suffer a $0.8$s stun and $+25\%$ damage vulnerability.
2. **Observation Linking**:
   `BiolapseDarknessCycle.ts:369-393` attaches dynamic properties (`isStunned = true`, `stunTimer = 0.8`, `vulnerabilityMultiplier = 1.25`, `isCamouflaged = true`) to enemy objects using `(enemy as any)`.
3. **Execution Gap**:
   Neither `Enemy.ts` nor `Bullet.ts` has any reference to these properties. In empirical simulation:
   - Stunned enemy traveled $10$px in $0.1$s (identical to unstunned movement).
   - `stunTimer` remained at $0.8$ indefinitely without decay.
   - `takeDamage(10)` dealt exactly $10$ damage (vulnerability multiplier $1.25$ was ignored).
   - Homing missile acquired lock on `isCamouflaged = true` enemy instantly.
   - Dive haste ($+35\%$) does not exist in any source file.
4. **Deduction (Integrity Violation)**:
   This represents a textbook dummy/facade implementation: properties are assigned to satisfy surface appearance or mock tests, but produce zero functional gameplay effect.
5. **Compositing Flaw Linkage**:
   `BiolapseDarknessCycle.renderDarknessOverlay` invokes `ctx.globalCompositeOperation = 'destination-out'` directly on the main canvas `this.ctx` where the game scene is already drawn.
6. **Compositing Deduction**:
   In HTML5 Canvas 2D rasterization, `destination-out` clears destination pixels to $(0, 0, 0, 0)$. Drawing a light cone directly onto `this.ctx` punches a transparent hole through the scene, erasing the submarine, enemies, and bullets inside the illuminated area.

---

## 3. Caveats

1. **Audio Synthesis**:
   Web Audio API sound synthesizers (e.g., $55$Hz searchlight drone, $4.8$kHz capacitor whine, relay click) were not audibly verified via physical speakers as tests run in headless environments; however, AudioContext calls are present in sound management.
2. **Player Velocity Input Source**:
   Headlight tilt dynamically relies on `context.player.velocity.x`. In keyboard-only mode without smooth inertia, velocity snaps between $0$ and $\pm 300$, resulting in an instantaneous $15°$ angular snap rather than smooth rotational damping.
3. **Review-Only Constraint**:
   In accordance with the agent role constraints, no source code modifications were made. All findings are reported for remediation by the implementation team.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

The Biolapse Darkness Cycle exhibits severe integrity and functional defects that block approval:
1. **[CRITICAL / INTEGRITY VIOLATION] Facade Hostile Interaction Mechanics**:
   - The Photonic Flash Shock stun ($0.8$s) and damage vulnerability ($+25\%$) are dummy properties attached to `(enemy as any)` and are completely ignored by `Enemy.ts`.
   - The homing missile lock block (`isCamouflaged`) is completely ignored by `HomingMissile.findNearestTarget()`.
   - The unlit enemy $+35\%$ dive haste is completely absent from the codebase.
2. **[CRITICAL] Canvas Transparency Puncture**:
   - Invoking `destination-out` directly on the primary canvas erases the player, enemies, bullets, and background to alpha $0$, puncturing a hole through to the CSS background instead of illuminating the entities.
   - Fix required: Render darkness and the cutouts onto an offscreen canvas (`OffscreenCanvas` or memory canvas) and blit to the main canvas with `source-over`.
3. **[MAJOR] Control Desync**:
   - The HUD instructs the player to press `[F: LIGHT]`, but Key `F` triggers Crew Officer Lyra's ability, while searchlight toggle is mapped to `L`.
4. **[MAJOR] Repository Build Failure**:
   - `npm run build` fails with 4 TypeScript errors in test files.

---

## 5. Verification Method

### 5.1 Hostile Interaction Facade & Canvas Test
Run the following deterministic verification script from the project root:
```bash
npx tsx -e '
import { BiolapseDarknessCycle } from "./src/game/flagship/environment/BiolapseDarknessCycle";
import { BiolapsePhase } from "./src/game/flagship/types";
import { Enemy, EnemyType } from "./src/game/Enemy";
import { Player } from "./src/game/Player";
import { HomingMissile } from "./src/game/Bullet";

const cycle = new BiolapseDarknessCycle(600, 800);
const enemy = new Enemy(300, 400, 600, 1, EnemyType.DIVER);
const player = new Player(600, 800);
const ctx = { player, enemies: [enemy], bullets: [], barricades: [], helpers: [], particles: [], level: 1, score: 0, currency: 0, createExplosion: () => {}, triggerScreenShake: () => {} };

cycle.currentPhase = BiolapsePhase.MIDNIGHT;
cycle.ambientLux = 0.0;
cycle.update(0.1, ctx);

// 1. Check homing missile lock
const missile = new HomingMissile(300, 700, 5);
console.log("Missile locked on camouflaged enemy:", missile.findNearestTarget([enemy]) === enemy);

// 2. Check stun movement
cycle.isLightOn = true;
cycle.battery = 100;
cycle.update(0.1, ctx);
const yBefore = enemy.position.y;
enemy.update(0.1, 1.0);
console.log("Enemy moved despite stun:", enemy.position.y > yBefore);

// 3. Check vulnerability damage
const dmg = enemy.takeDamage(10);
console.log("Damage taken (10 expected without vulnerability, 12.5 with):", dmg);
'
```
**Invalidation Condition**:
If the script prints:
- `Missile locked on camouflaged enemy: false`
- `Enemy moved despite stun: false`
- `Damage taken: 12.5`
Then the hostile mechanics have been properly implemented.

### 5.2 Build Verification
```bash
npm run build
```
**Invalidation Condition**: Command exits with code 0 and zero TypeScript errors.

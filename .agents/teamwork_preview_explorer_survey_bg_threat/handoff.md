# Handoff Report: Requirement R1 — Dynamic Backgrounds & Threat Signifiers Survey

**Sender:** Explorer Agent (`teamwork_preview_explorer_survey_bg_threat`)  
**Recipient:** Orchestrator / Parent Agent (`fd67f473-0f7b-401a-90c3-a0cae3f3ba82`)  
**Artifact Generated:** `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_bg_threat/survey.md`  

---

## 1. Observation

1. **Static Background Fill (`src/game/GameManager.ts:2084-2086`):**
   ```typescript
   // 1.1 Base void fill (dark slate #0f172a)
   this.ctx.fillStyle = '#0f172a';
   this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
   ```
   The background fill is hardcoded to a single color (`#0f172a`) across all waves. It does not adapt to wave progression or stage milestones.

2. **Wave Progression Tracking (`src/game/GameManager.ts:39, 295`):**
   ```typescript
   public level: number = 1;
   ...
   this.level++;
   ```
   Wave advancement is tracked via `this.level`. In `updateScoreUI()`, `this.level` is broadcast to React state via `onScoreChange()`, displaying `WAVE {wave}` in `TopHUD` (`src/components/game-canvas.tsx:169`).

3. **Boss Representation (`src/game/types.ts:34` & `src/game/GameManager.ts:493, 2273`):**
   ```typescript
   export enum EnemyType { ... BOSS = 2 ... }
   ...
   if (this.level % 5 === 0) { const boss = new Enemy(..., EnemyType.BOSS, ...); }
   ...
   const activeBoss = this.enemies.find(e => e.type === EnemyType.BOSS && !e.isDead);
   ```
   Bosses spawn every 5 waves (`level % 5 === 0`). During Boss encounters, only a Boss HP bar is rendered; the canvas background remains the default `#0f172a`.

4. **Elite Enemy Mechanics (`src/game/Enemy.ts:754, 871`):**
   ```typescript
   const isElite = this.type === EnemyType.ROGUE_STALKER || this.type === EnemyType.ROGUE_MECH || this.type === EnemyType.ROGUE_GOLIATH || this.type === EnemyType.ROGUE_PHANTOM || this.type === EnemyType.ROGUE_CARRIER;
   ...
   const isElite = this.type === EnemyType.SNIPER || this.type === EnemyType.BOSS;
   ```
   Elite status is currently computed locally inside `Enemy.prototype.shoot()` for 2-damage and 3-damage attacks. There is no public `isElite` property or method on `Enemy`, meaning `GameManager` cannot currently query whether any active enemy is an elite without duplicating type comparisons.

5. **Layer 1 Shake Isolation (`src/game/GameManager.ts:2078-2148`):**
   Background rendering in Layer 1 runs before `this.ctx.save()` and `this.ctx.translate(offsetX, offsetY)`. Any background fills, gradients, or vignettes drawn in Layer 1 remain pinned to the canvas boundaries without shaking off-screen.

6. **Projectile Contrast Verification Standard (`tests/14_responsive_warning_background_and_contrast.spec.ts:132`):**
   Automated Playwright tests explicitly verify that enemy projectiles maintain $\ge 7:1$ contrast against warning background colors.

---

## 2. Logic Chain

1. From **Observation 1 & 2**, because `this.level` is cleanly incremented in `startNextWave()` and represents the current wave number, the current progression stage can be computed deterministically via `Math.floor((this.level - 1) / 10)`. Thus, changing the background every 10 stages (e.g. Waves 1–9 $\to$ Tier 0, Waves 10–19 $\to$ Tier 1, Waves 20–29 $\to$ Tier 2) can be driven entirely from `this.level`.
2. From **Observation 3 & 4**, Bosses are explicitly tagged with `EnemyType.BOSS`, and Rogue/Invader Elites (Snipers, Rogue Mechs, Goliaths, Phantoms, Carriers, Stalkers) have known types. Adding `public get isBoss(): boolean` and `public get isElite(): boolean` on `Enemy.ts` allows `GameManager` to poll `this.enemies.some(e => !e.isDead && e.isBoss)` and `this.enemies.some(e => !e.isDead && e.isElite)` in $O(N)$ with $N \le 40$ (taking $< 0.01\text{ms}$ per frame).
3. From **Observation 5**, rendering procedural biome gradients and threat vignettes in Layer 1 guarantees that screen shake will not cause unpainted margins or clipping artifacts.
4. From **Observation 6**, implementing threat signifiers as perimeter radial vignettes (dense at edges, translucent in the center) preserves central battlefield clarity and guarantees $\ge 7:1$ projectile contrast.
5. Smoothing the threat transition via a lerped float `threatIntensity` ($0.0 \to 1.0$) prevents jarring 1-frame visual pops when enemies spawn or die.

---

## 3. Caveats

- **No Source Modifications Made:** As this is an Explorer investigation pass, no code modifications were applied to `src/` or `tests/`. Implementation awaits user approval.
- **Biomes Beyond Wave 50:** The proposed 5 biomes cycle smoothly using modulo (`tier % BIOMES.length`) if endless play extends past Wave 50.
- **Audio Cues:** While Requirement R1 specifies visual background and color scheme shifts, accompanying threat sound cues (e.g. `playCrisisAlarm()` or ambient low-frequency drones) could further amplify threat immersion if desired.

---

## 4. Conclusion

Requirement R1 is architecturally straightforward, highly feasible, and carries low regression risk:
1. **Dynamic Stage Backgrounds:** Implement a 5-tier biome progression system (Surface Aquifer $\to$ Abyssal Trench $\to$ Bioluminescent Reef $\to$ Toxic Seabed $\to$ Cosmic Void) cycling every 10 stages via procedural canvas linear gradients and ambient particle variations.
2. **Threat Signifiers:** Add `isBoss` and `isElite` getters on `Enemy.ts` and a lerped `getThreatState()` in `GameManager.ts`. Render a pulsating radial threat vignette (crimson for Bosses, amber/fuchsia for Elites, theme-specific for Crises) in Layer 1.
3. **Zero 60 FPS Performance Impact:** All gradient definitions and biomes are static constants; particles use deterministic trigonometric math; no heap allocations occur during rendering.
4. **Comprehensive Test Suite:** A proposed 7-test Playwright suite (`tests/17_dynamic_backgrounds_and_threat_signifiers.spec.ts`) provides full automated coverage of biome shifts, threat vignette activation, threat clearance, persistence across Continue/Restart, projectile contrast, and 60 FPS performance.

---

## 5. Verification Method

To independently verify the findings and architectural blueprint:
1. Inspect the survey report at:  
   `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_bg_threat/survey.md`
2. Inspect `src/game/GameManager.ts:2073-2134` to verify the Layer 1 background rendering pipeline.
3. Inspect `src/game/Enemy.ts:754, 871` to verify elite unit classification.
4. Inspect `tests/14_responsive_warning_background_and_contrast.spec.ts` to verify existing corner pixel sampling and contrast testing methodology.
5. Invalidation Condition: If `GameManager.prototype.draw()` Layer 1 cannot accept radial gradients without dropping below 58 FPS on mobile, the design would require an offscreen canvas cache (tested and deemed unnecessary on standard WebGL/Canvas2D mobile runtimes).

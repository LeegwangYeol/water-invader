## 2026-09-03T10:40:37Z

You are a Worker subagent for the Next.js "Water Invader" project.
Your working directory: /Users/user/src/water-invader/.agents/worker_lg_m1_missiles
Workspace root: /Users/user/src/water-invader
Authoritative Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Master Project Blueprint: /Users/user/src/water-invader/PROJECT.md
Shop Survey Report: /Users/user/src/water-invader/.agents/explorer_lg_survey_shop/handoff.md
Combat Physics Survey Report: /Users/user/src/water-invader/.agents/explorer_lg_survey_combat/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mission:
Implement Milestone 1 (M1) — Homing Missile Weapon System (유도탄):
1. Projectile Architecture (`src/game/Bullet.ts`):
   - Implement and export `HomingMissile extends Bullet`.
   - Kinematics & steering physics: launch speed $v_0 = 280\text{ px/s}$, acceleration $a = 360\text{ px/s}^2$, terminal velocity $v_{\max} = 520\text{ px/s}$, angular velocity clamp $\omega = 6.2\text{ rad/s}$ ($355^\circ/\text{s}$). Turning radius $R \approx 45\text{ px}$ for point-blank interception without overshooting.
   - Proportional pursuit heading update: $\Delta \theta = \operatorname{atan2}(\sin(\theta_d - \theta), \cos(\theta_d - \theta))$, clamped by $\omega \times \Delta t$.
   - Nearest-neighbor target acquisition: squared Euclidean distance over living hostiles (`!e.isDead && e.faction !== Faction.PLAYER`), falls back to End-Game Crisis sovereign/anchors.
   - Sticky targeting: retains target until dead or offscreen; instant re-acquisition upon target death; straight cruise failsafe when no hostiles remain.
   - Lifetime: 4.5s max; safe boundary pruning.
   - Barricade clearance: `ignoreBarricades: boolean = true`.
   - Splash damage & blast: base direct damage (3..7 based on level), splash radius 45px dealing 50% splash damage to nearby enemies.
   - Vector rendering: rotating canvas transform to missile heading angle, aerodynamic cyan/indigo fuselage, dual stabilizing tail fins, high-contrast black border, exhaust flame, and trailing smoke particles.
   - CCD: updates `prevPosition` to integrate seamlessly with `Entity.ts` swept-box CCD.

2. Player Integration (`src/game/Player.ts`):
   - Add `public homingMissiles: number = 0;` (0 = unpurchased, 1..5 = upgrade level).
   - Add `private missileTimer: number = 0;`.
   - Autonomous salvo launcher pod mounted on ship wingtips.
   - Firing intervals: Lv1: 2.0s (1 missile, 3 dmg), Lv2: 1.6s (1 missile, 4 dmg), Lv3: 1.4s (2 missiles, 5 dmg), Lv4: 1.1s (2 missiles, 6 dmg), Lv5: 0.9s (3 missiles, 7 dmg).
   - Spawn missiles with lateral wing offsets (`(i - (count - 1)/2) * 16`) and initial upward velocity.
   - Visual: draw wingtip missile pods on player ship when `homingMissiles > 0`.

3. GameManager Integration (`src/game/GameManager.ts`):
   - Export constant `HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400];`.
   - Implement `upgradeHomingMissiles(): boolean`: validates currency >= cost, deducts currency, increments `player.homingMissiles`, plays powerup/missile sound, updates UI.
   - Update `getUpgrades()` to return `homingMissiles: this.player ? this.player.homingMissiles : 0`.
   - In `init(resetScoreAndCash, preserveUpgrades)`: strictly preserve `player.homingMissiles` when `preserveUpgrades === true`, reset to 0 when `preserveUpgrades === false`.
   - In bullet update loop (`update()`): pass `this.enemies` to `bullet.update(deltaTime, this.enemies)` if `bullet instanceof HomingMissile`.
   - In collision loop (`checkCollisions()`):
     - Check `if (bullet.ignoreBarricades)` when checking barricade collisions -> skip barricade hit!
     - When `HomingMissile` hits an enemy, apply direct damage and trigger splash blast (45px radius) applying splash damage to adjacent enemies.

4. UI Integration (`src/components/game-canvas.tsx`):
   - In `ShopUpgradePanel`: add an indigo-themed row for Homing Missiles (유도 미사일):
     - Bilingual title: `{t('유도 미사일', 'Homing Missiles')} (Lv. {upgrades.homingMissiles || 0})`
     - Level badge: `🚀 Lv.{upgrades.homingMissiles}`
     - Subtitle: `{t('가장 가까운 적을 자동 추적하여 큰 피해를 줍니다', 'Auto-seeks nearest enemy with heavy damage')}`
     - Buy button: data-testid="buy-homing-missiles-btn", text `${HOMING_MISSILE_COSTS[level]} 💧` or `MAX`, disabled if level >= 5 or insufficient currency.
   - Wire `onBuyHomingMissiles` callback through `ShopUpgradePanelProps`, `ShopModalProps`, `GameOverModalProps`, and create `buyHomingMissiles` in `GameCanvas`.

5. Audio Integration (`src/game/SoundManager.ts`):
   - Implement `playMissileLaunch()` (rocket ignition frequency sweep from 220Hz to 660Hz with booster hiss).
   - Implement `playMissileExplosion()` (low-frequency rumble burst at 80Hz).

Verification:
- Run `npx tsc --noEmit` and `npm run build` to verify 0 errors.
- Write your completion report to `/Users/user/src/water-invader/.agents/worker_lg_m1_missiles/handoff.md` and report back.

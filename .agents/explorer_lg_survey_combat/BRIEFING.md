# BRIEFING — 2026-09-03T19:15:30+09:00

## Mission
Investigate Combat, Projectile, Bullet Physics, and Entity systems to formulate a complete technical design for Homing Missile mechanics (R1).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesizer
- Working directory: /Users/user/src/water-invader/.agents/explorer_lg_survey_combat
- Original parent: 64f804cc-0c89-4eaf-b63c-7323a06289e4
- Milestone: late_game_survey_combat

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT edit source code or run builds
- Put full report in working directory at handoff.md

## Current Parent
- Conversation ID: 64f804cc-0c89-4eaf-b63c-7323a06289e4
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/game/Bullet.ts`: Entity extension, velocity, piercing, swept bounds, high-contrast drawing
  - `src/game/Entity.ts`: Swept-box CCD (`prevPosition`, `getSweptRect()`, `checkCollision()`)
  - `src/game/GameManager.ts`: Bullet loop, collision phases, barricade interactions, shop upgrades (`getUpgrades`, `init(false, true)` persistence)
  - `src/game/Player.ts`: Firing cadence, stress/suppression spreads, stat upgrades (`fireRate`, `multiShot`, `piercing`, `hasAcidShield`)
  - `src/game/Enemy.ts`: Stage 10+ aggression, rush velocities (1.8-3.0x), Diver dives, extreme HP scaling
  - `src/game/Particle.ts`: Particle pooling, explosion VFX, smoke trails
  - `src/game/SoundManager.ts`: Web Audio synthesis API for weapons, explosions, shields
  - `src/components/game-canvas.tsx`: `ShopUpgradePanel`, `TopHUD`, pre-game and mid-wave shop modals
- **Key findings**:
  - Existing `Bullet` class uses linear velocities $(v_x, v_y)$. A new `HomingMissile extends Bullet` subclass seamlessly fits the update/draw loops without breaking existing bullet behaviors.
  - CCD (swept-box) in `Entity.ts` operates via `prevPosition` and `getSweptRect()`, naturally preventing fast missile tunneling.
  - Wave 10+ enemies rush down to $y = 600-750$ with $11-25+$ HP, demanding high damage (8-10 dmg) and tight turning radius ($R \le 45$ px via turn rate $\omega \ge 6.0$ rad/s and moderate launch speed $v_0 \approx 280$ px/s) to intercept close threats.
  - Barricades at $y = 650$ block standard bullets; homing missiles must have `ignoreBarricades: boolean = true` or elevated flight path to avoid blowing up player cover.
- **Unexplored areas**: None for combat survey; ready for synthesis and handoff.

## Key Decisions Made
- Recommended `HomingMissile extends Bullet` subclass architecture.
- Designed secondary launcher pod with dedicated cooldown ($1.2\text{s}$) firing alongside primary water weapons.
- Formulated pursuit steering physics with angular velocity clamp ($\omega = 6.0$ rad/s, $a = 350$ px/s$^2$, $v_{\max} = 520$ px/s).
- Designed explosive splash blast radius ($45$ px, 4 splash dmg, 8 direct dmg).

## Artifact Index
- handoff.md — Comprehensive technical design and survey for Homing Missile mechanics
- progress.md — Task heartbeat and completion tracking
- DISPATCH.md — Task instructions from parent orchestrator

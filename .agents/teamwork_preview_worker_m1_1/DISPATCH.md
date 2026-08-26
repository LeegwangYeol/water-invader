# Dispatch: Worker 1 for Milestone M1

## 2026-08-26T10:41:06Z

You are Worker 1 for Milestone M1: Faction System & Multi-Directional Combat Core.
Working directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_worker_m1_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Authoritative references:
- Read /Users/a7111/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Read /Users/a7111/src/water-invader/PROJECT.md

Exclusive Write Ownership:
- `src/game/types.ts`
- `src/game/Entity.ts`
- `src/game/Bullet.ts`
- `src/game/Player.ts`
- `src/game/Helper.ts`
- `src/game/Enemy.ts`
- `src/game/GameManager.ts`
- `src/game/SoundManager.ts`

Tasks:
1. `src/game/types.ts`:
   - Export `enum Faction { PLAYER = 'PLAYER', INVADER = 'INVADER', ROGUE = 'ROGUE' }`.
2. `src/game/Entity.ts`:
   - Add `public faction: Faction = Faction.PLAYER;` to `Entity` class.
3. `src/game/Bullet.ts`:
   - Add `public faction: Faction = Faction.PLAYER;`.
   - Add backward-compatible getter: `public get isPlayerBullet(): boolean { return this.faction === Faction.PLAYER; }`.
   - Update `draw(ctx)` to style bullets by faction:
     - `Faction.PLAYER`: Bright Cyan (`#38bdf8`) with white core.
     - `Faction.INVADER`: Red/Orange (`#ef4444` / `#f97316`) or Purple (`#a855f7` for Sniper) with bright core.
     - `Faction.ROGUE`: Neon Lime (`#84cc16`) outer glow with bright Amber (`#fef08a` / `#f59e0b`) inner core.
4. `src/game/Player.ts`:
   - Ensure `this.faction = Faction.PLAYER;` in constructor.
   - When firing projectiles in `fire()`: assign `bullet.faction = Faction.PLAYER`.
5. `src/game/Helper.ts`:
   - Ensure `this.faction = Faction.PLAYER;`.
   - When Fighter fires: assign `bullet.faction = Faction.PLAYER`.
   - In `update()`, search for hostile targets where `enemy.faction !== this.faction` (allowing targeting both Invaders and Rogues).
6. `src/game/Enemy.ts`:
   - Ensure `this.faction = Faction.INVADER;` by default in constructor.
   - When firing: assign `bullet.faction = this.faction`.
7. `src/game/GameManager.ts`:
   - Update `checkCollisions()` to support generalized multi-faction collision matrix:
     - For every bullet:
       - Against Barricades: destructible blocks/absorbs any bullet.
       - Interception: if bullet A and bullet B have different factions and intercept condition matches, destroy both with spark.
       - Against Enemies (`this.enemies`): If `bullet.faction !== enemy.faction` and AABB overlaps:
         - Deal damage `bullet.damage`.
         - If `enemy.isDead`:
           - If `bullet.faction === Faction.PLAYER`: reward standard player score, combo, currency.
           - If `bullet.faction !== Faction.PLAYER` (Crossfire destruction): call `soundManager.playCrossfireHit()`, spawn crossfire explosion particles, and award player tactical crossfire bonus points (+50 score, 1-2 currency).
       - Against Helpers (`this.helpers`): If `bullet.faction !== helper.faction` (i.e. not PLAYER): deal damage to helper.
       - Against Player: If `bullet.faction !== Faction.PLAYER`: deal damage to player (respecting `invincibilityTimer`).
     - Player vs Enemy Body Collision: If `enemy.faction !== Faction.PLAYER`: deal damage to player (respecting `invincibilityTimer`).
8. `src/game/SoundManager.ts`:
   - Implement `playThirdFactionWarning()`, `playRogueShoot()`, and `playCrossfireHit()` using procedural Web Audio synthesis with complete node cleanup in `onended` and `isMuted` guards.

Verification required:
- Run `npx tsc --noEmit` to verify 0 TypeScript errors.
- Run `npm run build` to verify clean Next.js build.
- Run existing tests: `npx playwright test tests/01_ui_and_controls.spec.ts tests/03_game_mechanics.spec.ts tests/04_multiwave_progression.spec.ts`.

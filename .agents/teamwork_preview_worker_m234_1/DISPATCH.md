## 2026-08-26T10:56:39Z
You are the Integration Worker for Milestones M2, M3, and M4:
- M2: Third Faction Units & AI
- M3: Dynamic & Unpredictable Reinforcements Engine
- M4: UI/HUD & Visual Feedback for 3-Way Conflict

Working directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_worker_m234_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Authoritative references:
- Read /Users/a7111/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Read /Users/a7111/src/water-invader/PROJECT.md
- Read /Users/a7111/src/water-invader/TEST_READY.md

Exclusive Write Ownership:
- `src/game/types.ts`
- `src/game/Enemy.ts`
- `src/game/GameManager.ts`
- `src/components/game-canvas.tsx`

Tasks:
1. `src/game/types.ts` & `src/game/Enemy.ts` (M2: Third Faction Units & AI):
   - Add `EnemyType.ROGUE_DRONE`, `EnemyType.ROGUE_STALKER`, `EnemyType.ROGUE_MECH` to `EnemyType` enum.
   - For Rogue units, initialize `this.faction = Faction.ROGUE` in `Enemy` constructor.
   - Distinct stats and behaviors:
     - `ROGUE_DRONE`: Fast agile delta scout (`#84cc16`), lateral oscillation, shoots fast laser chirps (`soundManager.playRogueShoot()`).
     - `ROGUE_STALKER`: Armored stalker (`#a3e635` / `#1e293b`), tracking AI that identifies nearest enemy (Player or Invader) and fires aimed plasma bolts.
     - `ROGUE_MECH`: Heavy combat walker/mech (`#f59e0b` / `#84cc16`), high HP, fires burst lasers.
   - Implement distinct procedural vector rendering in `Enemy.draw()`:
     - Sleek neon-lime (`#84cc16`) delta wings, cyan/amber optical visors, industrial dark chassis, and glowing thruster exhausts.
   - Dual-Targeting AI in `fire(playerPos, allEnemies)`:
     - Rogues choose the nearest or highest-threat hostile target (evaluates distance to Player and distance to active Invaders with `e.faction === Faction.INVADER`), and aims projectiles accordingly.
     - Invader snipers can also target Rogues or Player.

2. `src/game/GameManager.ts` (M3: Dynamic Reinforcements Engine):
   - Overhaul wave and reinforcement spawning:
     - Implement `spawnDynamicReinforcement(type?: 'FLANK' | 'SPEARHEAD' | 'ROGUE_INCURSION' | '3WAY_CLASH')`:
       - `FLANK`: Spawns units along left and right canvas edges (`x = 10` or `x = logicalWidth - 50`) moving inward.
       - `SPEARHEAD` / `V_FORMATION`: Spawns a lead heavy unit with 2-4 trailing wingmen in a V formation.
       - `ROGUE_INCURSION`: Drops 3-5 Rogue units from the top-right / top-left with `playThirdFactionWarning()` audio siren and warning banner.
       - `3WAY_CLASH`: Simultaneously spawns an Invader squad on one flank and a Rogue squad on the opposite flank for instant crossfire.
     - Implement Dynamic Event Director in `update(deltaTime)`:
       - Rather than static fixed timers, monitor battlefield tempo:
         - A dynamic countdown timer (every 8-15s, adjusted by level and combo) triggers surprise incursions or flank drops.
         - If remaining enemy count drops below 3 while wave is active, a quick reinforcement drop is triggered with warning text.
     - Enforce Multi-Faction Wave Clear:
       - `const activeHostiles = this.enemies.filter(e => !e.isDead && (e.faction === Faction.INVADER || e.faction === Faction.ROGUE));`
       - Wave clears and transitions to `SHOP` ONLY when `activeHostiles.length === 0 && this.warningTimer <= 0`.
     - Support warning text state: `public warningText: string = 'WARNING! ENEMY REINFORCEMENTS!'` on `GameManager`.

3. `src/components/game-canvas.tsx` & Canvas Overlay (M4: UI/HUD & Visual Feedback):
   - Top HUD (`game-canvas.tsx`):
     - Display multi-faction active threat counters:
       - Invader count badge: `👾 {invaderCount}` (Orange/Red pill).
       - Rogue count badge: `⚡ {rogueCount}` (Neon Lime pill).
   - Incursion warning overlay:
     - Display animated alert text (e.g. `⚠️ THIRD FACTION INCURSION!` or `⚔️ 3-WAY CROSSFIRE ENGAGED!`) when warning is active.
   - Update `HOW TO PLAY` modal:
     - Detail the 3-Way Battle System (Player vs Invaders vs Rogues), crossfire tactics, and dynamic reinforcement warnings.

## 2026-08-26T11:03:16Z
**Context**: CRITICAL USER REQUIREMENT UPDATE on Visual Assets
**Content**: The user has requested an urgent visual update: the enemies previously looked too dark/dull (like 'black clay').
Please ensure that in `src/game/Enemy.ts`:
1. All Invader entities and Rogue entities use vibrant, colorful, diverse aquatic / bioluminescent themes matching "Water Invader" (e.g. Glowing Neon Lime `#84cc16`/`#a3e635` for Rogue Drones/Rays, Vibrant Coral Red/Magenta `#f43f5e`/`#dc2626` for Boss Titan, Luminous Violet `#c084fc`/`#a855f7` with bioluminescent lure for Deep-Sea Angler Snipers, Bright Crimson/Amber `#ef4444`/`#f59e0b` for Piranha Divers, Brilliant Cyan/Emerald `#06b6d4`/`#10b981` for Armored Turtle/Crabs, Vivid Poison Lime `#22c55e`/`#84cc16` for Anemone Splitters).
2. Use animated multi-tone vector gradients, glowing tentacles, optical eyes, and thrusters/fins in Canvas `draw()`.
3. Keep all dynamic reinforcement and HUD logic intact, and ensure all tests in `tests/05_three_way_battle.spec.ts` and `npm run build` pass cleanly.
**Action**: Please incorporate these vibrant aquatic visual enhancements into your current implementation before producing handoff.md.

## 2026-08-26T11:05:08Z
**Context**: Milestone M1 Challenger 2 Feedback (`VULN-M1-01` in Phase 3 body collisions)
**Content**: Challenger 2 identified a critical bug in `src/game/GameManager.ts` (Phase 3 physical body collisions):
In the nested loop:
```typescript
for (let i = 0; i < this.enemies.length; i++) {
  const enemyA = this.enemies[i];
  if (enemyA.isDead) continue;

  for (let j = i + 1; j < this.enemies.length; j++) {
    if (enemyA.isDead) break; // <-- Critical guard
    const enemyB = this.enemies[j];
    if (enemyB.isDead || enemyA.faction === enemyB.faction) continue;

    if (enemyA.checkCollision(enemyB)) {
       // ...
       if (enemyA.hp <= 0) {
         enemyA.isDead = true;
         // ...
       }
       if (enemyB.hp <= 0) {
         enemyB.isDead = true;
         // ...
       }
       if (enemyA.isDead) break; // <-- Break inner loop immediately once enemyA is dead
    }
  }
}
```
**Action**: Please ensure this `if (enemyA.isDead) break;` guard is included in `src/game/GameManager.ts` along with your M2-M4 implementations. Verify with `npx tsx tests/test_ghost_collision_bug.ts` and ensure all tests pass.

## 2026-08-26T11:06:16Z
**Context**: PRE-GENERATED ASSET UPDATE for Enemy & Rogue Canvas Rendering
**Content**: High quality pixel art image assets have been placed in `/public/assets/`:
1. `/assets/enemy_squid.jpg` (Blue/purple glowing squid for standard Invader enemies)
2. `/assets/enemy_crab.jpg` (Red/orange armored crab for heavy/diver/shielded Invader enemies)
3. `/assets/rogue_jellyfish.jpg` (Glowing neon lime/yellow jellyfish for Rogue 3rd faction)

Implementation instructions for `src/game/Enemy.ts`:
- Preload / cache these `HTMLImageElement` assets (e.g. in static cache `Enemy.assets = { squid: new Image(), crab: new Image(), rogue: new Image() }` with `src = '/assets/...'`).
- In `Enemy.draw(ctx)`:
  - If the image is loaded (`img.complete && img.naturalWidth > 0`), draw with `ctx.drawImage(img, this.position.x, this.position.y, this.size.width, this.size.height)`.
  - Also provide procedural vector fallback if image is not yet loaded.
  - Apply hit flash tint / shield aura on top!
**Action**: Integrate this image rendering + procedural fallback in `src/game/Enemy.ts` and verify with Playwright tests.

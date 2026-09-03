# Progress Log — Milestone M3 (Barricade Saboteurs & Repair Mechanics)

- Last visited: 2026-09-04T02:08:15Z
- Status: COMPLETED — All requirements implemented and verified.
- Completed Items:
  1. `src/game/types.ts`: Added `EnemyType.SABOTEUR = 13`.
  2. `src/game/Barricade.ts`: `maxHp = 20; hp = 20;` for all barricades; bidirectional voxel block sync implemented in `update(deltaTime)`.
  3. `src/game/Bullet.ts`: Added `ignoreBarricades: boolean = false;` to `Bullet`.
  4. `src/game/Enemy.ts`: Handled `EnemyType.SABOTEUR` in constructor, targeting & latching AI, gnaw damage (12.0 DPS), fire suppression, and procedural vector art.
  5. `src/game/GameManager.ts`: Added `restoreBarricades()`, invoked in `startNextWave()`, exposed `EnemyType` on `window`, updated `checkCollisions()` Phase 2, passed `barricades` to `enemy.update(...)`.
  6. Verified `npx tsc --noEmit` (0 errors).
  7. Verified `npm run build` (success).
  8. Verified `tests/19_barricade_saboteur_and_repair.spec.ts` (5/5 passed).
  9. Verified all expansion suites (`tests/17`, `tests/18`, `tests/19`): 16/16 passed.

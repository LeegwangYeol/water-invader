## 2026-08-25T04:58:35Z
You are a Worker agent implementing Milestone 1 (Enemy Physics & Movement Fixes) for Water Invader.

Read the authoritative requirements at: `C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md`
Read the project architecture and QA report at:
- `C:\src\SpaceInvader\PROJECT.md`
- `C:\src\SpaceInvader\reports\QA_SWEEP_REPORT.md`
Your working directory is: `C:\src\SpaceInvader\.agents\teamwork_preview_worker_m1_1` (create your metadata files there).
Your identity is teamwork_preview_worker_m1_1.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You own `src/game/Enemy.ts` and `src/game/GameManager.ts` for enemy movement, physics, and wave spawning logic.

Tasks to Implement:
1. Fix E-01 (Splitter Mini2 Wall Bounce):
   In `Enemy.ts` constructor/update and `GameManager.ts:491`, ensure mini2 uses positive `speedX` with `direction = -1` (or handle direction properly so `position.x <= 0` bounces smoothly to +1 direction).
2. Fix E-02 (Diver Enemy in spawnWave):
   In `GameManager.ts:214-218`, include `EnemyType.DIVER` in the candidate specials array for normal waves (e.g. `[EnemyType.SNIPER, EnemyType.DIVER, EnemyType.SHIELDED, EnemyType.SPLITTER]`).
3. Fix E-04 (Zigzag Enemy Vertical Descent):
   In `Enemy.ts:101`, ensure Zigzag enemies also move downward along the Y axis (`this.position.y += currentSpeedY * deltaTime`), while keeping their horizontal sine oscillation.
4. Fix E-05 (Diver Dive Speed):
   In `Enemy.ts:97`, set dynamic and menacing dive speed (e.g. `280` px/s, or `speedY * 35 * deltaTime`).
5. Fix E-06 (Wave Grid Scaling Bounds):
   In `GameManager.ts:199-204`, cap max columns (e.g. `Math.min(8, 6 + Math.floor(level / 3))`) and rows (e.g. `Math.min(5, 3 + Math.floor(level / 4))`), ensuring `offsetX >= 20` and enemies never spawn off-screen or below barricades.
6. Fix E-07 & G-03 (Stone Barricade Collision & Gnawing Throttle):
   In `GameManager.ts` & `Enemy.ts`, when enemies collide with indestructible stone barricades, block/halt vertical penetration. When gnawing destructible barricades, throttle enemy speed to 0.2x.
7. Fix E-08 (Player Ramming Boss Exploit):
   In `GameManager.ts:329-342`, if enemy colliding with player is `EnemyType.BOSS`, deal damage (e.g. `enemy.hp -= 10`) rather than instakilling (`enemy.isDead = true` only when `enemy.hp <= 0`).

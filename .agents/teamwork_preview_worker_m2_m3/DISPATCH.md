## 2026-08-25T05:05:52Z
You are a Worker agent implementing Milestone 2 & 3 (Shop, Economy, UI Interaction, Weapon Piercing, & Performance Fixes) for Water Invader.

Read the authoritative requirements at: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
Read the project architecture and QA report at:
- C:\src\SpaceInvader\PROJECT.md
- C:\src\SpaceInvader\reports\QA_SWEEP_REPORT.md
Your working directory is: C:\src\SpaceInvader\.agents\teamwork_preview_worker_m2_m3 (create your metadata files there).
Your identity is teamwork_preview_worker_m2_m3.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
- src/components/game-canvas.tsx
- src/game/GameManager.ts
- src/game/Bullet.ts
- src/game/Particle.ts

Tasks to Implement:
1. Fix S-01 (Fire Rate Infinite Currency Drain):
   In src/game/GameManager.ts:865, update upgradeFireRate() condition to if (this.currency >= 50 && this.player.fireRate > 0.1). Prevent any currency deduction if ireRate <= 0.1 (max level reached).
2. Fix S-02 (React Upgrades State Synchronization):
   In src/components/game-canvas.tsx, ensure the UI upgrades state stays in sync with GameManager.player stats (or pass player stats directly on state changes / onScoreChange).
3. Fix S-03 (Q/E Skill Guarding in Non-Playing States):
   In src/game/GameManager.ts:837-842 (handleKeyDown), guard skill triggers with if (this.state !== GameState.PLAYING) return;. Ensure Q (Ally) and E (Ultimate) can never be triggered during SHOP, MENU, or GAME_OVER.
4. Fix S-04 (Piercing Upgrade Cap Alignment):
   In src/game/GameManager.ts:884, cap piercing upgrades to 	his.player.piercing < 5 to match UI cap (max 5).
5. Fix S-05 (Duplicate Shop JSX Refactoring):
   In src/components/game-canvas.tsx, refactor or deduplicate the shop upgrade card rendering between Intermission Shop and Game Over Shop into a clean, reusable component or sub-render function.
6. Fix G-02 (Modal Open/Close Resets Game Session):
   In src/components/game-canvas.tsx:80-135, decouple GameManager instantiation from the [showManual] modal state. The canvas setup useEffect should have an empty dependency array [] (or only canvas-related refs), so opening/closing the HOW TO PLAY manual modal does NOT reset or destroy the active game session.
7. Fix G-01 (Piercing Multi-Hit Frame Depletion Defect):
   In src/game/Bullet.ts and src/game/GameManager.ts:
   - Add hitEntityIds: Set<string> (or hitEntities: Set<Entity>) to Bullet class.
   - When checking bullet collisions with enemies, if ullet.hitEntities.has(enemy) or ullet.hitEntityIds.has(enemy.id), skip this enemy.
   - Only decrement ullet.piercing-- and apply damage once per distinct enemy entity!
   - This allows piercing bullets to genuinely pierce through multiple enemies without getting tick-depleted on a single large enemy over consecutive frames.
8. Fix G-04 (Particle Object Pooling):
   In src/game/Particle.ts or src/game/GameManager.ts, implement an object pool for particles to recycle dead particles and avoid allocating hundreds of 
ew Particle() objects during explosions.

Verification:
- Run Playwright test suite 
px playwright test tests/stress/qa_harvest_verification.spec.ts tests/01_ui_and_controls.spec.ts tests/03_game_mechanics.spec.ts tests/04_multiwave_progression.spec.ts --project=chromium
- Run 
px tsc --noEmit and 
pm run build.

Write your handoff report to C:\src\SpaceInvader\.agents\teamwork_preview_worker_m2_m3\handoff.md and report back.

# Worker M3 Dispatch: Smarter Enemy Friendly-Fire AI (R3)
Implement 2-tier line-of-sight check in src/game/Enemy.ts:
- Fast path: horizontal interval overlap for vertical shots.
- General path: 2D raycast for angled shots.
- Tactical reaction: fire suppression with micro-delay (120-240ms) + lateral repositioning slide for agile units.
Create tests/unit/friendly_fire_ai.test.ts.
Files owned: src/game/Enemy.ts, tests/unit/friendly_fire_ai.test.ts.

## 2026-09-03T01:01:12Z
You are Worker M3 (teamwork_preview_worker_ai_m3).
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_ai_m3
Original Request path: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Explorer Report: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_ai_1/report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Files Owned Exclusively:
- src/game/Enemy.ts
- tests/unit/friendly_fire_ai.test.ts
(DO NOT edit any other files)

Scope & Instructions:
1. Read /Users/user/src/water-invader/.agents/teamwork_preview_explorer_ai_1/report.md.
2. In src/game/Enemy.ts:
   - Implement `hasAlliedObstacleInShotPath(allEnemies: Enemy[], originX: number, originY: number, targetX: number, targetY: number, projectileRadius?: number): boolean`.
   - Tier 1 Fast Path: when |v_x| < 5 (vertical shot down), check if any live same-faction ally is ahead (e.position.y > this.position.y) and within horizontal interval overlap (|e.position.x - originX| < (e.width/2 + projectileRadius)).
   - Tier 2 General Path: for angled shots, perform 2D raycast / slab intersection against live same-faction ally hitboxes.
   - In Enemy.fire(): if an ally blocks the shot corridor:
     - Suppress fire! Do NOT fire bullet.
     - Do NOT reset full cooldown. Set micro-delay: `this.fireTimer = Math.random() * 0.12 + 0.12`.
     - For mobile/agile enemies (Snipers, Rogues, Stalkers): trigger lateral repositioning slide (`this.position.x += slideDir * 45 * dt`) to peek around the blocking ally.
   - If the path is clear, fire normally.
3. Create comprehensive headless test suite in tests/unit/friendly_fire_ai.test.ts:
   - Test suppression when ally is directly ahead in vertical formation.
   - Test fire succeeds when no ally is in shot path.
   - Test crossfire is NOT suppressed when target/obstacle is an enemy of opposing faction (Invaders vs Rogues).
   - Test dead allies do not suppress fire.
   - Test allies behind shooter do not suppress fire.
   - Test angled sniper shots detect diagonal ally obstruction.
   - Test multi-row formation firing sequence (front row fires, rear row holds until front clears or slides).
   - Test 180-frame zero friendly-fire damage benchmark.
4. Run `npx tsc --noEmit` and `npx playwright test tests/unit/friendly_fire_ai.test.ts`.
5. Document results in /Users/user/src/water-invader/.agents/teamwork_preview_worker_ai_m3/handoff.md and send completion message.

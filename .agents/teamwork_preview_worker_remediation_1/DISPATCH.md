## 2026-09-03T05:55:00Z
You are teamwork_preview_worker_remediation_1, an expert full-stack engineer and remediation worker.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_remediation_1/
Project Root: /Users/user/src/water-invader

MANDATORY: Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md, /Users/user/src/water-invader/COLLABORATION.md, /Users/user/src/water-invader/PROJECT.md, and /Users/user/src/water-invader/.agents/orchestrator_bughunt_1/DEFECT_LOG.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective:
Implement comprehensive automated remediation for the 16 verified defects cataloged in DEFECT_LOG.md:
1. DEFECT-B1: In src/game/crisis/AlliedReinforcements.ts:379, prevent nano-shield from healing/resurrecting player: `if (!player || player.isDead || player.hp <= 0) return;`.
2. DEFECT-B2: In src/game/GameManager.ts:770-781, track `const prevHp = this.player.hp` before updating alliedReinforcements, and if `this.player.hp !== prevHp`, dispatch `this.onPlayerHpChange(this.player.hp)`.
3. DEFECT-B3: In src/game/GameManager.ts:366-371, make triggerAlliedReinforcements() idempotent: return existing instance if `this.alliedReinforcements && this.alliedReinforcements.isActive && !this.alliedReinforcements.isDismissed`.
4. DEFECT-B4: In src/game/crisis/AlliedReinforcements.ts:411-420, clamp escort fighter positions to `[10, this.logicalWidth - 30]`.
5. DEFECT-B5: In src/game/crisis/AlliedReinforcements.ts:605-615, truncate/fit banner ticker text so it does not overflow narrow containers.
6. DEFECT-A1: In src/game/crisis/EndGameCrisis.ts:1000-1049, check `if (bullet.hitEntities.has(this.sovereign)) return;` / `if (bullet.hitEntities.has(anchor)) continue;`, add to hitEntities, and decrement `bullet.piercing--`. If `bullet.piercing <= 0`, set `bullet.isDead = true`.
7. DEFECT-A2: In src/game/crisis/EndGameCrisis.ts, when `enrageTimer <= 0`, accelerate attack rate (interval to 0.7s) or fire enrage starburst and ensure realityDistortionLevel is applied.
8. DEFECT-A3: In src/game/crisis/EndGameCrisis.ts:251, allow transition to Phase 3 if `this.sovereign.phase === CrisisPhase.PHASE_3_CORE` regardless of current phase.
9. DEFECT-A4: In src/game/crisis/EndGameCrisis.ts:transitionToPhase(DEFEATED), mark all anchors `isDead = true`. In GameManager.triggerEndGameCrisis(), if alliedReinforcements exists, call `warpOut()`.
10. DEFECT-A5: In src/game/GameManager.ts, ensure defeat resolution (+2,000 score, +500 currency, +10 combo, 120-particle explosion) executes when `endGameCrisis.phase === CrisisPhase.DEFEATED` even if `isActive` was set to false.
11. DEFECT-A6: In src/game/crisis/EndGameCrisis.ts (executeArchetypeAttack), add Phase 3 enrage branches for VOID_SOVEREIGN (VOID_NOVA), ABYSSAL_LEVIATHAN (BIO_LARVAE_SWARM), and CYBERNETIC_EXTERMINATOR (EMP_CASCADE).
12. DEFECT-C1: In src/game/Bullet.ts / Entity.ts, add Continuous Collision Detection (CCD) / swept bounds or sub-stepping during fast movement so bullets do not tunnel through entities under frame latency.
13. DEFECT-C2: In src/game/Player.ts and src/game/crisis/CrisisSovereign.ts, add Number.isFinite() sanitization on position coordinates before rendering/creating radial gradients, and clamp player Y to `[0, this.canvasHeight - this.size.height]`.
14. DEFECT-C3: In src/game/Enemy.ts:626,707, align raycast center to true bullet center (`spawnX + 5`) instead of `spawnX + 3`.
15. DEFECT-F1: In src/game/GameManager.ts:init(), unconditionally reset `this.score = 0;` so score does not leak across runs on PLAY AGAIN.
16. DEFECT-F2: In src/game/GameManager.ts:init(), unconditionally reset `this.hasEndGameCrisisOccurred = false;` so End-Game Crises can spawn in subsequent runs.
17. DEFECT-F3: In src/game/GameManager.ts:1468, add `this.updateScoreUI();` immediately after resetting `this.combo = 0;` on bullet collision so TopHUD doesn't freeze with ghost combo.
18. DEFECT-F4: In src/game/GameManager.ts:startNextWave(), clear `this.bullets = []; this.solarFlares = []; this.hazardProjectiles = [];`.
19. DEFECT-F5: In src/components/game-canvas.tsx:49, disable Tank Repair in ShopUpgradePanel when `hp <= 0` (`disabled={currency < 75 || hp >= 5 || hp <= 0}`).
20. DEFECT-F6: In src/game/GameManager.ts:994-999, include `hz.radius` in barricade collision checks: `hz.x + hz.radius >= b.position.x && hz.x - hz.radius <= b.position.x + b.size.width && hz.y + hz.radius >= b.position.y && hz.y - hz.radius <= b.position.y + b.size.height`.

Verification & Test Requirements:
- Add a new unit test suite: `tests/unit/gamestate_edgecases_audit.test.ts` verifying all state machine fixes.
- Run `npx tsc --noEmit` to verify 0 type errors.
- Run `npm run build` to verify Next.js build succeeds.
- Run `npx playwright test` to verify all unit, stress, and E2E tests pass.
- Write a detailed handoff report to /Users/user/src/water-invader/.agents/teamwork_preview_worker_remediation_1/handoff.md with all files touched, line numbers, test results, and send a message to parent.

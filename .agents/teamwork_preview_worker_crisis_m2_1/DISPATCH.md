## 2026-09-01T06:35:28Z
You are a teamwork_preview_worker implementing Milestone 2 (Crisis Incursion Engine, Combat Mechanics & GameManager Integration) for the Water Invader project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_m2_1

Milestone 2 Requirements:
1. GameManager.ts Integration:
   - Add property public endGameCrisis: EndGameCrisis | null = null;
   - In spawnWave():
     - When this.level >= 15 and !this.endGameCrisis:
       - Evaluate 30% random chance (Math.random() < 0.30) OR guaranteed trigger if this.level >= 18 and no crisis has occurred yet.
       - If triggered, call this.triggerEndGameCrisis().
   - Implement public triggerEndGameCrisis(archetype?: CrisisArchetype): void:
     - Initializes this.endGameCrisis = new EndGameCrisis(this.canvas.width, this.canvas.height, archetype, ...)
     - Plays cataclysm siren this.sound.playCrisisCataclysmSiren()
     - Clears standard hostiles or sets crisis warning timer
   - In update(deltaTime):
     - Update this.endGameCrisis if active.
     - Apply vortex gravity to this.player and this.bullets if rifts are active.
     - Integrate collision detection: player bullets colliding with rifts (this.endGameCrisis.getRifts()) and sovereign main body (this.endGameCrisis.getMainBody()). Respect invulnerability in Phase 1 if rifts are alive! Spawn impact particles, spark SFX, and award score on damage/kills.
     - Wave clear safety: If this.endGameCrisis && this.endGameCrisis.isActive, DO NOT transition to GameState.SHOP until this.endGameCrisis.isDefeated.
     - When this.endGameCrisis.isDefeated, grant massive victory bonus (+2000 score, +500 cash) and transition to GameState.SHOP.
   - In draw():
     - If this.endGameCrisis && this.endGameCrisis.isActive, invoke this.endGameCrisis.draw(this.ctx).
2. src/components/game-canvas.tsx:
   - Add HUD banner/overlay rendering when endGameCrisis is in warning or active state.
3. Verification:
   - Run npx tsc --noEmit -> Expect 0 errors.
   - Run npm run build -> Expect successful build.
   - Run unit and existing Playwright tests (npx playwright test tests/unit/).
4. Write report.md and handoff.md.
5. Send message to caller.

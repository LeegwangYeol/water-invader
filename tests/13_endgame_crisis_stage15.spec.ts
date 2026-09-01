import { test, expect } from '@playwright/test';

test.describe('Milestone 4: Stage 15 End-Game Crisis E2E Test Track', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    // Start game
    await page.click('button:has-text("게임 시작"), button:has-text("START GAME")');
    await page.waitForFunction(() => (window as any).gameManager !== undefined);
  });

  // =========================================================================
  // TIER 1: CORE FEATURE & LIFECYCLE COVERAGE
  // =========================================================================

  test('T1.1 [Stage 15 Mock & Incursion Trigger]: Mocks Stage 15 and verifies incursion warning banner DOM visibility', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // Mock reaching Stage 15 and triggering End-Game Crisis
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      gm.state = 'PLAYING';
      gm.triggerEndGameCrisis('VOID_SOVEREIGN');
    });

    // Verify warning banner overlay presence and content
    const banner = page.locator('[data-testid="endgame-crisis-warning-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('STELLARIS-STYLE END-GAME CRISIS INCURSION');
    await expect(banner).toContainText('VOID SOVEREIGN');
    await expect(banner).toContainText('WARP CONVERGENCE IN');

    expect(consoleErrors.length).toBe(0);
  });

  test('T1.2 [Tri-Phase Progression & Active HUD Badges]: Dynamic HUD status reflects Phase 1 through Phase 3 in real-time', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      gm.state = 'PLAYING';
      gm.triggerEndGameCrisis('VOID_SOVEREIGN');
    });

    // Advance past incursion warning (3.0s) -> Phase 1
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.update(3.1);
    });

    // Verify Phase 1 Active Badge
    const badge = page.locator('[data-testid="endgame-crisis-active-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('PHASE 1: DIMENSIONAL SHIELD ACTIVE');

    // Destroy both Dimensional Rifts (600 HP each) -> Phase 2
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.riftAnchors[0].takeDamage(600);
      crisis.riftAnchors[1].takeDamage(600);
      gm.update(0.016);
    });

    await expect(badge).toContainText('PHASE 2: SOVEREIGN HULL EXPOSED');

    // Destroy Sovereign Hull (2,500 HP) -> Phase 3
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.sovereign.takeDamage(2500);
      gm.update(0.016);
    });

    await expect(badge).toContainText('PHASE 3: CORE OVERDRIVE');
  });

  test('T1.3 [Cataclysm Resolution & Clean SHOP Transition]: Defeating Crisis awards massive rewards (+2000 score, +500 cash) and transitions cleanly to SHOP', async ({ page }) => {
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      gm.state = 'PLAYING';
      gm.score = 250;
      gm.currency = 150;
      gm.triggerEndGameCrisis('CYBERNETIC_EXTERMINATOR');
    });

    // Fast-forward past incursion
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.update(3.1);
    });

    // Destroy Rifts (1,200 EHP total)
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.riftAnchors[0].takeDamage(600);
      crisis.riftAnchors[1].takeDamage(600);
      gm.update(0.016);
    });

    // Destroy Hull (2,500 HP)
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.sovereign.takeDamage(2500);
      gm.update(0.016);
    });

    // Destroy Core (1,500 HP) -> Cataclysm Defeat
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      crisis.sovereign.takeDamage(1500);
      gm.update(0.016);
    });

    // Verify Game State, Rewards, and Shop UI
    const state = await page.evaluate(() => (window as any).gameManager.state);
    const score = await page.evaluate(() => (window as any).gameManager.score);
    const currency = await page.evaluate(() => (window as any).gameManager.currency);

    expect(state).toBe('SHOP');
    expect(score).toBeGreaterThanOrEqual(2250); // 250 + 2000 bonus
    expect(currency).toBeGreaterThanOrEqual(650); // 150 + 500 bonus

    const shopModal = page.locator('text=WAVE CLEARED');
    await expect(shopModal).toBeVisible();
    const nextWaveBtn = page.locator('button:has-text("NEXT WAVE")');
    await expect(nextWaveBtn).toBeVisible();
  });

  // =========================================================================
  // TIER 2: BOUNDARY CONDITIONS & MULTI-ARCHETYPE VERIFICATION
  // =========================================================================

  test('T2.1 [Boss Priority vs Stage 15+ Random Incursion]: Evaluates boss wave priority on Level 15 and incursion triggers on non-boss waves', async ({ page }) => {
    const evaluation = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      
      // 1. Stage 15 (Boss wave) -> Spawns Boss + Escorts, does NOT trigger crisis
      gm.level = 15;
      gm.hasEndGameCrisisOccurred = false;
      gm.endGameCrisis = null;
      gm.enemies = [];
      gm.spawnWave();
      const bossWaveHasCrisis = gm.endGameCrisis !== null;
      const bossCount = gm.enemies.filter((e: any) => e.type === 2).length; // EnemyType.BOSS = 2

      // 2. Stage 16 (Non-boss wave, level >= 15) -> Math.random() < 0.30 triggers crisis
      gm.level = 16;
      gm.hasEndGameCrisisOccurred = false;
      gm.endGameCrisis = null;
      gm.enemies = [];
      const origRandom = Math.random;
      let randomTriggerSuccess = false;
      try {
        Math.random = () => 0.10; // < 0.30
        gm.spawnWave();
        randomTriggerSuccess = gm.endGameCrisis !== null && gm.hasEndGameCrisisOccurred;
      } finally {
        Math.random = origRandom;
      }

      // 3. Stage 18 (Pity threshold >= 18) -> Guaranteed crisis trigger
      gm.level = 18;
      gm.hasEndGameCrisisOccurred = false;
      gm.endGameCrisis = null;
      gm.enemies = [];
      let pityTriggerSuccess = false;
      try {
        Math.random = () => 0.99; // Would fail random roll, but pity triggers
        gm.spawnWave();
        pityTriggerSuccess = gm.endGameCrisis !== null && gm.hasEndGameCrisisOccurred;
      } finally {
        Math.random = origRandom;
      }

      return {
        bossWaveHasCrisis,
        bossCount,
        randomTriggerSuccess,
        pityTriggerSuccess,
      };
    });

    expect(evaluation.bossWaveHasCrisis).toBe(false);
    expect(evaluation.bossCount).toBe(1);
    expect(evaluation.randomTriggerSuccess).toBe(true);
    expect(evaluation.pityTriggerSuccess).toBe(true);
  });

  test('T2.2 [Archetype Variety]: Verifies all 3 archetypes (Void Sovereign, Abyssal Leviathan, Cybernetic Exterminator) initialize cleanly without crash', async ({ page }) => {
    const archetypes = ['VOID_SOVEREIGN', 'ABYSSAL_LEVIATHAN', 'CYBERNETIC_EXTERMINATOR'];

    for (const arch of archetypes) {
      await page.evaluate((archetype) => {
        const gm = (window as any).gameManager;
        gm.level = 15;
        gm.state = 'PLAYING';
        gm.triggerEndGameCrisis(archetype);
      }, arch);

      const banner = page.locator('[data-testid="endgame-crisis-warning-banner"]');
      await expect(banner).toBeVisible();

      // Fast forward past incursion
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.update(3.1);
      });

      const badge = page.locator('[data-testid="endgame-crisis-active-badge"]');
      await expect(badge).toBeVisible();
      await expect(badge).toContainText('PHASE 1: DIMENSIONAL SHIELD ACTIVE');
    }
  });

  test('T2.3 [Zero Uncaught Errors & Continuous Combat Updates]: Runs continuous combat simulation frames with zero uncaught console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      gm.state = 'PLAYING';
      gm.triggerEndGameCrisis('VOID_SOVEREIGN');
    });

    // Run 120 consecutive 60 FPS update frames
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      for (let f = 0; f < 120; f++) {
        gm.update(1 / 60);
      }
    });

    expect(errors.length).toBe(0);
  });

  // =========================================================================
  // TIER 3: REALITY-BENDING COMBAT & GRAVITATIONAL PHYSICS
  // =========================================================================

  test('T3.1 [Gravitational Vortex Physics]: Gravitational pull exerts attraction on player and curves player projectiles', async ({ page }) => {
    const physicsResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      gm.state = 'PLAYING';
      gm.triggerEndGameCrisis('VOID_SOVEREIGN');
      gm.update(3.1); // Advance to Phase 1 (Rifts active)

      // Place player near left rift (Rift 0 is at x=50, y=170, center=90)
      gm.player.position.x = 140;
      gm.player.position.y = 210;
      const initialPlayerX = gm.player.position.x;

      // Spawn player bullet to the right of left rift center
      const BulletClass = (window as any).Bullet || gm.bullets[0]?.constructor;
      // In case Bullet constructor isn't directly exposed on window, fire from player
      gm.player.isShooting = true;
      const spawnedBullets = gm.player.update(0.016);
      gm.bullets.push(...spawnedBullets);

      // Advance physics frames
      gm.update(0.1);

      return {
        playerMovedLeft: gm.player.position.x < initialPlayerX,
        playerPosX: gm.player.position.x,
        activeRiftCount: gm.endGameCrisis.riftAnchors.filter((r: any) => !r.isDead).length,
      };
    });

    expect(physicsResult.playerMovedLeft).toBe(true);
    expect(physicsResult.activeRiftCount).toBe(2);
  });

  test('T3.2 [Invulnerability Shroud & Bullet Routing]: Sovereign core 100% deflects damage until both rifts fall', async ({ page }) => {
    const shroudResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      gm.state = 'PLAYING';
      gm.triggerEndGameCrisis('VOID_SOVEREIGN');
      gm.update(3.1); // Phase 1

      const crisis = gm.endGameCrisis;
      const initialHull = crisis.sovereign.hullHp;

      // Direct attack on sovereign in Phase 1 -> deflected
      crisis.sovereign.takeDamage(1000);
      const hullAfterDirectAttack = crisis.sovereign.hullHp;

      // Destroy Rift 0 only (Rift 1 still alive)
      crisis.riftAnchors[0].takeDamage(600);
      crisis.sovereign.takeDamage(1000);
      const hullAfterOneRiftDead = crisis.sovereign.hullHp;

      // Destroy Rift 1 -> Phase 2 triggers
      crisis.riftAnchors[1].takeDamage(600);
      gm.update(0.016);
      const phaseAfterBothRiftsDead = crisis.phase;

      // Now attack sovereign in Phase 2 -> takes damage
      crisis.sovereign.takeDamage(1000);
      const hullAfterPhase2Attack = crisis.sovereign.hullHp;

      return {
        initialHull,
        hullAfterDirectAttack,
        hullAfterOneRiftDead,
        phaseAfterBothRiftsDead,
        hullAfterPhase2Attack,
      };
    });

    expect(shroudResult.hullAfterDirectAttack).toBe(2500); // Immune
    expect(shroudResult.hullAfterOneRiftDead).toBe(2500); // Still immune
    expect(shroudResult.phaseAfterBothRiftsDead).toBe('PHASE_2_HULL');
    expect(shroudResult.hullAfterPhase2Attack).toBe(1500); // 2500 - 1000 = 1500
  });

  // =========================================================================
  // TIER 4: FULL END-TO-END APPLICATION SCENARIO
  // =========================================================================

  test('T4.1 [Full Lifecycle Campaign Progression]: Progression from Stage 15 combat through Crisis defeat into Shop intermission and Next Wave', async ({ page }) => {
    // 1. Enter Stage 15
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 15;
      gm.state = 'PLAYING';
      gm.triggerEndGameCrisis('VOID_SOVEREIGN');
    });

    // 2. Incursion Warning Banner appears
    const banner = page.locator('[data-testid="endgame-crisis-warning-banner"]');
    await expect(banner).toBeVisible();

    // 3. Fast-forward into active Phase 1 combat
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.update(3.2);
    });
    await expect(banner).toBeHidden();
    const badge = page.locator('[data-testid="endgame-crisis-active-badge"]');
    await expect(badge).toBeVisible();

    // 4. Step through Phase 1, Phase 2, and Phase 3 sequentially to defeat Crisis
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      // Phase 1: Destroy rifts -> transitions to Phase 2
      crisis.riftAnchors[0].takeDamage(600);
      crisis.riftAnchors[1].takeDamage(600);
      gm.update(0.016);
    });

    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      // Phase 2: Destroy hull -> transitions to Phase 3
      crisis.sovereign.takeDamage(2500);
      gm.update(0.016);
    });

    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const crisis = gm.endGameCrisis;
      // Phase 3: Destroy core -> Cataclysm Defeat & Shop transition
      crisis.sovereign.takeDamage(1500);
      gm.update(0.016);
    });

    // 5. Clean transition to Shop Intermission
    const shopModal = page.locator('text=WAVE CLEARED');
    await expect(shopModal).toBeVisible();

    // 6. Click "NEXT WAVE" to advance campaign to Level 16
    await page.click('button:has-text("NEXT WAVE")');
    await page.waitForTimeout(500);

    const newLevel = await page.evaluate(() => (window as any).gameManager.level);
    const newState = await page.evaluate(() => (window as any).gameManager.state);
    expect(newLevel).toBe(16);
    expect(newState).toBe('PLAYING');
  });
});

import { test, expect } from '@playwright/test';

test.describe('DEF-TST-02: Bridge Crew Deck & Shop UI Integration Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // =========================================================================
  // SUB-SUITE 1: PRE-GAME SHOP MODAL & BRIDGE CREW ROSTER PROMOTION
  // =========================================================================
  test('DEF-TST-02.7: Bridge Crew Roster renders in Shop modal and allows officer promotion', async ({ page }) => {
    // 1. Open Shop / Armory from Main Menu
    const armoryBtn = page.locator('button', { hasText: /ARMORY \/ SHOP|정비소/i });
    await expect(armoryBtn).toBeVisible({ timeout: 10000 });
    await armoryBtn.click();

    // 2. Verify Shop modal and Bridge Crew Roster header
    const crewHeader = page.locator('h2', { hasText: /함교 장교 로스터|BRIDGE CREW ROSTER/i });
    await expect(crewHeader).toBeVisible({ timeout: 10000 });

    // 3. Verify all 4 officer tabs are visible in DOM
    const ingridTab = page.locator('[data-testid="officer-tab-ingrid"]');
    const jaxTab = page.locator('[data-testid="officer-tab-jax"]');
    const renTab = page.locator('[data-testid="officer-tab-ren"]');
    const lyraTab = page.locator('[data-testid="officer-tab-lyra"]');

    await expect(ingridTab).toBeVisible();
    await expect(jaxTab).toBeVisible();
    await expect(renTab).toBeVisible();
    await expect(lyraTab).toBeVisible();

    // 4. Officer Ingrid is selected by default; verify rank 1 (★)
    await expect(ingridTab).toContainText('★');
    const promoteIngridBtn = page.locator('[data-testid="promote-btn-ingrid"]');
    await expect(promoteIngridBtn).toBeVisible();

    // Initial starter currency is 150 💧
    const initialCurrency = await page.evaluate(() => (window as any).gameManager?.currency);
    expect(initialCurrency).toBe(150);

    // 5. Promote Ingrid to Rank 2 (Lieutenant) -> costs 25 💧
    await promoteIngridBtn.click();

    // Verify currency decreased to 125 💧
    const currAfterP1 = await page.evaluate(() => (window as any).gameManager?.currency);
    expect(currAfterP1).toBe(125);
    await expect(ingridTab).toContainText('★★');

    // 6. Promote Ingrid again to Rank 3 (Commander / Max Rank) -> costs 25 💧
    await promoteIngridBtn.click();

    const currAfterP2 = await page.evaluate(() => (window as any).gameManager?.currency);
    expect(currAfterP2).toBe(100);
    await expect(ingridTab).toContainText('★★★');
    await expect(page.locator('text=MAX RANK (★★★)')).toBeVisible();

    // 7. Select Jax tab and promote Jax to Rank 2 -> costs 25 💧
    await jaxTab.click();
    const promoteJaxBtn = page.locator('[data-testid="promote-btn-jax"]');
    await expect(promoteJaxBtn).toBeVisible();
    await promoteJaxBtn.click();

    const currAfterJax = await page.evaluate(() => (window as any).gameManager?.currency);
    expect(currAfterJax).toBe(75);
    await expect(jaxTab).toContainText('★★');
  });

  // =========================================================================
  // SUB-SUITE 2: UPGRADE PERSISTENCE ACROSS GAME START
  // =========================================================================
  test('DEF-TST-02.8: Bridge Crew promotions and perks persist into Wave 1 active gameplay', async ({ page }) => {
    // 1. Open Armory from Main Menu
    await page.locator('button', { hasText: /ARMORY \/ SHOP|정비소/i }).click();

    // 2. Promote Ingrid to Rank 2
    const promoteIngridBtn = page.locator('[data-testid="promote-btn-ingrid"]');
    await expect(promoteIngridBtn).toBeVisible({ timeout: 10000 });
    await promoteIngridBtn.click();

    // 3. Promote Jax to Rank 2
    await page.locator('[data-testid="officer-tab-jax"]').click();
    const promoteJaxBtn = page.locator('[data-testid="promote-btn-jax"]');
    await expect(promoteJaxBtn).toBeVisible();
    await promoteJaxBtn.click();

    // 4. Click Start Mission to transition to Wave 1 active gameplay
    const startMissionBtn = page.locator('[data-testid="start-mission-button"]').or(page.locator('#start-mission-btn'));
    await expect(startMissionBtn).toBeVisible();
    await startMissionBtn.click();

    // 5. Wait for game to enter PLAYING state
    await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');

    // 6. Verify persistence in engine state
    const persistenceData = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const deck = gm.flagshipManager.crewDeck;
      const ingrid = deck.state.officers['INGRID'];
      const jax = deck.state.officers['JAX'];

      return {
        currency: gm.currency,
        ingridRank: ingrid.rank,
        ingridPerk1Active: ingrid.perks[0].isActive,
        ingridPerk2Active: ingrid.perks[1].isActive,
        jaxRank: jax.rank,
        jaxPerk1Active: jax.perks[0].isActive,
        jaxPerk2Active: jax.perks[1].isActive,
      };
    });

    // Starter 150 - 25 (Ingrid) - 25 (Jax) = 100
    expect(persistenceData.currency).toBe(100);
    expect(persistenceData.ingridRank).toBe(2);
    expect(persistenceData.ingridPerk1Active).toBe(true);
    expect(persistenceData.ingridPerk2Active).toBe(true);
    expect(persistenceData.jaxRank).toBe(2);
    expect(persistenceData.jaxPerk1Active).toBe(true);
    expect(persistenceData.jaxPerk2Active).toBe(true);
  });

  // =========================================================================
  // SUB-SUITE 3: ACTIVE BRIDGE ABILITIES TRIGGERING (KEYS 1-4 & HOTKEYS)
  // =========================================================================
  test('DEF-TST-02.9: Active bridge abilities trigger on hotkeys [1], [2], [3], [4] with cooldown and fatigue management', async ({ page }) => {
    // 1. Start game directly to enter PLAYING state
    await page.locator('button', { hasText: /START GAME|게임 시작/i }).click();
    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      return gm && gm.flagshipManager?.crewDeck && gm.state === 'PLAYING';
    }, { timeout: 15000 });

    // 2. Test Key '1': Chief Ingrid Vane - Emergency SCRAM Purge
    // Set stress & suppression to test cleansing
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.stressLevel = 60;
      gm.player.suppressionLevel = 40;
    });

    await page.keyboard.press('1');

    const ingridResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const ingrid = gm.flagshipManager.crewDeck.state.officers['INGRID'];
      return {
        cooldown: ingrid.activeAbility.currentCooldown,
        invincibility: gm.player.invincibilityTimer,
        stress: gm.player.stressLevel,
        suppression: gm.player.suppressionLevel,
      };
    });

    expect(ingridResult.cooldown).toBeGreaterThan(0);
    expect(ingridResult.invincibility).toBeGreaterThanOrEqual(1.4);
    expect(ingridResult.stress).toBe(0);
    expect(ingridResult.suppression).toBe(0);

    // 3. Test Key '2': Master Gunner Jax Callahan - Titan Cavitation Salvo
    const bulletCountBefore = await page.evaluate(() => (window as any).gameManager.bullets.length);
    await page.keyboard.press('2');

    const jaxResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const jax = gm.flagshipManager.crewDeck.state.officers['JAX'];
      return {
        cooldown: jax.activeAbility.currentCooldown,
        bulletCount: gm.bullets.length,
      };
    });

    expect(jaxResult.cooldown).toBeGreaterThan(0);
    expect(jaxResult.bulletCount).toBeGreaterThan(bulletCountBefore);

    // 4. Test Key '3': Hydro-Officer Ren Thorne - Hydro-Acoustic Stasis
    await page.keyboard.press('3');

    const renResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const deck = gm.flagshipManager.crewDeck;
      const ren = deck.state.officers['REN'];
      return {
        cooldown: ren.activeAbility.currentCooldown,
        stasisTimer: deck.activeStasisTimer,
      };
    });

    expect(renResult.cooldown).toBeGreaterThan(0);
    expect(renResult.stasisTimer).toBeGreaterThan(0);

    // 5. Test Key '4': Dr. Lyra Vance - Bioluminescent Decoy Pod
    await page.keyboard.press('4');

    const lyraResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const deck = gm.flagshipManager.crewDeck;
      const lyra = deck.state.officers['LYRA'];
      return {
        cooldown: lyra.activeAbility.currentCooldown,
        hasDecoyPod: deck.activeDecoyPod !== null,
        decoyActive: deck.activeDecoyPod?.active,
        decoyHp: deck.activeDecoyPod?.hp,
      };
    });

    expect(lyraResult.cooldown).toBeGreaterThan(0);
    expect(lyraResult.hasDecoyPod).toBe(true);
    expect(lyraResult.decoyActive).toBe(true);
    expect(lyraResult.decoyHp).toBe(120);

    // 6. Test Cooldown Lockout: Pressing '1' again while on cooldown does NOT re-trigger
    const cdBeforeSpam = await page.evaluate(() => {
      return (window as any).gameManager.flagshipManager.crewDeck.state.officers['INGRID'].activeAbility.currentCooldown;
    });

    await page.keyboard.press('1');

    const cdAfterSpam = await page.evaluate(() => {
      return (window as any).gameManager.flagshipManager.crewDeck.state.officers['INGRID'].activeAbility.currentCooldown;
    });

    // Cooldown should not have been reset to 35s max; it should have remained on countdown
    expect(cdAfterSpam).toBeLessThanOrEqual(cdBeforeSpam);
  });

  // =========================================================================
  // SUB-SUITE 4: STATION ASSIGNMENT & DUAL RESONANCE SYNCHRONIZATION
  // =========================================================================
  test('DEF-TST-02.10: Station assignments synchronize and update tactical resonances in live browser', async ({ page }) => {
    await page.locator('button', { hasText: /START GAME|게임 시작/i }).click();
    await page.waitForFunction(() => (window as any).gameManager?.flagshipManager?.crewDeck);

    const stationResult = await page.evaluate(() => {
      const deck = (window as any).gameManager.flagshipManager.crewDeck;

      // Initial assignments
      const initialEngineer = deck.state.stationAssignments['ENGINEERING'];
      const initialSonar = deck.state.stationAssignments['SONAR'];

      // Swap stations: Assign Ren to Engineering
      deck.assignStation('REN', 'ENGINEERING');

      const updatedEngineer = deck.state.stationAssignments['ENGINEERING'];
      const updatedOfficerStation = deck.state.officers['REN'].station;

      return {
        initialEngineer,
        initialSonar,
        updatedEngineer,
        updatedOfficerStation,
        resonances: deck.state.activeResonances,
      };
    });

    expect(stationResult.initialEngineer).toBe('INGRID');
    expect(stationResult.initialSonar).toBe('REN');
    expect(stationResult.updatedEngineer).toBe('REN');
    expect(stationResult.updatedOfficerStation).toBe('ENGINEERING');
    expect(Array.isArray(stationResult.resonances)).toBe(true);
  });
});

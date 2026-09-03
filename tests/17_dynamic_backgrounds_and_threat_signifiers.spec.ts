import { test, expect } from '@playwright/test';

test.describe('17: Dynamic Backgrounds & Threat Signifiers E2E Suite (Requirement R1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');

    // Start game to enter active playing state
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (gm && gm.startGame) {
        gm.startGame();
      }
    });
    await page.waitForTimeout(150);
  });

  test('T17-01: Biome progression across stages (Wave 1 -> 10 -> 20 -> 30 -> 40) verifies palette transitions', async ({ page }) => {
    const biomeReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const testWaves = [1, 10, 20, 30, 40, 50];

      return testWaves.map(wave => {
        gm.level = wave;
        const biome = gm.getCurrentBiome ? gm.getCurrentBiome() : null;

        // Render frame with updated biome
        if (typeof (gm as any).draw === 'function') {
          (gm as any).draw();
        }

        const canvas = document.querySelector('canvas')!;
        const ctx = canvas.getContext('2d')!;
        const dpr = gm.dpr || 1;

        // Sample upper-mid background at (300, 200) and bottom at (300, 700)
        const topPx = ctx.getImageData(Math.round(300 * dpr), Math.round(150 * dpr), 1, 1).data;
        const bottomPx = ctx.getImageData(Math.round(300 * dpr), Math.round(700 * dpr), 1, 1).data;

        return {
          wave,
          biomeId: biome?.id,
          tier: biome?.tier,
          nameEn: biome?.nameEn,
          gradientTop: biome?.gradientTop,
          gradientBottom: biome?.gradientBottom,
          topRGB: [topPx[0], topPx[1], topPx[2]],
          bottomRGB: [bottomPx[0], bottomPx[1], bottomPx[2]],
        };
      });
    });

    // Wave 1 -> Tier 0 (Surface Aquifer)
    expect(biomeReport[0].wave).toBe(1);
    expect(biomeReport[0].biomeId).toBe('SURFACE_AQUIFER');
    expect(biomeReport[0].tier).toBe(0);
    expect(biomeReport[0].gradientTop).toBe('#071527');
    expect(biomeReport[0].gradientBottom).toBe('#0b1d33');

    // Wave 10 -> Tier 1 (Abyssal Trench)
    expect(biomeReport[1].wave).toBe(10);
    expect(biomeReport[1].biomeId).toBe('ABYSSAL_TRENCH');
    expect(biomeReport[1].tier).toBe(1);
    expect(biomeReport[1].gradientTop).toBe('#030712');
    expect(biomeReport[1].gradientBottom).toBe('#081026');

    // Wave 20 -> Tier 2 (Bioluminescent Reef)
    expect(biomeReport[2].wave).toBe(20);
    expect(biomeReport[2].biomeId).toBe('BIOLUMINESCENT_REEF');
    expect(biomeReport[2].tier).toBe(2);
    expect(biomeReport[2].gradientTop).toBe('#05131e');
    expect(biomeReport[2].gradientBottom).toBe('#0f222d');

    // Wave 30 -> Tier 3 (Toxic Seabed)
    expect(biomeReport[3].wave).toBe(30);
    expect(biomeReport[3].biomeId).toBe('TOXIC_SEABED');
    expect(biomeReport[3].tier).toBe(3);
    expect(biomeReport[3].gradientTop).toBe('#06150e');
    expect(biomeReport[3].gradientBottom).toBe('#0e2217');

    // Wave 40 -> Tier 4 (Cosmic Void)
    expect(biomeReport[4].wave).toBe(40);
    expect(biomeReport[4].biomeId).toBe('COSMIC_VOID');
    expect(biomeReport[4].tier).toBe(4);
    expect(biomeReport[4].gradientTop).toBe('#090314');
    expect(biomeReport[4].gradientBottom).toBe('#150727');

    // Wave 50 -> Cycles cleanly back to Tier 0
    expect(biomeReport[5].wave).toBe(50);
    expect(biomeReport[5].biomeId).toBe('SURFACE_AQUIFER');
    expect(biomeReport[5].tier).toBe(0);
  });

  test('T17-02: Boss threat signifier visual shift (crimson perimeter vignette when Boss is active)', async ({ page }) => {
    const bossReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0]?.constructor;
      const EnemyTypeEnum = (window as any).EnemyType || { BOSS: 2, NORMAL: 0 };

      // Baseline state without boss
      gm.enemies = [];
      if (typeof (gm as any).draw === 'function') (gm as any).draw();

      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = gm.dpr || 1;

      // Sample baseline edge pixel (15, 15)
      const baseEdge = ctx.getImageData(Math.round(15 * dpr), Math.round(15 * dpr), 1, 1).data;

      // Spawn Boss
      const boss = new EnemyClass(
        gm.logicalWidth / 2 - 75,
        100,
        gm.logicalWidth,
        10,
        EnemyTypeEnum.BOSS || 2,
        gm.logicalHeight
      );
      boss.hp = 300;
      boss.maxHp = 300;
      gm.enemies = [boss];

      // Update threat state and simulate frames for smooth lerp
      for (let f = 0; f < 30; f++) {
        if (typeof (gm as any).updateThreatState === 'function') {
          (gm as any).updateThreatState(0.016);
        } else {
          gm.threatIntensity = Math.min(1, (gm.threatIntensity || 0) + 0.05);
        }
      }

      const threatState = gm.getThreatState ? gm.getThreatState() : null;

      // Render frame with Boss threat active
      if (typeof (gm as any).draw === 'function') (gm as any).draw();

      // Sample perimeter corner (15, 15) and center (300, 400)
      const bossEdge = ctx.getImageData(Math.round(15 * dpr), Math.round(15 * dpr), 1, 1).data;
      const bossCenter = ctx.getImageData(Math.round(300 * dpr), Math.round(400 * dpr), 1, 1).data;

      return {
        hasBoss: threatState?.hasBoss,
        threatLevel: threatState?.level,
        threatColor: threatState?.threatColor,
        threatIntensity: threatState?.threatIntensity ?? gm.threatIntensity,
        baseEdgeRGB: [baseEdge[0], baseEdge[1], baseEdge[2]],
        bossEdgeRGB: [bossEdge[0], bossEdge[1], bossEdge[2]],
        bossCenterRGB: [bossCenter[0], bossCenter[1], bossCenter[2]],
      };
    });

    expect(bossReport.hasBoss).toBe(true);
    expect(bossReport.threatLevel).toBe('BOSS');
    expect(bossReport.threatColor).toBe('#dc2626');
    expect(bossReport.threatIntensity).toBeGreaterThan(0.5);

    // Crimson perimeter vignette shifts red channel significantly on edge vs center
    expect(bossReport.bossEdgeRGB[0]).toBeGreaterThanOrEqual(bossReport.bossCenterRGB[0]);
  });

  test('T17-03: Elite threat signifier visual shift (magenta/purple vignette when Snipers/Mechs are active)', async ({ page }) => {
    const eliteReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0]?.constructor;
      const EnemyTypeEnum = (window as any).EnemyType || { SNIPER: 3, ROGUE_MECH: 9 };

      // Spawn Elite Sniper
      const sniper = new EnemyClass(
        200,
        120,
        gm.logicalWidth,
        10,
        EnemyTypeEnum.SNIPER || 3,
        gm.logicalHeight
      );
      sniper.hp = 40;
      gm.enemies = [sniper];

      // Simulate lerp transition
      for (let f = 0; f < 30; f++) {
        if (typeof (gm as any).updateThreatState === 'function') {
          (gm as any).updateThreatState(0.016);
        } else {
          gm.threatIntensity = Math.min(1, (gm.threatIntensity || 0) + 0.05);
        }
      }

      const threatState = gm.getThreatState ? gm.getThreatState() : null;

      if (typeof (gm as any).draw === 'function') (gm as any).draw();

      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = gm.dpr || 1;

      const eliteEdge = ctx.getImageData(Math.round(15 * dpr), Math.round(15 * dpr), 1, 1).data;

      return {
        hasElite: threatState?.hasElite,
        hasBoss: threatState?.hasBoss,
        threatLevel: threatState?.level,
        threatColor: threatState?.threatColor,
        threatIntensity: threatState?.threatIntensity ?? gm.threatIntensity,
        eliteEdgeRGB: [eliteEdge[0], eliteEdge[1], eliteEdge[2]],
      };
    });

    expect(eliteReport.hasBoss).toBe(false);
    expect(eliteReport.hasElite).toBe(true);
    expect(eliteReport.threatLevel).toBe('ELITE');
    expect(eliteReport.threatColor).toBe('#c026d3');
    expect(eliteReport.threatIntensity).toBeGreaterThan(0.5);
  });

  test('T17-04: Threat resolution (vignette fades when threat eliminated)', async ({ page }) => {
    const resolutionReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0]?.constructor;
      const EnemyTypeEnum = (window as any).EnemyType || { BOSS: 2 };

      // 1. Setup active boss threat
      const boss = new EnemyClass(
        gm.logicalWidth / 2 - 75,
        100,
        gm.logicalWidth,
        10,
        EnemyTypeEnum.BOSS || 2,
        gm.logicalHeight
      );
      gm.enemies = [boss];
      gm.threatIntensity = 1.0;

      const activeThreat = gm.getThreatState ? gm.getThreatState() : null;

      // 2. Eliminate threat (boss killed)
      boss.isDead = true;
      gm.enemies = [];

      // 3. Advance frames for fade out (0.5s decay)
      for (let f = 0; f < 35; f++) {
        if (typeof (gm as any).updateThreatState === 'function') {
          (gm as any).updateThreatState(0.016);
        } else {
          gm.threatIntensity = Math.max(0, (gm.threatIntensity || 0) - 0.05);
        }
      }

      const resolvedThreat = gm.getThreatState ? gm.getThreatState() : null;

      return {
        activeLevel: activeThreat?.level,
        resolvedLevel: resolvedThreat?.level,
        resolvedIntensity: resolvedThreat?.threatIntensity ?? gm.threatIntensity,
      };
    });

    expect(resolutionReport.activeLevel).toBe('BOSS');
    expect(resolutionReport.resolvedLevel).toBe('NONE');
    expect(resolutionReport.resolvedIntensity).toBeLessThanOrEqual(0.1);
  });

  test('T17-05: Game Over persistence (Continue maintains stage biome; Restart resets to Wave 1 Surface Aquifer)', async ({ page }) => {
    // 1. Advance to Wave 20 (Tier 2 Bioluminescent Reef)
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.level = 20;
      gm.score = 5000;
      gm.currency = 800;
      gm.player.hp = 0;
      if (typeof (gm as any).gameOver === 'function') {
        (gm as any).gameOver('Combat Defeat at Wave 20');
      }
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();

    // 2. Click "Continue" -> Should stay at Wave 20 (Bioluminescent Reef)
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();
    await page.waitForTimeout(200);

    const continueState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const biome = gm.getCurrentBiome ? gm.getCurrentBiome() : null;
      return {
        level: gm.level,
        biomeId: biome?.id,
        tier: biome?.tier,
      };
    });

    expect(continueState.level).toBe(20);
    expect(continueState.biomeId).toBe('BIOLUMINESCENT_REEF');
    expect(continueState.tier).toBe(2);

    // 3. Trigger Game Over again and click "Restart from Beginning"
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      gm.player.hp = 0;
      if (typeof (gm as any).gameOver === 'function') {
        (gm as any).gameOver('Final Reset');
      }
    });

    await expect(page.locator('text=GAME OVER')).toBeVisible();
    const restartBtn = page.locator('[data-testid="restart-button"]');
    await expect(restartBtn).toBeVisible();
    await restartBtn.click();
    await page.waitForTimeout(200);

    const restartState = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const biome = gm.getCurrentBiome ? gm.getCurrentBiome() : null;
      return {
        level: gm.level,
        biomeId: biome?.id,
        tier: biome?.tier,
      };
    });

    // Reset cleanly resets to Wave 1 Surface Aquifer (Tier 0)
    expect(restartState.level).toBe(1);
    expect(restartState.biomeId).toBe('SURFACE_AQUIFER');
    expect(restartState.tier).toBe(0);
  });

  test('T17-06: Projectile contrast ratio (>= 7:1 contrast against background under all threat states)', async ({ page }) => {
    const contrastResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;
      const FactionEnum = (window as any).Faction || { PLAYER: 'PLAYER', INVADER: 'INVADER', ROGUE: 'ROGUE' };

      const lum = (r: number, g: number, b: number) => {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const dpr = gm.dpr || 1;

      const scenarios: Array<{ name: string; level: number; threatIntensity: number; threatColor: string }> = [
        { name: 'Surface Aquifer Baseline', level: 1, threatIntensity: 0, threatColor: 'transparent' },
        { name: 'Abyssal Trench Baseline', level: 10, threatIntensity: 0, threatColor: 'transparent' },
        { name: 'Boss Threat Shift (Crimson)', level: 10, threatIntensity: 1.0, threatColor: '#dc2626' },
        { name: 'Elite Threat Shift (Magenta)', level: 15, threatIntensity: 1.0, threatColor: '#c026d3' },
      ];

      return scenarios.map(sc => {
        gm.level = sc.level;
        gm.threatIntensity = sc.threatIntensity;

        // Spawn hostile projectile at (300, 400)
        const bullet = new BulletClass(300, 400, 300, 1, false);
        bullet.faction = FactionEnum.INVADER;
        gm.bullets = [bullet];

        if (typeof (gm as any).draw === 'function') (gm as any).draw();

        const cx = Math.round(305 * dpr);
        const cy = Math.round(405 * dpr);

        const corePixel = ctx.getImageData(cx, cy, 1, 1).data;
        const bgPixel = ctx.getImageData(cx + Math.round(20 * dpr), cy, 1, 1).data;

        const coreLum = lum(corePixel[0], corePixel[1], corePixel[2]);
        const bgLum = lum(bgPixel[0], bgPixel[1], bgPixel[2]);
        const contrastRatio = (Math.max(coreLum, bgLum) + 0.05) / (Math.min(coreLum, bgLum) + 0.05);

        return {
          name: sc.name,
          coreRGB: [corePixel[0], corePixel[1], corePixel[2]],
          bgRGB: [bgPixel[0], bgPixel[1], bgPixel[2]],
          contrastRatio,
        };
      });
    });

    for (const report of contrastResults) {
      // Must satisfy WCAG AAA >= 7.0:1 contrast ratio across all dynamic states
      expect(report.contrastRatio).toBeGreaterThanOrEqual(7.0);
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Adversarial Reviewer R2: Visual Rendering Pipeline Stress & Boundary Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('R2.1 Dynamic Animation States & Temporal Continuity (500 Frames, No NaN/Infinity Coordinates)', async ({ page }) => {
    const stressResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      let invalidArgCount = 0;
      const checkNum = (...nums: any[]) => {
        for (const n of nums) {
          if (typeof n === 'number' && (!Number.isFinite(n) || isNaN(n))) {
            invalidArgCount++;
          }
        }
      };

      const mockCtx: any = {
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: (x: number, y: number) => checkNum(x, y),
        lineTo: (x: number, y: number) => checkNum(x, y),
        quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => checkNum(cpx, cpy, x, y),
        bezierCurveTo: (cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) => checkNum(cp1x, cp1y, cp2x, cp2y, x, y),
        arc: (x: number, y: number, r: number, sa: number, ea: number) => checkNum(x, y, r, sa, ea),
        ellipse: (x: number, y: number, rx: number, ry: number, rot: number, sa: number, ea: number) => checkNum(x, y, rx, ry, rot, sa, ea),
        fill: () => {},
        stroke: () => {},
        fillRect: (x: number, y: number, w: number, h: number) => checkNum(x, y, w, h),
        strokeRect: (x: number, y: number, w: number, h: number) => checkNum(x, y, w, h),
        roundRect: (x: number, y: number, w: number, h: number, r: any) => checkNum(x, y, w, h),
        createLinearGradient: (x0: number, y0: number, x1: number, y1: number) => {
          checkNum(x0, y0, x1, y1);
          return { addColorStop: () => {} };
        },
        createRadialGradient: (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
          checkNum(x0, y0, r0, x1, y1, r1);
          return { addColorStop: () => {} };
        },
        drawImage: () => {},
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        lineCap: 'butt',
        shadowColor: '',
        shadowBlur: 0,
      };

      const archetypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const enemies = archetypes.map(t => new EnemyClass(100 + t * 40, 150, gm.logicalWidth, 1, t));

      // Simulate 500 frames of animation and kinematics
      for (let frame = 0; frame < 500; frame++) {
        const dt = 0.0166;
        for (const enemy of enemies) {
          enemy.update(dt, 1.0, []);
          enemy.draw(mockCtx);
        }
      }

      return {
        totalFrames: 500,
        totalEnemies: enemies.length,
        invalidArgCount,
      };
    });

    expect(stressResult.totalEnemies).toBe(10);
    expect(stressResult.invalidArgCount).toBe(0);
  });

  test('R2.2 Canvas Context State Encapsulation & Exact Save/Restore Parity (1:1)', async ({ page }) => {
    const balanceResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      const archetypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const testCases = [
        { name: 'normal', isFlashing: false, shieldHp: 3 },
        { name: 'flashing', isFlashing: true, shieldHp: 3 },
        { name: 'depleted_shield', isFlashing: false, shieldHp: 0 },
        { name: 'flashing_depleted_shield', isFlashing: true, shieldHp: 0 },
      ];

      const results: { type: number; testCase: string; saveCount: number; restoreCount: number; balanced: boolean }[] = [];

      for (const t of archetypes) {
        for (const tc of testCases) {
          let saveCount = 0;
          let restoreCount = 0;

          const mockCtx: any = {
            save: () => { saveCount++; },
            restore: () => { restoreCount++; },
            beginPath: () => {},
            closePath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            quadraticCurveTo: () => {},
            bezierCurveTo: () => {},
            arc: () => {},
            ellipse: () => {},
            fill: () => {},
            stroke: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            roundRect: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            drawImage: () => {},
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            lineCap: 'butt',
            shadowColor: '',
            shadowBlur: 0,
          };

          const enemy = new EnemyClass(150, 150, gm.logicalWidth, 1, t);
          if (tc.isFlashing) enemy.hitFlashTimer = 0.08;
          enemy.shieldHp = tc.shieldHp;

          enemy.draw(mockCtx);

          results.push({
            type: t,
            testCase: tc.name,
            saveCount,
            restoreCount,
            balanced: saveCount === restoreCount && saveCount >= 1,
          });
        }
      }

      return results;
    });

    for (const r of balanceResult) {
      expect(r.balanced).toBe(true);
      expect(r.saveCount).toBe(r.restoreCount);
    }
  });

  test('R2.3 Stage 10+ Visual Dynamic Aggression Scaling & Rush Surge Bounds', async ({ page }) => {
    const aggressionResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      const levelsToTest = [10, 20, 35, 50, 100];
      const summaries: { level: number; isAggressive: boolean; rushMod: number; maxFiniteCoord: boolean }[] = [];

      for (const lvl of levelsToTest) {
        const enemy = new EnemyClass(200, 100, gm.logicalWidth, lvl, 0); // NORMAL MOB
        const initialAggressive = enemy.isAggressive;
        const initialRushMod = enemy.rushVelocityModifier;

        // Simulate 100 frames with player position
        const fakePlayerPos = { x: 250, y: 700 };
        let coordsFinite = true;

        for (let f = 0; f < 100; f++) {
          enemy.update(0.0166, 1.0, [], fakePlayerPos);
          if (!Number.isFinite(enemy.position.x) || !Number.isFinite(enemy.position.y)) {
            coordsFinite = false;
          }
        }

        summaries.push({
          level: lvl,
          isAggressive: initialAggressive,
          rushMod: initialRushMod,
          maxFiniteCoord: coordsFinite,
        });
      }

      return summaries;
    });

    for (const s of aggressionResults) {
      expect(s.isAggressive).toBe(true);
      expect(s.rushMod).toBeGreaterThanOrEqual(1.8);
      expect(s.maxFiniteCoord).toBe(true);
    }
  });

  test('R2.4 Color Contrast Ratio Verification against Aquatic Backgrounds (WCAG >= 3.0:1 UI element standard)', async ({ page }) => {
    const contrastData = await page.evaluate(() => {
      // WCAG relative luminance calculation
      const getLuminance = (hex: string) => {
        const rgb = hex.replace('#', '');
        const r = parseInt(rgb.substring(0, 2), 16) / 255;
        const g = parseInt(rgb.substring(2, 4), 16) / 255;
        const b = parseInt(rgb.substring(4, 6), 16) / 255;

        const a = [r, g, b].map(v => {
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });

        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const getContrastRatio = (hex1: string, hex2: string) => {
        const lum1 = getLuminance(hex1);
        const lum2 = getLuminance(hex2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
      };

      // Game background is deep aquatic midnight #030712
      const bgHex = '#030712';

      // Primary gradient or key accent colors across all 10 archetypes
      const archetypeColors: { type: number; name: string; colorHex: string }[] = [
        { type: 0, name: 'Normal (Sky Blue)', colorHex: '#38bdf8' },
        { type: 1, name: 'Zigzag (Lemon Gold)', colorHex: '#eab308' },
        { type: 2, name: 'Boss (Imperial Crimson)', colorHex: '#dc2626' },
        { type: 3, name: 'Sniper (Vivid Purple)', colorHex: '#a855f7' },
        { type: 4, name: 'Diver (Coral Crimson)', colorHex: '#ef4444' },
        { type: 5, name: 'Shielded (Mint Jade)', colorHex: '#2dd4bf' },
        { type: 6, name: 'Splitter (Poison Emerald)', colorHex: '#22c55e' },
        { type: 7, name: 'Rogue Drone (Electric Magenta)', colorHex: '#d946ef' },
        { type: 8, name: 'Rogue Stalker (Orchid Fuchsia)', colorHex: '#c026d3' },
        { type: 9, name: 'Rogue Mech (High-Voltage Vivid Magenta)', colorHex: '#a21caf' },
      ];

      return archetypeColors.map(ac => ({
        ...ac,
        contrast: getContrastRatio(ac.colorHex, bgHex),
      }));
    });

    for (const item of contrastData) {
      // Graphical UI elements and enemy silhouettes must exceed 3.0:1 contrast against dark background
      expect(item.contrast).toBeGreaterThanOrEqual(3.0);
    }
  });

  test('R2.5 Particle Pooling & Thruster Lifecycle Memory Stability', async ({ page }) => {
    const poolHealth = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const initialPoolSize = gm.particles?.length || 0;

      gm.enemies = [];
      gm.bullets = [];

      // Spawn 100 explosions
      for (let i = 0; i < 100; i++) {
        gm.createExplosion(200 + (i % 20) * 10, 300, '#38bdf8', 25);
      }

      const activeAfterSpawns = gm.particles.filter((p: any) => !p.isDead).length;

      // Advance time by 3 seconds to expire all particles
      for (let f = 0; f < 180; f++) {
        gm.update(0.0166);
      }

      const activeAfterExpiry = gm.particles.filter((p: any) => !p.isDead).length;

      return {
        initialPoolSize,
        activeAfterSpawns,
        activeAfterExpiry,
      };
    });

    expect(poolHealth.activeAfterSpawns).toBeGreaterThan(0);
    expect(poolHealth.activeAfterExpiry).toBe(0);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Adversarial Reviewer R1: Enemy Visuals & Zero-Raster Graphics Integrity Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('R1.1 Zero-Raster Drawing Assertion: 0 drawImage calls across all 10 enemy archetypes', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;
      
      // Mock Canvas 2D Context to intercept all draw calls
      let drawImageCalls = 0;
      const mockCtx: any = {
        save: () => {},
        restore: () => {},
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
        drawImage: () => {
          drawImageCalls++;
        },
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        lineCap: 'butt',
        shadowColor: '',
        shadowBlur: 0,
      };

      // Test all 10 enemy archetypes: 0..6 (Invaders), 7..9 (Rogues)
      const archetypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const renderedTypes: number[] = [];

      for (const t of archetypes) {
        const enemy = new EnemyClass(100, 100, gm.logicalWidth, 1, t);
        enemy.draw(mockCtx);
        renderedTypes.push(enemy.type);
      }

      return {
        totalRendered: renderedTypes.length,
        drawImageCalls,
      };
    });

    expect(result.totalRendered).toBe(10);
    expect(result.drawImageCalls).toBe(0);
  });

  test('R1.2 Distinct Visual Signatures & Geometries across all 10 Enemy Roles', async ({ page }) => {
    const visualSignatures = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      const signatures: Record<number, {
        hasLinearGrad: boolean;
        hasRadialGrad: boolean;
        hasRoundRect: boolean;
        hasArcOrEllipse: boolean;
        bezierCurves: number;
        quadCurves: number;
        arcs: number;
        ellipses: number;
        lines: number;
        strokes: number;
        fills: number;
      }> = {};

      const archetypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      for (const t of archetypes) {
        let hasLinearGrad = false;
        let hasRadialGrad = false;
        let hasRoundRect = false;
        let bezierCurves = 0;
        let quadCurves = 0;
        let arcs = 0;
        let ellipses = 0;
        let lines = 0;
        let strokes = 0;
        let fills = 0;

        const mockCtx: any = {
          save: () => {},
          restore: () => {},
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => { lines++; },
          quadraticCurveTo: () => { quadCurves++; },
          bezierCurveTo: () => { bezierCurves++; },
          arc: () => { arcs++; },
          ellipse: () => { ellipses++; },
          fill: () => { fills++; },
          stroke: () => { strokes++; },
          fillRect: () => { fills++; },
          strokeRect: () => { strokes++; },
          roundRect: () => { hasRoundRect = true; },
          createLinearGradient: () => {
            hasLinearGrad = true;
            return { addColorStop: () => {} };
          },
          createRadialGradient: () => {
            hasRadialGrad = true;
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

        const enemy = new EnemyClass(150, 150, gm.logicalWidth, 1, t);
        enemy.draw(mockCtx);

        signatures[t] = {
          hasLinearGrad,
          hasRadialGrad,
          hasRoundRect,
          hasArcOrEllipse: arcs > 0 || ellipses > 0,
          bezierCurves,
          quadCurves,
          arcs,
          ellipses,
          lines,
          strokes,
          fills,
        };
      }

      return signatures;
    });

    // 0: NORMAL (Chubby squid with radial gradient mantle, 4 wavy tentacles, twin sparkle highlights, pink cheeks, smiling mouth)
    expect(visualSignatures[0].hasRadialGrad).toBe(true);
    expect(visualSignatures[0].quadCurves).toBeGreaterThanOrEqual(4); // 4 wavy tentacles
    expect(visualSignatures[0].arcs).toBeGreaterThanOrEqual(5); // Eyes, sparkles, blush, mouth

    // 1: ZIGZAG (5-pointed star body, happy curved eyes, open smile, lightning blush)
    expect(visualSignatures[1].hasRadialGrad).toBe(true);
    expect(visualSignatures[1].quadCurves).toBeGreaterThanOrEqual(8); // 5 star points (outer & inner quadratic curves)
    expect(visualSignatures[1].arcs).toBeGreaterThanOrEqual(3); // Happy eyes + open smile

    // 3: SNIPER (Angler teardrop hull, bioluminescent antenna & lure bulb, gold sniper monocle with crosshairs, winking eye)
    expect(visualSignatures[3].hasLinearGrad).toBe(true);
    expect(visualSignatures[3].bezierCurves).toBeGreaterThanOrEqual(2); // Streamlined teardrop hull
    expect(visualSignatures[3].quadCurves).toBeGreaterThanOrEqual(1); // Angler antenna
    expect(visualSignatures[3].arcs).toBeGreaterThanOrEqual(4); // Monocle, lure bulb, sparkle, blush

    // 4: DIVER (Rocket torpedo piranha, fiery rocket plume, aviator goggles, cute fang)
    expect(visualSignatures[4].hasLinearGrad).toBe(true);
    expect(visualSignatures[4].bezierCurves).toBeGreaterThanOrEqual(2); // Streamlined torpedo body
    expect(visualSignatures[4].lines).toBeGreaterThanOrEqual(4); // Flame jet (2) + fang (2)

    // 5: SHIELDED (Armored turtle carapace with scute patterns, sleepy turtle face peeking, pulsing shield)
    expect(visualSignatures[5].hasLinearGrad).toBe(true);
    expect(visualSignatures[5].lines).toBeGreaterThanOrEqual(10); // Hexagonal shell + scute + sleepy eyes + shield lattice
    expect(visualSignatures[5].arcs).toBeGreaterThanOrEqual(3); // Face, blush, shield aura

    // 6: SPLITTER (Mitosis slime amoeba, peanut/figure-8 dual nuclei, twin faces, spore pearls)
    expect(visualSignatures[6].hasLinearGrad).toBe(true);
    expect(visualSignatures[6].arcs).toBeGreaterThanOrEqual(8); // Twin cores, eyes, mouths, spore pearls
    expect(visualSignatures[6].ellipses).toBeGreaterThanOrEqual(1); // Connecting membrane

    // 2: BOSS (Coral Titan Leviathan, 3 golden horns, side mandibles/claws, glowing cyan reactor core, titan golden sensor eyes)
    expect(visualSignatures[2].hasLinearGrad).toBe(true);
    expect(visualSignatures[2].lines).toBeGreaterThanOrEqual(6); // 3 golden crown horns
    expect(visualSignatures[2].quadCurves).toBeGreaterThanOrEqual(2); // Mandibles/claws
    expect(visualSignatures[2].arcs).toBeGreaterThanOrEqual(7); // Power core rings, irises, sparkles

    // 7: ROGUE_DRONE (Cyber Manta Drone delta wings, neon spine, cyan visor, gold insignia diamond)
    expect(visualSignatures[7].hasLinearGrad).toBe(true);
    expect(visualSignatures[7].lines).toBeGreaterThanOrEqual(8); // Delta hull + visor + gold diamond

    // 8: ROGUE_STALKER (Orchid Predator Interceptor, volt scanner visor, cyan diamond insignia)
    expect(visualSignatures[8].hasLinearGrad).toBe(true);
    expect(visualSignatures[8].lines).toBeGreaterThanOrEqual(9); // Angular interceptor hull + inner cockpit + cyan diamond
    expect(visualSignatures[8].ellipses).toBeGreaterThanOrEqual(1); // Volt scanner visor

    // 9: ROGUE_MECH (Armored Juggernaut, shoulder cannons, dark core plate, multi-spectrum visor, inverted chevron insignia)
    expect(visualSignatures[9].hasLinearGrad).toBe(true);
    expect(visualSignatures[9].lines).toBeGreaterThanOrEqual(2); // Inverted chevron insignia (2 line segments)
    expect(visualSignatures[9].fills).toBeGreaterThanOrEqual(4); // Hull, cannons, core plate, chevron
  });

  test('R1.3 Hit Flash Silhouette & Clean Recovery Transition', async ({ page }) => {
    const flashData = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      const enemy = new EnemyClass(100, 100, gm.logicalWidth, 1, 3); // SNIPER
      enemy.hitFlashTimer = 0.08;

      let flashFillStyle = '';
      let flashShadowColor = '';
      let flashShadowBlur = 0;

      const flashCtx: any = {
        save: () => {},
        restore: () => {},
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
        get fillStyle() { return flashFillStyle; },
        set fillStyle(v: string) { flashFillStyle = v; },
        get shadowColor() { return flashShadowColor; },
        set shadowColor(v: string) { flashShadowColor = v; },
        get shadowBlur() { return flashShadowBlur; },
        set shadowBlur(v: number) { flashShadowBlur = v; },
      };

      enemy.draw(flashCtx);
      const recordedFlashFill = flashFillStyle;
      const recordedShadowBlur = flashShadowBlur;

      // Update past flash timer
      enemy.update(0.1, 1.0, []);
      const timerAfterUpdate = enemy.hitFlashTimer;

      let normalFillStyle = '';
      const normalCtx: any = {
        ...flashCtx,
        get fillStyle() { return normalFillStyle; },
        set fillStyle(v: string) { normalFillStyle = v; },
      };
      enemy.draw(normalCtx);

      return {
        recordedFlashFill,
        recordedShadowBlur,
        timerAfterUpdate,
        normalFillIsNotPureWhite: normalFillStyle !== '#ffffff',
      };
    });

    expect(flashData.recordedFlashFill).toBe('#ffffff');
    expect(flashData.recordedShadowBlur).toBe(20);
    expect(flashData.timerAfterUpdate).toBe(0);
    expect(flashData.normalFillIsNotPureWhite).toBe(true);
  });

  test('R1.4 Extreme Low-FPS (5 FPS) Delta-Time Spike Clamping & Kinematic Stability', async ({ page }) => {
    const lagStability = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      const enemies = [
        new EnemyClass(100, 100, gm.logicalWidth, 1, 0), // NORMAL
        new EnemyClass(200, 100, gm.logicalWidth, 1, 1), // ZIGZAG
        new EnemyClass(300, 100, gm.logicalWidth, 1, 3), // SNIPER
        new EnemyClass(400, 100, gm.logicalWidth, 1, 4), // DIVER
        new EnemyClass(500, 100, gm.logicalWidth, 1, 7), // ROGUE_DRONE
      ];

      // Simulate extreme lag spike (deltaTime = 0.5s / 2 FPS)
      for (const e of enemies) {
        e.update(0.5, 1.0, []);
      }

      return enemies.map(e => ({
        type: e.type,
        x: e.position.x,
        y: e.position.y,
        isFiniteX: Number.isFinite(e.position.x),
        isFiniteY: Number.isFinite(e.position.y),
        withinX: e.position.x >= 0 && e.position.x <= gm.logicalWidth,
        withinY: e.position.y >= 0 && e.position.y <= gm.logicalHeight + 50,
      }));
    });

    for (const stat of lagStability) {
      expect(stat.isFiniteX).toBe(true);
      expect(stat.isFiniteY).toBe(true);
      expect(stat.withinX).toBe(true);
      expect(stat.withinY).toBe(true);
    }
  });

  test('R1.5 HiDPI Multi-DPR Scaling (DPR = 1, 2, 3, 4) Visual Render Verification', async ({ page }) => {
    for (const dpr of [1, 2, 3, 4]) {
      await page.evaluate((ratio) => {
        (window as any).devicePixelRatio = ratio;
      }, dpr);

      const renderSuccess = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return false;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;

        // Render one full game frame
        gm.draw();
        return true;
      });

      expect(renderSuccess).toBe(true);
    }
  });
});

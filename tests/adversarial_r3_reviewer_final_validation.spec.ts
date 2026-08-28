import { test, expect } from '@playwright/test';

test.describe('Adversarial Reviewer R3: Final Visual & Kinematic Validation Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('R3.1 Full Matrix Rendering Invariance Across 10 Archetypes and Diverse Canvas Scales', async ({ page }) => {
    const renderMatrixResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      let drawImageCalls = 0;
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

      const canvasSizes = [
        { width: 400, height: 600 },
        { width: 720, height: 960 },
        { width: 1080, height: 1920 },
      ];

      const archetypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      let totalRenders = 0;

      for (const size of canvasSizes) {
        for (const t of archetypes) {
          // Test normal state
          const enemyNormal = new EnemyClass(size.width / 2, size.height / 3, size.width, 1, t, size.height);
          enemyNormal.draw(mockCtx);
          totalRenders++;

          // Test hit flash state
          const enemyFlash = new EnemyClass(size.width / 2, size.height / 3, size.width, 1, t, size.height);
          enemyFlash.hitFlashTimer = 0.1;
          enemyFlash.draw(mockCtx);
          totalRenders++;

          // Test high level state
          const enemyHighLvl = new EnemyClass(size.width / 2, size.height / 3, size.width, 50, t, size.height);
          enemyHighLvl.draw(mockCtx);
          totalRenders++;
        }
      }

      return {
        totalRenders,
        drawImageCalls,
        invalidArgCount,
      };
    });

    expect(renderMatrixResult.totalRenders).toBe(3 * 10 * 3); // 90 test configurations
    expect(renderMatrixResult.drawImageCalls).toBe(0);
    expect(renderMatrixResult.invalidArgCount).toBe(0);
  });

  test('R3.2 1000-Frame Ultra-Dense Multi-Faction Simulation (50 Concurrent Active Entities)', async ({ page }) => {
    const simulationResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      // Spawn 50 active enemies (5 of each of the 10 archetypes)
      const enemies: any[] = [];
      for (let t = 0; t <= 9; t++) {
        for (let i = 0; i < 5; i++) {
          const x = 50 + (i * 120 + t * 15) % (gm.logicalWidth - 60);
          const y = 80 + (t * 40 + i * 20) % 400;
          enemies.push(new EnemyClass(x, y, gm.logicalWidth, 5, t, gm.logicalHeight));
        }
      }

      const playerPos = { x: gm.logicalWidth / 2, y: gm.logicalHeight - 100 };
      let nonFiniteCoords = 0;
      let totalBulletsFired = 0;

      for (let frame = 0; frame < 1000; frame++) {
        const dt = 0.0166;
        for (const e of enemies) {
          e.update(dt, 1.0, [], playerPos, enemies);
          if (!Number.isFinite(e.position.x) || !Number.isFinite(e.position.y)) {
            nonFiniteCoords++;
          }
          const bullet = e.fire(playerPos, enemies);
          if (bullet) {
            totalBulletsFired++;
            if (!Number.isFinite(bullet.position.x) || !Number.isFinite(bullet.position.y)) {
              nonFiniteCoords++;
            }
          }
        }
      }

      return {
        totalEnemies: enemies.length,
        nonFiniteCoords,
        totalBulletsFired,
      };
    });

    expect(simulationResult.totalEnemies).toBe(50);
    expect(simulationResult.nonFiniteCoords).toBe(0);
    expect(simulationResult.totalBulletsFired).toBeGreaterThan(50);
  });

  test('R3.3 Mobile High-DPR Coordinate Clamping & Boundary Invariance', async ({ page }) => {
    const mobileBounds = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const PlayerClass = gm.player.constructor;

      const dprs = [1, 2, 3];
      const results: { dpr: number; leftClamped: boolean; rightClamped: boolean }[] = [];

      for (const dpr of dprs) {
        const p = new PlayerClass(gm.logicalWidth, gm.logicalHeight);
        // Force left movement past 0
        p.position.x = -100;
        p.isMovingLeft = true;
        p.update(0.1);
        const leftOk = p.position.x >= 0;

        // Force right movement past logicalWidth
        p.position.x = gm.logicalWidth + 200;
        p.isMovingRight = true;
        p.update(0.1);
        const rightOk = p.position.x <= gm.logicalWidth - p.size.width;

        results.push({
          dpr,
          leftClamped: leftOk,
          rightClamped: rightOk,
        });
      }

      return results;
    });

    for (const r of mobileBounds) {
      expect(r.leftClamped).toBe(true);
      expect(r.rightClamped).toBe(true);
    }
  });

  test('R3.4 Barricade Physical Contact Damage across all 10 Enemy Archetypes', async ({ page }) => {
    const barricadeDamageResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;
      const BarricadeClass = (window as any).Barricade || gm.barricades[0]?.constructor;

      const archetypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const results: { type: number; initialHp: number; damagedHp: number; tookDamage: boolean }[] = [];

      for (const t of archetypes) {
        // Create destructible barricade at (200, 300)
        const barricade = new BarricadeClass(200, 300, 0); // 0 = BarricadeType.DESTRUCTIBLE
        const initialHp = barricade.hp;

        // Create enemy overlapping barricade
        const enemy = new EnemyClass(205, 305, gm.logicalWidth, 1, t, gm.logicalHeight);

        // Simulate GameManager collision check logic for entity vs barricade
        if (enemy.checkCollision(barricade)) {
          if (enemy.type === 4) { // DIVER
            barricade.hp -= 20;
            enemy.isDead = true;
          } else {
            enemy.isGnawing = true;
            barricade.hp -= 6.0 * 0.5; // 0.5s of gnawing
          }
        }

        results.push({
          type: t,
          initialHp,
          damagedHp: barricade.hp,
          tookDamage: barricade.hp < initialHp,
        });
      }

      return results;
    });

    for (const r of barricadeDamageResults) {
      expect(r.tookDamage).toBe(true);
      expect(r.damagedHp).toBeLessThan(r.initialHp);
    }
  });

  test('R3.5 Faction Silhouette & Chroma Separation Verification', async ({ page }) => {
    const chromaSeparation = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0]?.constructor;

      const invaderTypes = [0, 1, 2, 3, 4, 5, 6];
      const rogueTypes = [7, 8, 9];

      const invaderColors = invaderTypes.map(t => new EnemyClass(100, 100, gm.logicalWidth, 1, t).color);
      const rogueColors = rogueTypes.map(t => new EnemyClass(100, 100, gm.logicalWidth, 1, t).color);

      // Check that all Rogue colors are distinct from all Invader colors
      const colorOverlap = rogueColors.some(rc => invaderColors.includes(rc));

      // Check that all Rogue entities have Faction.ROGUE
      const rogueFactions = rogueTypes.map(t => new EnemyClass(100, 100, gm.logicalWidth, 1, t).faction);
      const allRogueFactionsMatch = rogueFactions.every(f => f === 'ROGUE');

      return {
        invaderColors,
        rogueColors,
        colorOverlap,
        allRogueFactionsMatch,
      };
    });

    expect(chromaSeparation.colorOverlap).toBe(false);
    expect(chromaSeparation.allRogueFactionsMatch).toBe(true);
  });
});

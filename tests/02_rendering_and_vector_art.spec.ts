import { test, expect } from '@playwright/test';

test.describe('R1: Canvas Rendering & Vector Graphics Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('Player Cute Droplet vector rendering and state transitions', async ({ page }) => {
    const playerData = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const player = gm.player;
      return {
        x: player.position.x,
        y: player.position.y,
        width: player.size.width,
        height: player.size.height,
        color: player.color,
        hp: player.hp,
        maxHp: player.maxHp,
        stressLevel: player.stressLevel,
        suppressionLevel: player.suppressionLevel,
      };
    });

    expect(playerData.width).toBe(50);
    expect(playerData.height).toBe(40);
    expect(playerData.hp).toBe(3);
    expect(playerData.maxHp).toBe(5);

    // Test player draw under different visual states without runtime exceptions
    const renderTestResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const player = gm.player;

      const statesTested: string[] = [];

      // 1. Normal state
      player.hp = player.maxHp;
      player.stressLevel = 0;
      player.suppressionLevel = 0;
      player.draw(ctx);
      statesTested.push('normal_droplet');

      // 2. High stress state (angry red eyes, red radial glow)
      player.stressLevel = 80;
      player.draw(ctx);
      statesTested.push('stressed_droplet');

      // 3. High suppression state (dizzy @_@ eyes, slate glow, jitter)
      player.stressLevel = 0;
      player.suppressionLevel = 80;
      player.draw(ctx);
      statesTested.push('suppressed_droplet');

      // 4. Low HP band-aid state (HP <= 2)
      player.hp = 2;
      player.draw(ctx);
      statesTested.push('bandaid_droplet');

      // 5. Critical HP crack state (HP <= 1)
      player.hp = 1;
      player.draw(ctx);
      statesTested.push('cracked_droplet');

      return statesTested;
    });

    expect(renderTestResults).toEqual([
      'normal_droplet',
      'stressed_droplet',
      'suppressed_droplet',
      'bandaid_droplet',
      'cracked_droplet',
    ]);
  });

  test('All 7 Enemy types render procedural vector graphics without errors', async ({ page }) => {
    const enemyRenderResults = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const canvas = document.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;

      // Reference EnemyType enum:
      // 0: NORMAL, 1: ZIGZAG, 2: BOSS, 3: SNIPER, 4: DIVER, 5: SHIELDED, 6: SPLITTER
      const results: { type: number; typeName: string; color: string; width: number; height: number; drewSuccessfully: boolean }[] = [];

      const EnemyClass = gm.enemies[0]?.constructor;
      if (!EnemyClass) throw new Error('Enemy class not available');

      const enemyTypeConfigs = [
        { type: 0, name: 'NORMAL', expectedColor: '#f97316', w: 40, h: 30 },
        { type: 1, name: 'ZIGZAG', expectedColor: '#eab308', w: 40, h: 30 },
        { type: 2, name: 'BOSS', expectedColor: '#dc2626', w: 150, h: 100 },
        { type: 3, name: 'SNIPER', expectedColor: '#a855f7', w: 40, h: 30 },
        { type: 4, name: 'DIVER', expectedColor: '#ef4444', w: 40, h: 30 },
        { type: 5, name: 'SHIELDED', expectedColor: '#64748b', w: 40, h: 30 },
        { type: 6, name: 'SPLITTER', expectedColor: '#22c55e', w: 50, h: 40 },
      ];

      for (const config of enemyTypeConfigs) {
        const enemy = new EnemyClass(100, 100, canvas.width, 1, config.type);
        let drewSuccessfully = false;
        try {
          enemy.draw(ctx);
          drewSuccessfully = true;
        } catch (e) {
          drewSuccessfully = false;
        }
        results.push({
          type: config.type,
          typeName: config.name,
          color: enemy.color,
          width: enemy.size.width,
          height: enemy.size.height,
          drewSuccessfully,
        });
      }

      return results;
    });

    expect(enemyRenderResults.length).toBe(7);
    for (const res of enemyRenderResults) {
      expect(res.drewSuccessfully).toBe(true);
      expect(res.color).toBeTruthy();
      expect(res.width).toBeGreaterThan(0);
      expect(res.height).toBeGreaterThan(0);
    }

    // Check specific characteristics
    const normalEnemy = enemyRenderResults.find(e => e.typeName === 'NORMAL')!;
    expect(normalEnemy.color).toBe('#f97316'); // Orange

    const sniperEnemy = enemyRenderResults.find(e => e.typeName === 'SNIPER')!;
    expect(sniperEnemy.color).toBe('#a855f7'); // Purple

    const diverEnemy = enemyRenderResults.find(e => e.typeName === 'DIVER')!;
    expect(diverEnemy.color).toBe('#ef4444'); // Red

    const bossEnemy = enemyRenderResults.find(e => e.typeName === 'BOSS')!;
    expect(bossEnemy.color).toBe('#dc2626'); // Dark Red
    expect(bossEnemy.width).toBe(150);
    expect(bossEnemy.height).toBe(100);

    const splitterEnemy = enemyRenderResults.find(e => e.typeName === 'SPLITTER')!;
    expect(splitterEnemy.color).toBe('#22c55e'); // Green
    expect(splitterEnemy.width).toBe(50);
    expect(splitterEnemy.height).toBe(40);
  });

  test('Barricades layout and voxel block grid rendering', async ({ page }) => {
    const barricadeInfo = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      return gm.barricades.map((b: any) => ({
        x: b.position.x,
        y: b.position.y,
        width: b.size.width,
        height: b.size.height,
        type: b.type, // 0: DESTRUCTIBLE, 1: INDESTRUCTIBLE
        color: b.color,
        hp: b.hp,
        maxHp: b.maxHp,
        totalBlocks: b.blocks.length,
      }));
    });

    expect(barricadeInfo.length).toBe(4);
    // 1st and 4th: DESTRUCTIBLE (Sky blue #38bdf8, HP: 20)
    expect(barricadeInfo[0].type).toBe(0);
    expect(barricadeInfo[0].color).toBe('#38bdf8');
    expect(barricadeInfo[0].hp).toBe(20);
    expect(barricadeInfo[0].totalBlocks).toBe(24); // 6x4 blocks

    expect(barricadeInfo[3].type).toBe(0);
    expect(barricadeInfo[3].color).toBe('#38bdf8');

    // 2nd and 3rd: INDESTRUCTIBLE (Slate #94a3b8)
    expect(barricadeInfo[1].type).toBe(1);
    expect(barricadeInfo[1].color).toBe('#94a3b8');
    expect(barricadeInfo[2].type).toBe(1);
    expect(barricadeInfo[2].color).toBe('#94a3b8');
  });
});

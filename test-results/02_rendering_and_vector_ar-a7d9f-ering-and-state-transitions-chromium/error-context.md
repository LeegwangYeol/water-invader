# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02_rendering_and_vector_art.spec.ts >> R1: Canvas Rendering & Vector Graphics Verification Suite >> Player Cute Droplet vector rendering and state transitions
- Location: tests\02_rendering_and_vector_art.spec.ts:10:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 3
Received: 5
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "Water Invader" [level=1] [ref=e4]
      - paragraph [ref=e5]: Use Left/Right Arrows or A/D to move. Spacebar to shoot.
    - generic [ref=e6]:
      - generic:
        - generic:
          - 'heading "Score: 0" [level=2]'
          - paragraph: "Pure Water: 0 💧"
          - paragraph: WAVE 1
      - generic [ref=e10]:
        - generic [ref=e11]:
          - button "ALLY(Q)" [ref=e12]
          - button "ULT(0%)" [ref=e13]
        - button "FIRE!" [ref=e14]
  - alert [ref=e15]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('R1: Canvas Rendering & Vector Graphics Verification Suite', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |     await page.waitForLoadState('networkidle');
  7   |     await page.locator('button', { hasText: 'START GAME' }).click();
  8   |   });
  9   | 
  10  |   test('Player Cute Droplet vector rendering and state transitions', async ({ page }) => {
  11  |     const playerData = await page.evaluate(() => {
  12  |       const gm = (window as any).gameManager;
  13  |       const player = gm.player;
  14  |       return {
  15  |         x: player.position.x,
  16  |         y: player.position.y,
  17  |         width: player.size.width,
  18  |         height: player.size.height,
  19  |         color: player.color,
  20  |         hp: player.hp,
  21  |         maxHp: player.maxHp,
  22  |         stressLevel: player.stressLevel,
  23  |         suppressionLevel: player.suppressionLevel,
  24  |       };
  25  |     });
  26  | 
  27  |     expect(playerData.width).toBe(50);
  28  |     expect(playerData.height).toBe(40);
  29  |     expect(playerData.color).toBe('#3b82f6');
> 30  |     expect(playerData.hp).toBe(3);
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  31  |     expect(playerData.maxHp).toBe(3);
  32  | 
  33  |     // Test player draw under different visual states without runtime exceptions
  34  |     const renderTestResults = await page.evaluate(() => {
  35  |       const gm = (window as any).gameManager;
  36  |       const canvas = document.querySelector('canvas')!;
  37  |       const ctx = canvas.getContext('2d')!;
  38  |       const player = gm.player;
  39  | 
  40  |       const statesTested: string[] = [];
  41  | 
  42  |       // 1. Normal state
  43  |       player.hp = 3;
  44  |       player.stressLevel = 0;
  45  |       player.suppressionLevel = 0;
  46  |       player.draw(ctx);
  47  |       statesTested.push('normal_droplet');
  48  | 
  49  |       // 2. High stress state (angry red eyes, red radial glow)
  50  |       player.stressLevel = 80;
  51  |       player.draw(ctx);
  52  |       statesTested.push('stressed_droplet');
  53  | 
  54  |       // 3. High suppression state (dizzy @_@ eyes, slate glow, jitter)
  55  |       player.stressLevel = 0;
  56  |       player.suppressionLevel = 80;
  57  |       player.draw(ctx);
  58  |       statesTested.push('suppressed_droplet');
  59  | 
  60  |       // 4. Low HP band-aid state (HP <= 2)
  61  |       player.hp = 2;
  62  |       player.draw(ctx);
  63  |       statesTested.push('bandaid_droplet');
  64  | 
  65  |       // 5. Critical HP crack state (HP <= 1)
  66  |       player.hp = 1;
  67  |       player.draw(ctx);
  68  |       statesTested.push('cracked_droplet');
  69  | 
  70  |       return statesTested;
  71  |     });
  72  | 
  73  |     expect(renderTestResults).toEqual([
  74  |       'normal_droplet',
  75  |       'stressed_droplet',
  76  |       'suppressed_droplet',
  77  |       'bandaid_droplet',
  78  |       'cracked_droplet',
  79  |     ]);
  80  |   });
  81  | 
  82  |   test('All 7 Enemy types render procedural vector graphics without errors', async ({ page }) => {
  83  |     const enemyRenderResults = await page.evaluate(() => {
  84  |       const gm = (window as any).gameManager;
  85  |       const canvas = document.querySelector('canvas')!;
  86  |       const ctx = canvas.getContext('2d')!;
  87  | 
  88  |       // Reference EnemyType enum:
  89  |       // 0: NORMAL, 1: ZIGZAG, 2: BOSS, 3: SNIPER, 4: DIVER, 5: SHIELDED, 6: SPLITTER
  90  |       const results: { type: number; typeName: string; color: string; width: number; height: number; drewSuccessfully: boolean }[] = [];
  91  | 
  92  |       const EnemyClass = gm.enemies[0]?.constructor;
  93  |       if (!EnemyClass) throw new Error('Enemy class not available');
  94  | 
  95  |       const enemyTypeConfigs = [
  96  |         { type: 0, name: 'NORMAL', expectedColor: '#f97316', w: 40, h: 30 },
  97  |         { type: 1, name: 'ZIGZAG', expectedColor: '#eab308', w: 40, h: 30 },
  98  |         { type: 2, name: 'BOSS', expectedColor: '#dc2626', w: 150, h: 100 },
  99  |         { type: 3, name: 'SNIPER', expectedColor: '#a855f7', w: 40, h: 30 },
  100 |         { type: 4, name: 'DIVER', expectedColor: '#ef4444', w: 40, h: 30 },
  101 |         { type: 5, name: 'SHIELDED', expectedColor: '#64748b', w: 40, h: 30 },
  102 |         { type: 6, name: 'SPLITTER', expectedColor: '#22c55e', w: 50, h: 40 },
  103 |       ];
  104 | 
  105 |       for (const config of enemyTypeConfigs) {
  106 |         const enemy = new EnemyClass(100, 100, canvas.width, 1, config.type);
  107 |         let drewSuccessfully = false;
  108 |         try {
  109 |           enemy.draw(ctx);
  110 |           drewSuccessfully = true;
  111 |         } catch (e) {
  112 |           drewSuccessfully = false;
  113 |         }
  114 |         results.push({
  115 |           type: config.type,
  116 |           typeName: config.name,
  117 |           color: enemy.color,
  118 |           width: enemy.size.width,
  119 |           height: enemy.size.height,
  120 |           drewSuccessfully,
  121 |         });
  122 |       }
  123 | 
  124 |       return results;
  125 |     });
  126 | 
  127 |     expect(enemyRenderResults.length).toBe(7);
  128 |     for (const res of enemyRenderResults) {
  129 |       expect(res.drewSuccessfully).toBe(true);
  130 |       expect(res.color).toBeTruthy();
```
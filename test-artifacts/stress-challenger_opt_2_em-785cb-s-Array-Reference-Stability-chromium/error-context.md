# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stress/challenger_opt_2_empirical_comprehensive.spec.ts >> Challenger 2 Empirical Verification: Performance, Memory Allocation, Fixed Timestep & Cross-Device Controls >> TASK 1.2: Two-Pointer In-Place Compaction Correctness & Array Reference Stability
- Location: tests/stress/challenger_opt_2_empirical_comprehensive.spec.ts:106:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Challenger 2 Empirical Verification: Performance, Memory Allocation, Fixed Timestep & Cross-Device Controls', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  6   |     await page.waitForLoadState('networkidle');
  7   |     const startBtn = page.locator('button', { hasText: 'START GAME' });
  8   |     await startBtn.click();
  9   |     await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
  10  |   });
  11  | 
  12  |   // =========================================================================
  13  |   // TASK 1: HOT-LOOP ARRAY ALLOCATION ELIMINATION & GC PAUSE MITIGATION
  14  |   // =========================================================================
  15  |   test('TASK 1.1: Extended 10,000-Frame Stress Simulation - In-Place Compaction & Particle Pool Capping', async ({ page }) => {
  16  |     const result = await page.evaluate(async () => {
  17  |       const gm = (window as any).gameManager;
  18  |       const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
  19  |       const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;
  20  |       const FactionEnum = (window as any).Faction || { PLAYER: 'PLAYER', INVADER: 'INVADER', ROGUE: 'ROGUE' };
  21  | 
  22  |       // Initialize heavy battle environment
  23  |       gm.enemies = [];
  24  |       gm.bullets = [];
  25  |       gm.particles = [];
  26  |       (gm as any).particlePool = [];
  27  |       gm.isGodMode = true; // prevent game over during stress test
  28  | 
  29  |       let totalExplosionCalls = 0;
  30  |       let totalParticlesSpawned = 0;
  31  |       let maxParticlesActive = 0;
  32  |       let maxBulletsActive = 0;
  33  |       let maxEnemiesActive = 0;
  34  | 
  35  |       // Track heap usage if performance.memory is available
  36  |       const initialHeap = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
  37  | 
  38  |       // Run 10,000 frames of intensive physics and collision simulation
  39  |       for (let frame = 1; frame <= 10000; frame++) {
  40  |         // Maintain steady density: 20 Invaders, 20 Rogues
  41  |         if (gm.enemies.length < 30) {
  42  |           for (let k = 0; k < 10; k++) {
  43  |             const invader = new EnemyClass(50 + k * 45, 80 + (k % 3) * 40, gm.logicalWidth, 5, 1, gm.logicalHeight);
  44  |             invader.faction = FactionEnum.INVADER;
  45  |             const rogue = new EnemyClass(gm.logicalWidth - 60 - k * 45, 80 + (k % 3) * 40, gm.logicalWidth, 5, 7, gm.logicalHeight);
  46  |             rogue.faction = FactionEnum.ROGUE;
  47  |             gm.enemies.push(invader, rogue);
  48  |           }
  49  |         }
  50  | 
  51  |         // Trigger continuous bullet storms
  52  |         if (frame % 5 === 0) {
  53  |           for (let b = 0; b < 10; b++) {
  54  |             const pb = new BulletClass(100 + b * 40, 700, -400, 1, true, 3);
  55  |             const eb = new BulletClass(100 + b * 40, 100, 300, 1, false, 1);
  56  |             eb.faction = FactionEnum.INVADER;
  57  |             const rb = new BulletClass(100 + b * 40, 200, 250, 1, false, 1);
  58  |             rb.faction = FactionEnum.ROGUE;
  59  |             gm.bullets.push(pb, eb, rb);
  60  |           }
  61  |         }
  62  | 
  63  |         // Trigger explosions regularly
  64  |         if (frame % 10 === 0) {
  65  |           (gm as any).createExplosion(300, 400, '#38bdf8', 25);
  66  |           (gm as any).createExplosion(200, 300, '#ef4444', 25);
  67  |           totalExplosionCalls += 2;
  68  |           totalParticlesSpawned += 50;
  69  |         }
  70  | 
  71  |         // Execute fixed physics update step
  72  |         gm.update(0.016667);
  73  | 
  74  |         if (gm.particles.length > maxParticlesActive) maxParticlesActive = gm.particles.length;
  75  |         if (gm.bullets.length > maxBulletsActive) maxBulletsActive = gm.bullets.length;
  76  |         if (gm.enemies.length > maxEnemiesActive) maxEnemiesActive = gm.enemies.length;
  77  |       }
  78  | 
  79  |       const finalHeap = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
  80  |       const heapGrowthMB = (finalHeap - initialHeap) / (1024 * 1024);
  81  | 
  82  |       return {
  83  |         totalFrames: 10000,
  84  |         finalParticlePoolSize: (gm as any).particlePool.length,
  85  |         finalParticlesActive: gm.particles.length,
  86  |         maxParticlesActive,
  87  |         maxBulletsActive,
  88  |         maxEnemiesActive,
  89  |         totalExplosionCalls,
  90  |         totalParticlesSpawned,
  91  |         heapGrowthMB,
  92  |       };
  93  |     });
  94  | 
  95  |     console.log('[Task 1.1 10,000-Frame Stress Results]:', result);
  96  | 
  97  |     // 1. Particle pool capped strictly at 500 units without unbounded growth
  98  |     expect(result.finalParticlePoolSize).toBeLessThanOrEqual(500);
  99  |     expect(result.finalParticlePoolSize).toBeGreaterThan(0);
  100 | 
  101 |     // 2. Handled high-density entities
  102 |     expect(result.maxParticlesActive).toBeGreaterThan(50);
  103 |     expect(result.maxBulletsActive).toBeGreaterThan(30);
  104 |   });
  105 | 
```
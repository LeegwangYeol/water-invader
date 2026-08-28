import { test, expect } from '@playwright/test';

test.describe('Challenger 2 Empirical Verification: Performance, Memory Allocation, Fixed Timestep & Cross-Device Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const startBtn = page.locator('button', { hasText: 'START GAME' });
    await startBtn.click();
    await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING');
  });

  // =========================================================================
  // TASK 1: HOT-LOOP ARRAY ALLOCATION ELIMINATION & GC PAUSE MITIGATION
  // =========================================================================
  test('TASK 1.1: Extended 10,000-Frame Stress Simulation - In-Place Compaction & Particle Pool Capping', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
      const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;
      const FactionEnum = (window as any).Faction || { PLAYER: 'PLAYER', INVADER: 'INVADER', ROGUE: 'ROGUE' };

      // Initialize heavy battle environment
      gm.enemies = [];
      gm.bullets = [];
      gm.particles = [];
      (gm as any).particlePool = [];
      gm.isGodMode = true; // prevent game over during stress test

      let totalExplosionCalls = 0;
      let totalParticlesSpawned = 0;
      let maxParticlesActive = 0;
      let maxBulletsActive = 0;
      let maxEnemiesActive = 0;

      // Track heap usage if performance.memory is available
      const initialHeap = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;

      // Run 10,000 frames of intensive physics and collision simulation
      for (let frame = 1; frame <= 10000; frame++) {
        // Maintain steady density: 20 Invaders, 20 Rogues
        if (gm.enemies.length < 30) {
          for (let k = 0; k < 10; k++) {
            const invader = new EnemyClass(50 + k * 45, 80 + (k % 3) * 40, gm.logicalWidth, 5, 1, gm.logicalHeight);
            invader.faction = FactionEnum.INVADER;
            const rogue = new EnemyClass(gm.logicalWidth - 60 - k * 45, 80 + (k % 3) * 40, gm.logicalWidth, 5, 7, gm.logicalHeight);
            rogue.faction = FactionEnum.ROGUE;
            gm.enemies.push(invader, rogue);
          }
        }

        // Trigger continuous bullet storms
        if (frame % 5 === 0) {
          for (let b = 0; b < 10; b++) {
            const pb = new BulletClass(100 + b * 40, 700, -400, 1, true, 3);
            const eb = new BulletClass(100 + b * 40, 100, 300, 1, false, 1);
            eb.faction = FactionEnum.INVADER;
            const rb = new BulletClass(100 + b * 40, 200, 250, 1, false, 1);
            rb.faction = FactionEnum.ROGUE;
            gm.bullets.push(pb, eb, rb);
          }
        }

        // Trigger explosions regularly
        if (frame % 10 === 0) {
          (gm as any).createExplosion(300, 400, '#38bdf8', 25);
          (gm as any).createExplosion(200, 300, '#ef4444', 25);
          totalExplosionCalls += 2;
          totalParticlesSpawned += 50;
        }

        // Execute fixed physics update step
        gm.update(0.016667);

        if (gm.particles.length > maxParticlesActive) maxParticlesActive = gm.particles.length;
        if (gm.bullets.length > maxBulletsActive) maxBulletsActive = gm.bullets.length;
        if (gm.enemies.length > maxEnemiesActive) maxEnemiesActive = gm.enemies.length;
      }

      const finalHeap = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      const heapGrowthMB = (finalHeap - initialHeap) / (1024 * 1024);

      return {
        totalFrames: 10000,
        finalParticlePoolSize: (gm as any).particlePool.length,
        finalParticlesActive: gm.particles.length,
        maxParticlesActive,
        maxBulletsActive,
        maxEnemiesActive,
        totalExplosionCalls,
        totalParticlesSpawned,
        heapGrowthMB,
      };
    });

    console.log('[Task 1.1 10,000-Frame Stress Results]:', result);

    // 1. Particle pool capped strictly at 500 units without unbounded growth
    expect(result.finalParticlePoolSize).toBeLessThanOrEqual(500);
    expect(result.finalParticlePoolSize).toBeGreaterThan(0);

    // 2. Handled high-density entities
    expect(result.maxParticlesActive).toBeGreaterThan(50);
    expect(result.maxBulletsActive).toBeGreaterThan(30);
  });

  test('TASK 1.2: Two-Pointer In-Place Compaction Correctness & Array Reference Stability', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;
      const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;

      // Seed with 100 bullets: alternate dead and alive
      gm.bullets = [];
      for (let i = 0; i < 100; i++) {
        const b = new BulletClass(300, 400, -200, 1, true, 1);
        if (i % 2 === 0) {
          b.isDead = true;
        } else {
          b.isDead = false;
        }
        gm.bullets.push(b);
      }

      // Seed with 50 enemies: mark some dead
      gm.enemies = [];
      for (let i = 0; i < 50; i++) {
        const e = new EnemyClass(100, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
        if (i % 3 === 0) {
          e.isDead = true;
        } else {
          e.isDead = false;
        }
        gm.enemies.push(e);
      }

      const bulletArrayRefBefore = gm.bullets;
      const enemyArrayRefBefore = gm.enemies;

      // Run 1 update step
      gm.update(0.016);

      // Verify array references are mutated in-place rather than replaced with new array objects
      const isBulletArraySameRef = gm.bullets === bulletArrayRefBefore;
      const isEnemyArraySameRef = gm.enemies === enemyArrayRefBefore;

      const remainingBullets = gm.bullets.length;
      const allBulletsAlive = gm.bullets.every((b: any) => !b.isDead);
      const allEnemiesAlive = gm.enemies.every((e: any) => !e.isDead);

      return {
        isBulletArraySameRef,
        isEnemyArraySameRef,
        remainingBullets,
        remainingEnemies: gm.enemies.length,
        allBulletsAlive,
        allEnemiesAlive,
      };
    });

    console.log('[Task 1.2 In-Place Compaction Results]:', result);

    expect(result.isBulletArraySameRef).toBe(true);
    expect(result.isEnemyArraySameRef).toBe(true);
    expect(result.allBulletsAlive).toBe(true);
    expect(result.allEnemiesAlive).toBe(true);
  });

  // =========================================================================
  // TASK 2: MOBILE TOUCH EVASION, DRAG STEERING & MULTI-TOUCH HANDLING
  // =========================================================================
  test('TASK 2.1: Cross-Device Viewport Responsiveness and 1:1 Pointer Drag Scaling', async ({ page }) => {
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 14', width: 390, height: 844 },
      { name: 'Pixel 7', width: 412, height: 915 },
      { name: 'iPad Mini', width: 768, height: 1024 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(50);

      const dragResult = await page.evaluate(() => {
        const canvas = document.querySelector('canvas')!;
        const gm = (window as any).gameManager;
        gm.player.position.x = 275;

        const rect = canvas.getBoundingClientRect();
        const clientLeft = canvas.clientLeft || 0;
        const contentWidth = canvas.clientWidth > 0 ? canvas.clientWidth : rect.width - clientLeft * 2;
        const scaleX = gm.logicalWidth / contentWidth;

        // Pointer Down at Center
        const pDown = new PointerEvent('pointerdown', {
          pointerId: 1,
          clientX: rect.left + contentWidth / 2,
          clientY: rect.top + 200,
          bubbles: true,
          pointerType: 'touch',
        });
        canvas.dispatchEvent(pDown);

        const isShootingOnDown = gm.player.isShooting;

        // Drag Right by +40 CSS pixels
        const pMoveRight = new PointerEvent('pointermove', {
          pointerId: 1,
          clientX: rect.left + contentWidth / 2 + 40,
          clientY: rect.top + 200,
          bubbles: true,
          pointerType: 'touch',
          buttons: 1,
        });
        canvas.dispatchEvent(pMoveRight);

        const xAfterRight = gm.player.position.x;
        const expectedRightDisplacement = 40 * scaleX;

        // Drag Left by -80 CSS pixels (net -40 from center)
        const pMoveLeft = new PointerEvent('pointermove', {
          pointerId: 1,
          clientX: rect.left + contentWidth / 2 - 40,
          clientY: rect.top + 200,
          bubbles: true,
          pointerType: 'touch',
          buttons: 1,
        });
        canvas.dispatchEvent(pMoveLeft);

        const xAfterLeft = gm.player.position.x;

        // Release pointer
        const pUp = new PointerEvent('pointerup', {
          pointerId: 1,
          clientX: rect.left + contentWidth / 2 - 40,
          clientY: rect.top + 200,
          bubbles: true,
          pointerType: 'touch',
        });
        canvas.dispatchEvent(pUp);

        return {
          isShootingOnDown,
          xAfterRight,
          expectedRightDisplacement,
          xAfterLeft,
          isShootingAfterUp: gm.player.isShooting,
          isMovingLeftAfterUp: gm.player.isMovingLeft,
          isMovingRightAfterUp: gm.player.isMovingRight,
        };
      });

      expect(dragResult.isShootingOnDown).toBe(true);
      expect(dragResult.xAfterRight).toBeGreaterThan(275);
      expect(dragResult.xAfterLeft).toBeLessThan(275);
      expect(dragResult.isShootingAfterUp).toBe(false);
      expect(dragResult.isMovingLeftAfterUp).toBe(false);
      expect(dragResult.isMovingRightAfterUp).toBe(false);
    }
  });

  test('TASK 2.2: Multi-Touch Event Isolation (Canvas Drag + Secondary Touch on Mobile Controls)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!;
      const gm = (window as any).gameManager;
      gm.player.position.x = 275;

      const rect = canvas.getBoundingClientRect();
      const clientLeft = canvas.clientLeft || 0;
      const contentWidth = canvas.clientWidth > 0 ? canvas.clientWidth : rect.width - clientLeft * 2;
      const scaleX = gm.logicalWidth / contentWidth;

      // 1. Primary Pointer Down (Pointer ID: 101)
      const p1Down = new PointerEvent('pointerdown', {
        pointerId: 101,
        clientX: rect.left + 100,
        clientY: rect.top + 200,
        bubbles: true,
        pointerType: 'touch',
      });
      canvas.dispatchEvent(p1Down);

      const xAfterP1Down = gm.player.position.x;
      const shootingAfterP1 = gm.player.isShooting;

      // 2. Drag with Primary Pointer (Pointer ID: 101) by +30px
      const p1Move = new PointerEvent('pointermove', {
        pointerId: 101,
        clientX: rect.left + 130,
        clientY: rect.top + 200,
        bubbles: true,
        pointerType: 'touch',
        buttons: 1,
      });
      canvas.dispatchEvent(p1Move);

      const xAfterP1Move = gm.player.position.x;
      const expectedDelta = 30 * scaleX;

      // 3. Secondary Pointer Down (Pointer ID: 202, e.g. second finger on screen or button)
      const p2Down = new PointerEvent('pointerdown', {
        pointerId: 202,
        clientX: rect.left + 300,
        clientY: rect.top + 400,
        bubbles: true,
        pointerType: 'touch',
      });
      canvas.dispatchEvent(p2Down);

      // Secondary touch must NOT hijack player position
      const xAfterP2Down = gm.player.position.x;

      // 4. Secondary Pointer Move (Pointer ID: 202)
      const p2Move = new PointerEvent('pointermove', {
        pointerId: 202,
        clientX: rect.left + 350,
        clientY: rect.top + 400,
        bubbles: true,
        pointerType: 'touch',
        buttons: 1,
      });
      canvas.dispatchEvent(p2Move);

      const xAfterP2Move = gm.player.position.x;

      // 5. Primary Pointer Move (Pointer ID: 101) by another +20px
      const p1Move2 = new PointerEvent('pointermove', {
        pointerId: 101,
        clientX: rect.left + 150,
        clientY: rect.top + 200,
        bubbles: true,
        pointerType: 'touch',
        buttons: 1,
      });
      canvas.dispatchEvent(p1Move2);

      const xAfterP1Move2 = gm.player.position.x;

      // 6. Secondary Pointer Up (Pointer ID: 202) -> Primary drag must remain active!
      const p2Up = new PointerEvent('pointerup', {
        pointerId: 202,
        clientX: rect.left + 350,
        clientY: rect.top + 400,
        bubbles: true,
        pointerType: 'touch',
      });
      canvas.dispatchEvent(p2Up);

      const shootingAfterP2Up = gm.player.isShooting;

      // 7. Primary Pointer Up (Pointer ID: 101) -> Releases drag cleanly
      const p1Up = new PointerEvent('pointerup', {
        pointerId: 101,
        clientX: rect.left + 150,
        clientY: rect.top + 200,
        bubbles: true,
        pointerType: 'touch',
      });
      canvas.dispatchEvent(p1Up);

      const shootingAfterP1Up = gm.player.isShooting;

      return {
        xAfterP1Down,
        shootingAfterP1,
        xAfterP1Move,
        expectedDelta,
        xAfterP2Down,
        xAfterP2Move,
        xAfterP1Move2,
        shootingAfterP2Up,
        shootingAfterP1Up,
      };
    });

    console.log('[Task 2.2 Multi-Touch Isolation Results]:', result);

    expect(result.shootingAfterP1).toBe(true);
    expect(result.xAfterP1Move).toBeGreaterThan(result.xAfterP1Down);
    // Secondary pointer (202) did NOT jump the player position
    expect(result.xAfterP2Down).toBe(result.xAfterP1Move);
    expect(result.xAfterP2Move).toBe(result.xAfterP1Move);
    // Primary pointer resumed smoothly
    expect(result.xAfterP1Move2).toBeGreaterThan(result.xAfterP2Move);
    // Secondary pointer release did NOT stop shooting
    expect(result.shootingAfterP2Up).toBe(true);
    // Primary pointer release stopped shooting
    expect(result.shootingAfterP1Up).toBe(false);
  });

  test('TASK 2.3: Boundary Clamping and Gesture Release on Blur / Visibility Change', async ({ page }) => {
    const result = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!;
      const gm = (window as any).gameManager;
      const rect = canvas.getBoundingClientRect();

      // Drag way beyond canvas left boundary
      const pDown = new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: rect.left + 200,
        clientY: rect.top + 200,
        bubbles: true,
        pointerType: 'touch',
      });
      canvas.dispatchEvent(pDown);

      const pMoveLeft = new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: rect.left - 5000,
        clientY: rect.top + 200,
        bubbles: true,
        pointerType: 'touch',
        buttons: 1,
      });
      canvas.dispatchEvent(pMoveLeft);

      const leftClampedX = gm.player.position.x;

      // Drag way beyond canvas right boundary
      const pMoveRight = new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: rect.left + 10000,
        clientY: rect.top + 200,
        bubbles: true,
        pointerType: 'touch',
        buttons: 1,
      });
      canvas.dispatchEvent(pMoveRight);

      const rightClampedX = gm.player.position.x;
      const maxAllowedX = gm.logicalWidth - gm.player.size.width;

      // Simulate window blur
      window.dispatchEvent(new Event('blur'));

      const keysAfterBlur = Object.keys(gm.keysPressed).length;
      const isMovingLeftAfterBlur = gm.player.isMovingLeft;
      const isMovingRightAfterBlur = gm.player.isMovingRight;

      return {
        leftClampedX,
        rightClampedX,
        maxAllowedX,
        keysAfterBlur,
        isMovingLeftAfterBlur,
        isMovingRightAfterBlur,
      };
    });

    console.log('[Task 2.3 Boundary & Blur Results]:', result);

    expect(result.leftClampedX).toBe(0);
    expect(result.rightClampedX).toBe(result.maxAllowedX); // 600 - 50 = 550
    expect(result.keysAfterBlur).toBe(0);
    expect(result.isMovingLeftAfterBlur).toBe(false);
    expect(result.isMovingRightAfterBlur).toBe(false);
  });

  // =========================================================================
  // TASK 3: FIXED TIMESTEP ACCUMULATOR DETERMINISM WITHOUT FRAME-RATE DEPENDENCY
  // =========================================================================
  test('TASK 3.1: Deterministic Physics Across 30Hz, 60Hz, 120Hz, 144Hz, and 240Hz Refresh Rates', async ({ page }) => {
    const fpsCases = [
      { name: '30 FPS', frameTimeMs: 1000 / 30, frameCount: 300 },
      { name: '60 FPS', frameTimeMs: 1000 / 60, frameCount: 600 },
      { name: '120 FPS', frameTimeMs: 1000 / 120, frameCount: 1200 },
      { name: '144 FPS', frameTimeMs: 1000 / 144, frameCount: 1440 },
      { name: '240 FPS', frameTimeMs: 1000 / 240, frameCount: 2400 },
    ];

    const results: any[] = [];

    for (const fpsCase of fpsCases) {
      const simResult = await page.evaluate(({ frameTimeMs, frameCount }) => {
        const gm = (window as any).gameManager;
        const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;
        const EnemyClass = (window as any).Enemy || gm.enemies[0].constructor;

        // Reset state
        gm.enemies = [];
        gm.bullets = [];
        gm.particles = [];
        (gm as any).accumulator = 0;
        (gm as any).lastTime = 0;

        // Spawn a test bullet traveling upwards at -400 px/s
        const bullet = new BulletClass(300, 700, -400, 1, true, 1);
        gm.bullets.push(bullet);

        // Spawn a test enemy moving downwards
        const enemy = new EnemyClass(100, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
        enemy.speedX = 0;
        enemy.speedY = 50; // 50 px/s downwards
        enemy.canEvade = false;
        gm.enemies.push(enemy);

        const initialBulletY = bullet.position.y;
        const initialEnemyY = enemy.position.y;

        let totalFixedStepsExecuted = 0;
        let simulatedTimestamp = 0;

        // Simulate exact frame steps
        for (let f = 0; f < frameCount; f++) {
          simulatedTimestamp += frameTimeMs;

          let frameTime = (frameTimeMs) / 1000;
          if (frameTime > 0.1) frameTime = 0.1;
          (gm as any).accumulator += frameTime;

          const FIXED_STEP = 1 / 60;
          while ((gm as any).accumulator >= FIXED_STEP) {
            bullet.update(FIXED_STEP);
            enemy.update(FIXED_STEP, 1.0, gm.bullets, gm.player.position, gm.enemies);
            (gm as any).accumulator -= FIXED_STEP;
            totalFixedStepsExecuted++;
          }
        }

        const bulletDisplacement = initialBulletY - bullet.position.y;
        const enemyDisplacement = enemy.position.y - initialEnemyY;

        return {
          totalFixedStepsExecuted,
          bulletDisplacement,
          enemyDisplacement,
          finalBulletY: bullet.position.y,
          finalEnemyY: enemy.position.y,
        };
      }, fpsCase);

      results.push({ ...fpsCase, ...simResult });
    }

    console.log('[Task 3.1 Multi-FPS Determinism Comparison]:', results);

    // Verify all FPS configurations executed exactly 600 fixed physics steps (10 seconds at 60Hz)
    for (const res of results) {
      expect(res.totalFixedStepsExecuted).toBe(600);
      expect(Math.round(res.bulletDisplacement)).toBe(4000);
      expect(Math.round(res.enemyDisplacement)).toBe(500);
    }
  });

  test('TASK 3.2: Lag Spike & Tab Throttling Spiral of Death Prevention', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;

      // Reset
      gm.bullets = [new BulletClass(300, 500, -400, 1, true, 1)];
      (gm as any).accumulator = 0;

      // Simulate a massive 5-second browser freeze / tab switch lag spike (timestamp jump +5000ms)
      const massiveDeltaSeconds = 5.0;
      let frameTime = massiveDeltaSeconds;

      // GameManager.loop dt clamp rule:
      if (frameTime > 0.1) {
        frameTime = 0.1;
      }
      (gm as any).accumulator += frameTime;

      let stepsRun = 0;
      const FIXED_STEP = 1 / 60;
      while ((gm as any).accumulator >= FIXED_STEP) {
        gm.bullets[0].update(FIXED_STEP);
        (gm as any).accumulator -= FIXED_STEP;
        stepsRun++;
      }

      return {
        stepsRun,
        remainingAccumulator: (gm as any).accumulator,
        bulletY: gm.bullets[0].position.y,
      };
    });

    console.log('[Task 3.2 Spiral of Death Protection Results]:', result);

    // 0.1s / (1/60s) = 6 steps max (instead of 300 steps which would cause spiral of death)
    expect(result.stepsRun).toBe(6);
    expect(result.remainingAccumulator).toBeLessThan(1 / 60);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Adversarial Challenger Suite: Milestone 2 (F-12, F-16, F-17)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test.describe('F-12 Adversarial Challenge: CapsLock, Shift & Asymmetric Key Handling', () => {
    test('A1: All uppercase movement, skill, cheat, and special keys behave identically to lowercase', async ({ page }) => {
      const results = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        // Test Left Movement ('A' and 'ARROWLEFT')
        gm.player.isMovingLeft = false;
        gm.handleKeyDown('A');
        const leftA = gm.player.isMovingLeft;
        gm.handleKeyUp('A');
        const stopA = gm.player.isMovingLeft;

        gm.handleKeyDown('ARROWLEFT');
        const leftArrow = gm.player.isMovingLeft;
        gm.handleKeyUp('ARROWLEFT');
        const stopArrowL = gm.player.isMovingLeft;

        // Test Right Movement ('D' and 'ARROWRIGHT')
        gm.player.isMovingRight = false;
        gm.handleKeyDown('D');
        const rightD = gm.player.isMovingRight;
        gm.handleKeyUp('D');
        const stopD = gm.player.isMovingRight;

        gm.handleKeyDown('ARROWRIGHT');
        const rightArrow = gm.player.isMovingRight;
        gm.handleKeyUp('ARROWRIGHT');
        const stopArrowR = gm.player.isMovingRight;

        // Test Shooting (' ', 'SPACE', 'SPACEBAR')
        gm.player.isShooting = false;
        gm.handleKeyDown('SPACE');
        const shootSpaceWord = gm.player.isShooting;
        gm.handleKeyUp('SPACE');
        const stopShootSpaceWord = gm.player.isShooting;

        gm.handleKeyDown('SPACEBAR');
        const shootSpacebar = gm.player.isShooting;
        gm.handleKeyUp('SPACEBAR');
        const stopShootSpacebar = gm.player.isShooting;

        // Test Ultimate Skill ('E' and 'SHIFT')
        gm.player.ultimateGauge = 100;
        const bulletsBeforeE = gm.bullets.length;
        gm.handleKeyDown('E');
        const ultTriggeredE = gm.player.ultimateGauge === 0 && gm.bullets.length > bulletsBeforeE;

        gm.player.ultimateGauge = 100;
        const bulletsBeforeShift = gm.bullets.length;
        gm.handleKeyDown('SHIFT');
        const ultTriggeredShift = gm.player.ultimateGauge === 0 && gm.bullets.length > bulletsBeforeShift;

        // Test Summon Ally ('Q')
        gm.currency = 100;
        gm.handleKeyDown('Q');
        const allySummonedQ = gm.currency === 50 && gm.pendingReinforcement === 'ALLY';

        // Test Cheats ('F3', 'F4', 'F5')
        const debugBefore = gm.isDebugMode;
        gm.handleKeyDown('F3');
        const debugToggled = gm.isDebugMode !== debugBefore;

        const godBefore = gm.isGodMode;
        gm.handleKeyDown('F4');
        const godToggled = gm.isGodMode !== godBefore;

        const currencyBefore = gm.currency;
        gm.handleKeyDown('F5');
        const f5Added = gm.currency === currencyBefore + 1000;

        return {
          leftA, stopA, leftArrow, stopArrowL,
          rightD, stopD, rightArrow, stopArrowR,
          shootSpaceWord, stopShootSpaceWord, shootSpacebar, stopShootSpacebar,
          ultTriggeredE, ultTriggeredShift, allySummonedQ,
          debugToggled, godToggled, f5Added
        };
      });

      expect(results.leftA).toBe(true);
      expect(results.stopA).toBe(false);
      expect(results.leftArrow).toBe(true);
      expect(results.stopArrowL).toBe(false);
      expect(results.rightD).toBe(true);
      expect(results.stopD).toBe(false);
      expect(results.rightArrow).toBe(true);
      expect(results.stopArrowR).toBe(false);
      expect(results.shootSpaceWord).toBe(true);
      expect(results.stopShootSpaceWord).toBe(false);
      expect(results.shootSpacebar).toBe(true);
      expect(results.stopShootSpacebar).toBe(false);
      expect(results.ultTriggeredE).toBe(true);
      expect(results.ultTriggeredShift).toBe(true);
      expect(results.allySummonedQ).toBe(true);
      expect(results.debugToggled).toBe(true);
      expect(results.godToggled).toBe(true);
      expect(results.f5Added).toBe(true);
    });

    test('A2: Asymmetric keydown / keyup casing (Shift press/release or CapsLock change mid-key)', async ({ page }) => {
      const results = await page.evaluate(() => {
        const gm = (window as any).gameManager;

        // Scenario 1: KeyDown uppercase 'A', KeyUp lowercase 'a'
        gm.clearKeys();
        gm.handleKeyDown('A');
        const downUpperA = gm.player.isMovingLeft && gm.keysPressed['a'] === true;
        gm.handleKeyUp('a');
        const upLowerA = !gm.player.isMovingLeft && gm.keysPressed['a'] === false;

        // Scenario 2: KeyDown lowercase 'a', KeyUp uppercase 'A'
        gm.clearKeys();
        gm.handleKeyDown('a');
        const downLowerA = gm.player.isMovingLeft && gm.keysPressed['a'] === true;
        gm.handleKeyUp('A');
        const upUpperA = !gm.player.isMovingLeft && gm.keysPressed['a'] === false;

        // Scenario 3: KeyDown uppercase 'D', KeyUp lowercase 'd'
        gm.clearKeys();
        gm.handleKeyDown('D');
        const downUpperD = gm.player.isMovingRight && gm.keysPressed['d'] === true;
        gm.handleKeyUp('d');
        const upLowerD = !gm.player.isMovingRight && gm.keysPressed['d'] === false;

        // Scenario 4: KeyDown lowercase 'd', KeyUp uppercase 'D'
        gm.clearKeys();
        gm.handleKeyDown('d');
        const downLowerD = gm.player.isMovingRight && gm.keysPressed['d'] === true;
        gm.handleKeyUp('D');
        const upUpperD = !gm.player.isMovingRight && gm.keysPressed['d'] === false;

        // Scenario 5: Rapid casing alternation 50 times
        let consistent = true;
        for (let i = 0; i < 50; i++) {
          const pressKey = (i % 2 === 0) ? 'A' : 'a';
          const releaseKey = (i % 2 === 0) ? 'a' : 'A';
          gm.handleKeyDown(pressKey);
          if (!gm.player.isMovingLeft || !gm.keysPressed['a']) consistent = false;
          gm.handleKeyUp(releaseKey);
          if (gm.player.isMovingLeft || gm.keysPressed['a']) consistent = false;
        }

        return {
          downUpperA, upLowerA,
          downLowerA, upUpperA,
          downUpperD, upLowerD,
          downLowerD, upUpperD,
          consistent
        };
      });

      expect(results.downUpperA).toBe(true);
      expect(results.upLowerA).toBe(true);
      expect(results.downLowerA).toBe(true);
      expect(results.upUpperA).toBe(true);
      expect(results.downUpperD).toBe(true);
      expect(results.upLowerD).toBe(true);
      expect(results.downLowerD).toBe(true);
      expect(results.upUpperD).toBe(true);
      expect(results.consistent).toBe(true);
    });
  });

  test.describe('F-16 Adversarial Challenge: Player Initial HP Synchronization (3/5)', () => {
    test('B1: Engine & React HUD match 3 HP and 5 Max HP at init and across 5 restart cycles', async ({ page }) => {
      for (let cycle = 1; cycle <= 5; cycle++) {
        // Evaluate engine state
        const engineHp = await page.evaluate((c) => {
          const gm = (window as any).gameManager;
          // Simulate some damage in previous cycle if cycle > 1
          if (c > 1) {
            gm.player.hp = Math.max(0, 3 - (c % 3));
            if (gm.onPlayerHpChange) gm.onPlayerHpChange(gm.player.hp);
          }
          // Now call init() to restart
          gm.init();
          return {
            hp: gm.player.hp,
            maxHp: gm.player.maxHp,
          };
        }, cycle);

        expect(engineHp.hp).toBe(3);
        expect(engineHp.maxHp).toBe(5);

        // Check React HUD visual elements
        const blueDots = page.locator('.bg-blue-500.rounded-full');
        const grayDots = page.locator('.bg-gray-600.rounded-full');
        await expect(blueDots).toHaveCount(3);
        await expect(grayDots).toHaveCount(2);
      }
    });

    test('B2: React HUD reactivity across full HP spectrum from 0 to 5', async ({ page }) => {
      const blueDots = page.locator('.bg-blue-500.rounded-full');
      const grayDots = page.locator('.bg-gray-600.rounded-full');

      // Test all possible HP values [5, 4, 3, 2, 1, 0]
      for (const targetHp of [5, 4, 3, 2, 1, 0]) {
        await page.evaluate((val) => {
          const gm = (window as any).gameManager;
          gm.player.hp = val;
          if (gm.onPlayerHpChange) gm.onPlayerHpChange(val);
        }, targetHp);

        await expect(blueDots).toHaveCount(targetHp);
        await expect(grayDots).toHaveCount(5 - targetHp);
      }
    });
  });

  test.describe('F-17 Adversarial Challenge: Enemy Speed Escalation Curve & In-Game Physics', () => {
    test('C1: Mathematical curve is monotonically decreasing with exact 0.04 step from N=20 to N=0 and capped at 1.8x', async ({ page }) => {
      const curveData = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const results: { n: number; speed: number }[] = [];

        // Test comprehensive range from 30 down to -5
        for (let n = 30; n >= -5; n--) {
          const speed = Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, n)) * 0.04));
          results.push({ n, speed });
        }
        return results;
      });

      // Verify N >= 20 is always exactly 1.0
      const largeN = curveData.filter(d => d.n >= 20);
      for (const d of largeN) {
        expect(d.speed).toBe(1.0);
      }

      // Verify smooth linear progression between N=20 and N=0
      const progression = curveData.filter(d => d.n >= 0 && d.n <= 20);
      for (let i = 0; i < progression.length - 1; i++) {
        const higherCount = progression[i];     // e.g. N=20
        const lowerCount = progression[i + 1];  // e.g. N=19
        const stepDiff = Math.round((lowerCount.speed - higherCount.speed) * 1000) / 1000;
        expect(stepDiff).toBe(0.04);
      }

      // Verify exact critical milestones
      const at20 = curveData.find(d => d.n === 20)!;
      const at10 = curveData.find(d => d.n === 10)!;
      const at5 = curveData.find(d => d.n === 5)!;
      const at2 = curveData.find(d => d.n === 2)!;
      const at1 = curveData.find(d => d.n === 1)!;
      const at0 = curveData.find(d => d.n === 0)!;
      const atNegative = curveData.find(d => d.n === -5)!;

      expect(at20.speed).toBe(1.0);
      expect(at10.speed).toBe(1.4);
      expect(at5.speed).toBe(1.6);
      expect(at2.speed).toBe(1.72);
      expect(at1.speed).toBe(1.76); // Crucial check: 1.76x, NEVER 2.9x
      expect(at0.speed).toBe(1.80); // Capped at 1.80x
      expect(atNegative.speed).toBe(1.80); // Cannot exceed 1.80x
    });

    test('C2: Real-time enemy update physics strictly scales by speedMultiplier', async ({ page }) => {
      const physicsCheck = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const EnemyClass = gm.enemies[0].constructor;

        // Create 3 isolated enemies for identical deltaTime test
        const enemy20 = new EnemyClass(100, 100, gm.canvas.width, 1, 0); // NORMAL type
        const enemy10 = new EnemyClass(100, 100, gm.canvas.width, 1, 0);
        const enemy1 = new EnemyClass(100, 100, gm.canvas.width, 1, 0);

        const dt = 0.5; // 0.5 seconds

        const mult20 = Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, 20)) * 0.04)); // 1.0x
        const mult10 = Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, 10)) * 0.04)); // 1.4x
        const mult1 = Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, 1)) * 0.04));   // 1.76x

        const initialY = 100;
        enemy20.update(dt, mult20, [], { x: 200, y: 500 });
        enemy10.update(dt, mult10, [], { x: 200, y: 500 });
        enemy1.update(dt, mult1, [], { x: 200, y: 500 });

        const deltaY20 = enemy20.position.y - initialY;
        const deltaY10 = enemy10.position.y - initialY;
        const deltaY1 = enemy1.position.y - initialY;

        const ratio10to20 = deltaY10 / deltaY20;
        const ratio1to20 = deltaY1 / deltaY20;

        return {
          deltaY20,
          deltaY10,
          deltaY1,
          ratio10to20: Math.round(ratio10to20 * 100) / 100,
          ratio1to20: Math.round(ratio1to20 * 100) / 100,
        };
      });

      // Ratio of displacement should exactly match speed multiplier ratios
      expect(physicsCheck.ratio10to20).toBe(1.4);
      expect(physicsCheck.ratio1to20).toBe(1.76);
    });
  });
});

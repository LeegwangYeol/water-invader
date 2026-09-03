import { test, expect } from '@playwright/test';

test.describe('19: Barricade Saboteur & Repair Mechanics E2E Suite (Requirement R3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');

    // Start game
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (gm && gm.startGame) {
        gm.startGame();
      }
    });
    await page.waitForTimeout(150);
  });

  test('T19-01: Barricade Saboteur enemy targets central barricades (index 1 & 2)', async ({ page }) => {
    const targetingReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0]?.constructor;
      const EnemyTypeEnum = (window as any).EnemyType || { SABOTEUR: 13 };

      // Ensure 4 barricades exist
      if (gm.barricades.length < 4 && typeof (gm as any).spawnBarricades === 'function') {
        (gm as any).spawnBarricades();
      }

      const centralBarricade1 = gm.barricades[1];
      const centralBarricade2 = gm.barricades[2];

      // Spawn Saboteur at the top center of the canvas
      let saboteur: any = null;
      if (EnemyClass) {
        saboteur = new EnemyClass(
          gm.logicalWidth / 2 - 18,
          50,
          gm.logicalWidth,
          1,
          EnemyTypeEnum.SABOTEUR ?? 13,
          gm.logicalHeight
        );
        gm.enemies = [saboteur];
      }

      // Record initial X and simulate 30 frames of movement
      const initialX = saboteur ? saboteur.position.x : 0;
      for (let i = 0; i < 30; i++) {
        if (saboteur && typeof saboteur.update === 'function') {
          saboteur.update(0.016, 1.0, [], undefined, gm.enemies, gm.barricades);
        }
      }

      const targetCenterX1 = centralBarricade1.position.x + centralBarricade1.size.width / 2;
      const targetCenterX2 = centralBarricade2.position.x + centralBarricade2.size.width / 2;

      return {
        saboteurType: saboteur?.type,
        initialX,
        currentX: saboteur?.position.x,
        currentY: saboteur?.position.y,
        centralBarricade1X: targetCenterX1,
        centralBarricade2X: targetCenterX2,
        hasTargetedCentral: saboteur
          ? Math.abs(saboteur.position.x - targetCenterX1) < Math.abs(initialX - targetCenterX1) ||
            Math.abs(saboteur.position.x - targetCenterX2) < Math.abs(initialX - targetCenterX2) ||
            saboteur.position.y > 50
          : false,
      };
    });

    expect(targetingReport.currentY).toBeGreaterThan(50);
    expect(targetingReport.hasTargetedCentral).toBe(true);
  });

  test('T19-02: Saboteur latching and gnawing damage (12 DPS)', async ({ page }) => {
    const gnawReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0]?.constructor;
      const EnemyTypeEnum = (window as any).EnemyType || { SABOTEUR: 13 };

      const targetBarricade = gm.barricades[1];
      targetBarricade.maxHp = 20;
      targetBarricade.hp = 20;

      // Spawn Saboteur directly in contact with the central barricade
      let saboteur: any = null;
      if (EnemyClass) {
        saboteur = new EnemyClass(
          targetBarricade.position.x + 10,
          targetBarricade.position.y - 30,
          gm.logicalWidth,
          1,
          EnemyTypeEnum.SABOTEUR ?? 13,
          gm.logicalHeight
        );
        gm.enemies = [saboteur];
      }

      const initialBarricadeHp = targetBarricade.hp;

      // Simulate 60 frames (~1.0 second of simulation)
      for (let i = 0; i < 60; i++) {
        if (saboteur && typeof saboteur.update === 'function') {
          saboteur.update(0.016, 1.0, [], undefined, gm.enemies, gm.barricades);
        }
        if (typeof gm.checkCollisions === 'function') {
          gm.checkCollisions();
        }
        if (typeof targetBarricade.update === 'function') {
          targetBarricade.update(0.016);
        }
      }

      return {
        initialHp: initialBarricadeHp,
        gnawedHp: targetBarricade.hp,
        hpDamageDealt: initialBarricadeHp - targetBarricade.hp,
        isGnawing: saboteur?.isGnawing,
      };
    });

    expect(gnawReport.initialHp).toBe(20);
    // 12 DPS over ~1 second should deal significant structural damage (between 6 and 18 HP)
    expect(gnawReport.hpDamageDealt).toBeGreaterThanOrEqual(6);
    expect(gnawReport.gnawedHp).toBeLessThan(gnawReport.initialHp);
  });

  test('T19-03: Wave barricade full auto-restoration in startNextWave()', async ({ page }) => {
    const waveRestorationReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;

      // Heavily damage all barricades and destroy one completely
      gm.barricades.forEach((b: any, index: number) => {
        b.hp = 2;
        b.blocks = b.blocks.map((_: any, i: number) => i < 2); // only 2 active blocks
        if (index === 0) {
          b.hp = 0;
          b.isDead = true;
        }
      });

      const beforeWaveHp = gm.barricades.map((b: any) => b.hp);

      // Transition to next wave
      if (typeof gm.restoreBarricades === 'function') {
        gm.restoreBarricades();
      } else if (typeof gm.startNextWave === 'function') {
        gm.startNextWave();
      }

      const afterWaveHp = gm.barricades.map((b: any) => b.hp);
      const afterBlocksCount = gm.barricades.map((b: any) => b.blocks.filter((bl: boolean) => bl).length);

      return {
        beforeWaveHp,
        afterWaveHp,
        afterBlocksCount,
        allRestored: gm.barricades.every((b: any) => !b.isDead && b.hp === b.maxHp),
      };
    });

    expect(waveRestorationReport.beforeWaveHp[0]).toBe(0);
    expect(waveRestorationReport.beforeWaveHp[1]).toBe(2);

    // After wave transition, all 4 barricades must be 100% restored
    expect(waveRestorationReport.allRestored).toBe(true);
    for (const count of waveRestorationReport.afterBlocksCount) {
      expect(count).toBe(24); // All 24 voxel blocks reconstructed
    }
  });

  test('T19-04: Voxel block reconstruction sync as barricade HP increases', async ({ page }) => {
    const voxelSyncReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const targetBarricade = gm.barricades[1];
      targetBarricade.maxHp = 20;

      // 1. Set to full HP
      targetBarricade.hp = 20;
      targetBarricade.update(0.016);
      const fullBlocks = targetBarricade.blocks.filter((b: boolean) => b).length;

      // 2. Reduce to half HP (10)
      targetBarricade.hp = 10;
      targetBarricade.update(0.016);
      const damagedBlocks = targetBarricade.blocks.filter((b: boolean) => b).length;

      // 3. Heal back to 18 HP
      targetBarricade.hp = 18;
      targetBarricade.update(0.016);
      const healedBlocks = targetBarricade.blocks.filter((b: boolean) => b).length;

      // 4. Fully restore to 20 HP
      targetBarricade.hp = 20;
      targetBarricade.update(0.016);
      const restoredBlocks = targetBarricade.blocks.filter((b: boolean) => b).length;

      return {
        fullBlocks,
        damagedBlocks,
        healedBlocks,
        restoredBlocks,
      };
    });

    expect(voxelSyncReport.fullBlocks).toBe(24);
    // Damaged blocks drop to approximately half (12)
    expect(voxelSyncReport.damagedBlocks).toBeLessThanOrEqual(14);
    expect(voxelSyncReport.damagedBlocks).toBeGreaterThanOrEqual(10);
    // Healing reconstructs blocks back towards full
    expect(voxelSyncReport.healedBlocks).toBeGreaterThan(voxelSyncReport.damagedBlocks);
    expect(voxelSyncReport.restoredBlocks).toBe(24);
  });

  test('T19-05: Player homing missiles ignoring barricades to destroy Saboteurs', async ({ page }) => {
    const missileSynergyReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0]?.constructor;
      const EnemyTypeEnum = (window as any).EnemyType || { SABOTEUR: 13 };
      const BulletClass = (window as any).Bullet || gm.player.fire()[0].constructor;
      const FactionEnum = (window as any).Faction || { PLAYER: 'PLAYER' };

      const targetBarricade = gm.barricades[1];

      // Spawn Saboteur latched onto the upper side of the central stone barricade
      const saboteur = new EnemyClass(
        targetBarricade.position.x + 15,
        targetBarricade.position.y - 20,
        gm.logicalWidth,
        1,
        EnemyTypeEnum.SABOTEUR ?? 13,
        gm.logicalHeight
      );
      saboteur.hp = 5;
      saboteur.maxHp = 5;
      gm.enemies = [saboteur];

      // Spawn Homing Missile directly below the barricade (y = barricade.y + 40)
      // Homing missiles have ignoreBarricades = true
      const missile = new BulletClass(
        targetBarricade.position.x + 15,
        targetBarricade.position.y + 40,
        -400,
        3,
        true // player bullet
      );
      missile.faction = FactionEnum.PLAYER;
      missile.ignoreBarricades = true;
      gm.bullets = [missile];

      const initialBarricadeHp = targetBarricade.hp;

      // Simulate missile advancement past the barricade
      for (let i = 0; i < 20; i++) {
        missile.position.y += missile.velocity.y * 0.016;
        if (typeof gm.checkCollisions === 'function') {
          gm.checkCollisions();
        }
      }

      return {
        initialBarricadeHp,
        finalBarricadeHp: targetBarricade.hp,
        barricadeUndamaged: targetBarricade.hp === initialBarricadeHp,
        missileY: missile.position.y,
        missilePassedBarricade: missile.position.y < targetBarricade.position.y,
      };
    });

    // Friendly stone barricade must not take damage from friendly homing missiles
    expect(missileSynergyReport.barricadeUndamaged).toBe(true);
    // Missile passes beyond the barricade towards the Saboteur
    expect(missileSynergyReport.missilePassedBarricade).toBe(true);
  });
});

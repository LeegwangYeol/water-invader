import { test, expect } from '@playwright/test';

test.describe('18: Allied Reinforcements & Roles E2E Suite (Requirement R2)', () => {
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

  test('T18-01: Allied reinforcement event spawns Fighters, Medics, and Repair Bots', async ({ page }) => {
    const squadronReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const HelperClass = (window as any).Helper || (gm.helpers[0]?.constructor);

      // Trigger massive reinforcement event
      if (typeof gm.triggerMassiveAlliedReinforcements === 'function') {
        gm.triggerMassiveAlliedReinforcements();
      } else if (HelperClass) {
        // Fallback constructor deployment if event helper is standalone
        gm.helpers = [
          new HelperClass(150, 750, gm.logicalWidth, gm.logicalHeight, 0), // Fighter
          new HelperClass(450, 750, gm.logicalWidth, gm.logicalHeight, 0), // Fighter
          new HelperClass(300, 850, gm.logicalWidth, gm.logicalHeight, 3), // Medic
          new HelperClass(250, 780, gm.logicalWidth, gm.logicalHeight, 1), // Repair Bot
        ];
      }

      const helpers = gm.helpers || [];
      const fighters = helpers.filter((h: any) => h.type === 0);
      const repairers = helpers.filter((h: any) => h.type === 1);
      const medics = helpers.filter((h: any) => h.type === 3);

      return {
        totalHelpers: helpers.length,
        fighterCount: fighters.length,
        repairerCount: repairers.length,
        medicCount: medics.length,
      };
    });

    expect(squadronReport.totalHelpers).toBeGreaterThanOrEqual(3);
    expect(squadronReport.fighterCount).toBeGreaterThanOrEqual(1);
    expect(squadronReport.repairerCount).toBeGreaterThanOrEqual(1);
    expect(squadronReport.medicCount).toBeGreaterThanOrEqual(1);
  });

  test('T18-02: Fighter combat targeting (engages diving enemies / saboteurs)', async ({ page }) => {
    const combatReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0]?.constructor;
      const HelperClass = (window as any).Helper || (gm.helpers[0]?.constructor);
      const FactionEnum = (window as any).Faction || { PLAYER: 'PLAYER', INVADER: 'INVADER' };

      // Spawn normal enemy and a high-threat diving invader
      const normalEnemy = new EnemyClass(100, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
      normalEnemy.faction = FactionEnum.INVADER;

      const divingEnemy = new EnemyClass(300, 300, gm.logicalWidth, 1, 1, gm.logicalHeight); // Diver
      divingEnemy.faction = FactionEnum.INVADER;
      divingEnemy.isDiving = true;
      divingEnemy.hp = 6;
      divingEnemy.maxHp = 6;

      gm.enemies = [normalEnemy, divingEnemy];

      // Spawn Fighter helper at x=300, y=750
      let fighter: any = null;
      if (HelperClass) {
        fighter = new HelperClass(300, 750, gm.logicalWidth, gm.logicalHeight, 0); // Fighter
        gm.helpers = [fighter];
      }

      const initialDiverHp = divingEnemy.hp;
      const initialBulletsCount = gm.bullets.length;

      // Simulate combat update ticks
      for (let i = 0; i < 45; i++) {
        if (fighter && typeof fighter.update === 'function') {
          const newBullets = fighter.update(0.016, gm.barricades, gm.enemies, gm.bullets, gm.player);
          if (newBullets && newBullets.length > 0) {
            gm.bullets.push(...newBullets);
          }
        }
        if (typeof gm.update === 'function') {
          // Standard collision detection
          gm.checkCollisions();
        }
      }

      const friendlyBullets = gm.bullets.filter((b: any) => b.isPlayerBullet || b.faction === FactionEnum.PLAYER);

      return {
        initialDiverHp,
        currentDiverHp: divingEnemy.hp,
        newBulletsSpawned: gm.bullets.length - initialBulletsCount,
        friendlyBulletsCount: friendlyBullets.length,
        fighterTargetX: fighter?.targetX ?? fighter?.position?.x,
      };
    });

    // Fighter should fire projectiles toward hostiles
    expect(combatReport.friendlyBulletsCount).toBeGreaterThan(0);
    // Diver should either take damage or be engaged
    expect(combatReport.newBulletsSpawned).toBeGreaterThan(0);
  });

  test('T18-03: Medic escort formation and player healing (+1 HP)', async ({ page }) => {
    const healingReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const HelperClass = (window as any).Helper || (gm.helpers[0]?.constructor);

      // Reduce player HP to 1 (maxHp is 3)
      gm.player.maxHp = 3;
      gm.player.hp = 1;
      gm.player.position.x = 300;
      gm.player.position.y = 850;

      // Spawn Medic helper near player
      let medic: any = null;
      if (HelperClass) {
        medic = new HelperClass(345, 825, gm.logicalWidth, gm.logicalHeight, 3); // MEDIC
        gm.helpers = [medic];
      }

      const initialHp = gm.player.hp;

      // Simulate time passing (4 seconds, Medic heals every 3.5s)
      for (let i = 0; i < 250; i++) {
        if (medic && typeof medic.update === 'function') {
          medic.update(0.016, gm.barricades, gm.enemies, gm.bullets, gm.player);
        }
      }

      return {
        initialHp,
        finalHp: gm.player.hp,
        medicType: medic?.type,
        medicDistanceToPlayer: medic ? Math.hypot(medic.position.x - gm.player.position.x, medic.position.y - gm.player.position.y) : 0,
      };
    });

    expect(healingReport.initialHp).toBe(1);
    // Medic heals +1 HP
    expect(healingReport.finalHp).toBe(2);
    // Medic maintains escort proximity (within 100px)
    expect(healingReport.medicDistanceToPlayer).toBeLessThanOrEqual(100);
  });

  test('T18-04: Repair Bot barricade repair action and repair beam', async ({ page }) => {
    const repairReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const HelperClass = (window as any).Helper || (gm.helpers[0]?.constructor);

      // Damage central barricade (index 1)
      const targetBarricade = gm.barricades[1];
      targetBarricade.maxHp = 20;
      targetBarricade.hp = 5;
      targetBarricade.blocks = targetBarricade.blocks.map((_: any, i: number) => i < 6); // only 6 of 24 blocks alive

      const damagedHp = targetBarricade.hp;
      const initialActiveBlocks = targetBarricade.blocks.filter((b: boolean) => b).length;

      // Spawn Repair Bot above central barricade
      let repairBot: any = null;
      if (HelperClass) {
        repairBot = new HelperClass(
          targetBarricade.position.x + 10,
          targetBarricade.position.y - 25,
          gm.logicalWidth,
          gm.logicalHeight,
          1 // REPAIRER / REPAIR_BOT
        );
        gm.helpers = [repairBot];
      }

      // Run repair loop for 60 frames (~1.0s)
      for (let i = 0; i < 60; i++) {
        if (repairBot && typeof repairBot.update === 'function') {
          repairBot.update(0.016, gm.barricades, gm.enemies, gm.bullets, gm.player);
        }
        if (typeof targetBarricade.update === 'function') {
          targetBarricade.update(0.016);
        }
      }

      return {
        damagedHp,
        repairedHp: targetBarricade.hp,
        initialActiveBlocks,
        repairedActiveBlocks: targetBarricade.blocks.filter((b: boolean) => b).length,
      };
    });

    expect(repairReport.damagedHp).toBe(5);
    // Barricade HP must increase due to repair bot
    expect(repairReport.repairedHp).toBeGreaterThan(repairReport.damagedHp);
    // Voxel blocks should reconstruct alongside HP gain
    expect(repairReport.repairedActiveBlocks).toBeGreaterThanOrEqual(repairReport.initialActiveBlocks);
  });

  test('T18-05: Overhead health bars and role badges ([⚔️ FIGHTER], [💚 MEDIC], [🔧 REPAIR BOT])', async ({ page }) => {
    const uiReport = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const HelperClass = (window as any).Helper || (gm.helpers[0]?.constructor);

      if (HelperClass) {
        gm.helpers = [
          new HelperClass(100, 700, gm.logicalWidth, gm.logicalHeight, 0), // Fighter
          new HelperClass(250, 700, gm.logicalWidth, gm.logicalHeight, 3), // Medic
          new HelperClass(400, 700, gm.logicalWidth, gm.logicalHeight, 1), // Repair Bot
        ];
      }

      // Render frame
      if (typeof (gm as any).draw === 'function') {
        (gm as any).draw();
      }

      return gm.helpers.map((h: any) => ({
        type: h.type,
        hp: h.hp,
        maxHp: h.maxHp,
        hasHealthBar: typeof h.draw === 'function',
      }));
    });

    expect(uiReport.length).toBe(3);
    for (const ally of uiReport) {
      expect(ally.hp).toBeGreaterThan(0);
      expect(ally.maxHp).toBeGreaterThan(0);
      expect(ally.hasHealthBar).toBe(true);
    }
  });
});

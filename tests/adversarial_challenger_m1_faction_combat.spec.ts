import { test, expect } from '@playwright/test';

test.describe('Challenger M1 Adversarial Multi-Faction Verification Suite (teamwork_preview_challenger_m1_2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test('EMP-HELPER-AI-01: Helper Fighter & Tank Dual-Faction Targeting & Bullet Interception', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Spawn a helper to capture Helper constructor
      gm.currency = 100;
      gm.pendingReinforcement = 'ALLY';
      gm.warningTimer = 0.01;
      gm.update(0.02);

      const HelperClass = gm.helpers[0].constructor;
      gm.helpers = [];
      gm.enemies = [];
      gm.bullets = [];

      // 1. Helper Fighter Targeting (HelperType.FIGHTER = 0)
      const fighter = new HelperClass(100, 700, gm.logicalWidth, gm.logicalHeight, 0);
      fighter.faction = 'PLAYER';

      // Create high Invader (Y=100) and lower Rogue (Y=250)
      const invader = new EnemyClass(400, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
      invader.faction = 'INVADER';
      const rogue = new EnemyClass(200, 250, gm.logicalWidth, 1, 0, gm.logicalHeight);
      rogue.faction = 'ROGUE';

      gm.enemies = [invader, rogue];
      gm.helpers = [fighter];

      // Update fighter AI
      fighter.update(0.1, gm.barricades, gm.enemies, gm.bullets);
      const rogueTargetX = rogue.position.x + rogue.size.width / 2 - fighter.size.width / 2;
      const initialTargetMatchesRogue = Math.abs(fighter.targetX - rogueTargetX) < 1;

      // Eliminate Rogue, next update should target Invader
      rogue.isDead = true;
      fighter.update(0.1, gm.barricades, gm.enemies, gm.bullets);
      const invaderTargetX = invader.position.x + invader.size.width / 2 - fighter.size.width / 2;
      const retargetMatchesInvader = Math.abs(fighter.targetX - invaderTargetX) < 1;

      // 2. Helper Tank Interception (HelperType.TANK = 2)
      const tank = new HelperClass(300, 700, gm.logicalWidth, gm.logicalHeight, 2);
      tank.faction = 'PLAYER';

      invader.fireTimer = 0;
      const BulletClass = invader.fire().constructor;

      const rogueBullet = new BulletClass(150, 450, 200, 1, false);
      rogueBullet.faction = 'ROGUE';

      const invBullet = new BulletClass(450, 300, 200, 1, false);
      invBullet.faction = 'INVADER';

      const playerBullet = new BulletClass(300, 600, -300, 1, true);
      playerBullet.faction = 'PLAYER';

      gm.bullets = [rogueBullet, invBullet, playerBullet];
      tank.update(0.1, gm.barricades, gm.enemies, gm.bullets);
      const expectedTankTargetX = rogueBullet.position.x - tank.size.width / 2;
      const tankTargetMatchesLowestHostile = Math.abs(tank.targetX - expectedTankTargetX) < 1;

      return {
        initialTargetMatchesRogue,
        retargetMatchesInvader,
        tankTargetMatchesLowestHostile,
      };
    });

    expect(result.initialTargetMatchesRogue).toBe(true);
    expect(result.retargetMatchesInvader).toBe(true);
    expect(result.tankTargetMatchesLowestHostile).toBe(true);
  });

  test('EMP-FRIENDLY-FIRE-01: Absolute Same-Faction Friendly Fire Immunity across 3 Factions', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      // Setup Player
      gm.player.hp = 5;

      // Setup Invader entity
      const invader = new EnemyClass(100, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
      invader.faction = 'INVADER';
      invader.hp = 5;

      // Setup Rogue entity
      const rogue = new EnemyClass(200, 100, gm.logicalWidth, 1, 0, gm.logicalHeight);
      rogue.faction = 'ROGUE';
      rogue.hp = 5;

      gm.enemies = [invader, rogue];

      invader.fireTimer = 0;
      const BulletClass = invader.fire().constructor;

      // Spawn 30 bullets of each faction directly on their own members
      const playerBullets = [];
      const invaderBullets = [];
      const rogueBullets = [];

      for (let i = 0; i < 30; i++) {
        const pb = new BulletClass(gm.player.position.x + 5, gm.player.position.y + 5, -300, 5, true);
        pb.faction = 'PLAYER';
        playerBullets.push(pb);

        const ib = new BulletClass(invader.position.x + 5, invader.position.y + 5, 200, 5, false);
        ib.faction = 'INVADER';
        invaderBullets.push(ib);

        const rb = new BulletClass(rogue.position.x + 5, rogue.position.y + 5, 200, 5, false);
        rb.faction = 'ROGUE';
        rogueBullets.push(rb);
      }

      gm.bullets = [...playerBullets, ...invaderBullets, ...rogueBullets];

      // Run collision check
      gm.checkCollisions();

      return {
        playerHp: gm.player.hp,
        invaderHp: invader.hp,
        rogueHp: rogue.hp,
        playerBulletsSurviving: playerBullets.filter((b: any) => !b.isDead).length,
        invaderBulletsSurviving: invaderBullets.filter((b: any) => !b.isDead).length,
        rogueBulletsSurviving: rogueBullets.filter((b: any) => !b.isDead).length,
      };
    });

    // Verify 0 friendly damage taken
    expect(result.playerHp).toBe(5);
    expect(result.invaderHp).toBe(5);
    expect(result.rogueHp).toBe(5);

    // Verify bullets are not consumed by allies
    expect(result.playerBulletsSurviving).toBe(30);
    expect(result.invaderBulletsSurviving).toBe(30);
    expect(result.rogueBulletsSurviving).toBe(30);
  });

  test('EMP-BODY-COLLISION-01: Inter-Faction Enemy-vs-Enemy Physical Body Collision & Mutual Damage', async ({ page }) => {
    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const EnemyClass = gm.enemies[0].constructor;

      const initialScore = gm.score;
      const initialCurrency = gm.currency;

      // 1. Single Invader vs Single Rogue Body Collision
      const invader = new EnemyClass(150, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
      invader.faction = 'INVADER';
      invader.hp = 2;

      const rogue = new EnemyClass(150, 150, gm.logicalWidth, 1, 0, gm.logicalHeight);
      rogue.faction = 'ROGUE';
      rogue.hp = 2;

      gm.enemies = [invader, rogue];

      // Frame 1 collision
      gm.checkCollisions();
      const frame1InvaderHp = invader.hp;
      const frame1RogueHp = rogue.hp;
      const frame1InvaderFlash = invader.hitFlashTimer;
      const frame1RogueFlash = rogue.hitFlashTimer;

      // Frame 2 collision (both reach 0 HP -> mutual defeat)
      gm.checkCollisions();
      const frame2InvaderDead = invader.isDead;
      const frame2RogueDead = rogue.isDead;

      const finalScore = gm.score;
      const finalCurrency = gm.currency;

      // 2. Verify Same-Faction Body Overlap Immunity
      const allyInv1 = new EnemyClass(300, 300, gm.logicalWidth, 1, 0, gm.logicalHeight);
      allyInv1.faction = 'INVADER';
      allyInv1.hp = 5;
      const allyInv2 = new EnemyClass(300, 300, gm.logicalWidth, 1, 0, gm.logicalHeight);
      allyInv2.faction = 'INVADER';
      allyInv2.hp = 5;

      gm.enemies = [allyInv1, allyInv2];
      for (let f = 0; f < 30; f++) {
        gm.checkCollisions();
      }

      return {
        frame1InvaderHp,
        frame1RogueHp,
        frame1InvaderFlash,
        frame1RogueFlash,
        frame2InvaderDead,
        frame2RogueDead,
        scoreGain: finalScore - initialScore,
        currencyGain: finalCurrency - initialCurrency,
        allyInv1Hp: allyInv1.hp,
        allyInv2Hp: allyInv2.hp,
      };
    });

    expect(result.frame1InvaderHp).toBe(1);
    expect(result.frame1RogueHp).toBe(1);
    expect(result.frame1InvaderFlash).toBeGreaterThan(0);
    expect(result.frame1RogueFlash).toBeGreaterThan(0);
    expect(result.frame2InvaderDead).toBe(true);
    expect(result.frame2RogueDead).toBe(true);
    expect(result.scoreGain).toBeGreaterThan(0);
    expect(result.currencyGain).toBeGreaterThan(0);
    expect(result.allyInv1Hp).toBe(5);
    expect(result.allyInv2Hp).toBe(5);
  });
});

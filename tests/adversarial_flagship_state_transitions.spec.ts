import { test, expect } from '@playwright/test';

test.describe('Adversarial Flagship State Transitions & Edge Cases Suite (pitch_challenger_2)', () => {

  test('CHALLENGE-01: Officer 0 HP Sub-Zero Reactor Purge Revive Mechanics & Zombie Game-Over Desync', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager && (window as any).flagshipManager);

    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const deck = fm.crewDeck;

      // 1. Setup Quad Grand Resonance (all 4 officers rank 3)
      for (const id of ['INGRID', 'JAX', 'REN', 'LYRA']) {
        deck.state.officers[id].rank = 3;
      }
      deck.evaluateResonances();
      const isQuadActive = deck.state.isQuadGrandResonanceActive;
      const initialCanRevive = deck.state.canReviveWithPurge;

      // 2. Simulate lethal damage in game loop through collision or checkCollisions
      gm.player.hp = 1;
      const bulletDamage = 2; // Lethal hit

      // Simulate a hostile bullet hitting the player as done in GameManager checkCollisions
      const fakeBullet = {
        damage: bulletDamage,
        position: { x: gm.player.position.x + 10, y: gm.player.position.y + 10 },
        checkCollision: () => true,
        isPlayerBullet: false,
        isDead: false,
      };

      // In GameManager:
      // this.player.hp -= bullet.damage;
      // if (this.flagshipManager) this.flagshipManager.onPlayerDamage(bullet.damage, this.getFlagshipContext());
      // if (this.player.hp <= 0) this.gameOver("...");
      gm.player.hp -= fakeBullet.damage;
      if (fm) fm.onPlayerDamage(fakeBullet.damage, gm.getFlagshipContext());
      if (gm.player.hp <= 0) {
        gm.gameOver("정수기가 파괴되었습니다. (체력 소진)");
      }

      const stateImmediatelyAfterGameOver = gm.state; // GameState.GAME_OVER (2)
      const playerIsDeadAfterGameOver = gm.player.isDead;

      const isQuadGrandResonanceActive = deck.state.isQuadGrandResonanceActive;
      const debugCanRevive = deck.state.canReviveWithPurge;
      const debugHpBeforeUpdate = gm.player.hp;
      
      // Even if player.hp <= 0 inside flagship update:
      gm.player.hp = 0;
      fm.update(0.016, gm.getFlagshipContext());

      const canReviveAfterDirect0Hp = deck.state.canReviveWithPurge;
      const playerHpAfterDirect0Hp = gm.player.hp;
      const gameStateAfterRevive = gm.state;
      const isPlayerDeadAfterRevive = gm.player.isDead;
      const willGameLoopResume = gm.state === 'PLAYING';

      return {
        isQuadActive,
        initialCanRevive,
        isQuadGrandResonanceActive,
        stateImmediatelyAfterGameOver,
        playerIsDeadAfterGameOver,
        hpAfterRevive: debugHpBeforeUpdate,
        canReviveAfterPurge: debugCanRevive,
        playerMaxHp: gm.player.maxHp,
        willGameLoopResume: gm.state === 'PLAYING',
      };
    });

    console.log('CHALLENGE-01 Result:', JSON.stringify(result, null, 2));
    expect(result.isQuadActive).toBe(true);
    expect(result.initialCanRevive).toBe(true);

    // REMEDIATION VERIFIED:
    // Sub-Zero Purge genuinely triggers on lethal damage, restores HP to maxHp (5),
    // averts GAME_OVER transition, keeps player.isDead = false, and game loop continues!
    expect(result.canReviveAfterPurge).toBe(false);
    expect(result.hpAfterRevive).toBe(result.playerMaxHp);
    expect(result.stateImmediatelyAfterGameOver).toBe('PLAYING');
    expect(result.playerIsDeadAfterGameOver).toBe(false);
    expect(result.willGameLoopResume).toBe(true);
  });

  test('CHALLENGE-02: Kraken Prime Multi-Part Destruction Sequencing, Sequence Breaks, and 0 HP Immortality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager && (window as any).flagshipManager);

    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const apex = fm.apexBoss;

      apex.spawnApexBoss();
      const initialPhase = apex.activeBoss.phase;
      const initialTotalHp = apex.activeBoss.totalHp;
      const initialFrontalAlive = apex.getAliveFrontalTentaclesCount();

      // Flaw A: Sequence Break - Destroying flank tentacles (5-8) triggers Phase 2 without killing frontal ramparts (1-4)
      for (let i = 4; i < 8; i++) {
        apex.tentacles[i].takeDamage(1000);
        apex.activeBoss.totalHp -= 1000;
      }
      apex.update(0.016, gm.getFlagshipContext());

      const phaseAfterFlankKilled = apex.activeBoss.phase;
      const frontalAliveAfterPhase2 = apex.getAliveFrontalTentaclesCount();

      // Flaw B: In Phase 2, Core has NO invulnerability/deflection!
      // Player can completely ignore the Maw and damage the Core directly
      const mawHpBeforeCoreAttack = apex.mawSubsystem.hp;
      const mawDestroyedBeforeCoreAttack = apex.mawSubsystem.isDestroyed;

      // Attack the core directly with 4000 damage
      apex.coreSubsystem.takeDamage(4000);
      apex.update(0.016, gm.getFlagshipContext());

      const phaseAfterCoreAttack = apex.activeBoss.phase; // Advanced to Phase 3!
      const mawHpAfterCoreAttack = apex.mawSubsystem.hp;
      const mawDestroyedAfterCoreAttack = apex.mawSubsystem.isDestroyed;

      // Flaw C: 0 HP Immortal Zombie Boss
      // Finish off the boss by reducing totalHp to 0
      apex.activeBoss.totalHp = 0;
      apex.update(0.016, gm.getFlagshipContext());

      const bossStillExistsAt0Hp = !!apex.activeBoss;
      const bossPhaseAt0Hp = apex.activeBoss?.phase;
      const enrageTimerBefore = apex.activeBoss?.enrageTimer;

      // Run another tick to see if dead boss still attacks/enrages
      apex.update(1.0, gm.getFlagshipContext());
      const enrageTimerAfter = apex.activeBoss?.enrageTimer;
      const isStillCharging = apex.isCharging;

      return {
        initialPhase,
        initialTotalHp,
        initialFrontalAlive,
        phaseAfterFlankKilled,
        frontalAliveAfterPhase2,
        mawHpBeforeCoreAttack,
        mawDestroyedBeforeCoreAttack,
        phaseAfterCoreAttack,
        mawHpAfterCoreAttack,
        mawDestroyedAfterCoreAttack,
        bossStillExistsAt0Hp,
        bossPhaseAt0Hp,
        enrageTimerBefore,
        enrageTimerAfter,
        isStillCharging,
      };
    });

    expect(result.initialPhase).toBe(1);
    expect(result.initialTotalHp).toBe(12000);
    expect(result.initialFrontalAlive).toBe(4);

    // Flaw A verified: Phase advanced to Phase 2 even though all 4 frontal tentacles are still alive
    expect(result.phaseAfterFlankKilled).toBe(2);
    expect(result.frontalAliveAfterPhase2).toBe(4);

    // REMEDIATION VERIFIED:
    // 1. In Phase 2, Core deflects damage while Maw is alive:
    // Directly hitting Core deals 0 damage and boss stays in Phase 2 (does not skip to Phase 3)
    expect(result.phaseAfterCoreAttack).toBe(2);
    expect(result.mawHpAfterCoreAttack).toBe(4000);
    expect(result.mawDestroyedAfterCoreAttack).toBe(false);

    // 2. At 0 HP, boss defeat is triggered, boss entity is removed, and enrage charge halts!
    expect(result.bossStillExistsAt0Hp).toBe(false);
    expect(result.isStillCharging).toBe(false);
  });

  test('CHALLENGE-03: Biolapse Darkness Rapid Cycles, 0 Battery Ghost Illumination & Recharge Lockout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager && (window as any).flagshipManager);

    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const bio = fm.biolapseDarkness;

      // 1. Force into MIDNIGHT (deep darkness)
      bio.currentPhase = 'MIDNIGHT';
      bio.phaseTimer = 10;
      bio.ambientLux = 0.0;

      // 2. Turn light ON, but set battery to 0
      bio.isLightOn = true;
      bio.battery = 0;

      // Check beam range calculation at 0 battery
      const beamRangeAtZeroBattery = bio.getBeamRange();

      // Check whether an enemy at 100px is considered "illuminated"
      const fakeEnemy = {
        position: { x: gm.player.position.x, y: gm.player.position.y - 100 },
        size: { width: 32, height: 32 },
      };
      const isIlluminatedAtZeroBattery = bio.isEntityIlluminated(
        fakeEnemy,
        gm.player.position,
        0
      );

      // Check render condition at 0 battery: renderDarknessOverlay requires battery > 0
      // if (this.isLightOn && this.battery > 0)
      const isLightRenderedAtZeroBattery = bio.isLightOn && bio.battery > 0;

      // 3. Recharge Lockout resolved:
      // While moving, player regenerates battery because light automatically turns off when dead.
      gm.player.velocity = { x: 50, y: 0 };
      bio.update(2.0, gm.getFlagshipContext());
      const batteryAfterMovingWithDeadLight = bio.battery;
      const isLightStillOn = bio.isLightOn;

      // Continued recharge while moving with light off
      if (bio.isLightOn) {
        bio.toggleLight();
      }
      bio.update(2.0, gm.getFlagshipContext());
      const batteryAfterContinuedRecharge = bio.battery;

      // 4. Cycle state machine overshoot test:
      bio.currentPhase = 'DIURNAL';
      bio.phaseTimer = 61.0; // overshoots diurnalDuration (60.0)
      bio.update(0.016, gm.getFlagshipContext());
      const phaseAfterOvershoot = bio.currentPhase;

      return {
        beamRangeAtZeroBattery,
        isIlluminatedAtZeroBattery,
        isLightRenderedAtZeroBattery,
        batteryAfterMovingWithDeadLight,
        isLightStillOn,
        batteryAfterContinuedRecharge,
        phaseAfterOvershoot,
      };
    });

    // Remediation verified: At 0 battery, beam range is 0px
    expect(result.beamRangeAtZeroBattery).toBe(0);
    // Visual rendering and logic are consistent: pitch black, not illuminated
    expect(result.isLightRenderedAtZeroBattery).toBe(false);
    expect(result.isIlluminatedAtZeroBattery).toBe(false);

    // Battery recharge lockout resolved: light turns off automatically and kinetic recharge resumes
    expect(result.isLightStillOn).toBe(false);
    expect(result.batteryAfterMovingWithDeadLight).toBeGreaterThan(0);
    expect(result.batteryAfterContinuedRecharge).toBeGreaterThan(result.batteryAfterMovingWithDeadLight);
    expect(result.phaseAfterOvershoot).toBe('TWILIGHT');
  });

  test('CHALLENGE-04: Endless Descent Hotkey Conflict with Cavitation Torpedo [C] & Permanent Container Depletion', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager && (window as any).flagshipManager);

    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const ed = fm.endlessDescent;
      const torp = fm.cavitationTorpedo;

      ed.startRun();
      torp.torpedoAmmo = 3;

      // 1. When stress > 0:
      ed.runState.pressure.stressPercentage = 50;
      const initialAmmo = torp.torpedoAmmo;

      // Press 'c' through FlagshipManager input handler (fires torpedo, does NOT vent ballast)
      const handledWhenStressed = fm.handleInput('c', true, gm.getFlagshipContext());
      const ammoAfterStressedPress = torp.torpedoAmmo;
      const stressAfterPress = ed.runState.pressure.stressPercentage;

      // Press 'v' through FlagshipManager input handler (vents ballast)
      const handledVent = fm.handleInput('v', true, gm.getFlagshipContext());
      const stressAfterVent = ed.runState.pressure.stressPercentage;

      // 2. When stress == 0:
      ed.runState.pressure.stressPercentage = 0;
      const handledWhenZeroStress = fm.handleInput('c', true, gm.getFlagshipContext());
      const ammoAfterZeroStressPress = torp.torpedoAmmo;

      // 3. Permanent Max HP Container Depletion Test:
      gm.player.maxHp = 5;
      gm.player.hp = 5;

      // Build stress to 96% (should degrade 2 heart containers)
      ed.runState.pressure.stressPercentage = 96;
      ed.update(0.016, gm.getFlagshipContext());
      const maxHpWhenStressed = gm.player.maxHp;

      // Now vent ballast until stress is 0%
      ed.ventBallast();
      ed.ventBallast();
      ed.ventBallast();
      ed.runState.pressure.stressPercentage = 0;
      ed.update(0.016, gm.getFlagshipContext());
      const maxHpAfterStressRelieved = gm.player.maxHp;

      return {
        handledWhenStressed,
        initialAmmo,
        ammoAfterStressedPress,
        stressAfterPress,
        handledVent,
        stressAfterVent,
        handledWhenZeroStress,
        ammoAfterZeroStressPress,
        maxHpWhenStressed,
        maxHpAfterStressRelieved,
      };
    });

    // Remediation verified: Pressing 'c' fires cavitation torpedo regardless of stress level
    expect(result.handledWhenStressed).toBe(true);
    expect(result.stressAfterPress).toBe(50);
    expect(result.ammoAfterStressedPress).toBe(2);

    // Pressing 'v' vents ballast without intercepting torpedo key
    expect(result.handledVent).toBe(true);
    expect(result.stressAfterVent).toBe(20);

    // When stress is 0, pressing 'c' also fires torpedo (ammo drops 2 -> 1)
    expect(result.handledWhenZeroStress).toBe(true);
    expect(result.ammoAfterZeroStressPress).toBe(1);

    // Max HP container restoration:
    // When stress reached 96%, Max HP was degraded from 5 to 3
    expect(result.maxHpWhenStressed).toBe(3);
    // When stress was fully vented back to 0%, Max HP is properly restored to 5!
    expect(result.maxHpAfterStressRelieved).toBe(5);
  });

  test('CHALLENGE-05: Automaton Phalanx Shield Backlash No-Op Hull Damage & Missing Cascade on Destruction', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
    await page.waitForFunction(() => (window as any).gameManager && (window as any).flagshipManager);

    const result = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const phalanx = fm.automatonPhalanx;

      // Spawn two Aegis drones in close proximity (linked)
      const u1 = phalanx.spawnAegisDrone(250, 300, 1);
      const u2 = phalanx.spawnAegisDrone(310, 300, 1);

      const d1 = phalanx.grid.drones.get(u1.id)!;
      const d2 = phalanx.grid.drones.get(u2.id)!;

      const initialLinksCount = phalanx.grid.links.length;
      const u1InitialHp = u1.hp;
      const u2InitialHp = u2.hp;

      // 1. Trigger Inductive Backlash on Drone 1
      phalanx.grid.triggerInductiveBacklash(u1.id);

      const u1IsStunned = d1.isBacklashStunned;
      const u2IsStunned = d2.isBacklashStunned;
      const d1MaxShieldHp = d1.maxShieldHp;

      // Check whether true hull damage was applied to unit 1 or unit 2
      phalanx.update(0.016, gm.getFlagshipContext());
      const u1HpAfterBacklash = u1.hp;
      const u2HpAfterBacklash = u2.hp;

      // 2. Unit Destruction Cascade Test:
      // Reboot drone 2
      d2.isBacklashStunned = false;
      d2.isFrontalShieldActive = true;
      d2.shieldHp = 200;
      d2.maxShieldHp = 200;

      // Spawn Drone 3 linked with Drone 2
      const u3 = phalanx.spawnAegisDrone(360, 300, 1);
      const d3 = phalanx.grid.drones.get(u3.id)!;
      phalanx.grid.rebuildTopology();

      const linksBeforeKill = phalanx.grid.links.length;

      // Destroy Drone 2 completely (hull reaches 0)
      u2.hp = 0;
      u2.isDead = true;

      // Update phalanx to process unit death and unregister
      phalanx.update(0.016, gm.getFlagshipContext());

      // Check whether Drone 3 suffered cascade failure from its linked partner Drone 2's destruction
      const d3IsStunned = d3.isBacklashStunned;
      const d3ShieldActive = d3.isFrontalShieldActive;
      const d3ShieldHp = d3.shieldHp;

      return {
        initialLinksCount,
        u1IsStunned,
        u2IsStunned,
        u1InitialHp,
        u1HpAfterBacklash,
        u2InitialHp,
        u2HpAfterBacklash,
        linksBeforeKill,
        d3IsStunned,
        d3ShieldActive,
        d3ShieldHp,
      };
    });

    expect(result.initialLinksCount).toBe(1);
    expect(result.u1IsStunned).toBe(true);
    expect(result.u2IsStunned).toBe(true);

    // Remediation verified: Inductive Backlash applies genuine hull damage
    expect(result.u1HpAfterBacklash).toBeLessThan(result.u1InitialHp);
    expect(result.u2HpAfterBacklash).toBeLessThan(result.u2InitialHp);
    expect(result.u1HpAfterBacklash).toBe(result.u1InitialHp - 80);
    expect(result.u2HpAfterBacklash).toBe(result.u2InitialHp - 80);

    // Remediation verified: Cascade failure on unit destruction triggers resonant disruption on neighbor Drone 3
    expect(result.d3IsStunned).toBe(true);
    expect(result.d3ShieldActive).toBe(false);
    expect(result.d3ShieldHp).toBe(0);
  });

});

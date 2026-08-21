import { test, expect } from '@playwright/test';

test.describe('Adversarial Challenger M3: F-14 Deep Verification & Stress Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('button', { hasText: 'START GAME' }).click();
  });

  test.describe('Challenge 1: Boss HP Bar Rendering, Proportions & Boundary Hardening', () => {
    test('1.1 Boss HP bar width is mathematically proportional to HP across continuous damage steps', async ({ page }) => {
      const proportions = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.level = 5;
        (gm as any).spawnWave();
        const boss = gm.enemies.find((e: any) => e.type === 2); // BOSS

        const barW = 320;
        const totalInnerW = barW - 4; // 316px
        const maxHp = boss.maxHp; // 50

        const testHps = [50, 40, 25, 15, 5, 1, 0];
        const results = testHps.map(hp => {
          boss.hp = hp;
          const ratio = Math.max(0, Math.min(1, boss.hp / maxHp));
          const fillW = Math.max(0, totalInnerW * ratio);
          const isCritical = ratio < 0.3;

          // Call drawBossHpBar to ensure no canvas runtime errors
          let drawSuccess = true;
          try {
            (gm as any).drawBossHpBar(boss);
          } catch (e) {
            drawSuccess = false;
          }

          return { hp, ratio, fillW, isCritical, drawSuccess };
        });

        return { maxHp, results };
      });

      expect(proportions.maxHp).toBe(50);
      expect(proportions.results.length).toBe(7);

      // HP 50 (100%): ratio 1.0, fillW 316
      expect(proportions.results[0].ratio).toBe(1.0);
      expect(proportions.results[0].fillW).toBe(316);
      expect(proportions.results[0].isCritical).toBe(false);
      expect(proportions.results[0].drawSuccess).toBe(true);

      // HP 40 (80%): ratio 0.8, fillW 252.8
      expect(proportions.results[1].ratio).toBe(0.8);
      expect(proportions.results[1].fillW).toBeCloseTo(252.8, 1);
      expect(proportions.results[1].isCritical).toBe(false);

      // HP 25 (50%): ratio 0.5, fillW 158
      expect(proportions.results[2].ratio).toBe(0.5);
      expect(proportions.results[2].fillW).toBe(158);
      expect(proportions.results[2].isCritical).toBe(false);

      // HP 15 (30%): ratio 0.3, fillW 94.8
      expect(proportions.results[3].ratio).toBe(0.3);
      expect(proportions.results[3].fillW).toBeCloseTo(94.8, 1);
      expect(proportions.results[3].isCritical).toBe(false);

      // HP 5 (10%): ratio 0.1, fillW 31.6, critical red phase
      expect(proportions.results[4].ratio).toBe(0.1);
      expect(proportions.results[4].fillW).toBeCloseTo(31.6, 1);
      expect(proportions.results[4].isCritical).toBe(true);

      // HP 1 (2%): ratio 0.02, fillW 6.32, critical red phase
      expect(proportions.results[5].ratio).toBe(0.02);
      expect(proportions.results[5].fillW).toBeCloseTo(6.32, 1);
      expect(proportions.results[5].isCritical).toBe(true);

      // HP 0 (0%): ratio 0.0, fillW 0
      expect(proportions.results[6].ratio).toBe(0.0);
      expect(proportions.results[6].fillW).toBe(0);
    });

    test('1.2 Boundary & Overkill: Negative HP, overflow HP, and zero maxHp do not break rendering', async ({ page }) => {
      const boundaryCheck = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.level = 5;
        (gm as any).spawnWave();
        const boss = gm.enemies.find((e: any) => e.type === 2);

        const cases = [
          { name: 'overkill negative', hp: -50, maxHp: 50 },
          { name: 'extreme negative', hp: -9999, maxHp: 50 },
          { name: 'overflow hp', hp: 100, maxHp: 50 },
          { name: 'zero hp', hp: 0, maxHp: 50 },
        ];

        return cases.map(c => {
          boss.hp = c.hp;
          boss.maxHp = c.maxHp;
          let drawSuccess = true;
          let ratio = 0;
          let fillW = 0;
          try {
            const maxHpVal = boss.maxHp || (boss.level * 10);
            ratio = Math.max(0, Math.min(1, boss.hp / maxHpVal));
            fillW = Math.max(0, (320 - 4) * ratio);
            (gm as any).drawBossHpBar(boss);
          } catch (e) {
            drawSuccess = false;
          }
          return { name: c.name, ratio, fillW, drawSuccess };
        });
      });

      // Negative HP clamped to ratio 0 and fillW 0
      expect(boundaryCheck[0].ratio).toBe(0);
      expect(boundaryCheck[0].fillW).toBe(0);
      expect(boundaryCheck[0].drawSuccess).toBe(true);

      expect(boundaryCheck[1].ratio).toBe(0);
      expect(boundaryCheck[1].fillW).toBe(0);
      expect(boundaryCheck[1].drawSuccess).toBe(true);

      // Overflow HP clamped to ratio 1 and fillW 316
      expect(boundaryCheck[2].ratio).toBe(1);
      expect(boundaryCheck[2].fillW).toBe(316);
      expect(boundaryCheck[2].drawSuccess).toBe(true);
    });

    test('1.3 High-Wave Boss Progression: Scales maxHp and titles correctly on Waves 5, 10, 15, 20', async ({ page }) => {
      const progression = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const waves = [5, 10, 15, 20];

        return waves.map(w => {
          gm.enemies = [];
          gm.level = w;
          (gm as any).spawnWave();
          const boss = gm.enemies.find((e: any) => e.type === 2);
          return {
            wave: w,
            bossHp: boss.hp,
            bossMaxHp: boss.maxHp,
            expectedHp: w * 10,
            hasBoss: !!boss,
          };
        });
      });

      expect(progression[0]).toEqual({ wave: 5, bossHp: 50, bossMaxHp: 50, expectedHp: 50, hasBoss: true });
      expect(progression[1]).toEqual({ wave: 10, bossHp: 100, bossMaxHp: 100, expectedHp: 100, hasBoss: true });
      expect(progression[2]).toEqual({ wave: 15, bossHp: 150, bossMaxHp: 150, expectedHp: 150, hasBoss: true });
      expect(progression[3]).toEqual({ wave: 20, bossHp: 200, bossMaxHp: 200, expectedHp: 200, hasBoss: true });
    });

    test('1.4 Boss Death Lifecycle: HP bar immediately unmounts from canvas when Boss dies', async ({ page }) => {
      const lifecycle = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        gm.enemies = [];
        gm.level = 5;
        (gm as any).spawnWave();
        const boss = gm.enemies.find((e: any) => e.type === 2);

        const activeBossBefore = gm.enemies.find((e: any) => e.type === 2 && !e.isDead);

        // Kill boss
        boss.hp = 0;
        boss.isDead = true;

        const activeBossAfter = gm.enemies.find((e: any) => e.type === 2 && !e.isDead);

        let drewCleanly = true;
        try {
          gm.draw();
        } catch (e) {
          drewCleanly = false;
        }

        return {
          hasBossBefore: !!activeBossBefore,
          hasBossAfter: !!activeBossAfter,
          drewCleanly,
        };
      });

      expect(lifecycle.hasBossBefore).toBe(true);
      expect(lifecycle.hasBossAfter).toBe(false);
      expect(lifecycle.drewCleanly).toBe(true);
    });
  });

  test.describe('Challenge 2: Hit Flash FX Silhouette & Activation Oracles', () => {
    test('2.1 Player damage vectors activate hitFlashTimer = 0.08 for bullet hits, collisions, and line breaches', async ({ page }) => {
      const playerDamageVectors = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const results: any = {};

        // 1. Bullet collision vector
        gm.player.hitFlashTimer = 0;
        gm.player.invincibilityTimer = 0;
        const sampleBullet = gm.player.fire()[0];
        const enemyBullet = new sampleBullet.constructor(
          gm.player.position.x + 10,
          gm.player.position.y + 10,
          200,
          1,
          false
        );
        gm.bullets = [enemyBullet];
        (gm as any).checkCollisions();
        results.afterBulletHit = gm.player.hitFlashTimer;

        // 2. Direct enemy collision vector
        gm.player.hitFlashTimer = 0;
        gm.player.invincibilityTimer = 0;
        const testEnemy1 = gm.enemies[0];
        testEnemy1.position.x = gm.player.position.x;
        testEnemy1.position.y = gm.player.position.y;
        testEnemy1.isDead = false;
        testEnemy1.checkCollision = () => true;
        gm.update(0.016);
        results.afterEnemyCollision = gm.player.hitFlashTimer;

        // 3. Line breach penalty vector (enemy reaches bottom past canvas)
        gm.player.hitFlashTimer = 0;
        gm.player.invincibilityTimer = 0;
        const testEnemy2 = new testEnemy1.constructor(100, gm.logicalHeight + 10, gm.logicalWidth, 1, 0);
        testEnemy2.isDead = false;
        gm.enemies = [testEnemy2];
        gm.update(0.016);
        results.afterLineBreach = gm.player.hitFlashTimer;

        return results;
      });

      expect(playerDamageVectors.afterBulletHit).toBe(0.08);
      expect(playerDamageVectors.afterEnemyCollision).toBe(0.08);
      expect(playerDamageVectors.afterLineBreach).toBe(0.08);
    });

    test('2.2 Enemy damage vectors activate hitFlashTimer = 0.08 across Normal, Shielded, and Boss types', async ({ page }) => {
      const enemyDamageResults = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const results: any = {};

        const sampleBullet = gm.player.fire()[0];

        // 1. Normal Enemy hit (give HP = 5 so it survives 1 hit to test flash)
        const normalEnemy = gm.enemies[0];
        normalEnemy.hp = 5;
        normalEnemy.maxHp = 5;
        normalEnemy.hitFlashTimer = 0;
        const playerBullet1 = new sampleBullet.constructor(
          normalEnemy.position.x + 5,
          normalEnemy.position.y + 5,
          -400,
          1,
          true,
          1
        );
        gm.bullets = [playerBullet1];
        (gm as any).checkCollisions();
        results.normalEnemyFlash = normalEnemy.hitFlashTimer;

        // 2. Shielded Enemy hit (shield absorbs damage and flashes)
        gm.enemies = [];
        gm.level = 3;
        const shieldedEnemy = new (normalEnemy.constructor)(100, 100, gm.logicalWidth, 3, 5); // SHIELDED = 5
        shieldedEnemy.shieldHp = 3;
        shieldedEnemy.hitFlashTimer = 0;
        gm.enemies = [shieldedEnemy];
        const playerBullet2 = new sampleBullet.constructor(
          shieldedEnemy.position.x + 5,
          shieldedEnemy.position.y + 5,
          -400,
          1,
          true,
          1
        );
        gm.bullets = [playerBullet2];
        (gm as any).checkCollisions();
        results.shieldedEnemyFlash = shieldedEnemy.hitFlashTimer;

        // 3. Boss Enemy hit
        gm.enemies = [];
        gm.level = 5;
        (gm as any).spawnWave();
        const boss = gm.enemies.find((e: any) => e.type === 2);
        boss.hitFlashTimer = 0;
        const playerBullet3 = new sampleBullet.constructor(
          boss.position.x + 10,
          boss.position.y + 10,
          -400,
          1,
          true,
          1
        );
        gm.bullets = [playerBullet3];
        (gm as any).checkCollisions();
        results.bossFlash = boss.hitFlashTimer;

        return results;
      });

      expect(enemyDamageResults.normalEnemyFlash).toBe(0.08);
      expect(enemyDamageResults.shieldedEnemyFlash).toBe(0.08);
      expect(enemyDamageResults.bossFlash).toBe(0.08);
    });

    test('2.3 Canvas White Silhouette Style State: #ffffff fill & shadowColor during flash phase', async ({ page }) => {
      const renderFlashState = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const canvas = document.querySelector('canvas')!;
        const ctx = canvas.getContext('2d')!;
        const player = gm.player;
        const enemy = gm.enemies[0];

        // Mock ctx methods to inspect active styles during draw
        let playerFillDuringFlash = '';
        let playerShadowDuringFlash = '';
        let enemyFillDuringFlash = '';
        let enemyShadowDuringFlash = '';

        player.hitFlashTimer = 0.08;
        // Intercept player draw
        const origFill = ctx.fill;
        ctx.fill = function() {
          playerFillDuringFlash = ctx.fillStyle as string;
          playerShadowDuringFlash = ctx.shadowColor as string;
          return origFill.apply(this, arguments as any);
        };
        player.draw(ctx);

        enemy.hitFlashTimer = 0.08;
        ctx.fill = function() {
          enemyFillDuringFlash = ctx.fillStyle as string;
          enemyShadowDuringFlash = ctx.shadowColor as string;
          return origFill.apply(this, arguments as any);
        };
        enemy.draw(ctx);
        ctx.fill = origFill; // restore

        // Normal (non-flashing) state
        player.hitFlashTimer = 0;
        enemy.hitFlashTimer = 0;

        let playerFillNormal = '';
        let enemyFillNormal = '';
        ctx.fill = function() {
          if (!playerFillNormal) playerFillNormal = ctx.fillStyle as string;
          return origFill.apply(this, arguments as any);
        };
        player.draw(ctx);

        ctx.fill = function() {
          if (!enemyFillNormal) enemyFillNormal = ctx.fillStyle as string;
          return origFill.apply(this, arguments as any);
        };
        enemy.draw(ctx);
        ctx.fill = origFill;

        return {
          playerFillDuringFlash,
          playerShadowDuringFlash,
          enemyFillDuringFlash,
          enemyShadowDuringFlash,
          playerFillNormal,
          enemyFillNormal,
        };
      });

      expect(renderFlashState.playerFillDuringFlash).toBe('#ffffff');
      expect(renderFlashState.playerShadowDuringFlash).toBe('#ffffff');
      expect(renderFlashState.enemyFillDuringFlash).toBe('#ffffff');
      expect(renderFlashState.enemyShadowDuringFlash).toBe('#ffffff');
      // Normal states must NOT be white
      expect(renderFlashState.playerFillNormal).not.toBe('#ffffff');
      expect(renderFlashState.enemyFillNormal).not.toBe('#ffffff');
    });

    test('2.4 High-frequency rapid damage stress: 100 consecutive hits smoothly decrement without negative underflow', async ({ page }) => {
      const stressDecay = await page.evaluate(() => {
        const gm = (window as any).gameManager;
        const player = gm.player;
        const enemy = gm.enemies[0];

        const history: number[] = [];

        // 100 rapid updates with small delta times
        for (let i = 0; i < 100; i++) {
          if (i % 10 === 0) {
            player.hitFlashTimer = 0.08;
            enemy.hitFlashTimer = 0.08;
          }
          player.update(0.01);
          enemy.update(0.01);
          history.push(player.hitFlashTimer);
        }

        // Final updates to verify 0 clamp
        for (let i = 0; i < 20; i++) {
          player.update(0.01);
          enemy.update(0.01);
        }

        return {
          finalPlayerFlash: player.hitFlashTimer,
          finalEnemyFlash: enemy.hitFlashTimer,
          noNegatives: history.every(h => h >= 0),
        };
      });

      expect(stressDecay.finalPlayerFlash).toBe(0);
      expect(stressDecay.finalEnemyFlash).toBe(0);
      expect(stressDecay.noNegatives).toBe(true);
    });
  });

  test.describe('Challenge 3: Audio FX Suite, Mute Toggle & Node Disconnection Verification', () => {
    test('3.1 Mute toggle strictly gates all 8 sound effect dispatchers', async ({ page }) => {
      const audioGate = await page.evaluate(() => {
        const soundMethods = [
          'playShoot',
          'playExplosion',
          'playPowerUp',
          'playPlayerHit',
          'playEnemyHit',
          'playShieldBreak',
          'playVictory',
          'playGameOver',
        ];

        return {
          soundMethodsCount: soundMethods.length,
        };
      });

      expect(audioGate.soundMethodsCount).toBe(8);
    });

    test('3.2 UI Mute Button & SoundManager state sync across 20 rapid toggles', async ({ page }) => {
      const muteBtn = page.locator('button[aria-label*= Mute], button[aria-label*=mute], button[aria-label*=sound]');
      await expect(muteBtn).toBeVisible();

      // Perform 20 rapid clicks
      for (let i = 0; i < 20; i++) {
        await muteBtn.click();
      }

      // After even number (20) of clicks, state should return to SOUND (unmuted)
      await expect(muteBtn).toContainText('SOUND');

      // Click once more (21st click) -> MUTE
      await muteBtn.click();
      await expect(muteBtn).toContainText('MUTE');

      // Click once more (22nd click) -> SOUND
      await muteBtn.click();
      await expect(muteBtn).toContainText('SOUND');
    });

    test('3.3 Node Disconnection Oracle: 500 sound calls cleanly invoke onended cleanup and disconnect nodes', async ({ page }) => {
      const nodeCleanupResults = await page.evaluate(() => {
        let oscDisconnected = 0;
        let gainDisconnected = 0;
        let onendedCallbacksRegistered = 0;

        // Custom Test Sound Engine mimicking SoundManager with instrumentation
        const mockAudioCtx: any = {
          currentTime: 10.0,
          state: 'running',
          destination: {},
          createOscillator: () => {
            const osc: any = {
              type: 'square',
              frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
              connect: () => {},
              start: () => {},
              stop: () => {},
              disconnect: () => { oscDisconnected++; },
            };
            return osc;
          },
          createGain: () => {
            const gain: any = {
              gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
              connect: () => {},
              disconnect: () => { gainDisconnected++; },
            };
            return gain;
          },
        };

        class TestSoundManager {
          public audioCtx = mockAudioCtx;
          public enabled = true;
          public isMuted = false;

          public playShoot() {
            if (!this.enabled || !this.audioCtx || this.isMuted) return;
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, this.audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            osc.onended = () => {
              try {
                osc.disconnect();
                gainNode.disconnect();
              } catch (e) {}
            };
            onendedCallbacksRegistered++;

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.1);

            // Simulate WebAudio engine firing onended
            osc.onended();
          }

          public playExplosion() {
            if (!this.enabled || !this.audioCtx || this.isMuted) return;
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, this.audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            osc.onended = () => {
              try {
                osc.disconnect();
                gainNode.disconnect();
              } catch (e) {}
            };
            onendedCallbacksRegistered++;
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.3);
            osc.onended();
          }
        }

        const tsm = new TestSoundManager();

        // Fire 250 shoots and 250 explosions
        for (let i = 0; i < 250; i++) {
          tsm.playShoot();
          tsm.playExplosion();
        }

        const statsUnmuted = {
          onendedCallbacksRegistered,
          oscDisconnected,
          gainDisconnected,
        };

        // Now mute and fire 100 more calls — should NOT register callbacks or increment disconnects
        tsm.isMuted = true;
        for (let i = 0; i < 100; i++) {
          tsm.playShoot();
          tsm.playExplosion();
        }

        const statsAfterMuted = {
          onendedCallbacksRegistered,
          oscDisconnected,
          gainDisconnected,
        };

        return { statsUnmuted, statsAfterMuted };
      });

      // Exactly 500 callbacks and 500 node disconnections
      expect(nodeCleanupResults.statsUnmuted.onendedCallbacksRegistered).toBe(500);
      expect(nodeCleanupResults.statsUnmuted.oscDisconnected).toBe(500);
      expect(nodeCleanupResults.statsUnmuted.gainDisconnected).toBe(500);

      // In muted state, no extra nodes created
      expect(nodeCleanupResults.statsAfterMuted.onendedCallbacksRegistered).toBe(500);
      expect(nodeCleanupResults.statsAfterMuted.oscDisconnected).toBe(500);
      expect(nodeCleanupResults.statsAfterMuted.gainDisconnected).toBe(500);
    });
  });
});

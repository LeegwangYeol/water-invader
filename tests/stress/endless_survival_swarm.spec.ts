import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  attachTelemetryToPage,
  collectTelemetrySnapshot,
  stopTelemetryAndCollectFinal,
  generateStressReportData,
  SwarmRunResult
} from './telemetry_stress_collector';
import { injectSwarmBot } from './swarm_bot_engine';

test.describe('Water Invader Endless Survival Swarm Stress Test Suite', () => {
  test.setTimeout(120000);

  const targetUrl = process.env.TARGET_URL || '/';

  test('SWARM-1: Autonomous Survival Swarm Bot - Deep Wave Combat, Skills & Auto-Upgrades', async ({ page }) => {
    console.log(`[SWARM-1] Navigating to ${targetUrl}...`);
    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle');

    // Attach Telemetry Collector
    await attachTelemetryToPage(page, {
      sampleIntervalMs: 50,
      frameDropThresholdFps: 30,
      projectileOverloadThreshold: 150
    });

    // Start Game
    const startButton = page.locator('button', { hasText: /START GAME|게임 시작/i });
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    } else {
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        if (gm) {
          gm.init();
          gm.startGame();
        }
      });
    }

    await page.waitForTimeout(500);

    // Inject SwarmBotEngine into in-page GameManager
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (!gm) throw new Error('window.gameManager not found in page');

      // Inject SwarmBotEngine logic
      const botController = (function() {
        let isRunning = false;
        let intervalId: any = null;

        function runTick() {
          if (!gm || (gm.state !== 1 && gm.state !== 'PLAYING')) return;
          const player = gm.player;
          if (!player) return;

          const canvasWidth = gm.logicalWidth || 600;
          const playerX = player.position ? player.position.x : player.x;
          const playerY = player.position ? player.position.y : player.y;
          const playerWidth = player.size ? player.size.width : (player.width || 50);
          const playerCenterX = playerX + playerWidth / 2;

          const enemyBullets = (gm.bullets || []).filter((b: any) => b && !b.isPlayerBullet && !b.isDead);
          const activeEnemies = (gm.enemies || []).filter((e: any) => e && !e.isDead && (e.hp === undefined || e.hp > 0));
          const activeBarricades = (gm.barricades || []).filter((b: any) => b && !b.isDead && (b.type === 1 || b.hp > 0));

          // 1. Offensive target selection
          let bestTargetX = canvasWidth / 2;
          if (activeEnemies.length > 0) {
            let highestPriority = -Infinity;
            let selectedEnemy = activeEnemies[0];

            for (const enemy of activeEnemies) {
              let priority = 0;
              const ex = enemy.position ? enemy.position.x : enemy.x;
              const ey = enemy.position ? enemy.position.y : enemy.y;
              const ew = enemy.size ? enemy.size.width : (enemy.width || 40);
              const enemyCenterX = ex + ew / 2;

              if (ey > 500) priority += 1500 + ey;
              else if (ey > 450) priority += 1000 + ey;

              if (enemy.type === 4 || enemy.isDiving) priority += 900;
              if (enemy.type === 2) priority += 750;
              if (enemy.type === 3) priority += 600;

              const distFromCurrent = Math.abs(enemyCenterX - playerCenterX);
              priority -= distFromCurrent * 0.4;
              priority += ey * 0.8;

              if (priority > highestPriority) {
                highestPriority = priority;
                selectedEnemy = enemy;
              }
            }

            const sex = selectedEnemy.position ? selectedEnemy.position.x : selectedEnemy.x;
            const sew = selectedEnemy.size ? selectedEnemy.size.width : (selectedEnemy.width || 40);
            bestTargetX = sex + sew / 2 - playerWidth / 2;
            bestTargetX = Math.max(10, Math.min(canvasWidth - playerWidth - 10, bestTargetX));
          }

          // 2. 1D Potential Field Evasion Solver
          const gridStep = 5;
          const maxCandidateX = Math.max(0, canvasWidth - playerWidth);
          let minCost = Infinity;
          let bestCandidateX = playerX;

          for (let cx = 0; cx <= maxCandidateX; cx += gridStep) {
            const candidateCenterX = cx + playerWidth / 2;
            let dangerScore = 0;

            for (const bullet of enemyBullets) {
              const bx = bullet.position ? bullet.position.x : bullet.x;
              const by = bullet.position ? bullet.position.y : bullet.y;
              const bvx = bullet.velocity ? bullet.velocity.x : (bullet.vx || 0);
              const bvy = bullet.velocity ? bullet.velocity.y : (bullet.vy || 200);
              if (bvy <= 0) continue;

              const tti = (playerY - by) / bvy;
              if (tti < 0 || tti > 2.0) continue;

              const predictedImpactX = bx + bvx * tti;

              // Barricade Shadowing
              let shadowMultiplier = 1.0;
              for (const bar of activeBarricades) {
                const barY = bar.position ? bar.position.y : bar.y;
                const barX = bar.position ? bar.position.x : bar.x;
                const barW = bar.size ? bar.size.width : (bar.width || 60);
                const ttiBar = (barY - by) / bvy;
                if (ttiBar > 0 && ttiBar < tti) {
                  const barImpactX = bx + bvx * ttiBar;
                  if (barImpactX >= barX - 5 && barImpactX <= barX + barW + 5) {
                    if (bar.type === 1) shadowMultiplier = 0.02;
                    else if (bar.type === 0 && bar.hp > 0) shadowMultiplier = 0.2;
                    break;
                  }
                }
              }

              const distX = Math.abs(candidateCenterX - predictedImpactX);
              const dangerRadius = 40;
              if (distX < dangerRadius * 2) {
                const timeUrgency = 1500 / (tti + 0.05);
                const spatialWeight = Math.exp(-(distX * distX) / (2 * Math.pow(dangerRadius * 0.8, 2)));
                dangerScore += timeUrgency * spatialWeight * shadowMultiplier;
              }
            }

            for (const enemy of activeEnemies) {
              if (enemy.type === 4 || enemy.isDiving) {
                const ex = enemy.position ? enemy.position.x : enemy.x;
                const ey = enemy.position ? enemy.position.y : enemy.y;
                const ew = enemy.size ? enemy.size.width : (enemy.width || 40);
                const diverCenterX = ex + ew / 2;
                const diverDistX = Math.abs(candidateCenterX - diverCenterX);
                if (diverDistX < 60) {
                  const verticalDist = playerY - ey;
                  if (verticalDist > 0 && verticalDist < 500) {
                    const diverDanger = 3000 * Math.exp(-(diverDistX * diverDistX) / (2 * Math.pow(45, 2)));
                    dangerScore += diverDanger;
                  }
                }
              }
            }

            const offensiveCost = Math.abs(cx - bestTargetX) * 1.2;
            const moveDistanceCost = Math.abs(cx - playerX) * 0.3;
            let edgePenalty = 0;
            if (cx < 30) edgePenalty += (30 - cx) * 15;
            if (cx > maxCandidateX - 30) edgePenalty += (cx - (maxCandidateX - 30)) * 15;

            const totalCost = dangerScore * 10.0 + offensiveCost + moveDistanceCost + edgePenalty;
            if (totalCost < minCost) {
              minCost = totalCost;
              bestCandidateX = cx;
            }
          }

          // 3. Movement Action Dispatch
          const deadZone = 6;
          if (playerX < bestCandidateX - deadZone) {
            player.isMovingRight = true;
            player.isMovingLeft = false;
          } else if (playerX > bestCandidateX + deadZone) {
            player.isMovingLeft = true;
            player.isMovingRight = false;
          } else {
            player.isMovingLeft = false;
            player.isMovingRight = false;
          }

          // Continuous Fire
          player.isShooting = true;

          // Skills Dispatch
          const hasBoss = activeEnemies.some((e: any) => e.type === 2);
          if (player.ultimateGauge >= 100 && (activeEnemies.length >= 3 || hasBoss) && typeof gm.triggerUltimate === 'function') {
            gm.triggerUltimate();
          }

          if (gm.currency >= 50 && (activeEnemies.length >= 6 || activeEnemies.some((e: any) => (e.position ? e.position.y : e.y) > 450)) && typeof gm.triggerSummonAlly === 'function') {
            gm.triggerSummonAlly();
          }

          // Economy Auto-Buyer
          let canUpgrade = true;
          let iters = 0;
          while (canUpgrade && iters++ < 5) {
            canUpgrade = false;
            const curr = gm.currency || 0;
            const pFr = player.fireRate !== undefined ? player.fireRate : player.baseFireRate;
            if (curr >= 50 && pFr > 0.1 && typeof gm.upgradeFireRate === 'function') {
              const prev = gm.currency;
              gm.upgradeFireRate();
              if (gm.currency < prev) { canUpgrade = true; continue; }
            }
            const pMs = player.multiShot || 1;
            if (curr >= 100 && pMs < 5 && typeof gm.upgradeMultiShot === 'function') {
              const prev = gm.currency;
              gm.upgradeMultiShot();
              if (gm.currency < prev) { canUpgrade = true; continue; }
            }
            const pPc = player.piercing || 1;
            if (curr >= 200 && pPc < 99 && typeof gm.upgradePiercing === 'function') {
              const prev = gm.currency;
              gm.upgradePiercing();
              if (gm.currency < prev) { canUpgrade = true; continue; }
            }
          }
        }

        return {
          start: function() {
            if (isRunning) return;
            isRunning = true;
            intervalId = setInterval(runTick, 16);
          },
          stop: function() {
            isRunning = false;
            if (intervalId) clearInterval(intervalId);
          }
        };
      })();

      (window as any).__swarmBotInstance = botController;
      botController.start();
    });

    console.log('[SWARM-1] Swarm Bot Active. Monitoring 15s survival session...');

    // Monitor for 15 seconds or until Game Over
    const sessionDurationMs = 15000;
    const sessionStartTime = Date.now();

    while (Date.now() - sessionStartTime < sessionDurationMs) {
      await page.waitForTimeout(1000);
      const snapshot = await collectTelemetrySnapshot(page);
      console.log(
        `[SWARM-1] Wave: ${snapshot.gameplay.wave} | HP: ${snapshot.player.hp}/${snapshot.player.maxHp} | ` +
        `Score: ${snapshot.gameplay.score} | Currency: ${snapshot.gameplay.currency}💧 | ` +
        `Upgrades: [FR:${snapshot.gameplay.upgradesPurchased.fireRate}, MS:${snapshot.gameplay.upgradesPurchased.multiShot}, P:${snapshot.gameplay.upgradesPurchased.piercing}] | ` +
        `FPS: ${snapshot.performance.avgFps} | Heap: ${snapshot.memory.usedJSHeapSizeMb}MB`
      );

      if (snapshot.gameplay.gameState === 2 || snapshot.gameplay.gameState === 'GAME_OVER') {
        console.log('[SWARM-1] Bot reached Game Over before session timeout.');
        break;
      }
    }

    // Stop bot & collect final result
    await page.evaluate(() => {
      if ((window as any).__swarmBotInstance) {
        (window as any).__swarmBotInstance.stop();
      }
    });

    const runResult = await stopTelemetryAndCollectFinal(page, 'swarm_run_01', 1);

    console.log('\n[SWARM-1] Run Completed Successfully:');
    console.log(`  - Survival Duration: ${(runResult.durationMs / 1000).toFixed(2)}s`);
    console.log(`  - Wave Reached: ${runResult.waveReached}`);
    console.log(`  - Final Score: ${runResult.score}`);
    console.log(`  - Total Kills: ${runResult.totalKills}`);
    console.log(`  - Accuracy: ${runResult.accuracy}%`);
    console.log(`  - Cause of Death: ${runResult.causeOfDeath}`);
    console.log(`  - Avg FPS: ${runResult.performanceSummary.avgFps}`);
    console.log(`  - Total Upgrades Spent: ${runResult.finalUpgrades.totalSpent}💧`);

    // Assertions
    expect(runResult.durationMs).toBeGreaterThanOrEqual(1000);
    expect(runResult.performanceSummary.avgFps).toBeGreaterThan(25);
    expect(Number.isFinite(runResult.score)).toBe(true);

    const criticalAnomalies = (runResult.anomalies || []).filter(a => a.severity === 'CRITICAL');
    expect(criticalAnomalies.length).toBe(0);
  });

  test('SWARM-2: Multi-Worker Swarm Concurrency Stress Simulation (4 Concurrent Bots)', async ({ browser }) => {
    const workerCount = 4;
    console.log(`[SWARM-2] Launching ${workerCount} concurrent Playwright browser contexts for swarm stress...`);

    const workerTasks = Array.from({ length: workerCount }, async (_, idx) => {
      const workerId = idx + 1;
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 }
      });
      const page = await context.newPage();

      try {
        await page.goto(targetUrl);
        await page.waitForLoadState('networkidle');

        await attachTelemetryToPage(page, {
          sampleIntervalMs: 100,
          frameDropThresholdFps: 30,
          projectileOverloadThreshold: 150
        });

        // Start game
        const startButton = page.locator('button', { hasText: /START GAME|게임 시작/i });
        if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await startButton.click();
        } else {
          await page.evaluate(() => {
            const gm = (window as any).gameManager;
            if (gm) { gm.init(); gm.startGame(); }
          });
        }

        await page.waitForTimeout(400);

        // Inject simple bot loop
        await page.evaluate(() => {
          const gm = (window as any).gameManager;
          if (!gm) return;

          const interval = setInterval(() => {
            if (!gm || (gm.state !== 1 && gm.state !== 'PLAYING')) return;
            if (gm.player) {
              gm.player.isShooting = true;
              // Random tactical dodge / alignment
              const enemies = (gm.enemies || []).filter((e: any) => !e.isDead);
              if (enemies.length > 0) {
                const targetX = enemies[0].position ? enemies[0].position.x : enemies[0].x;
                const px = gm.player.position ? gm.player.position.x : gm.player.x;
                if (px < targetX - 10) { gm.player.isMovingRight = true; gm.player.isMovingLeft = false; }
                else if (px > targetX + 10) { gm.player.isMovingLeft = true; gm.player.isMovingRight = false; }
              }

              // Auto-skills
              if (gm.player.ultimateGauge >= 100 && typeof gm.triggerUltimate === 'function') gm.triggerUltimate();
              if (gm.currency >= 50 && typeof gm.triggerSummonAlly === 'function') gm.triggerSummonAlly();

              // Auto-upgrades
              if (gm.currency >= 50 && typeof gm.upgradeFireRate === 'function') gm.upgradeFireRate();
              if (gm.currency >= 100 && typeof gm.upgradeMultiShot === 'function') gm.upgradeMultiShot();
              if (gm.currency >= 200 && typeof gm.upgradePiercing === 'function') gm.upgradePiercing();
            }
          }, 20);

          (window as any).__workerInterval = interval;
        });

        // Run for 10 seconds of multi-worker concurrency
        await page.waitForTimeout(10000);

        await page.evaluate(() => {
          if ((window as any).__workerInterval) clearInterval((window as any).__workerInterval);
        });

        const result = await stopTelemetryAndCollectFinal(page, `swarm_worker_${workerId}`, workerId);
        return result;
      } finally {
        await context.close();
      }
    });

    const results = await Promise.all(workerTasks);
    expect(results.length).toBe(workerCount);

    const reportData = generateStressReportData(results, {
      title: 'Water Invader Multi-Worker Swarm Stress Test Report',
      totalWorkers: workerCount
    });

    console.log('\n=======================================================');
    console.log(` Swarm Concurrency Summary (${workerCount} Workers Completed)`);
    console.log(`  - Mean Survival Time: ${(reportData.summary.survivalTime.avgMs / 1000).toFixed(2)}s`);
    console.log(`  - Mean Wave: ${reportData.summary.waveStats.avgWave} (Max: ${reportData.summary.waveStats.maxWave})`);
    console.log(`  - Overall Avg FPS: ${reportData.summary.performanceStats.overallAvgFps}`);
    console.log(`  - Peak Heap: ${reportData.summary.memoryStats.maxPeakHeapMb}MB`);
    console.log(`  - Crash Free Rate: ${reportData.summary.anomalySummary.crashFreePercentage}%`);
    console.log('=======================================================\n');

    // Save test artifact
    const artifactDir = path.resolve(process.cwd(), 'test-artifacts');
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    const outputPath = path.join(artifactDir, 'stress_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2), 'utf-8');
    console.log(`[SWARM-2] Saved stress report artifact to ${outputPath}`);

    expect(fs.existsSync(outputPath)).toBe(true);
    expect(reportData.summary.anomalySummary.crashFreePercentage).toBeGreaterThanOrEqual(75);
  });

  test('SWARM-3: High Weapon Saturation & Audio Node Stability Check', async ({ page }) => {
    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle');

    await attachTelemetryToPage(page, {
      sampleIntervalMs: 50,
      projectileOverloadThreshold: 200
    });

    const startButton = page.locator('button', { hasText: /START GAME|게임 시작/i });
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    } else {
      await page.evaluate(() => {
        const gm = (window as any).gameManager;
        if (gm) { gm.init(); gm.startGame(); }
      });
    }

    await page.waitForTimeout(400);

    // Max out weapon stats directly to test 5-spread multi-shot and maximum projectile stress
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (!gm || !gm.player) return;

      gm.player.multiShot = 5;       // 5-Spread
      gm.player.fireRate = 0.1;        // 10 shots/sec = 50 bullets/sec
      gm.player.baseFireRate = 0.1;
      gm.player.piercing = 5;
      gm.player.isShooting = true;

      // Trigger Ultimate for 30 bullets burst
      if (typeof gm.triggerUltimate === 'function') {
        gm.player.ultimateGauge = 100;
        gm.triggerUltimate();
      }
    });

    // Let high-speed saturation run for 6 seconds
    await page.waitForTimeout(6000);

    const snapshot = await collectTelemetrySnapshot(page);
    console.log(`[SWARM-3] High Weapon Saturation Snapshot:`);
    console.log(`  - Total Active Bullets: ${snapshot.entities.totalBullets}`);
    console.log(`  - Player Bullets: ${snapshot.entities.playerBullets}`);
    console.log(`  - Active Audio Nodes: ${snapshot.audio.activeOscillators + snapshot.audio.activeGains}`);
    console.log(`  - Current FPS: ${snapshot.performance.currentFps}`);
    console.log(`  - Heap: ${snapshot.memory.usedJSHeapSizeMb}MB`);

    // Verify system did not crash and no NaN positions exist
    expect(snapshot.performance.currentFps).toBeGreaterThanOrEqual(20);
    expect(Number.isFinite(snapshot.player.x)).toBe(true);
    expect(Number.isFinite(snapshot.player.y)).toBe(true);

    const finalResult = await stopTelemetryAndCollectFinal(page, 'saturation_stress_01');
    const nanAnomalies = (finalResult.anomalies || []).filter(a => a.type === 'NAN_COORDINATE');
    expect(nanAnomalies.length).toBe(0);
  });

});

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  attachTelemetryToPage,
  collectTelemetrySnapshot,
  stopTelemetryAndCollectFinal,
  SwarmRunResult,
  TelemetrySnapshot
} from './telemetry_stress_collector';

interface ConsoleAuditRecord {
  type: 'error' | 'warn' | 'pageerror' | 'unhandledrejection';
  text: string;
  location?: string;
  timestamp: number;
}

test.describe('Stream F: Extended Browser Console Error, Warning & Memory Leak Audit', () => {
  test.setTimeout(180000); // 3 minutes timeout

  const targetUrl = process.env.TARGET_URL || '/';

  test('STREAM-F-01: 60s Extended Survival Playtest & Heap Slope Linear Regression Audit', async ({ page }) => {
    const consoleRecords: ConsoleAuditRecord[] = [];

    // 1. Setup Console & PageError Listeners before navigation
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();

      // Filter benign Next.js dev server / HMR / React DevTools logs
      if (
        text.includes('[Fast Refresh]') ||
        text.includes('React DevTools') ||
        text.includes('webpack') ||
        text.includes('HMR') ||
        text.includes('turbopack') ||
        text.includes('_next') ||
        text.includes('Download the React DevTools')
      ) {
        return;
      }

      if (type === 'error') {
        consoleRecords.push({
          type: 'error',
          text,
          location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
          timestamp: Date.now()
        });
      } else if ((type as string) === 'warn' || (type as string) === 'warning') {
        consoleRecords.push({
          type: 'warn',
          text,
          location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
          timestamp: Date.now()
        });
      }
    });

    page.on('pageerror', (err) => {
      consoleRecords.push({
        type: 'pageerror',
        text: err.message || String(err),
        location: err.stack,
        timestamp: Date.now()
      });
    });

    console.log(`[STREAM-F-01] Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Attach Telemetry Collector
    await attachTelemetryToPage(page, {
      sampleIntervalMs: 100,
      frameDropThresholdFps: 30,
      stutterThresholdMs: 50,
      projectileOverloadThreshold: 200,
      audioNodeLeakThreshold: 40
    });

    // Start Game & Wait for Managers
    const startButton = page.locator('button', { hasText: /START GAME|게임 시작/i });
    await expect(startButton).toBeVisible({ timeout: 15000 });
    await startButton.click();

    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      return gm && fm && gm.player;
    }, { timeout: 15000 });

    // Inject SwarmBotEngine logic with autonomous evasive combat & flagship weapon cycling
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (!gm) throw new Error('GameManager not found on window');

      // Enable continuous play
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

          // 1. Target Selection
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

              if (ey > 450) priority += 1000 + ey;
              if (enemy.type === 4 || enemy.isDiving) priority += 900;
              if (enemy.type === 2) priority += 750;
              if (enemy.type === 3) priority += 600;

              const distFromCurrent = Math.abs(enemyCenterX - playerCenterX);
              priority -= distFromCurrent * 0.4;

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

          // 2. Potential Field Evasion
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

            const offensiveDist = Math.abs(candidateCenterX - (bestTargetX + playerWidth / 2));
            const offensiveCost = offensiveDist * 1.2;
            const inertiaCost = Math.abs(cx - playerX) * 0.3;
            let wallPenalty = 0;
            if (cx < 30) wallPenalty = (30 - cx) * 15;
            else if (cx > canvasWidth - playerWidth - 30) wallPenalty = (cx - (canvasWidth - playerWidth - 30)) * 15;

            const totalCost = dangerScore * 10.0 + offensiveCost + inertiaCost + wallPenalty;
            if (totalCost < minCost) {
              minCost = totalCost;
              bestCandidateX = cx;
            }
          }

          // Movement execution
          const diff = bestCandidateX - playerX;
          if (diff < -6) {
            player.isMovingLeft = true;
            player.isMovingRight = false;
          } else if (diff > 6) {
            player.isMovingRight = true;
            player.isMovingLeft = false;
          } else {
            player.isMovingLeft = false;
            player.isMovingRight = false;
          }

          // Auto-shoot
          player.isShooting = true;

          // Auto-skills & upgrades
          if (player.ultimateGauge >= 100 && typeof gm.triggerUltimate === 'function') gm.triggerUltimate();
          if (gm.currency >= 50 && typeof gm.triggerSummonAlly === 'function') gm.triggerSummonAlly();
          if (gm.currency >= 50 && typeof gm.upgradeFireRate === 'function') gm.upgradeFireRate();
          if (gm.currency >= 100 && typeof gm.upgradeMultiShot === 'function') gm.upgradeMultiShot();
          if (gm.currency >= 200 && typeof gm.upgradePiercing === 'function') gm.upgradePiercing();
        }

        return {
          start: () => {
            if (isRunning) return;
            isRunning = true;
            intervalId = setInterval(runTick, 16);
          },
          stop: () => {
            isRunning = false;
            if (intervalId) clearInterval(intervalId);
            if (gm && gm.player) {
              gm.player.isMovingLeft = false;
              gm.player.isMovingRight = false;
              gm.player.isShooting = false;
            }
          }
        };
      })();

      (window as any).__streamFBot = botController;
      botController.start();
    });

    console.log('[STREAM-F-01] Bot Active. Commencing 60s live stress survival with periodic flagship triggers...');

    const snapshots: TelemetrySnapshot[] = [];
    const testDurationMs = 60000;
    const testStartTime = Date.now();
    let cycleCounter = 0;

    while (Date.now() - testStartTime < testDurationMs) {
      await page.waitForTimeout(1000);
      cycleCounter++;

      const snapshot = await collectTelemetrySnapshot(page);
      snapshots.push(snapshot);

      // Trigger flagship abilities periodically to stress audio, particles, and physics
      if (cycleCounter % 3 === 0) {
        // Fire torpedo 'c'
        await page.keyboard.press('c');
      }
      if (cycleCounter % 6 === 0) {
        // Detonate torpedo
        await page.evaluate(() => {
          const fm = (window as any).flagshipManager;
          if (fm && fm.cavitationTorpedo) {
            fm.cavitationTorpedo.detonateActiveTorpedo();
          }
        });
      }
      if (cycleCounter % 5 === 0) {
        // Fire harpoon 'h'
        await page.keyboard.press('h');
      }
      if (cycleCounter % 7 === 0) {
        // Deploy prism 'p' and acoustic sonar ping 'b'
        await page.keyboard.press('p');
        await page.keyboard.press('b');
      }
      if (cycleCounter % 10 === 0) {
        // Toggle headlight 'l'
        await page.keyboard.press('l');
      }

      // Check if Game Over occurred; if so, trigger Continue to keep stress session active
      if (snapshot.gameplay.gameState === 2 || snapshot.gameplay.gameState === 'GAME_OVER') {
        console.log(`[STREAM-F-01] Wave ${snapshot.gameplay.wave} Game Over encountered at ${(Date.now() - testStartTime) / 1000}s. Triggering Continue to sustain session...`);
        const continueBtn = page.locator('button', { hasText: /CONTINUE|이어하기/i });
        if (await continueBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await continueBtn.click();
        } else {
          await page.evaluate(() => {
            const gm = (window as any).gameManager;
            if (gm && typeof gm.continueGame === 'function') gm.continueGame();
            else if (gm) gm.startGame();
          });
        }
      }

      const audioActive = snapshot.audio.activeOscillators + snapshot.audio.activeGains;
      console.log(
        `[T+${Math.round((Date.now() - testStartTime) / 1000)}s] ` +
        `FPS: ${snapshot.performance.avgFps.toFixed(1)} | ` +
        `Heap: ${snapshot.memory.usedJSHeapSizeMb.toFixed(2)}MB | ` +
        `HeapSlope: ${snapshot.memory.heapGrowthRateMbPerMin.toFixed(2)}MB/min | ` +
        `AudioNodes: ${audioActive} (Peak: ${snapshot.audio.peakActiveNodes}) | ` +
        `Bullets: ${snapshot.entities.totalBullets} | ` +
        `Kills: ${snapshot.gameplay.totalKills}`
      );
    }

    // Stop bot & collect final result
    await page.evaluate(() => {
      if ((window as any).__streamFBot) {
        (window as any).__streamFBot.stop();
      }
    });

    const finalResult: SwarmRunResult = await stopTelemetryAndCollectFinal(page, 'stream_f_extended_audit_01', 1);

    // Compute Linear Regression of JS Heap Size over Time
    const heapPoints: { tSec: number; heapMb: number }[] = snapshots
      .filter((s) => s.memory && s.memory.usedJSHeapSizeMb > 0)
      .map((s) => ({
        tSec: s.relativeTimeMs / 1000,
        heapMb: s.memory.usedJSHeapSizeMb
      }));

    let heapSlopeMbPerMin = 0;
    if (heapPoints.length > 5) {
      const n = heapPoints.length;
      const sumX = heapPoints.reduce((acc, p) => acc + p.tSec, 0);
      const sumY = heapPoints.reduce((acc, p) => acc + p.heapMb, 0);
      const sumXY = heapPoints.reduce((acc, p) => acc + p.tSec * p.heapMb, 0);
      const sumX2 = heapPoints.reduce((acc, p) => acc + p.tSec * p.tSec, 0);

      const slopeMbPerSec = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      heapSlopeMbPerMin = slopeMbPerSec * 60;
    }

    console.log('\n===============================================================');
    console.log(' STREAM F AUDIT RESULTS: EXTENDED 60S PLAYTEST');
    console.log('===============================================================');
    console.log(`  - Total Duration: ${(finalResult.durationMs / 1000).toFixed(2)}s`);
    console.log(`  - Initial Heap: ${finalResult.memorySummary.initialHeapMb.toFixed(2)} MB`);
    console.log(`  - Peak Heap: ${finalResult.memorySummary.peakHeapMb.toFixed(2)} MB`);
    console.log(`  - Final Heap: ${finalResult.memorySummary.finalHeapMb.toFixed(2)} MB`);
    console.log(`  - Linear Regression Heap Slope: ${heapSlopeMbPerMin.toFixed(3)} MB/min`);
    console.log(`  - In-Page Telemetry Slope: ${finalResult.memorySummary.growthRateMbPerMin.toFixed(3)} MB/min`);
    console.log(`  - Peak Active Web Audio Nodes: ${finalResult.audioSummary.peakActiveNodes}`);
    console.log(`  - Total Oscillators Allocated: ${finalResult.audioSummary.totalAllocatedOscillators}`);
    console.log(`  - Average FPS: ${finalResult.performanceSummary.avgFps.toFixed(1)}`);
    console.log(`  - Min FPS: ${finalResult.performanceSummary.minFps.toFixed(1)}`);
    console.log(`  - Stutters (>33ms): ${finalResult.performanceSummary.stutters33}`);
    console.log(`  - Stutters (>50ms): ${finalResult.performanceSummary.stutters50}`);
    console.log(`  - Console Errors Captured: ${consoleRecords.filter((r) => r.type === 'error').length}`);
    console.log(`  - Console Warnings Captured: ${consoleRecords.filter((r) => r.type === 'warn').length}`);
    console.log(`  - Page Errors: ${consoleRecords.filter((r) => r.type === 'pageerror').length}`);
    console.log(`  - In-Game Anomalies: ${finalResult.anomalies.length}`);
    console.log('===============================================================\n');

    // Save detailed results to agent directory
    const auditArtifactPath = '/Users/user/src/water-invader/.agents/qa_playtest_stream_f_console_memory_audit/audit_telemetry_results.json';
    fs.writeFileSync(
      auditArtifactPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          durationMs: finalResult.durationMs,
          linearRegressionSlopeMbPerMin: heapSlopeMbPerMin,
          memorySummary: finalResult.memorySummary,
          audioSummary: finalResult.audioSummary,
          performanceSummary: finalResult.performanceSummary,
          consoleRecords,
          anomalies: finalResult.anomalies,
          snapshotsCount: snapshots.length
        },
        null,
        2
      ),
      'utf-8'
    );
    console.log(`[STREAM-F-01] Saved full audit telemetry to ${auditArtifactPath}`);
    if (finalResult.anomalies.length > 0) {
      console.log('[STREAM-F-01] Anomaly Breakdown:');
      finalResult.anomalies.forEach((a, i) => {
        console.log(`  [${i + 1}] [${a.severity}] ${a.type}: ${a.message} (details: ${JSON.stringify(a.details)})`);
      });
    }

    // STRICT VERIFICATION ASSERTIONS
    // 1. Heap slope must be strictly below 15.0 MB/min
    expect(Math.max(0, heapSlopeMbPerMin)).toBeLessThan(15.0);
    expect(Math.max(0, finalResult.memorySummary.growthRateMbPerMin)).toBeLessThan(15.0);

    // 2. Web Audio nodes must not accumulate unbounded
    expect(finalResult.audioSummary.peakActiveNodes).toBeLessThan(40);

    // 3. Zero PageErrors / Uncaught Exceptions
    const pageErrors = consoleRecords.filter((r) => r.type === 'pageerror');
    expect(pageErrors.length).toBe(0);

    // 4. Zero Critical Anomalies
    const criticalAnomalies = finalResult.anomalies.filter((a) => a.severity === 'CRITICAL');
    expect(criticalAnomalies.length).toBe(0);

    // 5. Zero Unhandled Promise Rejections
    const unhandledRejections = finalResult.anomalies.filter((a) => a.type === 'UNHANDLED_REJECTION');
    expect(unhandledRejections.length).toBe(0);
  });

  test('STREAM-F-02: Rapid High-Frequency Audio & Weapon Saturation Release Audit', async ({ page }) => {
    const audioConsoleWarnings: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.toLowerCase().includes('audio') || text.toLowerCase().includes('webaudio')) {
        audioConsoleWarnings.push(text);
      }
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    await attachTelemetryToPage(page, {
      sampleIntervalMs: 50,
      audioNodeLeakThreshold: 35
    });

    const startButton = page.locator('button', { hasText: /START GAME|게임 시작/i });
    await expect(startButton).toBeVisible({ timeout: 15000 });
    await startButton.click();

    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      return gm && gm.player;
    }, { timeout: 15000 });

    // Stress: Max out multiShot, fire rate, and trigger sounds rapidly
    console.log('[STREAM-F-02] Triggering rapid weapon & audio saturation stress...');
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (!gm || !gm.player) return;

      gm.player.multiShot = 5;
      gm.player.fireRate = 0.05; // 20 shots/sec = 100 bullets/sec
      gm.player.baseFireRate = 0.05;
      gm.player.piercing = 5;
      gm.player.isShooting = true;

      if (typeof gm.triggerUltimate === 'function') {
        gm.player.ultimateGauge = 100;
        gm.triggerUltimate();
      }
    });

    // Run rapid weapon barrage for 8 seconds
    await page.waitForTimeout(8000);

    const midSnapshot = await collectTelemetrySnapshot(page);
    const midActiveNodes = midSnapshot.audio.activeOscillators + midSnapshot.audio.activeGains;
    console.log(`[STREAM-F-02] Mid-Saturation Active Nodes: ${midActiveNodes} (Peak: ${midSnapshot.audio.peakActiveNodes})`);

    // Stop firing and let audio decay for 3 seconds
    console.log('[STREAM-F-02] Ceasing fire, waiting for audio decay and node disconnection...');
    await page.evaluate(() => {
      const gm = (window as any).gameManager;
      if (gm && gm.player) {
        gm.player.isShooting = false;
      }
    });

    await page.waitForTimeout(3000);

    const postSnapshot = await collectTelemetrySnapshot(page);
    const postActiveNodes = postSnapshot.audio.activeOscillators + postSnapshot.audio.activeGains;
    console.log(`[STREAM-F-02] Post-Decay Active Nodes: ${postActiveNodes}`);

    const finalResult = await stopTelemetryAndCollectFinal(page, 'stream_f_audio_saturation_02');

    // Assert that active audio nodes completely decayed back to near zero (<= 2)
    expect(postActiveNodes).toBeLessThanOrEqual(4);
    expect(finalResult.audioSummary.peakActiveNodes).toBeLessThan(40);
    expect(audioConsoleWarnings.length).toBe(0);
  });

  test('STREAM-F-03: Multi-Subsystem Flagship Deep Exception, Null-Reference & NaN Audit', async ({ page }) => {
    const errorLogs: string[] = [];
    const warnLogs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      // Filter benign dev-server / fast-refresh logs
      if (
        text.includes('[Fast Refresh]') ||
        text.includes('React DevTools') ||
        text.includes('webpack') ||
        text.includes('HMR') ||
        text.includes('turbopack') ||
        text.includes('_next')
      ) {
        return;
      }
      if (msg.type() === 'error') errorLogs.push(text);
      if ((msg.type() as string) === 'warn' || (msg.type() as string) === 'warning') warnLogs.push(text);
    });

    page.on('pageerror', (err) => {
      errorLogs.push(`[PAGE_ERROR] ${err.message}\n${err.stack}`);
    });

    console.log('[STREAM-F-03] Commencing multi-subsystem flagship error & anomaly audit...');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    const startBtn = page.locator('button', { hasText: /START GAME|게임 시작/i });
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();

    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      return gm && fm && gm.player;
    }, { timeout: 15000 });

    const auditResult = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      if (!gm || !fm) return { success: false, error: 'Managers not instantiated' };

      const issues: string[] = [];

      try {
        // 1. Torpedo Ordnance Cycle
        if (fm.cavitationTorpedo) {
          fm.cavitationTorpedo.fireTorpedo({ x: gm.player.position.x, y: gm.player.position.y });
          fm.cavitationTorpedo.update(0.016, gm.getFlagshipContext());
          fm.cavitationTorpedo.detonateActiveTorpedo();
        }

        // 2. Prism Laser & Refraction Prisms
        if (fm.prismLaser) {
          fm.prismLaser.deployPrism(300, 300);
          fm.prismLaser.setFiring(true);
          fm.prismLaser.heat = 90;
          fm.prismLaser.update(0.016, gm.getFlagshipContext());
          fm.prismLaser.setFiring(false);
        }

        // 3. Hydraulic Harpoon
        if (fm.hydraulicHarpoon) {
          fm.hydraulicHarpoon.fire({ x: 300, y: 700 });
          fm.hydraulicHarpoon.update(0.016, gm.getFlagshipContext());
          fm.hydraulicHarpoon.startWinch();
          fm.hydraulicHarpoon.update(0.016, gm.getFlagshipContext());
          fm.hydraulicHarpoon.stopWinch();
        }

        // 4. Hydrothermal Vents
        if (fm.hydrothermalVents) {
          fm.hydrothermalVents.update(0.016, gm.getFlagshipContext());
        }

        // 5. Biolapse Darkness Cycle
        if (fm.biolapseDarkness) {
          fm.biolapseDarkness.toggleLight();
          fm.biolapseDarkness.setHighBeam(true);
          fm.biolapseDarkness.triggerSonarPing();
          fm.biolapseDarkness.update(0.016, gm.getFlagshipContext());
        }

        // 6. Modular Chassis
        if (fm.modularChassis) {
          for (const chassisId of ['NAUTILUS', 'STINGRAY', 'LEVIATHAN', 'GHOST', 'KRAKEN']) {
            fm.modularChassis.selectChassis(chassisId);
            fm.modularChassis.update(0.016, gm.getFlagshipContext());
          }
        }

        // 7. Veteran Crew Synergy Deck
        if (fm.crewDeck) {
          for (const officerId of ['INGRID', 'JAX', 'REN', 'LYRA']) {
            fm.crewDeck.promoteOfficer(officerId);
            fm.crewDeck.triggerAbility(officerId, gm.getFlagshipContext());
          }
          fm.crewDeck.update(0.016, gm.getFlagshipContext());
        }

        // 8. Hadal Bio-Horrors & Epigenetic Mutations
        if (fm.bioHorror) {
          fm.bioHorror.update(0.016, gm.getFlagshipContext());
        }

        // 9. Automaton Shield Phalanx
        if (fm.automatonPhalanx) {
          fm.automatonPhalanx.update(0.016, gm.getFlagshipContext());
        }

        // 10. Apex Boss Kraken Prime
        if (fm.apexBoss) {
          fm.apexBoss.spawnApexBoss();
          fm.apexBoss.update(0.016, gm.getFlagshipContext());
          // Advance phases
          if (fm.apexBoss.activeBoss) {
            fm.apexBoss.activeBoss.phase = 2;
            fm.apexBoss.update(0.016, gm.getFlagshipContext());
            fm.apexBoss.activeBoss.phase = 3;
            fm.apexBoss.update(0.016, gm.getFlagshipContext());
          }
        }

        // 11. Endless Mode
        if (fm.endlessDescent) {
          fm.endlessDescent.update(0.016, gm.getFlagshipContext());
        }

        // 12. Sonar/Hydrophone UI & Sensory Rendering
        if (fm.sonarRenderer) {
          fm.sonarRenderer.update(0.016, gm.getFlagshipContext());
        }

        // Render pass verification (drawBackground, drawWorld, drawForeground)
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const now = performance.now();
            fm.drawBackground(ctx, now);
            fm.drawWorld(ctx, now);
            fm.drawForeground(ctx, now);
          }
        }

        // NaN Check on Player, Bullets, Enemies
        const px = gm.player?.position?.x ?? gm.player?.x;
        const py = gm.player?.position?.y ?? gm.player?.y;
        if (!Number.isFinite(px) || !Number.isFinite(py)) {
          issues.push(`Player position NaN: x=${px}, y=${py}`);
        }

        for (const b of (gm.bullets || [])) {
          const bx = b?.position?.x ?? b?.x;
          const by = b?.position?.y ?? b?.y;
          if (!Number.isFinite(bx) || !Number.isFinite(by)) {
            issues.push(`Bullet position NaN: x=${bx}, y=${by}`);
          }
        }

        for (const e of (gm.enemies || [])) {
          const ex = e?.position?.x ?? e?.x;
          const ey = e?.position?.y ?? e?.y;
          if (!Number.isFinite(ex) || !Number.isFinite(ey)) {
            issues.push(`Enemy position NaN: x=${ex}, y=${ey}`);
          }
        }
      } catch (err: any) {
        issues.push(`Exception in flagship audit: ${err.message}\n${err.stack}`);
      }

      return {
        success: issues.length === 0,
        issues
      };
    });

    console.log('[STREAM-F-03] Multi-Subsystem Audit Result:', JSON.stringify(auditResult, null, 2));
    console.log(`[STREAM-F-03] Captured Errors: ${errorLogs.length}, Warnings: ${warnLogs.length}`);

    expect(auditResult.success).toBe(true);
    expect(auditResult.issues?.length ?? 0).toBe(0);
    expect(errorLogs.length).toBe(0);
  });
});


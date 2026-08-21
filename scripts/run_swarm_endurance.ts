import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  attachTelemetryToPage,
  collectTelemetrySnapshot,
  stopTelemetryAndCollectFinal,
  generateStressReportData,
  SwarmRunResult,
  TelemetrySnapshot
} from '../tests/stress/telemetry_stress_collector';

/**
 * Water Invader Standalone Multi-Context Swarm Endurance Runner
 * 
 * Executes massive parallel bot swarms under real-time telemetry monitoring,
 * live terminal dashboard updates, and aggregate statistical reporting.
 */

// Parse CLI arguments
const args = process.argv.slice(2);
let workerCount = 4;
let maxDurationSec = 60;
let maxWavesTarget = 20;
let targetUrl = process.env.TARGET_URL || 'https://water-invader.vercel.app';
let outputFilePath = path.resolve(process.cwd(), 'test-artifacts/stress_results.json');
let isHeadless = true;

for (const arg of args) {
  if (arg.startsWith('--workers=')) {
    workerCount = Math.max(1, parseInt(arg.split('=')[1], 10) || 4);
  } else if (arg.startsWith('--duration=')) {
    maxDurationSec = Math.max(5, parseInt(arg.split('=')[1], 10) || 60);
  } else if (arg.startsWith('--max-waves=')) {
    maxWavesTarget = Math.max(1, parseInt(arg.split('=')[1], 10) || 20);
  } else if (arg.startsWith('--url=')) {
    targetUrl = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    outputFilePath = path.resolve(process.cwd(), arg.split('=')[1]);
  } else if (arg.startsWith('--headless=')) {
    isHeadless = arg.split('=')[1].toLowerCase() !== 'false';
  }
}

const IN_PAGE_SWARM_BOT_SCRIPT = `
(function() {
  var gm = window.gameManager;
  if (!gm) return;

  var bot = (function() {
    var isRunning = false;
    var intervalId = null;

    function runTick() {
      if (!gm || (gm.state !== 1 && gm.state !== 'PLAYING')) return;
      var player = gm.player;
      if (!player) return;

      var canvasWidth = gm.logicalWidth || 600;
      var playerX = player.position ? player.position.x : player.x;
      var playerY = player.position ? player.position.y : player.y;
      var playerWidth = player.size ? player.size.width : (player.width || 50);
      var playerCenterX = playerX + playerWidth / 2;

      var enemyBullets = (gm.bullets || []).filter(function(b) { return b && !b.isPlayerBullet && !b.isDead; });
      var activeEnemies = (gm.enemies || []).filter(function(e) { return e && !e.isDead && (e.hp === undefined || e.hp > 0); });
      var activeBarricades = (gm.barricades || []).filter(function(b) { return b && !b.isDead && (b.type === 1 || b.hp > 0); });

      // 1. Target selection
      var bestTargetX = canvasWidth / 2;
      if (activeEnemies.length > 0) {
        var highestPriority = -Infinity;
        var selectedEnemy = activeEnemies[0];

        for (var i = 0; i < activeEnemies.length; i++) {
          var enemy = activeEnemies[i];
          var priority = 0;
          var ex = enemy.position ? enemy.position.x : enemy.x;
          var ey = enemy.position ? enemy.position.y : enemy.y;
          var ew = enemy.size ? enemy.size.width : (enemy.width || 40);
          var enemyCenterX = ex + ew / 2;

          if (ey > 500) priority += 1500 + ey;
          else if (ey > 450) priority += 1000 + ey;

          if (enemy.type === 4 || enemy.isDiving) priority += 900;
          if (enemy.type === 2) priority += 750;
          if (enemy.type === 3) priority += 600;

          var distFromCurrent = Math.abs(enemyCenterX - playerCenterX);
          priority -= distFromCurrent * 0.4;
          priority += ey * 0.8;

          if (priority > highestPriority) {
            highestPriority = priority;
            selectedEnemy = enemy;
          }
        }

        var sex = selectedEnemy.position ? selectedEnemy.position.x : selectedEnemy.x;
        var sew = selectedEnemy.size ? selectedEnemy.size.width : (selectedEnemy.width || 40);
        bestTargetX = sex + sew / 2 - playerWidth / 2;
        bestTargetX = Math.max(10, Math.min(canvasWidth - playerWidth - 10, bestTargetX));
      }

      // 2. 1D Potential Field Evasion Solver
      var gridStep = 5;
      var maxCandidateX = Math.max(0, canvasWidth - playerWidth);
      var minCost = Infinity;
      var bestCandidateX = playerX;

      for (var cx = 0; cx <= maxCandidateX; cx += gridStep) {
        var candidateCenterX = cx + playerWidth / 2;
        var dangerScore = 0;

        for (var bi = 0; bi < enemyBullets.length; bi++) {
          var bullet = enemyBullets[bi];
          var bx = bullet.position ? bullet.position.x : bullet.x;
          var by = bullet.position ? bullet.position.y : bullet.y;
          var bvx = bullet.velocity ? bullet.velocity.x : (bullet.vx || 0);
          var bvy = bullet.velocity ? bullet.velocity.y : (bullet.vy || 200);
          if (bvy <= 0) continue;

          var tti = (playerY - by) / bvy;
          if (tti < 0 || tti > 2.0) continue;

          var predictedImpactX = bx + bvx * tti;
          var distX = Math.abs(candidateCenterX - predictedImpactX);
          if (distX >= 80) continue;

          // Barricade Shadowing
          var shadowMultiplier = 1.0;
          for (var bari = 0; bari < activeBarricades.length; bari++) {
            var bar = activeBarricades[bari];
            var barY = bar.position ? bar.position.y : bar.y;
            var barX = bar.position ? bar.position.x : bar.x;
            var barW = bar.size ? bar.size.width : (bar.width || 60);
            var ttiBar = (barY - by) / bvy;
            if (ttiBar > 0 && ttiBar < tti) {
              var barImpactX = bx + bvx * ttiBar;
              if (barImpactX >= barX - 5 && barImpactX <= barX + barW + 5) {
                if (bar.type === 1) shadowMultiplier = 0.02;
                else if (bar.type === 0 && bar.hp > 0) shadowMultiplier = 0.2;
                break;
              }
            }
          }

          var timeUrgency = 1500 / (tti + 0.05);
          var spatialWeight = Math.exp(-(distX * distX) / 2048);
          dangerScore += timeUrgency * spatialWeight * shadowMultiplier;
        }

        for (var ei = 0; ei < activeEnemies.length; ei++) {
          var enemy = activeEnemies[ei];
          if (enemy.type === 4 || enemy.isDiving) {
            var ex = enemy.position ? enemy.position.x : enemy.x;
            var ey = enemy.position ? enemy.position.y : enemy.y;
            var ew = enemy.size ? enemy.size.width : (enemy.width || 40);
            var diverCenterX = ex + ew / 2;
            var diverDistX = Math.abs(candidateCenterX - diverCenterX);
            if (diverDistX < 60) {
              var verticalDist = playerY - ey;
              if (verticalDist > 0 && verticalDist < 500) {
                var diverDanger = 3000 * Math.exp(-(diverDistX * diverDistX) / 4050);
                dangerScore += diverDanger;
              }
            }
          }
        }

        var offensiveCost = Math.abs(cx - bestTargetX) * 1.2;
        var moveDistanceCost = Math.abs(cx - playerX) * 0.3;
        var edgePenalty = 0;
        if (cx < 30) edgePenalty += (30 - cx) * 15;
        if (cx > maxCandidateX - 30) edgePenalty += (cx - (maxCandidateX - 30)) * 15;

        var totalCost = dangerScore * 10.0 + offensiveCost + moveDistanceCost + edgePenalty;
        if (totalCost < minCost) {
          minCost = totalCost;
          bestCandidateX = cx;
        }
      }

      // 3. Movement Action Dispatch
      var deadZone = 6;
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

      player.isShooting = true;

      // Economy Auto-Buyer (Priority: Fire Rate -> Multi-Shot -> Piercing)
      var canUpgrade = true;
      var iters = 0;
      while (canUpgrade && iters++ < 5) {
        canUpgrade = false;
        var curr = gm.currency || 0;
        var pFr = player.fireRate !== undefined ? player.fireRate : player.baseFireRate;
        if (curr >= 50 && pFr > 0.1 && typeof gm.upgradeFireRate === 'function') {
          var prev = gm.currency;
          gm.upgradeFireRate();
          if (gm.currency < prev) { canUpgrade = true; continue; }
        }
        var pMs = player.multiShot || 1;
        if (curr >= 100 && pMs < 5 && typeof gm.upgradeMultiShot === 'function') {
          var prev = gm.currency;
          gm.upgradeMultiShot();
          if (gm.currency < prev) { canUpgrade = true; continue; }
        }
        var pPc = player.piercing || 1;
        if (curr >= 200 && pPc < 20 && typeof gm.upgradePiercing === 'function') {
          var prev = gm.currency;
          gm.upgradePiercing();
          if (gm.currency < prev) { canUpgrade = true; continue; }
        }
      }

      // Skills Dispatch
      var hasBoss = activeEnemies.some(function(e) { return e.type === 2; });
      if (player.ultimateGauge >= 100 && (activeEnemies.length >= 3 || hasBoss) && typeof gm.triggerUltimate === 'function') {
        gm.triggerUltimate();
      }

      if (gm.currency >= 50 && (activeEnemies.some(function(e) { return (e.position ? e.position.y : e.y) > 450; }) || (player.multiShot >= 3 && gm.currency >= 150)) && typeof gm.triggerSummonAlly === 'function') {
        gm.triggerSummonAlly();
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

  window.__swarmBotRunner = bot;
  bot.start();
})();
`;

interface WorkerStatus {
  workerId: number;
  status: 'STARTING' | 'PLAYING' | 'WAVE_CLEAR' | 'GAME_OVER' | 'COMPLETED' | 'ERROR';
  wave: number;
  hp: number;
  maxHp: number;
  score: number;
  currency: number;
  upgrades: { fireRate: number; multiShot: number; piercing: number };
  fps: number;
  heapMb: number;
  lastUpdateMs: number;
  error?: string;
}

const workerStatuses: Map<number, WorkerStatus> = new Map();

for (let i = 1; i <= workerCount; i++) {
  workerStatuses.set(i, {
    workerId: i,
    status: 'STARTING',
    wave: 1,
    hp: 3,
    maxHp: 5,
    score: 0,
    currency: 0,
    upgrades: { fireRate: 0, multiShot: 0, piercing: 0 },
    fps: 60,
    heapMb: 0,
    lastUpdateMs: Date.now()
  });
}

function renderTerminalDashboard(startTimeMs: number) {
  const elapsedSec = ((Date.now() - startTimeMs) / 1000).toFixed(1);
  const remainingSec = Math.max(0, maxDurationSec - parseFloat(elapsedSec)).toFixed(1);

  console.log(`\n--- [Swarm Endurance Dashboard] Elapsed: ${elapsedSec}s / ${maxDurationSec}s (Remaining: ${remainingSec}s) | Target Waves: ${maxWavesTarget} ---`);
  console.log('ID | Status   | Wave | HP   | Score   | Pure Water | Upgrades (FR/MS/P) | FPS   | Heap MB');
  console.log('---|----------|------|------|---------|------------|--------------------|-------|--------');

  for (let i = 1; i <= workerCount; i++) {
    const ws = workerStatuses.get(i)!;
    const idStr = String(ws.workerId).padStart(2, ' ');
    const statusStr = ws.status.padEnd(8, ' ');
    const waveStr = String(ws.wave).padStart(4, ' ');
    const hpStr = `${ws.hp}/${ws.maxHp}`.padStart(4, ' ');
    const scoreStr = String(ws.score).padStart(7, ' ');
    const currStr = `${ws.currency}💧`.padStart(10, ' ');
    const upgStr = `FR:${ws.upgrades.fireRate} MS:${ws.upgrades.multiShot} P:${ws.upgrades.piercing}`.padEnd(18, ' ');
    const fpsStr = ws.fps.toFixed(1).padStart(5, ' ');
    const heapStr = ws.heapMb > 0 ? `${ws.heapMb.toFixed(1)}MB`.padStart(7, ' ') : '  N/A  ';

    console.log(`${idStr} | ${statusStr} | ${waveStr} | ${hpStr} | ${scoreStr} | ${currStr} | ${upgStr} | ${fpsStr} | ${heapStr}`);
  }
}

async function runWorkerSession(
  browser: Browser,
  workerId: number,
  maxDurationMs: number
): Promise<SwarmRunResult> {
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page: Page = await context.newPage();

  const ws = workerStatuses.get(workerId)!;

  try {
    ws.status = 'STARTING';
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

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
      await page.evaluate('if (window.gameManager) { window.gameManager.init(); window.gameManager.startGame(); }');
    }

    await page.waitForTimeout(400);

    // Inject SwarmBotEngine as raw JS string
    await page.evaluate(IN_PAGE_SWARM_BOT_SCRIPT);

    ws.status = 'PLAYING';

    const sessionStart = Date.now();
    let isGameOver = false;

    while (Date.now() - sessionStart < maxDurationMs && !isGameOver) {
      await page.waitForTimeout(100);

      try {
        const snap: TelemetrySnapshot = await collectTelemetrySnapshot(page);
        ws.wave = snap.gameplay.wave;
        ws.hp = snap.player.hp;
        ws.maxHp = snap.player.maxHp;
        ws.score = snap.gameplay.score;
        ws.currency = snap.gameplay.currency;
        ws.upgrades = {
          fireRate: snap.gameplay.upgradesPurchased.fireRate,
          multiShot: snap.gameplay.upgradesPurchased.multiShot,
          piercing: snap.gameplay.upgradesPurchased.piercing
        };
        ws.fps = snap.performance.avgFps;
        ws.heapMb = snap.memory.usedJSHeapSizeMb;
        ws.lastUpdateMs = Date.now();

        if (snap.gameplay.gameState === 2 || snap.gameplay.gameState === 'GAME_OVER') {
          ws.status = 'GAME_OVER';
          isGameOver = true;
        } else if (snap.gameplay.wave >= maxWavesTarget) {
          ws.status = 'COMPLETED';
          break;
        } else {
          ws.status = 'PLAYING';
        }
      } catch (err) {
        break;
      }
    }

    // Stop in-page bot
    await page.evaluate('if (window.__swarmBotRunner) { window.__swarmBotRunner.stop(); }').catch(() => {});

    const result = await stopTelemetryAndCollectFinal(page, `swarm_worker_${workerId}`, workerId);
    if (ws.status !== 'GAME_OVER') {
      ws.status = 'COMPLETED';
    }
    return result;
  } catch (err: any) {
    ws.status = 'ERROR';
    ws.error = err.message;
    throw err;
  } finally {
    await context.close().catch(() => {});
  }
}

async function main() {
  console.log('=======================================================');
  console.log('  Water Invader Swarm Endurance Stress Test Runner     ');
  console.log('=======================================================');
  console.log(` Target URL:        ${targetUrl}`);
  console.log(` Workers (Threads): ${workerCount}`);
  console.log(` Duration Cap:      ${maxDurationSec}s`);
  console.log(` Target Waves Cap:  ${maxWavesTarget}`);
  console.log(` Headless Mode:     ${isHeadless}`);
  console.log(` Output JSON Path:  ${outputFilePath}`);
  console.log('=======================================================\n');

  const browser = await chromium.launch({
    headless: isHeadless,
    args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox']
  });

  const startTimeMs = Date.now();
  const maxDurationMs = maxDurationSec * 1000;

  // Terminal live dashboard interval
  const dashboardInterval = setInterval(() => {
    renderTerminalDashboard(startTimeMs);
  }, 1000);

  try {
    const workerPromises = Array.from({ length: workerCount }, (_, i) => {
      const workerId = i + 1;
      return runWorkerSession(browser, workerId, maxDurationMs);
    });

    const results = await Promise.allSettled(workerPromises);
    clearInterval(dashboardInterval);

    // Final dashboard render
    renderTerminalDashboard(startTimeMs);

    const successfulRuns: SwarmRunResult[] = [];
    results.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        successfulRuns.push(res.value);
      } else {
        console.error(`[Worker ${idx + 1}] Encountered error:`, res.reason);
      }
    });

    if (successfulRuns.length === 0) {
      throw new Error('All worker sessions failed to complete.');
    }

    const reportData = generateStressReportData(successfulRuns, {
      title: 'Water Invader Endless Survival Swarm Stress Test Report',
      totalWorkers: workerCount,
      configuration: {
        targetUrl,
        workerCount,
        maxDurationSec,
        maxWavesTarget,
        isHeadless
      }
    });

    // Save JSON artifact
    const dir = path.dirname(outputFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFilePath, JSON.stringify(reportData, null, 2), 'utf-8');

    console.log('\n=======================================================');
    console.log('  Swarm Endurance Stress Run Summary Report            ');
    console.log('=======================================================');
    console.log(` Total Completed Runs:      ${reportData.summary.totalRuns} / ${workerCount}`);
    console.log(` Mean Survival Duration:    ${(reportData.summary.survivalTime.avgMs / 1000).toFixed(2)}s (Median: ${(reportData.summary.survivalTime.medianMs / 1000).toFixed(2)}s)`);
    console.log(` 95% Confidence Interval:   [${(reportData.summary.survivalTime.ci95LowerMs / 1000).toFixed(2)}s, ${(reportData.summary.survivalTime.ci95UpperMs / 1000).toFixed(2)}s]`);
    console.log(` Mean Wave Reached:         ${reportData.summary.waveStats.avgWave} (Max Wave: ${reportData.summary.waveStats.maxWave})`);
    console.log(` Average Score:             ${reportData.summary.combatStats.avgScore}`);
    console.log(` Average Accuracy:          ${reportData.summary.combatStats.avgAccuracy}%`);
    console.log(` Overall Average FPS:       ${reportData.summary.performanceStats.overallAvgFps} (Min FPS: ${reportData.summary.performanceStats.overallMinFps})`);
    console.log(` Average 1% Low FPS:        ${reportData.summary.performanceStats.avg1PercentLowFps}`);
    console.log(` Max Peak Heap:             ${reportData.summary.memoryStats.maxPeakHeapMb} MB`);
    console.log(` Memory Leak Detected:      ${reportData.summary.memoryStats.memoryLeakDetected}`);
    console.log(` Weapon Maxed Rates:        FireRate: ${reportData.summary.weaponEvolution.fireRateMaxedRate}%, MultiShot: ${reportData.summary.weaponEvolution.multiShotMaxedRate}%, Piercing: ${reportData.summary.weaponEvolution.piercingPurchasedRate}%`);
    console.log(` Avg Ultimates Cast:        ${reportData.summary.combatStats.avgUltimatesCast}`);
    console.log(` Avg Allies Summoned:       ${reportData.summary.combatStats.avgAlliesSummoned}`);
    console.log(` Crash-Free Rate:           ${reportData.summary.anomalySummary.crashFreePercentage}%`);
    console.log(` Results exported to:       ${outputFilePath}`);
    console.log('=======================================================\n');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Fatal Swarm Endurance Runner Error:', err);
  process.exit(1);
});

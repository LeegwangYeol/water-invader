import { chromium, Browser, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { RunTelemetry, BenchmarkReport, computeSummaryStatistics } from '../tests/benchmark/telemetry_collector';

const args = process.argv.slice(2);
let totalRuns = 10;
let targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
let outputFilePath = path.resolve(process.cwd(), 'tests/benchmark/baseline_results.json');
let targetName: 'baseline' | 'rebalanced' = 'baseline';

for (const arg of args) {
  if (arg.startsWith('--runs=')) {
    totalRuns = parseInt(arg.split('=')[1], 10) || 10;
  } else if (arg.startsWith('--url=')) {
    targetUrl = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    outputFilePath = path.resolve(process.cwd(), arg.split('=')[1]);
  } else if (arg.startsWith('--target=')) {
    targetName = (arg.split('=')[1] as 'baseline' | 'rebalanced') || 'baseline';
  }
}

console.log('=======================================================');
console.log(' Starting Water Invader Benchmark Harness');
console.log(' Target: ' + targetName.toUpperCase());
console.log(' URL: ' + targetUrl);
console.log(' Total Runs: ' + totalRuns);
console.log(' Output File: ' + outputFilePath);
console.log('=======================================================\n');

async function runSingleGame(browser: Browser, runIndex: number, maxTimeoutMs: number = 180000): Promise<RunTelemetry> {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 }
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 10000 });

    const telemetry = await page.evaluate(async (params) => {
      const { runIndex, maxTimeoutMs } = params;

      return new Promise<RunTelemetry>((resolve) => {
        const game = (window as any).gameManager;
        if (!game) {
          throw new Error('window.gameManager not found');
        }

        let shotsFiredCount = 0;
        let shotsHitCount = 0;
        let totalDamageTaken = 0;
        const killBreakdown: Record<string, number> = {
          NORMAL: 0,
          ZIGZAG: 0,
          BOSS: 0,
          SNIPER: 0,
          DIVER: 0,
          SHIELDED: 0,
          SPLITTER: 0
        };

        const waveHistory: Array<{ wave: number; durationMs: number; kills: number; damageTaken: number }> = [];
        let currentWave = 1;
        let waveStartTime = performance.now();
        let waveKills = 0;
        let waveDamage = 0;
        let lastPlayerHp = game.player.hp;

        const origOnHpChange = game.onPlayerHpChange;
        game.onPlayerHpChange = (hp: number) => {
          if (hp < lastPlayerHp) {
            const diff = lastPlayerHp - hp;
            totalDamageTaken += diff;
            waveDamage += diff;
          }
          lastPlayerHp = hp;
          if (origOnHpChange) origOnHpChange(hp);
        };

        const origHandleEnemyKill = game.handleEnemyKill.bind(game);
        game.handleEnemyKill = () => {
          waveKills++;
          shotsHitCount++;
          origHandleEnemyKill();
        };

        const origPlayerFire = game.player.fire.bind(game.player);
        game.player.fire = () => {
          const bullets = origPlayerFire();
          if (bullets && bullets.length > 0) {
            shotsFiredCount += bullets.length;
          }
          return bullets;
        };

        game.init();
        lastPlayerHp = game.player.hp;
        const startTime = performance.now();
        game.startGame();

        let botInterval: any = null;
        let isDone = false;

        const finalizeTelemetry = (causeOverride?: 'TIME_CAP_SURVIVED') => {
          if (isDone) return;
          isDone = true;
          if (botInterval) clearInterval(botInterval);

          const endTime = performance.now();
          const durationMs = endTime - startTime;

          waveHistory.push({
            wave: currentWave,
            durationMs: endTime - waveStartTime,
            kills: waveKills,
            damageTaken: waveDamage
          });

          let cause: 'ENEMY_BULLET' | 'DIVER_COLLISION' | 'DEFENSE_BREACH' | 'TIME_CAP_SURVIVED' = 'ENEMY_BULLET';
          const reason = game.gameOverReason || '';

          if (causeOverride === 'TIME_CAP_SURVIVED') {
            cause = 'TIME_CAP_SURVIVED';
          } else if (reason.includes('돌파')) {
            cause = 'DEFENSE_BREACH';
          } else if (reason.includes('정수기능이 파괴')) {
            cause = 'DIVER_COLLISION';
          } else {
            cause = 'ENEMY_BULLET';
          }

          const accuracy = shotsFiredCount > 0 ? (shotsHitCount / shotsFiredCount) * 100 : 0;
          const totalKills = Object.values(killBreakdown).reduce((a, b) => a + b, 0) + waveKills;

          const result: RunTelemetry = {
            runId: 'run_' + String(runIndex).padStart(2, '0'),
            timestamp: new Date().toISOString(),
            durationMs: Math.round(durationMs),
            waveReached: game.level,
            score: game.score,
            currency: game.currency,
            shotsFired: shotsFiredCount,
            shotsHit: shotsHitCount,
            accuracy: Math.round(accuracy * 10) / 10,
            totalKills,
            killBreakdown,
            damageTaken: totalDamageTaken,
            causeOfDeath: cause,
            rawGameOverReason: reason,
            waveHistory
          };

          resolve(result);
        };

        botInterval = setInterval(() => {
          if (game.state === 2 /* GAME_OVER */) {
            finalizeTelemetry();
            return;
          }

          if (game.state !== 1 /* PLAYING */) {
            return;
          }

          if (game.level !== currentWave) {
            const now = performance.now();
            waveHistory.push({
              wave: currentWave,
              durationMs: now - waveStartTime,
              kills: waveKills,
              damageTaken: waveDamage
            });
            currentWave = game.level;
            waveStartTime = now;
            waveKills = 0;
            waveDamage = 0;
          }

          if (performance.now() - startTime > maxTimeoutMs) {
            game.state = 2;
            finalizeTelemetry('TIME_CAP_SURVIVED');
            return;
          }

          // Heuristic Potential Field Evaluation
          const canvasWidth = 600;
          const player = game.player;
          const playerX = player.position.x;
          const playerY = player.position.y;
          const playerWidth = player.size.width;
          const playerCenterX = playerX + playerWidth / 2;

          const enemyBullets = game.bullets.filter((b: any) => !b.isPlayerBullet && !b.isDead);
          const activeEnemies = game.enemies.filter((e: any) => !e.isDead && e.hp > 0);
          const activeBarricades = game.barricades.filter((b: any) => !b.isDead);

          let bestTargetX = canvasWidth / 2;
          if (activeEnemies.length > 0) {
            let highestPriority = -Infinity;
            let selectedEnemy = activeEnemies[0];

            for (const enemy of activeEnemies) {
              let priority = 0;
              const enemyCenterX = enemy.position.x + enemy.size.width / 2;

              if (enemy.position.y > 500) priority += 1200 + enemy.position.y;
              if (enemy.type === 4 || enemy.isDiving) priority += 800;
              if (enemy.type === 3) priority += 500;
              if (enemy.type === 2) priority += 600;

              const distFromCurrent = Math.abs(enemyCenterX - playerCenterX);
              priority -= distFromCurrent * 0.4;
              priority += enemy.position.y * 0.8;

              if (priority > highestPriority) {
                highestPriority = priority;
                selectedEnemy = enemy;
              }
            }

            bestTargetX = selectedEnemy.position.x + selectedEnemy.size.width / 2 - playerWidth / 2;
            bestTargetX = Math.max(10, Math.min(canvasWidth - playerWidth - 10, bestTargetX));
          }

          const gridStep = 5;
          const maxCandidateX = canvasWidth - playerWidth;
          let minCost = Infinity;
          let bestCandidateX = playerX;

          for (let cx = 0; cx <= maxCandidateX; cx += gridStep) {
            const candidateCenterX = cx + playerWidth / 2;
            let dangerScore = 0;

            for (const bullet of enemyBullets) {
              const bulletVy = bullet.velocity?.y || 200;
              if (bulletVy <= 0) continue;

              const tti = (playerY - bullet.position.y) / bulletVy;
              if (tti < 0 || tti > 2.0) continue;

              const bulletVx = bullet.velocity?.x || 0;
              const predictedImpactX = bullet.position.x + bulletVx * tti;

              let shadowMultiplier = 1.0;
              const ttiBarricade = (650 - bullet.position.y) / bulletVy;
              if (ttiBarricade > 0 && ttiBarricade < tti) {
                const barImpactX = bullet.position.x + bulletVx * ttiBarricade;
                for (const bar of activeBarricades) {
                  if (barImpactX >= bar.position.x - 5 && barImpactX <= bar.position.x + bar.size.width + 5) {
                    if (bar.type === 1) {
                      shadowMultiplier = 0.02;
                    } else if (bar.hp > 0) {
                      shadowMultiplier = 0.2;
                    }
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
                const diverCenterX = enemy.position.x + enemy.size.width / 2;
                const diverDistX = Math.abs(candidateCenterX - diverCenterX);
                if (diverDistX < 60) {
                  const verticalDist = playerY - enemy.position.y;
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

          player.isShooting = true;

          if (player.ultimateGauge >= 100 && (activeEnemies.length >= 4 || activeEnemies.some((e: any) => e.type === 2))) {
            game.triggerUltimate();
          }

          if (game.currency >= 50 && (activeEnemies.length >= 8 || activeEnemies.some((e: any) => e.position.y > 450))) {
            game.triggerSummonAlly();
          }
        }, 16);
      });
    }, { runIndex, maxTimeoutMs });

    return telemetry;
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true
  });

  const runs: RunTelemetry[] = [];

  try {
    for (let i = 1; i <= totalRuns; i++) {
      console.log('[Run ' + i + '/' + totalRuns + '] Executing automated benchmark run...');
      const startMs = Date.now();
      const runResult = await runSingleGame(browser, i);
      const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);

      runs.push(runResult);
      console.log(
        '[Run ' + i + '/' + totalRuns + '] Finished in ' + elapsedSec + 's | Survival: ' + (runResult.durationMs / 1000).toFixed(1) + 's | Wave: ' + runResult.waveReached + ' | Score: ' + runResult.score + ' | Death: ' + runResult.causeOfDeath
      );
    }

    const summary = computeSummaryStatistics(runs);

    const report: BenchmarkReport = {
      benchmarkMetadata: {
        target: targetName,
        totalRuns: runs.length,
        timestamp: new Date().toISOString(),
        gitCommit: 'baseline_unmodified',
        environment: {
          node: process.version,
          playwright: '1.62.1',
          viewport: { width: 1280, height: 900 }
        }
      },
      summaryStatistics: summary,
      runs
    };

    const dir = path.dirname(outputFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputFilePath, JSON.stringify(report, null, 2), 'utf-8');
    console.log('\n=======================================================');
    console.log(' Benchmark Run Completed Successfully!');
    console.log(' Total Runs: ' + runs.length);
    console.log(' Mean Survival Time: ' + (summary.avgSurvivalTimeMs / 1000).toFixed(2) + 's (Median: ' + (summary.medianSurvivalTimeMs / 1000).toFixed(2) + 's)');
    console.log(' 95% Confidence Interval: [' + (summary.ci95LowerMs / 1000).toFixed(2) + 's, ' + (summary.ci95UpperMs / 1000).toFixed(2) + 's]');
    console.log(' Mean Wave Reached: ' + summary.avgWaveReached + ' (Max: ' + summary.maxWaveReached + ')');
    console.log(' Mean Score: ' + summary.avgScore);
    console.log(' Death Causes: ' + JSON.stringify(summary.deathCauseDistribution));
    console.log(' Results saved to: ' + outputFilePath);
    console.log('=======================================================\n');
  } catch (err) {
    console.error('Benchmark execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { RunTelemetry, BenchmarkReport, computeSummaryStatistics } from './telemetry_collector';

test.describe('Automated Benchmark Suite', () => {
  test.setTimeout(600000);

  test('Execute Baseline Benchmark (10 Automated Runs)', async ({ page }) => {
    const totalRuns = 10;
    const runs: RunTelemetry[] = [];

    const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
    console.log('Executing 10 Baseline Benchmark runs against ' + targetUrl + '...');

    for (let runIdx = 1; runIdx <= totalRuns; runIdx++) {
      console.log('[Playwright Benchmark] Starting Run ' + runIdx + '/' + totalRuns + '...');
      await page.goto(targetUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('canvas', { timeout: 15000 });

      const telemetry = await page.evaluate(async (params) => {
        const { runIndex } = params;
        return new Promise<RunTelemetry>((resolve) => {
          const game = (window as any).gameManager;
          if (!game) throw new Error('gameManager not found');

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

          game.onPlayerHpChange = (hp: number) => {
            if (hp < lastPlayerHp) {
              const diff = lastPlayerHp - hp;
              totalDamageTaken += diff;
              waveDamage += diff;
            }
            lastPlayerHp = hp;
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
            if (game.state === 'GAME_OVER' || game.state === 2) {
              finalizeTelemetry();
              return;
            }

            if (game.state === 'SHOP' || game.state === 3) {
              if (game.currency >= 50 && game.player.baseFireRate > 0.1) game.upgradeFireRate();
              if (game.currency >= 100 && game.player.multiShot < 5) game.upgradeMultiShot();
              if (game.currency >= 200 && game.player.piercing < 5) game.upgradePiercing();
              game.startNextWave();
              return;
            }

            if (game.state !== 'PLAYING' && game.state !== 1) return;

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
                      if (bar.type === 1) shadowMultiplier = 0.02;
                      else if (bar.hp > 0) shadowMultiplier = 0.2;
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
      }, { runIndex: runIdx });

      runs.push(telemetry);
      console.log('[Playwright Benchmark] Run ' + runIdx + ' complete: ' + (telemetry.durationMs / 1000).toFixed(1) + 's, Wave ' + telemetry.waveReached + ', Score ' + telemetry.score + ', Cause: ' + telemetry.causeOfDeath);
    }

    expect(runs.length).toBe(10);

    const summary = computeSummaryStatistics(runs);
    const report: BenchmarkReport = {
      benchmarkMetadata: {
        target: 'baseline',
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

    const outputPath = path.resolve(process.cwd(), 'tests/benchmark/baseline_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log('Saved baseline results to ' + outputPath);
  });
});

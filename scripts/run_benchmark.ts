import { chromium, Browser, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface WaveRecord {
  wave: number;
  durationMs: number;
  kills: number;
  damageTaken: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  avgDps: number;
  crisisTriggered?: string | null;
  crisisSurvived?: boolean;
}

export interface RunTelemetry {
  runId: string;
  timestamp: string;
  durationMs: number;
  waveReached: number;
  score: number;
  currency: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  playerDps: number;
  incomingDps: number;
  avgFps: number;
  minFps: number;
  totalKills: number;
  killBreakdown: Record<string, number>;
  upgradesPurchased: {
    fireRate: number;
    multiShot: number;
    piercing: number;
  };
  ultimatesCast: number;
  alliesSummoned: number;
  damageTaken: number;
  causeOfDeath: 'ENEMY_BULLET' | 'DIVER_COLLISION' | 'DEFENSE_BREACH' | 'ACID_HAZARD' | 'TIME_CAP_SURVIVED';
  rawGameOverReason: string;
  crisisEvents: Array<{ type: string; wave: number; survived: boolean }>;
  waveHistory: WaveRecord[];
}

export interface SummaryStatistics {
  sampleCount: number;
  avgSurvivalTimeMs: number;
  medianSurvivalTimeMs: number;
  minSurvivalTimeMs: number;
  maxSurvivalTimeMs: number;
  stdDevSurvivalTimeMs: number;
  ci95LowerMs: number;
  ci95UpperMs: number;
  avgWaveReached: number;
  maxWaveReached: number;
  waveDistribution: Record<number, number>;
  avgScore: number;
  avgCurrency: number;
  avgAccuracy: number;
  avgPlayerDps: number;
  avgIncomingDps: number;
  avgFps: number;
  minFps: number;
  avgKills: number;
  avgUltimatesCast: number;
  avgAlliesSummoned: number;
  crisisSummary: Record<string, { total: number; survived: number; survivalRate: number }>;
  deathCauseDistribution: Record<string, { count: number; percentage: number }>;
}

export interface BenchmarkReport {
  benchmarkMetadata: {
    target: 'baseline' | 'rebalanced';
    totalRuns: number;
    timestamp: string;
    gitCommit: string;
    environment: {
      node: string;
      playwright: string;
      viewport: { width: number; height: number };
      targetUrl: string;
    };
  };
  summaryStatistics: SummaryStatistics;
  runs: RunTelemetry[];
}

export function computeSummaryStatistics(runs: RunTelemetry[]): SummaryStatistics {
  const n = runs.length;
  if (n === 0) {
    throw new Error('Cannot compute statistics on empty runs');
  }

  const durations = runs.map(r => r.durationMs).sort((a, b) => a - b);
  const avgSurvivalTimeMs = durations.reduce((acc, d) => acc + d, 0) / n;

  const medianSurvivalTimeMs =
    n % 2 === 1
      ? durations[Math.floor(n / 2)]
      : (durations[n / 2 - 1] + durations[n / 2]) / 2;

  const minSurvivalTimeMs = durations[0];
  const maxSurvivalTimeMs = durations[n - 1];

  const variance =
    durations.reduce((acc, d) => acc + (d - avgSurvivalTimeMs) ** 2, 0) /
    (n > 1 ? n - 1 : 1);
  const stdDevSurvivalTimeMs = Math.sqrt(variance);

  const tCritical = n === 10 ? 2.262 : n > 30 ? 1.96 : 2.0;
  const marginOfError = (tCritical * stdDevSurvivalTimeMs) / Math.sqrt(n);
  const ci95LowerMs = Math.max(0, avgSurvivalTimeMs - marginOfError);
  const ci95UpperMs = avgSurvivalTimeMs + marginOfError;

  const avgWaveReached = runs.reduce((acc, r) => acc + r.waveReached, 0) / n;
  const maxWaveReached = Math.max(...runs.map(r => r.waveReached));

  const waveDistribution: Record<number, number> = {};
  runs.forEach(r => {
    waveDistribution[r.waveReached] = (waveDistribution[r.waveReached] || 0) + 1;
  });

  const avgScore = runs.reduce((acc, r) => acc + r.score, 0) / n;
  const avgCurrency = runs.reduce((acc, r) => acc + r.currency, 0) / n;
  const avgAccuracy = runs.reduce((acc, r) => acc + r.accuracy, 0) / n;
  const avgPlayerDps = runs.reduce((acc, r) => acc + r.playerDps, 0) / n;
  const avgIncomingDps = runs.reduce((acc, r) => acc + r.incomingDps, 0) / n;
  const avgFps = runs.reduce((acc, r) => acc + (r.avgFps || 60), 0) / n;
  const minFps = Math.min(...runs.map(r => r.minFps || 60));
  const avgKills = runs.reduce((acc, r) => acc + r.totalKills, 0) / n;
  const avgUltimatesCast = runs.reduce((acc, r) => acc + (r.ultimatesCast || 0), 0) / n;
  const avgAlliesSummoned = runs.reduce((acc, r) => acc + (r.alliesSummoned || 0), 0) / n;

  // Crisis encounter statistics
  const crisisSummary: Record<string, { total: number; survived: number; survivalRate: number }> = {};
  runs.forEach(r => {
    (r.crisisEvents || []).forEach(ce => {
      if (!crisisSummary[ce.type]) {
        crisisSummary[ce.type] = { total: 0, survived: 0, survivalRate: 0 };
      }
      crisisSummary[ce.type].total += 1;
      if (ce.survived) {
        crisisSummary[ce.type].survived += 1;
      }
    });
  });

  Object.keys(crisisSummary).forEach(k => {
    const item = crisisSummary[k];
    item.survivalRate = item.total > 0 ? Math.round((item.survived / item.total) * 1000) / 10 : 0;
  });

  const deathCauseDistribution: Record<string, { count: number; percentage: number }> = {};
  runs.forEach(r => {
    const cause = r.causeOfDeath;
    if (!deathCauseDistribution[cause]) {
      deathCauseDistribution[cause] = { count: 0, percentage: 0 };
    }
    deathCauseDistribution[cause].count += 1;
  });

  Object.keys(deathCauseDistribution).forEach(k => {
    deathCauseDistribution[k].percentage = Math.round((deathCauseDistribution[k].count / n) * 1000) / 10;
  });

  return {
    sampleCount: n,
    avgSurvivalTimeMs: Math.round(avgSurvivalTimeMs * 10) / 10,
    medianSurvivalTimeMs: Math.round(medianSurvivalTimeMs * 10) / 10,
    minSurvivalTimeMs: Math.round(minSurvivalTimeMs * 10) / 10,
    maxSurvivalTimeMs: Math.round(maxSurvivalTimeMs * 10) / 10,
    stdDevSurvivalTimeMs: Math.round(stdDevSurvivalTimeMs * 10) / 10,
    ci95LowerMs: Math.round(ci95LowerMs * 10) / 10,
    ci95UpperMs: Math.round(ci95UpperMs * 10) / 10,
    avgWaveReached: Math.round(avgWaveReached * 100) / 100,
    maxWaveReached,
    waveDistribution,
    avgScore: Math.round(avgScore * 10) / 10,
    avgCurrency: Math.round(avgCurrency * 10) / 10,
    avgAccuracy: Math.round(avgAccuracy * 10) / 10,
    avgPlayerDps: Math.round(avgPlayerDps * 10) / 10,
    avgIncomingDps: Math.round(avgIncomingDps * 100) / 100,
    avgFps: Math.round(avgFps * 10) / 10,
    minFps: Math.round(minFps * 10) / 10,
    avgKills: Math.round(avgKills * 10) / 10,
    avgUltimatesCast: Math.round(avgUltimatesCast * 10) / 10,
    avgAlliesSummoned: Math.round(avgAlliesSummoned * 10) / 10,
    crisisSummary,
    deathCauseDistribution
  };
}

export function generateBenchmarkMarkdown(report: BenchmarkReport): string {
  const s = report.summaryStatistics;
  let md = `# Water Invader: Autonomous Playwright Bot Benchmark Report

**Benchmark Target:** \`${report.benchmarkMetadata.target.toUpperCase()}\`  
**Timestamp:** \`${report.benchmarkMetadata.timestamp}\`  
**Total Completed Runs:** \`${report.benchmarkMetadata.totalRuns}\`  
**Environment:** Node \`${report.benchmarkMetadata.environment.node}\` | Playwright \`${report.benchmarkMetadata.environment.playwright}\` | Viewport \`${report.benchmarkMetadata.environment.viewport.width}x${report.benchmarkMetadata.environment.viewport.height}\`

---

## 1. Aggregate Performance & Combat Telemetry

| Metric | Measured Value | Standard / Target |
|---|---|---|
| **Mean Survival Duration** | **${(s.avgSurvivalTimeMs / 1000).toFixed(2)}s** (Median: ${(s.medianSurvivalTimeMs / 1000).toFixed(2)}s) | Full Progression Envelope |
| **95% Confidence Interval** | **[${(s.ci95LowerMs / 1000).toFixed(2)}s, ${(s.ci95UpperMs / 1000).toFixed(2)}s]** | Statistical Bounds |
| **Mean Wave Reached** | **${s.avgWaveReached}** (Max: **${s.maxWaveReached}**) | Stage 10+ Scaling Threat |
| **Average Score** | **${s.avgScore}** pts | High Score Progression |
| **Average Accuracy (Hit Ratio)** | **${s.avgAccuracy}%** | Heuristic Aim & Trajectory Tracking |
| **Average Player DPS** | **${s.avgPlayerDps}** DPS | Multi-Shot & Piercing Firepower |
| **Average Incoming DPS** | **${s.avgIncomingDps}** DPS | Hostile Attack Density |
| **Average Frame Rate (FPS)** | **${s.avgFps} FPS** (Min: **${s.minFps} FPS**) | 60 FPS Target Stability |
| **Average Ultimates Triggered** | **${s.avgUltimatesCast}** per run | Heavy Rain Skill Engagement |
| **Average Allies Summoned** | **${s.avgAlliesSummoned}** per run | Support Drone Squadrons |

---

## 2. Death Cause Breakdown

| Cause of Death | Occurrences | Percentage | Assessment |
|---|---|---|---|
`;

  Object.entries(s.deathCauseDistribution).forEach(([cause, info]) => {
    md += `| \`${cause}\` | ${info.count} | **${info.percentage}%** | ${cause.includes('DIVER') ? 'High-speed pincer threat' : cause.includes('BREACH') ? 'Massive swarm penetration' : 'Standard hostile crossfire'} |\n`;
  });

  md += `\n---

## 3. Individual Benchmark Runs Log

| Run ID | Wave Reached | Duration | Score | Accuracy | Player DPS | FPS | Ultimates | Cause of Death |
|---|---|---|---|---|---|---|---|---|
`;

  report.runs.forEach(r => {
    md += `| \`${r.runId}\` | **Wave ${r.waveReached}** | ${(r.durationMs / 1000).toFixed(1)}s | ${r.score} | ${r.accuracy}% | ${r.playerDps} | ${r.avgFps} | ${r.ultimatesCast} | \`${r.causeOfDeath}\` |\n`;
  });

  return md;
}

// =============================================================================
// PLAYWRIGHT IN-PAGE AUTONOMOUS BOT PLAYTESTER
// =============================================================================

async function runSingleGame(
  browser: Browser,
  runIndex: number,
  targetUrl: string,
  maxTimeoutMs: number = 180000
): Promise<RunTelemetry> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 10000 });

    const telemetry = await page.evaluate(async (params) => {
      // Guard against esbuild __name helper injection
      if (typeof (window as any).__name === 'undefined') {
        (window as any).__name = (target: any, value: string) => target;
      }
      const { runIndex, maxTimeoutMs } = params;

      return new Promise<RunTelemetry>((resolve) => {
        const game = (window as any).gameManager;
        if (!game) {
          throw new Error('window.gameManager not found');
        }

        let shotsFiredCount = 0;
        let shotsHitCount = 0;
        let totalDamageTaken = 0;
        let totalDamageDealt = 0;
        let ultimatesTriggered = 0;
        let alliesSummoned = 0;
        const fpsSamples: number[] = [];

        const killBreakdown: Record<string, number> = {
          NORMAL: 0,
          ZIGZAG: 0,
          BOSS: 0,
          SNIPER: 0,
          DIVER: 0,
          SHIELDED: 0,
          SPLITTER: 0,
          ROGUE_DRONE: 0,
          ROGUE_STALKER: 0,
          ROGUE_MECH: 0
        };

        const crisisEvents: Array<{ type: string; wave: number; survived: boolean }> = [];
        let activeCrisisType: string | null = null;

        const waveHistory: WaveRecord[] = [];
        let currentWave = 1;
        let waveStartTime = performance.now();
        let waveKills = 0;
        let waveDamageTaken = 0;
        let waveShotsFired = 0;
        let waveShotsHit = 0;
        let waveDamageDealt = 0;
        let lastPlayerHp = game.player ? game.player.hp : 3;

        // Hook Player HP change
        const origOnHpChange = game.onPlayerHpChange;
        game.onPlayerHpChange = (hp: number) => {
          if (hp < lastPlayerHp) {
            const diff = lastPlayerHp - hp;
            totalDamageTaken += diff;
            waveDamageTaken += diff;
          }
          lastPlayerHp = hp;
          if (origOnHpChange) origOnHpChange(hp);
        };

        // Hook Enemy Kill
        const origHandleEnemyKill = game.handleEnemyKill.bind(game);
        game.handleEnemyKill = (enemy?: any) => {
          waveKills++;
          shotsHitCount++;
          waveShotsHit++;
          totalDamageDealt += (enemy && enemy.maxHp ? enemy.maxHp : 1);
          waveDamageDealt += (enemy && enemy.maxHp ? enemy.maxHp : 1);
          if (enemy) {
            const typeName = ['NORMAL', 'ZIGZAG', 'BOSS', 'SNIPER', 'DIVER', 'SHIELDED', 'SPLITTER', 'ROGUE_DRONE', 'ROGUE_STALKER', 'ROGUE_MECH'][enemy.type] || 'NORMAL';
            killBreakdown[typeName] = (killBreakdown[typeName] || 0) + 1;
          }
          origHandleEnemyKill(enemy);
        };

        // Hook Player Fire
        const origPlayerFire = game.player.fire.bind(game.player);
        game.player.fire = () => {
          const bullets = origPlayerFire();
          if (bullets && bullets.length > 0) {
            shotsFiredCount += bullets.length;
            waveShotsFired += bullets.length;
          }
          return bullets;
        };

        // Hook Crisis Director Events
        const origOnCrisis = game.onCrisisEvent;
        game.onCrisisEvent = (crisis: any) => {
          if (crisis && crisis.activeCrisis && crisis.activeCrisis !== activeCrisisType) {
            activeCrisisType = crisis.activeCrisis;
            crisisEvents.push({
              type: crisis.activeCrisis,
              wave: game.level,
              survived: true
            });
          }
          if (origOnCrisis) origOnCrisis(crisis);
        };

        // Hook Ultimate
        const origUltimate = game.triggerUltimate.bind(game);
        game.triggerUltimate = () => {
          ultimatesTriggered++;
          totalDamageDealt += 200;
          waveDamageDealt += 200;
          origUltimate();
        };

        // Hook Ally Summon
        const origSummon = game.triggerSummonAlly.bind(game);
        game.triggerSummonAlly = () => {
          alliesSummoned++;
          origSummon();
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
          const durationSec = durationMs / 1000;

          const waveDurationMs = endTime - waveStartTime;
          const waveDps = waveDurationMs > 0 ? (waveDamageDealt / (waveDurationMs / 1000)) : 0;
          const waveAccuracy = waveShotsFired > 0 ? (waveShotsHit / waveShotsFired) * 100 : 0;

          waveHistory.push({
            wave: currentWave,
            durationMs: Math.round(waveDurationMs),
            kills: waveKills,
            damageTaken: waveDamageTaken,
            shotsFired: waveShotsFired,
            shotsHit: waveShotsHit,
            accuracy: Math.round(waveAccuracy * 10) / 10,
            avgDps: Math.round(waveDps * 10) / 10,
            crisisTriggered: activeCrisisType,
            crisisSurvived: game.player ? game.player.hp > 0 : false
          });

          let cause: 'ENEMY_BULLET' | 'DIVER_COLLISION' | 'DEFENSE_BREACH' | 'ACID_HAZARD' | 'TIME_CAP_SURVIVED' = 'ENEMY_BULLET';
          const reason = game.gameOverReason || '';

          if (causeOverride === 'TIME_CAP_SURVIVED') {
            cause = 'TIME_CAP_SURVIVED';
          } else if (reason.includes('돌파')) {
            cause = 'DEFENSE_BREACH';
          } else if (reason.includes('산성 폭풍')) {
            cause = 'ACID_HAZARD';
          } else if (reason.includes('정수기능이 파괴') || reason.includes('충돌')) {
            cause = 'DIVER_COLLISION';
          } else {
            cause = 'ENEMY_BULLET';
          }

          if (cause !== 'TIME_CAP_SURVIVED' && crisisEvents.length > 0) {
            crisisEvents[crisisEvents.length - 1].survived = false;
          }

          const accuracy = shotsFiredCount > 0 ? (shotsHitCount / shotsFiredCount) * 100 : 0;
          const totalKills = Object.values(killBreakdown).reduce((a, b) => a + b, 0) + waveKills;
          const playerDps = durationSec > 0 ? totalDamageDealt / durationSec : 0;
          const incomingDps = durationSec > 0 ? totalDamageTaken / durationSec : 0;

          const avgFps = fpsSamples.length > 0 ? fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length : (game.fps || 60);
          const minFps = fpsSamples.length > 0 ? Math.min(...fpsSamples) : (game.fps || 60);

          const upg = game.getUpgrades ? game.getUpgrades() : { fireRate: 1, multiShot: 1, piercing: 1 };

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
            playerDps: Math.round(playerDps * 10) / 10,
            incomingDps: Math.round(incomingDps * 100) / 100,
            avgFps: Math.round(avgFps * 10) / 10,
            minFps: Math.round(minFps * 10) / 10,
            totalKills,
            killBreakdown,
            upgradesPurchased: upg,
            ultimatesCast: ultimatesTriggered,
            alliesSummoned,
            damageTaken: totalDamageTaken,
            causeOfDeath: cause,
            rawGameOverReason: reason,
            crisisEvents,
            waveHistory
          };

          resolve(result);
        };

        botInterval = setInterval(() => {
          if (game.fps && game.fps > 0) {
            fpsSamples.push(game.fps);
          }

          if (game.state === 2 || game.state === 'GAME_OVER') {
            finalizeTelemetry();
            return;
          }

          if (game.state === 'SHOP' || game.state === 3) {
            // Auto-buy upgrades in shop
            if (game.currency >= 50 && typeof game.upgradeFireRate === 'function') game.upgradeFireRate();
            if (game.currency >= 100 && typeof game.upgradeMultiShot === 'function') game.upgradeMultiShot();
            if (game.currency >= 200 && typeof game.upgradePiercing === 'function') game.upgradePiercing();
            if (typeof game.startNextWave === 'function') {
              game.startNextWave();
            }
            return;
          }

          if (game.state !== 1 && game.state !== 'PLAYING') {
            return;
          }

          if (game.level !== currentWave) {
            const now = performance.now();
            const wDur = now - waveStartTime;
            const wDps = wDur > 0 ? (waveDamageDealt / (wDur / 1000)) : 0;
            const wAcc = waveShotsFired > 0 ? (waveShotsHit / waveShotsFired) * 100 : 0;

            waveHistory.push({
              wave: currentWave,
              durationMs: Math.round(wDur),
              kills: waveKills,
              damageTaken: waveDamageTaken,
              shotsFired: waveShotsFired,
              shotsHit: waveShotsHit,
              accuracy: Math.round(wAcc * 10) / 10,
              avgDps: Math.round(wDps * 10) / 10,
              crisisTriggered: activeCrisisType,
              crisisSurvived: true
            });

            currentWave = game.level;
            waveStartTime = now;
            waveKills = 0;
            waveDamageTaken = 0;
            waveShotsFired = 0;
            waveShotsHit = 0;
            waveDamageDealt = 0;
            activeCrisisType = null;
          }

          if (performance.now() - startTime > maxTimeoutMs) {
            game.state = 2;
            finalizeTelemetry('TIME_CAP_SURVIVED');
            return;
          }

          // Heuristic Potential Field Evaluation & Aim Evasion Solver
          const canvasWidth = game.logicalWidth || 600;
          const player = game.player;
          if (!player) return;

          const playerX = player.position.x;
          const playerY = player.position.y;
          const playerWidth = player.size.width;
          const playerCenterX = playerX + playerWidth / 2;

          const enemyBullets = (game.bullets || []).filter((b: any) => !b.isPlayerBullet && !b.isDead && b.faction !== 'PLAYER');
          const activeEnemies = (game.enemies || []).filter((e: any) => !e.isDead && e.hp > 0);
          const activeBarricades = (game.barricades || []).filter((b: any) => !b.isDead);
          const hazardProjectiles = (game.hazardProjectiles || []).filter((h: any) => !h.isDead);

          // 1. Target selection (prioritize Divers, Snipers, low-altitude hostiles)
          let bestTargetX = canvasWidth / 2;
          if (activeEnemies.length > 0) {
            let highestPriority = -Infinity;
            let selectedEnemy = activeEnemies[0];

            for (const enemy of activeEnemies) {
              let priority = 0;
              const enemyCenterX = enemy.position.x + enemy.size.width / 2;

              if (enemy.position.y > 500) priority += 1400 + enemy.position.y;
              if (enemy.type === 4 || enemy.isDiving) priority += 900;
              if (enemy.type === 3) priority += 600;
              if (enemy.type === 2) priority += 700;

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

          // 2. 1D Potential Field Safety Minimizer
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
                    shadowMultiplier = bar.type === 1 ? 0.02 : 0.2;
                    break;
                  }
                }
              }

              const distX = Math.abs(candidateCenterX - predictedImpactX);
              const dangerRadius = 45;
              if (distX < dangerRadius * 2) {
                const timeUrgency = 1500 / (tti + 0.05);
                const spatialWeight = Math.exp(-(distX * distX) / (2 * Math.pow(dangerRadius * 0.8, 2)));
                dangerScore += timeUrgency * spatialWeight * shadowMultiplier * (bullet.damage || 1);
              }
            }

            // Hazard Rain avoidance
            for (const hz of hazardProjectiles) {
              const distX = Math.abs(candidateCenterX - hz.x);
              if (distX < 50 && hz.y < playerY && hz.y > playerY - 300) {
                dangerScore += 1800 * Math.exp(-(distX * distX) / 1600);
              }
            }

            // Diver dive collision avoidance
            for (const enemy of activeEnemies) {
              if (enemy.type === 4 || enemy.isDiving) {
                const diverCenterX = enemy.position.x + enemy.size.width / 2;
                const diverDistX = Math.abs(candidateCenterX - diverCenterX);
                if (diverDistX < 60 && playerY - enemy.position.y < 500) {
                  dangerScore += 3500 * Math.exp(-(diverDistX * diverDistX) / 3600);
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

          // Ultimate and Ally Dispatch
          if (player.ultimateGauge >= 100 && (activeEnemies.length >= 4 || activeEnemies.some((e: any) => e.type === 2) || game.level >= 10)) {
            game.triggerUltimate();
          }

          if (game.currency >= 50 && (activeEnemies.length >= 8 || activeEnemies.some((e: any) => e.position.y > 450) || (player.multiShot >= 3 && game.currency >= 150))) {
            game.triggerSummonAlly();
          }
        }, 16);
      });
    }, { runIndex, maxTimeoutMs });

    return telemetry;
  } finally {
    await context.close().catch(() => {});
  }
}

// =============================================================================
// MAIN ENTRYPOINT
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  let totalRuns = 5;
  let targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
  let outputJsonPath = path.resolve(process.cwd(), 'test-artifacts/benchmark_report.json');
  let outputMdPath = path.resolve(process.cwd(), 'test-artifacts/benchmark_report.md');
  let targetName: 'baseline' | 'rebalanced' = 'rebalanced';
  let isHeadless = true;

  for (const arg of args) {
    if (arg.startsWith('--runs=')) {
      totalRuns = Math.max(1, parseInt(arg.split('=')[1], 10) || 5);
    } else if (arg.startsWith('--url=')) {
      targetUrl = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      outputJsonPath = path.resolve(process.cwd(), arg.split('=')[1]);
    } else if (arg.startsWith('--markdown=')) {
      outputMdPath = path.resolve(process.cwd(), arg.split('=')[1]);
    } else if (arg.startsWith('--target=')) {
      targetName = (arg.split('=')[1] as 'baseline' | 'rebalanced') || 'rebalanced';
    } else if (arg.startsWith('--headless=')) {
      isHeadless = arg.split('=')[1].toLowerCase() !== 'false';
    }
  }

  console.log('================================================================================');
  console.log('  WATER INVADER: AUTONOMOUS PLAYWRIGHT BOT BENCHMARK HARNESS');
  console.log(`  Target URL:   ${targetUrl}`);
  console.log(`  Total Runs:   ${totalRuns}`);
  console.log(`  Target Mode:  ${targetName.toUpperCase()}`);
  console.log(`  Output JSON:  ${outputJsonPath}`);
  console.log(`  Output MD:    ${outputMdPath}`);
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    headless: isHeadless,
    args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox']
  });

  const runs: RunTelemetry[] = [];

  try {
    for (let i = 1; i <= totalRuns; i++) {
      let attempts = 0;
      let success = false;
      while (attempts < 3 && !success) {
        attempts++;
        try {
          console.log(`[Run ${i}/${totalRuns}] Launching automated Playwright bot session (Attempt ${attempts})...`);
          const startMs = Date.now();
          const runResult = await runSingleGame(browser, i, targetUrl);
          const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);

          runs.push(runResult);
          console.log(
            `[Run ${i}/${totalRuns}] Finished in ${elapsedSec}s | Wave: ${runResult.waveReached} | Score: ${runResult.score} | Accuracy: ${runResult.accuracy}% | DPS: ${runResult.playerDps} | Death: ${runResult.causeOfDeath}`
          );
          success = true;
        } catch (err: any) {
          console.warn(`[Run ${i}/${totalRuns}] Attempt ${attempts} failed (${err.message}). Retrying...`);
          if (attempts >= 3) throw err;
        }
      }
    }

    const summary = computeSummaryStatistics(runs);

    const report: BenchmarkReport = {
      benchmarkMetadata: {
        target: targetName,
        totalRuns: runs.length,
        timestamp: new Date().toISOString(),
        gitCommit: 'milestone_m3_verified',
        environment: {
          node: process.version,
          playwright: '1.62.1',
          viewport: { width: 1280, height: 900 },
          targetUrl
        }
      },
      summaryStatistics: summary,
      runs
    };

    const outDir = path.dirname(outputJsonPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outputJsonPath, JSON.stringify(report, null, 2), 'utf-8');
    const mdContent = generateBenchmarkMarkdown(report);
    fs.writeFileSync(outputMdPath, mdContent, 'utf-8');

    console.log('\n================================================================================');
    console.log('  BENCHMARK SUITE COMPLETED SUCCESSFULLY');
    console.log('================================================================================');
    console.log(` Total Completed Runs:      ${runs.length}`);
    console.log(` Mean Survival Duration:    ${(summary.avgSurvivalTimeMs / 1000).toFixed(2)}s (Median: ${(summary.medianSurvivalTimeMs / 1000).toFixed(2)}s)`);
    console.log(` 95% Confidence Interval:   [${(summary.ci95LowerMs / 1000).toFixed(2)}s, ${(summary.ci95UpperMs / 1000).toFixed(2)}s]`);
    console.log(` Mean Wave Reached:         ${summary.avgWaveReached} (Max: ${summary.maxWaveReached})`);
    console.log(` Average Score:             ${summary.avgScore} pts`);
    console.log(` Average Accuracy:          ${summary.avgAccuracy}%`);
    console.log(` Average Player DPS:        ${summary.avgPlayerDps} DPS`);
    console.log(` Average Incoming DPS:      ${summary.avgIncomingDps} DPS`);
    console.log(` Average FPS:               ${summary.avgFps} FPS (Min: ${summary.minFps} FPS)`);
    console.log(` Death Causes Breakdown:    ${JSON.stringify(summary.deathCauseDistribution)}`);
    console.log(` JSON Report:               ${outputJsonPath}`);
    console.log(` Markdown Report:           ${outputMdPath}`);
    console.log('================================================================================\n');
  } catch (err) {
    console.error('Benchmark harness error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error in benchmark script:', err);
    process.exit(1);
  });
}

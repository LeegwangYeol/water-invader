import { test, expect } from '@playwright/test';
import {
  SwarmRunResult,
  computeStressSummary,
  generateStressReportData,
  attachTelemetryToPage,
  collectTelemetrySnapshot,
  stopTelemetryAndCollectFinal
} from './telemetry_stress_collector';

test.describe('Milestone 2: Telemetry Stress Collector Unit & Integration Suite', () => {

  test('1. Statistical Computation Engine: Durations, CI95, Memory, FPS, Upgrades, and Anomalies', async () => {
    const mockRuns: SwarmRunResult[] = [
      {
        runId: 'run_01',
        workerId: 1,
        timestamp: new Date().toISOString(),
        durationMs: 60000,
        waveReached: 12,
        score: 4500,
        finalCurrency: 50,
        totalKills: 85,
        killsByType: { NORMAL: 40, ZIGZAG: 20, BOSS: 2, SNIPER: 15, DIVER: 8, SHIELDED: 0, SPLITTER: 0 },
        accuracy: 78.5,
        causeOfDeath: 'ENEMY_BULLET',
        rawGameOverReason: 'Enemy bullet hit',
        finalUpgrades: { fireRate: 4, multiShot: 4, piercing: 2, totalSpent: 1000 },
        finalSkills: { ultimates: 3, allies: 2 },
        performanceSummary: { avgFps: 59.8, minFps: 48.2, p1LowFps: 52.1, stutters33: 5, stutters50: 1 },
        memorySummary: { initialHeapMb: 24.5, peakHeapMb: 32.1, finalHeapMb: 28.0, growthRateMbPerMin: 3.5 },
        audioSummary: { totalAllocatedOscillators: 420, peakActiveNodes: 12 },
        entitySummary: { peakBullets: 45, peakEnemies: 28, peakParticles: 120 },
        anomalies: [],
        waveHistory: [],
        snapshots: []
      },
      {
        runId: 'run_02',
        workerId: 2,
        timestamp: new Date().toISOString(),
        durationMs: 80000,
        waveReached: 16,
        score: 6800,
        finalCurrency: 120,
        totalKills: 130,
        killsByType: { NORMAL: 60, ZIGZAG: 30, BOSS: 3, SNIPER: 22, DIVER: 15, SHIELDED: 0, SPLITTER: 0 },
        accuracy: 82.1,
        causeOfDeath: 'DIVER_COLLISION',
        rawGameOverReason: 'Diver collision',
        finalUpgrades: { fireRate: 4, multiShot: 4, piercing: 5, totalSpent: 1600 },
        finalSkills: { ultimates: 5, allies: 4 },
        performanceSummary: { avgFps: 58.5, minFps: 42.0, p1LowFps: 47.3, stutters33: 12, stutters50: 3 },
        memorySummary: { initialHeapMb: 25.0, peakHeapMb: 36.4, finalHeapMb: 30.2, growthRateMbPerMin: 3.9 },
        audioSummary: { totalAllocatedOscillators: 680, peakActiveNodes: 18 },
        entitySummary: { peakBullets: 78, peakEnemies: 42, peakParticles: 180 },
        anomalies: [
          {
            timestamp: Date.now(),
            relativeTimeMs: 45000,
            type: 'FRAME_DROP',
            severity: 'WARNING',
            message: 'Stutter >50ms'
          }
        ],
        waveHistory: [],
        snapshots: []
      },
      {
        runId: 'run_03',
        workerId: 3,
        timestamp: new Date().toISOString(),
        durationMs: 100000,
        waveReached: 20,
        score: 9200,
        finalCurrency: 200,
        totalKills: 190,
        killsByType: { NORMAL: 90, ZIGZAG: 45, BOSS: 4, SNIPER: 30, DIVER: 21, SHIELDED: 0, SPLITTER: 0 },
        accuracy: 85.0,
        causeOfDeath: 'SURVIVED',
        rawGameOverReason: '',
        finalUpgrades: { fireRate: 4, multiShot: 4, piercing: 8, totalSpent: 2200 },
        finalSkills: { ultimates: 8, allies: 6 },
        performanceSummary: { avgFps: 57.2, minFps: 35.5, p1LowFps: 43.8, stutters33: 20, stutters50: 6 },
        memorySummary: { initialHeapMb: 26.2, peakHeapMb: 41.0, finalHeapMb: 35.1, growthRateMbPerMin: 5.3 },
        audioSummary: { totalAllocatedOscillators: 950, peakActiveNodes: 24 },
        entitySummary: { peakBullets: 110, peakEnemies: 60, peakParticles: 240 },
        anomalies: [
          {
            timestamp: Date.now(),
            relativeTimeMs: 72000,
            type: 'PROJECTILE_OVERLOAD',
            severity: 'WARNING',
            message: 'Bullets > 100'
          }
        ],
        waveHistory: [],
        snapshots: []
      },
      {
        runId: 'run_04',
        workerId: 4,
        timestamp: new Date().toISOString(),
        durationMs: 40000,
        waveReached: 8,
        score: 2900,
        finalCurrency: 10,
        totalKills: 55,
        killsByType: { NORMAL: 30, ZIGZAG: 12, BOSS: 1, SNIPER: 8, DIVER: 4, SHIELDED: 0, SPLITTER: 0 },
        accuracy: 75.4,
        causeOfDeath: 'DEFENSE_BREACH',
        rawGameOverReason: 'Defense breached',
        finalUpgrades: { fireRate: 3, multiShot: 2, piercing: 0, totalSpent: 350 },
        finalSkills: { ultimates: 2, allies: 1 },
        performanceSummary: { avgFps: 60.0, minFps: 52.0, p1LowFps: 56.4, stutters33: 2, stutters50: 0 },
        memorySummary: { initialHeapMb: 24.0, peakHeapMb: 29.5, finalHeapMb: 26.2, growthRateMbPerMin: 3.3 },
        audioSummary: { totalAllocatedOscillators: 280, peakActiveNodes: 8 },
        entitySummary: { peakBullets: 32, peakEnemies: 18, peakParticles: 90 },
        anomalies: [],
        waveHistory: [],
        snapshots: []
      }
    ];

    const summary = computeStressSummary(mockRuns);

    // Duration stats verification
    expect(summary.totalRuns).toBe(4);
    expect(summary.totalDurationMs).toBe(280000);
    expect(summary.survivalTime.avgMs).toBe(70000);
    expect(summary.survivalTime.minMs).toBe(40000);
    expect(summary.survivalTime.maxMs).toBe(100000);
    expect(summary.survivalTime.medianMs).toBe(70000);
    expect(summary.survivalTime.ci95LowerMs).toBeLessThanOrEqual(summary.survivalTime.avgMs);
    expect(summary.survivalTime.ci95UpperMs).toBeGreaterThanOrEqual(summary.survivalTime.avgMs);

    // Wave stats verification
    expect(summary.waveStats.avgWave).toBe(14);
    expect(summary.waveStats.maxWave).toBe(20);
    expect(summary.waveStats.waveDistribution[20]).toBe(1);
    expect(summary.waveStats.waveDistribution[12]).toBe(1);

    // Performance stats
    expect(summary.performanceStats.overallAvgFps).toBeCloseTo(58.9, 1);
    expect(summary.performanceStats.overallMinFps).toBe(35.5);
    expect(summary.performanceStats.totalStutters33).toBe(39);
    expect(summary.performanceStats.totalStutters50).toBe(10);

    // Memory stats
    expect(summary.memoryStats.avgPeakHeapMb).toBeCloseTo(34.8, 1);
    expect(summary.memoryStats.maxPeakHeapMb).toBe(41.0);
    expect(summary.memoryStats.memoryLeakDetected).toBe(false);

    // Weapon upgrades
    expect(summary.weaponEvolution.fireRateMaxedRate).toBe(75); // 3 of 4
    expect(summary.weaponEvolution.multiShotMaxedRate).toBe(75); // 3 of 4
    expect(summary.weaponEvolution.piercingPurchasedRate).toBe(75); // 3 of 4
    expect(summary.weaponEvolution.avgTotalSpent).toBe((1000 + 1600 + 2200 + 350) / 4);

    // Combat stats
    expect(summary.combatStats.avgScore).toBe((4500 + 6800 + 9200 + 2900) / 4);
    expect(summary.combatStats.avgKills).toBe((85 + 130 + 190 + 55) / 4);
    expect(summary.combatStats.avgAccuracy).toBeCloseTo(80.25, 1);
    expect(summary.combatStats.avgUltimatesCast).toBe(4.5);
    expect(summary.combatStats.avgAlliesSummoned).toBe(3.3);

    // Death cause distribution
    expect(summary.deathCauseDistribution['ENEMY_BULLET'].count).toBe(1);
    expect(summary.deathCauseDistribution['ENEMY_BULLET'].percentage).toBe(25);
    expect(summary.deathCauseDistribution['DIVER_COLLISION'].count).toBe(1);
    expect(summary.deathCauseDistribution['DIVER_COLLISION'].percentage).toBe(25);
    expect(summary.deathCauseDistribution['DEFENSE_BREACH'].count).toBe(1);
    expect(summary.deathCauseDistribution['DEFENSE_BREACH'].percentage).toBe(25);
    expect(summary.deathCauseDistribution['SURVIVED'].count).toBe(1);
    expect(summary.deathCauseDistribution['SURVIVED'].percentage).toBe(25);

    // Anomaly summary
    expect(summary.anomalySummary.totalAnomalies).toBe(2);
    expect(summary.anomalySummary.breakdownByType['FRAME_DROP']).toBe(1);
    expect(summary.anomalySummary.breakdownByType['PROJECTILE_OVERLOAD']).toBe(1);
    expect(summary.anomalySummary.crashFreePercentage).toBe(100);

    // Generate stress report data structure
    const reportData = generateStressReportData(mockRuns, {
      title: 'Water Invader Test Suite Report',
      totalWorkers: 4
    });

    expect(reportData.metadata.title).toBe('Water Invader Test Suite Report');
    expect(reportData.metadata.totalWorkers).toBe(4);
    expect(reportData.metadata.totalRuns).toBe(4);
    expect(reportData.runs.length).toBe(4);
  });

  test('2. In-Page Telemetry Hook Lifecycle & Snapshot Extraction in Headless Browser', async ({ page }) => {
    // Setup minimal game mockup in page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Water Invader Mock</title></head>
        <body>
          <canvas id="gameCanvas" width="600" height="800"></canvas>
          <script>
            window.gameManager = {
              state: 1,
              score: 500,
              currency: 150,
              level: 2,
              logicalWidth: 600,
              logicalHeight: 800,
              player: {
                position: { x: 275, y: 740 },
                size: { width: 50, height: 40 },
                hp: 3,
                maxHp: 5,
                fireRate: 0.5,
                baseFireRate: 0.5,
                multiShot: 1,
                piercing: 1,
                ultimateGauge: 50,
                stressLevel: 10,
                suppressionLevel: 0,
                isMovingLeft: false,
                isMovingRight: false,
                isShooting: true,
                fire: function() { return [{ x: 300, y: 720, vx: 0, vy: -300, isPlayerBullet: true }]; }
              },
              bullets: [
                { position: { x: 100, y: 200 }, velocity: { x: 0, y: 200 }, size: { width: 6, height: 10 }, isPlayerBullet: false, isDead: false },
                { position: { x: 300, y: 700 }, velocity: { x: 0, y: -300 }, size: { width: 6, height: 10 }, isPlayerBullet: true, isDead: false }
              ],
              enemies: [
                { position: { x: 200, y: 150 }, size: { width: 40, height: 30 }, type: 0, hp: 1, isDead: false }
              ],
              barricades: [
                { position: { x: 100, y: 650 }, size: { width: 60, height: 40 }, type: 1, hp: 100, isDead: false },
                { position: { x: 300, y: 650 }, size: { width: 60, height: 40 }, type: 0, hp: 20, isDead: false }
              ],
              particles: [],
              helpers: [],
              handleEnemyKill: function(enemy) {},
              upgradeFireRate: function() {
                if (this.currency >= 50) {
                  this.currency -= 50;
                  this.player.fireRate = 0.4;
                }
              },
              upgradeMultiShot: function() {
                if (this.currency >= 100) {
                  this.currency -= 100;
                  this.player.multiShot = 2;
                }
              },
              upgradePiercing: function() {},
              triggerUltimate: function() { this.player.ultimateGauge = 0; },
              triggerSummonAlly: function() {}
            };
          </script>
        </body>
      </html>
    `);

    // Attach telemetry collector
    await attachTelemetryToPage(page, {
      sampleIntervalMs: 50,
      frameDropThresholdFps: 30,
      projectileOverloadThreshold: 100
    });

    // Verify snapshot
    const snapshot1 = await collectTelemetrySnapshot(page);
    expect(snapshot1.performance.currentFps).toBeGreaterThanOrEqual(0);
    expect(snapshot1.entities.totalBullets).toBe(2);
    expect(snapshot1.entities.playerBullets).toBe(1);
    expect(snapshot1.entities.enemyBullets).toBe(1);
    expect(snapshot1.entities.totalEnemies).toBe(1);
    expect(snapshot1.entities.stoneBarricades).toBe(1);
    expect(snapshot1.entities.iceBarricades).toBe(1);
    expect(snapshot1.player.hp).toBe(3);
    expect(snapshot1.gameplay.currency).toBe(150);

    // Simulate economy upgrade & player firing
    await page.evaluate(() => {
      const g = (window as any).gameManager;
      g.upgradeFireRate();
      g.player.fire();
    });

    const snapshot2 = await collectTelemetrySnapshot(page);
    expect(snapshot2.gameplay.upgradesPurchased.fireRate).toBe(1);
    expect(snapshot2.gameplay.totalCurrencySpent).toBe(50);
    expect(snapshot2.gameplay.shotsFired).toBe(1);

    // Finalize telemetry collection
    const finalResult = await stopTelemetryAndCollectFinal(page, 'test_run_01', 1);
    expect(finalResult.runId).toBe('test_run_01');
    expect(finalResult.workerId).toBe(1);
    expect(finalResult.finalUpgrades.fireRate).toBe(1);
    expect(finalResult.finalUpgrades.totalSpent).toBe(50);
    expect(finalResult.causeOfDeath).toBe('SURVIVED');
  });

  test('3. Anomaly Watchdog Detection: NaN Coordinates, Projectile Overload, and Unhandled Rejections', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Anomaly Watchdog Test</title></head>
        <body>
          <canvas id="gameCanvas" width="600" height="800"></canvas>
          <script>
            window.gameManager = {
              state: 1,
              score: 100,
              currency: 0,
              level: 1,
              player: {
                position: { x: 275, y: 740 },
                hp: 3,
                fireRate: 0.5,
                multiShot: 1,
                piercing: 1
              },
              bullets: [],
              enemies: [],
              barricades: [],
              particles: [],
              helpers: []
            };
          </script>
        </body>
      </html>
    `);

    await attachTelemetryToPage(page, {
      projectileOverloadThreshold: 50,
      sampleIntervalMs: 20
    });

    // 1. Inject NaN coordinate
    await page.evaluate(() => {
      const g = (window as any).gameManager;
      g.player.position.x = NaN;
    });

    // 2. Trigger Overload Bullets
    await page.evaluate(() => {
      const g = (window as any).gameManager;
      g.bullets = Array.from({ length: 60 }, (_, i) => ({
        position: { x: i * 10, y: 300 },
        velocity: { x: 0, y: 200 },
        isPlayerBullet: false,
        isDead: false
      }));
    });

    const snapshot = await collectTelemetrySnapshot(page);
    expect(snapshot.anomaliesCount).toBeGreaterThanOrEqual(2);

    const finalResult = await stopTelemetryAndCollectFinal(page, 'anomaly_test_01');
    const anomalyTypes = finalResult.anomalies.map(a => a.type);
    expect(anomalyTypes).toContain('NAN_COORDINATE');
    expect(anomalyTypes).toContain('PROJECTILE_OVERLOAD');
  });

});

import type { Page } from '@playwright/test';

/**
 * Water Invader Real-Time Telemetry & Stress Metric Collector
 * 
 * Non-intrusive monitoring engine for performance, memory, Web Audio nodes,
 * entity counts, economy progression, combat metrics, and anomaly detection.
 */

export interface TelemetryOptions {
  /** Maximum number of snapshots to keep in ring buffer (default: 500) */
  snapshotBufferSize?: number;
  /** Frame drop threshold in FPS (default: 30) */
  frameDropThresholdFps?: number;
  /** Heavy stutter frame duration threshold in ms (default: 50) */
  stutterThresholdMs?: number;
  /** Projectile overload warning threshold (default: 150) */
  projectileOverloadThreshold?: number;
  /** Audio node leak warning threshold (default: 30) */
  audioNodeLeakThreshold?: number;
  /** Sample interval for snapshot recording inside page in ms (default: 100) */
  sampleIntervalMs?: number;
}

export interface PerformanceMetrics {
  currentFps: number;
  avgFps: number;
  minFps: number;
  p1LowFps: number;
  lastDeltaTimeMs: number;
  avgDeltaTimeMs: number;
  maxDeltaTimeMs: number;
  stutter33Count: number;
  stutter50Count: number;
  freeze1000Count: number;
  totalFrames: number;
}

export interface MemoryMetrics {
  usedJSHeapSizeMb: number;
  totalJSHeapSizeMb: number;
  jsHeapSizeLimitMb: number;
  heapGrowthRateMbPerMin: number;
  peakUsedHeapMb: number;
  initialUsedHeapMb: number;
}

export interface AudioMetrics {
  allocatedOscillators: number;
  activeOscillators: number;
  allocatedGains: number;
  activeGains: number;
  peakActiveNodes: number;
  isMuted: boolean;
  audioEnabled: boolean;
}

export interface EntityCounts {
  totalBullets: number;
  playerBullets: number;
  enemyBullets: number;
  totalEnemies: number;
  enemiesByType: Record<string, number>;
  totalParticles: number;
  totalHelpers: number;
  totalBarricades: number;
  stoneBarricades: number;
  iceBarricades: number;
}

export interface PlayerMetrics {
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  fireRate: number;
  multiShot: number;
  piercing: number;
  ultimateGauge: number;
  stressLevel: number;
  suppressionLevel: number;
  isShooting: boolean;
  isMovingLeft: boolean;
  isMovingRight: boolean;
}

export interface GameplayProgress {
  wave: number;
  score: number;
  combo: number;
  currency: number;
  totalCurrencyEarned: number;
  totalCurrencySpent: number;
  currencyVelocityPerSec: number;
  totalKills: number;
  killsByType: Record<string, number>;
  bossEncounters: number;
  bossKills: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  upgradesPurchased: {
    fireRate: number;
    multiShot: number;
    piercing: number;
    totalSpent: number;
  };
  skillsTriggered: {
    ultimates: number;
    allies: number;
  };
  gameState: number | string;
  isGodMode: boolean;
  isDebugMode: boolean;
}

export interface AnomalyEvent {
  timestamp: number;
  relativeTimeMs: number;
  type: 'FRAME_DROP' | 'PROJECTILE_OVERLOAD' | 'AUDIO_NODE_LEAK' | 'NAN_COORDINATE' | 'MEMORY_LEAK_SLOPE' | 'UNHANDLED_ERROR' | 'UNHANDLED_REJECTION';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  details?: any;
}

export interface TelemetrySnapshot {
  timestamp: number;
  relativeTimeMs: number;
  performance: PerformanceMetrics;
  memory: MemoryMetrics;
  audio: AudioMetrics;
  entities: EntityCounts;
  player: PlayerMetrics;
  gameplay: GameplayProgress;
  anomaliesCount: number;
}

export interface WaveHistoryEntry {
  wave: number;
  durationMs: number;
  kills: number;
  damageTaken: number;
  scoreEarned: number;
  currencyEarned: number;
  upgradesBought: number;
}

export interface SwarmRunResult {
  runId: string;
  workerId?: number;
  timestamp: string;
  durationMs: number;
  waveReached: number;
  score: number;
  finalCurrency: number;
  totalKills: number;
  killsByType: Record<string, number>;
  accuracy: number;
  causeOfDeath: 'ENEMY_BULLET' | 'DIVER_COLLISION' | 'DEFENSE_BREACH' | 'TIME_CAP_SURVIVED' | 'SURVIVED';
  rawGameOverReason: string;
  finalUpgrades: {
    fireRate: number;
    multiShot: number;
    piercing: number;
    totalSpent: number;
  };
  finalSkills: {
    ultimates: number;
    allies: number;
  };
  performanceSummary: {
    avgFps: number;
    minFps: number;
    p1LowFps: number;
    stutters33: number;
    stutters50: number;
  };
  memorySummary: {
    initialHeapMb: number;
    peakHeapMb: number;
    finalHeapMb: number;
    growthRateMbPerMin: number;
  };
  audioSummary: {
    totalAllocatedOscillators: number;
    peakActiveNodes: number;
  };
  entitySummary: {
    peakBullets: number;
    peakEnemies: number;
    peakParticles: number;
  };
  anomalies: AnomalyEvent[];
  waveHistory: WaveHistoryEntry[];
  snapshots: TelemetrySnapshot[];
}

export interface StressSummaryStatistics {
  totalRuns: number;
  totalDurationMs: number;
  survivalTime: {
    avgMs: number;
    medianMs: number;
    minMs: number;
    maxMs: number;
    stdDevMs: number;
    ci95LowerMs: number;
    ci95UpperMs: number;
  };
  waveStats: {
    avgWave: number;
    medianWave: number;
    maxWave: number;
    waveDistribution: Record<number, number>;
  };
  performanceStats: {
    overallAvgFps: number;
    overallMinFps: number;
    avg1PercentLowFps: number;
    totalStutters33: number;
    totalStutters50: number;
  };
  memoryStats: {
    avgPeakHeapMb: number;
    maxPeakHeapMb: number;
    avgGrowthRateMbPerMin: number;
    memoryLeakDetected: boolean;
  };
  audioStats: {
    totalOscillatorsCreated: number;
    maxActiveNodesObserved: number;
    audioLeakDetected: boolean;
  };
  weaponEvolution: {
    fireRateMaxedRate: number;
    multiShotMaxedRate: number;
    piercingPurchasedRate: number;
    avgTotalSpent: number;
  };
  combatStats: {
    avgScore: number;
    avgKills: number;
    avgAccuracy: number;
    avgUltimatesCast: number;
    avgAlliesSummoned: number;
  };
  deathCauseDistribution: Record<string, { count: number; percentage: number }>;
  anomalySummary: {
    totalAnomalies: number;
    breakdownByType: Record<string, number>;
    crashFreePercentage: number;
  };
}

export interface StressReportData {
  metadata: {
    title: string;
    timestamp: string;
    totalWorkers: number;
    totalRuns: number;
    configuration?: any;
  };
  summary: StressSummaryStatistics;
  runs: SwarmRunResult[];
}

/**
 * In-Page Telemetry Script definition
 */
const IN_PAGE_TELEMETRY_SCRIPT = `
(function() {
  if (window.__waterInvaderTelemetry) {
    return;
  }

  var options = window.__telemetryOptions || {};
  var snapshotBufferSize = options.snapshotBufferSize || 500;
  var frameDropThresholdFps = options.frameDropThresholdFps || 30;
  var stutterThresholdMs = options.stutterThresholdMs || 50;
  var projectileOverloadThreshold = options.projectileOverloadThreshold || 150;
  var audioNodeLeakThreshold = options.audioNodeLeakThreshold || 30;
  var sampleIntervalMs = options.sampleIntervalMs || 100;

  var startTime = performance.now();
  var frameTimes = [];
  var lastFrameTime = performance.now();
  var totalFramesCount = 0;
  var stutter33Count = 0;
  var stutter50Count = 0;
  var freeze1000Count = 0;
  var minFpsRecorded = 999;
  var initialHeapMb = 0;
  var peakHeapMb = 0;

  // Track Web Audio nodes
  var audioTracker = {
    allocatedOscillators: 0,
    activeOscillators: 0,
    allocatedGains: 0,
    activeGains: 0,
    peakActiveNodes: 0
  };

  try {
    var OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    if (OriginalAudioContext && !window.__audioContextHooked) {
      window.__audioContextHooked = true;
      var origCreateOsc = OriginalAudioContext.prototype.createOscillator;
      OriginalAudioContext.prototype.createOscillator = function() {
        var osc = origCreateOsc.apply(this, arguments);
        audioTracker.allocatedOscillators++;
        audioTracker.activeOscillators++;
        var currentActive = audioTracker.activeOscillators + audioTracker.activeGains;
        if (currentActive > audioTracker.peakActiveNodes) {
          audioTracker.peakActiveNodes = currentActive;
        }

        var onEndedClean = function() {
          if (osc.__cleaned) return;
          osc.__cleaned = true;
          audioTracker.activeOscillators = Math.max(0, audioTracker.activeOscillators - 1);
        };

        osc.addEventListener('ended', onEndedClean);
        var origDisconnect = osc.disconnect;
        osc.disconnect = function() {
          onEndedClean();
          return origDisconnect.apply(this, arguments);
        };
        return osc;
      };

      var origCreateGain = OriginalAudioContext.prototype.createGain;
      OriginalAudioContext.prototype.createGain = function() {
        var gain = origCreateGain.apply(this, arguments);
        audioTracker.allocatedGains++;
        audioTracker.activeGains++;
        var currentActive = audioTracker.activeOscillators + audioTracker.activeGains;
        if (currentActive > audioTracker.peakActiveNodes) {
          audioTracker.peakActiveNodes = currentActive;
        }

        var origGainDisconnect = gain.disconnect;
        gain.disconnect = function() {
          if (!gain.__cleaned) {
            gain.__cleaned = true;
            audioTracker.activeGains = Math.max(0, audioTracker.activeGains - 1);
          }
          return origGainDisconnect.apply(this, arguments);
        };
        return gain;
      };
    }
  } catch (e) {
    console.warn('[Telemetry] Audio hook error:', e);
  }

  // Memory baseline
  if (window.performance && (window.performance).memory) {
    var mem = (window.performance).memory;
    initialHeapMb = Math.round((mem.usedJSHeapSize / 1048576) * 10) / 10;
    peakHeapMb = initialHeapMb;
  }

  var anomalies = [];
  function recordAnomaly(type, severity, message, details) {
    var now = performance.now();
    anomalies.push({
      timestamp: Date.now(),
      relativeTimeMs: Math.round(now - startTime),
      type: type,
      severity: severity,
      message: message,
      details: details
    });
  }

  window.addEventListener('error', function(e) {
    recordAnomaly('UNHANDLED_ERROR', 'CRITICAL', e.message || 'Window error', {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno
    });
  });

  window.addEventListener('unhandledrejection', function(e) {
    recordAnomaly('UNHANDLED_REJECTION', 'CRITICAL', e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled rejection', {
      reason: String(e.reason)
    });
  });

  // RAF loop for FPS & Delta times
  var rollingDeltas = [];
  var rafId = null;
  function onFrame(now) {
    totalFramesCount++;
    var dt = now - lastFrameTime;
    lastFrameTime = now;

    if (dt > 0) {
      rollingDeltas.push(dt);
      if (rollingDeltas.length > 300) rollingDeltas.shift();

      var instantFps = 1000 / dt;
      if (instantFps < minFpsRecorded && totalFramesCount > 10) {
        minFpsRecorded = instantFps;
      }

      if (dt >= 1000) {
        freeze1000Count++;
        recordAnomaly('FRAME_DROP', 'CRITICAL', 'Engine freeze detected (>1000ms frame time)', { dt: dt });
      } else if (dt >= stutterThresholdMs) {
        stutter50Count++;
        recordAnomaly('FRAME_DROP', 'WARNING', 'Severe frame stutter (>' + stutterThresholdMs + 'ms)', { dt: dt });
      } else if (dt >= 33.3) {
        stutter33Count++;
      }
    }

    rafId = requestAnimationFrame(onFrame);
  }
  rafId = requestAnimationFrame(onFrame);

  // Gameplay metrics state
  var shotsFiredCount = 0;
  var shotsHitCount = 0;
  var totalDamageTaken = 0;
  var totalCurrencyEarned = 0;
  var totalCurrencySpent = 0;
  var bossEncountersCount = 0;
  var bossKillsCount = 0;
  var killBreakdown = {
    NORMAL: 0,
    ZIGZAG: 0,
    BOSS: 0,
    SNIPER: 0,
    DIVER: 0,
    SHIELDED: 0,
    SPLITTER: 0
  };
  var upgradesTracker = {
    fireRate: 0,
    multiShot: 0,
    piercing: 0,
    totalSpent: 0
  };
  var skillsTracker = {
    ultimates: 0,
    allies: 0
  };

  var waveHistory = [];
  var currentWave = 1;
  var waveStartTime = performance.now();
  var waveKills = 0;
  var waveDamage = 0;
  var waveScoreStart = 0;
  var waveCurrencyStart = 0;
  var waveUpgrades = 0;

  var hookedGameManager = null;
  function hookGameManager(game) {
    if (!game || game.__telemetryHooked) return;
    game.__telemetryHooked = true;
    hookedGameManager = game;

    currentWave = game.level || 1;
    waveScoreStart = game.score || 0;
    waveCurrencyStart = game.currency || 0;
    var lastHp = game.player ? game.player.hp : 3;

    var origOnHpChange = game.onPlayerHpChange;
    game.onPlayerHpChange = function(hp) {
      if (hp < lastHp) {
        var diff = lastHp - hp;
        totalDamageTaken += diff;
        waveDamage += diff;
      }
      lastHp = hp;
      if (origOnHpChange) origOnHpChange.apply(this, arguments);
    };

    var origHandleEnemyKill = game.handleEnemyKill ? game.handleEnemyKill.bind(game) : null;
    if (origHandleEnemyKill) {
      game.handleEnemyKill = function(enemy) {
        waveKills++;
        shotsHitCount++;
        if (enemy && enemy.type !== undefined) {
          var typeNames = ['NORMAL', 'ZIGZAG', 'BOSS', 'SNIPER', 'DIVER', 'SHIELDED', 'SPLITTER'];
          var name = typeNames[enemy.type] || 'NORMAL';
          killBreakdown[name] = (killBreakdown[name] || 0) + 1;
          if (enemy.type === 2) {
            bossKillsCount++;
          }
        }
        return origHandleEnemyKill.apply(this, arguments);
      };
    }

    if (game.player && game.player.fire) {
      var origPlayerFire = game.player.fire.bind(game.player);
      game.player.fire = function() {
        var bullets = origPlayerFire.apply(this, arguments);
        if (bullets && bullets.length > 0) {
          shotsFiredCount += bullets.length;
        }
        return bullets;
      };
    }

    var origUpgradeFireRate = game.upgradeFireRate ? game.upgradeFireRate.bind(game) : null;
    if (origUpgradeFireRate) {
      game.upgradeFireRate = function() {
        var prevCurr = game.currency;
        origUpgradeFireRate.apply(this, arguments);
        if (game.currency < prevCurr) {
          var cost = prevCurr - game.currency;
          upgradesTracker.fireRate++;
          upgradesTracker.totalSpent += cost;
          totalCurrencySpent += cost;
          waveUpgrades++;
        }
      };
    }

    var origUpgradeMultiShot = game.upgradeMultiShot ? game.upgradeMultiShot.bind(game) : null;
    if (origUpgradeMultiShot) {
      game.upgradeMultiShot = function() {
        var prevCurr = game.currency;
        origUpgradeMultiShot.apply(this, arguments);
        if (game.currency < prevCurr) {
          var cost = prevCurr - game.currency;
          upgradesTracker.multiShot++;
          upgradesTracker.totalSpent += cost;
          totalCurrencySpent += cost;
          waveUpgrades++;
        }
      };
    }

    var origUpgradePiercing = game.upgradePiercing ? game.upgradePiercing.bind(game) : null;
    if (origUpgradePiercing) {
      game.upgradePiercing = function() {
        var prevCurr = game.currency;
        origUpgradePiercing.apply(this, arguments);
        if (game.currency < prevCurr) {
          var cost = prevCurr - game.currency;
          upgradesTracker.piercing++;
          upgradesTracker.totalSpent += cost;
          totalCurrencySpent += cost;
          waveUpgrades++;
        }
      };
    }

    var origTriggerUltimate = game.triggerUltimate ? game.triggerUltimate.bind(game) : null;
    if (origTriggerUltimate) {
      game.triggerUltimate = function() {
        if (game.player && game.player.ultimateGauge >= 100) {
          skillsTracker.ultimates++;
        }
        return origTriggerUltimate.apply(this, arguments);
      };
    }

    var origTriggerSummonAlly = game.triggerSummonAlly ? game.triggerSummonAlly.bind(game) : null;
    if (origTriggerSummonAlly) {
      game.triggerSummonAlly = function() {
        var prevCurr = game.currency;
        origTriggerSummonAlly.apply(this, arguments);
        if (game.currency < prevCurr) {
          skillsTracker.allies++;
          totalCurrencySpent += (prevCurr - game.currency);
        }
      };
    }
  }

  if (window.gameManager) {
    hookGameManager(window.gameManager);
  }

  // Periodic Snapshot Ring Buffer & Anomaly Checker
  var snapshots = [];
  var peakBulletsCount = 0;
  var peakEnemiesCount = 0;
  var peakParticlesCount = 0;

  function evaluatePerformance() {
    var n = rollingDeltas.length;
    var avgDt = n > 0 ? rollingDeltas.reduce(function(a, b) { return a + b; }, 0) / n : 16.67;
    var avgFps = avgDt > 0 ? 1000 / avgDt : 60;
    var lastDt = n > 0 ? rollingDeltas[n - 1] : 16.67;
    var currentFps = lastDt > 0 ? 1000 / lastDt : 60;
    var maxDt = n > 0 ? Math.max.apply(null, rollingDeltas) : 16.67;

    var sortedDeltas = rollingDeltas.slice().sort(function(a, b) { return b - a; });
    var p1Index = Math.max(0, Math.floor(sortedDeltas.length * 0.01));
    var p1Delta = sortedDeltas.length > 0 ? sortedDeltas[p1Index] : 16.67;
    var p1LowFps = p1Delta > 0 ? 1000 / p1Delta : 60;

    return {
      currentFps: Math.round(currentFps * 10) / 10,
      avgFps: Math.round(avgFps * 10) / 10,
      minFps: minFpsRecorded === 999 ? Math.round(avgFps * 10) / 10 : Math.round(minFpsRecorded * 10) / 10,
      p1LowFps: Math.round(p1LowFps * 10) / 10,
      lastDeltaTimeMs: Math.round(lastDt * 10) / 10,
      avgDeltaTimeMs: Math.round(avgDt * 10) / 10,
      maxDeltaTimeMs: Math.round(maxDt * 10) / 10,
      stutter33Count: stutter33Count,
      stutter50Count: stutter50Count,
      freeze1000Count: freeze1000Count,
      totalFrames: totalFramesCount
    };
  }

  function evaluateMemory() {
    var used = 0, total = 0, limit = 0;
    if (window.performance && (window.performance).memory) {
      var mem = (window.performance).memory;
      used = Math.round((mem.usedJSHeapSize / 1048576) * 10) / 10;
      total = Math.round((mem.totalJSHeapSize / 1048576) * 10) / 10;
      limit = Math.round((mem.jsHeapSizeLimit / 1048576) * 10) / 10;
      if (used > peakHeapMb) peakHeapMb = used;
    }
    var elapsedMin = (performance.now() - startTime) / 60000;
    var growthRate = elapsedMin > 0.05 ? (used - initialHeapMb) / elapsedMin : 0;

    return {
      usedJSHeapSizeMb: used,
      totalJSHeapSizeMb: total,
      jsHeapSizeLimitMb: limit,
      heapGrowthRateMbPerMin: Math.round(growthRate * 10) / 10,
      peakUsedHeapMb: peakHeapMb,
      initialUsedHeapMb: initialHeapMb
    };
  }

  function buildSnapshot() {
    var game = window.gameManager || hookedGameManager || {};
    if (game && !game.__telemetryHooked) {
      hookGameManager(game);
    }

    var now = performance.now();
    var perf = evaluatePerformance();
    var mem = evaluateMemory();

    // Check wave transitions
    if (game.level && game.level !== currentWave) {
      waveHistory.push({
        wave: currentWave,
        durationMs: Math.round(now - waveStartTime),
        kills: waveKills,
        damageTaken: waveDamage,
        scoreEarned: (game.score || 0) - waveScoreStart,
        currencyEarned: (game.currency || 0) + totalCurrencySpent - waveCurrencyStart,
        upgradesBought: waveUpgrades
      });
      currentWave = game.level;
      waveStartTime = now;
      waveKills = 0;
      waveDamage = 0;
      waveScoreStart = game.score || 0;
      waveCurrencyStart = (game.currency || 0) + totalCurrencySpent;
      waveUpgrades = 0;
    }

    var p = game.player || {};
    var px = p.position ? p.position.x : (p.x !== undefined ? p.x : 275);
    var py = p.position ? p.position.y : (p.y !== undefined ? p.y : 740);

    // Coordinate NaN Watchdog
    if (Number.isNaN(px) || Number.isNaN(py) || !Number.isFinite(px) || !Number.isFinite(py)) {
      recordAnomaly('NAN_COORDINATE', 'CRITICAL', 'Player coordinates contains NaN or Non-finite values', { x: px, y: py });
    }

    var bulletsArr = Array.isArray(game.bullets) ? game.bullets : [];
    var playerBulletsCount = 0;
    var enemyBulletsCount = 0;
    for (var bi = 0; bi < bulletsArr.length; bi++) {
      var b = bulletsArr[bi];
      if (!b || b.isDead) continue;
      if (b.isPlayerBullet) playerBulletsCount++;
      else enemyBulletsCount++;
      var bx = b.position ? b.position.x : b.x;
      var by = b.position ? b.position.y : b.y;
      if (Number.isNaN(bx) || Number.isNaN(by)) {
        recordAnomaly('NAN_COORDINATE', 'WARNING', 'Bullet coordinates contains NaN', { x: bx, y: by });
      }
    }
    var totalBulletsActive = playerBulletsCount + enemyBulletsCount;
    if (totalBulletsActive > peakBulletsCount) peakBulletsCount = totalBulletsActive;
    if (totalBulletsActive > projectileOverloadThreshold) {
      recordAnomaly('PROJECTILE_OVERLOAD', 'WARNING', 'Active bullets exceeded threshold (' + totalBulletsActive + ' > ' + projectileOverloadThreshold + ')', { count: totalBulletsActive });
    }

    var enemiesArr = Array.isArray(game.enemies) ? game.enemies : [];
    var enemiesByType = { NORMAL: 0, ZIGZAG: 0, BOSS: 0, SNIPER: 0, DIVER: 0, SHIELDED: 0, SPLITTER: 0 };
    var activeEnemiesCount = 0;
    var hasBossNow = false;
    for (var ei = 0; ei < enemiesArr.length; ei++) {
      var e = enemiesArr[ei];
      if (!e || e.isDead || (e.hp !== undefined && e.hp <= 0)) continue;
      activeEnemiesCount++;
      var typeNames = ['NORMAL', 'ZIGZAG', 'BOSS', 'SNIPER', 'DIVER', 'SHIELDED', 'SPLITTER'];
      var tname = typeNames[e.type] || 'NORMAL';
      enemiesByType[tname] = (enemiesByType[tname] || 0) + 1;
      if (e.type === 2) hasBossNow = true;
    }
    if (hasBossNow && bossEncountersCount === 0) {
      bossEncountersCount = 1;
    }
    if (activeEnemiesCount > peakEnemiesCount) peakEnemiesCount = activeEnemiesCount;

    var particlesArr = Array.isArray(game.particles) ? game.particles : [];
    var activeParticlesCount = 0;
    for (var pi = 0; pi < particlesArr.length; pi++) {
      if (particlesArr[pi] && !particlesArr[pi].isDead) activeParticlesCount++;
    }
    if (activeParticlesCount > peakParticlesCount) peakParticlesCount = activeParticlesCount;

    var helpersArr = Array.isArray(game.helpers) ? game.helpers : [];
    var activeHelpersCount = 0;
    for (var hi = 0; hi < helpersArr.length; hi++) {
      if (helpersArr[hi] && !helpersArr[hi].isDead) activeHelpersCount++;
    }

    var barricadesArr = Array.isArray(game.barricades) ? game.barricades : [];
    var stoneCount = 0;
    var iceCount = 0;
    for (var bari = 0; bari < barricadesArr.length; bari++) {
      var bar = barricadesArr[bari];
      if (!bar || bar.isDead) continue;
      if (bar.type === 1) stoneCount++;
      else if (bar.type === 0 && bar.hp > 0) iceCount++;
    }

    // Audio node leak watchdog
    var totalActiveAudio = audioTracker.activeOscillators + audioTracker.activeGains;
    if (totalActiveAudio > audioNodeLeakThreshold) {
      recordAnomaly('AUDIO_NODE_LEAK', 'WARNING', 'Active Web Audio nodes exceeded threshold (' + totalActiveAudio + ' > ' + audioNodeLeakThreshold + ')', { count: totalActiveAudio });
    }

    var accuracy = shotsFiredCount > 0 ? Math.round((shotsHitCount / shotsFiredCount) * 1000) / 10 : 0;
    var totalKillsAll = Object.values(killBreakdown).reduce(function(a, b) { return a + b; }, 0);
    var elapsedSec = Math.max(0.1, (now - startTime) / 1000);
    var currencyVelocity = Math.round(((game.currency || 0) + totalCurrencySpent) / elapsedSec * 10) / 10;

    var snapshot = {
      timestamp: Date.now(),
      relativeTimeMs: Math.round(now - startTime),
      performance: perf,
      memory: mem,
      audio: {
        allocatedOscillators: audioTracker.allocatedOscillators,
        activeOscillators: audioTracker.activeOscillators,
        allocatedGains: audioTracker.allocatedGains,
        activeGains: audioTracker.activeGains,
        peakActiveNodes: audioTracker.peakActiveNodes,
        isMuted: !!(window.soundManager && window.soundManager.isMuted),
        audioEnabled: !!(window.soundManager && window.soundManager.enabled)
      },
      entities: {
        totalBullets: totalBulletsActive,
        playerBullets: playerBulletsCount,
        enemyBullets: enemyBulletsCount,
        totalEnemies: activeEnemiesCount,
        enemiesByType: enemiesByType,
        totalParticles: activeParticlesCount,
        totalHelpers: activeHelpersCount,
        totalBarricades: stoneCount + iceCount,
        stoneBarricades: stoneCount,
        iceBarricades: iceCount
      },
      player: {
        hp: p.hp !== undefined ? p.hp : 3,
        maxHp: p.maxHp !== undefined ? p.maxHp : 5,
        x: px,
        y: py,
        fireRate: p.fireRate !== undefined ? p.fireRate : (p.baseFireRate || 0.5),
        multiShot: p.multiShot !== undefined ? p.multiShot : 1,
        piercing: p.piercing !== undefined ? p.piercing : 1,
        ultimateGauge: p.ultimateGauge !== undefined ? p.ultimateGauge : 0,
        stressLevel: p.stressLevel !== undefined ? p.stressLevel : 0,
        suppressionLevel: p.suppressionLevel !== undefined ? p.suppressionLevel : 0,
        isShooting: !!p.isShooting,
        isMovingLeft: !!p.isMovingLeft,
        isMovingRight: !!p.isMovingRight
      },
      gameplay: {
        wave: game.level || 1,
        score: game.score || 0,
        combo: game.combo || 0,
        currency: game.currency || 0,
        totalCurrencyEarned: (game.currency || 0) + totalCurrencySpent,
        totalCurrencySpent: totalCurrencySpent,
        currencyVelocityPerSec: currencyVelocity,
        totalKills: totalKillsAll,
        killsByType: Object.assign({}, killBreakdown),
        bossEncounters: bossEncountersCount,
        bossKills: bossKillsCount,
        shotsFired: shotsFiredCount,
        shotsHit: shotsHitCount,
        accuracy: accuracy,
        upgradesPurchased: Object.assign({}, upgradesTracker),
        skillsTriggered: Object.assign({}, skillsTracker),
        gameState: game.state !== undefined ? game.state : 1,
        isGodMode: !!game.isGodMode,
        isDebugMode: !!game.isDebugMode
      },
      anomaliesCount: anomalies.length
    };

    snapshots.push(snapshot);
    if (snapshots.length > snapshotBufferSize) {
      snapshots.shift();
    }

    return snapshot;
  }

  var intervalId = setInterval(buildSnapshot, sampleIntervalMs);

  window.__waterInvaderTelemetry = {
    getSnapshot: function() {
      return buildSnapshot();
    },
    getSnapshots: function() {
      return snapshots.slice();
    },
    getAnomalies: function() {
      return anomalies.slice();
    },
    finalize: function(runId, workerId) {
      clearInterval(intervalId);
      if (rafId) cancelAnimationFrame(rafId);

      var finalSnapshot = buildSnapshot();
      var now = performance.now();
      var durationMs = Math.round(now - startTime);
      var game = window.gameManager || hookedGameManager || {};

      // Final wave push
      waveHistory.push({
        wave: currentWave,
        durationMs: Math.round(now - waveStartTime),
        kills: waveKills,
        damageTaken: waveDamage,
        scoreEarned: (game.score || 0) - waveScoreStart,
        currencyEarned: (game.currency || 0) + totalCurrencySpent - waveCurrencyStart,
        upgradesBought: waveUpgrades
      });

      var cause = 'SURVIVED';
      var reason = game.gameOverReason || '';
      if (game.state === 2 || game.state === 'GAME_OVER') {
        if (reason.includes('돌파')) {
          cause = 'DEFENSE_BREACH';
        } else if (reason.includes('정수기능이 파괴') || reason.includes('충돌')) {
          cause = 'DIVER_COLLISION';
        } else {
          cause = 'ENEMY_BULLET';
        }
      }

      var perf = evaluatePerformance();
      var mem = evaluateMemory();

      var result = {
        runId: runId || 'run_' + Date.now(),
        workerId: workerId !== undefined ? workerId : 0,
        timestamp: new Date().toISOString(),
        durationMs: durationMs,
        waveReached: game.level || 1,
        score: game.score || 0,
        finalCurrency: game.currency || 0,
        totalKills: Object.values(killBreakdown).reduce(function(a, b) { return a + b; }, 0),
        killsByType: Object.assign({}, killBreakdown),
        accuracy: shotsFiredCount > 0 ? Math.round((shotsHitCount / shotsFiredCount) * 1000) / 10 : 0,
        causeOfDeath: cause,
        rawGameOverReason: reason,
        finalUpgrades: Object.assign({}, upgradesTracker),
        finalSkills: Object.assign({}, skillsTracker),
        performanceSummary: {
          avgFps: perf.avgFps,
          minFps: perf.minFps,
          p1LowFps: perf.p1LowFps,
          stutters33: perf.stutter33Count,
          stutters50: perf.stutter50Count
        },
        memorySummary: {
          initialHeapMb: mem.initialUsedHeapMb,
          peakHeapMb: mem.peakUsedHeapMb,
          finalHeapMb: mem.usedJSHeapSizeMb,
          growthRateMbPerMin: mem.heapGrowthRateMbPerMin
        },
        audioSummary: {
          totalAllocatedOscillators: audioTracker.allocatedOscillators,
          peakActiveNodes: audioTracker.peakActiveNodes
        },
        entitySummary: {
          peakBullets: peakBulletsCount,
          peakEnemies: peakEnemiesCount,
          peakParticles: peakParticlesCount
        },
        anomalies: anomalies.slice(),
        waveHistory: waveHistory,
        snapshots: snapshots.slice()
      };

      return result;
    }
  };
})();
`;

/**
 * Attaches the non-intrusive telemetry monitoring hooks to a Playwright page.
 */
export async function attachTelemetryToPage(
  page: Page,
  options?: TelemetryOptions
): Promise<void> {
  await page.evaluate((opts) => {
    (window as any).__telemetryOptions = opts;
  }, options || {});

  await page.evaluate(IN_PAGE_TELEMETRY_SCRIPT);
}

/** Alias for attachTelemetryToPage */
export const attachTelemetry = attachTelemetryToPage;

/**
 * Collects a real-time point-in-time telemetry snapshot from the page.
 */
export async function collectTelemetrySnapshot(page: Page): Promise<TelemetrySnapshot> {
  return page.evaluate(() => {
    const tel = (window as any).__waterInvaderTelemetry;
    if (!tel) {
      throw new Error('Telemetry collector is not attached to this page. Call attachTelemetryToPage first.');
    }
    return tel.getSnapshot();
  });
}

/** Alias for collectTelemetrySnapshot */
export const getTelemetrySnapshot = collectTelemetrySnapshot;

/**
 * Stops telemetry collection and retrieves the complete SwarmRunResult from the page.
 */
export async function stopTelemetryAndCollectFinal(
  page: Page,
  runId?: string,
  workerId?: number
): Promise<SwarmRunResult> {
  return page.evaluate((params) => {
    const tel = (window as any).__waterInvaderTelemetry;
    if (!tel) {
      throw new Error('Telemetry collector is not attached to this page.');
    }
    return tel.finalize(params.runId, params.workerId);
  }, { runId, workerId });
}

/**
 * Computes aggregate stress summary statistics across an array of SwarmRunResults.
 */
export function computeStressSummary(runs: SwarmRunResult[]): StressSummaryStatistics {
  const n = runs.length;
  if (n === 0) {
    throw new Error('Cannot compute stress summary statistics on empty runs array.');
  }

  const durations = runs.map(r => r.durationMs).sort((a, b) => a - b);
  const totalDurationMs = durations.reduce((a, b) => a + b, 0);
  const avgDurationMs = totalDurationMs / n;
  const medianDurationMs = n % 2 === 1
    ? durations[Math.floor(n / 2)]
    : (durations[n / 2 - 1] + durations[n / 2]) / 2;
  const minDurationMs = durations[0];
  const maxDurationMs = durations[n - 1];

  const variance = durations.reduce((acc, d) => acc + (d - avgDurationMs) ** 2, 0) / (n > 1 ? n - 1 : 1);
  const stdDevDurationMs = Math.sqrt(variance);

  // Student's t 95% Confidence Interval
  const tCritical = n === 1 ? 12.71 : n === 2 ? 4.303 : n === 4 ? 3.182 : n === 8 ? 2.365 : n === 10 ? 2.262 : n > 30 ? 1.96 : 2.0;
  const marginOfError = (tCritical * stdDevDurationMs) / Math.sqrt(n);
  const ci95LowerMs = Math.max(0, avgDurationMs - marginOfError);
  const ci95UpperMs = avgDurationMs + marginOfError;

  const waves = runs.map(r => r.waveReached).sort((a, b) => a - b);
  const avgWave = waves.reduce((a, b) => a + b, 0) / n;
  const medianWave = n % 2 === 1 ? waves[Math.floor(n / 2)] : (waves[n / 2 - 1] + waves[n / 2]) / 2;
  const maxWave = waves[n - 1];

  const waveDistribution: Record<number, number> = {};
  runs.forEach(r => {
    waveDistribution[r.waveReached] = (waveDistribution[r.waveReached] || 0) + 1;
  });

  const overallAvgFps = runs.reduce((acc, r) => acc + r.performanceSummary.avgFps, 0) / n;
  const overallMinFps = Math.min(...runs.map(r => r.performanceSummary.minFps));
  const avg1PercentLowFps = runs.reduce((acc, r) => acc + r.performanceSummary.p1LowFps, 0) / n;
  const totalStutters33 = runs.reduce((acc, r) => acc + r.performanceSummary.stutters33, 0);
  const totalStutters50 = runs.reduce((acc, r) => acc + r.performanceSummary.stutters50, 0);

  const avgPeakHeapMb = runs.reduce((acc, r) => acc + r.memorySummary.peakHeapMb, 0) / n;
  const maxPeakHeapMb = Math.max(...runs.map(r => r.memorySummary.peakHeapMb));
  const avgGrowthRateMbPerMin = runs.reduce((acc, r) => acc + r.memorySummary.growthRateMbPerMin, 0) / n;
  const memoryLeakDetected = avgGrowthRateMbPerMin > 15.0;

  const totalOscillatorsCreated = runs.reduce((acc, r) => acc + r.audioSummary.totalAllocatedOscillators, 0);
  const maxActiveNodesObserved = Math.max(...runs.map(r => r.audioSummary.peakActiveNodes));
  const audioLeakDetected = maxActiveNodesObserved > 40;

  const fireRateMaxedRuns = runs.filter(r => r.finalUpgrades.fireRate >= 4).length;
  const multiShotMaxedRuns = runs.filter(r => r.finalUpgrades.multiShot >= 4).length;
  const piercingBoughtRuns = runs.filter(r => r.finalUpgrades.piercing >= 1).length;
  const avgTotalSpent = runs.reduce((acc, r) => acc + r.finalUpgrades.totalSpent, 0) / n;

  const avgScore = runs.reduce((acc, r) => acc + r.score, 0) / n;
  const avgKills = runs.reduce((acc, r) => acc + r.totalKills, 0) / n;
  const avgAccuracy = runs.reduce((acc, r) => acc + r.accuracy, 0) / n;
  const avgUltimates = runs.reduce((acc, r) => acc + r.finalSkills.ultimates, 0) / n;
  const avgAllies = runs.reduce((acc, r) => acc + r.finalSkills.allies, 0) / n;

  const deathCauseDistribution: Record<string, { count: number; percentage: number }> = {};
  runs.forEach(r => {
    const c = r.causeOfDeath;
    if (!deathCauseDistribution[c]) {
      deathCauseDistribution[c] = { count: 0, percentage: 0 };
    }
    deathCauseDistribution[c].count++;
  });
  Object.keys(deathCauseDistribution).forEach(k => {
    deathCauseDistribution[k].percentage = Math.round((deathCauseDistribution[k].count / n) * 1000) / 10;
  });

  const anomalyBreakdown: Record<string, number> = {};
  let totalAnomalies = 0;
  let runsWithCriticalAnomalies = 0;

  runs.forEach(r => {
    let hasCritical = false;
    (r.anomalies || []).forEach(a => {
      totalAnomalies++;
      anomalyBreakdown[a.type] = (anomalyBreakdown[a.type] || 0) + 1;
      if (a.severity === 'CRITICAL') hasCritical = true;
    });
    if (hasCritical) runsWithCriticalAnomalies++;
  });

  const crashFreePercentage = Math.round(((n - runsWithCriticalAnomalies) / n) * 1000) / 10;

  return {
    totalRuns: n,
    totalDurationMs,
    survivalTime: {
      avgMs: Math.round(avgDurationMs * 10) / 10,
      medianMs: Math.round(medianDurationMs * 10) / 10,
      minMs: Math.round(minDurationMs * 10) / 10,
      maxMs: Math.round(maxDurationMs * 10) / 10,
      stdDevMs: Math.round(stdDevDurationMs * 10) / 10,
      ci95LowerMs: Math.round(ci95LowerMs * 10) / 10,
      ci95UpperMs: Math.round(ci95UpperMs * 10) / 10
    },
    waveStats: {
      avgWave: Math.round(avgWave * 100) / 100,
      medianWave,
      maxWave,
      waveDistribution
    },
    performanceStats: {
      overallAvgFps: Math.round(overallAvgFps * 10) / 10,
      overallMinFps: Math.round(overallMinFps * 10) / 10,
      avg1PercentLowFps: Math.round(avg1PercentLowFps * 10) / 10,
      totalStutters33,
      totalStutters50
    },
    memoryStats: {
      avgPeakHeapMb: Math.round(avgPeakHeapMb * 10) / 10,
      maxPeakHeapMb: Math.round(maxPeakHeapMb * 10) / 10,
      avgGrowthRateMbPerMin: Math.round(avgGrowthRateMbPerMin * 10) / 10,
      memoryLeakDetected
    },
    audioStats: {
      totalOscillatorsCreated,
      maxActiveNodesObserved,
      audioLeakDetected
    },
    weaponEvolution: {
      fireRateMaxedRate: Math.round((fireRateMaxedRuns / n) * 1000) / 10,
      multiShotMaxedRate: Math.round((multiShotMaxedRuns / n) * 1000) / 10,
      piercingPurchasedRate: Math.round((piercingBoughtRuns / n) * 1000) / 10,
      avgTotalSpent: Math.round(avgTotalSpent * 10) / 10
    },
    combatStats: {
      avgScore: Math.round(avgScore * 10) / 10,
      avgKills: Math.round(avgKills * 10) / 10,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      avgUltimatesCast: Math.round(avgUltimates * 10) / 10,
      avgAlliesSummoned: Math.round(avgAllies * 10) / 10
    },
    deathCauseDistribution,
    anomalySummary: {
      totalAnomalies,
      breakdownByType: anomalyBreakdown,
      crashFreePercentage
    }
  };
}

/**
 * Compiles a comprehensive StressReportData object suitable for JSON export and Markdown generation.
 */
export function generateStressReportData(
  runs: SwarmRunResult[],
  options?: { title?: string; totalWorkers?: number; configuration?: any }
): StressReportData {
  const summary = computeStressSummary(runs);
  return {
    metadata: {
      title: options?.title || 'Water Invader Endless Survival Stress Test Telemetry Report',
      timestamp: new Date().toISOString(),
      totalWorkers: options?.totalWorkers || runs.length,
      totalRuns: runs.length,
      configuration: options?.configuration || {}
    },
    summary,
    runs
  };
}

/** Alias for generateStressReportData */
export const exportStressMetrics = generateStressReportData;

/**
 * Water Invader Telemetry Collector & Statistical Analysis Engine
 */

export interface WaveRecord {
  wave: number;
  durationMs: number;
  kills: number;
  damageTaken: number;
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
  totalKills: number;
  killBreakdown: Record<string, number>;
  damageTaken: number;
  causeOfDeath: 'ENEMY_BULLET' | 'DIVER_COLLISION' | 'DEFENSE_BREACH' | 'TIME_CAP_SURVIVED';
  rawGameOverReason: string;
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
  avgAccuracy: number;
  avgKills: number;
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

  // 95% Confidence Interval for Student's t-distribution
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
  const avgAccuracy = runs.reduce((acc, r) => acc + r.accuracy, 0) / n;
  const avgKills = runs.reduce((acc, r) => acc + r.totalKills, 0) / n;

  const deathCauseDistribution: Record<string, { count: number; percentage: number }> = {};
  runs.forEach(r => {
    const cause = r.causeOfDeath;
    if (!deathCauseDistribution[cause]) {
      deathCauseDistribution[cause] = { count: 0, percentage: 0 };
    }
    deathCauseDistribution[cause].count += 1;
  });

  Object.keys(deathCauseDistribution).forEach(k => {
    deathCauseDistribution[k].percentage = (deathCauseDistribution[k].count / n) * 100;
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
    avgAccuracy: Math.round(avgAccuracy * 10) / 10,
    avgKills: Math.round(avgKills * 10) / 10,
    deathCauseDistribution
  };
}

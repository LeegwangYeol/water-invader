# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: benchmark\automated_runner.spec.ts >> Automated Benchmark Suite >> Execute Baseline Benchmark (10 Automated Runs)
- Location: tests\benchmark\automated_runner.spec.ts:9:7

# Error details

```
Test timeout of 600000ms exceeded.
```

```
Error: page.evaluate: Test timeout of 600000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=f9e1]:
  - main [ref=f9e2]:
    - generic [ref=f9e3]:
      - heading "Water Invader" [level=1] [ref=f9e4]
      - paragraph [ref=f9e5]: Use Left/Right Arrows or A/D to move. Spacebar to shoot.
    - generic [ref=f9e6]:
      - generic:
        - generic:
          - 'heading "Score: 1550" [level=2]'
          - paragraph: "Pure Water: 25 💧"
          - paragraph: WAVE 1
        - generic:
          - button "Mute Sound" [ref=f9e7]: 🔊 SOUND
          - generic: 5x COMBO!
      - generic [ref=f9e11]:
        - generic [ref=f9e12]:
          - button "ALLY(Q)" [ref=f9e13]
          - button "ULT(19.5%)" [ref=f9e14]
        - button "FIRE!" [ref=f9e15]
  - button "Open Next.js Dev Tools" [ref=f9e21] [cursor=pointer]
  - alert [ref=f9e25]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import * as fs from 'fs';
  3   | import * as path from 'path';
  4   | import { RunTelemetry, BenchmarkReport, computeSummaryStatistics } from './telemetry_collector';
  5   | 
  6   | test.describe('Automated Benchmark Suite', () => {
  7   |   test.setTimeout(600000);
  8   | 
  9   |   test('Execute Baseline Benchmark (10 Automated Runs)', async ({ page }) => {
  10  |     const totalRuns = 10;
  11  |     const runs: RunTelemetry[] = [];
  12  | 
  13  |     const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
  14  |     console.log('Executing 10 Baseline Benchmark runs against ' + targetUrl + '...');
  15  | 
  16  |     for (let runIdx = 1; runIdx <= totalRuns; runIdx++) {
  17  |       console.log('[Playwright Benchmark] Starting Run ' + runIdx + '/' + totalRuns + '...');
  18  |       await page.goto(targetUrl, { waitUntil: 'networkidle' });
  19  |       await page.waitForSelector('canvas', { timeout: 15000 });
  20  | 
> 21  |       const telemetry = await page.evaluate(async (params) => {
      |                                    ^ Error: page.evaluate: Test timeout of 600000ms exceeded.
  22  |         const { runIndex } = params;
  23  |         return new Promise<RunTelemetry>((resolve) => {
  24  |           const game = (window as any).gameManager;
  25  |           if (!game) throw new Error('gameManager not found');
  26  | 
  27  |           let shotsFiredCount = 0;
  28  |           let shotsHitCount = 0;
  29  |           let totalDamageTaken = 0;
  30  |           const killBreakdown: Record<string, number> = {
  31  |             NORMAL: 0,
  32  |             ZIGZAG: 0,
  33  |             BOSS: 0,
  34  |             SNIPER: 0,
  35  |             DIVER: 0,
  36  |             SHIELDED: 0,
  37  |             SPLITTER: 0
  38  |           };
  39  | 
  40  |           const waveHistory: Array<{ wave: number; durationMs: number; kills: number; damageTaken: number }> = [];
  41  |           let currentWave = 1;
  42  |           let waveStartTime = performance.now();
  43  |           let waveKills = 0;
  44  |           let waveDamage = 0;
  45  |           let lastPlayerHp = game.player.hp;
  46  | 
  47  |           game.onPlayerHpChange = (hp: number) => {
  48  |             if (hp < lastPlayerHp) {
  49  |               const diff = lastPlayerHp - hp;
  50  |               totalDamageTaken += diff;
  51  |               waveDamage += diff;
  52  |             }
  53  |             lastPlayerHp = hp;
  54  |           };
  55  | 
  56  |           const origHandleEnemyKill = game.handleEnemyKill.bind(game);
  57  |           game.handleEnemyKill = () => {
  58  |             waveKills++;
  59  |             shotsHitCount++;
  60  |             origHandleEnemyKill();
  61  |           };
  62  | 
  63  |           const origPlayerFire = game.player.fire.bind(game.player);
  64  |           game.player.fire = () => {
  65  |             const bullets = origPlayerFire();
  66  |             if (bullets && bullets.length > 0) {
  67  |               shotsFiredCount += bullets.length;
  68  |             }
  69  |             return bullets;
  70  |           };
  71  | 
  72  |           game.init();
  73  |           lastPlayerHp = game.player.hp;
  74  |           const startTime = performance.now();
  75  |           game.startGame();
  76  | 
  77  |           let botInterval: any = null;
  78  |           let isDone = false;
  79  | 
  80  |           const finalizeTelemetry = (causeOverride?: 'TIME_CAP_SURVIVED') => {
  81  |             if (isDone) return;
  82  |             isDone = true;
  83  |             if (botInterval) clearInterval(botInterval);
  84  | 
  85  |             const endTime = performance.now();
  86  |             const durationMs = endTime - startTime;
  87  | 
  88  |             waveHistory.push({
  89  |               wave: currentWave,
  90  |               durationMs: endTime - waveStartTime,
  91  |               kills: waveKills,
  92  |               damageTaken: waveDamage
  93  |             });
  94  | 
  95  |             let cause: 'ENEMY_BULLET' | 'DIVER_COLLISION' | 'DEFENSE_BREACH' | 'TIME_CAP_SURVIVED' = 'ENEMY_BULLET';
  96  |             const reason = game.gameOverReason || '';
  97  | 
  98  |             if (causeOverride === 'TIME_CAP_SURVIVED') {
  99  |               cause = 'TIME_CAP_SURVIVED';
  100 |             } else if (reason.includes('돌파')) {
  101 |               cause = 'DEFENSE_BREACH';
  102 |             } else if (reason.includes('정수기능이 파괴')) {
  103 |               cause = 'DIVER_COLLISION';
  104 |             } else {
  105 |               cause = 'ENEMY_BULLET';
  106 |             }
  107 | 
  108 |             const accuracy = shotsFiredCount > 0 ? (shotsHitCount / shotsFiredCount) * 100 : 0;
  109 |             const totalKills = Object.values(killBreakdown).reduce((a, b) => a + b, 0) + waveKills;
  110 | 
  111 |             const result: RunTelemetry = {
  112 |               runId: 'run_' + String(runIndex).padStart(2, '0'),
  113 |               timestamp: new Date().toISOString(),
  114 |               durationMs: Math.round(durationMs),
  115 |               waveReached: game.level,
  116 |               score: game.score,
  117 |               currency: game.currency,
  118 |               shotsFired: shotsFiredCount,
  119 |               shotsHit: shotsHitCount,
  120 |               accuracy: Math.round(accuracy * 10) / 10,
  121 |               totalKills,
```
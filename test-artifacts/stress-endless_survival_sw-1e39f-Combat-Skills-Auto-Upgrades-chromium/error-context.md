# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stress/endless_survival_swarm.spec.ts >> Water Invader Endless Survival Swarm Stress Test Suite >> SWARM-1: Autonomous Survival Swarm Bot - Deep Wave Combat, Skills & Auto-Upgrades
- Location: tests/stress/endless_survival_swarm.spec.ts:18:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import * as fs from 'fs';
  3   | import * as path from 'path';
  4   | import {
  5   |   attachTelemetryToPage,
  6   |   collectTelemetrySnapshot,
  7   |   stopTelemetryAndCollectFinal,
  8   |   generateStressReportData,
  9   |   SwarmRunResult
  10  | } from './telemetry_stress_collector';
  11  | import { injectSwarmBot } from './swarm_bot_engine';
  12  | 
  13  | test.describe('Water Invader Endless Survival Swarm Stress Test Suite', () => {
  14  |   test.setTimeout(120000);
  15  | 
  16  |   const targetUrl = process.env.TARGET_URL || '/';
  17  | 
  18  |   test('SWARM-1: Autonomous Survival Swarm Bot - Deep Wave Combat, Skills & Auto-Upgrades', async ({ page }) => {
  19  |     console.log(`[SWARM-1] Navigating to ${targetUrl}...`);
> 20  |     await page.goto(targetUrl);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  21  |     await page.waitForLoadState('networkidle');
  22  | 
  23  |     // Attach Telemetry Collector
  24  |     await attachTelemetryToPage(page, {
  25  |       sampleIntervalMs: 50,
  26  |       frameDropThresholdFps: 30,
  27  |       projectileOverloadThreshold: 150
  28  |     });
  29  | 
  30  |     // Start Game
  31  |     const startButton = page.locator('button', { hasText: /START GAME|게임 시작/i });
  32  |     if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
  33  |       await startButton.click();
  34  |     } else {
  35  |       await page.evaluate(() => {
  36  |         const gm = (window as any).gameManager;
  37  |         if (gm) {
  38  |           gm.init();
  39  |           gm.startGame();
  40  |         }
  41  |       });
  42  |     }
  43  | 
  44  |     await page.waitForTimeout(500);
  45  | 
  46  |     // Inject SwarmBotEngine into in-page GameManager
  47  |     await page.evaluate(() => {
  48  |       const gm = (window as any).gameManager;
  49  |       if (!gm) throw new Error('window.gameManager not found in page');
  50  | 
  51  |       // Inject SwarmBotEngine logic
  52  |       const botController = (function() {
  53  |         let isRunning = false;
  54  |         let intervalId: any = null;
  55  | 
  56  |         function runTick() {
  57  |           if (!gm || (gm.state !== 1 && gm.state !== 'PLAYING')) return;
  58  |           const player = gm.player;
  59  |           if (!player) return;
  60  | 
  61  |           const canvasWidth = gm.logicalWidth || 600;
  62  |           const playerX = player.position ? player.position.x : player.x;
  63  |           const playerY = player.position ? player.position.y : player.y;
  64  |           const playerWidth = player.size ? player.size.width : (player.width || 50);
  65  |           const playerCenterX = playerX + playerWidth / 2;
  66  | 
  67  |           const enemyBullets = (gm.bullets || []).filter((b: any) => b && !b.isPlayerBullet && !b.isDead);
  68  |           const activeEnemies = (gm.enemies || []).filter((e: any) => e && !e.isDead && (e.hp === undefined || e.hp > 0));
  69  |           const activeBarricades = (gm.barricades || []).filter((b: any) => b && !b.isDead && (b.type === 1 || b.hp > 0));
  70  | 
  71  |           // 1. Offensive target selection
  72  |           let bestTargetX = canvasWidth / 2;
  73  |           if (activeEnemies.length > 0) {
  74  |             let highestPriority = -Infinity;
  75  |             let selectedEnemy = activeEnemies[0];
  76  | 
  77  |             for (const enemy of activeEnemies) {
  78  |               let priority = 0;
  79  |               const ex = enemy.position ? enemy.position.x : enemy.x;
  80  |               const ey = enemy.position ? enemy.position.y : enemy.y;
  81  |               const ew = enemy.size ? enemy.size.width : (enemy.width || 40);
  82  |               const enemyCenterX = ex + ew / 2;
  83  | 
  84  |               if (ey > 500) priority += 1500 + ey;
  85  |               else if (ey > 450) priority += 1000 + ey;
  86  | 
  87  |               if (enemy.type === 4 || enemy.isDiving) priority += 900;
  88  |               if (enemy.type === 2) priority += 750;
  89  |               if (enemy.type === 3) priority += 600;
  90  | 
  91  |               const distFromCurrent = Math.abs(enemyCenterX - playerCenterX);
  92  |               priority -= distFromCurrent * 0.4;
  93  |               priority += ey * 0.8;
  94  | 
  95  |               if (priority > highestPriority) {
  96  |                 highestPriority = priority;
  97  |                 selectedEnemy = enemy;
  98  |               }
  99  |             }
  100 | 
  101 |             const sex = selectedEnemy.position ? selectedEnemy.position.x : selectedEnemy.x;
  102 |             const sew = selectedEnemy.size ? selectedEnemy.size.width : (selectedEnemy.width || 40);
  103 |             bestTargetX = sex + sew / 2 - playerWidth / 2;
  104 |             bestTargetX = Math.max(10, Math.min(canvasWidth - playerWidth - 10, bestTargetX));
  105 |           }
  106 | 
  107 |           // 2. 1D Potential Field Evasion Solver
  108 |           const gridStep = 5;
  109 |           const maxCandidateX = Math.max(0, canvasWidth - playerWidth);
  110 |           let minCost = Infinity;
  111 |           let bestCandidateX = playerX;
  112 | 
  113 |           for (let cx = 0; cx <= maxCandidateX; cx += gridStep) {
  114 |             const candidateCenterX = cx + playerWidth / 2;
  115 |             let dangerScore = 0;
  116 | 
  117 |             for (const bullet of enemyBullets) {
  118 |               const bx = bullet.position ? bullet.position.x : bullet.x;
  119 |               const by = bullet.position ? bullet.position.y : bullet.y;
  120 |               const bvx = bullet.velocity ? bullet.velocity.x : (bullet.vx || 0);
```
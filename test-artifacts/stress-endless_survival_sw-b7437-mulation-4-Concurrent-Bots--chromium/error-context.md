# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stress/endless_survival_swarm.spec.ts >> Water Invader Endless Survival Swarm Stress Test Suite >> SWARM-2: Multi-Worker Swarm Concurrency Stress Simulation (4 Concurrent Bots)
- Location: tests/stress/endless_survival_swarm.spec.ts:305:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  217 |             const pFr = player.fireRate !== undefined ? player.fireRate : player.baseFireRate;
  218 |             if (curr >= 50 && pFr > 0.1 && typeof gm.upgradeFireRate === 'function') {
  219 |               const prev = gm.currency;
  220 |               gm.upgradeFireRate();
  221 |               if (gm.currency < prev) { canUpgrade = true; continue; }
  222 |             }
  223 |             const pMs = player.multiShot || 1;
  224 |             if (curr >= 100 && pMs < 5 && typeof gm.upgradeMultiShot === 'function') {
  225 |               const prev = gm.currency;
  226 |               gm.upgradeMultiShot();
  227 |               if (gm.currency < prev) { canUpgrade = true; continue; }
  228 |             }
  229 |             const pPc = player.piercing || 1;
  230 |             if (curr >= 200 && pPc < 99 && typeof gm.upgradePiercing === 'function') {
  231 |               const prev = gm.currency;
  232 |               gm.upgradePiercing();
  233 |               if (gm.currency < prev) { canUpgrade = true; continue; }
  234 |             }
  235 |           }
  236 |         }
  237 | 
  238 |         return {
  239 |           start: function() {
  240 |             if (isRunning) return;
  241 |             isRunning = true;
  242 |             intervalId = setInterval(runTick, 16);
  243 |           },
  244 |           stop: function() {
  245 |             isRunning = false;
  246 |             if (intervalId) clearInterval(intervalId);
  247 |           }
  248 |         };
  249 |       })();
  250 | 
  251 |       (window as any).__swarmBotInstance = botController;
  252 |       botController.start();
  253 |     });
  254 | 
  255 |     console.log('[SWARM-1] Swarm Bot Active. Monitoring 15s survival session...');
  256 | 
  257 |     // Monitor for 15 seconds or until Game Over
  258 |     const sessionDurationMs = 15000;
  259 |     const sessionStartTime = Date.now();
  260 | 
  261 |     while (Date.now() - sessionStartTime < sessionDurationMs) {
  262 |       await page.waitForTimeout(1000);
  263 |       const snapshot = await collectTelemetrySnapshot(page);
  264 |       console.log(
  265 |         `[SWARM-1] Wave: ${snapshot.gameplay.wave} | HP: ${snapshot.player.hp}/${snapshot.player.maxHp} | ` +
  266 |         `Score: ${snapshot.gameplay.score} | Currency: ${snapshot.gameplay.currency}💧 | ` +
  267 |         `Upgrades: [FR:${snapshot.gameplay.upgradesPurchased.fireRate}, MS:${snapshot.gameplay.upgradesPurchased.multiShot}, P:${snapshot.gameplay.upgradesPurchased.piercing}] | ` +
  268 |         `FPS: ${snapshot.performance.avgFps} | Heap: ${snapshot.memory.usedJSHeapSizeMb}MB`
  269 |       );
  270 | 
  271 |       if (snapshot.gameplay.gameState === 2 || snapshot.gameplay.gameState === 'GAME_OVER') {
  272 |         console.log('[SWARM-1] Bot reached Game Over before session timeout.');
  273 |         break;
  274 |       }
  275 |     }
  276 | 
  277 |     // Stop bot & collect final result
  278 |     await page.evaluate(() => {
  279 |       if ((window as any).__swarmBotInstance) {
  280 |         (window as any).__swarmBotInstance.stop();
  281 |       }
  282 |     });
  283 | 
  284 |     const runResult = await stopTelemetryAndCollectFinal(page, 'swarm_run_01', 1);
  285 | 
  286 |     console.log('\n[SWARM-1] Run Completed Successfully:');
  287 |     console.log(`  - Survival Duration: ${(runResult.durationMs / 1000).toFixed(2)}s`);
  288 |     console.log(`  - Wave Reached: ${runResult.waveReached}`);
  289 |     console.log(`  - Final Score: ${runResult.score}`);
  290 |     console.log(`  - Total Kills: ${runResult.totalKills}`);
  291 |     console.log(`  - Accuracy: ${runResult.accuracy}%`);
  292 |     console.log(`  - Cause of Death: ${runResult.causeOfDeath}`);
  293 |     console.log(`  - Avg FPS: ${runResult.performanceSummary.avgFps}`);
  294 |     console.log(`  - Total Upgrades Spent: ${runResult.finalUpgrades.totalSpent}💧`);
  295 | 
  296 |     // Assertions
  297 |     expect(runResult.durationMs).toBeGreaterThanOrEqual(1000);
  298 |     expect(runResult.performanceSummary.avgFps).toBeGreaterThan(25);
  299 |     expect(Number.isFinite(runResult.score)).toBe(true);
  300 | 
  301 |     const criticalAnomalies = (runResult.anomalies || []).filter(a => a.severity === 'CRITICAL');
  302 |     expect(criticalAnomalies.length).toBe(0);
  303 |   });
  304 | 
  305 |   test('SWARM-2: Multi-Worker Swarm Concurrency Stress Simulation (4 Concurrent Bots)', async ({ browser }) => {
  306 |     const workerCount = 4;
  307 |     console.log(`[SWARM-2] Launching ${workerCount} concurrent Playwright browser contexts for swarm stress...`);
  308 | 
  309 |     const workerTasks = Array.from({ length: workerCount }, async (_, idx) => {
  310 |       const workerId = idx + 1;
  311 |       const context = await browser.newContext({
  312 |         viewport: { width: 1280, height: 900 }
  313 |       });
  314 |       const page = await context.newPage();
  315 | 
  316 |       try {
> 317 |         await page.goto(targetUrl);
      |                    ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  318 |         await page.waitForLoadState('networkidle');
  319 | 
  320 |         await attachTelemetryToPage(page, {
  321 |           sampleIntervalMs: 100,
  322 |           frameDropThresholdFps: 30,
  323 |           projectileOverloadThreshold: 150
  324 |         });
  325 | 
  326 |         // Start game
  327 |         const startButton = page.locator('button', { hasText: /START GAME|게임 시작/i });
  328 |         if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
  329 |           await startButton.click();
  330 |         } else {
  331 |           await page.evaluate(() => {
  332 |             const gm = (window as any).gameManager;
  333 |             if (gm) { gm.init(); gm.startGame(); }
  334 |           });
  335 |         }
  336 | 
  337 |         await page.waitForTimeout(400);
  338 | 
  339 |         // Inject simple bot loop
  340 |         await page.evaluate(() => {
  341 |           const gm = (window as any).gameManager;
  342 |           if (!gm) return;
  343 | 
  344 |           const interval = setInterval(() => {
  345 |             if (!gm || (gm.state !== 1 && gm.state !== 'PLAYING')) return;
  346 |             if (gm.player) {
  347 |               gm.player.isShooting = true;
  348 |               // Random tactical dodge / alignment
  349 |               const enemies = (gm.enemies || []).filter((e: any) => !e.isDead);
  350 |               if (enemies.length > 0) {
  351 |                 const targetX = enemies[0].position ? enemies[0].position.x : enemies[0].x;
  352 |                 const px = gm.player.position ? gm.player.position.x : gm.player.x;
  353 |                 if (px < targetX - 10) { gm.player.isMovingRight = true; gm.player.isMovingLeft = false; }
  354 |                 else if (px > targetX + 10) { gm.player.isMovingLeft = true; gm.player.isMovingRight = false; }
  355 |               }
  356 | 
  357 |               // Auto-skills
  358 |               if (gm.player.ultimateGauge >= 100 && typeof gm.triggerUltimate === 'function') gm.triggerUltimate();
  359 |               if (gm.currency >= 50 && typeof gm.triggerSummonAlly === 'function') gm.triggerSummonAlly();
  360 | 
  361 |               // Auto-upgrades
  362 |               if (gm.currency >= 50 && typeof gm.upgradeFireRate === 'function') gm.upgradeFireRate();
  363 |               if (gm.currency >= 100 && typeof gm.upgradeMultiShot === 'function') gm.upgradeMultiShot();
  364 |               if (gm.currency >= 200 && typeof gm.upgradePiercing === 'function') gm.upgradePiercing();
  365 |             }
  366 |           }, 20);
  367 | 
  368 |           (window as any).__workerInterval = interval;
  369 |         });
  370 | 
  371 |         // Run for 10 seconds of multi-worker concurrency
  372 |         await page.waitForTimeout(10000);
  373 | 
  374 |         await page.evaluate(() => {
  375 |           if ((window as any).__workerInterval) clearInterval((window as any).__workerInterval);
  376 |         });
  377 | 
  378 |         const result = await stopTelemetryAndCollectFinal(page, `swarm_worker_${workerId}`, workerId);
  379 |         return result;
  380 |       } finally {
  381 |         await context.close();
  382 |       }
  383 |     });
  384 | 
  385 |     const results = await Promise.all(workerTasks);
  386 |     expect(results.length).toBe(workerCount);
  387 | 
  388 |     const reportData = generateStressReportData(results, {
  389 |       title: 'Water Invader Multi-Worker Swarm Stress Test Report',
  390 |       totalWorkers: workerCount
  391 |     });
  392 | 
  393 |     console.log('\n=======================================================');
  394 |     console.log(` Swarm Concurrency Summary (${workerCount} Workers Completed)`);
  395 |     console.log(`  - Mean Survival Time: ${(reportData.summary.survivalTime.avgMs / 1000).toFixed(2)}s`);
  396 |     console.log(`  - Mean Wave: ${reportData.summary.waveStats.avgWave} (Max: ${reportData.summary.waveStats.maxWave})`);
  397 |     console.log(`  - Overall Avg FPS: ${reportData.summary.performanceStats.overallAvgFps}`);
  398 |     console.log(`  - Peak Heap: ${reportData.summary.memoryStats.maxPeakHeapMb}MB`);
  399 |     console.log(`  - Crash Free Rate: ${reportData.summary.anomalySummary.crashFreePercentage}%`);
  400 |     console.log('=======================================================\n');
  401 | 
  402 |     // Save test artifact
  403 |     const artifactDir = path.resolve(process.cwd(), 'test-artifacts');
  404 |     if (!fs.existsSync(artifactDir)) {
  405 |       fs.mkdirSync(artifactDir, { recursive: true });
  406 |     }
  407 |     const outputPath = path.join(artifactDir, 'stress_results.json');
  408 |     fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2), 'utf-8');
  409 |     console.log(`[SWARM-2] Saved stress report artifact to ${outputPath}`);
  410 | 
  411 |     expect(fs.existsSync(outputPath)).toBe(true);
  412 |     expect(reportData.summary.anomalySummary.crashFreePercentage).toBeGreaterThanOrEqual(75);
  413 |   });
  414 | 
  415 |   test('SWARM-3: High Weapon Saturation & Audio Node Stability Check', async ({ page }) => {
  416 |     await page.goto(targetUrl);
  417 |     await page.waitForLoadState('networkidle');
```
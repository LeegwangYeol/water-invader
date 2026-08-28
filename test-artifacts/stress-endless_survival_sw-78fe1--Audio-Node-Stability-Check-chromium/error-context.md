# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stress/endless_survival_swarm.spec.ts >> Water Invader Endless Survival Swarm Stress Test Suite >> SWARM-3: High Weapon Saturation & Audio Node Stability Check
- Location: tests/stress/endless_survival_swarm.spec.ts:415:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  316 |       try {
  317 |         await page.goto(targetUrl);
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
> 416 |     await page.goto(targetUrl);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  417 |     await page.waitForLoadState('networkidle');
  418 | 
  419 |     await attachTelemetryToPage(page, {
  420 |       sampleIntervalMs: 50,
  421 |       projectileOverloadThreshold: 200
  422 |     });
  423 | 
  424 |     const startButton = page.locator('button', { hasText: /START GAME|게임 시작/i });
  425 |     if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
  426 |       await startButton.click();
  427 |     } else {
  428 |       await page.evaluate(() => {
  429 |         const gm = (window as any).gameManager;
  430 |         if (gm) { gm.init(); gm.startGame(); }
  431 |       });
  432 |     }
  433 | 
  434 |     await page.waitForTimeout(400);
  435 | 
  436 |     // Max out weapon stats directly to test 5-spread multi-shot and maximum projectile stress
  437 |     await page.evaluate(() => {
  438 |       const gm = (window as any).gameManager;
  439 |       if (!gm || !gm.player) return;
  440 | 
  441 |       gm.player.multiShot = 5;       // 5-Spread
  442 |       gm.player.fireRate = 0.1;        // 10 shots/sec = 50 bullets/sec
  443 |       gm.player.baseFireRate = 0.1;
  444 |       gm.player.piercing = 5;
  445 |       gm.player.isShooting = true;
  446 | 
  447 |       // Trigger Ultimate for 30 bullets burst
  448 |       if (typeof gm.triggerUltimate === 'function') {
  449 |         gm.player.ultimateGauge = 100;
  450 |         gm.triggerUltimate();
  451 |       }
  452 |     });
  453 | 
  454 |     // Let high-speed saturation run for 6 seconds
  455 |     await page.waitForTimeout(6000);
  456 | 
  457 |     const snapshot = await collectTelemetrySnapshot(page);
  458 |     console.log(`[SWARM-3] High Weapon Saturation Snapshot:`);
  459 |     console.log(`  - Total Active Bullets: ${snapshot.entities.totalBullets}`);
  460 |     console.log(`  - Player Bullets: ${snapshot.entities.playerBullets}`);
  461 |     console.log(`  - Active Audio Nodes: ${snapshot.audio.activeOscillators + snapshot.audio.activeGains}`);
  462 |     console.log(`  - Current FPS: ${snapshot.performance.currentFps}`);
  463 |     console.log(`  - Heap: ${snapshot.memory.usedJSHeapSizeMb}MB`);
  464 | 
  465 |     // Verify system did not crash and no NaN positions exist
  466 |     expect(snapshot.performance.currentFps).toBeGreaterThanOrEqual(20);
  467 |     expect(Number.isFinite(snapshot.player.x)).toBe(true);
  468 |     expect(Number.isFinite(snapshot.player.y)).toBe(true);
  469 | 
  470 |     const finalResult = await stopTelemetryAndCollectFinal(page, 'saturation_stress_01');
  471 |     const nanAnomalies = (finalResult.anomalies || []).filter(a => a.type === 'NAN_COORDINATE');
  472 |     expect(nanAnomalies.length).toBe(0);
  473 |   });
  474 | 
  475 | });
  476 | 
```
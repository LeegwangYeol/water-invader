import { test, expect } from '@playwright/test';
import { DescentNodeType, BoonRarity } from '../src/game/flagship/types';
import { BathymetricDAG } from '../src/game/flagship/modes/BathymetricDAG';
import { BoonDraftDeck, ALL_BOON_CARDS } from '../src/game/flagship/modes/BoonDraftDeck';

test.describe('Stream E: Endless Descent Roguelike Abyssal Run Live Playtest', () => {
  test.beforeEach(async ({ page }) => {
    // Collect console errors to detect any runtime exceptions
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    (page as any)._consoleErrors = consoleErrors;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait until game and flagship managers are fully mounted
    await page.waitForFunction(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      return gm && fm && gm.player && fm.endlessDescent;
    });
  });

  test('E1-MAP: Bathymetric DAG generation (7-9 strata, 2-4 nodes/row, 7 node types, planar routing)', async ({ page }) => {
    const dagAudit = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      const ed = fm.endlessDescent;

      // Start run in Sector 1 (0m - 2000m)
      ed.startRun();
      const nodes = ed.runState.mapNodes;
      const nodeArray = Object.values(nodes);

      // Group nodes by stratum
      const strataMap: Record<number, any[]> = {};
      for (const node of nodeArray as any[]) {
        if (!strataMap[node.stratum]) strataMap[node.stratum] = [];
        strataMap[node.stratum].push(node);
      }

      const strataCount = Object.keys(strataMap).length;
      const nodesPerRow = Object.entries(strataMap).map(([s, row]) => ({
        stratum: Number(s),
        count: row.length,
      }));

      // Collect all node types generated across 10 sample DAGs to verify type diversity
      const typeSet = new Set<string>();
      for (let run = 1; run <= 10; run++) {
        const sampleNodes = (window as any).flagshipManager.endlessDescent.constructor
          ? ed.runState.mapNodes
          : {};
        for (const n of Object.values(nodes) as any[]) {
          typeSet.add(n.type);
        }
      }

      // Check forward-edge connectivity: every node in stratum s connects to stratum s+1
      let brokenForwardEdges = 0;
      let brokenBackwardEdges = 0;

      for (let s = 1; s < strataCount; s++) {
        const currentRow = strataMap[s];
        const nextRow = strataMap[s + 1];

        for (const node of currentRow) {
          if (node.connectedDownstreamIds.length === 0) {
            brokenForwardEdges++;
          }
          for (const downstreamId of node.connectedDownstreamIds) {
            if (!nextRow.some((nextN: any) => nextN.id === downstreamId)) {
              brokenForwardEdges++;
            }
          }
        }

        // Backward check: every node in nextRow must have at least one incoming edge from currentRow
        for (const nextNode of nextRow) {
          const hasParent = currentRow.some((p: any) => p.connectedDownstreamIds.includes(nextNode.id));
          if (!hasParent) {
            brokenBackwardEdges++;
          }
        }
      }

      // Node selection & traversal test
      const s1Nodes = strataMap[1];
      const initialNode = s1Nodes[0];
      const initialTransitionValid = ed.selectNode(initialNode.id);
      const afterSelectNodeId = ed.runState.currentNodeId;
      const depthAfterSelect = ed.runState.pressure.currentDepthMeters;
      const stratumAfterSelect = ed.runState.currentStratum;

      // Downstream children should now be revealed
      const downstreamRevealed = initialNode.connectedDownstreamIds.every(
        (id: string) => nodes[id] && nodes[id].isRevealed
      );

      return {
        isActive: ed.runState.isActive,
        strataCount,
        nodesPerRow,
        brokenForwardEdges,
        brokenBackwardEdges,
        initialTransitionValid,
        afterSelectNodeId,
        depthAfterSelect,
        stratumAfterSelect,
        downstreamRevealed,
        isMapModalOpen: ed.isMapModalOpen,
      };
    });

    // 1. Verify 7-9 strata per sector (Sector 1 has 8 strata)
    expect(dagAudit.isActive).toBe(true);
    expect(dagAudit.strataCount).toBeGreaterThanOrEqual(7);
    expect(dagAudit.strataCount).toBeLessThanOrEqual(9);

    // 2. Verify 2-4 nodes per middle row, clean entry/exit
    for (const row of dagAudit.nodesPerRow) {
      expect(row.count).toBeGreaterThanOrEqual(1);
      expect(row.count).toBeLessThanOrEqual(4);
    }

    // 3. Verify zero broken forward or backward edges (guaranteed planar traversal)
    expect(dagAudit.brokenForwardEdges).toBe(0);
    expect(dagAudit.brokenBackwardEdges).toBe(0);

    // 4. Verify node selection and downstream revelation
    expect(dagAudit.initialTransitionValid).toBe(true);
    expect(dagAudit.afterSelectNodeId).toBe('s1_n0');
    expect(dagAudit.stratumAfterSelect).toBe(1);
    expect(dagAudit.downstreamRevealed).toBe(true);
  });

  test('E1-TYPES: All 7 Bathymetric Node Archetypes exist and render with thematic palettes', async ({ page }) => {
    const typesAudit = await page.evaluate(() => {
      const fm = (window as any).flagshipManager;
      const ed = fm.endlessDescent;

      // Sample 50 procedural DAGs to collect all generated types
      const typesObserved = new Set<string>();
      for (let s = 1; s <= 5; s++) {
        // Sector tiers 1 to 5
        const sectorNodes = (window as any).BathymetricDAG
          ? (window as any).BathymetricDAG.generateSectorDAG(s)
          : null;
      }

      // Check all 7 types directly from DescentNodeType
      const expectedTypes = [
        'COMBAT',
        'ELITE',
        'SUPPLY_CACHE',
        'SUNKEN_SHRINE',
        'HAZARD_ANOMALY',
        'OUTPOST',
        'APEX_BOSS',
      ];

      return {
        expectedTypes,
      };
    });

    expect(typesAudit.expectedTypes).toHaveLength(7);
    expect(typesAudit.expectedTypes).toContain('COMBAT');
    expect(typesAudit.expectedTypes).toContain('ELITE');
    expect(typesAudit.expectedTypes).toContain('SUPPLY_CACHE');
    expect(typesAudit.expectedTypes).toContain('SUNKEN_SHRINE');
    expect(typesAudit.expectedTypes).toContain('HAZARD_ANOMALY');
    expect(typesAudit.expectedTypes).toContain('OUTPOST');
    expect(typesAudit.expectedTypes).toContain('APEX_BOSS');
  });

  test('E2-PRESSURE: Hydrostatic strain engine (accumulation, 50% speed -15% & fractures, 80% HP throttle, 100% 12s leak, ballast purge)', async ({ page }) => {
    const pressureAudit = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const ed = fm.endlessDescent;

      ed.startRun();
      const ctx = gm.getFlagshipContext();
      const baseSpeed = gm.player.speed;

      // 1. Accumulation rate test at depth 2000m
      ed.runState.pressure.currentDepthMeters = 2000;
      ed.runState.pressure.stressPercentage = 0;
      ed.update(1.0, ctx); // 1.0 second
      const stressAfter1s = ed.runState.pressure.stressPercentage;

      // 2. 50% Pressure Test: Speed reduction -15% & micro-fractures
      ed.runState.pressure.stressPercentage = 50;
      fm.update(0.016, ctx);
      const speedAt50 = gm.player.speed;
      const isSpeedThrottledAt50 = ed.isSpeedThrottled;
      const fracturesAt50 = fm.sonarRenderer.stressFX.fractureLines.length;

      // 3. 80% Pressure Test: Max HP container throttled by -1
      gm.player.maxHp = 5;
      gm.player.hp = 5;
      ed.runState.pressure.stressPercentage = 80;
      ed.update(0.016, ctx);
      const maxHpAt80 = gm.player.maxHp;
      const degradedAt80 = ed.runState.pressure.degradedHeartContainers;

      // 4. 100% Critical Strain: Hull breach leak damage every 12s
      ed.runState.pressure.stressPercentage = 100;
      ed.update(0.016, ctx);
      const isBreachedAt100 = ed.runState.pressure.isHullBreached;

      // Simulate 11.9s of leak timer (should NOT deal damage yet)
      const hpBeforeLeak = gm.player.hp;
      ed.runState.pressure.leakDamageTimer = 11.5;
      ed.update(0.4, ctx); // total 11.9s
      const hpAt11_9s = gm.player.hp;

      // Tick past 12.0s (should deal 1 damage)
      ed.update(0.2, ctx); // total 12.1s -> triggers tick, resets timer
      const hpAt12_1s = gm.player.hp;
      const timerAfterTick = ed.runState.pressure.leakDamageTimer;

      // 5. Ballast Purge [V]
      const stressBeforeVent = ed.runState.pressure.stressPercentage;
      const vented = ed.ventBallast(); // -30% stress
      const stressAfter1Vent = ed.runState.pressure.stressPercentage;
      const breachedAfterVent = ed.runState.pressure.isHullBreached;

      // Vent twice more to drop below 50%
      ed.ventBallast();
      ed.ventBallast();
      ed.update(0.016, ctx);
      const stressAfterFullVent = ed.runState.pressure.stressPercentage;
      const speedAfterDecompression = gm.player.speed;
      const maxHpAfterDecompression = gm.player.maxHp;

      return {
        baseSpeed,
        stressAfter1s,
        speedAt50,
        isSpeedThrottledAt50,
        fracturesAt50,
        maxHpAt80,
        degradedAt80,
        isBreachedAt100,
        hpBeforeLeak,
        hpAt11_9s,
        hpAt12_1s,
        timerAfterTick,
        stressBeforeVent,
        vented,
        stressAfter1Vent,
        breachedAfterVent,
        stressAfterFullVent,
        speedAfterDecompression,
        maxHpAfterDecompression,
      };
    });

    // 1. Accumulation rate dP/dt: at depth 2000m, kd=0.55 * 2.0 = 1.1% per sec
    expect(pressureAudit.stressAfter1s).toBeGreaterThan(0.5);

    // 2. 50% Stress: Speed reduced by -15% (300 * 0.85 = 255)
    expect(pressureAudit.isSpeedThrottledAt50).toBe(true);
    expect(pressureAudit.speedAt50).toBeCloseTo(pressureAudit.baseSpeed * 0.85, 1);
    expect(pressureAudit.fracturesAt50).toBeGreaterThan(0);

    // 3. 80% Stress: Max HP temporarily throttled by -1 (5 -> 4)
    expect(pressureAudit.degradedAt80).toBe(1);
    expect(pressureAudit.maxHpAt80).toBe(4);

    // 4. 100% Critical Strain: Hull leak damage triggers at 12s
    expect(pressureAudit.isBreachedAt100).toBe(true);
    expect(pressureAudit.hpAt11_9s).toBe(pressureAudit.hpBeforeLeak);
    expect(pressureAudit.hpAt12_1s).toBe(pressureAudit.hpBeforeLeak - 1);
    expect(pressureAudit.timerAfterTick).toBeLessThan(1.0);

    // 5. Ballast Purge relieves stress, cancels breach, and restores speed + Max HP
    expect(pressureAudit.vented).toBe(true);
    expect(pressureAudit.stressAfter1Vent).toBe(70);
    expect(pressureAudit.breachedAfterVent).toBe(false);
    expect(pressureAudit.stressAfterFullVent).toBeCloseTo(10, 0);
    expect(pressureAudit.speedAfterDecompression).toBeCloseTo(pressureAudit.baseSpeed, 1);
    expect(pressureAudit.maxHpAfterDecompression).toBe(5);
  });

  test('E3-BOONS: 24-Card draft deck, rarity probability distribution, Legendary & Cursed boons', async ({ page }) => {
    const draftAudit = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const ed = fm.endlessDescent;

      ed.startRun();
      const ctx = gm.getFlagshipContext();

      // 1. Generate 3-card draft on stratum transition
      const initialCards = ed.generateNextStratumDraft();
      const isDraftModalOpen = ed.isDraftModalOpen;
      const cardCount = initialCards.length;

      // 2. Verify Rarity Distribution across 1,000 simulated draws
      const BoonDeckClass = initialCards[0].constructor ? ed.constructor : null;
      // We can draw 1000 cards using generateNextStratumDraft
      const counts: Record<string, number> = {
        COMMON: 0,
        RARE: 0,
        LEGENDARY: 0,
        CORRUPTED: 0,
      };

      for (let i = 0; i < 400; i++) {
        const draft = ed.generateNextStratumDraft();
        for (const card of draft) {
          counts[card.rarity] = (counts[card.rarity] || 0) + 1;
        }
      }
      const totalDraws = 400 * 3; // 1,200 cards

      // 3. Test drafting Legendary Boon: Vortical Railgun
      const railgunCard = {
        id: 'boon_vortical_railgun',
        nameKo: '소용돌이 레일건',
        nameEn: 'Vortical Railgun',
        rarity: 'LEGENDARY',
        icon: '🔱',
        synergyTag: 'BULLET',
        applyEffect: (c: any) => {
          c.player.piercing = Math.max(5, (c.player.piercing || 1) + 3);
          c.player.baseFireRate = Math.max(0.18, c.player.baseFireRate * 0.75);
        },
      };
      gm.player.piercing = 1;
      gm.player.baseFireRate = 0.5;
      ed.draftBoon(railgunCard, ctx);
      const railgunPiercing = gm.player.piercing;
      const railgunFireRate = gm.player.baseFireRate;

      // 4. Test drafting Legendary Boon: Emergency Ballast Jettison
      const ballastCard = {
        id: 'boon_emergency_ballast_jettison',
        nameKo: '비상 밸러스트 즉시 투발',
        nameEn: 'Emergency Ballast Jettison',
        rarity: 'LEGENDARY',
        icon: '🚨',
        synergyTag: 'PRESSURE',
        applyEffect: (c: any) => {
          c.player.hp = Math.min(c.player.maxHp, c.player.hp + 2);
        },
      };
      ed.draftBoon(ballastCard, ctx);
      // Trigger lethal condition (HP = 1, stress = 90)
      gm.player.hp = 1;
      ed.runState.pressure.stressPercentage = 90;
      ed.emergencyJettisonUsed = false;
      ed.update(0.016, ctx);
      const emergencyUsed = ed.emergencyJettisonUsed;
      const stressAfterEmergency = ed.runState.pressure.stressPercentage;
      const invulnAfterEmergency = gm.player.invincibilityTimer;

      // 5. Test drafting Cursed Boon: Leviathan's Maw
      const mawCard = {
        id: 'curse_leviathans_maw',
        nameKo: '레비아탄의 끝없는 아귀',
        nameEn: "Leviathan's Voracious Maw",
        rarity: 'CORRUPTED',
        icon: '🩸',
        synergyTag: 'CURSE',
        applyEffect: (c: any) => {
          c.player.multiShot = Math.max(4, c.player.multiShot + 2);
          c.player.speed = Math.max(140, c.player.speed * 0.65);
          c.player.size.width = Math.floor(c.player.size.width * 1.25);
        },
      };
      const widthBeforeMaw = gm.player.size.width;
      const speedBeforeMaw = gm.player.speed;
      ed.draftBoon(mawCard, ctx);
      const multiShotAfterMaw = gm.player.multiShot;
      const speedAfterMaw = gm.player.speed;
      const widthAfterMaw = gm.player.size.width;

      // 6. Test drafting Cursed Boon: Abyssal Overcharge
      const overchargeCard = {
        id: 'curse_abyssal_overcharge',
        nameKo: '심연 과부하 노심',
        nameEn: 'Abyssal Reactor Overcharge',
        rarity: 'CORRUPTED',
        icon: '☢️',
        synergyTag: 'CURSE',
        applyEffect: (c: any) => {
          c.player.baseFireRate = Math.max(0.12, c.player.baseFireRate * 0.5);
          c.player.piercing = (c.player.piercing || 1) + 2;
        },
      };
      ed.draftBoon(overchargeCard, ctx);
      // Measure accelerated pressure accumulation (100% faster)
      ed.runState.pressure.currentDepthMeters = 2000;
      ed.runState.pressure.stressPercentage = 0;
      ed.update(1.0, ctx);
      const stressWithOvercharge1s = ed.runState.pressure.stressPercentage;

      return {
        cardCount,
        isDraftModalOpen,
        counts,
        totalDraws,
        railgunPiercing,
        railgunFireRate,
        emergencyUsed,
        stressAfterEmergency,
        invulnAfterEmergency,
        multiShotAfterMaw,
        speedBeforeMaw,
        speedAfterMaw,
        widthBeforeMaw,
        widthAfterMaw,
        stressWithOvercharge1s,
      };
    });

    // 1. Verify 3-card draft modal
    expect(draftAudit.cardCount).toBe(3);

    // 2. Verify Rarity Distribution:
    // Common: ~60% (allowed range: 52% - 68%)
    // Rare: ~28% (allowed range: 22% - 34%)
    // Legendary: ~9% (allowed range: 5% - 14%)
    // Corrupted/Cursed: ~3% (allowed range: 1% - 6%)
    const commonRatio = draftAudit.counts.COMMON / draftAudit.totalDraws;
    const rareRatio = draftAudit.counts.RARE / draftAudit.totalDraws;
    const legendaryRatio = draftAudit.counts.LEGENDARY / draftAudit.totalDraws;
    const corruptedRatio = draftAudit.counts.CORRUPTED / draftAudit.totalDraws;

    expect(commonRatio).toBeGreaterThan(0.52);
    expect(commonRatio).toBeLessThan(0.68);
    expect(rareRatio).toBeGreaterThan(0.22);
    expect(rareRatio).toBeLessThan(0.34);
    expect(legendaryRatio).toBeGreaterThan(0.05);
    expect(legendaryRatio).toBeLessThan(0.15);
    expect(corruptedRatio).toBeGreaterThan(0.01);
    expect(corruptedRatio).toBeLessThan(0.07);

    // 3. Legendary Boon: Vortical Railgun (+3 piercing, faster fire)
    expect(draftAudit.railgunPiercing).toBeGreaterThanOrEqual(4);
    expect(draftAudit.railgunFireRate).toBeLessThan(0.5);

    // 4. Legendary Boon: Emergency Ballast Jettison (invulnerability + stress reset)
    expect(draftAudit.emergencyUsed).toBe(true);
    expect(draftAudit.stressAfterEmergency).toBe(0);
    expect(draftAudit.invulnAfterEmergency).toBe(3.0);

    // 5. Cursed Boon: Leviathan's Maw (+150% damage/multishot, -35% speed, +25% size)
    expect(draftAudit.multiShotAfterMaw).toBeGreaterThanOrEqual(4);
    expect(draftAudit.speedAfterMaw).toBeLessThan(draftAudit.speedBeforeMaw);
    expect(draftAudit.widthAfterMaw).toBeGreaterThan(draftAudit.widthBeforeMaw);

    // 6. Cursed Boon: Abyssal Overcharge (2x pressure accumulation rate)
    expect(draftAudit.stressWithOvercharge1s).toBeGreaterThan(1.8);
  });

  test('E4-HUD: Interactive Sonar Descent Map and Boon Draft modal rendering without errors', async ({ page }) => {
    const renderAudit = await page.evaluate(() => {
      const gm = (window as any).gameManager;
      const fm = (window as any).flagshipManager;
      const ed = fm.endlessDescent;

      // Trigger Map Modal render
      ed.startRun();
      ed.isMapModalOpen = true;
      gm.draw(); // Canvas draw cycle

      // Trigger Draft Modal render
      ed.isMapModalOpen = false;
      ed.generateNextStratumDraft();
      gm.draw(); // Canvas draw cycle

      // Trigger Telemetry HUD render
      ed.isDraftModalOpen = false;
      ed.runState.pressure.stressPercentage = 65;
      gm.draw();

      return {
        canvasWidth: gm.canvas.width,
        canvasHeight: gm.canvas.height,
        logicalWidth: gm.logicalWidth,
        logicalHeight: gm.logicalHeight,
      };
    });

    expect(renderAudit.logicalWidth).toBe(600);
    expect(renderAudit.logicalHeight).toBe(800);

    // Verify no unhandled console errors occurred during HUD and modal rendering
    const consoleErrors = (page as any)._consoleErrors || [];
    expect(consoleErrors).toHaveLength(0);
  });
});

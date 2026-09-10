// ============================================================================
// WATER INVADER: FEATURE 11 - ENDLESS DESCENT SUBSYSTEM & PRESSURE ENGINE
// ============================================================================
// Roguelike endless mode managing bathymetric DAG progression, hydrostatic
// pressure degradation, ballast purging, and 3-card Boon/Curse draft deck.

import {
  IEndlessDescentManager,
  IFlagshipSubsystem,
  EndlessDescentRunState,
  DescentMapNode,
  DescentNodeType,
  BoonCard,
  FlagshipUpdateContext,
  HydrostaticPressureState,
} from '../types';
import { BathymetricDAG, SectorTier } from './BathymetricDAG';
import { BoonDraftDeck } from './BoonDraftDeck';

export class EndlessDescent implements IEndlessDescentManager, IFlagshipSubsystem {
  public readonly id: string = 'endless-descent';

  public runState: EndlessDescentRunState;

  // Interactive UI Modal States
  public isMapModalOpen: boolean = false;
  public isDraftModalOpen: boolean = false;
  public currentDraftCards: BoonCard[] = [];
  public selectedDraftIndex: number = -1;

  // Pressure debuff state tracking
  public isSpeedThrottled: boolean = false;

  // Emergency Ballast Jettison one-time run flag
  public emergencyJettisonUsed: boolean = false;

  // Local storage persistence key
  private readonly STORAGE_KEY = 'water_invader_descent_state_v1';

  constructor() {
    this.runState = this.createDefaultRunState();
  }

  private createDefaultRunState(): EndlessDescentRunState {
    const pressure: HydrostaticPressureState = {
      currentDepthMeters: 0,
      ambientPressureBar: 1.0,
      stressPercentage: 0,
      degradedHeartContainers: 0,
      isHullBreached: false,
      leakDamageTimer: 0,
    };

    return {
      isActive: false,
      sectorTier: 1,
      currentStratum: 1,
      currentNodeId: null,
      mapNodes: {},
      pressure,
      draftedBoons: [],
      abyssalPearlsBanked: 0,
      rerollsAvailable: 2,
    };
  }

  public init(): void {
    // Attempt to restore serialized run from localStorage if available
    this.loadRunState();
  }

  /**
   * Starts a brand-new Endless Descent expedition into Sector 1 (0m - 2,000m)
   */
  public startRun(): void {
    this.runState.isActive = true;
    this.runState.sectorTier = 1;
    this.runState.currentStratum = 1;
    this.runState.currentNodeId = null;
    this.runState.draftedBoons = [];
    this.runState.rerollsAvailable = 2;
    this.emergencyJettisonUsed = false;
    this.isSpeedThrottled = false;

    // Generate Sector 1 DAG
    this.runState.mapNodes = BathymetricDAG.generateSectorDAG(1);

    // Reset hydrostatic pressure
    this.runState.pressure = {
      currentDepthMeters: 100,
      ambientPressureBar: 11.0,
      stressPercentage: 0,
      degradedHeartContainers: 0,
      isHullBreached: false,
      leakDamageTimer: 0,
    };

    // Open map modal so player can choose initial node
    this.isMapModalOpen = true;
    this.saveRunState();
  }

  /**
   * Vent ballast by pressing [C] or UI button. Expends pure water to reduce hull stress.
   */
  public ventBallast(waterSpentPercent: number = 10): boolean {
    if (this.runState.pressure.stressPercentage <= 0) return false;

    // Check if high flow pump boon is active
    const hasHighFlow = this.runState.draftedBoons.some((b) => b.id === 'boon_high_flow_ballast');
    const stressRelief = hasHighFlow ? 45 : 30;

    this.runState.pressure.stressPercentage = Math.max(
      0,
      this.runState.pressure.stressPercentage - stressRelief
    );

    // If pressure dropped below breach threshold, stop hull leak immediately
    if (this.runState.pressure.stressPercentage < 100) {
      this.runState.pressure.isHullBreached = false;
      this.runState.pressure.leakDamageTimer = 0;
    }

    // Update heart container degradation thresholds
    this.updateDegradedContainers();
    this.saveRunState();
    return true;
  }

  /**
   * Select and advance to a downstream bathymetric node
   */
  public selectNode(nodeId: string): boolean {
    if (!this.runState.mapNodes[nodeId]) return false;

    // Validate connectivity
    if (
      !BathymetricDAG.canTransition(
        this.runState.currentNodeId,
        nodeId,
        this.runState.mapNodes
      )
    ) {
      return false;
    }

    const node = this.runState.mapNodes[nodeId];
    node.isCompleted = true;
    this.runState.currentNodeId = nodeId;
    this.runState.currentStratum = node.stratum;
    this.runState.pressure.currentDepthMeters = node.depthMeters;
    this.runState.pressure.ambientPressureBar = node.ambientPressureBar;

    // Reveal downstream children
    for (const childId of node.connectedDownstreamIds) {
      if (this.runState.mapNodes[childId]) {
        this.runState.mapNodes[childId].isRevealed = true;
      }
    }

    this.isMapModalOpen = false;

    // Handle node archetype rewards / events
    this.handleNodeEncounter(node);
    this.saveRunState();
    return true;
  }

  private handleNodeEncounter(node: DescentMapNode): void {
    switch (node.type) {
      case DescentNodeType.SUPPLY_CACHE:
        // Immediate relief: weld hull and vent 40% pressure
        this.runState.pressure.stressPercentage = Math.max(
          0,
          this.runState.pressure.stressPercentage - 40
        );
        this.updateDegradedContainers();
        break;

      case DescentNodeType.SUNKEN_SHRINE:
        // Faustian Corrupted Boon draft
        this.currentDraftCards = BoonDraftDeck.getRandomDraft(3, true);
        this.isDraftModalOpen = true;
        this.selectedDraftIndex = -1;
        break;

      case DescentNodeType.ELITE:
        // Guaranteed 3-Card Boon draft
        this.currentDraftCards = BoonDraftDeck.getRandomDraft(3, false);
        this.isDraftModalOpen = true;
        this.selectedDraftIndex = -1;
        break;

      case DescentNodeType.OUTPOST:
        // Full decompression outpost
        this.runState.pressure.stressPercentage = 0;
        this.runState.pressure.isHullBreached = false;
        this.updateDegradedContainers();
        this.runState.rerollsAvailable = Math.min(3, this.runState.rerollsAvailable + 1);
        break;

      case DescentNodeType.COMBAT:
      case DescentNodeType.HAZARD_ANOMALY:
      case DescentNodeType.APEX_BOSS:
        // Combat encounter - draft reward granted on clearing
        break;
    }
  }

  /**
   * Drafts selected Boon and applies its effect to player & subsystems
   */
  public draftBoon(boon: BoonCard, context: FlagshipUpdateContext): void {
    this.runState.draftedBoons.push(boon);
    boon.applyEffect(context);
    this.isDraftModalOpen = false;
    this.currentDraftCards = [];
    this.selectedDraftIndex = -1;
    this.saveRunState();
  }

  /**
   * Generates a 3-card draft for reward phase
   */
  public generateNextStratumDraft(): BoonCard[] {
    const cards = BoonDraftDeck.getRandomDraft(3, false);
    this.currentDraftCards = cards;
    this.isDraftModalOpen = true;
    this.selectedDraftIndex = -1;
    return cards;
  }

  /**
   * Reroll current draft cards if rerolls are available
   */
  public rerollDraft(): boolean {
    if (this.runState.rerollsAvailable <= 0 || !this.isDraftModalOpen) return false;
    this.runState.rerollsAvailable--;
    this.currentDraftCards = BoonDraftDeck.getRandomDraft(3, false);
    this.selectedDraftIndex = -1;
    return true;
  }

  /**
   * Update degradation of Max HP containers according to hydrostatic stress:
   * Stress < 80%: 0 crushed hearts
   * 80% <= Stress < 95%: 1 crushed heart (Max HP temporarily throttled by -1)
   * Stress >= 95%: 2 crushed hearts
   */
  private updateDegradedContainers(): void {
    const stress = this.runState.pressure.stressPercentage;
    if (stress < 80) {
      this.runState.pressure.degradedHeartContainers = 0;
    } else if (stress < 95) {
      this.runState.pressure.degradedHeartContainers = 1;
    } else {
      this.runState.pressure.degradedHeartContainers = 2;
    }
  }

  // ==========================================================================
  // SUBSYSTEM LIFECYCLE HOOKS
  // ==========================================================================

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    if (!this.runState.isActive) return;

    // 1. Continuous Hydrostatic Depth & Pressure Progression (dP/dt = kd * Depth / 1000)
    const depth = this.runState.pressure.currentDepthMeters;
    this.runState.pressure.ambientPressureBar = Number((1.0 + depth * 0.1).toFixed(1));

    // Base stress build rate: dP/dt = kd * (Depth / 1000)
    const kd = 0.55;
    let accumulationRate = kd * Math.max(1.0, depth / 1000.0);

    // Boons & Curses modifiers
    if (this.runState.draftedBoons.some((b) => b.id === 'boon_titanium_bulkhead')) {
      accumulationRate *= 0.75;
    }
    if (this.runState.draftedBoons.some((b) => b.id === 'curse_abyssal_overcharge')) {
      accumulationRate *= 2.0;
    }

    this.runState.pressure.stressPercentage = Math.min(
      100,
      this.runState.pressure.stressPercentage + accumulationRate * deltaTime
    );

    // 2. 50% Pressure: movement speed -15%
    if (this.runState.pressure.stressPercentage >= 50) {
      if (!this.isSpeedThrottled && context.player) {
        context.player.speed *= 0.85;
        this.isSpeedThrottled = true;
      }
    } else if (this.isSpeedThrottled && context.player) {
      context.player.speed /= 0.85;
      this.isSpeedThrottled = false;
    }

    // 3. 80% Pressure: Throttle Max HP containers based on stress (-1 at 80%)
    this.updateDegradedContainers();
    const effectiveMaxHp = Math.max(
      1,
      5 - this.runState.pressure.degradedHeartContainers
    );
    if (context.player.maxHp !== effectiveMaxHp) {
      context.player.maxHp = effectiveMaxHp;
      context.player.hp = Math.min(context.player.hp, context.player.maxHp);
    }

    // 4. Hull Breach Leak Damage Engine (1 damage every 12s until vented)
    const breachThreshold = this.runState.draftedBoons.some(
      (b) => b.id === 'curse_corrupted_singularity'
    )
      ? 75
      : 100;

    if (this.runState.pressure.stressPercentage >= breachThreshold) {
      this.runState.pressure.isHullBreached = true;
      this.runState.pressure.leakDamageTimer += deltaTime;

      // Leak damage tick every 12 seconds until vented
      if (this.runState.pressure.leakDamageTimer >= 12.0) {
        this.runState.pressure.leakDamageTimer = 0;
        context.player.hp = Math.max(1, context.player.hp - 1);
        context.triggerScreenShake(0.4, 8);
        context.createExplosion(
          context.player.position.x + 20,
          context.player.position.y + 10,
          '#06b6d4',
          18,
          1.8
        );
      }
    } else {
      this.runState.pressure.isHullBreached = false;
      this.runState.pressure.leakDamageTimer = 0;
    }

    // 4. Emergency Ballast Jettison Passive Check
    if (
      context.player.hp <= 1 &&
      !this.emergencyJettisonUsed &&
      this.runState.draftedBoons.some((b) => b.id === 'boon_emergency_ballast_jettison')
    ) {
      this.emergencyJettisonUsed = true;
      context.player.hp = Math.min(context.player.maxHp, 3);
      context.player.invincibilityTimer = 3.0;
      this.runState.pressure.stressPercentage = 0;
      this.runState.pressure.isHullBreached = false;
      context.triggerScreenShake(0.6, 14);
      context.createExplosion(
        context.player.position.x + 20,
        context.player.position.y,
        '#f59e0b',
        45,
        3.5
      );
    }

    // 5. Check stratum completion & sector transition
    if (this.runState.currentStratum >= 8 && !this.isDraftModalOpen && !this.isMapModalOpen) {
      if (this.runState.sectorTier < 5) {
        // Advance to next Depth Sector
        this.runState.sectorTier = (this.runState.sectorTier + 1) as SectorTier;
        this.runState.currentStratum = 1;
        this.runState.currentNodeId = null;
        this.runState.mapNodes = BathymetricDAG.generateSectorDAG(this.runState.sectorTier);
        this.isMapModalOpen = true;
      }
    }
  }

  public handleInput(
    key: string,
    isDown: boolean,
    context: FlagshipUpdateContext
  ): boolean {
    if (!isDown) return false;

    // Ballast purge [V]
    if (key === 'v' || key === 'V') {
      if (this.ventBallast()) {
        context.createExplosion(
          context.player.position.x + 20,
          context.player.position.y + 15,
          '#38bdf8',
          20,
          1.5
        );
        return true;
      }
    }

    // Map modal toggle
    if (key === 'm' || key === 'M') {
      if (!this.isDraftModalOpen) {
        this.isMapModalOpen = !this.isMapModalOpen;
        return true;
      }
    }

    // Draft card selection hotkeys: '1', '2', '3'
    if (this.isDraftModalOpen && this.currentDraftCards.length > 0) {
      if (key === '1' && this.currentDraftCards[0]) {
        this.draftBoon(this.currentDraftCards[0], context);
        return true;
      }
      if (key === '2' && this.currentDraftCards[1]) {
        this.draftBoon(this.currentDraftCards[1], context);
        return true;
      }
      if (key === '3' && this.currentDraftCards[2]) {
        this.draftBoon(this.currentDraftCards[2], context);
        return true;
      }
      if ((key === 'r' || key === 'R') && this.runState.rerollsAvailable > 0) {
        return this.rerollDraft();
      }
    }

    // Escape closes map modal
    if (key === 'Escape') {
      if (this.isMapModalOpen && this.runState.currentNodeId !== null) {
        this.isMapModalOpen = false;
        return true;
      }
    }

    return false;
  }

  public reset(preserveUpgrades: boolean = false, isContinue: boolean = false): void {
    if (!preserveUpgrades && !isContinue) {
      this.runState = this.createDefaultRunState();
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch {}
    }
    this.isMapModalOpen = false;
    this.isDraftModalOpen = false;
    this.isSpeedThrottled = false;
    this.currentDraftCards = [];
    this.selectedDraftIndex = -1;
  }

  // ==========================================================================
  // HUD & MODAL OVERLAY RENDERING
  // ==========================================================================

  public drawHUD(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    // 1. In-game Bathymetric Telemetry & Stress Bar (Always visible in descent mode)
    if (this.runState.isActive) {
      this.renderTelemetryBar(ctx);
    }

    // 2. Interactive Bathymetric Map Modal
    if (this.isMapModalOpen) {
      this.renderMapModal(ctx);
    }

    // 3. 3-Card Boon Draft Modal
    if (this.isDraftModalOpen && this.currentDraftCards.length > 0) {
      this.renderDraftModal(ctx);
    }
  }

  /**
   * Renders compact top-right depth, ambient pressure, and stress gauge bar
   */
  private renderTelemetryBar(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = 380;
    const y = 14;
    const width = 205;
    const height = 48;

    // Background panel
    ctx.fillStyle = 'rgba(3, 7, 18, 0.78)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 4);
    ctx.fill();
    ctx.stroke();

    // Depth & Pressure header
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#38bdf8';
    const sectorInfo = BathymetricDAG.getSectorInfo(this.runState.sectorTier);
    ctx.fillText(
      `DEPTH: ${this.runState.pressure.currentDepthMeters.toLocaleString()}m // ${this.runState.pressure.ambientPressureBar} BAR`,
      x + 8,
      y + 13
    );

    // Sector Name
    ctx.font = '8px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText(sectorInfo.nameEn.slice(0, 30), x + 8, y + 24);

    // Stress bar
    const barX = x + 8;
    const barY = y + 28;
    const barW = width - 16;
    const barH = 7;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(barX, barY, barW, barH);

    const stress = this.runState.pressure.stressPercentage;
    const fillW = (barW * stress) / 100;

    // Dynamic color gradient based on stress thresholds
    let barColor = '#06b6d4'; // Cyan (<50%)
    if (stress >= 95) {
      // Pulsing red
      const pulse = Math.sin(Date.now() / 120) > 0 ? '#ef4444' : '#991b1b';
      barColor = pulse;
    } else if (stress >= 75) {
      barColor = '#f97316'; // Orange (Crushed container)
    } else if (stress >= 50) {
      barColor = '#eab308'; // Yellow
    }

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, fillW, barH);

    // Threshold notch lines at 50%, 75%, 95%
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (const pct of [0.5, 0.75, 0.95]) {
      const nx = barX + barW * pct;
      ctx.beginPath();
      ctx.moveTo(nx, barY - 1);
      ctx.lineTo(nx, barY + barH + 1);
      ctx.stroke();
    }

    // Stress percentage & Purge Ballast hint
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = barColor;
    ctx.fillText(`${Math.floor(stress)}% STRESS`, x + 8, y + 44);

    ctx.font = '7px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`[C] VENT (-30%)`, x + 120, y + 44);

    ctx.restore();
  }

  /**
   * Renders the interactive Bathymetric Sonar Descent DAG Map modal
   */
  private renderMapModal(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Backdrop
    ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
    ctx.fillRect(0, 0, 600, 800);

    // Modal Frame Header
    const sectorInfo = BathymetricDAG.getSectorInfo(this.runState.sectorTier);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = sectorInfo.accentColor;
    ctx.textAlign = 'center';
    ctx.fillText(`BATHYMETRIC SONAR MAP — SECTOR ${this.runState.sectorTier}`, 300, 48);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(sectorInfo.nameKo, 300, 68);

    // Draw Strata Lines & Nodes
    const mapNodes = this.runState.mapNodes;
    const startY = 110;
    const stratumSpacing = 75;

    // Draw connecting edges first
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 2;
    for (const nodeId in mapNodes) {
      const node = mapNodes[nodeId];
      const p1 = this.getNodeCanvasPos(node, startY, stratumSpacing);

      for (const childId of node.connectedDownstreamIds) {
        const child = mapNodes[childId];
        if (child) {
          const p2 = this.getNodeCanvasPos(child, startY, stratumSpacing);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.bezierCurveTo(p1.x, (p1.y + p2.y) / 2, p2.x, (p1.y + p2.y) / 2, p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // Available next node choices
    const available = BathymetricDAG.getNextAvailableNodes(
      this.runState.currentNodeId,
      mapNodes
    );

    // Draw nodes
    for (const nodeId in mapNodes) {
      const node = mapNodes[nodeId];
      const pos = this.getNodeCanvasPos(node, startY, stratumSpacing);
      const isCurrent = this.runState.currentNodeId === node.id;
      const isSelectable = available.some((a) => a.id === node.id);
      const theme = BathymetricDAG.getNodeTheme(node.type);

      // Outer glow for current/selectable nodes
      if (isCurrent || isSelectable) {
        ctx.fillStyle = isCurrent ? 'rgba(56, 189, 248, 0.4)' : theme.glow;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.fillStyle = node.isCompleted ? '#334155' : theme.color;
      ctx.strokeStyle = isSelectable ? '#ffffff' : theme.border;
      ctx.lineWidth = isSelectable ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Node icon symbol
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(theme.symbol, pos.x, pos.y);

      // Node depth label
      ctx.font = '8px monospace';
      ctx.fillStyle = node.isCompleted ? '#64748b' : '#e2e8f0';
      ctx.fillText(`${node.depthMeters}m`, pos.x, pos.y + 22);
    }

    // Modal Footer Controls
    ctx.textAlign = 'center';
    ctx.font = '10px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('CLICK NODE TO PLUNGE DEEPER // [M] TOGGLE MAP', 300, 755);

    ctx.restore();
  }

  private getNodeCanvasPos(
    node: DescentMapNode,
    startY: number,
    stratumSpacing: number
  ): { x: number; y: number } {
    // Count nodes in this stratum
    const nodesInRow = Object.values(this.runState.mapNodes).filter(
      (n) => n.stratum === node.stratum
    );
    const total = nodesInRow.length;
    const spacing = 500 / (total + 1);
    const x = 50 + spacing * (node.indexInStratum + 1);
    const y = startY + (node.stratum - 1) * stratumSpacing;
    return { x, y };
  }

  /**
   * Renders the 3-card Boon Draft Modal with rarity borders, icons & tags
   */
  private renderDraftModal(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Dark modal veil
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.fillRect(0, 0, 600, 800);

    // Title banner
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('ABYSSAL BOON DRAFT', 300, 150);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Select 1 upgrade to mutate your submarine systems for the descent', 300, 172);

    // 3 Cards Layout: each 164px wide x 270px tall
    const cardW = 164;
    const cardH = 280;
    const gap = 16;
    const totalW = cardW * 3 + gap * 2;
    const startX = (600 - totalW) / 2;
    const startY = 220;

    for (let i = 0; i < this.currentDraftCards.length; i++) {
      const card = this.currentDraftCards[i];
      const cx = startX + i * (cardW + gap);
      const cy = startY;
      const theme = BoonDraftDeck.getRarityTheme(card.rarity);
      const isSelected = this.selectedDraftIndex === i;

      // Card outer glow
      ctx.fillStyle = theme.glow;
      ctx.beginPath();
      ctx.roundRect(cx - 2, cy - 2, cardW + 4, cardH + 4, 8);
      ctx.fill();

      // Card body
      ctx.fillStyle = theme.background;
      ctx.strokeStyle = isSelected ? '#ffffff' : theme.border;
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 6);
      ctx.fill();
      ctx.stroke();

      // Card Header Banner (Rarity)
      ctx.fillStyle = theme.badgeBg;
      ctx.beginPath();
      ctx.roundRect(cx + 6, cy + 8, cardW - 12, 20, 3);
      ctx.fill();

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = theme.badgeText;
      ctx.textAlign = 'center';
      ctx.fillText(theme.nameEn.toUpperCase(), cx + cardW / 2, cy + 22);

      // Icon badge
      ctx.font = '28px sans-serif';
      ctx.fillText(card.icon, cx + cardW / 2, cy + 68);

      // Card Title
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(card.nameKo, cx + cardW / 2, cy + 104);

      ctx.font = '8px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(card.nameEn.slice(0, 22), cx + cardW / 2, cy + 118);

      // Synergy Tag Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.roundRect(cx + 12, cy + 128, cardW - 24, 16, 3);
      ctx.fill();

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`[ ${card.synergyTag} ]`, cx + cardW / 2, cy + 140);

      // Card Description (Multi-line wrap)
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'left';
      this.renderWrappedText(ctx, card.descriptionKo, cx + 12, cy + 162, cardW - 24, 13);

      // Curse Drawback Warning Box if Corrupted
      if (card.rarity === 'CORRUPTED' && card.cursePenaltyKo) {
        const boxY = cy + cardH - 68;
        ctx.fillStyle = 'rgba(153, 27, 27, 0.45)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx + 8, boxY, cardW - 16, 36, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('⚠️ 저주 페널티:', cx + 12, boxY + 12);

        ctx.font = '7px sans-serif';
        this.renderWrappedText(ctx, card.cursePenaltyKo, cx + 12, boxY + 23, cardW - 24, 10);
      }

      // Hotkey indicator button
      ctx.textAlign = 'center';
      ctx.fillStyle = isSelected ? '#38bdf8' : 'rgba(51, 65, 85, 0.9)';
      ctx.beginPath();
      ctx.roundRect(cx + 20, cy + cardH - 24, cardW - 40, 18, 4);
      ctx.fill();

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = isSelected ? '#030712' : '#ffffff';
      ctx.fillText(`PRESS [${i + 1}]`, cx + cardW / 2, cy + cardH - 12);
    }

    // Modal Footer Reroll Hint
    ctx.textAlign = 'center';
    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(
      `REROLLS AVAILABLE: ${this.runState.rerollsAvailable} // PRESS [R] TO REROLL`,
      300,
      545
    );

    ctx.restore();
  }

  private renderWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  // ==========================================================================
  // STATE SERIALIZATION
  // ==========================================================================

  public saveRunState(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const serialized = JSON.stringify(this.runState);
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch {
      // Storage quota or privacy mode fallback
    }
  }

  public loadRunState(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as EndlessDescentRunState;
      if (parsed && parsed.isActive) {
        this.runState = parsed;
        return true;
      }
    } catch {}
    return false;
  }
}

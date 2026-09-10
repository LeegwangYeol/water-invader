// ============================================================================
// WATER INVADER: MASTER FLAGSHIP COORDINATOR & SYSTEM LIFECYCLE MANAGER
// ============================================================================

import {
  IFlagshipManager,
  IFlagshipSubsystem,
  FlagshipUpdateContext,
  ICavitationTorpedoSystem,
  IPrismLaserSystem,
  IHydraulicHarpoon,
  IHydrothermalVentManager,
  IBiolapseManager,
  BiolapsePhase,
  IChassisManager,
  ICrewManager,
  IBioHorrorManager,
  IAutomatonPhalanxManager,
  IApexBossManager,
  IEndlessDescentManager,
  ISonarRenderer,
} from './types';
import { Enemy } from '../Enemy';

// Genuine Subsystem Concrete Implementations
import { CavitationTorpedoSystem } from './weapons/CavitationTorpedo';
import { BioluminescentLaserSystem } from './weapons/BioluminescentLaser';
import { HydraulicHarpoon } from './weapons/HydraulicHarpoon';
import { HydrothermalVentManager } from './environment/HydrothermalVent';
import { BiolapseDarknessCycle } from './environment/BiolapseDarknessCycle';
import { ModularChassisManager } from './progression/ModularChassis';
import { CrewOfficerDeckManager } from './progression/CrewOfficerDeck';
import { HadalBioHorrors } from './factions/HadalBioHorrors';
import { AutomatonPhalanx } from './factions/AutomatonPhalanx';
import { KrakenPrimeBoss } from './factions/KrakenPrimeBoss';
import { EndlessDescent } from './modes/EndlessDescent';
import { SonarRenderer } from './sensory/index';

// ============================================================================
// CENTRAL FLAGSHIP MANAGER CLASS
// ============================================================================

export class FlagshipManager implements IFlagshipManager {
  public readonly logicalWidth: number;
  public readonly logicalHeight: number;

  // 12 Flagship Subsystems
  public cavitationTorpedo: ICavitationTorpedoSystem;
  public prismLaser: IPrismLaserSystem;
  public hydraulicHarpoon: IHydraulicHarpoon;
  public hydrothermalVents: IHydrothermalVentManager;
  public biolapseDarkness: IBiolapseManager;
  public modularChassis: IChassisManager;
  public crewDeck: ICrewManager;
  public bioHorror: IBioHorrorManager;
  public automatonPhalanx: IAutomatonPhalanxManager;
  public apexBoss: IApexBossManager;
  public endlessDescent: IEndlessDescentManager;
  public sonarRenderer: ISonarRenderer;

  // Custom extension subsystems registry
  private customSubsystems: Map<string, IFlagshipSubsystem> = new Map();

  constructor(logicalWidth: number = 600, logicalHeight: number = 800) {
    this.logicalWidth = logicalWidth;
    this.logicalHeight = logicalHeight;

    // Instantiate production-grade subsystems
    this.cavitationTorpedo = new CavitationTorpedoSystem();
    this.prismLaser = new BioluminescentLaserSystem();
    this.hydraulicHarpoon = new HydraulicHarpoon();
    this.hydrothermalVents = new HydrothermalVentManager(logicalWidth, logicalHeight);
    this.biolapseDarkness = new BiolapseDarknessCycle(logicalWidth, logicalHeight);
    this.modularChassis = new ModularChassisManager();
    this.crewDeck = new CrewOfficerDeckManager();
    this.bioHorror = new HadalBioHorrors();
    this.automatonPhalanx = new AutomatonPhalanx();
    this.apexBoss = new KrakenPrimeBoss();
    this.endlessDescent = new EndlessDescent();
    this.sonarRenderer = new SonarRenderer();
  }

  // Subsystem registration methods
  public registerCavitationTorpedoSystem(system: ICavitationTorpedoSystem): void {
    this.cavitationTorpedo = system;
  }

  public registerPrismLaserSystem(system: IPrismLaserSystem): void {
    this.prismLaser = system;
  }

  public registerHydraulicHarpoon(system: IHydraulicHarpoon): void {
    this.hydraulicHarpoon = system;
  }

  public registerHydrothermalVentManager(manager: IHydrothermalVentManager): void {
    this.hydrothermalVents = manager;
  }

  public registerBiolapseManager(manager: IBiolapseManager): void {
    this.biolapseDarkness = manager;
  }

  public registerChassisManager(manager: IChassisManager): void {
    this.modularChassis = manager;
  }

  public registerCrewManager(manager: ICrewManager): void {
    this.crewDeck = manager;
  }

  public registerBioHorrorManager(manager: IBioHorrorManager): void {
    this.bioHorror = manager;
  }

  public registerAutomatonPhalanxManager(manager: IAutomatonPhalanxManager): void {
    this.automatonPhalanx = manager;
  }

  public registerApexBossManager(manager: IApexBossManager): void {
    this.apexBoss = manager;
  }

  public registerEndlessDescentManager(manager: IEndlessDescentManager): void {
    this.endlessDescent = manager;
  }

  public registerSonarRenderer(renderer: ISonarRenderer): void {
    this.sonarRenderer = renderer;
  }

  public registerCustomSubsystem(subsystem: IFlagshipSubsystem): void {
    this.customSubsystems.set(subsystem.id, subsystem);
  }

  public getSubsystems(): IFlagshipSubsystem[] {
    return [
      this.cavitationTorpedo,
      this.prismLaser,
      this.hydraulicHarpoon,
      this.hydrothermalVents,
      this.biolapseDarkness,
      this.modularChassis,
      this.crewDeck,
      this.bioHorror,
      this.automatonPhalanx,
      this.apexBoss,
      this.endlessDescent,
      this.sonarRenderer,
      ...Array.from(this.customSubsystems.values()),
    ];
  }

  // ==========================================================================
  // MASTER LIFECYCLE HOOKS
  // ==========================================================================

  public init(): void {
    for (const sub of this.getSubsystems()) {
      if (typeof sub.init === 'function') {
        sub.init();
      }
    }
  }

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    for (const sub of this.getSubsystems()) {
      sub.update(deltaTime, context);
    }
  }

  public drawBackground(ctx: CanvasRenderingContext2D, time: number): void {
    if (!ctx) return;
    for (const sub of this.getSubsystems()) {
      if (typeof sub.drawBackground === 'function') {
        sub.drawBackground(ctx, time);
      }
    }
  }

  public drawWorld(ctx: CanvasRenderingContext2D, time: number): void {
    if (!ctx) return;
    for (const sub of this.getSubsystems()) {
      if (typeof sub.drawWorld === 'function') {
        sub.drawWorld(ctx, time);
      }
    }
  }

  public drawForeground(ctx: CanvasRenderingContext2D, time: number): void {
    if (!ctx) return;

    // 1. Environmental darkness composite overlay
    if (typeof this.biolapseDarkness.drawForeground === 'function') {
      this.biolapseDarkness.drawForeground(ctx, time);
    }

    // 2. Factions tactical banners and apex boss health bars
    if (typeof this.bioHorror.drawForeground === 'function') {
      this.bioHorror.drawForeground(ctx, time);
    }
    if (typeof this.apexBoss.drawForeground === 'function') {
      this.apexBoss.drawForeground(ctx, time);
    }

    // 3. Sonar radar sweep, hydrophone spectrogram waterfall, and glass fractures
    if (typeof this.sonarRenderer.drawForeground === 'function') {
      this.sonarRenderer.drawForeground(ctx, time);
    }

    // 4. Veteran Crew Deck HUD (officer cards, cooldowns, resonances)
    if (typeof this.crewDeck.drawHUD === 'function') {
      this.crewDeck.drawHUD(ctx);
    }

    // 5. Endless Descent Roguelike HUD (bathymetric depth bar, map, boon draft modal)
    if (typeof this.endlessDescent.drawHUD === 'function') {
      this.endlessDescent.drawHUD(ctx);
    }

    // 6. Any other custom registered subsystems
    const alreadyDrawn = new Set([
      this.biolapseDarkness.id,
      this.bioHorror.id,
      this.apexBoss.id,
      this.sonarRenderer.id,
      this.crewDeck.id,
      this.endlessDescent.id,
    ]);
    for (const sub of this.getSubsystems()) {
      if (!alreadyDrawn.has(sub.id) && typeof sub.drawForeground === 'function') {
        sub.drawForeground(ctx, time);
      }
    }
  }

  public handleInput(key: string, isDown: boolean, context: FlagshipUpdateContext): boolean {
    // 1. If Endless Descent Draft or Map Modal is open, handle draft hotkeys [1][2][3], [R] reroll, [M] map, [Escape]
    if (this.endlessDescent.handleInput && this.endlessDescent.handleInput(key, isDown, context)) {
      return true;
    }

    // 2. Officer skills: [1]/[Q], [2]/[E], [3]/[R], [4]/[F]
    if (isDown) {
      if (['1', '2', '3', '4', 'q', 'Q', 'e', 'E', 'r', 'R', 'f', 'F'].includes(key)) {
        if (this.crewDeck.handleInput && this.crewDeck.handleInput(key, isDown, context)) {
          return true;
        }
      }
    }

    // 3. Cavitation Torpedo [C] / [X]
    if (isDown && (key === 'c' || key === 'C' || key === 'x' || key === 'X')) {
      if (this.cavitationTorpedo.handleInput && this.cavitationTorpedo.handleInput(key, isDown, context)) {
        return true;
      }
    }

    // 4. Photic Laser [Space] (firing state on down/up) & Prism Deploy [P]
    if (key === ' ' || key === 'Space' || key === 'p' || key === 'P') {
      if (this.prismLaser.handleInput && this.prismLaser.handleInput(key, isDown, context)) {
        // Laser input handled
      }
    }

    // 5. Hydraulic Harpoon [H] & Winch [Shift]
    if (['h', 'H', 'Shift', 'ShiftLeft', 'ShiftRight'].includes(key)) {
      if (this.hydraulicHarpoon.handleInput && this.hydraulicHarpoon.handleInput(key, isDown, context)) {
        return true;
      }
    }

    // 6. Biolapse Searchlight toggle [L], High-Beam [V], Sonar Ping [B]
    if (isDown) {
      if (key === 'l' || key === 'L') {
        this.biolapseDarkness.toggleLight();
        return true;
      }
      if (key === 'v' || key === 'V') {
        this.biolapseDarkness.setHighBeam(!this.biolapseDarkness.isHighBeam);
        return true;
      }
      if (key === 'b' || key === 'B') {
        if (!this.biolapseDarkness.sonarPingActive) {
          this.biolapseDarkness.triggerSonarPing();
          return true;
        }
      }
    }

    // 7. Parasite Wiggle / Counterplay via BioHorror
    if (this.bioHorror.handleInput && this.bioHorror.handleInput(key, isDown, context)) {
      return true;
    }

    // 8. Forward to any remaining custom subsystems
    for (const sub of this.customSubsystems.values()) {
      if (typeof sub.handleInput === 'function') {
        if (sub.handleInput(key, isDown, context)) {
          return true;
        }
      }
    }

    return false;
  }

  public handlePointer(x: number, y: number, isDown: boolean, context: FlagshipUpdateContext, button: number = 0): boolean {
    if (!isDown) return false;

    // Right-click or secondary click triggers Torpedo / Ballast
    if (button === 2) {
      if (this.cavitationTorpedo.detonateActiveTorpedo()) return true;
      const origin = {
        x: context.player.position.x + context.player.size.width / 2 - 7,
        y: context.player.position.y - 12,
      };
      if (this.cavitationTorpedo.fireTorpedo(origin)) return true;
      if (this.endlessDescent.ventBallast()) return true;
    }

    // Endless Descent modal clicks (Draft cards or Map nodes)
    const descent = this.endlessDescent as any;
    if (descent.isDraftModalOpen && Array.isArray(descent.currentDraftCards) && descent.currentDraftCards.length > 0) {
      const cardW = 164;
      const cardH = 280;
      const gap = 16;
      const totalW = cardW * 3 + gap * 2;
      const startX = (600 - totalW) / 2;
      const startY = 220;

      for (let i = 0; i < descent.currentDraftCards.length; i++) {
        const cx = startX + i * (cardW + gap);
        const cy = startY;
        if (x >= cx && x <= cx + cardW && y >= cy && y <= cy + cardH) {
          descent.draftBoon(descent.currentDraftCards[i], context);
          return true;
        }
      }
    }

    if (descent.isMapModalOpen && descent.runState && descent.runState.mapNodes) {
      const startY = 120;
      const stratumSpacing = 72;
      for (const node of Object.values(descent.runState.mapNodes) as any[]) {
        if (!node || node.isCompleted) continue;
        const nodesInRow = Object.values(descent.runState.mapNodes).filter((n: any) => n.stratum === node.stratum);
        const spacing = 500 / (nodesInRow.length + 1);
        const nx = 50 + spacing * (node.indexInStratum + 1);
        const ny = startY + (node.stratum - 1) * stratumSpacing;
        const distSq = (x - nx) ** 2 + (y - ny) ** 2;
        if (distSq <= 20 * 20) {
          descent.selectNode(node.id, context);
          return true;
        }
      }
    }

    return false;
  }

  public reset(preserveUpgrades: boolean = false, isContinue: boolean = false): void {
    for (const sub of this.getSubsystems()) {
      if (typeof sub.reset === 'function') {
        sub.reset(preserveUpgrades, isContinue);
      }
    }
  }

  // ==========================================================================
  // GAME EVENT CALLBACKS
  // ==========================================================================

  public onWaveComplete(wave: number, context: FlagshipUpdateContext): void {
    // 1. Epigenetic mutation evaluation in BioHorror
    if (this.bioHorror && (this.bioHorror as any).mutationEngine) {
      (this.bioHorror as any).mutationEngine.evaluateWaveTransition(wave);
      this.bioHorror.state.activeMutation = (this.bioHorror as any).mutationEngine.getActiveMutation();
      this.bioHorror.state.mutationProgress = (this.bioHorror as any).mutationEngine.getMutationProgress();
    }

    // 2. Endless Descent Stratum transition
    if (this.endlessDescent && this.endlessDescent.runState.isActive) {
      this.endlessDescent.generateNextStratumDraft();
    }

    // 3. Forward to all subsystems with onWaveComplete
    for (const sub of this.getSubsystems()) {
      if (typeof (sub as any).onWaveComplete === 'function') {
        (sub as any).onWaveComplete(wave, context);
      }
    }
  }

  public onEnemyKilled(enemy: Enemy, context: FlagshipUpdateContext): void {
    // 1. Check biolapse battery recharge on kill in midnight
    if (this.biolapseDarkness.currentPhase === BiolapsePhase.MIDNIGHT) {
      this.biolapseDarkness.battery = Math.min(
        this.biolapseDarkness.maxBattery,
        this.biolapseDarkness.battery + 15
      );
    }

    // 2. Track damage telemetry for epigenetic mutation engine
    if (this.bioHorror && typeof this.bioHorror.recordDamageDealt === 'function') {
      this.bioHorror.recordDamageDealt('kinetic', enemy.maxHp || 10);
    }

    // 3. Forward to subsystems with onEnemyKilled
    for (const sub of this.getSubsystems()) {
      if (typeof (sub as any).onEnemyKilled === 'function') {
        (sub as any).onEnemyKilled(enemy, context);
      }
    }
  }

  public onPlayerDamage(amount: number, context: FlagshipUpdateContext): void {
    // 1. Add glass fracture if under high stress
    if (this.endlessDescent.runState.pressure.stressPercentage > 50) {
      this.sonarRenderer.addFracture(this.endlessDescent.runState.pressure.stressPercentage);
    }

    // 2. Check modular chassis damage mitigation & passives
    if (this.modularChassis.activeChassis && this.modularChassis.activeChassis.onTakeDamage) {
      const result = this.modularChassis.activeChassis.onTakeDamage(context.player.hp, amount);
      if (result.triggeredEffect === 'STEAM_PULSE') {
        context.createExplosion(context.player.position.x + 20, context.player.position.y, '#ffffff', 25, 2.0);
        context.triggerScreenShake(0.3, 8);
      }
    }

    // 3. Forward to subsystems with onPlayerDamage
    for (const sub of this.getSubsystems()) {
      if (typeof (sub as any).onPlayerDamage === 'function') {
        (sub as any).onPlayerDamage(amount, context);
      }
    }
  }

  public checkRevive(context: FlagshipUpdateContext): boolean {
    if (this.crewDeck && typeof (this.crewDeck as any).triggerSubZeroPurge === 'function') {
      return (this.crewDeck as any).triggerSubZeroPurge(context);
    }
    return false;
  }
}

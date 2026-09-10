// ============================================================================
// WATER INVADER: FACTIONS & APEX ENCOUNTERS MODULE AGGREGATOR
// Stream D: Hadal Bio-Horrors, Automaton Shield Phalanx & Charybdis Prime Kraken
// ============================================================================

export * from './EpigeneticMutationEngine';
export * from './HadalBioHorrors';
export * from './AutomatonShieldGrid';
export * from './AutomatonPhalanx';
export * from './KrakenPrimeBoss';

import { IFlagshipSubsystem, FlagshipUpdateContext, IFlagshipManager, ApexBossType } from '../types';
import { HadalBioHorrors } from './HadalBioHorrors';
import { AutomatonPhalanx } from './AutomatonPhalanx';
import { KrakenPrimeBoss } from './KrakenPrimeBoss';

/**
 * Unified Factions & Apex Encounters Subsystem
 * Implements IFlagshipSubsystem to coordinate all three adversary architectures:
 * 1. Mutating Hadal Bio-Horrors + Epigenetic Mutation Engine
 * 2. Lemurian Iron Hegemony Automaton Fleet + Resonant Hexagonal Shield Grid
 * 3. Apex Megalodon Kraken (Charybdis Prime) with 12,000 EHP
 */
export class FactionsSubsystem implements IFlagshipSubsystem {
  public readonly id = 'factions-subsystem';

  public readonly bioHorror: HadalBioHorrors;
  public readonly automatonPhalanx: AutomatonPhalanx;
  public readonly apexBoss: KrakenPrimeBoss;

  constructor() {
    this.bioHorror = new HadalBioHorrors();
    this.automatonPhalanx = new AutomatonPhalanx();
    this.apexBoss = new KrakenPrimeBoss();
  }

  public init(): void {
    this.bioHorror.init();
    this.automatonPhalanx.init();
    this.apexBoss.init();
  }

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    this.bioHorror.update(deltaTime, context);
    this.automatonPhalanx.update(deltaTime, context);
    this.apexBoss.update(deltaTime, context);
  }

  public drawWorld(ctx: CanvasRenderingContext2D, time: number): void {
    this.bioHorror.drawWorld(ctx, time);
    this.automatonPhalanx.drawWorld(ctx, time);
    this.apexBoss.drawWorld(ctx, time);
  }

  public drawForeground(ctx: CanvasRenderingContext2D, time: number): void {
    this.bioHorror.drawForeground(ctx, time);
    this.apexBoss.drawForeground(ctx, time);
  }

  public handleInput(key: string, isDown: boolean, context: FlagshipUpdateContext): boolean {
    // Delegate to Bio-Horror for parasite wiggle shake-off
    if (this.bioHorror.handleInput && this.bioHorror.handleInput(key, isDown, context)) {
      return true;
    }
    return false;
  }

  public reset(preserveUpgrades: boolean = false, isContinue: boolean = false): void {
    this.bioHorror.reset();
    this.automatonPhalanx.reset();
    this.apexBoss.reset();
  }

  /**
   * Spawns a balanced wave of Hadal Bio-Horrors based on wave depth.
   */
  public spawnBioWave(wave: number, centerX: number = 300): void {
    // Parasite Clinger diving escort
    this.bioHorror.spawnParasiteClinger(centerX - 80, 50);
    this.bioHorror.spawnParasiteClinger(centerX + 80, 50);

    // Spore Siphoner support
    this.bioHorror.spawnSporeSiphoner(centerX, 80);

    // Elites at wave >= 5
    if (wave >= 5) {
      this.bioHorror.spawnCarapaceColossus(centerX - 120, 110);
    }
    if (wave >= 8) {
      this.bioHorror.spawnAbyssalAngler(centerX + 120, 130);
    }
    if (wave >= 12) {
      this.bioHorror.spawnBroodmotherMatriarch(centerX, 90);
    }
  }

  /**
   * Spawns an interlocking Automaton Shield Phalanx formation.
   */
  public spawnAutomatonPhalanxFormation(wave: number, startY: number = 90): void {
    // Frontline: 3 Aegis Drones within 160px of each other to activate resonant coupling!
    // Spacing 100px (100 <= 160) satisfies Euclidean distance coupling invariant
    const drone1 = this.automatonPhalanx.spawnAegisDrone(200, startY, wave);
    const drone2 = this.automatonPhalanx.spawnAegisDrone(300, startY, wave);
    const drone3 = this.automatonPhalanx.spawnAegisDrone(400, startY, wave);

    // Midline: EMP Disruption Prowler strafing above frontline
    this.automatonPhalanx.spawnEmpProwler(300, startY - 45);

    // Backline: Rail-Mortar Sentinel heavy artillery
    if (wave >= 4) {
      this.automatonPhalanx.spawnRailSentinel(250, startY - 70);
      this.automatonPhalanx.spawnRailSentinel(350, startY - 70);
    }
  }

  /**
   * Spawns the Apex Megalodon Kraken Boss encounter (12,000 EHP).
   */
  public spawnApexKraken(): void {
    this.apexBoss.spawnApexBoss(ApexBossType.CHARYBDIS_PRIME);
  }

  /**
   * Registers all three concrete subsystem implementations into the master FlagshipManager coordinator.
   */
  public attachToFlagshipManager(flagship: IFlagshipManager): void {
    if (typeof (flagship as any).registerBioHorrorManager === 'function') {
      (flagship as any).registerBioHorrorManager(this.bioHorror);
    }
    if (typeof (flagship as any).registerAutomatonPhalanxManager === 'function') {
      (flagship as any).registerAutomatonPhalanxManager(this.automatonPhalanx);
    }
    if (typeof (flagship as any).registerApexBossManager === 'function') {
      (flagship as any).registerApexBossManager(this.apexBoss);
    }
    if (typeof (flagship as any).registerCustomSubsystem === 'function') {
      (flagship as any).registerCustomSubsystem(this);
    }
  }

  /**
   * Hook for wave completion to trigger epigenetic adaptation analysis.
   */
  public onWaveComplete(wave: number, _context: FlagshipUpdateContext): void {
    this.bioHorror.mutationEngine.evaluateWaveTransition(wave);
    this.bioHorror.state.activeMutation = this.bioHorror.mutationEngine.getActiveMutation();
    this.bioHorror.state.mutationProgress = this.bioHorror.mutationEngine.getMutationProgress();
  }
}

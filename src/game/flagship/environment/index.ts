// ============================================================================
// WATER INVADER: STREAM B — ENVIRONMENTAL DYNAMICS & LIGHTING SYSTEMS
// ============================================================================

export * from './OceanCurrent';
export * from './HydrothermalVent';
export * from './BiolapseDarknessCycle';

import {
  IFlagshipSubsystem,
  IHydrothermalVentManager,
  IBiolapseManager,
  FlagshipUpdateContext,
} from '../types';
import { OceanCurrent } from './OceanCurrent';
import { HydrothermalVentManager } from './HydrothermalVent';
import { BiolapseDarknessCycle } from './BiolapseDarknessCycle';

/**
 * Unified Environmental Dynamics & Lighting Subsystem
 * Encapsulates Hydrothermal Vents, Ocean Currents, and the Biolapse Darkness Cycle.
 */
export class EnvironmentSubsystem implements IFlagshipSubsystem {
  public readonly id: string = 'environment-subsystem';

  public hydrothermalVents: HydrothermalVentManager;
  public biolapseDarkness: BiolapseDarknessCycle;
  public oceanCurrent: OceanCurrent;

  public readonly canvasWidth: number;
  public readonly canvasHeight: number;

  constructor(canvasWidth: number = 600, canvasHeight: number = 800) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.hydrothermalVents = new HydrothermalVentManager(canvasWidth, canvasHeight);
    this.biolapseDarkness = new BiolapseDarknessCycle(canvasWidth, canvasHeight);
    this.oceanCurrent = this.hydrothermalVents.currentSystem as OceanCurrent;
  }

  public init(): void {
    this.hydrothermalVents.init();
    this.biolapseDarkness.init();
  }

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    this.hydrothermalVents.update(deltaTime, context);
    this.biolapseDarkness.update(deltaTime, context);
  }

  public drawBackground(ctx: CanvasRenderingContext2D, time: number): void {
    this.hydrothermalVents.drawBackground(ctx, time);
  }

  public drawWorld(ctx: CanvasRenderingContext2D, time?: number): void {
    this.hydrothermalVents.drawWorld(ctx);
  }

  public drawForeground(ctx: CanvasRenderingContext2D, time?: number): void {
    this.biolapseDarkness.drawForeground(ctx);
  }

  public handleInput(
    key: string,
    isDown: boolean,
    context: FlagshipUpdateContext
  ): boolean {
    return this.biolapseDarkness.handleInput(key, isDown, context);
  }

  public reset(preserveUpgrades?: boolean, isContinue?: boolean): void {
    this.hydrothermalVents.reset();
    this.biolapseDarkness.reset();
  }
}

/**
 * Factory helper for initializing the complete Stream B environment subsystem.
 */
export function createEnvironmentSubsystem(
  canvasWidth: number = 600,
  canvasHeight: number = 800
): EnvironmentSubsystem {
  return new EnvironmentSubsystem(canvasWidth, canvasHeight);
}

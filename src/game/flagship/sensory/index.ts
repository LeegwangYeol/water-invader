// ============================================================================
// WATER INVADER: FEATURE 12 - TACTICAL SONAR & ACOUSTIC SENSORY SUITE
// ============================================================================
// Unified Subsystem integrating Tactical Sonar HUD, Hydrophone Waterfall Spectrogram,
// and Claustrophobic Hull Stress FX under the ISonarRenderer interface contract.

import {
  ISonarRenderer,
  IFlagshipSubsystem,
  SonarRadarState,
  HydrophoneWaterfallState,
  FlagshipUpdateContext,
} from '../types';
import { TacticalSonarHUD } from './TacticalSonarHUD';
import { HydrophoneSpectrogram } from './HydrophoneSpectrogram';
import { HullStressFX } from './HullStressFX';

export * from './TacticalSonarHUD';
export * from './HydrophoneSpectrogram';
export * from './HullStressFX';

export class SonarRenderer implements ISonarRenderer, IFlagshipSubsystem {
  public readonly id: string = 'sonar-renderer';

  // Sub-components
  public hud: TacticalSonarHUD;
  public spectrogram: HydrophoneSpectrogram;
  public stressFX: HullStressFX;

  constructor() {
    this.hud = new TacticalSonarHUD();
    this.spectrogram = new HydrophoneSpectrogram();
    this.stressFX = new HullStressFX();
  }

  public get hullStress(): HullStressFX {
    return this.stressFX;
  }

  public get radarState(): SonarRadarState {
    // Keep synchronised with internal components
    this.hud.radarState.glassFractureLines = this.stressFX.fractureLines;
    this.hud.radarState.screenShakeTrauma = this.stressFX.screenShakeTrauma;
    return this.hud.radarState;
  }

  public set radarState(state: SonarRadarState) {
    this.hud.radarState = state;
  }

  public get waterfallState(): HydrophoneWaterfallState {
    return this.spectrogram.waterfallState;
  }

  public set waterfallState(state: HydrophoneWaterfallState) {
    this.spectrogram.waterfallState = state;
  }

  public spawnWavefront(
    x: number,
    y: number,
    color: string = '#06b6d4',
    maxRadius: number = 240
  ): void {
    this.hud.spawnWavefront(x, y, color, maxRadius);
  }

  public addFracture(stressPercentage: number): void {
    this.stressFX.addFracture(stressPercentage);
    this.stressFX.triggerTrauma(0.4);
  }

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    this.hud.update(deltaTime, context);
    this.spectrogram.update(deltaTime, context);
    this.stressFX.update(deltaTime, context);
  }

  public drawSonarRadar(ctx: CanvasRenderingContext2D): void {
    this.hud.draw(ctx);
  }

  public drawWaterfall(
    ctx: CanvasRenderingContext2D,
    x: number = 180,
    y: number = 745,
    width: number = 240,
    height: number = 44
  ): void {
    this.spectrogram.draw(ctx, x, y, width, height);
  }

  public drawGlassFractures(ctx: CanvasRenderingContext2D): void {
    this.stressFX.draw(ctx);
  }

  /**
   * Foreground draw pass integrates radar sweep, bottom hydrophone spectrogram, and glass fractures
   */
  public drawForeground(ctx: CanvasRenderingContext2D, _time: number): void {
    this.drawSonarRadar(ctx);
    this.drawWaterfall(ctx, 180, 745, 240, 44);
    this.drawGlassFractures(ctx);
  }

  public reset(_preserveUpgrades: boolean = false, _isContinue: boolean = false): void {
    this.hud.reset();
    this.spectrogram.reset();
    this.stressFX.reset();
  }
}

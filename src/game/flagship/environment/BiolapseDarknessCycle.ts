// ============================================================================
// WATER INVADER: BIOLAPSE DARKNESS CYCLE & PHOTONIC SEARCHLIGHT SYSTEM
// ============================================================================

import {
  IBiolapseManager,
  BiolapsePhase,
  FlagshipUpdateContext,
} from '../types';
import { Entity } from '../../Entity';
import { Enemy } from '../../Enemy';
import { Player } from '../../Player';
import { Vector2D } from '../../types';

export interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export interface SonarWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
}

export interface PhotonicShockFlash {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export class BiolapseDarknessCycle implements IBiolapseManager {
  public readonly id: string = 'biolapse-darkness';

  // 4-Phase Darkness Cycle State
  public currentPhase: BiolapsePhase = BiolapsePhase.DIURNAL;
  public phaseTimer: number = 0;
  public ambientLux: number = 1.0; // 0.0 (midnight) to 1.0 (sunlight)

  // Phase Durations (Total 95.0s: 60s Diurnal -> 5s Twilight -> 25s Midnight -> 5s Dawn)
  public readonly diurnalDuration: number = 60.0;
  public readonly twilightDuration: number = 5.0;
  public readonly midnightDuration: number = 25.0;
  public readonly dawnDuration: number = 5.0;

  // Headlight Searchlight System
  public battery: number = 100; // 0 to 100 units
  public maxBattery: number = 100;
  public isLightOn: boolean = false;
  public isHighBeam: boolean = false;

  // Active Sonar Ping
  public sonarPingActive: boolean = false;
  public sonarPingTimer: number = 0;
  public readonly sonarPingDuration: number = 4.0;
  private activeSonarWaves: SonarWave[] = [];

  // Cached player state for rendering in drawForeground
  private cachedPlayerPos: Vector2D = { x: 300, y: 700 };
  private cachedPlayerVx: number = 0;
  private cachedPlayerWidth: number = 40;
  private cachedPlayerHeight: number = 30;

  // Flash Shock particles and dust motes
  private dustMotes: DustMote[] = [];
  private shockFlashes: PhotonicShockFlash[] = [];
  private readonly maxDustMotes: number = 24;

  // Track previously illuminated enemies to trigger Photonic Flash Shock once on transition
  private previouslyIlluminatedEnemyIds: Set<number> = new Set<number>();

  public readonly canvasWidth: number = 600;
  public readonly canvasHeight: number = 800;

  constructor(canvasWidth: number = 600, canvasHeight: number = 800) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.initDustMotes();
  }

  private initDustMotes(): void {
    this.dustMotes = [];
    for (let i = 0; i < this.maxDustMotes; i++) {
      this.dustMotes.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        radius: 0.8 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.4,
      });
    }
  }

  public init(): void {
    this.reset();
  }

  public toggleLight(): boolean {
    this.isLightOn = !this.isLightOn;
    return this.isLightOn;
  }

  public setHighBeam(active: boolean): void {
    this.isHighBeam = active;
    if (active) {
      this.isLightOn = true;
    }
  }

  public triggerSonarPing(): boolean {
    this.sonarPingActive = true;
    this.sonarPingTimer = this.sonarPingDuration;
    this.activeSonarWaves.push({
      x: this.cachedPlayerPos.x + this.cachedPlayerWidth / 2,
      y: this.cachedPlayerPos.y,
      radius: 10,
      maxRadius: 750,
      speed: 480, // 480 px/s
      alpha: 1.0,
    });
    return true;
  }

  /**
   * Calculates the searchlight beam orientation angle based on player lateral movement.
   * theta_beam = -90 deg + (vx / vmax) * 15 deg
   */
  public getBeamAngle(playerVx: number): number {
    const vMax = 300;
    const clampedVx = Math.max(-vMax, Math.min(vMax, playerVx));
    const maxTiltRad = (15 * Math.PI) / 180;
    return -Math.PI / 2 + (clampedVx / vMax) * maxTiltRad;
  }

  /**
   * Calculates the angular half-span (phi) of the beam cone:
   * 28 deg (0.488 rad) normal, 38 deg (0.663 rad) high-beam.
   */
  public getBeamHalfAngle(): number {
    const deg = this.isHighBeam ? 38 : 28;
    return (deg * Math.PI) / 180;
  }

  /**
   * Calculates illumination range as a function of battery reserves:
   * R_beam(B) = 440 * (0.35 + 0.65 * (B / 100)) px
   */
  public getBeamRange(): number {
    if (this.battery <= 0) return 0;
    const batteryRatio = Math.max(0, Math.min(1, this.battery / 100));
    return 440 * (0.35 + 0.65 * batteryRatio);
  }

  /**
   * Evaluates if a given entity is illuminated by the searchlight cone,
   * active sonar ping, or diurnal daylight.
   */
  public isEntityIlluminated(
    entity: Entity,
    playerPos: Vector2D,
    playerVx: number
  ): boolean {
    if (!entity || !entity.position) return false;

    // 1. Full daylight illumination
    if (this.ambientLux >= 0.85) return true;

    // 2. Sonar Ping unveils all entities across canvas
    if (this.sonarPingActive) return true;

    // Headlight illumination requires light to be ON and battery > 0
    if (!this.isLightOn || this.battery <= 0) return false;

    const ex = entity.position.x + (entity.size?.width ?? 32) / 2;
    const ey = entity.position.y + (entity.size?.height ?? 32) / 2;

    const prowX = playerPos.x + this.cachedPlayerWidth / 2;
    const prowY = playerPos.y - 12;

    const dx = ex - prowX;
    const dy = ey - prowY;
    const dist = Math.hypot(dx, dy);

    // Close hull tactile aura (within 55px always visible to prevent collision surprises)
    if (dist < 55) return true;

    // Check distance range
    const maxRange = this.getBeamRange();
    if (dist > maxRange) return false;

    // Check angular cone
    const beamAngle = this.getBeamAngle(playerVx);
    const halfAngle = this.getBeamHalfAngle();

    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = Math.abs(angleToTarget - beamAngle);
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    angleDiff = Math.abs(angleDiff);

    return angleDiff <= halfAngle;
  }

  /**
   * Main simulation update loop.
   */
  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    // Cache player state
    if (context.player && context.player.position) {
      this.cachedPlayerPos.x = context.player.position.x;
      this.cachedPlayerPos.y = context.player.position.y;
      this.cachedPlayerWidth = context.player.size?.width ?? 40;
      this.cachedPlayerHeight = context.player.size?.height ?? 30;
      this.cachedPlayerVx = context.player.velocity?.x ?? 0;
    }

    // 1. 4-Phase Darkness Cycle State Machine deterministically with time budget
    let remainingDelta = deltaTime;
    while (remainingDelta > 0) {
      if (this.currentPhase === BiolapsePhase.DIURNAL) {
        const needed = this.diurnalDuration - this.phaseTimer;
        if (remainingDelta >= needed) {
          this.phaseTimer = 0;
          this.currentPhase = BiolapsePhase.TWILIGHT;
          remainingDelta -= needed;
        } else {
          this.phaseTimer += remainingDelta;
          remainingDelta = 0;
        }
      } else if (this.currentPhase === BiolapsePhase.TWILIGHT) {
        const needed = this.twilightDuration - this.phaseTimer;
        if (remainingDelta >= needed) {
          this.phaseTimer = 0;
          this.currentPhase = BiolapsePhase.MIDNIGHT;
          remainingDelta -= needed;
        } else {
          this.phaseTimer += remainingDelta;
          remainingDelta = 0;
        }
      } else if (this.currentPhase === BiolapsePhase.MIDNIGHT) {
        const needed = this.midnightDuration - this.phaseTimer;
        if (remainingDelta >= needed) {
          this.phaseTimer = 0;
          this.currentPhase = BiolapsePhase.DAWN;
          remainingDelta -= needed;
        } else {
          this.phaseTimer += remainingDelta;
          remainingDelta = 0;
        }
      } else if (this.currentPhase === BiolapsePhase.DAWN) {
        const needed = this.dawnDuration - this.phaseTimer;
        if (remainingDelta >= needed) {
          this.phaseTimer = 0;
          this.currentPhase = BiolapsePhase.DIURNAL;
          remainingDelta -= needed;
        } else {
          this.phaseTimer += remainingDelta;
          remainingDelta = 0;
        }
      } else {
        remainingDelta = 0;
      }
    }

    // Update ambient lux according to current phase & phaseTimer
    switch (this.currentPhase) {
      case BiolapsePhase.DIURNAL:
        this.ambientLux = 1.0;
        break;
      case BiolapsePhase.TWILIGHT:
        this.ambientLux = Math.max(0, 1.0 - this.phaseTimer / this.twilightDuration);
        break;
      case BiolapsePhase.MIDNIGHT:
        this.ambientLux = 0.0;
        break;
      case BiolapsePhase.DAWN:
        this.ambientLux = Math.min(1.0, this.phaseTimer / this.dawnDuration);
        break;
    }

    // 2. Battery Thermodynamics & Kinetic Hydro-Dynamo
    if (this.isLightOn && this.battery <= 0) {
      if (this.isHighBeam) this.isHighBeam = false;
      this.isLightOn = false;
    }

    if (this.isLightOn) {
      // Drain: -4 units/s in Standard, -10 units/s in High-Beam Overdrive
      const drain = this.isHighBeam ? 10.0 : 4.0;
      this.battery = Math.max(0, this.battery - drain * deltaTime);

      // Turn off light and reset high-beam when battery is exhausted
      if (this.battery <= 0) {
        if (this.isHighBeam) {
          this.isHighBeam = false;
        }
        this.isLightOn = false;
      }
    } else {
      // Hydro-dynamo recharge: +3.0 units/s while moving, +1.2 units/s while stationary
      const isMoving = Math.abs(this.cachedPlayerVx) > 10;
      const charge = isMoving ? 3.0 : 1.2;
      this.battery = Math.min(this.maxBattery, this.battery + charge * deltaTime);
    }

    // 3. Active Sonar Ping Lifetime & Wave Propagation
    if (this.sonarPingActive) {
      this.sonarPingTimer -= deltaTime;
      if (this.sonarPingTimer <= 0) {
        this.sonarPingActive = false;
      }
    }

    for (let i = this.activeSonarWaves.length - 1; i >= 0; i--) {
      const wave = this.activeSonarWaves[i];
      wave.radius += wave.speed * deltaTime;
      wave.alpha = Math.max(0, 1.0 - wave.radius / wave.maxRadius);
      if (wave.radius >= wave.maxRadius || wave.alpha <= 0) {
        this.activeSonarWaves.splice(i, 1);
      }
    }

    // 4. Update Photonic Shock Flashes
    for (let i = this.shockFlashes.length - 1; i >= 0; i--) {
      const flash = this.shockFlashes[i];
      flash.radius += 40 * deltaTime;
      flash.alpha -= deltaTime * 2.5;
      if (flash.alpha <= 0) {
        this.shockFlashes.splice(i, 1);
      }
    }

    // 5. Update Atmospheric Dust Motes
    for (const mote of this.dustMotes) {
      mote.x += mote.vx * deltaTime;
      mote.y += mote.vy * deltaTime;
      if (mote.x < 0) mote.x = this.canvasWidth;
      else if (mote.x > this.canvasWidth) mote.x = 0;
      if (mote.y < 0) mote.y = this.canvasHeight;
      else if (mote.y > this.canvasHeight) mote.y = 0;
    }

    // 6. Enemy Predator Camouflage & Photonic Flash Shock Stun
    const currentIlluminatedIds = new Set<number>();

    for (const enemy of context.enemies) {
      if (!enemy || (enemy as any).isDead) continue;
      const enemyId = (enemy as any).id ?? enemy.position.x + enemy.position.y * 1000;

      const isLit = this.isEntityIlluminated(
        enemy,
        this.cachedPlayerPos,
        this.cachedPlayerVx
      );

      if (isLit) {
        currentIlluminatedIds.add(enemyId);

        // Check if enemy just entered illumination -> TRIGGER PHOTONIC FLASH SHOCK
        if (!this.previouslyIlluminatedEnemyIds.has(enemyId) && this.ambientLux < 0.4) {
          // 0.8s stun
          (enemy as any).isStunned = true;
          (enemy as any).stunTimer = Math.max((enemy as any).stunTimer || 0, 0.8);

          // +25% damage vulnerability for 3.0s
          (enemy as any).vulnerabilityTimer = 3.0;
          (enemy as any).vulnerabilityMultiplier = 1.25;

          // Spawn flash shock ripple
          this.shockFlashes.push({
            x: enemy.position.x + (enemy.size?.width ?? 32) / 2,
            y: enemy.position.y + (enemy.size?.height ?? 32) / 2,
            radius: 12,
            alpha: 1.0,
          });
        }

        // Fully targetable by homing missiles
        (enemy as any).isCamouflaged = false;
      } else {
        // Unlit enemy in deep darkness: Predator Ambush State
        if (this.ambientLux < 0.3) {
          (enemy as any).isCamouflaged = true; // Prevents homing missile lock
        }
      }
    }

    this.previouslyIlluminatedEnemyIds = currentIlluminatedIds;
  }

  /**
   * Renders the darkness canvas mask and cuts out the searchlight beam cone using destination-out.
   */
  public renderDarknessOverlay(
    ctx: CanvasRenderingContext2D,
    playerPos: Vector2D,
    playerVx: number
  ): void {
    if (!ctx || typeof ctx.save !== 'function') return;
    if (this.ambientLux >= 0.98) return;

    ctx.save();

    const prowX = playerPos.x + this.cachedPlayerWidth / 2;
    const prowY = playerPos.y - 12;

    const darknessAlpha = (1.0 - this.ambientLux) * 0.95;

    // 1. Fullscreen darkness veil (#030712)
    ctx.fillStyle = `rgba(3, 7, 18, ${darknessAlpha})`;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 2. Cut out searchlight beam using destination-out
    if (this.isLightOn && this.battery > 0) {
      ctx.globalCompositeOperation = 'destination-out';

      const beamAngle = this.getBeamAngle(playerVx);
      const halfAngle = this.getBeamHalfAngle();
      const beamRange = this.getBeamRange();

      // Conical searchlight cutout
      const beamGrad = ctx.createRadialGradient(
        prowX,
        prowY,
        15,
        prowX,
        prowY,
        beamRange
      );
      beamGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      beamGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.85)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(prowX, prowY);
      ctx.arc(prowX, prowY, beamRange, beamAngle - halfAngle, beamAngle + halfAngle);
      ctx.closePath();
      ctx.fill();

      // Tactile hull aura cutout around player sub
      const hullAuraGrad = ctx.createRadialGradient(
        prowX,
        playerPos.y + this.cachedPlayerHeight / 2,
        5,
        prowX,
        playerPos.y + this.cachedPlayerHeight / 2,
        55
      );
      hullAuraGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      hullAuraGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      ctx.fillStyle = hullAuraGrad;
      ctx.beginPath();
      ctx.arc(prowX, playerPos.y + this.cachedPlayerHeight / 2, 55, 0, Math.PI * 2);
      ctx.fill();

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      // 3. Volumetric light shaft glow overlay
      const shaftGrad = ctx.createRadialGradient(
        prowX,
        prowY,
        10,
        prowX,
        prowY,
        beamRange * 0.9
      );
      shaftGrad.addColorStop(
        0,
        this.isHighBeam
          ? 'rgba(240, 249, 255, 0.22)'
          : 'rgba(224, 242, 254, 0.14)'
      );
      shaftGrad.addColorStop(0.8, 'rgba(186, 230, 253, 0.04)');
      shaftGrad.addColorStop(1, 'rgba(186, 230, 253, 0.0)');

      ctx.fillStyle = shaftGrad;
      ctx.beginPath();
      ctx.moveTo(prowX, prowY);
      ctx.arc(prowX, prowY, beamRange * 0.9, beamAngle - halfAngle, beamAngle + halfAngle);
      ctx.closePath();
      ctx.fill();

      // 4. Floating atmospheric particulate motes illuminated in the shaft
      ctx.fillStyle = this.isHighBeam
        ? 'rgba(255, 255, 255, 0.55)'
        : 'rgba(224, 242, 254, 0.35)';
      for (const mote of this.dustMotes) {
        const dx = mote.x - prowX;
        const dy = mote.y - prowY;
        const dist = Math.hypot(dx, dy);
        if (dist <= beamRange) {
          const angle = Math.atan2(dy, dx);
          let diff = Math.abs(angle - beamAngle);
          while (diff > Math.PI) diff -= Math.PI * 2;
          if (Math.abs(diff) <= halfAngle) {
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 5. Active Sonar Ping acoustic wave rings
    for (const wave of this.activeSonarWaves) {
      ctx.strokeStyle = `rgba(34, 197, 94, ${wave.alpha * 0.85})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary faint acoustic ripple
      ctx.strokeStyle = `rgba(16, 185, 129, ${wave.alpha * 0.35})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, Math.max(0, wave.radius - 24), 0, Math.PI * 2);
      ctx.stroke();
    }

    // 6. Photonic Shock Flashes on stunned enemies
    for (const flash of this.shockFlashes) {
      ctx.strokeStyle = `rgba(254, 240, 138, ${flash.alpha})`;
      ctx.fillStyle = `rgba(254, 240, 138, ${flash.alpha * 0.3})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 7. Render Battery Reserves HUD Indicator
    this.drawBatteryHUD(ctx);

    ctx.restore();
  }

  /**
   * Renders the high-tech halogen battery status gauge and phase warnings.
   */
  private drawBatteryHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = 20;
    const y = 50;
    const w = 150;
    const h = 14;

    // Background panel
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.0;
    ctx.fillRect(x - 6, y - 18, w + 12, h + 30);
    ctx.strokeRect(x - 6, y - 18, w + 12, h + 30);

    // Battery bar background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(x, y, w, h);

    // Battery bar fill
    const ratio = Math.max(0, Math.min(1, this.battery / this.maxBattery));
    let barColor = '#38bdf8'; // Cyan normal
    if (this.isHighBeam) barColor = '#f59e0b'; // Amber high-beam
    else if (ratio < 0.25) barColor = '#ef4444'; // Red low battery

    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, w * ratio, h);

    // Text info
    ctx.font = '9px monospace';
    ctx.fillStyle = '#f8fafc';
    const modeText = this.isHighBeam
      ? 'HIGH-BEAM [-10U/s]'
      : this.isLightOn
      ? 'SEARCHLIGHT [-4U/s]'
      : 'DYNAMO [+3U/s]';
    ctx.fillText(`BATTERY: ${Math.round(this.battery)}% [F: LIGHT]`, x, y - 6);
    ctx.fillStyle = this.isLightOn ? '#38bdf8' : '#34d399';
    ctx.fillText(modeText, x, y + h + 10);

    // Phase alert during Twilight or Midnight
    if (this.currentPhase === BiolapsePhase.TWILIGHT) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `WARNING: BIOLAPSE DUSK (${Math.ceil(this.twilightDuration - this.phaseTimer)}s)`,
        200,
        50
      );
    } else if (this.currentPhase === BiolapsePhase.MIDNIGHT) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `TOTAL BIOLAPSE: AMBUSH FRENZY (${Math.ceil(this.midnightDuration - this.phaseTimer)}s)`,
        180,
        50
      );
    }

    ctx.restore();
  }

  public drawForeground(ctx: CanvasRenderingContext2D): void {
    this.renderDarknessOverlay(
      ctx,
      this.cachedPlayerPos,
      this.cachedPlayerVx
    );
  }

  public handleInput(
    key: string,
    isDown: boolean,
    _context: FlagshipUpdateContext
  ): boolean {
    if (isDown) {
      if (key === 'f' || key === 'F') {
        this.toggleLight();
        return true;
      }
      if (key === 'v' || key === 'V') {
        this.setHighBeam(!this.isHighBeam);
        return true;
      }
      if (key === 'q' || key === 'Q') {
        if (!this.sonarPingActive) {
          this.triggerSonarPing();
          return true;
        }
      }
    }
    return false;
  }

  public reset(): void {
    this.currentPhase = BiolapsePhase.DIURNAL;
    this.phaseTimer = 0;
    this.ambientLux = 1.0;
    this.battery = 100;
    this.isLightOn = false;
    this.isHighBeam = false;
    this.sonarPingActive = false;
    this.sonarPingTimer = 0;
    this.activeSonarWaves = [];
    this.shockFlashes = [];
    this.previouslyIlluminatedEnemyIds.clear();
    this.initDustMotes();
  }
}

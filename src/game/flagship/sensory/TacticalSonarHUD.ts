// ============================================================================
// WATER INVADER: FEATURE 12 - TACTICAL SONAR HUD & POLAR RADAR SUITE
// ============================================================================
// Concentric polar range rings, continuous rotating sweep line (omega = 1.8 rad/s),
// contact echo blooms with Doppler telemetry, and acoustic detonation wavefronts.

import {
  SonarRadarState,
  AcousticWavefront,
  SonarContactTarget,
  FlagshipUpdateContext,
} from '../types';
import { Vector2D } from '../../types';

export class TacticalSonarHUD {
  public radarState: SonarRadarState;

  // Tactical radar center (Logical Canvas 600 x 800)
  public origin: Vector2D = { x: 300, y: 460 };

  // Sweep line parameters
  public readonly sweepAngularSpeed: number = 1.8; // rad/s
  public readonly rangeRingsMeters: number[] = [50, 100, 150, 200, 250];
  public readonly ringPixelRadii: number[] = [60, 120, 180, 240, 300];

  // Static Object Pool for Acoustic Wavefronts (FIFO recycling, max 16)
  private readonly MAX_WAVEFRONTS: number = 16;

  // Track sweep intersection with enemies to prevent multi-trigger in same frame
  private lastTriggeredEnemyIds: Set<number> = new Set();
  private lastSweepAngle: number = 0;
  private enemyIdMap: WeakMap<object, number> = new WeakMap();
  private nextEnemyId: number = 1;

  private getEnemyId(enemy: object): number {
    let id = this.enemyIdMap.get(enemy);
    if (id === undefined) {
      id = this.nextEnemyId++;
      this.enemyIdMap.set(enemy, id);
    }
    return id;
  }

  constructor() {
    this.radarState = {
      sweepAngleRad: 0,
      sweepAngularSpeed: this.sweepAngularSpeed,
      rangeRingsMeters: [...this.rangeRingsMeters],
      activeWavefronts: [],
      activeContacts: [],
      glassFractureLines: [],
      screenShakeTrauma: 0,
    };
  }

  /**
   * Spawns an acoustic shockwave pressure wavefront (e.g. on explosion or torpedo blast)
   * Formula: R(t) = R_0 + 280 * t^0.85, alpha(t) = 0.35 * (1 - t/0.65)^2
   */
  public spawnWavefront(
    x: number,
    y: number,
    color: string = '#06b6d4',
    maxRadius: number = 240
  ): void {
    // If pool is full, recycle the oldest
    if (this.radarState.activeWavefronts.length >= this.MAX_WAVEFRONTS) {
      this.radarState.activeWavefronts.shift();
    }

    const wavefront: AcousticWavefront = {
      id: Date.now() + Math.random(),
      x,
      y,
      radius: 8,
      maxRadius,
      speed: 280,
      life: 0.65,
      maxLife: 0.65,
      color,
      lineWidth: 2.5,
    };

    this.radarState.activeWavefronts.push(wavefront);
  }

  /**
   * Updates sweep beam rotation, contact echo bloom decays, and wavefront expansions
   */
  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    // 1. Follow player vessel smoothly
    if (context.player) {
      this.origin.x = 300 + (context.player.position.x - 300) * 0.25;
      this.origin.y = 480 + (context.player.position.y - 480) * 0.2;
    }

    // 2. Rotate sweep line: theta(t) = (theta + omega * dt) % 2PI
    this.lastSweepAngle = this.radarState.sweepAngleRad;
    this.radarState.sweepAngleRad =
      (this.radarState.sweepAngleRad + this.sweepAngularSpeed * deltaTime) % (Math.PI * 2);

    // If sweep wrapped around 0, clear triggered set
    if (this.radarState.sweepAngleRad < this.lastSweepAngle) {
      this.lastTriggeredEnemyIds.clear();
    }

    // 3. Detect sweep intersection with hostiles (Echo Bloom)
    if (context.enemies && context.enemies.length > 0) {
      const sweep = this.radarState.sweepAngleRad;

      for (let i = 0; i < context.enemies.length; i++) {
        const enemy = context.enemies[i];
        if (!enemy || enemy.hp <= 0) continue;

        const dx = enemy.position.x + enemy.size.width / 2 - this.origin.x;
        const dy = enemy.position.y + enemy.size.height / 2 - this.origin.y;
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;

        const distPx = Math.sqrt(dx * dx + dy * dy);
        const rangeMeters = Math.round((distPx / 300) * 250);
        let bearingDeg = Math.round((angle * 180) / Math.PI) + 90;
        if (bearingDeg >= 360) bearingDeg -= 360;

        // Check if current sweep beam passed this angle
        const enemyId = this.getEnemyId(enemy);
        const angularDiff = Math.abs(sweep - angle);
        if (
          (angularDiff < 0.12 || angularDiff > Math.PI * 2 - 0.12) &&
          !this.lastTriggeredEnemyIds.has(enemyId)
        ) {
          this.lastTriggeredEnemyIds.add(enemyId);

          // Update or create contact target
          let contact = this.radarState.activeContacts.find((c) => c.id === enemyId);
          if (!contact) {
            contact = {
              id: enemyId,
              bearingDeg,
              rangeMeters,
              classification: this.classifyEnemy(enemy.type),
              radialVelocity: enemy.velocity.y,
              bloomTimer: 0.4,
            };
            this.radarState.activeContacts.push(contact);
          } else {
            contact.bearingDeg = bearingDeg;
            contact.rangeMeters = rangeMeters;
            contact.bloomTimer = 0.4;
          }
        }
      }
    }

    // 4. Update contact bloom timers
    for (let i = this.radarState.activeContacts.length - 1; i >= 0; i--) {
      const contact = this.radarState.activeContacts[i];
      contact.bloomTimer -= deltaTime;
      if (contact.bloomTimer <= 0) {
        this.radarState.activeContacts.splice(i, 1);
      }
    }

    // 5. Update Acoustic Wavefront physics: R(t) = R_0 + 280 * t^0.85
    for (let i = this.radarState.activeWavefronts.length - 1; i >= 0; i--) {
      const w = this.radarState.activeWavefronts[i];
      w.life -= deltaTime;
      const elapsed = w.maxLife - w.life;

      // Expansion law R(t) = 8 + 280 * (elapsed)^0.85
      w.radius = Math.min(w.maxRadius, 8 + 280 * Math.pow(Math.max(0, elapsed), 0.85));

      if (w.life <= 0 || w.radius >= w.maxRadius) {
        this.radarState.activeWavefronts.splice(i, 1);
      }
    }
  }

  private classifyEnemy(type: number): string {
    switch (type) {
      case 0:
        return 'INVADER_DRONE';
      case 1:
        return 'ZIGZAG_CORVETTE';
      case 2:
        return 'ABYSSAL_CRUISER';
      case 3:
        return 'SNIPER_SENTINEL';
      case 4:
        return 'DIVER_TORPEDO';
      case 5:
        return 'SHIELDED_BULWARK';
      case 14:
        return 'HADAL_CLINGER';
      case 15:
        return 'SPORE_SIPHONER';
      case 16:
        return 'CARAPACE_COLOSSUS';
      case 17:
        return 'ABYSSAL_ANGLER';
      case 18:
        return 'AUTOMATON_AEGIS';
      case 19:
        return 'AUTOMATON_EMP';
      case 20:
        return 'RAIL_SENTINEL';
      case 21:
        return 'KRAKEN_PRIME';
      default:
        return 'UNKNOWN_CONTACT';
    }
  }

  // ==========================================================================
  // CANVAS RENDERING METHODS
  // ==========================================================================

  /**
   * Renders the complete Polar Sonar Grid, sweep line, and active contact blooms
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    ctx.save();
    const cx = this.origin.x;
    const cy = this.origin.y;

    // 1. Concentric Polar Range Rings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    for (let i = 0; i < this.ringPixelRadii.length; i++) {
      const r = this.ringPixelRadii[i];
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Range labels
      ctx.font = '7px monospace';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillText(`${this.rangeRingsMeters[i]}m`, cx + r - 16, cy - 3);
    }
    ctx.setLineDash([]); // Reset dash

    // 2. Cardinal Radial Spokes (Every 30 degrees)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const maxR = this.ringPixelRadii[this.ringPixelRadii.length - 1];

    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const x2 = cx + Math.cos(rad) * maxR;
      const y2 = cy + Math.sin(rad) * maxR;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Degree labels at perimeter
      if (deg % 90 === 0) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        const label =
          deg === 0 ? '090° E' : deg === 90 ? '180° S' : deg === 180 ? '270° W' : '000° N';
        const lx = cx + Math.cos(rad) * (maxR + 14);
        const ly = cy + Math.sin(rad) * (maxR + 14);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx, ly);
      }
    }

    // 3. Phosphor Persistence Sweep Sector Trail (Trailing 0.50 rad)
    const sweep = this.radarState.sweepAngleRad;
    const trailAngle = 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxR, sweep - trailAngle, sweep, false);
    ctx.closePath();

    const sweepGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxR);
    sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
    sweepGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.12)');
    sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.01)');
    ctx.fillStyle = sweepGrad;
    ctx.fill();
    ctx.restore();

    // 4. Leading Bright Sonar Sweep Vector
    const sx2 = cx + Math.cos(sweep) * maxR;
    const sy2 = cy + Math.sin(sweep) * maxR;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();

    // 5. Contact Echo Blooms with Telemetry Tags
    for (const contact of this.radarState.activeContacts) {
      const bloomProgress = contact.bloomTimer / 0.4;
      // Exponential decay: alpha = 0.85 * e^(-t/0.40)
      const alpha = 0.85 * Math.exp(-(1.0 - bloomProgress) * 2.5);

      // Contact coordinates
      const rad = ((contact.bearingDeg - 90) * Math.PI) / 180;
      const distPx = (contact.rangeMeters / 250) * 300;
      const ex = cx + Math.cos(rad) * distPx;
      const ey = cy + Math.sin(rad) * distPx;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      // Echo bloom ring
      ctx.strokeStyle = '#22d3ee';
      ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
      ctx.lineWidth = 1.5;
      const bloomR = 6 + 12 * (1.0 - bloomProgress);

      ctx.beginPath();
      ctx.arc(ex, ey, bloomR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crosshair
      ctx.beginPath();
      ctx.moveTo(ex - 8, ey);
      ctx.lineTo(ex + 8, ey);
      ctx.moveTo(ex, ey - 8);
      ctx.lineTo(ex, ey + 8);
      ctx.stroke();

      // Telemetry badge
      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#67e8f9';
      ctx.textAlign = 'left';
      ctx.fillText(
        `BRG ${contact.bearingDeg.toString().padStart(3, '0')}° // RNG ${contact.rangeMeters}m`,
        ex + 12,
        ey - 4
      );
      ctx.fillStyle = '#a5f3fc';
      ctx.fillText(contact.classification, ex + 12, ey + 6);

      ctx.restore();
    }

    // 6. Acoustic Detonation Shockwave Wavefronts
    for (const w of this.radarState.activeWavefronts) {
      const progress = 1.0 - w.life / w.maxLife;
      // alpha(t) = 0.35 * (1 - t/0.65)^2
      const alpha = 0.35 * Math.pow(Math.max(0, 1.0 - progress), 2);
      // lineWidth(t) = W_0 * (1 + 0.5 * t/0.65)
      const lineWidth = w.lineWidth * (1.0 + 0.5 * progress);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.strokeStyle = w.color;
      ctx.lineWidth = lineWidth;

      // Outer primary wavefront
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary cavitation pressure ridge (slightly trailing)
      if (w.radius > 20) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius * 0.88, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  public reset(): void {
    this.radarState.sweepAngleRad = 0;
    this.radarState.activeWavefronts = [];
    this.radarState.activeContacts = [];
    this.lastTriggeredEnemyIds.clear();
  }
}

// ============================================================================
// WATER INVADER: FEATURE 2 - BIOLUMINESCENT LASER & REFRACTION PRISMS
// ============================================================================

import { Entity } from '../../Entity';
import { Vector2D } from '../../types';
import { soundManager } from '../../SoundManager';
import {
  IPrismLaserSystem,
  LaserHeatZone,
  RefractionPrism,
  FlagshipUpdateContext,
} from '../types';
import { QuartzRefractionPrism } from './RefractionPrism';

interface LaserBeamSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  power: number;
  color: string;
  width: number;
}

interface SteamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
}

/**
 * Concrete Aegis-Photic Lance & Hydrothermal Refraction Laser Subsystem.
 * Features 20 ticks/s instant hitscan raycasting, thermodynamic heat engine with
 * Supercharged sweet-spot (80-99 HU, +25% DPS), thermal lockout, and multi-angle
 * prism and barricade fan refraction.
 */
export class BioluminescentLaserSystem implements IPrismLaserSystem {
  public readonly id = 'prism-laser';

  // Thermodynamic State
  public heat: number = 0;
  public maxHeat: number = 100;
  public isFiring: boolean = false;
  public isLockedOut: boolean = false;
  public lockoutTimer: number = 0;
  public readonly lockoutDuration: number = 2.2; // seconds

  // Upgrade & Damage Stats
  public upgradeLevel: number = 1;
  public baseDps: number = 16.0; // scales up to 48.0 at Lv 5

  // Prism deployment & charges
  public activePrisms: RefractionPrism[] = [];
  public prismCharges: number = 3;
  public maxPrismCharges: number = 3;
  public prismRechargeTimer: number = 0;
  public prismCooldown: number = 12.0; // 12s per charge

  // Raycast execution clock (20 ticks/sec = 50ms interval)
  private tickInterval: number = 0.05;
  private tickTimer: number = 0;

  // Environmental cooling flag (set by hydrothermal vent halo)
  public inCoolingHalo: boolean = false;

  // Rendering & Particle Buffers
  private activeBeamSegments: LaserBeamSegment[] = [];
  private steamParticles: SteamParticle[] = [];
  private pulsePhase: number = 0;

  constructor(upgradeLevel: number = 1) {
    this.upgradeLevel = upgradeLevel;
  }

  /**
   * Determine current thermodynamic heat zone.
   */
  public getHeatZone(): LaserHeatZone {
    if (this.isLockedOut) return LaserHeatZone.LOCKOUT;
    if (this.heat >= 80) return LaserHeatZone.SUPERCHARGED;
    if (this.heat >= 50) return LaserHeatZone.WARM;
    return LaserHeatZone.COOL;
  }

  /**
   * Set laser firing state.
   */
  public setFiring(firing: boolean): void {
    if (this.isLockedOut) {
      this.isFiring = false;
      return;
    }
    this.isFiring = firing;
  }

  /**
   * Deploy floating quartz refraction prism above player craft.
   */
  public deployPrism(x: number, y: number = 360): boolean {
    if (this.activePrisms.length >= 3 || this.prismCharges <= 0) {
      return false;
    }
    this.prismCharges--;
    const isPentagonal = this.upgradeLevel >= 5;
    const prism = new QuartzRefractionPrism(x, y, isPentagonal);
    this.activePrisms.push(prism);
    return true;
  }

  /**
   * Master update hook: thermodynamic decay, raycasting, and hit detection.
   */
  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    this.pulsePhase += deltaTime * 12;
    this.activeBeamSegments = [];

    // 1. Prism recharge timer
    if (this.prismCharges < this.maxPrismCharges) {
      this.prismRechargeTimer += deltaTime;
      if (this.prismRechargeTimer >= this.prismCooldown) {
        this.prismRechargeTimer = 0;
        this.prismCharges = Math.min(this.maxPrismCharges, this.prismCharges + 1);
      }
    }

    // 2. Update existing prisms
    for (let i = this.activePrisms.length - 1; i >= 0; i--) {
      const prism = this.activePrisms[i];
      if (prism instanceof QuartzRefractionPrism) {
        prism.update(deltaTime);
      }
      if (!prism.active) {
        this.activePrisms.splice(i, 1);
      }
    }

    // 3. Update steam venting particles
    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const p = this.steamParticles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.radius *= Math.max(0.01, 1 - 0.4 * deltaTime);
      p.alpha -= p.decay * deltaTime;
      if (p.alpha <= 0 || p.radius <= 0.5) {
        this.steamParticles.splice(i, 1);
      }
    }

    // 4. Thermodynamic Heat Engine
    if (this.isLockedOut) {
      this.lockoutTimer -= deltaTime;
      // Emit emergency steam venting plume
      if (this.steamParticles.length < 35) {
        this.steamParticles.push({
          x: context.player.position.x + context.player.size.width / 2 + (Math.random() - 0.5) * 16,
          y: context.player.position.y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 120,
          vy: -60 - Math.random() * 80,
          radius: 3 + Math.random() * 4,
          alpha: 0.85,
          decay: 1.5,
        });
      }

      if (this.lockoutTimer <= 0) {
        this.isLockedOut = false;
        this.heat = 0;
      }
      return;
    }

    if (this.isFiring) {
      // Differential heating: dH/dt = +30.0 - K_cool (K_cool = 14 if vent halo, else 4.0)
      const kCool = this.inCoolingHalo ? 14.0 : 4.0;
      this.heat = Math.min(this.maxHeat, this.heat + (30.0 - kCool) * deltaTime);

      // Check thermal lockout threshold (100 HU)
      if (this.heat >= this.maxHeat) {
        this.isLockedOut = true;
        this.isFiring = false;
        this.lockoutTimer = this.lockoutDuration;
        try {
          soundManager.playShieldBreak();
        } catch {
          // Safe fallback
        }
        return;
      }
    } else {
      // Passive cooling: -25.0 * mu_env (mu_env = 3.5 in vent halo, else 1.0)
      const coolingRate = this.inCoolingHalo ? 87.5 : 25.0;
      this.heat = Math.max(0, this.heat - coolingRate * deltaTime);
    }

    // 5. 20 Ticks/sec Hitscan Damage Raycast
    if (this.isFiring) {
      this.tickTimer += deltaTime;
      const isDamageTick = this.tickTimer >= this.tickInterval;
      if (isDamageTick) {
        this.tickTimer = 0;
      }

      this.executeLaserRaycast(context, isDamageTick);
    } else {
      this.tickTimer = 0;
    }
  }

  /**
   * Raycast geometry computation: tests primary beam against prisms, barricades, and hostiles.
   */
  private executeLaserRaycast(context: FlagshipUpdateContext, isDamageTick: boolean): void {
    const originX = context.player.position.x + context.player.size.width / 2;
    const originY = context.player.position.y - 4;

    // Base damage per tick: 0.8 (Lv 1) to 2.4 (Lv 5)
    let tickDamage = 0.8 + (this.upgradeLevel - 1) * 0.4;
    const heatZone = this.getHeatZone();

    // Supercharged Sweet Spot (+25% bonus DPS)
    if (heatZone === LaserHeatZone.SUPERCHARGED) {
      tickDamage *= 1.25;
    }

    // Check if beam intersects a deployed prism first
    let hitPrism: RefractionPrism | null = null;
    let hitPrismY = 0;

    for (const prism of this.activePrisms) {
      if (!prism.active) continue;
      const px = prism.position.x;
      const py = prism.position.y;
      const pw = prism.size.x;
      const ph = prism.size.y;

      // Vertical beam intersects prism bounding box horizontally
      if (originX >= px - 4 && originX <= px + pw + 4 && originY > py) {
        if (!hitPrism || py > hitPrismY) {
          hitPrism = prism;
          hitPrismY = py + ph / 2;
        }
      }
    }

    // Check if beam intersects a barricade before prism
    let hitBarricadeY = -1;
    for (const b of context.barricades) {
      if (b.isDead) continue;
      if (
        originX >= b.position.x &&
        originX <= b.position.x + b.size.width &&
        originY > b.position.y + b.size.height
      ) {
        const by = b.position.y + b.size.height;
        if (by > hitBarricadeY && (!hitPrism || by > hitPrismY)) {
          hitBarricadeY = by;
        }
      }
    }

    if (hitPrism) {
      // ----------------------------------------------------------------------
      // CASE A: PRIMARY BEAM STRIKES QUARTZ PRISM
      // ----------------------------------------------------------------------
      // 1. Primary segment up to prism
      this.addBeamSegment(originX, originY, originX, hitPrismY, 1.0, heatZone);
      if (hitPrism instanceof QuartzRefractionPrism) {
        hitPrism.markRefracting();
      }

      // Damage any enemies directly between player and prism
      if (isDamageTick) {
        this.damageEnemiesAlongSegment(
          originX,
          originY,
          originX,
          hitPrismY,
          tickDamage,
          context.enemies
        );
      }

      // 2. Refract into fan array from prism apex
      const prismCx = hitPrism.position.x + hitPrism.size.x / 2;
      const prismCy = hitPrism.position.y;

      for (let i = 0; i < hitPrism.splitAngles.length; i++) {
        const deg = hitPrism.splitAngles[i];
        const rad = (deg * Math.PI) / 180;
        const powerRatio = hitPrism.powerRatios[i] ?? 0.6;
        const beamDmg = tickDamage * powerRatio;

        // Cast ray upward at angle
        const rayLength = 800;
        const endX = prismCx + Math.sin(rad) * rayLength;
        const endY = prismCy - Math.cos(rad) * rayLength;

        this.addBeamSegment(prismCx, prismCy, endX, endY, powerRatio, heatZone);

        if (isDamageTick) {
          this.damageEnemiesAlongSegment(
            prismCx,
            prismCy,
            endX,
            endY,
            beamDmg,
            context.enemies
          );
        }
      }
    } else if (hitBarricadeY > 0) {
      // ----------------------------------------------------------------------
      // CASE B: PRIMARY BEAM STRIKES SILICATE BARRICADE
      // Barricades take ZERO damage; silicate voxels fan out twin beams (120% power)
      // ----------------------------------------------------------------------
      this.addBeamSegment(originX, originY, originX, hitBarricadeY, 1.0, heatZone);

      if (isDamageTick) {
        this.damageEnemiesAlongSegment(
          originX,
          originY,
          originX,
          hitBarricadeY,
          tickDamage,
          context.enemies
        );
      }

      // Twin refracted beams at -20 deg and +20 deg (0.60 power each = 120% total)
      const fanAngles = [-20, 20];
      for (const deg of fanAngles) {
        const rad = (deg * Math.PI) / 180;
        const rayLen = 700;
        const endX = originX + Math.sin(rad) * rayLen;
        const endY = hitBarricadeY - Math.cos(rad) * rayLen;

        this.addBeamSegment(originX, hitBarricadeY, endX, endY, 0.6, heatZone);

        if (isDamageTick) {
          this.damageEnemiesAlongSegment(
            originX,
            hitBarricadeY,
            endX,
            endY,
            tickDamage * 0.6,
            context.enemies
          );
        }
      }
    } else {
      // ----------------------------------------------------------------------
      // CASE C: DIRECT UNIMPEDED VERTICAL BEAM
      // ----------------------------------------------------------------------
      this.addBeamSegment(originX, originY, originX, 0, 1.0, heatZone);

      if (isDamageTick) {
        this.damageEnemiesAlongSegment(
          originX,
          originY,
          originX,
          0,
          tickDamage,
          context.enemies
        );
      }
    }
  }

  /**
   * Helper to store beam visual segments for composite multi-pass rendering.
   */
  private addBeamSegment(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    power: number,
    zone: LaserHeatZone
  ): void {
    let color = '#06b6d4'; // Cool cyan
    let width = 6 * power;

    if (zone === LaserHeatZone.WARM) {
      color = '#38bdf8';
      width = 7.5 * power;
    } else if (zone === LaserHeatZone.SUPERCHARGED) {
      color = '#f59e0b'; // Incandescent gold-cyan
      width = 9 * power;
    }

    this.activeBeamSegments.push({
      startX,
      startY,
      endX,
      endY,
      power,
      color,
      width,
    });
  }

  /**
   * Point-to-segment distance collision check for instant hitscan line.
   */
  private damageEnemiesAlongSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    damage: number,
    enemies: Entity[]
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const ex = enemy.position.x + enemy.size.width / 2;
      const ey = enemy.position.y + enemy.size.height / 2;
      const hitRadius = Math.max(enemy.size.width, enemy.size.height) / 2 + 6;

      // Project point onto segment
      const t = Math.max(0, Math.min(1, ((ex - x1) * dx + (ey - y1) * dy) / lenSq));
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;

      const distSq = (ex - projX) ** 2 + (ey - projY) ** 2;
      if (distSq <= hitRadius * hitRadius) {
        if (typeof (enemy as any).takeDamage === 'function') {
          (enemy as any).takeDamage(damage);
        }
      }
    }
  }

  /**
   * Standalone beam renderer satisfying IPrismLaserSystem.
   */
  public drawBeam(ctx: CanvasRenderingContext2D, origin: Vector2D): void {
    if (!this.isFiring && this.activeBeamSegments.length === 0) return;
    this.drawWorld(ctx);
  }

  /**
   * World rendering pass: draws prisms, composited laser beams, and steam motes.
   */
  public drawWorld(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;
    ctx.save();

    // 1. Draw deployed quartz refraction prisms
    for (const prism of this.activePrisms) {
      if (prism instanceof QuartzRefractionPrism) {
        prism.draw(ctx);
      }
    }

    // 2. Draw emergency steam venting particles
    for (const p of this.steamParticles) {
      ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha * 0.75})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Multi-Layered Composited Laser Beams
    const heatZone = this.getHeatZone();

    for (const seg of this.activeBeamSegments) {
      // Pass 1: Outer Wide Photic Bloom
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = seg.width * 2.8;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.stroke();

      // Pass 2: Intense Coherent Plasma Channel
      ctx.lineWidth = seg.width * 1.4;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.stroke();

      // Pass 3: White-Hot Core Ray
      ctx.strokeStyle = heatZone === LaserHeatZone.SUPERCHARGED ? '#fef08a' : '#ffffff';
      ctx.lineWidth = Math.max(2, seg.width * 0.45);
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.stroke();

      // Pass 4: Sine Caustic Shimmer
      const midX = (seg.startX + seg.endX) / 2 + Math.sin(this.pulsePhase) * 3;
      const midY = (seg.startY + seg.endY) / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.quadraticCurveTo(midX, midY, seg.endX, seg.endY);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Foreground HUD pass: Heat Gauge (Cool/Warm/Supercharged/Lockout) & Prism Charges.
   */
  public drawForeground(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;
    ctx.save();

    const hudX = 132;
    const hudY = 746;
    const hudW = 140;
    const hudH = 36;

    // Background container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeRect(hudX, hudY, hudW, hudH);

    // Heat Zone Title
    const zone = this.getHeatZone();
    ctx.font = '9px monospace';
    if (zone === LaserHeatZone.LOCKOUT) {
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`OVERHEAT (${this.lockoutTimer.toFixed(1)}s)`, hudX + 6, hudY + 12);
    } else if (zone === LaserHeatZone.SUPERCHARGED) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('SUPERCHARGED (+25%)', hudX + 6, hudY + 12);
    } else if (zone === LaserHeatZone.WARM) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('WARM BEAM [SPACE]', hudX + 6, hudY + 12);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('LASER HEAT [SPACE]', hudX + 6, hudY + 12);
    }

    // Heat Gauge Bar (0-100 HU)
    const barX = hudX + 6;
    const barY = hudY + 18;
    const barW = 86;
    const barH = 10;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barW, barH);

    const fillRatio = Math.min(1.0, this.heat / this.maxHeat);
    let barColor = '#06b6d4';
    if (this.heat >= 80) barColor = '#f59e0b';
    else if (this.heat >= 50) barColor = '#38bdf8';
    if (this.isLockedOut) barColor = '#ef4444';

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barW * fillRatio, barH);

    // Sweet Spot Marker (80-99 HU)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + barW * 0.8, barY - 1, barW * 0.19, barH + 2);

    // Prism charges indicator
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PRISM', hudX + 98, hudY + 12);
    for (let i = 0; i < this.maxPrismCharges; i++) {
      const pipX = hudX + 98 + i * 12;
      const pipY = hudY + 18;
      if (i < this.prismCharges) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(pipX, pipY, 8, 10);
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.strokeRect(pipX, pipY, 8, 10);
      }
    }

    ctx.restore();
  }

  /**
   * Handle user inputs: Space (firing) and P (deploy prism).
   */
  public handleInput(
    key: string,
    isDown: boolean,
    context: FlagshipUpdateContext
  ): boolean {
    if (key === ' ' || key === 'Space') {
      this.setFiring(isDown);
      return true;
    }

    if (isDown && (key === 'p' || key === 'P')) {
      const deployX = context.player.position.x + context.player.size.width / 2 - 12;
      return this.deployPrism(deployX, 360);
    }

    return false;
  }

  public reset(preserveUpgrades: boolean = false): void {
    this.heat = 0;
    this.isFiring = false;
    this.isLockedOut = false;
    this.lockoutTimer = 0;
    this.activePrisms = [];
    this.prismCharges = this.maxPrismCharges;
    this.prismRechargeTimer = 0;
    this.steamParticles = [];
    if (!preserveUpgrades) {
      this.upgradeLevel = 1;
    }
  }
}

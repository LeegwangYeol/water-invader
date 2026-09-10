// ============================================================================
// WATER INVADER: FEATURE 1 - CAVITATION TORPEDO & PRESSURE IMPLOSION ORDNANCE
// ============================================================================

import { Bullet } from '../../Bullet';
import { Entity } from '../../Entity';
import { Barricade } from '../../Barricade';
import { Vector2D, Faction } from '../../types';
import { soundManager } from '../../SoundManager';
import {
  CavitationTorpedoConfig,
  ICavitationTorpedo,
  ICavitationTorpedoSystem,
  TorpedoState,
  FlagshipUpdateContext,
} from '../types';

export const DEFAULT_TORPEDO_CONFIG: CavitationTorpedoConfig = {
  v0: 180,                  // Launch velocity (px/s)
  aCav: 420,                // Supercavitation axial acceleration (px/s^2)
  vMax: 580,                // Terminal cruise velocity (px/s)
  armDistance: 100,         // Safety arm threshold distance (px)
  vacuumDuration: 0.08,     // 5 frames at 60 FPS
  vacuumRadius: 140,        // Suction well radius (px)
  pullForceConstant: 85000, // G * M (px^3/s^2)
  blastDuration: 0.27,      // Hyperbaric blast duration (s)
  blastRadius: 150,         // Max shockwave radius (px)
  shockVelocity: 750,       // Wavefront speed (px/s)
  baseDamage: 180,          // Base damage (scales with level up to 300)
  pushbackImpulse: 480,     // Impulse velocity (px/s)
  barricadeAcousticRadius: 85, // Sympathetic vibration radius (px)
};

interface TorpedoBubble {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  decay: number;
}

/**
 * Concrete Mark-IV "Aegis-Breaker" Supercavitating Acoustic Torpedo.
 * Implements two-stage implosion physics: Negative Pressure Singularity Suction Well
 * followed by a 750 px/s Hyperbaric Shockwave vaporizing enemy projectiles.
 */
export class CavitationTorpedo extends Bullet implements ICavitationTorpedo {
  public state: TorpedoState = TorpedoState.INERT;
  public distanceTraveled: number = 0;
  public vacuumTimer: number = 0;
  public blastTimer: number = 0;
  public currentRadius: number = 0;
  public readonly config: CavitationTorpedoConfig;

  // Track entities damaged by this specific shockwave blast
  private damagedEntities: Set<Entity> = new Set<Entity>();
  private damagedBarricades: Set<Barricade> = new Set<Barricade>();

  // Particle and visual FX state (procedural Canvas 2D)
  private bubbleTrail: TorpedoBubble[] = [];
  private pulsePhase: number = 0;

  constructor(
    x: number,
    y: number,
    config: Partial<CavitationTorpedoConfig> = {},
    damageOverride?: number
  ) {
    const finalConfig: CavitationTorpedoConfig = {
      ...DEFAULT_TORPEDO_CONFIG,
      ...config,
      baseDamage: damageOverride ?? config.baseDamage ?? DEFAULT_TORPEDO_CONFIG.baseDamage,
    };
    super(x, y, -finalConfig.v0, finalConfig.baseDamage, true, 999);

    this.config = finalConfig;
    this.size = { width: 14, height: 26 };
    this.faction = Faction.PLAYER;
    this.velocity = { x: 0, y: -this.config.v0 };
    this.state = TorpedoState.INERT;
  }

  /**
   * Remote detonation trigger for double-tap activation.
   * Returns true if successfully transitioned to Singularity stage.
   */
  public triggerRemoteDetonation(): boolean {
    if (this.state === TorpedoState.ARMED) {
      this.state = TorpedoState.SINGULARITY;
      this.vacuumTimer = 0;
      this.velocity = { x: 0, y: 0 };
      try {
        soundManager.playSingularityCollapse();
      } catch {
        // Fallback gracefully if audio context suspended
      }
      return true;
    }
    return false;
  }

  /**
   * Deterministic physics and hydrodynamic update.
   */
  public override update(
    deltaTime: number,
    hostiles: Entity[] = [],
    hostileBullets: Bullet[] = []
  ): void {
    this.pulsePhase += deltaTime * 8;

    // Update trail bubbles
    for (let i = this.bubbleTrail.length - 1; i >= 0; i--) {
      const b = this.bubbleTrail[i];
      b.y += 45 * deltaTime;
      b.radius *= Math.max(0.01, 1 - 0.9 * deltaTime);
      b.alpha -= b.decay * deltaTime;
      if (b.alpha <= 0 || b.radius <= 0.5) {
        this.bubbleTrail.splice(i, 1);
      }
    }

    switch (this.state) {
      case TorpedoState.INERT:
      case TorpedoState.ARMED:
        this.updateCruise(deltaTime, hostiles);
        break;
      case TorpedoState.SINGULARITY:
        this.updateSingularity(deltaTime, hostiles, hostileBullets);
        break;
      case TorpedoState.SHOCKWAVE:
        this.updateShockwave(deltaTime, hostiles, hostileBullets);
        break;
      case TorpedoState.EXPIRED:
        this.isDead = true;
        break;
    }
  }

  /**
   * Phase 0: Cruising with supercavitating acceleration.
   */
  private updateCruise(deltaTime: number, hostiles: Entity[]): void {
    // Constant supercavitation acceleration: v(t) = min(vMax, v0 + aCav * t)
    const currentSpeed = Math.min(
      this.config.vMax,
      Math.abs(this.velocity.y) + this.config.aCav * deltaTime
    );
    this.velocity.y = -currentSpeed;

    const dy = Math.abs(this.velocity.y) * deltaTime;
    this.prevPosition = { x: this.position.x, y: this.position.y };
    this.position.y += this.velocity.y * deltaTime;
    this.position.x += this.velocity.x * deltaTime;
    this.distanceTraveled += dy;

    // Transition from INERT to ARMED once safety threshold reached
    if (this.state === TorpedoState.INERT && this.distanceTraveled >= this.config.armDistance) {
      this.state = TorpedoState.ARMED;
    }

    // Spawn hydrodynamic vapor bubbles
    if (this.bubbleTrail.length < 24) {
      this.bubbleTrail.push({
        x: this.position.x + this.size.width / 2 + (Math.random() - 0.5) * 6,
        y: this.position.y + this.size.height + Math.random() * 4,
        radius: 2 + Math.random() * 3,
        alpha: 0.8,
        decay: 1.8,
      });
    }

    // Auto-detonate upon reaching screen ceiling
    if (this.position.y <= 40) {
      if (this.state === TorpedoState.ARMED) {
        this.triggerRemoteDetonation();
      } else {
        this.state = TorpedoState.EXPIRED;
        this.isDead = true;
      }
      return;
    }

    // Check collision with hostiles
    const centerX = this.position.x + this.size.width / 2;
    const centerY = this.position.y + this.size.height / 2;
    const hitRadius = Math.max(this.size.width, this.size.height) / 2;

    for (const hostile of hostiles) {
      if (hostile.isDead) continue;
      const hx = hostile.position.x + hostile.size.width / 2;
      const hy = hostile.position.y + hostile.size.height / 2;
      const distSq = (centerX - hx) ** 2 + (centerY - hy) ** 2;
      const combinedRadius = hitRadius + Math.min(hostile.size.width, hostile.size.height) / 2;

      if (distSq <= combinedRadius * combinedRadius) {
        if (this.state === TorpedoState.INERT) {
          // Inert blunt collision deals 15 damage without detonating
          if (typeof (hostile as any).takeDamage === 'function') {
            (hostile as any).takeDamage(15);
          }
          this.position.y += 8; // slight deflection recoil
        } else if (this.state === TorpedoState.ARMED) {
          // Armed impact triggers immediate singularity implosion
          this.triggerRemoteDetonation();
          break;
        }
      }
    }
  }

  /**
   * Phase 1: Vacuum Singularity (Negative Pressure Well).
   * Pulls all hostiles, debris, and enemy projectiles inward.
   */
  private updateSingularity(
    deltaTime: number,
    hostiles: Entity[],
    hostileBullets: Bullet[]
  ): void {
    this.vacuumTimer += deltaTime;
    this.velocity = { x: 0, y: 0 };

    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    const rPull = this.config.vacuumRadius;
    const rPullSq = rPull * rPull;
    const GM = this.config.pullForceConstant;
    const epsilonSq = 25 * 25;

    // Inward gravitational pull on hostiles
    for (const hostile of hostiles) {
      if (hostile.isDead) continue;
      const hx = hostile.position.x + hostile.size.width / 2;
      const hy = hostile.position.y + hostile.size.height / 2;
      const dx = cx - hx;
      const dy = cy - hy;
      const distSq = dx * dx + dy * dy;

      if (distSq <= rPullSq && distSq > 4) {
        const dist = Math.sqrt(distSq);
        const force = GM / Math.max(distSq, epsilonSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // Scale by entity mass if available
        let mass = 1.0;
        if ((hostile as any).isBoss) mass = 8.0;
        else if ((hostile as any).isElite) mass = 2.2;

        const pullStep = (force / mass) * deltaTime;
        hostile.position.x += nx * pullStep;
        hostile.position.y += ny * pullStep;

        const maxLimitX = Math.max(0, 600 - (hostile.size?.width ?? 0));
        const maxLimitY = Math.max(0, 800 - (hostile.size?.height ?? 0));
        hostile.position.x = Math.max(0, Math.min(maxLimitX, hostile.position.x));
        hostile.position.y = Math.max(0, Math.min(maxLimitY, hostile.position.y));
      }
    }

    // Inward pull on hostile bullets
    for (const b of hostileBullets) {
      if (b.isDead || b.faction === Faction.PLAYER) continue;
      const bx = b.position.x + b.size.width / 2;
      const by = b.position.y + b.size.height / 2;
      const dx = cx - bx;
      const dy = cy - by;
      const distSq = dx * dx + dy * dy;

      if (distSq <= rPullSq && distSq > 4) {
        const dist = Math.sqrt(distSq);
        const force = (GM * 1.5) / Math.max(distSq, epsilonSq);
        const pullStep = force * deltaTime;
        b.position.x += (dx / dist) * pullStep;
        b.position.y += (dy / dist) * pullStep;
      }
    }

    // Transition to hyperbaric shockwave after vacuum duration
    if (this.vacuumTimer >= this.config.vacuumDuration) {
      this.state = TorpedoState.SHOCKWAVE;
      this.blastTimer = 0;
      this.currentRadius = 0;
      try {
        soundManager.playExplosion();
      } catch {
        // Fallback audio
      }
    }
  }

  /**
   * Phase 2: Hyperbaric Acoustic Blast Overpressure.
   * Expanding shockwave front: r(t) = v_shock * t (750 px/s).
   * Quadratic damage decay, impulse knockback, and bullet vaporization.
   */
  private updateShockwave(
    deltaTime: number,
    hostiles: Entity[],
    hostileBullets: Bullet[]
  ): void {
    this.blastTimer += deltaTime;
    this.currentRadius = Math.min(
      this.config.blastRadius,
      this.config.shockVelocity * this.blastTimer
    );

    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    const curRadSq = this.currentRadius * this.currentRadius;

    // 1. Hydro-Acoustic Bullet Vaporization: instant erasure of hostile projectiles
    for (const b of hostileBullets) {
      if (b.isDead || b.faction === Faction.PLAYER) continue;
      const bx = b.position.x + b.size.width / 2;
      const by = b.position.y + b.size.height / 2;
      const distSq = (cx - bx) ** 2 + (cy - by) ** 2;

      if (distSq <= curRadSq) {
        b.isDead = true;
      }
    }

    // 2. Quadratic Radial Damage & Pushback Impulse to Hostiles
    for (const hostile of hostiles) {
      if (hostile.isDead || this.damagedEntities.has(hostile)) continue;
      const hx = hostile.position.x + hostile.size.width / 2;
      const hy = hostile.position.y + hostile.size.height / 2;
      const dx = hx - cx;
      const dy = hy - cy;
      const distSq = dx * dx + dy * dy;

      if (distSq <= curRadSq) {
        this.damagedEntities.add(hostile);
        const dist = Math.sqrt(distSq);

        // Quadratic radial decay formula: D(r) = D_core * (1 - (r / R_blast)^2)^1.25
        const normR = Math.min(1.0, dist / this.config.blastRadius);
        const decay = Math.pow(Math.max(0, 1.0 - normR * normR), 1.25);
        const appliedDamage = Math.max(15, Math.round(this.config.baseDamage * decay));

        if (typeof (hostile as any).takeDamage === 'function') {
          (hostile as any).takeDamage(appliedDamage);
        }

        // Radial pushback impulse: v_impulse = (I_0 / mass) * r_hat
        let mass = 1.0;
        if ((hostile as any).isBoss) mass = 8.0;
        else if ((hostile as any).isElite) mass = 2.2;

        const impulseSpeed = (this.config.pushbackImpulse / mass);
        const nx = dist > 0.001 ? dx / dist : 0;
        const ny = dist > 0.001 ? dy / dist : -1;
        hostile.position.x += nx * impulseSpeed * 0.12;
        hostile.position.y += ny * impulseSpeed * 0.12;

        // Clamp enemy positions strictly within [0, 600] x [0, 800]
        const maxLimitX = Math.max(0, 600 - (hostile.size?.width ?? 0));
        const maxLimitY = Math.max(0, 800 - (hostile.size?.height ?? 0));
        hostile.position.x = Math.max(0, Math.min(maxLimitX, hostile.position.x));
        hostile.position.y = Math.max(0, Math.min(maxLimitY, hostile.position.y));
      }
    }

    // Expiry check
    if (this.blastTimer >= this.config.blastDuration) {
      this.state = TorpedoState.EXPIRED;
      this.isDead = true;
    }
  }

  /**
   * Apply sympathetic acoustic vibration damage to adjacent barricades.
   */
  public checkBarricadeFractures(barricades: Barricade[]): void {
    if (this.state !== TorpedoState.SHOCKWAVE) return;
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    const rFracture = this.config.barricadeAcousticRadius;
    const rFractureSq = rFracture * rFracture;

    for (const b of barricades) {
      if (b.isDead || this.damagedBarricades.has(b)) continue;
      const bx = b.position.x + b.size.width / 2;
      const by = b.position.y + b.size.height / 2;
      const distSq = (cx - bx) ** 2 + (cy - by) ** 2;

      if (distSq <= rFractureSq) {
        this.damagedBarricades.add(b);
        b.takeDamage(15);
      }
    }
  }

  /**
   * Procedural Canvas 2D Vector Rendering.
   */
  public override draw(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;
    ctx.save();

    // 1. Draw vapor bubble trail
    for (const b of this.bubbleTrail) {
      ctx.fillStyle = `rgba(56, 189, 248, ${b.alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(0.5, b.radius), 0, Math.PI * 2);
      ctx.fill();
    }

    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;

    if (this.state === TorpedoState.INERT || this.state === TorpedoState.ARMED) {
      // ----------------------------------------------------------------------
      // CRUISING TORPEDO RENDERING
      // ----------------------------------------------------------------------
      // Gaseous Supercavitation Envelope
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.20)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, 12, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Torpedo Metallic Body
      ctx.fillStyle = '#0f172a'; // Deep slate core
      ctx.strokeStyle = '#38bdf8'; // Electric cyan border
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(cx, this.position.y); // Nose apex
      ctx.lineTo(this.position.x + this.size.width, this.position.y + 8);
      ctx.lineTo(this.position.x + this.size.width - 2, this.position.y + this.size.height);
      ctx.lineTo(this.position.x + 2, this.position.y + this.size.height);
      ctx.lineTo(this.position.x, this.position.y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tungsten Nose Cavitator Ring
      ctx.fillStyle = '#f59e0b'; // Amber-gold tungsten ring
      ctx.beginPath();
      ctx.arc(cx, this.position.y + 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Status Beacon
      if (this.state === TorpedoState.ARMED) {
        // Armed strobe: flashing crimson/cyan
        const strobe = Math.sin(this.pulsePhase) > 0 ? '#ef4444' : '#00e5ff';
        ctx.fillStyle = strobe;
        ctx.shadowColor = strobe;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Inert indicator (pale yellow)
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.state === TorpedoState.SINGULARITY) {
      // ----------------------------------------------------------------------
      // PHASE 1: VACUUM SINGULARITY RENDERING
      // ----------------------------------------------------------------------
      const progress = Math.min(1.0, this.vacuumTimer / this.config.vacuumDuration);
      const coreR = Math.max(4, 24 * (1.0 - progress * 0.6));

      // Suction well outer distorted field
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, this.config.vacuumRadius * (1.0 - progress * 0.2), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Gravitational lensing lines
      const rayCount = 8;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 2 * i) / rayCount + this.pulsePhase;
        const outerD = this.config.vacuumRadius * 0.85;
        const innerD = coreR + 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * outerD, cy + Math.sin(angle) * outerD);
        ctx.lineTo(cx + Math.cos(angle) * innerD, cy + Math.sin(angle) * innerD);
        ctx.stroke();
      }

      // Pure Black Vacuum Sphere with Electric Cyan Corona
      const coronaGrad = ctx.createRadialGradient(cx, cy, coreR * 0.7, cx, cy, coreR + 10);
      coronaGrad.addColorStop(0, '#000000');
      coronaGrad.addColorStop(0.6, '#06b6d4');
      coronaGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR + 10, 0, Math.PI * 2);
      ctx.fill();

      // Deep Black Singularity Core
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.state === TorpedoState.SHOCKWAVE) {
      // ----------------------------------------------------------------------
      // PHASE 2: HYPERBARIC ACOUSTIC SHOCKWAVE RENDERING
      // ----------------------------------------------------------------------
      const r = this.currentRadius;
      const blastProgress = Math.min(1.0, this.blastTimer / this.config.blastDuration);
      const alpha = Math.max(0, 1.0 - blastProgress);

      // Expanding Shockwave Front Ring (Double concentric rings)
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.75})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, r - 6), 0, Math.PI * 2);
      ctx.stroke();

      // High-pressure hydro-acoustic disc bloom
      const blastGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      blastGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
      blastGrad.addColorStop(0.3, `rgba(56, 189, 248, ${alpha * 0.5})`);
      blastGrad.addColorStop(0.85, `rgba(6, 182, 212, ${alpha * 0.25})`);
      blastGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = blastGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Cavitation Torpedo System Coordinator Subsystem.
 * Manages torpedo ammo reserves, recharge intervals, remote detonation input,
 * and integration into the Master Flagship Coordinator.
 */
export class CavitationTorpedoSystem implements ICavitationTorpedoSystem {
  public readonly id = 'cavitation-torpedo';
  public torpedoes: ICavitationTorpedo[] = [];
  public torpedoAmmo: number = 3;
  public maxTorpedoAmmo: number = 3;
  public rechargeTimer: number = 0;
  public rechargeCooldown: number = 4.5; // seconds per torpedo reload
  public upgradeLevel: number = 1;

  public fireTorpedo(origin: Vector2D): boolean {
    if (this.torpedoAmmo <= 0) return false;
    this.torpedoAmmo--;

    // Base damage scales with upgrade level: 120 (Lv 1) to 300 (Lv 5)
    const baseDamage = 120 + (this.upgradeLevel - 1) * 45;
    const torpedo = new CavitationTorpedo(
      origin.x,
      origin.y,
      { baseDamage },
      baseDamage
    );
    this.torpedoes.push(torpedo);

    try {
      soundManager.playMissileLaunch();
    } catch {
      // Safe fallback
    }
    return true;
  }

  public detonateActiveTorpedo(): boolean {
    if (this.torpedoes.length === 0) return false;
    let detonated = false;
    for (const t of this.torpedoes) {
      if (t.state === TorpedoState.ARMED) {
        if (t.triggerRemoteDetonation()) {
          detonated = true;
        }
      }
    }
    return detonated;
  }

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    // Passive ammo recharge
    if (this.torpedoAmmo < this.maxTorpedoAmmo) {
      this.rechargeTimer += deltaTime;
      if (this.rechargeTimer >= this.rechargeCooldown) {
        this.rechargeTimer = 0;
        this.torpedoAmmo = Math.min(this.maxTorpedoAmmo, this.torpedoAmmo + 1);
      }
    }

    // Update active torpedoes
    for (let i = this.torpedoes.length - 1; i >= 0; i--) {
      const t = this.torpedoes[i];
      t.update(deltaTime, context.enemies, context.bullets);

      if (t instanceof CavitationTorpedo) {
        t.checkBarricadeFractures(context.barricades);
        if (t.state === TorpedoState.SHOCKWAVE && t.blastTimer <= deltaTime * 1.5) {
          context.triggerScreenShake(0.25, 8);
        }
      }

      if (t.isDead || t.state === TorpedoState.EXPIRED) {
        this.torpedoes.splice(i, 1);
      }
    }
  }

  public drawWorld(ctx: CanvasRenderingContext2D): void {
    for (const t of this.torpedoes) {
      t.draw(ctx);
    }
  }

  public drawForeground(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;
    // Torpedo Ordnance HUD Pod in bottom HUD area
    ctx.save();
    const hudX = 14;
    const hudY = 746;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(hudX, hudY, 110, 36);
    ctx.strokeRect(hudX, hudY, 110, 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText('TORPEDO POD [C]', hudX + 6, hudY + 12);

    // Ammo pips
    for (let i = 0; i < this.maxTorpedoAmmo; i++) {
      const pipX = hudX + 6 + i * 18;
      const pipY = hudY + 18;
      if (i < this.torpedoAmmo) {
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(pipX, pipY, 12, 10);
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.strokeRect(pipX, pipY, 12, 10);
      }
    }

    // Has active armed torpedo indicator
    const hasArmed = this.torpedoes.some((t) => t.state === TorpedoState.ARMED);
    if (hasArmed) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('DETONATE!', hudX + 60, hudY + 26);
    }

    ctx.restore();
  }

  public handleInput(
    key: string,
    isDown: boolean,
    context: FlagshipUpdateContext
  ): boolean {
    if (!isDown) return false;

    if (key === 'c' || key === 'C' || key === 'x' || key === 'X') {
      // 1. Try to detonate active armed torpedo
      if (this.detonateActiveTorpedo()) {
        return true;
      }
      // 2. If none armed and ammo available, launch a new torpedo
      const origin = {
        x: context.player.position.x + context.player.size.width / 2 - 7,
        y: context.player.position.y - 12,
      };
      if (this.fireTorpedo(origin)) {
        return true;
      }
    }
    return false;
  }

  public reset(preserveUpgrades: boolean = false): void {
    this.torpedoes = [];
    this.torpedoAmmo = this.maxTorpedoAmmo;
    this.rechargeTimer = 0;
    if (!preserveUpgrades) {
      this.upgradeLevel = 1;
    }
  }
}

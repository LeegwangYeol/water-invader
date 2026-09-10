// ============================================================================
// WATER INVADER: BENTHIC HYDROTHERMAL VENTS & MINERAL CHIMNEY SYSTEM
// ============================================================================

import {
  IHydrothermalVent,
  IHydrothermalVentManager,
  IOceanCurrent,
  VentState,
  MineralNodule,
  FlagshipUpdateContext,
} from '../types';
import { Entity } from '../../Entity';
import { Bullet } from '../../Bullet';
import { Enemy } from '../../Enemy';
import { Player } from '../../Player';
import { OceanCurrent } from './OceanCurrent';

export interface VentParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  isBubble: boolean;
  life: number;
  maxLife: number;
}

export class HydrothermalVent implements IHydrothermalVent {
  public readonly id: string;
  public anchorX: number; // e.g. 180 px or 420 px
  public baseY: number = 760; // 760 px
  public capY: number = 100; // 100 px
  public coreTemperature: number = 380; // 380 °C
  public state: VentState = VentState.DORMANT;
  public cycleTimer: number = 0;

  // Cycle durations (total 12.0s: 7.5s dormant -> 1.5s charging -> 3.0s erupting)
  public readonly dormantDuration: number = 7.5;
  public readonly chargingDuration: number = 1.5;
  public readonly eruptingDuration: number = 3.0;

  // Player exposure tracking
  public playerCoreExposureTimer: number = 0;
  private playerBurnIntervalTimer: number = 0;

  // Particle pool for thermal plume column
  private particles: VentParticle[] = [];
  private readonly maxParticles: number = 90;

  // Heat shimmer phase
  private shimmerPhase: number = 0;

  constructor(id: string, anchorX: number, initialCycleOffset: number = 0) {
    this.id = id;
    this.anchorX = anchorX;
    this.cycleTimer = initialCycleOffset;
    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.spawnParticle(Math.random() * (this.baseY - this.capY)));
    }
  }

  private spawnParticle(heightOffset: number = 0): VentParticle {
    const y = this.baseY - heightOffset;
    const coreR = this.getCoreRadius(y);
    const x = this.anchorX + (Math.random() - 0.5) * coreR * 1.6;

    const isErupting = this.state === VentState.ERUPTING;
    const isCharging = this.state === VentState.CHARGING;

    const isBubble = Math.random() > 0.45;
    const speedY = isErupting ? -(400 + Math.random() * 450) : -(120 + Math.random() * 160);

    let color = '#334155';
    if (isBubble) {
      color = isErupting ? '#f8fafc' : '#bae6fd';
    } else if (isCharging) {
      color = Math.random() > 0.5 ? '#f97316' : '#475569';
    } else if (isErupting) {
      color = Math.random() > 0.4 ? '#f59e0b' : '#f8fafc';
    }

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 35,
      vy: speedY,
      radius: isBubble ? 2.5 + Math.random() * 4.5 : 1.5 + Math.random() * 3.0,
      alpha: 0.25 + Math.random() * 0.55,
      color,
      isBubble,
      life: 0,
      maxLife: 2.2 + Math.random() * 1.5,
    };
  }

  /**
   * Evaluates the conical core radius at depth y:
   * R_core(y) = 22 + (760 - y) * 0.08
   */
  public getCoreRadius(y: number): number {
    const clampedY = Math.max(this.capY, Math.min(this.baseY, y));
    return 22 + (this.baseY - clampedY) * 0.08;
  }

  /**
   * Evaluates the outer convective cooling halo radius at depth y:
   * R_halo(y) = R_core(y) * 1.85
   */
  public getHaloRadius(y: number): number {
    return this.getCoreRadius(y) * 1.85;
  }

  /**
   * Checks if an (x, y) coordinate is within the scalding 380°C core plume.
   */
  public isInCore(x: number, y: number): boolean {
    if (y < this.capY || y > this.baseY + 20) return false;
    const coreR = this.getCoreRadius(y);
    return Math.abs(x - this.anchorX) <= coreR;
  }

  /**
   * Checks if an (x, y) coordinate is within the outer convective cooling halo.
   */
  public isInHalo(x: number, y: number): boolean {
    if (y < this.capY || y > this.baseY + 20) return false;
    const haloR = this.getHaloRadius(y);
    return Math.abs(x - this.anchorX) <= haloR;
  }

  /**
   * Evaluates the vertical updraft velocity at depth y:
   * u_vent(y) = -360 * sqrt(y / 800) px/s
   */
  public getUpdraftVelocity(y: number): number {
    const clampedY = Math.max(0, Math.min(800, y));
    const baseUpdraft = -360 * Math.sqrt(clampedY / 800);
    if (this.state === VentState.ERUPTING) {
      return baseUpdraft * 2.5; // Up to -900 px/s during eruption
    }
    return baseUpdraft;
  }

  /**
   * Core simulation update loop.
   */
  public update(
    deltaTime: number,
    player: Entity,
    hostiles: Entity[],
    bullets: Bullet[],
    onErupt?: (vent: HydrothermalVent) => void
  ): void {
    this.shimmerPhase += deltaTime * 3.5;

    // 1. Advance Vent State Machine deterministically with time budget
    let remainingDelta = deltaTime;
    while (remainingDelta > 0) {
      if (this.state === VentState.DORMANT) {
        const needed = this.dormantDuration - this.cycleTimer;
        if (remainingDelta >= needed) {
          this.cycleTimer = 0;
          this.state = VentState.CHARGING;
          remainingDelta -= needed;
        } else {
          this.cycleTimer += remainingDelta;
          remainingDelta = 0;
        }
      } else if (this.state === VentState.CHARGING) {
        const needed = this.chargingDuration - this.cycleTimer;
        if (remainingDelta >= needed) {
          this.cycleTimer = 0;
          this.state = VentState.ERUPTING;
          if (onErupt) {
            onErupt(this);
          }
          remainingDelta -= needed;
        } else {
          this.cycleTimer += remainingDelta;
          remainingDelta = 0;
        }
      } else if (this.state === VentState.ERUPTING) {
        const needed = this.eruptingDuration - this.cycleTimer;
        if (remainingDelta >= needed) {
          this.cycleTimer = 0;
          this.state = VentState.DORMANT;
          remainingDelta -= needed;
        } else {
          this.cycleTimer += remainingDelta;
          remainingDelta = 0;
        }
      } else {
        remainingDelta = 0;
      }
    }

    // 2. Update plume particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      // Expand outward slightly as particle ascends
      const coreR = this.getCoreRadius(p.y);
      if (Math.abs(p.x - this.anchorX) > coreR * 1.4) {
        p.vx *= 0.85;
      }

      if (p.y <= this.capY || p.life >= p.maxLife) {
        this.particles[i] = this.spawnParticle(0);
      }
    }

    // 3. Player Thermal Dynamics & Buoyancy Updraft
    if (player && player.position) {
      const playerCenterX = player.position.x + (player.size?.width ?? 32) / 2;
      const playerCenterY = player.position.y + (player.size?.height ?? 32) / 2;

      const inCore = this.isInCore(playerCenterX, playerCenterY);
      const inHalo = this.isInHalo(playerCenterX, playerCenterY);

      // Convective updraft lifts player vessel slightly (+160 px/s)
      if (inHalo || inCore) {
        const lift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
        player.position.y = Math.max(this.capY + 30, player.position.y - lift);
      }

      // Thermal exposure grace logic (0.5s grace, then 1 HP per 1.25s)
      if (inCore) {
        this.playerCoreExposureTimer += deltaTime;
        if (this.playerCoreExposureTimer > 0.5) {
          this.playerBurnIntervalTimer += deltaTime;
          if (this.playerBurnIntervalTimer >= 1.25) {
            this.playerBurnIntervalTimer = 0;
            const p = player as Player;
            if (typeof p.hp === 'number' && p.hp > 1) {
              p.hp = Math.max(1, p.hp - 1);
            }
          }
        }
      } else {
        this.playerCoreExposureTimer = Math.max(0, this.playerCoreExposureTimer - deltaTime * 2);
        this.playerBurnIntervalTimer = 0;
      }
    }

    // 4. Hostile Entity Heat DoT in Core: DPS = 28 + 0.06 * MaxHP
    for (const enemy of hostiles) {
      if (!enemy || !enemy.position) continue;
      const ex = enemy.position.x + (enemy.size?.width ?? 32) / 2;
      const ey = enemy.position.y + (enemy.size?.height ?? 32) / 2;

      if (this.isInCore(ex, ey)) {
        const maxHp = (enemy as any).maxHp ?? 50;
        const dps = 28 + 0.06 * maxHp;
        const damageThisFrame = dps * deltaTime;

        if (typeof (enemy as any).takeDamage === 'function') {
          (enemy as any).takeDamage(damageThisFrame);
        } else if (typeof (enemy as any).hp === 'number') {
          (enemy as any).hp -= damageThisFrame;
        }

        // Suppress boss shield regeneration while submerged in scalding core
        (enemy as any).shieldRegenSuppressed = true;
      }
    }

    // 5. Projectile Interactions: Steam Lances & Counter-Buoyancy
    for (const bullet of bullets) {
      if (!bullet || !bullet.position || bullet.isDead) continue;
      const inCore = this.isInCore(bullet.position.x, bullet.position.y);

      if (inCore) {
        if (bullet.isPlayerBullet) {
          // Player Bullet -> Superheated Steam Lance Transformation
          if (!(bullet as any).__steamLance) {
            (bullet as any).__steamLance = true;
            bullet.damage = Math.round(bullet.damage * 1.35); // +35% damage
            bullet.piercing = (bullet.piercing || 1) + 1; // +1 pierce
            bullet.velocity.y = Math.min(bullet.velocity.y, -680); // Speed boosted to -680 px/s
          }
        } else {
          // Enemy Bullet -> Counter-buoyancy (ay = -520 px/s^2) and vaporization within 0.35s
          bullet.velocity.y += -520 * deltaTime;
          (bullet as any).__ventDissolveTimer = ((bullet as any).__ventDissolveTimer || 0) + deltaTime;
          if ((bullet as any).__ventDissolveTimer >= 0.35) {
            bullet.isDead = true;
          }
        }
      }
    }
  }

  /**
   * Renders the mineral chimney, billowing sulfide plume, and refractive convection halo.
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    ctx.save();

    // 1. Convective Halo (Heat shimmer and thermal aura)
    const haloTopR = this.getHaloRadius(this.capY);
    const haloBottomR = this.getHaloRadius(this.baseY);

    const haloGrad = ctx.createRadialGradient(
      this.anchorX,
      (this.baseY + this.capY) / 2,
      20,
      this.anchorX,
      (this.baseY + this.capY) / 2,
      haloBottomR
    );
    haloGrad.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
    haloGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.05)');
    haloGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.moveTo(this.anchorX - haloTopR, this.capY);
    ctx.lineTo(this.anchorX + haloTopR, this.capY);
    ctx.lineTo(this.anchorX + haloBottomR, this.baseY);
    ctx.lineTo(this.anchorX - haloBottomR, this.baseY);
    ctx.closePath();
    ctx.fill();

    // 2. Scalding 380°C Core Plume Column (Conical Black Smoker)
    const coreTopR = this.getCoreRadius(this.capY);
    const coreBottomR = this.getCoreRadius(this.baseY);

    const coreGrad = ctx.createLinearGradient(0, this.baseY, 0, this.capY);
    if (this.state === VentState.ERUPTING) {
      coreGrad.addColorStop(0, 'rgba(234, 88, 12, 0.85)'); // Hot magma orange
      coreGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.7)');
      coreGrad.addColorStop(1, 'rgba(248, 250, 252, 0.3)');
    } else if (this.state === VentState.CHARGING) {
      coreGrad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
      coreGrad.addColorStop(0.4, 'rgba(30, 41, 59, 0.65)');
      coreGrad.addColorStop(1, 'rgba(15, 23, 42, 0.25)');
    } else {
      coreGrad.addColorStop(0, 'rgba(30, 41, 59, 0.75)'); // Sulfide black smoker
      coreGrad.addColorStop(0.5, 'rgba(51, 65, 85, 0.5)');
      coreGrad.addColorStop(1, 'rgba(100, 116, 139, 0.15)');
    }

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(this.anchorX - coreTopR, this.capY);
    ctx.lineTo(this.anchorX + coreTopR, this.capY);
    ctx.lineTo(this.anchorX + coreBottomR, this.baseY);
    ctx.lineTo(this.anchorX - coreBottomR, this.baseY);
    ctx.closePath();
    ctx.fill();

    // 3. Render Rising Sulfide Motes & Boiling Micro-bubbles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Bubble specular ring
      if (p.isBubble) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    // 4. Refractive Heat Shimmer Waves (Sinusoidal displacement lines)
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.14)';
    ctx.lineWidth = 1.0;
    const stepY = 32;
    for (let y = this.baseY - 20; y > this.capY; y -= stepY) {
      const r = this.getCoreRadius(y);
      const wave = Math.sin(this.shimmerPhase + y * 0.05) * 6;
      ctx.beginPath();
      ctx.moveTo(this.anchorX - r + wave, y);
      ctx.lineTo(this.anchorX + r + wave, y);
      ctx.stroke();
    }

    // 5. Mineral Chimney Base & Seabed Aperture
    const vibrateOffset =
      this.state === VentState.CHARGING ? (Math.random() - 0.5) * 3 : 0;
    const chimneyX = this.anchorX + vibrateOffset;
    const chimneyW = 44;
    const chimneyH = 40;

    // Chimney rock structure (basalt black smoker cone)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    ctx.moveTo(chimneyX - chimneyW / 2, this.baseY);
    ctx.lineTo(chimneyX - chimneyW * 0.75, this.baseY + chimneyH);
    ctx.lineTo(chimneyX + chimneyW * 0.75, this.baseY + chimneyH);
    ctx.lineTo(chimneyX + chimneyW / 2, this.baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Aperture interior magma glow
    const apertureGrad = ctx.createRadialGradient(
      chimneyX,
      this.baseY + 4,
      2,
      chimneyX,
      this.baseY + 4,
      chimneyW / 2
    );
    if (this.state === VentState.ERUPTING) {
      apertureGrad.addColorStop(0, '#fef08a');
      apertureGrad.addColorStop(0.5, '#ea580c');
      apertureGrad.addColorStop(1, '#7f1d1d');
    } else if (this.state === VentState.CHARGING) {
      apertureGrad.addColorStop(0, '#f97316');
      apertureGrad.addColorStop(0.6, '#991b1b');
      apertureGrad.addColorStop(1, '#1e293b');
    } else {
      apertureGrad.addColorStop(0, '#ea580c');
      apertureGrad.addColorStop(0.7, '#450a0a');
      apertureGrad.addColorStop(1, '#0f172a');
    }

    ctx.fillStyle = apertureGrad;
    ctx.beginPath();
    ctx.ellipse(chimneyX, this.baseY, chimneyW / 2 - 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public reset(): void {
    this.state = VentState.DORMANT;
    this.cycleTimer = 0;
    this.playerCoreExposureTimer = 0;
    this.playerBurnIntervalTimer = 0;
    this.initParticles();
  }
}

export class HydrothermalVentManager implements IHydrothermalVentManager {
  public readonly id: string = 'hydrothermal-vents';
  public vents: IHydrothermalVent[] = [];
  public currentSystem: IOceanCurrent;
  public nodules: MineralNodule[] = [];
  public readonly canvasWidth: number = 600;
  public readonly canvasHeight: number = 800;

  constructor(canvasWidth: number = 600, canvasHeight: number = 800) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.currentSystem = new OceanCurrent(canvasWidth, canvasHeight);

    // Initialize 2 staggered benthic hydrothermal chimneys
    this.vents = [
      new HydrothermalVent('vent_left', 180, 0.0),
      new HydrothermalVent('vent_right', 420, 6.0), // Staggered by 6.0s
    ];
  }

  public init(): void {
    this.reset();
  }

  /**
   * Spawns polymetallic mineral nodules upon vent eruption.
   * Ejects 3 to 6 nodules drifting upwards (+15 Pure Water each).
   */
  private handleVentEruption(vent: HydrothermalVent): void {
    const count = 3 + Math.floor(Math.random() * 4); // 3 to 6
    for (let i = 0; i < count; i++) {
      this.nodules.push({
        position: {
          x: vent.anchorX + (Math.random() - 0.5) * 24,
          y: vent.baseY - 15,
        },
        velocity: {
          x: (Math.random() - 0.5) * 60,
          y: -(160 + Math.random() * 120), // Upward ejection
        },
        value: 15,
        isDead: false,
      });
    }
  }

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    // 1. Update Ocean Currents
    if (this.currentSystem instanceof OceanCurrent) {
      this.currentSystem.update(deltaTime);
      this.currentSystem.applyCurrentDrag(context.player, deltaTime);

      for (const enemy of context.enemies) {
        this.currentSystem.applyCurrentDrag(enemy, deltaTime);
      }
      for (const bullet of context.bullets) {
        this.currentSystem.applyCurrentToBullet(bullet, deltaTime);
      }
    }

    // 2. Update Hydrothermal Vents
    for (const vent of this.vents) {
      (vent as HydrothermalVent).update(
        deltaTime,
        context.player,
        context.enemies,
        context.bullets,
        (eruptingVent) => this.handleVentEruption(eruptingVent)
      );
    }

    // 3. Update Mineral Nodules & Player Collection
    const playerBounds = {
      x: context.player.position.x,
      y: context.player.position.y,
      width: context.player.size?.width ?? 40,
      height: context.player.size?.height ?? 30,
    };

    for (let i = this.nodules.length - 1; i >= 0; i--) {
      const nodule = this.nodules[i];
      nodule.position.x += nodule.velocity.x * deltaTime;
      nodule.position.y += nodule.velocity.y * deltaTime;

      // Friction & deceleration
      nodule.velocity.x *= 0.98;
      nodule.velocity.y *= 0.985;

      // Check player collection
      const noduleCenterX = nodule.position.x;
      const noduleCenterY = nodule.position.y;

      const playerCenterX = playerBounds.x + playerBounds.width / 2;
      const playerCenterY = playerBounds.y + playerBounds.height / 2;
      const dist = Math.hypot(playerCenterX - noduleCenterX, playerCenterY - noduleCenterY);

      if (dist < 32) {
        // Collected!
        context.currency += nodule.value;
        context.createExplosion(nodule.position.x, nodule.position.y, '#f59e0b', 8, 1.2);
        nodule.isDead = true;
      }

      // Remove expired nodules that reach the surface or die
      if (nodule.position.y < 60 || nodule.isDead) {
        this.nodules.splice(i, 1);
      }
    }
  }

  public drawBackground(ctx: CanvasRenderingContext2D, time: number): void {
    if (!ctx) return;
    this.currentSystem.draw(ctx, time);
    for (const vent of this.vents) {
      vent.draw(ctx);
    }
  }

  public drawWorld(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    // Render floating polymetallic mineral nodules
    for (const nodule of this.nodules) {
      ctx.save();
      ctx.translate(nodule.position.x, nodule.position.y);

      // Gold-copper metallic faceted nodule
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, -2);
      ctx.lineTo(4, 6);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-6, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Specular core gleam
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-1, -2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Faint water sparkle trail
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, 7);
      ctx.lineTo(0, 14);
      ctx.stroke();

      ctx.restore();
    }
  }

  public reset(): void {
    this.nodules = [];
    if (typeof (this.currentSystem as any).reset === 'function') {
      (this.currentSystem as any).reset();
    }
    for (const vent of this.vents) {
      if (typeof (vent as any).reset === 'function') {
        (vent as any).reset();
      }
    }
  }
}

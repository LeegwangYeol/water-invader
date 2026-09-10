// ============================================================================
// WATER INVADER: STRATIFIED DEEP OCEAN CURRENTS & SHEAR CONVEYOR SYSTEM
// ============================================================================

import { IOceanCurrent, Faction } from '../types';
import { Entity } from '../../Entity';
import { Bullet } from '../../Bullet';
import { Vector2D } from '../../types';

export interface CurrentStreamline {
  x: number;
  y: number;
  length: number;
  speedMultiplier: number;
  alpha: number;
  thickness: number;
}

export interface ShearVortexParticle {
  x: number;
  y: number;
  angle: number;
  angularVelocity: number;
  radius: number;
  alpha: number;
}

export class OceanCurrent implements IOceanCurrent {
  public upperShelfVelocityX: number = 75; // +75 px/s East
  public lowerShelfVelocityX: number = -60; // -60 px/s West
  public shelfBoundaryY: number = 400; // 400 px
  public shearBoundaryWidth: number = 80; // 80 px transition band (360px to 440px)
  public readonly canvasWidth: number = 600;
  public readonly canvasHeight: number = 800;

  // Visual Streamlines & Shear Vortex Particles (Pre-allocated pool)
  private streamlines: CurrentStreamline[] = [];
  private vortices: ShearVortexParticle[] = [];
  private readonly maxStreamlines: number = 36;
  private readonly maxVortices: number = 8;

  constructor(canvasWidth: number = 600, canvasHeight: number = 800) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.initStreamlines();
    this.initVortices();
  }

  private initStreamlines(): void {
    this.streamlines = [];
    for (let i = 0; i < this.maxStreamlines; i++) {
      const y = Math.random() * (this.canvasHeight - 120) + 40;
      this.streamlines.push({
        x: Math.random() * this.canvasWidth,
        y,
        length: 24 + Math.random() * 32,
        speedMultiplier: 0.8 + Math.random() * 0.4,
        alpha: 0.12 + Math.random() * 0.18,
        thickness: 1.0 + Math.random() * 1.5,
      });
    }
  }

  private initVortices(): void {
    this.vortices = [];
    for (let i = 0; i < this.maxVortices; i++) {
      this.vortices.push({
        x: (this.canvasWidth / this.maxVortices) * i + Math.random() * 40,
        y: this.shelfBoundaryY + (Math.random() - 0.5) * 30,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (1.2 + Math.random() * 1.5) * (Math.random() > 0.5 ? 1 : -1),
        radius: 8 + Math.random() * 14,
        alpha: 0.15 + Math.random() * 0.2,
      });
    }
  }

  /**
   * Evaluates the current vector at a given coordinate using smooth sigmoid shear transition.
   */
  public getVelocityAt(_x: number, y: number): Vector2D {
    // No-slip boundary condition at the seafloor seabed (defense line zone)
    if (y >= this.canvasHeight - 100) {
      return { x: 0, y: 0 };
    }

    // Distance from shear boundary normalized to [-1, 1]
    const deltaY = y - this.shelfBoundaryY;
    const halfWidth = this.shearBoundaryWidth / 2;
    const normalizedDist = Math.max(-1, Math.min(1, deltaY / halfWidth));

    // Smooth sinusoidal S-curve blend
    const blend = 0.5 + 0.5 * Math.sin((normalizedDist * Math.PI) / 2);

    // blend = 0 (upper shelf) -> upperShelfVelocityX (+75)
    // blend = 1 (lower shelf) -> lowerShelfVelocityX (-60)
    const vx = this.upperShelfVelocityX * (1 - blend) + this.lowerShelfVelocityX * blend;
    return { x: vx, y: 0 };
  }

  /**
   * Applies hydrodynamic conveyor drag to an entity based on fluid velocity.
   */
  public applyCurrentDrag(entity: Entity, deltaTime: number): void {
    if (!entity || !entity.position) return;

    // Player vessel is anchored/stabilized by propulsion thrusters
    if (entity.faction === Faction.PLAYER) {
      return;
    }

    const currentVel = this.getVelocityAt(entity.position.x, entity.position.y);
    // Drag coupling factor (0.18 for smooth, responsive lateral conveyor effect)
    const dragCoupling = 0.18;
    const shift = currentVel.x * dragCoupling * deltaTime;

    entity.position.x += shift;

    // Bounds clamping
    const width = entity.size?.width ?? 32;
    if (entity.position.x < 0) {
      entity.position.x = 0;
    } else if (entity.position.x + width > this.canvasWidth) {
      entity.position.x = this.canvasWidth - width;
    }
  }

  /**
   * Applies aerodynamic/hydrodynamic drag to projectiles, curving bullet trajectories into parabolic paths.
   */
  public applyCurrentToBullet(bullet: Bullet, deltaTime: number): void {
    if (!bullet || !bullet.position || bullet.isDead) return;

    const currentVel = this.getVelocityAt(bullet.position.x, bullet.position.y);
    // Drag formula: a_x = 0.5 * Cd * rho * (v_current - v_x)
    const dragCoeff = 0.35;
    bullet.velocity.x += (currentVel.x - bullet.velocity.x) * dragCoeff * deltaTime;
  }

  /**
   * Updates internal visual streamline animations and shear vortices.
   */
  public update(deltaTime: number): void {
    // 1. Update streamlines
    for (const line of this.streamlines) {
      const vel = this.getVelocityAt(line.x, line.y);
      line.x += vel.x * line.speedMultiplier * deltaTime;

      // Wrap around canvas boundaries
      if (vel.x > 0 && line.x > this.canvasWidth + 40) {
        line.x = -40;
        line.y = Math.random() * (this.canvasHeight - 120) + 40;
      } else if (vel.x < 0 && line.x < -40) {
        line.x = this.canvasWidth + 40;
        line.y = Math.random() * (this.canvasHeight - 120) + 40;
      }
    }

    // 2. Update shear vortices
    for (const vortex of this.vortices) {
      vortex.angle += vortex.angularVelocity * deltaTime;
      vortex.x += ((this.upperShelfVelocityX + this.lowerShelfVelocityX) / 2) * 0.2 * deltaTime;

      if (vortex.x > this.canvasWidth + 30) {
        vortex.x = -30;
      } else if (vortex.x < -30) {
        vortex.x = this.canvasWidth + 30;
      }
    }
  }

  /**
   * Draws oceanic streamlines, shear ribbon indicators, and micro-eddies onto background.
   */
  public draw(ctx: CanvasRenderingContext2D, time: number): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    ctx.save();

    // 1. Render subtle stratified shear layer division at y = 400
    const ribbonGrad = ctx.createLinearGradient(0, this.shelfBoundaryY - 30, 0, this.shelfBoundaryY + 30);
    ribbonGrad.addColorStop(0, 'rgba(56, 189, 248, 0.04)');
    ribbonGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
    ribbonGrad.addColorStop(1, 'rgba(14, 116, 144, 0.04)');

    ctx.fillStyle = ribbonGrad;
    ctx.fillRect(0, this.shelfBoundaryY - 25, this.canvasWidth, 50);

    // 2. Render shear vortices along boundary
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1.0;
    for (const vortex of this.vortices) {
      ctx.beginPath();
      ctx.arc(
        vortex.x,
        vortex.y,
        vortex.radius + Math.sin(time * 2 + vortex.x) * 2,
        vortex.angle,
        vortex.angle + Math.PI * 1.3
      );
      ctx.stroke();
    }

    // 3. Render drifting streamlines
    for (const line of this.streamlines) {
      const vel = this.getVelocityAt(line.x, line.y);
      const isEast = vel.x >= 0;

      ctx.strokeStyle = isEast ? `rgba(56, 189, 248, ${line.alpha})` : `rgba(30, 64, 175, ${line.alpha * 1.2})`;
      ctx.lineWidth = line.thickness;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(line.x, line.y);
      const dir = isEast ? -1 : 1;
      ctx.lineTo(line.x + dir * line.length, line.y);
      ctx.stroke();

      // Streamline head luminous dot
      ctx.fillStyle = isEast ? `rgba(186, 230, 253, ${line.alpha * 1.5})` : `rgba(147, 197, 253, ${line.alpha * 1.5})`;
      ctx.beginPath();
      ctx.arc(line.x, line.y, line.thickness * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Subtle directional vector watermarks on seabed and shelf
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.fillText(`CURRENT: UPPER SHELF +75 px/s EAST >>>`, 20, 120);
    ctx.fillStyle = 'rgba(30, 64, 175, 0.22)';
    ctx.fillText(`<<< CURRENT: LOWER SHELF -60 px/s WEST`, 20, 720);

    ctx.restore();
  }

  public reset(): void {
    this.initStreamlines();
    this.initVortices();
  }
}

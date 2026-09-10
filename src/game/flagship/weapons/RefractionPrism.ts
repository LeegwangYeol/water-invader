// ============================================================================
// WATER INVADER: FEATURE 2 - DEPLOYABLE QUARTZ REFRACTION PRISM
// ============================================================================

import { Vector2D } from '../../types';
import { RefractionPrism } from '../types';

/**
 * Concrete Quartz Refraction Prism Entity.
 * Hovers stably at an intermediate depth (default y = 360 px) and refracts
 * incoming coherent laser beams into a multi-directional fan array.
 */
export class QuartzRefractionPrism implements RefractionPrism {
  public id: string;
  public position: Vector2D;
  public size: Vector2D = { x: 24, y: 24 };
  public splitAngles: number[];
  public powerRatios: number[];
  public active: boolean = true;

  // Hydrodynamic hover kinematics
  public baseY: number;
  private hoverTimer: number;
  private rotationAngle: number = 0;
  public refractionGlowTimer: number = 0;
  public isPentagonal: boolean = false;

  constructor(
    x: number,
    y: number = 360,
    isPentagonal: boolean = false
  ) {
    this.id = `prism_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.position = { x, y };
    this.baseY = y;
    this.hoverTimer = Math.random() * Math.PI * 2;
    this.isPentagonal = isPentagonal;

    if (isPentagonal) {
      // Level 5 Pentagonal Prism: 5-beam fan sweeping 85% of canvas width
      this.splitAngles = [-50, -25, 0, 25, 50];
      this.powerRatios = [0.45, 0.55, 0.70, 0.55, 0.45]; // Total 2.7x output
    } else {
      // Standard Hexagonal Prism: 3-beam fan array (190% cumulative power)
      this.splitAngles = [-35, 0, 35];
      this.powerRatios = [0.60, 0.70, 0.60];
    }
  }

  /**
   * Update floating hover physics.
   */
  public update(deltaTime: number): void {
    this.hoverTimer += deltaTime * 2.2;
    // Gentle floating bob
    this.position.y = this.baseY + Math.sin(this.hoverTimer) * 5;
    // Subtle tilt
    this.rotationAngle = Math.sin(this.hoverTimer * 0.7) * 0.08;

    if (this.refractionGlowTimer > 0) {
      this.refractionGlowTimer = Math.max(0, this.refractionGlowTimer - deltaTime);
    }
  }

  /**
   * Notify prism that it is currently refracting a laser beam.
   */
  public markRefracting(): void {
    this.refractionGlowTimer = 0.12;
  }

  /**
   * Procedural Canvas 2D Vector Rendering of Quartz Crystal Prism.
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;
    ctx.save();

    const cx = this.position.x + this.size.x / 2;
    const cy = this.position.y + this.size.y / 2;
    const halfW = this.size.x / 2;
    const halfH = this.size.y / 2;
    const isGlowing = this.refractionGlowTimer > 0;

    ctx.translate(cx, cy);
    ctx.rotate(this.rotationAngle);

    // 1. Photic bloom when actively refracting
    if (isGlowing) {
      const bloomGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
      bloomGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      bloomGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.7)');
      bloomGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.3)');
      bloomGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ambient dormant halo
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Quartz Diamond / Hexagonal Outer Shell
    ctx.beginPath();
    ctx.moveTo(0, -halfH - 2);         // Top vertex
    ctx.lineTo(halfW, -halfH * 0.3);   // Upper right
    ctx.lineTo(halfW * 0.85, halfH);   // Lower right
    ctx.lineTo(0, halfH + 3);          // Bottom vertex
    ctx.lineTo(-halfW * 0.85, halfH);  // Lower left
    ctx.lineTo(-halfW, -halfH * 0.3);  // Upper left
    ctx.closePath();

    // Crystal fill with specular refraction gradient
    const crystalGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    if (isGlowing) {
      crystalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      crystalGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.85)');
      crystalGrad.addColorStop(1, 'rgba(224, 242, 254, 0.95)');
    } else {
      crystalGrad.addColorStop(0, 'rgba(224, 242, 254, 0.65)');
      crystalGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.45)');
      crystalGrad.addColorStop(1, 'rgba(15, 23, 42, 0.75)');
    }
    ctx.fillStyle = crystalGrad;
    ctx.fill();

    // High-contrast crystal perimeter outline
    ctx.strokeStyle = isGlowing ? '#ffffff' : '#38bdf8';
    ctx.lineWidth = isGlowing ? 2.0 : 1.5;
    ctx.stroke();

    // 3. Internal Geometric Refraction Facets
    ctx.strokeStyle = isGlowing ? 'rgba(255, 255, 255, 0.8)' : 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.0;

    // Facet lines meeting at central focal point
    ctx.beginPath();
    ctx.moveTo(0, -halfH - 2);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, halfH + 3);

    ctx.moveTo(-halfW, -halfH * 0.3);
    ctx.lineTo(0, 0);
    ctx.lineTo(halfW, -halfH * 0.3);

    ctx.moveTo(-halfW * 0.85, halfH);
    ctx.lineTo(0, 0);
    ctx.lineTo(halfW * 0.85, halfH);
    ctx.stroke();

    // 4. Central Refraction Focal Spark
    ctx.fillStyle = isGlowing ? '#ffffff' : '#00e5ff';
    ctx.beginPath();
    ctx.arc(0, 0, isGlowing ? 3.5 : 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

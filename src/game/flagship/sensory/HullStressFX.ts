// ============================================================================
// WATER INVADER: FEATURE 12 - CLAUSTROPHOBIC HULL STRESS & GLASS FRACTURE FX
// ============================================================================
// Procedural glass fracture lines via recursive midpoint displacement, vignetted
// chromatic aberration, camera trauma micro-shake, and cavitation micro-bubbles.

import { GlassFractureLine, FlagshipUpdateContext } from '../types';
import { Vector2D } from '../../types';

export class HullStressFX {
  public fractureLines: GlassFractureLine[] = [];
  public currentStress: number = 0; // 0 to 100%
  public screenShakeTrauma: number = 0; // 0.0 to 1.0

  // Cavitation micro-bubbles rising along cracks
  private microBubbles: Array<{ x: number; y: number; vy: number; radius: number; alpha: number }> =
    [];

  // Time accumulator for groaning pulse and bubble animation
  private animTime: number = 0;

  constructor() {
    this.fractureLines = [];
  }

  /**
   * Adds procedural glass fracture lines using recursive midpoint displacement
   * Formula: p_mid = (p_a + p_b)/2 + normal * random(-1, 1) * roughness * length
   */
  public addFracture(stressPercentage: number): void {
    this.currentStress = stressPercentage;

    // Pick a corner or border anchor
    const corners = [
      { start: { x: 0, y: 0 }, end: { x: 90 + Math.random() * 60, y: 80 + Math.random() * 60 } },
      { start: { x: 600, y: 0 }, end: { x: 510 - Math.random() * 60, y: 80 + Math.random() * 60 } },
      { start: { x: 0, y: 800 }, end: { x: 90 + Math.random() * 60, y: 720 - Math.random() * 60 } },
      { start: { x: 600, y: 800 }, end: { x: 510 - Math.random() * 60, y: 720 - Math.random() * 60 } },
    ];

    const pick = corners[Math.floor(Math.random() * corners.length)];
    const generated = this.displaceMidpoint(pick.start, pick.end, 3, 0.28);
    this.fractureLines.push(...generated);

    // Limit active lines to 36 to preserve performance
    if (this.fractureLines.length > 36) {
      this.fractureLines.splice(0, this.fractureLines.length - 36);
    }
  }

  /**
   * Recursive Midpoint Displacement generator
   */
  private displaceMidpoint(
    p1: Vector2D,
    p2: Vector2D,
    depth: number,
    roughness: number
  ): GlassFractureLine[] {
    if (depth <= 0) {
      return [{ startX: p1.x, startY: p1.y, endX: p2.x, endY: p2.y }];
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Perpendicular normal vector
    const nx = -dy / Math.max(1, len);
    const ny = dx / Math.max(1, len);

    // Offset along normal
    const offset = (Math.random() - 0.5) * 2 * roughness * len;
    const midX = (p1.x + p2.x) / 2 + nx * offset;
    const midY = (p1.y + p2.y) / 2 + ny * offset;
    const mid: Vector2D = { x: midX, y: midY };

    const branch1 = this.displaceMidpoint(p1, mid, depth - 1, roughness * 0.85);
    const branch2 = this.displaceMidpoint(mid, p2, depth - 1, roughness * 0.85);

    // Occasional sub-spiderweb fracture branch
    const all = [...branch1, ...branch2];
    if (depth === 2 && Math.random() < 0.4) {
      const branchAngle = Math.atan2(dy, dx) + (Math.random() < 0.5 ? 0.6 : -0.6);
      const subEnd: Vector2D = {
        x: midX + Math.cos(branchAngle) * (len * 0.45),
        y: midY + Math.sin(branchAngle) * (len * 0.45),
      };
      all.push({ startX: midX, startY: midY, endX: subEnd.x, endY: subEnd.y });
    }

    return all;
  }

  /**
   * Triggers a screen trauma impulse (camera micro-shake)
   */
  public triggerTrauma(amount: number = 0.8): void {
    this.screenShakeTrauma = Math.min(1.0, this.screenShakeTrauma + amount);
  }

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    this.animTime += deltaTime;

    // Decay trauma over 0.22s
    if (this.screenShakeTrauma > 0) {
      this.screenShakeTrauma = Math.max(0, this.screenShakeTrauma - deltaTime * 4.5);
    }

    // Spawn micro-bubbles along cracks when stress is high
    if (this.currentStress > 60 && Math.random() < 0.25 && this.fractureLines.length > 0) {
      const line = this.fractureLines[Math.floor(Math.random() * this.fractureLines.length)];
      this.microBubbles.push({
        x: line.startX + (line.endX - line.startX) * Math.random(),
        y: line.startY + (line.endY - line.startY) * Math.random(),
        vy: -(40 + Math.random() * 50),
        radius: 1.5 + Math.random() * 2,
        alpha: 0.7,
      });
    }

    // Update rising micro-bubbles
    for (let i = this.microBubbles.length - 1; i >= 0; i--) {
      const b = this.microBubbles[i];
      b.y += b.vy * deltaTime;
      b.alpha -= deltaTime * 0.6;
      if (b.alpha <= 0 || b.y < 0) {
        this.microBubbles.splice(i, 1);
      }
    }

    // When stress drops below 50%, slowly heal/clear fracture lines
    if (this.currentStress < 50 && this.fractureLines.length > 0) {
      if (Math.random() < 0.05) {
        this.fractureLines.pop();
      }
    }
  }

  // ==========================================================================
  // RENDERING METHODS
  // ==========================================================================

  /**
   * Draws procedural glass fractures, corner vignette darkening, and micro-bubbles
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    ctx.save();

    // 1. Claustrophobic Corner Vignette (Stress > 50%)
    if (this.currentStress > 50) {
      const intensity = Math.min(1.0, (this.currentStress - 50) / 50.0);
      const grad = ctx.createRadialGradient(300, 400, 180, 300, 400, 520);
      grad.addColorStop(0, 'rgba(2, 6, 23, 0)');
      grad.addColorStop(0.7, `rgba(2, 6, 23, ${intensity * 0.35})`);
      grad.addColorStop(1, `rgba(2, 6, 23, ${intensity * 0.75})`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 800);
    }

    // 2. Procedural Glass Fractures (White core + Cyan chromatic dispersion)
    if (this.fractureLines.length > 0) {
      // Outer chromatic dispersion glow
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (const line of this.fractureLines) {
        ctx.moveTo(line.startX + 1, line.startY);
        ctx.lineTo(line.endX + 1, line.endY);
      }
      ctx.stroke();

      // Sharp white fracture line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const line of this.fractureLines) {
        ctx.moveTo(line.startX, line.startY);
        ctx.lineTo(line.endX, line.endY);
      }
      ctx.stroke();
    }

    // 3. Cavitation Micro-bubbles
    for (const b of this.microBubbles) {
      ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  public reset(): void {
    this.fractureLines = [];
    this.currentStress = 0;
    this.screenShakeTrauma = 0;
    this.microBubbles = [];
  }
}

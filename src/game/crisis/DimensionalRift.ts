import { Entity } from '../Entity';
import { Vector2D, Faction } from '../types';
import { ICrisisRift } from './types';

/**
 * Dimensional Rift Anchor
 * 
 * Flanking dimensional anomaly (80x80px) that channels cosmic energy to shield
 * the Crisis Sovereign during Phase 1. Features 100% pure Canvas 2D vector rendering
 * with swirling accretion disks, event horizons, and gravitational wave distortion.
 */
export class DimensionalRift extends Entity implements ICrisisRift {
  public riftIndex: number;
  public hp: number;
  public maxHp: number;
  public isInvulnerable: boolean = false;
  public flashTimer: number = 0;
  public isShielding: boolean = true;
  
  public pulsePhase: number = 0;
  public accretionDiskAngle: number = 0;
  public gravitationalPullRadius: number = 240;
  public gravitationalPullForce: number = 45;
  
  private initialX: number;
  private initialY: number;
  private floatTime: number = 0;
  private targetSovereignPos: Vector2D | null = null;
  private particleOrbits: { angle: number; distance: number; speed: number; radius: number; hue: number }[] = [];

  constructor(x: number, y: number, riftIndex: number = 0, maxHp: number = 600) {
    super(x, y, 80, 80);
    this.riftIndex = riftIndex;
    this.initialX = x;
    this.initialY = y;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.faction = Faction.INVADER;
    this.color = riftIndex === 0 ? '#a855f7' : '#06b6d4';

    // Seed orbital particle distortion motes
    for (let i = 0; i < 16; i++) {
      this.particleOrbits.push({
        angle: (i / 16) * Math.PI * 2,
        distance: 18 + Math.random() * 22,
        speed: (Math.random() * 1.5 + 1.2) * (i % 2 === 0 ? 1 : -1),
        radius: Math.random() * 2 + 1.5,
        hue: i % 2 === 0 ? 270 : 190, // Purple or Cyan
      });
    }
  }

  public setSovereignTarget(target: Vector2D | null): void {
    this.targetSovereignPos = target;
  }

  public getSingularityCenter(): Vector2D {
    return {
      x: this.position.x + this.size.width / 2,
      y: this.position.y + this.size.height / 2,
    };
  }

  public takeDamage(amount: number, _piercing?: number): number {
    if (this.isDead || this.isInvulnerable) return 0;

    const actualDamage = Math.min(this.hp, amount);
    this.hp -= actualDamage;
    this.flashTimer = 0.08;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.isShielding = false;
    }

    return actualDamage;
  }

  public update(deltaTime: number): void {
    if (this.isDead) return;

    this.floatTime += deltaTime;
    this.accretionDiskAngle += (deltaTime * 2.2) * (this.riftIndex === 0 ? 1 : -1);
    this.pulsePhase += deltaTime * 3.5;

    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
    }

    // Hover / bobbing motion with slight Lissajous curve
    const hoverAmplitudeX = 6;
    const hoverAmplitudeY = 12;
    const hoverSpeed = 1.6 + this.riftIndex * 0.2;
    this.position.x = this.initialX + Math.sin(this.floatTime * hoverSpeed) * hoverAmplitudeX;
    this.position.y = this.initialY + Math.cos(this.floatTime * hoverSpeed * 0.8) * hoverAmplitudeY;

    // Update orbital particles
    for (const p of this.particleOrbits) {
      p.angle += p.speed * deltaTime;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    const center = this.getSingularityCenter();
    const radius = this.size.width / 2;
    const pulseScale = 1.0 + Math.sin(this.pulsePhase) * 0.08;

    ctx.save();

    // 1. Draw Energy Shielding Conduit Beam connecting to Sovereign if shielding
    if (this.isShielding && this.targetSovereignPos) {
      this.drawShieldConduit(ctx, center, this.targetSovereignPos);
    }

    // 2. Gravitational Wave Ripples (Distortion Field)
    const waveProgress = (this.floatTime * 1.5) % 1;
    const waveRadius = radius * (1.1 + waveProgress * 0.8);
    const waveAlpha = (1 - waveProgress) * 0.35;
    ctx.save();
    ctx.strokeStyle = this.riftIndex === 0 ? `rgba(192, 132, 252, ${waveAlpha})` : `rgba(34, 211, 238, ${waveAlpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(center.x, center.y, waveRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Outer Accretion Disk Vortex (Rotating Spirals)
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(this.accretionDiskAngle);

    // Glowing accretion outer ring
    const gradient = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.3 * pulseScale);
    if (this.flashTimer > 0) {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.7)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else if (this.riftIndex === 0) {
      gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)');
      gradient.addColorStop(0.4, 'rgba(192, 132, 252, 0.5)');
      gradient.addColorStop(0.8, 'rgba(79, 70, 229, 0.25)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
      gradient.addColorStop(0.4, 'rgba(56, 189, 248, 0.5)');
      gradient.addColorStop(0.8, 'rgba(37, 99, 235, 0.25)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // Swirling multi-arm plasma jets
    const numArms = 4;
    for (let i = 0; i < numArms; i++) {
      const armAngle = (i * Math.PI * 2) / numArms;
      ctx.save();
      ctx.rotate(armAngle);
      ctx.strokeStyle = this.riftIndex === 0 ? 'rgba(216, 180, 254, 0.65)' : 'rgba(165, 243, 252, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(radius * 0.35, 0);
      ctx.bezierCurveTo(
        radius * 0.7, radius * 0.4,
        radius * 0.9, radius * 0.6,
        radius * 1.15, radius * 0.2
      );
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 4. Orbital Particle Distortion Motes
    for (const p of this.particleOrbits) {
      const px = center.x + Math.cos(p.angle) * p.distance * pulseScale;
      const py = center.y + Math.sin(p.angle) * p.distance * pulseScale;
      ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, 0.85)`;
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Pulsing Event Horizon Core
    ctx.save();
    // Radiant event horizon perimeter ring
    const horizonGlow = ctx.createRadialGradient(center.x, center.y, radius * 0.2, center.x, center.y, radius * 0.55);
    horizonGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
    horizonGlow.addColorStop(0.7, 'rgba(9, 5, 20, 0.95)');
    horizonGlow.addColorStop(0.9, this.riftIndex === 0 ? 'rgba(192, 132, 252, 0.9)' : 'rgba(34, 211, 238, 0.9)');
    horizonGlow.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

    ctx.fillStyle = horizonGlow;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.5 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // Pure Void Singularity Center
    ctx.fillStyle = '#02010a';
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Central high-energy point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Mini Health Gauge
    this.drawHealthBar(ctx, center, radius);

    ctx.restore();
  }

  private drawShieldConduit(ctx: CanvasRenderingContext2D, from: Vector2D, to: Vector2D): void {
    ctx.save();
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) {
      ctx.restore();
      return;
    }

    const segments = 8;
    const beamPulse = Math.sin(this.floatTime * 8) * 3;
    const color = this.riftIndex === 0 ? 'rgba(192, 132, 252, ' : 'rgba(34, 211, 238, ';

    // Outer glow beam
    ctx.strokeStyle = `${color}0.35)`;
    ctx.lineWidth = 5 + Math.abs(beamPulse);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const nx = from.x + dx * t;
      const ny = from.y + dy * t;
      const offset = Math.sin(this.floatTime * 12 + i) * 4;
      ctx.lineTo(nx + (-dy / dist) * offset, ny + (dx / dist) * offset);
    }
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Inner bright beam core
    ctx.strokeStyle = `${color}0.85)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.restore();
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D, center: Vector2D, radius: number): void {
    const barWidth = 44;
    const barHeight = 4;
    const barX = center.x - barWidth / 2;
    const barY = center.y + radius + 8;
    const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));

    // Background track
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // HP Fill
    ctx.fillStyle = this.riftIndex === 0 ? '#c084fc' : '#22d3ee';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
  }
}

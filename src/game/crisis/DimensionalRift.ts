import { Entity } from '../Entity';
import { Vector2D, Faction } from '../types';
import { Bullet } from '../Bullet';
import { Player } from '../Player';
import { CrisisArchetype, ICrisisRift } from './types';

/**
 * Dimensional Rift Anchor / Archetypal Phase 1 Anchor
 * 
 * Flanking anchor (80x80px) that channels energy to shield the Crisis Sovereign during Phase 1:
 * - VOID_SOVEREIGN: Cosmic Singularity Rifts (gravitational distortion)
 * - ABYSSAL_LEVIATHAN: Bio-Brood Sacks (spawning toxic acid spitters)
 * - CYBERNETIC_EXTERMINATOR: EMP Laser Pylons (charging shock beams)
 */
export class DimensionalRift extends Entity implements ICrisisRift {
  public riftIndex: number;
  public hp: number;
  public maxHp: number;
  public isInvulnerable: boolean = false;
  public flashTimer: number = 0;
  public isShielding: boolean = true;
  public archetype: CrisisArchetype = CrisisArchetype.VOID_SOVEREIGN;
  
  public pulsePhase: number = 0;
  public accretionDiskAngle: number = 0;
  public gravitationalPullRadius: number = 240;
  public gravitationalPullForce: number = 45;

  public siblingRift: DimensionalRift | null = null;
  public isCoherentPhase: boolean = true;
  public tripwireTimer: number = 0;
  public phaseToggleTimer: number = 0;
  
  private initialX: number;
  private initialY: number;
  private floatTime: number = 0;
  private actionTimer: number = 0;
  private targetSovereignPos: Vector2D | null = null;
  private particleOrbits: { angle: number; distance: number; speed: number; radius: number; hue: number }[] = [];

  constructor(x: number, y: number, riftIndex: number = 0, maxHp: number = 600, archetype: CrisisArchetype = CrisisArchetype.VOID_SOVEREIGN) {
    super(x, y, 80, 80);
    this.riftIndex = riftIndex;
    this.initialX = x;
    this.initialY = y;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.archetype = archetype;
    this.faction = Faction.INVADER;
    
    if (archetype === CrisisArchetype.ABYSSAL_LEVIATHAN) {
      this.color = '#84cc16';
    } else if (archetype === CrisisArchetype.CYBERNETIC_EXTERMINATOR) {
      this.color = '#ef4444';
    } else if (archetype === CrisisArchetype.CHRONO_DEVOURER) {
      this.color = '#fbbf24';
      this.gravitationalPullRadius = 200;
      this.gravitationalPullForce = 30;
    } else if (archetype === CrisisArchetype.SOLARIS_COLOSSUS) {
      this.color = '#f97316';
      this.gravitationalPullRadius = 180;
      this.gravitationalPullForce = 25;
    } else if (archetype === CrisisArchetype.NEBULA_PHANTASM) {
      this.color = '#6366f1';
      this.gravitationalPullRadius = 220;
      this.gravitationalPullForce = 35;
      this.isCoherentPhase = riftIndex === 0;
    } else {
      this.color = riftIndex === 0 ? '#a855f7' : '#06b6d4';
    }

    // Seed orbital particle distortion motes
    for (let i = 0; i < 16; i++) {
      let hue = i % 2 === 0 ? 270 : 190;
      if (archetype === CrisisArchetype.ABYSSAL_LEVIATHAN) {
        hue = i % 2 === 0 ? 85 : 120; // Lime / Green
      } else if (archetype === CrisisArchetype.CYBERNETIC_EXTERMINATOR) {
        hue = i % 2 === 0 ? 15 : 45; // Red / Orange
      } else if (archetype === CrisisArchetype.CHRONO_DEVOURER) {
        hue = i % 2 === 0 ? 42 : 54; // Amber Gold / Topaz
      } else if (archetype === CrisisArchetype.SOLARIS_COLOSSUS) {
        hue = i % 2 === 0 ? 20 : 35; // Solar Flame / Crimson
      } else if (archetype === CrisisArchetype.NEBULA_PHANTASM) {
        hue = i % 2 === 0 ? 240 : 190; // Indigo / Bioluminescent Cyan
      }
      this.particleOrbits.push({
        angle: (i / 16) * Math.PI * 2,
        distance: 18 + Math.random() * 22,
        speed: (Math.random() * 1.5 + 1.2) * (i % 2 === 0 ? 1 : -1),
        radius: Math.random() * 2 + 1.5,
        hue: hue,
      });
    }
  }

  public setSiblingRift(sibling: DimensionalRift | null): void {
    this.siblingRift = sibling;
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

    let effectiveDamage = amount;
    // For NEBULA_PHANTASM: Entangled Phase Pods (80% damage reduction when in Shifted phase)
    if (this.archetype === CrisisArchetype.NEBULA_PHANTASM && !this.isCoherentPhase) {
      effectiveDamage = Math.max(1, Math.floor(amount * 0.2));
    }

    const actualDamage = Math.min(this.hp, effectiveDamage);
    this.hp -= actualDamage;
    this.flashTimer = 0.08;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.isShielding = false;
    }

    return actualDamage;
  }

  public update(deltaTime: number, player?: Player, bullets?: Bullet[]): Bullet[] {
    if (this.isDead) return [];

    this.floatTime += deltaTime;
    this.accretionDiskAngle += (deltaTime * 2.2) * (this.riftIndex === 0 ? 1 : -1);
    this.pulsePhase += deltaTime * 3.5;
    this.actionTimer += deltaTime;

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

    const spawnedBullets: Bullet[] = [];
    const center = this.getSingularityCenter();

    // Archetype-specific Phase 1 behaviors:
    if (this.archetype === CrisisArchetype.ABYSSAL_LEVIATHAN) {
      // Bio-Brood Sack: Spawns toxic acid spitters / bio-larvae spores periodically
      if (this.actionTimer >= 2.8) {
        this.actionTimer = 0;
        const targetX = player ? player.position.x + player.size.width / 2 : center.x;
        const targetY = player ? player.position.y : center.y + 400;
        const dx = targetX - center.x;
        const dy = targetY - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 180;
        const spore = new Bullet(center.x - 5, center.y + 20, (dy / dist) * speed, 1, false);
        spore.velocity.x = (dx / dist) * speed;
        spore.color = '#84cc16';
        spore.isInterceptable = true;
        spawnedBullets.push(spore);
      }
    } else if (this.archetype === CrisisArchetype.CYBERNETIC_EXTERMINATOR) {
      // EMP Laser Pylon: Charges and fires high-tech shock rail bolts
      if (this.actionTimer >= 3.2) {
        this.actionTimer = 0;
        const rail = new Bullet(center.x - 5, center.y + 25, 260, 1, false);
        rail.velocity.x = (this.riftIndex === 0 ? 1 : -1) * 40;
        rail.color = '#ef4444';
        rail.isInterceptable = true;
        spawnedBullets.push(rail);
      }
    } else if (this.archetype === CrisisArchetype.CHRONO_DEVOURER) {
      // Tachyon Monolith: Emits accelerating tachyon needles and chronal distortion field
      if (this.actionTimer >= 2.5) {
        this.actionTimer = 0;
        const needleAngles = [-0.15, 0, 0.15];
        for (const ang of needleAngles) {
          const speedY = 120;
          const needle = new Bullet(center.x - 4, center.y + 25, speedY, 1, false);
          needle.velocity.x = Math.sin(ang) * 90;
          needle.color = '#fbbf24';
          needle.isInterceptable = true;
          spawnedBullets.push(needle);
        }
      }

      // Accelerate tachyon needles and slow player bullets in chronal field
      if (bullets) {
        for (const b of bullets) {
          if (b.color === '#fbbf24' && b.faction === Faction.INVADER && !b.isDead) {
            b.velocity.y += 180 * deltaTime;
          }
          if (b.faction === Faction.PLAYER && !b.isDead) {
            const bx = b.position.x + b.size.width / 2;
            const by = b.position.y + b.size.height / 2;
            const bdx = center.x - bx;
            const bdy = center.y - by;
            const distSq = bdx * bdx + bdy * bdy;
            if (distSq < 180 * 180 && distSq > 100) {
              b.velocity.y *= Math.max(0.4, 1 - 0.7 * deltaTime);
            }
          }
        }
      }
    } else if (this.archetype === CrisisArchetype.SOLARIS_COLOSSUS) {
      // Prominence Pillar: Sweeping thermal laser tripwires & incendiary sparks
      this.tripwireTimer = (this.tripwireTimer + deltaTime) % 4.0;
      
      if (this.actionTimer >= 3.0) {
        this.actionTimer = 0;
        const angles = [-0.35, -0.12, 0.12, 0.35];
        for (const ang of angles) {
          const spark = new Bullet(center.x - 4, center.y + 20, 200, 1, false);
          spark.velocity.x = Math.sin(ang) * 160;
          spark.color = '#f97316';
          spark.isInterceptable = true;
          spawnedBullets.push(spark);
        }
      }

      // Sweeping thermal laser tripwire (active 3.0s - 3.8s)
      if (this.tripwireTimer >= 3.0 && this.tripwireTimer <= 3.8) {
        const sweepProgress = (Math.sin(this.floatTime * 0.8) + 1) / 2;
        const tripwireY = 190 + sweepProgress * 420;
        if (player && Math.abs(player.position.y + player.size.height / 2 - tripwireY) < 14) {
          if (player.invincibilityTimer <= 0) {
            player.hp -= 1;
            player.invincibilityTimer = 1.0;
            player.hitFlashTimer = 0.15;
          }
        }
      }
    } else if (this.archetype === CrisisArchetype.NEBULA_PHANTASM) {
      // Entangled Phase Pod: Alternates Coherent/Shifted phases & fires undulating spectral needles
      this.phaseToggleTimer = (this.phaseToggleTimer + deltaTime) % 7.0;
      this.isCoherentPhase = this.riftIndex === 0 ? (this.phaseToggleTimer < 3.5) : (this.phaseToggleTimer >= 3.5);

      if (this.actionTimer >= 2.4) {
        this.actionTimer = 0;
        const targetX = player ? player.position.x + player.size.width / 2 : center.x;
        const targetY = player ? player.position.y : center.y + 400;
        const dx = targetX - center.x;
        const dy = targetY - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 170;

        const needle1 = new Bullet(center.x - 6, center.y + 20, (dy / dist) * speed, 1, false);
        needle1.velocity.x = (dx / dist) * speed + Math.sin(this.floatTime * 4) * 40;
        needle1.color = '#06b6d4';
        needle1.isInterceptable = true;

        const needle2 = new Bullet(center.x + 6, center.y + 20, (dy / dist) * speed, 1, false);
        needle2.velocity.x = (dx / dist) * speed - Math.sin(this.floatTime * 4) * 40;
        needle2.color = '#6366f1';
        needle2.isInterceptable = true;

        spawnedBullets.push(needle1, needle2);
      }
    }

    return spawnedBullets;
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

    if (this.archetype === CrisisArchetype.ABYSSAL_LEVIATHAN) {
      // -------------------------------------------------------------
      // Abyssal Leviathan: Bio-Brood Sack (Organic Pulsating Egg-Sac)
      // -------------------------------------------------------------
      // 1. Slime Aura
      ctx.fillStyle = `rgba(132, 204, 22, ${0.25 * pulseScale})`;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, radius * 1.25 * pulseScale, radius * 1.4 * pulseScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Organic Membrane Pod
      const bioGrad = ctx.createRadialGradient(center.x, center.y - 5, radius * 0.1, center.x, center.y, radius * 1.1 * pulseScale);
      if (this.flashTimer > 0) {
        bioGrad.addColorStop(0, '#ffffff');
        bioGrad.addColorStop(1, '#84cc16');
      } else {
        bioGrad.addColorStop(0, '#d9f99d');
        bioGrad.addColorStop(0.5, '#65a30d');
        bioGrad.addColorStop(0.9, '#1a2e05');
      }
      ctx.fillStyle = bioGrad;
      ctx.strokeStyle = '#051802';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, radius * 0.9, radius * 1.1 * pulseScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 3. Bio-vein tendrils
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.7)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + this.floatTime;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.quadraticCurveTo(
          center.x + Math.cos(ang) * radius * 0.8,
          center.y + Math.sin(ang) * radius * 0.8,
          center.x + Math.cos(ang + 0.3) * radius * 1.05,
          center.y + Math.sin(ang + 0.3) * radius * 1.05
        );
        ctx.stroke();
      }

      // 4. Brood Sack Nucleus
      ctx.fillStyle = '#bef264';
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius * 0.35 * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      // 5. Orbital Spore Motes
      for (const p of this.particleOrbits) {
        const px = center.x + Math.cos(p.angle) * p.distance * pulseScale;
        const py = center.y + Math.sin(p.angle) * p.distance * pulseScale;
        ctx.fillStyle = '#a3e635';
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (this.archetype === CrisisArchetype.CYBERNETIC_EXTERMINATOR) {
      // -------------------------------------------------------------
      // Cybernetic Exterminator: EMP Laser Defense Pylon (Mechanical Spire)
      // -------------------------------------------------------------
      // 1. Power Aura
      ctx.fillStyle = `rgba(239, 68, 68, ${0.2 * pulseScale})`;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius * 1.3 * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      // 2. Mechanical Pylon Chassis
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.fillStyle = this.flashTimer > 0 ? '#ffffff' : '#1e293b';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.0;

      // Hexagonal Pylon Spire
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        const px = Math.cos(ang) * (radius * 0.9);
        const py = Math.sin(ang) * (radius * 0.9);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner power core housing
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.45 * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      // Laser Emitter Crystal
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Orbital Energy Bits
      for (const p of this.particleOrbits) {
        const px = center.x + Math.cos(p.angle) * p.distance * pulseScale;
        const py = center.y + Math.sin(p.angle) * p.distance * pulseScale;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (this.archetype === CrisisArchetype.CHRONO_DEVOURER) {
      // -------------------------------------------------------------
      // Chrono Devourer: Tachyon Monolith (Golden Clockwork Obelisk)
      // -------------------------------------------------------------
      this.drawTachyonMonolith(ctx, center, radius, pulseScale);
    } else if (this.archetype === CrisisArchetype.SOLARIS_COLOSSUS) {
      // -------------------------------------------------------------
      // Solaris Colossus: Prominence Pillar (Stellar Fusion Conduit)
      // -------------------------------------------------------------
      this.drawProminencePillar(ctx, center, radius, pulseScale);
    } else if (this.archetype === CrisisArchetype.NEBULA_PHANTASM) {
      // -------------------------------------------------------------
      // Nebula Phantasm: Entangled Quantum Phase Pod (Phasing Chrysalis)
      // -------------------------------------------------------------
      this.drawQuantumPhasePod(ctx, center, radius, pulseScale);
    } else {
      // -------------------------------------------------------------
      // Void Sovereign: Cosmic Singularity Rift (Original Dark Matter Vortex)
      // -------------------------------------------------------------
      // Gravitational Wave Ripples
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

      // Outer Accretion Disk Vortex
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(this.accretionDiskAngle);

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

      // Swirling plasma arms
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

      // Orbital Particle Distortion Motes
      for (const p of this.particleOrbits) {
        const px = center.x + Math.cos(p.angle) * p.distance * pulseScale;
        const py = center.y + Math.sin(p.angle) * p.distance * pulseScale;
        ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, 0.85)`;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pulsing Event Horizon Core
      ctx.save();
      const horizonGlow = ctx.createRadialGradient(center.x, center.y, radius * 0.2, center.x, center.y, radius * 0.55);
      horizonGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
      horizonGlow.addColorStop(0.7, 'rgba(9, 5, 20, 0.95)');
      horizonGlow.addColorStop(0.9, this.riftIndex === 0 ? 'rgba(192, 132, 252, 0.9)' : 'rgba(34, 211, 238, 0.9)');
      horizonGlow.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

      ctx.fillStyle = horizonGlow;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius * 0.5 * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#02010a';
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(center.x, center.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Mini Health Gauge
    this.drawHealthBar(ctx, center, radius);

    ctx.restore();
  }

  /**
   * Chrono Devourer: Tachyon Monolith Visuals
   */
  private drawTachyonMonolith(ctx: CanvasRenderingContext2D, center: Vector2D, radius: number, pulseScale: number): void {
    ctx.save();

    // 1. Chronal Distortion Field (Pulsing concentric golden rings)
    const ringPhase = (this.floatTime * 0.8) % 1;
    const ringRadius = radius * (1.0 + ringPhase * 1.2);
    ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - ringPhase) * 0.5})`;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Counter-Rotating Brass Gear Rings
    const gearRadius1 = radius * 0.75 * pulseScale;
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(this.floatTime * 2.0 * (this.riftIndex === 0 ? 1 : -1));
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, gearRadius1, 0, Math.PI * 2);
    ctx.stroke();
    // 6 gear teeth
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(Math.cos(a) * gearRadius1 - 3, Math.sin(a) * gearRadius1 - 3, 6, 6);
    }
    ctx.restore();

    // 3. Floating Obelisk Body
    ctx.save();
    ctx.translate(center.x, center.y);
    const isHit = this.flashTimer > 0;
    ctx.fillStyle = isHit ? '#ffffff' : '#78350f';
    ctx.strokeStyle = isHit ? '#fef08a' : '#fbbf24';
    ctx.lineWidth = 2.5;

    // Tapered alien obelisk silhouette
    ctx.beginPath();
    ctx.moveTo(0, -radius * 1.15 * pulseScale); // Apex tip
    ctx.lineTo(radius * 0.45, -radius * 0.5);
    ctx.lineTo(radius * 0.4, radius * 1.05);
    ctx.lineTo(-radius * 0.4, radius * 1.05);
    ctx.lineTo(-radius * 0.45, -radius * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central Chronal Runic Inscriptions
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.5);
    ctx.lineTo(0, radius * 0.85);
    ctx.moveTo(-radius * 0.2, -radius * 0.1);
    ctx.lineTo(radius * 0.2, -radius * 0.1);
    ctx.moveTo(-radius * 0.25, radius * 0.3);
    ctx.lineTo(radius * 0.25, radius * 0.3);
    ctx.stroke();

    // Apex Topaz Radiance
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -radius * 0.7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Orbital Tachyon Particles
    for (const p of this.particleOrbits) {
      const px = center.x + Math.cos(p.angle) * p.distance * pulseScale;
      const py = center.y + Math.sin(p.angle) * p.distance * pulseScale;
      ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, 0.9)`;
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Solaris Colossus: Prominence Pillar Visuals & Thermal Tripwire
   */
  private drawProminencePillar(ctx: CanvasRenderingContext2D, center: Vector2D, radius: number, pulseScale: number): void {
    ctx.save();

    // 1. Molten Heat Flare Aura
    const heatAura = ctx.createRadialGradient(center.x, center.y, radius * 0.2, center.x, center.y, radius * 1.35 * pulseScale);
    heatAura.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
    heatAura.addColorStop(0.5, 'rgba(249, 115, 22, 0.25)');
    heatAura.addColorStop(1, 'rgba(69, 26, 3, 0)');
    ctx.fillStyle = heatAura;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 1.35 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // 2. Basalt Obsidian Pillar Chassis
    const isHit = this.flashTimer > 0;
    ctx.fillStyle = isHit ? '#ffffff' : '#451a03';
    ctx.strokeStyle = isHit ? '#ef4444' : '#f97316';
    ctx.lineWidth = 2.5;

    // Heavy segmented pillar
    ctx.beginPath();
    ctx.roundRect(center.x - radius * 0.55, center.y - radius * 0.95, radius * 1.1, radius * 1.9, 8);
    ctx.fill();
    ctx.stroke();

    // Molten Fissure Core
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(center.x - radius * 0.2, center.y - radius * 0.7, radius * 0.4, radius * 1.4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(center.x - radius * 0.08, center.y - radius * 0.6, radius * 0.16, radius * 1.2);

    // 3. Erupting Solar Prominence Flame Crest
    const flameWiggle = Math.sin(this.floatTime * 6) * 6;
    ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
    ctx.beginPath();
    ctx.moveTo(center.x - radius * 0.4, center.y - radius * 0.95);
    ctx.quadraticCurveTo(center.x + flameWiggle, center.y - radius * 1.6 * pulseScale, center.x + radius * 0.4, center.y - radius * 0.95);
    ctx.closePath();
    ctx.fill();

    // 4. Orbital Plasma Sparks
    for (const p of this.particleOrbits) {
      const px = center.x + Math.cos(p.angle) * p.distance * pulseScale;
      const py = center.y + Math.sin(p.angle) * p.distance * pulseScale;
      ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, 0.9)`;
      ctx.beginPath();
      ctx.arc(px, py, p.radius * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Sweeping Thermal Laser Tripwire (Conduit between pillars across arena)
    if (this.riftIndex === 0 && this.siblingRift && !this.siblingRift.isDead) {
      const siblingCenter = this.siblingRift.getSingularityCenter();
      const sweepProgress = (Math.sin(this.floatTime * 0.8) + 1) / 2;
      const tripwireY = 190 + sweepProgress * 420;

      if (this.tripwireTimer >= 2.0 && this.tripwireTimer < 3.0) {
        // Warning Telegraph
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(center.x, tripwireY);
        ctx.lineTo(siblingCenter.x, tripwireY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (this.tripwireTimer >= 3.0 && this.tripwireTimer <= 3.8) {
        // Ignited Beam
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 6.0;
        ctx.beginPath();
        ctx.moveTo(center.x, tripwireY);
        ctx.lineTo(siblingCenter.x, tripwireY);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(center.x, tripwireY);
        ctx.lineTo(siblingCenter.x, tripwireY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Nebula Phantasm: Entangled Quantum Phase Pod Visuals & Laser Tether
   */
  private drawQuantumPhasePod(ctx: CanvasRenderingContext2D, center: Vector2D, radius: number, pulseScale: number): void {
    ctx.save();

    const isHit = this.flashTimer > 0;
    const isCoherent = this.isCoherentPhase;
    const podAlpha = isCoherent ? 0.9 : 0.35;

    ctx.globalAlpha = podAlpha;

    // 1. Quantum Shroud Aura
    const mistAura = ctx.createRadialGradient(center.x, center.y, radius * 0.2, center.x, center.y, radius * 1.35 * pulseScale);
    mistAura.addColorStop(0, isCoherent ? 'rgba(6, 182, 212, 0.5)' : 'rgba(99, 102, 241, 0.3)');
    mistAura.addColorStop(0.7, isCoherent ? 'rgba(99, 102, 241, 0.2)' : 'rgba(217, 70, 239, 0.15)');
    mistAura.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = mistAura;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 1.35 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // 2. Refractive Crystalline Pod Chassis
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.fillStyle = isHit ? '#ffffff' : (isCoherent ? '#0f172a' : '#1e1b4b');
    ctx.strokeStyle = isCoherent ? '#06b6d4' : '#d946ef';
    ctx.lineWidth = 2.5;

    // Hexagonal faceted cocoon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      const px = Math.cos(ang) * (radius * 0.85 * pulseScale);
      const py = Math.sin(ang) * (radius * 1.15 * pulseScale);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Dark Matter Core
    ctx.fillStyle = isCoherent ? '#06b6d4' : '#6366f1';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35 * pulseScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Orbital Quantum Mist Particles
    for (const p of this.particleOrbits) {
      const px = center.x + Math.cos(p.angle) * p.distance * pulseScale;
      const py = center.y + Math.sin(p.angle) * p.distance * pulseScale;
      ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${isCoherent ? 0.9 : 0.4})`;
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;

    // 4. Quantum Laser Tether connecting left & right pods
    if (this.riftIndex === 0 && this.siblingRift && !this.siblingRift.isDead) {
      const sib = this.siblingRift.getSingularityCenter();
      const dx = sib.x - center.x;
      const dy = sib.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const segments = 16;

      ctx.save();
      // Wave 1 (Cyan)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const nx = center.x + dx * t;
        const ny = center.y + dy * t;
        const offset = Math.sin(this.floatTime * 5 + i * 0.8) * 8;
        ctx.lineTo(nx, ny + offset);
      }
      ctx.lineTo(sib.x, sib.y);
      ctx.stroke();

      // Wave 2 (Magenta)
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.7)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const nx = center.x + dx * t;
        const ny = center.y + dy * t;
        const offset = -Math.sin(this.floatTime * 5 + i * 0.8) * 8;
        ctx.lineTo(nx, ny + offset);
      }
      ctx.lineTo(sib.x, sib.y);
      ctx.stroke();
      ctx.restore();
    }

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
    let color = this.riftIndex === 0 ? 'rgba(192, 132, 252, ' : 'rgba(34, 211, 238, ';
    if (this.archetype === CrisisArchetype.CHRONO_DEVOURER) {
      color = 'rgba(251, 191, 36, ';
    } else if (this.archetype === CrisisArchetype.SOLARIS_COLOSSUS) {
      color = 'rgba(249, 115, 22, ';
    } else if (this.archetype === CrisisArchetype.NEBULA_PHANTASM) {
      color = 'rgba(99, 102, 241, ';
    }

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

    // HP Fill color based on archetype
    let hpColor = this.riftIndex === 0 ? '#c084fc' : '#22d3ee';
    if (this.archetype === CrisisArchetype.ABYSSAL_LEVIATHAN) {
      hpColor = '#84cc16';
    } else if (this.archetype === CrisisArchetype.CYBERNETIC_EXTERMINATOR) {
      hpColor = '#ef4444';
    } else if (this.archetype === CrisisArchetype.CHRONO_DEVOURER) {
      hpColor = '#fbbf24';
    } else if (this.archetype === CrisisArchetype.SOLARIS_COLOSSUS) {
      hpColor = '#f97316';
    } else if (this.archetype === CrisisArchetype.NEBULA_PHANTASM) {
      hpColor = this.isCoherentPhase ? '#06b6d4' : '#6366f1';
    }

    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
  }
}

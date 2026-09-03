import { Entity } from '../Entity';
import { Vector2D, Faction, Rect } from '../types';
import { CrisisArchetype, CrisisPhase, ICrisisEntity, CrisisAttackPattern } from './types';

/**
 * Screen-filling End-Game Crisis Sovereign Entity (260x130px)
 * 
 * Commands 5,200 EHP across 3 discrete phases with pure Canvas 2D vector rendering,
 * distinct archetypal hull geometry, rotating deflection matrices, and multi-segment HUD bars.
 */
export class CrisisSovereign extends Entity implements ICrisisEntity {
  public archetype: CrisisArchetype;
  public phase: CrisisPhase = CrisisPhase.INCURSION;
  public hp: number;
  public maxHp: number;
  
  public hullHp: number = 2500;
  public maxHullHp: number = 2500;
  public coreHp: number = 1500;
  public maxCoreHp: number = 1500;
  
  public isInvulnerable: boolean = true; // Invulnerable while Rifts are active (Phase 1)
  public flashTimer: number = 0;
  public shieldFlashTimer: number = 0;
  
  public enrageTimer: number = 35.0; // 35-second enrage clock in Phase 3
  public enrageMaxTime: number = 35.0;
  
  public floatTime: number = 0;
  public pulsePhase: number = 0;
  public shieldRotationAngle: number = 0;
  public eyeAngle: number = 0;
  
  public initialX: number;
  public initialY: number;
  public targetX: number;
  public targetY: number;
  
  public activeAttack: CrisisAttackPattern | null = null;
  public realityDistortionLevel: number = 0;

  constructor(
    x: number,
    y: number,
    archetype: CrisisArchetype = CrisisArchetype.VOID_SOVEREIGN,
    hullHp: number = 2500,
    coreHp: number = 1500
  ) {
    super(x, y, 260, 130);
    this.archetype = archetype;
    this.initialX = x;
    this.initialY = y;
    this.targetX = x;
    this.targetY = y;
    
    this.maxHullHp = hullHp;
    this.hullHp = hullHp;
    this.maxCoreHp = coreHp;
    this.coreHp = coreHp;
    
    // Total baseline HP
    this.maxHp = hullHp + coreHp;
    this.hp = this.maxHp;
    
    this.faction = Faction.INVADER;
    this.setupArchetypeColors();
  }

  private setupArchetypeColors(): void {
    switch (this.archetype) {
      case CrisisArchetype.VOID_SOVEREIGN:
        this.color = '#c084fc';
        break;
      case CrisisArchetype.ABYSSAL_LEVIATHAN:
        this.color = '#10b981';
        break;
      case CrisisArchetype.CYBERNETIC_EXTERMINATOR:
        this.color = '#ef4444';
        break;
      case CrisisArchetype.CHRONO_DEVOURER:
        this.color = '#fbbf24';
        break;
      case CrisisArchetype.SOLARIS_COLOSSUS:
        this.color = '#f97316';
        break;
      case CrisisArchetype.NEBULA_PHANTASM:
        this.color = '#6366f1';
        break;
      case CrisisArchetype.BIOMORPHIC_SWARM:
        this.color = '#b91c1c';
        break;
      case CrisisArchetype.SINGULARITY_CORE:
        this.color = '#09090b';
        break;
      case CrisisArchetype.NANITE_HARVESTER:
        this.color = '#94a3b8';
        break;
      case CrisisArchetype.PSIONIC_SHROUD:
        this.color = '#7c3aed';
        break;
      case CrisisArchetype.GLACIAL_OBLIVION:
        this.color = '#38bdf8';
        break;
      case CrisisArchetype.COSMIC_DEVOURER:
        this.color = '#18181b';
        break;
    }
  }

  public getCoreCenter(): Vector2D {
    return {
      x: this.position.x + this.size.width / 2,
      y: this.position.y + this.size.height / 2 + 10,
    };
  }

  public getLeftWeaponMuzzle(): Vector2D {
    return {
      x: this.position.x + 35,
      y: this.position.y + this.size.height - 15,
    };
  }

  public getRightWeaponMuzzle(): Vector2D {
    return {
      x: this.position.x + this.size.width - 35,
      y: this.position.y + this.size.height - 15,
    };
  }

  public setPhase(newPhase: CrisisPhase): void {
    this.phase = newPhase;
    if (newPhase === CrisisPhase.PHASE_1_SHIELD) {
      this.isInvulnerable = true;
    } else if (newPhase === CrisisPhase.PHASE_2_HULL) {
      this.isInvulnerable = false;
    } else if (newPhase === CrisisPhase.PHASE_3_CORE) {
      this.isInvulnerable = false;
      this.enrageTimer = this.enrageMaxTime;
    } else if (newPhase === CrisisPhase.DEFEATED) {
      this.isInvulnerable = false;
      this.isDead = true;
    }
  }

  public takeDamage(amount: number, _piercing?: number): number {
    if (this.isDead || this.phase === CrisisPhase.INCURSION || this.phase === CrisisPhase.DEFEATED) {
      return 0;
    }

    if (this.isInvulnerable || this.phase === CrisisPhase.PHASE_1_SHIELD) {
      // Deflected by dimensional barrier
      this.shieldFlashTimer = 0.12;
      return 0;
    }

    this.flashTimer = 0.08;

    if (this.phase === CrisisPhase.PHASE_2_HULL) {
      const actualDmg = Math.min(this.hullHp, amount);
      this.hullHp -= actualDmg;
      this.hp = this.hullHp + this.coreHp;

      if (this.hullHp <= 0) {
        this.hullHp = 0;
        this.setPhase(CrisisPhase.PHASE_3_CORE);
      }
      return actualDmg;
    }

    if (this.phase === CrisisPhase.PHASE_3_CORE) {
      const actualDmg = Math.min(this.coreHp, amount);
      this.coreHp -= actualDmg;
      this.hp = this.coreHp;

      if (this.coreHp <= 0) {
        this.coreHp = 0;
        this.hp = 0;
        this.setPhase(CrisisPhase.DEFEATED);
      }
      return actualDmg;
    }

    return 0;
  }

  public update(deltaTime: number, playerPosition?: Vector2D): void {
    if (this.isDead && this.phase === CrisisPhase.DEFEATED) return;

    this.floatTime += deltaTime;
    this.pulsePhase += deltaTime * (this.phase === CrisisPhase.PHASE_3_CORE ? 6.0 : 3.0);
    this.shieldRotationAngle += deltaTime * 1.5;

    if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    if (this.shieldFlashTimer > 0) this.shieldFlashTimer -= deltaTime;

    // Smooth hover / sweeping movement
    const sweepAmpX = this.phase === CrisisPhase.PHASE_3_CORE ? 45 : 30;
    const sweepAmpY = 12;
    const sweepSpeed = this.phase === CrisisPhase.PHASE_3_CORE ? 1.4 : 0.8;
    
    this.position.x = this.initialX + Math.sin(this.floatTime * sweepSpeed) * sweepAmpX;
    this.position.y = this.initialY + Math.cos(this.floatTime * sweepSpeed * 1.2) * sweepAmpY;

    // Track player with central eye / targeting optic
    if (playerPosition) {
      const core = this.getCoreCenter();
      this.eyeAngle = Math.atan2(playerPosition.y - core.y, playerPosition.x - core.x);
    }

    // Phase 3 Enrage Countdown
    if (this.phase === CrisisPhase.PHASE_3_CORE && this.enrageTimer > 0) {
      this.enrageTimer -= deltaTime;
      if (this.enrageTimer <= 0) {
        this.enrageTimer = 0;
        // Enrage triggered - reality distortion surges
        this.realityDistortionLevel = 1.0;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDead && this.phase === CrisisPhase.DEFEATED) return;

    ctx.save();

    // 1. Draw Archetype-Specific Vector Art Hull
    switch (this.archetype) {
      case CrisisArchetype.VOID_SOVEREIGN:
        this.drawVoidSovereign(ctx);
        break;
      case CrisisArchetype.ABYSSAL_LEVIATHAN:
        this.drawAbyssalLeviathan(ctx);
        break;
      case CrisisArchetype.CYBERNETIC_EXTERMINATOR:
        this.drawCyberneticExterminator(ctx);
        break;
      case CrisisArchetype.CHRONO_DEVOURER:
        this.drawChronoDevourer(ctx);
        break;
      case CrisisArchetype.SOLARIS_COLOSSUS:
        this.drawSolarisColossus(ctx);
        break;
      case CrisisArchetype.NEBULA_PHANTASM:
        this.drawNebulaPhantasm(ctx);
        break;
      case CrisisArchetype.BIOMORPHIC_SWARM:
        this.drawBiomorphicSwarm(ctx);
        break;
      case CrisisArchetype.SINGULARITY_CORE:
        this.drawSingularityCore(ctx);
        break;
      case CrisisArchetype.NANITE_HARVESTER:
        this.drawNaniteHarvester(ctx);
        break;
      case CrisisArchetype.PSIONIC_SHROUD:
        this.drawPsionicShroud(ctx);
        break;
      case CrisisArchetype.GLACIAL_OBLIVION:
        this.drawGlacialOblivion(ctx);
        break;
      case CrisisArchetype.COSMIC_DEVOURER:
        this.drawCosmicDevourer(ctx);
        break;
    }

    // 2. Draw Hex-Barrier Deflection Matrix if Shielded (drawn ON TOP of the hull)
    if (this.isInvulnerable || this.phase === CrisisPhase.PHASE_1_SHIELD) {
      this.drawHexDeflectorBarrier(ctx);
    }

    // 3. Draw Enrage Cosmic Distortion Aura if in Phase 3
    if (this.phase === CrisisPhase.PHASE_3_CORE) {
      this.drawPhase3CoreAura(ctx);
    }

    ctx.restore();
  }

  /**
   * Archetype 1: THE VOID SOVEREIGN
   * Extra-dimensional crystalline void dreadnought with dark purple armor, energy conduits, and singularity eye.
   */
  private drawVoidSovereign(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    // Glowing Aura Underlay
    const outerAura = ctx.createRadialGradient(cx, cy, 30, cx, cy, 140);
    outerAura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.4)' : 'rgba(147, 51, 234, 0.35)');
    outerAura.addColorStop(0.7, 'rgba(79, 70, 229, 0.15)');
    outerAura.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = outerAura;
    ctx.fillRect(x - 40, y - 40, w + 80, h + 80);

    // Floating Psionic Rift Spikes (Left & Right Flanks)
    const spikeFloat = Math.sin(this.floatTime * 3) * 6;
    ctx.fillStyle = isFlashing ? '#ffffff' : '#7e22ce';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;

    // Left Psionic Crystal
    ctx.beginPath();
    ctx.moveTo(x - 22, cy + spikeFloat);
    ctx.lineTo(x - 8, cy - 25 + spikeFloat);
    ctx.lineTo(x + 5, cy + spikeFloat);
    ctx.lineTo(x - 8, cy + 25 + spikeFloat);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Psionic Crystal
    ctx.beginPath();
    ctx.moveTo(x + w + 22, cy - spikeFloat);
    ctx.lineTo(x + w + 8, cy - 25 - spikeFloat);
    ctx.lineTo(x + w - 5, cy - spikeFloat);
    ctx.lineTo(x + w + 8, cy + 25 - spikeFloat);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Main Crystalline Void Hull
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1e1b4b';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#a855f7';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(cx, y); // Top apex
    ctx.lineTo(cx + 60, y + 18);
    ctx.lineTo(cx + 120, y + 45); // Right upper wing tip
    ctx.lineTo(cx + 130, y + 85); // Right outer fin
    ctx.lineTo(cx + 90, y + 120); // Right lower thruster
    ctx.lineTo(cx + 45, y + 95);  // Right inner notch
    ctx.lineTo(cx, y + 130);      // Bottom central keel
    ctx.lineTo(cx - 45, y + 95);  // Left inner notch
    ctx.lineTo(cx - 90, y + 120); // Left lower thruster
    ctx.lineTo(cx - 130, y + 85); // Left outer fin
    ctx.lineTo(cx - 120, y + 45); // Left upper wing tip
    ctx.lineTo(cx - 60, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Armor Layer (Deep Violet Shards)
    ctx.fillStyle = isFlashing ? '#fed7aa' : '#3b0764';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(cx, y + 15);
    ctx.lineTo(cx + 45, y + 30);
    ctx.lineTo(cx + 80, y + 65);
    ctx.lineTo(cx + 35, y + 80);
    ctx.lineTo(cx, y + 105);
    ctx.lineTo(cx - 35, y + 80);
    ctx.lineTo(cx - 80, y + 65);
    ctx.lineTo(cx - 45, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Conduit Lines
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Left conduit
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx - 50, cy - 10);
    ctx.lineTo(cx - 100, cy + 15);
    // Right conduit
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx + 50, cy - 10);
    ctx.lineTo(cx + 100, cy + 15);
    ctx.stroke();

    // Central Singularity Eye
    this.drawSingularityEye(ctx, cx, cy + 10, '#ec4899', '#c084fc');
  }

  /**
   * Archetype 2: THE ABYSSAL LEVIATHAN
   * Corrupted apex bio-mechanical kraken with chitin carapaces, toxic sacs, and waving tendrils.
   */
  private drawAbyssalLeviathan(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    // Waving Spore Tendril Appendages (Procedural Sine Waves)
    const tendrilCount = 6;
    for (let i = 0; i < tendrilCount; i++) {
      const offsetX = (i - 2.5) * 42;
      const startX = cx + offsetX;
      const startY = y + h - 15;
      const tSpeed = 2.5 + i * 0.3;
      const waveX = Math.sin(this.floatTime * tSpeed + i) * 16;
      
      ctx.strokeStyle = isFlashing ? '#ffffff' : '#047857';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + waveX, startY + 25, startX + waveX * 1.5, startY + 50);
      ctx.stroke();

      // Bio-luminescent bulb on tendril tip
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(startX + waveX * 1.5, startY + 50, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer Chitin Carapace (Abyssal Emerald)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#022c22';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#10b981';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(cx, y + 5);
    ctx.bezierCurveTo(cx + 80, y - 5, cx + 130, y + 35, cx + 125, y + 80);
    ctx.bezierCurveTo(cx + 110, y + 115, cx + 60, y + 110, cx + 20, y + 125);
    ctx.lineTo(cx, y + 115);
    ctx.lineTo(cx - 20, y + 125);
    ctx.bezierCurveTo(cx - 60, y + 110, cx - 110, y + 115, cx - 125, y + 80);
    ctx.bezierCurveTo(cx - 130, y + 35, cx - 80, y - 5, cx, y + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Segmented Inner Carapace Ribs
    ctx.fillStyle = isFlashing ? '#bbf7d0' : '#064e3b';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;

    for (let r = 0; r < 3; r++) {
      const ribY = y + 25 + r * 24;
      const ribW = 85 - r * 18;
      ctx.beginPath();
      ctx.ellipse(cx, ribY, ribW, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Toxic Bio-Luminescent Glands
    const glandPulse = 0.8 + Math.sin(this.pulsePhase) * 0.2;
    ctx.fillStyle = `rgba(132, 204, 22, ${glandPulse})`;
    ctx.beginPath();
    ctx.arc(cx - 65, cy, 10, 0, Math.PI * 2);
    ctx.arc(cx + 65, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Central Leviathan Apex Maw / Multi-Eye Cluster
    this.drawSingularityEye(ctx, cx, cy + 8, '#84cc16', '#10b981');
  }

  /**
   * Archetype 3: THE CYBERNETIC EXTERMINATOR
   * Sentient rogue purification AI dreadnought with dark titanium plating, dual heavy railguns, and optic sensors.
   */
  private drawCyberneticExterminator(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    // Dual Heavy Orbital Railgun Barrels (Left & Right Sponsons)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;

    // Left Railgun
    ctx.fillRect(x + 20, y + 40, 16, 85);
    ctx.strokeRect(x + 20, y + 40, 16, 85);
    // Left Railgun Muzzle Glow
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 22, y + 120, 12, 6);

    // Right Railgun
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
    ctx.fillRect(x + w - 36, y + 40, 16, 85);
    ctx.strokeRect(x + w - 36, y + 40, 16, 85);
    // Right Railgun Muzzle Glow
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + w - 34, y + 120, 12, 6);

    // Main Titanium Hull Plating (Angled Hexagonal Fortress)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#0f172a';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#f97316';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + 60, y);
    ctx.lineTo(cx + 125, y + 45);
    ctx.lineTo(cx + 120, y + 105);
    ctx.lineTo(cx + 70, y + 105);
    ctx.lineTo(cx + 45, y + 125);
    ctx.lineTo(cx - 45, y + 125);
    ctx.lineTo(cx - 70, y + 105);
    ctx.lineTo(cx - 120, y + 105);
    ctx.lineTo(cx - 125, y + 45);
    ctx.lineTo(cx - 60, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hazard Stripes & Industrial Decals
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.rect(cx - 40, y + 15, 80, 8);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    for (let s = -35; s < 35; s += 16) {
      ctx.beginPath();
      ctx.moveTo(cx + s, y + 15);
      ctx.lineTo(cx + s + 8, y + 15);
      ctx.lineTo(cx + s, y + 23);
      ctx.lineTo(cx + s - 8, y + 23);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Cooling Vents & Heat Sinks
    ctx.fillStyle = '#334155';
    for (let v = 0; v < 4; v++) {
      ctx.fillRect(cx - 60, y + 35 + v * 12, 30, 6);
      ctx.fillRect(cx + 30, y + 35 + v * 12, 30, 6);
    }

    // Central AI Core Optic Sensor
    this.drawSingularityEye(ctx, cx, cy + 12, '#ef4444', '#06b6d4');
  }

  /**
   * Central Pulsating Core / Singularity Eye
   */
  private drawSingularityEye(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    glowColor: string,
    accentColor: string
  ): void {
    const pulse = 1.0 + Math.sin(this.pulsePhase) * 0.12;
    const baseRadius = 22 * pulse;

    // Outer Corona Gradient
    const corona = ctx.createRadialGradient(cx, cy, 5, cx, cy, baseRadius * 1.8);
    corona.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    corona.addColorStop(0.3, glowColor);
    corona.addColorStop(0.7, accentColor);
    corona.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Outer Armor Iris Rim
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Dark Singularity Event Horizon
    ctx.fillStyle = '#02010a';
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Pupil looking toward target / player
    const lookDist = 5;
    const pupilX = cx + Math.cos(this.eyeAngle) * lookDist;
    const pupilY = cy + Math.sin(this.eyeAngle) * lookDist;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Phase 1 Hex-Barrier Deflection Shield Visuals
   */
  private drawHexDeflectorBarrier(ctx: CanvasRenderingContext2D): void {
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    const shieldRadius = 150;
    const isHit = this.shieldFlashTimer > 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.shieldRotationAngle);

    // Glowing Barrier Perimeter
    const shieldGrad = ctx.createRadialGradient(0, 0, shieldRadius * 0.7, 0, 0, shieldRadius);
    if (isHit) {
      shieldGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      shieldGrad.addColorStop(0.8, 'rgba(239, 68, 68, 0.7)');
      shieldGrad.addColorStop(1, 'rgba(239, 68, 68, 0.9)');
    } else {
      shieldGrad.addColorStop(0, 'rgba(147, 51, 234, 0.1)');
      shieldGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.25)');
      shieldGrad.addColorStop(1, 'rgba(192, 132, 252, 0.6)');
    }

    ctx.fillStyle = shieldGrad;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
    ctx.fill();

    // Hexagonal Grid Lines
    ctx.strokeStyle = isHit ? 'rgba(255, 255, 255, 0.8)' : 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;

    const numHex = 6;
    for (let h = 0; h < numHex; h++) {
      const angle = (h * Math.PI * 2) / numHex;
      ctx.save();
      ctx.rotate(angle);
      this.drawHexagon(ctx, 0, shieldRadius * 0.6, 26);
      ctx.restore();
    }

    ctx.restore();
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const hx = x + Math.cos(a) * r;
      const hy = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * Phase 3 Singularity Overdrive Cosmic Aura
   */
  private drawPhase3CoreAura(ctx: CanvasRenderingContext2D): void {
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    const pulse = Math.sin(this.pulsePhase * 2) * 20;

    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 140 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 165 - pulse * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Render Top HUD Multi-Segment Boss Bar
   */
  public drawBossHUD(ctx: CanvasRenderingContext2D, screenWidth: number): void {
    if (this.isDead && this.phase === CrisisPhase.DEFEATED) return;

    ctx.save();
    const barWidth = Math.min(500, screenWidth - 40);
    const barHeight = 12;
    const barX = (screenWidth - barWidth) / 2;
    const barY = 28;

    // Archetype Title Banner
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    
    let title = '✦ THE VOID SOVEREIGN ✦';
    let sub = 'EXTRA-DIMENSIONAL CATACLYSM';
    let primaryCol = '#ef4444';
    let accentCol = '#f97316';
    if (this.archetype === CrisisArchetype.ABYSSAL_LEVIATHAN) {
      title = '✦ THE ABYSSAL LEVIATHAN ✦';
      sub = 'CORRUPTED BIO-SWARM HORROR';
      primaryCol = '#10b981';
      accentCol = '#34d399';
    } else if (this.archetype === CrisisArchetype.CYBERNETIC_EXTERMINATOR) {
      title = '✦ CYBERNETIC EXTERMINATOR MATRIX ✦';
      sub = 'PURIFICATION DREADNOUGHT PROTOCOL';
      primaryCol = '#ef4444';
      accentCol = '#f97316';
    } else if (this.archetype === CrisisArchetype.CHRONO_DEVOURER) {
      title = '✦ THE CHRONO DEVOURER ✦';
      sub = 'TEMPORAL PARADOX HARBINGER';
      primaryCol = '#fbbf24';
      accentCol = '#fef08a';
    } else if (this.archetype === CrisisArchetype.SOLARIS_COLOSSUS) {
      title = '✦ SOLARIS COLOSSUS ✦';
      sub = 'STELLAR HYPERGIANT DREADNOUGHT';
      primaryCol = '#f97316';
      accentCol = '#ef4444';
    } else if (this.archetype === CrisisArchetype.NEBULA_PHANTASM) {
      title = '✦ THE NEBULA PHANTASM ✦';
      sub = 'QUANTUM SPECTRAL SWARM';
      primaryCol = '#6366f1';
      accentCol = '#06b6d4';
    } else if (this.archetype === CrisisArchetype.BIOMORPHIC_SWARM) {
      title = '✦ THE BIOMORPHIC SWARM ✦';
      sub = 'EXTRAGALACTIC CHITIN FLESH-HIVE';
      primaryCol = '#b91c1c';
      accentCol = '#f59e0b';
    } else if (this.archetype === CrisisArchetype.SINGULARITY_CORE) {
      title = '✦ THE SINGULARITY CORE ✦';
      sub = 'SUPERMASSIVE EVENT HORIZON ENTITY';
      primaryCol = '#8b5cf6';
      accentCol = '#ffffff';
    } else if (this.archetype === CrisisArchetype.NANITE_HARVESTER) {
      title = '✦ NANITE HARVESTER NEXUS ✦';
      sub = 'GREY-GOO MOLECULAR DISASSEMBLER';
      primaryCol = '#94a3b8';
      accentCol = '#14b8a6';
    } else if (this.archetype === CrisisArchetype.PSIONIC_SHROUD) {
      title = '✦ THE PSIONIC SHROUD ✦';
      sub = 'EXTRA-DIMENSIONAL ASTRAL INMATE';
      primaryCol = '#7c3aed';
      accentCol = '#d946ef';
    } else if (this.archetype === CrisisArchetype.GLACIAL_OBLIVION) {
      title = '✦ GLACIAL OBLIVION ✦';
      sub = 'ABSOLUTE ZERO ENTROPIC ENGINE';
      primaryCol = '#38bdf8';
      accentCol = '#f0f9ff';
    } else if (this.archetype === CrisisArchetype.COSMIC_DEVOURER) {
      title = '✦ THE COSMIC DEVOURER ✦';
      sub = 'ASTRAL VOID DRAGON BEHEMOTH';
      primaryCol = '#d97706';
      accentCol = '#dc2626';
    }

    ctx.fillText(`${title} — ${sub}`, screenWidth / 2, barY - 8);

    // Background track
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Segment 1: Phase 1 Shield / Phase 2 Hull / Phase 3 Core
    if (this.phase === CrisisPhase.PHASE_1_SHIELD) {
      if (this.archetype === CrisisArchetype.VOID_SOVEREIGN) {
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#38bdf8';
      } else {
        ctx.fillStyle = primaryCol;
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = accentCol;
      }
      const shimmer = (Math.sin(this.floatTime * 4) + 1) / 2;
      ctx.fillRect(barX, barY, barWidth * shimmer, barHeight);
    } else if (this.phase === CrisisPhase.PHASE_2_HULL) {
      const hullRatio = Math.max(0, Math.min(1, this.hullHp / this.maxHullHp));
      ctx.fillStyle = primaryCol;
      ctx.fillRect(barX, barY, barWidth * hullRatio, barHeight);
    } else if (this.phase === CrisisPhase.PHASE_3_CORE) {
      const coreRatio = Math.max(0, Math.min(1, this.coreHp / this.maxCoreHp));
      ctx.fillStyle = accentCol;
      ctx.fillRect(barX, barY, barWidth * coreRatio, barHeight);
    }

    // Outer border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Phase Badge text
    ctx.font = '10px monospace';
    ctx.fillStyle = '#fef08a';
    let phaseText = 'PHASE 1: DIMENSIONAL SHIELD MATRIX';
    if (this.phase === CrisisPhase.PHASE_2_HULL) phaseText = 'PHASE 2: DREADNOUGHT HULL EXPOSED';
    else if (this.phase === CrisisPhase.PHASE_3_CORE) {
      phaseText = `PHASE 3: CORE OVERDRIVE (${Math.ceil(this.enrageTimer)}s)`;
    }
    ctx.fillText(phaseText, screenWidth / 2, barY + barHeight + 14);

    ctx.restore();
  }

  /**
   * Vector Drawing: Archetype 4 — THE CHRONO DEVOURER
   * Astrolabe-shaped temporal dreadnought with concentric rotating brass gears, stepped pylons, and pendulum optic.
   */
  private drawChronoDevourer(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    ctx.save();

    // 1. Golden Tachyon Distortion Aura
    const aura = ctx.createRadialGradient(cx, cy, 25, cx, cy, 145);
    aura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.45)' : 'rgba(251, 191, 36, 0.35)');
    aura.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
    aura.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(x - 40, y - 40, w + 80, h + 80);

    // 2. Concentric Rotating Brass Gear Rings
    const gearRadii = [36, 50, 64];
    const gearSpeeds = [1.5, -1.2, 0.8];
    const gearTeeth = [8, 12, 16];
    for (let g = 0; g < 3; g++) {
      ctx.save();
      ctx.translate(cx, cy + 10);
      ctx.rotate(this.floatTime * gearSpeeds[g]);
      ctx.strokeStyle = g === 1 ? '#d97706' : '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, gearRadii[g], 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      for (let t = 0; t < gearTeeth[g]; t++) {
        const a = (t * Math.PI * 2) / gearTeeth[g];
        ctx.fillRect(Math.cos(a) * gearRadii[g] - 2, Math.sin(a) * gearRadii[g] - 2, 4, 4);
      }
      ctx.restore();
    }

    // 3. Stepped Pyramid Wing Pylons (Left & Right)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#78350f';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.0;

    // Left Stepped Pylon
    for (let s = 0; s < 3; s++) {
      const stepW = 32 - s * 8;
      const stepH = 14;
      const stepX = x + 12 + s * 4;
      const stepY = cy - 20 + s * 16;
      ctx.fillRect(stepX, stepY, stepW, stepH);
      ctx.strokeRect(stepX, stepY, stepW, stepH);
    }

    // Right Stepped Pylon
    for (let s = 0; s < 3; s++) {
      const stepW = 32 - s * 8;
      const stepH = 14;
      const stepX = x + w - 44 - s * 4;
      const stepY = cy - 20 + s * 16;
      ctx.fillRect(stepX, stepY, stepW, stepH);
      ctx.strokeRect(stepX, stepY, stepW, stepH);
    }

    // 4. Main Astrolabe Dreadnought Hull
    ctx.fillStyle = isFlashing ? '#ffffff' : '#451a03';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#fbbf24';
    ctx.lineWidth = 3.0;

    ctx.beginPath();
    ctx.moveTo(cx, y); // Central top apex
    ctx.lineTo(cx + 50, y + 16);
    ctx.lineTo(cx + 122, y + 50); // Right wing tip
    ctx.lineTo(cx + 128, y + 90);
    ctx.lineTo(cx + 85, y + 115);
    ctx.lineTo(cx + 40, y + 95);
    ctx.lineTo(cx, y + 128);      // Keel
    ctx.lineTo(cx - 40, y + 95);
    ctx.lineTo(cx - 85, y + 115);
    ctx.lineTo(cx - 128, y + 90);
    ctx.lineTo(cx - 122, y + 50); // Left wing tip
    ctx.lineTo(cx - 50, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Central Chronal Astrolabe Iris & Pendulum Optic
    const coreGrad = ctx.createRadialGradient(cx, cy + 10, 4, cx, cy + 10, 24);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#fef08a');
    coreGrad.addColorStop(0.8, '#f59e0b');
    coreGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Pupil looking toward player
    const pupilX = cx + Math.cos(this.eyeAngle) * 5;
    const pupilY = cy + 10 + Math.sin(this.eyeAngle) * 5;
    ctx.fillStyle = '#02010a';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX - 1, pupilY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Vector Drawing: Archetype 5 — SOLARIS COLOSSUS
   * Stellar hypergiant dreadnought with obsidian basalt plates, prominence horns, and thermonuclear furnace core.
   */
  private drawSolarisColossus(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    ctx.save();

    // 1. Thermonuclear Heat Aura
    const heatAura = ctx.createRadialGradient(cx, cy + 10, 30, cx, cy + 10, 150);
    heatAura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.5)' : 'rgba(249, 115, 22, 0.45)');
    heatAura.addColorStop(0.6, 'rgba(239, 68, 68, 0.2)');
    heatAura.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = heatAura;
    ctx.fillRect(x - 45, y - 45, w + 90, h + 90);

    // 2. Solar Prominence Horns (Curving outward and up)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#f97316';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;

    // Left Horn
    ctx.beginPath();
    ctx.moveTo(cx - 25, y + 15);
    ctx.quadraticCurveTo(cx - 70, y - 20, cx - 85, y - 10);
    ctx.quadraticCurveTo(cx - 65, y + 15, cx - 35, y + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Horn
    ctx.beginPath();
    ctx.moveTo(cx + 25, y + 15);
    ctx.quadraticCurveTo(cx + 70, y - 20, cx + 85, y - 10);
    ctx.quadraticCurveTo(cx + 65, y + 15, cx + 35, y + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Main Basalt Obsidian Juggernaut Hull
    ctx.fillStyle = isFlashing ? '#ffffff' : '#2d1305';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#f97316';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(cx, y + 5);
    ctx.lineTo(cx + 65, y + 5);
    ctx.lineTo(cx + 130, y + 42); // Flared wing tip
    ctx.lineTo(cx + 125, y + 95);
    ctx.lineTo(cx + 75, y + 105);
    ctx.lineTo(cx + 45, y + 128); // Bottom keel
    ctx.lineTo(cx - 45, y + 128);
    ctx.lineTo(cx - 75, y + 105);
    ctx.lineTo(cx - 125, y + 95);
    ctx.lineTo(cx - 130, y + 42); // Left wing tip
    ctx.lineTo(cx - 65, y + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Molten Heat Radiator Slots
    ctx.fillStyle = '#ef4444';
    for (let r = 0; r < 4; r++) {
      const ry = y + 35 + r * 14;
      ctx.fillRect(cx - 95, ry, 26, 6);
      ctx.fillRect(cx + 69, ry, 26, 6);
    }

    // 5. Central Thermonuclear Fusion Furnace Eye
    const furnaceGrad = ctx.createRadialGradient(cx, cy + 12, 3, cx, cy + 12, 26);
    furnaceGrad.addColorStop(0, '#ffffff');
    furnaceGrad.addColorStop(0.3, '#fef08a');
    furnaceGrad.addColorStop(0.7, '#f97316');
    furnaceGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = furnaceGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 24, 0, Math.PI * 2);
    ctx.fill();

    // Corona flares
    const flarePulse = Math.sin(this.pulsePhase * 3) * 4;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 26 + flarePulse, 0, Math.PI * 2);
    ctx.stroke();

    // Pupil
    const pupilX = cx + Math.cos(this.eyeAngle) * 6;
    const pupilY = cy + 12 + Math.sin(this.eyeAngle) * 6;
    ctx.fillStyle = '#02010a';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 3.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Vector Drawing: Archetype 6 — THE NEBULA PHANTASM
   * Quantum spectral swarm dreadnought with phantom manta-ray silhouette, mist tendrils, and triple-pupil optic.
   */
  private drawNebulaPhantasm(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    ctx.save();

    // 1. Quantum Mist Aura
    const mistAura = ctx.createRadialGradient(cx, cy, 25, cx, cy, 145);
    mistAura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.45)' : 'rgba(99, 102, 241, 0.35)');
    mistAura.addColorStop(0.6, 'rgba(6, 182, 212, 0.15)');
    mistAura.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = mistAura;
    ctx.fillRect(x - 40, y - 40, w + 80, h + 80);

    // 2. Trailing Undulating Quantum Mist Tendrils
    for (let t = 0; t < 5; t++) {
      const offsetX = (t - 2) * 38;
      const startX = cx + offsetX;
      const startY = y + h - 18;
      const wave = Math.sin(this.floatTime * 3.2 + t) * 14;
      ctx.strokeStyle = t % 2 === 0 ? 'rgba(6, 182, 212, 0.7)' : 'rgba(217, 70, 239, 0.7)';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + wave, startY + 28, startX + wave * 1.5, startY + 54);
      ctx.stroke();

      // Mist mote on tip
      ctx.fillStyle = t % 2 === 0 ? '#06b6d4' : '#d946ef';
      ctx.beginPath();
      ctx.arc(startX + wave * 1.5, startY + 54, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Spectral Manta-Ray Hull Silhouette
    ctx.fillStyle = isFlashing ? '#ffffff' : '#0b0f19';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#6366f1';
    ctx.lineWidth = 3.0;

    ctx.beginPath();
    ctx.moveTo(cx, y + 6);
    ctx.bezierCurveTo(cx + 65, y, cx + 135, y + 38, cx + 128, y + 80);
    ctx.bezierCurveTo(cx + 105, y + 115, cx + 55, y + 105, cx, y + 126);
    ctx.bezierCurveTo(cx - 55, y + 105, cx - 105, y + 115, cx - 128, y + 80);
    ctx.bezierCurveTo(cx - 135, y + 38, cx - 65, y, cx, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Crystalline Refractive Shield Facets
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.6;
    for (let f = 0; f < 3; f++) {
      const fY = y + 26 + f * 22;
      const fW = 75 - f * 16;
      ctx.beginPath();
      ctx.ellipse(cx, fY, fW, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Triple-Pupil Spectral Optic Cluster
    const eyeOffsets = [-22, 0, 22];
    for (let e = 0; e < 3; e++) {
      const eyeX = cx + eyeOffsets[e];
      const eyeY = cy + 8;
      const eyeRadius = e === 1 ? 12 : 9;

      // Eye background
      ctx.fillStyle = '#02010a';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Iris
      ctx.strokeStyle = e === 1 ? '#d946ef' : '#06b6d4';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Tracking pupil
      const px = eyeX + Math.cos(this.eyeAngle) * 3;
      const py = eyeY + Math.sin(this.eyeAngle) * 3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, e === 1 ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Vector Drawing: Archetype 7 — THE BIOMORPHIC SWARM
   * Extragalactic chitin flesh-hive with segmented insectoid carapace, outward-curving dorsal mandibles,
   * glandular pods, glowing crimson/bile veins, and bio-plasmid central core.
   */
  private drawBiomorphicSwarm(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    ctx.save();

    // 1. Biological Hive Heat Aura
    const bioAura = ctx.createRadialGradient(cx, cy + 10, 25, cx, cy + 10, 140);
    bioAura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.45)' : 'rgba(185, 28, 28, 0.35)');
    bioAura.addColorStop(0.6, 'rgba(132, 204, 22, 0.18)');
    bioAura.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = bioAura;
    ctx.fillRect(x - 30, y - 30, w + 60, h + 60);

    // 2. Outward-Curving Dorsal Mandibles (Razor Chitin Scythes)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#450a0a';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 2.5;

    // Left Mandible
    ctx.beginPath();
    ctx.moveTo(cx - 30, y + 25);
    ctx.quadraticCurveTo(cx - 85, y - 5, cx - 125, y + 10);
    ctx.quadraticCurveTo(cx - 100, y + 35, cx - 45, y + 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Mandible
    ctx.beginPath();
    ctx.moveTo(cx + 30, y + 25);
    ctx.quadraticCurveTo(cx + 85, y - 5, cx + 125, y + 10);
    ctx.quadraticCurveTo(cx + 100, y + 35, cx + 45, y + 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Segmented Insectoid Carapace (Triple-Tiered Chitin Hull)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#2b0606';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#b91c1c';
    ctx.lineWidth = 3.0;

    // Main Thorax Shell
    ctx.beginPath();
    ctx.moveTo(cx, y + 6);
    ctx.lineTo(cx + 55, y + 18);
    ctx.lineTo(cx + 125, y + 48);
    ctx.lineTo(cx + 118, y + 82);
    ctx.lineTo(cx + 80, y + 102);
    ctx.lineTo(cx + 35, y + 125);
    ctx.lineTo(cx, y + 128);
    ctx.lineTo(cx - 35, y + 125);
    ctx.lineTo(cx - 80, y + 102);
    ctx.lineTo(cx - 118, y + 82);
    ctx.lineTo(cx - 125, y + 48);
    ctx.lineTo(cx - 55, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Segment Plates (Transverse Chitin Grooves)
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 2.0;
    for (let s = 1; s <= 3; s++) {
      const segY = y + 26 + s * 22;
      const segW = 100 - s * 20;
      ctx.beginPath();
      ctx.moveTo(cx - segW, segY);
      ctx.quadraticCurveTo(cx, segY + 8, cx + segW, segY);
      ctx.stroke();
    }

    // 4. Glowing Crimson/Bile Veins
    ctx.strokeStyle = isFlashing ? '#ffffff' : '#84cc16';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    // Left vein network
    ctx.moveTo(cx - 20, cy + 10);
    ctx.lineTo(cx - 55, cy - 5);
    ctx.lineTo(cx - 90, cy - 15);
    ctx.moveTo(cx - 55, cy - 5);
    ctx.lineTo(cx - 75, cy + 20);
    // Right vein network
    ctx.moveTo(cx + 20, cy + 10);
    ctx.lineTo(cx + 55, cy - 5);
    ctx.lineTo(cx + 90, cy - 15);
    ctx.moveTo(cx + 55, cy - 5);
    ctx.lineTo(cx + 75, cy + 20);
    ctx.stroke();

    // 5. Four Pulsing Glandular Pods
    const podPulse = Math.sin(this.pulsePhase * 3) * 2;
    const podOffsets = [
      { ox: -75, oy: -10, r: 8 },
      { ox: -65, oy: 22, r: 7 },
      { ox: 75, oy: -10, r: 8 },
      { ox: 65, oy: 22, r: 7 },
    ];
    for (const pod of podOffsets) {
      const px = cx + pod.ox;
      const py = cy + pod.oy;
      const pr = pod.r + podPulse;

      const podGrad = ctx.createRadialGradient(px, py, 1, px, py, pr);
      podGrad.addColorStop(0, '#ffffff');
      podGrad.addColorStop(0.3, '#84cc16');
      podGrad.addColorStop(0.8, '#f59e0b');
      podGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = podGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 6. Central Bio-Plasmid Maw / Singularity Eye
    this.drawSingularityEye(ctx, cx, cy + 10, '#84cc16', '#f59e0b');

    ctx.restore();
  }

  /**
   * Vector Drawing: Archetype 8 — THE SINGULARITY CORE
   * Supermassive event horizon entity with central opaque black sphere, 3 counter-rotating elliptical
   * accretion rings, relativistic violet corona, and monolithic magnetic compression pylons.
   */
  private drawSingularityCore(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    ctx.save();

    // 1. Relativistic Violet Corona Aura
    const coronaAura = ctx.createRadialGradient(cx, cy + 10, 20, cx, cy + 10, 150);
    coronaAura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.6)' : 'rgba(139, 92, 246, 0.45)');
    coronaAura.addColorStop(0.5, 'rgba(30, 27, 75, 0.3)');
    coronaAura.addColorStop(1, 'rgba(9, 9, 11, 0)');
    ctx.fillStyle = coronaAura;
    ctx.fillRect(x - 35, y - 35, w + 70, h + 70);

    // 2. Monolithic Magnetic Compression Pylons (Flanking Channellers)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#09090b';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#8b5cf6';
    ctx.lineWidth = 2.5;

    // Left Monolithic Pylon
    ctx.beginPath();
    ctx.moveTo(x + 10, cy - 45);
    ctx.lineTo(x + 48, cy - 30);
    ctx.lineTo(x + 55, cy + 40);
    ctx.lineTo(x + 18, cy + 55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Pylon Magnetic Coil Insets
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    for (let c = 0; c < 3; c++) {
      const coilY = cy - 20 + c * 20;
      ctx.beginPath();
      ctx.moveTo(x + 20, coilY);
      ctx.lineTo(x + 45, coilY + 6);
      ctx.stroke();
    }

    // Right Monolithic Pylon
    ctx.fillStyle = isFlashing ? '#ffffff' : '#09090b';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#8b5cf6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + w - 10, cy - 45);
    ctx.lineTo(x + w - 48, cy - 30);
    ctx.lineTo(x + w - 55, cy + 40);
    ctx.lineTo(x + w - 18, cy + 55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Pylon Magnetic Coil Insets
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    for (let c = 0; c < 3; c++) {
      const coilY = cy - 20 + c * 20;
      ctx.beginPath();
      ctx.moveTo(x + w - 20, coilY);
      ctx.lineTo(x + w - 45, coilY + 6);
      ctx.stroke();
    }

    // 3. Central Magnetic Arch / Frame
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1e1b4b';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx - 65, y + 15);
    ctx.quadraticCurveTo(cx, y - 5, cx + 65, y + 15);
    ctx.lineTo(cx + 55, y + 35);
    ctx.quadraticCurveTo(cx, y + 18, cx - 55, y + 35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Three Counter-Rotating Elliptical Accretion Rings
    const rings = [
      { rx: 96, ry: 32, speed: 0.85, rotOffset: 0.2, color: 'rgba(139, 92, 246, 0.8)', width: 2.4 },
      { rx: 80, ry: 24, speed: -1.2, rotOffset: -0.4, color: 'rgba(255, 255, 255, 0.85)', width: 2.0 },
      { rx: 64, ry: 16, speed: 1.6, rotOffset: 0.8, color: 'rgba(192, 132, 252, 0.75)', width: 1.8 },
    ];

    for (const ring of rings) {
      ctx.save();
      ctx.translate(cx, cy + 10);
      ctx.rotate(this.floatTime * ring.speed + ring.rotOffset);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width;
      ctx.beginPath();
      ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Accretion Particle Clustered on Ring
      const pAngle = this.floatTime * ring.speed * 2.5;
      const px = Math.cos(pAngle) * ring.rx;
      const py = Math.sin(pAngle) * ring.ry;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 5. Central Opaque Black Event Horizon Sphere
    const eventRadius = 35;
    // Photon Ring Glare
    const photonGrad = ctx.createRadialGradient(cx, cy + 10, eventRadius - 4, cx, cy + 10, eventRadius + 12);
    photonGrad.addColorStop(0, '#ffffff');
    photonGrad.addColorStop(0.4, '#8b5cf6');
    photonGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = photonGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 10, eventRadius + 12, 0, Math.PI * 2);
    ctx.fill();

    // Absolute Event Horizon (Zero Light)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy + 10, eventRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. Relativistic Singularity Optic / Gravitational Singularity Center
    const pupilX = cx + Math.cos(this.eyeAngle) * 6;
    const pupilY = cy + 10 + Math.sin(this.eyeAngle) * 6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Vector Drawing: Archetype 9 — NANITE HARVESTER NEXUS
   * Grey-goo molecular disassembler with tessellated floating polygonal chrome armor plates that shift and rotate,
   * circuit etching, and glowing circuit teal processor core.
   */
  private drawNaniteHarvester(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    ctx.save();

    // 1. Molecular Dissolution Aura
    const naniteAura = ctx.createRadialGradient(cx, cy + 10, 25, cx, cy + 10, 145);
    naniteAura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.5)' : 'rgba(20, 184, 166, 0.35)');
    naniteAura.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
    naniteAura.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = naniteAura;
    ctx.fillRect(x - 30, y - 30, w + 60, h + 60);

    // 2. Tessellated Floating Polygonal Chrome Plates
    const plates = [
      // Left Outer Chevron
      {
        poly: [[-126, 45], [-85, 10], [-55, 30], [-80, 75]],
        shiftX: Math.sin(this.floatTime * 2.2 + 0) * 4,
        shiftY: Math.cos(this.floatTime * 1.8 + 0) * 3,
      },
      // Right Outer Chevron
      {
        poly: [[126, 45], [85, 10], [55, 30], [80, 75]],
        shiftX: -Math.sin(this.floatTime * 2.2 + 1) * 4,
        shiftY: Math.cos(this.floatTime * 1.8 + 1) * 3,
      },
      // Left Mid Flank
      {
        poly: [[-78, 80], [-45, 35], [-15, 55], [-40, 110]],
        shiftX: Math.cos(this.floatTime * 2.5 + 2) * 3,
        shiftY: Math.sin(this.floatTime * 2.0 + 2) * 3,
      },
      // Right Mid Flank
      {
        poly: [[78, 80], [45, 35], [15, 55], [40, 110]],
        shiftX: -Math.cos(this.floatTime * 2.5 + 3) * 3,
        shiftY: Math.sin(this.floatTime * 2.0 + 3) * 3,
      },
      // Top Apex Prow
      {
        poly: [[0, 5], [45, 20], [0, 42], [-45, 20]],
        shiftX: 0,
        shiftY: Math.sin(this.floatTime * 3.0) * 2,
      },
      // Bottom Ventral Keel
      {
        poly: [[0, 95], [30, 126], [0, 128], [-30, 126]],
        shiftX: 0,
        shiftY: -Math.sin(this.floatTime * 2.8) * 2,
      },
    ];

    for (const p of plates) {
      ctx.save();
      ctx.translate(cx + p.shiftX, cy + p.shiftY);

      // Plate Body (Chrome Silver with Carbon Backing)
      ctx.fillStyle = isFlashing ? '#ffffff' : '#94a3b8';
      ctx.strokeStyle = isFlashing ? '#ef4444' : '#14b8a6';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(p.poly[0][0], p.poly[0][1]);
      for (let i = 1; i < p.poly.length; i++) {
        ctx.lineTo(p.poly[i][0], p.poly[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Circuit lines on plate
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const midX = (p.poly[0][0] + p.poly[2][0]) / 2;
      const midY = (p.poly[0][1] + p.poly[2][1]) / 2;
      ctx.moveTo(p.poly[0][0] * 0.7, p.poly[0][1] * 0.7);
      ctx.lineTo(midX, midY);
      ctx.lineTo(p.poly[1][0] * 0.8, p.poly[1][1] * 0.8);
      ctx.stroke();

      ctx.restore();
    }

    // 3. Central Hexagonal Frame & Chassis
    ctx.fillStyle = isFlashing ? '#ffffff' : '#0f172a';
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const hexRadius = 38;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hx = cx + Math.cos(angle) * hexRadius;
      const hy = cy + 10 + Math.sin(angle) * hexRadius;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Glowing Circuit Teal Processor Core
    const coreGrad = ctx.createRadialGradient(cx, cy + 10, 3, cx, cy + 10, 24);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#14b8a6');
    coreGrad.addColorStop(0.7, '#06b6d4');
    coreGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Processor Core Optic / Player Tracking
    const pupilX = cx + Math.cos(this.eyeAngle) * 5;
    const pupilY = cy + 10 + Math.sin(this.eyeAngle) * 5;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Vector Drawing: Archetype 10 — THE PSIONIC SHROUD
   * Extra-dimensional astral inmate with translucent crystalline crest, 6 undulating astral tendrils,
   * weeping telepathic ocular iris at center, and shimmering magenta/rose glow.
   */
  private drawPsionicShroud(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    ctx.save();

    // 1. Shimmering Magenta / Rose Astral Glow
    const astralAura = ctx.createRadialGradient(cx, cy + 10, 20, cx, cy + 10, 150);
    astralAura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.5)' : 'rgba(217, 70, 239, 0.4)');
    astralAura.addColorStop(0.5, 'rgba(251, 113, 133, 0.22)');
    astralAura.addColorStop(1, 'rgba(46, 16, 101, 0)');
    ctx.fillStyle = astralAura;
    ctx.fillRect(x - 30, y - 30, w + 60, h + 60);

    // 2. Six Undulating Astral Tendrils (Ventral Tentacles)
    const tendrilOffsets = [-95, -60, -25, 25, 60, 95];
    for (let i = 0; i < tendrilOffsets.length; i++) {
      const tox = cx + tendrilOffsets[i];
      const toy = y + 75;
      const wavePhase = this.floatTime * 3.0 + i * 1.1;
      const waveX = Math.sin(wavePhase) * 14;
      const waveTipX = Math.sin(wavePhase + 0.8) * 22;
      const tipY = toy + 48;

      ctx.strokeStyle = i % 2 === 0 ? 'rgba(217, 70, 239, 0.85)' : 'rgba(251, 113, 133, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tox, toy);
      ctx.quadraticCurveTo(tox + waveX, toy + 24, tox + waveTipX, tipY);
      ctx.stroke();

      // Astral wisp at tendril tip
      ctx.fillStyle = i % 2 === 0 ? '#d946ef' : '#fb7185';
      ctx.beginPath();
      ctx.arc(tox + waveTipX, tipY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Translucent Crystalline Crest (Astral Crown Hull)
    ctx.fillStyle = isFlashing ? 'rgba(255, 255, 255, 0.95)' : 'rgba(124, 58, 237, 0.75)';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#d946ef';
    ctx.lineWidth = 2.8;

    ctx.beginPath();
    ctx.moveTo(cx, y + 5);
    ctx.lineTo(cx + 40, y + 22);
    ctx.lineTo(cx + 80, y + 8);
    ctx.lineTo(cx + 125, y + 38);
    ctx.lineTo(cx + 105, y + 80);
    ctx.lineTo(cx + 50, y + 85);
    ctx.lineTo(cx, y + 92);
    ctx.lineTo(cx - 50, y + 85);
    ctx.lineTo(cx - 105, y + 80);
    ctx.lineTo(cx - 125, y + 38);
    ctx.lineTo(cx - 80, y + 8);
    ctx.lineTo(cx - 40, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Refractive Crystal Facets on Crest
    ctx.strokeStyle = 'rgba(251, 113, 133, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, y + 5);
    ctx.lineTo(cx, y + 60);
    ctx.moveTo(cx, y + 35);
    ctx.lineTo(cx + 80, y + 8);
    ctx.moveTo(cx, y + 35);
    ctx.lineTo(cx - 80, y + 8);
    ctx.stroke();

    // 4. Weeping Telepathic Ocular Iris at Center
    const eyeCenterY = cy + 12;
    ctx.fillStyle = '#02010a';
    ctx.beginPath();
    ctx.moveTo(cx - 28, eyeCenterY);
    ctx.quadraticCurveTo(cx, eyeCenterY - 18, cx + 28, eyeCenterY);
    ctx.quadraticCurveTo(cx, eyeCenterY + 18, cx - 28, eyeCenterY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Iridescent Iris
    const irisGrad = ctx.createRadialGradient(cx, eyeCenterY, 2, cx, eyeCenterY, 14);
    irisGrad.addColorStop(0, '#ffffff');
    irisGrad.addColorStop(0.4, '#fb7185');
    irisGrad.addColorStop(0.8, '#d946ef');
    irisGrad.addColorStop(1, '#7c3aed');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, eyeCenterY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Tracking Telepathic Pupil
    const pupilX = cx + Math.cos(this.eyeAngle) * 4;
    const pupilY = eyeCenterY + Math.sin(this.eyeAngle) * 4;
    ctx.fillStyle = '#02010a';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX - 1, pupilY - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Weeping Astral Tears (Streaming Downward)
    ctx.strokeStyle = 'rgba(251, 113, 133, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const tearDrop = Math.sin(this.floatTime * 4) * 5;
    ctx.moveTo(cx, eyeCenterY + 18);
    ctx.lineTo(cx, eyeCenterY + 36 + tearDrop);
    ctx.stroke();
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(cx, eyeCenterY + 36 + tearDrop, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Vector Drawing: Archetype 11 — GLACIAL OBLIVION
   * Absolute zero entropic engine with jagged crystalline iceberg colossus, heavy ice-shelf armor,
   * downward icicle spires, and radiant sub-zero crystal heart.
   */
  private drawGlacialOblivion(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    ctx.save();

    // 1. Sub-Zero Frost Haze Aura
    const frostAura = ctx.createRadialGradient(cx, cy + 10, 25, cx, cy + 10, 145);
    frostAura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.55)' : 'rgba(56, 189, 248, 0.4)');
    frostAura.addColorStop(0.6, 'rgba(34, 211, 238, 0.18)');
    frostAura.addColorStop(1, 'rgba(12, 74, 110, 0)');
    ctx.fillStyle = frostAura;
    ctx.fillRect(x - 30, y - 30, w + 60, h + 60);

    // 2. Heavy Ice-Shelf Armor (Jagged Iceberg Colossus Hull)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#0c4a6e';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 3.0;

    ctx.beginPath();
    ctx.moveTo(cx, y + 8);
    ctx.lineTo(cx + 45, y + 14);
    ctx.lineTo(cx + 80, y + 5);
    ctx.lineTo(cx + 126, y + 42);
    ctx.lineTo(cx + 115, y + 78);
    ctx.lineTo(cx + 70, y + 90);
    ctx.lineTo(cx + 40, y + 82);
    ctx.lineTo(cx, y + 88);
    ctx.lineTo(cx - 40, y + 82);
    ctx.lineTo(cx - 70, y + 90);
    ctx.lineTo(cx - 115, y + 78);
    ctx.lineTo(cx - 126, y + 42);
    ctx.lineTo(cx - 80, y + 5);
    ctx.lineTo(cx - 45, y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Refractive Iceberg Cleavage Planes (Geometric Shards)
    ctx.strokeStyle = '#f0f9ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, y + 8);
    ctx.lineTo(cx - 40, y + 55);
    ctx.lineTo(cx - 115, y + 78);
    ctx.moveTo(cx, y + 8);
    ctx.lineTo(cx + 40, y + 55);
    ctx.lineTo(cx + 115, y + 78);
    ctx.stroke();

    // 3. Downward Icicle Spires (Stalactite Daggers)
    const icicles = [
      { ox: -85, topY: y + 86, len: 32, w: 10 },
      { ox: -45, topY: y + 82, len: 38, w: 12 },
      { ox: 0,   topY: y + 88, len: 40, w: 14 },
      { ox: 45,  topY: y + 82, len: 38, w: 12 },
      { ox: 85,  topY: y + 86, len: 32, w: 10 },
    ];

    for (const ice of icicles) {
      const ix = cx + ice.ox;
      const iy = ice.topY;
      const tipY = Math.min(y + 128, iy + ice.len);

      ctx.fillStyle = isFlashing ? '#ffffff' : '#38bdf8';
      ctx.strokeStyle = '#f0f9ff';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(ix - ice.w / 2, iy);
      ctx.lineTo(ix + ice.w / 2, iy);
      ctx.lineTo(ix, tipY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Radiant Sub-Zero Crystal Heart
    const heartY = cy + 6;
    const crystalPulse = Math.sin(this.pulsePhase * 2.5) * 3;
    const heartRadius = 24 + crystalPulse;

    // Outer Glacial Diamond Corona
    const heartGrad = ctx.createRadialGradient(cx, heartY, 2, cx, heartY, heartRadius);
    heartGrad.addColorStop(0, '#ffffff');
    heartGrad.addColorStop(0.3, '#f0f9ff');
    heartGrad.addColorStop(0.7, '#22d3ee');
    heartGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = heartGrad;

    ctx.beginPath();
    ctx.moveTo(cx, heartY - heartRadius);
    ctx.lineTo(cx + heartRadius * 0.85, heartY);
    ctx.lineTo(cx, heartY + heartRadius);
    ctx.lineTo(cx - heartRadius * 0.85, heartY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Internal Sub-Zero Focal Eye / Tracking Optic
    const pupilX = cx + Math.cos(this.eyeAngle) * 5;
    const pupilY = heartY + Math.sin(this.eyeAngle) * 5;
    ctx.fillStyle = '#0c4a6e';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Vector Drawing: Archetype 12 — THE COSMIC DEVOURER
   * Astral void dragon behemoth with sweeping curved obsidian wings, razor wingtalons,
   * celestial dorsal spines, serpentine neck armor, and solar plasma maw.
   */
  private drawCosmicDevourer(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width;
    const h = this.size.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isFlashing = this.flashTimer > 0;

    ctx.save();

    // 1. Solar Plasma / Supernova Breath Corona
    const breathAura = ctx.createRadialGradient(cx, cy + 12, 25, cx, cy + 12, 150);
    breathAura.addColorStop(0, isFlashing ? 'rgba(255, 255, 255, 0.55)' : 'rgba(220, 38, 38, 0.4)');
    breathAura.addColorStop(0.5, 'rgba(217, 119, 6, 0.25)');
    breathAura.addColorStop(1, 'rgba(24, 24, 27, 0)');
    ctx.fillStyle = breathAura;
    ctx.fillRect(x - 35, y - 35, w + 70, h + 70);

    // 2. Celestial Dorsal Spines (Top Crest)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#facc15';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.8;
    const spines = [-40, -20, 0, 20, 40];
    for (const sx of spines) {
      const spX = cx + sx;
      const spH = sx === 0 ? 24 : 18;
      ctx.beginPath();
      ctx.moveTo(spX - 7, y + 22);
      ctx.lineTo(spX, y + 22 - spH);
      ctx.lineTo(spX + 7, y + 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 3. Sweeping Curved Obsidian Dragon Wings with Razor Wingtalons
    ctx.fillStyle = isFlashing ? '#ffffff' : '#18181b';
    ctx.strokeStyle = isFlashing ? '#ef4444' : '#d97706';
    ctx.lineWidth = 3.0;

    // Left Obsidian Wing
    ctx.beginPath();
    ctx.moveTo(cx - 25, y + 24);
    ctx.quadraticCurveTo(cx - 75, y - 2, cx - 126, y + 14);
    ctx.lineTo(cx - 120, y + 28);
    ctx.quadraticCurveTo(cx - 128, y + 55, cx - 125, y + 78);
    ctx.quadraticCurveTo(cx - 85, y + 92, cx - 40, y + 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Obsidian Wing
    ctx.beginPath();
    ctx.moveTo(cx + 25, y + 24);
    ctx.quadraticCurveTo(cx + 75, y - 2, cx + 126, y + 14);
    ctx.lineTo(cx + 120, y + 28);
    ctx.quadraticCurveTo(cx + 128, y + 55, cx + 125, y + 78);
    ctx.quadraticCurveTo(cx + 85, y + 92, cx + 40, y + 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing Struts / Feather Scutes
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - 25, y + 24);
    ctx.lineTo(cx - 110, y + 45);
    ctx.moveTo(cx - 25, y + 45);
    ctx.lineTo(cx - 95, y + 72);
    ctx.moveTo(cx + 25, y + 24);
    ctx.lineTo(cx + 110, y + 45);
    ctx.moveTo(cx + 25, y + 45);
    ctx.lineTo(cx + 95, y + 72);
    ctx.stroke();

    // 4. Serpentine Neck Armor & Scales
    ctx.fillStyle = isFlashing ? '#ffffff' : '#27272a';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.4;

    ctx.beginPath();
    ctx.moveTo(cx - 32, y + 22);
    ctx.lineTo(cx + 32, y + 22);
    ctx.lineTo(cx + 42, y + 65);
    ctx.lineTo(cx + 25, y + 126);
    ctx.lineTo(cx - 25, y + 126);
    ctx.lineTo(cx - 42, y + 65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Segmented dragon scutes
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    for (let s = 1; s <= 3; s++) {
      const scuteY = y + 25 + s * 22;
      ctx.beginPath();
      ctx.moveTo(cx - 25, scuteY);
      ctx.lineTo(cx, scuteY + 8);
      ctx.lineTo(cx + 25, scuteY);
      ctx.stroke();
    }

    // 5. Blazing Solar Plasma Maw (Dragon Core)
    const mawY = cy + 14;
    const plasmaGrad = ctx.createRadialGradient(cx, mawY, 4, cx, mawY, 26);
    plasmaGrad.addColorStop(0, '#ffffff');
    plasmaGrad.addColorStop(0.3, '#facc15');
    plasmaGrad.addColorStop(0.7, '#dc2626');
    plasmaGrad.addColorStop(1, '#18181b');
    ctx.fillStyle = plasmaGrad;
    ctx.beginPath();
    ctx.arc(cx, mawY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Dragon Jaws Fangs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 14, mawY - 14);
    ctx.lineTo(cx - 10, mawY - 5);
    ctx.lineTo(cx - 6, mawY - 14);
    ctx.moveTo(cx + 6, mawY - 14);
    ctx.lineTo(cx + 10, mawY - 5);
    ctx.lineTo(cx + 14, mawY - 14);
    ctx.fill();

    // Draconic Vertical Slit Pupil / Solar Core Tracking
    const pupilX = cx + Math.cos(this.eyeAngle) * 6;
    const pupilY = mawY + Math.sin(this.eyeAngle) * 4;
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(pupilX, pupilY, 3, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

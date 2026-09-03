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
}

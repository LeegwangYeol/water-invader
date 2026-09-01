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
    }

    // 2. Draw Hex-Barrier Deflection Matrix if Shielded
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
    if (this.archetype === CrisisArchetype.ABYSSAL_LEVIATHAN) {
      title = '✦ THE ABYSSAL LEVIATHAN ✦';
      sub = 'CORRUPTED BIO-SWARM HORROR';
    } else if (this.archetype === CrisisArchetype.CYBERNETIC_EXTERMINATOR) {
      title = '✦ CYBERNETIC EXTERMINATOR MATRIX ✦';
      sub = 'PURIFICATION DREADNOUGHT PROTOCOL';
    }

    ctx.fillText(`${title} — ${sub}`, screenWidth / 2, barY - 8);

    // Background track
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Segment 1: Phase 1 Shield / Phase 2 Hull / Phase 3 Core
    if (this.phase === CrisisPhase.PHASE_1_SHIELD) {
      // Shimmering purple/cyan shield bar
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = '#38bdf8';
      const shimmer = (Math.sin(this.floatTime * 4) + 1) / 2;
      ctx.fillRect(barX, barY, barWidth * shimmer, barHeight);
    } else if (this.phase === CrisisPhase.PHASE_2_HULL) {
      const hullRatio = Math.max(0, Math.min(1, this.hullHp / this.maxHullHp));
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barY, barWidth * hullRatio, barHeight);
    } else if (this.phase === CrisisPhase.PHASE_3_CORE) {
      const coreRatio = Math.max(0, Math.min(1, this.coreHp / this.maxCoreHp));
      ctx.fillStyle = '#f97316';
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
}

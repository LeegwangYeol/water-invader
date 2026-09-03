import { Vector2D, Size, Rect, Faction } from '../types';
import { Bullet } from '../Bullet';
import { Player } from '../Player';
import { Enemy } from '../Enemy';
import { Particle } from '../Particle';
import { EndGameCrisis } from './EndGameCrisis';

export interface EscortInterceptor {
  side: 'left' | 'right';
  x: number;
  y: number;
  vx: number;
  targetOffsetX: number;
  targetOffsetY: number;
  fireTimer: number;
  fireInterval: number;
  size: Size;
  rollAngle: number;
}

export interface PDLaserBeam {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  life: number;
  maxLife: number;
  color: string;
}

/**
 * AlliedReinforcements — Aegis Vanguard Command Dreadnought
 * 
 * Represents a massive allied capital battleship and escort fighter wing warping into
 * the crisis zone to support the player.
 * 
 * Features:
 * - 220x100px procedural Canvas 2D vector art with dual plasma engines, rotating turrets,
 *   heavy armor plating, forward railgun sponsons, and blue warp glow.
 * - In-game announcement banner with pulse animation ("ALLIED REINFORCEMENTS ARRIVED! / 아군 대규모 증원 함대 도착!").
 * - Forward Heavy Plasma Cannons (speed 450, damage 2-3) targeting boss or nearest enemies every 0.8s.
 * - Point-Defense Laser Grid vaporizing incoming hostile bullets within 120px radius of player and dreadnought.
 * - Restorative Nano-Shield Aura repairing player HP/shields by +1 periodically (every 5s) and reducing stress.
 * - 2 Agile Escort Interceptors flying in formation flanking player ship providing extra suppressing fire.
 * - Full hyperspace warp-in and jump-away lifecycle.
 */
export class AlliedReinforcements {
  public position: Vector2D;
  public size: Size = { width: 220, height: 100 };
  public targetY: number;
  
  public isActive: boolean = true;
  public isDead: boolean = false;
  public isWarpingIn: boolean = true;
  public isWarpingOut: boolean = false;
  public isDismissed: boolean = false;

  public warpTimer: number = 2.0;
  public readonly warpDuration: number = 2.0;
  public warpRingRadius: number = 10;
  public warpRingAlpha: number = 1.0;

  public bannerTimer: number = 4.8;
  public bannerText: string = 'ALLIED REINFORCEMENTS ARRIVED! / 아군 대규모 증원 함대 도착!';

  public escortFighters: EscortInterceptor[] = [];
  public pdLaserBeams: PDLaserBeam[] = [];

  // Combat Timers
  private cannonTimer: number = 0;
  private readonly cannonInterval: number = 0.8;

  private healTimer: number = 0;
  private readonly healInterval: number = 5.0;
  public healPulseTimer: number = 0;

  // Animation & Visual State
  public timeAlive: number = 0;
  public turretAngle: number = -Math.PI / 2;
  public canvasWidth: number;
  public canvasHeight: number;

  public get logicalWidth(): number {
    return this.canvasWidth;
  }

  public get logicalHeight(): number {
    return this.canvasHeight;
  }

  constructor(canvasWidth: number = 600, canvasHeight: number = 800) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.targetY = canvasHeight * 0.65; // Anchors at mid-low screen (~520px)
    
    // Spawn centered horizontally, descending into target position
    this.position = {
      x: (canvasWidth - this.size.width) / 2,
      y: this.targetY + 80,
    };

    // Initialize 2 agile escort interceptors flanking the player
    this.escortFighters = [
      {
        side: 'left',
        x: this.position.x - 30,
        y: this.targetY + 120,
        vx: 0,
        targetOffsetX: -45,
        targetOffsetY: 8,
        fireTimer: 0.2,
        fireInterval: 0.6,
        size: { width: 26, height: 22 },
        rollAngle: 0,
      },
      {
        side: 'right',
        x: this.position.x + this.size.width + 10,
        y: this.targetY + 120,
        vx: 0,
        targetOffsetX: 45, // Will offset right of player width
        targetOffsetY: 8,
        fireTimer: 0.5,
        fireInterval: 0.6,
        size: { width: 26, height: 22 },
        rollAngle: 0,
      },
    ];
  }

  /**
   * Main update loop called each game frame
   */
  public update(
    deltaTime: number,
    player: Player,
    enemies: Enemy[],
    bullets: Bullet[],
    crisis: EndGameCrisis | null,
    particles?: Particle[]
  ): Bullet[] {
    if (!this.isActive) return [];

    this.timeAlive += deltaTime;
    const spawnedBullets: Bullet[] = [];

    // 1. Warp-in Hyperspace Transition
    if (this.isWarpingIn) {
      this.warpTimer -= deltaTime;
      const progress = Math.max(0, 1 - (this.warpTimer / this.warpDuration));
      
      // Expanding blue warp particle ring
      this.warpRingRadius = 15 + progress * 175;
      this.warpRingAlpha = Math.max(0, 1.0 - progress * 0.9);

      // Smooth descent into anchor position
      this.position.y = (this.targetY + 80) - 80 * this.easeOutCubic(progress);

      if (this.warpTimer <= 0) {
        this.warpTimer = 0;
        this.isWarpingIn = false;
        this.position.y = this.targetY;
      }
    } else if (this.isWarpingOut) {
      // Warp-out / hyperspace jump departure
      this.position.y -= 380 * deltaTime;
      this.warpRingRadius += 220 * deltaTime;
      this.warpRingAlpha = Math.max(0, this.warpRingAlpha - deltaTime * 0.8);

      if (this.position.y < -this.size.height - 50) {
        this.isActive = false;
        this.isDismissed = true;
      }
    } else {
      // Floating anchor hover oscillation (gentle +/- 4px sine wave)
      this.position.y = this.targetY + Math.sin(this.timeAlive * 1.8) * 4;
    }

    // Banner Toast Timer countdown
    if (this.bannerTimer > 0) {
      this.bannerTimer -= deltaTime;
      if (this.bannerTimer < 0) this.bannerTimer = 0;
    }

    // Healing Pulse Visual Timer countdown
    if (this.healPulseTimer > 0) {
      this.healPulseTimer -= deltaTime;
      if (this.healPulseTimer < 0) this.healPulseTimer = 0;
    }

    // 2. Point-Defense Laser Grid (Active during both warp-in and normal combat)
    this.updatePointDefenseGrid(deltaTime, player, bullets, particles);

    // 3. Update Active Laser Beam Lifespans
    for (let i = this.pdLaserBeams.length - 1; i >= 0; i--) {
      this.pdLaserBeams[i].life -= deltaTime;
      if (this.pdLaserBeams[i].life <= 0) {
        this.pdLaserBeams.splice(i, 1);
      }
    }

    // 4. Combat capabilities (Cannons, Escorts, Healing) active after warp-in
    if (!this.isWarpingIn && !this.isWarpingOut) {
      // a) Forward Heavy Plasma Cannons
      const cannonShots = this.updateHeavyPlasmaCannons(deltaTime, crisis, enemies);
      if (cannonShots.length > 0) {
        spawnedBullets.push(...cannonShots);
      }

      // b) Restorative Nano-Shield Aura
      this.updateRestorativeNanoShield(deltaTime, player);

      // c) Escort Fighters Formation & Suppressing Fire
      const escortShots = this.updateEscortFighters(deltaTime, player);
      if (escortShots.length > 0) {
        spawnedBullets.push(...escortShots);
      }
    } else if (this.isWarpingOut) {
      // Escorts also ascend during warp out
      for (const escort of this.escortFighters) {
        escort.y -= 420 * deltaTime;
      }
    }

    return spawnedBullets;
  }

  /**
   * Forward Heavy Plasma Cannons:
   * Fires high-velocity blue/gold plasma bolts (speed 450, damage 2-3) targeting boss or nearest enemies every 0.8s.
   */
  private updateHeavyPlasmaCannons(deltaTime: number, crisis: EndGameCrisis | null, enemies: Enemy[]): Bullet[] {
    this.cannonTimer += deltaTime;
    if (this.cannonTimer < this.cannonInterval) {
      return [];
    }

    this.cannonTimer = 0;
    const bullets: Bullet[] = [];

    // Determine primary target: Boss Core/Rift first, else nearest enemy
    let targetX = this.position.x + this.size.width / 2;
    let targetY = 120; // Default high screen target

    if (crisis && crisis.isActive) {
      if (crisis.sovereign && !crisis.sovereign.isDead) {
        const core = crisis.sovereign.getCoreCenter();
        targetX = core.x;
        targetY = core.y;
      } else {
        // Target alive rift anchor
        const activeRift = crisis.riftAnchors.find(r => !r.isDead);
        if (activeRift) {
          const rCenter = activeRift.getSingularityCenter();
          targetX = rCenter.x;
          targetY = rCenter.y;
        }
      }
    } else if (enemies && enemies.length > 0) {
      // Find nearest living enemy
      let nearestDist = Infinity;
      for (const e of enemies) {
        if (!e.isDead) {
          const ex = e.position.x + e.size.width / 2;
          const ey = e.position.y + e.size.height / 2;
          const d = Math.hypot(ex - (this.position.x + this.size.width / 2), ey - this.position.y);
          if (d < nearestDist) {
            nearestDist = d;
            targetX = ex;
            targetY = ey;
          }
        }
      }
    }

    // Left and Right Sponson Muzzles
    const muzzleLeft = { x: this.position.x + 36, y: this.position.y + 10 };
    const muzzleRight = { x: this.position.x + this.size.width - 36, y: this.position.y + 10 };

    // Update turret aim angle towards target
    const dxTurret = targetX - (this.position.x + this.size.width / 2);
    const dyTurret = targetY - (this.position.y + 50);
    this.turretAngle = Math.atan2(dyTurret, dxTurret);

    // Spawn 2 high-velocity dual plasma bolts
    const muzzles = [muzzleLeft, muzzleRight];
    for (let i = 0; i < muzzles.length; i++) {
      const m = muzzles[i];
      const dx = targetX - m.x;
      const dy = targetY - m.y;
      const dist = Math.hypot(dx, dy) || 1;
      
      const speed = 450;
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;

      // Heavy plasma bolt: damage 3, piercing 2, player faction
      const bolt = new Bullet(m.x - 5, m.y - 10, vy, 3, true, 2);
      bolt.velocity.x = vx;
      bolt.color = i === 0 ? '#38bdf8' : '#fbbf24'; // Alternating cyan/gold core
      bolt.size = { width: 8, height: 16 };
      bolt.isInterceptable = false; // Heavy plasma cannot be swatted down easily
      bullets.push(bolt);
    }

    return bullets;
  }

  /**
   * Point-Defense Laser Grid:
   * Intercepts and vaporizes incoming hostile enemy/boss bullets within a 120px perimeter
   * around both the player and the dreadnought hull.
   */
  private updatePointDefenseGrid(
    deltaTime: number,
    player: Player,
    bullets: Bullet[],
    particles?: Particle[]
  ): void {
    if (!bullets || bullets.length === 0) return;

    const dreadCenterX = this.position.x + this.size.width / 2;
    const dreadCenterY = this.position.y + this.size.height / 2;

    const playerCenterX = player ? player.position.x + player.size.width / 2 : this.canvasWidth / 2;
    const playerCenterY = player ? player.position.y + player.size.height / 2 : this.canvasHeight - 50;

    const INTERCEPT_RADIUS = 120;
    const INTERCEPT_RADIUS_SQ = INTERCEPT_RADIUS * INTERCEPT_RADIUS;

    for (const bullet of bullets) {
      // Only target hostile, active projectiles
      if (bullet.isDead || bullet.faction === Faction.PLAYER) {
        continue;
      }

      const bx = bullet.position.x + bullet.size.width / 2;
      const by = bullet.position.y + bullet.size.height / 2;

      // Check distance to player
      const dPlayerSq = (bx - playerCenterX) * (bx - playerCenterX) + (by - playerCenterY) * (by - playerCenterY);
      // Check distance to dreadnought
      const dDreadSq = (bx - dreadCenterX) * (bx - dreadCenterX) + (by - dreadCenterY) * (by - dreadCenterY);

      if (dPlayerSq <= INTERCEPT_RADIUS_SQ || dDreadSq <= INTERCEPT_RADIUS_SQ) {
        // Vaporize hostile projectile!
        bullet.isDead = true;

        // Choose firing origin (nearest turret or escort fighter)
        let fromX = dreadCenterX;
        let fromY = this.position.y + 45;

        if (dPlayerSq < dDreadSq && this.escortFighters.length > 0) {
          // Fire from closest escort fighter
          const f = bx < playerCenterX ? this.escortFighters[0] : this.escortFighters[1];
          fromX = f.x + f.size.width / 2;
          fromY = f.y + f.size.height / 2;
        }

        // Add laser beam effect
        this.pdLaserBeams.push({
          fromX,
          fromY,
          toX: bx,
          toY: by,
          life: 0.12,
          maxLife: 0.12,
          color: '#38bdf8',
        });

        // Spawn vaporizing electric sparks
        if (particles && particles.length < 400) {
          for (let p = 0; p < 4; p++) {
            particles.push(new Particle(bx, by, '#38bdf8', 0.4));
          }
        }
      }
    }
  }

  /**
   * Restorative Nano-Shield Aura:
   * Projects a protective energy field around the player ship, repairing player HP/shields
   * by +1 periodically (every 5s) and reducing stress.
   */
  private updateRestorativeNanoShield(deltaTime: number, player: Player): void {
    if (!player || player.isDead || player.hp <= 0) return;

    this.healTimer += deltaTime;
    if (this.healTimer >= this.healInterval) {
      this.healTimer = 0;

      // Repair HP if below max
      if (player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + 1);
      }

      // Alleviate stress & combat suppression
      player.stressLevel = Math.max(0, player.stressLevel - 25);
      player.suppressionLevel = Math.max(0, player.suppressionLevel - 25);

      // Trigger healing pulse feedback
      this.healPulseTimer = 1.0;
    }
  }

  /**
   * Escort Fighters:
   * 2 agile interceptors flying in formation flanking player ship providing extra suppressing fire.
   */
  private updateEscortFighters(deltaTime: number, player: Player): Bullet[] {
    if (!player || player.isDead || player.hp <= 0) return [];

    const bullets: Bullet[] = [];

    for (const fighter of this.escortFighters) {
      // Calculate formation targets relative to player
      const rawTargetX = fighter.side === 'left'
        ? player.position.x + fighter.targetOffsetX
        : player.position.x + player.size.width + (fighter.targetOffsetX - fighter.size.width);
      
      const targetX = Math.max(10, Math.min(this.logicalWidth - 30, rawTargetX));
      const targetY = player.position.y + fighter.targetOffsetY;

      // Responsive lerp movement
      const prevX = fighter.x;
      fighter.x += (targetX - fighter.x) * Math.min(1.0, 9.0 * deltaTime);
      fighter.x = Math.max(10, Math.min(this.logicalWidth - 30, fighter.x));
      fighter.y += (targetY - fighter.y) * Math.min(1.0, 9.0 * deltaTime);

      // Calculate roll angle based on lateral velocity
      fighter.vx = (fighter.x - prevX) / (deltaTime || 0.016);
      fighter.rollAngle = Math.max(-0.4, Math.min(0.4, (fighter.vx / 300) * 0.4));

      // Suppressing fire
      fighter.fireTimer += deltaTime;
      if (fighter.fireTimer >= fighter.fireInterval) {
        fighter.fireTimer = 0;

        const muzzleX = fighter.x + fighter.size.width / 2;
        const muzzleY = fighter.y;

        // Agile rapid suppressing laser bolt (speed 420, damage 1)
        const bolt = new Bullet(muzzleX - 3, muzzleY, -420, 1, true, 1);
        bolt.color = '#06b6d4';
        bullets.push(bolt);
      }
    }

    return bullets;
  }

  /**
   * Safe warp-out command to initiate departure
   */
  public warpOut(): void {
    if (!this.isWarpingOut && !this.isDismissed) {
      this.isWarpingOut = true;
      this.warpRingAlpha = 1.0;
    }
  }

  /**
   * Check if announcement banner should be rendered
   */
  public hasActiveBanner(): boolean {
    return this.bannerTimer > 0;
  }

  /**
   * Render all world-space components:
   * Dreadnought capital ship vector art, dual plasma engines, rotating turrets,
   * escort interceptors, point-defense perimeter, and active laser beams.
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    ctx.save();

    // 1. Hyperspace Warp Ring / Portal Flare
    if (this.isWarpingIn || this.isWarpingOut) {
      this.drawWarpPortal(ctx);
    }

    // 2. Point-Defense Defensive Perimeter Fields
    this.drawDefensivePerimeters(ctx);

    // 3. Active Point-Defense Laser Grid Beams
    this.drawPDLaserBeams(ctx);

    // 4. Dreadnought Capital Battleship Vector Art (220x100px)
    this.drawDreadnought(ctx);

    // 5. Escort Interceptors
    this.drawEscortFighters(ctx);

    ctx.restore();
  }

  /**
   * Render the Restorative Nano-Shield Aura around the Player Ship
   */
  public drawPlayerNanoShield(ctx: CanvasRenderingContext2D, player: Player): void {
    if (!player || player.isDead || !this.isActive || this.isWarpingIn) return;

    ctx.save();
    const px = player.position.x + player.size.width / 2;
    const py = player.position.y + player.size.height / 2;

    // Orbiting nano-particles
    const numMotes = 5;
    for (let i = 0; i < numMotes; i++) {
      const angle = this.timeAlive * 3.5 + (i * Math.PI * 2) / numMotes;
      const mx = px + Math.cos(angle) * 38;
      const my = py + Math.sin(angle) * 28;

      ctx.fillStyle = '#34d399'; // Emerald / Cyan Nano Mote
      ctx.beginPath();
      ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shimmering protective energy hexagon / ellipse
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + 0.2 * Math.sin(this.timeAlive * 5)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(px, py, 36, 30, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Healing Pulse Wave Shockwave
    if (this.healPulseTimer > 0) {
      const pulseProgress = 1 - (this.healPulseTimer / 1.0);
      const ringR = 30 + pulseProgress * 45;
      const alpha = Math.max(0, 1 - pulseProgress);

      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px, py, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Floating +1 REPAIRED text
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
      ctx.fillText('+1 REPAIRED', px, py - 35 - pulseProgress * 20);
    }

    ctx.restore();
  }

  /**
   * Render In-Game Announcement Banner in the Foreground UI Layer
   */
  public drawUI(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    if (!this.hasActiveBanner()) return;

    ctx.save();
    const bannerWidth = Math.min(500, screenWidth - 30);
    const bannerHeight = 72;
    const bannerX = (screenWidth - bannerWidth) / 2;
    const bannerY = 120; // Upper third banner

    const pulse = (Math.sin(this.timeAlive * 7) + 1) / 2;
    const alpha = Math.min(1.0, this.bannerTimer / 0.8);

    ctx.globalAlpha = alpha;

    // Background Container (Deep Space Slate)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    this.roundRect(ctx, bannerX, bannerY, bannerWidth, bannerHeight, 8);
    ctx.fill();

    // Glowing Cyan & Gold Double Border
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10 * pulse;
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.75 + 0.25 * pulse})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 1.0;
    this.roundRect(ctx, bannerX + 4, bannerY + 4, bannerWidth - 8, bannerHeight - 8, 5);
    ctx.stroke();

    // Corner Tactical Brackets
    const bLen = 14;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.0;

    // Top-Left bracket
    ctx.beginPath();
    ctx.moveTo(bannerX, bannerY + bLen);
    ctx.lineTo(bannerX, bannerY);
    ctx.lineTo(bannerX + bLen, bannerY);
    ctx.stroke();

    // Top-Right bracket
    ctx.beginPath();
    ctx.moveTo(bannerX + bannerWidth - bLen, bannerY);
    ctx.lineTo(bannerX + bannerWidth, bannerY);
    ctx.lineTo(bannerX + bannerWidth, bannerY + bLen);
    ctx.stroke();

    // Text Header
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('✦ ALLIED REINFORCEMENTS ARRIVED! ✦', screenWidth / 2, bannerY + 22);

    // Text Subtitle (Korean & English)
    ctx.font = bannerWidth < 380 ? 'bold 10px sans-serif' : 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    const subtitleText = bannerWidth < 380
      ? '대규모 증원 함대 참전 — AEGIS DREADNOUGHT'
      : '아군 대규모 증원 함대 참전 — AEGIS VANGUARD DREADNOUGHT';
    ctx.fillText(subtitleText, screenWidth / 2, bannerY + 42);

    // Status Badges Ticker
    ctx.font = bannerWidth < 380 ? '8px monospace' : '9px monospace';
    ctx.fillStyle = '#38bdf8';
    const tickerText = bannerWidth < 380
      ? 'CANNONS: ON  |  PD GRID: ON  |  SHIELD: ON'
      : 'HEAVY PLASMA CANNONS: ONLINE  |  PD LASER GRID: ACTIVE  |  NANO-SHIELD: LINKED';
    ctx.fillText(tickerText, screenWidth / 2, bannerY + 59);

    ctx.restore();
  }

  // =========================================================================
  // VECTOR ART PROCEDURAL DRAWING ROUTINES
  // =========================================================================

  private drawDreadnought(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const w = this.size.width; // 220
    const h = this.size.height; // 100

    ctx.save();

    // Blue Warp Glow / Hull Energy Shielding
    const shieldGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 40, x + w / 2, y + h / 2, 125);
    shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
    shieldGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.22)');
    shieldGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = shieldGrad;
    ctx.fillRect(x - 20, y - 20, w + 40, h + 50);

    // 1. Dual Plasma Engine Exhausts (Rear Flaring Plumes)
    const leftEngineX = x + 55;
    const rightEngineX = x + w - 55;
    const engineY = y + h - 12;

    for (const ex of [leftEngineX, rightEngineX]) {
      const plumeH = 26 + Math.sin(this.timeAlive * 24 + ex) * 8;
      const plumeGrad = ctx.createLinearGradient(ex, engineY, ex, engineY + plumeH);
      plumeGrad.addColorStop(0, '#ffffff');
      plumeGrad.addColorStop(0.3, '#38bdf8');
      plumeGrad.addColorStop(0.7, '#0284c7');
      plumeGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

      ctx.fillStyle = plumeGrad;
      ctx.beginPath();
      ctx.moveTo(ex - 12, engineY);
      ctx.lineTo(ex + 12, engineY);
      ctx.lineTo(ex, engineY + plumeH);
      ctx.closePath();
      ctx.fill();

      // Nozzle Ring
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ex - 14, engineY - 4, 28, 8);
      ctx.fillRect(ex - 14, engineY - 4, 28, 8);
    }

    // 2. Main Armored Battleship Hull
    // Outer Armor Wings & Flanks (Navy & Slate Blue)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    // Bow prow
    ctx.moveTo(x + w / 2, y); 
    // Starboard forward sponson
    ctx.lineTo(x + w - 30, y + 22);
    ctx.lineTo(x + w - 24, y + 42);
    // Starboard outrigger wing
    ctx.lineTo(x + w, y + 68);
    ctx.lineTo(x + w - 18, y + h);
    // Stern
    ctx.lineTo(x + 18, y + h);
    // Port outrigger wing
    ctx.lineTo(x, y + 68);
    ctx.lineTo(x + 24, y + 42);
    // Port forward sponson
    ctx.lineTo(x + 30, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Cyan & Gold Primary Armor Plates
    ctx.fillStyle = '#0369a1'; // Deep Cyan Plating
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 10);
    ctx.lineTo(x + w - 48, y + 36);
    ctx.lineTo(x + w - 40, y + 78);
    ctx.lineTo(x + w / 2, y + 90);
    ctx.lineTo(x + 40, y + 78);
    ctx.lineTo(x + 48, y + 36);
    ctx.closePath();
    ctx.fill();

    // Gold Trim Chevron Decals
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 14);
    ctx.lineTo(x + w - 52, y + 40);
    ctx.moveTo(x + w / 2, y + 14);
    ctx.lineTo(x + 52, y + 40);
    ctx.stroke();

    // 4. Forward Railgun Sponsons
    for (const sx of [x + 36, x + w - 36]) {
      // Barrel Housing
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx - 5, y - 6, 10, 24);

      // Cyan Magnetic Accelerator Rings
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(sx - 7, y - 2);
      ctx.lineTo(sx + 7, y - 2);
      ctx.moveTo(sx - 7, y + 6);
      ctx.lineTo(sx + 7, y + 6);
      ctx.stroke();
    }

    // 5. Command Citadel & Bridge Deck
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(x + w / 2 - 28, y + 36, 56, 32);
    ctx.fill();
    ctx.stroke();

    // Bridge Panoramic Viewport (Glowing Gold)
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 6;
    ctx.fillRect(x + w / 2 - 18, y + 40, 36, 7);
    ctx.shadowBlur = 0;

    // 6. Rotating Point-Defense Turrets
    // Center Upper Deck Turret
    this.drawTurret(ctx, x + w / 2, y + 60, this.turretAngle, 12, '#f59e0b');
    // Port Flank Turret
    this.drawTurret(ctx, x + 44, y + 62, this.turretAngle - 0.2, 9, '#38bdf8');
    // Starboard Flank Turret
    this.drawTurret(ctx, x + w - 44, y + 62, this.turretAngle + 0.2, 9, '#38bdf8');

    // Hull Panel Seam Details
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 70);
    ctx.lineTo(x + w / 2, y + 90);
    ctx.stroke();

    ctx.restore();
  }

  private drawTurret(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    angle: number,
    radius: number,
    color: string
  ): void {
    ctx.save();
    ctx.translate(cx, cy);

    // Turret Ring
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rotating Dual Barrels
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.fillRect(0, -radius * 0.4, radius * 1.5, radius * 0.28);
    ctx.fillRect(0, radius * 0.12, radius * 1.5, radius * 0.28);

    ctx.restore();
  }

  private drawEscortFighters(ctx: CanvasRenderingContext2D): void {
    for (const fighter of this.escortFighters) {
      ctx.save();
      ctx.translate(fighter.x + fighter.size.width / 2, fighter.y + fighter.size.height / 2);
      ctx.rotate(fighter.rollAngle);

      const fw = fighter.size.width;
      const fh = fighter.size.height;
      const hfw = fw / 2;
      const hfh = fh / 2;

      // Engine Flame Plume
      const flameH = 10 + Math.sin(this.timeAlive * 30 + fighter.x) * 4;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-hfw * 0.4, hfh);
      ctx.lineTo(hfw * 0.4, hfh);
      ctx.lineTo(0, hfh + flameH);
      ctx.closePath();
      ctx.fill();

      // Interceptor Arrowhead Silhouette
      ctx.fillStyle = '#0284c7'; // Vivid Cyan
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -hfh); // Nose
      ctx.lineTo(hfw, hfh * 0.7); // Right wingtip
      ctx.lineTo(hfw * 0.5, hfh);
      ctx.lineTo(0, hfh * 0.5); // Center notch
      ctx.lineTo(-hfw * 0.5, hfh);
      ctx.lineTo(-hfw, hfh * 0.7); // Left wingtip
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit Viewport (White/Gold)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, -hfh * 0.2, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing Blasters
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-hfw - 1, -hfh * 0.1, 2, 7);
      ctx.fillRect(hfw - 1, -hfh * 0.1, 2, 7);

      ctx.restore();
    }
  }

  private drawWarpPortal(ctx: CanvasRenderingContext2D): void {
    const cx = this.position.x + this.size.width / 2;
    const cy = this.targetY + this.size.height / 2;

    ctx.save();
    ctx.strokeStyle = `rgba(56, 189, 248, ${this.warpRingAlpha})`;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(cx, cy, this.warpRingRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(254, 240, 138, ${this.warpRingAlpha * 0.8})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, this.warpRingRadius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawDefensivePerimeters(ctx: CanvasRenderingContext2D): void {
    const dreadCenterX = this.position.x + this.size.width / 2;
    const dreadCenterY = this.position.y + this.size.height / 2;

    ctx.save();
    // Dreadnought PD Grid Perimeter (120px)
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.14 + 0.05 * Math.sin(this.timeAlive * 3.5)})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(dreadCenterX, dreadCenterY, 120, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawPDLaserBeams(ctx: CanvasRenderingContext2D): void {
    for (const beam of this.pdLaserBeams) {
      const alpha = Math.max(0, beam.life / beam.maxLife);
      ctx.save();

      // Outer Glow Line
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.85})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();

      // Sharp Intense White Core
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();

      ctx.restore();
    }
  }

  public getRect(): Rect {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
    };
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

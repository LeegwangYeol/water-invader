import { Entity } from './Entity';
import { Bullet } from './Bullet';
import { Vector2D, Faction, EnemyType } from './types';
import { soundManager } from './SoundManager';

export { EnemyType };

export class Enemy extends Entity {
  public static assets: { squid?: HTMLImageElement; crab?: HTMLImageElement; rogue?: HTMLImageElement } = {};
  public static initAssets() {
    if (typeof window !== 'undefined' && !Enemy.assets.squid) {
      const squid = new Image();
      squid.src = '/assets/enemy_squid.jpg';
      const crab = new Image();
      crab.src = '/assets/enemy_crab.jpg';
      const rogue = new Image();
      rogue.src = '/assets/rogue_jellyfish.jpg';
      Enemy.assets = { squid, crab, rogue };
    }
  }

  public hp: number;
  public maxHp: number;
  private canvasWidth: number;
  public type: EnemyType = EnemyType.NORMAL;
  public isGnawing: boolean = false;
  public hitFlashTimer: number = 0;
  
  // Movement pattern
  private direction: number = 1; // 1 for right, -1 for left
  public speedX: number = 30;
  public speedY: number = 8;
  private startY: number;
  
  private fireTimer: number = 0;
  public canEvade: boolean = false;
  private evadeCooldown: number = 0;
  
  public isDiving: boolean = false;
  public prevY: number = 0;
  public shieldHp: number = 0;
  public shieldRegenTimer: number = 0;
  public level: number = 1;
  public canvasHeight: number = 960;

  // Stage 10+ Aggression AI
  public isAggressive: boolean = false;
  public rushVelocityModifier: number = 1.0;
  public rushChargeTimer: number = 0;
  public isRushing: boolean = false;
  public aggressionMode: boolean = false;

  constructor(x: number, y: number, canvasWidth: number = 720, level: number = 1, type: EnemyType = EnemyType.NORMAL, canvasHeight: number = 960) {
    Enemy.initAssets();
    const validX = Number.isFinite(x) ? x : 0;
    const validY = Number.isFinite(y) ? y : 80;
    super(validX, validY, 40, 30);
    this.faction = Faction.INVADER;
    this.canvasWidth = Number.isFinite(canvasWidth) ? Math.max(100, canvasWidth) : 720;
    this.canvasHeight = Number.isFinite(canvasHeight) ? Math.max(100, canvasHeight) : 960;
    this.startY = validY;
    this.prevY = validY;
    this.position.x = Math.max(0, Math.min(validX, this.canvasWidth - this.size.width));
    this.position.y = Math.max(0, Math.min(validY, this.canvasHeight - this.size.height));
    this.level = Number.isFinite(level) && level >= 1 ? Math.floor(level) : 1;
    this.type = type;
    this.hp = 1 + Math.floor(this.level / 3);

    // Stage 10+ Aggression Activation
    if (this.level >= 10) {
      this.isAggressive = true;
      this.aggressionMode = true;
      this.rushVelocityModifier = 1.8 + Math.min(1.2, (this.level - 10) * 0.15); // 1.8x to 3.0x
      this.rushChargeTimer = Math.random() * 2.0 + 1.0;
    }
    
    if (type === EnemyType.ZIGZAG) {
      this.color = '#eab308'; // Yellow
      this.speedX += this.level * 10 + 50; // faster
      this.hp = Math.max(1, this.hp - 1); // squishier
    } else if (type === EnemyType.BOSS) {
      this.color = '#dc2626'; // Dark red
      this.size.width = 150;
      this.size.height = 100;
      this.hp = this.level * 10;
      this.speedX += this.level * 2;
    } else if (type === EnemyType.SNIPER) {
      this.color = '#a855f7'; // Purple
      this.speedX = 20; // slow
      this.hp = Math.max(1, this.hp - 1);
    } else if (type === EnemyType.DIVER) {
      this.color = '#ef4444'; // Red
      this.speedX += this.level * 8;
    } else if (type === EnemyType.SHIELDED) {
      this.color = '#64748b'; // Slate
      this.shieldHp = 3;
    } else if (type === EnemyType.SPLITTER) {
      this.color = '#22c55e'; // Green
      this.size = { width: 50, height: 40 }; // slightly bigger
    } else if (type === EnemyType.ROGUE_DRONE) {
      this.faction = Faction.ROGUE;
      this.color = '#d946ef'; // Electric Magenta
      this.size = { width: 36, height: 28 };
      this.speedX = 50 + this.level * 6;
      this.speedY = 10 + this.level * 2;
      this.hp = Math.max(1, 1 + Math.floor((this.level - 1) / 4));
      this.canEvade = true;
    } else if (type === EnemyType.ROGUE_STALKER) {
      this.faction = Faction.ROGUE;
      this.color = '#c026d3'; // Ultraviolet / Vivid Fuchsia
      this.size = { width: 44, height: 32 };
      this.speedX = 30 + this.level * 4;
      this.speedY = 8 + this.level * 2;
      this.hp = 2 + Math.floor((this.level - 1) / 2);
      this.canEvade = true;
    } else if (type === EnemyType.ROGUE_MECH) {
      this.faction = Faction.ROGUE;
      this.color = '#86198f'; // High-Voltage Dark Magenta
      this.size = { width: 56, height: 42 };
      this.speedX = 18 + this.level * 2;
      this.speedY = 5 + this.level;
      this.hp = 4 + Math.floor((this.level - 1) * 1.5); // Rebalanced: Base 4 HP
    } else {
      this.color = '#f97316'; // Orange/Fire
      this.speedX += this.level * 5;
      this.canEvade = false;
    }
    
    this.maxHp = this.hp;
    this.fireTimer = Math.random() * 3 + 1; // Staggered initial firing timer

    // Re-clamp position in case type-specific size altered dimensions
    const maxX = Math.max(0, this.canvasWidth - this.size.width);
    const maxY = Math.max(0, this.canvasHeight - this.size.height);
    this.position.x = Math.max(0, Math.min(this.position.x, maxX));
    this.position.y = Math.max(0, Math.min(this.position.y, maxY));
  }

  public update(deltaTime: number, speedMultiplier: number = 1.0, bullets: Bullet[] = [], playerPos?: Vector2D, allEnemies: Enemy[] = []): void {
    if (!Number.isFinite(deltaTime) || deltaTime < 0) return;
    this.prevY = this.position.y;
    const clampedDt = Math.min(deltaTime, 0.1); // Guard against massive lag spikes / tab throttle jumps

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaTime;
      if (this.hitFlashTimer < 0) this.hitFlashTimer = 0;
    }

    const validSpeedMultiplier = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : 1.0;
    const gnawMultiplier = this.isGnawing ? 0.2 : 1.0;
    const rushMod = this.isAggressive ? this.rushVelocityModifier : 1.0;
    const currentSpeedX = this.speedX * validSpeedMultiplier * gnawMultiplier;
    const currentSpeedY = this.speedY * validSpeedMultiplier * gnawMultiplier * rushMod;

    // Diver Logic: Safe trajectory & dive trigger (target must be below the diver)
    if (this.type === EnemyType.DIVER && playerPos && Number.isFinite(playerPos.x) && Number.isFinite(playerPos.y)) {
      const diverCenterX = this.position.x + this.size.width / 2;
      const playerCenterX = playerPos.x + 25;
      if (!this.isDiving && Math.abs(diverCenterX - playerCenterX) < 25 && playerPos.y > this.position.y) {
        // Player is directly below!
        this.isDiving = true;
      }
    }

    if (this.isDiving) {
      const diveSpeed = Math.max(280, currentSpeedY * 35);
      this.position.y += diveSpeed * clampedDt; // Dive very fast
      const maxDiverY = this.canvasHeight + 50;
      this.position.y = Math.max(0, Math.min(maxDiverY, this.position.y));
      if (!Number.isFinite(this.position.y)) this.position.y = maxDiverY;
      if (!Number.isFinite(this.position.x)) this.position.x = 0;
      if (this.position.x < 0) this.position.x = 0;
      const maxDiverX = Math.max(0, this.canvasWidth - this.size.width);
      if (this.position.x > maxDiverX) this.position.x = maxDiverX;
      return; // Skip normal movement
    }

    // =========================================================================
    // STAGE 10+ AGGRESSION AI: HOMING DRIFT & SURGE CHARGING
    // =========================================================================
    if (this.isAggressive && playerPos && Number.isFinite(playerPos.x) && Number.isFinite(playerPos.y) && !this.isDiving) {
      const enemyCenterX = this.position.x + this.size.width / 2;
      const playerCenterX = playerPos.x + 25;
      const dx = playerCenterX - enemyCenterX;

      // 1. Directional homing pull towards player
      const homingStrength = Math.min(45, 25 + (this.level - 10) * 3);
      if (Math.abs(dx) > 15) {
        this.position.x += Math.sign(dx) * homingStrength * clampedDt * validSpeedMultiplier;
      }

      // 2. Periodic Rush Charge Surges
      this.rushChargeTimer -= clampedDt;
      if (this.rushChargeTimer <= 0) {
        this.isRushing = true;
        // Surge downward towards player
        const chargeSurgeY = Math.max(60, 40 + (this.level - 10) * 6);
        this.position.y += chargeSurgeY * clampedDt * validSpeedMultiplier;

        // Reset charge timer after burst duration
        if (this.rushChargeTimer <= -0.8) {
          this.isRushing = false;
          this.rushChargeTimer = Math.random() * 2.5 + 1.5;
        }
      }
    }

    this.position.y += currentSpeedY * clampedDt;

    // Strict Y-Axis Boundary Clamping
    const maxY = Math.max(0, this.canvasHeight - this.size.height);
    this.position.y = Math.max(0, Math.min(this.position.y, maxY));

    // Safeguard position values against NaN corruption
    if (!Number.isFinite(this.position.y)) this.position.y = maxY;
    if (!Number.isFinite(this.position.x)) this.position.x = 0;

    // Shield Regen Logic
    if (this.type === EnemyType.SHIELDED && this.shieldHp <= 0) {
      this.shieldRegenTimer -= deltaTime;
      if (this.shieldRegenTimer <= 0) {
        this.shieldHp = 3; // Regenerate shield
        this.shieldRegenTimer = 0;
      }
    }

    // Evasive maneuver logic (dodges hostile bullets of different faction)
    if (this.canEvade && this.evadeCooldown <= 0) {
      const incoming = bullets.find(b => 
        !b.isDead &&
        b.faction !== this.faction && 
        b.position.y > this.position.y && 
        b.position.y - this.position.y < 250 && 
        Math.abs(b.position.x - this.position.x) < this.size.width + 10 
      );
      if (incoming) {
        this.direction = (incoming.position.x > this.position.x + this.size.width / 2) ? -1 : 1;
        this.evadeCooldown = 1.5; 
      }
    }
    if (this.evadeCooldown > 0) {
      this.evadeCooldown -= clampedDt;
    }

    // Rogue Stalker tracking AI in movement
    if (this.type === EnemyType.ROGUE_STALKER && (playerPos || allEnemies.length > 0)) {
      let targetX = playerPos ? playerPos.x + 25 : this.canvasWidth / 2;
      let minDistance = playerPos ? Math.hypot((playerPos.x + 25) - (this.position.x + this.size.width / 2), (playerPos.y + 20) - (this.position.y + this.size.height / 2)) : Infinity;
      
      for (const e of allEnemies) {
        if (!e.isDead && e.faction === Faction.INVADER) {
          const d = Math.hypot((e.position.x + e.size.width / 2) - (this.position.x + this.size.width / 2), (e.position.y + e.size.height / 2) - (this.position.y + this.size.height / 2));
          if (d < minDistance) {
            minDistance = d;
            targetX = e.position.x + e.size.width / 2;
          }
        }
      }
      const dx = targetX - (this.position.x + this.size.width / 2);
      if (Math.abs(dx) > 10) {
        this.position.x += Math.sign(dx) * 25 * clampedDt * validSpeedMultiplier;
      }
    }

    if (this.type === EnemyType.ZIGZAG || this.type === EnemyType.ROGUE_DRONE) {
      this.position.x += currentSpeedX * this.direction * clampedDt;
      this.position.x += Math.sin(Date.now() / 180 + this.position.y) * 4 * validSpeedMultiplier;
    } else {
      const evadeBoost = (this.evadeCooldown > 0.5) ? 1.5 : 1.0;
      this.position.x += currentSpeedX * evadeBoost * this.direction * clampedDt;
    }
    
    // Bounce off walls
    const movingDir = this.speedX >= 0 ? this.direction : -this.direction;
    if (this.position.x <= 0 && movingDir < 0) {
      this.direction = this.speedX >= 0 ? 1 : -1;
    } else if (this.position.x + this.size.width >= this.canvasWidth && movingDir > 0) {
      this.direction = this.speedX >= 0 ? -1 : 1;
    }
    
    // Clamp X to canvas width
    if (this.position.x <= 0) this.position.x = 0;
    if (this.position.x + this.size.width >= this.canvasWidth) {
      this.position.x = Math.max(0, this.canvasWidth - this.size.width);
    }
    
    this.fireTimer -= clampedDt * validSpeedMultiplier;
  }

  public fire(playerPos?: Vector2D, allEnemies: Enemy[] = []): Bullet | null {
    if (this.isDiving) return null; // divers don't shoot while diving

    if (this.fireTimer <= 0) {
      // Reset timer
      if (this.type === EnemyType.BOSS) {
        this.fireTimer = Math.random() * 2 + 0.5;
      } else if (this.type === EnemyType.ROGUE_DRONE) {
        this.fireTimer = Math.random() * 2.0 + 2.5; // 2.5 ~ 4.5s
      } else if (this.type === EnemyType.ROGUE_STALKER) {
        this.fireTimer = Math.random() * 2.0 + 3.0; // 3.0 ~ 5.0s
      } else if (this.type === EnemyType.ROGUE_MECH) {
        this.fireTimer = Math.random() * 2.0 + 3.5; // 3.5 ~ 5.5s
      } else {
        this.fireTimer = Math.random() * 3 + 2;
      }
      
      const spawnX = this.position.x + this.size.width / 2 - 3;
      const spawnY = this.position.y + this.size.height;

      // Rogue Faction Dual-Targeting AI
      if (this.faction === Faction.ROGUE) {
        soundManager.playRogueShoot();

        let targetCenter: Vector2D | null = null;
        let minDistance = Infinity;

        // Evaluate distance to Player
        if (playerPos && Number.isFinite(playerPos.x) && Number.isFinite(playerPos.y)) {
          const px = playerPos.x + 25;
          const py = playerPos.y + 20;
          const dist = Math.hypot(px - spawnX, py - spawnY);
          minDistance = dist;
          targetCenter = { x: px, y: py };
        }

        // Evaluate distance to active Invader enemies
        for (const e of allEnemies) {
          if (!e.isDead && e.faction === Faction.INVADER) {
            const ex = e.position.x + e.size.width / 2;
            const ey = e.position.y + e.size.height / 2;
            const dist = Math.hypot(ex - spawnX, ey - spawnY);
            if (dist < minDistance) {
              minDistance = dist;
              targetCenter = { x: ex, y: ey };
            }
          }
        }

        const bulletSpeed = this.type === EnemyType.ROGUE_DRONE 
          ? (this.level <= 2 ? 300 : 360) 
          : (this.type === EnemyType.ROGUE_MECH ? (this.level <= 2 ? 240 : 280) : (this.level <= 2 ? 280 : 320));
        const bulletDamage = this.type === EnemyType.ROGUE_MECH 
          ? (this.level <= 3 ? 2 : 3) 
          : (this.type === EnemyType.ROGUE_STALKER ? (this.level <= 2 ? 1 : 2) : 1);
        const piercing = this.type === EnemyType.ROGUE_MECH ? (this.level <= 3 ? 1 : 2) : 1;

        const b = new Bullet(spawnX, spawnY, bulletSpeed, bulletDamage, false, piercing);
        b.faction = Faction.ROGUE;
        b.color = '#d946ef'; // Electric Magenta

        if (this.type === EnemyType.ROGUE_STALKER) {
          b.isInterceptable = true;
        }

        if (targetCenter) {
          const dx = targetCenter.x - spawnX;
          const dy = targetCenter.y - spawnY;
          const angle = Math.atan2(dy, dx);
          b.velocity.x = Math.cos(angle) * bulletSpeed;
          b.velocity.y = Math.sin(angle) * bulletSpeed;
        }

        return b;
      }

      // Invader Faction
      const bulletSpeed = this.type === EnemyType.BOSS ? 300 : 200;
      const b = new Bullet(spawnX, spawnY, bulletSpeed, 1, false);
      b.faction = this.faction;

      if (this.type === EnemyType.SNIPER) {
        b.isInterceptable = true;
        
        let targetCenter: Vector2D | null = null;
        let minDistance = Infinity;

        if (playerPos && Number.isFinite(playerPos.x) && Number.isFinite(playerPos.y)) {
          const px = playerPos.x + 25;
          const py = playerPos.y + 20;
          minDistance = Math.hypot(px - spawnX, py - spawnY);
          targetCenter = { x: px, y: py };
        }

        for (const e of allEnemies) {
          if (!e.isDead && e.faction === Faction.ROGUE) {
            const ex = e.position.x + e.size.width / 2;
            const ey = e.position.y + e.size.height / 2;
            const dist = Math.hypot(ex - spawnX, ey - spawnY);
            if (dist < minDistance) {
              minDistance = dist;
              targetCenter = { x: ex, y: ey };
            }
          }
        }

        if (targetCenter) {
          const dx = targetCenter.x - spawnX;
          const dy = targetCenter.y - spawnY;
          const angle = Math.atan2(dy, dx);
          const speed = 400; // sniper bullets are fast
          b.velocity.x = Math.cos(angle) * speed;
          b.velocity.y = Math.sin(angle) * speed;
        }
      }
      
      return b;
    }
    return null;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    const w = this.size.width;
    const h = this.size.height;
    const time = Date.now() / 1000;

    // Shield Aura
    if (this.type === EnemyType.SHIELDED && this.shieldHp > 0) {
      ctx.save();
      const shieldPulse = Math.sin(time * 6) * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, w / 2 + 8 + shieldPulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${0.2 + this.shieldHp * 0.15})`;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
      
      // Hexagonal forcefield lattice
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + time;
        const rad = w / 2 + 6;
        const hx = cx + Math.cos(angle) * rad;
        const hy = cy + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    
    const isFlashing = this.hitFlashTimer > 0;
    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
    } else {
      ctx.fillStyle = this.color;
    }

    // 100% Pure Procedural Vector Art Overhaul (No legacy raster JPG bypass)
    if (this.type === EnemyType.SNIPER) {
      // ----------------------------------------------------------------------
      // SNIPER: Deep-Sea Anglerfish / Monocle Sniper (Lavender-Amethyst & Cyan Lure)
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx, cy - h/2, cx, cy + h/2);
        grad.addColorStop(0, '#d8b4fe'); // Light Lavender
        grad.addColorStop(0.5, '#a855f7'); // Vivid Purple
        grad.addColorStop(1, '#6b21a8'); // Deep Amethyst
        ctx.fillStyle = grad;
      }

      // Sleek streamlined angler teardrop hull
      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2 + 2); // Tapered snout pointing forward
      ctx.bezierCurveTo(cx + w/2 + 2, cy + 2, cx + w/2 - 2, cy - h/2 + 2, cx, cy - h/2);
      ctx.bezierCurveTo(cx - w/2 + 2, cy - h/2 + 2, cx - w/2 - 2, cy + 2, cx, cy + h/2 + 2);
      ctx.fill();

      // Side pectoral fins
      if (!isFlashing) {
        ctx.fillStyle = '#c084fc';
        const finWobble = Math.sin(time * 8) * 3;
        ctx.beginPath();
        ctx.ellipse(cx - w/2, cy - 2, 4, 8 + finWobble, Math.PI / 6, 0, Math.PI * 2);
        ctx.ellipse(cx + w/2, cy - 2, 4, 8 - finWobble, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Extended Angler Antenna extending forward toward targets
        ctx.strokeStyle = '#e9d5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - h/4);
        ctx.quadraticCurveTo(cx + 12, cy + h/4, cx + 2, cy + h/2 + 12);
        ctx.stroke();

        // Glowing Bioluminescent Targeting Scope Bulb
        const scopePulse = Math.sin(time * 8) * 2;
        ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
        ctx.beginPath();
        ctx.arc(cx + 2, cy + h/2 + 12, 6 + scopePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(cx + 2, cy + h/2 + 12, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 2, cy + h/2 + 12, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Cute Sniper Face: Left eye focused through gold sniper monocle, right eye determined wink
        // Left Monocle Eye:
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(cx - 7, cy - 2, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#facc15'; // Gold rim
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Monocle crosshair
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 2); ctx.lineTo(cx - 4, cy - 2);
        ctx.moveTo(cx - 7, cy - 5); ctx.lineTo(cx - 7, cy + 1);
        ctx.stroke();

        // Right Winking Eye:
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 4, cy - 4);
        ctx.lineTo(cx + 8, cy - 1);
        ctx.stroke();

        // Cute blush
        ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
        ctx.beginPath();
        ctx.arc(cx + 8, cy + 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === EnemyType.NORMAL) {
      // ----------------------------------------------------------------------
      // NORMAL MOB: Chubby Baby Dumpling Squid (Vibrant Sky Cyan & Soft Blue)
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createRadialGradient(cx, cy - 4, 3, cx, cy, w/1.5);
        grad.addColorStop(0, '#7dd3fc'); // Sky Light Cyan
        grad.addColorStop(0.6, '#38bdf8'); // Sky Blue
        grad.addColorStop(1, '#0284c7'); // Ocean Blue
        ctx.fillStyle = grad;
      }

      // Chubby dome mantle
      ctx.beginPath();
      ctx.moveTo(cx - w/2 + 3, cy + 2);
      ctx.bezierCurveTo(cx - w/2, cy - h/2 - 4, cx + w/2, cy - h/2 - 4, cx + w/2 - 3, cy + 2);
      ctx.bezierCurveTo(cx + w/4, cy + 6, cx - w/4, cy + 6, cx - w/2 + 3, cy + 2);
      ctx.fill();

      // 4 Bouncy curly tentacles
      if (!isFlashing) {
        const tentacleWidth = w / 6.5;
        for (let i = 0; i < 4; i++) {
          const tx = cx - w/2 + 5 + i * (tentacleWidth * 1.55);
          const wave = Math.sin(time * 6 + i * 1.3) * 4;
          ctx.beginPath();
          ctx.moveTo(tx, cy + 4);
          ctx.quadraticCurveTo(tx + wave, cy + h/2 + 2, tx + wave * 0.5, cy + h/2 + 6);
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Adorable Big Glossy Eyes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(cx - 7, cy - 3, 3.5, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 7, cy - 3, 3.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Twin Sparkle Eye Highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Primary shine
        ctx.arc(cx - 8, cy - 5, 1.8, 0, Math.PI * 2);
        ctx.arc(cx + 6, cy - 5, 1.8, 0, Math.PI * 2);
        // Secondary shine
        ctx.arc(cx - 6, cy - 1, 0.9, 0, Math.PI * 2);
        ctx.arc(cx + 8, cy - 1, 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Rosy Pink Cheeks
        ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
        ctx.beginPath();
        ctx.arc(cx - 12, cy + 1, 3, 0, Math.PI * 2);
        ctx.arc(cx + 12, cy + 1, 3, 0, Math.PI * 2);
        ctx.fill();

        // Cute smiling mouth 'u'
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.2, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
      }
    } else if (this.type === EnemyType.ZIGZAG) {
      // ----------------------------------------------------------------------
      // ZIGZAG: Electric Star-Manta (Radiant Lemon Yellow & Golden Honey)
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, w/1.8);
        grad.addColorStop(0, '#fef08a'); // Bright Lemon
        grad.addColorStop(0.5, '#eab308'); // Honey Gold
        grad.addColorStop(1, '#ea580c'); // Warm Amber
        ctx.fillStyle = grad;
      }

      // 5-Pointed Rounded Star Body
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2 + Math.sin(time * 4) * 0.1;
        const innerAngle = outerAngle + Math.PI / 5;
        const outerR = w / 2;
        const innerR = w / 3.8;
        const ox = cx + Math.cos(outerAngle) * outerR;
        const oy = cy + Math.sin(outerAngle) * outerR;
        const ix = cx + Math.cos(innerAngle) * innerR;
        const iy = cy + Math.sin(innerAngle) * innerR;

        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.quadraticCurveTo(cx + Math.cos(outerAngle - 0.3) * (innerR * 1.3), cy + Math.sin(outerAngle - 0.3) * (innerR * 1.3), ox, oy);
        ctx.quadraticCurveTo(cx + Math.cos(innerAngle - 0.3) * (innerR * 0.9), cy + Math.sin(innerAngle - 0.3) * (innerR * 0.9), ix, iy);
      }
      ctx.closePath();
      ctx.fill();

      if (!isFlashing) {
        // Happy Energetic Face (^ ▽ ^)
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#451a03';
        ctx.beginPath();
        // Curved happy eyes
        ctx.arc(cx - 6, cy - 2, 3, Math.PI, Math.PI * 2);
        ctx.arc(cx + 6, cy - 2, 3, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Open smile
        ctx.beginPath();
        ctx.arc(cx, cy + 1, 3.5, 0, Math.PI);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Lightning bolt cheek blush
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - 11, cy + 1); ctx.lineTo(cx - 8, cy + 3); ctx.lineTo(cx - 10, cy + 5);
        ctx.moveTo(cx + 11, cy + 1); ctx.lineTo(cx + 8, cy + 3); ctx.lineTo(cx + 10, cy + 5);
        ctx.stroke();
      }
    } else if (this.type === EnemyType.DIVER) {
      // ----------------------------------------------------------------------
      // DIVER: Rocket Torpedo Piranha (Coral Crimson & Fiery Rocket Plume)
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx, cy - h/2, cx, cy + h/2);
        grad.addColorStop(0, '#fb923c'); // Bright Tangerine
        grad.addColorStop(0.5, '#ef4444'); // Coral Crimson
        grad.addColorStop(1, '#991b1b'); // Dark Crimson
        ctx.fillStyle = grad;
      }

      // Streamlined Torpedo Body
      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2 + 4); // Pointed nose downward
      ctx.bezierCurveTo(cx + w/2 + 4, cy + 2, cx + w/2, cy - h/2, cx, cy - h/2);
      ctx.bezierCurveTo(cx - w/2, cy - h/2, cx - w/2 - 4, cy + 2, cx, cy + h/2 + 4);
      ctx.fill();

      if (!isFlashing) {
        // Rocket Bubble Jet Exhaust (at the top rear)
        const flameHeight = 10 + Math.random() * 8;
        const flameGrad = ctx.createLinearGradient(cx, cy - h/2, cx, cy - h/2 - flameHeight);
        flameGrad.addColorStop(0, '#fde047');
        flameGrad.addColorStop(0.6, '#f97316');
        flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - h/2);
        ctx.lineTo(cx, cy - h/2 - flameHeight);
        ctx.lineTo(cx + 6, cy - h/2);
        ctx.fill();

        // Scuba / Aviator Goggles on forehead
        ctx.fillStyle = '#0284c7';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(cx - 10, cy - 6, 20, 8, 3);
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Determined Eyes & Little Piranha Fang
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 2, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cx - 4.5, cy - 2, 1.2, 0, Math.PI * 2);
        ctx.arc(cx + 4.5, cy - 2, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Tiny cute fang '▽'
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy + 6); ctx.lineTo(cx, cy + 9); ctx.lineTo(cx + 2, cy + 6);
        ctx.fill();
      }
    } else if (this.type === EnemyType.SHIELDED) {
      // ----------------------------------------------------------------------
      // SHIELDED: Armored Bubble Turtle / Nautilus (Jade Green & Mint Carapace)
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy - h/2, cx + w/2, cy + h/2);
        grad.addColorStop(0, '#2dd4bf'); // Mint Jade
        grad.addColorStop(0.5, '#0d9488'); // Deep Teal
        grad.addColorStop(1, '#047857'); // Emerald Green
        ctx.fillStyle = grad;
      }

      // Hexagonal Rounded Carapace Shell
      ctx.beginPath();
      ctx.moveTo(cx, cy - h/2);
      ctx.lineTo(cx + w/2 - 2, cy - h/4);
      ctx.lineTo(cx + w/2 - 2, cy + h/4);
      ctx.lineTo(cx, cy + h/2);
      ctx.lineTo(cx - w/2 + 2, cy + h/4);
      ctx.lineTo(cx - w/2 + 2, cy - h/4);
      ctx.closePath();
      ctx.fill();

      if (!isFlashing) {
        // Shell Scute Patterns
        ctx.strokeStyle = '#5eead4';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cute Sleepy Turtle Face peeking from shell bottom
        ctx.fillStyle = '#a7f3d0';
        ctx.beginPath();
        ctx.arc(cx, cy + h/4 + 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Chill / Sleepy Eyes (- -)
        ctx.strokeStyle = '#064e3b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy + h/4 + 1); ctx.lineTo(cx - 1, cy + h/4 + 1);
        ctx.moveTo(cx + 1, cy + h/4 + 1); ctx.lineTo(cx + 4, cy + h/4 + 1);
        ctx.stroke();

        // Blush
        ctx.fillStyle = 'rgba(244, 114, 182, 0.5)';
        ctx.beginPath();
        ctx.arc(cx - 3, cy + h/4 + 4, 1.5, 0, Math.PI * 2);
        ctx.arc(cx + 3, cy + h/4 + 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === EnemyType.SPLITTER) {
      // ----------------------------------------------------------------------
      // SPLITTER: Mitosis Slime Amoeba (Poison Emerald & Mint Green Dual-Core)
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy, cx + w/2, cy);
        grad.addColorStop(0, '#86efac'); // Mint Green
        grad.addColorStop(0.5, '#22c55e'); // Emerald
        grad.addColorStop(1, '#15803d'); // Deep Green
        ctx.fillStyle = grad;
      }

      // Peanut / Figure-8 Conjoined Mitosis Amoeba
      const wobbleL = Math.sin(time * 6) * 2;
      const wobbleR = Math.cos(time * 6) * 2;

      ctx.beginPath();
      ctx.arc(cx - 10, cy + wobbleL, 13, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy + wobbleR, 12, 0, Math.PI * 2);
      ctx.fill();

      if (!isFlashing) {
        // Connecting Jelly Membrane
        ctx.fillStyle = 'rgba(134, 239, 172, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Left Nucleus Face: Happy Smiling (・∀・)
        ctx.fillStyle = '#052e16';
        ctx.beginPath();
        ctx.arc(cx - 13, cy - 2 + wobbleL, 1.8, 0, Math.PI * 2);
        ctx.arc(cx - 7, cy - 2 + wobbleL, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx - 10, cy + 1 + wobbleL, 2, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        // Right Nucleus Face: Surprised (・o・)
        ctx.fillStyle = '#052e16';
        ctx.beginPath();
        ctx.arc(cx + 7, cy - 2 + wobbleR, 1.8, 0, Math.PI * 2);
        ctx.arc(cx + 13, cy - 2 + wobbleR, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 10, cy + 1 + wobbleR, 1.5, 0, Math.PI * 2);
        ctx.stroke();

        // Glowing Spore Pearls
        ctx.fillStyle = '#bef264';
        ctx.beginPath();
        ctx.arc(cx - 10, cy - 7 + wobbleL, 2, 0, Math.PI * 2);
        ctx.arc(cx + 10, cy + 7 + wobbleR, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === EnemyType.BOSS) {
      // ----------------------------------------------------------------------
      // BOSS: Coral Titan Leviathan (Royal Coral Crimson & Golden Coral Carapace)
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy - h/2, cx + w/2, cy + h/2);
        grad.addColorStop(0, '#f43f5e'); // Rose Coral
        grad.addColorStop(0.5, '#dc2626'); // Imperial Crimson
        grad.addColorStop(1, '#881337'); // Deep Maroon
        ctx.fillStyle = grad;
      }

      // Majestic Titan Carapace (Rounded Heavy Hull)
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.position.x, this.position.y, w, h, 20);
        ctx.fill();
      } else {
        ctx.fillRect(this.position.x, this.position.y, w, h);
      }

      if (!isFlashing) {
        // Golden Coral Crystal Horns / Crown on Top
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        // Left horn
        ctx.moveTo(cx - 40, cy - h/2); ctx.lineTo(cx - 55, cy - h/2 - 16); ctx.lineTo(cx - 30, cy - h/2);
        // Center crown spike
        ctx.moveTo(cx - 15, cy - h/2); ctx.lineTo(cx, cy - h/2 - 22); ctx.lineTo(cx + 15, cy - h/2);
        // Right horn
        ctx.moveTo(cx + 30, cy - h/2); ctx.lineTo(cx + 55, cy - h/2 - 16); ctx.lineTo(cx + 40, cy - h/2);
        ctx.fill();

        // Articulated Coral Mandibles / Claws on Sides
        ctx.fillStyle = '#fb7185';
        const clawWobble = Math.sin(time * 3) * 4;
        // Left claw
        ctx.beginPath();
        ctx.moveTo(this.position.x - 10, cy);
        ctx.quadraticCurveTo(this.position.x - 25, cy + clawWobble, this.position.x + 10, cy + h/3);
        ctx.lineTo(this.position.x + 10, cy - h/3);
        ctx.fill();
        // Right claw
        ctx.beginPath();
        ctx.moveTo(this.position.x + w + 10, cy);
        ctx.quadraticCurveTo(this.position.x + w + 25, cy - clawWobble, this.position.x + w - 10, cy + h/3);
        ctx.lineTo(this.position.x + w - 10, cy - h/3);
        ctx.fill();

        // Glowing Aquatic Power Core Reactor (Cyan)
        const corePulse = Math.sin(time * 4) * 3;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.beginPath();
        ctx.arc(cx, cy + 12, 20 + corePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(cx, cy + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy + 12, 5, 0, Math.PI * 2);
        ctx.fill();

        // Multi-Cluster Expressive Titan Eyes (Golden Anime Sensor Clusters)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(cx - 32, cy - 14, 16, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 32, cy - 14, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden Irises
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx - 32, cy - 14, 8, 0, Math.PI * 2);
        ctx.arc(cx + 32, cy - 14, 8, 0, Math.PI * 2);
        ctx.fill();

        // Cute sparkle highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 34, cy - 17, 3, 0, Math.PI * 2);
        ctx.arc(cx + 30, cy - 17, 3, 0, Math.PI * 2);
        ctx.arc(cx - 30, cy - 11, 1.5, 0, Math.PI * 2);
        ctx.arc(cx + 34, cy - 11, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === EnemyType.ROGUE_DRONE) {
      // ----------------------------------------------------------------------
      // ROGUE DRONE: Cyber Manta Drone (Electric Magenta & Cyan Delta)
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy, cx + w/2, cy);
        grad.addColorStop(0, '#d946ef'); // Electric Magenta
        grad.addColorStop(0.5, '#c026d3'); // Fuchsia
        grad.addColorStop(1, '#a21caf'); // Deep Violet
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.lineTo(cx + w/2, cy - h/2 + 4);
      ctx.lineTo(cx + w/4, cy - h/2);
      ctx.lineTo(cx, cy - h/4);
      ctx.lineTo(cx - w/4, cy - h/2);
      ctx.lineTo(cx - w/2, cy - h/2 + 4);
      ctx.closePath();
      ctx.fill();

      if (!isFlashing) {
        // Dorsal Neon Spine & Cyan Visor
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(cx, cy + h/3);
        ctx.lineTo(cx + w/5, cy - h/4);
        ctx.lineTo(cx - w/5, cy - h/4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(cx - 5, cy - 2, 10, 4);

        // Gold Faction Insignia Diamond
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(cx, cy + 2); ctx.lineTo(cx + 3, cy + 6); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 3, cy + 6);
        ctx.fill();
      }
    } else if (this.type === EnemyType.ROGUE_STALKER) {
      // ----------------------------------------------------------------------
      // ROGUE STALKER: Orchid Predator Interceptor (Vivid Fuchsia & Ultraviolet)
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx, cy - h/2, cx, cy + h/2);
        grad.addColorStop(0, '#e879f9');
        grad.addColorStop(0.6, '#c026d3');
        grad.addColorStop(1, '#86198f');
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.lineTo(cx + w/2, cy);
      ctx.lineTo(cx + w/2 - 4, cy - h/2);
      ctx.lineTo(cx, cy - h/3);
      ctx.lineTo(cx - w/2 + 4, cy - h/2);
      ctx.lineTo(cx - w/2, cy);
      ctx.closePath();
      ctx.fill();

      if (!isFlashing) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(cx, cy + h/4);
        ctx.lineTo(cx + w/3, cy - h/5);
        ctx.lineTo(cx, cy - h/3);
        ctx.lineTo(cx - w/3, cy - h/5);
        ctx.closePath();
        ctx.fill();

        // Glowing Volt Scanner Visor
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cyan Diamond Insignia
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(cx, cy + 4); ctx.lineTo(cx + 4, cy + 8); ctx.lineTo(cx, cy + 12); ctx.lineTo(cx - 4, cy + 8);
        ctx.fill();
      }
    } else if (this.type === EnemyType.ROGUE_MECH) {
      // ----------------------------------------------------------------------
      // ROGUE MECH: High-Voltage Dark Magenta Armored Juggernaut
      // ----------------------------------------------------------------------
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy - h/2, cx + w/2, cy + h/2);
        grad.addColorStop(0, '#86198f');
        grad.addColorStop(0.5, '#c026d3');
        grad.addColorStop(1, '#701a75');
        ctx.fillStyle = grad;
      }

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(cx - w/2, cy - h/2, w, h, 8);
        ctx.fill();
      } else {
        ctx.fillRect(cx - w/2, cy - h/2, w, h);
      }

      if (!isFlashing) {
        // Shoulder Cannons
        ctx.fillStyle = '#c026d3';
        ctx.fillRect(cx - w/2 - 5, cy - h/3, 7, h/2);
        ctx.fillRect(cx + w/2 - 2, cy - h/3, 7, h/2);

        // Core Plate
        ctx.fillStyle = '#18181b';
        ctx.fillRect(cx - w/3, cy - h/3, (w * 2) / 3, (h * 2) / 3);

        // Multi-Spectrum Scanner Visor
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(cx - 10, cy - 5, 20, 5);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx - 4, cy - 4, 8, 3);

        // Inverted Chevron Insignia ▼
        ctx.fillStyle = '#d946ef';
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + 2); ctx.lineTo(cx + 5, cy + 2); ctx.lineTo(cx, cy + 9);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.faction === Faction.ROGUE) {
      // Generic Cyber Rogue Delta
      if (!isFlashing) {
        ctx.fillStyle = '#d946ef';
      }
      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.lineTo(cx + w/2, cy - h/2);
      ctx.lineTo(cx, cy - h/4);
      ctx.lineTo(cx - w/2, cy - h/2);
      ctx.closePath();
      ctx.fill();
      if (!isFlashing) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(cx - 4, cy - 4, 8, 8);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(cx - 3, cy - 2, 6, 3);
      }
    } else {
      // Fallback
      if (!isFlashing) {
        ctx.fillStyle = this.color;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

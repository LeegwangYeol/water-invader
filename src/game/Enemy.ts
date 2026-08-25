import { Entity } from './Entity';
import { Bullet } from './Bullet';
import { Vector2D } from './types';

export enum EnemyType {
  NORMAL,
  ZIGZAG,
  BOSS,
  SNIPER,
  DIVER,
  SHIELDED,
  SPLITTER
}

export class Enemy extends Entity {
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
  
  private fireTimer: number;
  public canEvade: boolean = false;
  private evadeCooldown: number = 0;
  
  public isDiving: boolean = false;
  public shieldHp: number = 0;
  public shieldRegenTimer: number = 0;
  public level: number = 1;
  public canvasHeight: number = 800;

  constructor(x: number, y: number, canvasWidth: number, level: number, type: EnemyType = EnemyType.NORMAL, canvasHeight: number = 800) {
    const validX = Number.isFinite(x) ? x : 0;
    const validY = Number.isFinite(y) ? y : 80;
    super(validX, validY, 40, 30);
    this.canvasWidth = Number.isFinite(canvasWidth) ? Math.max(100, canvasWidth) : 600;
    this.canvasHeight = Number.isFinite(canvasHeight) ? Math.max(100, canvasHeight) : 800;
    this.startY = validY;
    this.position.x = Math.max(0, Math.min(validX, this.canvasWidth - this.size.width));
    this.position.y = Math.max(0, Math.min(validY, this.canvasHeight - this.size.height));
    this.level = Number.isFinite(level) && level >= 1 ? Math.floor(level) : 1;
    this.type = type;
    this.hp = 1 + Math.floor(this.level / 3);
    
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
    } else {
      this.color = '#f97316'; // Orange/Fire
      this.speedX += this.level * 5;
      this.canEvade = false; // 20% of normal enemies can evade
    }
    
    this.maxHp = this.hp;
    this.fireTimer = Math.random() * 3 + 1; // 1 to 4 seconds

    // Re-clamp position in case type-specific size altered dimensions (e.g. BOSS: 150x100 or SPLITTER: 50x40)
    const maxX = Math.max(0, this.canvasWidth - this.size.width);
    const maxY = Math.max(0, this.canvasHeight - this.size.height);
    this.position.x = Math.max(0, Math.min(this.position.x, maxX));
    this.position.y = Math.max(0, Math.min(this.position.y, maxY));
  }

  public update(deltaTime: number, speedMultiplier: number = 1.0, bullets: Bullet[] = [], playerPos?: Vector2D): void {
    if (!Number.isFinite(deltaTime) || deltaTime < 0) return;
    const clampedDt = Math.min(deltaTime, 0.1); // Guard against massive lag spikes / tab throttle jumps

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= clampedDt;
      if (this.hitFlashTimer < 0) this.hitFlashTimer = 0;
    }

    const validSpeedMultiplier = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : 1.0;
    const gnawMultiplier = this.isGnawing ? 0.2 : 1.0;
    const currentSpeedX = this.speedX * validSpeedMultiplier * gnawMultiplier;
    const currentSpeedY = this.speedY * validSpeedMultiplier * gnawMultiplier;

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
      // Trajectory safety: clamp to canvas bottom bound + margin to prevent unbounded runaway / NaN
      const maxDiverY = this.canvasHeight + 50;
      this.position.y = Math.max(0, Math.min(maxDiverY, this.position.y));
      // Diver NaN & boundary safety guard
      if (!Number.isFinite(this.position.y)) this.position.y = maxDiverY;
      if (!Number.isFinite(this.position.x)) this.position.x = 0;
      if (this.position.x < 0) this.position.x = 0;
      const maxDiverX = Math.max(0, this.canvasWidth - this.size.width);
      if (this.position.x > maxDiverX) this.position.x = maxDiverX;
      return; // Skip normal movement
    }

    this.position.y += currentSpeedY * clampedDt;

    // Strict Y-Axis Boundary Clamping for standard downward or zigzag movements (R1)
    // Ensures standard downward / zigzag movements are strictly clamped so enemies do not overlap player UI or exit abnormally
    const maxY = Math.max(0, this.canvasHeight - this.size.height);
    this.position.y = Math.max(0, Math.min(this.position.y, maxY));

    // Safeguard position values against NaN corruption
    if (!Number.isFinite(this.position.y)) this.position.y = maxY;
    if (!Number.isFinite(this.position.x)) this.position.x = 0;

    // Shield Regen Logic
    if (this.type === EnemyType.SHIELDED && this.shieldHp <= 0) {
      this.shieldRegenTimer -= clampedDt;
      if (this.shieldRegenTimer <= 0) {
        this.shieldHp = 3; // Regenerate shield
        this.shieldRegenTimer = 0;
      }
    }

    // Evasive maneuver logic
    if (this.canEvade && this.evadeCooldown <= 0) {
      const incoming = bullets.find(b => 
        b.isPlayerBullet && 
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

    if (this.type === EnemyType.ZIGZAG) {
      this.position.x += currentSpeedX * this.direction * clampedDt;
      this.position.x += Math.sin(Date.now() / 200) * 5 * validSpeedMultiplier;
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

  public fire(playerPos?: Vector2D): Bullet | null {
    if (this.isDiving) return null; // divers don't shoot while diving

    if (this.fireTimer <= 0) {
      this.fireTimer = Math.random() * 3 + (this.type === EnemyType.BOSS ? 0.5 : 2); // Reset timer
      
      const spawnX = this.position.x + this.size.width / 2 - 3;
      const spawnY = this.position.y + this.size.height;
      const bulletSpeed = this.type === EnemyType.BOSS ? 300 : 200;

      const b = new Bullet(spawnX, spawnY, bulletSpeed, 1, false);

      if (this.type === EnemyType.SNIPER && playerPos && Number.isFinite(playerPos.x) && Number.isFinite(playerPos.y)) {
        b.isInterceptable = true;
        // Aim at player
        const dx = (playerPos.x + 25) - spawnX;
        const dy = (playerPos.y + 20) - spawnY;
        const angle = Math.atan2(dy, dx);
        const speed = 400; // sniper bullets are fast
        b.velocity.x = Math.cos(angle) * speed;
        b.velocity.y = Math.sin(angle) * speed;
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

    // Shield Aura
    if (this.type === EnemyType.SHIELDED && this.shieldHp > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, w/2 + 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${0.2 + this.shieldHp * 0.1})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
    }
    
    const isFlashing = this.hitFlashTimer > 0;
    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
    } else {
      ctx.fillStyle = this.color;
    }
    
    if (this.type === EnemyType.BOSS) {
      // Menacing Boss Skull/Machine
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.position.x, this.position.y, w, h, 15);
        ctx.fill();
      } else {
        ctx.fillRect(this.position.x, this.position.y, w, h);
      }
      // Eyes
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(cx - w/4, cy - 10, 15, 0, Math.PI*2);
      ctx.arc(cx + w/4, cy - 10, 15, 0, Math.PI*2);
      ctx.fill();
      // Angry glowing pupils
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx - w/4, cy - 10, 5, 0, Math.PI*2);
      ctx.arc(cx + w/4, cy - 10, 5, 0, Math.PI*2);
      ctx.fill();
      // Mouth grille
      ctx.fillStyle = '#111827';
      for(let i=0; i<5; i++) {
        ctx.fillRect(cx - 40 + i*20, cy + 20, 10, 20);
      }
    } else if (this.type === EnemyType.SNIPER) {
      // Sleek Triangle/Diamond (pointing down)
      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.lineTo(cx + w/2, cy - h/2);
      ctx.lineTo(cx, cy - h/4);
      ctx.lineTo(cx - w/2, cy - h/2);
      ctx.closePath();
      ctx.fill();
      // Eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - h/4 - 5);
      ctx.lineTo(cx + 10, cy - h/4 - 5);
      ctx.lineTo(cx, cy);
      ctx.fill();
    } else if (this.type === EnemyType.DIVER) {
      // Teardrop / Rocket
      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.bezierCurveTo(cx + w/2 + 10, cy, cx + w/2, cy - h/2, cx, cy - h/2);
      ctx.bezierCurveTo(cx - w/2, cy - h/2, cx - w/2 - 10, cy, cx, cy + h/2);
      ctx.fill();
      // Engine flame
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - h/2);
      ctx.lineTo(cx, cy - h/2 - 15 - Math.random()*10);
      ctx.lineTo(cx + 8, cy - h/2);
      ctx.fill();
    } else if (this.type === EnemyType.ZIGZAG) {
      // Electric Star shape
      ctx.beginPath();
      for(let i=0; i<8; i++) {
        const radius = i % 2 === 0 ? w/2 : w/4;
        const angle = (i * Math.PI * 2) / 8 + (Date.now()/500);
        ctx.lineTo(cx + Math.cos(angle)*radius, cy + Math.sin(angle)*radius);
      }
      ctx.closePath();
      ctx.fill();
    } else if (this.type === EnemyType.SPLITTER) {
      // Two overlapping toxic bubbles
      ctx.beginPath();
      ctx.arc(cx - 6, cy, w/2.5, 0, Math.PI*2);
      ctx.arc(cx + 6, cy + 4, w/2.5, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx - 6, cy, 3, 0, Math.PI*2);
      ctx.arc(cx + 6, cy + 4, 3, 0, Math.PI*2);
      ctx.fill();
    } else if (this.type === EnemyType.SHIELDED) {
      // Bulky Armored Hexagon
      ctx.beginPath();
      ctx.moveTo(cx, cy - h/2);
      ctx.lineTo(cx + w/2, cy - h/4);
      ctx.lineTo(cx + w/2, cy + h/4);
      ctx.lineTo(cx, cy + h/2);
      ctx.lineTo(cx - w/2, cy + h/4);
      ctx.lineTo(cx - w/2, cy - h/4);
      ctx.closePath();
      ctx.fill();
      // Armor lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - w/2, cy); ctx.lineTo(cx + w/2, cy);
      ctx.moveTo(cx, cy - h/2); ctx.lineTo(cx, cy + h/2);
      ctx.stroke();
    } else {
      // NORMAL: Classic space invader octopus blob
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(cx - w/2, cy - h/2, w, h/2 + 5, [10, 10, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(cx - w/2, cy - h/2, w, h/2 + 5);
      }
      // Tentacles
      const tW = w / 5;
      for (let i=0; i<3; i++) {
        const offset = Math.sin(Date.now()/200 + i) * 5;
        ctx.fillRect(cx - w/2 + i*(tW*2), cy, tW, h/2 + offset);
      }
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(cx - 10, cy - h/4, 6, 6);
      ctx.fillRect(cx + 4, cy - h/4, 6, 6);
    }
    
    ctx.restore();
  }
}

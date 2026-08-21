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
  private canvasWidth: number;
  public type: EnemyType = EnemyType.NORMAL;
  
  // Movement pattern
  private direction: number = 1; // 1 for right, -1 for left
  private speedX: number = 50;
  private speedY: number = 10;
  private startY: number;
  
  private fireTimer: number;
  public canEvade: boolean = false;
  private evadeCooldown: number = 0;
  
  public isDiving: boolean = false;
  public shieldHp: number = 0;
  private shieldRegenTimer: number = 0;

  constructor(x: number, y: number, canvasWidth: number, level: number, type: EnemyType = EnemyType.NORMAL) {
    super(x, y, 40, 30);
    this.canvasWidth = canvasWidth;
    this.startY = y;
    this.type = type;
    this.hp = 1 + Math.floor(level / 3);
    
    if (type === EnemyType.ZIGZAG) {
      this.color = '#eab308'; // Yellow
      this.speedX += level * 10 + 50; // faster
      this.hp = Math.max(1, this.hp - 1); // squishier
    } else if (type === EnemyType.BOSS) {
      this.color = '#dc2626'; // Dark red
      this.size.width = 150;
      this.size.height = 100;
      this.hp = level * 10;
      this.speedX += level * 2;
    } else if (type === EnemyType.SNIPER) {
      this.color = '#a855f7'; // Purple
      this.speedX = 20; // slow
      this.hp = Math.max(1, this.hp - 1);
    } else if (type === EnemyType.DIVER) {
      this.color = '#ef4444'; // Red
      this.speedX += level * 8;
    } else if (type === EnemyType.SHIELDED) {
      this.color = '#64748b'; // Slate
      this.shieldHp = 3;
    } else if (type === EnemyType.SPLITTER) {
      this.color = '#22c55e'; // Green
      this.size = { width: 50, height: 40 }; // slightly bigger
    } else {
      this.color = '#f97316'; // Orange/Fire
      this.speedX += level * 5;
      this.canEvade = Math.random() < 0.2; // 20% of normal enemies can evade
    }
    
    this.fireTimer = Math.random() * 3 + 1; // 1 to 4 seconds
  }

  public update(deltaTime: number, speedMultiplier: number = 1.0, bullets: Bullet[] = [], playerPos?: Vector2D): void {
    const currentSpeedX = this.speedX * speedMultiplier;
    const currentSpeedY = this.speedY * speedMultiplier;

    // Diver Logic
    if (this.type === EnemyType.DIVER && playerPos) {
      if (!this.isDiving && Math.abs((this.position.x + this.size.width/2) - (playerPos.x + 25)) < 20) {
        // Player is directly below!
        this.isDiving = true;
      }
    }

    if (this.isDiving) {
      this.position.y += currentSpeedY * 15 * deltaTime; // Dive very fast
      return; // Skip normal movement
    }

    this.position.y += currentSpeedY * deltaTime; // Constantly slowly move down

    // Shield Regen Logic
    if (this.type === EnemyType.SHIELDED && this.shieldHp <= 0) {
      this.shieldRegenTimer -= deltaTime;
      if (this.shieldRegenTimer <= 0) {
        this.shieldHp = 3; // Regenerate shield
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
      this.evadeCooldown -= deltaTime;
    }

    if (this.type === EnemyType.ZIGZAG) {
      this.position.x += currentSpeedX * this.direction * deltaTime;
      this.position.y += Math.sin(Date.now() / 200 + this.position.x) * 2 * speedMultiplier;
    } else {
      const evadeBoost = (this.evadeCooldown > 0.5) ? 1.5 : 1.0;
      this.position.x += currentSpeedX * evadeBoost * this.direction * deltaTime;
    }
    
    // Bounce off walls
    if (this.position.x <= 0 || this.position.x + this.size.width >= this.canvasWidth) {
      this.direction *= -1;
      this.position.y += (this.type === EnemyType.BOSS) ? 10 : 20; 
    }
    
    // Clamp
    if (this.position.x <= 0) this.position.x = 0;
    if (this.position.x + this.size.width >= this.canvasWidth) {
      this.position.x = this.canvasWidth - this.size.width;
    }
    
    this.fireTimer -= deltaTime * speedMultiplier;
  }

  public fire(playerPos?: Vector2D): Bullet | null {
    if (this.isDiving) return null; // divers don't shoot while diving

    if (this.fireTimer <= 0) {
      this.fireTimer = Math.random() * 3 + (this.type === EnemyType.BOSS ? 0.5 : 2); // Reset timer
      
      const spawnX = this.position.x + this.size.width / 2 - 3;
      const spawnY = this.position.y + this.size.height;
      const bulletSpeed = this.type === EnemyType.BOSS ? 300 : 200;

      const b = new Bullet(spawnX, spawnY, bulletSpeed, 1, false);

      if (this.type === EnemyType.SNIPER && playerPos) {
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

    // Draw Shield Aura if Shielded
    if (this.type === EnemyType.SHIELDED && this.shieldHp > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, this.size.width / 2 + 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${0.2 + this.shieldHp * 0.1})`; // Blue aura
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
    }
    
    ctx.fillStyle = this.color;
    
    if (this.type === EnemyType.BOSS) {
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.position.x, this.position.y, this.size.width, this.size.height, 20);
        ctx.fill();
      } else {
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
      }
      
      // Angry Boss Eyes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      // Left eye angry
      ctx.moveTo(this.position.x + 30, this.position.y + 35);
      ctx.lineTo(this.position.x + 50, this.position.y + 45);
      ctx.lineTo(this.position.x + 30, this.position.y + 45);
      ctx.fill();
      // Right eye angry
      ctx.beginPath();
      ctx.moveTo(this.position.x + this.size.width - 30, this.position.y + 35);
      ctx.lineTo(this.position.x + this.size.width - 50, this.position.y + 45);
      ctx.lineTo(this.position.x + this.size.width - 30, this.position.y + 45);
      ctx.fill();
    } else {
      // Smooth blob shape
      ctx.beginPath();
      ctx.moveTo(this.position.x + 10, this.position.y + 10);
      ctx.bezierCurveTo(cx, this.position.y - 10, this.position.x + this.size.width - 10, this.position.y + 10, this.position.x + this.size.width, cy);
      ctx.bezierCurveTo(this.position.x + this.size.width + 10, this.position.y + this.size.height, cx, this.position.y + this.size.height + 10, this.position.x, cy);
      ctx.bezierCurveTo(this.position.x - 10, this.position.y + 10, this.position.x + 10, this.position.y + 10, this.position.x + 10, this.position.y + 10);
      ctx.fill();
      
      // Diver Thruster
      if (this.isDiving) {
         ctx.fillStyle = '#fbbf24'; // Fire
         ctx.beginPath();
         ctx.moveTo(cx - 10, this.position.y - 5);
         ctx.lineTo(cx, this.position.y - 20 - Math.random() * 10);
         ctx.lineTo(cx + 10, this.position.y - 5);
         ctx.fill();
      } else if (this.type === EnemyType.DIVER) {
         // Small idle thruster
         ctx.fillStyle = '#fbbf24'; 
         ctx.beginPath();
         ctx.arc(cx, this.position.y, 4, 0, Math.PI*2);
         ctx.fill();
      }

      // Eyes (Angry)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      // left
      ctx.moveTo(cx - 10, cy - 6);
      ctx.lineTo(cx - 4, cy - 2);
      ctx.lineTo(cx - 10, cy - 2);
      ctx.fill();
      // right
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 6);
      ctx.lineTo(cx + 4, cy - 2);
      ctx.lineTo(cx + 10, cy - 2);
      ctx.fill();

      // Sniper Laser Sight
      if (this.type === EnemyType.SNIPER) {
         ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'; // Red laser
         ctx.beginPath();
         ctx.moveTo(cx, cy + 5);
         ctx.lineTo(cx - 2, cy + 250); // shoot down arbitrarily
         ctx.lineTo(cx + 2, cy + 250);
         ctx.fill();
      }
    }
    
    ctx.restore();
  }
}

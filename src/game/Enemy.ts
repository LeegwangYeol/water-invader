import { Entity } from './Entity';
import { Bullet } from './Bullet';

export enum EnemyType {
  NORMAL,
  ZIGZAG,
  BOSS
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
    } else {
      this.color = '#f97316'; // Orange/Fire
      this.speedX += level * 5;
      this.canEvade = Math.random() < 0.2; // 20% of normal enemies can evade
    }
    
    this.fireTimer = Math.random() * 3 + 1; // 1 to 4 seconds
  }

  public update(deltaTime: number, speedMultiplier: number = 1.0, bullets: Bullet[] = []): void {
    const currentSpeedX = this.speedX * speedMultiplier;
    const currentSpeedY = this.speedY * speedMultiplier;

    this.position.y += currentSpeedY * deltaTime; // Constantly slowly move down

    // Evasive maneuver logic
    if (this.canEvade && this.evadeCooldown <= 0) {
      // Check for incoming player bullets
      const incoming = bullets.find(b => 
        b.isPlayerBullet && 
        b.position.y > this.position.y && // below the enemy
        b.position.y - this.position.y < 250 && // within threat range
        Math.abs(b.position.x - this.position.x) < this.size.width + 10 // directly below
      );
      if (incoming) {
        // Dodge! Swap direction
        this.direction = (incoming.position.x > this.position.x + this.size.width / 2) ? -1 : 1;
        this.evadeCooldown = 1.5; // Cooldown before next dodge
      }
    }
    if (this.evadeCooldown > 0) {
      this.evadeCooldown -= deltaTime;
    }

    if (this.type === EnemyType.ZIGZAG) {
      this.position.x += currentSpeedX * this.direction * deltaTime;
      this.position.y += Math.sin(Date.now() / 200 + this.position.x) * 2 * speedMultiplier;
    } else {
      // Normal / Boss logic. Evasive enemies move 50% faster while evading
      const evadeBoost = (this.evadeCooldown > 0.5) ? 1.5 : 1.0;
      this.position.x += currentSpeedX * evadeBoost * this.direction * deltaTime;
    }
    
    // Bounce off walls
    if (this.position.x <= 0 || this.position.x + this.size.width >= this.canvasWidth) {
      this.direction *= -1;
      this.position.y += (this.type === EnemyType.BOSS) ? 10 : 20; 
    }
    
    // Clamp to prevent getting stuck
    if (this.position.x <= 0) this.position.x = 0;
    if (this.position.x + this.size.width >= this.canvasWidth) {
      this.position.x = this.canvasWidth - this.size.width;
    }
    
    // Bosses fire faster as speed multiplier increases
    this.fireTimer -= deltaTime * speedMultiplier;
  }

  public fire(): Bullet | null {
    if (this.fireTimer <= 0) {
      this.fireTimer = Math.random() * 3 + (this.type === EnemyType.BOSS ? 0.5 : 2); // Reset timer
      return new Bullet(this.position.x + this.size.width / 2 - 3, this.position.y + this.size.height, this.type === EnemyType.BOSS ? 300 : 200, 1, false);
    }
    return null;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    
    if (this.type === EnemyType.BOSS) {
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.position.x, this.position.y, this.size.width, this.size.height, 20);
        ctx.fill();
      } else {
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
      }
      
      // Boss Eyes
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(this.position.x + 40, this.position.y + 40, 10, 0, Math.PI * 2);
      ctx.arc(this.position.x + this.size.width - 40, this.position.y + 40, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw smooth blob-like enemy shape
      ctx.beginPath();
      const cx = this.position.x + this.size.width / 2;
      const cy = this.position.y + this.size.height / 2;
      
      ctx.moveTo(this.position.x + 10, this.position.y + 10);
      ctx.bezierCurveTo(cx, this.position.y - 10, this.position.x + this.size.width - 10, this.position.y + 10, this.position.x + this.size.width, cy);
      ctx.bezierCurveTo(this.position.x + this.size.width + 10, this.position.y + this.size.height, cx, this.position.y + this.size.height + 10, this.position.x, cy);
      ctx.bezierCurveTo(this.position.x - 10, this.position.y + 10, this.position.x + 10, this.position.y + 10, this.position.x + 10, this.position.y + 10);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(this.position.x + 15, this.position.y + 12, 3, 0, Math.PI * 2);
      ctx.arc(this.position.x + 28, this.position.y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

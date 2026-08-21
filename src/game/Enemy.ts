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
    public isGnawing: boolean = false;
  
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
      this.canEvade = false; // 20% of normal enemies can evade
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
      this.position.y += currentSpeedY * 6 * deltaTime; // Dive very fast
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
      this.position.y += Math.sin(Date.now() / 500) * 2 * speedMultiplier;
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
    
    ctx.fillStyle = this.color;
    
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

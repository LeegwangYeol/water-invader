import { Entity } from './Entity';
import { Bullet } from './Bullet';
import { Barricade } from './Barricade';
import { soundManager } from './SoundManager';

export enum HelperType {
  FIGHTER,
  REPAIRER,
  TANK
}

export class Helper extends Entity {
  public type: HelperType;
  public hp: number;
  public maxHp: number;
  public isInvincible: boolean;
  
  private canvasWidth: number;
  private canvasHeight: number;
  private fireTimer: number = 0;
  private lifespan: number = 15; // stays for 15 seconds
  private targetX: number;
  
  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number, type: HelperType) {
    super(x, y, 40, 30); // similar size to player
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.type = type;
    this.targetX = Math.random() * (canvasWidth - this.size.width);
    
    switch (type) {
      case HelperType.FIGHTER:
        this.color = '#4ade80'; // Green
        this.hp = 3;
        this.maxHp = 3;
        this.isInvincible = false;
        break;
      case HelperType.REPAIRER:
        this.color = '#fbbf24'; // Yellow
        this.hp = 1;
        this.maxHp = 1;
        this.isInvincible = true;
        this.lifespan = 8; // short lifespan, repairs quickly
        break;
      case HelperType.TANK:
        this.color = '#a855f7'; // Purple
        this.hp = 15; // Absorbs a lot of hits
        this.maxHp = 15;
        this.isInvincible = false;
        this.lifespan = 20;
        break;
    }
  }

  public update(deltaTime: number, barricades: Barricade[]): Bullet[] {
    this.lifespan -= deltaTime;
    const bullets: Bullet[] = [];
    
    // Move towards target
    const dx = this.targetX - this.position.x;
    if (Math.abs(dx) > 10) {
      this.position.x += Math.sign(dx) * 200 * deltaTime;
    } else {
      // Pick new target
      this.targetX = Math.random() * (this.canvasWidth - this.size.width);
    }
    
    // Bounce Y slightly
    this.position.y += Math.sin(Date.now() / 200) * 0.5;

    // Behaviors
    if (this.type === HelperType.FIGHTER) {
      this.fireTimer -= deltaTime;
      if (this.fireTimer <= 0) {
        this.fireTimer = 0.5; // shoot every 0.5s
        bullets.push(new Bullet(this.position.x + this.size.width / 2, this.position.y, -500, 1, true, false));
        soundManager.playShoot();
      }
    } else if (this.type === HelperType.REPAIRER) {
      // randomly find a broken block and fix it
      if (Math.random() < 0.2) {
         const b = barricades[Math.floor(Math.random() * barricades.length)];
         if (b && b.blocks) {
            for (let i = 0; i < b.blocks.length; i++) {
                if (!b.blocks[i]) {
                    b.blocks[i] = true;
                    b.hp = Math.min(b.maxHp, b.hp + 5);
                    break;
                }
            }
         }
      }
    } else if (this.type === HelperType.TANK) {
       this.targetX = this.canvasWidth / 2 + Math.sin(Date.now() / 1000) * 200;
    }
    
    // Clamp
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.size.width > this.canvasWidth) this.position.x = this.canvasWidth - this.size.width;
    
    return bullets;
  }
  
  public isExpired(): boolean {
    return this.lifespan <= 0 || (this.hp <= 0 && !this.isInvincible);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    
    ctx.fillStyle = this.color;
    ctx.globalAlpha = (this.lifespan < 3) ? (Math.sin(this.lifespan * 15) > 0 ? 1 : 0.4) : 1;
    
    // Draw body (droplet like player but different color)
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, this.size.width / 2, this.size.height / 2 - 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy, 4, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 8, cy, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy, 2, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 8, cy, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    if (!this.isInvincible) {
       ctx.fillText(`HP:${this.hp}`, cx, this.position.y - 5);
    } else {
       ctx.fillText(`INV`, cx, this.position.y - 5);
    }
    
    ctx.restore();
  }
}

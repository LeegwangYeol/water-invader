import { Entity } from './Entity';

export class Bullet extends Entity {
  public damage: number;
  public isPlayerBullet: boolean;
  public piercing: number;

  constructor(x: number, y: number, speedY: number, damage: number, isPlayerBullet: boolean, piercing: number = 1) {
    super(x, y, 6, 12);
    this.velocity.y = speedY;
    this.damage = damage;
    this.isPlayerBullet = isPlayerBullet;
    this.piercing = piercing;
    this.color = isPlayerBullet ? '#60a5fa' : '#ef4444'; // blue for player, red for enemy
  }

  public update(deltaTime: number): void {
    this.position.y += this.velocity.y * deltaTime;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    
    if (this.isPlayerBullet) {
      // Draw as a water drop
      ctx.arc(this.position.x + this.size.width / 2, this.position.y + this.size.height, this.size.width / 2, 0, Math.PI);
      ctx.moveTo(this.position.x, this.position.y + this.size.height);
      ctx.lineTo(this.position.x + this.size.width / 2, this.position.y);
      ctx.lineTo(this.position.x + this.size.width, this.position.y + this.size.height);
      ctx.fill();
    } else {
      // Enemy bullet (fire/pollution)
      ctx.arc(this.position.x + this.size.width / 2, this.position.y + this.size.height / 2, this.size.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

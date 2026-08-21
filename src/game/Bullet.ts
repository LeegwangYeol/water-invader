import { Entity } from './Entity';

export class Bullet extends Entity {
  public damage: number;
  public isPlayerBullet: boolean;

  constructor(x: number, y: number, velocityY: number, damage: number, isPlayerBullet: boolean) {
    // Water drop style for player, fireball for enemies
    super(x, y, 6, 15);
    this.velocity.y = velocityY;
    this.damage = damage;
    this.isPlayerBullet = isPlayerBullet;
    this.color = isPlayerBullet ? '#4ade80' : '#ef4444'; // green/blueish water vs red fire
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

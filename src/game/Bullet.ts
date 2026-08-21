import { Entity } from './Entity';

export class Bullet extends Entity {
  public damage: number;
  public isPlayerBullet: boolean;
  public piercing: number;
  public isInterceptable: boolean = false;

  constructor(x: number, y: number, speedY: number, damage: number, isPlayerBullet: boolean, piercing: number = 1) {
    // Increase size for better visibility
    const width = isPlayerBullet ? 6 : 10;
    const height = isPlayerBullet ? 12 : 10;
    
    super(x, y, width, height);
    this.velocity.y = speedY;
    this.damage = damage;
    this.isPlayerBullet = isPlayerBullet;
    this.piercing = piercing;
    this.color = isPlayerBullet ? '#60a5fa' : '#ef4444'; // blue for player, red for enemy
  }

  public update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime; // Add X velocity update for angled bullets (like ultimate/zigzag)
    this.position.y += this.velocity.y * deltaTime;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.color;
    
    if (this.isPlayerBullet) {
      // Fake glow for player bullet
      ctx.globalAlpha = 0.5;
      if (this.isInterceptable) { ctx.fillStyle = "#a855f7"; }
      ctx.beginPath();
      ctx.arc(this.position.x + this.size.width / 2, this.position.y + this.size.height - 3, this.size.width * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Draw as a water drop
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(this.position.x + this.size.width / 2, this.position.y + this.size.height, this.size.width / 2, 0, Math.PI);
      ctx.moveTo(this.position.x, this.position.y + this.size.height);
      ctx.lineTo(this.position.x + this.size.width / 2, this.position.y);
      ctx.lineTo(this.position.x + this.size.width, this.position.y + this.size.height);
      ctx.fill();
    } else {
      // Enemy bullet (Intense glowing orb)
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const radius = this.size.width / 2;
      
      // Fake Glow Outer (Much faster than shadowBlur)
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner bright core
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

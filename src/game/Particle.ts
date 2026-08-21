import { Entity } from './Entity';

export class Particle extends Entity {
  public lifeTime: number;
  public maxLifeTime: number;
  private alpha: number = 1;

  constructor(x: number, y: number, color: string) {
    super(x, y, Math.random() * 4 + 2, Math.random() * 4 + 2);
    this.color = color;
    
    // Random velocity for explosion effect
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 100 + 50; // pixels per second
    this.velocity.x = Math.cos(angle) * speed;
    this.velocity.y = Math.sin(angle) * speed;
    
    this.maxLifeTime = Math.random() * 0.5 + 0.2; // 0.2 to 0.7 seconds
    this.lifeTime = this.maxLifeTime;
  }

  public update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    this.lifeTime -= deltaTime;
    if (this.lifeTime <= 0) {
      this.isDead = true;
    }
    
    this.alpha = this.lifeTime / this.maxLifeTime;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

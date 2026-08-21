import { Entity } from './Entity';

export class Particle extends Entity {
  public lifeTime: number;
  public maxLifeTime: number;
  private alpha: number = 1;
  private gravity: number = 400; // pixels per second squared

  constructor(x: number, y: number, color: string, speedMult: number = 1.0) {
    super(x, y, Math.random() * 4 + 2, Math.random() * 4 + 2);
    this.color = color;
    
    // Random velocity for explosion effect
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 150 + 50) * speedMult; // pixels per second
    this.velocity.x = Math.cos(angle) * speed;
    this.velocity.y = Math.sin(angle) * speed;
    
    this.maxLifeTime = Math.random() * 0.4 + 0.3; // 0.3 to 0.7 seconds
    this.lifeTime = this.maxLifeTime;
  }

  public update(deltaTime: number): void {
    // Apply gravity and friction
    this.velocity.y += this.gravity * deltaTime;
    this.velocity.x *= 0.95; // friction
    
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    this.lifeTime -= deltaTime;
    if (this.lifeTime <= 0) {
      this.isDead = true;
    }
    
    this.alpha = Math.max(0, this.lifeTime / this.maxLifeTime);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Fake Glow (Much faster than shadowBlur)
    ctx.globalAlpha = this.alpha * 0.4;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size.width * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Core
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

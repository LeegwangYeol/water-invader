import { Entity } from './Entity';

export class Particle extends Entity {
  public lifeTime: number = 0;
  public maxLifeTime: number = 0;
  private alpha: number = 1;
  private gravity: number = 400; // pixels per second squared

  constructor(x: number, y: number, color: string, speedMult: number = 1.0) {
    super(x, y, 4, 4);
    this.init(x, y, color, speedMult);
  }

  public init(x: number, y: number, color: string, speedMult: number = 1.0): void {
    const size = Math.random() * 4 + 2;
    this.position.x = x;
    this.position.y = y;
    this.size.width = size;
    this.size.height = size;
    this.color = color;
    this.isDead = false;
    
    // Random velocity for explosion effect
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 150 + 50) * speedMult; // pixels per second
    this.velocity.x = Math.cos(angle) * speed;
    this.velocity.y = Math.sin(angle) * speed;
    
    this.maxLifeTime = Math.random() * 0.4 + 0.3; // 0.3 to 0.7 seconds
    this.lifeTime = this.maxLifeTime;
    this.alpha = 1;
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
    
    ctx.globalAlpha = 1.0;
  }
}

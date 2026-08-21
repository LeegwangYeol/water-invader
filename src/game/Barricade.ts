import { Entity } from './Entity';

export enum BarricadeType {
  DESTRUCTIBLE,
  INDESTRUCTIBLE
}

export class Barricade extends Entity {
  public hp: number;
  public maxHp: number;
  public type: BarricadeType;

  constructor(x: number, y: number, type: BarricadeType) {
    super(x, y, 60, 40);
    this.type = type;
    this.maxHp = 10;
    this.hp = this.maxHp;
    this.color = type === BarricadeType.DESTRUCTIBLE ? '#38bdf8' : '#94a3b8'; // Sky blue (ice) vs Slate (stone)
  }

  public update(deltaTime: number): void {
    // Barricades don't move
    if (this.type === BarricadeType.DESTRUCTIBLE && this.hp <= 0) {
      this.isDead = true;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // For destructible, lower opacity based on HP
    if (this.type === BarricadeType.DESTRUCTIBLE) {
      ctx.globalAlpha = Math.max(0.2, this.hp / this.maxHp);
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
    } else {
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#000000';
    }
    
    ctx.fillStyle = this.color;
    
    // Draw rounded block
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(this.position.x, this.position.y, this.size.width, this.size.height, 5);
    } else {
      ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    }
    ctx.fill();
    
    // Add some visual texture
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.position.x + 10, this.position.y + 10);
    ctx.lineTo(this.position.x + this.size.width - 10, this.position.y + 10);
    ctx.stroke();

    ctx.restore();
  }
}

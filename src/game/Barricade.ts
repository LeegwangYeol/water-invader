import { Entity } from './Entity';

export enum BarricadeType {
  DESTRUCTIBLE,
  INDESTRUCTIBLE
}

export class Barricade extends Entity {
  public hp: number;
  public maxHp: number;
  public type: BarricadeType;
  
  // Voxel-based destruction (6 columns x 4 rows)
  private cols = 6;
  private rows = 4;
  public blocks: boolean[];

  constructor(x: number, y: number, type: BarricadeType) {
    super(x, y, 60, 40);
    this.type = type;
    this.maxHp = 20; // 20 HP structural integrity for all barricades (destructible & indestructible)
    this.hp = this.maxHp;
    this.color = type === BarricadeType.DESTRUCTIBLE ? '#38bdf8' : '#94a3b8'; // Sky blue (ice) vs Slate (stone)
    
    this.blocks = new Array(this.cols * this.rows).fill(true);
  }

  public takeDamage(amount: number): void {
    if (this.type === BarricadeType.DESTRUCTIBLE) {
      this.hp -= amount;
      if (this.hp <= 0) {
        this.hp = 0;
        this.isDead = true;
      }
    }
  }

  // Bidirectional voxel block synchronization
  public update(deltaTime: number): void {
    const targetActiveBlocks = Math.round((Math.max(0, this.hp) / this.maxHp) * this.blocks.length);
    let currentActive = this.blocks.filter(b => b).length;
    if (currentActive > targetActiveBlocks) {
      // Deactivate blocks on damage
      while (currentActive > targetActiveBlocks) {
        const idx = Math.floor(Math.random() * this.blocks.length);
        if (this.blocks[idx]) {
          this.blocks[idx] = false;
          currentActive--;
        }
      }
    } else if (currentActive < targetActiveBlocks) {
      // Reconstruct blocks on healing/repair
      while (currentActive < targetActiveBlocks) {
        const idx = Math.floor(Math.random() * this.blocks.length);
        if (!this.blocks[idx]) {
          this.blocks[idx] = true;
          currentActive++;
        }
      }
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.color;
    
    const blockWidth = this.size.width / this.cols;
    const blockHeight = this.size.height / this.rows;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const index = r * this.cols + c;
        if (this.blocks[index]) {
          // Draw individual surviving block
          ctx.fillRect(
            this.position.x + c * blockWidth, 
            this.position.y + r * blockHeight, 
            blockWidth + 0.5, // +0.5 to prevent pixel gaps
            blockHeight + 0.5
          );
        }
      }
    }
    
    ctx.restore();
  }
}

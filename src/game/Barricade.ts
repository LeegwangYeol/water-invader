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
  private blocks: boolean[];

  constructor(x: number, y: number, type: BarricadeType) {
    super(x, y, 60, 40);
    this.type = type;
    this.maxHp = type === BarricadeType.DESTRUCTIBLE ? 20 : 1; // Buffed HP to 20 so it degrades smoothly
    this.hp = this.maxHp;
    this.color = type === BarricadeType.DESTRUCTIBLE ? '#38bdf8' : '#94a3b8'; // Sky blue (ice) vs Slate (stone)
    
    this.blocks = new Array(this.cols * this.rows).fill(true);
  }

  // We override hp setter or just update blocks in update() based on HP
  public update(deltaTime: number): void {
    if (this.type === BarricadeType.DESTRUCTIBLE) {
      // Calculate how many blocks should be active based on HP ratio
      const targetActiveBlocks = Math.ceil((this.hp / this.maxHp) * (this.cols * this.rows));
      let currentActive = this.blocks.filter(b => b).length;
      
      // Destroy random blocks until we match the target
      while (currentActive > targetActiveBlocks && currentActive > 0) {
        const activeIndices = this.blocks.map((b, i) => b ? i : -1).filter(i => i !== -1);
        if (activeIndices.length > 0) {
          const randomIndex = activeIndices[Math.floor(Math.random() * activeIndices.length)];
          this.blocks[randomIndex] = false;
          currentActive--;
        }
      }
      
      if (this.hp <= 0) {
        this.isDead = true;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    if (this.type === BarricadeType.DESTRUCTIBLE) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
    } else {
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#000000';
    }
    
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

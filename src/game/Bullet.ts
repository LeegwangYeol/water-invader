import { Entity } from './Entity';
import { Faction } from './types';

export class Bullet extends Entity {
  public damage: number;
  public piercing: number;
  public isInterceptable: boolean = false;
  public hasTriggeredNearMiss: boolean = false;
  public hitEntities: Set<Entity> = new Set<Entity>();
  public hitEntityIds: Set<string> = new Set<string>();

  public get isPlayerBullet(): boolean {
    return this.faction === Faction.PLAYER;
  }

  public set isPlayerBullet(val: boolean) {
    this.faction = val ? Faction.PLAYER : Faction.INVADER;
  }

  constructor(x: number, y: number, speedY: number, damage: number, isPlayerBullet: boolean = true, piercing: number = 1) {
    // Increase size for better visibility
    const isPlayer = isPlayerBullet;
    const width = isPlayer ? 6 : 10;
    const height = isPlayer ? 12 : 10;
    
    super(x, y, width, height);
    this.velocity.y = speedY;
    this.damage = damage;
    this.faction = isPlayer ? Faction.PLAYER : Faction.INVADER;
    this.piercing = piercing;
    this.color = isPlayer ? '#38bdf8' : '#ef4444'; // cyan for player, red for enemy
  }

  public update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime; // Add X velocity update for angled bullets (like ultimate/zigzag)
    this.position.y += this.velocity.y * deltaTime;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    if (this.faction === Faction.PLAYER) {
      // Player bullet: Bright Cyan with white core / water droplet
      const centerX = this.position.x + this.size.width / 2;
      
      // Fake glow for player bullet
      ctx.fillStyle = '#38bdf8';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height - 3, this.size.width * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Draw as a water drop
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height, this.size.width / 2, 0, Math.PI);
      ctx.moveTo(this.position.x, this.position.y + this.size.height);
      ctx.lineTo(centerX, this.position.y);
      ctx.lineTo(this.position.x + this.size.width, this.position.y + this.size.height);
      ctx.fill();

      // White core highlight
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height * 0.6, this.size.width * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.faction === Faction.ROGUE) {
      // Rogue bullet: Neon Lime (#84cc16) outer glow with bright Amber (#fef08a / #f59e0b) inner core
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const radius = this.size.width / 2;

      // Fake Glow Outer
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Mid glow
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.0, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright amber/yellow core
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Enemy/Invader bullet (Intense glowing orb: red/orange or purple for sniper/interceptable)
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const radius = this.size.width / 2;
      
      // Fake Glow Outer
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.isInterceptable ? '#a855f7' : (this.color || '#ef4444');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner bright core
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = this.isInterceptable ? '#f3e8ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}


import { Entity } from './Entity';
import { Faction } from './types';

export class Bullet extends Entity {
  public damage: number;
  public piercing: number;
  public isInterceptable: boolean = false;
  public hasTriggeredNearMiss: boolean = false;
  public hitEntities: Set<Entity> = new Set<Entity>();
  public shooter?: Entity;

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
      // -----------------------------------------------------------------
      // Player Bullet: High-Contrast Pure Water Spear
      // -----------------------------------------------------------------
      const centerX = this.position.x + this.size.width / 2;
      const rx = this.size.width / 2;

      // 1. High-Contrast Black Perimeter Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height - rx, rx + 0.5, 0, Math.PI);
      ctx.lineTo(centerX, this.position.y - 1);
      ctx.closePath();
      ctx.stroke();

      // 2. Outer Glow Halo
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height - rx, this.size.width * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // 3. Bright Cyan Droplet Body
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height - rx, rx, 0, Math.PI);
      ctx.lineTo(centerX, this.position.y);
      ctx.closePath();
      ctx.fill();

      // 4. Solid White Core Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height * 0.6, this.size.width * 0.3, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.faction === Faction.ROGUE) {
      // -----------------------------------------------------------------
      // Rogue Bullet: 4-Tier Neon Lime / Amber Energy Orb
      // -----------------------------------------------------------------
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const radius = this.size.width / 2;

      // Tier 1: 1.5px Black Perimeter Stroke Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Tier 2: Outer Glow
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Tier 3: Saturated Shell (Lime & Amber Ring)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Tier 4: White-Hot Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // -----------------------------------------------------------------
      // Invader / Boss / Sniper Bullet: 4-Tier High-Contrast Plasma Bolt
      // -----------------------------------------------------------------
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const radius = this.size.width / 2;
      const shellColor = this.isInterceptable ? '#a855f7' : (this.color || '#ef4444');

      // Tier 1: 1.5px Black Perimeter Stroke Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Tier 2: Outer Glow
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = shellColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Tier 3: Saturated Color Shell
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = shellColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      if (this.isInterceptable) {
        ctx.strokeStyle = '#f3e8ff';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // Tier 4: Solid White Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}


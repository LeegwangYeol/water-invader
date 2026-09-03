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
    this.prevPosition = { x: this.position.x, y: this.position.y };
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

      // Tier 1: Outer Glow Halo (Drawn behind outline)
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height - rx, this.size.width * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Tier 2: High-Contrast Black Armor Rim (2.0px stroke drawn on top of outer bloom)
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height - rx, rx + 1.0, 0, Math.PI);
      ctx.lineTo(centerX, this.position.y - 2);
      ctx.closePath();
      ctx.stroke();

      // Tier 3: Bright Cyan Droplet Body
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height - rx, rx, 0, Math.PI);
      ctx.lineTo(centerX, this.position.y);
      ctx.closePath();
      ctx.fill();

      // Tier 4: Solid White Core Highlight (Luminance = 1.0)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, this.position.y + this.size.height * 0.55, this.size.width * 0.35, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.faction === Faction.ROGUE) {
      // -----------------------------------------------------------------
      // Rogue Bullet: 4-Tier Neon Lime / Amber Energy Orb
      // -----------------------------------------------------------------
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const radius = this.size.width / 2;

      // Tier 1: Outer Glow Bloom (Drawn behind outline)
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Tier 2: 2.0px Black Armor Rim (Drawn on top of bloom for >= 7:1 contrast)
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 1.0, 0, Math.PI * 2);
      ctx.stroke();

      // Tier 3: Saturated Dual-Ring Shell (Lime & Amber Ring)
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Tier 4: White-Hot Core Focus
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.40, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // -----------------------------------------------------------------
      // Invader / Boss / Sniper Bullet: 4-Tier High-Contrast Plasma Bolt
      // -----------------------------------------------------------------
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const radius = this.size.width / 2;
      const shellColor = this.isInterceptable ? '#a855f7' : (this.color || '#ef4444');

      // Tier 1: Outer Atmospheric Bloom (Drawn behind outline)
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = shellColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Tier 2: 2.0px Black Armor Rim (Drawn ON TOP of outer bloom to ensure >= 7:1 WCAG AAA contrast)
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 1.0, 0, Math.PI * 2);
      ctx.stroke();

      // Tier 3: Saturated Color Plasma Shell
      ctx.fillStyle = shellColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      if (this.isInterceptable) {
        ctx.strokeStyle = '#f3e8ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Tier 4: Concentrated Solid White Core Highlight (Radius 0.55x)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}


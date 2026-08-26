import { Entity } from './Entity';
import { Bullet } from './Bullet';
import { Enemy } from './Enemy';
import { Barricade } from './Barricade';
import { soundManager } from './SoundManager';
import { Faction } from './types';

export enum HelperType {
  FIGHTER,
  REPAIRER,
  TANK
}

export class Helper extends Entity {
  public type: HelperType;
  public hp: number;
  public maxHp: number;
  public isInvincible: boolean;
  
  private canvasWidth: number;
  private canvasHeight: number;
  private fireTimer: number = 0;
  private lifespan: number = 15; // stays for 15 seconds
  private targetX: number;
  
  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number, type: HelperType) {
    super(x, y, 40, 30); // similar size to player
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.faction = Faction.PLAYER;
    this.type = type;
    this.targetX = Math.random() * (canvasWidth - this.size.width);
    
    switch (type) {
      case HelperType.FIGHTER:
        this.color = '#4ade80'; // Green
        this.hp = 3;
        this.maxHp = 3;
        this.isInvincible = false;
        break;
      case HelperType.REPAIRER:
        this.color = '#fbbf24'; // Yellow
        this.hp = 1;
        this.maxHp = 1;
        this.isInvincible = true;
        this.lifespan = 8; // short lifespan, repairs quickly
        break;
      case HelperType.TANK:
        this.color = '#a855f7'; // Purple
        this.hp = 15; // Absorbs a lot of hits
        this.maxHp = 15;
        this.isInvincible = false;
        this.lifespan = 20;
        break;
    }
  }

  public update(deltaTime: number, barricades: Barricade[], enemies: Enemy[], bullets: Bullet[]): Bullet[] {
    this.lifespan -= deltaTime;
    const newBullets: Bullet[] = [];
    

    // Bounce Y slightly
    this.position.y += Math.sin(Date.now() / 200) * 0.5;

    // Smart AI Behaviors
    if (this.type === HelperType.FIGHTER) {
      // FIGHTER AI: Target the lowest/closest hostile enemy (Invader or Rogue)
      let bestEnemy = null;
      let lowestY = -1;
      for (const e of enemies) {
         if (!e.isDead && e.faction !== this.faction && e.position.y > lowestY) {
            lowestY = e.position.y;
            bestEnemy = e;
         }
      }
      
      if (bestEnemy) {
         this.targetX = bestEnemy.position.x + bestEnemy.size.width / 2 - this.size.width / 2;
      } else {
         this.targetX = this.canvasWidth / 2 - this.size.width / 2;
      }
      
      this.fireTimer -= deltaTime;
      if (this.fireTimer <= 0) {
        this.fireTimer = 0.3; // Increased fire rate from 0.5 to 0.3
        const b = new Bullet(this.position.x + this.size.width / 2, this.position.y, -500, 2, true, 1);
        b.faction = Faction.PLAYER;
        newBullets.push(b);
        soundManager.playShoot();
      }
    } else if (this.type === HelperType.REPAIRER) {
      // REPAIRER AI: Find the most damaged barricade
      let bestBarricade = null;
      let minHp = 999;
      for (const b of barricades) {
         if (b.hp < b.maxHp && b.hp < minHp) {
            minHp = b.hp;
            bestBarricade = b;
         }
      }
      
      if (bestBarricade) {
         this.targetX = bestBarricade.position.x + bestBarricade.size.width / 2 - this.size.width / 2;
         // repair if close
         if (Math.abs(this.position.x - this.targetX) < 20) {
            if (Math.random() < 0.5) { // 50% chance per frame if right above it (much faster repair)
               for (let i = 0; i < bestBarricade.blocks.length; i++) {
                   if (!bestBarricade.blocks[i]) {
                       bestBarricade.blocks[i] = true;
                       bestBarricade.hp = Math.min(bestBarricade.maxHp, bestBarricade.hp + 5);
                       break;
                   }
               }
            }
         }
      } else {
         // Wander if nothing to repair
         if (Math.abs(this.targetX - this.position.x) < 10) {
            this.targetX = Math.random() * (this.canvasWidth - this.size.width);
         }
      }
    } else if (this.type === HelperType.TANK) {
       // TANK AI: Intercept incoming hostile bullets!
       let bestBullet = null;
       let lowestY = -1;
       for (const b of bullets) {
          if (!b.isDead && b.faction !== this.faction && b.position.y > lowestY && b.position.y < this.position.y + 100) {
             lowestY = b.position.y;
             bestBullet = b;
          }
       }
       if (bestBullet) {
          this.targetX = bestBullet.position.x - this.size.width / 2;
       } else {
          this.targetX = this.canvasWidth / 2 - this.size.width / 2;
       }
    }
    
    // Move towards target smoothly
    const dx = this.targetX - this.position.x;
    if (Math.abs(dx) > 5) {
       const speed = this.type === HelperType.FIGHTER ? 300 : (this.type === HelperType.TANK ? 400 : 250);
       this.position.x += Math.sign(dx) * speed * deltaTime;
    }
    
// Clamp
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.size.width > this.canvasWidth) this.position.x = this.canvasWidth - this.size.width;
    
    return newBullets;
  }
  
  public isExpired(): boolean {
    return this.lifespan <= 0 || (this.hp <= 0 && !this.isInvincible);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    
    ctx.fillStyle = this.color;
    ctx.globalAlpha = (this.lifespan < 3) ? (Math.sin(this.lifespan * 15) > 0 ? 1 : 0.4) : 1;
    
    // Draw body (droplet like player but different color)
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, this.size.width / 2, this.size.height / 2 - 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy, 4, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 8, cy, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy, 2, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 8, cy, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    if (!this.isInvincible) {
       ctx.fillText(`HP:${this.hp}`, cx, this.position.y - 5);
    } else {
       ctx.fillText(`INV`, cx, this.position.y - 5);
    }
    
    ctx.restore();
  }
}

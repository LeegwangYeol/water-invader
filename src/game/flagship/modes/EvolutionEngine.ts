import { IFlagshipSubsystem, FlagshipUpdateContext } from '../types';
import { Enemy, EnemyType } from '../../Enemy';
import { Bullet } from '../../Bullet';
import { soundManager } from '../../SoundManager';
import { Entity } from '../../Entity';
import { Faction, GameState, Rect, Size } from '../../types';


export class GravityWell {
  public x: number = 0;
  public y: number = 0;
  public radius: number = 0;
  public maxRadius: number = 100;
  public pullStrength: number = 200;
  public duration: number = 10.0;
  public timer: number = 0;
  public isActive: boolean = false;

  public reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.timer = 0;
    this.isActive = true;
  }


  public update(deltaTime: number, ctx: FlagshipUpdateContext) {
    this.timer += deltaTime;
    if (this.radius < this.maxRadius && this.timer < this.duration - 1) {
      this.radius += deltaTime * 50;
    } else if (this.timer >= this.duration - 1) {
      this.radius -= deltaTime * 100;
      if (this.radius < 0) this.radius = 0;
    }
    if (this.timer >= this.duration) {
      this.isActive = false;
    }

    // Pull player
    const player = ctx.player;
    if (player) {
      const dx = this.x - player.position.x;
      const dy = this.y - player.position.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > 0 && distSq < this.maxRadius * this.maxRadius * 4) {
        const dist = Math.sqrt(distSq);
        const pull = this.pullStrength * (1 - dist / (this.maxRadius * 2)) * deltaTime;
        player.position.x += (dx / dist) * pull;
        player.position.y += (dy / dist) * pull;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, time: number) {
    if (!this.isActive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(time * 5);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(138, 43, 226, ${0.1 + Math.sin(time * 10) * 0.1})`;
    ctx.fill();
    ctx.strokeStyle = '#d946ef';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Core
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}

export class AstralColossusBoss extends Entity {
  public hp: number = 25000;
  public maxHp: number = 25000;
  public type = EnemyType.BOSS;
  public phase: number = 1;
  public shootTimer: number = 0;
  public isActive: boolean = true;
  private timeOffset: number = Math.random() * 100;

  constructor(x: number, y: number) {
    super(x, y, 200, 200);
    this.faction = Faction.INVADER;
  }

  public takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isActive = false;
    }
    return amount;
  }

  public update(deltaTime: number, ctx: FlagshipUpdateContext) {
    if (!this.isActive) return;
    const time = performance.now() / 1000 + this.timeOffset;
    
    // Hovering movement
    this.position.x = 300 + Math.sin(time * 0.5) * 200;
    this.position.y = 150 + Math.sin(time * 1.5) * 50;

    // Phase transition
    if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
      ctx.triggerScreenShake(1.0, 15);
      soundManager.playPowerUp();
      // Enrage bullets
    }

    this.shootTimer -= deltaTime;
    if (this.shootTimer <= 0) {
      if (this.phase === 1) {
        this.shootTimer = 1.0;
        const b = new Bullet(this.position.x, this.position.y + 100, 250, 15, false);
        b.faction = Faction.INVADER;
        b.velocity = { x: (Math.random() - 0.5) * 50, y: 250 };
        ctx.bullets.push(b);
        soundManager.playShoot();
      } else {
        this.shootTimer = 0.5;
        for (let i = -1; i <= 1; i++) {
          const b = new Bullet(this.position.x, this.position.y + 100, 300, 20, false);
          b.faction = Faction.INVADER;
          b.velocity = { x: i * 150, y: 300 };
          ctx.bullets.push(b);
        }
        soundManager.playShoot();
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    
    // Core body
    ctx.beginPath();
    ctx.moveTo(0, -80);
    ctx.lineTo(80, 0);
    ctx.lineTo(0, 80);
    ctx.lineTo(-80, 0);
    ctx.closePath();
    ctx.fillStyle = this.phase === 1 ? "#0f172a" : "#450a0a";
    ctx.fill();
    ctx.strokeStyle = this.phase === 1 ? '#06b6d4' : '#ef4444';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Eye
    ctx.beginPath();
    ctx.arc(0, 0, 20 + Math.sin((performance.now() / 1000) * 5) * 5, 0, Math.PI * 2);
    ctx.fillStyle = this.phase === 1 ? '#38bdf8' : '#f97316';
    ctx.fill();

    // HP Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-100, -120, 200, 10);
    ctx.fillStyle = this.phase === 1 ? '#06b6d4' : '#ef4444';
    ctx.fillRect(-100, -120, 200 * (Math.max(0, this.hp) / this.maxHp), 10);
    ctx.restore();
  }
  
  public getRect(): Rect {
    return {
      x: this.position.x - 80,
      y: this.position.y - 80,
      width: 160,
      height: 160
    };
  }
}


export class EvolutionEngine implements IFlagshipSubsystem {
  public readonly id = 'evolution-engine';
  private gravityWells: GravityWell[] = [];
  private gravityWellPool: GravityWell[] = [];
  public colossus: AstralColossusBoss | null = null;
  
  public init() {
    for (let i = 0; i < 20; i++) {
      this.gravityWellPool.push(new GravityWell());
    }
  }

  private spawnGravityWell(x: number, y: number) {
    let well = this.gravityWellPool.find(w => !w.isActive);
    if (!well) {
      well = new GravityWell();
      this.gravityWellPool.push(well);
    }
    well.reset(x, y);
  }

  
  public update(deltaTime: number, context: FlagshipUpdateContext) {
    if (context.state !== GameState.PLAYING && context.gameState !== GameState.PLAYING) return;
    
    // 1. Infinite Scaling System
    const level = context.level || 1;
    const scaleFactor = 1 + Math.max(0, (level - 1)) * 0.5;
    for (const enemy of context.enemies) {
      if (!(enemy as any).isEvolutionScaled) {
        (enemy as any).isEvolutionScaled = true;
        enemy.maxHp = Math.floor(enemy.maxHp * scaleFactor);
        enemy.hp = Math.floor(enemy.hp * scaleFactor);
        if (Math.random() < 0.05 * scaleFactor) {
          (enemy as any).dropsGravityWell = true;
        }
      }
      
      if (enemy.hp <= 0 && (enemy as any).dropsGravityWell) {
        this.spawnGravityWell(enemy.position.x, enemy.position.y);
        (enemy as any).dropsGravityWell = false;
      }
    }

    // 2. Gravity Wells (Object Pooled)
    for (let i = 0; i < this.gravityWellPool.length; i++) {
      const well = this.gravityWellPool[i];
      if (well.isActive) {
        well.update(deltaTime, context);
      }
    }

    // 3. Colossus Boss
    if (context.level >= 10 && !this.colossus) {
      if (Math.random() < 0.01) {
        this.colossus = new AstralColossusBoss(300, -200);
        context.triggerScreenShake(2.0, 20);
      }
    }

    if (this.colossus) {
      this.colossus.update(deltaTime, context);
      
      for (const b of context.bullets) {
        if (b.faction === Faction.PLAYER && !b.isDead) {
          if (this.checkCollision(b.getRect(), this.colossus.getRect())) {
            this.colossus.takeDamage(b.damage);
            b.isDead = true;
            context.createExplosion(b.position.x, b.position.y, '#f59e0b', 10);
          }
        }
      }

      if (context.player && this.checkCollision(context.player.getRect(), this.colossus.getRect())) {
        context.player.hp -= 1;
      }

      if (!this.colossus.isActive) {
        context.createExplosion(this.colossus.position.x, this.colossus.position.y, '#ef4444', 100, 3.0);
        context.triggerScreenShake(3.0, 30);
        context.score += 50000;
        this.colossus = null;
      }
    }
  }

  private checkCollision(r1: Rect, r2: Rect) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  public drawForeground(ctx: CanvasRenderingContext2D, time: number) {
    for (const well of this.gravityWellPool) {
      if (!well.isActive) continue;
      well.draw(ctx, time);
    }
    if (this.colossus) {
      this.colossus.draw(ctx);
    }
  }

  public reset() {
    this.gravityWellPool.forEach(w => w.isActive = false);
    this.colossus = null;
  }
}

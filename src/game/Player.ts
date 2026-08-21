import { Entity } from './Entity';
import { Bullet } from './Bullet';

export class Player extends Entity {
  private canvasWidth: number;
  public speed: number = 300;
  public hp: number = 3;
  public maxHp: number = 5;
  
  // Upgradeable stats
  public baseFireRate: number = 0.5; // seconds between shots
  public multiShot: number = 1; // number of projectiles
  public piercing: number = 1; // new weapon upgrade
  public ultimateGauge: number = 0; // 0 to 100
  
  // Dynamic mechanics
  public suppressionLevel: number = 0; // 0 to 100. High = less accuracy
  public stressLevel: number = 0; // 0 to 100. High = faster fire rate
  public invincibilityTimer: number = 0; // 0 to 1.0s i-frames
  public hitFlashTimer: number = 0;
  
  private fireTimer: number = 0;
  public isMovingLeft: boolean = false;
  public isMovingRight: boolean = false;
  public isShooting: boolean = false;
  
  private timeAlive: number = 0;

  constructor(canvasWidth: number, canvasHeight: number) {
    super(canvasWidth / 2 - 25, canvasHeight - 60, 50, 40);
    this.canvasWidth = canvasWidth;
    this.color = '#3b82f6'; // Blue
  }

  public get fireRate(): number {
    return this.baseFireRate;
  }
  
  public set fireRate(val: number) {
    this.baseFireRate = val;
  }

  public update(deltaTime: number): Bullet[] {
    this.timeAlive += deltaTime;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaTime;
      if (this.hitFlashTimer < 0) this.hitFlashTimer = 0;
    }

    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= deltaTime;
      if (this.invincibilityTimer < 0) this.invincibilityTimer = 0;
    }
    
    if (this.isMovingLeft) {
      this.position.x -= this.speed * deltaTime;
    }
    if (this.isMovingRight) {
      this.position.x += this.speed * deltaTime;
    }

    // Clamp to screen
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.size.width > this.canvasWidth) {
      this.position.x = this.canvasWidth - this.size.width;
    }

    if (this.fireTimer > 0) {
      this.fireTimer -= deltaTime;
    }
    
    // Decay mechanics
    if (this.suppressionLevel > 0) {
      this.suppressionLevel -= 15 * deltaTime;
      if (this.suppressionLevel < 0) this.suppressionLevel = 0;
    }
    if (this.stressLevel > 0) {
      this.stressLevel -= 10 * deltaTime;
      if (this.stressLevel < 0) this.stressLevel = 0;
    }
    
    let generatedBullets: Bullet[] = [];
    if (this.isShooting) {
      generatedBullets = this.fire();
    }
    
    return generatedBullets;
  }

  public fire(): Bullet[] {
    // Stress decreases fire rate timer (shoots faster)
    // max stress (100) -> 3x faster
    const currentFireRate = this.baseFireRate / (1 + (this.stressLevel / 50));
    
    if (this.fireTimer > 0) return [];
    
    this.fireTimer = currentFireRate;
    const bullets: Bullet[] = [];
    
    // Suppression increases spread
    const maxSpread = 150; // max horizontal velocity variance
    const spread = (this.suppressionLevel / 100) * maxSpread;
    
    // Function to calculate random spread velocity
    const getSpread = () => (Math.random() - 0.5) * 2 * spread;

    // Multi-shot logic
    const centerX = this.position.x + this.size.width / 2 - 3;
    const baseSpeed = 400;

    if (this.multiShot === 1) {
      const b = new Bullet(centerX, this.position.y, -baseSpeed, 1, true, this.piercing);
      b.velocity.x = getSpread();
      bullets.push(b);
    } else if (this.multiShot === 2) {
      const b1 = new Bullet(this.position.x + 10, this.position.y, -baseSpeed, 1, true, this.piercing);
      b1.velocity.x = getSpread() - 20;
      const b2 = new Bullet(this.position.x + this.size.width - 10 - 6, this.position.y, -baseSpeed, 1, true, this.piercing);
      b2.velocity.x = getSpread() + 20;
      bullets.push(b1, b2);
    } else if (this.multiShot === 3) {
      const angles = [-10, 0, 10];
      angles.forEach((angle, index) => {
        const rad = angle * (Math.PI / 180);
        const offsetX = (index - 1) * 15;
        const b = new Bullet(centerX + offsetX, this.position.y - (angle === 0 ? 5 : 0), -baseSpeed * Math.cos(rad), 1, true, this.piercing);
        b.velocity.x = baseSpeed * Math.sin(rad) + getSpread();
        bullets.push(b);
      });
    } else if (this.multiShot === 4) {
      const angles = [-15, -5, 5, 15];
      angles.forEach((angle, index) => {
        const rad = angle * (Math.PI / 180);
        const offsetX = (index - 1.5) * 10;
        const b = new Bullet(centerX + offsetX, this.position.y, -baseSpeed * Math.cos(rad), 1, true, this.piercing);
        b.velocity.x = baseSpeed * Math.sin(rad) + getSpread();
        bullets.push(b);
      });
    } else {
      // multiShot >= 5
      const angles = [-20, -10, 0, 10, 20];
      angles.forEach((angle, index) => {
        const rad = angle * (Math.PI / 180);
        const offsetX = (index - 2) * 8;
        const b = new Bullet(centerX + offsetX, this.position.y - (angle === 0 ? 5 : 0), -baseSpeed * Math.cos(rad), 1, true, this.piercing);
        b.velocity.x = baseSpeed * Math.sin(rad) + getSpread();
        bullets.push(b);
      });
    }
    
    return bullets;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // i-Frames Flicker
    if (this.invincibilityTimer > 0) {
      const isFlicker = Math.floor(this.timeAlive * 30) % 2 === 0;
      ctx.globalAlpha = isFlicker ? 0.3 : 0.85;
    }
    
    const isFlashing = this.hitFlashTimer > 0;
    const isStressed = this.stressLevel > 50;
    const isSuppressed = this.suppressionLevel > 50;
    
    let glowColor = '#38bdf8';
    let jitterX = 0;
    let jitterY = 0;
    
    if (isFlashing) {
      glowColor = '#ffffff';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ffffff';
    } else if (isSuppressed) {
      glowColor = '#94a3b8';
      jitterX = (Math.random() - 0.5) * 4;
      jitterY = (Math.random() - 0.5) * 4;
    } else if (isStressed) {
      glowColor = '#ef4444';
    }
    
    if (!isFlashing) {
      ctx.shadowBlur = isStressed ? 25 : 15;
      ctx.shadowColor = glowColor;
    }
    
    // Breathing/bouncing animation
    const bounce = Math.sin(this.timeAlive * 8) * 3;
    const stretch = this.isMovingLeft || this.isMovingRight ? 2 : 0;
    
    const cx = this.position.x + this.size.width / 2 + jitterX;
    const cy = this.position.y + this.size.height / 2 + bounce + jitterY;
    const w = this.size.width / 2 + stretch;
    const h = this.size.height / 2 - stretch;
    
    // Gradient body
    const grad = ctx.createRadialGradient(cx, cy + h/4, 5, cx, cy, Math.max(w, h)*1.5);
    if (isStressed) {
      grad.addColorStop(0, '#f87171');
      grad.addColorStop(1, '#b91c1c');
    } else if (isSuppressed) {
      grad.addColorStop(0, '#cbd5e1');
      grad.addColorStop(1, '#64748b');
    } else {
      grad.addColorStop(0, '#7dd3fc');
      grad.addColorStop(1, '#0284c7');
    }
    
    // Cute Droplet Shape
    ctx.fillStyle = isFlashing ? '#ffffff' : grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h - 10); // pointy top
    ctx.bezierCurveTo(cx + w + 5, cy - h/2, cx + w + 5, cy + h, cx, cy + h); // right belly
    ctx.bezierCurveTo(cx - w - 5, cy + h, cx - w - 5, cy - h/2, cx, cy - h - 10); // left belly
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // White reflection highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx - w/2.5, cy - h/4, w/4, h/3, Math.PI/6, 0, Math.PI*2);
    ctx.fill();
    
    // Cute Eyes
    ctx.fillStyle = '#1e293b';
    if (isStressed) {
      // Angry eyes >_<
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 2); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx - 12, cy + 8);
      ctx.moveTo(cx + 12, cy - 2); ctx.lineTo(cx + 4, cy + 4); ctx.lineTo(cx + 12, cy + 8);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();
    } else if (isSuppressed) {
      // Dizzy eyes @_@
      ctx.beginPath();
      ctx.arc(cx - 8, cy + 4, 3, 0, Math.PI*2);
      ctx.arc(cx + 8, cy + 4, 3, 0, Math.PI*2);
      ctx.fill();
    } else {
      // Normal happy eyes
      ctx.beginPath();
      ctx.ellipse(cx - 8, cy + 2, 3, 5, 0, 0, Math.PI*2);
      ctx.ellipse(cx + 8, cy + 2, 3, 5, 0, 0, Math.PI*2);
      ctx.fill();
      // Eye sparkles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 1, 1.5, 0, Math.PI*2);
      ctx.arc(cx + 8, cy - 1, 1.5, 0, Math.PI*2);
      ctx.fill();
    }

    // Visual degradation when HP is low (<= 2)
    if (this.hp <= 2) {
      // Band-aid
      ctx.save();
      ctx.translate(cx + 10, cy - 10);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#fcd34d'; // yellowish band-aid
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(-8, -4, 16, 8, 2);
        ctx.fill();
      } else {
        ctx.fillRect(-8, -4, 16, 8);
      }
      ctx.fillStyle = '#f59e0b'; // darker center
      ctx.fillRect(-2, -4, 4, 8);
      ctx.restore();
    }

    if (this.hp <= 1) {
      // Deep red crack
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy + 10);
      ctx.lineTo(cx - 5, cy + 5);
      ctx.lineTo(cx, cy + 15);
      ctx.stroke();
    }

    ctx.restore();
  }
}

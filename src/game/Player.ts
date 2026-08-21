import { Entity } from './Entity';
import { Bullet } from './Bullet';

export class Player extends Entity {
  private canvasWidth: number;
  public speed: number = 300;
  public hp: number = 3;
  public maxHp: number = 3;
  
  // Upgradeable stats
  public baseFireRate: number = 0.5; // seconds between shots
  public multiShot: number = 1; // number of projectiles
  public piercing: number = 1; // new weapon upgrade
  public ultimateGauge: number = 0; // 0 to 100
  
  // Dynamic mechanics
  public suppressionLevel: number = 0; // 0 to 100. High = less accuracy
  public stressLevel: number = 0; // 0 to 100. High = faster fire rate
  
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
    if (this.multiShot === 1) {
      const b = new Bullet(this.position.x + this.size.width / 2 - 3, this.position.y, -400, 1, true, this.piercing);
      b.velocity.x = getSpread();
      bullets.push(b);
    } else if (this.multiShot === 2) {
      const b1 = new Bullet(this.position.x + 10, this.position.y, -400, 1, true, this.piercing);
      b1.velocity.x = getSpread() - 20;
      const b2 = new Bullet(this.position.x + this.size.width - 10 - 6, this.position.y, -400, 1, true, this.piercing);
      b2.velocity.x = getSpread() + 20;
      bullets.push(b1, b2);
    } else {
      const b1 = new Bullet(this.position.x + 10, this.position.y, -400, 1, true, this.piercing);
      b1.velocity.x = getSpread() - 40;
      const b2 = new Bullet(this.position.x + this.size.width / 2 - 3, this.position.y - 10, -400, 1, true, this.piercing);
      b2.velocity.x = getSpread();
      const b3 = new Bullet(this.position.x + this.size.width - 10 - 6, this.position.y, -400, 1, true, this.piercing);
      b3.velocity.x = getSpread() + 40;
      bullets.push(b1, b2, b3);
    }
    
    return bullets;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    const isStressed = this.stressLevel > 50;
    const isSuppressed = this.suppressionLevel > 50;
    
    // Dramatic Color Changes
    let bodyColor = this.color; // Normal blue
    let glowColor = this.color;
    let jitterX = 0;
    let jitterY = 0;
    
    if (isSuppressed) {
      bodyColor = '#94a3b8'; // Pale gray/blue (Panic)
      glowColor = '#38bdf8';
      jitterX = (Math.random() - 0.5) * 6; // Heavy shivering
      jitterY = (Math.random() - 0.5) * 6;
    } else if (isStressed) {
      bodyColor = '#ef4444'; // Blazing red (Adrenaline/Angry)
      glowColor = '#f97316'; // Orange glow
    }
    
    ctx.shadowBlur = isStressed ? 25 : 15;
    ctx.shadowColor = glowColor;
    
    // Bouncy animation based on movement and time
    const bounce = Math.sin(this.timeAlive * 10) * 2;
    const stretch = this.isMovingLeft || this.isMovingRight ? 2 : 0;
    
    const cx = this.position.x + this.size.width / 2 + jitterX;
    const cy = this.position.y + this.size.height / 2 + bounce + jitterY;
    const w = this.size.width / 2 + stretch;
    const h = this.size.height / 2 - stretch;
    
    // 1. Draw the squirt nozzle
    ctx.fillStyle = isStressed ? '#fca5a5' : '#60a5fa'; // Reddish nozzle if angry
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - 8, this.position.y - 8 + bounce + jitterY, 16, 15, 4);
    } else {
      ctx.fillRect(cx - 8, this.position.y - 8 + bounce + jitterY, 16, 15);
    }
    ctx.fill();

    // 2. Draw bouncy slime body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // 3. Eyes (Dramatic Changes)
    if (isStressed && !isSuppressed) {
      // Very Angry / Fiery eyes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // V-shaped angry eyes
      ctx.moveTo(cx - 16, cy - 4);
      ctx.lineTo(cx - 6, cy + 4);
      ctx.lineTo(cx - 16, cy + 6);
      
      ctx.moveTo(cx + 16, cy - 4);
      ctx.lineTo(cx + 6, cy + 4);
      ctx.lineTo(cx + 16, cy + 6);
      ctx.stroke();
      
      // Cheeks (blazing)
      ctx.fillStyle = '#fef08a'; // Yellow hot cheeks
      ctx.beginPath();
      ctx.ellipse(cx - 18, cy + 8, 5, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 18, cy + 8, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Screaming mouth
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (isSuppressed) {
      // Swirly / Dizzy Panic Eyes
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      // Draw X or swirl. Let's do huge X for panic
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - 4); ctx.lineTo(cx - 6, cy + 4);
      ctx.moveTo(cx - 6, cy - 4); ctx.lineTo(cx - 14, cy + 4);
      
      ctx.moveTo(cx + 14, cy - 4); ctx.lineTo(cx + 6, cy + 4);
      ctx.moveTo(cx + 6, cy - 4); ctx.lineTo(cx + 14, cy + 4);
      ctx.stroke();
      
      // Heavy Sweat drops
      ctx.fillStyle = '#bfdbfe';
      ctx.beginPath();
      ctx.ellipse(cx + 18, cy - 8, 3, 6, 0.2, 0, Math.PI * 2);
      ctx.ellipse(cx - 18, cy - 2, 2.5, 5, -0.2, 0, Math.PI * 2);
      ctx.ellipse(cx + 22, cy + 2, 2, 4, 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Wavy terrified mouth
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 10);
      ctx.bezierCurveTo(cx - 3, cy + 6, cx + 3, cy + 14, cx + 6, cy + 10);
      ctx.stroke();
      
    } else {
      // Normal cute eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy + 2, 6, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, cy + 2, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy + 2, 4, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, cy + 2, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 11, cy, 1.5, 0, Math.PI * 2);
      ctx.arc(cx + 9, cy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Cheeks
      ctx.fillStyle = 'rgba(244, 114, 182, 0.7)';
      ctx.beginPath();
      ctx.ellipse(cx - 18, cy + 8, 4, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 18, cy + 8, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Mouth
      if (this.fireTimer > this.baseFireRate - 0.1) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 8, 4, 0, Math.PI);
        ctx.stroke();
      }

      // Visual Damage (Torn/Battered) based on HP
      if (this.hp <= 2) {
         ctx.save();
         ctx.translate(cx, cy);
         // Bandage 1
         ctx.fillStyle = '#fcd34d'; // Yellowish bandage
         ctx.beginPath();
         ctx.fillRect(-15, -15, 12, 4);
         ctx.fillRect(-11, -19, 4, 12);
         ctx.fillStyle = '#b45309';
         ctx.fillRect(-13, -13, 2, 2);
         
         // Scratch
         ctx.strokeStyle = 'rgba(0,0,0,0.4)';
         ctx.lineWidth = 1.5;
         ctx.beginPath();
         ctx.moveTo(-18, -2);
         ctx.lineTo(-8, 5);
         ctx.stroke();
         ctx.restore();
      }

      if (this.hp <= 1) {
         ctx.save();
         ctx.translate(cx, cy);
         // Bandage 2 (Right cheek)
         ctx.fillStyle = '#fcd34d';
         ctx.rotate(Math.PI / 4);
         ctx.fillRect(8, 8, 14, 5);
         
         // Deep cut
         ctx.strokeStyle = '#dc2626';
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.moveTo(10, -5);
         ctx.lineTo(20, -15);
         ctx.stroke();
         
         ctx.restore();
      }
      
      ctx.restore();
    }
    
    ctx.restore();
  }
}

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

export class HomingMissile extends Bullet {
  public target: Entity | null = null;
  public turnRate: number = 6.2; // rad/s (~355 deg/s)
  public initialSpeed: number = 280; // px/s launch velocity
  public currentSpeed: number = 280;
  public acceleration: number = 360; // px/s^2
  public maxSpeed: number = 520; // px/s terminal velocity
  public lifeTimer: number = 4.5; // seconds
  public ignoreBarricades: boolean = true;
  public splashRadius: number = 45; // 45px
  public splashDamage: number;
  public angle: number = -Math.PI / 2; // initial heading straight up (-90 deg)
  public smokeTrail: Array<{ x: number; y: number; r: number; alpha: number }> = [];
  private smokeEmitTimer: number = 0;

  constructor(x: number, y: number, damage: number = 3) {
    // x, y, speedY, damage, isPlayerBullet, piercing
    super(x, y, -280, damage, true, 1);
    this.size = { width: 10, height: 20 };
    this.currentSpeed = 280;
    this.splashDamage = Math.max(1, Math.floor(damage * 0.5));
    this.color = '#818cf8'; // Indigo
    this.isInterceptable = false;
    this.angle = -Math.PI / 2;
    this.velocity.x = 0;
    this.velocity.y = -this.currentSpeed;
  }

  public findNearestTarget(enemies?: Entity[], crisis?: any): Entity | null {
    let nearest: Entity | null = null;
    let minDistSq = Infinity;
    const myX = this.position.x + this.size.width / 2;
    const myY = this.position.y + this.size.height / 2;

    if (enemies && enemies.length > 0) {
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.isDead && e.faction !== Faction.PLAYER) {
          // Verify candidate within active tactical envelope
          if (
            e.position.x >= -60 &&
            e.position.x <= 660 &&
            e.position.y >= -60 &&
            e.position.y <= 860
          ) {
            const ex = e.position.x + e.size.width / 2;
            const ey = e.position.y + e.size.height / 2;
            const distSq = (ex - myX) * (ex - myX) + (ey - myY) * (ey - myY);
            if (distSq < minDistSq) {
              minDistSq = distSq;
              nearest = e;
            }
          }
        }
      }
    }

    // Fallback to End-Game Crisis sovereign/anchors if no regular hostile was found
    if (!nearest && crisis) {
      if (crisis.sovereign && !crisis.sovereign.isDead) {
        nearest = crisis.sovereign;
      } else if (crisis.rifts && Array.isArray(crisis.rifts)) {
        for (const rift of crisis.rifts) {
          if (!rift.isDead && !rift.isDestroyed) {
            const rx = rift.position.x + rift.size.width / 2;
            const ry = rift.position.y + rift.size.height / 2;
            const distSq = (rx - myX) * (rx - myX) + (ry - myY) * (ry - myY);
            if (distSq < minDistSq) {
              minDistSq = distSq;
              nearest = rift;
            }
          }
        }
      }
    }

    return nearest;
  }

  public update(deltaTime: number, enemies?: Entity[], crisis?: any): void {
    // 1. Continuous Collision Detection (CCD) state tracking
    this.prevPosition = { x: this.position.x, y: this.position.y };

    // 2. Lifetime decay & boundary pruning
    this.lifeTimer -= deltaTime;
    if (this.lifeTimer <= 0) {
      this.isDead = true;
      return;
    }

    // 3. Sticky Target Validation & Acquisition
    const isTargetValid =
      this.target &&
      !this.target.isDead &&
      this.target.position.y > -60 &&
      this.target.position.y < 860 &&
      this.target.position.x > -60 &&
      this.target.position.x < 660;

    if (!isTargetValid) {
      this.target = this.findNearestTarget(enemies, crisis);
    }

    // 4. Kinematics & Steering Dynamics
    if (this.target) {
      const targetX = this.target.position.x + this.target.size.width / 2;
      const targetY = this.target.position.y + this.target.size.height / 2;
      const myX = this.position.x + this.size.width / 2;
      const myY = this.position.y + this.size.height / 2;

      const targetAngle = Math.atan2(targetY - myY, targetX - myX);
      const deltaTheta = Math.atan2(Math.sin(targetAngle - this.angle), Math.cos(targetAngle - this.angle));
      const maxTurn = this.turnRate * deltaTime;
      this.angle += Math.max(-maxTurn, Math.min(maxTurn, deltaTheta));
    }

    // Accelerate along current heading toward terminal velocity
    this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.acceleration * deltaTime);
    this.velocity.x = Math.cos(this.angle) * this.currentSpeed;
    this.velocity.y = Math.sin(this.angle) * this.currentSpeed;

    // 5. Integrate position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // 6. Exhaust smoke trail simulation
    this.smokeEmitTimer -= deltaTime;
    if (this.smokeEmitTimer <= 0) {
      this.smokeEmitTimer = 0.035;
      const tailX = this.position.x + this.size.width / 2 - Math.cos(this.angle) * 10;
      const tailY = this.position.y + this.size.height / 2 - Math.sin(this.angle) * 10;
      this.smokeTrail.push({ x: tailX, y: tailY, r: 2.5, alpha: 0.75 });
    }

    // Decay smoke trail
    for (let i = this.smokeTrail.length - 1; i >= 0; i--) {
      const s = this.smokeTrail[i];
      s.r += 6 * deltaTime;
      s.alpha -= 1.8 * deltaTime;
      if (s.alpha <= 0) {
        this.smokeTrail.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;

    // 1. Render World-Space Smoke Trail
    for (let i = 0; i < this.smokeTrail.length; i++) {
      const s = this.smokeTrail[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha * 0.45));
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Render Rotating Missile Fuselage
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle + Math.PI / 2); // Rotate so 0 points upwards along heading

    // Exhaust Jet Flame (Behind tail at y = 10)
    const flameH = 7 + Math.random() * 6;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-3, 9);
    ctx.lineTo(3, 9);
    ctx.lineTo(0, 9 + flameH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-1.5, 9);
    ctx.lineTo(1.5, 9);
    ctx.lineTo(0, 9 + flameH * 0.5);
    ctx.closePath();
    ctx.fill();

    // Dual Stabilizing Tail Fins
    ctx.fillStyle = '#4338ca';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;

    // Left fin
    ctx.beginPath();
    ctx.moveTo(-3, 4);
    ctx.lineTo(-9, 10);
    ctx.lineTo(-3, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right fin
    ctx.beginPath();
    ctx.moveTo(3, 4);
    ctx.lineTo(9, 10);
    ctx.lineTo(3, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tier 1: Outer Atmospheric Bloom
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#818cf8';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Tier 2: 2.0px High-Contrast Black Armor Rim
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.0;

    // Tier 3: Aerodynamic Ogive Fuselage Body
    ctx.fillStyle = '#6366f1'; // Indigo fuselage
    ctx.beginPath();
    ctx.moveTo(0, -11); // Sharp nose
    ctx.bezierCurveTo(4, -8, 5, -2, 4, 9); // Right flank
    ctx.lineTo(-4, 9); // Tail base
    ctx.bezierCurveTo(-5, -2, -4, -8, 0, -11); // Left flank
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nose Cone Cyan Guidance Cap
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.bezierCurveTo(2.5, -7, 3, -4, 0, -4);
    ctx.bezierCurveTo(-3, -4, -2.5, -7, 0, -10);
    ctx.closePath();
    ctx.fill();

    // Specular Highlight Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-1, -8);
    ctx.lineTo(-1, 4);
    ctx.stroke();

    ctx.restore();
  }
}



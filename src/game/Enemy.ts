import { Entity } from './Entity';
import { Bullet } from './Bullet';
import { Vector2D, Faction, EnemyType } from './types';
import { soundManager } from './SoundManager';

export { EnemyType };

export class Enemy extends Entity {
  public static assets: { squid?: HTMLImageElement; crab?: HTMLImageElement; rogue?: HTMLImageElement } = {};
  public static initAssets() {
    if (typeof window !== 'undefined' && !Enemy.assets.squid) {
      const squid = new Image();
      squid.src = '/assets/enemy_squid.jpg';
      const crab = new Image();
      crab.src = '/assets/enemy_crab.jpg';
      const rogue = new Image();
      rogue.src = '/assets/rogue_jellyfish.jpg';
      Enemy.assets = { squid, crab, rogue };
    }
  }

  public hp: number;
  public maxHp: number;
  private canvasWidth: number;
  public type: EnemyType = EnemyType.NORMAL;
  public isGnawing: boolean = false;
  public hitFlashTimer: number = 0;
  
  // Movement pattern
  private direction: number = 1; // 1 for right, -1 for left
  public speedX: number = 30;
  public speedY: number = 8;
  private startY: number;
  
  private fireTimer: number = 0;
  public canEvade: boolean = false;
  private evadeCooldown: number = 0;
  
  public isDiving: boolean = false;
  public shieldHp: number = 0;
  public shieldRegenTimer: number = 0;
  public level: number = 1;
  public canvasHeight: number = 800;

  constructor(x: number, y: number, canvasWidth: number, level: number, type: EnemyType = EnemyType.NORMAL, canvasHeight: number = 800) {
    Enemy.initAssets();
    const validX = Number.isFinite(x) ? x : 0;
    const validY = Number.isFinite(y) ? y : 80;
    super(validX, validY, 40, 30);
    this.faction = Faction.INVADER;
    this.canvasWidth = Number.isFinite(canvasWidth) ? Math.max(100, canvasWidth) : 600;
    this.canvasHeight = Number.isFinite(canvasHeight) ? Math.max(100, canvasHeight) : 800;
    this.startY = validY;
    this.position.x = Math.max(0, Math.min(validX, this.canvasWidth - this.size.width));
    this.position.y = Math.max(0, Math.min(validY, this.canvasHeight - this.size.height));
    this.level = Number.isFinite(level) && level >= 1 ? Math.floor(level) : 1;
    this.type = type;
    this.hp = 1 + Math.floor(this.level / 3);
    
    if (type === EnemyType.ZIGZAG) {
      this.color = '#eab308'; // Yellow
      this.speedX += this.level * 10 + 50; // faster
      this.hp = Math.max(1, this.hp - 1); // squishier
    } else if (type === EnemyType.BOSS) {
      this.color = '#dc2626'; // Dark red
      this.size.width = 150;
      this.size.height = 100;
      this.hp = this.level * 10;
      this.speedX += this.level * 2;
    } else if (type === EnemyType.SNIPER) {
      this.color = '#a855f7'; // Purple
      this.speedX = 20; // slow
      this.hp = Math.max(1, this.hp - 1);
    } else if (type === EnemyType.DIVER) {
      this.color = '#ef4444'; // Red
      this.speedX += this.level * 8;
    } else if (type === EnemyType.SHIELDED) {
      this.color = '#64748b'; // Slate
      this.shieldHp = 3;
    } else if (type === EnemyType.SPLITTER) {
      this.color = '#22c55e'; // Green
      this.size = { width: 50, height: 40 }; // slightly bigger
    } else if (type === EnemyType.ROGUE_DRONE) {
      this.faction = Faction.ROGUE;
      this.color = '#84cc16'; // Neon lime
      this.size = { width: 36, height: 28 };
      this.speedX = 60 + this.level * 8;
      this.speedY = 12 + this.level * 2;
      this.hp = Math.max(1, 1 + Math.floor(this.level / 4));
      this.canEvade = true;
    } else if (type === EnemyType.ROGUE_STALKER) {
      this.faction = Faction.ROGUE;
      this.color = '#a3e635'; // Lime / Stealth Slate
      this.size = { width: 44, height: 32 };
      this.speedX = 35 + this.level * 5;
      this.speedY = 10 + this.level * 2;
      this.hp = 3 + Math.floor(this.level / 2);
      this.canEvade = true;
    } else if (type === EnemyType.ROGUE_MECH) {
      this.faction = Faction.ROGUE;
      this.color = '#f59e0b'; // Amber / Heavy Lime
      this.size = { width: 56, height: 42 };
      this.speedX = 20 + this.level * 2;
      this.speedY = 6 + this.level;
      this.hp = 8 + this.level * 3;
    } else {
      this.color = '#f97316'; // Orange/Fire
      this.speedX += this.level * 5;
      this.canEvade = false;
    }
    
    this.maxHp = this.hp;
    this.fireTimer = Math.random() * 3 + 1; // Staggered initial firing timer

    // Re-clamp position in case type-specific size altered dimensions
    const maxX = Math.max(0, this.canvasWidth - this.size.width);
    const maxY = Math.max(0, this.canvasHeight - this.size.height);
    this.position.x = Math.max(0, Math.min(this.position.x, maxX));
    this.position.y = Math.max(0, Math.min(this.position.y, maxY));
  }

  public update(deltaTime: number, speedMultiplier: number = 1.0, bullets: Bullet[] = [], playerPos?: Vector2D, allEnemies: Enemy[] = []): void {
    if (!Number.isFinite(deltaTime) || deltaTime < 0) return;
    const clampedDt = Math.min(deltaTime, 0.1); // Guard against massive lag spikes / tab throttle jumps

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaTime;
      if (this.hitFlashTimer < 0) this.hitFlashTimer = 0;
    }

    const validSpeedMultiplier = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : 1.0;
    const gnawMultiplier = this.isGnawing ? 0.2 : 1.0;
    const currentSpeedX = this.speedX * validSpeedMultiplier * gnawMultiplier;
    const currentSpeedY = this.speedY * validSpeedMultiplier * gnawMultiplier;

    // Diver Logic: Safe trajectory & dive trigger (target must be below the diver)
    if (this.type === EnemyType.DIVER && playerPos && Number.isFinite(playerPos.x) && Number.isFinite(playerPos.y)) {
      const diverCenterX = this.position.x + this.size.width / 2;
      const playerCenterX = playerPos.x + 25;
      if (!this.isDiving && Math.abs(diverCenterX - playerCenterX) < 25 && playerPos.y > this.position.y) {
        // Player is directly below!
        this.isDiving = true;
      }
    }

    if (this.isDiving) {
      const diveSpeed = Math.max(280, currentSpeedY * 35);
      this.position.y += diveSpeed * clampedDt; // Dive very fast
      const maxDiverY = this.canvasHeight + 50;
      this.position.y = Math.max(0, Math.min(maxDiverY, this.position.y));
      if (!Number.isFinite(this.position.y)) this.position.y = maxDiverY;
      if (!Number.isFinite(this.position.x)) this.position.x = 0;
      if (this.position.x < 0) this.position.x = 0;
      const maxDiverX = Math.max(0, this.canvasWidth - this.size.width);
      if (this.position.x > maxDiverX) this.position.x = maxDiverX;
      return; // Skip normal movement
    }

    this.position.y += currentSpeedY * clampedDt;

    // Strict Y-Axis Boundary Clamping
    const maxY = Math.max(0, this.canvasHeight - this.size.height);
    this.position.y = Math.max(0, Math.min(this.position.y, maxY));

    // Safeguard position values against NaN corruption
    if (!Number.isFinite(this.position.y)) this.position.y = maxY;
    if (!Number.isFinite(this.position.x)) this.position.x = 0;

    // Shield Regen Logic
    if (this.type === EnemyType.SHIELDED && this.shieldHp <= 0) {
      this.shieldRegenTimer -= deltaTime;
      if (this.shieldRegenTimer <= 0) {
        this.shieldHp = 3; // Regenerate shield
        this.shieldRegenTimer = 0;
      }
    }

    // Evasive maneuver logic (dodges hostile bullets of different faction)
    if (this.canEvade && this.evadeCooldown <= 0) {
      const incoming = bullets.find(b => 
        !b.isDead &&
        b.faction !== this.faction && 
        b.position.y > this.position.y && 
        b.position.y - this.position.y < 250 && 
        Math.abs(b.position.x - this.position.x) < this.size.width + 10 
      );
      if (incoming) {
        this.direction = (incoming.position.x > this.position.x + this.size.width / 2) ? -1 : 1;
        this.evadeCooldown = 1.5; 
      }
    }
    if (this.evadeCooldown > 0) {
      this.evadeCooldown -= clampedDt;
    }

    // Rogue Stalker tracking AI in movement
    if (this.type === EnemyType.ROGUE_STALKER && (playerPos || allEnemies.length > 0)) {
      let targetX = playerPos ? playerPos.x + 25 : this.canvasWidth / 2;
      let minDistance = playerPos ? Math.hypot((playerPos.x + 25) - (this.position.x + this.size.width / 2), (playerPos.y + 20) - (this.position.y + this.size.height / 2)) : Infinity;
      
      for (const e of allEnemies) {
        if (!e.isDead && e.faction === Faction.INVADER) {
          const d = Math.hypot((e.position.x + e.size.width / 2) - (this.position.x + this.size.width / 2), (e.position.y + e.size.height / 2) - (this.position.y + this.size.height / 2));
          if (d < minDistance) {
            minDistance = d;
            targetX = e.position.x + e.size.width / 2;
          }
        }
      }
      const dx = targetX - (this.position.x + this.size.width / 2);
      if (Math.abs(dx) > 10) {
        this.position.x += Math.sign(dx) * 25 * clampedDt * validSpeedMultiplier;
      }
    }

    if (this.type === EnemyType.ZIGZAG || this.type === EnemyType.ROGUE_DRONE) {
      this.position.x += currentSpeedX * this.direction * clampedDt;
      this.position.x += Math.sin(Date.now() / 180 + this.position.y) * 4 * validSpeedMultiplier;
    } else {
      const evadeBoost = (this.evadeCooldown > 0.5) ? 1.5 : 1.0;
      this.position.x += currentSpeedX * evadeBoost * this.direction * clampedDt;
    }
    
    // Bounce off walls
    const movingDir = this.speedX >= 0 ? this.direction : -this.direction;
    if (this.position.x <= 0 && movingDir < 0) {
      this.direction = this.speedX >= 0 ? 1 : -1;
    } else if (this.position.x + this.size.width >= this.canvasWidth && movingDir > 0) {
      this.direction = this.speedX >= 0 ? -1 : 1;
    }
    
    // Clamp X to canvas width
    if (this.position.x <= 0) this.position.x = 0;
    if (this.position.x + this.size.width >= this.canvasWidth) {
      this.position.x = Math.max(0, this.canvasWidth - this.size.width);
    }
    
    this.fireTimer -= clampedDt * validSpeedMultiplier;
  }

  public fire(playerPos?: Vector2D, allEnemies: Enemy[] = []): Bullet | null {
    if (this.isDiving) return null; // divers don't shoot while diving

    if (this.fireTimer <= 0) {
      // Reset timer
      if (this.type === EnemyType.BOSS) {
        this.fireTimer = Math.random() * 2 + 0.5;
      } else if (this.type === EnemyType.ROGUE_DRONE) {
        this.fireTimer = Math.random() * 1.5 + 1.5;
      } else if (this.type === EnemyType.ROGUE_STALKER) {
        this.fireTimer = Math.random() * 1.5 + 2.0;
      } else if (this.type === EnemyType.ROGUE_MECH) {
        this.fireTimer = Math.random() * 2.0 + 2.5;
      } else {
        this.fireTimer = Math.random() * 3 + 2;
      }
      
      const spawnX = this.position.x + this.size.width / 2 - 3;
      const spawnY = this.position.y + this.size.height;

      // Rogue Faction Dual-Targeting AI
      if (this.faction === Faction.ROGUE) {
        soundManager.playRogueShoot();

        let targetCenter: Vector2D | null = null;
        let minDistance = Infinity;

        // Evaluate distance to Player
        if (playerPos && Number.isFinite(playerPos.x) && Number.isFinite(playerPos.y)) {
          const px = playerPos.x + 25;
          const py = playerPos.y + 20;
          const dist = Math.hypot(px - spawnX, py - spawnY);
          minDistance = dist;
          targetCenter = { x: px, y: py };
        }

        // Evaluate distance to active Invader enemies
        for (const e of allEnemies) {
          if (!e.isDead && e.faction === Faction.INVADER) {
            const ex = e.position.x + e.size.width / 2;
            const ey = e.position.y + e.size.height / 2;
            const dist = Math.hypot(ex - spawnX, ey - spawnY);
            if (dist < minDistance) {
              minDistance = dist;
              targetCenter = { x: ex, y: ey };
            }
          }
        }

        const bulletSpeed = this.type === EnemyType.ROGUE_DRONE ? 380 : (this.type === EnemyType.ROGUE_MECH ? 280 : 340);
        const bulletDamage = this.type === EnemyType.ROGUE_MECH ? 3 : (this.type === EnemyType.ROGUE_STALKER ? 2 : 1);
        const piercing = this.type === EnemyType.ROGUE_MECH ? 2 : 1;

        const b = new Bullet(spawnX, spawnY, bulletSpeed, bulletDamage, false, piercing);
        b.faction = Faction.ROGUE;
        b.color = '#84cc16';

        if (this.type === EnemyType.ROGUE_STALKER) {
          b.isInterceptable = true;
        }

        if (targetCenter) {
          const dx = targetCenter.x - spawnX;
          const dy = targetCenter.y - spawnY;
          const angle = Math.atan2(dy, dx);
          b.velocity.x = Math.cos(angle) * bulletSpeed;
          b.velocity.y = Math.sin(angle) * bulletSpeed;
        }

        return b;
      }

      // Invader Faction
      const bulletSpeed = this.type === EnemyType.BOSS ? 300 : 200;
      const b = new Bullet(spawnX, spawnY, bulletSpeed, 1, false);
      b.faction = this.faction;

      if (this.type === EnemyType.SNIPER) {
        b.isInterceptable = true;
        
        let targetCenter: Vector2D | null = null;
        let minDistance = Infinity;

        if (playerPos && Number.isFinite(playerPos.x) && Number.isFinite(playerPos.y)) {
          const px = playerPos.x + 25;
          const py = playerPos.y + 20;
          minDistance = Math.hypot(px - spawnX, py - spawnY);
          targetCenter = { x: px, y: py };
        }

        for (const e of allEnemies) {
          if (!e.isDead && e.faction === Faction.ROGUE) {
            const ex = e.position.x + e.size.width / 2;
            const ey = e.position.y + e.size.height / 2;
            const dist = Math.hypot(ex - spawnX, ey - spawnY);
            if (dist < minDistance) {
              minDistance = dist;
              targetCenter = { x: ex, y: ey };
            }
          }
        }

        if (targetCenter) {
          const dx = targetCenter.x - spawnX;
          const dy = targetCenter.y - spawnY;
          const angle = Math.atan2(dy, dx);
          const speed = 400; // sniper bullets are fast
          b.velocity.x = Math.cos(angle) * speed;
          b.velocity.y = Math.sin(angle) * speed;
        }
      }
      
      return b;
    }
    return null;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    const w = this.size.width;
    const h = this.size.height;
    const time = Date.now() / 1000;

    // Shield Aura
    if (this.type === EnemyType.SHIELDED && this.shieldHp > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, w/2 + 7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${0.25 + this.shieldHp * 0.12})`;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    const isFlashing = this.hitFlashTimer > 0;
    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
    } else {
      ctx.fillStyle = this.color;
    }

    // High quality pixel art asset rendering with procedural fallback (only when not flashing)
    let img: HTMLImageElement | undefined;
    if (this.faction === Faction.ROGUE || this.type === EnemyType.ROGUE_DRONE || this.type === EnemyType.ROGUE_STALKER || this.type === EnemyType.ROGUE_MECH) {
      img = Enemy.assets.rogue;
    } else if (this.type === EnemyType.DIVER || this.type === EnemyType.SHIELDED || this.type === EnemyType.BOSS || this.type === EnemyType.SPLITTER) {
      img = Enemy.assets.crab;
    } else {
      img = Enemy.assets.squid;
    }

    if (!isFlashing && img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.position.x, this.position.y, w, h, 6);
        ctx.clip();
      }
      ctx.drawImage(img, this.position.x, this.position.y, w, h);
      ctx.restore();
      ctx.restore();
      return;
    }
    
    if (this.type === EnemyType.BOSS) {
      // Coral Titan Leviathan (Vibrant Coral Red / Crimson Gradient)
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy - h/2, cx + w/2, cy + h/2);
        grad.addColorStop(0, '#f43f5e'); // Rose Coral
        grad.addColorStop(0.5, '#dc2626'); // Vibrant Crimson
        grad.addColorStop(1, '#991b1b'); // Deep Maroon
        ctx.fillStyle = grad;
      }

      // Main Titan Hull
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(this.position.x, this.position.y, w, h, 16);
        ctx.fill();
      } else {
        ctx.fillRect(this.position.x, this.position.y, w, h);
      }

      if (!isFlashing) {
        // Lateral Armored Mandibles
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.moveTo(this.position.x - 6, cy - h/4);
        ctx.lineTo(this.position.x + 8, cy - h/2);
        ctx.lineTo(this.position.x + 8, cy + h/2);
        ctx.lineTo(this.position.x - 6, cy + h/4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.position.x + w + 6, cy - h/4);
        ctx.lineTo(this.position.x + w - 8, cy - h/2);
        ctx.lineTo(this.position.x + w - 8, cy + h/2);
        ctx.lineTo(this.position.x + w + 6, cy + h/4);
        ctx.closePath();
        ctx.fill();

        // Glowing Aquatic Power Core
        const corePulse = Math.sin(time * 4) * 3;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy + 10, 14 + corePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Multi-Cluster Sensor Eyes
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(cx - w/4, cy - 14, 16, 0, Math.PI*2);
        ctx.arc(cx + w/4, cy - 14, 16, 0, Math.PI*2);
        ctx.fill();

        // Fiery Glowing Iris
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx - w/4, cy - 14, 8, 0, Math.PI*2);
        ctx.arc(cx + w/4, cy - 14, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx - w/4, cy - 14, 4, 0, Math.PI*2);
        ctx.arc(cx + w/4, cy - 14, 4, 0, Math.PI*2);
        ctx.fill();

        // Vent grille
        ctx.fillStyle = '#0f172a';
        for(let i=0; i<6; i++) {
          ctx.fillRect(cx - 38 + i*14, cy + 24, 8, 16);
        }
      }
    } else if (this.type === EnemyType.ROGUE_DRONE) {
      // Rogue Cyber-Manta Drone (Vibrant Lime & Electric Cyan)
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy, cx + w/2, cy);
        grad.addColorStop(0, '#84cc16'); // Neon lime
        grad.addColorStop(0.5, '#a3e635'); // Bright lime
        grad.addColorStop(1, '#65a30d'); // Emerald lime
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.lineTo(cx + w/2, cy - h/2 + 4);
      ctx.lineTo(cx + w/4, cy - h/2);
      ctx.lineTo(cx, cy - h/4);
      ctx.lineTo(cx - w/4, cy - h/2);
      ctx.lineTo(cx - w/2, cy - h/2 + 4);
      ctx.closePath();
      ctx.fill();

      if (!isFlashing) {
        // Dorsal Spine (Electric Cyan)
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(cx, cy + h/3);
        ctx.lineTo(cx + w/5, cy - h/4);
        ctx.lineTo(cx - w/5, cy - h/4);
        ctx.closePath();
        ctx.fill();

        // Glowing Cyan Visor
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fillRect(cx - 5, cy - 2, 10, 4);
        ctx.shadowBlur = 0;

        // Ion Thruster Plume
        ctx.fillStyle = '#a3e635';
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy - h/4);
        ctx.lineTo(cx, cy - h/2 - 6 - Math.random() * 5);
        ctx.lineTo(cx + 3, cy - h/4);
        ctx.fill();
      }
    } else if (this.type === EnemyType.ROGUE_STALKER) {
      // Rogue Stalker (Emerald/Lime Predator Blade Ray)
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx, cy - h/2, cx, cy + h/2);
        grad.addColorStop(0, '#a3e635');
        grad.addColorStop(0.6, '#4ade80');
        grad.addColorStop(1, '#16a34a');
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.lineTo(cx + w/2, cy);
      ctx.lineTo(cx + w/2 - 4, cy - h/2);
      ctx.lineTo(cx, cy - h/3);
      ctx.lineTo(cx - w/2 + 4, cy - h/2);
      ctx.lineTo(cx - w/2, cy);
      ctx.closePath();
      ctx.fill();

      if (!isFlashing) {
        // Dark Obsidian Carapace Core
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(cx, cy + h/4);
        ctx.lineTo(cx + w/3, cy - h/5);
        ctx.lineTo(cx, cy - h/3);
        ctx.lineTo(cx - w/3, cy - h/5);
        ctx.closePath();
        ctx.fill();

        // Glowing Amber Sensor Scanner
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Twin Thrusters
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(cx - w/3, cy - h/2, 4, 4);
        ctx.fillRect(cx + w/3 - 4, cy - h/2, 4, 4);
      }
    } else if (this.type === EnemyType.ROGUE_MECH) {
      // Rogue Mech (Armored Cyber-Crab Juggernaut)
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy - h/2, cx + w/2, cy + h/2);
        grad.addColorStop(0, '#f59e0b'); // Amber
        grad.addColorStop(0.5, '#84cc16'); // Neon Lime
        grad.addColorStop(1, '#4d7c0f'); // Forest Lime
        ctx.fillStyle = grad;
      }

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(cx - w/2, cy - h/2, w, h, 8);
        ctx.fill();
      } else {
        ctx.fillRect(cx - w/2, cy - h/2, w, h);
      }

      if (!isFlashing) {
        // Shoulder Plasma Cannon Pods
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(cx - w/2 - 5, cy - h/3, 7, h/2);
        ctx.fillRect(cx + w/2 - 2, cy - h/3, 7, h/2);

        // Armor Core
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - w/3, cy - h/3, (w * 2) / 3, (h * 2) / 3);

        // Multi-Spectrum Laser Visor
        ctx.fillStyle = '#84cc16';
        ctx.shadowColor = '#84cc16';
        ctx.shadowBlur = 8;
        ctx.fillRect(cx - 10, cy - 5, 20, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 3, cy - 4, 6, 3);
        ctx.shadowBlur = 0;

        // Thruster vents
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(cx - 11, cy + h/4, 7, 4);
        ctx.fillRect(cx + 4, cy + h/4, 7, 4);
      }
    } else if (this.faction === Faction.ROGUE) {
      // Generic Rogue Unit (Neon Lime Delta)
      if (!isFlashing) {
        ctx.fillStyle = '#84cc16';
      }
      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.lineTo(cx + w/2, cy - h/2);
      ctx.lineTo(cx, cy - h/4);
      ctx.lineTo(cx - w/2, cy - h/2);
      ctx.closePath();
      ctx.fill();
      if (!isFlashing) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 4, cy - 4, 8, 8);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(cx - 3, cy - 2, 6, 3);
      }
    } else if (this.type === EnemyType.SNIPER) {
      // Deep-Sea Bioluminescent Angler (Luminous Violet with Glowing Lure)
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx, cy - h/2, cx, cy + h/2);
        grad.addColorStop(0, '#c084fc'); // Lavender violet
        grad.addColorStop(0.7, '#9333ea'); // Vivid Purple
        grad.addColorStop(1, '#6b21a8'); // Deep Indigo
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.lineTo(cx + w/2, cy - h/2);
      ctx.lineTo(cx, cy - h/4);
      ctx.lineTo(cx - w/2, cy - h/2);
      ctx.closePath();
      ctx.fill();

      if (!isFlashing) {
        // Glowing Angler Lure Antenna extending forward
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - h/4);
        ctx.quadraticCurveTo(cx + 12, cy - h/2 - 8, cx, cy - h/2 - 12);
        ctx.stroke();

        // Glowing Bioluminescent Lure Bulb
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy - h/2 - 12, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Concentrated Sniper Targeting Eye
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === EnemyType.DIVER) {
      // Bioluminescent Torpedo Piranha (Vibrant Coral Crimson & Fiery Amber)
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx, cy - h/2, cx, cy + h/2);
        grad.addColorStop(0, '#f97316'); // Bright Amber
        grad.addColorStop(0.6, '#ef4444'); // Coral Red
        grad.addColorStop(1, '#b91c1c'); // Crimson
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy + h/2);
      ctx.bezierCurveTo(cx + w/2 + 10, cy, cx + w/2, cy - h/2, cx, cy - h/2);
      ctx.bezierCurveTo(cx - w/2, cy - h/2, cx - w/2 - 10, cy, cx, cy + h/2);
      ctx.fill();

      if (!isFlashing) {
        // Glowing Amber Predator Eye
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx, cy - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Blazing Rocket Flame
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - h/2);
        ctx.lineTo(cx, cy - h/2 - 14 - Math.random()*8);
        ctx.lineTo(cx + 7, cy - h/2);
        ctx.fill();
      }
    } else if (this.type === EnemyType.ZIGZAG) {
      // Electric Star-Jelly (Radiant Gold & Electric Aura)
      if (!isFlashing) {
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, w/2);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#eab308');
        grad.addColorStop(1, '#ea580c');
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      for(let i=0; i<8; i++) {
        const radius = i % 2 === 0 ? w/2 : w/4;
        const angle = (i * Math.PI * 2) / 8 + (time * 2);
        ctx.lineTo(cx + Math.cos(angle)*radius, cy + Math.sin(angle)*radius);
      }
      ctx.closePath();
      ctx.fill();

      if (!isFlashing) {
        // Electric Nucleus Spark
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else if (this.type === EnemyType.SPLITTER) {
      // Toxic Bio-Anemone Dual Nucleus (Vivid Poison Emerald)
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy, cx + w/2, cy);
        grad.addColorStop(0, '#4ade80');
        grad.addColorStop(0.5, '#22c55e');
        grad.addColorStop(1, '#16a34a');
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.arc(cx - 7, cy, w/2.6, 0, Math.PI*2);
      ctx.arc(cx + 7, cy + 3, w/2.6, 0, Math.PI*2);
      ctx.fill();

      if (!isFlashing) {
        // Glowing Radioactive Spore Pearls
        ctx.fillStyle = '#bef264';
        ctx.shadowColor = '#84cc16';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx - 7, cy, 4, 0, Math.PI*2);
        ctx.arc(cx + 7, cy + 3, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else if (this.type === EnemyType.SHIELDED) {
      // Armored Nautilus / Turtle (Cyan & Jade Green Carapace)
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx - w/2, cy - h/2, cx + w/2, cy + h/2);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(0.5, '#0d9488');
        grad.addColorStop(1, '#047857');
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy - h/2);
      ctx.lineTo(cx + w/2, cy - h/4);
      ctx.lineTo(cx + w/2, cy + h/4);
      ctx.lineTo(cx, cy + h/2);
      ctx.lineTo(cx - w/2, cy + h/4);
      ctx.lineTo(cx - w/2, cy - h/4);
      ctx.closePath();
      ctx.fill();

      if (!isFlashing) {
        // Energy Lattice Scutes
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - w/2, cy); ctx.lineTo(cx + w/2, cy);
        ctx.moveTo(cx, cy - h/2); ctx.lineTo(cx, cy + h/2);
        ctx.stroke();

        // Ocular sensors
        ctx.fillStyle = '#a5f3fc';
        ctx.fillRect(cx - 6, cy - h/3, 3, 3);
        ctx.fillRect(cx + 3, cy - h/3, 3, 3);
      }
    } else {
      // NORMAL: Classic Bioluminescent Hydro-Jelly Octopus (Vibrant Cyan/Blue)
      if (!isFlashing) {
        const grad = ctx.createLinearGradient(cx, cy - h/2, cx, cy + h/2);
        grad.addColorStop(0, '#38bdf8'); // Sky Cyan
        grad.addColorStop(0.7, '#2563eb'); // Royal Blue
        grad.addColorStop(1, '#1d4ed8'); // Deep Blue
        ctx.fillStyle = grad;
      }

      // Bell Dome
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(cx - w/2, cy - h/2, w, h/2 + 6, [10, 10, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(cx - w/2, cy - h/2, w, h/2 + 6);
      }

      // Undulating Tentacles
      const tW = w / 6;
      for (let i=0; i<4; i++) {
        const offset = Math.sin(time * 4 + i * 1.2) * 5;
        ctx.fillRect(cx - w/2 + 2 + i*(tW * 1.4), cy + 4, tW, h/2 - 4 + offset);
      }

      if (!isFlashing) {
        // Glowing Aquatic Eyes
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(cx - 9, cy - h/4, 6, 6);
        ctx.fillRect(cx + 3, cy - h/4, 6, 6);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(cx - 7, cy - h/4 + 1, 3, 4);
        ctx.fillRect(cx + 5, cy - h/4 + 1, 3, 4);
      }
    }
    
    ctx.restore();
  }
}

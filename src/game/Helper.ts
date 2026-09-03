import { Entity } from './Entity';
import { Bullet } from './Bullet';
import { Enemy } from './Enemy';
import { Barricade } from './Barricade';
import { Player } from './Player';
import { soundManager } from './SoundManager';
import { Faction } from './types';

export enum HelperType {
  FIGHTER = 0,
  REPAIRER = 1,
  TANK = 2,
  MEDIC = 3
}

export const REPAIR_BOT = HelperType.REPAIRER;

export type AllyRoleName = 'Fighter' | 'Medic' | 'Repair Bot' | 'Tank';

export interface AllyRoleConfig {
  name: AllyRoleName;
  badgeLabel: string;
  icon: string;
  primaryColor: string;
  accentColor: string;
  borderColor: string;
  description: string;
  baseHp: number;
  maxHp: number;
  speed: number;
  lifespan: number;
}

export const ALLY_ROLE_CONFIGS: Record<HelperType, AllyRoleConfig> = {
  [HelperType.FIGHTER]: {
    name: 'Fighter',
    badgeLabel: 'FIGHTER',
    icon: '⚔️',
    primaryColor: '#22c55e',
    accentColor: '#86efac',
    borderColor: '#16a34a',
    description: 'Intercepts & attacks hostile invaders and saboteurs',
    baseHp: 4,
    maxHp: 4,
    speed: 320,
    lifespan: 18,
  },
  [HelperType.MEDIC]: {
    name: 'Medic',
    badgeLabel: 'MEDIC',
    icon: '💚',
    primaryColor: '#06b6d4',
    accentColor: '#67e8f9',
    borderColor: '#0891b2',
    description: 'Heals player HP, mitigates stress, and restores shields',
    baseHp: 3,
    maxHp: 3,
    speed: 280,
    lifespan: 20,
  },
  [HelperType.REPAIRER]: {
    name: 'Repair Bot',
    badgeLabel: 'REPAIR BOT',
    icon: '🔧',
    primaryColor: '#fbbf24',
    accentColor: '#fde047',
    borderColor: '#d97706',
    description: 'Prioritizes and repairs damaged barricades & structures',
    baseHp: 5,
    maxHp: 5,
    speed: 260,
    lifespan: 18,
  },
  [HelperType.TANK]: {
    name: 'Tank',
    badgeLabel: 'TANK',
    icon: '🛡️',
    primaryColor: '#a855f7',
    accentColor: '#d8b4fe',
    borderColor: '#7e22ce',
    description: 'Absorbs and intercepts incoming hostile projectiles',
    baseHp: 15,
    maxHp: 15,
    speed: 380,
    lifespan: 22,
  },
};

export class Helper extends Entity {
  public type: HelperType;
  public hp: number;
  public maxHp: number;
  public isInvincible: boolean = false;

  public actionTimer: number = 0;
  public actionInterval: number = 0.4;
  public tetherTarget: { x: number; y: number } | null = null;
  public feedbackText: string | null = null;
  public feedbackTimer: number = 0;
  public warpInTimer: number = 0.6;

  private canvasWidth: number;
  private canvasHeight: number;
  private fireTimer: number = 0;
  public lifespan: number = 18;
  public maxLifespan: number = 18;
  public targetX: number;

  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number, type: HelperType) {
    super(x, y, 40, 30);
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.faction = Faction.PLAYER;
    this.type = type;
    this.targetX = x;

    const config = ALLY_ROLE_CONFIGS[type] || ALLY_ROLE_CONFIGS[HelperType.FIGHTER];
    this.color = config.primaryColor;
    this.hp = config.baseHp;
    this.maxHp = config.maxHp;
    this.lifespan = config.lifespan;
    this.maxLifespan = config.lifespan;
    this.warpInTimer = 0.6;

    switch (type) {
      case HelperType.FIGHTER:
        this.actionInterval = 0.3;
        this.isInvincible = false;
        break;
      case HelperType.MEDIC:
        this.actionInterval = 3.5;
        this.isInvincible = false;
        break;
      case HelperType.REPAIRER:
        this.actionInterval = 0.4;
        this.isInvincible = false;
        break;
      case HelperType.TANK:
        this.actionInterval = 0.5;
        this.isInvincible = false;
        break;
      default:
        this.actionInterval = 0.4;
        this.isInvincible = false;
        break;
    }
  }

  public update(
    deltaTime: number,
    barricades: Barricade[],
    enemies: Enemy[],
    bullets: Bullet[],
    player?: Player
  ): Bullet[] {
    this.lifespan -= deltaTime;
    if (this.warpInTimer > 0) {
      this.warpInTimer = Math.max(0, this.warpInTimer - deltaTime);
    }
    if (this.feedbackTimer > 0) {
      this.feedbackTimer = Math.max(0, this.feedbackTimer - deltaTime);
      if (this.feedbackTimer <= 0) {
        this.feedbackText = null;
      }
    }
    this.actionTimer += deltaTime;
    const newBullets: Bullet[] = [];

    // Gentle vertical bobbing
    this.position.y += Math.sin(Date.now() / 200) * 0.4;

    // Role-specific AI behaviors
    if (this.type === HelperType.FIGHTER) {
      // 1. Target acquisition:
      // Priority 1: Barricade saboteurs / gnawing enemies
      // Priority 2: Diving or rushing enemies
      // Priority 3: Lowest-altitude enemy
      const hostiles = enemies.filter(e => !e.isDead && e.faction !== this.faction);
      let targetEnemy: Enemy | null = null;

      const saboteurs = hostiles.filter(e => e.isGnawing || (e as any).type === 13);
      if (saboteurs.length > 0) {
        saboteurs.sort((a, b) => b.position.y - a.position.y);
        targetEnemy = saboteurs[0];
      }

      if (!targetEnemy) {
        const divers = hostiles.filter(e => e.isDiving || e.isRushing);
        if (divers.length > 0) {
          divers.sort((a, b) => b.position.y - a.position.y);
          targetEnemy = divers[0];
        }
      }

      if (!targetEnemy && hostiles.length > 0) {
        let lowestY = -1;
        for (const e of hostiles) {
          if (e.position.y > lowestY) {
            lowestY = e.position.y;
            targetEnemy = e;
          }
        }
      }

      const defenseAltitude = this.canvasHeight - 80;
      const dy = defenseAltitude - this.position.y;
      if (Math.abs(dy) > 2) {
        this.position.y += Math.sign(dy) * Math.min(Math.abs(dy), 180 * deltaTime);
      }

      if (targetEnemy) {
        this.targetX = targetEnemy.position.x + targetEnemy.size.width / 2 - this.size.width / 2;
        this.tetherTarget = {
          x: targetEnemy.position.x + targetEnemy.size.width / 2,
          y: targetEnemy.position.y + targetEnemy.size.height / 2
        };
      } else {
        this.targetX = this.canvasWidth / 2 - this.size.width / 2;
        this.tetherTarget = null;
      }

      // Smooth horizontal tracking at 320 px/s
      const dx = this.targetX - this.position.x;
      if (Math.abs(dx) > 2) {
        this.position.x += Math.sign(dx) * Math.min(Math.abs(dx), 320 * deltaTime);
      }

      // Fire twin plasma bolts every 0.3s (speed -500, damage 2, faction PLAYER)
      this.fireTimer -= deltaTime;
      if (this.fireTimer <= 0) {
        this.fireTimer = 0.3;
        const leftX = this.position.x + this.size.width / 2 - 8;
        const rightX = this.position.x + this.size.width / 2 + 8;
        const boltY = this.position.y;

        const leftBolt = new Bullet(leftX, boltY, -500, 2, true, 1);
        leftBolt.faction = Faction.PLAYER;
        leftBolt.isPlayerBullet = true;

        const rightBolt = new Bullet(rightX, boltY, -500, 2, true, 1);
        rightBolt.faction = Faction.PLAYER;
        rightBolt.isPlayerBullet = true;

        newBullets.push(leftBolt, rightBolt);
        soundManager.playShoot();
      }
    } else if (this.type === HelperType.MEDIC) {
      // Targets player. Flanks player horizontally (x = player.x +- 45, y = player.y - 25)
      if (player && !player.isDead) {
        const offsetSide = this.position.x < player.position.x ? -45 : 45;
        this.targetX = player.position.x + offsetSide;
        const targetY = player.position.y - 25;

        // Keep inside canvas bounds
        if (this.targetX < 10) this.targetX = player.position.x + 45;
        if (this.targetX + this.size.width > this.canvasWidth - 10) this.targetX = player.position.x - 45;

        const dx = this.targetX - this.position.x;
        const dy = targetY - this.position.y;
        if (Math.abs(dx) > 2) {
          this.position.x += Math.sign(dx) * Math.min(Math.abs(dx), 280 * deltaTime);
        }
        if (Math.abs(dy) > 2) {
          this.position.y += Math.sign(dy) * Math.min(Math.abs(dy), 280 * deltaTime);
        }

        this.tetherTarget = {
          x: player.position.x + player.size.width / 2,
          y: player.position.y + player.size.height / 2
        };

        // When player.hp < player.maxHp, heals player.hp = Math.min(player.maxHp, player.hp + 1) every 3.5s
        if (this.actionTimer >= 3.5) {
          this.actionTimer = 0;
          if (player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + 1);
            this.feedbackText = '+1 HP';
            this.feedbackTimer = 1.0;
            soundManager.playPowerUp();
          } else {
            // Relieves suppression/stress
            player.stressLevel = Math.max(0, (player.stressLevel || 0) - 30);
            player.suppressionLevel = Math.max(0, (player.suppressionLevel || 0) - 30);
            this.feedbackText = '+SHIELD';
            this.feedbackTimer = 1.0;
          }
        }
      } else {
        this.tetherTarget = null;
        this.targetX = this.canvasWidth / 2 - this.size.width / 2;
        const dx = this.targetX - this.position.x;
        if (Math.abs(dx) > 2) {
          this.position.x += Math.sign(dx) * Math.min(Math.abs(dx), 200 * deltaTime);
        }
      }
    } else if (this.type === HelperType.REPAIRER) {
      // Prioritizes damaged central barricades (index 1 & 2), or barricade with lowest HP ratio
      let bestBarricade: Barricade | null = null;
      if (barricades.length > 0) {
        // Check central barricades (index 1 & 2) if damaged
        const centralIndices = [1, 2].filter(idx => idx < barricades.length);
        const damagedCentral = centralIndices
          .map(idx => barricades[idx])
          .filter(b => b && b.hp < b.maxHp);

        if (damagedCentral.length > 0) {
          damagedCentral.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
          bestBarricade = damagedCentral[0];
        }

        // If no central barricade damaged, find barricade with lowest HP ratio
        if (!bestBarricade) {
          const damagedBarricades = barricades.filter(b => b.hp < b.maxHp);
          if (damagedBarricades.length > 0) {
            damagedBarricades.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
            bestBarricade = damagedBarricades[0];
          }
        }
      }

      if (bestBarricade) {
        const barricadeWidth = (bestBarricade as any).width || bestBarricade.size.width;
        this.targetX = bestBarricade.position.x + barricadeWidth / 2 - this.size.width / 2;
        const targetY = bestBarricade.position.y - 25;

        const dx = this.targetX - this.position.x;
        const dy = targetY - this.position.y;
        if (Math.abs(dx) > 2) {
          this.position.x += Math.sign(dx) * Math.min(Math.abs(dx), 260 * deltaTime);
        }
        if (Math.abs(dy) > 2) {
          this.position.y += Math.sign(dy) * Math.min(Math.abs(dy), 260 * deltaTime);
        }

        // Amber repair arc beam to target barricade
        this.tetherTarget = {
          x: bestBarricade.position.x + barricadeWidth / 2,
          y: bestBarricade.position.y + 10
        };

        // If hovering over target barricade (within 40px), repairs every 0.4s
        if (Math.abs(this.position.x - this.targetX) < 40) {
          if (this.actionTimer >= 0.4) {
            this.actionTimer = 0;
            // +4 HP up to maxHp
            bestBarricade.hp = Math.min(bestBarricade.maxHp, bestBarricade.hp + 4);
            bestBarricade.isDead = false;
            this.feedbackText = '+REPAIR';
            this.feedbackTimer = 0.7;

            // Restores missing voxel blocks
            let restoredCount = 0;
            for (let i = 0; i < bestBarricade.blocks.length; i++) {
              if (!bestBarricade.blocks[i]) {
                bestBarricade.blocks[i] = true;
                restoredCount++;
                if (restoredCount >= 2) break;
              }
            }
          }
        }
      } else {
        this.tetherTarget = null;
        // Wander / patrol
        if (Math.abs(this.targetX - this.position.x) < 10) {
          this.targetX = Math.random() * (this.canvasWidth - this.size.width);
        }
        const dx = this.targetX - this.position.x;
        if (Math.abs(dx) > 2) {
          this.position.x += Math.sign(dx) * Math.min(Math.abs(dx), 200 * deltaTime);
        }
      }
    } else if (this.type === HelperType.TANK) {
      // Intercept incoming hostile projectiles
      let bestBullet: Bullet | null = null;
      let lowestY = -1;
      for (const b of bullets) {
        if (!b.isDead && b.faction !== this.faction && b.position.y > lowestY && b.position.y < this.position.y + 120) {
          lowestY = b.position.y;
          bestBullet = b;
        }
      }
      if (bestBullet) {
        this.targetX = bestBullet.position.x - this.size.width / 2;
        this.tetherTarget = null;
      } else {
        this.targetX = this.canvasWidth / 2 - this.size.width / 2;
      }

      const dx = this.targetX - this.position.x;
      if (Math.abs(dx) > 2) {
        this.position.x += Math.sign(dx) * Math.min(Math.abs(dx), 380 * deltaTime);
      }
    }

    // Clamp within canvas bounds
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.size.width > this.canvasWidth) {
      this.position.x = this.canvasWidth - this.size.width;
    }

    return newBullets;
  }

  public isExpired(): boolean {
    return this.lifespan <= 0 || (this.hp <= 0 && !this.isInvincible);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = this.position.x + this.size.width / 2;
    const cy = this.position.y + this.size.height / 2;
    const config = ALLY_ROLE_CONFIGS[this.type] || ALLY_ROLE_CONFIGS[HelperType.FIGHTER];

    // 1. Tether Beams
    if (this.tetherTarget) {
      ctx.save();
      if (this.type === HelperType.MEDIC) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 8;
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -Date.now() / 40;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(this.tetherTarget.x, this.tetherTarget.y);
        ctx.stroke();
      } else if (this.type === HelperType.REPAIRER) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;
        const midX = (cx + this.tetherTarget.x) / 2 + (Math.random() - 0.5) * 10;
        const midY = (cy + this.tetherTarget.y) / 2 + (Math.random() - 0.5) * 6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(midX, midY);
        ctx.lineTo(this.tetherTarget.x, this.tetherTarget.y);
        ctx.stroke();
      } else if (this.type === HelperType.FIGHTER) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(this.tetherTarget.x, this.tetherTarget.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Warp-In Flare FX
    if (this.warpInTimer > 0) {
      ctx.save();
      const progress = this.warpInTimer / 0.6;
      ctx.strokeStyle = config.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, (1 - progress) * 35 + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Flashing when lifespan is near expiry (< 3s)
    ctx.globalAlpha = (this.lifespan < 3) ? (Math.sin(this.lifespan * 15) > 0 ? 1 : 0.4) : 1;

    // 3. Ally Drone Body
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = config.primaryColor;

    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, this.size.width / 2, this.size.height / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy - 1, 4, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 8, cy - 1, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy - 1, 2, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 8, cy - 1, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Overhead Dynamic Health Bar (38x5px)
    const barWidth = 38;
    const barHeight = 5;
    const barX = cx - barWidth / 2;
    const barY = this.position.y - 8;

    // Dark background track
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 1px border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Dynamic color fill (green/amber/red based on HP%)
    const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    const fillWidth = barWidth * hpRatio;
    let fillColor = '#22c55e';
    if (this.isInvincible) {
      fillColor = '#38bdf8';
    } else if (hpRatio < 0.3) {
      fillColor = '#ef4444';
    } else if (hpRatio <= 0.6) {
      fillColor = '#f59e0b';
    }
    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Numeric HP readout
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    const hpText = `${this.hp}/${this.maxHp}`;
    ctx.strokeText(hpText, cx, barY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(hpText, cx, barY);

    // 5. Role Badge Pill (icon + label, high contrast >= 7:1)
    const badgeY = barY - 14;
    const badgeWidth = 68;
    const badgeHeight = 12;
    const badgeX = cx - badgeWidth / 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 1.5;
    if (typeof (ctx as any).roundRect === 'function') {
      ctx.beginPath();
      (ctx as any).roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 3);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
    }

    const badgeText = `[${config.icon} ${config.badgeLabel}]`;
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(badgeText, cx, badgeY + badgeHeight / 2);
    ctx.fillStyle = config.accentColor;
    ctx.fillText(badgeText, cx, badgeY + badgeHeight / 2);

    // 6. Floating Feedback Text (+1 HP, +REPAIR)
    if (this.feedbackText && this.feedbackTimer > 0) {
      const floatY = badgeY - 6 - (1 - Math.min(1, this.feedbackTimer)) * 12;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeText(this.feedbackText, cx, floatY);
      ctx.fillStyle = this.feedbackText.includes('HP')
        ? '#4ade80'
        : (this.feedbackText.includes('REPAIR') ? '#fde047' : '#38bdf8');
      ctx.fillText(this.feedbackText, cx, floatY);
    }

    ctx.restore();
  }
}

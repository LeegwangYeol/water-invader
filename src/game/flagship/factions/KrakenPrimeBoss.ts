// ============================================================================
// WATER INVADER: APEX BOSS - CHARYBDIS PRIME (ABYSSAL MEGALODON KRAKEN)
// Feature 10: 12,000 EHP Multi-Stage Apex Boss with IK Tentacles & Maw Vortex
// ============================================================================

import {
  IApexBossManager,
  IFlagshipSubsystem,
  FlagshipUpdateContext,
  ApexBossState,
  ApexBossType,
  IBossSubsystem,
} from '../types';
import { Bullet } from '../../Bullet';
import { Player } from '../../Player';
import { Barricade } from '../../Barricade';
import { Vector2D, Rect } from '../../types';

export interface TentacleJoint {
  x: number;
  y: number;
  angle: number;
  length: number;
}

export class CharybdisTentacle implements IBossSubsystem {
  public id: string;
  public name: string;
  public hp: number;
  public maxHp: number;
  public isDestroyed: boolean = false;
  public localBounds: Rect;
  public damageMultiplier: number = 1.0;

  public rootX: number;
  public rootY: number;
  public joints: TentacleJoint[] = [];
  public targetPos: Vector2D = { x: 0, y: 0 };
  public waveOffset: number;
  public slamTimer: number = 0;
  public isSlamming: boolean = false;
  public slamTelegraphX: number = 0;
  public swatCooldown: number = 0;

  constructor(id: string, name: string, rootX: number, rootY: number, waveOffset: number) {
    this.id = id;
    this.name = name;
    this.rootX = rootX;
    this.rootY = rootY;
    this.waveOffset = waveOffset;
    this.hp = 1000;
    this.maxHp = 1000;
    this.localBounds = { x: rootX - 25, y: rootY, width: 50, height: 160 };

    // 5 segments with length 32px each (total length 160px)
    for (let i = 0; i < 5; i++) {
      this.joints.push({
        x: rootX,
        y: rootY + (i + 1) * 32,
        angle: Math.PI / 2,
        length: 32,
      });
    }
  }

  public takeDamage(amount: number): number {
    if (this.isDestroyed) return 0;
    const effective = amount * this.damageMultiplier;
    this.hp = Math.max(0, this.hp - effective);
    if (this.hp <= 0) {
      this.isDestroyed = true;
    }
    return effective;
  }

  /**
   * Analytic 5-segment Inverse Kinematics solver for tentacle motion.
   */
  public updateIK(targetX: number, targetY: number, time: number, deltaTime: number): void {
    if (this.isDestroyed) return;

    if (this.swatCooldown > 0) this.swatCooldown -= deltaTime;
    if (this.slamTimer > 0) this.slamTimer -= deltaTime;

    // Idle sinusoidal undulation + IK reach toward target
    const segCount = this.joints.length;
    let prevX = this.rootX;
    let prevY = this.rootY;

    // Cyclic coordinate descent toward target
    for (let i = 0; i < segCount; i++) {
      const joint = this.joints[i];
      const wave = Math.sin(time * 3 + this.waveOffset + i * 0.8) * 0.45;
      
      // Target direction influence
      const dx = targetX - prevX;
      const dy = targetY - prevY;
      const targetAngle = Math.atan2(dy, dx);

      // Blend target angle with wave undulation
      const blend = (i + 1) / segCount;
      joint.angle = (1 - blend * 0.6) * (Math.PI / 2 + wave) + blend * 0.6 * targetAngle;

      joint.x = prevX + Math.cos(joint.angle) * joint.length;
      joint.y = prevY + Math.sin(joint.angle) * joint.length;

      prevX = joint.x;
      prevY = joint.y;
    }

    // Update local bounds to tip region for hit testing
    const tip = this.joints[segCount - 1];
    this.localBounds.x = tip.x - 20;
    this.localBounds.y = tip.y - 20;
    this.localBounds.width = 40;
    this.localBounds.height = 40;
  }
}

export class KrakenPrimeBoss implements IApexBossManager, IFlagshipSubsystem {
  public readonly id = 'apex-boss';
  public activeBoss: ApexBossState | null = null;

  // Boss core positioning & kinematics
  public position: Vector2D = { x: 300, y: 110 };
  public velocity: Vector2D = { x: 45, y: 0 };
  public width: number = 540;
  public height: number = 180;

  // Subsystems & 8 Destructible Tentacles
  public tentacles: CharybdisTentacle[] = [];
  public mawSubsystem: IBossSubsystem | null = null;
  public coreSubsystem: IBossSubsystem | null = null;

  // Tooth shrapnel & ink projectile pools
  public toothProjectiles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    damage: number;
    isDead: boolean;
  }> = [];

  // Phase 3 Breach Charge kinematics
  public isCharging: boolean = false;
  public chargeDir: number = 1;
  public chargeSpeed: number = 750; // 750 px/s breach charge
  public chargeCooldown: number = 6.0;

  // Stun timer (from Cavitation Torpedo inside maw)
  public concussionStunTimer: number = 0;

  // Visual anim timer
  public animTimer: number = 0;
  public teethRotationAngle: number = 0;

  constructor() {
    this.reset();
  }

  public init(): void {
    this.reset();
  }

  public spawnApexBoss(type: ApexBossType = ApexBossType.CHARYBDIS_PRIME): void {
    // Total Encounter Health Budget: 12,000 EHP
    this.activeBoss = {
      type,
      phase: 1,
      totalHp: 12000,
      maxHp: 12000,
      subsystems: new Map(),
      isEnraged: false,
      enrageTimer: 45.0, // 45s countdown in Phase 3
      vortexActive: false,
      vortexPullForce: 0,
      darknessOverlayAlpha: 0.0,
    };

    this.position = { x: 300, y: 110 };
    this.tentacles = [];

    // Initialize 8 Articulated Tentacles
    // Tentacles 1-4: Frontal living ramparts (1,000 HP each = 4,000 HP in Phase 1)
    const frontalOffsets = [-180, -70, 70, 180];
    for (let i = 0; i < 4; i++) {
      const t = new CharybdisTentacle(
        `tentacle_${i + 1}`,
        `전면 생체 촉수 #${i + 1}`,
        this.position.x + frontalOffsets[i],
        this.position.y + 30,
        i * 1.5
      );
      this.tentacles.push(t);
      this.activeBoss.subsystems.set(t.id, t);
    }

    // Tentacles 5-8: Flank & propulsion fins
    const flankOffsets = [-240, -210, 210, 240];
    for (let i = 0; i < 4; i++) {
      const t = new CharybdisTentacle(
        `tentacle_${i + 5}`,
        `측면 보조 촉수 #${i + 5}`,
        this.position.x + flankOffsets[i],
        this.position.y + 10,
        i * 2.0
      );
      this.tentacles.push(t);
      this.activeBoss.subsystems.set(t.id, t);
    }

    // Maw Gullet Subsystem (Phase 2 weakpoint with 2.5x critical multiplier)
    this.mawSubsystem = {
      id: 'charybdis_maw',
      name: '카리브디스 심연 구강 (Charybdis Gullet)',
      hp: 4000,
      maxHp: 4000,
      isDestroyed: false,
      localBounds: { x: this.position.x - 60, y: this.position.y - 30, width: 120, height: 80 },
      damageMultiplier: 2.5, // 2.5x Critical Weakpoint!
      takeDamage: (amount: number) => {
        if (!this.activeBoss) return 0;
        const critDmg = amount * 2.5;
        if (this.mawSubsystem) {
          this.mawSubsystem.hp = Math.max(0, this.mawSubsystem.hp - critDmg);
          if (this.mawSubsystem.hp <= 0) {
            this.mawSubsystem.isDestroyed = true;
          }
        }
        this.activeBoss.totalHp = Math.max(0, this.activeBoss.totalHp - critDmg);
        return critDmg;
      },
    };
    this.activeBoss.subsystems.set(this.mawSubsystem.id, this.mawSubsystem);

    // Main Leviathan Hull Core
    this.coreSubsystem = {
      id: 'kraken_core',
      name: '크라켄 아펙스 중추 (Abyssal Apex Core)',
      hp: 4000,
      maxHp: 4000,
      isDestroyed: false,
      localBounds: { x: this.position.x - 200, y: this.position.y - 50, width: 400, height: 100 },
      damageMultiplier: 1.0,
      takeDamage: (amount: number) => {
        if (!this.activeBoss) return 0;
        // Invulnerable in Phase 1 if frontal tentacles still live
        if (this.activeBoss.phase === 1 && this.getAliveFrontalTentaclesCount() > 0) {
          return 0; // Deflected by living tentacle ramparts
        }
        // In Phase 2, deflect Core damage while maw is alive
        if (this.activeBoss.phase === 2 && this.mawSubsystem && !this.mawSubsystem.isDestroyed) {
          return 0; // Deflected while maw is alive
        }
        this.activeBoss.totalHp = Math.max(0, this.activeBoss.totalHp - amount);
        return amount;
      },
    };
    this.activeBoss.subsystems.set(this.coreSubsystem.id, this.coreSubsystem);
  }

  public getAliveFrontalTentaclesCount(): number {
    return this.tentacles.slice(0, 4).filter((t) => !t.isDestroyed).length;
  }

  // ==========================================================================
  // UPDATE LOOP
  // ==========================================================================

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    if (!this.activeBoss) return;

    const { player, bullets, barricades, createExplosion, triggerScreenShake } = context;

    // 0. Handle Boss Defeat when totalHp <= 0
    if (this.activeBoss.totalHp <= 0) {
      this.isCharging = false;
      this.activeBoss.isEnraged = false;
      this.activeBoss.vortexActive = false;
      this.activeBoss.darknessOverlayAlpha = 0;

      // Defeat FX
      for (let i = 0; i < 6; i++) {
        const ox = this.position.x + (Math.random() - 0.5) * 200;
        const oy = this.position.y + (Math.random() - 0.5) * 100;
        createExplosion(ox, oy, '#ef4444', 40, 3.0);
      }
      triggerScreenShake(0.8, 15);

      // Advance wave & spawn loot
      context.score += 25000;
      context.currency += 500;
      if (context.level !== undefined) {
        context.level += 1;
      }

      this.activeBoss = null;
      this.toothProjectiles = [];
      for (const t of this.tentacles) {
        t.isDestroyed = true;
      }
      return;
    }

    this.animTimer += deltaTime;

    // Handle Concussion Stun from Torpedo
    if (this.concussionStunTimer > 0) {
      this.concussionStunTimer -= deltaTime;
      // Stunned: vortex disabled, cannot attack
      this.activeBoss.vortexActive = false;
      return;
    }

    // 1. Phase Progression Evaluation
    // Phase 1: 12000 -> 8000 (Tentacle Ramparts)
    // Phase 2: 8000 -> 4000 (Charybdis Maw Inhalation Vortex)
    // Phase 3: 4000 -> 0 (Abyssal Rage & Bioluminescent Ink Blackout)
    if (this.activeBoss.totalHp <= 4000 && this.activeBoss.phase !== 3) {
      this.activeBoss.phase = 3;
      this.activeBoss.isEnraged = true;
      this.activeBoss.darknessOverlayAlpha = 0.88; // Ink blackout
      triggerScreenShake(0.6, 12);
      createExplosion(this.position.x, this.position.y, '#ef4444', 40, 3.0);
    } else if (this.activeBoss.totalHp <= 8000 && this.activeBoss.phase === 1) {
      this.activeBoss.phase = 2;
      this.activeBoss.vortexActive = true;
      triggerScreenShake(0.4, 8);
      createExplosion(this.position.x, this.position.y, '#00f0ff', 30, 2.5);
    }

    // 2. Boss Kinematics: Sinusoidal lateral sway
    if (!this.isCharging) {
      this.position.x += this.velocity.x * deltaTime;
      if (this.position.x < 180) {
        this.position.x = 180;
        this.velocity.x = Math.abs(this.velocity.x);
      } else if (this.position.x > 420) {
        this.position.x = 420;
        this.velocity.x = -Math.abs(this.velocity.x);
      }
    }

    // 3. Update 8 Tentacles with IK toward Player or Target Points
    const frontalOffsets = [-180, -70, 70, 180];
    const flankOffsets = [-240, -210, 210, 240];

    for (let i = 0; i < 4; i++) {
      const t = this.tentacles[i];
      t.rootX = this.position.x + frontalOffsets[i];
      t.rootY = this.position.y + 30;

      // Active Missile Swat: If a missile is near tentacle, whip across and swat it
      for (const b of bullets) {
        if (!b.isDead && ((b as any).isHoming || (b as any).homing)) {
          const distToTip = Math.hypot(t.localBounds.x - b.position.x, t.localBounds.y - b.position.y);
          if (distToTip <= 70 && t.swatCooldown <= 0 && !t.isDestroyed) {
            t.swatCooldown = 1.2; // Fatigue cooldown
            b.isDead = true;
            createExplosion(b.position.x, b.position.y, '#38bdf8', 15, 1.3);
            break;
          }
        }
      }

      // Seismic Barricade Pulverizer: Periodic slam on barricades
      if (!t.isDestroyed && Math.random() < deltaTime * 0.12 && !t.isSlamming) {
        t.isSlamming = true;
        t.slamTimer = 1.8; // Telegraph for 1.8s
        t.slamTelegraphX = t.rootX;
      }

      if (t.isSlamming) {
        if (t.slamTimer <= 0) {
          // Slam down onto barricades!
          t.isSlamming = false;
          triggerScreenShake(0.35, 7);
          createExplosion(t.slamTelegraphX, 740, '#00f0ff', 25, 2.0);

          for (const bar of barricades) {
            if (!bar.isDead && Math.abs(bar.position.x + bar.size.width / 2 - t.slamTelegraphX) < 45) {
              bar.takeDamage(40); // Obliterate barricade voxels in that column
            }
          }
        }
      }

      // Target player position with inverse kinematics
      t.updateIK(player.position.x + 20, player.position.y, this.animTimer, deltaTime);
    }

    for (let i = 0; i < 4; i++) {
      const t = this.tentacles[i + 4];
      t.rootX = this.position.x + flankOffsets[i];
      t.rootY = this.position.y + 10;
      t.updateIK(t.rootX + Math.sin(this.animTimer + i) * 60, t.rootY + 120, this.animTimer, deltaTime);
    }

    // 4. Phase 2: Hydrodynamic Inhalation Vortex Pull
    if (this.activeBoss.phase === 2) {
      this.teethRotationAngle += 2.8 * deltaTime;

      // Inhalation Vortex Force: F_pull = -K_vortex / max(40, y_player - y_maw)^1.2
      const dy = Math.max(40, player.position.y - this.position.y);
      const kFactor = 14500;
      const pullSpeed = (kFactor / Math.pow(dy, 1.2)); // ~220 px/s near middle
      this.activeBoss.vortexPullForce = pullSpeed;

      // Pull player upward toward the maw!
      player.position.y = Math.max(220, player.position.y - pullSpeed * deltaTime);

      // Periodically spit tooth shrapnel
      if (Math.random() < deltaTime * 3.5) {
        this.toothProjectiles.push({
          x: this.position.x + (Math.random() - 0.5) * 80,
          y: this.position.y + 20,
          vx: (Math.random() - 0.5) * 120,
          vy: 260 + Math.random() * 80,
          radius: 5,
          damage: 1,
          isDead: false,
        });
      }
    }

    // 5. Phase 3: Abyssal Rage & Screen-Crossing Breach Charge
    if (this.activeBoss.phase === 3) {
      // 45s Enrage Timer Countdown
      this.activeBoss.enrageTimer -= deltaTime;
      if (this.activeBoss.enrageTimer <= 0) {
        // Hadal Extinction Wave!
        triggerScreenShake(0.5, 10);
        if (player.invincibilityTimer <= 0) {
          player.hp = Math.max(0, player.hp - 1);
          player.hitFlashTimer = 0.2;
          player.invincibilityTimer = 0.5;
        }
      }

      // Breach Charge cycle every 6.0s
      this.chargeCooldown -= deltaTime;
      if (this.chargeCooldown <= 0 && !this.isCharging) {
        this.isCharging = true;
        this.chargeDir = this.position.x < 300 ? 1 : -1;
        triggerScreenShake(0.4, 8);
      }

      if (this.isCharging) {
        this.position.x += this.chargeDir * this.chargeSpeed * deltaTime;
        if (this.position.x < -100 || this.position.x > 700) {
          this.isCharging = false;
          this.chargeCooldown = 6.0;
          this.position.x = this.chargeDir > 0 ? 550 : 50;
        }

        // Damage player if caught in breach charge path
        const dist = Math.hypot(player.position.x + 20 - this.position.x, player.position.y + 15 - this.position.y);
        if (dist < 80 && player.invincibilityTimer <= 0) {
          player.hp = Math.max(0, player.hp - 2);
          player.hitFlashTimer = 0.25;
          player.invincibilityTimer = 0.8;
          triggerScreenShake(0.4, 10);
        }
      }
    }

    // 6. Update Tooth Shrapnel Projectiles
    for (let i = this.toothProjectiles.length - 1; i >= 0; i--) {
      const tp = this.toothProjectiles[i];
      tp.x += tp.vx * deltaTime;
      tp.y += tp.vy * deltaTime;

      // Barricade collision
      for (const b of barricades) {
        if (!b.isDead && tp.x >= b.position.x && tp.x <= b.position.x + b.size.width &&
            tp.y >= b.position.y && tp.y <= b.position.y + b.size.height) {
          b.takeDamage(tp.damage);
          createExplosion(tp.x, tp.y, '#f8fafc', 6, 0.6);
          tp.isDead = true;
          break;
        }
      }

      // Player collision
      const dist = Math.hypot(player.position.x + 20 - tp.x, player.position.y + 15 - tp.y);
      if (dist < tp.radius + 15) {
        if (player.invincibilityTimer <= 0) {
          player.hp = Math.max(0, player.hp - tp.damage);
          player.hitFlashTimer = 0.15;
          player.invincibilityTimer = 0.6;
        }
        createExplosion(tp.x, tp.y, '#f8fafc', 8, 0.8);
        tp.isDead = true;
      }

      if (tp.isDead || tp.y > 850) {
        this.toothProjectiles.splice(i, 1);
      }
    }

    // 7. Check Bullet Collisions against Boss Subsystems & Gullet
    this.checkBulletCollisions(bullets, context);
  }

  // ==========================================================================
  // BULLET COLLISION & WEAKPOINT DAMAGE RESOLUTION
  // ==========================================================================

  private checkBulletCollisions(bullets: Bullet[], context: FlagshipUpdateContext): void {
    if (!this.activeBoss) return;
    const { createExplosion, triggerScreenShake } = context;

    for (const b of bullets) {
      if (b.isDead) continue;

      let bulletDmg = 15;
      const isPiercing = Boolean((b as any).piercing && (b as any).piercing >= 2);
      if (isPiercing) bulletDmg = 25;

      // 1. Check Hits against Tentacles
      for (const t of this.tentacles) {
        if (t.isDestroyed) continue;
        if (
          b.position.x >= t.localBounds.x &&
          b.position.x <= t.localBounds.x + t.localBounds.width &&
          b.position.y >= t.localBounds.y &&
          b.position.y <= t.localBounds.y + t.localBounds.height
        ) {
          const dealt = t.takeDamage(bulletDmg);
          this.activeBoss.totalHp = Math.max(0, this.activeBoss.totalHp - dealt);
          b.isDead = !isPiercing;
          createExplosion(b.position.x, b.position.y, '#059669', 10, 1.0);

          if (t.isDestroyed) {
            // Severed tentacle awards +150 Pure Water
            context.currency += 150;
            context.score += 1500;
            createExplosion(t.localBounds.x + 20, t.localBounds.y + 20, '#059669', 30, 2.2);
            triggerScreenShake(0.3, 6);
          }
          break;
        }
      }

      if (b.isDead) continue;

      // 2. Check Hits against Charybdis Maw Gullet (2.5x Critical Weakpoint in Phase 2)
      if (this.activeBoss.phase === 2 && this.mawSubsystem) {
        const mawX = this.position.x;
        const mawY = this.position.y;
        const distToMaw = Math.hypot(b.position.x - mawX, b.position.y - mawY);

        if (distToMaw <= 48) {
          // DIRECT HIT INTO GULLET: 2.5x CRITICAL DAMAGE!
          const critDmg = bulletDmg * 2.5;
          this.activeBoss.totalHp = Math.max(0, this.activeBoss.totalHp - critDmg);
          b.isDead = !isPiercing;
          createExplosion(b.position.x, b.position.y, '#ef4444', 20, 1.8);
          triggerScreenShake(0.2, 5);
          continue;
        }
      }

      // 3. Check Hits against Main Leviathan Hull Core
      const halfW = this.width / 2;
      const halfH = this.height / 2;
      if (
        b.position.x >= this.position.x - halfW &&
        b.position.x <= this.position.x + halfW &&
        b.position.y >= this.position.y - halfH &&
        b.position.y <= this.position.y + halfH
      ) {
        // In Phase 1: Invulnerable while frontal tentacles live
        if (this.activeBoss.phase === 1 && this.getAliveFrontalTentaclesCount() > 0) {
          // Deflected by living tentacle ramparts
          createExplosion(b.position.x, b.position.y, '#94a3b8', 6, 0.7);
          b.isDead = true;
          continue;
        }

        // In Phase 2: Deflected while maw is alive
        if (this.activeBoss.phase === 2 && this.mawSubsystem && !this.mawSubsystem.isDestroyed) {
          createExplosion(b.position.x, b.position.y, '#94a3b8', 6, 0.7);
          b.isDead = true;
          continue;
        }

        this.activeBoss.totalHp = Math.max(0, this.activeBoss.totalHp - bulletDmg);
        b.isDead = !isPiercing;
        createExplosion(b.position.x, b.position.y, '#1e293b', 8, 0.9);
      }
    }
  }

  /**
   * Concussion Stun triggered by Cavitation Torpedo detonating inside the maw.
   */
  public triggerConcussionStun(duration: number = 2.5): void {
    this.concussionStunTimer = duration;
    if (this.activeBoss) {
      this.activeBoss.vortexActive = false;
    }
  }

  // ==========================================================================
  // RENDERING: PROCEDURAL MULTI-JOINTED TENTACLES & SERRATED MAW
  // ==========================================================================

  public drawWorld(ctx: CanvasRenderingContext2D, time: number): void {
    if (!this.activeBoss || !ctx || typeof ctx.save !== 'function') return;

    // 1. Render 8 Destructible Articulated Tentacles
    for (const t of this.tentacles) {
      if (t.isDestroyed) continue;
      this.drawTentacle(ctx, t);
    }

    // 2. Render Main Leviathan Chitin Chassis
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Dark Hadal Carapace
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.ellipse(0, 0, 260, 75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Render Concentric Rotating Serrated Teeth & Gullet (Phase 2 & 3)
    if (this.activeBoss.phase >= 2) {
      // Deep Abyssal Gullet Core
      const gulletGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 52);
      gulletGrad.addColorStop(0, '#000000');
      gulletGrad.addColorStop(0.7, '#7f1d1d');
      gulletGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = gulletGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.fill();

      // Outer Tooth Ring (Rotating Clockwise)
      ctx.save();
      ctx.rotate(this.teethRotationAngle);
      ctx.fillStyle = '#f8fafc';
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI / 8) * i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 48, Math.sin(a) * 48);
        ctx.lineTo(Math.cos(a + 0.1) * 36, Math.sin(a + 0.1) * 36);
        ctx.lineTo(Math.cos(a + 0.2) * 48, Math.sin(a + 0.2) * 48);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Inner Tooth Ring (Counter-Rotating)
      ctx.save();
      ctx.rotate(-this.teethRotationAngle * 1.3);
      ctx.fillStyle = '#cbd5e1';
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 32, Math.sin(a) * 32);
        ctx.lineTo(Math.cos(a + 0.15) * 20, Math.sin(a + 0.15) * 20);
        ctx.lineTo(Math.cos(a + 0.3) * 32, Math.sin(a + 0.3) * 32);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Glowing Red Predator Eyes
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(-140, -15, 14, 6, -0.2, 0, Math.PI * 2);
    ctx.ellipse(140, -15, 14, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // 4. Render Tooth Shrapnel Projectiles
    for (const tp of this.toothProjectiles) {
      ctx.save();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, tp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawTentacle(ctx: CanvasRenderingContext2D, t: CharybdisTentacle): void {
    ctx.save();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Bone joints spline
    ctx.beginPath();
    ctx.moveTo(t.rootX, t.rootY);
    for (let i = 0; i < t.joints.length; i++) {
      ctx.lineTo(t.joints[i].x, t.joints[i].y);
    }
    ctx.stroke();

    // Suckers along tentacle
    ctx.fillStyle = '#84cc16';
    for (let i = 0; i < t.joints.length; i++) {
      const j = t.joints[i];
      ctx.beginPath();
      ctx.arc(j.x + Math.sin(j.angle) * 8, j.y + Math.cos(j.angle) * 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Telegraph line if slamming
    if (t.isSlamming) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(t.slamTelegraphX, t.rootY);
      ctx.lineTo(t.slamTelegraphX, 780);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // ==========================================================================
  // FOREGROUND: INK BLACKOUT & TRI-SEGMENTED BOSS HUD
  // ==========================================================================

  public drawForeground(ctx: CanvasRenderingContext2D, time: number): void {
    if (!this.activeBoss || !ctx || typeof ctx.save !== 'function') return;

    // 1. Bioluminescent Ink Blackout Overlay in Phase 3
    if (this.activeBoss.phase === 3 && this.activeBoss.darknessOverlayAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(3, 7, 18, ${this.activeBoss.darknessOverlayAlpha})`;
      ctx.fillRect(0, 0, 600, 800);
      ctx.restore();
    }

    // 2. Tri-Segmented Boss Health Bar (Top of Screen)
    ctx.save();
    const barW = 480;
    const barH = 14;
    const barX = 60;
    const barY = 25;

    // Background bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

    // Segments: 3 blocks of 160px each
    const segW = barW / 3;
    const totalHpRatio = this.activeBoss.totalHp / this.activeBoss.maxHp;

    const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    fillGrad.addColorStop(0, '#ef4444');
    fillGrad.addColorStop(0.5, '#f59e0b');
    fillGrad.addColorStop(1, '#00f0ff');

    ctx.fillStyle = fillGrad;
    ctx.fillRect(barX, barY, barW * totalHpRatio, barH);

    // Segment divider lines
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(barX + segW, barY);
    ctx.lineTo(barX + segW, barY + barH);
    ctx.moveTo(barX + segW * 2, barY);
    ctx.lineTo(barX + segW * 2, barY + barH);
    ctx.stroke();

    // Boss Name & Phase Badge
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`CHARYBDIS PRIME // PHASE ${this.activeBoss.phase}`, barX, barY - 6);

    // HP Readout & Enrage Timer
    ctx.textAlign = 'right';
    if (this.activeBoss.phase === 3) {
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`ENRAGE: ${Math.max(0, this.activeBoss.enrageTimer).toFixed(1)}s`, barX + barW, barY - 6);
    } else {
      ctx.fillText(`${Math.round(this.activeBoss.totalHp)} / ${this.activeBoss.maxHp} HP`, barX + barW, barY - 6);
    }

    ctx.restore();
  }

  public reset(): void {
    this.activeBoss = null;
    this.tentacles = [];
    this.toothProjectiles = [];
    this.isCharging = false;
    this.concussionStunTimer = 0;
  }
}

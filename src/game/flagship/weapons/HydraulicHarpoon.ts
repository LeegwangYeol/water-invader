// ============================================================================
// WATER INVADER: FEATURE 3 - HYDRAULIC HARPOON & KINETIC SLINGSHOT WINCH
// ============================================================================

import { Entity } from '../../Entity';
import { Bullet } from '../../Bullet';
import { Vector2D, Faction } from '../../types';
import { soundManager } from '../../SoundManager';
import {
  IHydraulicHarpoon,
  HarpoonState,
  HarpoonTetherConfig,
  SlingshotReleaseResult,
  FlagshipUpdateContext,
} from '../types';

export const DEFAULT_HARPOON_CONFIG: HarpoonTetherConfig = {
  restLength: 110,      // Equilibrium rest cable length (px)
  maxLength: 420,       // Maximum elastic cable elongation limit (px)
  springStiffness: 95.0,// Harmonic spring constant k_s (N/px)
  damping: 8.5,         // Viscous damping coefficient c_d (N*s/px)
  winchSpeed: 240,      // Hydraulic reel speed (px/s)
  launchSpeed: 650,     // Pneumatic muzzle velocity (px/s)
  retractSpeed: 550,    // High-speed auto-rewind speed (px/s)
  slingshotBonus: 720,  // Catapult impulse launch velocity (px/s)
  slingshotDamage: 180, // Piercing kinetic impact damage (dmg)
};

interface CableNode {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

interface SlingshotProjectile {
  entity: Entity;
  velocity: Vector2D;
  damage: number;
  remainingLife: number;
  hitEntities: Set<Entity>;
}

interface EmpShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

/**
 * Concrete Pneumatic Hydraulic Harpoon & Kinetic Slingshot Subsystem.
 * Implements 12-node Verlet physics cable, non-linear strain-hardening spring
 * constraints (ks=95, cd=8.5), hydraulic winching, living meat-shield bullet absorption,
 * centripetal whip collision damage, and slingshot catapult eject.
 */
export class HydraulicHarpoon implements IHydraulicHarpoon {
  public readonly id = 'hydraulic-harpoon';

  public state: HarpoonState = HarpoonState.READY;
  public tetheredEntity: Entity | null = null;
  public currentLength: number = 0;
  public strainRatio: number = 0;
  public isWinching: boolean = false;

  public readonly config: HarpoonTetherConfig;
  private effectiveRestLength: number;

  // Harpoon Grapple Head Kinematics (When FLYING or RETRACTING)
  public headPosition: Vector2D = { x: 0, y: 0 };
  public headVelocity: Vector2D = { x: 0, y: 0 };

  // 12-Node Verlet Physics Cable
  private readonly nodeCount: number = 12;
  private cableNodes: CableNode[] = [];

  // Active Slingshot Projectiles & EMP Effects
  private slingshotProjectiles: SlingshotProjectile[] = [];
  private activeEmpBursts: EmpShockwave[] = [];

  // Tracking Player Velocity for Centripetal Whip Physics
  private prevPlayerPos: Vector2D = { x: 0, y: 0 };
  private playerVelocity: Vector2D = { x: 0, y: 0 };

  // Shudder phase for high strain vibration
  private tremorPhase: number = 0;

  constructor(config: Partial<HarpoonTetherConfig> = {}) {
    this.config = { ...DEFAULT_HARPOON_CONFIG, ...config };
    this.effectiveRestLength = this.config.restLength;
    this.initVerletNodes({ x: 300, y: 740 });
  }

  private initVerletNodes(anchor: Vector2D): void {
    this.cableNodes = [];
    for (let i = 0; i < this.nodeCount; i++) {
      this.cableNodes.push({
        x: anchor.x,
        y: anchor.y - i * 5,
        prevX: anchor.x,
        prevY: anchor.y - i * 5,
      });
    }
  }

  /**
   * Fire the pneumatic harpoon dart from player prow.
   */
  public fire(origin: Vector2D): boolean {
    if (this.state !== HarpoonState.READY) return false;

    this.state = HarpoonState.FLYING;
    this.headPosition = { x: origin.x, y: origin.y };
    this.headVelocity = { x: 0, y: -this.config.launchSpeed };
    this.effectiveRestLength = this.config.restLength;
    this.tetheredEntity = null;
    this.currentLength = 0;
    this.strainRatio = 0;

    this.initVerletNodes(origin);

    try {
      soundManager.playShoot();
    } catch {
      // Safe fallback
    }
    return true;
  }

  public startWinch(): void {
    if (this.state === HarpoonState.TETHERED) {
      this.isWinching = true;
    }
  }

  public stopWinch(): void {
    this.isWinching = false;
  }

  /**
   * Release slingshot catapult: fling tethered enemy forward as a piercing projectile.
   */
  public releaseSlingshot(): SlingshotReleaseResult | null {
    if (this.state !== HarpoonState.TETHERED || !this.tetheredEntity) {
      return null;
    }

    const target = this.tetheredEntity;
    this.tetheredEntity = null;
    this.state = HarpoonState.RETRACTING;
    this.isWinching = false;

    // Catapult launch velocity straight up into enemy formations
    const slingshotVelocity: Vector2D = {
      x: this.playerVelocity.x * 0.5,
      y: -this.config.slingshotBonus,
    };

    const result: SlingshotReleaseResult = {
      entity: target,
      velocity: slingshotVelocity,
      damage: this.config.slingshotDamage,
    };

    this.slingshotProjectiles.push({
      entity: target,
      velocity: slingshotVelocity,
      damage: this.config.slingshotDamage,
      remainingLife: 1.6, // travels across screen
      hitEntities: new Set<Entity>([target]),
    });

    try {
      soundManager.playMissileExplosion();
    } catch {
      // Safe fallback
    }

    return result;
  }

  /**
   * Saline Electrical Shock Conduction: conducts 1,200 V through graphene cable.
   */
  public conductElectricalShock(voltage: number = 1200): void {
    if (this.state !== HarpoonState.TETHERED || !this.tetheredEntity) return;

    // +150% critical bonus damage (2.5x base damage)
    const baseDamage = 60;
    const shockDamage = Math.round(baseDamage * 2.5 * (voltage / 1200));

    if (typeof (this.tetheredEntity as any).takeDamage === 'function') {
      (this.tetheredEntity as any).takeDamage(shockDamage);
    }

    // Acoustic EMP burst (R = 90 px) centered on target
    const tx = this.tetheredEntity.position.x + this.tetheredEntity.size.width / 2;
    const ty = this.tetheredEntity.position.y + this.tetheredEntity.size.height / 2;

    this.activeEmpBursts.push({
      x: tx,
      y: ty,
      radius: 5,
      maxRadius: 90,
      alpha: 1.0,
    });

    try {
      soundManager.playShieldDeflect();
    } catch {
      // Safe fallback
    }
  }

  /**
   * Deterministic master update loop.
   */
  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    this.tremorPhase += deltaTime * 24;

    // Track player vessel kinematics
    const playerProw: Vector2D = {
      x: context.player.position.x + context.player.size.width / 2,
      y: context.player.position.y - 4,
    };

    if (deltaTime > 0) {
      this.playerVelocity = {
        x: (playerProw.x - this.prevPlayerPos.x) / deltaTime,
        y: (playerProw.y - this.prevPlayerPos.y) / deltaTime,
      };
    }
    this.prevPlayerPos = { x: playerProw.x, y: playerProw.y };

    // Update active Slingshot Projectiles
    this.updateSlingshotProjectiles(deltaTime, context.enemies);

    // Update active EMP shockwaves
    this.updateEmpShockwaves(deltaTime, context.enemies, context.bullets);

    // State machine updates
    switch (this.state) {
      case HarpoonState.FLYING:
        this.updateFlying(deltaTime, playerProw, context.enemies);
        break;
      case HarpoonState.TETHERED:
        this.updateTethered(deltaTime, playerProw, context);
        break;
      case HarpoonState.RETRACTING:
        this.updateRetracting(deltaTime, playerProw);
        break;
      case HarpoonState.READY:
        this.headPosition = { x: playerProw.x, y: playerProw.y };
        this.currentLength = 0;
        this.strainRatio = 0;
        break;
    }

    // Update 12-Node Verlet Physics Cable
    const tipPos = this.tetheredEntity
      ? {
          x: this.tetheredEntity.position.x + this.tetheredEntity.size.width / 2,
          y: this.tetheredEntity.position.y + this.tetheredEntity.size.height / 2,
        }
      : this.headPosition;

    this.updateVerletCable(deltaTime, playerProw, tipPos);
  }

  /**
   * Phase 1: Dart flying upward through the water column.
   */
  private updateFlying(deltaTime: number, playerProw: Vector2D, enemies: Entity[]): void {
    this.headPosition.y += this.headVelocity.y * deltaTime;
    this.headPosition.x += this.headVelocity.x * deltaTime;

    const dx = this.headPosition.x - playerProw.x;
    const dy = this.headPosition.y - playerProw.y;
    this.currentLength = Math.sqrt(dx * dx + dy * dy);

    // Out of bounds or exceeding maximum length without hit -> retract
    if (this.headPosition.y <= 30 || this.currentLength >= this.config.maxLength) {
      this.state = HarpoonState.RETRACTING;
      return;
    }

    // Check collision against hostile entities
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const ex = enemy.position.x;
      const ey = enemy.position.y;
      const ew = enemy.size.width;
      const eh = enemy.size.height;

      // Bounding box hit check
      if (
        this.headPosition.x >= ex &&
        this.headPosition.x <= ex + ew &&
        this.headPosition.y >= ey &&
        this.headPosition.y <= ey + eh
      ) {
        // Deal 35 initial kinetic penetration damage
        if (typeof (enemy as any).takeDamage === 'function') {
          (enemy as any).takeDamage(35);
        }

        // If target survived, lock grapple onto it
        if (!enemy.isDead && (enemy as any).hp > 0) {
          this.state = HarpoonState.TETHERED;
          this.tetheredEntity = enemy;
          this.headPosition = {
            x: enemy.position.x + enemy.size.width / 2,
            y: enemy.position.y + enemy.size.height / 2,
          };
          try {
            soundManager.playShieldDeflect();
          } catch {
            // Safe fallback
          }
        } else {
          // If killed instantly, continue or retract
          this.state = HarpoonState.RETRACTING;
        }
        break;
      }
    }
  }

  /**
   * Phase 2: Physically tethered via damped harmonic spring constraint.
   */
  private updateTethered(
    deltaTime: number,
    playerProw: Vector2D,
    context: FlagshipUpdateContext
  ): void {
    const enemy = this.tetheredEntity;
    if (!enemy || enemy.isDead || (enemy as any).hp <= 0) {
      this.tetheredEntity = null;
      this.state = HarpoonState.RETRACTING;
      this.isWinching = false;
      return;
    }

    // Sub-step if deltaTime > 0.05s to prevent Euler runaway
    if (deltaTime > 0.05) {
      const maxSubStep = 0.033;
      const steps = Math.ceil(deltaTime / maxSubStep);
      const subDt = deltaTime / steps;
      for (let s = 0; s < steps; s++) {
        this.updateTethered(subDt, playerProw, context);
      }
      return;
    }

    // 1. Hydraulic Winching
    if (this.isWinching) {
      this.effectiveRestLength = Math.max(
        65,
        this.effectiveRestLength - this.config.winchSpeed * deltaTime
      );
    }

    // 2. Compute Cable Displacement & Geometry
    const enemyCenter: Vector2D = {
      x: enemy.position.x + enemy.size.width / 2,
      y: enemy.position.y + enemy.size.height / 2,
    };

    const dx = enemyCenter.x - playerProw.x;
    const dy = enemyCenter.y - playerProw.y;
    this.currentLength = Math.sqrt(dx * dx + dy * dy);

    // Non-linear strain calculation
    const l0 = this.effectiveRestLength;
    const lMax = this.config.maxLength;
    this.strainRatio = Math.max(0, (this.currentLength - l0) / (lMax - l0));

    // Cable Snap if strain exceeds 1.0 (L > L_max)
    if (this.currentLength > lMax) {
      this.tetheredEntity = null;
      this.state = HarpoonState.RETRACTING;
      this.isWinching = false;
      context.triggerScreenShake(0.2, 5);
      return;
    }

    // 3. Damped Harmonic Spring Physics Formulation:
    // F_elastic = k_s * (L - L_0) * [1 + 3.2 * ((L - L_0)/(L_max - L_0))^2]
    // F_tension = -max(0, F_elastic + c_d * (v_rel . u_hat)) * u_hat
    const uHat: Vector2D = {
      x: this.currentLength > 0.001 ? dx / this.currentLength : 0,
      y: this.currentLength > 0.001 ? dy / this.currentLength : 1,
    };

    if (this.currentLength > l0) {
      const deltaL = this.currentLength - l0;
      const nonLinearTerm = 1 + 3.2 * (deltaL / (lMax - l0)) ** 2;
      const fElastic = this.config.springStiffness * deltaL * nonLinearTerm;

      // Approximate relative velocity along cable unit vector
      const vRelDotU =
        (0 - this.playerVelocity.x) * uHat.x + (0 - this.playerVelocity.y) * uHat.y;
      const fDamped = Math.max(0, fElastic + this.config.damping * vRelDotU);

      // Mass scaling: heavy enemies and bosses resist pull
      let mass = 1.0;
      if ((enemy as any).isBoss) mass = 6.0;
      else if ((enemy as any).isElite) mass = 2.0;

      // Apply physical acceleration toward player with clamped displacement
      const rawDisplacement = (fDamped / mass) * deltaTime * 0.25;
      const maxAllowedDisp = Math.min(60, Math.max(0, this.currentLength - l0));
      const clampedDisp = Math.min(rawDisplacement, maxAllowedDisp);

      enemy.position.x -= uHat.x * clampedDisp;
      enemy.position.y -= uHat.y * clampedDisp;

      // Clamp entity velocity if present
      if ((enemy as any).velocity) {
        const vx = (enemy as any).velocity.x || 0;
        const vy = (enemy as any).velocity.y || 0;
        const speed = Math.hypot(vx, vy);
        const maxSpeed = 400;
        if (speed > maxSpeed) {
          (enemy as any).velocity.x = (vx / speed) * maxSpeed;
          (enemy as any).velocity.y = (vy / speed) * maxSpeed;
        }
      }

      // Clamp entity positions within [0, 600] x [0, 800]
      const maxEx = Math.max(0, 600 - (enemy.size?.width ?? 0));
      const maxEy = Math.max(0, 800 - (enemy.size?.height ?? 0));
      enemy.position.x = Math.max(0, Math.min(maxEx, enemy.position.x));
      enemy.position.y = Math.max(0, Math.min(maxEy, enemy.position.y));
    }

    // 4. Centripetal Whip & Wrecking Ball Collisions
    // Tangential speed: v_t = |omega| * L >= 300 px/s
    const omega = Math.abs(this.playerVelocity.x) / Math.max(1, this.currentLength);
    const vt = omega * this.currentLength;

    if (vt >= 250) {
      for (const other of context.enemies) {
        if (other === enemy || other.isDead) continue;
        const ox = other.position.x + other.size.width / 2;
        const oy = other.position.y + other.size.height / 2;
        const hitDistSq = (enemyCenter.x - ox) ** 2 + (enemyCenter.y - oy) ** 2;
        const minHitR = (enemy.size.width + other.size.width) / 2;

        if (hitDistSq <= minHitR * minHitR) {
          // Slam collision damage: 60 - 140 dmg
          const slamDamage = Math.min(
            140,
            Math.max(60, Math.round(60 + 0.5 * (vt / 100) ** 2))
          );

          if (typeof (other as any).takeDamage === 'function') {
            (other as any).takeDamage(slamDamage);
          }
          if (typeof (enemy as any).takeDamage === 'function') {
            (enemy as any).takeDamage(Math.round(slamDamage * 0.4));
          }

          // Visual explosion spark
          context.createExplosion(ox, oy, '#06b6d4', 8, 1.2);
        }
      }
    }

    // 5. Living Meat-Shield Mechanic:
    // Tethered enemy intercepts descending enemy bullets protecting submarine
    for (const b of context.bullets) {
      if (b.isDead || b.faction === Faction.PLAYER) continue;
      const bx = b.position.x + b.size.width / 2;
      const by = b.position.y + b.size.height / 2;

      if (
        bx >= enemy.position.x &&
        bx <= enemy.position.x + enemy.size.width &&
        by >= enemy.position.y &&
        by <= enemy.position.y + enemy.size.height
      ) {
        b.isDead = true;
        if (typeof (enemy as any).takeDamage === 'function') {
          (enemy as any).takeDamage(b.damage);
        }
        context.createExplosion(bx, by, '#38bdf8', 4, 0.8);
      }
    }
  }

  /**
   * Phase 3: High-speed retraction back to submarine bow.
   */
  private updateRetracting(deltaTime: number, playerProw: Vector2D): void {
    const dx = playerProw.x - this.headPosition.x;
    const dy = playerProw.y - this.headPosition.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 15) {
      this.state = HarpoonState.READY;
      this.currentLength = 0;
      this.strainRatio = 0;
      this.isWinching = false;
      this.effectiveRestLength = this.config.restLength;
    } else {
      const step = this.config.retractSpeed * deltaTime;
      this.headPosition.x += (dx / dist) * Math.min(dist, step);
      this.headPosition.y += (dy / dist) * Math.min(dist, step);
      this.currentLength = dist;
    }
  }

  /**
   * 12-Node Verlet Physics Cable Solver with catenary sag.
   */
  private updateVerletCable(
    deltaTime: number,
    anchor: Vector2D,
    target: Vector2D
  ): void {
    if (this.cableNodes.length !== this.nodeCount) {
      this.initVerletNodes(anchor);
    }

    // Set pinned anchor endpoints
    this.cableNodes[0].x = anchor.x;
    this.cableNodes[0].y = anchor.y;
    this.cableNodes[this.nodeCount - 1].x = target.x;
    this.cableNodes[this.nodeCount - 1].y = target.y;

    // Apply inertia and water drag to intermediate nodes
    for (let i = 1; i < this.nodeCount - 1; i++) {
      const node = this.cableNodes[i];
      const vx = (node.x - node.prevX) * 0.92;
      const vy = (node.y - node.prevY) * 0.92 + 15 * deltaTime; // slight gravity sag

      node.prevX = node.x;
      node.prevY = node.y;
      node.x += vx;
      node.y += vy;
    }

    // Relaxation constraint iterations (5 passes)
    const segmentLength = this.currentLength / (this.nodeCount - 1);
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < this.nodeCount - 1; i++) {
        const nA = this.cableNodes[i];
        const nB = this.cableNodes[i + 1];
        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const curDist = Math.sqrt(dx * dx + dy * dy);
        if (curDist < 0.001) continue;

        const diff = (curDist - segmentLength) / curDist;
        const offsetX = dx * 0.5 * diff;
        const offsetY = dy * 0.5 * diff;

        if (i !== 0) {
          nA.x += offsetX;
          nA.y += offsetY;
        }
        if (i + 1 !== this.nodeCount - 1) {
          nB.x -= offsetX;
          nB.y -= offsetY;
        }
      }
    }
  }

  /**
   * Update active slingshot projectile physics and collision sweeps.
   */
  private updateSlingshotProjectiles(deltaTime: number, enemies: Entity[]): void {
    for (let i = this.slingshotProjectiles.length - 1; i >= 0; i--) {
      const proj = this.slingshotProjectiles[i];
      proj.remainingLife -= deltaTime;
      proj.entity.position.x += proj.velocity.x * deltaTime;
      proj.entity.position.y += proj.velocity.y * deltaTime;

      const px = proj.entity.position.x + proj.entity.size.width / 2;
      const py = proj.entity.position.y + proj.entity.size.height / 2;
      const pr = Math.max(proj.entity.size.width, proj.entity.size.height) / 2;

      // Pierce through backline enemies
      for (const enemy of enemies) {
        if (enemy.isDead || proj.hitEntities.has(enemy)) continue;
        const ex = enemy.position.x + enemy.size.width / 2;
        const ey = enemy.position.y + enemy.size.height / 2;
        const er = Math.max(enemy.size.width, enemy.size.height) / 2;
        const distSq = (px - ex) ** 2 + (py - ey) ** 2;

        if (distSq <= (pr + er) * (pr + er)) {
          proj.hitEntities.add(enemy);
          if (typeof (enemy as any).takeDamage === 'function') {
            (enemy as any).takeDamage(proj.damage);
          }
        }
      }

      if (proj.remainingLife <= 0 || proj.entity.position.y <= -60) {
        proj.entity.isDead = true;
        this.slingshotProjectiles.splice(i, 1);
      }
    }
  }

  /**
   * Update expanding EMP shockwaves from electrical conduction.
   */
  private updateEmpShockwaves(
    deltaTime: number,
    enemies: Entity[],
    bullets: Bullet[]
  ): void {
    for (let i = this.activeEmpBursts.length - 1; i >= 0; i--) {
      const emp = this.activeEmpBursts[i];
      emp.radius += 380 * deltaTime;
      emp.alpha = Math.max(0, 1.0 - emp.radius / emp.maxRadius);

      const rSq = emp.radius * emp.radius;

      // Vaporize hostile bullets in EMP wave
      for (const b of bullets) {
        if (b.isDead || b.faction === Faction.PLAYER) continue;
        const bx = b.position.x + b.size.width / 2;
        const by = b.position.y + b.size.height / 2;
        if ((bx - emp.x) ** 2 + (by - emp.y) ** 2 <= rSq) {
          b.isDead = true;
        }
      }

      if (emp.radius >= emp.maxRadius || emp.alpha <= 0) {
        this.activeEmpBursts.splice(i, 1);
      }
    }
  }

  /**
   * Direct draw satisfying IHydraulicHarpoon interface.
   */
  public draw(ctx: CanvasRenderingContext2D, playerPos: Vector2D): void {
    this.drawWorld(ctx);
  }

  /**
   * World render pass: draws dynamic cable, grapple clamps, and slingshot fx.
   */
  public drawWorld(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;
    ctx.save();

    // 1. Draw active EMP shockwaves
    for (const emp of this.activeEmpBursts) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${emp.alpha * 0.9})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(6, 182, 212, ${emp.alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw 12-Node Verlet Physics Cable
    if (this.state === HarpoonState.FLYING || this.state === HarpoonState.TETHERED || this.state === HarpoonState.RETRACTING) {
      // Dynamic color transitions based on strain
      let cableColor = '#06b6d4'; // Low strain: glowing cyan
      let glowColor = 'rgba(6, 182, 212, 0.4)';
      let lineWidth = 2.2;

      if (this.strainRatio > 0.8) {
        cableColor = '#ef4444'; // High strain: crimson
        glowColor = 'rgba(239, 68, 68, 0.6)';
        lineWidth = 3.2;
      } else if (this.strainRatio > 0.5) {
        cableColor = '#f59e0b'; // Medium strain: amber
        glowColor = 'rgba(245, 158, 11, 0.5)';
        lineWidth = 2.6;
      }

      ctx.strokeStyle = cableColor;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      const shudder = this.strainRatio > 0.8 ? Math.sin(this.tremorPhase) * 2 : 0;
      ctx.moveTo(this.cableNodes[0].x, this.cableNodes[0].y);

      for (let i = 1; i < this.cableNodes.length - 1; i++) {
        const xc = (this.cableNodes[i].x + this.cableNodes[i + 1].x) / 2 + shudder;
        const yc = (this.cableNodes[i].y + this.cableNodes[i + 1].y) / 2;
        ctx.quadraticCurveTo(this.cableNodes[i].x + shudder, this.cableNodes[i].y, xc, yc);
      }
      const lastNode = this.cableNodes[this.cableNodes.length - 1];
      ctx.lineTo(lastNode.x, lastNode.y);
      ctx.stroke();

      // Draw Barbed Micro-Grapple Head
      const tipX = lastNode.x;
      const tipY = lastNode.y;

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = cableColor;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(tipX, tipY - 8);
      ctx.lineTo(tipX + 6, tipY + 6);
      ctx.lineTo(tipX + 2, tipY + 4);
      ctx.lineTo(tipX, tipY + 8);
      ctx.lineTo(tipX - 2, tipY + 4);
      ctx.lineTo(tipX - 6, tipY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Foreground HUD pass: Cable Tension & Winch Controls.
   */
  public drawForeground(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;
    if (this.state === HarpoonState.READY) return;

    ctx.save();
    const hudX = 282;
    const hudY = 746;
    const hudW = 120;
    const hudH = 36;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeRect(hudX, hudY, hudW, hudH);

    ctx.font = '9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`HARPOON [${this.state}]`, hudX + 6, hudY + 12);

    // Cable Tension Meter (0 - 100%)
    const barX = hudX + 6;
    const barY = hudY + 18;
    const barW = 108;
    const barH = 10;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barW, barH);

    let strainColor = '#06b6d4';
    if (this.strainRatio > 0.8) strainColor = '#ef4444';
    else if (this.strainRatio > 0.5) strainColor = '#f59e0b';

    ctx.fillStyle = strainColor;
    ctx.fillRect(barX, barY, Math.min(barW, barW * this.strainRatio), barH);

    ctx.restore();
  }

  /**
   * Input handling: H (fire / slingshot) and Shift (winch reel).
   */
  public handleInput(
    key: string,
    isDown: boolean,
    context: FlagshipUpdateContext
  ): boolean {
    if (key === 'h' || key === 'H') {
      if (isDown) {
        if (this.state === HarpoonState.READY) {
          const origin: Vector2D = {
            x: context.player.position.x + context.player.size.width / 2,
            y: context.player.position.y - 8,
          };
          return this.fire(origin);
        } else if (this.state === HarpoonState.TETHERED) {
          return this.releaseSlingshot() !== null;
        }
      }
      return true;
    }

    if (key === 'Shift' || key === 'ShiftLeft' || key === 'ShiftRight') {
      if (isDown) {
        this.startWinch();
      } else {
        this.stopWinch();
      }
      return true;
    }

    return false;
  }

  public reset(): void {
    this.state = HarpoonState.READY;
    this.tetheredEntity = null;
    this.currentLength = 0;
    this.strainRatio = 0;
    this.isWinching = false;
    this.effectiveRestLength = this.config.restLength;
    this.slingshotProjectiles = [];
    this.activeEmpBursts = [];
  }
}

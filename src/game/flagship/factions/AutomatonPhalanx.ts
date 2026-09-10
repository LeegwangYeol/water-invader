// ============================================================================
// WATER INVADER: AUTOMATON SHIELD PHALANX
// Feature 9: Ancient Bronze Relic Fleet & Hexagonal Phalanx Shield Grids
// ============================================================================

import {
  IAutomatonPhalanxManager,
  IFlagshipSubsystem,
  FlagshipUpdateContext,
  AutomatonDroneNode,
} from '../types';
import { AutomatonShieldGrid } from './AutomatonShieldGrid';
import { Bullet } from '../../Bullet';
import { Player } from '../../Player';
import { Barricade } from '../../Barricade';
import { Vector2D } from '../../types';

export interface AutomatonUnit {
  id: number;
  type: 'AEGIS' | 'EMP_PROWLER' | 'RAIL_SENTINEL';
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
  hitFlashTimer: number;
  animTimer: number;

  // Aegis Drone specifics
  shieldHp?: number;
  maxShieldHp?: number;
  isShieldActive?: boolean;
  isStunned?: boolean;
  stunTimer?: number;

  // EMP Prowler specifics
  empCooldown?: number;
  empChargeTimer?: number;
  isEmpCharging?: boolean;
  empDischargeRadius?: number;

  // Rail Sentinel specifics
  isLockedDown?: boolean;
  lockdownTimer?: number;
  lockdownDuration?: number;
  coolingVentTimer?: number;
  isCoolingVentsOpen?: boolean;
}

export interface ShockPuddle {
  x: number;
  y: number;
  radius: number;
  duration: number;
  remainingLife: number;
  dps: number;
}

export class AutomatonPhalanx implements IAutomatonPhalanxManager, IFlagshipSubsystem {
  public readonly id = 'automaton-phalanx';
  public grid: AutomatonShieldGrid;

  public units: AutomatonUnit[] = [];
  public shockPuddles: ShockPuddle[] = [];

  // Heavy copper rail slugs fired by Sentinels
  public railSlugs: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    isDead: boolean;
  }> = [];

  // EMP Nova shock rings
  public empShockRings: Array<{
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    alpha: number;
  }> = [];

  constructor() {
    this.grid = new AutomatonShieldGrid();
  }

  public init(): void {
    this.reset();
  }

  public registerDrone(drone: AutomatonDroneNode): void {
    this.grid.registerDrone(drone);
  }

  public unregisterDrone(droneId: number): void {
    this.grid.unregisterDrone(droneId);
  }

  public distributeDamage(droneId: number, incomingDamage: number): number {
    return this.grid.distributeDamage(droneId, incomingDamage);
  }

  public triggerInductiveBacklash(brokenDroneId: number): void {
    this.grid.triggerInductiveBacklash(brokenDroneId);
  }

  // ==========================================================================
  // SPAWN FACTORY METHODS
  // ==========================================================================

  public spawnAegisDrone(x: number, y: number, wave: number = 1): AutomatonUnit {
    const id = Math.floor(Math.random() * 1000000);
    const hullHp = 180 + wave * 25;
    const shieldHp = 220 + wave * 35;

    const unit: AutomatonUnit = {
      id,
      type: 'AEGIS',
      position: { x, y },
      velocity: { x: (Math.random() - 0.5) * 30, y: 15 },
      width: 52,
      height: 38,
      hp: hullHp,
      maxHp: hullHp,
      shieldHp,
      maxShieldHp: shieldHp,
      isShieldActive: true,
      isDead: false,
      hitFlashTimer: 0,
      animTimer: 0,
      isStunned: false,
      stunTimer: 0,
    };

    this.units.push(unit);

    // Register into resonant shield grid
    this.grid.registerDrone({
      id,
      x,
      y,
      hp: hullHp,
      maxHp: hullHp,
      shieldHp,
      maxShieldHp: shieldHp,
      isFrontalShieldActive: true,
      shieldNormal: { x: 0, y: 1 }, // Forward facing
      linkedDroneIds: [],
      isBacklashStunned: false,
      stunTimer: 0,
    });

    return unit;
  }

  public spawnEmpProwler(x: number, y: number): AutomatonUnit {
    const unit: AutomatonUnit = {
      id: Math.floor(Math.random() * 1000000),
      type: 'EMP_PROWLER',
      position: { x, y },
      velocity: { x: 110, y: 12 }, // Agile sinusoidal strafer
      width: 44,
      height: 30,
      hp: 140,
      maxHp: 140,
      isDead: false,
      hitFlashTimer: 0,
      animTimer: 0,
      empCooldown: 7.5,
      empChargeTimer: 0,
      isEmpCharging: false,
      empDischargeRadius: 240,
    };
    this.units.push(unit);
    return unit;
  }

  public spawnRailSentinel(x: number, y: number): AutomatonUnit {
    const unit: AutomatonUnit = {
      id: Math.floor(Math.random() * 1000000),
      type: 'RAIL_SENTINEL',
      position: { x, y },
      velocity: { x: (Math.random() - 0.5) * 20, y: 10 },
      width: 64,
      height: 46,
      hp: 260,
      maxHp: 260,
      isDead: false,
      hitFlashTimer: 0,
      animTimer: 0,
      isLockedDown: false,
      lockdownTimer: 4.0, // First lockdown in 4.0s
      lockdownDuration: 1.8,
      coolingVentTimer: 0,
      isCoolingVentsOpen: false,
    };
    this.units.push(unit);
    return unit;
  }

  // ==========================================================================
  // UPDATE LOOP
  // ==========================================================================

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    const { player, bullets, barricades, createExplosion, triggerScreenShake } = context;

    // 1. Update Resonant Shield Grid
    this.grid.update(deltaTime);

    // 2. Synchronize Shield Grid Drone state back to Aegis units
    for (const unit of this.units) {
      if (unit.type === 'AEGIS') {
        const droneNode = this.grid.drones.get(unit.id);
        if (droneNode) {
          droneNode.x = unit.position.x;
          droneNode.y = unit.position.y;
          droneNode.maxHp = unit.maxHp;
          if (droneNode.pendingHullDamage && droneNode.pendingHullDamage > 0) {
            unit.hp = Math.max(0, unit.hp - droneNode.pendingHullDamage);
            droneNode.pendingHullDamage = 0;
            droneNode.hp = unit.hp;
            if (unit.hp <= 0) unit.isDead = true;
          } else if (droneNode.hp !== undefined && droneNode.hp < unit.hp) {
            unit.hp = droneNode.hp;
            if (unit.hp <= 0) unit.isDead = true;
          } else {
            droneNode.hp = unit.hp;
          }
          unit.shieldHp = droneNode.shieldHp;
          unit.isShieldActive = droneNode.isFrontalShieldActive;
          unit.isStunned = droneNode.isBacklashStunned;
          unit.stunTimer = droneNode.stunTimer;
        }
      }
    }

    // 3. Update Rail Slugs (punching through player barricades)
    for (let i = this.railSlugs.length - 1; i >= 0; i--) {
      const slug = this.railSlugs[i];
      slug.x += slug.vx * deltaTime;
      slug.y += slug.vy * deltaTime;

      // Barricade penetration
      for (const b of barricades) {
        if (!b.isDead && slug.x >= b.position.x && slug.x <= b.position.x + b.size.width &&
            slug.y >= b.position.y && slug.y <= b.position.y + b.size.height) {
          b.takeDamage(slug.damage);
          createExplosion(slug.x, slug.y, '#f59e0b', 12, 1.2);
          // Punch through! (doesn't destroy the rail slug)
        }
      }

      // Check collision with player
      const dist = Math.hypot(player.position.x + 20 - slug.x, player.position.y + 15 - slug.y);
      if (dist < 25) {
        if (player.invincibilityTimer <= 0) {
          player.hp = Math.max(0, player.hp - 2);
          player.hitFlashTimer = 0.25;
          player.invincibilityTimer = 0.8;
          triggerScreenShake(0.3, 6);
        }
        createExplosion(slug.x, slug.y, '#f59e0b', 20, 1.5);
        slug.isDead = true;
      }

      // Hits bottom of canvas -> creates induction shock puddle
      if (slug.y >= 780 || slug.isDead) {
        this.shockPuddles.push({
          x: slug.x,
          y: 780,
          radius: 40, // 80px diameter
          duration: 2.5,
          remainingLife: 2.5,
          dps: 12,
        });
        createExplosion(slug.x, 780, '#00f0ff', 25, 1.8);
        this.railSlugs.splice(i, 1);
      }
    }

    // 4. Update Induction Shock Puddles
    for (let i = this.shockPuddles.length - 1; i >= 0; i--) {
      const puddle = this.shockPuddles[i];
      puddle.remainingLife -= deltaTime;

      // Deal 12 DPS if player stands in puddle
      const distToPlayer = Math.hypot(player.position.x + 20 - puddle.x, player.position.y + 15 - puddle.y);
      if (distToPlayer <= puddle.radius) {
        if (Math.random() < deltaTime * 1.5 && player.invincibilityTimer <= 0) {
          player.hp = Math.max(0, player.hp - 1);
          player.hitFlashTimer = 0.15;
          createExplosion(player.position.x + 20, player.position.y + 15, '#00f0ff', 6, 0.7);
        }
      }

      if (puddle.remainingLife <= 0) {
        this.shockPuddles.splice(i, 1);
      }
    }

    // 5. Update EMP Shock Rings
    for (let i = this.empShockRings.length - 1; i >= 0; i--) {
      const ring = this.empShockRings[i];
      ring.radius += 360 * deltaTime;
      ring.alpha = Math.max(0, 1.0 - ring.radius / ring.maxRadius);

      if (ring.radius >= ring.maxRadius) {
        this.empShockRings.splice(i, 1);
      }
    }

    // 6. Update Automaton Units
    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i];
      unit.animTimer += deltaTime;
      if (unit.hitFlashTimer > 0) unit.hitFlashTimer -= deltaTime;

      // Check Backlash Stun
      if (unit.isStunned && unit.stunTimer && unit.stunTimer > 0) {
        unit.stunTimer -= deltaTime;
        if (unit.stunTimer <= 0) {
          unit.isStunned = false;
        }
        continue; // Stunned, cannot act
      }

      switch (unit.type) {
        case 'AEGIS': {
          // Slow coordinated phalanx drift
          unit.position.x += unit.velocity.x * deltaTime;
          unit.position.y += unit.velocity.y * deltaTime;
          if (unit.position.x < 60 || unit.position.x > 540) unit.velocity.x *= -1;
          break;
        }

        case 'EMP_PROWLER': {
          // High-speed sinusoidal strafe
          unit.position.x += unit.velocity.x * Math.sin(unit.animTimer * 2) * deltaTime;
          unit.position.y += unit.velocity.y * deltaTime;
          if (unit.position.x < 50) unit.position.x = 50;
          if (unit.position.x > 550) unit.position.x = 550;

          // Battery link: supercharge adjacent Aegis shield regen (+15 SHP/s)
          this.grid.superchargeNearbyDrones(unit.position.x, unit.position.y, 240, 15 * deltaTime);

          // Ventral EMP Nova cycle
          unit.empCooldown = (unit.empCooldown || 7.5) - deltaTime;
          if (unit.empCooldown <= 1.2 && !unit.isEmpCharging) {
            unit.isEmpCharging = true;
          }

          if (unit.empCooldown <= 0) {
            unit.empCooldown = 7.5;
            unit.isEmpCharging = false;
            // Discharge 240px EMP Ring
            this.empShockRings.push({
              x: unit.position.x,
              y: unit.position.y,
              radius: 10,
              maxRadius: 240,
              alpha: 1.0,
            });
            triggerScreenShake(0.35, 7);
            createExplosion(unit.position.x, unit.position.y, '#00f0ff', 30, 2.2);

            // Check if player is inside 240px EMP radius
            const distToPlayer = Math.hypot(
              player.position.x + 20 - unit.position.x,
              player.position.y + 15 - unit.position.y
            );
            if (distToPlayer <= 240) {
              // Overload weapon heat sinks: fire rate -50% for 3s
              player.suppressionLevel = Math.min(100, player.suppressionLevel + 40);
              createExplosion(player.position.x + 20, player.position.y, '#00f0ff', 15, 1.5);
            }
          }
          break;
        }

        case 'RAIL_SENTINEL': {
          // Position progression
          if (!unit.isLockedDown) {
            unit.position.x += unit.velocity.x * deltaTime;
            unit.position.y += unit.velocity.y * deltaTime;
            if (unit.position.x < 70 || unit.position.x > 530) unit.velocity.x *= -1;
          }

          // Lockdown sequence
          unit.lockdownTimer = (unit.lockdownTimer || 4.0) - deltaTime;
          if (unit.lockdownTimer <= 1.8 && !unit.isLockedDown) {
            unit.isLockedDown = true;
          }

          if (unit.lockdownTimer <= 0) {
            unit.lockdownTimer = 7.0; // Reset next cycle
            unit.isLockedDown = false;

            // Fire superheated copper rail slug
            this.railSlugs.push({
              x: unit.position.x,
              y: unit.position.y + 25,
              vx: 0,
              vy: 450, // v = 450 px/s
              damage: 2,
              isDead: false,
            });
            createExplosion(unit.position.x, unit.position.y + 25, '#f59e0b', 20, 1.8);
            triggerScreenShake(0.25, 5);

            // Open radiator cooling vents for 2.4s (300% Critical Damage!)
            unit.isCoolingVentsOpen = true;
            unit.coolingVentTimer = 2.4;
          }

          if (unit.isCoolingVentsOpen && unit.coolingVentTimer) {
            unit.coolingVentTimer -= deltaTime;
            if (unit.coolingVentTimer <= 0) {
              unit.isCoolingVentsOpen = false;
            }
          }
          break;
        }
      }

      // Check Bullet Collisions against Automaton Units
      this.checkBulletCollisions(unit, bullets, context);

      // Remove dead or off-screen units
      if (unit.isDead || unit.position.y > 850) {
        if (unit.type === 'AEGIS') {
          this.grid.unregisterDrone(unit.id, unit.isDead);
        }
        this.units.splice(i, 1);
      }
    }
  }

  // ==========================================================================
  // BULLET COLLISION RESOLUTION
  // ==========================================================================

  private checkBulletCollisions(
    unit: AutomatonUnit,
    bullets: Bullet[],
    context: FlagshipUpdateContext
  ): void {
    const { createExplosion, triggerScreenShake } = context;

    for (const b of bullets) {
      if (b.isDead) continue;

      const halfW = unit.width / 2;
      const halfH = unit.height / 2;

      if (
        b.position.x >= unit.position.x - halfW &&
        b.position.x <= unit.position.x + halfW &&
        b.position.y >= unit.position.y - halfH &&
        b.position.y <= unit.position.y + halfH
      ) {
        let rawDamage = 12;
        const isPiercing = Boolean((b as any).piercing && (b as any).piercing >= 2);
        if (isPiercing) rawDamage = 22;

        if (unit.type === 'AEGIS') {
          // Resolve hit through Resonant Shield Grid
          const hitResult = this.grid.resolveHit(
            unit.id,
            b.position,
            (b as any).velocity || { x: 0, y: -400 },
            rawDamage,
            isPiercing
          );

          if (hitResult.isDeflected) {
            // Deflected off frontal shield!
            createExplosion(b.position.x, b.position.y, '#00f0ff', 10, 1.1);
            b.isDead = true;

            if (hitResult.triggeredBacklash) {
              // Inductive Backlash triggered!
              triggerScreenShake(0.4, 8);
              createExplosion(unit.position.x, unit.position.y, '#f59e0b', 30, 2.5);
            }
            continue;
          }

          // Hull hit (flanking or pierced)
          unit.hp -= hitResult.damageToHull;
          unit.hitFlashTimer = 0.08;
          b.isDead = !isPiercing;
          createExplosion(b.position.x, b.position.y, '#78350f', 8, 0.9);
        } else if (unit.type === 'RAIL_SENTINEL') {
          // Cooling Vent Vulnerability: 300% Critical Damage when vents are open!
          if (unit.isCoolingVentsOpen) {
            rawDamage *= 3.0;
            createExplosion(unit.position.x, unit.position.y, '#ef4444', 20, 1.8);
            triggerScreenShake(0.2, 5);
          }
          unit.hp -= rawDamage;
          unit.hitFlashTimer = 0.08;
          b.isDead = !isPiercing;
          createExplosion(b.position.x, b.position.y, '#f59e0b', 10, 1.0);
        } else {
          // EMP Prowler hit
          unit.hp -= rawDamage;
          unit.hitFlashTimer = 0.08;
          b.isDead = !isPiercing;
          createExplosion(b.position.x, b.position.y, '#0d9488', 8, 0.9);
        }

        // Unit death
        if (unit.hp <= 0) {
          unit.isDead = true;
          createExplosion(unit.position.x, unit.position.y, '#f59e0b', 25, 2.0);
          triggerScreenShake(0.25, 6);
        }
      }
    }
  }

  // ==========================================================================
  // RENDERING: 100% PROCEDURAL BRONZE PATINA & VERDIGRIS GRAPHICS
  // ==========================================================================

  public drawWorld(ctx: CanvasRenderingContext2D, time: number): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    // 1. Draw Resonant Shield Grid and conduits
    this.grid.drawWorld(ctx, time);

    // 2. Draw Induction Shock Puddles
    for (const puddle of this.shockPuddles) {
      const alpha = Math.max(0, puddle.remainingLife / puddle.duration) * 0.55;
      ctx.save();
      ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 1.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(puddle.x, puddle.y, puddle.radius, puddle.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Rail Slugs
    for (const slug of this.railSlugs) {
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.rect(slug.x - 3, slug.y - 12, 6, 24);
      ctx.fill();
      ctx.restore();
    }

    // 4. Draw EMP Shock Rings
    for (const ring of this.empShockRings) {
      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${ring.alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Living Automaton Ships
    for (const unit of this.units) {
      this.drawAutomatonUnit(ctx, unit, time);
    }
  }

  private drawAutomatonUnit(ctx: CanvasRenderingContext2D, unit: AutomatonUnit, time: number): void {
    ctx.save();
    ctx.translate(unit.position.x, unit.position.y);

    // Hit flash
    const isFlashing = unit.hitFlashTimer > 0;

    switch (unit.type) {
      case 'AEGIS': {
        // Faceted dark bronze chassis with verdigris patina and cyan runic optical lens
        ctx.fillStyle = isFlashing ? '#ffffff' : '#78350f';
        ctx.strokeStyle = '#0d9488';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(26, -6);
        ctx.lineTo(16, -18);
        ctx.lineTo(-16, -18);
        ctx.lineTo(-26, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cyan runic lens
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = unit.isStunned ? 0 : 8;
        ctx.beginPath();
        ctx.arc(0, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }

      case 'EMP_PROWLER': {
        // Agile sinusoidal strafer with ventral EMP coil
        ctx.fillStyle = isFlashing ? '#ffffff' : '#451a03';
        ctx.strokeStyle = '#0d9488';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(22, 0);
        ctx.lineTo(12, -14);
        ctx.lineTo(-12, -14);
        ctx.lineTo(-22, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ventral EMP coil (glows when charging)
        ctx.fillStyle = unit.isEmpCharging ? '#00f0ff' : '#0d9488';
        if (unit.isEmpCharging) {
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
        }
        ctx.beginPath();
        ctx.arc(0, 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }

      case 'RAIL_SENTINEL': {
        // Heavy quadrupedal platform with hydraulic lockdown outriggers
        ctx.fillStyle = isFlashing ? '#ffffff' : '#78350f';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;

        // Main chassis
        ctx.fillRect(-28, -18, 56, 36);
        ctx.strokeRect(-28, -18, 56, 36);

        // Outriggers
        ctx.fillStyle = '#451a03';
        if (unit.isLockedDown) {
          // Extended outriggers
          ctx.fillRect(-36, -6, 8, 26);
          ctx.fillRect(28, -6, 8, 26);
        } else {
          ctx.fillRect(-32, -12, 6, 18);
          ctx.fillRect(26, -12, 6, 18);
        }

        // Rail-Mortar Cannon Barrel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-4, 8, 8, 20);

        // Radiator Cooling Vents (glowing white-hot if open)
        if (unit.isCoolingVentsOpen) {
          ctx.fillStyle = '#ffedd5';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 15;
          ctx.fillRect(-12, -10, 24, 12);
          ctx.shadowBlur = 0;
        }
        break;
      }
    }

    ctx.restore();
  }

  public reset(): void {
    this.grid.reset();
    this.units = [];
    this.shockPuddles = [];
    this.railSlugs = [];
    this.empShockRings = [];
  }
}

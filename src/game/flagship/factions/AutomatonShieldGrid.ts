// ============================================================================
// WATER INVADER: AUTOMATON SHIELD GRID
// Feature 9: Resonant Hexagonal Shield Network & Inductive Backlash
// ============================================================================

import {
  AutomatonDroneNode,
  PhalanxLink,
  ShieldPhalanxGrid,
} from '../types';
import { Vector2D } from '../../types';

export interface ShieldHitResult {
  isDeflected: boolean;
  bypassesShield: boolean;
  damageToHull: number;
  damageToShield: number;
  triggeredBacklash: boolean;
  affectedDroneIds: number[];
}

export class AutomatonShieldGrid implements ShieldPhalanxGrid {
  public drones: Map<number, AutomatonDroneNode> = new Map();
  public links: PhalanxLink[] = [];
  public harmonicDampeningFactor: number = 0.40; // 40% damage dampening
  public conduitCouplingDistance: number = 160;   // 160 px coupling limit

  private static readonly COUPLING_DIST_SQ = 160 * 160; // 25,600 px^2 (avoid Math.sqrt)
  private static readonly ALIGNMENT_COS_25 = 0.9063;    // cos(25 degrees)
  private static readonly SHIELD_ARC_COS = 0.50;        // 60-degree total arc (30 deg half-angle: cos(60) = 0.5)

  // Visual shockwave & arc spark particle storage
  public arcParticles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
  }> = [];

  constructor() {
    this.reset();
  }

  public registerDrone(drone: AutomatonDroneNode): void {
    this.drones.set(drone.id, drone);
    this.rebuildTopology();
  }

  public unregisterDrone(droneId: number, isDestroyed: boolean = true): void {
    const drone = this.drones.get(droneId);
    if (drone && isDestroyed) {
      // Trigger resonant disruption / stun to neighbor linked drones on Aegis drone death
      const neighborIds = [...drone.linkedDroneIds];
      for (const nId of neighborIds) {
        const neighbor = this.drones.get(nId);
        if (neighbor) {
          neighbor.isBacklashStunned = true;
          neighbor.stunTimer = Math.max(neighbor.stunTimer, 1.8);
          neighbor.isFrontalShieldActive = false;
          neighbor.shieldHp = 0;
          this.spawnSparks(neighbor.x, neighbor.y, '#f59e0b', 15);
        }
      }
    }
    this.drones.delete(droneId);
    this.rebuildTopology();
  }

  /**
   * Rebuilds network links based on Euclidean distance (d <= 160px) and normal alignment.
   */
  public rebuildTopology(): void {
    const droneList = Array.from(this.drones.values());
    this.links = [];

    // Clear previous link lists
    for (const drone of droneList) {
      drone.linkedDroneIds = [];
    }

    // Check all pairs
    for (let i = 0; i < droneList.length; i++) {
      const a = droneList[i];
      if (a.isBacklashStunned || !a.isFrontalShieldActive) continue;

      for (let j = i + 1; j < droneList.length; j++) {
        const b = droneList[j];
        if (b.isBacklashStunned || !b.isFrontalShieldActive) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;

        if (distSq <= AutomatonShieldGrid.COUPLING_DIST_SQ) {
          // Check normal alignment: dot product >= cos(25°)
          const dotNormals = a.shieldNormal.x * b.shieldNormal.x + a.shieldNormal.y * b.shieldNormal.y;
          if (dotNormals >= AutomatonShieldGrid.ALIGNMENT_COS_25) {
            a.linkedDroneIds.push(b.id);
            b.linkedDroneIds.push(a.id);

            this.links.push({
              droneA: a.id,
              droneB: b.id,
              conduitAlpha: 0.85,
            });
          }
        }
      }
    }
  }

  /**
   * Finds all drones in the connected component of a given drone ID.
   */
  public getConnectedCluster(startDroneId: number): AutomatonDroneNode[] {
    const cluster: AutomatonDroneNode[] = [];
    const visited = new Set<number>();
    const queue = [startDroneId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const drone = this.drones.get(currentId);
      if (drone) {
        cluster.push(drone);
        for (const neighborId of drone.linkedDroneIds) {
          if (!visited.has(neighborId)) {
            queue.push(neighborId);
          }
        }
      }
    }

    return cluster;
  }

  /**
   * Distributes damage across connected shield phalanx with 40% dampening.
   */
  public distributeDamage(droneId: number, incomingDamage: number): number {
    const drone = this.drones.get(droneId);
    if (!drone) return incomingDamage;

    const cluster = this.getConnectedCluster(droneId);
    const linkedCount = cluster.length;

    if (linkedCount <= 1) {
      // Isolated drone takes full raw shield damage
      return incomingDamage;
    }

    // Invariant: 40% dampened, distributed equally across all nodes in cluster
    const dampenedTotal = incomingDamage * (1.0 - this.harmonicDampeningFactor);
    return dampenedTotal / linkedCount;
  }

  /**
   * Resolves bullet impact on a drone, computing directional deflection and shield absorption.
   */
  public resolveHit(
    droneId: number,
    bulletPos: Vector2D,
    bulletVel: Vector2D,
    rawDamage: number,
    isPiercing: boolean
  ): ShieldHitResult {
    const drone = this.drones.get(droneId);
    if (!drone) {
      return {
        isDeflected: false,
        bypassesShield: true,
        damageToHull: rawDamage,
        damageToShield: 0,
        triggeredBacklash: false,
        affectedDroneIds: [],
      };
    }

    // Piercing weapons bypass the hexagonal shield entirely
    if (isPiercing) {
      return {
        isDeflected: false,
        bypassesShield: true,
        damageToHull: rawDamage,
        damageToShield: 0,
        triggeredBacklash: false,
        affectedDroneIds: [droneId],
      };
    }

    // If shield is inactive or stunned, hits hull directly
    if (!drone.isFrontalShieldActive || drone.isBacklashStunned || drone.shieldHp <= 0) {
      return {
        isDeflected: false,
        bypassesShield: true,
        damageToHull: rawDamage,
        damageToShield: 0,
        triggeredBacklash: false,
        affectedDroneIds: [droneId],
      };
    }

    // Calculate impact angle relative to shield normal
    // Shield normal points downward/forward (e.g. {0, 1})
    // Bullet moving upward has negative vy
    const bulletSpeed = Math.hypot(bulletVel.x, bulletVel.y) || 1;
    const bulletDirX = bulletVel.x / bulletSpeed;
    const bulletDirY = bulletVel.y / bulletSpeed;

    // Dot product between -bulletDir and shieldNormal
    const impactCos = -(bulletDirX * drone.shieldNormal.x + bulletDirY * drone.shieldNormal.y);

    // Frontal arc: impactCos >= 0.5 (within 60 degree arc)
    const isFrontal = impactCos >= AutomatonShieldGrid.SHIELD_ARC_COS;

    if (isFrontal) {
      // 100% frontal deflection: hull takes 0 damage, damage is routed into shield grid
      const cluster = this.getConnectedCluster(droneId);
      const perDroneDamage = this.distributeDamage(droneId, rawDamage);

      let triggeredBacklash = false;
      const brokenIds: number[] = [];

      for (const d of cluster) {
        d.shieldHp -= perDroneDamage;
        this.spawnSparks(d.x, d.y - 15, '#00f0ff', 6);

        if (d.shieldHp <= 0) {
          d.shieldHp = 0;
          brokenIds.push(d.id);
        }
      }

      if (brokenIds.length > 0) {
        triggeredBacklash = true;
        this.triggerInductiveBacklash(brokenIds[0]);
      }

      return {
        isDeflected: true,
        bypassesShield: false,
        damageToHull: 0,
        damageToShield: perDroneDamage,
        triggeredBacklash,
        affectedDroneIds: cluster.map((d) => d.id),
      };
    }

    // Flank or rear hit: bypasses shield barrier
    return {
      isDeflected: false,
      bypassesShield: true,
      damageToHull: rawDamage,
      damageToShield: 0,
      triggeredBacklash: false,
      affectedDroneIds: [droneId],
    };
  }

  /**
   * Achilles' Heel: Inductive Resonant Backlash.
   * When any linked shield collapses, an electromagnetic feedback surge ripples
   * through all connected drones in the component:
   * - Shields dissolve for 3.5s
   * - 80 true hull damage (or 35% Max HP)
   * - 1.8s EMP stun/stagger
   */
  public triggerInductiveBacklash(brokenDroneId: number): void {
    const cluster = this.getConnectedCluster(brokenDroneId);

    for (const drone of cluster) {
      drone.isFrontalShieldActive = false;
      drone.isBacklashStunned = true;
      drone.stunTimer = 1.8;
      // True hull damage (80 true hull damage or 35% of max HP)
      const dmg = Math.max(80, Math.round((drone.maxHp ?? 200) * 0.35));
      if (drone.hp !== undefined) {
        drone.hp = Math.max(0, drone.hp - dmg);
      }
      drone.pendingHullDamage = (drone.pendingHullDamage ?? 0) + dmg;
      
      // Spawn massive electrical explosion particles
      this.spawnSparks(drone.x, drone.y, '#f59e0b', 20);
      this.spawnSparks(drone.x, drone.y, '#00f0ff', 15);
    }

    // Sever all links in this cluster
    this.rebuildTopology();
  }

  /**
   * Supercharge shield regeneration for drones within range of an EMP Prowler.
   */
  public superchargeNearbyDrones(prowlerX: number, prowlerY: number, radius: number, regenBonus: number): void {
    const rSq = radius * radius;
    for (const drone of this.drones.values()) {
      if (drone.isBacklashStunned) continue;
      const dx = drone.x - prowlerX;
      const dy = drone.y - prowlerY;
      if (dx * dx + dy * dy <= rSq) {
        drone.shieldHp = Math.min(drone.maxShieldHp, drone.shieldHp + regenBonus);
      }
    }
  }

  public update(deltaTime: number): void {
    // 1. Update drone stun and shield reboot timers
    for (const drone of this.drones.values()) {
      if (drone.isBacklashStunned) {
        drone.stunTimer -= deltaTime;
        if (drone.stunTimer <= 0) {
          drone.isBacklashStunned = false;
          // Reboot shield with 30% initial capacity
          drone.isFrontalShieldActive = true;
          drone.shieldHp = drone.maxShieldHp * 0.30;
          this.rebuildTopology();
        }
      } else if (drone.isFrontalShieldActive && drone.shieldHp < drone.maxShieldHp) {
        // Natural shield regen: 10 SHP/s
        drone.shieldHp = Math.min(drone.maxShieldHp, drone.shieldHp + 10 * deltaTime);
      }
    }

    // 2. Update Link visual pulsation
    for (const link of this.links) {
      link.conduitAlpha = 0.5 + 0.35 * Math.sin(performance.now() * 0.006 + link.droneA);
    }

    // 3. Update Arc Spark particles
    for (let i = this.arcParticles.length - 1; i >= 0; i--) {
      const p = this.arcParticles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.arcParticles.splice(i, 1);
      }
    }

    // 4. Periodically verify link distances
    this.rebuildTopology();
  }

  private spawnSparks(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      this.arcParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.35,
        maxLife: 0.6,
        color,
      });
    }
  }

  // ==========================================================================
  // RENDERING: INTERLOCKING HEXAGONAL BARRIER GRID & RUNIC CONDUITS
  // ==========================================================================

  public drawWorld(ctx: CanvasRenderingContext2D, time: number): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    ctx.save();

    // 1. Draw Resonant Runic Conduits between linked drones
    for (const link of this.links) {
      const a = this.drones.get(link.droneA);
      const b = this.drones.get(link.droneB);
      if (!a || !b) continue;

      ctx.strokeStyle = `rgba(0, 240, 255, ${link.conduitAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      // Slight sinusoidal harmonic wave in conduit
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const wave = Math.sin(time * 8 + link.droneA) * 6;
      ctx.quadraticCurveTo(midX + wave, midY + wave, b.x, b.y);
      ctx.stroke();
    }

    // 2. Draw Hexagonal Energy Barriers for active drones
    for (const drone of this.drones.values()) {
      if (!drone.isFrontalShieldActive || drone.isBacklashStunned || drone.shieldHp <= 0) continue;

      const shieldRatio = drone.shieldHp / Math.max(1, drone.maxShieldHp);
      const hexAlpha = 0.35 + 0.30 * shieldRatio;

      ctx.save();
      ctx.translate(drone.x, drone.y);

      // Render 60-degree forward hexagonal curved arc
      ctx.strokeStyle = `rgba(0, 240, 255, ${hexAlpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(0, 0, 42, 0.25 * Math.PI, 0.75 * Math.PI, false);
      ctx.stroke();

      // Hexagonal facets on barrier
      ctx.fillStyle = `rgba(0, 240, 255, ${hexAlpha * 0.25})`;
      for (let angle = 0.3 * Math.PI; angle <= 0.7 * Math.PI; angle += 0.2 * Math.PI) {
        const hx = Math.cos(angle) * 42;
        const hy = Math.sin(angle) * 42;
        this.drawHexagon(ctx, hx, hy, 8);
      }

      ctx.restore();
    }

    // 3. Draw Arc Sparks
    for (const p of this.arcParticles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  public reset(): void {
    this.drones.clear();
    this.links = [];
    this.arcParticles = [];
  }
}

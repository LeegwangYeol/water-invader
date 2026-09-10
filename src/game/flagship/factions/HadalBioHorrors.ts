// ============================================================================
// WATER INVADER: HADAL BIO-HORRORS FACTION
// Feature 8: Organic Swarming, Parasitic Latching & Chitin Deflections
// ============================================================================

import {
  IBioHorrorManager,
  IFlagshipSubsystem,
  FlagshipUpdateContext,
  HadalFactionState,
  HadalMutationType,
  ParasiteClingerData,
  SporeCloudData,
} from '../types';
import { EpigeneticMutationEngine } from './EpigeneticMutationEngine';
import { Bullet } from '../../Bullet';
import { Enemy } from '../../Enemy';
import { Player } from '../../Player';
import { Barricade } from '../../Barricade';
import { Vector2D } from '../../types';

export interface BioHorrorUnit {
  id: number;
  type: 'CLINGER' | 'SIPHONER' | 'COLOSSUS' | 'ANGLER' | 'BROODMOTHER';
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
  alpha: number;
  hitFlashTimer: number;
  animTimer: number;

  // Clinger specifics
  isLatched?: boolean;
  attachOffset?: Vector2D;
  torqueDirection?: -1 | 1;

  // Siphoner specifics
  absorbedBullets?: number;
  auraRadius?: number;
  currentSacRadius?: number;

  // Colossus specifics
  boneShieldHp?: number;
  maxBoneShieldHp?: number;
  isShieldShattered?: boolean;
  stunTimer?: number;
  forwardNormal?: Vector2D;

  // Angler specifics
  isLureActive?: boolean;
  lurePos?: Vector2D;
  isRevealed?: boolean;
  lungeTimer?: number;
  isLunging?: boolean;

  // Broodmother specifics
  spawnTimer?: number;
  pheromoneTimer?: number;
  isSpawning?: boolean;
}

export class HadalBioHorrors implements IBioHorrorManager, IFlagshipSubsystem {
  public readonly id = 'bio-horrors';
  public readonly mutationEngine: EpigeneticMutationEngine;

  public state: HadalFactionState;
  public units: BioHorrorUnit[] = [];

  // Wiggle tracker for shaking off Parasite Clingers: Left/Right alternation
  private wiggleHistory: Array<{ dir: 'LEFT' | 'RIGHT'; time: number }> = [];
  private static readonly WIGGLE_WINDOW_SEC = 1.2;
  private static readonly REQUIRED_WIGGLES = 4;
  private lastWiggleDirection: 'LEFT' | 'RIGHT' | null = null;

  // Acid spatter & biological projectile pool
  private bioProjectiles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    damage: number;
    color: string;
    isDead: boolean;
  }> = [];

  constructor() {
    this.mutationEngine = new EpigeneticMutationEngine();
    this.state = {
      activeMutation: 'NONE',
      mutationProgress: 0,
      damageHistory: { kinetic: 0, missile: 0, pierce: 0, windowDuration: 0 },
      attachedParasiteCount: 0,
      activeSporeClouds: [],
    };
  }

  public init(): void {
    this.reset();
  }

  public recordDamageDealt(type: 'kinetic' | 'missile' | 'pierce', amount: number): void {
    this.mutationEngine.recordDamage(type, amount);
    this.state.damageHistory = this.mutationEngine.getDamageHistory();
    this.state.activeMutation = this.mutationEngine.getActiveMutation();
    this.state.mutationProgress = this.mutationEngine.getMutationProgress();
  }

  public attachClinger(clinger: ParasiteClingerData): boolean {
    if (this.state.attachedParasiteCount >= 3) {
      return false; // Strict invariant: Max 3 Clingers simultaneously on player hull
    }
    this.state.attachedParasiteCount++;
    return true;
  }

  public removeClingers(count: number = 1): number {
    const removed = Math.min(this.state.attachedParasiteCount, count);
    this.state.attachedParasiteCount -= removed;
    return removed;
  }

  public spawnSporeCloud(
    x: number,
    y: number,
    initialRadius: number,
    maxRadius: number,
    duration: number
  ): void {
    this.state.activeSporeClouds.push({
      id: Date.now() + Math.random(),
      x,
      y,
      radius: initialRadius,
      maxRadius,
      duration,
      remainingLife: duration,
    });
  }

  // ==========================================================================
  // SPAWN METHODS FOR ALL 5 BIO-HORROR UNITS
  // ==========================================================================

  public spawnParasiteClinger(x: number, y: number): BioHorrorUnit {
    const unit: BioHorrorUnit = {
      id: Math.floor(Math.random() * 1000000),
      type: 'CLINGER',
      position: { x, y },
      velocity: { x: 0, y: 180 },
      width: 32,
      height: 24,
      hp: 35,
      maxHp: 35,
      isDead: false,
      alpha: 1.0,
      hitFlashTimer: 0,
      animTimer: Math.random() * 10,
      isLatched: false,
      attachOffset: { x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 20 },
      torqueDirection: Math.random() < 0.5 ? -1 : 1,
    };
    this.units.push(unit);
    return unit;
  }

  public spawnSporeSiphoner(x: number, y: number): BioHorrorUnit {
    const unit: BioHorrorUnit = {
      id: Math.floor(Math.random() * 1000000),
      type: 'SIPHONER',
      position: { x, y },
      velocity: { x: (Math.random() - 0.5) * 40, y: 35 },
      width: 48,
      height: 48,
      hp: 120,
      maxHp: 120,
      isDead: false,
      alpha: 1.0,
      hitFlashTimer: 0,
      animTimer: 0,
      absorbedBullets: 0,
      auraRadius: 110,
      currentSacRadius: 24,
    };
    this.units.push(unit);
    return unit;
  }

  public spawnCarapaceColossus(x: number, y: number): BioHorrorUnit {
    const unit: BioHorrorUnit = {
      id: Math.floor(Math.random() * 1000000),
      type: 'COLOSSUS',
      position: { x, y },
      velocity: { x: (Math.random() - 0.5) * 20, y: 25 },
      width: 80,
      height: 60,
      hp: 280,
      maxHp: 280,
      isDead: false,
      alpha: 1.0,
      hitFlashTimer: 0,
      animTimer: 0,
      boneShieldHp: 40,
      maxBoneShieldHp: 40,
      isShieldShattered: false,
      stunTimer: 0,
      forwardNormal: { x: 0, y: 1 },
    };
    this.units.push(unit);
    return unit;
  }

  public spawnAbyssalAngler(x: number, y: number): BioHorrorUnit {
    const unit: BioHorrorUnit = {
      id: Math.floor(Math.random() * 1000000),
      type: 'ANGLER',
      position: { x, y },
      velocity: { x: (Math.random() - 0.5) * 30, y: 40 },
      width: 56,
      height: 36,
      hp: 150,
      maxHp: 150,
      isDead: false,
      alpha: 0.15, // Camouflaged stealth alpha
      hitFlashTimer: 0,
      animTimer: 0,
      isLureActive: true,
      lurePos: { x, y: y + 55 },
      isRevealed: false,
      lungeTimer: 0,
      isLunging: false,
    };
    this.units.push(unit);
    return unit;
  }

  public spawnBroodmotherMatriarch(x: number, y: number): BioHorrorUnit {
    const unit: BioHorrorUnit = {
      id: Math.floor(Math.random() * 1000000),
      type: 'BROODMOTHER',
      position: { x, y },
      velocity: { x: 30, y: 10 },
      width: 110,
      height: 85,
      hp: 650,
      maxHp: 650,
      isDead: false,
      alpha: 1.0,
      hitFlashTimer: 0,
      animTimer: 0,
      spawnTimer: 9.0,
      pheromoneTimer: 0,
      isSpawning: false,
    };
    this.units.push(unit);
    return unit;
  }

  // ==========================================================================
  // INPUT HANDLING: WIGGLE COUNTERPLAY
  // ==========================================================================

  public handleInput(key: string, isDown: boolean, context: FlagshipUpdateContext): boolean {
    if (!isDown) return false;

    // Detect alternating Left & Right key presses
    let dir: 'LEFT' | 'RIGHT' | null = null;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      dir = 'LEFT';
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      dir = 'RIGHT';
    }

    if (dir && dir !== this.lastWiggleDirection) {
      this.lastWiggleDirection = dir;
      const now = performance.now() / 1000;
      this.wiggleHistory.push({ dir, time: now });

      // Clean up outdated wiggles
      this.wiggleHistory = this.wiggleHistory.filter(
        (w) => now - w.time <= HadalBioHorrors.WIGGLE_WINDOW_SEC
      );

      // If 4 alternating wiggles reached within 1.2s -> shake off a parasite
      if (this.wiggleHistory.length >= HadalBioHorrors.REQUIRED_WIGGLES && this.state.attachedParasiteCount > 0) {
        this.removeClingers(1);
        this.wiggleHistory = [];
        context.createExplosion(
          context.player.position.x + 20,
          context.player.position.y,
          '#10b981',
          12,
          1.2
        );
        context.triggerScreenShake(0.15, 3);
        return true;
      }
    }

    return false;
  }

  // ==========================================================================
  // UPDATE LOOP
  // ==========================================================================

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    const { player, bullets, barricades, createExplosion, triggerScreenShake } = context;

    // 1. Update Epigenetic Mutation Engine
    this.mutationEngine.update(deltaTime);
    this.state.activeMutation = this.mutationEngine.getActiveMutation();
    this.state.mutationProgress = this.mutationEngine.getMutationProgress();

    // 2. Apply Parasitic Drag to Player
    // v_player(n) = v_base * max(0.25, 1.0 - 0.25 * n), clamped at max 3 parasites (-75% speed)
    const n = Math.min(3, this.state.attachedParasiteCount);
    const speedRatio = Math.max(0.25, 1.0 - 0.25 * n);
    // Adjust player speed according to attached count
    if (n > 0) {
      player.speed = (player.baseSpeed || 300) * speedRatio;
    } else {
      player.speed = player.baseSpeed || 300;
    }

    // 3. Scrape off Clingers against Barricades
    if (this.state.attachedParasiteCount > 0) {
      for (const b of barricades) {
        if (b.isDead) continue;
        const dist = Math.hypot(
          player.position.x + 20 - (b.position.x + b.size.width / 2),
          player.position.y + 15 - (b.position.y + b.size.height / 2)
        );
        if (dist < 38) {
          this.removeClingers(1);
          b.takeDamage(5);
          createExplosion(player.position.x + 20, player.position.y, '#059669', 15, 1.4);
          triggerScreenShake(0.2, 4);
          break;
        }
      }
    }

    // 4. Update Spore Clouds
    for (let i = this.state.activeSporeClouds.length - 1; i >= 0; i--) {
      const cloud = this.state.activeSporeClouds[i];
      cloud.remainingLife -= deltaTime;
      cloud.radius = Math.min(cloud.maxRadius, cloud.radius + 18 * deltaTime);

      // Acid damage to player if inside cloud
      const distToPlayer = Math.hypot(
        player.position.x + 20 - cloud.x,
        player.position.y + 15 - cloud.y
      );
      if (distToPlayer < cloud.radius) {
        // Lingering corrosive spore tick: 1 HP per 0.75s
        if (Math.random() < deltaTime * 1.33 && player.invincibilityTimer <= 0) {
          player.hp = Math.max(0, player.hp - 1);
          player.hitFlashTimer = 0.15;
          createExplosion(player.position.x + 20, player.position.y + 15, '#84cc16', 8, 0.8);
        }
      }

      if (cloud.remainingLife <= 0) {
        this.state.activeSporeClouds.splice(i, 1);
      }
    }

    // 5. Update Bio-Projectiles
    for (let i = this.bioProjectiles.length - 1; i >= 0; i--) {
      const bp = this.bioProjectiles[i];
      bp.x += bp.vx * deltaTime;
      bp.y += bp.vy * deltaTime;

      // Check collision with player
      const dist = Math.hypot(player.position.x + 20 - bp.x, player.position.y + 15 - bp.y);
      if (dist < bp.radius + 15) {
        if (player.invincibilityTimer <= 0) {
          player.hp = Math.max(0, player.hp - bp.damage);
          player.hitFlashTimer = 0.2;
          player.invincibilityTimer = 0.6;
        }
        createExplosion(bp.x, bp.y, bp.color, 12, 1.0);
        this.bioProjectiles.splice(i, 1);
        continue;
      }

      // Check collision with barricades
      for (const b of barricades) {
        if (!b.isDead && bp.x >= b.position.x && bp.x <= b.position.x + b.size.width &&
            bp.y >= b.position.y && bp.y <= b.position.y + b.size.height) {
          b.takeDamage(bp.damage);
          createExplosion(bp.x, bp.y, bp.color, 8, 0.8);
          bp.isDead = true;
          break;
        }
      }

      if (bp.isDead || bp.y > 850 || bp.y < -50 || bp.x < -50 || bp.x > 650) {
        this.bioProjectiles.splice(i, 1);
      }
    }

    // 6. Update Living Bio-Horror Units
    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i];
      unit.animTimer += deltaTime;
      if (unit.hitFlashTimer > 0) unit.hitFlashTimer -= deltaTime;

      if (unit.stunTimer && unit.stunTimer > 0) {
        unit.stunTimer -= deltaTime;
        continue; // Stunned, cannot move or act
      }

      switch (unit.type) {
        case 'CLINGER': {
          // Corkscrew dive: vx = 160 * sin(4t), vy = 180
          unit.velocity.x = 160 * Math.sin(unit.animTimer * 4);
          unit.position.x += unit.velocity.x * deltaTime;
          unit.position.y += unit.velocity.y * deltaTime;

          // Check latch proximity to player
          const distToPlayer = Math.hypot(
            player.position.x + 20 - unit.position.x,
            player.position.y + 15 - unit.position.y
          );
          if (distToPlayer <= 45) {
            const attached = this.attachClinger({
              id: unit.id,
              attachOffset: unit.attachOffset || { x: 0, y: 0 },
              dragIntensity: 0.25,
              torqueDirection: unit.torqueDirection || 1,
            });
            if (attached) {
              createExplosion(unit.position.x, unit.position.y, '#059669', 10, 1.0);
              unit.isDead = true;
            } else {
              // Bounces off if cap is already reached
              unit.position.y -= 30;
              unit.velocity.y = -100;
            }
          }
          break;
        }

        case 'SIPHONER': {
          // Slow floating drift
          unit.position.x += unit.velocity.x * deltaTime;
          unit.position.y += unit.velocity.y * deltaTime;
          if (unit.position.x < 50 || unit.position.x > 550) unit.velocity.x *= -1;

          // Ingestion aura: attracts or swallows missed player bullets
          for (const b of bullets) {
            if (b.isDead) continue;
            const dist = Math.hypot(unit.position.x - b.position.x, unit.position.y - b.position.y);
            if (dist < (unit.auraRadius || 110)) {
              // Ingestion vortex pull
              const angle = Math.atan2(unit.position.y - b.position.y, unit.position.x - b.position.x);
              b.position.x += Math.cos(angle) * 120 * deltaTime;
              b.position.y += Math.sin(angle) * 120 * deltaTime;

              // Swallowed into bladder
              if (dist < (unit.currentSacRadius || 24)) {
                if (!b.piercing) {
                  b.isDead = true;
                  unit.absorbedBullets = (unit.absorbedBullets || 0) + 1;
                  unit.currentSacRadius = Math.min(80, (unit.currentSacRadius || 24) + 4);
                  createExplosion(b.position.x, b.position.y, '#84cc16', 5, 0.6);
                }
              }
            }
          }
          break;
        }

        case 'COLOSSUS': {
          // Heavy frontal advance
          unit.position.x += unit.velocity.x * deltaTime;
          unit.position.y += unit.velocity.y * deltaTime;
          if (unit.position.x < 80 || unit.position.x > 520) unit.velocity.x *= -1;

          // Periodically spit acid cluster
          if (Math.sin(unit.animTimer * 1.5) > 0.96) {
            this.bioProjectiles.push({
              x: unit.position.x,
              y: unit.position.y + 30,
              vx: (Math.random() - 0.5) * 60,
              vy: 190,
              radius: 6,
              damage: 1,
              color: '#84cc16',
              isDead: false,
            });
          }
          break;
        }

        case 'ANGLER': {
          // Subtle drifting with floating glowing lure
          unit.position.x += unit.velocity.x * deltaTime;
          unit.position.y += unit.velocity.y * deltaTime;
          if (unit.position.x < 60 || unit.position.x > 540) unit.velocity.x *= -1;

          // Lure position hangs 55px below
          if (unit.isLureActive && unit.lurePos) {
            unit.lurePos.x = unit.position.x + Math.sin(unit.animTimer * 2) * 12;
            unit.lurePos.y = unit.position.y + 55 + Math.cos(unit.animTimer * 2) * 8;

            // Check if player approaches false water lure within 120px
            const distToPlayer = Math.hypot(
              player.position.x + 20 - unit.lurePos.x,
              player.position.y + 15 - unit.lurePos.y
            );
            if (distToPlayer <= 120 && !unit.isLunging) {
              // Trigger flashbang & lunge!
              unit.isLunging = true;
              unit.alpha = 1.0;
              unit.isRevealed = true;
              player.suppressionLevel = 95; // Blinding flashbang causes massive weapon spread
              triggerScreenShake(0.4, 7);
              createExplosion(unit.lurePos.x, unit.lurePos.y, '#00f0ff', 25, 2.0);
              unit.velocity.y = 350; // Fast predatory lunge
            }
          }
          break;
        }

        case 'BROODMOTHER': {
          // Colossal sinusoidal sweep across top of canvas
          unit.position.x += unit.velocity.x * deltaTime;
          unit.position.y += Math.sin(unit.animTimer * 0.8) * 15 * deltaTime;
          if (unit.position.x < 100) {
            unit.position.x = 100;
            unit.velocity.x = Math.abs(unit.velocity.x);
          } else if (unit.position.x > 500) {
            unit.position.x = 500;
            unit.velocity.x = -Math.abs(unit.velocity.x);
          }

          // Spawning cycle every 9.0s
          unit.spawnTimer = (unit.spawnTimer || 9.0) - deltaTime;
          if (unit.spawnTimer <= 0) {
            unit.spawnTimer = 9.0;
            unit.isSpawning = true;
            // Spawn pair of parasites or spore siphoner
            this.spawnParasiteClinger(unit.position.x - 30, unit.position.y + 40);
            this.spawnParasiteClinger(unit.position.x + 30, unit.position.y + 40);
            if (Math.random() < 0.5) {
              this.spawnSporeSiphoner(unit.position.x, unit.position.y + 45);
            }
            createExplosion(unit.position.x, unit.position.y + 40, '#84cc16', 15, 1.5);
          }

          // Pheromone roar cycle
          unit.pheromoneTimer = (unit.pheromoneTimer || 0) + deltaTime;
          if (unit.pheromoneTimer >= 14.0) {
            unit.pheromoneTimer = 0;
            triggerScreenShake(0.3, 5);
            createExplosion(unit.position.x, unit.position.y, '#10b981', 30, 2.5);
            // Speed buff all living bio-horrors
            for (const u of this.units) {
              u.velocity.x *= 1.3;
              u.velocity.y *= 1.3;
            }
          }
          break;
        }
      }

      // Check Bullet Collisions against Bio-Horror Units
      this.checkBulletCollisions(unit, bullets, context);

      // Remove dead or off-screen units
      if (unit.isDead || unit.position.y > 850) {
        this.units.splice(i, 1);
      }
    }
  }

  // ==========================================================================
  // BULLET COLLISION & MITIGATION RESOLUTION
  // ==========================================================================

  private checkBulletCollisions(
    unit: BioHorrorUnit,
    bullets: Bullet[],
    context: FlagshipUpdateContext
  ): void {
    const { createExplosion, triggerScreenShake } = context;

    for (const b of bullets) {
      if (b.isDead) continue;

      // Special Angler lure hit check
      if (unit.type === 'ANGLER' && unit.isLureActive && unit.lurePos) {
        const distToLure = Math.hypot(b.position.x - unit.lurePos.x, b.position.y - unit.lurePos.y);
        if (distToLure < 18) {
          // Counterplay: Sniper destroyed the false lure from afar!
          b.isDead = true;
          unit.isLureActive = false;
          unit.isRevealed = true;
          unit.alpha = 1.0;
          unit.stunTimer = 2.0; // Stunned & unmasked!
          createExplosion(unit.lurePos.x, unit.lurePos.y, '#00f0ff', 20, 1.8);
          triggerScreenShake(0.2, 4);
          continue;
        }
      }

      // Main unit AABB hit check
      const halfW = unit.width / 2;
      const halfH = unit.height / 2;
      if (
        b.position.x >= unit.position.x - halfW &&
        b.position.x <= unit.position.x + halfW &&
        b.position.y >= unit.position.y - halfH &&
        b.position.y <= unit.position.y + halfH
      ) {
        let rawDamage = 10;
        let weaponType: 'kinetic' | 'missile' | 'pierce' = 'kinetic';
        const isPiercing = (b as any).piercing && (b as any).piercing >= 2;

        if (isPiercing) {
          weaponType = 'pierce';
          rawDamage = 18;
        } else if ((b as any).isHoming || (b as any).homing) {
          weaponType = 'missile';
          rawDamage = 25;
        }

        // 1. Colossus Directional Carapace Deflection Check
        if (unit.type === 'COLOSSUS') {
          // Vector from Colossus to Bullet
          const bulletVy = (b as any).velocity?.y ?? -300;
          const isFrontalHit = bulletVy < 0 && b.position.y > unit.position.y;
          const isRearHit = bulletVy > 0 || b.position.y < unit.position.y;

          if (isPiercing) {
            // Piercing weapon shatters bone shield and stuns Colossus for 2.5s!
            if (!unit.isShieldShattered) {
              unit.isShieldShattered = true;
              unit.boneShieldHp = 0;
              unit.stunTimer = 2.5;
              createExplosion(unit.position.x, unit.position.y, '#cbd5e1', 25, 2.0);
              triggerScreenShake(0.25, 6);
            }
          } else if (isFrontalHit && !unit.isShieldShattered) {
            // 85% damage mitigation on frontal bone shield!
            if (unit.boneShieldHp !== undefined) {
              unit.boneShieldHp = Math.max(0, unit.boneShieldHp - rawDamage);
              if (unit.boneShieldHp <= 0) {
                unit.boneShieldHp = 0;
                unit.isShieldShattered = true;
                unit.stunTimer = 2.5;
                createExplosion(unit.position.x, unit.position.y, '#cbd5e1', 25, 2.0);
                triggerScreenShake(0.25, 6);
              }
            }
            rawDamage *= 0.15;
            createExplosion(b.position.x, b.position.y, '#94a3b8', 6, 0.7);
          } else if (isRearHit) {
            // 200% critical hit to unprotected rear!
            rawDamage *= 2.0;
            createExplosion(b.position.x, b.position.y, '#ef4444', 18, 1.5);
          }
        }

        // 2. Epigenetic Counter-Mutation Calculation (Capped at 40% mitigation)
        const mitigation = this.mutationEngine.calculateMitigation(rawDamage, weaponType);
        this.recordDamageDealt(weaponType, mitigation.finalDamage);

        if (mitigation.isSpoofed) {
          // Missile decoyed into bioluminescent chaff
          createExplosion(b.position.x, b.position.y, '#38bdf8', 12, 1.2);
          b.isDead = true;
          continue;
        }

        if (mitigation.absorbsPiercing) {
          // Viscous flesh halts bullet piercing
          (b as any).piercing = 0;
        }

        unit.hp -= mitigation.finalDamage;
        unit.hitFlashTimer = 0.08;
        b.isDead = !isPiercing || !!mitigation.absorbsPiercing;

        createExplosion(b.position.x, b.position.y, '#10b981', 8, 0.9);

        // Check unit death
        if (unit.hp <= 0) {
          unit.isDead = true;
          this.handleUnitDeath(unit, isPiercing, context);
        }
      }
    }
  }

  private handleUnitDeath(
    unit: BioHorrorUnit,
    isPiercing: boolean,
    context: FlagshipUpdateContext
  ): void {
    const { createExplosion, triggerScreenShake } = context;

    switch (unit.type) {
      case 'CLINGER':
        createExplosion(unit.position.x, unit.position.y, '#059669', 15, 1.3);
        break;

      case 'SIPHONER': {
        // Death burst: Spawns corrosive acid spore cloud (90-160px)
        const baseRadius = 45 + (unit.absorbedBullets || 0) * 8;
        const maxRadius = Math.min(160, baseRadius * 1.5);
        // Piercing weapons detonate core safely, reducing cloud radius by 60%
        const finalRadius = isPiercing ? maxRadius * 0.40 : maxRadius;
        this.spawnSporeCloud(unit.position.x, unit.position.y, 25, finalRadius, 4.5);
        createExplosion(unit.position.x, unit.position.y, '#84cc16', 30, 2.2);
        triggerScreenShake(0.25, 5);
        break;
      }

      case 'COLOSSUS':
        createExplosion(unit.position.x, unit.position.y, '#059669', 35, 2.5);
        triggerScreenShake(0.3, 7);
        break;

      case 'ANGLER':
        createExplosion(unit.position.x, unit.position.y, '#00f0ff', 25, 2.0);
        break;

      case 'BROODMOTHER':
        createExplosion(unit.position.x, unit.position.y, '#84cc16', 50, 3.5);
        triggerScreenShake(0.5, 12);
        break;
    }
  }

  // ==========================================================================
  // RENDERING: 100% PROCEDURAL VECTOR CANVAS GRAPHICS
  // ==========================================================================

  public drawWorld(ctx: CanvasRenderingContext2D, time: number): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    // 1. Render Spore Clouds with dynamic billow
    for (const cloud of this.state.activeSporeClouds) {
      const alpha = Math.max(0, cloud.remainingLife / cloud.duration) * 0.45;
      ctx.save();
      const grad = ctx.createRadialGradient(cloud.x, cloud.y, 5, cloud.x, cloud.y, cloud.radius);
      grad.addColorStop(0, `rgba(132, 204, 22, ${alpha * 1.2})`);
      grad.addColorStop(0.7, `rgba(16, 185, 129, ${alpha * 0.7})`);
      grad.addColorStop(1, 'rgba(5, 150, 105, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Render Bio-Projectiles
    for (const bp of this.bioProjectiles) {
      ctx.save();
      ctx.fillStyle = bp.color;
      ctx.shadowColor = bp.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Render Living Units
    for (const unit of this.units) {
      this.drawBioUnit(ctx, unit, time);
    }
  }

  private drawBioUnit(ctx: CanvasRenderingContext2D, unit: BioHorrorUnit, time: number): void {
    ctx.save();
    ctx.translate(unit.position.x, unit.position.y);
    ctx.globalAlpha = unit.alpha;

    // Hit flash overlay
    if (unit.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
    }

    switch (unit.type) {
      case 'CLINGER': {
        // Viridian chitin leech with wriggling segmented body & latching pincers
        const wriggle = Math.sin(unit.animTimer * 8) * 4;
        ctx.fillStyle = unit.hitFlashTimer > 0 ? '#ffffff' : '#059669';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 10, wriggle * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Segments
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 1.5;
        for (let i = -10; i <= 10; i += 5) {
          ctx.beginPath();
          ctx.moveTo(i, -6);
          ctx.lineTo(i + wriggle * 0.5, 6);
          ctx.stroke();
        }

        // Glowing red compound eyes
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-5, 6, 2, 0, Math.PI * 2);
        ctx.arc(5, 6, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'SIPHONER': {
        // Bulbous bladder with expanding translucent nucleus & ingestion vortex aura
        const rad = unit.currentSacRadius || 24;
        // Ingestion field ring
        ctx.strokeStyle = 'rgba(132, 204, 22, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, unit.auraRadius || 110, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Main sac
        const sacGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, rad);
        sacGrad.addColorStop(0, '#bef264');
        sacGrad.addColorStop(0.7, '#84cc16');
        sacGrad.addColorStop(1, '#4d7c0f');
        ctx.fillStyle = unit.hitFlashTimer > 0 ? '#ffffff' : sacGrad;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.fill();

        // Pulsating spore nucleus
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.sin(time * 3) * 3, Math.cos(time * 3) * 3, rad * 0.35, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'COLOSSUS': {
        // Heavy crustacean with frontal bone shield
        // Chitin Thorax
        ctx.fillStyle = unit.hitFlashTimer > 0 ? '#ffffff' : '#1e293b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        // 140° Frontal Bone Shield
        if (!unit.isShieldShattered) {
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 4, 38, 0.1 * Math.PI, 0.9 * Math.PI, false);
          ctx.lineTo(26, 12);
          ctx.lineTo(-26, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Emerald breathing vents
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(-14, -8, 3, 0, Math.PI * 2);
        ctx.arc(14, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'ANGLER': {
        // Translucent viperfish body with dangling lure
        ctx.fillStyle = unit.hitFlashTimer > 0 ? '#ffffff' : '#0f172a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Translucent teeth
        ctx.fillStyle = '#ffffff';
        for (let x = -16; x <= 16; x += 6) {
          ctx.beginPath();
          ctx.moveTo(x, 10);
          ctx.lineTo(x + 2, 16);
          ctx.lineTo(x + 4, 10);
          ctx.fill();
        }

        // Lure Stalk & Crystal
        if (unit.isLureActive && unit.lurePos) {
          const lx = unit.lurePos.x - unit.position.x;
          const ly = unit.lurePos.y - unit.position.y;
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.quadraticCurveTo(lx * 0.5, ly * 0.3, lx, ly);
          ctx.stroke();

          // False +50 Pure Water crystal
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(lx, ly, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        break;
      }

      case 'BROODMOTHER': {
        // Colossal leviathan abdomen with glowing brood chambers
        ctx.fillStyle = unit.hitFlashTimer > 0 ? '#ffffff' : '#064e3b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 52, 38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pulsating egg chambers
        ctx.fillStyle = '#84cc16';
        for (let i = -30; i <= 30; i += 20) {
          const pulse = Math.sin(time * 4 + i) * 2;
          ctx.beginPath();
          ctx.arc(i, 8, 7 + pulse, 0, Math.PI * 2);
          ctx.fill();
        }

        // Armored head crest
        ctx.fillStyle = '#022c22';
        ctx.beginPath();
        ctx.moveTo(0, 36);
        ctx.lineTo(-24, 12);
        ctx.lineTo(24, 12);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  public drawForeground(ctx: CanvasRenderingContext2D, time: number): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    // Draw Metamorphosis Alert Banner if active
    const banner = this.mutationEngine.getAlertBannerText();
    if (banner) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(40, 60, 520, 32);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 60, 520, 32);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(banner, 300, 81);
      ctx.restore();
    }
  }

  public reset(): void {
    this.mutationEngine.reset();
    this.units = [];
    this.bioProjectiles = [];
    this.state = {
      activeMutation: 'NONE',
      mutationProgress: 0,
      damageHistory: { kinetic: 0, missile: 0, pierce: 0, windowDuration: 0 },
      attachedParasiteCount: 0,
      activeSporeClouds: [],
    };
    this.wiggleHistory = [];
    this.lastWiggleDirection = null;
  }
}

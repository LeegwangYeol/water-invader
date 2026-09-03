import { Vector2D, Faction } from '../types';
import { Bullet } from '../Bullet';
import { Particle } from '../Particle';
import { Player } from '../Player';
import { SoundManager } from '../SoundManager';
import {
  CrisisArchetype,
  CrisisPhase,
  EndGameCrisisState,
  CrisisAttackPattern,
  CrisisEventCallbacks,
} from './types';
import { CrisisSovereign } from './CrisisSovereign';
import { DimensionalRift } from './DimensionalRift';

/**
 * EndGameCrisis Coordinator
 * 
 * Orchestrates the full lifecycle of Stellaris-Style End-Game Crisis encounters:
 * 3.0s incursion warning, 3 discrete combat phases, dimensional rift anchors,
 * archetypal attack patterns, gravitational vortex physics, and cataclysmic resolution.
 */
export class EndGameCrisis {
  public isActive: boolean = false;
  public phase: CrisisPhase = CrisisPhase.INCURSION;
  public archetype: CrisisArchetype = CrisisArchetype.VOID_SOVEREIGN;
  
  public warningTimer: number = 0;
  public readonly warningDuration: number = 3.0;
  public bannerText: string | null = null;
  
  public sovereign: CrisisSovereign | null = null;
  public riftAnchors: DimensionalRift[] = [];
  
  public vortexPullIntensity: number = 0;
  public realityDistortion: number = 0;
  
  private attackTimer: number = 0;
  private attackCooldown: number = 2.2;
  private activeAttack: CrisisAttackPattern | null = null;
  private attackPhaseTime: number = 0;
  
  private logicalWidth: number = 600;
  private logicalHeight: number = 800;
  
  public callbacks: CrisisEventCallbacks = {};
  
  constructor(logicalWidth: number = 600, logicalHeight: number = 800) {
    this.logicalWidth = logicalWidth;
    this.logicalHeight = logicalHeight;
  }

  /**
   * Trigger an End-Game Crisis Incursion
   */
  public startIncursion(archetype?: CrisisArchetype, soundManager?: SoundManager): void {
    this.isActive = true;
    this.phase = CrisisPhase.INCURSION;
    this.warningTimer = this.warningDuration;
    
    // Choose archetype (or random roll if unspecified)
    if (archetype) {
      this.archetype = archetype;
    } else {
      const archetypes = [
        CrisisArchetype.VOID_SOVEREIGN,
        CrisisArchetype.ABYSSAL_LEVIATHAN,
        CrisisArchetype.CYBERNETIC_EXTERMINATOR,
        CrisisArchetype.CHRONO_DEVOURER,
        CrisisArchetype.SOLARIS_COLOSSUS,
        CrisisArchetype.NEBULA_PHANTASM,
        CrisisArchetype.BIOMORPHIC_SWARM,
        CrisisArchetype.SINGULARITY_CORE,
        CrisisArchetype.NANITE_HARVESTER,
        CrisisArchetype.PSIONIC_SHROUD,
        CrisisArchetype.GLACIAL_OBLIVION,
        CrisisArchetype.COSMIC_DEVOURER,
      ];
      this.archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    }

    this.bannerText = `⚠ DIMENSIONAL ANOMALY DETECTED — ${this.getArchetypeTitle()} INCURSION ⚠`;

    // Sound notification
    if (soundManager) {
      soundManager.playCrisisCataclysmSiren();
    }

    // Initialize Sovereign (centered at top)
    const sovereignX = (this.logicalWidth - 260) / 2;
    const sovereignY = 65;
    this.sovereign = new CrisisSovereign(sovereignX, sovereignY, this.archetype, 2500, 1500);
    this.sovereign.setPhase(CrisisPhase.INCURSION);

    // Initialize 2 Flanking Dimensional Rift Anchors (600 HP each) differentiated per archetype
    const riftLeftX = 50;
    const riftRightX = this.logicalWidth - 130;
    const riftY = 170;
    
    const leftRift = new DimensionalRift(riftLeftX, riftY, 0, 600, this.archetype);
    const rightRift = new DimensionalRift(riftRightX, riftY, 1, 600, this.archetype);
    leftRift.setSovereignTarget(this.sovereign.getCoreCenter());
    rightRift.setSovereignTarget(this.sovereign.getCoreCenter());
    leftRift.setSiblingRift(rightRift);
    rightRift.setSiblingRift(leftRift);
    
    this.riftAnchors = [leftRift, rightRift];
    if (this.archetype === CrisisArchetype.VOID_SOVEREIGN) {
      this.vortexPullIntensity = 0.3;
    } else if (this.archetype === CrisisArchetype.CHRONO_DEVOURER) {
      this.vortexPullIntensity = 0.2;
    } else if (this.archetype === CrisisArchetype.SOLARIS_COLOSSUS) {
      this.vortexPullIntensity = 0.15;
    } else if (this.archetype === CrisisArchetype.NEBULA_PHANTASM) {
      this.vortexPullIntensity = 0.25;
    } else if (this.archetype === CrisisArchetype.BIOMORPHIC_SWARM) {
      this.vortexPullIntensity = 20;
    } else if (this.archetype === CrisisArchetype.SINGULARITY_CORE) {
      this.vortexPullIntensity = 50;
    } else if (this.archetype === CrisisArchetype.NANITE_HARVESTER) {
      this.vortexPullIntensity = 25;
    } else if (this.archetype === CrisisArchetype.PSIONIC_SHROUD) {
      this.vortexPullIntensity = 30;
    } else if (this.archetype === CrisisArchetype.GLACIAL_OBLIVION) {
      this.vortexPullIntensity = 20;
    } else if (this.archetype === CrisisArchetype.COSMIC_DEVOURER) {
      this.vortexPullIntensity = 35;
    } else {
      this.vortexPullIntensity = 0.1;
    }

    if (this.callbacks.onPhaseChange) {
      this.callbacks.onPhaseChange(this.phase, CrisisPhase.DEFEATED);
    }
  }

  private getArchetypeTitle(): string {
    switch (this.archetype) {
      case CrisisArchetype.VOID_SOVEREIGN:
        return 'VOID SOVEREIGN';
      case CrisisArchetype.ABYSSAL_LEVIATHAN:
        return 'ABYSSAL LEVIATHAN';
      case CrisisArchetype.CYBERNETIC_EXTERMINATOR:
        return 'CYBERNETIC EXTERMINATOR';
      case CrisisArchetype.CHRONO_DEVOURER:
        return 'CHRONO DEVOURER';
      case CrisisArchetype.SOLARIS_COLOSSUS:
        return 'SOLARIS COLOSSUS';
      case CrisisArchetype.NEBULA_PHANTASM:
        return 'NEBULA PHANTASM';
      case CrisisArchetype.BIOMORPHIC_SWARM:
        return 'BIOMORPHIC SWARM';
      case CrisisArchetype.SINGULARITY_CORE:
        return 'SINGULARITY CORE';
      case CrisisArchetype.NANITE_HARVESTER:
        return 'NANITE HARVESTER';
      case CrisisArchetype.PSIONIC_SHROUD:
        return 'PSIONIC SHROUD';
      case CrisisArchetype.GLACIAL_OBLIVION:
        return 'GLACIAL OBLIVION';
      case CrisisArchetype.COSMIC_DEVOURER:
        return 'COSMIC DEVOURER';
    }
  }

  /**
   * Main Crisis Update Loop
   */
  public update(
    deltaTime: number,
    player: Player,
    bullets: Bullet[],
    particles: Particle[],
    soundManager?: SoundManager
  ): void {
    if (!this.isActive) return;

    // Handle Incursion Warning Phase (3.0s)
    if (this.phase === CrisisPhase.INCURSION) {
      this.warningTimer -= deltaTime;
      this.realityDistortion = Math.min(1.0, (this.warningDuration - this.warningTimer) / this.warningDuration);
      
      if (this.warningTimer <= 0) {
        this.warningTimer = 0;
        this.transitionToPhase(CrisisPhase.PHASE_1_SHIELD, soundManager);
      }
      return;
    }

    if (this.phase === CrisisPhase.DEFEATED) {
      return;
    }

    const playerPos = player ? player.position : { x: this.logicalWidth / 2, y: this.logicalHeight - 50 };

    // Apply archetype-specific area-denial & environmental hazards
    this.applyEnvironmentalHazards(deltaTime, player, bullets);

    // 1. Update Dimensional Rifts / Brood Sacks / Pylons
    let activeRiftsCount = 0;
    for (let i = 0; i < this.riftAnchors.length; i++) {
      const rift = this.riftAnchors[i];
      if (!rift.isDead) {
        const spawned = rift.update(deltaTime, player, bullets);
        if (spawned.length > 0) {
          bullets.push(...spawned);
        }
        activeRiftsCount++;

        // Apply gravitational pull on player & player bullets for Void Sovereign and Singularity Core
        if (this.archetype === CrisisArchetype.VOID_SOVEREIGN) {
          this.applyRiftGravity(rift, player, bullets, deltaTime);
        } else if (this.archetype === CrisisArchetype.SINGULARITY_CORE) {
          this.applySingularityRiftGravity(rift, player, bullets, deltaTime);
        }

        // Spawn ambient particles
        if (Math.random() < 0.3 && particles.length < 400) {
          const center = rift.getSingularityCenter();
          const p = new Particle(center.x + (Math.random() * 20 - 10), center.y + (Math.random() * 20 - 10), rift.color, 0.6);
          particles.push(p);
        }
      } else {
        // Rift destroyed
        if (rift.isShielding) {
          rift.isShielding = false;
          if (soundManager) soundManager.playSingularityCollapse();
          if (this.callbacks.onRiftDestroyed) {
            this.callbacks.onRiftDestroyed(rift.riftIndex, activeRiftsCount);
          }
        }
      }
    }

    // 2. Check Phase 1 -> Phase 2 Transition (Both Rifts Destroyed)
    if (this.phase === CrisisPhase.PHASE_1_SHIELD && activeRiftsCount === 0) {
      this.transitionToPhase(CrisisPhase.PHASE_2_HULL, soundManager);
    }

    // 3. Update Crisis Sovereign
    if (this.sovereign) {
      if (this.sovereign.phase === CrisisPhase.DEFEATED || this.sovereign.isDead || this.sovereign.hp <= 0) {
        this.transitionToPhase(CrisisPhase.DEFEATED, soundManager);
        this.spawnCataclysmExplosion(this.sovereign.getCoreCenter(), particles);
        return;
      }

      this.sovereign.update(deltaTime, playerPos);

      // Check Phase 2 -> Phase 3 transition
      if (this.phase === CrisisPhase.PHASE_2_HULL && this.sovereign.phase === CrisisPhase.PHASE_3_CORE) {
        this.transitionToPhase(CrisisPhase.PHASE_3_CORE, soundManager);
      }

      // 4. Combat & Attack Pattern Director
      this.updateCombatAttacks(deltaTime, player, bullets, soundManager);
    }
  }

  /**
   * Phase Transition Orchestration
   */
  private transitionToPhase(newPhase: CrisisPhase, soundManager?: SoundManager): void {
    const prevPhase = this.phase;
    this.phase = newPhase;

    if (this.sovereign) {
      this.sovereign.setPhase(newPhase);
    }

    if (newPhase === CrisisPhase.PHASE_1_SHIELD) {
      this.bannerText = '✦ DIMENSIONAL SHIELD ACTIVE — DESTROY ANCHOR RIFTS ✦';
      if (soundManager) soundManager.playDimensionalRiftPulse();
    } else if (newPhase === CrisisPhase.PHASE_2_HULL) {
      this.bannerText = '✦ SHIELDS COLLAPSED — STRIKE THE SOVEREIGN HULL ✦';
      if (soundManager) {
        soundManager.playShieldBreak();
        soundManager.playDarkMatterBeam();
      }
    } else if (newPhase === CrisisPhase.PHASE_3_CORE) {
      this.bannerText = '⚠ WARNING: SINGULARITY CORE OVERDRIVE — ENRAGE IMMINENT ⚠';
      if (soundManager) {
        soundManager.playCrisisAlarm();
      }
    } else if (newPhase === CrisisPhase.DEFEATED) {
      this.bannerText = '✦ CATACLYSM AVERTED — CRISIS SOVEREIGN DESTROYED ✦';
      this.isActive = false;
      if (soundManager) {
        soundManager.playSingularityCollapse();
        soundManager.playVictory();
      }
      if (this.callbacks.onDefeated) {
        this.callbacks.onDefeated(this.archetype);
      }
    }

    if (this.callbacks.onPhaseChange) {
      this.callbacks.onPhaseChange(newPhase, prevPhase);
    }
  }

  /**
   * Reality-bending Gravitational Vortex Physics
   */
  private applyRiftGravity(rift: DimensionalRift, player: Player, bullets: Bullet[], deltaTime: number): void {
    const riftCenter = rift.getSingularityCenter();
    const pullRadius = rift.gravitationalPullRadius;
    const pullForce = rift.gravitationalPullForce;

    // Pull Player gently if within radius
    if (player) {
      const dx = riftCenter.x - (player.position.x + player.size.width / 2);
      const dy = riftCenter.y - (player.position.y + player.size.height / 2);
      const distSq = dx * dx + dy * dy;

      if (distSq < pullRadius * pullRadius && distSq > 100) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / pullRadius) * pullForce * deltaTime;
        player.position.x += (dx / dist) * force;
      }
    }

    // Bend Player Bullets slightly towards rift singularity
    for (const b of bullets) {
      if (b.faction === Faction.PLAYER && !b.isDead) {
        const bx = b.position.x + b.size.width / 2;
        const by = b.position.y + b.size.height / 2;
        const bdx = riftCenter.x - bx;
        const bdy = riftCenter.y - by;
        const bdistSq = bdx * bdx + bdy * bdy;

        if (bdistSq < pullRadius * pullRadius && bdistSq > 100) {
          const bdist = Math.sqrt(bdistSq);
          const bendForce = (1 - bdist / pullRadius) * 120 * deltaTime;
          b.position.x += (bdx / bdist) * bendForce;
        }
      }
    }
  }

  /**
   * Polarized Gravitational Mechanics for Singularity Core Anchors
   * Left anchor (index 0) exerts attractive pull, Right anchor (index 1) exerts repulsive push.
   */
  private applySingularityRiftGravity(rift: DimensionalRift, player: Player, bullets: Bullet[], deltaTime: number): void {
    const riftCenter = rift.getSingularityCenter();
    const pullRadius = 250;
    const pullForce = 50;

    // Left rift (index 0) pulls (+1), Right rift (index 1) pushes (-1)
    const direction = rift.riftIndex === 0 ? 1 : -1;

    // Player lateral gravity
    if (player) {
      const dx = riftCenter.x - (player.position.x + player.size.width / 2);
      const dy = riftCenter.y - (player.position.y + player.size.height / 2);
      const distSq = dx * dx + dy * dy;

      if (distSq < pullRadius * pullRadius && distSq > 100) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / pullRadius) * pullForce * deltaTime * direction;
        player.position.x += (dx / dist) * force;
      }
    }

    // Bullet bending
    for (const b of bullets) {
      if (b.faction === Faction.PLAYER && !b.isDead) {
        const bx = b.position.x + b.size.width / 2;
        const by = b.position.y + b.size.height / 2;
        const bdx = riftCenter.x - bx;
        const bdy = riftCenter.y - by;
        const bdistSq = bdx * bdx + bdy * bdy;

        if (bdistSq < pullRadius * pullRadius && bdistSq > 100) {
          const bdist = Math.sqrt(bdistSq);
          const bendForce = (1 - bdist / pullRadius) * 80 * deltaTime * direction;
          b.position.x += (bdx / bdist) * bendForce;
        }
      }
    }
  }

  /**
   * Archetype-specific Area-Denial & Environmental Hazards
   */
  private applyEnvironmentalHazards(deltaTime: number, player: Player, bullets: Bullet[]): void {
    if (!player || player.isDead) return;

    switch (this.archetype) {
      case CrisisArchetype.SINGULARITY_CORE:
        // Spacetime Curvature: all player bullets passing within 180px of Sovereign core bend inward
        if (this.sovereign && !this.sovereign.isDead) {
          const core = this.sovereign.getCoreCenter();
          for (const b of bullets) {
            if (b.faction === Faction.PLAYER && !b.isDead) {
              const bx = b.position.x + b.size.width / 2;
              const by = b.position.y + b.size.height / 2;
              const dx = core.x - bx;
              const dy = core.y - by;
              const distSq = dx * dx + dy * dy;
              if (distSq < 180 * 180 && distSq > 100) {
                const dist = Math.sqrt(distSq);
                b.position.x += (dx / dist) * 75 * deltaTime;
              }
            }
          }
        }
        break;

      case CrisisArchetype.GLACIAL_OBLIVION:
        // Absolute Zero Frostbite Zone: bottom 110px slows player movement speed
        if (player.position.y > this.logicalHeight - 110) {
          player.velocity.x *= Math.max(0.80, 1 - 0.20 * deltaTime * 60);
          player.velocity.y *= Math.max(0.80, 1 - 0.20 * deltaTime * 60);
        }
        break;

      case CrisisArchetype.PSIONIC_SHROUD:
        // Telepathic Input Hysteresis: cyclic gentle horizontal ship wobble (+-10px lateral drift)
        player.position.x += Math.sin(this.attackPhaseTime * 3.2) * 14 * deltaTime;
        player.position.x = Math.max(10, Math.min(this.logicalWidth - player.size.width - 10, player.position.x));
        break;

      case CrisisArchetype.NANITE_HARVESTER:
        // Nanite Screen Erosion: corrosive nanite swarms line outer 15px canvas walls
        if (player.position.x < 15) {
          player.position.x += 35 * deltaTime;
        } else if (player.position.x + player.size.width > this.logicalWidth - 15) {
          player.position.x -= 35 * deltaTime;
        }
        break;

      case CrisisArchetype.COSMIC_DEVOURER:
        // Solar Wind Flare Turbulence: periodic lateral buffeting gusts (+-40px/s)
        const windGust = Math.sin(this.attackPhaseTime * 1.6) * 35 * deltaTime;
        player.position.x += windGust;
        player.position.x = Math.max(10, Math.min(this.logicalWidth - player.size.width - 10, player.position.x));
        break;

      case CrisisArchetype.BIOMORPHIC_SWARM:
        // Bio-Corrosive Spore Creep: descending spore pressure if player pushes into upper screen
        if (player.position.y < 220) {
          player.position.y += 40 * deltaTime;
        }
        break;
    }
  }

  /**
   * Attack Pattern Execution Loop
   */
  private updateCombatAttacks(
    deltaTime: number,
    player: Player,
    bullets: Bullet[],
    soundManager?: SoundManager
  ): void {
    this.attackTimer += deltaTime;
    this.attackPhaseTime += deltaTime;

    const interval = this.phase === CrisisPhase.PHASE_3_CORE ? 1.4 : this.attackCooldown;

    if (this.attackTimer >= interval) {
      this.attackTimer = 0;
      this.executeArchetypeAttack(player, bullets, soundManager);
    }
  }

  /**
   * Execute super-weapons based on current Archetype and Phase
   */
  private executeArchetypeAttack(player: Player, bullets: Bullet[], soundManager?: SoundManager): void {
    if (!this.sovereign || this.sovereign.isDead) return;

    const core = this.sovereign.getCoreCenter();
    const leftMuzzle = this.sovereign.getLeftWeaponMuzzle();
    const rightMuzzle = this.sovereign.getRightWeaponMuzzle();

    switch (this.archetype) {
      case CrisisArchetype.VOID_SOVEREIGN:
        // Void Lance / Dark Matter Beam & Gravitational Pulse
        if (soundManager) soundManager.playDarkMatterBeam();
        
        // 5-way spread dark-matter bolts from core
        const angles = [-0.4, -0.2, 0, 0.2, 0.4];
        for (const ang of angles) {
          const speed = 220;
          const bullet = new Bullet(core.x, core.y, Math.cos(ang) * speed, 1, false);
          bullet.velocity.x = Math.sin(ang) * speed;
          bullet.color = '#c084fc';
          bullet.isInterceptable = true;
          bullets.push(bullet);
        }

        // Flanking wing bolts
        const leftB = new Bullet(leftMuzzle.x, leftMuzzle.y, 250, 1, false);
        leftB.color = '#38bdf8';
        const rightB = new Bullet(rightMuzzle.x, rightMuzzle.y, 250, 1, false);
        rightB.color = '#38bdf8';
        bullets.push(leftB, rightB);
        break;

      case CrisisArchetype.ABYSSAL_LEVIATHAN:
        // Spore Spiral & Acidic Barrage
        if (soundManager) soundManager.playAcidStormSound();
        
        // Spiral spore emission
        const numSpores = 6;
        for (let i = 0; i < numSpores; i++) {
          const baseAng = this.attackPhaseTime * 2.0 + (i * Math.PI * 2) / numSpores;
          const speed = 190;
          const b = new Bullet(core.x, core.y, Math.sin(baseAng) * speed, 1, false);
          b.velocity.x = Math.cos(baseAng) * speed;
          b.color = '#84cc16';
          b.isInterceptable = true;
          bullets.push(b);
        }
        break;

      case CrisisArchetype.CYBERNETIC_EXTERMINATOR:
        // Dual Railguns & EMP Disruption Cascade
        if (soundManager) soundManager.playRogueShoot();
        
        // High-velocity direct railgun beams from left & right sponsons
        const rail1 = new Bullet(leftMuzzle.x, leftMuzzle.y, 380, 2, false);
        rail1.color = '#ef4444';
        const rail2 = new Bullet(rightMuzzle.x, rightMuzzle.y, 380, 2, false);
        rail2.color = '#ef4444';
        
        // Aimed center cluster shot
        const pCenterX = player ? player.position.x + player.size.width / 2 : this.logicalWidth / 2;
        const pCenterY = player ? player.position.y + player.size.height / 2 : this.logicalHeight - 50;
        const aimDx = pCenterX - core.x;
        const aimDy = pCenterY - core.y;
        const aimDist = Math.sqrt(aimDx * aimDx + aimDy * aimDy) || 1;
        
        const aimedB = new Bullet(core.x, core.y, (aimDy / aimDist) * 280, 1, false);
        aimedB.velocity.x = (aimDx / aimDist) * 280;
        aimedB.color = '#06b6d4';
        aimedB.isInterceptable = true;
        
        bullets.push(rail1, rail2, aimedB);
        break;

      case CrisisArchetype.CHRONO_DEVOURER:
        // Tachyon Lance Fan, Paradox Temporal Echo, or Phase 3 Chrono-Implosion
        if (soundManager) soundManager.playDarkMatterBeam();

        if (this.phase === CrisisPhase.PHASE_3_CORE) {
          // Singularity Core Overdrive: 8-way omnidirectional tachyon starburst
          const numNeedles = 8;
          for (let i = 0; i < numNeedles; i++) {
            const ang = (i * Math.PI * 2) / numNeedles + this.attackPhaseTime;
            const speed = 260;
            const needle = new Bullet(core.x, core.y, Math.sin(ang) * speed, 1, false);
            needle.velocity.x = Math.cos(ang) * speed;
            needle.color = '#fbbf24';
            needle.isInterceptable = true;
            bullets.push(needle);
          }
        } else {
          // Phase 2: Alternates between Tachyon Lance Fan and Paradox Temporal Burst
          const isLance = Math.floor(this.attackPhaseTime / 2.2) % 2 === 0;
          if (isLance) {
            // Tachyon Lance: 5 needle-thin high-velocity bolts
            const lanceAngles = [-0.3, -0.15, 0, 0.15, 0.3];
            for (const ang of lanceAngles) {
              const speed = 380;
              const lance = new Bullet(core.x, core.y, Math.cos(ang) * speed, 1, false);
              lance.velocity.x = Math.sin(ang) * speed;
              lance.color = '#fbbf24';
              lance.isInterceptable = true;
              bullets.push(lance);
            }
          } else {
            // Temporal Burst: delayed chronal echo bolts from wings + central paradox bolt
            const leftEcho = new Bullet(leftMuzzle.x, leftMuzzle.y, 280, 1, false);
            leftEcho.color = '#f59e0b';
            leftEcho.isInterceptable = true;
            const rightEcho = new Bullet(rightMuzzle.x, rightMuzzle.y, 280, 1, false);
            rightEcho.color = '#f59e0b';
            rightEcho.isInterceptable = true;
            const centerParadox = new Bullet(core.x, core.y, 320, 1, false);
            centerParadox.color = '#fef08a';
            centerParadox.isInterceptable = true;
            bullets.push(leftEcho, rightEcho, centerParadox);
          }
        }
        break;

      case CrisisArchetype.SOLARIS_COLOSSUS:
        // Coronal Mass Ejection, Prominence Sweep, or Phase 3 Solar Supernova
        if (soundManager) soundManager.playAcidStormSound();

        if (this.phase === CrisisPhase.PHASE_3_CORE) {
          // Supernova Fusion Overdrive: 10-way rotating starburst
          const numFlares = 10;
          for (let i = 0; i < numFlares; i++) {
            const ang = (i * Math.PI * 2) / numFlares + this.attackPhaseTime * 1.5;
            const speed = 240;
            const flare = new Bullet(core.x, core.y, Math.sin(ang) * speed, 2, false);
            flare.velocity.x = Math.cos(ang) * speed;
            flare.color = '#fef08a';
            flare.isInterceptable = true;
            bullets.push(flare);
          }
        } else {
          // Phase 2: Alternates between Coronal Mass Ejection and Prominence Sweep
          const isCME = Math.floor(this.attackPhaseTime / 2.2) % 2 === 0;
          if (isCME) {
            // 3 heavy superheated plasma fireballs
            const cmeAngles = [-0.25, 0, 0.25];
            for (const ang of cmeAngles) {
              const speed = 220;
              const fireball = new Bullet(core.x, core.y, Math.cos(ang) * speed, 2, false);
              fireball.velocity.x = Math.sin(ang) * speed;
              fireball.color = '#f97316';
              fireball.isInterceptable = true;
              bullets.push(fireball);
            }
          } else {
            // Prominence Sweep: dual heavy solar beams from wings + center spark
            const beamLeft = new Bullet(leftMuzzle.x, leftMuzzle.y, 350, 2, false);
            beamLeft.color = '#ef4444';
            beamLeft.isInterceptable = true;
            const beamRight = new Bullet(rightMuzzle.x, rightMuzzle.y, 350, 2, false);
            beamRight.color = '#ef4444';
            beamRight.isInterceptable = true;
            const spark = new Bullet(core.x, core.y, 260, 1, false);
            spark.color = '#fef08a';
            spark.isInterceptable = true;
            bullets.push(beamLeft, beamRight, spark);
          }
        }
        break;

      case CrisisArchetype.NEBULA_PHANTASM:
        // Quantum Mirage Nova, Spectral Homing Wisps, or Phase 3 Dimensional Shroud
        if (soundManager) soundManager.playDarkMatterBeam();

        if (this.phase === CrisisPhase.PHASE_3_CORE) {
          // Dimensional Shroud Overdrive: 12-way expanding quantum nebula curtain
          const numWisps = 12;
          for (let i = 0; i < numWisps; i++) {
            const ang = (i * Math.PI * 2) / numWisps + Math.sin(this.attackPhaseTime * 2) * 0.4;
            const speed = 200;
            const wisp = new Bullet(core.x, core.y, Math.sin(ang) * speed, 1, false);
            wisp.velocity.x = Math.cos(ang) * speed;
            wisp.color = i % 2 === 0 ? '#d946ef' : '#6366f1';
            wisp.isInterceptable = true;
            bullets.push(wisp);
          }
        } else {
          // Phase 2: Alternates between Quantum Mirage Nova and Spectral Homing Wisps
          const isNova = Math.floor(this.attackPhaseTime / 2.2) % 2 === 0;
          if (isNova) {
            // Quantum Mirage Nova: 6 criss-cross needles
            const angles = [-0.4, -0.24, -0.08, 0.08, 0.24, 0.4];
            for (let i = 0; i < angles.length; i++) {
              const ang = angles[i];
              const speed = 250;
              const needle = new Bullet(core.x, core.y, Math.cos(ang) * speed, 1, false);
              needle.velocity.x = Math.sin(ang) * speed;
              needle.color = i % 2 === 0 ? '#6366f1' : '#06b6d4';
              needle.isInterceptable = true;
              bullets.push(needle);
            }
          } else {
            // Spectral Homing Wisps: 4 wisps aimed towards player
            const pX = player ? player.position.x + player.size.width / 2 : this.logicalWidth / 2;
            const pY = player ? player.position.y : this.logicalHeight - 50;
            const dx = pX - core.x;
            const dy = pY - core.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            for (let i = 0; i < 4; i++) {
              const offsetAngle = (i - 1.5) * 0.18;
              const speed = 160;
              const wisp = new Bullet(core.x, core.y, (dy / dist) * speed, 1, false);
              wisp.velocity.x = (dx / dist) * speed + Math.sin(offsetAngle) * 80;
              wisp.color = i % 2 === 0 ? '#06b6d4' : '#d946ef';
              wisp.isInterceptable = true;
              bullets.push(wisp);
            }
          }
        }
        break;

      case CrisisArchetype.BIOMORPHIC_SWARM:
        // Corrosive Bile Barrage, Mandible Ripper Volley, or Phase 3 Swarm Infestation
        if (soundManager) soundManager.playAcidStormSound();

        if (this.phase === CrisisPhase.PHASE_3_CORE) {
          // Extragalactic Swarm Infestation: 14-way spiraling bio-plasmid helix
          const numSpores = 14;
          for (let i = 0; i < numSpores; i++) {
            const ang = (i * Math.PI * 2) / numSpores + this.attackPhaseTime * 2.0;
            const speed = 220;
            const b = new Bullet(core.x, core.y, Math.sin(ang) * speed, 1, false);
            b.velocity.x = Math.cos(ang) * speed;
            b.color = i % 2 === 0 ? '#84cc16' : '#f59e0b';
            b.isInterceptable = true;
            bullets.push(b);
          }
        } else {
          // Phase 2: Alternates between Corrosive Bile Barrage and Mandible Ripper Volley
          const isBile = Math.floor(this.attackPhaseTime / 2.2) % 2 === 0;
          if (isBile) {
            // Corrosive Bile Barrage: 7 bio-globules in wide arc
            const angles = [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45];
            for (const ang of angles) {
              const speed = 240;
              const bile = new Bullet(core.x, core.y, Math.cos(ang) * speed, 1, false);
              bile.velocity.x = Math.sin(ang) * speed;
              bile.color = '#84cc16';
              bile.isInterceptable = true;
              bullets.push(bile);
            }
          } else {
            // Mandible Ripper Volley: high-speed chitin spikes from left and right mandibles + center
            const leftSpike = new Bullet(leftMuzzle.x, leftMuzzle.y, 360, 2, false);
            leftSpike.color = '#b91c1c';
            leftSpike.isInterceptable = true;
            const rightSpike = new Bullet(rightMuzzle.x, rightMuzzle.y, 360, 2, false);
            rightSpike.color = '#b91c1c';
            rightSpike.isInterceptable = true;
            const centerChitin = new Bullet(core.x, core.y, 300, 1, false);
            centerChitin.color = '#f59e0b';
            centerChitin.isInterceptable = true;
            bullets.push(leftSpike, rightSpike, centerChitin);
          }
        }
        break;

      case CrisisArchetype.SINGULARITY_CORE:
        // Hawking Radiation Lance, Relativistic Jet Flares, or Phase 3 Event Horizon Implosion
        if (soundManager) soundManager.playDarkMatterBeam();

        if (this.phase === CrisisPhase.PHASE_3_CORE) {
          // Event Horizon Gravitational Implosion: 16-way Hawking Nova
          const numBolts = 16;
          for (let i = 0; i < numBolts; i++) {
            const ang = (i * Math.PI * 2) / numBolts + this.attackPhaseTime * 1.8;
            const speed = 240;
            const bolt = new Bullet(core.x, core.y, Math.sin(ang) * speed, 2, false);
            bolt.velocity.x = Math.cos(ang) * speed;
            bolt.color = i % 2 === 0 ? '#ffffff' : '#8b5cf6';
            bolt.isInterceptable = true;
            bullets.push(bolt);
          }
        } else {
          // Phase 2: Alternates between Hawking Radiation Lance and Relativistic Jet Flares
          const isLance = Math.floor(this.attackPhaseTime / 2.0) % 2 === 0;
          if (isLance) {
            // Hawking Radiation Lance: focused high-velocity beam sweeping +-20 degrees
            const sweep = Math.sin(this.attackPhaseTime * 3) * 0.35;
            for (let s = -1; s <= 1; s++) {
              const ang = sweep + s * 0.08;
              const speed = 420;
              const lance = new Bullet(core.x, core.y, Math.cos(ang) * speed, 2, false);
              lance.velocity.x = Math.sin(ang) * speed;
              lance.color = s === 0 ? '#ffffff' : '#8b5cf6';
              lance.isInterceptable = true;
              bullets.push(lance);
            }
          } else {
            // Relativistic Jet Flares: twin diagonal plasma jets at 45 degree angles (scissor crossfire)
            const speed = 320;
            const jetLeft = new Bullet(leftMuzzle.x, leftMuzzle.y, Math.cos(Math.PI / 4) * speed, 2, false);
            jetLeft.velocity.x = -Math.sin(Math.PI / 4) * speed;
            jetLeft.color = '#8b5cf6';
            jetLeft.isInterceptable = true;

            const jetRight = new Bullet(rightMuzzle.x, rightMuzzle.y, Math.cos(Math.PI / 4) * speed, 2, false);
            jetRight.velocity.x = Math.sin(Math.PI / 4) * speed;
            jetRight.color = '#8b5cf6';
            jetRight.isInterceptable = true;

            const centerPulse = new Bullet(core.x, core.y, 250, 1, false);
            centerPulse.color = '#ffffff';
            centerPulse.isInterceptable = true;

            bullets.push(jetLeft, jetRight, centerPulse);
          }
        }
        break;

      case CrisisArchetype.NANITE_HARVESTER:
        // Molecular Disassembly Ray, Subatomic Nanite Flak, or Phase 3 Grey Singularity Storm
        if (soundManager) soundManager.playRogueShoot();

        if (this.phase === CrisisPhase.PHASE_3_CORE) {
          // Grey Singularity Storm: 16-way radial nanite storm
          const numNanites = 16;
          for (let i = 0; i < numNanites; i++) {
            const ang = (i * Math.PI * 2) / numNanites + this.attackPhaseTime * 1.4;
            const speed = 230;
            const nanite = new Bullet(core.x, core.y, Math.sin(ang) * speed, 1, false);
            nanite.velocity.x = Math.cos(ang) * speed;
            nanite.color = i % 2 === 0 ? '#14b8a6' : '#06b6d4';
            nanite.isInterceptable = true;
            bullets.push(nanite);
          }
        } else {
          // Phase 2: Alternates between Molecular Disassembly Ray and Sub-Atomic Nanite Flak
          const isRay = Math.floor(this.attackPhaseTime / 2.0) % 2 === 0;
          if (isRay) {
            // Molecular Disassembly Ray: 3 parallel high-velocity teal beams
            const leftRay = new Bullet(leftMuzzle.x, leftMuzzle.y, 390, 2, false);
            leftRay.color = '#06b6d4';
            leftRay.isInterceptable = true;
            const centerRay = new Bullet(core.x, core.y, 390, 2, false);
            centerRay.color = '#14b8a6';
            centerRay.isInterceptable = true;
            const rightRay = new Bullet(rightMuzzle.x, rightMuzzle.y, 390, 2, false);
            rightRay.color = '#06b6d4';
            rightRay.isInterceptable = true;
            bullets.push(leftRay, centerRay, rightRay);
          } else {
            // Sub-Atomic Nanite Flak: 12 splinter shards expanding radially in hexagonal lattice
            const numShards = 12;
            for (let i = 0; i < numShards; i++) {
              const ang = (i * Math.PI * 2) / numShards;
              const speed = 220;
              const shard = new Bullet(core.x, core.y, Math.sin(ang) * speed, 1, false);
              shard.velocity.x = Math.cos(ang) * speed;
              shard.color = i % 2 === 0 ? '#94a3b8' : '#14b8a6';
              shard.isInterceptable = true;
              bullets.push(shard);
            }
          }
        }
        break;

      case CrisisArchetype.PSIONIC_SHROUD:
        // Mind-Flay Lance, Telekinetic Dagger Helix, or Phase 3 Shroud Apocalypse Inversion
        if (soundManager) soundManager.playDarkMatterBeam();

        if (this.phase === CrisisPhase.PHASE_3_CORE) {
          // Shroud Apocalypse Inversion: 12-way star of psychic terror spheres
          const numSpheres = 12;
          for (let i = 0; i < numSpheres; i++) {
            const ang = (i * Math.PI * 2) / numSpheres + Math.sin(this.attackPhaseTime * 2.5) * 0.5;
            const speed = 210;
            const sphere = new Bullet(core.x, core.y, Math.sin(ang) * speed, 2, false);
            sphere.velocity.x = Math.cos(ang) * speed;
            sphere.color = i % 2 === 0 ? '#fb7185' : '#7c3aed';
            sphere.isInterceptable = true;
            bullets.push(sphere);
          }
        } else {
          // Phase 2: Alternates between Mind-Flay Lance and Telekinetic Dagger Helix
          const isLance = Math.floor(this.attackPhaseTime / 2.0) % 2 === 0;
          if (isLance) {
            // Mind-Flay Lance: high-velocity piercing beam targeted at player position
            const pX = player ? player.position.x + player.size.width / 2 : this.logicalWidth / 2;
            const pY = player ? player.position.y : this.logicalHeight - 50;
            const dx = pX - core.x;
            const dy = pY - core.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const speed = 440;
            const lance = new Bullet(core.x, core.y, (dy / dist) * speed, 2, false);
            lance.velocity.x = (dx / dist) * speed;
            lance.color = '#d946ef';
            lance.isInterceptable = true;
            bullets.push(lance);
          } else {
            // Telekinetic Dagger Helix: 8 psychic blades swirling in double-helix spiral
            for (let i = 0; i < 8; i++) {
              const offsetAngle = (i - 3.5) * 0.15;
              const speed = 220;
              const dagger = new Bullet(core.x, core.y, Math.cos(offsetAngle) * speed, 1, false);
              dagger.velocity.x = Math.sin(offsetAngle) * speed + Math.sin(this.attackPhaseTime * 4 + i) * 60;
              dagger.color = i % 2 === 0 ? '#7c3aed' : '#fb7185';
              dagger.isInterceptable = true;
              bullets.push(dagger);
            }
          }
        }
        break;

      case CrisisArchetype.GLACIAL_OBLIVION:
        // Sub-Zero Icicle Volley, Cryo-Thermal Drain, or Phase 3 Blizzard Deep Freeze
        if (soundManager) soundManager.playAcidStormSound();

        if (this.phase === CrisisPhase.PHASE_3_CORE) {
          // Blizzard Deep Freeze: 14-way blizzard starburst of snowflake clusters
          const numFlakes = 14;
          for (let i = 0; i < numFlakes; i++) {
            const ang = (i * Math.PI * 2) / numFlakes + this.attackPhaseTime * 1.6;
            const speed = 230;
            const flake = new Bullet(core.x, core.y, Math.sin(ang) * speed, 1, false);
            flake.velocity.x = Math.cos(ang) * speed;
            flake.color = i % 2 === 0 ? '#22d3ee' : '#f0f9ff';
            flake.isInterceptable = true;
            bullets.push(flake);
          }
        } else {
          // Phase 2: Alternates between Sub-Zero Icicle Volley and Cryo-Thermal Drain
          const isIcicle = Math.floor(this.attackPhaseTime / 2.0) % 2 === 0;
          if (isIcicle) {
            // Sub-Zero Icicle Volley: 8 crystalline icicle darts forming and falling in cascade
            for (let i = 0; i < 8; i++) {
              const spawnX = this.logicalWidth * 0.15 + (i / 7) * (this.logicalWidth * 0.7);
              const speed = 310;
              const icicle = new Bullet(spawnX, core.y + 20, speed, 1, false);
              icicle.velocity.x = (Math.random() - 0.5) * 40;
              icicle.color = '#f0f9ff';
              icicle.isInterceptable = true;
              bullets.push(icicle);
            }
          } else {
            // Cryo-Thermal Drain: twin cryogenic beams from wingtips + central freeze lance
            const beamLeft = new Bullet(leftMuzzle.x, leftMuzzle.y, 360, 2, false);
            beamLeft.color = '#22d3ee';
            beamLeft.isInterceptable = true;
            const beamRight = new Bullet(rightMuzzle.x, rightMuzzle.y, 360, 2, false);
            beamRight.color = '#22d3ee';
            beamRight.isInterceptable = true;
            const centerFreeze = new Bullet(core.x, core.y, 300, 1, false);
            centerFreeze.color = '#38bdf8';
            centerFreeze.isInterceptable = true;
            bullets.push(beamLeft, beamRight, centerFreeze);
          }
        }
        break;

      case CrisisArchetype.COSMIC_DEVOURER:
        // Supernova Breath Beam, Astral Scale Scatter, or Phase 3 Star-Devouring Extinction
        if (soundManager) soundManager.playDarkMatterBeam();

        if (this.phase === CrisisPhase.PHASE_3_CORE) {
          // Star-Devouring Extinction: 16-way solar flare corona + aimed dragon breath fireball
          const numFlares = 16;
          for (let i = 0; i < numFlares; i++) {
            const ang = (i * Math.PI * 2) / numFlares + this.attackPhaseTime * 1.5;
            const speed = 250;
            const flare = new Bullet(core.x, core.y, Math.sin(ang) * speed, 2, false);
            flare.velocity.x = Math.cos(ang) * speed;
            flare.color = i % 2 === 0 ? '#dc2626' : '#facc15';
            flare.isInterceptable = true;
            bullets.push(flare);
          }

          // Aimed dragon breath fireball
          const pX = player ? player.position.x + player.size.width / 2 : this.logicalWidth / 2;
          const pY = player ? player.position.y : this.logicalHeight - 50;
          const dx = pX - core.x;
          const dy = pY - core.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const speed = 370;
          const breath = new Bullet(core.x, core.y, (dy / dist) * speed, 2, false);
          breath.velocity.x = (dx / dist) * speed;
          breath.color = '#facc15';
          breath.isInterceptable = true;
          bullets.push(breath);
        } else {
          // Phase 2: Alternates between Supernova Breath Beam and Astral Scale Scatter
          const isBreath = Math.floor(this.attackPhaseTime / 2.0) % 2 === 0;
          if (isBreath) {
            // Supernova Breath Beam: 5 heavy fireballs in forward 50-degree cone
            const breathAngles = [-0.4, -0.2, 0, 0.2, 0.4];
            for (const ang of breathAngles) {
              const speed = 360;
              const fireball = new Bullet(core.x, core.y, Math.cos(ang) * speed, 2, false);
              fireball.velocity.x = Math.sin(ang) * speed;
              fireball.color = Math.abs(ang) < 0.1 ? '#facc15' : '#dc2626';
              fireball.isInterceptable = true;
              bullets.push(fireball);
            }
          } else {
            // Astral Scale Scatter: 10 burning dragon scales drifting downward in criss-cross arcs
            for (let i = 0; i < 10; i++) {
              const startX = i % 2 === 0 ? leftMuzzle.x : rightMuzzle.x;
              const startY = i % 2 === 0 ? leftMuzzle.y : rightMuzzle.y;
              const ang = (i - 4.5) * 0.12;
              const speed = 200;
              const scale = new Bullet(startX, startY, Math.cos(ang) * speed, 1, false);
              scale.velocity.x = Math.sin(ang) * speed + (i % 2 === 0 ? -40 : 40);
              scale.color = '#d97706';
              scale.isInterceptable = true;
              bullets.push(scale);
            }
          }
        }
        break;
    }
  }

  /**
   * Handle Bullet Collision with Crisis Entities
   */
  public handleBulletCollision(bullet: Bullet, onScoreAdd?: (pts: number) => void): boolean {
    if (!this.isActive || bullet.faction !== Faction.PLAYER || bullet.isDead) {
      return false;
    }

    // 1. Check Collision against Dimensional Rifts
    for (const rift of this.riftAnchors) {
      if (!rift.isDead && rift.checkCollision(bullet)) {
        const damageDealt = rift.takeDamage(bullet.damage, bullet.piercing);
        bullet.hitEntities.add(rift);
        
        if (bullet.piercing <= 1) {
          bullet.isDead = true;
        }

        if (onScoreAdd && damageDealt > 0) {
          onScoreAdd(damageDealt * 10);
        }

        // If all rifts are destroyed in Phase 1, immediately collapse shields and transition to Phase 2
        if (this.phase === CrisisPhase.PHASE_1_SHIELD) {
          const anyRiftAlive = this.riftAnchors.some(r => !r.isDead);
          if (!anyRiftAlive) {
            this.transitionToPhase(CrisisPhase.PHASE_2_HULL);
          }
        }

        return true;
      }
    }

    // 2. Check Collision against Sovereign
    if (this.sovereign && !this.sovereign.isDead && this.sovereign.checkCollision(bullet)) {
      if (this.phase === CrisisPhase.PHASE_1_SHIELD) {
        // Shielded: deflect projectile
        this.sovereign.takeDamage(0); // Trigger shield flash
        bullet.isDead = true;
        return true;
      }

      const damageDealt = this.sovereign.takeDamage(bullet.damage, bullet.piercing);
      bullet.hitEntities.add(this.sovereign);
      
      if (bullet.piercing <= 1) {
        bullet.isDead = true;
      }

      if (onScoreAdd && damageDealt > 0) {
        onScoreAdd(damageDealt * 15);
      }

      if (this.sovereign.phase !== this.phase) {
        this.transitionToPhase(this.sovereign.phase);
      }

      return true;
    }

    return false;
  }

  /**
   * Spawn Cataclysm Explosion Particles
   */
  private spawnCataclysmExplosion(center: Vector2D, particles: Particle[]): void {
    for (let i = 0; i < 40; i++) {
      const colors = ['#ffffff', '#c084fc', '#38bdf8', '#ef4444', '#f59e0b'];
      const col = colors[Math.floor(Math.random() * colors.length)];
      const p = new Particle(center.x, center.y, col, 2.0);
      particles.push(p);
    }
  }

  /**
   * Render all Crisis Entities & Visuals
   */
  public draw(ctx: CanvasRenderingContext2D, screenWidth: number = this.logicalWidth, screenHeight: number = this.logicalHeight): void {
    if (!this.isActive) return;

    ctx.save();

    // 1. Incursion Warning Screen Glitch / Chromatic Distortion
    if (this.phase === CrisisPhase.INCURSION) {
      this.drawIncursionWarningBanner(ctx, screenWidth, screenHeight);
    }

    // 2. Draw Dimensional Rifts
    for (const rift of this.riftAnchors) {
      rift.draw(ctx);
    }

    // 3. Draw Sovereign Entity
    if (this.sovereign) {
      this.sovereign.draw(ctx);
      this.sovereign.drawBossHUD(ctx, screenWidth);
    }

    // 4. Alert Banner Toast
    if (this.bannerText && this.phase !== CrisisPhase.INCURSION) {
      this.drawBannerToast(ctx, screenWidth);
    }

    ctx.restore();
  }

  private drawIncursionWarningBanner(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const pulse = (Math.sin(this.warningTimer * 8) + 1) / 2;
    
    // Vignette
    const vig = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, height * 0.7);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, `rgba(147, 51, 234, ${0.4 * pulse})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    // Warning Banner in Screen Center
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, height / 2 - 45, width, 90);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, height / 2 - 45, width, 90);

    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f87171';
    ctx.fillText('⚠ INCOMING END-GAME CRISIS ⚠', width / 2, height / 2 - 15);

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.bannerText || 'DIMENSIONAL INCURSION IMMINENT', width / 2, height / 2 + 12);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(`WARP CONVERGENCE IN: ${this.warningTimer.toFixed(1)}s`, width / 2, height / 2 + 30);
    ctx.restore();
  }

  private drawBannerToast(ctx: CanvasRenderingContext2D, width: number): void {
    ctx.save();
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(width / 2 - 180, 58, 360, 20);
    
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
    ctx.strokeRect(width / 2 - 180, 58, 360, 20);

    ctx.fillStyle = '#c084fc';
    ctx.fillText(this.bannerText || '', width / 2, 72);
    ctx.restore();
  }

  /**
   * Return full snapshot state
   */
  public getState(): EndGameCrisisState {
    const hullHp = this.sovereign ? this.sovereign.hullHp : 0;
    const coreHp = this.sovereign ? this.sovereign.coreHp : 0;
    const totalHp = hullHp + coreHp;
    const maxHp = (this.sovereign ? this.sovereign.maxHullHp + this.sovereign.maxCoreHp : 4000);

    return {
      isActive: this.isActive,
      archetype: this.archetype,
      phase: this.phase,
      warningTimer: this.warningTimer,
      totalHp,
      maxHp,
      enrageTimer: this.sovereign ? this.sovereign.enrageTimer : 35,
      enrageMaxTime: this.sovereign ? this.sovereign.enrageMaxTime : 35,
      riftAnchors: this.riftAnchors,
      mainBody: this.sovereign,
      bannerText: this.bannerText,
      vortexPullIntensity: this.vortexPullIntensity,
      realityDistortion: this.realityDistortion,
      shieldIntegrity: this.phase === CrisisPhase.PHASE_1_SHIELD ? 1.0 : 0,
      activeAttack: this.activeAttack,
    };
  }

  public getRifts(): DimensionalRift[] {
    return this.riftAnchors;
  }

  public getRiftAnchors(): DimensionalRift[] {
    return this.riftAnchors;
  }

  public getMainBody(): CrisisSovereign | null {
    return this.sovereign;
  }

  public getActiveColliders(): (DimensionalRift | CrisisSovereign)[] {
    const colliders: (DimensionalRift | CrisisSovereign)[] = [];
    for (const r of this.riftAnchors) {
      if (!r.isDead) colliders.push(r);
    }
    if (this.sovereign && !this.sovereign.isDead) {
      colliders.push(this.sovereign);
    }
    return colliders;
  }

  public isCrisisActive(): boolean {
    return this.isActive && this.phase !== CrisisPhase.DEFEATED;
  }

  public isDefeated(): boolean {
    return this.phase === CrisisPhase.DEFEATED;
  }
}

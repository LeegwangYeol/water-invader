// ============================================================================
// WATER INVADER: MODULAR SUBMERSIBLE CHASSIS & DEEP-SEA HANGAR SYSTEM
// ============================================================================

import {
  IChassisManager,
  ChassisId,
  ChassisDefinition,
  ChassisRadarStats,
  DamageMitigationResult,
  FlagshipUpdateContext,
} from '../types';
import { Player } from '../../Player';
import { Enemy } from '../../Enemy';
import { Bullet } from '../../Bullet';
import { Entity } from '../../Entity';
import { Vector2D } from '../../types';
import { ChassisRadarChart, RadarChartOptions } from './ChassisRadarChart';

// ----------------------------------------------------------------------------
// Hardpoint Slot Types & Specifications
// ----------------------------------------------------------------------------

export enum HardpointSlotType {
  CENTERLINE = 'CENTERLINE',
  PORT_BROADSIDE = 'PORT_BROADSIDE',
  STARBOARD_BROADSIDE = 'STARBOARD_BROADSIDE',
  WINGTIP_PORT = 'WINGTIP_PORT',
  WINGTIP_STARBOARD = 'WINGTIP_STARBOARD',
  DORSAL_TURRET = 'DORSAL_TURRET',
  BIO_TENTACLE_NODE = 'BIO_TENTACLE_NODE',
  MINING_DREDGE_SCOOP = 'MINING_DREDGE_SCOOP',
  CONCEALED_BAY = 'CONCEALED_BAY',
}

export interface HardpointSlot {
  id: string;
  type: HardpointSlotType;
  relativeOffset: Vector2D; // Relative to player center (0,0)
  nameEn: string;
  nameKo: string;
  weaponCompatibility: string[];
}

export interface ChassisHardpointProfile {
  chassisId: ChassisId;
  slots: HardpointSlot[];
}

export const CHASSIS_HARDPOINT_CONFIGS: Record<ChassisId, ChassisHardpointProfile> = {
  [ChassisId.NAUTILUS]: {
    chassisId: ChassisId.NAUTILUS,
    slots: [
      {
        id: 'nautilus_port_sponson',
        type: HardpointSlotType.PORT_BROADSIDE,
        relativeOffset: { x: -28, y: 0 },
        nameEn: 'Port Heavy Sponson',
        nameKo: '좌현 중장갑 포대',
        weaponCompatibility: ['TORPEDO', 'KINETIC_CANNON', 'HARPOON'],
      },
      {
        id: 'nautilus_starboard_sponson',
        type: HardpointSlotType.STARBOARD_BROADSIDE,
        relativeOffset: { x: 28, y: 0 },
        nameEn: 'Starboard Heavy Sponson',
        nameKo: '우현 중장갑 포대',
        weaponCompatibility: ['TORPEDO', 'KINETIC_CANNON', 'HARPOON'],
      },
      {
        id: 'nautilus_dorsal_turret',
        type: HardpointSlotType.DORSAL_TURRET,
        relativeOffset: { x: 0, y: -16 },
        nameEn: 'Dorsal Twin Cannon',
        nameKo: '상부 연장포 탑재구',
        weaponCompatibility: ['KINETIC_CANNON', 'LASER', 'MISSILE'],
      },
      {
        id: 'nautilus_prow_ram',
        type: HardpointSlotType.CENTERLINE,
        relativeOffset: { x: 0, y: -24 },
        nameEn: 'Reinforced Prow Ram',
        nameKo: '강화 충각 선수',
        weaponCompatibility: ['HARPOON', 'DEFENSE_RAM'],
      },
    ],
  },
  [ChassisId.STINGRAY]: {
    chassisId: ChassisId.STINGRAY,
    slots: [
      {
        id: 'stingray_spinal_mount',
        type: HardpointSlotType.CENTERLINE,
        relativeOffset: { x: 0, y: -18 },
        nameEn: 'Spinal Supercavitation Rail',
        nameKo: '선체 중심 초공동 레일',
        weaponCompatibility: ['LASER', 'TORPEDO', 'RAILGUN'],
      },
      {
        id: 'stingray_wing_port',
        type: HardpointSlotType.WINGTIP_PORT,
        relativeOffset: { x: -20, y: 8 },
        nameEn: 'Port Interceptor Pylon',
        nameKo: '좌현 요격 파일런',
        weaponCompatibility: ['MISSILE', 'DRONE'],
      },
      {
        id: 'stingray_wing_starboard',
        type: HardpointSlotType.WINGTIP_STARBOARD,
        relativeOffset: { x: 20, y: 8 },
        nameEn: 'Starboard Interceptor Pylon',
        nameKo: '우현 요격 파일런',
        weaponCompatibility: ['MISSILE', 'DRONE'],
      },
    ],
  },
  [ChassisId.KRAKEN]: {
    chassisId: ChassisId.KRAKEN,
    slots: [
      {
        id: 'kraken_tentacle_port',
        type: HardpointSlotType.BIO_TENTACLE_NODE,
        relativeOffset: { x: -22, y: 10 },
        nameEn: 'Symbiont Tentacle Lash (Port)',
        nameKo: '좌현 공생 촉수 줄기',
        weaponCompatibility: ['BIO_TENTACLE', 'HARPOON'],
      },
      {
        id: 'kraken_tentacle_starboard',
        type: HardpointSlotType.BIO_TENTACLE_NODE,
        relativeOffset: { x: 22, y: 10 },
        nameEn: 'Symbiont Tentacle Lash (Stbd)',
        nameKo: '우현 공생 촉수 줄기',
        weaponCompatibility: ['BIO_TENTACLE', 'HARPOON'],
      },
      {
        id: 'kraken_bio_maw',
        type: HardpointSlotType.CENTERLINE,
        relativeOffset: { x: 0, y: -16 },
        nameEn: 'Acidic Bio-Maw Siphon',
        nameKo: '생체 산성 분출구',
        weaponCompatibility: ['ACID_LANCE', 'BIO_SPORE', 'LASER'],
      },
      {
        id: 'kraken_ink_bladder',
        type: HardpointSlotType.DORSAL_TURRET,
        relativeOffset: { x: 0, y: 0 },
        nameEn: 'Bioluminescent Ink Bladder',
        nameKo: '발광 먹물 방어낭',
        weaponCompatibility: ['INK_CLOUD', 'CHAFF'],
      },
    ],
  },
  [ChassisId.LEVIATHAN]: {
    chassisId: ChassisId.LEVIATHAN,
    slots: [
      {
        id: 'leviathan_dredge_port',
        type: HardpointSlotType.MINING_DREDGE_SCOOP,
        relativeOffset: { x: -24, y: -12 },
        nameEn: 'Hydro-Dredge Scoop Alpha',
        nameKo: '좌현 심해 준설 흡입구',
        weaponCompatibility: ['SALVAGE_MAGNET', 'MINING_DRILL'],
      },
      {
        id: 'leviathan_dredge_starboard',
        type: HardpointSlotType.MINING_DREDGE_SCOOP,
        relativeOffset: { x: 24, y: -12 },
        nameEn: 'Hydro-Dredge Scoop Beta',
        nameKo: '우현 심해 준설 흡입구',
        weaponCompatibility: ['SALVAGE_MAGNET', 'MINING_DRILL'],
      },
      {
        id: 'leviathan_slurry_cannon',
        type: HardpointSlotType.CENTERLINE,
        relativeOffset: { x: 0, y: -20 },
        nameEn: 'Heavy Slurry Compression Cannon',
        nameKo: '중압축 슬러리 주포',
        weaponCompatibility: ['KINETIC_CANNON', 'TORPEDO'],
      },
      {
        id: 'leviathan_sponson_port',
        type: HardpointSlotType.PORT_BROADSIDE,
        relativeOffset: { x: -26, y: 12 },
        nameEn: 'Resource Processing Sponson (Port)',
        nameKo: '좌현 자원 정제소',
        weaponCompatibility: ['PROCESSING_CORE'],
      },
      {
        id: 'leviathan_sponson_starboard',
        type: HardpointSlotType.STARBOARD_BROADSIDE,
        relativeOffset: { x: 26, y: 12 },
        nameEn: 'Resource Processing Sponson (Stbd)',
        nameKo: '우현 자원 정제소',
        weaponCompatibility: ['PROCESSING_CORE'],
      },
    ],
  },
  [ChassisId.GHOST]: {
    chassisId: ChassisId.GHOST,
    slots: [
      {
        id: 'ghost_concealed_port',
        type: HardpointSlotType.CONCEALED_BAY,
        relativeOffset: { x: -16, y: -6 },
        nameEn: 'Internal Silent Bay Alpha',
        nameKo: '좌현 내장식 무소음 런처',
        weaponCompatibility: ['STEALTH_TORPEDO', 'MISSILE'],
      },
      {
        id: 'ghost_concealed_starboard',
        type: HardpointSlotType.CONCEALED_BAY,
        relativeOffset: { x: 16, y: -6 },
        nameEn: 'Internal Silent Bay Beta',
        nameKo: '우현 내장식 무소음 런처',
        weaponCompatibility: ['STEALTH_TORPEDO', 'MISSILE'],
      },
      {
        id: 'ghost_cloak_emitter',
        type: HardpointSlotType.CENTERLINE,
        relativeOffset: { x: 0, y: -18 },
        nameEn: 'Phase Refraction & Sonic Lancer',
        nameKo: '위상 굴절 및 음향 랜서',
        weaponCompatibility: ['SONIC_CANNON', 'LASER'],
      },
    ],
  },
};

// ----------------------------------------------------------------------------
// Concrete Chassis Manager Implementation
// ----------------------------------------------------------------------------

export class ModularChassisManager implements IChassisManager {
  public readonly id = 'modular-chassis';

  public availableChassis: Record<ChassisId, ChassisDefinition>;
  public activeChassis: ChassisDefinition;

  // Runtime dynamic progression state
  public aegisCooldownTimer: number = 0; // 60s cooldown for Nautilus Aegis
  public slipstreamCharge: number = 0; // 0 to 100% for Stingray
  public isSlipstreamReady: boolean = false;

  public krakenRegenTimer: number = 0; // 25s out-of-combat regeneration
  public tentacleWhipCooldown: number = 0; // 1.2s auto-whip interval
  public inkCloudTimer: number = 0; // 3.5s bullet slow field

  public lastRecordedWater: number = 0; // For Leviathan water accumulation
  public leviathanEmpoweredShots: number = 0;

  public ghostIdleFireTimer: number = 0; // 1.5s fire cessation
  public isGhostCloaked: boolean = false;
  public ghostAmbushReady: boolean = false;

  private animationTime: number = 0;

  constructor() {
    this.availableChassis = {
      [ChassisId.NAUTILUS]: {
        id: ChassisId.NAUTILUS,
        nameKo: '노틸러스 드레드노트',
        nameEn: 'Nautilus Dreadnought',
        description: '육중한 장갑과 이중 현측 터렛을 갖춘 심해 결전 결사 잠수함. 방어력 특화 요새형 함선.',
        baseHp: 7,
        maxHp: 9,
        baseSpeed: 300,
        hitboxWidth: 64,
        hitboxHeight: 46,
        radarStats: {
          speed: 45,
          armor: 95,
          hardpoints: 80,
          energy: 50,
          hitboxProfile: 35,
          salvage: 60,
        },
        passiveName: '이지스 격벽 (Aegis Bulkhead)',
        passiveDescription: '일반 피격 데미지 -1 (최소 1). 체력 2 이하 시 고압 증기 충격파를 방출하여 주변 탄막을 제거하고 1.5초간 무적 (재사용 대기시간 60초).',
        onTakeDamage: (currentHp: number, incomingDamage: number): DamageMitigationResult => {
          // Flat damage reduction
          const mitigated = Math.max(1, incomingDamage - 1);
          if (currentHp <= 2 && this.aegisCooldownTimer <= 0) {
            this.aegisCooldownTimer = 60.0;
            return {
              mitigatedDamage: mitigated,
              triggeredEffect: 'STEAM_PULSE',
            };
          }
          return { mitigatedDamage: mitigated };
        },
      },

      [ChassisId.STINGRAY]: {
        id: ChassisId.STINGRAY,
        nameKo: '스팅레이 요격정',
        nameEn: 'Stingray Interceptor',
        description: '극도로 빠른 속도와 극소형 피격 판정을 지닌 고기동 강습 잠수함. 극한의 기동 회피형 함선.',
        baseHp: 3,
        maxHp: 4,
        baseSpeed: 420,
        hitboxWidth: 38,
        hitboxHeight: 30,
        radarStats: {
          speed: 95,
          armor: 30,
          hardpoints: 65,
          energy: 85,
          hitboxProfile: 90,
          salvage: 50,
        },
        passiveName: '캐비테이션 슬립스트림 (Cavitation Slipstream)',
        passiveDescription: '기동 중 오버드라이브 게이지 축적, 100% 충전 시 사격 시 전방 관통 캐비테이션 랜스를 발사하며 0.5초 무적 획득. 공격 속도 +25%.',
      },

      [ChassisId.KRAKEN]: {
        id: ChassisId.KRAKEN,
        nameKo: '크라켄 바이오쉽',
        nameEn: 'Kraken Bioship',
        description: '유기 갑각과 공생 촉수로 자가 치유 및 산성 면역을 보유한 심해 생체 잠수함. 지속 생존 및 근접 방호형.',
        baseHp: 5,
        maxHp: 6,
        baseSpeed: 300,
        hitboxWidth: 50,
        hitboxHeight: 40,
        radarStats: {
          speed: 65,
          armor: 60,
          hardpoints: 75,
          energy: 70,
          hitboxProfile: 60,
          salvage: 70,
        },
        passiveName: '촉수 방호 & 먹물 분사 (Tentacle Sweep & Ink)',
        passiveDescription: '산성 비/유독 플랑크톤 100% 완전 면역. 90px 내 적을 주기적으로 자동 촉수 타격. 피격 시 3.5초간 실명 먹물을 분사하여 탄속 60% 감속. 25초 비전투 시 1 HP 자동 회복.',
        onTakeDamage: (_currentHp: number, incomingDamage: number): DamageMitigationResult => {
          this.krakenRegenTimer = 0; // Reset out-of-combat heal
          this.inkCloudTimer = 3.5; // Trigger ink cloud
          return {
            mitigatedDamage: incomingDamage,
            triggeredEffect: 'INK_BLINDNESS',
          };
        },
      },

      [ChassisId.LEVIATHAN]: {
        id: ChassisId.LEVIATHAN,
        nameKo: '레비아탄 수확정',
        nameEn: 'Leviathan Harvester',
        description: '전 화면 순수 수자원 흡인 및 내구력 수복 엔진을 탑재한 중장갑 채굴형 함선. 자원 파밍 및 경제 최적화.',
        baseHp: 6,
        maxHp: 7,
        baseSpeed: 270,
        hitboxWidth: 54,
        hitboxHeight: 42,
        radarStats: {
          speed: 55,
          armor: 80,
          hardpoints: 70,
          energy: 60,
          hitboxProfile: 45,
          salvage: 95,
        },
        passiveName: '순수 수자원 응축기 (Pure Water Condenser)',
        passiveDescription: '전 화면 순수 수자원 흡인 마그넷 탑재. 자원 획득량 +35%. 100 수자원 누적 획득 시마다 체력 1 자동 수복 및 다음 3회 공격 폭발성 강화.',
      },

      [ChassisId.GHOST]: {
        id: ChassisId.GHOST,
        nameKo: '고스트 은폐함',
        nameEn: 'Ghost Stealth Sub',
        description: '위상 차폐와 소나 클로킹으로 적의 조준을 무력화하는 최첨단 스텔스 잠수함. 암살 및 암습 특화.',
        baseHp: 4,
        maxHp: 5,
        baseSpeed: 320,
        hitboxWidth: 46,
        hitboxHeight: 34,
        radarStats: {
          speed: 75,
          armor: 45,
          hardpoints: 60,
          energy: 90,
          hitboxProfile: 75,
          salvage: 55,
        },
        passiveName: '소나 클록 (Sonar Cloak)',
        passiveDescription: '사격 중단 1.5초 시 위상 은폐(투명도 70%) 활성화. 은폐 해제 첫 공격 300% 치명타 및 유도 음파 충격파 방출. 피격 무적 시간 2.2초로 대폭 연장.',
      },
    };

    this.activeChassis = this.availableChassis[ChassisId.NAUTILUS];
  }

  // --------------------------------------------------------------------------
  // Selection & Player Stat Binding
  // --------------------------------------------------------------------------

  public selectChassis(id: ChassisId): boolean {
    if (!this.availableChassis[id]) return false;
    this.activeChassis = this.availableChassis[id];
    this.resetRuntimeState();
    return true;
  }

  public getHardpoints(id?: ChassisId): HardpointSlot[] {
    const chassisId = id || this.activeChassis.id;
    return CHASSIS_HARDPOINT_CONFIGS[chassisId]?.slots || [];
  }

  public applyToPlayer(player: Player): void {
    if (!player) return;

    player.maxHp = this.activeChassis.maxHp;
    player.hp = Math.min(player.hp, player.maxHp);
    player.speed = this.activeChassis.baseSpeed;
    player.size.width = this.activeChassis.hitboxWidth;
    player.size.height = this.activeChassis.hitboxHeight;

    // Environmental immunities
    if (this.activeChassis.id === ChassisId.KRAKEN) {
      player.hasAcidShield = true;
    }
  }

  private resetRuntimeState(): void {
    this.aegisCooldownTimer = 0;
    this.slipstreamCharge = 0;
    this.isSlipstreamReady = false;
    this.krakenRegenTimer = 0;
    this.tentacleWhipCooldown = 0;
    this.inkCloudTimer = 0;
    this.lastRecordedWater = 0;
    this.leviathanEmpoweredShots = 0;
    this.ghostIdleFireTimer = 0;
    this.isGhostCloaked = false;
    this.ghostAmbushReady = false;
  }

  // --------------------------------------------------------------------------
  // Subsystem Lifecycle: Update
  // --------------------------------------------------------------------------

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    this.animationTime += deltaTime;
    const player = context.player;
    if (!player) return;

    // 1. Nautilus Dreadnought logic
    if (this.activeChassis.id === ChassisId.NAUTILUS) {
      if (this.aegisCooldownTimer > 0) {
        this.aegisCooldownTimer = Math.max(0, this.aegisCooldownTimer - deltaTime);
      }
    }

    // 2. Stingray Interceptor logic
    if (this.activeChassis.id === ChassisId.STINGRAY) {
      // Build slipstream overdrive when moving laterally
      const isMoving = player.isMovingLeft || player.isMovingRight;
      if (isMoving) {
        this.slipstreamCharge = Math.min(100, this.slipstreamCharge + 35 * deltaTime);
      }
      this.isSlipstreamReady = this.slipstreamCharge >= 100;

      // When fully charged and player fires, unleash Cavitation Lance
      if (this.isSlipstreamReady && player.isShooting) {
        this.slipstreamCharge = 0;
        this.isSlipstreamReady = false;
        player.invincibilityTimer = Math.max(player.invincibilityTimer, 0.5);

        // Pierce shot
        const lance = new Bullet(
          player.position.x + player.size.width / 2 - 4,
          player.position.y - 12,
          -650,
          4, // High damage
          true,
          4  // High pierce
        );
        lance.color = '#38bdf8';
        context.bullets.push(lance);
        context.createExplosion(player.position.x + player.size.width / 2, player.position.y - 5, '#38bdf8', 12, 1.2);
        context.triggerScreenShake(0.18, 3);
      }
    }

    // 3. Kraken Bioship logic
    if (this.activeChassis.id === ChassisId.KRAKEN) {
      // Pulsating organic propulsion: 240px/s to 360px/s
      const pulseSpeed = 300 + Math.sin(this.animationTime * 4.0) * 60;
      player.speed = pulseSpeed;
      player.hasAcidShield = true; // Permanent acid immunity

      // Out-of-combat regeneration
      this.krakenRegenTimer += deltaTime;
      if (this.krakenRegenTimer >= 25.0) {
        this.krakenRegenTimer = 0;
        if (player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + 1);
          context.createExplosion(player.position.x + player.size.width / 2, player.position.y + player.size.height / 2, '#10b981', 15, 1.5);
        }
      }

      // Autonomous tentacle whip within 90px
      this.tentacleWhipCooldown -= deltaTime;
      if (this.tentacleWhipCooldown <= 0) {
        this.tentacleWhipCooldown = 1.2;
        const pCenterX = player.position.x + player.size.width / 2;
        const pCenterY = player.position.y + player.size.height / 2;

        let closestEnemy: Enemy | null = null;
        let closestDistSq = 90 * 90;

        for (const enemy of context.enemies) {
          if (enemy.isDead) continue;
          const ex = enemy.position.x + enemy.size.width / 2;
          const ey = enemy.position.y + enemy.size.height / 2;
          const dSq = (ex - pCenterX) ** 2 + (ey - pCenterY) ** 2;
          if (dSq < closestDistSq) {
            closestDistSq = dSq;
            closestEnemy = enemy;
          }
        }

        if (closestEnemy) {
          closestEnemy.hp -= 15;
          closestEnemy.hitFlashTimer = 0.15;
          if (closestEnemy.hp <= 0) {
            closestEnemy.isDead = true;
          }
          context.createExplosion(
            closestEnemy.position.x + closestEnemy.size.width / 2,
            closestEnemy.position.y + closestEnemy.size.height / 2,
            '#059669',
            10,
            1.0
          );
        }
      }

      // Ink cloud effect: slow enemy bullets by 60%
      if (this.inkCloudTimer > 0) {
        this.inkCloudTimer -= deltaTime;
        for (const bullet of context.bullets) {
          if (bullet.isPlayerBullet) continue;
          const bx = bullet.position.x;
          const by = bullet.position.y;
          const px = player.position.x + player.size.width / 2;
          const py = player.position.y + player.size.height / 2;
          const distSq = (bx - px) ** 2 + (by - py) ** 2;
          if (distSq < 160 * 160) {
            bullet.velocity.x *= 0.92;
            bullet.velocity.y *= 0.92;
          }
        }
      }
    }

    // 4. Leviathan Harvester logic
    if (this.activeChassis.id === ChassisId.LEVIATHAN) {
      const currentWater = context.currency;
      if (this.lastRecordedWater === 0) {
        this.lastRecordedWater = currentWater;
      } else if (currentWater > this.lastRecordedWater) {
        const diff = currentWater - this.lastRecordedWater;
        this.lastRecordedWater = currentWater;
        // Check 100 milestone
        if (Math.floor(currentWater / 100) > Math.floor((currentWater - diff) / 100)) {
          if (player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + 1);
          } else {
            this.leviathanEmpoweredShots += 3;
          }
          context.createExplosion(player.position.x + player.size.width / 2, player.position.y + player.size.height / 2, '#f59e0b', 20, 2.0);
        }
      }

      // Check empowered shots
      if (this.leviathanEmpoweredShots > 0 && player.isShooting) {
        this.leviathanEmpoweredShots--;
        const splashSlug = new Bullet(
          player.position.x + player.size.width / 2 - 4,
          player.position.y - 10,
          -450,
          3,
          true,
          2
        );
        splashSlug.color = '#f59e0b';
        context.bullets.push(splashSlug);
      }
    }

    // 5. Ghost Stealth Sub logic
    if (this.activeChassis.id === ChassisId.GHOST) {
      if (!player.isShooting) {
        this.ghostIdleFireTimer += deltaTime;
        if (this.ghostIdleFireTimer >= 1.5) {
          this.isGhostCloaked = true;
          this.ghostAmbushReady = true;
        }
      } else {
        if (this.isGhostCloaked && this.ghostAmbushReady) {
          // Exiting cloak: unleash 300% critical ambush wave
          this.isGhostCloaked = false;
          this.ghostAmbushReady = false;
          this.ghostIdleFireTimer = 0;

          const ambushBullet = new Bullet(
            player.position.x + player.size.width / 2 - 5,
            player.position.y - 15,
            -600,
            6, // 300% crit damage
            true,
            3
          );
          ambushBullet.color = '#a855f7';
          context.bullets.push(ambushBullet);
          context.triggerScreenShake(0.2, 5);
          context.createExplosion(player.position.x + player.size.width / 2, player.position.y - 10, '#a855f7', 18, 1.8);
        } else {
          this.isGhostCloaked = false;
          this.ghostIdleFireTimer = 0;
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Subsystem Lifecycle: Render
  // --------------------------------------------------------------------------

  public drawWorld(ctx: CanvasRenderingContext2D, _time: number): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    // Ink cloud rendering for Kraken
    if (this.activeChassis.id === ChassisId.KRAKEN && this.inkCloudTimer > 0) {
      ctx.save();
      const alpha = Math.min(0.7, (this.inkCloudTimer / 3.5) * 0.7);
      ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
      ctx.beginPath();
      // Draw amorphous ink clouds
      ctx.arc(300, 720, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  public drawForeground(ctx: CanvasRenderingContext2D, _time: number): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    // Draw chassis passive status indicator badge on bottom-left
    ctx.save();
    const bx = 16;
    const by = 754;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(bx, by, 160, 32, 4) : ctx.rect(bx, by, 160, 32);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('HULL CHASSIS', bx + 8, by + 12);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(this.activeChassis.nameEn, bx + 8, by + 25);

    // Mini status bar for specialized passives
    if (this.activeChassis.id === ChassisId.STINGRAY) {
      const chargeRatio = this.slipstreamCharge / 100;
      ctx.fillStyle = 'rgba(14, 116, 144, 0.3)';
      ctx.fillRect(bx + 112, by + 8, 40, 16);
      ctx.fillStyle = this.isSlipstreamReady ? '#38bdf8' : '#0284c7';
      ctx.fillRect(bx + 112, by + 8, 40 * chargeRatio, 16);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(bx + 112, by + 8, 40, 16);
    } else if (this.activeChassis.id === ChassisId.GHOST) {
      ctx.fillStyle = this.isGhostCloaked ? '#a855f7' : '#64748b';
      ctx.beginPath();
      ctx.arc(bx + 140, by + 16, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.activeChassis.id === ChassisId.NAUTILUS) {
      const ready = this.aegisCooldownTimer <= 0;
      ctx.fillStyle = ready ? '#f59e0b' : '#64748b';
      ctx.beginPath();
      ctx.arc(bx + 140, by + 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // Radar Chart Drawing
  // --------------------------------------------------------------------------

  public drawRadarChart(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    chassisId?: ChassisId
  ): void {
    const chassis = chassisId ? this.availableChassis[chassisId] : this.activeChassis;
    if (!chassis) return;

    const options: RadarChartOptions = {
      chassisName: chassis.nameEn,
      comparisonStats: chassisId && chassisId !== this.activeChassis.id ? this.activeChassis.radarStats : undefined,
      accentColor: this.getChassisColor(chassis.id),
      strokeColor: this.getChassisColor(chassis.id),
    };

    ChassisRadarChart.render(ctx, x, y, radius, chassis.radarStats, options);
  }

  private getChassisColor(id: ChassisId): string {
    switch (id) {
      case ChassisId.NAUTILUS:
        return '#f59e0b';
      case ChassisId.STINGRAY:
        return '#38bdf8';
      case ChassisId.KRAKEN:
        return '#10b981';
      case ChassisId.LEVIATHAN:
        return '#eab308';
      case ChassisId.GHOST:
        return '#a855f7';
      default:
        return '#06b6d4';
    }
  }

  public reset(_preserveUpgrades: boolean = false): void {
    this.resetRuntimeState();
  }
}

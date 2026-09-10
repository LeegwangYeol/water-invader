// ============================================================================
// WATER INVADER: VETERAN CREW SYNERGY DECK & ACTIVE BRIDGE ABILITIES
// ============================================================================

import {
  ICrewManager,
  CrewDeckState,
  CrewOfficerState,
  OfficerId,
  OfficerRank,
  StationId,
  OfficerPerk,
  ActiveBridgeAbility,
  DualResonance,
  FlagshipUpdateContext,
} from '../types';
import { Bullet, HomingMissile } from '../../Bullet';
import { Enemy } from '../../Enemy';
import { Faction, Vector2D } from '../../types';

// ----------------------------------------------------------------------------
// Decoy Pod Entity for Dr. Lyra Vance's Active Ability
// ----------------------------------------------------------------------------

export interface DecoyPodState {
  active: boolean;
  position: Vector2D;
  hp: number;
  maxHp: number;
  duration: number;
  remainingLife: number;
}

// ----------------------------------------------------------------------------
// Tactical HUD Banner for Active Ability Trigger Visuals
// ----------------------------------------------------------------------------

interface TacticalBanner {
  title: string;
  subtitle: string;
  color: string;
  remainingLife: number;
  maxLife: number;
}

// ----------------------------------------------------------------------------
// Concrete Crew Manager Implementation
// ----------------------------------------------------------------------------

export class CrewOfficerDeckManager implements ICrewManager {
  public readonly id = 'crew-deck';

  public state: CrewDeckState;

  // Active tactical in-world entities & resonance tracking
  public activeDecoyPod: DecoyPodState | null = null;
  public activeStasisTimer: number = 0; // Ren's Stasis duration timer
  public aegisReflectCooldown: number = 0; // Ingrid + Ren 12s reflect cooldown
  public barricadeRetaliationCooldown: number = 0; // Steam & Thunder cooldown

  private previousBarricadeHpSum: number = 0;
  private activeBanners: TacticalBanner[] = [];
  private runTime: number = 0;

  constructor() {
    this.state = this.createInitialState();
  }

  // --------------------------------------------------------------------------
  // State Initialization
  // --------------------------------------------------------------------------

  private createInitialState(): CrewDeckState {
    const officers: Record<OfficerId, CrewOfficerState> = {
      INGRID: {
        id: 'INGRID',
        nameKo: '잉그리드 베인',
        nameEn: 'Chief Ingrid Vane',
        station: 'ENGINEERING',
        rank: 1,
        unlocked: true,
        meritXp: 0,
        fatigue: 0,
        isExhausted: false,
        paletteColor: '#f59e0b',
        accentColor: '#fbbf24',
        perks: [
          {
            id: 'PERK_INGRID_1',
            officerId: 'INGRID',
            tier: 1,
            nameKo: '나노합금 격벽',
            nameEn: 'Nano-Alloy Bulkhead',
            descriptionKo: '최대 체력 +1, 적 충돌 데미지 30% 감소',
            descriptionEn: 'Max HP +1, collision damage taken reduced by 30%',
            isActive: true,
          },
          {
            id: 'PERK_INGRID_2',
            officerId: 'INGRID',
            tier: 2,
            nameKo: '능동 바리케이드 테더',
            nameEn: 'Active Barricade Tether',
            descriptionKo: '웨이브 시작 시 바리케이드 25% 수복. 파괴 시 100px 탄막 제거 충격파',
            descriptionEn: 'Restores 25% HP to all barricades at wave start; destroyed barricades emit 100px shockwave',
            isActive: false,
          },
          {
            id: 'PERK_INGRID_3',
            officerId: 'INGRID',
            tier: 3,
            nameKo: '원자로 열 사이펀',
            nameEn: 'Reactor Heat Siphon',
            descriptionKo: '스트레스 50 초과 시 함선 속도 +20% 및 25초마다 1 HP 재생',
            descriptionEn: 'When stress > 50, speed +20% and regenerates 1 HP every 25s',
            isActive: false,
          },
        ],
        activeAbility: {
          id: 'SCRAM_PURGE',
          officerId: 'INGRID',
          nameKo: '비상 노심 정화 (SCRAM Purge)',
          nameEn: 'Emergency SCRAM Purge',
          keybind: '1',
          cooldown: 35,
          currentCooldown: 0,
          duration: 1.5,
          isActive: false,
          execute: (context: FlagshipUpdateContext) => {
            const player = context.player;
            // Cleanse suppression and stress
            player.suppressionLevel = 0;
            player.stressLevel = 0;
            player.invincibilityTimer = Math.max(player.invincibilityTimer, 1.5);

            // 300px blast wave clearing enemy bullets
            const pX = player.position.x + player.size.width / 2;
            const pY = player.position.y + player.size.height / 2;

            for (let i = context.bullets.length - 1; i >= 0; i--) {
              const b = context.bullets[i];
              if (!b.isPlayerBullet) {
                const distSq = (b.position.x - pX) ** 2 + (b.position.y - pY) ** 2;
                if (distSq <= 300 * 300) {
                  context.bullets.splice(i, 1);
                }
              }
            }

            // Damage and knockback enemies in 300px
            for (const enemy of context.enemies) {
              if (enemy.isDead) continue;
              const eX = enemy.position.x + enemy.size.width / 2;
              const eY = enemy.position.y + enemy.size.height / 2;
              const distSq = (eX - pX) ** 2 + (eY - pY) ** 2;
              if (distSq <= 300 * 300) {
                enemy.hp -= 100;
                enemy.hitFlashTimer = 0.25;
                enemy.position.y = Math.max(20, enemy.position.y - 35);
                if (enemy.hp <= 0) {
                  enemy.isDead = true;
                }
              }
            }

            context.createExplosion(pX, pY, '#f59e0b', 35, 2.5);
            context.triggerScreenShake(0.4, 8);
          },
        },
      },

      JAX: {
        id: 'JAX',
        nameKo: '잭스 캘러핸',
        nameEn: 'Master Gunner Jax Callahan',
        station: 'GUNNERY',
        rank: 1,
        unlocked: true,
        meritXp: 0,
        fatigue: 0,
        isExhausted: false,
        paletteColor: '#ef4444',
        accentColor: '#f87171',
        perks: [
          {
            id: 'PERK_JAX_1',
            officerId: 'JAX',
            tier: 1,
            nameKo: '초공동 추진제',
            nameEn: 'Supercavitation Propellant',
            descriptionKo: '탄환 비행 속도 +25%, 발사 딜레이 -12%',
            descriptionEn: 'Bullet velocity +25%, fire rate interval -12%',
            isActive: true,
          },
          {
            id: 'PERK_JAX_2',
            officerId: 'JAX',
            tier: 2,
            nameKo: '에이펙스 유도 탄두',
            nameEn: 'Apex Homing Warhead',
            descriptionKo: '유도 미사일 데미지 +35%, 보스 및 엘리트 우선 타겟팅',
            descriptionEn: 'Homing missiles deal +35% damage, prioritizing bosses and elites',
            isActive: false,
          },
          {
            id: 'PERK_JAX_3',
            officerId: 'JAX',
            tier: 3,
            nameKo: '감손 우라늄 관통체',
            nameEn: 'Depleted Uranium Penetrator',
            descriptionKo: '매 4번째 사격 시 관통력 +3, 데미지 2.0배 강화',
            descriptionEn: 'Every 4th shot becomes a Hyper-Kinetic Slug with +3 piercing and 2.0x damage',
            isActive: false,
          },
        ],
        activeAbility: {
          id: 'TITAN_SALVO',
          officerId: 'JAX',
          nameKo: '타이탄 일제 사격 (Titan Salvo)',
          nameEn: 'Titan Cavitation Salvo',
          keybind: '2',
          cooldown: 28,
          currentCooldown: 0,
          duration: 2.0,
          isActive: false,
          execute: (context: FlagshipUpdateContext) => {
            const player = context.player;
            const pX = player.position.x + player.size.width / 2;
            const pY = player.position.y - 10;

            // 12 supercavitating torpedoes in a forward fan (-60 to +60 degrees)
            const count = 12;
            const minAngle = -Math.PI / 3;
            const maxAngle = Math.PI / 3;

            for (let i = 0; i < count; i++) {
              const angle = minAngle + ((maxAngle - minAngle) / (count - 1)) * i;
              const speed = 500;
              const missile = new HomingMissile(pX + (i - 5.5) * 6, pY, 18);
              missile.faction = Faction.PLAYER;
              missile.velocity.x = Math.sin(angle) * speed;
              missile.velocity.y = -Math.cos(angle) * speed;
              context.bullets.push(missile);
            }

            context.createExplosion(pX, pY, '#ef4444', 25, 2.0);
            context.triggerScreenShake(0.35, 7);
          },
        },
      },

      REN: {
        id: 'REN',
        nameKo: '렌 쏜',
        nameEn: 'Hydro-Officer Ren Thorne',
        station: 'SONAR',
        rank: 1,
        unlocked: true,
        meritXp: 0,
        fatigue: 0,
        isExhausted: false,
        paletteColor: '#10b981',
        accentColor: '#34d399',
        perks: [
          {
            id: 'PERK_REN_1',
            officerId: 'REN',
            tier: 1,
            nameKo: '하이드로폰 핑 표식',
            nameEn: 'Hydrophone Ping Mark',
            descriptionKo: '적 타격 시 18% 확률로 6초간 음향 표식 부여 (치명타 데미지 +30%)',
            descriptionEn: '18% chance on hit to mark an enemy for 6.0s; marked enemies take +30% critical damage',
            isActive: true,
          },
          {
            id: 'PERK_REN_2',
            officerId: 'REN',
            tier: 2,
            nameKo: '도플러 회피 그리드',
            nameEn: 'Doppler Evasion Grid',
            descriptionKo: '40px 이내 적 탄환 접근 시 0.6초간 함선 속도 +15% 부스트',
            descriptionEn: 'Projectiles passing within 40px grant +15% speed boost for 0.6s',
            isActive: false,
          },
          {
            id: 'PERK_REN_3',
            officerId: 'REN',
            tier: 3,
            nameKo: '심해 조기 경보망',
            nameEn: 'Abyssal Early Warning',
            descriptionKo: '크라이시스 경보 3초 조기 감지, 환경 위험 빈도 -20%',
            descriptionEn: 'Crisis warnings appear 3.0s earlier; hazard spawn frequency -20%',
            isActive: false,
          },
        ],
        activeAbility: {
          id: 'STASIS_PULSE',
          officerId: 'REN',
          nameKo: '수중 음향 정체 파동 (Stasis Pulse)',
          nameEn: 'Hydro-Acoustic Stasis',
          keybind: '3',
          cooldown: 32,
          currentCooldown: 0,
          duration: 5.0,
          isActive: false,
          execute: (_context: FlagshipUpdateContext) => {
            this.activeStasisTimer = 5.0;
            _context.triggerScreenShake(0.25, 5);
            _context.createExplosion(
              _context.player.position.x + _context.player.size.width / 2,
              _context.player.position.y + _context.player.size.height / 2,
              '#10b981',
              25,
              2.0
            );

            // Push enemies upwards
            for (const e of _context.enemies) {
              if (!e.isDead) {
                e.position.y = Math.max(20, e.position.y - 40);
                e.hitFlashTimer = 0.2;
              }
            }
          },
        },
      },

      LYRA: {
        id: 'LYRA',
        nameKo: '닥터 리라 밴스',
        nameEn: 'Dr. Lyra Vance',
        station: 'BIOLOGY',
        rank: 1,
        unlocked: true,
        meritXp: 0,
        fatigue: 0,
        isExhausted: false,
        paletteColor: '#06b6d4',
        accentColor: '#38bdf8',
        perks: [
          {
            id: 'PERK_LYRA_1',
            officerId: 'LYRA',
            tier: 1,
            nameKo: '공생 삼투 흡수',
            nameEn: 'Symbiotic Osmosis',
            descriptionKo: '150px 내 적 처치 시 영양 진주 생성 (수자원 +10, 스트레스 -5%)',
            descriptionEn: 'Kills within 150px drop Bio-Nutrient Pearls (+10 Water, -5% Stress)',
            isActive: true,
          },
          {
            id: 'PERK_LYRA_2',
            officerId: 'LYRA',
            tier: 2,
            nameKo: '산성 알칼리화 코팅',
            nameEn: 'Acid Alkalizer Coating',
            descriptionKo: '산성 비 데미지 60% 경감, 쉴드로 산성 흡수 시 수자원 +1',
            descriptionEn: 'Acid rain damage reduced by 60%; absorbing acid with shield grants +1 Water',
            isActive: false,
          },
          {
            id: 'PERK_LYRA_3',
            officerId: 'LYRA',
            tier: 3,
            nameKo: '생체발광 신경독',
            nameEn: 'Bioluminescent Neurotoxin',
            descriptionKo: '미사일 및 중화기 타격 시 적 이동 및 공격 속도 4초간 35% 둔화',
            descriptionEn: 'Missiles and heavy shots slow enemy movement and attack speed by 35% for 4.0s',
            isActive: false,
          },
        ],
        activeAbility: {
          id: 'BIO_DECOY',
          officerId: 'LYRA',
          nameKo: '생체 발광 미끼 사출 (Bio-Decoy)',
          nameEn: 'Bioluminescent Decoy Pod',
          keybind: '4',
          cooldown: 30,
          currentCooldown: 0,
          duration: 6.0,
          isActive: false,
          execute: (context: FlagshipUpdateContext) => {
            const player = context.player;
            // Deploy decoy pod ahead of player
            this.activeDecoyPod = {
              active: true,
              position: {
                x: player.position.x + player.size.width / 2,
                y: Math.max(120, player.position.y - 120),
              },
              hp: 120,
              maxHp: 120,
              duration: 6.0,
              remainingLife: 6.0,
            };

            // Heal player vessel
            player.hp = Math.min(player.maxHp, player.hp + 1);

            context.createExplosion(this.activeDecoyPod.position.x, this.activeDecoyPod.position.y, '#06b6d4', 20, 2.0);
            context.triggerScreenShake(0.15, 3);
          },
        },
      },
    };

    return {
      officers,
      stationAssignments: {
        ENGINEERING: 'INGRID',
        GUNNERY: 'JAX',
        SONAR: 'REN',
        BIOLOGY: 'LYRA',
      },
      activeResonances: [],
      isQuadGrandResonanceActive: false,
      abyssalCores: 0,
      canReviveWithPurge: true,
    };
  }

  // --------------------------------------------------------------------------
  // Station Assignment & Promotions
  // --------------------------------------------------------------------------

  public assignStation(officerId: OfficerId, stationId: StationId): boolean {
    const officer = this.state.officers[officerId];
    if (!officer || !officer.unlocked) return false;

    // If station is occupied by another officer, swap or clear
    const currentOccupant = this.state.stationAssignments[stationId];
    if (currentOccupant && currentOccupant !== officerId) {
      this.state.officers[currentOccupant].station = officer.station;
      this.state.stationAssignments[officer.station] = currentOccupant;
    }

    this.state.stationAssignments[stationId] = officerId;
    officer.station = stationId;

    this.evaluateResonances();
    return true;
  }

  public promoteOfficer(officerId: OfficerId): boolean {
    const officer = this.state.officers[officerId];
    if (!officer || officer.rank >= 4) return false;

    officer.rank = (officer.rank + 1) as OfficerRank;

    // Activate corresponding tier perks
    for (const perk of officer.perks) {
      if (perk.tier <= officer.rank) {
        perk.isActive = true;
      }
    }

    // Cooldown scaling reduction: Cooldown(R) = BaseCooldown * (1.0 - 0.15 * (R - 1))
    const baseCd = officer.id === 'INGRID' ? 35 : officer.id === 'JAX' ? 28 : officer.id === 'REN' ? 32 : 30;
    officer.activeAbility.cooldown = Math.round(baseCd * (1.0 - 0.15 * (officer.rank - 1)));

    this.evaluateResonances();
    return true;
  }

  // --------------------------------------------------------------------------
  // Resonances Evaluation: 6 Dual + 1 Quad
  // --------------------------------------------------------------------------

  public evaluateResonances(): void {
    const activeResonances: DualResonance[] = [];
    const officers = this.state.officers;

    // Helper: are both officers stationed and at least Rank 2 (or unlocked)
    const isPairActive = (a: OfficerId, b: OfficerId, minRank: number = 2): boolean => {
      const offA = officers[a];
      const offB = officers[b];
      return (
        this.state.stationAssignments[offA.station] === a &&
        this.state.stationAssignments[offB.station] === b &&
        offA.rank >= minRank &&
        offB.rank >= minRank
      );
    };

    // 1. Steam & Thunder (Ingrid + Jax)
    if (isPairActive('INGRID', 'JAX')) {
      activeResonances.push({
        id: 'RESONANCE_STEAM_THUNDER',
        nameKo: '증기와 천둥 (Steam & Thunder)',
        nameEn: 'Steam & Thunder',
        officerA: 'INGRID',
        officerB: 'JAX',
        descriptionKo: '바리케이드 피격 시 2발의 고온 증기 유도 미사일 자동 반격',
        descriptionEn: 'Barricade damage triggers 2 superheated steam retaliation missiles',
        isActive: true,
      });
    }

    // 2. Thermal Plume (Ingrid + Lyra)
    if (isPairActive('INGRID', 'LYRA')) {
      activeResonances.push({
        id: 'RESONANCE_THERMAL_PLUME',
        nameKo: '열수 플룸 공생체 (Thermal Plume)',
        nameEn: 'Thermal Plume',
        officerA: 'INGRID',
        officerB: 'LYRA',
        descriptionKo: '위험 지역 및 극한 온도 환경에서 방어막과 선체 지속 재생',
        descriptionEn: 'Hazard presence grants continuous regenerative hull protection',
        isActive: true,
      });
    }

    // 3. Aegis Bulkhead (Ingrid + Ren)
    if (isPairActive('INGRID', 'REN')) {
      activeResonances.push({
        id: 'RESONANCE_AEGIS_BULKHEAD',
        nameKo: '이지스 음향 방호벽 (Aegis Bulkhead)',
        nameEn: 'Aegis Bulkhead',
        officerA: 'INGRID',
        officerB: 'REN',
        descriptionKo: '피격 시 12초 주기로 다음 적 탄환 1회 자동 굴절 및 반사',
        descriptionEn: 'Taking damage auto-reflects the next hostile projectile (12s CD)',
        isActive: true,
      });
    }

    // 4. Dead Reckoning (Jax + Ren)
    if (isPairActive('JAX', 'REN')) {
      activeResonances.push({
        id: 'RESONANCE_DEAD_RECKONING',
        nameKo: '추측 항법 (Dead Reckoning)',
        nameEn: 'Dead Reckoning',
        officerA: 'JAX',
        officerB: 'REN',
        descriptionKo: '유도 미사일 탄속 +50% 및 음향 표식된 적 절대 추적',
        descriptionEn: 'Homing missiles gain +50% speed and permanent lock on tagged foes',
        isActive: true,
      });
    }

    // 5. Bio-Ballistics (Jax + Lyra)
    if (isPairActive('JAX', 'LYRA')) {
      activeResonances.push({
        id: 'RESONANCE_BIO_BALLISTICS',
        nameKo: '생체 탄도학 (Bio-Ballistics)',
        nameEn: 'Bio-Ballistics',
        officerA: 'JAX',
        officerB: 'LYRA',
        descriptionKo: '관통 탄환 적중 시 5초간 3 DPS의 부식성 산성 궤적 잔류',
        descriptionEn: 'Piercing shots leave a 3 DPS corrosive acid trail for 5.0 seconds',
        isActive: true,
      });
    }

    // 6. Abyssal Echosphere (Ren + Lyra)
    if (isPairActive('REN', 'LYRA')) {
      activeResonances.push({
        id: 'RESONANCE_ABYSSAL_ECHOSPHERE',
        nameKo: '심해 음향생체 구체 (Abyssal Echosphere)',
        nameEn: 'Abyssal Echosphere',
        officerA: 'REN',
        officerB: 'LYRA',
        descriptionKo: '음향 표식된 적 피격 시 주변 적 100% 아군 오사 및 5% 흡혈',
        descriptionEn: 'Tagged enemies take 100% friendly fire splash; crits grant 5% lifesteal',
        isActive: true,
      });
    }

    this.state.activeResonances = activeResonances;

    // Check Quad Grand Resonance: All 4 officers stationed at Rank 3+ (Commander/Fleet Captain)
    let rank3Count = 0;
    for (const id of ['INGRID', 'JAX', 'REN', 'LYRA'] as OfficerId[]) {
      const off = officers[id];
      if (this.state.stationAssignments[off.station] === id && off.rank >= 3) {
        rank3Count++;
      }
    }
    this.state.isQuadGrandResonanceActive = rank3Count === 4;
  }

  // --------------------------------------------------------------------------
  // Ability Triggering & Keybindings
  // --------------------------------------------------------------------------

  public triggerAbility(officerId: OfficerId, context: FlagshipUpdateContext): boolean {
    const officer = this.state.officers[officerId];
    if (!officer || !officer.unlocked || officer.activeAbility.currentCooldown > 0) {
      return false;
    }

    // Execute active ability logic
    officer.activeAbility.execute(context);

    // Apply base cooldown (with Quad -20% discount and +20% exhaustion penalty if exhausted)
    let effectiveCooldown = officer.activeAbility.cooldown;
    if (this.state.isQuadGrandResonanceActive) {
      effectiveCooldown *= 0.8;
    }
    if (officer.isExhausted) {
      effectiveCooldown *= 1.2;
    }

    officer.activeAbility.currentCooldown = effectiveCooldown;
    officer.fatigue = Math.min(100, officer.fatigue + 15);
    officer.isExhausted = officer.fatigue >= 100;
    officer.meritXp += 25;

    // Push tactical announcement banner
    this.activeBanners.push({
      title: officer.activeAbility.nameEn.toUpperCase(),
      subtitle: `${officer.nameEn} // ${officer.station}`,
      color: officer.paletteColor,
      remainingLife: 1.4,
      maxLife: 1.4,
    });

    return true;
  }

  public handleInput(key: string, isDown: boolean, context: FlagshipUpdateContext): boolean {
    if (!isDown) return false;

    // Keybindings: [1]/Q, [2]/E, [3]/R, [4]/F
    if (key === '1' || key === 'q' || key === 'Q') {
      return this.triggerAbility('INGRID', context);
    }
    if (key === '2' || key === 'e' || key === 'E') {
      return this.triggerAbility('JAX', context);
    }
    if (key === '3' || key === 'r' || key === 'R') {
      return this.triggerAbility('REN', context);
    }
    if (key === '4' || key === 'f' || key === 'F') {
      return this.triggerAbility('LYRA', context);
    }

    return false;
  }

  // --------------------------------------------------------------------------
  // Subsystem Lifecycle: Update
  // --------------------------------------------------------------------------

  public update(deltaTime: number, context: FlagshipUpdateContext): void {
    this.runTime += deltaTime;
    const player = context.player;
    if (!player) return;

    // 1. Tick officer ability cooldowns & gradual fatigue recovery
    for (const id of ['INGRID', 'JAX', 'REN', 'LYRA'] as OfficerId[]) {
      const off = this.state.officers[id];
      if (off.activeAbility.currentCooldown > 0) {
        off.activeAbility.currentCooldown = Math.max(0, off.activeAbility.currentCooldown - deltaTime);
      }
      // Fatigue decay if idle
      if (off.fatigue > 0 && off.activeAbility.currentCooldown === 0) {
        off.fatigue = Math.max(0, off.fatigue - 0.5 * deltaTime);
        off.isExhausted = off.fatigue >= 100;
      }
    }

    // 2. Ren's Stasis Pulse Active duration: Slow enemy bullets by 70%
    if (this.activeStasisTimer > 0) {
      this.activeStasisTimer -= deltaTime;
      for (const bullet of context.bullets) {
        if (!bullet.isPlayerBullet) {
          bullet.velocity.x *= 0.85;
          bullet.velocity.y *= 0.85;
        }
      }
    }

    // 3. Lyra's Decoy Pod logic: intercept bullets & attract fire
    if (this.activeDecoyPod && this.activeDecoyPod.active) {
      this.activeDecoyPod.remainingLife -= deltaTime;
      if (this.activeDecoyPod.remainingLife <= 0 || this.activeDecoyPod.hp <= 0) {
        context.createExplosion(this.activeDecoyPod.position.x, this.activeDecoyPod.position.y, '#06b6d4', 15, 1.5);
        this.activeDecoyPod = null;
      } else {
        // Intercept nearby enemy bullets within 50px
        for (let i = context.bullets.length - 1; i >= 0; i--) {
          const b = context.bullets[i];
          if (!b.isPlayerBullet) {
            const distSq =
              (b.position.x - this.activeDecoyPod.position.x) ** 2 +
              (b.position.y - this.activeDecoyPod.position.y) ** 2;
            if (distSq <= 50 * 50) {
              this.activeDecoyPod.hp -= b.damage;
              context.bullets.splice(i, 1);
              context.createExplosion(b.position.x, b.position.y, '#38bdf8', 6, 0.8);
              if (this.activeDecoyPod.hp <= 0) break;
            }
          }
        }
      }
    }

    // 4. Dual Resonance: Steam & Thunder (Retaliate on Barricade damage)
    const hasSteamAndThunder = this.state.activeResonances.some((r) => r.id === 'RESONANCE_STEAM_THUNDER');
    if (hasSteamAndThunder) {
      let currentBarricadeHp = 0;
      for (const bar of context.barricades) {
        if (!bar.isDead) currentBarricadeHp += bar.hp;
      }

      if (this.previousBarricadeHpSum === 0) {
        this.previousBarricadeHpSum = currentBarricadeHp;
      } else if (currentBarricadeHp < this.previousBarricadeHpSum) {
        // Barricade took damage!
        this.previousBarricadeHpSum = currentBarricadeHp;
        if (this.barricadeRetaliationCooldown <= 0) {
          this.barricadeRetaliationCooldown = 1.8;
          // Launch 2 retaliation missiles
          const pX = player.position.x + player.size.width / 2;
          const pY = player.position.y - 10;
          const m1 = new HomingMissile(pX - 12, pY, 15);
          const m2 = new HomingMissile(pX + 12, pY, 15);
          m1.faction = Faction.PLAYER;
          m2.faction = Faction.PLAYER;
          context.bullets.push(m1, m2);
          context.createExplosion(pX, pY, '#f59e0b', 8, 1.0);
        }
      } else {
        this.previousBarricadeHpSum = currentBarricadeHp;
      }
      if (this.barricadeRetaliationCooldown > 0) {
        this.barricadeRetaliationCooldown -= deltaTime;
      }
    }

    // 5. Aegis Bulkhead Cooldown
    if (this.aegisReflectCooldown > 0) {
      this.aegisReflectCooldown = Math.max(0, this.aegisReflectCooldown - deltaTime);
    }

    // 6. Quad Grand Resonance: Sub-Zero Reactor Purge (Revive at 0 HP)
    if (this.state.isQuadGrandResonanceActive && this.state.canReviveWithPurge && player.hp <= 0) {
      this.triggerSubZeroPurge(context);
    }

    // 7. Tick tactical banners
    for (let i = this.activeBanners.length - 1; i >= 0; i--) {
      this.activeBanners[i].remainingLife -= deltaTime;
      if (this.activeBanners[i].remainingLife <= 0) {
        this.activeBanners.splice(i, 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Subsystem Lifecycle: Render
  // --------------------------------------------------------------------------

  public drawWorld(ctx: CanvasRenderingContext2D, _time: number): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    // Draw Decoy Pod in the world
    if (this.activeDecoyPod && this.activeDecoyPod.active) {
      ctx.save();
      const pod = this.activeDecoyPod;
      const pulse = 1.0 + Math.sin(this.runTime * 8) * 0.15;

      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#0891b2';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(pod.position.x, pod.position.y, 14 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Core bioluminescent pip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pod.position.x, pod.position.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // HP bar over Decoy
      const barW = 28;
      const barH = 3;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(pod.position.x - barW / 2, pod.position.y - 20, barW, barH);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(pod.position.x - barW / 2, pod.position.y - 20, barW * (pod.hp / pod.maxHp), barH);

      ctx.restore();
    }

    // Draw Stasis pulse visual aura
    if (this.activeStasisTimer > 0) {
      ctx.save();
      const alpha = (this.activeStasisTimer / 5.0) * 0.12;
      ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.fillRect(0, 0, 600, 800);
      ctx.restore();
    }
  }

  public drawHUD(ctx: CanvasRenderingContext2D): void {
    if (!ctx || typeof ctx.save !== 'function') return;

    ctx.save();

    // ------------------------------------------------------------------------
    // 1. Bridge Officer Deck Cards (Left Vertical Stack: y: 80 to 240)
    // ------------------------------------------------------------------------
    const officerIds: OfficerId[] = ['INGRID', 'JAX', 'REN', 'LYRA'];
    const startX = 12;
    const startY = 82;
    const cardW = 124;
    const cardH = 36;
    const gapY = 8;

    for (let i = 0; i < officerIds.length; i++) {
      const id = officerIds[i];
      const off = this.state.officers[id];
      const y = startY + i * (cardH + gapY);
      const isReady = off.activeAbility.currentCooldown <= 0;
      const cdRatio = off.activeAbility.currentCooldown / off.activeAbility.cooldown;

      // Card background
      ctx.fillStyle = isReady ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.65)';
      ctx.strokeStyle = isReady ? off.paletteColor : 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = isReady ? 1.5 : 1;

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(startX, y, cardW, cardH, 4) : ctx.rect(startX, y, cardW, cardH);
      ctx.fill();
      ctx.stroke();

      // Station badge tag [E], [G], [S], [B]
      const stationChar = off.station[0];
      ctx.fillStyle = off.paletteColor;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`[${stationChar}]`, startX + 6, y + 13);

      // Officer name & Rank Stars
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px monospace';
      const rankStars = '★'.repeat(off.rank);
      ctx.fillText(off.nameEn.split(' ')[1] || off.nameEn, startX + 24, y + 13);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(rankStars, startX + 86, y + 13);

      // Keybind & Cooldown progress bar
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = off.accentColor;
      ctx.fillText(`[${off.activeAbility.keybind}]`, startX + 6, y + 28);

      const barX = startX + 26;
      const barY = y + 20;
      const barW = 86;
      const barH = 10;

      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.fillRect(barX, barY, barW, barH);

      if (isReady) {
        ctx.fillStyle = off.paletteColor;
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('READY', barX + 26, barY + 8);
      } else {
        const fillW = barW * (1.0 - cdRatio);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.fillRect(barX, barY, fillW, barH);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`${off.activeAbility.currentCooldown.toFixed(1)}s`, barX + 30, barY + 8);
      }

      // Exhaustion marker
      if (off.isExhausted) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('EXHAUSTED', startX + cardW - 55, y + 28);
      }
    }

    // ------------------------------------------------------------------------
    // 2. Active Resonances Badges
    // ------------------------------------------------------------------------
    if (this.state.activeResonances.length > 0) {
      const resY = startY + 4 * (cardH + gapY) + 4;
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('ACTIVE SYNERGIES:', startX, resY);

      for (let r = 0; r < this.state.activeResonances.length; r++) {
        const res = this.state.activeResonances[r];
        const badgeY = resY + 10 + r * 13;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.fillRect(startX, badgeY - 8, cardW, 11);
        ctx.fillStyle = '#06b6d4';
        ctx.fillText(`• ${res.nameEn}`, startX + 4, badgeY);
      }
    }

    // 3. Quad Grand Resonance Crest
    if (this.state.isQuadGrandResonanceActive) {
      const quadY = 48;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.fillRect(startX, quadY, cardW, 16);
      ctx.strokeRect(startX, quadY, cardW, 16);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('★ ABYSSAL MATRIX ★', startX + 12, quadY + 11);
    }

    // ------------------------------------------------------------------------
    // 4. Tactical Announcement Banners (Upper Center)
    // ------------------------------------------------------------------------
    for (const banner of this.activeBanners) {
      const alpha = Math.min(1.0, banner.remainingLife / (banner.maxLife * 0.4));
      ctx.save();
      ctx.globalAlpha = alpha;
      const bCenterY = 160;

      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.strokeStyle = banner.color;
      ctx.lineWidth = 2;
      ctx.fillRect(100, bCenterY - 24, 400, 48);
      ctx.strokeRect(100, bCenterY - 24, 400, 48);

      ctx.textAlign = 'center';
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = banner.color;
      ctx.shadowColor = banner.color;
      ctx.shadowBlur = 8;
      ctx.fillText(banner.title, 300, bCenterY - 4);

      ctx.font = '10px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.shadowBlur = 0;
      ctx.fillText(banner.subtitle, 300, bCenterY + 14);

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Quad Grand Resonance: Sub-Zero Reactor Purge (Revive at 0 HP)
   * Restores player to maxHp, grants 4.0s invincibility, wipes hostile bullets,
   * deals 150 shockwave damage to all hostiles, triggers screen shake & banner.
   */
  public triggerSubZeroPurge(context: FlagshipUpdateContext): boolean {
    if (this.state.isQuadGrandResonanceActive && this.state.canReviveWithPurge) {
      this.state.canReviveWithPurge = false;
      const player = context.player;
      player.hp = player.maxHp;
      player.isDead = false;
      player.invincibilityTimer = 4.0;

      // Screen-wide 150 damage shockwave
      for (const e of context.enemies) {
        if (!e.isDead) {
          e.hp -= 150;
          e.hitFlashTimer = 0.4;
          if (e.hp <= 0) e.isDead = true;
        }
      }
      // Wipe all hostile bullets
      for (let i = context.bullets.length - 1; i >= 0; i--) {
        if (!context.bullets[i].isPlayerBullet) {
          context.bullets.splice(i, 1);
        }
      }

      context.createExplosion(player.position.x + player.size.width / 2, player.position.y, '#f59e0b', 60, 4.0);
      context.triggerScreenShake(0.6, 12);

      this.activeBanners.push({
        title: 'SUB-ZERO REACTOR PURGE // REVIVE ACTIVATED',
        subtitle: 'ABYSSAL LEVIATHAN MATRIX EMERGENCY PROTOCOL',
        color: '#fbbf24',
        remainingLife: 2.5,
        maxLife: 2.5,
      });

      return true;
    }
    return false;
  }

  public reset(preserveUpgrades: boolean = false): void {
    for (const id of ['INGRID', 'JAX', 'REN', 'LYRA'] as OfficerId[]) {
      const off = this.state.officers[id];
      off.activeAbility.currentCooldown = 0;
      off.fatigue = 0;
      off.isExhausted = false;
      if (!preserveUpgrades) {
        off.rank = 1;
        off.meritXp = 0;
        for (const perk of off.perks) {
          perk.isActive = perk.tier === 1;
        }
      }
    }
    this.activeDecoyPod = null;
    this.activeStasisTimer = 0;
    this.activeBanners = [];
    this.state.canReviveWithPurge = true;
    this.evaluateResonances();
  }
}

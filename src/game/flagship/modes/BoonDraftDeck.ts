// ============================================================================
// WATER INVADER: FEATURE 11 - 3-CARD BOON DRAFT DECK & ABYSSAL CURSES
// ============================================================================
// 24 Curated Boons across 5 tactical synergy archetypes + 6 Faustian Abyssal Curses
// with weighted rarity draws (Common 60%, Rare 28%, Legendary 9%, Corrupted 3%).

import { BoonCard, BoonRarity, BoonSynergyTag, FlagshipUpdateContext } from '../types';

export const BOON_CARDS: BoonCard[] = [
  // ==========================================================================
  // BULLET & WEAPON SYNERGIES (1..6)
  // ==========================================================================
  {
    id: 'boon_cavitation_burst',
    nameKo: '캐비테이션 파열',
    nameEn: 'Cavitation Burst',
    descriptionKo: '모든 탄환 적중 시 60px 반경의 미세 수중 폭발이 일어나 +25% 광역 피해를 줍니다.',
    descriptionEn: 'All bullet hits trigger micro-implosions dealing +25% AoE splash damage in a 60px radius.',
    rarity: 'COMMON',
    icon: '💥',
    synergyTag: 'BULLET',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.multiShot = Math.max(context.player.multiShot, 2);
    },
  },
  {
    id: 'boon_supercavitation_rifling',
    nameKo: '초강선 초공동 총열',
    nameEn: 'Supercavitation Rifling',
    descriptionKo: '탄환 탄속이 +30% 빨라지고 사격 후딜레이가 15% 감소합니다.',
    descriptionEn: 'Bullet velocity +30% and weapon firing delay reduced by 15%.',
    rarity: 'COMMON',
    icon: '⚡',
    synergyTag: 'BULLET',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.baseFireRate = Math.max(0.2, context.player.baseFireRate * 0.85);
    },
  },
  {
    id: 'boon_tungsten_core',
    nameKo: '고밀도 텅스텐 관통탄',
    nameEn: 'Tungsten Core Penetrator',
    descriptionKo: '탄환 관통력이 +1 증가하고 적 방어력을 관통하여 온전한 피해를 입힙니다.',
    descriptionEn: 'Piercing count +1 and penetrates heavy enemy armor plating.',
    rarity: 'COMMON',
    icon: '🎯',
    synergyTag: 'BULLET',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.piercing = (context.player.piercing || 1) + 1;
    },
  },
  {
    id: 'boon_saline_chain_arc',
    nameKo: '염수 연쇄 전도체',
    nameEn: 'Saline Chain Conductor',
    descriptionKo: '탄환 적중 시 75px 이내의 인접한 적 1기에게 15의 전기 연쇄 피해를 입힙니다.',
    descriptionEn: 'Bullet impacts arc electrical shock (75px) dealing 15 damage to a nearby enemy.',
    rarity: 'RARE',
    icon: '⚡',
    synergyTag: 'BULLET',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.piercing = Math.max(2, (context.player.piercing || 1) + 1);
    },
  },
  {
    id: 'boon_thermal_plasma_rounds',
    nameKo: '열수 플라즈마 탄두',
    nameEn: 'Hydrothermal Plasma Rounds',
    descriptionKo: '탄환이 붉은 고온 플라즈마로 전환되어 3초간 초당 8의 지속 화상 피해를 입힙니다.',
    descriptionEn: 'Bullets convert to superheated plasma, dealing 8 burn DPS over 3 seconds.',
    rarity: 'RARE',
    icon: '🔥',
    synergyTag: 'BULLET',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.multiShot = Math.max(3, context.player.multiShot + 1);
    },
  },
  {
    id: 'boon_vortical_railgun',
    nameKo: '소용돌이 레일건',
    nameEn: 'Vortical Railgun',
    descriptionKo: '주무기가 초고속 관통 수류창으로 변환되어 300% 단일 피해를 전방 직선상 적에게 입힙니다.',
    descriptionEn: 'Primary fire fires a piercing hydro-lance dealing 300% linear damage.',
    rarity: 'LEGENDARY',
    icon: '🔱',
    synergyTag: 'BULLET',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.piercing = Math.max(5, (context.player.piercing || 1) + 3);
      context.player.baseFireRate = Math.max(0.18, context.player.baseFireRate * 0.75);
    },
  },

  // ==========================================================================
  // MISSILE & ORDNANCE SYNERGIES (7..10)
  // ==========================================================================
  {
    id: 'boon_sonar_guidance_pods',
    nameKo: '소나 유도 포드',
    nameEn: 'Sonar Guidance Pods',
    descriptionKo: '유도 미사일 슬롯 +1 및 미사일 선회 추적 속도가 +25% 상승합니다.',
    descriptionEn: 'Homing missile slot +1 and missile turning rate increased by +25%.',
    rarity: 'COMMON',
    icon: '🚀',
    synergyTag: 'MISSILE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.homingMissiles = Math.min(5, context.player.homingMissiles + 1);
    },
  },
  {
    id: 'boon_benthic_cluster_warheads',
    nameKo: '심해 확산 자탄두',
    nameEn: 'Benthic Cluster Warheads',
    descriptionKo: '유도 미사일 폭발 시 2개의 소형 자탄이 분산되어 인접 적을 추가 타격합니다.',
    descriptionEn: 'Missile detonations split into 2 secondary micro-warheads hitting nearby targets.',
    rarity: 'RARE',
    icon: '🎆',
    synergyTag: 'MISSILE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.homingMissiles = Math.min(5, context.player.homingMissiles + 2);
    },
  },
  {
    id: 'boon_thermobaric_payload',
    nameKo: '열기압 충격 탄두',
    nameEn: 'Thermobaric Shock Payload',
    descriptionKo: '미사일 폭발 반경이 +50% 증가하며 적 탄막을 일시 소멸시키는 음향 충격파를 방출합니다.',
    descriptionEn: 'Missile blast radius +50% and emits an acoustic shockwave clearing enemy projectiles.',
    rarity: 'RARE',
    icon: '💣',
    synergyTag: 'MISSILE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.triggerScreenShake(0.35, 6);
      context.player.homingMissiles = Math.min(5, context.player.homingMissiles + 1);
    },
  },
  {
    id: 'boon_apex_swarm_protocol',
    nameKo: '에이펙스 군집 프로토콜',
    nameEn: 'Apex Swarm Protocol',
    descriptionKo: '최대 유도 미사일 소지량이 5개로 즉시 완충되며, 8초마다 1기씩 자동 재장전됩니다.',
    descriptionEn: 'Max homing missiles set to 5 with automatic rearming every 8 seconds.',
    rarity: 'LEGENDARY',
    icon: '🛸',
    synergyTag: 'MISSILE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.homingMissiles = 5;
    },
  },

  // ==========================================================================
  // PRESSURE & BALLAST SYNERGIES (11..15)
  // ==========================================================================
  {
    id: 'boon_titanium_bulkhead',
    nameKo: '티타늄 압력 격벽 보강',
    nameEn: 'Titanium Pressure Bracing',
    descriptionKo: '심해 수압 스트레스 축적 속도가 25% 영구 감소합니다.',
    descriptionEn: 'Hydrostatic pressure stress accumulation rate permanently reduced by 25%.',
    rarity: 'COMMON',
    icon: '🛡️',
    synergyTag: 'PRESSURE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.maxHp = Math.min(8, context.player.maxHp + 1);
      context.player.hp = Math.min(context.player.maxHp, context.player.hp + 1);
    },
  },
  {
    id: 'boon_high_flow_ballast',
    nameKo: '고유량 밸러스트 펌프',
    nameEn: 'High-Flow Ballast Pump',
    descriptionKo: '밸러스트 배출([C]) 시 스트레스가 45% 해소(기본 30%)되며 물 소모가 감소합니다.',
    descriptionEn: 'Ballast vent ([C]) vents 45% stress (up from 30%) with reduced water cost.',
    rarity: 'COMMON',
    icon: '💨',
    synergyTag: 'PRESSURE',
    applyEffect: (_context: FlagshipUpdateContext) => {
      // Handled via EndlessDescentManager calculation modifiers
    },
  },
  {
    id: 'boon_barometric_siphon',
    nameKo: '기압식 화력 사이펀',
    nameEn: 'Barometric Energy Siphon',
    descriptionKo: '선체 스트레스 5%마다 무기 공격력이 +2%씩 증가하여 위기 시 극대 화력을 냅니다.',
    descriptionEn: 'Gain +2% weapon damage per 5% hull stress, turning danger into raw firepower.',
    rarity: 'RARE',
    icon: '⚙️',
    synergyTag: 'PRESSURE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.speed = Math.min(480, context.player.speed + 30);
    },
  },
  {
    id: 'boon_concussive_baffles',
    nameKo: '충격파 분출 배플',
    nameEn: 'Pneumatic Shock Baffles',
    descriptionKo: '밸러스트 배출 시 180px의 압축 증기 충격파를 방출하여 주변 탄막을 지우고 적을 밀쳐냅니다.',
    descriptionEn: 'Venting ballast emits a 180px steam shockwave vaporizing bullets and knocking back foes.',
    rarity: 'RARE',
    icon: '🌊',
    synergyTag: 'PRESSURE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.createExplosion(context.player.position.x + 20, context.player.position.y, '#06b6d4', 25, 2.0);
    },
  },
  {
    id: 'boon_emergency_ballast_jettison',
    nameKo: '비상 밸러스트 즉시 투발',
    nameEn: 'Emergency Ballast Jettison',
    descriptionKo: '치명적 피해 시 자동 발동: 3초 무적, 스트레스 0% 리셋, 전 화면 150 심해폭탄 기폭 (런당 1회).',
    descriptionEn: 'On lethal damage: 3s invulnerability, clears 100% stress, detonates 150-dmg screen burst (1/run).',
    rarity: 'LEGENDARY',
    icon: '🚨',
    synergyTag: 'PRESSURE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.hp = Math.min(context.player.maxHp, context.player.hp + 2);
    },
  },

  // ==========================================================================
  // DEFENSE & HULL SYNERGIES (16..20)
  // ==========================================================================
  {
    id: 'boon_nanite_welding',
    nameKo: '나노머신 용접 페이스트',
    nameEn: 'Nanite Hull Welding',
    descriptionKo: '체력 용기 +1 회복 및 모든 바리케이드 내구도를 35% 즉시 수복합니다.',
    descriptionEn: 'Restores +1 HP container and instantly repairs all barricades by 35%.',
    rarity: 'COMMON',
    icon: '🔧',
    synergyTag: 'DEFENSE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.hp = Math.min(context.player.maxHp, context.player.hp + 1);
      for (const b of context.barricades) {
        b.hp = Math.min(b.maxHp, b.hp + Math.floor(b.maxHp * 0.35));
      }
    },
  },
  {
    id: 'boon_acid_shielding',
    nameKo: '심해 산성 중화 피막',
    nameEn: 'Acid Neutralizing Membrane',
    descriptionKo: '산성 쉴드를 영구 획득하여 산성비 및 포자 구름 피해를 완전히 무효화합니다.',
    descriptionEn: 'Permanently equips Acid Shield, granting complete immunity to acid rain and spores.',
    rarity: 'COMMON',
    icon: '🧪',
    synergyTag: 'DEFENSE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.hasAcidShield = true;
    },
  },
  {
    id: 'boon_reactive_cavitation_armor',
    nameKo: '반응성 수중 기포 장갑',
    nameEn: 'Reactive Cavitation Armor',
    descriptionKo: '피격 시 방어 기포 3개를 자동 생성하여 다음 적 탄환 3발을 요격 흡수합니다.',
    descriptionEn: 'Taking damage generates 3 cavitation defense bubbles intercepting hostile fire.',
    rarity: 'RARE',
    icon: '🫧',
    synergyTag: 'DEFENSE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.invincibilityTimer = Math.max(context.player.invincibilityTimer, 1.8);
    },
  },
  {
    id: 'boon_cryo_bulkhead',
    nameKo: '극저온 접촉 격벽',
    nameEn: 'Sub-Zero Contact Bulkhead',
    descriptionKo: '적 충돌 피해를 50% 경감하며, 충돌한 돌격형 적을 2.5초간 동결시킵니다.',
    descriptionEn: 'Reduces collision damage by 50% and freezes colliding diver enemies for 2.5s.',
    rarity: 'RARE',
    icon: '❄️',
    synergyTag: 'DEFENSE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.maxHp = Math.min(9, context.player.maxHp + 1);
    },
  },
  {
    id: 'boon_leviathan_chitin',
    nameKo: '레비아탄 고대 갑각',
    nameEn: 'Ancient Leviathan Chitin',
    descriptionKo: '최대 체력 컨테이너 +2 영구 증가 및 30초마다 체력 1 자동 재생.',
    descriptionEn: 'Max HP containers +2 permanently and passively regenerates 1 HP every 30 seconds.',
    rarity: 'LEGENDARY',
    icon: '👑',
    synergyTag: 'DEFENSE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.maxHp += 2;
      context.player.hp = Math.min(context.player.maxHp, context.player.hp + 2);
    },
  },

  // ==========================================================================
  // DRONE & UTILITY SYNERGIES (21..24)
  // ==========================================================================
  {
    id: 'boon_remora_scout_drone',
    nameKo: '빨판상어 정찰 드론',
    nameEn: 'Aegis Remora Scout Drone',
    descriptionKo: '함선 주위를 선회하며 가장 가까운 적을 자동 사격하는 방호 드론을 1기 배치합니다.',
    descriptionEn: 'Deploys an escort drone orbiting the hull and auto-firing at nearest hostiles.',
    rarity: 'COMMON',
    icon: '🤖',
    synergyTag: 'DRONE',
    applyEffect: (context: FlagshipUpdateContext) => {
      // Spawn ally helper if available
      context.player.speed = Math.min(450, context.player.speed + 25);
    },
  },
  {
    id: 'boon_salvage_magnetometer',
    nameKo: '고자기장 인양 자석',
    nameEn: 'Salvage Magnetometer',
    descriptionKo: '순수 수자원 아이템 흡인 반경이 +90px 증가하고 수자원 획득량이 +25% 증가합니다.',
    descriptionEn: 'Pure water collection radius increased by +90px and yield boosted by +25%.',
    rarity: 'COMMON',
    icon: '🧲',
    synergyTag: 'DRONE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.currency += 100;
    },
  },
  {
    id: 'boon_acoustic_weakpoint_beacon',
    nameKo: '음향 약점 조준 비콘',
    nameEn: 'Acoustic Weakpoint Beacon',
    descriptionKo: '소나 스윕에 탐지된 적이 음향 태그되어 아군 모든 공격에 +30% 추가 피해를 입습니다.',
    descriptionEn: 'Enemies swept by tactical sonar take +30% amplified damage from all attacks.',
    rarity: 'RARE',
    icon: '📡',
    synergyTag: 'DRONE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.multiShot = Math.max(context.player.multiShot, 2);
    },
  },
  {
    id: 'boon_autonomous_repair_matrix',
    nameKo: '자율 복구 나노 매트릭스',
    nameEn: 'Autonomous Repair Matrix',
    descriptionKo: '매 웨이브 시작 시 모든 바리케이드를 완충하고 플레이어 체력을 1 회복합니다.',
    descriptionEn: 'Fully repairs all barricades and restores 1 player HP at the start of every wave.',
    rarity: 'LEGENDARY',
    icon: '💠',
    synergyTag: 'DRONE',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.hp = Math.min(context.player.maxHp, context.player.hp + 2);
      for (const b of context.barricades) {
        b.hp = b.maxHp;
      }
    },
  },
];

// ============================================================================
// FAUSTIAN ABYSSAL CURSES (25..30)
// High-Risk High-Reward Corrupted Artifacts
// ============================================================================
export const CURSE_CARDS: BoonCard[] = [
  {
    id: 'curse_leviathans_maw',
    nameKo: '레비아탄의 끝없는 아귀',
    nameEn: "Leviathan's Voracious Maw",
    descriptionKo: '모든 무기 피해량이 +150% 증폭되지만, 잠수함 기동 속도가 -35% 감소하고 피격 판정이 +25% 커집니다.',
    descriptionEn: '+150% weapon damage, but submarine speed reduced by -35% and hitbox size +25%.',
    rarity: 'CORRUPTED',
    icon: '🩸',
    synergyTag: 'CURSE',
    cursePenaltyKo: '기동 속도 -35%, 피격 판정 +25%',
    cursePenaltyEn: 'Submarine speed -35%, hitbox +25%',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.multiShot = Math.max(4, context.player.multiShot + 2);
      context.player.speed = Math.max(140, context.player.speed * 0.65);
      context.player.size.width = Math.floor(context.player.size.width * 1.25);
      context.player.size.height = Math.floor(context.player.size.height * 1.25);
    },
  },
  {
    id: 'curse_abyssal_overcharge',
    nameKo: '심연 과부하 노심',
    nameEn: 'Abyssal Reactor Overcharge',
    descriptionKo: '사격 연사 속도 +100% 및 관통력 +2 영구 부여. 단, 심해 수압 스트레스 축적 속도가 100% 빨라집니다.',
    descriptionEn: '+100% fire rate and +2 piercing, but hydrostatic pressure accumulates 100% faster.',
    rarity: 'CORRUPTED',
    icon: '☢️',
    synergyTag: 'CURSE',
    cursePenaltyKo: '수압 스트레스 증가 속도 2배',
    cursePenaltyEn: 'Pressure stress builds 100% faster',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.baseFireRate = Math.max(0.12, context.player.baseFireRate * 0.5);
      context.player.piercing = (context.player.piercing || 1) + 2;
    },
  },
  {
    id: 'curse_corrupted_singularity',
    nameKo: '오염된 중력 특이점',
    nameEn: 'Corrupted Singularity Core',
    descriptionKo: '캐비테이션 폭발이 전 화면의 적들을 중앙으로 강력히 흡인하지만, 75% 스트레스부터 선체 누수가 시작됩니다.',
    descriptionEn: 'Cavitation explosions suction all foes to center, but hull breaches trigger at 75% stress.',
    rarity: 'CORRUPTED',
    icon: '🌀',
    synergyTag: 'CURSE',
    cursePenaltyKo: '선체 누수 한계치가 100%에서 75%로 조기 강등',
    cursePenaltyEn: 'Hull breaches trigger early at 75% stress',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.homingMissiles = Math.min(5, context.player.homingMissiles + 3);
    },
  },
  {
    id: 'curse_blood_tide_symbiote',
    nameKo: '적조 기생 공생체',
    nameEn: 'Blood-Tide Parasite Symbiote',
    descriptionKo: '적 처치 시마다 순수 수자원 +10 및 필살기 게이지 5% 획득. 단, 최대 체력이 영구히 2칸으로 제한됩니다.',
    descriptionEn: 'Kills grant +10 Water and 5% Ultimate, but max HP is permanently capped at 2 containers.',
    rarity: 'CORRUPTED',
    icon: '🪱',
    synergyTag: 'CURSE',
    cursePenaltyKo: '최대 체력이 2칸으로 영구 고정 (추가 체력 획득 불가)',
    cursePenaltyEn: 'Max HP permanently clamped to 2 containers',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.player.maxHp = 2;
      context.player.hp = Math.min(2, context.player.hp);
      context.currency += 200;
    },
  },
  {
    id: 'curse_benthic_tremor_engine',
    nameKo: '해저 진동 지진 엔진',
    nameEn: 'Benthic Tremor Engine',
    descriptionKo: '상시 전 화면 지진파를 일으켜 모든 적에게 초당 12의 지속 피해를 주지만, 잠수함 조작 시 관성 미끄러짐이 발생합니다.',
    descriptionEn: 'Passive screen tremor deals 12 DPS to all enemies, but adds 30% inertial drift to movement.',
    rarity: 'CORRUPTED',
    icon: '🌋',
    synergyTag: 'CURSE',
    cursePenaltyKo: '기동 조작 시 미끄러짐 관성 30% 발생',
    cursePenaltyEn: '30% slippery hydrodynamic drift inertia',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.triggerScreenShake(0.5, 4);
    },
  },
  {
    id: 'curse_faustian_abyssal_pact',
    nameKo: '파우스트의 심연 계약',
    nameEn: 'Faustian Abyssal Pact',
    descriptionKo: '즉시 순수 수자원 +600 및 점수 +15,000 획득. 단, 다음 3개 구역의 적 출현량 +50% 및 적 체력 +30% 증가.',
    descriptionEn: 'Instantly gain +600 Pure Water and +15k score. Next 3 nodes spawn +50% foes with +30% HP.',
    rarity: 'CORRUPTED',
    icon: '📜',
    synergyTag: 'CURSE',
    cursePenaltyKo: '다음 3개 전투 구역 적 생성량 +50%, 적 체력 +30%',
    cursePenaltyEn: 'Next 3 combat zones have +50% enemy density, +30% HP',
    applyEffect: (context: FlagshipUpdateContext) => {
      context.currency += 600;
      context.score += 15000;
    },
  },
];

export const ALL_BOON_CARDS: BoonCard[] = [...BOON_CARDS, ...CURSE_CARDS];

export class BoonDraftDeck {
  /**
   * Generates a 3-card draft according to weighted rarity distribution
   * Common: 60%, Rare: 28%, Legendary: 9%, Corrupted: 3%
   * If forceCurse is true (e.g. at Sunken Shrine), at least 1 or all cards are Corrupted
   */
  public static getRandomDraft(count: number = 3, forceCurse: boolean = false): BoonCard[] {
    const selected: BoonCard[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < count; i++) {
      let targetRarity: BoonRarity;

      if (forceCurse) {
        // High chance of corrupted card at sunken shrine
        targetRarity = Math.random() < 0.7 ? 'CORRUPTED' : 'LEGENDARY';
      } else {
        const roll = Math.random();
        if (roll < 0.6) {
          targetRarity = 'COMMON';
        } else if (roll < 0.88) {
          targetRarity = 'RARE';
        } else if (roll < 0.97) {
          targetRarity = 'LEGENDARY';
        } else {
          targetRarity = 'CORRUPTED';
        }
      }

      // Filter available cards by rarity and uniqueness
      let pool = ALL_BOON_CARDS.filter((c) => c.rarity === targetRarity && !usedIds.has(c.id));

      // Fallback if pool exhausted
      if (pool.length === 0) {
        pool = ALL_BOON_CARDS.filter((c) => !usedIds.has(c.id));
      }
      if (pool.length === 0) {
        pool = ALL_BOON_CARDS;
      }

      const card = pool[Math.floor(Math.random() * pool.length)];
      selected.push(card);
      usedIds.add(card.id);
    }

    return selected;
  }

  /**
   * Returns styling and palette for card rarity borders & banners
   */
  public static getRarityTheme(rarity: BoonRarity): {
    border: string;
    background: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
    nameKo: string;
    nameEn: string;
  } {
    switch (rarity) {
      case 'COMMON':
        return {
          border: '#06b6d4',
          background: 'rgba(6, 182, 212, 0.12)',
          badgeBg: '#0891b2',
          badgeText: '#ecfeff',
          glow: 'rgba(6, 182, 212, 0.5)',
          nameKo: '일반 (Common)',
          nameEn: 'Common',
        };
      case 'RARE':
        return {
          border: '#a855f7',
          background: 'rgba(168, 85, 247, 0.14)',
          badgeBg: '#7e22ce',
          badgeText: '#faf5ff',
          glow: 'rgba(168, 85, 247, 0.6)',
          nameKo: '희귀 (Rare)',
          nameEn: 'Rare',
        };
      case 'LEGENDARY':
        return {
          border: '#f59e0b',
          background: 'rgba(245, 158, 11, 0.16)',
          badgeBg: '#b45309',
          badgeText: '#fffbeb',
          glow: 'rgba(245, 158, 11, 0.7)',
          nameKo: '전설 (Legendary)',
          nameEn: 'Legendary',
        };
      case 'CORRUPTED':
        return {
          border: '#ef4444',
          background: 'rgba(239, 68, 68, 0.20)',
          badgeBg: '#991b1b',
          badgeText: '#fef2f2',
          glow: 'rgba(239, 68, 68, 0.8)',
          nameKo: '심연의 저주 (Corrupted)',
          nameEn: 'Corrupted Curse',
        };
    }
  }
}

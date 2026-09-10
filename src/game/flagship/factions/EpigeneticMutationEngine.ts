// ============================================================================
// WATER INVADER: EPIGENETIC REACTIVE MUTATION ENGINE
// Feature 8: Dynamic Enemy Adaptation to Player Weapon Doctrines
// ============================================================================

import { HadalMutationType, DamageProfileTracker } from '../types';

export interface MutationAnalysis {
  activeMutation: HadalMutationType;
  kineticRatio: number;
  missileRatio: number;
  pierceRatio: number;
  totalDamage: number;
  adaptationDescriptionKo: string;
  adaptationDescriptionEn: string;
  mitigationPercent: number; // Capped at 40%
  alertBannerText: string | null;
}

export interface WeaponMitigationResult {
  finalDamage: number;
  mitigatedAmount: number;
  effectTriggered?: string;
  isSpoofed?: boolean; // For homing missiles
  absorbsPiercing?: boolean; // For piercing bullets
}

export class EpigeneticMutationEngine {
  private damageHistory: DamageProfileTracker = {
    kinetic: 0,
    missile: 0,
    pierce: 0,
    windowDuration: 0,
  };

  private activeMutation: HadalMutationType = 'NONE';
  private mutationProgress: number = 0; // 0 to 100%
  private alertBannerTimer: number = 0;
  private alertBannerText: string | null = null;
  private bannerDuration: number = 4.0; // Display for 4 seconds on metamorphosis

  // Strict invariant: Capped at 40% mitigation
  public static readonly MAX_MITIGATION_CAP = 0.40;
  public static readonly KINETIC_THRESHOLD = 0.50; // > 50% kinetic triggers Anti-Kinetic Calcification
  public static readonly MISSILE_THRESHOLD = 0.40; // > 40% missile triggers Bioluminescent Chaff
  public static readonly PIERCE_THRESHOLD = 0.40;  // > 40% pierce triggers Amoebic Viscous Flesh
  public static readonly ATROPHY_THRESHOLD = 0.30;  // Drops below 30% triggers atrophy back to NONE

  constructor() {
    this.reset();
  }

  /**
   * Record damage dealt to Hadal entities to build the rolling weapon telemetry.
   */
  public recordDamage(type: 'kinetic' | 'missile' | 'pierce', amount: number): void {
    if (amount <= 0) return;
    this.damageHistory[type] += amount;
  }

  /**
   * Evaluates weapon telemetry at wave transitions or evaluation intervals.
   * Evolves counter-mutations based on dominant weapon doctrine.
   */
  public evaluateWaveTransition(waveNumber: number): MutationAnalysis {
    const total = this.damageHistory.kinetic + this.damageHistory.missile + this.damageHistory.pierce;
    
    if (total <= 0) {
      return this.getCurrentAnalysis();
    }

    const kineticRatio = this.damageHistory.kinetic / total;
    const missileRatio = this.damageHistory.missile / total;
    const pierceRatio = this.damageHistory.pierce / total;

    let targetMutation: HadalMutationType = 'NONE';

    // Priority tie-breaker: Missile > Kinetic > Pierce
    if (missileRatio >= EpigeneticMutationEngine.MISSILE_THRESHOLD) {
      targetMutation = 'BIOLUMINESCENT_CHAFF';
    } else if (kineticRatio >= EpigeneticMutationEngine.KINETIC_THRESHOLD) {
      targetMutation = 'ANTI_KINETIC_CALCIFICATION';
    } else if (pierceRatio >= EpigeneticMutationEngine.PIERCE_THRESHOLD) {
      targetMutation = 'AMOEBIC_VISCOUS_FLESH';
    } else {
      // Check for atrophy if current mutation drops below atrophy threshold
      if (this.activeMutation === 'BIOLUMINESCENT_CHAFF' && missileRatio < EpigeneticMutationEngine.ATROPHY_THRESHOLD) {
        targetMutation = 'NONE';
      } else if (this.activeMutation === 'ANTI_KINETIC_CALCIFICATION' && kineticRatio < EpigeneticMutationEngine.ATROPHY_THRESHOLD) {
        targetMutation = 'NONE';
      } else if (this.activeMutation === 'AMOEBIC_VISCOUS_FLESH' && pierceRatio < EpigeneticMutationEngine.ATROPHY_THRESHOLD) {
        targetMutation = 'NONE';
      } else {
        targetMutation = this.activeMutation;
      }
    }

    if (targetMutation !== this.activeMutation) {
      this.activeMutation = targetMutation;
      this.mutationProgress = targetMutation === 'NONE' ? 0 : 100;
      this.triggerAlertBanner(targetMutation);
    }

    // Decay 50% of history for a rolling 2-wave window
    this.damageHistory.kinetic *= 0.5;
    this.damageHistory.missile *= 0.5;
    this.damageHistory.pierce *= 0.5;

    return this.getCurrentAnalysis();
  }

  private triggerAlertBanner(mutation: HadalMutationType): void {
    if (mutation === 'NONE') {
      this.alertBannerText = '⚠️ 군체 돌연변이 퇴화 // 생체 저항 정상화';
    } else if (mutation === 'ANTI_KINETIC_CALCIFICATION') {
      this.alertBannerText = '⚠️ HIVE METAMORPHOSIS DETECTED (하달 군체 변태 감지) // 다이아몬드 갑각 경화 (운동 에너지 방어 +40%)';
    } else if (mutation === 'BIOLUMINESCENT_CHAFF') {
      this.alertBannerText = '⚠️ HIVE METAMORPHOSIS DETECTED (하달 군체 변태 감지) // 발광성 페로몬 채프 (유도 미사일 교란)';
    } else if (mutation === 'AMOEBIC_VISCOUS_FLESH') {
      this.alertBannerText = '⚠️ HIVE METAMORPHOSIS DETECTED (하달 군체 변태 감지) // 아메바형 점성 육질 (관통 충격 흡수)';
    }
    this.alertBannerTimer = this.bannerDuration;
  }

  /**
   * Applies active epigenetic mitigations to incoming damage.
   * Invariant: mitigation is strictly capped at 40% (0.40).
   */
  public calculateMitigation(
    rawDamage: number,
    weaponType: 'kinetic' | 'missile' | 'pierce'
  ): WeaponMitigationResult {
    if (rawDamage <= 0) {
      return { finalDamage: 0, mitigatedAmount: 0 };
    }

    let mitigationRatio = 0.0;
    let effectTriggered: string | undefined;
    let isSpoofed = false;
    let absorbsPiercing = false;

    switch (this.activeMutation) {
      case 'ANTI_KINETIC_CALCIFICATION':
        if (weaponType === 'kinetic') {
          // 40% mitigation against kinetic weapon spray
          mitigationRatio = EpigeneticMutationEngine.MAX_MITIGATION_CAP;
          effectTriggered = 'DIAMOND_CALCIFICATION_DEFLECT';
        }
        break;

      case 'BIOLUMINESCENT_CHAFF':
        if (weaponType === 'missile') {
          // 50% chance to decoy missile, plus 40% blast dampening
          isSpoofed = Math.random() < 0.50;
          mitigationRatio = EpigeneticMutationEngine.MAX_MITIGATION_CAP;
          effectTriggered = 'CHAFF_PHEROMONE_DISRUPT';
        }
        break;

      case 'AMOEBIC_VISCOUS_FLESH':
        if (weaponType === 'pierce') {
          // Absorbs multi-penetration, caps pierce damage by 40%
          mitigationRatio = EpigeneticMutationEngine.MAX_MITIGATION_CAP;
          absorbsPiercing = true;
          effectTriggered = 'VISCOUS_FLESH_ABSORPTION';
        }
        break;

      case 'NONE':
      default:
        mitigationRatio = 0.0;
        break;
    }

    // Clamp mitigation ratio strictly to 0.40
    const clampedMitigation = Math.min(EpigeneticMutationEngine.MAX_MITIGATION_CAP, Math.max(0, mitigationRatio));
    const mitigatedAmount = Math.round(rawDamage * clampedMitigation * 10) / 10;
    const finalDamage = Math.max(0.5, rawDamage - mitigatedAmount);

    return {
      finalDamage,
      mitigatedAmount,
      effectTriggered,
      isSpoofed,
      absorbsPiercing,
    };
  }

  public update(deltaTime: number): void {
    if (this.alertBannerTimer > 0) {
      this.alertBannerTimer -= deltaTime;
      if (this.alertBannerTimer <= 0) {
        this.alertBannerText = null;
      }
    }
  }

  public getActiveMutation(): HadalMutationType {
    return this.activeMutation;
  }

  public setActiveMutation(mutation: HadalMutationType): void {
    this.activeMutation = mutation;
    this.mutationProgress = mutation === 'NONE' ? 0 : 100;
  }

  public getMutationProgress(): number {
    return this.mutationProgress;
  }

  public getDamageHistory(): DamageProfileTracker {
    return { ...this.damageHistory };
  }

  public getAlertBannerText(): string | null {
    return this.alertBannerText;
  }

  public getAlertBannerTimer(): number {
    return this.alertBannerTimer;
  }

  public getCurrentAnalysis(): MutationAnalysis {
    const total = this.damageHistory.kinetic + this.damageHistory.missile + this.damageHistory.pierce;
    const kineticRatio = total > 0 ? this.damageHistory.kinetic / total : 0;
    const missileRatio = total > 0 ? this.damageHistory.missile / total : 0;
    const pierceRatio = total > 0 ? this.damageHistory.pierce / total : 0;

    let descKo = '활성화된 적응 없음 (생체 조직 취약 상태)';
    let descEn = 'No active mutation (Baseline biological vulnerability)';
    let mitPercent = 0;

    if (this.activeMutation === 'ANTI_KINETIC_CALCIFICATION') {
      descKo = '다이아몬드 갑각 석회화: 일반 탄환 데미지 40% 감쇄';
      descEn = 'Anti-Kinetic Calcification: 40% Kinetic damage mitigation';
      mitPercent = 40;
    } else if (this.activeMutation === 'BIOLUMINESCENT_CHAFF') {
      descKo = '생체 발광 페로몬 채프: 유도 미사일 50% 교란 및 폭발 40% 감쇄';
      descEn = 'Bioluminescent Chaff: 50% missile spoof & 40% explosive mitigation';
      mitPercent = 40;
    } else if (this.activeMutation === 'AMOEBIC_VISCOUS_FLESH') {
      descKo = '아메바형 점성 육질: 관통 탄환 추가 관통 저지 및 40% 피해 흡수';
      descEn = 'Amoebic Viscous Flesh: Halts bullet piercing & absorbs 40% damage';
      mitPercent = 40;
    }

    return {
      activeMutation: this.activeMutation,
      kineticRatio,
      missileRatio,
      pierceRatio,
      totalDamage: total,
      adaptationDescriptionKo: descKo,
      adaptationDescriptionEn: descEn,
      mitigationPercent: mitPercent,
      alertBannerText: this.alertBannerText,
    };
  }

  public reset(): void {
    this.damageHistory = {
      kinetic: 0,
      missile: 0,
      pierce: 0,
      windowDuration: 0,
    };
    this.activeMutation = 'NONE';
    this.mutationProgress = 0;
    this.alertBannerTimer = 0;
    this.alertBannerText = null;
  }
}

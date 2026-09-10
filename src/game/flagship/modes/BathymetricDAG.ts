// ============================================================================
// WATER INVADER: FEATURE 11 - BATHYMETRIC DESCENT DAG GENERATOR
// ============================================================================
// Procedural Directed Acyclic Graph generator representing the submarine descent
// from 0m to 11,000m+ across 5 distinct oceanic sectors.

import { DescentMapNode, DescentNodeType } from '../types';

export type SectorTier = 1 | 2 | 3 | 4 | 5;

export interface SectorInfo {
  tier: SectorTier;
  nameKo: string;
  nameEn: string;
  depthStartMeters: number;
  depthEndMeters: number;
  pressureStartBar: number;
  pressureEndBar: number;
  hazardMultiplier: number;
  accentColor: string;
  descriptionKo: string;
  descriptionEn: string;
}

export const SECTOR_DEFINITIONS: Record<SectorTier, SectorInfo> = {
  1: {
    tier: 1,
    nameKo: '햇빛 및 박명층 (0m ~ 2,000m)',
    nameEn: 'Sunlight & Twilight Zone (0m - 2,000m)',
    depthStartMeters: 0,
    depthEndMeters: 2000,
    pressureStartBar: 1.0,
    pressureEndBar: 200.0,
    hazardMultiplier: 1.0,
    accentColor: '#38bdf8',
    descriptionKo: '태양광이 희미해지는 얕은 바다. 침략자 정찰대와 유실된 보급선이 표류합니다.',
    descriptionEn: 'Shallow sea where sunlight fades. Invader scouts and adrift supply caches drift here.',
  },
  2: {
    tier: 2,
    nameKo: '자정 반심해대 (2,000m ~ 4,000m)',
    nameEn: 'Midnight Bathypelagic Zone (2,000m - 4,000m)',
    depthStartMeters: 2000,
    depthEndMeters: 4000,
    pressureStartBar: 200.0,
    pressureEndBar: 400.0,
    hazardMultiplier: 1.25,
    accentColor: '#818cf8',
    descriptionKo: '완전한 암흑의 시작. 생체 발광 포식자와 고압 열수 분출구가 등장합니다.',
    descriptionEn: 'Complete darkness begins. Bioluminescent predators and hydrothermal vents emerge.',
  },
  3: {
    tier: 3,
    nameKo: '심해 평원 (4,000m ~ 6,000m)',
    nameEn: 'Abyssal Plains (4,000m - 6,000m)',
    depthStartMeters: 4000,
    depthEndMeters: 6000,
    pressureStartBar: 400.0,
    pressureEndBar: 600.0,
    hazardMultiplier: 1.55,
    accentColor: '#a855f7',
    descriptionKo: '광활한 해저 진흙 평원. 고대 자동기계 군단의 방진과 수몰된 신전이 잠들어 있습니다.',
    descriptionEn: 'Vast abyssal plains. Ancient automaton phalanxes and sunken shrines lie dormant.',
  },
  4: {
    tier: 4,
    nameKo: '초심해 해구 및 균열 (6,000m ~ 10,000m)',
    nameEn: 'Hadal Trench & Fissures (6,000m - 10,000m)',
    depthStartMeters: 6000,
    depthEndMeters: 10000,
    pressureStartBar: 600.0,
    pressureEndBar: 1000.0,
    hazardMultiplier: 1.9,
    accentColor: '#f43f5e',
    descriptionKo: '마리아나 해구의 극한 수압. 선포식 변이 군집과 치명적인 해류가 압박합니다.',
    descriptionEn: 'Extreme Marianas pressure. Hadal bio-horror hives and deadly currents crush the hull.',
  },
  5: {
    tier: 5,
    nameKo: '챌린저 특이점 심연 (10,000m ~ 11,000m+)',
    nameEn: 'Challenger Singularity (10,000m - 11,000m+)',
    depthStartMeters: 10000,
    depthEndMeters: 11500,
    pressureStartBar: 1000.0,
    pressureEndBar: 1150.0,
    hazardMultiplier: 2.35,
    accentColor: '#e11d48',
    descriptionKo: '미지의 시공간 특이점. 심해 최상위 군주 크라켄 프라임과 SMS 레비아탄이 지배합니다.',
    descriptionEn: 'Uncharted abyssal singularity. Dominated by Apex Titans Kraken Prime and SMS Leviathan.',
  },
};

export class BathymetricDAG {
  /**
   * Returns metadata for the given sector tier.
   */
  public static getSectorInfo(tier: SectorTier): SectorInfo {
    return SECTOR_DEFINITIONS[tier] || SECTOR_DEFINITIONS[1];
  }

  /**
   * Generates a fully connected procedural DAG for the specified depth sector.
   * Strata count: 8 rows (Stratum 1 = Entry, Stratum 8 = Milestone/Boss).
   * 2 to 4 nodes per row with clean forward planar routing.
   */
  public static generateSectorDAG(sectorTier: SectorTier = 1): Record<string, DescentMapNode> {
    const info = this.getSectorInfo(sectorTier);
    const nodes: Record<string, DescentMapNode> = {};
    const strataCount = 8;
    const strataLayout: DescentMapNode[][] = [];

    // 1. Generate node definitions per stratum
    for (let stratum = 1; stratum <= strataCount; stratum++) {
      const rowNodes: DescentMapNode[] = [];
      const nodeCount = this.getNodeCountForStratum(stratum);

      // Depth progression with slight random variance
      const stratumRatio = (stratum - 1) / (strataCount - 1);
      const baseDepth =
        info.depthStartMeters + stratumRatio * (info.depthEndMeters - info.depthStartMeters);

      for (let idx = 0; idx < nodeCount; idx++) {
        const id = `s${stratum}_n${idx}`;
        const depthJitter = Math.floor((Math.random() - 0.5) * 80);
        const depthMeters = Math.max(0, Math.floor(baseDepth + depthJitter));
        const ambientPressureBar = Number((1.0 + depthMeters * 0.1).toFixed(1));
        const type = this.pickNodeType(stratum, strataCount, idx, nodeCount);

        const node: DescentMapNode = {
          id,
          stratum,
          indexInStratum: idx,
          type,
          depthMeters,
          ambientPressureBar,
          connectedDownstreamIds: [],
          isRevealed: stratum === 1, // Stratum 1 is immediately revealed
          isCompleted: false,
        };

        rowNodes.push(node);
        nodes[id] = node;
      }
      strataLayout.push(rowNodes);
    }

    // 2. Build forward-connecting acyclic edges between adjacent strata
    for (let s = 0; s < strataCount - 1; s++) {
      const currentStratum = strataLayout[s];
      const nextStratum = strataLayout[s + 1];

      // Ensure every node in current stratum connects to at least 1 next node
      for (let i = 0; i < currentStratum.length; i++) {
        const currNode = currentStratum[i];
        // Calculate corresponding index in next stratum
        const ratio = i / Math.max(1, currentStratum.length - 1);
        const targetIdx = Math.round(ratio * (nextStratum.length - 1));

        // Connect to primary target
        this.addConnection(currNode, nextStratum[targetIdx].id);

        // Branching: 50% chance to connect to neighbor (avoiding edge crossing)
        if (Math.random() < 0.5) {
          const neighborIdx = targetIdx + (Math.random() < 0.5 ? 1 : -1);
          if (neighborIdx >= 0 && neighborIdx < nextStratum.length) {
            this.addConnection(currNode, nextStratum[neighborIdx].id);
          }
        }
      }

      // Backward sweep: Ensure every node in nextStratum has at least one parent
      for (let j = 0; j < nextStratum.length; j++) {
        const targetNode = nextStratum[j];
        const hasParent = currentStratum.some((p) =>
          p.connectedDownstreamIds.includes(targetNode.id)
        );

        if (!hasParent) {
          // Connect closest parent
          const ratio = j / Math.max(1, nextStratum.length - 1);
          const parentIdx = Math.min(
            currentStratum.length - 1,
            Math.max(0, Math.round(ratio * (currentStratum.length - 1)))
          );
          this.addConnection(currentStratum[parentIdx], targetNode.id);
        }
      }
    }

    return nodes;
  }

  private static addConnection(node: DescentMapNode, targetId: string): void {
    if (!node.connectedDownstreamIds.includes(targetId)) {
      node.connectedDownstreamIds.push(targetId);
      node.connectedDownstreamIds.sort();
    }
  }

  /**
   * Determine node count per row: 2 to 4 nodes
   */
  private static getNodeCountForStratum(stratum: number): number {
    if (stratum === 1) return 2; // Clean entry split
    if (stratum === 8) return 1; // Convergence boss/milestone node
    if (stratum === 7) return 2; // Pre-boss decompression outpost & supply
    // Middle rows (2..6)
    return Math.floor(Math.random() * 2) + 3; // 3 or 4 nodes
  }

  /**
   * Weighted procedural selection of node archetypes based on stratum depth
   */
  private static pickNodeType(
    stratum: number,
    totalStrata: number,
    idx: number,
    totalInRow: number
  ): DescentNodeType {
    // Stratum 1: Starter combat or supply
    if (stratum === 1) {
      return idx === 0 ? DescentNodeType.COMBAT : DescentNodeType.SUPPLY_CACHE;
    }

    // Stratum 8: Final milestone
    if (stratum === totalStrata) {
      return DescentNodeType.ELITE;
    }

    // Stratum 7: Guaranteed decompression outpost & supply cache
    if (stratum === totalStrata - 1) {
      return idx === 0 ? DescentNodeType.OUTPOST : DescentNodeType.SUPPLY_CACHE;
    }

    // Middle strata (2..6) distribution
    const roll = Math.random();
    if (roll < 0.38) {
      return DescentNodeType.COMBAT;
    } else if (roll < 0.58) {
      return DescentNodeType.ELITE;
    } else if (roll < 0.73) {
      return DescentNodeType.HAZARD_ANOMALY;
    } else if (roll < 0.86) {
      return DescentNodeType.SUNKEN_SHRINE;
    } else {
      return DescentNodeType.SUPPLY_CACHE;
    }
  }

  /**
   * Validates whether navigation from current node to target node is valid
   */
  public static canTransition(
    fromNodeId: string | null,
    toNodeId: string,
    nodes: Record<string, DescentMapNode>
  ): boolean {
    const target = nodes[toNodeId];
    if (!target) return false;

    // First stratum entry
    if (!fromNodeId) {
      return target.stratum === 1;
    }

    const current = nodes[fromNodeId];
    if (!current) return false;

    return current.connectedDownstreamIds.includes(toNodeId);
  }

  /**
   * Get all currently accessible next nodes for the player
   */
  public static getNextAvailableNodes(
    currentNodeId: string | null,
    nodes: Record<string, DescentMapNode>
  ): DescentMapNode[] {
    if (!currentNodeId) {
      // Return all stratum 1 nodes
      return Object.values(nodes).filter((n) => n.stratum === 1);
    }

    const current = nodes[currentNodeId];
    if (!current) return [];

    return current.connectedDownstreamIds
      .map((id) => nodes[id])
      .filter((n): n is DescentMapNode => Boolean(n));
  }

  /**
   * Visual styling and palettes for nodes
   */
  public static getNodeTheme(type: DescentNodeType): {
    color: string;
    border: string;
    glow: string;
    symbol: string;
    nameKo: string;
    nameEn: string;
    descKo: string;
    descEn: string;
  } {
    switch (type) {
      case DescentNodeType.COMBAT:
        return {
          color: '#38bdf8',
          border: '#0284c7',
          glow: 'rgba(56, 189, 248, 0.4)',
          symbol: '⚔️',
          nameKo: '전투 구역',
          nameEn: 'Combat Zone',
          descKo: '적 함대 침략 편대와의 교전. 표준 전리품 획득.',
          descEn: 'Engage invader squadrons. Standard salvage rewards.',
        };
      case DescentNodeType.ELITE:
        return {
          color: '#f59e0b',
          border: '#d97706',
          glow: 'rgba(245, 158, 11, 0.5)',
          symbol: '💀',
          nameKo: '정예 급습 지대',
          nameEn: 'Elite Incursion',
          descKo: '강화된 정예 적군 출현. 3-카드 심해 은혜 확정 드래프트.',
          descEn: 'Reinforced elite hostiles. Guaranteed 3-card Boon draft.',
        };
      case DescentNodeType.SUPPLY_CACHE:
        return {
          color: '#10b981',
          border: '#059669',
          glow: 'rgba(16, 185, 129, 0.45)',
          symbol: '📦',
          nameKo: '보급 창고',
          nameEn: 'Supply Cache',
          descKo: '선체 용접 수리 (+2 HP) 및 밸러스트 긴급 정화.',
          descEn: 'Weld hull (+2 HP) and emergency ballast decompression.',
        };
      case DescentNodeType.SUNKEN_SHRINE:
        return {
          color: '#c084fc',
          border: '#9333ea',
          glow: 'rgba(192, 132, 252, 0.5)',
          symbol: '🔮',
          nameKo: '수몰된 심연 사원',
          nameEn: 'Sunken Shrine',
          descKo: '파우스트적 거래: 파멸적 저주를 대가로 극대의 심연 유물 획득.',
          descEn: 'Faustian bargain: acquire extreme Abyssal boons with curses.',
        };
      case DescentNodeType.HAZARD_ANOMALY:
        return {
          color: '#f43f5e',
          border: '#e11d48',
          glow: 'rgba(244, 63, 94, 0.5)',
          symbol: '⚠️',
          nameKo: '환경 이상 구역',
          nameEn: 'Hazard Anomaly',
          descKo: '극단적 열수 분출구 및 심해 해류. 보상 2배 지급.',
          descEn: 'Extreme hydrothermal plumes and currents. Double rewards.',
        };
      case DescentNodeType.OUTPOST:
        return {
          color: '#22d3ee',
          border: '#0891b2',
          glow: 'rgba(34, 211, 238, 0.5)',
          symbol: '⚓',
          nameKo: '심해 전진 기지',
          nameEn: 'Pressure Outpost',
          descKo: '선체 감압 챔버, 탄약 재장전 및 심해 암시장 거래.',
          descEn: 'Decompression chamber, ammo restock, and benthic black market.',
        };
    }
  }
}

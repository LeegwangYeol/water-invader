import { Vector2D, Size, Rect, Faction } from '../types';

/**
 * The six distinct Stellaris-Style End-Game Crisis Archetypes (doubled from original 3)
 */
export enum CrisisArchetype {
  VOID_SOVEREIGN = 'VOID_SOVEREIGN',
  ABYSSAL_LEVIATHAN = 'ABYSSAL_LEVIATHAN',
  CYBERNETIC_EXTERMINATOR = 'CYBERNETIC_EXTERMINATOR',
  CHRONO_DEVOURER = 'CHRONO_DEVOURER',
  SOLARIS_COLOSSUS = 'SOLARIS_COLOSSUS',
  NEBULA_PHANTASM = 'NEBULA_PHANTASM',
}

/**
 * Discrete progression phases of an End-Game Crisis encounter
 */
export enum CrisisPhase {
  INCURSION = 'INCURSION',           // 3.0s cataclysm warning & dimensional rift opening
  PHASE_1_SHIELD = 'PHASE_1_SHIELD', // Sovereign invulnerable while 2 Dimensional Rifts are active
  PHASE_2_HULL = 'PHASE_2_HULL',     // Main hull exposed, archetypal super-weapons active
  PHASE_3_CORE = 'PHASE_3_CORE',     // Enraged cosmic core overdrive with countdown timer
  DEFEATED = 'DEFEATED',             // Cataclysmic death implosion & rewards
}

/**
 * Attack pattern definitions executed by Crisis entities
 */
export type CrisisAttackType =
  | 'DARK_MATTER_BEAM'
  | 'SINGULARITY_VORTEX'
  | 'VOID_NOVA'
  | 'GRAVITATIONAL_PULSE'
  | 'SPORE_SPIRAL'
  | 'BIO_LARVAE_SWARM'
  | 'ACIDIC_BARRAGE'
  | 'ORBITAL_SWEEP_RAILGUN'
  | 'EMP_CASCADE'
  | 'HEX_DEFLECTOR_BURST'
  // Chrono Devourer (Temporal Paradox)
  | 'TACHYON_LANCE'
  | 'TEMPORAL_BURST'
  | 'CHRONO_IMPLOSION'
  // Solaris Colossus (Stellar Hypergiant)
  | 'CORONAL_MASS_EJECTION'
  | 'PROMINENCE_SWEEP'
  | 'SOLAR_SUPERNOVA'
  // Nebula Phantasm (Quantum Spectral Swarm)
  | 'QUANTUM_MIRAGE_NOVA'
  | 'SPECTRAL_PHANTOM_WISP'
  | 'DIMENSIONAL_SHROUD';

export interface CrisisAttackPattern {
  id: string;
  name: string;
  type: CrisisAttackType;
  cooldown: number;
  timer: number;
  duration: number;
  isActive: boolean;
  intensity: number;
}

/**
 * Standard interface contract for Crisis Entities (Sovereign, Rifts, Sub-nodes)
 */
export interface ICrisisEntity {
  position: Vector2D;
  velocity: Vector2D;
  size: Size;
  hp: number;
  maxHp: number;
  isDead: boolean;
  faction: Faction;
  isInvulnerable: boolean;
  flashTimer: number;

  takeDamage(amount: number, piercing?: number): number;
  update(deltaTime: number, ...args: any[]): void;
  draw(ctx: CanvasRenderingContext2D): void;
  getRect(): Rect;
  checkCollision(other: { getRect(): Rect }): boolean;
}

/**
 * Interface contract for Dimensional Rift Anchors
 */
export interface ICrisisRift extends ICrisisEntity {
  riftIndex: number;
  pulsePhase: number;
  accretionDiskAngle: number;
  isShielding: boolean;
  gravitationalPullRadius: number;
  gravitationalPullForce: number;
  getSingularityCenter(): Vector2D;
}

/**
 * Full state structure representing an active End-Game Crisis encounter
 */
export interface EndGameCrisisState {
  isActive: boolean;
  archetype: CrisisArchetype;
  phase: CrisisPhase;
  warningTimer: number;
  totalHp: number;
  maxHp: number;
  enrageTimer: number;
  enrageMaxTime: number;
  riftAnchors: ICrisisEntity[];
  mainBody: ICrisisEntity | null;
  bannerText: string | null;
  vortexPullIntensity: number;
  realityDistortion: number;
  shieldIntegrity: number;
  activeAttack: CrisisAttackPattern | null;
}

/**
 * Archetype balance configuration
 */
export interface CrisisArchetypeConfig {
  name: string;
  subtitle: string;
  riftHp: number;
  sovereignHullHp: number;
  coreHp: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  coreGlowColor: string;
  enrageTime: number;
  vortexStrength: number;
  baseFireRate: number;
}

/**
 * Standard configuration metadata for all 6 Crisis Archetypes
 */
export const CRISIS_ARCHETYPE_CONFIGS: Record<CrisisArchetype, CrisisArchetypeConfig> = {
  [CrisisArchetype.VOID_SOVEREIGN]: {
    name: 'THE VOID SOVEREIGN',
    subtitle: 'EXTRA-DIMENSIONAL CATACLYSM',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#c084fc',
    secondaryColor: '#1e1b4b',
    accentColor: '#38bdf8',
    coreGlowColor: '#ec4899',
    enrageTime: 35.0,
    vortexStrength: 45,
    baseFireRate: 2.2,
  },
  [CrisisArchetype.ABYSSAL_LEVIATHAN]: {
    name: 'THE ABYSSAL LEVIATHAN',
    subtitle: 'CORRUPTED BIO-SWARM HORROR',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#10b981',
    secondaryColor: '#022c22',
    accentColor: '#84cc16',
    coreGlowColor: '#bef264',
    enrageTime: 35.0,
    vortexStrength: 25,
    baseFireRate: 2.2,
  },
  [CrisisArchetype.CYBERNETIC_EXTERMINATOR]: {
    name: 'CYBERNETIC EXTERMINATOR MATRIX',
    subtitle: 'PURIFICATION DREADNOUGHT PROTOCOL',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#ef4444',
    secondaryColor: '#0f172a',
    accentColor: '#06b6d4',
    coreGlowColor: '#f97316',
    enrageTime: 35.0,
    vortexStrength: 20,
    baseFireRate: 2.2,
  },
  [CrisisArchetype.CHRONO_DEVOURER]: {
    name: 'THE CHRONO DEVOURER',
    subtitle: 'TEMPORAL PARADOX HARBINGER',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#fbbf24',
    secondaryColor: '#78350f',
    accentColor: '#fef08a',
    coreGlowColor: '#f59e0b',
    enrageTime: 35.0,
    vortexStrength: 30,
    baseFireRate: 2.0,
  },
  [CrisisArchetype.SOLARIS_COLOSSUS]: {
    name: 'SOLARIS COLOSSUS',
    subtitle: 'STELLAR HYPERGIANT DREADNOUGHT',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#f97316',
    secondaryColor: '#451a03',
    accentColor: '#ef4444',
    coreGlowColor: '#fef08a',
    enrageTime: 35.0,
    vortexStrength: 25,
    baseFireRate: 2.0,
  },
  [CrisisArchetype.NEBULA_PHANTASM]: {
    name: 'THE NEBULA PHANTASM',
    subtitle: 'QUANTUM SPECTRAL SWARM',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#6366f1',
    secondaryColor: '#0f172a',
    accentColor: '#06b6d4',
    coreGlowColor: '#d946ef',
    enrageTime: 35.0,
    vortexStrength: 35,
    baseFireRate: 2.0,
  },
};

/**
 * Crisis Event Callbacks for engine & UI integration
 */
export interface CrisisEventCallbacks {
  onPhaseChange?: (phase: CrisisPhase, prevPhase: CrisisPhase) => void;
  onDefeated?: (archetype: CrisisArchetype) => void;
  onAttackStart?: (attack: CrisisAttackPattern) => void;
  onRiftDestroyed?: (riftIndex: number, remainingRifts: number) => void;
  onRealityDistortion?: (intensity: number) => void;
}

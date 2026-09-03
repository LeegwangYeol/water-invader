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
  // --- 6 New Grand Strategy / Sci-Fi Archetypes ---
  BIOMORPHIC_SWARM = 'BIOMORPHIC_SWARM',
  SINGULARITY_CORE = 'SINGULARITY_CORE',
  NANITE_HARVESTER = 'NANITE_HARVESTER',
  PSIONIC_SHROUD = 'PSIONIC_SHROUD',
  GLACIAL_OBLIVION = 'GLACIAL_OBLIVION',
  COSMIC_DEVOURER = 'COSMIC_DEVOURER',
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
  | 'DIMENSIONAL_SHROUD'
  // Biomorphic Swarm (Extragalactic Chitin Flesh-Hive)
  | 'CORROSIVE_BILE_BARRAGE'
  | 'MANDIBLE_RIPPER_VOLLEY'
  | 'SWARM_INFESTATION'
  // Singularity Core (Supermassive Event Horizon Entity)
  | 'HAWKING_RADIATION_LANCE'
  | 'RELATIVISTIC_JET_FLARE'
  | 'EVENT_HORIZON_IMPLOSION'
  // Nanite Harvester (Grey-Goo Molecular Disassembler)
  | 'MOLECULAR_DISASSEMBLY_RAY'
  | 'SUBATOMIC_NANITE_FLAK'
  | 'GREY_SINGULARITY_STORM'
  // Psionic Shroud (Extra-Dimensional Astral Inmate)
  | 'MIND_FLAY_LANCE'
  | 'TELEKINETIC_DAGGER_HELIX'
  | 'SHROUD_APOCALYPSE_INVERSION'
  // Glacial Oblivion (Absolute Zero Entropic Engine)
  | 'SUB_ZERO_ICICLE_VOLLEY'
  | 'CRYO_THERMAL_DRAIN'
  | 'BLIZZARD_DEEP_FREEZE'
  // Cosmic Devourer (Astral Void Dragon Behemoth)
  | 'SUPERNOVA_BREATH_BEAM'
  | 'ASTRAL_SCALE_SCATTER'
  | 'STAR_DEVOURING_EXTINCTION';

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
 * Standard configuration metadata for all 12 Crisis Archetypes
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
  // --- 6 New Crisis Archetypes (Strict 5,200 EHP Invariant: 600*2 + 2500 + 1500 = 5,200) ---
  [CrisisArchetype.BIOMORPHIC_SWARM]: {
    name: 'THE BIOMORPHIC SWARM',
    subtitle: 'EXTRAGALACTIC CHITIN FLESH-HIVE',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#b91c1c',
    secondaryColor: '#450a0a',
    accentColor: '#f59e0b',
    coreGlowColor: '#84cc16',
    enrageTime: 35.0,
    vortexStrength: 20,
    baseFireRate: 2.2,
  },
  [CrisisArchetype.SINGULARITY_CORE]: {
    name: 'THE SINGULARITY CORE',
    subtitle: 'SUPERMASSIVE EVENT HORIZON ENTITY',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#09090b',
    secondaryColor: '#1e1b4b',
    accentColor: '#ffffff',
    coreGlowColor: '#8b5cf6',
    enrageTime: 35.0,
    vortexStrength: 50,
    baseFireRate: 2.0,
  },
  [CrisisArchetype.NANITE_HARVESTER]: {
    name: 'NANITE HARVESTER NEXUS',
    subtitle: 'GREY-GOO MOLECULAR DISASSEMBLER',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#94a3b8',
    secondaryColor: '#0f172a',
    accentColor: '#14b8a6',
    coreGlowColor: '#06b6d4',
    enrageTime: 35.0,
    vortexStrength: 25,
    baseFireRate: 2.0,
  },
  [CrisisArchetype.PSIONIC_SHROUD]: {
    name: 'THE PSIONIC SHROUD',
    subtitle: 'EXTRA-DIMENSIONAL ASTRAL INMATE',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#7c3aed',
    secondaryColor: '#2e1065',
    accentColor: '#d946ef',
    coreGlowColor: '#fb7185',
    enrageTime: 35.0,
    vortexStrength: 30,
    baseFireRate: 2.0,
  },
  [CrisisArchetype.GLACIAL_OBLIVION]: {
    name: 'GLACIAL OBLIVION',
    subtitle: 'ABSOLUTE ZERO ENTROPIC ENGINE',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#38bdf8',
    secondaryColor: '#0c4a6e',
    accentColor: '#f0f9ff',
    coreGlowColor: '#22d3ee',
    enrageTime: 35.0,
    vortexStrength: 20,
    baseFireRate: 2.0,
  },
  [CrisisArchetype.COSMIC_DEVOURER]: {
    name: 'THE COSMIC DEVOURER',
    subtitle: 'ASTRAL VOID DRAGON BEHEMOTH',
    riftHp: 600,
    sovereignHullHp: 2500,
    coreHp: 1500,
    primaryColor: '#18181b',
    secondaryColor: '#d97706',
    accentColor: '#dc2626',
    coreGlowColor: '#facc15',
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

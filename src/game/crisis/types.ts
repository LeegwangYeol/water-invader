import { Vector2D, Size, Rect, Faction } from '../types';

/**
 * The three distinct Stellaris-Style End-Game Crisis Archetypes
 */
export enum CrisisArchetype {
  VOID_SOVEREIGN = 'VOID_SOVEREIGN',
  ABYSSAL_LEVIATHAN = 'ABYSSAL_LEVIATHAN',
  CYBERNETIC_EXTERMINATOR = 'CYBERNETIC_EXTERMINATOR',
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
  | 'HEX_DEFLECTOR_BURST';

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
 * Crisis Event Callbacks for engine & UI integration
 */
export interface CrisisEventCallbacks {
  onPhaseChange?: (phase: CrisisPhase, prevPhase: CrisisPhase) => void;
  onDefeated?: (archetype: CrisisArchetype) => void;
  onAttackStart?: (attack: CrisisAttackPattern) => void;
  onRiftDestroyed?: (riftIndex: number, remainingRifts: number) => void;
  onRealityDistortion?: (intensity: number) => void;
}

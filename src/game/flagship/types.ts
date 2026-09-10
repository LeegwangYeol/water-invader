// ============================================================================
// WATER INVADER: 12 FLAGSHIP FEATURES UNIFIED TYPES & INTERFACE CONTRACTS
// ============================================================================

import { Entity } from '../Entity';
import { Bullet } from '../Bullet';
import { Player } from '../Player';
import { Enemy } from '../Enemy';
import { Barricade } from '../Barricade';
import { Helper } from '../Helper';
import { Particle } from '../Particle';
import { Vector2D, Size, Rect, GameState, Faction, EnemyType } from '../types';
export { Faction, GameState, EnemyType };
export type { Vector2D, Size, Rect };

// ----------------------------------------------------------------------------
// Flagship Faction & Enemy Type Extensions
// ----------------------------------------------------------------------------

export enum FlagshipFaction {
  HADAL_BIO = 'HADAL_BIO',
  ANCIENT_AUTOMATON = 'ANCIENT_AUTOMATON',
}

export enum FlagshipEnemyType {
  HADAL_CLINGER = 14,
  HADAL_SIPHONER = 15,
  HADAL_COLOSSUS = 16,
  HADAL_ANGLER = 17,
  AUTOMATON_AEGIS = 18,
  AUTOMATON_EMP = 19,
  AUTOMATON_SENTINEL = 20,
  KRAKEN_PRIME = 21,
}

// ----------------------------------------------------------------------------
// Flagship Coordinator Context & Subsystem Lifecycle
// ----------------------------------------------------------------------------

export interface FlagshipUpdateContext {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  barricades: Barricade[];
  helpers: Helper[];
  particles: Particle[];
  level: number;
  score: number;
  currency: number;
  createExplosion: (x: number, y: number, color?: string, count?: number, scale?: number) => void;
  triggerScreenShake: (duration: number, amount: number) => void;
}

export interface IFlagshipSubsystem {
  readonly id: string;
  init?(): void;
  update(deltaTime: number, context: FlagshipUpdateContext): void;
  drawBackground?(ctx: CanvasRenderingContext2D, time: number): void;
  drawWorld?(ctx: CanvasRenderingContext2D, time: number): void;
  drawForeground?(ctx: CanvasRenderingContext2D, time: number): void;
  handleInput?(key: string, isDown: boolean, context: FlagshipUpdateContext): boolean;
  reset?(preserveUpgrades?: boolean, isContinue?: boolean): void;
}

// ============================================================================
// FEATURE 1: CAVITATION TORPEDO & PRESSURE IMPLOSION ORDNANCE
// ============================================================================

export enum TorpedoState {
  READY = 'READY',
  INERT = 'INERT',
  ARMED = 'ARMED',
  SINGULARITY = 'SINGULARITY',
  SHOCKWAVE = 'SHOCKWAVE',
  EXPIRED = 'EXPIRED',
}

export interface CavitationTorpedoConfig {
  v0: number;               // 180 px/s
  aCav: number;             // 420 px/s^2
  vMax: number;             // 580 px/s
  armDistance: number;      // 100 px
  vacuumDuration: number;   // 0.08 s (5 frames)
  vacuumRadius: number;     // 140 px
  pullForceConstant: number;// 85,000 px^3/s^2
  blastDuration: number;    // 0.27 s
  blastRadius: number;      // 150 px
  shockVelocity: number;    // 750 px/s
  baseDamage: number;       // 120 (Lv 1) to 300 (Lv 5)
  pushbackImpulse: number;  // 480 px/s
  barricadeAcousticRadius: number; // 85 px
}

export interface ICavitationTorpedo {
  state: TorpedoState;
  distanceTraveled: number;
  vacuumTimer: number;
  blastTimer: number;
  currentRadius: number;
  position: Vector2D;
  velocity: Vector2D;
  isDead: boolean;
  triggerRemoteDetonation(): boolean;
  update(deltaTime: number, hostiles: Entity[], hostileBullets: Bullet[]): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export interface ICavitationTorpedoSystem extends IFlagshipSubsystem {
  torpedoes: ICavitationTorpedo[];
  torpedoAmmo: number;
  maxTorpedoAmmo: number;
  fireTorpedo(origin: Vector2D): boolean;
  detonateActiveTorpedo(): boolean;
}

// ============================================================================
// FEATURE 2: PRISM LASER & REFRACTION PRISMS
// ============================================================================

export enum LaserHeatZone {
  COOL = 'COOL',                 // 0-49 HU
  WARM = 'WARM',                 // 50-79 HU
  SUPERCHARGED = 'SUPERCHARGED', // 80-99 HU (+25% DPS)
  LOCKOUT = 'LOCKOUT',           // 100 HU (2.2s lockout)
}

export interface RefractionPrism {
  id: string;
  position: Vector2D;
  size: Vector2D;           // 24x24 px
  splitAngles: number[];    // [-35, 0, +35] degrees
  powerRatios: number[];    // [0.6, 0.7, 0.6]
  active: boolean;
}

export interface IPrismLaserSystem extends IFlagshipSubsystem {
  heat: number;             // 0 to 100 HU
  maxHeat: number;          // 100 HU
  isFiring: boolean;
  isLockedOut: boolean;
  lockoutTimer: number;     // 2.2 s
  activePrisms: RefractionPrism[];
  getHeatZone(): LaserHeatZone;
  deployPrism(x: number, y: number): boolean;
  setFiring(firing: boolean): void;
  drawBeam(ctx: CanvasRenderingContext2D, origin: Vector2D): void;
}

// ============================================================================
// FEATURE 3: HYDRAULIC HARPOON & KINETIC SLINGSHOT WINCH
// ============================================================================

export enum HarpoonState {
  READY = 'READY',
  FLYING = 'FLYING',
  TETHERED = 'TETHERED',
  RETRACTING = 'RETRACTING',
}

export interface HarpoonTetherConfig {
  restLength: number;       // 110 px
  maxLength: number;        // 420 px
  springStiffness: number;  // 95.0 N/px
  damping: number;          // 8.5 N*s/px
  winchSpeed: number;       // 240 px/s
  launchSpeed: number;      // 650 px/s
  retractSpeed: number;     // 550 px/s
  slingshotBonus: number;   // 720 px/s
  slingshotDamage: number;  // 180 dmg
}

export interface SlingshotReleaseResult {
  entity: Entity;
  velocity: Vector2D;
  damage: number;
}

export interface IHydraulicHarpoon extends IFlagshipSubsystem {
  state: HarpoonState;
  tetheredEntity: Entity | null;
  currentLength: number;
  strainRatio: number;      // 0.0 to 1.0+
  isWinching: boolean;
  fire(origin: Vector2D): boolean;
  startWinch(): void;
  stopWinch(): void;
  releaseSlingshot(): SlingshotReleaseResult | null;
  conductElectricalShock(voltage: number): void;
  draw(ctx: CanvasRenderingContext2D, playerPos: Vector2D): void;
}

// ============================================================================
// FEATURE 4: HYDROTHERMAL VENTS & DEEP OCEAN CURRENTS
// ============================================================================

export enum VentState {
  DORMANT = 'DORMANT',
  CHARGING = 'CHARGING',
  ERUPTING = 'ERUPTING',
}

export interface MineralNodule {
  position: Vector2D;
  velocity: Vector2D;
  value: number;            // +15 Pure Water
  isDead: boolean;
}

export interface IHydrothermalVent {
  id: string;
  anchorX: number;          // e.g. 180 or 420 px
  baseY: number;            // 760 px
  capY: number;             // 100 px
  coreTemperature: number;  // 380 °C
  state: VentState;
  cycleTimer: number;
  getCoreRadius(y: number): number;
  getHaloRadius(y: number): number;
  isInCore(x: number, y: number): boolean;
  isInHalo(x: number, y: number): boolean;
  update(deltaTime: number, player: Entity, hostiles: Entity[], bullets: Bullet[]): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export interface IOceanCurrent {
  upperShelfVelocityX: number; // +75 px/s
  lowerShelfVelocityX: number; // -60 px/s
  shelfBoundaryY: number;      // 400 px
  getVelocityAt(x: number, y: number): Vector2D;
  applyCurrentDrag(entity: Entity, deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D, time: number): void;
}

export interface IHydrothermalVentManager extends IFlagshipSubsystem {
  vents: IHydrothermalVent[];
  currentSystem: IOceanCurrent;
  nodules: MineralNodule[];
}

// ============================================================================
// FEATURE 5: BIOLAPSE DARKNESS CYCLE & PHOTONIC SEARCHLIGHT
// ============================================================================

export enum BiolapsePhase {
  DIURNAL = 'DIURNAL',      // 60s (Lux 1.0)
  TWILIGHT = 'TWILIGHT',    // 5s  (Lux 1.0 -> 0.0)
  MIDNIGHT = 'MIDNIGHT',    // 25s (Lux 0.0)
  DAWN = 'DAWN',            // 5s  (Lux 0.0 -> 1.0)
}

export interface IBiolapseManager extends IFlagshipSubsystem {
  currentPhase: BiolapsePhase;
  phaseTimer: number;
  ambientLux: number;       // 0.0 to 1.0
  battery: number;          // 0 to 100 units
  maxBattery: number;       // 100 units
  isLightOn: boolean;
  isHighBeam: boolean;
  sonarPingActive: boolean;
  sonarPingTimer: number;
  toggleLight(): boolean;
  setHighBeam(active: boolean): void;
  triggerSonarPing(): boolean;
  isEntityIlluminated(entity: Entity, playerPos: Vector2D, playerVx: number): boolean;
  renderDarknessOverlay(ctx: CanvasRenderingContext2D, playerPos: Vector2D, playerVx: number): void;
}

// ============================================================================
// FEATURE 6: SUBMERSIBLE MODULAR CHASSIS & DEEP-SEA HANGAR
// ============================================================================

export enum ChassisId {
  NAUTILUS = 'NAUTILUS',     // Ironclad Dreadnought
  STINGRAY = 'STINGRAY',     // Deep Recon Interceptor
  KRAKEN = 'KRAKEN',         // Bio-Symbiont
  LEVIATHAN = 'LEVIATHAN',   // Economy Harvester
  GHOST = 'GHOST',           // Stealth Recon
}

export interface ChassisRadarStats {
  speed: number;            // 0-100
  armor: number;            // 0-100
  hardpoints: number;       // 0-100
  energy: number;           // 0-100
  hitboxProfile: number;    // 0-100 (higher = smaller)
  salvage: number;          // 0-100
}

export interface DamageMitigationResult {
  mitigatedDamage: number;
  triggeredEffect?: string;
}

export interface ChassisDefinition {
  id: ChassisId;
  nameKo: string;
  nameEn: string;
  description: string;
  baseHp: number;
  maxHp: number;
  baseSpeed: number;        // px/s
  hitboxWidth: number;      // px
  hitboxHeight: number;     // px
  radarStats: ChassisRadarStats;
  passiveName: string;
  passiveDescription: string;
  onTakeDamage?: (currentHp: number, incomingDamage: number) => DamageMitigationResult;
  onUpdate?: (deltaTime: number, player: Entity) => void;
}

export interface IChassisManager extends IFlagshipSubsystem {
  activeChassis: ChassisDefinition;
  availableChassis: Record<ChassisId, ChassisDefinition>;
  selectChassis(id: ChassisId): boolean;
  applyToPlayer(player: Player): void;
  drawRadarChart(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, chassisId?: ChassisId): void;
}

// ============================================================================
// FEATURE 7: VETERAN CREW SYNERGY DECK
// ============================================================================

export type OfficerId = 'INGRID' | 'JAX' | 'REN' | 'LYRA';
export type OfficerRank = 1 | 2 | 3 | 4; // Ensign, Lieutenant, Commander, Fleet Captain
export type StationId = 'ENGINEERING' | 'GUNNERY' | 'SONAR' | 'BIOLOGY';

export interface OfficerPerk {
  id: string;
  officerId: OfficerId;
  tier: 1 | 2 | 3;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  isActive: boolean;
}

export interface ActiveBridgeAbility {
  id: string;
  officerId: OfficerId;
  nameKo: string;
  nameEn: string;
  keybind: string; // '1' | '2' | '3' | '4' / 'Q' | 'E' | 'R' | 'F'
  cooldown: number; // Base seconds
  currentCooldown: number;
  duration: number; // Active effect duration
  isActive: boolean;
  execute: (context: FlagshipUpdateContext) => void;
}

export interface DualResonance {
  id: string;
  nameKo: string;
  nameEn: string;
  officerA: OfficerId;
  officerB: OfficerId;
  descriptionKo: string;
  descriptionEn: string;
  isActive: boolean;
}

export interface CrewOfficerState {
  id: OfficerId;
  nameKo: string;
  nameEn: string;
  station: StationId;
  rank: OfficerRank;
  unlocked: boolean;
  meritXp: number;
  fatigue: number; // 0 to 100
  isExhausted: boolean; // True if fatigue == 100
  paletteColor: string;
  accentColor: string;
  perks: OfficerPerk[];
  activeAbility: ActiveBridgeAbility;
}

export interface CrewDeckState {
  officers: Record<OfficerId, CrewOfficerState>;
  stationAssignments: Record<StationId, OfficerId | null>;
  activeResonances: DualResonance[];
  isQuadGrandResonanceActive: boolean; // All 4 at Rank 3+
  abyssalCores: number;
  canReviveWithPurge: boolean; // Once per run
}

export interface ICrewManager extends IFlagshipSubsystem {
  state: CrewDeckState;
  assignStation(officerId: OfficerId, stationId: StationId): boolean;
  promoteOfficer(officerId: OfficerId): boolean;
  triggerAbility(officerId: OfficerId, context: FlagshipUpdateContext): boolean;
  triggerSubZeroPurge?(context: FlagshipUpdateContext): boolean;
  drawHUD(ctx: CanvasRenderingContext2D): void;
}

// ============================================================================
// FEATURE 8: MUTATING BIO-HORROR FACTION
// ============================================================================

export type HadalMutationType =
  | 'NONE'
  | 'ANTI_KINETIC_CALCIFICATION'
  | 'BIOLUMINESCENT_CHAFF'
  | 'AMOEBIC_VISCOUS_FLESH'
  | 'PREDATOR_SCENT_HOUNDS';

export interface ParasiteClingerData {
  id: number;
  attachOffset: Vector2D;
  dragIntensity: number; // 0.25 speed reduction
  torqueDirection: -1 | 1;
}

export interface SporeCloudData {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  duration: number;
  remainingLife: number;
}

export interface DamageProfileTracker {
  kinetic: number;
  missile: number;
  pierce: number;
  windowDuration: number;
}

export interface HadalFactionState {
  activeMutation: HadalMutationType;
  mutationProgress: number; // 0 to 100% towards next adaptation
  damageHistory: DamageProfileTracker;
  attachedParasiteCount: number; // Max 3
  activeSporeClouds: SporeCloudData[];
}

export interface IBioHorrorManager extends IFlagshipSubsystem {
  state: HadalFactionState;
  recordDamageDealt(type: 'kinetic' | 'missile' | 'pierce', amount: number): void;
  attachClinger(clinger: ParasiteClingerData): boolean;
  removeClingers(count?: number): number;
  spawnSporeCloud(x: number, y: number, initialRadius: number, maxRadius: number, duration: number): void;
}

// ============================================================================
// FEATURE 9: AUTOMATON SHIELD PHALANX
// ============================================================================

export interface AutomatonDroneNode {
  id: number;
  x: number;
  y: number;
  hp?: number;
  maxHp?: number;
  pendingHullDamage?: number;
  shieldHp: number;
  maxShieldHp: number;
  isFrontalShieldActive: boolean;
  shieldNormal: Vector2D;
  linkedDroneIds: number[];
  isBacklashStunned: boolean;
  stunTimer: number;
}

export interface PhalanxLink {
  droneA: number;
  droneB: number;
  conduitAlpha: number;
}

export interface ShieldPhalanxGrid {
  drones: Map<number, AutomatonDroneNode>;
  links: PhalanxLink[];
  harmonicDampeningFactor: number; // 0.40 (40% damage dampening)
  conduitCouplingDistance: number; // 160px
}

export interface IAutomatonPhalanxManager extends IFlagshipSubsystem {
  grid: ShieldPhalanxGrid;
  registerDrone(drone: AutomatonDroneNode): void;
  unregisterDrone(droneId: number): void;
  distributeDamage(droneId: number, incomingDamage: number): number;
  triggerInductiveBacklash(brokenDroneId: number): void;
}

// ============================================================================
// FEATURE 10: APEX BOSSES
// ============================================================================

export enum ApexBossType {
  CHARYBDIS_PRIME = 'CHARYBDIS_PRIME',
  SMS_LEVIATHAN = 'SMS_LEVIATHAN',
  HADAL_PATRIARCH = 'HADAL_PATRIARCH',
}

export interface IBossSubsystem {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  isDestroyed: boolean;
  localBounds: Rect;
  damageMultiplier: number;
  takeDamage(amount: number): number;
}

export interface ApexBossState {
  type: ApexBossType;
  phase: 1 | 2 | 3;
  totalHp: number;
  maxHp: number;
  subsystems: Map<string, IBossSubsystem>;
  isEnraged: boolean;
  enrageTimer: number; // 45s countdown in Phase 3
  vortexActive: boolean;
  vortexPullForce: number;
  darknessOverlayAlpha: number; // Phase 3 ink blackout (0.0 to 0.88)
}

export interface IApexBossManager extends IFlagshipSubsystem {
  activeBoss: ApexBossState | null;
  spawnApexBoss(type: ApexBossType): void;
}

// ============================================================================
// FEATURE 11: ROGUELIKE ENDLESS DESCENT MODE
// ============================================================================

export enum DescentNodeType {
  COMBAT = 'COMBAT',
  ELITE = 'ELITE',
  SUPPLY_CACHE = 'SUPPLY_CACHE',
  SUNKEN_SHRINE = 'SUNKEN_SHRINE',
  HAZARD_ANOMALY = 'HAZARD_ANOMALY',
  OUTPOST = 'OUTPOST',
}

export type BoonRarity = 'COMMON' | 'RARE' | 'LEGENDARY' | 'CORRUPTED';

export type BoonSynergyTag = 'BULLET' | 'MISSILE' | 'PRESSURE' | 'DEFENSE' | 'DRONE' | 'CURSE';

export interface BoonCard {
  id: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  rarity: BoonRarity;
  icon: string;
  synergyTag: BoonSynergyTag;
  cursePenaltyKo?: string;
  cursePenaltyEn?: string;
  applyEffect: (context: FlagshipUpdateContext) => void;
}

export interface DescentMapNode {
  id: string;
  stratum: number; // Row (1 to 9)
  indexInStratum: number;
  type: DescentNodeType;
  depthMeters: number;
  ambientPressureBar: number;
  connectedDownstreamIds: string[];
  isRevealed: boolean;
  isCompleted: boolean;
}

export interface HydrostaticPressureState {
  currentDepthMeters: number;
  ambientPressureBar: number;
  stressPercentage: number; // 0 to 100%
  degradedHeartContainers: number; // 0 to 4 crushed hearts
  isHullBreached: boolean;
  leakDamageTimer: number;
}

export interface EndlessDescentRunState {
  isActive: boolean;
  sectorTier: 1 | 2 | 3 | 4 | 5;
  currentStratum: number;
  currentNodeId: string | null;
  mapNodes: Record<string, DescentMapNode>;
  pressure: HydrostaticPressureState;
  draftedBoons: BoonCard[];
  abyssalPearlsBanked: number;
  rerollsAvailable: number;
}

export interface IEndlessDescentManager extends IFlagshipSubsystem {
  runState: EndlessDescentRunState;
  startRun(): void;
  ventBallast(waterSpentPercent?: number): boolean;
  selectNode(nodeId: string): boolean;
  draftBoon(boon: BoonCard, context: FlagshipUpdateContext): void;
  generateNextStratumDraft(): BoonCard[];
  drawHUD(ctx: CanvasRenderingContext2D): void;
}

// ============================================================================
// FEATURE 12: SONAR & HYDROPHONE UI
// ============================================================================

export interface AcousticWavefront {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  life: number;
  maxLife: number;
  color: string;
  lineWidth: number;
}

export interface SonarContactTarget {
  id: number;
  bearingDeg: number;
  rangeMeters: number;
  classification: string;
  radialVelocity: number;
  bloomTimer: number; // Phosphor bloom decay
}

export interface GlassFractureLine {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface SonarRadarState {
  sweepAngleRad: number;
  sweepAngularSpeed: number; // 1.8 rad/s
  rangeRingsMeters: number[]; // [50, 100, 150, 200, 250]
  activeWavefronts: AcousticWavefront[];
  activeContacts: SonarContactTarget[];
  glassFractureLines: GlassFractureLine[];
  screenShakeTrauma: number;
}

export interface HydrophoneWaterfallState {
  frequencyBands: Uint8Array; // 16 discrete FFT frequency buckets (40Hz to 12kHz)
  waterfallBuffer: Uint8ClampedArray; // Off-screen rolling pixel memory
  updateIntervalMs: number; // 50ms (20Hz refresh)
}

export interface ISonarRenderer extends IFlagshipSubsystem {
  radarState: SonarRadarState;
  waterfallState: HydrophoneWaterfallState;
  spawnWavefront(x: number, y: number, color?: string, maxRadius?: number): void;
  addFracture(stressPercentage: number): void;
  drawSonarRadar(ctx: CanvasRenderingContext2D): void;
  drawWaterfall(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void;
  drawGlassFractures(ctx: CanvasRenderingContext2D): void;
}

// ============================================================================
// MASTER FLAGSHIP COORDINATOR INTERFACE
// ============================================================================

export interface IFlagshipManager {
  readonly logicalWidth: number;
  readonly logicalHeight: number;

  // Subsystems
  cavitationTorpedo: ICavitationTorpedoSystem;
  prismLaser: IPrismLaserSystem;
  hydraulicHarpoon: IHydraulicHarpoon;
  hydrothermalVents: IHydrothermalVentManager;
  biolapseDarkness: IBiolapseManager;
  modularChassis: IChassisManager;
  crewDeck: ICrewManager;
  bioHorror: IBioHorrorManager;
  automatonPhalanx: IAutomatonPhalanxManager;
  apexBoss: IApexBossManager;
  endlessDescent: IEndlessDescentManager;
  sonarRenderer: ISonarRenderer;

  // Lifecycle Hooks
  init(): void;
  update(deltaTime: number, context: FlagshipUpdateContext): void;
  drawBackground(ctx: CanvasRenderingContext2D, time: number): void;
  drawWorld(ctx: CanvasRenderingContext2D, time: number): void;
  drawForeground(ctx: CanvasRenderingContext2D, time: number): void;
  handleInput(key: string, isDown: boolean, context: FlagshipUpdateContext): boolean;
  reset(preserveUpgrades?: boolean, isContinue?: boolean): void;

  // Game Event Callbacks
  onWaveComplete(wave: number, context: FlagshipUpdateContext): void;
  onEnemyKilled(enemy: Enemy, context: FlagshipUpdateContext): void;
  onPlayerDamage(amount: number, context: FlagshipUpdateContext): void;
  checkRevive?(context: FlagshipUpdateContext): boolean;
}

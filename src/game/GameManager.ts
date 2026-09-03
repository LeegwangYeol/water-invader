import { GameState, Faction, CrisisType, CrisisState, HazardProjectile, SolarFlareBeam } from './types';
import { Player } from './Player';
import { Enemy, EnemyType } from './Enemy';
import { Bullet } from './Bullet';
import { Particle } from './Particle';
import { Barricade, BarricadeType } from './Barricade';
import { Helper, HelperType } from './Helper';
import { soundManager } from './SoundManager';
import { EndGameCrisis } from './crisis/EndGameCrisis';
import { CrisisArchetype, CrisisPhase, EndGameCrisisState } from './crisis/types';
import { AlliedReinforcements } from './crisis/AlliedReinforcements';

export class GameManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  public state: GameState = GameState.MENU;
  
  public player!: Player;
  public enemies: Enemy[] = [];
  public bullets: Bullet[] = [];
  public particles: Particle[] = [];
  private particlePool: Particle[] = [];
  public barricades: Barricade[] = [];
  public helpers: Helper[] = [];
  
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private accumulator: number = 0;
  private readonly FIXED_STEP: number = 1 / 60;
  
  // Progression
  public score: number = 0;
  public currency: number = 150; // Starter Pure Water allowance
  public combo: number = 0;
  private comboTimer: number = 0;
  public level: number = 1;
  
  private shakeTimer: number = 0;
  
  // Reinforcement System & Dynamic Event Director
  public reinforcementTimer: number = 10;
  public warningTimer: number = 0;
  public warningMessage: string = "";
  public warningText: string = "WARNING! ENEMY REINFORCEMENTS!";
  public pendingReinforcement: 'ENEMY' | 'ALLY' | 'FLANK' | 'SPEARHEAD' | 'ROGUE_INCURSION' | '3WAY_CLASH' | string | null = null;
  
  // Emergency Waves & Crisis Events Director (Stage 10+)
  public crisisState: CrisisState = {
    activeCrisis: null,
    timer: 0,
    duration: 0,
    warningTimer: 0,
    bannerText: null,
    hazardProjectiles: [],
    solarFlares: [],
    empSuppressionActive: false,
    empTimer: 0,
  };
  public crisisTimer: number = 0;
  public hazardProjectiles: HazardProjectile[] = [];
  public solarFlares: SolarFlareBeam[] = [];
  
  // End-Game Crisis Incursion Engine (Stage 15+)
  public endGameCrisis: EndGameCrisis | null = null;
  public hasEndGameCrisisOccurred: boolean = false;
  public endGameCrisisDefeatedHandled: boolean = false;
  public alliedReinforcements?: AlliedReinforcements;

  // Debugging & Developer Tools
  public isDebugMode: boolean = false;
  public isGodMode: boolean = false;
  public fps: number = 0;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  
  public readonly logicalWidth: number = 600;
  public readonly logicalHeight: number = 800;
  public dpr: number = 1;
  
  public isPaused: boolean = false;
  public keysPressed: { [key: string]: boolean } = {};

  // Callbacks for React UI updates
  public onStateChange?: (state: GameState) => void;
  public onScoreChange?: (score: number, currency: number, combo: number, wave: number, ultimateGauge: number, invaderCount?: number, rogueCount?: number) => void;
  public onPlayerHpChange?: (hp: number) => void;
  public onUpgradesChange?: (upgrades: { fireRate: number; multiShot: number; piercing: number; hasAcidShield: boolean }) => void;
  public onCrisisEvent?: (crisis: CrisisState | null) => void;
  public onEndGameCrisisEvent?: (crisis: EndGameCrisisState | null) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.canvas.width = this.logicalWidth * this.dpr;
    this.canvas.height = this.logicalHeight * this.dpr;
    if (typeof window !== 'undefined') {
      (window as any).Bullet = Bullet;
      (window as any).Enemy = Enemy;
      (window as any).Helper = Helper;
      (window as any).Faction = Faction;
    }
    this.init();
  }

  public resize(): void {
    const currentDpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.dpr = currentDpr;
    const targetW = Math.round(this.logicalWidth * this.dpr);
    const targetH = Math.round(this.logicalHeight * this.dpr);

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }
  }

  public clearKeys(): void {
    this.keysPressed = {};
    if (this.player) {
      this.player.isMovingLeft = false;
      this.player.isMovingRight = false;
      this.player.isShooting = false;
    }
  }

  public pause(): void {
    if (this.state === GameState.PLAYING || this.state === GameState.SHOP) {
      this.isPaused = true;
      this.accumulator = 0;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = 0;
      }
      this.clearKeys();
    }
  }

  public resume(): void {
    if (this.state === GameState.PLAYING && this.isPaused) {
      this.isPaused = false;
      this.accumulator = 0;
      this.lastTime = performance.now();
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  }

  public init(
    resetScoreAndCashOrOptions: boolean | { resetScoreAndCash?: boolean; preserveUpgrades?: boolean } = false,
    preserveUpgrades: boolean = false
  ) {
    let resetScoreAndCash = false;
    let shouldPreserve = preserveUpgrades;
    if (typeof resetScoreAndCashOrOptions === 'object' && resetScoreAndCashOrOptions !== null) {
      resetScoreAndCash = !!resetScoreAndCashOrOptions.resetScoreAndCash;
      shouldPreserve = !!resetScoreAndCashOrOptions.preserveUpgrades;
    } else if (typeof resetScoreAndCashOrOptions === 'boolean') {
      resetScoreAndCash = resetScoreAndCashOrOptions;
    }

    if (!this.player) {
      this.player = new Player(this.logicalWidth, this.logicalHeight);
    } else if (!shouldPreserve) {
      this.player.hp = 3;
      this.player.stressLevel = 0;
      this.player.suppressionLevel = 0;
      this.player.invincibilityTimer = 0;
      this.player.ultimateGauge = 0;
      this.player.position.x = this.logicalWidth / 2 - 25;
      this.player.position.y = this.logicalHeight - 60;
      this.player.baseFireRate = 0.5;
      this.player.multiShot = 1;
      this.player.piercing = 1;
      this.player.hasAcidShield = false;
    } else {
      // Preserve player upgrades (baseFireRate, multiShot, piercing, maxHp, hp, hasAcidShield)
      this.player.hp = Math.max(3, this.player.hp);
      this.player.position.x = this.logicalWidth / 2 - 25;
      this.player.position.y = this.logicalHeight - 60;
      this.player.stressLevel = 0;
      this.player.suppressionLevel = 0;
      this.player.invincibilityTimer = 0;
      this.player.ultimateGauge = 0;
    }
    this.clearKeys();
    this.enemies = [];
    this.bullets = [];
    for (const p of this.particles) {
      if (this.particlePool.length < 500) {
        this.particlePool.push(p);
      }
    }
    this.particles = [];
    if (resetScoreAndCash) {
      this.score = 0;
      this.currency = 150;
    }
    this.combo = 0;
    this.level = 1;
    this.shakeTimer = 0;
    this.isPaused = false;
    this.accumulator = 0;
    
    this.reinforcementTimer = 10;
    this.warningTimer = 0;
    this.warningMessage = "";
    this.warningText = "WARNING! ENEMY REINFORCEMENTS!";
    this.pendingReinforcement = null;
    
    this.crisisState = {
      activeCrisis: null,
      timer: 0,
      duration: 0,
      warningTimer: 0,
      bannerText: null,
      hazardProjectiles: [],
      solarFlares: [],
      empSuppressionActive: false,
      empTimer: 0,
    };
    this.crisisTimer = 6.0;
    this.hazardProjectiles = [];
    this.solarFlares = [];
    if (this.onCrisisEvent) this.onCrisisEvent(null);
    
    this.endGameCrisis = null;
    this.endGameCrisisDefeatedHandled = false;
    this.alliedReinforcements = undefined;
    if (resetScoreAndCash) {
      this.hasEndGameCrisisOccurred = false;
    }
    if (this.onEndGameCrisisEvent) this.onEndGameCrisisEvent(null);

    this.spawnBarricades();
    this.spawnWave();
    
    if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
    this.updateScoreUI();
    this.updateUpgradesUI();
  }
  
  private spawnBarricades() {
    this.barricades = [];
    // 4 barricades. 1st and 4th are destructible ice. 2nd and 3rd are indestructible stone.
    const padding = 150;
    const startX = (this.logicalWidth - (3 * padding + 60)) / 2;
    const y = this.logicalHeight - 150;
    
    this.barricades.push(new Barricade(startX, y, BarricadeType.DESTRUCTIBLE));
    this.barricades.push(new Barricade(startX + padding, y, BarricadeType.INDESTRUCTIBLE));
    this.barricades.push(new Barricade(startX + padding * 2, y, BarricadeType.INDESTRUCTIBLE));
    this.barricades.push(new Barricade(startX + padding * 3, y, BarricadeType.DESTRUCTIBLE));
  }

  public startNextWave() {
    this.state = GameState.PLAYING;
    this.isPaused = false;
    this.accumulator = 0;
    this.warningTimer = 0;
    this.warningMessage = "";
    this.warningText = "";
    this.pendingReinforcement = null;
    this.crisisState = {
      activeCrisis: null,
      timer: 0,
      duration: 0,
      warningTimer: 0,
      bannerText: null,
      hazardProjectiles: [],
      empSuppressionActive: false,
      empTimer: 0,
    };
    this.crisisTimer = 6.0 + Math.random() * 4.0;
    this.hazardProjectiles = [];
    if (this.onCrisisEvent) this.onCrisisEvent(null);
    this.endGameCrisis = null;
    this.endGameCrisisDefeatedHandled = false;
    this.alliedReinforcements = undefined;
    if (this.onEndGameCrisisEvent) this.onEndGameCrisisEvent(null);
    this.level++;
    this.spawnWave();
    this.updateScoreUI();
    if (this.onStateChange) this.onStateChange(GameState.PLAYING);
    
    this.lastTime = performance.now();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public start() {
    this.startGame();
  }

  public startGame() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    soundManager.init();
    this.state = GameState.PLAYING;
    this.isPaused = false;
    this.accumulator = 0;
    if (this.onStateChange) this.onStateChange(this.state);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stopGame() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    this.clearKeys();
  }

  public triggerEndGameCrisis(archetype?: CrisisArchetype): EndGameCrisis {
    this.hasEndGameCrisisOccurred = true;
    this.enemies = []; // Clear standard hostiles for existential crisis encounter
    this.endGameCrisis = new EndGameCrisis(this.logicalWidth, this.logicalHeight);
    this.endGameCrisisDefeatedHandled = false;

    this.endGameCrisis.callbacks = {
      onPhaseChange: (phase, _prevPhase) => {
        if (phase === CrisisPhase.PHASE_2_HULL && !this.alliedReinforcements) {
          this.triggerAlliedReinforcements();
        }
        if (this.onEndGameCrisisEvent && this.endGameCrisis) {
          this.onEndGameCrisisEvent(this.endGameCrisis.getState());
        }
      },
      onDefeated: (_arch) => {
        if (this.alliedReinforcements && !this.alliedReinforcements.isWarpingOut) {
          this.alliedReinforcements.warpOut();
        }
        if (this.onEndGameCrisisEvent && this.endGameCrisis) {
          this.onEndGameCrisisEvent(this.endGameCrisis.getState());
        }
      },
      onRiftDestroyed: (riftIndex, _remaining) => {
        const rx = riftIndex === 0 ? 90 : this.logicalWidth - 90;
        this.createExplosion(rx, 210, '#c084fc', 30, 2.0);
        this.triggerScreenShake(0.6);
        if (this.onEndGameCrisisEvent && this.endGameCrisis) {
          this.onEndGameCrisisEvent(this.endGameCrisis.getState());
        }
      },
    };

    this.endGameCrisis.startIncursion(archetype, soundManager);
    soundManager.playCrisisCataclysmSiren();
    this.triggerScreenShake(1.5);

    if (this.onEndGameCrisisEvent) {
      this.onEndGameCrisisEvent(this.endGameCrisis.getState());
    }

    return this.endGameCrisis;
  }

  public triggerAlliedReinforcements(): AlliedReinforcements {
    this.alliedReinforcements = new AlliedReinforcements(this.logicalWidth, this.logicalHeight);
    soundManager.playPowerUp();
    this.triggerScreenShake(0.8);
    return this.alliedReinforcements;
  }

  private spawnWave() {
    if (this.level % 5 === 0) {
      // Boss wave (F-13: spawn Y lowered to 90)
      const boss = new Enemy(this.logicalWidth / 2 - 75, 90, this.logicalWidth, this.level, EnemyType.BOSS, this.logicalHeight);
      this.enemies.push(boss);

      if (this.level >= 10) {
        // Stage 10+ Boss Escort Legions (4-8 accompanying minions: Shielded, Snipers, and Divers)
        const escortCount = Math.min(8, 4 + Math.floor((this.level - 10) / 5) * 2);
        const escortTypes = [
          EnemyType.SHIELDED,
          EnemyType.SNIPER,
          EnemyType.DIVER,
          EnemyType.SHIELDED,
          EnemyType.SNIPER,
          EnemyType.DIVER,
          EnemyType.SHIELDED,
          EnemyType.DIVER
        ];

        const leftCount = Math.ceil(escortCount / 2);
        const rightCount = Math.floor(escortCount / 2);

        for (let i = 0; i < leftCount; i++) {
          const type = escortTypes[i % escortTypes.length];
          const x = Math.max(10, (this.logicalWidth / 2 - 85) - (i + 1) * 55);
          const y = 90 + (i % 2) * 50;
          this.enemies.push(new Enemy(x, y, this.logicalWidth, this.level, type, this.logicalHeight));
        }

        for (let i = 0; i < rightCount; i++) {
          const type = escortTypes[(i + leftCount) % escortTypes.length];
          const x = Math.min(this.logicalWidth - 55, (this.logicalWidth / 2 + 85) + i * 55);
          const y = 90 + (i % 2) * 50;
          this.enemies.push(new Enemy(x, y, this.logicalWidth, this.level, type, this.logicalHeight));
        }
      }
      return;
    }

    // Stage 15+ End-Game Crisis Trigger Evaluation on non-boss waves
    if (this.level >= 15 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
      const isPityTrigger = this.level >= 18;
      const isRandomTrigger = Math.random() < 0.30;
      if (isPityTrigger || isRandomTrigger) {
        this.triggerEndGameCrisis();
      }
    }

    const rows = Math.min(5, 3 + Math.floor(this.level / 4));
    const cols = Math.min(8, 6 + Math.floor(this.level / 3));
    const paddingX = 60;
    const paddingY = 50;
    const offsetX = Math.max(20, (this.logicalWidth - ((cols - 1) * paddingX)) / 2);
    
    let specialCount = 0;
    const maxSpecials = Math.max(1, Math.min(1 + Math.floor(this.level / 2), 4));
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = EnemyType.NORMAL;
        
        if (r === 1 && c % 2 === 0) {
          type = EnemyType.ZIGZAG;
        } else if (specialCount < maxSpecials && Math.random() > 0.85) {
          const specials = [EnemyType.SNIPER, EnemyType.DIVER, EnemyType.SHIELDED, EnemyType.SPLITTER];
          type = specials[Math.floor(Math.random() * specials.length)];
          specialCount++;
        }
        
        this.enemies.push(new Enemy(offsetX + c * paddingX, 80 + r * paddingY, this.logicalWidth, this.level, type, this.logicalHeight));
      }
    }
  }

  public spawnDynamicReinforcement(type?: 'FLANK' | 'SPEARHEAD' | 'ROGUE_INCURSION' | '3WAY_CLASH' | 'CHAOTIC_AIRDROP' | string) {
    const selectedType = type || (['FLANK', 'SPEARHEAD', 'ROGUE_INCURSION', '3WAY_CLASH'] as const)[Math.floor(Math.random() * 4)];

    if (selectedType === 'FLANK') {
      const count = Math.min(3, 2 + Math.floor(this.level / 3));
      for (let i = 0; i < count; i++) {
        const y = 80 + i * 45;
        const leftEnemy = new Enemy(10, y, this.logicalWidth, this.level + 1, EnemyType.ROGUE_DRONE, this.logicalHeight);
        leftEnemy.speedX = 35 + this.level * 3;
        const rightEnemy = new Enemy(this.logicalWidth - 50, y, this.logicalWidth, this.level + 1, EnemyType.ZIGZAG, this.logicalHeight);
        rightEnemy.speedX = -35 - this.level * 3;
        this.enemies.push(leftEnemy, rightEnemy);
      }
      this.warningMessage = "WARNING! FLANK INCURSION DETECTED!";
      this.warningText = this.warningMessage;
      this.warningTimer = 2.0;
      this.triggerScreenShake(0.6);
      soundManager.playThirdFactionWarning();
    } else if (selectedType === 'SPEARHEAD' || selectedType === 'V_FORMATION') {
      const centerX = Math.max(10, Math.min(this.logicalWidth - 60, this.logicalWidth / 2 - 25));
      const apex = new Enemy(centerX, 80, this.logicalWidth, this.level + 2, EnemyType.ROGUE_MECH, this.logicalHeight);
      const left1 = new Enemy(Math.max(10, centerX - 55), 125, this.logicalWidth, this.level + 1, EnemyType.ROGUE_STALKER, this.logicalHeight);
      const right1 = new Enemy(Math.min(this.logicalWidth - 50, centerX + 55), 125, this.logicalWidth, this.level + 1, EnemyType.ROGUE_DRONE, this.logicalHeight);
      const left2 = new Enemy(Math.max(10, centerX - 110), 170, this.logicalWidth, this.level + 1, EnemyType.ROGUE_DRONE, this.logicalHeight);
      const right2 = new Enemy(Math.min(this.logicalWidth - 50, centerX + 110), 170, this.logicalWidth, this.level + 1, EnemyType.ROGUE_STALKER, this.logicalHeight);
      this.enemies.push(apex, left1, right1, left2, right2);

      this.warningMessage = "WARNING! SPEARHEAD FORMATION DETECTED!";
      this.warningText = this.warningMessage;
      this.warningTimer = 2.0;
      this.triggerScreenShake(0.6);
      soundManager.playThirdFactionWarning();
    } else if (selectedType === 'ROGUE_INCURSION' || selectedType === 'CHAOTIC_AIRDROP') {
      const count = Math.min(5, 3 + Math.floor(this.level / 3));
      const spacing = (this.logicalWidth - 100) / Math.max(1, count - 1);
      for (let i = 0; i < count; i++) {
        const x = 50 + i * spacing;
        const types = [EnemyType.ROGUE_DRONE, EnemyType.ROGUE_STALKER, EnemyType.ROGUE_MECH];
        const rType = types[i % types.length];
        const unit = new Enemy(x, 80 + (i % 2) * 30, this.logicalWidth, this.level + 1, rType, this.logicalHeight);
        this.enemies.push(unit);
      }
      this.warningMessage = "WARNING! THIRD FACTION INCURSION!";
      this.warningText = this.warningMessage;
      this.warningTimer = 2.0;
      this.triggerScreenShake(0.8);
      soundManager.playThirdFactionWarning();
    } else if (selectedType === '3WAY_CLASH') {
      const count = Math.min(3, 2 + Math.floor(this.level / 4));
      for (let i = 0; i < count; i++) {
        const invader = new Enemy(40, 80 + i * 50, this.logicalWidth, this.level + 1, EnemyType.ZIGZAG, this.logicalHeight);
        invader.faction = Faction.INVADER;
        const rogue = new Enemy(this.logicalWidth - 85, 80 + i * 50, this.logicalWidth, this.level + 1, EnemyType.ROGUE_STALKER, this.logicalHeight);
        rogue.faction = Faction.ROGUE;
        this.enemies.push(invader, rogue);
      }
      this.warningMessage = "WARNING! 3-WAY BATTLEFIELD CLASH!";
      this.warningText = this.warningMessage;
      this.warningTimer = 2.0;
      this.triggerScreenShake(0.8);
      soundManager.playThirdFactionWarning();
    }
    this.updateScoreUI();
  }

  public triggerCrisis(type?: CrisisType) {
    if (this.state !== GameState.PLAYING) return;
    
    const crisisOptions: CrisisType[] = ['TITAN_HORDE', 'ACID_STORM', 'SWARM_BLITZ', 'EMP_DISRUPTION', 'TOTAL_WAR', 'SOLAR_FLARE'];
    const chosenType = type || crisisOptions[Math.floor(Math.random() * crisisOptions.length)];

    let banner = '';
    let duration = 8.0;
    if (chosenType === 'TITAN_HORDE') {
      banner = 'EMERGENCY CRISIS: TITAN BIO-MECH ESCORT HORDE!';
      duration = 10.0;
    } else if (chosenType === 'ACID_STORM') {
      banner = 'EMERGENCY CRISIS: TOXIC ACID STORM HAZARD!';
      duration = 10.0;
    } else if (chosenType === 'SWARM_BLITZ') {
      banner = 'EMERGENCY CRISIS: SWARM DIVER BLITZ!';
      duration = 8.0;
    } else if (chosenType === 'EMP_DISRUPTION') {
      banner = 'EMERGENCY CRISIS: EMP WEAPON DISRUPTION!';
      duration = 3.5;
    } else if (chosenType === 'TOTAL_WAR') {
      banner = 'EMERGENCY CRISIS: 3-WAY TOTAL WAR INCURSION!';
      duration = 12.0;
    } else if (chosenType === 'SOLAR_FLARE') {
      banner = 'EMERGENCY CRISIS: HIGH-ENERGY SOLAR FLARE SURGE!';
      duration = 8.0;
    }

    this.crisisState = {
      activeCrisis: chosenType,
      timer: duration,
      duration: duration,
      warningTimer: 2.0,
      bannerText: banner,
      hazardProjectiles: [],
      solarFlares: [],
      empSuppressionActive: false,
      empTimer: 0,
    };
    this.hazardProjectiles = [];
    this.solarFlares = [];

    this.warningMessage = banner;
    this.warningText = banner;
    this.warningTimer = 2.0;

    this.triggerScreenShake(1.0);
    soundManager.playCrisisAlarm();

    if (this.onCrisisEvent) {
      this.onCrisisEvent({ ...this.crisisState });
    }
  }

  private activateCrisisEffect(type: CrisisType) {
    if (type === 'TITAN_HORDE') {
      // 1. TITAN_HORDE: Heavy boss dreadnought escorted by 4 Shielded and 4 Diver units
      const boss = new Enemy(this.logicalWidth / 2 - 75, 80, this.logicalWidth, this.level, EnemyType.BOSS, this.logicalHeight);
      boss.hp = Math.max(boss.hp, 250);
      boss.maxHp = boss.hp;
      this.enemies.push(boss);

      for (let i = 0; i < 4; i++) {
        const sx = 40 + i * ((this.logicalWidth - 120) / 3);
        const shielded = new Enemy(sx, 145, this.logicalWidth, this.level, EnemyType.SHIELDED, this.logicalHeight);
        this.enemies.push(shielded);
      }
      for (let i = 0; i < 4; i++) {
        const dx = 50 + i * ((this.logicalWidth - 140) / 3);
        const diver = new Enemy(dx, 195, this.logicalWidth, this.level, EnemyType.DIVER, this.logicalHeight);
        this.enemies.push(diver);
      }
      this.triggerScreenShake(0.9);
      soundManager.playThirdFactionWarning();
    } else if (type === 'ACID_STORM') {
      // 2. ACID_STORM: Environmental falling toxic projectile barrage across the screen
      soundManager.playAcidStormSound();
      this.triggerScreenShake(0.6);
      this.hazardProjectiles = [];
    } else if (type === 'SWARM_BLITZ') {
      // 3. SWARM_BLITZ: Coordinated high-speed pincer dive attacks with rapid movement
      for (let i = 0; i < 4; i++) {
        const leftDiver = new Enemy(15, 60 + i * 40, this.logicalWidth, this.level + 1, EnemyType.DIVER, this.logicalHeight);
        leftDiver.speedX = 65 + this.level * 3;
        const rightDiver = new Enemy(this.logicalWidth - 55, 60 + i * 40, this.logicalWidth, this.level + 1, EnemyType.DIVER, this.logicalHeight);
        rightDiver.speedX = -65 - this.level * 3;
        this.enemies.push(leftDiver, rightDiver);
      }
      for (let i = 0; i < 3; i++) {
        const centerZig = new Enemy(this.logicalWidth / 2 - 60 + i * 60, 50, this.logicalWidth, this.level + 1, EnemyType.ZIGZAG, this.logicalHeight);
        this.enemies.push(centerZig);
      }
      this.triggerScreenShake(0.8);
      soundManager.playCrisisAlarm();
    } else if (type === 'EMP_DISRUPTION') {
      // 4. EMP_DISRUPTION: Temporary weapon suppression (2.5s) with rapid hostile beam sweeps
      soundManager.playEmpDisruptionSound();
      this.crisisState.empSuppressionActive = true;
      this.crisisState.empTimer = 2.5;
      if (this.player) {
        this.player.isShooting = false;
        this.player.suppressionLevel = 100;
      }
      const sniper1 = new Enemy(50, 75, this.logicalWidth, this.level + 1, EnemyType.SNIPER, this.logicalHeight);
      const sniper2 = new Enemy(this.logicalWidth - 90, 75, this.logicalWidth, this.level + 1, EnemyType.SNIPER, this.logicalHeight);
      const stalker1 = new Enemy(this.logicalWidth / 2 - 50, 85, this.logicalWidth, this.level + 1, EnemyType.ROGUE_STALKER, this.logicalHeight);
      const stalker2 = new Enemy(this.logicalWidth / 2 + 10, 85, this.logicalWidth, this.level + 1, EnemyType.ROGUE_STALKER, this.logicalHeight);
      this.enemies.push(sniper1, sniper2, stalker1, stalker2);
      this.triggerScreenShake(0.7);
    } else if (type === 'TOTAL_WAR') {
      // 5. TOTAL_WAR: Massive dual-flank chaotic clash between Invader (10+) and Rogue (10+) legions
      // Left Flank (Invaders): 11 units
      for (let i = 0; i < 4; i++) {
        const invader = new Enemy(30 + (i % 2) * 50, 70 + Math.floor(i / 2) * 45, this.logicalWidth, this.level + 1, EnemyType.SNIPER, this.logicalHeight);
        invader.faction = Faction.INVADER;
        this.enemies.push(invader);
      }
      for (let i = 0; i < 4; i++) {
        const diver = new Enemy(30 + (i % 2) * 50, 160 + Math.floor(i / 2) * 45, this.logicalWidth, this.level + 1, EnemyType.DIVER, this.logicalHeight);
        diver.faction = Faction.INVADER;
        this.enemies.push(diver);
      }
      for (let i = 0; i < 3; i++) {
        const shielded = new Enemy(30 + i * 45, 250, this.logicalWidth, this.level + 1, EnemyType.SHIELDED, this.logicalHeight);
        shielded.faction = Faction.INVADER;
        this.enemies.push(shielded);
      }

      // Right Flank (Rogues): 11 units
      for (let i = 0; i < 4; i++) {
        const drone = new Enemy(this.logicalWidth - 120 + (i % 2) * 50, 70 + Math.floor(i / 2) * 45, this.logicalWidth, this.level + 1, EnemyType.ROGUE_DRONE, this.logicalHeight);
        drone.faction = Faction.ROGUE;
        this.enemies.push(drone);
      }
      for (let i = 0; i < 4; i++) {
        const stalker = new Enemy(this.logicalWidth - 120 + (i % 2) * 50, 160 + Math.floor(i / 2) * 45, this.logicalWidth, this.level + 1, EnemyType.ROGUE_STALKER, this.logicalHeight);
        stalker.faction = Faction.ROGUE;
        this.enemies.push(stalker);
      }
      for (let i = 0; i < 3; i++) {
        const mech = new Enemy(this.logicalWidth - 150 + i * 50, 250, this.logicalWidth, this.level + 1, EnemyType.ROGUE_MECH, this.logicalHeight);
        mech.faction = Faction.ROGUE;
        this.enemies.push(mech);
      }

      this.triggerScreenShake(1.2);
      soundManager.playThirdFactionWarning();
    } else if (type === 'SOLAR_FLARE') {
      // 6. SOLAR_FLARE: High-energy vertical warning telegraphs that ignite into sweeping plasma columns
      soundManager.playCrisisAlarm();
      this.triggerScreenShake(0.8);
      this.solarFlares = [
        { x: 50 + Math.random() * 80, width: 70, chargeTimer: 1.2, chargeDuration: 1.2, activeTimer: 1.5, activeDuration: 1.5, damageDealt: false, isDead: false },
        { x: 230 + Math.random() * 80, width: 70, chargeTimer: 1.8, chargeDuration: 1.8, activeTimer: 1.5, activeDuration: 1.5, damageDealt: false, isDead: false },
        { x: 410 + Math.random() * 80, width: 70, chargeTimer: 2.4, chargeDuration: 2.4, activeTimer: 1.5, activeDuration: 1.5, damageDealt: false, isDead: false },
      ];
      this.crisisState.solarFlares = this.solarFlares;
    }

    this.updateScoreUI();
    if (this.onCrisisEvent) {
      this.onCrisisEvent({ ...this.crisisState });
    }
  }

  private loop = (timestamp: number) => {
    if (this.state === GameState.MENU) return;

    let frameTime = Math.max(0, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    
    // Guard against spiral of death on lag spikes or tab switching
    if (frameTime > 0.1) {
      frameTime = 0.1;
    }
    this.accumulator += frameTime;

    // FPS Calculation
    this.frameCount++;
    if (timestamp - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = timestamp;
    }

    // Fixed timestep update for deterministic physics stability across 60Hz/120Hz/144Hz
    while (this.accumulator >= this.FIXED_STEP) {
      this.update(this.FIXED_STEP);
      this.accumulator -= this.FIXED_STEP;
      if (this.state !== GameState.PLAYING) {
        this.accumulator = 0;
        break;
      }
    }
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number) {
    if (this.state === GameState.PLAYING) {
      // Player
      const newBullets = this.player.update(deltaTime);
      if (newBullets && newBullets.length > 0) {
        soundManager.playShoot();
        this.bullets.push(...newBullets);
      }
      
      // End-Game Crisis Incursion & Combat Update
      if (this.endGameCrisis && this.endGameCrisis.isActive) {
        this.endGameCrisis.update(deltaTime, this.player, this.bullets, this.particles, soundManager);

        // Auto-summon Allied Reinforcements when EndGameCrisis reaches Phase 2
        if (this.endGameCrisis.phase === CrisisPhase.PHASE_2_HULL && !this.alliedReinforcements) {
          this.triggerAlliedReinforcements();
        }

        // Sovereign body direct contact with player
        if (
          this.endGameCrisis.sovereign &&
          !this.endGameCrisis.sovereign.isDead &&
          this.player &&
          !this.isGodMode &&
          this.player.invincibilityTimer <= 0
        ) {
          if (this.endGameCrisis.sovereign.checkCollision(this.player)) {
            this.player.hp -= 1;
            this.player.hitFlashTimer = 0.08;
            this.player.invincibilityTimer = 1.0;
            soundManager.playPlayerHit();
            this.player.stressLevel = Math.min(100, this.player.stressLevel + 40);
            this.combo = 0;
            this.updateScoreUI();
            this.createExplosion(this.player.position.x, this.player.position.y, '#ef4444', 10);
            this.triggerScreenShake(0.5);
            if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
            if (this.player.hp <= 0) this.gameOver("정수기가 파괴되었습니다. (체력 소진)");
          }
        }

        // Defeat resolution: grant massive victory bonus (+2000 score, +500 cash)
        if (this.endGameCrisis.isDefeated()) {
          if (!this.endGameCrisisDefeatedHandled) {
            this.endGameCrisisDefeatedHandled = true;
            this.score += 2000;
            this.currency += 500;
            this.combo += 10;
            this.comboTimer = 5.0;
            this.updateScoreUI();
            this.createExplosion(this.logicalWidth / 2, 200, '#fbbf24', 120, 3.0);
            this.triggerScreenShake(1.2);
            soundManager.playVictory();
          }
        }
      }

      // Allied Reinforcements (Aegis Vanguard Command Dreadnought) Update
      if (this.alliedReinforcements && this.alliedReinforcements.isActive) {
        const alliedBullets = this.alliedReinforcements.update(
          deltaTime,
          this.player,
          this.enemies,
          this.bullets,
          this.endGameCrisis,
          this.particles
        );
        if (alliedBullets && alliedBullets.length > 0) {
          this.bullets.push(...alliedBullets);
        }

        // Safely warp out if crisis has been defeated
        if (this.endGameCrisis && this.endGameCrisis.isDefeated() && !this.alliedReinforcements.isWarpingOut) {
          this.alliedReinforcements.warpOut();
        }
      }

      // Combo timer
      if (this.combo > 0) {
        this.comboTimer -= deltaTime;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.updateScoreUI();
        }
      }
      
      // Dynamic Event Director & Reinforcement Logic
      if (this.warningTimer > 0) {
        this.warningTimer -= deltaTime;
        if (this.warningTimer <= 0) {
          this.warningTimer = 0;
          if (this.pendingReinforcement) {
            if (this.pendingReinforcement === 'ALLY') {
              const count = Math.floor(Math.random() * 3) + 1;
              for (let i = 0; i < count; i++) {
                const type = Math.floor(Math.random() * 3);
                this.helpers.push(new Helper(
                  Math.random() * (this.logicalWidth - 40),
                  this.logicalHeight - 80,
                  this.logicalWidth,
                  this.logicalHeight,
                  type as HelperType
                ));
                this.createExplosion(this.logicalWidth / 2, this.logicalHeight - 20, '#4ade80', 20);
              }
            } else if (this.pendingReinforcement === 'ENEMY') {
              for (let i = 0; i < 4; i++) {
                this.enemies.push(new Enemy(50 + i * 100, 80, this.logicalWidth, this.level + 2, EnemyType.ZIGZAG, this.logicalHeight));
              }
            } else if (typeof this.pendingReinforcement === 'string') {
              this.spawnDynamicReinforcement(this.pendingReinforcement as any);
            } else {
              this.spawnDynamicReinforcement();
            }
            this.pendingReinforcement = null;
          }
        }
      } else {
        this.reinforcementTimer -= deltaTime;
        if (this.reinforcementTimer <= 0) {
          const tempoInterval = Math.max(8, 16 - Math.min(6, this.level) - Math.min(3, Math.floor(this.combo / 5)));
          this.reinforcementTimer = tempoInterval + Math.random() * 4;

          if (this.enemies.length > 0) {
            this.triggerScreenShake(0.8);
            this.warningTimer = 2.0;
            if (Math.random() < 0.2) {
              this.pendingReinforcement = 'ALLY';
              this.warningMessage = "ALLY SUPPORT INCOMING!";
              this.warningText = this.warningMessage;
              soundManager.playPowerUp();
            } else {
              const events: Array<'FLANK' | 'SPEARHEAD' | 'ROGUE_INCURSION' | '3WAY_CLASH'> = ['FLANK', 'SPEARHEAD', 'ROGUE_INCURSION', '3WAY_CLASH'];
              const chosenEvent = events[Math.floor(Math.random() * events.length)];
              this.pendingReinforcement = chosenEvent;
              if (chosenEvent === 'ROGUE_INCURSION') {
                this.warningMessage = "WARNING! THIRD FACTION INCURSION!";
              } else if (chosenEvent === '3WAY_CLASH') {
                this.warningMessage = "WARNING! 3-WAY BATTLEFIELD CLASH!";
              } else if (chosenEvent === 'FLANK') {
                this.warningMessage = "WARNING! FLANK INCURSION DETECTED!";
              } else {
                this.warningMessage = "WARNING! SPEARHEAD FORMATION DETECTED!";
              }
              this.warningText = this.warningMessage;
              soundManager.playThirdFactionWarning();
            }
          }
        } else {
          // Accelerated tempo if battle density drops below 3 while wave active
          let activeHostileCount = 0;
          for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (!e.isDead && (e.faction === Faction.INVADER || e.faction === Faction.ROGUE)) {
              activeHostileCount++;
            }
          }
          if (activeHostileCount > 0 && activeHostileCount <= 2 && this.reinforcementTimer > 4 && this.warningTimer <= 0) {
            this.reinforcementTimer = 2.0;
          }
        }
      }

      // Emergency Waves & Crisis Director Logic (Stage 10+)
      if (this.crisisState.warningTimer > 0) {
        this.crisisState.warningTimer -= deltaTime;
        if (this.crisisState.warningTimer <= 0) {
          this.crisisState.warningTimer = 0;
          if (this.crisisState.activeCrisis) {
            this.activateCrisisEffect(this.crisisState.activeCrisis);
          }
        }
      } else if (this.crisisState.activeCrisis !== null) {
        this.crisisState.timer -= deltaTime;

        // Handle EMP weapon suppression
        if (this.crisisState.empTimer && this.crisisState.empTimer > 0) {
          this.crisisState.empTimer -= deltaTime;
          if (this.player && this.crisisState.empSuppressionActive) {
            this.player.isShooting = false;
            this.player.suppressionLevel = Math.max(this.player.suppressionLevel, 90);
          }
          if (this.crisisState.empTimer <= 0) {
            this.crisisState.empSuppressionActive = false;
            this.crisisState.empTimer = 0;
            if (this.onCrisisEvent) this.onCrisisEvent({ ...this.crisisState });
          }
        }

        // Handle Acid Storm hazard projectile generation
        if (this.crisisState.activeCrisis === 'ACID_STORM') {
          if (Math.random() < 0.4) {
            const count = 1 + Math.floor(Math.random() * 2);
            for (let k = 0; k < count; k++) {
              const hz: HazardProjectile = {
                x: 20 + Math.random() * (this.logicalWidth - 40),
                y: -15,
                radius: 5 + Math.random() * 4,
                speedY: 220 + Math.random() * 120,
                speedX: (Math.random() - 0.5) * 40,
                damage: 1,
                color: '#a3e635'
              };
              this.hazardProjectiles.push(hz);
            }
          }
        }

        // Handle Solar Flare dynamic spawns during active crisis
        if (this.crisisState.activeCrisis === 'SOLAR_FLARE' && this.crisisState.timer > 2.0) {
          if (this.solarFlares.filter(f => !f.isDead).length < 2 && Math.random() < 0.04) {
            this.solarFlares.push({
              x: 30 + Math.random() * (this.logicalWidth - 110),
              width: 70,
              chargeTimer: 1.2,
              chargeDuration: 1.2,
              activeTimer: 1.5,
              activeDuration: 1.5,
              damageDealt: false,
              isDead: false,
            });
          }
        }

        if (this.crisisState.timer <= 0) {
          this.crisisState.activeCrisis = null;
          this.crisisState.bannerText = null;
          this.crisisState.empSuppressionActive = false;
          if (this.onCrisisEvent) this.onCrisisEvent(null);
        }
      } else if (this.level >= 10) {
        this.crisisTimer -= deltaTime;
        if (this.crisisTimer <= 0 && this.enemies.length > 0 && this.warningTimer <= 0 && this.pendingReinforcement === null) {
          this.triggerCrisis();
          this.crisisTimer = 16.0 + Math.random() * 8.0;
        }
      }

      // Update and collide hazard projectiles (Acid Storm)
      if (this.hazardProjectiles.length > 0) {
        for (let i = 0; i < this.hazardProjectiles.length; i++) {
          const hz = this.hazardProjectiles[i];
          if (hz.isDead) continue;
          hz.y += hz.speedY * deltaTime;
          if (hz.speedX) hz.x += hz.speedX * deltaTime;

          // Player collision
          if (this.player && !this.isGodMode && this.player.invincibilityTimer <= 0) {
            const px = this.player.position.x;
            const py = this.player.position.y;
            const pw = this.player.size.width;
            const ph = this.player.size.height;
            if (
              hz.x + hz.radius >= px &&
              hz.x - hz.radius <= px + pw &&
              hz.y + hz.radius >= py &&
              hz.y - hz.radius <= py + ph
            ) {
              hz.isDead = true;
              if (this.player.hasAcidShield) {
                // Acid Shield Active: Neutralize droplet, spawn spark/splash particles & play deflection sound
                soundManager.playShieldDeflect();
                this.createExplosion(hz.x, hz.y, '#38bdf8', 10);
              } else {
                this.player.hp -= hz.damage;
                this.player.hitFlashTimer = 0.08;
                this.player.invincibilityTimer = 1.0;
                soundManager.playPlayerHit();
                soundManager.playAcidStormSound();
                this.createExplosion(hz.x, hz.y, '#84cc16', 15);
                this.triggerScreenShake(0.3);
                if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
                if (this.player.hp <= 0) {
                  this.gameOver("정수기가 산성 폭풍에 부식되었습니다. (체력 소진)");
                }
              }
            }
          }

          // Barricade collision
          for (const b of this.barricades) {
            if (
              !b.isDead &&
              hz.x >= b.position.x &&
              hz.x <= b.position.x + b.size.width &&
              hz.y >= b.position.y &&
              hz.y <= b.position.y + b.size.height
            ) {
              hz.isDead = true;
              if (b.type === BarricadeType.DESTRUCTIBLE) {
                b.hp -= 2;
              }
              this.createExplosion(hz.x, hz.y, '#a3e635', 6);
              break;
            }
          }

          if (hz.y > this.logicalHeight + 30) {
            hz.isDead = true;
          }
        }

        let hzWrite = 0;
        for (let i = 0; i < this.hazardProjectiles.length; i++) {
          if (!this.hazardProjectiles[i].isDead) {
            this.hazardProjectiles[hzWrite++] = this.hazardProjectiles[i];
          }
        }
        this.hazardProjectiles.length = hzWrite;
        this.crisisState.hazardProjectiles = this.hazardProjectiles;
      }

      // Update and collide Solar Flare beams
      if (this.solarFlares.length > 0) {
        for (let i = 0; i < this.solarFlares.length; i++) {
          const flare = this.solarFlares[i];
          if (flare.isDead) continue;

          if (flare.chargeTimer > 0) {
            flare.chargeTimer -= deltaTime;
          } else if (flare.activeTimer > 0) {
            flare.activeTimer -= deltaTime;
            
            // Solar flare beam hits player
            if (this.player && !this.isGodMode && this.player.invincibilityTimer <= 0 && !flare.damageDealt) {
              const px = this.player.position.x;
              const pw = this.player.size.width;
              if (px + pw >= flare.x && px <= flare.x + flare.width) {
                flare.damageDealt = true;
                this.player.hp -= 1;
                this.player.hitFlashTimer = 0.08;
                this.player.invincibilityTimer = 1.0;
                soundManager.playPlayerHit();
                this.createExplosion(px + pw / 2, this.player.position.y + 10, '#f59e0b', 20);
                this.triggerScreenShake(0.4);
                if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
                if (this.player.hp <= 0) {
                  this.gameOver("정수기가 고에너지 태양 플레어에 소멸되었습니다. (체력 소진)");
                }
              }
            }
          } else {
            flare.isDead = true;
          }
        }

        let sfWrite = 0;
        for (let i = 0; i < this.solarFlares.length; i++) {
          if (!this.solarFlares[i].isDead) {
            this.solarFlares[sfWrite++] = this.solarFlares[i];
          }
        }
        this.solarFlares.length = sfWrite;
        this.crisisState.solarFlares = this.solarFlares;
      }

      // Entities
      const speedMultiplier = Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, this.enemies.length)) * 0.04));
      
      this.enemies.forEach(enemy => {
        enemy.update(deltaTime, speedMultiplier, this.bullets, this.player.position, this.enemies);
        const bullet = enemy.fire(this.player.position, this.enemies);
        if (bullet) this.bullets.push(bullet);
        
        // Handle Player Collision or Reaching Bottom Boundary
        if (enemy.checkCollision(this.player)) {
          if (enemy.type === EnemyType.BOSS) {
            enemy.hp -= 10;
            enemy.hitFlashTimer = 0.08;
            soundManager.playEnemyHit();
            if (enemy.hp <= 0) {
              enemy.isDead = true;
              this.createExplosion(enemy.position.x + enemy.size.width/2, enemy.position.y + enemy.size.height/2, '#fbbf24', 150, 3.0);
              this.triggerScreenShake(0.75);
              soundManager.playVictory();
              this.handleEnemyKill(enemy);
            }
          } else {
            enemy.isDead = true;
            this.createExplosion(enemy.position.x + enemy.size.width/2, enemy.position.y + enemy.size.height/2, enemy.color, 20);
            this.handleEnemyKill(enemy);
          }

          if (!this.isGodMode && this.player.invincibilityTimer <= 0) {
            this.player.hp -= 1;
            this.player.hitFlashTimer = 0.08;
            this.player.invincibilityTimer = 1.0;
            soundManager.playPlayerHit();
            this.player.stressLevel = Math.min(100, this.player.stressLevel + 40);
            this.combo = 0;
            this.updateScoreUI();
            this.createExplosion(this.player.position.x, this.player.position.y, '#ef4444', 10);
            this.triggerScreenShake(0.5);
            if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
            if (this.player.hp <= 0) this.gameOver("정수기능이 파괴되었습니다 (체력 소진)");
          }
        } else if (enemy.position.y + enemy.size.height >= this.logicalHeight) {
          enemy.isDead = true;
          this.createExplosion(enemy.position.x + enemy.size.width/2, this.logicalHeight - 10, enemy.color, 15);
          if (!this.isGodMode && this.player.invincibilityTimer <= 0) {
             this.player.hp -= 1;
             this.player.hitFlashTimer = 0.08;
             this.player.invincibilityTimer = 1.0;
             soundManager.playPlayerHit();
             this.player.stressLevel = Math.min(100, this.player.stressLevel + 20);
             this.combo = 0;
             this.updateScoreUI();
             this.triggerScreenShake(0.5);
             if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
             if (this.player.hp <= 0) {
                this.gameOver("워터 인베이더가 방어선을 돌파했습니다! (체력 소진)");
             }
          }
        }
      });
      
      this.helpers.forEach(helper => {
         const newBullets = helper.update(deltaTime, this.barricades, this.enemies, this.bullets);
         if (newBullets && newBullets.length > 0) {
            this.bullets.push(...newBullets);
         }
      });
      
      this.barricades.forEach(barricade => barricade.update(deltaTime));
      this.bullets.forEach(bullet => bullet.update(deltaTime));
      
      // Collision
      this.checkCollisions(deltaTime);
    }
    
    // Always update visual effects
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
    }
    this.particles.forEach(particle => particle.update(deltaTime));
    
    // In-place compaction for enemies (two-pointer writeIndex)
    let enemyWriteIdx = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.isDead) {
        this.enemies[enemyWriteIdx++] = e;
      }
    }
    this.enemies.length = enemyWriteIdx;

    // In-place compaction for helpers
    let helperWriteIdx = 0;
    for (let i = 0; i < this.helpers.length; i++) {
      const h = this.helpers[i];
      if (!h.isExpired()) {
        this.helpers[helperWriteIdx++] = h;
      }
    }
    this.helpers.length = helperWriteIdx;

    // In-place compaction for bullets
    let bulletWriteIdx = 0;
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      if (
        !b.isDead &&
        b.position.y > -50 &&
        b.position.y < this.logicalHeight + 50 &&
        b.position.x > -100 &&
        b.position.x < this.logicalWidth + 100
      ) {
        this.bullets[bulletWriteIdx++] = b;
      }
    }
    this.bullets.length = bulletWriteIdx;
    
    // Recycle dead particles into pool (in-place compaction)
    let particleWriteIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.isDead) {
        if (this.particlePool.length < 500) {
          this.particlePool.push(p);
        }
      } else {
        this.particles[particleWriteIdx++] = p;
      }
    }
    this.particles.length = particleWriteIdx;
    
    // In-place compaction for barricades
    let barricadeWriteIdx = 0;
    for (let i = 0; i < this.barricades.length; i++) {
      const b = this.barricades[i];
      if (!b.isDead) {
        this.barricades[barricadeWriteIdx++] = b;
      }
    }
    this.barricades.length = barricadeWriteIdx;
    
    // Multi-Faction Wave Clear Logic: only clears when all hostile Invaders and Rogues are destroyed
    let remainingHostiles = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.isDead && (e.faction === Faction.INVADER || e.faction === Faction.ROGUE)) {
        remainingHostiles++;
      }
    }

    const isEndGameCrisisEngaged = this.endGameCrisis !== null && !this.endGameCrisis.isDefeated();

    if (
      this.state === GameState.PLAYING &&
      remainingHostiles === 0 &&
      !isEndGameCrisisEngaged &&
      this.warningTimer <= 0 &&
      this.pendingReinforcement === null &&
      this.crisisState.warningTimer <= 0 &&
      (this.crisisState.activeCrisis === null || (this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0))
    ) {
      this.state = GameState.SHOP;
      this.warningTimer = 0;
      this.warningMessage = "";
      this.warningText = "";
      this.crisisState.activeCrisis = null;
      this.crisisState.warningTimer = 0;
      this.crisisState.bannerText = null;
      this.crisisState.empSuppressionActive = false;
      this.hazardProjectiles = [];
      if (this.endGameCrisis && this.endGameCrisis.isDefeated()) {
        this.endGameCrisis = null;
        this.endGameCrisisDefeatedHandled = false;
        if (this.onEndGameCrisisEvent) this.onEndGameCrisisEvent(null);
      }
      if (this.onCrisisEvent) this.onCrisisEvent(null);
      if (this.onStateChange) this.onStateChange(this.state);
      this.pause();
    }
  }
  
  private createExplosion(x: number, y: number, color: string, count: number, speedMult: number = 1.0) {
    if (count > 5) {
      soundManager.playExplosion();
    }
    for (let i = 0; i < count; i++) {
      let p = this.particlePool.pop();
      if (p) {
        p.init(x, y, color, speedMult);
      } else {
        p = new Particle(x, y, color, speedMult);
      }
      this.particles.push(p);
    }
  }

  private triggerScreenShake(duration: number) {
    this.shakeTimer = duration;
  }

  private checkCollisions(deltaTime: number = 1 / 60) {
    // =========================================================================
    // PHASE 1: Bullets vs Barricades, Bullets vs Bullets, Bullets vs Entities
    // =========================================================================
    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];
      if (bullet.isDead) continue;

      // 1.0 Bullet vs End-Game Crisis Entities (Rifts & Sovereign Body)
      if (this.endGameCrisis && this.endGameCrisis.isActive && bullet.faction === Faction.PLAYER) {
        if (this.endGameCrisis.handleBulletCollision(bullet, (scoreGain) => {
          this.score += scoreGain;
          this.combo++;
          this.comboTimer = 2.5;
          this.player.stressLevel = Math.min(100, this.player.stressLevel + 5);
          this.player.ultimateGauge = Math.min(100, this.player.ultimateGauge + 2.0);
          this.updateScoreUI();
        })) {
          soundManager.playEnemyHit();
          this.createExplosion(bullet.position.x, bullet.position.y, '#c084fc', 6);
          if (this.onEndGameCrisisEvent) {
            this.onEndGameCrisisEvent(this.endGameCrisis.getState());
          }
        }
      }
      if (bullet.isDead) continue;

      // 1.1 Bullet vs Barricades (Destructible & Indestructible Cover)
      let hitBarricade = false;
      for (const barricade of this.barricades) {
        if (!barricade.isDead && bullet.checkCollision(barricade)) {
          bullet.isDead = true;
          hitBarricade = true;

          if (barricade.type === BarricadeType.DESTRUCTIBLE) {
            barricade.hp -= bullet.damage;
            this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 5);
          } else {
            this.createExplosion(bullet.position.x, bullet.position.y, '#94a3b8', 3);
          }
          break;
        }
      }
      if (hitBarricade) continue;

      // 1.2 Generalized Bullet vs Bullet Interception (Hostile Factions)
      let intercepted = false;
      for (let j = 0; j < this.bullets.length; j++) {
        const otherBullet = this.bullets[j];
        if (i === j || otherBullet.isDead || bullet.faction === otherBullet.faction) continue;

        // Intercept if either bullet is designated interceptable OR hostile crossfire
        if (otherBullet.isInterceptable || bullet.isInterceptable) {
          if (bullet.checkCollision(otherBullet)) {
            bullet.isDead = true;
            otherBullet.isDead = true;
            intercepted = true;

            const midX = (bullet.position.x + otherBullet.position.x) / 2;
            const midY = (bullet.position.y + otherBullet.position.y) / 2;

            if (bullet.faction === Faction.PLAYER || otherBullet.faction === Faction.PLAYER) {
              this.createExplosion(midX, midY, '#a855f7', 8);
            } else {
              // Crossfire spark between Invader and Rogue ordnance
              this.createExplosion(midX, midY, '#f59e0b', 8);
              soundManager.playCrossfireHit();
            }
            break;
          }
        }
      }
      if (intercepted) continue;

      // 1.3 Bullet vs Enemies (Invaders, Rogues, and Friendly Fire Crossfire)
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        if (bullet.hitEntities.has(enemy)) continue;
        if (bullet.shooter === enemy) continue;

        if (bullet.checkCollision(enemy)) {
          bullet.hitEntities.add(enemy);
          bullet.piercing--;
          if (bullet.piercing <= 0) bullet.isDead = true;

          const isPlayerSource = bullet.faction === Faction.PLAYER;

          // Shield Handling
          if (enemy.type === EnemyType.SHIELDED && enemy.shieldHp > 0) {
            enemy.shieldHp -= bullet.damage;
            enemy.hitFlashTimer = 0.08;
            if (isPlayerSource) {
              soundManager.playEnemyHit();
            } else {
              soundManager.playCrossfireHit();
            }
            this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 6);

            if (enemy.shieldHp <= 0) {
              enemy.shieldHp = 0;
              enemy.shieldRegenTimer = 5.0;
              soundManager.playShieldBreak();
              this.createExplosion(enemy.position.x + enemy.size.width / 2, enemy.position.y + enemy.size.height / 2, '#38bdf8', 16);
            }
          } else {
            // Standard Damage
            enemy.hp -= bullet.damage;
            enemy.hitFlashTimer = 0.08;
            if (isPlayerSource) {
              soundManager.playEnemyHit();
              this.createExplosion(bullet.position.x, bullet.position.y, '#3b82f6', 5);
            } else {
              soundManager.playCrossfireHit();
              this.createExplosion(bullet.position.x, bullet.position.y, '#f59e0b', 6);
            }
          }

          // Enemy Elimination
          if (enemy.hp <= 0) {
            enemy.isDead = true;
            const isBoss = enemy.type === EnemyType.BOSS;
            const explosionColor = isBoss ? '#fbbf24' : (enemy.color || '#f97316');
            const particleCount = isBoss ? 150 : 30;
            const speedMult = isBoss ? 3.0 : 1.5;

            this.createExplosion(
              enemy.position.x + enemy.size.width / 2,
              enemy.position.y + enemy.size.height / 2,
              explosionColor,
              particleCount,
              speedMult
            );

            if (isBoss) {
              this.triggerScreenShake(0.75);
              soundManager.playVictory();
            }

            if (enemy.type === EnemyType.SPLITTER) {
              const spawnY = Math.max(0, Math.min(enemy.position.y, this.logicalHeight - 20));
              const spawnX1 = Math.max(0, Math.min(enemy.position.x - 15, this.logicalWidth - 20));
              const spawnX2 = Math.max(0, Math.min(enemy.position.x + 35, this.logicalWidth - 20));
              const mini1 = new Enemy(spawnX1, spawnY, this.logicalWidth, this.level, EnemyType.NORMAL, this.logicalHeight);
              const mini2 = new Enemy(spawnX2, spawnY, this.logicalWidth, this.level, EnemyType.NORMAL, this.logicalHeight);
              mini1.faction = enemy.faction;
              mini2.faction = enemy.faction;
              mini1.size = { width: 20, height: 20 };
              mini2.size = { width: 20, height: 20 };
              mini1.position.x = spawnX1;
              mini1.position.y = spawnY;
              mini2.position.x = spawnX2;
              mini2.position.y = spawnY;
              mini1.speedX = 10; mini1.speedY = 5;
              mini2.speedX = -10; mini2.speedY = 5;
              this.enemies.push(mini1, mini2);
            }

            if (isPlayerSource) {
              this.handleEnemyKill(enemy);
            } else {
              this.handleCrossfireKill(enemy, bullet.faction);
            }
          }

          if (bullet.isDead) break;
        }
      }
      if (bullet.isDead) continue;

      // 1.4 Bullet vs Helpers (Hostile bullets only)
      if (bullet.faction !== Faction.PLAYER) {
        let hitHelper = false;
        for (const helper of this.helpers) {
          if (!helper.isExpired() && bullet.checkCollision(helper)) {
            bullet.isDead = true;
            hitHelper = true;
            if (!helper.isInvincible) {
              helper.hp -= bullet.damage;
              this.createExplosion(bullet.position.x, bullet.position.y, helper.color, 10);
              if (helper.hp <= 0) {
                this.createExplosion(helper.position.x, helper.position.y, '#ef4444', 20);
              }
            }
            break;
          }
        }
        if (hitHelper) continue;

        // 1.5 Bullet vs Player
        if (bullet.checkCollision(this.player)) {
          bullet.isDead = true;
          if (!this.isGodMode && this.player.invincibilityTimer <= 0) {
            this.player.hp -= bullet.damage;
            this.player.hitFlashTimer = 0.08;
            this.player.invincibilityTimer = 1.0;
            soundManager.playPlayerHit();
            this.createExplosion(this.player.position.x + this.player.size.width / 2, this.player.position.y, '#ef4444', 10);
            this.triggerScreenShake(0.2);

            this.player.stressLevel = Math.min(100, this.player.stressLevel + 40);
            this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 20);
            this.combo = 0;
            if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);

            if (this.player.hp <= 0) {
              this.createExplosion(this.player.position.x + this.player.size.width / 2, this.player.position.y + this.player.size.height / 2, '#38bdf8', 200, 3.5);
              this.triggerScreenShake(1);
              this.gameOver("정수기가 파괴되었습니다. (체력 소진)");
            }
          }
        } else {
          // 1.6 Near-miss suppression trigger for hostile bullets passing player
          if (!bullet.hasTriggeredNearMiss &&
              bullet.position.y > this.player.position.y &&
              bullet.position.y < this.player.position.y + this.player.size.height) {
            const dx = Math.abs((bullet.position.x + bullet.size.width / 2) - (this.player.position.x + this.player.size.width / 2));
            if (dx < 80) {
              bullet.hasTriggeredNearMiss = true;
              this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 15);
              this.player.stressLevel = Math.min(100, this.player.stressLevel + 5);
            }
          }
        }
      }
    }

    // =========================================================================
    // PHASE 2: Hostile Entity vs Barricade (Independent loop)
    // =========================================================================
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.isGnawing = false;

      for (const barricade of this.barricades) {
        if (!barricade.isDead && enemy.checkCollision(barricade)) {
          if (enemy.type === EnemyType.DIVER) {
            enemy.isDead = true;
            if (barricade.type === BarricadeType.DESTRUCTIBLE) {
              barricade.hp -= 20;
            } else {
              this.createExplosion(enemy.position.x, enemy.position.y, '#94a3b8', 20);
            }
            this.createExplosion(enemy.position.x, enemy.position.y, '#ef4444', 30);
          } else {
            enemy.isGnawing = true;
            if (barricade.type === BarricadeType.DESTRUCTIBLE) {
              barricade.hp -= 6.0 * deltaTime;
            } else {
              enemy.position.y = Math.min(enemy.position.y, barricade.position.y - enemy.size.height);
            }
          }
        }
      }
    }

    // =========================================================================
    // PHASE 3: Hostile Entity vs Hostile Entity Inter-Faction Clashes
    // =========================================================================
    for (let i = 0; i < this.enemies.length; i++) {
      const enemyA = this.enemies[i];
      if (enemyA.isDead) continue;

      for (let j = i + 1; j < this.enemies.length; j++) {
        if (enemyA.isDead) break;
        const enemyB = this.enemies[j];
        if (enemyB.isDead || enemyA.faction === enemyB.faction) continue;

        if (enemyA.checkCollision(enemyB)) {
          enemyA.hp -= 1;
          enemyB.hp -= 1;
          enemyA.hitFlashTimer = 0.08;
          enemyB.hitFlashTimer = 0.08;
          soundManager.playCrossfireHit();
          this.createExplosion((enemyA.position.x + enemyB.position.x) / 2, (enemyA.position.y + enemyB.position.y) / 2, '#f59e0b', 4);

          if (enemyA.hp <= 0) {
            enemyA.isDead = true;
            this.createExplosion(enemyA.position.x + enemyA.size.width / 2, enemyA.position.y + enemyA.size.height / 2, enemyA.color || '#f97316', 25);
            this.handleCrossfireKill(enemyA, enemyB.faction);
          }
          if (enemyB.hp <= 0) {
            enemyB.isDead = true;
            this.createExplosion(enemyB.position.x + enemyB.size.width / 2, enemyB.position.y + enemyB.size.height / 2, enemyB.color || '#f97316', 25);
            this.handleCrossfireKill(enemyB, enemyA.faction);
          }
          if (enemyA.isDead) break;
        }
      }
    }
  }

  private handleEnemyKill(enemy?: Enemy) {
    this.combo++;
    this.comboTimer = 2.0; // 2 seconds to keep combo

    // Killing enemies gives adrenaline/stress & ultimate charge
    this.player.stressLevel = Math.min(100, this.player.stressLevel + 10);
    this.player.ultimateGauge = Math.min(100, this.player.ultimateGauge + 1.5);

    const comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.5;
    const baseScore = enemy && enemy.type === EnemyType.BOSS ? 1000 : 100;
    const baseCurrency = enemy && enemy.type === EnemyType.BOSS ? 50 : 5;

    this.score += Math.floor(baseScore * comboMultiplier);
    this.currency += Math.floor(baseCurrency * comboMultiplier);

    this.updateScoreUI();
  }

  private handleCrossfireKill(killedEnemy: Enemy, killerFaction: Faction) {
    this.combo++;
    this.comboTimer = 2.5; // Extended 2.5s window for crossfire chaos

    // Strategic crossfire charges ultimate
    this.player.ultimateGauge = Math.min(100, this.player.ultimateGauge + 2.0);

    const comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.5;
    const baseScore = killedEnemy.type === EnemyType.BOSS ? 1500 : 150;
    const baseCurrency = killedEnemy.type === EnemyType.BOSS ? 75 : 8;

    this.score += Math.floor(baseScore * comboMultiplier);
    this.currency += Math.floor(baseCurrency * comboMultiplier);

    this.createExplosion(
      killedEnemy.position.x + killedEnemy.size.width / 2,
      killedEnemy.position.y + killedEnemy.size.height / 2,
      '#38bdf8',
      12
    );

    this.updateScoreUI();
  }

  private updateScoreUI() {
    const invaderCount = this.enemies.filter(e => !e.isDead && e.faction === Faction.INVADER).length;
    const rogueCount = this.enemies.filter(e => !e.isDead && e.faction === Faction.ROGUE).length;
    if (this.onScoreChange) {
      this.onScoreChange(this.score, this.currency, this.combo, this.level, this.player ? this.player.ultimateGauge : 0, invaderCount, rogueCount);
    }
  }

  public gameOverReason: string = "";

  private gameOver(reason: string) {
    this.gameOverReason = reason;
    this.state = GameState.GAME_OVER;
    this.alliedReinforcements = undefined;
    soundManager.playGameOver();
    
    try {
      const best = localStorage.getItem('waterInvaderHighScore');
      const parsedHighScore = best ? parseInt(best, 10) : 0;
      const validHighScore = Number.isFinite(parsedHighScore) && parsedHighScore >= 0 ? parsedHighScore : 0;
      if (!best || this.score > validHighScore || !Number.isFinite(parsedHighScore)) {
        localStorage.setItem('waterInvaderHighScore', this.score.toString());
      }
    } catch (e) {
      // Ignore if localStorage is disabled
    }

    if (this.onStateChange) this.onStateChange(this.state);
  }

  private drawBossHpBar(boss: Enemy) {
    this.ctx.save();
    const barW = 320;
    const barH = 16;
    const barX = (this.logicalWidth - barW) / 2;
    const barY = 28;

    // Boss Title
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.fillStyle = '#ef4444';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚠️ BOSS: BIO-MECH TITAN ⚠️', this.logicalWidth / 2, barY - 6);

    // Background Frame
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 2;
    if (this.ctx.roundRect) {
      this.ctx.beginPath();
      this.ctx.roundRect(barX, barY, barW, barH, 8);
      this.ctx.fill();
      this.ctx.stroke();
    } else {
      this.ctx.fillRect(barX, barY, barW, barH);
      this.ctx.strokeRect(barX, barY, barW, barH);
    }

    // Health Fill
    const maxHp = boss.maxHp || (boss.level * 10);
    const ratio = Math.max(0, Math.min(1, boss.hp / maxHp));
    const fillW = Math.max(0, (barW - 4) * ratio);

    if (fillW > 0) {
      const grad = this.ctx.createLinearGradient(barX + 2, barY + 2, barX + 2 + fillW, barY + 2);
      if (ratio < 0.3) {
        grad.addColorStop(0, '#f87171');
        grad.addColorStop(1, '#dc2626');
      } else {
        grad.addColorStop(0, '#fbbf24');
        grad.addColorStop(1, '#ef4444');
      }
      this.ctx.fillStyle = grad;
      if (this.ctx.roundRect) {
        this.ctx.beginPath();
        this.ctx.roundRect(barX + 2, barY + 2, fillW, barH - 4, 6);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);
      }
    }

    // HP Text (with fast drop shadow)
    this.ctx.font = 'bold 11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(`${boss.hp} / ${maxHp} HP`, this.logicalWidth / 2 + 1, barY + barH - 3);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`${boss.hp} / ${maxHp} HP`, this.logicalWidth / 2, barY + barH - 4);

    this.ctx.restore();
  }

  private draw() {
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    const time = performance.now() / 1000;

    // =========================================================================
    // LAYER 1: STATIC BACKGROUND LAYER
    // Crisis warning background fills, starfield, environmental tint
    // (Rendered without screen shake displacement so no unpainted gaps appear)
    // =========================================================================

    // 1.1 Base void fill (dark slate #0f172a)
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // 1.2 Crisis warning background fills & environmental tint (DRAWN BEHIND ENTITIES)
    if (this.warningTimer > 0) {
      const isThirdFaction = (this.warningMessage || this.warningText).includes('ROGUE') || 
                             (this.warningMessage || this.warningText).includes('THIRD') || 
                             (this.warningMessage || this.warningText).includes('3-WAY');
      this.ctx.fillStyle = isThirdFaction 
        ? 'rgba(132, 204, 22, 0.12)' 
        : (this.pendingReinforcement === 'ALLY' ? 'rgba(34, 197, 94, 0.10)' : 'rgba(239, 68, 68, 0.12)');
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    }

    // 1.3 Active crisis environmental tint (Acid Storm / EMP)
    if (this.crisisState.activeCrisis === 'ACID_STORM' && this.crisisState.timer > 0) {
      this.ctx.fillStyle = 'rgba(132, 204, 22, 0.05)';
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    } else if (this.crisisState.empSuppressionActive) {
      this.ctx.fillStyle = 'rgba(34, 211, 238, 0.04)';
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    }

    // 1.4 End-Game Crisis ambient radial vignette if in INCURSION phase (DRAWN BEHIND ENTITIES)
    if (this.endGameCrisis && this.endGameCrisis.isActive && this.endGameCrisis.phase === CrisisPhase.INCURSION) {
      const pulse = (Math.sin(this.endGameCrisis.warningTimer * 8) + 1) / 2;
      const vig = this.ctx.createRadialGradient(
        this.logicalWidth / 2, this.logicalHeight / 2, this.logicalHeight * 0.2,
        this.logicalWidth / 2, this.logicalHeight / 2, this.logicalHeight * 0.7
      );
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, `rgba(147, 51, 234, ${0.35 * pulse})`);
      this.ctx.fillStyle = vig;
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    }

    // 1.5 Starfield / scrolling background bubbles (No shake)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.beginPath();
    for (let i = 0; i < 30; i++) {
      const x = (Math.sin(i * 13) * 1000 + time * 10) % this.logicalWidth;
      const y = this.logicalHeight - ((time * 50 * (i % 3 + 1) + i * 90) % this.logicalHeight);
      const size = (i % 4) + 1;
      const absX = Math.abs(x);
      const absY = Math.abs(y);
      this.ctx.moveTo(absX + size, absY);
      this.ctx.arc(absX, absY, size, 0, Math.PI * 2);
    }
    this.ctx.fill();

    // =========================================================================
    // LAYER 2: WORLD LAYER (Save context, apply screen shake, render world)
    // =========================================================================
    this.ctx.save();
    if (this.shakeTimer > 0) {
      let shakeAmount = 2;
      if (this.warningTimer > 0) {
        shakeAmount = 5;
      }
      const offsetX = (Math.random() - 0.5) * shakeAmount;
      const offsetY = (Math.random() - 0.5) * shakeAmount;
      this.ctx.translate(offsetX, offsetY);
    }

    // 2.1 World Entities
    this.barricades.forEach(b => b.draw(this.ctx));
    this.player.draw(this.ctx);
    this.helpers.forEach(h => h.draw(this.ctx));
    this.enemies.forEach(e => e.draw(this.ctx));
    this.bullets.forEach(b => b.draw(this.ctx));
    this.particles.forEach(p => p.draw(this.ctx));

    // 2.2 Hazard Projectiles (Acid Storm) - Directional Toxic Teardrops with crisp black border
    if (this.hazardProjectiles.length > 0) {
      for (const hz of this.hazardProjectiles) {
        if (hz.isDead) continue;
        this.ctx.save();
        
        // 1. Black outer perimeter stroke (1.5px) for high contrast
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(hz.x, hz.y + hz.radius * 0.4, hz.radius, 0, Math.PI);
        this.ctx.lineTo(hz.x, hz.y - hz.radius * 1.5);
        this.ctx.closePath();
        this.ctx.stroke();

        // 2. Saturated Toxic Acid Body
        this.ctx.fillStyle = hz.color || '#a3e635';
        this.ctx.fill();

        // 3. Sizzling White Core Highlight
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(hz.x, hz.y + hz.radius * 0.3, hz.radius * 0.35, 0, Math.PI * 2);
        this.ctx.fill();

        // 4. Trailing Sizzle Vapor
        this.ctx.fillStyle = 'rgba(163, 230, 53, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(hz.x, hz.y - hz.radius * 1.8, hz.radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
      }
    }

    // 2.3 Solar Flare Hazards
    if (this.solarFlares.length > 0) {
      for (const flare of this.solarFlares) {
        if (flare.isDead) continue;
        this.ctx.save();
        if (flare.chargeTimer > 0) {
          // Warning telegraph vertical indicator
          const chargeProgress = 1 - (flare.chargeTimer / flare.chargeDuration);
          const pulse = (Math.sin(chargeProgress * Math.PI * 6) + 1) * 0.5;
          this.ctx.fillStyle = `rgba(245, 158, 11, ${0.12 + pulse * 0.20})`;
          this.ctx.fillRect(flare.x, 0, flare.width, this.logicalHeight);

          // Crisp dashed warning telegraph edges
          this.ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + pulse * 0.4})`;
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([8, 6]);
          this.ctx.beginPath();
          this.ctx.moveTo(flare.x, 0);
          this.ctx.lineTo(flare.x, this.logicalHeight);
          this.ctx.moveTo(flare.x + flare.width, 0);
          this.ctx.lineTo(flare.x + flare.width, this.logicalHeight);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        } else if (flare.activeTimer > 0) {
          // Active roaring plasma column
          const flareAlpha = Math.min(1.0, flare.activeTimer / 0.3);
          
          // Outer blazing aura
          const grad = this.ctx.createLinearGradient(flare.x, 0, flare.x + flare.width, 0);
          grad.addColorStop(0, `rgba(239, 68, 68, ${0.3 * flareAlpha})`);
          grad.addColorStop(0.2, `rgba(245, 158, 11, ${0.85 * flareAlpha})`);
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${0.95 * flareAlpha})`);
          grad.addColorStop(0.8, `rgba(245, 158, 11, ${0.85 * flareAlpha})`);
          grad.addColorStop(1, `rgba(239, 68, 68, ${0.3 * flareAlpha})`);

          this.ctx.fillStyle = grad;
          this.ctx.fillRect(flare.x, 0, flare.width, this.logicalHeight);

          // Black high contrast border edges
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 1.5;
          this.ctx.strokeRect(flare.x, 0, flare.width, this.logicalHeight);
        }
        this.ctx.restore();
      }
    }

    // 2.4 EMP Disruption Visual Static Sweep
    if (this.crisisState.empSuppressionActive) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
      this.ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const lineY = (time * 400 + i * 200) % this.logicalHeight;
        this.ctx.beginPath();
        this.ctx.moveTo(0, lineY);
        this.ctx.lineTo(this.logicalWidth, lineY);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 2.5 End-Game Crisis Entity Vector Art & Multi-Segment Boss HUD
    if (this.endGameCrisis && this.endGameCrisis.isActive) {
      this.endGameCrisis.draw(this.ctx, this.logicalWidth, this.logicalHeight);
    }

    // 2.6 Allied Reinforcements Dreadnought, Escort Fighters, Laser Grid & Nano-Shield
    if (this.alliedReinforcements && this.alliedReinforcements.isActive) {
      this.alliedReinforcements.draw(this.ctx);
      this.alliedReinforcements.drawPlayerNanoShield(this.ctx, this.player);
    }

    this.ctx.restore(); // Exit shake layer

    // =========================================================================
    // LAYER 3: STABLE FOREGROUND LAYER
    // Perimeter warning hazard stripes/borders, HUD, notifications (No Shake)
    // =========================================================================

    // 3.1 Boss HP Bar (F-14)
    const activeBoss = this.enemies.find(e => e.type === EnemyType.BOSS && !e.isDead);
    if (activeBoss) {
      this.drawBossHpBar(activeBoss);
    }

    // 3.2 Debug Overlay
    if (this.isDebugMode) {
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = '#ff00ff'; // Magenta for hitboxes
      
      // Draw hitboxes
      [this.player, ...this.enemies, ...this.helpers, ...this.bullets, ...this.barricades].forEach(entity => {
        if (!entity.isDead) {
          const r = entity.getRect();
          this.ctx.strokeRect(r.x, r.y, r.width, r.height);
        }
      });
      
      // Draw Metrics
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(5, 5, 180, 100);
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
      this.ctx.fillText(`God Mode: ${this.isGodMode ? 'ON' : 'OFF'}`, 10, 35);
      this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 50);
      this.ctx.fillText(`Bullets: ${this.bullets.length}`, 10, 65);
      this.ctx.fillText(`Particles: ${this.particles.length}`, 10, 80);
      this.ctx.fillText(`Barricades: ${this.barricades.length}`, 10, 95);
    }

    // 3.3 Stable Perimeter Warning Hazard Stripes / Borders & Warning Notifications
    if (this.warningTimer > 0) {
      const isThirdFaction = (this.warningMessage || this.warningText).includes('ROGUE') || 
                             (this.warningMessage || this.warningText).includes('THIRD') || 
                             (this.warningMessage || this.warningText).includes('3-WAY');
      
      // Crisp 4px perimeter border stroke (stable at boundaries without shaking off-canvas)
      this.ctx.strokeStyle = isThirdFaction 
        ? 'rgba(132, 204, 22, 0.85)' 
        : (this.pendingReinforcement === 'ALLY' ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)');
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(2, 2, this.logicalWidth - 4, this.logicalHeight - 4);

      // Warning text with crisp stroke outline
      this.ctx.fillStyle = isThirdFaction ? '#84cc16' : (this.pendingReinforcement === 'ALLY' ? '#4ade80' : '#ef4444');
      this.ctx.font = 'bold 36px sans-serif';
      this.ctx.textAlign = 'center';
      
      // Flash effect with crisp stroked outline
      if (Math.floor(time * 10) % 2 === 0) {
        const text = this.warningMessage || this.warningText;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(text, this.logicalWidth / 2, this.logicalHeight / 2);
        this.ctx.fillText(text, this.logicalWidth / 2, this.logicalHeight / 2);
      }
    }

    // 3.4 Allied Reinforcements In-Game Announcement Banner
    if (this.alliedReinforcements && this.alliedReinforcements.hasActiveBanner()) {
      this.alliedReinforcements.drawUI(this.ctx, this.logicalWidth, this.logicalHeight);
    }

    this.ctx.restore();
  }

  public triggerSummonAlly() {
    if (this.state !== GameState.PLAYING) return;
    if (this.currency >= 50) {
      this.currency -= 50;
      this.pendingReinforcement = 'ALLY';
      this.reinforcementTimer = 0.1; // trigger almost immediately
      this.warningMessage = "ALLY SUPPORT SUMMONED!";
      this.warningTimer = 2.0;
      this.updateScoreUI();
    }
  }

  // Ultimate Skill: Heavy Rain
  public triggerUltimate() {
    if (this.state !== GameState.PLAYING) return;
    if (this.player.ultimateGauge >= 100) {
      this.player.ultimateGauge = 0;
      soundManager.playPowerUp(); // or a new ultimate sound
      
      this.triggerScreenShake(0.5);
      
      // Spawn massive amount of bullets from the top
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * this.logicalWidth;
        const b = new Bullet(x, -20, 300, 10, true, 3); // Downward moving, piercing, high damage player bullet
        b.faction = Faction.PLAYER;
        b.velocity.x = (Math.random() - 0.5) * 50;
        this.bullets.push(b);
      }
      
      this.updateScoreUI();
    }
  }

  // Input handling mapped from React
  public handleKeyDown(key: string) {
    const k = key.toLowerCase();
    this.keysPressed[k] = true;

    if (this.state === GameState.PLAYING) {
      if (k === 'arrowleft' || k === 'a') this.player.isMovingLeft = true;
      if (k === 'arrowright' || k === 'd') this.player.isMovingRight = true;
      if (k === ' ' || k === 'spacebar' || k === 'space') {
        this.player.isShooting = true;
      }
      if (k === 'e' || k === 'shift') {
        this.triggerUltimate();
      }
      if (k === 'q') {
        this.triggerSummonAlly();
      }
    }
    
    // Debug & Cheats
    if (k === 'f3') this.isDebugMode = !this.isDebugMode;
    if (k === 'f4') this.isGodMode = !this.isGodMode;
    if (k === 'f5') {
      this.currency += 1000;
      this.updateScoreUI();
    }
  }

  public handleKeyUp(key: string) {
    const k = key.toLowerCase();
    this.keysPressed[k] = false;

    if (k === 'arrowleft' || k === 'a') {
      this.player.isMovingLeft = !!(this.keysPressed['arrowleft'] || this.keysPressed['a']);
    }
    if (k === 'arrowright' || k === 'd') {
      this.player.isMovingRight = !!(this.keysPressed['arrowright'] || this.keysPressed['d']);
    }
    if (k === ' ' || k === 'spacebar' || k === 'space') {
      this.player.isShooting = !!(this.keysPressed[' '] || this.keysPressed['spacebar'] || this.keysPressed['space']);
    }
  }

  public getUpgrades(): { fireRate: number; multiShot: number; piercing: number; hasAcidShield: boolean } {
    const fireRateLevel = this.player ? Math.min(5, Math.max(1, Math.round((0.5 - this.player.baseFireRate) / 0.1) + 1)) : 1;
    return {
      fireRate: fireRateLevel,
      multiShot: this.player ? this.player.multiShot : 1,
      piercing: this.player ? this.player.piercing : 1,
      hasAcidShield: this.player ? !!this.player.hasAcidShield : false,
    };
  }

  public updateUpgradesUI() {
    if (this.onUpgradesChange && this.player) {
      this.onUpgradesChange(this.getUpgrades());
    }
  }
  
  // Upgrades
  public upgradeFireRate() {
    if (this.currency >= 50 && this.getUpgrades().fireRate < 5) {
      this.currency -= 50;
      this.player.fireRate = Math.max(0.1, Number((this.player.fireRate - 0.1).toFixed(2)));
      soundManager.playPowerUp();
      this.updateScoreUI();
      this.updateUpgradesUI();
    }
  }
  
  public upgradeMultiShot() {
    if (this.currency >= 100 && this.player.multiShot < 5) {
      this.currency -= 100;
      this.player.multiShot++;
      soundManager.playPowerUp();
      this.updateScoreUI();
      this.updateUpgradesUI();
    }
  }

  public upgradePiercing() {
    if (this.currency >= 200 && this.player.piercing < 5) {
      this.currency -= 200;
      this.player.piercing++;
      soundManager.playPowerUp();
      this.updateScoreUI();
      this.updateUpgradesUI();
    }
  }

  public upgradeAcidShield() {
    if (this.currency >= 150 && this.player && !this.player.hasAcidShield) {
      this.currency -= 150;
      this.player.hasAcidShield = true;
      soundManager.playPowerUp();
      this.updateScoreUI();
      this.updateUpgradesUI();
    }
  }
}

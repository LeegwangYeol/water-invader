import { GameState, Faction } from './types';
import { Player } from './Player';
import { Enemy, EnemyType } from './Enemy';
import { Bullet } from './Bullet';
import { Particle } from './Particle';
import { Barricade, BarricadeType } from './Barricade';
import { Helper, HelperType } from './Helper';
import { soundManager } from './SoundManager';

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
  public currency: number = 0; // Pure Water
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
  public onUpgradesChange?: (upgrades: { fireRate: number; multiShot: number; piercing: number }) => void;

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

  public init() {
    if (!this.player) {
      this.player = new Player(this.logicalWidth, this.logicalHeight);
    } else {
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
    this.score = 0;
    this.currency = 0;
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

  private spawnWave() {
    if (this.level % 5 === 0) {
      // Boss wave (F-13: spawn Y lowered to 90)
      const boss = new Enemy(this.logicalWidth / 2 - 75, 90, this.logicalWidth, this.level, EnemyType.BOSS, this.logicalHeight);
      this.enemies.push(boss);
      return;
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
    if (this.state === GameState.PLAYING && remainingHostiles === 0 && this.warningTimer <= 0 && this.pendingReinforcement === null) {
      this.state = GameState.SHOP;
      this.warningTimer = 0;
      this.warningMessage = "";
      this.warningText = "";
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

      // 1.3 Bullet vs Enemies (Invaders & Rogues)
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        if (bullet.faction === enemy.faction) continue; // Friendly fire immunity
        if (bullet.hitEntities.has(enemy)) continue;

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
    
    // Screen shake
    if (this.shakeTimer > 0) {
      let shakeAmount = 2;
      if (this.warningTimer > 0) {
         shakeAmount = 5;
      }
      const offsetX = (Math.random() - 0.5) * shakeAmount;
      const offsetY = (Math.random() - 0.5) * shakeAmount;
      this.ctx.translate(offsetX, offsetY);
    }

    // Clear
    this.ctx.fillStyle = '#0f172a'; // dark slate
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Draw scrolling background (Batched bubbles in single path)
    const time = performance.now() / 1000;
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

    // Draw Entities
    this.barricades.forEach(b => b.draw(this.ctx));
    this.player.draw(this.ctx);
    this.helpers.forEach(h => h.draw(this.ctx));
    this.enemies.forEach(e => e.draw(this.ctx));
    this.bullets.forEach(b => b.draw(this.ctx));
    this.particles.forEach(p => p.draw(this.ctx));

    // Boss HP Bar (F-14)
    const activeBoss = this.enemies.find(e => e.type === EnemyType.BOSS && !e.isDead);
    if (activeBoss) {
      this.drawBossHpBar(activeBoss);
    }
    
    // Debug Overlay
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
    
    // UI overlays that shouldn't shake
    if (this.warningTimer > 0) {
      const isThirdFaction = (this.warningMessage || this.warningText).includes('ROGUE') || (this.warningMessage || this.warningText).includes('THIRD') || (this.warningMessage || this.warningText).includes('3-WAY');
      this.ctx.fillStyle = isThirdFaction ? 'rgba(132, 204, 22, 0.25)' : (this.pendingReinforcement === 'ALLY' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.3)');
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
      
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

  public getUpgrades(): { fireRate: number; multiShot: number; piercing: number } {
    const fireRateLevel = this.player ? Math.min(5, Math.max(1, Math.round((0.5 - this.player.baseFireRate) / 0.1) + 1)) : 1;
    return {
      fireRate: fireRateLevel,
      multiShot: this.player ? this.player.multiShot : 1,
      piercing: this.player ? this.player.piercing : 1,
    };
  }

  public updateUpgradesUI() {
    if (this.onUpgradesChange && this.player) {
      this.onUpgradesChange(this.getUpgrades());
    }
  }
  
  // Upgrades
  public upgradeFireRate() {
    if (this.currency >= 50 && this.player.fireRate > 0.1) {
      this.currency -= 50;
      this.player.fireRate = Math.max(0.1, this.player.fireRate - 0.1);
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
}

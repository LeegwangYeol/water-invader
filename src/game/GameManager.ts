import { GameState } from './types';
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
  
  // Progression
  public score: number = 0;
  public currency: number = 0; // Pure Water
  public combo: number = 0;
  private comboTimer: number = 0;
  public level: number = 1;
  
  private shakeTimer: number = 0;
  
  // Reinforcement System
  private reinforcementTimer: number = 10;
  private warningTimer: number = 0;
  private warningMessage: string = "";
  private pendingReinforcement: 'ENEMY' | 'ALLY' | null = null;
  
  // Debugging & Developer Tools
  public isDebugMode: boolean = false;
  public isGodMode: boolean = false;
  public fps: number = 0;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  
  public isResting: boolean = false;
  public waveRestTimer: number = 0;
  
  public readonly logicalWidth: number = 600;
  public readonly logicalHeight: number = 800;
  public dpr: number = 1;
  
  public isPaused: boolean = false;
  public keysPressed: { [key: string]: boolean } = {};

  // Callbacks for React UI updates
  public onStateChange?: (state: GameState) => void;
  public onScoreChange?: (score: number, currency: number, combo: number, wave: number, ultimateGauge: number) => void;
  public onPlayerHpChange?: (hp: number) => void;
  public onUpgradesChange?: (upgrades: { fireRate: number; multiShot: number; piercing: number }) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.canvas.width = this.logicalWidth * this.dpr;
    this.canvas.height = this.logicalHeight * this.dpr;
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
    this.combo = 0;
    this.level = 1;
    this.shakeTimer = 0;
    this.isPaused = false;
    
    this.reinforcementTimer = 10;
    this.warningTimer = 0;
    this.warningMessage = "";
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
      const boss = new Enemy(this.logicalWidth / 2 - 75, 90, this.logicalWidth, this.level, EnemyType.BOSS);
      this.enemies.push(boss);
      return;
    }

    const rows = Math.min(5, 3 + Math.floor(this.level / 4));
    const cols = Math.min(8, 6 + Math.floor(this.level / 3));
    const paddingX = 60;
    const paddingY = 50;
    const offsetX = Math.max(20, (this.logicalWidth - ((cols - 1) * paddingX)) / 2);
    
    let specialCount = 0;
    const maxSpecials = Math.max(1, Math.min(1 + Math.floor(this.level / 2), 4)); // 1~2 early on, cap at 4
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = EnemyType.NORMAL;
        
        if (r === 1 && c % 2 === 0) {
          type = EnemyType.ZIGZAG; // keep some zigzags
        } else if (specialCount < maxSpecials && Math.random() > 0.85) {
          const specials = [EnemyType.SNIPER, EnemyType.DIVER, EnemyType.SHIELDED, EnemyType.SPLITTER];
          type = specials[Math.floor(Math.random() * specials.length)];
          specialCount++;
        }
        
        // F-13: Spawn Y offset at 80 so enemies and bullets do not emerge behind top HUD overlay cards
        this.enemies.push(new Enemy(offsetX + c * paddingX, 80 + r * paddingY, this.logicalWidth, this.level, type));
      }
    }
  }

  private loop = (timestamp: number) => {
    if (this.state === GameState.MENU) return;

    const deltaTime = Math.max(0, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    
    // FPS Calculation
    this.frameCount++;
    if (timestamp - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = timestamp;
    }

    // Fixed timestep update for physics stability (clamped between 0 and 0.1)
    this.update(Math.min(deltaTime, 0.1));
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
      
      // Reinforcement logic
      if (this.warningTimer > 0) {
        this.warningTimer -= deltaTime;
        if (this.warningTimer <= 0 && this.pendingReinforcement) {
          // Spawn reinforcement
          if (this.pendingReinforcement === 'ENEMY') {
            // Spawn rapid zigzag enemies (spawn Y at 80)
            for (let i = 0; i < 4; i++) {
               this.enemies.push(new Enemy(50 + i * 100, 80, this.logicalWidth, this.level + 2, EnemyType.ZIGZAG));
            }
          } else if (this.pendingReinforcement === 'ALLY') {
            // Spawn friendly helpers (FIGHTER, REPAIRER, TANK)
            const count = Math.floor(Math.random() * 3) + 1; // 1 to 3
            for (let i = 0; i < count; i++) {
              const type = Math.floor(Math.random() * 3); // 0, 1, 2
              this.helpers.push(new Helper(
                 Math.random() * (this.logicalWidth - 40), 
                 this.logicalHeight - 80, 
                 this.logicalWidth, 
                 this.logicalHeight, 
                 type as HelperType
              ));
              this.createExplosion(this.logicalWidth / 2, this.logicalHeight - 20, '#4ade80', 20);
            }
          }
          this.pendingReinforcement = null;
        }
      } else {
        this.reinforcementTimer -= deltaTime;
        if (this.reinforcementTimer <= 0) {
          this.reinforcementTimer = Math.random() * 10 + 10; // 10-20 seconds
          if (Math.random() > 0.5 && this.enemies.length > 0) {
            this.triggerScreenShake(1);
            this.warningTimer = 2.0;
            this.pendingReinforcement = Math.random() > 0.6 ? 'ALLY' : 'ENEMY';
            this.warningMessage = this.pendingReinforcement === 'ENEMY' ? "WARNING! ENEMY REINFORCEMENTS!" : "ALLY SUPPORT INCOMING!";
          }
        }
      }

      // Entities
      // Smooth scaling: scales smoothly from 1.0x to 1.8x as enemies decrease
      const speedMultiplier = Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, this.enemies.length)) * 0.04));
      
      this.enemies.forEach(enemy => {
        enemy.update(deltaTime, speedMultiplier, this.bullets, this.player.position);
        const bullet = enemy.fire(this.player.position);
        if (bullet) this.bullets.push(bullet);
        
        // Enemies reaching the bottom line cost 1 HP instead of instant game over
        if (enemy.position.y + enemy.size.height >= this.player.position.y) {
          if (enemy.position.y > this.logicalHeight) {
            enemy.isDead = true; // Escaped off screen
            if (!this.isGodMode) {
               this.player.hp -= 1; // Penalty for letting them pass
               this.player.hitFlashTimer = 0.08;
               soundManager.playPlayerHit();
               this.player.stressLevel = Math.min(100, this.player.stressLevel + 20);
               this.triggerScreenShake(0.5);
               if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
               if (this.player.hp <= 0) {
                  this.gameOver("워터 인베이더가 방어선을 돌파했습니다! (체력 소진)");
               }
            }
          } else if (enemy.checkCollision(this.player)) {
            if (enemy.type === EnemyType.BOSS) {
              enemy.hp -= 10;
              enemy.hitFlashTimer = 0.08;
              soundManager.playEnemyHit();
              if (enemy.hp <= 0) {
                enemy.isDead = true;
                this.createExplosion(enemy.position.x + enemy.size.width/2, enemy.position.y + enemy.size.height/2, '#fbbf24', 150, 3.0);
                this.triggerScreenShake(0.75);
                soundManager.playVictory();
                this.handleEnemyKill();
              }
            } else {
              enemy.isDead = true;
              this.createExplosion(enemy.position.x + enemy.size.width/2, enemy.position.y + enemy.size.height/2, enemy.color, 20);
              this.handleEnemyKill();
            }

            if (!this.isGodMode && this.player.invincibilityTimer <= 0) {
              this.player.hp -= 1;
              this.player.hitFlashTimer = 0.08;
              this.player.invincibilityTimer = 1.0;
              soundManager.playPlayerHit();
              this.player.stressLevel = Math.min(100, this.player.stressLevel + 40);
              this.createExplosion(this.player.position.x, this.player.position.y, '#ef4444', 10);
              this.triggerScreenShake(0.5);
              if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
              if (this.player.hp <= 0) this.gameOver("정수기능이 파괴되었습니다 (체력 소진)");
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
      this.checkCollisions();
    }
    
    // Always update visual effects
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
    }
    this.particles.forEach(particle => particle.update(deltaTime));
    
    // Cleanup dead entities
    this.enemies = this.enemies.filter(e => !e.isDead);
    this.helpers = this.helpers.filter(h => !h.isExpired());
    this.bullets = this.bullets.filter(b => 
      !b.isDead && 
      b.position.y > -50 && 
      b.position.y < this.logicalHeight + 50 &&
      b.position.x > -100 &&
      b.position.x < this.logicalWidth + 100
    );
    
    // Recycle dead particles into pool
    let writeIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.isDead) {
        if (this.particlePool.length < 500) {
          this.particlePool.push(p);
        }
      } else {
        this.particles[writeIdx++] = p;
      }
    }
    this.particles.length = writeIdx;
    
    this.barricades = this.barricades.filter(b => !b.isDead);
    
    // Next wave - transition to Intermission Shop
    if (this.state === GameState.PLAYING && this.enemies.length === 0 && this.warningTimer <= 0) {
      this.state = GameState.SHOP;
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

  private checkCollisions() {
    for (const bullet of this.bullets) {
      if (bullet.isDead) continue;
      
      // Check barricades first
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

      if (bullet.isPlayerBullet) {
        // Player bullet vs Interceptable Enemy Bullets (F-07)
        let intercepted = false;
        for (const enemyBullet of this.bullets) {
          if (!enemyBullet.isDead && !enemyBullet.isPlayerBullet && enemyBullet.isInterceptable) {
            if (bullet.checkCollision(enemyBullet)) {
              bullet.isDead = true;
              enemyBullet.isDead = true;
              intercepted = true;
              this.createExplosion(
                (bullet.position.x + enemyBullet.position.x) / 2,
                (bullet.position.y + enemyBullet.position.y) / 2,
                '#a855f7',
                8
              );
              break;
            }
          }
        }
        if (intercepted) continue;

        for (const enemy of this.enemies) {
          if (enemy.isDead) continue;
          if (bullet.hitEntities.has(enemy)) continue;
          
          if (bullet.checkCollision(enemy)) {
            bullet.hitEntities.add(enemy);
            bullet.piercing--;
            if (bullet.piercing <= 0) bullet.isDead = true;
            
            // Shielded enemy damage & cooldown (F-06)
            if (enemy.type === EnemyType.SHIELDED && enemy.shieldHp > 0) {
              enemy.shieldHp -= bullet.damage;
              enemy.hitFlashTimer = 0.08;
              soundManager.playEnemyHit();
              this.createExplosion(bullet.position.x, bullet.position.y, '#38bdf8', 6);
              if (enemy.shieldHp <= 0) {
                enemy.shieldHp = 0;
                enemy.shieldRegenTimer = 5.0; // 5s cooldown before shield regenerates
                soundManager.playShieldBreak();
                this.createExplosion(enemy.position.x + enemy.size.width / 2, enemy.position.y + enemy.size.height / 2, '#38bdf8', 16);
              }
            } else {
              enemy.hp -= bullet.damage;
              enemy.hitFlashTimer = 0.08;
              soundManager.playEnemyHit();
              this.createExplosion(bullet.position.x, bullet.position.y, '#3b82f6', 5); // water splash
            }
            
            if (enemy.hp <= 0) {
              enemy.isDead = true;
              const isBoss = enemy.type === EnemyType.BOSS;
              const explosionColor = isBoss ? '#fbbf24' : enemy.color;
              const particleCount = isBoss ? 150 : 30;
              const speedMult = isBoss ? 3.0 : 1.5;
              
              this.createExplosion(enemy.position.x + enemy.size.width/2, enemy.position.y + enemy.size.height/2, explosionColor, particleCount, speedMult);
              
              if (isBoss) {
                this.triggerScreenShake(0.75);
                soundManager.playVictory();
              }
              
              if (enemy.type === EnemyType.SPLITTER) {
                // Spawn 2 mini-enemies that are extremely slow
                const mini1 = new Enemy(enemy.position.x - 15, enemy.position.y, this.logicalWidth, this.level, EnemyType.NORMAL);
                const mini2 = new Enemy(enemy.position.x + 35, enemy.position.y, this.logicalWidth, this.level, EnemyType.NORMAL);
                mini1.size = { width: 20, height: 20 };
                mini2.size = { width: 20, height: 20 };
                mini1.speedX = 10; mini1.speedY = 5;
                mini2.speedX = -10; mini2.speedY = 5;
                this.enemies.push(mini1, mini2);
              }
              
              this.handleEnemyKill();
            }
            if (bullet.isDead) break;
          }
        }
      } else {
        // Enemy bullet vs Helpers
        let hitHelper = false;
        for (const helper of this.helpers) {
          if (bullet.checkCollision(helper)) {
            bullet.isDead = true;
            hitHelper = true;
            if (!helper.isInvincible) {
               helper.hp -= bullet.damage;
               this.createExplosion(bullet.position.x, bullet.position.y, helper.color, 10);
            }
            break;
          }
        }
        
        if (hitHelper) continue;

        // Enemy bullet vs Player (F-04: Player i-frames)
        if (bullet.checkCollision(this.player)) {
          bullet.isDead = true;
          if (!this.isGodMode && this.player.invincibilityTimer <= 0) {
            this.player.hp -= bullet.damage;
            this.player.hitFlashTimer = 0.08;
            this.player.invincibilityTimer = 1.0;
            soundManager.playPlayerHit();
            this.createExplosion(this.player.position.x + this.player.size.width/2, this.player.position.y, '#ef4444', 10);
            this.triggerScreenShake(0.2); // Shake on hit
            
            // Taking damage increases stress significantly
            this.player.stressLevel = Math.min(100, this.player.stressLevel + 40);
            this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 20); // panic
            
            this.combo = 0; // reset combo on hit
            if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
            
            if (this.player.hp <= 0) {
              this.createExplosion(this.player.position.x + this.player.size.width/2, this.player.position.y + this.player.size.height/2, '#38bdf8', 200, 3.5);
              this.triggerScreenShake(1);
              this.gameOver("정수기가 파괴되었습니다. (체력 소진)");
            }
          }
        } else {
          // F-08: Near miss detection for Suppression (Single Trigger)
          if (!bullet.hasTriggeredNearMiss && 
              bullet.position.y > this.player.position.y && 
              bullet.position.y < this.player.position.y + this.player.size.height) {
            const dx = Math.abs((bullet.position.x + bullet.size.width/2) - (this.player.position.x + this.player.size.width/2));
            if (dx < 80) {
               bullet.hasTriggeredNearMiss = true;
               this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 15); // Near miss increases suppression
               // Getting suppressed also stresses you out a little
               this.player.stressLevel = Math.min(100, this.player.stressLevel + 5); 
            }
          }
        }
      }
    }

    // F-01: Enemy vs Barricade (Independent loop)
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.isGnawing = false;
      
      for (const barricade of this.barricades) {
        if (!barricade.isDead && enemy.checkCollision(barricade)) {
          if (enemy.type === EnemyType.DIVER) {
            enemy.isDead = true;
            if (barricade.type === BarricadeType.DESTRUCTIBLE) {
              barricade.hp -= 20; // Crash damage
            } else {
              this.createExplosion(enemy.position.x, enemy.position.y, '#94a3b8', 20);
            }
            this.createExplosion(enemy.position.x, enemy.position.y, '#ef4444', 30);
          } else {
            enemy.isGnawing = true;
            if (barricade.type === BarricadeType.DESTRUCTIBLE) {
              barricade.hp -= 0.1; // Gnaw damage per frame
            } else {
              // Indestructible stone barricade: block vertical penetration
              enemy.position.y = Math.min(enemy.position.y, barricade.position.y - enemy.size.height);
            }
          }
        }
      }
    }
  }

  private handleEnemyKill() {
    this.combo++;
    this.comboTimer = 2.0; // 2 seconds to keep combo
    
    // Killing enemies gives adrenaline/stress
    this.player.stressLevel = Math.min(100, this.player.stressLevel + 10);
    this.player.ultimateGauge = Math.min(100, this.player.ultimateGauge + 1.5);
    
    const comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.5;
    this.score += Math.floor(100 * comboMultiplier);
    this.currency += Math.floor(5 * comboMultiplier);
    
    this.updateScoreUI();
  }

  private updateScoreUI() {
    if (this.onScoreChange) {
      this.onScoreChange(this.score, this.currency, this.combo, this.level, this.player.ultimateGauge);
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
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = '#ef4444';
    this.ctx.fillText('⚠️ BOSS: BIO-MECH TITAN ⚠️', this.logicalWidth / 2, barY - 6);
    this.ctx.shadowBlur = 0;

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

    // HP Text
    this.ctx.font = 'bold 11px monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = '#000000';
    this.ctx.fillText(`${boss.hp} / ${maxHp} HP`, this.logicalWidth / 2, barY + barH - 4);
    this.ctx.shadowBlur = 0;

    this.ctx.restore();
  }

  private draw() {
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    
    // Screen shake
    if (this.shakeTimer > 0) {
      let shakeAmount = 2;
      if (this.warningTimer > 0) {
         // Heavier shake during warning
         shakeAmount = 5;
      }
      const offsetX = (Math.random() - 0.5) * shakeAmount;
      const offsetY = (Math.random() - 0.5) * shakeAmount;
      this.ctx.translate(offsetX, offsetY);
    }

    // Clear
    this.ctx.fillStyle = '#0f172a'; // dark slate
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Draw scrolling background (Bubbles)
    const time = performance.now() / 1000;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 30; i++) {
      const x = (Math.sin(i * 13) * 1000 + time * 10) % this.logicalWidth;
      const y = this.logicalHeight - ((time * 50 * (i % 3 + 1) + i * 90) % this.logicalHeight);
      const size = (i % 4) + 1;
      this.ctx.beginPath();
      this.ctx.arc(Math.abs(x), Math.abs(y), size, 0, Math.PI * 2);
      this.ctx.fill();
    }

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
      this.ctx.fillStyle = this.pendingReinforcement === 'ENEMY' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.2)';
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
      
      this.ctx.fillStyle = this.pendingReinforcement === 'ENEMY' ? '#ef4444' : '#4ade80';
      this.ctx.font = 'bold 48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = this.ctx.fillStyle;
      
      // Flash effect
      if (Math.floor(time * 10) % 2 === 0) {
        this.ctx.fillText(this.warningMessage, this.logicalWidth / 2, this.logicalHeight / 2);
      }
      this.ctx.shadowBlur = 0;
    } else if (this.isResting) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
      
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = 'bold 48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`WAVE ${this.level} CLEARED`, this.logicalWidth / 2, this.logicalHeight / 2 - 20);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '24px sans-serif';
      this.ctx.fillText(`Next wave in ${Math.ceil(this.waveRestTimer)}...`, this.logicalWidth / 2, this.logicalHeight / 2 + 30);
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

    if (k === 'arrowleft' || k === 'a') this.player.isMovingLeft = false;
    if (k === 'arrowright' || k === 'd') this.player.isMovingRight = false;
    if (k === ' ' || k === 'spacebar' || k === 'space') {
      this.player.isShooting = false;
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

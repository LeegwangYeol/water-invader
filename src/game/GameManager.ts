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
  
  // Callbacks for React UI updates
  public onStateChange?: (state: GameState) => void;
  public onScoreChange?: (score: number, currency: number, combo: number, wave: number, ultimateGauge: number) => void;
  public onPlayerHpChange?: (hp: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.init();
  }

  public init() {
    if (!this.player) {
      this.player = new Player(this.canvas.width, this.canvas.height);
    } else {
      this.player.hp = this.player.maxHp;
      this.player.position.x = this.canvas.width / 2 - 25;
      this.player.position.y = this.canvas.height - 60;
    }
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.score = 0;
    this.combo = 0;
    this.level = 1;
    this.shakeTimer = 0;
    
    this.reinforcementTimer = 10;
    this.warningTimer = 0;
    this.warningMessage = "";
    this.pendingReinforcement = null;
    
    this.spawnBarricades();
    this.spawnWave();
    
    if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
    this.updateScoreUI();
  }
  
  private spawnBarricades() {
    this.barricades = [];
    // 4 barricades. 1st and 4th are destructible ice. 2nd and 3rd are indestructible stone.
    const padding = 150;
    const startX = (this.canvas.width - (3 * padding + 60)) / 2;
    const y = this.canvas.height - 150;
    
    this.barricades.push(new Barricade(startX, y, BarricadeType.DESTRUCTIBLE));
    this.barricades.push(new Barricade(startX + padding, y, BarricadeType.INDESTRUCTIBLE));
    this.barricades.push(new Barricade(startX + padding * 2, y, BarricadeType.INDESTRUCTIBLE));
    this.barricades.push(new Barricade(startX + padding * 3, y, BarricadeType.DESTRUCTIBLE));
  }

  public startGame() {
    soundManager.init();
    this.state = GameState.PLAYING;
    if (this.onStateChange) this.onStateChange(this.state);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stopGame() {
    cancelAnimationFrame(this.animationFrameId);
  }

  private spawnWave() {
    if (this.level % 5 === 0) {
      // Boss wave
      const boss = new Enemy(this.canvas.width / 2 - 100, 50, this.canvas.width, this.level, EnemyType.BOSS);
      this.enemies.push(boss);
      return;
    }

    const rows = 3 + Math.floor(this.level / 2);
    const cols = 6 + Math.floor(this.level / 2);
    const padding = 60;
    const offsetX = (this.canvas.width - (cols * padding)) / 2 + 20;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = (r === 1) ? EnemyType.ZIGZAG : EnemyType.NORMAL;
        this.enemies.push(new Enemy(offsetX + c * padding, 50 + r * padding, this.canvas.width, this.level, type));
      }
    }
  }

  private loop = (timestamp: number) => {
    if (this.state === GameState.MENU) return;

    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    // FPS Calculation
    this.frameCount++;
    if (timestamp - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = timestamp;
    }

    // Fixed timestep update for physics stability (optional, but using raw delta here)
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
            // Spawn rapid zigzag enemies
            for (let i = 0; i < 4; i++) {
               this.enemies.push(new Enemy(50 + i * 100, 20, this.canvas.width, this.level + 2, EnemyType.ZIGZAG));
            }
          } else if (this.pendingReinforcement === 'ALLY') {
            // Spawn friendly helpers (FIGHTER, REPAIRER, TANK)
            const count = Math.floor(Math.random() * 3) + 1; // 1 to 3
            for (let i = 0; i < count; i++) {
              const type = Math.floor(Math.random() * 3); // 0, 1, 2
              this.helpers.push(new Helper(
                 Math.random() * (this.canvas.width - 40), 
                 this.canvas.height - 80, 
                 this.canvas.width, 
                 this.canvas.height, 
                 type as HelperType
              ));
              this.createExplosion(this.canvas.width/2, this.canvas.height - 20, '#4ade80', 20);
            }
          }
          this.pendingReinforcement = null;
        }
      } else {
        this.reinforcementTimer -= deltaTime;
        if (this.reinforcementTimer <= 0) {
          this.reinforcementTimer = Math.random() * 10 + 10; // 10-20 seconds
          if (Math.random() > 0.5 && this.enemies.length > 0) {
            this.triggerScreenShake(2.0);
            this.warningTimer = 2.0;
            this.pendingReinforcement = Math.random() > 0.6 ? 'ALLY' : 'ENEMY';
            this.warningMessage = this.pendingReinforcement === 'ENEMY' ? "WARNING! ENEMY REINFORCEMENTS!" : "ALLY SUPPORT INCOMING!";
          }
        }
      }

      // Entities
      const speedMultiplier = Math.max(1.0, 1.0 + (20 - Math.min(20, this.enemies.length)) * 0.1);
      
      this.enemies.forEach(enemy => {
        enemy.update(deltaTime, speedMultiplier, this.bullets);
        const bullet = enemy.fire();
        if (bullet) this.bullets.push(bullet);
        
        // Game over if enemy reaches bottom
        if (enemy.position.y + enemy.size.height >= this.player.position.y) {
          this.gameOver("외계 오염물질이 방어선을 돌파했습니다!");
        }
      });
      
      this.helpers.forEach(helper => {
         const newBullets = helper.update(deltaTime, this.barricades);
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
      b.position.y < this.canvas.height + 50 &&
      b.position.x > -100 &&
      b.position.x < this.canvas.width + 100
    );
    this.particles = this.particles.filter(p => !p.isDead);
    this.barricades = this.barricades.filter(b => !b.isDead);
    
    // Next wave
    if (this.enemies.length === 0 && this.warningTimer <= 0) {
      if (!this.isResting) {
        this.isResting = true;
        this.waveRestTimer = 3.0;
      }
      
      this.waveRestTimer -= deltaTime;
      if (this.waveRestTimer <= 0) {
        this.level++;
        this.spawnWave();
        this.isResting = false;
      }
    }
  }
  
  private createExplosion(x: number, y: number, color: string, count: number, speedMult: number = 1.0) {
    if (count > 5) {
      soundManager.playExplosion();
    }
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color, speedMult));
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
        for (const enemy of this.enemies) {
          if (enemy.isDead) continue;
          
          if (bullet.checkCollision(enemy)) {
            bullet.piercing--;
            if (bullet.piercing <= 0) bullet.isDead = true;
            
            enemy.hp -= bullet.damage;
            
            this.createExplosion(bullet.position.x, bullet.position.y, '#3b82f6', 5); // water splash
            
            if (enemy.hp <= 0) {
              enemy.isDead = true;
              const isBoss = enemy.type === EnemyType.BOSS;
              const explosionColor = isBoss ? '#fbbf24' : '#f97316';
              const particleCount = isBoss ? 150 : 30;
              const speedMult = isBoss ? 3.0 : 1.5;
              
              this.createExplosion(enemy.position.x + enemy.size.width/2, enemy.position.y + enemy.size.height/2, explosionColor, particleCount, speedMult);
              
              if (isBoss) {
                this.triggerScreenShake(1.5);
              }
              
              this.handleEnemyKill();
            }
            break;
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

        // Enemy bullet vs Player
        if (bullet.checkCollision(this.player)) {
          bullet.isDead = true;
          if (!this.isGodMode) {
            this.player.hp -= bullet.damage;
            this.createExplosion(this.player.position.x + this.player.size.width/2, this.player.position.y, '#ef4444', 10);
            this.triggerScreenShake(0.2); // Shake on hit
            
            // Taking damage increases stress significantly
            this.player.stressLevel = Math.min(100, this.player.stressLevel + 40);
            this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 20); // panic
            
            this.combo = 0; // reset combo on hit
            if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
            
            if (this.player.hp <= 0) {
              this.createExplosion(this.player.position.x + this.player.size.width/2, this.player.position.y + this.player.size.height/2, '#38bdf8', 200, 3.5);
              this.triggerScreenShake(2.0);
              this.gameOver("정수기가 파괴되었습니다. (체력 소진)");
            }
          }
        } else {
          // Near miss detection for Suppression
          // If bullet is moving past the player vertically and is close horizontally
          if (bullet.position.y > this.player.position.y && bullet.position.y < this.player.position.y + this.player.size.height) {
            const dx = Math.abs((bullet.position.x + bullet.size.width/2) - (this.player.position.x + this.player.size.width/2));
            if (dx < 80) {
               this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 15); // Near miss increases suppression
               // Getting suppressed also stresses you out a little
               this.player.stressLevel = Math.min(100, this.player.stressLevel + 5); 
               
               // Mark bullet as processed for near miss so it doesn't trigger every frame?
               // The bullet moves fast, it will only be in this Y range for maybe 1-2 frames.
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
    this.player.ultimateGauge = Math.min(100, this.player.ultimateGauge + 5);
    
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
    
    try {
      const best = localStorage.getItem('waterInvaderHighScore');
      if (!best || this.score > parseInt(best)) {
        localStorage.setItem('waterInvaderHighScore', this.score.toString());
      }
    } catch (e) {
      // Ignore if localStorage is disabled
    }

    if (this.onStateChange) this.onStateChange(this.state);
  }

  private draw() {
    this.ctx.save();
    
    // Screen shake
    if (this.shakeTimer > 0) {
      let shakeAmount = 5;
      if (this.warningTimer > 0) {
         // Heavier shake during warning
         shakeAmount = 15;
      }
      const offsetX = (Math.random() - 0.5) * shakeAmount;
      const offsetY = (Math.random() - 0.5) * shakeAmount;
      this.ctx.translate(offsetX, offsetY);
    }

    // Clear
    this.ctx.fillStyle = '#0f172a'; // dark slate
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw scrolling background (Bubbles)
    const time = performance.now() / 1000;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 30; i++) {
      const x = (Math.sin(i * 13) * 1000 + time * 10) % this.canvas.width;
      const y = this.canvas.height - ((time * 50 * (i % 3 + 1) + i * 90) % this.canvas.height);
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

    this.ctx.restore();
    
    // UI overlays that shouldn't shake
    if (this.warningTimer > 0) {
      this.ctx.fillStyle = this.pendingReinforcement === 'ENEMY' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.2)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = this.pendingReinforcement === 'ENEMY' ? '#ef4444' : '#4ade80';
      this.ctx.font = 'bold 48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = this.ctx.fillStyle;
      
      // Flash effect
      if (Math.floor(time * 10) % 2 === 0) {
        this.ctx.fillText(this.warningMessage, this.canvas.width / 2, this.canvas.height / 2);
      }
      this.ctx.shadowBlur = 0;
    } else if (this.isResting) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = 'bold 48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`WAVE ${this.level} CLEARED`, this.canvas.width / 2, this.canvas.height / 2 - 20);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '24px sans-serif';
      this.ctx.fillText(`Next wave in ${Math.ceil(this.waveRestTimer)}...`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
  }

  // Ultimate Skill: Heavy Rain
  public triggerUltimate() {
    if (this.player.ultimateGauge >= 100) {
      this.player.ultimateGauge = 0;
      soundManager.playPowerUp(); // or a new ultimate sound
      
      this.triggerScreenShake(1.0);
      
      // Spawn massive amount of bullets from the top
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * this.canvas.width;
        const b = new Bullet(x, -20, 300, 10, true, 3); // Downward moving, piercing, high damage player bullet
        b.velocity.x = (Math.random() - 0.5) * 50;
        this.bullets.push(b);
      }
      
      this.updateScoreUI();
    }
  }

  // Input handling mapped from React
  public handleKeyDown(key: string) {
    if (key === 'ArrowLeft' || key === 'a') this.player.isMovingLeft = true;
    if (key === 'ArrowRight' || key === 'd') this.player.isMovingRight = true;
    if (key === ' ' || key === 'Spacebar') {
      this.player.isShooting = true;
    }
    if (key === 'e' || key === 'Shift') {
      this.triggerUltimate();
    }
    
    // Debug & Cheats
    if (key === 'F3') this.isDebugMode = !this.isDebugMode;
    if (key === 'F4') this.isGodMode = !this.isGodMode;
    if (key === 'F5') {
      this.currency += 1000;
      this.updateScoreUI();
    }
  }

  public handleKeyUp(key: string) {
    if (key === 'ArrowLeft' || key === 'a') this.player.isMovingLeft = false;
    if (key === 'ArrowRight' || key === 'd') this.player.isMovingRight = false;
    if (key === ' ' || key === 'Spacebar') {
      this.player.isShooting = false;
    }
  }
  
  // Upgrades
  public upgradeFireRate() {
    if (this.currency >= 50 && this.player.fireRate > 0.1) {
      this.currency -= 50;
      this.player.fireRate = Math.max(0.1, this.player.fireRate - 0.1);
      soundManager.playPowerUp();
      this.updateScoreUI();
    }
  }
  
  public upgradeMultiShot() {
    if (this.currency >= 100 && this.player.multiShot < 3) {
      this.currency -= 100;
      this.player.multiShot++;
      soundManager.playPowerUp();
      this.updateScoreUI();
    }
  }

  public upgradePiercing() {
    if (this.currency >= 200 && this.player.piercing < 5) {
      this.currency -= 200;
      this.player.piercing++;
      soundManager.playPowerUp();
      this.updateScoreUI();
    }
  }
}

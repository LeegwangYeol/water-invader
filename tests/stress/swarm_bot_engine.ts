/**
 * Water Invader Deep Survival & Combat Swarm Bot Brain Engine
 * 
 * High-performance, zero-latency autonomous game agent implementing:
 * 1. 1D Potential Field Raymarching Evasion Solver (Bullet TTI, Barricade Shadowing Occlusion, Diver Crash Avoidance)
 * 2. Continuous Offensive Engagement & High-Density / Boss Column Alignment
 * 3. Strategic Skill Automation (Ultimate " Heavy Rain\ & Ally Support Summon)
 * 4. Real-time In-Game Economy Auto-Buyer (Priority: Fire Rate -> Multi-Shot -> Piercing)
 * 5. Zero-Latency In-Page Injection Controller with Live Telemetry Tracking
 */

export interface SwarmBotOptions {
 /** Evaluation loop interval in milliseconds (default: 16ms = ~60 FPS) */
 tickIntervalMs?: number;
 /** Automatically maintain player firing (default: true) */
 autoShoot?: boolean;
 /** Automatically trigger Ultimate and Ally summon (default: true) */
 autoSkills?: boolean;
 /** Automatically spend currency on upgrades (default: true) */
 autoUpgrade?: boolean;
 /** Weight factor for danger score in potential field (default: 10.0) */
 evasionWeight?: number;
 /** Weight factor for offensive alignment toward target (default: 1.2) */
 offensiveWeight?: number;
 /** Weight factor for movement distance / inertia cost (default: 0.3) */
 inertiaWeight?: number;
 /** Weight factor for edge wall repulsion penalty (default: 15.0) */
 wallMarginWeight?: number;
 /** Candidate horizontal grid step in pixels (default: 5) */
 gridStep?: number;
 /** Dead zone in pixels to prevent movement jitter (default: 6) */
 deadZone?: number;
 /** Y threshold for enemies considered breach danger (default: 450) */
 targetYThresholdForAlly?: number;
 /** Minimum enemies on screen to authorize Ultimate usage (default: 3) */
 minEnemiesForUltimate?: number;
 /** Minimum enemies on screen to authorize Ally summon (default: 6) */
 minEnemiesForAlly?: number;
 /** Maximum multi-shot level to upgrade to (default: 5) */
 maxMultiShotLevel?: number;
 /** Callback fired after each bot decision calculation */
 onDecision?: (decision: SwarmBotDecision, telemetry: SwarmBotTelemetry) => void;
}

export const DEFAULT_BOT_OPTIONS: Required<SwarmBotOptions> = {
 tickIntervalMs: 16,
 autoShoot: true,
 autoSkills: true,
 autoUpgrade: true,
 evasionWeight: 10.0,
 offensiveWeight: 1.2,
 inertiaWeight: 0.3,
 wallMarginWeight: 15.0,
 gridStep: 5,
 deadZone: 6,
 targetYThresholdForAlly: 450,
 minEnemiesForUltimate: 3,
 minEnemiesForAlly: 6,
 maxMultiShotLevel: 5,
 onDecision: () => {}
};

export interface SwarmBotPerception {
 player: {
 x: number;
 y: number;
 width: number;
 height: number;
 hp: number;
 maxHp: number;
 speed: number;
 fireRate: number;
 multiShot: number;
 piercing: number;
 ultimateGauge: number;
 stressLevel: number;
 suppressionLevel: number;
 isMovingLeft?: boolean;
 isMovingRight?: boolean;
 isShooting?: boolean;
 };
 bullets: Array<{
 x: number;
 y: number;
 vx: number;
 vy: number;
 width: number;
 height: number;
 isPlayerBullet: boolean;
 damage: number;
 isDead?: boolean;
 }>;
 enemies: Array<{
 x: number;
 y: number;
 width: number;
 height: number;
 type: number; // 0: Normal, 1: Zigzag, 2: Boss, 3: Sniper, 4: Diver, 5: Shielded, 6: Splitter
 hp: number;
 maxHp?: number;
 speedX: number;
 speedY: number;
 isDiving?: boolean;
 isDead?: boolean;
 }>;
 barricades: Array<{
 x: number;
 y: number;
 width: number;
 height: number;
 type: number; // 0: DESTRUCTIBLE (Ice), 1: INDESTRUCTIBLE (Stone)
 hp: number;
 maxHp?: number;
 isDead?: boolean;
 }>;
 currency: number;
 level: number;
 canvasWidth: number;
 canvasHeight: number;
 gameState: number | string; // 0: MENU, 1: PLAYING, 2: GAME_OVER or 'MENU', 'PLAYING', 'GAME_OVER'
}

export interface SwarmBotDecision {
 move: 'LEFT' | 'RIGHT' | 'STAY';
 shoot: boolean;
 targetX: number;
 bestCandidateX: number;
 minDangerScore: number;
 bestCost: number;
 useUltimate: boolean;
 summonAlly: boolean;
 upgradesPurchased: {
 fireRate: number;
 multiShot: number;
 piercing: number;
 totalSpent: number;
 };
 selectedTargetEnemy?: {
 x: number;
 y: number;
 type: number;
 priority: number;
 };
}

export interface SwarmBotTelemetry {
 ticksExecuted: number;
 decisionsCount: number;
 ultimatesCast: number;
 alliesSummoned: number;
 upgradesBought: {
 fireRate: number;
 multiShot: number;
 piercing: number;
 totalSpent: number;
 };
 lastDangerScore: number;
 lastTargetX: number;
 lastMove: 'LEFT' | 'RIGHT' | 'STAY';
 averageTickDurationMs: number;
 maxTickDurationMs: number;
 startTime: number;
 runningTimeMs: number;
}

export interface SwarmBotController {
 start(): void;
 stop(): void;
 tick(): SwarmBotDecision;
 getTelemetry(): SwarmBotTelemetry;
 isRunning(): boolean;
 setOptions(newOptions: Partial<SwarmBotOptions>): void;
 resetTelemetry(): void;
}

/**
 * Perception Extractor: Normalizes live GameManager instances or plain snapshot objects
 */
export function extractBotPerception(game: any): SwarmBotPerception {
 const canvasWidth = game.logicalWidth || (game.canvas && game.canvas.width) || 600;
 const canvasHeight = game.logicalHeight || (game.canvas && game.canvas.height) || 800;

 const p = game.player || {};
 const px = p.position ? p.position.x : (p.x !== undefined ? p.x : canvasWidth / 2 - 25);
 const py = p.position ? p.position.y : (p.y !== undefined ? p.y : canvasHeight - 60);
 const pWidth = p.size ? p.size.width : (p.width !== undefined ? p.width : 50);
 const pHeight = p.size ? p.size.height : (p.height !== undefined ? p.height : 40);

 const bullets: SwarmBotPerception['bullets'] = [];
 if (Array.isArray(game.bullets)) {
 for (const b of game.bullets) {
 if (!b || b.isDead) continue;
 const bx = b.position ? b.position.x : (b.x !== undefined ? b.x : 0);
 const by = b.position ? b.position.y : (b.y !== undefined ? b.y : 0);
 const bvx = b.velocity ? b.velocity.x : (b.vx !== undefined ? b.vx : 0);
 const bvy = b.velocity ? b.velocity.y : (b.vy !== undefined ? b.vy : 0);
 const bw = b.size ? b.size.width : (b.width !== undefined ? b.width : 6);
 const bh = b.size ? b.size.height : (b.height !== undefined ? b.height : 10);
 bullets.push({
 x: bx,
 y: by,
 vx: bvx,
 vy: bvy,
 width: bw,
 height: bh,
 isPlayerBullet: !!b.isPlayerBullet,
 damage: b.damage || 1,
 isDead: !!b.isDead
 });
 }
 }

 const enemies: SwarmBotPerception['enemies'] = [];
 if (Array.isArray(game.enemies)) {
 for (const e of game.enemies) {
 if (!e || e.isDead || (e.hp !== undefined && e.hp <= 0)) continue;
 const ex = e.position ? e.position.x : (e.x !== undefined ? e.x : 0);
 const ey = e.position ? e.position.y : (e.y !== undefined ? e.y : 0);
 const ew = e.size ? e.size.width : (e.width !== undefined ? e.width : 40);
 const eh = e.size ? e.size.height : (e.height !== undefined ? e.height : 30);
 enemies.push({
 x: ex,
 y: ey,
 width: ew,
 height: eh,
 type: e.type !== undefined ? e.type : 0,
 hp: e.hp !== undefined ? e.hp : 1,
 maxHp: e.maxHp,
 speedX: e.speedX !== undefined ? e.speedX : 30,
 speedY: e.speedY !== undefined ? e.speedY : 8,
 isDiving: !!e.isDiving,
 isDead: !!e.isDead
 });
 }
 }

 const barricades: SwarmBotPerception['barricades'] = [];
 if (Array.isArray(game.barricades)) {
 for (const b of game.barricades) {
 if (!b || b.isDead) continue;
 const bx = b.position ? b.position.x : (b.x !== undefined ? b.x : 0);
 const by = b.position ? b.position.y : (b.y !== undefined ? b.y : 650);
 const bw = b.size ? b.size.width : (b.width !== undefined ? b.width : 60);
 const bh = b.size ? b.size.height : (b.height !== undefined ? b.height : 40);
 barricades.push({
 x: bx,
 y: by,
 width: bw,
 height: bh,
 type: b.type !== undefined ? b.type : 0,
 hp: b.hp !== undefined ? b.hp : 20,
 maxHp: b.maxHp,
 isDead: !!b.isDead
 });
 }
 }

 return {
 player: {
 x: px,
 y: py,
 width: pWidth,
 height: pHeight,
 hp: p.hp !== undefined ? p.hp : 3,
 maxHp: p.maxHp !== undefined ? p.maxHp : 5,
 speed: p.speed !== undefined ? p.speed : 300,
 fireRate: p.fireRate !== undefined ? p.fireRate : (p.baseFireRate !== undefined ? p.baseFireRate : 0.5),
 multiShot: p.multiShot !== undefined ? p.multiShot : 1,
 piercing: p.piercing !== undefined ? p.piercing : 1,
 ultimateGauge: p.ultimateGauge !== undefined ? p.ultimateGauge : 0,
 stressLevel: p.stressLevel !== undefined ? p.stressLevel : 0,
 suppressionLevel: p.suppressionLevel !== undefined ? p.suppressionLevel : 0,
 isMovingLeft: p.isMovingLeft,
 isMovingRight: p.isMovingRight,
 isShooting: p.isShooting
 },
 bullets,
 enemies,
 barricades,
 currency: game.currency !== undefined ? game.currency : 0,
 level: game.level !== undefined ? game.level : 1,
 canvasWidth,
 canvasHeight,
 gameState: game.state !== undefined ? game.state : 1
 };
}

/**
 * SwarmBotEngine: Pure algorithmic solver for 1D Potential Field Evasion,
 * Offensive Targeting, Skill Usage, and Economy Optimization.
 */
export class SwarmBotEngine {
 /**
 * Calculates the exact threat/danger potential score at a given horizontal candidate center X.
 */
  public static calculateCandidateDanger(
    candidateCenterX: number,
    playerY: number,
    enemyBullets: SwarmBotPerception['bullets'],
    activeEnemies: SwarmBotPerception['enemies'],
    activeBarricades: SwarmBotPerception['barricades']
  ): number {
    let dangerScore = 0;
    const twoSigmaSq = 2048; // 2 * (40 * 0.8)^2 = 2 * 32^2 = 2048
    const twoDiverSigmaSq = 4050; // 2 * 45^2 = 4050

    // 1. Enemy Projectile Threat Raymarching
    for (const bullet of enemyBullets) {
      if (!bullet) continue;
      const bulletVy = bullet.vy || 200;
      if (bulletVy <= 0) continue; // Moving away from player

      const tti = (playerY - bullet.y) / bulletVy;
      if (tti < 0 || tti > 2.0) continue; // Outside threat time window

      const bulletVx = bullet.vx || 0;
      const predictedImpactX = bullet.x + bulletVx * tti;

      const distX = Math.abs(candidateCenterX - predictedImpactX);
      if (distX >= 80) continue; // Outside 2 * dangerRadius

      // Barricade Shadowing Occlusion Check
      let shadowMultiplier = 1.0;
      for (const bar of activeBarricades) {
        if (!bar) continue;
        const barricadeY = bar.y;
        const ttiBarricade = (barricadeY - bullet.y) / bulletVy;
        if (ttiBarricade > 0 && ttiBarricade < tti) {
          const barImpactX = bullet.x + bulletVx * ttiBarricade;
          if (barImpactX >= bar.x - 5 && barImpactX <= bar.x + bar.width + 5) {
            if (bar.type === 1) {
              // INDESTRUCTIBLE Stone Barricade provides 98% occlusion (0.02x threat)
              shadowMultiplier = 0.02;
            } else if (bar.type === 0 && bar.hp > 0) {
              // DESTRUCTIBLE Ice Barricade provides 80% occlusion (0.2x threat)
              shadowMultiplier = 0.2;
            }
            break;
          }
        }
      }

      const timeUrgency = 1500 / (tti + 0.05);
      const spatialWeight = Math.exp(-(distX * distX) / twoSigmaSq);
      dangerScore += timeUrgency * spatialWeight * shadowMultiplier;
    }

    // 2. Diver Dive Interception Penalty
    for (const enemy of activeEnemies) {
      if (!enemy) continue;
      if (enemy.type === 4 || enemy.isDiving) {
        const diverCenterX = enemy.x + enemy.width / 2;
        const diverDistX = Math.abs(candidateCenterX - diverCenterX);
        if (diverDistX < 60) {
          const verticalDist = playerY - enemy.y;
          if (verticalDist > 0 && verticalDist < 500) {
            const diverDanger = 3000 * Math.exp(-(diverDistX * diverDistX) / twoDiverSigmaSq);
            dangerScore += diverDanger;
          }
        }
      }
    }

    return dangerScore;
  }

 /**
 * Evaluates the perception state and computes the optimal movement, shooting, and skill actions.
 */
 public static computeDecision(
 perception: SwarmBotPerception,
 userOptions?: SwarmBotOptions
 ): SwarmBotDecision {
 const opts: Required<SwarmBotOptions> = { ...DEFAULT_BOT_OPTIONS, ...userOptions };
 const canvasWidth = perception.canvasWidth || 600;
 const player = perception.player;
 const playerX = player.x;
 const playerY = player.y;
 const playerWidth = player.width || 50;
 const playerCenterX = playerX + playerWidth / 2;

 const enemyBullets = (perception.bullets || []).filter(b => b && !b.isPlayerBullet && !b.isDead);
 const activeEnemies = (perception.enemies || []).filter(e => e && !e.isDead && e.hp > 0);
 const activeBarricades = (perception.barricades || []).filter(b => b && !b.isDead && (b.type === 1 || b.hp > 0));

 // =========================================================================
 // 1. Offensive Alignment & Target Selection
 // =========================================================================
 let bestTargetX = canvasWidth / 2;
 let selectedTargetInfo: SwarmBotDecision['selectedTargetEnemy'] = undefined;

 if (activeEnemies.length > 0) {
 let highestPriority = -Infinity;
 let selectedEnemy = activeEnemies[0];

 for (const enemy of activeEnemies) {
 let priority = 0;
 const enemyCenterX = enemy.x + enemy.width / 2;

 // Bottom Breach Penalty (Safety threshold breached)
 if (enemy.y > 500) {
 priority += 1500 + enemy.y;
 } else if (enemy.y > opts.targetYThresholdForAlly) {
 priority += 1000 + enemy.y;
 }

 // Enemy Type Threats
 if (enemy.type === 4 || enemy.isDiving) {
 priority += 900; // Diver is critical
 }
 if (enemy.type === 2) {
 priority += 750; // Boss Titan
 }
 if (enemy.type === 3) {
 priority += 600; // Sniper
 }
 if (enemy.type === 5) {
 priority += 400; // Shielded
 }
 if (enemy.type === 6) {
 priority += 450; // Splitter
 }

 // Horizontal Proximity Weight (Prefer targets near current line of sight)
 const distFromCurrent = Math.abs(enemyCenterX - playerCenterX);
 priority -= distFromCurrent * 0.4;

 // Vertical Advance (Lower enemies are higher threat)
 priority += enemy.y * 0.8;

 if (priority > highestPriority) {
 highestPriority = priority;
 selectedEnemy = enemy;
 }
 }

 bestTargetX = selectedEnemy.x + selectedEnemy.width / 2 - playerWidth / 2;
 bestTargetX = Math.max(10, Math.min(canvasWidth - playerWidth - 10, bestTargetX));
 selectedTargetInfo = {
 x: selectedEnemy.x,
 y: selectedEnemy.y,
 type: selectedEnemy.type,
 priority: highestPriority
 };
 }

 // =========================================================================
 // 2. 1D Potential Field Raymarching Solver
 // =========================================================================
 const gridStep = Math.max(1, opts.gridStep);
 const maxCandidateX = Math.max(0, canvasWidth - playerWidth);
 let minCost = Infinity;
 let bestCandidateX = playerX;
 let minDangerAtBest = 0;

 for (let cx = 0; cx <= maxCandidateX; cx += gridStep) {
 const candidateCenterX = cx + playerWidth / 2;
 const dangerScore = SwarmBotEngine.calculateCandidateDanger(
 candidateCenterX,
 playerY,
 enemyBullets,
 activeEnemies,
 activeBarricades
 );

 // Offensive Alignment Cost
 const offensiveCost = Math.abs(cx - bestTargetX) * opts.offensiveWeight;

 // Movement Inertia / Distance Cost (Prevents unnecessary rapid oscillation)
 const moveDistanceCost = Math.abs(cx - playerX) * opts.inertiaWeight;

 // Screen Boundary Margin Penalty
 let edgePenalty = 0;
 if (cx < 30) edgePenalty += (30 - cx) * opts.wallMarginWeight;
 if (cx > maxCandidateX - 30) edgePenalty += (cx - (maxCandidateX - 30)) * opts.wallMarginWeight;

 // Aggregate Potential Field Cost
 const totalCost = dangerScore * opts.evasionWeight + offensiveCost + moveDistanceCost + edgePenalty;

 if (totalCost < minCost) {
 minCost = totalCost;
 bestCandidateX = cx;
 minDangerAtBest = dangerScore;
 }
 }

 // =========================================================================
 // 3. Movement Action Determination
 // =========================================================================
 let move: 'LEFT' | 'RIGHT' | 'STAY' = 'STAY';
 const deadZone = opts.deadZone;
 if (playerX < bestCandidateX - deadZone) {
 move = 'RIGHT';
 } else if (playerX > bestCandidateX + deadZone) {
 move = 'LEFT';
 }

 // =========================================================================
 // 4. Strategic Skill Activation Checks
 // =========================================================================
 const hasBoss = activeEnemies.some(e => e.type === 2);
 const useUltimate = player.ultimateGauge >= 100 && (activeEnemies.length >= opts.minEnemiesForUltimate || hasBoss);
 const summonAlly = perception.currency >= 50 && (
 activeEnemies.length >= opts.minEnemiesForAlly ||
 activeEnemies.some(e => e.y > opts.targetYThresholdForAlly)
 );

 return {
 move,
 shoot: opts.autoShoot,
 targetX: bestTargetX,
 bestCandidateX,
 minDangerScore: minDangerAtBest,
 bestCost: minCost,
 useUltimate,
 summonAlly,
 upgradesPurchased: {
 fireRate: 0,
 multiShot: 0,
 piercing: 0,
 totalSpent: 0
 },
 selectedTargetEnemy: selectedTargetInfo
 };
 }

 /**
 * Evaluates and executes in-game economy upgrades in strict priority:
 * Priority 1: upgradeFireRate() (50 💧)
 * Priority 2: upgradeMultiShot() (100 💧, up to maxMultiShotLevel)
 * Priority 3: upgradePiercing() (200 💧)
 */
 public static evaluateEconomy(
 game: any,
 userOptions?: SwarmBotOptions
 ): { fireRate: number; multiShot: number; piercing: number; totalSpent: number } {
 const opts: Required<SwarmBotOptions> = { ...DEFAULT_BOT_OPTIONS, ...userOptions };
 const purchases = {
 fireRate: 0,
 multiShot: 0,
 piercing: 0,
 totalSpent: 0
 };

 if (!game || !game.player) return purchases;

 let canUpgrade = true;
 let iterations = 0;
 const maxIterations = 20; // Safety guard against infinite loops

 while (canUpgrade && iterations++ < maxIterations) {
 canUpgrade = false;
 const currency = game.currency !== undefined ? game.currency : 0;
 const player = game.player;

 // Priority 1: Fire Rate Upgrade (Cost 50 💧)
 const currentFireRate = player.fireRate !== undefined ? player.fireRate : player.baseFireRate;
 if (currency >= 50 && currentFireRate > 0.1 && typeof game.upgradeFireRate === 'function') {
 const prevCurrency = game.currency;
 game.upgradeFireRate();
 if (game.currency < prevCurrency) {
 purchases.fireRate++;
 purchases.totalSpent += (prevCurrency - game.currency);
 canUpgrade = true;
 continue;
 }
 }

 // Priority 2: Multi-Shot Upgrade (Cost 100 💧, up to maxMultiShotLevel)
 const currentMultiShot = player.multiShot !== undefined ? player.multiShot : 1;
 if (currency >= 100 && currentMultiShot < opts.maxMultiShotLevel && typeof game.upgradeMultiShot === 'function') {
 const prevCurrency = game.currency;
 game.upgradeMultiShot();
 if (game.currency < prevCurrency) {
 purchases.multiShot++;
 purchases.totalSpent += (prevCurrency - game.currency);
 canUpgrade = true;
 continue;
 }
 }

 // Priority 3: Piercing Upgrade (Cost 200 💧)
 const currentPiercing = player.piercing !== undefined ? player.piercing : 1;
 if (currency >= 200 && currentPiercing < 99 && typeof game.upgradePiercing === 'function') {
 const prevCurrency = game.currency;
 game.upgradePiercing();
 if (game.currency < prevCurrency) {
 purchases.piercing++;
 purchases.totalSpent += (prevCurrency - game.currency);
 canUpgrade = true;
 continue;
 }
 }
 }

 return purchases;
 }

 /**
 * Applies the computed decision directly to the game instance.
 */
 public static applyDecision(
 game: any,
 decision: SwarmBotDecision,
 userOptions?: SwarmBotOptions
 ): void {
 const opts: Required<SwarmBotOptions> = { ...DEFAULT_BOT_OPTIONS, ...userOptions };
 if (!game || !game.player) return;

 const player = game.player;

 // Movement dispatch
 if (decision.move === 'LEFT') {
 player.isMovingLeft = true;
 player.isMovingRight = false;
 } else if (decision.move === 'RIGHT') {
 player.isMovingRight = true;
 player.isMovingLeft = false;
 } else {
 player.isMovingLeft = false;
 player.isMovingRight = false;
 }

 // Shooting dispatch
 if (opts.autoShoot) {
 player.isShooting = true;
 }

 // Skills dispatch
 if (opts.autoSkills) {
 if (decision.useUltimate && typeof game.triggerUltimate === 'function') {
 game.triggerUltimate();
 }
 if (decision.summonAlly && typeof game.triggerSummonAlly === 'function') {
 game.triggerSummonAlly();
 }
 }

 // Economy auto-purchasing
 if (opts.autoUpgrade) {
 const ecoPurchases = SwarmBotEngine.evaluateEconomy(game, opts);
 decision.upgradesPurchased = ecoPurchases;
 }
 }
}

/**
 * Zero-Latency In-Page Injection Function
 * 
 * Attaches an autonomous 60 FPS decision loop to the specified GameManager instance.
 * Returns a SwarmBotController interface for starting, stopping, ticking, and inspecting telemetry.
 */
export function injectSwarmBot(
 gameManager: any,
 options?: SwarmBotOptions
): SwarmBotController {
 let opts: Required<SwarmBotOptions> = { ...DEFAULT_BOT_OPTIONS, ...options };
 let intervalId: any = null;
 let isRunningState = false;

 const telemetry: SwarmBotTelemetry = {
 ticksExecuted: 0,
 decisionsCount: 0,
 ultimatesCast: 0,
 alliesSummoned: 0,
 upgradesBought: {
 fireRate: 0,
 multiShot: 0,
 piercing: 0,
 totalSpent: 0
 },
 lastDangerScore: 0,
 lastTargetX: 300,
 lastMove: 'STAY',
 averageTickDurationMs: 0,
 maxTickDurationMs: 0,
 startTime: 0,
 runningTimeMs: 0
 };

 function executeTick(): SwarmBotDecision {
 const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

 const perception = extractBotPerception(gameManager);
 const decision = SwarmBotEngine.computeDecision(perception, opts);

 // Track skill casts before/after apply
 const prevUltimate = perception.player.ultimateGauge;
 const prevCurrency = perception.currency;

 SwarmBotEngine.applyDecision(gameManager, decision, opts);

 // Telemetry tracking
 telemetry.ticksExecuted++;
 telemetry.decisionsCount++;
 telemetry.lastDangerScore = decision.minDangerScore;
 telemetry.lastTargetX = decision.bestCandidateX;
 telemetry.lastMove = decision.move;

 if (decision.useUltimate && (gameManager.player?.ultimateGauge === 0 || gameManager.player?.ultimateGauge < prevUltimate)) {
 telemetry.ultimatesCast++;
 }
 if (decision.summonAlly && (gameManager.currency < prevCurrency)) {
 telemetry.alliesSummoned++;
 }

 if (decision.upgradesPurchased) {
 telemetry.upgradesBought.fireRate += decision.upgradesPurchased.fireRate;
 telemetry.upgradesBought.multiShot += decision.upgradesPurchased.multiShot;
 telemetry.upgradesBought.piercing += decision.upgradesPurchased.piercing;
 telemetry.upgradesBought.totalSpent += decision.upgradesPurchased.totalSpent;
 }

 const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
 const duration = t1 - t0;
 telemetry.maxTickDurationMs = Math.max(telemetry.maxTickDurationMs, duration);
 telemetry.averageTickDurationMs = (
 (telemetry.averageTickDurationMs * (telemetry.ticksExecuted - 1) + duration) /
 telemetry.ticksExecuted
 );

 if (telemetry.startTime > 0) {
 telemetry.runningTimeMs = t1 - telemetry.startTime;
 }

 if (typeof opts.onDecision === 'function') {
 try {
 opts.onDecision(decision, telemetry);
 } catch (err) {
 console.error('[SwarmBotEngine] Error in onDecision callback:', err);
 }
 }

 return decision;
 }

 const controller: SwarmBotController = {
 start(): void {
 if (isRunningState) return;
 isRunningState = true;
 telemetry.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

 intervalId = setInterval(() => {
 if (!isRunningState) return;
 // Only run when game is actively in PLAYING state (1 or 'PLAYING')
 if (gameManager && (gameManager.state === 1 || gameManager.state === 'PLAYING')) {
 executeTick();
 }
 }, opts.tickIntervalMs);
 },

 stop(): void {
 isRunningState = false;
 if (intervalId) {
 clearInterval(intervalId);
 intervalId = null;
 }
 // Release player movement keys on stop
 if (gameManager && gameManager.player) {
 gameManager.player.isMovingLeft = false;
 gameManager.player.isMovingRight = false;
 gameManager.player.isShooting = false;
 }
 },

 tick(): SwarmBotDecision {
 return executeTick();
 },

 getTelemetry(): SwarmBotTelemetry {
 return { ...telemetry, upgradesBought: { ...telemetry.upgradesBought } };
 },

 isRunning(): boolean {
 return isRunningState;
 },

 setOptions(newOptions: Partial<SwarmBotOptions>): void {
 opts = { ...opts, ...newOptions };
 if (newOptions.tickIntervalMs && isRunningState) {
 this.stop();
 this.start();
 }
 },

 resetTelemetry(): void {
 telemetry.ticksExecuted = 0;
 telemetry.decisionsCount = 0;
 telemetry.ultimatesCast = 0;
 telemetry.alliesSummoned = 0;
 telemetry.upgradesBought = {
 fireRate: 0,
 multiShot: 0,
 piercing: 0,
 totalSpent: 0
 };
 telemetry.lastDangerScore = 0;
 telemetry.lastTargetX = 300;
 telemetry.lastMove = 'STAY';
 telemetry.averageTickDurationMs = 0;
 telemetry.maxTickDurationMs = 0;
 telemetry.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
 telemetry.runningTimeMs = 0;
 }
 };

 return controller;
}

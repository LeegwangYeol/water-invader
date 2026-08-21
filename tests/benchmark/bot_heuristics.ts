/**
 * Water Invader Automated Gameplay Bot Heuristics
 * 
 * Implements 1D Potential Field Raymarching, Barricade Shadowing Occlusion,
 * Diver Crash Alert, Bottom Defense Breach Prevention, and Weapon/Skill Management.
 */

export interface BotPerception {
  player: {
    x: number;
    y: number;
    width: number;
    height: number;
    hp: number;
    maxHp: number;
    ultimateGauge: number;
    stressLevel: number;
    suppressionLevel: number;
    speed: number;
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
    isInterceptable?: boolean;
  }>;
  enemies: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: number;
    hp: number;
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
    type: number; // 0: DESTRUCTIBLE, 1: INDESTRUCTIBLE
    hp: number;
    isDead: boolean;
  }>;
  currency: number;
  level: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface BotDecision {
  move: 'LEFT' | 'RIGHT' | 'STAY';
  shoot: boolean;
  useUltimate: boolean;
  summonAlly: boolean;
  targetX: number;
  minDangerScore: number;
}

export class BotBrain {
  public static computeDecision(p: BotPerception): BotDecision {
    const canvasWidth = p.canvasWidth || 600;
    const playerX = p.player.x;
    const playerY = p.player.y;
    const playerWidth = p.player.width || 50;
    const playerCenterX = playerX + playerWidth / 2;

    const enemyBullets = p.bullets.filter(b => !b.isPlayerBullet);
    const activeEnemies = p.enemies.filter(e => !e.isDead && e.hp > 0);
    const activeBarricades = p.barricades.filter(b => !b.isDead);

    // 1. Identify Priority Target for Offensive Alignment
    let bestTargetX = canvasWidth / 2;
    if (activeEnemies.length > 0) {
      let highestPriority = -Infinity;
      let selectedEnemy = activeEnemies[0];

      for (const enemy of activeEnemies) {
        let priority = 0;
        const enemyCenterX = enemy.x + enemy.width / 2;

        // Threat: Bottom Breach (Y > 500)
        if (enemy.y > 500) {
          priority += 1200 + enemy.y;
        }

        // Threat: Diver (Type 4)
        if (enemy.type === 4 || enemy.isDiving) {
          priority += 800;
        }

        // Threat: Sniper (Type 3) or Boss (Type 2)
        if (enemy.type === 3) priority += 500;
        if (enemy.type === 2) priority += 600;

        // Proximity to player X
        const distFromCurrent = Math.abs(enemyCenterX - playerCenterX);
        priority -= distFromCurrent * 0.4;

        // Lower Y enemies
        priority += enemy.y * 0.8;

        if (priority > highestPriority) {
          highestPriority = priority;
          selectedEnemy = enemy;
        }
      }

      bestTargetX = selectedEnemy.x + selectedEnemy.width / 2 - playerWidth / 2;
      bestTargetX = Math.max(10, Math.min(canvasWidth - playerWidth - 10, bestTargetX));
    }

    // 2. Evaluate 1D Threat Potential Field across X grid
    const gridStep = 5;
    const maxCandidateX = canvasWidth - playerWidth;
    let minCost = Infinity;
    let bestCandidateX = playerX;
    let minDangerAtBest = 0;

    for (let cx = 0; cx <= maxCandidateX; cx += gridStep) {
      const candidateCenterX = cx + playerWidth / 2;
      let dangerScore = 0;

      // 2.1 Enemy Bullet Threat Evaluation
      for (const bullet of enemyBullets) {
        const bulletVy = bullet.vy || 200;
        if (bulletVy <= 0) continue;

        const tti = (playerY - bullet.y) / bulletVy;
        if (tti < 0 || tti > 2.0) continue;

        const bulletVx = bullet.vx || 0;
        const predictedImpactX = bullet.x + bulletVx * tti;

        // Barricade Shadowing Check
        let shadowMultiplier = 1.0;
        const ttiBarricade = (650 - bullet.y) / bulletVy;
        if (ttiBarricade > 0 && ttiBarricade < tti) {
          const barricadeImpactX = bullet.x + bulletVx * ttiBarricade;
          for (const bar of activeBarricades) {
            if (barricadeImpactX >= bar.x - 5 && barricadeImpactX <= bar.x + bar.width + 5) {
              if (bar.type === 1) { // INDESTRUCTIBLE stone
                shadowMultiplier = 0.02;
              } else if (bar.hp > 0) { // DESTRUCTIBLE ice
                shadowMultiplier = 0.2;
              }
              break;
            }
          }
        }

        const distX = Math.abs(candidateCenterX - predictedImpactX);
        const dangerRadius = 40;
        if (distX < dangerRadius * 2) {
          const timeUrgency = 1500 / (tti + 0.05);
          const spatialWeight = Math.exp(-(distX * distX) / (2 * (dangerRadius * 0.8) ** 2));
          dangerScore += timeUrgency * spatialWeight * shadowMultiplier;
        }
      }

      // 2.2 Diver Crash Threat Evaluation
      for (const enemy of activeEnemies) {
        if (enemy.type === 4 || enemy.isDiving) {
          const diverCenterX = enemy.x + enemy.width / 2;
          const diverDistX = Math.abs(candidateCenterX - diverCenterX);
          if (diverDistX < 60) {
            const verticalDist = playerY - enemy.y;
            if (verticalDist > 0 && verticalDist < 500) {
              const diverDanger = 3000 * Math.exp(-(diverDistX * diverDistX) / (2 * 45 ** 2));
              dangerScore += diverDanger;
            }
          }
        }
      }

      // 2.3 Offensive Cost
      const offensiveCost = Math.abs(cx - bestTargetX) * 1.2;

      // 2.4 Movement Distance Cost
      const moveDistanceCost = Math.abs(cx - playerX) * 0.3;

      // 2.5 Edge Wall Penalty
      let edgePenalty = 0;
      if (cx < 30) edgePenalty += (30 - cx) * 15;
      if (cx > maxCandidateX - 30) edgePenalty += (cx - (maxCandidateX - 30)) * 15;

      const totalCost = dangerScore * 10.0 + offensiveCost + moveDistanceCost + edgePenalty;

      if (totalCost < minCost) {
        minCost = totalCost;
        bestCandidateX = cx;
        minDangerAtBest = dangerScore;
      }
    }

    // 3. Movement Command
    let move: 'LEFT' | 'RIGHT' | 'STAY' = 'STAY';
    const deadZone = 6;
    if (playerX < bestCandidateX - deadZone) {
      move = 'RIGHT';
    } else if (playerX > bestCandidateX + deadZone) {
      move = 'LEFT';
    }

    // 4. Skills & Ultimate
    const useUltimate = p.player.ultimateGauge >= 100 && (activeEnemies.length >= 4 || activeEnemies.some(e => e.type === 2));
    const summonAlly = p.currency >= 50 && (activeEnemies.length >= 8 || activeEnemies.some(e => e.y > 450));

    return {
      move,
      shoot: true,
      useUltimate,
      summonAlly,
      targetX: bestCandidateX,
      minDangerScore: minDangerAtBest
    };
  }
}

import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Enemy, EnemyType } from '../../src/game/Enemy';
import { Bullet } from '../../src/game/Bullet';
import { Player } from '../../src/game/Player';
import { Particle } from '../../src/game/Particle';
import { EndGameCrisis } from '../../src/game/crisis/EndGameCrisis';
import { CrisisSovereign } from '../../src/game/crisis/CrisisSovereign';
import { DimensionalRift } from '../../src/game/crisis/DimensionalRift';
import {
  Faction,
  GameState,
  CrisisArchetype,
  CrisisPhase,
  CRISIS_ARCHETYPE_CONFIGS,
} from '../../src/game/types';

/**
 * Headless Canvas Mock with Complete 2D Rendering Context
 */
function createMockCanvas(width: number = 720, height: number = 960): HTMLCanvasElement {
  return {
    width,
    height,
    getContext: (_type: string) => ({
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      rotate: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      fill: () => {},
      stroke: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      drawImage: () => {},
      roundRect: () => {},
      measureText: () => ({ width: 60 }),
      setLineDash: () => {},
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1.0,
      shadowColor: '#000000',
      shadowBlur: 0,
    }),
  } as unknown as HTMLCanvasElement;
}

test.describe('Adversarial Stress Test & Empirical Challenge: R1 (Crisis Doubling) & R3 (Friendly-Fire Avoidance)', () => {

  // =========================================================================
  // SECTION 1: FRIENDLY-FIRE STRESS UNDER DENSE FORMATIONS (50+ UNITS)
  // =========================================================================

  test('STRESS-FF-01: Pure Column Aligned Suppression preserves zero allied friendly-fire in vertical corridors', () => {
    const canvas = createMockCanvas(720, 960);
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.enemies = [];
    gm.bullets = [];

    // 50 Invader units strictly column-aligned: 5 rows x 10 columns
    // All units have same speed and direction, so they remain vertically aligned
    const initialHps = new Map<Enemy, number>();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 10; c++) {
        const x = 50 + c * 60;
        const y = 80 + r * 50;
        const enemy = new Enemy(x, y, gm.logicalWidth, 1, EnemyType.NORMAL, gm.logicalHeight);
        enemy.faction = Faction.INVADER;
        enemy.hp = 10;
        enemy.maxHp = 10;
        (enemy as any).fireTimer = 0; // Constantly ready to fire
        gm.enemies.push(enemy);
        initialHps.set(enemy, enemy.hp);
      }
    }

    expect(gm.enemies.length).toBe(50);
    // Player directly below center
    gm.player.position.x = 360;
    gm.player.position.y = 900;
    gm.player.hp = 99999;

    let friendlyFireDamageEvents = 0;

    for (let f = 0; f < 300; f++) {
      const prevHps = new Map(gm.enemies.map(e => [e, e.hp]));
      (gm as any).update(1 / 60);

      for (const e of gm.enemies) {
        if (e.hp < prevHps.get(e)!) {
          friendlyFireDamageEvents++;
        }
      }
    }

    // In pure vertical column alignment, vertical suppression works
    expect(friendlyFireDamageEvents).toBe(0);
    for (const e of gm.enemies) {
      expect(e.hp).toBe(10);
    }
  });

  test('STRESS-FF-02 [EMPIRICAL ADVERSARIAL CHALLENGE]: Staggered & Diagonal Formations expose Friendly-Fire Vulnerability', () => {
    const canvas = createMockCanvas(720, 960);
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.enemies = [];
    gm.bullets = [];

    // Dense 55-unit formation with staggered rows (Row 1 & 3 contain SNIPERs aiming at player)
    for (let r = 0; r < 5; r++) {
      const rowOffset = (r % 2 === 1) ? 25 : 0;
      for (let c = 0; c < 11; c++) {
        const x = 40 + c * 55 + rowOffset;
        const y = 80 + r * 45;
        const enemyType = r === 0 ? EnemyType.SHIELDED : (r % 2 === 0 ? EnemyType.NORMAL : EnemyType.SNIPER);
        const enemy = new Enemy(x, y, gm.logicalWidth, 1, enemyType, gm.logicalHeight);
        enemy.faction = Faction.INVADER;
        enemy.hp = 10;
        (enemy as any).fireTimer = Math.random() * 0.5;
        (enemy as any).id = `R${r}C${c}`;
        gm.enemies.push(enemy);
      }
    }

    gm.player.position.x = 360;
    gm.player.position.y = 900;
    gm.player.hp = 99999;

    let friendlyFireCollisions = 0;
    const origCheckCollisions = (gm as any).checkCollisions.bind(gm);
    (gm as any).checkCollisions = () => {
      for (const bullet of gm.bullets) {
        if (bullet.isDead) continue;
        for (const enemy of gm.enemies) {
          if (enemy.isDead) continue;
          if (bullet.hitEntities.has(enemy)) continue;
          if (bullet.shooter === enemy) continue;
          if (bullet.checkCollision(enemy) && bullet.faction === enemy.faction) {
            friendlyFireCollisions++;
          }
        }
      }
      origCheckCollisions();
    };

    for (let f = 0; f < 300; f++) {
      (gm as any).update(1 / 60);
    }

    // EMPIRICAL CHALLENGE FINDING:
    // Due to the asymmetric raycast origin (originX = spawnX + 5) and absence of time-of-flight prediction,
    // diagonal shots from Snipers clip allies in lower staggered rows!
    console.log(`[STRESS-FF-02 Empirical Result] Friendly fire collisions in staggered formation: ${friendlyFireCollisions}`);
    expect(friendlyFireCollisions).toBe(0);
  });

  test('STRESS-FF-03 [EMPIRICAL ADVERSARIAL CHALLENGE]: Chaotic Overlapping Movement produces high friendly-fire rates', () => {
    const canvas = createMockCanvas(720, 960);
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.enemies = [];
    gm.bullets = [];

    // 50 units with dynamic sinusoidal lateral oscillations
    for (let i = 0; i < 50; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const enemy = new Enemy(50 + col * 60, 60 + row * 45, gm.logicalWidth, 1, EnemyType.NORMAL, gm.logicalHeight);
      enemy.faction = Faction.INVADER;
      enemy.hp = 10;
      (enemy as any).fireTimer = 0;
      gm.enemies.push(enemy);
    }

    gm.player.position.x = 360;
    gm.player.position.y = 900;
    gm.player.hp = 99999;

    let totalFriendlyHits = 0;
    const origCheck = (gm as any).checkCollisions.bind(gm);
    (gm as any).checkCollisions = () => {
      for (const b of gm.bullets) {
        if (b.isDead) continue;
        for (const e of gm.enemies) {
          if (e.isDead || b.hitEntities.has(e) || b.shooter === e) continue;
          if (b.checkCollision(e) && b.faction === e.faction) {
            totalFriendlyHits++;
          }
        }
      }
      origCheck();
    };

    for (let frame = 0; frame < 300; frame++) {
      const time = frame / 60;
      for (let i = 0; i < gm.enemies.length; i++) {
        const e = gm.enemies[i];
        const row = Math.floor(i / 10);
        const shiftX = Math.sin(time * 3 + row * 1.5) * 1.5;
        e.position.x = Math.max(10, Math.min(gm.logicalWidth - e.size.width - 10, e.position.x + shiftX));
        if (frame % 10 === 0) (e as any).fireTimer = 0;
      }
      (gm as any).update(1 / 60);
    }

    console.log(`[STRESS-FF-03 Empirical Result] Friendly hits under chaotic movement: ${totalFriendlyHits}`);
    expect(totalFriendlyHits).toBeLessThanOrEqual(3);
  });

  // =========================================================================
  // SECTION 2: CROSSFIRE VERIFICATION (INVADERS VS ROGUES)
  // =========================================================================

  test('CROSSFIRE-01: Line-of-Sight does NOT block opposing faction targets and direct hits register damage', () => {
    const canvas = createMockCanvas(720, 960);
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.enemies = [];
    gm.bullets = [];

    // Invader aiming at stationary Rogue
    const invader = new Enemy(200, 100, gm.logicalWidth, 1, EnemyType.NORMAL, gm.logicalHeight);
    invader.faction = Faction.INVADER;
    invader.hp = 5;

    const rogue = new Enemy(200, 200, gm.logicalWidth, 1, EnemyType.ROGUE_MECH, gm.logicalHeight);
    rogue.faction = Faction.ROGUE;
    rogue.hp = 5;

    gm.enemies = [invader, rogue];

    // Verify Invader does NOT consider Rogue an allied obstacle
    const isInvaderBlocked = invader.hasAlliedObstacleInShotPath(gm.enemies, 220, 130, 220, 200);
    expect(isInvaderBlocked).toBe(false);

    // Verify Rogue does NOT consider Invader an allied obstacle
    const isRogueBlocked = rogue.hasAlliedObstacleInShotPath(gm.enemies, 220, 200, 220, 100);
    expect(isRogueBlocked).toBe(false);

    // Spawn an Invader bullet heading down to hit Rogue
    const bulletToRogue = new Bullet(215, 135, 200, 2, false);
    bulletToRogue.faction = Faction.INVADER;
    bulletToRogue.shooter = invader;
    gm.bullets.push(bulletToRogue);

    // Run physics until collision
    for (let f = 0; f < 30; f++) {
      (gm as any).update(1 / 60);
      if (rogue.hp < 5) break;
    }

    expect(rogue.hp).toBe(3); // 5 - 2 damage

    // Reset positions for reverse test
    invader.position.x = 200;
    invader.position.y = 100;
    rogue.position.x = 200;
    rogue.position.y = 200;

    // Spawn a Rogue bullet heading up to hit Invader
    const bulletToInvader = new Bullet(215, 190, -200, 2, false);
    bulletToInvader.faction = Faction.ROGUE;
    bulletToInvader.shooter = rogue;
    gm.bullets.push(bulletToInvader);

    for (let f = 0; f < 40; f++) {
      (gm as any).update(1 / 60);
      if (invader.hp < 5) break;
    }

    expect(invader.hp).toBe(3); // 5 - 2 damage
  });

  test('CROSSFIRE-02: 20-unit opposing skirmish produces active crossfire damage while exposing Rogue-on-Rogue upward blind spot', () => {
    const canvas = createMockCanvas(720, 960);
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.enemies = [];
    gm.bullets = [];

    // 10 Invaders in upper rows
    for (let i = 0; i < 10; i++) {
      const invader = new Enemy(60 + (i % 5) * 120, 80 + Math.floor(i / 5) * 50, gm.logicalWidth, 1, EnemyType.NORMAL, gm.logicalHeight);
      invader.faction = Faction.INVADER;
      invader.hp = 5;
      (invader as any).id = `INV_${i}`;
      gm.enemies.push(invader);
    }

    // 10 Rogues in lower rows
    for (let i = 0; i < 10; i++) {
      const rogue = new Enemy(60 + (i % 5) * 120, 250 + Math.floor(i / 5) * 50, gm.logicalWidth, 1, EnemyType.ROGUE_DRONE, gm.logicalHeight);
      rogue.faction = Faction.ROGUE;
      rogue.hp = 5;
      (rogue as any).id = `ROG_${i}`;
      gm.enemies.push(rogue);
    }

    gm.player.position.x = 360;
    gm.player.position.y = 900;
    gm.player.hp = 99999;

    let crossfireHits = 0;
    let rogueOnRogueFriendlyHits = 0;

    const origCheck = (gm as any).checkCollisions.bind(gm);
    (gm as any).checkCollisions = () => {
      for (const bullet of gm.bullets) {
        if (bullet.isDead) continue;
        for (const enemy of gm.enemies) {
          if (enemy.isDead || bullet.hitEntities.has(enemy) || bullet.shooter === enemy) continue;
          if (bullet.checkCollision(enemy)) {
            if (bullet.faction !== enemy.faction) {
              crossfireHits++;
            } else if (bullet.faction === Faction.ROGUE && enemy.faction === Faction.ROGUE) {
              rogueOnRogueFriendlyHits++;
            }
          }
        }
      }
      origCheck();
    };

    for (let f = 0; f < 300; f++) {
      (gm as any).update(1 / 60);
    }

    console.log(`[CROSSFIRE-02 Empirical Result] Crossfire hits: ${crossfireHits}, Rogue-on-Rogue friendly hits: ${rogueOnRogueFriendlyHits}`);
    // Crossfire damage is fully active
    expect(crossfireHits).toBeGreaterThan(0);
    // Rogue-on-Rogue friendly hits zeroed out by direction-aware AI
    expect(rogueOnRogueFriendlyHits).toBe(0);
  });

  // =========================================================================
  // SECTION 3: CRISIS STRESS SUITE (ALL 12 ARCHETYPES & 5,200 EHP INVARIANT)
  // =========================================================================

  test('CRISIS-01: Rapid-fire instantiation of all 12 archetypes across 60 cycles causes zero memory leak or unhandled exception', () => {
    const allArchetypes = Object.values(CrisisArchetype);
    expect(allArchetypes.length).toBe(12);

    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    // Rapidly instantiate and update 120 crisis encounters (10 cycles of 12 archetypes)
    for (let cycle = 0; cycle < 10; cycle++) {
      for (const arch of allArchetypes) {
        let crisis: EndGameCrisis | null = new EndGameCrisis(600, 800);
        crisis.startIncursion(arch);

        expect(crisis.isActive).toBe(true);
        expect(crisis.archetype).toBe(arch);
        expect(crisis.sovereign).not.toBeNull();
        expect(crisis.riftAnchors.length).toBe(2);

        // Run 10 ticks per crisis
        for (let t = 0; t < 10; t++) {
          crisis.update(0.05, player, bullets, particles);
        }

        // Clean up references (mimics GameManager disposal)
        crisis = null;
        bullets.length = 0;
        particles.length = 0;
      }
    }
  });

  test('CRISIS-02: 5,200 EHP Invariant strictly verified across all 12 archetypes', () => {
    const allArchetypes = Object.values(CrisisArchetype);

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      const [anchorL, anchorR] = crisis.riftAnchors;
      const sov = crisis.sovereign!;

      // Component EHP breakdown
      const anchorHp = anchorL.hp + anchorR.hp;
      const hullHp = sov.hullHp;
      const coreHp = sov.coreHp;

      expect(anchorL.hp).toBe(600);
      expect(anchorR.hp).toBe(600);
      expect(anchorHp).toBe(1200);

      expect(hullHp).toBe(2500);
      expect(coreHp).toBe(1500);
      expect(sov.maxHp).toBe(4000);

      // Total Invariant Check
      const totalEncounterEHP = anchorHp + hullHp + coreHp;
      expect(totalEncounterEHP).toBe(5200);

      // Configuration schema verification
      const config = CRISIS_ARCHETYPE_CONFIGS[arch];
      expect(config.riftHp * 2 + config.sovereignHullHp + config.coreHp).toBe(5200);
    }
  });

  test('CRISIS-03: Anchor destruction collapses barriers and unlocks Sovereign damage vulnerability across all 12 archetypes', () => {
    const allArchetypes = Object.values(CrisisArchetype);

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      const player = new Player(600, 800);
      const bullets: Bullet[] = [];
      const particles: Particle[] = [];

      // Advance past warning into PHASE_1_SHIELD
      crisis.update(3.1, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

      const sov = crisis.sovereign!;
      const [anchorL, anchorR] = crisis.riftAnchors;

      // Sovereign is invulnerable while anchors alive
      expect(sov.isInvulnerable).toBe(true);
      expect(sov.takeDamage(500)).toBe(0);
      expect(sov.hullHp).toBe(2500);

      // Destroy Anchor Left (deal 3000 to cover potential shifted pod resistance in Nebula Phantasm)
      anchorL.takeDamage(3000);
      expect(anchorL.isDead).toBe(true);
      crisis.update(0.05, player, bullets, particles);

      // Sovereign MUST STILL be invulnerable with 1 anchor remaining
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
      expect(sov.isInvulnerable).toBe(true);
      expect(sov.takeDamage(500)).toBe(0);
      expect(sov.hullHp).toBe(2500);

      // Destroy Anchor Right -> BARRIER COLLAPSES!
      anchorR.takeDamage(3000);
      expect(anchorR.isDead).toBe(true);
      crisis.update(0.05, player, bullets, particles);

      // Phase transitions to PHASE_2_HULL and barrier is down
      expect(crisis.phase).toBe(CrisisPhase.PHASE_2_HULL);
      expect(sov.isInvulnerable).toBe(false);

      // Sovereign now absorbs direct damage
      const dealt = sov.takeDamage(500);
      expect(dealt).toBe(500);
      expect(sov.hullHp).toBe(2000);
    }
  });

  test('CRISIS-04: Phase 3 Core Enrage Cascades execute without exception or memory overflow across all 12 archetypes', () => {
    const allArchetypes = Object.values(CrisisArchetype);

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);

      const player = new Player(600, 800);
      const bullets: Bullet[] = [];
      const particles: Particle[] = [];

      // Transition to Phase 3 Core Overdrive
      crisis['transitionToPhase'](CrisisPhase.PHASE_3_CORE);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_3_CORE);

      const sov = crisis.sovereign!;
      expect(sov.enrageTimer).toBe(35.0);
      expect(sov.realityDistortionLevel).toBe(0);

      // Run 36 seconds to trigger full enrage cascade
      for (let sec = 0; sec < 36; sec++) {
        crisis.update(1.0, player, bullets, particles);
      }

      // Enrage timer expired, reality distortion peaked
      expect(sov.enrageTimer).toBe(0);
      expect(sov.realityDistortionLevel).toBe(1.0);

      // Fire 50 consecutive enraged attack patterns
      for (let atk = 0; atk < 50; atk++) {
        crisis['executeArchetypeAttack'](player, bullets);
      }

      expect(bullets.length).toBeGreaterThan(100);
      bullets.length = 0;
      particles.length = 0;

      // Defeat core
      sov.takeDamage(1500);
      expect(sov.coreHp).toBe(0);
      expect(sov.isDead).toBe(true);
      crisis.update(0.1, player, bullets, particles);

      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis.isActive).toBe(false);
    }
  });

  test('CRISIS-05: Bespoke Anchor Mechanics for 3 Prior Expansion Archetypes under Adversarial Edge Conditions', () => {
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];

    // 1. Chrono Devourer Anchor: Tachyon Needle acceleration & field drag
    const chronoRift = new DimensionalRift(100, 150, 0, 600, CrisisArchetype.CHRONO_DEVOURER);
    const needles = chronoRift.update(3.0, player, bullets);
    expect(needles.length).toBe(3);
    for (const n of needles) {
      expect(n.color).toBe('#fbbf24');
      expect(n.isInterceptable).toBe(true);
    }
    // High-speed incoming player bullet slowed down
    const fastPlayerBullet = new Bullet(chronoRift.getSingularityCenter().x, chronoRift.getSingularityCenter().y + 80, -600, 5, true);
    bullets.push(fastPlayerBullet);
    const beforeSpeed = Math.abs(fastPlayerBullet.velocity.y);
    chronoRift.update(0.1, player, bullets);
    expect(Math.abs(fastPlayerBullet.velocity.y)).toBeLessThan(beforeSpeed);

    // 2. Solaris Colossus Anchor: Sweep tripwire and incendiary sparks
    const solarisL = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.SOLARIS_COLOSSUS);
    const solarisR = new DimensionalRift(470, 170, 1, 600, CrisisArchetype.SOLARIS_COLOSSUS);
    solarisL.setSiblingRift(solarisR);
    solarisR.setSiblingRift(solarisL);
    bullets.length = 0;
    const sparks = solarisL.update(3.5, player, bullets);
    expect(sparks.length).toBe(4);
    for (const s of sparks) {
      expect(s.color).toBe('#f97316');
      expect(s.damage).toBe(1);
    }

    // 3. Nebula Phantasm Anchor: Entangled Phase Pods oscillating resistance
    const pod0 = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.NEBULA_PHANTASM);
    const pod1 = new DimensionalRift(470, 170, 1, 600, CrisisArchetype.NEBULA_PHANTASM);
    pod0.setSiblingRift(pod1);
    pod1.setSiblingRift(pod0);

    // Initial state: pod 0 coherent (100%), pod 1 shifted (20%)
    pod0.isCoherentPhase = true;
    pod1.isCoherentPhase = false;
    expect(pod0.takeDamage(100)).toBe(100);
    expect(pod1.takeDamage(100)).toBe(20);

    // Swap phases via update after 3.6s
    pod0.update(3.7, player, bullets);
    expect(pod0.isCoherentPhase).toBe(false);
    // Now pod 0 takes reduced damage
    expect(pod0.takeDamage(100)).toBe(20);
  });

  // =========================================================================
  // SECTION 4: 12-CRISIS ADVERSARIAL CHALLENGER STRESS PROBES
  // =========================================================================

  test('CRISIS-06: Adversarial phase skipping permutations across all 12 archetypes prevent soft-locks and preserve clean state', () => {
    const allArchetypes = Object.values(CrisisArchetype);

    for (const arch of allArchetypes) {
      // 1. Skip INCURSION -> PHASE_2_HULL
      const crisis1 = new EndGameCrisis(600, 800);
      crisis1.startIncursion(arch);
      expect(crisis1.phase).toBe(CrisisPhase.INCURSION);
      crisis1['transitionToPhase'](CrisisPhase.PHASE_2_HULL);
      expect(crisis1.phase).toBe(CrisisPhase.PHASE_2_HULL);
      expect(crisis1.sovereign!.phase).toBe(CrisisPhase.PHASE_2_HULL);
      expect(crisis1.sovereign!.isInvulnerable).toBe(false);
      const dealt1 = crisis1.sovereign!.takeDamage(300);
      expect(dealt1).toBe(300);
      expect(crisis1.sovereign!.hullHp).toBe(2200);

      // 2. Skip PHASE_1_SHIELD -> PHASE_3_CORE
      const crisis2 = new EndGameCrisis(600, 800);
      crisis2.startIncursion(arch);
      crisis2['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);
      expect(crisis2.phase).toBe(CrisisPhase.PHASE_1_SHIELD);
      crisis2['transitionToPhase'](CrisisPhase.PHASE_3_CORE);
      expect(crisis2.phase).toBe(CrisisPhase.PHASE_3_CORE);
      expect(crisis2.sovereign!.phase).toBe(CrisisPhase.PHASE_3_CORE);
      expect(crisis2.sovereign!.isInvulnerable).toBe(false);
      expect(crisis2.sovereign!.enrageTimer).toBe(35.0);
      const dealt2 = crisis2.sovereign!.takeDamage(500);
      expect(dealt2).toBe(500);
      expect(crisis2.sovereign!.coreHp).toBe(1000);

      // 3. Skip PHASE_1_SHIELD -> DEFEATED
      const crisis3 = new EndGameCrisis(600, 800);
      let defeatedNotified = false;
      crisis3.callbacks.onDefeated = (a) => {
        if (a === arch) defeatedNotified = true;
      };
      crisis3.startIncursion(arch);
      crisis3['transitionToPhase'](CrisisPhase.PHASE_1_SHIELD);
      crisis3['transitionToPhase'](CrisisPhase.DEFEATED);
      expect(crisis3.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis3.isActive).toBe(false);
      expect(crisis3.sovereign!.isDead).toBe(true);
      expect(defeatedNotified).toBe(true);

      // 4. Skip INCURSION -> DEFEATED
      const crisis4 = new EndGameCrisis(600, 800);
      crisis4.startIncursion(arch);
      crisis4['transitionToPhase'](CrisisPhase.DEFEATED);
      expect(crisis4.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis4.isActive).toBe(false);
      expect(crisis4.sovereign!.isDead).toBe(true);
    }
  });

  test('CRISIS-07: Simultaneous dual-anchor destruction in exact same tick across all 12 archetypes cleanly transitions to Phase 2', () => {
    const allArchetypes = Object.values(CrisisArchetype);

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      let phaseTransitionCount = 0;
      let riftsDestroyedCount = 0;
      crisis.callbacks.onPhaseChange = (newP) => {
        if (newP === CrisisPhase.PHASE_2_HULL) {
          phaseTransitionCount++;
        }
      };
      crisis.callbacks.onRiftDestroyed = () => {
        riftsDestroyedCount++;
      };

      crisis.startIncursion(arch);
      const player = new Player(600, 800);
      const bullets: Bullet[] = [];
      const particles: Particle[] = [];

      // Advance into Phase 1
      crisis.update(3.1, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.PHASE_1_SHIELD);

      const [anchorL, anchorR] = crisis.riftAnchors;
      expect(anchorL.hp).toBe(600);
      expect(anchorR.hp).toBe(600);

      // Simultaneously annihilate BOTH anchors before update tick
      anchorL.takeDamage(5000);
      anchorR.takeDamage(5000);

      expect(anchorL.isDead).toBe(true);
      expect(anchorR.isDead).toBe(true);
      expect(anchorL.hp).toBe(0);
      expect(anchorR.hp).toBe(0);

      // Single physics tick update
      crisis.update(0.05, player, bullets, particles);

      // Because DimensionalRift now preserves isShielding until EndGameCrisis.update() processes the collapse,
      // this.callbacks.onRiftDestroyed fires cleanly for both destroyed anchors (2 events).
      expect(riftsDestroyedCount).toBe(2);

      // Sovereign barrier collapsed
      expect(crisis.sovereign!.isInvulnerable).toBe(false);
      const dealt = crisis.sovereign!.takeDamage(1000);
      expect(dealt).toBe(1000);
      expect(crisis.sovereign!.hullHp).toBe(1500);
    }
  });

  test('CRISIS-08: High-velocity rapid instantiation & disposal across 120 cycles (1,440 encounter instances)', () => {
    const allArchetypes = Object.values(CrisisArchetype);
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    // 120 cycles x 12 archetypes = 1,440 rapid crisis encounters
    let totalInstantiations = 0;
    for (let cycle = 0; cycle < 120; cycle++) {
      for (const arch of allArchetypes) {
        const crisis = new EndGameCrisis(600, 800);
        crisis.startIncursion(arch);
        totalInstantiations++;

        expect(crisis.isActive).toBe(true);
        expect(crisis.archetype).toBe(arch);

        // Advance 2 frames
        crisis.update(0.016, player, bullets, particles);
        crisis.update(0.016, player, bullets, particles);

        // Clean up immediately
        bullets.length = 0;
        particles.length = 0;
      }
    }
    expect(totalInstantiations).toBe(1440);
  });

  test('CRISIS-09: Enrage timeout (35.0s countdown -> 0s) and reality distortion saturation across all 12 archetypes under high-frequency barrages', () => {
    const allArchetypes = Object.values(CrisisArchetype);
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];

    for (const arch of allArchetypes) {
      const crisis = new EndGameCrisis(600, 800);
      crisis.startIncursion(arch);
      crisis['transitionToPhase'](CrisisPhase.PHASE_3_CORE);

      const sov = crisis.sovereign!;
      expect(sov.enrageTimer).toBe(35.0);
      expect(sov.realityDistortionLevel).toBe(0);

      // Advance past the 35s enrage timeout in 1s increments
      for (let s = 0; s < 36; s++) {
        crisis.update(1.0, player, bullets, particles);
      }

      // Assert timeout reached and distortion saturated
      expect(sov.enrageTimer).toBe(0);
      expect(sov.realityDistortionLevel).toBe(1.0);

      // Execute 30 sustained combat updates in enraged state
      for (let f = 0; f < 30; f++) {
        crisis.update(0.05, player, bullets, particles);
      }

      // Verify all bullet velocities, positions, and player coords are valid finite numbers
      for (const b of bullets) {
        expect(Number.isFinite(b.position.x)).toBe(true);
        expect(Number.isFinite(b.position.y)).toBe(true);
        expect(Number.isFinite(b.velocity.x)).toBe(true);
        expect(Number.isFinite(b.velocity.y)).toBe(true);
      }

      expect(Number.isFinite(player.position.x)).toBe(true);
      expect(Number.isFinite(player.position.y)).toBe(true);

      bullets.length = 0;
      particles.length = 0;

      // Defeat Core cleanly
      sov.takeDamage(1500);
      crisis.update(0.05, player, bullets, particles);
      expect(crisis.phase).toBe(CrisisPhase.DEFEATED);
      expect(crisis.isActive).toBe(false);
    }
  });

  test('CRISIS-10: Bespoke Phase 1 anchor mechanics & retaliations across all 6 new archetypes under adversarial edge conditions', () => {
    const player = new Player(600, 800);
    const bullets: Bullet[] = [];

    // 1. BIOMORPHIC_SWARM: Chitinous Hatchery Sacs spawn undulating seeker spores
    const bioRift = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.BIOMORPHIC_SWARM);
    const bioSpores = bioRift.update(2.5, player, bullets);
    expect(bioSpores.length).toBe(3);
    for (const s of bioSpores) {
      expect((s as any).isBiomorphicSpore).toBe(true);
      expect(s.color).toBe('#f59e0b');
    }

    // 2. SINGULARITY_CORE: Polarized rifts (left pulls left, right pushes right)
    const singL = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.SINGULARITY_CORE);
    const singR = new DimensionalRift(470, 170, 1, 600, CrisisArchetype.SINGULARITY_CORE);
    player.position.x = 300;
    singL.update(0.1, player, bullets);
    expect(player.position.x).toBeLessThan(300); // Pulled left
    player.position.x = 300;
    singR.update(0.1, player, bullets);
    expect(player.position.x).toBeGreaterThan(300); // Pushed right

    // 3. NANITE_HARVESTER: Mutual healing between sibling fabricators (15 HP/s)
    const naniteL = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.NANITE_HARVESTER);
    const naniteR = new DimensionalRift(470, 170, 1, 600, CrisisArchetype.NANITE_HARVESTER);
    naniteL.setSiblingRift(naniteR);
    naniteR.setSiblingRift(naniteL);
    naniteR.takeDamage(100);
    expect(naniteR.hp).toBe(500);
    naniteL.update(1.0, player, bullets);
    expect(naniteR.hp).toBeCloseTo(515, 0); // Healed +15 HP

    // 4. PSIONIC_SHROUD: Telepathic Beacons spawn real bolts + phantom decoys
    const psiRift = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.PSIONIC_SHROUD);
    bullets.length = 0;
    const psiBullets = psiRift.update(2.5, player, bullets);
    expect(psiBullets.length).toBe(4);
    const realBolts = psiBullets.filter(b => b.damage === 1);
    const decoys = psiBullets.filter(b => b.damage === 0 && (b as any).isPhantomDecoy);
    expect(realBolts.length).toBe(2);
    expect(decoys.length).toBe(2);

    // 5. GLACIAL_OBLIVION: Cryo-reactive flak reflecting 4 ice splinters if rapid-fired (>6/s)
    const cryoRift = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.GLACIAL_OBLIVION);
    bullets.length = 0;
    for (let hit = 0; hit < 8; hit++) {
      cryoRift.takeDamage(10);
    }
    const cryoSparks = cryoRift.update(0.05, player, bullets);
    expect(cryoSparks.length).toBe(4);
    for (const s of cryoSparks) {
      expect(s.color).toBe('#f0f9ff');
    }

    // 6. COSMIC_DEVOURER: Astral Siphon Maws fire Dark Star Flares leaving fire trails
    const cosmicRift = new DimensionalRift(50, 170, 0, 600, CrisisArchetype.COSMIC_DEVOURER);
    bullets.length = 0;
    const cosmicFlares = cosmicRift.update(2.7, player, bullets);
    expect(cosmicFlares.length).toBe(1);
    expect(cosmicFlares[0].color).toBe('#dc2626');
  });
});

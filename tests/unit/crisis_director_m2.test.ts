import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { soundManager } from '../../src/game/SoundManager';
import { Faction, EnemyType, CrisisType, CrisisState, GameState, HazardProjectile } from '../../src/game/types';
import { Enemy } from '../../src/game/Enemy';

// Mock Canvas for Node/Headless Unit Testing
function createMockCanvas(width: number = 600, height: number = 800): HTMLCanvasElement {
  const canvas = {
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
      fill: () => {},
      stroke: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      drawImage: () => {},
      roundRect: () => {},
      measureText: () => ({ width: 50 }),
      setLineDash: () => {},
    }),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

test.describe('Unit Tests: Milestone M2 — Emergency Waves & Crisis Events Director', () => {

  test('T2.1: CrisisType, CrisisState, and HazardProjectile contract definitions', () => {
    const validCrisisTypes: CrisisType[] = ['TITAN_HORDE', 'ACID_STORM', 'SWARM_BLITZ', 'EMP_DISRUPTION', 'TOTAL_WAR'];
    expect(validCrisisTypes).toHaveLength(5);

    const testHazard: HazardProjectile = {
      x: 100,
      y: 50,
      radius: 6,
      speedY: 250,
      speedX: 10,
      damage: 1,
      color: '#a3e635',
      isDead: false,
    };
    expect(testHazard.damage).toBe(1);
    expect(testHazard.radius).toBe(6);

    const testState: CrisisState = {
      activeCrisis: 'ACID_STORM',
      timer: 10,
      duration: 10,
      warningTimer: 2.0,
      bannerText: 'EMERGENCY CRISIS: TOXIC ACID STORM HAZARD!',
      hazardProjectiles: [testHazard],
      empSuppressionActive: false,
      empTimer: 0,
    };
    expect(testState.activeCrisis).toBe('ACID_STORM');
    expect(testState.warningTimer).toBe(2.0);
    expect(testState.hazardProjectiles).toHaveLength(1);
  });

  test('T2.2: SoundManager crisis audio methods execute without throw', () => {
    expect(() => soundManager.playCrisisAlarm()).not.toThrow();
    expect(() => soundManager.playEmpDisruptionSound()).not.toThrow();
    expect(() => soundManager.playAcidStormSound()).not.toThrow();
    expect(() => soundManager.playThirdFactionWarning()).not.toThrow();
  });

  test('T2.3: GameManager initializes CrisisDirector with idle defaults', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);

    expect(gm.crisisState.activeCrisis).toBeNull();
    expect(gm.crisisState.warningTimer).toBe(0);
    expect(gm.crisisState.timer).toBe(0);
    expect(gm.crisisState.bannerText).toBeNull();
    expect(gm.crisisState.empSuppressionActive).toBe(false);
    expect(gm.hazardProjectiles).toEqual([]);
  });

  test('T2.4: triggerCrisis("TITAN_HORDE") triggers 2s warning and spawns Boss + 4 Shielded + 4 Divers upon activation', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 10;
    gm.enemies = [];

    let crisisEventNotified: CrisisState | null = null;
    gm.onCrisisEvent = (cs) => {
      crisisEventNotified = cs;
    };

    gm.triggerCrisis('TITAN_HORDE');

    // Warning phase
    expect(gm.crisisState.activeCrisis).toBe('TITAN_HORDE');
    expect(gm.crisisState.warningTimer).toBe(2.0);
    expect(gm.crisisState.bannerText).toContain('TITAN BIO-MECH ESCORT HORDE');
    expect(crisisEventNotified).not.toBeNull();
    expect((crisisEventNotified as CrisisState | null)?.activeCrisis).toBe('TITAN_HORDE');

    // Advance 1 second - still in warning phase, no enemies spawned yet
    gm['update'](1.0);
    expect(gm.crisisState.warningTimer).toBeCloseTo(1.0, 1);
    expect(gm.enemies.length).toBe(0);

    // Advance remaining 1.1s - activates crisis effect
    gm['update'](1.1);
    expect(gm.crisisState.warningTimer).toBe(0);

    // Verify spawns: 1 Boss + 4 Shielded + 4 Divers = 9 total enemies
    expect(gm.enemies.length).toBe(9);
    const boss = gm.enemies.find(e => e.type === EnemyType.BOSS);
    const shielded = gm.enemies.filter(e => e.type === EnemyType.SHIELDED);
    const divers = gm.enemies.filter(e => e.type === EnemyType.DIVER);

    expect(boss).toBeDefined();
    expect(boss!.hp).toBeGreaterThanOrEqual(250);
    expect(boss!.faction).toBe(Faction.INVADER);
    expect(shielded).toHaveLength(4);
    expect(divers).toHaveLength(4);

    shielded.forEach(s => expect(s.faction).toBe(Faction.INVADER));
    divers.forEach(d => expect(d.faction).toBe(Faction.INVADER));
  });

  test('T2.5: triggerCrisis("ACID_STORM") generates falling toxic hazard projectiles and damages player', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 10;
    gm.enemies = [];

    gm.triggerCrisis('ACID_STORM');
    expect(gm.crisisState.activeCrisis).toBe('ACID_STORM');

    // Complete warning phase
    gm['update'](2.1);
    expect(gm.crisisState.warningTimer).toBe(0);

    // Advance several frames to generate hazard projectiles
    for (let i = 0; i < 20; i++) {
      gm['update'](1 / 60);
    }
    expect(gm.hazardProjectiles.length).toBeGreaterThan(0);
    expect(gm.hazardProjectiles[0].speedY).toBeGreaterThan(150);

    // Test hazard collision with player
    const initialHp = gm.player.hp;
    const testHazard: HazardProjectile = {
      x: gm.player.position.x + gm.player.size.width / 2,
      y: gm.player.position.y + gm.player.size.height / 2,
      radius: 8,
      speedY: 200,
      damage: 1,
      color: '#a3e635',
      isDead: false,
    };
    gm.hazardProjectiles = [testHazard];
    gm.player.invincibilityTimer = 0;

    gm['update'](1 / 60);
    expect(testHazard.isDead).toBe(true);
    expect(gm.player.hp).toBe(initialHp - 1);
  });

  test('T2.6: triggerCrisis("SWARM_BLITZ") spawns 8 coordinated pincer Divers + 3 Zigzag units', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 10;
    gm.enemies = [];

    gm.triggerCrisis('SWARM_BLITZ');
    gm['update'](2.1);

    expect(gm.enemies.length).toBe(11);
    const divers = gm.enemies.filter(e => e.type === EnemyType.DIVER);
    const zigzags = gm.enemies.filter(e => e.type === EnemyType.ZIGZAG);

    expect(divers).toHaveLength(8);
    expect(zigzags).toHaveLength(3);
  });

  test('T2.7: triggerCrisis("EMP_DISRUPTION") suppresses player weapons and spawns sniper/stalker strike squad', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 10;
    gm.enemies = [];

    gm.triggerCrisis('EMP_DISRUPTION');
    gm['update'](2.1);

    expect(gm.crisisState.empSuppressionActive).toBe(true);
    expect(gm.crisisState.empTimer).toBeGreaterThan(0);

    // Player shooting attempted during EMP is blocked
    gm.player.isShooting = true;
    gm['update'](1 / 60);
    expect(gm.player.isShooting).toBe(false);

    // Spawns 2 snipers + 2 stalkers
    expect(gm.enemies.length).toBe(4);
    expect(gm.enemies.filter(e => e.type === EnemyType.SNIPER)).toHaveLength(2);
    expect(gm.enemies.filter(e => e.type === EnemyType.ROGUE_STALKER)).toHaveLength(2);

    // Advance past EMP timer (2.5s)
    gm['update'](2.6);
    expect(gm.crisisState.empSuppressionActive).toBe(false);
    expect(gm.crisisState.empTimer).toBe(0);
  });

  test('T2.8: triggerCrisis("TOTAL_WAR") spawns 11 Invaders and 11 Rogues in multi-faction clash', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 10;
    gm.enemies = [];

    gm.triggerCrisis('TOTAL_WAR');
    gm['update'](2.1);

    expect(gm.enemies.length).toBe(22);
    const invaders = gm.enemies.filter(e => e.faction === Faction.INVADER);
    const rogues = gm.enemies.filter(e => e.faction === Faction.ROGUE);

    expect(invaders.length).toBeGreaterThanOrEqual(10);
    expect(rogues.length).toBeGreaterThanOrEqual(10);
    expect(invaders.length + rogues.length).toBe(22);
  });

  test('T2.9: Wave transition safety: Wave does NOT advance during warning phase and cleanly advances when hostiles reach 0', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.state = GameState.PLAYING;
    gm.level = 10;
    gm.enemies = [];

    // Trigger crisis
    gm.triggerCrisis('TITAN_HORDE');
    expect(gm.crisisState.warningTimer).toBe(2.0);

    // Even though enemies.length === 0 right now, wave must NOT advance to SHOP because crisis warning is active
    gm['update'](0.5);
    expect(gm.state).toBe(GameState.PLAYING);

    // Complete warning phase, spawning the 9 enemies
    gm['update'](1.6);
    expect(gm.enemies.length).toBe(9);
    expect(gm.state).toBe(GameState.PLAYING);

    // Kill all 9 enemies
    gm.enemies.forEach(e => { e.isDead = true; });

    // Update triggers clean wave transition to SHOP without soft-locking
    gm['update'](1 / 60);
    expect(gm.state).toBe(GameState.SHOP);
    expect(gm.crisisState.activeCrisis).toBeNull();
  });
});

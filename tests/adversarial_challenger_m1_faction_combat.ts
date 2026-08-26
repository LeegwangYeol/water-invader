import { Enemy, EnemyType } from '../src/game/Enemy';
import { Bullet } from '../src/game/Bullet';
import { Helper, HelperType } from '../src/game/Helper';
import { GameManager } from '../src/game/GameManager';
import { GameState, Faction } from '../src/game/types';

class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockCanvas: any = {
  width: 600,
  height: 800,
  getContext: () => ({
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    closePath: () => {},
    arc: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    translate: () => {},
    bezierCurveTo: () => {},
    roundRect: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textAlign: '',
    shadowBlur: 0,
    shadowColor: '',
  }),
};

(global as any).localStorage = new MockLocalStorage();
(global as any).window = { localStorage: (global as any).localStorage };
(global as any).performance = { now: () => Date.now() };

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log('  [PASS] ' + testName);
  } else {
    failedTests++;
    console.error('  [FAIL] ' + testName + (detail ? ' - ' + detail : ''));
  }
}

console.log('================================================================================');
console.log('CHALLENGER 2: ADVERSARIAL MULTI-FACTION TARGETING & COLLISION HARNESS (M1)');
console.log('Target Verification: Helper AI Dual Targeting, Friendly Fire Immunity,');
console.log('                     Inter-Faction Body Collision & Mutual Damage');
console.log('================================================================================\n');

// =============================================================================
// TEST SUITE 1: HELPER AI DUAL-TARGETING & INTERCEPTION
// =============================================================================
console.log('--- [SUITE 1] Helper AI Targeting & Interception Against Multi-Factions ---');

// 1.1 Helper Fighter vs Invader only
{
  const gm = new GameManager(mockCanvas);
  const fighter = new Helper(100, 700, 600, 800, HelperType.FIGHTER);
  const invader = new Enemy(400, 150, 600, 1, EnemyType.NORMAL);
  invader.faction = Faction.INVADER;
  gm.enemies = [invader];
  gm.helpers = [fighter];

  // Update fighter AI
  const bullets = fighter.update(0.1, gm.barricades, gm.enemies, gm.bullets);

  // Fighter target should track Invader center X
  const expectedTargetX = invader.position.x + invader.size.width / 2 - fighter.size.width / 2;
  assert((fighter as any).targetX === expectedTargetX, '1.1: Helper Fighter accurately targets Invader enemy X coordinate');
}

// 1.2 Helper Fighter vs Rogue only
{
  const gm = new GameManager(mockCanvas);
  const fighter = new Helper(100, 700, 600, 800, HelperType.FIGHTER);
  const rogue = new Enemy(150, 200, 600, 1, EnemyType.NORMAL);
  rogue.faction = Faction.ROGUE;
  rogue.color = '#84cc16';
  gm.enemies = [rogue];
  gm.helpers = [fighter];

  fighter.update(0.1, gm.barricades, gm.enemies, gm.bullets);

  const expectedTargetX = rogue.position.x + rogue.size.width / 2 - fighter.size.width / 2;
  assert((fighter as any).targetX === expectedTargetX, '1.2: Helper Fighter accurately targets Rogue enemy X coordinate');
}

// 1.3 Helper Fighter dynamic retargeting between Invader & Rogue based on lowest/closest Y
{
  const gm = new GameManager(mockCanvas);
  const fighter = new Helper(300, 700, 600, 800, HelperType.FIGHTER);
  const highInvader = new Enemy(100, 100, 600, 1, EnemyType.NORMAL);
  highInvader.faction = Faction.INVADER;
  const lowRogue = new Enemy(500, 300, 600, 1, EnemyType.NORMAL);
  lowRogue.faction = Faction.ROGUE;
  gm.enemies = [highInvader, lowRogue];
  gm.helpers = [fighter];

  fighter.update(0.1, gm.barricades, gm.enemies, gm.bullets);
  const rogueTargetX = lowRogue.position.x + lowRogue.size.width / 2 - fighter.size.width / 2;
  assert((fighter as any).targetX === rogueTargetX, '1.3a: Helper Fighter targets lower Rogue when Rogue (Y=300) is closer than Invader (Y=100)');

  // Now defeat the Rogue and verify dynamic re-targeting to Invader
  lowRogue.isDead = true;
  fighter.update(0.1, gm.barricades, gm.enemies, gm.bullets);
  const invaderTargetX = highInvader.position.x + highInvader.size.width / 2 - fighter.size.width / 2;
  assert((fighter as any).targetX === invaderTargetX, '1.3b: Helper Fighter dynamically switches to Invader after Rogue is eliminated');
}

// 1.4 Helper Fighter friendly exemption: does not target player allies
{
  const gm = new GameManager(mockCanvas);
  const fighter = new Helper(100, 700, 600, 800, HelperType.FIGHTER);
  const tank = new Helper(200, 700, 600, 800, HelperType.TANK);
  const repairer = new Helper(300, 700, 600, 800, HelperType.REPAIRER);
  gm.helpers = [fighter, tank, repairer];
  gm.enemies = []; // No enemies

  fighter.update(0.1, gm.barricades, gm.enemies, gm.bullets);
  const defaultCenterX = 600 / 2 - fighter.size.width / 2;
  assert((fighter as any).targetX === defaultCenterX, '1.4: Helper Fighter does not target friendly helpers, defaults to center');
}

// 1.5 Helper Tank intercepts both Invader and Rogue bullets, ignores Player bullets
{
  const gm = new GameManager(mockCanvas);
  const tank = new Helper(300, 700, 600, 800, HelperType.TANK);
  
  // Invader bullet
  const invBullet = new Bullet(150, 400, 200, 1, false);
  invBullet.faction = Faction.INVADER;
  
  // Rogue bullet (lower down, closer threat)
  const rogueBullet = new Bullet(450, 500, 200, 1, false);
  rogueBullet.faction = Faction.ROGUE;

  // Player bullet (very low, should be ignored)
  const playerBullet = new Bullet(200, 600, -300, 1, true);
  playerBullet.faction = Faction.PLAYER;

  gm.bullets = [invBullet, rogueBullet, playerBullet];
  gm.helpers = [tank];

  tank.update(0.1, gm.barricades, gm.enemies, gm.bullets);
  const expectedTankTargetX = rogueBullet.position.x - tank.size.width / 2;
  assert((tank as any).targetX === expectedTankTargetX, '1.5: Helper Tank targets closest hostile projectile (Rogue bullet) ignoring Player bullets');
}

// 1.6 Helper Tank absorption & degradation under heavy multi-faction fire
{
  const gm = new GameManager(mockCanvas);
  const tank = new Helper(300, 700, 600, 800, HelperType.TANK);
  tank.hp = 15;
  gm.helpers = [tank];

  // Fire 10 Invader bullets and 10 Rogue bullets at Tank
  for (let i = 0; i < 10; i++) {
    const b1 = new Bullet(tank.position.x + 5, tank.position.y + 5, 200, 1, false);
    b1.faction = Faction.INVADER;
    const b2 = new Bullet(tank.position.x + 10, tank.position.y + 5, 200, 1, false);
    b2.faction = Faction.ROGUE;
    gm.bullets = [b1, b2];
    gm['checkCollisions']();
  }

  assert(tank.hp <= 0, '1.6a: Helper Tank HP reduced to 0 after absorbing 20 hostile multi-faction bullets');
  assert(tank.isExpired(), '1.6b: Helper Tank isExpired() returns true when HP <= 0');
}

// 1.7 Helper Fighter bullets damage both Invaders and Rogues
{
  const gm = new GameManager(mockCanvas);
  const invader = new Enemy(100, 200, 600, 1, EnemyType.NORMAL);
  invader.faction = Faction.INVADER;
  invader.hp = 2;
  
  const rogue = new Enemy(200, 200, 600, 1, EnemyType.NORMAL);
  rogue.faction = Faction.ROGUE;
  rogue.hp = 2;

  gm.enemies = [invader, rogue];

  // Helper bullet (faction = PLAYER, damage = 2)
  const helperBullet1 = new Bullet(invader.position.x + 5, invader.position.y + 5, -500, 2, true, 1);
  helperBullet1.faction = Faction.PLAYER;
  const helperBullet2 = new Bullet(rogue.position.x + 5, rogue.position.y + 5, -500, 2, true, 1);
  helperBullet2.faction = Faction.PLAYER;

  gm.bullets = [helperBullet1, helperBullet2];
  gm['checkCollisions']();

  assert(invader.hp <= 0 && invader.isDead === true, '1.7a: Helper Player bullet damages and defeats Invader entity');
  assert(rogue.hp <= 0 && rogue.isDead === true, '1.7b: Helper Player bullet damages and defeats Rogue entity');
}

// =============================================================================
// TEST SUITE 2: SAME-FACTION FRIENDLY FIRE IMMUNITY
// =============================================================================
console.log('\n--- [SUITE 2] Same-Faction Friendly Fire Immunity ---');

// 2.1 Player Bullet vs Player Ship & Helpers
{
  const gm = new GameManager(mockCanvas);
  gm.player.hp = 3;
  const fighter = new Helper(100, 700, 600, 800, HelperType.FIGHTER);
  fighter.hp = 3;
  gm.helpers = [fighter];

  // Spawn 100 player bullets directly on player and fighter
  const swarm: Bullet[] = [];
  for (let i = 0; i < 50; i++) {
    const b1 = new Bullet(gm.player.position.x + 5, gm.player.position.y + 5, -300, 5, true, 1);
    b1.faction = Faction.PLAYER;
    const b2 = new Bullet(fighter.position.x + 5, fighter.position.y + 5, -300, 5, true, 1);
    b2.faction = Faction.PLAYER;
    swarm.push(b1, b2);
  }
  gm.bullets = swarm;

  gm['checkCollisions']();

  assert(gm.player.hp === 3, '2.1a: Player takes 0 damage from 50 overlapping same-faction Player bullets');
  assert(fighter.hp === 3, '2.1b: Friendly Helper takes 0 damage from 50 overlapping same-faction Player bullets');
  assert(swarm.every(b => !b.isDead), '2.1c: Player bullets are not consumed by colliding with friendly player or helper');
}

// 2.2 Invader Bullet vs Invader Units (Normal, Zigzag, Sniper, Shielded, Boss)
{
  const gm = new GameManager(mockCanvas);
  const invNormal = new Enemy(50, 100, 600, 1, EnemyType.NORMAL);
  invNormal.faction = Faction.INVADER;
  invNormal.hp = 3;

  const invShielded = new Enemy(150, 100, 600, 1, EnemyType.SHIELDED);
  invShielded.faction = Faction.INVADER;
  invShielded.shieldHp = 3;

  const invBoss = new Enemy(250, 100, 600, 1, EnemyType.BOSS);
  invBoss.faction = Faction.INVADER;
  invBoss.hp = 50;

  gm.enemies = [invNormal, invShielded, invBoss];

  // 100 Invader bullets
  const swarm: Bullet[] = [];
  for (let i = 0; i < 50; i++) {
    const b1 = new Bullet(invNormal.position.x + 5, invNormal.position.y + 5, 200, 10, false, 1);
    b1.faction = Faction.INVADER;
    const b2 = new Bullet(invShielded.position.x + 5, invShielded.position.y + 5, 200, 10, false, 1);
    b2.faction = Faction.INVADER;
    const b3 = new Bullet(invBoss.position.x + 5, invBoss.position.y + 5, 200, 10, false, 1);
    b3.faction = Faction.INVADER;
    swarm.push(b1, b2, b3);
  }
  gm.bullets = swarm;

  gm['checkCollisions']();

  assert(invNormal.hp === 3, '2.2a: Invader Normal HP intact after 50 overlapping Invader bullets');
  assert(invShielded.shieldHp === 3, '2.2b: Invader Shielded shield HP intact after 50 overlapping Invader bullets');
  assert(invBoss.hp === 50, '2.2c: Invader Boss HP intact after 50 overlapping Invader bullets');
  assert(swarm.every(b => !b.isDead), '2.2d: Invader bullets pass through friendly Invaders unharmed');
}

// 2.3 Rogue Bullet vs Rogue Units
{
  const gm = new GameManager(mockCanvas);
  const rogue1 = new Enemy(100, 100, 600, 1, EnemyType.NORMAL);
  rogue1.faction = Faction.ROGUE;
  rogue1.hp = 5;

  const rogue2 = new Enemy(200, 100, 600, 1, EnemyType.ZIGZAG);
  rogue2.faction = Faction.ROGUE;
  rogue2.hp = 5;

  gm.enemies = [rogue1, rogue2];

  const swarm: Bullet[] = [];
  for (let i = 0; i < 50; i++) {
    const b1 = new Bullet(rogue1.position.x + 5, rogue1.position.y + 5, 200, 10, false, 1);
    b1.faction = Faction.ROGUE;
    const b2 = new Bullet(rogue2.position.x + 5, rogue2.position.y + 5, 200, 10, false, 1);
    b2.faction = Faction.ROGUE;
    swarm.push(b1, b2);
  }
  gm.bullets = swarm;

  gm['checkCollisions']();

  assert(rogue1.hp === 5, '2.3a: Rogue unit 1 retains full 5 HP against 50 same-faction Rogue bullets');
  assert(rogue2.hp === 5, '2.3b: Rogue unit 2 retains full 5 HP against 50 same-faction Rogue bullets');
  assert(swarm.every(b => !b.isDead), '2.3c: Rogue bullets pass through friendly Rogues unharmed');
}

// 2.4 Same-faction Piercing Projectiles preserve piercing count
{
  const gm = new GameManager(mockCanvas);
  const invaderAlly = new Enemy(100, 100, 600, 1, EnemyType.NORMAL);
  invaderAlly.faction = Faction.INVADER;
  gm.enemies = [invaderAlly];

  const piercingInvaderBullet = new Bullet(invaderAlly.position.x + 5, invaderAlly.position.y + 5, 200, 1, false, 3);
  piercingInvaderBullet.faction = Faction.INVADER;
  gm.bullets = [piercingInvaderBullet];

  gm['checkCollisions']();

  assert(piercingInvaderBullet.piercing === 3, '2.4: Same-faction ally overlap does NOT consume projectile piercing charges (charges: 3/3)');
}

// =============================================================================
// TEST SUITE 3: INTER-FACTION ENEMY-VS-ENEMY PHYSICAL BODY COLLISION & DAMAGE
// =============================================================================
console.log('\n--- [SUITE 3] Inter-Faction Enemy-vs-Enemy Physical Body Collision & Mutual Damage ---');

// 3.1 Single Invader vs Single Rogue Body Collision
{
  const gm = new GameManager(mockCanvas);
  const invader = new Enemy(200, 200, 600, 1, EnemyType.NORMAL);
  invader.faction = Faction.INVADER;
  invader.hp = 5;

  const rogue = new Enemy(200, 200, 600, 1, EnemyType.NORMAL);
  rogue.faction = Faction.ROGUE;
  rogue.hp = 5;

  gm.enemies = [invader, rogue];

  gm['checkCollisions']();

  assert(invader.hp === 4, '3.1a: Invader takes exactly 1 physical collision damage from overlapping Rogue (HP: 5 -> 4)');
  assert(rogue.hp === 4, '3.1b: Rogue takes exactly 1 physical collision damage from overlapping Invader (HP: 5 -> 4)');
  assert(invader.hitFlashTimer === 0.08, '3.1c: Invader hitFlashTimer set to 0.08s upon inter-faction body collision');
  assert(rogue.hitFlashTimer === 0.08, '3.1d: Rogue hitFlashTimer set to 0.08s upon inter-faction body collision');
}

// 3.2 Mutual Simultaneous Annihilation
{
  const gm = new GameManager(mockCanvas);
  const initialScore = gm.score;
  const initialCurrency = gm.currency;
  const initialCombo = gm.combo;

  const lowHpInvader = new Enemy(150, 150, 600, 1, EnemyType.NORMAL);
  lowHpInvader.faction = Faction.INVADER;
  lowHpInvader.hp = 1;

  const lowHpRogue = new Enemy(150, 150, 600, 1, EnemyType.NORMAL);
  lowHpRogue.faction = Faction.ROGUE;
  lowHpRogue.hp = 1;

  gm.enemies = [lowHpInvader, lowHpRogue];

  gm['checkCollisions']();

  assert(lowHpInvader.isDead === true, '3.2a: Invader defeated from body collision on 1 HP');
  assert(lowHpRogue.isDead === true, '3.2b: Rogue defeated from body collision on 1 HP');
  assert(gm.score > initialScore, '3.2c: Player awarded crossfire score bonus from mutual body collision defeat');
  assert(gm.currency > initialCurrency, '3.2d: Player awarded crossfire pure water currency from mutual body collision defeat');
  assert(gm.combo === 2, '3.2e: Combo increments by 2 for the simultaneous double crossfire defeat');
}

// 3.3 High-HP Boss vs Swarm of Rogues Body Collision Resolution
{
  const gm = new GameManager(mockCanvas);
  const boss = new Enemy(200, 200, 600, 5, EnemyType.BOSS);
  boss.faction = Faction.INVADER;
  boss.hp = 50;
  boss.size = { width: 150, height: 100 };

  const rogueSwarm: Enemy[] = [];
  for (let i = 0; i < 5; i++) {
    const r = new Enemy(210 + i * 20, 210, 600, 1, EnemyType.NORMAL);
    r.faction = Faction.ROGUE;
    r.hp = 2;
    rogueSwarm.push(r);
  }

  gm.enemies = [boss, ...rogueSwarm];

  // Tick 2 frames of collision
  gm['checkCollisions'](); // Frame 1: each rogue takes 1 dmg, boss takes 5 dmg
  assert(boss.hp === 45, '3.3a: Boss takes 5 damage from 5 simultaneously colliding Rogues in Frame 1');
  assert(rogueSwarm.every(r => r.hp === 1 && !r.isDead), '3.3b: All 5 Rogues survive Frame 1 with 1 HP remaining');

  gm['checkCollisions'](); // Frame 2: each rogue takes 1 dmg (reaches 0 -> dies), boss takes 5 dmg (reaches 40)
  assert(boss.hp === 40, '3.3c: Boss takes 5 damage in Frame 2 (HP: 45 -> 40)');
  assert(rogueSwarm.every(r => r.isDead === true), '3.3d: All 5 Rogues cleanly eliminated after 2 collision frames');
}

// 3.4 Same-Faction Body Overlap Immunity
{
  const gm = new GameManager(mockCanvas);
  // 10 Invaders overlapping at same coordinate
  const invaders: Enemy[] = [];
  for (let i = 0; i < 10; i++) {
    const inv = new Enemy(100, 100, 600, 1, EnemyType.NORMAL);
    inv.faction = Faction.INVADER;
    inv.hp = 3;
    invaders.push(inv);
  }

  // 10 Rogues overlapping at same coordinate
  const rogues: Enemy[] = [];
  for (let i = 0; i < 10; i++) {
    const rog = new Enemy(400, 100, 600, 1, EnemyType.NORMAL);
    rog.faction = Faction.ROGUE;
    rog.hp = 3;
    rogues.push(rog);
  }

  gm.enemies = [...invaders, ...rogues];

  // Run 60 frames of collision checks
  for (let f = 0; f < 60; f++) {
    gm['checkCollisions']();
  }

  const allInvadersHealthy = invaders.every(inv => inv.hp === 3 && !inv.isDead);
  const allRoguesHealthy = rogues.every(rog => rog.hp === 3 && !rog.isDead);

  assert(allInvadersHealthy, '3.4a: 10 overlapping same-faction Invaders take 0 body collision damage across 60 frames');
  assert(allRoguesHealthy, '3.4b: 10 overlapping same-faction Rogues take 0 body collision damage across 60 frames');
}

// 3.5 Massive 3-Way Collision Battle (20 Invaders vs 20 Rogues in Dense Corridor)
{
  const gm = new GameManager(mockCanvas);
  const testEnemies: Enemy[] = [];

  for (let i = 0; i < 20; i++) {
    const inv = new Enemy(150 + (i % 5) * 10, 200 + Math.floor(i / 5) * 10, 600, 1, EnemyType.NORMAL);
    inv.faction = Faction.INVADER;
    inv.hp = 2;
    testEnemies.push(inv);

    const rog = new Enemy(150 + (i % 5) * 10, 200 + Math.floor(i / 5) * 10, 600, 1, EnemyType.NORMAL);
    rog.faction = Faction.ROGUE;
    rog.hp = 2;
    testEnemies.push(rog);
  }

  gm.enemies = testEnemies;

  let noExceptions = true;
  try {
    for (let f = 0; f < 30; f++) {
      gm['checkCollisions']();
      // Filter dead entities as gm.update() would
      gm.enemies = gm.enemies.filter(e => !e.isDead);
    }
  } catch (err) {
    noExceptions = false;
    console.error(err);
  }

  assert(noExceptions, '3.5a: Massive 40-entity inter-faction collision storm executes stably with zero exceptions');
  assert(gm.enemies.length === 0, '3.5b: All 40 mutually conflicting entities resolve collisions and are cleanly eliminated');
  assert(gm.score > 0, '3.5c: Crossfire scoring accrued massive rewards during 40-unit chaotic battle');
}

console.log('\n================================================================================');
console.log('CHALLENGER 2 MULTI-FACTION SUMMARY: Total: ' + totalTests + ' | Passed: ' + passedTests + ' | Failed: ' + failedTests);
console.log('================================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

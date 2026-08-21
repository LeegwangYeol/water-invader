import { Enemy, EnemyType } from '../src/game/Enemy';
import { Bullet } from '../src/game/Bullet';
import { GameManager } from '../src/game/GameManager';
import { GameState } from '../src/game/types';

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

console.log('================================================================');
console.log('ADVERSARIAL EMPIRICAL STRESS TEST SUITE: WATER INVADER M1');
console.log('================================================================\n');

// -------------------------------------------------------------
// F-06: SHIELD ABSORPTION & 5S COOLDOWN
// -------------------------------------------------------------
console.log('--- [F-06] Stress Testing: Shield Absorption & Cooldown ---');

// 1.1 Multi-hit absorption
{
  const gm = new GameManager(mockCanvas);
  const shielded = new Enemy(100, 100, 600, 1, EnemyType.SHIELDED);
  gm.enemies = [shielded];
  const initialBodyHp = shielded.hp;

  // Hit 1 (damage: 1)
  const b1 = new Bullet(100, 100, -400, 1, true, 1);
  gm.bullets = [b1];
  gm['checkCollisions']();
  assert(shielded.shieldHp === 2 && shielded.hp === initialBodyHp, 'F-06.1: Hit 1 reduces shieldHp from 3 to 2, body HP intact');

  // Hit 2 (damage: 1)
  const b2 = new Bullet(100, 100, -400, 1, true, 1);
  gm.bullets = [b2];
  gm['checkCollisions']();
  assert(shielded.shieldHp === 1 && shielded.hp === initialBodyHp, 'F-06.2: Hit 2 reduces shieldHp from 2 to 1, body HP intact');

  // Hit 3 (damage: 1) -> Breaks shield
  const b3 = new Bullet(100, 100, -400, 1, true, 1);
  gm.bullets = [b3];
  gm['checkCollisions']();
  assert(shielded.shieldHp === 0 && shielded.shieldRegenTimer === 5.0 && shielded.hp === initialBodyHp, 'F-06.3: Hit 3 breaks shield (shieldHp=0), activates 5.0s regenTimer, body HP intact');

  // Hit 4 while shield is down -> damages body HP
  const b4 = new Bullet(100, 100, -400, 1, true, 1);
  gm.bullets = [b4];
  gm['checkCollisions']();
  assert(shielded.hp === initialBodyHp - 1, 'F-06.4: Hit 4 while shield is down directly damages body HP');
}

// 1.2 Overkill single hit absorption
{
  const gm = new GameManager(mockCanvas);
  const shielded = new Enemy(100, 100, 600, 1, EnemyType.SHIELDED);
  gm.enemies = [shielded];
  const initialBodyHp = shielded.hp;

  // Massive 10-damage bullet against 3 HP shield
  const bHuge = new Bullet(100, 100, -400, 10, true, 1);
  gm.bullets = [bHuge];
  gm['checkCollisions']();

  assert(shielded.shieldHp === 0, 'F-06.5: Massive bullet zeroes out shieldHp without underflowing below 0');
  assert(shielded.shieldRegenTimer === 5.0, 'F-06.6: Overkill damage triggers 5.0s cooldown timer');
  assert(shielded.hp === initialBodyHp, 'F-06.7: Single massive bullet damage absorbed by shield; body HP unaffected');
  assert(bHuge.isDead === true, 'F-06.8: Bullet is destroyed upon impact');
}

// 1.3 Cooldown progression & regeneration
{
  const shielded = new Enemy(100, 100, 600, 1, EnemyType.SHIELDED);
  shielded.shieldHp = 0;
  shielded.shieldRegenTimer = 5.0;

  // Tick 25 times with 0.1s (2.5s elapsed)
  for (let i = 0; i < 25; i++) {
    shielded.update(0.1, 1.0, []);
  }
  assert(shielded.shieldHp === 0 && Math.abs(shielded.shieldRegenTimer - 2.5) < 0.001, 'F-06.9: At t=2.5s, shield remains 0 and timer is 2.5s');

  // Tick 24 times with 0.1s (4.9s elapsed)
  for (let i = 0; i < 24; i++) {
    shielded.update(0.1, 1.0, []);
  }
  assert(shielded.shieldHp === 0 && Math.abs(shielded.shieldRegenTimer - 0.1) < 0.001, 'F-06.10: At t=4.9s, shield is still unregenerated');

  // Tick 0.15s (total 5.05s > 5.0s) -> Regenerate!
  shielded.update(0.15, 1.0, []);
  assert(shielded.shieldHp === 3 && shielded.shieldRegenTimer === 0, 'F-06.11: After 5.0s elapsed cooldown, shield successfully regenerates to 3 HP');
}

// 1.4 Non-shielded enemy immunity to shield regen
{
  const normalEnemy = new Enemy(100, 100, 600, 1, EnemyType.NORMAL);
  normalEnemy.update(5.0, 1.0, []);
  assert(normalEnemy.shieldHp === 0, 'F-06.12: Normal enemy does not gain shieldHp after update');

  const boss = new Enemy(100, 100, 600, 1, EnemyType.BOSS);
  boss.update(5.0, 1.0, []);
  assert(boss.shieldHp === 0, 'F-06.13: Boss enemy does not gain shieldHp after update');
}

// -------------------------------------------------------------
// F-07: SNIPER INTERCEPTABLE BULLETS
// -------------------------------------------------------------
console.log('\n--- [F-07] Stress Testing: Sniper Interceptable Bullets ---');

// 2.1 Sniper bullet creation & interceptable flag
{
  const sniper = new Enemy(200, 100, 600, 1, EnemyType.SNIPER);
  sniper['fireTimer'] = 0;
  const bullet = sniper.fire({ x: 200, y: 700 });
  assert(bullet !== null && bullet.isInterceptable === true, 'F-07.1: Sniper fired bullet has isInterceptable = true');
  assert(bullet?.velocity.y !== 0, 'F-07.2: Sniper bullet has angled targeted velocity');
}

// 2.2 Direct collision between Player Bullet and Sniper Bullet
{
  const gm = new GameManager(mockCanvas);
  const sniperBullet = new Bullet(300, 400, 400, 1, false);
  sniperBullet.isInterceptable = true;

  const playerBullet = new Bullet(300, 400, -400, 1, true, 1);
  gm.bullets = [sniperBullet, playerBullet];

  gm['checkCollisions']();

  assert(sniperBullet.isDead === true, 'F-07.3: Interceptable sniper bullet is marked isDead=true upon collision');
  assert(playerBullet.isDead === true, 'F-07.4: Intercepting player bullet is marked isDead=true upon collision');
  assert(gm.particles.length === 8, 'F-07.5: Interception generates 8 purple spark explosion particles');
}

// 2.3 Player bullet does NOT intercept normal enemy bullets
{
  const gm = new GameManager(mockCanvas);
  const normalEnemyBullet = new Bullet(300, 400, 200, 1, false);
  normalEnemyBullet.isInterceptable = false;

  const playerBullet = new Bullet(300, 400, -400, 1, true, 1);
  gm.bullets = [normalEnemyBullet, playerBullet];

  gm['checkCollisions']();

  assert(normalEnemyBullet.isDead === false, 'F-07.6: Non-interceptable normal enemy bullet survives player bullet collision');
}

// 2.4 Multi-bullet interception swarm
{
  const gm = new GameManager(mockCanvas);
  const sniperBullets: Bullet[] = [];
  const playerBullets: Bullet[] = [];

  for (let i = 0; i < 5; i++) {
    const sb = new Bullet(100 + i * 50, 400, 400, 1, false);
    sb.isInterceptable = true;
    const pb = new Bullet(100 + i * 50, 400, -400, 1, true, 1);
    sniperBullets.push(sb);
    playerBullets.push(pb);
  }

  gm.bullets = [...sniperBullets, ...playerBullets];
  gm['checkCollisions']();

  const allSniperDead = sniperBullets.every(b => b.isDead);
  const allPlayerDead = playerBullets.every(b => b.isDead);

  assert(allSniperDead && allPlayerDead, 'F-07.7: All 5 sniper bullets in swarm simultaneously intercepted and destroyed');

  // Run update cleanup
  gm['update'](0.016);
  assert(gm.bullets.length === 0, 'F-07.8: Dead intercepted bullets are cleanly pruned by update cycle');
}

// -------------------------------------------------------------
// F-08: NEAR-MISS SINGLE TRIGGER
// -------------------------------------------------------------
console.log('\n--- [F-08] Stress Testing: Near-Miss Single Trigger ---');

// 3.1 50-frame near-miss passage test (outside hit box, within dx 80)
{
  const gm = new GameManager(mockCanvas);
  gm.player.suppressionLevel = 0;
  gm.player.stressLevel = 0;
  gm.player.position.x = 200;
  gm.player.position.y = 700;
  gm.player.size = { width: 50, height: 40 };

  // Player X is [200, 250], center is 225. Player Y is [700, 740].
  // Bullet at X = 265 (outside [200, 250]), width=10, center=270. dx = 270 - 225 = 45 < 80.
  // Bullet Y = 715 (inside [700, 740]).
  const nearBullet = new Bullet(265, 715, 100, 1, false);
  gm.bullets = [nearBullet];

  let suppressionIncrements = 0;
  let stressIncrements = 0;

  for (let frame = 0; frame < 50; frame++) {
    const prevSupp = gm.player.suppressionLevel;
    const prevStress = gm.player.stressLevel;

    gm['checkCollisions']();

    if (gm.player.suppressionLevel > prevSupp) suppressionIncrements++;
    if (gm.player.stressLevel > prevStress) stressIncrements++;
  }

  assert(suppressionIncrements === 1, 'F-08.1: Suppression triggered exactly 1 time across 50 frames (got ' + suppressionIncrements + ')');
  assert(stressIncrements === 1, 'F-08.2: Stress triggered exactly 1 time across 50 frames (got ' + stressIncrements + ')');
  assert(gm.player.suppressionLevel === 15, 'F-08.3: Final suppressionLevel is exactly 15 (got ' + gm.player.suppressionLevel + ')');
  assert(gm.player.stressLevel === 5, 'F-08.4: Final stressLevel is exactly 5 (got ' + gm.player.stressLevel + ')');
  assert(nearBullet.hasTriggeredNearMiss === true, 'F-08.5: bullet.hasTriggeredNearMiss is permanently true');
}

// 3.2 Direct hit does NOT trigger near-miss suppression
{
  const gm = new GameManager(mockCanvas);
  gm.player.hp = 5;
  gm.player.suppressionLevel = 0;
  gm.player.position.x = 200;
  gm.player.position.y = 700;

  // Bullet directly hits player
  const hitBullet = new Bullet(210, 710, 200, 1, false);
  gm.bullets = [hitBullet];

  gm['checkCollisions']();

  assert(gm.player.hp === 4, 'F-08.6: Direct hit damages player HP');
  assert(hitBullet.isDead === true, 'F-08.7: Direct hit marks bullet dead');
  assert(hitBullet.hasTriggeredNearMiss === false, 'F-08.8: Direct hit does not flag hasTriggeredNearMiss');
}

// 3.3 Outside boundary (dx >= 80)
{
  const gm = new GameManager(mockCanvas);
  gm.player.suppressionLevel = 0;
  gm.player.position.x = 200;
  gm.player.position.y = 700;

  // Bullet center is 200 + 25 = 225 vs bullet pos 310 (center 315). dx = 315 - 225 = 90 >= 80
  const farBullet = new Bullet(310, 710, 200, 1, false);
  gm.bullets = [farBullet];

  gm['checkCollisions']();

  assert(gm.player.suppressionLevel === 0, 'F-08.9: Bullet outside dx 80 radius does not trigger near-miss suppression');
  assert(farBullet.hasTriggeredNearMiss === false, 'F-08.10: farBullet.hasTriggeredNearMiss remains false');
}

// 3.4 Multi-bullet sequential near-misses
{
  const gm = new GameManager(mockCanvas);
  gm.player.suppressionLevel = 0;
  gm.player.stressLevel = 0;
  gm.player.position.x = 200;
  gm.player.position.y = 700;

  // 3 distinct bullets outside player box [200, 250], but dx < 80
  const b1 = new Bullet(260, 710, 200, 1, false); // dx ~ 40
  const b2 = new Bullet(150, 720, 200, 1, false); // dx ~ 70
  const b3 = new Bullet(270, 715, 200, 1, false); // dx ~ 50

  gm.bullets = [b1, b2, b3];

  // Tick 10 frames
  for (let i = 0; i < 10; i++) {
    gm['checkCollisions']();
  }

  assert(gm.player.suppressionLevel === 45, 'F-08.11: 3 distinct passing bullets trigger exactly 15 * 3 = 45 suppression (got ' + gm.player.suppressionLevel + ')');
  assert(gm.player.stressLevel === 15, 'F-08.12: 3 distinct passing bullets trigger exactly 5 * 3 = 15 stress (got ' + gm.player.stressLevel + ')');
}

// -------------------------------------------------------------
// F-15: LOCALSTORAGE NAN RECOVERY & STABILITY
// -------------------------------------------------------------
console.log('\n--- [F-15] Stress Testing: LocalStorage NaN Recovery ---');

// 4.1 'NaN' string corruption recovery
{
  const gm = new GameManager(mockCanvas);
  localStorage.setItem('waterInvaderHighScore', 'NaN');
  gm.score = 350;
  gm['gameOver']('Defeat');

  const saved = localStorage.getItem('waterInvaderHighScore');
  assert(saved === '350', 'F-15.1: Corrupted NaN string successfully recovered and updated to 350 (got ' + saved + ')');
}

// 4.2 'undefined' and garbage string corruption recovery
{
  const gm = new GameManager(mockCanvas);
  localStorage.setItem('waterInvaderHighScore', 'undefined');
  gm.score = 420;
  gm['gameOver']('Defeat');
  assert(localStorage.getItem('waterInvaderHighScore') === '420', 'F-15.2: Corrupted undefined string recovered to 420');

  localStorage.setItem('waterInvaderHighScore', 'corrupted_garbage_text_$$$');
  gm.score = 600;
  gm['gameOver']('Defeat');
  assert(localStorage.getItem('waterInvaderHighScore') === '600', 'F-15.3: Corrupted garbage text recovered to 600');
}

// 4.3 Negative number corruption recovery
{
  const gm = new GameManager(mockCanvas);
  localStorage.setItem('waterInvaderHighScore', '-9999');
  gm.score = 50;
  gm['gameOver']('Defeat');
  assert(localStorage.getItem('waterInvaderHighScore') === '50', 'F-15.4: Negative high score gracefully recovered to 50');
}

// 4.4 Legitimate higher score retention
{
  const gm = new GameManager(mockCanvas);
  localStorage.setItem('waterInvaderHighScore', '2000');
  gm.score = 800; // Lower score
  gm['gameOver']('Defeat');
  assert(localStorage.getItem('waterInvaderHighScore') === '2000', 'F-15.5: Lower score does NOT overwrite existing valid high score');

  gm.score = 2500; // Higher score
  gm['gameOver']('Victory');
  assert(localStorage.getItem('waterInvaderHighScore') === '2500', 'F-15.6: Higher score updates high score to 2500');
}

// 4.5 LocalStorage throwing exception (Disabled / QuotaExceeded)
{
  const gm = new GameManager(mockCanvas);
  const brokenStorage = {
    getItem: () => { throw new Error('SecurityError: localStorage blocked'); },
    setItem: () => { throw new Error('QuotaExceededError'); },
  };
  (global as any).localStorage = brokenStorage;

  let didCrash = false;
  try {
    gm.score = 999;
    gm['gameOver']('Test Blocked Storage');
  } catch (err) {
    didCrash = true;
  }
  assert(didCrash === false, 'F-15.7: Exception thrown by localStorage is safely caught without game crashing');
  assert(gm.state === GameState.GAME_OVER, 'F-15.8: Game transitions to GAME_OVER state smoothly even with broken localStorage');
}

console.log('\n================================================================');
console.log('STRESS TEST RESULTS: Total: ' + totalTests + ' | Passed: ' + passedTests + ' | Failed: ' + failedTests);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

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
console.log('CHALLENGER 2: ADVERSARIAL EMPIRICAL STRESS TEST HARNESS (M1)');
console.log('Target Features: F-04 (i-Frames), F-06 (Shield Gate & Regen),');
console.log('                 F-07 (Sniper Interception), F-08 (Near-Miss)');
console.log('================================================================\n');

// -------------------------------------------------------------
// STRESS TEST 1 (F-04): 50 OVERLAPPING ENEMY BULLETS HIT SIMULTANEOUSLY
// -------------------------------------------------------------
console.log('--- [F-04] Stress Test: 50 Overlapping Enemy Bullets vs i-Frames ---');
{
  const gm = new GameManager(mockCanvas);
  gm.isGodMode = false;
  gm.player.hp = 5;
  gm.player.invincibilityTimer = 0;

  const playerX = gm.player.position.x;
  const playerY = gm.player.position.y;

  // Create 50 overlapping enemy bullets right on the player
  const bulletCount = 50;
  const swarm: Bullet[] = [];
  for (let i = 0; i < bulletCount; i++) {
    swarm.push(new Bullet(playerX + (i % 5) * 2, playerY + (i % 3) * 2, 200, 1, false));
  }
  gm.bullets = swarm;

  // Execute single frame collision check
  gm['checkCollisions']();

  assert(gm.player.hp === 4, 'F-04.1: Player loses exactly 1 HP despite 50 overlapping bullet hits (HP: 5 -> ' + gm.player.hp + ')');
  assert(gm.player.invincibilityTimer === 1.0, 'F-04.2: Player invincibilityTimer set to exactly 1.0s');
  
  const allBulletsConsumed = swarm.every(b => b.isDead === true);
  assert(allBulletsConsumed, 'F-04.3: All 50 enemy bullets are consumed/destroyed upon hitting player (no phantom bullets remaining)');

  // Advance 200 frames of physics while still in i-frames (first 0.5s = ~30 frames)
  for (let f = 0; f < 30; f++) {
    gm.player.update(0.016);
    // Throw 5 more bullets at player in each frame
    const midBullets = [
      new Bullet(playerX, playerY, 200, 1, false),
      new Bullet(playerX, playerY, 200, 1, false),
    ];
    gm.bullets = midBullets;
    gm['checkCollisions']();
  }

  assert(gm.player.hp === 4, 'F-04.4: Player remains at 4 HP while invincibilityTimer > 0 (timer at ~0.52s: ' + gm.player.invincibilityTimer.toFixed(2) + 's)');

  // Advance time past 1.0s (total dt = 0.6s -> timer reaches 0)
  gm.player.update(0.6);
  assert(gm.player.invincibilityTimer === 0, 'F-04.5: invincibilityTimer smoothly expires to 0.0s');

  // Next bullet hit after i-frame expiration deals damage
  const postIframeBullet = new Bullet(playerX, playerY, 200, 1, false);
  gm.bullets = [postIframeBullet];
  gm['checkCollisions']();
  assert(gm.player.hp === 3, 'F-04.6: New bullet hit after i-frame expiry deals 1 damage (HP: 4 -> ' + gm.player.hp + ')');
  assert(gm.player.invincibilityTimer === 1.0, 'F-04.7: i-frames refresh to 1.0s on subsequent hit');
}

// -------------------------------------------------------------
// STRESS TEST 2 (F-06): MASSIVE OVERKILL BULLET (50 & 100 DMG) VS SHIELD GATE & 5.0S REGEN
// -------------------------------------------------------------
console.log('\n--- [F-06] Stress Test: Massive Overkill (50 & 100 DMG) vs Shield Gate & 5.0s Regen ---');
{
  const gm = new GameManager(mockCanvas);
  const shieldedEnemy = new Enemy(100, 100, 600, 1, EnemyType.SHIELDED);
  gm.enemies = [shieldedEnemy];
  const initialBodyHp = shieldedEnemy.hp;

  assert(shieldedEnemy.shieldHp === 3, 'F-06.1: Shielded enemy starts with 3 shield HP');

  // 1. Massive 50 damage bullet vs 3 shield HP
  const overkillBullet50 = new Bullet(100, 100, -400, 50, true, 1);
  gm.bullets = [overkillBullet50];
  gm['checkCollisions']();

  assert(shieldedEnemy.shieldHp === 0, 'F-06.2: 50-damage bullet reduces shieldHp to exactly 0 (no negative underflow)');
  assert(shieldedEnemy.shieldRegenTimer === 5.0, 'F-06.3: Shield break triggers 5.0s recharge timer');
  assert(shieldedEnemy.hp === initialBodyHp, 'F-06.4: Shield acts as absolute damage gate; body HP remains 100% intact (' + shieldedEnemy.hp + '/' + initialBodyHp + ')');
  assert(overkillBullet50.isDead === true, 'F-06.5: Overkill bullet is destroyed on impact');

  // 2. Continuous time stepping across 51 discrete update cycles (5.1s total)
  for (let step = 1; step <= 51; step++) {
    shieldedEnemy.update(0.1, 1.0, []);
    if (step === 25) {
      assert(shieldedEnemy.shieldHp === 0 && Math.abs(shieldedEnemy.shieldRegenTimer - 2.5) < 0.001, 'F-06.6: At t=2.5s, shieldHp remains 0 and regenTimer is 2.5s');
    }
    if (step === 49) {
      assert(shieldedEnemy.shieldHp === 0 && Math.abs(shieldedEnemy.shieldRegenTimer - 0.1) < 0.001, 'F-06.7: At t=4.9s, shieldHp remains 0 and regenTimer is 0.1s');
    }
  }

  assert(shieldedEnemy.shieldHp === 3 && shieldedEnemy.shieldRegenTimer === 0, 'F-06.8: At t=5.1s (>5.0s), shield fully regenerates to 3 HP and timer resets to 0');

  // 3. Test even larger 100 damage overkill bullet on regenerated shield
  const overkillBullet100 = new Bullet(shieldedEnemy.position.x, shieldedEnemy.position.y, -400, 100, true, 1);
  gm.bullets = [overkillBullet100];
  gm['checkCollisions']();

  assert(shieldedEnemy.shieldHp === 0, 'F-06.9: 100-damage bullet on regenerated shield drops shieldHp to 0');
  assert(shieldedEnemy.shieldRegenTimer === 5.0, 'F-06.10: 100-damage bullet sets regen timer to 5.0s');
  assert(shieldedEnemy.hp === initialBodyHp, 'F-06.11: Body HP still intact after second overkill hit');
}

// -------------------------------------------------------------
// STRESS TEST 3 (F-07): SNIPER INTERCEPTION WITH MULTI-SHOT ANGLED BULLETS
// -------------------------------------------------------------
console.log('\n--- [F-07] Stress Test: Sniper Interception with Multi-Shot Angled Bullets ---');
{
  const gm = new GameManager(mockCanvas);
  gm.player.position.x = 275;
  gm.player.position.y = 700;

  // Test player firing 5-spread angled bullets
  gm.player.multiShot = 5;
  const firedBullets = gm.player.fire();
  assert(firedBullets.length === 5, 'F-07.1: Multi-Shot Lv 5 produces exactly 5 player bullets');
  const hasAngledVelocities = firedBullets.some(b => b.velocity.x !== 0);
  assert(hasAngledVelocities, 'F-07.1b: Multi-Shot Lv 5 produces angled velocity trajectories');

  // Create 5 player bullets in mid-flight at Y=400 (well above player at Y=700)
  const playerBullets: Bullet[] = [
    new Bullet(235, 400, -400, 1, true, 1),
    new Bullet(255, 400, -400, 1, true, 1),
    new Bullet(275, 400, -400, 1, true, 1),
    new Bullet(295, 400, -400, 1, true, 1),
    new Bullet(315, 400, -400, 1, true, 1),
  ];

  // Create 3 sniper bullets (interceptable) directly overlapping player bullets 0, 2, 4
  const sniperB0 = new Bullet(playerBullets[0].position.x, playerBullets[0].position.y, 300, 1, false);
  sniperB0.isInterceptable = true;
  const sniperB2 = new Bullet(playerBullets[2].position.x, playerBullets[2].position.y, 300, 1, false);
  sniperB2.isInterceptable = true;
  const sniperB4 = new Bullet(playerBullets[4].position.x, playerBullets[4].position.y, 300, 1, false);
  sniperB4.isInterceptable = true;

  // Create 2 normal red enemy bullets (NOT interceptable) overlapping player bullets 1, 3
  const normalB1 = new Bullet(playerBullets[1].position.x, playerBullets[1].position.y, 300, 1, false);
  normalB1.isInterceptable = false;
  const normalB3 = new Bullet(playerBullets[3].position.x, playerBullets[3].position.y, 300, 1, false);
  normalB3.isInterceptable = false;

  gm.bullets = [...playerBullets, sniperB0, sniperB2, sniperB4, normalB1, normalB3];

  gm['checkCollisions']();

  // Interceptable sniper bullets MUST be destroyed
  assert(sniperB0.isDead === true, 'F-07.2: Sniper bullet 0 is intercepted and destroyed');
  assert(sniperB2.isDead === true, 'F-07.3: Sniper bullet 2 is intercepted and destroyed');
  assert(sniperB4.isDead === true, 'F-07.4: Sniper bullet 4 is intercepted and destroyed');

  // Player bullets 0, 2, 4 consumed in interception
  assert(playerBullets[0].isDead === true, 'F-07.5: Player bullet 0 destroyed on interception');
  assert(playerBullets[2].isDead === true, 'F-07.6: Player bullet 2 destroyed on interception');
  assert(playerBullets[4].isDead === true, 'F-07.7: Player bullet 4 destroyed on interception');

  // Normal enemy bullets MUST NOT be destroyed
  assert(normalB1.isDead === false, 'F-07.8: Normal enemy bullet 1 survives player bullet collision (NOT interceptable)');
  assert(normalB3.isDead === false, 'F-07.9: Normal enemy bullet 3 survives player bullet collision (NOT interceptable)');

  // Player bullets 1 and 3 are NOT consumed by normal enemy bullets
  assert(playerBullets[1].isDead === false, 'F-07.10: Player bullet 1 continues flight through normal enemy bullet');
  assert(playerBullets[3].isDead === false, 'F-07.11: Player bullet 3 continues flight through normal enemy bullet');
}

// -------------------------------------------------------------
// STRESS TEST 4 (F-08): NEAR-MISS SUPPRESSION ACROSS 200 CONSECUTIVE FRAMES
// -------------------------------------------------------------
console.log('\n--- [F-08] Stress Test: Near-Miss Suppression Across 200 Consecutive Frames ---');
{
  const gm = new GameManager(mockCanvas);
  gm.player.suppressionLevel = 0;
  gm.player.stressLevel = 0;
  gm.player.position.x = 200;
  gm.player.position.y = 700;
  gm.player.size = { width: 50, height: 40 };

  // Bullet placed skimming player border (X = 265, Y = 715 -> dx = 45 < 80, inside Y range [700, 740])
  const skimmingBullet = new Bullet(265, 715, 0, 1, false); // speed 0 so it stays skimming
  gm.bullets = [skimmingBullet];

  let triggerCount = 0;
  const history: { frame: number; supp: number; stress: number }[] = [];

  for (let frame = 1; frame <= 200; frame++) {
    const prevSupp = gm.player.suppressionLevel;
    gm['checkCollisions']();
    if (gm.player.suppressionLevel > prevSupp) {
      triggerCount++;
    }
    if (frame % 50 === 0 || frame === 1 || frame === 2) {
      history.push({ frame, supp: gm.player.suppressionLevel, stress: gm.player.stressLevel });
    }
  }

  assert(triggerCount === 1, 'F-08.1: Near-miss suppression triggered exactly 1 time across 200 consecutive frames (got ' + triggerCount + ')');
  assert(gm.player.suppressionLevel === 15, 'F-08.2: Final suppressionLevel is exactly 15 after 200 frames (got ' + gm.player.suppressionLevel + ')');
  assert(gm.player.stressLevel === 5, 'F-08.3: Final stressLevel is exactly 5 after 200 frames (got ' + gm.player.stressLevel + ')');
  assert(skimmingBullet.hasTriggeredNearMiss === true, 'F-08.4: Bullet hasTriggeredNearMiss flag is permanently true');
  assert(skimmingBullet.isDead === false, 'F-08.5: Skimming bullet is NOT marked dead (near-miss is non-lethal)');

  // 10 distinct skimming bullets passing sequentially
  gm.player.suppressionLevel = 0;
  gm.player.stressLevel = 0;
  const tenBullets: Bullet[] = [];
  for (let b = 0; b < 10; b++) {
    const nb = new Bullet(260 + (b % 4) * 2, 715, 0, 1, false);
    tenBullets.push(nb);
  }
  gm.bullets = tenBullets;

  // Tick 50 frames with 10 bullets
  for (let frame = 1; frame <= 50; frame++) {
    gm['checkCollisions']();
  }

  // 10 bullets * 15 suppression = 150 -> clamped to max 100
  assert(gm.player.suppressionLevel === 100, 'F-08.6: 10 distinct skimming bullets correctly sum to 100 (clamped max from 150)');
  // 10 bullets * 5 stress = 50
  assert(gm.player.stressLevel === 50, 'F-08.7: 10 distinct skimming bullets increase stressLevel to exactly 50');
  const allFlagged = tenBullets.every(b => b.hasTriggeredNearMiss === true);
  assert(allFlagged, 'F-08.8: All 10 bullets have hasTriggeredNearMiss set to true');
}

console.log('\n================================================================');
console.log('CHALLENGER 2 SUMMARY: Total: ' + totalTests + ' | Passed: ' + passedTests + ' | Failed: ' + failedTests);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

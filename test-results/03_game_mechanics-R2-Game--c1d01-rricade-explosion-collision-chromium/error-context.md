# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03_game_mechanics.spec.ts >> R2: Game Mechanics & State Simulation Suite >> Diver enemy dive acceleration & barricade explosion collision
- Location: tests\03_game_mechanics.spec.ts:157:7

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 10.8
Received:    4.799999999999997
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "Water Invader" [level=1] [ref=e4]
      - paragraph [ref=e5]: Use Left/Right Arrows or A/D to move. Spacebar to shoot.
    - generic [ref=e6]:
      - generic:
        - generic:
          - 'heading "Score: 0" [level=2]'
          - paragraph: "Pure Water: 0 💧"
          - paragraph: WAVE 1
      - generic [ref=e10]:
        - generic [ref=e11]:
          - button "ALLY(Q)" [ref=e12]
          - button "ULT(0%)" [ref=e13]
        - button "FIRE!" [ref=e14]
  - alert [ref=e15]
```

# Test source

```ts
  111 |         gm.warningTimer = 0.05;
  112 |       }
  113 |     });
  114 | 
  115 |     // Wait for helper spawn in game update loop
  116 |     await page.waitForTimeout(300);
  117 | 
  118 |     const helperCount = await page.evaluate(() => (window as any).gameManager.helpers.length);
  119 |     expect(helperCount).toBeGreaterThanOrEqual(1);
  120 | 
  121 |     const helperData = await page.evaluate(() => {
  122 |       const gm = (window as any).gameManager;
  123 |       return gm.helpers.map((h: any) => ({
  124 |         type: h.type,
  125 |         hp: h.hp,
  126 |         color: h.color,
  127 |         isExpired: h.isExpired(),
  128 |       }));
  129 |     });
  130 | 
  131 |     expect(helperData[0].isExpired).toBe(false);
  132 |     expect(helperData[0].hp).toBeGreaterThan(0);
  133 |   });
  134 | 
  135 |   test('Ultimate Skill Heavy Rain (E key) triggers at 100% gauge', async ({ page }) => {
  136 |     // Set ultimate gauge to 100%
  137 |     await page.evaluate(() => {
  138 |       (window as any).gameManager.player.ultimateGauge = 100;
  139 |     });
  140 | 
  141 |     // Press E to trigger ultimate
  142 |     await page.keyboard.press('e');
  143 | 
  144 |     const ultState = await page.evaluate(() => {
  145 |       const gm = (window as any).gameManager;
  146 |       const ultBullets = gm.bullets.filter((b: any) => b.velocity.y === 300 && b.isPlayerBullet);
  147 |       return {
  148 |         ultimateGaugeAfter: gm.player.ultimateGauge,
  149 |         ultBulletsCount: ultBullets.length,
  150 |       };
  151 |     });
  152 | 
  153 |     expect(ultState.ultimateGaugeAfter).toBe(0);
  154 |     expect(ultState.ultBulletsCount).toBe(30); // 30 rain bullets spawned
  155 |   });
  156 | 
  157 |   test('Diver enemy dive acceleration & barricade explosion collision', async ({ page }) => {
  158 |     const diverCollisionResult = await page.evaluate(() => {
  159 |       const gm = (window as any).gameManager;
  160 |       const EnemyClass = gm.enemies[0].constructor;
  161 |       const BulletClass = gm.player.fire()[0].constructor;
  162 |       
  163 |       // Clear other enemies for clean test
  164 |       gm.enemies = [];
  165 |       
  166 |       // Position player at x: 275
  167 |       gm.player.position.x = 275;
  168 |       
  169 |       // Spawn Diver directly above player (x: 275, y: 100)
  170 |       const diver = new EnemyClass(275, 100, gm.canvas.width, 1, 4); // EnemyType.DIVER = 4
  171 |       gm.enemies.push(diver);
  172 |       
  173 |       const initialDiverY = diver.position.y;
  174 |       const diverSpeedY = diver.speedY; // base speedY (e.g. 8 or 10)
  175 |       
  176 |       // 1. Update Diver with playerPos aligned to trigger dive
  177 |       diver.update(0.1, 1.0, [], gm.player.position);
  178 |       const isDiving = diver.isDiving;
  179 |       const diverYAfterDive = diver.position.y;
  180 |       const dy = diverYAfterDive - initialDiverY;
  181 |       
  182 |       // 2. Test barricade collision & explosion
  183 |       // Place destructible barricade right at diver path
  184 |       const targetBarricade = gm.barricades[0]; // Destructible barricade
  185 |       targetBarricade.hp = 20;
  186 |       targetBarricade.position.x = 275;
  187 |       targetBarricade.position.y = 300;
  188 |       
  189 |       diver.position.x = 275;
  190 |       diver.position.y = 300; // Directly colliding with barricade
  191 | 
  192 |       // Ensure a bullet exists so checkCollisions outer loop executes
  193 |       const dummyBullet = new BulletClass(0, -100, -400, 1, true, 1);
  194 |       gm.bullets = [dummyBullet];
  195 |       
  196 |       const particlesBefore = gm.particles.length;
  197 |       gm.checkCollisions();
  198 |       const particlesAfter = gm.particles.length;
  199 |       
  200 |       return {
  201 |         isDiving,
  202 |         dy,
  203 |         expectedMinDy: diverSpeedY * 15 * 0.1 * 0.9, // 15x downward acceleration
  204 |         diverDeadAfterCrash: diver.isDead,
  205 |         barricadeHpAfterCrash: targetBarricade.hp,
  206 |         explosionParticlesSpawned: particlesAfter - particlesBefore,
  207 |       };
  208 |     });
  209 | 
  210 |     expect(diverCollisionResult.isDiving).toBe(true);
> 211 |     expect(diverCollisionResult.dy).toBeGreaterThanOrEqual(diverCollisionResult.expectedMinDy);
      |                                     ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  212 |     expect(diverCollisionResult.diverDeadAfterCrash).toBe(true);
  213 |     expect(diverCollisionResult.barricadeHpAfterCrash).toBe(0); // 20 - 20 crash dmg = 0
  214 |     expect(diverCollisionResult.explosionParticlesSpawned).toBe(30); // 30 red explosion particles
  215 |   });
  216 | 
  217 |   test('Splitter enemy movement speed and splitting on death', async ({ page }) => {
  218 |     const splitterResult = await page.evaluate(() => {
  219 |       const gm = (window as any).gameManager;
  220 |       const EnemyClass = gm.enemies[0].constructor;
  221 |       const BulletClass = gm.bullets[0]?.constructor || (window as any).gameManager.player.fire()[0].constructor;
  222 |       
  223 |       gm.enemies = [];
  224 |       gm.bullets = [];
  225 | 
  226 |       // Spawn Splitter at (200, 200)
  227 |       const splitter = new EnemyClass(200, 200, gm.canvas.width, 1, 6); // EnemyType.SPLITTER = 6
  228 |       gm.enemies.push(splitter);
  229 | 
  230 |       const initialSpeedX = splitter.speedX;
  231 |       const initialSpeedY = splitter.speedY;
  232 | 
  233 |       // Shoot player bullet directly at Splitter
  234 |       const bullet = new BulletClass(210, 210, -400, 10, true, 1);
  235 |       gm.bullets.push(bullet);
  236 | 
  237 |       // Check collision which should kill Splitter and spawn 2 mini-enemies
  238 |       gm.checkCollisions();
  239 | 
  240 |       const enemiesAfterDeath = gm.enemies;
  241 |       const miniEnemies = enemiesAfterDeath.filter((e: any) => e !== splitter);
  242 | 
  243 |       return {
  244 |         initialSpeedX,
  245 |         initialSpeedY,
  246 |         splitterDead: splitter.isDead,
  247 |         miniEnemiesCount: miniEnemies.length,
  248 |         mini1Size: miniEnemies[0] ? { w: miniEnemies[0].size.width, h: miniEnemies[0].size.height } : null,
  249 |         mini2Size: miniEnemies[1] ? { w: miniEnemies[1].size.width, h: miniEnemies[1].size.height } : null,
  250 |         mini1Speed: miniEnemies[0] ? { sx: miniEnemies[0].speedX, sy: miniEnemies[0].speedY } : null,
  251 |         mini2Speed: miniEnemies[1] ? { sx: miniEnemies[1].speedX, sy: miniEnemies[1].speedY } : null,
  252 |       };
  253 |     });
  254 | 
  255 |     expect(splitterResult.initialSpeedX).toBeLessThanOrEqual(50);
  256 |     expect(splitterResult.initialSpeedY).toBeLessThanOrEqual(10);
  257 |     expect(splitterResult.splitterDead).toBe(true);
  258 |     expect(splitterResult.miniEnemiesCount).toBe(2);
  259 |     expect(splitterResult.mini1Size).toEqual({ w: 20, h: 20 });
  260 |     expect(splitterResult.mini2Size).toEqual({ w: 20, h: 20 });
  261 |     expect(splitterResult.mini1Speed).toEqual({ sx: 10, sy: 5 });
  262 |     expect(splitterResult.mini2Speed).toEqual({ sx: -10, sy: 5 });
  263 |   });
  264 | 
  265 |   test('QA Audit: Barricade slowdown & Sniper bullet interception discrepancy analysis', async ({ page }) => {
  266 |     const auditFindings = await page.evaluate(() => {
  267 |       const gm = (window as any).gameManager;
  268 |       const EnemyClass = gm.enemies[0].constructor;
  269 |       const BulletClass = gm.player.fire()[0].constructor;
  270 | 
  271 |       // 1. Check Barricade Slowdown behavior
  272 |       const normalEnemy = new EnemyClass(100, 100, gm.canvas.width, 1, 0); // NORMAL
  273 |       const barricade = gm.barricades[0];
  274 |       barricade.position.x = 100;
  275 |       barricade.position.y = 100;
  276 |       gm.enemies = [normalEnemy];
  277 | 
  278 |       // Provide bullet so checkCollisions loop processes enemy-barricade logic
  279 |       const dummyBullet = new BulletClass(0, -100, -400, 1, true, 1);
  280 |       gm.bullets = [dummyBullet];
  281 | 
  282 |       gm.checkCollisions();
  283 |       const isGnawing = normalEnemy.isGnawing;
  284 |       const speedBeforeUpdate = normalEnemy.speedX;
  285 |       normalEnemy.update(0.1, 1.0, []);
  286 |       const speedAfterUpdate = normalEnemy.speedX;
  287 | 
  288 |       // 2. Check Sniper Bullet Interception behavior
  289 |       const sniper = new EnemyClass(200, 100, gm.canvas.width, 1, 3); // SNIPER
  290 |       sniper.fireTimer = 0; // force fire
  291 |       const sniperBullet = sniper.fire(gm.player.position);
  292 |       const isInterceptableFlag = sniperBullet ? sniperBullet.isInterceptable : false;
  293 | 
  294 |       // Create a player bullet colliding with sniper bullet
  295 |       const playerBullet = new BulletClass(sniperBullet.position.x, sniperBullet.position.y, -400, 1, true, 1);
  296 |       gm.bullets = [sniperBullet, playerBullet];
  297 | 
  298 |       gm.checkCollisions();
  299 |       const sniperBulletDeadAfterCollision = sniperBullet.isDead;
  300 |       const playerBulletDeadAfterCollision = playerBullet.isDead;
  301 | 
  302 |       return {
  303 |         barricadeSlowdown: {
  304 |           isGnawingSet: isGnawing,
  305 |           speedReduced: speedAfterUpdate < speedBeforeUpdate,
  306 |           gnawDamageDealtToBarricade: barricade.hp < barricade.maxHp,
  307 |         },
  308 |         sniperBulletInterception: {
  309 |           isInterceptableMarked: isInterceptableFlag,
  310 |           sniperBulletDestroyedByPlayerBullet: sniperBulletDeadAfterCollision,
  311 |           playerBulletDestroyedBySniperBullet: playerBulletDeadAfterCollision,
```
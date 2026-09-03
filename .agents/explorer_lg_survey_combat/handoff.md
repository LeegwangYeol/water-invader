# Technical Survey and Architectural Specification: Homing Missile Mechanics (R1)

**Working Directory**: `/Users/user/src/water-invader/.agents/explorer_lg_survey_combat`  
**Target Milestone**: Late-Game Combat Mechanics & Homing Missile System (R1)  
**Author**: Explorer Subagent (Combat & Physics Domain)

---

## 1. Observation

### 1.1 Existing Projectile Architecture (`src/game/Bullet.ts` & `src/game/Entity.ts`)
- **Entity Base Class** (`src/game/Entity.ts:3-96`):
  - `Entity` encapsulates `position: Vector2D`, `velocity: Vector2D`, `size: Size`, `isDead: boolean`, and `prevPosition?: Vector2D`.
  - Continuous Collision Detection (CCD) is implemented via `getSweptRect()` (`Entity.ts:39-54`):
    ```ts
    const minX = Math.min(this.prevPosition.x, this.position.x);
    const maxX = Math.max(this.prevPosition.x + this.size.width, this.position.x + this.size.width);
    const minY = Math.min(this.prevPosition.y, this.position.y);
    const maxY = Math.max(this.prevPosition.y + this.size.height, this.position.y + this.size.height);
    ```
  - `checkCollision(other: Entity)` (`Entity.ts:56-96`) executes a two-tier evaluation: instantaneous AABB followed by swept bounds checking against both `this.prevPosition` and `other.prevPosition`.
- **Bullet Implementation** (`src/game/Bullet.ts:4-38`):
  - `Bullet` extends `Entity`.
  - Properties: `damage: number`, `piercing: number`, `isInterceptable: boolean`, `hitEntities: Set<Entity>`, `shooter?: Entity`, and `faction: Faction`.
  - Standard player projectile constructor sets `width = 6`, `height = 12`, `speedY = -400` (upward), `damage = 1`, and `color = '#38bdf8'`.
  - Update method (`Bullet.ts:34-38`):
    ```ts
    public update(deltaTime: number): void {
      this.prevPosition = { x: this.position.x, y: this.position.y };
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
    }
    ```
  - Rendering (`Bullet.ts:40-164`): Employs a 4-tier vector draw (Tier 1: outer glow halo, Tier 2: 2.0px black armor rim for WCAG AAA contrast, Tier 3: colored plasma shell, Tier 4: white core highlight).

### 1.2 Combat Loop & Collision Lifecycle (`src/game/GameManager.ts`)
- **Bullet Update Loop** (`GameManager.ts:1152`):
  - Executed every fixed physics frame ($60\text{ Hz}$ step $\Delta t = 1/60\text{s}$):
    ```ts
    this.bullets.forEach(bullet => bullet.update(deltaTime));
    ```
- **Boundary Compaction & Lifetime** (`GameManager.ts:1184-1198`):
  - In-place two-pointer compaction removes bullets outside bounds:
    ```ts
    !b.isDead &&
    b.position.y > -50 &&
    b.position.y < this.logicalHeight + 50 &&
    b.position.x > -100 &&
    b.position.x < this.logicalWidth + 100
    ```
- **Collision Phases** (`GameManager.ts:1287-1420`):
  - Phase 1.0: Bullet vs End-Game Crisis entities (`endGameCrisis.handleBulletCollision`).
  - Phase 1.1: Bullet vs Barricades (`barricade.checkCollision(bullet)` reduces barricade HP, marks `bullet.isDead = true`). Barricades are located at $y = 650$.
  - Phase 1.2: Hostile bullet interception (`otherBullet.isInterceptable || bullet.isInterceptable`).
  - Phase 1.3: Bullet vs Enemies:
    - Checks `!enemy.isDead`, `!bullet.hitEntities.has(enemy)`, `bullet.shooter !== enemy`.
    - Pierce tracking: `bullet.hitEntities.add(enemy); bullet.piercing--; if (bullet.piercing <= 0) bullet.isDead = true;`.
    - Damage deduction against `enemy.shieldHp` (if `SHIELDED`) or `enemy.hp`.

### 1.3 Player Firing Cadence & Upgrades (`src/game/Player.ts` & `src/game/GameManager.ts`)
- **Player Firing Mechanics** (`Player.ts:103-169`):
  - Base fire rate: `baseFireRate = 0.5s`, modulated by stress level: `currentFireRate = baseFireRate / (1 + stressLevel / 50)`.
  - Base projectile speed: $400\text{ px/s}$.
  - Multi-shot spread angles: $1 \to 5$ projectiles with angular spreads up to $\pm 20^\circ$.
  - Bullet damage is fixed at `damage = 1`.
- **Shop Upgrade Structure** (`GameManager.ts:2054-2110` & `components/game-canvas.tsx:12-104`):
  - Upgrades exposed via `getUpgrades()`: `{ fireRate, multiShot, piercing, hasAcidShield }`.
  - Upgrade purchase methods: `upgradeFireRate()` (50 💧), `upgradeMultiShot()` (100 💧), `upgradePiercing()` (200 💧), `upgradeAcidShield()` (150 💧).
  - State persistence: `GameManager.init(false, true)` preserves all purchased upgrades across pre-game shop modal transitions into Wave 1.

### 1.4 Post-Wave 10 Aggression and Proximity Threats (`src/game/Enemy.ts` & `src/game/GameManager.ts`)
- **Extreme HP Scaling** (`Enemy.ts:147-206`):
  - Standard enemies jump from $1 + \lfloor \text{level}/3 \rfloor$ HP (1-3 HP in waves 1-9) to:
    $$\text{standardHp} = 4 + (\text{level} - 9) \times 6 + \lfloor (\text{level} - 9)^{1.5} \rfloor$$
    - Wave 10: $11\text{ HP}$ ($11\times$ baseline).
    - Wave 11: $18\text{ HP}$.
    - Rogue Mech: $15 + (\text{level} - 9) \times 10 = 25\text{ HP}$ at Wave 10.
- **Aggression Rush Velocity** (`Enemy.ts:83-88`, `231-233`):
  - At level $\ge 10$, `isAggressive = true` activates `rushVelocityModifier = 1.8 + Math.min(1.2, (level - 10) * 0.15)` ($1.8\times$ to $3.0\times$ downward descent speed).
  - `EnemyType.DIVER` triggers vertical dives directly down toward player ($y = 740$), dropping into $y \in [600, 720]$ within fractions of a second.
  - Flank and Spearhead dynamic reinforcements (`GameManager.ts:470-520`) inject aggressive units along screen borders ($x = 10, 550$) and descending wedges.

---

## 2. Logic Chain

### 2.1 Why the Player Needs Homing Missiles After Wave 10
1. **Observation**: Wave 10+ enemies possess $11\text{ to }25+\text{ HP}$ (`Enemy.ts:148-206`) and rush vertically downward at up to $3.0\times$ speed (`Enemy.ts:86`).
2. **Observation**: Player primary water bullets deal only `damage: 1` (`Player.ts:125-162`). Defeating a single $11\text{ HP}$ rusher requires 11 direct hits. If an enemy rushes from $y = 600$ to the player at $y = 740$, the player has only $\approx 0.5 - 0.8\text{s}$ to react.
3. **Inference**: Linear-trajectory unguided bullets suffer from severe hit-rate degradation when the player is forced to evade laterally. A guided projectile dealing significant burst damage ($8 - 10\text{ damage}$) that autonomously seeks the nearest threat is essential to prevent close-range breaches.

### 2.2 Target Acquisition Physics & Mathematics
1. **Candidate Pool**:
   - Filter criteria: $E \in \text{enemies}$ where `!E.isDead && E.faction !== Faction.PLAYER`.
   - Also evaluate End-Game Crisis bosses (`endGameCrisis.sovereign` / `endGameCrisis.rifts`) if regular enemies are absent.
   - Screen bounds clamp: $-30 \le E.x \le 630$ and $-30 \le E.y \le 830$.
2. **Distance Calculation**:
   - Measure Euclidean distance between missile center $P_m = (x_m + w_m/2, y_m + h_m/2)$ and enemy center $P_e = (x_e + w_e/2, y_e + h_e/2)$.
   - Use squared distance $D^2 = (P_{e,x} - P_{m,x})^2 + (P_{e,y} - P_{m,y})^2$ to avoid expensive `Math.sqrt` calls during candidate selection.
   - Nearest enemy $E^*$ minimizes $D^2$.
3. **Proximity Bias for Close-Spawning Threats**:
   - Because missiles launch from player position $(x_p, y_p \approx 740)$, distance to a close rusher at $y = 650$ is $D \approx 90\text{ px}$, compared to $D \approx 640\text{ px}$ for backline enemies.
   - Pure Euclidean distance naturally and mathematically prioritizes the closest immediate danger to the player.

### 2.3 Steering Dynamics & Minimum Turning Radius Analysis
1. **Steering Kinematics**:
   - Let missile current heading angle be $\theta = \operatorname{atan2}(v_y, v_x)$ and speed $v = \sqrt{v_x^2 + v_y^2}$.
   - Target angle: $\theta_d = \operatorname{atan2}(P_{e,y} - P_{m,y}, P_{e,x} - P_{m,x})$.
   - Angular difference normalized to $(-\pi, \pi]$:
     ```ts
     const angleDiff = Math.atan2(Math.sin(theta_d - theta), Math.cos(theta_d - theta));
     ```
   - Clamped turn rate per frame:
     ```ts
     const maxTurn = this.turnRate * deltaTime;
     const newTheta = theta + Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
     ```
2. **Turning Radius Formula**:
   $$R = \frac{v}{\omega}$$
   - Where $v$ is velocity in $\text{px/s}$ and $\omega$ is angular velocity clamp in $\text{rad/s}$.
   - **Case Study (Close-Range Interception)**:
     - Player is at $y = 740$; enemy is diving at $x = x_p + 80, y = 660$ ($\Delta x = 80\text{ px}, \Delta y = -80\text{ px}$). Target angle is $-45^\circ$, launch angle is $-90^\circ$ (heading difference $\Delta \theta = 45^\circ = 0.785\text{ rad}$).
     - If $\omega = 6.0\text{ rad/s}$ and $v = 280\text{ px/s}$:
       $$R = \frac{280}{6.0} \approx 46.7\text{ px}$$
       Time to rotate $45^\circ$: $t_{\text{turn}} = 0.785 / 6.0 \approx 0.13\text{s}$.
       Vertical distance traveled during turn: $0.13 \times 280 \approx 36.4\text{ px}$.
       The missile cleanly curves into the target without overshooting!
     - In contrast, if $\omega = 2.5\text{ rad/s}$ and $v = 450\text{ px/s}$, $R = 180\text{ px}$. The missile would overshoot by over $100\text{ px}$, forcing a massive orbital loop that fails to protect the player.
3. **Speed Profile & Launch Tuning**:
   - Initial launch speed: $v_0 = 280\text{ px/s}$ (enables tight turning radius $R \approx 45\text{ px}$ upon exit).
   - Acceleration: $a = 350\text{ px/s}^2$ up to $v_{\max} = 520\text{ px/s}$.
   - As distance increases, the missile accelerates into high-speed terminal pursuit.
   - Initial Target Alignment: If an enemy is within $250\text{ px}$ at launch, initialize missile velocity vector tilted up to $\pm 35^\circ$ toward target angle, guaranteeing instant point-blank lock.

### 2.4 Retargeting & Edge Case Fault Tolerance
1. **Target Death Mid-Flight**:
   - If `!this.target || this.target.isDead`:
     - Re-evaluate candidate pool and acquire new nearest enemy.
     - If no enemies remain alive, retain last heading angle $\theta$ and cruise forward linearly until pruned by screen bounds.
2. **Empty Enemy Pool**:
   - When `enemies.length === 0`, `target` is `null`. The missile behaves as a straight high-velocity rocket ($\theta = -\pi/2$), cleanly pruned at $y < -50$.
3. **Performance under Large Swarms**:
   - Retargeting uses $O(N)$ squared distance comparisons without `Math.sqrt`.
   - Missiles retain target lock ("sticky targeting") until target dies or leaves screen bounds, reducing acquisition calls to 0 on non-transition frames.
   - Smoke particles are throttled to 1 particle every $0.05\text{s}$ per missile, consuming $\approx 10-20\text{ particles/s}$ per missile, well within `GameManager`'s 500-particle pool.

### 2.5 Damage & Blast Mechanics
1. **Direct Impact**: Base damage $8\text{ HP}$ (8x standard bullet).
2. **Splash Detonation**:
   - Blast radius $R_{\text{splash}} = 45\text{ px}$.
   - Secondary splash damage: $\lfloor 8 \times 0.5 \rfloor = 4\text{ HP}$ to all other enemies within $45\text{ px}$.
   - Breaks Shields on `EnemyType.SHIELDED` caught in the blast.
   - Generates screen shake ($0.25\text{s}$) and audio explosion via `soundManager.playExplosion()`.

### 2.6 Barricade Interaction
- **Observation**: In `GameManager.ts:1310-1326`, player bullets collide with barricades at $y = 650$. Destructible barricades have $20\text{ HP}$.
- **Inference**: A homing missile dealing $8\text{ damage}$ colliding with player barricades would destroy friendly cover.
- **Design Rule**: `HomingMissile` must declare `ignoreBarricades: boolean = true`. In `GameManager.ts:1313`, skip barricade collision when `bullet.ignoreBarricades === true`, representing an aerial ballistic trajectory over ground fortifications.

---

## 3. Caveats

1. **End-Game Crisis Interaction**:
   - In Waves 15+, when `CrisisSovereign` or `DimensionalRift` spawn, regular enemies may be sparse. Target acquisition must accept `Entity` targets or explicitly fall back to `endGameCrisis.sovereign` and active rifts if `enemies` array is depleted.
2. **Shop Economy & Late-Game Pricing**:
   - The user specification states: *"The price can be scaled for late-game."*
   - Base unlock price should be set to $250\text{ 💧}$ Pure Water.
   - If tiered upgrades (Lv 1-3) are adopted:
     - Lv 1: 250 💧 (1 missile per salvo, 1.2s reload, 8 dmg).
     - Lv 2: 350 💧 (2 missiles per salvo / twin wing pods, 8 dmg).
     - Lv 3: 500 💧 (2 missiles per salvo, 10 dmg, 50px splash).
   - If single-tier unlock (similar to Acid Shield 150 💧): 250 💧 flat unlock fee.
3. **Weapon Architecture Coexistence**:
   - Homing missiles must NOT replace the player's primary water weapon. They must operate as an automated secondary launcher pod mounted on ship wingtips, firing on a dedicated reload timer ($1.2\text{s}$ cooldown) whenever the player is firing.

---

## 4. Conclusion

The technical design for Homing Missiles (유도탄, R1) is completely formulated, mathematically grounded, and aligned with all existing codebase architectures:

### 4.1 Class Design (`HomingMissile extends Bullet`)
```ts
export class HomingMissile extends Bullet {
  public target: Enemy | null = null;
  public turnRate: number = 6.2; // rad/s (~355 deg/s)
  public speed: number = 280; // px/s launch velocity
  public maxSpeed: number = 520; // px/s terminal velocity
  public acceleration: number = 360; // px/s^2
  public lifeTime: number = 4.5; // seconds
  public smokeTimer: number = 0;
  public splashRadius: number = 45; // px
  public splashDamage: number = 4;
  public ignoreBarricades: boolean = true;
  public angle: number = -Math.PI / 2; // initial heading straight up

  constructor(x: number, y: number, damage: number = 8) {
    super(x, y, -280, damage, true, 1);
    this.size = { width: 10, height: 18 };
    this.color = '#0284c7';
  }
  ...
}
```

### 4.2 Core Algorithms
1. **Target Acquisition**:
   - Scans `enemies` where `!e.isDead && e.faction !== Faction.PLAYER`.
   - Computes minimum squared distance $D^2 = \Delta x^2 + \Delta y^2$.
   - Falls back to `endGameCrisis` targets if present.
2. **Steering Update**:
   - Normalizes $\Delta \theta$ via `Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle))`.
   - Clamps angular step to $\pm \text{turnRate} \times \Delta t$.
   - Updates $v_x = v \cos(\theta)$, $v_y = v \sin(\theta)$.
   - Updates `prevPosition` for seamless swept-box CCD (`DEFECT-C1`).
3. **Visual Vector Rendering**:
   - Rotates canvas context to missile heading angle $\theta$.
   - Renders aerodynamic cyan-and-titanium fuselage, dual stabilizing tail fins, high-contrast 2px black border, and animated propulsion exhaust flame.
   - Emits trailing smoke particles into `GameManager.particles`.

### 4.3 Files to Modify During Implementation
| File Path | Nature of Modification |
|---|---|
| `src/game/Bullet.ts` | Export new `HomingMissile extends Bullet` class with pursuit steering, CCD, and vector rendering. |
| `src/game/Player.ts` | Add `hasHomingMissiles: boolean`, `homingMissileTimer: number`, secondary launcher logic in `update()`/`fire()`, and wingtip missile pod visual indicators in `draw()`. |
| `src/game/GameManager.ts` | Add `upgradeHomingMissiles()`, expose `hasHomingMissiles` in `getUpgrades()`, preserve upgrade in `init(false, true)`, pass `this.enemies` to `bullet.update()`, and execute splash blast logic in `checkCollisions()`. |
| `src/components/game-canvas.tsx` | Add Homing Missile purchase card (250 💧) in `ShopUpgradePanel` and connect buy callbacks. |
| `src/game/SoundManager.ts` | Add `playMissileLaunch()` rocket ignition audio synthesizer. |

---

## 5. Verification Method

### 5.1 Automated Test Suite Specifications (`tests/16_homing_missile_combat.spec.ts`)
To independently verify the implementation once coded, the following Playwright test suite should be executed:

1. **Target Acquisition Test**:
   - Spawn player at $(275, 740)$ and an enemy at $(450, 400)$.
   - Fire homing missile; assert missile velocity $v_x > 0$ and $v_y < 0$ curving towards target position within 5 ticks.
2. **Wave 10+ Close Proximity Interception Test**:
   - Spawn enemy at $(275, 640)$ (only 100px above player).
   - Fire homing missile; assert missile collides with enemy without overshooting ($y_{\text{missile}}$ never exceeds $y_{\text{enemy}} - 50$).
3. **Retargeting on Target Death Test**:
   - Spawn Enemy A at $(200, 500)$ and Enemy B at $(400, 500)$.
   - Lock Enemy A; set `Enemy A.isDead = true`; assert missile dynamically redirects heading toward Enemy B.
4. **Empty Target Safety Test**:
   - Clear all enemies; fire missile; assert missile flies straight up at constant heading and is safely pruned at $y < -50$ with zero console errors.
5. **Damage & Splash Area Test**:
   - Spawn primary target and adjacent enemy within 35px.
   - Assert primary target receives $8\text{ damage}$ and adjacent enemy receives $4\text{ splash damage}$.
6. **Shop Economy & Wave 1 Persistence Test**:
   - Open Pre-Game Shop, purchase Homing Missile for 250 💧; assert currency decrements by 250.
   - Transition to Wave 1; assert `player.hasHomingMissiles === true`.

### 5.2 Verification Commands
```bash
# Verify type correctness and project compilation
npm run build

# Run automated combat and homing missile tests
npx playwright test tests/16_homing_missile_combat.spec.ts
```

### 5.3 Invalidation Conditions
The design is invalidated if:
- A missile tunnels through an enemy at speeds $> 500\text{ px/s}$ (violates swept-box CCD).
- A missile circles indefinitely when all targets die (violates lifetime failsafe).
- A missile detonates against friendly defensive barricades at $y = 650$ (violates `ignoreBarricades`).

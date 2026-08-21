# Water Invader Specification Survey & Architectural Mining Report

**Document ID:** SPEC-MINER-SURVEY-001  
**Timestamp:** 2026-08-21T08:10:00Z  
**Target Repository:** C:\src\SpaceInvader (LeegwangYeol/water-invader)  
**Live Deployed URL:** https://water-invader.vercel.app/  
**Author:** Spec Miner Subagent (Archetype: spec-miner)  

---

## 1. System Architecture & Flow Tree Structure (코드 트리 구조)

`	ext
Water Invader System Architecture & Execution Pipeline
├── [UI & React Layer] (src/app/page.tsx, src/components/game-canvas.tsx)
│   ├── Main Container (max-w-5xl, bg-slate-950)
│   ├── Top HUD Overlay (z-10, pointer-events-none)
│   │   ├── Score Display (점수: {score} / Score: {score})
│   │   ├── Currency Display (정수된 물: {currency} 💧)
│   │   ├── Wave Badge (WAVE {wave}, Yellow font)
│   │   ├── Lives / HP Icons (3x Circles: #3b82f6 if active, #4b5563 if depleted)
│   │   ├── Combo Pulse Meter ({combo}x COMBO!)
│   │   └── Ultimate Gauge Bar (w-32, 0~100%, Pulses Yellow/Red at 100%)
│   ├── Canvas Viewport (600x800 internal resolution, responsive aspect ratio)
│   ├── Mobile Controls Panel (Active when PLAYING)
│   │   ├── Top Skill Row (h-1/2 flex gap-1)
│   │   │   ├── ALLY(Q) Button (bg-green-600 when >=50💧, else bg-slate-700 opacity-50)
│   │   │   └── ULT Button (bg-yellow-600 when >=100%, else bg-slate-700 opacity-50)
│   │   └── Bottom Fire Button (FIRE!, bg-blue-600/80)
│   └── Modal & Overlay Layer
│       ├── Main Menu Modal (START GAME, HOW TO PLAY, PWA INSTALL APP)
│       ├── How To Play Modal (Controls, Game Mechanics, Developer Cheats: F3, F4, F5)
│       ├── Game Over Modal (Reason text, Final Score, Upgrades Shop: Fire Rate, Multi-Shot, Piercing)
│       └── In-Canvas Announcements (WAVE CLEARED countdown, ALLY/ENEMY REINFORCEMENTS warning)
│
├── [Game Engine Core] (src/game/GameManager.ts)
│   ├── State Machine (MENU -> PLAYING -> GAME_OVER)
│   ├── Game Loop (requestAnimationFrame @ 60FPS)
│   ├── Entity Manager
│   │   ├── Player (Player.ts)
│   │   ├── Enemies[] (Enemy.ts: NORMAL, ZIGZAG, BOSS, SNIPER, DIVER, SHIELDED, SPLITTER)
│   │   ├── Bullets[] (Bullet.ts: Player bullets, Enemy bullets, Ultimate barrage)
│   │   ├── Barricades[] (Barricade.ts: 2x Destructible Ice, 2x Indestructible Stone)
│   │   ├── Helpers[] (Helper.ts: FIGHTER, REPAIRER, TANK)
│   │   └── Particles[] (Particle.ts: Physics gravity & alpha decay)
│   ├── Physics & Collision Pipeline (checkCollisions)
│   │   ├── Bullets vs Barricades (Destructible block erosion vs stone bounce)
│   │   ├── Player Bullets vs Enemies (Damage, piercing decrement, splash particles)
│   │   ├── Enemy Bullets vs Helpers (Damage absorption, explosion)
│   │   ├── Enemy Bullets vs Player (HP damage, stress +40, suppression +20, screen shake)
│   │   ├── Enemy Bullets vs Player Near-Miss (Suppression +15, Stress +5)
│   │   └── Enemies vs Barricades (Diver: Crash 20 DMG + self-destruct; Others: Gnaw 0.1 DMG/frame)
│   ├── Wave Director (spawnWave, spawnBarricades, reinforcement timer)
│   └── Audio Synthesizer (SoundManager.ts: Web Audio API procedural synthesis)
`

---

## 2. Exhaustive Specification Survey

### 2.1 UI & Controls Specifications

#### A. ALLY(Q) Button & Summoning Mechanics
- **UI Button Location**: src/components/game-canvas.tsx (Lines 198–210)
  - **Component Hierarchy**: GameCanvas -> div.w-full.flex.justify-between.p-4.mt-2 -> div.flex.flex-col.gap-1.w-1/2 -> div.flex.gap-1.h-1/2 -> utton.
  - **Text**: ALLY(Q)
  - **Styling**: lex-1 rounded-xl text-xs font-bold text-white pointer-events-auto touch-none select-none
  - **Dynamic State**:
    - Enabled/Ready (currency >= 50): g-green-600 active:bg-green-500
    - Disabled/Shortage (currency < 50): g-slate-700 opacity-50
  - **Event Handlers**:
    - onPointerDown={handleTouchStart('q')}
    - onPointerUp={handleTouchEnd('q')}
    - onPointerLeave={handleTouchEnd('q')}
    - onPointerCancel={handleTouchEnd('q')}
- **Keyboard Shortcut**: Q key (src/game/GameManager.ts Line 652: if (key === 'q') this.triggerSummonAlly();).
- **Activation Logic (GameManager.triggerSummonAlly(), Lines 611–620)**:
  1. Checks if (this.currency >= 50).
  2. Deducts 50 Pure Water: 	his.currency -= 50;.
  3. Sets 	his.pendingReinforcement = 'ALLY'.
  4. Triggers immediate reinforcement: 	his.reinforcementTimer = 0.1;.
  5. Sets HUD warning message: 	his.warningMessage =  ALLY SUPPORT SUMMONED!;.
  6. Sets HUD warning banner timer: 	his.warningTimer = 2.0;.
  7. Calls 	his.updateScoreUI().
- **Reinforcement Execution (GameManager.ts Lines 202–216)**:
  - Spawns count = Math.floor(Math.random() * 3) + 1 (1 to 3 helper units).
  - Helper unit types chosen randomly from HelperType:
    - FIGHTER (Type 0, #4ade80, HP: 3, shoots upward bullets every 0.5s at speed 500)
    - REPAIRER (Type 1, #fbbf24, HP: 1, Invincible, lifespan: 8s, repairs broken barricade blocks with 20% tick chance)
    - TANK (Type 2, #a855f7, HP: 15, lifespan: 20s, patrols horizontally at canvasWidth/2 + sin(t)*200 to absorb enemy fire)
  - Emits 20 green explosion particles (#4ade80) at (canvasWidth/2, canvasHeight - 20).

#### B. HUD & UI Elements Specifications
| UI Element | Source File & Lines | Render Method | Description / Behavior |
|---|---|---|---|
| **Score** | game-canvas.tsx:158 | React DOM (<h2>) | Displays localized 점수: {score} / Score: {score} in 	ext-blue-400 font-bold. |
| **Pure Water (Currency)** | game-canvas.tsx:159 | React DOM (<p>) | Displays localized 정수된 물: {currency} 💧 / Pure Water: {currency} 💧 in 	ext-blue-200. |
| **Wave Indicator** | game-canvas.tsx:160-162 | React DOM (<p>) | Visible when PLAYING. Yellow badge WAVE {wave} (	ext-yellow-300 font-bold). |
| **Player Lives (HP)** | game-canvas.tsx:165-169 | React DOM (<div> dots) | 3 circular indicators. If i < hp, rendered with g-blue-500; otherwise g-gray-600. |
| **Combo Multiplier** | game-canvas.tsx:170-174 | React DOM (<div>) | Visible when combo > 1. Displays {combo}x COMBO! with 	ext-yellow-400 animate-pulse. Multiplies score & currency. Reset on 2s timeout or player hit. |
| **Ultimate Gauge** | game-canvas.tsx:176-184 | React DOM (<div> bar) | Width w-32 progress bar tracking ultimateGauge (0–100%). When < 100, colored g-blue-500. When >= 100, colored g-gradient-to-r from-yellow-400 to-red-500 animate-pulse. |
| **Wave Cleared Banner** | GameManager.ts:596-608 | Canvas 2D Overlay | Dark background overlay (gba(0,0,0,0.5)). Centered text: WAVE {level} CLEARED in #38bdf8 font old 48px sans-serif and Next wave in {Math.ceil(waveRestTimer)}... in #ffffff. |
| **Warning Banner** | GameManager.ts:581-595 | Canvas 2D Overlay | Flashing banner with shadowBlur: 20. Green #4ade80 for ALLY and Red #ef4444 for ENEMY reinforcements. |
| **Debug Overlay** | GameManager.ts:552-576 | Canvas 2D Stroke & Text | Toggled via F3. Magenta (#ff00ff) bounding boxes around all entities. Semi-transparent black box (gba(0,0,0,0.7)) displaying FPS, God Mode, entity counts. |

---

### 2.2 Player Character Rendering (Cute Blue Water Droplet)

- **Source File**: src/game/Player.ts (Lines 120–240)
- **Bounding Box**: width = 50, height = 40. Initial position: (canvasWidth / 2 - 25, canvasHeight - 60).
- **Vector Algorithm & Canvas Path Routine**:
  1. **Dynamic Animation Offsets**:
     - Bouncing/Breathing: ounce = Math.sin(this.timeAlive * 8) * 3 (vertical oscillation).
     - Movement Squish/Stretch: stretch = this.isMovingLeft || this.isMovingRight ? 2 : 0 (width expands by 2, height compresses by 2).
     - Jitter (Suppression): When suppressionLevel > 50, jitterX = (Math.random() - 0.5) * 4, jitterY = (Math.random() - 0.5) * 4.
     - Center & Half-extents:
       - cx = position.x + size.width / 2 + jitterX
       - cy = position.y + size.height / 2 + bounce + jitterY
       - w = size.width / 2 + stretch (25 to 27px)
       - h = size.height / 2 - stretch (18 to 20px)
  2. **Radial Gradient Body (ctx.createRadialGradient)**:
     - Gradient Center: (cx, cy + h/4), radius 5 to (cx, cy), radius Math.max(w, h) * 1.5.
     - **Normal State**: Color stop 0: #7dd3fc (Light Sky Blue), Color stop 1: #0284c7 (Deep Ocean Blue).
     - **Stressed State (stressLevel > 50)**: Color stop 0: #f87171 (Light Coral), Color stop 1: #b91c1c (Dark Crimson).
     - **Suppressed State (suppressionLevel > 50)**: Color stop 0: #cbd5e1 (Pale Slate), Color stop 1: #64748b (Dark Slate).
  3. **Droplet Vector Contour**:
     - ctx.beginPath();
     - ctx.moveTo(cx, cy - h - 10); *(Pointy droplet apex)*
     - ctx.bezierCurveTo(cx + w + 5, cy - h/2, cx + w + 5, cy + h, cx, cy + h); *(Right droplet belly)*
     - ctx.bezierCurveTo(cx - w - 5, cy + h, cx - w - 5, cy - h/2, cx, cy - h - 10); *(Left droplet belly)*
     - ctx.fill();
  4. **Specular Reflection Highlight**:
     - ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
     - ctx.beginPath();
     - ctx.ellipse(cx - w/2.5, cy - h/4, w/4, h/3, Math.PI/6, 0, Math.PI * 2);
     - ctx.fill();
  5. **Dynamic Facial Expressions (Eyes)**:
     - **Normal Expression**:
       - Left & Right Eye Ellipses (#1e293b): ellipse(cx - 8, cy + 2, 3, 5, 0, 0, Math.PI*2) and ellipse(cx + 8, cy + 2, 3, 5, 0, 0, Math.PI*2).
       - Eye Sparkles (#ffffff): rc(cx - 8, cy - 1, 1.5, 0, Math.PI*2) and rc(cx + 8, cy - 1, 1.5, 0, Math.PI*2).
     - **Stressed Expression (>_< Angry Face)**:
       - Left eye lines: (cx - 12, cy - 2) -> (cx - 4, cy + 4) -> (cx - 12, cy + 8).
       - Right eye lines: (cx + 12, cy - 2) -> (cx + 4, cy + 4) -> (cx + 12, cy + 8).
       - Stroke: lineWidth = 3, strokeStyle = '#1e293b'.
     - **Suppressed Expression (@_@ Dizzy Face)**:
       - Circular dizzy pupils: rc(cx - 8, cy + 4, 3, 0, Math.PI*2) and rc(cx + 8, cy + 4, 3, 0, Math.PI*2).
  6. **Damage Visual Indicators**:
     - **Moderate Damage (hp <= 2)**: Render yellow rotated band-aid (#fcd34d with #f59e0b center padding) translated to (cx + 10, cy - 10) and rotated by $\pi/4$ (45°).
     - **Critical Damage (hp <= 1)**: Jagged red crack line (#991b1b, lineWidth = 2) drawn along (cx - 15, cy + 10) -> (cx - 5, cy + 5) -> (cx, cy + 15).

---

### 2.3 Enemy Vector Graphics & Behavior Specifications

All enemies are rendered using vector mathematics and path calls in src/game/Enemy.ts (Lines 169–308).

`	ext
Enemy Entity Type Hierarchy & Visual Representations
├── NORMAL (Type 0, #f97316 Orange)
│   ├── Head: roundRect(cx - w/2, cy - h/2, w, h/2 + 5, [10, 10, 0, 0])
│   ├── Tentacles: 3 animated vertical bars with sine oscillation (Math.sin(Date.now()/200 + i) * 5)
│   └── Eyes: 2 square black eyes (6x6)
│
├── ZIGZAG (Type 1, #eab308 Yellow)
│   ├── Body: 8-pointed rotating star polygon (alternating outer radius w/2 and inner radius w/4)
│   └── Movement: Sine-wave vertical oscillation (Math.sin(Date.now()/200 + x) * 2)
│
├── BOSS (Type 2, #dc2626 Dark Red, 150x100px)
│   ├── Body: Large rounded rectangle (roundRect, radius 15)
│   ├── Sockets: 2 large black circular eye sockets (r=15)
│   ├── Pupils: Glowing red inner pupils (#ef4444, r=5)
│   └── Mouth: 5 vertical black grille slots (10x20px)
│
├── SNIPER (Type 3, #a855f7 Purple)
│   ├── Body: Sleek inverted triangle/diamond path pointing downwards ((cx, cy + h/2) apex)
│   ├── Monocle: Inverted triangular visor line-art
│   └── Ballistics: High-speed directed bullet (speed=400, aimed via atan2 at player position)
│
├── DIVER (Type 4, #ef4444 Red)
│   ├── Body: Aerodynamic teardrop/missile Bezier path (pointing downwards)
│   ├── Engine: Animated yellow flame triangle at rear (#fbbf24) with randomized flicker
│   └── Suicide Dive: Triggers 15x dive speed when player is within |dx| < 20px; deals 20 crash damage to barricades
│
├── SHIELDED (Type 5, #64748b Slate)
│   ├── Body: Armored hexagon with intersecting cross seams (#334155)
│   └── Shield Aura: Outer cyan energy bubble (arc r=w/2+6) rendered when shieldHp > 0
│
└── SPLITTER (Type 6, #22c55e Green, 50x40px)
    ├── Body: Two overlapping toxic fluid circles (r=w/2.5) with black inner nuclei
    └── On Death: Spawns 2 mini-normal enemies (20x20px) drifting at ultra-slow speeds (speedX: ±10, speedY: 5)
`

#### Detailed Geometry Calls per Enemy Type:

1. **NORMAL Enemy (EnemyType.NORMAL)**:
   - **Color**: #f97316 (Orange)
   - **Dimensions**: w = 40, h = 30.
   - **Head Contour**: oundRect(cx - w/2, cy - h/2, w, h/2 + 5, [10, 10, 0, 0]).
   - **Tentacles Routine**:
     - const tW = w / 5; (8px width)
     - Loops i = 0, 1, 2: offset = Math.sin(Date.now() / 200 + i) * 5;
     - illRect(cx - w/2 + i * (tW * 2), cy, tW, h/2 + offset);
   - **Eyes**: illRect(cx - 10, cy - h/4, 6, 6) and illRect(cx + 4, cy - h/4, 6, 6) (#000000).

2. **SNIPER Enemy (EnemyType.SNIPER)**:
   - **Color**: #a855f7 (Purple)
   - **Dimensions**: w = 40, h = 30.
   - **Body Polygon**:
     - ctx.beginPath();
     - ctx.moveTo(cx, cy + h/2); *(Downward point)*
     - ctx.lineTo(cx + w/2, cy - h/2); *(Top right wing)*
     - ctx.lineTo(cx, cy - h/4); *(Top center notch)*
     - ctx.lineTo(cx - w/2, cy - h/2); *(Top left wing)*
     - ctx.closePath(); ctx.fill();
   - **Eye Sight**:
     - ctx.fillStyle = '#000000';
     - ctx.beginPath();
     - ctx.moveTo(cx - 10, cy - h/4 - 5); ctx.lineTo(cx + 10, cy - h/4 - 5); ctx.lineTo(cx, cy);
     - ctx.fill();

3. **DIVER Enemy (EnemyType.DIVER)**:
   - **Color**: #ef4444 (Vibrant Red)
   - **Dimensions**: w = 40, h = 30.
   - **Body Teardrop / Rocket Contour**:
     - ctx.beginPath();
     - ctx.moveTo(cx, cy + h/2);
     - ctx.bezierCurveTo(cx + w/2 + 10, cy, cx + w/2, cy - h/2, cx, cy - h/2);
     - ctx.bezierCurveTo(cx - w/2, cy - h/2, cx - w/2 - 10, cy, cx, cy + h/2);
     - ctx.fill();
   - **Thruster Plume**:
     - ctx.fillStyle = '#fbbf24';
     - ctx.beginPath();
     - ctx.moveTo(cx - 8, cy - h/2);
     - ctx.lineTo(cx, cy - h/2 - 15 - Math.random() * 10); *(Randomized exhaust spike)*
     - ctx.lineTo(cx + 8, cy - h/2);
     - ctx.fill();

4. **SPLITTER Enemy (EnemyType.SPLITTER)**:
   - **Color**: #22c55e (Toxic Green)
   - **Dimensions**: w = 50, h = 40.
   - **Body Circles**:
     - ctx.arc(cx - 6, cy, w/2.5, 0, Math.PI * 2);
     - ctx.arc(cx + 6, cy + 4, w/2.5, 0, Math.PI * 2);
     - ctx.fill();
   - **Pupils**:
     - ctx.fillStyle = '#000000';
     - ctx.arc(cx - 6, cy, 3, 0, Math.PI * 2);
     - ctx.arc(cx + 6, cy + 4, 3, 0, Math.PI * 2);

5. **BOSS Enemy (EnemyType.BOSS)**:
   - **Color**: #dc2626 (Dark Red)
   - **Dimensions**: w = 150, h = 100, HP: level * 10.
   - **Body**: oundRect(position.x, position.y, w, h, 15).
   - **Sockets**: rc(cx - w/4, cy - 10, 15, 0, Math.PI * 2) and rc(cx + w/4, cy - 10, 15, 0, Math.PI * 2) (#111827).
   - **Pupils**: rc(cx - w/4, cy - 10, 5, 0, Math.PI * 2) and rc(cx + w/4, cy - 10, 5, 0, Math.PI * 2) (#ef4444).
   - **Mouth Grille**: 5 bars of size 10x20 at (cx - 40 + i * 20, cy + 20) (#111827).

---

### 2.4 Wave Structure & Spawn Table Specifications

#### A. Wave Progression Rules (GameManager.spawnWave(), Lines 118–151)
1. **Boss Waves**:
   - Condition: level % 5 === 0 (Waves 5, 10, 15, 20, 25...).
   - Boss Spawn: Exactly 1 BOSS entity at (canvasWidth/2 - 100, 50).
   - HP Formula: HP = level * 10 (Wave 5 = 50 HP, Wave 10 = 100 HP).
   - Speed: speedX = 50 + level * 2.
2. **Standard Waves (level % 5 !== 0)**:
   - **Grid Rows**: ows = 3 + Math.floor(level / 4)
     - Waves 1–3: 3 rows
     - Waves 4–7: 4 rows
     - Waves 8–11: 5 rows
   - **Grid Columns**: cols = 6 + Math.floor(level / 3)
     - Waves 1–2: 6 columns (18 enemies)
     - Waves 3–4: 7 columns (21–28 enemies)
     - Waves 6–7: 8 columns (32 enemies)
   - **Grid Spacing**:
     - paddingX = 60px, paddingY = 50px.
     - Horizontal offset: offsetX = (canvasWidth - ((cols - 1) * paddingX)) / 2.
     - Cell coordinate (r, c): X = offsetX + c * paddingX, Y = 40 + r * paddingY.
3. **Special Enemy Spawn Eligibility & Spawn Rates**:
   - **Zigzag Spawn**: Deterministic on row 1 even columns ( === 1 && c % 2 === 0).
   - **Special Pool Selection** ([SNIPER, SHIELDED, DIVER, SPLITTER]):
     - Cap per wave: maxSpecials = Math.max(1, Math.min(1 + Math.floor(level / 2), 4))
       - Wave 1: Max 1 special enemy
       - Wave 2–3: Max 2 special enemies
       - Wave 4–5: Max 3 special enemies
       - Wave 6+: Max 4 special enemies
     - Probability: Slot evaluated with Math.random() > 0.85 (15% chance per slot until specialCount == maxSpecials).
     - Type Probability: Each special type has equal 25% weight (Math.floor(Math.random() * 4)).
   - **Normal Enemy Evasion**: 20% of Normal enemies are initialized with canEvade = true (Math.random() < 0.2). When an incoming player bullet is within  \in [0, 250]$ and $|dx| < \text{width} + 10$, the normal enemy reverses direction and speeds up by 1.5x for 1.5s.

#### B. Dynamic Difficulty Scaling & Wave Modifiers
- **Base HP per Standard Enemy**: hp = 1 + Math.floor(level / 3) (Wave 1–2: 1 HP, Wave 3–5: 2 HP, Wave 6–8: 3 HP).
- **Zigzag & Sniper HP**: hp = Math.max(1, (1 + Math.floor(level / 3)) - 1).
- **Enemy Collective Speed**:
  - speedMultiplier = Math.max(1.0, 1.0 + (20 - Math.min(20, enemies.length)) * 0.1).
  - As enemies are defeated from 20 down to 0, collective game speed increases from 1.0x to 3.0x.
- **Wave Rest & Interval**:
  - 3.0-second delay between wave completion and subsequent wave spawn (waveRestTimer = 3.0).

---

## 3. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | UI / Controls | ALLY(Q) Button | Bottom mobile touch control & Q key to summon friendly helpers | Touch/Click on ALLY(Q) button or Key q | Deducts 50💧, summons 1~3 Helper units (FIGHTER, REPAIRER, TANK) | Disabled/Ignored when currency < 50 | game-canvas.tsx:201-209, GameManager.ts:611-620 |
| 2 | UI / Controls | ULT(E) Skill (Heavy Rain) | Screen-clearing barrage of 30 piercing water bullets from ceiling | Touch/Click on ULT button or Key e/Shift | Resets ultimate gauge to 0%, spawns 30 piercing bullets (DMG: 10, Piercing: 3), shakes screen | Ignored when ultimateGauge < 100 | game-canvas.tsx:210-218, GameManager.ts:623-640 |
| 3 | UI / HUD | Top HUD Metric Bar | Displays localized Score, Pure Water currency, Wave number, HP dots, Combo, and Ultimate gauge | Engine state events | Formatted DOM elements floating above canvas | Language defaults to 'ko' if browser is not 'en' | game-canvas.tsx:156-185 |
| 4 | Rendering | Cute Water Droplet Player | Dynamic vector-rendered character with breathing, stretch, specular highlight, and state faces | Player position, 	imeAlive, stressLevel, suppressionLevel, hp | 2D Canvas Bézier curve droplet with dynamic radial gradient and expressions | Clamped to [0, canvasWidth - size.width] | Player.ts:120-240 |
| 5 | Rendering | Normal Enemy (Tentacles) | Orange octopus vector rendering with 3 sine-animated tentacles and square eyes | Game timestamp Date.now(), position | 2D Canvas rounded rect head + 3 dynamic tentacle bars | Falls back to illRect if ctx.roundRect missing | Enemy.ts:286-304 |
| 6 | Rendering | Sniper Enemy (Purple Triangle) | Sleek purple inverted triangle vector ship with triangular optical visor | Enemy position, dimensions | 2D Canvas 4-point inverted diamond polygon + black monocle | Clamped within canvas boundaries | Enemy.ts:216-232 |
| 7 | Rendering | Diver Enemy (Red Teardrop) | Red aerodynamic rocket teardrop with animated yellow flame plume | Enemy position, Math.random() | 2D Canvas Bezier teardrop + flickering triangular flame | None | Enemy.ts:232-245 |
| 8 | Rendering | Splitter Enemy (Green Dual Blob) | Green twin-cell toxic amoeba that divides on destruction | Enemy position, dimensions | 2D Canvas dual overlapping circles with nuclei | None | Enemy.ts:256-267 |
| 9 | Rendering | Boss Enemy (Red Mecha Skull) | Massive 150x100 dark red machine skull with glowing red pupils and mouth grille | Boss position, dimensions | 2D Canvas large rounded rect, glowing eye sockets, 5 mouth slots | None | Enemy.ts:190-215 |
| 10 | Mechanics | Diver Kamikaze Crash | Diver dives at 15x speed when aligned with player and explodes on barricades | Player X alignment ($|dx| < 20$) | isDiving = true, deals 20 crash damage to destructible barricade, explodes into 30 red particles | Disappears if hits bottom | Enemy.ts:78-88, GameManager.ts:454-460 |
| 11 | Mechanics | Barricade Degradation | Voxel-based (6x4 grid) destructible ice barricade with procedural block chipping | Bullet & Enemy damage | Chipped block array, blocks disappear proportionally to HP loss | HP capped at 20, stone barricades are indestructible | Barricade.ts:29-74 |
| 12 | Mechanics | Random Reinforcement Event | Random event every 10~20s triggering either Enemy raid or Ally squad | Delta time, random timers | Screen shakes, warning overlay flashes, spawns 4 Zigzags or 1~3 Helpers | Disabled during Wave Clear rest period | GameManager.ts:192-230 |
| 13 | Cheats / Dev | Debug & Cheats Hotkeys | F3 (Debug hitboxes/FPS), F4 (God Mode), F5 (+1000 💧) | Function keys F3, F4, F5 | Modifies isDebugMode, isGodMode, currency in real-time | None | GameManager.ts:657-662 |

---

## 4. Edge Cases & Specification Discrepancies Table

| # | Feature | Input / Condition | Observed Behavior & Code Finding | Discrepancy / Severity |
|---|---|---|---|---|
| 1 | **Sniper Bullet Interception** | Player bullet collides with Sniper bullet | Bullet.ts:7 has isInterceptable = true; and Enemy.ts:154 sets .isInterceptable = true;. However, in GameManager.ts:checkCollisions() (Lines 329–470), **there is no player bullet vs enemy bullet collision detection loop**. Player bullets pass straight through sniper bullets without intercepting them! | **Critical Functional Gap** vs Requirement R2 |
| 2 | **Sniper Bullet Glow Color** | Sniper bullet rendered on Canvas | In Bullet.ts:34, if (this.isInterceptable) { ctx.fillStyle = #a855f7; } is placed inside if (this.isPlayerBullet) branch. Since Sniper bullets have isPlayerBullet = false, they execute the else branch (Line 47) and render as standard red glowing orbs instead of purple! | **Visual Asset Discrepancy** |
| 3 | **Enemy Barricade Slowdown** | Normal/Zigzag enemy overlaps Barricade | GameManager.ts:462 sets enemy.isGnawing = true and deals 0.1 damage/frame. However, Enemy.ts:update() (Lines 74–139) does not check isGnawing or reduce speedX/speedY. Enemies continue their horizontal/vertical movement unchanged while gnawing. | **Mechanical Discrepancy** vs Requirement R2 (slow down when overlapping) |
| 4 | **Mobile Touch Left/Right Movement** | Touch screen play on mobile devices | game-canvas.tsx (Lines 198–231) renders touch buttons for ALLY(Q), ULT, and FIRE!, but **has no on-screen Left/Right touch/D-pad buttons**. Mobile movement relies on keyboard events ArrowLeft/ArrowRight//d. | **Mobile UX Limitation** |
| 5 | **Splitter Enemy Spawn Speed** | Splitter defeated at Wave 5+ | Splitter mini-enemies spawn at hardcoded speedX: 10, speedY: 5 (GameManager.ts:383-384). They ignore the current wave speed multiplier and drift extremely slowly. | **Matches Design Spec** (Working as intended) |
| 6 | **Enemy Bottom Line Breach** | Enemy reaches bottom of canvas (y > canvasHeight) | GameManager.ts:241-252: Instead of instant Game Over, player loses 1 HP, receives +20 Stress, and triggers 0.5s screen shake. Game Over triggers only if player.hp <= 0. | **Lenient Grace Mechanic** (Working as intended) |

---

## 5. Conclusion & Verification Summary

The SpaceInvader (Water Invader) codebase has been completely surveyed and reverse-engineered down to line numbers, pixel measurements, and mathematical formulas:
1. **UI & ALLY(Q)**: Fully mapped in game-canvas.tsx and GameManager.ts.
2. **Player Vector Rendering**: Vector Bezier path algorithm with 3 emotional states, reflection highlights, and physical degradation (band-aid and cracks) confirmed in Player.ts.
3. **Enemy Vector Graphics**: All 7 enemy types (NORMAL, ZIGZAG, BOSS, SNIPER, DIVER, SHIELDED, SPLITTER) verified with zero sprite bitmaps.
4. **Wave Progression & Spawns**: Mathematical formulas for grid dimensions, boss intervals (every 5th wave), and special enemy lottery documented.
5. **Key Discrepancy Noted**: Identified that Sniper bullet interception logic (isInterceptable) is missing its collision loop in GameManager.ts.

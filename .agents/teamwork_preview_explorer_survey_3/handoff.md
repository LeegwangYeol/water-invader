# Comprehensive Investigation & Survey Report: 3-Way Battle System, UI/HUD, Rendering, Audio, and Build Setup

**Author**: Survey Explorer 3  
**Target Project**: Water Invader (`LeegwangYeol/water-invader`)  
**Scope**: Game loop, state machine, canvas rendering, UI/HUD, build & test infrastructure, visual/audio assets, and 3-way battle architecture requirements.  
**Date**: 2026-08-26  

---

## 1. Observation

### 1.1 Project Structure & Build Infrastructure
- **Root Directory Layout**:
  - `package.json` (`/Users/a7111/src/water-invader/package.json`):
    - Framework: Next.js `16.3.1` (Turbopack, App Router)
    - UI: React `19.2.8`, Tailwind CSS `v4` (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`)
    - TypeScript: `^5`, `tsconfig.json` with strict mode enabled
    - Scripts defined:
      - `"dev": "next dev"`
      - `"build": "next build"`
      - `"start": "next start"`
      - `"lint": "eslint"`
      - *(Note: No explicit `"test"` script in `package.json`; Playwright is used via `npx playwright test`)*
  - `playwright.config.ts` (`/Users/a7111/src/water-invader/playwright.config.ts`):
    - Test runner: `@playwright/test ^1.62.1`
    - Target URL: `http://localhost:3000` with auto webServer spawn (`npm run dev`)
    - Viewport: `1280x900`
    - Reporter: `list`, `json (test-results.json)`, `html (playwright-report)`
  - Build & Typecheck Verification:
    - `npx tsc --noEmit`: Exited with code `0` (0 errors).
    - `npm run build`: Compiled successfully in `565ms`, static pages generated, exited with code `0`.
    - `npx playwright test tests/01_ui_and_controls.spec.ts`: 4/4 tests passed (6.0s).

### 1.2 Source Code Architecture (`src/`)
```
src/
├── app/
│   ├── layout.tsx         # Root HTML layout, font setup
│   ├── page.tsx           # Entry page mounting <GameCanvas />
│   ├── globals.css        # Tailwind 4 styles
│   └── manifest.ts        # PWA Web Manifest
├── components/
│   └── game-canvas.tsx    # React canvas container, UI overlays (HUD, Menu, Shop, Game Over), touch controls
└── game/
    ├── Entity.ts          # Base entity class with AABB collision math
    ├── GameManager.ts     # Central game loop (requestAnimationFrame), state machine, collision coordinator, upgrade logic
    ├── Player.ts          # Player ship droplet, movement, multi-shot patterns, stress & suppression mechanics
    ├── Enemy.ts           # 7 enemy types (NORMAL, ZIGZAG, BOSS, SNIPER, DIVER, SHIELDED, SPLITTER)
    ├── Bullet.ts          # Projectiles (damage, piercing, interception, hit tracking)
    ├── Barricade.ts       # 6x4 voxel destructible ice & indestructible stone barricades
    ├── Helper.ts          # Player allies (FIGHTER, REPAIRER, TANK)
    ├── Particle.ts        # Particle effects system with object pooling
    ├── SoundManager.ts    # Web Audio API synthesizers (shoot, hit, explosion, victory, gameover)
    └── types.ts           # Shared interfaces (Vector2D, Size, Rect, GameState)
```

### 1.3 Detailed Component Observations

#### A. Game Loop & State Management (`GameManager.ts` & `types.ts`)
- **Game States** (`src/game/types.ts:18-23`):
  ```typescript
  export enum GameState {
    MENU = 'MENU',
    PLAYING = 'PLAYING',
    GAME_OVER = 'GAME_OVER',
    SHOP = 'SHOP'
  }
  ```
- **Loop Lifecycle** (`src/game/GameManager.ts:237-256`):
  - Driven by `requestAnimationFrame(this.loop)` using high-resolution timestamps (`performance.now()`).
  - Calculates `deltaTime = Math.max(0, (timestamp - this.lastTime) / 1000)` and clamps to `0.1s` max to prevent lag jumps.
  - Updates player, enemies, helpers, bullets, barricades, screen shake, and particles.
  - Cleans up dead entities with array filtering and object pooling for particles (`particlePool`).
  - Transitions to `GameState.SHOP` when `enemies.length === 0 && warningTimer <= 0` (`GameManager.ts:424-428`).

#### B. Canvas Rendering & Logical Coordinates (`GameManager.ts:52-55, 754-858`)
- Canvas has fixed logical dimensions: `logicalWidth = 600`, `logicalHeight = 800`.
- Supports device pixel ratio (DPR) scaling: `canvas.width = 600 * dpr`, `canvas.height = 800 * dpr`, with `ctx.scale(dpr, dpr)`.
- Renders:
  - Deep slate background (`#0f172a`) with 30 procedural rising water bubbles (`GameManager.ts:774-784`).
  - Screen shake translation (`GameManager.ts:759-768`).
  - Barricades, player, allies/helpers, enemies, bullets, particles.
  - Boss HP Bar at `y = 28` (`GameManager.ts:688-752`) with health gradient and frame.
  - Fullscreen flashing alert overlay when `warningTimer > 0` (`GameManager.ts:828-842`).
  - Debug hitboxes (magenta rectangles) and telemetry metrics when `isDebugMode` is toggled (`F3`).

#### C. React UI / HUD Elements (`game-canvas.tsx`)
- **Top HUD** (`game-canvas.tsx:413-451`):
  - Left: Score (`Score: {score}`), Pure Water Currency (`Pure Water: {currency} 💧`), Wave badge (`WAVE {wave}`).
  - Right: Player HP icons (5 rounded dots, blue when active, grey when lost), Sound/Mute button (`🔊 SOUND` / `🔇 MUTE`), Combo multiplier (`{combo}x COMBO!`), Ultimate Gauge bar (0-100%, pulsing yellow-to-red gradient when ready).
- **Mobile Controls** (`game-canvas.tsx:467-501`):
  - Touch buttons for `ALLY(Q)`, `ULT(E)`, and large `FIRE!` button.
  - Canvas pointer event drag-and-aim system (`onPointerDown`, `onPointerMove`, `onPointerUp`) with logical coordinate scaling (`game-canvas.tsx:279-395`).
- **Modal Overlays**:
  - `MENU` (`game-canvas.tsx:504-538`): Title, High Score, Start Game, How to Play, Install App (PWA).
  - `HOW TO PLAY` (`game-canvas.tsx:541-585`): Instructions for controls, game mechanics, and cheats (`F3`, `F4`, `F5`).
  - `SHOP` (`game-canvas.tsx:587-607`): Wave Cleared title, upgrade panel for Fire Rate (50💧), Multi-Shot (100💧), Piercing (200💧), and "NEXT WAVE" button.
  - `GAME_OVER` (`game-canvas.tsx:609-633`): Game Over reason, final score, upgrade panel, "PLAY AGAIN" button.

#### D. Existing Faction Architecture (Two-Sided Hardcoded)
- Currently, entities lack an explicit faction tag:
  - `Bullet` has a boolean `isPlayerBullet: boolean` (`Bullet.ts:5`).
  - In `GameManager.checkCollisions()`:
    - If `bullet.isPlayerBullet === true`: Checks collision against `this.enemies` (`GameManager.ts:494-558`) and intercepts enemy bullets (`GameManager.ts:476-491`).
    - If `bullet.isPlayerBullet === false`: Checks collision against `this.helpers` and `this.player` (`GameManager.ts:560-614`).
  - `Enemy` entities only track and shoot towards `this.player.position` (`Enemy.ts:192-218`).
  - `Helper` entities only track and shoot towards `this.enemies` (`Helper.ts:65-87`).

#### E. Audio Synthesis (`SoundManager.ts`)
- Pure Web Audio API procedural synthesis with zero external audio assets:
  - `playShoot()`: Square wave pitch sweep (880Hz -> 110Hz).
  - `playExplosion()`: Low sawtooth rumble (100Hz -> 10Hz).
  - `playPowerUp()`: Tri-tone sine chord (440Hz -> 554Hz -> 659Hz).
  - `playPlayerHit()`: Sawtooth crunch (180Hz -> 40Hz).
  - `playEnemyHit()`: Triangle pop (600Hz -> 200Hz).
  - `playShieldBreak()`: High square screech (1400Hz -> 300Hz).
  - `playVictory()`: C5-E5-G5-C6 major arpeggio.
  - `playGameOver()`: Descending minor arpeggio.

---

## 2. Logic Chain

### 2.1 The Need for a Formal Multi-Faction Engine
1. **Observation**: Currently, collision and targeting logic are hardcoded to two opposing sides via `isPlayerBullet: boolean` and direct references (`this.player`, `this.enemies`).
2. **Inference**: Introducing a 3rd faction (Rogue/Oil/Cyber Invaders) that is hostile to *both* the player and the original Invaders requires a generalized entity and bullet faction model.
3. **Design**:
   - Introduce `export enum Faction { PLAYER = 'PLAYER', INVADER = 'INVADER', ROGUE = 'ROGUE' }` in `types.ts`.
   - Assign `public faction: Faction` on `Entity`, `Enemy`, `Helper`, and `Bullet`.
   - For backwards compatibility with existing test suites, keep getter: `get isPlayerBullet(): boolean { return this.faction === Faction.PLAYER; }`.
   - Update `checkCollisions()` so any bullet of `Faction A` damages any entity of `Faction B` whenever `A !== B`.
   - When a `ROGUE` bullet hits an `INVADER` or vice-versa, deal damage, trigger crossfire hit effects, and reward the player or increment the battlefield dynamic score.

### 2.2 UI/HUD and Faction Awareness
1. **Observation**: The current HUD only displays `Score`, `Pure Water`, and `WAVE X`. It does not convey the composition of forces or threat levels when multiple factions are engaged.
2. **Inference**: A true 3-way battle must visually communicate the status and danger level of all active combatants so the player can formulate tactical decisions (e.g. letting Invaders and Rogues weaken each other).
3. **Required UI/HUD Additions**:
   - **Multi-Faction Threat Bar / Badges**:
     - Faction 1: Player & Allies (Pure Water 💧, Cyan `#38bdf8`)
     - Faction 2: Toxic Invaders (👾 Invaders count, Orange/Red `#f97316`)
     - Faction 3: Rogue Oil/Cyber Raiders (⚡ Rogues count, Neon Lime/Amber `#84cc16` / `#f59e0b`)
   - **Crossfire / 3-Way Battle Alerts**:
     - Enhance the fullscreen warning banner (`GameManager.ts:828-842`):
       - Red: `WARNING! ENEMY REINFORCEMENTS!`
       - Green: `ALLY SUPPORT INCOMING!`
       - Amber/Lime Flash: `⚠️ THIRD FACTION INCURSION! ROGUE FORCES DETECTED!`
       - Purple/Multi-color Pulse: `⚔️ 3-WAY CROSSFIRE ENGAGED!`
   - **Manual Modal Update**:
     - Update `HOW TO PLAY` modal in `game-canvas.tsx:541-585` to explain the 3rd faction mechanics and crossfire tactics.

### 2.3 Visual Design for the Third Faction
1. **Observation**: Each existing entity has a distinct procedural vector silhouette and color palette:
   - Player: Blue Cute Droplet (`#3b82f6` gradient) with animated eyes and HP degradation.
   - Normal Invader: Orange Octopus Blob (`#f97316`).
   - Boss: Crimson Bio-Mech Skull (`#dc2626`).
   - Sniper: Purple Sleek Diamond (`#a855f7`).
   - Diver: Red Rocket Teardrop with flame (`#ef4444`).
   - Shielded: Slate Hexagon with glowing blue shield (`#64748b` + `#38bdf8`).
   - Splitter: Green Overlapping Toxic Bubbles (`#22c55e`).
2. **Design for 3rd Faction (Rogue / Petroleum / Cyber Swarm)**:
   - **Color Theme**: Neon Lime (`#84cc16`, `#a3e635`) and Industrial Charcoal (`#1e293b`) with Gold/Amber accents (`#f59e0b`).
   - **Rogue Units**:
     - *Rogue Drone / Stalker*: Fast delta-wing drone with dual rotary thrusters and neon-green optical visor.
     - *Rogue Heavy Bruiser / Corrosive Mech*: Spiked diamond armor with pulsating amber plasma engine.
     - *Rogue Interceptor*: Agile darting scout with lateral laser cannons.
   - **Rogue Bullets**:
     - Neon Lime / Electric Amber diamond plasma bolts (`#84cc16` outer glow, `#fef08a` inner core).
   - **Rogue Particles**:
     - Dark oil droplets and lime-green electrical sparks on hit/destruction.

### 2.4 Audio Enhancements (`SoundManager.ts`)
1. **Observation**: Sound synthesis currently supports standard 2-player events.
2. **Enhancement**:
   - Add `playThirdFactionWarning()`: Dual oscillating frequency modulation (300Hz <-> 480Hz siren warble).
   - Add `playRogueShoot()`: High-tech laser chirping sound (1200Hz exponential ramp to 400Hz).
   - Add `playCrossfireHit()`: Metallic clashing resonance (sawtooth + triangle blend at 750Hz).

### 2.5 Dynamic & Unpredictable Reinforcement Spawning
1. **Observation**: Currently, wave spawning is a rigid rectangular grid (`cols x rows` calculated from level), and reinforcements occur on a single timer that only spawns 4 Zigzag enemies or 1-3 allies.
2. **Inference**: To fulfill Requirement 2 of the original request, spawning must become dynamic, organic, and tension-driven.
3. **Design**:
   - **Dynamic Formation Director**:
     - Instead of static grids only, support dynamic deployment archetypes:
       - *V-Formation Incursion* (Spearhead diving squads)
       - *Flank Ambush* (Enemies entering from left and right boundaries)
       - *3-Way Clash* (Invaders descending from top-left while Rogue Drones warp in from top-right)
       - *Mid-Wave Chaotic Airdrop* (Spawning independent 3rd faction raiders mid-combat)
   - **Tension & Pacing Controller**:
     - Spawns adapt dynamically to the player's survival rate, combo streak, and battlefield unit density.
     - Hostile entities will fight each other if in proximity or line of sight, creating an emergent living warzone.
   - **Wave Completion Criteria**:
     - A wave is cleared only when all hostile units (both `INVADER` and `ROGUE`) are eliminated.

---

## 3. Caveats

1. **No Source Code Modifications Made**:
   - In accordance with read-only investigation scope boundaries, no source code in `src/` or `tests/` was altered during this survey.
2. **Lint Errors in Existing Test Files**:
   - `npm run lint` currently reports `@typescript-eslint/no-explicit-any` on legacy test files (`tests/stress/` and `tests/benchmark/`).
   - However, `npx tsc --noEmit` and `npm run build` pass cleanly with 0 errors.
   - Any new code and tests must be strictly typed and adhere to Next.js 16/React 19 conventions.
3. **Playwright Test Environment**:
   - Playwright requires the Next.js dev server or build server to be available. In local runs, `playwright.config.ts` automatically manages `npm run dev` on port 3000.
   - Bot heuristics in `tests/stress/swarm_bot_engine.ts` expect `window.gameManager` to expose standard arrays (`enemies`, `bullets`, `helpers`, `barricades`). Maintaining these property names and arrays is critical for regression-free test compatibility.

---

## 4. Conclusion & Actionable Blueprint

### 4.1 Required Changes Summary Matrix

| Domain | File(s) | Proposed Changes |
|---|---|---|
| **Data Types & Enums** | `src/game/types.ts` | Add `Faction` enum (`PLAYER`, `INVADER`, `ROGUE`). Add dynamic reinforcement event types. |
| **Base Entity & Projectiles** | `src/game/Entity.ts`, `src/game/Bullet.ts` | Add `faction` field. Add `isPlayerBullet` getter for compatibility. Update bullet vector styles for Rogue faction. |
| **3rd Faction Entities** | `src/game/Enemy.ts` or new `src/game/RogueEnemy.ts` | Implement Rogue unit archetypes (Rogue Drone, Stalker, Heavy Mech) with AI that targets both Player and Invaders. Procedural vector rendering in neon lime/amber. |
| **Combat & Collision Core** | `src/game/GameManager.ts` | Overhaul `checkCollisions()` to resolve multi-faction projectile & body collisions (Invader vs Rogue, Player vs Rogue, Rogue vs Helper). Implement 3-way crossfire scoring and dynamic speed scaling. |
| **Dynamic Reinforcement Engine** | `src/game/GameManager.ts` | Replace static 4-zigzag timer with Dynamic Wave & Event Director (Flank drops, Rogue incursions, Chaotic 3-way clashes, Airdrop reinforcements). |
| **HUD & Visual Indicators** | `src/components/game-canvas.tsx`, `GameManager.ts` | Add multi-faction threat indicators (Invaders remaining vs Rogues remaining). Add Rogue incursion alert banner and 3-way battle visual alerts. Update How To Play modal. |
| **Audio Synthesizer** | `src/game/SoundManager.ts` | Add Web Audio synthesis methods: `playThirdFactionWarning()`, `playRogueShoot()`, `playCrossfireHit()`. |

---

## 5. Verification Method

To independently verify the implementation and ensure zero regressions:

1. **Static Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   *Pass criteria*: Exits with code `0` and 0 errors.

2. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   *Pass criteria*: Turbopack compiles all pages and static routes cleanly.

3. **Core Playwright Verification Suite**:
   ```bash
   npx playwright test tests/01_ui_and_controls.spec.ts
   npx playwright test tests/02_rendering_and_vector_art.spec.ts
   npx playwright test tests/03_game_mechanics.spec.ts
   npx playwright test tests/04_multiwave_progression.spec.ts
   ```

4. **New 3-Way Battle Dedicated Test Suite**:
   - Create `tests/05_three_way_battle.spec.ts` validating:
     - 3rd faction entity spawning and distinct vector graphics.
     - Crossfire collision resolution: Rogue bullets destroy Invaders and Invader bullets destroy Rogues.
     - Dynamic reinforcement spawning triggers with unpredictable compositions.
     - Multi-faction HUD badges and alert banners render accurately.
     - Wave clear occurs only after all hostile factions are eliminated.

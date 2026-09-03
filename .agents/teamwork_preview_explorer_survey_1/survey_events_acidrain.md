# Comprehensive Codebase Survey: Environmental Events, Acid Rain, & Counterplay Architecture

**Date**: 2026-09-02  
**Author**: `teamwork_preview_explorer_survey_1`  
**Workspace**: `/Users/user/src/water-invader`  

---

## 1. Executive Summary

This survey maps the architectural foundations of **Water Invader** for:
1. **Environmental Events & Emergency Crises**: Event scheduling, warning timers, duration handling, and active hazard generation.
2. **Acid Rain Mechanics**: Projectile generation math, velocity vectors, collision detection against player and barricades, damage calculations, and audio-visual feedback.
3. **Player Damage Mitigation & Economy**: Current health, i-frames, shop upgrades, skill activations, and preservation across game states.
4. **Architectural Blueprints for Acid Rain Counterplay (R1)**, **Background Visibility (R2)**, **Crisis Expansion (R3)**, and **Pre-Game Shop Integration (R4)**.

---

## 2. Environmental Events System

### 2.1 Event Scheduling & Trigger Lifecycle

Environmental and crisis events are managed within `src/game/GameManager.ts` across distinct lifecycle states:

```
[Level >= 10 Loop] ---> [crisisTimer Elapses (16-24s)]
                                |
                                v
                   [triggerCrisis(type?: CrisisType)]
                                |
                                v
               [Warning Phase: warningTimer = 2.0s]
         (Banner rendered, siren audio, screen shake 1.0)
                                |
                                v
           [Active Phase: activateCrisisEffect(type)]
        (ACID_STORM: duration = 10.0s, hazard generation)
                                |
                                v
    [Completion / Cleanup: timer <= 0 & remainingHostiles == 0]
                   (Transition to GameState.SHOP)
```

#### Code Locations:
- **State Initialization (`src/game/GameManager.ts:48-59, 176-189`)**:
  - `crisisState: CrisisState`: Tracks `activeCrisis`, `timer`, `duration`, `warningTimer`, `bannerText`, `hazardProjectiles`, `empSuppressionActive`, `empTimer`.
  - `crisisTimer: number = 6.0`: Interval timer initialized to 6.0s on wave start.
- **Trigger Condition (`src/game/GameManager.ts:831-837`)**:
  ```ts
  } else if (this.level >= 10) {
    this.crisisTimer -= deltaTime;
    if (this.crisisTimer <= 0 && this.enemies.length > 0 && this.warningTimer <= 0 && this.pendingReinforcement === null) {
      this.triggerCrisis();
      this.crisisTimer = 16.0 + Math.random() * 8.0;
    }
  }
  ```
- **Trigger Function (`src/game/GameManager.ts:458-505`)**:
  - Selects crisis among `['TITAN_HORDE', 'ACID_STORM', 'SWARM_BLITZ', 'EMP_DISRUPTION', 'TOTAL_WAR']`.
  - Sets `duration = 10.0s` for `ACID_STORM`.
  - Sets `warningTimer = 2.0s`, `bannerText = 'EMERGENCY CRISIS: TOXIC ACID STORM HAZARD!'`.
  - Dispatches React notification via `this.onCrisisEvent({ ...this.crisisState })`.

### 2.2 Crisis Types & Current Implementations

| Crisis Type | Duration | Spawns / Effects | Sound Trigger |
| :--- | :--- | :--- | :--- |
| **`TITAN_HORDE`** | 10.0s | Boss (250+ HP) + 4 Shielded + 4 Divers (`GameManager.ts:508-526`) | `playThirdFactionWarning` |
| **`ACID_STORM`** | 10.0s | Continuous falling toxic projectiles across screen (`GameManager.ts:527-532, 807-823`) | `playAcidStormSound` |
| **`SWARM_BLITZ`** | 8.0s | 8 high-speed pincer Divers + 3 center Zigzags (`GameManager.ts:533-546`) | `playCrisisAlarm` |
| **`EMP_DISRUPTION`** | 3.5s | 2.5s player weapon lock (`suppressionLevel = 100`) + 2 Snipers + 2 Stalkers (`GameManager.ts:547-561`) | `playEmpDisruptionSound` |
| **`TOTAL_WAR`** | 12.0s | 11 Invaders (left) vs 11 Rogues (right) chaotic crossfire clash (`GameManager.ts:562-600`) | `playThirdFactionWarning` |
| **`End-Game Crisis`** (Stage 15+) | Multi-Phase | 3 Archetypes (`VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`) with 2 Dimensional Rifts (`src/game/crisis/EndGameCrisis.ts`) | `playCrisisCataclysmSiren` |

---

## 3. Acid Rain Implementation Details

### 3.1 Projectile Generation & Physics

During `crisisState.activeCrisis === 'ACID_STORM'` and once `warningTimer <= 0`:

```ts
// src/game/GameManager.ts:806-823
if (this.crisisState.activeCrisis === 'ACID_STORM') {
  if (Math.random() < 0.4) { // 40% chance per frame (approx 24 rolls/sec at 60 FPS)
    const count = 1 + Math.floor(Math.random() * 2); // 1 to 2 droplets
    for (let k = 0; k < count; k++) {
      const hz: HazardProjectile = {
        x: 20 + Math.random() * (this.logicalWidth - 40), // X in [20, 560]
        y: -15,                                           // Spawns above viewport
        radius: 5 + Math.random() * 4,                    // Radius 5-9px
        speedY: 220 + Math.random() * 120,                // Downward speed 220-340 px/s
        speedX: (Math.random() - 0.5) * 40,               // Drift speed ±20 px/s
        damage: 1,
        color: '#a3e635'                                  // Neon lime-green
      };
      this.hazardProjectiles.push(hz);
    }
  }
}
```

### 3.2 Collision Detection & Damage Resolution

In `src/game/GameManager.ts:839-895`:

1. **Player Collision**:
   - Condition: `player && !isGodMode && player.invincibilityTimer <= 0`.
   - Hitbox check: AABB overlap between player (`px, py, pw=50, ph=40`) and hazard circle (`hz.x ± radius, hz.y ± radius`).
   - Damage: `player.hp -= hz.damage` (1 damage).
   - Effects:
     - `hz.isDead = true`
     - `player.hitFlashTimer = 0.08`
     - `player.invincibilityTimer = 1.0` (1 second i-frames)
     - Audio: `soundManager.playPlayerHit()` and `soundManager.playAcidStormSound()`
     - Particle Explosion: `createExplosion(hz.x, hz.y, '#84cc16', 15)`
     - Camera: `triggerScreenShake(0.3)`
     - UI Notification: `if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp)`
     - Game Over condition: `if (this.player.hp <= 0) this.gameOver("정수기가 산성 폭풍에 부식되었습니다. (체력 소진)")`
2. **Barricade Collision**:
   - Condition: Hazard coordinates inside barricade box.
   - Effect: If `b.type === BarricadeType.DESTRUCTIBLE`, `b.hp -= 2` (destructible barricade takes 2 damage per raindrop); Indestructible barricades absorb raindrops with 0 damage.
   - `createExplosion(hz.x, hz.y, '#a3e635', 6)`, `hz.isDead = true`.

### 3.3 Visuals & Rendering

- **Canvas Rendering (`src/game/GameManager.ts:1572-1589`)**:
  - Draws outer lime circle (`#a3e635`) and inner white sizzle core (`radius * 0.4`).
- **UI Badge Overlay (`src/components/game-canvas.tsx:973-981`)**:
  - Rendered when `activeCrisis === 'ACID_STORM'` and `warningTimer <= 0`:
    ```tsx
    <div data-testid="acid-storm-badge" className="... bg-lime-950/90 border border-lime-400 text-lime-300 ...">
      <span>☣️</span> TOXIC ACID STORM ACTIVE <span>☣️</span>
    </div>
    ```

---

## 4. Player Damage Mitigation, Items, & State Management

### 4.1 Player State & Stats (`src/game/Player.ts`)
- **Health**: `hp: number = 3`, `maxHp: number = 5`.
- **Combat Stats**:
  - `baseFireRate: number = 0.5` (seconds between shots, upgradable to 0.1s / Lv. 5).
  - `multiShot: number = 1` (1 to 5 projectiles).
  - `piercing: number = 1` (penetration count 1 to 5).
  - `ultimateGauge: number = 0` (0 to 100%, triggers `Heavy Rain` via E/Shift).
- **Dynamic Status**:
  - `invincibilityTimer: number = 0` (1.0s i-frames on damage).
  - `hitFlashTimer: number = 0` (white flash on damage).
  - `suppressionLevel: number = 0` (bullet spread penalty).
  - `stressLevel: number = 0` (fire rate acceleration under threat).

### 4.2 Economy & Shop Upgrade System
- **Currency**: `currency` (Pure Water 💧).
- **Shop Actions (`src/game/GameManager.ts:1759-1788`)**:
  - `upgradeFireRate()`: 50 💧 per level (Lv 1 -> 5).
  - `upgradeMultiShot()`: 100 💧 per level (Lv 1 -> 5).
  - `upgradePiercing()`: 200 💧 per level (Lv 1 -> 5).
  - `repairTank()`: 75 💧 for +1 HP (up to 5 HP).
- **Active Combat Abilities**:
  - `triggerSummonAlly()`: 50 💧 (Q key). Spawns Friendly Helper Drone.
  - `triggerUltimate()`: 100% Ultimate Gauge (E/Shift key). Triggers Heavy Rain barrage.

### 4.3 Key Architectural Trap Identified for Pre-Game Shop (R4)
In `GameManager.init()` (`src/game/GameManager.ts:136-150`):
```ts
public init(resetScoreAndCash: boolean = false) {
  if (!this.player) {
    this.player = new Player(this.logicalWidth, this.logicalHeight);
  } else {
    this.player.hp = 3;
    this.player.baseFireRate = 0.5;
    this.player.multiShot = 1;
    this.player.piercing = 1;
  }
  ...
```
🚨 **Critical Finding**: If a player buys upgrades in the Pre-Game Shop from the Main Menu, and then clicks `START GAME`, `gameManager.init()` is invoked, which currently resets `player.hp = 3`, `baseFireRate = 0.5`, `multiShot = 1`, `piercing = 1`!
👉 **Resolution Required**: `init()` must support preserving existing purchased upgrades/stats (e.g. `init(resetScoreAndCash, preserveUpgrades = true)` or only initializing if not already configured).

---

## 5. Potential Architectures for Acid Rain Counterplay (R1)

### Architecture Comparison

| Approach | Description | Pros | Cons / Considerations |
| :--- | :--- | :--- | :--- |
| **Option A: Deployable Safe Zone Canopy / Umbrella Dome** | Player can deploy or trigger an umbrella canopy barrier that covers an X-radius above the ship or follows the player, vaporizing hazard droplets on contact. | Highly tactical, engaging active gameplay, visually stunning umbrella/shield arc. | Requires keybind/mobile button or auto-activation during Acid Storm. |
| **Option B: Purchasable Shop Upgrade ("Acid Shield / Hydrophobic Membrane")** | An upgrade in Shop (Pre-Game & Wave Shop) that grants an energy barrier/membrane that neutralizes or absorbs Acid Storm droplets (e.g. 100% acid damage immunity or barrier charges). | Integrates seamlessly with Shop economy (R4), simple for automated testing, rewarding progression. | Purely passive if no visual feedback is added. |
| **Option C: Hybrid Shield & Visual Canopy (Recommended)** | **Purchasable Shop Upgrade ("Acid Shield / Nano-Umbrella", 100 💧)** + **Automatic Active Canopy Deployment**: When purchased, whenever an `ACID_STORM` is active, a luminous protective umbrella energy dome renders above the player ship, deflecting all falling `#a3e635` hazard projectiles with sparkling deflection particles and audio. | Combines economy progression, pre-game shop utility, immediate visual clarity, intuitive feedback, and robust testability. | Needs clear render layer in `Player.ts` or `GameManager.ts`. |

---

## 6. Projectile & Event Background Visibility (R2)

### Observations:
1. **Background Contrast**: During warnings and events, screen overlays use `rgba(132, 204, 22, 0.25)` or `rgba(255, 0, 0, 0.3)`. If the alpha is too high or color clashes with projectiles (e.g., lime green acid raindrops against green overlay or red invader bullets against red alert overlay), readability drops.
2. **Projectile Rendering**:
   - `Bullet.draw()`: Hostile bullets use standard `arc` fills with semi-transparent halos.
   - Hazard droplets (`GameManager.ts:1572-1589`): Rendered as `#a3e635` circles with white centers, lacking high-contrast dark outer borders.
3. **Recommendation**:
   - Add high-contrast outer stroke (`#000000` / `#0f172a`, 1.5-2px) and intense luminous glow around all enemy projectiles and hazard drops.
   - Cap background warning overlay opacity to `<= 0.18` so contrast ratios exceed standard accessibility thresholds.

---

## 7. Crisis Variety Expansion (R3)

### Current Crises:
- Mid-game: `TITAN_HORDE`, `ACID_STORM`, `SWARM_BLITZ`, `EMP_DISRUPTION`, `TOTAL_WAR`.
- End-game: `VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`.

### Opportunities for New Distinct Mechanics:
- **New Mid-Game Crisis**:
  - **`SOLAR_FLARE` / `CORONAL_EJECTION`**: Sweeping vertical heat-beams from top with safe gap zones, forcing lateral dodging.
  - **`GRAVITATIONAL_SINGULARITY`**: Central micro-black hole pulling all bullets, players, and enemies toward center with orbital projectile curves.
  - **`NANO_SWARM_INFESTATION`**: Self-replicating splitter drones that multiply when hit unless destroyed with piercing weapons or ultimate.

---

## 8. Catalog of Relevant Files & Data Structures

| File Path | Key Data Structures / Functions | Responsibility |
| :--- | :--- | :--- |
| `src/game/types.ts` | `CrisisType`, `CrisisState`, `HazardProjectile`, `GameState` | Core data interfaces and enum declarations |
| `src/game/GameManager.ts` | `triggerCrisis()`, `activateCrisisEffect()`, `hazardProjectiles`, `draw()`, `upgrade*()` | Engine loop, hazard collision, crisis director, economy |
| `src/game/Player.ts` | `Player` class, `hp`, `invincibilityTimer`, `draw()`, fire patterns | Player entity, stats, visual status effects |
| `src/components/game-canvas.tsx` | `ShopUpgradePanel`, `MenuOverlay`, `ShopModal`, `TopHUD` | React UI, pre-game shop access, HUD badges, modal lifecycle |
| `src/game/SoundManager.ts` | `playAcidStormSound()`, `playCrisisAlarm()`, `playPlayerHit()` | Web Audio API procedural sound synthesizers |
| `src/game/crisis/EndGameCrisis.ts` | `EndGameCrisis`, `CrisisArchetype`, `CrisisPhase` | Stage 15+ multi-phase dimensional rift encounters |
| `src/game/Barricade.ts` | `Barricade`, `BarricadeType.DESTRUCTIBLE` / `INDESTRUCTIBLE` | Barricade obstruction and acid absorption |

---

## 9. Recommended Next Steps for Implementation Team

1. **R1 (Acid Rain Counterplay)**: Implement `hasAcidShield` / `acidShield` upgrade in `Player.ts` and `GameManager.ts`. In `GameManager.ts:848-872`, check `if (this.player.hasAcidShield)` -> deflect hazard projectile, trigger deflect particle and sound, take 0 damage.
2. **R2 (Background & Projectile Visibility)**: Enhance `Bullet.draw()` and `hazardProjectiles` drawing with high-contrast stroked outlines and vibrant multi-layer glow; tune warning overlay opacity.
3. **R3 (Crisis Variety)**: Introduce new distinct Crisis type (e.g. `SOLAR_FLARE` or `GRAVITATIONAL_SINGULARITY`) with unique hazard physics and HUD indicators.
4. **R4 (Pre-Game Shop Access)**: Add Shop button to `MenuOverlay`, allow opening `ShopUpgradePanel` before Wave 1, and ensure `GameManager.init()` preserves purchased upgrades.
5. **Testing**: Write comprehensive Playwright and unit test suites covering all 4 requirements.

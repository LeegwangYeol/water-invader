# Feature Proposal: Cryo-Freezing Mines & Ice-Shatter Combo System
**Domain**: Weaponry, Tactical Crowd Control & Elemental Combos  
**Author**: Specialist 1.3 (42-Agent Creative Brainstorming Swarm)  
**Target Project**: Water Invader (Next.js / TypeScript / Canvas 2D / Web Audio API)  
**Status**: Proposal & Architectural Specification (Ideation Mode — Zero Source Code Edits)  

---

## Executive Summary

The **Cryo-Freezing Mines & Ice-Shatter Combo System** introduces a high-skill, visually spectacular elemental gameplay loop to *Water Invader*. By deploying sub-aquatic cryo-depth charges, the player can flash-freeze encroaching swarms of aquatic invaders into brittle crystalline ice statues. 

Once frozen, an invader becomes vulnerable to an **Ice-Shatter Combo**: any direct impact from a player projectile (primary water spear, piercing bolt, or autonomous homing missile) triggers an acoustic-hydraulic resonance fracture, dealing massive critical damage and causing the enemy to violently shatter into high-velocity razor-sharp ice shrapnel. This shrapnel travels outward in an explosive radial pattern, slicing into neighboring invaders, applying frost debuffs, and sparking magnificent domino-effect **Chain-Reaction Shatter Cascades**.

This system solves late-game crowding, provides tactical counterplay against high-speed diving and rushing mobs (e.g. ZigZag invaders, Divers, Stage 10+ Aggression rushers), perfectly synergizes with existing upgrades (Piercing, Homing Missiles, Allied Bots), and requires zero external asset downloads through procedural Canvas 2D rendering and Web Audio synthesis.

---

## 1. Concept & Narrative Hook

### 1.1 Narrative & Thematic Integration
In the lore of *Water Invader*, the alien invader species is comprised of dense, super-saline cephalopod and crustacean bio-forms suspended within pressurized oceanic water. Water is their protective shield and offensive medium. 

The **Cryo-Subzero Depth Mine** (*극저온 심해 지뢰*) is humanity’s countermeasure: a deployable ordnance that induces an instantaneous, endothermic phase transition. Upon proximity trigger, the mine absorbs all thermal energy within a localized hydrostatic volume, flash-freezing the target invader’s liquid cytoplasm and external hydro-carapace into solid, amorphous ice.

### 1.2 The Core Fantasy: From Threat to Brittle Glass
- **Moment of Control**: A terrifying swarm of aggressive Divers or Rogue Mechs diving towards the barricades is instantly arrested in mid-motion, frozen into gleaming, translucent azure sculptures.
- **The Payoff (The Shatter)**: Rather than merely dealing passive damage over time, the frozen state acts as a damage amplifier and explosive primer. Firing a shot into the frozen monolith creates a resounding *CRACK-SHATTER*, obliterating the target in a shower of glittering diamond shards that annihilate adjacent enemies.
- **Tactical Flow**:
  1. *Trap Placement*: Deploy mines along choke points, in front of damaged barricades, or behind advancing swarms.
  2. *Flash Freeze*: Enemies trip the proximity sensor; a blinding flash of cryo-mist locks them in place.
  3. *Combo Detonation*: Switch to precision fire or let Homing Missiles slam into the frozen core to detonate the entire cluster.

---

## 2. Mechanics & Mathematical Modeling

### 2.1 Mine Deployment & Arming Mechanics
Mines are deployed from the player’s vessel via a dedicated secondary weapon key (e.g., `Shift`, `E`, `Right-Click`, or an onscreen Virtual Mine Deploy Button on mobile).

| Parameter | Value | Description |
|---|---|---|
| **Deploy Initial Velocity ($V_y$)** | $-120\text{ px/s}$ | Ejected upward into the water column ahead of the player |
| **Water Drag Friction ($\mu_d$)** | $0.88\text{ per frame}$ | Mine decelerates to a gentle stationary hover within $0.4\text{s}$ |
| **Arming Delay ($t_{\text{arm}}$)** | $0.45\text{ seconds}$ | Blinks amber while calibrating; turns glowing cyan upon arming |
| **Proximity Detection Radius ($R_{\text{det}}$)** | $42\text{ px}$ | Spherical trigger radius around mine center |
| **Cryo-Blast Radius ($R_{\text{blast}}$)** | $120\text{ px}$ (Base) $\to 160\text{ px}$ (Max) | Full AoE shockwave expansion radius |
| **Max Active Mines** | $3$ (Base) $\to 5$ (Max Upgrade) | Hard cap on simultaneous mines to prevent spam |
| **Mine Lifetime ($t_{\text{life}}$)** | $18.0\text{ seconds}$ | Auto-detonates with minor frost pulse if untouched |

```
       [Enemies Moving Down]
              ↓↓↓
       ╭───────────────╮
       │   R_blast     │
       │    (120px)    │
       │   ╭───────╮   │
       │   │ R_det │   │
       │   │ (42px)│   │
       │   │   ●   │   │  <-- [Cryo-Mine Arming / Hovering]
       │   ╰───────╯   │
       ╰───────────────╯
              ↑↑↑
       [Player Ship y=740]
```

### 2.2 Frostbite Stacking & Phase State Machine
Every enemy entity receives two lightweight numerical properties:
- `frostStacks: number` (0 to 100)
- `freezeTimer: number` (seconds remaining in deep freeze)

```
  [Normal State] ──(Cryo Exposure)──> [Chilled State: 1-99 Stacks] ──(Hit 100 Stacks)──> [Deep Freeze State: 100 Stacks]
         ▲                                   │                                                    │
         │                                   ▼                                                    ▼
         └────────(Decay: 20 stacks/s)───────┴───────────────(Shatter Damage Impact)──────> [ICE-SHATTER EXPLOSION]
```

#### State 1: Chilled (1 to 99 Frost Stacks)
- **Movement Speed Penalty**:
  $$\text{SpeedMultiplier} = 1.0 - \left(\frac{\text{frostStacks}}{100} \times 0.60\right)$$
  *(At 80 stacks, enemy moves at $52\%$ base speed).*
- **Attack Delay Penalty**:
  Enemy `fireTimer` recovers at $50\%$ normal speed when stacks $> 50$.
- **Stack Decay**:
  If no cryo-effect is received for $1.5\text{s}$, stacks decay at a rate of $20\text{ stacks/second}$.

#### State 2: Deep Freeze (100 Frost Stacks Reached)
When `frostStacks >= 100`, the enemy transitions immediately into `DEEP_FREEZE`:
- **Absolute Immobilization**: Linear velocity ($V_x, V_y$) forced to $0$. All special maneuvers (Diving, Phase Dash, Zigzag oscillation) suspended.
- **Weapon Lockdown**: Enemies cannot fire bullets or charge lasers.
- **Freeze Duration Formula ($T_{\text{freeze}}$)**:
  $$T_{\text{freeze}} = \frac{T_{\text{base}}}{1 + \lambda_{\text{resist}} \times \max(0, \text{Wave} - 5)}$$
  - *Standard Invader (Normal, Zigzag, Diver)*: $T_{\text{base}} = 3.6\text{s}$, $\lambda_{\text{resist}} = 0.015$ ($\approx 3.0\text{s}$ at Wave 20).
  - *Mid-Tier Monsters (Rogue Mechs, Goliath, Phantoms)*: $T_{\text{base}} = 2.4\text{s}$, $\lambda_{\text{resist}} = 0.025$ ($\approx 1.8\text{s}$ at Wave 20).
  - *Bosses & Sovereigns*: $T_{\text{base}} = 1.4\text{s}$, $\lambda_{\text{resist}} = 0.040$ ($\approx 0.9\text{s}$ at Wave 20).

### 2.3 The Ice-Shatter Combo & Shrapnel Formula

When an enemy in `DEEP_FREEZE` is struck by any player projectile:

#### A. Shatter Damage Multiplier
Incoming damage is multiplied by the Shatter Factor ($M_{\text{shatter}}$):
$$D_{\text{inflicted}} = D_{\text{projectile}} \times M_{\text{shatter}}$$
$$M_{\text{shatter}} = 2.0 + (0.25 \times \text{UpgradeLevel})$$
*(At Base Level, a 1-damage water spear inflicts 2.0 damage; a Level 5 Homing Missile with 7 base damage inflicts $7 \times 2.0 = 14$ direct damage!).*

#### B. Catastrophic Shatter Condition
If $D_{\text{inflicted}} \ge \text{Remaining HP}$, the enemy suffers **Catastrophic Shatter Destruction**:
1. The enemy entity is immediately destroyed.
2. An Ice Shrapnel Cluster is generated at the entity’s centroid.
3. Shrapnel Count ($N_{\text{shards}}$):
   $$N_{\text{shards}} = \text{clamp}\left(6 + \lfloor \sqrt{\text{MaxHP}} \times 2.2 \rfloor, 8, 24\right)$$
   - *Normal Mob (HP 2)*: $8$ shards.
   - *Elite / Mid-Tier (HP 16)*: $14$ shards.
   - *Boss / Sovereign (HP 100+)*: $24$ shards.

#### C. Shrapnel Physics & Cascading AoE Damage
Each shard acts as a high-speed piercing crystalline projectile:
- **Shard Trajectory**: Dispersed uniformly across $360^\circ$ with random angular jitter ($\pm 12^\circ$):
  $$\theta_i = \left( \frac{2\pi \cdot i}{N_{\text{shards}}} \right) + \Delta \theta$$
- **Shard Velocity**: $420\text{ to } 580\text{ px/s}$.
- **Shard Lifetime**: $0.45\text{ seconds}$ (maximum range $\approx 220\text{ px}$).
- **Shard Damage**:
  $$D_{\text{shard}} = \max\left(1, \lfloor 1.5 + (\text{VictimMaxHP} \times 0.12) \rfloor\right)$$
- **Cascade Frost Stacks**: Each shard hit inflicts $+40\text{ Frost Stacks}$ on targets it pierces!
- **Chain-Reaction Cascade**:
  If a nearby chilled enemy (already at $\ge 60$ stacks) is hit by multiple shards, it reaches $100$ stacks and instantly freezes. If the shard damage kills it, it shatters immediately, producing another wave of shards! A single well-placed mine in a tight cluster triggers an avalanche of consecutive shatter bursts.

---

## 3. Player Decision Loop & Tactical Gameplay

### 3.1 Tactical Problem-Solving Matrix

```
┌───────────────────────────┬───────────────────────────────────┬──────────────────────────────────────────┐
│ Enemy Threat Situation    │ Conventional Response             │ Cryo-Mine & Ice-Shatter Combo Play       │
├───────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────┤
│ Fast Divers / Zigzags     │ Frantic dodging, erratic shooting │ Lay mine in retreat path; freeze diver,  │
│ rushing bottom canvas     │ often misses moving targets       │ shatter with 1 clean shot into flank     │
├───────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────┤
│ Saboteurs gnawing         │ Player must abandon cover to rush │ Mine placed beside barricade flash-      │
│ central barricades        │ into dangerous crossfire          │ freezes saboteur; buys bot repair time   │
├───────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────┤
│ Dense Shielded/Mech Horde │ High bullet sponge, bullets       │ Freeze front tank; single missile hits   │
│ advancing uniformly       │ blocked by front shields          │ it, shards shred unshielded backline     │
├───────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────┤
│ Boss / Crisis Sovereign   │ Prolonged bullet attrition        │ Mine freezes boss during attack windup;  │
│ bullet-hell attacks       │ while dodging screenful of bullets│ interrupts attack and yields 2.5x burst  │
└───────────────────────────┴───────────────────────────────────┴──────────────────────────────────────────┘
```

### 3.2 High-Skill Techniques (The Player Mastery Curve)
1. **The "Glacial Funnel"**: Luring fast zigzag mobs through narrow lanes between barricades where a mine sits armed.
2. **The "Domino Resonance"**: Deliberately weakening two adjacent mobs before freezing both, then shooting the center mob to create an overlapping twin-shatter cascade that clears the entire wave.
3. **The "Cryo-Shield Intercept"**: Freezing incoming interceptable enemy purple orbs. When the blast hits enemy bullets tagged as `isInterceptable`, the cryo-wave crystallizes them into harmless falling snow grains!

---

## 4. Visuals & Audio Specification

### 4.1 Visual Effects (Canvas 2D Procedural Shader System)
To guarantee high performance and avoid external image load latency, all visual elements are rendered using ultra-fast native Canvas 2D vector routines.

#### A. The Cryo-Mine Entity
- **Fuselage**: Concentric hexagonal buoy (`#0284c7` dark marine base with `#38bdf8` glacial cyan trim).
- **Core Pulsing Element**: Radial gradient glowing from `#ffffff` (center) to `#00f0ff` (outer edge), oscillating at $4\text{ Hz}$ ($I = 0.6 + 0.4 \sin(8t)$).
- **Proximity Sonar Ring**: Faint expanding cyan circle (`ctx.arc`, opacity cycling from $0.6 \to 0$, radius expanding from $10\text{px} \to 42\text{px}$).

#### B. Cryo-Detonation Wave
- Expanding dual-ring shockwave:
  - Inner Ring: Brilliant ice-white (`#ffffff`, line width $3.0\text{px}$, expanding to $R_{\text{blast}}$ in $0.2\text{s}$).
  - Outer Bloom: Glacial cyan (`#38bdf8`, line width $6.0\text{px}$, global alpha decaying from $0.8 \to 0$).
- Radial Needle Rays: 12 sharp crystalline lines projecting outward from detonation point, rotating slightly to simulate vortex cavitation.

#### C. Frozen Invader Shader Overlay
When an enemy is frozen, its standard render method is augmented with a crystalline overlay:
1. **Ice Block Shell**: Translucent rounded polygon engulfing the enemy sprite (`fillStyle = 'rgba(186, 230, 253, 0.45)'`, `strokeStyle = '#e0f2fe'`, `lineWidth = 2.0`).
2. **Procedural Crystal Facets**: 4 to 6 diagonal sharp angular polygon segments drawn across the body to simulate internal diamond fracture planes.
3. **Glacial Hoarfrost Glow**: Cyan rim lighting around sprite edges with high-contrast black contour (`2.0px stroke`) ensuring complete WCAG AAA contrast regardless of dynamic background biome.
4. **Subtle Shiver Animation**: In the final $0.5\text{s}$ of freeze duration, the ice sculpture shakes with rapid microscopic horizontal jitter ($\pm 1.5\text{px}$ at $30\text{Hz}$), signaling imminent thaw to the player!

```
       Frozen Invader Visual Anatomy (Canvas 2D):
              ┌─────────────────────┐
              │  /\  Ice Facet / \  │  <-- Jagged Diamond Spikes
              │ /  \__________/   \ │
              ││    [Enemy Body]   ││  <-- Desaturated Cyan Tint
              ││   /   /    \   \  ││  <-- Internal Fracture Lines
              │ \_/____/\____\_/__/ │
              └─────────────────────┘
              ▲ Shiver Jitter (t < 0.5s)
```

#### D. Ice-Shatter Shrapnel Particles
- Extended from `src/game/Particle.ts`:
- Shards are rendered as sharp elongated triangles:
  ```typescript
  ctx.beginPath();
  ctx.moveTo(shard.x + cos * len, shard.y + sin * len);
  ctx.lineTo(shard.x - sin * (width/2), shard.y + cos * (width/2));
  ctx.lineTo(shard.x + sin * (width/2), shard.y - cos * (width/2));
  ctx.closePath();
  ctx.fillStyle = '#bae6fd';
  ctx.fill();
  ```
- Fast rotation: each shard has an angular velocity $\omega = \pm (10 \text{ to } 25)\text{ rad/s}$.
- Particle Trail: Shards emit tiny trailing white sparkle dots that fade over $0.2\text{s}$.

### 4.2 Web Audio API Procedural Synthesis
Integrated directly into `SoundManager.ts` without needing `.mp3` or `.wav` assets:

#### 1. Mine Launch (`playCryoDeploy`)
- **Tone**: Pneumatic hiss followed by high-frequency water ping.
- **Synthesis**:
  - Oscillator 1 (Sine): $280\text{ Hz} \to 650\text{ Hz}$ linear pitch rise over $0.15\text{s}$.
  - Noise Node: Soft white noise filtered through a Highpass filter ($1200\text{ Hz}$), gain decaying exponentially from $0.12 \to 0.001$.

#### 2. Cryo-Flash Detonation (`playCryoFreeze`)
- **Tone**: Deep sub-bass implosion snap transitioning to an icy crystalline sheen.
- **Synthesis**:
  - Oscillator 1 (Sawtooth): $180\text{ Hz} \to 40\text{ Hz}$ rapid pitch drop over $0.2\text{s}$ (the kinetic shock).
  - Bandpass Filtered Noise: Center frequency swept from $3200\text{ Hz} \to 1800\text{ Hz}$ with high resonance ($Q = 7.0$), simulating sudden fluid crystallization.

#### 3. Ice-Shatter Destruction (`playIceShatter`)
- **Tone**: Massive resonant glass-shattering crack with glittering high-frequency harmonic trail.
- **Synthesis**:
  - Transient Click: Square wave pulse at $2.2\text{ kHz}$ decaying in $15\text{ms}$ (the initial acoustic fracture).
  - Crystal Cluster: 3 simultaneous sine oscillators tuned to non-harmonic glass ratios ($1320\text{ Hz}$, $2180\text{ Hz}$, $3450\text{ Hz}$) with individual exponential decay envelopes ($0.35\text{s}$).
  - Shrapnel Tinkle: Highpass filtered white noise ($4.5\text{ kHz}$) with rapid amplitude modulation ($18\text{ Hz}$ LFO) to mimic hundreds of ice chunks tumbling across the seabed.

---

## 5. UI Indicators & Mine Charge Display

### 5.1 Mine Charge HUD Gauge
Located seamlessly in the player’s combat HUD (lower canvas corner or integrated into the player ship's wing structure):

```
       [CRYO MINE HUD DISPLAY]
       ┌───────────────────────────────┐
       │ CRYO [■] [■] [▱]   2 / 3      │
       │ CD: [========----] (1.8s)     │
       │ KEY: [SHIFT] / [MINE BUTTON]  │
       └───────────────────────────────┘
```
- **Charge Pips**:
  - Filled Pip (`#38bdf8` cyan with white border): Ready for deployment.
  - Recharging Pip (`#1e293b` dark slate with animated filling sweep).
- **Cooldown Wheel**: Automatic charge regeneration (1 charge generated every $9.0\text{s}$, reduced to $6.0\text{s}$ with upgrades).

### 5.2 Mobile Virtual Control Integration
- On touch devices (`window.matchMedia('(pointer: coarse)').matches` or viewport width $< 768\text{px}$):
  - A dedicated **Virtual Cryo-Mine Button** is rendered on the bottom-right of the screen opposite the movement pad.
  - Button shows real-time radial cooldown fill and remaining charge number.
  - Large $56\text{px} \times 56\text{px}$ touch target compliant with mobile accessibility standards.

### 5.3 In-World Enemy Status Indicators
- **Frozen Countdown Ring**: A slender cyan countdown arc rendered above frozen enemies showing remaining freeze duration before thaw.
- **Frost Stack Diamond**: Above chilled enemies, a diamond icon fills from bottom to top with icy blue as stacks rise from $0 \to 100$.
- **Shatter-Ready Target Reticle**: When an enemy is in `DEEP_FREEZE`, four corner brackets (`#00f0ff`) frame its bounding box, instantly telegraphing to the player that this enemy is primed for a critical Ice-Shatter Combo!

---

## 6. Shop Progression, Synergies & Technical Feasibility

### 6.1 Shop Upgrade Tree

Integrated directly into the existing `Shop` state and accessible during Pre-Game, Post-Wave, and Pre-Continue shop phases:

| Tier | Item Name (KR / EN) | Cost | Effect |
|---|---|---|---|
| **1** | **Cryo-Mine Launcher**<br>*(극저온 지뢰 발사대)* | $250$ | Unlocks Cryo-Mine deployment. Max 2 charges. $9.0\text{s}$ recharge time. Base blast radius $120\text{px}$. |
| **2** | **Subzero Thermal Core**<br>*(심층 절대영도 코어)* | $380$ | Increases blast radius to $145\text{px}$. Deep Freeze duration increased by $+25\%$. |
| **3** | **Acoustic Shatter Resonance**<br>*(음향 공진 파쇄탄)* | $550$ | Increases Shatter Critical multiplier from $2.0\times$ to $2.75\times$. Increases shrapnel shard count by $+50\%$. |
| **4** | **Rapid Compression Bay**<br>*(고속 압축 장전 베이)* | $750$ | Increases max mine capacity to $3$ charges. Reduces recharge time to $6.0\text{s}$. |
| **5** | **Glacial Cascade Protocol**<br>*(연쇄 동결 캐스케이드)* | $1,100$ | Ice shrapnel applies $+55$ Frost Stacks (up from $40$). Shatter kills trigger automatic secondary freeze on adjacent enemies! |

### 6.2 Synergies with Existing Systems

#### Synergy 1: Autonomous Homing Missiles (`Player.ts`)
- Existing missiles automatically target nearest hostiles. When a target is in `DEEP_FREEZE`, the targeting algorithm assigns it a $+200$ priority weight.
- When a Homing Missile strikes a frozen target, its $45\text{px}$ splash damage radius also converts into an instant secondary ice shockwave!

#### Synergy 2: Weapon Piercing Scaling (`Bullet.ts`)
- A player firing multi-shot with Piercing $\ge 2$ can shoot through multiple frozen enemies in a line, triggering multiple concurrent shatter detonations that overlap in destructive AoE coverage.

#### Synergy 3: Barricade Defense & Saboteur Counterplay (`Barricade.ts` / `Enemy.ts`)
- Saboteurs specifically target barricades. A cryo-mine placed at the barricade threshold acts as an automated burglar alarm: freezing the saboteur before it can chew through the barrier, allowing the player or Allied Repair Bots to neutralize it safely.

#### Synergy 4: Acid Rain Neutralization (`Acid Rain Event`)
- If an Acid Rain event is active, the cryo-blast shockwave instantly crystallizes any acid droplets falling through its $120\text{px}$ sphere, converting corrosive raindrops into inert, harmless snow crystals that sparkle out of existence.

### 6.3 Technical Feasibility & Architecture Compliance

#### 1. Zero Modification to Logical Canvas Bounds
- The proposal strictly adheres to the engine's fixed logical grid:
  ```typescript
  public readonly logicalWidth: number = 600;
  public readonly logicalHeight: number = 800;
  ```
- All mine coordinates, blast radii ($120\text{px}$), shrapnel trajectories, and touch inputs scale perfectly within this normalized coordinate space.

#### 2. Class Hierarchy & Clean Composition
- **`CryoMine` Entity**: Inherits cleanly from `Entity` in `src/game/Entity.ts`:
  ```typescript
  export class CryoMine extends Entity {
    public armTimer: number = 0.45;
    public isArmed: boolean = false;
    public blastRadius: number = 120;
    // update(deltaTime, enemies), draw(ctx)
  }
  ```
- **`Enemy` Augmentation**: Non-breaking additions:
  ```typescript
  public frostStacks: number = 0;
  public freezeTimer: number = 0;
  public isDeepFrozen: boolean = false;
  ```
- **`Bullet` Collision Handler**: When bullet collides with enemy where `isDeepFrozen === true`, calls `triggerIceShatter(enemy, bullet)`.

#### 3. Performance & 60 FPS Garbage Collection Budget
- **Zero Heap Allocations in Loop**: Shrapnel particles and damage records reuse an object pool (`shrapnelPool: ShrapnelShard[]`), eliminating dynamic object allocations during heavy combat.
- **Canvas Rendering Efficiency**: Uses pure vector paths with zero blur filters (`ctx.shadowBlur = 0`). Uses concentric alpha circles for bloom, ensuring silky-smooth 60 FPS performance even on low-end mobile devices.

---

## 7. Conclusion & Strategic Impact

The **Cryo-Freezing Mines & Ice-Shatter Combo System** transforms *Water Invader* from a straightforward top-down shooter into a deeply satisfying tactical action game. It gives players a high-agency tactical tool to control enemy flow, rewards precision combo execution with immense visual and acoustic payoffs, and cleanly integrates with the existing weapon and upgrade architecture.

---
*Specialist 1.3 | Creative Brainstorming Swarm | Proposal Complete*

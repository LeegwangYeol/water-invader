# Feature Proposal: Hydraulic Harpoon Tether & Kinetic Slingshot Mechanics
**Specialist 1.6 — Weapons, Physics & Kinetic Interaction Domain**  
**Game Title**: *Water Invader: Deep Submersion*  
**Date**: September 10, 2026  
**Document Status**: Final Feature Proposal & Architectural Specification  
**Working Directory**: `/Users/user/src/water-invader/.agents/swarm_d1_harpoon_6/`  

---

## Executive Summary

Traditional vertical fixed-shooter games (such as *Space Invaders*, *Galaga*, and classic bullet-hell titles) lock players into a one-dimensional interaction paradigm: move laterally along the bottom axis, dodge descending projectiles, and fire straight upward in uniform vertical vectors.

The **Hydraulic Harpoon Tether & Kinetic Slingshot System** (*코드명: 하이드롤릭 하푼 앤 키네틱 슬링샷*) breaks this paradigm wide open. It equips the player's deep-sea submersible gunship with a high-velocity, winch-mounted pneumatic harpoon firing high-tensile titanium-graphene cables. When impaled, enemies are physically coupled to the player, transforming them from descending threats into **tactile physics puppets, dynamic meat-shields, and high-velocity kinetic projectiles**.

By maneuvering laterally, operating the high-torque hydraulic winch, and timing release at peak cable tension, players can:
1. **Flail & Slam**: Swing tethered invaders like a massive demolition wrecking ball into surrounding enemy formations.
2. **Disrupt Defensive Bastions**: Physically haul front-line Shield Bearers (`EnemyType.SHIELDED`) out of formation, exposing sniper and artillery ranks.
3. **Execute Environmental Combos**: Drag invaders into deadly hazards—such as the corrosive downpours of the `ACID_STORM` crisis or the incinerating columns of `SOLAR_FLARE` beams.
4. **Kinetic Slingshot (Catapult Eject)**: Accumulate elastic potential energy under maximum tension and release the spool to launch the captured enemy upward into enemy clusters as a devastating kinetic missile.

---

## 1. Concept & The Core Hook

```
                 [ ENEMY FORMATION ]
                   ▲       ▲       ▲
            [Invader]  [Invader]  [Invader]
                 ▲
                  \
                   \   <-- [KINETIC SLINGSHOT TRAJECTORY]
                    \      (Hypersonic Impact & Piercing Blast)
                     \
             [ IMPALED TARGET ]  <==== (High-Speed Angular Whip)
                     |
                     |  <-- High-Tensile Titanium-Graphene Cable
                     |      (Strain Color: Cyan -> Amber -> Crimson)
                     |
               [===WINCH===]
             [ PLAYER SUBMARINE ]  ===> (Lateral Thruster Pull: Left/Right)
```

### 1.1 The Fantasy: Physical Dominion Over the Abyss
In the high-pressure aquatic environment of *Water Invader*, water offers both resistance and immense hydrodynamic momentum. Rather than relying solely on energy blasters and homing missiles, the Hydraulic Harpoon provides a primal, heavy-machinery sensation. The player is not just shooting; they are wrestling underwater leviathans and mechanical invaders, using their own inertia and mass against them.

### 1.2 The Four Pillars of the Harpoon Hook
1. **The Wrecking Ball**: Turning an enemy's hitpoints into player offense. Harpooning a medium or heavy invader and rapidly oscillating horizontal movement swings the enemy across the canvas in a wide pendulum arc, pulverizing swarms of light drones on impact.
2. **Formation Breaker & Shield Inversion**: Heavy shield invaders project frontal invulnerability zones that neutralize player bullet streams. With the harpoon, players can hook the shield generator chassis from an angle, yank the bearer sideways 180 degrees, and force the enemy armada to shoot their own ally or leave their vulnerable rear exposed.
3. **Hazard Disposal**: Dragging enemies into active crisis hazards. When acid rain falls during an `ACID_STORM` crisis, players can use their `hasAcidShield` immunity while tethering an unshielded invader into the acid streams, melting them in seconds without expending a single bullet.
4. **The Kinetic Slingshot Release**: Straining the cable to its absolute limit creates a spring-loaded catapult. Releasing the winch trigger launches the tethered enemy like an explosive cannonball directly into enemy ranks, triggering multi-target piercing damage, screen shake, and sonic shockwaves.

---

## 2. Mechanics & Mathematical Physics Engine

To ensure deterministic, high-performance execution on an HTML5 2D Canvas without frame drops or physics glitches, the Harpoon Tether employs a **Semi-Implicit Euler / Damped Harmonic Spring-Constraint Model** executed within the game's `FIXED_STEP = 1/60` (16.66ms) simulation loop.

```
       p_enemy (x_e, y_e)
          o
           \
            \  L(t) = ||p_enemy - p_player||
             \
              \  F_tension = k_s * (L - L_0) + c_d * (v_rel . u)
               \
                \
                 * p_player (x_p, y_p)
```

### 2.1 Cable State & Non-Linear Spring Dynamics

The tether connects the player position $\mathbf{p}_{\text{player}} = (x_p, y_p)$ to the tethered enemy position $\mathbf{p}_{\text{enemy}} = (x_e, y_e)$.

- **Distance Vector**: $\mathbf{r} = \mathbf{p}_{\text{enemy}} - \mathbf{p}_{\text{player}}$
- **Current Cable Length**: $L(t) = \|\mathbf{r}\| = \sqrt{(x_e - x_p)^2 + (y_e - y_p)^2}$
- **Unit Direction Vector**: $\hat{\mathbf{u}} = \frac{\mathbf{r}}{L(t)}$
- **Relative Velocity Vector**: $\mathbf{v}_{\text{rel}} = \mathbf{v}_{\text{enemy}} - \mathbf{v}_{\text{player}}$

#### Physical Constants:
- **Rest Length ($L_0$)**: $110.0\text{ px}$ (slack limit; no tension if $L \le L_0$)
- **Max Operational Length ($L_{\max}$)**: $420.0\text{ px}$
- **Cable Break Threshold ($L_{\text{break}}$)**: $490.0\text{ px}$
- **Linear Spring Stiffness ($k_s$)**: $95.0\text{ N/px}$ (canvas units)
- **Viscous Damping Coefficient ($c_d$)**: $8.5\text{ N}\cdot\text{s/px}$ (stabilizes numerical oscillations)
- **Non-Linear Hardening Exponent ($\beta$)**: $3.2$

#### Non-Linear Tension Force Formula:
When the cable is stretched beyond its rest length ($L > L_0$), it exerts a restoring force along the line of action $\hat{\mathbf{u}}$. Due to the woven titanium-graphene micro-structure, the cable stiffens non-linearly as it approaches its elastic limit:

$$F_{\text{elastic}} = k_s \cdot (L - L_0) \cdot \left[ 1 + \beta \left( \frac{L - L_0}{L_{\max} - L_0} \right)^2 \right]$$

Adding the viscous damping term along the cable axis:

$$F_{\text{damping}} = c_d \cdot (\mathbf{v}_{\text{rel}} \cdot \hat{\mathbf{u}})$$

$$\mathbf{F}_{\text{tension}} = 
\begin{cases} 
\mathbf{0}, & \text{if } L \le L_0 \\
\max\left(0, F_{\text{elastic}} + F_{\text{damping}}\right) \cdot (-\hat{\mathbf{u}}), & \text{if } L > L_0 
\end{cases}$$

*(Note: $\mathbf{F}_{\text{tension}}$ pulls the enemy toward the player, and an equal and opposite reaction force $-\mathbf{F}_{\text{tension}}$ pulls the player toward the enemy, scaled inversely by relative mass).*

---

### 2.2 Winch Motor Dynamics & Dragging Speed

The player controls a variable-speed hydraulic spool with three distinct operational states:
1. **Neutral Drift**: The spool maintains current distance, dampening sudden shocks.
2. **Hydraulic Retraction (Winch In)**: Holding the Winch Key (`[Shift]`, `[Right Mouse Button]`, or `[Spacebar]`) activates the motor.
   $$L_0(t + \Delta t) = \max(L_{\min}, L_0(t) - v_{\text{winch}} \cdot \Delta t)$$
   where $v_{\text{winch}} = 240.0\text{ px/s}$, and $L_{\min} = 65.0\text{ px}$.
3. **Power Spool Release (Slingshot Charge)**: Releasing tension while reversing thrusters stretches $L(t)$ toward $L_{\max}$, charging the kinetic catapult capacitor.

---

### 2.3 Rotational Whip & Angular Velocity Mechanics

When the player moves laterally at velocity $\mathbf{v}_{\text{player}} = (v_x, 0)$ while tethered, the lateral force generates a torque around the player:

$$\boldsymbol{\tau} = \mathbf{r} \times \mathbf{F}_{\text{pull}} = (r_x F_{y} - r_y F_{x}) \hat{\mathbf{k}}$$

The resulting angular acceleration $\alpha$ acting on the enemy is:

$$\alpha = \frac{\tau}{I} - \gamma_{\text{drag}} \cdot \omega$$

where $I = m_{\text{enemy}} \cdot L^2$ is the moment of inertia, and $\gamma_{\text{drag}} = 0.45$ represents aquatic fluid resistance.

The tangential whip speed of the tethered enemy reaches:

$$v_{\text{tangential}} = |\omega| \cdot L(t)$$

When the player executes a quick directional reversal (e.g., from full-left to full-right), the enemy experiences **centripetal whip acceleration**:

$$a_{\text{centripetal}} = \frac{v_{\text{tangential}}^2}{L(t)} = \omega^2 L(t)$$

Tangential velocities can exceed **$900\text{ px/s}$**, creating devastating wrecking-ball arcs across the screen.

---

### 2.4 Slingshot Catapult Launch Formula

When the player triggers the **Slingshot Eject** (by releasing the harpoon while under high tension and accelerating laterally), the stored elastic potential energy:

$$U_{\text{elastic}} = \frac{1}{2} k_s (L - L_0)^2$$

is instantaneously converted into kinetic muzzle energy, propelling the enemy upward:

$$\mathbf{v}_{\text{launch}} = \mathbf{v}_{\text{enemy}} + \left[ \eta \cdot \sqrt{\frac{k_s}{m_{\text{enemy}}}} \cdot (L - L_0) \right] \cdot (-\hat{\mathbf{u}})$$

where $\eta = 1.45$ is the kinetic energy release efficiency coefficient.

#### Kinetic Projectile State:
For $1.25\text{ seconds}$ post-launch, the released enemy enters the `KINETIC_BALLISTIC` state:
- It becomes immune to player bullet collisions.
- It pierces through all regular enemy hitboxes.
- It displays a flaming hydrodynamic cavitation wake.
- It inflicts massive impact damage to all entities in its flight corridor before detonating in a concussive shockwave.

---

### 2.5 Momentum Transfer & Collision Damage Formulas

When a tethered or slingshotted enemy collides with another enemy in the formation:

#### Impact Velocity:
$$\mathbf{v}_{\text{impact}} = \mathbf{v}_{\text{projectile}} - \mathbf{v}_{\text{target}}$$

#### Damage Dealt to Target Invader:
$$\text{Damage}_{\text{target}} = D_{\text{base}} + \left[ \kappa \cdot \left(\frac{m_{\text{projectile}}}{m_{\text{standard}}}\right) \cdot \left(\frac{\|\mathbf{v}_{\text{impact}}\|}{v_{\text{threshold}}}\right)^{1.75} \right]$$

where:
- $D_{\text{base}} = 25$ damage.
- $\kappa = 40.0$ (scaling coefficient).
- $m_{\text{standard}} = 1.0$ (standard light invader mass).
- $v_{\text{threshold}} = 200\text{ px/s}$ (minimum impact velocity for kinetic scaling).

#### Reciprocal Damage to Tethered Projectile:
The swung enemy takes reciprocal collision damage:
$$\text{Damage}_{\text{projectile}} = 0.55 \cdot \text{Damage}_{\text{target}}$$
This ensures the swung enemy serves as a lethal battering ram for 2 to 4 solid impacts before breaking apart into shrapnel!

---

### 2.6 Mass & Dynamic Response Matrix Across Enemy Types

| Enemy Type | Code / Enum | Mass ($m$) | Drag Resistance ($C_d$) | Max Whip Velocity | Tactical Role as Tether |
|:---|:---|:---:|:---:|:---:|:---|
| **Normal Drone** | `NORMAL` (0) | 1.0 | 0.20 | 950 px/s | **Speed Whip**: Extremely agile, fast pendulum arc, clears light drone clusters rapidly. |
| **Zigzag Skimmer** | `ZIGZAG` (1) | 0.9 | 0.18 | 1020 px/s | **Hyper-Flail**: Highest angular speed, erratic whipping arcs, ideal for slingshot snipes. |
| **Shield Bearer** | `SHIELDED` (5) | 3.2 | 0.65 | 580 px/s | **Armored Battering Ram**: Frontal shield deflects bullets while being swung; devastating kinetic mass. |
| **Splitter Pod** | `SPLITTER` (6) | 2.0 | 0.40 | 720 px/s | **Cluster Bomb**: Slingshotting it splits it mid-flight into kinetic cluster shrapnel. |
| **Rogue Mech** | `ROGUE_MECH` (9) | 5.5 | 0.85 | 420 px/s | **Heavy Wrecking Ball**: Substantial inertia; slightly slows player, but one-shots elites on impact. |
| **Saboteur** | `SABOTEUR` (13) | 1.8 | 0.35 | 780 px/s | **Interception Target**: Yanking it away from barricades neutralizes base gnawing instantly. |
| **Goliath Mech** | `ROGUE_GOLIATH` (10) | 9.0 | 1.20 | 280 px/s | **Mobile Anchor**: Player cannot easily drag it; instead, player can winch *toward* it or swing around it! |
| **Boss / Sovereign** | `BOSS` (2) / `Sovereign` | 50.0 | 5.00 | 0 px/s (Fixed) | **Tow Hook Grapple**: Harpooning a Boss anchors the player, allowing rapid evasive orbital swings around boss bullet hells! |

---

## 3. Tactical Gameplay Loop & Enemy Disruption

```
+-------------------------------------------------------------------------------+
|                           THE HARPOON TACTICAL LOOP                           |
+-------------------------------------------------------------------------------+
|                                                                               |
|   1. ACQUIRE & IMPALE                                                         |
|      - Align HUD targeting reticle with high-value invader (45° cone)         |
|      - Fire pneumatic tungsten harpoon (1200 px/s projectile velocity)        |
|      - Barbed anchor locks into enemy chassis; weapon fire suppressed         |
|                                                                               |
|   2. MANEUVER & DISRUPT                                                       |
|      - Dislodge Shield Bearers to expose backline Snipers & Splitters         |
|      - Lateral thruster burn to initiate rotational momentum                  |
|      - Winch retraction to haul target into friendly Allied fire lanes        |
|                                                                               |
|   3. KINETIC DECISION POINT: SLINGSHOT vs. HAZARD DISPOSAL                    |
|      /                                       \                                |
|     v                                         v                               |
|   PATH A: KINETIC CATAPULT                  PATH B: ENVIRONMENTAL DUMP        |
|   - Maximize cable tension to 85-95%        - Drag into ACID_STORM rain       |
|   - Eject harpoon at peak whip angle        - Hold inside SOLAR_FLARE beam    |
|   - Launches enemy as hypersonic missile    - Melts armor via hazard DoT      |
|   - Screen-clearing kinetic explosion       - 0 player ammo expended          |
|                                                                               |
+-------------------------------------------------------------------------------+
```

### 3.1 Countering Defensive Formations (Anti-Shield Tactics)
- **The Problem**: Late-game waves and Elite incursions feature phalanxes of `EnemyType.SHIELDED` units that form impenetrable energy walls, shielding snipers and missile carriers behind them. Regular bullets and even homing missiles bounce off or detonate fruitlessly.
- **The Harpoon Solution**: The heavy tungsten harpoon head ignores magnetic energy barriers, punching straight into the mechanical chassis of the Shield Bearer. Once tethered:
  - The player sweeps horizontally, physically wrenching the Shield Bearer out of alignment.
  - The shield orientation is locked forward relative to the enemy's heading. As the player swings the enemy around, the shield points *away* from the player, completely exposing the invader's unarmored thrusters to player fire.
  - Friendly invaders behind the disrupted shield bearer now lack cover and take full player fire.

### 3.2 Environmental Hazard Synergies
The Harpoon transforms environmental crises into deadly player weapons:
1. **Acid Storm Interaction (`ACID_STORM`)**:
   - In standard gameplay, `ACID_STORM` spawns descending corrosive `hazardProjectiles`. If the player has purchased `hasAcidShield`, they are immune.
   - Enemies, however, possess biological or metallic armor vulnerable to acid. By dragging an impaled enemy into the vertical trajectory of falling acid drops, the enemy receives **$350\text{ damage/sec}$** from acid erosion, stripping their shields in a hiss of green corrosive smoke.
2. **Solar Flare Incineration (`SOLAR_FLARE`)**:
   - During `SOLAR_FLARE`, vertical beam columns telegraph a charge timer (`chargeTimer`) before releasing an incinerating pillar of solar plasma (`damageDealt`).
   - A skilled player can harpoon an Elite Mech or Goliath, winch it directly into the telegraphed column, and hold it there until the beam fires, cleanly vaporizing a high-threat target without firing a shot!
3. **EMP Grounding (`EMP_DISRUPTION`)**:
   - When EMP strikes, electrical interference scrambles UI and thrusters. The titanium-graphene cable acts as an electrical lightning rod: the player can discharge their accumulated static charge through the cable into the impaled enemy, frying its circuits and triggering a chain-lightning burst to adjacent enemies.

### 3.3 Dynamic Meat-Shield & Barricade Protection
- **Mobile Meat-Shield**: While an enemy is tethered, incoming enemy projectiles that collide with the tethered body are absorbed by it. The player can actively position the tethered invader between themselves and incoming sniper beams, turning an enemy into a disposable blast wall.
- **Interception of Saboteurs (`EnemyType.SABOTEUR`)**: Saboteurs rapidly descend to gnaw on the central barricades. Harpooning a descending Saboteur yanks it mid-flight before it touches the barricade, preserving critical defensive cover.

---

## 4. Visuals & Audio Design (SFX / Audiovisual Design)

### 4.1 Visual Rendering Pipeline (Pure HTML5 Canvas)

```
       Segmented Verlet Spline (12 nodes)
  (x_0, y_0) -> (x_1, y_1) -> ... -> (x_11, y_11)
      [Player] ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ [Enemy]
         |                              |
      Gleaming Cyan Wire          Sparks & Cavitation
      (Jitter amplitude = f(Tension))
```

1. **Segmented Multi-Joint Dynamic Cable**:
   - Rather than a plain straight line, the cable is rendered as a **12-node Verlet integration string** connected via cubic Bézier curves (`ctx.bezierCurveTo`).
   - **At Low Tension (< 30%)**: The cable sags in a graceful catenary curve, trailing fluidly through the water with floating micro-droplets.
   - **At Moderate Tension (30% - 75%)**: The cable straightens, glowing with an electric cyan pulse (`#38bdf8`) with a high-tensile braided steel core texture.
   - **At Extreme Tension (> 75%)**: The cable vibrates with a high-frequency sinusoidal jitter:
     $$\delta y_i = \sin\left(\text{time} \cdot 90 + i \cdot 0.8\right) \cdot \left(\frac{\text{Tension}}{100}\right) \cdot 3.5\text{ px}$$
     The color shifts along a dynamic gradient from electric amber (`#fbbf24`) to warning crimson (`#ef4444`) with blinding white electrical spark particles snapping off the cable joints.

2. **Hydrodynamic Cavitation & Water Wake**:
   - As an impaled enemy is whipped through the water, cavitation bubbles and foaming white wake trails (`rgba(255, 255, 255, 0.7)`) radiate backward along its velocity vector.
   - Canvas composite modes (`ctx.globalCompositeOperation = 'screen'`) render a luminous blue-white water disturbance funnel.

3. **Impale Point FX**:
   - Four-pronged barbed anchor head rendered clamped deep into the enemy sprite.
   - Continuous spark emitter (`#f59e0b`, `#fef08a`) and leaking green/black synthetic fluid particles streaming into the water currents.

4. **Slingshot Catapult Shockwave**:
   - At the exact millisecond of slingshot release, an expanding circular refraction shockwave ring (`ctx.arc`, lineWidth 6 $\to$ 1, opacity 1 $\to$ 0 over 300ms) erupts from the release point.
   - The launched enemy leaves an incandescent motion-blur smear with a conical sonic boom condensation cone.

---

### 4.2 Sound Effects & Web Audio API Procedural Synthesis

To ensure zero asset-loading lag and zero external file dependencies, all sound effects are synthesized dynamically via the Web Audio API (`SoundManager.ts`), backed by layered procedural audio nodes:

```
[Oscillator 1: Square / Sawtooth] ---> [BiquadFilter: Lowpass / Peaking]
                                               |
[Noise Buffer: White / Pink Noise] ---> [GainNode: ADSR Envelope] ---> [AudioDestination]
```

#### Detailed Audio Cues & Synthesis Specifications:
1. **Pneumatic Harpoon Launch (`harpoon_launch`)**:
   - *Sound Concept*: High-pressure air tank rupture followed by a metallic cable hiss.
   - *Synthesis*: Short burst of highpass filtered white noise (cutoff 2200 Hz, Q=3.0, duration 90ms) layered with a rapid downward frequency sweep (480 Hz $\to$ 120 Hz sine wave over 120ms).
2. **Impale & Anchor Latch (`harpoon_impact`)**:
   - *Sound Concept*: Heavy tungsten dart piercing titanium hull plate with a sharp mechanical locking clamp.
   - *Synthesis*: Dual transient strike: high-frequency metallic 'clink' (2400 Hz triangle wave, decay 40ms) followed by low-frequency hull thud (80 Hz square wave passed through 120 Hz lowpass filter).
3. **Dynamic Cable Strain Reverberation (`cable_tension_loop`)**:
   - *Sound Concept*: An ominous, singing steel cable under immense strain, rising in pitch as tension mounts (*"shwwweeee-zzzt"*).
   - *Synthesis*: Continuous dual-oscillator frequency modulation (Carrier: 180 Hz sine, Modulator: 45 Hz sawtooth). As cable tension increases from 0% to 100%, the carrier pitch dynamically slides upward from **180 Hz to 860 Hz**, with the modulation depth increasing, creating a terrifying acoustic signifier of imminent cable rupture.
4. **Hydraulic Winch Motor (`winch_spool`)**:
   - *Sound Concept*: Heavy-duty industrial hydraulic motor whining with rhythmic mechanical gear clicks.
   - *Synthesis*: 320 Hz square wave modulated with a 24 Hz pulse oscillator, creating a rapid mechanical clicking ratchet sound (*"ch-ch-ch-ch-whiiine"*).
5. **Slingshot Release Twang (`slingshot_release`)**:
   - *Sound Concept*: An immense bass string snap underwater—concussive, resonant, and bass-heavy.
   - *Synthesis*: Deep sub-bass frequency plunge (140 Hz $\to$ 28 Hz over 450ms) with exponential gain decay, accompanied by an explosive wideband white-noise transient (the cavitation crack).
6. **Kinetic Body-Slam Impact (`kinetic_collision`)**:
   - *Sound Concept*: Shattering metal armor and concussive depth charge explosion.
   - *Synthesis*: Lowpass filtered brown noise burst (cutoff 350 Hz, duration 600ms) with distorted overdrive gain, layered with randomized glass/metal shrapnel pings (1800 Hz - 3200 Hz).

---

## 5. UI Target Lock & Diegetic Cable Tension Meter

```
                      [ TARGET LOCK RETICLE ]
                              ┌─     ─┐
                              │  (o)  │  <-- Predictive Lead Dot
                              └─     ─┘
                                 ▲
                                 |  (Impaled Range: 312 px)
                                 |
                                 |
+-------------------------------------------------------------------------------+
| CANVAS HUD: BOTTOM COCKPIT DISPLAY                                            |
|                                                                               |
|   [SPEED: 300]         [== CABLE TENSION METER ==]         [PURE WATER: 450]  |
|                         /// 78% SLINGSHOT READY \\\                           |
|                         [████████████████░░░░░░]                              |
|                         < OPTIMAL EJECT WINDOW >                              |
|                                                                               |
|                [HARPOON: READY]       [WINCH: ACTIVE (SHIFT)]                 |
+-------------------------------------------------------------------------------+
```

### 5.1 HUD Predictive Target Lock Reticle
- **Acquisition Cone**: When the player holds the Harpoon Aim trigger, a subtle 45-degree forward targeting cone projects from the submarine bow.
- **Predictive Lead Indicator**:
  - The HUD computes target intercept vector based on harpoon flight speed ($v_{\text{harpoon}} = 1200\text{ px/s}$) and enemy velocity $\mathbf{v}_{\text{enemy}}$:
    $$\mathbf{p}_{\text{lead}} = \mathbf{p}_{\text{enemy}} + \mathbf{v}_{\text{enemy}} \cdot \left(\frac{\|\mathbf{p}_{\text{enemy}} - \mathbf{p}_{\text{player}}\|}{v_{\text{harpoon}}}\right)$$
  - A glowing dual-bracket reticle snaps onto the closest candidate.
- **Lock-On Visual States**:
  - *Scanning*: Dim cyan brackets softly pulsing at 2 Hz.
  - *Locked*: Crisp electric green brackets with crosshairs snapping shut and an audible chirp.
  - *Tether Active*: Reticle turns into a diamond anchor badge over the tethered enemy with real-time distance and mass readout (`MASS: 3.2T | DIST: 284PX`).

---

### 5.2 Cable Tension Meter (Diegetic & Cockpit Gauges)

Tension management is the core skill gate for the Harpoon system. A player who maintains optimal tension unlocks devastating slingshots; a player who exceeds 100% snaps the cable.

#### 1. Cockpit HUD Gauge:
A segmented horizontal neon LED bar located above the submarine or pinned to the bottom HUD bar:
- **0% - 55% [GREEN / CYAN SAFE ZONE]**:
  - Stable towing. Low flail damage, zero risk of rupture.
- **55% - 85% [AMBER SLINGSHOT CHARGE ZONE]**:
  - Cable is taut. High angular momentum. Releasing the winch here activates the **Kinetic Slingshot (Tier 1)** ($+150\%$ damage, $2\times$ launch speed).
- **85% - 98% [CRIMSON OVER-TENSION SWEET SPOT]**:
  - Cable is vibrating violently. Maximum potential energy. Releasing here triggers the **Critical Catapult (Tier 2)** ($+300\%$ damage, piercing shockwave, screen-clearing kinetic blast).
- **99% - 100% [WHITE-HOT RUPTURE WARNING]**:
  - HUD flashes `WARNING: CABLE STRESS CRITICAL!`.
  - An emergency audio klaxon blares. If held in this state for $> 0.75\text{ seconds}$, the cable snaps!

#### 2. Cable Snap Penalty:
- The cable violently recoils into the submarine spool.
- The player experiences a **0.8s thruster stall / mini-stun** (speed reduced by 50%).
- The Harpoon enters an emergency hydraulic reset cooldown ($3.5\text{ seconds}$).
- The previously tethered enemy is flung erratically rather than controlled.

---

## 6. Synergies, Meta-Progression & Technical Feasibility

### 6.1 Synergies with Existing *Water Invader* Subsystems

1. **Autonomous Homing Missiles (`HomingMissile`)**:
   - The game currently has a 5-tier homing missile system (`Player.MISSILE_SPECS`).
   - *Synergy - Laser-Tether Painting*: When an enemy is impaled by the Harpoon, it emits a homing beacon frequency. Autonomous homing missiles immediately override their default proximity targeting to swarm the tethered target with $+40\%$ critical damage, allowing players to pull high-value targets into concentrated salvo crossfires.
2. **Enemy Piercing Scaling Mechanics**:
   - Common enemies in later waves scale piercing damage. Slingshotted enemies inherit the player's weapon piercing tier (`player.piercing`), punching through successive ranks of enemy formations rather than stopping at the first target.
3. **Allied Reinforcements (`AlliedReinforcements.ts`)**:
   - Allied Fighters fire forward bullet lanes; Allied Repair Bots mend central barricades.
   - Players can harpoon Rogue Mechs or aggressive Divers (`EnemyType.DIVER`) and physically yank them into the direct fire arc of Allied Fighters, or drag them away from vulnerable Repair Bots!
4. **Stress & Suppression Mechanics (`Player.ts`)**:
   - The player submarine features `suppressionLevel` and `stressLevel`. Harpooning a threatening Elite instantly relieves $-30$ Player Stress, while applying $+100$ Suppression to the impaled enemy, shutting off its firing algorithms while tethered.

---

### 6.2 Shop Meta-Progression Upgrade Tree

Available in both the **Pre-Game Shop** (Wave 1) and the **Pre-Continue Shop** (`GameState.SHOP`):

```
                                [ TIER 1: PNEUMATIC HARPOON ]
                                     (Cost: 200 Pure Water)
                                                |
                       +------------------------+------------------------+
                       |                                                 |
            [ TIER 2A: HYDRAULIC WINCH ]                     [ TIER 2B: GRAPHENE WEAVE ]
               (Cost: 350 Pure Water)                           (Cost: 380 Pure Water)
              +50% Winch Retract Speed                         +40% Cable Break Limit
              -25% Tension Build Rate                          +30% Kinetic Sling Damage
                       |                                                 |
                       +------------------------+------------------------+
                                                |
                                   [ TIER 3: TESLA CONDUIT ]
                                     (Cost: 650 Pure Water)
                                  Electrocutes tethered foes;
                                  Arcs 15 DPS to nearby drones
                                                |
                                   [ TIER 4: DUAL SPOOL RIG ]
                                     (Cost: 950 Pure Water)
                                  Simultaneously harpoon 2 enemies;
                                  Slam them head-on into each other!
                                                |
                                 [ TIER 5: SINGULARITY ANCHOR ]
                                    (Cost: 1,400 Pure Water)
                                  Catapult impact collapses into a
                                  micro-vortex pulling surrounding foes
```

---

### 6.3 Technical Feasibility & Architecture Integration

The proposed Harpoon Tether system is strictly architected to integrate cleanly into `src/game/` without introducing performance degradation, garbage collection stutter, or violating architectural invariants.

```
       src/game/
       ├── GameManager.ts       <-- Update loop calls harpoonSystem.update(dt)
       ├── Player.ts            <-- Harpoon emitter offset, input state flags
       ├── HarpoonTether.ts     <-- (Proposed) Self-contained physics & rendering entity
       ├── Enemy.ts             <-- Mass property, isTethered flag, kinetic state
       └── SoundManager.ts      <-- Procedural Web Audio API sound synthesis
```

#### 1. Invariant Preservation:
- `logicalWidth = 600` and `logicalHeight = 800` are 100% preserved.
- All physics calculations clamp position coordinates to `[0, logicalWidth]` and `[0, logicalHeight]`.
- Absolutely no changes to logical canvas resolution or mobile CSS viewport rules.

#### 2. Deterministic Fixed-Step Integration:
- Physics equations run inside the existing `accumulator >= this.FIXED_STEP` loop in `GameManager.ts` (`1/60s`), guaranteeing identical tension and momentum dynamics regardless of display refresh rate (60Hz, 120Hz, or 144Hz).

#### 3. Zero-Allocation Garbage Collection Strategy:
- In fast-paced Canvas action, allocating objects (e.g. `new Vector2D()`) every frame triggers GC pauses.
- The Harpoon subsystem utilizes **pre-allocated vector pools** (`vecPool = [new Vec2(), new Vec2(), ...]`) and recycles particles through the existing `this.particlePool` in `GameManager.ts`.

#### 4. Clean TypeScript Data Structures:

```typescript
export interface HarpoonTetherState {
  isActive: boolean;
  targetEnemy: Enemy | null;
  length: number;
  restLength: number;
  maxLength: number;
  tension: number;         // Normalized 0.0 to 1.0
  overTensionTimer: number;// Tracks duration in >95% zone
  angularVelocity: number;
  cableNodes: { x: number; y: number; vx: number; vy: number }[]; // 12 joints for Verlet spline
  isWinching: boolean;
  cooldownTimer: number;
  upgradeLevel: number;
}
```

#### 5. Estimated Performance Impact:
- **CPU Frame Budget**: $\approx 0.18\text{ ms}$ on standard modern hardware (well within the $16.66\text{ ms}$ budget).
- **Canvas Draw Calls**: 1 continuous path stroke for cable spline, 1 radial gradient for reticle, 12 spark particles (from existing pool).
- **Memory Footprint**: $< 4\text{ KB}$ persistent heap memory.

---

## 7. Comparative Assessment & Player Engagement Impact

| Metric | Water Invader Standard Combat | With Harpoon & Kinetic Slingshot |
|:---|:---|:---|
| **Player Agency & Movement** | Lateral evasion restricted to bottom 10% of screen. | Dynamic spatial control; player movements directly manipulate enemy positions. |
| **Tactical Counter to Shields** | Wait for shield bearer to cycle or shoot around flank. | Direct, aggressive physical disruption: latch, yank, and expose weak points. |
| **Environmental Hazard Role** | Passive obstacles that player must dodge. | Active weapons: weaponized acid rain and baiting into solar incinerators. |
| **Skill Ceiling** | Dodge timing and basic projectile lead. | Tension management, pendulum momentum conservation, and precision catapult timing. |
| **Spectacle & Feel** | Standard 2D bullet flashes. | Roaring titanium cables, heavy metallic impacts, water cavitation wakes, and kinetic screen-clearing explosions. |

---

## 8. Conclusion

The **Hydraulic Harpoon Tether & Kinetic Slingshot Mechanics** provide *Water Invader* with an unforgettable, tactile signature mechanic. It bridges the gap between classic retro shooters and modern physics-driven action games, elevating tactical depth, enhancing audio-visual feedback, and providing thrilling emergent combat scenarios without ever compromising game stability or performance.

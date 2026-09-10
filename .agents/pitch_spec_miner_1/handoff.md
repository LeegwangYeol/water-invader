# Handoff Report: Deep Specification Mining & Interface Design for Features 1–6
**Agent**: `pitch_spec_miner_1` (Weapons & Environment Spec Miner)  
**Parent Task ID**: `825a4037-5803-4947-8e62-404f0b0d33b5`  
**Milestone**: Swarm Phase 0 — Authoritative Specification Mining & Interface Contracts  
**Target Codebase**: `LeegwangYeol/water-invader` (`/Users/user/src/water-invader`)  
**Specification Sources**:
1. `/Users/user/src/water-invader/IDEAS_PITCH.md` (Authoritative 42-agent creative pitch & architectural blueprint)
2. `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md` (User directives and pre-approvals)
3. `/Users/user/src/water-invader/COLLABORATION.md` (Swarm milestone synchronization and rules)
4. Production Codebase: `src/game/GameManager.ts`, `src/game/Player.ts`, `src/game/Bullet.ts`, `src/game/Enemy.ts`, `src/game/SoundManager.ts`, `src/game/types.ts`, `src/components/game-canvas.tsx`

---

## 1. Observation

### 1.1 Direct Codebase & Invariant Verification
1. **Strict Coordinate Boundary Invariant**:
   - `src/game/GameManager.ts:159-160`:
     ```typescript
     public readonly logicalWidth: number = 600;
     public readonly logicalHeight: number = 800;
     ```
   - Invariant verified across user rules (`RULE[/Users/user/src/water-invader/.agents/rules/pre-commit-build.md]`) and `COLLABORATION.md:21`: `logicalWidth` and `logicalHeight` in `GameManager.ts` and `Enemy.ts` MUST NOT be changed under any circumstances. All responsiveness is handled via CSS letterboxing.
2. **Deterministic Simulation Timestep**:
   - `src/game/GameManager.ts:39`:
     ```typescript
     private readonly FIXED_STEP: number = 1 / 60;
     ```
   - All physics calculations (torpedo acceleration, spring cables, thermal updrafts, darkness battery decay) must evaluate deterministically at $\Delta t = 0.01667\text{ s}$.
3. **Existing Player Combat State & Extensibility**:
   - `src/game/Player.ts:8-39`: `Player` has `speed: 300`, `hp: 3`, `maxHp: 5`, `baseFireRate: 0.5`, `multiShot: 1`, `piercing: 1`, `hasAcidShield: boolean`, `homingMissiles: number`, `suppressionLevel: number`, `stressLevel: number`, `invincibilityTimer: number`.
   - `Player.fire()` generates standard `Bullet` objects; `Player.fireHomingMissiles()` generates `HomingMissile` objects (extending `Bullet`).
   - Hardpoint and chassis selection can be seamlessly bound into `Player` via chassis configuration delegates without breaking existing properties.
4. **Existing Projectile & CCD Infrastructure**:
   - `src/game/Bullet.ts:36-39`:
     ```typescript
     this.prevPosition = { x: this.position.x, y: this.position.y };
     this.position.x += this.velocity.x * deltaTime;
     this.position.y += this.velocity.y * deltaTime;
     ```
   - `Bullet.checkCollision` checks swept segment intersections or bounding box overlaps against `Entity`.
   - `HomingMissile` (subclass of `Bullet`) implements target acquisition, turning radius kinematics ($6.2\text{ rad/s}$), smoke trail particle buffers, and area splash damage.
5. **Existing Procedural Audio Engine**:
   - `src/game/SoundManager.ts:1-663`: 100% Web Audio API synthesis without external MP3/WAV assets. Contains `playShoot()`, `playExplosion()`, `playShieldBreak()`, `playMissileLaunch()`, `playMissileExplosion()`, `playSingularityCollapse()`.
   - New audio signatures (cavitation ducking, high-pressure steam venting, high-tension wire creaks, hydrothermal boiling, halogen relay clicks) integrate cleanly into `SoundManager` as pure Web Audio oscillator/gain/filter nodes.
6. **Existing UI & Control Architecture**:
   - `src/components/game-canvas.tsx`: Contains React overlays for `MenuOverlay`, `ShopUpgradePanel`, `TopHUD`, `GameOverOverlay`, and pointer/touch controls.
   - Key bindings handled in `GameManager.ts:2804-2844` (`handleKeyDown`, `handleKeyUp`):
     - `ArrowLeft` / `A`: Move left
     - `ArrowRight` / `D`: Move right
     - `Space`: Primary shot
     - `E` / `Shift`: Ultimate
     - `Q`: Summon ally
   - Ready for new key assignments:
     - `C` / Right Mouse Button / Touch Button: Cavitation Torpedo (Launch & Remote Detonation)
     - `Space` (Hold / Toggle) with Laser weapon equipped: Bioluminescent Laser
     - `Shift` / Secondary Action with Harpoon equipped: Winch Reel / Slingshot Release
     - `F`: Headlight Toggle / High-Beam Flash
     - Pre-Game / Continue Shop: Chassis Selector Hangar Panel.

---

## 2. Logic Chain

1. **System Modularity**:
   - To implement Features 1–6 without destabilizing the $2,900$-line `GameManager.ts`, each major feature must be designed as an isolated, self-contained subsystem module adhering to strict TypeScript interfaces:
     - Feature 1: `CavitationTorpedo` extending `Bullet` in `src/game/weapons/CavitationTorpedo.ts`.
     - Feature 2: `PrismLaser` & `RefractionPrism` in `src/game/weapons/PrismLaser.ts`.
     - Feature 3: `HydraulicHarpoon` & `TetherSystem` in `src/game/weapons/HydraulicHarpoon.ts`.
     - Feature 4: `HydrothermalVentManager` in `src/game/environment/HydrothermalVent.ts`.
     - Feature 5: `BiolapseCycleManager` in `src/game/environment/BiolapseCycle.ts`.
     - Feature 6: `ChassisRegistry` & `PlayerChassis` in `src/game/chassis/SubmersibleChassis.ts`.
2. **Zero-GC & High-Performance Guarantee**:
   - At 60 FPS on mobile devices, per-frame memory allocations trigger garbage collection stutter.
   - All particle effects (cavitation vapor bubbles, laser steam bursts, hydrothermal sulfide motes, darkness photophores) MUST utilize pre-allocated object pools (`particlePool` in `GameManager`).
   - Continuous laser raycasting and harpoon tension math evaluate via scalar math without allocating intermediate objects or arrays per tick.
3. **Tactical Balance & Interoperability**:
   - The 6 features form a tightly coupled gameplay ecosystem:
     - Hydrothermal Vents dissipate Prism Laser heat by $+250\%$, incentivizing players to hover over vents while firing.
     - Biolapse Darkness blinds optical targeting, forcing reliance on searchlight cones and tactile harpoon anchors.
     - The Modular Chassis system alters base player mass, movement speed, and hardpoints, directly influencing harpoon recoil damping, torpedo payload counts, and laser cooling rates.
     - Cavitation Torpedo double-tap suction clusters scattered swarms before detonating, creating ideal multi-target alignment for the Harpoon slingshot or Prism laser fanning.

---

## 3. Caveats

1. **Coordinate Frame Discipline**: All coordinates, velocities, and radii in this specification are normalized to the $600 \times 800$ logical canvas. Implementers must ensure that rendering transforms (`ctx.scale(dpr, dpr)`) do not inadvertently scale logic numbers twice.
2. **Mobile Touch Surface Area**: On mobile devices, screen space is constrained. Touch buttons for Torpedo (`C`), Laser, Harpoon, and Headlight (`F`) must be laid out cleanly on `game-canvas.tsx` with a minimum touch target size of $44 \times 44\text{ px}$ to satisfy accessibility guidelines.
3. **Barricade Interaction Safety**: Detonating cavitation torpedoes or dragging heavy enemies with the harpoon near barricades induces acoustic fracturing. Clear visual warning boundaries must be rendered so players understand why barricade voxels take damage if abused.

---

## 4. Conclusion & Authoritative Specifications

---

### Detailed Specification 1: Cavitation Torpedo & Pressure Implosion Ordnance

#### A. Mechanics & Mathematical Modeling
1. **Kinematics & Acceleration**:
   - Initial muzzle launch speed: $v_0 = 180\text{ px/s}$ straight up ($\theta = -\pi/2$).
   - Constant supercavitation axial acceleration: $a_{\text{cav}} = 420\text{ px/s}^2$.
   - Terminal supercavitating cruise speed: $v_{\max} = 580\text{ px/s}$.
   - Instantaneous velocity:
     $$v(t) = \min\left(v_{\max}, \; v_0 + a_{\text{cav}} \cdot t\right)$$
2. **Safety Arming Window**:
   - Inert arming travel distance: $d_{\text{arm}} = 100\text{ px}$.
   - If an obstacle/enemy is struck within $d < d_{\text{arm}}$, torpedo deals $15$ kinetic blunt damage without detonating, bouncing off or continuing straight.
3. **Double-Tap Remote Detonation Trigger**:
   - First tap launches the torpedo.
   - Second tap (Key `C`, Right Mouse Button, or Mobile UI Button) manually triggers detonation at current coordinate $(x_t, y_t)$.
   - Auto-detonates upon reaching screen top ($y \le 40\text{ px}$) or colliding with an enemy after $d \ge d_{\text{arm}}$.
4. **Phase 1: Vacuum Singularity (Negative Pressure Well)**:
   - Duration: $T_{\text{vac}} = 0.08\text{ s}$ ($5$ frames at $60\text{ FPS}$).
   - Suction Radius: $R_{\text{pull}} = 140\text{ px}$.
   - Inward Gravitational Acceleration:
     $$\vec{a}_{\text{pull}}(\vec{r}) = -\frac{G \cdot M_{\text{cav}}}{\max\left(r^2, \; \epsilon^2\right)} \cdot \hat{r}, \quad G \cdot M_{\text{cav}} = 85,000\text{ px}^3/\text{s}^2, \; \epsilon = 25\text{ px}$$
   - Entities, debris, and drop pickups within $R_{\text{pull}}$ are accelerated toward the singularity centroid $(x_t, y_t)$.
5. **Phase 2: Hyperbaric Acoustic Blast**:
   - Duration: $T_{\text{blast}} = 0.27\text{ s}$ ($16$ frames).
   - Expanding shockwave front radius: $R_{\text{shock}}(t) = v_{\text{shock}} \cdot t$ with $v_{\text{shock}} = 750\text{ px/s}$, capping at $R_{\max} = 150\text{ px}$.
   - Quadratic Radial Damage Decay:
     $$D(r) = D_{\text{core}} \cdot \left(1 - \left(\frac{r}{R_{\max}}\right)^2\right)^{1.25}$$
     where $D_{\text{core}} = 120 + (\text{Level} - 1) \times 45$ (Lv 1: $120$, Lv 5: $300$).
   - Radial Pushback Impulse:
     $$\vec{v}_{\text{impulse}} = \frac{I_0}{\mu_{\text{mass}}} \cdot \hat{r}, \quad I_0 = 480\text{ px/s}$$
     with mass multipliers $\mu_{\text{mob}} = 1.0$, $\mu_{\text{elite}} = 2.2$, $\mu_{\text{boss}} = 8.0$.
6. **Hydro-Acoustic Bullet Vaporization**:
   - Any hostile projectile inside $r \le R_{\text{shock}}(t)$ is instantly neutralized and removed.
7. **Barricade Sympathetic Acoustic Fracture**:
   - Detonation within $d_{\text{barricade}} \le 85\text{ px}$ damages $1\text{–}4$ adjacent voxel blocks ($15$ damage).

#### B. State Machine
```
[POD_READY] 
    │ (Key C / RMB / Tap)
    ▼
[CRUISING_INERT] (0 < d < 100px)
    │ (Travel >= 100px)
    ▼
[CRUISING_ARMED] 
    │ (Key C tap / Enemy collision / y <= 40px)
    ▼
[SINGULARITY_COLLAPSE] (t: 0.00s -> 0.08s, Inward suction, Audio ducking)
    │ (t = 0.08s)
    ▼
[HYPERBARIC_SHOCKWAVE] (t: 0.08s -> 0.35s, Damage wave r=0->150px, Bullet erasure)
    │ (t >= 0.35s)
    ▼
[DETONATED_EXPIRED]
```

#### C. Audiovisual Blueprint
- **Visuals**: Translucent cyan vapor envelope (`#06b6d4` to `rgba(56, 189, 248, 0.15)`), 3 oscillating micro-bubbles trailing per frame. Singularity renders as black contracting sphere with cyan corona. Blast renders as high-luminance refractive shockwave ring with screen shake ($8\text{ px}$ amplitude, $0.25\text{ s}$).
- **Web Audio**:
  - *Launch*: Bandpass filtered white noise ($320\text{ Hz} \to 80\text{ Hz}$) + rising sine ($120\text{ Hz} \to 780\text{ Hz}$).
  - *Audio Void Duck*: Master gain drops to $0.05$ with lowpass filter at $250\text{ Hz}$ for $50\text{ ms}$.
  - *Blast*: Sawtooth + Sine oscillator sweeping exponentially from $52\text{ Hz} \to 18\text{ Hz}$ over $0.38\text{ s}$ through soft-clipping `WaveShaperNode` ($k=8$).

---

### Detailed Specification 2: Prism Laser & Refraction Prisms

#### A. Mechanics & Mathematical Modeling
1. **Instantaneous Raycast Damage Delivery**:
   - Zero projectile velocity ($v = \infty$, instantaneous hitscan line).
   - Evaluated at $20\text{ ticks/s}$ ($50\text{ ms}$ tick interval).
   - Base DPS: $\text{Damage/Tick} = 0.8\text{ (Lv 1)} \to 2.4\text{ (Lv 5)}$ ($16.0 \to 48.0\text{ DPS}$).
2. **Thermodynamic Heat Engine**:
   - Heat gauge $H \in [0, 100\text{ HU}]$ (Heat Units).
   - Differential equation:
     $$\frac{dH}{dt} = \begin{cases} +30.0 - K_{\text{cool}} & \text{if firing} \\ -25.0 \cdot \mu_{\text{env}} & \text{if idle} \end{cases}, \quad K_{\text{cool}} = 4.0\text{ HU/s}$$
   - **Thermal Zones**:
     - *Cool Zone* ($0\text{–}49\text{ HU}$): Standard beam, base damage.
     - *Warm Zone* ($50\text{–}79\text{ HU}$): Beam widens by $+20\%$, glowing orange-cyan.
     - *Supercharged Sweet Spot* ($80\text{–}99\text{ HU}$): **+25% bonus DPS**, incandescent core, electric arcs.
     - *Thermal Lockout* ($100\text{ HU}$): Firing locked for $2.2\text{ s}$; player mobility reduced by $-15\%$; steam venting plume emitted.
3. **Deployable Quartz Refraction Prisms**:
   - Deployable floating crystal ($24 \times 24\text{ px}$) hovering at $y = 360\text{ px}$.
   - Primary beam hitting prism splits into a fan array:
     - Center beam ($0^\circ$ deflection): $70\%$ power.
     - Left beam ($-35^\circ$ deflection): $60\%$ power.
     - Right beam ($+35^\circ$ deflection): $60\%$ power.
     - Cumulative power output: **190% of base damage**.
   - Level 5 Upgrade (Pentagonal Prism): Splits into 5 beams ($-50^\circ, -25^\circ, 0^\circ, +25^\circ, +50^\circ$), sweeping $85\%$ of the canvas width.
4. **Barricade Silicate Refraction**:
   - Beams hitting player coral/silicate barricades do NOT harm the barricade; instead, voxels act as natural low-efficiency prisms fanning out at $120\%$ total power.
5. **Hydrothermal Vent Convective Super-Cooling**:
   - While positioned inside a hydrothermal vent's outer convection halo, cooling rate is boosted by $+250\%$ ($K_{\text{cool}} = 14.0\text{ HU/s}$, passive cooling $-87.5\text{ HU/s}$), enabling sustained continuous beam fire in the Supercharged zone indefinitely.

#### B. State Machine
```
[LASER_IDLE] 
    │ (Hold Fire Key / LMB)
    ▼
[FIRING_NORMAL] (0 <= H < 80)
    │ (H >= 80)
    ▼
[FIRING_SUPERCHARGED] (80 <= H < 100, +25% DPS, Gold-Cyan Core)
    ├── (Release Fire) ──► [COOLING_DOWN] (Passive heat decay)
    │ (H >= 100)
    ▼
[THERMAL_LOCKOUT] (t_lockout: 2.2s, Forced venting, -15% speed, Steam burst)
    │ (t_lockout expires)
    ▼
[LASER_IDLE] (H resets to 0)
```

#### C. Audiovisual Blueprint
- **Visuals**: Layered composite beam: inner core ($4\text{–}10\text{ px}$ white `#ffffff`), outer photic bloom ($28\text{ px}$ `#06b6d4`), procedural sine caustic ripples, boiling micro-bubbles at contact points. Prism refractions render geometric chromatic aberration. Lockout vents high-density white steam particles.
- **Web Audio**: Dual triangle + sawtooth oscillator at $440\text{ Hz}$ with $6\text{ Hz}$ vibrato modulating upward in pitch as heat increases. Thermal lockout triggers high-pressure white noise hiss through $1.2\text{ kHz}$ highpass filter.

---

### Detailed Specification 3: Hydraulic Harpoon & Kinetic Slingshot Winch

#### A. Mechanics & Mathematical Modeling
1. **Harpoon Launch & Impalement**:
   - Prow launch velocity: $v_{\text{launch}} = 650\text{ px/s}$ straight up.
   - Micro-grapple head ($8 \times 16\text{ px}$) penetrates through common chaff (dealing $35$ kinetic damage) until striking an Elite, Heavy, or Boss entity, where it locks in place.
2. **Damped Harmonic Spring-Constraint Model**:
   - Instantaneous cable length: $L(t) = \|\mathbf{p}_{\text{enemy}} - \mathbf{p}_{\text{player}}\|$.
   - Equilibrium rest length: $L_0 = 110\text{ px}$; Maximum cable limit: $L_{\max} = 420\text{ px}$.
   - Spring stiffness: $k_s = 95.0\text{ N/px}$; Damping coefficient: $c_d = 8.5\text{ N}\cdot\text{s/px}$.
   - Non-linear strain-hardening elastic force:
     $$F_{\text{elastic}} = k_s \cdot (L - L_0) \cdot \left[1 + 3.2 \left(\frac{L - L_0}{L_{\max} - L_0}\right)^2\right]$$
   - Tension vector applied to tethered entity and player:
     $$\mathbf{F}_{\text{tension}} = -\max\left(0, \; F_{\text{elastic}} + c_d (\mathbf{v}_{\text{rel}} \cdot \hat{\mathbf{u}})\right) \hat{\mathbf{u}}, \quad \hat{\mathbf{u}} = \frac{\mathbf{p}_{\text{enemy}} - \mathbf{p}_{\text{player}}}{L}$$
3. **Hydraulic Motor Winch Retraction**:
   - Holding Winch Key (`Shift` / Secondary Action) reels in cable at $v_{\text{winch}} = 240\text{ px/s}$ down to minimum length $L_{\min} = 65\text{ px}$.
4. **Centripetal Whip & Wrecking Ball Collisions**:
   - Lateral player maneuvers impart angular velocity $\omega = (v_{x, \text{player}} - v_{x, \text{enemy}}) / L$.
   - Tangential speed: $v_t = |\omega| \cdot L(t) \ge 900\text{ px/s}$.
   - Slamming the tethered enemy into other hostile units deals kinetic collision damage:
     $$D_{\text{slam}} = 60 + \frac{1}{2} \mu_{\text{mass}} \cdot \left(\frac{v_t}{100}\right)^2 \quad (60\text{–}140\text{ dmg})$$
     destroying mobs and knocking back heavy enemies.
5. **Kinetic Slingshot (Catapult Eject)**:
   - Releasing the tether trigger at peak strain ($L \to L_{\max}$) snaps the spring, launching the tethered enemy upward with $+720\text{ px/s}$ bonus velocity.
   - The catapulted enemy becomes a piercing projectile, dealing $180$ kinetic impact damage to backline enemies before disintegrating.
6. **Electrical Conductivity Combo**:
   - If an electrical arc (Electric Eel, EMP shockwave, lightning hazard) touches either the cable or the tethered enemy, the saline-infused graphene cable conducts $1,200\text{ V}$ potential along its length, shocking the target for $+150\%$ critical damage and emitting an acoustic EMP burst ($R = 90\text{ px}$).
7. **Living Meat-Shield Mechanic**:
   - While tethered ahead of the player, the enemy's collision box intercepts descending hostile bullets, protecting the player submarine's hull.
8. **Cable Snap & Retrieval**:
   - If strain exceeds $1.0$ ($L > L_{\max}$ under violent lateral shear), cable snaps; winch automatically rewinds at $550\text{ px/s}$ ($0.6\text{ s}$ reload).

#### B. State Machine
```
[HARPOON_READY]
    │ (Fire Harpoon)
    ▼
[DART_IN_FLIGHT] (v = 650 px/s)
    ├── (Miss / Bounds Exceeded) ──► [AUTO_RETRACT] (v = 550 px/s) ──► [HARPOON_READY]
    │ (Hits Target)
    ▼
[TETHERED_LOCKED] 
    ├── (Hold Shift) ──────────► [WINCH_REELING] (Reeling in at 240 px/s)
    ├── (Rapid Lateral Move) ──► [CENTRIPETAL_WHIP] (Wrecking ball collision)
    ├── (Release at Strain > 0.85) ──► [KINETIC_SLINGSHOT] (Catapult upward, 180 dmg)
    ├── (Electric Arc Contact) ─────► [GALVANIC_SHOCK_PULSE] (+150% Crit, 90px EMP)
    │ (Target Dies / Cable Snaps)
    ▼
[AUTO_RETRACT] ──► [HARPOON_READY]
```

#### C. Audiovisual Blueprint
- **Visuals**: Dynamic 12-node Verlet physics cable with catenary sag. Color transitions based on strain:
  - $\text{Strain} < 0.50$: Glowing electric cyan (`#06b6d4`).
  - $0.50 \le \text{Strain} \le 0.80$: Warning amber (`#f59e0b`).
  - $\text{Strain} > 0.80$: Vibrating high-tension crimson (`#ef4444`).
- **Web Audio**: High-tension metal cable creak via frequency-modulated sawtooth wave with sudden upward pitch slide on slingshot release; pneumatic air piston launch thud; heavy metallic latch clank on impalement.

---

### Detailed Specification 4: Hydrothermal Vents & Deep Ocean Currents

#### A. Mechanics & Mathematical Modeling
1. **Chimney Geometry & Thermal Plume Cones**:
   - Seabed mineral chimney anchor: $(x_v, y_v = 760\text{ px})$, aperture width $W_0 = 44\text{ px}$.
   - Height ceiling cap: $y_{\text{cap}} = 100\text{ px}$.
   - Upward expanding conical core radius:
     $$R_{\text{core}}(y) = 22 + (760 - y) \cdot 0.08\text{ px}$$
   - Outer convective halo radius:
     $$R_{\text{halo}}(y) = R_{\text{core}}(y) \cdot 1.85$$
2. **Gaussian Thermal Gradient**:
   $$T(r, y) = T_{\text{ambient}} + (T_{\text{core}} - T_{\text{ambient}}) \cdot \exp\left(-\frac{r^2}{2 \sigma(y)^2}\right)$$
   with $T_{\text{core}} = 380^\circ\text{C}$, $T_{\text{ambient}} = 2^\circ\text{C}$, and $\sigma(y) = R_{\text{core}}(y) / 2$.
3. **Thermal Damage & Exposure Grace**:
   - **Player Vessel**:
     - Outer Halo ($R_{\text{core}} < r \le R_{\text{halo}}$): $0$ damage. Weapon heat dissipation boosted by **$+250\%$**.
     - Core Plume ($r \le R_{\text{core}}$): Thermal grace buffer of $0.50\text{ s}$ (hull insulation). If player lingers $> 0.50\text{ s}$, takes $1\text{ HP}$ per $1.25\text{ s}$.
   - **Hostile Entities**:
     - Core Plume: Rapidly melts organic chitin and robotic circuitry:
       $$\text{DPS}_{\text{enemy}} = 28 + 0.06 \cdot \text{MaxHP}_{\text{enemy}}$$
     - Suppresses boss shield regeneration by $100\%$ while inside plume.
4. **Hydrodynamic Updraft & Weapon Alterations**:
   - Plume updraft velocity field:
     $$\vec{u}_{\text{vent}}(y) = -360 \cdot \sqrt{\frac{y}{800}} \cdot \hat{j}\text{ px/s}$$
   - **Player Projectiles**: Bullets entering plume core transform into **Superheated Steam Lances**:
     - Speed boosted to $-680\text{ px/s}$.
     - Damage increased by $+35\%$.
     - Piercing count increased by $+1$.
   - **Enemy Projectiles**: Descending hostile bullets experience strong counter-buoyancy ($a_y = -520\text{ px/s}^2$), halting their descent and vaporizing them into bubbles within $0.35\text{ s}$.
5. **Periodic Geothermal Ejections (Mineral & Energy Buffs)**:
   - Eruption cycle: Every $12.0\text{ s}$, vent charges for $1.5\text{ s}$ (chimney glows bright orange) and expels:
     - **3–6 Polymetallic Mineral Nodules**: Drift upwards; collecting yields $+15$ Pure Water each.
     - **Hydrothermal Energy Cell**: Floats in halo; collecting instantly cools laser to $0\text{ HU}$, refills headlight battery to $100\%$, or grants $+30\%$ fire rate for $6.0\text{ s}$.
6. **Stratified Shear Currents**:
   - Horizontal velocity profile: Upper shelf ($y < 400$): $+75\text{ px/s}$ East; Lower shelf ($y \ge 400$): $-60\text{ px/s}$ West.
   - Applies fluid drag $a_x = \frac{1}{2} C_d \rho A (v_{\text{current}} - v_x)^2$, curving bullet paths into parabolic ballistic trajectories.

#### B. State Machine
```
[VENT_DORMANT] (Low bubbling, Halo cooling active)
    │ (Cycle timer: 10.5s elapsed)
    ▼
[VENT_SURGE_CHARGING] (t: 1.5s, Chimney vibrates, Red-orange magma core glow)
    │ (Charging complete)
    ▼
[VENT_ERUPTION_BLAST] (t: 3.0s, Supercritical updraft -1200px/s, Steam lances, Mineral ejection)
    │ (Eruption finished)
    ▼
[VENT_DORMANT] (Timer resets to 0)
```

#### C. Audiovisual Blueprint
- **Visuals**: Procedural vertical particle emitter: rising black sulfide mineral motes, expanding luminous steam bubbles (`#ffffff` with cyan rims). Refractive heat shimmer across plume column using sinusoidal canvas offset lines. Eruption launches spinning gold-copper mineral nodules.
- **Web Audio**: Deep continuous hydrothermal rumble using Brownian noise through dual resonant lowpass filters ($120\text{ Hz}$ and $240\text{ Hz}$, $Q=4.0$). Eruption produces high-pressure steam blast with bubbling pop transients.

---

### Detailed Specification 5: Biolapse Darkness Cycle & Photonic Searchlight

#### A. Mechanics & Mathematical Modeling
1. **4-Phase Darkness Cycle State Machine**:
   - **Phase 1: Diurnal Sunlight ($60.0\text{ s}$)**: Ambient Lux $L = 1.0$. Standard full canvas visibility.
   - **Phase 2: Twilight Dusk Transition ($5.0\text{ s}$)**:
     $$L(t) = 1.0 - \frac{t}{5.0}$$
     Muffled warning sonar ping teletype alert.
   - **Phase 3: Biolapse Midnight ($25.0\text{ s}$)**: $L = 0.0$. Total blackness (`#030712`); full darkness composite pass active.
   - **Phase 4: Dawn Resurfacing Transition ($5.0\text{ s}$)**:
     $$L(t) = \frac{t}{5.0}$$
     Ambient light restored; predator ambush frenzy ends.
2. **Headlight Geometry & Dynamic Inertial Tilt**:
   - Light source origin at submarine prow: $(x_p, y_p - 12)$.
   - Beam orientation angle:
     $$\theta_{\text{beam}} = -90^\circ + \left(\frac{v_{x, \text{player}}}{v_{\max}}\right) \cdot 15^\circ$$
   - Angular beam half-span: $\phi = 28^\circ$ (Standard Beam) / $38^\circ$ (High-Beam Overdrive).
   - Illumination distance governed by Battery $B \in [0, 100]$:
     $$R_{\text{beam}}(B) = 440 \cdot \left(0.35 + 0.65 \cdot \frac{B}{100}\right)\text{ px}$$
     At $100\%$ charge: $R_{\text{beam}} = 440\text{ px}$; at $0\%$ charge (reserve): $R_{\text{beam}} = 154\text{ px}$.
3. **Photometric Attenuation & Falloff**:
   - Light intensity at point $(x, y)$ with distance $d$ and relative angle $\Delta\theta$:
     $$I(d, \Delta\theta) = I_0 \cdot \left(1 - \frac{d}{R_{\text{beam}}}\right)^{1.35} \cdot \cos\left(\frac{\Delta\theta}{\phi} \cdot \frac{\pi}{2}\right)$$
4. **Battery Thermodynamics & Kinetic Hydro-Dynamo**:
   - *Light ON (Standard)*: $dB/dt = -4.0\text{ units/s}$ (lasts $25.0\text{ s}$).
   - *High-Beam Overdrive (Hold Key F)*: $dB/dt = -10.0\text{ units/s}$ (lasts $10.0\text{ s}$).
   - *Light OFF (Kinetic Dynamo)*:
     $$\frac{dB}{dt} = \begin{cases} +3.0\text{ units/s} & \text{if moving} \\ +1.2\text{ units/s} & \text{if stationary} \end{cases}$$
   - *Bioluminescent Phosphor Drops*: Defeated deep predators drop glowing photophore motes restoring $+15.0$ Battery Units upon pickup.
5. **Predator Ambush & Photonic Flash Shock**:
   - Unlit enemies in the dark have $+35\%$ dive velocity, invisible hitboxes/bodies, and cannot be acquired by Homing Missiles (only glowing eye photophores `#ef4444`/`#facc15` are visible).
   - Sweeping the headlight over an unlit enemy triggers **Photonic Flash Shock**:
     - Enemy is stunned for $0.8\text{ s}$.
     - Takes $+25\%$ vulnerability damage for $3.0\text{ s}$.
     - Fully acquires Homing Missile lock-on.
6. **Active Sonar Ping Reliance**:
   - While in total darkness, player can trigger an **Active Sonar Ping** (Key `Q` / Space / UI Sonar Button):
     - Sends expanding acoustic ring ($v_{\text{sonar}} = 480\text{ px/s}$).
     - Unveils all entities across entire screen as neon green wireframe outlines for $4.0\text{ s}$.

#### B. State Machine
```
[DIURNAL_SUNLIGHT] (t: 60s, L = 1.0)
    │ (t >= 60s)
    ▼
[TWILIGHT_DUSK] (t: 5s, L: 1.0 -> 0.0, Sonar chime)
    │ (t >= 5s)
    ▼
[BIOLAPSE_MIDNIGHT] (t: 25s, L = 0.0, Headlights & Photophores only)
    ├── (Toggle F) ─────────► [LIGHT_ON] (Battery -4/s)
    ├── (Hold F) ───────────► [HIGH_BEAM_OVERDRIVE] (Battery -10/s, +35% Cone)
    ├── (Toggle Light OFF) ──► [KINETIC_DYNAMO_RECHARGE] (Battery +3/s)
    └── (Trigger Ping) ─────► [ACTIVE_SONAR_SWEEP] (Wireframes revealed 4.0s)
    │ (t >= 25s)
    ▼
[DAWN_RESURFACING] (t: 5s, L: 0.0 -> 1.0)
    │ (t >= 5s)
    ▼
[DIURNAL_SUNLIGHT]
```

#### C. Audiovisual Blueprint
- **Visuals**: Fullscreen darkness layer using Canvas 2D `destination-out` composite mode to cut out radial/conical gradients. Unlit predators render only pulsing bioluminescent ocular dots. Dramatic dynamic shadows cast behind coral barricades.
- **Web Audio**: Solid mechanical relay switch click on toggling headlights; low-frequency $55\text{ Hz}$ transformer hum while lights are on; rising $4.8\text{ kHz}$ capacitor whine during High-Beam Overdrive.

---

### Detailed Specification 6: Submersible Modular Chassis & Deep-Sea Hangar

#### A. Mechanics & Mathematical Modeling
1. **6-Axis Normalized Stat Radar Framework ($0\text{–}100$)**:
   - **Speed ($S$)**: Lateral acceleration and maximum velocity ($180\text{–}420\text{ px/s}$).
   - **Armor/HP ($A$)**: Maximum hull integrity ($3\text{–}7\text{ Base HP}$) and flat damage reduction.
   - **Hardpoints ($H$)**: Mounting layout (Centerline, Dual Broadside, Wingtip Pods, Bio-Nodes).
   - **Energy/Cooldown ($E$)**: Weapon heat sink efficiency, battery capacity, ability recharge rates.
   - **Hitbox Profile ($B$)**: Physical collision area (Higher = smaller, safer profile).
   - **Salvage/Economy ($C$)**: Pure Water collection multiplier ($1.0\times \to 1.5\times$) and magnetosphere reach.
2. **Authoritative Hull Archetypes**:
   - **Chassis 1: Nautilus Dreadnought (Ironclad Dreadnought / Juggernaut Tank)**:
     - Stats: $S: 45, \; A: 95, \; H: 80, \; E: 50, \; B: 35, \; C: 60$.
     - Base HP: $7\text{ HP}$ (Max $9\text{ HP}$), Speed: $220\text{ px/s}$ ($-26.7\%$), Hitbox: $64 \times 46\text{ px}$.
     - Armor Plating: Flat $-1$ damage from common mobs (minimum $1$).
     - Hardpoints: Dual Broadside heavy mounts.
     - *Passive ("Aegis Bulkhead")*: When $\le 2\text{ HP}$, automatically releases a high-pressure steam shockwave clearing bullets in $120\text{ px}$ and granting $1.5\text{ s}$ invulnerability ($60\text{ s}$ cooldown).
   - **Chassis 2: Stingray Interceptor (Deep Recon / Speed & Evasion Glass Cannon)**:
     - Stats: $S: 95, \; A: 30, \; H: 65, \; E: 85, \; B: 90, \; C: 50$.
     - Base HP: $3\text{ HP}$ (Max $4\text{ HP}$), Speed: $420\text{ px/s}$ ($+40\%$), Hitbox: $38 \times 30\text{ px}$ ($-43\%$ area).
     - Fire Rate Multiplier: $+25\%$ faster attack speed.
     - Hardpoints: Centerline dorsal spinal mount.
     - *Passive ("Cavitation Slipstream")*: Lateral movement fills an overdrive meter; firing at $100\%$ unleashes a piercing cavitation lance granting $0.5\text{ s}$ i-frames.
   - **Chassis 3: Kraken Bioship (Bio-Symbiont / Organic Regeneration & Close-Quarters)**:
     - Stats: $S: 65, \; A: 60, \; H: 75, \; E: 70, \; B: 60, \; C: 70$.
     - Base HP: $5\text{ HP}$ (Max $6\text{ HP}$), Speed: $240\text{–}360\text{ px/s}$ pulsating, Hitbox: $50 \times 40\text{ px}$.
     - Environmental Immunity: $100\%$ immunity to Acid Rain and Toxic Phytoplankton blooms.
     - Hardpoints: Organic symbiotic bio-nodes.
     - *Passive ("Tentacle Sweep & Ink")*: Autonomous bio-tentacles lash out within $90\text{ px}$; taking damage releases a blinding ink cloud slowing enemy bullets by $60\%$ for $3.5\text{ s}$. Regenerates $+1\text{ HP}$ every $25\text{ s}$ out of combat.
   - **Chassis 4: Leviathan Harvester (Economy & Sustain Bruiser)**:
     - Stats: $S: 55, \; A: 80, \; H: 70, \; E: 60, \; B: 45, \; C: 95$.
     - Base HP: $6\text{ HP}$ (Max $7\text{ HP}$), Speed: $270\text{ px/s}$, Hitbox: $54 \times 42\text{ px}$.
     - Full-screen Pure Water magnetosphere; $+35\%$ currency from mobs, $+50\%$ from elites/bosses.
     - *Passive ("Pure Water Condenser")*: Every $100$ Water collected restores $+1\text{ HP}$ or empowers next 3 shots with explosive hydro-splash.
   - **Chassis 5: Ghost Stealth Sub (Stealth Recon / Ambush & Evasive Phasing)**:
     - Stats: $S: 75, \; A: 45, \; H: 60, \; E: 90, \; B: 75, \; C: 55$.
     - Base HP: $4\text{ HP}$ (Max $5\text{ HP}$), Speed: $320\text{ px/s}$, Hitbox: $46 \times 34\text{ px}$.
     - Invulnerability duration increased to $2.2\text{ s}$ (from $1.0\text{ s}$). Snipers have $40\%$ tracking delay.
     - *Passive ("Sonar Cloak")*: Ceasing fire for $1.5\text{ s}$ activates cloak ($70\%$ translucent); exiting cloak inflicts $300\%$ critical damage with a homing sonic wave.
3. **Hangar Screen Integration**:
   - Integrated into Pre-Wave 1 Menu and Continue Shop.
   - Interactive Canvas 2D Hexagonal Radar Chart with smooth spring animations when cycling between chassis.

#### B. Audiovisual Blueprint
- **Visuals**: Procedurally rendered vector silhouettes for each chassis:
  - *Nautilus*: Riveted iron plating, twin heavy turrets, massive ballast tanks.
  - *Stingray*: Sleek aerodynamic delta wings, glowing cyan thruster trails.
  - *Kraken*: Dark viridian aragonite carapace, breathing bioluminescent vents, undulating tentacles.
  - *Leviathan*: Heavy dredger scoops, amber warning lights, spinning hydro-cyclones.
  - *Ghost*: Angular stealth faceting, phase-shifting refractive cloak shimmer.
- **Web Audio**:
  - *Nautilus*: Deep low-frequency $45\text{ Hz}$ diesel/nuclear rumble.
  - *Stingray*: High-pitch $1.4\text{ kHz}$ electric turbine whine.
  - *Kraken*: Organic rhythmic wet pulse with low resonant squelch.
  - *Leviathan*: Heavy mechanical dredging gear rattle and water suction churn.
  - *Ghost*: Sub-bass phase modulation with whisper-quiet frequency cancellation.

---

### TypeScript Interface & Contract Specifications

```typescript
// ============================================================================
// WATER INVADER: ADVANCED ARSENAL, ENVIRONMENT & CHASSIS CONTRACTS (FEATURES 1-6)
// ============================================================================

import { Entity } from '../Entity';
import { Bullet } from '../Bullet';
import { Faction, Vector2D } from '../types';

// ----------------------------------------------------------------------------
// 1. Cavitation Torpedo Contracts
// ----------------------------------------------------------------------------

export enum TorpedoState {
  READY = 'READY',
  INERT = 'INERT',
  ARMED = 'ARMED',
  SINGULARITY = 'SINGULARITY',
  SHOCKWAVE = 'SHOCKWAVE',
  EXPIRED = 'EXPIRED',
}

export interface CavitationTorpedoConfig {
  v0: number;               // 180 px/s
  aCav: number;             // 420 px/s^2
  vMax: number;             // 580 px/s
  armDistance: number;      // 100 px
  vacuumDuration: number;   // 0.08 s (5 frames)
  vacuumRadius: number;     // 140 px
  pullForceConstant: number;// 85,000 px^3/s^2
  blastDuration: number;    // 0.27 s
  blastRadius: number;      // 150 px
  shockVelocity: number;    // 750 px/s
  baseDamage: number;       // 120 (Lv 1) to 300 (Lv 5)
  pushbackImpulse: number;  // 480 px/s
  barricadeAcousticRadius: number; // 85 px
}

export interface ICavitationTorpedo {
  state: TorpedoState;
  distanceTraveled: number;
  vacuumTimer: number;
  blastTimer: number;
  currentRadius: number;
  triggerRemoteDetonation(): boolean;
  update(deltaTime: number, hostiles: Entity[], hostileBullets: Bullet[]): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

// ----------------------------------------------------------------------------
// 2. Prism Laser Contracts
// ----------------------------------------------------------------------------

export enum LaserHeatZone {
  COOL = 'COOL',                 // 0-49 HU
  WARM = 'WARM',                 // 50-79 HU
  SUPERCHARGED = 'SUPERCHARGED', // 80-99 HU (+25% DPS)
  LOCKOUT = 'LOCKOUT',           // 100 HU (2.2s lockout)
}

export interface RefractionPrism {
  id: string;
  position: Vector2D;
  size: Vector2D;           // 24x24 px
  splitAngles: number[];    // [-35, 0, +35] degrees
  powerRatios: number[];    // [0.6, 0.7, 0.6]
  active: boolean;
}

export interface IPrismLaserSystem {
  heat: number;             // 0 to 100 HU
  isFiring: boolean;
  isLockedOut: boolean;
  lockoutTimer: number;     // 2.2 s
  activePrisms: RefractionPrism[];
  getHeatZone(): LaserHeatZone;
  deployPrism(x: number, y: number): boolean;
  update(deltaTime: number, inCoolingHalo: boolean, targets: Entity[]): void;
  drawBeam(ctx: CanvasRenderingContext2D, origin: Vector2D): void;
}

// ----------------------------------------------------------------------------
// 3. Hydraulic Harpoon & Tether Contracts
// ----------------------------------------------------------------------------

export enum HarpoonState {
  READY = 'READY',
  FLYING = 'FLYING',
  TETHERED = 'TETHERED',
  RETRACTING = 'RETRACTING',
}

export interface HarpoonTetherConfig {
  restLength: number;       // 110 px
  maxLength: number;        // 420 px
  springStiffness: number;  // 95.0 N/px
  damping: number;          // 8.5 N*s/px
  winchSpeed: number;       // 240 px/s
  launchSpeed: number;      // 650 px/s
  retractSpeed: number;     // 550 px/s
  slingshotBonus: number;   // 720 px/s
  slingshotDamage: number;  // 180 dmg
}

export interface IHydraulicHarpoon {
  state: HarpoonState;
  tetheredEntity: Entity | null;
  currentLength: number;
  strainRatio: number;      // 0.0 to 1.0+
  isWinching: boolean;
  fire(origin: Vector2D): boolean;
  startWinch(): void;
  stopWinch(): void;
  releaseSlingshot(): { entity: Entity; velocity: Vector2D; damage: number } | null;
  conductElectricalShock(voltage: number): void;
  update(deltaTime: number, playerPos: Vector2D, hostiles: Entity[]): void;
  draw(ctx: CanvasRenderingContext2D, playerPos: Vector2D): void;
}

// ----------------------------------------------------------------------------
// 4. Hydrothermal Vent & Ocean Currents Contracts
// ----------------------------------------------------------------------------

export enum VentState {
  DORMANT = 'DORMANT',
  CHARGING = 'CHARGING',
  ERUPTING = 'ERUPTING',
}

export interface MineralNodule {
  position: Vector2D;
  velocity: Vector2D;
  value: number;            // +15 Pure Water
  isDead: boolean;
}

export interface IHydrothermalVent {
  id: string;
  anchorX: number;          // e.g. 180 or 420 px
  baseY: number;            // 760 px
  capY: number;             // 100 px
  coreTemperature: number;  // 380 °C
  state: VentState;
  cycleTimer: number;
  getCoreRadius(y: number): number;
  getHaloRadius(y: number): number;
  isInCore(x: number, y: number): boolean;
  isInHalo(x: number, y: number): boolean;
  update(deltaTime: number, player: Entity, hostiles: Entity[], bullets: Bullet[]): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

// ----------------------------------------------------------------------------
// 5. Biolapse Darkness Cycle Contracts
// ----------------------------------------------------------------------------

export enum BiolapsePhase {
  DIURNAL = 'DIURNAL',      // 60s (Lux 1.0)
  TWILIGHT = 'TWILIGHT',    // 5s  (Lux 1.0 -> 0.0)
  MIDNIGHT = 'MIDNIGHT',    // 25s (Lux 0.0)
  DAWN = 'DAWN',            // 5s  (Lux 0.0 -> 1.0)
}

export interface IBiolapseManager {
  currentPhase: BiolapsePhase;
  phaseTimer: number;
  ambientLux: number;       // 0.0 to 1.0
  battery: number;          // 0 to 100 units
  isLightOn: boolean;
  isHighBeam: boolean;
  sonarPingActive: boolean;
  sonarPingTimer: number;
  toggleLight(): boolean;
  setHighBeam(active: boolean): void;
  triggerSonarPing(): boolean;
  isEntityIlluminated(entity: Entity, playerPos: Vector2D, playerVx: number): boolean;
  update(deltaTime: number, isMoving: boolean, enemies: Entity[]): void;
  renderDarknessOverlay(ctx: CanvasRenderingContext2D, playerPos: Vector2D, playerVx: number): void;
}

// ----------------------------------------------------------------------------
// 6. Submersible Modular Chassis Contracts
// ----------------------------------------------------------------------------

export enum ChassisId {
  NAUTILUS = 'NAUTILUS',     // Ironclad Dreadnought
  STINGRAY = 'STINGRAY',     // Deep Recon Interceptor
  KRAKEN = 'KRAKEN',         // Bio-Symbiont
  LEVIATHAN = 'LEVIATHAN',   // Economy Harvester
  GHOST = 'GHOST',           // Stealth Recon
}

export interface ChassisRadarStats {
  speed: number;            // 0-100
  armor: number;            // 0-100
  hardpoints: number;       // 0-100
  energy: number;           // 0-100
  hitboxProfile: number;    // 0-100 (higher = smaller)
  salvage: number;          // 0-100
}

export interface ChassisDefinition {
  id: ChassisId;
  nameKo: string;
  nameEn: string;
  description: string;
  baseHp: number;
  maxHp: number;
  baseSpeed: number;        // px/s
  hitboxWidth: number;      // px
  hitboxHeight: number;     // px
  radarStats: ChassisRadarStats;
  passiveName: string;
  passiveDescription: string;
  onTakeDamage?: (currentHp: number, incomingDamage: number) => { mitigatedDamage: number; triggeredEffect?: string };
  onUpdate?: (deltaTime: number, player: Entity) => void;
}
```

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Weapons | Cavitation Torpedo | Supercavitating acoustic torpedo with negative pressure vacuum suction and hyperbaric blast overpressure | Tap 1: Launch, Tap 2: Detonate (Key `C` / RMB) | Vacuum well ($r \le 140$), Blast ($r \le 150$, $120\text{–}300$ dmg), bullet erasure | If $d < 100\text{ px}$, deals $15$ blunt dmg without detonating | `IDEAS_PITCH.md:144-217` |
| 2 | Weapons | Prism Laser Array | Continuous Photic Lance raycast with thermal overheat and deployable quartz refraction prisms | Hold Space / LMB, Deploy Prism Key | Continuous beam ($16\text{–}48\text{ DPS}$), 3/5-way refraction ($190\%\text{ dmg}$) | Overheat ($100\text{ HU}$) triggers $2.2\text{ s}$ lockout and $-15\%$ speed | `IDEAS_PITCH.md:218-288` |
| 3 | Weapons | Hydraulic Harpoon | Pneumatic barbed grapple with harmonic spring tether, hydraulic winch, and kinetic slingshot | Fire: Harpoon Key, Winch: Hold Shift, Release: Slingshot | Physical tether constraint, meat-shield absorption, $180\text{ dmg}$ slingshot | If strain $> 1.0$, cable snaps; auto-retracts at $550\text{ px/s}$ | `IDEAS_PITCH.md:289-352` |
| 4 | Environment | Hydrothermal Vents | Benthic Black Smokers creating convective updrafts, steam lances, and periodic mineral ejections | Spatial position $(x, y)$, bullet intersection | Updraft $-360\text{ px/s}$, Steam Lance ($+35\%\text{ dmg}$, $+1\text{ pierce}$), $+250\%$ cooling | If player in core $> 0.5\text{ s}$, takes $1\text{ HP}$ per $1.25\text{ s}$ | `IDEAS_PITCH.md:353-422` |
| 5 | Environment | Biolapse Darkness Cycle | 4-phase ambient lux drop into pitch-black midnight with directional headlights and battery dynamo | Time cycle ($60\text{s}/5\text{s}/25\text{s}/5\text{s}$), Key `F` (Light/High-Beam) | Ambient Lux $0.0$, headlight cone ($440\text{ px}$), Photonic Stun ($0.8\text{ s}$) | Battery depletion ($0\%$) collapses beam range to $154\text{ px}$ | `IDEAS_PITCH.md:423-504` |
| 6 | Chassis | Modular Submersible Chassis | 5 specialized hull archetypes (Nautilus, Stingray, Kraken, Leviathan, Ghost) with 6-axis stat radar | Hangar UI selection in Pre-Game & Continue Shop | Altered base HP, speed, hitbox size, hardpoints, and signature passives | Invalid selection defaults safely to Nautilus Dreadnought | `IDEAS_PITCH.md:505-589` |
| 7 | Weapons (Discovered) | Cryo-Freezing Mines | Subzero mines freezing enemies for $3.2\text{ s}$; striking frozen targets triggers Acoustic Ice-Shatter | Mine deployment key, proximity $R_{\text{det}} = 42\text{ px}$ | Frozen state, $+200\%$ crit shatter into $8\text{–}12$ ice shards ($400\text{ px/s}$) | Expired mines self-dissolve without freezing allies | `IDEAS_PITCH.md:1027-1033` |
| 8 | Weapons (Discovered) | Electric Eel Arc Cannon | Instantaneous saline pilot stream discharging $1,200\text{ V}$ jumping across $3\text{–}8$ targets | Primary fire with Arc Cannon loadout | Cascading arcs ($14\text{–}38\text{ dmg}$), Bio-Galvanic Paralysis ($1.2\text{–}2.8\text{ s}$) | Attenuates by $16\%$ per jump; stops if nearest target $> 230\text{ px}$ | `IDEAS_PITCH.md:1034-1040` |
| 9 | Weapons (Discovered) | Aegis Remora Micro-Drones | Autonomous micro-subs in elliptical hydrodynamic orbit providing point-defense and sacrificial ablation | Passive drone bay deployment ($2\text{–}6$ drones) | Intercepts enemy bullets in $85\text{ px}$; absorbs fatal hit for player | Sacrificed drone requires $15\text{ s}$ bay reconstruction | `IDEAS_PITCH.md:1041-1049` |
| 10 | Weapons (Discovered) | Depth Charge Barrage | Hydrostatic barometric canisters detonating at preset depth $Y_{\text{fuse}}$ triggering seabed geysers | Fire canister key | $R = 110\text{ px}$ cavitation implosion + $70\text{ px}$ steam column ($16\text{ DPS}$) | Fused canisters cannot detonate before reaching $Y_{\text{fuse}}$ | `IDEAS_PITCH.md:1050-1056` |
| 11 | Environment (Discovered) | Deep Ocean Currents | Fluid vector field applying lateral drag $a_x = \frac{1}{2} C_d \rho A (v_c - v_x)^2$ | Continuous environmental update | Lateral conveyor ($\pm 60\text{ px/s}$), curved parabolic bullet trajectories | Clamped to screen boundary to prevent player clipping | `IDEAS_PITCH.md:1061-1067` |
| 12 | Environment (Discovered) | Sonar Blackout Zones | Murky pycnocline layers ($140\text{ px}$ high) occluding targets and disabling homing missile lock | Entity inside $[y_1, y_2]$ | Visual occlusion ($\Omega \in [0, 1]$), acoustic muting ($400\text{ Hz}$ LPF) | Active Sonar Ping reveals wireframes for $4.0\text{ s}$ | `IDEAS_PITCH.md:1068-1074` |
| 13 | Environment (Discovered) | Toxic Phytoplankton Blooms | Corrosive red tide cells damaging metal hulls while hyper-nourishing organic bio-invaders | Entity inside bloom radius | Metal hulls take $1\text{ HP} / 1.5\text{ s}$; bio-enemies heal $+8\%\text{ HP/s}$ | Destroying Algae Spore Pods with piercing fire halts cloud growth | `IDEAS_PITCH.md:1075-1081` |
| 14 | Environment (Discovered) | Oceanic Whirlpools | Rankine-Lamb-Oseen marine vortex with ergosphere and core pulling entities toward singularity | Position in $R_{\text{outer}} = 200\text{ px}$ | Radial pull $G_v = 320\text{ px/s}^2$, $25\text{ DPS}$ core crush, slingshot bullet curves | Reverse thruster escape vector required; core kills drop zero water | `IDEAS_PITCH.md:1082-1088` |
| 15 | Environment (Discovered) | Tectonic Seabed Rifts | Seismic fractures venting supercritical steam pillars ($1,200\text{ px/s}$) across full height | Eruption trigger ($2.2\text{ s}$ warning) | $50\text{ DPS}$ true damage, destroys both friend and foe, moves barricades $+45\text{ px}$ | Telegraph allows player to bait heavy bosses into fissure column | `IDEAS_PITCH.md:1089-1095` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Cavitation Torpedo | Player double-taps detonation immediately after firing ($d < 100\text{ px}$) | Torpedo is in inert safety window: detonation command is suppressed until $d \ge 100\text{ px}$ or deals 15 blunt damage on contact. |
| 2 | Cavitation Torpedo | Torpedo detonates while adjacent to player barricade ($\le 85\text{ px}$) | Sympathetic acoustic shock shatters 1–4 defensive voxel blocks ($15$ dmg); requires careful clearance shooting. |
| 3 | Cavitation Torpedo | 15 enemy bullets intersect expanding shockwave simultaneously | All 15 bullets are flagged `isDead = true` on the same tick, spawning purple spark particles without CPU bottleneck. |
| 4 | Prism Laser | Player holds trigger continuously for 5 seconds without letting go | Reaches $100\text{ HU}$ in $3.7\text{ s}$, triggers Thermal Lockout for $2.2\text{ s}$, cuts beam, inflicts $-15\%$ mobility, and vents steam. |
| 5 | Prism Laser | Player fires beam into player coral barricade | Barricade takes zero damage; silicate crystals act as low-efficiency prisms fanning out refracted beams at $120\%$ power. |
| 6 | Prism Laser | Player enters hydrothermal vent halo while at $95\text{ HU}$ | Cooling triples ($+250\%$); heat drops rapidly or stabilizes, allowing indefinite fire in the Supercharged zone (+25% DPS). |
| 7 | Hydraulic Harpoon | Player harpoons a Heavy Colossus and navigates to the opposite side of screen ($L > 420\text{ px}$) | Cable tension reaches peak elastic strain ($> 1.0$); cable snaps with metallic crack; winch auto-rewinds in $0.6\text{ s}$. |
| 8 | Hydraulic Harpoon | Player whips harpoon sideways with angular speed $\omega = 4.5\text{ rad/s}$ into common enemy mob | Slamming kinetic energy deals $140$ collision damage, obliterating the mob and slowing the tethered enemy's swing. |
| 9 | Hydraulic Harpoon | Lightning / EMP hazard strikes the tethered enemy | Saline graphene cable conducts $1,200\text{ V}$ to player vessel: if player has Acid Shield, energy is grounded; otherwise deals 1 HP and emits $90\text{ px}$ EMP. |
| 10 | Hydrothermal Vents | Player rests inside vent core for $0.4\text{ s}$, then moves to halo | Thermal grace buffer ($0.5\text{ s}$) protects player; zero damage taken, and weapon heat is purged. |
| 11 | Hydrothermal Vents | Descending enemy rail-mortar slug enters vent core plume | Updraft counter-buoyancy ($a_y = -520\text{ px/s}^2$) arrests descent and dissolves slug into harmless steam bubbles. |
| 12 | Biolapse Darkness | Player battery reaches 0% during Biolapse Midnight phase | Headlight drops into Emergency Reserve ($154\text{ px}$ range, low intensity); kinetic dynamo charges $+3\text{ U/s}$ while moving. |
| 13 | Biolapse Darkness | Homing missile fired at unlit enemy in total darkness | Missile cannot acquire target lock (target is invisible); flies straight up as a dumb rocket until enemy is illuminated. |
| 14 | Modular Chassis | Player selects Stingray Interceptor (Base HP: 3) on Wave 20 Piercing mob attack | Mob deals 2 piercing damage; player survives at 1 HP; high speed ($420\text{ px/s}$) allows weaving through bullet gaps. |
| 15 | Modular Chassis | Player selects Kraken Bioship during Acid Storm crisis | Acid rain droplets pass through player vessel harmlessly ($100\%$ natural bio-chitin immunity, saving $150$ Pure Water). |

---

## 5. Verification Method

To independently verify this specification and ensure zero regression:
1. **Type-Check & Compilation**:
   ```bash
   npm run build
   # or
   npx tsc --noEmit
   ```
2. **Dimension Invariant Integrity Verification**:
   - Verify `src/game/GameManager.ts` contains unchanged `logicalWidth = 600` and `logicalHeight = 800`.
   - Verify `src/game/Enemy.ts` maintains unchanged logical bounds checks.
3. **Playwright E2E Suite Execution**:
   ```bash
   npx playwright test
   ```
4. **Handoff Artifacts**:
   - `/Users/user/src/water-invader/.agents/pitch_spec_miner_1/handoff.md` (This authoritative specification)
   - `/Users/user/src/water-invader/.agents/pitch_spec_miner_1/DISPATCH.md` (Updated dispatch log)
   - `/Users/user/src/water-invader/.agents/pitch_spec_miner_1/progress.md` (Execution checklist and liveness heartbeat)

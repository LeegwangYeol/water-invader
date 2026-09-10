# Feature Proposal: Deep Trench Apex Predators (Stealth Camouflage & Ambush Stalkers)
**Author**: Specialist 4.3 — Swarm Domain 4 (Deep Trench Apex Predators & Abyssal Stalkers)  
**Target Repository**: `water-invader` (Next.js / Canvas 2D / Web Audio Engine)  
**Status**: Proposal / Brainstorming Deliverable  
**Date**: 2026-09-10  

---

## 1. Executive Concept & Psychological Hook

### 1.1 The Abyss Reclaimed: Subverting the Classical Shoot 'Em Up
In traditional arcade space-invader shooters, danger is overt, regimented, and descending in rigid grids. Even mid-tier monsters and raid bosses broadcast their presence via colossal health bars and heavy bullet patterns. 

**Deep Trench Apex Predators** fundamentally inverts this experience by introducing solitary, hyper-intelligent hunters that inhabit the Hadal Zone (6,000m – 11,000m abyss). Instead of overwhelming the player with bullet volume, the Apex Predator strikes with psychological dread, sudden lethality, and stealth warfare. The player is no longer simply shooting down targets; the player is being **actively stalked**.

### 1.2 Core Predator Archetypes

#### A. The Phantom Architeuthis (*Architeuthis Phantasma*)
- **Theme**: Ghost of the Mariana Trench. A 40-meter bioluminescent giant cephalopod equipped with dynamic chromatophore camouflage, optical metamaterial skin, and deceptive photophore arrays.
- **Behavioral Profile**: Patient, elusive, and cunning. It circles off-screen margins, casting optical illusion decoys and projecting false sonar pings to mislead player fire before thrusting serpentine feeding tentacles from the trench abyss.

#### B. The Hadal Megalodon (*Carcharodon Abyssalis*)
- **Theme**: The Apex Blind Devourer. A prehistoric cartilaginous apex monster whose eyes have atrophied in total darkness, replaced by massive lateral line ampullae of Lorenzini that track the player's acoustic signature, propeller cavitation, and weapon discharge.
- **Behavioral Profile**: A relentless ambush torpedo. It stalks outside the screen perimeter in wide elliptical orbits, generating hydro-acoustic disturbances before unleashing an explosive supersonic lunge directly through the player's firing lane.

#### C. The Abyssal Viper-Morph (*Bathysaurus Vorax*)
- **Theme**: The Trench Siphon Stalker. A segmented, needle-toothed ambush lurker that anchors itself to canvas border crevasses, blending invisibly into the darkness until uncoiling at lightning speed to snatch unwary players or smash defensive barricades.

### 1.3 The Stalking Dread: Audio-Visual Pacing Transition
When an Apex Predator enters the battlefield (Wave 15+, or during Trench Deep Dive events), the entire gameplay tempo shifts dramatically:
1. **The Vacuum Cue**: Normal enemy spawns cease or scatter to screen edges. 
2. **Acoustic Dampening**: Background music filters out into low-pass muffled silence (simulating extreme water pressure and acoustic blackout).
3. **Hydrophone Isolation**: The only audible sounds are the player's own thruster hum, distant metallic hull groans, and faint ultrasonic sonar clicks.
4. **Paranoia Factor**: The player must scan border water distortion, watch the HUD Sonar Reticle, and listen for hydro-acoustic cavitation pings to anticipate where the lethal strike will emerge.

---

## 2. Stealth & Ambush Mechanics

```
                   +-----------------------------------------------+
                   | SCREEN PERIMETER (Off-Screen Prowl Zone)       |
                   |                                               |
                   |      [Off-Screen Apex Predator Orbit]         |
                   |      - Silent drift at v = 280 px/s           |
                   |      - Emits faint ripple wakes into screen   |
                   +-----------------------------------------------+
                                          |
                      +-------------------+-------------------+
                      | (Telemetry: Threat Bearing 285°)     |
                      v                                       v
    +----------------------------------+    +----------------------------------+
    | AMBUSH VECTOR A: HIGH-SPEED CUT  |    | AMBUSH VECTOR B: TENTACLE GRAB   |
    | - Translucent refraction ripple  |    | - Twin siphon tentacles shoot    |
    | - Thermal eye gleam at edge      |    |   from bottom/side borders       |
    | - Linear supersonic lunge        |    | - Drags barricades or player     |
    | - 2.5x kinetic piercing damage   |    | - Severable by concentrated fire |
    +----------------------------------+    +----------------------------------+
                      |                                       |
                      +-------------------+-------------------+
                                          |
                                          v
                   +-----------------------------------------------+
                   | INK DECOY ILLUSION (Defensive Disengagement)   |
                   | - Spawns bioluminescent decoy phantom         |
                   | - Generates false radar signature & hitbox    |
                   | - Explodes on impact with blinding smoke      |
                   +-----------------------------------------------+
```

### 2.1 Active Cloaking Refraction Engine (Snell's Law Simulation)
Rather than a simple alpha fade, the predator employs **Refractive Metamaterial Cloaking**:
- **Visual Mechanics**: The predator renders as a subtle, fluid distortion of the canvas background. Light passing through its body is refracted based on a 2D normal-map disturbance formula:
  $$\Delta x = A \cdot \sin(k_y \cdot y + \omega \cdot t), \quad \Delta y = A \cdot \cos(k_x \cdot x + \omega \cdot t)$$
  Where $A = 3.5\text{ px}$ (displacement amplitude), $k = 0.04$ (spatial frequency), and $\omega = 4.2\text{ rad/s}$.
- **Canvas Implementation Technique**:
  - Implemented using Canvas 2D composition: drawing a semi-transparent caustic refraction overlay using `globalCompositeOperation = 'screen'` and `'luminosity'` with alpha oscillating between $0.04$ and $0.12$.
  - When stationary or gliding slowly, cloaking is $92\%$ effective; when accelerating into an ambush lunge, cavitation bubbles strip the cloaking envelope, dropping camouflage to $30\%$ visibility.
- **Bullet Evasion & Phase State**:
  - In cloaked stealth, standard kinetic shots have a $60\%$ deflection chance (water sheer deflecting bullets around its streamlined gelatinous mantle).
  - Heavy weaponry, homing missiles, or sonar-illuminated strikes bypass this deflection entirely.

### 2.2 Perimeter Prowling & Multi-Axis Ambush Trajectories
Unlike standard enemies that enter from the top edge and follow predefined rows or zig-zags, Apex Predators utilize full **Border Incursion Mechanics**:
1. **The Prowl State (Off-Screen Elliptical Orbit)**:
   - Position coordinates exist outside the logical canvas: $x \in [-120, -20] \cup [740, 840]$ or $y \in [-120, -20] \cup [980, 1080]$.
   - The entity moves smoothly along an off-screen Bezier spline curve, tracking player movement and hunting for vulnerabilities (e.g., when the player is pinned down by minor mobs or low on ammunition).
2. **The Supersonic Lunge (The Jaws Vector)**:
   - Once a strike window opens, the predator locks a trajectory line through the player's anticipated position (predictive lead calculation: $P_{\text{target}} = P_{\text{player}} + V_{\text{player}} \cdot t_{\text{intercept}}$).
   - Traverses the entire screen in $0.75$ seconds ($v \approx 1200\text{ px/s}$), dealing massive kinetic contact damage and destroying any barricades in its direct path.
3. **Abyssal Constriction / Tentacle Snatch**:
   - The Phantom Squid extends two barbed feeding tentacles from the left and right screen borders toward the player's current $X$-coordinate.
   - If tentacles clamp onto the player, ship movement speed is slowed by $65\%$ while dragging the player downward into the abyss (dealing $15\text{ DPS}$).
   - **Counterplay**: Shooting the tentacles (each tentacle has $120\text{ HP}$) severs them, releasing the player and dealing $300$ backlash damage to the predator.

### 2.3 Ink Decoy Illusions & Photophore Hallucinations
When the predator drops below $75\%$, $50\%$, and $25\%$ HP, or when targeted by more than 4 player homing missiles simultaneously, it activates its **Emergency Camouflage Countermeasure**:
- **Bioluminescent Ink Cloud**: Deploys a deep-black particle cluster that expands to a radius of $140\text{ px}$. The ink absorbs laser fire and breaks player homing missile lock-ons (missiles re-route toward the center of the ink cloud).
- **Phantom Decoy Entity (`RogueDecoyPhantom`)**:
  - Inside the ink cloud, a decoy clone emerges, emitting identical bioluminescent flickering and moving outward in the opposite direction of the true predator.
  - The decoy possesses a duplicate radar blip on the HUD and can absorb up to $200$ damage.
  - Upon destruction, the decoy detonates into a phosphorescent flash, inducing a $1.5\text{s}$ HUD bloom and visual disorientation, while the genuine predator cloaks and resets its ambush vector behind the player.

---

## 3. Telegraphing & Multi-Sensory Counterplay

To ensure the encounter feels thrilling, tense, and fair rather than frustrating or arbitrary, every ambush lunge features a strict, layered 3-stage telegraph sequence.

```
Time:   t = -1.8s                     t = -0.6s              t = 0.0s             t = +0.75s
Event:  [Water Ripple Waves] ------> [Thermal Eye Gleam] -> [Lunge Commit] -----> [Recovery/Stun]
Phase:  Stage 1: Warning            Stage 2: Critical Lock  Stage 3: Strike       Stage 4: Vulnerability
Player: Reposition ship             Prepare Parry / Shoot   Evade Trajectory      Punish with Full DPS
```

### 3.1 Stage 1: Disturbed Water Ripple Telegraphs ($t = -1.8\text{s}$ to $-0.6\text{s}$)
- **Hydrodynamic Displacement Waves**:
  - At the border where the predator is coiling to strike, concentric hydrodynamic shockwaves ripple inward onto the visible canvas.
  - Rendered as expanding caustic ellipses with fading opacity:
    $$R(t) = R_0 + v_{\text{wave}} \cdot \Delta t, \quad \alpha(t) = 0.7 \cdot \left(1 - \frac{\Delta t}{T_{\text{stage1}}}\right)$$
  - Accompanying bubble particle streams bubble vigorously toward the surface, signaling high cavitation pressure.
- **Audio Telegraph**:
  - Low-frequency subterranean sub-rumble ($50\text{Hz} - 80\text{Hz}$) begins panning toward the audio channel corresponding to the entry border (left ear vs. right ear in stereo).

### 3.2 Stage 2: Thermal Photophore Eye Gleam ($t = -0.6\text{s}$ to $0.0\text{s}$)
- **The Visual "Flash of Intent"**:
  - At exactly $600\text{ms}$ before kinetic release, two piercing bioluminescent photophores ignite in the blackness just beyond the border.
  - Rendered with a high-intensity radial flare (`#00f5d4` cyan for Architeuthis, `#ff0055` crimson for Megalodon) with a sharp $45^\circ$ anamorphic lens flare streak across the screen.
- **Trajectory Ray Forecast**:
  - A razor-thin phosphorescent guide streak (0.5px line width, alpha 0.25) flashes along the exact strike vector for $200\text{ms}$, giving sharp-eyed players the precise geometric dodge angle.

### 3.3 Stage 3: The Parry / Interrupt Stagger Window ($t = -0.3\text{s}$ to $0.0\text{s}$)
- **High-Risk, High-Reward Counterplay ("Hydrodynamic Stagger")**:
  - If the player fires a weapon into the predator's eye-gleam coordinates during the final $300\text{ms}$ window before launch:
    1. **Parry Trigger**: A resounding metallic water-hammer chime sounds (`SoundManager.playHydroStagger()`).
    2. **Ambush Interrupted**: The predator's charge collapses; it is violently knocked into the center of the screen in a state of **Sensory Stun** for $2.8\text{s}$.
    3. **Vulnerability State**: In Sensory Stun, all cloaking fails, armor drops by $50\%$, and player attacks deal **$2.0\times$ Critical Damage**.
  - If the player fails to parry, dodging perpendicularly (moving along the transverse axis) is required to clear the $80\text{px}$ strike hitbox.

### 3.4 Environmental Counterplay: Barricade Absorption
- If the player takes refuge directly behind one of the central defensive barricades:
  - The Apex Predator's lunge impact is absorbed by the barricade block.
  - The barricade absorbs the kinetic force, losing $60$ durability, while the predator is deflected backwards, preventing player HP loss and granting a $1.2\text{s}$ recovery window.

---

## 4. Visual Aesthetics & Audio Architecture

### 4.1 Visual Rendering Pipeline (Canvas 2D Specification)

| State | Canvas Composite Mode | Primary Palettes | Visual FX Elements |
| :--- | :--- | :--- | :--- |
| **Prowling (Off-Screen)** | N/A (Off-Screen) | `#020617` (Deep Navy) | Perimeter edge glow, micro-ripples, bubble cavitations entering canvas edge |
| **Refraction Cloak** | `globalCompositeOperation = 'screen'` | `#0f172a`, `#38bdf8` (Alpha 0.08–0.14) | Sinusoidal coordinate distortion, spectral translucent silhouette, chromatic edge fringe |
| **Ambush Telegraph** | `globalCompositeOperation = 'source-over'` | `#00f5d4` (Cyan) / `#ff0055` (Crimson) | Concentric shockwave rings, anamorphic lens flares, high-intensity photophore dots |
| **Supersonic Strike** | `globalCompositeOperation = 'lighter'` | `#e0f2fe`, `#0284c7`, `#ffffff` | Speed trail afterimages (5 trailing copies decaying in alpha), cavitation vapor cone |
| **Sensory Stun / Exposed** | `globalCompositeOperation = 'source-over'` | `#1e293b` (Obsidian), `#38bdf8` (Bio-Vents) | Fully opaque textured sprite, flashing hit white on damage, leaking bioluminescent particles |

```
    [CLOAKED SILHOUETTE RENDERING CODE BLUEPRINT]
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.12 + Math.sin(this.stalkTimer * 6) * 0.04;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 15;
    // Draw fluid organic bezier outline of predator body and tentacles
    ctx.stroke(this.predatorPath);
    ctx.restore();
```

### 4.2 Web Audio API Procedural Sound Architecture
To preserve lightweight client performance with zero asset loading overhead, all audio cues are procedurally synthesized in real time via the browser's `AudioContext`.

```
[Web Audio Synthesis Graph for Apex Predator Roar]

  +-----------------------+
  | OscillatorNode 1      |
  | Sawtooth: 45Hz -> 25Hz|--+
  +-----------------------+  |
                             |      +---------------------+      +---------------------+      +----------------------+
  +-----------------------+  +----->| BiquadFilterNode    |----->| WaveShaperNode      |----->| GainNode             |---> AudioContext
  | OscillatorNode 2      |  |      | Lowpass: Fc = 140Hz |      | Distortion Curve    |      | Attack: 0.1s         |     Destination
  | Square: 65Hz -> 30Hz  |--+      | Resonance Q = 8.5   |      | Soft Clipping (k=4) |      | Decay: 2.2s          |
  +-----------------------+  |      +---------------------+      +---------------------+      +----------------------+
                             |
  +-----------------------+  |
  | AudioBufferSource     |--+
  | White Noise (Hydro)   |
  +-----------------------+
```

#### Audio Event Specifications:
1. **The Abyssal Leviathan Hydrophone Roar (`playAbyssalRoar()`)**:
   - Two low-frequency oscillators (Sawtooth at $45\text{Hz}$ ramping down to $25\text{Hz}$ and Square at $65\text{Hz}$) mixed with filtered white noise to simulate super-massive water displacement.
   - Filtered through a resonant low-pass filter at $140\text{Hz}$ ($Q = 8.5$), producing the bone-rattling sub-bass shudder of a deep-sea creature roaring into a naval hydrophone.
   - Master volume drops other music/SFX by $-12\text{dB}$ via dynamic gain ramping (`ducking`), creating a stark acoustic void.
2. **The Cavitation Shockwave Lunge (`playCavitationSwoosh()`)**:
   - Sweeping bandpass filter ($200\text{Hz} \to 3,800\text{Hz} \to 300\text{Hz}$ over $750\text{ms}$) across a white noise generator.
   - Recreates the supersonic rip of water boiling into vacuum bubbles under immense kinetic thrust.
3. **The Photophore Hum (`playPhotophoreGleam()`)**:
   - Pure sine tone at $2,400\text{Hz}$ modulated by a $7\text{Hz}$ low-frequency oscillator (vibrato depth $40\text{Hz}$), mimicking the eerie electric charge of bioluminescent photophores firing.
4. **The Hydro-Dynamic Parry Stagger (`playHydroStagger()`)**:
   - High-Q resonant chime at $880\text{Hz}$ transitioning into a decaying $110\text{Hz}$ water-bell thud, rewarding player timing with an immediate visceral acoustic confirmation.

---

## 5. UI Sonar Anomaly Warning Reticle

When the predator is stalking off-screen, the player's primary early-warning defense is the tactical **Sonar Anomaly Tracking HUD**.

```
                           CANVAS HEADER / HUD
   [SCORE: 184,200]   [WAVE: 18 - HADAL TRENCH]   [LIVES: [X][X][X]]
+-----------------------------------------------------------------------+
|                                                                       |
|  /\                                                                   |
| ( ! ) <--- [SONAR ANOMALY RETICLE: BEARING 310°]                     |
|  \/        - Distance: 340m (Amber Warning)                          |
|            - Vector: Intercepting @ 45°                              |
|                                                                       |
|                                                                       |
|                     [PLAYER SUBMARINE]                                |
|                            /|\                                        |
|                                                                       |
|                                                                       |
|  === BARRICADE ===    === BARRICADE ===    === BARRICADE ===          |
|                                                                       |
+-----------------------------------------------------------------------+
| LOG: WARNING: CLASS-IV BIO-ACOUSTIC SIGNATURE DETECTED IN HADAL RIFT   |
+-----------------------------------------------------------------------+
```

### 5.1 Dynamic Perimeter Clamping Geometry
The reticle icon tracks the predator's true off-screen coordinate $(X_{\text{pred}}, Y_{\text{pred}})$ and clamps its display position to an inner safety margin within the screen:
$$X_{\text{reticle}} = \operatorname{clamp}(X_{\text{pred}}, M_x, W - M_x), \quad Y_{\text{reticle}} = \operatorname{clamp}(Y_{\text{pred}}, M_y, H - M_y)$$
Where $W = 720, H = 960$, and margin $M = 32\text{ px}$.

### 5.2 Threat Level State Machine & Visual Indication

| Threat Phase | Distance / Condition | Reticle Appearance | Audio Cue | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Distant Contact** | $d > 600\text{ px}$ | Thin cyan chevron (`#38bdf8`), slow pulsing ($1.0\text{Hz}$) | Slow ambient ping ($0.5\text{Hz}$) | Keep moving, monitor bearing |
| **Phase 2: Stalking Vector** | $250\text{ px} \le d \le 600\text{ px}$ | Amber diamond reticle (`#f59e0b`), rotating tick marks ($2.5\text{Hz}$) | Medium-pitch double ping | Check barricade alignment |
| **Phase 3: Ambush Committed** | $d < 250\text{ px}$ (Pre-lunge) | Flashing crimson skull reticle (`#ef4444`), expanding strobe ring | High-pitch rapid sonar alarm ($8\text{Hz}$) | Align parry shot or execute evasion |

### 5.3 Active Pulse Sweep Mechanic
Every $2.5$ seconds, the player's ship emits an acoustic sonar pulse:
- An expanding cyan ring (`radius += 400 * dt`, alpha fades to 0) travels across the canvas.
- When the pulse intersects the cloaked predator (even off-screen or in refraction), it illuminates a bright, momentary **Acoustic Footprint** (a spectral silhouette ghost lasting $0.6\text{s}$), stripping its evasion bonus and granting the player precise aim data.

---

## 6. Synergies with Sonar Blackout, Crisis Mechanics & Feasibility

### 6.1 Synergy Matrix with Existing Crises & Events

| Crisis / Hazard Event | Mechanic Interaction | Emergent Gameplay Impact |
| :--- | :--- | :--- |
| **EMP Disruption** | Disables HUD Sonar Anomaly Reticle and radar pings for $6.0\text{s}$. | **Pure Instinct Survival**: Player must rely entirely on subtle water ripple graphics, bubble streams, and stereo hydrophone audio cues to survive ambushes. |
| **Acid Storm** | Corrosive acid rain reduces canvas contrast and damages surface barricades. | Forces player down into the lower half of the screen, right into the primary hunting lanes of the Hadal Megalodon. |
| **Titan Horde / Swarm Blitz** | Screen filled with dense small mobs. | The Apex Predator acts as a pack leader or opportunistic scavenger, lunging through both player and alien ranks (inflicting friendly-fire crush damage on minor invaders in its path). |
| **Abyssal Leviathan Crisis** | The Apex Predator spawns as an agile sub-lieutenant / vanguard for the End-Game Crisis Sovereign. | Forces the player to juggle dodging the Sovereign's cosmic rift attacks while tracking an agile invisible stalker. |

### 6.2 Architectural Feasibility & Non-Destructive Code Integration
The proposed feature adheres rigorously to the existing Next.js / TypeScript architecture and all repository constraints:

1. **Strict Invariant Adherence**:
   - **ZERO modifications to `logicalWidth` (720) or `logicalHeight` (960)** in `GameManager.ts`. The predator's trajectory calculations and off-screen prowl boundaries operate strictly within mathematical extensions of the coordinate system without altering canvas aspect ratios or logical boundaries.
2. **Object-Oriented Hierarchy Compatibility**:
   - Implemented as a clean subclass: `class ApexPredator extends Enemy`.
   - Reuses existing `Faction.ROGUE` or `Faction.INVADER`, allowing clean integration with existing collision detection (`checkCollision`, `takeDamage`) and bullet interactions.
3. **Zero Asset Burden & Instant Loading**:
   - Uses procedural Canvas 2D vector pathing and mathematical wave distortion rather than large external video/sprite files.
   - Audio is generated entirely via standard Web Audio API oscillators, biquad filters, and buffer noise sources within `SoundManager`, ensuring $0\text{ KB}$ network asset footprint and sub-millisecond initialization.
4. **Performance & Garbage Collection Safety**:
   - Decoys and tentacle segments utilize fixed-size object pools (`MAX_TENTACLES = 4`, `MAX_INK_PARTICLES = 50`), ensuring zero dynamic heap allocations in the inner animation frame loop (`requestAnimationFrame`) to guarantee a locked 60 FPS on mobile and desktop devices.

---

## 7. Summary of Player Impact & Value Proposition

1. **Unmatched Atmosphere**: Transforms Water Invader from a standard arcade shooter into a gripping, atmospheric deep-sea survival experience.
2. **Elevated Skill Ceiling**: The multi-tiered telegraph and parry/interrupt mechanics reward observation, reaction time, and tactical spatial control.
3. **High Replayability**: Randomly randomized ambush trajectories and emergent interactions with crises create unpredictable, heart-pounding encounters in every run.

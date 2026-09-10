# Feature Proposal: CRT Retro-Sonar HUD, Tactical Radar Minimap & Target Lock Reticles
**Specialist 6.5 — Swarm Focus: CRT Retro-Sonar Radar Minimap & Target Lock Reticles**  
**Project:** Water Invader (Next.js / HTML5 Canvas / Web Audio API)  
**Status:** Feature Pitch & Architectural Proposal (Ideation Phase — No Source Code Modified)  
**Target Proposal Document:** `/Users/user/src/water-invader/.agents/swarm_d6_radarcrt_5/report.md`

---

## Executive Summary

*Water Invader* places the player in command of the last automated aquatic defense battery protecting humanity’s pure water aquifer against relentless alien invaders and rogue cybernetic incursions. While the current game boasts intense projectile combat, dynamic crises, and homing missiles, the player interface currently relies on standard flat UI overlays.

This proposal introduces the **"Aegis Retro-Sonar CRT Tactical Combat Interface"**: a comprehensive visual, auditory, and mechanical overhaul that transforms the player's viewport into the high-tech cockpit of a Cold War deep-sea bathyscaphe / hunter-killer submarine. 

### Core Value Pillars:
1. **Atmospheric Immersion:** Authentic CRT curvature, raster scanline decay, and phosphor persistence create an irresistible retro-tactical aesthetic.
2. **Combat Precision:** Dynamic kinematic lead-prediction reticles and missile lock-on brackets empower players with tactical foresight against agile, diving foes.
3. **Situational Awareness:** A circular sonar minimap with real-time radial sweep tracks off-screen flankers, rogue airdrops, and incoming projectile vectors before they enter the kill-zone.
4. **Symbiotic Integration:** Direct mechanical synergy with the existing `HomingMissile` weapon system, providing clear visual acquisition, multi-target painting, and zero impact on core logical canvas bounds (`600x800`).

```
+========================================================================================+
| [AEGIS-IV SUB-COMMAND CONSOLE - 600 x 800 LOGICAL VIEWPORT]                            |
|                                                                                        |
|  [DEPTH GAUGE]     [REACTOR LOAD]                           [RADAR SONAR SWEEP]        |
|  /-----------\     /------------\                          /--------[000°]-------\     |
| |   1,420 m   |   | TEMP: 68°C   |                        |           |    *(E)   |    |
| | PSI: 142.8  |   | [||||||....] |                        |           |  /        |    |
|  \-----------/     \------------/                         |   *(F)    | / SWEEP   |    |
|                                                           |-----------+-----------|    |
|   PURE WATER INTEGRITY: 98.4%                             |  (ALLIES) |     .     |    |
|   ===========================                             |           |           |    |
|                                                            \--------[180°]-------/     |
|                                                                STATUS: ACTIVE SCAN     |
|                                                                                        |
|              LEAD INTERCEPT PIP                                                        |
|                      ( * )  <-- p_lead = p_e + v_e * t*                                |
|                        ^                                                               |
|                        |                                                               |
|                 [-- + --]   <-- STAGE 2 HARD LOCK-ON BRACKETS                          |
|                /  ELITE  \      TELEMETRY: RANGE 340m | CLOSING: +45m/s                |
|                \  DIVER  /                                                             |
|                                                                                        |
|                                                                                        |
|                                                                                        |
|       ======================== CENTRAL BARRICADES ========================             |
|          [ICE BARRICADE]        [STONE PILLAR]         [ICE BARRICADE]                 |
|             (HP: 85%)              (HP: 100%)             (HP: 60%)                    |
|                                                                                        |
|                                      / \                                               |
|                                     |===|                                              |
|                              [PLAYER SUB-BATTERY]                                      |
|                                 (x_p, y_p)                                             |
+========================================================================================+
```

---

## 1. Concept & Hook: The Cold War Submarine Aesthetic

### 1.1 The Narrative & Aesthetic Hook
In 1984, the deep-sea bathyscaphe defense platform *"Aegis-IV"* was submerged to safeguard Earth's abyssal freshwater aquifers. The user interface does not feature pristine modern holographic UI; instead, it is an analog-digital hybrid constructed from heavy military-grade brass dials, vacuum-tube cathode ray tubes (CRTs), and long-persistence P1 phosphor screens.

This aesthetic bridges retro-futuristic arcade nostalgia (*Battlezone*, *Missile Command*, *The Hunt for Red October*) with modern high-octane bullet-hell dynamics.

### 1.2 Visual Components of the Cockpit Frame
The HUD wraps the gameplay area with three immersive structural layers:

1. **Curved CRT Monitor Bezel (Barrel Distortion & Glare):**
   - **Curvature Effect:** Subtle convex spherical distortion ($k_1 \approx 0.04$) applied either via an ambient CSS vignette filter or a fast canvas border mask.
   - **Corner Cutoffs & Glass Bezel:** Heavy rubberized matte bezel frame along the canvas perimeter (`#111827` to `#030712`) with authentic socket screws and rounded interior screen corners (`border-radius: 18px`).
   - **Convex Specular Highlight:** An ambient glare arc in the top-left corner simulating interior cabin light bouncing off thick leaded cathode-ray glass (`rgba(255, 255, 255, 0.04)`).

2. **Phosphor Raster Scanlines & Shadow Mask:**
   - **Interlaced Scanlines:** Alternating 1px horizontal raster lines with 85% opacity on dark bands, refreshed at 60Hz.
   - **Aperture Grille / Shadow Mask:** Microscopic subpixel phosphor triad pattern (`RGB` or monochrome phosphor pitch) giving bright bullets and laser beams physical luminescence.
   - **Phosphor Bloom:** Saturated glows around high-energy entities (bosses, plasma beams, explosions) that bleed realistically into adjacent scanlines.

3. **Tactile Cockpit Dials & Gauges:**
   - **Hydrostatic Depth & Pressure Gauge:** Located at top-left (`x = 24, y = 20`). Displays current dive depth (scaling dynamically with game wave: $\text{Depth} = 500\text{m} + (\text{Wave} \times 150\text{m})$) with an analog oscillating pressure needle.
   - **Purification Reactor Thermals:** An analog temperature dial showing reactor load (heats up during rapid firing or high Combo chains; cools during lulls).
   - **Missile Silo Telemetry:** Digital nixie-tube or LED segment readouts showing remaining missile battery readiness and lock acquisition status (`SILO 1: READY`, `SILO 2: LOCKING`).

---

## 2. Target Acquisition UI: Lead Prediction & Lock Reticles

### 2.1 The Kinematic Lead-Prediction Calculation
High-tier enemies in *Water Invader* (such as `DIVER`, `ZIGZAG`, and `ROGUE_STALKER`) move at rapid, erratic velocities, often diving downward at speeds exceeding $250\text{ px/s}$. A static reticle is inadequate; the Aegis HUD calculates the exact **lead intercept vector** for player weapons.

#### Mathematical Formulation:
Let the player's firing origin be $\mathbf{p}_p = (x_p, y_p)$ and projectile muzzle velocity be $v_b \approx 500\text{ px/s}$ directed upward.  
Let the target enemy's position be $\mathbf{p}_e = (x_e, y_e)$ and its instantaneous velocity vector be $\mathbf{v}_e = (v_{ex}, v_{ey})$.

The bullet must intercept the enemy at time $t^*$ such that:
$$\|\mathbf{p}_e + \mathbf{v}_e t^* - \mathbf{p}_p\| = v_b t^*$$

Expanding into quadratic form:
$$(\|\mathbf{v}_e\|^2 - v_b^2)(t^*)^2 + 2((\mathbf{p}_e - \mathbf{p}_p) \cdot \mathbf{v}_e) t^* + \|\mathbf{p}_e - \mathbf{p}_p\|^2 = 0$$

Let:
$$A = \|\mathbf{v}_e\|^2 - v_b^2 = (v_{ex}^2 + v_{ey}^2) - v_b^2$$
$$B = 2 \Big((x_e - x_p)v_{ex} + (y_e - y_p)v_{ey}\Big)$$
$$C = (x_e - x_p)^2 + (y_e - y_p)^2$$

Discriminant:
$$\Delta = B^2 - 4AC$$

If $\Delta \ge 0$, the smallest positive real root $t^* = \frac{-B - \sqrt{\Delta}}{2A}$ yields the exact time-to-impact.  
The predicted lead reticle position $\mathbf{p}_{\text{lead}}$ is rendered at:
$$\mathbf{p}_{\text{lead}} = \mathbf{p}_e + \mathbf{v}_e t^* = \Big(x_e + v_{ex} t^*, \; y_e + v_{ey} t^*\Big)$$

```
Target Position [Enemy]  (x_e, y_e)
        \
         \  Velocity Vector v_e
          \
           v
      ( o )  <--- PREDICTED LEAD POINT (p_lead)
        ^
        |
        |  Bullet Path (Speed v_b)
        |
     [Player] (x_p, y_p)
```

### 2.2 Multi-Stage Acquisition & Locking Pipeline
The reticle transitions across four tactile states, providing instant cognitive feedback:

| Lock Stage | Visual Presentation | Trigger Condition | Tactical Utility |
| :--- | :--- | :--- | :--- |
| **Stage 0: Passive Scan** | Faint dashed concentric circle ($r = 24\text{px}$, 30% alpha) following the nearest threat within player weapon arc ($|\Delta x| \le 120\text{px}$). | Player within engagement cone. | Identifies default primary fire target. |
| **Stage 1: Acquiring** | Four L-shaped corner brackets collapsing inward from $r=40\text{px}$ to $r=20\text{px}$ over 0.25s with tracking tick marks. | Homing Missile upgrade owned (`homingMissiles > 0`) and target within range. | Signals active missile acquisition in progress. |
| **Stage 2: Hard Lock-On** | Brackets snap firmly into place `[ + ]` with a central crosshair, flashing at 8Hz. Real-time telemetry displayed: `DIST: 320m`, `CLOSING: +42m/s`. | Target tracked continuously for $>0.25\text{s}$. | Guarantees homing missile will prioritize this target upon launch. |
| **Stage 3: Multi-Lock Paint** | Numbered brackets `[ 1 ]`, `[ 2 ]`, `[ 3 ]` assigned to multiple threats simultaneously. | Homing Missile upgrade level $\ge 3$. | Multi-missile salvo splits targets automatically. |

### 2.3 Distinct Reticle Shapes by Faction & Threat Level
Reticles are not generic; they visually communicate enemy class:
- **Standard Invader (Swarm):** Lightweight square brackets `[   ]`.
- **Fast Diver / Zigzag:** Angular diamond brackets `<   >` with downward-pointing lead arrows.
- **Rogue Cyber-Faction (Mechs / Stalkers):** Octagonal cyber-brackets `{   }` with neon-lime telemetry readout.
- **Boss / End-Game Crisis Sovereign:** Heavy dual-ring segmented reticle with rotating tick marks and an integrated segmented HP ring indicating shield vs hull integrity.

---

## 3. Radar Minimap Display: Abyssal Tactical Sonar

### 3.1 Placement and Form Factor
- **Dimensions & Position:** A circular display ($110\text{px}$ diameter, $R = 55\text{px}$) located in the upper-right HUD corner (`x = 475, y = 20` within the $600\times 800$ logical canvas).
- **Display Frame:** Brass-rimmed porthole dial with cardinal compass ticks (`N`, `E`, `S`, `W`) and concentric distance rings at $250\text{m}$, $500\text{m}$, and $750\text{m}$ equivalent playfield radii.

```
       [000° N]
     /----+----\
    /     |     \
   |  *   |      |  <-- Off-Screen Flanker Blip (*)
   |------+------|  <-- Concentric Range Ring
   |      |   o  |  <-- Player Battery (Center)
    \     |     /
     \----+----/
       [180° S]
    [SWEEP: 1.8s]
```

### 3.2 Real-Time Radial Sonar Sweep Beam
- **Rotation Mechanics:** A sharp radar sweep line rotates clockwise at $\omega = 180^\circ/\text{s}$ (one full $360^\circ$ revolution every 2.0 seconds).
- **Phosphor Persistence Sector:** An angular gradient sector spanning $45^\circ$ trailing behind the sweep line. As the beam crosses an entity, its phosphor blip flares to $100\%$ intensity and decays exponentially according to:
$$I(t) = I_0 \cdot e^{-\lambda (t - t_{\text{ping}})}$$
where $\lambda = 1.6\text{ s}^{-1}$ ensures blips remain visible for $\approx 1.8\text{ seconds}$ until the next sweep.

### 3.3 Multi-Threat Tracking Capabilities
The sonar radar solves the primary player complaint during high-wave play: unexpected off-screen spawns and fast dives.

1. **Off-Screen Threat Radar:**
   - Detects enemies spawning above $y < 0$ or flanking from screen margins ($x < 0$ or $x > 600$) during special events (e.g. *Flank Incursions*, *Spearhead V-Formations*, *Rogue Airdrops*).
   - Off-screen blips clamp to the sonar's outer perimeter ring with an inward-pointing arrow, indicating incoming direction and speed:
     $$\theta = \text{atan2}(y_e - y_p, x_e - x_p), \quad x_{\text{blip}} = x_{\text{center}} + R \cos\theta, \quad y_{\text{blip}} = y_{\text{center}} + R \sin\theta$$

2. **Incoming High-Threat Projectile Vectors:**
   - Tracks high-damage incoming hazards: Boss hyper-beams, Toxic Acid Storm clusters, and diving suicide drones.
   - Projectile vectors are rendered as dashed threat lines projecting toward the player battery position, providing a 1.5-second reaction window.

3. **Allied Drone & Tank Telemetry:**
   - Allied helpers (`Fighter`, `Medic`, `Repair Bot`) appear as stable cyan dots with miniature role glyphs (`F`, `M`, `R`).
   - The central aquifer defense barricades are represented as four small arc segments at the base of the sonar circle, glowing green (healthy), yellow (damaged), or flashing red (under direct attack).

---

## 4. Visuals & SFX: Audio-Visual Immersion Pipeline

### 4.1 Phosphor Persistence & Tube Dynamics
A true retro CRT experience requires faithful simulation of phosphor kinetics:
- **P1 Phosphor Decay Trail:** When fast entities move across the screen, a subtle green/amber ghost trail persists for 3 to 4 animation frames using a decaying canvas alpha buffer.
- **CRT Power-On / Initialization Sequence:**
  - When starting the game or resuming from the shop, the screen displays the classic cold-start effect: a bright horizontal white line flares at the vertical midpoint, snaps open to full height with vertical bounce, accompanied by an authentic high-voltage crackle.
- **Subsurface Electrical Noise & EMP Glitch:**
  - During the *EMP Suppression Crisis* or when the player's Panic/Stress meter spikes above 70%, the HUD experiences micro-jitter (1-2px vertical tearing) and simulated magnetic roll lines.

### 4.2 Web Audio API Procedural Sound Architecture
In strict adherence to *Water Invader's* zero-external-asset architecture, all SFX are generated programmatically via the Web Audio API (`SoundManager.ts`).

#### Sound Specification Table:

| Sound Cue | Audio Synthesis Topology | Frequency Profile | Envelope (ADSR) | Cognitive Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Sonar Sweep Ping** | Pure Sine Wave $\to$ Lowpass Filter $\to$ Feedback Comb Delay (Underwater Reverb) | $f_0 = 880\text{Hz} \to 860\text{Hz}$ | Attack: $2\text{ms}$, Decay: $1.2\text{s}$, Reverb wet: $45\%$ | Rhythmic tactical heartbeat; spatial grounding. |
| **Lead Reticle Acquire** | Dual Square Wave Chirp | $f_1 = 1200\text{Hz}, f_2 = 1800\text{Hz}$ | Attack: $1\text{ms}$, Duration: $30\text{ms}$, Decay: $20\text{ms}$ | Rapid target lock warning. |
| **Solid Hard-Lock Tone** | Gated Square/Sawtooth Hybrid (8Hz gating rate) | $f_0 = 2400\text{Hz}$ resonant peak | Pulse on/off every $62.5\text{ms}$ | Unmistakable missile lock confirmation. |
| **Torpedo Threat Alert** | Sawtooth Wave $\to$ Pitch-drop klaxon | $f_0 = 440\text{Hz} \to 220\text{Hz}$ | Repeating 2-tone alarm: $0.2\text{s}$ cycle | Warns of off-screen diving threats. |
| **CRT Flyback Transformer Hum** | Ultra-low amplitude dual sine wave | $f_{\text{hum}} = 60\text{Hz} + 15,625\text{Hz}$ | Steady background layer (gain: $0.015$) | Subliminal hardware tactile presence. |

#### Web Audio API Synthesis Blueprint (Procedural Code Design):

```typescript
// Procedural Sonar Ping & Target Acquisition Audio Generators for SoundManager.ts

export class TacticalAudioModule {
  /**
   * Procedural Abyssal Sonar Ping
   * Simulates active acoustic pulse radiating through deep ocean water.
   */
  public static playSonarPing(audioCtx: AudioContext, destination: AudioNode): void {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // Pure sonar ping frequency with micro Doppler pitch drift
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.3);

    // High-resonance bandpass simulating submarine acoustic hull
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(890, now);
    filter.Q.setValueAtTime(12.0, now);

    // Long reverberant decay
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 1.6);
  }

  /**
   * Crisp Target Lock Acquisition Chirp
   * High-frequency dual-tone electronic blip indicating missile target acquired.
   */
  public static playLockBeep(audioCtx: AudioContext, destination: AudioNode): void {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    // Rapid upward octave chirp (1200Hz -> 2400Hz)
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.04);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Hard-Lock Pulsing Klaxon
   * Fires when missile lock is 100% committed.
   */
  public static playHardLockTone(audioCtx: AudioContext, destination: AudioNode): void {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2200, now);

    // Rapid double-pip envelope
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.setValueAtTime(0.001, now + 0.03);
    gain.gain.setValueAtTime(0.08, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }
}
```

---

## 5. Customization Options: Phosphor Color Schemes & Dial Ergonomics

Different submarine eras and display technologies utilized distinct phosphor chemistries. Players can customize their CRT monitor aesthetics via a simple toggle in the Settings/Shop menu:

```
+-------------------------------------------------------------------------+
| CRT DISPLAY CONFIGURATION (TACTICAL HUD)                                |
|                                                                         |
| [1] PHOSPHOR GREEN (P1 - 1978)     [X] ACTIVE                           |
|     Classic military green (525nm). Maximum nostalgic submarine punch. |
|                                                                         |
| [2] AMBER INDUSTRIAL (P3 - 1982)   [ ] SELECT                           |
|     Warm amber-orange glow (590nm). High-contrast radiation shelter feel.|
|                                                                         |
| [3] ABYSSAL CYAN (P4 - AQUIFER)    [ ] SELECT                           |
|     Deep luminescent ocean cyan (480nm). Seamless match for water theme.|
|                                                                         |
| [4] STEALTH CRIMSON (RED ALERT)    [ ] SELECT                           |
|     Submarine night-battle red (640nm). High-stress combat immersion.    |
|                                                                         |
| CRT Curvature: [ ON / OFF ]        Scanline Density: [ 0% - 50% - 100% ]|
| Minimap Position: [ TOP-RIGHT / TOP-LEFT / DOCKED MINI ]                |
+-------------------------------------------------------------------------+
```

### Color Palette Matrix

| Theme Name | Primary Phosphor | Accent Glow | Dark / Raster Base | Authentic Lore Inspiration |
| :--- | :--- | :--- | :--- | :--- |
| **Phosphor Green (P1)** | `#22c55e` (Bright Green) | `#4ade80` (Mint Glow) | `#052e16` (Deep Moss) | Cold War AN/BQQ-5 Submarine Sonar |
| **Amber CRT (P3)** | `#f59e0b` (Amber Gold) | `#fbbf24` (Sunburst) | `#451a03` (Burnt Oak) | VT220 Mainframe Terminal & Missile Bunker |
| **Abyssal Cyan (P4)** | `#06b6d4` (Pure Cyan) | `#67e8f9` (Aqua Spark) | `#083344` (Trench Navy)| Deep-sea Aquifer Explorer Bathyscaphe |
| **Stealth Crimson** | `#ef4444` (Radar Red) | `#f87171` (Flare Coral)| `#450a0a` (Abyssal Red)| Submarine General Quarters "Red Alert" |

---

## 6. Synergies with Homing Missile Targeting & Feasibility

### 6.1 Mechanical Synergy with Existing Systems
The *Water Invader* codebase already possesses an elegant physical implementation for homing missiles in `src/game/Bullet.ts`:
- The `HomingMissile` class dynamically steers toward enemies with angular velocity (`turnRate = 3.5`), smoke particle trails, and jet flames.
- However, prior to firing, the player has no visibility into which target the missile algorithm will prioritize.

#### How the Target Lock Reticle Elevates Homing Missiles:
1. **Target Pre-Visualization:** The reticle connects directly to the homing target acquisition query (`findNearestTarget`). When the player holds missiles, the nearest enemy is highlighted with an active lock bracket. The player knows with 100% certainty where their shot will fly.
2. **Multi-Lock Upgrades (Levels 1 to 5):**
   - **Lv.1 Missiles:** Single lock bracket on closest enemy.
   - **Lv.3 Missiles:** Dual-target acquisition brackets; firing alternates missile salvo trajectories across both threats.
   - **Lv.5 Missiles (Apex Battery):** Triple-target lock with simultaneous launch dispersion, clearing complex swarm waves in seconds.
3. **Crossfire Tactic Guidance:** In the 3-Way Battlefield (Invaders vs Rogue Cyber-Faction), the lock reticle enables players to lock onto a Rogue Mech while an Invader Diver is in transit, intentionally luring the homing warhead through an enemy clash zone to trigger massive crossfire kill bonuses!

### 6.2 Architectural Feasibility & Non-Breaking Guarantees
Adhering to the project's critical constraints, this feature proposal requires **zero modifications to logical dimensions** and introduces **zero breaking changes**:

1. **Logical Grid Invariance:**
   - The entire CRT HUD, Reticle, and Sonar Minimap render strictly within the existing `logicalWidth: 600` and `logicalHeight: 800` coordinate space in Layer 3 of `GameManager.draw()`.
   - No modifications to physics hitboxes, enemy coordinates, or `canvas.width` scaling factors.
   
2. **Ultra-Low Rendering Overhead (60 FPS Guaranteed):**
   - **Pre-rendered Sonar Grid:** The static circular radar rings and ticks are rendered once to an offscreen canvas or cached path, requiring only a single `drawImage` or simple path stroke per frame.
   - **Linear Time Complexity:** The radar sweep and target reticles loop only over active on-screen and near off-screen entities ($O(N)$ where $N \le 40$), costing $< 0.15\text{ms}$ of frame budget.
   - **Zero Asset Dependencies:** No external `.png`, `.mp3`, or heavy shader pipelines. Everything is drawn procedurally with HTML5 2D Canvas context primitives and native Web Audio oscillators.

3. **Accessibility & User Agency:**
   - For players who prefer pure clean arcade gameplay, a simple one-click toggle ("Tactical HUD: ON / OFF") can be placed in the settings/shop panel, instantly switching between standard minimal UI and full CRT Bathyscaphe immersion.

---

## 7. Implementation Roadmap & Milestones (When Approved)

*Note: In accordance with the ideation mandate, this roadmap outlines future engineering tasks without modifying any code during this phase.*

| Phase | Core Deliverable | Target Files (Reference Only) |
| :--- | :--- | :--- |
| **Phase 1: Procedural Audio** | Add `playSonarPing()`, `playLockBeep()`, `playHardLockTone()` to `SoundManager.ts`. | `src/game/SoundManager.ts` |
| **Phase 2: Target Lead Math** | Implement kinematic intercept math and reticle state machine in a modular `TargetingSystem.ts`. | `src/game/TargetingSystem.ts` |
| **Phase 3: Sonar Minimap** | Render circular radar dial, rotating sweep beam, and off-screen blips in Layer 3. | `src/game/RadarMinimap.ts` |
| **Phase 4: Canvas CRT Filter** | Implement optional barrel curvature vignette and scanline overlay in `game-canvas.tsx`. | `src/components/game-canvas.tsx` |
| **Phase 5: Automated Verification**| Write Playwright integration tests confirming 60 FPS performance and reticle tracking accuracy. | `tests/radar-crt-hud.spec.ts` |

---

## Conclusion

The **CRT Retro-Sonar HUD & Target Lock Reticles** feature proposal delivers an unparalleled combination of retro-futuristic atmosphere, mechanical precision, and strategic depth to *Water Invader*. By transforming passive UI into an active, tactile submarine command station, this update elevates player immersion to new heights while respecting every architectural and performance boundary of the existing engine.

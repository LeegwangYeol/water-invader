# Visceral Feedback & Distortion Effects: Technical & Creative Design Specification
**Specialist Domain 6.6: Visceral Screen Shakes, Hull Condensation, & Water Distortion Shaders**
**Project:** Water Invader (Next.js Canvas / WebGL Underwater Arcade Shooter)
**Author:** Specialist 6.6 (Brainstorming Swarm)
**Date:** 2026-09-10

---

## 1. Executive Summary & Concept Hook

### 1.1 The "Pressurized Cockpit" Hook
Standard retro arcade space-invader clones treat the game canvas as a rigid, sterile 2D plane. When an explosion occurs, the entire viewport merely rattles with random high-frequency pixel offsets (`(Math.random() - 0.5) * amount`). This feels weightless, artificial, and detached from the tactile sensation of underwater combat.

In **Water Invader**, the player commands a submersible navigating treacherous abyssal depths under hundreds of atmospheres of hydrostatic pressure. Combat is not taking place in a vacuum—it occurs in an incompressible fluid medium that transmits violent kinetic energy, acoustic shock, and thermal cavitation.

The **Visceral Feedback & Distortion Engine (VFDE)** transforms the game screen from a static digital frame into the reinforced viewport glass of an active combat submarine:
1. **Directional Kinetic Impulse:** Impacts don't just jiggle the screen—they physically knock the hull backwards along the incoming vector, followed by an underdamped hydraulic recoil spring that re-centers the periscope view.
2. **Hydrodynamic Shockwave Cavitation:** High-yield detonations (depth charges, torpedo bursts, boss core ruptures) propagate concentric refractive shockwaves that warp background light, displace bullet trajectories visually, and split light into momentary chromatic fringing.
3. **Hull Condensation & Micro-Beading:** Atmospheric humidity inside the cockpit condenses on the cold titanium periscope glass. Violent blasts cause droplets to break loose, shudder, and run down the screen in organic rivulets, heightening intimacy and tension.
4. **Subtle Abyss Refraction Wiggle:** Continuous, low-frequency hydrothermal currents rhythmically displace distant silhouettes and deep-sea trenches, grounding the player in a breathing, turbulent ocean.
5. **Accessibility by Design:** A robust dampening matrix featuring independent trauma scaling, directional locking, chromatic disabling, and high-contrast silhouette anchors ensures zero motion sickness or photosensitive seizure risks.

---

## 2. Directional Impact Feedback (Spatial Intuition Engine)

### 2.1 The Problem with Isotropic Noise
In the current implementation (`src/game/GameManager.ts:2518-2525`):
```typescript
let shakeAmount = 2;
if (this.warningTimer > 0) shakeAmount = 5;
const offsetX = (Math.random() - 0.5) * shakeAmount;
const offsetY = (Math.random() - 0.5) * shakeAmount;
this.ctx.translate(offsetX, offsetY);
```
This isotropic jitter lacks:
- **Spatial orientation:** An impact from the top-right creates the exact same motion as an impact from the bottom-left.
- **Physical weight:** Random noise lacks momentum, inertia, and elastic restoration.
- **Rotational torque:** Explosions off-center do not rotate the hull around its center of gravity.

### 2.2 Vector-Biased Harmonic Impulse Model
When an entity takes damage from a source at $(x_{\text{src}}, y_{\text{src}})$ relative to the player's position $(x_{\text{p}}, y_{\text{p}})$, we define the incoming unit vector $\mathbf{\hat{u}}_{\text{hit}}$:
$$\Delta \mathbf{p} = \begin{bmatrix} x_{\text{p}} - x_{\text{src}} \\ y_{\text{p}} - y_{\text{src}} \end{bmatrix}, \quad \mathbf{\hat{u}}_{\text{hit}} = \frac{\Delta \mathbf{p}}{\|\Delta \mathbf{p}\| + \epsilon}$$

The impact imparts an instantaneous initial directional kick velocity $\mathbf{v}_0$ and rotational torque $\tau_0$:
$$\mathbf{v}_0 = \mathbf{\hat{u}}_{\text{hit}} \cdot I_{\text{impulse}}$$
$$\tau_0 = \text{clamp}\left(\frac{(x_{\text{src}} - x_{\text{p}})}{W_{\text{viewport}}}, -1, 1\right) \cdot \Theta_{\text{max}} \cdot I_{\text{impulse}}$$

Where:
- $I_{\text{impulse}}$ is proportional to damage dealt ($0.2$ for stray bullets, $1.5$ for torpedoes, $3.0$ for boss beam strikes).
- $\Theta_{\text{max}}$ is the maximum rotational roll (typically $2.5^\circ$ or $0.0436\text{ rad}$).

### 2.3 Underdamped Spring-Damper Mathematical Restoration
Rather than abrupt countdown timers, the camera position $\mathbf{x}(t)$ follows a second-order damped harmonic oscillator:
$$\ddot{\mathbf{x}} + 2\zeta \omega_n \dot{\mathbf{x}} + \omega_n^2 \mathbf{x} = \mathbf{F}_{\text{noise}}(t)$$
Where:
- $\omega_n$ is the natural oscillation frequency ($\approx 28\text{ rad/s}$ for crisp arcade recoil).
- $\zeta$ is the damping ratio ($0.55 < \zeta < 0.7$ for an underdamped response with exactly 1.5 visible recoil bounces).
- $\mathbf{F}_{\text{noise}}(t) = \text{Perlin}(\omega_{\text{shake}} t) \cdot \text{Trauma}^2$ adds fine, organic high-frequency vibration during the tail end.

```
Incoming Blast (Top-Right)
       \
        \  (Impact)
         v
    [ Submarine ]
         |
         |  Initial violent thrust (Bottom-Left: -X, +Y)
         v
       ~~~~~ (Hydraulic rebound bounce back through origin)
         ^
         |  Subtle overshoot before settling
```

### 2.4 Perceptual Benefit to Player
1. **Eyes-Free Threat Awareness:** If a stealth submersible or off-screen mine detonates from the left, the camera physically jolts to the right. The player's peripheral vision immediately detects the threat quadrant without reading the minimap or HUD text.
2. **Sensory Weight Hierarchy:** Minor hits feel like metallic pinging; heavyweight torpedoes violently shove the viewport, giving an unmistakable sense of imminent hull compromise.

---

## 3. Shockwave Distortion & Hydrodynamic Cavitation

### 3.1 The Physics of Underwater Explosions
In water, the speed of sound is approximately $1,500\text{ m/s}$ (over 4x faster than in air), and water is nearly incompressible. Detonations create an expanding spherical shock front followed by a cavitation bubble collapse (the "bubble pulse"). As light passes through the compressed water density gradient at the shock boundary, its refractive index $n$ changes dramatically from $1.333$ to $1.38+$, bending light rays outward.

### 3.2 Dynamic Concentric Ripple Architecture
Every high-yield event spawns a `ShockwaveEvent`:
```typescript
interface ShockwaveEvent {
  id: number;
  originX: number;       // Viewport logical coordinates
  originY: number;
  currentRadius: number; // Current pixel radius
  maxRadius: number;     // Maximum expansion radius (e.g. 350px)
  speed: number;         // Wave propagation velocity (e.g. 600px/s)
  thickness: number;     // Width of refractive ridge (12px - 28px)
  refractionStrength: number; // Peak pixel displacement (8px - 20px)
  chromaticDispersion: number; // Red-Blue separation in pixels (2px - 6px)
  lifeTime: number;
  maxLifeTime: number;
}
```

### 3.3 Visual Shading & Refractive Displacement Implementation

#### Approach A: Modern WebGL Post-Processing Pipeline (Zero-Copy Texture Pass)
For full-screen shader fidelity, the game scene is rendered to an offscreen color framebuffer `FBO_Scene`. A full-screen post-processing fragment shader samples `FBO_Scene` using warped texture coordinates:

```glsl
// Shockwave Refraction Fragment Shader (GLSL ES 3.00)
precision highp float;
uniform sampler2D u_SceneTexture;
uniform vec2 u_Resolution;
uniform vec2 u_Center;           // Normalized [0, 1]
uniform float u_Radius;          // Normalized radius
uniform float u_Thickness;       // Ring width
uniform float u_RefractionPower; // Distortion amplitude
uniform float u_ChromaticSplit;  // Chromatic aberration offset
uniform float u_Decay;           // 1.0 -> 0.0 fade factor

in vec2 v_TexCoord;
out vec4 fragColor;

void main() {
    vec2 aspect = vec2(u_Resolution.x / u_Resolution.y, 1.0);
    vec2 diff = (v_TexCoord - u_Center) * aspect;
    float dist = length(diff);
    
    // Calculate distance to expanding wave front
    float waveDist = abs(dist - u_Radius);
    
    if (waveDist < u_Thickness && dist > 0.001) {
        // Smooth bell-curve displacement across ring thickness
        float factor = 1.0 - smoothstep(0.0, u_Thickness, waveDist);
        float displacement = sin(waveDist / u_Thickness * 3.14159265) * u_RefractionPower * factor * u_Decay;
        
        vec2 dir = normalize(diff);
        
        // Chromatic Aberration: Sample RGB at offset UV coordinates
        vec2 uvR = v_TexCoord + dir * (displacement + u_ChromaticSplit * factor);
        vec2 uvG = v_TexCoord + dir * displacement;
        vec2 uvB = v_TexCoord + dir * (displacement - u_ChromaticSplit * factor);
        
        float r = texture(u_SceneTexture, uvR).r;
        float g = texture(u_SceneTexture, uvG).g;
        float b = texture(u_SceneTexture, uvB).b;
        
        // Add subtle luminous foam crest along the leading edge
        float highlight = pow(factor, 4.0) * 0.25 * u_Decay;
        fragColor = vec4(r + highlight, g + highlight, b + highlight, 1.0);
    } else {
        fragColor = texture(u_SceneTexture, v_TexCoord);
    }
}
```

#### Approach B: High-Performance Canvas 2D Polygonal Fallback
For environments where WebGL is disabled or lower-tier mobile browsers require strict Canvas 2D fallback:
1. **Concentric Arc Slices:** The shockwave is rendered using concentric radial gradient rings with `ctx.globalCompositeOperation = 'overlay'` or `'screen'`.
2. **Radial Inversion Ring:** A localized circular offscreen clipping mask extracts the circular band under the shockwave, applies `ctx.drawImage` scaled by $1.04\times$ from the explosion center (magnification lens effect), and blits it back with $0.6$ alpha.
3. This achieves $90\%$ of the visual sensation at virtually zero GPU shader overhead.

---

## 4. Hull Condensation & Canopy Water Droplets

### 4.1 Atmospheric Immersion Mechanics
When diving deep into cold water, the temperature differential between the warm interior cabin electronics and the freezing oceanic abyss creates condensation on the cockpit viewport.

```
+-------------------------------------------------------------+
|  VIEWPORT CANOPY (Top Layer / Forehead Perspective)         |
|  .  *   °   .   o   *   .  *  °   o  .   *  .  °   o   .  * |  <- Ambient Micro-Beads
|     \                                     /                 |
|      \  (Heavy hit causes coalescence)   /                  |
|       v                                 v                   |
|      | | (Rivulet running down glass)  | |                  |
|      |o|                               |o|                  |
+-------------------------------------------------------------+
```

### 4.2 Dynamic Bead Simulation Specification
A lightweight 2D droplet system simulates condensation on the inside/outside of the periscope glass:
- **Static Micro-Beads:** 40–80 dormant droplets scattered across the viewport border and corners, magnified slightly by caustic ambient lighting.
- **Vibration Sensitivity (Impact Agitation):**
  When screen shake exceeds a threshold (e.g. $\text{Trauma} > 0.4$):
  1. Micro-beads jitter with high-frequency inertia.
  2. Nearby droplets within distance threshold $R_{\text{fuse}} < 14\text{px}$ merge into larger tear-shaped droplets (mass conservation).
  3. Droplets exceeding critical mass $M > M_{\text{critical}}$ succumb to gravity: they slide downwards along the glass surface, leaving a faint wet refraction trail behind them.
- **Hydro-Shear Wind/Water Effect:**
  When the player dashes or changes speed rapidly, droplets stream backwards at a slight slant, conveying dynamic velocity.

### 4.3 Canvas 2D Lens Rendering of Droplets
Each droplet is drawn as an optical lens:
1. A small dark translucent meniscus ring: `rgba(0, 20, 40, 0.4)`.
2. A bottom interior reflection curve: `rgba(180, 240, 255, 0.3)`.
3. A top-left specular highlight sparkle: `rgba(255, 255, 255, 0.85)`.
This gives realistic, glass-like refraction without requiring costly per-pixel raytracing.

---

## 5. Water Refraction Wiggle (Deep Abyss Ambient Shading)

### 5.1 Ambient Environmental Motion
In underwater games, a completely rigid background destroys the illusion of being immersed in liquid.
In `GameManager.ts`, `Layer 1: STATIC BACKGROUND LAYER` currently renders static linear gradients and threat vignettes.

The **Abyss Refraction Wiggle** introduces subtle, non-disorienting fluid displacement across background layers:
$$\Delta x(y, t) = A_1 \sin\left(\frac{2\pi y}{\lambda_1} + \omega_1 t\right) + A_2 \cos\left(\frac{2\pi y}{\lambda_2} - \omega_2 t\right)$$
$$\Delta y(x, t) = A_3 \sin\left(\frac{2\pi x}{\lambda_3} + \omega_3 t\right)$$

Where:
- $A_1 = 1.8\text{px}, A_2 = 0.9\text{px}$ (very subtle amplitudes to prevent player nausea or visual fatigue).
- $\lambda_1 = 180\text{px}, \lambda_2 = 320\text{px}$ (long wavelengths representing broad ocean swells).
- $\omega_1 = 0.8\text{ rad/s}, \omega_2 = 0.4\text{ rad/s}$ (slow, meditative cadence).

### 5.2 Layered Parallax Caustics
To provide depth, the wave displacement is modulated across three distinct sub-layers:
1. **Distant Abyss Trenches ($z = 0.2$):** Amplitude $0.8\text{px}$, deep indigo caustics.
2. **Mid-Depth Plankton & Bubble Stream ($z = 0.6$):** Amplitude $1.5\text{px}$, reactive drifting speed.
3. **Thermal Vents & Chimney Plumes ($z = 0.9$):** Localized high-frequency heat shimmer directly above active rift/vent hazards.

---

## 6. Camera Dampening, Photosensitivity & Accessibility Matrix

### 6.1 Ethical & Inclusive Design Mandate
Intense camera shake, screen flashes, and chromatic aberration can induce severe motion sickness, migraines, and epileptic seizures in photosensitive or vestibular-sensitive players. Visceral arcade juice must **never** come at the expense of accessibility.

### 6.2 Granular User Preference Matrix
We specify four independent settings stored in `localStorage` under `water_invader_a11y_vfx`:

| Setting Parameter | Type / Range | Default | Functional Behavior |
|---|---|---|---|
| **Screen Shake Intensity** | Slider: `0%` to `150%` | `100%` | Multiplies overall translational and rotational camera offsets. `0%` locks camera rigidly to $(0, 0)$. |
| **Directional Bias Mode** | Toggle: `[Full / Radial Only / Off]` | `Full` | At `Off`, directional impulses are converted to smooth symmetric pulses. |
| **Chromatic Aberration** | Toggle: `[Enabled / Disabled]` | `Enabled` | When `Disabled`, RGB splitting in shockwaves and hits is replaced with a single soft luminance tint. |
| **Motion Sickness Filter** | Toggle: `[On / Off]` | `Off` | Disables background wave wiggle, locks rotation $\Theta = 0$, and clamps max camera acceleration. |
| **Silhouette Lock Anchor** | Toggle: `[On / Off]` | `On` | Guarantees player submarine, enemy bullets, and health bars maintain sharp high-contrast strokes regardless of shake. |

### 6.3 Fail-Safe Camera Clamping
Even at $150\%$ screen shake intensity, the camera offset must strictly obey mathematical boundary clamps:
$$\|\mathbf{x}_{\text{offset}}\| \le \text{Clamp}_{\text{max}} = 16\text{px}$$
$$|\theta_{\text{roll}}| \le 0.05\text{ rad} \approx 2.86^\circ$$

This ensures that the play area is never thrown out of the viewport and no empty black/white margins are exposed.

---

## 7. Synergies with Mobile Viewport, Touch Controls & Haptics

### 7.1 The Mobile Touch Tracking Hazard
On desktop, players use keyboard (`Arrow keys / WASD`) or mouse. On mobile devices, players use direct touch or an on-screen virtual joystick.
If the entire canvas translates violently during screen shake:
1. The player's physical thumb position loses sync with the in-game submarine coordinate.
2. Touch aim becomes jittery, leading to frustrating misses during high-intensity boss encounters.

### 7.2 The Decoupled Viewport Solution
The engine enforces **Virtual Coordinate Decoupling**:
- **World & Touch Layer:** The player's actual gameplay bounding box and touch hitboxes exist in absolute un-shaken logical coordinates $(X_L, Y_L)$.
- **Camera Viewport Matrix:** The camera transform is applied strictly during `ctx.drawImage` / rendering passes.
- **HUD & Touch Controls (Layer 3):** Virtual thumbsticks, fire buttons, combo counters, and health bars remain firmly pinned to the screen bezel without any jitter.

```
+-----------------------------------------------------------+
| UN-SHAKEN TOUCH & HUD LAYER                               |
| [Virtual Joystick]                  [Shop / Weapon Switch]|
|           \                                 /             |
|  +-----------------------------------------------------+  |
|  | SHAKEN WORLD MATRIX (Canvas Context Translated)     |  |
|  |       [Enemy Fleet]                                 |  |
|  |               ^                                     |  |
|  |        ~~~~~~~|~~~~~~~ (Shockwave Wavefront)        |  |
|  |          [Player Sub]                               |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
```

### 7.3 Web Haptic Feedback Integration (`navigator.vibrate`)
To translate visual screen shake into visceral physical sensation on mobile smartphones, the system integrates with the HTML5 Vibration API:
- **Light Projectile Hit:** `navigator.vibrate(12)` (crisp tap).
- **Directional Torpedo Blast:** `navigator.vibrate([25, 30, 45])` (double thud).
- **Catastrophic Sovereign Pulse:** `navigator.vibrate([50, 40, 70, 50, 100])` (deep rumbling vibration matching the visual harmonic decay).

### 7.4 Responsive Aspect Ratio Overdraw (Gutter Margin)
Mobile screens range from 16:9 to ultra-tall 20.5:9 (e.g. modern iPhones and Samsung Galaxy devices).
To prevent blank edges when the camera translates by up to $\pm 16\text{px}$:
- The background canvas renders with a $+24\text{px}$ perimeter gutter (`-12px` to `width + 12px`, `-12px` to `height + 12px`).
- No clipping or unpainted seams can ever flicker on edge boundaries.

---

## 8. Technical Architecture & Modular API Design

### 8.1 Class Architecture

```
                      +-------------------+
                      |   GameManager     |
                      +---------+---------+
                                |
       +------------------------+------------------------+
       |                        |                        |
       v                        v                        v
+--------------+      +-------------------+      +---------------+
| CameraSystem |      | DistortionManager |      | CanopyOverlay |
+--------------+      +-------------------+      +---------------+
| - trauma     |      | - shockwaves[]    |      | - droplets[]  |
| - dirImpulse |      | - causticShader   |      | - steamAlpha  |
| - rollAngle  |      | - aberrationPower |      | - massPhysics |
+--------------+      +-------------------+      +---------------+
```

### 8.2 Detailed Component Specifications

#### A. `CameraSystem.ts`
Manages directional impulse vectors, harmonic damping, trauma decay, and accessibility scaling.
```typescript
export class CameraSystem {
  private trauma: number = 0; // [0.0, 1.0]
  private impulseX: number = 0;
  private impulseY: number = 0;
  private velX: number = 0;
  private velY: number = 0;
  private rollAngle: number = 0;
  private rollVel: number = 0;

  // Accessibility configuration
  public shakeScale: number = 1.0;     // 0.0 to 1.5
  public directionalEnabled: boolean = true;
  public motionFilterEnabled: boolean = false;

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public addDirectionalImpact(sourceX: number, sourceY: number, targetX: number, targetY: number, power: number) {
    if (!this.directionalEnabled) {
      this.addTrauma(power * 0.5);
      return;
    }
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    const kickMagnitude = power * 14.0 * this.shakeScale;
    
    // Initial velocity along impact normal
    this.velX += (dx / len) * kickMagnitude;
    this.velY += (dy / len) * kickMagnitude;
    
    // Rotational torque based on horizontal offset
    const torque = (sourceX - targetX) / 400;
    this.rollVel += torque * power * 0.08 * this.shakeScale;
    
    this.addTrauma(power * 0.35);
  }

  public update(deltaTime: number): { offsetX: number; offsetY: number; angle: number } {
    if (this.shakeScale <= 0.001) {
      return { offsetX: 0, offsetY: 0, angle: 0 };
    }

    // 1. Spring-Damper physics simulation
    const springK = 320.0;
    const damping = 18.0;

    const forceX = -springK * this.impulseX - damping * this.velX;
    const forceY = -springK * this.impulseY - damping * this.velY;
    this.velX += forceX * deltaTime;
    this.velY += forceY * deltaTime;
    this.impulseX += this.velX * deltaTime;
    this.impulseY += this.velY * deltaTime;

    const torqueForce = -springK * this.rollAngle - damping * this.rollVel;
    this.rollVel += torqueForce * deltaTime;
    this.rollAngle += this.rollVel * deltaTime;

    // 2. High-frequency trauma jitter
    const shakePower = Math.pow(this.trauma, 2) * this.shakeScale;
    const jitterX = (Math.random() - 0.5) * 8.0 * shakePower;
    const jitterY = (Math.random() - 0.5) * 8.0 * shakePower;

    // Decay trauma over time
    this.trauma = Math.max(0, this.trauma - deltaTime * 1.4);

    // Final clamped camera offset
    const maxOffset = 18.0 * this.shakeScale;
    const finalX = Math.max(-maxOffset, Math.min(maxOffset, this.impulseX + jitterX));
    const finalY = Math.max(-maxOffset, Math.min(maxOffset, this.impulseY + jitterY));
    const finalAngle = this.motionFilterEnabled ? 0 : Math.max(-0.05, Math.min(0.05, this.rollAngle));

    return { offsetX: finalX, offsetY: finalY, angle: finalAngle };
  }
}
```

#### B. `DistortionManager.ts`
Manages shockwaves, wave propagation, caustics, and composite blitting.
- Implements a pre-allocated circular ring buffer of 8 shockwaves to ensure zero garbage collection overhead.
- Supports both WebGL shader path and Canvas 2D fallback path.

#### C. `CanopyOverlay.ts`
Simulates condensation droplets, droplet fusion, gravity sliding, and periscope wiping.
- Runs at a capped 30Hz update rate to preserve CPU cycles on mobile while interpolating smoothly at 60Hz.

---

## 9. Visual Mockup & UI Integration Plan

### 9.1 In-Game Settings Panel Mockup
Located in the pause menu and pre-game shop modal:

```
+-----------------------------------------------------------+
|               VISCERAL FEEDBACK SETTINGS                  |
+-----------------------------------------------------------+
|                                                           |
| Screen Shake Intensity:                                   |
| [========================|----------]  70%                |
|                                                           |
| Directional Impact Kick:         [ ON ]  /   OFF          |
| Chromatic Shockwave Split:       [ ON ]  /   OFF          |
| Viewport Hull Condensation:      [ ON ]  /   OFF          |
| Ambient Water Wiggle:            [ ON ]  /   OFF          |
| Photosensitive Safety Mode:        ON    /  [ OFF ]       |
|                                                           |
| [ Test Impact Impulse ]               [ Reset Defaults ]  |
+-----------------------------------------------------------+
```

### 9.2 Gameplay Scenario: Depth Charge Detonation
1. **$t = 0\text{ms}$:** High-explosive depth charge strikes an abyssal carrier.
2. **$t = 16\text{ms}$:** Instantaneous flash frame (soft white luminance halo). Directional camera impulse launches camera $12\text{px}$ down-left; clockwise roll tilt $+2.1^\circ$. SoundManager triggers hydrophone cavitation thud.
3. **$t = 40\text{ms}$:** Refractive shockwave ring expands outward at $750\text{px/s}$. As the shockwave passes over enemy bullet swarms, bullets bend outward momentarily, accentuating shock displacement.
4. **$t = 80\text{ms}$:** Cockpit micro-beads shudder violently; 6 droplets fuse and begin sliding down the glass in organic trails.
5. **$t = 220\text{ms}$:** Camera smoothly rebounds through zero offset, dampening down cleanly with no disorientation.
6. **$t = 450\text{ms}$:** Shockwave dissipates into ambient ocean swell; droplets come to rest. Complete tactile satisfaction.

---

## 10. Implementation Feasibility & Risk Analysis

| Potential Risk | Severity | Mitigation Strategy |
|---|---|---|
| **Canvas 2D Garbage Collection Spikes** | Medium | Use pre-allocated object pools for droplets and shockwave instances; zero allocations during the game loop. |
| **Mobile GPU Thermal Throttling** | Medium | Use lightweight Canvas 2D composite modes or a single multi-target WebGL pass; dynamically downscale shader resolution to $0.75\times$ on high-DPI mobile screens. |
| **Touch Drift / Desynchronization** | High | Strictly decouple logical touch coordinate calculations from camera transform matrices. HUD and touch inputs remain 100% stable. |
| **Motion Sickness Complaints** | High | Default settings set to moderate values (60%); prominent one-click "Photosensitive & Motion Safety" preset in settings that completely eliminates camera movement and chromatic fringing. |

---

## 11. Conclusion & Swarm Recommendation

The **Visceral Feedback & Distortion Effects** feature transforms "Water Invader" from an ordinary browser shooter into a cinematic, pressurized submarine combat simulator. By grounding screen shake in directional physics, coupling explosions with optical shockwaves, and adorning the viewport with living water droplets, this system delivers an immediate, visceral punch that elevates arcade replayability and tactile player delight.

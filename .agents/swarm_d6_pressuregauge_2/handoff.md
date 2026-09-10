# Handoff Report: Specialist 6.2 (Claustrophobic Depth Pressure Gauge & Hull Stress FX)

**Agent**: Specialist 6.2 (Creative Brainstorming Swarm)  
**Focus Domain**: Claustrophobic Depth Pressure Gauge & Hull Stress FX  
**Working Directory**: `/Users/user/src/water-invader/.agents/swarm_d6_pressuregauge_2/`  
**Deliverable**: `/Users/user/src/water-invader/.agents/swarm_d6_pressuregauge_2/report.md`  

---

## 1. Observation
- **Codebase Dimension Invariant**: Observed in `src/game/GameManager.ts:159-160`: `public readonly logicalWidth: number = 600;` and `public readonly logicalHeight: number = 800;`. All render layers operate within this fixed logical coordinate space.
- **Existing Player Stress System**: Observed in `src/game/Player.ts:29-30`: `public suppressionLevel: number = 0;` and `public stressLevel: number = 0; // 0 to 100. High = faster fire rate`. The codebase already tracks player psychological/mechanical stress across damage events (`GameManager.ts:1240, 1592, 2112`), but previously lacked immersive visual and acoustic manifestations.
- **Layered Render Architecture**: Observed in `src/game/GameManager.ts:2408-2648`:
  - `Layer 1` (lines 2408–2512): Static Background Layer (Biomes, threat vignettes, ambient particles, un-shaken).
  - `Layer 2` (lines 2514–2644): World Layer with screen shake displacement (player, enemies, bullets, barricades, crises).
  - `Layer 3` (lines 2646–2716): Stable Foreground Layer (Boss HP, warning borders, announcements, un-shaken).
- **Audio Engine Constraints**: Observed in `src/game/SoundManager.ts:1-100`: The sound manager relies entirely on real-time procedural Web Audio API synthesis (`AudioContext`, `OscillatorNode`, `GainNode`, mathematical envelopes) with zero external audio assets.
- **Biome Cycle Mechanics**: Observed in `src/game/GameManager.ts:89-150`: The game cycles across 5 biomes (Surface Aquifer, Abyssal Trench, Bioluminescent Reef, Toxic Seabed, Cosmic Void) every 10 stages (`Math.floor((level - 1) / 10)`).

---

## 2. Logic Chain
1. **Thematic Coherence**: Because the game is an aquatic submersible shooter diving progressively into deeper biomes, the screen can naturally be framed as a reinforced quartz bathysphere viewport. This transforms abstract stage progression into palpable physical and psychological tension.
2. **Visual Stress Layering**:
   - Depth vignette darkness and condensation droplets belong in **Layer 1.1b** (behind world entities), ensuring they never occlude or distract from lethal enemy bullets.
   - Hairline viewport micro-fractures and the analog brass gauge belong in **Layer 3.0** (stable foreground), anchored strictly to the outer $15\%$ screen perimeter to safeguard the central $70\%$ combat zone.
3. **Contrast & Readability (WCAG 2.1 AAA $\ge 7:1$)**: By maintaining existing $1.5\text{px}$ black strokes around all projectiles and clamping the vignette opacity ($R_{\text{inner}} \ge 180\text{px}$), bullet readability is mathematically preserved regardless of depth or damage level.
4. **Mechanical Needle Resonance**: Modeling the analog gauge needle as a 2nd-order damped harmonic oscillator ($\omega_n = 22\text{ rad/s}, \zeta = 0.62$) driven by depth, player `stressLevel`, weapon recoil, and lateral G-forces gives the UI a tactile, mechanical life.
5. **Procedural Audio Synergy**: Expanding `SoundManager.ts` with procedural low-frequency resonant bandpass oscillators (metal hull creak at $47\text{ Hz}$), high-pass noise buffers (steam vent), and sub-bass dual-pulse sine waves (low-HP heartbeat at $32 - 62\text{ Hz}$) introduces immersive visceral audio with zero asset footprint or network overhead.

---

## 3. Caveats
- **Implementation Constraint**: As mandated by the user and orchestrator, this proposal is strictly ideation, architectural design, and documentation. No source code files (`.ts`, `.tsx`, `.css`) were modified.
- **Audio Autoplay Policies**: Procedural audio additions in `SoundManager.ts` depend on the player's initial user gesture to resume `audioCtx`, consistent with existing sound behavior in `SoundManager.init()`.
- **Mobile Touch Overlay**: If the analog brass dial is placed at the top-right, the React DOM Squadron/Mute UI must maintain proper z-index and spacing to prevent overlapping touch targets.

---

## 4. Conclusion
The proposed **Claustrophobic Depth Pressure Gauge & Hull Stress FX System** is fully conceptualized, technically architected, and documented in `report.md`. It elevates "Water Invader" into an intense, atmospheric deep-sea struggle while preserving $100\%$ arcade clarity, 60 FPS performance, and compatibility with Wave 10/20 progression.

---

## 5. Verification Method
1. **Document Inspection**:
   - Inspect `/Users/user/src/water-invader/.agents/swarm_d6_pressuregauge_2/report.md` for complete coverage of all 6 required sections:
     - Section 1: Immersion Concept & Hook
     - Section 2: Visual Stress Effects (Vignette, Viewport Cracks, Condensation Droplets)
     - Section 3: Audio Stress SFX (Hull Groans, Low-HP Heartbeat, Steam Venting)
     - Section 4: HUD Pressure Dial (Analog Brass Gauge & Needle Physics)
     - Section 5: Accessibility & Quality of Life
     - Section 6: Synergies with Wave 10/20 Progression & Feasibility
2. **Zero Code Modification Verification**:
   - Run `git status` (by parent/orchestrator) to verify that zero source code files were touched in `src/`.

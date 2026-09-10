# CHRONO-SUB RELAY: Asynchronous Ghost Submarine & Challenge Replay Engine
**Specialist 5.6 Creative Feature Proposal — Water Invader Swarm (Domain 5: Co-op & Relay Mechanics)**
**Target Working Directory:** `/Users/user/src/water-invader/.agents/swarm_d5_cooprelay_6/`
**Date:** 2026-09-10
**Author:** Specialist 5.6 (Brainstormer & Systems Designer)

---

## Executive Summary

**Chrono-Sub Relay** introduces an innovative, zero-latency asynchronous multiplayer and speedrun replay system to *Water Invader*. Rather than requiring complex real-time WebSocket netcode, heavy matchmakers, and high-frequency authoritative servers, Chrono-Sub Relay leverages the game’s deterministic 60-FPS fixed-timestep engine (`GameManager.FIXED_STEP = 1/60`) to bring high-octane co-op companionship and cutthroat competitive racing to single-player sessions.

Players can dive into the abyss alongside **Spectral Ghost Submersibles** representing their personal best runs, community rivals, or world-record champions. The feature operates in two complementary modes:
1. **Asynchronous Ghost Co-op (Fire Support & Fleet Vanguard):** The phantom sub acts as an ethereal wingman, laying down suppressive fire, deploying decoys, and drawing enemy fire.
2. **Asymmetric Ghost Racing & Relay:** A pulse-pounding score/time attack mode featuring real-time delta time split bars (`+0.4s` / `-1.2s`), live score differential tracking, and a revolutionary **Milestone Tag-Team Relay** where players swap control with the ghost vessel at wave milestones (Waves 5, 10, 15, 20), inheriting its weapons, hull enhancements, and combat legacy.

```
+========================================================================================+
|                              CHRONO-SUB RELAY ARCHITECTURE                             |
+========================================================================================+
|                                                                                        |
|    [DAILY CHALLENGE SEED]  --->  [DETERMINISTIC WAVE / ENEMY SPAWNER]                  |
|    "SEED-2026-09-10-ABYSS"       (Mulberry32 PRNG: Uniform Incursions & Crises)        |
|                                                                                        |
|             +----------------------------------------------------+                     |
|             |                                                    |                     |
|             v                                                    v                     |
|    [LIVE PLAYER SUB]                                    [GHOST SUBMERSIBLE]            |
|    - Standard Controls (A/D/Space/E)                    - Deterministic Frame Playback |
|    - Physical Hull & Collision                          - Translucent Spectral Mesh    |
|    - Pure Water & Live Upgrades                         - Ethereal Wake & Sonar Pulse  |
|             |                                                    |                     |
|             +-------------------------+--------------------------+                     |
|                                       |                                                |
|             v                         v                          v                     |
|   [SPEEDRUN SPLIT BAR]      [TAG-TEAM BATON SWAP]       [DUO REPLAY SHARE CODE]        |
|   Live: +0.42s / -1.15s     Milestone Waves (5/10/15)   Compressed Base64 URL Token    |
|   Score: Δ +1,450 💧        Pilot Swaps & Inherits      (< 15 KB URL / Discord Share)  |
|                                                                                        |
+========================================================================================+
```

---

## 1. Concept & Hook

### 1.1 The Core Problem & The Ghost Solution
Arcade shoot-'em-ups thrive on community competition and cooperative camaraderie. However, traditional synchronous multiplayer in web-based canvas games faces crippling hurdles:
- Network jitter, packet loss, and interpolation artifacts ruining tight bullet-hell dodges.
- High operational costs for stateful multiplayer servers.
- Empty lobbies and fragmented matchmaking queues during off-peak hours.

**Chrono-Sub Relay** solves all three problems simultaneously. By recording and playing back lightweight, deterministic input/state streams, players experience rich, zero-latency interactions with other human commanders on demand—even completely offline.

### 1.2 Dual Play Modes: Fire Support Co-op vs. Ghost Racing

#### Mode A: Spectral Fire Support (Asynchronous Tactical Co-op)
- **Wingman Dynamic:** The ghost submarine dives alongside the player as a spectral battle-brother.
- **Autonomous Fire Support:** The recorded shots fired by the ghost interact with live enemies! Ghost bullets deal 50% damage (or full scaled co-op damage) and pop enemy shields, allowing solo players to tackle terrifying end-game crises (such as the 12 Grand Strategy Crisis Archetypes like *The Void Sovereign* or *Cosmic Devourer*).
- **Distortion Decoy:** Hostile enemies and boss turrets have a 25% chance to register the spectral wake of the ghost as a target, drawing aggro away from the player in critical bullet clusters.
- **Echo Revive Aura:** If the player takes fatal damage while within the ghost's 80px spectral aura, the ghost executes a self-sacrificing *Phase Collapse*, granting the player an emergency 3-second invulnerability shield and restoring 1 HP.

#### Mode B: Chrono-Split Ghost Racing (Asymmetric Time & Score Attack)
- **Pure Competitive Racing:** Ghost projectiles do not hit enemies in the player’s simulation; instead, the player races against the ghost’s ghosted run.
- **Micro-Target Telemetry:** As both submarines clear waves, the game continuously tracks real-time wave clearance delta, kill counts, combo multipliers, and pure water income.
- **Dynamic Ghosting:** When the ghost is within 30px of the player, its opacity drops to 25% with an ethereal outline to prevent visual obstruction of hostile projectiles.

### 1.3 Narrative & Worldbuilding Hook: "The Chrono-Vessel Protocol"
Deep within the Marianas Abyssal Rift, spatial distortions triggered by the *Chrono Devourer* and *Singularity Core* have fractured the timeline of the defensive fleet. Quantum echoes of vanguard submarines that previously fought—and fell or triumphed—in these depths remain trapped in temporal eddy currents. 

Equipped with the **Quantum Sonar Re-Synthesizer**, current defense commanders can tune into these temporal echoes, pulling forth phantom hulls to fight alongside them or push their operational efficiency beyond mortal limits.

---

## 2. Relay Mechanics (Tag-Team Swap & Setup Inheritance)

### 2.1 The Milestone Tag-Team Relay Concept
Rather than playing as a single submarine from Wave 1 to Wave 20+, the **Relay Mode** introduces a relay-race mechanic where commanders pass the "Baton" at key wave milestones:
- **Milestone Gates:** Wave 5 (Trench Boss), Wave 10 (Abyssal Sovereign), Wave 15 (Crisis Incursion), Wave 20 (End-Game Cataclysm).
- **The Baton Handshake Sequence:**
  1. **Wave Resolution Slow-Motion:** Upon killing the final boss or mob of a milestone wave, the game enters a 2.5-second cinematic slow-motion sequence (time scale drops to 0.25x).
  2. **Submersible Cavitation Dive:** The player’s current submarine deploys ballast blowers, diving into the deep background with a trail of turbulent blue cavitation bubbles.
  3. **Ghost Sub Emergence:** The recorded Ghost Submarine rushes up from the lower screen flank with twin plasma engines burning neon cyan, taking center stage.
  4. **Control Transfer:** The camera snaps into alignment, the UI announces `"RELAY BATON TRANSFERRED! PILOTING ECHO-02"`, and the player immediately assumes direct keyboard/touch control of the incoming vessel!

```
    [WAVE 5 BOSS DEFEATED]
              |
              v
    [CHRONO DILATION: 0.25x]
              |
    +---------+---------+
    |                   |
    v                   v
[PLAYER SUB A]      [GHOST SUB B]
Dives into Deep     Surges from Depth
Ballast Flush       Cavitation Blast
    |                   |
    +---------+---------+
              |
              v
    [LOADOUT INHERITANCE]
    - Fire Rate: Lv. 4 (from Sub B)
    - Multi-Shot: Lv. 3 (from Sub B)
    - Homing Missiles: Lv. 2 (from Sub B)
    - Currency: Combined Pool (A + B)
              |
              v
    [PLAYER NOW CONTROLS SUB B FOR WAVES 6-10]
```

### 2.2 Loadout & Setup Inheritance Systems
When the relay swap triggers, the player inherits the incoming submarine's technical specifications:

| Parameter | Transfer Logic | Strategic Gameplay Impact |
|---|---|---|
| **Weapons & Fire Rate** | Direct inheritance from the Ghost's recorded build | Forces players to adapt to new combat styles (e.g. transitioning from a rapid-fire single-bullet build to a slow piercing sniper build). |
| **Homing Missiles** | Adopts Ghost's missile pod level (1 to 5) | Instantly alters close-range crowd control capabilities. |
| **Defensive Coatings** | Adopts Ghost's Acid Shield / Armor status | Determines whether player can withstand upcoming hazard waves. |
| **Pure Water 💧 Currency** | **Fusion Bank:** Player keeps their own unspent water + receives a 25% "Relay Dividend" from the ghost's banked resources. | Rewards high-efficiency ghost runs without starving the incoming pilot. |
| **Ultimate Gauge** | Preserves the higher of Player or Ghost gauge | Avoids punishing the player for swapping right before a high-threat wave. |
| **Barricade Integrity** | Retains physical battlefield barricades | Forces both pilots to care for the central water defense installation. |

### 2.3 Community "Relay Duo" Collaborative Campaigns
Chrono-Sub Relay enables asynchronous co-op campaigns between friends:
1. **Player A** plays Waves 1 to 5, clears the Trench Boss, and finishes their leg.
2. The game generates a compact **Relay Token** (e.g., `WIR-89F2-KJ3D-990A` or a 1-click URL).
3. **Player B** loads the token: they watch Player A's ghost play Waves 1-5 while providing escort fire, then take the baton at Wave 6 and play through Wave 10!
4. The completed 10-wave relay is packaged and passed to **Player C** for the Stage 15 End-Game Crisis!
5. The combined run is submitted to the **Relay Pantheon Leaderboard**, listing all collaborating pilots:
   `[RANK #3] - Team "Abyssal Kraken" | Leg 1: Pilot_Alice (W1-5) | Leg 2: Pilot_Bob (W6-10) | Leg 3: Pilot_Charlie (W11-15) | Score: 248,920 💧`

---

## 3. Community Challenge Seeds (Daily Seeds & Ghost Rivals)

### 3.1 Deterministic Daily Seed Engine
To guarantee 100% fair and verifiable competition, daily challenges are governed by a seed-driven pseudorandom number generator (PRNG). 

#### Mathematical Formulation (Mulberry32 PRNG)
```typescript
export class DeterministicRNG {
  private state: number;

  constructor(seedStr: string) {
    // Hash string into 32-bit integer
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
    }
    this.state = h >>> 0;
  }

  // Returns pseudo-random float in [0, 1)
  public next(): number {
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}
```

#### Deterministic Seed Bindings
The Daily Seed (e.g. `SEED-2026-09-10`) strictly locks:
1. **Enemy Incursion Compositions:** Specific ordering and coordinate offsets of Normal, Zigzag, Diver, Sniper, and Shielded invaders.
2. **3rd Faction Incursions:** Exact spawn wave and timestamp of Rogue Drones, Stalkers, and Mechs.
3. **Crisis Archetype Selection:** Fixed choice among the 12 Crisis Archetypes (e.g. Wave 15 is locked to *Psionic Shroud* on Mondays, *Singularity Core* on Tuesdays).
4. **Shop Item Catalog & Pricing:** Deterministic discount rolls and inventory availability.

### 3.2 Tiered Rival Ghosts (AI Baseline to World Record)
Every Daily Challenge automatically seeds three distinct rival ghosts into the client:

```
+---------------------------------------------------------------------------------------+
|                              DAILY GHOST RIVAL LADDER                                 |
+-------------------+---------------------------+---------------------------------------+
| Rival Tier        | Identifier                | Baseline Performance Profile          |
+-------------------+---------------------------+---------------------------------------+
| 🥉 Bronze Cadet   | "Echo: Vanguard Recruit"  | Steady clear pace, 60% accuracy,      |
|                   |                           | basic single-shot upgrades, dies W8.  |
+-------------------+---------------------------+---------------------------------------+
| 🥈 Silver Officer | "Echo: Deepsea Captain"   | Aggressive clear, 85% accuracy,       |
|                   |                           | early homing missiles, clears W14.    |
+-------------------+---------------------------+---------------------------------------+
| 🥇 Gold Sovereign | "Echo: Void Sovereign WR" | World record pace, 98% accuracy,      |
|                   | (Top Player or Dev Run)   | max combo routing, clears Stage 20+.  |
+-------------------+---------------------------+---------------------------------------+
```

### 3.3 Frictionless Replay Serialization & Shareable URIs
Replay files must be tiny enough to fit into a standard URL query parameter or Discord message without database overhead.

#### Replay Data Binary Schema (Compact Run-Length Encoding)
```typescript
export interface ReplayHeader {
  version: number;           // 1 byte (v1)
  seed: string;              // 16 bytes UTF-8
  playerName: string;        // 12 bytes UTF-8
  totalFrames: number;       // 4 bytes uint32
  finalScore: number;        // 4 bytes uint32
  finalWave: number;         // 1 byte uint8
  checksum: number;          // 4 bytes CRC32
}

export interface ReplayFrameChunk {
  deltaFrames: number;       // uint16 (how many frames state was held)
  playerX: number;           // uint16 (0 to 600 quantized to 0..65535)
  actions: number;           // uint8 bitmask: [isShooting: 1, useUlt: 2, shopOpen: 4]
}

export interface ReplayShopEvent {
  frame: number;             // uint32
  itemType: 'FIRE_RATE' | 'MULTI' | 'PIERCE' | 'ACID_SHIELD' | 'MISSILE' | 'REPAIR';
}

export interface ReplayPackage {
  header: ReplayHeader;
  frames: ReplayFrameChunk[];
  shopEvents: ReplayShopEvent[];
}
```

- **Compression Efficiency:** Because players often hold movement directions or shooting keys for multiple frames, Run-Length Encoding (RLE) compresses a 15-minute 60-FPS session (54,000 frames) down to roughly **12 KB to 28 KB** of raw binary data.
- **Base64 URL Packing:** Using `pako` (zlib deflate) and Base64URL encoding, an entire 15-wave replay run compresses into a shareable link:
  `https://waterinvader.app/challenge?seed=2026-09-10&ghost=eJzNV11v2zYU...`
- **Zero Friction:** Anyone clicking the link launches Water Invader with the exact daily seed and races against that exact ghost run immediately—no login or account creation required!

---

## 4. Visuals & SFX (Aesthetic & Audio Specification)

### 4.1 Translucent Phantom Submarine Rendering
The Ghost Submarine possesses an instantly recognizable, ethereal, bioluminescent aesthetic that distinguishes it from live player units and enemies while never obstructing bullet visibility.

```
       Visual Rendering Specification: Ghost Submersible
       
                   [Periscope / Sensor Pod]
                          .---.
                         /  *  \  <--- Soft Cyan Glow (#38bdf8, 4px blur)
                       .-'-----'-.
        [Ethereal Hull Wireframe]
        .=================================.
       /   __     __     __     __         \
      |   |  |   |  |   |  |   |  |   (O)   )  <--- Main Cockpit Core
       \  |__|   |__|   |__|   |__|        /        (Pulsing 1.5Hz Neon Aqua)
        '================================='
              \ \ \                   / / /
               \ \ \                 / / /
         [Dual Ethereal Wake Trails & Phosphor Bubbles]
```

#### Canvas 2D Procedural Rendering Routine
```typescript
export function drawGhostSubmarine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  timeAlive: number,
  isBehind: boolean
) {
  ctx.save();

  // 1. Quantum Spectral Alpha & Screen Blending
  // If ghost is falling behind or close to player, adjust alpha to maintain bullet clarity
  const baseAlpha = isBehind ? 0.38 : 0.58;
  const pulseAlpha = baseAlpha + Math.sin(timeAlive * 3.5) * 0.08;
  ctx.globalAlpha = Math.max(0.2, Math.min(0.8, pulseAlpha));
  ctx.globalCompositeOperation = 'screen';

  // 2. Chromatic Aberration Fringe (Offset Red / Cyan pass during high velocity)
  ctx.strokeStyle = '#06b6d4'; // Cyan
  ctx.lineWidth = 2;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10;

  // Render Submarine Hull Outline
  ctx.beginPath();
  ctx.roundRect(x, y + 8, width, height - 16, 12);
  ctx.stroke();

  // 3. Reactor Core Chamber (Phosphor Bioluminescence)
  const coreGradient = ctx.createRadialGradient(
    x + width * 0.7, y + height * 0.5, 2,
    x + width * 0.7, y + height * 0.5, 14
  );
  coreGradient.addColorStop(0, 'rgba(165, 243, 252, 0.9)');
  coreGradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.5)');
  coreGradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(x + width * 0.7, y + height * 0.5, 14, 0, Math.PI * 2);
  ctx.fill();

  // 4. Spectral Sonar Wave Emission (Every 2 seconds)
  const sonarPhase = (timeAlive % 2.0) / 2.0;
  ctx.strokeStyle = `rgba(56, 189, 248, ${1.0 - sonarPhase})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.5, 20 + sonarPhase * 45, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
```

### 4.2 Ethereal Wake & Cavitation Particle System
As the ghost moves across the X-axis:
- **Phosphor Bubble Drift:** Releases micro-bubbles that float upward at 40 px/s with gentle horizontal sine-wave wobble (`Math.sin(timeAlive * 4 + bubble.seed) * 12`).
- **Cavitation Ribbons:** Twin spiraling trails emerge from the ghost’s stern screws, rendered in translucent cerulean (`rgba(56, 189, 248, 0.25)`).
- **Spectral Torpedoes:** Recorded ghost bullets render as elongated diamond plasma bolts in brilliant cyan/white (`#67e8f9`) with trailing 3-frame fading echo silhouettes.

### 4.3 Web Audio API Sound Design (Synthetic Underwater Acoustics)
In strict alignment with `SoundManager.ts`, all audio cues are dynamically synthesized using browser `AudioContext` oscillators, custom biquad filters, and gain envelopes:

#### 1. Spectral Sonar Ping (`playGhostSonarPing()`)
- **Acoustic Character:** Deep, resonant, reverberant underwater ping with a characteristic descending frequency sweep and harmonic resonance.
- **Synthesis Recipe:**
  - **Oscillator 1 (Carrier):** Sine wave starting at 740 Hz, ramping down exponentially to 280 Hz over 0.6 seconds.
  - **Oscillator 2 (Sub-Chamber):** Sine wave at 140 Hz for tactile sub-bass punch.
  - **Biquad Filter:** Low-pass filter set at 850 Hz with `Q = 8.5` (ringing resonance).
  - **Gain Envelope:** Instant attack (0.005s) to 0.18 gain, exponential decay to 0.001 over 0.85s.

```typescript
public playGhostSonarPing() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;
  
  const osc = this.audioCtx.createOscillator();
  const subOsc = this.audioCtx.createOscillator();
  const filter = this.audioCtx.createBiquadFilter();
  const gain = this.audioCtx.createGain();

  // Dual Tone
  osc.type = 'sine';
  osc.frequency.setValueAtTime(740, now);
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.6);

  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(140, now);

  // Resonant Underwater Filter
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(850, now);
  filter.Q.setValueAtTime(8.5, now);

  // Envelope
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

  osc.connect(filter);
  subOsc.connect(filter);
  filter.connect(gain);
  gain.connect(this.audioCtx.destination);

  osc.start(now);
  subOsc.start(now);
  osc.stop(now + 0.85);
  subOsc.stop(now + 0.85);
}
```

#### 2. Baton Relay Handshake Chord (`playRelaySwapSFX()`)
- **Acoustic Character:** Majestic, high-energy harmonic hydro-acoustic chord (C4, G4, C5, E5) layered with high-pressure ballast air discharge.
- **Synthesis Recipe:** 4-voice sine chord swelling over 0.3s, overlaid with a filtered white noise burst simulating pressurized water displacement.

#### 3. Delta Lead / Deficit Radar Cues
- **Lead Chirp (+ Delta):** Double high-frequency ping (880 Hz -> 1320 Hz, 50ms each), crisp and encouraging.
- **Deficit Drone (- Delta):** Low ominous dual pulse (180 Hz -> 140 Hz, 120ms each), alerting the player that the rival is surging ahead.

---

## 5. UI Ghost Delta Time / Score Split Bar (+0.4s / -1.2s)

### 5.1 HUD Architecture & Split Telemetry Bar
The Live Split Bar is positioned directly beneath the Top HUD at the top-center of the 600x800 logical canvas. It draws heavy inspiration from high-stakes racing games (e.g. *TrackMania*, *F1 Telemetry*) and precision speedrunning timers (*LiveSplit*).

```
+---------------------------------------------------------------------------------------+
|                                  LIVE HUD SPLIT BAR                                   |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  [P1 SCORE: 48,200]                   WAVE 8                    [💧 420] [HP: 4/5]     |
|                                                                                       |
|      +-------------------------------------------------------------------------+      |
|      |  GHOST RIVAL: Silver Captain                                            |      |
|      |  [======== LEAD =========|============== BEHIND ===============]       |      |
|      |              ▲ +0.42s    |    Δ SCORE: +1,240 💧                       |      |
|      |            (EMERALD GREEN)                                             |      |
|      +-------------------------------------------------------------------------+      |
|                                                                                       |
+---------------------------------------------------------------------------------------+
```

### 5.2 Split Calculations & Edge-Case Handling

#### 1. Delta Time Calculation Formula
Delta time is measured against the **Wave Checkpoint Clock**:
$$\Delta T = T_{\text{Ghost}}(\text{Wave } W, \text{Mob } K) - T_{\text{Live}}(\text{Wave } W, \text{Mob } K)$$
- When $\Delta T > 0$: Player is faster than the ghost by $+ \Delta T$ seconds $\rightarrow$ Displayed in **Emerald Green** (`#10b981`) with upward marker `▲`.
- When $\Delta T < 0$: Player is slower than the ghost by $- |\Delta T|$ seconds $\rightarrow$ Displayed in **Crimson Red** (`#ef4444`) with downward marker `▼`.
- Neutral Zone: Within $\pm 0.10s$, displayed in **Golden Amber** (`#f59e0b`) indicating neck-and-neck parity.

#### 2. Score Split Tracking
$$\Delta S = S_{\text{Live}}(t) - S_{\text{Ghost}}(t)$$
- Tracks pure score differential in real time. Even if the player is slightly slower on wave clear, a superior combo streak or cleaner rogue kills may give them a substantial $+ \Delta S$ score advantage.

### 5.3 React UI Sub-Component Implementation
```tsx
interface GhostSplitBarProps {
  ghostName: string;
  deltaTime: number;       // Positive = ahead, negative = behind
  deltaScore: number;      // Positive = higher score, negative = lower
  relativeDistance: number;// -1.0 (far behind) to +1.0 (far ahead)
  currentWave: number;
  lang: string;
}

export const GhostSplitBar = React.memo(function GhostSplitBar({
  ghostName,
  deltaTime,
  deltaScore,
  relativeDistance,
  currentWave,
  lang,
}: GhostSplitBarProps) {
  const isAhead = deltaTime >= 0;
  const absDelta = Math.abs(deltaTime).toFixed(2);
  const formattedScore = (deltaScore >= 0 ? `+${deltaScore}` : `${deltaScore}`).toLocaleString();

  return (
    <div 
      data-testid="ghost-split-bar"
      className="absolute top-12 left-1/2 -translate-x-1/2 w-80 sm:w-96 bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-none z-20 flex flex-col gap-1 select-none"
    >
      {/* Header: Ghost Name & Wave Indicator */}
      <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          RIVAL: <strong className="text-slate-200">{ghostName}</strong>
        </span>
        <span>SPLIT W{currentWave}</span>
      </div>

      {/* Center Dynamic Split Bar */}
      <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
        {/* Center Zero Anchor */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 z-10" />
        
        {/* Fill Indicator */}
        {isAhead ? (
          <div 
            className="h-full bg-emerald-500 transition-all duration-150 rounded-r-full"
            style={{ 
              marginLeft: '50%', 
              width: `${Math.min(50, Math.max(2, relativeDistance * 50))}%` 
            }}
          />
        ) : (
          <div 
            className="h-full bg-rose-500 transition-all duration-150 rounded-l-full"
            style={{ 
              marginRight: '50%', 
              marginLeft: `${Math.max(0, 50 - Math.min(50, Math.abs(relativeDistance) * 50))}%`,
              width: `${Math.min(50, Math.max(2, Math.abs(relativeDistance) * 50))}%` 
            }}
          />
        )}
      </div>

      {/* Split Values: Time & Score */}
      <div className="flex justify-between items-center text-xs font-mono font-bold">
        <span className={`flex items-center gap-0.5 ${isAhead ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isAhead ? '▲ +' : '▼ -'}{absDelta}s
        </span>
        <span className={deltaScore >= 0 ? 'text-cyan-300' : 'text-orange-400'}>
          Δ {formattedScore} 💧
        </span>
      </div>
    </div>
  );
});
```

---

## 6. Synergies with Continue / Restart State & Technical Feasibility

### 6.1 Seamless Harmony with Continue vs. Restart Flow
Water Invader already has a finely tuned **Continue vs. Restart** system (`GameOverModal` with pre-continue Shop access). The Chrono-Sub Relay integrates with this architecture cleanly:

```
                      [PLAYER DIES ON WAVE 12]
                                 |
                                 v
                     [GAME OVER MODAL OPENS]
            +--------------------+--------------------+
            |                                         |
            v                                         v
   [OPTION 1: CONTINUE]                      [OPTION 2: RESTART]
   - Ranked Seed: Disables Official WR       - Fully resets run to Wave 1
   - Casual Seed: Rewinds Ghost to W12       - Resets Ghost Replay playback
   - Retains current wave & upgrades         - Fresh split comparison
   - Ghost offers "Rescue Tow Shield"        - Full leaderboard eligibility
   - Accessible Shop for counterplay         
```

#### 1. Ranked Challenge Mode Policy (Strict Leaderboard Integrity)
- In the **Official Daily Challenge**, selecting "Continue" flags the run as `CONTINUED_PRACTICE`.
- The run remains playable and fun for casual completion, but the final score submitted to the Daily Leaderboard locks at the exact frame of the first death (preventing pay-to-win or infinite credit-feed abuse).

#### 2. Casual / Relay Co-op Mode Policy (The "Rescue Tow" Synergy)
- If playing in Casual or Relay Co-op mode, clicking **Continue** activates the **Spectral Tow Cable**:
  - The Ghost Submarine attaches an energy beam to the respawned player vessel.
  - Grants a 4.0-second **Cavitation Barrier** (immunity to piercing bullets and acid rain).
  - Synchronizes the ghost's replay position to the exact start timestamp of the current wave, allowing player and ghost to storm the wave together afresh!

#### 3. Pre-Continue Shop Access Integration
- Players can spend their accumulated Pure Water in the `ShopUpgradePanel` during the Game Over screen (purchasing HP restoration, Homing Missiles, or Acid Shield).
- The replay engine records this as an explicit `ReplayShopEvent`. When the replay is shared, other players see the shop purchase seamlessly executed in the playback timeline!

### 6.2 Technical Feasibility & Performance Budget

```
+========================================================================================+
|                              TECHNICAL FEASIBILITY AUDIT                               |
+========================================================================================+
| Criterion                  | Metric / Budget      | Verification & Feasibility Rationale |
+----------------------------+----------------------+------------------------------------+
| Canvas Render Overhead     | < 0.8 ms / frame     | Vector path caching and procedural |
|                            |                      | canvas strokes require negligible   |
|                            |                      | GPU rasterization overhead.        |
+----------------------------+----------------------+------------------------------------+
| Memory Footprint           | < 45 KB total RAM    | 54,000 frames RLE-compressed down  |
|                            |                      | to ~25 KB array in memory.         |
+----------------------------+----------------------+------------------------------------+
| Fixed-Timestep Accuracy    | 100.0% Deterministic | Fixed delta (1/60s) already baked  |
|                            |                      | into GameManager.ts main loop.     |
+----------------------------+----------------------+------------------------------------+
| Server Infrastructure Cost | $0.00 (Zero Backend) | Client-side PRNG seeds + Base64    |
|                            |                      | URL parameters require zero server |
|                            |                      | computation or database read/write.|
+----------------------------+----------------------+------------------------------------+
| Mobile Responsive Safety   | CSS Only Viewport    | Adheres strictly to rule: logical  |
|                            | No Logical Resize    | canvas dimensions (600x800) remain |
|                            |                      | untouched!                         |
+========================================================================================+
```

1. **Deterministic Physics Guarantee:**
   Because `GameManager.ts` runs on a strict accumulator loop (`FIXED_STEP = 1 / 60`), frame-by-frame replay playback is bit-exact across different browsers and hardware refresh rates (60Hz, 120Hz, 144Hz mobile screens).
2. **Strict Compliance with Architectural Constraints:**
   - **`logicalWidth` (600) & `logicalHeight` (800):** Strictly maintained. All ghost coordinates, hitboxes, and particle emitters operate in the 600x800 coordinate space.
   - **No Source Code Modification Rule:** This proposal is delivered as a comprehensive specification report in `.agents/swarm_d5_cooprelay_6/report.md` without modifying any repository `.ts`, `.tsx`, or `.css` files.
   - **Zero Build / Git Invocations:** Fully compliant with read-only exploration constraints.

---

## 7. Implementation Roadmap & Staged Rollout Plan

If approved for development in a subsequent milestone, the Chrono-Sub Relay system can be deployed in three self-contained phases:

### Phase 1: Replay Recorder & Deterministic Seed Engine
- Implement `DeterministicRNG` (Mulberry32) for seed-driven wave generation.
- Implement `InputRecorder` inside `GameManager.ts` that captures player inputs into an in-memory RLE buffer.
- Store Personal Best (PB) replay locally in `window.localStorage`.

### Phase 2: Ghost Submersible Playback & Visual FX
- Create `GhostSubmersible.ts` entity implementing `ICrisisEntity` or extending `Entity`.
- Add `drawGhostSubmarine` with procedural spectral cyan canvas rendering, glowing cavitation wake particles, and Web Audio sonar pings in `SoundManager.ts`.
- Integrate `GhostSplitBar.tsx` into `components/game-canvas.tsx`.

### Phase 3: Relay Tag-Team Baton Swap & URL Share Codes
- Implement the milestone wave transition slowdown (0.25x time scale) and baton swap at Waves 5, 10, 15, and 20.
- Add Base64URL compression/decompression for sharing replay challenge links.
- Implement leaderboard verification logic for Ranked Daily Challenges.

---

## 8. Summary & Recommendation

The **Chrono-Sub Relay** elevates *Water Invader* from a great retro arcade shooter into a high-retention, socially viral community phenomenon. It introduces the thrill of cooperative fleet defense and competitive speedrunning without the crippling architectural baggage, latency issues, and cloud hosting bills of real-time multiplayer servers.

- **For Casual Players:** A spectral guardian angel providing covering fire and reviving shields, making late-game crises accessible and epic.
- **For Hardcore Players:** Razor-sharp speedrun split tracking (`+0.42s` / `-1.18s`) and daily rival challenges that keep them returning every single day.
- **For Content Creators & Communities:** Instant 1-click shareable replay URLs that allow players to challenge friends and followers on social media with zero friction.

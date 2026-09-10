# Feature Proposal: Risk-Reward Dredging Contracts & Mid-Run Bounty Missions
**Specialist Domain 3.5: Meta-Progression, Run-Economy & Risk-Reward Systems**  
**Project: Water Invader**  
**Author: Specialist 3.5 (42-Agent Brainstorming Swarm)**  
**Target Delivery: `report.md`**  

---

## Executive Summary

**Dredging Contracts & Mid-Run Bounties** is an adrenaline-fueled risk-reward system designed to disrupt passive play, inject high-stakes decision-making into the core arcade loop, and forge deep synergies between the mid-run economy, player weapon loadouts, defensive barricades, and late-game planetary crises.

In current arcade shooters, players often settle into a monotonous equilibrium: hover near the bottom center, fire continuously, dodge predictably, and hide behind barricades. The **Dredging Contracts System** shatters this complacency. Deep-sea mega-corporations—such as the *Acheron Trench Industrial Consortium*, *Hydra-Pacific Deep Salvage*, and the clandestine *Black-Tide PMC*—transmit encrypted teletype contracts directly into the player's submersible cockpit. Players can accept optional, grueling tactical stipulations (e.g., *"Eliminate 3 Rogue Mechs using only Homing Torpedoes"*, *"Survive 3 consecutive waves with zero barricade structural loss"*, or *"Harvest Corrosive Bile cores within 15 seconds of a Crisis Incursion"*).

Success yields massive cash windfalls, score multipliers, and experimental corporate salvage. Failure, however, is unforgiving: players incur devastating debt liens, engine overpressurization penalties, or immediate deployment of ruthless Corporate Bounty Repossession Drones into active invader swarms.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           THE DREDGING CONTRACT LOOP                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [ Inter-Wave Shop / Teletype Arrival ]                                         │
│                    │                                                             │
│                    ▼                                                             │
│   [ Contract Selection & Optional Riders ] ──► (High-Stakes Risk Assessment)     │
│                    │                                                             │
│                    ▼                                                             │
│   [ Live Wave Combat Execution ] ─────────────► (Forced Playstyle Pivot)        │
│          │                           │                                           │
│     (Fulfill Stipulation)      (Breach Condition / Clock Expiry)                 │
│          ▼                           ▼                                           │
│   [ CLAIM BOUNTY ]             [ BREACH OF CONTRACT ]                            │
│   • +💧 150-800 Currency        • -💧 Debt Tax Deduction                         │
│   • 2.5x Score Frenzy          • Corporate Repossession Drones Spawn             │
│   • Industrial Tech Blueprint  • Cavitation Hull Malfunction                     │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Concept & Hook: Corporate Salvage Operations in the Deep Abyssal Trench

### 1.1 The Narrative & Aesthetic Hook
Deep below the oceanic surface, the Invaders are not the only threat—humanity's desperate mega-corps seek to exploit the invasion for sunken riches, alien biological specimens, and pre-fall lost technology. The player's submersible acts not merely as a defender of humanity, but as an independent deep-sea dredge contractor working for competing corporate factions:

1. **Acheron Deep Reclamation Corp (ADRC)**: Industrial miners focused on bulk scrap retrieval, barricade reinforcement data, and structural survival under extreme hydrostatic pressure.
2. **Hydra-Pacific Biocides (HPB)**: Ruthless genetic harvesters paying bounties for alien specimen organs, demanding precision kills on elite Invaders and biological crisis bosses.
3. **Black-Tide Security Contractors (BTSC)**: Aggressive private military contractors who issue combat trials, time-attack kill streaks, and weapon-specific assassination directives.

### 1.2 The Contract Delivery Mechanism: "The Teletype Canister"
Contracts are presented through two immersive avenues:
1. **The Dredge Terminal (Pre-Wave & Inter-Wave Shop)**: A dedicated tab in the Shop interface displaying three competing corporate contracts with varying difficulty ratings (Bronze, Silver, Gold, Black-Budget).
2. **Emergency Mid-Wave Pneumatic Telex**: During high-intensity waves (or upon the arrival of an Elite or Crisis Incursion), a pressurized pneumatic canister slides in from the HUD with a mechanical typewriter chatter (`playPneumaticArrival()` + `playTeletypeChatter()`), offering an immediate, high-multiplier, time-limited **Emergency Bounty Directive** (e.g., *"Specimen Sighted: Eliminate the incoming Rogue Goliath in under 20 seconds"*).

### 1.3 Concrete Contract Archetypes & Exemplars

| Contract ID | Corporate Issuer | Stipulation Title | Operational Objective | Failure Condition | Base Reward |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CON-01** | ADRC (Industrial) | **Aegis Preservation Order** | Clear 3 consecutive waves without losing a single central barricade block. | Any barricade destroyed before wave 3 ends. | +350 💧, +1 Barricade Shield Armor |
| **CON-02** | HPB (Biocides) | **Surgical Vivisection** | Terminate 3 Elite Invaders using *exclusively* Secondary Fire (Homing Missiles). Primary cannon damage to targets immediately voids contract. | Hitting targeted Elite with primary fire or target killed by allies. | +450 💧, 2.0x Score Multiplier for 2 Waves |
| **CON-03** | BTSC (Military) | **Cavitation Blitz** | Annihilate 20 Invaders within the first 15.0 seconds of wave commencement. | Clock reaches 00:00 with <20 kills. | +500 💧, +25% Fire Rate temporary stimulant |
| **CON-04** | ADRC (Industrial) | **Pressure Cooker** | Defeat an Elite Boss while player ship Stress Gauge is maintained strictly above 75%. | Stress Gauge drops below 75% for >2.0s, or Boss dies while <75%. | +600 💧, Instant Tank Repair (+1 HP) |
| **CON-05** | Black-Budget | **Silent Running Protocol** | Clear the wave without taking hull damage and without deploying Ultimate Ability. | Taking 1 hull damage or activating Ultimate. | +750 💧, Prototype Nanite Core |
| **CON-06** | BTSC (Military) | **Apex Predator Hunt** | Assassinate a designated "Omega-Class" High-Speed Rogue Phantom within 30.0s while it is actively hunting you. | Rogue Phantom escapes screen or timer expires. | +850 💧, +5000 Flat Score, Special Salvage |

---

## 2. Mechanics & Mathematical Modeling

### 2.1 Dynamic Reward Scaling Formula

Dredging contracts do not provide static flat payouts; rewards dynamically scale according to player wave depth ($W$), contract tier difficulty coefficient ($K_{Tier}$), current player performance combo ($C$), and active hazard handicap modifiers ($R_{Handicap}$):

$$\text{Reward}_{\text{Currency}} = \left\lfloor \text{Base}_{\text{Cash}} \times \left(1 + 0.12 \times W\right) \times K_{Tier} \times \prod_{i} (1 + R_{i}) \right\rfloor$$

$$\text{Reward}_{\text{Score}} = \left\lfloor \text{Base}_{\text{Score}} \times \left(1 + 0.20 \times W\right) \times \left(1 + \frac{\text{Combo}}{10}\right) \times K_{Tier} \times \prod_{i} (1 + R_{i}) \right\rfloor$$

#### Contract Tier Calibration Table:

| Tier | Name | Appearance Waves | $K_{Tier}$ Multiplier | Base Cash ($\text{Base}_{\text{Cash}}$) | Base Score ($\text{Base}_{\text{Score}}$) | Max Time Limit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | Standard Dredge (Bronze) | Waves 1 – 10 | $1.0\times$ | 120 💧 | 1,500 pts | 45.0s or 1 Wave |
| **Tier 2** | Deep Trench Spec (Silver) | Waves 11 – 20 | $1.75\times$ | 280 💧 | 4,000 pts | 35.0s or 2 Waves |
| **Tier 3** | Abyssal Hazard (Gold) | Waves 21 – 35 | $2.6\times$ | 520 💧 | 9,000 pts | 25.0s or 3 Waves |
| **Tier 4** | Black-Budget Extinction | Waves 36+ / Crisis | $4.2\times$ | 950 💧 | 22,000 pts | 20.0s or Boss Duration |

### 2.2 Penalties for Contract Breach & Failure Mechanics

In standard roguelites, ignoring or failing optional bounties carries zero downside. In *Water Invader*, a signed corporate contract is legally binding. Failure triggers one or more calibrated penalties:

#### 1. Corporate Collateral Liquidation (Direct Financial Penalty):
If the contract condition is breached or the timer expires, the sponsoring corporation immediately forecloses on player reserves:
$$\text{Penalty}_{\text{Cash}} = \min\left(\text{PlayerCurrentCash}, \lfloor 0.40 \times \text{ContractPotentialReward} \rfloor\right)$$
If the player possesses 0 💧, the debt accumulates into a **Negative Corporate Lien**. 50% of all future droplet drops are withheld by the dredge company until the debt is cleared.

#### 2. Corporate Repossession Strike Team (Tactical Penalty):
Failing a Tier 2 or Tier 3 contract deploys a **Black-Tide Repossession Drone** (Faction: ROGUE) at the start of the subsequent wave:
- **Stats**: HP 250, Speed 220 px/s, armed with armor-piercing micro-torpedoes.
- **Behavior**: Ignores standard invaders and relentlessly hones in on the player's submersible, forcing an intense mid-wave dual-front engagement.

#### 3. Dredge Cavitation Overheat (Mechanical Debuff):
Upon contract failure, the dredge rig suffers pneumatic blowout:
- **Submersible Speed**: Reduced by $-20\%$ for 15.0 seconds.
- **Fire Rate**: Reduced by $-15\%$ for 10.0 seconds due to cooling manifold purge.

### 2.3 Optional High-Risk Handicap Clauses (Contract Riders)

When signing a contract in the Shop or Dredge Terminal, players can voluntarily attach **Contract Riders** to amplify payouts:

```
[ ] RIDER ALPHA: "No Sanctuary" ─────────── Barricades deactivated during contract (+65% 💧)
[ ] RIDER BETA:  "Thermal Overdrive" ────── Player takes 1.5x damage from all hazards (+100% 💧)
[ ] RIDER GAMMA: "Volatile Ordnance" ────── Defeated enemies explode in a 50px acid blast (+85% 💧)
[ ] RIDER DELTA: "Munitions Tax" ────────── Primary cannon costs 1 💧 per 20 shots fired (+120% 💧)
```

Mathematical synergy: Compounding three riders ($+65\%$, $+85\%$, $+100\%$) on a Tier 3 Gold Contract scales the final payout by:
$$1.0 \times (1 + 0.65) \times (1 + 0.85) \times (1 + 1.0) = 6.105\times \text{ payout (up to 3,100+ 💧)}$$
This creates an exhilarating gambler's dilemma: stack modifiers for astronomical wealth, risking total annihilation on a single mistake.

---

## 3. Tactical Loop: Playstyle Disruption Under Heavy Invader Pressure

The fundamental design triumph of the Dredging Contracts system is how it dynamically breaks dominant, degenerate strategies.

### 3.1 Scenario A: "The Barricade Guardian Dilemma" (Contract: Aegis Preservation)
- **Standard Behavior**: The player uses barricades as disposable ablative meatshields while spraying projectiles blindly into the swarm.
- **Contract Stipulation**: *"Zero barricade blocks may be destroyed over the next 2 waves."*
- **Tactical Shift**:
  1. The player must aggressively advance toward the mid-line to body-block enemy fire targeting weakened barricades.
  2. When an enemy **Saboteur** (`EnemyType.SABOTEUR`) appears—which specifically gnaws on barricades—the player must prioritize it above all else, including dodging incoming sniper beams.
  3. The player must strategically position behind Allied Repair Bots (`AlliedReinforcements.ts`) to let bots heal damaged blocks before critical thresholds.

### 3.2 Scenario B: "Surgical Munitions Discipline" (Contract: Secondary Fire Only on Elites)
- **Standard Behavior**: Continuous holding of the fire key, showering the screen with multi-shot piercing beams.
- **Contract Stipulation**: *"Eliminate 3 Rogue Mechs using ONLY Homing Missiles. Hitting a target Rogue Mech with primary cannons cancels the contract immediately."*
- **Tactical Shift**:
  1. The player must cease continuous primary fire whenever aiming near a target Rogue Mech.
  2. The player must steer away, maneuvering to align the autonomous homing missile launch pods (`Player.MISSILE_SPECS`) while weaving through enemy crossfire without firing their main gun.
  3. Demands strict trigger discipline, transforming the game from a bullet-hell spray-and-pray into a high-precision tactical engagement.

### 3.3 Scenario C: "Stress Gauge Calibration" (Contract: Boiling Point)
- **Standard Behavior**: Retreating to clear screens, avoiding suppression or stress accumulation.
- **Contract Stipulation**: *"Maintain Submersible Stress Gauge above 80% while destroying the Boss."*
- **Tactical Shift**:
  1. Stress gauge increases when enemy bullets graze the player's collision hull or when barricades are struck.
  2. The player must intentionally "graze" incoming bullets, dancing on the knife's edge of mortal danger to keep the stress meter glowing crimson while pumping out high-cadence return fire.

```
       TACTICAL LOOP STATE TRANSITION UNDER CONTRACT PRESSURE

        ┌─────────────────────────┐
        │  Default Arcade Stance  │ (Safe dodging, barricade camping)
        └────────────┬────────────┘
                     │ Accept Tier 3 Bounty
                     ▼
        ┌─────────────────────────┐
        │  Tactical Role Pivot    │ 
        │  • Target Prioritization│ 
        │  • Trigger Discipline   │ 
        │  • Bullet Grazing       │ 
        └────────────┬────────────┘
                     │
         Enemy Wave Pressure Escalates
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
 [ GREEDY GAMBIT ]         [ CAUTIOUS RETREAT ]
 Risk hull to secure        Sacrifice contract,
 final contract kill       abort to preserve run
        │                         │
        ▼                         ▼
 Massive Payout &         Default Survival,
 Permanent Buffs          Incur Debt Fee
```

---

## 4. Visuals & Audio Design: Analog Submersible Teletype Aesthetics

### 4.1 Visual Styling & CRT Analog Telemetry

To harmonize with *Water Invader*'s underwater sci-fi arcade atmosphere, the Bounty system rejects generic flat sci-fi UI in favor of a tactile, retro-futuristic **Submersible Navigational Teletype** aesthetic:

1. **The Contract Dossier Card**:
   - Background: Dark slate/parchment blueprint texture (`#0f172a` with subtle aged sepia gradient `#1e293b`).
   - Perforated borders with visible sprocket feed holes along the edges.
   - Typography: Monospace mechanical teletype font (`Courier New`, `ui-monospace`, `font-mono`) with slight cathode ray tube horizontal scanlines.
   - Corporate Insignia: High-contrast vector watermarks (e.g., ADRC cog-anchor emblem, Hydra biohazard droplet).

2. **The Ticking Chronometer**:
   - Digital phosphor amber/green LED clock displaying `MM:SS.ms`.
   - Dynamic Chromatic Aberration: As time dips below 10.0s, the timer pulses with cyan/magenta split RGB glitching.
   - Below 5.0s: Screen edges pulse with a subtle vignette heartbeat (`rgba(239, 68, 68, 0.15)`).

3. **Verification Seals & Stamp Animations**:
   - **Success**: An imposing red-ink rubber stamp slams diagonally across the card with dynamic rotation ($-12^\circ$): `[ ★ CONTRACT FULFILLED ★ ]`. A burst of golden hydraulic bubble particles fountains outward.
   - **Failure**: A heavy industrial black/crimson stamp slams down: `[ ✕ BREACH OF CONTRACT — LIEN ASSIGNED ✕ ]`, accompanied by paper-tear particle fragments and static distortion.

```
┌────────────────────────────────────────────────────────────┐
│ • • •  ACHERON DEEP RECLAMATION CORP — TELETYPE  • • • • • │
├────────────────────────────────────────────────────────────┤
│ REF: ADRC-BTY-0982                          LOC: SECTOR 4  │
│ TARGET: ELITE ROGUE MECH [3 SPECIMENS]                     │
│ STIPULATION: SECONDARY HOMING TORPEDOES ONLY               │
│                                                            │
│ PROGRESS: [ ■■■■■■■■■■■■■■■■■■□□□□□□ ] 2 / 3               │
│ STATUS:   PRIMARY FIRE RESTRICTED [ACTIVE]                 │
│ TIME:     00:14.82 [CRITICAL]                              │
│ PAYOUT:   +540 💧 | +7,500 PTS | OVERCLOCK MODULE          │
│                                                            │
│   ┌────────────────────────────────────────────────────┐   │
│   │ [!] WARNING: PRIMARY CANNON DISCHARGE WILL BREACH │   │
│   └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Web Audio API Procedural Sound Recipes

In strict accordance with the game's architecture (`src/game/SoundManager.ts`), all audio effects are procedurally generated via the native browser `AudioContext`—requiring zero external audio assets, zero bundle bloat, and zero latency.

#### SFX Recipe 1: Mechanical Teletype Chatter (`playTeletypeChatter()`)
Simulates the rapid chattering needle of a deep-sea mechanical printing teletype as contract details populate:
```typescript
public playTeletypeChatter(characterCount: number = 6) {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;
  
  for (let i = 0; i < characterCount; i++) {
    const clickTime = now + (i * 0.04) + (Math.random() * 0.01);
    
    // High-frequency mechanical impact click
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200 + Math.random() * 800, clickTime);
    filter.Q.setValueAtTime(4.0, clickTime);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, clickTime);
    
    gain.gain.setValueAtTime(0.04, clickTime);
    gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.025);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start(clickTime);
    osc.stop(clickTime + 0.03);
  }
}
```

#### SFX Recipe 2: Mission Chronometer Metallic Tick (`playContractTick(isCritical: boolean)`)
A crisp underwater chronometer tick with acoustic resonance:
```typescript
public playContractTick(isCritical: boolean = false) {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;
  const osc = this.audioCtx.createOscillator();
  const gain = this.audioCtx.createGain();
  
  osc.type = 'sine';
  const baseFreq = isCritical ? 1760 : 880; // High alert octave if <5s
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);
  
  gain.gain.setValueAtTime(isCritical ? 0.08 : 0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  
  osc.connect(gain);
  gain.connect(this.audioCtx.destination);
  
  osc.start(now);
  osc.stop(now + 0.05);
}
```

#### SFX Recipe 3: Hydraulic Stamp Slam & Success Chime (`playContractSuccess()`)
A resounding mechanical stamp impact followed by a shimmering golden reward arpeggio:
```typescript
public playContractSuccess() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;
  
  // 1. Heavy Mechanical Hydraulic Thud
  const thudOsc = this.audioCtx.createOscillator();
  const thudGain = this.audioCtx.createGain();
  thudOsc.type = 'sawtooth';
  thudOsc.frequency.setValueAtTime(140, now);
  thudOsc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
  thudGain.gain.setValueAtTime(0.25, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  thudOsc.connect(thudGain);
  thudGain.connect(this.audioCtx.destination);
  thudOsc.start(now);
  thudOsc.stop(now + 0.26);

  // 2. High-Pitched Wax Stamp Crack (White Noise Burst)
  const bufferSize = this.audioCtx.sampleRate * 0.05;
  const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = this.audioCtx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = this.audioCtx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(3000, now);
  const noiseGain = this.audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(this.audioCtx.destination);
  noise.start(now);

  // 3. Corporate Clearance Triad Arpeggio (C Major: C5 - E5 - G5 - C6)
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    const noteOsc = this.audioCtx.createOscillator();
    const noteGain = this.audioCtx.createGain();
    const noteStart = now + 0.08 + (idx * 0.06);
    noteOsc.type = 'sine';
    noteOsc.frequency.setValueAtTime(freq, noteStart);
    noteGain.gain.setValueAtTime(0.08, noteStart);
    noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);
    noteOsc.connect(noteGain);
    noteGain.connect(this.audioCtx.destination);
    noteOsc.start(noteStart);
    noteOsc.stop(noteStart + 0.36);
  });
}
```

#### SFX Recipe 4: Breach of Contract Klaxon (`playContractBreach()`)
Dissonant downward-gliding buzzer conveying commercial doom:
```typescript
public playContractBreach() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;
  
  [180, 255].forEach(freq => { // Dissonant tritone chord
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 0.65, now + 0.45);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
  });
}
```

---

## 5. UI Active Contract Tracker HUD Widget

### 5.1 Ergonomic HUD Placement & Viewport Safety
*Water Invader* uses a fixed logical coordinate system (`logicalWidth: 800`, `logicalHeight: 600`) rendered onto an HTML5 `<canvas>` surrounded by responsive CSS wrapping. 

The **Contract Tracker HUD Widget** is designed to occupy the upper right region ($X: 580 \text{ to } 790$, $Y: 45 \text{ to } 140$). This placement guarantees:
- **Zero Collision with Barricades**: Barricades reside at $Y \approx 480$.
- **Zero Collision with Player**: Player resides at $Y \approx 540$.
- **Zero Clipping with Score Header**: Positioned cleanly below the primary Score, Droplet Currency, and Combo indicators ($Y: 10 \text{ to } 40$).
- **Mobile Viewport Compliance**: Uses responsive CSS relative scaling without touching engine logical coordinates.

### 5.2 Widget Visual Wireframe & Layout

```
+-------------------------------------------------------------------------------+
| WAVE 14    SCORE: 48,250    DROPS: 💧 640    COMBO: x3.2 [||||||||||]         |
+-------------------------------------------------------------------------------+
|                                                +----------------------------+ |
|                                                | [ADRC] EXTRACTION CONTRACT | |
|                                                | ELITES KILLED: 2/3         | |
|   (Game Area / Enemies Descending)             | [■■■■■■■■■■■■■■■■□□□□] 66% | |
|                                                | [!] SECONDARY FIRE ONLY    | |
|                                                | TIME: 00:18.4  | REW: 450💧| |
|                                                +----------------------------+ |
|                                                                               |
|                      [BARRICADE]   [BARRICADE]   [BARRICADE]                  |
|                                                                               |
|                                [PLAYER SHIP]                                  |
+-------------------------------------------------------------------------------+
```

### 5.3 Canvas Rendering Engine Implementation Specification
The widget is drawn directly in `GameManager.draw()` or encapsulated in a dedicated `ContractManager.drawHUD(ctx)` call:

```typescript
export class ContractTrackerWidget {
  public draw(ctx: CanvasRenderingContext2D, contract: ActiveContract, timeRemaining: number): void {
    const x = 585;
    const y = 48;
    const width = 205;
    const height = 82;
    const cornerRadius = 6;

    ctx.save();

    // 1. Semi-transparent Tactical Backdrop with Blur Simulation
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = contract.isFailing ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, cornerRadius);
    ctx.fill();
    ctx.stroke();

    // 2. Scanline Texture Overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let sy = y; sy < y + height; sy += 3) {
      ctx.fillRect(x, sy, width, 1);
    }

    // 3. Header: Corporate Sponsor Badge & Title
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = contract.sponsorColor || '#38bdf8';
    ctx.fillText(`${contract.sponsorName} // ${contract.tierName}`, x + 8, y + 14);

    // 4. Objective Label & Target Count
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(contract.shortObjectiveText, x + 8, y + 30);

    // 5. Segmented Progress Bar
    const barX = x + 8;
    const barY = y + 36;
    const barW = width - 16;
    const barH = 7;
    const progressRatio = Math.min(1, Math.max(0, contract.currentProgress / contract.targetProgress));

    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fillRect(barX, barY, barW, barH);

    const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(1, contract.isCritical ? '#f59e0b' : '#38bdf8');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW * progressRatio, barH);

    // 6. Footer: Ticking Chronometer & Guaranteed Payout
    ctx.font = 'bold 10px monospace';
    const isUnder10s = timeRemaining <= 10.0;
    ctx.fillStyle = isUnder10s ? '#ef4444' : '#94a3b8';
    const timeFormatted = Math.max(0, timeRemaining).toFixed(1) + 's';
    ctx.fillText(`⏱ ${timeFormatted}`, x + 8, y + 60);

    ctx.fillStyle = '#34d399';
    ctx.fillText(`+${contract.rewardCash} 💧`, x + barW - 40, y + 60);

    // 7. Critical Warning Banner
    if (contract.stipulationWarning) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '9px sans-serif';
      ctx.fillText(`⚠ ${contract.stipulationWarning}`, x + 8, y + 74);
    }

    ctx.restore();
  }
}
```

---

## 6. Synergies with End-Game Crises, Allies & Feasibility

### 6.1 Deep Synergies with the 12 End-Game Crisis Archetypes
The game currently features 12 Stellaris-style Grand Strategy Crisis Archetypes (`CrisisArchetype` in `src/game/crisis/types.ts`). The Dredging Contracts system weaves directly into these cataclysms through **Crisis Sub-Contract Directives**:

```
                       CRISIS CONTRACT INTEGRATION MATRIX

   Crisis Archetype          Specialized Corporate Bounty            Strategic Payoff
  ────────────────────────────────────────────────────────────────────────────────────────
   VOID_SOVEREIGN            "Null-Anchor Dredge"                    Massive currency +
   (Extra-Dimensional)       Destroy both Dimensional Rifts within   Shield Disruption
                             18.0 seconds of Phase 1 shield raise.   Overload.

   SINGULARITY_CORE          "Relativistic Harvester"                Yields Gravity Plating
   (Event Horizon Entity)    Deal 1,500 damage while pulled within   (Immunity to black-hole
                             the extreme event horizon pull zone.    vortex drag).

   NANITE_HARVESTER          "Molecular Scavenger"                   Instantly restores 100%
   (Grey-Goo Disassembler)   Terminate 8 Nanite Flak pods before     of all barricades
                             they assimilate barricade scrap.        and repairs tank HP.

   GLACIAL_OBLIVION          "Thermal Extraction"                    Unfreezes engine
   (Absolute Zero Engine)    Maintain firing without moving left     speed penalty for all
                             or right for 8.0 consecutive seconds.   subsequent waves.
```

When a Crisis Incursion alerts (`CrisisPhase.INCURSION`), an emergency black-budget contract automatically appears as an optional side-objective. Players daring enough to tackle the Crisis *and* the Bounty receive the ultimate title: **Master Abyssal Dredger** with a permanent $+50,000$ score bonus on victory.

### 6.2 Synergy with Allied Reinforcements (`AlliedReinforcements.ts`)
Allied units (Medic, Repair Bot, Fighter) play an integral role in bounty fulfillment:
- **Contract: "Convoy Escort Protocol"**: Sponsoring corporation tasks the player with ensuring all three Allied Reinforcement bots survive an entire wave. If an Allied Medic drops below 20% HP, the player must body-block incoming fire.
- **Contract: "Allied Kill-Credit Synergy"**: Some contracts require the player to *feed* kills to the Allied Fighter, requiring the player to weaken high-HP elites down to 10% health so the allied fighter can deliver the bounty-securing final strike.

### 6.3 Technical & Architectural Feasibility Analysis

The entire Dredging Contracts subsystem is engineered for seamless drop-in integration without modifying core invariants:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARCHITECTURAL INTEGRATION AUDIT                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Zero Canvas Logical Size Mutation:                                       │
│    • Operates strictly within fixed 800x600 logical canvas boundaries.      │
│    • Guarantees 100% compliance with Playwright mobile viewport tests.      │
│                                                                             │
│ 2. Deterministic State Encapsulation (`ContractManager.ts`):                 │
│    • Clean, decoupled state object storing: `activeContracts: Contract[]`. │
│    • Fully serialized for save/continue compatibility.                      │
│                                                                             │
│ 3. Event-Driven Hook Architecture:                                          │
│    • `onEnemyKilled(enemy, bulletType)` ──► Updates kill tallies.           │
│    • `onBarricadeDamaged(blockIndex)`  ──► Checks preservation clauses.     │
│    • `onWaveCompleted(wave)`           ──► Triggers contract payout/fail.   │
│                                                                             │
│ 4. Zero Garbage Collection Performance Footprint:                           │
│    • Pre-allocated arrays and object pooling for contract criteria.         │
│    • Procedural Web Audio API nodes immediately self-disconnect on end.     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Models & TypeScript Contract Schemas

To demonstrate immediate implementation readiness for subsequent engineering phases, the complete TypeScript schema definitions are specified below:

```typescript
// ============================================================================
// Dredging Contracts & Mid-Run Bounties - Type Definitions
// ============================================================================

export enum CorporateSponsor {
  ACHERON_RECLAMATION = 'ACHERON_RECLAMATION',
  HYDRA_BIOCIDES = 'HYDRA_BIOCIDES',
  BLACK_TIDE_SECURITY = 'BLACK_TIDE_SECURITY',
  DEEP_TRENCH_SYNDICATE = 'DEEP_TRENCH_SYNDICATE',
}

export enum ContractTier {
  TIER_1_STANDARD = 1,
  TIER_2_DEEP_TRENCH = 2,
  TIER_3_ABYSSAL_HAZARD = 3,
  TIER_4_BLACK_BUDGET = 4,
}

export enum StipulationType {
  ELITE_KILL_SECONDARY_ONLY = 'ELITE_KILL_SECONDARY_ONLY',
  BARRICADE_ZERO_DAMAGE = 'BARRICADE_ZERO_DAMAGE',
  TIME_ATTACK_KILL_STREAK = 'TIME_ATTACK_KILL_STREAK',
  HIGH_STRESS_SURVIVAL = 'HIGH_STRESS_SURVIVAL',
  PACIFIST_PRIMARY_FIRE = 'PACIFIST_PRIMARY_FIRE',
  CRISIS_SUB_OBJECTIVE = 'CRISIS_SUB_OBJECTIVE',
  ALLIED_UNIT_ESCORT = 'ALLIED_UNIT_ESCORT',
}

export interface ContractRider {
  id: string;
  nameEn: string;
  nameKo: string;
  description: string;
  rewardMultiplier: number; // e.g., +0.65 -> 1.65x
  isActive: boolean;
  applyEffect: (game: any) => void;
  removeEffect: (game: any) => void;
}

export interface DredgingContract {
  id: string;
  sponsor: CorporateSponsor;
  tier: ContractTier;
  titleEn: string;
  titleKo: string;
  briefing: string;
  stipulation: StipulationType;
  
  // Progress & Conditionals
  currentProgress: number;
  targetProgress: number;
  durationSeconds: number;
  timeRemaining: number;
  isBreached: boolean;
  isCompleted: boolean;
  
  // Constraints
  allowedDamageTypes?: ('PRIMARY' | 'HOMING_MISSILE' | 'ULTIMATE')[];
  disallowedDamageTypes?: ('PRIMARY' | 'HOMING_MISSILE' | 'ULTIMATE')[];
  minStressThreshold?: number;
  maxBarricadeLossAllowed?: number;
  
  // Economics
  baseCashReward: number;
  baseScoreReward: number;
  activeRiders: ContractRider[];
  
  // Penalties
  debtPenaltyCash: number;
  spawnsRepossessionDroneOnFail: boolean;
}

export interface ActiveBountyState {
  currentContract: DredgingContract | null;
  completedContractIds: string[];
  totalContractsFulfilled: number;
  accumulatedCorporateDebt: number;
  activeLienDeductionRate: number; // 0.0 to 0.50
}
```

---

## 8. Summary & Strategic Impact

The **Risk-Reward Dredging Contracts & Mid-Run Bounty Missions** proposal delivers a comprehensive transformation to *Water Invader*'s gameplay experience:

1. **Psychological Thrill & Run Variety**: Every run presents different corporate demands, forcing players to step out of their comfort zone and execute diverse weapon combinations.
2. **Economic Depth**: Provides a skill-based, high-risk economic accelerator that allows veteran players to rapidly amass cash for late-game homing missile upgrades and tank repairs.
3. **Auditory & Visual Spectacle**: Retro teletype audio synthesis, mechanical stamp impacts, and high-contrast CRT cockpit telemetry amplify the game's nautical sci-fi tone without external asset dependencies.
4. **Seamless Technical Fit**: Zero alterations to core canvas dimensions, zero breaking changes to existing test suites, and direct interoperability with the 12 Crisis Archetypes and Allied Reinforcements.

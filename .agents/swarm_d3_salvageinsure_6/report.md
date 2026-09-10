# Feature Proposal: Dynamic Salvage Insurance & High-Stakes Wager Mechanics
**Specialist 3.6 — Creative Brainstorming Swarm for "Water Invader"**  
**Focus Domain**: Dynamic Salvage Insurance, High-Stakes Wager Contracts, and Underwater Risk Underwriting  
**Target File**: `.agents/swarm_d3_salvageinsure_6/report.md`  
**Date**: September 10, 2026  
**Status**: Proposal Ready for Review  

---

## Executive Summary

"Water Invader" is a high-intensity retro-arcade underwater shooter where players battle Alien Invaders, Rogue Cyber-Mechs, and apocalyptic End-Game Crises. However, as the player plunges deeper into the Abyssal Trenches (Waves 10+), the stakes escalate dramatically: weapon upgrades require heavy investments of Pure Water (💧 currency), and a single lapse in positioning can trigger catastrophic hull collapse.

Currently, the Game Over screen presents a binary choice:
1. **Continue (이어하기)**: Resume the current wave with upgrades intact, but potentially trapped in a high-stress, low-health cycle if currency is depleted.
2. **Restart from Beginning (처음부터 시작)**: Total wipe of upgrades, score, and wave progression, which can cause intense player fatigue and "permadeath grief" after deep runs.

This proposal introduces **Dynamic Salvage Insurance & High-Stakes Wager Mechanics**, operated by the **Nautilus Underwriters Guild (심해 해양 재보험 공사)**. This system transforms the game's economy and tactical decision-making into a high-octane actuarial drama:
- **Salvage Insurance**: Players hedge their expeditions by paying premium dividends in the Shop or Pre-Game Lobby. If their submarine sinks, deep-sea recovery drones dredge the wreckage, allowing players to retain 40%–100% of their weapon upgrades and accumulated Pure Water upon restarting, or granting emergency overshields and instant Ultimate charge on Continue.
- **High-Stakes Wagers**: Players enter daring survival contracts (e.g., "No-Hit Boss Wave", "Sub-25s Elite Wipeout", "Barricade Preservation Under Siege") for massive cash dividends (2.0x–5.0x payouts), creating an addictive "press-your-luck" loop.
- **Atmospheric Bureaucracy**: Heavy brass policy stamps, tactile cash register chimes, industrial teletype readouts, and naval klaxons synthesized entirely via the Web Audio API with zero external assets.

---

## 1. Concept & Narrative Hook

### 1.1 The Narrative Setting: The Nautilus Underwriters Guild
Deep beneath the sunlit surface aquifer, anchored into the volcanic basalt of the Marianas Trench, lies the **Nautilus Underwriters Guild (심해 해양 재보험 공사)**. These pragmatic, brass-and-pressure-glass financial syndicates have insured deep-sea mining rigs and salvage submersibles for decades. 

To the Syndicate, the alien invasion and rogue cyber-mech uprising are not just an existential threat—they represent an unprecedented actuarial opportunity. Every submersible pilot venturing into hostile sectors represents an asset. If the pilot survives, the Syndicate collects steady risk premiums and wagering commissions. If the pilot perishes, the Syndicate's autonomous heavy-salvage bathyscaphes dredge the ocean floor to reclaim armaments and pure water before the invaders can assimilate them.

```
       ┌────────────────────────────────────────────────────────┐
       │             NAUTILUS UNDERWRITERS GUILD               │
       │       "In Deo Speramus, Sed Omnia Assecuramus"         │
       │     (In God We Hope, But Everything We Underwrite)     │
       └────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│   DEFENSIVE SALVAGE HEDGE     │       │   AGGRESSIVE BOUNTY WAGER     │
│   "Salvage Recovery Policy"   │       │   "Undersea Hazard Contract"  │
│                               │       │                               │
│ • Deposit pure water in Shop  │       │ • Stake pure water on skill   │
│ • Insures against hull breach │       │ • High-threat survival tasks  │
│ • Retain upgrades on restart  │       │ • Multiplied cash dividends   │
│ • Emergency boost on continue │       │ • Instant Ultimate charge     │
└───────────────────────────────┘       └───────────────────────────────┘
```

### 1.2 The Emotional Core: Eliminating Permadeath Despair
In classic arcade shooters, players experience severe loss aversion. When a player invests 15 minutes dodging piercing bullets, defeating bosses, and upgrading to Homing Missiles Lv 4 (costing hundreds of 💧), dying feels punishing. 

By introducing the **Salvage Insurance Underwriter**, death is transformed from a frustrating setback into a calculated strategic outcome:
1. **The Hedged Run**: "I bought the Gold Sovereign Policy. Even if Wave 15 crushes me, I'll restart Wave 1 with my Homing Missiles and Piercing intact, turning my next attempt into a revenge speedrun!"
2. **The High-Roller Gambit**: "Wave 10 Boss is spawning. I have 200 💧. If I take the 'Under-30s Titan Kill' contract, I can double my bank to 640 💧 and buy Acid Shield right before the toxic biome!"

---

## 2. Mechanics & Mathematical Framework

### 2.1 Dynamic Actuarial Risk Engine (실시간 보험 계리 알고리즘)

Insurance cannot be static; a flat fee would be trivialized in late waves or unaffordable in early waves. The Nautilus Syndicate calculates dynamic premiums using an **Actuarial Risk Formula** based on wave depth, player upgrade valuation, and active danger state.

#### Upgrade Valuation ($V_{\text{upg}}$)
The total sunk capital in the player's current submarine:
$$V_{\text{upg}} = (\text{FireRateLv} \times 50) + (\text{MultiShotLv} \times 100) + (\text{PiercingLv} \times 200) + (\text{AcidShield} \times 150) + \sum_{i=1}^{\text{MissileLv}} \text{MissileCost}_i$$

#### Base Premium ($P_{\text{base}}$)
The base cost to bind an insurance contract:
$$P_{\text{base}} = \text{BaseTierFee} + \alpha \cdot V_{\text{upg}} + \beta \cdot C_{\text{current}}$$
Where:
- $\text{BaseTierFee} \in [40, 100, 220]$ for Bronze, Silver, and Gold policies.
- $\alpha = 0.05$ (5% of installed upgrade value).
- $\beta = 0.08$ (8% of current liquid Pure Water $C_{\text{current}}$).

#### Danger Modifiers ($M_{\text{danger}}$)
Premiums surge when taken under perilous conditions:
- **Biome Depth Tier ($T_{\text{biome}}$)**: $M_{\text{depth}} = 1.0 + (0.10 \times \lfloor\frac{W-1}{10}\rfloor)$ (Surface Aquifer = 1.0x, Cosmic Void = 1.4x).
- **Hull Integrity ($HP / HP_{\text{max}}$)**:
  - If Hull is $5/5$ (Prisinte Condition): **15% Safe-Driver Discount** ($M_{\text{hull}} = 0.85$).
  - If Hull is $1/5$ (Critical Damage): **40% Catastrophe Surcharge** ($M_{\text{hull}} = 1.40$).
- **Threat State**:
  - `BOSS` Wave ($W \pmod 5 == 0$): $+25\%$ surcharge ($M_{\text{threat}} = 1.25$).
  - `CRISIS` Active (Acid Storm, Solar Flare, Titan Horde): $+35\%$ surcharge ($M_{\text{threat}} = 1.35$).

#### Final Premium Calculation:
$$P_{\text{final}} = \text{round}\left( P_{\text{base}} \times M_{\text{depth}} \times M_{\text{hull}} \times M_{\text{threat}} \right)$$

---

### 2.2 The Insurance Policy Catalog

Players can purchase one of three underwriting tiers during any Shop visit (Pre-Game, Between Waves, or Continue Shop):

| Tier | Policy Name | Base Fee | Liquid % | Salvage on Restart | Benefit on Continue | Policy Duration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bronze** | **Scrap Reclamation Bond**<br>*(고철 회수 보증 채권)* | 40 💧 | 5% | • Retain **35% of Pure Water**<br>• 1 Random Upgrade retained at Lv 1 | • +1 Free HP repair upon revival<br>• 1.0s bonus invincibility | 5 Waves |
| **Silver** | **Titanium Armory Covenant**<br>*(티타늄 무기고 보전 계약)* | 110 💧 | 10% | • Retain **60% of Pure Water**<br>• Retain **Highest-Tier Weapon** at current level (e.g. Homing Missiles Lv 3) | • +2 Free HP repair upon revival<br>• +50% Ultimate charge ready<br>• 2.0s bonus invincibility | 8 Waves |
| **Gold** | **Abyssal Sovereign Indemnity**<br>*(심해 군주 완전 재보험)* | 240 💧 | 15% | • Retain **85% of Pure Water**<br>• Retain **ALL Weapon Upgrades** at their exact levels<br>• Wave 1 starts with Allied Escort Drone | • Full Hull Restoration (5/5 HP)<br>• 100% Instant Ultimate Heavy Rain<br>• 3.5s Aegis Shield (Immunity)<br>• Barricades spawn at 150% HP | Permanent for current run until claimed |

---

### 2.3 High-Stakes Wager Mechanics & Payout Table

At the Underwriting Desk, the player can also sign **High-Stakes Wager Contracts** targeting the upcoming wave or upcoming 3-wave cycle. Wagers demand an upfront escrow stake and reward high-skill execution:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNDERWRITERS WAGER CONTRACT MATRIX                       │
├──────────────────────┬────────────┬─────────────────────────────┬───────────┤
│ Contract Type        │ Stake (💧) │ Completion Criteria         │ Payout    │
├──────────────────────┼────────────┼─────────────────────────────┼───────────┤
│ 1. Ironclad Diver    │ 75 💧      │ Clear wave with ZERO hull   │ 2.8x      │
│    (무피격 완벽 방어)│            │ damage taken.               │ (210 💧)  │
├──────────────────────┼────────────┼─────────────────────────────┼───────────┤
│ 2. Blitz Decimator   │ 100 💧     │ Clear all wave hostiles in  │ 2.5x      │
│    (초고속 섬멸 계약)│            │ under 30.0 seconds.         │ (250 💧)  │
├──────────────────────┼────────────┼─────────────────────────────┼───────────┤
│ 3. Bastion Bastion   │ 80 💧      │ Both central barricades     │ 2.2x      │
│    (방어벽 결사 사수)│            │ survive with >= 16 voxels.  │ (176 💧)  │
├──────────────────────┼────────────┼─────────────────────────────┼───────────┤
│ 4. Crossfire Maestro │ 120 💧     │ Induce 6+ mutual kills      │ 3.2x      │
│    (교전 유도 공작)  │            │ between Invaders & Rogues.  │ (384 💧)  │
├──────────────────────┼────────────┼─────────────────────────────┼───────────┤
│ 5. Titan Executioner │ 150 💧     │ Defeat Boss within 40s      │ 3.5x      │
│    (보스 처형 청부)  │            │ without firing Ultimate.    │ (525 💧)  │
├──────────────────────┼────────────┼─────────────────────────────┼───────────┤
│ 6. Leviathan Gambit  │ 50% of all │ Trigger & defeat End-Game   │ 4.5x      │
│    (리바이어던 올인) │ current 💧 │ Crisis without losing an HP.│ (+Trophy) │
└──────────────────────┴────────────┴─────────────────────────────┴───────────┘
```

#### Wager Resolution Logic:
1. **Escrow Lock**: Upon accepting a contract, the stake is deducted from the player's active currency and placed into the Syndicate Escrow Account.
2. **Real-time HUD Tracker**: A specialized wager monitor widget displays in the top-right corner, updating status live (e.g., `[WAGER: 0 HITS / 22.4s REMAINING]`).
3. **Success State**: When the wave completes (`onWaveCleared`), the Syndicate transfers the stake multiplied by the payout factor into the player's pure water reserves, accompanied by a celebratory cash register chime and gold particle fountain.
4. **Failure State**: If the condition is violated (e.g., player takes 1 damage during an Ironclad Diver contract), a loud hydraulic buzzer sounds, the HUD widget flashes red `[CONTRACT BREACHED]`, and the escrowed funds are forfeited.

---

## 3. Tactical & Economy Loop

### 3.1 The Risk-Reward Continuum

```
[CONSERVATIVE HEDGING] <───────────────────────────────> [HIGH-ROLLER AGGRESSION]
• Buys Gold Sovereign Policy                               • Zero Insurance
• Reinvests 20% profits into safety                         • Stakes 50% cash on Wagers
• High survivability, steady progress                       • Rapid power spikes via 3x payouts
• Restart becomes an empowering NG+ run                     • 1 mistake = complete ruin
```

### 3.2 Economic Interlocking with Existing Systems
1. **Pre-Game Shop Synergy**:
   - Players who ended a previous run with a high score or active salvage payout start with a pool of pure water in the Pre-Game Lobby.
   - They can immediately purchase a Silver or Bronze policy before Wave 1 begins, insuring their early momentum.
2. **Combo Multiplier Arbitrage**:
   - High combos multiply pure water drops from defeated aliens. Players who are confident in maintaining a 10x combo can take high-stake wagers to compound their economy exponentially, earning up to 1,500 💧 by Wave 10.
3. **Crisis Event Interaction**:
   - When an End-Game Crisis (e.g., Acid Storm, Solar Flare) alerts on screen, insurance premiums normally surge. However, holding an active policy provides peace of mind, allowing players to focus on offensive tactics rather than cowardly turtling behind barricades.
4. **Allied Reinforcement Synergy**:
   - Certain wagers (such as Bastion Bastion) synergize brilliantly with Allied Repair Bots and Fighters. By buying an Allied Squadron call-in and placing a barricade defense wager, the player creates an automated defensive yield.

---

## 4. Visuals & Sound Design (Web Audio API)

### 4.1 Visual Styling & UI Aesthetics
The visual identity fuses **Victorian Nautical Underwriting** with **Grimdark Underwater Cyberpunk**:
- **Color Palette**:
  - Syndicate Brass / Burnished Gold: `#f59e0b` / `#d97706`
  - Abyssal Parchment Cyan: `#06b6d4` / `#0891b2`
  - Underwriting Red Wax Seal: `#dc2626` / `#991b1b`
  - Escrow Deep Navy: `#0f172a` / `#1e293b`
- **Official Policy Stamp Animation**:
  - When an insurance policy is purchased or claimed, a massive vector-rendered brass wax seal stamp slams down diagonally across the modal with a 15-degree tilt.
  - The stamp reads: `[ OFFICIAL UNDERWRITING — NAUTILUS REINSURANCE ]`.
  - Accompanied by radial shockwave particles and a brief 8-frame screen rumble.
- **Wager Combat HUD Overlay**:
  - An animated ticker tape at the upper edge of the canvas.
  - Golden progress rings indicating remaining contract time or condition thresholds.
  - High-visibility warning icons ensuring zero interference with projectile contrast (preserving the $\ge 7:1$ contrast ratio established in R2).

```
   ┌────────────────────────────────────────────────────────┐
   │ 📜 WAGER ACTIVE: IRONCLAD DIVER [NO-HIT]  ⏱️ 18.4s     │
   │ HULL STATUS: 100% INTACT 🛡️ │ ESCROW: 100 💧 │ WIN: 280 💧│
   └────────────────────────────────────────────────────────┘
```

---

### 4.2 Procedural Web Audio API Sound Architecture
In strict adherence to the project's audio philosophy (demonstrated in `src/game/SoundManager.ts`), **zero external audio files (.mp3/.wav) are required**. All sound effects are synthesized mathematically using oscillators, noise buffers, biquad filters, and exponential gain curves.

#### 1. Mechanical Cash Register Clink & Bell (`playCashRegister()`)
Simulates the mechanical drawer opening followed by the resonant chime of a brass bell:
```typescript
public playCashRegister() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;

  // 1. Mechanical Ratchet Click (Dual noise impulses)
  const bufferSize = this.audioCtx.sampleRate * 0.05;
  const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
  
  const noise = this.audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = this.audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, now);
  filter.Q.setValueAtTime(3.0, now);
  
  const noiseGain = this.audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.3, now);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(this.audioCtx.destination);
  noise.start(now);

  // 2. High-Pitched Brass Bell Chime (C7 & E7 dual harmonics)
  [2093.0, 2637.0].forEach((freq, idx) => {
    const osc = this.audioCtx!.createOscillator();
    const gain = this.audioCtx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + 0.04);
    
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.setValueAtTime(0.25 / (idx + 1), now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    
    osc.connect(gain);
    gain.connect(this.audioCtx!.destination);
    osc.start(now + 0.04);
    osc.stop(now + 0.95);
  });
}
```

#### 2. Hydraulic Wax Stamp Chunk (`playPolicyStamp()`)
A heavy pneumatic thud combined with a metallic seal impact:
```typescript
public playPolicyStamp() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;

  // Sub-bass hydraulic impact
  const subOsc = this.audioCtx.createOscillator();
  const subGain = this.audioCtx.createGain();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(110, now);
  subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.25);
  
  subGain.gain.setValueAtTime(0.5, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  subOsc.connect(subGain);
  subGain.connect(this.audioCtx.destination);
  subOsc.start(now);
  subOsc.stop(now + 0.3);

  // Metallic snap
  const snapOsc = this.audioCtx.createOscillator();
  const snapGain = this.audioCtx.createGain();
  snapOsc.type = 'square';
  snapOsc.frequency.setValueAtTime(820, now);
  snapOsc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
  snapGain.gain.setValueAtTime(0.3, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  snapOsc.connect(snapGain);
  snapGain.connect(this.audioCtx.destination);
  snapOsc.start(now);
  snapOsc.stop(now + 0.1);
}
```

#### 3. Warning Klaxon & Breach Alarm (`playWagerKlaxon()`)
Two-tone alternating naval siren for contract breaches or high-stakes wagers:
```typescript
public playWagerKlaxon() {
  if (!this.enabled || !this.audioCtx || this.isMuted) return;
  const now = this.audioCtx.currentTime;
  const osc = this.audioCtx.createOscillator();
  const gain = this.audioCtx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.setValueAtTime(440, now + 0.15);
  osc.frequency.setValueAtTime(320, now + 0.30);
  
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
  
  osc.connect(gain);
  gain.connect(this.audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.46);
}
```

---

## 5. UI Insurance Selection & Claim Adjustment Modal

### 5.1 Shop Modal Underwriting Tab (Wireframe & Specification)
Within `ShopModal` (in `src/components/game-canvas.tsx`), an elegant two-tab header allows instant toggling between standard ship upgrades and the Nautilus Underwriting Desk:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARMORY & UNDERWRITING SYNDICATE                          │
│  [ 🛠️ SHIP UPGRADES ]             [ 📜 SALVAGE POLICIES & WAGERS (NEW) ]     │
├─────────────────────────────────────────────────────────────────────────────┤
│  AVAILABLE LIQUIDITY: 345 💧                 CURRENT HULL INTEGRITY: 4/5 🛡️ │
│                                                                             │
│  ── ACTIVE POLICIES ──────────────────────────────────────────────────────  │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────────┐  │
│  │ BRONZE SCRAP BOND     │ │ SILVER ARMORY COVENANT│ │ GOLD SOVEREIGN   │  │
│  │ 40 💧 + 5% Cash       │ │ 110 💧 + 10% Cash     │ │ 240 💧 + 15% Cash│  │
│  │                       │ │                       │ │                  │  │
│  │ • 35% Pure Water back │ │ • 60% Pure Water back │ │ • 85% Cash back  │  │
│  │ • 1 Random Upgrade    │ │ • Keep Highest Weapon │ │ • KEEP ALL UPGRS │  │
│  │ • +1 Free HP Continue │ │ • +2 HP Continue      │ │ • Full HP Shield │  │
│  │                       │ │                       │ │                  │  │
│  │   [ BIND CONTRACT ]   │ │   [ BIND CONTRACT ]   │ │  [ CERTIFIED ✔ ] │  │
│  └───────────────────────┘ └───────────────────────┘ └──────────────────┘  │
│                                                                             │
│  ── HIGH-STAKES WAGERS FOR WAVE 12 ───────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🎯 IRONCLAD DIVER: Clear Wave 12 taking 0 Hull Damage                 │  │
│  │ Stake: 75 💧  ───►  Payout on Success: 210 💧 (2.8x Profit)            │  │
│  │                              [ SIGN CONTRACT & ESCROW 75 💧 ]         │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ ⚡ BLITZ DECIMATOR: Annihilate all enemies in under 30.0s             │  │
│  │ Stake: 100 💧 ───►  Payout on Success: 250 💧 (2.5x Profit)            │  │
│  │                              [ SIGN CONTRACT & ESCROW 100 💧 ]        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                              [ LAUNCH NEXT WAVE ]                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Game Over Insurance Claim Settlement Screen
When the player's submarine is destroyed, the Game Over screen displays an itemized **Syndicate Claim Settlement Receipt** prior to the player selecting Continue or Restart:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GAME OVER                                      │
│                  HULL BREACH AT WAVE 14: TOXIC SEABED                       │
│                           FINAL SCORE: 48,920                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  🏛️ NAUTILUS UNDERWRITERS GUILD: CLAIM ADJUSTMENT NOTICE #7721             │
│  Active Policy: GOLD ABYSSAL SOVEREIGN INDEMNITY [STAMPED & VERIFIED]       │
│                                                                             │
│  Gross Expedition Investment:       2,850 💧                                │
│  Policy Salvage Recovery Rate:      85% Guaranteed                          │
│  Net Salvage Escrow Payout:         +2,422 💧                               │
│                                                                             │
│  Insured Armament Retrieval:                                                │
│    ✔ Homing Missiles Pod (Lv 4)     — SECURED BY SALVAGE SUBMERSIBLE        │
│    ✔ Piercing Railgun (Lv 3)        — SECURED BY SALVAGE SUBMERSIBLE        │
│    ✔ Acid Rainproof Coating         — SECURED BY SALVAGE SUBMERSIBLE        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│      [ 🚀 CONTINUE EXPEDITION ]              [ 🔄 RESTART (NEW GAME+) ]     │
│       Claim Emergency Continue Pack           Cash Out Salvage Claim to W1  │
│       • Hull Restored to 5/5 HP               • Start Wave 1 with 2,422 💧  │
│       • 100% Instant Ultimate Ready           • Retain Missiles & Piercing  │
│       • 3.5s Aegis Forcefield                 • Speedrun High Score Attempt │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Synergies with Continue vs Restart Mechanic & Feasibility

### 6.1 Perfecting the Continue vs Restart Dilemma
In the current design (Requirement R1, September 3, 2026), `Continue` keeps the current wave and upgrades, while `Restart from Beginning` completely resets the player to Wave 1 with 0 score and 0 upgrades.

This leads to a psychological divide:
- **Restart Fatigue**: After Wave 15, restarting feels so punishing that players simply quit the game rather than grind back up from scratch.
- **Continue Bankruptcy**: If a player died because they lacked adequate fire rate or homing missiles, continuing on Wave 15 without sufficient funds to purchase upgrades often results in an immediate repeat death within 10 seconds.

**Salvage Insurance directly solves both problems:**
1. **Restart Transformed into Prestige New Game+**:
   - With an active Silver or Gold policy, clicking "Restart from Beginning" does NOT punish the player. Instead, they keep their best weapons and receive their 85% cash back. 
   - The player drops back to Wave 1 as an **Apex Submarine Dreadnought**, tearing through early waves at blazing speed, chaining massive combos, and rapidly reaching new high-score records.
2. **Continue Transformed into a Cinematic Counter-Attack**:
   - If the player chooses "Continue", the insurance policy discharges an **Emergency Survival Surge**: instant 100% Ultimate Heavy Rain, 5/5 full HP restoration, and a 3.5-second impenetrable barrier. The player respawns ready to wipe the screen of the very enemies that just breached their hull!

---

### 6.2 Architectural Feasibility & Codebase Compliance

This feature is designed for 100% zero-friction implementation within the current architecture:

1. **Strict Spatial Constraint Compliance**:
   - As mandated in `AGENTS.md` and `COLLABORATION.md`, `logicalWidth` (800px) and `logicalHeight` (600px) in `GameManager.ts` are **completely untouched**.
   - All modal UI is implemented via Tailwind CSS overlay components in `src/components/game-canvas.tsx`.
2. **Zero-Garbage-Collection Gameplay Pipeline**:
   - Wager condition tracking uses simple numeric state counters updated during existing entity collision routines (`onPlayerHit()`, `onEnemyKilled()`, `onWaveComplete()`).
   - Zero heap allocations occur in the 60 FPS update loop.
3. **Clean State Management in GameManager**:
   ```typescript
   export interface InsurancePolicy {
     tier: 'BRONZE' | 'SILVER' | 'GOLD';
     wavePurchased: number;
     expiresWave: number;
     salvageCashRate: number;
     retainedUpgrades: {
       fireRate: number;
       multiShot: number;
       piercing: number;
       hasAcidShield: boolean;
       homingMissiles: number;
     };
   }

   export interface WagerContract {
     id: string;
     type: 'IRONCLAD' | 'BLITZ' | 'BASTION' | 'CROSSFIRE' | 'BOSS_SPEED';
     stake: number;
     payoutMultiplier: number;
     duration: number;
     targetWave: number;
     conditionFailed: boolean;
   }
   ```
4. **LocalStorage Persistence**:
   - If the player closes the browser tab after dying with an active Gold Policy, the policy state is safely serialized into `localStorage.getItem('waterInvaderSalvagePolicy')`, guaranteeing that their prestige restart or continue bonus is never lost to a browser crash.
5. **Deterministic Playwright E2E Testability**:
   - E2E tests can trigger `window.__gameManager.bindPolicy('GOLD')` or simulate policy purchase via UI click.
   - Tests can verify that `restartFromBeginning()` retains homing missiles when insured, and that continuing provides full HP and ultimate charge.

---

## 7. Comprehensive Feature Matrix Summary

| System Component | Core Specification | Player Value & Engagement Impact |
| :--- | :--- | :--- |
| **Underwater Underwriting Lore** | Nautilus Guild, Abyssal Lloyds, deep-sea salvage bathyscaphes. | Immersive world-building and narrative justification for insurance. |
| **Dynamic Actuarial Formula** | Scaled by depth tier, hull damage %, upgrade value, and crisis state. | Balanced economy that prevents exploitation while remaining affordable. |
| **Three Policy Tiers** | Bronze (Scrap), Silver (Armory), Gold (Sovereign). | Clear progression ladder from cheap safety net to elite prestige insurance. |
| **High-Stakes Wager Contracts** | 6 contract types offering 2.2x–4.5x cash dividends for skill feats. | Intense "push-your-luck" gameplay rewarding high-skill mastery. |
| **Procedural Audio (Web Audio)** | Cash register chime, wax stamp thud, teletype clicks, warning klaxon. | Satisfying, tactile tactile audio feedback with 0 external sound files. |
| **Armory & Claim Modals** | Two-tab shop interface and itemized death settlement receipts. | Intuitive, polished UI that makes death settlement feel rewarding. |
| **Continue / Restart Synergy** | Converts Restart into Prestige NG+ and Continue into a cinematic comeback. | Eliminates permadeath grief and prevents continue-death loops. |

---

## Conclusion

Dynamic Salvage Insurance & High-Stakes Wagers injects an exhilarating financial meta-game into "Water Invader". It solves the game's toughest player retention dilemma—the pain of losing hard-earned upgrades upon death—while offering thrill-seeking players a pathway to amass immense fortunes through high-stakes wagers. 

With procedural Web Audio sound design, strict architectural zero-GC compliance, and deep synergies with the existing Continue/Restart mechanics, this feature stands ready to elevate "Water Invader" into an unforgettable, high-retention arcade experience.

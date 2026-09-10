# FEATURE PROPOSAL: Sunken Ancient Relic Salvage & Seafloor Black Market

> **Document ID:** WI-PROP-RELIC-SALVAGE-03  
> **Author:** Specialist 3.3 (Economy, Salvage & Black Market Systems)  
> **Target Platform:** Next.js / HTML5 Canvas / Web Audio API  
> **Scope:** Pure Ideation & Architectural Proposal (No Source Modifications)  
> **Status:** Final Master Proposal  

---

## Executive Summary

**Sunken Ancient Relic Salvage & Seafloor Black Market** introduces a high-stakes, roguelite meta-layer to *Water Invader*. It bridges the gap between fast-paced arcade shooting and tactical risk-reward decision-making. 

During underwater combat, players dredge sealed pre-cataclysm relics from sunken dreadnoughts and alien oceanic ruins. Between waves—and crucially within the Pre-Wave and Post-Death Continue flows—players can tune into clandestine acoustic channels to access the **Seafloor Black Market**: an illicit deep-trench outpost operated by the enigmatic cyborg salvager **"Scrapper Silas"**. 

Here, players barter using dredged Antiquities and Pure Water, buy into volatile **Mystery Lockboxes**, and acquire **Cursed Relics**—monumentally powerful ancient technologies that extract steep physical or tactical tolls. A high-tension **Bargaining / Haggle mechanic** allows players to push their luck for steep discounts at the risk of enraging the merchant and inflating prices across the trench.

---

## 1. Concept & Hook

### 1.1 Narrative Flavor & Worldbuilding
Centuries before the Invaders shattered the polar caps and flooded the planet, the oceanic depths were a proving ground for forbidden oceanic geo-engineering, experimental naval hyper-weapons, and forgotten extra-terrestrial expeditions. As the surface civilization collapsed into the eternal deluge, these technologies settled into the abyssal trenches, encrusted in rust, silt, and bioluminescent barnacles.

While the regular Armory & Workshop (the frontline defense outpost) offers standardized, regulation military upgrades (fire rate, multishot, piercing), the **Seafloor Black Market** is a clandestine network of scavengers, rogue engineers, and renegade deep-sea divers. Operating out of decommissioned bathyspheres and thermal vent hollows, they deal in uncertified, volatile antiquities:
* *Pre-Cataclysm Naval Weaponry:* Heavy steam-driven kinetic torpedoes and superheated thermite lances.
* *Sunken Alien Xenotech:* Resonating crystalline cores, gravity-inversion plates, and telepathic sonar relays.
* *Forbidden Leviathan Mutagens:* Bioluminescent bio-organs harvested from deep-sea monstrosities.

### 1.2 The Hook: "Power at a Terrifying Price"
Standard upgrades are linear and safe. The Black Market is chaotic, intoxicating, and dangerous:
1. **Active Dredging in Combat:** Players aren't just surviving waves; they are actively tracking and hoisting high-value ancient vaults from the seabed under enemy fire.
2. **The Curse Dilemma:** Will you equip the *Siren's Bleeding Valve*, doubling your projectile volume while sacrificing 1 HP every 30 seconds? Or the *Kraken's Iron Shroud*, making your defensive barricades impervious while cutting your thruster speed in half?
3. **The Street-Bargaining High:** Every transaction is a psychological duel against the merchant. A successful bluff nets an Abyssal Relic for half price; an overzealous push locks you out of the market.

---

## 2. Mechanics & Detailed Mathematical Model

### 2.1 Salvage Dredging System (In-Wave Mechanic)

#### 2.1.1 Spawning Dynamics & Sea Floor Sonar
At the start of selected waves (starting from Wave 3, with 35% baseline chance, scaling +5% every 5 waves), a **Sunken Relic Cache** appears anchored to the seabed floor ($Y = logicalHeight - 35$):
* **Visual Marker:** A pulsing sonar acoustic ping rings out, and a tethered buoy cable with flashing cyan/amber strobe lights appears.
* **Salvage Interaction:** The player ship can deploy a kinetic winch or hover within a $\pm 40\text{px}$ horizontal window above the cache for $2.5\text{ seconds}$ (or strike the anchor clamp with 8 primary shots) to dredge the relic.
* **Risk Factor:** While dredging or focusing the anchor, enemies prioritize flanking runs. Dredging drops a physical **Salvage Curio Capsule** that floats upward towards the surface, requiring the player to intercept it.

```
          [ENEMY SQUADRON - ADVANCING]
                   ▼    ▼    ▼
          
            [ PLAYER SUBMARINE ]  <-- Must stay in dredge column
             |                |
~~~~~~~~~~~~~|~~~~~~~~~~~~~~~~|~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ (Waterline)
             :  (Winch Cable) :
             :                :
             [  RELIC CACHE   ]  (Anchored to seafloor / Alien Wreck)
```

---

### 2.2 Curio & Relic Rarity Tiers

Relics fall into four distinct rarity classifications, governed by a wave-dependent probability distribution:

| Tier | Name Classification | Scrap Value (💧 Pure Water) | Spawn Weight (Wave 1–5) | Spawn Weight (Wave 6–15) | Spawn Weight (Wave 16+) | Visual Accent |
|:---|:---|:---:|:---:|:---:|:---:|:---|
| **Tier 1** | **Dredged Scrap** (Common) | 35 – 60 💧 | 70% | 40% | 15% | Oxidized Copper / Dull Bronze |
| **Tier 2** | **Submerged Antiquity** (Uncommon) | 75 – 130 💧 | 25% | 40% | 35% | Polished Brass / Seafoam Teal |
| **Tier 3** | **Abyssal Artifact** (Rare) | 160 – 260 💧 | 5% | 16% | 35% | Luminescent Cobalt / Electric Violet |
| **Tier 4** | **Pre-Cataclysm Singularity** (Forbidden / Cursed) | 300 – 500 💧 | 0% | 4% | 15% | Eldritch Crimson / Void Obsidian |

#### Mathematical Probability Formula:
Let $W$ be current Wave number. The raw weight $W_t$ for Tier $t$ is calculated as:
$$\text{Weight}_{\text{Tier 1}}(W) = \max\left(10, 80 - 3.5 \cdot W\right)$$
$$\text{Weight}_{\text{Tier 2}}(W) = \min\left(45, 18 + 1.8 \cdot W\right)$$
$$\text{Weight}_{\text{Tier 3}}(W) = \min\left(35, \max\left(0, (W - 3) \cdot 2.2\right)\right)$$
$$\text{Weight}_{\text{Tier 4}}(W) = \min\left(20, \max\left(0, (W - 7) \cdot 1.5\right)\right)$$

Normalized Probability $P(t) = \frac{\text{Weight}_t(W)}{\sum_{i=1}^4 \text{Weight}_i(W)}$.

---

### 2.3 Cursed Relics: Faustian Bargains

Cursed Relics represent the pinnacle of the Black Market. Unlike regular items, **they grant absurd, rule-bending combat powers at the expense of severe tactical vulnerabilities**. A player can equip a maximum of **2 Cursed Relics** simultaneously.

```
+-------------------------------------------------------------------------+
|                         CURSED RELIC CODEX                              |
+-------------------------------------------------------------------------+
| 1. Siren's Bleeding Reactor                                             |
|    - Boon: Primary Fire Rate +120%, Projectiles deal +50% explosive AoE.|
|    - Curse: Drains 1 HP every 35 seconds. Killing an Elite or Boss      |
|             resets this internal decay timer to 35s.                    |
+-------------------------------------------------------------------------+
| 2. Drowned King's Tribute                                               |
|    - Boon: Enemy Pure Water (💧) drop quantity multiplied by 3.5x.       |
|            Bosses drop guaranteed Tier 3 Relics.                        |
|    - Curse: Invader projectile speed +35%. Rogue Stalkers spawn 2x      |
|             more frequently and target the player relentlessly.         |
+-------------------------------------------------------------------------+
| 3. Abyssal Ramming Prow (Nautilus Anchor)                               |
|    - Boon: Player gains a permanent kinetic deflector shield. Ramming    |
|            any non-boss enemy instantly obliterates them for 0 damage.  |
|    - Curse: Submarine engine weight increased by 200%. Horizontal move  |
|             speed reduced by 40%; projectile range reduced by 30%.     |
+-------------------------------------------------------------------------+
| 4. Leviathan's Eye of Discord                                           |
|    - Boon: Rogue Cyber-Faction and Alien Invaders prioritize each other |
|            with +200% aggression. Friendly-fire damage between them     |
|            increased by 300%.                                           |
|    - Curse: The player's own defensive Barricades receive friendly-fire |
|             damage from player bullets and do not auto-regenerate.      |
+-------------------------------------------------------------------------+
| 5. Ghost Ship Sonar Resonator                                           |
|    - Boon: Homing Missiles fire 3 warheads per launch instead of 1,     |
|            with 100% chance to pierce through initial targets.          |
|    - Curse: Canvas peripheral vision is clouded in deep-sea gloom       |
|             (vignette radius 180px); enemies outside the sonar cone are |
|             rendered only as faint wireframe blips until within range.   |
+-------------------------------------------------------------------------+
| 6. Void Singularity Siphon                                              |
|    - Boon: Activating Ultimate (Heavy Rain) pulls all enemy projectiles |
|            into a black hole and converts them into Pure Water.         |
|    - Curse: Ultimate gauge generation from standard kills is reduced    |
|             by 50%. Player takes 2x damage from acid rain droplets.     |
+-------------------------------------------------------------------------+
```

---

### 2.4 Dynamic Bartering & Smuggler Economy Math

The Black Market is governed by dynamic pricing algorithms rather than static shop prices. Silas is an opportunist who smells blood and desperation.

#### 2.4.1 Dynamic Purchase Price Formula
The price $P_{\text{buy}}$ of an item in the Black Market is determined by:
$$P_{\text{buy}} = \text{BasePrice} \times M_{\text{wave}} \times M_{\text{wealth}} \times M_{\text{heat}} \times (1 - \text{Discount}_{\text{haggle}})$$

Where:
* **$\text{BasePrice}$**: Standard valuation (Tier 1: 50💧, Tier 2: 110💧, Tier 3: 220💧, Tier 4: 400💧).
* **Wave Inflation Multiplier ($M_{\text{wave}}$):**
  $$M_{\text{wave}} = 1.0 + 0.055 \times (W - 1)$$
  *(Simulates dwindling deep-water supplies as the surface war escalates).*
* **Wealth Extortion Factor ($M_{\text{wealth}}$):**
  If the player holds significant hoard reserves:
  $$M_{\text{wealth}} = 1.0 + \max\left(0, \frac{\text{CurrentPureWater} - 250}{1000}\right) \times 0.35$$
  *(If the player has 1250💧, prices increase by 35% due to the merchant's greed).*
* **Market Heat Multiplier ($M_{\text{heat}}$):**
  Rises when the player fails haggles or engages in aggressive smuggling (Default = $1.0$, increases up to $1.6$).

#### 2.4.2 Relic Appraisal & Pawn Value
Players can sell dredged relics back to Silas for instant Pure Water:
$$V_{\text{pawn}} = \text{BaseValue} \times \left(0.65 - 0.02 \times \text{ConsecutiveSalesInSession}\right)$$
*(Selling multiple items in one visit floods Silas's cargo bay, slightly degrading resale yields).*

---

## 3. Progression Loop: Mystery Lockboxes & Smuggler Depths

```
[ WAVE COMBAT ]
       │
       ▼ (Dredge Anchored Relic Caches / Destroy Special Elites)
[ SALVAGE RECOVERY ] ──▶ Earn Pure Water (💧) + Relic Capsules
       │
       ▼ (Wave Cleared OR Pre-Game OR Continue Screen)
[ ACCESS BLACK MARKET ] (Toggle clandestine acoustic channel)
       │
       ├─────────────────────────────────────────────┐
       ▼                                             ▼
[ TARGETED RELIC PURCHASE / APPRAISAL ]      [ RISKY MYSTERY CRATES ]
   - Haggle for dynamic discount                - Low-cost Gacha gamble
   - Equip game-changing Cursed Relics          - Pity Counter mechanism
       │                                             │
       └──────────────────────┬──────────────────────┘
                              ▼
                 [ ENHANCED NEXT WAVE LOADOUT ]
```

### 3.1 Smuggler Mystery Lockboxes (The Deep Trench Gamble)
Between waves, players who don't have enough water for top-tier relics can invest in three tiers of uninspected **Smuggler Lockboxes**:

1. **Barnacled Scow Trunk (Cost: 65 💧):**
   * *Contents:* 70% Tier 1 Relic or Scrap Bundle (40–80💧), 25% Tier 2 Relic, 5% Tier 3 Relic.
   * *Safety:* 100% safe (No curses).
2. **Sunken Dreadnought Safe (Cost: 140 💧):**
   * *Contents:* 35% Tier 2 Relic, 45% Tier 3 Relic, 10% Pure Water Jackpot (250💧), 10% Cursed Relic.
   * *Pity Rule:* If 2 consecutive opens yield Tier 2, the 3rd is guaranteed Tier 3 or higher.
3. **Alien Abyssal Sarcophagus (Cost: 280 💧):**
   * *Contents:* 55% Guaranteed Cursed Relic (Tier 4), 30% Elite Weapon Overcharge Capsule, 15% "Trapped Vent" (Explodes on opening: deals no HP damage, but Silas gets spooked and shuts down until next wave!).

---

## 4. Visuals & Audio Design (SFX)

### 4.1 Visual Aesthetic: "Deep Rust & Bioluminescent Sorcery"
The Black Market avoids the clean military blues of the standard armory, replacing it with an oppressive, atmospheric bathypelagic mood:

1. **Color Palette:**
   * Primary Dark: Deep Abyssal Slate `#0a0f18` and Rusted Hull Iron `#2a1d17`.
   * Accent Glowing Runes: Phosphorescent Bio-Cyan (`#00f0ff`), Eldritch Toxic Violet (`#bd00ff`), and Corroded Verdigris (`#10b981`).
   * Cursed Warnings: Hazard Amber (`#f59e0b`) with crackling dark crimson runes (`#ef4444`).
2. **Canvas Rendering Innovations:**
   * **Bioluminescent Barnacle Shimmer:** Relics rendered with canvas gradient halos that breathe (sinusoidal alpha pulsing between 0.35 and 0.85 at $1.2\text{ Hz}$).
   * **Rising Bubble Effervescence:** High-density, upward-drifting micro-bubbles ($r = 1\text{ to }3\text{px}$) with random horizontal wobble escaping from relic lockboxes.
   * **Corrosion Rust Flecks:** Ambient floating flakes drifting slowly across the modal backdrop.
   * **Curse Vignette in Combat:** When equipping a Cursed Relic, the in-game canvas border is adorned with an eerie organic pulsating border matching the relic's color.

### 4.2 SFX Architecture (Procedural Web Audio API Synthesis)
To remain lightweight, dependency-free, and responsive without external MP3/WAV assets, all Black Market sound effects are generated via `AudioContext` synthesizers in `SoundManager.ts`:

```typescript
// Conceptual Sound Synthesis Architecture
class BlackMarketSoundFX {
  private ctx: AudioContext;

  // 1. Heavy Pneumatic Steam Valve (Door / Unboxing release)
  playSteamVent() {
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.38);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  // 2. Abyssal Doubloon Clink (Barter / Sale)
  playCoinClink(pitchMod = 1.0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400 * pitchMod, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(4200 * pitchMod, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // 3. Cursed Relic Eldritch Drone
  playCurseDrone() {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(65.4, this.ctx.currentTime); // C2 low drone
    osc2.frequency.setValueAtTime(68.5, this.ctx.currentTime); // Beating detune

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 1.2);
    osc2.stop(this.ctx.currentTime + 1.2);
  }
}
```

---

## 5. UI Black Market Merchant Interface with Bargaining / Haggle Mechanic

### 5.1 ASCII Layout & UI Wireframe

```
+=============================================================================+
| [SEALED CHANNEL 88.4 kHz]  ⚓ THE SEAFLOOR BLACK MARKET ⚓   [💧 WATER: 340] |
+=============================================================================+
| "Lookin' to survive the deep trench, diver? Regulation gear won't save ya." |
| - Scrapper Silas [Patience: ████████░░ 80%]  [Market Heat: LOW]             |
+-----------------------------------------------------------------------------+
| [DREDGED INVENTORY]         | [SCRAPPER'S BLACK CONTRABAND]                 |
|                             |                                               |
| [1] Rusted Torpedo Propeller| [*] SIREN'S BLEEDING REACTOR (CURSED TIER 4)  |
|     Type: Tier 2 Antiquity  |     +120% Fire Rate, +50% Explosive AoE       |
|     Appraisal: +85 💧       |     [CURSE]: -1 HP every 35s unless Elite dies|
|     [ PAWN FOR 85 💧 ]      |     Asking Price: 380 💧                     |
|                             |     ----------------------------------------- |
| [2] Barnacled Sonar Relay   |     [ BUY DIRECT: 380 💧 ]                    |
|     Type: Tier 1 Scrap      |     [ HAGGLE (-15%): 323 💧 (Chance: 74%) ]   |
|     Appraisal: +40 💧       |     [ AGGRESSIVE BLUFF (-30%): 266 💧 (38%) ] |
|     [ PAWN FOR 40 💧 ]      |                                               |
+-----------------------------+-----------------------------------------------+
| [MYSTERY CRATE AUCTION]                                                     |
| [ Barnacled Trunk: 65 💧 ]   [ Dreadnought Safe: 140 💧 ]   [ Alien Coffer: 280 💧 ]|
|  (Standard Curio / Safe)     (High Tier + Pity Timer)     (Cursed High-Roller)|
+-----------------------------------------------------------------------------+
| [ SWITCH TO MILITARY ARMORY (TAB) ]         [ SEAL HATCH & RESUME COMBAT ]  |
+=============================================================================+
```

### 5.2 The Bargaining & Haggle Mechanic

Instead of passive clicking, haggling introduces a tense push-your-luck mini-game.

#### 5.2.1 Merchant State Machine
Silas maintains two real-time meters during the shopping session:
1. **Patience Gauge ($\text{Patience} \in [0, 100]$):** Starts at 100%. Each haggle attempt drains patience.
2. **Greed Index ($\text{Greed} \in [1.0, 1.8]$):** Escalates when insulted.

#### 5.2.2 Haggle Choice Profiles
When inspecting an item, players have three buying options:
1. **Pay Asking Price:** 100% success. Silas smiles; Patience recovers $+5\%$.
2. **Polite Counter-Offer (15% Discount):**
   * *Base Success Rate:* $75\% - 1.5 \times (\text{Tier} \times 5) + (\text{Patience} \times 0.2)\%$
   * *On Success:* Player gets 15% discount. Patience drops $-15\%$.
   * *On Failure:* Offer rejected. Patience drops $-25\%$. Silas refuses to discount this specific item again.
3. **Aggressive Bluff (30% Discount):**
   * *Base Success Rate:* $40\% - 2.0 \times (\text{Tier} \times 6) + (\text{Patience} \times 0.15)\%$
   * *On Success:* Massive 30% discount! Silas grumbles and respects the nerve.
   * *On Failure:* **"Insult Penalty!"** Silas's Patience plummets by $-40\%$. The item price increases by $+20\%$ for the remainder of the session!

#### 5.2.3 Merchant Outrage & Lockout (Zero Patience)
If Silas's Patience hits **0%**:
* Steam hisses aggressively, sirens flash red on the modal header.
* Silas barks: *"Get off my deck before I torpedo your hull!"*
* The Black Market **locks down instantly**. The player cannot access the Black Market for the current wave, forcing them to rely strictly on the standard military armory.

#### 5.2.4 Critical Barter Strike ("Jackpot Haggle")
Every successful Aggressive Bluff has a **10% chance** to trigger a **Critical Barter Strike**:
* Silas throws in a bonus **Free Dredged Mystery Shard** or **Armor Solder Kit** (+1 Barricade Max HP) out of begrudging admiration!

---

## 6. Synergies with Pre-Continue Shop & Feasibility

### 6.1 Synergy Matrix with Existing Systems

| Existing Game System | Black Market Integration & Synergy Points |
|:---|:---|
| **Pre-Game Shop (Wave 0)** | Players can access the Black Market before Wave 1. If high score or persistent career salvage exists, players can start a run with a high-risk Cursed Relic (e.g., *Drowned King's Tribute* for early score-running speedruns). |
| **Wave-Clear Armory** | Appears as a distinct secondary tab: `[ ARMORY & WORKSHOP ]` vs `[ ⚓ SEAMAN'S CONTRABAND ]`. Players can spend regular water in both places, balancing safe HP/fire-rate upgrades with high-stakes cursed relics. |
| **Pre-Continue Shop (Death Revival)** | **"Desperation Smuggling Deals":** When a player dies and clicks "Continue", Silas appears with exclusive **One-Life Desperation Contracts**: heavy discount on Cursed Relics with curses suspended for exactly 1 wave to help the player overcome the boss/crisis that killed them! |
| **End-Game Crises (12 Types)** | Cursed relics provide targeted counterplay: e.g., *Nautilus Anchor* lets players plow through Titan Hordes; *Void Siphon* absorbs lethal Solar Flare or EMP barrage particles. |
| **3rd Faction (Rogue Cyber-Mechs)** | *Leviathan's Eye of Discord* amplifies the chaotic 3-way crossfire between Invaders and Rogues, turning crossfire farming into an art form. |

### 6.2 Architectural Feasibility & Non-Invasive Implementation Plan

1. **Zero Canvas Grid Modification Guarantee:**
   * In strict accordance with project rules, `logicalWidth` (800) and `logicalHeight` (600) in `GameManager.ts` remain completely untouched.
   * Relics, Dredge Buoys, and underwater capsules are standard `Entity` extensions with bounding boxes that fit into existing collision loops (`checkCollision(rect1, rect2)`).
2. **State Decoupling & Clean React Interfaces:**
   * Extend `GameState` cleanly with an optional sub-tab state or modal overlay without mutating global game loops:
     ```typescript
     export interface RelicItem {
       id: string;
       nameKo: string;
       nameEn: string;
       tier: 1 | 2 | 3 | 4;
       isCursed: boolean;
       boonDescriptionKo: string;
       boonDescriptionEn: string;
       curseDescriptionKo?: string;
       curseDescriptionEn?: string;
       basePrice: number;
       equipped: boolean;
     }

     export interface BlackMarketState {
       isOpen: boolean;
       merchantPatience: number; // 0 to 100
       marketHeat: number;
       inventory: RelicItem[];
       salvagedCurios: RelicItem[];
       mysteryCratesOpened: number;
     }
     ```
3. **Audio Safety:**
   * Procedural synthesis utilizes the existing browser `AudioContext` singleton managed in `SoundManager.ts`, guaranteeing zero asset load failures, 0ms network latency, and zero bandwidth overhead on mobile networks.
4. **Automated Testability (Playwright Ready):**
   * All UI elements carry explicit `data-testid` markers (`black-market-tab`, `haggle-15-btn`, `haggle-30-btn`, `relic-card-siren`, `mystery-box-tier-2`), making future automated Playwright verification seamless.

---

## 7. Comparative Impact Analysis

```
+------------------------------------+---------------------------------------+
| TRADITIONAL LINEAR UPGRADES        | SUNKEN RELIC & BLACK MARKET SYSTEM    |
+------------------------------------+---------------------------------------+
| • +1 Fire Rate, +1 Multishot       | • Radical playstyle pivots & curses   |
| • Deterministic, predictable power | • High-risk psychological gambling    |
| • Disconnected from in-wave action | • Active in-wave dredging objectives  |
| • Repetitive continue purchases    | • Clutch "Desperation Deals" on death |
| • Flat mathematical curve          | • Dynamic bartering economy           |
+------------------------------------+---------------------------------------+
```

### Conclusion
The **Sunken Ancient Relic Salvage & Seafloor Black Market** elevates *Water Invader* from a standard retro arcade clone into a deeply gripping, replayable nautical roguelite experience. It satisfies the core arcade desire for overwhelming firepower while keeping players on edge through diabolical curse trade-offs and nail-biting mercantile haggling.

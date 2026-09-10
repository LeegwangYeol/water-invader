# Feature Proposal: Crew Officer Specialization & Passive Synergy Deck
**Swarm Specialist 3.2 — Deep-Sea Systems & Bridge Combat Synergy**
**Target Project:** Water Invader (Next.js / HTML5 Canvas / Web Audio)
**Document Status:** Complete Architecture & Feature Proposal (Phase 0 Ideation)
**Working Directory:** `/Users/user/src/water-invader/.agents/swarm_d3_crewsynergy_2/`

---

## 1. Executive Summary & Creative Hook

### 1.1 The High Concept: "From Solitary Gunboat to Deep-Sea Flagship"
In its current form, *Water Invader* places the player in control of an agile solitary defense submersible, battling escalating waves of alien cephalopods, crustacean dreadnoughts, and abyssal crises. While the core shooting loop, shop upgrades, homing missile pods, and recent Allied Reinforcement mechanics (the *Aegis Vanguard Dreadnought*) offer intense arcade thrills, the player vessel lacks personal warmth, tactical identity, and long-term synergistic meta-progression.

**Crew Officer Specialization & Passive Synergy Deck** completely reinvents this experience:
> *"You are no longer piloting alone in the pitch-black abyss. Behind your blast-shield stands a hardened bridge crew of deep-sea veterans—each with scarred knuckles, proprietary hydro-tech, and distinct combat philosophies. Slot them into your bridge stations, unlock their passive perk decks, trigger their active tactical protocols with crunchy radio clicks, and witness explosive cross-officer combo resonances that turn your vessel into an impenetrable abyssal fortress."*

### 1.2 The Thematic Hook: The Mariana Outpost Survivor Corps
Set in the flooded post-incursion ocean, human naval command operates from subterranean trench bunkers. The player sub (the *Nautilus-IV Interceptor*) is equipped with four modular bridge stations:
1. **Engineering Core (Main Propulsion & Hull Integrity)**
2. **Tactical Gunnery (Weapon Systems & Ballistics)**
3. **Hydro-Acoustics Station (Sonar, Threat Mapping & Early Warning)**
4. **Xenobiology & Abyssal Research Lab (Alien Physiology, Bio-Plating & Acid Neutralization)**

By hiring and promoting four distinct veteran officers, players unlock a collectible **Passive Synergy Deck** (slotted card perks) and **Active Bridge Abilities** (manual tactical commands mapped to keyboard `[1]-[4]` or `[Q][E][R][F]`, with dedicated on-screen touch badges for mobile).

---

## 2. The Four Veteran Officers: Profiles & Identities

```
+-------------------------------------------------------------------------------------------------------+
|                                    NAUTILUS-IV COMMAND BRIDGE                                         |
+-----------------------------------+-----------------------------------+-------------------------------+
| [STATION 1: ENGINEERING]          | [STATION 2: GUNNERY / WEAPONS]    | [STATION 3: SONAR / SENSORS]  |
| Chief Eng. Ingrid "Anvil" Vane    | Master Gunner Jax "Trident" Callahan| Chief Hydro Ren "Ping" Thorne|
| Amber / Industrial Brass (#f59e0b)| Crimson / Ballistic Red (#ef4444) | Emerald / Sonar Green (#10b981)|
| Specialization: Hull & Barricades | Specialization: Missiles & Pierce | Specialization: Crits & Evasion|
+-----------------------------------+-----------------------------------+-------------------------------+
| [STATION 4: XENOBIOLOGY LAB]      | [BRIDGE CORE RESONANCE MATRIX]    | [ALLIED FLEET UPLINK]         |
| Dr. Lyra Vance (Abyssal Bio)      | Dynamic Dual/Quad Cross-Synergies | Dreadnought & Drone Synergies |
| Electric Cyan / Bio-Violet (#06b6d4) Active Resonance: STEAM & THUNDER | Aegis Vanguard Command Link   |
+-----------------------------------+-----------------------------------+-------------------------------+
```

### 2.1 Chief Engineer: Ingrid "Anvil" Vane
* **Title & Call-sign:** Master Chief Warrant Officer / "Anvil"
* **Visual Persona:** A stocky, cybernetic-armed Scandinavian engineer with soot-smudged cheeks, heavy protective goggles resting on her forehead, and a thick thermal naval jacket over grease-stained overalls.
* **Palette:** Industrial Gold / Warning Amber (`#f59e0b`, `#d97706`).
* **Personality & Philosophy:** Pragmatic, grumpy, fiercely protective of the ship's reactor and defensive bulkheads. She considers weapons "toys for children" and believes raw structural fortitude wins wars.
* **Bridge Station:** Reactor & Damage Control.
* **Core Specialty:** Hull repair, barricade reinforcement, suppression cleanse, collision mitigation.

### 2.2 Weapons Specialist: Master Gunner Jax "Trident" Callahan
* **Title & Call-sign:** Fleet Gunnery Specialist / "Trident"
* **Visual Persona:** A sharp-eyed veteran with a rugged jawline, salt-and-pepper buzzcut, a targeting reticle monocle over his scarred left eye, and a high-collar tactical combat vest adorned with heavy caliber brass pins.
* **Palette:** Crimson / Ballistic Vermilion (`#ef4444`, `#dc2626`).
* **Personality & Philosophy:** Aggressive, calculated, borderline obsessed with muzzle velocity, cavitation dynamics, and homing missile trajectories.
* **Bridge Station:** Fire Control & Ordnance Systems.
* **Core Specialty:** Projectile speed, cavitation blast radius, piercing armor destruction, homing missile salvo multipliers.

### 2.3 Sonar Master: Chief Hydro-Acoustics Specialist Ren "Ping" Thorne
* **Title & Call-sign:** First Sensor Officer / "Ping"
* **Visual Persona:** An eccentric, hyper-focused acoustic prodigy wearing custom noise-cancelling hydrophone headphones, a sleek high-tech turtleneck with glowing green frequency visualizer LEDs, and keen, analytical eyes.
* **Palette:** Radar Emerald / Phosphor Green (`#10b981`, `#059669`).
* **Personality & Philosophy:** Quiet, contemplative, perceives the ocean as a symphony of acoustic waves. He spots enemy vulnerabilities long before visual confirmation.
* **Bridge Station:** Acoustic Radar & Tactical Mapping.
* **Core Specialty:** Critical hit vulnerability tagging, hazard interception warning, bullet slow-mo fields, evasion frames.

### 2.4 Marine Biologist: Dr. Lyra Vance
* **Title & Call-sign:** Chief Xenobiologist / "Nautila"
* **Visual Persona:** An aloof, brilliant oceanographer with silver-streaked dark teal hair tied in a loose ponytail, wearing a glowing bioluminescent dive suit with specimen vials of glowing deep-sea organisms attached to her belt.
* **Palette:** Bioluminescent Cyan / Abyssal Violet (`#06b6d4`, `#8b5cf6`).
* **Personality & Philosophy:** Fascinated by alien biochemistry. She treats alien secretions (including deadly acid rain) not as hazards, but as unrefined bio-fuel and catalytic agents.
* **Bridge Station:** Xenobiology Lab & Environmental Scrubber.
* **Core Specialty:** Acid rain conversion, corrosive debuffs on enemies, stress mitigation, symbiotic life-leech.

---

## 3. Mechanics & Mathematical Formulas

The Crew Officer system operates across three interlocking layers:
1. **Passive Perk Deck (Continuous Stat & Modifier Engine)**
2. **Active Bridge Abilities (Player-Triggered Tactical Commands with Cooldowns)**
3. **Cross-Officer Combo Resonances (Emergent Dual & Quad Passives)**

---

### 3.1 Officer Passive Perks (The Synergy Deck)

Each officer possesses 3 Unlockable Passive Perks (Tier I, Tier II, Tier III). When an officer is assigned to their bridge station, their perks are slotted into the active **Bridge Perk Deck**.

#### 3.1.1 Chief Engineer Ingrid Vane — Engineering Deck
| Perk Name | Tier | Effect Description | Mathematical Formula & Logic |
| :--- | :---: | :--- | :--- |
| **Nano-Alloy Bulkhead** | I | Increases player Max HP by +1 and grants base damage reduction against collision impacts. | $\text{MaxHP} = \text{BaseMaxHP} + 1$<br>$\text{CollisionDamageTaken} = \text{BaseDamage} \times 0.70$ |
| **Active Barricade Tether** | II | At the start of every wave, restores 25% HP to all active barricades. If a barricade is destroyed, generates a shockwave clearing bullets within 100px. | $\text{BarricadeHP}_{\text{new}} = \min(\text{MaxHP}, \text{BarricadeHP} + 0.25 \times \text{MaxHP})$<br>$\text{Radius}_{\text{shockwave}} = 100\text{px}$ |
| **Reactor Heat Siphon** | III | Converting stress into structural energy: when `stressLevel > 50`, passive player movement speed increases by +20% and hull automatically regenerates 1 HP every 25 seconds. | If $\text{stress} > 50$:<br>$v_{\text{player}} = v_{\text{base}} \times 1.20$<br>$\Delta t_{\text{regen}} = 25.0\text{s} \implies \text{HP} = \min(\text{MaxHP}, \text{HP} + 1)$ |

#### 3.1.2 Weapons Specialist Jax Callahan — Gunnery Deck
| Perk Name | Tier | Effect Description | Mathematical Formula & Logic |
| :--- | :---: | :--- | :--- |
| **Supercavitation Propellant** | I | Increases projectile velocity by +25% and reduces weapon base fire rate interval by 12%. | $v_{\text{bullet}} = v_{\text{base}} \times 1.25$<br>$\text{fireRateInterval} = \text{baseFireRate} \times 0.88$ |
| **Apex Homing Warhead** | II | Homing missiles deal +35% increased damage and prioritize elite/boss enemies over common mobs. | $\text{MissileDamage} = \text{BaseMissileDamage} \times 1.35$<br>Target Weight: $\text{Boss} (3.0\times) > \text{Elite} (2.0\times) > \text{Common} (1.0\times)$ |
| **Depleted Uranium Penetrator** | III | Every 4th standard bullet fired becomes a Hyper-Kinetic Rail Slug that ignores enemy armor and pierces through up to 3 enemies without damage decay. | $\text{ShotCounter} \pmod 4 == 0 \implies$<br>$\text{piercing} = \text{currentPiercing} + 3$, $\text{damageMultiplier} = 2.0$ |

#### 3.1.3 Sonar Master Ren Thorne — Hydro-Acoustics Deck
| Perk Name | Tier | Effect Description | Mathematical Formula & Logic |
| :--- | :---: | :--- | :--- |
| **Hydrophone Ping Mark** | I | Standard shots have an 18% chance to "Acoustic Tag" an enemy for 6 seconds. Tagged enemies take +30% critical damage from all sources. | $P(\text{AcousticTag}) = 0.18$<br>If Tagged: $\text{DamageReceived} = \text{BaseDamage} \times 1.30$<br>Duration $\tau = 6.0\text{s}$ |
| **Doppler Evasion Grid** | II | When an enemy projectile comes within 40px of the player ship, player gains a temporary +15% movement burst for 0.6s and suppression decay is doubled. | If $\min(\text{dist}(\text{Bullet}_i, \text{Player})) < 40\text{px}$:<br>$v_{\text{boost}} = 1.15 \times v_{\text{player}}$, $\text{SuppressionDecay} = 30/\text{s}$ |
| **Abyssal Early Warning** | III | Crisis warnings and enemy reinforcement arrival timers are displayed 3 seconds earlier. Reduces crisis hazard projectile spawn frequency by 20%. | $\text{WarningLeadTime} = \text{baseTimer} + 3.0\text{s}$<br>$\lambda_{\text{hazard}} = \lambda_{\text{base}} \times 0.80$ |

#### 3.1.4 Marine Biologist Dr. Lyra Vance — Xenobiology Deck
| Perk Name | Tier | Effect Description | Mathematical Formula & Logic |
| :--- | :---: | :--- | :--- |
| **Symbiotic Osmosis** | I | Defeating an enemy within 150px of the player drops a "Bio-Nutrient Pearl" that grants +10 Pure Water and restores 5% Stress. | $P(\text{Drop}) = 0.40$ if $\text{dist} \le 150\text{px}$<br>$\text{Currency} \mathrel{+}= 10$, $\text{stressLevel} = \max(0, \text{stressLevel} - 5)$ |
| **Acid Alkalizer Coating** | II | Acid rain damage is reduced by 60%. If player already possesses the shop `AcidShield`, acid droplets that hit the shield are absorbed to grant +1 currency each. | If $\text{hasAcidShield} == \text{true}$:<br>$\text{Damage} = 0$, $\text{Currency} \mathrel{+}= 1\text{ per neutralized drop}$ |
| **Bioluminescent Neurotoxin** | III | When hitting enemies with homing missiles or rail slugs, inflicts "Paralytic Neurotoxin" slowing enemy attack speed and movement speed by 35% for 4s. | $\text{EnemySpeed} = \text{EnemySpeed} \times 0.65$<br>$\text{EnemyFireRate} = \text{EnemyFireRate} \times 1.35$ (slower)<br>$\tau_{\text{neuro}} = 4.0\text{s}$ |

---

### 3.2 Active Bridge Abilities

Active bridge abilities provide dynamic clutch moments during combat. Each ability features a cooldown timer, canvas visual representation, audio sound effect, and keybind mapping.

```
+----------------------------------------------------------------------------------------------------+
| KEYBIND | OFFICER    | ABILITY NAME             | COOLDOWN | DURATION | CORE COMBAT EFFECT         |
+---------+------------+--------------------------+----------+----------+----------------------------+
| [1] / Q | Ingrid Vane| EMERGENCY SCRAM PURGE    | 35.0s    | 4.0s     | Cleanses debuffs, +1 HP    |
|         |            | (긴급 격실 차폐 및 스크램)|          |          | temp shield, 300px blast   |
+---------+------------+--------------------------+----------+----------+----------------------------+
| [2] / E | Jax Callahan| TITAN CAVITATION SALVO   | 28.0s    | Instant  | Fires 12 super-cavitating  |
|         |            | (타이탄 공동 어뢰 일제사격)|          |          | torpedoes in 180 deg fan   |
+---------+------------+--------------------------+----------+----------+----------------------------+
| [3] / R | Ren Thorne | HYDRO-ACOUSTIC STASIS    | 32.0s    | 5.0s     | Slows enemy bullets by 70%,|
|         |            | (심해 음향 정적 펄스)    |          |          | exposes all weakspots (crit)|
+---------+------------+--------------------------+----------+----------+----------------------------+
| [4] / F | Lyra Vance | BIOLUMINESCENT DECOY POD | 30.0s    | 6.0s     | Deploys glowing decoy pod  |
|         |            | (심해 발광 유인 포드)    |          |          | drawing 75% enemy fire     |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Specification of Active Abilities:

#### Ability 1: Ingrid Vane — "Emergency Scram Purge" (긴급 격실 차폐 및 스크램)
* **Trigger Key:** `[1]` or `[Q]` (HUD Badge 1)
* **Cooldown:** 35.0 seconds
* **Active Duration:** 4.0 seconds
* **Mechanics:**
  1. Instantly cleanses 100% of player `suppressionLevel` and sets `stressLevel` to 0.
  2. Generates an **Overcharged Ion Nano-Barrier** around the player ship with radius $R = 48\text{px}$. The barrier absorbs up to 2 incoming hits of any damage type (including piercing boss projectiles and acid drops).
  3. Triggers a kinetic shockwave in a 250px radius centered on the player, pushing back nearby common enemies by 80px and destroying all hostile bullets in the blast zone.
* **Canvas VFX:**
  - Double expanding golden shockwave rings (`rgba(245, 158, 11, alpha)`) pulsating outward at $600\text{px/s}$.
  - Hexagonal honey-comb energy shield wrapping the player sprite with glowing amber vertices.

#### Ability 2: Jax Callahan — "Titan Cavitation Salvo" (타이탄 공동 어뢰 일제사격)
* **Trigger Key:** `[2]` or `[E]` (HUD Badge 2)
* **Cooldown:** 28.0 seconds
* **Active Duration:** Instant salvo release
* **Mechanics:**
  1. Launches a fan of 12 Super-Cavitating Heavy Micro-Torpedoes spanning an arc of $180^\circ$ upwards ($-\pi$ to $0$ radians).
  2. Each torpedo travels at $v = 520\text{px/s}$, possesses high-torque homing physics (angular velocity $\omega = 4.5\text{ rad/s}$), deals 8 flat kinetic damage, and detonates upon impact in an $R = 35\text{px}$ cavitation bubble.
  3. Total burst damage potential: $12 \times 8 = 96\text{ damage}$ across the wave front.
* **Canvas VFX:**
  - High-contrast crimson tracer trails (`#ef4444`) with violent bubble wake particles (`rgba(255, 255, 255, 0.8)`).
  - Screen shake impulse of intensity $4.5\text{px}$ lasting $0.25\text{s}$.

#### Ability 3: Ren Thorne — "Hydro-Acoustic Stasis Pulse" (심해 음향 정적 펄스)
* **Trigger Key:** `[3]` or `[R]` (HUD Badge 3)
* **Cooldown:** 32.0 seconds
* **Active Duration:** 5.0 seconds
* **Mechanics:**
  1. Emits an omnidirectional sonar resonance wave traveling from bottom to top across the entire canvas ($600 \times 800$).
  2. For 5.0 seconds, all hostile bullets within the canvas have their velocity reduced by 70%:
     $$v_{\text{enemy\_bullet}}(t) = v_{\text{original}} \times 0.30$$
  3. All enemy entities receive an "Acoustic Resonance Breach" marker: all attacks against them gain $+50\%$ Critical Damage multiplier and $+20\%$ base crit chance.
* **Canvas VFX:**
  - Phosphor-green sonar scan-line sweeping vertically upwards (`#10b981`), followed by concentric circular radar sweeps centered on each enemy.
  - Floating green targeting reticles pulsating above enemy units with damage amplification indicators (`x1.5 CRIT`).

#### Ability 4: Dr. Lyra Vance — "Bioluminescent Decoy Pod" (심해 발광 유인 포드)
* **Trigger Key:** `[4]` or `[F]` (HUD Badge 4)
* **Cooldown:** 30.0 seconds
* **Active Duration:** 6.0 seconds
* **Mechanics:**
  1. Ejects a floating bio-photonic lure pod 120px directly ahead of the player vessel.
  2. The decoy pod pulses with an intense symbiotic pheromone signature, forcing $75\%$ of all active enemies on screen to redirect their targeting and firing vectors toward the pod instead of the player ship.
  3. The pod has $15\text{ HP}$. When its HP depletes or its 6.0s duration expires, it detonates in an **Abyssal Bio-Bloom**, spraying enzyme mist that dissolves all acid rain on screen and heals any nearby Allied Reinforcement units by $+2\text{ HP}$.
* **Canvas VFX:**
  - Intense cyan-violet pulsating bio-orb with spiraling luminescent particles (`#06b6d4`, `#a855f7`).
  - Swirling radial enzyme cloud upon detonation with rising healing crosses.

---

### 3.3 Cross-Officer Combo Resonances

When two or more officers serve on the bridge simultaneously, their personal tech trees create **Cross-Officer Resonances**. These represent the pinnacle of build crafting in *Water Invader*.

```
                      +-----------------------------+
                      |   CHIEF ENGINEER (INGRID)   |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                      |                      |
      [STEAM & THUNDER]      [THERMAL PLUME]        [DEFENSIVE MATRIX]
              |                      |                      |
+-------------v---------------+      |      +---------------v-------------+
| WEAPONS SPECIALIST (JAX)    |      |      | SONAR MASTER (REN)          |
+-------------+---------------+      |      +---------------+-------------+
              |                      |                      |
      [DEAD RECKONING]               |             [ABYSSAL ECHOSPHERE]
              |                      |                      |
              +----------------------+----------------------+
                                     |
                      +--------------v--------------+
                      | MARINE BIOLOGIST (LYRA)     |
                      +-----------------------------+

             >>> GRAND RESONANCE (ALL 4 ACTIVE AT RANK III+) <<<
                    "THE ABYSSAL LEVIATHAN MATRIX"
```

#### 3.3.1 Dual-Officer Resonances

#### 1. Steam & Thunder (Ingrid Vane + Jax Callahan)
* **Synergy Name:** Steam & Thunder (증기와 뇌격)
* **Mechanical Effect:**
  - Weapon firing recoil vents into the propulsion injectors: for every shot fired, player gains a stacking $+0.5\%$ speed boost (up to $+20\%$, decays over 2s of not firing).
  - Every time a barricade absorbs damage, Jax automatically fires 2 retaliatory micro-homing missiles from the barricade's position directly at the attacking enemy!
* **Formula:**
  $$\text{RetaliationTrigger}: \text{BarricadeOnHit} \implies \text{SpawnMissiles}(n=2, \text{dmg}=4)$$

#### 2. Thermal Plume Catalysis (Ingrid Vane + Dr. Lyra Vance)
* **Synergy Name:** Thermal Plume Catalysis (열수구 생체 촉매)
* **Mechanical Effect:**
  - Extreme environmental hazard conversion: Whenever Acid Rain or Solar Flare hazards are active on screen, the player's hull armor converts heat into kinetic shields.
  - While hazards are present, player gains continuous shield regeneration: $+1$ Shield/HP point every 8 seconds, and weapon damage increases by $+25\%$.
* **Formula:**
  $$\text{If HazardActive} == \text{true}: \text{DamageMult} = 1.25, \quad \text{RegenTimer} = 8.0\text{s}$$

#### 3. Dead Reckoning (Jax Callahan + Ren Thorne)
* **Synergy Name:** Dead Reckoning (음향 정밀 탄도학)
* **Mechanical Effect:**
  - Homing missiles locked onto "Acoustic Tagged" targets gain instantaneous target acquisition, $+50\%$ flight speed, and will **never lose lock** even if the target performs evasion maneuvers.
  - Critical hits scored by rail slugs detonate in an acoustic shockwave dealing $50\%$ of the damage to all enemies within 60px.
* **Formula:**
  $$\text{SplashDamage} = \text{CritDamage} \times 0.50, \quad R_{\text{splash}} = 60\text{px}$$

#### 4. Abyssal Echosphere (Ren Thorne + Dr. Lyra Vance)
* **Synergy Name:** Abyssal Echosphere (심해 반향 생태계)
* **Mechanical Effect:**
  - Sonar scans expose the nervous systems of biological invader units.
  - Enemies affected by Acoustic Stasis Pulse or Tagging suffer $+100\%$ increased friendly-fire damage from other enemies! (Direct synergy with R3 Smarter Enemy Friendly Fire mechanics).
* **Formula:**
  $$\text{FriendlyFireMult} = 2.0 \times \text{BaseFriendlyFire}$$

#### 5. Aegis Bulkhead (Ingrid Vane + Ren Thorne)
* **Synergy Name:** Aegis Acoustic Shielding (이지스 음향 방호벽)
* **Mechanical Effect:**
  - Whenever the player vessel takes damage, Ren immediately emits an automatic mini-stasis burst that reflects the next incoming projectile back at the attacker as a friendly blue kinetic bolt.
  - Cooldown: 12 seconds internal cooldown.

#### 6. Bio-Ballistic Cavitation (Jax Callahan + Dr. Lyra Vance)
* **Synergy Name:** Bio-Ballistic Cavitation (생체 부식 탄두)
* **Mechanical Effect:**
  - All piercing rounds leave a corrosive neon-green trail across their trajectory line. Any enemy touching the trail takes 3 corrosive damage per second and suffers $-30\%$ armor for 5 seconds.

---

#### 3.3.2 The Quad-Officer Grand Resonance: "The Abyssal Leviathan Matrix"
When all four officers are recruited and all hold Veteran Rank III (Commander) or higher:
* **Grand Resonance Name:** The Abyssal Leviathan Matrix (심해 리바이어던 통합 지휘 매트릭스)
* **Combat Effect:**
  1. **Unified Bridge Overclock:** All four active bridge ability cooldowns are reduced by $20\%$ globally.
  2. **Sub-Zero Reactor Purge:** Once per game session upon reaching $0\text{ HP}$, the vessel does not sink; instead, the bridge crew enacts an Emergency Reactor Vent:
     - Player HP is restored to $100\%$ ($5/5\text{ HP}$).
     - Massive screen-clearing abyssal flash wiping all non-boss enemy projectiles and dealing $150\text{ damage}$ to all enemies.
     - 4.0 seconds of complete invincibility.
  3. **Fleet Command Synergy:** When Allied Reinforcements (*Aegis Vanguard Dreadnought*) arrive on Wave 15+, the Dreadnought deploys **two additional Escort Interceptors** (total of 4 escort fighters) and its Point-Defense Laser Grid coverage expands from $120\text{px}$ to $220\text{px}$!

---

## 4. Player Progression Loop: Hiring, Milestones & Economy

```
+-------------------------------------------------------------------------------------------------------+
|                                    CREW META-PROGRESSION LOOP                                         |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|    [IN-RUN COMBAT]                                            [POST-RUN / PRE-WAVE DRYDOCK]           |
|    - Sinking Invaders                                         - Salvage Currency ("Pure Water")       |
|    - Surviving Waves                                          - "Abyssal Cores" from Bosses           |
|    - Officer-Specific Milestone Feats                                     |                           |
|          |                                                                |                           |
|          v                                                                v                           |
|    [VETERAN MERIT XP]                                         [CREW RECRUITMENT DECK]                 |
|    - Eng: Barricade saves / Hull absorbs                      - Hire Officer (200 Pure Water)         |
|    - Gun: Homing kills / Multi-kills                          - Promote Rank (Ensign -> Captain)      |
|    - Sonar: Dodges / Tagged crits                             - Respec Perk Loadouts                  |
|    - Bio: Acid absorbs / Debuffs applied                                  |                           |
|          |                                                                |                           |
|          +----------------------------> [PROMOTION] <---------------------+                           |
|                                         - Rank I: Ensign                                              |
|                                         - Rank II: Lieutenant                                         |
|                                         - Rank III: Commander                                         |
|                                         - Rank IV: Fleet Captain                                      |
+-------------------------------------------------------------------------------------------------------+
```

### 4.1 Hiring & Roster Management (Pre-Game & Continue Shop)
Players can access the **Crew Quarters** directly from:
1. **Main Menu / Pre-Game Lobby** (seamlessly expanding on the recent Pre-Game Shop Access update).
2. **Pre-Continue Shop** (accessed when choosing "Continue" on game over).
3. **Inter-Wave Drydock Screen** (between wave completions).

#### Recruitment Costs (Pure Water Currency):
* **Officer Recruitment:** 200 Pure Water per officer. (Starter allowance in game is 150, allowing players to recruit their first officer after completing Wave 1-2).
* **Rank Upgrades:**
  * **Rank I (Ensign):** Unlocks upon hiring. Provides Tier I Passive Perk and Base Active Ability.
  * **Rank II (Lieutenant):** 350 Pure Water + 100 Combat Merits. Unlocks Tier II Passive Perk and -15% Active Ability Cooldown.
  * **Rank III (Commander):** 600 Pure Water + 250 Combat Merits + 1 Abyssal Core (obtained from beating Boss at Wave 10). Unlocks Tier III Passive Perk and Dual-Officer Resonances.
  * **Rank IV (Fleet Captain):** 1000 Pure Water + 500 Combat Merits + 2 Abyssal Cores (Wave 20 Boss). Unlocks Quad-Officer Grand Synergy and Golden Master Badge styling.

---

### 4.2 Combat Merit Milestones (Dynamic In-Game Leveling)
Rather than simple passive grind, officers earn **Combat Merit Points (XP)** through specialized in-mission performance, encouraging expressive playstyles:

```
+------------------+-------------------------------------------------+----------------------------------+
| OFFICER          | COMBAT MERIT CONDITION                          | MERIT XP VALUE                   |
+------------------+-------------------------------------------------+----------------------------------+
| Ingrid Vane      | Barricade repaired or absorbs damage            | +5 Merits per 10 HP protected    |
| (Engineer)       | Emergency Scram Purge cleanses fatal damage     | +25 Merits                       |
|                  | Clearing wave with barricades intact > 80% HP   | +50 Merits                       |
+------------------+-------------------------------------------------+----------------------------------+
| Jax Callahan     | Multi-kill with piercing shot (3+ enemies)      | +15 Merits per multi-kill        |
| (Gunnery)        | Homing missile direct impact on Elite / Boss    | +10 Merits per hit               |
|                  | Defeating Boss within 30 seconds                | +75 Merits                       |
+------------------+-------------------------------------------------+----------------------------------+
| Ren Thorne       | Critical hit scored on Acoustic-Tagged enemy   | +10 Merits per crit              |
| (Sonar)          | Bullet near-miss dodge within 30px              | +5 Merits per graze              |
|                  | Activating Stasis during Crisis Hazard event    | +30 Merits                       |
+------------------+-------------------------------------------------+----------------------------------+
| Dr. Lyra Vance   | Acid rain droplet dissolved or converted        | +2 Merits per drop               |
| (Xenobiology)    | Enemy killed while under neurotoxin debuff      | +12 Merits                       |
|                  | Decoy Pod successfully absorbs 10+ enemy shots  | +40 Merits                       |
+------------------+-------------------------------------------------+----------------------------------+
```

---

### 4.3 Fatigue, Hull Shock & Crew Rotation System (Rogue-lite Depth)
To encourage tactical experimentation and prevent players from rigidly running a single static build forever:
* **Hull Shock (Fatigue Meter):**
  - If the player ship suffers heavy hull damage (HP drops below 2) or endures high suppression ($>80$) for extended periods during a run, active officers gain $+25\text{ Fatigue}$.
  - When an officer's Fatigue reaches $100$, they enter **"Exhausted"** state: their active ability cooldown is increased by $+20\%$.
* **Shore Leave / Rotation:**
  - Between runs, resting an officer in the "Crew Quarters Reserve Berth" for 1 run completely clears all Fatigue and awards them a $+10\%$ Merit XP booster for their next deployment.
  - This incentivizes leveling all 4 officers and rotating them according to incoming Biome threats (e.g., bringing Dr. Lyra Vance for Acid Reef biomes, and Ingrid Vane for Abyssal Trench barricade defense).

---

## 5. Visuals & Audio Design: Retro Anime Portraits & Radio Barks

### 5.1 Visual Aesthetic: 16-Bit Military Sci-Fi Anime (PC-98 & 90s Mecha OVA Inspired)
*Water Invader* shines with crisp pixel retro arcade charm. The crew portraits are designed in a 90s submarine sci-fi aesthetic—reminiscent of classic naval mecha anime (e.g., *Nadia: The Secret of Blue Water*, *Blue Submarine No. 6*, *Silent Service*).

#### Portrait Specifications:
* **Canvas Resolution:** $64 \times 64\text{ pixels}$ native bitmap, rendered crisp with `image-rendering: pixelated`, scaled to $128 \times 128$ in the Crew Quarters deck and $40 \times 40$ in the combat HUD.
* **Palette Depth:** 16 colors per officer with distinctive ambient backlighting.
* **Dynamic Expression States:**
  1. **NEUTRAL / IDLE:** Calm breathing idle, blinking eyes, slight CRT scanline flicker.
  2. **FIRING / COMBAT FOCUS:** Intense glare, targeting crosshair reflected in visor/monocle, mouth open shouting commands.
  3. **HULL CRITICAL / DANGER:** Screen glitch artifacts, sweat beads, damaged visor, red emergency siren reflection.
  4. **VICTORY / CRITICAL HIT:** Confident grin, gold badge sparkle.

```
+-------------------------------------------------------------------------------------------------------+
|                                    DYNAMIC PORTRAIT STATES                                            |
+-------------------+-------------------+-------------------+-------------------+-----------------------+
| OFFICER           | NEUTRAL / READY   | ABILITY TRIGGER   | HULL DANGER (HP<2)| CRISIS VICTORY        |
+-------------------+-------------------+-------------------+-------------------+-----------------------+
| Ingrid Vane       | Grumpy stern gaze | Wrench raised,    | Soot-covered face,| Triumphant fist pump, |
| (Chief Engineer)  | Goggles on brow   | teeth gritted     | red alarm glow    | grin with thumb up    |
+-------------------+-------------------+-------------------+-------------------+-----------------------+
| Jax Callahan      | Monocle glowing,  | Sighting down     | Monocle cracked,  | Cigar lit, smoke curl,|
| (Weapons Spec)    | calculating stare | heavy launcher    | aggressive roar   | "Clean shot."         |
+-------------------+-------------------+-------------------+-------------------+-----------------------+
| Ren Thorne        | Headphones on,    | Eyes wide, screen | Visor distorted,  | Calm head nod,        |
| (Sonar Master)    | listening intently| audio wave spikes | clutching audio rig| "All clear on radar." |
+-------------------+-------------------+-------------------+-------------------+-----------------------+
| Dr. Lyra Vance    | Examining glowing | Injecting bio-vial| Lab coat torn,    | Elegant smirk,        |
| (Marine Biologist)| test vial         | into scrubbers    | toxic mist aura   | swirling blue sample  |
+-------------------+-------------------+-------------------+-------------------+-----------------------+
```

---

### 5.2 Audio Design: Tactical Radio Comms & Submarine Soundscape
Every active ability trigger, milestone achievement, and emergency situation triggers an authentic **Naval Submarine Tactical Radio Comm** sequence:
1. **Preamble:** Heavy electromagnetic mic-key click (`krr-click`).
2. **Voice Bark:** Stylized radio voice line filtered through a 300Hz-3400Hz telephone bandpass filter with subtle analog tape saturation.
3. **Postamble:** Hydrophone chirp or radio squelch tail (`chhh-k`).

#### Radio Voice Bark Script (Bilingual: English & Korean Subtitles):

```
+------------------------------------------------------------------------------------------------------+
| OFFICER          | EVENT TRIGGER            | VOICE BARK (EN / KO SUBTITLE)                          |
+------------------+--------------------------+--------------------------------------------------------+
| Ingrid Vane      | Ability: Emergency Scram | "Pressure seals holding! Reactor scrammed, Cap'n!"      |
|                  |                          | (격실 차폐 완료! 원자로 긴급 냉각 들어갑니다, 함장님!) |
|                  | Barricade Destroyed      | "Bulkhead collapsed! Rerouting reserve hydraulics!"   |
|                  |                          | (방호벽 붕괴! 예비 유압 계통 즉각 우회합니다!)         |
|                  | Low HP (< 2 HP)          | "Hull breach in compartment 4! Keep us off the seabed!"|
|                  |                          | (4번 구획 침수 감지! 배 가라앉히지 마십시오!)           |
+------------------+--------------------------+--------------------------------------------------------+
| Jax Callahan     | Ability: Titan Salvo     | "Ordnance away! Light up the whole damn trench!"       |
|                  |                          | (어뢰 전탄 발사! 저 심해 괴물 놈들을 쓸어버려라!)     |
|                  | Boss Encounter           | "Heavy target locked. Let's see what its armor is made of."|
|                  |                          | (대형 목표 조준 완료. 외피가 얼마나 단단한지 보자고.)  |
|                  | Multi-Kill (5+ enemies)  | "Splash five! That's how we clear a torpedo tube!"     |
|                  |                          | (5척 격침 확인! 이게 바로 어뢰관 비우는 법이지!)       |
+------------------+--------------------------+--------------------------------------------------------+
| Ren Thorne       | Ability: Acoustic Stasis | "Acoustic ping out... Freezing their sonar contacts."  |
|                  |                          | (음향 탐지 펄스 전개... 놈들의 반향 신호를 얼려버립니다)|
|                  | Crisis Event Incursion   | "Massive contact on hydrophones! Depth 800 and closing!"|
|                  |                          | (수중청음기에 초대형 신호 감지! 수심 800, 급속 접근 중!)|
|                  | Critical Hit Tag Scored  | "Vulnerability exposed! Target the central nerve sac!" |
|                  |                          | (약점 식별 완료! 중앙 신경절을 집중 타격하십시오!)      |
+------------------+--------------------------+--------------------------------------------------------+
| Dr. Lyra Vance   | Ability: Bio Decoy Pod   | "Pheromone bloom dispersed. They can't resist the bait."|
|                  |                          | (페로몬 유인체 살포 완료. 놈들은 이 미끼를 거부 못 해요)|
|                  | Acid Rain Weather Start  | "Acidic precipitations... Deploying alkaline scrubbers."|
|                  |                          | (산성비 강하 확인... 알칼리 중화 정화기를 가동합니다.)  |
|                  | Elite Alien Defeated     | "Fascinating organism... Collecting genetic salvage."  |
|                  |                          | (흥미로운 표본이네요... 유전자 잔해를 회수합니다.)      |
+------------------+--------------------------+--------------------------------------------------------+
```

---

## 6. UI Crew Quarters Management Deck & Tactical Ability Badges

The UI is divided into two distinct components:
1. **In-Combat Tactical Ability HUD** (Embedded into the active gameplay canvas).
2. **Crew Quarters & Perk Deck Station** (In the Menu / Shop / Pause overlay).

---

### 6.1 In-Combat Tactical Ability Badges (Canvas HUD)

Located on the bottom edge or lower right of the combat screen, positioned ergonomically for both keyboard players (`[1]-[4]`) and mobile touch interaction.

```
+-------------------------------------------------------------------------------------------------------+
| COMBAT CANVAS (600 x 800)                                                                             |
|                                                                                                       |
|                                     [ENEMY SQUADRONS]                                                 |
|                                                                                                       |
|                                     [BARRICADES]                                                      |
|                                                                                                       |
|                                   [PLAYER SUBMARINE]                                                  |
|                                                                                                       |
| ===================================================================================================== |
| [TACTICAL BRIDGE HUD]                                                                                 |
| +-----------------+ +-----------------+ +-----------------+ +-----------------+                       |
| | [1] INGRID      | | [2] JAX         | | [3] REN         | | [4] LYRA        |  [RESONANCE]          |
| | [PORTRAIT 36px] | | [PORTRAIT 36px] | | [PORTRAIT 36px] | | [PORTRAIT 36px] |  STEAM & THUNDER      |
| | SCRAM PURGE     | | TITAN SALVO     | | ACOUSTIC STASIS | | BIO DECOY       |  [==== 100% OVERCLOCK]|
| | [READY - GLOW]  | | [COOLDOWN: 14s] | | [READY - GLOW]  | | [COOLDOWN: 8s]  |                       |
| | Key: [1] or [Q] | | Key: [2] or [E] | | Key: [3] or [R] | | Key: [4] or [F] |  RADIO: "Seals good!" |
| +-----------------+ +-----------------+ +-----------------+ +-----------------+                       |
+-------------------------------------------------------------------------------------------------------+
```

#### HUD Specifications:
* **Badge Dimensions:** Each badge is $68\text{px wide} \times 54\text{px high}$, situated at $y = 740\text{px}$ (leaving the central bottom safe for player ship maneuvering).
* **Cooldown Visualization:**
  - When on cooldown, a dark semi-transparent radial sweep (`rgba(0, 0, 0, 0.65)`) wipes clockwise with crisp white countdown digits (e.g., `14.2s`).
  - When ability becomes ready: a 0.4s golden flash border (`#fbbf24`), followed by a subtle breathing neon border matching the officer's signature color.
* **Mobile Touch Support:** Tapping directly on the badge on a touch device triggers the ability with 0 latency.

---

### 6.2 Crew Quarters Management Deck (Shop & Meta Screen)

The Crew Quarters screen allows players to view officer dossiers, spend Pure Water to recruit/promote, and review active combo resonances.

```
+-------------------------------------------------------------------------------------------------------+
|                                    NAUTILUS-IV CREW QUARTERS & DRYDOCK                                |
+-------------------------------------------------------------------------------------------------------+
|  AVAILABLE SALVAGE: 650 PURE WATER  |  ABYSSAL CORES: 2  |  ACTIVE COMBOS: 3 RESONANCES ACTIVE        |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|  +-----------------------------+  +----------------------------------------------------------------+  |
|  | [CREW ROSTER]               |  | [OFFICER DOSSIER: CHIEF ENGINEER INGRID VANE]                  |  |
|  |                             |  |                                                                |  |
|  | [*] Chief Eng. Ingrid Vane  |  | [PORTRAIT: 128x128]      RANK: COMMANDER (RANK III)            |  |
|  |     Rank III (Commander)    |  | Amber Neon CRT Frame     MERIT XP: 340 / 500                   |  |
|  |                             |  |                          FATIGUE: 15% (RESTED)                 |  |
|  | [*] Master Gunner Jax       |  |                                                                |  |
|  |     Rank II (Lieutenant)    |  | PASSIVE PERK DECK:                                             |  |
|  |                             |  | [X] Tier I: Nano-Alloy Bulkhead (+1 Max HP, -30% Crash Dmg)    |  |
|  | [*] Sonar Master Ren        |  | [X] Tier II: Active Barricade Tether (Auto-heal barricades)   |  |
|  |     Rank II (Lieutenant)    |  | [X] Tier III: Reactor Heat Siphon (Speed & Regen at High Stress)|  |
|  |                             |  |                                                                |  |
|  | [ ] Dr. Lyra Vance          |  | ACTIVE BRIDGE ABILITY:                                         |  |
|  |     [RECRUIT - 200 WATER]   |  | "EMERGENCY SCRAM PURGE" (Cooldown: 35s)                        |  |
|  |                             |  | Cleanses debuffs, generates 2-hit nano-shield & bullet blast.  |  |
|  +-----------------------------+  +----------------------------------------------------------------+  |
|                                                                                                       |
|  +-------------------------------------------------------------------------------------------------+  |
|  | [BRIDGE RESONANCE MATRIX]                                                                       |  |
|  | [*] STEAM & THUNDER (Ingrid + Jax): Barricade damage counter-fires 2 homing missiles!           |  |
|  | [*] AEGIS ACOUSTIC SHIELD (Ingrid + Ren): Reflects 1 hostile shot every 12 seconds.               |  |
|  | [!] GRAND LEVIATHAN PROTOCOL: (Requires recruiting Dr. Lyra Vance to activate)                  |  |
|  +-------------------------------------------------------------------------------------------------+  |
|                                                                                                       |
|  [PROMOTE TO FLEET CAPTAIN: 1000 WATER + 2 CORES]          [BACK TO MISSION / RESUME COMBAT]          |
+-------------------------------------------------------------------------------------------------------+
```

---

## 7. Deep Synergies with Allied Reinforcements & Game Ecosystem

A critical strength of this proposal is how seamlessly it interlocks with existing features—most notably the **Allied Reinforcements System** (`AlliedReinforcements.ts` — Aegis Vanguard Command Dreadnought) and the four allied helper types (`Helper.ts` — Fighter, Medic, Repair Bot, Tank).

### 7.1 Officer Cross-Links with Allied Reinforcements
When the Dreadnought warps in, each staffed officer establishes an instant tactical link:

```
+-------------------------------------+-----------------------------------------------------------------+
| BRIDGE OFFICER                      | SYNERGY WITH ALLIED REINFORCEMENTS & HELPER DRONES              |
+-------------------------------------+-----------------------------------------------------------------+
| Ingrid Vane (Chief Engineer)        | * Boosts Repair Bot (REPAIRER) repair rate by +50%.             |
|                                     | * Dreadnought Nano-Shield Aura interval reduced from 5.0s -> 3.5s|
|                                     | * Allied Tank drones gain +30% maximum HP.                      |
+-------------------------------------+-----------------------------------------------------------------+
| Jax Callahan (Weapons Specialist)   | * Escort Interceptors gain Homing Micro-Missiles.               |
|                                     | * Dreadnought Forward Heavy Plasma Cannons fire every 0.55s     |
|                                     |   (down from 0.8s), with +1 extra projectile damage.            |
|                                     | * Allied Fighter drones gain piercing ballistics.               |
+-------------------------------------+-----------------------------------------------------------------+
| Ren Thorne (Sonar Master)           | * Expands Dreadnought Point-Defense Laser Grid radius           |
|                                     |   from 120px to 180px, vaporizing 40% more enemy projectiles.   |
|                                     | * Allied interceptors automatically target tagged weakspots.   |
+-------------------------------------+-----------------------------------------------------------------+
| Dr. Lyra Vance (Marine Biologist)   | * Allied Medic drones deploy an expanded bio-cleanse mist that  |
|                                     |   completely neutralizes environmental Acid Rain in a 200px zone|
|                                     | * Alien enemies destroyed by Dreadnought drop +50% Pure Water.  |
+-------------------------------------+-----------------------------------------------------------------+
```

### 7.2 Synergy with Core Weapons & End-Game Crises
* **Homing Missiles (유도탄):** Jax Callahan's perks directly scale and enhance the newly introduced Homing Missile pods, allowing late-game missile swarms to dominate swarms of Tier-3 monsters.
* **Barricade Saboteurs:** Ingrid Vane's barricade tether directly counters the newly introduced Saboteur monsters, preventing barricade collapse.
* **Piercing Enemy Damage:** Ren Thorne's evasion boost and Ingrid's damage reduction provide vital counterplay against the escalating piercing mob damage in high waves.

---

## 8. Technical Feasibility & Clean-Room Architecture Plan

The implementation of this system respects all architectural and performance constraints established in the repository.

### 8.1 Zero-Regression Constraint Checklist
* **Strict Logical Bounds:** Does NOT modify `logicalWidth` (600) or `logicalHeight` (800) in `GameManager.ts` or `Enemy.ts`. All UI renders in canvas space or CSS responsive overlay.
* **Zero Source Modification during Ideation:** Absolutely zero source files (`.ts`, `.tsx`, `.css`) are touched during this brainstorming phase.
* **Clean-Room Modularity:** Designed to reside cleanly in a new isolated module:
  `src/game/crew/CrewManager.ts`
  `src/game/crew/types.ts`
  `src/game/crew/CrewOfficer.ts`
  `src/game/crew/ResonanceEngine.ts`

### 8.2 State Serialization & Save/Continue Compatibility
The crew roster state cleanly serializes to `localStorage` alongside existing game progress:
```typescript
export interface CrewSaveState {
  officers: {
    id: 'INGRID' | 'JAX' | 'REN' | 'LYRA';
    unlocked: boolean;
    rank: number; // 1 to 4
    meritXp: number;
    fatigue: number;
    equippedPerks: string[];
  }[];
  activeStationSlots: ('INGRID' | 'JAX' | 'REN' | 'LYRA' | null)[];
  abyssalCores: number;
}
```
When a player clicks "Continue" (이어하기) on the death screen, their recruited officers and combat merits remain completely intact, allowing players to upgrade their crew at the pre-continue shop before resuming combat!

### 8.3 Performance & Canvas 2D Footprint
* **Garbage Collection (GC) Free Execution:** Ability cooldowns, active bullet spawns, and resonance calculations use pre-allocated static pools and simple scalar operations within the fixed 60 FPS update loop.
* **Procedural Pixel-Art Fallback:** If external image assets are not loaded, portraits can be rendered using crisp procedural 2D Canvas vector art (identical to how `AlliedReinforcements.ts` draws the Dreadnought and fighters), ensuring 100% offline self-containment with zero external asset dependencies.

---

## 9. Conclusion & Pitch Impact

The **Crew Officer Specialization & Passive Synergy Deck** delivers the missing emotional and strategic heart to *Water Invader*:
1. **High Strategic Depth:** Moves the game from pure twitch reflexes to deep buildcraft, where choosing which officer to promote or pair transforms playstyles (e.g. Tank/Barricade sustain vs. Hyper-Crit Glass Cannon vs. Bio-Acid Harvester).
2. **Unforgettable Aesthetic:** The contrast of retro submarine anime portraits, analog radio voice barks, and neon radar sweeps turns every wave into a cinematic submarine defense thriller.
3. **Flawless Integration:** Elevates every existing system—the shop, homing missiles, barricades, crisis directors, and allied dreadnoughts—into a cohesive, satisfying masterwork.

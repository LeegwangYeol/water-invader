# Handoff Report: Crew Officer Specialization & Passive Synergy Deck
**Agent:** Specialist 3.2 (Swarm Domain 3: Crew Officer Specialization & Passive Synergy Deck)
**Working Directory:** `/Users/user/src/water-invader/.agents/swarm_d3_crewsynergy_2/`
**Target Proposal Document:** `/Users/user/src/water-invader/.agents/swarm_d3_crewsynergy_2/report.md`

---

## 1. Observation
1. **User Request & Directives**:
   - `ORIGINAL_REQUEST.md` (lines 330-348) and `COLLABORATION.md` (lines 3-21): Mandates a 40+ agent brainstorming swarm for "Water Invader" to ideate new, engaging features and compile a pitch document without writing code.
   - Explicit constraints: "DO NOT MODIFY ANY SOURCE CODE (.ts, .tsx, .css)", "DO NOT RUN BUILDS, TESTS, OR GIT COMMANDS", "개발은 하지마".
2. **Current Codebase State**:
   - `src/game/crisis/AlliedReinforcements.ts` (lines 31-46): Defines the `Aegis Vanguard Command Dreadnought` with forward plasma cannons, point-defense lasers (120px radius), nano-shield aura (5s heal interval), and 2 escort interceptors.
   - `src/game/Helper.ts` (lines 9-80): Implements 4 distinct helper drone types: `FIGHTER` (⚔️), `MEDIC` (💚), `REPAIRER` (🔧), and `TANK` (🛡️).
   - `src/game/Player.ts` (lines 8-33): Defines player stats: `hp`, `maxHp`, `baseFireRate`, `multiShot`, `piercing`, `hasAcidShield`, `homingMissiles`, `suppressionLevel`, `stressLevel`, and `invincibilityTimer`.
   - `src/game/GameManager.ts` (lines 28-88): Core game loop coordinates `score`, `currency` ("Pure Water"), `crisisState`, `endGameCrisis`, `alliedReinforcements`, and `barricades`, maintaining strict `logicalWidth = 600` and `logicalHeight = 800`.
3. **Domain Focus Assigned**:
   - Focus: Crew Officer Specialization & Passive Synergy Deck.
   - Requirements:
     - 4 Veteran Deep-Sea Officers: Chief Engineer, Weapons Specialist, Sonar Master, Marine Biologist.
     - Mechanics & Math: Officer passives, active bridge abilities with cooldowns, cross-officer combo resonances.
     - Progression Loop: Hiring crew with salvage credits, leveling crew through veteran combat milestones.
     - Visuals & SFX: Pixel-art/retro anime portraits, radio voice barks on trigger.
     - UI: Crew Quarters Management Deck & Tactical Ability Badges.
     - Synergies: Deep connection to Allied Reinforcements and technical feasibility.

---

## 2. Logic Chain
1. *From Observation 2 (Existing Allied Reinforcements & Helper Units)*:
   - Rather than creating a disconnected mechanic, the Crew Officer system was engineered to directly empower existing entities (`AlliedReinforcements.ts` and `Helper.ts`). For example, Chief Engineer boosts Repair Bots (`HelperType.REPAIRER`) by +50% and reduces Dreadnought nano-shield intervals from 5.0s to 3.5s; Weapons Specialist equips Escort Interceptors with homing micro-torpedoes.
2. *From Observation 2 (Player Core Stats & Stress Mechanics)*:
   - Player systems already track `suppressionLevel` and `stressLevel`. The active abilities (e.g. Chief Engineer's *Emergency Scram Purge*) and passives (e.g. *Reactor Heat Siphon*) directly tap into these values, turning stress into tactical offensive/defensive buffs.
3. *From Observation 1 & 2 (Game Loop & Economy)*:
   - Currency is already established as "Pure Water" with starter allowance of 150. Setting officer recruitment at 200 Pure Water provides an early-game milestone (Waves 1-2), while Rank II-IV promotions require higher salvage credits and "Abyssal Cores" from Wave 10/20 boss crises.
4. *From Observation 1 (Strict Architectural Constraints)*:
   - No modifications were made to any `.ts`, `.tsx`, or `.css` files.
   - The design guarantees that `logicalWidth` (600) and `logicalHeight` (800) are never touched; the ability badges ($68 \times 54\text{px}$) fit cleanly along the bottom canvas bounds ($y = 740\text{px}$) without obscuring player movement or failing Playwright tests.

---

## 3. Caveats
- **No Source Code Implemented**: In strict compliance with user instructions ("개발은 하지마", zero source code modifications), this deliverable is a comprehensive architectural proposal and design specification.
- **Audio Asset Production**: Radio barks are specified with complete bilingual scripts (EN/KO) and Web Audio API filter parameters (300Hz-3400Hz bandpass filter + gain curve), but raw `.wav`/`.mp3` binary audio files have not been generated in this turn.
- **Asset Fallback**: The proposal provides both pixel-art bitmap specifications ($64 \times 64$ native, scaled to $128 \times 128$) and procedural Canvas 2D vector drawing fallbacks matching the style of `AlliedReinforcements.ts`.

---

## 4. Conclusion
Specialist 3.2 has authored an exhaustive, feature proposal document in `/Users/user/src/water-invader/.agents/swarm_d3_crewsynergy_2/report.md`.
The proposal details:
1. **Four Veteran Officers**: Ingrid "Anvil" Vane (Chief Engineer), Jax "Trident" Callahan (Weapons Specialist), Ren "Ping" Thorne (Sonar Master), and Dr. Lyra Vance (Marine Biologist).
2. **Combat Mechanics & Math**: 12 modular passive deck perks across Tiers I-III, 4 active bridge abilities with precise cooldowns and area formulas, and 6 Dual Resonances plus the Grand Quad Resonance (*The Abyssal Leviathan Matrix*).
3. **Progression Economy**: Recruitment via Pure Water salvage, dynamic Combat Merit XP milestones, officer rank promotions (Ensign to Fleet Captain), and a Fatigue/Shore Leave rotation mechanic.
4. **Visual & Audio Direction**: 90s retro submarine anime aesthetics with 4 dynamic facial expression states, CRT scanline styling, and authentic radio squelch comm barks with bilingual subtitles.
5. **UI Architecture**: Canvas HUD ability badges with radial cooldown sweeps and touch support, plus a comprehensive Crew Quarters Drydock management deck.
6. **Ecosystem & Technical Feasibility**: Direct synergy with the Aegis Vanguard Dreadnought and helper bots, zero-regression logic constraint preservation, and clean-room state serialization.

---

## 5. Verification Method
1. **Inspect Proposal Document**:
   - Verify `/Users/user/src/water-invader/.agents/swarm_d3_crewsynergy_2/report.md` exists and contains all 9 detailed sections.
2. **Verify Zero Source Code Modifications**:
   - Check git status or inspect `src/` to confirm that no `.ts`, `.tsx`, or `.css` files were modified, added, or deleted.
3. **Verify Compliance with Repository Constraints**:
   - Check that all dimensions adhere to the 600x800 logical canvas bounds and that no build, test, or git commands were executed.

# Project: Water Invader — 12 Flagship Features (Abyssal Odyssey Major Expansion)

## Architecture Overview

Water Invader is a Next.js 16 / React 19 / TypeScript 5 arcade space shooter built on an HTML5 2D Canvas engine and procedural Web Audio API synthesis. The **Abyssal Odyssey** major expansion integrates 12 Flagship Features into the core engine via a decoupled, zero-GC modular architecture:

```
src/game/
├── GameManager.ts             # Core loop, fixed-step physics (60 FPS), 3-layer rendering pipeline
├── Player.ts                  # Submarine entity, kinematics, hardpoints, chassis stats delegate
├── Enemy.ts                   # 14 base archetypes (0..13) + 8 flagship types (14..21)
├── Bullet.ts                  # Projectile base, CCD swept tests, HomingMissile subclass
├── Barricade.ts               # Voxel grid cover (4 slots, 24 voxels each, repair/damage sync)
├── Helper.ts                  # Allied squadron units (Fighter, Repair Bot, Tank, Medic)
├── SoundManager.ts            # 100% procedural Web Audio API synthesis (zero external audio files)
├── crisis/                    # 12 Stellaris-style Grand Strategy End-Game Crises (5,200 EHP invariant)
└── flagship/                  # 12 Flagship Features Modular Subsystems & Coordinator
    ├── types.ts               # Unified contracts, enums, DTOs, and lifecycle interfaces
    ├── FlagshipManager.ts     # Master coordinator orchestrating all 12 systems & safe fallbacks
    ├── index.ts               # Barrel export & public facade
    ├── weapons/               # F-01 Cavitation Torpedo, F-02 Prism Laser, F-03 Hydraulic Harpoon
    ├── environment/           # F-04 Hydrothermal Vents, F-05 Biolapse Darkness Cycle
    ├── progression/           # F-06 Modular Submersible Chassis, F-07 Veteran Crew Synergy Deck
    ├── factions/              # F-08 Hadal Bio-Horrors, F-09 Automaton Phalanx, F-10 Apex Bosses
    ├── modes/                 # F-11 Roguelike Endless Descent Mode & Bathymetric DAG
    └── sensory/               # F-12 Tactical Sonar HUD, Waterfall Spectrogram, Hull Stress FX
```

### Strict Architectural Invariants
1. **Inviolable Coordinate Grid**: `logicalWidth = 600` and `logicalHeight = 800` in `GameManager.ts` and `Enemy.ts` MUST NOT be changed. All entity positions, physics calculations, and hitboxes operate strictly within this $600 \times 800$ logical coordinate space.
2. **Strictly CSS-Based Responsiveness**: Mobile and viewport scaling is handled exclusively via CSS (Tailwind `aspect-[3/4]`, `max-w-[600px]`, and DPR buffer scaling `canvas.width = 600 * dpr`), keeping logic coordinates 100% decoupled from DOM presentation.
3. **Deterministic Timestep**: Fixed simulation accumulator $\Delta t = 1/60\text{ s}$ ($0.01667\text{ s}$) ensures deterministic physics, spring tensions, and thermal decay.
4. **Zero-GC Hot Loop Guarantee**: High-frequency entities, shockwaves, sonar wavefronts, and particle bursts reuse pre-allocated object pools (`particlePool`, static buffers) to avoid garbage collection frame drops.
5. **Layered Render Pipeline**:
   - **Layer 1 (Background)**: Drawn without screen shake. Biomes, hydrothermal vents, ocean currents, threat vignettes.
   - **Layer 2 (World Entities)**: Drawn with screen shake. Barricades, player, allies, enemies, torpedoes, lasers, harpoons, spore clouds, boss bodies.
   - **Layer 3 (Foreground / HUD)**: Drawn without screen shake. Biolapse darkness composite mask, tactical sonar radar, hydrophone waterfall, glass fracture lines, crew ability badges, and boss HP overlays.

---

## 12 Flagship Features Inventory

| # | Feature | Category | Description | Key Interface / File | Status |
|---|---------|----------|-------------|----------------------|--------|
| **F-01** | Cavitation Torpedo | Weapons | Supercavitating acoustic torpedo with inert arming window (100px), double-tap remote detonation, negative pressure vacuum suction well ($r=140\text{px}$), and hyperbaric blast overpressure ($r=150\text{px}$, 120–300 dmg). | `ICavitationTorpedoSystem`<br>`flagship/weapons/CavitationTorpedo.ts` | FOUNDATION READY |
| **F-02** | Prism Laser & Refraction | Weapons | Continuous Photic Lance raycast with thermodynamic heat gauge (0–100 HU), supercharged sweet spot (+25% DPS at 80–99 HU), 2.2s thermal lockout, and deployable quartz crystal prisms fanning beams into 3-way/5-way arrays. | `IPrismLaserSystem`<br>`flagship/weapons/BioluminescentLaser.ts` | FOUNDATION READY |
| **F-03** | Hydraulic Harpoon & Slingshot | Weapons | Barbed pneumatic grapple penetrating chaff to impale elites, constrained by a damped harmonic spring ($k_s=95\text{ N/px}$), hydraulic winch reel ($240\text{px/s}$), and kinetic slingshot catapult ($+720\text{px/s}$, 180 dmg). | `IHydraulicHarpoon`<br>`flagship/weapons/HydraulicHarpoon.ts` | FOUNDATION READY |
| **F-04** | Hydrothermal Vents & Currents | Environment | Benthic black smoker chimneys ($380^\circ\text{C}$) venting buoyant updrafts ($-360\text{px/s}$), superheating player shots into Steam Lances (+35% dmg), $+250\%$ laser cooling in halo, and stratified shear ocean currents ($\pm 75\text{px/s}$). | `IHydrothermalVentManager`<br>`flagship/environment/HydrothermalVent.ts` | FOUNDATION READY |
| **F-05** | Biolapse Darkness Cycle | Environment | 4-phase day/night cycle (60s Diurnal $\to$ 5s Twilight $\to$ 25s Midnight $\to$ 5s Dawn). Total blackness requires directional prow headlight cone ($440\text{px}$) with kinetic dynamo battery and active sonar ping wireframe reveals. | `IBiolapseManager`<br>`flagship/environment/BiolapseDarknessCycle.ts` | FOUNDATION READY |
| **F-06** | Modular Submersible Chassis | Progression | 5 specialized hull archetypes (Nautilus Dreadnought, Stingray Interceptor, Kraken Bioship, Leviathan Harvester, Ghost Stealth Sub) featuring 6-axis stat radars, unique hitboxes, base HP curves, and signature combat passives. | `IChassisManager`<br>`flagship/progression/ModularChassis.ts` | FOUNDATION READY |
| **F-07** | Veteran Crew Synergy Deck | Progression | 4 bridge officers (Ingrid Vane, Jax Callahan, Ren Thorne, Dr. Lyra Vance) slotted into stations, granting active tactical abilities (`[1]-[4]`), 6 dual resonance combos, and a Quad Grand Resonance (*The Abyssal Leviathan Matrix*). | `ICrewManager`<br>`flagship/progression/CrewOfficerDeck.ts` | FOUNDATION READY |
| **F-08** | Mutating Bio-Horror Faction | Factions | Hadal Chitin Hive (Parasite Clinger, Spore Siphoner, Carapace Colossus, Abyssal Angler) governed by an Epigenetic Mutation Engine tracking player weapon damage ratios over 2 waves to evolve reactive defenses (max 40% cap). | `IBioHorrorManager`<br>`flagship/factions/HadalBioHorrors.ts` | FOUNDATION READY |
| **F-09** | Automaton Shield Phalanx | Factions | Ancient machine network (Aegis Drone, EMP Prowler, Rail Sentinel). Aegis drones link barriers when within 160px for 40% harmonic damage sharing; breaking a barrier trips an Inductive Backlash cascade stunning linked units. | `IAutomatonPhalanxManager`<br>`flagship/factions/AutomatonPhalanx.ts` | FOUNDATION READY |
| **F-10** | Multi-Stage Apex Bosses | Encounters | 12,000 EHP multi-stage leviathans: Charybdis Prime (segmented tentacles IK, vortex inhalation maw, ink blackout), SMS Leviathan (destructible turrets, carrier deck, spinal railgun), and Hadal Patriarch. | `IApexBossManager`<br>`flagship/factions/KrakenPrimeBoss.ts` | FOUNDATION READY |
| **F-11** | Roguelike Endless Descent | Game Modes | Bathymetric DAG node map (0m $\to$ 11,000m+) across 5 Depth Sectors (Combat, Elite, Supply, Shrine, Hazard). Hydrostatic pressure engine degrades Max HP containers; 3-card boon drafting (24 boons + 6 curses); Abyssal Pearl meta-currency. | `IEndlessDescentManager`<br>`flagship/modes/EndlessDescent.ts` | FOUNDATION READY |
| **F-12** | Tactical Sonar & Sensory UI | Sensory & UI | Polar radar range rings (50m–250m) with rotating phosphor sweep ($\omega=1.8\text{ rad/s}$), acoustic detonation wavefronts, real-time 16-band Web Audio hydrophone waterfall spectrogram, and procedural cockpit glass fracture lines. | `ISonarRenderer`<br>`flagship/sensory/TacticalSonarHUD.ts` | FOUNDATION READY |

---

## Swarm Milestones & Execution Roadmap

| Phase | Milestone Name | Scope & Deliverables | Status |
|:---|:---|:---|:---|
| **Phase 0** | Authoritative Specification Mining | Deep analysis of `IDEAS_PITCH.md`, production code, mathematical modeling, and contract definition (`pitch_spec_miner_1`, `pitch_spec_miner_2`, `pitch_explorer_arch_1`). | **COMPLETED** |
| **Phase 1** | Flagship Foundation & Types Architecture | Implementation of `src/game/flagship/types.ts`, `FlagshipManager.ts` (with coordinator lifecycle hooks and safe fallback stubs), `index.ts`, and `PROJECT.md` update (`pitch_worker_foundation_1`). | **IN_PROGRESS** |
| **Phase 2** | Subsystem Implementation Swarm | Parallel development of all 12 feature modules across dedicated files under `src/game/flagship/`: <br>• **Stream A**: Advanced Arsenal (`weapons/`)<br>• **Stream B**: Deep Environment (`environment/`)<br>• **Stream C**: Fleet Progression (`progression/`)<br>• **Stream D**: Adversary Ecology (`factions/`)<br>• **Stream E**: Modes & Sensory (`modes/`, `sensory/`). | **QUEUED** |
| **Phase 3** | Game Loop & UI Facade Integration | Linking `FlagshipManager` into `GameManager.ts`, `Player.ts`, `Enemy.ts`, and `src/components/game-canvas.tsx` overlays without altering logical dimensions. | **PLANNED** |
| **Phase 4** | Automated Verification & Playwright Suites | Unit testing, mathematical validation, and Playwright E2E suites covering all 12 flagship systems. Build check `npm run build` and `npx tsc --noEmit`. | **PLANNED** |
| **Phase 5** | Independent Victory Audit & Git Push | Teamwork auditor independent verification, commit creation, and push to `origin/master`. | **PLANNED** |

---

## Interface Contracts & Coordinator Integration

### FlagshipManager Lifecycle Hooks
- `FlagshipManager.init()`: Initializes all 12 sub-systems and custom extensions.
- `FlagshipManager.update(deltaTime: number, context: FlagshipUpdateContext)`: Dispatches fixed-timestep simulation updates across all active systems with access to `player`, `enemies`, `bullets`, `barricades`, `helpers`, `particles`, `level`, `score`, `currency`, `createExplosion`, and `triggerScreenShake`.
- `FlagshipManager.drawBackground(ctx, time)`: Renders background ocean currents, hydrothermal vents, and ambient thermal plumes in Layer 1.
- `FlagshipManager.drawWorld(ctx, time)`: Renders torpedoes, laser beams, harpoon cables, spore clouds, automaton link conduits, and boss multi-part sprites in Layer 2 (inside screen shake).
- `FlagshipManager.drawForeground(ctx, time)`: Renders biolapse darkness masks, polar sonar sweep, contact blooms, hydrophone waterfall, glass fracture lines, and crew HUD in Layer 3 (outside screen shake).
- `FlagshipManager.handleInput(key, isDown, context): boolean`: Dispatches key events (`C` for torpedo/ballast, `F` for headlights, `1`–`4` for bridge crew abilities).
- `FlagshipManager.reset(preserveUpgrades, isContinue)`: Resets state during run restarts, preserving unlocks and upgrades when continuing.
- `FlagshipManager.onWaveComplete(wave, context)`: Triggers epigenetic bio-horror adaptation updates and descent strata advancements.
- `FlagshipManager.onEnemyKilled(enemy, context)`: Triggers salvage bonuses and photophore drops during darkness.
- `FlagshipManager.onPlayerDamage(amount, context)`: Triggers chassis damage mitigation passives and cockpit glass stress fractures.

### Subsystem Registration API
Downstream workers plug in concrete implementations seamlessly without modifying coordinator internals:
```typescript
flagshipManager.registerCavitationTorpedoSystem(system: ICavitationTorpedoSystem);
flagshipManager.registerPrismLaserSystem(system: IPrismLaserSystem);
flagshipManager.registerHydraulicHarpoon(system: IHydraulicHarpoon);
flagshipManager.registerHydrothermalVentManager(manager: IHydrothermalVentManager);
flagshipManager.registerBiolapseManager(manager: IBiolapseManager);
flagshipManager.registerChassisManager(manager: IChassisManager);
flagshipManager.registerCrewManager(manager: ICrewManager);
flagshipManager.registerBioHorrorManager(manager: IBioHorrorManager);
flagshipManager.registerAutomatonPhalanxManager(manager: IAutomatonPhalanxManager);
flagshipManager.registerApexBossManager(manager: IApexBossManager);
flagshipManager.registerEndlessDescentManager(manager: IEndlessDescentManager);
flagshipManager.registerSonarRenderer(renderer: ISonarRenderer);
flagshipManager.registerCustomSubsystem(subsystem: IFlagshipSubsystem);
```


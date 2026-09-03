# Handoff Report — QoL & Event Gameplay Updates (M1–M4)

## 1. Observation
- **Code Inspection & Baseline State**:
  - `src/game/Player.ts`: Previously lacked `hasAcidShield` property and corresponding visual shield canopy rendering.
  - `src/game/Bullet.ts`: Projectiles lacked high-contrast boundary definition against bright environmental alert washes (`rgba(255, 0, 0, 0.30)` or `rgba(132, 204, 22, 0.25)`).
  - `src/game/types.ts`: `CrisisType` union only had `TITAN_HORDE`, `ACID_STORM`, `SWARM_BLITZ`, `EMP_DISRUPTION`, `TOTAL_WAR`. Lacked `SOLAR_FLARE`.
  - `src/game/crisis/DimensionalRift.ts`: All Phase 1 anchors used identical purple vortex visuals and lacked archetype-specific vector geometries and behaviors (Bio-Brood Sacks spawning acid spitters, EMP Laser Pylons charging shock beams).
  - `src/game/GameManager.ts`: `init()` reset all player stats (`hp = 3`, `baseFireRate = 0.5`, `multiShot = 1`, `piercing = 1`), preventing pre-game shop purchase persistence into Wave 1. Warning background overlays used heavy alpha fills (0.25–0.30) that obscured falling hazards.
  - `src/components/game-canvas.tsx`: Warning banners used CSS `backdrop-blur-[2-3px]`, and `MenuOverlay` had no entry point for accessing the shop before starting Wave 1.

## 2. Logic Chain
1. **M1 — Acid Rain Counterplay**:
   - Added `public hasAcidShield: boolean = false;` to `Player` and rendered a translucent cyan canopy arc (`rgba(56, 189, 248, 0.35)`) over the ship when active.
   - Implemented `soundManager.playShieldDeflect()` with dual synthesized oscillators (440Hz + 880Hz) with rapid pitch glide.
   - In `GameManager.update()`, when hazard droplets collide with the player and `player.hasAcidShield` is true: droplet is neutralized (`hz.isDead = true`), deflection sound plays, `#38bdf8` splash particles spawn, and 0 damage or screen shake is applied.
   - Added `upgradeAcidShield()` (cost: 150 💧) to `GameManager` and added the "ACID SHIELD / 내산성 코팅" upgrade card to `ShopUpgradePanel`, `ShopModal`, and `GameOverModal`.
2. **M2 — Event Background Visibility & High-Contrast Projectiles**:
   - Replaced `Bullet.draw()` with a 4-tier "Halo Sandwich": 1.5px black perimeter stroke (`#000000`), saturated faction color shell, glow aura, and solid white core (`#ffffff`).
   - Refactored `hazardProjectiles` (Acid Storm droplets) to directional toxic teardrops with crisp 1.5px black perimeter strokes, saturated toxic green fills (`#a3e635`), white sizzle cores, and trailing vapor arcs.
   - Calibrated warning rectangle alpha fills from 0.25–0.30 down to 0.10–0.12 in `GameManager.draw()`, reinforced with a crisp 4px perimeter border stroke.
   - Removed `backdrop-blur-[2px]` and `backdrop-blur-[3px]` from warning banners in `src/components/game-canvas.tsx` so gameplay action remains visible.
3. **M3 — Crisis Variety Expansion**:
   - Added `'SOLAR_FLARE'` to `CrisisType`, defined `SolarFlareBeam` interface, and added `solarFlares` array to `GameManager` and `CrisisState`.
   - Implemented dynamic Solar Flare mechanics: 1.2–2.4s charging telegraph dashed warning lines transitioning into roaring sweeping plasma pillars that deal 1 damage to player if not horizontally dodged.
   - Differentiated End-Game Crisis Phase 1 anchors per `CrisisArchetype`:
     - `VOID_SOVEREIGN`: Gravitational Singularity Rifts with dark matter accretion disks.
     - `ABYSSAL_LEVIATHAN`: Pulsating Bio-Brood Sacks spawning directional acid spitters.
     - `CYBERNETIC_EXTERMINATOR`: Hexagonal EMP Laser Pylons charging shock rail bolts.
4. **M4 — Pre-Game Shop Access & State Persistence**:
   - Added "ARMORY / SHOP (정비소)" button to `MenuOverlay`.
   - Initialized player starter pure water allowance to `150 💧`.
   - Updated `GameManager.init(resetScoreAndCash: boolean = false, preserveUpgrades: boolean = false)` so opening the Armory before Wave 1 and purchasing upgrades (e.g. Acid Shield or Fire Rate) cleanly preserves all purchased stats into Wave 1 upon clicking "DEPLOY TO WAVE 1".

## 3. Caveats
- No caveats. All 4 milestones (M1–M4) are implemented with genuine state machines, complete Canvas 2D vector rendering, and full state persistence across pre-game and post-game flows.

## 4. Conclusion
- All requirements for M1 (Acid Rain Counterplay), M2 (Event Background Visibility & High-Contrast Outlines), M3 (Crisis Variety Expansion with Solar Flare & Archetype Anchor Differentiation), and M4 (Pre-Game Shop Access & State Persistence) are 100% complete.
- Clean compilation confirmed: `npx tsc --noEmit` and `npm run build` pass with 0 errors.
- Test coverage verified: 119/119 unit tests pass cleanly in Playwright headless runner.

## 5. Verification Method
- Run TypeScript check: `npx tsc --noEmit`
- Run Next.js production build: `npm run build`
- Run unit test suite: `SKIP_WEBSERVER=1 npx playwright test tests/unit`

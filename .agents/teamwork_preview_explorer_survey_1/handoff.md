# Handoff Report: Codebase Survey — Environmental Events, Acid Rain, & Counterplay Architecture

**Agent**: `teamwork_preview_explorer_survey_1`  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_1`  
**Milestone**: `survey_events_acidrain`  
**Date**: 2026-09-02  

---

## 1. Observation

Direct code observations from inspecting the codebase:

- **Environmental Crisis Director (`src/game/GameManager.ts:458-600, 780-838`)**:
  - Crises trigger when `level >= 10` and `crisisTimer <= 0` (initial interval 16-24s).
  - Supported Crisis Types: `TITAN_HORDE`, `ACID_STORM`, `SWARM_BLITZ`, `EMP_DISRUPTION`, `TOTAL_WAR` (`src/game/types.ts:44`).
  - Crisis lifecycle has a 2.0s warning phase (`warningTimer = 2.0`) with alert audio and banner before `activateCrisisEffect(type)` executes.

- **Acid Rain Hazard Implementation (`src/game/GameManager.ts:806-895`)**:
  - In `update(deltaTime)`, when `crisisState.activeCrisis === 'ACID_STORM'` and `warningTimer <= 0`:
    - 40% probability per frame to spawn 1-2 `HazardProjectile`s.
    - Droplets have `radius: 5-9`, `speedY: 220-340 px/s`, `speedX: ±20 px/s`, `damage: 1`, `color: '#a3e635'`.
    - Player collision (`lines 848-872`): AABB bounding box collision deals `player.hp -= hz.damage`, grants 1.0s i-frames, triggers hit flash and sound, shakes screen, and can cause game over (`"정수기가 산성 폭풍에 부식되었습니다."`).
    - Barricade collision (`lines 874-890`): Destructible ice barricades take 2 damage per droplet; indestructible stone barricades absorb droplets with 0 damage.

- **Player State & Economy (`src/game/Player.ts`, `src/game/GameManager.ts`)**:
  - `Player` has `hp: 3`, `maxHp: 5`, `baseFireRate: 0.5`, `multiShot: 1`, `piercing: 1`, `ultimateGauge: 0`, `invincibilityTimer: 0`.
  - Upgrades in `GameManager.ts:1759-1788`: `upgradeFireRate()` (50 💧), `upgradeMultiShot()` (100 💧), `upgradePiercing()` (200 💧), `repairTank()` (75 💧).
  - `GameManager.init()` (`lines 136-150`) unconditionally resets player stats to defaults (`hp = 3`, `baseFireRate = 0.5`, `multiShot = 1`, `piercing = 1`).

- **UI & Shop Access (`src/components/game-canvas.tsx`)**:
  - `MenuOverlay` (lines 257-307) currently only provides "START GAME", "HOW TO PLAY", and "INSTALL APP". There is no shop access from the main menu.
  - `ShopModal` (lines 374-421) is only rendered when `gameState === GameState.SHOP` (wave clear).
  - Projectiles and hazard droplets lack high-contrast outer outlines against brightly colored crisis screen tints.

---

## 2. Logic Chain

1. **Acid Rain Mechanics (R1)**:
   - Since Acid Rain generates falling `HazardProjectile` instances that test collision specifically in `GameManager.ts:848-872`, introducing an `Acid Shield / Umbrella Canopy` counterplay mechanic can be cleanly hooked at the hazard collision check.
   - If `player.hasAcidShield` is active, the droplet is destroyed (`hz.isDead = true`) with a protective deflection sound (`playShieldDeflect`) and energy spark particles, while leaving `player.hp` untouched.
   - This can be purchased as an upgrade in the Shop or deployed as an umbrella barrier canopy.

2. **Event Visibility (R2)**:
   - Warning overlays currently render semi-transparent colored rectangles on canvas (`rgba(132, 204, 22, 0.25)` or `rgba(255, 0, 0, 0.3)`) and high-opacity DOM overlays.
   - Adding a 1.5px dark outline (`#000000`) and high-luminosity multi-layered glow to enemy projectiles in `Bullet.draw()` and `hazardProjectiles` rendering ensures readability against all background color shifts.

3. **Crisis Variety (R3)**:
   - Current mid-game crises are heavily combat/spawn focused (`TITAN_HORDE`, `SWARM_BLITZ`, `TOTAL_WAR`) or status/hazard focused (`EMP_DISRUPTION`, `ACID_STORM`).
   - Adding a new crisis type such as `SOLAR_FLARE` (sweeping solar beam curtains) or `GRAVITATIONAL_SINGULARITY` (central vortex curving projectiles) expands gameplay variety with distinct tactical evasion requirements.

4. **Pre-Game Shop Integration (R4)**:
   - Enabling shop access on the main menu requires:
     1. Adding a "SHOP" / "UPGRADES" button to `MenuOverlay` in `game-canvas.tsx`.
     2. Modifying `GameManager.init()` so it does not overwrite purchased stats (`baseFireRate`, `multiShot`, `piercing`, `hp`, `hasAcidShield`) when the game transitions from `MENU` to `PLAYING`.

---

## 3. Caveats

- **Test Suite Expectations**: Existing Playwright tests (e.g. `12_extreme_difficulty_and_crises.spec.ts`, `06_shop_economy_max_upgrades.spec.ts`, `unit/crisis_director_m2.test.ts`) assert specific baseline HP and costs. New items/upgrades should extend existing data structures rather than modifying existing upgrade costs.
- **Audio Context Policies**: Browser autoplay requires user interaction before AudioContext unpauses; sound triggers for new counterplay abilities must use the existing safe `SoundManager` methods.

---

## 4. Conclusion

The codebase has clean, well-modularized separation between engine logic (`GameManager.ts`, `Player.ts`, `Barricade.ts`), crisis coordination (`EndGameCrisis.ts`), rendering, and React state (`game-canvas.tsx`). The 4 target features (Acid Rain Counterplay, Background Visibility Fix, Crisis Variety Expansion, Pre-Game Shop Access) can be implemented with zero architectural friction by following the survey blueprints.

---

## 5. Verification Method & Recommended Strategy

### Verification Commands:
- Type check: `npx tsc --noEmit`
- Next.js build: `npm run build`
- Playwright E2E & unit test execution: `npx playwright test`

### Full Survey Artifact:
Detailed architectural survey and data mapping available at:
`/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_1/survey_events_acidrain.md`

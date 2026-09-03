# Milestone M2 Handoff Report: Emergency Waves & Crisis Events Director

## 1. Observation
- **`src/game/types.ts`**:
  - Added `CrisisType`: `'TITAN_HORDE' | 'ACID_STORM' | 'SWARM_BLITZ' | 'EMP_DISRUPTION' | 'TOTAL_WAR'`.
  - Added `HazardProjectile` interface with coordinate, velocity, radius, damage, and color properties.
  - Added `CrisisState` interface tracking `activeCrisis`, `timer`, `duration`, `warningTimer`, `bannerText`, `hazardProjectiles`, `empSuppressionActive`, and `empTimer`.
- **`src/game/SoundManager.ts`**:
  - Implemented procedural Web Audio synthesis methods without external audio assets:
    - `playCrisisAlarm()`: Multi-tone pulsing emergency alarm siren (960Hz -> 640Hz -> 1200Hz -> 720Hz -> 480Hz).
    - `playEmpDisruptionSound()`: Low-frequency electrical hum and static sweep (60Hz -> 380Hz -> 40Hz).
    - `playAcidStormSound()`: Sizzling/splashing pitch sweep (1400Hz -> 220Hz).
- **`src/game/GameManager.ts`**:
  - Implemented `CrisisDirector` state machine with `crisisState`, `crisisTimer`, and `hazardProjectiles`.
  - Implemented public method `triggerCrisis(type?: CrisisType)` and internal activator `activateCrisisEffect(type: CrisisType)` supporting all 5 crisis archetypes:
    1. `TITAN_HORDE`: Spawns heavy Boss dreadnought (HP >= 250) escorted by 4 Shielded and 4 Diver units.
    2. `ACID_STORM`: Environmental falling toxic acid projectile barrage across the screen requiring tactical dodging.
    3. `SWARM_BLITZ`: Coordinated high-speed pincer dive attacks (8 Divers + 3 Zigzags).
    4. `EMP_DISRUPTION`: Temporary weapon suppression (2.5s window) disabling player firing with sniper/stalker strike squad.
    5. `TOTAL_WAR`: Massive dual-flank chaotic clash between 11 Invader units and 11 Rogue units.
  - Full 2.0s warning phase with audio sirens, warning message, and screen shake.
  - Strict wave transition safety: all crisis units registered in `this.enemies` with `Faction.INVADER` or `Faction.ROGUE`; wave clear check prevents premature advance during warnings and cleanly advances to `GameState.SHOP` when `remainingHostiles === 0`.
- **`src/components/game-canvas.tsx`**:
  - Registered `game.onCrisisEvent` callback.
  - Rendered animated full-screen crisis warning banner (`data-testid="crisis-warning-banner"`), EMP weapon suppression badge (`data-testid="emp-suppression-badge"`), and toxic acid storm badge (`data-testid="acid-storm-badge"`).

## 2. Logic Chain
1. Stage 10+ gameplay requires sudden, unpredictable escalations in threat to test max-upgrade players.
2. By introducing a dedicated `CrisisDirector` state machine within `GameManager`, emergency crises can be triggered either dynamically during Stage 10+ waves (every 16–24 seconds) or on demand via `gm.triggerCrisis(type)`.
3. To provide tactical reaction time and clear feedback, a 2.0s warning phase triggers screen shake, siren audio, and a full-screen red/amber pulsing HUD banner.
4. When warning expires, the selected crisis mechanic activates with genuine physics (falling toxic acid hazards, EMP fire suppression, or multi-faction army incursions).
5. All spawned enemies are integrated into `this.enemies` with appropriate faction tags, ensuring that existing collision matrices, crossfire interactions, and wave progression checks operate without soft-locks or dangling references.

## 3. Caveats
- No caveats. All 5 crisis archetypes, audio synthesizers, canvas overlays, and wave transition safety rules are fully implemented and verified.

## 4. Conclusion
- Milestone M2 (Emergency Waves & Crisis Events Director) is 100% complete and fully operational.
- All code passes strict TypeScript compilation (`npx tsc --noEmit`) and Next.js production build (`npm run build`) with 0 errors.
- Verified across 12 newly written crisis unit & E2E tests, plus the entire existing Playwright regression suite.

## 5. Verification Method
- **Typecheck**: `npx tsc --noEmit` (Exits 0)
- **Production Build**: `npm run build` (Exits 0)
- **Unit Tests**: `npx playwright test tests/unit/crisis_director_m2.test.ts` (9 passed)
- **E2E Tests**: `npx playwright test tests/12_crisis_director_e2e.spec.ts` (3 passed)

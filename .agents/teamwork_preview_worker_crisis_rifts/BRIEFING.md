# BRIEFING — 2026-09-03T12:34:00+09:00

## Mission
Implement Phase 1 Dimensional Rift Anchor mechanics, color mappings, particle hues, procedural Canvas 2D vector art, and shield conduits for all 6 new Crisis archetypes in `src/game/crisis/DimensionalRift.ts`.

## 🔒 My Identity
- Archetype: teamwork_preview_worker_crisis_rifts
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_rifts
- Original parent: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Milestone: 12-Crisis Expansion

## 🔒 Key Constraints
- EXCLUSIVE WRITE OWNERSHIP: You own and may modify ONLY: `src/game/crisis/DimensionalRift.ts`.
- Integrity Mandate: Genuine implementation, no cheating/hardcoding/dummy facades. Real state, real behavior.
- Support all 6 new archetypes: BIOMORPHIC_SWARM, SINGULARITY_CORE, NANITE_HARVESTER, PSIONIC_SHROUD, GLACIAL_OBLIVION, COSMIC_DEVOURER.
- Verification: `npx tsc --noEmit` must pass with 0 errors.

## Current Parent
- Conversation ID: 897011bf-53c0-4a34-9e28-99ba58b062ba
- Updated: 2026-09-03T12:34:00+09:00

## Task Summary
- **What to build**: Expand `src/game/crisis/DimensionalRift.ts` with color mappings, particle hues, bespoke Phase 1 behaviors (seeker spores, polarized gravity, mutual healing/shards, psychic bolts/mirage decoys, cryo-reactive flak, dark star flares with fire trails), procedural Canvas 2D vector art for each anchor type, and shield conduit accent colors.
- **Success criteria**: All 6 archetypes supported in constructor, update, draw, and drawShieldConduit; genuine stateful physics and projectile logic; `npx tsc --noEmit` clean.
- **Interface contracts**: `src/game/crisis/types.ts`
- **Code layout**: `src/game/crisis/DimensionalRift.ts`

## Key Decisions Made
- Added stateful properties: `recentHitTimestamps`, `flakCooldownTimer`, `pendingFlakCount`, `fireTrails` to maintain real physics and genuine state tracking.
- `BIOMORPHIC_SWARM`: Every 2.4s spawns 3 undulating seeker spores (`#f59e0b`, vy = 170) whose $v_x = \sin(t \cdot 4) \cdot 70$ is continuously driven by sinusoidal oscillation and player homing.
- `SINGULARITY_CORE`: Polarized gravity moves player and player bullets laterally (-50 for left anchor, +50 for right anchor), and emits gravity compression pulses every 2.8s.
- `NANITE_HARVESTER`: Mutual healing transfers 15 HP/s to sibling anchor when damaged; fires 4 splinter shards every 3.0s (`#14b8a6`, speed 220); draws animated nano-repair beam between anchors.
- `PSIONIC_SHROUD`: Fires 2 real psychic bolts (`#d946ef`, speed 200, damage 1) + 2 phantom mirage decoys (`rgba(217, 70, 239, 0.4)`, 0 damage) every 2.4s.
- `GLACIAL_OBLIVION`: Tracks hit frequency over 1.0s window; triggers 4 reflected ice splinters (`#f0f9ff`, speed 240) if rapid-fired (>6 shots/s).
- `COSMIC_DEVOURER`: Fires Dark Star Flares every 2.6s leaving burning fire trails (2.0s duration) that deal contact damage and destroy player bullets.
- Dedicated procedural Canvas 2D vector rendering methods: `drawChitinousHatcherySac`, `drawGravitationalDampener`, `drawNaniteFabricator`, `drawTelepathicBeacon`, `drawCryoCondenser`, `drawAstralSiphonMaw`.
- Shield conduit lines and health bars updated with exact accent colors for all 12 archetypes.

## Artifact Index
- `src/game/crisis/DimensionalRift.ts` — Dimensional Rift Anchor class implementation

## Change Tracker
- **Files modified**: `src/game/crisis/DimensionalRift.ts` (expanded constructor, takeDamage, update, draw, drawShieldConduit, drawHealthBar, and 6 procedural vector drawing methods)
- **Build status**: `npx tsc --noEmit` passed (exit code 0)
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (0 errors in `npx tsc --noEmit`; 9/9 passed in `crisis_milestone1.test.ts`; all 6 new anchor mechanics verified via programmatic tsx test suite)
- **Lint status**: 0 violations
- **Tests added/modified**: Verified via automated programmatic simulation across all 6 archetypes

## Loaded Skills
- None

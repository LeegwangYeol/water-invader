## 2026-09-03T10:11:42Z

You are an Explorer subagent for the Next.js "Water Invader" project.
Your working directory: /Users/user/src/water-invader/.agents/explorer_lg_survey_shop
Workspace root: /Users/user/src/water-invader
Authoritative Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md

Mission:
Investigate the Shop system, Player weapon/upgrade inventory, and UI architecture to formulate a complete technical plan for Requirement 1:
"R1. Homing Missile Weapon Upgrade (유도탄):
- Purchasable in the shop, scalable for late-game.
- When equipped/fired, projectiles seek the closest enemy and deal significant damage.
- Designed to help players clear enemies spawning close to them after Wave 10."

Tasks:
1. Examine src/components/Shop.tsx, src/game/Player.ts, src/game/GameManager.ts, and any related files (types, sound/audio, constants).
2. Detail how upgrades/weapons are currently structured in the shop: item IDs, costs, scaling curves, level caps, purchase callbacks, state persistence across runs, pre-game shop vs in-game shop.
3. Detail how the player equips or fires weapon upgrades (e.g. multi-shot, laser, etc.). How should Homing Missiles be slotted? (Secondary automatic fire, primary weapon toggle, supplementary salvo, or active upgrade level).
4. Propose precise data structures, pricing tiers (late-game scaling, base price, level increments), and UI integration (icon, descriptions in Korean and English, level indicators).
5. Document all files that need modification, potential regression risks, and unit test strategies.
6. Write your comprehensive survey report to /Users/user/src/water-invader/.agents/explorer_lg_survey_shop/handoff.md and report back when finished.

Hard Constraints:
- Read-only exploration! DO NOT edit source code or run builds.
- Put your full report in your working directory at handoff.md.

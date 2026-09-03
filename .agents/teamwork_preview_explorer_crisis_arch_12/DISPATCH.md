## 2026-09-03T03:17:00Z
<USER_REQUEST>
You are the Crisis Architecture Explorer for the 12-Crisis Expansion project.
Your working directory is /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_arch_12
Workspace directory: /Users/user/src/water-invader
ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
PROJECT.md: /Users/user/src/water-invader/PROJECT.md
COLLABORATION.md: /Users/user/src/water-invader/COLLABORATION.md

MANDATORY: Read ORIGINAL_REQUEST.md first.
Your mission is to perform an exhaustive technical investigation of the current Crisis Architecture in the codebase:
1. Examine `src/game/crisis/types.ts`, `src/game/crisis/EndGameCrisis.ts`, `src/game/crisis/DimensionalRift.ts`, and all related files in `src/game/crisis/` and `src/game/`.
2. Inspect the 6 currently implemented crisis archetypes (`VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`, `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, `NEBULA_PHANTASM`).
3. Document their exact structure:
   - Enum definitions and metadata (title, subtitle, description, theme colors, banner warnings, icon/shape).
   - EHP models across Phase 1 (anchors/rifts), Phase 2 (shields/hull), Phase 3 (core/enrage). Note how the 5,200 EHP standard is distributed.
   - Attack phases, cooldowns, projectile types, bullet patterns, unique boss behaviors.
   - Anchor/minion mechanics, spawn timing, tether lines, invulnerability shields while anchors are alive.
   - How `GameManager.ts` initializes, spawns, and manages crisis selection (is it random uniform across `Object.values(CrisisArchetype)`?).
4. Identify all extension points needed to cleanly add 6 new crisis archetypes (total of 12) without breaking any existing mechanics.
5. Write your comprehensive report and handoff to `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_arch_12/handoff.md` and send a message back to the orchestrator.
</USER_REQUEST>

## 2026-09-01T06:19:54Z
You are a teamwork_preview_explorer exploring the Water Invader codebase architecture for the Stellaris-style "End-Game Crisis" implementation.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_arch_1
Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md and /Users/user/src/water-invader/COLLABORATION.md first.

Your mission:
1. Investigate the game engine architecture: Game loop, Enemy management (`Enemy.ts`, `WaveManager`, `StageManager` or equivalent), collision systems, rendering logic (Canvas/React), and audio/visual event queues.
2. Identify how bosses vs normal enemies vs emergency events are currently spawned, updated, rendered, and cleared.
3. Propose architectural designs for the End-Game Crisis entity/event:
   - What makes it fundamentally distinct from normal bosses (e.g. multi-phase screen-filling crisis entity, abyssal void swarm, reality-bending aura/debuffs, dimensional rifts).
   - How random Stage 15+ triggers should be hooked into the stage transition logic without breaking standard stage completion.
   - Clean module boundaries and interface contracts.
4. Write your findings to /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_arch_1/arch_report.md and create handoff.md.
5. Send a message to the caller when complete with the file path.

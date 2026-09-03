## 2026-09-03T03:27:41Z

You are the Dimensional Rift Anchors Worker for the 12-Crisis Expansion project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_rifts
Workspace directory: /Users/user/src/water-invader
ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
PROJECT.md: /Users/user/src/water-invader/PROJECT.md
COLLABORATION.md: /Users/user/src/water-invader/COLLABORATION.md
Spec Miner Handoff: /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_crisis_12/handoff.md
Crisis Arch Handoff: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_arch_12/handoff.md

MANDATORY: Read ORIGINAL_REQUEST.md first.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own and may modify ONLY: `src/game/crisis/DimensionalRift.ts`.

Task Details:
1. In `src/game/crisis/DimensionalRift.ts`:
   - Expand the constructor color mappings, particle hues, and visual styles to support all 6 new archetypes:
     * `BIOMORPHIC_SWARM`: Chitinous Hatchery Sac (Blood Crimson `#b91c1c`, Bile Amber `#f59e0b`, Toxic Lime `#84cc16`).
     * `SINGULARITY_CORE`: Polarized Gravitational Dampener (Obsidian `#09090b`, Relativistic Violet `#8b5cf6`, White `#ffffff`).
     * `NANITE_HARVESTER`: Nanite Assembly Fabricator (Chrome Silver `#94a3b8`, Circuit Teal `#14b8a6`, Cyan `#06b6d4`).
     * `PSIONIC_SHROUD`: Telepathic Resonance Beacon (Astral Violet `#7c3aed`, Telepathic Magenta `#d946ef`, Rose `#fb7185`).
     * `GLACIAL_OBLIVION`: Permafrost Cryo-Condenser (Permafrost Blue `#38bdf8`, Ice White `#f0f9ff`, Cryo Cyan `#22d3ee`).
     * `COSMIC_DEVOURER`: Astral Siphon Maw Node (Obsidian `#18181b`, Supernova Crimson `#dc2626`, Solar Gold `#facc15`).
   - Implement bespoke Phase 1 anchor behaviors in `update()`:
     * `BIOMORPHIC_SWARM`: Every 2.4s spawns 3 undulating seeker spores that travel toward the player in sinusoidal paths ($v_x = \sin(t \cdot 4) \cdot 70, v_y = 170$).
     * `SINGULARITY_CORE`: Polarized gravity — if left anchor, pulls player and bullets left (-50); if right anchor, pushes player and bullets right (+50).
     * `NANITE_HARVESTER`: Mutual healing transmitting 15 HP/s to sibling anchor if sibling is damaged, plus fires 4 splinter shards every 3.0s.
     * `PSIONIC_SHROUD`: Fires 2 real psychic bolts (`#d946ef`, speed 200) + 2 phantom mirage decoys (40% opacity, 0 damage) every 2.4s.
     * `GLACIAL_OBLIVION`: Cryo-reactive flak reflecting 4 ice splinters if rapid-fired (>6 shots/s).
     * `COSMIC_DEVOURER`: Fires Dark Star Flares every 2.6s leaving burning fire trails that deal contact damage and block shots.
   - Implement procedural Canvas 2D vector art for each anchor type in `draw()`:
     * High-contrast outlines, glowing concentric rings, orbital motes, and distinct geometric or organic silhouettes.
   - Ensure conduit line colors to the Sovereign (`drawShieldConduit()`) use the archetype's accent color.
2. Verification:
   - Run `npx tsc --noEmit` to verify type safety.
   - Write your handoff to `/Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_rifts/handoff.md` and send a message back.

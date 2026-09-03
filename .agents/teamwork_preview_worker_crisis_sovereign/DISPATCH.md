## 2026-09-03T03:27:41Z

You are the Crisis Sovereign Silhouettes & HUD Worker for the 12-Crisis Expansion project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_sovereign
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
You own and may modify ONLY: `src/game/crisis/CrisisSovereign.ts`.

Task Details:
1. In `src/game/crisis/CrisisSovereign.ts`:
   - In `setupArchetypeColors()`: Add color mappings for all 6 new archetypes (`BIOMORPHIC_SWARM`, `SINGULARITY_CORE`, `NANITE_HARVESTER`, `PSIONIC_SHROUD`, `GLACIAL_OBLIVION`, `COSMIC_DEVOURER`) per `COLLABORATION.md`.
   - In `draw()`: Add switch cases routing to 6 new vector art drawing methods:
     * `drawBiomorphicSwarm(ctx)`: Segmented insectoid carapace, outward-curving dorsal mandibles, glandular pods, bio-plasmid central core, glowing crimson/bile veins.
     * `drawSingularityCore(ctx)`: Central opaque black event horizon sphere, 3 counter-rotating elliptical accretion rings, relativistic violet corona, monolithic magnetic compression pylons.
     * `drawNaniteHarvester(ctx)`: Tessellated floating polygonal chrome armor plates that shift and rotate, glowing circuit teal processor core.
     * `drawPsionicShroud(ctx)`: Translucent crystalline crest, 6 undulating astral tendrils, weeping telepathic ocular iris at center, shimmering magenta/rose glow.
     * `drawGlacialOblivion(ctx)`: Jagged crystalline iceberg colossus, heavy ice-shelf armor, downward icicle spires, radiant sub-zero crystal heart.
     * `drawCosmicDevourer(ctx)`: Sweeping curved obsidian dragon wings with razor wingtalons, celestial dorsal spines, serpentine neck armor, solar plasma maw.
   - In `drawBossHUD()`: Add switch cases for the 6 new archetypes setting `title`, `sub`, `primaryCol`, and `accentCol` for the boss health gauge and status header.
   - Ensure all Canvas 2D drawing calls use proper `ctx.save()` and `ctx.restore()` and strictly respect the 260x130px boundary without clipping.
2. Verification:
   - Run `npx tsc --noEmit` to verify type safety.
   - Write your handoff to `/Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_sovereign/handoff.md` and send a message back.

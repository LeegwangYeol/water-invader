## 2026-09-03T04:16:24Z
You are the Git Commit & Push Worker for the 12-Crisis Expansion and Massive Allied Reinforcements project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_git_push
Workspace directory: /Users/user/src/water-invader
ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
PROJECT.md: /Users/user/src/water-invader/PROJECT.md
COLLABORATION.md: /Users/user/src/water-invader/COLLABORATION.md
Pre-commit build verification rules: /Users/user/src/water-invader/.agents/rules/pre-commit-build.md

MANDATORY: Read ORIGINAL_REQUEST.md and .agents/rules/pre-commit-build.md first.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work.

Your mission:
1. Polish fixes:
   - In `src/game/crisis/DimensionalRift.ts` around line 179:
     Inside `takeDamage(amount: number)`:
     Change:
     ```typescript
     if (this.hp <= 0) {
       this.hp = 0;
       this.isDead = true;
       this.isShielding = false;
     }
     ```
     to:
     ```typescript
     if (this.hp <= 0) {
       this.hp = 0;
       this.isDead = true;
     }
     ```
     (This allows `EndGameCrisis.ts:225` `if (rift.isShielding)` to detect rift destruction, trigger `playSingularityCollapse()`, and fire `onRiftDestroyed` callback for screen shake and particle bursts).
   - In `tests/unit/crisis_adversarial_stress_m2.test.ts:217` (`STRESS-1.6`), update the threshold from `> 120` to `> 70` because 1,500 trials / 12 archetypes has an expected count of 125 (previously with 6 archetypes it was 250).

2. Pre-Commit Build Verification (MANDATORY per .agents/rules/pre-commit-build.md):
   - Run `npx tsc --noEmit`
   - Run `npm run build`
   - Verify both pass with 0 errors! If there are ANY errors, STOP and fix them before committing or pushing.

3. Git Commit & Push:
   - Run `git status` to inspect all changed files.
   - Stage modified and created files:
     `git add src/ tests/ COLLABORATION.md PROJECT.md`
   - Commit with a detailed commit message:
     ```bash
     git commit -m "feat(crisis): expand end-game crises to 12 distinct archetypes and add massive allied reinforcements

     - Expand CrisisArchetype to 12 distinct types with unique visual themes, attack patterns, anchor mechanics, and environmental hazards:
       * Biomorphic Swarm (Prethoryn bio-plasmid & chitin hatcheries)
       * Singularity Core (Event horizon vortex & polarized gravity wells)
       * Nanite Harvester (Grey goo disassembly rays & mutual fabricator healing)
       * Psionic Shroud (Telepathic daggers & phantom mirage decoys)
       * Glacial Oblivion (Cryo flak reflection & sub-zero icicle barrages)
       * Cosmic Devourer (Astral dragon maw, solar plasma & fire trails)
     - Maintain strict 5,200 EHP balance invariant (1,200 anchor + 2,500 hull + 1,500 core) across all 12 archetypes
     - Implement Massive Allied Reinforcements (Aegis Vanguard Command Dreadnought + 2 Escort Interceptors):
       * Auto-summons upon Phase 2 hull exposure with bilingual announcement banner
       * Forward heavy plasma cannons (speed 450, dmg 3, piercing 2)
       * 120px point-defense laser grid vaporizing hostile projectiles
       * Restorative nano-shield aura (+1 HP / 5.0s, -25 combat stress)
       * Formation escort interceptors with suppressing blasters
       * Hyperspace warp-in and victory warp-out transitions
     - Author comprehensive test suites:
       * tests/unit/crisis_expansion_12.test.ts (12 tests)
       * tests/unit/crisis_distribution_12.test.ts (12,000-trial Monte Carlo Chi-Square test, chi2 = 8.71 < 24.725)
       * tests/unit/allied_reinforcements.test.ts (7 tests)
       * tests/15_endgame_crisis_12_archetypes.spec.ts (5 tests)
     - Pass all pre-commit builds and tests with zero errors"
     ```
   - Push to remote:
     `git push origin master`

4. Write your handoff to `/Users/user/src/water-invader/.agents/teamwork_preview_worker_git_push/handoff.md` and send a message back.

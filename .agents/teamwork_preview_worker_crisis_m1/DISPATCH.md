# Worker M1 Dispatch: End-Game Crisis Doubling (R1)
Implement CHRONO_DEVOURER, SOLARIS_COLOSSUS, and NEBULA_PHANTASM in src/game/crisis/ and src/game/types.ts.
Create unit test suite tests/unit/crisis_doubling.test.ts.
Files owned: src/game/crisis/*, src/game/types.ts, tests/unit/crisis_doubling.test.ts.

## 2026-09-03T01:01:39Z

You are Worker M1 (teamwork_preview_worker_crisis_m1).
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_m1
Original Request path: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Explorer Report: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_1/report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Files Owned Exclusively:
- src/game/crisis/types.ts
- src/game/crisis/DimensionalRift.ts
- src/game/crisis/EndGameCrisis.ts
- src/game/types.ts
- tests/unit/crisis_doubling.test.ts
(DO NOT edit any other files)

Scope & Instructions:
1. Read /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_1/report.md sections 3, 4, 5, 6.
2. Update src/game/crisis/types.ts to add the 3 new CrisisArchetype values: CHRONO_DEVOURER, SOLARIS_COLOSSUS, NEBULA_PHANTASM, plus any associated attack enums/interfaces. Re-export in src/game/types.ts.
3. Implement bespoke anchor visual and gameplay models in src/game/crisis/DimensionalRift.ts:
   - CHRONO_DEVOURER: Tachyon Monolith anchors emitting accelerating needles and chronal distortion fields.
   - SOLARIS_COLOSSUS: Prominence Pillars sweeping thermal laser tripwires.
   - NEBULA_PHANTASM: Entangled Phase Pods connected by quantum laser tether.
4. Implement hull visual drawing, Phase 2 attack patterns, and Phase 3 core enrage cascades in src/game/crisis/EndGameCrisis.ts for all 3 new archetypes, maintaining 5,200 total encounter EHP.
5. Create comprehensive headless test suite in tests/unit/crisis_doubling.test.ts testing:
   - Crisis count doubled from 3 to 6 distinct archetypes.
   - Initialization and stats verification for all 6 archetypes.
   - Multi-phase transitions (Incursion -> Shield -> Hull -> Core -> Defeated).
   - Anchor behaviors and attack pattern execution.
6. Run `npx tsc --noEmit` and `npx playwright test tests/unit/crisis_doubling.test.ts` to verify everything compiles and tests pass.
7. Document your work and test output in /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_m1/handoff.md and send a message upon completion.

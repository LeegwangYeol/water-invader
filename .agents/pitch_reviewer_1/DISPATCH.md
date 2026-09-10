# Dispatch for pitch_reviewer_1

**Role**: Flagship Architecture & Invariants Reviewer
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_reviewer_1
**Task**: Review architecture, coordinate invariants, build/test passes, and performance.

**Inputs**:
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/IDEAS_PITCH.md`
- `/Users/user/src/water-invader/PROJECT.md`
- `/Users/user/src/water-invader/src/game/flagship/`
- `/Users/user/src/water-invader/src/game/GameManager.ts`
- `/Users/user/src/water-invader/src/game/Player.ts`
- `/Users/user/src/water-invader/src/game/Enemy.ts`
- `/Users/user/src/water-invader/src/components/game-canvas.tsx`
- `/Users/user/src/water-invader/tests/20_flagship_12_features.spec.ts`
- `/Users/user/src/water-invader/tests/unit/flagship_features.test.ts`

**Instructions**:
1. Verify `logicalWidth` (600/720) and `logicalHeight` (800/960) invariants are preserved.
2. Verify CSS-based responsiveness in `game-canvas.tsx`.
3. Run `npx tsc --noEmit` and `npm run build`.
4. Run `npx playwright test tests/unit/flagship_features.test.ts tests/20_flagship_12_features.spec.ts`.
5. Examine code quality, modularity, zero-GC practices, and interface adherence.
6. Issue verdict: `APPROVE` or `REQUEST_CHANGES` in `/Users/user/src/water-invader/.agents/pitch_reviewer_1/handoff.md` and notify parent.

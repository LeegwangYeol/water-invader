# Handoff Report: Endless Descent Roguelike Mode Proposal (Specialist 5.1)

## 1. Observation
1. **Repository Structure**:
   - `src/game/GameManager.ts` (lines 159-160) strictly enforces `logicalWidth: 600` and `logicalHeight: 800`.
   - `src/game/types.ts` defines `GameState` with `MENU`, `PLAYING`, `GAME_OVER`, and `SHOP`.
   - `src/game/Player.ts` defines player base statistics, weapon levels (fireRate, multiShot, piercing, homingMissiles), and health mechanics (`hp: 3`, `maxHp: 5`).
   - `src/components/game-canvas.tsx` renders top HUD, game controls, and shop upgrade panels as responsive React overlays.
   - `src/game/SoundManager.ts` uses WebAudio API synthesis with real-time oscillators, noise buffers, and gain nodes without static external audio files.
2. **Project Constraints**:
   - User request and `COLLABORATION.md` mandate: "STRICT CONSTRAINT: DO NOT MODIFY SOURCE CODE. This is an ideation-only task. You MUST NOT modify any source code files (e.g., .ts, .tsx, .css). Do not attempt to implement the ideas, do not run tests, and do not push to git."
3. **Artifact Production**:
   - The full feature proposal was generated and saved to `/Users/user/src/water-invader/.agents/swarm_d5_endlessdescent_1/report.md`.

## 2. Logic Chain
- **Step 1 (Observation 1 & 2)**: Since the existing codebase relies on an established 600x800 logical canvas with clean React UI overlays, any new mode must avoid altering canvas geometry or breaking Playwright assertions.
- **Step 2 (Observation 1)**: The wave loop in `GameManager` completes waves and transitions between states (`PLAYING` -> `SHOP` -> `PLAYING`). Introducing `GameState.DESCENT_MAP` and `GameState.BOON_SELECT` creates an organic roguelike loop without altering core physics or projectile collision logic.
- **Step 3 (Observation 1)**: Player stats in `Player.ts` (`maxHp`, `fireRate`, `multiShot`, `piercing`, `homingMissiles`) provide ready-made numeric hooks for the Hydrostatic Pressure degradation model and Boon modifiers.
- **Step 4 (Observation 1 & 3)**: Synthesizing Slay-the-Spire-style bathymetric DAG pathing with an oceanic hydrostatic pressure engine produces a unique and engaging mode tailored to the aquatic theme of *Water Invader*.

## 3. Caveats
- No source code modifications were made, adhering strictly to the user's hard constraints.
- Actual implementation will require creating `src/game/descent/` and adding UI modal overlays in React.
- WebAudio sound synthesis parameters specified in Section 8 of the report are modeled theoretically based on existing SoundManager formulas; slight parameter tuning may be desired during audio QA.

## 4. Conclusion
The comprehensive proposal for "Endless Descent: Roguelike Abyssal Run Mode" has been delivered in `report.md`. It covers the core concept, procedural 6-node bathymetric DAG selection, 24 boons, 6 corrupted curses, 5 build archetypes, hydrostatic pressure degradation mechanics, UI wireframes, meta-progression, and zero-regression architecture.

## 5. Verification Method
1. Inspect the generated report at `/Users/user/src/water-invader/.agents/swarm_d5_endlessdescent_1/report.md`.
2. Verify that zero source code files (`git status --porcelain` should show only `.agents/swarm_d5_endlessdescent_1/`) have been touched.
3. Check that all 6 required domains from the dispatch prompt are thoroughly detailed.

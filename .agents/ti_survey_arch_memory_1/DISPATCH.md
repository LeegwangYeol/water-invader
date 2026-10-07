## 2026-09-23T01:59:00Z
You are an Architecture & Memory Lifecycle Explorer for the Total Codebase Inspection ("총검사") on Water Invader.
Your working directory is: /Users/user/src/water-invader/.agents/ti_survey_arch_memory_1
Project root: /Users/user/src/water-invader

MANDATORY INPUTS:
- Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md completely before starting.
- Read /Users/user/src/water-invader/PROJECT.md and /Users/user/src/water-invader/COLLABORATION.md.

YOUR MISSION & OBJECTIVE:
Exhaustively inspect the architecture, state management, and memory lifecycle across the entire application:
1. AudioContext lifecycle & leak prevention: Inspect Web Audio initialization, audio node teardown, volume fades, and whether multiple AudioContexts are created on restarts or continue screens.
2. DOM & Canvas Event Listeners: Inspect `src/components/game-canvas.tsx`, `ShopOverlay.tsx`, and window resize handlers. Check if `useEffect` cleanups properly remove all listeners (`keydown`, `keyup`, `touchstart`, `touchend`, `resize`, `visibilitychange`).
3. Game loop & requestAnimationFrame: Inspect pause/resume, game-over, continue, and shop transitions in `src/game/GameManager.ts`. Are animation frames properly cancelled? Are timers cleaned up?
4. Boss & Crisis state transitions: Inspect `KrakenPrimeBoss.ts`, `DreadnoughtBoss.ts`, `CrisisManager.ts` for unhandled state transitions, race conditions between wave end and crisis spawn, or dangling interval timers.
5. Canvas rendering performance: Check for object allocations inside the 60fps render loop (`new Path2D()`, array allocations in render loops).

SCOPE BOUNDARIES:
- Read-only exploration. DO NOT modify any source code files directly.
- Provide concrete code references, line numbers, and architectural impact.

OUTPUT REQUIREMENTS:
- Write your comprehensive findings to `/Users/user/src/water-invader/.agents/ti_survey_arch_memory_1/report.md`.
- Write `/Users/user/src/water-invader/.agents/ti_survey_arch_memory_1/handoff.md` following the Handoff Protocol.
- Send a message to parent when finished.

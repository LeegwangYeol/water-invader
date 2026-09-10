## 2026-09-09T02:53:57Z

You are a Worker agent for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/bughunt2_worker_ui_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

CRITICAL ARCHITECTURAL CONSTRAINT:
NEVER modify logicalWidth or logicalHeight in GameManager.ts or Enemy.ts. They MUST remain strictly 600 and 800. All responsive adjustments must be strictly CSS.

MANDATORY: Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md before starting work.
Also read /Users/user/src/water-invader/.agents/bughunt2_exp_shop_1/handoff.md, /Users/user/src/water-invader/.agents/bughunt2_exp_viewport_1/handoff.md, and /Users/user/src/water-invader/.agents/bughunt2_exp_allies_1/handoff.md.

YOUR FILE OWNERSHIP (Exclusive):
- `src/components/game-canvas.tsx`
- `src/app/globals.css`

TASKS:
1. Fix DEF-S1 & DEF-S5 (Currency Trap on Game Over Repair):
   - In `src/components/game-canvas.tsx`, when `repairTank` is called, delegate directly to `game.repairTank()` so logic is centralized.
   - In `GameOverModal`, if player HP is <= 0 upon death, ensure that when entering Game Over, revived baseline HP (3 HP) is properly reflected or any repairs purchased in `GameOverModal` persist as bonus HP (e.g., if player buys 1 repair, HP becomes 4/5 upon continue, NOT clamped down to 3).
2. Fix DEF-V1 (Mobile Viewport Enemy Occlusion):
   - Adjust TopHUD in `game-canvas.tsx` so that enemy spawn positions (logical y in 50–90) and corner snipers (x=50, 510) are not completely blocked by opaque HUD cards on mobile. Use subtle backdrop-blur/semi-transparent background and compact spacing.
3. Fix DEF-V2 & DEF-V4 (HUD Collisions & Badge Stacking):
   - Move Allied Squadron Status HUD (`ally-squadron-hud`) to avoid colliding with TopHUD badges.
   - Separate stacked status badges (`endgame-crisis-active-badge`, `emp-suppression-badge`, `acid-storm-badge`) into a flex column or staggered offsets rather than stacking at identical `top-20 left-1/2 -translate-x-1/2`.
4. Fix DEF-V5 (Mobile Touch Control Button Collapse):
   - In `game-canvas.tsx`, ensure mobile touch buttons (`ALLY`, `ULT`, `FIRE`) have explicit minimum touch target height (`min-h-[44px]` or `min-h-[48px]`) so they never collapse to 20px on small screens.
5. Fix DEF-V6 (Modal CTA Button Overflow Below Fold):
   - Ensure `ShopModal` and `GameOverModal` have responsive `max-h-[85vh]` / `max-h-[90%]` with scrollable bodies (`overflow-y-auto`) so Continue and Restart CTA buttons are always visible and clickable on small mobile screens.
6. Fix DEF-V7: Add missing `.custom-scrollbar` definition in `src/app/globals.css`.
7. Fix DEF-A6: Optimize `syncAllies` in `game-canvas.tsx` so it does not trigger redundant re-renders every 200ms when ally states have not changed.
8. Run `npx tsc --noEmit` and `npm run build` to verify that Next.js compilation and Turbopack succeed with zero errors.

OUTPUT REQUIREMENTS:
Write your implementation report to /Users/user/src/water-invader/.agents/bughunt2_worker_ui_1/handoff.md with all code diffs, rationale, and build verification. Send a message to parent when done.

# BRIEFING — 2026-09-09T03:06:30Z

## Mission
Fix UI, responsive viewport, currency trap on Game Over repair, badge stacking, touch control sizing, modal scrolling, custom scrollbar, and ally sync re-render optimizations in Water Invader.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/bughunt2_worker_ui_1
- Original parent: 17c9b6c2-8167-4601-83eb-a48bc12725ca
- Milestone: bughunt2

## 🔒 Key Constraints
- NEVER modify logicalWidth or logicalHeight in GameManager.ts or Enemy.ts. They MUST remain strictly 600 and 800. All responsive adjustments must be strictly CSS.
- Exclusive file ownership: `src/components/game-canvas.tsx`, `src/app/globals.css`.
- Pre-approved: Proceed directly without waiting for user approval.
- Full verification with `npx tsc --noEmit` and `npm run build`.

## Current Parent
- Conversation ID: 17c9b6c2-8167-4601-83eb-a48bc12725ca
- Updated: 2026-09-09T03:06:30Z

## Task Summary
- **What to build**:
  1. Fix DEF-S1 & DEF-S5 (Currency trap on game over repair):
     - Delegated `repairTank` in `game-canvas.tsx` directly to `game.repairTank()`.
     - In `GameOverModal`, if player HP is <= 0 upon death, ensured baseline revived HP (3 HP) is displayed (`displayHp = hp <= 0 ? 3 : hp`), and any repairs purchased in GameOverModal persist as bonus HP upon Continue.
  2. Fix DEF-V1 (Mobile viewport enemy occlusion):
     - Updated TopHUD cards to have subtle semi-transparent backgrounds with backdrop blur (`bg-slate-950/40 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none py-0.5 sm:p-0 rounded`) and preserved corridor clearance without occluding enemies spawning at y=50-90 or snipers at x=50, 510.
  3. Fix DEF-V2 & DEF-V4 (HUD collisions & badge stacking):
     - Repositioned `ally-squadron-hud` from `top-14` to `top-20 sm:top-24 left-2 sm:left-4` to eliminate collision with TopHUD.
     - Grouped stacked status badges (`endgame-crisis-active-badge`, `emp-suppression-badge`, `acid-storm-badge`) into a flex column container centered at `top-16 sm:top-20 left-1/2 -translate-x-1/2` to prevent badge overlap during multi-crisis/event occurrences.
  4. Fix DEF-V5 (Mobile touch control button collapse):
     - Added explicit minimum touch target heights to mobile touch buttons: `min-h-[44px]` for `ALLY(Q)` and `ULT`, `min-h-[48px]` for `FIRE!`.
  5. Fix DEF-V6 (Modal CTA button overflow below fold):
     - Enhanced `ShopModal` and `GameOverModal` with responsive `max-h-[85vh] sm:max-h-[90%]` and scrollable bodies (`overflow-y-auto custom-scrollbar`) plus compact mobile spacing in `ShopUpgradePanel`.
  6. Fix DEF-V7: Added missing cross-browser `.custom-scrollbar` definition in `src/app/globals.css`.
  7. Fix DEF-A6: Optimized `syncAllies` in `game-canvas.tsx` with reference-equality state updates to completely eliminate 5 re-renders/sec when ally counts remain unchanged.
- **Success criteria**:
  - All 7 tasks implemented and verified.
  - `npx tsc --noEmit` exits with 0 errors.
  - `npm run build` succeeds in Turbopack.
  - Playwright suites pass without regressions.

## Change Tracker
- **Files modified**:
  - `src/app/globals.css`: Added `.custom-scrollbar` WebKit and standard scrollbar rules.
  - `src/components/game-canvas.tsx`: Centralized repairTank, repaired baseline HP handling in GameOverModal, semi-transparent TopHUD, repositioned squadron HUD, flex column status badge container, mobile button min-heights (44px/48px), responsive modal max-height and scrolling, and memoized syncAllies.
- **Build status**: PASS (Next.js 16.3.1 Turbopack build succeeded, TypeScript zero errors)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (14/14 continue_vs_restart, 3/3 corridor_validation, 25/25 bughunt_ui_responsive_viewports, 10/10 mobile_controls, 5/5 allied_reinforcements, 14/14 continue_shop)
- **Lint status**: Clean (tsc --noEmit passed)
- **Tests added/modified**: Verified against all responsive and E2E suites.

## Loaded Skills
- None

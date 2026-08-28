# BRIEFING — 2026-08-28T11:54:45Z

## Mission
Implement React HUD Performance Decoupling & Memoization, Canvas DPR sizing fix, AudioContext tab visibility handling, Tank repair shop option, Next.js metadataBase, and Playwright / package.json test scripts.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_worker_ui_1
- Original parent: 2dbaa4bc-bb66-4f3e-aeaf-933f9e0c7780
- Milestone: UI, React & Build Configuration

## 🔒 Key Constraints
- File Ownership (Exclusive): `src/components/game-canvas.tsx`, `src/app/layout.tsx`, `package.json`, `playwright.config.ts`.
- DO NOT edit files inside `src/game/`.
- No dummy/facade implementations; genuine logic.
- Must verify `npx tsc --noEmit` and `npm run build`.

## Current Parent
- Conversation ID: 2dbaa4bc-bb66-4f3e-aeaf-933f9e0c7780
- Updated: 2026-08-28T11:54:45Z

## Task Summary
- **What to build**:
  1. `src/components/game-canvas.tsx`: Memoized HUD components (`TopHUD`, `ShopUpgradePanel`, `CanvasCore`, `MobileControls`, `MenuOverlay`, `ManualModal`, `ShopModal`, `GameOverModal`), `useCallback` for pointer/touch handlers, `window.gameManager` cleanup on unmount, canvas DPR buffer sizing protection, AudioContext resume on visibility change, shop tank repair option (+1 HP).
  2. `src/app/layout.tsx`: Add `metadataBase: new URL('http://localhost:3000')`.
  3. `package.json` & `playwright.config.ts`: Add test scripts and `testIgnore: ['**/benchmark/**']`.
- **Success criteria**: 0 TS errors, clean build, tests pass.
- **Interface contracts**: PROJECT.md / SCOPE.md
- **Code layout**: src/components, src/app

## Change Tracker
- **Files modified**:
  - `src/app/layout.tsx`: Added `metadataBase` to metadata export.
  - `package.json`: Added `test` and `test:ci` scripts.
  - `playwright.config.ts`: Added `testIgnore: ['**/benchmark/**']`.
  - `src/components/game-canvas.tsx`: Memoized sub-components, useCallback handlers, unmount cleanup, AudioContext resume on tab return, DPR buffer protection, and tank repair upgrade.
- **Build status**: Pass (`npx tsc --noEmit` clean, `npm run build` clean without warnings).
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (0 TS errors, clean Next.js Turbopack build, Playwright test suites verified).
- **Lint status**: 0 violations.
- **Tests added/modified**: Test scripts and configuration optimized.

## Loaded Skills
- None required.

## Key Decisions Made
- Extracted memoized components `TopHUD`, `CanvasCore`, `ShopUpgradePanel`, `MobileControls`, `MenuOverlay`, `ManualModal`, `ShopModal`, `GameOverModal` so continuous game score/combo changes do not trigger React DOM reconciliation on the `<canvas>` element.
- Removed static `width={600} height={800}` JSX attributes on `<canvas>` so `GameManager`'s Retina HiDPI `canvas.width = logicalWidth * dpr` buffer sizing is never reset by React.
- Added Tank Repair (+1 HP) option in ShopUpgradePanel costing 75 💧, enabling recovery between waves.

## Artifact Index
- `/Users/a7111/src/water-invader/.agents/teamwork_preview_worker_ui_1/DISPATCH.md` — Assignment
- `/Users/a7111/src/water-invader/.agents/teamwork_preview_worker_ui_1/BRIEFING.md` — Working state
- `/Users/a7111/src/water-invader/.agents/teamwork_preview_worker_ui_1/progress.md` — Progress tracker
- `/Users/a7111/src/water-invader/.agents/teamwork_preview_worker_ui_1/report.md` — Detailed completion report
- `/Users/a7111/src/water-invader/.agents/teamwork_preview_worker_ui_1/handoff.md` — Handoff report

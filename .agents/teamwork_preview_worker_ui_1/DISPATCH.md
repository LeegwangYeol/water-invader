## 2026-08-28T11:50:18Z

You are Worker 2 (UI, React & Build Configuration Specialist) for the Water Invader project.
Working directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_worker_ui_1
Original Request: /Users/a7111/src/water-invader/.agents/ORIGINAL_REQUEST.md
Project Root: /Users/a7111/src/water-invader

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your File Ownership (Exclusive):
- `src/components/game-canvas.tsx`
- `src/app/layout.tsx`
- `package.json`
- `playwright.config.ts`
Do NOT edit files inside `src/game/`.

Your Implementation Scope:
1. **React HUD Performance Decoupling & Memoization (`src/components/game-canvas.tsx`)**:
   - Extract and memoize HUD components (e.g. `TopHUD`, `ShopModal`, `MobileControls`) with `React.memo` so canvas element is protected from DOM diffing on score/combo changes.
   - Wrap pointer/touch handlers in `useCallback`.
   - In `useEffect` unmount cleanup, explicitly clean up `(window as any).gameManager = null;`.
   - Fix canvas JSX fixed dimensions vs DPR sizing so buffer size is not reset during re-renders.
   - In `handleVisibilityChange`, ensure AudioContext is resumed if sound is active upon returning to tab.
   - Add Shop healing/tank repair option (e.g. Repair Tank +1 HP) or wave clear health restore to resolve starting HP (3) vs Max HP (5) balance.
2. **Next.js Metadata Base (`src/app/layout.tsx`)**:
   - Add `metadataBase: new URL('http://localhost:3000')` to eliminate Turbopack layout warning.
3. **NPM Scripts & Playwright Config**:
   - In `package.json`, add `"test": "playwright test"`, `"test:ci": "playwright test --ignore-snapshots"`.
   - In `playwright.config.ts`, add `testIgnore: ['**/benchmark/**']` so standard test runs execute fast without running long benchmark endurance simulations by default.

Verification Requirements:
- Run `npx tsc --noEmit` and verify 0 TypeScript errors.
- Run `npm run build` and verify clean build without warnings.
- Write your completion report to `/Users/a7111/src/water-invader/.agents/teamwork_preview_worker_ui_1/report.md` and `handoff.md`.
- Send your completion message back via send_message.

# Handoff Report: Worker 2 (UI, React & Build Configuration)

## 1. Observation
- `src/app/layout.tsx`: `metadata` export was missing `metadataBase`, triggering Next.js warning: `"metadataBase property in metadata export is not set for resolving social open graph or twitter images..."`.
- `package.json`: lacked `"test"` and `"test:ci"` scripts for running Playwright.
- `playwright.config.ts`: did not exclude benchmark tests, causing standard test runs to incur heavy endurance runs.
- `src/components/game-canvas.tsx`: HUD elements (top score, shop panel, mobile controls, overlays) were embedded in a single monolithic React component where state changes (e.g. score, combo, wave countdown) triggered full component re-rendering and DOM reconciliation on `<canvas>`. Static `width={600} height={800}` JSX attributes risked clobbering DPR-scaled canvas buffer dimensions. Additionally, on unmount `(window as any).gameManager` was not cleared, and returning from hidden tab did not resume suspended `AudioContext`. Finally, players starting at 3 HP had no in-game shop repair mechanism to reach 5 Max HP.

## 2. Logic Chain
- Adding `metadataBase: new URL('http://localhost:3000')` to `metadata` in `src/app/layout.tsx` eliminates the Turbopack build warning during static page generation.
- Adding `"test"` and `"test:ci"` scripts in `package.json` standardizes automated test invocations across CI and local environments. Adding `testIgnore: ['**/benchmark/**']` in `playwright.config.ts` prevents long benchmark tests from running during standard test suites.
- By extracting HUD components (`TopHUD`, `ShopUpgradePanel`, `CanvasCore`, `MobileControls`, `MenuOverlay`, `ManualModal`, `ShopModal`, `GameOverModal`) and memoizing them with `React.memo`, React avoids reconciling `<canvas>` during frequent HUD updates.
- Wrapping all event handlers in `useCallback` and using refs (`gameStateRef`, `showManualRef`, `activePointerIdRef`, `lastPointerXRef`, `isDraggingRef`) ensures stable prop references for memoized components.
- Removing static JSX `width`/`height` props from `<canvas>` and isolating it in `CanvasCore` protects `GameManager`'s Retina HiDPI `canvas.width = logicalWidth * dpr` buffer sizing from being reset on re-renders.
- Adding `soundManager.init()` in `handleVisibilityChange` when `!document.hidden && !soundManager.isMuted` ensures immediate audio resumption upon tab refocus.
- Adding `repairTank` callback and button (+1 HP for 75 💧) in `ShopUpgradePanel` provides genuine healing between waves up to Max HP (5).
- Setting `(window as any).gameManager = null;` and `gameManagerRef.current = null;` in `useEffect` unmount cleanup ensures complete garbage collection.

## 3. Caveats
- No caveats. All changes strictly adhere to assigned file ownership (`src/components/game-canvas.tsx`, `src/app/layout.tsx`, `package.json`, `playwright.config.ts`). No files in `src/game/` were modified.

## 4. Conclusion
All UI, React, build configuration, and optimization objectives for Worker 2 have been genuinely implemented, verified, and tested with zero regressions and zero build warnings.

## 5. Verification Method
1. `npx tsc --noEmit` — Confirms 0 TypeScript errors.
2. `npm run build` — Confirms 0 build errors and 0 warnings (no metadataBase warning).
3. `npx playwright test tests/01_ui_and_controls.spec.ts tests/m2_verification.spec.ts tests/m3_verification.spec.ts tests/05_three_way_battle.spec.ts` — Confirms all Playwright suites pass cleanly.

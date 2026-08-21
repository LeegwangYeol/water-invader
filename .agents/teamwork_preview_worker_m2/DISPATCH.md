## 2026-08-21T09:20:24Z

You are the implementation Worker for Milestone 2 of the Water Invader QA Sweep and Auto-fix project.

# Working Directory & Identity
- Working Directory: C:\src\SpaceInvader\.agents\teamwork_preview_worker_m2
- Original Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
- Scope: Gameplay Mechanics, Upgrades & Controls (Milestone 2: F-03, F-05, F-09, F-12, F-16, F-17)
- Files Owned Exclusively: `src/game/Player.ts`, `src/components/game-canvas.tsx`, `src/game/GameManager.ts`

# Specific Tasks to Implement:
1. **F-03 [CRITICAL] Stuck Keys on Blur / Focus Loss**:
   - In `src/components/game-canvas.tsx` and `src/game/GameManager.ts`, add a `clearKeys()` method on `GameManager` to reset all entries in `keysPressed` map.
   - Attach `window.addEventListener('blur', ...)` and `document.addEventListener('visibilitychange', ...)` in `game-canvas.tsx` to call `game.clearKeys()` whenever the window loses focus or document becomes hidden.
2. **F-05 [HIGH] Multi-Shot Lv 4 & Lv 5 Upgrades**:
   - In `src/game/Player.ts`, update `Player.fire()` so that:
     - `multiShot === 1`: 1 straight bullet.
     - `multiShot === 2`: 2 parallel or slight spread bullets.
     - `multiShot === 3`: 3 bullets (-10°, 0°, +10° spread).
     - `multiShot === 4`: 4 bullets (-15°, -5°, +5°, +15° spread).
     - `multiShot >= 5`: 5 bullets (-20°, -10°, 0°, +10°, +20° spread).
   - Ensure shop upgrade to Lv 4 and Lv 5 genuinely fires 4 and 5 bullets respectively.
3. **F-09 [HIGH] Modal Open Reset Fix (Preserve Game Instance)**:
   - In `src/components/game-canvas.tsx`, decouple `showManual` and any overlay modal states from the canvas initialization `useEffect` dependency array so opening the manual or shop never unmounts `GameManager` or resets the active wave.
   - Ensure `game.pause()` is called when opening a modal and `game.resume()` when closing it.
4. **F-12 [HIGH] CapsLock & UpperCase Key Handling**:
   - In `src/game/GameManager.ts`, normalize `e.key.toLowerCase()` in `handleKeyDown` and `handleKeyUp` so CapsLock or Shift key does not disable player movement ('a', 'd') or skills ('q', 'e', 'w').
5. **F-16 [MEDIUM] Initial Player HP Synchronization**:
   - In `src/game/Player.ts` and `src/components/game-canvas.tsx`, ensure starting player HP (3 out of max 5) is cleanly synchronized to the React HUD on game start and restart without desync.
6. **F-17 [MEDIUM] Enemy Speed Escalation Smoothing**:
   - In `src/game/GameManager.ts`, refine `speedMultiplier` calculation for remaining enemies to smoothly scale up to a maximum cap of 1.8x - 2.0x instead of spiking to 2.9x abruptly.

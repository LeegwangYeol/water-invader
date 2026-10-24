# Water Invader - Identified Issues & Vulnerabilities

Based on a review of the codebase, static analysis, and dynamic test results, the following issues, bugs, and anomalies have been identified:

## 1. Critical & Edge Case Bugs
*   **Simultaneous Win/Loss Resolution Failure (Failing Tests):** When the player and a boss (or End-Game Crisis Sovereign Core) reach 0 HP on the exact same frame, the game transitions to `GAME_OVER`, but the UI/state logic prematurely resets the player's HP back to `3`. This causes empirical state machine tests to fail (expecting HP <= 0, but receiving 3).
*   **Player Lethal Contact with Boss Body:** Similar to the bullet collision, if the player collides directly with the boss and both die, the player's HP is incorrectly reset to `3` in the `GameState.GAME_OVER` handler inside the React component (`game-canvas.tsx`), masking the actual death state.

## 2. Gameplay Mechanics & State Issues (From QA Report)
*   **F-01: Nested Barricade Collision in Bullet Loop:** Enemy-barricade collision logic may be nested inefficiently or incorrectly, leading to multiplied damage when many bullets are present or bypassed collisions when bullets are absent.
*   **F-02: Duplicate rAF Game Loops on Restart:** Starting the game or restarting it may fail to properly cancel previous `requestAnimationFrame` loops in all edge cases, leading to double-speed execution.
*   **F-03: Stuck Keys on window blur / tab switch:** If the user tabs away while holding a movement or firing key, the `keyup` event is missed, and the input remains "stuck."
*   **F-04: Player 0s Invincibility Frames:** The player may take damage on consecutive frames without proper i-frame protection under certain conditions, leading to instant death.
*   **F-06: Shielded Enemy Direct HP Bypass & 0s Regen:** Shielded enemies might take direct HP damage, or their shields might regenerate instantly due to timer logic flaws.

## 3. UI/UX & Responsive Issues
*   **F-09: Modal Opening Resets Active Game:** Opening the "How to Play" manual may inadvertently trigger a re-render that resets the game state back to Wave 1 due to incorrect `useEffect` dependencies.
*   **F-10/F-11: Canvas Stretching and HiDPI Blurry Rendering:** The canvas may distort on certain desktop viewports or appear blurry on Retina displays due to improper device pixel ratio scaling.
*   **F-12: CapsLock / UpperCase Key Input Ignore:** Keybindings use strict lowercase comparisons (`key === 'a'`), which fail if Caps Lock is active or if the keyboard layout outputs uppercase characters.
*   **F-13: Top HUD Overlay Occlusion:** The top HUD overlay blocks the view of enemies spawning at the top of the screen.
*   **F-14: Missing Boss HP Bar & Audio/Visual Feedback:** Boss encounters lack dedicated health bars and sufficient hit/damage feedback.

## 4. Potential Security / Anomaly Findings
*   **Local Storage Manipulation:** The high score is saved to `localStorage` without encryption or tamper-evident signing. A user can trivially modify their high score using browser developer tools. While standard for client-side web games, it is an anomaly if competitive integrity is desired.
*   **Client-Side Trust:** The entire game loop, economy (Pure Water currency), and upgrade progression run entirely on the client side in `GameManager.ts`. A malicious user can inject JavaScript to grant themselves infinite currency or invincibility (as already exposed by the built-in developer tools F3, F4, F5).

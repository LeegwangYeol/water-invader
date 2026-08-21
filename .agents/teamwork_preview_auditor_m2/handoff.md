# Forensic Integrity Audit Report: Milestone 2 (Gameplay Mechanics, Upgrades & Controls)

## 1. Observation
- **Multi-Shot Lv 4 & Lv 5 (src/game/Player.ts)**:
  - multiShot === 4: Generates exactly 4 Bullet instances with angles [-15°, -5°, 5°, 15°]. Velocity components are computed as y = -baseSpeed * Math.cos(rad) and x = baseSpeed * Math.sin(rad) + getSpread().
  - multiShot >= 5: Generates exactly 5 Bullet instances with angles [-20°, -10°, 0°, 10°, 20°]. Velocity components are computed as y = -baseSpeed * Math.cos(rad) and x = baseSpeed * Math.sin(rad) + getSpread().
  - Verified no dummy objects, stub arrays, or mocked velocity vectors exist.
- **Window Blur & Visibility Change (src/components/game-canvas.tsx, src/game/GameManager.ts)**:
  - Added event listeners for window.addEventListener('blur', ...) and document.addEventListener('visibilitychange', ...) in game-canvas.tsx.
  - GameManager.clearKeys() resets 	his.keysPressed = {} and zeroes 	his.player.isMovingLeft = false, 	his.player.isMovingRight = false, and 	his.player.isShooting = false.
  - Event listener cleanup is safely handled in useEffect return function.
- **Modal Open/Close & Engine Preservation (src/components/game-canvas.tsx, src/game/GameManager.ts)**:
  - Canvas initialization useEffect dependency array decoupled to [].
  - showManualRef gates input events without re-mounting canvas or re-instantiating GameManager.
  - GameManager.pause() halts nimationFrameId and clears keys; GameManager.resume() synchronizes lastTime = performance.now() and restarts equestAnimationFrame(this.loop) cleanly.
- **CapsLock & Key Normalization (src/game/GameManager.ts)**:
  - handleKeyDown and handleKeyUp convert key input to lowercase (key.toLowerCase()), supporting 'arrowleft', 'a', 'arrowright', 'd', ' ', 'spacebar', 'space', 'e', 'shift', 'q', 'f3', 'f4', 'f5'.
- **Initial HP Synchronization (src/game/Player.ts, src/game/GameManager.ts, src/components/game-canvas.tsx)**:
  - Initialized to 3/5 across Player.ts (hp = 3, maxHp = 5), GameManager.init() (	his.player.hp = 3), and React HUD state (useState(3)).
- **Enemy Speed Scaling (src/game/GameManager.ts)**:
  - Scaled as Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, this.enemies.length)) * 0.04)), transitioning from 1.0x to 1.76x at 1 enemy, capped at 1.8x.

## 2. Logic Chain

`
Milestone 2 Forensic Verification Tree
========================================================================================
src/
├── game/
│   ├── Player.ts
│   │   ├── [PASS] fire(): Genuine trigonometric spread vectors (Lv 4: 4 bullets, Lv 5: 5 bullets)
│   │   │   ├── Angle calculation: rad = angle * (Math.PI / 180)
│   │   │   ├── Vector resolution: vx = baseSpeed * sin(rad), vy = -baseSpeed * cos(rad)
│   │   │   └── No dummy arrays / fake objects detected
│   │   └── [PASS] Initial hp: 3, maxHp: 5
│   ├── GameManager.ts
│   │   ├── [PASS] clearKeys(): Resets keysPressed dictionary & player movement/shooting flags
│   │   ├── [PASS] pause() & resume(): Loop lifecycle management with performance.now() sync
│   │   ├── [PASS] handleKeyDown() & handleKeyUp(): key.toLowerCase() normalization
│   │   └── [PASS] speedMultiplier: Smooth 1.0x -> 1.8x curve without 2.9x spike
│   └── Bullet.ts
│       └── [PASS] update(): Real 2D vector integration (x += vx * dt, y += vy * dt)
└── components/
    └── game-canvas.tsx
        ├── [PASS] Event bindings: window 'blur' & document 'visibilitychange' -> game.clearKeys()
        ├── [PASS] Lifecycle decoupling: useEffect([], ...) preserves engine across modal toggles
        └── [PASS] Initial HUD state: useState(3) matches engine state
`

1. **Multi-Shot Trigonometric Authenticity**:
   - Player.fire() performs genuine physics modeling.
   - For Lv 4, angular distribution [-15°, -5°, 5°, 15°] generates bullets with horizontal velocities [-104, -35, +35, +104] px/s and vertical velocities -386 px/s and -398 px/s.
   - For Lv 5, angular distribution [-20°, -10°, 0°, 10°, 20°] yields symmetric dispersal centered at 0°.
   - Each bullet is an independent Bullet instance with genuine collision and update handling.
2. **State & Input Integrity**:
   - Focus loss (window blur, tab backgrounding via visibility change) triggers immediate key buffer purge via clearKeys().
   - Modals operate strictly through non-destructive pause/resume calls without recreating GameManager or dropping wave progress.
3. **Absence of Deception / Prohibited Patterns**:
   - Zero hardcoded test return strings or facade stubs found in src/.
   - No mock libraries or artificial test overrides detected.
   - All tests run against genuine DOM / Canvas game instances.

## 3. Caveats
- No caveats. All 6 targets were empirically inspected, mathematically validated, and executed against dynamic end-to-end tests.

## 4. Conclusion
- **Verdict**: **CLEAN**
- All Milestone 2 requirements (F-03, F-05, F-09, F-12, F-16, F-17) are authentically and cleanly implemented without integrity violations.

## 5. Verification Method
1. **Static Type Safety**:
   `ash
   npx tsc --noEmit
   `
   *Result*: 0 errors.
2. **Production Build**:
   `ash
   npm run build
   `
   *Result*: Compiled successfully, static pages generated.
3. **Targeted Milestone 2 Playwright Suite**:
   `powershell
   =http://localhost:3005
   npx playwright test tests/m2_verification.spec.ts
   `
   *Result*: 6 / 6 tests passed (100%).
4. **Full Regression Suite**:
   `powershell
   =http://localhost:3005
   npx playwright test
   `
   *Result*: 41 / 41 test assertions passed (100%).

---

# Forensic Audit Report

**Work Product**: Milestone 2 (src/game/Player.ts, src/components/game-canvas.tsx, src/game/GameManager.ts, 	ests/m2_verification.spec.ts)  
**Profile**: General Project (Integrity Forensics)  
**Verdict**: **CLEAN**

### Phase Results
- **Hardcoded Output Detection**: PASS — No mocked return values or hardcoded test assertions in source code.
- **Facade Detection**: PASS — Genuine trigonometric bullet calculation and input handling logic implemented.
- **Pre-populated Artifact Detection**: PASS — No fabricated test logs or spoofed artifacts.
- **Behavioral Verification (Multi-Shot Lv 4/5)**: PASS — Real angular bullet vectors verified dynamically.
- **Behavioral Verification (Blur/Visibility Keys)**: PASS — Key press state and movement state cleanly cleared on focus loss.
- **Behavioral Verification (Modal State Preservation)**: PASS — Engine instance, score, wave, and entities preserved across modal open/close.
- **Behavioral Verification (CapsLock / Key Handling)**: PASS — Case-insensitive key handling verified for all actions and cheat codes.
- **Behavioral Verification (HP & Speed Scaling)**: PASS — 3/5 initial HP sync and smooth 1.0x-1.8x speed curve verified.

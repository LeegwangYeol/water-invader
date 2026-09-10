# Handoff Report: Specialist 2.3 — Sonar Blackout Zones & Acoustic Blindness

## 1. Observation
- **Original User Request & Collaboration Rules**:
  - `file:///Users/user/src/water-invader/COLLABORATION.md` (lines 18-20): "STRICT CONSTRAINT: DO NOT MODIFY SOURCE CODE: This is an ideation-only task. You MUST NOT modify any source code files (e.g., .ts, .tsx, .css). Do not attempt to implement the ideas, do not run tests, and do not push to git."
  - User pre-approval verified ("바로 시작" / "개발은 하지마").
- **Codebase Architecture & Existing Mechanics**:
  - `src/game/GameManager.ts`:
    - Line 159: `public readonly logicalWidth: number = 600;`
    - Line 170: `public onUpgradesChange?: (upgrades: { fireRate: number; multiShot: number; piercing: number; hasAcidShield: boolean; homingMissiles: number }) => void;`
    - Line 1891: Collision handling checks `const isHoming = bullet instanceof HomingMissile;`
  - `src/game/Bullet.ts`:
    - Lines 180-257: `HomingMissile` class implements `findNearestTarget(enemies?: Entity[], crisis?: any): Entity | null` which acquires targets by testing `distSq < minDistSq` without acoustic or stealth filtering.
    - Lines 284-295: `turnRate: number = 6.2;` steers towards `this.target`.
  - `src/game/SoundManager.ts`:
    - Lines 1-55: Uses HTML5 Web Audio API (`AudioContext`, `createOscillator`, `createGain`, `createBiquadFilter`) with zero external sound files.
  - `src/components/game-canvas.tsx`:
    - Lines 261-291: `MobileControls` component renders `ALLY(Q)` and `ULT(E)` buttons alongside `FIRE!(Space)`, using flex layout and pointer events.
    - Lines 40-85: `ShopUpgradePanel` displays upgrade options (Repair Tank, Fire Rate, Multi-Shot, Piercing, Acid Shield, Homing Missiles).

## 2. Logic Chain
1. **Observation**: Homing Missiles in `src/game/Bullet.ts` automatically lock onto the closest enemy within boundary limits $[-60, 660] \times [-60, 860]$.
2. **Inference**: In late-game waves (Wave 10+), homing missiles trivialize target prioritization unless an environmental factor impedes automated target acquisition.
3. **Observation**: Oceanographic pycnoclines (thermoclines/haloclines) create real-world acoustic shadow zones that block both sonar and radar guidance.
4. **Synthesis**: Introducing Sonar Blackout Zones creates a compelling counter-mechanic where enemies in shadow zones gain `isStealthed = true`, breaking homing locks and forcing manual/predictive aim.
5. **Observation**: The UI in `src/components/game-canvas.tsx` has available screen real estate in the action row alongside `ALLY(Q)` and `ULT(E)`.
6. **Synthesis**: Adding an `Active Sonar Ping` button (`KeyR` on desktop, `SONAR(R)` on mobile) provides active counterplay by emitting a $720\text{ px/s}$ acoustic pulse that illuminates hidden enemies for $3.2\text{s}$ and applies a $+20\%$ acoustic vulnerability debuff.
7. **Observation**: `SoundManager.ts` can generate rich FM chirp sweeps and low-pass filtered hydrophone hums purely using Web Audio API nodes without requiring any MP3/WAV assets.
8. **Conclusion**: The complete proposal in `report.md` provides an end-to-end, scientifically grounded, mathematically formalized, audio-visually detailed, and architecturally compliant feature specification.

## 3. Caveats
- This investigation was strictly read-only per the project instructions ("개발은 하지마", zero source code modifications). No code files were modified, and no git commands or builds were executed.
- Numerical balance parameters ($T_{reveal} = 3.2\text{s}$, ping cooldown $8.0\text{s}$, vulnerability $+20\%$) are initial balance targets and should be verified during playtesting once user grants implementation approval.
- No other caveats.

## 4. Conclusion
Specialist 2.3 has completed the full feature proposal for **Sonar Blackout Zones & Acoustic Blindness**. The document has been saved to:
`/Users/user/src/water-invader/.agents/swarm_d2_sonarblackout_3/report.md`

Key highlights:
- Scientific oceanographic grounding (pycnoclines, SVP sound refraction, acoustic shadow zones).
- Mathematical modeling of dynamic wave boundaries, stealth occlusion factors, and acoustic pulse propagation.
- High-tension tactical loop: passive hydrophone audio listening, predictive blind-firing with cavitation hit confirmation, and double-edged active ping risk/reward.
- Web Audio API graph specifications for resonant chirps, sub-bass hull thumps, and distance-based stereo echoes.
- Mobile/desktop UI specifications for the `SONAR (R)` action button and on-canvas hydrophone visualizer.
- Synergies with `HomingMissile` and shop progression (`Resonant Transducer`, `Acoustic Tagging Heads`).
- 100% architectural compliance with 600×800 logical canvas and zero source code modification.

## 5. Verification Method
To independently verify the deliverable:
1. Inspect the proposal file:
   `view_file` at `/Users/user/src/water-invader/.agents/swarm_d2_sonarblackout_3/report.md`
2. Verify that source code remained untouched:
   Confirm that zero changes were made to `.ts`, `.tsx`, or `.css` files under `/Users/user/src/water-invader/src/`.
3. Check section completeness:
   Verify that all 6 required sections (Concept & Hook, Mechanics & Math, Tactical Loop, Visuals & SFX, UI HUD Active Ping Button & Sonar Wave Visualizer, Synergies with Homing Missiles & Feasibility) are thoroughly elaborated with formulas and pseudo-code.

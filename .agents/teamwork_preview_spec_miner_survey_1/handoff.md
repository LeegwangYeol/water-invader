# Handoff Report: Specification Mining Survey for SpaceInvader (Water Invader)

**Date & Time:** 2026-08-21T08:12:00Z  
**Subagent Name:** teamwork_preview_spec_miner_survey_1  
**Archetype:** spec-miner  
**Parent Conversation ID:** 0367b0eb-028d-49d1-8c52-a16396e3ac6f  
**Working Directory:** C:\src\SpaceInvader\.agents\teamwork_preview_spec_miner_survey_1  
**Artifact Generated:** C:\src\SpaceInvader\.agents\teamwork_preview_spec_miner_survey_1\analysis.md  

---

## 1. Observation

Direct code inspections across src/ revealed the following exact files, lines, and behaviors:

### 1.1 UI & Controls
- **ALLY(Q) Button**:
  - File: src/components/game-canvas.tsx (Lines 201–209).
  - Code:
    `	sx
    <button 
      className={lex-1 rounded-xl text-xs font-bold text-white pointer-events-auto touch-none select-none }
      onPointerDown={handleTouchStart('q')}
      onPointerUp={handleTouchEnd('q')}
      onPointerLeave={handleTouchEnd('q')}
      onPointerCancel={handleTouchEnd('q')}
    >
      ALLY(Q)
    </button>
    `
  - Keyboard trigger: src/game/GameManager.ts (Lines 652–654): if (key === 'q') this.triggerSummonAlly();.
  - Mechanic: GameManager.ts (Lines 611–620): Costs 50 Pure Water (currency >= 50), triggers helper arrival within 0.1s (pendingReinforcement = 'ALLY', einforcementTimer = 0.1).
- **HUD Elements**:
  - Top HUD rendered via React (src/components/game-canvas.tsx Lines 156–185): Score (Line 158), Currency (Line 159), Wave (Line 161), HP 3-dot gauge (Lines 166–168), Combo multiplier (Lines 170–174), Ultimate 0–100% bar (Lines 176–184).
  - Overlay announcements rendered via 2D Canvas in GameManager.ts: Wave cleared banner (Lines 596–608), Warning banner (Lines 581–595), Debug overlay toggled via F3 (Lines 552–576).

### 1.2 Player Rendering
- **Cute Blue Water Droplet Vector Algorithm**:
  - File: src/game/Player.ts (Lines 120–240).
  - Shape definition: 100% vector Bezier path (moveTo(cx, cy - h - 10), ezierCurveTo(cx + w + 5, cy - h/2, cx + w + 5, cy + h, cx, cy + h), ezierCurveTo(cx - w - 5, cy + h, cx - w - 5, cy - h/2, cx, cy - h - 10)).
  - Radial gradient fill: Center (cx, cy + h/4) to radius Math.max(w, h) * 1.5. Normal colors #7dd3fc -> #0284c7; Stressed #f87171 -> #b91c1c; Suppressed #cbd5e1 -> #64748b.
  - Facial features: Dynamic eye expressions (normal ellipse + sparkles, angry >_< lines when stressLevel > 50, dizzy @_@ circles when suppressionLevel > 50).
  - Visual damage: Rotated band-aid at (cx + 10, cy - 10) when hp <= 2, red jagged crack lines when hp <= 1.

### 1.3 Enemy Vector Graphics
- **Enemy Types in src/game/Enemy.ts**:
  - NORMAL (#f97316 Orange, Lines 286–304): oundRect head + 3 vertical tentacles animated with Math.sin(Date.now()/200 + i) * 5 + 2 black eye rects.
  - SNIPER (#a855f7 Purple, Lines 216–232): Sleek inverted diamond/triangle vector polygon + black triangular optic sight.
  - DIVER (#ef4444 Red, Lines 232–245): Teardrop/missile Bezier curve + randomized yellow flame plume (#fbbf24).
  - SPLITTER (#22c55e Green, Lines 256–267): Two overlapping circular toxic cells (rc) + black nuclei.
  - BOSS (#dc2626 Dark Red, Lines 190–215): 150x100 oundRect body + 2 large black circular eye sockets + glowing red pupils (#ef4444) + 5 mouth grille bars.
  - ZIGZAG (#eab308 Yellow, Lines 246–255): 8-pointed rotating star polygon.
  - SHIELDED (#64748b Slate, Lines 268–285): Armored hexagon + cross seams + glowing blue shield bubble.

### 1.4 Wave Structure & Spawn Tables
- File: src/game/GameManager.ts (Lines 118–151).
- **Boss Wave**: Every 5th wave (level % 5 === 0), spawns single Boss with HP = level * 10.
- **Standard Waves**:
  - Rows: 3 + Math.floor(level / 4), Cols: 6 + Math.floor(level / 3).
  - Zigzags placed deterministically on row 1 even columns ( === 1 && c % 2 === 0).
  - Special pool: [SNIPER, SHIELDED, DIVER, SPLITTER] capped at maxSpecials = Math.max(1, Math.min(1 + Math.floor(level / 2), 4)), 15% lottery chance per slot (Math.random() > 0.85).
  - Speed scaling: Increases up to 3.0x as enemies are eliminated (speedMultiplier = Math.max(1.0, 1.0 + (20 - Math.min(20, enemies.length)) * 0.1)).

---

## 2. Logic Chain

1. **Premise 1**: The user requested a thorough specification mining of UI controls, player rendering, enemy vector representations, and wave spawn rules to prepare QA and automated testing agents.
2. **Step 1 (UI & Controls)**: Tracing game-canvas.tsx confirmed ALLY(Q) button presence in mobile controls and mapped keydown 'q' to GameManager.triggerSummonAlly(), requiring 50 Pure Water currency.
3. **Step 2 (Player Droplet)**: Tracing Player.ts:draw() proved the player has completely abandoned legacy pixel sprites in favor of a procedural Bezier droplet with radial gradient body, reflection ellipse, and dynamic emotion states.
4. **Step 3 (Enemy Graphics)**: Tracing Enemy.ts:draw() proved all 7 enemy classes use 100% canvas vector rendering routines without external image assets.
5. **Step 4 (Wave Spawning)**: Tracing GameManager.ts:spawnWave() derived the exact mathematical functions governing grid dimensions, boss appearance intervals, and special enemy distribution limits.
6. **Step 5 (Gap Identification)**: Analyzing GameManager.ts:checkCollisions() discovered that while Bullet.isInterceptable = true is set for Sniper bullets, no bullet-on-bullet collision logic exists, meaning Sniper bullets cannot currently be shot down by player bullets.

---

## 3. Caveats

- **No unauthorized edits**: Per system rules, no source code was modified during this survey.
- **Vercel Deployment Live Status**: The live deployment URL https://water-invader.vercel.app/ reflects the build compiled from the repository master branch.
- **Mobile Touch Directional Controls**: The mobile layout contains skill buttons (ALLY(Q), ULT, FIRE!), but directional movement (ArrowLeft/ArrowRight//d) on mobile currently relies on physical/virtual keyboard emulation.

---

## 4. Conclusion

The specification mining is 100% complete and fully verified from authoritative source code. All required details—including UI button definitions, canvas vector drawing paths, mathematics, and wave progression tables—have been compiled into nalysis.md. The orchestrator and testing agents can immediately use these exact parameters to construct targeted Playwright/Puppeteer and Chrome DevTools test suites.

---

## 5. Verification Method

To independently verify these findings:
1. Inspect the extracted analysis document:
   Get-Content -Path 'C:\src\SpaceInvader\.agents\teamwork_preview_spec_miner_survey_1\analysis.md'
2. Verify player droplet vector path in source:
   - Check C:\src\SpaceInvader\src\game\Player.ts lines 163–170 for Bezier curve calls.
3. Verify enemy vector drawing routines in source:
   - Check C:\src\SpaceInvader\src\game\Enemy.ts lines 169–308 for vector geometries of Normal, Sniper, Diver, Splitter, and Boss.
4. Verify ALLY(Q) mechanics in source:
   - Check C:\src\SpaceInvader\src\components\game-canvas.tsx lines 201–209 and C:\src\SpaceInvader\src\game\GameManager.ts lines 611–620.

# BRIEFING — 2026-09-03T14:24:00+09:00

## Mission
Exhaustively investigate UI layout, canvas scaling, and responsiveness across mobile and desktop viewports, touch controls, crisis warning rendering, and HUD stacking.

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, synthesis
- Working directory: /Users/user/src/water-invader/.agents/bughunt_exp_ui_responsive_1
- Original parent: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Milestone: UI layout, canvas scaling, and responsiveness deep dive

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify source code files
- Deliver findings in handoff.md and message parent

## Current Parent
- Conversation ID: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Updated: not yet

## Investigation State
- **Explored paths**:
  - src/components/game-canvas.tsx (co-locates MobileControls, TopHUD, MenuOverlay, ShopModal, GameOverModal, ManualModal, CanvasCore)
  - src/game/GameManager.ts (canvas sizing, resize(), 3-layer rendering pipeline, pause logic, drawBossHpBar)
  - src/game/crisis/CrisisSovereign.ts (drawBossHUD(), boss position and dimensions)
  - src/game/Bullet.ts (4-tier projectile rendering with black armor rim and white core)
  - src/app/page.tsx, src/app/layout.tsx, src/app/globals.css
  - tests/01_ui_and_controls.spec.ts, tests/14_responsive_warning_background_and_contrast.spec.ts, tests/15_endgame_crisis_12_archetypes.spec.ts, tests/mobile_controls_and_touch_evasion.spec.ts
- **Key findings**:
  1. Component co-location: mobile-controls.tsx and game-overlay.tsx do not exist as separate files; they are co-located in game-canvas.tsx.
  2. Canvas scaling & aspect ratio: aspect-[3/4] container correctly scales logical 600x800 canvas; subpixel border adds <0.6% deviation.
  3. Viewport vertical overflow: on iPhone SE (375x667) and MacBook 1440x900, page height exceeds viewport height (685px vs 667px, 1036px vs 900px), causing vertical scrolling.
  4. Mobile controls rendered on desktop: MobileControls has no responsive visibility filter (e.g. sm:hidden / md:hidden).
  5. Touch controls & gestures: Canvas has touch-none and setPointerCapture; however, globals.css lacks overscroll-behavior: none and layout.tsx lacks viewport export (maximumScale: 1, userScalable: false), risking pull-to-refresh and pinch zoom outside canvas.
  6. Mobile button sizing & layout: MobileControls clusters all buttons in left half (w-1/2); FIRE! button lacks vertical padding and computes to ~28px height, violating 44px touch target guidelines.
  7. Z-Index conflict: TopHUD (z-30) stacks above ShopModal and GameOverModal (z-20), causing mute button and score to hover over modal backdrop.
  8. Active badge positioning: endgame-crisis-active-badge at top-20 (80px) on mobile sits directly over Crisis Sovereign ship sprite ($Y \approx 143$ in 65-195 range).
  9. Pause system: GameManager.pause() freezes loop, but NO in-game pause button or visual pause overlay exists.
  10. Bullet occlusion: HTML warning banners (95% opacity bg-red-950/95) and Layer 3 canvas strokeText occlude bullets in center screen ($Y \approx 350-450$); solar flare in Layer 2 is drawn after bullets, occluding projectiles.
- **Unexplored areas**: None. All 4 target areas thoroughly analyzed with code inspection and Playwright verification.

## Key Decisions Made
- Confirmed WCAG contrast compliance of canvas Layer 1 background tint (passes >= 7:1) while identifying occlusion in React DOM Layer (95% opacity cards) and Layer 2 draw order (solar flares over bullets).
- Documented concrete recommendations with code diffs for subsequent implementation agents.

## Artifact Index
- handoff.md — Final responsive UI analysis report
- progress.md — Liveness heartbeat
- BRIEFING.md — Persistent working memory

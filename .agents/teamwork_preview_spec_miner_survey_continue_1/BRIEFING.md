# BRIEFING — 2026-09-07T15:50:00Z

## Mission
Investigate and document requirements R1 (Pre-Continue Shop Access) and R4 (Stability & Crash Prevention Verification) for Water Invader.

## 🔒 My Identity
- Archetype: spec_miner
- Roles: Teamwork specialist, specification miner
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_survey_continue_1
- Original parent: 38e78144-9abc-48a3-8a83-099f912ed48b
- Milestone: Survey Continue vs Shop Flow & Crash Prevention (R1 & R4)

## 🔒 Key Constraints
- Read-only: Do NOT implement anything.
- Always wait for explicit user approval before proceeding with implementation.
- Communicate with Claude via COLLABORATION.md.
- Send messages to parent (38e78144-9abc-48a3-8a83-099f912ed48b).
- Strictly follow Handoff Protocol with all 5 sections.

## Current Parent
- Conversation ID: 38e78144-9abc-48a3-8a83-099f912ed48b
- Updated: not yet

## Loaded Skills
- None

## Task Summary
- **What to build**: Specification mining report for Pre-Continue Shop Access and Crash Prevention
- **Success criteria**: Trace lifecycle of death, Game Over modal, continueGame, shop modal, upgrade purchasing, state persistence, failure modes, and crash risks. Produce authoritative handoff report.
- **Interface contracts**: /Users/user/src/water-invader/PROJECT.md
- **Code layout**: /Users/user/src/water-invader/PROJECT.md

## Key Decisions Made
- Discovered root blocker on HP repair: line 51 in `src/components/game-canvas.tsx` disables Tank Repair button when `hp <= 0`. On death, `hp` is 0, blocking HP purchase.
- Traced `continueGame()` vs `restartFromBeginning()`: `continueGame()` preserves level, score, currency, upgrades, and revives HP with `Math.max(3, hp)`.
- Designed 3-step Continue -> Shop -> Resume state machine: Continue button in GameOverModal sets `isContinueShop = true`, revives player baseline (hp >= 3), pauses loop, opens ShopModal. Action button in ShopModal calls `continueGame()` to resume wave.
- Mapped 8 distinct failure modes (FM-1 to FM-8) and provided concrete mitigations.
- Documented test harness impact on `continue_vs_restart_on_death.spec.ts`.
- Formatted and delivered complete 5-component report to `handoff.md`.

## Artifact Index
- handoff.md — Comprehensive specification and architecture report
- progress.md — Liveness heartbeat
- DISPATCH.md — Assignment and log

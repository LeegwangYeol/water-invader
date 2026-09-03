# BRIEFING — 2026-09-03T14:18:20+09:00

## Mission
Simulate and stress-test the UI across 5 viewports using Playwright to identify layout clipping, overflow, touch target interference, and banner bound defects.

## 🔒 My Identity
- Archetype: bughunt_chal_ui_responsive_1
- Roles: critic, specialist
- Working directory: /Users/user/src/water-invader/.agents/bughunt_chal_ui_responsive_1
- Original parent: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Milestone: bughunt_responsive_ui
- Instance: 1 of 1

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code
- Run build and tests to verify work product, report failures as findings — do NOT fix them yourself
- Empirically reproduce all bugs; do not trust unverified claims
- Always wait for explicit user approval before modifying code (strictly review/test only here)
- .agents/ holds only agent metadata (plans, progress, handoffs). NEVER place source code, tests, or data files here

## Current Parent
- Conversation ID: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Updated: not yet

## Review Scope
- **Files to review**: `tests/14_responsive_warning_background_and_contrast.spec.ts`, `src/app/*`, `src/components/*`
- **Interface contracts**: `PROJECT.md`, `COLLABORATION.md`, `ORIGINAL_REQUEST.md`
- **Review criteria**: Canvas dimensions & bounding client rects, horizontal scrollbar/page overflow, touch button hit areas vs player/bottom canvas boundary, in-game toast notifications & warning banner bounds across 5 viewports (375x667, 390x844, 412x915, 1440x900, 1920x1080).

## Attack Surface
- **Hypotheses tested**: [TBD]
- **Vulnerabilities found**: [TBD]
- **Untested angles**: [TBD]

## Loaded Skills
- None

## Key Decisions Made
- Initialized briefing and prepared reading mandatory context files.

## Artifact Index
- `/Users/user/src/water-invader/.agents/bughunt_chal_ui_responsive_1/DISPATCH.md` — Initial dispatch message
- `/Users/user/src/water-invader/.agents/bughunt_chal_ui_responsive_1/BRIEFING.md` — Persistent state
- `/Users/user/src/water-invader/.agents/bughunt_chal_ui_responsive_1/progress.md` — Progress tracker and heartbeat
- `/Users/user/src/water-invader/.agents/bughunt_chal_ui_responsive_1/handoff.md` — Final handoff report

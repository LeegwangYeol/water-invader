# BRIEFING — 2026-09-03T20:15:31+09:00

## Mission
Execute pre-commit and pre-push verification, stage changes, commit, and push the Major Late-Game Gameplay Update to remote.

## 🔒 My Identity
- Archetype: git_release_worker
- Roles: implementer, qa
- Working directory: /Users/user/src/water-invader/.agents/worker_lg_git_sync
- Original parent: 64f804cc-0c89-4eaf-b63c-7323a06289e4
- Milestone: Major Late-Game Gameplay Release

## 🔒 Key Constraints
- Strictly follow /Users/user/src/water-invader/.agents/rules/pre-commit-build.md: compile without any TypeScript or build errors before commit/push.
- Stage all modified and new project files and agent metadata.
- Clean git status after push.

## Current Parent
- Conversation ID: 64f804cc-0c89-4eaf-b63c-7323a06289e4
- Updated: not yet

## Task Summary
- **What to build**: Pre-commit verification (tsc, npm run build), git staging, commit, push, verify clean tree.
- **Success criteria**: 0 TS errors, clean build, successful git push, verified remote sync.
- **Interface contracts**: /Users/user/src/water-invader/COLLABORATION.md, /Users/user/src/water-invader/PROJECT.md
- **Code layout**: src/game, src/components, tests/

## Change Tracker
- **Files modified**: None yet (git release operations)
- **Build status**: Pending verification
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending verification
- **Lint status**: Pending
- **Tests added/modified**: Existing test suites verified in previous phase

## Loaded Skills
- None

## Key Decisions Made
- Proceed with verification commands first (tsc, build), then inspect git status, stage, commit, and push.

## Artifact Index
- /Users/user/src/water-invader/.agents/worker_lg_git_sync/DISPATCH.md — Dispatch instructions
- /Users/user/src/water-invader/.agents/worker_lg_git_sync/progress.md — Progress tracker
- /Users/user/src/water-invader/.agents/worker_lg_git_sync/handoff.md — Final handoff report

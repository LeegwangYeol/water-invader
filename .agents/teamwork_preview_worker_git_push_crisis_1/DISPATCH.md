## 2026-09-01T07:53:24Z
You are a teamwork_preview_worker performing the final pre-commit verification, Git commit, and Git push for the Water Invader project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_git_push_crisis_1

Read:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/.agents/rules/pre-commit-build.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work.

Your mission:
1. Verify pre-commit and pre-push build checks:
   - Run `npx tsc --noEmit` -> Must exit code 0.
   - Run `npm run build` -> Must succeed with 0 errors.
2. Check git status: `git status`.
3. Add modified and new files: `git add src/ tests/ scripts/ test-artifacts/ PROJECT.md TEST_READY.md COLLABORATION.md`.
4. Commit with descriptive message:
   `git commit -m "feat(crisis): introduce Stellaris-style End-Game Crisis system with Stage 15+ random incursions and empirical balance proofs"`
5. Push to remote: `git push origin main` (or `git push`).
6. Write your report to `/Users/user/src/water-invader/.agents/teamwork_preview_worker_git_push_crisis_1/report.md` and create `handoff.md`.
7. Send a message to caller with the git commit hash and push status.

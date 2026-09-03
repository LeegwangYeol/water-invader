## 2026-09-02T06:06:29Z
You are teamwork_preview_worker_git_commit_push.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_git_commit_push
Workspace Directory: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Pre-Commit Rule: /Users/user/src/water-invader/.agents/rules/pre-commit-build.md
Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md

Your mission:
1. Execute pre-commit & pre-push verification checks:
   - Run \`npx tsc --noEmit\`
   - Run \`npm run build\`
   - Run full unit tests: \`SKIP_WEBSERVER=1 npx playwright test tests/unit/\`
   - Run E2E test suite: \`npx playwright test tests/13_qol_and_crisis_mechanics.spec.ts\`
2. Verify all checks exit with 0 errors.
3. Check \`git status\` and \`git diff\`.
4. Stage all relevant source, test, and documentation changes:
   - \`src/\`
   - \`tests/\`
   - \`PROJECT.md\`
   - \`TEST_INFRA.md\`
   - \`TEST_READY.md\`
   - \`COLLABORATION.md\`
5. Commit with a clear, descriptive message:
   \`feat(qol): add acid rain counterplay, visual contrast enhancements, crisis variety, and pre-game shop access\`
6. Push the commit to the git remote branch (\`git push\`).
7. Verify \`git status\` is clean.
8. Maintain \`progress.md\`, write \`handoff.md\`, and notify orchestrator when done.

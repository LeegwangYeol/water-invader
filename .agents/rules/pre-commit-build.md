---
name: pre-commit-build-check
description: Enforce local build and type checking before committing and pushing code to Vercel/Next.js projects.
trigger: always_on
---
# Pre-Commit & Pre-Push Build Verification

**CRITICAL RULE:**
Before committing (git commit) and pushing (git push) code in this Next.js project, you **MUST ALWAYS** verify that the code compiles successfully without any TypeScript or build errors. Vercel will reject deployments if there are build errors.

**Actionable Steps:**
1. Whenever you modify .tsx, .ts, or configuration files, and plan to push the changes, first run: 
pm run build or 
px tsc --noEmit.
2. Wait for the command to finish and inspect the output.
3. If there are **any errors**, STOP. Do NOT commit or push. Fix the errors first, then re-run the build check.
4. Only when the build succeeds (or type-check passes with no errors), you may proceed to git commit and git push.


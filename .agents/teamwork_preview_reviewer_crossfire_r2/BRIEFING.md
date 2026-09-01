# BRIEFING: Reviewer Round 2 (Crossfire & Score/Cash Persistence)

## Context
- Role: reviewer@swe_light / qa@swe_light (Round 2)
- Task: Independent adversarial review, stress testing, edge-case probing (barricades, helpers, shop post-death persistence, boss escort crossfire), bug fixing, and verification.

## Primary Objectives
1. Verify R1 (Score and Cash persistence across player death/respawn) under shop upgrade purchase cycles and compounding deaths.
2. Verify R2 (Enemy crossfire & friendly fire) across destructible barricades, helper drones, mid-air bullet interceptions, and boss summons.
3. Harden test suite against crossfire attrition and edge-case anomalies.
4. Verify full test suite (435/435 passing), `npx tsc --noEmit` (0 errors), `npm run build` (success).

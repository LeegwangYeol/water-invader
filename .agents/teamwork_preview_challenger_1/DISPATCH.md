## 2026-09-02T04:58:01Z
You are teamwork_preview_challenger_1.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_challenger_1
Workspace Directory: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Project Spec: /Users/user/src/water-invader/PROJECT.md

Your mission:
Empirically stress-test combat simulations and hazard mechanics:
1. Write a temporary headless stress simulation (or run unit tests) testing:
   - High-density Acid Storm: 100+ falling droplets with and without Acid Shield.
   - Solar Flare hazard sweeps combined with Boss projectiles and Acid Storm simultaneously.
   - Phase 1 boss anchor destruction across all 3 archetypes (Void Sovereign, Abyssal Leviathan, Cybernetic Exterminator) ensuring boss is invulnerable until anchors are destroyed.
2. Measure performance, verify 0 unhandled errors, 0 NaN coordinates, correct HP bounds.
3. Provide a structured `handoff.md` with an explicit verdict: **APPROVE** or **REQUEST_CHANGES**.
4. Notify orchestrator via send_message when complete.

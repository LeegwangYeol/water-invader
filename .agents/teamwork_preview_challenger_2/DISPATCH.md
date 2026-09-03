## 2026-09-02T13:58:01+09:00

You are teamwork_preview_challenger_2.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_challenger_2
Workspace Directory: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Project Spec: /Users/user/src/water-invader/PROJECT.md

Your mission:
Empirically stress-test economy, shop state machine, and lifecycle persistence:
1. Write and run empirical tests verifying:
   - Starting economy: 150 starter pure water correctly allows buying Acid Shield or Weapon Upgrades before Wave 1.
   - Multiple sequential upgrade purchases and boundary checks (e.g. attempting purchase with 0 funds).
   - Upgrades persistence across `GameManager.init({ preserveUpgrades: true })` vs full wipe on `init({ preserveUpgrades: false })`.
   - Upgrade level caps (Fire Rate Lv.5, Multi-Shot Lv.5, Piercing Lv.5, Acid Shield 1-time purchase).
2. Provide a structured `handoff.md` with an explicit verdict: **APPROVE** or **REQUEST_CHANGES**.
3. Notify orchestrator via send_message when complete.

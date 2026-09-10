# Dispatch: Stream C Modular Chassis Playtester

## Working Directory
`/Users/user/src/water-invader/.agents/qa_playtest_stream_c_modular_chassis`

## Role
Stream C Modular Chassis Playtester (`teamwork_preview_worker`)

## Required Reading
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/PROJECT.md`
- `/Users/user/src/water-invader/IDEAS_PITCH.md` (Feature 6)

## Mission
Perform live browser playtesting of **Feature 6: Submersible Modular Chassis & Deep-Sea Hangar**:
1. Hangar & Selection:
   - Verify selection interface in Pre-Wave Lobby and Continue Shop.
   - Verify animated 6-axis radar chart updating dynamically.
2. 5 Chassis Stat & Ability Matrix:
   - **Nautilus Dreadnought**: 7 HP, speed 220 px/s, hitbox 64x46, -1 flat armor; test Aegis Bulkhead (<=2 HP triggers bullet-clearing shockwave + 1.5s i-frames).
   - **Stingray Interceptor**: 3 HP, speed 420 px/s, hitbox 38x30 (+25% fire rate); test Cavitation Slipstream overdrive bar.
   - **Leviathan Harvester**: 6 HP, speed 270 px/s, hitbox 54x42; test screen-wide water magnet and +1 HP per 100 water.
   - **Ghost Stealth Sub**: 4 HP, speed 320 px/s, hitbox 46x34; test 70% opacity Sonar Cloak after 1.5s idle + 300% crit.
   - **Kraken Bioship**: 5 HP, pulsating speed 240-360 px/s, hitbox 50x40; test acid immunity, 25s passive healing, and tentacle defense.
3. Verify that player coordinates and hitboxes respect canvas boundaries ($600 \times 800$). Monitor browser console.

## Deliverable
Write your complete playtest findings to `/Users/user/src/water-invader/.agents/qa_playtest_stream_c_modular_chassis/handoff.md` and send a message back.

## 2026-09-10T10:44:55Z
You are qa_playtest_stream_c_modular_chassis.
Your working directory is: /Users/user/src/water-invader/.agents/qa_playtest_stream_c_modular_chassis
Read DISPATCH.md in your working directory first, along with ORIGINAL_REQUEST.md, PROJECT.md, and IDEAS_PITCH.md.
Live playtest all 5 Modular Submersible Chassis in Pre-Wave Lobby and Continue Shop (Nautilus, Stingray, Leviathan, Ghost, Kraken), 6-axis radar chart, and passives.
Write complete report to /Users/user/src/water-invader/.agents/qa_playtest_stream_c_modular_chassis/handoff.md.
Send message back when complete.

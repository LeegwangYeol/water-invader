# Dispatch: Stream A Torpedo & Laser Playtester

## Working Directory
`/Users/user/src/water-invader/.agents/qa_playtest_stream_a_torpedo_laser`

## Role
Stream A Torpedo & Laser Playtester (`teamwork_preview_test_writer`)

## Required Reading
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/PROJECT.md`
- `/Users/user/src/water-invader/IDEAS_PITCH.md` (Features 1 & 2)

## Mission
Perform deep visual and interactive live playtesting of:
1. **Cavitation Torpedo**:
   - Tap `C` to launch, observe vapor envelope and micro-bubbles.
   - Test arming safety distance (<100px: 15 blunt damage, no detonation).
   - Tap `C` again in flight to trigger remote detonation.
   - Observe Phase 1 Singularity (0.00s-0.08s, 140px suction, audio ducking to 0.05 gain / 250Hz).
   - Observe Phase 2 Hyperbaric Shockwave (150px, 120-300 damage, vaporizing 100% of enemy bullets).
   - Check barricade sympathetic fracture when detonating <=85px from barricades.
2. **Prism Laser & Refraction Prisms**:
   - Hold `Space` / LMB: verify continuous 20Hz raycast damage.
   - Observe heat accumulation (+26 HU/s) up to 80-99 HU Supercharged state (+25% DPS, gold-cyan core).
   - Test 100 HU Lockout: 2.2s venting, -15% speed, white steam burst.
   - Deploy quartz refraction prism (`V`): verify 3-way beam split (-35°, 0°, +35°) with 190% total power.
3. Monitor the browser console for any errors or warnings. Run automated Playwright tests or write targeted test scenarios to execute these checks.

## Deliverable
Write your comprehensive playtest findings, console error log, and verification results to `/Users/user/src/water-invader/.agents/qa_playtest_stream_a_torpedo_laser/handoff.md` and send a message back to parent.

## 2026-09-10T10:44:54Z
Execute live playtesting of Cavitation Torpedo and Prism Laser & Refraction Prisms. Monitor browser console for errors.
Write complete report to /Users/user/src/water-invader/.agents/qa_playtest_stream_a_torpedo_laser/handoff.md.
Send message back when complete.


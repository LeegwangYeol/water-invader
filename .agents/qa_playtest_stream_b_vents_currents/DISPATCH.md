# Dispatch: Stream B Vents & Currents Playtester

## Working Directory
`/Users/user/src/water-invader/.agents/qa_playtest_stream_b_vents_currents`

## Role
Stream B Vents & Currents Playtester (`teamwork_preview_worker`)

## Required Reading
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/PROJECT.md`
- `/Users/user/src/water-invader/IDEAS_PITCH.md` (Feature 4)

## Mission
Perform live browser playtesting and visual verification of **Feature 4: Hydrothermal Vents & Ocean Currents**:
1. Conical Plume Geometry: verify vent anchors at seabed ($y=760$px, aperture 44px) and ascends to dissipation cap ($y=100$px).
2. Thermal Core Dynamics:
   - Player lingering in core takes 1 HP per 1.25s after a 0.5s grace window.
   - Hostiles in core suffer $28 + 0.06 \times \text{MaxHP}$ DPS.
3. Steam Lance Transformation: player bullets passing through core convert into Steam Lances (+35% damage, +1 pierce, speed -680 px/s).
4. Hostile Bullet Vaporization: descending enemy bullets in core enter counter-buoyancy ($a_y = -520$ px/s²) and dissolve into bubbles within 0.35s.
5. Convective Cooling Halo: player in outer halo receives +160 px/s buoyant lift and +250% weapon heat dissipation.
6. Ocean Currents: upper stratum ($y<400$) drifts East (+75 px/s), lower stratum ($y \ge 400$) drifts West (-60 px/s).
7. Monitor browser console for any warnings or errors.

## Deliverable
Write your complete playtest report to `/Users/user/src/water-invader/.agents/qa_playtest_stream_b_vents_currents/handoff.md` and send a message back.

## 2026-09-10T10:44:54Z
You are qa_playtest_stream_b_vents_currents.
Your working directory is: /Users/user/src/water-invader/.agents/qa_playtest_stream_b_vents_currents
Read DISPATCH.md in your working directory first, along with ORIGINAL_REQUEST.md, PROJECT.md, and IDEAS_PITCH.md.
Live playtest Hydrothermal Vents and Ocean Currents (core DoT, steam lance bullet transformation, convective cooling halo, stratified current drift).
Write complete report to /Users/user/src/water-invader/.agents/qa_playtest_stream_b_vents_currents/handoff.md.
Send message back when complete.


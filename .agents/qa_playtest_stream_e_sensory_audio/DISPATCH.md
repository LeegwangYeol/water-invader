# Dispatch: Stream E Sensory Audio Reviewer

## Working Directory
`/Users/user/src/water-invader/.agents/qa_playtest_stream_e_sensory_audio`

## Role
Stream E Sensory Audio Reviewer (`teamwork_preview_reviewer`)

## Required Reading
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/PROJECT.md`
- `/Users/user/src/water-invader/IDEAS_PITCH.md` (Feature 12)

## Mission
Live inspect and verify **Feature 12: Tactical Sonar Ping HUD, Hydrophone Spectrogram & Claustrophobic Stress FX**:
1. Polar Sonar Grid:
   - 5 dashed range rings at $R \in \{80, 160, 240, 320, 400\}$px.
   - Radial sweep line rotating once every 3.5s.
   - Echo blooms flare upon intersecting enemy hitboxes (18px, alpha 0.85 decaying over 400ms).
   - Acoustic detonation wavefront rings expand on explosions.
2. Hydrophone Spectrogram Waterfall:
   - 16-band real-time audio spectrum analyzer along HUD border driven by Web Audio `AnalyserNode`.
3. Claustrophobic Hull Stress FX:
   - Stress >50: vignetted chromatic aberration and low-frequency hull groans.
   - Stress >75: procedural glass fracture lines spiderweb across screen corners.
   - Damage at stress >80: 14px camera micro-shake with bubble trails.
4. Web Audio Lifecycle & Memory Leaks:
   - Verify that all `OscillatorNode` and `GainNode` instances are properly disconnected and garbage-collected after SFX playback. Zero node leaks.
5. Monitor console for audio warnings.

## Deliverable
Write your inspection report to `/Users/user/src/water-invader/.agents/qa_playtest_stream_e_sensory_audio/handoff.md` and send a message back.

## 2026-09-10T10:44:57Z
You are qa_playtest_stream_e_sensory_audio.
Your working directory is: /Users/user/src/water-invader/.agents/qa_playtest_stream_e_sensory_audio
Read DISPATCH.md in your working directory first, along with ORIGINAL_REQUEST.md, PROJECT.md, and IDEAS_PITCH.md.
Review Tactical Sonar HUD, 16-band Hydrophone Spectrogram, Hull Stress FX, and verify zero Web Audio node leaks.
Write complete report to /Users/user/src/water-invader/.agents/qa_playtest_stream_e_sensory_audio/handoff.md.
Send message back when complete.


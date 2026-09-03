## 2026-09-01T15:23:30+09:00
You are a teamwork_preview_explorer analyzing Milestone 1 (Audio Synthesis & Sound Effects) for the Water Invader End-Game Crisis.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_m1_2
Read:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/COLLABORATION.md

Your mission:
1. Inspect `src/game/SoundManager.ts` to see how Web Audio oscillators, gain nodes, and pitch envelopes are constructed.
2. Design the procedural Web Audio synthesis methods needed for the End-Game Crisis:
   - `playCrisisCataclysmSiren()`: 5-tone descending cataclysm alarm.
   - `playDarkMatterBeam()`: Low-frequency pulsating beam hum with harmonic distortion.
   - `playDimensionalRiftPulse()`: Ethereal warp modulation SFX.
   - `playSingularityCollapse()`: Deep sub-bass resonance and white-noise implosion sweep.
3. Ensure all Web Audio code is safe for headless/mock environments where AudioContext might be absent or mock-stubbed.
4. Write your analysis to /Users/user/src/water-invader/.agents/teamwork_preview_explorer_m1_2/analysis.md and create handoff.md.
5. Send a message to caller when complete.

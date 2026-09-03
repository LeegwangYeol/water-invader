# BRIEFING — 2026-09-03T14:20:00+09:00

## Mission
Adversarially stress-test audio and particle subsystems under extreme bursts, long-running simulations, and autoplay/mute constraints, gathering empirical benchmarks and profiling array growth.

## 🔒 My Identity
- Archetype: challenger
- Roles: critic, specialist
- Working directory: /Users/user/src/water-invader/.agents/bughunt_chal_audio_perf_1/
- Original parent: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Milestone: bughunt_audio_perf
- Instance: 1 of 1

## 🔒 Key Constraints
- Review-only / challenger: do NOT modify implementation code directly; write reproduction and stress harnesses to verify empirically.
- Write only to own directory (.agents/bughunt_chal_audio_perf_1/).
- Deliver handoff report to handoff.md and send completion message to parent.

## Current Parent
- Conversation ID: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Updated: 2026-09-03T14:20:00+09:00

## Review Scope
- **Files to review**: Audio manager (`src/utils/audio.ts` or similar), particle engine / game loop (`src/components/GameCanvas.tsx`, `src/game/*`), bullet management, floating text management.
- **Interface contracts**: PROJECT.md, ORIGINAL_REQUEST.md, COLLABORATION.md.
- **Review criteria**: No unhandled audio errors, FPS >= 30 under 200+ particle explosions & 100+ sfx burst, strict particle caps, zero unbounded array growth across 5,000 frames, resilient audio mute / autoplay handling.

## Key Decisions Made
- [Initial] Review mandatory documentation (ORIGINAL_REQUEST.md, COLLABORATION.md, PROJECT.md) and identify audio, particle, and entity management implementations.
- [Initial] Construct automated headless stress tests (using Vitest or Node / tsx) to simulate 200+ explosions, 100+ audio plays, and 5000 frames of game state.

## Attack Surface
- **Hypotheses tested**: [TBD]
- **Vulnerabilities found**: [TBD]
- **Untested angles**: Rapid audio spam, particle explosion floods, long simulation memory leak / array unbounded growth, audio context suspended / muted error handling.

## Loaded Skills
- None specified by orchestrator dispatch.

## Artifact Index
- /Users/user/src/water-invader/.agents/bughunt_chal_audio_perf_1/DISPATCH.md — Dispatch log
- /Users/user/src/water-invader/.agents/bughunt_chal_audio_perf_1/progress.md — Liveness heartbeat
- /Users/user/src/water-invader/.agents/bughunt_chal_audio_perf_1/handoff.md — Final handoff report
